# 🌌 Galaxy CLI

> Create and manage Galaxy System applications with ease

[![npm version](https://img.shields.io/npm/v/create-galaxy-app.svg)](https://www.npmjs.com/package/create-galaxy-app)
[![License: MIT](https://img.shields.io/badge/License-MIT-yellow.svg)](https://opensource.org/licenses/MIT)

## 🚀 Quick Start

Create a new Galaxy app with a single command:

```bash
npx create-galaxy-app my-app
```

Or install globally:

```bash
npm install -g create-galaxy-app
galaxy create my-app
```

## 📖 Documentation

### Creating Apps

#### Interactive Mode (Recommended)
```bash
npx create-galaxy-app
```

The CLI will guide you through:
- Choosing app type (Core or Feature)
- Setting up your app name and tagline
- Selecting a color theme
- Configuring Core app URL (for Feature apps)

#### Core App
```bash
npx create-galaxy-app my-core --type core
```

#### Feature App
```bash
npx create-galaxy-app my-feature --type feature --core https://my-core-app.com
```

### Available Commands

#### `create <project-name>`
Create a new Galaxy app

**Options:**
- `-t, --type <type>` - Project type: core or feature
- `--core <url>` - Core app URL (for feature apps)
- `--no-install` - Skip dependency installation
- `--no-git` - Skip git initialization
- `-p, --package-manager <pm>` - Package manager: npm, yarn, pnpm, or bun
- `--template <url>` - Custom template repository URL

**Examples:**
```bash
# Interactive creation
galaxy create my-app

# Create Core app
galaxy create my-core --type core

# Create Feature app with Core URL
galaxy create my-feature --type feature --core https://core.example.com

# Skip installation
galaxy create my-app --no-install

# Use specific package manager
galaxy create my-app --package-manager bun
```

#### `init`
Initialize an existing project as a Galaxy app

**Options:**
- `-t, --type <type>` - App type: core or feature
- `--core <url>` - Core app URL (for feature apps)

**Example:**
```bash
cd existing-project
galaxy init
```

#### `theme`
Generate and manage color themes

**Options:**
- `-p, --preview` - Preview current theme
- `-g, --generate` - Generate a new theme
- `-l, --list` - List available preset themes
- `-a, --apply <preset>` - Apply a preset theme

**Examples:**
```bash
# Preview current theme
galaxy theme --preview

# Generate new theme interactively
galaxy theme --generate

# List all presets
galaxy theme --list

# Apply a preset
galaxy theme --apply ocean
```

#### `add-feature`
Add a feature to your Core app

**Options:**
- `--url <url>` - Feature URL
- `--api <endpoint>` - API endpoint
- `--name <name>` - Feature display name
- `--description <desc>` - Feature description
- `--icon <icon>` - Feature icon

**Example:**
```bash
galaxy add-feature payment-processor --url https://payments.example.com
```

## 🎨 Color Themes

Galaxy CLI includes several built-in themes:

- **🌊 Ocean** - Blue and teal tones
- **🌲 Forest** - Green and brown palette
- **🌅 Sunset** - Orange and purple hues
- **🌙 Midnight** - Dark theme with purple accents
- **🎨 Custom** - Create your own theme

### Creating Custom Themes

1. **Manual Selection** - Choose each color individually
2. **Generate from Base** - Auto-generate complementary colors
3. **Random Generation** - Get a random color scheme

## 🏗️ Project Structure

Apps created with Galaxy CLI follow this structure:

```
my-app/
├── src/
│   ├── config/
│   │   └── galaxy.config.ts    # Galaxy configuration
│   ├── components/              # React components
│   ├── pages/                   # Next.js pages
│   ├── styles/                  # Global styles
│   └── types/                   # TypeScript types
├── public/                      # Static assets
├── .env.local                   # Environment variables
├── .env.example                 # Example environment file
├── package.json
├── tsconfig.json
├── next.config.js
├── tailwind.config.js
└── README.md
```

## 🔧 Configuration

### Galaxy Config (`galaxy.config.ts`)

```typescript
export const galaxyConfig = {
  id: 'my-app',
  type: 'core', // or 'feature'
  name: 'My App',
  tagline: 'App description',
  coreAppUrl: 'https://core.example.com', // for feature apps
  colorPalette: {
    primary: '#3B82F6',
    secondary: '#8B5CF6',
    accent: '#F59E0B',
    // ... more colors
  },
  related: [], // for core apps
  features: [] // for feature apps
};
```

### Environment Variables

```bash
# .env.local
NEXT_PUBLIC_APP_NAME=My App
NEXT_PUBLIC_APP_TYPE=core
NEXT_PUBLIC_CORE_APP_URL=https://core.example.com # for feature apps

# Authentication (optional)
NEXTAUTH_URL=http://localhost:3000
NEXTAUTH_SECRET=your-secret-here

# Database (optional)
DATABASE_URL=your-database-url
```

## 🔗 Template Repository

**⚠️ Important:** The CLI references a template repository that needs to be created:

1. **Galaxy Template**: `github:your-org/galaxy-template` (used for both Core and Feature apps)

The differentiation between Core and Feature apps is handled by the `galaxy.config.ts` file, not by separate templates.

Replace `your-org` with your GitHub organization/username in:
- `/src/commands/create.js` (line ~236)
- Template JSON file

You can also use the `--template` flag to specify custom templates:

```bash
galaxy create my-app --template github:myorg/my-template
```

## 🧪 Testing

Run tests with:

```bash
npm test
```

## 🚢 Publishing

### Local Development

```bash
# Link for local testing
npm link

# Test commands
galaxy create test-app
```

### Publish to npm

```bash
# Login to npm
npm login

# Publish package
npm publish --access public
```

### GitHub Actions

The repository includes a GitHub Actions workflow for automated releases.

## 🤝 Contributing

Contributions are welcome! Please feel free to submit a Pull Request.

## 📝 License

MIT © [Your Name]

## 🐛 Known Issues & TODOs

1. **Template Repository**: Need to create actual template repository
   - Replace `github:your-org/galaxy-template` with actual repo

2. **Repository URLs**: Update these placeholders:
   - Package.json repository URL
   - Documentation links in created projects
   - GitHub organization references

3. **Future Enhancements**:
   - [ ] Deploy command
   - [ ] Plugin system
   - [ ] Template marketplace
   - [ ] AI-powered theme generation
   - [ ] Team collaboration features

## 💡 Tips

- Use interactive mode for the best experience
- Always run `galaxy theme --preview` after changing themes
- For Feature apps, ensure your Core app is running
- Use environment variables for sensitive configuration

## 📚 Resources

- [Galaxy Architecture Guide](https://github.com/your-org/galaxy-docs)
- [Galaxy System Documentation](https://github.com/your-org/galaxy-system)
- [Template Repository](https://github.com/your-org/galaxy-templates)

---

Built with ❤️ for the Galaxy System
