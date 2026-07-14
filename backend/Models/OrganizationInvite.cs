using System.ComponentModel.DataAnnotations;
using System.ComponentModel.DataAnnotations.Schema;

namespace backend.Models;

[Table("OrganizationInvite")]
public class OrganizationInvite
{
    public const string StatusPending = "pending";
    public const string StatusAccepted = "accepted";
    public const string StatusCancelled = "cancelled";

    [Key]
    [DatabaseGenerated(DatabaseGeneratedOption.Identity)]
    public int Id { get; set; }

    [Required]
    [ForeignKey("Organization")]
    public int OrganizationId { get; set; }

    public virtual Organization? Organization { get; set; }

    [Required]
    [ForeignKey("InvitedBy")]
    public int InvitedByUserId { get; set; }

    public virtual User? InvitedBy { get; set; }

    [Required]
    [MaxLength(256)]
    public string Email { get; set; } = string.Empty;

    [Required]
    [MaxLength(64)]
    public string Token { get; set; } = string.Empty;

    [Required]
    [MaxLength(32)]
    public string Role { get; set; } = OrganizationMember.RoleMember;

    [Required]
    [MaxLength(32)]
    public string Status { get; set; } = StatusPending;

    [Column(TypeName = "timestamp with time zone")]
    public DateTime ExpiresAt { get; set; }

    [Column(TypeName = "timestamp with time zone")]
    public DateTime CreatedAt { get; set; }
}
