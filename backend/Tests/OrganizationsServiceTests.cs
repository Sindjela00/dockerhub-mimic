using backend.Data;
using backend.Models;
using backend.Services;
using Microsoft.EntityFrameworkCore;

namespace backend.Tests;

[TestClass]
public sealed class OrganizationsServiceTests
{
    [TestMethod]
    public async Task CreateOrganizationAsync_WithAuthenticatedUser_CreatesOrganizationAndOwnerMembership()
    {
        using var dbContext = TestHelpers.CreateDbContext();
        var owner = await TestHelpers.AddUserAsync(dbContext, "owner", "owner@example.com");

        var service = new OrganizationsService(dbContext);
        var result = await service.CreateOrganizationAsync("acme", "Acme", "Acme org", null, owner.Username, CancellationToken.None);

        Assert.IsTrue(result.Succeeded);
        Assert.IsNotNull(result.Data);
        Assert.AreEqual("acme", result.Data.Name);
        Assert.AreEqual(OrganizationMember.RoleOwner, result.Data.CurrentUserRole);

        var storedOrg = await dbContext.Organizations.SingleAsync();
        var ownerMember = await dbContext.OrganizationMembers.SingleAsync(m => m.OrganizationId == storedOrg.Id && m.UserId == owner.Id);
        Assert.AreEqual(OrganizationMember.RoleOwner, ownerMember.Role);
    }

    [TestMethod]
    public async Task AddOrganizationMemberAsync_WithOwner_AddsMember()
    {
        using var dbContext = TestHelpers.CreateDbContext();
        var owner = await TestHelpers.AddUserAsync(dbContext, "owner", "owner@example.com");
        var user = await TestHelpers.AddUserAsync(dbContext, "dev", "dev@example.com");
        var organization = await AddOrganizationAsync(dbContext, owner, "acme");

        var service = new OrganizationsService(dbContext);
        var result = await service.AddOrganizationMemberAsync(
            organization.Name,
            user.Username,
            OrganizationMember.RoleAdmin,
            owner.Username,
            User.RoleUser,
            CancellationToken.None);

        Assert.IsTrue(result.Succeeded);
        Assert.IsNotNull(result.Data);
        Assert.AreEqual(user.Username, result.Data.Username);
        Assert.AreEqual(OrganizationMember.RoleAdmin, result.Data.Role);
    }

    [TestMethod]
    public async Task GetOrganizationRepositoriesAsync_PrivateRepoVisibleToOrganizationMember()
    {
        using var dbContext = TestHelpers.CreateDbContext();
        var owner = await TestHelpers.AddUserAsync(dbContext, "owner", "owner@example.com");
        var member = await TestHelpers.AddUserAsync(dbContext, "member", "member@example.com");
        var outsider = await TestHelpers.AddUserAsync(dbContext, "outsider", "outsider@example.com");
        var organization = await AddOrganizationAsync(dbContext, owner, "acme");

        dbContext.OrganizationMembers.Add(new OrganizationMember
        {
            OrganizationId = organization.Id,
            UserId = member.Id,
            Role = OrganizationMember.RoleMember,
            AddedAt = DateTime.UtcNow
        });

        dbContext.Repositories.Add(new Repository
        {
            Name = "private-repo",
            Description = "Private repo",
            Visibility = "private",
            OwnerId = owner.Id,
            OrganizationId = organization.Id,
            CreatedAt = DateTime.UtcNow,
            UpdatedAt = DateTime.UtcNow
        });

        await dbContext.SaveChangesAsync();

        var service = new OrganizationsService(dbContext);
        var memberResult = await service.GetOrganizationRepositoriesAsync(
            organization.Name,
            search: null,
            visibility: null,
            minStars: null,
            sortBy: "name",
            sortDir: "asc",
            page: 1,
            pageSize: 20,
            currentUsername: member.Username,
            userRole: User.RoleUser,
            cancellationToken: CancellationToken.None);

        var outsiderResult = await service.GetOrganizationRepositoriesAsync(
            organization.Name,
            search: null,
            visibility: null,
            minStars: null,
            sortBy: "name",
            sortDir: "asc",
            page: 1,
            pageSize: 20,
            currentUsername: outsider.Username,
            userRole: User.RoleUser,
            cancellationToken: CancellationToken.None);

        Assert.IsTrue(memberResult.Succeeded);
        Assert.IsNotNull(memberResult.Data);
        Assert.AreEqual(1, memberResult.Data.Total);
        Assert.AreEqual("acme/private-repo", memberResult.Data.Repositories[0].FullName);

        Assert.IsTrue(outsiderResult.Succeeded);
        Assert.IsNotNull(outsiderResult.Data);
        Assert.AreEqual(0, outsiderResult.Data.Total);
    }

    [TestMethod]
    public async Task CreateOrganizationRepositoryAsync_WithAdminMember_CreatesRepoUnderOrganizationNamespace()
    {
        using var dbContext = TestHelpers.CreateDbContext();
        var owner = await TestHelpers.AddUserAsync(dbContext, "owner", "owner@example.com");
        var admin = await TestHelpers.AddUserAsync(dbContext, "admin2", "admin2@example.com");
        var organization = await AddOrganizationAsync(dbContext, owner, "acme");

        dbContext.OrganizationMembers.Add(new OrganizationMember
        {
            OrganizationId = organization.Id,
            UserId = admin.Id,
            Role = OrganizationMember.RoleAdmin,
            AddedAt = DateTime.UtcNow
        });
        await dbContext.SaveChangesAsync();

        var service = new OrganizationsService(dbContext);
        var result = await service.CreateOrganizationRepositoryAsync(
            organization.Name,
            "svc",
            "Service image",
            "public",
            admin.Username,
            User.RoleUser,
            CancellationToken.None);

        Assert.IsTrue(result.Succeeded);
        Assert.IsNotNull(result.Data);
        Assert.AreEqual("acme/svc", result.Data.FullName);

        var stored = await dbContext.Repositories.SingleAsync(r => r.Name == "svc");
        Assert.AreEqual(organization.Id, stored.OrganizationId);
    }

    [TestMethod]
    public async Task CreateOrganizationRepositoryAsync_WithRegularMember_CreatesRepo()
    {
        // Any org member (not just admin/owner) should be able to create repos
        using var dbContext = TestHelpers.CreateDbContext();
        var owner = await TestHelpers.AddUserAsync(dbContext, "owner", "owner@example.com");
        var regularMember = await TestHelpers.AddUserAsync(dbContext, "dev", "dev@example.com");
        var organization = await AddOrganizationAsync(dbContext, owner, "acme");

        dbContext.OrganizationMembers.Add(new OrganizationMember
        {
            OrganizationId = organization.Id,
            UserId = regularMember.Id,
            Role = OrganizationMember.RoleMember,
            AddedAt = DateTime.UtcNow
        });
        await dbContext.SaveChangesAsync();

        var service = new OrganizationsService(dbContext);
        var result = await service.CreateOrganizationRepositoryAsync(
            organization.Name, "my-app", "App image", "public",
            regularMember.Username, User.RoleUser, CancellationToken.None);

        Assert.IsTrue(result.Succeeded);
        Assert.IsNotNull(result.Data);
        Assert.AreEqual("acme/my-app", result.Data.FullName);
    }

    [TestMethod]
    public async Task CreateOrganizationTeamAsync_WithOwner_CreatesTeam()
    {
        using var dbContext = TestHelpers.CreateDbContext();
        var owner = await TestHelpers.AddUserAsync(dbContext, "owner", "owner@example.com");
        var organization = await AddOrganizationAsync(dbContext, owner, "acme");

        var service = new OrganizationsService(dbContext);
        var result = await service.CreateOrganizationTeamAsync(
            organization.Name, "backend-team", "Backend developers", owner.Username, User.RoleUser, CancellationToken.None);

        Assert.IsTrue(result.Succeeded);
        Assert.IsNotNull(result.Data);
        Assert.AreEqual("backend-team", result.Data.Name);
        Assert.AreEqual("Backend developers", result.Data.Description);
        Assert.AreEqual("acme", result.Data.OrganizationName);

        var storedTeam = await dbContext.OrganizationTeams.SingleAsync();
        Assert.AreEqual("backend-team", storedTeam.Name);
        Assert.AreEqual(organization.Id, storedTeam.OrganizationId);
    }

    [TestMethod]
    public async Task AddOrganizationTeamMemberAsync_WithOwner_AddsOrgMemberToTeam()
    {
        using var dbContext = TestHelpers.CreateDbContext();
        var owner = await TestHelpers.AddUserAsync(dbContext, "owner", "owner@example.com");
        var dev = await TestHelpers.AddUserAsync(dbContext, "dev", "dev@example.com");
        var organization = await AddOrganizationAsync(dbContext, owner, "acme");

        dbContext.OrganizationMembers.Add(new OrganizationMember
        {
            OrganizationId = organization.Id,
            UserId = dev.Id,
            Role = OrganizationMember.RoleMember,
            AddedAt = DateTime.UtcNow
        });
        await dbContext.SaveChangesAsync();

        var team = new OrganizationTeam
        {
            OrganizationId = organization.Id,
            Name = "backend-team",
            Description = "Backend team",
            CreatedAt = DateTime.UtcNow,
            UpdatedAt = DateTime.UtcNow
        };
        dbContext.OrganizationTeams.Add(team);
        await dbContext.SaveChangesAsync();

        var service = new OrganizationsService(dbContext);
        var result = await service.AddOrganizationTeamMemberAsync(
            organization.Name, team.Name, dev.Id, owner.Username, User.RoleUser, CancellationToken.None);

        Assert.IsTrue(result.Succeeded);
        Assert.IsNotNull(result.Data);
        Assert.AreEqual(dev.Username, result.Data.Username);

        var tm = await dbContext.OrganizationTeamMembers.SingleAsync(m => m.TeamId == team.Id && m.UserId == dev.Id);
        Assert.IsNotNull(tm);
    }

