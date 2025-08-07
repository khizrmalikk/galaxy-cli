# 🚀 Galaxy CLI Setup Guide

## ⚠️ Important: Required Configuration

Before publishing or using this CLI in production, you need to replace the following placeholder values:

## 1. GitHub Repository URLs

### Package.json
**File:** `/package.json`
- ✅ **Updated:** Repository URL set to `https://github.com/khizrmalikk/galaxy-cli`

### Template Repository
**File:** `/src/commands/create.js`
- ✅ **Updated:** Template URL set to `github:khizrmalikk/template-core`
  
  Template repository created:
  - Galaxy template: `github:khizrmalikk/template-core` (used for both Core and Feature apps)

### Template JSON File
**File:** `/src/templates/default/template.json`
- ✅ **Updated:** Repository URL set to `github:khizrmalikk/template-core`

## 2. Documentation Links

### In Created Projects
**File:** `/src/commands/create.js`
- ✅ **Updated:** Documentation URLs set to actual GitHub repositories:
  ```javascript
  console.log(chalk.dim('  - Galaxy Docs: https://github.com/khizrmalikk/galaxy-cli#readme'));
  console.log(chalk.dim('  - Galaxy CLI: https://github.com/khizrmalikk/galaxy-cli'));
  ```

### README.md
**File:** `/README.md`
- ✅ **Updated:** All documentation and resource links updated to actual repositories

## 3. Author Information

### Package.json
**File:** `/package.json`
- ✅ **Updated:** Author set to `"Khizr Malik"`

## 4. NPM Package Name (Optional)

If you want to use a different package name:

**File:** `/package.json`
- **Line 2:** Change `"name": "create-galaxy-app"` to your desired package name

## 5. Template Structure

Currently, the CLI creates a basic project structure when templates are not available. To use actual templates:

1. **Create Template Repository:**
   - Create `galaxy-template` repository with a complete Next.js app template
   - The template works for both Core and Feature apps (differentiated by galaxy.config.ts)

2. **Update the create.js file:**
   Replace the temporary structure creation (lines ~197-236) with:
   ```javascript
   await degit('github:your-org/galaxy-template').clone(projectPath);
   ```

## 6. Environment Variables

The generated `.env.local` files contain placeholder values that users will need to configure:
- Authentication secrets
- Database URLs
- API keys

These are intentionally left as placeholders for users to fill in.

## 🎯 Quick Setup Checklist

- [x] Replace all instances of `your-org` with your GitHub organization/username
- [x] Update author name in package.json
- [x] Create template repository for Galaxy apps
- [x] Update documentation URLs
- [ ] Test the CLI locally with `npm link`
- [ ] Publish to npm with `npm publish`

## 📦 Template Repository Structure

Your template repository should include:

```
galaxy-template/
├── src/
│   ├── app/                    # Next.js 13+ app directory
│   ├── components/              # Shared components
│   ├── config/                  # Configuration files
│   │   └── galaxy.config.ts    # Will be replaced by CLI
│   ├── lib/                     # Utility functions
│   ├── styles/                  # Global styles
│   └── types/                   # TypeScript types
├── public/                      # Static assets
├── .env.example                 # Environment variables template
├── .eslintrc.json              # ESLint configuration
├── .gitignore
├── next.config.js              # Next.js configuration
├── package.json                # Dependencies
├── postcss.config.js           # PostCSS configuration
├── README.md                   # Project documentation
├── tailwind.config.js          # Tailwind CSS configuration
└── tsconfig.json               # TypeScript configuration
```

## 🚀 Publishing Steps

1. **Update all placeholder values** as listed above
2. **Create template repositories** with complete starter code
3. **Test locally:**
   ```bash
   npm link
   galaxy create test-app
   ```
4. **Login to npm:**
   ```bash
   npm login
   ```
5. **Publish:**
   ```bash
   npm publish --access public
   ```

## 📝 Notes

- The CLI is configured to use ES modules (`"type": "module"` in package.json)
- Requires Node.js 18.18.0 or later
- Supports npm, yarn, pnpm, and bun package managers
- Uses commander for command parsing and inquirer for interactive prompts
- Includes comprehensive error handling and user feedback

## 🔗 Useful Links

- [npm Publishing Guide](https://docs.npmjs.com/packages-and-modules/contributing-packages-to-the-registry)
- [degit Documentation](https://github.com/Rich-Harris/degit)
- [Commander.js Documentation](https://github.com/tj/commander.js)
- [Inquirer.js Documentation](https://github.com/SBoudrias/Inquirer.js)
