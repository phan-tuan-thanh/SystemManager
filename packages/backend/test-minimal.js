// Test minimal backend startup
import { NestFactory } from '@nestjs/core';
import { AppModule } from './src/app.module';

async function testMinimalStartup() {
  try {
    console.log('Testing minimal backend startup...');
    const app = await NestFactory.create(AppModule, { logger: false });
    console.log('✅ Minimal backend startup successful');

    const port = process.env.PORT || 3000;
    await app.listen(port);
    console.log(`✅ Server listening on port ${port}`);

    // Test a simple request
    console.log('Testing system status endpoint...');
    const response = await fetch(`http://localhost:${port}/api/v1/system/status`);
    const data = await response.json();
    console.log('✅ System status response:', data);

    await app.close();
    console.log('✅ App closed successfully');
  } catch (error) {
    console.error('❌ Error:', error.message);
    console.error('Stack:', error.stack);
    process.exit(1);
  }
}

testMinimalStartup();
