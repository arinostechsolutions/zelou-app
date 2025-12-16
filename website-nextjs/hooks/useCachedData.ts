'use client'

import { useState, useEffect, useCallback, useRef } from 'react'
import { getCache, setCache, CACHE_TTL, isCacheValid, removeCache } from '@/lib/cache'

interface UseCachedDataOptions<T> {
  cacheKey: string
  fetchFn: () => Promise<T>
  ttl?: number
  enabled?: boolean
  refetchInterval?: number
  dependencies?: any[] // Para invalidar quando dependências mudarem
}

export function useCachedData<T>(options: UseCachedDataOptions<T>) {
  const {
    cacheKey,
    fetchFn,
    ttl = CACHE_TTL.STATISTICS,
    enabled = true,
    refetchInterval,
    dependencies = [],
  } = options

  const [data, setData] = useState<T | null>(null)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)
  const [lastFetch, setLastFetch] = useState<number | null>(null)

  // Usar ref para manter a versão mais recente de fetchFn sem causar re-renders
  const fetchFnRef = useRef(fetchFn)
  useEffect(() => {
    fetchFnRef.current = fetchFn
  }, [fetchFn])

  const loadData = useCallback(
    async (force = false) => {
      if (!enabled) return

      // Verificar cache primeiro (se não for forçado)
      if (!force) {
        const cached = getCache<T>(cacheKey)
        if (cached) {
          setData(cached)
          setLoading(false)
          setError(null)
          setLastFetch(Date.now())

          // Se o cache ainda está válido, não precisa buscar novamente
          if (isCacheValid(cacheKey)) {
            return
          }
          // Se o cache expirou mas temos dados, mostrar os dados antigos enquanto busca novos
          setLoading(true)
        }
      }

      try {
        setError(null)
        // Usar ref para pegar a versão mais recente
        const fetchedData = await fetchFnRef.current()

        // Salvar no cache
        setCache(cacheKey, fetchedData, ttl)

        setData(fetchedData)
        setLastFetch(Date.now())
      } catch (err: any) {
        setError(err.response?.data?.message || err.message || 'Erro ao carregar dados')

        // Se houver erro mas tivermos cache, manter os dados antigos
        if (!getCache<T>(cacheKey)) {
          setData(null)
        }
      } finally {
        setLoading(false)
      }
    },
    [cacheKey, ttl, enabled]
  )

  // Carregar dados na montagem e quando cacheKey ou enabled mudarem
  useEffect(() => {
    if (enabled) {
      loadData()
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [cacheKey, enabled])

  // Auto-refetch se refetchInterval for definido
  useEffect(() => {
    if (!refetchInterval || !enabled) return

    const interval = setInterval(() => {
      // Só buscar se o cache expirou
      if (!isCacheValid(cacheKey)) {
        loadData(true)
      }
    }, refetchInterval)

    return () => clearInterval(interval)
  }, [refetchInterval, enabled, cacheKey, loadData])

  // Função para forçar atualização
  const refetch = useCallback(() => {
    loadData(true)
  }, [loadData])

  // Função para invalidar cache
  const invalidate = useCallback(() => {
    removeCache(cacheKey)
    setData(null)
    loadData(true)
  }, [cacheKey, loadData])

  return {
    data,
    loading,
    error,
    refetch,
    invalidate,
    lastFetch,
    isStale: lastFetch ? !isCacheValid(cacheKey) : true,
  }
}

