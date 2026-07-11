# LobsterAI Helm chart boundary

P00 freezes chart ownership and the sandbox template location. PR-3 activates
Helm lint, values schema, Deployments, Services, Ingress, ConfigMap/Secret,
NetworkPolicy, ResourceQuota, and production overlays. Empty Day-0 values are
explicitly required by templates rather than replaced with fake infrastructure.
