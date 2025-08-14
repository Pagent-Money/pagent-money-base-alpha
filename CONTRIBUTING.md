# Contributing to Pagent Money

We love your input! We want to make contributing to Pagent Money as easy and transparent as possible, whether it's:

- Reporting a bug
- Discussing the current state of the code
- Submitting a fix
- Proposing new features
- Becoming a maintainer

## Development Process

We use GitHub to host code, to track issues and feature requests, as well as accept pull requests.

### Pull Requests

Pull requests are the best way to propose changes to the codebase. We actively welcome your pull requests:

1. Fork the repo and create your branch from `main`.
2. If you've added code that should be tested, add tests.
3. If you've changed APIs, update the documentation.
4. Ensure the test suite passes.
5. Make sure your code lints.
6. Issue that pull request!

### Development Setup

1. **Clone the repository**
   ```bash
   git clone https://github.com/your-org/pagent-money-base-alpha.git
   cd pagent-money-base-alpha
   ```

2. **Install dependencies**
   ```bash
   npm install
   ```

3. **Set up environment**
   ```bash
   cp env.example .env.local
   # Edit .env.local with your configuration
   ```

4. **Start development server**
   ```bash
   npm run dev
   ```

### Code Style

We use ESLint and Prettier to maintain code quality and consistency:

```bash
# Check linting
npm run lint

# Auto-fix linting issues
npm run lint:fix

# Format code
npm run format
```

### Testing

- Run the full test suite: `npm test`
- Run tests in watch mode: `npm run test:watch`
- Run tests with coverage: `npm run test:coverage`
- Test smart contracts: `npm run contracts:test`

### Commit Messages

We follow the [Conventional Commits](https://conventionalcommits.org/) specification:

```
type(scope): description

[optional body]

[optional footer]
```

Types:
- `feat`: A new feature
- `fix`: A bug fix
- `docs`: Documentation changes
- `style`: Code style changes (formatting, etc.)
- `refactor`: Code refactoring
- `test`: Adding or updating tests
- `chore`: Maintenance tasks

Examples:
```
feat(permissions): add spend permission revocation
fix(webhook): handle duplicate auth_id properly
docs(readme): update installation instructions
```

## Any contributions you make will be under the MIT Software License

When you submit code changes, your submissions are understood to be under the same [MIT License](http://choosealicense.com/licenses/mit/) that covers the project.

## Report bugs using GitHub's [issue tracker](https://github.com/your-org/pagent-money-base-alpha/issues)

We use GitHub issues to track public bugs. Report a bug by [opening a new issue](https://github.com/your-org/pagent-money-base-alpha/issues/new).

**Great Bug Reports** tend to have:

- A quick summary and/or background
- Steps to reproduce
  - Be specific!
  - Give sample code if you can
- What you expected would happen
- What actually happens
- Notes (possibly including why you think this might be happening, or stuff you tried that didn't work)

## Feature Requests

We welcome feature requests! Please:

1. Search existing issues to avoid duplicates
2. Use the feature request template if available
3. Provide clear use cases and examples
4. Explain why this would benefit the Pagent community

## Code of Conduct

### Our Pledge

We pledge to make participation in our project a harassment-free experience for everyone, regardless of age, body size, disability, ethnicity, gender identity and expression, level of experience, nationality, personal appearance, race, religion, or sexual identity and orientation.

### Our Standards

Examples of behavior that contributes to creating a positive environment include:

- Using welcoming and inclusive language
- Being respectful of differing viewpoints and experiences
- Gracefully accepting constructive criticism
- Focusing on what is best for the community
- Showing empathy towards other community members

### Enforcement

Project maintainers are responsible for clarifying the standards of acceptable behavior and are expected to take appropriate and fair corrective action in response to any instances of unacceptable behavior.

## Areas for Contribution

### High Priority
- **Security audits and improvements**
- **Test coverage expansion**
- **Documentation improvements**
- **Mobile app optimization**
- **Accessibility improvements**

### Smart Contracts
- Gas optimization
- Additional safety checks
- Integration with other DeFi protocols
- Multi-signature support

### Frontend
- UI/UX improvements
- Mobile responsive design
- Performance optimizations
- Internationalization (i18n)

### Backend
- API rate limiting
- Webhook reliability improvements
- Advanced analytics
- Monitoring and alerting

### Infrastructure
- CI/CD improvements
- Docker containerization
- Deployment automation
- Performance monitoring

## Getting Help

- Join our [Discord community](https://discord.gg/pagent)
- Check the [documentation](https://docs.pagent.money)
- Read through existing [issues](https://github.com/your-org/pagent-money-base-alpha/issues)
- Ask questions in [discussions](https://github.com/your-org/pagent-money-base-alpha/discussions)

## Recognition

Contributors will be recognized in:
- The main README.md file
- Release notes for their contributions
- Our community hall of fame
- Special contributor NFTs (coming soon!)

Thank you for contributing to Pagent Money! 🎉
