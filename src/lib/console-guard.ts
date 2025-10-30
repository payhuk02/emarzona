/**
 * Console guard: route console methods through the project logger.
 * In production, logger is a no-op, effectively silencing console.* calls.
 */
import { logger } from './logger';

type ConsoleMethod = (...args: any[]) => void;

const bind = (fn: ConsoleMethod): ConsoleMethod => fn.bind(null);

// Replace global console methods to ensure consistent behavior across the app
// and avoid accidental logs leaking in production.
// This runs very early from main.tsx.
export function installConsoleGuard(): void {
  // Preserve original methods just in case debugging is needed in dev tools
  const original = {
    log: console.log,
    info: console.info,
    warn: console.warn,
    error: console.error,
    debug: console.debug,
  };

  // Map all to logger which is environment-aware
  console.log = bind(logger.log as ConsoleMethod);
  console.info = bind(logger.info as ConsoleMethod);
  console.warn = bind(logger.warn as ConsoleMethod);
  console.error = bind(logger.error as ConsoleMethod);
  console.debug = bind(logger.log as ConsoleMethod);

  // Provide a way to restore if ever needed during debugging
  (window as any).__restoreConsole = () => {
    console.log = original.log;
    console.info = original.info;
    console.warn = original.warn;
    console.error = original.error;
    console.debug = original.debug;
  };
}


