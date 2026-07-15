using System.Security.Claims;
using backend.Controllers;
using backend.Models;
using backend.Services;
using Microsoft.AspNetCore.Http;
using Microsoft.AspNetCore.Mvc;

namespace backend.Tests;

[TestClass]
public sealed class OrganizationsControllerTests
{
    // ---- ExploreOrganizations ----

    [TestMethod]
    public async Task ExploreOrganizations_WhenServiceSucceeds_ReturnsOk()
    {
        var service = new StubOrganizationsService
        {
            ExploreResult = new OrganizationsResult<OrganizationListResponse>(true, new OrganizationListResponse(), null)
        };
        var controller = CreateController(service);

        var result = await controller.ExploreOrganizations(null, 1, 20, CancellationToken.None);

        Assert.IsInstanceOfType<OkObjectResult>(result);
    }

    [TestMethod]
    public async Task ExploreOrganizations_WhenServiceFails_ReturnsBadRequest()
    {
        var service = new StubOrganizationsService
        {
            ExploreResult = new OrganizationsResult<OrganizationListResponse>(false, null, "error")
        };
        var controller = CreateController(service);

        var result = await controller.ExploreOrganizations(null, 1, 20, CancellationToken.None);

        Assert.IsInstanceOfType<BadRequestObjectResult>(result);
    }

    // ---- GetOrganization ----

    [TestMethod]
    public async Task GetOrganization_WhenFound_ReturnsOk()
    {
        var service = new StubOrganizationsService
        {
            GetOrgResult = new OrganizationsResult<OrganizationResponse>(true, new OrganizationResponse { Name = "acme" }, null)
        };
        var controller = CreateController(service);

        var result = await controller.GetOrganization("acme", CancellationToken.None);

        Assert.IsInstanceOfType<OkObjectResult>(result);
    }

    [TestMethod]
    public async Task GetOrganization_WhenNotFound_ReturnsNotFound()
    {
        var service = new StubOrganizationsService
        {
            GetOrgResult = new OrganizationsResult<OrganizationResponse>(false, null, "Organization not found.")
        };
        var controller = CreateController(service);

        var result = await controller.GetOrganization("nosuch", CancellationToken.None);

        Assert.IsInstanceOfType<NotFoundObjectResult>(result);
    }

    // ---- CreateOrganization ----

    [TestMethod]
    public async Task CreateOrganization_WhenSucceeds_Returns201()
    {
        var service = new StubOrganizationsService
        {
            CreateOrgResult = new OrganizationsResult<OrganizationResponse>(true, new OrganizationResponse { Name = "acme" }, null)
        };
        var controller = CreateController(service, "owner", User.RoleUser);

        var result = await controller.CreateOrganization(new OrganizationsController.CreateOrganizationRequest("acme", null, null, null), CancellationToken.None);

        Assert.IsInstanceOfType<ObjectResult>(result);
        Assert.AreEqual(201, ((ObjectResult)result).StatusCode);
    }

    [TestMethod]
    public async Task CreateOrganization_WhenUnauthorized_ReturnsUnauthorized()
    {
        var service = new StubOrganizationsService
        {
            CreateOrgResult = new OrganizationsResult<OrganizationResponse>(false, null, "Unauthorized")
        };
        var controller = CreateController(service, "owner", User.RoleUser);

        var result = await controller.CreateOrganization(new OrganizationsController.CreateOrganizationRequest("acme", null, null, null), CancellationToken.None);

        Assert.IsInstanceOfType<UnauthorizedResult>(result);
    }

    [TestMethod]
    public async Task CreateOrganization_WhenDuplicate_ReturnsConflict()
    {
        var service = new StubOrganizationsService
        {
            CreateOrgResult = new OrganizationsResult<OrganizationResponse>(false, null, "Organization with this name already exists.")
        };
        var controller = CreateController(service, "owner", User.RoleUser);

        var result = await controller.CreateOrganization(new OrganizationsController.CreateOrganizationRequest("acme", null, null, null), CancellationToken.None);

        Assert.IsInstanceOfType<ConflictObjectResult>(result);
    }

    [TestMethod]
    public async Task CreateOrganization_WhenBadRequest_ReturnsBadRequest()
    {
        var service = new StubOrganizationsService
        {
            CreateOrgResult = new OrganizationsResult<OrganizationResponse>(false, null, "Organization name is required.")
        };
        var controller = CreateController(service, "owner", User.RoleUser);

        var result = await controller.CreateOrganization(new OrganizationsController.CreateOrganizationRequest("", null, null, null), CancellationToken.None);

        Assert.IsInstanceOfType<BadRequestObjectResult>(result);
    }

    // ---- UpdateOrganization ----

    [TestMethod]
    public async Task UpdateOrganization_WhenSucceeds_ReturnsOk()
    {
        var service = new StubOrganizationsService
        {
            UpdateOrgResult = new OrganizationsResult<OrganizationResponse>(true, new OrganizationResponse { Name = "acme" }, null)
        };
        var controller = CreateController(service, "owner", User.RoleUser);

        var result = await controller.UpdateOrganization("acme", new OrganizationsController.UpdateOrganizationRequest(null, "new desc", null), CancellationToken.None);

        Assert.IsInstanceOfType<OkObjectResult>(result);
    }

