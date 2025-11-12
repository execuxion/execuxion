# Contributing to Execuxion

First off, thank you for considering contributing to Execuxion! 🎉

We welcome contributions from everyone, whether you're fixing a typo, adding a new feature, or improving documentation.

## Table of Contents

- [Code of Conduct](#code-of-conduct)
- [How Can I Contribute?](#how-can-i-contribute)
- [Development Setup](#development-setup)
- [Pull Request Process](#pull-request-process)
- [Coding Guidelines](#coding-guidelines)
- [Commit Guidelines](#commit-guidelines)
- [Community](#community)

---

## Code of Conduct

This project and everyone participating in it is governed by our commitment to creating a welcoming and inclusive environment. By participating, you are expected to uphold this standard. Please report unacceptable behavior to contact@execuxion.com.

### Our Standards

**Examples of behavior that contributes to a positive environment:**
- Using welcoming and inclusive language
- Being respectful of differing viewpoints and experiences
- Gracefully accepting constructive criticism
- Focusing on what is best for the community
- Showing empathy towards other community members

**Examples of unacceptable behavior:**
- Harassment, trolling, or insulting/derogatory comments
- Public or private harassment
- Publishing others' private information without permission
- Other conduct which could reasonably be considered inappropriate

---

## How Can I Contribute?

### 🐛 Reporting Bugs

Before creating bug reports, please check existing issues to avoid duplicates.

**When submitting a bug report, include:**
- **Clear title** - Summarize the issue in one line
- **Description** - Detailed explanation of the problem
- **Steps to reproduce** - Step-by-step instructions
- **Expected behavior** - What you expected to happen
- **Actual behavior** - What actually happened
- **Screenshots** - If applicable
- **Environment**:
  - OS: [e.g., Windows 11, macOS 14, Ubuntu 22.04]
  - Execuxion version: [e.g., 1.0.0]
  - Node.js version: [e.g., 18.17.0]

**Use the bug report template:**
[Create Bug Report](https://github.com/execuxion/execuxion/issues/new?template=bug_report.md)

### 💡 Suggesting Features

We love new ideas! Before creating feature requests, please check existing issues and discussions.

**When suggesting a feature, include:**
- **Clear title** - Summarize the feature
- **Problem statement** - What problem does this solve?
- **Proposed solution** - How would it work?
- **Alternatives considered** - Other solutions you've thought about
- **Use cases** - Real-world examples

**Use the feature request template:**
[Create Feature Request](https://github.com/execuxion/execuxion/issues/new?template=feature_request.md)

### 📝 Improving Documentation

Documentation improvements are always welcome!

- Fix typos or grammatical errors
- Add missing documentation
- Clarify confusing sections
- Add examples and tutorials
- Translate to other languages

### 🧩 Creating Custom Blocks

Want to share a custom workflow block?

1. Create your block in `src/components/newtab/workflow/edit/`
2. Add handler in `src/workflowEngine/blocksHandler/`
3. Add to blocks list in `src/utils/getSharedData.js`
4. Document usage with examples
5. Submit a pull request!

### 🌍 Translating

Help make Execuxion available in your language!

Translation files are in `src/locales/[language-code]/`

**To add a new language:**
1. Copy `src/locales/en/` to `src/locales/[your-language]/`
2. Translate all JSON files
3. Add language to `src/utils/shared.js` (languages array)
4. Submit a pull request

---

## Development Setup

### Prerequisites

- **Node.js** 18 or higher
- **npm** (comes with Node.js)
- **Git**

### Fork and Clone

```bash
# Fork the repository on GitHub, then:
git clone https://github.com/YOUR_USERNAME/execuxion.git
cd execuxion

# Add upstream remote
git remote add upstream https://github.com/execuxion/execuxion.git
```

### Install Dependencies

```bash
npm install
```

### Run in Development Mode

```bash
npm run dev
```

This starts the Vite dev server and Electron in development mode with hot reload.

### Build for Production

```bash
# Build for current platform
npm run build

# Build for specific platforms
npm run build:win
npm run build:mac
npm run build:linux
npm run build:all
```

### Project Structure

```
execuxion/
├── electron/              # Electron main process
│   ├── main.js           # Main process entry
│   └── preload.js        # Preload script
├── src/
│   ├── components/       # Vue components
│   ├── workflowEngine/   # Workflow execution engine
│   ├── utils/            # Utility functions
│   ├── locales/          # Translations
│   └── stores/           # Pinia stores
├── public/               # Static assets
└── build/                # Build resources (icons, etc.)
```

---

## Pull Request Process

### Before Submitting

1. **Create an issue first** (for major changes)
2. **Fork the repository**
3. **Create a feature branch** from `master`
   ```bash
   git checkout -b feature/my-new-feature
   ```
4. **Make your changes**
5. **Test thoroughly**
6. **Follow coding guidelines** (see below)
7. **Update documentation** if needed

### Submitting

1. **Commit your changes** with clear messages
   ```bash
   git commit -m "Add feature: brief description"
   ```

2. **Push to your fork**
   ```bash
   git push origin feature/my-new-feature
   ```

3. **Create a Pull Request** on GitHub
   - Fill out the PR template
   - Link related issues
   - Add screenshots/videos if UI changes
   - Request review

### PR Review Process

- Maintainers will review your PR
- Address any requested changes
- Once approved, maintainers will merge
- Your contribution will be credited!

---

## Coding Guidelines

### JavaScript/Vue Style

- Use **ES6+ syntax**
- Follow **Vue 3 Composition API** patterns
- Use **2 spaces** for indentation
- Add **JSDoc comments** for functions
- Keep files **focused and modular**

### Vue Components

```vue
<!-- Good -->
<template>
  <div class="component-name">
    <h1>{{ title }}</h1>
  </div>
</template>

<script setup>
import { ref } from 'vue';

const title = ref('Hello');
</script>

<style scoped>
.component-name {
  padding: 1rem;
}
</style>
```

### Naming Conventions

- **Components**: PascalCase (e.g., `MyComponent.vue`)
- **Files**: kebab-case (e.g., `my-utility.js`)
- **Variables**: camelCase (e.g., `myVariable`)
- **Constants**: UPPER_SNAKE_CASE (e.g., `MAX_RETRIES`)

### Code Quality

- **No console.log** in production code
- **Handle errors** gracefully
- **Validate user input**
- **Add comments** for complex logic
- **Write modular, reusable code**

### ESLint

Run linter before committing:

```bash
npm run lint
npm run lint:fix  # Auto-fix issues
```

---

## Commit Guidelines

We follow conventional commit messages for clarity:

### Format

```
<type>(<scope>): <subject>

<body>

<footer>
```

### Types

- **feat**: New feature
- **fix**: Bug fix
- **docs**: Documentation changes
- **style**: Code style changes (formatting, etc.)
- **refactor**: Code refactoring
- **perf**: Performance improvements
- **test**: Adding tests
- **chore**: Maintenance tasks
- **ci**: CI/CD changes

### Examples

```bash
feat(blocks): add Twitter retweet block

Add new block for retweeting tweets with configurable options.

Closes #123
```

```bash
fix(workflow): resolve execution timeout issue

Fix race condition causing workflows to timeout unexpectedly.

Fixes #456
```

```bash
docs(readme): update installation instructions

Add detailed steps for building from source.
```

---

## Community

### Get Help

- **[GitHub Discussions](https://github.com/execuxion/execuxion/discussions)** - Ask questions
- **[GitHub Issues](https://github.com/execuxion/execuxion/issues)** - Report bugs
- **Email** - contact@execuxion.com

### Stay Updated

- **Star the repo** to get notifications
- **Watch releases** for new versions
- **Follow us** on social media (coming soon!)

---

## Recognition

Contributors are recognized in:
- [README.md](README.md) contributors section
- [GitHub contributors page](https://github.com/execuxion/execuxion/graphs/contributors)
- Release notes for major contributions

---

## Questions?

Don't hesitate to ask! Open a [discussion](https://github.com/execuxion/execuxion/discussions) or reach out to contact@execuxion.com.

**Thank you for contributing to Execuxion! 🚀**
