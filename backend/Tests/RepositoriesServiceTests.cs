using backend.Data;
using backend.Models;
using backend.Services;
using Microsoft.EntityFrameworkCore;

namespace backend.Tests;

[TestClass]
public sealed class RepositoriesServiceTests
{
    [TestMethod]
    public async Task ExploreRepositoriesAsync_WithMineAndNoUser_ReturnsUnauthorized()
    {
        using var dbContext = CreateDbContext();
        var service = new RepositoriesService(dbContext);

        var result = await service.ExploreRepositoriesAsync(
            search: null,
            owner: null,
            visibility: null,
            minStars: null,
            sortBy: null,
            sortDir: null,
            mine: true,
            starred: false,
            badges: null,
            page: 1,
            pageSize: 20,
            currentUsername: null,
            cancellationToken: CancellationToken.None);

        Assert.IsFalse(result.Succeeded);
        Assert.AreEqual("Unauthorized", result.ErrorMessage);
    }

    [TestMethod]
    public async Task ExploreRepositoriesAsync_WithPrivateVisibilityAndAuthenticatedUser_ReturnsOnlyOwnPrivateRepositories()
    {
        using var dbContext = CreateDbContext();
        var owner = await AddUserAsync(dbContext, "demo", "demo@example.com");
        var otherUser = await AddUserAsync(dbContext, "other", "other@example.com");

        await AddRepositoryAsync(dbContext, owner, "owner-private", "private", pullCount: 5);
        await AddRepositoryAsync(dbContext, owner, "owner-public", "public", pullCount: 3);
        await AddRepositoryAsync(dbContext, otherUser, "other-private", "private", pullCount: 9);
        await dbContext.SaveChangesAsync();

        var service = new RepositoriesService(dbContext);
        var result = await service.ExploreRepositoriesAsync(
            search: null,
            owner: null,
            visibility: "private",
            minStars: null,
            sortBy: "name",
            sortDir: "asc",
            mine: false,
            starred: false,
            badges: null,
            page: 1,
            pageSize: 20,
            currentUsername: "demo",
            cancellationToken: CancellationToken.None);

        Assert.IsTrue(result.Succeeded);
        Assert.IsNotNull(result.Data);
        Assert.AreEqual(1, result.Data.Total);
        Assert.AreEqual("owner-private", result.Data.Repositories[0].Name);
        Assert.AreEqual("private", result.Data.Repositories[0].Visibility);
    }

    [TestMethod]
    public async Task ExploreRepositoriesAsync_SortByPullCountDescending_OrdersRepositoriesByPulls()
    {
        using var dbContext = CreateDbContext();
        var owner = await AddUserAsync(dbContext, "demo", "demo@example.com");

        await AddRepositoryAsync(dbContext, owner, "low-pulls", "public", pullCount: 2);
        await AddRepositoryAsync(dbContext, owner, "high-pulls", "public", pullCount: 10);
        await AddRepositoryAsync(dbContext, owner, "mid-pulls", "public", pullCount: 5);
        await dbContext.SaveChangesAsync();

        var service = new RepositoriesService(dbContext);
        var result = await service.ExploreRepositoriesAsync(
            search: null,
            owner: null,
            visibility: null,
            minStars: null,
            sortBy: "pulls",
            sortDir: "desc",
            mine: false,
            starred: false,
            badges: null,
            page: 1,
            pageSize: 20,
            currentUsername: null,
            cancellationToken: CancellationToken.None);

        Assert.IsTrue(result.Succeeded);
        Assert.IsNotNull(result.Data);

        var names = result.Data.Repositories.Select(repository => repository.Name).ToList();
        CollectionAssert.AreEqual(new[] { "high-pulls", "mid-pulls", "low-pulls" }, names);
    }

    [TestMethod]
    public async Task ExploreRepositoriesAsync_WithBadgesFilter_ReturnsOnlyMatchingBadges()
    {
        using var dbContext = CreateDbContext();
        var verifiedOwner = await AddUserAsync(dbContext, "verified-owner", "verified@example.com");
        verifiedOwner.VerifiedPublisher = true;
        var sponsoredOwner = await AddUserAsync(dbContext, "sponsored-owner", "sponsored@example.com");
        sponsoredOwner.SponsoredOSS = true;
        var plainOwner = await AddUserAsync(dbContext, "plain-owner", "plain@example.com");
        await dbContext.SaveChangesAsync();

        await AddRepositoryAsync(dbContext, verifiedOwner, "verified-repo", "public", pullCount: 0);
        await AddRepositoryAsync(dbContext, sponsoredOwner, "sponsored-repo", "public", pullCount: 0);
        await AddRepositoryAsync(dbContext, plainOwner, "official-repo", "public", pullCount: 0, isOfficial: true);
        await AddRepositoryAsync(dbContext, plainOwner, "plain-repo", "public", pullCount: 0);
        await dbContext.SaveChangesAsync();

        var service = new RepositoriesService(dbContext);
        var result = await service.ExploreRepositoriesAsync(
            search: null,
            owner: null,
            visibility: null,
            minStars: null,
            sortBy: "name",
            sortDir: "asc",
            mine: false,
            starred: false,
            badges: "verified,official",
            page: 1,
            pageSize: 20,
            currentUsername: null,
            cancellationToken: CancellationToken.None);

        Assert.IsTrue(result.Succeeded);
        Assert.IsNotNull(result.Data);
        var names = result.Data.Repositories.Select(r => r.Name).OrderBy(n => n).ToList();
        CollectionAssert.AreEqual(new[] { "official-repo", "verified-repo" }, names);

        var verifiedRepo = result.Data.Repositories.Single(r => r.Name == "verified-repo");
        Assert.IsTrue(verifiedRepo.IsVerifiedPublisher);
        Assert.IsFalse(verifiedRepo.IsSponsoredOss);
    }

    [TestMethod]
    public async Task CreateRepositoryAsync_WithValidInput_CreatesRepository()
    {
        using var dbContext = CreateDbContext();
        await AddUserAsync(dbContext, "demo", "demo@example.com");

        var service = new RepositoriesService(dbContext);
        var result = await service.CreateRepositoryAsync(
            name: "sample-repo",
            description: "Created from test",
            visibility: "public",
            isOfficial: false,
            username: "demo",
            userRole: User.RoleUser,
            cancellationToken: CancellationToken.None);

        Assert.IsTrue(result.Succeeded);
        Assert.IsNotNull(result.Data);
        Assert.AreEqual("sample-repo", result.Data.Name);

        var storedRepository = await dbContext.Repositories.SingleAsync();
        Assert.AreEqual("sample-repo", storedRepository.Name);
        Assert.AreEqual("public", storedRepository.Visibility);
    }

    [TestMethod]
    public async Task CreateRepositoryAsync_AsAdminWithIsOfficial_CreatesOfficialRepositoryWithoutPrefix()
    {
        using var dbContext = CreateDbContext();
        await AddUserAsync(dbContext, "admin1", "admin1@example.com", User.RoleAdministrator);

        var service = new RepositoriesService(dbContext);
        var result = await service.CreateRepositoryAsync(
            name: "nginx",
            description: "Official nginx",
            visibility: "private",
            isOfficial: true,
            username: "admin1",
            userRole: User.RoleAdministrator,
            cancellationToken: CancellationToken.None);

        Assert.IsTrue(result.Succeeded);
        Assert.IsNotNull(result.Data);
        Assert.IsTrue(result.Data.IsOfficial);
        Assert.AreEqual("nginx", result.Data.FullName);
        Assert.AreEqual("public", result.Data.Visibility);
    }

