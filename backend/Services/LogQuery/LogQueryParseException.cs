namespace backend.Services.LogQuery;

public sealed class LogQueryParseException : Exception
{
    public LogQueryParseException(string message) : base(message)
    {
    }
}
