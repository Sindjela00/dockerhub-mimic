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
		await EnsureOrganizationSchemaAsync(cancellationToken);
		await EnsureOrganizationTeamSchemaAsync(cancellationToken);
		await EnsureRepositorySchemaAsync(cancellationToken);
		await EnsureRepositoryTagSchemaAsync(cancellationToken);
		await EnsureRepositoryCollaboratorSchemaAsync(cancellationToken);

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

	private async Task EnsureRepositoryTagSchemaAsync(CancellationToken cancellationToken)
	{
		await _dbContext.Database.ExecuteSqlRawAsync("ALTER TABLE \"RepositoryTag\" ADD COLUMN IF NOT EXISTS \"Digest\" character varying(255);", cancellationToken);
		await _dbContext.Database.ExecuteSqlRawAsync("ALTER TABLE \"RepositoryTag\" ADD COLUMN IF NOT EXISTS \"Os\" character varying(64);", cancellationToken);
		await _dbContext.Database.ExecuteSqlRawAsync("ALTER TABLE \"RepositoryTag\" ADD COLUMN IF NOT EXISTS \"Architecture\" character varying(64);", cancellationToken);
		await _dbContext.Database.ExecuteSqlRawAsync("ALTER TABLE \"RepositoryTag\" ADD COLUMN IF NOT EXISTS \"CompressedSizeBytes\" bigint;", cancellationToken);
		await _dbContext.Database.ExecuteSqlRawAsync("ALTER TABLE \"RepositoryTag\" ADD COLUMN IF NOT EXISTS \"LastPulledAt\" timestamp with time zone;", cancellationToken);
		await _dbContext.Database.ExecuteSqlRawAsync("ALTER TABLE \"RepositoryTag\" ADD COLUMN IF NOT EXISTS \"LastPushedAt\" timestamp with time zone;", cancellationToken);
		await _dbContext.Database.ExecuteSqlRawAsync("ALTER TABLE \"RepositoryTag\" ADD COLUMN IF NOT EXISTS \"LastPushedBy\" character varying(128);", cancellationToken);
		await _dbContext.Database.ExecuteSqlRawAsync("ALTER TABLE \"RepositoryTag\" ADD COLUMN IF NOT EXISTS \"PullCount\" integer NOT NULL DEFAULT 0;", cancellationToken);
		await _dbContext.Database.ExecuteSqlRawAsync("ALTER TABLE \"RepositoryTag\" ADD COLUMN IF NOT EXISTS \"MediaType\" character varying(255);", cancellationToken);
		await _dbContext.Database.ExecuteSqlRawAsync("CREATE UNIQUE INDEX IF NOT EXISTS \"IX_RepositoryTag_RepositoryId_Name\" ON \"RepositoryTag\" (\"RepositoryId\", \"Name\");", cancellationToken);
	}

	private async Task EnsureRepositorySchemaAsync(CancellationToken cancellationToken)
	{
		await _dbContext.Database.ExecuteSqlRawAsync("ALTER TABLE \"Repository\" ADD COLUMN IF NOT EXISTS \"PullCount\" integer NOT NULL DEFAULT 0;", cancellationToken);
		await _dbContext.Database.ExecuteSqlRawAsync("ALTER TABLE \"Repository\" ADD COLUMN IF NOT EXISTS \"OrganizationId\" integer NULL REFERENCES \"Organization\"(\"Id\") ON DELETE SET NULL;", cancellationToken);
		await _dbContext.Database.ExecuteSqlRawAsync("CREATE UNIQUE INDEX IF NOT EXISTS \"IX_Repository_OrganizationId_Name\" ON \"Repository\" (\"OrganizationId\", \"Name\") WHERE \"OrganizationId\" IS NOT NULL;", cancellationToken);
	}

	private async Task EnsureOrganizationSchemaAsync(CancellationToken cancellationToken)
	{
		await _dbContext.Database.ExecuteSqlRawAsync(@"
			CREATE TABLE IF NOT EXISTS ""Organization""
			(
				""Id"" integer GENERATED BY DEFAULT AS IDENTITY PRIMARY KEY,
				""Name"" character varying(64) NOT NULL,
				""DisplayName"" character varying(128) NOT NULL DEFAULT '',
				""Description"" character varying(500) NOT NULL DEFAULT '',
				""AvatarUrl"" character varying(500) NULL,
				""OwnerId"" integer NOT NULL REFERENCES ""User""(""Id"") ON DELETE CASCADE,
				""CreatedAt"" timestamp with time zone NOT NULL DEFAULT NOW(),
				""UpdatedAt"" timestamp with time zone NOT NULL DEFAULT NOW()
			);", cancellationToken);

		await _dbContext.Database.ExecuteSqlRawAsync("ALTER TABLE \"Organization\" ADD COLUMN IF NOT EXISTS \"AvatarUrl\" character varying(500) NULL;", cancellationToken);

		await _dbContext.Database.ExecuteSqlRawAsync(@"
			CREATE TABLE IF NOT EXISTS ""OrganizationMember""
			(
				""Id"" integer GENERATED BY DEFAULT AS IDENTITY PRIMARY KEY,
				""OrganizationId"" integer NOT NULL REFERENCES ""Organization""(""Id"") ON DELETE CASCADE,
				""UserId"" integer NOT NULL REFERENCES ""User""(""Id"") ON DELETE CASCADE,
				""Role"" character varying(32) NOT NULL DEFAULT 'member',
				""AddedAt"" timestamp with time zone NOT NULL DEFAULT NOW()
			);", cancellationToken);

		await _dbContext.Database.ExecuteSqlRawAsync("CREATE UNIQUE INDEX IF NOT EXISTS \"IX_Organization_Name\" ON \"Organization\" (\"Name\");", cancellationToken);
		await _dbContext.Database.ExecuteSqlRawAsync("CREATE UNIQUE INDEX IF NOT EXISTS \"IX_OrganizationMember_OrganizationId_UserId\" ON \"OrganizationMember\" (\"OrganizationId\", \"UserId\");", cancellationToken);
	}

	private async Task EnsureOrganizationTeamSchemaAsync(CancellationToken cancellationToken)
	{
		await _dbContext.Database.ExecuteSqlRawAsync(@"
			CREATE TABLE IF NOT EXISTS ""OrganizationTeam""
			(
				""Id"" integer GENERATED BY DEFAULT AS IDENTITY PRIMARY KEY,
				""OrganizationId"" integer NOT NULL REFERENCES ""Organization""(""Id"") ON DELETE CASCADE,
				""Name"" character varying(64) NOT NULL,
				""Description"" character varying(500) NOT NULL DEFAULT '',
				""CreatedAt"" timestamp with time zone NOT NULL DEFAULT NOW(),
				""UpdatedAt"" timestamp with time zone NOT NULL DEFAULT NOW()
			);", cancellationToken);

		await _dbContext.Database.ExecuteSqlRawAsync(@"
			CREATE TABLE IF NOT EXISTS ""OrganizationTeamMember""
			(
				""Id"" integer GENERATED BY DEFAULT AS IDENTITY PRIMARY KEY,
				""TeamId"" integer NOT NULL REFERENCES ""OrganizationTeam""(""Id"") ON DELETE CASCADE,
				""UserId"" integer NOT NULL REFERENCES ""User""(""Id"") ON DELETE CASCADE,
				""AddedAt"" timestamp with time zone NOT NULL DEFAULT NOW()
			);", cancellationToken);

		await _dbContext.Database.ExecuteSqlRawAsync(@"
			CREATE TABLE IF NOT EXISTS ""OrganizationTeamRepository""
			(
				""Id"" integer GENERATED BY DEFAULT AS IDENTITY PRIMARY KEY,
				""TeamId"" integer NOT NULL REFERENCES ""OrganizationTeam""(""Id"") ON DELETE CASCADE,
				""RepositoryId"" integer NOT NULL REFERENCES ""Repository""(""Id"") ON DELETE CASCADE,
				""Permission"" character varying(32) NOT NULL DEFAULT 'read-only'
			);", cancellationToken);

		await _dbContext.Database.ExecuteSqlRawAsync("CREATE UNIQUE INDEX IF NOT EXISTS \"IX_OrganizationTeam_OrganizationId_Name\" ON \"OrganizationTeam\" (\"OrganizationId\", \"Name\");", cancellationToken);
		await _dbContext.Database.ExecuteSqlRawAsync("CREATE UNIQUE INDEX IF NOT EXISTS \"IX_OrganizationTeamMember_TeamId_UserId\" ON \"OrganizationTeamMember\" (\"TeamId\", \"UserId\");", cancellationToken);
		await _dbContext.Database.ExecuteSqlRawAsync("CREATE UNIQUE INDEX IF NOT EXISTS \"IX_OrganizationTeamRepository_TeamId_RepositoryId\" ON \"OrganizationTeamRepository\" (\"TeamId\", \"RepositoryId\");", cancellationToken);
	}

	private async Task EnsureRepositoryCollaboratorSchemaAsync(CancellationToken cancellationToken)
	{
		await _dbContext.Database.ExecuteSqlRawAsync(@"
			CREATE TABLE IF NOT EXISTS ""RepositoryCollaborator""
			(
				""Id"" integer GENERATED BY DEFAULT AS IDENTITY PRIMARY KEY,
				""RepositoryId"" integer NOT NULL REFERENCES ""Repository""(""Id"") ON DELETE CASCADE,
				""UserId"" integer NOT NULL REFERENCES ""User""(""Id"") ON DELETE CASCADE,
				""Role"" character varying(32) NOT NULL DEFAULT 'write',
				""AddedAt"" timestamp with time zone NOT NULL DEFAULT NOW()
			);", cancellationToken);

		await _dbContext.Database.ExecuteSqlRawAsync(
			"CREATE UNIQUE INDEX IF NOT EXISTS \"IX_RepositoryCollaborator_RepositoryId_UserId\" ON \"RepositoryCollaborator\" (\"RepositoryId\", \"UserId\");",
			cancellationToken);
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
				PullCount = 0,
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
