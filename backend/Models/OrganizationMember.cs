using System.ComponentModel.DataAnnotations;
using System.ComponentModel.DataAnnotations.Schema;

namespace backend.Models;

[Table("OrganizationMember")]
public class OrganizationMember
{
    public const string RoleOwner = "owner";
    public const string RoleAdmin = "admin";
    public const string RoleMember = "member";

    [Key]
    [DatabaseGenerated(DatabaseGeneratedOption.Identity)]
    public int Id { get; set; }

    [Required]
    [ForeignKey("Organization")]
    public int OrganizationId { get; set; }

    public virtual Organization? Organization { get; set; }

    [Required]
    [ForeignKey("User")]
    public int UserId { get; set; }

    public virtual User? User { get; set; }

    [Required]
    [MaxLength(32)]
    public string Role { get; set; } = RoleMember;

    [Column(TypeName = "timestamp with time zone")]
    public DateTime AddedAt { get; set; }
}