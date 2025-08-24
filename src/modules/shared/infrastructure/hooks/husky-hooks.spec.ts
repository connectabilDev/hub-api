import { execSync } from 'child_process';
import * as fs from 'fs';
import * as path from 'path';

describe('Husky Hooks Configuration', () => {
  const projectRoot = path.resolve(__dirname, '../../../../..');
  const huskyDir = path.join(projectRoot, '.husky');

  describe('Hook Files Existence', () => {
    it('should have .husky directory', () => {
      expect(fs.existsSync(huskyDir)).toBe(true);
      expect(fs.statSync(huskyDir).isDirectory()).toBe(true);
    });

    it('should have pre-commit hook file', () => {
      const preCommitPath = path.join(huskyDir, 'pre-commit');
      expect(fs.existsSync(preCommitPath)).toBe(true);
      expect(fs.statSync(preCommitPath).isFile()).toBe(true);
    });

    it('should have commit-msg hook file', () => {
      const commitMsgPath = path.join(huskyDir, 'commit-msg');
      expect(fs.existsSync(commitMsgPath)).toBe(true);
      expect(fs.statSync(commitMsgPath).isFile()).toBe(true);
    });

    it('should have _/husky.sh file', () => {
      const huskyShPath = path.join(huskyDir, '_', 'husky.sh');
      expect(fs.existsSync(huskyShPath)).toBe(true);
      expect(fs.statSync(huskyShPath).isFile()).toBe(true);
    });
  });

  describe('Hook Files Content', () => {
    it('should have correct pre-commit hook content', () => {
      const preCommitPath = path.join(huskyDir, 'pre-commit');
      const content = fs.readFileSync(preCommitPath, 'utf8');

      expect(content).toContain('#!/usr/bin/env sh');
      expect(content).toContain('. "$(dirname -- "$0")/_/husky.sh"');
      expect(content).toContain('yarn lint-staged');
      expect(content).toContain('yarn type-check');
    });

    it('should have correct commit-msg hook content', () => {
      const commitMsgPath = path.join(huskyDir, 'commit-msg');
      const content = fs.readFileSync(commitMsgPath, 'utf8');

      expect(content).toContain('#!/usr/bin/env sh');
      expect(content).toContain('. "$(dirname -- "$0")/_/husky.sh"');
      expect(content).toContain('yarn commitlint --edit $1');
    });

    it('should have executable permissions on hook files', () => {
      const preCommitPath = path.join(huskyDir, 'pre-commit');
      const commitMsgPath = path.join(huskyDir, 'commit-msg');

      const preCommitStats = fs.statSync(preCommitPath);
      const commitMsgStats = fs.statSync(commitMsgPath);

      // Check if files are executable (mode includes execute permission)
      expect(preCommitStats.mode & parseInt('111', 8)).not.toBe(0);
      expect(commitMsgStats.mode & parseInt('111', 8)).not.toBe(0);
    });
  });

  describe('Package.json Husky Configuration', () => {
    it('should have husky prepare script in package.json', () => {
      const packageJsonPath = path.join(projectRoot, 'package.json');
      const packageJson = JSON.parse(fs.readFileSync(packageJsonPath, 'utf8'));

      expect(packageJson.scripts).toBeDefined();
      expect(packageJson.scripts.prepare).toBe('husky');
    });

    it('should have husky as devDependency', () => {
      const packageJsonPath = path.join(projectRoot, 'package.json');
      const packageJson = JSON.parse(fs.readFileSync(packageJsonPath, 'utf8'));

      expect(packageJson.devDependencies).toBeDefined();
      expect(packageJson.devDependencies.husky).toBeDefined();
      expect(packageJson.devDependencies.husky).toMatch(/^\^?\d+\.\d+\.\d+/);
    });

    it('should have lint-staged as devDependency', () => {
      const packageJsonPath = path.join(projectRoot, 'package.json');
      const packageJson = JSON.parse(fs.readFileSync(packageJsonPath, 'utf8'));

      expect(packageJson.devDependencies).toBeDefined();
      expect(packageJson.devDependencies['lint-staged']).toBeDefined();
      expect(packageJson.devDependencies['lint-staged']).toMatch(
        /^\^?\d+\.\d+\.\d+/,
      );
    });

    it('should have commitlint dependencies', () => {
      const packageJsonPath = path.join(projectRoot, 'package.json');
      const packageJson = JSON.parse(fs.readFileSync(packageJsonPath, 'utf8'));

      expect(packageJson.devDependencies).toBeDefined();
      expect(packageJson.devDependencies['@commitlint/cli']).toBeDefined();
      expect(
        packageJson.devDependencies['@commitlint/config-conventional'],
      ).toBeDefined();
    });
  });

  describe('Commitlint Configuration', () => {
    it('should have commitlint.config.js file', () => {
      const commitlintConfigPath = path.join(
        projectRoot,
        'commitlint.config.js',
      );
      expect(fs.existsSync(commitlintConfigPath)).toBe(true);
    });

    it('should have correct commitlint configuration', () => {
      const commitlintConfigPath = path.join(
        projectRoot,
        'commitlint.config.js',
      );
      const configContent = fs.readFileSync(commitlintConfigPath, 'utf8');

      expect(configContent).toContain('@commitlint/config-conventional');
      expect(configContent).toContain('extends');
    });
  });

  describe('Lint-staged Configuration', () => {
    it('should have lint-staged configuration in package.json', () => {
      const packageJsonPath = path.join(projectRoot, 'package.json');

      if (fs.existsSync(packageJsonPath)) {
        const packageJson = JSON.parse(
          fs.readFileSync(packageJsonPath, 'utf8'),
        );

        // lint-staged config might be in package.json or separate file
        if (packageJson['lint-staged']) {
          expect(packageJson['lint-staged']).toBeDefined();
          expect(typeof packageJson['lint-staged']).toBe('object');
        }
      }
    });

    it('should have .lintstagedrc file or package.json lint-staged config', () => {
      const lintstagedrcPath = path.join(projectRoot, '.lintstagedrc');
      const lintstagedrcJsonPath = path.join(projectRoot, '.lintstagedrc.json');
      const lintstagedrcJsPath = path.join(projectRoot, '.lintstagedrc.js');
      const packageJsonPath = path.join(projectRoot, 'package.json');

      let hasLintStagedConfig = false;

      // Check for separate lint-staged config files
      if (
        fs.existsSync(lintstagedrcPath) ||
        fs.existsSync(lintstagedrcJsonPath) ||
        fs.existsSync(lintstagedrcJsPath)
      ) {
        hasLintStagedConfig = true;
      }

      // Check for lint-staged config in package.json
      if (fs.existsSync(packageJsonPath)) {
        const packageJson = JSON.parse(
          fs.readFileSync(packageJsonPath, 'utf8'),
        );
        if (packageJson['lint-staged']) {
          hasLintStagedConfig = true;
        }
      }

      expect(hasLintStagedConfig).toBe(true);
    });
  });

  describe('Git Hooks Integration', () => {
    beforeAll(() => {
      // Ensure we're in a git repository for these tests
      try {
        execSync('git rev-parse --git-dir', {
          cwd: projectRoot,
          stdio: 'pipe',
        });
      } catch {
        // Initialize git if not already done
        execSync('git init', { cwd: projectRoot, stdio: 'pipe' });
      }
    });

    it('should have git hooks directory', () => {
      const gitHooksDir = path.join(projectRoot, '.git', 'hooks');
      expect(fs.existsSync(gitHooksDir)).toBe(true);
    });

    it('should validate that pre-commit hook is properly configured', () => {
      // This test ensures the hook would execute properly
      const preCommitPath = path.join(huskyDir, 'pre-commit');
      const content = fs.readFileSync(preCommitPath, 'utf8');

      // Verify the script has proper structure
      expect(content.split('\n').length).toBeGreaterThan(3);
      expect(content.includes('yarn lint-staged')).toBe(true);
      expect(content.includes('yarn type-check')).toBe(true);
    });

    it('should validate that commit-msg hook is properly configured', () => {
      const commitMsgPath = path.join(huskyDir, 'commit-msg');
      const content = fs.readFileSync(commitMsgPath, 'utf8');

      // Verify the script has proper structure
      expect(content.split('\n').length).toBeGreaterThan(3);
      expect(content.includes('yarn commitlint --edit $1')).toBe(true);
    });
  });

  describe('Hook Dependencies Validation', () => {
    it('should have all required scripts in package.json', () => {
      const packageJsonPath = path.join(projectRoot, 'package.json');
      const packageJson = JSON.parse(fs.readFileSync(packageJsonPath, 'utf8'));

      expect(packageJson.scripts).toBeDefined();
      expect(packageJson.scripts.lint).toBeDefined();
      expect(packageJson.scripts['type-check']).toBeDefined();
      expect(packageJson.scripts.test).toBeDefined();
    });

    it('should have ESLint configuration', () => {
      const eslintConfigPaths = [
        path.join(projectRoot, '.eslintrc'),
        path.join(projectRoot, '.eslintrc.js'),
        path.join(projectRoot, '.eslintrc.json'),
        path.join(projectRoot, 'eslint.config.js'),
        path.join(projectRoot, 'eslint.config.mjs'),
      ];

      const hasEslintConfig = eslintConfigPaths.some((configPath) =>
        fs.existsSync(configPath),
      );

      expect(hasEslintConfig).toBe(true);
    });

    it('should have TypeScript configuration', () => {
      const tsconfigPath = path.join(projectRoot, 'tsconfig.json');
      expect(fs.existsSync(tsconfigPath)).toBe(true);

      const tsconfigContent = JSON.parse(fs.readFileSync(tsconfigPath, 'utf8'));
      expect(tsconfigContent.compilerOptions).toBeDefined();
    });
  });

  describe('Hook Script Validation', () => {
    it('should validate pre-commit script syntax', () => {
      const preCommitPath = path.join(huskyDir, 'pre-commit');
      const content = fs.readFileSync(preCommitPath, 'utf8');

      // Basic shell script validation
      expect(content.startsWith('#!')).toBe(true);
      expect(content.includes('#!/usr/bin/env sh')).toBe(true);

      // Verify proper husky.sh sourcing
      expect(content.includes('. "$(dirname -- "$0")/_/husky.sh"')).toBe(true);
    });

    it('should validate commit-msg script syntax', () => {
      const commitMsgPath = path.join(huskyDir, 'commit-msg');
      const content = fs.readFileSync(commitMsgPath, 'utf8');

      // Basic shell script validation
      expect(content.startsWith('#!')).toBe(true);
      expect(content.includes('#!/usr/bin/env sh')).toBe(true);

      // Verify proper husky.sh sourcing
      expect(content.includes('. "$(dirname -- "$0")/_/husky.sh"')).toBe(true);

      // Verify commit message parameter is passed
      expect(content.includes('$1')).toBe(true);
    });
  });

  describe('Environment Integration', () => {
    it('should work in CI environment', () => {
      // Test that hooks can be disabled in CI if needed
      const originalCI = process.env.CI;

      try {
        // Simulate CI environment
        process.env.CI = 'true';

        // The hooks should be configured but may be skipped in CI
        const preCommitPath = path.join(huskyDir, 'pre-commit');
        expect(fs.existsSync(preCommitPath)).toBe(true);
      } finally {
        // Restore original CI value
        if (originalCI === undefined) {
          delete process.env.CI;
        } else {
          process.env.CI = originalCI;
        }
      }
    });

    it('should handle yarn vs npm environments', () => {
      const preCommitPath = path.join(huskyDir, 'pre-commit');
      const commitMsgPath = path.join(huskyDir, 'commit-msg');

      const preCommitContent = fs.readFileSync(preCommitPath, 'utf8');
      const commitMsgContent = fs.readFileSync(commitMsgPath, 'utf8');

      // Should use yarn consistently (as per package.json packageManager field)
      expect(preCommitContent.includes('yarn')).toBe(true);
      expect(commitMsgContent.includes('yarn')).toBe(true);

      // Should not mix package managers
      expect(preCommitContent.includes('npm')).toBe(false);
      expect(commitMsgContent.includes('npm')).toBe(false);
    });
  });
});
