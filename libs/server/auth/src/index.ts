export const AuthBoundaryKind = {
  Unconfigured: 'unconfigured',
} as const;

export interface AuthBoundary {
  readonly kind: typeof AuthBoundaryKind.Unconfigured;
}

export const createAuthBoundary = (): AuthBoundary => ({
  kind: AuthBoundaryKind.Unconfigured,
});
