import { defineManifest } from '@crxjs/vite-plugin'

export default defineManifest({
  manifest_version: 3,
  name: 'ClientPin',
  version: '0.1.0',
  action: { default_popup: 'index.html' },
  permissions: ['storage', 'activeTab', 'scripting', 'tabs'],
  host_permissions: ['<all_urls>'],
  background: { service_worker: 'src/background.ts', type: 'module' },
  content_scripts: [{ matches: ['<all_urls>'], js: ['src/content.tsx'] }],
})