    [TestMethod]
    public async Task SetOrganizationTeamRepositoryAsync_WithOwner_SetsPermission()
    {
        using var dbContext = TestHelpers.CreateDbContext();
        var owner = await TestHelpers.AddUserAsync(dbContext, "owner", "owner@example.com");
        var organization = await AddOrganizationAsync(dbContext, owner, "acme");

        var repo = new Repository
        {
            Name = "api",
            Description = "API repo",
            Visibility = "private",
            OwnerId = owner.Id,
            OrganizationId = organization.Id,
            CreatedAt = DateTime.UtcNow,
            UpdatedAt = DateTime.UtcNow
        };
        dbContext.Repositories.Add(repo);

        var team = new OrganizationTeam
        {
            OrganizationId = organization.Id,
            Name = "backend-team",
            Description = "Backend team",
            CreatedAt = DateTime.UtcNow,
            UpdatedAt = DateTime.UtcNow
        };
        dbContext.OrganizationTeams.Add(team);
        await dbContext.SaveChangesAsync();

        var service = new OrganizationsService(dbContext);
        var result = await service.SetOrganizationTeamRepositoryAsync(
            organization.Name, team.Name, repo.Id, OrganizationTeamRepository.PermissionReadWrite,
            owner.Username, User.RoleUser, CancellationToken.None);

        Assert.IsTrue(result.Succeeded);
        Assert.IsNotNull(result.Data);
        Assert.AreEqual(OrganizationTeamRepository.PermissionReadWrite, result.Data.Permission);
        Assert.AreEqual("acme/api", result.Data.FullName);

        var stored = await dbContext.OrganizationTeamRepositories.SingleAsync(tr => tr.TeamId == team.Id && tr.RepositoryId == repo.Id);
        Assert.AreEqual(OrganizationTeamRepository.PermissionReadWrite, stored.Permission);
    }

    // ---- ExploreOrganizations ----

    [TestMethod]
    public async Task ExploreOrganizationsAsync_ReturnsAllOrganizations()
    {
        using var dbContext = TestHelpers.CreateDbContext();
        var owner = await TestHelpers.AddUserAsync(dbContext, "owner", "owner@example.com");
        await AddOrganizationAsync(dbContext, owner, "alpha");
        await AddOrganizationAsync(dbContext, owner, "beta");

        var service = new OrganizationsService(dbContext);
        var result = await service.ExploreOrganizationsAsync(null, 1, 20, null, CancellationToken.None);

        Assert.IsTrue(result.Succeeded);
        Assert.AreEqual(2, result.Data!.Total);
        Assert.AreEqual(2, result.Data.Organizations.Count);
    }

    [TestMethod]
    public async Task ExploreOrganizationsAsync_WithSearch_FiltersResults()
    {
        using var dbContext = TestHelpers.CreateDbContext();
        var owner = await TestHelpers.AddUserAsync(dbContext, "owner", "owner@example.com");
        await AddOrganizationAsync(dbContext, owner, "acme-corp");
        await AddOrganizationAsync(dbContext, owner, "widgets-inc");

        var service = new OrganizationsService(dbContext);
        var result = await service.ExploreOrganizationsAsync("acme", 1, 20, null, CancellationToken.None);

        Assert.IsTrue(result.Succeeded);
        Assert.AreEqual(1, result.Data!.Total);
        Assert.AreEqual("acme-corp", result.Data.Organizations[0].Name);
    }

    [TestMethod]
    public async Task ExploreOrganizationsAsync_WithLoggedInUser_PopulatesCurrentUserRole()
    {
        using var dbContext = TestHelpers.CreateDbContext();
        var owner = await TestHelpers.AddUserAsync(dbContext, "owner", "owner@example.com");
        await AddOrganizationAsync(dbContext, owner, "acme");

        var service = new OrganizationsService(dbContext);
        var result = await service.ExploreOrganizationsAsync(null, 1, 20, owner.Username, CancellationToken.None);

        Assert.IsTrue(result.Succeeded);
        Assert.AreEqual(OrganizationMember.RoleOwner, result.Data!.Organizations[0].CurrentUserRole);
    }

    // ---- GetOrganization ----

    [TestMethod]
    public async Task GetOrganizationAsync_WithValidName_ReturnsOrganization()
    {
        using var dbContext = TestHelpers.CreateDbContext();
        var owner = await TestHelpers.AddUserAsync(dbContext, "owner", "owner@example.com");
        var org = await AddOrganizationAsync(dbContext, owner, "acme");

        var service = new OrganizationsService(dbContext);
        var result = await service.GetOrganizationAsync("acme", owner.Username, CancellationToken.None);

        Assert.IsTrue(result.Succeeded);
        Assert.IsNotNull(result.Data);
        Assert.AreEqual("acme", result.Data.Name);
        Assert.AreEqual(owner.Username, result.Data.OwnerUsername);
        Assert.AreEqual(OrganizationMember.RoleOwner, result.Data.CurrentUserRole);
    }

    [TestMethod]
    public async Task GetOrganizationAsync_WithNonExistentName_Fails()
    {
        using var dbContext = TestHelpers.CreateDbContext();
        var service = new OrganizationsService(dbContext);
        var result = await service.GetOrganizationAsync("nosuchorg", null, CancellationToken.None);

        Assert.IsFalse(result.Succeeded);
        Assert.AreEqual("Organization not found.", result.ErrorMessage);
    }

    [TestMethod]
    public async Task GetOrganizationAsync_WithAnonymousUser_HasNullCurrentUserRole()
    {
        using var dbContext = TestHelpers.CreateDbContext();
        var owner = await TestHelpers.AddUserAsync(dbContext, "owner", "owner@example.com");
        await AddOrganizationAsync(dbContext, owner, "acme");

        var service = new OrganizationsService(dbContext);
        var result = await service.GetOrganizationAsync("acme", null, CancellationToken.None);

        Assert.IsTrue(result.Succeeded);
        Assert.IsNull(result.Data!.CurrentUserRole);
    }

    // ---- GetOrganizationMembers ----

    [TestMethod]
    public async Task GetOrganizationMembersAsync_AsMember_ReturnsMembers()
    {
        using var dbContext = TestHelpers.CreateDbContext();
        var owner = await TestHelpers.AddUserAsync(dbContext, "owner", "owner@example.com");
        var member = await TestHelpers.AddUserAsync(dbContext, "member", "member@example.com");
        var org = await AddOrganizationAsync(dbContext, owner, "acme");
        dbContext.OrganizationMembers.Add(new OrganizationMember { OrganizationId = org.Id, UserId = member.Id, Role = OrganizationMember.RoleMember, AddedAt = DateTime.UtcNow });
        await dbContext.SaveChangesAsync();

        var service = new OrganizationsService(dbContext);
        var result = await service.GetOrganizationMembersAsync("acme", member.Username, User.RoleUser, CancellationToken.None);

        Assert.IsTrue(result.Succeeded);
        Assert.AreEqual(2, result.Data!.Total);
    }

    [TestMethod]
    public async Task GetOrganizationMembersAsync_AsOutsider_ReturnsForbidden()
    {
        using var dbContext = TestHelpers.CreateDbContext();
        var owner = await TestHelpers.AddUserAsync(dbContext, "owner", "owner@example.com");
        var outsider = await TestHelpers.AddUserAsync(dbContext, "outsider", "outsider@example.com");
        await AddOrganizationAsync(dbContext, owner, "acme");

        var service = new OrganizationsService(dbContext);
        var result = await service.GetOrganizationMembersAsync("acme", outsider.Username, User.RoleUser, CancellationToken.None);

        Assert.IsFalse(result.Succeeded);
        Assert.AreEqual("Forbidden", result.ErrorMessage);
    }

    [TestMethod]
    public async Task GetOrganizationMembersAsync_AsSystemAdmin_ReturnsMembers()
    {
        using var dbContext = TestHelpers.CreateDbContext();
        var owner = await TestHelpers.AddUserAsync(dbContext, "owner", "owner@example.com");
        var admin = await TestHelpers.AddUserAsync(dbContext, "sysadmin", "sysadmin@example.com", User.RoleAdministrator);
        await AddOrganizationAsync(dbContext, owner, "acme");

        var service = new OrganizationsService(dbContext);
        var result = await service.GetOrganizationMembersAsync("acme", admin.Username, User.RoleAdministrator, CancellationToken.None);

        Assert.IsTrue(result.Succeeded);
        Assert.AreEqual(1, result.Data!.Total);
    }

    [TestMethod]
    public async Task GetOrganizationMembersAsync_AsSuperAdmin_ReturnsMembers()
    {
        using var dbContext = TestHelpers.CreateDbContext();
        var owner = await TestHelpers.AddUserAsync(dbContext, "owner", "owner@example.com");
        var superAdmin = await TestHelpers.AddUserAsync(dbContext, "superadmin", "superadmin@example.com", User.RoleSuperAdmin);
        await AddOrganizationAsync(dbContext, owner, "acme");

        var service = new OrganizationsService(dbContext);
        var result = await service.GetOrganizationMembersAsync("acme", superAdmin.Username, User.RoleSuperAdmin, CancellationToken.None);

        Assert.IsTrue(result.Succeeded);
        Assert.AreEqual(1, result.Data!.Total);
    }

    // ---- UpdateOrganization ----

    [TestMethod]
    public async Task UpdateOrganizationAsync_WithOwner_UpdatesDescriptionAndAvatarUrl()
    {
        using var dbContext = TestHelpers.CreateDbContext();
        var owner = await TestHelpers.AddUserAsync(dbContext, "owner", "owner@example.com");
        await AddOrganizationAsync(dbContext, owner, "acme");

        var service = new OrganizationsService(dbContext);
        var result = await service.UpdateOrganizationAsync("acme", "Acme Corp", "Updated desc", "https://example.com/logo.png", owner.Username, User.RoleUser, CancellationToken.None);

        Assert.IsTrue(result.Succeeded);
        Assert.AreEqual("Acme Corp", result.Data!.DisplayName);
        Assert.AreEqual("Updated desc", result.Data.Description);
        Assert.AreEqual("https://example.com/logo.png", result.Data.AvatarUrl);
    }

