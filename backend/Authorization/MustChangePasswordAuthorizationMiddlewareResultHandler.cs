using System.Linq;
using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Authorization.Policy;

namespace backend.Authorization;

public sealed class MustChangePasswordAuthorizationMiddlewareResultHandler : IAuthorizationMiddlewareResultHandler
{
    private readonly AuthorizationMiddlewareResultHandler _defaultHandler = new();

    public async Task HandleAsync(
        RequestDelegate next,
        HttpContext context,
        AuthorizationPolicy policy,
        PolicyAuthorizationResult authorizeResult)
    {
        var failedDueToPasswordChange = authorizeResult.Forbidden
            && (authorizeResult.AuthorizationFailure?.FailureReasons.Any(reason => reason.Handler is MustChangePasswordHandler) ?? false);

        if (failedDueToPasswordChange)
        {
            context.Response.StatusCode = StatusCodes.Status403Forbidden;
            await context.Response.WriteAsJsonAsync(new
            {
                message = "Password change required before continuing.",
                code = "MUST_CHANGE_PASSWORD"
            });
            return;
        }

        await _defaultHandler.HandleAsync(next, context, policy, authorizeResult);
    }
}
