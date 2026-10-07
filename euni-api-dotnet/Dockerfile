# syntax=docker/dockerfile:1
FROM mcr.microsoft.com/dotnet/sdk:8.0 AS build
WORKDIR /src
COPY . .
RUN dotnet publish src/HUMG.CMS.Api -c Release -o /app

FROM mcr.microsoft.com/dotnet/aspnet:8.0
WORKDIR /app
COPY --from=build /app .
COPY contract ./contract
ENV PORT=3000 HOST=0.0.0.0 API_LOG=false
EXPOSE 3000
# DATABASE_URL / DATABASE_ADMIN_URL / JWT_SECRET / CORS_ORIGINS truyền qua biến môi trường
ENTRYPOINT ["dotnet", "HUMG.CMS.Api.dll"]