    [TestMethod]
    public async Task UpdateOrganizationAsync_AsOutsider_ReturnsForbidden()
    {
        using var dbContext = TestHelpers.CreateDbContext();
        var owner = await TestHelpers.AddUserAsync(dbContext, "owner", "owner@example.com");
        var outsider = await TestHelpers.AddUserAsync(dbContext, "outsider", "outsider@example.com");
        await AddOrganizationAsync(dbContext, owner, "acme");

        var service = new OrganizationsService(dbContext);
        var result = await service.UpdateOrganizationAsync("acme", null, "Hacked", null, outsider.Username, User.RoleUser, CancellationToken.None);

        Assert.IsFalse(result.Succeeded);
        Assert.AreEqual("Forbidden", result.ErrorMessage);
    }

    [TestMethod]
    public async Task UpdateOrganizationAsync_NonExistentOrg_Fails()
    {
        using var dbContext = TestHelpers.CreateDbContext();
        var owner = await TestHelpers.AddUserAsync(dbContext, "owner", "owner@example.com");
        var service = new OrganizationsService(dbContext);
        var result = await service.UpdateOrganizationAsync("nosuchorg", "Name", null, null, owner.Username, User.RoleUser, CancellationToken.None);

        Assert.IsFalse(result.Succeeded);
        Assert.AreEqual("Organization not found.", result.ErrorMessage);
    }

    // ---- DeleteOrganization ----

    [TestMethod]
    public async Task DeleteOrganizationAsync_WithOwner_DeletesOrganization()
    {
        using var dbContext = TestHelpers.CreateDbContext();
        var owner = await TestHelpers.AddUserAsync(dbContext, "owner", "owner@example.com");
        await AddOrganizationAsync(dbContext, owner, "acme");

        var service = new OrganizationsService(dbContext);
        var result = await service.DeleteOrganizationAsync("acme", owner.Username, User.RoleUser, CancellationToken.None);

        Assert.IsTrue(result.Succeeded);
        Assert.AreEqual(0, await dbContext.Organizations.CountAsync());
    }

    [TestMethod]
    public async Task DeleteOrganizationAsync_AsOutsider_ReturnsForbidden()
    {
        using var dbContext = TestHelpers.CreateDbContext();
        var owner = await TestHelpers.AddUserAsync(dbContext, "owner", "owner@example.com");
        var outsider = await TestHelpers.AddUserAsync(dbContext, "outsider", "outsider@example.com");
        await AddOrganizationAsync(dbContext, owner, "acme");

        var service = new OrganizationsService(dbContext);
        var result = await service.DeleteOrganizationAsync("acme", outsider.Username, User.RoleUser, CancellationToken.None);

        Assert.IsFalse(result.Succeeded);
        Assert.AreEqual("Forbidden", result.ErrorMessage);
    }

    [TestMethod]
    public async Task DeleteOrganizationAsync_AsOrgAdminNotOwner_ReturnsForbidden()
    {
        // Deactivation is owner-only, unlike other management actions which also allow org admins.
        using var dbContext = TestHelpers.CreateDbContext();
        var owner = await TestHelpers.AddUserAsync(dbContext, "owner", "owner@example.com");
        var orgAdmin = await TestHelpers.AddUserAsync(dbContext, "orgadmin", "orgadmin@example.com");
        var org = await AddOrganizationAsync(dbContext, owner, "acme");

        dbContext.OrganizationMembers.Add(new OrganizationMember
        {
            OrganizationId = org.Id,
            UserId = orgAdmin.Id,
            Role = OrganizationMember.RoleAdmin,
            AddedAt = DateTime.UtcNow
        });
        await dbContext.SaveChangesAsync();

        var service = new OrganizationsService(dbContext);
        var result = await service.DeleteOrganizationAsync("acme", orgAdmin.Username, User.RoleUser, CancellationToken.None);

        Assert.IsFalse(result.Succeeded);
        Assert.AreEqual("Forbidden", result.ErrorMessage);
        Assert.AreEqual(1, await dbContext.Organizations.CountAsync());
    }

    [TestMethod]
    public async Task DeleteOrganizationAsync_NonExistentOrg_Fails()
    {
        using var dbContext = TestHelpers.CreateDbContext();
        var owner = await TestHelpers.AddUserAsync(dbContext, "owner", "owner@example.com");
        var service = new OrganizationsService(dbContext);
        var result = await service.DeleteOrganizationAsync("nosuchorg", owner.Username, User.RoleUser, CancellationToken.None);

        Assert.IsFalse(result.Succeeded);
        Assert.AreEqual("Organization not found.", result.ErrorMessage);
    }

    // ---- RemoveOrganizationMember ----

    [TestMethod]
    public async Task RemoveOrganizationMemberAsync_WithOwner_RemovesMember()
    {
        using var dbContext = TestHelpers.CreateDbContext();
        var owner = await TestHelpers.AddUserAsync(dbContext, "owner", "owner@example.com");
        var member = await TestHelpers.AddUserAsync(dbContext, "member", "member@example.com");
        var org = await AddOrganizationAsync(dbContext, owner, "acme");
        dbContext.OrganizationMembers.Add(new OrganizationMember { OrganizationId = org.Id, UserId = member.Id, Role = OrganizationMember.RoleMember, AddedAt = DateTime.UtcNow });
        await dbContext.SaveChangesAsync();

        var service = new OrganizationsService(dbContext);
        var result = await service.RemoveOrganizationMemberAsync("acme", member.Id, owner.Username, User.RoleUser, CancellationToken.None);

        Assert.IsTrue(result.Succeeded);
        Assert.AreEqual(1, await dbContext.OrganizationMembers.CountAsync()); // only owner remains
    }

    [TestMethod]
    public async Task RemoveOrganizationMemberAsync_OwnerCannotBeRemoved()
    {
        using var dbContext = TestHelpers.CreateDbContext();
        var owner = await TestHelpers.AddUserAsync(dbContext, "owner", "owner@example.com");
        var org = await AddOrganizationAsync(dbContext, owner, "acme");

        var service = new OrganizationsService(dbContext);
        var result = await service.RemoveOrganizationMemberAsync("acme", owner.Id, owner.Username, User.RoleUser, CancellationToken.None);

        Assert.IsFalse(result.Succeeded);
        Assert.AreEqual("Organization owner cannot be removed.", result.ErrorMessage);
    }

    [TestMethod]
    public async Task RemoveOrganizationMemberAsync_NonExistentMember_Fails()
    {
        using var dbContext = TestHelpers.CreateDbContext();
        var owner = await TestHelpers.AddUserAsync(dbContext, "owner", "owner@example.com");
        await AddOrganizationAsync(dbContext, owner, "acme");

        var service = new OrganizationsService(dbContext);
        var result = await service.RemoveOrganizationMemberAsync("acme", 9999, owner.Username, User.RoleUser, CancellationToken.None);

        Assert.IsFalse(result.Succeeded);
        Assert.AreEqual("Member not found.", result.ErrorMessage);
    }

    // ---- GetOrganizationTeams ----

    [TestMethod]
    public async Task GetOrganizationTeamsAsync_AsMember_ReturnsTeams()
    {
        using var dbContext = TestHelpers.CreateDbContext();
        var owner = await TestHelpers.AddUserAsync(dbContext, "owner", "owner@example.com");
        var org = await AddOrganizationAsync(dbContext, owner, "acme");
        dbContext.OrganizationTeams.Add(new OrganizationTeam { OrganizationId = org.Id, Name = "backend", Description = "", CreatedAt = DateTime.UtcNow, UpdatedAt = DateTime.UtcNow });
        dbContext.OrganizationTeams.Add(new OrganizationTeam { OrganizationId = org.Id, Name = "frontend", Description = "", CreatedAt = DateTime.UtcNow, UpdatedAt = DateTime.UtcNow });
        await dbContext.SaveChangesAsync();

        var service = new OrganizationsService(dbContext);
        var result = await service.GetOrganizationTeamsAsync("acme", owner.Username, User.RoleUser, CancellationToken.None);

        Assert.IsTrue(result.Succeeded);
        Assert.AreEqual(2, result.Data!.Total);
        Assert.AreEqual("acme", result.Data.OrganizationName);
    }

    [TestMethod]
    public async Task GetOrganizationTeamsAsync_AsOutsider_ReturnsForbidden()
    {
        using var dbContext = TestHelpers.CreateDbContext();
        var owner = await TestHelpers.AddUserAsync(dbContext, "owner", "owner@example.com");
        var outsider = await TestHelpers.AddUserAsync(dbContext, "outsider", "outsider@example.com");
        await AddOrganizationAsync(dbContext, owner, "acme");

        var service = new OrganizationsService(dbContext);
        var result = await service.GetOrganizationTeamsAsync("acme", outsider.Username, User.RoleUser, CancellationToken.None);

        Assert.IsFalse(result.Succeeded);
        Assert.AreEqual("Forbidden", result.ErrorMessage);
    }

    // ---- GetOrganizationTeam ----

    [TestMethod]
    public async Task GetOrganizationTeamAsync_AsMember_ReturnsTeam()
    {
        using var dbContext = TestHelpers.CreateDbContext();
        var owner = await TestHelpers.AddUserAsync(dbContext, "owner", "owner@example.com");
        var org = await AddOrganizationAsync(dbContext, owner, "acme");
        dbContext.OrganizationTeams.Add(new OrganizationTeam { OrganizationId = org.Id, Name = "backend", Description = "BE team", CreatedAt = DateTime.UtcNow, UpdatedAt = DateTime.UtcNow });
        await dbContext.SaveChangesAsync();

        var service = new OrganizationsService(dbContext);
        var result = await service.GetOrganizationTeamAsync("acme", "backend", owner.Username, User.RoleUser, CancellationToken.None);

        Assert.IsTrue(result.Succeeded);
        Assert.AreEqual("backend", result.Data!.Name);
        Assert.AreEqual("BE team", result.Data.Description);
    }

