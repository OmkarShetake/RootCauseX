# ==============================================================================
# Multi-Stage Production Dockerfile for RootCauseX
# Single Unified Container: Builds React Frontend + Spring Boot 3.4 Backend
# ==============================================================================

# ------------------------------------------------------------------------------
# Stage 1: Build Frontend (React + Vite + Tailwind CSS)
# ------------------------------------------------------------------------------
FROM node:20-alpine AS frontend-builder
WORKDIR /app/frontend

COPY frontend/package*.json ./
RUN npm ci

COPY frontend/ ./
RUN npm run build

# ------------------------------------------------------------------------------
# Stage 2: Build Backend JAR (Java 21 + Spring Boot 3.4 + Maven)
# ------------------------------------------------------------------------------
FROM eclipse-temurin:21-jdk-alpine AS backend-builder
WORKDIR /app/backend

# Cache Maven dependencies
COPY backend/pom.xml ./
RUN apk add --no-cache maven && mvn dependency:go-offline -B || true

# Copy backend source code
COPY backend/src ./src

# Copy built frontend assets into Spring Boot static resources directory
COPY --from=frontend-builder /app/frontend/dist ./src/main/resources/static

# Package production executable JAR (skipping unit tests during packaging)
RUN mvn clean package -DskipTests -B

# ------------------------------------------------------------------------------
# Stage 3: Lightweight Production Runtime Image (Java 21 JRE)
# ------------------------------------------------------------------------------
FROM eclipse-temurin:21-jre-alpine AS runtime

# Security: Run as non-root user
RUN addgroup -S appgroup && adduser -S appuser -G appgroup
USER appuser

WORKDIR /app

# Copy packaged JAR from backend-builder
COPY --from=backend-builder /app/backend/target/rootcausex-backend-1.0.0-SNAPSHOT.jar ./app.jar

# Configuration defaults
ENV PORT=8080 \
    SPRING_PROFILES_ACTIVE=prod \
    JAVA_TOOL_OPTIONS="-XX:+UseContainerSupport -XX:MaxRAMPercentage=75.0 -XX:+ExitOnOutOfMemoryError"

EXPOSE 8080

# Health check using Spring Boot Actuator
HEALTHCHECK --interval=30s --timeout=5s --start-period=40s --retries=3 \
  CMD wget -qO- http://localhost:8080/actuator/health || exit 1

ENTRYPOINT ["java", "-jar", "app.jar"]
