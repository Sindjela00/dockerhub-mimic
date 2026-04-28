using System.Security.Claims;
using backend.Controllers;
using backend.Models;
using backend.Services;
using Microsoft.AspNetCore.Http;
using Microsoft.AspNetCore.Mvc;

namespace backend.Tests;

[TestClass]
public sealed class RepositoriesControllerTests
{
    [TestMethod]
    public async Task ExploreRepositories_WhenServiceRejectsMineRequest_ReturnsUnauthorized()
    {
        var service = new StubRepositoriesService
        {
            ExploreResult = new RepositoriesResult<RepositoryListResponse>(false, null, "Unauthorized")
        };
        var controller = CreateController(service);

        var result = await controller.ExploreRepositories(null, null, null, null, null, null, mine: true, starred: false, page: 1, pageSize: 20, cancellationToken: CancellationToken.None);

        Assert.IsInstanceOfType<UnauthorizedResult>(result);
    }

    [TestMethod]
    public async Task ExploreRepositories_WithAuthenticatedUser_ReturnsOkAndPassesClaims()
    {
        var response = new RepositoryListResponse { Total = 1, Page = 1, PageSize = 20 };
        response.Repositories.Add(new RepositoryResponse { Id = 1, Name = "repo" });
        var service = new StubRepositoriesService
        {
            ExploreResult = new RepositoriesResult<RepositoryListResponse>(true, response, null)
        };
        var controller = CreateController(service, "demo", User.RoleUser);

        var result = await controller.ExploreRepositories("repo", null, null, null, null, null, mine: false, starred: false, page: 1, pageSize: 20, cancellationToken: CancellationToken.None);

        Assert.IsInstanceOfType<OkObjectResult>(result);
        Assert.AreEqual("demo", service.LastCurrentUsername);
    }

    [TestMethod]
    public async Task GetRepository_WhenMissing_ReturnsNotFound()
    {
        var service = new StubRepositoriesService
        {
            GetRepositoryResult = new RepositoriesResult<RepositoryResponse>(false, null, "Repository not found.")
        };
        var controller = CreateController(service);

        var result = await controller.GetRepository(42, CancellationToken.None);

        Assert.IsInstanceOfType<NotFoundObjectResult>(result);
    }

    [TestMethod]
    public async Task CreateRepository_WithoutIdentity_ReturnsUnauthorized()
    {
        var controller = CreateController(new StubRepositoriesService());

        var result = await controller.CreateRepository(new RepositoriesController.CreateRepositoryRequest("repo", "desc", "public"), CancellationToken.None);

        Assert.IsInstanceOfType<UnauthorizedResult>(result);
    }

    [TestMethod]
    public async Task CreateRepository_WhenServiceReportsDuplicate_ReturnsConflict()
    {
        var service = new StubRepositoriesService
        {
            CreateResult = new RepositoriesResult<RepositoryResponse>(false, null, "Repository with this name already exists.")
        };
        var controller = CreateController(service, "demo", User.RoleUser);

        var result = await controller.CreateRepository(new RepositoriesController.CreateRepositoryRequest("repo", "desc", "public"), CancellationToken.None);

        Assert.IsInstanceOfType<ConflictObjectResult>(result);
    }

    [TestMethod]
    public async Task UpdateRepository_WhenUnauthorizedUser_ReturnsUnauthorized()
    {
        var controller = CreateController(new StubRepositoriesService());

        var result = await controller.UpdateRepository(1, new RepositoriesController.UpdateRepositoryRequest("repo", "desc", "public"), CancellationToken.None);

        Assert.IsInstanceOfType<UnauthorizedResult>(result);
    }

    [TestMethod]
    public async Task UpdateRepository_WhenServiceSucceeds_ReturnsOk()
    {
        var service = new StubRepositoriesService
        {
            UpdateResult = new RepositoriesResult<RepositoryResponse>(true, new RepositoryResponse { Id = 1, Name = "repo" }, null)
        };
        var controller = CreateController(service, "demo", User.RoleAdministrator);

        var result = await controller.UpdateRepository(1, new RepositoriesController.UpdateRepositoryRequest("repo", "desc", "private"), CancellationToken.None);

        Assert.IsInstanceOfType<OkObjectResult>(result);
        Assert.AreEqual(User.RoleAdministrator, service.LastUserRole);
    }

