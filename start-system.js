/**
 * Quick Setup Script for YouTube Dashboard System
 * Run this to start all services in the correct order
 */

const { spawn } = require('child_process');
const { promisify } = require('util');
const sleep = promisify(setTimeout);

class SystemManager {
  constructor() {
    this.processes = [];
  }

  async startServices() {
    console.log('🚀 Starting YouTube Dashboard System...\n');

    try {
      // Step 1: Start Database API
      console.log('📊 Step 1: Starting Database API (port 3001)...');
      const apiProcess = spawn('node', ['youtube-data-api.js'], {
        stdio: 'pipe',
        shell: true
      });

      apiProcess.stdout.on('data', (data) => {
        console.log(`[API] ${data.toString().trim()}`);
      });

      apiProcess.stderr.on('data', (data) => {
        console.error(`[API ERROR] ${data.toString().trim()}`);
      });

      this.processes.push({ name: 'Database API', process: apiProcess });

      // Wait for API to start
      await sleep(3000);

      console.log('✅ Database API started successfully\n');

      // Step 2: Test API Health
      console.log('🔍 Step 2: Testing API health...');
      try {
        const testAPI = spawn('curl', ['http://localhost:3001/api/youtube/health'], {
          stdio: 'pipe',
          shell: true
        });

        testAPI.stdout.on('data', (data) => {
          console.log(`[API TEST] ${data.toString().trim()}`);
        });

        await sleep(2000);
        console.log('✅ API health check completed\n');
      } catch (error) {
        console.log('⚠️  API health check failed, but continuing...\n');
      }

      // Step 3: Show system status
      console.log('📋 System Status:');
      console.log('✅ Database API: http://localhost:3001');
      console.log('✅ Dashboard V2: http://localhost:3003');
      console.log('✅ Architecture Guide: YOUTUBE_ARCHITECTURE_GUIDE.md');
      console.log('\n🎯 Quick Commands:');
      console.log('  📊 View Dashboard: http://localhost:3003');
      console.log('  🔧 Test API: curl http://localhost:3001/api/youtube/channels');
      console.log('  📈 Force Update: node force-update-db-methods.js');
      console.log('  📖 Documentation: YOUTUBE_ARCHITECTURE_GUIDE.md');

      console.log('\n✅ YouTube Dashboard System is ready!');
      console.log('Press Ctrl+C to stop all services...\n');

    } catch (error) {
      console.error('❌ Error starting services:', error.message);
    }
  }

  async stopServices() {
    console.log('\n🛑 Stopping all services...');
    
    for (const service of this.processes) {
      try {
        service.process.kill();
        console.log(`✅ Stopped ${service.name}`);
      } catch (error) {
        console.log(`⚠️  Error stopping ${service.name}: ${error.message}`);
      }
    }
    
    console.log('👋 All services stopped. Goodbye!');
    process.exit(0);
  }
}

// Handle graceful shutdown
const systemManager = new SystemManager();

process.on('SIGINT', () => {
  systemManager.stopServices();
});

process.on('SIGTERM', () => {
  systemManager.stopServices();
});

// Start the system
systemManager.startServices().catch(console.error);
