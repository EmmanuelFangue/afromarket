using OpenSearch.Client;
using OpenSearch.Net;
using AfroMarket.SearchService.Services;

var builder = WebApplication.CreateBuilder(args);

// Add services to the container.
builder.Services.AddControllers();
builder.Services.AddEndpointsApiExplorer();
builder.Services.AddSwaggerGen();

// Configure OpenSearch client
var openSearchUrl = builder.Configuration["OpenSearch:Uri"] ?? "http://localhost:9200";
var settings = new ConnectionSettings(new Uri(openSearchUrl))
    .DefaultIndex("businesses")
    .PrettyJson()
    .RequestTimeout(TimeSpan.FromMinutes(2));

// Enable debug mode only in Development
if (builder.Environment.IsDevelopment())
{
    settings.EnableDebugMode();
}

builder.Services.AddSingleton<IOpenSearchClient>(new OpenSearchClient(settings));
builder.Services.AddScoped<ISearchService, OpenSearchService>();

// Add CORS
builder.Services.AddCors(options =>
{
    options.AddPolicy("AllowAll", builder =>
    {
        builder.AllowAnyOrigin()
               .AllowAnyMethod()
               .AllowAnyHeader();
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

app.UseCors("AllowAll");
app.UseAuthorization();
app.MapControllers();

app.Run();
