# Build stage
FROM mcr.microsoft.com/dotnet/sdk:10.0 AS build
WORKDIR /src

# Copy csproj files and restore all dependencies (layer cache)
COPY backend.csproj .
COPY backend.slnx .
COPY Tests/Tests.csproj ./Tests/
RUN dotnet restore backend.slnx

# Copy everything else and build
COPY . .
RUN dotnet build backend.slnx -c Release
RUN dotnet publish backend.csproj -c Release -o /app/publish --no-build

# Test stage — reuses the build layer, all obj files already present
FROM build AS test
WORKDIR /src
ENTRYPOINT ["dotnet", "test", "backend.slnx", "--no-build", "-c", "Release", "--logger", "console;verbosity=normal"]

# Runtime stage
FROM mcr.microsoft.com/dotnet/aspnet:10.0 AS runtime
WORKDIR /app
COPY --from=build /app/publish .

# Expose port
EXPOSE 8080
ENV ASPNETCORE_URLS=http://+:8080

ENTRYPOINT ["dotnet", "backend.dll"]
