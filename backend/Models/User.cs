using System.ComponentModel.DataAnnotations;
using System.ComponentModel.DataAnnotations.Schema;
using System.Security.Cryptography;
using System.Text;

namespace backend.Models;

[Table("User")]
public class User
{
    public const string RoleAdministrator = "Administrator";
    public const string RoleUser = "User";

    [Key]
    [Required]
    public string Email { get; set; } = string.Empty;

    [Required]
    public string PasswordHash { get; set; } = string.Empty;

    [Required]
    public string Role { get; set; } = RoleUser;

    [Column(TypeName = "timestamp with time zone")]
    public DateTime CreatedAt { get; set; }

    public static string HashPassword(string password)
    {
        var salt = RandomNumberGenerator.GetBytes(16);
        var hashBytes = SHA256.HashData(Encoding.UTF8.GetBytes(Convert.ToBase64String(salt) + password));
        return $"{Convert.ToBase64String(salt)}:{Convert.ToBase64String(hashBytes)}";
    }
}
