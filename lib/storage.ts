// @ts-ignore
import { MMKV } from 'react-native-mmkv'

let storage: any = null

try {
  // @ts-ignore
  storage = new MMKV({ id: 'sahibak-storage' })
} catch (e) {
  console.warn('MMKV not available:', e)
}

export { storage }

export const mmkvStorage = {
  getItem: (key: string) => storage?.getString(key) ?? null,
  setItem: (key: string, value: string) => storage?.set(key, value),
  removeItem: (key: string) => storage?.delete(key),
}
