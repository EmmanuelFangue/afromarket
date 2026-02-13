FROM mcr.microsoft.com/dotnet/aspnet:8.0 AS base
WORKDIR /app
EXPOSE 8080

FROM mcr.microsoft.com/dotnet/sdk:8.0 AS build
WORKDIR /src
COPY ["src/AfroMarket.ApiGateway/AfroMarket.ApiGateway.csproj", "src/AfroMarket.ApiGateway/"]
RUN dotnet restore "src/AfroMarket.ApiGateway/AfroMarket.ApiGateway.csproj"
COPY . .
WORKDIR "/src/src/AfroMarket.ApiGateway"
RUN dotnet build "AfroMarket.ApiGateway.csproj" -c Release -o /app/build

FROM build AS publish
RUN dotnet publish "AfroMarket.ApiGateway.csproj" -c Release -o /app/publish /p:UseAppHost=false

FROM base AS final
WORKDIR /app
COPY --from=publish /app/publish .
ENTRYPOINT ["dotnet", "AfroMarket.ApiGateway.dll"]
