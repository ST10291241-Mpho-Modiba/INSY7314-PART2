# Banking Application - DevSecOps Pipeline

A comprehensive banking application with a complete DevSecOps pipeline implementation, featuring automated security scanning, compliance monitoring, and deployment automation.

## 🏗️ Architecture Overview

This banking application implements a modern DevSecOps pipeline with:

- **Frontend**: React with TypeScript
- **Backend**: Node.js/Express with TypeScript
- **Database**: MongoDB with Redis for caching
- **Security**: Multi-layered security scanning and monitoring
- **Compliance**: PCI-DSS, SOX, GDPR, and AML compliance automation
- **Infrastructure**: Kubernetes with Docker containerization

## 🚀 DevSecOps Pipeline Features

### 1. CI/CD Pipeline Configuration

#### GitHub Actions Workflows
- **Main CI/CD Pipeline** (`.github/workflows/ci-cd.yml`)
  - Automated testing, building, and deployment
  - Multi-environment support (dev, staging, prod)
  - Security scanning integration
  - Automated rollback capabilities

- **Security Scanning** (`.github/workflows/security-scan.yml`)
  - SAST (Static Application Security Testing)
  - DAST (Dynamic Application Security Testing)
  - Dependency vulnerability scanning
  - Container security scanning

- **Compliance Scanning** (`.github/workflows/compliance-scan.yml`)
  - PCI-DSS compliance validation
  - SOX compliance checks
  - GDPR compliance verification
  - AML compliance monitoring

### 2. Automated Security Scanning

#### Static Application Security Testing (SAST)
- **CodeQL**: Advanced semantic code analysis
- **SonarQube**: Code quality and security analysis
- **ESLint Security**: JavaScript/TypeScript security linting
- **Bandit**: Python security analysis (if applicable)

#### Dynamic Application Security Testing (DAST)
- **OWASP ZAP**: Web application security testing
- **Nuclei**: Vulnerability scanner
- **Custom security tests**: Banking-specific security validations

#### Dependency Vulnerability Scanning
- **npm audit**: Node.js dependency scanning
- **Snyk**: Comprehensive dependency analysis
- **GitHub Dependabot**: Automated dependency updates
- **FOSSA**: License compliance scanning

#### Container Security Scanning
- **Trivy**: Container vulnerability scanning
- **Hadolint**: Dockerfile security linting
- **Docker Bench**: Docker security best practices

### 3. Deployment Automation

#### Docker Containerization
```bash
# Frontend Container
docker build -f docker/frontend/Dockerfile -t banking-frontend:latest .

# Backend Container
docker build -f docker/backend/Dockerfile -t banking-backend:latest .
```

#### Local Development with Docker Compose
```bash
# Start all services
docker-compose up -d

# View logs
docker-compose logs -f

# Stop services
docker-compose down
```

#### Kubernetes Deployment
```bash
# Deploy to Kubernetes
kubectl apply -f k8s/

# Deploy monitoring stack
kubectl apply -f monitoring/

# Deploy compliance scanning
kubectl apply -f compliance/
```

### 4. Security Testing Integration

#### Pre-commit Hooks
Automated security checks before each commit:
```bash
# Install pre-commit hooks
./setup-pre-commit.sh

# Manual pre-commit run
pre-commit run --all-files
```

**Security Checks Include:**
- Code quality validation (ESLint, Prettier)
- Security scanning (detect-secrets, TruffleHog)
- Dependency security (npm audit)
- Docker security (Hadolint, Trivy)
- Infrastructure security (Checkov)
- Banking-specific security validations

## 📊 Monitoring & Alerting

### Prometheus Metrics Collection
- Application performance metrics
- Security event monitoring
- Infrastructure health monitoring
- Custom banking metrics

### Grafana Dashboards
- **Application Dashboard**: Performance and health metrics
- **Security Dashboard**: Security events and threats
- **Compliance Dashboard**: Compliance status and violations
- **Infrastructure Dashboard**: Kubernetes and container metrics

### Alertmanager Configuration
- **Critical Alerts**: Security breaches, system failures
- **Warning Alerts**: Performance degradation, compliance issues
- **Info Alerts**: Deployment notifications, maintenance windows

**Alert Channels:**
- Email notifications
- Slack integration
- PagerDuty escalation
- SMS alerts for critical issues

## 🛡️ Security Features

### Authentication & Authorization
- JWT-based authentication
- Role-based access control (RBAC)
- Multi-factor authentication (MFA)
- Session management and timeout

### Data Protection
- End-to-end encryption
- Data masking for sensitive information
- Secure data transmission (TLS 1.3)
- Database encryption at rest

