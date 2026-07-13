using System.ComponentModel.DataAnnotations;
using System.ComponentModel.DataAnnotations.Schema;

namespace backend.Models;

[Table("OrganizationTeamMember")]
public class OrganizationTeamMember
{
    [Key]
    [DatabaseGenerated(DatabaseGeneratedOption.Identity)]
    public int Id { get; set; }

    [Required]
    [ForeignKey("Team")]
    public int TeamId { get; set; }

    public virtual OrganizationTeam? Team { get; set; }

    [Required]
    [ForeignKey("User")]
    public int UserId { get; set; }

    public virtual User? User { get; set; }

    [Column(TypeName = "timestamp with time zone")]
    public DateTime AddedAt { get; set; }
}
