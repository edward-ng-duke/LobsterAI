# Runtime orchestrator application boundary

This independently deployable process is the only future owner of Kubernetes
runtime write privileges. P00 exposes a health endpoint and validates local
listen configuration; it does not create Pods, acquire leases, or implement
sandbox lifecycle behavior.

Production runtime Pods have no public-internet access. No package install,
model-provider call, browser fetch, or tool download may be introduced here.
