---
name: Imported frontend workflow permissions
description: Imported npm dependencies may lose executable bits in Replit workflows.
---

When an imported frontend's Vite executable is not runnable, invoke Vite through Node (`node node_modules/vite/bin/vite.js`) instead of relying on the `.bin` executable shim.

**Why:** Replit's npm install can leave imported `node_modules/.bin` files without executable permissions, causing the webview workflow to fail before the app starts.

**How to apply:** If a Vite workflow reports “Permission denied” for `node_modules/.bin/vite`, change only the workflow command to use the Vite entrypoint with `node`; keep the project's existing React/Vite structure.