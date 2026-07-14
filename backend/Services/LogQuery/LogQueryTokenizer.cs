namespace backend.Services.LogQuery;

public enum LogQueryTokenType
{
    LParen,
    RParen,
    Colon,
    And,
    Or,
    Not,
    String,
    Word,
    End
}

public sealed record LogQueryToken(LogQueryTokenType Type, string Text);

public static class LogQueryTokenizer
{
    public static List<LogQueryToken> Tokenize(string input)
    {
        var tokens = new List<LogQueryToken>();
        var i = 0;

        while (i < input.Length)
        {
            var c = input[i];

            if (char.IsWhiteSpace(c))
            {
                i++;
                continue;
            }

            if (c == '(')
            {
                tokens.Add(new LogQueryToken(LogQueryTokenType.LParen, "("));
                i++;
                continue;
            }

            if (c == ')')
            {
                tokens.Add(new LogQueryToken(LogQueryTokenType.RParen, ")"));
                i++;
                continue;
            }

            if (c == ':')
            {
                tokens.Add(new LogQueryToken(LogQueryTokenType.Colon, ":"));
                i++;
                continue;
            }

            if (c == '"')
            {
                var closingIndex = input.IndexOf('"', i + 1);
                if (closingIndex < 0)
                {
                    throw new LogQueryParseException("Unterminated quoted string.");
                }

                var text = input.Substring(i + 1, closingIndex - i - 1);
                tokens.Add(new LogQueryToken(LogQueryTokenType.String, text));
                i = closingIndex + 1;
                continue;
            }

            var start = i;
            while (i < input.Length
                   && !char.IsWhiteSpace(input[i])
                   && input[i] != '(' && input[i] != ')' && input[i] != ':' && input[i] != '"')
            {
                i++;
            }

            var word = input[start..i];
            tokens.Add(word.ToUpperInvariant() switch
            {
                "AND" => new LogQueryToken(LogQueryTokenType.And, word),
                "OR" => new LogQueryToken(LogQueryTokenType.Or, word),
                "NOT" => new LogQueryToken(LogQueryTokenType.Not, word),
                _ => new LogQueryToken(LogQueryTokenType.Word, word)
            });
        }

        tokens.Add(new LogQueryToken(LogQueryTokenType.End, string.Empty));
        return tokens;
    }
}
