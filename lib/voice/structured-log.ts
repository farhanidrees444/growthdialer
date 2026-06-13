type LogLevel = 'info' | 'warn' | 'error' | 'debug';

export interface VoiceLogContext {
  service: string;
  event?: string;
  user_id?: string;
  workspace_id?: string;
  call_id?: string;
  call_control_id?: string;
  did?: string;
  duration_ms?: number;
  error?: string;
  [key: string]: unknown;
}

function emit(level: LogLevel, ctx: VoiceLogContext, message: string): void {
  const payload = {
    ts: new Date().toISOString(),
    level,
    message,
    ...ctx,
  };
  const line = JSON.stringify(payload);
  if (level === 'error') console.error(line);
  else if (level === 'warn') console.warn(line);
  else console.log(line);
}

export const voiceLog = {
  info: (ctx: VoiceLogContext, message: string) => emit('info', ctx, message),
  warn: (ctx: VoiceLogContext, message: string) => emit('warn', ctx, message),
  error: (ctx: VoiceLogContext, message: string) => emit('error', ctx, message),
  debug: (ctx: VoiceLogContext, message: string) => emit('debug', ctx, message),
};

export async function withVoiceTiming<T>(
  ctx: VoiceLogContext,
  label: string,
  fn: () => Promise<T>,
): Promise<T> {
  const started = Date.now();
  try {
    const result = await fn();
    voiceLog.info({ ...ctx, duration_ms: Date.now() - started }, label);
    return result;
  } catch (err) {
    voiceLog.error(
      {
        ...ctx,
        duration_ms: Date.now() - started,
        error: err instanceof Error ? err.message : String(err),
      },
      `${label} failed`,
    );
    throw err;
  }
}
