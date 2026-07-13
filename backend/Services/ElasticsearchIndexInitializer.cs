using Elastic.Clients.Elasticsearch;
using Elastic.Clients.Elasticsearch.Mapping;

namespace backend.Services;

public class ElasticsearchIndexInitializer
{
    private const string TemplateName = "app-logs-template";
    private const string IndexPattern = "app-logs-*";

    private readonly ElasticsearchClient _client;
    private readonly ILogger<ElasticsearchIndexInitializer> _logger;

    public ElasticsearchIndexInitializer(ElasticsearchClient client, ILogger<ElasticsearchIndexInitializer> logger)
    {
        _client = client;
        _logger = logger;
    }

    public async Task EnsureLogIndexTemplateAsync(CancellationToken cancellationToken = default)
    {
        try
        {
            var mappings = new TypeMapping
            {
                Properties = new Properties
                {
                    { "Timestamp", new DateProperty() },
                    { "Level", new TextProperty() },
                    { "RenderedMessage", new TextProperty() },
                    { "MessageTemplate", new TextProperty() },
                    { "Exception", new TextProperty() }
                }
            };

            var response = await _client.Indices.PutIndexTemplateAsync(TemplateName, request =>
            {
                request.IndexPatterns(IndexPattern);
                request.Template(t => t.Mappings(mappings));
            }, cancellationToken);

            if (!response.IsValidResponse)
            {
                _logger.LogWarning(
                    "Failed to ensure Elasticsearch index template '{Template}': {Reason}",
                    TemplateName,
                    response.DebugInformation);
            }
        }
        catch (Exception ex)
        {
            _logger.LogWarning(
                ex,
                "Could not reach Elasticsearch to ensure the log index template. Log search will be unavailable until Elasticsearch is reachable.");
        }
    }
}
