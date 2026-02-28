#!/bin/bash
# GSC Connect - Development Setup Script
# Run this once to set up your local development environment.

set -e

echo "=== GSC Connect - Local Dev Setup ==="
echo ""

# Check Node.js version
NODE_VERSION=$(node --version 2>/dev/null || echo "not installed")
if [[ "$NODE_VERSION" == "not installed" ]]; then
  echo "ERROR: Node.js is not installed. Please install Node.js 22 LTS."
  exit 1
fi

MAJOR=$(echo "$NODE_VERSION" | sed 's/v//' | cut -d. -f1)
if [[ "$MAJOR" -lt 22 ]]; then
  echo "WARNING: Node.js $NODE_VERSION detected. Node.js 22 LTS is recommended."
fi

echo "Node.js: $NODE_VERSION"

# Check PostgreSQL
if ! command -v psql &> /dev/null; then
  echo "WARNING: psql not found. Make sure PostgreSQL 15+ is running on port 5432."
else
  echo "PostgreSQL: $(psql --version)"
fi

# Install dependencies
echo ""
echo "1. Installing npm dependencies..."
npm install

# Copy .env.example if .env doesn't exist
if [ ! -f .env ]; then
  echo ""
  echo "2. Creating .env from .env.example..."
  cp .env.example .env
  echo "   IMPORTANT: Edit .env and fill in your Google OAuth credentials and generate secrets."
  echo "   Generate APP_SECRET:    node -e \"console.log(require('crypto').randomBytes(32).toString('hex'))\""
  echo "   Generate ENCRYPTION_KEY: node -e \"console.log(require('crypto').randomBytes(32).toString('hex'))\""
else
  echo ""
  echo "2. .env already exists, skipping..."
fi

# Generate Prisma client
echo ""
echo "3. Generating Prisma client..."
npx prisma generate

# Run database migrations
echo ""
echo "4. Running database migrations..."
echo "   Make sure PostgreSQL is running and DATABASE_URL in .env is correct."
npx prisma migrate deploy || {
  echo ""
  echo "   Migration failed. Try running 'npx prisma migrate dev' for development."
  echo "   Make sure PostgreSQL is running: brew services start postgresql@15"
}

echo ""
echo "=== Setup complete ==="
echo ""
echo "Next steps:"
echo "  1. Edit .env with your Google OAuth credentials"
echo "  2. Run the web app:    npm run dev"
echo "  3. Run the MCP server: npm run dev:mcp (in a separate terminal)"
echo "  4. Or run both at once: npm run dev:all"
echo ""
echo "  Web app: http://localhost:3000"
echo "  MCP server: http://localhost:3001"
echo ""
