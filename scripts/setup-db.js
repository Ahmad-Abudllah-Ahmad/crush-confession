// This script ensures the database is properly set up in the Netlify environment
const { execSync } = require('child_process');
const fs = require('fs');
const path = require('path');

// Log the environment for debugging
console.log('Setting up database in environment:', process.env.NODE_ENV);
console.log('DATABASE_URL:', process.env.DATABASE_URL);
console.log('NEXTAUTH_URL:', process.env.NEXTAUTH_URL);
console.log('NEXTAUTH_SECRET is set:', !!process.env.NEXTAUTH_SECRET);

try {
  // Ensure the database directory exists
  const dbDir = path.dirname(process.env.DATABASE_URL.replace('file://', ''));
  console.log(`Database directory: ${dbDir}`);
  
  if (!fs.existsSync(dbDir)) {
    console.log(`Creating directory: ${dbDir}`);
    fs.mkdirSync(dbDir, { recursive: true });
  } else {
    console.log(`Directory already exists: ${dbDir}`);
  }

  // Check if we can write to the directory
  try {
    const testFile = path.join(dbDir, 'test-write.txt');
    fs.writeFileSync(testFile, 'test');
    console.log(`Successfully wrote test file to ${testFile}`);
    fs.unlinkSync(testFile);
    console.log('Successfully deleted test file');
  } catch (writeError) {
    console.error('Error writing to database directory:', writeError);
    // Continue anyway, the db push might still work
  }

  // Instead of running migrations, use db push to create the schema directly
  // This avoids migration conflicts with existing tables
  console.log('Setting up database schema with prisma db push...');
  execSync('npx prisma db push --accept-data-loss --force-reset', { stdio: 'inherit' });
  
  // Create a test user for easy login
  console.log('Creating test user...');
  execSync('node scripts/seed-db.js', { stdio: 'inherit' });
  
  console.log('Database setup completed successfully');
} catch (error) {
  console.error('Error setting up database:', error);
  process.exit(1);
}
