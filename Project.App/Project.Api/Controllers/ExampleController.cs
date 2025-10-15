using Microsoft.AspNetCore.Mvc;
using Microsoft.EntityFrameworkCore.Metadata;
using Project.DTOs;
using Project.Api.Models;
using Project.Api.Repositories;
using Project.Api.Services;
using Serilog;

namespace Project.Api.Controllers
{
    public class ExampleController : ControllerBase
    {
        public ExampleController() { }
    }
}