    [TestMethod]
    public async Task CreateRepositoryAsync_AsRegularUserWithIsOfficial_ReturnsFailure()
    {
        using var dbContext = CreateDbContext();
        await AddUserAsync(dbContext, "demo", "demo@example.com");

        var service = new RepositoriesService(dbContext);
        var result = await service.CreateRepositoryAsync(
            name: "nginx",
            description: null,
            visibility: "public",
            isOfficial: true,
            username: "demo",
            userRole: User.RoleUser,
            cancellationToken: CancellationToken.None);

        Assert.IsFalse(result.Succeeded);
        StringAssert.Contains(result.ErrorMessage, "administrators");
    }

    [TestMethod]
    public async Task CreateRepositoryAsync_WithDuplicateOfficialName_ReturnsFailure()
    {
        using var dbContext = CreateDbContext();
        var admin = await AddUserAsync(dbContext, "admin1", "admin1@example.com", User.RoleAdministrator);
        await AddRepositoryAsync(dbContext, admin, "nginx", "public", pullCount: 0, isOfficial: true);
        await dbContext.SaveChangesAsync();

        var service = new RepositoriesService(dbContext);
        var result = await service.CreateRepositoryAsync(
            name: "nginx",
            description: null,
            visibility: "public",
            isOfficial: true,
            username: "admin1",
            userRole: User.RoleAdministrator,
            cancellationToken: CancellationToken.None);

        Assert.IsFalse(result.Succeeded);
        StringAssert.Contains(result.ErrorMessage, "already exists");
    }

    [TestMethod]
    public async Task GetRepositoryAsync_WithPrivateRepositoryAndOutsider_ReturnsForbidden()
    {
        using var dbContext = CreateDbContext();
        var owner = await AddUserAsync(dbContext, "demo", "demo@example.com");
        var repository = await AddRepositoryAsync(dbContext, owner, "private-repo", "private", pullCount: 2);

        var service = new RepositoriesService(dbContext);
        var result = await service.GetRepositoryAsync(
            repository.Id,
            currentUsername: "outsider",
            userRole: User.RoleUser,
            cancellationToken: CancellationToken.None);

        Assert.IsFalse(result.Succeeded);
        Assert.AreEqual("Forbidden", result.ErrorMessage);
    }

    [TestMethod]
    public async Task GetRepositoryAsync_WithStarredRepo_PopulatesIsStarredByCurrentUser()
    {
        using var dbContext = CreateDbContext();
        var owner = await AddUserAsync(dbContext, "demo", "demo@example.com");
        var user = await AddUserAsync(dbContext, "fan", "fan@example.com");
        var repository = await AddRepositoryAsync(dbContext, owner, "awesome-repo", "public", pullCount: 0);

        dbContext.RepositoryStars.Add(new RepositoryStar { RepositoryId = repository.Id, UserId = user.Id, CreatedAt = DateTime.UtcNow });
        repository.StarCount = 1;
        await dbContext.SaveChangesAsync();

        var service = new RepositoriesService(dbContext);

        var starredResult = await service.GetRepositoryAsync(repository.Id, "fan", User.RoleUser, CancellationToken.None);
        Assert.IsTrue(starredResult.Succeeded);
        Assert.AreEqual(true, starredResult.Data?.IsStarredByCurrentUser);

        var notStarredResult = await service.GetRepositoryAsync(repository.Id, "demo", User.RoleUser, CancellationToken.None);
        Assert.IsTrue(notStarredResult.Succeeded);
        Assert.AreEqual(false, notStarredResult.Data?.IsStarredByCurrentUser);

        var anonResult = await service.GetRepositoryAsync(repository.Id, null, null, CancellationToken.None);
        Assert.IsTrue(anonResult.Succeeded);
        Assert.IsNull(anonResult.Data?.IsStarredByCurrentUser);
    }

    [TestMethod]
    public async Task ExploreRepositoriesAsync_WithLoggedInUser_PopulatesIsStarredByCurrentUser()
    {
        using var dbContext = CreateDbContext();
        var owner = await AddUserAsync(dbContext, "demo", "demo@example.com");
        var user = await AddUserAsync(dbContext, "fan", "fan@example.com");
        var repo1 = await AddRepositoryAsync(dbContext, owner, "repo1", "public", pullCount: 0);
        var repo2 = await AddRepositoryAsync(dbContext, owner, "repo2", "public", pullCount: 0);

        dbContext.RepositoryStars.Add(new RepositoryStar { RepositoryId = repo1.Id, UserId = user.Id, CreatedAt = DateTime.UtcNow });
        repo1.StarCount = 1;
        await dbContext.SaveChangesAsync();

        var service = new RepositoriesService(dbContext);
        var result = await service.ExploreRepositoriesAsync(
            search: null,
            owner: null,
            visibility: null,
            minStars: null,
            sortBy: "name",
            sortDir: "asc",
            mine: false,
            starred: false,
            badges: null,
            page: 1,
            pageSize: 20,
            currentUsername: "fan",
            cancellationToken: CancellationToken.None);

        Assert.IsTrue(result.Succeeded);
        Assert.IsNotNull(result.Data);

        var r1 = result.Data.Repositories.First(r => r.Name == "repo1");
        var r2 = result.Data.Repositories.First(r => r.Name == "repo2");

        Assert.AreEqual(true, r1.IsStarredByCurrentUser);
        Assert.AreEqual(false, r2.IsStarredByCurrentUser);
    }

    [TestMethod]
    public async Task UpdateRepositoryAsync_SettingPrivateVisibility_RemovesCollaborators()
    {
        using var dbContext = CreateDbContext();
        var owner = await AddUserAsync(dbContext, "demo", "demo@example.com");
        var collaborator = await AddUserAsync(dbContext, "friend", "friend@example.com");
        var repository = await AddRepositoryAsync(dbContext, owner, "public-repo", "public", pullCount: 0);
        dbContext.RepositoryCollaborators.Add(new RepositoryCollaborator
        {
            RepositoryId = repository.Id,
            UserId = collaborator.Id,
            User = collaborator,
            Repository = repository,
            Role = "write",
            AddedAt = DateTime.UtcNow
        });
        await dbContext.SaveChangesAsync();

        var service = new RepositoriesService(dbContext);
        var result = await service.UpdateRepositoryAsync(
            repository.Id,
            name: null,
            description: "Updated description",
            visibility: "private",
            currentUsername: "demo",
            userRole: User.RoleUser,
            cancellationToken: CancellationToken.None);

        Assert.IsTrue(result.Succeeded);

        var updatedRepository = await dbContext.Repositories.Include(item => item.Collaborators).SingleAsync();
        Assert.AreEqual("private", updatedRepository.Visibility);
        Assert.AreEqual(0, updatedRepository.Collaborators.Count);
    }

    [TestMethod]
    public async Task DeleteRepositoryAsync_WithOwner_RemovesRepository()
    {
        using var dbContext = CreateDbContext();
        var owner = await AddUserAsync(dbContext, "demo", "demo@example.com");
        var repository = await AddRepositoryAsync(dbContext, owner, "to-delete", "public", pullCount: 0);

        var service = new RepositoriesService(dbContext);
        var result = await service.DeleteRepositoryAsync(
            repository.Id,
            currentUsername: "demo",
            userRole: User.RoleUser,
            cancellationToken: CancellationToken.None);

        Assert.IsTrue(result.Succeeded);
        Assert.AreEqual(0, await dbContext.Repositories.CountAsync());
    }

    [TestMethod]
    public async Task GetRepositoryTagsAsync_OnPrivateRepositoryWithoutAccess_ReturnsForbidden()
    {
        using var dbContext = CreateDbContext();
        var owner = await AddUserAsync(dbContext, "demo", "demo@example.com");
        var repository = await AddRepositoryAsync(dbContext, owner, "owner-private", "private", pullCount: 1);
        await AddTagAsync(dbContext, repository, "latest", pullCount: 3, compressedSizeBytes: 400);
        await dbContext.SaveChangesAsync();

        var service = new RepositoriesService(dbContext);
        var result = await service.GetRepositoryTagsAsync(
            repository.Id,
            search: null,
            sortBy: "pulls",
            sortDir: "desc",
            page: 1,
            pageSize: 20,
            currentUsername: "outsider",
            userRole: User.RoleUser,
            cancellationToken: CancellationToken.None);

        Assert.IsFalse(result.Succeeded);
        Assert.AreEqual("Forbidden", result.ErrorMessage);
    }

