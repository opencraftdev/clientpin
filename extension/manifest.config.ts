import { defineManifest } from '@crxjs/vite-plugin'

export default defineManifest({
  manifest_version: 3,
  name: 'ClientPin',
  version: '0.1.0',
  icons: { 16: 'icon16.png', 32: 'icon32.png', 48: 'icon48.png', 128: 'icon128.png' },
  action: { default_popup: 'index.html', default_icon: { 16: 'icon16.png', 32: 'icon32.png', 48: 'icon48.png', 128: 'icon128.png' } },
  permissions: ['storage', 'activeTab', 'scripting', 'tabs'],
  host_permissions: ['<all_urls>'],
  background: { service_worker: 'src/background.ts', type: 'module' },
  content_scripts: [{ matches: ['<all_urls>'], js: ['src/content.tsx'] }],
})
