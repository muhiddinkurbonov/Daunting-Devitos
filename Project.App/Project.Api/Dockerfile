FROM mcr.microsoft.com/dotnet/sdk:9.0 AS build

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

FROM mcr.microsoft.com/dotnet/aspnet:9.0 AS run

# set working directory
WORKDIR /app

# copy built files from build
COPY --from=build /app/publish .

# run! hopefully.
ENTRYPOINT ["dotnet", "Project.Api.dll"]
