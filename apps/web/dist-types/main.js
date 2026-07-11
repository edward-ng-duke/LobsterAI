import { jsx as _jsx } from "react/jsx-runtime";
import React from 'react';
import { createRoot } from 'react-dom/client';
import { WebAppShell } from './shell.js';
const rootElement = document.getElementById('root');
if (!rootElement)
    throw new Error('Missing #root element for the SaaS web application');
createRoot(rootElement).render(_jsx(React.StrictMode, { children: _jsx(WebAppShell, {}) }));
//# sourceMappingURL=main.js.map