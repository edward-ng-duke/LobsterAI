import { createClientBridge } from '@lobsterai/client-bridge';

const bridge = createClientBridge();

export const WebAppShell = (): JSX.Element => (
  <main data-bridge-availability={bridge.getAvailability()} data-lobsterai-app-shell="ready" />
);
