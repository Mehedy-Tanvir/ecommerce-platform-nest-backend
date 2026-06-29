import * as path from 'path';

// =====================================================================
// CRITICAL: Patch Node.js module resolution BEFORE any src/ imports load
// =====================================================================
// TypeScript compiles `import ... from 'src/...'` to `require('src/...')`.
// Node.js treats `src/...` as a bare module (looks in node_modules).
// We patch Module._resolveFilename to rewrite `src/...` to absolute paths.
// This MUST run before any module from `src/` is required.
// =====================================================================

const projectRoot = path.resolve(__dirname, '..');

// @ts-ignore — `module` is a built-in Node.js module, available at runtime
const Module = require('module');
const originalResolveFilename = Module._resolveFilename;

Module._resolveFilename = function (
  request: string,
  parent: any,
  isMain: boolean,
  options?: any,
) {
  if (request.startsWith('src/')) {
    request = path.join(projectRoot, request);
  }
  return originalResolveFilename.call(this, request, parent, isMain, options);
};

// =====================================================================
// Now safe to load src/ modules — the patch is already in place
// =====================================================================

// @ts-ignore — use require() to avoid TypeScript hoisting the import above the patch
const { createApp } = require('../src/create-app');

let handler: any;

export default async (req: any, res: any) => {
  if (!handler) {
    const app = await createApp();
    await app.init();
    const expressApp = app.getHttpAdapter().getInstance();
    // @ts-ignore — serverless-http is installed at build time on Vercel
    const { default: serverless } = await import('serverless-http');
    handler = serverless(expressApp);
  }
  return handler(req, res);
};