    [TestMethod]
    public async Task DeleteRepository_WhenForbidden_ReturnsForbid()
    {
        var service = new StubRepositoriesService
        {
            DeleteResult = new RepositoriesResult<string>(false, null, "Forbidden")
        };
        var controller = CreateController(service, "demo", User.RoleUser);

        var result = await controller.DeleteRepository(1, CancellationToken.None);

        Assert.IsInstanceOfType<ForbidResult>(result);
    }

    [TestMethod]
    public async Task GetRepositoryTags_WhenServiceSucceeds_ReturnsOk()
    {
        var service = new StubRepositoriesService
        {
            TagsResult = new RepositoriesResult<RepositoryTagListResponse>(true, new RepositoryTagListResponse { RepositoryId = 1, RepositoryFullName = "demo/repo", Page = 2, PageSize = 5, Total = 0 }, null)
        };
        var controller = CreateController(service);

        var result = await controller.GetRepositoryTags(1, null, "pulls", "desc", 2, 5, CancellationToken.None);

        Assert.IsInstanceOfType<OkObjectResult>(result);
    }

    [TestMethod]
    public async Task DeleteRepositoryTag_WhenTagMissing_ReturnsNotFound()
    {
        var service = new StubRepositoriesService
        {
            DeleteTagResult = new RepositoriesResult<string>(false, null, "Tag not found.")
        };
        var controller = CreateController(service, "demo", User.RoleUser);

        var result = await controller.DeleteRepositoryTag(1, "latest", CancellationToken.None);

        Assert.IsInstanceOfType<NotFoundObjectResult>(result);
    }

    [TestMethod]
    public async Task GetRepositoryCollaborators_WhenForbidden_ReturnsForbid()
    {
        var service = new StubRepositoriesService
        {
            CollaboratorsResult = new RepositoriesResult<RepositoryCollaboratorListResponse>(false, null, "Forbidden")
        };
        var controller = CreateController(service, "viewer", User.RoleUser);

        var result = await controller.GetRepositoryCollaborators(1, CancellationToken.None);

        Assert.IsInstanceOfType<ForbidResult>(result);
    }

    [TestMethod]
    public async Task AddRepositoryCollaborator_WhenUserMissing_ReturnsNotFound()
    {
        var service = new StubRepositoriesService
        {
            AddCollaboratorResult = new RepositoriesResult<RepositoryCollaboratorResponse>(false, null, "User not found.")
        };
        var controller = CreateController(service, "demo", User.RoleUser);

        var result = await controller.AddRepositoryCollaborator(1, new RepositoriesController.AddRepositoryCollaboratorRequest("ghost", "read"), CancellationToken.None);

        Assert.IsInstanceOfType<NotFoundObjectResult>(result);
    }

    [TestMethod]
    public async Task RemoveRepositoryCollaborator_WhenSuccessful_ReturnsNoContent()
    {
        var service = new StubRepositoriesService
        {
            RemoveCollaboratorResult = new RepositoriesResult<string>(true, "removed", null)
        };
        var controller = CreateController(service, "demo", User.RoleUser);

        var result = await controller.RemoveRepositoryCollaborator(1, 2, CancellationToken.None);

        Assert.IsInstanceOfType<NoContentResult>(result);
    }

    // ---- GetRepositoryTeams ----

    [TestMethod]
    public async Task GetRepositoryTeams_WhenSucceeds_ReturnsOk()
    {
        var data = new RepositoryTeamAccessListResponse { RepositoryId = 1, Total = 2 };
        var service = new StubRepositoriesService { TeamAccessResult = new RepositoriesResult<RepositoryTeamAccessListResponse>(true, data, null) };
        var controller = CreateController(service, "owner", User.RoleUser);

        var result = await controller.GetRepositoryTeams(1, CancellationToken.None);

        Assert.IsInstanceOfType<OkObjectResult>(result);
    }

