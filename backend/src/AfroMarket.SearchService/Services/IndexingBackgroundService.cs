namespace AfroMarket.SearchService.Services;

public class IndexingBackgroundService : BackgroundService
{
    private readonly IServiceProvider _serviceProvider;
    private readonly ILogger<IndexingBackgroundService> _logger;

    public IndexingBackgroundService(
        IServiceProvider serviceProvider,
        ILogger<IndexingBackgroundService> logger)
    {
        _serviceProvider = serviceProvider;
        _logger = logger;
    }

    protected override async Task ExecuteAsync(CancellationToken stoppingToken)
    {
        // Wait for app startup
        await Task.Delay(TimeSpan.FromSeconds(5), stoppingToken);

        _logger.LogInformation("IndexingBackgroundService started");

        using var scope = _serviceProvider.CreateScope();
        var indexingService = scope.ServiceProvider.GetRequiredService<IndexingService>();

        await indexingService.InitialIndexAsync();

        _logger.LogInformation("IndexingBackgroundService completed");
    }
}
