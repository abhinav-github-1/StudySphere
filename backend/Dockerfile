# ==============================================================================
# STAGE 1: Maven Build Container
# ==============================================================================
FROM maven:3.9.6-eclipse-temurin-17 AS builder
WORKDIR /build

# Copy Maven POM first to exploit layer caching
COPY pom.xml .

# Download dependencies (safe cache step) using pre-installed Maven
RUN mvn dependency:go-offline -B

# Copy Java source files and compile
COPY src ./src
RUN mvn clean package -DskipTests -B


# ==============================================================================
# STAGE 2: Lightweight Production Runtime (Java 17 JRE + Nginx reverse proxy)
# ==============================================================================
FROM eclipse-temurin:17-jre-jammy
WORKDIR /app

# Install Nginx using standard package manager (non-interactive to avoid timezone prompts)
ENV DEBIAN_FRONTEND=noninteractive
RUN apt-get update && \
    apt-get install -y nginx ca-certificates && \
    update-ca-certificates && \
    rm -rf /var/lib/apt/lists/*

# Copy packaged Spring Boot JAR from builder stage
COPY --from=builder /build/target/*.jar /app/studyroom.jar

# Copy dynamic reverse proxy configuration and boot scripts
COPY nginx.conf /etc/nginx/nginx.conf
COPY entrypoint.sh /app/entrypoint.sh
# Clean CRLF characters to prevent bad interpreter bash errors on runtime runner
RUN tr -d '\r' < /app/entrypoint.sh > /app/entrypoint.sh.tmp && mv /app/entrypoint.sh.tmp /app/entrypoint.sh && chmod +x /app/entrypoint.sh

# Expose standard container port
EXPOSE 80

# Run dynamic proxy entrypoint script
ENTRYPOINT ["/app/entrypoint.sh"]
