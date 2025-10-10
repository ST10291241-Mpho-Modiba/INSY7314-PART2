#!/bin/bash

# Banking Application Pre-commit Setup Script
# This script sets up pre-commit hooks with security checks for the banking application

set -euo pipefail

echo "🏦 Setting up pre-commit hooks for Banking Application..."

# Check if Python is installed
if ! command -v python3 &> /dev/null; then
    echo "❌ Python 3 is required but not installed. Please install Python 3 first."
    exit 1
fi

# Check if Node.js is installed
if ! command -v node &> /dev/null; then
    echo "❌ Node.js is required but not installed. Please install Node.js first."
    exit 1
fi

# Install pre-commit if not already installed
if ! command -v pre-commit &> /dev/null; then
    echo "📦 Installing pre-commit..."
    pip3 install pre-commit
else
    echo "✅ pre-commit is already installed"
fi

# Install additional security tools
echo "🔧 Installing security tools..."

# Install hadolint for Dockerfile linting
if ! command -v hadolint &> /dev/null; then
    echo "📦 Installing hadolint..."
    if [[ "$OSTYPE" == "linux-gnu"* ]]; then
        wget -O /tmp/hadolint https://github.com/hadolint/hadolint/releases/latest/download/hadolint-Linux-x86_64
        chmod +x /tmp/hadolint
        sudo mv /tmp/hadolint /usr/local/bin/hadolint
    elif [[ "$OSTYPE" == "darwin"* ]]; then
        brew install hadolint
    else
        echo "⚠️  Please install hadolint manually for your platform"
    fi
else
    echo "✅ hadolint is already installed"
fi

# Install trivy for security scanning
if ! command -v trivy &> /dev/null; then
    echo "📦 Installing trivy..."
    if [[ "$OSTYPE" == "linux-gnu"* ]]; then
        curl -sfL https://raw.githubusercontent.com/aquasecurity/trivy/main/contrib/install.sh | sh -s -- -b /usr/local/bin
    elif [[ "$OSTYPE" == "darwin"* ]]; then
        brew install trivy
    else
        echo "⚠️  Please install trivy manually for your platform"
    fi
else
    echo "✅ trivy is already installed"
fi

# Install trufflehog for secret scanning
if ! command -v trufflehog &> /dev/null; then
    echo "📦 Installing trufflehog..."
    if [[ "$OSTYPE" == "linux-gnu"* ]]; then
        curl -sSfL https://raw.githubusercontent.com/trufflesecurity/trufflehog/main/scripts/install.sh | sh -s -- -b /usr/local/bin
    elif [[ "$OSTYPE" == "darwin"* ]]; then
        brew install trufflehog
    else
        echo "⚠️  Please install trufflehog manually for your platform"
    fi
else
    echo "✅ trufflehog is already installed"
fi

# Install kubeval for Kubernetes validation
if ! command -v kubeval &> /dev/null; then
    echo "📦 Installing kubeval..."
    if [[ "$OSTYPE" == "linux-gnu"* ]]; then
        wget -O /tmp/kubeval.tar.gz https://github.com/instrumenta/kubeval/releases/latest/download/kubeval-linux-amd64.tar.gz
        tar xf /tmp/kubeval.tar.gz -C /tmp/
        sudo mv /tmp/kubeval /usr/local/bin/kubeval
        rm /tmp/kubeval.tar.gz
    elif [[ "$OSTYPE" == "darwin"* ]]; then
        brew install kubeval
    else
        echo "⚠️  Please install kubeval manually for your platform"
    fi
else
    echo "✅ kubeval is already installed"
fi

# Install license-checker for Node.js projects
echo "📦 Installing license-checker..."
npm install -g license-checker

# Install pre-commit hooks
echo "🔗 Installing pre-commit hooks..."
pre-commit install
pre-commit install --hook-type commit-msg

# Install additional Git hooks
echo "🔗 Installing additional Git hooks..."
pre-commit install --hook-type pre-push
pre-commit install --hook-type post-checkout
pre-commit install --hook-type post-merge

# Create initial secrets baseline
echo "🔍 Creating initial secrets baseline..."
if command -v detect-secrets &> /dev/null; then
    detect-secrets scan --baseline .secrets.baseline
else
    pip3 install detect-secrets
    detect-secrets scan --baseline .secrets.baseline
fi

# Run initial pre-commit check
echo "🧪 Running initial pre-commit check..."
pre-commit run --all-files || {
    echo "⚠️  Some pre-commit checks failed. This is normal for the first run."
    echo "   Please review the output above and fix any issues."
    echo "   You can run 'pre-commit run --all-files' again to re-check."
}

# Create commit message template
echo "📝 Setting up commit message template..."
cat > .gitmessage << 'EOF'
# <type>(<scope>): <subject>
#
# <body>
#
# <footer>
#
# Type should be one of the following:
# * feat: A new feature
# * fix: A bug fix
# * docs: Documentation only changes
# * style: Changes that do not affect the meaning of the code
# * refactor: A code change that neither fixes a bug nor adds a feature
# * perf: A code change that improves performance
# * test: Adding missing tests or correcting existing tests
# * build: Changes that affect the build system or external dependencies
# * ci: Changes to our CI configuration files and scripts
# * chore: Other changes that don't modify src or test files
# * revert: Reverts a previous commit
# * security: Security-related changes
#
# Scope should indicate what is changing (e.g., auth, payment, user)
#
# Subject should:
# * Use imperative, present tense: "change" not "changed" nor "changes"
# * Not capitalize first letter
# * Not end with a dot (.)
#
# Body should include motivation for the change and contrast with previous behavior
#
# Footer should contain any information about Breaking Changes and reference GitHub issues
EOF

git config commit.template .gitmessage

echo "✅ Pre-commit setup completed successfully!"
echo ""
echo "🎉 Your banking application now has comprehensive security checks!"
echo ""
echo "📋 What was installed:"
echo "   • Pre-commit hooks with security scanning"
echo "   • Secret detection (detect-secrets, trufflehog)"
echo "   • Dockerfile linting (hadolint)"
echo "   • Container security scanning (trivy)"
echo "   • Kubernetes validation (kubeval)"
echo "   • License compliance checking"
echo "   • Code quality checks (ESLint, Prettier)"
echo "   • Infrastructure as Code scanning (Checkov)"
echo ""
echo "🔧 Usage:"
echo "   • Hooks run automatically on git commit"
echo "   • Run manually: pre-commit run --all-files"
echo "   • Update hooks: pre-commit autoupdate"
echo "   • Skip hooks (emergency): git commit --no-verify"
echo ""
echo "🚨 Security reminders:"
echo "   • Never commit secrets or sensitive data"
echo "   • Review all security warnings carefully"
echo "   • Keep dependencies updated regularly"
echo "   • Follow secure coding practices"
echo ""
echo "Happy secure coding! 🔒"