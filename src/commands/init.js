import { Command } from 'commander';
import inquirer from 'inquirer';
import chalk from 'chalk';
import fs from 'fs-extra';
import path from 'path';
import ora from 'ora';
import { themePresets } from '../themes/presets.js';
import { validateUrl, validateHexColor } from '../utils/validation.js';
import { previewColorPalette, generateComplementaryColors } from '../utils/colors.js';

export const initCommand = new Command('init')
  .description('Initialize existing project as Galaxy app')
  .option('-t, --type <type>', 'App type: core or feature')
  .option('--core <url>', 'Core app URL (for feature apps)')
  .action(async (options) => {
    // Check if already initialized
    const configPath = path.join(process.cwd(), 'src/config/galaxy.config.ts');
    
    if (await fs.pathExists(configPath)) {
      const { overwrite } = await inquirer.prompt([
        {
          type: 'confirm',
          name: 'overwrite',
          message: chalk.yellow('Galaxy config already exists. Overwrite?'),
          default: false
        }
      ]);
      
      if (!overwrite) {
        console.log(chalk.yellow('Initialization cancelled.'));
        process.exit(0);
      }
    }
    
    // Get project name from package.json if exists
    let defaultName = path.basename(process.cwd());
    const packageJsonPath = path.join(process.cwd(), 'package.json');
    
    if (await fs.pathExists(packageJsonPath)) {
      try {
        const packageJson = await fs.readJson(packageJsonPath);
        if (packageJson.name) {
          defaultName = packageJson.name;
        }
      } catch {}
    }
    
    // Gather information
    const answers = await inquirer.prompt([
      {
        type: 'list',
        name: 'type',
        message: 'What type of app is this?',
        choices: [
          { name: '🌌 Core App (Galaxy Center)', value: 'core' },
          { name: '🪐 Feature App (Planet)', value: 'feature' }
        ],
        when: !options.type
      },
      {
        type: 'input',
        name: 'name',
        message: 'App display name:',
        default: defaultName
          .replace(/-/g, ' ')
          .replace(/\b\w/g, l => l.toUpperCase())
      },
      {
        type: 'input',
        name: 'tagline',
        message: 'App tagline:',
        default: 'A Galaxy-powered application'
      },
      {
        type: 'input',
        name: 'coreUrl',
        message: 'Core app URL:',
        when: (answers) => {
          const type = answers.type || options.type;
          return type === 'feature' && !options.core;
        },
        validate: validateUrl
      },
      {
        type: 'list',
        name: 'theme',
        message: 'Choose a color theme:',
        choices: [
          { name: '🌊 Ocean (Blue/Teal)', value: 'ocean' },
          { name: '🌲 Forest (Green/Brown)', value: 'forest' },
          { name: '🌅 Sunset (Orange/Purple)', value: 'sunset' },
          { name: '🌙 Midnight (Dark/Purple)', value: 'midnight' },
          { name: '🎨 Custom', value: 'custom' }
        ]
      }
    ]);
    
    const appType = answers.type || options.type;
    
    // Handle custom theme
    let colorPalette = themePresets[answers.theme] || themePresets.ocean;
    
    if (answers.theme === 'custom') {
      const customChoice = await inquirer.prompt([
        {
          type: 'list',
          name: 'method',
          message: 'How would you like to create your custom theme?',
          choices: [
            { name: 'Enter each color manually', value: 'manual' },
            { name: 'Generate from a base color', value: 'generate' }
          ]
        }
      ]);

      if (customChoice.method === 'manual') {
        const customColors = await inquirer.prompt([
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
        
        colorPalette = {
          primary: customColors.primary,
          secondary: customColors.secondary,
          accent: customColors.accent,
          background: customColors.mode === 'dark' ? '#0F172A' : '#FFFFFF',
          foreground: customColors.mode === 'dark' ? '#F1F5F9' : '#1F2937',
          muted: '#9CA3AF',
          success: '#10B981',
          warning: '#F59E0B',
          error: '#EF4444'
        };
      } else {
        const { baseColor } = await inquirer.prompt([
          {
            type: 'input',
            name: 'baseColor',
            message: 'Enter your base color (hex):',
            default: '#3B82F6',
            validate: validateHexColor,
            filter: (input) => input.startsWith('#') ? input : '#' + input
          }
        ]);
        
        colorPalette = generateComplementaryColors(baseColor);
      }
    }
    
    const spinner = ora('Initializing Galaxy configuration...').start();
    
    try {
      // Create configuration directory
      await fs.ensureDir(path.join(process.cwd(), 'src/config'));
      
      // Create galaxy.config.ts
      const configTemplate = `import { GalaxyConfig } from '@/types/galaxy';

export const galaxyConfig: GalaxyConfig = {
  id: '${defaultName.toLowerCase().replace(/\s+/g, '-')}',
  type: '${appType}',
  name: '${answers.name}',
  tagline: '${answers.tagline}',
  ${appType === 'feature' ? `coreAppUrl: '${answers.coreUrl || options.core}',` : ''}
  colorPalette: {
    primary: '${colorPalette.primary}',
    secondary: '${colorPalette.secondary}',
    accent: '${colorPalette.accent}',
    background: '${colorPalette.background}',
    foreground: '${colorPalette.foreground}',
    muted: '${colorPalette.muted}',
    success: '${colorPalette.success}',
    warning: '${colorPalette.warning}',
    error: '${colorPalette.error}',
  },
  ${appType === 'core' ? `related: [],
  features: [],` : ''}
  ${appType === 'feature' ? `features: [
    {
      id: '${defaultName.toLowerCase().replace(/\s+/g, '-')}',
      name: '${answers.name}',
      description: '${answers.tagline}',
      icon: '🚀',
      path: '/',
    }
  ],` : ''}
};

export default galaxyConfig;`;
      
      await fs.writeFile(configPath, configTemplate);
      
      // Create types file if it doesn't exist
      const typesDir = path.join(process.cwd(), 'src/types');
      await fs.ensureDir(typesDir);
      
      const typesPath = path.join(typesDir, 'galaxy.ts');
      if (!(await fs.pathExists(typesPath))) {
        const typesTemplate = `export interface GalaxyConfig {
  id: string;
  type: 'core' | 'feature';
  name: string;
  tagline: string;
  coreAppUrl?: string;
  colorPalette: ColorPalette;
  related?: RelatedApp[];
  features?: Feature[];
}

export interface ColorPalette {
  primary: string;
  secondary: string;
  accent: string;
  background: string;
  foreground: string;
  muted: string;
  success: string;
  warning: string;
  error: string;
}

export interface RelatedApp {
  id: string;
  name: string;
  url: string;
  apiEndpoint?: string;
  description?: string;
  icon?: string;
}

export interface Feature {
  id: string;
  name: string;
  description: string;
  icon: string;
  path: string;
}`;
        
        await fs.writeFile(typesPath, typesTemplate);
      }
      
      // Create or update .env.local
      const envPath = path.join(process.cwd(), '.env.local');
      const envExamplePath = path.join(process.cwd(), '.env.example');
      
      const envContent = `# Galaxy Configuration
NEXT_PUBLIC_APP_NAME=${answers.name}
NEXT_PUBLIC_APP_TYPE=${appType}
${appType === 'feature' ? `NEXT_PUBLIC_CORE_APP_URL=${answers.coreUrl || options.core}` : ''}

# Add your environment variables below
`;
      
      if (!(await fs.pathExists(envPath))) {
        await fs.writeFile(envPath, envContent);
      }
      
      if (!(await fs.pathExists(envExamplePath))) {
        await fs.writeFile(envExamplePath, envContent.replace(/=.*/g, '='));
      }
      
      // Update package.json if needed
      if (await fs.pathExists(packageJsonPath)) {
        try {
          const packageJson = await fs.readJson(packageJsonPath);
          
          // Add Galaxy metadata
          packageJson.galaxy = {
            type: appType,
            version: '1.0.0'
          };
          
          await fs.writeJson(packageJsonPath, packageJson, { spaces: 2 });
        } catch (error) {
          spinner.warn(chalk.yellow('Could not update package.json'));
        }
      }
      
      spinner.succeed(chalk.green('✓ Galaxy configuration created successfully!'));
      
      // Display theme preview
      previewColorPalette(colorPalette);
      
      // Display next steps
      console.log('\n' + chalk.bold('🚀 Next steps:'));
      console.log(chalk.cyan('  1. Review src/config/galaxy.config.ts'));
      console.log(chalk.cyan('  2. Import and use the configuration in your app'));
      console.log(chalk.cyan('  3. Set up the Galaxy theme provider'));
      
      if (appType === 'core') {
        console.log('\n' + chalk.bold('🌌 Core App Setup:'));
        console.log(chalk.dim('  - Add feature apps using: galaxy add-feature'));
        console.log(chalk.dim('  - Configure authentication if needed'));
        console.log(chalk.dim('  - Set up shared state management'));
      } else {
        console.log('\n' + chalk.bold('🪐 Feature App Setup:'));
        console.log(chalk.dim(`  - Core URL: ${answers.coreUrl || options.core}`));
        console.log(chalk.dim('  - Register this feature in your Core app'));
        console.log(chalk.dim('  - Implement Galaxy SDK for communication'));
      }
      
      console.log('\n' + chalk.green('Your app is now Galaxy-powered! 🌌'));
      
    } catch (error) {
      spinner.fail(chalk.red('Failed to initialize Galaxy configuration'));
      console.error(chalk.red('Error:'), error.message);
      process.exit(1);
    }
  });
