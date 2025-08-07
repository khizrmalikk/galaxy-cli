import { execa } from 'execa';
import chalk from 'chalk';

export async function initializeGit(projectPath) {
  try {
    await execa('git', ['init'], { cwd: projectPath });
    await execa('git', ['add', '.'], { cwd: projectPath });
    await execa('git', ['commit', '-m', 'Initial commit from Galaxy CLI'], {
      cwd: projectPath
    });
    return true;
  } catch (error) {
    console.warn(chalk.yellow('Warning: Failed to initialize git repository'));
    return false;
  }
}

export async function checkGitInstalled() {
  try {
    await execa('git', ['--version']);
    return true;
  } catch {
    return false;
  }
}
