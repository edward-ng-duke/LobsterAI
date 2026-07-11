export const DatabaseBoundaryKind = {
  Unconfigured: 'unconfigured',
} as const;

export interface DatabaseBoundary {
  readonly kind: typeof DatabaseBoundaryKind.Unconfigured;
}

export const createDatabaseBoundary = (): DatabaseBoundary => ({
  kind: DatabaseBoundaryKind.Unconfigured,
});
