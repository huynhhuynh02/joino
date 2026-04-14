#!/bin/bash

# Configuration
DOMAIN="joino.cloud"
EMAIL="admin@joino.cloud" # Replace with your email
CHALLENGE_DIR="./certbot/www"
CONF_DIR="./certbot/conf"

echo "### Starting SSL initialization for $DOMAIN..."

# Create necessary directories
mkdir -p "$CHALLENGE_DIR"
mkdir -p "$CONF_DIR"

# Check if certificates already exist
if [ -d "$CONF_DIR/live/$DOMAIN" ]; then
  echo "Certificates already exist for $DOMAIN. Skipping initialization."
  exit 0
fi

echo "### Requesting initial certificate..."

# Run certbot in standalone mode temporarily (requires port 80 to be free)
# Note: This assumes no other process is using port 80 on the host.
# If Nginx is already running, you should use the webroot method instead.

docker run --rm -it \
  -v "$(pwd)/$CONF_DIR:/etc/letsencrypt" \
  -v "$(pwd)/$CHALLENGE_DIR:/var/www/certbot" \
  -p 80:80 \
  certbot/certbot certonly --standalone \
  --email "$EMAIL" --agree-tos --no-eff-email \
  -d "$DOMAIN" -d "www.$DOMAIN"

echo "### SSL initialization complete."
echo "You can now run: docker compose -f docker-compose.prod.yml up -d --build"
