
export type LogLevel = 'INFO' | 'WARN' | 'ERROR';

class Logger {
  private name: string;

  constructor(name: string) {
    this.name = name;
  }

  private formatMessage(level: LogLevel, message: string): string {
    const timestamp = new Date().toISOString();
    return `[${timestamp}] [${this.name}] [${level}] ${message}`;
  }

  info(message: string, data?: any) {
    console.log(this.formatMessage('INFO', message), data || '');
  }

  warn(message: string, data?: any) {
    console.warn(this.formatMessage('WARN', message), data || '');
  }

  error(message: string, error?: any) {
    console.error(this.formatMessage('ERROR', message), error || '');
  }
}

export default Logger;
