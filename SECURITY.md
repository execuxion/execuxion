# Security Policy

## Supported Versions

We release security updates for the following versions of Execuxion:

| Version | Supported          |
| ------- | ------------------ |
| 1.0.x   | :white_check_mark: |
| < 1.0   | :x:                |

**Note:** Only the latest minor version receives security updates. Please upgrade to the latest version to receive security patches.

---

## Reporting a Vulnerability

We take security vulnerabilities seriously. If you discover a security issue, please report it responsibly.

### 🔒 How to Report

**DO NOT** create a public GitHub issue for security vulnerabilities.

Instead, please report via one of these methods:

1. **Email:** Send details to **security@execuxion.com**
2. **GitHub Security Advisory:** Use [GitHub's private vulnerability reporting](https://github.com/execuxion/execuxion/security/advisories/new)

### 📋 What to Include

Please provide as much information as possible:

- **Vulnerability type** (e.g., XSS, code injection, privilege escalation)
- **Affected version(s)**
- **Steps to reproduce**
- **Proof of concept** (if available)
- **Impact assessment** (what can an attacker do?)
- **Suggested fix** (if you have one)
- **Your contact information** (for follow-up)

### ⏱️ Response Timeline

- **24 hours:** Initial acknowledgment of your report
- **7 days:** Assessment and severity classification
- **30 days:** Fix developed and tested (for critical issues)
- **Release:** Security patch released with credit to reporter

### 🏆 Recognition

We believe in recognizing security researchers:

- **Public acknowledgment** in release notes (if you wish)
- **Listed in SECURITY.md** as a security contributor
- **Credit in CVE** (if applicable)

---

## Security Best Practices

When using Execuxion, follow these best practices:

### For End Users

1. **Download from official sources**
   - Only download from [GitHub Releases](https://github.com/execuxion/execuxion/releases)
   - Verify file hashes (provided in release notes)

2. **Keep software updated**
   - Enable auto-updates in settings
   - Check for updates regularly

3. **Protect your credentials**
   - Never share API keys or tokens
   - Use environment variables for sensitive data
   - Don't commit credentials to workflows

4. **Workflow security**
   - Review workflows before importing
   - Be cautious with JavaScript blocks from unknown sources
   - Limit permissions for workflows

5. **Network security**
   - Use HTTPS for API calls
   - Validate SSL certificates
   - Be cautious with proxy configurations

### For Developers

1. **Code reviews**
   - All PRs must be reviewed before merging
   - Security-sensitive changes require extra scrutiny

2. **Dependency management**
   - Regularly update dependencies
   - Use `npm audit` to check for vulnerabilities
   - Pin dependencies to specific versions

3. **Input validation**
   - Validate all user input
   - Sanitize data before rendering
   - Use parameterized queries for databases

4. **Secure storage**
   - Use electron-store with encryption
   - Never store credentials in plain text
   - Clear sensitive data from memory

5. **API security**
   - Validate API responses
   - Implement rate limiting
   - Use secure authentication methods

---

## Known Security Considerations

### Electron Security

Execuxion is built on Electron and follows Electron security best practices:

- ✅ **Context Isolation** enabled
- ✅ **Node Integration** disabled in renderer
- ✅ **Remote Module** disabled
- ✅ **Sandbox** enabled for renderer processes
- ✅ **Content Security Policy** implemented
- ⚠️ **Web Security** partially disabled (required for file:// access)

**Note:** The `webSecurity: false` setting is currently required for local file operations but creates a security surface. We're working on a more secure alternative.

### JavaScript Execution

The JavaScript Code block allows custom code execution:

- **Runs in a sandboxed environment**
- **No access to Node.js APIs**
- **No access to file system** (use designated blocks)
- **Timeout protection** (30 seconds default)

**User Responsibility:** Review JavaScript code in workflows before execution.

### Network Requests

Workflows can make HTTP requests:

- **User must configure** endpoints and authentication
- **No built-in request filtering** (trust your workflows)
- **SSL certificate validation** enabled by default

**Recommendation:** Only use trusted APIs and validate responses.

---

## Security Updates

Security updates are published as:

1. **GitHub Security Advisory**
2. **CVE** (for critical vulnerabilities)
3. **Release notes** with severity classification
4. **Email notification** (if you've subscribed)

### Severity Levels

- **Critical:** Immediate patch, emergency release
- **High:** Patch within 7 days
- **Medium:** Patch in next minor release
- **Low:** Patch in next major release

---

## Third-Party Dependencies

Execuxion relies on third-party packages. We:

- ✅ Regularly audit dependencies with `npm audit`
- ✅ Update dependencies promptly when vulnerabilities are discovered
- ✅ Use tools like Dependabot for automated updates
- ✅ Pin dependencies to prevent supply chain attacks

### High-Risk Dependencies

These dependencies have elevated privileges:

- **electron** - Full system access
- **electron-store** - Local file system
- **better-sqlite3** - Database access (if used)

We carefully vet updates to these packages.

---

## Secure Development Lifecycle

Our commitment to security:

1. **Design Phase**
   - Security considerations in feature design
   - Threat modeling for new features

2. **Development Phase**
   - Secure coding practices
   - Input validation
   - Code reviews

3. **Testing Phase**
   - Security testing
   - Penetration testing (for major releases)
   - Dependency audits

4. **Release Phase**
   - Code signing for releases
   - Checksums published
   - Security changelog

5. **Maintenance Phase**
   - Monitor security advisories
   - Respond to vulnerability reports
   - Patch and release updates

---

## Contact

- **Security Email:** security@execuxion.com
- **General Contact:** contact@execuxion.com
- **GitHub:** [@execuxion](https://github.com/execuxion)

---

## Past Security Advisories

None yet. This section will list historical security issues and fixes.

---

**Last Updated:** 2025-01-12

Thank you for helping keep Execuxion secure! 🔒
