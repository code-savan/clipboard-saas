const sharp = require('sharp');
const fs = require('fs').promises;
const path = require('path');
const toIco = require('png-to-ico');

const sizes = [
  16, // favicon
  32, // favicon
  72, // pwa icon
  96, // pwa icon
  128, // pwa icon
  144, // pwa icon
  152, // pwa icon
  180, // apple touch icon
  192, // pwa icon
  384, // pwa icon
  512, // pwa icon
];

async function generateIcons() {
  const inputSvg = path.join(__dirname, '../public/icons/icon.svg');
  const outputDir = path.join(__dirname, '../public/icons');

  // Ensure the output directory exists
  await fs.mkdir(outputDir, { recursive: true });

  // Generate PNG icons for all sizes
  for (const size of sizes) {
    const outputPath = path.join(outputDir, `icon-${size}x${size}.png`);
    await sharp(inputSvg)
      .resize(size, size)
      .png()
      .toFile(outputPath);
    console.log(`Generated ${size}x${size} icon`);
  }

  // Generate special icons
  // Favicon 16x16
  const favicon16Path = path.join(outputDir, 'favicon-16x16.png');
  await sharp(inputSvg)
    .resize(16, 16)
    .png()
    .toFile(favicon16Path);

  // Favicon 32x32
  const favicon32Path = path.join(outputDir, 'favicon-32x32.png');
  await sharp(inputSvg)
    .resize(32, 32)
    .png()
    .toFile(favicon32Path);

  // Apple Touch Icon (180x180)
  await sharp(inputSvg)
    .resize(180, 180)
    .png()
    .toFile(path.join(outputDir, 'apple-touch-icon.png'));

  // Generate ICO file from the PNG files
  try {
    const pngBuffers = await Promise.all([
      fs.readFile(favicon16Path),
      fs.readFile(favicon32Path)
    ]);

    const icoBuffer = await toIco(pngBuffers);
    await fs.writeFile(path.join(outputDir, 'favicon.ico'), icoBuffer);
    console.log('Generated favicon.ico');
  } catch (error) {
    console.error('Error generating favicon.ico:', error);
  }

  console.log('All icons generated successfully!');
}

generateIcons().catch(console.error);
