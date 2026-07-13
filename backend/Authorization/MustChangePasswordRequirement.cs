using Microsoft.AspNetCore.Authorization;

namespace backend.Authorization;

public sealed class MustChangePasswordRequirement : IAuthorizationRequirement
{
}
