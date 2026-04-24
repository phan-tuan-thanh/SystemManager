// Test individual module imports
async function testImports() {
  try {
    console.log('Testing AuthModule...');
    const { AuthModule } = require('./src/modules/auth/auth.module');
    console.log('✅ AuthModule OK');

    console.log('Testing UserModule...');
    const { UserModule } = require('./src/modules/user/user.module');
    console.log('✅ UserModule OK');

    console.log('Testing SystemModule...');
    const { SystemModule } = require('./src/modules/system/system.module');
    console.log('✅ SystemModule OK');

    console.log('Testing AppModule...');
    const { AppModule } = require('./src/app.module');
    console.log('✅ AppModule OK');
  } catch (error) {
    console.error('❌ Import error:', error.message);
    console.error('Stack:', error.stack);
    process.exit(1);
  }
}

testImports();
