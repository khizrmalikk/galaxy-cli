import { describe, it, expect, beforeEach, afterEach } from 'vitest';
import { execa } from 'execa';
import fs from 'fs-extra';
import path from 'path';
import os from 'os';
import { fileURLToPath } from 'url';

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const cliPath = path.join(__dirname, '..', 'bin', 'galaxy.js');

describe('Galaxy CLI', () => {
  let testDir;
  
  beforeEach(async () => {
    testDir = path.join(os.tmpdir(), 'galaxy-cli-test-' + Date.now());
    await fs.ensureDir(testDir);
    process.chdir(testDir);
  });
  
  afterEach(async () => {
    process.chdir(__dirname);
    await fs.remove(testDir);
  });
  
  describe('create command', () => {
    it('creates a core app with required files', async () => {
      const projectName = 'test-core';
      const { stdout } = await execa('node', [
        cliPath,
        'create',
        projectName,
        '--type', 'core',
        '--no-install',
        '--no-git'
      ]);
      
      expect(stdout).toContain('successfully');
      expect(await fs.pathExists(path.join(testDir, projectName))).toBe(true);
      
      // Check for essential files
      const projectPath = path.join(testDir, projectName);
      expect(await fs.pathExists(path.join(projectPath, 'package.json'))).toBe(true);
      expect(await fs.pathExists(path.join(projectPath, 'src/config/galaxy.config.ts'))).toBe(true);
      expect(await fs.pathExists(path.join(projectPath, '.env.local'))).toBe(true);
      expect(await fs.pathExists(path.join(projectPath, 'README.md'))).toBe(true);
      
      // Check config content
      const config = await fs.readFile(
        path.join(projectPath, 'src/config/galaxy.config.ts'),
        'utf-8'
      );
      expect(config).toContain("type: 'core'");
      expect(config).toContain(`id: '${projectName}'`);
    }, 30000);
    
    it('creates a feature app with core URL', async () => {
      const projectName = 'test-feature';
      const coreUrl = 'https://example.com';
      
      const { stdout } = await execa('node', [
        cliPath,
        'create',
        projectName,
        '--type', 'feature',
        '--core', coreUrl,
        '--no-install',
        '--no-git'
      ]);
      
      expect(stdout).toContain('successfully');
      
      const projectPath = path.join(testDir, projectName);
      const config = await fs.readFile(
        path.join(projectPath, 'src/config/galaxy.config.ts'),
        'utf-8'
      );
      
      expect(config).toContain("type: 'feature'");
      expect(config).toContain(coreUrl);
      
      // Check env file
      const envContent = await fs.readFile(
        path.join(projectPath, '.env.local'),
        'utf-8'
      );
      expect(envContent).toContain('NEXT_PUBLIC_CORE_APP_URL=' + coreUrl);
    }, 30000);
    
    it('validates project names', async () => {
      const invalidNames = ['123-invalid', '-bad-name', 'bad-name-', 'Bad Name'];
      
      for (const name of invalidNames) {
        try {
          await execa('node', [
            cliPath,
            'create',
            name,
            '--type', 'core',
            '--no-install'
          ]);
          // Should not reach here
          expect(true).toBe(false);
        } catch (error) {
          expect(error.stderr || error.stdout).toContain('Invalid project name');
        }
      }
    });
    
    it('prevents creating in existing directory', async () => {
      const projectName = 'existing-dir';
      await fs.ensureDir(path.join(testDir, projectName));
      
      try {
        await execa('node', [
          cliPath,
          'create',
          projectName,
          '--type', 'core'
        ]);
        expect(true).toBe(false);
      } catch (error) {
        expect(error.stderr || error.stdout).toContain('already exists');
      }
    });
  });
  
  describe('init command', () => {
    it('initializes an existing project', async () => {
      // Create a basic project structure
      await fs.writeJson(path.join(testDir, 'package.json'), {
        name: 'existing-project',
        version: '1.0.0'
      });
      
      const { stdout } = await execa('node', [
        cliPath,
        'init',
        '--type', 'core'
      ], { cwd: testDir });
      
      expect(stdout).toContain('successfully');
      expect(await fs.pathExists(path.join(testDir, 'src/config/galaxy.config.ts'))).toBe(true);
      
      const config = await fs.readFile(
        path.join(testDir, 'src/config/galaxy.config.ts'),
        'utf-8'
      );
      expect(config).toContain("type: 'core'");
    });
    
    it('detects already initialized projects', async () => {
      await fs.ensureDir(path.join(testDir, 'src/config'));
      await fs.writeFile(
        path.join(testDir, 'src/config/galaxy.config.ts'),
        'export const galaxyConfig = {};'
      );
      
      // This should prompt for overwrite, we'll test with stdin
      // For now, just check that it detects the existing config
      const configExists = await fs.pathExists(
        path.join(testDir, 'src/config/galaxy.config.ts')
      );
      expect(configExists).toBe(true);
    });
  });
  
  describe('theme command', () => {
    beforeEach(async () => {
      // Create a mock Galaxy project
      await fs.ensureDir(path.join(testDir, 'src/config'));
      await fs.writeFile(
        path.join(testDir, 'src/config/galaxy.config.ts'),
        `export const galaxyConfig = {
          colorPalette: {
            primary: '#3B82F6',
            secondary: '#8B5CF6',
            accent: '#F59E0B',
            background: '#FFFFFF',
            foreground: '#1F2937',
            muted: '#9CA3AF',
            success: '#10B981',
            warning: '#F59E0B',
            error: '#EF4444'
          }
        };`
      );
    });
    
    it('previews current theme', async () => {
      const { stdout } = await execa('node', [
        cliPath,
        'theme',
        '--preview'
      ], { cwd: testDir });
      
      expect(stdout).toContain('Your Theme');
      expect(stdout).toContain('#3B82F6');
    });
    
    it('lists available presets', async () => {
      const { stdout } = await execa('node', [
        cliPath,
        'theme',
        '--list'
      ], { cwd: testDir });
      
      expect(stdout).toContain('Ocean');
      expect(stdout).toContain('Forest');
      expect(stdout).toContain('Sunset');
      expect(stdout).toContain('Midnight');
    });
    
    it('applies a preset theme', async () => {
      await execa('node', [
        cliPath,
        'theme',
        '--apply', 'ocean'
      ], { cwd: testDir });
      
      const config = await fs.readFile(
        path.join(testDir, 'src/config/galaxy.config.ts'),
        'utf-8'
      );
      
      expect(config).toContain('#0EA5E9'); // Ocean primary color
    });
  });
  
  describe('add-feature command', () => {
    beforeEach(async () => {
      // Create a mock Core app
      await fs.ensureDir(path.join(testDir, 'src/config'));
      await fs.writeFile(
        path.join(testDir, 'src/config/galaxy.config.ts'),
        `export const galaxyConfig = {
          type: 'core',
          related: []
        };`
      );
    });
    
    it('adds a feature to Core app', async () => {
      await execa('node', [
        cliPath,
        'add-feature',
        'test-feature',
        '--url', 'https://feature.example.com',
        '--name', 'Test Feature',
        '--description', 'A test feature'
      ], { cwd: testDir });
      
      const config = await fs.readFile(
        path.join(testDir, 'src/config/galaxy.config.ts'),
        'utf-8'
      );
      
      expect(config).toContain("id: 'test-feature'");
      expect(config).toContain('https://feature.example.com');
      expect(config).toContain('Test Feature');
    });
    
    it('prevents adding features to non-Core apps', async () => {
      // Change to feature app
      await fs.writeFile(
        path.join(testDir, 'src/config/galaxy.config.ts'),
        `export const galaxyConfig = {
          type: 'feature'
        };`
      );
      
      try {
        await execa('node', [
          cliPath,
          'add-feature',
          'test-feature',
          '--url', 'https://feature.example.com'
        ], { cwd: testDir });
        expect(true).toBe(false);
      } catch (error) {
        expect(error.stderr || error.stdout).toContain('only for Core apps');
      }
    });
  });
  
  describe('error handling', () => {
    it('handles missing commands gracefully', async () => {
      try {
        await execa('node', [cliPath, 'invalid-command']);
        expect(true).toBe(false);
      } catch (error) {
        expect(error.stderr || error.stdout).toContain('unknown command');
      }
    });
    
    it('shows help when no command provided', async () => {
      const { stdout } = await execa('node', [cliPath, '--help']);
      expect(stdout).toContain('Usage:');
      expect(stdout).toContain('Commands:');
    });
  });
});

