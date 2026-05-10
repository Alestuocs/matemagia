// src/lib/mathTutor.js — Smart rule-based math tutor for Chilean elementary school (grades 1-6)

// ── Utility helpers ───────────────────────────────────────────────────────────

function rand(arr) { return arr[Math.floor(Math.random() * arr.length)] }

const ENCOURAGEMENTS = [
  '¡Muy bien! 🌟', '¡Excelente trabajo! 🚀', '¡Sigue así! 💪',
  '¡Eres increíble! ✨', '¡Lo lograste! 🎉', '¡Fantástico! 🔥',
]

function encourage() { return rand(ENCOURAGEMENTS) }

function gcd(a, b) {
  a = Math.abs(a); b = Math.abs(b)
  while (b) { [a, b] = [b, a % b] }
  return a || 1
}

function simplifyFraction(num, den) {
  if (den === 0) return { num, den }
  const g = gcd(Math.abs(num), Math.abs(den))
  const sign = den < 0 ? -1 : 1
  return { num: sign * num / g, den: sign * den / g }
}

function fractionStr(num, den) {
  const s = simplifyFraction(num, den)
  if (s.den === 1) return `${s.num}`
  return `${s.num}/${s.den}`
}

function isPerfectSquare(n) {
  const r = Math.round(Math.sqrt(n))
  return r * r === n
}

/** Extract all real numbers (including decimals with comma or dot) from text */
function extractNumbers(text) {
  return (text.match(/-?\d+(?:[.,]\d+)?/g) || []).map(n => parseFloat(n.replace(',', '.')))
}

/** Normalise Spanish text for matching */
function norm(text) {
  return text
    .toLowerCase()
    .normalize('NFD').replace(/[̀-ͯ]/g, '')  // strip accents
    .replace(/[¿¡]/g, '')
}

// ── Problem type detection ────────────────────────────────────────────────────

const PATTERNS = {
  geometry:     /area|perimetro|perimeter|rectangulo|cuadrado|triangulo|circulo|radio|base|altura|lado/,
  percentage:   /porcent|%|tanto por ciento|cuanto es el \d|que porcentaje/,
  power:        /potencia|elevado|cuadrado de|\^|al cuadrado|al cubo|raiz|raíz/,
  fraction:     /fraccion|fracción|numerador|denominador|\/\d|simplific|mitad|tercio|cuarto/,
  algebra:      /[a-z]\s*[+\-*\/]\s*\d|\d\s*[a-z]\s*=|\bx\b.*=|ecuacion|ecuación|despejar|incognita|incógnita/,
  decimal:      /decimal|coma|,\d|\d,\d|\d\.\d/,
  wordproblem:  /tiene|habia|había|reparte|compra|vende|gana|pierde|quedan|total|cuantos|cuántos|cuantas|cuántas|problema|si.*entonces/,
  division:     /divid|÷|entre|reparti|cuanto cabe|[\d\s]\/[\d\s]/,
  multiplication:/multiplic|producto|veces|×|por|\*/,
  subtraction:  /rest|menos|-\s*\d|\d\s*-/,
  addition:     /suma|más|mas|\+|agrega/,
}

function detectType(text) {
  const n = norm(text)
  for (const [type, re] of Object.entries(PATTERNS)) {
    if (re.test(n)) return type
  }
  return 'general'
}

// ── Direct expression evaluator (e.g. "3 + 4", "12 / 4", "7 * 8") ───────────

function tryDirectExpression(text) {
  // Match patterns like: 3 + 4, 12.5 - 3, 7 * 8, 100 / 4
  const m = text.match(/(-?\d+(?:[.,]\d+)?)\s*([+\-×÷*\/])\s*(-?\d+(?:[.,]\d+)?)/)
  if (!m) return null
  const a = parseFloat(m[1].replace(',', '.'))
  const op = m[2]
  const b = parseFloat(m[3].replace(',', '.'))
  return { a, op, b }
}

// ── Individual solvers ────────────────────────────────────────────────────────

function solveArithmetic(text) {
  const expr = tryDirectExpression(text)
  if (!expr) return null
  const { a, op, b } = expr

  const opMap = { '+': 'suma', '-': 'resta', '×': 'multiplicación', '*': 'multiplicación', '÷': 'división', '/': 'división' }
  const opName = opMap[op] || op

  if ((op === '/' || op === '÷') && b === 0) {
    return { steps: ['No se puede dividir entre cero.'], answer: 'Indefinido' }
  }

  let result, steps

  if (op === '+') {
    result = a + b
    steps = [
      `Operación: **${a} + ${b}**`,
      `Alineamos los números por las unidades y sumamos de derecha a izquierda.`,
      `Si la suma de alguna columna supera 9, llevamos 1 a la siguiente columna.`,
      `**${a} + ${b} = ${result}**`,
    ]
  } else if (op === '-') {
    result = a - b
    steps = [
      `Operación: **${a} - ${b}**`,
      `Alineamos los números y restamos de derecha a izquierda.`,
      `Si un dígito es menor que el que se resta, pedimos prestado a la columna siguiente.`,
      `**${a} - ${b} = ${result}**`,
    ]
  } else if (op === '*' || op === '×') {
    result = a * b
    const ai = Number.isInteger(a), bi = Number.isInteger(b)
    if (ai && bi && a <= 12 && b <= 12) {
      steps = [
        `Operación: **${a} × ${b}**`,
        `La multiplicación es una suma repetida: sumar ${a} exactamente ${b} veces.`,
        `O bien: sumar ${b} exactamente ${a} veces.`,
        `**${a} × ${b} = ${result}**`,
      ]
    } else {
      steps = [
        `Operación: **${a} × ${b}**`,
        `Multiplicamos normalmente. Si hay decimales, contamos los decimales de ambos factores y los aplicamos al resultado.`,
        `**${a} × ${b} = ${result}**`,
      ]
    }
  } else {
    const q = Math.floor(a / b)
    const r = Math.round((a - q * b) * 1e10) / 1e10
    if (Number.isInteger(a) && Number.isInteger(b)) {
      result = r === 0 ? q : `${q} con resto ${r}`
      steps = [
        `Operación: **${a} ÷ ${b}**`,
        `Preguntamos: ¿Cuántas veces cabe ${b} en ${a}?`,
        `${b} × ${q} = ${b * q}`,
        `Resto: ${a} - ${b * q} = ${r}`,
        r === 0
          ? `**${a} ÷ ${b} = ${q}** (división exacta)`
          : `**${a} ÷ ${b} = ${q}** con resto **${r}**`,
      ]
    } else {
      result = Math.round((a / b) * 1e10) / 1e10
      steps = [
        `Operación: **${a} ÷ ${b}**`,
        `**${a} ÷ ${b} = ${result}**`,
      ]
    }
  }

  return { steps, answer: String(result), opName }
}

