export const ContractVersion = '1.0.0' as const;

export const ContractSourceState = {
  Active: 'active',
} as const;
export type ContractSourceState = (typeof ContractSourceState)[keyof typeof ContractSourceState];
