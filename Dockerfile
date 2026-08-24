# ==============================================================================
# Unified Multi-Stage Production Dockerfile for FinTrack
# Packages React 19 Frontend directly into Spring Boot 3 Java 21 Backend
# ==============================================================================

# ------------------------------------------------------------------------------
# Stage 1: Build React Frontend
# ------------------------------------------------------------------------------
FROM node:20-alpine AS frontend-build
WORKDIR /app/frontend

COPY frontend/package*.json ./
RUN npm ci

COPY frontend/ ./
RUN npm run build

# ------------------------------------------------------------------------------
# Stage 2: Build Spring Boot Backend with embedded React static assets
# ------------------------------------------------------------------------------
FROM maven:3.9-eclipse-temurin-21 AS backend-build
WORKDIR /app

COPY backend/pom.xml backend/
RUN mvn -f backend/pom.xml dependency:go-offline -B

COPY backend/ backend/

# Embed React build into Spring Boot static resources
RUN rm -rf backend/src/main/resources/static/*
COPY --from=frontend-build /app/frontend/dist/ backend/src/main/resources/static/

RUN mvn -f backend/pom.xml clean package -DskipTests

# ------------------------------------------------------------------------------
# Stage 3: Lightweight Production JRE Runtime
# ------------------------------------------------------------------------------
FROM eclipse-temurin:21-jre-alpine
WORKDIR /app

RUN addgroup -S fintrack && adduser -S fintrack -G fintrack
USER fintrack:fintrack

COPY --from=backend-build /app/backend/target/fintrack-backend-1.0.0.jar app.jar

ENV PORT=8080
EXPOSE 8080

ENTRYPOINT ["java", "-jar", "-Djava.security.egd=file:/dev/./urandom", "app.jar"]
