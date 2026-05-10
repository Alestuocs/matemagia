// Math tutor - provides step-by-step explanations

const GREETINGS = ['¡Hola! 😊', '¡Claro!', '¡Buena pregunta!', '¡Vamos a resolverlo! 🔢']
const ENCOURAGEMENTS = ['¡Muy bien! 🌟', '¡Lo estás haciendo genial! 🚀', '¡Sigue así! 💪']

// Detect math problem type from user input
function detectProblemType(text) {
  const lower = text.toLowerCase()
  if (lower.includes('fraccion') || lower.includes('fracción') || (lower.includes('/') && !lower.includes('//'))) return 'fraction'
  if (lower.includes('ecuacion') || lower.includes('ecuación') || lower.includes('x =') || lower.includes('= x')) return 'equation'
  if (lower.includes('decimal') || (/\d,\d/.test(text))) return 'decimal'
  if (lower.includes('suma') || lower.includes('+')) return 'addition'
  if (lower.includes('resta') || lower.includes('-')) return 'subtraction'
  if (lower.includes('multiplic') || lower.includes('×') || lower.includes('*')) return 'multiplication'
  if (lower.includes('divis') || lower.includes('÷')) return 'division'
  if (lower.includes('porcent') || lower.includes('%')) return 'percentage'
  return 'general'
}

// Try to extract numbers from text
function extractNumbers(text) {
  return text.match(/-?\d+([.,]\d+)?/g)?.map(n => parseFloat(n.replace(',', '.'))) || []
}

// Solve and explain simple equations like "x + 3 = 7" or "2x = 10"
function solveEquation(text) {
  // Try to parse "x + a = b" or "x - a = b"
  let m = text.match(/x\s*\+\s*(\d+)\s*=\s*(\d+)/i)
  if (m) {
    const a = parseInt(m[1]), b = parseInt(m[2])
    return {
      steps: [
        `Tenemos: x + ${a} = ${b}`,
        `Para encontrar x, restamos ${a} de ambos lados:`,
        `x + ${a} - ${a} = ${b} - ${a}`,
        `x = ${b - a}`,
      ],
      answer: `x = ${b - a}`
    }
  }
  m = text.match(/x\s*-\s*(\d+)\s*=\s*(\d+)/i)
  if (m) {
    const a = parseInt(m[1]), b = parseInt(m[2])
    return {
      steps: [`Tenemos: x - ${a} = ${b}`, `Sumamos ${a} a ambos lados:`, `x = ${b + a}`],
      answer: `x = ${b + a}`
    }
  }
  m = text.match(/(\d+)\s*x\s*=\s*(\d+)/i)
  if (m) {
    const a = parseInt(m[1]), b = parseInt(m[2])
    return {
      steps: [`Tenemos: ${a}x = ${b}`, `Dividimos ambos lados por ${a}:`, `x = ${b} ÷ ${a} = ${b / a}`],
      answer: `x = ${b / a}`
    }
  }
  return null
}

