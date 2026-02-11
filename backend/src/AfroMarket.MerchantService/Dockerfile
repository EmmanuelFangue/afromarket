FROM mcr.microsoft.com/dotnet/aspnet:10.0 AS base
WORKDIR /app
EXPOSE 8080

FROM mcr.microsoft.com/dotnet/sdk:10.0 AS build
WORKDIR /src
COPY ["src/AfroMarket.MerchantService/AfroMarket.MerchantService.csproj", "src/AfroMarket.MerchantService/"]
RUN dotnet restore "src/AfroMarket.MerchantService/AfroMarket.MerchantService.csproj"
COPY . .
WORKDIR "/src/src/AfroMarket.MerchantService"
RUN dotnet build "AfroMarket.MerchantService.csproj" -c Release -o /app/build

FROM build AS publish
RUN dotnet publish "AfroMarket.MerchantService.csproj" -c Release -o /app/publish /p:UseAppHost=false

FROM base AS final
WORKDIR /app
COPY --from=publish /app/publish .
ENTRYPOINT ["dotnet", "AfroMarket.MerchantService.dll"]
