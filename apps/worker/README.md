# Worker application boundary

This deployable will host asynchronous jobs and scheduled-task consumers. P00
provides only a start/stop lifecycle shell. It deliberately has no queue
adapter or business job implementation.

Production workers operate without public-internet access. Runtime dependencies
must be baked into the image or supplied by an approved internal source.
