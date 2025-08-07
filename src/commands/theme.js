import { Command } from 'commander';
import inquirer from 'inquirer';
import chalk from 'chalk';
import fs from 'fs-extra';
import path from 'path';
import ora from 'ora';
import { themePresets } from '../themes/presets.js';
import { validateHexColor } from '../utils/validation.js';
import { previewColorPalette, generateComplementaryColors } from '../utils/colors.js';

export const themeCommand = new Command('theme')
  .description('Generate and preview color themes')
  .option('-p, --preview', 'Preview current theme')
  .option('-g, --generate', 'Generate a new theme')
  .option('-l, --list', 'List available preset themes')
  .option('-a, --apply <preset>', 'Apply a preset theme')
  .action(async (options) => {
    if (options.list) {
      await listPresets();
    } else if (options.apply) {
      await applyPreset(options.apply);
    } else if (options.preview) {
      await previewCurrentTheme();
    } else {
      await generateNewTheme();
    }
  });

async function listPresets() {
  console.log('\n' + chalk.bold('🎨 Available Theme Presets:'));
  console.log('━'.repeat(50));
  
  for (const [name, palette] of Object.entries(themePresets)) {
    console.log('\n' + chalk.bold(`${name.charAt(0).toUpperCase() + name.slice(1)} Theme:`));
    
    // Show primary colors only for list view
    const primaryColors = ['primary', 'secondary', 'accent'];
    primaryColors.forEach(colorName => {
      const hex = palette[colorName];
      const preview = '████';
      console.log(
        `  ${colorName.padEnd(10)} ${chalk.hex(hex)(preview)} ${hex}`
      );
    });
  }
  
  console.log('\n' + chalk.dim('Use "galaxy theme --apply <preset>" to apply a theme'));
}

async function applyPreset(presetName) {
  const configPath = path.join(process.cwd(), 'src/config/galaxy.config.ts');
  
  if (!await fs.pathExists(configPath)) {
    console.error(chalk.red('Not in a Galaxy project directory'));
    console.log(chalk.yellow('Run "galaxy init" first to initialize your project'));
    process.exit(1);
  }
  
  const preset = themePresets[presetName.toLowerCase()];
  
  if (!preset) {
    console.error(chalk.red(`Unknown preset: ${presetName}`));
    console.log(chalk.yellow('Available presets: ' + Object.keys(themePresets).join(', ')));
    process.exit(1);
  }
  
  const spinner = ora('Applying theme...').start();
  
  try {
    let content = await fs.readFile(configPath, 'utf-8');
    
    // Update color palette
    const paletteStr = `colorPalette: {
    primary: '${preset.primary}',
    secondary: '${preset.secondary}',
    accent: '${preset.accent}',
    background: '${preset.background}',
    foreground: '${preset.foreground}',
    muted: '${preset.muted}',
    success: '${preset.success}',
    warning: '${preset.warning}',
    error: '${preset.error}',
  }`;
    
    content = content.replace(
      /colorPalette:\s*{[\s\S]*?}/,
      paletteStr
    );
    
    await fs.writeFile(configPath, content);
    
    spinner.succeed(chalk.green(`Applied ${presetName} theme successfully!`));
    
    // Preview the applied theme
    previewColorPalette(preset);
    
  } catch (error) {
    spinner.fail(chalk.red('Failed to apply theme'));
    console.error(chalk.red('Error:'), error.message);
    process.exit(1);
  }
}

