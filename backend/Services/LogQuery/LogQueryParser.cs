namespace backend.Services.LogQuery;

public static class LogQueryParser
{
    private static readonly string[] SupportedFields = ["level"];

    public static LogQueryNode? Parse(string? input)
    {
        if (string.IsNullOrWhiteSpace(input))
        {
            return null;
        }

        var tokens = LogQueryTokenizer.Tokenize(input);
        var position = 0;

        LogQueryToken Current() => tokens[position];
        LogQueryToken Advance() => tokens[position++];

        LogQueryNode ParseOr()
        {
            var left = ParseAnd();
            while (Current().Type == LogQueryTokenType.Or)
            {
                Advance();
                var right = ParseAnd();
                left = new OrNode(left, right);
            }
            return left;
        }

        LogQueryNode ParseAnd()
        {
            var left = ParseNot();
            while (Current().Type == LogQueryTokenType.And)
            {
                Advance();
                var right = ParseNot();
                left = new AndNode(left, right);
            }
            return left;
        }

        LogQueryNode ParseNot()
        {
            if (Current().Type == LogQueryTokenType.Not)
            {
                Advance();
                return new NotNode(ParseNot());
            }
            return ParsePrimary();
        }

        LogQueryNode ParsePrimary()
        {
            var token = Current();

            if (token.Type == LogQueryTokenType.LParen)
            {
                Advance();
                var inner = ParseOr();
                if (Current().Type != LogQueryTokenType.RParen)
                {
                    throw new LogQueryParseException("Expected closing parenthesis ')'.");
                }
                Advance();
                return inner;
            }

            if (token.Type == LogQueryTokenType.String)
            {
                Advance();
                return new PhraseCriterionNode(token.Text);
            }

            if (token.Type == LogQueryTokenType.Word)
            {
                Advance();
                if (Current().Type == LogQueryTokenType.Colon)
                {
                    Advance();
                    var valueToken = Current();
                    if (valueToken.Type != LogQueryTokenType.Word && valueToken.Type != LogQueryTokenType.String)
                    {
                        throw new LogQueryParseException($"Expected a value after '{token.Text}:'.");
                    }
                    Advance();

                    var field = token.Text.ToLowerInvariant();
                    if (!SupportedFields.Contains(field))
                    {
                        throw new LogQueryParseException(
                            $"Unknown field '{token.Text}'. Supported fields: {string.Join(", ", SupportedFields)}.");
                    }

                    return new FieldCriterionNode(field, valueToken.Text);
                }
                return new TermCriterionNode(token.Text);
            }

            var description = token.Type == LogQueryTokenType.End ? "end of query" : $"'{token.Text}'";
            throw new LogQueryParseException($"Unexpected token: {description}.");
        }

        var result = ParseOr();
        if (Current().Type != LogQueryTokenType.End)
        {
            throw new LogQueryParseException($"Unexpected token: '{Current().Text}'.");
        }

        return result;
    }
}
