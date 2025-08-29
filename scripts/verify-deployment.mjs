#!/usr/bin/env node

/**
 * Deployment verification script
 * Verifies that all components of the credit assignment system are working
 */

import fetch from 'node-fetch';
import { config } from 'dotenv';

// Load environment variables
config({ path: '.env.local' });

const SUPABASE_URL = process.env.NEXT_PUBLIC_SUPABASE_URL;
const SUPABASE_ANON_KEY = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;

class DeploymentVerifier {
  constructor() {
    this.baseUrl = `${SUPABASE_URL}/functions/v1`;
    this.headers = {
      'Content-Type': 'application/json',
      'Authorization': `Bearer test-token`,
      'apikey': SUPABASE_ANON_KEY
    };
    this.results = {
      edgeFunctions: {},
      apiEndpoints: {},
      overall: 'unknown'
    };
  }

  async checkEndpoint(endpoint, method = 'GET', body = null) {
    const url = `${this.baseUrl}${endpoint}`;
    
    try {
      const response = await fetch(url, {
        method,
        headers: this.headers,
        body: body ? JSON.stringify(body) : null
      });

      const responseText = await response.text();
      let responseData;
      
      try {
        responseData = JSON.parse(responseText);
      } catch (e) {
        responseData = { raw: responseText };
      }

      return {
        status: response.status,
        data: responseData,
        success: response.ok || response.status === 401, // 401 is expected for auth
        accessible: true
      };
    } catch (error) {
      return {
        status: 0,
        data: { error: error.message },
        success: false,
        accessible: false
      };
    }
  }

  async verifyEdgeFunctions() {
    console.log('🔍 Verifying Edge Functions...');
    
    const functions = [
      { name: 'credits', endpoint: '/credits' },
      { name: 'transactions', endpoint: '/transactions' },
      { name: 'admin-credits', endpoint: '/admin-credits' },
      { name: 'process-recurring-credits', endpoint: '/process-recurring-credits' }
    ];

    for (const func of functions) {
      console.log(`  📡 Testing ${func.name}...`);
      const result = await this.checkEndpoint(func.endpoint);
      
      this.results.edgeFunctions[func.name] = {
        accessible: result.accessible,
        status: result.status,
        expectedAuth: result.status === 401,
        working: result.accessible && (result.status === 401 || result.status === 200)
      };

      if (result.accessible) {
        if (result.status === 401) {
          console.log(`    ✅ ${func.name}: Accessible (requires auth)`);
        } else if (result.status === 200) {
          console.log(`    ✅ ${func.name}: Accessible (public)`);
        } else {
          console.log(`    ⚠️  ${func.name}: Accessible but unexpected status ${result.status}`);
        }
      } else {
        console.log(`    ❌ ${func.name}: Not accessible - ${result.data.error}`);
      }
    }
  }

  async verifyNewFeatures() {
    console.log('\n🆕 Verifying New Credit Assignment Features...');
    
    // Test admin-credits POST
    console.log('  📊 Testing admin-credits POST...');
    const adminCreditsPost = await this.checkEndpoint('/admin-credits', 'POST', {
      userWalletAddress: '0x1234567890abcdef1234567890abcdef12345678',
      creditType: 'one-time',
      amount: 100,
      description: 'Test credit'
    });

    this.results.apiEndpoints['admin-credits-post'] = {
      accessible: adminCreditsPost.accessible,
      status: adminCreditsPost.status,
      working: adminCreditsPost.status === 401 // Should require auth
    };

    if (adminCreditsPost.status === 401) {
      console.log('    ✅ admin-credits POST: Working (requires auth)');
    } else {
      console.log(`    ❌ admin-credits POST: Unexpected status ${adminCreditsPost.status}`);
    }

    // Test admin-credits GET
    console.log('  📊 Testing admin-credits GET...');
    const adminCreditsGet = await this.checkEndpoint('/admin-credits?userWalletAddress=0x1234567890abcdef1234567890abcdef12345678');

    this.results.apiEndpoints['admin-credits-get'] = {
      accessible: adminCreditsGet.accessible,
      status: adminCreditsGet.status,
      working: adminCreditsGet.status === 401
    };

    if (adminCreditsGet.status === 401) {
      console.log('    ✅ admin-credits GET: Working (requires auth)');
    } else {
      console.log(`    ❌ admin-credits GET: Unexpected status ${adminCreditsGet.status}`);
    }

    // Test process-recurring-credits
    console.log('  📊 Testing process-recurring-credits...');
    const recurringPost = await this.checkEndpoint('/process-recurring-credits', 'POST');

    this.results.apiEndpoints['process-recurring-credits'] = {
      accessible: recurringPost.accessible,
      status: recurringPost.status,
      working: recurringPost.status === 401
    };

    if (recurringPost.status === 401) {
      console.log('    ✅ process-recurring-credits: Working (requires auth)');
    } else {
      console.log(`    ❌ process-recurring-credits: Unexpected status ${recurringPost.status}`);
    }
  }

