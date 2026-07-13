using backend.Services.LogQuery;
using Elastic.Clients.Elasticsearch.QueryDsl;

namespace backend.Tests;

[TestClass]
public sealed class LogQueryCompilerTests
{
    [TestMethod]
    public void Compile_NullNode_ReturnsMatchAllQuery()
    {
        var query = LogQueryCompiler.Compile(null);

        Assert.IsTrue(query.TryGet<MatchAllQuery>(out _));
    }

    [TestMethod]
    public void Compile_FieldCriterion_ReturnsMatchQueryOnLevelField()
    {
        var query = LogQueryCompiler.Compile(new FieldCriterionNode("level", "warning"));

        Assert.IsTrue(query.TryGet<MatchQuery>(out var match));
        Assert.AreEqual("warning", match!.Query);
        Assert.AreEqual("Level", match.Field.ToString());
    }

    [TestMethod]
    public void Compile_PhraseCriterion_ReturnsMatchPhraseQueryOnMessageField()
    {
        var query = LogQueryCompiler.Compile(new PhraseCriterionNode("error occured"));

        Assert.IsTrue(query.TryGet<MatchPhraseQuery>(out var matchPhrase));
        Assert.AreEqual("error occured", matchPhrase!.Query);
        Assert.AreEqual("RenderedMessage", matchPhrase.Field.ToString());
    }

    [TestMethod]
    public void Compile_TermCriterion_ReturnsMatchQueryOnMessageField()
    {
        var query = LogQueryCompiler.Compile(new TermCriterionNode("timeout"));

        Assert.IsTrue(query.TryGet<MatchQuery>(out var match));
        Assert.AreEqual("timeout", match!.Query);
        Assert.AreEqual("RenderedMessage", match.Field.ToString());
    }

    [TestMethod]
    public void Compile_AndNode_ReturnsBoolQueryWithTwoMustClauses()
    {
        var query = LogQueryCompiler.Compile(new AndNode(
            new FieldCriterionNode("level", "warning"),
            new TermCriterionNode("timeout")));

        Assert.IsTrue(query.TryGet<BoolQuery>(out var boolQuery));
        Assert.AreEqual(2, boolQuery!.Must?.Count);
    }

    [TestMethod]
    public void Compile_OrNode_ReturnsBoolQueryWithTwoShouldClausesAndMinimumShouldMatch()
    {
        var query = LogQueryCompiler.Compile(new OrNode(
            new FieldCriterionNode("level", "warning"),
            new FieldCriterionNode("level", "error")));

        Assert.IsTrue(query.TryGet<BoolQuery>(out var boolQuery));
        Assert.AreEqual(2, boolQuery!.Should?.Count);
        Assert.IsNotNull(boolQuery.MinimumShouldMatch);
    }

    [TestMethod]
    public void Compile_NotNode_ReturnsBoolQueryWithMustNotClause()
    {
        var query = LogQueryCompiler.Compile(new NotNode(new FieldCriterionNode("level", "info")));

        Assert.IsTrue(query.TryGet<BoolQuery>(out var boolQuery));
        Assert.AreEqual(1, boolQuery!.MustNot?.Count);
    }

    [TestMethod]
    public void Compile_NestedExpression_BuildsCorrespondingNestedBoolQuery()
    {
        // (level:warning OR level:error) AND "error occured"
        var query = LogQueryCompiler.Compile(new AndNode(
            new OrNode(new FieldCriterionNode("level", "warning"), new FieldCriterionNode("level", "error")),
            new PhraseCriterionNode("error occured")));

        Assert.IsTrue(query.TryGet<BoolQuery>(out var boolQuery));
        var mustClauses = boolQuery!.Must!.ToList();
        Assert.AreEqual(2, mustClauses.Count);

        Assert.IsTrue(mustClauses[0].TryGet<BoolQuery>(out var orClause));
        Assert.AreEqual(2, orClause!.Should?.Count);

        Assert.IsTrue(mustClauses[1].TryGet<MatchPhraseQuery>(out var phraseClause));
        Assert.AreEqual("error occured", phraseClause!.Query);
    }
}
