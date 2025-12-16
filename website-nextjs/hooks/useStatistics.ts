'use client'

import { useState, useEffect, useCallback } from 'react'
import { statisticsApi } from '@/lib/api'
import { getCache, setCache, CACHE_KEYS, CACHE_TTL, isCacheValid } from '@/lib/cache'

interface UseStatisticsOptions {
  condominiumId?: string
  enabled?: boolean
  refetchInterval?: number // Em milissegundos
}

export function useStatistics(options: UseStatisticsOptions = {}) {
  const { condominiumId, enabled = true, refetchInterval } = options
  const [stats, setStats] = useState<any>(null)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)
  const [lastFetch, setLastFetch] = useState<number | null>(null)

  // Determinar a chave do cache baseado no condominiumId
  const cacheKey = condominiumId 
    ? `${CACHE_KEYS.STATISTICS}_${condominiumId}`
    : CACHE_KEYS.STATISTICS_MASTER

  const loadStatistics = useCallback(async (force = false) => {
    if (!enabled) return

    // Verificar cache primeiro (se não for forçado)
    if (!force) {
      const cached = getCache<any>(cacheKey)
      if (cached) {
        setStats(cached)
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
      const data = await statisticsApi.get(condominiumId)
      
      // Salvar no cache
      setCache(cacheKey, data, CACHE_TTL.STATISTICS)
      
      setStats(data)
      setLastFetch(Date.now())
    } catch (err: any) {
      setError(err.response?.data?.message || err.message || 'Erro ao carregar estatísticas')
      
      // Se houver erro mas tivermos cache, manter os dados antigos
      if (!getCache<any>(cacheKey)) {
        setStats(null)
      }
    } finally {
      setLoading(false)
    }
  }, [condominiumId, enabled, cacheKey])

  // Carregar dados na montagem
  useEffect(() => {
    loadStatistics()
  }, [loadStatistics])

  // Auto-refetch se refetchInterval for definido
  useEffect(() => {
    if (!refetchInterval || !enabled) return

    const interval = setInterval(() => {
      // Só buscar se o cache expirou
      if (!isCacheValid(cacheKey)) {
        loadStatistics(true)
      }
    }, refetchInterval)

    return () => clearInterval(interval)
  }, [refetchInterval, enabled, cacheKey, loadStatistics])

  // Função para forçar atualização
  const refetch = useCallback(() => {
    loadStatistics(true)
  }, [loadStatistics])

  return {
    stats,
    loading,
    error,
    refetch,
    lastFetch,
    isStale: lastFetch ? !isCacheValid(cacheKey) : true,
  }
}

