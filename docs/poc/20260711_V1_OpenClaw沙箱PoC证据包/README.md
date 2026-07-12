# V1 OpenClaw sandbox PoC evidence template

Status: `NOT_APPLICABLE` in P00. PR-4 must replace this status only after every
required Day-0 decision below has a real value and the checks actually run.

Required evidence:

- Git SHA, CI run ID, timestamp, operator, Kubernetes context and namespace.
- Kubernetes version, CNI, Pod Security level, RuntimeClass and node-pool label.
- Runtime image repository and immutable digest; SBOM/signature references.
- StorageClass/RWX decision and workspace consistency result.
- Acquire, real OpenClaw turn, default-deny egress and storage probe logs.
- Model gateway/mock endpoint classification without recording secret material.
- Applied Pod/NetworkPolicy/RBAC manifests and cleanup confirmation.

No `<待定>`, dummy URL, dummy region, dummy RuntimeClass, real credential, or
tenant data is allowed when this gate becomes active.
