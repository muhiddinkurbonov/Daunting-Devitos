using Microsoft.AspNetCore.Authentication;
using Microsoft.AspNetCore.Authentication.Cookies;
using Microsoft.AspNetCore.Authentication.Google;
using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Mvc;
using Project.Api.Services.Interface;

namespace Project.Api.Controllers;

[ApiController]
[Route("auth")]
public class AuthController : ControllerBase
{
    private readonly ILogger<AuthController> _logger;
    private readonly IConfiguration _configuration;

    public AuthController(ILogger<AuthController> logger, IConfiguration configuration)
    {
        _logger = logger;
        _configuration = configuration;
    }

    // GET /auth/login
    [HttpGet("login")]
    [AllowAnonymous]
    public IActionResult Login([FromQuery] string? returnUrl = null)
    {
        _logger.LogInformation("[AUTH] Login called with returnUrl: {ReturnUrl}", returnUrl);

        // Allow frontend URLs from configuration
        var allowedOrigins =
            _configuration.GetSection("CorsSettings:AllowedOrigins").Get<string[]>()
            ?? Array.Empty<string>();
        var safe = "/swagger"; // default fallback

        if (!string.IsNullOrEmpty(returnUrl))
        {
            // Check if returnUrl is a local path or starts with an allowed origin
            if (
                Url.IsLocalUrl(returnUrl)
                || allowedOrigins.Any(origin => returnUrl.StartsWith(origin))
            )
            {
                safe = returnUrl;
                _logger.LogInformation("[AUTH] returnUrl accepted: {Safe}", safe);
            }
            else
            {
                _logger.LogWarning("[AUTH] returnUrl rejected, using fallback: {Safe}", safe);
            }
        }
        else
        {
            _logger.LogInformation("[AUTH] No returnUrl provided, using fallback: {Safe}", safe);
        }

        if (User.Identity?.IsAuthenticated == true)
        {
            _logger.LogInformation(
                "[AUTH] User already authenticated, redirecting to: {Safe}",
                safe
            );
            return Redirect(safe);
        }

        var props = new AuthenticationProperties { RedirectUri = safe };
        props.SetParameter("prompt", "select_account");

        _logger.LogInformation("[AUTH] Challenging with RedirectUri: {Safe}", safe);
        return Challenge(props, GoogleDefaults.AuthenticationScheme);
    }

    // POST /auth/logout
    [HttpPost("logout")]
    [AllowAnonymous]
    public async Task<IActionResult> Logout()
    {
        await HttpContext.SignOutAsync(CookieAuthenticationDefaults.AuthenticationScheme);
        return Ok(new { message = "Logged out" });
    }

    // GET /auth/me
    [HttpGet("me")]
    [Authorize]
    public IActionResult Me()
    {
        var user = HttpContext.User;
        return Ok(
            new
            {
                name = user.Identity?.Name,
                claims = user.Claims.Select(c => new { c.Type, c.Value }),
            }
        );
    }

    // POST /auth/debug/create-user - Temporary debug endpoint
    [HttpPost("debug/create-user")]
    [AllowAnonymous]
    public async Task<IActionResult> DebugCreateUser(
        [FromBody] CreateUserDebugRequest request,
        [FromServices] IUserService userService
    )
    {
        _logger.LogInformation("Debug: Creating/finding user with email {Email}", request.Email);

        try
        {
            // Try to find existing user
            var existingUser = await userService.GetByEmailAsync(request.Email);
            if (existingUser != null)
            {
                _logger.LogInformation("Debug: User already exists with ID {UserId}", existingUser.Id);
                return Ok(new { message = "User already exists", user = existingUser });
            }

            // Create new user
            var user = await userService.UpsertGoogleUserByEmailAsync(
                request.Email,
                request.Name ?? request.Email,
                null
            );

            _logger.LogInformation("Debug: User created with ID {UserId}", user.Id);
            return Ok(new { message = "User created", user });
        }
        catch (Exception ex)
        {
            _logger.LogError(ex, "Debug: Error creating user");
            return StatusCode(500, new { error = ex.Message });
        }
    }
}

public record CreateUserDebugRequest(string Email, string? Name);
