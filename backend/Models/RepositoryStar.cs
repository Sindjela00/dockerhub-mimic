using System.ComponentModel.DataAnnotations;
using System.ComponentModel.DataAnnotations.Schema;
using Microsoft.EntityFrameworkCore;
using backend.Data;

namespace backend.Models;

[Table("RepositoryStar")]
public class RepositoryStar
{
    [Key]
    [DatabaseGenerated(DatabaseGeneratedOption.Identity)]
    public int Id { get; set; }

    [Required]
    [ForeignKey("User")]
    public int UserId { get; set; }

    public virtual User? User { get; set; }

    [Required]
    [ForeignKey("Repository")]
    public int RepositoryId { get; set; }

    public virtual Repository? Repository { get; set; }

    [Column(TypeName = "timestamp with time zone")]
    public DateTime CreatedAt { get; set; }

    public static async Task<bool> ExistsAsync(AppDbContext dbContext, int userId, int repositoryId, CancellationToken cancellationToken = default)
    {
        return await dbContext.RepositoryStars
            .AnyAsync(s => s.UserId == userId && s.RepositoryId == repositoryId, cancellationToken);
    }

    public static async Task<List<Repository>> GetUserStarredAsync(AppDbContext dbContext, int userId, int page = 1, int pageSize = 20, CancellationToken cancellationToken = default)
    {
        return await dbContext.RepositoryStars
            .Where(s => s.UserId == userId)
            .Include(s => s.Repository)
            .ThenInclude(r => r!.Tags)
            .Select(s => s.Repository!)
            .OrderByDescending(r => r.CreatedAt)
            .Skip((page - 1) * pageSize)
            .Take(pageSize)
            .ToListAsync(cancellationToken);
    }

    public static async Task<int> GetUserStarredCountAsync(AppDbContext dbContext, int userId, CancellationToken cancellationToken = default)
    {
        return await dbContext.RepositoryStars
            .Where(s => s.UserId == userId)
            .CountAsync(cancellationToken);
    }
}
