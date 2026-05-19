import { MMKV } from 'react-native-mmkv'

let storage: MMKV | null = null

try {
  storage = new MMKV({ id: 'sahibak-storage' })
} catch (e) {
  console.warn('MMKV not available:', e)
}

export { storage }
