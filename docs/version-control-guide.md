# Version Control Guide

A simple guide for consistent commit messages and version control practices for **The Void** project.

## Commit Message Format

We follow the [Conventional Commits](https://www.conventionalcommits.org/) specification:

```
<type>[optional scope]: <description>

[optional body]

[optional footer(s)]
```

### Basic Structure

- **Type**: Describes the kind of change
- **Scope** (optional): Component or area affected
- **Description**: Brief summary of the change
- **Body** (optional): Detailed explanation
- **Footer** (optional): Breaking changes, issue references

## Commit Types

### Primary Types

- `feat`: New feature for the user
- `fix`: Bug fix for the user
- `docs`: Changes to documentation
- `style`: Formatting, missing semicolons, etc. (no code change)
- `refactor`: Code change that neither fixes a bug nor adds a feature
- `test`: Adding missing tests or correcting existing tests
- `chore`: Changes to build process or auxiliary tools

### Project-Specific Scopes

- `ui`: User interface components
- `auth`: Authentication system
- `dashboard`: Dashboard functionality
- `api`: API endpoints and data fetching
- `config`: Configuration files
- `deps`: Dependencies

## Examples

### Simple commits

```bash
feat: add user authentication
fix: resolve dashboard loading issue
docs: update installation instructions
style: format sidebar component
```

### With scope

```bash
feat(auth): implement Google OAuth login
fix(dashboard): correct job status filters
refactor(ui): simplify button component structure
test(api): add unit tests for job endpoints
```

### With body and footer

```bash
feat(dashboard): add job application tracking

Allow users to track their job applications with status updates,
notes, and timeline view. Includes sorting and filtering options.

Closes #23
```

### Breaking changes

```bash
feat!: restructure user data model

BREAKING CHANGE: User profile structure has changed.
Migration script required for existing users.
```

## Best Practices

### Do ✅

- Write in imperative mood ("add" not "added" or "adds")
- Keep the first line under 50 characters
- Use lowercase for type and description
- Be specific and descriptive
- Reference issues when relevant (`Closes #123`, `Fixes #456`)

### Don't ❌

- Don't end the description with a period
- Don't use vague messages like "fix stuff" or "update code"
- Don't commit unrelated changes together
- Don't use past tense ("added", "fixed")

## Common Scenarios

### Bug Fixes

```bash
fix(auth): resolve token expiration handling
fix(ui): correct mobile responsive layout
fix(dashboard): handle empty job list state
```

### New Features

```bash
feat(dashboard): add job search filters
feat(auth): implement password reset flow
feat(ui): create custom loading spinner
```

### Documentation

```bash
docs: add contributing guidelines
docs(api): update endpoint documentation
docs: fix typos in README
```

### Dependencies and Configuration

```bash
chore(deps): update Next.js to v15.2.4
chore: configure ESLint rules
chore(config): setup Tailwind dark mode
```

## Release Workflow

### Semantic Versioning Mapping

- `fix` → PATCH version (1.0.1)
- `feat` → MINOR version (1.1.0)
- `BREAKING CHANGE` → MAJOR version (2.0.0)

### Branch Naming

- `feature/auth-system`
- `fix/dashboard-loading`
- `docs/setup-guide`
- `refactor/component-structure`

## Tools Integration

### Commitlint (Optional)

Consider adding commitlint to enforce these conventions:

```bash
pnpm add --save-dev @commitlint/cli @commitlint/config-conventional
```

### Git Hooks (Optional)

Use husky for commit message validation:

```bash
pnpm add --save-dev husky
```

## Quick Reference

| Type       | When to use         | Example                             |
| ---------- | ------------------- | ----------------------------------- |
| `feat`     | New functionality   | `feat(auth): add login page`        |
| `fix`      | Bug fixes           | `fix(ui): resolve button alignment` |
| `docs`     | Documentation only  | `docs: update API guide`            |
| `style`    | Code formatting     | `style: fix indentation`            |
| `refactor` | Code improvement    | `refactor(utils): simplify helpers` |
| `test`     | Adding/fixing tests | `test(auth): add login tests`       |
| `chore`    | Maintenance tasks   | `chore: update dependencies`        |

---

**Remember**: Good commit messages are a gift to your future self and your teammates. They make debugging, code reviews, and project maintenance much easier.