    [TestMethod]
    public async Task GetOrganizationTeamAsync_NonExistentTeam_Fails()
    {
        using var dbContext = TestHelpers.CreateDbContext();
        var owner = await TestHelpers.AddUserAsync(dbContext, "owner", "owner@example.com");
        await AddOrganizationAsync(dbContext, owner, "acme");

        var service = new OrganizationsService(dbContext);
        var result = await service.GetOrganizationTeamAsync("acme", "nosuchteam", owner.Username, User.RoleUser, CancellationToken.None);

        Assert.IsFalse(result.Succeeded);
        Assert.AreEqual("Team not found.", result.ErrorMessage);
    }

    // ---- UpdateOrganizationTeam ----

    [TestMethod]
    public async Task UpdateOrganizationTeamAsync_WithOwner_UpdatesNameAndDescription()
    {
        using var dbContext = TestHelpers.CreateDbContext();
        var owner = await TestHelpers.AddUserAsync(dbContext, "owner", "owner@example.com");
        var org = await AddOrganizationAsync(dbContext, owner, "acme");
        var team = new OrganizationTeam { OrganizationId = org.Id, Name = "old-name", Description = "old desc", CreatedAt = DateTime.UtcNow, UpdatedAt = DateTime.UtcNow };
        dbContext.OrganizationTeams.Add(team);
        await dbContext.SaveChangesAsync();

        var service = new OrganizationsService(dbContext);
        var result = await service.UpdateOrganizationTeamAsync("acme", "old-name", "new-name", "new desc", owner.Username, User.RoleUser, CancellationToken.None);

        Assert.IsTrue(result.Succeeded);
        Assert.AreEqual("new-name", result.Data!.Name);
        Assert.AreEqual("new desc", result.Data.Description);
    }

    [TestMethod]
    public async Task UpdateOrganizationTeamAsync_AsOutsider_ReturnsForbidden()
    {
        using var dbContext = TestHelpers.CreateDbContext();
        var owner = await TestHelpers.AddUserAsync(dbContext, "owner", "owner@example.com");
        var outsider = await TestHelpers.AddUserAsync(dbContext, "outsider", "outsider@example.com");
        var org = await AddOrganizationAsync(dbContext, owner, "acme");
        dbContext.OrganizationTeams.Add(new OrganizationTeam { OrganizationId = org.Id, Name = "backend", Description = "", CreatedAt = DateTime.UtcNow, UpdatedAt = DateTime.UtcNow });
        await dbContext.SaveChangesAsync();

        var service = new OrganizationsService(dbContext);
        var result = await service.UpdateOrganizationTeamAsync("acme", "backend", "hacked", null, outsider.Username, User.RoleUser, CancellationToken.None);

        Assert.IsFalse(result.Succeeded);
        Assert.AreEqual("Forbidden", result.ErrorMessage);
    }

    [TestMethod]
    public async Task UpdateOrganizationTeamAsync_DuplicateName_Fails()
    {
        using var dbContext = TestHelpers.CreateDbContext();
        var owner = await TestHelpers.AddUserAsync(dbContext, "owner", "owner@example.com");
        var org = await AddOrganizationAsync(dbContext, owner, "acme");
        dbContext.OrganizationTeams.Add(new OrganizationTeam { OrganizationId = org.Id, Name = "team-a", Description = "", CreatedAt = DateTime.UtcNow, UpdatedAt = DateTime.UtcNow });
        dbContext.OrganizationTeams.Add(new OrganizationTeam { OrganizationId = org.Id, Name = "team-b", Description = "", CreatedAt = DateTime.UtcNow, UpdatedAt = DateTime.UtcNow });
        await dbContext.SaveChangesAsync();

        var service = new OrganizationsService(dbContext);
        var result = await service.UpdateOrganizationTeamAsync("acme", "team-a", "team-b", null, owner.Username, User.RoleUser, CancellationToken.None);

        Assert.IsFalse(result.Succeeded);
        Assert.AreEqual("Team with this name already exists in the organization.", result.ErrorMessage);
    }

    // ---- DeleteOrganizationTeam ----

    [TestMethod]
    public async Task DeleteOrganizationTeamAsync_WithOwner_DeletesTeam()
    {
        using var dbContext = TestHelpers.CreateDbContext();
        var owner = await TestHelpers.AddUserAsync(dbContext, "owner", "owner@example.com");
        var org = await AddOrganizationAsync(dbContext, owner, "acme");
        dbContext.OrganizationTeams.Add(new OrganizationTeam { OrganizationId = org.Id, Name = "backend", Description = "", CreatedAt = DateTime.UtcNow, UpdatedAt = DateTime.UtcNow });
        await dbContext.SaveChangesAsync();

        var service = new OrganizationsService(dbContext);
        var result = await service.DeleteOrganizationTeamAsync("acme", "backend", owner.Username, User.RoleUser, CancellationToken.None);

        Assert.IsTrue(result.Succeeded);
        Assert.AreEqual(0, await dbContext.OrganizationTeams.CountAsync());
    }

    [TestMethod]
    public async Task DeleteOrganizationTeamAsync_AsOutsider_ReturnsForbidden()
    {
        using var dbContext = TestHelpers.CreateDbContext();
        var owner = await TestHelpers.AddUserAsync(dbContext, "owner", "owner@example.com");
        var outsider = await TestHelpers.AddUserAsync(dbContext, "outsider", "outsider@example.com");
        var org = await AddOrganizationAsync(dbContext, owner, "acme");
        dbContext.OrganizationTeams.Add(new OrganizationTeam { OrganizationId = org.Id, Name = "backend", Description = "", CreatedAt = DateTime.UtcNow, UpdatedAt = DateTime.UtcNow });
        await dbContext.SaveChangesAsync();

        var service = new OrganizationsService(dbContext);
        var result = await service.DeleteOrganizationTeamAsync("acme", "backend", outsider.Username, User.RoleUser, CancellationToken.None);

        Assert.IsFalse(result.Succeeded);
        Assert.AreEqual("Forbidden", result.ErrorMessage);
    }

    // ---- GetOrganizationTeamMembers ----

    [TestMethod]
    public async Task GetOrganizationTeamMembersAsync_AsMember_ReturnsMembers()
    {
        using var dbContext = TestHelpers.CreateDbContext();
        var owner = await TestHelpers.AddUserAsync(dbContext, "owner", "owner@example.com");
        var dev = await TestHelpers.AddUserAsync(dbContext, "dev", "dev@example.com");
        var org = await AddOrganizationAsync(dbContext, owner, "acme");
        dbContext.OrganizationMembers.Add(new OrganizationMember { OrganizationId = org.Id, UserId = dev.Id, Role = OrganizationMember.RoleMember, AddedAt = DateTime.UtcNow });
        var team = new OrganizationTeam { OrganizationId = org.Id, Name = "backend", Description = "", CreatedAt = DateTime.UtcNow, UpdatedAt = DateTime.UtcNow };
        dbContext.OrganizationTeams.Add(team);
        await dbContext.SaveChangesAsync();
        dbContext.OrganizationTeamMembers.Add(new OrganizationTeamMember { TeamId = team.Id, UserId = dev.Id, AddedAt = DateTime.UtcNow });
        await dbContext.SaveChangesAsync();

        var service = new OrganizationsService(dbContext);
        var result = await service.GetOrganizationTeamMembersAsync("acme", "backend", owner.Username, User.RoleUser, CancellationToken.None);

        Assert.IsTrue(result.Succeeded);
        Assert.AreEqual(1, result.Data!.Total);
        Assert.AreEqual(dev.Username, result.Data.Members[0].Username);
    }

    [TestMethod]
    public async Task GetOrganizationTeamMembersAsync_AsOutsider_ReturnsForbidden()
    {
        using var dbContext = TestHelpers.CreateDbContext();
        var owner = await TestHelpers.AddUserAsync(dbContext, "owner", "owner@example.com");
        var outsider = await TestHelpers.AddUserAsync(dbContext, "outsider", "outsider@example.com");
        var org = await AddOrganizationAsync(dbContext, owner, "acme");
        dbContext.OrganizationTeams.Add(new OrganizationTeam { OrganizationId = org.Id, Name = "backend", Description = "", CreatedAt = DateTime.UtcNow, UpdatedAt = DateTime.UtcNow });
        await dbContext.SaveChangesAsync();

        var service = new OrganizationsService(dbContext);
        var result = await service.GetOrganizationTeamMembersAsync("acme", "backend", outsider.Username, User.RoleUser, CancellationToken.None);

        Assert.IsFalse(result.Succeeded);
        Assert.AreEqual("Forbidden", result.ErrorMessage);
    }

    // ---- RemoveOrganizationTeamMember ----

    [TestMethod]
    public async Task RemoveOrganizationTeamMemberAsync_WithOwner_RemovesTeamMember()
    {
        using var dbContext = TestHelpers.CreateDbContext();
        var owner = await TestHelpers.AddUserAsync(dbContext, "owner", "owner@example.com");
        var dev = await TestHelpers.AddUserAsync(dbContext, "dev", "dev@example.com");
        var org = await AddOrganizationAsync(dbContext, owner, "acme");
        dbContext.OrganizationMembers.Add(new OrganizationMember { OrganizationId = org.Id, UserId = dev.Id, Role = OrganizationMember.RoleMember, AddedAt = DateTime.UtcNow });
        var team = new OrganizationTeam { OrganizationId = org.Id, Name = "backend", Description = "", CreatedAt = DateTime.UtcNow, UpdatedAt = DateTime.UtcNow };
        dbContext.OrganizationTeams.Add(team);
        await dbContext.SaveChangesAsync();
        dbContext.OrganizationTeamMembers.Add(new OrganizationTeamMember { TeamId = team.Id, UserId = dev.Id, AddedAt = DateTime.UtcNow });
        await dbContext.SaveChangesAsync();

        var service = new OrganizationsService(dbContext);
        var result = await service.RemoveOrganizationTeamMemberAsync("acme", "backend", dev.Id, owner.Username, User.RoleUser, CancellationToken.None);

        Assert.IsTrue(result.Succeeded);
        Assert.AreEqual(0, await dbContext.OrganizationTeamMembers.CountAsync());
    }

