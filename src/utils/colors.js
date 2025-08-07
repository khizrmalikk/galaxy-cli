import chalk from 'chalk';

export function previewColorPalette(palette) {
  console.log('\n' + chalk.bold('🎨 Your Theme:'));
  console.log('━'.repeat(40));
  
  Object.entries(palette).forEach(([name, hex]) => {
    const preview = '██████';
    console.log(
      `${name.padEnd(12)} ${chalk.hex(hex)(preview)} ${hex}`
    );
  });
}

export function generateComplementaryColors(baseColor) {
  // Simple complementary color generation
  // In a real implementation, you'd use a proper color theory library
  const hex = baseColor.replace('#', '');
  const r = parseInt(hex.substr(0, 2), 16);
  const g = parseInt(hex.substr(2, 2), 16);
  const b = parseInt(hex.substr(4, 2), 16);
  
  // Generate complementary color
  const compR = 255 - r;
  const compG = 255 - g;
  const compB = 255 - b;
  
  const toHex = (n) => n.toString(16).padStart(2, '0');
  
  return {
    primary: baseColor,
    secondary: `#${toHex(compR)}${toHex(compG)}${toHex(compB)}`,
    accent: `#${toHex(Math.min(255, r + 30))}${toHex(Math.min(255, g + 30))}${toHex(Math.min(255, b + 30))}`,
    background: r + g + b > 382 ? '#FFFFFF' : '#0F172A',
    foreground: r + g + b > 382 ? '#1F2937' : '#F1F5F9',
    muted: '#9CA3AF',
    success: '#10B981',
    warning: '#F59E0B',
    error: '#EF4444'
  };
}
