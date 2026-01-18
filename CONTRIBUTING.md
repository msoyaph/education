# Contributing to Education CRM

Thank you for your interest in contributing to Education CRM! This document provides guidelines and instructions for contributing.

## Code of Conduct

- Be respectful and inclusive
- Focus on constructive feedback
- Help others learn and grow

## Getting Started

1. Fork the repository
2. Clone your fork: `git clone https://github.com/your-username/education.git`
3. Create a branch: `git checkout -b feature/your-feature-name`
4. Make your changes
5. Test your changes: `npm run typecheck && npm run lint`
6. Commit: `git commit -m 'Add feature: your feature name'`
7. Push: `git push origin feature/your-feature-name`
8. Open a Pull Request

## Development Guidelines

### Code Style

- Follow TypeScript best practices
- Use ESLint (run `npm run lint`)
- Follow the existing code structure and patterns
- Write self-documenting code with clear variable names

### Architecture

- Follow Domain-Driven Design (DDD) principles
- Keep domain boundaries clear
- Use shared components for reusable UI
- All API calls must go through service layer

### Security

- Never commit `.env` files or secrets
- All permissions must be validated backend-side
- Follow tenant isolation patterns
- Use capability-based checks, not role strings

### Testing

- Test your changes locally
- Ensure TypeScript compiles without errors
- Check that linting passes
- Test in multiple browsers if UI changes

## Pull Request Process

1. Update documentation if needed
2. Ensure all tests pass
3. Request review from maintainers
4. Address review feedback
5. Wait for approval before merging

## Commit Messages

Use clear, descriptive commit messages:

```
feat: Add student attendance widget
fix: Resolve tenant isolation issue in API client
docs: Update README with setup instructions
refactor: Reorganize auth domain structure
```

## Questions?

Open an issue for questions or clarifications.

Thank you for contributing! 🎉