    [TestMethod]
    public async Task GetRepositoryTeams_WhenNotFound_ReturnsNotFound()
    {
        var service = new StubRepositoriesService { TeamAccessResult = new RepositoriesResult<RepositoryTeamAccessListResponse>(false, null, "Repository not found.") };
        var controller = CreateController(service, "owner", User.RoleUser);

        var result = await controller.GetRepositoryTeams(99, CancellationToken.None);

        Assert.IsInstanceOfType<NotFoundObjectResult>(result);
    }

    [TestMethod]
    public async Task GetRepositoryTeams_WhenForbidden_ReturnsForbid()
    {
        var service = new StubRepositoriesService { TeamAccessResult = new RepositoriesResult<RepositoryTeamAccessListResponse>(false, null, "Forbidden") };
        var controller = CreateController(service, "outsider", User.RoleUser);

        var result = await controller.GetRepositoryTeams(1, CancellationToken.None);

        Assert.IsInstanceOfType<ForbidResult>(result);
    }

    [TestMethod]
    public async Task GetRepositoryTeams_WhenNotOrgRepo_ReturnsBadRequest()
    {
        var service = new StubRepositoriesService { TeamAccessResult = new RepositoriesResult<RepositoryTeamAccessListResponse>(false, null, "Repository does not belong to an organization.") };
        var controller = CreateController(service, "owner", User.RoleUser);

        var result = await controller.GetRepositoryTeams(1, CancellationToken.None);

        Assert.IsInstanceOfType<BadRequestObjectResult>(result);
    }

    // ---- SetRepositoryTeamPermission ----

    [TestMethod]
    public async Task SetRepositoryTeamPermission_WhenSucceeds_ReturnsOk()
    {
        var data = new RepositoryTeamAccessResponse { TeamId = 1, TeamName = "devs", Permission = "read+write" };
        var service = new StubRepositoriesService { SetTeamPermissionResult = new RepositoriesResult<RepositoryTeamAccessResponse>(true, data, null) };
        var controller = CreateController(service, "owner", User.RoleUser);

        var result = await controller.SetRepositoryTeamPermission(1, new RepositoriesController.SetRepositoryTeamPermissionRequest(1, "read+write"), CancellationToken.None);

        Assert.IsInstanceOfType<OkObjectResult>(result);
    }

    [TestMethod]
    public async Task SetRepositoryTeamPermission_WhenForbidden_ReturnsForbid()
    {
        var service = new StubRepositoriesService { SetTeamPermissionResult = new RepositoriesResult<RepositoryTeamAccessResponse>(false, null, "Forbidden") };
        var controller = CreateController(service, "outsider", User.RoleUser);

        var result = await controller.SetRepositoryTeamPermission(1, new RepositoriesController.SetRepositoryTeamPermissionRequest(1, "read-only"), CancellationToken.None);

        Assert.IsInstanceOfType<ForbidResult>(result);
    }

    [TestMethod]
    public async Task SetRepositoryTeamPermission_WhenRepoNotFound_ReturnsNotFound()
    {
        var service = new StubRepositoriesService { SetTeamPermissionResult = new RepositoriesResult<RepositoryTeamAccessResponse>(false, null, "Repository not found.") };
        var controller = CreateController(service, "owner", User.RoleUser);

        var result = await controller.SetRepositoryTeamPermission(99, new RepositoriesController.SetRepositoryTeamPermissionRequest(1, "read-only"), CancellationToken.None);

        Assert.IsInstanceOfType<NotFoundObjectResult>(result);
    }

    [TestMethod]
    public async Task SetRepositoryTeamPermission_WhenTeamNotFound_ReturnsNotFound()
    {
        var service = new StubRepositoriesService { SetTeamPermissionResult = new RepositoriesResult<RepositoryTeamAccessResponse>(false, null, "Team not found in this organization.") };
        var controller = CreateController(service, "owner", User.RoleUser);

        var result = await controller.SetRepositoryTeamPermission(1, new RepositoriesController.SetRepositoryTeamPermissionRequest(99, "read-only"), CancellationToken.None);

        Assert.IsInstanceOfType<NotFoundObjectResult>(result);
    }