    [TestMethod]
    public async Task GetRepositoryTagsAsync_SortByPullCountDescending_OrdersTagsByPulls()
    {
        using var dbContext = CreateDbContext();
        var owner = await AddUserAsync(dbContext, "demo", "demo@example.com");
        var repository = await AddRepositoryAsync(dbContext, owner, "sample", "public", pullCount: 20);

        await AddTagAsync(dbContext, repository, "v1", pullCount: 1, compressedSizeBytes: 300);
        await AddTagAsync(dbContext, repository, "v2", pullCount: 9, compressedSizeBytes: 200);
        await AddTagAsync(dbContext, repository, "v3", pullCount: 5, compressedSizeBytes: 100);
        await dbContext.SaveChangesAsync();

        var service = new RepositoriesService(dbContext);
        var result = await service.GetRepositoryTagsAsync(
            repository.Id,
            search: null,
            sortBy: "pullcount",
            sortDir: "desc",
            page: 1,
            pageSize: 20,
            currentUsername: null,
            userRole: null,
            cancellationToken: CancellationToken.None);

        Assert.IsTrue(result.Succeeded);
        Assert.IsNotNull(result.Data);
        Assert.AreEqual(20, result.Data.PullCount);

        var tagNames = result.Data.Tags.Select(tag => tag.Name).ToList();
        CollectionAssert.AreEqual(new[] { "v2", "v3", "v1" }, tagNames);
    }

    [TestMethod]
    public async Task GetRepositoryTagsAsync_WithPaging_ReturnsRequestedTagSlice()
    {
        using var dbContext = CreateDbContext();
        var owner = await AddUserAsync(dbContext, "demo", "demo@example.com");
        var repository = await AddRepositoryAsync(dbContext, owner, "sample", "public", pullCount: 12);

        await AddTagAsync(dbContext, repository, "v1", pullCount: 1, compressedSizeBytes: 100);
        await AddTagAsync(dbContext, repository, "v2", pullCount: 2, compressedSizeBytes: 200);
        await AddTagAsync(dbContext, repository, "v3", pullCount: 3, compressedSizeBytes: 300);
        await AddTagAsync(dbContext, repository, "v4", pullCount: 4, compressedSizeBytes: 400);
        await AddTagAsync(dbContext, repository, "v5", pullCount: 5, compressedSizeBytes: 500);
        await dbContext.SaveChangesAsync();

        var service = new RepositoriesService(dbContext);
        var result = await service.GetRepositoryTagsAsync(
            repository.Id,
            search: null,
            sortBy: "name",
            sortDir: "asc",
            page: 2,
            pageSize: 2,
            currentUsername: null,
            userRole: null,
            cancellationToken: CancellationToken.None);

        Assert.IsTrue(result.Succeeded);
        Assert.IsNotNull(result.Data);
        Assert.AreEqual(5, result.Data.Total);
        Assert.AreEqual(2, result.Data.Page);
        Assert.AreEqual(2, result.Data.PageSize);

        var tagNames = result.Data.Tags.Select(tag => tag.Name).ToList();
        CollectionAssert.AreEqual(new[] { "v3", "v4" }, tagNames);
    }

    [TestMethod]
    public async Task GetRepositoryTagsAsync_SortBySizeAscending_OrdersTagsByCompressedSize()
    {
        using var dbContext = CreateDbContext();
        var owner = await AddUserAsync(dbContext, "demo", "demo@example.com");
        var repository = await AddRepositoryAsync(dbContext, owner, "sample", "public", pullCount: 7);

        await AddTagAsync(dbContext, repository, "largest", pullCount: 1, compressedSizeBytes: 900);
        await AddTagAsync(dbContext, repository, "smallest", pullCount: 2, compressedSizeBytes: 100);
        await AddTagAsync(dbContext, repository, "medium", pullCount: 3, compressedSizeBytes: 400);
        await dbContext.SaveChangesAsync();

        var service = new RepositoriesService(dbContext);
        var result = await service.GetRepositoryTagsAsync(
            repository.Id,
            search: null,
            sortBy: "size",
            sortDir: "asc",
            page: 1,
            pageSize: 20,
            currentUsername: null,
            userRole: null,
            cancellationToken: CancellationToken.None);

        Assert.IsTrue(result.Succeeded);
        Assert.IsNotNull(result.Data);

        var tagNames = result.Data.Tags.Select(tag => tag.Name).ToList();
        CollectionAssert.AreEqual(new[] { "smallest", "medium", "largest" }, tagNames);
    }

    [TestMethod]
    public async Task GetRepositoryTagsAsync_WithSearch_ReturnsMatchingTags()
    {
        using var dbContext = CreateDbContext();
        var owner = await AddUserAsync(dbContext, "demo", "demo@example.com");
        var repository = await AddRepositoryAsync(dbContext, owner, "sample", "public", pullCount: 0);

        await AddTagAsync(dbContext, repository, "v1.0-beta", pullCount: 1, compressedSizeBytes: 100);
        await AddTagAsync(dbContext, repository, "v1.0-release", pullCount: 2, compressedSizeBytes: 150);
        await AddTagAsync(dbContext, repository, "v2.0-beta", pullCount: 3, compressedSizeBytes: 200);
        await AddTagAsync(dbContext, repository, "latest", pullCount: 4, compressedSizeBytes: 250);
        await dbContext.SaveChangesAsync();

        var service = new RepositoriesService(dbContext);
        var result = await service.GetRepositoryTagsAsync(
            repository.Id,
            search: "beta",
            sortBy: "name",
            sortDir: "asc",
            page: 1,
            pageSize: 20,
            currentUsername: null,
            userRole: null,
            cancellationToken: CancellationToken.None);

        Assert.IsTrue(result.Succeeded);
        Assert.IsNotNull(result.Data);
        Assert.AreEqual(2, result.Data.Total);

        var tagNames = result.Data.Tags.Select(tag => tag.Name).ToList();
        CollectionAssert.AreEqual(new[] { "v1.0-beta", "v2.0-beta" }, tagNames);
    }

    [TestMethod]
    public async Task StarRepositoryAsync_WithValidUser_StarsRepository()
    {
        using var dbContext = CreateDbContext();
        var owner = await AddUserAsync(dbContext, "demo", "demo@example.com");
        var user = await AddUserAsync(dbContext, "fan", "fan@example.com");
        var repository = await AddRepositoryAsync(dbContext, owner, "awesome-repo", "public", pullCount: 0);
        await dbContext.SaveChangesAsync();

        var service = new RepositoriesService(dbContext);
        var result = await service.StarRepositoryAsync(repository.Id, "fan", CancellationToken.None);

        Assert.IsTrue(result.Succeeded);
        Assert.IsNotNull(result.Data);
        Assert.AreEqual(1, result.Data.StarCount);

        // Verify in database
        var updatedRepo = await dbContext.Repositories
            .Include(r => r.Stars)
            .FirstOrDefaultAsync(r => r.Id == repository.Id);
        
        Assert.AreEqual(1, updatedRepo?.StarCount);
        Assert.AreEqual(1, updatedRepo?.Stars.Count);
    }

