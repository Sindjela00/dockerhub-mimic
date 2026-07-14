using System.ComponentModel.DataAnnotations;
using System.ComponentModel.DataAnnotations.Schema;

namespace backend.Models;

[Table("RepositoryCollaborator")]
public class RepositoryCollaborator
{
    [Key]
    [DatabaseGenerated(DatabaseGeneratedOption.Identity)]
    public int Id { get; set; }

    [Required]
    [ForeignKey("Repository")]
    public int RepositoryId { get; set; }

    public virtual Repository? Repository { get; set; }

    [Required]
    [ForeignKey("User")]
    public int UserId { get; set; }

    public virtual User? User { get; set; }

    [Required]
    [MaxLength(32)]
    public string Role { get; set; } = "write";

    [Column(TypeName = "timestamp with time zone")]
    public DateTime AddedAt { get; set; }
}
