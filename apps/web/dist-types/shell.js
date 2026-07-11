import { jsx as _jsx } from "react/jsx-runtime";
import { createClientBridge } from '@lobsterai/client-bridge';
const bridge = createClientBridge();
export const WebAppShell = () => (_jsx("main", { "data-bridge-availability": bridge.getAvailability(), "data-lobsterai-app-shell": "ready" }));
//# sourceMappingURL=shell.js.map