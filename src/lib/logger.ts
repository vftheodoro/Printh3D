type LogLevel = "info" | "warn" | "error";

interface LogContext {
  requestId?: string;
  actorId?: number;
  action?: string;
  resource?: string;
  [key: string]: unknown;
}

function writeLog(level: LogLevel, message: string, context: LogContext = {}) {
  const payload = JSON.stringify({
    timestamp: new Date().toISOString(),
    level,
    message,
    ...context,
  });

  if (level === "error") {
    console.error(payload);
    return;
  }

  if (level === "warn") {
    console.warn(payload);
    return;
  }

  console.info(payload);
}

export const logger = {
  info: (message: string, context?: LogContext) =>
    writeLog("info", message, context),
  warn: (message: string, context?: LogContext) =>
    writeLog("warn", message, context),
  error: (message: string, context?: LogContext) =>
    writeLog("error", message, context),
};
