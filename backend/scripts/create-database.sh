#!/bin/bash
# Script to create the database in PostgreSQL

# Colors for output
GREEN='\033[0;32m'
RED='\033[0;31m'
NC='\033[0m' # No Color

echo "Creating database tbarimt_db..."

# Check if database already exists
DB_EXISTS=$(sudo -u postgres psql -tAc "SELECT 1 FROM pg_database WHERE datname='tbarimt_db'")

if [ "$DB_EXISTS" = "1" ]; then
    echo -e "${GREEN}Database tbarimt_db already exists.${NC}"
else
    # Create the database
    sudo -u postgres psql -c "CREATE DATABASE tbarimt_db;"
    
    if [ $? -eq 0 ]; then
        echo -e "${GREEN}Database tbarimt_db created successfully!${NC}"
    else
        echo -e "${RED}Failed to create database.${NC}"
        exit 1
    fi
fi

echo "Database setup complete!"

