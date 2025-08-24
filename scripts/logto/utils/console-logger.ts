export class ConsoleLogger {
  private readonly colors = {
    reset: '\x1b[0m',
    red: '\x1b[31m',
    green: '\x1b[32m',
    yellow: '\x1b[33m',
    blue: '\x1b[34m',
    magenta: '\x1b[35m',
    cyan: '\x1b[36m',
    white: '\x1b[37m',
    gray: '\x1b[90m',
  };

  info(message: string): void {
    console.log(`${this.colors.blue}ℹ${this.colors.reset} ${message}`);
  }

  success(message: string): void {
    console.log(`${this.colors.green}✓${this.colors.reset} ${message}`);
  }

  warn(message: string): void {
    console.log(`${this.colors.yellow}⚠${this.colors.reset} ${message}`);
  }

  error(message: string, error?: any): void {
    console.error(`${this.colors.red}✗${this.colors.reset} ${message}`);
    if (error) {
      if (error instanceof Error) {
        console.error(
          `${this.colors.gray}  ${error.message}${this.colors.reset}`,
        );
        if (error.stack && process.env.NODE_ENV === 'development') {
          console.error(
            `${this.colors.gray}  ${error.stack}${this.colors.reset}`,
          );
        }
      } else {
        console.error(
          `${this.colors.gray}  ${String(error)}${this.colors.reset}`,
        );
      }
    }
  }

  debug(message: string): void {
    if (process.env.NODE_ENV === 'development' || process.env.DEBUG) {
      console.log(`${this.colors.gray}🐛 ${message}${this.colors.reset}`);
    }
  }

  step(step: number, total: number, message: string): void {
    console.log(
      `${this.colors.cyan}[${step}/${total}]${this.colors.reset} ${message}`,
    );
  }
}