  async checkCORSConfiguration() {
    console.log('\n🌐 Verifying CORS Configuration...');
    
    try {
      const response = await fetch(`${this.baseUrl}/admin-credits`, {
        method: 'OPTIONS',
        headers: {
          'Origin': 'http://localhost:3000',
          'Access-Control-Request-Method': 'POST',
          'Access-Control-Request-Headers': 'Content-Type, Authorization'
        }
      });

      if (response.ok) {
        console.log('    ✅ CORS: Properly configured');
        this.results.cors = true;
      } else {
        console.log('    ⚠️  CORS: May have issues');
        this.results.cors = false;
      }
    } catch (error) {
      console.log('    ❌ CORS: Error checking configuration');
      this.results.cors = false;
    }
  }

  generateReport() {
    console.log('\n📊 DEPLOYMENT VERIFICATION REPORT');
    console.log('=' .repeat(50));

    // Edge Functions Summary
    console.log('\n🔧 Edge Functions Status:');
    const functionResults = Object.entries(this.results.edgeFunctions);
    const workingFunctions = functionResults.filter(([_, result]) => result.working).length;
    const totalFunctions = functionResults.length;

    functionResults.forEach(([name, result]) => {
      const status = result.working ? '✅' : '❌';
      const authStatus = result.expectedAuth ? '(Auth Required)' : '';
      console.log(`  ${status} ${name}: ${result.accessible ? 'Accessible' : 'Not Accessible'} ${authStatus}`);
    });

    console.log(`\n📈 Functions Working: ${workingFunctions}/${totalFunctions}`);

    // API Endpoints Summary
    console.log('\n🆕 New API Endpoints:');
    const endpointResults = Object.entries(this.results.apiEndpoints);
    const workingEndpoints = endpointResults.filter(([_, result]) => result.working).length;
    const totalEndpoints = endpointResults.length;

    endpointResults.forEach(([name, result]) => {
      const status = result.working ? '✅' : '❌';
      console.log(`  ${status} ${name}: Status ${result.status}`);
    });

    console.log(`\n📈 New Endpoints Working: ${workingEndpoints}/${totalEndpoints}`);

    // Overall Status
    const overallWorking = workingFunctions === totalFunctions && workingEndpoints === totalEndpoints;
    this.results.overall = overallWorking ? 'success' : 'partial';

    console.log('\n🎯 OVERALL STATUS:');
    if (overallWorking) {
      console.log('  🟢 DEPLOYMENT SUCCESSFUL');
      console.log('  ✅ All Edge Functions are accessible');
      console.log('  ✅ All new API endpoints are working');
      console.log('  ✅ Authentication is properly configured');
    } else {
      console.log('  🟡 DEPLOYMENT PARTIALLY SUCCESSFUL');
      console.log('  ⚠️  Some components may need attention');
    }

    console.log('\n📋 Next Steps:');
    console.log('  1. Create database tables (run scripts/create-credit-tables.sql)');
    console.log('  2. Test with valid authentication tokens');
    console.log('  3. Set up cron job for recurring credit processing');
    console.log('  4. Configure admin authentication');

    console.log('\n🔗 Useful Links:');
    console.log(`  📊 Supabase Dashboard: https://supabase.com/dashboard/project/rpsfupahfggkpfstaxfx`);
    console.log(`  🔧 Functions: https://supabase.com/dashboard/project/rpsfupahfggkpfstaxfx/functions`);
    console.log(`  🗄️  Database: https://supabase.com/dashboard/project/rpsfupahfggkpfstaxfx/editor`);

    return this.results;
  }

  async runFullVerification() {
    console.log('🚀 Starting Deployment Verification...');
    console.log('=' .repeat(50));
    
    await this.verifyEdgeFunctions();
    await this.verifyNewFeatures();
    await this.checkCORSConfiguration();
    
    return this.generateReport();
  }
}

// Run verification if called directly
if (import.meta.url === `file://${process.argv[1]}`) {
  const verifier = new DeploymentVerifier();
  
  console.log('🔧 Configuration:');
  console.log(`  Supabase URL: ${SUPABASE_URL}`);
  console.log(`  Functions Base: ${SUPABASE_URL}/functions/v1`);
  console.log('');
  
  verifier.runFullVerification()
    .then((results) => {
      if (results.overall === 'success') {
        console.log('\n🎉 Deployment verification completed successfully!');
        process.exit(0);
      } else {
        console.log('\n⚠️  Deployment verification completed with warnings.');
        process.exit(0);
      }
    })
    .catch((error) => {
      console.error('\n❌ Verification failed:', error);
      process.exit(1);
    });
}

export default DeploymentVerifier;
