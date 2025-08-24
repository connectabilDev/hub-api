# Git Hooks Configuration

This directory contains git hooks managed by Husky v9.

## Available Hooks

### Pre-commit Hook

- **File**: `.husky/pre-commit`
- **Purpose**: Runs before each commit to ensure code quality
- **Actions**:
  - Runs `lint-staged` to lint and format only staged files
  - Runs `yarn type-check` to verify TypeScript compilation

### Commit Message Hook

- **File**: `.husky/commit-msg`
- **Purpose**: Validates commit messages follow conventional commit format
- **Actions**:
  - Runs `commitlint` to validate commit message format

## Configuration Files

### Lint-staged Configuration

- **File**: `.lintstagedrc.js`
- **Purpose**: Configures which tools run on staged files
- **Rules**:
  - TypeScript/JavaScript files: ESLint + Prettier
  - JSON/Markdown files: Prettier only

### Commitlint Configuration

- **File**: `commitlint.config.js`
- **Purpose**: Defines conventional commit rules
- **Valid commit types**: `feat`, `fix`, `docs`, `style`, `refactor`, `test`, `chore`, `perf`, `ci`, `build`, `revert`

## Commit Message Format

```
type(scope?): subject

body?

footer?
```

### Examples

- `feat: add user authentication`
- `fix(api): resolve database connection issue`
- `docs: update API documentation`
- `test: add unit tests for user service`

## Troubleshooting

If hooks are not running:

1. Ensure hooks are executable: `chmod +x .husky/*`
2. Verify Husky is initialized: `yarn husky`
3. Check if git hooks path is correct: `git config core.hooksPath`
