#!/bin/bash
# entrypoint.sh — Startup script launching both Spring Boot jar and Nginx reverse proxy.

echo "🚀 Starting Spring Boot Backend in background (Tomcat listening on 8085, Netty Socket.IO on 9092)..."
java -jar /app/studyroom.jar &

# Render injects the 'PORT' env variable. We replace the 'listen 80;' placeholder in nginx.conf dynamically.
TARGET_PORT=${PORT:-80}
echo "🔄 Injecting Render Port: $TARGET_PORT into Nginx Configuration..."
sed -i "s/listen 80;/listen $TARGET_PORT;/g" /etc/nginx/nginx.conf

echo "⚡ Booting Nginx Reverse Proxy in foreground on port $TARGET_PORT..."
nginx -g "daemon off;"