    [TestMethod]
    public async Task UpdateOrganization_WhenNotFound_ReturnsNotFound()
    {
        var service = new StubOrganizationsService
        {
            UpdateOrgResult = new OrganizationsResult<OrganizationResponse>(false, null, "Organization not found.")
        };
        var controller = CreateController(service, "owner", User.RoleUser);

        var result = await controller.UpdateOrganization("nosuch", new OrganizationsController.UpdateOrganizationRequest(null, null, null), CancellationToken.None);

        Assert.IsInstanceOfType<NotFoundObjectResult>(result);
    }

    [TestMethod]
    public async Task UpdateOrganization_WhenForbidden_ReturnsForbid()
    {
        var service = new StubOrganizationsService
        {
            UpdateOrgResult = new OrganizationsResult<OrganizationResponse>(false, null, "Forbidden")
        };
        var controller = CreateController(service, "outsider", User.RoleUser);

        var result = await controller.UpdateOrganization("acme", new OrganizationsController.UpdateOrganizationRequest(null, null, null), CancellationToken.None);

        Assert.IsInstanceOfType<ForbidResult>(result);
    }

    // ---- DeleteOrganization ----

    [TestMethod]
    public async Task DeleteOrganization_WhenSucceeds_ReturnsNoContent()
    {
        var service = new StubOrganizationsService
        {
            DeleteOrgResult = new OrganizationsResult<string>(true, "deleted", null)
        };
        var controller = CreateController(service, "owner", User.RoleUser);

        var result = await controller.DeleteOrganization("acme", CancellationToken.None);

        Assert.IsInstanceOfType<NoContentResult>(result);
    }

    [TestMethod]
    public async Task DeleteOrganization_WhenForbidden_ReturnsForbid()
    {
        var service = new StubOrganizationsService
        {
            DeleteOrgResult = new OrganizationsResult<string>(false, null, "Forbidden")
        };
        var controller = CreateController(service, "outsider", User.RoleUser);

        var result = await controller.DeleteOrganization("acme", CancellationToken.None);

        Assert.IsInstanceOfType<ForbidResult>(result);
    }

    [TestMethod]
    public async Task DeleteOrganization_WhenNotFound_ReturnsNotFound()
    {
        var service = new StubOrganizationsService
        {
            DeleteOrgResult = new OrganizationsResult<string>(false, null, "Organization not found.")
        };
        var controller = CreateController(service, "owner", User.RoleUser);

        var result = await controller.DeleteOrganization("nosuch", CancellationToken.None);

        Assert.IsInstanceOfType<NotFoundObjectResult>(result);
    }

    // ---- GetOrganizationMembers ----

    [TestMethod]
    public async Task GetOrganizationMembers_WhenSucceeds_ReturnsOk()
    {
        var service = new StubOrganizationsService
        {
            GetMembersResult = new OrganizationsResult<OrganizationMemberListResponse>(true, new OrganizationMemberListResponse(), null)
        };
        var controller = CreateController(service, "owner", User.RoleUser);

        var result = await controller.GetOrganizationMembers("acme", CancellationToken.None);

        Assert.IsInstanceOfType<OkObjectResult>(result);
    }

    [TestMethod]
    public async Task GetOrganizationMembers_WhenForbidden_ReturnsForbid()
    {
        var service = new StubOrganizationsService
        {
            GetMembersResult = new OrganizationsResult<OrganizationMemberListResponse>(false, null, "Forbidden")
        };
        var controller = CreateController(service, "outsider", User.RoleUser);

        var result = await controller.GetOrganizationMembers("acme", CancellationToken.None);

        Assert.IsInstanceOfType<ForbidResult>(result);
    }

    [TestMethod]
    public async Task GetOrganizationMembers_WhenNotFound_ReturnsNotFound()
    {
        var service = new StubOrganizationsService
        {
            GetMembersResult = new OrganizationsResult<OrganizationMemberListResponse>(false, null, "Organization not found.")
        };
        var controller = CreateController(service, "owner", User.RoleUser);

        var result = await controller.GetOrganizationMembers("nosuch", CancellationToken.None);

        Assert.IsInstanceOfType<NotFoundObjectResult>(result);
    }

    // ---- AddOrganizationMember ----

    [TestMethod]
    public async Task AddOrganizationMember_WhenSucceeds_ReturnsOk()
    {
        var service = new StubOrganizationsService
        {
            AddMemberResult = new OrganizationsResult<OrganizationMemberResponse>(true, new OrganizationMemberResponse(), null)
        };
        var controller = CreateController(service, "owner", User.RoleUser);

        var result = await controller.AddOrganizationMember("acme", new OrganizationsController.AddOrganizationMemberRequest("dev", null), CancellationToken.None);

        Assert.IsInstanceOfType<OkObjectResult>(result);
    }

    [TestMethod]
    public async Task AddOrganizationMember_WhenForbidden_ReturnsForbid()
    {
        var service = new StubOrganizationsService
        {
            AddMemberResult = new OrganizationsResult<OrganizationMemberResponse>(false, null, "Forbidden")
        };
        var controller = CreateController(service, "outsider", User.RoleUser);

        var result = await controller.AddOrganizationMember("acme", new OrganizationsController.AddOrganizationMemberRequest("dev", null), CancellationToken.None);

        Assert.IsInstanceOfType<ForbidResult>(result);
    }

    [TestMethod]
    public async Task AddOrganizationMember_WhenUserNotFound_ReturnsNotFound()
    {
        var service = new StubOrganizationsService
        {
            AddMemberResult = new OrganizationsResult<OrganizationMemberResponse>(false, null, "User not found.")
        };
        var controller = CreateController(service, "owner", User.RoleUser);

        var result = await controller.AddOrganizationMember("acme", new OrganizationsController.AddOrganizationMemberRequest("ghost", null), CancellationToken.None);

        Assert.IsInstanceOfType<NotFoundObjectResult>(result);
    }

