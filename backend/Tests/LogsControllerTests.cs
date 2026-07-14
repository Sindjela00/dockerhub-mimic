using backend.Controllers;
using backend.Services;
using Microsoft.AspNetCore.Mvc;

namespace backend.Tests;

[TestClass]
public sealed class LogsControllerTests
{
    [TestMethod]
    public async Task Search_WithValidQuery_ReturnsOkWithTotalAndEntries()
    {
        var stub = new StubLogSearchService(new LogSearchResult(
            true,
            2,
            [
                new LogEntryResponse(DateTime.UtcNow, "Error", "boom", 1.5),
                new LogEntryResponse(DateTime.UtcNow, "Warning", "careful", 1.0)
            ],
            null));
        var controller = new LogsController(stub);

        var result = await controller.Search("level:error", null, null, 1, 25, CancellationToken.None);

        var okResult = result as OkObjectResult;
        Assert.IsNotNull(okResult);
        Assert.IsNotNull(okResult.Value);
        Assert.AreEqual(2L, TestHelpers.GetProperty<long>(okResult.Value, "total"));
        Assert.AreEqual("level:error", stub.LastQueryText);
        Assert.AreEqual(1, stub.LastPage);
        Assert.AreEqual(25, stub.LastPageSize);
    }

    [TestMethod]
    public async Task Search_WhenServiceReportsFailure_ReturnsBadRequestWithMessage()
    {
        var stub = new StubLogSearchService(new LogSearchResult(false, 0, [], "Unknown field 'host'."));
        var controller = new LogsController(stub);

        var result = await controller.Search("host:server1", null, null, 1, 25, CancellationToken.None);

        var badRequest = result as BadRequestObjectResult;
        Assert.IsNotNull(badRequest);
        Assert.IsNotNull(badRequest.Value);
        Assert.AreEqual("Unknown field 'host'.", TestHelpers.GetProperty<string>(badRequest.Value, "message"));
    }

    [TestMethod]
    public async Task Search_WithNonPositivePageAndPageSize_FallsBackToDefaults()
    {
        var stub = new StubLogSearchService(new LogSearchResult(true, 0, [], null));
        var controller = new LogsController(stub);

        await controller.Search(null, null, null, 0, 0, CancellationToken.None);

        Assert.AreEqual(1, stub.LastPage);
        Assert.AreEqual(25, stub.LastPageSize);
    }

    [TestMethod]
    public async Task Search_PassesFromAndToThrough()
    {
        var stub = new StubLogSearchService(new LogSearchResult(true, 0, [], null));
        var controller = new LogsController(stub);
        var from = new DateTime(2026, 1, 1, 0, 0, 0, DateTimeKind.Utc);
        var to = new DateTime(2026, 1, 2, 0, 0, 0, DateTimeKind.Utc);

        await controller.Search(null, from, to, 1, 25, CancellationToken.None);

        Assert.AreEqual(from, stub.LastFrom);
        Assert.AreEqual(to, stub.LastTo);
    }

    private sealed class StubLogSearchService : ILogSearchService
    {
        private readonly LogSearchResult _result;

        public StubLogSearchService(LogSearchResult result)
        {
            _result = result;
        }

        public string? LastQueryText { get; private set; }
        public DateTime? LastFrom { get; private set; }
        public DateTime? LastTo { get; private set; }
        public int LastPage { get; private set; }
        public int LastPageSize { get; private set; }

        public Task<LogSearchResult> SearchAsync(
            string? queryText,
            DateTime? from,
            DateTime? to,
            int page,
            int pageSize,
            CancellationToken cancellationToken)
        {
            LastQueryText = queryText;
            LastFrom = from;
            LastTo = to;
            LastPage = page;
            LastPageSize = pageSize;
            return Task.FromResult(_result);
        }
    }
}
