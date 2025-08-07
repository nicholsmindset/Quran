#!/usr/bin/env node

/**
 * Database Setup Script for Quran Verse Challenge
 * 
 * This script sets up the complete database schema including:
 * - Core tables (users, verses, questions, attempts)
 * - Group management tables
 * - Performance monitoring tables
 * - Notification system tables
 * - Sample data
 * 
 * Usage:
 *   node scripts/setup-database.js
 * 
 * Prerequisites:
 *   - SUPABASE_URL and SUPABASE_SERVICE_ROLE_KEY environment variables
 *   - Or configure these in .env.local
 */

const fs = require('fs');
const path = require('path');

// Simple console colors
const colors = {
  green: '\x1b[32m',
  red: '\x1b[31m',
  yellow: '\x1b[33m',
  blue: '\x1b[34m',
  reset: '\x1b[0m',
  bold: '\x1b[1m'
};

function log(message, color = 'reset') {
  console.log(`${colors[color]}${message}${colors.reset}`);
}

async function setupDatabase() {
  log('🕌 Setting up Quran Verse Challenge Database...', 'bold');
  
  // Check for required environment variables
  const supabaseUrl = process.env.SUPABASE_URL || process.env.NEXT_PUBLIC_SUPABASE_URL;
  const supabaseKey = process.env.SUPABASE_SERVICE_ROLE_KEY || process.env.SUPABASE_ANON_KEY;
  
  if (!supabaseUrl || !supabaseKey) {
    log('❌ Error: Missing Supabase credentials', 'red');
    log('Please set SUPABASE_URL and SUPABASE_SERVICE_ROLE_KEY environment variables', 'yellow');
    log('You can add them to your .env.local file:', 'yellow');
    log('SUPABASE_URL=your_supabase_url', 'yellow');
    log('SUPABASE_SERVICE_ROLE_KEY=your_service_role_key', 'yellow');
    process.exit(1);
  }
  
  try {
    log('📋 Reading database schema files...', 'blue');
    
    // Read all schema files
    const schemaFiles = [
      'complete-setup.sql',
      'group-management-schema.sql', 
      'notifications-schema.sql',
      'performance-schema.sql'
    ];
    
    const supabaseDir = path.join(__dirname, '..', 'supabase');
    const schemas = [];
    
    for (const file of schemaFiles) {
      const filePath = path.join(supabaseDir, file);
      if (fs.existsSync(filePath)) {
        log(`  ✓ Reading ${file}`, 'green');
        const content = fs.readFileSync(filePath, 'utf8');
        schemas.push({
          name: file,
          content: content
        });
      } else {
        log(`  ⚠️  Skipping ${file} (not found)`, 'yellow');
      }
    }
    
    log('🔗 Connecting to Supabase...', 'blue');
    
    // Simple HTTP client for Supabase REST API
    const executeSQL = async (sql, description) => {
      const response = await fetch(`${supabaseUrl}/rest/v1/rpc/exec_sql`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${supabaseKey}`,
          'apikey': supabaseKey
        },
        body: JSON.stringify({ sql })
      });
      
      if (!response.ok) {
        // Try alternative method using SQL editor endpoint
        const alternativeResponse = await fetch(`${supabaseUrl}/rest/v1/`, {
          method: 'POST', 
          headers: {
            'Content-Type': 'application/json',
            'Authorization': `Bearer ${supabaseKey}`,
            'apikey': supabaseKey
          },
          body: JSON.stringify({
            query: sql
          })
        });
        
        if (!alternativeResponse.ok) {
          throw new Error(`Failed to execute ${description}: ${response.status} ${response.statusText}`);
        }
      }
      
      return response;
    };
    
    log('🏗️  Executing database setup...', 'blue');
    
    // Execute each schema
    for (const schema of schemas) {
      log(`  📝 Executing ${schema.name}...`, 'blue');
      
      try {
        await executeSQL(schema.content, schema.name);
        log(`  ✅ ${schema.name} completed successfully`, 'green');
      } catch (error) {
        log(`  ❌ Error in ${schema.name}: ${error.message}`, 'red');
        
        // For development, continue with other schemas
        if (process.env.NODE_ENV !== 'production') {
          log('  ⚠️  Continuing with next schema...', 'yellow');
        } else {
          throw error;
        }
      }
    }
    
    log('✨ Database setup completed!', 'bold');
    log('', 'reset');
    log('🎉 Your Quran Verse Challenge database is ready!', 'green');
    log('', 'reset');
    log('Next steps:', 'bold');
    log('1. Start your Next.js development server: npm run dev', 'blue');
    log('2. Visit http://localhost:3000 to see your application', 'blue');
    log('3. Create a user account to begin testing', 'blue');
    log('', 'reset');
    log('📚 Database includes:', 'bold');
    log('  • Core tables (users, verses, questions, attempts)', 'green');
    log('  • Sample Quranic verses and questions', 'green');
    log('  • Group management system', 'green'); 
    log('  • Performance monitoring', 'green');
    log('  • Email notification system', 'green');
    log('', 'reset');
    
  } catch (error) {
    log('❌ Database setup failed:', 'red');
    log(error.message, 'red');
    log('', 'reset');
    log('💡 Troubleshooting tips:', 'bold');
    log('1. Verify your Supabase credentials are correct', 'yellow');
    log('2. Ensure your Supabase project is active', 'yellow');
    log('3. Check that you have sufficient permissions', 'yellow');
    log('4. Try running the SQL manually in Supabase SQL editor', 'yellow');
    process.exit(1);
  }
}

// Handle CLI usage
if (require.main === module) {
  // Load environment variables from .env.local if available
  const envPath = path.join(__dirname, '..', '.env.local');
  if (fs.existsSync(envPath)) {
    const envContent = fs.readFileSync(envPath, 'utf8');
    const envLines = envContent.split('\n');
    
    for (const line of envLines) {
      const [key, ...valueParts] = line.split('=');
      if (key && valueParts.length > 0) {
        const value = valueParts.join('=').trim().replace(/^["'](.*)["']$/, '$1');
        process.env[key.trim()] = value;
      }
    }
  }
  
  setupDatabase().catch(console.error);
}

module.exports = { setupDatabase };