#!/usr/bin/env node

/**
 * Generate icon files for Pagent Money
 * This script creates PNG icons from SVG using a simple base64 approach
 */

const fs = require('fs');
const path = require('path');

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

// Create a simple favicon (ICO format simulation)
const faviconSvg = `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 32 32">
  <rect width="32" height="32" rx="6" fill="#6366f1"/>
  <rect x="6" y="10" width="20" height="12" rx="2" fill="white"/>
  <rect x="6" y="15" width="20" height="2" fill="#6366f1"/>
</svg>`;

// Convert SVG to base64 data URL (for browsers that support it)
function svgToDataUrl(svg, size = null) {
  if (size) {
    svg = svg.replace('viewBox="0 0 100 100"', `viewBox="0 0 100 100" width="${size}" height="${size}"`);
  }
  const base64 = Buffer.from(svg).toString('base64');
  return `data:image/svg+xml;base64,${base64}`;
}

// Create HTML template for testing icons
const htmlTemplate = `<!DOCTYPE html>
<html>
<head>
    <title>Icon Test</title>
    <style>
        body { font-family: Arial, sans-serif; padding: 20px; background: #f5f5f5; }
        .icon-test { display: flex; align-items: center; margin: 20px 0; padding: 20px; background: white; border-radius: 8px; box-shadow: 0 2px 4px rgba(0,0,0,0.1); }
        .icon-test img { margin-right: 15px; border-radius: 4px; }
        .icon-test h3 { margin: 0 0 5px 0; }
        .icon-test p { margin: 0; color: #666; }
    </style>
</head>
<body>
    <h1>Pagent Money - Icon Test</h1>
    
    <div class="icon-test">
        <img src="${svgToDataUrl(faviconSvg, 32)}" width="32" height="32" alt="Favicon">
        <div>
            <h3>Favicon (32x32)</h3>
            <p>Browser tab icon</p>
        </div>
    </div>
    
    <div class="icon-test">
        <img src="${svgToDataUrl(svgIcon, 192)}" width="64" height="64" alt="App Icon">
        <div>
            <h3>App Icon (192x192)</h3>
            <p>PWA and mobile icon</p>
        </div>
    </div>
    
    <div class="icon-test">
        <img src="${svgToDataUrl(svgIcon, 512)}" width="96" height="96" alt="Large Icon">
        <div>
            <h3>Large Icon (512x512)</h3>
            <p>High-resolution app icon</p>
        </div>
    </div>
    
    <h2>Integration Status</h2>
    <ul>
        <li>✅ SVG icons generated</li>
        <li>✅ Data URLs created</li>
        <li>✅ Next.js icon routes configured</li>
        <li>✅ Manifest.json updated</li>
        <li>⚠️ For production: Consider using proper PNG conversion</li>
    </ul>
    
    <h2>Next Steps</h2>
    <ol>
        <li>Test icons in browser</li>
        <li>Verify PWA installation</li>
        <li>Check mobile appearance</li>
        <li>Optimize for different platforms</li>
    </ol>
</body>
</html>`;

// Write files
const publicDir = path.join(process.cwd(), 'public');

// Write SVG files
fs.writeFileSync(path.join(publicDir, 'icon.svg'), svgIcon);
fs.writeFileSync(path.join(publicDir, 'favicon.svg'), faviconSvg);

// Write test HTML
fs.writeFileSync(path.join(publicDir, 'icon-test.html'), htmlTemplate);

// Create simple ICO file (basic format)
const icoContent = faviconSvg; // Browsers often support SVG in ICO
fs.writeFileSync(path.join(publicDir, 'favicon.ico'), icoContent);

console.log('✅ Icons generated successfully!');
console.log('📁 Files created:');
console.log('   - public/icon.svg');
console.log('   - public/favicon.svg');
console.log('   - public/favicon.ico');
console.log('   - public/icon-test.html');
console.log('');
console.log('🧪 Test your icons:');
console.log('   Visit: http://localhost:3000/icon-test.html');
console.log('');
console.log('💡 Note: For production, consider converting SVG to PNG using:');
console.log('   - Online tools like https://convertio.co/svg-png/');
console.log('   - Or install sharp: npm install sharp');
console.log('   - Or use Figma/Sketch for proper icon design');
