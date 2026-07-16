using backend.Models;
using Microsoft.EntityFrameworkCore;

namespace backend.Data;

public class AppDbContext : DbContext
{
    public AppDbContext(DbContextOptions<AppDbContext> options) : base(options)
    {
    }

    public DbSet<User> Users => Set<User>();
    public DbSet<Repository> Repositories => Set<Repository>();
    public DbSet<RepositoryTag> RepositoryTags => Set<RepositoryTag>();
    public DbSet<RepositoryStar> RepositoryStars => Set<RepositoryStar>();
    public DbSet<RepositoryCollaborator> RepositoryCollaborators => Set<RepositoryCollaborator>();
    public DbSet<Organization> Organizations => Set<Organization>();
    public DbSet<OrganizationMember> OrganizationMembers => Set<OrganizationMember>();
    public DbSet<OrganizationTeam> OrganizationTeams => Set<OrganizationTeam>();
    public DbSet<OrganizationTeamMember> OrganizationTeamMembers => Set<OrganizationTeamMember>();
    public DbSet<OrganizationTeamRepository> OrganizationTeamRepositories => Set<OrganizationTeamRepository>();
    public DbSet<OrganizationInvite> OrganizationInvites => Set<OrganizationInvite>();

    protected override void OnModelCreating(ModelBuilder modelBuilder)
    {
        base.OnModelCreating(modelBuilder);

        // User configuration
        modelBuilder.Entity<User>()
            .HasIndex(u => u.Email)
            .IsUnique();

        modelBuilder.Entity<User>()
            .HasIndex(u => u.Username)
            .IsUnique();

        // Repository relationships
        modelBuilder.Entity<Repository>()
            .HasOne(r => r.Owner)
            .WithMany(u => u.Repositories)
            .HasForeignKey(r => r.OwnerId)
            .OnDelete(DeleteBehavior.Cascade);

        // Deactivating/deleting an organization tears down everything it owns, repositories included
        // (per spec: "removes members, deletes all repositories and organization info").
        modelBuilder.Entity<Repository>()
            .HasOne(r => r.Organization)
            .WithMany(o => o.Repositories)
            .HasForeignKey(r => r.OrganizationId)
            .OnDelete(DeleteBehavior.Cascade);

        modelBuilder.Entity<Repository>()
            .HasMany(r => r.Tags)
            .WithOne(t => t.Repository)
            .HasForeignKey(t => t.RepositoryId)
            .OnDelete(DeleteBehavior.Cascade);

        modelBuilder.Entity<Repository>()
            .HasMany(r => r.Stars)
            .WithOne(s => s.Repository)
            .HasForeignKey(s => s.RepositoryId)
            .OnDelete(DeleteBehavior.Cascade);

        modelBuilder.Entity<Repository>()
            .HasMany(r => r.Collaborators)
            .WithOne(c => c.Repository)
            .HasForeignKey(c => c.RepositoryId)
            .OnDelete(DeleteBehavior.Cascade);

        // RepositoryStar relationships
        modelBuilder.Entity<RepositoryStar>()
            .HasOne(s => s.User)
            .WithMany(u => u.Stars)
            .HasForeignKey(s => s.UserId)
            .OnDelete(DeleteBehavior.Cascade);

        modelBuilder.Entity<RepositoryCollaborator>()
            .HasOne(c => c.User)
            .WithMany(u => u.Collaborations)
            .HasForeignKey(c => c.UserId)
            .OnDelete(DeleteBehavior.Cascade);

        modelBuilder.Entity<Organization>()
            .HasOne(o => o.Owner)
            .WithMany(u => u.OwnedOrganizations)
            .HasForeignKey(o => o.OwnerId)
            .OnDelete(DeleteBehavior.Cascade);

        modelBuilder.Entity<OrganizationMember>()
            .HasOne(m => m.Organization)
            .WithMany(o => o.Members)
            .HasForeignKey(m => m.OrganizationId)
            .OnDelete(DeleteBehavior.Cascade);

        modelBuilder.Entity<OrganizationMember>()
            .HasOne(m => m.User)
            .WithMany(u => u.OrganizationMemberships)
            .HasForeignKey(m => m.UserId)
            .OnDelete(DeleteBehavior.Cascade);

        modelBuilder.Entity<OrganizationTeam>()
            .HasOne(t => t.Organization)
            .WithMany(o => o.Teams)
            .HasForeignKey(t => t.OrganizationId)
            .OnDelete(DeleteBehavior.Cascade);

        modelBuilder.Entity<OrganizationTeamMember>()
            .HasOne(tm => tm.Team)
            .WithMany(t => t.TeamMembers)
            .HasForeignKey(tm => tm.TeamId)
            .OnDelete(DeleteBehavior.Cascade);

        modelBuilder.Entity<OrganizationTeamMember>()
            .HasOne(tm => tm.User)
            .WithMany(u => u.TeamMemberships)
            .HasForeignKey(tm => tm.UserId)
            .OnDelete(DeleteBehavior.Cascade);

        modelBuilder.Entity<OrganizationTeamRepository>()
            .HasOne(tr => tr.Team)
            .WithMany(t => t.TeamRepositories)
            .HasForeignKey(tr => tr.TeamId)
            .OnDelete(DeleteBehavior.Cascade);

        modelBuilder.Entity<OrganizationTeamRepository>()
            .HasOne(tr => tr.Repository)
            .WithMany(r => r.TeamRepositories)
            .HasForeignKey(tr => tr.RepositoryId)
            .OnDelete(DeleteBehavior.Cascade);

        // Create unique constraint on Repository name + owner
        modelBuilder.Entity<Repository>()
            .HasIndex(r => new { r.Name, r.OwnerId })
            .IsUnique()
            .HasFilter($"\"{nameof(Repository.IsOfficial)}\" = false AND \"{nameof(Repository.OrganizationId)}\" IS NULL");

        // Create unique constraint on official repository names
        modelBuilder.Entity<Repository>()
            .HasIndex(r => r.Name)
            .IsUnique()
            .HasFilter($"\"{nameof(Repository.IsOfficial)}\" = true");

        modelBuilder.Entity<Repository>()
            .HasIndex(r => new { r.OrganizationId, r.Name })
            .IsUnique()
            .HasFilter($"\"{nameof(Repository.OrganizationId)}\" IS NOT NULL");

        modelBuilder.Entity<Organization>()
            .HasIndex(o => o.Name)
            .IsUnique();

        modelBuilder.Entity<OrganizationMember>()
            .HasIndex(m => new { m.OrganizationId, m.UserId })
            .IsUnique();

        modelBuilder.Entity<OrganizationTeam>()
            .HasIndex(t => new { t.OrganizationId, t.Name })
            .IsUnique();

        modelBuilder.Entity<OrganizationTeamMember>()
            .HasIndex(tm => new { tm.TeamId, tm.UserId })
            .IsUnique();

        modelBuilder.Entity<OrganizationTeamRepository>()
            .HasIndex(tr => new { tr.TeamId, tr.RepositoryId })
            .IsUnique();

        // Create unique constraint on RepositoryStar (user can star repo only once)
        modelBuilder.Entity<RepositoryStar>()
            .HasIndex(s => new { s.UserId, s.RepositoryId })
            .IsUnique();

        // Create unique constraint on RepositoryTag (unique tag name per repository)
        modelBuilder.Entity<RepositoryTag>()
            .HasIndex(t => new { t.RepositoryId, t.Name })
            .IsUnique();

        modelBuilder.Entity<RepositoryCollaborator>()
            .HasIndex(c => new { c.RepositoryId, c.UserId })
            .IsUnique();

        modelBuilder.Entity<OrganizationInvite>()
            .HasOne(i => i.Organization)
            .WithMany()
            .HasForeignKey(i => i.OrganizationId)
            .OnDelete(DeleteBehavior.Cascade);

        modelBuilder.Entity<OrganizationInvite>()
            .HasOne(i => i.InvitedBy)
            .WithMany()
            .HasForeignKey(i => i.InvitedByUserId)
            .OnDelete(DeleteBehavior.Cascade);

        modelBuilder.Entity<OrganizationInvite>()
            .HasIndex(i => i.Token)
            .IsUnique();
    }
}