function solveFraction(text) {
  const n = norm(text)

  // Simplify: e.g. "simplifica 6/8" or "6/8 simplificada"
  let m = text.match(/(\d+)\s*\/\s*(\d+)/)
  if (!m) return null
  const num1 = parseInt(m[1]), den1 = parseInt(m[2])

  // Detect operation with two fractions: a/b op c/d
  const twoFrac = text.match(/(\d+)\s*\/\s*(\d+)\s*([+\-×*xXpP÷\/])\s*(\d+)\s*\/\s*(\d+)/)
  if (twoFrac) {
    const a = parseInt(twoFrac[1]), b = parseInt(twoFrac[2])
    const opRaw = twoFrac[3]
    const c = parseInt(twoFrac[4]), d = parseInt(twoFrac[5])
    let rNum, rDen, steps

    const isAdd = /[+]|mas|más|suma/.test(opRaw) || n.includes('suma')
    const isSub = /[-]|resto|resta/.test(opRaw) || n.includes('rest')
    const isMul = /[×*xXpP]|multiplic|veces/.test(opRaw) || n.includes('multiplic')
    const isDiv = /[÷\/]|divid|entre/.test(opRaw) || n.includes('divid')

    if (isAdd || (!isSub && !isMul && !isDiv && opRaw === '+')) {
      rNum = a * d + c * b; rDen = b * d
      const s = simplifyFraction(rNum, rDen)
      steps = [
        `Sumar fracciones: **${a}/${b} + ${c}/${d}**`,
        `Buscamos denominador común: ${b} × ${d} = ${b * d}`,
        `Convertimos: ${a}/${b} = ${a * d}/${b * d}  y  ${c}/${d} = ${c * b}/${b * d}`,
        `Sumamos numeradores: ${a * d} + ${c * b} = ${rNum}`,
        `Resultado: ${rNum}/${rDen}`,
        s.den !== rDen ? `Simplificado: **${s.num}/${s.den}**` : `**Resultado final: ${fractionStr(rNum, rDen)}**`,
      ]
    } else if (isSub) {
      rNum = a * d - c * b; rDen = b * d
      const s = simplifyFraction(rNum, rDen)
      steps = [
        `Restar fracciones: **${a}/${b} - ${c}/${d}**`,
        `Denominador común: ${b} × ${d} = ${b * d}`,
        `Convertimos: ${a * d}/${b * d} - ${c * b}/${b * d}`,
        `Restamos numeradores: ${a * d} - ${c * b} = ${rNum}`,
        s.den !== rDen ? `Simplificado: **${s.num}/${s.den}**` : `**Resultado final: ${fractionStr(rNum, rDen)}**`,
      ]
    } else if (isMul) {
      rNum = a * c; rDen = b * d
      const s = simplifyFraction(rNum, rDen)
      steps = [
        `Multiplicar fracciones: **${a}/${b} × ${c}/${d}**`,
        `Multiplicamos numerador × numerador y denominador × denominador:`,
        `${a} × ${c} = ${rNum}   |   ${b} × ${d} = ${rDen}`,
        s.den !== rDen ? `Simplificado: **${s.num}/${s.den}**` : `**Resultado: ${fractionStr(rNum, rDen)}**`,
      ]
    } else {
      // Division
      rNum = a * d; rDen = b * c
      const s = simplifyFraction(rNum, rDen)
      steps = [
        `Dividir fracciones: **${a}/${b} ÷ ${c}/${d}**`,
        `Dividir es igual que multiplicar por el inverso: **${a}/${b} × ${d}/${c}**`,
        `${a} × ${d} = ${rNum}   |   ${b} × ${c} = ${rDen}`,
        s.den !== rDen ? `Simplificado: **${s.num}/${s.den}**` : `**Resultado: ${fractionStr(rNum, rDen)}**`,
      ]
    }
    return { steps, answer: fractionStr(rNum, rDen) }
  }

  // Compare two fractions
  if (n.includes('mayor') || n.includes('menor') || n.includes('compara') || n.includes('cual es mas')) {
    const twoM = text.match(/(\d+)\/(\d+).*?(\d+)\/(\d+)/)
    if (twoM) {
      const a = parseInt(twoM[1]), b = parseInt(twoM[2])
      const c = parseInt(twoM[3]), d = parseInt(twoM[4])
      const cross1 = a * d, cross2 = c * b
      const result = cross1 > cross2 ? `${a}/${b}` : cross1 < cross2 ? `${c}/${d}` : 'Son iguales'
      return {
        steps: [
          `Comparar **${a}/${b}** y **${c}/${d}**`,
          `Multiplicamos en cruz: ${a} × ${d} = ${cross1}   y   ${c} × ${b} = ${cross2}`,
          cross1 > cross2 ? `${cross1} > ${cross2}, entonces **${a}/${b} > ${c}/${d}**` :
          cross1 < cross2 ? `${cross1} < ${cross2}, entonces **${a}/${b} < ${c}/${d}**` :
          `${cross1} = ${cross2}, las fracciones son **iguales**`,
        ],
        answer: result,
      }
    }
  }

  // Simplify single fraction
  const s = simplifyFraction(num1, den1)
  const g = gcd(num1, den1)
  return {
    steps: [
      `Simplificar: **${num1}/${den1}**`,
      `Buscamos el Máximo Común Divisor (MCD) de ${num1} y ${den1}.`,
      `MCD(${num1}, ${den1}) = ${g}`,
      `Dividimos numerador y denominador por ${g}:`,
      `${num1} ÷ ${g} = ${s.num}   |   ${den1} ÷ ${g} = ${s.den}`,
      g === 1 ? `La fracción **${num1}/${den1}** ya está simplificada.` : `**Resultado: ${s.num}/${s.den}**`,
    ],
    answer: `${s.num}/${s.den}`,
  }
}

