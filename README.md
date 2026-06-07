# Scrub - Clear Site Data

One-click clear all site data for the current website. Supports cookies, localStorage, sessionStorage, IndexedDB, Cache Storage, and OPFS.

## Install

- [Chrome Web Store](https://chromewebstore.google.com/detail/scrub-clear-site-data/jmaeelmmfcjjbgehpkoknomjnimcjmfc)
- [Firefox Add-ons](https://addons.mozilla.org/firefox/addon/scrub-clear-site-data/)
- [Safari (Mac App Store)](https://apps.apple.com/app/scrub-clear-site-data/id6775834119)

## Usage

Click the extension icon in the toolbar — all site data for the current tab is cleared immediately. No confirmation dialog, no popup, just one click.

## Development

```sh
pnpm i
pnpm dev
```

Load the extension from `.output/chrome-mv3-dev` in `chrome://extensions` (Developer mode).

## Build

```sh
pnpm zip              # Chrome/Edge
pnpm zip:firefox      # Firefox
pnpm build:safari     # Safari (requires macOS + Xcode)
```
