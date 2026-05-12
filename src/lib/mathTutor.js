// src/lib/mathTutor.js — Tutor de matemáticas para estudiantes chilenos (1°-8° básico)
// Las explicaciones se adaptan al grado: lenguaje simple y concreto para grados bajos.

// ── Utilidades ────────────────────────────────────────────────────────────────

function rand(arr) { return arr[Math.floor(Math.random() * arr.length)] }

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

function extractNumbers(text) {
  return (text.match(/-?\d+(?:[.,]\d+)?/g) || []).map(n => parseFloat(n.replace(',', '.')))
}

function norm(text) {
  return text.toLowerCase().normalize('NFD').replace(/[̀-ͯ]/g, '').replace(/[¿¡]/g, '')
}

// ── Saludos y ánimo según grado ───────────────────────────────────────────────

function intro(grade) {
  if (grade <= 2) return rand(['¡Hola! 😊 Mira qué fácil:', '¡Genial! 🌟 Te explico:', '¡Muy bien! 🎉 Vamos:'])
  if (grade <= 4) return rand(['¡Claro! 😊 Te explico paso a paso:', '¡Buena pregunta! Vamos juntos:', '¡Con gusto! Mira:'])
  if (grade <= 6) return rand(['¡Vamos a resolverlo! 💪', '¡Buena consulta! Paso a paso:', '¡Con gusto te ayudo!'])
  return rand(['Claro, veamos.', 'Muy bien, analizamos.', 'Excelente consulta.'])
}

function encouragement(grade) {
  if (grade <= 2) return rand(['¡Lo lograste! 🎊🌈', '¡Eres una estrella! ⭐', '¡Súper! 🎉', '¡Genial! 🌟'])
  if (grade <= 4) return rand(['¡Muy bien! 🌟', '¡Excelente! 💪', '¡Sigue así! 🚀'])
  if (grade <= 6) return rand(['¡Excelente trabajo! 🔥', '¡Lo lograste! ✨', '¡Perfecto! 🎉'])
  return rand(['Buen razonamiento.', 'Correcto. Sigue practicando.', 'Muy bien.'])
}

function closing(grade) {
  if (grade <= 2) return '¿Quieres intentar otro? 😊'
  if (grade <= 4) return '¿Tienes otra pregunta? 😊'
  if (grade <= 6) return '¿Necesitas otro ejemplo?'
  return '¿Quieres practicar con otro ejercicio?'
}

// ── Detección de tipo ─────────────────────────────────────────────────────────

const PATTERNS = {
  geometry:      /area|perimetro|perimeter|rectangulo|cuadrado|triangulo|circulo|radio|base|altura|lado/,
  percentage:    /porcent|%|tanto por ciento|cuanto es el \d|que porcentaje/,
  power:         /potencia|elevado|cuadrado de|\^|al cuadrado|al cubo|raiz|raíz/,
  fraction:      /fraccion|fracción|\/\d|simplific|mitad|tercio|cuarto/,
  algebra:       /[a-z]\s*[+\-*\/]\s*\d|\d\s*[a-z]\s*=|\bx\b.*=|ecuacion|ecuación|despejar|incognita/,
  decimal:       /decimal|coma|,\d|\d,\d|\d\.\d/,
  wordproblem:   /tiene|habia|había|reparte|compra|vende|gana|pierde|quedan|total|cuantos|cuántos|problema/,
  division:      /divid|÷|entre|reparti|cuanto cabe|[\d\s]\/[\d\s]/,
  multiplication:/multiplic|producto|veces|×|por|\*/,
  subtraction:   /rest|menos|-\s*\d|\d\s*-/,
  addition:      /suma|más|mas|\+|agrega/,
  stats:         /promedio|media|mediana|moda|rango|datos:/,
  probability:   /probabilidad|posibilidad|favorable/,
  ratio:         /razon|proporcion|por cada|escala/,
  integers:      /entero|negativ/,
}

function detectType(text) {
  const n = norm(text)
  for (const [type, re] of Object.entries(PATTERNS)) {
    if (re.test(n)) return type
  }
  return 'general'
}

function tryDirectExpression(text) {
  const m = text.match(/(-?\d+(?:[.,]\d+)?)\s*([+\-×÷*\/])\s*(-?\d+(?:[.,]\d+)?)/)
  if (!m) return null
  const a = parseFloat(m[1].replace(',', '.'))
  const op = m[2]
  const b = parseFloat(m[3].replace(',', '.'))
  return { a, op, b }
}

// ── Operaciones básicas ───────────────────────────────────────────────────────

function solveArithmetic(text, grade) {
  const expr = tryDirectExpression(text)
  if (!expr) return null
  const { a, op, b } = expr

  if ((op === '/' || op === '÷') && b === 0) {
    return { steps: ['No se puede dividir entre cero. 🚫'], answer: 'Imposible' }
  }

  let result, steps

  if (op === '+') {
    result = a + b
    if (grade <= 2) {
      steps = [
        `Tenemos **${a}** cosas y agregamos **${b}** más 🍎`,
        `¡Contamos todo junto!`,
        `**${a} + ${b} = ${result}** ✅`,
      ]
    } else if (grade <= 4) {
      steps = [
        `Sumamos **${a} + ${b}**`,
        `Empezamos por las unidades y vamos de derecha a izquierda.`,
        `Si la suma pasa de 9, llevamos 1 a la siguiente columna.`,
        `**${a} + ${b} = ${result}** ✅`,
      ]
    } else {
      steps = [
        `Suma: **${a} + ${b}**`,
        `Alineamos por las unidades, sumamos columna por columna.`,
        `**Resultado: ${result}**`,
      ]
    }
  } else if (op === '-') {
    result = a - b
    if (grade <= 2) {
      steps = [
        `Teníamos **${a}** cosas y se van **${b}** 🍪`,
        `¿Cuántas quedan?`,
        `**${a} - ${b} = ${result}** ✅`,
      ]
    } else if (grade <= 4) {
      steps = [
        `Restamos **${a} - ${b}**`,
        `Si un dígito es menor, pedimos prestado a la columna de al lado.`,
        `**${a} - ${b} = ${result}** ✅`,
      ]
    } else {
      steps = [
        `Resta: **${a} - ${b}**`,
        `**Resultado: ${result}**`,
      ]
    }
  } else if (op === '*' || op === '×') {
    result = a * b
    const ai = Number.isInteger(a), bi = Number.isInteger(b)
    if (grade <= 2) {
      steps = [
        `**${a} × ${b}** es como contar **${a}** grupos de **${b}** 🍬`,
        `${Array.from({ length: Math.min(a, 5) }, (_, i) => `Grupo ${i + 1}: ${b}`).join(' | ')}${a > 5 ? ' ...' : ''}`,
        `**${a} × ${b} = ${result}** 🎉`,
      ]
    } else if (grade <= 4) {
      steps = [
        `Multiplicamos **${a} × ${b}**`,
        `Es como sumar ${b} exactamente ${a} veces.`,
        `**${a} × ${b} = ${result}** ✅`,
      ]
    } else {
      steps = [
        `Multiplicación: **${a} × ${b}**`,
        ai && bi && a <= 12 && b <= 12
          ? `Lo sacamos de la tabla de multiplicar.`
          : `Multiplicamos normalmente (si hay decimales, contamos los lugares decimales).`,
        `**Resultado: ${result}**`,
      ]
    }
  } else {
    const q = Math.floor(a / b)
    const r = Math.round((a - q * b) * 1e10) / 1e10
    if (grade <= 2) {
      result = r === 0 ? q : `${q} (sobran ${r})`
      steps = [
        `Dividimos **${a}** en grupos de **${b}** 🍕`,
        `¿Cuántos grupos completos salen?`,
        `**${b} × ${q} = ${b * q}**`,
        r === 0
          ? `¡Caben exactamente **${q}** grupos! ✅`
          : `Caben **${q}** grupos y sobran **${r}** ✅`,
      ]
    } else if (grade <= 4) {
      result = r === 0 ? q : `${q} con resto ${r}`
      steps = [
        `Dividimos **${a} ÷ ${b}**`,
        `¿Cuántas veces cabe ${b} en ${a}?`,
        `${b} × ${q} = ${b * q}`,
        `Lo que queda: ${a} - ${b * q} = ${r}`,
        r === 0
          ? `**${a} ÷ ${b} = ${q}** (exacto) ✅`
          : `**${a} ÷ ${b} = ${q}** con resto **${r}** ✅`,
      ]
    } else {
      result = r === 0 ? q : `${q} con resto ${r}`
      steps = [
        `División: **${a} ÷ ${b}**`,
        `${b} × ${q} = ${b * q} | Resto: ${r}`,
        r === 0
          ? `**Resultado: ${q}** (exacto)`
          : `**Resultado: ${q}** resto **${r}**`,
      ]
    }
  }

  return { steps, answer: String(result) }
}

