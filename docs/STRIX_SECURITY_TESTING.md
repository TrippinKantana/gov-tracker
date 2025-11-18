# Strix Security Testing Integration

This guide explains how to use [Strix](https://github.com/usestrix/strix) for automated security testing of the Government Asset Tracking Platform.

## 🦉 What is Strix?

Strix is an open-source AI-powered penetration testing tool that uses autonomous agents to:
- **Dynamically test** your application for vulnerabilities
- **Validate findings** with actual proof-of-concepts (not false positives)
- **Test like real hackers** - running code, manipulating requests, and exploiting vulnerabilities
- **Integrate with CI/CD** to catch security issues before production

## 🎯 Why Use Strix?

For a government asset tracking platform handling sensitive data, security is critical. Strix helps:

- ✅ **Automated Security Testing** - Catch vulnerabilities in every PR
- ✅ **Real Validation** - Actual exploits, not just static analysis warnings
- ✅ **Comprehensive Coverage** - Tests authentication, injection, XSS, business logic, and more
- ✅ **Developer-Friendly** - Actionable reports with remediation steps
- ✅ **CI/CD Integration** - Block insecure code before deployment

## 📋 Prerequisites

**Important**: Strix is a separate security testing tool - it doesn't need to be installed in your React/Node.js project. Think of it like a linter or testing tool that runs separately.

### Option 1: Use GitHub Actions Only (Recommended - No Local Setup Needed!)

**You don't need to install anything locally!** The GitHub Actions workflow automatically:
- ✅ Sets up Python and Docker in the cloud
- ✅ Runs Strix scans on every PR
- ✅ Reports findings automatically

**All you need:**
- ✅ GitHub repository (you have this)
- ✅ GitHub Secrets configured (see below)

**Skip to the "GitHub Actions Integration" section** if you only want automated scanning.

### Option 2: Run Strix Locally (Optional)

If you want to run security scans on your local machine, you'll need:

- ✅ **Docker Desktop** (download from [docker.com](https://www.docker.com/products/docker-desktop))
- ✅ **Python 3.12+** (download from [python.org](https://www.python.org/downloads/))
- ✅ **LLM API Key** (OpenAI, Anthropic, or local LLM)

**Note**: These are development tools only - they're not part of your React/Node.js application runtime.

## 🚀 Quick Start

### Option A: Use GitHub Actions (No Local Installation!)

**This is the easiest option** - no Docker or Python needed on your machine!

1. **Configure GitHub Secrets** (one-time setup):
   - Go to your GitHub repo → **Settings** → **Secrets and variables** → **Actions**
   - Click **New repository secret**
   - Add two secrets:
     - **Secret 1**: Name = `STRIX_LLM`, Value = `anthropic/claude-sonnet-4-5`
     - **Secret 2**: Name = `LLM_API_KEY`, Value = `your-actual-anthropic-api-key`
   - See detailed instructions below for getting your Anthropic API key

2. **That's it!** Every time you create a PR, Strix will automatically:
   - Run security scans
   - Comment findings on your PR
   - Upload detailed reports

**No Docker, no Python, no local setup needed!** 🎉

### Option B: Run Strix Locally (Optional)

If you want to test before pushing to GitHub:

#### 1. Install Docker Desktop

- Download from [docker.com](https://www.docker.com/products/docker-desktop)
- Install and start Docker Desktop
- Verify: `docker --version` should work

#### 2. Install Python 3.12+

- Download from [python.org](https://www.python.org/downloads/)
- During installation, check "Add Python to PATH"
- Verify: `python --version` should show 3.12+

#### 3. Install Strix

```bash
# Install globally using pipx (recommended)
pipx install strix-agent

# Or install with pip
pip install strix-agent
```

#### 4. Configure Your LLM Provider

Set environment variables for your AI provider:

```bash
# Windows PowerShell
$env:STRIX_LLM="openai/gpt-4"
$env:LLM_API_KEY="your-openai-api-key"

# Windows CMD
set STRIX_LLM=openai/gpt-4
set LLM_API_KEY=your-openai-api-key

# Mac/Linux
export STRIX_LLM="openai/gpt-4"
export LLM_API_KEY="your-openai-api-key"
```

**Note**: OpenAI GPT-4/5 and Claude Sonnet 4.5 work best, but Strix supports many LLM providers.

#### 5. Run Your First Scan

```bash
# Scan the entire project
strix --target ./

# Scan just the backend
strix --target ./backend

# Scan just the frontend
strix --target ./frontend
```

**First run** will automatically pull the Strix Docker sandbox image. Results are saved to `agent_runs/<run-name>/`.

## 🔍 Testing Scenarios

### Backend Security Testing

Test the Node.js/Express backend for common vulnerabilities:

```bash
strix --target ./backend \
  --instruction "Focus on Node.js/Express security: SQL injection in database queries, authentication bypass, CORS misconfigurations, JWT vulnerabilities, API endpoint authorization, and sensitive data exposure."
```

**What Strix will test:**
- SQL injection in database queries
- Authentication and authorization bypass
- CORS misconfigurations
- JWT token vulnerabilities
- API endpoint security
- Sensitive data exposure
- Race conditions in vehicle/GPS tracker assignment
- Input validation issues

### Frontend Security Testing

Test the React frontend for client-side vulnerabilities:

```bash
strix --target ./frontend \
  --instruction "Focus on React security: XSS vulnerabilities, authentication flows, API key exposure in environment variables, client-side injection, sensitive data handling, and Mapbox token security."
```

**What Strix will test:**
- Cross-Site Scripting (XSS)
- Authentication flow vulnerabilities
- API key/token exposure
- Client-side injection
- Sensitive data in localStorage
- CORS and CSP issues

### Deployed Application Testing

Test your deployed application (Netlify + Railway):

```bash
# Test the deployed frontend
strix --target https://your-app.netlify.app \
  --instruction "Perform authenticated testing. Focus on business logic flaws, IDOR vulnerabilities, and unauthorized access to government asset data."

# Test the deployed backend API
strix --target https://your-app.up.railway.app \
  --instruction "Test API endpoints for authentication bypass, SQL injection, and unauthorized data access."
```

### Grey-Box Testing

Test with authentication credentials:

```bash
strix --target https://your-app.netlify.app \
  --instruction "Perform authenticated testing using test credentials: admin@example.com:password. Focus on privilege escalation, IDOR, and unauthorized access to other departments' data."
```

**⚠️ Security Note**: Only use test credentials, never production credentials!

## 🤖 Headless Mode (CI/CD)

For automated testing in CI/CD pipelines:

```bash
# Non-interactive mode (perfect for GitHub Actions)
strix -n --target ./

# Exit with non-zero code if vulnerabilities found
strix -n --target ./backend
```

## 🔄 GitHub Actions Integration (Recommended!)

**This is the easiest way to use Strix** - no local installation needed!

We've already set up a GitHub Actions workflow (`.github/workflows/strix-security-scan.yml`) that:

- ✅ **Automatically runs** on every pull request
- ✅ **Scans both backend and frontend** separately
- ✅ **Uploads security reports** as downloadable artifacts
- ✅ **Comments findings** directly on your PRs
- ✅ **Runs weekly scans** every Monday at 2 AM UTC
- ✅ **Handles all setup** - Docker, Python, everything!

### Setting Up GitHub Secrets (One-Time Setup)

1. Go to your GitHub repository
2. Navigate to **Settings** → **Secrets and variables** → **Actions**
3. Click **New repository secret**

4. **Add First Secret:**
   - **Name**: `STRIX_LLM` (exactly as shown)
   - **Value**: `anthropic/claude-sonnet-4-5` (copy this exactly)
   - Click **Add secret**

5. **Add Second Secret:**
   - Click **New repository secret** again
   - **Name**: `LLM_API_KEY` (exactly as shown)
   - **Value**: Your actual Anthropic API key (get it from [console.anthropic.com](https://console.anthropic.com))
   - Click **Add secret**

   **Optional Secrets** (only if needed):
   - `PERPLEXITY_API_KEY` - For enhanced search capabilities (optional)

6. **That's it!** The next time you create a PR, Strix will automatically run.

### Getting Your Anthropic API Key

1. Go to [console.anthropic.com](https://console.anthropic.com)
2. Sign in or create an account
3. Navigate to **API Keys** section
4. Click **Create Key**
5. Copy the API key (starts with `sk-ant-...`)
6. Paste it as the value for `LLM_API_KEY` secret in GitHub

**Important**: Never share your API key publicly or commit it to code!

### How It Works

1. **You create a PR** → GitHub Actions automatically triggers
2. **Strix runs in the cloud** → Uses GitHub's runners (no setup needed!)
3. **Results appear on your PR** → As comments and downloadable reports
4. **You review and fix** → Any vulnerabilities found

### Manual Trigger

You can manually trigger a security scan anytime:

1. Go to **Actions** tab in GitHub
2. Select **Strix Security Scan** workflow
3. Click **Run workflow** button
4. Choose branch and click **Run workflow**

**No Docker, no Python, no local setup required!** 🎉

## 📊 Understanding Results

Strix generates detailed reports in `agent_runs/<run-name>/`:

- **report.md** - Human-readable vulnerability report
- **findings.json** - Machine-readable findings
- **proofs/** - Proof-of-concept exploits
- **logs/** - Detailed execution logs

### Report Structure

```markdown
# Strix Security Report

## Critical Vulnerabilities
- [SQL Injection in /api/vehicles endpoint](#sql-injection)
- [Authentication Bypass](#auth-bypass)

## High Severity
- [CORS Misconfiguration](#cors-issue)

## Medium Severity
- [XSS in Vehicle Name Field](#xss-vulnerability)
```

Each finding includes:
- ✅ **Description** - What the vulnerability is
- ✅ **Proof of Concept** - Actual exploit code
- ✅ **Impact** - What an attacker could do
- ✅ **Remediation** - How to fix it
- ✅ **Severity** - Critical, High, Medium, Low

## 🎯 Focus Areas for Our Platform

Given our platform's architecture, Strix will particularly test:

### Backend (Node.js/Express)
- ✅ **Database Security**: SQL injection in vehicle/facility queries
- ✅ **Authentication**: JWT vulnerabilities, session management
- ✅ **API Security**: Unauthorized access to government assets
- ✅ **CORS**: Misconfigurations allowing unauthorized domains
- ✅ **Input Validation**: Malicious input in vehicle/personnel forms
- ✅ **Race Conditions**: GPS tracker assignment/unassignment bugs
- ✅ **Sensitive Data**: Exposure of database credentials, API keys

### Frontend (React/Vite)
- ✅ **XSS**: Cross-site scripting in user inputs
- ✅ **Authentication**: Auth0 integration vulnerabilities
- ✅ **API Keys**: Mapbox token exposure
- ✅ **Client-Side Storage**: Sensitive data in localStorage
- ✅ **CSP**: Content Security Policy issues

### Infrastructure
- ✅ **Environment Variables**: Exposed secrets
- ✅ **Deployment**: Railway/Netlify misconfigurations
- ✅ **Database**: Connection string security

## 🔧 Advanced Configuration

### Custom Instructions

Focus on specific vulnerability types:

```bash
# Focus on business logic flaws
strix --target ./backend \
  --instruction "Focus on business logic vulnerabilities: race conditions in GPS tracker assignment, unauthorized vehicle modifications, and privilege escalation between departments."

# Focus on injection attacks
strix --target ./backend \
  --instruction "Focus on injection vulnerabilities: SQL injection in all database queries, NoSQL injection, and command injection in system operations."
```

### Multi-Target Testing

Test both source code and deployed app:

```bash
strix -t ./backend -t https://your-app.up.railway.app \
  --instruction "Compare source code with deployed application. Look for differences that might indicate security misconfigurations."
```

## 📈 Continuous Security

### Weekly Scans

The GitHub Actions workflow includes a weekly scheduled scan (every Monday at 2 AM UTC). This ensures:

- ✅ Regular security assessments
- ✅ Detection of new vulnerabilities
- ✅ Compliance with security best practices

### Pre-Deployment Scans

Before deploying to production:

```bash
# Test the staging environment
strix -n -t https://staging.your-app.netlify.app

# Test the production API
strix -n -t https://your-app.up.railway.app
```

## 🚨 Handling Findings

When Strix finds vulnerabilities:

1. **Review the Report**: Check `agent_runs/<run-name>/report.md`
2. **Validate the Finding**: Review the proof-of-concept
3. **Assess Severity**: Critical issues should be fixed immediately
4. **Implement Fix**: Follow remediation steps in the report
5. **Re-test**: Run Strix again to verify the fix
6. **Document**: Update security documentation

### Example Workflow

```bash
# 1. Run scan
strix --target ./backend

# 2. Review findings
cat agent_runs/latest/report.md

# 3. Fix vulnerabilities
# ... make code changes ...

# 4. Re-test
strix --target ./backend

# 5. Verify fixes
# Check that vulnerabilities are gone
```

## 🔐 Security Best Practices

### Before Running Strix

- ✅ **Use Test Environments**: Never test production with real credentials
- ✅ **Backup Data**: Strix may modify test data during exploitation
- ✅ **Isolated Network**: Run in isolated test environments
- ✅ **Review Findings**: Not all findings may be exploitable in production

### After Running Strix

- ✅ **Fix Critical Issues First**: Address high-severity vulnerabilities immediately
- ✅ **Document Decisions**: If you choose not to fix a finding, document why
- ✅ **Regular Scans**: Schedule regular security assessments
- ✅ **Team Review**: Share findings with the security team

## 📚 Additional Resources

- **Strix GitHub**: https://github.com/usestrix/strix
- **Strix Documentation**: https://usestrix.com/docs
- **Strix Discord**: Join the community for support
- **Enterprise Platform**: https://usestrix.com (for managed scanning)

## ⚠️ Important Warnings

1. **Only test applications you own or have permission to test**
2. **Never use production credentials** - always use test accounts
3. **Strix may modify test data** - use isolated test environments
4. **Review findings carefully** - some may be false positives or context-specific
5. **You are responsible** for using Strix ethically and legally

## ✅ Integration Checklist

### For GitHub Actions (Recommended - No Local Setup!)

- [ ] GitHub repository set up
- [ ] GitHub Secrets configured (`STRIX_LLM` and `LLM_API_KEY`)
- [ ] First PR created (to test automated scanning)
- [ ] Security reports reviewed
- [ ] Critical vulnerabilities fixed
- [ ] Regular scanning schedule confirmed (weekly on Mondays)

### For Local Testing (Optional)

- [ ] Docker Desktop installed and running
- [ ] Python 3.12+ installed
- [ ] Strix installed (`pipx install strix-agent`)
- [ ] LLM API key configured (environment variables)
- [ ] First local scan completed successfully
- [ ] Security reports reviewed

---

**Your platform is now protected with automated AI-powered security testing!** 🔒

