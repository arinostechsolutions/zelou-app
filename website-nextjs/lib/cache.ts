/**
 * Sistema de cache para persistir dados e evitar chamadas desnecessárias à API
 */

interface CacheEntry<T> {
  data: T
  timestamp: number
  ttl: number // Time To Live em milissegundos
}

const CACHE_PREFIX = 'zelou_cache_'
const DEFAULT_TTL = 5 * 60 * 1000 // 5 minutos por padrão

/**
 * Salva dados no cache
 */
export function setCache<T>(key: string, data: T, ttl: number = DEFAULT_TTL): void {
  if (typeof window === 'undefined') return

  const entry: CacheEntry<T> = {
    data,
    timestamp: Date.now(),
    ttl,
  }

  try {
    localStorage.setItem(`${CACHE_PREFIX}${key}`, JSON.stringify(entry))
  } catch (error) {
    console.warn('Erro ao salvar no cache:', error)
    // Se o localStorage estiver cheio, limpar caches antigos
    clearExpiredCache()
  }
}

/**
 * Recupera dados do cache
 */
export function getCache<T>(key: string): T | null {
  if (typeof window === 'undefined') return null

  try {
    const cached = localStorage.getItem(`${CACHE_PREFIX}${key}`)
    if (!cached) return null

    const entry: CacheEntry<T> = JSON.parse(cached)
    const now = Date.now()

    // Verificar se o cache expirou
    if (now - entry.timestamp > entry.ttl) {
      localStorage.removeItem(`${CACHE_PREFIX}${key}`)
      return null
    }

    return entry.data
  } catch (error) {
    console.warn('Erro ao recuperar do cache:', error)
    return null
  }
}

/**
 * Remove um item específico do cache
 */
export function removeCache(key: string): void {
  if (typeof window === 'undefined') return
  localStorage.removeItem(`${CACHE_PREFIX}${key}`)
}

/**
 * Limpa todos os caches expirados
 */
export function clearExpiredCache(): void {
  if (typeof window === 'undefined') return

  const keys = Object.keys(localStorage)
  const now = Date.now()

  keys.forEach((key) => {
    if (key.startsWith(CACHE_PREFIX)) {
      try {
        const cached = localStorage.getItem(key)
        if (cached) {
          const entry: CacheEntry<any> = JSON.parse(cached)
          if (now - entry.timestamp > entry.ttl) {
            localStorage.removeItem(key)
          }
        }
      } catch (error) {
        // Se houver erro ao parsear, remover o item
        localStorage.removeItem(key)
      }
    }
  })
}

/**
 * Limpa todo o cache
 */
export function clearAllCache(): void {
  if (typeof window === 'undefined') return

  const keys = Object.keys(localStorage)
  keys.forEach((key) => {
    if (key.startsWith(CACHE_PREFIX)) {
      localStorage.removeItem(key)
    }
  })
}

/**
 * Verifica se o cache está válido (não expirado)
 */
export function isCacheValid(key: string): boolean {
  if (typeof window === 'undefined') return false

  try {
    const cached = localStorage.getItem(`${CACHE_PREFIX}${key}`)
    if (!cached) return false

    const entry: CacheEntry<any> = JSON.parse(cached)
    const now = Date.now()

    return now - entry.timestamp <= entry.ttl
  } catch {
    return false
  }
}

/**
 * Chaves de cache padronizadas
 */
export const CACHE_KEYS = {
  STATISTICS: 'statistics',
  STATISTICS_MASTER: 'statistics_master',
  REPORTS: 'reports',
  RESERVATIONS: 'reservations',
  DELIVERIES: 'deliveries',
  USERS: 'users',
} as const

/**
 * TTLs específicos por tipo de dado
 */
export const CACHE_TTL = {
  STATISTICS: 5 * 60 * 1000, // 5 minutos - estatísticas mudam pouco
  REPORTS: 2 * 60 * 1000, // 2 minutos - relatórios podem mudar mais
  RESERVATIONS: 2 * 60 * 1000, // 2 minutos
  DELIVERIES: 2 * 60 * 1000, // 2 minutos
  USERS: 10 * 60 * 1000, // 10 minutos - usuários mudam raramente
} as const