// ── Fracciones ────────────────────────────────────────────────────────────────

function solveFraction(text, grade) {
  const n = norm(text)
  let m = text.match(/(\d+)\s*\/\s*(\d+)/)
  if (!m) return null
  const num1 = parseInt(m[1]), den1 = parseInt(m[2])

  // Operación con dos fracciones: a/b op c/d
  const twoFrac = text.match(/(\d+)\s*\/\s*(\d+)\s*([+\-×*xXpP÷\/])\s*(\d+)\s*\/\s*(\d+)/)
  if (twoFrac) {
    const a = parseInt(twoFrac[1]), b = parseInt(twoFrac[2])
    const opRaw = twoFrac[3]
    const c = parseInt(twoFrac[4]), d = parseInt(twoFrac[5])
    let rNum, rDen, steps

    const isAdd = /[+]|mas|más|suma/.test(opRaw) || n.includes('suma')
    const isSub = /[-]|resto|resta/.test(opRaw) || n.includes('rest')
    const isMul = /[×*xXpP]|multiplic|veces/.test(opRaw) || n.includes('multiplic')

    if (isAdd) {
      rNum = a * d + c * b; rDen = b * d
      const s = simplifyFraction(rNum, rDen)
      if (grade <= 4) {
        if (b === d) {
          // Same denominator - simpler explanation
          steps = [
            `Sumamos **${a}/${b}** y **${c}/${d}** 🍕`,
            `¡Las dos pizzas tienen el mismo número de partes (${b})!`,
            `Solo sumamos las partes que tenemos: ${a} + ${c} = ${a + c}`,
            `**Resultado: ${fractionStr(a + c, b)}** 🎉`,
          ]
          rNum = a + c; rDen = b
        } else {
          steps = [
            `Queremos sumar **${a}/${b}** 🍕 y **${c}/${d}** 🍕`,
            `El problema: las pizzas están cortadas diferente (${b} y ${d} partes).`,
            `Tenemos que cortarlas igual: en **${b * d}** partes.`,
            `${a}/${b} se convierte en ${a * d}/${b * d}`,
            `${c}/${d} se convierte en ${c * b}/${b * d}`,
            `Ahora sí sumamos: ${a * d} + ${c * b} = ${rNum}`,
            s.den !== rDen
              ? `**Resultado: ${s.num}/${s.den}** 🎉`
              : `**Resultado: ${rNum}/${rDen}** 🎉`,
          ]
        }
      } else if (grade <= 6) {
        steps = [
          `Suma: **${a}/${b} + ${c}/${d}**`,
          b === d
            ? `Mismo denominador (${b}): sumamos los de arriba directamente.`
            : `Buscamos un denominador común: ${b} × ${d} = ${b * d}`,
          b === d
            ? `${a} + ${c} = ${a + c}`
            : `Convertimos: ${a * d}/${b * d} + ${c * b}/${b * d} = ${rNum}/${rDen}`,
          s.den !== rDen ? `Simplificamos: **${s.num}/${s.den}**` : `**Resultado: ${fractionStr(rNum, rDen)}**`,
        ]
      } else {
        steps = [
          `Suma de fracciones: **${a}/${b} + ${c}/${d}**`,
          b === d ? `Igual denominador: sumamos numeradores.` : `mcd(${b},${d}) → denominador común ${b * d}`,
          b === d ? `${a} + ${c} = ${a + c}` : `${a * d}/${b * d} + ${c * b}/${b * d} = ${rNum}/${rDen}`,
          s.den !== rDen ? `Simplificando: **${s.num}/${s.den}**` : `**Resultado: ${fractionStr(rNum, rDen)}**`,
        ]
      }
    } else if (isSub) {
      rNum = a * d - c * b; rDen = b * d
      const s = simplifyFraction(rNum, rDen)
      if (grade <= 4) {
        if (b === d) {
          steps = [
            `Restamos **${a}/${b}** menos **${c}/${d}** 🍕`,
            `¡Las dos pizzas tienen el mismo número de partes (${b})!`,
            `Solo restamos las partes: ${a} - ${c} = ${a - c}`,
            `**Resultado: ${fractionStr(a - c, b)}** ✅`,
          ]
          rNum = a - c; rDen = b
        } else {
          steps = [
            `Restamos **${a}/${b}** menos **${c}/${d}** 🍕`,
            `Cortamos ambas pizzas igual: en ${b * d} partes.`,
            `${a}/${b} = ${a * d}/${b * d}`,
            `${c}/${d} = ${c * b}/${b * d}`,
            `Restamos: ${a * d} - ${c * b} = ${rNum}`,
            s.den !== rDen ? `**Resultado: ${s.num}/${s.den}** ✅` : `**Resultado: ${rNum}/${rDen}** ✅`,
          ]
        }
      } else {
        steps = [
          `Resta: **${a}/${b} - ${c}/${d}**`,
          b === d ? `Igual denominador: restamos los de arriba.` : `Denominador común: ${b * d}`,
          b === d ? `${a} - ${c} = ${a - c}` : `${a * d}/${b * d} - ${c * b}/${b * d} = ${rNum}/${rDen}`,
          s.den !== rDen ? `**Resultado: ${s.num}/${s.den}**` : `**Resultado: ${fractionStr(rNum, rDen)}**`,
        ]
      }
    } else if (isMul) {
      rNum = a * c; rDen = b * d
      const s = simplifyFraction(rNum, rDen)
      if (grade <= 4) {
        steps = [
          `Multiplicamos **${a}/${b}** por **${c}/${d}** 🌟`,
          `Es muy fácil: multiplicamos los de arriba y los de abajo por separado.`,
          `Arriba: ${a} × ${c} = ${rNum}`,
          `Abajo: ${b} × ${d} = ${rDen}`,
          s.den !== rDen ? `**Resultado: ${s.num}/${s.den}** 🎉` : `**Resultado: ${fractionStr(rNum, rDen)}** 🎉`,
        ]
      } else {
        steps = [
          `Multiplicación: **${a}/${b} × ${c}/${d}**`,
          `Multiplicamos arriba con arriba, abajo con abajo:`,
          `${a} × ${c} = ${rNum}  |  ${b} × ${d} = ${rDen}`,
          s.den !== rDen ? `Simplificamos: **${s.num}/${s.den}**` : `**Resultado: ${fractionStr(rNum, rDen)}**`,
        ]
      }
    } else {
      // División
      rNum = a * d; rDen = b * c
      const s = simplifyFraction(rNum, rDen)
      if (grade <= 4) {
        steps = [
          `Dividimos **${a}/${b}** entre **${c}/${d}**`,
          `Truco: damos vuelta la segunda fracción y multiplicamos.`,
          `${a}/${b} ÷ ${c}/${d} → ${a}/${b} × ${d}/${c}`,
          `Arriba: ${a} × ${d} = ${rNum}  |  Abajo: ${b} × ${c} = ${rDen}`,
          s.den !== rDen ? `**Resultado: ${s.num}/${s.den}** 🎉` : `**Resultado: ${fractionStr(rNum, rDen)}** 🎉`,
        ]
      } else {
        steps = [
          `División: **${a}/${b} ÷ ${c}/${d}**`,
          `Dividir = multiplicar por el inverso: **${a}/${b} × ${d}/${c}**`,
          `${a} × ${d} = ${rNum}  |  ${b} × ${c} = ${rDen}`,
          s.den !== rDen ? `Simplificamos: **${s.num}/${s.den}**` : `**Resultado: ${fractionStr(rNum, rDen)}**`,
        ]
      }
    }
    return { steps, answer: fractionStr(rNum, rDen) }
  }

  // Comparar fracciones
  if (n.includes('mayor') || n.includes('menor') || n.includes('compara') || n.includes('cual es mas')) {
    const twoM = text.match(/(\d+)\/(\d+).*?(\d+)\/(\d+)/)
    if (twoM) {
      const a = parseInt(twoM[1]), b = parseInt(twoM[2])
      const c = parseInt(twoM[3]), d = parseInt(twoM[4])
      const cross1 = a * d, cross2 = c * b
      const result = cross1 > cross2 ? `${a}/${b}` : cross1 < cross2 ? `${c}/${d}` : 'Son iguales'

      if (grade <= 4) {
        if (b === d) {
          return {
            steps: [
              `Comparamos **${a}/${b}** y **${c}/${d}** 🍕`,
              `Las dos pizzas tienen el mismo número de partes (${b}).`,
              `Solo miramos cuántas partes tiene cada una: ${a} vs ${c}`,
              cross1 > cross2
                ? `${a} > ${c}, entonces **${a}/${b}** es la más grande! 🏆`
                : cross1 < cross2
                  ? `${c} > ${a}, entonces **${c}/${d}** es la más grande! 🏆`
                  : `${a} = ${c}, ¡son **iguales**! ✅`,
            ],
            answer: result,
          }
        }
        return {
          steps: [
            `Comparamos **${a}/${b}** 🍕 y **${c}/${d}** 🍕`,
            `Para comparar, hacemos que las dos pizzas tengan el mismo número de partes.`,
            `Convertimos a ${b * d} partes cada una:`,
            `${a}/${b} se convierte en ${cross1}/${b * d}`,
            `${c}/${d} se convierte en ${cross2}/${b * d}`,
            cross1 > cross2
              ? `${cross1} > ${cross2}, entonces **${a}/${b}** es más grande 🏆`
              : cross1 < cross2
                ? `${cross1} < ${cross2}, entonces **${c}/${d}** es más grande 🏆`
                : `¡Son **iguales**! ✅`,
          ],
          answer: result,
        }
      }

      return {
        steps: [
          `Comparamos **${a}/${b}** y **${c}/${d}**`,
          b === d
            ? `Mismo denominador: comparamos numeradores: ${a} vs ${c}`
            : `Convertimos a denominador común (${b * d}): ${cross1} vs ${cross2}`,
          cross1 > cross2 ? `**${a}/${b} > ${c}/${d}**` : cross1 < cross2 ? `**${a}/${b} < ${c}/${d}**` : `**Son iguales**`,
        ],
        answer: result,
      }
    }
  }

  // Simplificar
  const s = simplifyFraction(num1, den1)
  const g = gcd(num1, den1)

  if (grade <= 4) {
    return {
      steps: [
        `Simplificamos **${num1}/${den1}** 🍕`,
        g === 1
          ? `¡Ya está en su forma más simple! No se puede simplificar más.`
          : `Buscamos un número que divida a ${num1} y a ${den1} exactamente.`,
        g === 1 ? '' : `Ese número es **${g}**.`,
        g === 1 ? '' : `${num1} ÷ ${g} = ${s.num}  |  ${den1} ÷ ${g} = ${s.den}`,
        g === 1
          ? `**${num1}/${den1}** ya está simplificado ✅`
          : `**Resultado: ${s.num}/${s.den}** ✅`,
      ].filter(l => l !== ''),
      answer: `${s.num}/${s.den}`,
    }
  }

  return {
    steps: [
      `Simplificamos **${num1}/${den1}**`,
      `Buscamos el mayor número que divida exactamente a ${num1} y ${den1}: es **${g}**`,
      `${num1} ÷ ${g} = ${s.num}  |  ${den1} ÷ ${g} = ${s.den}`,
      g === 1
        ? `**${num1}/${den1}** ya está en su mínima expresión.`
        : `**Resultado: ${s.num}/${s.den}**`,
    ],
    answer: `${s.num}/${s.den}`,
  }
}