    // ---- RemoveOrganizationMember ----

    [TestMethod]
    public async Task RemoveOrganizationMember_WhenSucceeds_ReturnsNoContent()
    {
        var service = new StubOrganizationsService
        {
            RemoveMemberResult = new OrganizationsResult<string>(true, "removed", null)
        };
        var controller = CreateController(service, "owner", User.RoleUser);

        var result = await controller.RemoveOrganizationMember("acme", 2, CancellationToken.None);

        Assert.IsInstanceOfType<NoContentResult>(result);
    }

    [TestMethod]
    public async Task RemoveOrganizationMember_WhenForbidden_ReturnsForbid()
    {
        var service = new StubOrganizationsService
        {
            RemoveMemberResult = new OrganizationsResult<string>(false, null, "Forbidden")
        };
        var controller = CreateController(service, "outsider", User.RoleUser);

        var result = await controller.RemoveOrganizationMember("acme", 2, CancellationToken.None);

        Assert.IsInstanceOfType<ForbidResult>(result);
    }

    [TestMethod]
    public async Task RemoveOrganizationMember_WhenNotFound_ReturnsNotFound()
    {
        var service = new StubOrganizationsService
        {
            RemoveMemberResult = new OrganizationsResult<string>(false, null, "Member not found.")
        };
        var controller = CreateController(service, "owner", User.RoleUser);

        var result = await controller.RemoveOrganizationMember("acme", 9999, CancellationToken.None);

        Assert.IsInstanceOfType<NotFoundObjectResult>(result);
    }

    // ---- GetOrganizationRepositories ----

    [TestMethod]
    public async Task GetOrganizationRepositories_WhenSucceeds_ReturnsOk()
    {
        var service = new StubOrganizationsService
        {
            GetOrgReposResult = new OrganizationsResult<RepositoryListResponse>(true, new RepositoryListResponse(), null)
        };
        var controller = CreateController(service);

        var result = await controller.GetOrganizationRepositories("acme", null, null, null, null, null, 1, 20, CancellationToken.None);

        Assert.IsInstanceOfType<OkObjectResult>(result);
    }

    [TestMethod]
    public async Task GetOrganizationRepositories_WhenNotFound_ReturnsNotFound()
    {
        var service = new StubOrganizationsService
        {
            GetOrgReposResult = new OrganizationsResult<RepositoryListResponse>(false, null, "Organization not found.")
        };
        var controller = CreateController(service);

        var result = await controller.GetOrganizationRepositories("nosuch", null, null, null, null, null, 1, 20, CancellationToken.None);

        Assert.IsInstanceOfType<NotFoundObjectResult>(result);
    }

    // ---- CreateOrganizationRepository ----

    [TestMethod]
    public async Task CreateOrganizationRepository_WhenSucceeds_Returns201()
    {
        var service = new StubOrganizationsService
        {
            CreateOrgRepoResult = new OrganizationsResult<RepositoryResponse>(true, new RepositoryResponse { Name = "api" }, null)
        };
        var controller = CreateController(service, "owner", User.RoleUser);

        var result = await controller.CreateOrganizationRepository("acme", new OrganizationsController.CreateOrganizationRepositoryRequest("api", null, "public"), CancellationToken.None);

        Assert.IsInstanceOfType<ObjectResult>(result);
        Assert.AreEqual(201, ((ObjectResult)result).StatusCode);
    }

    [TestMethod]
    public async Task CreateOrganizationRepository_WhenForbidden_ReturnsForbid()
    {
        var service = new StubOrganizationsService
        {
            CreateOrgRepoResult = new OrganizationsResult<RepositoryResponse>(false, null, "Forbidden")
        };
        var controller = CreateController(service, "outsider", User.RoleUser);

        var result = await controller.CreateOrganizationRepository("acme", new OrganizationsController.CreateOrganizationRepositoryRequest("api", null, "public"), CancellationToken.None);

        Assert.IsInstanceOfType<ForbidResult>(result);
    }

    [TestMethod]
    public async Task CreateOrganizationRepository_WhenDuplicate_ReturnsConflict()
    {
        var service = new StubOrganizationsService
        {
            CreateOrgRepoResult = new OrganizationsResult<RepositoryResponse>(false, null, "Repository with this name already exists in the organization.")
        };
        var controller = CreateController(service, "owner", User.RoleUser);

        var result = await controller.CreateOrganizationRepository("acme", new OrganizationsController.CreateOrganizationRepositoryRequest("api", null, "public"), CancellationToken.None);

        Assert.IsInstanceOfType<ConflictObjectResult>(result);
    }

    // ---- GetOrganizationTeams ----

    [TestMethod]
    public async Task GetOrganizationTeams_WhenSucceeds_ReturnsOk()
    {
        var service = new StubOrganizationsService
        {
            GetTeamsResult = new OrganizationsResult<OrganizationTeamListResponse>(true, new OrganizationTeamListResponse(), null)
        };
        var controller = CreateController(service, "owner", User.RoleUser);

        var result = await controller.GetOrganizationTeams("acme", CancellationToken.None);

        Assert.IsInstanceOfType<OkObjectResult>(result);
    }

    [TestMethod]
    public async Task GetOrganizationTeams_WhenForbidden_ReturnsForbid()
    {
        var service = new StubOrganizationsService
        {
            GetTeamsResult = new OrganizationsResult<OrganizationTeamListResponse>(false, null, "Forbidden")
        };
        var controller = CreateController(service, "outsider", User.RoleUser);

        var result = await controller.GetOrganizationTeams("acme", CancellationToken.None);

        Assert.IsInstanceOfType<ForbidResult>(result);
    }

