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
  .version('1.0.0');

// Register commands
program.addCommand(createCommand);
program.addCommand(initCommand);
program.addCommand(themeCommand);
program.addCommand(addFeatureCommand);

program.parse();
