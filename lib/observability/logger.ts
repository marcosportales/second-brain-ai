type LogLevel = "info" | "warn" | "error";

type LogPayload = {
  message: string;
  context?: Record<string, unknown>;
};

function write(level: LogLevel, payload: LogPayload) {
  const record = {
    level,
    timestamp: new Date().toISOString(),
    message: payload.message,
    ...payload.context,
  };

  if (level === "error") {
    console.error(JSON.stringify(record));
    return;
  }

  console.log(JSON.stringify(record));
}

export const logger = {
  info: (message: string, context?: Record<string, unknown>) =>
    write("info", { message, context }),
  warn: (message: string, context?: Record<string, unknown>) =>
    write("warn", { message, context }),
  error: (message: string, context?: Record<string, unknown>) =>
    write("error", { message, context }),
};
