import fs from 'fs-extra';
import path from 'path';

export async function updateGalaxyConfig(projectPath, settings) {
  const configPath = path.join(projectPath, 'src/config/galaxy.config.ts');
  
  // Check if config exists, if not create directory and file
  if (!(await fs.pathExists(configPath))) {
    await fs.ensureDir(path.join(projectPath, 'src/config'));
    await createGalaxyConfig(configPath, settings);
    return;
  }
  
  let content = await fs.readFile(configPath, 'utf-8');
  
  // Update basic fields
  const replacements = {
    id: settings.id,
    type: settings.type,
    name: settings.name,
    tagline: settings.tagline,
    coreAppUrl: settings.coreAppUrl,
  };
  
  for (const [key, value] of Object.entries(replacements)) {
    if (value !== undefined) {
      const regex = new RegExp(`${key}:\\s*['"].*['"]`, 'g');
      content = content.replace(regex, `${key}: '${value}'`);
    }
  }
  
  // Update color palette
  if (settings.colorPalette) {
    const paletteStr = `colorPalette: {
    primary: '${settings.colorPalette.primary}',
    secondary: '${settings.colorPalette.secondary}',
    accent: '${settings.colorPalette.accent}',
    background: '${settings.colorPalette.background}',
    foreground: '${settings.colorPalette.foreground}',
    muted: '${settings.colorPalette.muted}',
    success: '${settings.colorPalette.success}',
    warning: '${settings.colorPalette.warning}',
    error: '${settings.colorPalette.error}',
  }`;
    
    content = content.replace(
      /colorPalette:\s*{[\s\S]*?}/,
      paletteStr
    );
  }
  
  await fs.writeFile(configPath, content);
}

async function createGalaxyConfig(configPath, settings) {
  const configTemplate = `import { GalaxyConfig } from '@/types/galaxy';

export const galaxyConfig: GalaxyConfig = {
  id: '${settings.id}',
  type: '${settings.type}',
  name: '${settings.name}',
  tagline: '${settings.tagline || 'Your amazing app'}',
  ${settings.type === 'feature' && settings.coreAppUrl ? `coreAppUrl: '${settings.coreAppUrl}',` : ''}
  colorPalette: {
    primary: '${settings.colorPalette?.primary || '#3B82F6'}',
    secondary: '${settings.colorPalette?.secondary || '#8B5CF6'}',
    accent: '${settings.colorPalette?.accent || '#F59E0B'}',
    background: '${settings.colorPalette?.background || '#FFFFFF'}',
    foreground: '${settings.colorPalette?.foreground || '#1F2937'}',
    muted: '${settings.colorPalette?.muted || '#9CA3AF'}',
    success: '${settings.colorPalette?.success || '#10B981'}',
    warning: '${settings.colorPalette?.warning || '#F59E0B'}',
    error: '${settings.colorPalette?.error || '#EF4444'}',
  },
  ${settings.type === 'core' ? 'related: [],' : ''}
  ${settings.type === 'feature' ? `features: [
    {
      id: '${settings.id}',
      name: '${settings.name}',
      description: '${settings.tagline}',
      icon: '🚀',
      path: '/',
    }
  ],` : ''}
};`;
  
  await fs.writeFile(configPath, configTemplate);
}
