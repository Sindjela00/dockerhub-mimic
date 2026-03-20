using System.IdentityModel.Tokens.Jwt;
using System.Security.Claims;
using System.Text;
using backend.Models;
using Microsoft.IdentityModel.Tokens;

namespace backend.Services;

public class JwtTokenService
{
    private readonly IConfiguration _configuration;

    public JwtTokenService(IConfiguration configuration)
    {
        _configuration = configuration;
    }

    public string GenerateToken(User user)
    {
        var key = _configuration.GetValue<string>("Jwt:Key")
            ?? "CHANGE_ME_TO_A_LONG_RANDOM_SECRET_KEY_12345";
        var issuer = _configuration.GetValue<string>("Jwt:Issuer")
            ?? "dockerhub-mimic";
        var audience = _configuration.GetValue<string>("Jwt:Audience")
            ?? "dockerhub-mimic-clients";
        var expiresMinutes = _configuration.GetValue<double?>("Jwt:ExpiresMinutes") ?? 60;

        var claims = new List<Claim>
        {
            new(JwtRegisteredClaimNames.Sub, user.Email),
            new(JwtRegisteredClaimNames.Email, user.Email),
            new(JwtRegisteredClaimNames.Name, user.Username ?? string.Empty),
            new(ClaimTypes.NameIdentifier, user.Email),
            new(ClaimTypes.Name, user.Username ?? string.Empty),
            new(ClaimTypes.Role, user.Role)
        };

        var credentials = new SigningCredentials(
            new SymmetricSecurityKey(Encoding.UTF8.GetBytes(key)),
            SecurityAlgorithms.HmacSha256);

        var tokenDescriptor = new SecurityTokenDescriptor
        {
            Subject = new ClaimsIdentity(claims),
            Expires = DateTime.UtcNow.AddMinutes(expiresMinutes),
            Issuer = issuer,
            Audience = audience,
            SigningCredentials = credentials
        };

        var tokenHandler = new JwtSecurityTokenHandler();
        var token = tokenHandler.CreateToken(tokenDescriptor);
        return tokenHandler.WriteToken(token);
    }
}
