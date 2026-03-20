using System.ComponentModel.DataAnnotations;
using System.ComponentModel.DataAnnotations.Schema;
using Microsoft.EntityFrameworkCore;
using backend.Data;

namespace backend.Models;

[Table("RepositoryTag")]
public class RepositoryTag
{
    [Key]
    [DatabaseGenerated(DatabaseGeneratedOption.Identity)]
    public int Id { get; set; }

    [Required]
    [MaxLength(128)]
    public string Name { get; set; } = string.Empty;

    [Required]
    [ForeignKey("Repository")]
    public int RepositoryId { get; set; }

    public virtual Repository? Repository { get; set; }

    [Column(TypeName = "timestamp with time zone")]
    public DateTime CreatedAt { get; set; }

    public static async Task<List<RepositoryTag>> GetByRepositoryAsync(AppDbContext dbContext, int repositoryId, CancellationToken cancellationToken = default)
    {
        return await dbContext.RepositoryTags
            .Where(t => t.RepositoryId == repositoryId)
            .OrderByDescending(t => t.CreatedAt)
            .ToListAsync(cancellationToken);
    }

    public static async Task<bool> ExistsAsync(AppDbContext dbContext, int repositoryId, string name, CancellationToken cancellationToken = default)
    {
        return await dbContext.RepositoryTags
            .AnyAsync(t => t.RepositoryId == repositoryId && t.Name == name, cancellationToken);
    }
}
