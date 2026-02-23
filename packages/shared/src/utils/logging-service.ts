type LogLevel = 'debug' | 'info' | 'warn' | 'error';

export class LoggingService {
  private context: string;

  constructor(context: string) {
    this.context = context;
  }

  debug(message: string, ...args: unknown[]) {
    this.log('debug', message, ...args);
  }

  info(message: string, ...args: unknown[]) {
    this.log('info', message, ...args);
  }

  warn(message: string, ...args: unknown[]) {
    this.log('warn', message, ...args);
  }

  error(message: string, ...args: unknown[]) {
    this.log('error', message, ...args);
  }

  private log(level: LogLevel, message: string, ...args: unknown[]) {
    const timestamp = new Date().toISOString();
    const prefix = `[${timestamp}] [${this.context}]`;

    // eslint-disable-next-line no-console
    console[level](prefix, message, ...args);
  }
}
