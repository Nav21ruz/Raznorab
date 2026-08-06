import { useEffect, useState } from 'react'

/** Откладывает применение значения на delay мс — чтобы не слать запрос на каждую букву при вводе поиска. */
export function useDebouncedValue<T>(value: T, delay = 400): T {
  const [debounced, setDebounced] = useState(value)

  useEffect(() => {
    const timer = setTimeout(() => setDebounced(value), delay)
    return () => clearTimeout(timer)
  }, [value, delay])

  return debounced
}