// ── Porcentajes ───────────────────────────────────────────────────────────────

function solvePercentage(text, grade) {
  const nums = extractNumbers(text)
  const n = norm(text)

  if (n.includes('que porcentaje') && nums.length >= 2) {
    const [part, total] = nums
    const pct = Math.round((part / total) * 10000) / 100
    if (grade <= 4) {
      return {
        steps: [
          `¿Qué parte de ${total} es ${part}? 📊`,
          `Dividimos: ${part} ÷ ${total} = ${Math.round((part / total) * 100) / 100}`,
          `Multiplicamos por 100 para saber el porcentaje: × 100`,
          `**= ${pct}%** ✅`,
        ],
        answer: `${pct}%`,
      }
    }
    return {
      steps: [
        `¿Qué porcentaje es **${part}** de **${total}**?`,
        `(${part} ÷ ${total}) × 100`,
        `**= ${pct}%**`,
      ],
      answer: `${pct}%`,
    }
  }

  if (nums.length >= 2) {
    const pctFirst = /(\d+(?:[.,]\d+)?)\s*%\s*de\s*(\d+(?:[.,]\d+)?)/.exec(text)
    const [pct, num] = pctFirst
      ? [parseFloat(pctFirst[1]), parseFloat(pctFirst[2])]
      : [nums[0], nums[1]]
    const result = Math.round((pct / 100) * num * 10000) / 10000

    if (grade <= 4) {
      return {
        steps: [
          `¿Cuánto es el **${pct}%** de **${num}**? 📊`,
          `Pensar en porcentaje: "de cada 100, cuántos son ${pct}"`,
          `${pct}% = ${pct} de cada 100`,
          `${num} × ${pct} ÷ 100 = **${result}** ✅`,
          `💡 Truco: 50% = la mitad | 10% = dividir por 10 | 25% = la cuarta parte`,
        ],
        answer: `${result}`,
      }
    }
    return {
      steps: [
        `**${pct}%** de **${num}**`,
        `(${pct} ÷ 100) × ${num} = ${pct / 100} × ${num}`,
        `**= ${result}**`,
        `💡 Trucos: 10%÷10 | 50%÷2 | 25%÷4`,
      ],
      answer: `${result}`,
    }
  }

  return null
}

