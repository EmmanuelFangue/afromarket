using AfroMarket.MerchantService.Data;
using AfroMarket.MerchantService.Services;
using Microsoft.EntityFrameworkCore;
using Keycloak.AuthServices.Authentication;
using Keycloak.AuthServices.Authorization;
using Microsoft.AspNetCore.Authentication.JwtBearer;

var builder = WebApplication.CreateBuilder(args);

// Add services to the container.
builder.Services.AddEndpointsApiExplorer();
builder.Services.AddSwaggerGen();

// Configure DbContext
builder.Services.AddDbContext<MerchantDbContext>(options =>
    options.UseSqlServer(builder.Configuration.GetConnectionString("DefaultConnection")));

// Register application services
builder.Services.AddScoped<IBusinessService, BusinessService>();

// Configure Keycloak Authentication
builder.Services.AddKeycloakWebApiAuthentication(builder.Configuration, options =>
{
    options.Audience = builder.Configuration["Keycloak:Resource"];
    options.RequireHttpsMetadata = false; // Development only
});

builder.Services.AddAuthorization(options =>
{
    options.AddPolicy("MerchantOnly", policy =>
        policy.RequireRole("merchant"));

    options.AddPolicy("AdminOnly", policy =>
        policy.RequireRole("admin"));

    options.AddPolicy("MerchantOrAdmin", policy =>
        policy.RequireRole("merchant", "admin"));
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

builder.Services.AddControllers();

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

// ADD Authentication & Authorization middleware
app.UseAuthentication();
app.UseAuthorization();

app.MapControllers();

app.Run();
