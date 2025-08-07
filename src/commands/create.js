import { Command } from 'commander';
import inquirer from 'inquirer';
import chalk from 'chalk';
import ora from 'ora';
import path from 'path';
import { fileURLToPath } from 'url';
import degit from 'degit';
import { execa } from 'execa';
import fs from 'fs-extra';
import validateNpmPackageName from 'validate-npm-package-name';
import { themePresets } from '../themes/presets.js';
import { updateGalaxyConfig } from '../utils/config-updater.js';
import { detectPackageManager } from '../utils/package-manager.js';
import { validateHexColor, validateUrl } from '../utils/validation.js';
import { initializeGit } from '../utils/git.js';
import { previewColorPalette, generateComplementaryColors } from '../utils/colors.js';

const __dirname = path.dirname(fileURLToPath(import.meta.url));

export const createCommand = new Command('create')
  .argument('<project-name>', 'Name of your project')
  .option('-t, --type <type>', 'Project type: core or feature')
  .option('--core <url>', 'Core app URL (for feature apps)')
  .option('--no-install', 'Skip dependency installation')
  .option('--no-git', 'Skip git initialization')
  .option('-p, --package-manager <pm>', 'Package manager: npm, yarn, pnpm, or bun')
  .option('--template <url>', 'Custom template repository URL')
  .description('Create a new Galaxy app')
  .action(async (projectName, options) => {
    // Validate project name
    const validation = validateNpmPackageName(projectName);
    if (!validation.validForNewPackages) {
      console.error(chalk.red(`Invalid project name: ${projectName}`));
      validation.errors?.forEach(err => console.error(chalk.red(`  - ${err}`)));
      validation.warnings?.forEach(warn => console.error(chalk.yellow(`  - ${warn}`)));
      process.exit(1);
    }

    // Check if directory already exists
    const projectPath = path.join(process.cwd(), projectName);
    if (await fs.pathExists(projectPath)) {
      console.error(chalk.red(`Directory ${projectName} already exists!`));
      process.exit(1);
    }

    // Interactive prompts
    const answers = await inquirer.prompt([
      {
        type: 'list',
        name: 'type',
        message: 'What type of app are you creating?',
        choices: [
          { name: '🌌 Core App (Galaxy Center)', value: 'core' },
          { name: '🪐 Feature App (Planet)', value: 'feature' }
        ],
        when: !options.type
      },
      {
        type: 'input',
        name: 'appName',
        message: 'What is your app\'s display name?',
        default: projectName
          .replace(/-/g, ' ')
          .replace(/\b\w/g, l => l.toUpperCase())
      },
      {
        type: 'input',
        name: 'tagline',
        message: 'Enter a tagline for your app:',
        default: (answers) => {
          const type = answers.type || options.type;
          return type === 'core' 
            ? 'Central hub for all your tools'
            : 'Specialized tool for your workflow';
        }
      },
      {
        type: 'input',
        name: 'coreUrl',
        message: 'Enter the Core app URL:',
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

    // Determine final type
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

    // Create project
    const spinner = ora('Creating your Galaxy app...').start();

    try {
      // Clone template or use local template
      spinner.text = 'Setting up project structure...';
      
      if (options.template) {
        // Use custom template from repository
        await degit(options.template).clone(projectPath);
      } else {
        // Use default Galaxy template (same for both Core and Feature apps)
        await degit('github:khizrmalikk/template-core').clone(projectPath);
      }

      // Update galaxy.config.ts
      spinner.text = 'Configuring galaxy settings...';
      await updateGalaxyConfig(projectPath, {
        id: projectName,
        type: appType,
        name: answers.appName,
        tagline: answers.tagline,
        coreAppUrl: answers.coreUrl || options.core,
        colorPalette
      });

      // Create .env.local
      spinner.text = 'Creating environment file...';
      const envContent = `# Galaxy Configuration
NEXT_PUBLIC_APP_NAME=${answers.appName}
NEXT_PUBLIC_APP_TYPE=${appType}
${appType === 'feature' ? `NEXT_PUBLIC_CORE_APP_URL=${answers.coreUrl || options.core}` : ''}

# Authentication (if needed)
# NEXTAUTH_URL=http://localhost:3000
# NEXTAUTH_SECRET=your-secret-here

# Database (if needed)
# DATABASE_URL=your-database-url

# API Keys (if needed)
# API_KEY=your-api-key
`;
      
      await fs.writeFile(
        path.join(projectPath, '.env.local'),
        envContent
      );
      
      // Also create .env.example
      await fs.writeFile(
        path.join(projectPath, '.env.example'),
        envContent.replace(/=.*/g, '=')
      );

      // Create README.md
      spinner.text = 'Creating documentation...';
      const readmeContent = `# ${answers.appName}

${answers.tagline}

## 🚀 Getting Started

This is a Galaxy ${appType === 'core' ? 'Core' : 'Feature'} app created with [Galaxy CLI](https://github.com/your-org/galaxy-cli).

### Prerequisites

- Node.js 18.18.0 or later
- npm, yarn, or pnpm

### Installation

\`\`\`bash
# Install dependencies
npm install

# Run development server
npm run dev
\`\`\`

Open [http://localhost:3000](http://localhost:3000) to view your app.

## 🎨 Theme

This app uses the **${answers.theme}** theme. You can customize colors in \`src/config/galaxy.config.ts\`.

## 📁 Project Structure

\`\`\`
${projectName}/
├── src/
│   ├── config/
│   │   └── galaxy.config.ts    # Galaxy configuration
│   ├── components/              # React components
│   ├── pages/                   # Next.js pages
│   └── styles/                  # Global styles
├── public/                      # Static assets
├── .env.local                   # Environment variables
└── package.json
\`\`\`

## 🔗 Resources

- [Galaxy Architecture Guide](https://github.com/your-org/galaxy-docs)
- [Galaxy CLI Documentation](https://github.com/your-org/galaxy-cli)

## 📝 License

MIT
`;
      
      await fs.writeFile(
        path.join(projectPath, 'README.md'),
        readmeContent
      );

      // Initialize git
      if (options.git !== false) {
        spinner.text = 'Initializing git repository...';
        await initializeGit(projectPath);
      }

      // Install dependencies
      if (options.install !== false) {
        spinner.text = 'Installing dependencies...';
        const pm = await detectPackageManager(options.packageManager);
        
        try {
          const installArgs = pm === 'bun' ? ['install'] : ['install'];
          await execa(pm, installArgs, { 
            cwd: projectPath,
            stdio: 'pipe'
          });
        } catch (error) {
          spinner.warn(chalk.yellow('Warning: Failed to install dependencies automatically'));
          const installCmd = pm === 'bun' ? 'bun install' : `${pm} install`;
          console.log(chalk.yellow(`Please run '${installCmd}' manually`));
        }
      }

      spinner.succeed(chalk.green('Galaxy app created successfully!'));

      // Display theme preview
      previewColorPalette(colorPalette);

      // Display next steps
      console.log('\n' + chalk.bold('🚀 Next steps:'));
      console.log(chalk.cyan(`  cd ${projectName}`));
      
      const pm = await detectPackageManager(options.packageManager);
      
      if (options.install === false) {
        const installCmd = pm === 'bun' ? 'bun install' : `${pm} install`;
        console.log(chalk.cyan(`  ${installCmd}`));
      }
      
      console.log(chalk.cyan('  Configure your .env.local file'));
      
      const devCmd = pm === 'bun' ? 'bun dev' : `${pm} run dev`;
      console.log(chalk.cyan(`  ${devCmd}`));
      
      console.log('\n' + chalk.bold('📚 Resources:'));
      console.log(chalk.dim('  - Galaxy Docs: https://github.com/khizrmalikk/galaxy-cli#readme'));
      console.log(chalk.dim('  - Galaxy CLI: https://github.com/khizrmalikk/galaxy-cli'));
      
      if (appType === 'feature') {
        console.log('\n' + chalk.bold('🔗 Feature App Setup:'));
        console.log(chalk.dim(`  - Core URL: ${answers.coreUrl || options.core}`));
        console.log(chalk.dim('  - Make sure your Core app is running'));
        console.log(chalk.dim('  - Add this feature to your Core app\'s config'));
      }
      
      console.log('\n' + chalk.green('Happy building! 🌌'));

    } catch (error) {
      spinner.fail(chalk.red('Failed to create project'));
      console.error(chalk.red('Error details:'), error.message);
      
      // Clean up on failure
      if (await fs.pathExists(projectPath)) {
        try {
          await fs.remove(projectPath);
        } catch {}
      }
      
      process.exit(1);
    }
  });