// ── Potencias y raíces ────────────────────────────────────────────────────────

function solvePower(text, grade) {
  const n = norm(text)

  const sqrtMatch = text.match(/(?:raiz|raíz|√)\s*(?:de\s*)?(\d+)/i) || text.match(/√\s*(\d+)/)
  if (sqrtMatch) {
    const num = parseInt(sqrtMatch[1])
    const root = Math.sqrt(num)
    const exact = isPerfectSquare(num)
    if (grade <= 4) {
      return {
        steps: [
          `Raíz cuadrada de **${num}** 🔢`,
          `¿Qué número multiplicado por sí mismo da ${num}?`,
          exact
            ? `${Math.round(root)} × ${Math.round(root)} = ${num} ✅`
            : `${num} no tiene raíz exacta. Es aprox. **${Math.round(root * 100) / 100}**`,
        ],
        answer: exact ? String(Math.round(root)) : `≈ ${Math.round(root * 100) / 100}`,
      }
    }
    return {
      steps: [
        `√${num} — buscamos el número que al cuadrado da ${num}`,
        exact
          ? `${Math.round(root)} × ${Math.round(root)} = ${num}  ✅ → **√${num} = ${Math.round(root)}**`
          : `${num} no es cuadrado perfecto. **√${num} ≈ ${Math.round(root * 100) / 100}**`,
      ],
      answer: exact ? String(Math.round(root)) : `≈ ${Math.round(root * 100) / 100}`,
    }
  }

  const powMatch = text.match(/(\d+)\s*\^\s*(\d+)/) ||
                   text.match(/(\d+)\s+elevado\s+a\s+(?:la?\s+)?(\d+)/i)
  if (powMatch) {
    const base = parseInt(powMatch[1]), exp = parseInt(powMatch[2])
    const result = Math.pow(base, exp)
    if (grade <= 4) {
      const parts = Array.from({ length: Math.min(exp, 6) }, () => base)
      return {
        steps: [
          `**${base}^${exp}** significa multiplicar ${base} por sí mismo **${exp} veces** 🔢`,
          `${parts.join(' × ')}${exp > 6 ? ' × ...' : ''} = **${result}**`,
        ],
        answer: String(result),
      }
    }
    return {
      steps: [
        `**${base}^${exp}** = ${base} multiplicado ${exp} veces`,
        `= **${result}**`,
      ],
      answer: String(result),
    }
  }

  return null
}

// ── Álgebra ───────────────────────────────────────────────────────────────────

function solveAlgebra(text, grade) {
  let m

  m = text.match(/(-?\d*)\s*[xX]\s*([+\-])\s*(\d+)\s*=\s*(-?\d+)/i)
  if (m) {
    const a = m[1] === '' || m[1] === '+' ? 1 : m[1] === '-' ? -1 : parseInt(m[1])
    const sign = m[2] === '+' ? 1 : -1
    const b = sign * parseInt(m[3])
    const c = parseInt(m[4])
    const x = (c - b) / a

    if (grade <= 6) {
      return {
        steps: [
          `Ecuación: **${a === 1 ? '' : a}x ${m[2]} ${parseInt(m[3])} = ${c}** ⚖️`,
          `Piensa en una balanza: lo que hacemos de un lado, lo hacemos del otro.`,
          `Pasamos ${m[2] === '+' ? `+${parseInt(m[3])}` : `-${parseInt(m[3])}`} al otro lado (cambia de signo):`,
          `${a === 1 ? '' : a}x = ${c} ${sign > 0 ? '-' : '+'} ${parseInt(m[3])} = ${c - b}`,
          a !== 1 ? `Dividimos por ${a}: x = ${c - b} ÷ ${a} = **${x}**` : `**x = ${x}** ✅`,
        ],
        answer: `x = ${x}`,
      }
    }
    return {
      steps: [
        `**${a === 1 ? '' : a}x ${m[2]} ${parseInt(m[3])} = ${c}**`,
        `${a === 1 ? '' : a}x = ${c - b}`,
        a !== 1 ? `x = ${c - b} ÷ ${a} = **${x}**` : `**x = ${x}**`,
      ],
      answer: `x = ${x}`,
    }
  }

  m = text.match(/[xX]\s*\+\s*(\d+)\s*=\s*(-?\d+)/i)
  if (m) {
    const a = parseInt(m[1]), b = parseInt(m[2])
    return {
      steps: grade <= 6
        ? [
            `**x + ${a} = ${b}** ⚖️`,
            `Para que x quede sola, restamos ${a} de los dos lados:`,
            `x + ${a} - ${a} = ${b} - ${a}`,
            `**x = ${b - a}** ✅`,
          ]
        : [
            `**x + ${a} = ${b}**`,
            `x = ${b} - ${a} = **${b - a}**`,
          ],
      answer: `x = ${b - a}`,
    }
  }

  m = text.match(/[xX]\s*-\s*(\d+)\s*=\s*(-?\d+)/i)
  if (m) {
    const a = parseInt(m[1]), b = parseInt(m[2])
    return {
      steps: grade <= 6
        ? [
            `**x - ${a} = ${b}** ⚖️`,
            `Para que x quede sola, sumamos ${a} a los dos lados:`,
            `x - ${a} + ${a} = ${b} + ${a}`,
            `**x = ${b + a}** ✅`,
          ]
        : [`**x - ${a} = ${b}** → x = ${b} + ${a} = **${b + a}**`],
      answer: `x = ${b + a}`,
    }
  }

  m = text.match(/(-?\d+)\s*[*×]?\s*[xX]\s*=\s*(-?\d+)/i)
  if (m) {
    const a = parseInt(m[1]), b = parseInt(m[2])
    const x = b / a
    return {
      steps: grade <= 6
        ? [
            `**${a}x = ${b}** ⚖️`,
            `Para que x quede sola, dividimos los dos lados por ${a}:`,
            `**x = ${b} ÷ ${a} = ${x}** ✅`,
          ]
        : [`**${a}x = ${b}** → x = ${b} ÷ ${a} = **${x}**`],
      answer: `x = ${x}`,
    }
  }

  m = text.match(/[xX]\s*\/\s*(\d+)\s*=\s*(-?\d+)/i)
  if (m) {
    const a = parseInt(m[1]), b = parseInt(m[2])
    return {
      steps: grade <= 6
        ? [
            `**x / ${a} = ${b}** ⚖️`,
            `Multiplicamos los dos lados por ${a}:`,
            `**x = ${b} × ${a} = ${b * a}** ✅`,
          ]
        : [`**x / ${a} = ${b}** → x = ${b} × ${a} = **${b * a}**`],
      answer: `x = ${b * a}`,
    }
  }

  return null
}

// ── Geometría ─────────────────────────────────────────────────────────────────

