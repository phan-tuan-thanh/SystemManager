/**
 * Frontend logger — thin wrapper over console.*
 * - Reads log level from app config fetched at startup (see useAppConfig hook)
 * - Suppresses debug/verbose in production automatically
 * - Batches and forwards logs to backend /api/v1/admin/client-logs (fire-and-forget)
 */

type LogLevel = 'error' | 'warn' | 'info' | 'debug';

const LEVEL_ORDER: Record<LogLevel, number> = {
  error: 0,
  warn: 1,
  info: 2,
  debug: 3,
};

interface LogEntry {
  level: LogLevel;
  message: string;
  context?: string;
  meta?: Record<string, unknown>;
  sessionId?: string;
  url?: string;
}

class Logger {
  private level: LogLevel = import.meta.env.PROD ? 'info' : 'debug';
  private batchQueue: LogEntry[] = [];
  private batchTimer: ReturnType<typeof setTimeout> | null = null;
  private readonly BATCH_DELAY_MS = 5000;
  private readonly BATCH_MAX = 50;
  private sendEnabled = true;

  /** Called at app startup after fetching /admin/system-config/logging */
  configure(level: LogLevel, sendToBackend = true) {
    this.level = level;
    this.sendEnabled = sendToBackend;
  }

  error(message: string, context?: string, meta?: Record<string, unknown>) {
    this.write('error', message, context, meta);
  }

  warn(message: string, context?: string, meta?: Record<string, unknown>) {
    this.write('warn', message, context, meta);
  }

  info(message: string, context?: string, meta?: Record<string, unknown>) {
    this.write('info', message, context, meta);
  }

  debug(message: string, context?: string, meta?: Record<string, unknown>) {
    this.write('debug', message, context, meta);
  }

  private write(level: LogLevel, message: string, context?: string, meta?: Record<string, unknown>) {
    if (LEVEL_ORDER[level] > LEVEL_ORDER[this.level]) return;

    const prefix = context ? `[${context}]` : '';
    switch (level) {
      case 'error': console.error(prefix, message, meta ?? ''); break;
      case 'warn':  console.warn(prefix, message, meta ?? '');  break;
      case 'debug': console.debug(prefix, message, meta ?? ''); break;
      default:      console.log(prefix, message, meta ?? '');
    }

    this.enqueue({ level, message, context, meta, url: window.location.href });
  }

  private enqueue(entry: LogEntry) {
    if (!this.sendEnabled) return;

    this.batchQueue.push(entry);

    if (this.batchQueue.length >= this.BATCH_MAX) {
      this.flush();
      return;
    }

    if (!this.batchTimer) {
      this.batchTimer = setTimeout(() => this.flush(), this.BATCH_DELAY_MS);
    }
  }

  private flush() {
    if (this.batchTimer) {
      clearTimeout(this.batchTimer);
      this.batchTimer = null;
    }

    const batch = this.batchQueue.splice(0);
    if (!batch.length) return;

    // Fire-and-forget — never await, never throw
    fetch('/api/v1/admin/client-logs', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ logs: batch }),
      keepalive: true,
    }).catch(() => {/* silently discard send failures */});
  }
}

const logger = new Logger();
export default logger;
