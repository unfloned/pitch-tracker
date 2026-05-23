// Thin entry shim. Real wiring lives in `./app/index.ts` so window/tray/
// shortcuts can be split into focused files without rewiring electron-vite.
import './app/index';
