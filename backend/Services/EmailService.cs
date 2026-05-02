using Microsoft.Extensions.Configuration;
using Microsoft.Extensions.Logging;

namespace backend.Services;

public interface IEmailService
{
    Task SendAsync(string to, string subject, string htmlBody, CancellationToken cancellationToken);
}

#pragma warning disable SYSLIB0006 // SmtpClient is functional; MailKit can replace it later
public class SmtpEmailService : IEmailService
{
    private readonly IConfiguration _configuration;
    private readonly ILogger<SmtpEmailService> _logger;

    public SmtpEmailService(IConfiguration configuration, ILogger<SmtpEmailService> logger)
    {
        _configuration = configuration;
        _logger = logger;
    }

    public async Task SendAsync(string to, string subject, string htmlBody, CancellationToken cancellationToken)
    {
        var host = _configuration.GetValue<string>("Email:SmtpHost") ?? "localhost";
        var port = _configuration.GetValue<int>("Email:SmtpPort", 25);
        var fromAddress = _configuration.GetValue<string>("Email:FromAddress") ?? "no-reply@dockerhubmimic.local";
        var fromName = _configuration.GetValue<string>("Email:FromName") ?? "DockerHub Mimic";
        var username = _configuration.GetValue<string>("Email:Username");
        var password = _configuration.GetValue<string>("Email:Password");
        var useSsl = _configuration.GetValue<bool>("Email:UseSsl", false);

        using var client = new System.Net.Mail.SmtpClient(host, port)
        {
            EnableSsl = useSsl,
            Credentials = !string.IsNullOrEmpty(username)
                ? new System.Net.NetworkCredential(username, password)
                : null
        };

        using var message = new System.Net.Mail.MailMessage
        {
            From = new System.Net.Mail.MailAddress(fromAddress, fromName),
            Subject = subject,
            Body = htmlBody,
            IsBodyHtml = true
        };
        message.To.Add(to);

        try
        {
            await client.SendMailAsync(message, cancellationToken);
        }
        catch (Exception ex)
        {
            _logger.LogError(ex, "Failed to send email to {To}", to);
            throw;
        }
    }
}
#pragma warning restore SYSLIB0006
