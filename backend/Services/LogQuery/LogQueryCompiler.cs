using Elastic.Clients.Elasticsearch.QueryDsl;

namespace backend.Services.LogQuery;

public static class LogQueryCompiler
{
    private const string LevelField = "Level";
    private const string MessageField = "RenderedMessage";

    public static Query Compile(LogQueryNode? node)
    {
        if (node is null)
        {
            return new MatchAllQuery();
        }

        return node switch
        {
            AndNode and => new BoolQuery
            {
                Must = new List<Query> { Compile(and.Left), Compile(and.Right) }
            },
            OrNode or => new BoolQuery
            {
                Should = new List<Query> { Compile(or.Left), Compile(or.Right) },
                MinimumShouldMatch = 1
            },
            NotNode not => new BoolQuery
            {
                MustNot = new List<Query> { Compile(not.Operand) }
            },
            FieldCriterionNode field => new MatchQuery(LevelField)
            {
                Query = field.Value
            },
            PhraseCriterionNode phrase => new MatchPhraseQuery(MessageField)
            {
                Query = phrase.Text
            },
            TermCriterionNode term => new MatchQuery(MessageField)
            {
                Query = term.Text
            },
            _ => throw new NotSupportedException($"Unsupported query node type '{node.GetType().Name}'.")
        };
    }
}
