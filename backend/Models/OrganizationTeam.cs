using System.ComponentModel.DataAnnotations;
using System.ComponentModel.DataAnnotations.Schema;

namespace backend.Models;

[Table("OrganizationTeam")]
public class OrganizationTeam
{
    [Key]
    [DatabaseGenerated(DatabaseGeneratedOption.Identity)]
    public int Id { get; set; }

    [Required]
    [ForeignKey("Organization")]
    public int OrganizationId { get; set; }

    public virtual Organization? Organization { get; set; }

    [Required]
    [MaxLength(64)]
    public string Name { get; set; } = string.Empty;

    [MaxLength(500)]
    public string Description { get; set; } = string.Empty;

    [Column(TypeName = "timestamp with time zone")]
    public DateTime CreatedAt { get; set; }

    [Column(TypeName = "timestamp with time zone")]
    public DateTime UpdatedAt { get; set; }

    public virtual ICollection<OrganizationTeamMember> TeamMembers { get; set; } = new List<OrganizationTeamMember>();
    public virtual ICollection<OrganizationTeamRepository> TeamRepositories { get; set; } = new List<OrganizationTeamRepository>();
}
