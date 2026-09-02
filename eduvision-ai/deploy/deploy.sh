#!/usr/bin/env bash
# ==============================================================================
# EduVision AI — Production Cloud Deployment Automation Script
# ==============================================================================

set -euo pipefail

RED='\033[0;31m'
GREEN='\033[0;32m'
BLUE='\033[0;34m'
YELLOW='\033[1;33m'
NC='\033[0m'

echo -e "${BLUE}=================================================================${NC}"
echo -e "${BLUE}     EDUVISION AI — PRODUCTION CLOUD DEPLOYMENT INITIALIZER      ${NC}"
echo -e "${BLUE}=================================================================${NC}"

# Check prerequisites
echo -e "\n${YELLOW}1. Checking System Prerequisites...${NC}"

if ! command -v docker &> /dev/null; then
  echo -e "${RED}[ERROR] Docker is not installed. Please install Docker before deploying.${NC}"
  exit 1
fi

if ! docker compose version &> /dev/null && ! command -v docker-compose &> /dev/null; then
  echo -e "${RED}[ERROR] Docker Compose is not installed.${NC}"
  exit 1
fi

echo -e "${GREEN}[OK] Docker and Docker Compose are ready.${NC}"

# Check for .env file
echo -e "\n${YELLOW}2. Verifying Production Environment Configuration...${NC}"
if [ ! -f .env ]; then
  if [ -f deploy/.env.production.example ]; then
    echo -e "${YELLOW}[NOTICE] Creating .env from deploy/.env.production.example${NC}"
    cp deploy/.env.production.example .env
  else
    echo -e "${RED}[ERROR] No .env file found. Please create .env before deploying.${NC}"
    exit 1
  fi
fi
echo -e "${GREEN}[OK] Production environment file verified.${NC}"

# Stop existing containers
echo -e "\n${YELLOW}3. Pulling Latest Containers and Building Stack...${NC}"
docker compose -f docker-compose.yml -f docker-compose.prod.yml down --remove-orphans || true

# Build and start in detached mode
docker compose -f docker-compose.yml -f docker-compose.prod.yml up -d --build

# Health checks
echo -e "\n${YELLOW}4. Awaiting Service Health Status...${NC}"
sleep 5

docker compose -f docker-compose.yml -f docker-compose.prod.yml ps

echo -e "\n${GREEN}=================================================================${NC}"
echo -e "${GREEN}  ✓ EDUVISION AI DEPLOYED SUCCESSFULLY TO PRODUCTION!            ${NC}"
echo -e "${GREEN}  - Web Interface: http://localhost (or configured domain)       ${NC}"
echo -e "${GREEN}  - API Endpoint:  http://localhost/api                          ${NC}"
echo -e "${GREEN}=================================================================${NC}"
