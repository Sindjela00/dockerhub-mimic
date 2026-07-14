using backend.Authorization;
using backend.Data;
using backend.Services;
using Elastic.Clients.Elasticsearch;
using Microsoft.AspNetCore.Authentication.JwtBearer;
using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Authorization.Policy;
using Microsoft.EntityFrameworkCore;
using Microsoft.IdentityModel.Tokens;
using Microsoft.OpenApi;
using Serilog;
using Serilog.Formatting.Json;
using System.Text;

var isRunningInContainer = Environment.GetEnvironmentVariable("DOTNET_RUNNING_IN_CONTAINER") == "true";

var builder = WebApplication.CreateBuilder(args);

var logFilePath = builder.Configuration.GetValue<string>("Logging:FilePath")
    ?? (isRunningInContainer ? "/app/logs/backend-.json" : Path.Combine("logs", "backend-.json"));

builder.Host.UseSerilog((context, services, loggerConfiguration) => loggerConfiguration
    .ReadFrom.Configuration(context.Configuration)
    .WriteTo.Console()
    .WriteTo.File(new JsonFormatter(renderMessage: true), logFilePath, rollingInterval: RollingInterval.Day));

// Add services to the container.

// Add CORS policy
builder.Services.AddCors(options =>
{
    options.AddPolicy("AllowFrontend", policy =>
    {
        policy.WithOrigins("http://localhost:3000")
              .AllowAnyHeader()
              .AllowAnyMethod()
              .AllowCredentials();
    });
});

builder.Services.AddControllers();
var connectionString = builder.Configuration.GetConnectionString("DefaultConnection");

builder.Services.AddDbContext<AppDbContext>(options =>
{
    options.UseNpgsql(connectionString);
});
builder.Services.AddScoped<DatabaseSeeder>();
builder.Services.AddScoped<IAuthService, AuthService>();
builder.Services.AddScoped<IRegistryService, RegistryService>();
builder.Services.AddScoped<IRepositoriesService, RepositoriesService>();
builder.Services.AddScoped<IOrganizationsService, OrganizationsService>();
builder.Services.AddScoped<IEmailService, SmtpEmailService>();
builder.Services.AddScoped<IAdminService, AdminService>();
builder.Services.AddHttpClient();
var jwtKey = builder.Configuration.GetValue<string>("Jwt:Key")
    ?? "CHANGE_ME_TO_A_LONG_RANDOM_SECRET_KEY_12345";
var jwtIssuer = builder.Configuration.GetValue<string>("Jwt:Issuer") ?? "dockerhub-mimic";
var jwtAudience = builder.Configuration.GetValue<string>("Jwt:Audience") ?? "dockerhub-mimic-clients";

builder.Services.AddAuthentication(JwtBearerDefaults.AuthenticationScheme)
    .AddJwtBearer(options =>
    {
        options.TokenValidationParameters = new TokenValidationParameters
        {
            ValidateIssuer = true,
            ValidateAudience = true,
            ValidateLifetime = true,
            ValidateIssuerSigningKey = true,
            ValidIssuer = jwtIssuer,
            ValidAudience = jwtAudience,
            IssuerSigningKey = new SymmetricSecurityKey(Encoding.UTF8.GetBytes(jwtKey))
        };
    });

builder.Services.AddSingleton<IAuthorizationHandler, MustChangePasswordHandler>();
builder.Services.AddSingleton<IAuthorizationMiddlewareResultHandler, MustChangePasswordAuthorizationMiddlewareResultHandler>();
builder.Services.AddAuthorization(options =>
{
    options.DefaultPolicy = new AuthorizationPolicyBuilder(JwtBearerDefaults.AuthenticationScheme)
        .RequireAuthenticatedUser()
        .AddRequirements(new MustChangePasswordRequirement())
        .Build();
});
// Learn more about configuring OpenAPI at https://aka.ms/aspnet/openapi
builder.Services.AddOpenApi();
builder.Services.AddEndpointsApiExplorer();
builder.Services.AddSwaggerGen(options =>
{

    options.AddSecurityDefinition("Bearer", new OpenApiSecurityScheme
    {
        Name = "Authorization",
        Type = SecuritySchemeType.Http,
        Scheme = "bearer",
        BearerFormat = "JWT",
        In = ParameterLocation.Header,
        Description = "Paste only the JWT token. Swagger UI will add the Bearer prefix automatically."
    });

    options.AddSecurityRequirement(doc => new OpenApiSecurityRequirement
    {
        {
            new OpenApiSecuritySchemeReference("Bearer", doc, string.Empty),
            new List<string>()
        }
    });
});
builder.Services.AddStackExchangeRedisCache(options =>
{
    options.Configuration = builder.Configuration.GetValue<string>("Redis:Configuration") ?? "mem-cache:6379";
});

var elasticsearchUri = builder.Configuration.GetValue<string>("Elasticsearch:Uri") ?? "http://elasticsearch:9200";
builder.Services.AddSingleton(new ElasticsearchClient(new Uri(elasticsearchUri)));
builder.Services.AddScoped<ILogSearchService, LogSearchService>();
builder.Services.AddScoped<ElasticsearchIndexInitializer>();

var app = builder.Build();

app.UseSerilogRequestLogging();

// Configure the HTTP request pipeline.
if (app.Environment.IsDevelopment())
{
    app.MapOpenApi();
    app.UseSwagger();
    app.UseSwaggerUI();
}

if (!isRunningInContainer)
{
    app.UseHttpsRedirection();
}

app.UseCors("AllowFrontend");

app.UseAuthentication();
app.UseAuthorization();

app.MapControllers();

var skipDatabaseSeeding = builder.Configuration.GetValue<bool>("SkipDatabaseSeeding");
if (!skipDatabaseSeeding)
{
    using var scope = app.Services.CreateScope();
    var seeder = scope.ServiceProvider.GetRequiredService<DatabaseSeeder>();
    await seeder.SeedAsync();
}

var skipElasticsearchInit = builder.Configuration.GetValue<bool>("SkipElasticsearchInit");
if (!skipElasticsearchInit)
{
    using var scope = app.Services.CreateScope();
    var indexInitializer = scope.ServiceProvider.GetRequiredService<ElasticsearchIndexInitializer>();
    await indexInitializer.EnsureLogIndexTemplateAsync();
}

app.Run();

public partial class Program;
