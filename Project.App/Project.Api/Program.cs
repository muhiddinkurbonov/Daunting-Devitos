using Microsoft.AspNetCore.Authentication.Cookies;
using Microsoft.AspNetCore.Authentication.Google;
using Microsoft.EntityFrameworkCore;
using Project.Api.Data;
using Project.Api.Repositories;
using Project.Api.Repositories.Interface;
using Project.Api.Services;
using Project.Api.Services.Interface;
using Project.Api.Utilities.Middleware;
using Serilog;

namespace Project.Api;

public class Program
{
    public static void Main(string[] args)
    {
        var builder = WebApplication.CreateBuilder(args);

        // Load configuration from multiple sources (in order of precedence):
        // 1. appsettings.json (base configuration)
        // 2. appsettings.{Environment}.json (environment-specific)
        // 3. adminsetting.json (optional admin overrides)
        // 4. Environment variables (highest priority, can override anything)
        // 5. User secrets (for local development only)
        builder.Configuration.AddJsonFile(
            "adminsetting.json",
            optional: true,
            reloadOnChange: true
        );
        builder.Configuration.AddEnvironmentVariables(prefix: "DAUNTING_");

        // Configure Serilog with environment-aware settings
        Log.Logger = new LoggerConfiguration()
            .ReadFrom.Configuration(builder.Configuration)
            .Enrich.FromLogContext()
            .Enrich.WithProperty("Environment", builder.Environment.EnvironmentName)
            .WriteTo.Console(
                outputTemplate: "[{Timestamp:HH:mm:ss} {Level:u3}] {Message:lj} {Properties:j}{NewLine}{Exception}"
            )
            .CreateLogger();

        builder.Host.UseSerilog();

        // use extension methods to configure services
        builder.Services.AddDatabase(builder.Configuration);
        builder.Services.AddApplicationServices();
        builder.Services.AddCorsPolicy(builder.Configuration);
        builder.Services.AddAuth(builder.Configuration, builder.Environment);

        builder.Services.AddControllers();
        builder.Services.AddOpenApi();
        builder.Services.AddEndpointsApiExplorer();
        builder.Services.AddSwaggerGen();
        builder.Services.AddHealthChecks();

        var app = builder.Build();

        app.UseMiddleware<GlobalExceptionHandler>();

        // Health check endpoint (useful for monitoring and load balancers)
        app.MapHealthChecks("/health");

        // Configure the HTTP request pipeline.
        if (app.Environment.IsDevelopment())
        {
            app.MapOpenApi();
            app.UseSwagger();
            app.UseSwaggerUI();
        }

        app.UseCors(ProgramExtensions.CorsPolicy); // Enable CORS with our policy
        app.UseHttpsRedirection();
        app.UseAuthentication();
        app.UseAuthorization();
        app.MapControllers();

        app.Run();
    }
}

public static class ProgramExtensions
{
    public const string CorsPolicy = "FrontendCors";

    /// <summary>
    /// Applies the configuration for the CORS policy.
    /// </summary>
    public static IServiceCollection AddCorsPolicy(
        this IServiceCollection services,
        IConfiguration configuration
    )
    {
        services.AddCors(options =>
        {
            options.AddPolicy(
                CorsPolicy,
                policy =>
                {
                    var allowedOrigins =
                        configuration.GetSection("CorsSettings:AllowedOrigins").Get<string[]>()
                        ?? new[] { "http://localhost:3000" };

                    policy
                        .WithOrigins(allowedOrigins) // Read from configuration
                        .AllowAnyHeader()
                        .AllowAnyMethod()
                        .AllowCredentials(); // Required for cookies
                }
            );
        });
        return services;
    }

    /// <summary>
    /// Registers the database.
    /// </summary>
    public static IServiceCollection AddDatabase(
        this IServiceCollection services,
        IConfiguration configuration
    )
    {
        services.AddDbContext<AppDbContext>(options =>
            options.UseSqlServer(configuration.GetConnectionString("DefaultConnection"))
        );
        return services;
    }

    /// <summary>
    /// Registers the services and repositories used by the application.
    /// </summary>
    public static IServiceCollection AddApplicationServices(this IServiceCollection services)
    {
        // scoped services
        services.AddScoped<IBlackjackService, BlackjackService>();
        services.AddScoped<IHandService, HandService>();
        services.AddScoped<IRoomService, RoomService>();
        services.AddScoped<IUserService, UserService>();

        // singleton services
        services.AddHttpClient<IDeckApiService, DeckApiService>();
        services.AddSingleton<IRoomSSEService, RoomSSEService>();
        services.AddHostedService<SSEShutdownService>();

        // scoped repositories
        services.AddScoped<IHandRepository, HandRepository>();
        services.AddScoped<IRoomPlayerRepository, RoomPlayerRepository>();
        services.AddScoped<IRoomRepository, RoomRepository>();
        services.AddScoped<IUserRepository, UserRepository>();

        // automapper!!!
        services.AddAutoMapper(typeof(Program));

        return services;
    }

