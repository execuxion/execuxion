# Changelog

All notable changes to Execuxion will be documented in this file.

The format is based on [Keep a Changelog](https://keepachangelog.com/en/1.0.0/),
and this project adheres to [Semantic Versioning](https://semver.org/spec/v2.0.0.html).

## [Unreleased]

### Coming Soon
- Mobile app support (iOS/Android)
- Cloud sync for workflows
- Marketplace for sharing workflows
- Browser extension companion
- Advanced debugging tools

---

## [1.0.0] - 2025-01-12

### 🎉 Initial Release

First public release of Execuxion - a no-code/low-code visual workflow builder for social media automation, data scraping, and API integration.

### ✨ Features

#### Workflow Editor
- Visual drag-and-drop workflow builder powered by Vue Flow
- 50+ pre-built automation blocks
- Real-time workflow execution preview
- Block library with categorized components
- Custom block creation support
- Workflow import/export (JSON format)
- Debugging tools with step-by-step execution
- Workflow templates and examples

#### Automation Capabilities
- **Social Media Automation**
  - Twitter: Like, retweet, follow, unfollow, post, schedule
  - Support for multiple social media platforms
  - OAuth authentication integration

- **Web Scraping**
  - Element selector with CSS/XPath support
  - Text, image, table, and link extraction
  - Pagination support
  - Dynamic content handling

- **Data Processing**
  - Filter, map, sort, and aggregate operations
  - Data transformation pipelines
  - Variable management
  - Regular expression support

- **Scheduling**
  - Cron job support
  - Interval-based execution
  - Specific date/time triggers
  - Event-based triggers

- **Export Options**
  - JSON, CSV, Excel formats
  - Google Sheets integration
  - File system operations
  - Clipboard support

#### Developer Features
- JavaScript code blocks for custom logic
- REST API integration
- Webhook support
- Global variables and data persistence
- Package system for reusable components
- Local storage with encryption

#### Platform Support
- ✅ Windows (x64, ia32)
- ✅ macOS (Intel, Apple Silicon)
- ✅ Linux (AppImage, deb, rpm)

#### Internationalization
- English (en)
- Spanish (es)
- French (fr)
- Italian (it)
- Portuguese Brazilian (pt-BR)
- Turkish (tr)
- Ukrainian (uk)
- Vietnamese (vi)
- Chinese Simplified (zh)
- Chinese Traditional (zh-TW)

### 🔒 Security
- Encrypted local storage with electron-store
- Secure credential management
- Context isolation enabled
- Content Security Policy implemented
- No telemetry or data collection

### 📚 Documentation
- Comprehensive README with quick start guide
- Contributing guidelines
- Security policy
- Code of conduct
- License information (AGPL-3.0)

### 🛠️ Technical Stack
- Electron 39.1.1
- Vue 3.4.38
- Vue Flow 1.23.0
- Vite 5.0.0
- Pinia 2.0.29
- Tailwind CSS 3.3.6
- Dexie.js 3.2.3
- electron-store 11.0.2

### 📦 Build System
- Electron Builder for multi-platform packaging
- Auto-update support via GitHub releases
- Code signing ready (certificates required)
- NSIS installer for Windows
- DMG installer for macOS
- AppImage/deb/rpm for Linux

### Known Limitations
- Web security partially disabled (required for file:// access)
- Some browser-specific features unavailable (no content scripts)
- No cloud storage sync (local-only in v1.0)
- Limited mobile support (desktop-only)

### Migration Notes
- This is the first release - no migration needed
- Workflows are stored in: `~/AppData/Roaming/execuxion-data/` (Windows)
- Data is encrypted with key: `execuxion-secure-storage-key`

---

## Version History

### Versioning Scheme

We use Semantic Versioning (SemVer):
- **MAJOR.MINOR.PATCH** (e.g., 1.0.0)
- **MAJOR**: Breaking changes
- **MINOR**: New features (backward compatible)
- **PATCH**: Bug fixes (backward compatible)

### Release Channels

- **Stable**: Tested and recommended for production use
- **Beta**: Feature-complete but needs more testing
- **Alpha**: Experimental features, may be unstable

---

## Upgrade Guide

### From Pre-Release to 1.0.0

If you were using a pre-release version:
1. Export all your workflows (JSON)
2. Uninstall the old version
3. Install v1.0.0
4. Import your workflows

---

## Deprecation Warnings

None in this release.

---

## Contributors

Thank you to all contributors who made this release possible!

- Initial development and architecture
- UI/UX design and implementation
- Documentation and guides
- Testing and bug reports
- Translations and localization

Special thanks to the Automa project for the foundational workflow framework.

---

## Links

- [GitHub Repository](https://github.com/execuxion/execuxion)
- [Releases](https://github.com/execuxion/execuxion/releases)
- [Documentation](https://github.com/execuxion/execuxion/wiki)
- [Issue Tracker](https://github.com/execuxion/execuxion/issues)
- [Discussions](https://github.com/execuxion/execuxion/discussions)

---

**Note:** Dates in this changelog are in YYYY-MM-DD format (ISO 8601).

[Unreleased]: https://github.com/execuxion/execuxion/compare/v1.0.0...HEAD
[1.0.0]: https://github.com/execuxion/execuxion/releases/tag/v1.0.0
