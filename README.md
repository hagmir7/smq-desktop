# Electron + React + Tailwind + Ant Design Starter

A minimal but production-shaped desktop app scaffold:

- **Electron** (secure defaults: `contextIsolation: true`, `nodeIntegration: false`, `sandbox: true`)
- **React 18** via **Vite** (fast HMR in dev, static build for prod)
- **Tailwind CSS** (with `preflight` disabled so it doesn't fight Ant Design's own CSS reset — use Tailwind for layout/spacing utilities, Ant Design for components)
- **Ant Design v5** for the UI kit
- **electron-updater** wired end-to-end: main process checks for updates → downloads → notifies the renderer over IPC → user clicks "Restart and install"

## 1. Install

```bash
npm install
```

> Windows note (based on your usual setup): run this in a shell where `node`/`npm` are on PATH properly (Git Bash or a fresh CMD after any PATH edits). If `electron` or `electron-builder` postinstall steps fail with `proc_open`-type errors, retry from Git Bash rather than PowerShell.

## 2. Development

```bash
npm run dev
```

This runs Vite on `http://localhost:5173` and launches Electron pointed at it, with DevTools open. Hot reload works for the React side; edits to `electron/main.js` or `electron/preload.js` require restarting `npm run dev`.

## 3. Production build (no installer, just test the packaged app)

```bash
npm run build          # builds React -> dist/
npm run dist           # builds React + packages an installer/app via electron-builder
```

Platform-specific shortcuts: `npm run dist:win`, `npm run dist:mac`, `npm run dist:linux`.

Output lands in `release/`.

## 4. Auto-update setup

`electron-updater` needs a place to check for new versions. The `build.publish` block in `package.json` currently points at a placeholder:

```json
"publish": [
  { "provider": "generic", "url": "https://your-update-server.com/updates" }
]
```

Pick one:

- **GitHub Releases** (easiest, free): change the provider to
  ```json
  "publish": [{ "provider": "github", "owner": "yourname", "repo": "your-repo" }]
  ```
  Then `npm run publish` (needs a `GH_TOKEN` env var with `repo` scope) will build, create a draft release, and upload the installer + `latest.yml`.

- **Your own static host / cPanel** (fits your existing shared-hosting setups): keep `provider: "generic"`, point `url` at a directory you control, and after `npm run dist` upload everything in `release/` (the installer **and** the generated `latest.yml` / `latest-mac.yml` / `latest-linux.yml`) to that URL. `electron-updater` polls that URL for the YAML file to know if a newer version exists.

**Important:** auto-update only activates in packaged, non-dev builds (`isDev` check in `electron/main.js` skips it), and unsigned Windows/macOS builds will show a security prompt at least once — code signing removes that but isn't required for updates to function.

## 5. Where things live

```
electron/
  main.js       # app lifecycle, window creation, autoUpdater wiring, IPC handlers
  preload.js    # contextBridge: exposes window.appInfo and window.updater to React
src/
  main.jsx      # React root + Ant Design ConfigProvider (theme tokens)
  App.jsx       # Layout shell (Header/Sider/Content) + menu
  components/
    Dashboard.jsx       # Sample screen mixing antd components + Tailwind utility classes
    UpdateNotifier.jsx  # Listens for update:* IPC events, shows antd notifications/progress
```

## 6. Bumping the version for a new release

Update `"version"` in `package.json`, then `npm run publish`. Clients running the previous version will pick up the update automatically on their next check (launch + every 4 hours, per the `setInterval` in `main.js`).
