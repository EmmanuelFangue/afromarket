using Keycloak.AuthServices.Authentication;
using Keycloak.AuthServices.Authorization;
using Microsoft.AspNetCore.Authentication.JwtBearer;
using System.Security.Claims;

var builder = WebApplication.CreateBuilder(args);

// Add services to the container.
builder.Services.AddEndpointsApiExplorer();
builder.Services.AddSwaggerGen();

// Configure Keycloak Authentication
// VerifyTokenAudience is set to false in appsettings — tokens from afromarket-frontend
// have aud:"account", not aud:"afromarket-api-gateway", so we skip audience validation.
builder.Services.AddKeycloakWebApiAuthentication(builder.Configuration, options =>
{
    options.RequireHttpsMetadata = false; // Development only
});

// Map Keycloak realm roles (realm_access.roles) → ClaimTypes.Role so that
// downstream authorization policies work correctly if needed in the future.
builder.Services.PostConfigure<JwtBearerOptions>(
    JwtBearerDefaults.AuthenticationScheme,
    jwtOptions =>
    {
        var previous = jwtOptions.Events;
        jwtOptions.Events = new JwtBearerEvents
        {
            OnTokenValidated = async ctx =>
            {
                if (previous?.OnTokenValidated != null)
                    await previous.OnTokenValidated(ctx);

                if (ctx.Principal?.Identity is not ClaimsIdentity identity) return;

                var realmAccessClaim = ctx.Principal.FindFirst("realm_access");
                if (realmAccessClaim is null) return;

                try
                {
                    using var doc = System.Text.Json.JsonDocument.Parse(realmAccessClaim.Value);
                    if (!doc.RootElement.TryGetProperty("roles", out var rolesEl)) return;

                    foreach (var role in rolesEl.EnumerateArray())
                    {
                        var r = role.GetString();
                        if (r is not null && !identity.HasClaim(ClaimTypes.Role, r))
                            identity.AddClaim(new Claim(ClaimTypes.Role, r));
                    }
                }
                catch (System.Text.Json.JsonException) { }
            }
        };
    });

builder.Services.AddAuthorization();

// Configure YARP Reverse Proxy
builder.Services.AddReverseProxy()
    .LoadFromConfig(builder.Configuration.GetSection("ReverseProxy"));

// Configure CORS
builder.Services.AddCors(options =>
{
    options.AddPolicy("AllowFrontend", policy =>
    {
        policy.WithOrigins(
            builder.Configuration["Cors:AllowedOrigins"]?.Split(',') ?? new[] { "http://localhost:3000" }
        )
        .AllowAnyMethod()
        .AllowAnyHeader()
        .AllowCredentials();
    });
});

var app = builder.Build();

// Configure the HTTP request pipeline.
if (app.Environment.IsDevelopment())
{
    app.UseSwagger();
    app.UseSwaggerUI();
}
else
{
    app.UseHttpsRedirection();
}

app.UseCors("AllowFrontend");

// Authentication & Authorization
app.UseAuthentication();
app.UseAuthorization();

// Map reverse proxy routes
app.MapReverseProxy();

app.Run();
