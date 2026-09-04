#!/usr/bin/env bash
# ==============================================================================
# Swasthya Sahayak — EC2 Deployment Script
# Automatically configures Docker, spins up Redis & Backend, and runs healthchecks
# ==============================================================================

set -e

GREEN='\033[0;32m'
BLUE='\033[0;34m'
YELLOW='\033[1;33m'
RED='\033[0;31m'
NC='\033[0m' # No Color

echo -e "${BLUE}======================================================${NC}"
echo -e "${BLUE}  Swasthya Sahayak — EC2 Backend Deployment Setup    ${NC}"
echo -e "${BLUE}======================================================${NC}"

# 1. Check Docker Installation
if ! command -v docker &> /dev/null; then
    echo -e "${YELLOW}[!] Docker not found. Installing Docker...${NC}"
    if [ -f /etc/os-release ]; then
        . /etc/os-release
        if [[ "$ID" == "ubuntu" || "$ID_LIKE" == *"ubuntu"* || "$ID" == "debian" ]]; then
            sudo apt-get update
            sudo apt-get install -y ca-certificates curl gnupg
            sudo install -m 0755 -d /etc/apt/keyrings
            curl -fsSL https://download.docker.com/linux/ubuntu/gpg | sudo gpg --dearmor -o /etc/apt/keyrings/docker.gpg
            sudo chmod a+r /etc/apt/keyrings/docker.gpg
            echo "deb [arch=$(dpkg --print-architecture) signed-by=/etc/apt/keyrings/docker.gpg] https://download.docker.com/linux/ubuntu $(. /etc/os-release && echo "$VERSION_CODENAME") stable" | sudo tee /etc/apt/sources.list.d/docker.list > /dev/null
            sudo apt-get update
            sudo apt-get install -y docker-ce docker-ce-cli containerd.io docker-buildx-plugin docker-compose-plugin
            sudo systemctl enable --now docker
            sudo usermod -aG docker "$USER"
        elif [[ "$ID" == "amzn" || "$ID" == "rhel" || "$ID" == "centos" ]]; then
            sudo dnf install -y docker
            sudo systemctl enable --now docker
            sudo usermod -aG docker "$USER"
        fi
    fi
    echo -e "${GREEN}[✓] Docker installed successfully.${NC}"
fi

# 2. Check Docker Compose
if ! docker compose version &> /dev/null; then
    echo -e "${YELLOW}[!] Docker Compose plugin missing. Attempting install...${NC}"
    sudo apt-get install -y docker-compose-plugin || sudo dnf install -y docker-compose-plugin || true
fi

# 3. Check for .env file
if [ ! -f .env ]; then
    if [ -f .env.example ]; then
        echo -e "${YELLOW}[!] .env not found. Creating from .env.example...${NC}"
        cp .env.example .env
        echo -e "${RED}[ACTION REQUIRED] Please edit .env with your actual Supabase & MongoDB credentials:${NC}"
        echo -e "   nano .env"
        exit 1
    else
        echo -e "${RED}[ERROR] Neither .env nor .env.example was found. Please create .env before running this script.${NC}"
        exit 1
    fi
fi

# 4. Build and Launch Containers
echo -e "${BLUE}[*] Building and starting Backend + Redis containers...${NC}"
docker compose down --remove-orphans || true
docker compose up -d --build

# 5. Wait and verify Health
echo -e "${BLUE}[*] Waiting for services to initialize and pass healthchecks...${NC}"
sleep 10

MAX_ATTEMPTS=12
ATTEMPT=1
HEALTHY=false

while [ $ATTEMPT -le $MAX_ATTEMPTS ]; do
    HTTP_STATUS=$(curl -s -o /dev/null -w "%{http_code}" http://localhost:4000/api/v1/health || true)
    if [ "$HTTP_STATUS" == "200" ]; then
        HEALTHY=true
        break
    fi
    echo -e "${YELLOW}Waiting for backend healthcheck (attempt $ATTEMPT/$MAX_ATTEMPTS)...${NC}"
    sleep 5
    ((ATTEMPT++))
done

if [ "$HEALTHY" = true ]; then
    echo -e "${GREEN}======================================================${NC}"
    echo -e "${GREEN}  [✓] Swasthya Sahayak Backend & Redis are ONLINE!    ${NC}"
    echo -e "${GREEN}  Health URL: http://localhost:4000/api/v1/health     ${NC}"
    echo -e "${GREEN}======================================================${NC}"
    echo -e "Logs can be viewed with: ${YELLOW}docker compose logs -f${NC}"
else
    echo -e "${RED}[!] Healthcheck timed out. Checking container logs:${NC}"
    docker compose logs --tail=50
    exit 1
fi