function solvePercentage(text) {
  const nums = extractNumbers(text)
  const n = norm(text)

  // "¿Qué % es X de Y?" or "qué porcentaje es X de Y"
  const whatPct = n.match(/que porcentaje.*?(\d+).*?(\d+)|(\d+).*?es de.*?(\d+)/)
  if (whatPct || n.includes('que porcentaje')) {
    if (nums.length >= 2) {
      const [part, total] = nums
      const pct = Math.round((part / total) * 10000) / 100
      return {
        steps: [
          `¿Qué porcentaje es **${part}** de **${total}**?`,
          `Fórmula: (parte ÷ total) × 100`,
          `(${part} ÷ ${total}) × 100`,
          `= ${part / total} × 100`,
          `**= ${pct}%**`,
        ],
        answer: `${pct}%`,
      }
    }
  }

  // "X% de Y" pattern
  if (nums.length >= 2) {
    let pct, num
    // Detect order: "30% de 200" vs "el 30 de 200"
    const pctFirst = /(\d+)\s*%\s*de\s*(\d+)/.exec(text)
    if (pctFirst) {
      pct = parseFloat(pctFirst[1])
      num = parseFloat(pctFirst[2])
    } else {
      [pct, num] = nums
    }
    const result = Math.round((pct / 100) * num * 10000) / 10000
    return {
      steps: [
        `Calcular el **${pct}%** de **${num}**`,
        `Fórmula: (porcentaje ÷ 100) × número`,
        `(${pct} ÷ 100) × ${num}`,
        `= ${pct / 100} × ${num}`,
        `**= ${result}**`,
        `💡 Trucos rápidos: 10% = dividir por 10 | 50% = dividir por 2 | 25% = dividir por 4`,
      ],
      answer: `${result}`,
    }
  }

  return null
}

function solvePower(text) {
  const n = norm(text)

  // Square root: "raíz de 49", "√49"
  const sqrtMatch = text.match(/(?:raiz|raíz|√)\s*(?:de\s*)?(\d+)/i) || text.match(/√\s*(\d+)/)
  if (sqrtMatch) {
    const num = parseInt(sqrtMatch[1])
    const root = Math.sqrt(num)
    const exact = isPerfectSquare(num)
    return {
      steps: [
        `Raíz cuadrada de **${num}**`,
        `La raíz cuadrada busca el número que multiplicado por sí mismo da ${num}.`,
        exact
          ? `${Math.round(root)} × ${Math.round(root)} = ${num}  ✅`
          : `${num} no es un cuadrado perfecto. √${num} ≈ **${Math.round(root * 100) / 100}**`,
      ],
      answer: exact ? String(Math.round(root)) : `≈ ${Math.round(root * 100) / 100}`,
    }
  }

  // Power: "3 elevado a 4", "2^5", "al cuadrado", "al cubo"
  const powMatch = text.match(/(\d+)\s*(?:elevado\s*a\s*la?\s*)?(?:\^|al\s*)?\s*(\d+)/) ||
                   text.match(/(\d+)\s*\^\s*(\d+)/)
  if (powMatch) {
    const base = parseInt(powMatch[1]), exp = parseInt(powMatch[2])
    const result = Math.pow(base, exp)
    const mulSteps = Array.from({ length: exp }, (_, i) => `× ${base}`).join(' ')
    return {
      steps: [
        `Potencia: **${base}^${exp}** (${base} elevado a la ${exp})`,
        `Una potencia es una multiplicación repetida:`,
        `${base}^${exp} = ${base} ${mulSteps.slice(2)}`,
        `= **${result}**`,
      ],
      answer: String(result),
    }
  }

  return null
}