    [TestMethod]
    public async Task StarRepositoryAsync_OwnRepository_ReturnsError()
    {
        using var dbContext = CreateDbContext();
        var owner = await AddUserAsync(dbContext, "demo", "demo@example.com");
        var repository = await AddRepositoryAsync(dbContext, owner, "awesome-repo", "public", pullCount: 0);

        var service = new RepositoriesService(dbContext);
        var result = await service.StarRepositoryAsync(repository.Id, "demo", CancellationToken.None);

        Assert.IsFalse(result.Succeeded);
        Assert.AreEqual("You cannot star your own repository.", result.ErrorMessage);
        Assert.AreEqual(0, await dbContext.RepositoryStars.CountAsync());
    }

    [TestMethod]
    public async Task StarRepositoryAsync_RepositoryBelongsToOwnOrganization_ReturnsError()
    {
        using var dbContext = CreateDbContext();
        var owner = await AddUserAsync(dbContext, "owner", "owner@example.com");
        var member = await AddUserAsync(dbContext, "member", "member@example.com");
        var (org, repo) = await SetupOrgRepo(dbContext, owner, "acme", "api", "public");
        dbContext.OrganizationMembers.Add(new OrganizationMember
        {
            OrganizationId = org.Id,
            UserId = member.Id,
            Role = OrganizationMember.RoleMember,
            AddedAt = DateTime.UtcNow
        });
        await dbContext.SaveChangesAsync();

        var service = new RepositoriesService(dbContext);
        var result = await service.StarRepositoryAsync(repo.Id, "member", CancellationToken.None);

        Assert.IsFalse(result.Succeeded);
        Assert.AreEqual("You cannot star a repository that belongs to an organization you are a member of.", result.ErrorMessage);
        Assert.AreEqual(0, await dbContext.RepositoryStars.CountAsync());
    }

    [TestMethod]
    public async Task StarRepositoryAsync_UnrelatedPublicRepository_StillSucceeds()
    {
        using var dbContext = CreateDbContext();
        var owner = await AddUserAsync(dbContext, "owner", "owner@example.com");
        var outsider = await AddUserAsync(dbContext, "outsider", "outsider@example.com");
        var (_, repo) = await SetupOrgRepo(dbContext, owner, "acme", "api", "public");

        var service = new RepositoriesService(dbContext);
        var result = await service.StarRepositoryAsync(repo.Id, "outsider", CancellationToken.None);

        Assert.IsTrue(result.Succeeded);
        Assert.AreEqual(1, await dbContext.RepositoryStars.CountAsync());
    }

    [TestMethod]
    public async Task UnstarRepositoryAsync_WithValidStar_UnstarsRepository()
    {
        using var dbContext = CreateDbContext();
        var owner = await AddUserAsync(dbContext, "demo", "demo@example.com");
        var user = await AddUserAsync(dbContext, "fan", "fan@example.com");
        var repository = await AddRepositoryAsync(dbContext, owner, "awesome-repo", "public", pullCount: 0);

        var star = new RepositoryStar { RepositoryId = repository.Id, UserId = user.Id, CreatedAt = DateTime.UtcNow };
        dbContext.RepositoryStars.Add(star);
        repository.StarCount = 1;
        await dbContext.SaveChangesAsync();

        var service = new RepositoriesService(dbContext);
        var result = await service.UnstarRepositoryAsync(repository.Id, "fan", CancellationToken.None);

        Assert.IsTrue(result.Succeeded);
        Assert.IsNotNull(result.Data);
        Assert.AreEqual(0, result.Data.StarCount);

        // Verify in database
        var updatedRepo = await dbContext.Repositories
            .Include(r => r.Stars)
            .FirstOrDefaultAsync(r => r.Id == repository.Id);
        
        Assert.AreEqual(0, updatedRepo?.StarCount);
        Assert.AreEqual(0, updatedRepo?.Stars.Count);
    }

    [TestMethod]
    public async Task ExploreRepositoriesAsync_WithStarredFilter_ReturnsOnlyStarredRepositories()
    {
        using var dbContext = CreateDbContext();
        var owner = await AddUserAsync(dbContext, "demo", "demo@example.com");
        var user = await AddUserAsync(dbContext, "fan", "fan@example.com");

        var repo1 = await AddRepositoryAsync(dbContext, owner, "repo1", "public", pullCount: 0);
        var repo2 = await AddRepositoryAsync(dbContext, owner, "repo2", "public", pullCount: 0);
        var repo3 = await AddRepositoryAsync(dbContext, owner, "repo3", "public", pullCount: 0);

        // Star only repo1 and repo3
        dbContext.RepositoryStars.Add(new RepositoryStar { RepositoryId = repo1.Id, UserId = user.Id, CreatedAt = DateTime.UtcNow });
        dbContext.RepositoryStars.Add(new RepositoryStar { RepositoryId = repo3.Id, UserId = user.Id, CreatedAt = DateTime.UtcNow });
        repo1.StarCount = 1;
        repo3.StarCount = 1;
        await dbContext.SaveChangesAsync();

        var service = new RepositoriesService(dbContext);
        var result = await service.ExploreRepositoriesAsync(
            search: null,
            owner: null,
            visibility: null,
            minStars: null,
            sortBy: "name",
            sortDir: "asc",
            mine: false,
            starred: true,
            badges: null,
            page: 1,
            pageSize: 20,
            currentUsername: "fan",
            cancellationToken: CancellationToken.None);

        Assert.IsTrue(result.Succeeded);
        Assert.IsNotNull(result.Data);
        Assert.AreEqual(2, result.Data.Total);

        var repoNames = result.Data.Repositories.Select(r => r.Name).ToList();
        CollectionAssert.AreEqual(new[] { "repo1", "repo3" }, repoNames);
    }

    [TestMethod]
    public async Task AddRepositoryCollaboratorAsync_OnPublicRepository_AddsCollaborator()
    {
        using var dbContext = CreateDbContext();
        var owner = await AddUserAsync(dbContext, "demo", "demo@example.com");
        var collaborator = await AddUserAsync(dbContext, "friend", "friend@example.com");
        var repository = await AddRepositoryAsync(dbContext, owner, "public-repo", "public", pullCount: 0);

        var service = new RepositoriesService(dbContext);
        var result = await service.AddRepositoryCollaboratorAsync(
            repository.Id,
            identifier: collaborator.Username,
            role: "write",
            currentUsername: owner.Username,
            userRole: User.RoleUser,
            cancellationToken: CancellationToken.None);

        Assert.IsTrue(result.Succeeded);
        Assert.IsNotNull(result.Data);
        Assert.AreEqual("friend", result.Data.Username);
        Assert.AreEqual(1, await dbContext.RepositoryCollaborators.CountAsync());
    }

    [TestMethod]
    public async Task RemoveRepositoryCollaboratorAsync_RemovesCollaboratorEntry()
    {
        using var dbContext = CreateDbContext();
        var owner = await AddUserAsync(dbContext, "demo", "demo@example.com");
        var collaborator = await AddUserAsync(dbContext, "friend", "friend@example.com");
        var repository = await AddRepositoryAsync(dbContext, owner, "public-repo", "public", pullCount: 0);
        dbContext.RepositoryCollaborators.Add(new RepositoryCollaborator
        {
            RepositoryId = repository.Id,
            UserId = collaborator.Id,
            User = collaborator,
            Repository = repository,
            Role = "write",
            AddedAt = DateTime.UtcNow
        });
        await dbContext.SaveChangesAsync();

        var service = new RepositoriesService(dbContext);
        var result = await service.RemoveRepositoryCollaboratorAsync(
            repository.Id,
            collaborator.Id,
            currentUsername: owner.Username,
            userRole: User.RoleUser,
            cancellationToken: CancellationToken.None);

        Assert.IsTrue(result.Succeeded);
        Assert.AreEqual(0, await dbContext.RepositoryCollaborators.CountAsync());
    }

