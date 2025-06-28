#!/bin/bash

# Start development environment for Shanmukha Generators

echo "🚀 Starting Shanmukha Generators Development Environment"
echo "=================================================="

# Check if Node.js is installed
if ! command -v node &> /dev/null; then
    echo "❌ Node.js is not installed. Please install Node.js first."
    exit 1
fi

# Check if MongoDB is running
if ! pgrep -x "mongod" > /dev/null; then
    echo "⚠️  MongoDB is not running. Please start MongoDB first."
    echo "   You can start MongoDB with: sudo systemctl start mongod"
    echo "   Or if using Docker: docker run -d -p 27017:27017 mongo"
fi

# Check if Redis is running
if ! pgrep -x "redis-server" > /dev/null; then
    echo "⚠️  Redis is not running. Please start Redis first."
    echo "   You can start Redis with: sudo systemctl start redis"
    echo "   Or if using Docker: docker run -d -p 6379:6379 redis"
fi

# Create .env.local if it doesn't exist
if [ ! -f .env.local ]; then
    echo "📝 Creating .env.local from example..."
    cp .env.local.example .env.local
    echo "✅ Please update .env.local with your configuration"
fi

# Create backend .env if it doesn't exist
if [ ! -f backend/.env ]; then
    echo "📝 Creating backend/.env from example..."
    cp backend/.env.example backend/.env
    echo "✅ Please update backend/.env with your configuration"
fi

# Install frontend dependencies
echo "📦 Installing frontend dependencies..."
npm install

# Install backend dependencies
echo "📦 Installing backend dependencies..."
cd backend && npm install && cd ..

echo ""
echo "🎉 Setup complete! Now you can start the services:"
echo ""
echo "1. Start the frontend (Next.js):"
echo "   npm run dev"
echo ""
echo "2. Start the backend webhook service:"
echo "   cd backend && npm run dev"
echo ""
echo "3. Start the backend parser service:"
echo "   cd backend && npm run dev:parser"
echo ""
echo "4. Access the application:"
echo "   Frontend: http://localhost:3000"
echo "   Backend API: http://localhost:3001"
echo "   Admin Panel: http://localhost:3000/admin/login"
echo ""
echo "📚 For more information, see the README.md file"
