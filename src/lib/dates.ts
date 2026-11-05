/** The last `n` days, oldest first, ending with today */
export function lastNDays(n: number): Date[] {
  return Array.from({ length: n }, (_, i) => {
    const d = new Date()
    d.setDate(d.getDate() - (n - 1 - i))
    return d
  })
}

export const currentYear = () => new Date().getFullYear()
