using System.Text.Json;
using Microsoft.Extensions.Logging;

namespace AfroMarket.MerchantService.Helpers;

public static class TranslationHelper
{
    private static ILogger? _logger;

    public static void Initialize(ILogger logger)
    {
        _logger = logger;
    }

    public static string GetTranslation(string json, string lang)
    {
        try
        {
            var dict = JsonSerializer.Deserialize<Dictionary<string, string>>(json);
            return dict?.GetValueOrDefault(lang) ?? "";
        }
        catch (Exception ex)
        {
            _logger?.LogWarning(ex, "Failed to deserialize translation JSON: {Json}", json);
            return "";
        }
    }

    public static string SetTranslation(string json, string lang, string value)
    {
        try
        {
            var dict = JsonSerializer.Deserialize<Dictionary<string, string>>(json)
                       ?? new Dictionary<string, string>();
            dict[lang] = value;
            return JsonSerializer.Serialize(dict);
        }
        catch (Exception ex)
        {
            _logger?.LogWarning(ex, "Failed to serialize translation JSON. Lang: {Lang}, Value: {Value}", lang, value);
            return "{\"fr\":\"\",\"en\":\"\"}";
        }
    }
}