### Security Monitoring
- Real-time threat detection
- Anomaly detection algorithms
- Failed login attempt monitoring
- Suspicious transaction analysis

### Vulnerability Management
- Automated vulnerability scanning
- Security patch management
- Zero-day threat monitoring
- Incident response automation

## 📋 Compliance Framework

### PCI-DSS Compliance
- **Requirement 1**: Firewall configuration
- **Requirement 2**: Default password changes
- **Requirement 3**: Cardholder data protection
- **Requirement 4**: Data transmission encryption
- **Requirement 5**: Anti-virus protection
- **Requirement 6**: Secure application development
- **Requirement 7**: Access control restrictions
- **Requirement 8**: User authentication
- **Requirement 9**: Physical access restrictions
- **Requirement 10**: Network monitoring
- **Requirement 11**: Security testing
- **Requirement 12**: Information security policy

### SOX Compliance
- **Section 302**: Financial reporting controls
- **Section 404**: Internal control assessment
- **Section 409**: Real-time disclosure
- **Section 802**: Document retention

### GDPR Compliance
- **Article 5**: Data processing principles
- **Article 6**: Lawful basis for processing
- **Article 7**: Consent requirements
- **Articles 12-14**: Information provision
- **Article 15**: Right of access
- **Article 16**: Right to rectification
- **Article 17**: Right to erasure
- **Article 18**: Right to restriction
- **Article 20**: Data portability
- **Article 25**: Data protection by design
- **Article 32**: Security of processing
- **Articles 33-34**: Data breach notification
- **Article 35**: Data protection impact assessment

### AML Compliance
- Customer Due Diligence (CDD)
- Enhanced Due Diligence (EDD)
- Transaction monitoring
- Suspicious Activity Reporting (SAR)
- Record keeping requirements
- Training and awareness programs
- Independent testing
- Technology and systems validation

## 🚀 Getting Started

### Prerequisites
- Node.js 18+ and npm/pnpm
- Docker and Docker Compose
- Kubernetes cluster (local or cloud)
- Git with pre-commit hooks support

### Installation

1. **Clone the repository**
```bash
git clone <repository-url>
cd BankingProject
```

2. **Install dependencies**
```bash
npm install
# or
pnpm install
```

3. **Set up environment variables**
```bash
cp .env.example .env
# Edit .env with your configuration
```

4. **Set up pre-commit hooks**
```bash
./setup-pre-commit.sh
```

5. **Start development environment**
```bash
docker-compose up -d
```

6. **Run the application**
```bash
npm run dev
```

### Development Workflow

1. **Create feature branch**
```bash
git checkout -b feature/your-feature-name
```

2. **Make changes and commit**
```bash
git add .
git commit -m "feat: your feature description"
# Pre-commit hooks will run automatically
```

3. **Push and create pull request**
```bash
git push origin feature/your-feature-name
# Create PR through GitHub interface
```

4. **Automated pipeline execution**
- CI/CD pipeline runs automatically
- Security scans execute
- Compliance checks validate
- Deployment to staging (if approved)

## 📁 Project Structure

```
BankingProject/
├── .github/workflows/          # GitHub Actions workflows
│   ├── ci-cd.yml              # Main CI/CD pipeline
│   ├── security-scan.yml      # Security scanning
│   └── compliance-scan.yml    # Compliance validation
├── docker/                    # Docker configurations
│   ├── frontend/              # Frontend container
│   ├── backend/               # Backend container
│   └── docker-compose.yml     # Local development
├── k8s/                       # Kubernetes manifests
│   ├── frontend/              # Frontend deployment
│   ├── backend/               # Backend deployment
│   ├── database/              # Database deployment
│   └── ingress/               # Ingress configuration
├── monitoring/                # Monitoring stack
│   ├── prometheus/            # Prometheus configuration
│   ├── grafana/               # Grafana dashboards
│   └── alertmanager/          # Alert configuration
├── compliance/                # Compliance scanning
│   ├── pci-dss/               # PCI-DSS compliance
│   ├── sox/                   # SOX compliance
│   ├── gdpr/                  # GDPR compliance
│   └── aml/                   # AML compliance
├── security/                  # Security configurations
│   ├── policies/              # Security policies
│   ├── rules/                 # Security rules
│   └── scripts/               # Security scripts
├── src/                       # Application source code
│   ├── frontend/              # React frontend
│   ├── backend/               # Node.js backend
│   └── shared/                # Shared utilities
├── tests/                     # Test suites
│   ├── unit/                  # Unit tests
│   ├── integration/           # Integration tests
│   ├── e2e/                   # End-to-end tests
│   └── security/              # Security tests
├── docs/                      # Documentation
│   ├── api/                   # API documentation
│   ├── security/              # Security documentation
│   └── compliance/            # Compliance documentation
├── .pre-commit-config.yaml    # Pre-commit configuration
├── .hadolint.yaml             # Dockerfile linting
├── .yamllint.yaml             # YAML linting
├── .secrets.baseline          # Secrets baseline
└── README.md                  # This file
```