    [TestMethod]
    public async Task DeleteRepositoryTagAsync_RemovesTagFromRepository()
    {
        using var dbContext = CreateDbContext();
        var owner = await AddUserAsync(dbContext, "demo", "demo@example.com");
        var repository = await AddRepositoryAsync(dbContext, owner, "sample", "public", pullCount: 0);
        await AddTagAsync(dbContext, repository, "obsolete", pullCount: 1, compressedSizeBytes: 100);

        var service = new RepositoriesService(dbContext);
        var result = await service.DeleteRepositoryTagAsync(
            repository.Id,
            tagName: "obsolete",
            currentUsername: owner.Username,
            userRole: User.RoleUser,
            cancellationToken: CancellationToken.None);

        Assert.IsTrue(result.Succeeded);
        Assert.AreEqual(0, await dbContext.RepositoryTags.CountAsync());
    }

    [TestMethod]
    public async Task GetRepositoryAsync_ForOrgRepo_IncludesOrganizationInfo()
    {
        using var dbContext = CreateDbContext();
        var owner = await AddUserAsync(dbContext, "owner", "owner@example.com");

        var org = new Organization
        {
            Name = "acme",
            DisplayName = "Acme Corp",
            Description = "Acme org",
            OwnerId = owner.Id,
            AvatarUrl = "https://example.com/acme.png",
            CreatedAt = DateTime.UtcNow,
            UpdatedAt = DateTime.UtcNow
        };
        dbContext.Organizations.Add(org);
        await dbContext.SaveChangesAsync();

        var repo = new Repository
        {
            Name = "api",
            Description = "API service",
            Visibility = "public",
            OwnerId = owner.Id,
            OrganizationId = org.Id,
            CreatedAt = DateTime.UtcNow,
            UpdatedAt = DateTime.UtcNow
        };
        dbContext.Repositories.Add(repo);
        await dbContext.SaveChangesAsync();

        var service = new RepositoriesService(dbContext);
        var result = await service.GetRepositoryAsync(repo.Id, null, null, CancellationToken.None);

        Assert.IsTrue(result.Succeeded);
        Assert.IsNotNull(result.Data);
        Assert.IsNotNull(result.Data.Organization);
        Assert.AreEqual(org.Id, result.Data.Organization.Id);
        Assert.AreEqual("acme", result.Data.Organization.Name);
        Assert.AreEqual("Acme Corp", result.Data.Organization.DisplayName);
        Assert.AreEqual("https://example.com/acme.png", result.Data.Organization.AvatarUrl);
        Assert.AreEqual("acme/api", result.Data.FullName);
    }

    [TestMethod]
    public async Task GetRepositoryAsync_ForUserRepo_OmitsOrganizationInfo()
    {
        using var dbContext = CreateDbContext();
        var owner = await AddUserAsync(dbContext, "owner", "owner@example.com");
        var repo = await AddRepositoryAsync(dbContext, owner, "userrepo", "public", pullCount: 0);

        var service = new RepositoriesService(dbContext);
        var result = await service.GetRepositoryAsync(repo.Id, null, null, CancellationToken.None);

        Assert.IsTrue(result.Succeeded);
        Assert.IsNotNull(result.Data);
        Assert.IsNull(result.Data.Organization);
    }

    [TestMethod]
    public async Task ExploreRepositoriesAsync_ForOrgRepo_IncludesOrganizationInfo()
    {
        using var dbContext = CreateDbContext();
        var owner = await AddUserAsync(dbContext, "owner", "owner@example.com");

        var org = new Organization
        {
            Name = "widgets",
            DisplayName = "Widgets Inc",
            Description = "Widget org",
            OwnerId = owner.Id,
            CreatedAt = DateTime.UtcNow,
            UpdatedAt = DateTime.UtcNow
        };
        dbContext.Organizations.Add(org);
        await dbContext.SaveChangesAsync();

        dbContext.Repositories.Add(new Repository
        {
            Name = "sdk",
            Description = "SDK",
            Visibility = "public",
            OwnerId = owner.Id,
            OrganizationId = org.Id,
            CreatedAt = DateTime.UtcNow,
            UpdatedAt = DateTime.UtcNow
        });
        await dbContext.SaveChangesAsync();

        var service = new RepositoriesService(dbContext);
        var result = await service.ExploreRepositoriesAsync(
            search: "sdk", owner: null, visibility: null, minStars: null,
            sortBy: null, sortDir: null, mine: false, starred: false, badges: null,
            page: 1, pageSize: 20, currentUsername: null, CancellationToken.None);

        Assert.IsTrue(result.Succeeded);
        Assert.AreEqual(1, result.Data!.Total);
        var repo = result.Data.Repositories[0];
        Assert.IsNotNull(repo.Organization);
        Assert.AreEqual("widgets", repo.Organization.Name);
        Assert.AreEqual("Widgets Inc", repo.Organization.DisplayName);
    }

    // ---- GetRepositoryTeamsAsync ----

    [TestMethod]
    public async Task GetRepositoryTeamsAsync_OrgMember_ReturnsTeamList()
    {
        using var dbContext = CreateDbContext();
        var owner = await AddUserAsync(dbContext, "owner", "owner@example.com");
        var (org, repo) = await SetupOrgRepo(dbContext, owner, "acme", "api", "public");
        var team = await AddTeam(dbContext, org, "devs");
        dbContext.OrganizationTeamRepositories.Add(new OrganizationTeamRepository
        {
            TeamId = team.Id,
            RepositoryId = repo.Id,
            Permission = OrganizationTeamRepository.PermissionReadWrite
        });
        await dbContext.SaveChangesAsync();

        var service = new RepositoriesService(dbContext);
        var result = await service.GetRepositoryTeamsAsync(repo.Id, owner.Username, User.RoleUser, CancellationToken.None);

        Assert.IsTrue(result.Succeeded);
        Assert.IsNotNull(result.Data);
        Assert.AreEqual(1, result.Data.Total);
        Assert.AreEqual("devs", result.Data.Teams[0].TeamName);
        Assert.AreEqual(OrganizationTeamRepository.PermissionReadWrite, result.Data.Teams[0].Permission);
        Assert.AreEqual("acme", result.Data.Teams[0].OrganizationName);
    }

    [TestMethod]
    public async Task GetRepositoryTeamsAsync_NoTeams_ReturnsEmptyList()
    {
        using var dbContext = CreateDbContext();
        var owner = await AddUserAsync(dbContext, "owner", "owner@example.com");
        var (_, repo) = await SetupOrgRepo(dbContext, owner, "acme", "api", "public");

        var service = new RepositoriesService(dbContext);
        var result = await service.GetRepositoryTeamsAsync(repo.Id, owner.Username, User.RoleUser, CancellationToken.None);

        Assert.IsTrue(result.Succeeded);
        Assert.AreEqual(0, result.Data!.Total);
    }

    [TestMethod]
    public async Task GetRepositoryTeamsAsync_NonOrgMember_ReturnsForbidden()
    {
        using var dbContext = CreateDbContext();
        var owner = await AddUserAsync(dbContext, "owner", "owner@example.com");
        var outsider = await AddUserAsync(dbContext, "outsider", "outsider@example.com");
        var (_, repo) = await SetupOrgRepo(dbContext, owner, "acme", "api", "public");

        var service = new RepositoriesService(dbContext);
        var result = await service.GetRepositoryTeamsAsync(repo.Id, outsider.Username, User.RoleUser, CancellationToken.None);

        Assert.IsFalse(result.Succeeded);
        Assert.AreEqual("Forbidden", result.ErrorMessage);
    }

    [TestMethod]
    public async Task GetRepositoryTeamsAsync_PersonalRepo_ReturnsError()
    {
        using var dbContext = CreateDbContext();
        var owner = await AddUserAsync(dbContext, "owner", "owner@example.com");
        var repo = await AddRepositoryAsync(dbContext, owner, "personal", "public", pullCount: 0);

        var service = new RepositoriesService(dbContext);
        var result = await service.GetRepositoryTeamsAsync(repo.Id, owner.Username, User.RoleUser, CancellationToken.None);

        Assert.IsFalse(result.Succeeded);
        Assert.AreEqual("Repository does not belong to an organization.", result.ErrorMessage);
    }

