export const ServiceLifecycle = {
  Stopped: 'stopped',
  Starting: 'starting',
  Ready: 'ready',
  Stopping: 'stopping',
} as const;

export type ServiceLifecycle = (typeof ServiceLifecycle)[keyof typeof ServiceLifecycle];
