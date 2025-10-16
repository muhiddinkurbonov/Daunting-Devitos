using System.Net;

namespace Project.Api.Utilities;

/// <summary>
/// Base class for API exceptions with HTTP status codes.
/// Optionally, can include a detailed message or validation-style errors.
/// </summary>
public abstract class ApiException(
    string message,
    HttpStatusCode statusCode,
    IReadOnlyDictionary<string, string[]>? errors
) : Exception(message)
{
    public HttpStatusCode StatusCode { get; } = statusCode;

    /// <summary>
    /// An optional collection of validation-style errors.
    /// </summary>
    public IReadOnlyDictionary<string, string[]>? Errors { get; } = errors;

    /// <summary>
    /// Constructor for exceptions without detailed errors.
    /// </summary>
    protected ApiException(string message, HttpStatusCode statusCode)
        : this(message, statusCode, null) { }
}

/// <summary>
/// 400 Validation error
/// </summary>
public class ValidationException(IReadOnlyDictionary<string, string[]> errors)
    : ApiException("One or more validation errors occurred.", HttpStatusCode.BadRequest, errors) { }

/// <summary>
/// 400 Bad Request error
/// </summary>
public class BadRequestException(string message) : ApiException(message, HttpStatusCode.BadRequest);

/// <summary>
/// 404 Not Found error
/// </summary>
public class NotFoundException(string message) : ApiException(message, HttpStatusCode.NotFound);

/// <summary>
/// 409 Conflict error
/// </summary>
public class ConflictException(string message) : ApiException(message, HttpStatusCode.Conflict);

/// <summary>
/// 500 Internal Server Error
/// </summary>
public class InternalServerException(string message)
    : ApiException(message, HttpStatusCode.InternalServerError);