    [TestMethod]
    public async Task GetRepositoryTeamsAsync_RepoNotFound_ReturnsError()
    {
        using var dbContext = CreateDbContext();
        var service = new RepositoriesService(dbContext);

        var result = await service.GetRepositoryTeamsAsync(9999, null, null, CancellationToken.None);

        Assert.IsFalse(result.Succeeded);
        Assert.AreEqual("Repository not found.", result.ErrorMessage);
    }

    [TestMethod]
    public async Task GetRepositoryTeamsAsync_SystemAdmin_CanViewWithoutMembership()
    {
        using var dbContext = CreateDbContext();
        var owner = await AddUserAsync(dbContext, "owner", "owner@example.com");
        var admin = await AddUserAsync(dbContext, "admin", "admin@example.com", User.RoleAdministrator);
        var (_, repo) = await SetupOrgRepo(dbContext, owner, "acme", "api", "private");

        var service = new RepositoriesService(dbContext);
        var result = await service.GetRepositoryTeamsAsync(repo.Id, admin.Username, User.RoleAdministrator, CancellationToken.None);

        Assert.IsTrue(result.Succeeded);
    }

    [TestMethod]
    public async Task GetRepositoryTeamsAsync_SuperAdmin_CanViewWithoutMembership()
    {
        using var dbContext = CreateDbContext();
        var owner = await AddUserAsync(dbContext, "owner", "owner@example.com");
        var superAdmin = await AddUserAsync(dbContext, "superadmin", "superadmin@example.com", User.RoleSuperAdmin);
        var (_, repo) = await SetupOrgRepo(dbContext, owner, "acme", "api", "private");

        var service = new RepositoriesService(dbContext);
        var result = await service.GetRepositoryTeamsAsync(repo.Id, superAdmin.Username, User.RoleSuperAdmin, CancellationToken.None);

        Assert.IsTrue(result.Succeeded);
    }

    // ---- SetRepositoryTeamPermissionAsync ----

    [TestMethod]
    public async Task SetRepositoryTeamPermissionAsync_OrgAdmin_AssignsPermission()
    {
        using var dbContext = CreateDbContext();
        var owner = await AddUserAsync(dbContext, "owner", "owner@example.com");
        var (org, repo) = await SetupOrgRepo(dbContext, owner, "acme", "api", "public");
        var team = await AddTeam(dbContext, org, "devs");

        var service = new RepositoriesService(dbContext);
        var result = await service.SetRepositoryTeamPermissionAsync(repo.Id, team.Id, "read+write", owner.Username, User.RoleUser, CancellationToken.None);

        Assert.IsTrue(result.Succeeded);
        Assert.IsNotNull(result.Data);
        Assert.AreEqual("devs", result.Data.TeamName);
        Assert.AreEqual("read+write", result.Data.Permission);

        var stored = await dbContext.OrganizationTeamRepositories.SingleAsync();
        Assert.AreEqual(OrganizationTeamRepository.PermissionReadWrite, stored.Permission);
    }

    [TestMethod]
    public async Task SetRepositoryTeamPermissionAsync_UpdatesExistingPermission()
    {
        using var dbContext = CreateDbContext();
        var owner = await AddUserAsync(dbContext, "owner", "owner@example.com");
        var (org, repo) = await SetupOrgRepo(dbContext, owner, "acme", "api", "public");
        var team = await AddTeam(dbContext, org, "devs");

        dbContext.OrganizationTeamRepositories.Add(new OrganizationTeamRepository
        {
            TeamId = team.Id,
            RepositoryId = repo.Id,
            Permission = OrganizationTeamRepository.PermissionReadOnly
        });
        await dbContext.SaveChangesAsync();

        var service = new RepositoriesService(dbContext);
        var result = await service.SetRepositoryTeamPermissionAsync(repo.Id, team.Id, "admin", owner.Username, User.RoleUser, CancellationToken.None);

        Assert.IsTrue(result.Succeeded);
        Assert.AreEqual("admin", result.Data!.Permission);

        var stored = await dbContext.OrganizationTeamRepositories.SingleAsync();
        Assert.AreEqual(OrganizationTeamRepository.PermissionAdmin, stored.Permission);
    }

    [TestMethod]
    public async Task SetRepositoryTeamPermissionAsync_InvalidPermission_ReturnsError()
    {
        using var dbContext = CreateDbContext();
        var owner = await AddUserAsync(dbContext, "owner", "owner@example.com");
        var (org, repo) = await SetupOrgRepo(dbContext, owner, "acme", "api", "public");
        var team = await AddTeam(dbContext, org, "devs");

        var service = new RepositoriesService(dbContext);
        var result = await service.SetRepositoryTeamPermissionAsync(repo.Id, team.Id, "wrong", owner.Username, User.RoleUser, CancellationToken.None);

        Assert.IsFalse(result.Succeeded);
        Assert.AreEqual("Permission must be 'read-only', 'read+write', or 'admin'.", result.ErrorMessage);
    }

    [TestMethod]
    public async Task SetRepositoryTeamPermissionAsync_TeamFromDifferentOrg_ReturnsNotFound()
    {
        using var dbContext = CreateDbContext();
        var owner = await AddUserAsync(dbContext, "owner", "owner@example.com");
        var (_, repo) = await SetupOrgRepo(dbContext, owner, "acme", "api", "public");
        var (otherOrg, _) = await SetupOrgRepo(dbContext, owner, "other", "svc", "public");
        var foreignTeam = await AddTeam(dbContext, otherOrg, "foreignteam");

        var service = new RepositoriesService(dbContext);
        var result = await service.SetRepositoryTeamPermissionAsync(repo.Id, foreignTeam.Id, "read-only", owner.Username, User.RoleUser, CancellationToken.None);

        Assert.IsFalse(result.Succeeded);
        Assert.AreEqual("Team not found in this organization.", result.ErrorMessage);
    }

    [TestMethod]
    public async Task SetRepositoryTeamPermissionAsync_Outsider_ReturnsForbidden()
    {
        using var dbContext = CreateDbContext();
        var owner = await AddUserAsync(dbContext, "owner", "owner@example.com");
        var outsider = await AddUserAsync(dbContext, "outsider", "outsider@example.com");
        var (org, repo) = await SetupOrgRepo(dbContext, owner, "acme", "api", "public");
        var team = await AddTeam(dbContext, org, "devs");

        var service = new RepositoriesService(dbContext);
        var result = await service.SetRepositoryTeamPermissionAsync(repo.Id, team.Id, "read-only", outsider.Username, User.RoleUser, CancellationToken.None);

        Assert.IsFalse(result.Succeeded);
        Assert.AreEqual("Forbidden", result.ErrorMessage);
    }

    [TestMethod]
    public async Task SetRepositoryTeamPermissionAsync_PersonalRepo_ReturnsError()
    {
        using var dbContext = CreateDbContext();
        var owner = await AddUserAsync(dbContext, "owner", "owner@example.com");
        var repo = await AddRepositoryAsync(dbContext, owner, "personal", "public", pullCount: 0);

        var service = new RepositoriesService(dbContext);
        var result = await service.SetRepositoryTeamPermissionAsync(repo.Id, 1, "read-only", owner.Username, User.RoleUser, CancellationToken.None);

        Assert.IsFalse(result.Succeeded);
        Assert.AreEqual("Repository does not belong to an organization.", result.ErrorMessage);
    }

    // ---- Team-based repository permission enforcement ----

