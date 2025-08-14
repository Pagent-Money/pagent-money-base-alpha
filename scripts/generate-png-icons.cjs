#!/usr/bin/env node

/**
 * Generate PNG icon files for Pagent Money using Sharp
 */

const fs = require('fs');
const path = require('path');
const sharp = require('sharp');

// SVG content for our icon
const svgIcon = `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 100 100">
  <defs>
    <linearGradient id="gradient" x1="0%" y1="0%" x2="100%" y2="100%">
      <stop offset="0%" style="stop-color:#6366f1;stop-opacity:1" />
      <stop offset="50%" style="stop-color:#8b5cf6;stop-opacity:1" />
      <stop offset="100%" style="stop-color:#ec4899;stop-opacity:1" />
    </linearGradient>
  </defs>
  
  <!-- Background -->
  <rect width="100" height="100" rx="20" fill="url(#gradient)"/>
  
  <!-- Credit card shape -->
  <rect x="15" y="25" width="70" height="50" rx="8" fill="white" opacity="0.95"/>
  
  <!-- Card stripe -->
  <rect x="15" y="40" width="70" height="6" fill="url(#gradient)"/>
  
  <!-- Card details -->
  <rect x="20" y="55" width="25" height="3" rx="1.5" fill="#64748b" opacity="0.6"/>
  <rect x="20" y="62" width="35" height="3" rx="1.5" fill="#64748b" opacity="0.6"/>
  
  <!-- Chip -->
  <rect x="60" y="55" width="8" height="6" rx="1" fill="#64748b" opacity="0.3"/>
</svg>`;

// Icon sizes to generate
const iconSizes = [
  { size: 16, name: 'favicon-16x16.png' },
  { size: 32, name: 'favicon-32x32.png' },
  { size: 192, name: 'icon-192x192.png' },
  { size: 512, name: 'icon-512x512.png' },
  { size: 180, name: 'apple-touch-icon.png' },
];

async function generateIcons() {
  const publicDir = path.join(process.cwd(), 'public');
  
  console.log('🎨 Generating PNG icons...');
  
  try {
    for (const { size, name } of iconSizes) {
      const buffer = Buffer.from(svgIcon);
      
      await sharp(buffer)
        .resize(size, size)
        .png({
          quality: 90,
          compressionLevel: 6,
        })
        .toFile(path.join(publicDir, name));
      
      console.log(`✅ Generated ${name} (${size}x${size})`);
    }
    
    // Generate a proper ICO file (using 32x32 PNG)
    const ico32Buffer = Buffer.from(svgIcon);
    await sharp(ico32Buffer)
      .resize(32, 32)
      .png()
      .toFile(path.join(publicDir, 'favicon.ico'));
    
    console.log('✅ Generated favicon.ico');
    
    console.log('');
    console.log('🎉 All icons generated successfully!');
    console.log('📁 Files created in public/:');
    iconSizes.forEach(({ name, size }) => {
      console.log(`   - ${name} (${size}x${size})`);
    });
    console.log('   - favicon.ico (32x32)');
    
  } catch (error) {
    console.error('❌ Error generating icons:', error);
    process.exit(1);
  }
}

generateIcons();
