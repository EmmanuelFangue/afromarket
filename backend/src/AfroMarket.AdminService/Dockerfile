FROM mcr.microsoft.com/dotnet/aspnet:8.0 AS base
WORKDIR /app
EXPOSE 8080

FROM mcr.microsoft.com/dotnet/sdk:8.0 AS build
WORKDIR /src
COPY ["src/AfroMarket.AdminService/AfroMarket.AdminService.csproj", "src/AfroMarket.AdminService/"]
RUN dotnet restore "src/AfroMarket.AdminService/AfroMarket.AdminService.csproj"
COPY . .
WORKDIR "/src/src/AfroMarket.AdminService"
RUN dotnet build "AfroMarket.AdminService.csproj" -c Release -o /app/build

FROM build AS publish
RUN dotnet publish "AfroMarket.AdminService.csproj" -c Release -o /app/publish /p:UseAppHost=false

FROM base AS final
WORKDIR /app
COPY --from=publish /app/publish .
ENTRYPOINT ["dotnet", "AfroMarket.AdminService.dll"]
