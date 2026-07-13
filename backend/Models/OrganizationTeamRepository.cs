using System.ComponentModel.DataAnnotations;
using System.ComponentModel.DataAnnotations.Schema;

namespace backend.Models;

[Table("OrganizationTeamRepository")]
public class OrganizationTeamRepository
{
    public const string PermissionReadOnly = "read-only";
    public const string PermissionReadWrite = "read+write";
    public const string PermissionAdmin = "admin";

    [Key]
    [DatabaseGenerated(DatabaseGeneratedOption.Identity)]
    public int Id { get; set; }

    [Required]
    [ForeignKey("Team")]
    public int TeamId { get; set; }

    public virtual OrganizationTeam? Team { get; set; }

    [Required]
    [ForeignKey("Repository")]
    public int RepositoryId { get; set; }

    public virtual Repository? Repository { get; set; }

    [Required]
    [MaxLength(32)]
    public string Permission { get; set; } = PermissionReadOnly;
}
