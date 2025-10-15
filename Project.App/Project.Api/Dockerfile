FROM mcr.microsoft.com/dotnet/sdk:9.0 AS builder

# set working directory
WORKDIR /src

# install dependencies
COPY *.csproj ./
# COPY ../../*.sln ./ # may be necessary?
RUN dotnet restore

# copy backend code
COPY . .

# build (publish)
RUN dotnet publish -c Release -o /app/publish --no-restore

FROM mcr.microsoft.com/dotnet/aspnet:9.0 AS runner

# set working directory
WORKDIR /app

# copy built files from builder
COPY --from=builder /app/publish .

# run! hopefully.
ENTRYPOINT ["dotnet", "Project.Api.dll"]
