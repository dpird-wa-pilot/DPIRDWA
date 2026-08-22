// [CC-005] analyticsEngine.js

/** Promedio de un array de números. Retorna 0 si vacío. */
export const avg = (arr) =>
  arr.length ? arr.reduce((a, b) => a + b, 0) / arr.length : 0

/** Agrupa array de objetos por clave. */
export const groupBy = (arr, key) =>
  arr.reduce((acc, item) => {
    const k = item[key]
    if (!acc[k]) acc[k] = []
    acc[k].push(item)
    return acc
  }, {})

/** Cuenta frecuencia de cada valor en array de strings. */
export const countFrequency = (arr) =>
  arr.reduce((acc, val) => {
    acc[val] = (acc[val] ?? 0) + 1
    return acc
  }, {})

/**
 * Trend semanal: compara última semana vs semana anterior.
 * Retorna 'up' | 'stable' | 'down'.
 */
export const weeklyTrend = (results, dateField) => {
  const now         = new Date()
  const oneWeekAgo  = new Date(now); oneWeekAgo.setDate(now.getDate() - 7)
  const twoWeeksAgo = new Date(now); twoWeeksAgo.setDate(now.getDate() - 14)

  const thisWeek = results.filter(r => new Date(r[dateField]) >= oneWeekAgo).length
  const lastWeek = results.filter(r => {
    const d = new Date(r[dateField])
    return d >= twoWeeksAgo && d < oneWeekAgo
  }).length

  if (thisWeek > lastWeek * 1.1) return 'up'
  if (thisWeek < lastWeek * 0.9) return 'down'
  return 'stable'
}

/** Etiqueta ISO week a partir de timestamp. Ej: "2026-W33". */
export const getISOWeekLabel = (dateStr) => {
  const d    = new Date(dateStr)
  const year = d.getFullYear()
  const start = new Date(year, 0, 1)
  const week  = Math.ceil(((d - start) / 86400000 + start.getDay() + 1) / 7)
  return `${year}-W${String(week).padStart(2, '0')}`
}