    /// <summary>
    /// Configures and registers the authentication services.
    /// </summary>
    public static IServiceCollection AddAuth(
        this IServiceCollection services,
        IConfiguration configuration,
        IWebHostEnvironment environment
    )
    {
        // Validate required OAuth configuration
        if (!environment.IsEnvironment("Testing"))
        {
            var gid = configuration["Google:ClientId"];
            var gsec = configuration["Google:ClientSecret"];

            // Allow environment variables to override config file
            // e.g., DAUNTING_Google__ClientId, DAUNTING_Google__ClientSecret
            if (string.IsNullOrWhiteSpace(gid) || string.IsNullOrWhiteSpace(gsec))
            {
                throw new InvalidOperationException(
                    "Google OAuth config missing. Set Google:ClientId and Google:ClientSecret in "
                        + "appsettings.json, user secrets, or environment variables (DAUNTING_Google__ClientId, DAUNTING_Google__ClientSecret)."
                );
            }
            Log.Information(
                "Google OAuth configured. ClientId (first 8): {ClientId}",
                gid?.Length >= 8 ? gid[..8] : gid
            );
        }

        // Google OAuth
        services
            .AddAuthentication(options =>
            {
                // where the app reads identity from on each request
                options.DefaultScheme = CookieAuthenticationDefaults.AuthenticationScheme;
                // how the app prompts an unauthenticated user to log in
                options.DefaultChallengeScheme = GoogleDefaults.AuthenticationScheme;
            })
            .AddCookie(cookie =>
            {
                // cross-site cookie SPA on :3000 to API on :7069
                cookie.Cookie.SameSite = SameSiteMode.None;
                // browsers require Secure when SameSite=None this is why we need https instead of http
                cookie.Cookie.SecurePolicy = CookieSecurePolicy.Always;

                // for APIs return status codes instead of 302 redirects
                cookie.Events = new CookieAuthenticationEvents
                {
                    OnRedirectToLogin = ctx =>
                    {
                        ctx.Response.StatusCode = 401;
                        return Task.CompletedTask;
                    },
                    OnRedirectToAccessDenied = ctx =>
                    {
                        ctx.Response.StatusCode = 403;
                        return Task.CompletedTask;
                    },
                };
            })
            .AddGoogle(options =>
            {
                options.ClientId = configuration["Google:ClientId"]!; //  from secrets / config
                options.ClientSecret = configuration["Google:ClientSecret"]!; //  from secrets / config
                options.CallbackPath = "/auth/google/callback"; //  google redirects here after login if we change this we need to change it on google cloud as well!
                options.Events = new Microsoft.AspNetCore.Authentication.OAuth.OAuthEvents
                {
                    OnCreatingTicket = async ctx =>
                    {
                        var logger = ctx.HttpContext.RequestServices.GetRequiredService<
                            ILogger<Program>
                        >();
                        logger.LogInformation(
                            "[OAuth] OnCreatingTicket fired - processing Google login"
                        );

                        try
                        {
                            var email = ctx.User.GetProperty("email").GetString();
                            var verified =
                                ctx.User.TryGetProperty("email_verified", out var ev)
                                && ev.GetBoolean();
                            var name = ctx.User.TryGetProperty("name", out var n)
                                ? n.GetString()
                                : null;
                            var picture = ctx.User.TryGetProperty("picture", out var p)
                                ? p.GetString()
                                : null;

                            logger.LogInformation(
                                "[OAuth] Email: {Email}, Verified: {Verified}, Name: {Name}",
                                email,
                                verified,
                                name
                            );

                            if (string.IsNullOrWhiteSpace(email) || !verified)
                            {
                                logger.LogWarning(
                                    "[OAuth] Email validation failed - Email: {Email}, Verified: {Verified}",
                                    email,
                                    verified
                                );
                                ctx.Fail("Google email must be present and verified.");
                                return;
                            }

                            var svc =
                                ctx.HttpContext.RequestServices.GetRequiredService<IUserService>();
                            logger.LogInformation(
                                "[OAuth] Calling UpsertGoogleUserByEmailAsync for {Email}",
                                email
                            );
                            await svc.UpsertGoogleUserByEmailAsync(email, name, picture);
                            logger.LogInformation(
                                "[OAuth] Successfully upserted user for {Email}",
                                email
                            );
                        }
                        catch (Exception ex)
                        {
                            logger.LogError(
                                ex,
                                "[OAuth] Error in OnCreatingTicket: {Message}",
                                ex.Message
                            );
                            throw;
                        }
                    },
                };
            });

        services.AddAuthorization();

        return services;
    }
}
