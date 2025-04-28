#!/bin/bash

echo "🚀 Setting up CrushConfessions development environment..."

# Install dependencies
echo "📦 Installing dependencies..."
npm install

# Check if .env file exists, if not create it
if [ ! -f .env ]; then
  echo "🔧 Creating .env file..."
  cat > .env << EOL
DATABASE_URL="postgresql://username:password@localhost:5432/crushconfessions?schema=public"
NEXTAUTH_SECRET="your-secret-key-change-this-in-production"
NEXTAUTH_URL="http://localhost:3000"
EMAIL_SERVER_HOST="smtp.example.com"
EMAIL_SERVER_PORT=587
EMAIL_SERVER_USER="user@example.com"
EMAIL_SERVER_PASSWORD="password"
EMAIL_FROM="noreply@crushconfessions.app"
EOL
  echo "⚠️ Please update the .env file with your database and email credentials!"
fi

# Generate Prisma client
echo "🔄 Generating Prisma client..."
npx prisma generate

echo "
🎉 Setup completed! Next steps:

1. Update your .env file with proper database and email credentials
2. Create and migrate your database:
   npx prisma migrate dev --name init

3. Start the development server:
   npm run dev

4. Open http://localhost:3000 in your browser

Happy coding! 💜
" 