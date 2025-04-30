// This script conditionally runs database operations based on environment
const { execSync } = require('child_process');

// Skip database operations if flag is set (used in CI environment)
if (process.env.SKIP_DB_OPERATIONS === 'true') {
  console.log('Skipping database operations as SKIP_DB_OPERATIONS is set to true');
  process.exit(0);
}

try {
  console.log('Running database migrations and seeding...');
  
  // Generate Prisma client
  execSync('npx prisma generate', { stdio: 'inherit' });
  
  // Push schema to database
  execSync('npx prisma db push', { stdio: 'inherit' });
  
  // Seed the database
  execSync('node scripts/seed-db.js', { stdio: 'inherit' });
  
  console.log('Database operations completed successfully');
} catch (error) {
  console.error('Error during database operations:', error.message);
  // Exit with success code to allow build to continue
  process.exit(0);
}