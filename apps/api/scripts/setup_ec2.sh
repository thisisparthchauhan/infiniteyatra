#!/bin/bash
set -e

# Update System
echo "Updating system..."
sudo apt update && sudo apt upgrade -y

# Install Node.js 20
echo "Installing Node.js 20..."
curl -fsSL https://deb.nodesource.com/setup_20.x | sudo -E bash -
sudo apt install -y nodejs

# Install Utilities
echo "Installing Nginx, Certbot, Git..."
sudo apt install -y nginx certbot python3-certbot-nginx git

# Install Global NPM Packages
echo "Installing PM2, Nest CLI..."
sudo npm install -g pnpm pm2 @nestjs/cli

# Configure Swap (2GB) - Crucial for t3.micro
echo "Configuring 2GB Swap..."
sudo fallocate -l 2G /swapfile
sudo chmod 600 /swapfile
sudo mkswap /swapfile
sudo swapon /swapfile
echo '/swapfile none swap sw 0 0' | sudo tee -a /etc/fstab

# Setup Firewall (UFW)
echo "Configuring Firewall..."
sudo ufw allow OpenSSH
sudo ufw allow 'Nginx Full'
echo "y" | sudo ufw enable

echo "------------------------------------------------"
echo "Setup Complete! Next steps:"
echo "1. Clone your repository: git clone https://github.com/thisisparthchauhan/infiniteyatra.git"
echo "2. Configure .env in apps/api"
echo "3. Run 'npm install' and 'npm run build' in apps/api"
echo "4. Start with 'pm2 start ecosystem.config.js'"
echo "5. Configure Nginx and SSL"
echo "------------------------------------------------"