function solveGeometry(text, grade) {
  const n = norm(text)
  const nums = extractNumbers(text)

  if ((n.includes('rectangulo') || n.includes('area')) && nums.length >= 2) {
    const [base, altura] = nums
    if (n.includes('perimetro')) {
      const p = 2 * (base + altura)
      return {
        steps: grade <= 4
          ? [
              `Rectángulo: base **${base}** y altura **${altura}** 📐`,
              `El perímetro es sumar todos los lados: base + altura + base + altura`,
              `${base} + ${altura} + ${base} + ${altura} = **${p}** ✅`,
            ]
          : [
              `Perímetro del rectángulo: base=${base}, altura=${altura}`,
              `P = 2 × (${base} + ${altura}) = 2 × ${base + altura} = **${p}**`,
            ],
        answer: String(p),
      }
    }
    const area = base * altura
    return {
      steps: grade <= 4
        ? [
            `Rectángulo: base **${base}** y altura **${altura}** 📐`,
            `El área es cuántos cuadritos caben adentro: base × altura`,
            `${base} × ${altura} = **${area}** ✅`,
          ]
        : [
            `Área del rectángulo: A = base × altura`,
            `A = ${base} × ${altura} = **${area}**`,
          ],
      answer: String(area),
    }
  }

  if (n.includes('cuadrado') && nums.length >= 1) {
    const lado = nums[0]
    if (n.includes('perimetro')) {
      return {
        steps: grade <= 4
          ? [`Cuadrado con lado **${lado}** 📐`, `4 lados iguales: ${lado} + ${lado} + ${lado} + ${lado} = **${4 * lado}** ✅`]
          : [`P = 4 × lado = 4 × ${lado} = **${4 * lado}**`],
        answer: String(4 * lado),
      }
    }
    return {
      steps: grade <= 4
        ? [`Cuadrado con lado **${lado}** 📐`, `Área = lado × lado = ${lado} × ${lado} = **${lado * lado}** ✅`]
        : [`A = lado² = ${lado}² = **${lado * lado}**`],
      answer: String(lado * lado),
    }
  }

  if (n.includes('triangulo') && nums.length >= 2) {
    const [base, altura] = nums
    const area = (base * altura) / 2
    return {
      steps: grade <= 4
        ? [
            `Triángulo: base **${base}** y altura **${altura}** 📐`,
            `El área del triángulo es la mitad de un rectángulo:`,
            `(${base} × ${altura}) ÷ 2 = ${base * altura} ÷ 2 = **${area}** ✅`,
          ]
        : [
            `A = (base × altura) / 2`,
            `A = (${base} × ${altura}) / 2 = **${area}**`,
          ],
      answer: String(area),
    }
  }

  if (n.includes('circulo') || n.includes('radio')) {
    const r = nums[0]
    if (!r) return null
    const PI = Math.PI
    if (n.includes('perimetro') || n.includes('circunferencia')) {
      const p = Math.round(2 * PI * r * 100) / 100
      return {
        steps: grade <= 4
          ? [`Círculo con radio **${r}** ⭕`, `La vuelta entera = 2 × 3,14 × ${r} ≈ **${p}** ✅`]
          : [`C = 2 × π × r = 2 × 3.1416 × ${r} ≈ **${p}**`],
        answer: String(p),
      }
    }
    const area = Math.round(PI * r * r * 100) / 100
    return {
      steps: grade <= 4
        ? [`Círculo con radio **${r}** ⭕`, `Área = π × radio × radio ≈ 3,14 × ${r} × ${r} ≈ **${area}** ✅`]
        : [`A = π × r² = 3.1416 × ${r}² ≈ **${area}**`],
      answer: String(area),
    }
  }

  return null
}

// ── Problemas con palabras ────────────────────────────────────────────────────

function solveWordProblem(text, grade) {
  const n = norm(text)
  const nums = extractNumbers(text)
  if (nums.length < 2) return null

  const divKeys = /reparte|divid|entre.*personas|entre.*grupos|cuanto le toca/
  const mulKeys = /veces|cada uno|por dia|por semana|al dia|grupos de/
  const subKeys = /quedan|gasto|perdio|perdió|dio|regalo|comio|comió|menos/

  const [a, b] = nums
  let steps, answer

  if (divKeys.test(n)) {
    const q = Math.floor(a / b), r = a % b
    steps = grade <= 4
      ? [
          `Del problema: **${a}** y **${b}** 📖`,
          `Hay que **repartir**: ${a} ÷ ${b}`,
          r > 0 ? `A cada uno le toca **${q}** y sobran **${r}** ✅` : `A cada uno le toca **${q}** exacto ✅`,
        ]
      : [
          `División: ${a} ÷ ${b} = **${q}**${r > 0 ? ` (resto ${r})` : ''}`,
          `💡 Lee el problema 2 veces y subraya los números clave.`,
        ]
    answer = r > 0 ? `${q} (resto ${r})` : String(q)
  } else if (mulKeys.test(n)) {
    steps = grade <= 4
      ? [
          `Del problema: **${a}** y **${b}** 📖`,
          `Hay que **multiplicar**: grupos o veces`,
          `${a} × ${b} = **${a * b}** ✅`,
        ]
      : [
          `Multiplicación: ${a} × ${b} = **${a * b}**`,
          `💡 Lee el problema 2 veces y subraya los números clave.`,
        ]
    answer = String(a * b)
  } else if (subKeys.test(n)) {
    steps = grade <= 4
      ? [
          `Del problema: **${a}** y **${b}** 📖`,
          `Hay que **restar**: algo se va o se gasta`,
          `${a} - ${b} = **${a - b}** ✅`,
        ]
      : [
          `Resta: ${a} - ${b} = **${a - b}**`,
          `💡 Lee el problema 2 veces y subraya los números clave.`,
        ]
    answer = String(a - b)
  } else {
    steps = grade <= 4
      ? [
          `Del problema: **${a}** y **${b}** 📖`,
          `Hay que **sumar**: se juntan o agregan cosas`,
          `${a} + ${b} = **${a + b}** ✅`,
        ]
      : [
          `Suma: ${a} + ${b} = **${a + b}**`,
          `💡 Lee el problema 2 veces y subraya los números clave.`,
        ]
    answer = String(a + b)
  }

  return { steps, answer }
}

// ── Decimales ─────────────────────────────────────────────────────────────────

function solveDecimal(text, grade) {
  const nums = extractNumbers(text)
  if (nums.length < 2) return null
  const [a, b] = nums
  const n = norm(text)

  const withNote = grade <= 4
    ? '\n💡 La coma separa los enteros de las partes pequeñas.'
    : ''

  if (n.includes('suma') || text.includes('+')) {
    const r = Math.round((a + b) * 1e10) / 1e10
    return {
      steps: [
        `Sumamos **${a} + ${b}**`,
        `Ponemos las comas una encima de la otra y sumamos normal.`,
        `**${a} + ${b} = ${r}** ✅${withNote}`,
      ],
      answer: String(r),
    }
  }
  if (n.includes('rest') || text.includes('-')) {
    const r = Math.round((a - b) * 1e10) / 1e10
    return {
      steps: [
        `Restamos **${a} - ${b}**`,
        `Ponemos las comas una encima de la otra y restamos normal.`,
        `**${a} - ${b} = ${r}** ✅${withNote}`,
      ],
      answer: String(r),
    }
  }
  if (n.includes('multiplic') || text.includes('*') || text.includes('×')) {
    const da = (String(a).split('.')[1] || '').length
    const db = (String(b).split('.')[1] || '').length
    const r = Math.round(a * b * 1e10) / 1e10
    return {
      steps: grade <= 4
        ? [
            `Multiplicamos **${a} × ${b}** 🔢`,
            `Paso 1: Multiplica sin la coma: ${Math.round(a * 10 ** da)} × ${Math.round(b * 10 ** db)}`,
            `Paso 2: El resultado tiene ${da + db} decimales.`,
            `**${a} × ${b} = ${r}** ✅`,
          ]
        : [
            `${a} × ${b}: multiplica sin coma, luego pon ${da + db} decimales.`,
            `**= ${r}**`,
          ],
      answer: String(r),
    }
  }
  if (n.includes('divid') || text.includes('/') || text.includes('÷')) {
    const r = Math.round((a / b) * 1e10) / 1e10
    return {
      steps: [
        `Dividimos **${a} ÷ ${b}**`,
        `Dividimos normal. La coma en el resultado queda donde corresponde.`,
        `**${a} ÷ ${b} = ${r}** ✅`,
      ],
      answer: String(r),
    }
  }

  return null
}

