using AfroMarket.MerchantService.Data;
using AfroMarket.MerchantService.Services;
using AfroMarket.MerchantService.Middleware;
using Microsoft.EntityFrameworkCore;
using Keycloak.AuthServices.Authentication;
using Keycloak.AuthServices.Authorization;
using Microsoft.AspNetCore.Authentication.JwtBearer;
using Microsoft.AspNetCore.Authentication;
using Microsoft.AspNetCore.Localization;
using System.Globalization;
using System.Security.Claims;

var builder = WebApplication.CreateBuilder(args);

// Add services to the container.
builder.Services.AddEndpointsApiExplorer();
builder.Services.AddSwaggerGen();

// Configure DbContext
builder.Services.AddDbContext<MerchantDbContext>(options =>
    options.UseSqlServer(builder.Configuration.GetConnectionString("DefaultConnection")));

// Register application services
builder.Services.AddScoped<IBusinessService, BusinessService>();
builder.Services.AddScoped<IProductService, ProductService>();
builder.Services.AddScoped<IUserSyncService, UserSyncService>();

// Register SearchServiceClient for real-time business and product index notifications
var searchServiceBaseUrl = builder.Configuration["SearchService:BaseUrl"] ?? "http://localhost:5049";
builder.Services.AddHttpClient<ISearchServiceClient, SearchServiceClient>(client =>
{
    client.BaseAddress = new Uri(searchServiceBaseUrl);
    client.Timeout = TimeSpan.FromSeconds(5);
});

// Register KeycloakAdminService for user registration
builder.Services.AddHttpClient("KeycloakAdmin", client =>
{
    client.Timeout = TimeSpan.FromSeconds(10);
});
builder.Services.AddScoped<IKeycloakAdminService, KeycloakAdminService>();

// Configure Localization
builder.Services.AddLocalization(options => options.ResourcesPath = "Resources");

builder.Services.Configure<RequestLocalizationOptions>(options =>
{
    var supportedCultures = new[] { "fr-CA", "fr", "en-CA", "en" };
    options.DefaultRequestCulture = new RequestCulture("fr-CA");
    options.SupportedCultures = supportedCultures.Select(c => new CultureInfo(c)).ToList();
    options.SupportedUICultures = supportedCultures.Select(c => new CultureInfo(c)).ToList();

    // Support Accept-Language header
    options.RequestCultureProviders = new List<IRequestCultureProvider>
    {
        new AcceptLanguageHeaderRequestCultureProvider(),
        new QueryStringRequestCultureProvider(), // Fallback: ?culture=en-CA
        new CookieRequestCultureProvider()
    };
});

// Configure Keycloak Authentication
// VerifyTokenAudience is false in appsettings — tokens from afromarket-frontend
// have aud:"account", not aud:"afromarket-merchant-service", so we skip audience validation.
builder.Services.AddKeycloakWebApiAuthentication(builder.Configuration, options =>
{
    options.RequireHttpsMetadata = false; // Development only
});

// Map Keycloak realm roles (realm_access.roles) → ClaimTypes.Role so that
// [Authorize(Policy = "MerchantOnly")] / RequireRole("merchant") work correctly.
builder.Services.AddTransient<IClaimsTransformation, KeycloakRoleClaimsTransformer>();

// Patch JWT events: at token validation time, extract realm_access.roles from the
// raw JSON claim and add them as ClaimTypes.Role so RequireRole() works.
builder.Services.PostConfigure<JwtBearerOptions>(
    Microsoft.AspNetCore.Authentication.JwtBearer.JwtBearerDefaults.AuthenticationScheme,
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

builder.Services.AddAuthorization(options =>
{
    // RequireClaim checks the claims collection directly by type, bypassing ClaimsIdentity.RoleClaimType.
    // This is necessary because Keycloak.AuthServices may configure RoleClaimType != ClaimTypes.Role,
    // which would make IsInRole() / RequireRole() miss the ClaimTypes.Role claims we inject.
    options.AddPolicy("MerchantOnly", policy =>
        policy.RequireClaim(ClaimTypes.Role, "merchant"));

    options.AddPolicy("AdminOnly", policy =>
        policy.RequireClaim(ClaimTypes.Role, "admin"));

    options.AddPolicy("MerchantOrAdmin", policy =>
        policy.RequireAssertion(ctx =>
            ctx.User.HasClaim(ClaimTypes.Role, "merchant") ||
            ctx.User.HasClaim(ClaimTypes.Role, "admin")));
});

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

builder.Services.AddControllers()
    .AddJsonOptions(options =>
    {
        // Serialiser les enums en string ("Draft" au lieu de 0)
        options.JsonSerializerOptions.Converters.Add(
            new System.Text.Json.Serialization.JsonStringEnumConverter());
    });

var app = builder.Build();

// Initialize database with migrations and seed data
using (var scope = app.Services.CreateScope())
{
    var services = scope.ServiceProvider;
    try
    {
        var context = services.GetRequiredService<MerchantDbContext>();

        // Apply migrations on startup (only in Development)
        if (app.Environment.IsDevelopment())
        {
            context.Database.Migrate();
            DbInitializer.Initialize(context);
        }
    }
    catch (Exception ex)
    {
        var logger = services.GetRequiredService<ILogger<Program>>();
        logger.LogError(ex, "An error occurred while initializing the database.");
    }
}

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

// Serve static files (uploaded images)
app.UseStaticFiles();

// Request Localization middleware
app.UseRequestLocalization();

// ADD Authentication & Authorization middleware
app.UseAuthentication();

// Sync user from Keycloak JWT to database
app.UseUserSync();

app.UseAuthorization();

app.MapControllers();

app.Run();
