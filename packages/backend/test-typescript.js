// Test TypeScript compilation
const { execSync } = require('child_process');

try {
  console.log('Testing TypeScript compilation...');
  execSync('npx tsc --noEmit --skipLibCheck', { stdio: 'inherit', cwd: process.cwd() });
  console.log('✅ TypeScript compilation successful');
} catch (error) {
  console.error('❌ TypeScript compilation failed');
  process.exit(1);
}