async function previewCurrentTheme() {
  const configPath = path.join(process.cwd(), 'src/config/galaxy.config.ts');
  
  if (!await fs.pathExists(configPath)) {
    console.error(chalk.red('Not in a Galaxy project directory'));
    console.log(chalk.yellow('Run "galaxy init" first to initialize your project'));
    process.exit(1);
  }
  
  try {
    const configContent = await fs.readFile(configPath, 'utf-8');
    
    // Extract colors from config
    const colorRegex = /(\w+):\s*['"]#([A-Fa-f0-9]{6})['"]/g;
    const colors = {};
    let match;
    
    while ((match = colorRegex.exec(configContent)) !== null) {
      const [, name, hex] = match;
      colors[name] = `#${hex}`;
    }
    
    if (Object.keys(colors).length === 0) {
      console.error(chalk.yellow('No color palette found in configuration'));
      process.exit(1);
    }
    
    previewColorPalette(colors);
    
    // Show CSS variables example
    console.log('\n' + chalk.bold('📝 CSS Variables:'));
    console.log(chalk.dim('Add these to your global CSS:'));
    console.log('━'.repeat(40));
    console.log(chalk.gray(':root {'));
    Object.entries(colors).forEach(([name, hex]) => {
      console.log(chalk.gray(`  --color-${name}: ${hex};`));
    });
    console.log(chalk.gray('}'));
    
  } catch (error) {
    console.error(chalk.red('Error reading configuration:'), error.message);
    process.exit(1);
  }
}

async function generateNewTheme() {
  const answers = await inquirer.prompt([
    {
      type: 'list',
      name: 'method',
      message: 'How would you like to generate your theme?',
      choices: [
        { name: '🎨 From preset', value: 'preset' },
        { name: '🎯 From base color', value: 'base' },
        { name: '✏️ Manual selection', value: 'manual' },
        { name: '🎲 Random theme', value: 'random' }
      ]
    }
  ]);
  
  let palette;
  
  switch (answers.method) {
    case 'preset':
      const { preset } = await inquirer.prompt([
        {
          type: 'list',
          name: 'preset',
          message: 'Choose a preset:',
          choices: Object.keys(themePresets).map(key => ({
            name: key.charAt(0).toUpperCase() + key.slice(1),
            value: key
          }))
        }
      ]);
      palette = themePresets[preset];
      break;
      
    case 'base':
      const { baseColor, mode } = await inquirer.prompt([
        {
          type: 'input',
          name: 'baseColor',
          message: 'Enter your base color (hex):',
          default: '#3B82F6',
          validate: validateHexColor,
          filter: (input) => input.startsWith('#') ? input : '#' + input
        },
        {
          type: 'list',
          name: 'mode',
          message: 'Light or dark mode?',
          choices: ['light', 'dark']
        }
      ]);
      
      palette = generateComplementaryColors(baseColor);
      
      // Adjust for dark mode
      if (mode === 'dark') {
        palette.background = '#0F172A';
        palette.foreground = '#F1F5F9';
      }
      break;
      
    case 'manual':
      const colors = await inquirer.prompt([
        {
          type: 'input',
          name: 'primary',
          message: 'Primary color (hex):',
          default: '#3B82F6',
          validate: validateHexColor,
          filter: (input) => input.startsWith('#') ? input : '#' + input
        },
        {
          type: 'input',
          name: 'secondary',
          message: 'Secondary color (hex):',
          default: '#8B5CF6',
          validate: validateHexColor,
          filter: (input) => input.startsWith('#') ? input : '#' + input
        },
        {
          type: 'input',
          name: 'accent',
          message: 'Accent color (hex):',
          default: '#F59E0B',
          validate: validateHexColor,
          filter: (input) => input.startsWith('#') ? input : '#' + input
        },
        {
          type: 'list',
          name: 'mode',
          message: 'Light or dark mode?',
          choices: ['light', 'dark']
        }
      ]);
      
      palette = {
        primary: colors.primary,
        secondary: colors.secondary,
        accent: colors.accent,
        background: colors.mode === 'dark' ? '#0F172A' : '#FFFFFF',
        foreground: colors.mode === 'dark' ? '#F1F5F9' : '#1F2937',
        muted: '#9CA3AF',
        success: '#10B981',
        warning: '#F59E0B',
        error: '#EF4444'
      };
      break;
      
    case 'random':
      // Generate random colors
      const randomHex = () => {
        const hex = Math.floor(Math.random() * 16777215).toString(16);
        return '#' + hex.padStart(6, '0');
      };
      
      const baseRandom = randomHex();
      palette = generateComplementaryColors(baseRandom);
      console.log(chalk.yellow(`Generated from random base: ${baseRandom}`));
      break;
  }
  
  // Display generated theme
  console.log('\n' + chalk.bold('Generated Theme:'));
  console.log('━'.repeat(40));
  previewColorPalette(palette);
  
  // Ask if user wants to apply it
  const { apply } = await inquirer.prompt([
    {
      type: 'confirm',
      name: 'apply',
      message: 'Apply this theme to your project?',
      default: true
    }
  ]);
  
  if (apply) {
    const configPath = path.join(process.cwd(), 'src/config/galaxy.config.ts');
    
    if (!await fs.pathExists(configPath)) {
      console.error(chalk.yellow('No Galaxy configuration found.'));
      console.log(chalk.dim('Run "galaxy init" first to initialize your project'));
      return;
    }
    
    const spinner = ora('Applying theme...').start();
    
    try {
      let content = await fs.readFile(configPath, 'utf-8');
      
      // Update color palette
      const paletteStr = `colorPalette: {
    primary: '${palette.primary}',
    secondary: '${palette.secondary}',
    accent: '${palette.accent}',
    background: '${palette.background}',
    foreground: '${palette.foreground}',
    muted: '${palette.muted}',
    success: '${palette.success}',
    warning: '${palette.warning}',
    error: '${palette.error}',
  }`;
      
      content = content.replace(
        /colorPalette:\s*{[\s\S]*?}/,
        paletteStr
      );
      
      await fs.writeFile(configPath, content);
      
      spinner.succeed(chalk.green('Theme applied successfully!'));
      
      // Save as custom preset
      const { saveName } = await inquirer.prompt([
        {
          type: 'input',
          name: 'saveName',
          message: 'Save this theme as a preset? (leave empty to skip)',
          validate: (input) => {
            if (!input) return true;
            if (!/^[a-z0-9-]+$/.test(input)) {
              return 'Preset name can only contain lowercase letters, numbers, and hyphens';
            }
            return true;
          }
        }
      ]);
      
      if (saveName) {
        // Save to a custom presets file
        const customPresetsPath = path.join(process.cwd(), '.galaxy/themes.json');
        await fs.ensureDir(path.join(process.cwd(), '.galaxy'));
        
        let customPresets = {};
        if (await fs.pathExists(customPresetsPath)) {
          customPresets = await fs.readJson(customPresetsPath);
        }
        
        customPresets[saveName] = palette;
        await fs.writeJson(customPresetsPath, customPresets, { spaces: 2 });
        
        console.log(chalk.green(`✓ Theme saved as "${saveName}"`));
        console.log(chalk.dim(`Use "galaxy theme --apply ${saveName}" to apply it later`));
      }
      
    } catch (error) {
      spinner.fail(chalk.red('Failed to apply theme'));
      console.error(chalk.red('Error:'), error.message);
    }
  }
  
  // Export theme
  const { exportTheme } = await inquirer.prompt([
    {
      type: 'confirm',
      name: 'exportTheme',
      message: 'Export theme as JSON?',
      default: false
    }
  ]);
  
  if (exportTheme) {
    const themePath = path.join(process.cwd(), 'galaxy-theme.json');
    await fs.writeJson(themePath, palette, { spaces: 2 });
    console.log(chalk.green(`✓ Theme exported to ${themePath}`));
  }
}
