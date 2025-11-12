# Execuxion

> **No-code/low-code visual workflow builder for social media automation, data scraping, and API integration**

<div align="center">

![Execuxion Logo](src/assets/svg/logo.svg)

[![License: AGPL-3.0](https://img.shields.io/badge/License-AGPL%203.0-blue.svg)](LICENSE)
[![Platform](https://img.shields.io/badge/platform-Windows%20%7C%20macOS%20%7C%20Linux-lightgrey)](https://github.com/execuxion/execuxion/releases)
[![GitHub stars](https://img.shields.io/github/stars/execuxion/execuxion?style=social)](https://github.com/execuxion/execuxion/stargazers)
[![GitHub issues](https://img.shields.io/github/issues/execuxion/execuxion)](https://github.com/execuxion/execuxion/issues)
[![GitHub release](https://img.shields.io/github/v/release/execuxion/execuxion)](https://github.com/execuxion/execuxion/releases)

[Features](#features) • [Installation](#installation) • [Quick Start](#quick-start) • [Documentation](#documentation) • [Contributing](#contributing)

</div>

---

## 🚀 What is Execuxion?

**Execuxion** is a powerful desktop application that lets you automate social media tasks, scrape data, and integrate APIs using an intuitive drag-and-drop interface. **No coding required** – just connect blocks visually to create complex workflows in minutes.

### Why Execuxion?

- 🎯 **No-Code/Low-Code** - Build automation workflows without writing a single line of code
- 🔧 **Visual Workflow Builder** - Intuitive drag-and-drop interface powered by Vue Flow
- 🌐 **Multi-Platform Support** - Works on Windows, macOS, and Linux
- 📊 **Data Scraping** - Extract data from websites and APIs effortlessly
- 🤖 **Social Media Automation** - Automate Twitter, Instagram, Facebook, and more
- 🔄 **API Integration** - Connect to any REST API with built-in blocks
- 💾 **Data Export** - Export to JSON, CSV, Excel, Google Sheets
- ⚡ **Workflow Scheduling** - Run workflows on schedules with cron support
- 🔒 **Secure & Private** - All data stored locally with encryption
- 🌍 **Multi-Language** - Available in English, Spanish, French, German, and more

---

## ✨ Features

### Visual Workflow Editor
- **Drag-and-drop blocks** to create automation workflows
- **Real-time preview** of workflow execution
- **Block library** with 50+ pre-built automation blocks
- **Custom blocks** - Create your own reusable blocks
- **Debugging tools** - Step-by-step execution and logging

### Automation Capabilities
- 🐦 **Social Media**: Like, comment, follow, post, schedule content
- 🌐 **Web Scraping**: Extract text, images, tables, links from any website
- 📧 **Email**: Send automated emails with attachments
- 📁 **File Operations**: Read, write, move, delete files
- 🔐 **Authentication**: OAuth, API keys, cookies, session management
- ⏰ **Scheduling**: Cron jobs, intervals, specific dates/times
- 🔄 **Loops & Conditions**: Advanced flow control logic
- 📊 **Data Processing**: Filter, map, sort, aggregate data
- 🧪 **Testing**: Mock data, assertions, test scenarios

### Developer-Friendly
- **JavaScript blocks** for custom logic
- **REST API integration** with request/response mapping
- **Webhook support** for event-driven automation
- **Global variables** and data persistence
- **Version control** for workflows (import/export JSON)
- **Package system** for sharing workflow components

---

## 📸 Screenshots

> _Coming soon! We're working on adding screenshots and demo videos._

---

## 📦 Installation

### Download Pre-Built Releases

Download the latest version for your platform:

**[Download for Windows](https://github.com/execuxion/execuxion/releases/latest/download/Execuxion-Setup-1.0.0-x64.exe)**
**[Download for macOS](https://github.com/execuxion/execuxion/releases/latest/download/Execuxion-1.0.0-arm64.dmg)**
**[Download for Linux](https://github.com/execuxion/execuxion/releases/latest/download/Execuxion-1.0.0-x64.AppImage)**

### Build from Source

**Prerequisites:**
- Node.js 18+ and npm
- Git

**Clone and build:**

```bash
# Clone the repository
git clone https://github.com/execuxion/execuxion.git
cd execuxion

# Install dependencies
npm install

# Run in development mode
npm run dev

# Build for production
npm run build        # Current platform
npm run build:win    # Windows
npm run build:mac    # macOS
npm run build:linux  # Linux
npm run build:all    # All platforms
```

---

## 🎯 Quick Start

### 1. Create Your First Workflow

1. Launch Execuxion
2. Click **"New Workflow"**
3. Drag blocks from the sidebar to the canvas
4. Connect blocks by dragging from output to input ports
5. Configure each block by double-clicking
6. Click **"Execute"** to run your workflow

### 2. Example: Simple Web Scraper

```
1. Add "New Tab" block → Set URL to scrape
2. Add "Get Text" block → Set CSS selector
3. Add "Export Data" block → Choose format (JSON/CSV)
4. Connect: New Tab → Get Text → Export Data
5. Execute!
```

### 3. Example: Twitter Automation

```
1. Add "Trigger" block → Set schedule (e.g., daily at 9 AM)
2. Add "Twitter Like" block → Set search query
3. Add "Loop Data" block → Iterate through results
4. Connect and configure authentication
5. Save and schedule!
```

---

## 📚 Documentation

- **[User Guide](https://github.com/execuxion/execuxion/wiki)** - Complete usage documentation
- **[Block Reference](https://github.com/execuxion/execuxion/wiki/Blocks)** - All available blocks explained
- **[Tutorials](https://github.com/execuxion/execuxion/wiki/Tutorials)** - Step-by-step workflow examples
- **[API Reference](https://github.com/execuxion/execuxion/wiki/API)** - JavaScript API for custom blocks
- **[FAQ](https://github.com/execuxion/execuxion/wiki/FAQ)** - Frequently asked questions

---

## 🛠️ Built With

- **[Electron](https://www.electronjs.org/)** - Cross-platform desktop framework
- **[Vue 3](https://vuejs.org/)** - Progressive JavaScript framework
- **[Vue Flow](https://vueflow.dev/)** - Interactive node-based workflow editor
- **[Vite](https://vitejs.dev/)** - Next-generation build tool
- **[Pinia](https://pinia.vuejs.org/)** - State management
- **[Tailwind CSS](https://tailwindcss.com/)** - Utility-first CSS framework
- **[Dexie.js](https://dexie.org/)** - IndexedDB wrapper for local storage
- **[Electron Store](https://github.com/sindresorhus/electron-store)** - Encrypted local storage

---

## 🤝 Contributing

We welcome contributions from the community! See **[CONTRIBUTING.md](CONTRIBUTING.md)** for guidelines.

### Ways to Contribute

- 🐛 **Report bugs** - Open an issue with detailed reproduction steps
- 💡 **Suggest features** - Share your ideas for new blocks or features
- 📝 **Improve documentation** - Fix typos, add examples, clarify instructions
- 🧩 **Create blocks** - Build and share custom workflow blocks
- 🌍 **Translate** - Help translate Execuxion to your language
- 💻 **Submit pull requests** - Fix bugs or implement features

---

## 🔒 Security

Found a security vulnerability? Please report it responsibly. See **[SECURITY.md](SECURITY.md)** for details.

---

## 📄 License

This project is licensed under the **GNU Affero General Public License v3.0 (AGPL-3.0)** - see the [LICENSE](LICENSE) file for details.

### What This Means:
- ✅ **Free to use** for personal and commercial projects
- ✅ **Modify and distribute** the source code
- ✅ **Create derivative works**
- ⚠️ **Share-alike** - Modifications must be open-sourced under AGPL-3.0
- ⚠️ **Network use** - If you run a modified version as a service, you must provide source code

---

## 🌟 Star History

[![Star History Chart](https://api.star-history.com/svg?repos=execuxion/execuxion&type=Date)](https://star-history.com/#execuxion/execuxion&Date)

---

## 💬 Community & Support

- **[GitHub Discussions](https://github.com/execuxion/execuxion/discussions)** - Ask questions, share workflows
- **[GitHub Issues](https://github.com/execuxion/execuxion/issues)** - Bug reports and feature requests
- **[Discord Server](#)** - Real-time chat (coming soon!)
- **[Twitter](#)** - Follow for updates (coming soon!)

---

## 🙏 Acknowledgments

Execuxion is built on the foundation of the amazing [Automa](https://github.com/AutomaApp/automa) browser extension project. We've adapted and extended it into a standalone desktop application with additional features for social media automation and data scraping.

Special thanks to:
- The Automa team for creating an excellent workflow automation framework
- All open-source contributors who make projects like this possible
- The Vue.js, Electron, and Node.js communities

---

## 📊 Project Stats

![GitHub repo size](https://img.shields.io/github/repo-size/execuxion/execuxion)
![GitHub commit activity](https://img.shields.io/github/commit-activity/m/execuxion/execuxion)
![GitHub last commit](https://img.shields.io/github/last-commit/execuxion/execuxion)
![GitHub contributors](https://img.shields.io/github/contributors/execuxion/execuxion)

---

<div align="center">

**Made with ❤️ by the Execuxion Team**

[Website](#) • [Documentation](https://github.com/execuxion/execuxion/wiki) • [Releases](https://github.com/execuxion/execuxion/releases)

</div>
