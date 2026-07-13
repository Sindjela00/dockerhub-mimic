namespace backend.Services.LogQuery;

public abstract record LogQueryNode;

public sealed record AndNode(LogQueryNode Left, LogQueryNode Right) : LogQueryNode;

public sealed record OrNode(LogQueryNode Left, LogQueryNode Right) : LogQueryNode;

public sealed record NotNode(LogQueryNode Operand) : LogQueryNode;

public sealed record FieldCriterionNode(string Field, string Value) : LogQueryNode;

public sealed record PhraseCriterionNode(string Text) : LogQueryNode;

public sealed record TermCriterionNode(string Text) : LogQueryNode;
