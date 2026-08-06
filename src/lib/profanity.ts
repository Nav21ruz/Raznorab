// Паттерны хранятся в БД в POSIX-синтаксисе Postgres (\m \M \y — границы слова).
// JS-эквивалент \b границы слова НЕ подходит: \b в JS определяется только через
// ASCII \w и не считает кириллические буквы "словесными символами", поэтому
// \bслово\b никогда не сработает на русском тексте. Вместо \b используем
// lookaround-проверки на базе \p{L}/\p{N} (юникодные классы, нужен флаг 'u').
const WORD_CHAR = '\\p{L}\\p{N}_'
const START_BOUNDARY = `(?<![${WORD_CHAR}])`
const END_BOUNDARY = `(?![${WORD_CHAR}])`

function toJsRegExp(pgPattern: string): RegExp {
  const jsPattern = pgPattern
    .replace(/\\m/g, START_BOUNDARY)
    .replace(/\\M/g, END_BOUNDARY)
    // \y — граница с любой стороны в Postgres; на практике стоит там же, где
    // ставили бы \m или \M, поэтому подходит проверка "старт ИЛИ конец слова"
    .replace(/\\y/g, `(?:${START_BOUNDARY}|${END_BOUNDARY})`)
  return new RegExp(jsPattern, 'giu')
}

export function containsProfanity(text: string, patterns: string[]): boolean {
  return patterns.some((pattern) => {
    try {
      return toJsRegExp(pattern).test(text)
    } catch {
      return false
    }
  })
}

export function maskProfanity(text: string, patterns: string[]): string {
  let result = text
  for (const pattern of patterns) {
    try {
      result = result.replace(toJsRegExp(pattern), '***')
    } catch {
      // некорректный паттерн — пропускаем, чтобы не ломать ввод пользователя
    }
  }
  return result
}
