using Microsoft.AspNetCore.Mvc;
using Microsoft.EntityFrameworkCore.Metadata;
using Project.Api.Models;
using Project.Api.Repositories;
using Project.Api.Services;
using Project.DTOs;
using Serilog;

namespace Project.Api.Controllers
{
    public class ExampleController : ControllerBase
    {
        public ExampleController() { }
    }
}