    [TestMethod]
    public async Task SetRepositoryTeamPermission_WhenInvalidPermission_ReturnsBadRequest()
    {
        var service = new StubRepositoriesService { SetTeamPermissionResult = new RepositoriesResult<RepositoryTeamAccessResponse>(false, null, "Permission must be 'read-only', 'read+write', or 'admin'.") };
        var controller = CreateController(service, "owner", User.RoleUser);

        var result = await controller.SetRepositoryTeamPermission(1, new RepositoriesController.SetRepositoryTeamPermissionRequest(1, "bad"), CancellationToken.None);

        Assert.IsInstanceOfType<BadRequestObjectResult>(result);
    }

    private static RepositoriesController CreateController(StubRepositoriesService service, string? username = null, string? role = null)
    {
        var controller = new RepositoriesController(service)
        {
            ControllerContext = new ControllerContext
            {
                HttpContext = new DefaultHttpContext()
            }
        };

        if (!string.IsNullOrWhiteSpace(username))
        {
            var claims = new List<Claim> { new(ClaimTypes.Name, username) };
            if (!string.IsNullOrWhiteSpace(role))
                claims.Add(new Claim(ClaimTypes.Role, role));

            controller.ControllerContext.HttpContext.User = new ClaimsPrincipal(new ClaimsIdentity(claims, "Test"));
        }

        return controller;
    }

    private sealed class StubRepositoriesService : IRepositoriesService
    {
        public RepositoriesResult<RepositoryListResponse> ExploreResult { get; set; } = new(true, new RepositoryListResponse(), null);
        public RepositoriesResult<RepositoryResponse> GetRepositoryResult { get; set; } = new(true, new RepositoryResponse(), null);
        public RepositoriesResult<RepositoryResponse> CreateResult { get; set; } = new(true, new RepositoryResponse(), null);
        public RepositoriesResult<RepositoryResponse> UpdateResult { get; set; } = new(true, new RepositoryResponse(), null);
        public RepositoriesResult<string> DeleteResult { get; set; } = new(true, "deleted", null);
        public RepositoriesResult<RepositoryTagListResponse> TagsResult { get; set; } = new(true, new RepositoryTagListResponse(), null);
        public RepositoriesResult<RepositoryCollaboratorListResponse> CollaboratorsResult { get; set; } = new(true, new RepositoryCollaboratorListResponse(), null);
        public RepositoriesResult<RepositoryCollaboratorResponse> AddCollaboratorResult { get; set; } = new(true, new RepositoryCollaboratorResponse(), null);
        public RepositoriesResult<string> RemoveCollaboratorResult { get; set; } = new(true, "removed", null);
        public RepositoriesResult<string> DeleteTagResult { get; set; } = new(true, "deleted", null);
        public RepositoriesResult<RepositoryResponse> StarResult { get; set; } = new(true, new RepositoryResponse(), null);
        public RepositoriesResult<RepositoryResponse> UnstarResult { get; set; } = new(true, new RepositoryResponse(), null);
        public RepositoriesResult<RepositoryTeamAccessListResponse> TeamAccessResult { get; set; } = new(true, new RepositoryTeamAccessListResponse(), null);
        public RepositoriesResult<RepositoryTeamAccessResponse> SetTeamPermissionResult { get; set; } = new(true, new RepositoryTeamAccessResponse(), null);
        public RepositoriesResult<string> RemoveTeamResult { get; set; } = new(true, "removed", null);
        public string? LastCurrentUsername { get; private set; }
        public string? LastUserRole { get; private set; }

        public Task<RepositoriesResult<RepositoryListResponse>> ExploreRepositoriesAsync(string? search, string? owner, string? visibility, int? minStars, string? sortBy, string? sortDir, bool mine, bool starred, int page, int pageSize, string? currentUsername, CancellationToken cancellationToken)
        {
            LastCurrentUsername = currentUsername;
            return Task.FromResult(ExploreResult);
        }

        public Task<RepositoriesResult<RepositoryResponse>> GetRepositoryAsync(int id, string? currentUsername, string? userRole, CancellationToken cancellationToken)
        {
            LastCurrentUsername = currentUsername;
            LastUserRole = userRole;
            return Task.FromResult(GetRepositoryResult);
        }