function solveAlgebra(text) {
  // Patterns: 2x + 3 = 7, x/4 = 5, 3x - 1 = 8, x + a = b, a - x = b
  let m

  // ax + b = c  or  ax - b = c
  m = text.match(/(-?\d*)\s*[xX]\s*([+\-])\s*(\d+)\s*=\s*(-?\d+)/i)
  if (m) {
    const a = m[1] === '' || m[1] === '+' ? 1 : m[1] === '-' ? -1 : parseInt(m[1])
    const sign = m[2] === '+' ? 1 : -1
    const b = sign * parseInt(m[3])
    const c = parseInt(m[4])
    const x = (c - b) / a
    return {
      steps: [
        `Ecuación: **${a === 1 ? '' : a}x ${m[2]} ${parseInt(m[3])} = ${c}**`,
        `Para despejar x, realizamos la operación inversa en ambos lados.`,
        `Pasamos ${m[2] === '+' ? '+' : '-'}${parseInt(m[3])} al otro lado:`,
        `${a === 1 ? '' : a}x = ${c} ${sign > 0 ? '-' : '+'} ${parseInt(m[3])}`,
        `${a === 1 ? '' : a}x = ${c - b}`,
        a !== 1 ? `Dividimos por ${a}: x = ${c - b} ÷ ${a} = **${x}**` : `**x = ${x}**`,
      ],
      answer: `x = ${x}`,
    }
  }

  // x + a = b  (simple)
  m = text.match(/[xX]\s*\+\s*(\d+)\s*=\s*(-?\d+)/i)
  if (m) {
    const a = parseInt(m[1]), b = parseInt(m[2])
    return {
      steps: [
        `Ecuación: **x + ${a} = ${b}**`,
        `Restamos ${a} de ambos lados:`,
        `x + ${a} - ${a} = ${b} - ${a}`,
        `**x = ${b - a}**`,
      ],
      answer: `x = ${b - a}`,
    }
  }

  // x - a = b
  m = text.match(/[xX]\s*-\s*(\d+)\s*=\s*(-?\d+)/i)
  if (m) {
    const a = parseInt(m[1]), b = parseInt(m[2])
    return {
      steps: [
        `Ecuación: **x - ${a} = ${b}**`,
        `Sumamos ${a} a ambos lados:`,
        `x - ${a} + ${a} = ${b} + ${a}`,
        `**x = ${b + a}**`,
      ],
      answer: `x = ${b + a}`,
    }
  }

  // ax = b  or  a*x = b
  m = text.match(/(-?\d+)\s*[*×]?\s*[xX]\s*=\s*(-?\d+)/i)
  if (m) {
    const a = parseInt(m[1]), b = parseInt(m[2])
    const x = b / a
    return {
      steps: [
        `Ecuación: **${a}x = ${b}**`,
        `Dividimos ambos lados por ${a}:`,
        `${a}x ÷ ${a} = ${b} ÷ ${a}`,
        `**x = ${x}**`,
      ],
      answer: `x = ${x}`,
    }
  }

  // x/a = b
  m = text.match(/[xX]\s*\/\s*(\d+)\s*=\s*(-?\d+)/i)
  if (m) {
    const a = parseInt(m[1]), b = parseInt(m[2])
    return {
      steps: [
        `Ecuación: **x / ${a} = ${b}**`,
        `Multiplicamos ambos lados por ${a}:`,
        `x = ${b} × ${a}`,
        `**x = ${b * a}**`,
      ],
      answer: `x = ${b * a}`,
    }
  }

  return null
}

function solveGeometry(text) {
  const n = norm(text)
  const nums = extractNumbers(text)

  // Rectangle area: base and altura
  if ((n.includes('rectangulo') || n.includes('area')) && nums.length >= 2) {
    if (n.includes('perimetro') || n.includes('perimeter')) {
      const [base, altura] = nums
      const p = 2 * (base + altura)
      return {
        steps: [
          `Perímetro del rectángulo con base **${base}** y altura **${altura}**`,
          `Fórmula: P = 2 × (base + altura)`,
          `P = 2 × (${base} + ${altura})`,
          `P = 2 × ${base + altura}`,
          `**P = ${p}**`,
        ],
        answer: String(p),
      }
    }
    const [base, altura] = nums
    const area = base * altura
    return {
      steps: [
        `Área del rectángulo con base **${base}** y altura **${altura}**`,
        `Fórmula: A = base × altura`,
        `A = ${base} × ${altura}`,
        `**A = ${area}**`,
      ],
      answer: String(area),
    }
  }

  // Square
  if (n.includes('cuadrado') && nums.length >= 1) {
    const lado = nums[0]
    if (n.includes('perimetro')) {
      return {
        steps: [
          `Perímetro del cuadrado con lado **${lado}**`,
          `Fórmula: P = 4 × lado`,
          `P = 4 × ${lado} = **${4 * lado}**`,
        ],
        answer: String(4 * lado),
      }
    }
    return {
      steps: [
        `Área del cuadrado con lado **${lado}**`,
        `Fórmula: A = lado × lado = lado²`,
        `A = ${lado} × ${lado} = **${lado * lado}**`,
      ],
      answer: String(lado * lado),
    }
  }

  // Triangle area
  if (n.includes('triangulo') && nums.length >= 2) {
    const [base, altura] = nums
    const area = (base * altura) / 2
    return {
      steps: [
        `Área del triángulo con base **${base}** y altura **${altura}**`,
        `Fórmula: A = (base × altura) / 2`,
        `A = (${base} × ${altura}) / 2`,
        `A = ${base * altura} / 2`,
        `**A = ${area}**`,
      ],
      answer: String(area),
    }
  }

  // Circle area or perimeter
  if (n.includes('circulo') || n.includes('radio')) {
    const r = nums[0]
    if (!r) return null
    const PI = Math.PI
    if (n.includes('perimetro') || n.includes('circunferencia')) {
      const p = Math.round(2 * PI * r * 100) / 100
      return {
        steps: [
          `Circunferencia del círculo con radio **${r}**`,
          `Fórmula: C = 2 × π × radio`,
          `C = 2 × 3.1416 × ${r}`,
          `**C ≈ ${p}**`,
        ],
        answer: String(p),
      }
    }
    const area = Math.round(PI * r * r * 100) / 100
    return {
      steps: [
        `Área del círculo con radio **${r}**`,
        `Fórmula: A = π × radio²`,
        `A = 3.1416 × ${r}²`,
        `A = 3.1416 × ${r * r}`,
        `**A ≈ ${area}**`,
      ],
      answer: String(area),
    }
  }

  return null
}

