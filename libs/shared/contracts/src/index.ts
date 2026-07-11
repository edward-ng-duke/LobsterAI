export const ContractSourceState = {
  ScaffoldOnly: 'scaffold_only',
} as const;

export type ContractSourceState = (typeof ContractSourceState)[keyof typeof ContractSourceState];