    // ---- GetOrganizationTeam ----

    [TestMethod]
    public async Task GetOrganizationTeam_WhenFound_ReturnsOk()
    {
        var service = new StubOrganizationsService
        {
            GetTeamResult = new OrganizationsResult<OrganizationTeamResponse>(true, new OrganizationTeamResponse(), null)
        };
        var controller = CreateController(service, "owner", User.RoleUser);

        var result = await controller.GetOrganizationTeam("acme", "backend", CancellationToken.None);

        Assert.IsInstanceOfType<OkObjectResult>(result);
    }

    [TestMethod]
    public async Task GetOrganizationTeam_WhenNotFound_ReturnsNotFound()
    {
        var service = new StubOrganizationsService
        {
            GetTeamResult = new OrganizationsResult<OrganizationTeamResponse>(false, null, "Team not found.")
        };
        var controller = CreateController(service, "owner", User.RoleUser);

        var result = await controller.GetOrganizationTeam("acme", "nosuch", CancellationToken.None);

        Assert.IsInstanceOfType<NotFoundObjectResult>(result);
    }

    // ---- CreateOrganizationTeam ----

    [TestMethod]
    public async Task CreateOrganizationTeam_WhenSucceeds_Returns201()
    {
        var service = new StubOrganizationsService
        {
            CreateTeamResult = new OrganizationsResult<OrganizationTeamResponse>(true, new OrganizationTeamResponse { Name = "backend" }, null)
        };
        var controller = CreateController(service, "owner", User.RoleUser);

        var result = await controller.CreateOrganizationTeam("acme", new OrganizationsController.CreateOrganizationTeamRequest("backend", null), CancellationToken.None);

        Assert.IsInstanceOfType<ObjectResult>(result);
        Assert.AreEqual(201, ((ObjectResult)result).StatusCode);
    }

    [TestMethod]
    public async Task CreateOrganizationTeam_WhenDuplicate_ReturnsConflict()
    {
        var service = new StubOrganizationsService
        {
            CreateTeamResult = new OrganizationsResult<OrganizationTeamResponse>(false, null, "Team with this name already exists in the organization.")
        };
        var controller = CreateController(service, "owner", User.RoleUser);

        var result = await controller.CreateOrganizationTeam("acme", new OrganizationsController.CreateOrganizationTeamRequest("backend", null), CancellationToken.None);

        Assert.IsInstanceOfType<ConflictObjectResult>(result);
    }

    // ---- UpdateOrganizationTeam ----

    [TestMethod]
    public async Task UpdateOrganizationTeam_WhenSucceeds_ReturnsOk()
    {
        var service = new StubOrganizationsService
        {
            UpdateTeamResult = new OrganizationsResult<OrganizationTeamResponse>(true, new OrganizationTeamResponse(), null)
        };
        var controller = CreateController(service, "owner", User.RoleUser);

        var result = await controller.UpdateOrganizationTeam("acme", "backend", new OrganizationsController.UpdateOrganizationTeamRequest("backend", "desc"), CancellationToken.None);

        Assert.IsInstanceOfType<OkObjectResult>(result);
    }

    [TestMethod]
    public async Task UpdateOrganizationTeam_WhenForbidden_ReturnsForbid()
    {
        var service = new StubOrganizationsService
        {
            UpdateTeamResult = new OrganizationsResult<OrganizationTeamResponse>(false, null, "Forbidden")
        };
        var controller = CreateController(service, "outsider", User.RoleUser);

        var result = await controller.UpdateOrganizationTeam("acme", "backend", new OrganizationsController.UpdateOrganizationTeamRequest(null, null), CancellationToken.None);

        Assert.IsInstanceOfType<ForbidResult>(result);
    }

    // ---- DeleteOrganizationTeam ----

    [TestMethod]
    public async Task DeleteOrganizationTeam_WhenSucceeds_ReturnsNoContent()
    {
        var service = new StubOrganizationsService
        {
            DeleteTeamResult = new OrganizationsResult<string>(true, "deleted", null)
        };
        var controller = CreateController(service, "owner", User.RoleUser);

        var result = await controller.DeleteOrganizationTeam("acme", "backend", CancellationToken.None);

        Assert.IsInstanceOfType<NoContentResult>(result);
    }

    [TestMethod]
    public async Task DeleteOrganizationTeam_WhenForbidden_ReturnsForbid()
    {
        var service = new StubOrganizationsService
        {
            DeleteTeamResult = new OrganizationsResult<string>(false, null, "Forbidden")
        };
        var controller = CreateController(service, "outsider", User.RoleUser);

        var result = await controller.DeleteOrganizationTeam("acme", "backend", CancellationToken.None);

        Assert.IsInstanceOfType<ForbidResult>(result);
    }

    // ---- GetOrganizationTeamMembers ----

    [TestMethod]
    public async Task GetOrganizationTeamMembers_WhenSucceeds_ReturnsOk()
    {
        var service = new StubOrganizationsService
        {
            GetTeamMembersResult = new OrganizationsResult<OrganizationTeamMemberListResponse>(true, new OrganizationTeamMemberListResponse(), null)
        };
        var controller = CreateController(service, "owner", User.RoleUser);

        var result = await controller.GetOrganizationTeamMembers("acme", "backend", CancellationToken.None);

        Assert.IsInstanceOfType<OkObjectResult>(result);
    }

