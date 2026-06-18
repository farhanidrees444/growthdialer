import { callOrchestrator } from './CallOrchestrator';
import type { DeviceManagerInitOptions } from './DeviceManager';

export async function initCalls(
  token: string,
  options?: DeviceManagerInitOptions,
) {
  await callOrchestrator.init(token, options);
}

export { callOrchestrator } from './CallOrchestrator';
export type { CallOrchestratorSnapshot } from './CallOrchestrator';
export { deviceManager } from './DeviceManager';
export { eventBus } from './eventBus';
