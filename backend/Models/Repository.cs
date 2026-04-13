using System.ComponentModel.DataAnnotations;
using System.ComponentModel.DataAnnotations.Schema;
using Microsoft.EntityFrameworkCore;
using backend.Data;

namespace backend.Models;

[Table("Repository")]
public class Repository
{
    [Key]
    [DatabaseGenerated(DatabaseGeneratedOption.Identity)]
    public int Id { get; set; }

    [Required]
    [MaxLength(100)]
    public string Name { get; set; } = string.Empty;

    [MaxLength(500)]
    public string Description { get; set; } = string.Empty;

    [Required]
    public string Visibility { get; set; } = "private"; // "public" or "private"

    [Required]
    [ForeignKey("Owner")]
    public int OwnerId { get; set; }

    public virtual User? Owner { get; set; }

    [ForeignKey("Organization")]
    public int? OrganizationId { get; set; }

    public virtual Organization? Organization { get; set; }

    [Column(TypeName = "timestamp with time zone")]
    public DateTime CreatedAt { get; set; }

    [Column(TypeName = "timestamp with time zone")]
    public DateTime UpdatedAt { get; set; }

    public bool IsOfficial { get; set; } = false; // True for admin-created official repositories

    public int StarCount { get; set; } = 0;

    public int PullCount { get; set; } = 0;

    public virtual ICollection<RepositoryTag> Tags { get; set; } = new List<RepositoryTag>();

    public virtual ICollection<RepositoryStar> Stars { get; set; } = new List<RepositoryStar>();

    public virtual ICollection<RepositoryCollaborator> Collaborators { get; set; } = new List<RepositoryCollaborator>();

    public virtual ICollection<OrganizationTeamRepository> TeamRepositories { get; set; } = new List<OrganizationTeamRepository>();

    // Returns the full repository name (prefix/name for user and org repos, just name for official)
    public string GetFullName() => IsOfficial ? Name : $"{Organization?.Name ?? Owner?.Username ?? "user"}/{Name}";

    public static async Task<Repository?> GetByIdAsync(AppDbContext dbContext, int id, CancellationToken cancellationToken = default)
    {
        return await dbContext.Repositories
            .Include(r => r.Tags)
            .Include(r => r.Stars)
            .Include(r => r.Owner)
            .FirstOrDefaultAsync(r => r.Id == id, cancellationToken);
    }

    public static async Task<List<Repository>> GetPublicAsync(AppDbContext dbContext, string? search = null, int page = 1, int pageSize = 20, CancellationToken cancellationToken = default)
    {
        var query = dbContext.Repositories
            .Where(r => r.Visibility == "public")
            .Include(r => r.Tags)
            .Include(r => r.Owner)
            .AsQueryable();

        if (!string.IsNullOrWhiteSpace(search))
        {
            search = search.ToLower();
            query = query.Where(r => r.Name.ToLower().Contains(search) || r.Description.ToLower().Contains(search));
        }

        return await query
            .OrderByDescending(r => r.StarCount)
            .ThenByDescending(r => r.CreatedAt)
            .Skip((page - 1) * pageSize)
            .Take(pageSize)
            .ToListAsync(cancellationToken);
    }

    public static async Task<int> GetPublicCountAsync(AppDbContext dbContext, string? search = null, CancellationToken cancellationToken = default)
    {
        var query = dbContext.Repositories
            .Where(r => r.Visibility == "public")
            .AsQueryable();

        if (!string.IsNullOrWhiteSpace(search))
        {
            search = search.ToLower();
            query = query.Where(r => r.Name.ToLower().Contains(search) || r.Description.ToLower().Contains(search));
        }

        return await query.CountAsync(cancellationToken);
    }

    public static async Task<List<Repository>> GetByOwnerAsync(AppDbContext dbContext, int ownerId, int page = 1, int pageSize = 20, CancellationToken cancellationToken = default)
    {
        return await dbContext.Repositories
            .Where(r => r.OwnerId == ownerId)
            .Include(r => r.Tags)
            .OrderByDescending(r => r.CreatedAt)
            .Skip((page - 1) * pageSize)
            .Take(pageSize)
            .ToListAsync(cancellationToken);
    }

    public static async Task<int> GetOwnerCountAsync(AppDbContext dbContext, int ownerId, CancellationToken cancellationToken = default)
    {
        return await dbContext.Repositories
            .Where(r => r.OwnerId == ownerId)
            .CountAsync(cancellationToken);
    }

    public static async Task<bool> ExistsAsync(AppDbContext dbContext, string name, int ownerId, CancellationToken cancellationToken = default)
    {
        return await dbContext.Repositories
            .AnyAsync(r => r.Name == name && r.OwnerId == ownerId, cancellationToken);
    }
}