## 🔧 Configuration Files

### Security Configuration
- **`.pre-commit-config.yaml`**: Pre-commit hooks configuration
- **`.hadolint.yaml`**: Dockerfile security linting
- **`.yamllint.yaml`**: YAML file validation
- **`.secrets.baseline`**: Known secrets baseline
- **`security-rules.yaml`**: Prometheus security alerts

### Monitoring Configuration
- **`monitoring.yaml`**: Complete monitoring stack
- **`alertmanager.yaml`**: Alert routing and notification
- **`compliance-dashboard.yaml`**: Compliance monitoring dashboard

### Compliance Configuration
- **`pci-dss-scan.yaml`**: PCI-DSS compliance scanning
- **`sox-compliance.yaml`**: SOX compliance validation
- **`gdpr-compliance.yaml`**: GDPR compliance checking
- **`aml-compliance.yaml`**: AML compliance monitoring

## 🚨 Security Alerts

### Critical Alerts
- Authentication failures exceeding threshold
- Unauthorized data access attempts
- Security scanner downtime
- Critical vulnerability detection
- Data breach incidents

### Warning Alerts
- Suspicious transaction patterns
- Failed compliance checks
- Performance degradation
- Resource exhaustion warnings

### Compliance Alerts
- PCI-DSS compliance violations
- SOX control failures
- GDPR data protection breaches
- AML suspicious activity detection

## 📈 Metrics & KPIs

### Security Metrics
- **Mean Time to Detection (MTTD)**: Average time to detect security incidents
- **Mean Time to Response (MTTR)**: Average time to respond to security incidents
- **Vulnerability Density**: Number of vulnerabilities per lines of code
- **Security Test Coverage**: Percentage of code covered by security tests

### Compliance Metrics
- **Compliance Score**: Overall compliance percentage across all standards
- **Audit Readiness**: Time required to prepare for compliance audits
- **Control Effectiveness**: Percentage of effective security controls
- **Remediation Time**: Average time to fix compliance violations

### Operational Metrics
- **Deployment Frequency**: Number of deployments per day/week
- **Lead Time**: Time from code commit to production deployment
- **Change Failure Rate**: Percentage of deployments causing failures
- **Recovery Time**: Time to recover from failed deployments

## 🔍 Troubleshooting

### Common Issues

1. **Pre-commit hooks failing**
```bash
# Update pre-commit hooks
pre-commit autoupdate

# Clear pre-commit cache
pre-commit clean
```

2. **Docker build failures**
```bash
# Clean Docker cache
docker system prune -a

# Rebuild without cache
docker-compose build --no-cache
```

3. **Kubernetes deployment issues**
```bash
# Check pod status
kubectl get pods -n banking-app

# View pod logs
kubectl logs -f <pod-name> -n banking-app

# Describe pod for events
kubectl describe pod <pod-name> -n banking-app
```

4. **Compliance scan failures**
```bash
# Run individual compliance scans
kubectl exec -it <compliance-pod> -- /scripts/pci-dss-scan.sh
kubectl exec -it <compliance-pod> -- /scripts/sox-scan.sh
```

### Support & Documentation

- **Security Documentation**: `/docs/security/`
- **API Documentation**: `/docs/api/`
- **Compliance Documentation**: `/docs/compliance/`
- **Troubleshooting Guide**: `/docs/troubleshooting.md`

## 🤝 Contributing

1. Fork the repository
2. Create a feature branch
3. Make your changes
4. Ensure all security checks pass
5. Submit a pull request

### Code Standards
- Follow TypeScript/JavaScript best practices
- Maintain test coverage above 80%
- Pass all security scans
- Meet compliance requirements
- Document security-related changes

## 📄 License

This project is licensed under the MIT License - see the [LICENSE](LICENSE) file for details.

## 🔒 Security

For security concerns, please email security@bankingapp.com or create a private security advisory.

### Responsible Disclosure
We appreciate security researchers who responsibly disclose vulnerabilities. Please follow our security policy for reporting issues.

---

**Built with ❤️ and 🔒 by the Banking DevSecOps Team**
