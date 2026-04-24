// Simple test to check if imports work
console.log('Testing backend imports...');

try {
  // Test imports that were problematic
  const { Roles } = require('./src/common/decorators/roles.decorator');
  const RolesGuard = require('./src/common/guards/roles.guard');
  const AuditLogInterceptor = require('./src/common/interceptors/audit-log.interceptor');

  console.log('✅ All imports successful');
} catch (error) {
  console.error('❌ Import error:', error.message);
  process.exit(1);
}