    [TestMethod]
    public async Task DeleteRepositoryTagAsync_TeamReadWriteMember_Succeeds()
    {
        using var dbContext = CreateDbContext();
        var owner = await AddUserAsync(dbContext, "owner", "owner@example.com");
        var member = await AddUserAsync(dbContext, "writer", "writer@example.com");
        var (org, repo) = await SetupOrgRepo(dbContext, owner, "acme", "api", "public");
        var team = await AddTeam(dbContext, org, "devs");
        await AddTeamMember(dbContext, org, team, member, OrganizationTeamRepository.PermissionReadWrite, repo);
        await AddTagAsync(dbContext, repo, "v1", pullCount: 0, compressedSizeBytes: 100);

        var service = new RepositoriesService(dbContext);
        var result = await service.DeleteRepositoryTagAsync(repo.Id, "v1", member.Username, User.RoleUser, CancellationToken.None);

        Assert.IsTrue(result.Succeeded);
        Assert.AreEqual(0, await dbContext.RepositoryTags.CountAsync());
    }

    [TestMethod]
    public async Task DeleteRepositoryTagAsync_TeamAdminMember_Succeeds()
    {
        using var dbContext = CreateDbContext();
        var owner = await AddUserAsync(dbContext, "owner", "owner@example.com");
        var member = await AddUserAsync(dbContext, "admin-member", "admin-member@example.com");
        var (org, repo) = await SetupOrgRepo(dbContext, owner, "acme", "api", "public");
        var team = await AddTeam(dbContext, org, "leads");
        await AddTeamMember(dbContext, org, team, member, OrganizationTeamRepository.PermissionAdmin, repo);
        await AddTagAsync(dbContext, repo, "v1", pullCount: 0, compressedSizeBytes: 100);

        var service = new RepositoriesService(dbContext);
        var result = await service.DeleteRepositoryTagAsync(repo.Id, "v1", member.Username, User.RoleUser, CancellationToken.None);

        Assert.IsTrue(result.Succeeded);
    }

    [TestMethod]
    public async Task DeleteRepositoryTagAsync_TeamReadOnlyMember_ReturnsForbidden()
    {
        using var dbContext = CreateDbContext();
        var owner = await AddUserAsync(dbContext, "owner", "owner@example.com");
        var member = await AddUserAsync(dbContext, "reader", "reader@example.com");
        var (org, repo) = await SetupOrgRepo(dbContext, owner, "acme", "api", "public");
        var team = await AddTeam(dbContext, org, "viewers");
        await AddTeamMember(dbContext, org, team, member, OrganizationTeamRepository.PermissionReadOnly, repo);
        await AddTagAsync(dbContext, repo, "v1", pullCount: 0, compressedSizeBytes: 100);

        var service = new RepositoriesService(dbContext);
        var result = await service.DeleteRepositoryTagAsync(repo.Id, "v1", member.Username, User.RoleUser, CancellationToken.None);

        Assert.IsFalse(result.Succeeded);
        Assert.AreEqual("Forbidden", result.ErrorMessage);
        Assert.AreEqual(1, await dbContext.RepositoryTags.CountAsync());
    }

    [TestMethod]
    public async Task DeleteRepositoryTagAsync_OrgMemberWithoutTeamPermission_ReturnsForbidden()
    {
        using var dbContext = CreateDbContext();
        var owner = await AddUserAsync(dbContext, "owner", "owner@example.com");
        var member = await AddUserAsync(dbContext, "bystander", "bystander@example.com");
        var (org, repo) = await SetupOrgRepo(dbContext, owner, "acme", "api", "public");
        dbContext.OrganizationMembers.Add(new OrganizationMember
        {
            OrganizationId = org.Id,
            UserId = member.Id,
            Role = OrganizationMember.RoleMember,
            AddedAt = DateTime.UtcNow
        });
        await dbContext.SaveChangesAsync();
        await AddTagAsync(dbContext, repo, "v1", pullCount: 0, compressedSizeBytes: 100);

        var service = new RepositoriesService(dbContext);
        var result = await service.DeleteRepositoryTagAsync(repo.Id, "v1", member.Username, User.RoleUser, CancellationToken.None);

        Assert.IsFalse(result.Succeeded);
        Assert.AreEqual("Forbidden", result.ErrorMessage);
    }

    [TestMethod]
    public async Task UpdateRepositoryAsync_TeamReadWriteMember_ReturnsForbidden()
    {
        using var dbContext = CreateDbContext();
        var owner = await AddUserAsync(dbContext, "owner", "owner@example.com");
        var member = await AddUserAsync(dbContext, "writer", "writer@example.com");
        var (org, repo) = await SetupOrgRepo(dbContext, owner, "acme", "api", "public");
        var team = await AddTeam(dbContext, org, "devs");
        await AddTeamMember(dbContext, org, team, member, OrganizationTeamRepository.PermissionReadWrite, repo);

        var service = new RepositoriesService(dbContext);
        var result = await service.UpdateRepositoryAsync(repo.Id, null, "new description", null, member.Username, User.RoleUser, CancellationToken.None);

        Assert.IsFalse(result.Succeeded);
        Assert.AreEqual("Forbidden", result.ErrorMessage);
    }

    [TestMethod]
    public async Task UpdateRepositoryAsync_TeamAdminMember_Succeeds()
    {
        using var dbContext = CreateDbContext();
        var owner = await AddUserAsync(dbContext, "owner", "owner@example.com");
        var member = await AddUserAsync(dbContext, "admin-member", "admin-member@example.com");
        var (org, repo) = await SetupOrgRepo(dbContext, owner, "acme", "api", "public");
        var team = await AddTeam(dbContext, org, "leads");
        await AddTeamMember(dbContext, org, team, member, OrganizationTeamRepository.PermissionAdmin, repo);

        var service = new RepositoriesService(dbContext);
        var result = await service.UpdateRepositoryAsync(repo.Id, null, "new description", null, member.Username, User.RoleUser, CancellationToken.None);

        Assert.IsTrue(result.Succeeded);
        Assert.AreEqual("new description", result.Data!.Description);
    }

    // ---- RemoveRepositoryTeamAsync ----

    [TestMethod]
    public async Task RemoveRepositoryTeamAsync_Owner_RemovesAccess()
    {
        using var dbContext = CreateDbContext();
        var owner = await AddUserAsync(dbContext, "owner", "owner@example.com");
        var (org, repo) = await SetupOrgRepo(dbContext, owner, "acme", "api", "public");
        var team = await AddTeam(dbContext, org, "devs");

        dbContext.OrganizationTeamRepositories.Add(new OrganizationTeamRepository
        {
            TeamId = team.Id,
            RepositoryId = repo.Id,
            Permission = OrganizationTeamRepository.PermissionReadWrite
        });
        await dbContext.SaveChangesAsync();

        var service = new RepositoriesService(dbContext);
        var result = await service.RemoveRepositoryTeamAsync(repo.Id, team.Id, owner.Username, User.RoleUser, CancellationToken.None);

        Assert.IsTrue(result.Succeeded);
        Assert.AreEqual(0, await dbContext.OrganizationTeamRepositories.CountAsync());
    }

    [TestMethod]
    public async Task RemoveRepositoryTeamAsync_TeamNotAssigned_ReturnsError()
    {
        using var dbContext = CreateDbContext();
        var owner = await AddUserAsync(dbContext, "owner", "owner@example.com");
        var (org, repo) = await SetupOrgRepo(dbContext, owner, "acme", "api", "public");
        var team = await AddTeam(dbContext, org, "devs");

        var service = new RepositoriesService(dbContext);
        var result = await service.RemoveRepositoryTeamAsync(repo.Id, team.Id, owner.Username, User.RoleUser, CancellationToken.None);

        Assert.IsFalse(result.Succeeded);
        Assert.AreEqual("Team not assigned to this repository.", result.ErrorMessage);
    }

