using backend.Models;
using Microsoft.EntityFrameworkCore;

namespace backend.Data;

public class DatabaseSeeder
{
	private readonly AppDbContext _dbContext;
	private readonly IConfiguration _configuration;
	private readonly ILogger<DatabaseSeeder> _logger;

	public DatabaseSeeder(
		AppDbContext dbContext,
		IConfiguration configuration,
		ILogger<DatabaseSeeder> logger)
	{
		_dbContext = dbContext;
		_configuration = configuration;
		_logger = logger;
	}

	public async Task SeedAsync(CancellationToken cancellationToken = default)
	{
		await _dbContext.Database.EnsureCreatedAsync(cancellationToken);

		var adminEmail = NormalizeEmail(_configuration.GetValue<string>("Seed:AdminEmail") ?? "admin@dockerhubmimic.local");
		var demoEmail = NormalizeEmail(_configuration.GetValue<string>("Seed:DemoEmail") ?? "demo@dockerhubmimic.local");

		var adminPassword = _configuration.GetValue<string>("Seed:AdminPassword") ?? "Welcome1";
		var demoPassword = _configuration.GetValue<string>("Seed:DemoPassword") ?? "Password1";

		var adminRole = _configuration.GetValue<string>("Seed:AdminRole") ?? User.RoleAdministrator;
		var demoRole = _configuration.GetValue<string>("Seed:DemoRole") ?? User.RoleUser;

		var seededCreatedAt = new DateTime(2026, 3, 24, 0, 0, 0, DateTimeKind.Utc);

		var adminUser = await EnsureUserAsync(
			email: adminEmail,
			username: "admin",
			password: adminPassword,
			role: adminRole,
			createdAt: seededCreatedAt,
			cancellationToken: cancellationToken);

		var demoUser = await EnsureUserAsync(
			email: demoEmail,
			username: "demo",
			password: demoPassword,
			role: demoRole,
			createdAt: seededCreatedAt,
			cancellationToken: cancellationToken);

		await EnsureRepositoryAsync(
			owner: adminUser,
			name: "official-nginx",
			description: "Official nginx image repository.",
			visibility: "public",
			isOfficial: true,
			createdAt: seededCreatedAt,
			cancellationToken: cancellationToken);

		await EnsureRepositoryAsync(
			owner: adminUser,
			name: "platform-tools",
			description: "Internal platform tools and base images.",
			visibility: "private",
			isOfficial: false,
			createdAt: seededCreatedAt,
			cancellationToken: cancellationToken);

		await EnsureRepositoryAsync(
			owner: demoUser,
			name: "hello-world",
			description: "Demo public repository.",
			visibility: "public",
			isOfficial: false,
			createdAt: seededCreatedAt,
			cancellationToken: cancellationToken);

		await EnsureRepositoryAsync(
			owner: demoUser,
			name: "private-sample",
			description: "Demo private repository.",
			visibility: "private",
			isOfficial: false,
			createdAt: seededCreatedAt,
			cancellationToken: cancellationToken);

		await _dbContext.SaveChangesAsync(cancellationToken);
		_logger.LogInformation("Database seed completed: admin/demo users and repositories are ensured.");
	}

	private async Task<User> EnsureUserAsync(
		string email,
		string username,
		string password,
		string role,
		DateTime createdAt,
		CancellationToken cancellationToken)
	{
		var normalizedUsername = NormalizeIdentifier(username);
		var existingUser = await _dbContext.Users
			.FirstOrDefaultAsync(user => user.Email == email, cancellationToken);

		if (existingUser is null)
		{
			existingUser = new User
			{
				Email = email,
				Username = normalizedUsername,
				PasswordHash = User.HashPassword(password),
				Role = role,
				CreatedAt = createdAt
			};

			_dbContext.Users.Add(existingUser);
			await _dbContext.SaveChangesAsync(cancellationToken);
			return existingUser;
		}

		existingUser.Username = normalizedUsername;
		existingUser.PasswordHash = User.HashPassword(password);
		existingUser.Role = role;

		await _dbContext.SaveChangesAsync(cancellationToken);
		return existingUser;
	}

	private async Task EnsureRepositoryAsync(
		User owner,
		string name,
		string description,
		string visibility,
		bool isOfficial,
		DateTime createdAt,
		CancellationToken cancellationToken)
	{
		var normalizedName = NormalizeIdentifier(name);
		var normalizedVisibility = NormalizeIdentifier(visibility);

		var existingRepository = await _dbContext.Repositories
			.FirstOrDefaultAsync(
				repository => repository.OwnerId == owner.Id && repository.Name == normalizedName,
				cancellationToken);

		if (existingRepository is null)
		{
			_dbContext.Repositories.Add(new Repository
			{
				Name = normalizedName,
				Description = description,
				Visibility = normalizedVisibility,
				OwnerId = owner.Id,
				IsOfficial = isOfficial,
				StarCount = 0,
				CreatedAt = createdAt,
				UpdatedAt = DateTime.UtcNow
			});
			return;
		}

		existingRepository.Description = description;
		existingRepository.Visibility = normalizedVisibility;
		existingRepository.IsOfficial = isOfficial;
		existingRepository.UpdatedAt = DateTime.UtcNow;
	}

	private static string NormalizeEmail(string email)
		=> email.Trim().ToLowerInvariant();

	private static string NormalizeIdentifier(string value)
		=> value.Trim().ToLowerInvariant();
}
