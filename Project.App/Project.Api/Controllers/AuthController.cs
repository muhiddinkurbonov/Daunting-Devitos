using System.Security.Claims;
using Microsoft.AspNetCore.Authentication;
using Microsoft.AspNetCore.Authentication.Cookies;
using Microsoft.AspNetCore.Authentication.Google;
using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Mvc;

namespace Project.Api.Controllers;

[ApiController]
[Route("auth")]
public class AuthController : ControllerBase
{
    // GET /auth/login
    [HttpGet("login")]
    [AllowAnonymous]
    public IActionResult Login([FromQuery] string? returnUrl = null)
    {
        var safe =
            string.IsNullOrEmpty(returnUrl) || !Url.IsLocalUrl(returnUrl) ? "/swagger" : returnUrl; //used parameter return url otherwise to swagger

        if (User.Identity?.IsAuthenticated == true)
            return LocalRedirect(safe);

        var props = new AuthenticationProperties { RedirectUri = safe };
        props.SetParameter("prompt", "select_account"); // this checks the account picker regardless of what google stored in its whos logged in information

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
}
