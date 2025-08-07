import { execa } from 'execa';
import fs from 'fs-extra';
import path from 'path';

export async function detectPackageManager(preferred) {
  if (preferred) return preferred;
  
  // Check for lockfiles
  const cwd = process.cwd();
  
  if (await fs.pathExists(path.join(cwd, 'bun.lockb'))) {
    return 'bun';
  }
  if (await fs.pathExists(path.join(cwd, 'pnpm-lock.yaml'))) {
    return 'pnpm';
  }
  if (await fs.pathExists(path.join(cwd, 'yarn.lock'))) {
    return 'yarn';
  }
  if (await fs.pathExists(path.join(cwd, 'package-lock.json'))) {
    return 'npm';
  }
  
  // Check what's installed (prioritize faster package managers)
  try {
    await execa('bun', ['--version']);
    return 'bun';
  } catch {}
  
  try {
    await execa('pnpm', ['--version']);
    return 'pnpm';
  } catch {}
  
  try {
    await execa('yarn', ['--version']);
    return 'yarn';
  } catch {}
  
  return 'npm';
}
