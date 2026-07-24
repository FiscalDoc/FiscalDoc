namespace VeloXML.SharedKernel;

public sealed record ResultError(string Code, string Description)
{
    public static readonly ResultError None = new(string.Empty, string.Empty);
    public static readonly ResultError NullValue = new("NULL_VALUE", "A null value was provided.");

    public static ResultError NotFound(string resource) =>
        new($"{resource.ToUpper()}_NOT_FOUND", $"{resource} not found.");

    public static ResultError Conflict(string resource) =>
        new($"{resource.ToUpper()}_CONFLICT", $"{resource} already exists.");

    public static ResultError Unauthorized(string message = "Unauthorized access.") =>
        new("UNAUTHORIZED", message);

    public static ResultError Validation(string field, string message) =>
        new($"VALIDATION_{field.ToUpper()}", message);

    public static ResultError BadRequest(string message) =>
        new("BAD_REQUEST", message);
}
