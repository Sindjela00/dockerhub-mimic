using backend.Controllers;
using backend.Services;
using Microsoft.AspNetCore.Http;
using Microsoft.AspNetCore.Mvc;

namespace backend.Tests;

[TestClass]
public sealed class RegistryControllerTests
{
    [TestMethod]
    public async Task GetRegistryToken_WhenServiceFails_ReturnsUnauthorized()
    {
        var service = new StubRegistryService
        {
            TokenResult = new RegistryTokenResult(false, null, 0, "Invalid credentials")
        };
        var controller = CreateController(service);

        var result = await controller.GetRegistryToken("registry", "demo", "client", ["repository:demo/repo:pull"], CancellationToken.None);

        Assert.IsInstanceOfType<UnauthorizedObjectResult>(result);
    }

    [TestMethod]
    public async Task GetRegistryToken_WhenServiceSucceeds_ReturnsTokenPayload()
    {
        var service = new StubRegistryService
        {
            TokenResult = new RegistryTokenResult(true, "jwt-token", 3600, null)
        };
        var controller = CreateController(service);
        controller.ControllerContext.HttpContext.Request.Headers.Authorization = "Basic ZGVtbzpQYXNzd29yZDE=";

        var result = await controller.GetRegistryToken("registry", "demo", "client", ["repository:demo/repo:pull"], CancellationToken.None);

        var okResult = result as OkObjectResult;
        Assert.IsNotNull(okResult);
        Assert.AreEqual("jwt-token", TestHelpers.GetProperty<string>(okResult.Value!, "token"));
    }

    [TestMethod]
    public async Task HandleRegistryEvents_ReturnsOkMessage()
    {
        var service = new StubRegistryService
        {
            EventsResult = new RegistryEventsResult("processed")
        };
        var controller = CreateController(service);

        var result = await controller.HandleRegistryEvents(new RegistryEventEnvelope([]), CancellationToken.None);

        var okResult = result as OkObjectResult;
        Assert.IsNotNull(okResult);
        Assert.AreEqual("processed", TestHelpers.GetProperty<string>(okResult.Value!, "message"));
    }

    private static RegistryController CreateController(StubRegistryService service)
    {
        return new RegistryController(service)
        {
            ControllerContext = new ControllerContext
            {
                HttpContext = new DefaultHttpContext()
            }
        };
    }

    private sealed class StubRegistryService : IRegistryService
    {
        public RegistryTokenResult TokenResult { get; set; } = new(true, "token", 3600, null);
        public RegistryEventsResult EventsResult { get; set; } = new("processed");

        public Task<RegistryTokenResult> GetRegistryTokenAsync(string? authorizationHeader, string? account, string? service, string? clientId, string[]? scopes, CancellationToken cancellationToken)
            => Task.FromResult(TokenResult);

        public Task<RegistryEventsResult> HandleRegistryEventsAsync(RegistryEventEnvelope? envelope, CancellationToken cancellationToken)
            => Task.FromResult(EventsResult);
    }
}