    [TestMethod]
    public async Task GetOrganizationTeamMembers_WhenForbidden_ReturnsForbid()
    {
        var service = new StubOrganizationsService
        {
            GetTeamMembersResult = new OrganizationsResult<OrganizationTeamMemberListResponse>(false, null, "Forbidden")
        };
        var controller = CreateController(service, "outsider", User.RoleUser);

        var result = await controller.GetOrganizationTeamMembers("acme", "backend", CancellationToken.None);

        Assert.IsInstanceOfType<ForbidResult>(result);
    }

    // ---- AddOrganizationTeamMember ----

    [TestMethod]
    public async Task AddOrganizationTeamMember_WhenSucceeds_ReturnsOk()
    {
        var service = new StubOrganizationsService
        {
            AddTeamMemberResult = new OrganizationsResult<OrganizationTeamMemberResponse>(true, new OrganizationTeamMemberResponse(), null)
        };
        var controller = CreateController(service, "owner", User.RoleUser);

        var result = await controller.AddOrganizationTeamMember("acme", "backend", new OrganizationsController.AddOrganizationTeamMemberRequest(2), CancellationToken.None);

        Assert.IsInstanceOfType<OkObjectResult>(result);
    }

    [TestMethod]
    public async Task AddOrganizationTeamMember_WhenUserNotFound_ReturnsNotFound()
    {
        var service = new StubOrganizationsService
        {
            AddTeamMemberResult = new OrganizationsResult<OrganizationTeamMemberResponse>(false, null, "User not found.")
        };
        var controller = CreateController(service, "owner", User.RoleUser);

        var result = await controller.AddOrganizationTeamMember("acme", "backend", new OrganizationsController.AddOrganizationTeamMemberRequest(9999), CancellationToken.None);

        Assert.IsInstanceOfType<NotFoundObjectResult>(result);
    }

    // ---- RemoveOrganizationTeamMember ----

    [TestMethod]
    public async Task RemoveOrganizationTeamMember_WhenSucceeds_ReturnsNoContent()
    {
        var service = new StubOrganizationsService
        {
            RemoveTeamMemberResult = new OrganizationsResult<string>(true, "removed", null)
        };
        var controller = CreateController(service, "owner", User.RoleUser);

        var result = await controller.RemoveOrganizationTeamMember("acme", "backend", 2, CancellationToken.None);

        Assert.IsInstanceOfType<NoContentResult>(result);
    }

    [TestMethod]
    public async Task RemoveOrganizationTeamMember_WhenNotFound_ReturnsNotFound()
    {
        var service = new StubOrganizationsService
        {
            RemoveTeamMemberResult = new OrganizationsResult<string>(false, null, "Team member not found.")
        };
        var controller = CreateController(service, "owner", User.RoleUser);

        var result = await controller.RemoveOrganizationTeamMember("acme", "backend", 9999, CancellationToken.None);

        Assert.IsInstanceOfType<NotFoundObjectResult>(result);
    }

    // ---- GetOrganizationTeamRepositories ----

    [TestMethod]
    public async Task GetOrganizationTeamRepositories_WhenSucceeds_ReturnsOk()
    {
        var service = new StubOrganizationsService
        {
            GetTeamReposResult = new OrganizationsResult<OrganizationTeamRepositoryListResponse>(true, new OrganizationTeamRepositoryListResponse(), null)
        };
        var controller = CreateController(service, "owner", User.RoleUser);

        var result = await controller.GetOrganizationTeamRepositories("acme", "backend", CancellationToken.None);

        Assert.IsInstanceOfType<OkObjectResult>(result);
    }

    [TestMethod]
    public async Task GetOrganizationTeamRepositories_WhenForbidden_ReturnsForbid()
    {
        var service = new StubOrganizationsService
        {
            GetTeamReposResult = new OrganizationsResult<OrganizationTeamRepositoryListResponse>(false, null, "Forbidden")
        };
        var controller = CreateController(service, "outsider", User.RoleUser);

        var result = await controller.GetOrganizationTeamRepositories("acme", "backend", CancellationToken.None);

        Assert.IsInstanceOfType<ForbidResult>(result);
    }

    // ---- SetOrganizationTeamRepository ----

    [TestMethod]
    public async Task SetOrganizationTeamRepository_WhenSucceeds_ReturnsOk()
    {
        var service = new StubOrganizationsService
        {
            SetTeamRepoResult = new OrganizationsResult<OrganizationTeamRepositoryResponse>(true, new OrganizationTeamRepositoryResponse(), null)
        };
        var controller = CreateController(service, "owner", User.RoleUser);

        var result = await controller.SetOrganizationTeamRepository("acme", "backend", new OrganizationsController.SetOrganizationTeamRepositoryRequest(1, "read-only"), CancellationToken.None);

        Assert.IsInstanceOfType<OkObjectResult>(result);
    }

    [TestMethod]
    public async Task SetOrganizationTeamRepository_WhenNotFound_ReturnsNotFound()
    {
        var service = new StubOrganizationsService
        {
            SetTeamRepoResult = new OrganizationsResult<OrganizationTeamRepositoryResponse>(false, null, "Repository not found in this organization.")
        };
        var controller = CreateController(service, "owner", User.RoleUser);

        var result = await controller.SetOrganizationTeamRepository("acme", "backend", new OrganizationsController.SetOrganizationTeamRepositoryRequest(9999, "read-only"), CancellationToken.None);

        Assert.IsInstanceOfType<NotFoundObjectResult>(result);
    }

