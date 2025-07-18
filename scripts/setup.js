#!/usr/bin/env node

/**
 * Setup script for Dairy Delivery PWA
 * Run with: node scripts/setup.js
 */

const fs = require('fs');
const path = require('path');

console.log('🥛 Dairy Friend PWA Setup');
console.log('============================\n');

// Check Node version
const nodeVersion = process.version;
const requiredVersion = 'v18.17.0';
console.log(`📋 Checking Node.js version: ${nodeVersion}`);

if (nodeVersion < requiredVersion) {
  console.error(`❌ Error: Node.js ${requiredVersion} or higher required. Current: ${nodeVersion}`);
  console.log('   Please update Node.js: https://nodejs.org/');
  process.exit(1);
}
console.log('✅ Node.js version is compatible\n');

// Check if dependencies are installed
const packageJsonPath = path.join(process.cwd(), 'package.json');
const nodeModulesPath = path.join(process.cwd(), 'node_modules');

if (!fs.existsSync(nodeModulesPath)) {
  console.log('📦 Dependencies not found. Please run:');
  console.log('   npm install\n');
  process.exit(0);
}
console.log('✅ Dependencies are installed\n');

// Check for required icon files
const iconSizes = ['192x192', '256x256', '384x384', '512x512'];
const missingIcons = [];

iconSizes.forEach(size => {
  const iconPath = path.join(process.cwd(), 'public', `icon-${size}.png`);
  if (!fs.existsSync(iconPath)) {
    missingIcons.push(`icon-${size}.png`);
  }
});

if (missingIcons.length > 0) {
  console.log('⚠️  PWA Icons Missing:');
  missingIcons.forEach(icon => {
    console.log(`   - public/${icon}`);
  });
  console.log('\n📝 To fix this:');
  console.log('   1. Create app icons in the required sizes');
  console.log('   2. Save them as PNG files in the public/ directory');
  console.log('   3. Use your dairy business logo or a milk icon');
  console.log('   4. Recommended tool: https://realfavicongenerator.net/\n');
} else {
  console.log('✅ All PWA icons are present\n');
}

// Create .env.local if it doesn't exist
const envPath = path.join(process.cwd(), '.env.local');
if (!fs.existsSync(envPath)) {
  const envContent = `# Dairy Friend PWA - Local Environment
NEXT_PUBLIC_APP_NAME="Dairy Friend"
NEXT_PUBLIC_LOAD_DEMO_DATA="false"
NEXT_PUBLIC_CURRENCY_SYMBOL="₹"
NEXT_PUBLIC_TIMEZONE="Asia/Kolkata"
`;
  
  try {
    fs.writeFileSync(envPath, envContent);
    console.log('✅ Created .env.local with default configuration\n');
  } catch (error) {
    console.log('⚠️  Could not create .env.local file\n');
  }
} else {
  console.log('✅ Environment configuration exists\n');
}

// Instructions
console.log('🚀 Setup Complete! Next steps:');
console.log('');
console.log('1. Start the development server:');
console.log('   npm run dev');
console.log('');
console.log('2. Open your browser:');
console.log('   http://localhost:3000');
console.log('');
console.log('3. Add your first customer and subscription');
console.log('');
console.log('📱 For PWA features (install to home screen):');
console.log('   - Deploy to Vercel or another HTTPS host');
console.log('   - Add the missing icon files mentioned above');
console.log('');
console.log('📖 Need help? Check the README.md file');
console.log('');
console.log('Happy dairy business management! 🥛');

// Optional: Load demo data
const readline = require('readline');
const rl = readline.createInterface({
  input: process.stdin,
  output: process.stdout
});

rl.question('Would you like to load demo data for testing? (y/N): ', (answer) => {
  if (answer.toLowerCase() === 'y' || answer.toLowerCase() === 'yes') {
    console.log('\n📝 Demo data will be loaded on first app launch.');
    console.log('   You can disable this by setting NEXT_PUBLIC_LOAD_DEMO_DATA="false" in .env.local\n');
    
    // Update .env.local to enable demo data
    let envContent = fs.readFileSync(envPath, 'utf8');
    envContent = envContent.replace(
      'NEXT_PUBLIC_LOAD_DEMO_DATA="false"',
      'NEXT_PUBLIC_LOAD_DEMO_DATA="true"'
    );
    fs.writeFileSync(envPath, envContent);
  } else {
    console.log('\n📝 Demo data will not be loaded. You can start with a fresh app.\n');
  }
  
  rl.close();
}); 