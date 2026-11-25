// Tiny key-value store for things saved on this phone only.
// Web: localStorage. Native (or when the browser blocks storage): memory for this session only.
export interface KV {
  get(key: string): string | null;
  set(key: string, value: string): void;
  remove(key: string): void;
}

export function memoryKV(): KV {
  const m = new Map<string, string>();
  return { get: (k) => m.get(k) ?? null, set: (k, v) => { m.set(k, v); }, remove: (k) => { m.delete(k); } };
}

export function deviceKV(): KV {
  const mem = memoryKV();
  const ls = (): Storage | null => {
    try { return typeof localStorage === 'undefined' ? null : localStorage; } catch { return null; }
  };
  return {
    get: (k) => { try { return ls()?.getItem(k) ?? mem.get(k); } catch { return mem.get(k); } },
    set: (k, v) => { mem.set(k, v); try { ls()?.setItem(k, v); } catch { /* memory copy is enough */ } },
    remove: (k) => { mem.remove(k); try { ls()?.removeItem(k); } catch { /* ignore */ } },
  };
}
