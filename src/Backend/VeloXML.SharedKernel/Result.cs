namespace VeloXML.SharedKernel;

public class Result
{
    protected Result(bool isSuccess, ResultError error)
    {
        if (isSuccess && error != ResultError.None)
            throw new InvalidOperationException("Success result cannot have an error.");
        if (!isSuccess && error == ResultError.None)
            throw new InvalidOperationException("Failure result must have an error.");

        IsSuccess = isSuccess;
        Error = error;
    }

    public bool IsSuccess { get; }
    public bool IsFailure => !IsSuccess;
    public ResultError Error { get; }

    public static Result Success() => new(true, ResultError.None);
    public static Result Failure(ResultError error) => new(false, error);
    public static Result<T> Success<T>(T value) => new(value, true, ResultError.None);
    public static Result<T> Failure<T>(ResultError error) => new(default, false, error);
}

public class Result<T> : Result
{
    private readonly T? _value;

    protected internal Result(T? value, bool isSuccess, ResultError error)
        : base(isSuccess, error)
    {
        _value = value;
    }

    public T Value => IsSuccess
        ? _value!
        : throw new InvalidOperationException("Cannot access value of a failed result.");
}
