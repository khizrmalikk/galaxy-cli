import { Command } from 'commander';
import inquirer from 'inquirer';
import chalk from 'chalk';
import fs from 'fs-extra';
import path from 'path';
import ora from 'ora';
import { validateUrl } from '../utils/validation.js';

export const addFeatureCommand = new Command('add-feature')
  .argument('[feature-id]', 'Feature identifier')
  .option('--url <url>', 'Feature URL')
  .option('--api <endpoint>', 'API endpoint')
  .option('--name <name>', 'Feature display name')
  .option('--description <desc>', 'Feature description')
  .option('--icon <icon>', 'Feature icon (emoji or icon name)')
  .description('Add a feature to your Core app')
  .action(async (featureId, options) => {
    // Check if in a Galaxy project
    const configPath = path.join(process.cwd(), 'src/config/galaxy.config.ts');
    
    if (!await fs.pathExists(configPath)) {
      console.error(chalk.red('Not in a Galaxy project directory'));
      console.log(chalk.yellow('Run "galaxy init" first to initialize your project'));
      process.exit(1);
    }
    
    // Read current config to check if it's a Core app
    const configContent = await fs.readFile(configPath, 'utf-8');
    const isCore = configContent.includes("type: 'core'");
    
    if (!isCore) {
      console.error(chalk.red('This command is only for Core apps'));
      console.log(chalk.yellow('Feature apps cannot add other features'));
      process.exit(1);
    }
    
    // Interactive prompts
    const answers = await inquirer.prompt([
      {
        type: 'input',
        name: 'featureId',
        message: 'Feature ID (lowercase, hyphenated):',
        when: !featureId,
        validate: (input) => {
          if (!input) return 'Feature ID is required';
          if (!/^[a-z0-9-]+$/.test(input)) {
            return 'Feature ID can only contain lowercase letters, numbers, and hyphens';
          }
          return true;
        }
      },
      {
        type: 'input',
        name: 'name',
        message: 'Feature display name:',
        when: !options.name,
        default: (answers) => {
          const id = answers.featureId || featureId;
          return id.replace(/-/g, ' ').replace(/\b\w/g, l => l.toUpperCase());
        }
      },
      {
        type: 'input',
        name: 'url',
        message: 'Feature URL:',
        when: !options.url,
        validate: validateUrl
      },
      {
        type: 'input',
        name: 'apiEndpoint',
        message: 'API endpoint (optional):',
        when: !options.api
      },
      {
        type: 'input',
        name: 'description',
        message: 'Feature description:',
        when: !options.description
      },
      {
        type: 'input',
        name: 'icon',
        message: 'Feature icon (emoji or name):',
        when: !options.icon,
        default: '🚀'
      },
      {
        type: 'list',
        name: 'category',
        message: 'Feature category:',
        choices: [
          { name: 'Productivity', value: 'productivity' },
          { name: 'Communication', value: 'communication' },
          { name: 'Analytics', value: 'analytics' },
          { name: 'Finance', value: 'finance' },
          { name: 'Marketing', value: 'marketing' },
          { name: 'Development', value: 'development' },
          { name: 'Other', value: 'other' }
        ]
      },
      {
        type: 'confirm',
        name: 'requiresAuth',
        message: 'Does this feature require authentication?',
        default: false
      }
    ]);
    
    const finalFeatureId = answers.featureId || featureId;
    
    const spinner = ora('Adding feature to Core app...').start();
    
    try {
      let content = await fs.readFile(configPath, 'utf-8');
      
      // Check if feature already exists
      if (content.includes(`id: '${finalFeatureId}'`)) {
        spinner.fail(chalk.red('Feature with this ID already exists'));
        process.exit(1);
      }
      
      // Create the new feature object
      const newFeature = `{
      id: '${finalFeatureId}',
      name: '${answers.name || options.name}',
      url: '${answers.url || options.url}',${answers.apiEndpoint || options.api ? `
      apiEndpoint: '${answers.apiEndpoint || options.api}',` : ''}
      description: '${answers.description || options.description}',
      icon: '${answers.icon || options.icon}',
      category: '${answers.category}',
      requiresAuth: ${answers.requiresAuth},
    }`;
      
      // Add to related array
      if (content.includes('related: []')) {
        // Empty array
        content = content.replace(
          'related: []',
          `related: [\n    ${newFeature}\n  ]`
        );
      } else if (content.includes('related: [')) {
        // Existing items in array
        content = content.replace(
          /related:\s*\[/,
          `related: [\n    ${newFeature},`
        );
      } else {
        // No related array, add it
        content = content.replace(
          /export const galaxyConfig.*?{/,
          `export const galaxyConfig: GalaxyConfig = {\n  related: [\n    ${newFeature}\n  ],`
        );
      }
      
      await fs.writeFile(configPath, content);
      
      spinner.succeed(chalk.green(`✓ Added ${answers.name || options.name} to your Galaxy!`));
      
      // Display feature details
      console.log('\n' + chalk.bold('📦 Feature Added:'));
      console.log('━'.repeat(40));
      console.log(chalk.cyan('ID:'), finalFeatureId);
      console.log(chalk.cyan('Name:'), answers.name || options.name);
      console.log(chalk.cyan('URL:'), answers.url || options.url);
      if (answers.apiEndpoint || options.api) {
        console.log(chalk.cyan('API:'), answers.apiEndpoint || options.api);
      }
      console.log(chalk.cyan('Category:'), answers.category);
      console.log(chalk.cyan('Auth Required:'), answers.requiresAuth ? 'Yes' : 'No');
      
      // Integration instructions
      console.log('\n' + chalk.bold('🔧 Integration Steps:'));
      console.log(chalk.dim('1. Ensure the feature app is running at the specified URL'));
      console.log(chalk.dim('2. Configure CORS if needed for cross-origin requests'));
      console.log(chalk.dim('3. Set up authentication if required'));
      console.log(chalk.dim('4. Test the integration in your Core app'));
      
      // Suggest creating environment variable
      const { createEnv } = await inquirer.prompt([
        {
          type: 'confirm',
          name: 'createEnv',
          message: 'Add feature URL to environment variables?',
          default: true
        }
      ]);
      
      if (createEnv) {
        const envPath = path.join(process.cwd(), '.env.local');
        const envVarName = `NEXT_PUBLIC_FEATURE_${finalFeatureId.toUpperCase().replace(/-/g, '_')}_URL`;
        const envLine = `${envVarName}=${answers.url || options.url}`;
        
        if (await fs.pathExists(envPath)) {
          const envContent = await fs.readFile(envPath, 'utf-8');
          if (!envContent.includes(envVarName)) {
            await fs.appendFile(envPath, `\n${envLine}\n`);
            console.log(chalk.green(`✓ Added ${envVarName} to .env.local`));
          }
        } else {
          await fs.writeFile(envPath, `${envLine}\n`);
          console.log(chalk.green('✓ Created .env.local with feature URL'));
        }
      }
      
    } catch (error) {
      spinner.fail(chalk.red('Failed to add feature'));
      console.error(chalk.red('Error:'), error.message);
      process.exit(1);
    }
  });

// Helper command to list features
export const listFeaturesCommand = new Command('list-features')
  .description('List all features in your Core app')
  .action(async () => {
    const configPath = path.join(process.cwd(), 'src/config/galaxy.config.ts');
    
    if (!await fs.pathExists(configPath)) {
      console.error(chalk.red('Not in a Galaxy project directory'));
      process.exit(1);
    }
    
    try {
      const content = await fs.readFile(configPath, 'utf-8');
      
      // Extract features using regex
      const relatedRegex = /related:\s*\[([\s\S]*?)\]/;
      const match = content.match(relatedRegex);
      
      if (!match || match[1].trim() === '') {
        console.log(chalk.yellow('No features found in this Core app'));
        console.log(chalk.dim('Use "galaxy add-feature" to add features'));
        return;
      }
      
      // Parse features (simple parsing, not full AST)
      const featuresStr = match[1];
      const features = [];
      const featureRegex = /{\s*id:\s*['"]([^'"]+)['"]/g;
      let featureMatch;
      
      while ((featureMatch = featureRegex.exec(featuresStr)) !== null) {
        features.push(featureMatch[1]);
      }
      
      console.log('\n' + chalk.bold('🌌 Features in your Core app:'));
      console.log('━'.repeat(40));
      
      features.forEach((id, index) => {
        console.log(chalk.cyan(`${index + 1}. ${id}`));
      });
      
      console.log('\n' + chalk.dim(`Total: ${features.length} feature(s)`));
      
    } catch (error) {
      console.error(chalk.red('Error reading configuration:'), error.message);
      process.exit(1);
    }
  });

// Helper command to remove a feature
export const removeFeatureCommand = new Command('remove-feature')
  .argument('<feature-id>', 'Feature ID to remove')
  .description('Remove a feature from your Core app')
  .action(async (featureId) => {
    const configPath = path.join(process.cwd(), 'src/config/galaxy.config.ts');
    
    if (!await fs.pathExists(configPath)) {
      console.error(chalk.red('Not in a Galaxy project directory'));
      process.exit(1);
    }
    
    const { confirm } = await inquirer.prompt([
      {
        type: 'confirm',
        name: 'confirm',
        message: `Are you sure you want to remove feature "${featureId}"?`,
        default: false
      }
    ]);
    
    if (!confirm) {
      console.log(chalk.yellow('Removal cancelled'));
      return;
    }
    
    const spinner = ora('Removing feature...').start();
    
    try {
      let content = await fs.readFile(configPath, 'utf-8');
      
      // Remove feature using regex (simplified approach)
      const featureRegex = new RegExp(`{[^}]*id:\\s*['"]${featureId}['"][^}]*},?\\s*`, 'g');
      content = content.replace(featureRegex, '');
      
      // Clean up trailing commas
      content = content.replace(/,(\s*[}\]])/, '$1');
      
      await fs.writeFile(configPath, content);
      
      spinner.succeed(chalk.green(`✓ Removed feature "${featureId}"`));
      
    } catch (error) {
      spinner.fail(chalk.red('Failed to remove feature'));
      console.error(chalk.red('Error:'), error.message);
      process.exit(1);
    }
  });
