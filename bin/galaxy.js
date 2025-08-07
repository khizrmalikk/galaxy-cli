#!/usr/bin/env node

import { program } from 'commander';
import gradient from 'gradient-string';
import figlet from 'figlet';
import { createCommand } from '../src/commands/create.js';
import { initCommand } from '../src/commands/init.js';
import { themeCommand } from '../src/commands/theme.js';
import { addFeatureCommand } from '../src/commands/add-feature.js';

// Display beautiful banner
console.log(
  gradient.pastel.multiline(
    figlet.textSync('Galaxy CLI', { horizontalLayout: 'full' })
  )
);

program
  .name('galaxy')
  .description('CLI for creating Galaxy System apps')
  .version('1.0.1');

// Check if first argument looks like a project name (no dashes, not a known command)
const args = process.argv.slice(2);
const knownCommands = ['create', 'init', 'theme', 'add-feature', 'help', '--help', '-h', '--version', '-V'];
const firstArg = args[0];

// If first argument is not a known command and doesn't start with -, treat it as create command
if (firstArg && !knownCommands.includes(firstArg) && !firstArg.startsWith('-')) {
  // Insert 'create' command at the beginning
  process.argv.splice(2, 0, 'create');
}

// Register commands
program.addCommand(createCommand);
program.addCommand(initCommand);
program.addCommand(themeCommand);
program.addCommand(addFeatureCommand);

program.parse();