// ── Números enteros (7°-8°) ───────────────────────────────────────────────────

function solveIntegers(text, grade) {
  const n = norm(text)
  const nums = extractNumbers(text)
  if (nums.length < 2) return null
  const [a, b] = nums

  if (n.includes('sum') || text.includes('+')) {
    return {
      steps: [
        `Suma de enteros: **${a} + (${b})**`,
        `En la recta numérica: empezamos en ${a}`,
        b >= 0 ? `Avanzamos ${b} hacia la derecha ➡️` : `Retrocedemos ${Math.abs(b)} hacia la izquierda ⬅️`,
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
        `En la recta numérica: movemos ${Math.abs(b)} pasos ${-b >= 0 ? 'a la derecha ➡️' : 'a la izquierda ⬅️'}`,
        `**Resultado: ${a - b}**`,
      ],
      answer: String(a - b),
    }
  }

  return null
}

// ── Estadística ───────────────────────────────────────────────────────────────

function solveStatistics(text, grade) {
  const n = norm(text)
  const nums = extractNumbers(text)
  if (nums.length < 2) return null

  const sorted = [...nums].sort((a, b) => a - b)
  const sum = nums.reduce((acc, v) => acc + v, 0)
  const mean = Math.round((sum / nums.length) * 100) / 100
  const mid = Math.floor(sorted.length / 2)
  const median = sorted.length % 2 === 0
    ? (sorted[mid - 1] + sorted[mid]) / 2
    : sorted[mid]
  const freq = {}
  nums.forEach(v => { freq[v] = (freq[v] || 0) + 1 })
  const maxFreq = Math.max(...Object.values(freq))
  const mode = Object.keys(freq).filter(k => freq[k] === maxFreq)

  if (n.includes('media') || n.includes('promedio')) {
    return {
      steps: [
        `Datos: **${nums.join(', ')}**`,
        `Promedio = suma de todos ÷ cantidad`,
        `${nums.join(' + ')} = ${sum}`,
        `${sum} ÷ ${nums.length} = **${mean}**`,
      ],
      answer: String(mean),
    }
  }
  if (n.includes('mediana')) {
    return {
      steps: [
        `Ordenamos los datos: **${sorted.join(', ')}**`,
        `Buscamos el valor del medio (${sorted.length} datos):`,
        sorted.length % 2 === 0
          ? `Hay par de datos → promediamos los dos centrales: (${sorted[mid - 1]} + ${sorted[mid]}) ÷ 2`
          : `El dato central está en la posición ${mid + 1}`,
        `**Mediana = ${median}**`,
      ],
      answer: String(median),
    }
  }
  if (n.includes('moda')) {
    return {
      steps: [
        `Datos: **${nums.join(', ')}**`,
        `Contamos cuántas veces aparece cada número: ${Object.entries(freq).map(([k, v]) => `${k}→${v}vez`).join(', ')}`,
        `El que más se repite (${maxFreq} veces):`,
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
        `Rango = el mayor − el menor`,
        `${sorted[sorted.length - 1]} − ${sorted[0]} = **${range}**`,
      ],
      answer: String(range),
    }
  }

  return null
}

// ── Probabilidad ──────────────────────────────────────────────────────────────

function solveProbability(text, grade) {
  const nums = extractNumbers(text)
  if (nums.length < 2) return null
  const [favorable, total] = nums
  if (total === 0) return null

  const { num, den } = simplifyFraction(favorable, total)
  const pct = Math.round((favorable / total) * 10000) / 100

  return {
    steps: grade <= 6
      ? [
          `Probabilidad = casos favorables ÷ casos posibles 🎲`,
          `Favorables: ${favorable} | Total posible: ${total}`,
          `P = ${favorable}/${total}${num !== favorable ? ` = **${num}/${den}**` : ''}`,
          `En porcentaje: **${pct}%**`,
        ]
      : [
          `P = ${favorable}/${total}${num !== favorable ? ` = ${num}/${den}` : ''}`,
          `Decimal: ${Math.round((favorable / total) * 1000) / 1000} | **${pct}%**`,
        ],
    answer: `${num}/${den}`,
  }
}

// ── Razones y proporciones ────────────────────────────────────────────────────

function solveRatiosProportion(text, grade) {
  const n = norm(text)
  const nums = extractNumbers(text)
  if (nums.length < 3) return null

  const [a, b, c] = nums
  const x = (b * c) / a

  return {
    steps: grade <= 6
      ? [
          `Proporción: ${a}/${b} = ${c}/x ⚖️`,
          `Si ${a} corresponde a ${b}, ¿cuánto corresponde a ${c}?`,
          `Cruzamos: ${a} × x = ${b} × ${c}`,
          `${a}x = ${b * c}`,
          `**x = ${b * c} ÷ ${a} = ${x}** ✅`,
        ]
      : [
          `${a}/${b} = ${c}/x → ${a}x = ${b * c} → **x = ${x}**`,
        ],
    answer: String(x),
  }
}

// ── Explicaciones por tema ────────────────────────────────────────────────────

