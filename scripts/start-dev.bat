@echo off
echo 🚀 Starting Shanmukha Generators Development Environment
echo ==================================================

REM Check if Node.js is installed
node --version >nul 2>&1
if %errorlevel% neq 0 (
    echo ❌ Node.js is not installed. Please install Node.js first.
    pause
    exit /b 1
)

REM Create .env.local if it doesn't exist
if not exist .env.local (
    echo 📝 Creating .env.local from example...
    copy .env.local.example .env.local
    echo ✅ Please update .env.local with your configuration
)

REM Create backend .env if it doesn't exist
if not exist backend\.env (
    echo 📝 Creating backend\.env from example...
    copy backend\.env.example backend\.env
    echo ✅ Please update backend\.env with your configuration
)

REM Install frontend dependencies
echo 📦 Installing frontend dependencies...
call npm install

REM Install backend dependencies
echo 📦 Installing backend dependencies...
cd backend
call npm install
cd ..

echo.
echo 🎉 Setup complete! Now you can start the services:
echo.
echo 1. Start the frontend (Next.js):
echo    npm run dev
echo.
echo 2. Start the backend webhook service:
echo    cd backend ^&^& npm run dev
echo.
echo 3. Start the backend parser service:
echo    cd backend ^&^& npm run dev:parser
echo.
echo 4. Access the application:
echo    Frontend: http://localhost:3000
echo    Backend API: http://localhost:3001
echo    Admin Panel: http://localhost:3000/admin/login
echo.
echo 📚 For more information, see the README.md file
pause
