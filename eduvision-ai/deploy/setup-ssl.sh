#!/usr/bin/env bash
# ==============================================================================
# EduVision AI — Let's Encrypt SSL & Domain Configuration Script
# ==============================================================================

set -euo pipefail

if [ "$#" -lt 2 ]; then
  echo "Usage: ./deploy/setup-ssl.sh <domain_name> <admin_email>"
  echo "Example: ./deploy/setup-ssl.sh eduvision.ai admin@eduvision.ai"
  exit 1
fi

DOMAIN="$1"
EMAIL="$2"

echo "Configuring HTTPS SSL for domain: ${DOMAIN} with email: ${EMAIL}..."

if ! command -v certbot &> /dev/null; then
  echo "Installing certbot..."
  sudo apt-get update && sudo apt-get install -y certbot python3-certbot-nginx
fi

# Obtain certificate
sudo certbot certonly --standalone -d "${DOMAIN}" --non-interactive --agree-tos -m "${EMAIL}"

echo "SSL Certificate successfully provisioned for ${DOMAIN}."
echo "Certificates stored in: /etc/letsencrypt/live/${DOMAIN}/"
