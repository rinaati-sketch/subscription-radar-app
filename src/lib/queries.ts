import { useQuery, useQueryClient } from '@tanstack/react-query'
import { getSubscription, listSubscriptions } from './subscriptions'

// מטמון משותף לרשימה ולמסכים הבודדים: אחרי כל שינוי מרעננים את שניהם
export const keys = { all: ['subscriptions'] as const, one: (id: string) => ['subscriptions', id] as const }

export const useSubscriptions = () => useQuery({ queryKey: keys.all, queryFn: listSubscriptions })
export const useSubscription = (id: string) => useQuery({ queryKey: keys.one(id), queryFn: () => getSubscription(id) })

export function useRefresh() {
  const qc = useQueryClient()
  return () => qc.invalidateQueries({ queryKey: keys.all })
}