    [TestMethod]
    public async Task RemoveRepositoryTeamAsync_Outsider_ReturnsForbidden()
    {
        using var dbContext = CreateDbContext();
        var owner = await AddUserAsync(dbContext, "owner", "owner@example.com");
        var outsider = await AddUserAsync(dbContext, "outsider", "outsider@example.com");
        var (org, repo) = await SetupOrgRepo(dbContext, owner, "acme", "api", "public");
        var team = await AddTeam(dbContext, org, "devs");

        dbContext.OrganizationTeamRepositories.Add(new OrganizationTeamRepository
        {
            TeamId = team.Id,
            RepositoryId = repo.Id,
            Permission = OrganizationTeamRepository.PermissionReadOnly
        });
        await dbContext.SaveChangesAsync();

        var service = new RepositoriesService(dbContext);
        var result = await service.RemoveRepositoryTeamAsync(repo.Id, team.Id, outsider.Username, User.RoleUser, CancellationToken.None);

        Assert.IsFalse(result.Succeeded);
        Assert.AreEqual("Forbidden", result.ErrorMessage);
    }

    [TestMethod]
    public async Task GetDashboardStatsAsync_WithNoUser_ReturnsUnauthorized()
    {
        using var dbContext = CreateDbContext();
        var service = new RepositoriesService(dbContext);

        var result = await service.GetDashboardStatsAsync(null, CancellationToken.None);

        Assert.IsFalse(result.Succeeded);
        Assert.AreEqual("Unauthorized", result.ErrorMessage);
    }

    [TestMethod]
    public async Task GetDashboardStatsAsync_WithOwnedRepositoriesAndOrgMembership_AggregatesStats()
    {
        using var dbContext = CreateDbContext();
        var owner = await AddUserAsync(dbContext, "demo", "demo@example.com");
        await AddRepositoryAsync(dbContext, owner, "repo1", "public", pullCount: 10, starCount: 2);
        await AddRepositoryAsync(dbContext, owner, "repo2", "public", pullCount: 5, starCount: 1);
        await SetupOrgRepo(dbContext, owner, "acme", "org-repo", "public");

        var service = new RepositoriesService(dbContext);
        var result = await service.GetDashboardStatsAsync("demo", CancellationToken.None);

        Assert.IsTrue(result.Succeeded);
        Assert.IsNotNull(result.Data);
        Assert.AreEqual(3, result.Data.RepositoryCount);
        Assert.AreEqual(15, result.Data.TotalPulls);
        Assert.AreEqual(3, result.Data.TotalStars);
        Assert.AreEqual(1, result.Data.TeamsCount);
    }

    [TestMethod]
    public async Task GetDashboardStatsAsync_WithNoRepositories_ReturnsZeroes()
    {
        using var dbContext = CreateDbContext();
        await AddUserAsync(dbContext, "demo", "demo@example.com");

        var service = new RepositoriesService(dbContext);
        var result = await service.GetDashboardStatsAsync("demo", CancellationToken.None);

        Assert.IsTrue(result.Succeeded);
        Assert.IsNotNull(result.Data);
        Assert.AreEqual(0, result.Data.RepositoryCount);
        Assert.AreEqual(0, result.Data.TotalPulls);
        Assert.AreEqual(0, result.Data.TotalStars);
        Assert.AreEqual(0, result.Data.TeamsCount);
    }

    // ---- Test helpers ----

    private static async Task<(Organization Org, Repository Repo)> SetupOrgRepo(
        AppDbContext dbContext, User owner, string orgName, string repoName, string visibility)
    {
        var org = new Organization
        {
            Name = orgName,
            DisplayName = orgName,
            Description = $"{orgName} org",
            OwnerId = owner.Id,
            CreatedAt = DateTime.UtcNow,
            UpdatedAt = DateTime.UtcNow
        };
        dbContext.Organizations.Add(org);
        await dbContext.SaveChangesAsync();

        dbContext.OrganizationMembers.Add(new OrganizationMember
        {
            OrganizationId = org.Id,
            UserId = owner.Id,
            Role = OrganizationMember.RoleOwner,
            AddedAt = DateTime.UtcNow
        });

        var repo = new Repository
        {
            Name = repoName,
            Description = $"Desc for {repoName}",
            Visibility = visibility,
            OwnerId = owner.Id,
            OrganizationId = org.Id,
            CreatedAt = DateTime.UtcNow,
            UpdatedAt = DateTime.UtcNow
        };
        dbContext.Repositories.Add(repo);
        await dbContext.SaveChangesAsync();
        return (org, repo);
    }

    private static async Task<OrganizationTeam> AddTeam(AppDbContext dbContext, Organization org, string name)
    {
        var team = new OrganizationTeam
        {
            OrganizationId = org.Id,
            Name = name,
            CreatedAt = DateTime.UtcNow,
            UpdatedAt = DateTime.UtcNow
        };
        dbContext.OrganizationTeams.Add(team);
        await dbContext.SaveChangesAsync();
        return team;
    }

    private static async Task AddTeamMember(
        AppDbContext dbContext, Organization org, OrganizationTeam team, User user, string repoPermission, Repository repo)
    {
        dbContext.OrganizationMembers.Add(new OrganizationMember
        {
            OrganizationId = org.Id,
            UserId = user.Id,
            Role = OrganizationMember.RoleMember,
            AddedAt = DateTime.UtcNow
        });
        dbContext.OrganizationTeamMembers.Add(new OrganizationTeamMember
        {
            TeamId = team.Id,
            UserId = user.Id,
            AddedAt = DateTime.UtcNow
        });
        dbContext.OrganizationTeamRepositories.Add(new OrganizationTeamRepository
        {
            TeamId = team.Id,
            RepositoryId = repo.Id,
            Permission = repoPermission
        });
        await dbContext.SaveChangesAsync();
    }

    private static AppDbContext CreateDbContext()
    {
        var options = new DbContextOptionsBuilder<AppDbContext>()
            .UseInMemoryDatabase(Guid.NewGuid().ToString())
            .Options;

        return new AppDbContext(options);
    }

    private static async Task<User> AddUserAsync(AppDbContext dbContext, string username, string email, string role = User.RoleUser)
    {
        var user = new User
        {
            Username = username,
            Email = email,
            PasswordHash = User.HashPassword("Password1"),
            Role = role,
            CreatedAt = DateTime.UtcNow
        };

        dbContext.Users.Add(user);
        await dbContext.SaveChangesAsync();
        return user;
    }

    private static async Task<Repository> AddRepositoryAsync(AppDbContext dbContext, User owner, string name, string visibility, int pullCount, int starCount = 0, bool isOfficial = false)
    {
        var repository = new Repository
        {
            Name = name,
            Description = $"Description for {name}",
            Visibility = visibility,
            OwnerId = owner.Id,
            Owner = owner,
            CreatedAt = DateTime.UtcNow.AddMinutes(-5),
            UpdatedAt = DateTime.UtcNow,
            PullCount = pullCount,
            StarCount = starCount,
            IsOfficial = isOfficial
        };

        dbContext.Repositories.Add(repository);
        await dbContext.SaveChangesAsync();
        return repository;
    }

    private static async Task AddTagAsync(AppDbContext dbContext, Repository repository, string name, int pullCount, long compressedSizeBytes)
    {
        dbContext.RepositoryTags.Add(new RepositoryTag
        {
            RepositoryId = repository.Id,
            Repository = repository,
            Name = name,
            PullCount = pullCount,
            CompressedSizeBytes = compressedSizeBytes,
            CreatedAt = DateTime.UtcNow.AddMinutes(-10),
            LastPushedAt = DateTime.UtcNow.AddMinutes(-pullCount),
            LastPulledAt = DateTime.UtcNow.AddMinutes(-Math.Max(1, pullCount))
        });

        await dbContext.SaveChangesAsync();
    }
}