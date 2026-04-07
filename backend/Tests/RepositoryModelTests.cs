using backend.Data;
using backend.Models;
using Microsoft.EntityFrameworkCore;

namespace backend.Tests;

[TestClass]
public sealed class RepositoryModelTests
{
    [TestMethod]
    public void Repository_GetFullName_UsesOwnerPrefixUnlessOfficial()
    {
        var owner = new User { Email = "owner@example.com", Username = "owner" };
        var repository = new Repository { Name = "sample", Owner = owner, IsOfficial = false };
        var officialRepository = new Repository { Name = "official", Owner = owner, IsOfficial = true };

        Assert.AreEqual("owner/sample", repository.GetFullName());
        Assert.AreEqual("official", officialRepository.GetFullName());
        Assert.AreEqual(0, repository.PullCount);
        Assert.AreEqual(0, repository.StarCount);
        Assert.AreEqual("write", new RepositoryCollaborator().Role);
    }

    [TestMethod]
    public async Task Repository_QueryHelpers_FilterAndCountCorrectly()
    {
        using var dbContext = TestHelpers.CreateDbContext();
        var owner = await TestHelpers.AddUserAsync(dbContext, "owner", "owner@example.com");
        var other = await TestHelpers.AddUserAsync(dbContext, "other", "other@example.com");
        var publicRepo = await TestHelpers.AddRepositoryAsync(dbContext, owner, "public-repo", "public", pullCount: 4, starCount: 2, description: "contains term");
        await TestHelpers.AddRepositoryAsync(dbContext, owner, "private-repo", "private", pullCount: 1);
        await TestHelpers.AddRepositoryAsync(dbContext, other, "other-repo", "public", pullCount: 3, starCount: 9);
        await TestHelpers.AddTagAsync(dbContext, publicRepo, "latest", 1, 100);

        var byId = await Repository.GetByIdAsync(dbContext, publicRepo.Id, CancellationToken.None);
        var publicItems = await Repository.GetPublicAsync(dbContext, "term", 1, 20, CancellationToken.None);
        var publicCount = await Repository.GetPublicCountAsync(dbContext, null, CancellationToken.None);
        var ownerItems = await Repository.GetByOwnerAsync(dbContext, owner.Id, 1, 20, CancellationToken.None);
        var ownerCount = await Repository.GetOwnerCountAsync(dbContext, owner.Id, CancellationToken.None);
        var exists = await Repository.ExistsAsync(dbContext, "public-repo", owner.Id, CancellationToken.None);

        Assert.IsNotNull(byId);
        Assert.AreEqual(1, publicItems.Count);
        Assert.AreEqual(2, publicCount);
        Assert.AreEqual(2, ownerItems.Count);
        Assert.AreEqual(2, ownerCount);
        Assert.IsTrue(exists);
    }

    [TestMethod]
    public async Task RepositoryTag_AndRepositoryStar_QueryHelpers_Work()
    {
        using var dbContext = TestHelpers.CreateDbContext();
        var owner = await TestHelpers.AddUserAsync(dbContext, "owner", "owner@example.com");
        var user = await TestHelpers.AddUserAsync(dbContext, "user", "user@example.com");
        var repository = await TestHelpers.AddRepositoryAsync(dbContext, owner, "sample", "public", pullCount: 0);
        await TestHelpers.AddTagAsync(dbContext, repository, "v1", 2, 120);
        dbContext.RepositoryStars.Add(new RepositoryStar
        {
            UserId = user.Id,
            User = user,
            RepositoryId = repository.Id,
            Repository = repository,
            CreatedAt = DateTime.UtcNow
        });
        await dbContext.SaveChangesAsync();

        var tags = await RepositoryTag.GetByRepositoryAsync(dbContext, repository.Id, CancellationToken.None);
        var tagExists = await RepositoryTag.ExistsAsync(dbContext, repository.Id, "v1", CancellationToken.None);
        var starExists = await RepositoryStar.ExistsAsync(dbContext, user.Id, repository.Id, CancellationToken.None);
        var starred = await RepositoryStar.GetUserStarredAsync(dbContext, user.Id, 1, 20, CancellationToken.None);
        var starredCount = await RepositoryStar.GetUserStarredCountAsync(dbContext, user.Id, CancellationToken.None);

        Assert.AreEqual(1, tags.Count);
        Assert.IsTrue(tagExists);
        Assert.IsTrue(starExists);
        Assert.AreEqual(1, starred.Count);
        Assert.AreEqual(1, starredCount);
    }

    [TestMethod]
    public void AppDbContext_ConfiguresExpectedIndexes()
    {
        var options = new DbContextOptionsBuilder<AppDbContext>()
            .UseInMemoryDatabase(Guid.NewGuid().ToString())
            .Options;

        using var dbContext = new AppDbContext(options);
        var repositoryEntity = dbContext.Model.FindEntityType(typeof(Repository));
        var userEntity = dbContext.Model.FindEntityType(typeof(User));

        Assert.IsNotNull(repositoryEntity);
        Assert.IsNotNull(userEntity);
        Assert.IsTrue(userEntity.GetIndexes().Any(index => index.Properties.Any(property => property.Name == nameof(User.Email)) && index.IsUnique));
        Assert.IsTrue(repositoryEntity.GetIndexes().Any(index => index.Properties.Any(property => property.Name == nameof(Repository.Name))));
    }
}