function topicExplanation(type, grade) {
  if (grade <= 2) {
    const map = {
      addition:   `¡Hola! 😊 Puedo ayudarte con sumas.\n\nEscribe algo como:\n- "3 + 4"\n- "5 + 2"\n- "¿Cuánto es 7 + 8?"\n\n¡Escríbeme tu suma! 🍎`,
      subtraction:`¡Hola! 😊 Puedo ayudarte con restas.\n\nEscribe algo como:\n- "10 - 3"\n- "¿Cuánto es 8 - 5?"\n\n¡Escríbeme tu resta! 🍪`,
      fraction:   `¡Las fracciones son como partes de una pizza! 🍕\n\nPor ejemplo:\n- 1/2 es LA MITAD de la pizza\n- 1/4 es UN CUARTO (la pizza cortada en 4)\n\nEscríbeme tu fracción y te explico 😊`,
      general:    `¡Hola! Soy tu tutor de MateMagia 🧙‍♂️✨\n\nPuedo ayudarte con:\n- Sumas: "3 + 4"\n- Restas: "10 - 3"\n- "¿Cuánto es 5 + 7?"\n\n¡Escríbeme tu pregunta! 😊`,
    }
    return map[type] || map.general
  }

  if (grade <= 4) {
    const map = {
      fraction:   `**¿Qué es una fracción?** 🍕\n\nImagina una pizza cortada en pedazos iguales:\n- **El número de abajo**: en cuántos pedazos está cortada\n- **El número de arriba**: cuántos pedazos tienes\n\n**Ejemplo:** 3/4 → pizza cortada en 4 pedazos, tú tienes 3.\n\n¿Tienes una fracción? ¡Escríbela! 😊`,
      percentage: `**¿Qué es un porcentaje?** 📊\n\n"Porcentaje" significa "de cada 100".\n\n- **50%** = la mitad (50 de 100)\n- **25%** = la cuarta parte (25 de 100)\n- **10%** = divides por 10\n\n¡Escríbeme tu problema! 😊`,
      geometry:   `**Figuras geométricas** 📐\n\nPuedo calcular:\n- **Área** (cuánto mide por dentro)\n- **Perímetro** (cuánto mide por fuera, la orilla)\n\nEjemplos:\n- "Área del rectángulo de 5 y 3"\n- "Perímetro del cuadrado de lado 4"\n\n¡Escríbeme tu figura! 😊`,
      general:    `¡Hola! Soy tu tutor de MateMagia 🧙‍♂️✨\n\nPuedo ayudarte con:\n- ➕ Sumas y restas\n- ✖️ Multiplicaciones y divisiones\n- 🍕 Fracciones\n- 📐 Áreas y perímetros\n- 📊 Porcentajes\n\n¿Qué quieres aprender hoy? 😊`,
    }
    return map[type] || map.general
  }

  if (grade <= 6) {
    const map = {
      fraction:   `**Fracciones** 🍕\n\n- **Arriba (numerador)**: las partes que tienes\n- **Abajo (denominador)**: en cuántas partes está dividido el todo\n\n**Operaciones:**\n- Mismos denominadores: suma/resta solo los de arriba\n- Distintos: busca denominador común\n- Multiplicar: arriba × arriba, abajo × abajo\n- Dividir: da vuelta la segunda y multiplica\n\n¿Tienes una fracción? ¡Escríbela! 😊`,
      algebra:    `**Ecuaciones** ⚖️\n\nPiensa en una balanza: lo que haces de un lado lo haces del otro.\n\n- **x + 3 = 7** → x = 7 - 3 = 4\n- **2x = 10** → x = 10 ÷ 2 = 5\n- **x/4 = 3** → x = 3 × 4 = 12\n\n¡Escríbeme tu ecuación! 😊`,
      percentage: `**Porcentajes** 📊\n\n- X% de Y = (X ÷ 100) × Y\n- ¿Qué % es X de Y? = (X ÷ Y) × 100\n\n**Trucos:**\n- 10% → ÷ 10\n- 50% → ÷ 2\n- 25% → ÷ 4\n- 1% → ÷ 100\n\n¡Escríbeme tu problema! 😊`,
      general:    `¡Hola! Soy tu tutor de MateMagia 🧙‍♂️✨\n\nPuedo ayudarte con:\n- 🍕 Fracciones: "3/4 + 1/2"\n- 📊 Porcentajes: "30% de 200"\n- ⚖️ Ecuaciones: "2x + 3 = 11"\n- 📐 Geometría: "área rectángulo 5 y 8"\n- 🔢 Potencias: "3^4" o "√81"\n- 📖 Problemas de palabras\n\n¿En qué te ayudo? 😊`,
    }
    return map[type] || map.general
  }

  // 7°-8°
  const map = {
    algebra:    `**Álgebra** ⚖️\n\nEcuaciones lineales y sistemas.\n\nEjemplos que puedes escribir:\n- "2x + 5 = 13"\n- "x/3 - 2 = 4"\n- "3x = 21"\n\n¡Escríbeme tu ecuación!`,
    stats:      `**Estadística** 📊\n\n- **Promedio (media)**: suma ÷ cantidad\n- **Mediana**: valor del centro al ordenar\n- **Moda**: el que más se repite\n- **Rango**: máximo − mínimo\n\nEjemplo: "media de 3, 7, 5, 9, 11"`,
    probability:`**Probabilidad** 🎲\n\nP(evento) = casos favorables ÷ casos totales\n\nEjemplo: "probabilidad 3 de 8"\n→ P = 3/8 = 37.5%`,
    general:    `Hola. Soy tu tutor de MateMagia 🧙‍♂️\n\nPuedo ayudarte con:\n- Álgebra: "3x − 5 = 10"\n- Estadística: "media de 3, 7, 5, 9"\n- Probabilidad: "probabilidad 3 de 8"\n- Potencias: "2^6" o "√144"\n- Geometría y porcentajes avanzados\n\n¿En qué te puedo ayudar?`,
  }
  return map[type] || map.general
}

// ── Formateo final con grado ──────────────────────────────────────────────────

function fmtGrade({ steps, answer }, type, grade) {
  const numLabels = grade <= 2
    ? ['1️⃣', '2️⃣', '3️⃣', '4️⃣', '5️⃣', '6️⃣']
    : null

  const formattedSteps = steps
    .filter(s => s !== '')
    .map((s, i) => numLabels ? `${numLabels[i] || `${i + 1}.`} ${s}` : `**Paso ${i + 1}:** ${s}`)
    .join('\n')

  const closer = closing(grade)
  const enc = encouragement(grade)
  const opening = intro(grade)

  let result
  if (grade <= 2) {
    result = `${opening}\n\n${formattedSteps}\n\n🌟 **${enc}** ${closer}`
  } else if (grade <= 4) {
    result = `${opening}\n\n${formattedSteps}\n\n${enc} ${closer}`
  } else {
    result = `${opening}\n\n${formattedSteps}\n\n✅ **Resultado: ${answer}**\n\n${enc} ${closer}`
  }

  return { message: result, type }
}

// ── Punto de entrada ──────────────────────────────────────────────────────────

export function generateResponse(userMessage, topicContext = null, gradeLevel = 1) {
  const text = userMessage.trim()
  const grade = Math.max(1, Math.min(8, gradeLevel || 1))

  if (!text) {
    return { message: topicExplanation('general', grade), type: 'general' }
  }

  const type = detectType(text)

  // Orden de prioridad de resolvers
  const resolvers = [
    ['stats',         () => solveStatistics(text, grade)],
    ['probability',   () => solveProbability(text, grade)],
    ['ratio',         () => solveRatiosProportion(text, grade)],
    ['integers',      () => solveIntegers(text, grade)],
    ['geometry',      () => solveGeometry(text, grade)],
    ['algebra',       () => solveAlgebra(text, grade)],
    ['fraction',      () => solveFraction(text, grade)],
    ['percentage',    () => solvePercentage(text, grade)],
    ['power',         () => solvePower(text, grade)],
    ['decimal',       () => solveDecimal(text, grade)],
    ['wordproblem',   () => solveWordProblem(text, grade)],
  ]

  // Try the resolver whose type matches detection first
  const matched = resolvers.find(([t]) => t === type)
  if (matched) {
    const r = matched[1]()
    if (r) return fmtGrade(r, matched[0], grade)
  }

  // Fall back to direct arithmetic expression
  const arith = solveArithmetic(text, grade)
  if (arith) return fmtGrade(arith, type, grade)

  // Aggressive arithmetic extraction: pull any "<num> <op> <num>" from
  // the text and try to solve it. Handles things like "¿cómo resuelvo
  // 12 + 5?" or "ayuda con 7*8".
  const expr = text.match(/-?\d+(?:[.,]\d+)?\s*[+\-*x×÷/]\s*-?\d+(?:[.,]\d+)?/)
  if (expr) {
    const cleaned = expr[0].replace(/[x×]/g, '*').replace(/÷/g, '/').replace(/,/g, '.')
    const arith2 = solveArithmetic(cleaned, grade)
    if (arith2) return fmtGrade(arith2, 'arithmetic', grade)
  }

  // Try all other resolvers in priority order
  for (const [resolverType, fn] of resolvers) {
    if (resolverType !== type) {
      const r = fn()
      if (r) return fmtGrade(r, resolverType, grade)
    }
  }

  // Smarter fallback: instead of always returning the generic welcome
  // message, try to be useful based on whatever the kid might be asking.
  return { message: smartFallback(text, type, grade), type: 'help' }
}