function solveWordProblem(text) {
  const n = norm(text)
  const nums = extractNumbers(text)
  if (nums.length < 2) return null

  // Detect operation keywords
  const addKeys = /tiene.*y.*mas|compro.*y.*compro|gano|agrego|total de|juntos/
  const subKeys = /quedan|gasto|perdio|perdió|dio|regalo|comio|comió|menos/
  const mulKeys = /veces|cada uno|por dia|por semana|al dia|grupos de/
  const divKeys = /reparte|divid|entre.*personas|entre.*grupos|cuanto le toca/

  const [a, b] = nums
  let steps, answer

  if (divKeys.test(n)) {
    const q = Math.floor(a / b), r = a % b
    steps = [
      `Del problema extraemos: **${a}** y **${b}**`,
      `Operación detectada: **división** (repartir/dividir)`,
      `${a} ÷ ${b} = ${q}${r > 0 ? ` con resto ${r}` : ''}`,
    ]
    answer = r > 0 ? `${q} (resto ${r})` : String(q)
  } else if (mulKeys.test(n)) {
    steps = [
      `Del problema extraemos: **${a}** y **${b}**`,
      `Operación detectada: **multiplicación** (veces/grupos)`,
      `${a} × ${b} = **${a * b}**`,
    ]
    answer = String(a * b)
  } else if (subKeys.test(n)) {
    steps = [
      `Del problema extraemos: **${a}** y **${b}**`,
      `Operación detectada: **resta** (quedan/gastó)`,
      `${a} - ${b} = **${a - b}**`,
    ]
    answer = String(a - b)
  } else {
    steps = [
      `Del problema extraemos: **${a}** y **${b}**`,
      `Operación detectada: **suma** (tiene y más/total)`,
      `${a} + ${b} = **${a + b}**`,
    ]
    answer = String(a + b)
  }

  steps.push(``, `💡 Siempre lee el problema dos veces y subraya los números y palabras clave.`)
  return { steps, answer }
}

function solveDecimal(text) {
  const nums = extractNumbers(text)
  if (nums.length < 2) return null
  const [a, b] = nums
  const n = norm(text)

  if (n.includes('suma') || text.includes('+')) {
    const r = Math.round((a + b) * 1e10) / 1e10
    return {
      steps: [
        `Sumar decimales: **${a} + ${b}**`,
        `Alineamos la coma decimal y sumamos columna por columna:`,
        `**${a} + ${b} = ${r}**`,
      ],
      answer: String(r),
    }
  }
  if (n.includes('rest') || text.includes('-')) {
    const r = Math.round((a - b) * 1e10) / 1e10
    return {
      steps: [
        `Restar decimales: **${a} - ${b}**`,
        `Alineamos la coma decimal y restamos:`,
        `**${a} - ${b} = ${r}**`,
      ],
      answer: String(r),
    }
  }
  if (n.includes('multiplic') || text.includes('*') || text.includes('×')) {
    const da = (String(a).split('.')[1] || '').length
    const db = (String(b).split('.')[1] || '').length
    const r = Math.round(a * b * 1e10) / 1e10
    return {
      steps: [
        `Multiplicar decimales: **${a} × ${b}**`,
        `Paso 1: Multiplica sin considerar la coma: ${Math.round(a * 10 ** da)} × ${Math.round(b * 10 ** db)} = ${Math.round(a * 10 ** da) * Math.round(b * 10 ** db)}`,
        `Paso 2: Cuenta los decimales totales: ${da} + ${db} = ${da + db} decimales`,
        `Paso 3: Coloca la coma ${da + db} lugar(es) desde la derecha`,
        `**${a} × ${b} = ${r}**`,
      ],
      answer: String(r),
    }
  }
  if (n.includes('divid') || text.includes('/') || text.includes('÷')) {
    const r = Math.round((a / b) * 1e10) / 1e10
    return {
      steps: [
        `Dividir decimales: **${a} ÷ ${b}**`,
        `Convertimos para eliminar decimales si es necesario, luego dividimos normalmente.`,
        `**${a} ÷ ${b} = ${r}**`,
      ],
      answer: String(r),
    }
  }

  return null
}

// ── General topic explanations ────────────────────────────────────────────────

