export type KioskResourceName = "kiosk-control" | "kiosk-data" | "music" | "sports" | "geolocation";

const active = new Map<KioskResourceName, Set<number>>();
let nextId = 0;

export function startKioskResource(name: KioskResourceName) {
  const instances = active.get(name) ?? new Set<number>();
  const id = ++nextId;
  if (instances.size > 0 && process.env.NODE_ENV !== "production") console.warn(`[kiosk-resource] duplicate-poller detected poller=${name} active=${instances.size + 1}`);
  instances.add(id);
  active.set(name, instances);
  if (process.env.NODE_ENV !== "production") console.info(`[kiosk-resource] poller=${name} instance=${id} start`);
  let stopped = false;
  return () => {
    if (stopped) return;
    stopped = true;
    instances.delete(id);
    if (process.env.NODE_ENV !== "production") console.info(`[kiosk-resource] poller=${name} instance=${id} stop active=${instances.size}`);
    if (instances.size === 0) active.delete(name);
  };
}

export function activeKioskResources() {
  return Object.fromEntries([...active.entries()].map(([name, instances]) => [name, instances.size])) as Partial<Record<KioskResourceName, number>>;
}
