export type EventCallback<T = unknown> = (data: T) => void;

class EventBus {
  private events = new Map<string, Set<EventCallback>>();

  on<T = unknown>(event: string, cb: EventCallback<T>): () => void {
    const listeners = this.events.get(event) ?? new Set<EventCallback>();
    listeners.add(cb as EventCallback);
    this.events.set(event, listeners);
    return () => this.off(event, cb);
  }

  emit<T = unknown>(event: string, data: T): void {
    const listeners = this.events.get(event);
    if (!listeners) return;

    for (const cb of listeners) {
      cb(data);
    }
  }

  off<T = unknown>(event: string, cb: EventCallback<T>): void {
    const listeners = this.events.get(event);
    if (!listeners) return;
    listeners.delete(cb as EventCallback);
    if (listeners.size === 0) this.events.delete(event);
  }
}

export const eventBus = new EventBus();