    [TestMethod]
    public async Task RemoveOrganizationTeamMemberAsync_NonExistentMember_Fails()
    {
        using var dbContext = TestHelpers.CreateDbContext();
        var owner = await TestHelpers.AddUserAsync(dbContext, "owner", "owner@example.com");
        var org = await AddOrganizationAsync(dbContext, owner, "acme");
        dbContext.OrganizationTeams.Add(new OrganizationTeam { OrganizationId = org.Id, Name = "backend", Description = "", CreatedAt = DateTime.UtcNow, UpdatedAt = DateTime.UtcNow });
        await dbContext.SaveChangesAsync();

        var service = new OrganizationsService(dbContext);
        var result = await service.RemoveOrganizationTeamMemberAsync("acme", "backend", 9999, owner.Username, User.RoleUser, CancellationToken.None);

        Assert.IsFalse(result.Succeeded);
        Assert.AreEqual("Team member not found.", result.ErrorMessage);
    }

    // ---- GetOrganizationTeamRepositories ----

    [TestMethod]
    public async Task GetOrganizationTeamRepositoriesAsync_AsMember_ReturnsRepositories()
    {
        using var dbContext = TestHelpers.CreateDbContext();
        var owner = await TestHelpers.AddUserAsync(dbContext, "owner", "owner@example.com");
        var org = await AddOrganizationAsync(dbContext, owner, "acme");
        var repo = new Repository { Name = "api", Description = "", Visibility = "private", OwnerId = owner.Id, OrganizationId = org.Id, CreatedAt = DateTime.UtcNow, UpdatedAt = DateTime.UtcNow };
        dbContext.Repositories.Add(repo);
        var team = new OrganizationTeam { OrganizationId = org.Id, Name = "backend", Description = "", CreatedAt = DateTime.UtcNow, UpdatedAt = DateTime.UtcNow };
        dbContext.OrganizationTeams.Add(team);
        await dbContext.SaveChangesAsync();
        dbContext.OrganizationTeamRepositories.Add(new OrganizationTeamRepository { TeamId = team.Id, RepositoryId = repo.Id, Permission = OrganizationTeamRepository.PermissionReadOnly });
        await dbContext.SaveChangesAsync();

        var service = new OrganizationsService(dbContext);
        var result = await service.GetOrganizationTeamRepositoriesAsync("acme", "backend", owner.Username, User.RoleUser, CancellationToken.None);

        Assert.IsTrue(result.Succeeded);
        Assert.AreEqual(1, result.Data!.Total);
        Assert.AreEqual(OrganizationTeamRepository.PermissionReadOnly, result.Data.Repositories[0].Permission);
        Assert.AreEqual("acme/api", result.Data.Repositories[0].FullName);
    }

    // ---- RemoveOrganizationTeamRepository ----

    [TestMethod]
    public async Task RemoveOrganizationTeamRepositoryAsync_WithOwner_RemovesEntry()
    {
        using var dbContext = TestHelpers.CreateDbContext();
        var owner = await TestHelpers.AddUserAsync(dbContext, "owner", "owner@example.com");
        var org = await AddOrganizationAsync(dbContext, owner, "acme");
        var repo = new Repository { Name = "api", Description = "", Visibility = "private", OwnerId = owner.Id, OrganizationId = org.Id, CreatedAt = DateTime.UtcNow, UpdatedAt = DateTime.UtcNow };
        dbContext.Repositories.Add(repo);
        var team = new OrganizationTeam { OrganizationId = org.Id, Name = "backend", Description = "", CreatedAt = DateTime.UtcNow, UpdatedAt = DateTime.UtcNow };
        dbContext.OrganizationTeams.Add(team);
        await dbContext.SaveChangesAsync();
        dbContext.OrganizationTeamRepositories.Add(new OrganizationTeamRepository { TeamId = team.Id, RepositoryId = repo.Id, Permission = OrganizationTeamRepository.PermissionReadOnly });
        await dbContext.SaveChangesAsync();

        var service = new OrganizationsService(dbContext);
        var result = await service.RemoveOrganizationTeamRepositoryAsync("acme", "backend", repo.Id, owner.Username, User.RoleUser, CancellationToken.None);

        Assert.IsTrue(result.Succeeded);
        Assert.AreEqual(0, await dbContext.OrganizationTeamRepositories.CountAsync());
    }

    [TestMethod]
    public async Task RemoveOrganizationTeamRepositoryAsync_NotAssigned_Fails()
    {
        using var dbContext = TestHelpers.CreateDbContext();
        var owner = await TestHelpers.AddUserAsync(dbContext, "owner", "owner@example.com");
        var org = await AddOrganizationAsync(dbContext, owner, "acme");
        var team = new OrganizationTeam { OrganizationId = org.Id, Name = "backend", Description = "", CreatedAt = DateTime.UtcNow, UpdatedAt = DateTime.UtcNow };
        dbContext.OrganizationTeams.Add(team);
        await dbContext.SaveChangesAsync();

        var service = new OrganizationsService(dbContext);
        var result = await service.RemoveOrganizationTeamRepositoryAsync("acme", "backend", 9999, owner.Username, User.RoleUser, CancellationToken.None);

        Assert.IsFalse(result.Succeeded);
        Assert.AreEqual("Repository not assigned to this team.", result.ErrorMessage);
    }

    // ---- SetOrganizationTeamRepository (error paths) ----

    [TestMethod]
    public async Task SetOrganizationTeamRepositoryAsync_InvalidPermission_Fails()
    {
        using var dbContext = TestHelpers.CreateDbContext();
        var owner = await TestHelpers.AddUserAsync(dbContext, "owner", "owner@example.com");
        var org = await AddOrganizationAsync(dbContext, owner, "acme");
        var repo = new Repository { Name = "api", Description = "", Visibility = "private", OwnerId = owner.Id, OrganizationId = org.Id, CreatedAt = DateTime.UtcNow, UpdatedAt = DateTime.UtcNow };
        dbContext.Repositories.Add(repo);
        var team = new OrganizationTeam { OrganizationId = org.Id, Name = "backend", Description = "", CreatedAt = DateTime.UtcNow, UpdatedAt = DateTime.UtcNow };
        dbContext.OrganizationTeams.Add(team);
        await dbContext.SaveChangesAsync();

        var service = new OrganizationsService(dbContext);
        var result = await service.SetOrganizationTeamRepositoryAsync("acme", "backend", repo.Id, "superwrite", owner.Username, User.RoleUser, CancellationToken.None);

        Assert.IsFalse(result.Succeeded);
        Assert.AreEqual("Permission must be 'read-only', 'read+write', or 'admin'.", result.ErrorMessage);
    }

    [TestMethod]
    public async Task SetOrganizationTeamRepositoryAsync_RepoNotInOrg_Fails()
    {
        using var dbContext = TestHelpers.CreateDbContext();
        var owner = await TestHelpers.AddUserAsync(dbContext, "owner", "owner@example.com");
        var org = await AddOrganizationAsync(dbContext, owner, "acme");
        var team = new OrganizationTeam { OrganizationId = org.Id, Name = "backend", Description = "", CreatedAt = DateTime.UtcNow, UpdatedAt = DateTime.UtcNow };
        dbContext.OrganizationTeams.Add(team);
        await dbContext.SaveChangesAsync();

        var service = new OrganizationsService(dbContext);
        var result = await service.SetOrganizationTeamRepositoryAsync("acme", "backend", 9999, OrganizationTeamRepository.PermissionReadOnly, owner.Username, User.RoleUser, CancellationToken.None);

        Assert.IsFalse(result.Succeeded);
        Assert.AreEqual("Repository not found in this organization.", result.ErrorMessage);
    }

    [TestMethod]
    public async Task SetOrganizationTeamRepositoryAsync_UpdatesExistingPermission()
    {
        using var dbContext = TestHelpers.CreateDbContext();
        var owner = await TestHelpers.AddUserAsync(dbContext, "owner", "owner@example.com");
        var org = await AddOrganizationAsync(dbContext, owner, "acme");
        var repo = new Repository { Name = "api", Description = "", Visibility = "private", OwnerId = owner.Id, OrganizationId = org.Id, CreatedAt = DateTime.UtcNow, UpdatedAt = DateTime.UtcNow };
        dbContext.Repositories.Add(repo);
        var team = new OrganizationTeam { OrganizationId = org.Id, Name = "backend", Description = "", CreatedAt = DateTime.UtcNow, UpdatedAt = DateTime.UtcNow };
        dbContext.OrganizationTeams.Add(team);
        await dbContext.SaveChangesAsync();
        dbContext.OrganizationTeamRepositories.Add(new OrganizationTeamRepository { TeamId = team.Id, RepositoryId = repo.Id, Permission = OrganizationTeamRepository.PermissionReadOnly });
        await dbContext.SaveChangesAsync();

        var service = new OrganizationsService(dbContext);
        var result = await service.SetOrganizationTeamRepositoryAsync("acme", "backend", repo.Id, OrganizationTeamRepository.PermissionAdmin, owner.Username, User.RoleUser, CancellationToken.None);

        Assert.IsTrue(result.Succeeded);
        Assert.AreEqual(OrganizationTeamRepository.PermissionAdmin, result.Data!.Permission);
        Assert.AreEqual(1, await dbContext.OrganizationTeamRepositories.CountAsync()); // still just one entry
    }

    // ---- GetOrganizationRepositories (additional paths) ----

