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
    public async Task CreateRepositoryAsync_WithValidInput_CreatesRepository()
    {
        using var dbContext = CreateDbContext();
        await AddUserAsync(dbContext, "demo", "demo@example.com");

        var service = new RepositoriesService(dbContext);
        var result = await service.CreateRepositoryAsync(
            name: "sample-repo",
            description: "Created from test",
            visibility: "public",
            username: "demo",
            cancellationToken: CancellationToken.None);

        Assert.IsTrue(result.Succeeded);
        Assert.IsNotNull(result.Data);
        Assert.AreEqual("sample-repo", result.Data.Name);

        var storedRepository = await dbContext.Repositories.SingleAsync();
        Assert.AreEqual("sample-repo", storedRepository.Name);
        Assert.AreEqual("public", storedRepository.Visibility);
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

    private static async Task<Repository> AddRepositoryAsync(AppDbContext dbContext, User owner, string name, string visibility, int pullCount, int starCount = 0)
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
            IsOfficial = false
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