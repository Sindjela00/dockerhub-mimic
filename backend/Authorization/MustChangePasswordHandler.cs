using Microsoft.AspNetCore.Authorization;

namespace backend.Authorization;

public sealed class MustChangePasswordHandler : AuthorizationHandler<MustChangePasswordRequirement>
{
    protected override Task HandleRequirementAsync(
        AuthorizationHandlerContext context,
        MustChangePasswordRequirement requirement)
    {
        var mustChangePasswordClaim = context.User.FindFirst("must_change_password")?.Value;

        if (mustChangePasswordClaim == "true")
        {
            context.Fail(new AuthorizationFailureReason(this, "Password change required before continuing."));
        }
        else
        {
            context.Succeed(requirement);
        }

        return Task.CompletedTask;
    }
}
