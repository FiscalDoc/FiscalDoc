FROM mcr.microsoft.com/dotnet/sdk:10.0 AS build
WORKDIR /src

COPY ["src/Backend/VeloXML.SharedKernel/VeloXML.SharedKernel.csproj",   "Backend/VeloXML.SharedKernel/"]
COPY ["src/Backend/VeloXML.Domain/VeloXML.Domain.csproj",               "Backend/VeloXML.Domain/"]
COPY ["src/Backend/VeloXML.Application/VeloXML.Application.csproj",     "Backend/VeloXML.Application/"]
COPY ["src/Backend/VeloXML.Infrastructure/VeloXML.Infrastructure.csproj","Backend/VeloXML.Infrastructure/"]
COPY ["src/Backend/VeloXML.Persistence/VeloXML.Persistence.csproj",     "Backend/VeloXML.Persistence/"]
COPY ["src/Backend/VeloXML.API/VeloXML.API.csproj",                     "Backend/VeloXML.API/"]

RUN dotnet restore "Backend/VeloXML.API/VeloXML.API.csproj" -p:NuGetAudit=false

COPY src/Backend/ Backend/

RUN dotnet publish "Backend/VeloXML.API/VeloXML.API.csproj" \
    -c Release -o /app/publish --no-restore \
    -p:TreatWarningsAsErrors=false \
    -p:NuGetAudit=false

FROM mcr.microsoft.com/dotnet/aspnet:10.0 AS runtime
WORKDIR /app
COPY --from=build /app/publish .
EXPOSE 8080
USER $APP_UID
ENTRYPOINT ["dotnet", "VeloXML.API.dll"]
