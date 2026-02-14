using Microsoft.Extensions.Localization;

namespace AfroMarket.MerchantService.Extensions;

public static class LocalizationExtensions
{
    /// <summary>
    /// Formatte un message localisé avec paramètres
    /// </summary>
    public static string Format(this IStringLocalizer localizer, string key, params object[] args)
    {
        var localizedString = localizer[key];
        return args.Length > 0
            ? string.Format(localizedString.Value, args)
            : localizedString.Value;
    }
}
