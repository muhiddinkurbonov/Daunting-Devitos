using System.Text;
using AutoMapper;
using Microsoft.EntityFrameworkCore;
using Project.Data;
using Project.Repositories;
using Project.Services;
using Serilog;

namespace Project.Api;

public class Program
{
    public static void Main(string[] args)
    {
        var builder = WebApplication.CreateBuilder(args);

        builder.Configuration.AddJsonFile(
            "adminsetting.json",
            optional: true,
            reloadOnChange: true
        );

        Log.Logger = new LoggerConfiguration()
            .MinimumLevel.Debug()
            .WriteTo.Console()
            .CreateLogger();

        builder.Host.UseSerilog();

        builder.Services.AddControllers();
        builder.Services.AddOpenApi();
        builder.Services.AddEndpointsApiExplorer();
        builder.Services.AddSwaggerGen();

        //Auto Mapper
        builder.Services.AddAutoMapper(typeof(Program));

        builder.Services.AddAuthorization();

        var connectionString = builder.Configuration.GetConnectionString("DefaultConnection");

        builder.Services.AddDbContext<AppDbContext>(options =>
            options.UseSqlServer(connectionString)
        );

        var app = builder.Build();

        app.MapGet(
            "/string",
            () =>
            {
                var CS = builder.Configuration.GetConnectionString("DefaultConnection");
                return Results.Ok(CS);
            }
        );

        // Configure the HTTP request pipeline.
        if (app.Environment.IsDevelopment())
        {
            app.MapOpenApi();
            app.UseSwagger();
            app.UseSwaggerUI();
        }

        app.UseHttpsRedirection();
        app.UseAuthentication();
        app.UseAuthorization();
        app.MapControllers();

        app.Run();
    }
}
