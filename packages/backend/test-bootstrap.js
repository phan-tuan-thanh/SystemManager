// Simple test to check if NestJS can bootstrap
import { NestFactory } from '@nestjs/core';
import { AppModule } from './src/app.module';

async function testBootstrap() {
  try {
    console.log('Testing NestJS bootstrap...');
    const app = await NestFactory.create(AppModule, { logger: false });
    console.log('✅ NestJS bootstrap successful');
    await app.close();
  } catch (error) {
    console.error('❌ NestJS bootstrap failed:', error.message);
    console.error('Stack:', error.stack);
    process.exit(1);
  }
}

testBootstrap();
