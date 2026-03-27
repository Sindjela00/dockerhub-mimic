using System.ComponentModel.DataAnnotations;
using System.ComponentModel.DataAnnotations.Schema;
using System.Security.Cryptography;
using System.Text;
using Microsoft.EntityFrameworkCore;

namespace backend.Models;

[Table("User")]
public class User
{
    public const string RoleAdministrator = "Administrator";
    public const string RoleUser = "User";

    [Key]
    [DatabaseGenerated(DatabaseGeneratedOption.Identity)]
    public int Id { get; set; }

    [Required]
    [MaxLength(255)]
    public string Email { get; set; } = string.Empty;

    [Required]
    [MaxLength(64)]
    public string Username { get; set; } = string.Empty;

    [Required]
    public string PasswordHash { get; set; } = string.Empty;

    [Required]
    public string Role { get; set; } = RoleUser;

    [Column(TypeName = "timestamp with time zone")]
    public DateTime CreatedAt { get; set; }

    public virtual ICollection<Repository> Repositories { get; set; } = new List<Repository>();
    public virtual ICollection<RepositoryStar> Stars { get; set; } = new List<RepositoryStar>();
    public virtual ICollection<RepositoryCollaborator> Collaborations { get; set; } = new List<RepositoryCollaborator>();

    public static string HashPassword(string password)
    {
        var salt = RandomNumberGenerator.GetBytes(16);
        var hashBytes = SHA256.HashData(Encoding.UTF8.GetBytes(Convert.ToBase64String(salt) + password));
        return $"{Convert.ToBase64String(salt)}:{Convert.ToBase64String(hashBytes)}";
    }

    public static bool VerifyPassword(string password, string hash)
    {
        try
        {
            var parts = hash.Split(':');
            if (parts.Length != 2)
                return false;

            var saltBytes = Convert.FromBase64String(parts[0]);
            var hashBytes = Convert.FromBase64String(parts[1]);
            var computedHash = SHA256.HashData(Encoding.UTF8.GetBytes(Convert.ToBase64String(saltBytes) + password));

            return computedHash.SequenceEqual(hashBytes);
        }
        catch
        {
            return false;
        }
    }
}
