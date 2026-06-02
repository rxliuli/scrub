import { defineExtensionMessaging } from '@webext-core/messaging'

export interface CookieEraseResult {
  cookies: number
  browsingData: boolean
}

export const messager = defineExtensionMessaging<{
  eraseCookies(): CookieEraseResult
}>()