const TOPIC_EXPLANATIONS = {
  fraction: `**¿Qué es una fracción?** 🍕\n\nUna fracción tiene dos partes:\n- **Numerador** (arriba): cuántas partes tienes\n- **Denominador** (abajo): en cuántas partes está dividido el todo\n\n**Ejemplo:** 3/4 significa que tienes 3 de 4 partes iguales\n\n**Tipos de fracciones:**\n- Propia: numerador < denominador (3/4)\n- Impropia: numerador > denominador (7/3)\n- Mixta: entero + fracción propia (2 1/3)\n\n**Para simplificar:** divide numerador y denominador por su MCD.\n\n¿Tienes una fracción específica? ¡Escríbela y la resolvemos juntos! 😊`,

  algebra: `**Ecuaciones lineales** ⚖️\n\nPiensa en una **balanza**: lo que haces de un lado, lo haces del otro.\n\n**Regla de oro para despejar x:**\n- Si tiene **+ a** → resta a de ambos lados\n- Si tiene **- a** → suma a a ambos lados\n- Si tiene **× a** → divide por a ambos lados\n- Si tiene **÷ a** → multiplica por a ambos lados\n\n**Ejemplo:** 2x + 3 = 11\nPaso 1: 2x = 11 - 3 = 8\nPaso 2: x = 8 ÷ 2 = **4** ✅\n\n¡Escríbeme tu ecuación y la resolvemos paso a paso!`,

  decimal: `**Números decimales** 🔢\n\nLa coma separa los enteros de los decimales:\n- Antes de la coma: unidades, decenas, centenas...\n- Después de la coma: décimas (÷10), centésimas (÷100)...\n\n**Para sumar/restar:** alinea la coma decimal.\n**Para multiplicar:** multiplica normal y cuenta los decimales totales.\n**Para dividir:** mueve la coma hasta que el divisor sea entero.\n\nEscríbeme tu operación con decimales y te ayudo paso a paso 😊`,

  percentage: `**Porcentajes** 📊\n\n"Por ciento" significa "de cada 100 partes".\n\n**Fórmulas:**\n- X% de Y = (X ÷ 100) × Y\n- ¿Qué % es X de Y? = (X ÷ Y) × 100\n\n**Trucos rápidos:**\n- 10%: divide por 10\n- 50%: divide por 2\n- 25%: divide por 4\n- 20%: divide por 5\n\n¡Escríbeme tu problema de porcentaje!`,

  power: `**Potencias y raíces** 🔢\n\n**Potencia:** multiplicación repetida\n- 3² = 3 × 3 = 9\n- 2⁵ = 2 × 2 × 2 × 2 × 2 = 32\n\n**Raíz cuadrada:** busca el número que al cuadrado da el radicando\n- √25 = 5 (porque 5 × 5 = 25)\n- √81 = 9 (porque 9 × 9 = 81)\n\n**Cuadrados perfectos:** 1, 4, 9, 16, 25, 36, 49, 64, 81, 100\n\n¡Escríbeme tu potencia o raíz y te ayudo!`,

  geometry: `**Geometría** 📐\n\n**Áreas:**\n- Rectángulo: base × altura\n- Cuadrado: lado²\n- Triángulo: (base × altura) / 2\n- Círculo: π × radio² ≈ 3.1416 × r²\n\n**Perímetros:**\n- Rectángulo: 2 × (base + altura)\n- Cuadrado: 4 × lado\n- Círculo (circunferencia): 2 × π × radio\n\n¡Dime las medidas de tu figura y calculamos juntos!`,

  general: `¡Hola! Soy tu tutor de MateMagia 🧙‍♂️✨\n\nPuedo ayudarte con:\n- ➕ Sumas, restas, multiplicaciones, divisiones\n- 🍕 Fracciones (sumar, restar, simplificar, comparar)\n- 🔢 Decimales y porcentajes\n- ⚖️ Ecuaciones con x\n- 🔢 Potencias y raíces\n- 📐 Geometría (áreas y perímetros)\n- 📖 Problemas de palabras en español\n\nEjemplos de lo que puedes escribir:\n- "¿Cuánto es 3/4 + 1/2?"\n- "Resuelve 2x + 3 = 11"\n- "¿Cuánto es el 30% de 150?"\n- "Área de un rectángulo de 5 × 8"\n- "√64"\n\n¿Qué quieres calcular hoy? 😊`,
}

// ── Grade-aware helpers ───────────────────────────────────────────────────────

function gradeIntro(grade) {
  if (grade <= 2) return rand(['¡Hola! 😊', '¡Qué buena pregunta! 🌟', '¡Eso está genial! 🎉'])
  if (grade <= 4) return rand(['¡Claro!', '¡Buena pregunta!', '¡Con gusto te explico!'])
  if (grade <= 6) return rand(['¡Vamos a resolverlo! 🔢', '¡Con gusto te ayudo!', '¡Excelente consulta!'])
  return rand(['Excelente consulta.', 'Claro, lo analizamos.', 'Muy bien, veamos.'])
}

function gradeEncouragement(grade) {
  if (grade <= 2) return rand(['¡Lo hiciste muy bien! 🎊', '¡Eres increíble! ⭐', '¡Sigue así! 🌈'])
  if (grade <= 4) return rand(['¡Muy bien! 🌟', '¡Excelente! 💪', '¡Sigue practicando! 🚀'])
  if (grade <= 6) return rand(['¡Excelente trabajo! 🔥', '¡Perfecto razonamiento! ✨', '¡Lo lograste! 🎉'])
  return rand(['Buen razonamiento.', 'Correcto. Practica más problemas similares.', 'Sólido.'])
}

function gradeStepLabel(i, grade) {
  if (grade <= 2) return ['1️⃣', '2️⃣', '3️⃣', '4️⃣', '5️⃣'][i] || `${i + 1}.`
  return `**Paso ${i + 1}:**`
}

// ── Additional solvers for grades 7-8 ────────────────────────────────────────