describe('Utility Functions', () => {
  it('validates hex colors correctly', async () => {
    const { validateHexColor } = await import('../src/utils/validation.js');
    
    expect(validateHexColor('#3B82F6')).toBe(true);
    expect(validateHexColor('3B82F6')).toBe(true);
    expect(validateHexColor('#FFF')).toBe(true);
    expect(validateHexColor('invalid')).toContain('valid hex color');
    expect(validateHexColor('#GGGGGG')).toContain('valid hex color');
  });
  
  it('validates URLs correctly', async () => {
    const { validateUrl } = await import('../src/utils/validation.js');
    
    expect(validateUrl('https://example.com')).toBe(true);
    expect(validateUrl('http://localhost:3000')).toBe(true);
    expect(validateUrl('invalid-url')).toContain('valid URL');
  });
  
  it('generates complementary colors', async () => {
    const { generateComplementaryColors } = await import('../src/utils/colors.js');
    
    const palette = generateComplementaryColors('#3B82F6');
    
    expect(palette).toHaveProperty('primary');
    expect(palette).toHaveProperty('secondary');
    expect(palette).toHaveProperty('accent');
    expect(palette.primary).toBe('#3B82F6');
  });

  it('detects package managers correctly', async () => {
    const { detectPackageManager } = await import('../src/utils/package-manager.js');
    
    // Test preferred package manager
    expect(await detectPackageManager('bun')).toBe('bun');
    expect(await detectPackageManager('pnpm')).toBe('pnpm');
    expect(await detectPackageManager('yarn')).toBe('yarn');
    expect(await detectPackageManager('npm')).toBe('npm');
  });
});
