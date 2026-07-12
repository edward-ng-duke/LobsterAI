import { accessSync, constants } from 'node:fs';

accessSync('/tmp/lobster-worker-ready', constants.R_OK);