    // ---- RemoveOrganizationTeamRepository ----

    [TestMethod]
    public async Task RemoveOrganizationTeamRepository_WhenSucceeds_ReturnsNoContent()
    {
        var service = new StubOrganizationsService
        {
            RemoveTeamRepoResult = new OrganizationsResult<string>(true, "removed", null)
        };
        var controller = CreateController(service, "owner", User.RoleUser);

        var result = await controller.RemoveOrganizationTeamRepository("acme", "backend", 1, CancellationToken.None);

        Assert.IsInstanceOfType<NoContentResult>(result);
    }

    [TestMethod]
    public async Task RemoveOrganizationTeamRepository_WhenNotFound_ReturnsNotFound()
    {
        var service = new StubOrganizationsService
        {
            RemoveTeamRepoResult = new OrganizationsResult<string>(false, null, "Repository not assigned to this team.")
        };
        var controller = CreateController(service, "owner", User.RoleUser);

        var result = await controller.RemoveOrganizationTeamRepository("acme", "backend", 9999, CancellationToken.None);

        Assert.IsInstanceOfType<NotFoundObjectResult>(result);
    }

    // ---- Helpers ----

    // ---- Invite endpoints ----

    [TestMethod]
    public async Task SendOrganizationInvite_WhenSucceeds_ReturnsOk()
    {
        var service = new StubOrganizationsService { SendInviteResult = new OrganizationsResult<OrganizationInviteResponse>(true, new OrganizationInviteResponse { Email = "dev@example.com" }, null) };
        var controller = CreateController(service, "owner", User.RoleUser);

        var result = await controller.SendOrganizationInvite("acme", new OrganizationsController.SendOrganizationInviteRequest("dev@example.com", "member"), CancellationToken.None);

        Assert.IsInstanceOfType<OkObjectResult>(result);
    }

    [TestMethod]
    public async Task SendOrganizationInvite_WhenForbidden_ReturnsForbid()
    {
        var service = new StubOrganizationsService { SendInviteResult = new OrganizationsResult<OrganizationInviteResponse>(false, null, "Forbidden") };
        var controller = CreateController(service, "outsider", User.RoleUser);

        var result = await controller.SendOrganizationInvite("acme", new OrganizationsController.SendOrganizationInviteRequest("dev@example.com", null), CancellationToken.None);

        Assert.IsInstanceOfType<ForbidResult>(result);
    }

    [TestMethod]
    public async Task SendOrganizationInvite_WhenOrgNotFound_ReturnsNotFound()
    {
        var service = new StubOrganizationsService { SendInviteResult = new OrganizationsResult<OrganizationInviteResponse>(false, null, "Organization not found.") };
        var controller = CreateController(service, "owner", User.RoleUser);

        var result = await controller.SendOrganizationInvite("unknown", new OrganizationsController.SendOrganizationInviteRequest("dev@example.com", null), CancellationToken.None);

        Assert.IsInstanceOfType<NotFoundObjectResult>(result);
    }

    [TestMethod]
    public async Task GetOrganizationInvites_WhenSucceeds_ReturnsOk()
    {
        var service = new StubOrganizationsService { GetInvitesResult = new OrganizationsResult<List<OrganizationInviteResponse>>(true, new List<OrganizationInviteResponse>(), null) };
        var controller = CreateController(service, "owner", User.RoleUser);

        var result = await controller.GetOrganizationInvites("acme", CancellationToken.None);

        Assert.IsInstanceOfType<OkObjectResult>(result);
    }

    [TestMethod]
    public async Task GetOrganizationInvites_WhenForbidden_ReturnsForbid()
    {
        var service = new StubOrganizationsService { GetInvitesResult = new OrganizationsResult<List<OrganizationInviteResponse>>(false, null, "Forbidden") };
        var controller = CreateController(service, "outsider", User.RoleUser);

        var result = await controller.GetOrganizationInvites("acme", CancellationToken.None);

        Assert.IsInstanceOfType<ForbidResult>(result);
    }

    [TestMethod]
    public async Task CancelOrganizationInvite_WhenSucceeds_ReturnsNoContent()
    {
        var service = new StubOrganizationsService { CancelInviteResult = new OrganizationsResult<string>(true, "cancelled", null) };
        var controller = CreateController(service, "owner", User.RoleUser);

        var result = await controller.CancelOrganizationInvite("acme", 1, CancellationToken.None);

        Assert.IsInstanceOfType<NoContentResult>(result);
    }

    [TestMethod]
    public async Task CancelOrganizationInvite_WhenNotFound_ReturnsNotFound()
    {
        var service = new StubOrganizationsService { CancelInviteResult = new OrganizationsResult<string>(false, null, "Invite not found.") };
        var controller = CreateController(service, "owner", User.RoleUser);

        var result = await controller.CancelOrganizationInvite("acme", 999, CancellationToken.None);

        Assert.IsInstanceOfType<NotFoundObjectResult>(result);
    }

    [TestMethod]
    public async Task AcceptOrganizationInvite_WhenSucceeds_ReturnsOk()
    {
        var service = new StubOrganizationsService { AcceptInviteResult = new OrganizationsResult<OrganizationMemberResponse>(true, new OrganizationMemberResponse { Username = "dev" }, null) };
        var controller = CreateController(service, "dev", User.RoleUser);

        var result = await controller.AcceptOrganizationInvite(new OrganizationsController.AcceptOrganizationInviteRequest("validtoken"), CancellationToken.None);

        Assert.IsInstanceOfType<OkObjectResult>(result);
    }

