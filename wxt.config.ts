import { defineConfig, type UserManifest } from 'wxt'
import tailwindcss from '@tailwindcss/vite'

export default defineConfig({
  modules: ['@wxt-dev/module-react', '@extport/wxt'],
  safari: {
    appCategory: 'public.app-category.productivity',
    bundleIdentifier: 'com.rxliuli.scrub',
    developmentTeam: 'N2X78TUUFG',
  },
  extport: {
    extension: 'ext_PMr2DskxRY5RG5JJCXlZ',
    // Daily anonymous usage ping + the Firefox data-collection declaration,
    // both injected by @extport/wxt — nothing in source. See the module docs.
    analytics: true,
  },
  vite: () => ({
    plugins: [tailwindcss()],
    resolve: {
      tsconfigPaths: true,
    },
  }),
  manifestVersion: 3,
  manifest: (env) => {
    const manifest: UserManifest = {
      name: 'Scrub - Clear Site Data',
      description:
        'One-click clear all site data (cookies, storage, cache) for the current website.',
      permissions: ['cookies', 'scripting', 'storage'],
      host_permissions: ['<all_urls>'],
      author: {
        email: 'rxliuli@gmail.com',
      },
      action: {
        default_icon: {
          '16': 'icon/16.png',
          '32': 'icon/32.png',
          '48': 'icon/48.png',
          '96': 'icon/96.png',
          '128': 'icon/128.png',
        },
      },
      homepage_url: 'https://rxliuli.com/project/scrub',
    }
    if (env.browser === 'firefox') {
      manifest.permissions = [...(manifest.permissions ?? []), 'browsingData']
      manifest.browser_specific_settings = {
        gecko: {
          id: 'scrub---clear-site-data@rxliuli.com',
          data_collection_permissions: {
            required: ['none'],
          },
        },
        gecko_android: {},
      }
      // https://developer.mozilla.org/en-US/docs/Mozilla/Add-ons/WebExtensions/manifest.json/author
      // @ts-expect-error
      manifest.author = 'rxliuli'
    }
    return manifest
  },
  hooks: {
    'build:manifestGenerated': (wxt, manifest) => {
      if (
        wxt.config.browser === 'safari' &&
        manifest.background &&
        'service_worker' in manifest.background
      ) {
        const sw = manifest.background.service_worker
        manifest.background = {
          scripts: [sw],
          persistent: false,
        } as any
      }
    },
  },
  webExt: {
    disabled: true,
  },
})
