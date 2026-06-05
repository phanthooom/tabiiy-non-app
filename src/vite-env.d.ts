/// <reference types="vite/client" />

interface ImportMetaEnv {
  /** JWT for local browser dev. When set in DEV, enables Mode A (skips Telegram bootstrap). */
  readonly VITE_DEV_ACCESS_TOKEN?: string
  /** Vite dev-server proxy target for /api (e.g. http://localhost:8001). */
  readonly VITE_BACKEND_PROXY?: string
}