    [TestMethod]
    public async Task GetOrganizationRepositoriesAsync_WithSearchAndVisibilityFilter()
    {
        using var dbContext = TestHelpers.CreateDbContext();
        var owner = await TestHelpers.AddUserAsync(dbContext, "owner", "owner@example.com");
        var org = await AddOrganizationAsync(dbContext, owner, "acme");
        dbContext.Repositories.Add(new Repository { Name = "public-api", Description = "", Visibility = "public", OwnerId = owner.Id, OrganizationId = org.Id, CreatedAt = DateTime.UtcNow, UpdatedAt = DateTime.UtcNow });
        dbContext.Repositories.Add(new Repository { Name = "private-api", Description = "", Visibility = "private", OwnerId = owner.Id, OrganizationId = org.Id, CreatedAt = DateTime.UtcNow, UpdatedAt = DateTime.UtcNow });
        dbContext.Repositories.Add(new Repository { Name = "frontend-app", Description = "", Visibility = "public", OwnerId = owner.Id, OrganizationId = org.Id, CreatedAt = DateTime.UtcNow, UpdatedAt = DateTime.UtcNow });
        await dbContext.SaveChangesAsync();

        var service = new OrganizationsService(dbContext);
        var result = await service.GetOrganizationRepositoriesAsync("acme", "api", "public", null, null, null, 1, 20, owner.Username, User.RoleUser, CancellationToken.None);

        Assert.IsTrue(result.Succeeded);
        Assert.AreEqual(1, result.Data!.Total);
        Assert.AreEqual("acme/public-api", result.Data.Repositories[0].FullName);
    }

    // ---- AddOrganizationMember (error paths) ----

    [TestMethod]
    public async Task AddOrganizationMemberAsync_InvalidRole_Fails()
    {
        using var dbContext = TestHelpers.CreateDbContext();
        var owner = await TestHelpers.AddUserAsync(dbContext, "owner", "owner@example.com");
        var dev = await TestHelpers.AddUserAsync(dbContext, "dev", "dev@example.com");
        var org = await AddOrganizationAsync(dbContext, owner, "acme");

        var service = new OrganizationsService(dbContext);
        var result = await service.AddOrganizationMemberAsync("acme", dev.Username, "superadmin", owner.Username, User.RoleUser, CancellationToken.None);

        Assert.IsFalse(result.Succeeded);
        Assert.AreEqual("Organization role must be 'owner', 'admin', or 'member'.", result.ErrorMessage);
    }

    [TestMethod]
    public async Task AddOrganizationMemberAsync_UserNotFound_Fails()
    {
        using var dbContext = TestHelpers.CreateDbContext();
        var owner = await TestHelpers.AddUserAsync(dbContext, "owner", "owner@example.com");
        await AddOrganizationAsync(dbContext, owner, "acme");

        var service = new OrganizationsService(dbContext);
        var result = await service.AddOrganizationMemberAsync("acme", "ghostuser", OrganizationMember.RoleMember, owner.Username, User.RoleUser, CancellationToken.None);

        Assert.IsFalse(result.Succeeded);
        Assert.AreEqual("User not found.", result.ErrorMessage);
    }

    [TestMethod]
    public async Task AddOrganizationMemberAsync_UpdatesExistingMemberRole()
    {
        using var dbContext = TestHelpers.CreateDbContext();
        var owner = await TestHelpers.AddUserAsync(dbContext, "owner", "owner@example.com");
        var dev = await TestHelpers.AddUserAsync(dbContext, "dev", "dev@example.com");
        var org = await AddOrganizationAsync(dbContext, owner, "acme");
        dbContext.OrganizationMembers.Add(new OrganizationMember { OrganizationId = org.Id, UserId = dev.Id, Role = OrganizationMember.RoleMember, AddedAt = DateTime.UtcNow });
        await dbContext.SaveChangesAsync();

        var service = new OrganizationsService(dbContext);
        var result = await service.AddOrganizationMemberAsync("acme", dev.Username, OrganizationMember.RoleAdmin, owner.Username, User.RoleUser, CancellationToken.None);

        Assert.IsTrue(result.Succeeded);
        Assert.AreEqual(OrganizationMember.RoleAdmin, result.Data!.Role);
        Assert.AreEqual(2, await dbContext.OrganizationMembers.CountAsync()); // no duplicate
    }

    // ---- CreateOrganization (error paths) ----

    [TestMethod]
    public async Task CreateOrganizationAsync_DuplicateName_Fails()
    {
        using var dbContext = TestHelpers.CreateDbContext();
        var owner = await TestHelpers.AddUserAsync(dbContext, "owner", "owner@example.com");
        await AddOrganizationAsync(dbContext, owner, "acme");

        var service = new OrganizationsService(dbContext);
        var result = await service.CreateOrganizationAsync("acme", null, null, null, owner.Username, CancellationToken.None);

        Assert.IsFalse(result.Succeeded);
        Assert.AreEqual("Organization with this name already exists.", result.ErrorMessage);
    }

    [TestMethod]
    public async Task CreateOrganizationAsync_Unauthenticated_Fails()
    {
        using var dbContext = TestHelpers.CreateDbContext();
        var service = new OrganizationsService(dbContext);
        var result = await service.CreateOrganizationAsync("acme", null, null, null, null, CancellationToken.None);

        Assert.IsFalse(result.Succeeded);
        Assert.AreEqual("Unauthorized", result.ErrorMessage);
    }

    // ---- AddOrganizationTeamMember (error paths) ----

    [TestMethod]
    public async Task AddOrganizationTeamMemberAsync_UserNotOrgMember_Fails()
    {
        using var dbContext = TestHelpers.CreateDbContext();
        var owner = await TestHelpers.AddUserAsync(dbContext, "owner", "owner@example.com");
        var outsider = await TestHelpers.AddUserAsync(dbContext, "outsider", "outsider@example.com");
        var org = await AddOrganizationAsync(dbContext, owner, "acme");
        var team = new OrganizationTeam { OrganizationId = org.Id, Name = "backend", Description = "", CreatedAt = DateTime.UtcNow, UpdatedAt = DateTime.UtcNow };
        dbContext.OrganizationTeams.Add(team);
        await dbContext.SaveChangesAsync();

        var service = new OrganizationsService(dbContext);
        var result = await service.AddOrganizationTeamMemberAsync("acme", "backend", outsider.Id, owner.Username, User.RoleUser, CancellationToken.None);

        Assert.IsFalse(result.Succeeded);
        Assert.AreEqual("User is not a member of the organization.", result.ErrorMessage);
    }

    // ---- CreateOrganizationRepository (additional error paths) ----

    [TestMethod]
    public async Task CreateOrganizationRepositoryAsync_EmptyName_Fails()
    {
        using var dbContext = TestHelpers.CreateDbContext();
        var owner = await TestHelpers.AddUserAsync(dbContext, "owner", "owner@example.com");
        await AddOrganizationAsync(dbContext, owner, "acme");

        var service = new OrganizationsService(dbContext);
        var result = await service.CreateOrganizationRepositoryAsync("acme", "", null, "public", owner.Username, User.RoleUser, CancellationToken.None);

        Assert.IsFalse(result.Succeeded);
        Assert.AreEqual("Repository name is required.", result.ErrorMessage);
    }

    [TestMethod]
    public async Task CreateOrganizationRepositoryAsync_InvalidVisibility_Fails()
    {
        using var dbContext = TestHelpers.CreateDbContext();
        var owner = await TestHelpers.AddUserAsync(dbContext, "owner", "owner@example.com");
        await AddOrganizationAsync(dbContext, owner, "acme");

        var service = new OrganizationsService(dbContext);
        var result = await service.CreateOrganizationRepositoryAsync("acme", "myrepo", null, "protected", owner.Username, User.RoleUser, CancellationToken.None);

        Assert.IsFalse(result.Succeeded);
        Assert.AreEqual("Visibility must be 'public' or 'private'.", result.ErrorMessage);
    }

    [TestMethod]
    public async Task CreateOrganizationRepositoryAsync_DuplicateRepo_Fails()
    {
        using var dbContext = TestHelpers.CreateDbContext();
        var owner = await TestHelpers.AddUserAsync(dbContext, "owner", "owner@example.com");
        var org = await AddOrganizationAsync(dbContext, owner, "acme");
        dbContext.Repositories.Add(new Repository { Name = "api", Description = "", Visibility = "public", OwnerId = owner.Id, OrganizationId = org.Id, CreatedAt = DateTime.UtcNow, UpdatedAt = DateTime.UtcNow });
        await dbContext.SaveChangesAsync();

        var service = new OrganizationsService(dbContext);
        var result = await service.CreateOrganizationRepositoryAsync("acme", "api", null, "public", owner.Username, User.RoleUser, CancellationToken.None);

        Assert.IsFalse(result.Succeeded);
        Assert.AreEqual("Repository with this name already exists in the organization.", result.ErrorMessage);
    }

    [TestMethod]
    public async Task CreateOrganizationRepositoryAsync_NonExistentOrg_Fails()
    {
        using var dbContext = TestHelpers.CreateDbContext();
        var owner = await TestHelpers.AddUserAsync(dbContext, "owner", "owner@example.com");

        var service = new OrganizationsService(dbContext);
        var result = await service.CreateOrganizationRepositoryAsync("nosuch", "api", null, "public", owner.Username, User.RoleUser, CancellationToken.None);

        Assert.IsFalse(result.Succeeded);
        Assert.AreEqual("Organization not found.", result.ErrorMessage);
    }

    [TestMethod]
    public async Task CreateOrganizationRepositoryAsync_AsOutsider_ReturnsForbidden()
    {
        using var dbContext = TestHelpers.CreateDbContext();
        var owner = await TestHelpers.AddUserAsync(dbContext, "owner", "owner@example.com");
        var outsider = await TestHelpers.AddUserAsync(dbContext, "outsider", "outsider@example.com");
        await AddOrganizationAsync(dbContext, owner, "acme");

        var service = new OrganizationsService(dbContext);
        var result = await service.CreateOrganizationRepositoryAsync("acme", "api", null, "public", outsider.Username, User.RoleUser, CancellationToken.None);

        Assert.IsFalse(result.Succeeded);
        Assert.AreEqual("Forbidden", result.ErrorMessage);
    }

