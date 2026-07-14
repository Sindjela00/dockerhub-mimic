using backend.Services.LogQuery;

namespace backend.Tests;

[TestClass]
public sealed class LogQueryParserTests
{
    [TestMethod]
    public void Parse_EmptyOrWhitespaceInput_ReturnsNull()
    {
        Assert.IsNull(LogQueryParser.Parse(null));
        Assert.IsNull(LogQueryParser.Parse(""));
        Assert.IsNull(LogQueryParser.Parse("   "));
    }

    [TestMethod]
    public void Parse_FieldCriterion_ReturnsFieldCriterionNode()
    {
        var node = LogQueryParser.Parse("level:warning");

        var criterion = node as FieldCriterionNode;
        Assert.IsNotNull(criterion);
        Assert.AreEqual("level", criterion.Field);
        Assert.AreEqual("warning", criterion.Value);
    }

    [TestMethod]
    public void Parse_FieldCriterionIsCaseInsensitiveForFieldName()
    {
        var node = LogQueryParser.Parse("LEVEL:warning");

        var criterion = node as FieldCriterionNode;
        Assert.IsNotNull(criterion);
        Assert.AreEqual("level", criterion.Field);
    }

    [TestMethod]
    public void Parse_QuotedPhrase_ReturnsPhraseCriterionNode()
    {
        var node = LogQueryParser.Parse("\"error occured\"");

        var phrase = node as PhraseCriterionNode;
        Assert.IsNotNull(phrase);
        Assert.AreEqual("error occured", phrase.Text);
    }

    [TestMethod]
    public void Parse_BareWord_ReturnsTermCriterionNode()
    {
        var node = LogQueryParser.Parse("timeout");

        var term = node as TermCriterionNode;
        Assert.IsNotNull(term);
        Assert.AreEqual("timeout", term.Text);
    }

    [TestMethod]
    public void Parse_AndExpression_ReturnsAndNode()
    {
        var node = LogQueryParser.Parse("level:warning AND timeout");

        var and = node as AndNode;
        Assert.IsNotNull(and);
        Assert.IsInstanceOfType<FieldCriterionNode>(and.Left);
        Assert.IsInstanceOfType<TermCriterionNode>(and.Right);
    }

    [TestMethod]
    public void Parse_OrExpression_ReturnsOrNode()
    {
        var node = LogQueryParser.Parse("level:warning OR level:error");

        var or = node as OrNode;
        Assert.IsNotNull(or);
        Assert.IsInstanceOfType<FieldCriterionNode>(or.Left);
        Assert.IsInstanceOfType<FieldCriterionNode>(or.Right);
    }

    [TestMethod]
    public void Parse_NotExpression_ReturnsNotNode()
    {
        var node = LogQueryParser.Parse("NOT level:info");

        var not = node as NotNode;
        Assert.IsNotNull(not);
        Assert.IsInstanceOfType<FieldCriterionNode>(not.Operand);
    }

    [TestMethod]
    public void Parse_OperatorsAreCaseInsensitive()
    {
        var node = LogQueryParser.Parse("level:warning and level:error");

        Assert.IsInstanceOfType<AndNode>(node);
    }

    [TestMethod]
    public void Parse_ParenthesesOverrideDefaultPrecedence()
    {
        var node = LogQueryParser.Parse("(level:warning OR level:error) AND \"error occured\"");

        var and = node as AndNode;
        Assert.IsNotNull(and);
        Assert.IsInstanceOfType<OrNode>(and.Left);
        Assert.IsInstanceOfType<PhraseCriterionNode>(and.Right);
    }

    [TestMethod]
    public void Parse_WithoutParentheses_AndBindsTighterThanOr()
    {
        // level:warning OR (level:error AND "x")  -- AND has higher precedence than OR
        var node = LogQueryParser.Parse("level:warning OR level:error AND \"x\"");

        var or = node as OrNode;
        Assert.IsNotNull(or);
        Assert.IsInstanceOfType<FieldCriterionNode>(or.Left);

        var and = or.Right as AndNode;
        Assert.IsNotNull(and);
        Assert.IsInstanceOfType<FieldCriterionNode>(and.Left);
        Assert.IsInstanceOfType<PhraseCriterionNode>(and.Right);
    }

    [TestMethod]
    public void Parse_NotBindsTighterThanAnd()
    {
        // NOT level:info AND level:error -> (NOT level:info) AND level:error
        var node = LogQueryParser.Parse("NOT level:info AND level:error");

        var and = node as AndNode;
        Assert.IsNotNull(and);
        Assert.IsInstanceOfType<NotNode>(and.Left);
        Assert.IsInstanceOfType<FieldCriterionNode>(and.Right);
    }

    [TestMethod]
    public void Parse_NestedParentheses_ParsesCorrectly()
    {
        var node = LogQueryParser.Parse("((level:error))");

        Assert.IsInstanceOfType<FieldCriterionNode>(node);
    }

    [TestMethod]
    public void Parse_UnknownField_ThrowsParseException()
    {
        var ex = Assert.ThrowsExactly<LogQueryParseException>(() => LogQueryParser.Parse("host:server1"));
        StringAssert.Contains(ex.Message, "Unknown field");
    }

    [TestMethod]
    public void Parse_UnbalancedOpeningParenthesis_ThrowsParseException()
    {
        Assert.ThrowsExactly<LogQueryParseException>(() => LogQueryParser.Parse("(level:warning"));
    }

    [TestMethod]
    public void Parse_UnbalancedClosingParenthesis_ThrowsParseException()
    {
        Assert.ThrowsExactly<LogQueryParseException>(() => LogQueryParser.Parse("level:warning)"));
    }

    [TestMethod]
    public void Parse_EmptyParentheses_ThrowsParseException()
    {
        Assert.ThrowsExactly<LogQueryParseException>(() => LogQueryParser.Parse("()"));
    }

    [TestMethod]
    public void Parse_OperatorWithMissingRightOperand_ThrowsParseException()
    {
        Assert.ThrowsExactly<LogQueryParseException>(() => LogQueryParser.Parse("level:warning AND"));
    }

    [TestMethod]
    public void Parse_NotWithMissingOperand_ThrowsParseException()
    {
        Assert.ThrowsExactly<LogQueryParseException>(() => LogQueryParser.Parse("NOT"));
    }

    [TestMethod]
    public void Parse_FieldWithoutValue_ThrowsParseException()
    {
        Assert.ThrowsExactly<LogQueryParseException>(() => LogQueryParser.Parse("level:"));
    }

    [TestMethod]
    public void Parse_UnterminatedQuotedString_ThrowsParseException()
    {
        Assert.ThrowsExactly<LogQueryParseException>(() => LogQueryParser.Parse("\"error occured"));
    }
}