        public Task<RepositoriesResult<RepositoryResponse>> CreateRepositoryAsync(string name, string? description, string visibility, string username, CancellationToken cancellationToken)
        {
            LastCurrentUsername = username;
            return Task.FromResult(CreateResult);
        }

        public Task<RepositoriesResult<RepositoryResponse>> UpdateRepositoryAsync(int id, string? name, string? description, string? visibility, string? currentUsername, string? userRole, CancellationToken cancellationToken)
        {
            LastCurrentUsername = currentUsername;
            LastUserRole = userRole;
            return Task.FromResult(UpdateResult);
        }

        public Task<RepositoriesResult<string>> DeleteRepositoryAsync(int id, string? currentUsername, string? userRole, CancellationToken cancellationToken)
        {
            LastCurrentUsername = currentUsername;
            LastUserRole = userRole;
            return Task.FromResult(DeleteResult);
        }

        public Task<RepositoriesResult<RepositoryTagListResponse>> GetRepositoryTagsAsync(int id, string? search, string? sortBy, string? sortDir, int page, int pageSize, string? currentUsername, string? userRole, CancellationToken cancellationToken)
        {
            LastCurrentUsername = currentUsername;
            LastUserRole = userRole;
            return Task.FromResult(TagsResult);
        }

        public Task<RepositoriesResult<RepositoryCollaboratorListResponse>> GetRepositoryCollaboratorsAsync(int id, string? currentUsername, string? userRole, CancellationToken cancellationToken)
        {
            LastCurrentUsername = currentUsername;
            LastUserRole = userRole;
            return Task.FromResult(CollaboratorsResult);
        }

        public Task<RepositoriesResult<RepositoryCollaboratorResponse>> AddRepositoryCollaboratorAsync(int id, string identifier, string? role, string? currentUsername, string? userRole, CancellationToken cancellationToken)
        {
            LastCurrentUsername = currentUsername;
            LastUserRole = userRole;
            return Task.FromResult(AddCollaboratorResult);
        }

        public Task<RepositoriesResult<string>> RemoveRepositoryCollaboratorAsync(int id, int userId, string? currentUsername, string? userRole, CancellationToken cancellationToken)
        {
            LastCurrentUsername = currentUsername;
            LastUserRole = userRole;
            return Task.FromResult(RemoveCollaboratorResult);
        }

        public Task<RepositoriesResult<string>> DeleteRepositoryTagAsync(int id, string tagName, string? currentUsername, string? userRole, CancellationToken cancellationToken)
        {
            LastCurrentUsername = currentUsername;
            LastUserRole = userRole;
            return Task.FromResult(DeleteTagResult);
        }

        public Task<RepositoriesResult<RepositoryResponse>> StarRepositoryAsync(int id, string? currentUsername, CancellationToken cancellationToken)
        {
            LastCurrentUsername = currentUsername;
            return Task.FromResult(StarResult);
        }

        public Task<RepositoriesResult<RepositoryResponse>> UnstarRepositoryAsync(int id, string? currentUsername, CancellationToken cancellationToken)
        {
            LastCurrentUsername = currentUsername;
            return Task.FromResult(UnstarResult);
        }

        public Task<RepositoriesResult<RepositoryTeamAccessListResponse>> GetRepositoryTeamsAsync(int id, string? currentUsername, string? userRole, CancellationToken cancellationToken)
        {
            LastCurrentUsername = currentUsername;
            LastUserRole = userRole;
            return Task.FromResult(TeamAccessResult);
        }

        public Task<RepositoriesResult<RepositoryTeamAccessResponse>> SetRepositoryTeamPermissionAsync(int id, int teamId, string permission, string? currentUsername, string? userRole, CancellationToken cancellationToken)
        {
            LastCurrentUsername = currentUsername;
            LastUserRole = userRole;
            return Task.FromResult(SetTeamPermissionResult);
        }

        public Task<RepositoriesResult<string>> RemoveRepositoryTeamAsync(int id, int teamId, string? currentUsername, string? userRole, CancellationToken cancellationToken)
        {
            LastCurrentUsername = currentUsername;
            LastUserRole = userRole;
            return Task.FromResult(RemoveTeamResult);
        }
    }
}