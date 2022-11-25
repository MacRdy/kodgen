// eslint-disable-next-line @typescript-eslint/no-explicit-any
export type AnyFn = (...args: any[]) => any;

// eslint-disable-next-line @typescript-eslint/no-explicit-any
export type HookFn = <T extends AnyFn>(defaultFn: T, ...args: any[]) => any;