function solveIntegers(text) {
  const n = norm(text)
  const nums = extractNumbers(text)
  if (nums.length < 2) return null
  const [a, b] = nums

  // Detect negative + negative, positive + negative, etc.
  if (n.includes('negativ') || text.match(/-\s*\d/)) {
    if (n.includes('sum') || text.includes('+')) {
      return {
        steps: [
          `Suma de enteros: **${a} + (${b})**`,
          `Usamos la recta numérica: comenzamos en ${a}`,
          b >= 0 ? `Avanzamos ${b} pasos a la derecha` : `Retrocedemos ${Math.abs(b)} pasos a la izquierda`,
          `**Resultado: ${a + b}**`,
        ],
        answer: String(a + b),
      }
    }
    if (n.includes('rest') || text.includes('-')) {
      return {
        steps: [
          `Resta de enteros: **${a} − ${b}**`,
          `Restar es sumar el opuesto: ${a} + (${-b})`,
          `En la recta numérica: de ${a}, nos movemos ${Math.abs(b)} pasos ${-b >= 0 ? 'a la derecha' : 'a la izquierda'}`,
          `**Resultado: ${a - b}**`,
        ],
        answer: String(a - b),
      }
    }
  }
  return null
}

function solveStatistics(text) {
  const n = norm(text)
  const nums = extractNumbers(text)
  if (nums.length < 2) return null

  const sorted = [...nums].sort((a, b) => a - b)
  const sum = nums.reduce((acc, v) => acc + v, 0)
  const mean = Math.round((sum / nums.length) * 100) / 100

  // Median
  const mid = Math.floor(sorted.length / 2)
  const median = sorted.length % 2 === 0
    ? (sorted[mid - 1] + sorted[mid]) / 2
    : sorted[mid]

  // Mode
  const freq = {}
  nums.forEach(v => { freq[v] = (freq[v] || 0) + 1 })
  const maxFreq = Math.max(...Object.values(freq))
  const mode = Object.keys(freq).filter(k => freq[k] === maxFreq)

  if (n.includes('media') || n.includes('promedio') || n.includes('average')) {
    return {
      steps: [
        `Datos: **${nums.join(', ')}**`,
        `Suma de todos los valores: ${nums.join(' + ')} = ${sum}`,
        `Dividimos entre la cantidad de datos: ${sum} ÷ ${nums.length}`,
        `**Media = ${mean}**`,
      ],
      answer: String(mean),
    }
  }
  if (n.includes('mediana')) {
    return {
      steps: [
        `Datos ordenados: **${sorted.join(', ')}**`,
        `Hay ${sorted.length} datos`,
        sorted.length % 2 === 0
          ? `Como son par, promediamos los dos centrales: (${sorted[mid - 1]} + ${sorted[mid]})/2`
          : `El valor central (posición ${mid + 1}) es:`,
        `**Mediana = ${median}**`,
      ],
      answer: String(median),
    }
  }
  if (n.includes('moda')) {
    return {
      steps: [
        `Datos: **${nums.join(', ')}**`,
        `Contamos frecuencias: ${Object.entries(freq).map(([k, v]) => `${k}→${v}`).join(', ')}`,
        `El/los valor(es) más frecuente(s) aparece(n) ${maxFreq} vez/veces`,
        `**Moda = ${mode.join(', ')}**`,
      ],
      answer: mode.join(', '),
    }
  }
  if (n.includes('rango')) {
    const range = sorted[sorted.length - 1] - sorted[0]
    return {
      steps: [
        `Datos ordenados: **${sorted.join(', ')}**`,
        `Máximo: ${sorted[sorted.length - 1]} | Mínimo: ${sorted[0]}`,
        `Rango = Máximo − Mínimo`,
        `**Rango = ${range}**`,
      ],
      answer: String(range),
    }
  }

  return null
}

function solveProbability(text) {
  const n = norm(text)
  const nums = extractNumbers(text)
  if (nums.length < 2) return null

  const [favorable, total] = nums
  if (total === 0) return null

  const { num, den } = simplifyFraction(favorable, total)
  const decimal = Math.round((favorable / total) * 10000) / 10000
  const pct = Math.round(decimal * 10000) / 100

  return {
    steps: [
      `Probabilidad: casos favorables / casos totales`,
      `Favorables: ${favorable} | Total posible: ${total}`,
      `P = ${favorable}/${total}`,
      num !== favorable ? `Simplificando: **${num}/${den}**` : `**P = ${num}/${den}**`,
      `En decimal: ${decimal} | En porcentaje: ${pct}%`,
    ],
    answer: `${num}/${den}`,
  }
}

function solveRatiosProportion(text) {
  const n = norm(text)
  const nums = extractNumbers(text)

  // Cross multiplication: a/b = c/x or a:b = c:x
  if ((n.includes('proporcion') || n.includes('por cada') || n.includes('razon')) && nums.length >= 3) {
    const [a, b, c] = nums
    const x = (b * c) / a
    return {
      steps: [
        `Proporción: ${a}/${b} = ${c}/x`,
        `Multiplicación cruzada: a × x = b × c`,
        `${a} × x = ${b} × ${c}`,
        `${a}x = ${b * c}`,
        `**x = ${b * c} ÷ ${a} = ${x}**`,
      ],
      answer: String(x),
    }
  }

  return null
}