// Last-resort fallback that gives the student a useful answer even when
// no resolver matched. Tries to teach the most likely topic based on the
// detected type, suggests concrete examples to type, and never repeats
// the same generic welcome message.
function smartFallback(text, type, grade) {
  const lower = text.toLowerCase()

  // Topic hints — match common Spanish keywords and teach a tiny lesson.
  const topicHints = [
    { keys: ['tabla', 'multiplicar', 'multiplica', 'veces'],
      lesson: '✖️ **Multiplicar es sumar el mismo número varias veces.**\n\nEjemplo: 4 × 3 = 4 + 4 + 4 = 12.\n\nTrucos rápidos:\n• Tabla del 2: dobla el número (5 × 2 = 10)\n• Tabla del 5: termina en 0 o 5 (3 × 5 = 15)\n• Tabla del 10: agrega un cero (7 × 10 = 70)\n• Tabla del 9: los dígitos del resultado suman 9 (9 × 4 = 36, 3+6=9)\n\nEscríbeme un ejercicio como **"7 × 8"** y te muestro paso a paso.' },
    { keys: ['suma', 'sumar', 'mas '],
      lesson: '➕ **Sumar es juntar cantidades.**\n\nPara sumar 27 + 35:\n1. Suma las unidades: 7 + 5 = 12. Escribes el 2 y "llevas" 1.\n2. Suma las decenas: 2 + 3 + 1 (la que llevaste) = 6.\n3. Resultado: 62.\n\nEscríbeme un ejercicio como **"48 + 27"** y te lo resuelvo paso a paso.' },
    { keys: ['resta', 'restar', 'menos '],
      lesson: '➖ **Restar es quitar.**\n\nPara 52 − 27:\n1. Unidades: 2 − 7 no se puede, así que "pides prestado" 1 a las decenas.\n2. Ahora son 12 − 7 = 5.\n3. Decenas: 4 (después de prestar) − 2 = 2.\n4. Resultado: 25.\n\nEscríbeme **"73 − 28"** y te lo muestro paso a paso.' },
    { keys: ['división', 'dividir', 'divid', 'reparti'],
      lesson: '➗ **Dividir es repartir en partes iguales.**\n\nPara 24 ÷ 6:\n• Piensa: ¿cuántos grupos de 6 caben en 24?\n• 6 × 4 = 24, entonces 24 ÷ 6 = 4.\n\nEscríbeme **"56 ÷ 7"** y te explico.' },
    { keys: ['fracción', 'fraccion', 'medio', 'tercio', 'cuarto'],
      lesson: '🍕 **Una fracción es una parte de un entero.**\n\n3/4 = "tres cuartos" = una pizza cortada en 4 partes, tomo 3.\n\n• Numerador (arriba) = cuántas partes tomo.\n• Denominador (abajo) = en cuántas partes está cortado.\n\nEscríbeme **"1/2 + 1/4"** y te muestro cómo se suman.' },
    { keys: ['decimal', 'coma', 'punto'],
      lesson: '🔢 **Los decimales son números más pequeños que 1.**\n\n0,5 = 5 décimos = medio entero (igual que 1/2).\n0,25 = 25 centésimos = un cuarto.\n\nEscríbeme **"1,5 + 2,3"** y te lo resuelvo paso a paso.' },
    { keys: ['porcentaje', 'porciento', '%', 'descuento'],
      lesson: '💯 **El porcentaje es una parte de 100.**\n\n25% = 25 de cada 100 = 1/4 = 0,25.\n\nPara calcular 25% de 80:\n80 × 25 ÷ 100 = 20.\n\nEscríbeme **"15% de 200"** y te lo muestro.' },
    { keys: ['área', 'area', 'perímetro', 'perimetro'],
      lesson: '📐 **Área = el espacio que ocupa la figura.**\n**Perímetro = la suma de todos los lados.**\n\nRectángulo: área = base × altura, perímetro = 2 × (base + altura).\nCuadrado: área = lado × lado, perímetro = 4 × lado.\n\nEscríbeme **"área de un rectángulo de 5 por 3"** y te lo calculo.' },
    { keys: ['ecuación', 'ecuacion', 'incógnita', 'incognita', ' x ', '=x'],
      lesson: '🔍 **Una ecuación es una "balanza" donde hay un número escondido (x).**\n\nPara 2x + 3 = 11:\n1. Resta 3 a los dos lados: 2x = 8.\n2. Divide por 2: x = 4.\n\nEscríbeme **"resuelve 3x + 5 = 20"** y te lo muestro.' },
  ]

  for (const t of topicHints) {
    if (t.keys.some(k => lower.includes(k))) {
      return t.lesson + '\n\n— Tu Tutor MateMagia 🧙‍♂️'
    }
  }

  // No keyword hit. Give a *useful* prompt list adapted to the grade.
  const examplesByGrade = {
    1: ['"3 + 4"', '"10 - 5"', '"contar hasta 20"'],
    2: ['"23 + 15"', '"35 - 17"', '"5 × 3"'],
    3: ['"7 × 8"', '"56 ÷ 7"', '"123 + 87"'],
    4: ['"245 × 6"', '"1/2 + 1/4"', '"0,5 + 0,3"'],
    5: ['"3/4 de 80"', '"25% de 120"', '"perímetro 5x3"'],
    6: ['"15% de 200"', '"2x + 4 = 14"', '"área círculo radio 5"'],
    7: ['"-5 + 8"', '"3x - 7 = 11"', '"3² + 4²"'],
    8: ['"resolver x² = 49"', '"probabilidad dado par"', '"media de 4,6,8,10"'],
  }
  const exs = examplesByGrade[grade] || examplesByGrade[4]

  return (
    `Mmm, no entendí exactamente esa pregunta, pero **te puedo ayudar con cualquier cosa de matemáticas de 1° a 8° básico**. 🧙‍♂️\n\n` +
    `Algunos ejemplos que puedes escribirme (apropiados para tu grado):\n` +
    exs.map(e => `• ${e}`).join('\n') +
    `\n\nO escribe palabras como **"explícame fracciones"**, **"ayuda con multiplicar"**, **"qué es un porcentaje"** y te enseño paso a paso.`
  )
}

export function getWelcomeMessage(grade = 1) {
  if (grade <= 2) {
    return `¡Hola! Soy tu tutor de MateMagia 🧙‍♂️✨\n\n¡Puedo ayudarte con las matemáticas! Prueba escribir:\n- "3 + 4" 🍎\n- "10 - 3"\n- "¿Cuánto es 5 + 2?"\n\n¡Escríbeme tu pregunta! 😊`
  }
  if (grade <= 4) {
    return `¡Hola! Soy tu tutor de MateMagia 🧙‍♂️✨\n\nPuedo ayudarte con:\n- Sumas y restas 😊\n- Multiplicaciones y divisiones\n- Fracciones 🍕\n- Problemas con palabras 📖\n\n¿Qué quieres aprender hoy? 🌟`
  }
  if (grade <= 6) {
    return `¡Hola! Soy tu tutor de MateMagia 🧙‍♂️✨\n\nPuedo ayudarte con:\n- Fracciones: "3/4 + 1/2"\n- Porcentajes: "30% de 150"\n- Ecuaciones: "2x + 3 = 11"\n- Geometría: áreas y perímetros\n\n¿En qué te ayudo hoy? 😊`
  }
  return `Hola. Soy tu tutor de MateMagia 🧙‍♂️\n\nPuedo ayudarte con:\n- Números enteros: "(-5) + 8"\n- Álgebra: "3x − 5 = 10"\n- Estadística: "media de 3, 7, 5, 9"\n- Probabilidad: "probabilidad 3 de 8"\n- Potencias y raíces: "2^6" o "√144"\n\n¿En qué te puedo ayudar?`
}