    [TestMethod]
    public async Task AcceptOrganizationInvite_WhenInviteNotFound_ReturnsNotFound()
    {
        var service = new StubOrganizationsService { AcceptInviteResult = new OrganizationsResult<OrganizationMemberResponse>(false, null, "Invite not found or already used.") };
        var controller = CreateController(service, "dev", User.RoleUser);

        var result = await controller.AcceptOrganizationInvite(new OrganizationsController.AcceptOrganizationInviteRequest("badtoken"), CancellationToken.None);

        Assert.IsInstanceOfType<NotFoundObjectResult>(result);
    }

    private static OrganizationsController CreateController(StubOrganizationsService service, string? username = null, string? role = null)
    {
        var controller = new OrganizationsController(service)
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

    private sealed class StubOrganizationsService : IOrganizationsService
    {
        public OrganizationsResult<OrganizationListResponse> ExploreResult { get; set; } = new(true, new OrganizationListResponse(), null);
        public OrganizationsResult<OrganizationResponse> GetOrgResult { get; set; } = new(true, new OrganizationResponse(), null);
        public OrganizationsResult<OrganizationResponse> CreateOrgResult { get; set; } = new(true, new OrganizationResponse(), null);
        public OrganizationsResult<OrganizationResponse> UpdateOrgResult { get; set; } = new(true, new OrganizationResponse(), null);
        public OrganizationsResult<string> DeleteOrgResult { get; set; } = new(true, "deleted", null);
        public OrganizationsResult<OrganizationMemberListResponse> GetMembersResult { get; set; } = new(true, new OrganizationMemberListResponse(), null);
        public OrganizationsResult<OrganizationMemberResponse> AddMemberResult { get; set; } = new(true, new OrganizationMemberResponse(), null);
        public OrganizationsResult<string> RemoveMemberResult { get; set; } = new(true, "removed", null);
        public OrganizationsResult<RepositoryListResponse> GetOrgReposResult { get; set; } = new(true, new RepositoryListResponse(), null);
        public OrganizationsResult<RepositoryResponse> CreateOrgRepoResult { get; set; } = new(true, new RepositoryResponse(), null);
        public OrganizationsResult<OrganizationTeamListResponse> GetTeamsResult { get; set; } = new(true, new OrganizationTeamListResponse(), null);
        public OrganizationsResult<OrganizationTeamResponse> GetTeamResult { get; set; } = new(true, new OrganizationTeamResponse(), null);
        public OrganizationsResult<OrganizationTeamResponse> CreateTeamResult { get; set; } = new(true, new OrganizationTeamResponse(), null);
        public OrganizationsResult<OrganizationTeamResponse> UpdateTeamResult { get; set; } = new(true, new OrganizationTeamResponse(), null);
        public OrganizationsResult<string> DeleteTeamResult { get; set; } = new(true, "deleted", null);
        public OrganizationsResult<OrganizationTeamMemberListResponse> GetTeamMembersResult { get; set; } = new(true, new OrganizationTeamMemberListResponse(), null);
        public OrganizationsResult<OrganizationTeamMemberResponse> AddTeamMemberResult { get; set; } = new(true, new OrganizationTeamMemberResponse(), null);
        public OrganizationsResult<string> RemoveTeamMemberResult { get; set; } = new(true, "removed", null);
        public OrganizationsResult<OrganizationTeamRepositoryListResponse> GetTeamReposResult { get; set; } = new(true, new OrganizationTeamRepositoryListResponse(), null);
        public OrganizationsResult<OrganizationTeamRepositoryResponse> SetTeamRepoResult { get; set; } = new(true, new OrganizationTeamRepositoryResponse(), null);
        public OrganizationsResult<string> RemoveTeamRepoResult { get; set; } = new(true, "removed", null);
        public OrganizationsResult<OrganizationInviteResponse> SendInviteResult { get; set; } = new(true, new OrganizationInviteResponse(), null);
        public OrganizationsResult<List<OrganizationInviteResponse>> GetInvitesResult { get; set; } = new(true, new List<OrganizationInviteResponse>(), null);
        public OrganizationsResult<string> CancelInviteResult { get; set; } = new(true, "cancelled", null);
        public OrganizationsResult<OrganizationMemberResponse> AcceptInviteResult { get; set; } = new(true, new OrganizationMemberResponse(), null);

        public Task<OrganizationsResult<OrganizationListResponse>> ExploreOrganizationsAsync(string? search, int page, int pageSize, string? currentUsername, CancellationToken cancellationToken)
            => Task.FromResult(ExploreResult);

        public Task<OrganizationsResult<OrganizationResponse>> GetOrganizationAsync(string name, string? currentUsername, CancellationToken cancellationToken)
            => Task.FromResult(GetOrgResult);

        public Task<OrganizationsResult<OrganizationResponse>> CreateOrganizationAsync(string name, string? displayName, string? description, string? avatarUrl, string? currentUsername, CancellationToken cancellationToken)
            => Task.FromResult(CreateOrgResult);

        public Task<OrganizationsResult<OrganizationResponse>> UpdateOrganizationAsync(string name, string? displayName, string? description, string? avatarUrl, string? currentUsername, string? userRole, CancellationToken cancellationToken)
            => Task.FromResult(UpdateOrgResult);

        public OrganizationsResult<OrganizationResponse> UploadAvatarResult { get; set; } = new(true, new OrganizationResponse(), null);

        public Task<OrganizationsResult<OrganizationResponse>> UploadOrganizationAvatarAsync(string name, Stream fileContent, string? contentType, long fileLength, string? currentUsername, string? userRole, CancellationToken cancellationToken)
            => Task.FromResult(UploadAvatarResult);

        public Task<OrganizationsResult<string>> DeleteOrganizationAsync(string name, string? currentUsername, string? userRole, CancellationToken cancellationToken)
            => Task.FromResult(DeleteOrgResult);

        public Task<OrganizationsResult<OrganizationMemberListResponse>> GetOrganizationMembersAsync(string name, string? currentUsername, string? userRole, CancellationToken cancellationToken)
            => Task.FromResult(GetMembersResult);

        public Task<OrganizationsResult<OrganizationMemberResponse>> AddOrganizationMemberAsync(string name, string identifier, string? role, string? currentUsername, string? userRole, CancellationToken cancellationToken)
            => Task.FromResult(AddMemberResult);

        public Task<OrganizationsResult<string>> RemoveOrganizationMemberAsync(string name, int userId, string? currentUsername, string? userRole, CancellationToken cancellationToken)
            => Task.FromResult(RemoveMemberResult);

        public Task<OrganizationsResult<RepositoryListResponse>> GetOrganizationRepositoriesAsync(string name, string? search, string? visibility, int? minStars, string? sortBy, string? sortDir, int page, int pageSize, string? currentUsername, string? userRole, CancellationToken cancellationToken)
            => Task.FromResult(GetOrgReposResult);

        public Task<OrganizationsResult<RepositoryResponse>> CreateOrganizationRepositoryAsync(string name, string repositoryName, string? description, string visibility, string? currentUsername, string? userRole, CancellationToken cancellationToken)
            => Task.FromResult(CreateOrgRepoResult);

        public Task<OrganizationsResult<OrganizationTeamListResponse>> GetOrganizationTeamsAsync(string orgName, string? currentUsername, string? userRole, CancellationToken cancellationToken)
            => Task.FromResult(GetTeamsResult);

        public Task<OrganizationsResult<OrganizationTeamResponse>> GetOrganizationTeamAsync(string orgName, string teamName, string? currentUsername, string? userRole, CancellationToken cancellationToken)
            => Task.FromResult(GetTeamResult);

        public Task<OrganizationsResult<OrganizationTeamResponse>> CreateOrganizationTeamAsync(string orgName, string teamName, string? description, string? currentUsername, string? userRole, CancellationToken cancellationToken)
            => Task.FromResult(CreateTeamResult);

        public Task<OrganizationsResult<OrganizationTeamResponse>> UpdateOrganizationTeamAsync(string orgName, string teamName, string? newName, string? description, string? currentUsername, string? userRole, CancellationToken cancellationToken)
            => Task.FromResult(UpdateTeamResult);

        public Task<OrganizationsResult<string>> DeleteOrganizationTeamAsync(string orgName, string teamName, string? currentUsername, string? userRole, CancellationToken cancellationToken)
            => Task.FromResult(DeleteTeamResult);

        public Task<OrganizationsResult<OrganizationTeamMemberListResponse>> GetOrganizationTeamMembersAsync(string orgName, string teamName, string? currentUsername, string? userRole, CancellationToken cancellationToken)
            => Task.FromResult(GetTeamMembersResult);

        public Task<OrganizationsResult<OrganizationTeamMemberResponse>> AddOrganizationTeamMemberAsync(string orgName, string teamName, int userId, string? currentUsername, string? userRole, CancellationToken cancellationToken)
            => Task.FromResult(AddTeamMemberResult);

        public Task<OrganizationsResult<string>> RemoveOrganizationTeamMemberAsync(string orgName, string teamName, int userId, string? currentUsername, string? userRole, CancellationToken cancellationToken)
            => Task.FromResult(RemoveTeamMemberResult);

        public Task<OrganizationsResult<OrganizationTeamRepositoryListResponse>> GetOrganizationTeamRepositoriesAsync(string orgName, string teamName, string? currentUsername, string? userRole, CancellationToken cancellationToken)
            => Task.FromResult(GetTeamReposResult);

        public Task<OrganizationsResult<OrganizationTeamRepositoryResponse>> SetOrganizationTeamRepositoryAsync(string orgName, string teamName, int repositoryId, string permission, string? currentUsername, string? userRole, CancellationToken cancellationToken)
            => Task.FromResult(SetTeamRepoResult);

        public Task<OrganizationsResult<string>> RemoveOrganizationTeamRepositoryAsync(string orgName, string teamName, int repositoryId, string? currentUsername, string? userRole, CancellationToken cancellationToken)
            => Task.FromResult(RemoveTeamRepoResult);

        public Task<OrganizationsResult<OrganizationInviteResponse>> SendOrganizationInviteAsync(string orgName, string email, string? role, string? currentUsername, string? userRole, CancellationToken cancellationToken)
            => Task.FromResult(SendInviteResult);

        public Task<OrganizationsResult<List<OrganizationInviteResponse>>> GetOrganizationInvitesAsync(string orgName, string? currentUsername, string? userRole, CancellationToken cancellationToken)
            => Task.FromResult(GetInvitesResult);

        public Task<OrganizationsResult<string>> CancelOrganizationInviteAsync(string orgName, int inviteId, string? currentUsername, string? userRole, CancellationToken cancellationToken)
            => Task.FromResult(CancelInviteResult);

        public Task<OrganizationsResult<OrganizationMemberResponse>> AcceptOrganizationInviteAsync(string token, string? currentUsername, CancellationToken cancellationToken)
            => Task.FromResult(AcceptInviteResult);
    }
}
