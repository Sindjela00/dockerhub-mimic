using System.Text.Json.Serialization;
using backend.Services.LogQuery;
using Elastic.Clients.Elasticsearch;
using Elastic.Clients.Elasticsearch.QueryDsl;

namespace backend.Services;

public sealed record LogEntryResponse(DateTime Timestamp, string Level, string Message, double? Score);

public sealed record LogSearchResult(bool Succeeded, long Total, List<LogEntryResponse> Entries, string? ErrorMessage);

public interface ILogSearchService
{
    Task<LogSearchResult> SearchAsync(
        string? queryText,
        DateTime? from,
        DateTime? to,
        int page,
        int pageSize,
        CancellationToken cancellationToken);
}

public sealed class LogEntryDocument
{
    [JsonPropertyName("Timestamp")]
    public DateTime Timestamp { get; set; }

    [JsonPropertyName("Level")]
    public string Level { get; set; } = string.Empty;

    [JsonPropertyName("RenderedMessage")]
    public string? RenderedMessage { get; set; }

    [JsonPropertyName("MessageTemplate")]
    public string? MessageTemplate { get; set; }
}

public class LogSearchService : ILogSearchService
{
    private const string IndexPattern = "app-logs-*";

    private readonly ElasticsearchClient _client;

    public LogSearchService(ElasticsearchClient client)
    {
        _client = client;
    }

    public async Task<LogSearchResult> SearchAsync(
        string? queryText,
        DateTime? from,
        DateTime? to,
        int page,
        int pageSize,
        CancellationToken cancellationToken)
    {
        LogQueryNode? ast;
        try
        {
            ast = LogQueryParser.Parse(queryText);
        }
        catch (LogQueryParseException ex)
        {
            return new LogSearchResult(false, 0, [], ex.Message);
        }

        var compiledQuery = LogQueryCompiler.Compile(ast);
        var hasDateFilter = from.HasValue || to.HasValue;

        var finalQuery = compiledQuery;
        if (hasDateFilter)
        {
            finalQuery = new BoolQuery
            {
                Must = new List<Query> { compiledQuery },
                Filter = new List<Query>
                {
                    new DateRangeQuery("Timestamp")
                    {
                        Gte = from,
                        Lte = to
                    }
                }
            };
        }

        var safePage = Math.Max(1, page);
        var safePageSize = Math.Clamp(pageSize <= 0 ? 25 : pageSize, 1, 200);
        var hasTextQuery = ast is not null;

        var response = await _client.SearchAsync<LogEntryDocument>(s =>
        {
            s.Indices(IndexPattern);
            s.Query(finalQuery);
            s.From((safePage - 1) * safePageSize);
            s.Size(safePageSize);
            if (!hasTextQuery)
            {
                s.Sort(sort => sort.Field(f => f.Timestamp, sortField => sortField.Order(SortOrder.Desc)));
            }
        }, cancellationToken);

        if (!response.IsValidResponse)
        {
            return new LogSearchResult(false, 0, [], "Failed to reach Elasticsearch.");
        }

        var entries = response.Hits
            .Select(hit => new LogEntryResponse(
                hit.Source?.Timestamp ?? default,
                hit.Source?.Level ?? string.Empty,
                hit.Source?.RenderedMessage ?? string.Empty,
                hit.Score))
            .ToList();

        return new LogSearchResult(true, response.Total, entries, null);
    }
}
