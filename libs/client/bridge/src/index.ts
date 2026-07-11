import { ContractSourceState } from '@lobsterai/shared-contracts';

export const BridgeAvailability = {
  ScaffoldOnly: 'scaffold_only',
} as const;

export type BridgeAvailability = (typeof BridgeAvailability)[keyof typeof BridgeAvailability];

export interface ClientBridge {
  getAvailability(): BridgeAvailability;
  getContractSourceState(): ContractSourceState;
}

export const createClientBridge = (): ClientBridge => ({
  getAvailability: () => BridgeAvailability.ScaffoldOnly,
  getContractSourceState: () => ContractSourceState.ScaffoldOnly,
});
