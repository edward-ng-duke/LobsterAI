export const BridgeTransport = {
  Rest: 'rest',
  Stream: 'stream',
  Browser: 'browser',
  Unsupported: 'unsupported',
} as const;

export type BridgeTransport = (typeof BridgeTransport)[keyof typeof BridgeTransport];

export interface BridgeRegistryEntry {
  readonly propertyPath: string;
  readonly transport: BridgeTransport;
  readonly target?: string;
  readonly optional: boolean;
  readonly sourceRef: string;
}

// The generator replaces this seed with the complete IElectronAPI property surface.
export const BridgeRegistry: readonly BridgeRegistryEntry[] = [];

