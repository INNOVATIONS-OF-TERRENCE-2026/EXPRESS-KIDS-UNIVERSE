/**
 * PWA Icon Generator for Express Kids Universe
 * 
 * This script generates all required PWA icon sizes from the source SVG.
 * Run: node scripts/generate-pwa-icons.mjs
 * 
 * If you have the actual logo PNG, place it at:
 *   public/logo-source.png (at least 512x512)
 * and update SOURCE below to use it instead of the SVG.
 */

import sharp from 'sharp';
import { existsSync, mkdirSync } from 'fs';
import { join, dirname } from 'path';
import { fileURLToPath } from 'url';

const __dirname = dirname(fileURLToPath(import.meta.url));
const PUBLIC_DIR = join(__dirname, '..', 'public');

// Prefer PNG logo if available, else use SVG
const PNG_SOURCE = join(PUBLIC_DIR, 'logo-source.png');
const BRAND_LOGO = join(PUBLIC_DIR, 'brand', 'express-kids-universe-logo.png');

const ICONS = [
  { name: 'favicon-16x16.png', size: 16 },
  { name: 'favicon-32x32.png', size: 32 },
  { name: 'apple-touch-icon.png', size: 180 },
  { name: 'icon-192.png', size: 192 },
  { name: 'icon-512.png', size: 512 },
  { name: 'icon-192-maskable.png', size: 192, maskable: true },
  { name: 'icon-512-maskable.png', size: 512, maskable: true },
];

async function generateIcons() {
  let source;
  
  if (existsSync(PNG_SOURCE)) {
    console.log('✅ Using PNG source:', PNG_SOURCE);
    source = sharp(PNG_SOURCE);
  } else if (existsSync(BRAND_LOGO)) {
    console.log('✅ Using brand logo:', BRAND_LOGO);
    source = sharp(BRAND_LOGO);
  } else {
    console.error('❌ No source icon found. Place logo-source.png in public/ or brand logo in public/brand/');
    process.exit(1);
  }

  for (const icon of ICONS) {
    const outputPath = join(PUBLIC_DIR, icon.name);
    
    if (icon.maskable) {
      // Maskable icons need 10% safe zone padding (icon shrunk to 80% with bg)
      const padding = Math.round(icon.size * 0.1);
      const innerSize = icon.size - (padding * 2);
      
      const resizedBuffer = await source
        .clone()
        .resize(innerSize, innerSize, { fit: 'contain', background: { r: 13, g: 10, b: 46, alpha: 1 } })
        .toBuffer();

      await sharp({
        create: {
          width: icon.size,
          height: icon.size,
          channels: 4,
          background: { r: 13, g: 10, b: 46, alpha: 1 }, // --eku-bg color
        }
      })
        .composite([{ input: resizedBuffer, gravity: 'center' }])
        .png()
        .toFile(outputPath);
    } else {
      await source
        .clone()
        .resize(icon.size, icon.size, { fit: 'contain', background: { r: 13, g: 10, b: 46, alpha: 1 } })
        .png()
        .toFile(outputPath);
    }

    console.log(`  ✨ Generated ${icon.name} (${icon.size}x${icon.size}${icon.maskable ? ' maskable' : ''})`);
  }

  // Generate favicon.ico from 32x32 (just copy the 32x32 PNG as favicon)
  await source
    .clone()
    .resize(32, 32, { fit: 'contain', background: { r: 13, g: 10, b: 46, alpha: 1 } })
    .png()
    .toFile(join(PUBLIC_DIR, 'favicon.ico'));
  
  console.log('  ✨ Generated favicon.ico');
  console.log('\n🚀 All PWA icons generated successfully!');
  console.log('\n💡 TIP: For best results, place your actual logo at public/logo-source.png');
  console.log('   (minimum 512x512 PNG) and re-run this script.\n');
}

generateIcons().catch(console.error);
