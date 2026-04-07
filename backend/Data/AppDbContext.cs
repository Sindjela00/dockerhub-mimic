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

        // Create unique constraint on Repository name + owner
        modelBuilder.Entity<Repository>()
            .HasIndex(r => new { r.Name, r.OwnerId })
            .IsUnique()
            .HasFilter($"\"{nameof(Repository.IsOfficial)}\" = false");

        // Create unique constraint on official repository names
        modelBuilder.Entity<Repository>()
            .HasIndex(r => r.Name)
            .IsUnique()
            .HasFilter($"\"{nameof(Repository.IsOfficial)}\" = true");

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
    }
}