// Main response generator
export function generateResponse(userMessage, topicContext = null) {
  const type = detectProblemType(userMessage)
  const numbers = extractNumbers(userMessage)
  const greeting = GREETINGS[Math.floor(Math.random() * GREETINGS.length)]

  // Try equation solving
  const eqResult = solveEquation(userMessage)
  if (eqResult) {
    return {
      message: `${greeting} Vamos paso a paso:\n\n${eqResult.steps.map((s, i) => `**Paso ${i + 1}:** ${s}`).join('\n')}\n\n✅ **Resultado: ${eqResult.answer}**\n\n¿Te quedó claro? 😊`,
      type: 'equation'
    }
  }

  // Try simple arithmetic
  if (numbers.length >= 2) {
    const a = numbers[0], b = numbers[1]
    if (type === 'addition' || userMessage.includes('+')) {
      return {
        message: `${greeting}\n\n**Para sumar ${a} + ${b}:**\n\n**Paso 1:** Alinea los números por las unidades\n**Paso 2:** Suma de derecha a izquierda\n**Paso 3:** Si la suma supera 9, llevas 1 a la siguiente columna\n\n✅ **${a} + ${b} = ${a + b}**\n\n${ENCOURAGEMENTS[Math.floor(Math.random() * ENCOURAGEMENTS.length)]}`,
        type: 'addition'
      }
    }
    if (type === 'subtraction' || userMessage.includes('-')) {
      return {
        message: `${greeting}\n\n**Para restar ${a} - ${b}:**\n\n**Paso 1:** Alinea los números\n**Paso 2:** Resta de derecha a izquierda\n**Paso 3:** Si no alcanza, pide prestado a la columna siguiente\n\n✅ **${a} - ${b} = ${a - b}**`,
        type: 'subtraction'
      }
    }
    if (type === 'multiplication') {
      return {
        message: `${greeting}\n\n**Para multiplicar ${a} × ${b}:**\n\n**Recuerda:** La multiplicación es una suma repetida\n${a} × ${b} = sumar ${a} exactamente ${b} veces\n\n✅ **${a} × ${b} = ${a * b}**\n\n💡 **Tip:** Aprende las tablas de memoria, ¡te ahorra mucho tiempo!`,
        type: 'multiplication'
      }
    }
    if (type === 'division' && b !== 0) {
      const q = Math.floor(a / b), r = a % b
      return {
        message: `${greeting}\n\n**Para dividir ${a} ÷ ${b}:**\n\n**Paso 1:** ¿Cuántas veces cabe ${b} en ${a}?\n**Paso 2:** ${b} × ${q} = ${b * q}\n**Paso 3:** Resto: ${a} - ${b * q} = ${r}\n\n✅ **${a} ÷ ${b} = ${q}${r > 0 ? ` con resto ${r}` : ''}**`,
        type: 'division'
      }
    }
    if (type === 'percentage') {
      return {
        message: `${greeting}\n\n**Para calcular porcentajes:**\n\n**Fórmula:** % de número = (% ÷ 100) × número\n\n**Ejemplo con tus números:**\n${a}% de ${b} = (${a} ÷ 100) × ${b} = ${(a / 100) * b}\n\n💡 **Tip:** 10% = dividir por 10, 50% = dividir por 2, 25% = dividir por 4`,
        type: 'percentage'
      }
    }
  }

  // Topic-specific explanations
  const topicResponses = {
    fraction: `${greeting}\n\n**¿Qué es una fracción?** 🍕\n\nUna fracción tiene dos partes:\n- **Numerador** (arriba): cuántas partes tienes\n- **Denominador** (abajo): en cuántas partes está dividido el todo\n\n**Ejemplo:** 3/4 significa que tienes 3 de 4 partes\n\n**Para convertir fracción impropia a mixto:**\n1. Divide numerador ÷ denominador\n2. El cociente es el número entero\n3. El resto es el nuevo numerador\n\n**Ejemplo:** 7/3 → 7÷3=2 resto 1 → **2 1/3** ✅`,
    equation: `${greeting}\n\n**¿Cómo resolver ecuaciones?** ⚖️\n\nPiensa en una **balanza**: lo que haces de un lado, debes hacerlo del otro.\n\n**Regla de oro:** Para despejar x, haz la operación inversa:\n- Si tiene **+ a** → resta a de ambos lados\n- Si tiene **- a** → suma a de ambos lados\n- Si tiene **× a** → divide ambos lados por a\n\n**Ejemplo:** x + 5 = 12\nx = 12 - 5 = **7** ✅\n\n¿Tienes una ecuación específica? ¡Escríbela y la resolvemos juntos!`,
    decimal: `${greeting}\n\n**Números decimales** 🔢\n\nLa coma separa los **enteros** de los **decimales**:\n- Antes de la coma: unidades, decenas, centenas...\n- Después de la coma: décimas, centésimas, milésimas...\n\n**Para multiplicar decimales:**\n1. Cuenta los decimales de ambos números\n2. Multiplica normalmente\n3. Pon la coma según el total de decimales\n\n**Ejemplo:** 2,3 × 0,5\n→ 23 × 5 = 115\n→ 1+1 = 2 decimales → **1,15** ✅`,
    general: `${greeting}\n\n¡Estoy aquí para ayudarte con cualquier pregunta de matemáticas! 🌟\n\nPuedo ayudarte con:\n- ➕ Sumas y restas\n- ✖️ Multiplicaciones y divisiones\n- 🍕 Fracciones y números mixtos\n- 🔢 Números decimales\n- ⚖️ Ecuaciones\n- 📊 Porcentajes\n\n¿Qué quieres aprender hoy? Escríbeme tu pregunta o el ejercicio que no entiendes. 😊`
  }

  return {
    message: topicResponses[type] || topicResponses.general,
    type
  }
}

export function getWelcomeMessage() {
  return `¡Hola! Soy tu tutor de MateMagia 🧙‍♂️✨\n\nPuedes preguntarme cualquier cosa sobre matemáticas. Por ejemplo:\n- "¿Cómo se resuelve x + 5 = 12?"\n- "¿Cómo multiplico decimales?"\n- "No entiendo las fracciones"\n\n¿En qué te ayudo hoy? 😊`
}