    // ---- GetOrganizationRepositories (additional error paths) ----

    [TestMethod]
    public async Task GetOrganizationRepositoriesAsync_NonExistentOrg_Fails()
    {
        using var dbContext = TestHelpers.CreateDbContext();
        var service = new OrganizationsService(dbContext);
        var result = await service.GetOrganizationRepositoriesAsync("nosuch", null, null, null, null, null, 1, 20, null, null, CancellationToken.None);

        Assert.IsFalse(result.Succeeded);
        Assert.AreEqual("Organization not found.", result.ErrorMessage);
    }

    [TestMethod]
    public async Task GetOrganizationRepositoriesAsync_InvalidVisibilityFilter_Fails()
    {
        using var dbContext = TestHelpers.CreateDbContext();
        var owner = await TestHelpers.AddUserAsync(dbContext, "owner", "owner@example.com");
        await AddOrganizationAsync(dbContext, owner, "acme");

        var service = new OrganizationsService(dbContext);
        var result = await service.GetOrganizationRepositoriesAsync("acme", null, "protected", null, null, null, 1, 20, owner.Username, User.RoleUser, CancellationToken.None);

        Assert.IsFalse(result.Succeeded);
        Assert.AreEqual("Visibility filter must be 'public' or 'private'.", result.ErrorMessage);
    }

    [TestMethod]
    public async Task GetOrganizationRepositoriesAsync_WithMinStarsFilter_FiltersResults()
    {
        using var dbContext = TestHelpers.CreateDbContext();
        var owner = await TestHelpers.AddUserAsync(dbContext, "owner", "owner@example.com");
        var org = await AddOrganizationAsync(dbContext, owner, "acme");
        dbContext.Repositories.Add(new Repository { Name = "popular", Description = "", Visibility = "public", OwnerId = owner.Id, OrganizationId = org.Id, StarCount = 10, CreatedAt = DateTime.UtcNow, UpdatedAt = DateTime.UtcNow });
        dbContext.Repositories.Add(new Repository { Name = "unpopular", Description = "", Visibility = "public", OwnerId = owner.Id, OrganizationId = org.Id, StarCount = 0, CreatedAt = DateTime.UtcNow, UpdatedAt = DateTime.UtcNow });
        await dbContext.SaveChangesAsync();

        var service = new OrganizationsService(dbContext);
        var result = await service.GetOrganizationRepositoriesAsync("acme", null, null, 5, null, null, 1, 20, null, null, CancellationToken.None);

        Assert.IsTrue(result.Succeeded);
        Assert.AreEqual(1, result.Data!.Total);
        Assert.AreEqual("acme/popular", result.Data.Repositories[0].FullName);
    }

    // ---- RemoveOrganizationMember (error paths not covered) ----

    [TestMethod]
    public async Task RemoveOrganizationMemberAsync_AsOutsider_ReturnsForbidden()
    {
        using var dbContext = TestHelpers.CreateDbContext();
        var owner = await TestHelpers.AddUserAsync(dbContext, "owner", "owner@example.com");
        var member = await TestHelpers.AddUserAsync(dbContext, "member", "member@example.com");
        var outsider = await TestHelpers.AddUserAsync(dbContext, "outsider", "outsider@example.com");
        var org = await AddOrganizationAsync(dbContext, owner, "acme");
        dbContext.OrganizationMembers.Add(new OrganizationMember { OrganizationId = org.Id, UserId = member.Id, Role = OrganizationMember.RoleMember, AddedAt = DateTime.UtcNow });
        await dbContext.SaveChangesAsync();

        var service = new OrganizationsService(dbContext);
        var result = await service.RemoveOrganizationMemberAsync("acme", member.Id, outsider.Username, User.RoleUser, CancellationToken.None);

        Assert.IsFalse(result.Succeeded);
        Assert.AreEqual("Forbidden", result.ErrorMessage);
    }

    // ---- RemoveOrganizationTeamMember (error paths) ----

    [TestMethod]
    public async Task RemoveOrganizationTeamMemberAsync_AsOutsider_ReturnsForbidden()
    {
        using var dbContext = TestHelpers.CreateDbContext();
        var owner = await TestHelpers.AddUserAsync(dbContext, "owner", "owner@example.com");
        var outsider = await TestHelpers.AddUserAsync(dbContext, "outsider", "outsider@example.com");
        var org = await AddOrganizationAsync(dbContext, owner, "acme");
        var team = new OrganizationTeam { OrganizationId = org.Id, Name = "backend", Description = "", CreatedAt = DateTime.UtcNow, UpdatedAt = DateTime.UtcNow };
        dbContext.OrganizationTeams.Add(team);
        await dbContext.SaveChangesAsync();

        var service = new OrganizationsService(dbContext);
        var result = await service.RemoveOrganizationTeamMemberAsync("acme", "backend", outsider.Id, outsider.Username, User.RoleUser, CancellationToken.None);

        Assert.IsFalse(result.Succeeded);
        Assert.AreEqual("Forbidden", result.ErrorMessage);
    }

    // ---- RemoveOrganizationTeamRepository (error paths) ----

    [TestMethod]
    public async Task RemoveOrganizationTeamRepositoryAsync_AsOutsider_ReturnsForbidden()
    {
        using var dbContext = TestHelpers.CreateDbContext();
        var owner = await TestHelpers.AddUserAsync(dbContext, "owner", "owner@example.com");
        var outsider = await TestHelpers.AddUserAsync(dbContext, "outsider", "outsider@example.com");
        var org = await AddOrganizationAsync(dbContext, owner, "acme");
        var team = new OrganizationTeam { OrganizationId = org.Id, Name = "backend", Description = "", CreatedAt = DateTime.UtcNow, UpdatedAt = DateTime.UtcNow };
        dbContext.OrganizationTeams.Add(team);
        await dbContext.SaveChangesAsync();

        var service = new OrganizationsService(dbContext);
        var result = await service.RemoveOrganizationTeamRepositoryAsync("acme", "backend", 1, outsider.Username, User.RoleUser, CancellationToken.None);

        Assert.IsFalse(result.Succeeded);
        Assert.AreEqual("Forbidden", result.ErrorMessage);
    }

    // ---- UpdateOrganizationTeam (additional paths) ----

    [TestMethod]
    public async Task UpdateOrganizationTeamAsync_EmptyNewName_Fails()
    {
        using var dbContext = TestHelpers.CreateDbContext();
        var owner = await TestHelpers.AddUserAsync(dbContext, "owner", "owner@example.com");
        var org = await AddOrganizationAsync(dbContext, owner, "acme");
        dbContext.OrganizationTeams.Add(new OrganizationTeam { OrganizationId = org.Id, Name = "backend", Description = "", CreatedAt = DateTime.UtcNow, UpdatedAt = DateTime.UtcNow });
        await dbContext.SaveChangesAsync();

        var service = new OrganizationsService(dbContext);
        var result = await service.UpdateOrganizationTeamAsync("acme", "backend", "", null, owner.Username, User.RoleUser, CancellationToken.None);

        Assert.IsFalse(result.Succeeded);
        Assert.AreEqual("Team name is required and cannot exceed 64 characters.", result.ErrorMessage);
    }

    [TestMethod]
    public async Task UpdateOrganizationTeamAsync_SameName_OnlyUpdatesDescription()
    {
        using var dbContext = TestHelpers.CreateDbContext();
        var owner = await TestHelpers.AddUserAsync(dbContext, "owner", "owner@example.com");
        var org = await AddOrganizationAsync(dbContext, owner, "acme");
        dbContext.OrganizationTeams.Add(new OrganizationTeam { OrganizationId = org.Id, Name = "backend", Description = "old", CreatedAt = DateTime.UtcNow, UpdatedAt = DateTime.UtcNow });
        await dbContext.SaveChangesAsync();

        var service = new OrganizationsService(dbContext);
        var result = await service.UpdateOrganizationTeamAsync("acme", "backend", "backend", "new desc", owner.Username, User.RoleUser, CancellationToken.None);

        Assert.IsTrue(result.Succeeded);
        Assert.AreEqual("backend", result.Data!.Name);
        Assert.AreEqual("new desc", result.Data.Description);
    }

    // ---- Invite service tests ----

    [TestMethod]
    public async Task SendOrganizationInviteAsync_OrgAdmin_CreatesInvite()
    {
        using var dbContext = TestHelpers.CreateDbContext();
        var owner = await TestHelpers.AddUserAsync(dbContext, "owner", "owner@example.com");
        var org = await AddOrganizationAsync(dbContext, owner, "acme");

        var service = new OrganizationsService(dbContext);
        var result = await service.SendOrganizationInviteAsync("acme", "dev@example.com", "member", owner.Username, User.RoleUser, CancellationToken.None);

        Assert.IsTrue(result.Succeeded);
        Assert.IsNotNull(result.Data);
        Assert.AreEqual("dev@example.com", result.Data.Email);
        Assert.AreEqual("member", result.Data.Role);
        Assert.AreEqual(OrganizationInvite.StatusPending, result.Data.Status);
        Assert.AreEqual(1, await dbContext.OrganizationInvites.CountAsync());
    }

    [TestMethod]
    public async Task SendOrganizationInviteAsync_ReplacesExistingPendingInvite()
    {
        using var dbContext = TestHelpers.CreateDbContext();
        var owner = await TestHelpers.AddUserAsync(dbContext, "owner", "owner@example.com");
        var org = await AddOrganizationAsync(dbContext, owner, "acme");

        var service = new OrganizationsService(dbContext);
        await service.SendOrganizationInviteAsync("acme", "dev@example.com", "member", owner.Username, User.RoleUser, CancellationToken.None);
        var result = await service.SendOrganizationInviteAsync("acme", "dev@example.com", "admin", owner.Username, User.RoleUser, CancellationToken.None);

        Assert.IsTrue(result.Succeeded);
        Assert.AreEqual("admin", result.Data!.Role);
        // Old invite cancelled, new one pending
        Assert.AreEqual(1, await dbContext.OrganizationInvites.CountAsync(i => i.Status == OrganizationInvite.StatusPending));
        Assert.AreEqual(1, await dbContext.OrganizationInvites.CountAsync(i => i.Status == OrganizationInvite.StatusCancelled));
    }