// Augmented PATTERNS for grades 7-8
const PATTERNS_EXTENDED = {
  ...{ integers: /entero|negativ|\(-?\d|^\s*-\s*\d/ },
  stats: /promedio|media|mediana|moda|rango|datos:/,
  probability: /probabilidad|posibilidad|de cada|favorable|cuantas formas/,
  ratio: /razon|proporcion|por cada|escala|receta/,
}

function detectTypeExtended(text) {
  const n = norm(text)
  for (const [type, re] of Object.entries(PATTERNS_EXTENDED)) {
    if (re.test(n)) return type
  }
  return null
}

// ── Main export ───────────────────────────────────────────────────────────────

export function generateResponse(userMessage, topicContext = null, gradeLevel = 1) {
  const text = userMessage.trim()
  const grade = Math.max(1, Math.min(8, gradeLevel || 1))

  if (!text) {
    return { message: TOPIC_EXPLANATIONS.general, type: 'general' }
  }

  // Extended type detection for grades 7-8
  const extType = detectTypeExtended(text)
  if (extType === 'stats') {
    const r = solveStatistics(text)
    if (r) return fmtGrade(r, 'statistics', grade)
  }
  if (extType === 'probability') {
    const r = solveProbability(text)
    if (r) return fmtGrade(r, 'probability', grade)
  }
  if (extType === 'ratio') {
    const r = solveRatiosProportion(text)
    if (r) return fmtGrade(r, 'ratio', grade)
  }
  if (extType === 'integers') {
    const r = solveIntegers(text)
    if (r) return fmtGrade(r, 'integers', grade)
  }

  const type = detectType(text)

  // 1. Try geometry
  if (type === 'geometry') {
    const r = solveGeometry(text)
    if (r) return fmtGrade(r, 'geometry', grade)
  }

  // 2. Try algebra
  if (type === 'algebra') {
    const r = solveAlgebra(text)
    if (r) return fmtGrade(r, 'algebra', grade)
  }

  // 3. Try fraction operations
  if (type === 'fraction') {
    const r = solveFraction(text)
    if (r) return fmtGrade(r, 'fraction', grade)
  }

  // 4. Try percentage
  if (type === 'percentage') {
    const r = solvePercentage(text)
    if (r) return fmtGrade(r, 'percentage', grade)
  }

  // 5. Try powers and roots
  if (type === 'power') {
    const r = solvePower(text)
    if (r) return fmtGrade(r, 'power', grade)
  }

  // 6. Try direct arithmetic expression
  const arithResult = solveArithmetic(text)
  if (arithResult) return fmtGrade(arithResult, type, grade)

  // 7. Try decimal operations
  if (type === 'decimal') {
    const r = solveDecimal(text)
    if (r) return fmtGrade(r, 'decimal', grade)
  }

  // 8. Try word problem
  if (type === 'wordproblem') {
    const r = solveWordProblem(text)
    if (r) return fmtGrade(r, 'wordproblem', grade)
  }

  // 9. Fallback: return topic explanation
  const explanation = TOPIC_EXPLANATIONS[type] || TOPIC_EXPLANATIONS.general
  return {
    message: explanation,
    type,
  }
}

function fmtGrade({ steps, answer }, type, grade = 1) {
  const intro = gradeIntro(grade)
  const enc = gradeEncouragement(grade)

  // Format steps with grade-appropriate numbering
  const cleanSteps = steps
    .map((s, i) => s === '' ? '' : `${gradeStepLabel(i, grade)} ${s}`)
    .filter(Boolean)
    .join('\n')

  // Grade-appropriate ending
  let ending = ''
  if (grade <= 2) {
    ending = `\n\n🌟 **¡${enc}** ¿Quieres intentar otro? 😊`
  } else if (grade <= 4) {
    ending = `\n\n${enc}\n\n¿Tienes otra pregunta? 😊`
  } else if (grade <= 6) {
    ending = `\n\n${enc}\n\n¿Necesitas otro ejemplo?`
  } else {
    ending = `\n\n${enc}\n\n¿Quieres practicar con otro ejercicio?`
  }

  // For grades 7-8: add formal notation hint
  let formalNote = ''
  if (grade >= 7 && (type === 'algebra' || type === 'power' || type === 'statistics')) {
    formalNote = '\n\n*Notación formal: aplica las propiedades algebraicas correspondientes al resolver.*'
  }

  return {
    message: `${intro} Vamos paso a paso:\n\n${cleanSteps}\n\n✅ **Resultado: ${answer}**${formalNote}${ending}`,
    type,
  }
}

// Keep the original fmt for internal use (wraps fmtGrade with grade=1 for backward compat)
function fmt(result, type) {
  return fmtGrade(result, type, 1)
}

export function getWelcomeMessage(grade = 1) {
  if (grade <= 2) {
    return `¡Hola! Soy tu tutor de MateMagia 🧙‍♂️✨\n\nPuedo ayudarte con las matemáticas. Por ejemplo:\n- "¿Cuánto es 3 + 4?" 🍎\n- "¿Cuánto es 10 - 3?"\n- "¿Cuántos son 5 + 2 + 1?"\n\n¡Escríbeme tu pregunta! 😊`
  }
  if (grade <= 4) {
    return `¡Hola! Soy tu tutor de MateMagia 🧙‍♂️✨\n\nPuedo ayudarte con:\n- Sumas y restas\n- Multiplicaciones y divisiones\n- ¿Cuánto es 5 × 7?\n- Tablas de multiplicar\n\n¿Qué quieres aprender hoy? 😊`
  }
  if (grade <= 6) {
    return `¡Hola! Soy tu tutor de MateMagia 🧙‍♂️✨\n\nPuedo ayudarte con:\n- Fracciones: "¿Cuánto es 3/4 + 1/2?"\n- Decimales y porcentajes\n- Ecuaciones: "Resuelve 2x + 3 = 11"\n- Geometría: áreas y perímetros\n\n¿En qué te ayudo hoy? 😊`
  }
  // Grades 7-8
  return `Hola. Soy tu tutor de MateMagia 🧙‍♂️\n\nPuedo ayudarte con:\n- Números enteros: "¿Cuánto es (-5) + 8?"\n- Álgebra: "Resuelve 3x − 5 = 10"\n- Estadística: "Calcula la media de 3, 7, 5, 9"\n- Probabilidad: "probabilidad 3 de 8"\n- Potencias y raíces: "2^6" o "√144"\n\n¿En qué te puedo ayudar?`
}