    [TestMethod]
    public async Task SendOrganizationInviteAsync_Outsider_ReturnsForbidden()
    {
        using var dbContext = TestHelpers.CreateDbContext();
        var owner = await TestHelpers.AddUserAsync(dbContext, "owner", "owner@example.com");
        var outsider = await TestHelpers.AddUserAsync(dbContext, "outsider", "outsider@example.com");
        await AddOrganizationAsync(dbContext, owner, "acme");

        var service = new OrganizationsService(dbContext);
        var result = await service.SendOrganizationInviteAsync("acme", "dev@example.com", null, outsider.Username, User.RoleUser, CancellationToken.None);

        Assert.IsFalse(result.Succeeded);
        Assert.AreEqual("Forbidden", result.ErrorMessage);
    }

    [TestMethod]
    public async Task SendOrganizationInviteAsync_OrgNotFound_ReturnsError()
    {
        using var dbContext = TestHelpers.CreateDbContext();
        var owner = await TestHelpers.AddUserAsync(dbContext, "owner", "owner@example.com");

        var service = new OrganizationsService(dbContext);
        var result = await service.SendOrganizationInviteAsync("nonexistent", "dev@example.com", null, owner.Username, User.RoleUser, CancellationToken.None);

        Assert.IsFalse(result.Succeeded);
        Assert.AreEqual("Organization not found.", result.ErrorMessage);
    }

    [TestMethod]
    public async Task SendOrganizationInviteAsync_InvalidRole_ReturnsError()
    {
        using var dbContext = TestHelpers.CreateDbContext();
        var owner = await TestHelpers.AddUserAsync(dbContext, "owner", "owner@example.com");
        await AddOrganizationAsync(dbContext, owner, "acme");

        var service = new OrganizationsService(dbContext);
        var result = await service.SendOrganizationInviteAsync("acme", "dev@example.com", "superadmin", owner.Username, User.RoleUser, CancellationToken.None);

        Assert.IsFalse(result.Succeeded);
        Assert.AreEqual("Invalid role.", result.ErrorMessage);
    }

    [TestMethod]
    public async Task GetOrganizationInvitesAsync_ReturnsOnlyPendingInvites()
    {
        using var dbContext = TestHelpers.CreateDbContext();
        var owner = await TestHelpers.AddUserAsync(dbContext, "owner", "owner@example.com");
        var org = await AddOrganizationAsync(dbContext, owner, "acme");

        dbContext.OrganizationInvites.Add(new OrganizationInvite { OrganizationId = org.Id, InvitedByUserId = owner.Id, Email = "a@x.com", Token = Guid.NewGuid().ToString("N"), Role = OrganizationMember.RoleMember, Status = OrganizationInvite.StatusPending, ExpiresAt = DateTime.UtcNow.AddDays(7), CreatedAt = DateTime.UtcNow });
        dbContext.OrganizationInvites.Add(new OrganizationInvite { OrganizationId = org.Id, InvitedByUserId = owner.Id, Email = "b@x.com", Token = Guid.NewGuid().ToString("N"), Role = OrganizationMember.RoleMember, Status = OrganizationInvite.StatusAccepted, ExpiresAt = DateTime.UtcNow.AddDays(7), CreatedAt = DateTime.UtcNow });
        await dbContext.SaveChangesAsync();

        var service = new OrganizationsService(dbContext);
        var result = await service.GetOrganizationInvitesAsync("acme", owner.Username, User.RoleUser, CancellationToken.None);

        Assert.IsTrue(result.Succeeded);
        Assert.AreEqual(1, result.Data!.Count);
        Assert.AreEqual("a@x.com", result.Data[0].Email);
    }

    [TestMethod]
    public async Task CancelOrganizationInviteAsync_Owner_CancelsInvite()
    {
        using var dbContext = TestHelpers.CreateDbContext();
        var owner = await TestHelpers.AddUserAsync(dbContext, "owner", "owner@example.com");
        var org = await AddOrganizationAsync(dbContext, owner, "acme");

        var invite = new OrganizationInvite { OrganizationId = org.Id, InvitedByUserId = owner.Id, Email = "dev@x.com", Token = Guid.NewGuid().ToString("N"), Role = OrganizationMember.RoleMember, Status = OrganizationInvite.StatusPending, ExpiresAt = DateTime.UtcNow.AddDays(7), CreatedAt = DateTime.UtcNow };
        dbContext.OrganizationInvites.Add(invite);
        await dbContext.SaveChangesAsync();

        var service = new OrganizationsService(dbContext);
        var result = await service.CancelOrganizationInviteAsync("acme", invite.Id, owner.Username, User.RoleUser, CancellationToken.None);

        Assert.IsTrue(result.Succeeded);
        var stored = await dbContext.OrganizationInvites.SingleAsync();
        Assert.AreEqual(OrganizationInvite.StatusCancelled, stored.Status);
    }

    [TestMethod]
    public async Task AcceptOrganizationInviteAsync_ValidToken_JoinsOrg()
    {
        using var dbContext = TestHelpers.CreateDbContext();
        var owner = await TestHelpers.AddUserAsync(dbContext, "owner", "owner@example.com");
        var joiner = await TestHelpers.AddUserAsync(dbContext, "joiner", "joiner@example.com");
        var org = await AddOrganizationAsync(dbContext, owner, "acme");

        var token = Guid.NewGuid().ToString("N");
        dbContext.OrganizationInvites.Add(new OrganizationInvite { OrganizationId = org.Id, InvitedByUserId = owner.Id, Email = "joiner@example.com", Token = token, Role = OrganizationMember.RoleMember, Status = OrganizationInvite.StatusPending, ExpiresAt = DateTime.UtcNow.AddDays(7), CreatedAt = DateTime.UtcNow });
        await dbContext.SaveChangesAsync();

        var service = new OrganizationsService(dbContext);
        var result = await service.AcceptOrganizationInviteAsync(token, joiner.Username, CancellationToken.None);

        Assert.IsTrue(result.Succeeded);
        Assert.AreEqual(joiner.Username, result.Data!.Username);
        Assert.AreEqual(OrganizationMember.RoleMember, result.Data.Role);
        Assert.IsTrue(await dbContext.OrganizationMembers.AnyAsync(m => m.UserId == joiner.Id && m.OrganizationId == org.Id));
        var invite = await dbContext.OrganizationInvites.SingleAsync();
        Assert.AreEqual(OrganizationInvite.StatusAccepted, invite.Status);
    }

    [TestMethod]
    public async Task AcceptOrganizationInviteAsync_ExpiredToken_ReturnsError()
    {
        using var dbContext = TestHelpers.CreateDbContext();
        var owner = await TestHelpers.AddUserAsync(dbContext, "owner", "owner@example.com");
        var joiner = await TestHelpers.AddUserAsync(dbContext, "joiner", "joiner@example.com");
        var org = await AddOrganizationAsync(dbContext, owner, "acme");

        var token = Guid.NewGuid().ToString("N");
        dbContext.OrganizationInvites.Add(new OrganizationInvite { OrganizationId = org.Id, InvitedByUserId = owner.Id, Email = "joiner@example.com", Token = token, Role = OrganizationMember.RoleMember, Status = OrganizationInvite.StatusPending, ExpiresAt = DateTime.UtcNow.AddDays(-1), CreatedAt = DateTime.UtcNow.AddDays(-8) });
        await dbContext.SaveChangesAsync();

        var service = new OrganizationsService(dbContext);
        var result = await service.AcceptOrganizationInviteAsync(token, joiner.Username, CancellationToken.None);

        Assert.IsFalse(result.Succeeded);
        Assert.AreEqual("Invite has expired.", result.ErrorMessage);
    }

    [TestMethod]
    public async Task AcceptOrganizationInviteAsync_AlreadyMember_ReturnsError()
    {
        using var dbContext = TestHelpers.CreateDbContext();
        var owner = await TestHelpers.AddUserAsync(dbContext, "owner", "owner@example.com");
        var org = await AddOrganizationAsync(dbContext, owner, "acme");

        var token = Guid.NewGuid().ToString("N");
        dbContext.OrganizationInvites.Add(new OrganizationInvite { OrganizationId = org.Id, InvitedByUserId = owner.Id, Email = "owner@example.com", Token = token, Role = OrganizationMember.RoleMember, Status = OrganizationInvite.StatusPending, ExpiresAt = DateTime.UtcNow.AddDays(7), CreatedAt = DateTime.UtcNow });
        await dbContext.SaveChangesAsync();

        var service = new OrganizationsService(dbContext);
        // owner is already a member — try to accept their own invite
        var result = await service.AcceptOrganizationInviteAsync(token, owner.Username, CancellationToken.None);

        Assert.IsFalse(result.Succeeded);
        Assert.AreEqual("Already a member of this organization.", result.ErrorMessage);
    }

    private static async Task<Organization> AddOrganizationAsync(AppDbContext dbContext, User owner, string name)
    {
        var organization = new Organization
        {
            Name = name,
            DisplayName = name,
            Description = $"{name} org",
            OwnerId = owner.Id,
            CreatedAt = DateTime.UtcNow,
            UpdatedAt = DateTime.UtcNow
        };

        dbContext.Organizations.Add(organization);
        await dbContext.SaveChangesAsync();

        dbContext.OrganizationMembers.Add(new OrganizationMember
        {
            OrganizationId = organization.Id,
            UserId = owner.Id,
            Role = OrganizationMember.RoleOwner,
            AddedAt = DateTime.UtcNow
        });
        await dbContext.SaveChangesAsync();

        return organization;
    }
}
