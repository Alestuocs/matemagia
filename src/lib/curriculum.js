// Helper: shuffle an array
function shuffle(arr) {
  const a = [...arr]
  for (let i = a.length - 1; i > 0; i--) {
    const j = Math.floor(Math.random() * (i + 1));
    [a[i], a[j]] = [a[j], a[i]]
  }
  return a
}

// Helper: generate 4 multiple-choice options with the correct answer included
function makeOptions(correct, generator, wrongCount = 3) {
  const opts = new Set([correct])
  let attempts = 0
  while (opts.size < wrongCount + 1 && attempts < 50) {
    const v = generator()
    if (v !== correct && v >= 0) opts.add(v)
    attempts++
  }
  // fill if not enough
  let fill = 0
  while (opts.size < 4) {
    fill++
    if (!opts.has(correct + fill)) opts.add(correct + fill)
    if (opts.size < 4 && !opts.has(correct - fill) && correct - fill >= 0) opts.add(correct - fill)
  }
  return shuffle([...opts]).map(String)
}

// Helper: near options within range
function nearOpts(correct, min, max) {
  return makeOptions(correct, () => {
    const delta = Math.floor(Math.random() * 6) + 1
    return Math.random() < 0.5 ? correct + delta : Math.max(min, correct - delta)
  })
}

// ─────────────────────────────────────────────
// CURRICULUM DEFINITION
// ─────────────────────────────────────────────

export const CURRICULUM = [
  // ── GRADE 1 ──────────────────────────────────
  {
    id: 'numbers-0-10',
    title: 'Números del 0 al 10',
    description: 'Aprende a contar y reconocer los números del 0 al 10',
    gradeLevel: 1,
    icon: '🔢',
    orderIndex: 1,
    type: 'numbers',
    lessonSlides: [
      {
        title: '¿Qué son los números?',
        content: 'Los números nos ayudan a contar cosas. ¡Hay números por todas partes!',
        visual: '1️⃣ 2️⃣ 3️⃣ 4️⃣ 5️⃣',
      },
      {
        title: 'Contemos juntos',
        content: 'Mira las manzanas: 🍎 🍎 🍎 = ¡3 manzanas!\nCada vez que agregas uno, el número sube.',
        visual: '0 → 1 → 2 → 3 → 4 → 5 → 6 → 7 → 8 → 9 → 10',
      },
      {
        title: 'Practiquemos',
        content: '¡Ahora cuenta tú! Cuenta los objetos y elige el número correcto.',
        visual: '¡Tú puedes! 🌟',
      },
    ],
    tips: [
      'Usa los dedos para contar',
      'Señala cada objeto mientras cuentas',
      'Di el número en voz alta',
    ],
    generateExercises: (count = 5) => {
      return Array.from({ length: count }, (_, i) => {
        const n = Math.floor(Math.random() * 11)
        const emoji = ['⭐', '🍎', '🐶', '🌸', '🎈'][i % 5]
        const type = i % 2 === 0 ? 'multiple-choice' : 'write-answer'
        return {
          id: `num010-${i}-${Date.now()}`,
          type,
          question: `¿Cuántos ${emoji} hay?\n${emoji.repeat(n) || '(ninguno)'}`,
          visualHint: n === 0 ? '(ninguno)' : emoji.repeat(n),
          answer: n,
          options: type === 'multiple-choice' ? nearOpts(n, 0, 10) : null,
          hint: `Señala cada ${emoji} y cuenta: 1, 2, 3...`,
          explanation: `Contamos: ${n === 0 ? 'No hay ninguno, entonces es 0.' : Array.from({ length: n }, (_, k) => k + 1).join(', ')}${n > 0 ? '.' : ''}\nLa respuesta es ${n}.`,
          difficulty: 1,
          xpReward: 10,
        }
      })
    },
  },

  {
    id: 'numbers-11-20',
    title: 'Números del 11 al 20',
    description: 'Conoce los números del 11 al 20',
    gradeLevel: 1,
    icon: '🔟',
    orderIndex: 2,
    type: 'numbers',
    lessonSlides: [
      {
        title: 'Más allá del 10',
        content: 'Después del 10 vienen más números: 11, 12, 13... ¡hasta el 20!',
        visual: '11 12 13 14 15 16 17 18 19 20',
      },
      {
        title: 'Decena y unidades',
        content: 'El 15 tiene 1 decena (10) y 5 unidades.\n10 + 5 = 15',
        visual: '🔟 + ⭐⭐⭐⭐⭐ = 15',
      },
    ],
    tips: [
      'El 11 suena como "once", el 12 como "doce"',
      'Del 13 al 19 dicen "trece, catorce, quince, dieciséis..."',
      '¡El 20 es dos decenas!',
    ],
    generateExercises: (count = 5) => {
      return Array.from({ length: count }, (_, i) => {
        const n = Math.floor(Math.random() * 10) + 11
        const types = ['multiple-choice', 'write-answer', 'true-false']
        const type = types[i % 3]
        const wrongN = Math.floor(Math.random() * 10) + 11
        const statement = `El número que viene después del ${n - 1} es ${n}`
        return {
          id: `num1120-${i}-${Date.now()}`,
          type,
          question: type === 'true-false'
            ? `¿Es verdad? "${statement}"`
            : `¿Qué número va después del ${n - 1}?`,
          answer: type === 'true-false' ? 'verdadero' : n,
          options: type === 'multiple-choice' ? nearOpts(n, 11, 20) : null,
          hint: `Cuenta desde ${n - 1}: ${n - 1}... ¿qué sigue?`,
          explanation: `Después del ${n - 1} viene el ${n}.\nSolo hay que sumar 1: ${n - 1} + 1 = ${n}.`,
          difficulty: 1,
          xpReward: 10,
        }
      })
    },
  },

  {
    id: 'numbers-0-100',
    title: 'Números del 0 al 100',
    description: 'Cuenta hasta 100 y conoce decenas',
    gradeLevel: 1,
    icon: '💯',
    orderIndex: 3,
    type: 'numbers',
    lessonSlides: [
      {
        title: 'Las decenas',
        content: '10, 20, 30, 40, 50, 60, 70, 80, 90, 100\n¡Cada decena tiene 10 unidades!',
        visual: '10 → 20 → 30 → 40 → 50 → 60 → 70 → 80 → 90 → 100',
      },
      {
        title: 'Decenas y unidades',
        content: 'El 47 = 4 decenas + 7 unidades\n40 + 7 = 47',
        visual: '🔟🔟🔟🔟 + ⭐⭐⭐⭐⭐⭐⭐ = 47',
      },
    ],
    tips: [
      'Las decenas terminan en 0: 10, 20, 30...',
      'El número antes de 100 es 99',
      'Cuenta de 10 en 10 para ir más rápido',
    ],
    generateExercises: (count = 5) => {
      return Array.from({ length: count }, (_, i) => {
        if (i % 2 === 0) {
          // decenas question
          const dec = (Math.floor(Math.random() * 9) + 1) * 10
          return {
            id: `num100-${i}-${Date.now()}`,
            type: 'multiple-choice',
            question: `¿Cuántas decenas tiene el número ${dec}?`,
            answer: dec / 10,
            options: nearOpts(dec / 10, 1, 10),
            hint: `Divide entre 10: ${dec} ÷ 10 = ?`,
            explanation: `${dec} tiene ${dec / 10} decenas.\n${dec / 10} × 10 = ${dec}`,
            difficulty: 2,
            xpReward: 15,
          }
        } else {
          const a = Math.floor(Math.random() * 9) + 1
          const b = Math.floor(Math.random() * 9)
          const n = a * 10 + b
          return {
            id: `num100b-${i}-${Date.now()}`,
            type: 'write-answer',
            question: `¿Cuánto es ${a} decenas y ${b} unidades?`,
            answer: n,
            options: null,
            hint: `${a} decenas = ${a * 10}, más ${b} unidades`,
            explanation: `${a} decenas = ${a} × 10 = ${a * 10}\n${a * 10} + ${b} = ${n}`,
            difficulty: 2,
            xpReward: 15,
          }
        }
      })
    },
  },

  {
    id: 'comparison',
    title: 'Mayor que, menor que, igual',
    description: 'Compara números usando >, < e =',
    gradeLevel: 1,
    icon: '⚖️',
    orderIndex: 4,
    type: 'comparison',
    lessonSlides: [
      {
        title: 'Comparar números',
        content: 'Usamos símbolos para comparar:\n> significa "mayor que"\n< significa "menor que"\n= significa "igual a"',
        visual: '5 > 3 | 2 < 8 | 4 = 4',
      },
      {
        title: 'Truco del cocodrilo',
        content: 'El cocodrilo siempre come al número más grande 🐊\nSu boca apunta al número mayor.',
        visual: '7 🐊 3 → 7 > 3',
      },
    ],
    tips: [
      'La boca del cocodrilo apunta al número mayor',
      '> parece una boca abierta hacia la derecha',
      'Si son iguales, usa =',
    ],
    generateExercises: (count = 5) => {
      return Array.from({ length: count }, (_, i) => {
        const a = Math.floor(Math.random() * 20) + 1
        let b = Math.floor(Math.random() * 20) + 1
        if (i === 2) b = a // force equal case
        const correct = a > b ? '>' : a < b ? '<' : '='
        return {
          id: `cmp-${i}-${Date.now()}`,
          type: 'multiple-choice',
          question: `¿Cuál símbolo va en el espacio?\n${a} ___ ${b}`,
          answer: correct,
          options: shuffle(['>', '<', '=']).slice(0, 3).concat([correct]).filter((v, idx, arr) => arr.indexOf(v) === idx).slice(0, 3).concat([correct]).filter((v, idx, arr) => arr.indexOf(v) === idx),
          hint: `¿${a} es mayor, menor o igual a ${b}?`,
          explanation: `${a} ${correct} ${b}\n${a > b ? `${a} es mayor que ${b}` : a < b ? `${a} es menor que ${b}` : `${a} y ${b} son iguales`}.`,
          difficulty: 1,
          xpReward: 10,
        }
      })
    },
  },

  {
    id: 'addition-simple',
    title: 'Suma sin reagrupación hasta 20',
    description: 'Aprende a sumar números pequeños',
    gradeLevel: 1,
    icon: '➕',
    orderIndex: 5,
    type: 'addition',
    lessonSlides: [
      {
        title: '¿Qué es sumar?',
        content: 'Sumar es juntar cantidades.\n2 manzanas + 3 manzanas = 5 manzanas 🍎',
        visual: '🍎🍎 + 🍎🍎🍎 = 🍎🍎🍎🍎🍎',
      },
      {
        title: 'Cómo sumar',
        content: 'Para sumar 4 + 3:\n1. Empieza con 4\n2. Cuenta 3 más: 5, 6, 7\n¡La respuesta es 7!',
        visual: '4 + 3 = 7',
      },
    ],
    tips: [
      'Puedes usar los dedos para contar',
      'Empieza siempre con el número mayor',
      'Dibuja puntos para ayudarte',
    ],
    generateExercises: (count = 5) => {
      return Array.from({ length: count }, (_, i) => {
        const a = Math.floor(Math.random() * 10) + 1
        const b = Math.floor(Math.random() * (20 - a)) + 1
        const ans = a + b
        const emoji = ['⭐', '🍎', '🐶', '🎈', '🌸'][i % 5]
        const type = i % 3 === 0 ? 'multiple-choice' : 'write-answer'
        return {
          id: `add-${i}-${Date.now()}`,
          type,
          question: `¿Cuánto es ${a} + ${b}?`,
          visualHint: `${emoji.repeat(a)} + ${emoji.repeat(b)}`,
          answer: ans,
          options: type === 'multiple-choice' ? nearOpts(ans, 1, 20) : null,
          hint: `Cuenta ${a} ${emoji}, luego agrega ${b} más`,
          explanation: `Paso 1: Comenzamos con ${a}\nPaso 2: Contamos ${b} más: ${Array.from({ length: b }, (_, k) => a + k + 1).join(', ')}\nPaso 3: ${a} + ${b} = ${ans}`,
          difficulty: 1,
          xpReward: 10,
        }
      })
    },
  },

  {
    id: 'subtraction-simple',
    title: 'Resta sin reagrupación hasta 20',
    description: 'Aprende a restar números pequeños',
    gradeLevel: 1,
    icon: '➖',
    orderIndex: 6,
    type: 'subtraction',
    lessonSlides: [
      {
        title: '¿Qué es restar?',
        content: 'Restar es quitar una cantidad.\n5 globos - 2 globos = 3 globos 🎈',
        visual: '🎈🎈🎈🎈🎈 - 🎈🎈 = 🎈🎈🎈',
      },
      {
        title: 'Cómo restar',
        content: 'Para restar 8 - 3:\n1. Empieza en 8\n2. Cuenta hacia atrás 3: 7, 6, 5\n¡La respuesta es 5!',
        visual: '8 - 3 = 5',
      },
    ],
    tips: [
      'Cuenta hacia atrás desde el número mayor',
      'Puedes tachar objetos dibujados',
      'La resta siempre da un número menor',
    ],
    generateExercises: (count = 5) => {
      return Array.from({ length: count }, (_, i) => {
        const b = Math.floor(Math.random() * 9) + 1
        const a = b + Math.floor(Math.random() * 11)
        const ans = a - b
        const emoji = ['🎈', '🍊', '🌟', '🐱', '🍕'][i % 5]
        const type = i % 3 === 0 ? 'multiple-choice' : 'write-answer'
        return {
          id: `sub-${i}-${Date.now()}`,
          type,
          question: `¿Cuánto es ${a} - ${b}?`,
          visualHint: `${emoji.repeat(a)} ✂️ ${b}`,
          answer: ans,
          options: type === 'multiple-choice' ? nearOpts(ans, 0, 20) : null,
          hint: `Empieza en ${a} y cuenta ${b} hacia atrás`,
          explanation: `Paso 1: Comenzamos con ${a}\nPaso 2: Quitamos ${b}: ${Array.from({ length: b }, (_, k) => a - k - 1).join(', ')}\nPaso 3: ${a} - ${b} = ${ans}`,
          difficulty: 1,
          xpReward: 10,
        }
      })
    },
  },

  // ── GRADE 2 ──────────────────────────────────
  {
    id: 'addition-100',
    title: 'Suma hasta 100',
    description: 'Suma números de dos dígitos sin llevada',
    gradeLevel: 2,
    icon: '🔢➕',
    orderIndex: 7,
    type: 'addition',
    lessonSlides: [
      {
        title: 'Suma de dos dígitos',
        content: 'Para sumar 23 + 15:\n- Suma las unidades: 3 + 5 = 8\n- Suma las decenas: 2 + 1 = 3\n- Resultado: 38',
        visual: '  23\n+ 15\n────\n  38',
      },
    ],
    tips: [
      'Primero suma las unidades (columna derecha)',
      'Luego suma las decenas (columna izquierda)',
      'Si el resultado es mayor a 9, habrá que "llevar"',
    ],
    generateExercises: (count = 5) => {
      return Array.from({ length: count }, (_, i) => {
        const a1 = Math.floor(Math.random() * 5) + 1
        const a0 = Math.floor(Math.random() * 5)
        const b1 = Math.floor(Math.random() * (9 - a1)) + 1
        const b0 = Math.floor(Math.random() * (9 - a0))
        const a = a1 * 10 + a0
        const b = b1 * 10 + b0
        const ans = a + b
        const type = i % 2 === 0 ? 'multiple-choice' : 'write-answer'
        return {
          id: `add100-${i}-${Date.now()}`,
          type,
          question: `¿Cuánto es ${a} + ${b}?`,
          answer: ans,
          options: type === 'multiple-choice' ? nearOpts(ans, 10, 100) : null,
          hint: `Suma primero las unidades: ${a0} + ${b0} = ${a0 + b0}\nLuego las decenas: ${a1} + ${b1} = ${a1 + b1}`,
          explanation: `Unidades: ${a0} + ${b0} = ${a0 + b0}\nDecenas: ${a1} + ${b1} = ${a1 + b1}\nResultado: ${(a1 + b1)}${a0 + b0} = ${ans}`,
          difficulty: 2,
          xpReward: 15,
        }
      })
    },
  },

  {
    id: 'subtraction-100',
    title: 'Resta hasta 100',
    description: 'Resta números de dos dígitos sin prestada',
    gradeLevel: 2,
    icon: '🔢➖',
    orderIndex: 8,
    type: 'subtraction',
    lessonSlides: [
      {
        title: 'Resta de dos dígitos',
        content: 'Para restar 47 - 23:\n- Resta las unidades: 7 - 3 = 4\n- Resta las decenas: 4 - 2 = 2\n- Resultado: 24',
        visual: '  47\n- 23\n────\n  24',
      },
    ],
    tips: [
      'Primero resta las unidades',
      'Luego resta las decenas',
      'El número de arriba siempre debe ser mayor',
    ],
    generateExercises: (count = 5) => {
      return Array.from({ length: count }, (_, i) => {
        const a1 = Math.floor(Math.random() * 5) + 5
        const a0 = Math.floor(Math.random() * 9) + 1
        const b1 = Math.floor(Math.random() * a1)
        const b0 = Math.floor(Math.random() * a0)
        const a = a1 * 10 + a0
        const b = b1 * 10 + b0
        const ans = a - b
        const type = i % 2 === 0 ? 'multiple-choice' : 'write-answer'
        return {
          id: `sub100-${i}-${Date.now()}`,
          type,
          question: `¿Cuánto es ${a} - ${b}?`,
          answer: ans,
          options: type === 'multiple-choice' ? nearOpts(ans, 1, 99) : null,
          hint: `Resta primero las unidades: ${a0} - ${b0} = ${a0 - b0}`,
          explanation: `Unidades: ${a0} - ${b0} = ${a0 - b0}\nDecenas: ${a1} - ${b1} = ${a1 - b1}\nResultado: ${ans}`,
          difficulty: 2,
          xpReward: 15,
        }
      })
    },
  },

  {
    id: 'addition-carry',
    title: 'Suma con llevada',
    description: 'Suma con reagrupación de unidades a decenas',
    gradeLevel: 2,
    icon: '➕🔄',
    orderIndex: 9,
    type: 'addition',
    lessonSlides: [
      {
        title: '¿Qué es la llevada?',
        content: 'Cuando las unidades suman 10 o más, "llevamos" 1 a las decenas.\n27 + 15: unidades 7+5=12, escribimos 2 y llevamos 1.',
        visual: '  ¹27\n+  15\n────\n  42',
      },
    ],
    tips: [
      'Si las unidades suman 10 o más, lleva 1 a las decenas',
      'Anota el número pequeño encima de las decenas',
      'No olvides sumar la llevada',
    ],
    generateExercises: (count = 5) => {
      return Array.from({ length: count }, (_, i) => {
        let a, b
        do {
          a = Math.floor(Math.random() * 40) + 10
          b = Math.floor(Math.random() * 40) + 10
        } while ((a % 10) + (b % 10) < 10) // ensure carry
        const ans = a + b
        const type = i % 2 === 0 ? 'write-answer' : 'multiple-choice'
        return {
          id: `addcarry-${i}-${Date.now()}`,
          type,
          question: `¿Cuánto es ${a} + ${b}?`,
          answer: ans,
          options: type === 'multiple-choice' ? nearOpts(ans, 20, 100) : null,
          hint: `Unidades: ${a % 10} + ${b % 10} = ${(a % 10) + (b % 10)} → escribe ${(a % 10 + b % 10) % 10} y lleva 1`,
          explanation: `Unidades: ${a % 10} + ${b % 10} = ${(a % 10) + (b % 10)} → escribe ${(a % 10 + b % 10) % 10}, lleva 1\nDecenas: ${Math.floor(a / 10)} + ${Math.floor(b / 10)} + 1 (llevada) = ${Math.floor(a / 10) + Math.floor(b / 10) + 1}\nResultado: ${ans}`,
          difficulty: 2,
          xpReward: 20,
        }
      })
    },
  },

  {
    id: 'subtraction-borrow',
    title: 'Resta con préstamo',
    description: 'Resta con reagrupación cuando la unidad es menor',
    gradeLevel: 2,
    icon: '➖🔄',
    orderIndex: 10,
    type: 'subtraction',
    lessonSlides: [
      {
        title: '¿Cuándo pedir prestado?',
        content: 'Cuando la unidad de arriba es menor que la de abajo, pedimos 1 a las decenas.\n42 - 17: unidades 2-7 no se puede, pedimos a las decenas.',
        visual: ' ³12\n-  17\n────\n  25',
      },
    ],
    tips: [
      'Si no puedes restar, pide prestado a las decenas',
      'Al pedir prestado, la decena se reduce en 1',
      'La unidad que pediste se suma a la tuya',
    ],
    generateExercises: (count = 5) => {
      return Array.from({ length: count }, (_, i) => {
        let a, b
        do {
          a = Math.floor(Math.random() * 50) + 20
          b = Math.floor(Math.random() * 30) + 10
        } while (a <= b || (a % 10) >= (b % 10)) // ensure borrow needed
        const ans = a - b
        const type = i % 2 === 0 ? 'write-answer' : 'multiple-choice'
        return {
          id: `subborrow-${i}-${Date.now()}`,
          type,
          question: `¿Cuánto es ${a} - ${b}?`,
          answer: ans,
          options: type === 'multiple-choice' ? nearOpts(ans, 1, 80) : null,
          hint: `${a % 10} < ${b % 10}, pide prestado: ${(a % 10) + 10} - ${b % 10} = ${(a % 10) + 10 - (b % 10)}`,
          explanation: `Unidades: ${a % 10} < ${b % 10}, pedimos prestado.\n${(a % 10) + 10} - ${b % 10} = ${(a % 10) + 10 - (b % 10)}\nDecenas: ${Math.floor(a / 10) - 1} - ${Math.floor(b / 10)} = ${Math.floor(a / 10) - 1 - Math.floor(b / 10)}\nResultado: ${ans}`,
          difficulty: 2,
          xpReward: 20,
        }
      })
    },
  },

  // ── GRADE 3 ──────────────────────────────────
  {
    id: 'numbers-1000',
    title: 'Números hasta 1.000',
    description: 'Conoce los números hasta el mil',
    gradeLevel: 3,
    icon: '🔢💯',
    orderIndex: 11,
    type: 'numbers',
    lessonSlides: [
      {
        title: 'Las centenas',
        content: '100, 200, 300... son centenas.\n1 centena = 10 decenas = 100 unidades',
        visual: '100 200 300 400 500 600 700 800 900 1000',
      },
      {
        title: 'Centenas, decenas y unidades',
        content: '347 = 3 centenas + 4 decenas + 7 unidades\n= 300 + 40 + 7',
        visual: '347 → C:3 D:4 U:7',
      },
    ],
    tips: [
      'Las centenas terminan en 00: 100, 200...',
      'Descompón: 538 = 500 + 30 + 8',
      'El número antes de 1000 es 999',
    ],
    generateExercises: (count = 5) => {
      return Array.from({ length: count }, (_, i) => {
        const c = Math.floor(Math.random() * 9) + 1
        const d = Math.floor(Math.random() * 10)
        const u = Math.floor(Math.random() * 10)
        const n = c * 100 + d * 10 + u
        const types = [
          { q: `¿Cuántas centenas tiene el ${n}?`, a: c, hint: `${n} = ${c}×100 + ${d}×10 + ${u}` },
          { q: `¿Cuánto es ${c} centenas, ${d} decenas y ${u} unidades?`, a: n, hint: `${c}×100 + ${d}×10 + ${u}` },
        ]
        const t = types[i % 2]
        const type = i % 3 === 0 ? 'multiple-choice' : 'write-answer'
        return {
          id: `num1000-${i}-${Date.now()}`,
          type,
          question: t.q,
          answer: t.a,
          options: type === 'multiple-choice' ? nearOpts(t.a, 0, 1000) : null,
          hint: t.hint,
          explanation: `${n} = ${c}×100 + ${d}×10 + ${u} = ${c * 100} + ${d * 10} + ${u} = ${n}`,
          difficulty: 2,
          xpReward: 15,
        }
      })
    },
  },

  {
    id: 'multiplication-1-5',
    title: 'Tablas del 1 al 5',
    description: 'Aprende las tablas de multiplicar del 1 al 5',
    gradeLevel: 3,
    icon: '✖️',
    orderIndex: 12,
    type: 'multiplication',
    lessonSlides: [
      {
        title: '¿Qué es multiplicar?',
        content: 'Multiplicar es sumar el mismo número varias veces.\n3 × 4 = 4 + 4 + 4 = 12',
        visual: '3 × 4 = 🍎🍎🍎🍎 + 🍎🍎🍎🍎 + 🍎🍎🍎🍎 = 12',
      },
      {
        title: 'La tabla del 2',
        content: '2×1=2 | 2×2=4 | 2×3=6 | 2×4=8 | 2×5=10\n2×6=12 | 2×7=14 | 2×8=16 | 2×9=18 | 2×10=20',
        visual: 'Los números pares: 2, 4, 6, 8, 10...',
      },
    ],
    tips: [
      'La tabla del 1 siempre da el mismo número',
      'La tabla del 2 son los números pares',
      'La tabla del 5 siempre termina en 0 o 5',
    ],
    generateExercises: (count = 5) => {
      return Array.from({ length: count }, (_, i) => {
        const a = Math.floor(Math.random() * 5) + 1
        const b = Math.floor(Math.random() * 10) + 1
        const ans = a * b
        const type = i % 2 === 0 ? 'multiple-choice' : 'write-answer'
        return {
          id: `mult15-${i}-${Date.now()}`,
          type,
          question: `¿Cuánto es ${a} × ${b}?`,
          visualHint: `${a} grupos de ${b}: ${Array.from({ length: a }, () => '⭐'.repeat(b)).join(' | ')}`,
          answer: ans,
          options: type === 'multiple-choice' ? nearOpts(ans, 1, 50) : null,
          hint: `${a} × ${b} = ${Array.from({ length: a }, () => b).join(' + ')} = ${ans}`,
          explanation: `${a} × ${b} significa ${a} grupos de ${b}.\n${Array.from({ length: a }, () => b).join(' + ')} = ${ans}`,
          difficulty: 2,
          xpReward: 20,
        }
      })
    },
  },

  {
    id: 'multiplication-6-10',
    title: 'Tablas del 6 al 10',
    description: 'Aprende las tablas de multiplicar del 6 al 10',
    gradeLevel: 3,
    icon: '✖️🔟',
    orderIndex: 13,
    type: 'multiplication',
    lessonSlides: [
      {
        title: 'Tablas del 6 al 10',
        content: 'Las tablas del 6 al 10 usan los mismos trucos.\n6×7=42 | 7×8=56 | 9×9=81',
        visual: '6×6=36 | 7×7=49 | 8×8=64 | 9×9=81 | 10×10=100',
      },
      {
        title: 'Truco del 9',
        content: 'Para la tabla del 9, los dígitos siempre suman 9.\n9×2=18 (1+8=9) | 9×3=27 (2+7=9)',
        visual: '9×1=09 | 9×2=18 | 9×3=27 | 9×4=36 | 9×5=45',
      },
    ],
    tips: [
      'Tabla del 10: agrega un cero al número',
      'En la tabla del 9, los dígitos suman 9',
      'Practica las más difíciles: 7×8, 6×7, 8×9',
    ],
    generateExercises: (count = 5) => {
      return Array.from({ length: count }, (_, i) => {
        const a = Math.floor(Math.random() * 5) + 6
        const b = Math.floor(Math.random() * 10) + 1
        const ans = a * b
        const type = i % 2 === 0 ? 'multiple-choice' : 'write-answer'
        return {
          id: `mult610-${i}-${Date.now()}`,
          type,
          question: `¿Cuánto es ${a} × ${b}?`,
          answer: ans,
          options: type === 'multiple-choice' ? nearOpts(ans, 6, 100) : null,
          hint: `${a} × ${b}: intenta ${a} × ${b - 1} = ${a * (b - 1)}, más ${a} = ${ans}`,
          explanation: `${a} × ${b} = ${ans}\nPuedes calcular: ${a} × ${b - 1} + ${a} = ${a * (b - 1)} + ${a} = ${ans}`,
          difficulty: 3,
          xpReward: 25,
        }
      })
    },
  },

  {
    id: 'division-basic',
    title: 'División exacta básica',
    description: 'Aprende a dividir en partes iguales',
    gradeLevel: 3,
    icon: '➗',
    orderIndex: 14,
    type: 'division',
    lessonSlides: [
      {
        title: '¿Qué es dividir?',
        content: 'Dividir es repartir en partes iguales.\n12 ÷ 3 = 4 (12 galletas entre 3 amigos = 4 cada uno)',
        visual: '🍪🍪🍪🍪 | 🍪🍪🍪🍪 | 🍪🍪🍪🍪 → 4 cada uno',
      },
      {
        title: 'División y multiplicación',
        content: 'La división es lo contrario de multiplicar.\nSi 3 × 4 = 12, entonces 12 ÷ 3 = 4',
        visual: '12 ÷ 3 = 4 ↔ 3 × 4 = 12',
      },
    ],
    tips: [
      'Usa la tabla de multiplicar al revés',
      '¿Qué número × divisor = dividendo?',
      'Comprueba: cociente × divisor = dividendo',
    ],
    generateExercises: (count = 5) => {
      return Array.from({ length: count }, (_, i) => {
        const b = Math.floor(Math.random() * 9) + 2
        const q = Math.floor(Math.random() * 10) + 1
        const a = b * q
        const type = i % 2 === 0 ? 'multiple-choice' : 'write-answer'
        return {
          id: `div-${i}-${Date.now()}`,
          type,
          question: `¿Cuánto es ${a} ÷ ${b}?`,
          visualHint: `${a} objetos repartidos entre ${b} grupos`,
          answer: q,
          options: type === 'multiple-choice' ? nearOpts(q, 1, 20) : null,
          hint: `¿Qué número × ${b} = ${a}?`,
          explanation: `${a} ÷ ${b} = ${q}\nComprobación: ${b} × ${q} = ${a} ✓`,
          difficulty: 2,
          xpReward: 20,
        }
      })
    },
  },

  // ── GRADE 4 ──────────────────────────────────
  {
    id: 'numbers-10000',
    title: 'Números hasta 10.000',
    description: 'Trabaja con números de cuatro cifras',
    gradeLevel: 4,
    icon: '🔟💯',
    orderIndex: 15,
    type: 'numbers',
    lessonSlides: [
      {
        title: 'Miles',
        content: '1.000, 2.000, 3.000... son miles.\n1 mil = 10 centenas = 100 decenas = 1.000 unidades',
        visual: '1000 2000 3000 4000 5000 6000 7000 8000 9000 10000',
      },
      {
        title: 'Valor posicional',
        content: '4.537 = 4 miles + 5 centenas + 3 decenas + 7 unidades\n= 4000 + 500 + 30 + 7',
        visual: 'M:4 C:5 D:3 U:7',
      },
    ],
    tips: [
      'Los miles tienen 4 cifras',
      'Descompón: 3.256 = 3000 + 200 + 50 + 6',
      'El mayor número de 4 cifras es 9.999',
    ],
    generateExercises: (count = 5) => {
      return Array.from({ length: count }, (_, i) => {
        const m = Math.floor(Math.random() * 9) + 1
        const c = Math.floor(Math.random() * 10)
        const d = Math.floor(Math.random() * 10)
        const u = Math.floor(Math.random() * 10)
        const n = m * 1000 + c * 100 + d * 10 + u
        const type = i % 2 === 0 ? 'write-answer' : 'multiple-choice'
        const isDecomp = i % 2 === 0
        return {
          id: `num10k-${i}-${Date.now()}`,
          type,
          question: isDecomp
            ? `¿Cuánto es ${m} miles + ${c} centenas + ${d} decenas + ${u} unidades?`
            : `¿Cuántos miles tiene ${n.toLocaleString('es-CL')}?`,
          answer: isDecomp ? n : m,
          options: !isDecomp ? nearOpts(m, 1, 9) : null,
          hint: isDecomp ? `${m}×1000 + ${c}×100 + ${d}×10 + ${u}` : `${n} = ${m}.000 + ...`,
          explanation: `${n.toLocaleString('es-CL')} = ${m}×1000 + ${c}×100 + ${d}×10 + ${u}\n= ${m * 1000} + ${c * 100} + ${d * 10} + ${u}`,
          difficulty: 3,
          xpReward: 20,
        }
      })
    },
  },

  {
    id: 'multiplication-2digit',
    title: 'Multiplicación de 2 dígitos',
    description: 'Multiplica números de dos cifras',
    gradeLevel: 4,
    icon: '✖️✖️',
    orderIndex: 16,
    type: 'multiplication',
    lessonSlides: [
      {
        title: 'Multiplicar por decenas',
        content: 'Para 23 × 4:\n3×4=12 (unidades) → escribe 2, lleva 1\n2×4=8, más 1 = 9 (decenas)\nResultado: 92',
        visual: '  23\n×   4\n────\n  92',
      },
    ],
    tips: [
      'Multiplica primero las unidades',
      'No olvides la llevada',
      'Comprueba con una suma aproximada',
    ],
    generateExercises: (count = 5) => {
      return Array.from({ length: count }, (_, i) => {
        const a = Math.floor(Math.random() * 50) + 10
        const b = Math.floor(Math.random() * 9) + 2
        const ans = a * b
        const type = i % 2 === 0 ? 'write-answer' : 'multiple-choice'
        return {
          id: `mult2d-${i}-${Date.now()}`,
          type,
          question: `¿Cuánto es ${a} × ${b}?`,
          answer: ans,
          options: type === 'multiple-choice' ? nearOpts(ans, 10, 500) : null,
          hint: `${a} × ${b}: unidades ${a % 10}×${b}=${(a % 10) * b}, decenas ${Math.floor(a / 10)}×${b}=${Math.floor(a / 10) * b}`,
          explanation: `${a} × ${b}:\nUnidades: ${a % 10} × ${b} = ${(a % 10) * b}\nDecenas: ${Math.floor(a / 10)} × ${b} = ${Math.floor(a / 10) * b * 10}\nSuma: ${(a % 10) * b} + ${Math.floor(a / 10) * b * 10} = ${ans}`,
          difficulty: 3,
          xpReward: 25,
        }
      })
    },
  },

  {
    id: 'division-remainder',
    title: 'División con resto',
    description: 'Aprende cuando la división no es exacta',
    gradeLevel: 4,
    icon: '➗🔢',
    orderIndex: 17,
    type: 'division',
    lessonSlides: [
      {
        title: '¿Qué es el resto?',
        content: '13 ÷ 4 = 3 con resto 1\n3×4=12, sobra 1.\nLlamamos a ese "1" el resto.',
        visual: '13 ÷ 4 = 3 (resto 1)',
      },
      {
        title: 'Comprobación',
        content: 'Siempre podemos comprobar:\ncuociente × divisor + resto = dividendo\n3 × 4 + 1 = 13 ✓',
        visual: 'Q×D+R=N',
      },
    ],
    tips: [
      'El resto siempre es menor que el divisor',
      'Si el resto es 0, la división es exacta',
      'Comprueba: cociente×divisor+resto=dividendo',
    ],
    generateExercises: (count = 5) => {
      return Array.from({ length: count }, (_, i) => {
        const div = Math.floor(Math.random() * 8) + 2
        const q = Math.floor(Math.random() * 10) + 1
        const r = Math.floor(Math.random() * (div - 1))
        const n = div * q + r
        const askResto = i % 2 === 0
        const type = i % 3 === 0 ? 'write-answer' : 'multiple-choice'
        return {
          id: `divrem-${i}-${Date.now()}`,
          type,
          question: askResto
            ? `${n} ÷ ${div} = ${q} con resto ___`
            : `¿Cuánto es el cociente de ${n} ÷ ${div}?`,
          answer: askResto ? r : q,
          options: type === 'multiple-choice' ? nearOpts(askResto ? r : q, 0, 15) : null,
          hint: `${div} × ${q} = ${div * q}. Entonces ${n} - ${div * q} = ${r}`,
          explanation: `${n} ÷ ${div}:\n${div} × ${q} = ${div * q}\n${n} - ${div * q} = ${r} (resto)\nRespuesta: cociente = ${q}, resto = ${r}`,
          difficulty: 3,
          xpReward: 25,
        }
      })
    },
  },

  // ── GRADE 5 ──────────────────────────────────
  {
    id: 'fractions-basic',
    title: 'Fracciones básicas',
    description: 'Entiende qué son las fracciones',
    gradeLevel: 5,
    icon: '½',
    orderIndex: 18,
    type: 'fractions',
    lessonSlides: [
      {
        title: '¿Qué es una fracción?',
        content: 'Una fracción representa una parte de algo.\n1/4 es una parte de 4 iguales.\nNumerador/Denominador',
        visual: '🍕 ÷ 4 = 1/4 por persona',
      },
      {
        title: 'Numerador y denominador',
        content: 'Numerador (arriba): cuántas partes tenemos\nDenominador (abajo): en cuántas partes está dividido el todo',
        visual: '3/5 → 3 partes de 5 totales',
      },
    ],
    tips: [
      'El denominador dice en cuántas partes está dividido',
      'El numerador dice cuántas partes tomamos',
      '2/2 = 1 (el entero completo)',
    ],
    generateExercises: (count = 5) => {
      return Array.from({ length: count }, (_, i) => {
        const den = [2, 3, 4, 5, 6, 8, 10][Math.floor(Math.random() * 7)]
        const num = Math.floor(Math.random() * den) + 1
        const types = ['multiple-choice', 'write-answer', 'true-false']
        const type = types[i % 3]
        if (type === 'true-false') {
          const isTrue = Math.random() > 0.5
          const wrongNum = isTrue ? num : (num === 1 ? 2 : num - 1)
          return {
            id: `frac-${i}-${Date.now()}`,
            type: 'true-false',
            question: `¿La fracción ${wrongNum}/${den} tiene ${wrongNum} partes de ${den} iguales?`,
            answer: 'verdadero',
            hint: 'El numerador dice las partes que tomamos',
            explanation: `${wrongNum}/${den}: el numerador es ${wrongNum} (partes tomadas) y el denominador es ${den} (partes totales).`,
            difficulty: 2,
            xpReward: 20,
          }
        }
        return {
          id: `frac-${i}-${Date.now()}`,
          type,
          question: `¿Qué fracción representa ${num} partes de ${den}?`,
          answer: `${num}/${den}`,
          options: type === 'multiple-choice'
            ? shuffle([`${num}/${den}`, `${den}/${num}`, `${num + 1}/${den}`, `${num}/${den + 1}`])
            : null,
          hint: `Numerador (arriba): ${num} | Denominador (abajo): ${den}`,
          explanation: `${num} partes de ${den} → fracción: ${num}/${den}\nNumerador = ${num}, Denominador = ${den}`,
          difficulty: 2,
          xpReward: 20,
        }
      })
    },
  },

  {
    id: 'fractions-equivalent',
    title: 'Fracciones equivalentes',
    description: 'Encuentra fracciones que representan lo mismo',
    gradeLevel: 5,
    icon: '⚖️½',
    orderIndex: 19,
    type: 'fractions',
    lessonSlides: [
      {
        title: '¿Qué son fracciones equivalentes?',
        content: '1/2 = 2/4 = 3/6 = 4/8\n¡Todas representan la mitad!',
        visual: '1/2 = 2/4 = 3/6',
      },
      {
        title: 'Cómo encontrarlas',
        content: 'Multiplica o divide numerador y denominador por el mismo número.\n1/3 × 2/2 = 2/6',
        visual: '1×2 / 3×2 = 2/6',
      },
    ],
    tips: [
      'Multiplica o divide ambos por el mismo número',
      'Para simplificar, divide por el máximo común divisor',
      '1/2 = 2/4 = 3/6 = 4/8...',
    ],
    generateExercises: (count = 5) => {
      return Array.from({ length: count }, (_, i) => {
        const num = Math.floor(Math.random() * 4) + 1
        const den = Math.floor(Math.random() * 4) + 2
        const factor = Math.floor(Math.random() * 4) + 2
        const type = i % 2 === 0 ? 'multiple-choice' : 'write-answer'
        const ansNum = num * factor
        const ansDen = den * factor
        return {
          id: `fracEq-${i}-${Date.now()}`,
          type,
          question: `¿Cuál fracción es equivalente a ${num}/${den}? (multiplica por ${factor})`,
          answer: `${ansNum}/${ansDen}`,
          options: type === 'multiple-choice'
            ? shuffle([`${ansNum}/${ansDen}`, `${num + 1}/${den + 1}`, `${num * factor}/${den * (factor + 1)}`, `${num * (factor - 1)}/${den * factor}`])
            : null,
          hint: `Multiplica numerador y denominador por ${factor}: ${num}×${factor}/${den}×${factor}`,
          explanation: `${num}/${den} × (${factor}/${factor}) = ${num * factor}/${den * factor}\nAmbos se multiplican por ${factor}, así la fracción es equivalente.`,
          difficulty: 3,
          xpReward: 25,
        }
      })
    },
  },

  {
    id: 'decimals-intro',
    title: 'Números decimales',
    description: 'Aprende a leer y escribir decimales',
    gradeLevel: 5,
    icon: '🔢.',
    orderIndex: 20,
    type: 'decimals',
    lessonSlides: [
      {
        title: '¿Qué son los decimales?',
        content: 'Los decimales tienen una coma (en Chile usamos coma).\n3,5 = 3 enteros y 5 décimas\n0,75 = 75 centésimas',
        visual: '3,5 → ● ● ● ½',
      },
      {
        title: 'Valor posicional decimal',
        content: 'Enteros | , | Décimas | Centésimas\n  3     |   |    5    |\n= 3,5',
        visual: '3,50 = 3 + 0,5 + 0,00',
      },
    ],
    tips: [
      'En Chile usamos coma (,) como separador decimal',
      '0,1 = una décima = 1/10',
      '0,01 = una centésima = 1/100',
    ],
    generateExercises: (count = 5) => {
      return Array.from({ length: count }, (_, i) => {
        const whole = Math.floor(Math.random() * 20)
        const dec = Math.floor(Math.random() * 9) + 1
        const n = whole + dec / 10
        const type = i % 2 === 0 ? 'multiple-choice' : 'write-answer'
        const q = i % 3 === 0
          ? `¿Cuántas décimas tiene ${n.toFixed(1).replace('.', ',')}?`
          : `¿Qué número tiene ${whole} enteros y ${dec} décimas?`
        const ans = i % 3 === 0 ? dec : parseFloat(n.toFixed(1))
        return {
          id: `dec-${i}-${Date.now()}`,
          type,
          question: q,
          answer: ans,
          options: type === 'multiple-choice' ? nearOpts(typeof ans === 'number' ? ans : dec, 0, 30) : null,
          hint: i % 3 === 0 ? `${n.toFixed(1).replace('.', ',')} → parte decimal: ,${dec}` : `${whole} + ${dec}/10 = ${n.toFixed(1).replace('.', ',')}`,
          explanation: `${n.toFixed(1).replace('.', ',')} = ${whole} enteros y ${dec} décimas\n${whole} + ${dec}/10 = ${n.toFixed(1).replace('.', ',')}`,
          difficulty: 3,
          xpReward: 25,
        }
      })
    },
  },

  {
    id: 'decimals-operations',
    title: 'Suma y resta de decimales',
    description: 'Opera con números decimales',
    gradeLevel: 5,
    icon: '🔢.➕',
    orderIndex: 21,
    type: 'decimals',
    lessonSlides: [
      {
        title: 'Suma de decimales',
        content: 'Alinea las comas y suma como siempre.\n  3,5\n+ 1,2\n─────\n  4,7',
        visual: '3,5 + 1,2 = 4,7',
      },
      {
        title: 'Resta de decimales',
        content: 'Igual: alinea las comas.\n  5,8\n- 2,3\n─────\n  3,5',
        visual: '5,8 - 2,3 = 3,5',
      },
    ],
    tips: [
      'Alinea siempre las comas',
      'Agrega ceros si faltan decimales: 3 = 3,0',
      'Opera igual que con números enteros',
    ],
    generateExercises: (count = 5) => {
      return Array.from({ length: count }, (_, i) => {
        const a = Math.round((Math.random() * 20 + 1) * 10) / 10
        const b = Math.round((Math.random() * 10 + 0.1) * 10) / 10
        const isAdd = i % 2 === 0
        const ans = isAdd ? Math.round((a + b) * 10) / 10 : Math.round((Math.max(a, b) - Math.min(a, b)) * 10) / 10
        const [x, y] = isAdd ? [a, b] : [Math.max(a, b), Math.min(a, b)]
        const type = i % 3 === 0 ? 'multiple-choice' : 'write-answer'
        return {
          id: `decOp-${i}-${Date.now()}`,
          type,
          question: `¿Cuánto es ${x.toFixed(1).replace('.', ',')} ${isAdd ? '+' : '-'} ${y.toFixed(1).replace('.', ',')}?`,
          answer: ans,
          options: type === 'multiple-choice' ? nearOpts(ans * 10, 1, 300).map(v => (Number(v) / 10).toFixed(1).replace('.', ',')) : null,
          hint: `Alinea las comas y ${isAdd ? 'suma' : 'resta'} normalmente`,
          explanation: `${x.toFixed(1).replace('.', ',')} ${isAdd ? '+' : '-'} ${y.toFixed(1).replace('.', ',')}\nAlinea las comas y opera:\n= ${ans.toFixed(1).replace('.', ',')}`,
          difficulty: 3,
          xpReward: 25,
        }
      })
    },
  },

  // ── GRADE 6 ──────────────────────────────────
  {
    id: 'fracciones-mixtos-1',
    title: 'Fracciones impropias y números mixtos',
    description: 'Convierte entre fracciones impropias y números mixtos',
    gradeLevel: 6,
    icon: '🍕',
    orderIndex: 22,
    type: 'fractions',
    lessonSlides: [
      {
        title: '¿Qué son las fracciones impropias?',
        content: 'Una fracción impropia tiene el numerador mayor o igual al denominador.\nEjemplo: 7/3 es impropia porque 7 > 3.',
        visual: '7/3 → ¡el numerador es mayor!',
      },
      {
        title: 'Convertir fracción impropia a número mixto',
        content: 'Divide el numerador por el denominador.\n7 ÷ 3 = 2 con resto 1\nEl cociente (2) es el entero, el resto (1) es el nuevo numerador.\n7/3 = 2 1/3',
        visual: '7/3 = 2 enteros + 1/3 = 2 1/3',
      },
      {
        title: 'Convertir número mixto a fracción impropia',
        content: 'Multiplica el entero por el denominador, luego suma el numerador.\n2 1/4: (2 × 4) + 1 = 9\nResultado: 9/4',
        visual: '2 1/4 → (2×4)+1 = 9 → 9/4',
      },
    ],
    tips: [
      'Divide el numerador por el denominador',
      'El cociente es el entero, el resto es el nuevo numerador',
      'Para volver: entero × denominador + numerador',
    ],
    generateExercises: (count = 5) => {
      return Array.from({ length: count }, (_, i) => {
        const den = Math.floor(Math.random() * 5) + 2 // 2-6
        const whole = Math.floor(Math.random() * 4) + 1 // 1-4
        const rem = Math.floor(Math.random() * (den - 1)) + 1 // 1 to den-1
        const num = whole * den + rem
        const toMixed = i % 2 === 0
        if (toMixed) {
          return {
            id: `fracmix-${i}-${Date.now()}`,
            type: 'multiple-choice',
            question: `Convierte ${num}/${den} a número mixto`,
            answer: `${whole} ${rem}/${den}`,
            options: [
              `${whole} ${rem}/${den}`,
              `${whole + 1} ${rem}/${den}`,
              `${whole} ${rem + 1}/${den}`,
              `${whole - 1} ${rem}/${den}`,
            ].sort(() => Math.random() - 0.5),
            hint: `Divide ${num} ÷ ${den}: cociente = ${whole}, resto = ${rem}`,
            explanation: `${num} ÷ ${den} = ${whole} con resto ${rem}\nEntonces ${num}/${den} = ${whole} ${rem}/${den}`,
            difficulty: 3,
            xpReward: 25,
          }
        } else {
          return {
            id: `fracmix-${i}-${Date.now()}`,
            type: 'multiple-choice',
            question: `Convierte ${whole} ${rem}/${den} a fracción impropia`,
            answer: `${num}/${den}`,
            options: [
              `${num}/${den}`,
              `${num + 1}/${den}`,
              `${whole * den}/${den}`,
              `${num}/${den + 1}`,
            ].sort(() => Math.random() - 0.5),
            hint: `Multiplica: ${whole} × ${den} = ${whole * den}, luego suma ${rem}: ${whole * den} + ${rem} = ${num}`,
            explanation: `${whole} ${rem}/${den}: (${whole} × ${den}) + ${rem} = ${whole * den + rem}\nResultado: ${num}/${den}`,
            difficulty: 3,
            xpReward: 25,
          }
        }
      })
    },
  },

  {
    id: 'fracciones-recta',
    title: 'Fracciones en la recta numérica',
    description: 'Compara y ordena fracciones en la recta numérica',
    gradeLevel: 6,
    icon: '📏',
    orderIndex: 23,
    type: 'fractions',
    lessonSlides: [
      {
        title: 'Fracciones en la recta',
        content: 'Podemos ubicar fracciones en una recta numérica.\nEntre 0 y 1 hay infinitas fracciones: 1/4, 1/2, 3/4...',
        visual: '0 ──── 1/4 ──── 1/2 ──── 3/4 ──── 1',
      },
      {
        title: 'Comparar fracciones',
        content: 'Para comparar fracciones con igual denominador: compara los numeradores.\n3/5 > 2/5 porque 3 > 2\nPara diferente denominador: convierte a común denominador.',
        visual: '2/5 < 3/5 | 1/3 < 1/2',
      },
    ],
    tips: [
      'Mismo denominador: compara numeradores',
      'Diferente denominador: busca denominador común',
      'Mayor fracción = más a la derecha en la recta',
    ],
    generateExercises: (count = 5) => {
      return Array.from({ length: count }, (_, i) => {
        const den = [2, 3, 4, 5, 6, 8, 10][Math.floor(Math.random() * 7)]
        const n1 = Math.floor(Math.random() * (den - 1)) + 1
        let n2 = Math.floor(Math.random() * (den - 1)) + 1
        while (n2 === n1) n2 = Math.floor(Math.random() * (den - 1)) + 1
        const symbol = n1 > n2 ? '>' : n1 < n2 ? '<' : '='
        return {
          id: `fracrecta-${i}-${Date.now()}`,
          type: 'multiple-choice',
          question: `¿Qué símbolo va entre ${n1}/${den} ___ ${n2}/${den}?`,
          answer: symbol,
          options: ['>', '<', '='].sort(() => Math.random() - 0.5),
          hint: `Ambas tienen denominador ${den}, compara los numeradores: ${n1} y ${n2}`,
          explanation: `${n1}/${den} ${symbol} ${n2}/${den} porque ${n1} ${symbol} ${n2}`,
          difficulty: 3,
          xpReward: 20,
        }
      })
    },
  },

  {
    id: 'multiplicacion-decimales',
    title: 'Multiplicación de decimales',
    description: 'Multiplica números con coma decimal',
    gradeLevel: 6,
    icon: '✖️',
    orderIndex: 24,
    type: 'decimals',
    lessonSlides: [
      {
        title: 'Multiplicar decimales',
        content: 'Para multiplicar decimales:\n1. Multiplica ignorando la coma\n2. Cuenta los lugares decimales en total\n3. Coloca la coma en el resultado',
        visual: '2,3 × 0,45 → 23 × 45 = 1035 → 3 decimales → 1,035',
      },
      {
        title: 'Ejemplo paso a paso',
        content: '2,3 × 0,45:\n- 2,3 tiene 1 decimal\n- 0,45 tiene 2 decimales\n- Total: 3 decimales\n- 23 × 45 = 1035\n- Resultado: 1,035',
        visual: '2,3 × 0,45 = 1,035',
      },
    ],
    tips: [
      'Cuenta los decimales de ambos factores',
      'Multiplica como si fueran enteros',
      'Luego coloca la coma sumando los decimales',
    ],
    generateExercises: (count = 5) => {
      return Array.from({ length: count }, (_, i) => {
        const a = Math.round((Math.random() * 9 + 1) * 10) / 10  // 1 decimal 1.0-9.9
        const b = Math.round((Math.random() * 4 + 0.1) * 10) / 10  // 1 decimal 0.1-4.9
        const ans = Math.round(a * b * 100) / 100
        const type = i % 2 === 0 ? 'multiple-choice' : 'write-answer'
        const aStr = a.toFixed(1).replace('.', ',')
        const bStr = b.toFixed(1).replace('.', ',')
        const ansStr = ans.toString().replace('.', ',')
        const wrong1 = (Math.round((a * b * 10)) / 10).toString().replace('.', ',')
        const wrong2 = (Math.round((a * b * 1000)) / 1000).toString().replace('.', ',')
        const wrong3 = (Math.round((a + b) * 100) / 100).toString().replace('.', ',')
        return {
          id: `multdec-${i}-${Date.now()}`,
          type,
          question: `¿Cuánto es ${aStr} × ${bStr}?`,
          answer: ansStr,
          options: type === 'multiple-choice'
            ? [ansStr, wrong1, wrong2, wrong3].filter((v, idx, arr) => arr.indexOf(v) === idx).slice(0, 4).sort(() => Math.random() - 0.5)
            : null,
          hint: `${aStr} tiene 1 decimal, ${bStr} tiene 1 decimal → 2 decimales en total`,
          explanation: `${aStr} × ${bStr}:\n1. Ignora la coma: ${Math.round(a * 10)} × ${Math.round(b * 10)} = ${Math.round(a * 10) * Math.round(b * 10)}\n2. 1+1=2 lugares decimales\n3. Resultado: ${ansStr}`,
          difficulty: 4,
          xpReward: 30,
        }
      })
    },
  },

  {
    id: 'division-decimales',
    title: 'División de decimales',
    description: 'Divide números con coma decimal',
    gradeLevel: 6,
    icon: '➗',
    orderIndex: 25,
    type: 'decimals',
    lessonSlides: [
      {
        title: 'Dividir decimales',
        content: 'Para dividir decimales, amplifica ambos números para eliminar la coma.\n3,6 ÷ 1,2 → multiplica por 10 → 36 ÷ 12 = 3',
        visual: '3,6 ÷ 1,2 = 36 ÷ 12 = 3',
      },
      {
        title: 'División con decimal solo en dividendo',
        content: 'Si solo el dividendo tiene decimal:\n4,8 ÷ 4 = ?\nPiensa: 4,8 = 48 décimas\n48 ÷ 4 = 12 décimas = 1,2',
        visual: '4,8 ÷ 4 = 1,2',
      },
    ],
    tips: [
      'Amplifica multiplicando por 10, 100, etc. para eliminar comas',
      'Divide normalmente una vez que no hay decimales',
      'Comprueba multiplicando: resultado × divisor = dividendo',
    ],
    generateExercises: (count = 5) => {
      return Array.from({ length: count }, (_, i) => {
        const q = Math.floor(Math.random() * 9) + 1
        const b = Math.floor(Math.random() * 5) + 2
        const a = q * b
        // Create decimal version: a/10 ÷ b = q/10
        const aDec = (a / 10).toFixed(1).replace('.', ',')
        const ansDec = (q / 10).toFixed(1).replace('.', ',')
        const type = i % 2 === 0 ? 'multiple-choice' : 'write-answer'
        const wrong1 = ((q + 1) / 10).toFixed(1).replace('.', ',')
        const wrong2 = ((q * 2) / 10).toFixed(1).replace('.', ',')
        const wrong3 = (q).toString()
        return {
          id: `divdec-${i}-${Date.now()}`,
          type,
          question: `¿Cuánto es ${aDec} ÷ ${b}?`,
          answer: ansDec,
          options: type === 'multiple-choice'
            ? [ansDec, wrong1, wrong2, wrong3].filter((v, idx, arr) => arr.indexOf(v) === idx).slice(0, 4).sort(() => Math.random() - 0.5)
            : null,
          hint: `${aDec} × 10 = ${a}. Entonces ${a} ÷ ${b} = ${q}, luego divide por 10`,
          explanation: `${aDec} ÷ ${b}:\nAmplifica: ${aDec} × 10 = ${a}\n${a} ÷ ${b} = ${q}\nDivide por 10: ${q} ÷ 10 = ${ansDec}`,
          difficulty: 4,
          xpReward: 30,
        }
      })
    },
  },

  {
    id: 'ecuaciones-basicas',
    title: 'Ecuaciones - Introducción',
    description: 'Aprende qué es una ecuación y encuentra el valor desconocido',
    gradeLevel: 6,
    icon: '⚖️',
    orderIndex: 26,
    type: 'algebra',
    lessonSlides: [
      {
        title: '¿Qué es una ecuación?',
        content: 'Una ecuación es como una balanza en equilibrio.\nAmbos lados deben ser iguales.\nx + 3 = 7 → ¿qué valor tiene x?',
        visual: '⚖️ x + 3 = 7 → x = 4',
      },
      {
        title: 'Encontrar el valor de x',
        content: 'Para encontrar x, haz la operación contraria.\nx + 3 = 7 → x = 7 - 3 = 4\nComprueba: 4 + 3 = 7 ✓',
        visual: 'x + 3 = 7\nx = 7 - 3\nx = 4',
      },
      {
        title: 'Más ejemplos',
        content: 'x - 5 = 8 → x = 8 + 5 = 13\n3 × x = 12 → x = 12 ÷ 3 = 4',
        visual: '⚖️ siempre en equilibrio',
      },
    ],
    tips: [
      'La balanza debe estar siempre equilibrada',
      'Haz la operación contraria para despejar x',
      'Suma ↔ Resta | Multiplicación ↔ División',
      'Comprueba sustituyendo x en la ecuación',
    ],
    generateExercises: (count = 5) => {
      return Array.from({ length: count }, (_, i) => {
        const x = Math.floor(Math.random() * 15) + 1
        const ops = ['add', 'sub', 'mul']
        const op = ops[i % 3]
        let question, answer, hint, explanation
        if (op === 'add') {
          const a = Math.floor(Math.random() * 15) + 1
          question = `x + ${a} = ${x + a}`
          answer = x
          hint = `Resta ${a} de ambos lados: x = ${x + a} - ${a}`
          explanation = `x + ${a} = ${x + a}\nx = ${x + a} - ${a} = ${x}`
        } else if (op === 'sub') {
          const a = Math.floor(Math.random() * 10) + 1
          question = `x - ${a} = ${x}`
          answer = x + a
          hint = `Suma ${a} a ambos lados: x = ${x} + ${a}`
          explanation = `x - ${a} = ${x}\nx = ${x} + ${a} = ${x + a}`
        } else {
          const a = Math.floor(Math.random() * 8) + 2
          question = `${a} × x = ${a * x}`
          answer = x
          hint = `Divide ambos lados por ${a}: x = ${a * x} ÷ ${a}`
          explanation = `${a} × x = ${a * x}\nx = ${a * x} ÷ ${a} = ${x}`
        }
        const type = i % 2 === 0 ? 'multiple-choice' : 'write-answer'
        return {
          id: `ecb-${i}-${Date.now()}`,
          type,
          question: `⚖️ Resuelve: ${question}`,
          answer,
          options: type === 'multiple-choice'
            ? [answer, answer + 1, answer - 1, answer + 2].filter(v => v > 0).slice(0, 4).sort(() => Math.random() - 0.5)
            : null,
          hint,
          explanation: `${explanation}\nComprobación: ${question.replace('x', answer)} ✓`,
          difficulty: 4,
          xpReward: 30,
        }
      })
    },
  },

  {
    id: 'ecuaciones-suma-mult',
    title: 'Ecuaciones con operaciones',
    description: 'Resuelve ecuaciones con suma y multiplicación combinadas',
    gradeLevel: 6,
    icon: '🔢',
    orderIndex: 27,
    type: 'algebra',
    lessonSlides: [
      {
        title: 'Ecuaciones de dos pasos',
        content: 'Algunas ecuaciones necesitan dos operaciones para resolverse.\n2x + 3 = 11\nPaso 1: Resta 3 → 2x = 8\nPaso 2: Divide por 2 → x = 4',
        visual: '2x + 3 = 11 → 2x = 8 → x = 4',
      },
      {
        title: 'El orden importa',
        content: 'Para despejar x:\n1. Primero mueve los números (suma/resta)\n2. Luego mueve el coeficiente (divide/multiplica)',
        visual: '3x - 2 = 7 → 3x = 9 → x = 3',
      },
    ],
    tips: [
      'Primero despeja los términos sin x',
      'Luego divide por el coeficiente de x',
      'Comprueba siempre el resultado',
    ],
    generateExercises: (count = 5) => {
      return Array.from({ length: count }, (_, i) => {
        const x = Math.floor(Math.random() * 8) + 1
        const coef = Math.floor(Math.random() * 4) + 2
        const add = Math.floor(Math.random() * 10) + 1
        const result = coef * x + add
        const type = i % 2 === 0 ? 'multiple-choice' : 'write-answer'
        return {
          id: `ecsm-${i}-${Date.now()}`,
          type,
          question: `⚖️ Resuelve: ${coef}x + ${add} = ${result}`,
          answer: x,
          options: type === 'multiple-choice'
            ? [x, x + 1, x - 1, x + 2].filter(v => v > 0).slice(0, 4).sort(() => Math.random() - 0.5)
            : null,
          hint: `Paso 1: ${coef}x = ${result} - ${add} = ${result - add}\nPaso 2: x = ${result - add} ÷ ${coef} = ${x}`,
          explanation: `${coef}x + ${add} = ${result}\nPaso 1: ${coef}x = ${result} - ${add} = ${result - add}\nPaso 2: x = ${result - add} ÷ ${coef} = ${x}\nComprobación: ${coef} × ${x} + ${add} = ${result} ✓`,
          difficulty: 5,
          xpReward: 35,
        }
      })
    },
  },

  {
    id: 'percentages',
    title: 'Porcentajes',
    description: 'Entiende y calcula porcentajes',
    gradeLevel: 6,
    icon: '%',
    orderIndex: 28,
    type: 'percentages',
    lessonSlides: [
      {
        title: '¿Qué es un porcentaje?',
        content: 'Un porcentaje es una fracción de 100.\n50% = 50/100 = la mitad\n25% = 25/100 = un cuarto',
        visual: '100% = todo | 50% = mitad | 25% = un cuarto',
      },
      {
        title: 'Calcular porcentaje',
        content: 'Para calcular el 20% de 80:\n80 × 20/100 = 80 × 0,20 = 16',
        visual: '20% de 80 = 16',
      },
    ],
    tips: [
      '50% = mitad, divide entre 2',
      '25% = un cuarto, divide entre 4',
      '10% = divide entre 10',
      'Para cualquier %: número × porcentaje/100',
    ],
    generateExercises: (count = 5) => {
      const percents = [10, 20, 25, 50, 75]
      return Array.from({ length: count }, (_, i) => {
        const pct = percents[i % percents.length]
        const base = [20, 40, 80, 100, 200, 60][Math.floor(Math.random() * 6)]
        const ans = base * pct / 100
        const type = i % 2 === 0 ? 'write-answer' : 'multiple-choice'
        return {
          id: `pct-${i}-${Date.now()}`,
          type,
          question: `¿Cuánto es el ${pct}% de ${base}?`,
          answer: ans,
          options: type === 'multiple-choice' ? nearOpts(ans, 1, base) : null,
          hint: `${pct}% = ${pct}/100. Entonces: ${base} × ${pct}/100`,
          explanation: `${pct}% de ${base}:\n= ${base} × ${pct}/100\n= ${base} × ${(pct / 100).toFixed(2)}\n= ${ans}`,
          difficulty: 3,
          xpReward: 30,
        }
      })
    },
  },

  {
    id: 'problem-solving',
    title: 'Resolución de problemas',
    description: 'Aplica las matemáticas a situaciones de la vida real',
    gradeLevel: 6,
    icon: '🧩',
    orderIndex: 29,
    type: 'numbers',
    lessonSlides: [
      {
        title: 'Pasos para resolver problemas',
        content: '1. Lee el problema con atención\n2. Identifica los datos\n3. Decide la operación\n4. Calcula\n5. Verifica',
        visual: '📖 → 🔍 → ➕➖✖️➗ → 🖊️ → ✅',
      },
      {
        title: 'Palabras clave',
        content: 'SUMA: en total, juntos, cuánto hay\nRESTEA: quedan, sobra, diferencia\nMULTIPLICA: veces, grupos de\nDIVIDE: reparte, partes iguales',
        visual: '¡Lee las palabras clave! 🔑',
      },
    ],
    tips: [
      'Subraya los datos importantes',
      'Dibuja un esquema si puedes',
      'Verifica que la respuesta tenga sentido',
      'Revisa las unidades (metros, kilos, pesos...)',
    ],
    generateExercises: (count = 5) => {
      const problems = [
        () => {
          const a = Math.floor(Math.random() * 20) + 5
          const b = Math.floor(Math.random() * 20) + 5
          return {
            question: `María tiene ${a} lápices. Juan le da ${b} más. ¿Cuántos lápices tiene María en total?`,
            answer: a + b,
            hint: '"en total" → suma',
            explanation: `Datos: María tiene ${a}, le dan ${b}.\nOperación: suma → ${a} + ${b} = ${a + b}`,
          }
        },
        () => {
          const total = Math.floor(Math.random() * 40) + 20
          const usado = Math.floor(Math.random() * total)
          return {
            question: `Pedro tiene $${total}.000. Gasta $${usado}.000 en útiles. ¿Cuánto dinero le queda?`,
            answer: total - usado,
            hint: '"le queda" → resta',
            explanation: `Datos: tenía $${total}.000, gastó $${usado}.000.\nOperación: resta → ${total} - ${usado} = ${total - usado}`,
          }
        },
        () => {
          const cajas = Math.floor(Math.random() * 8) + 2
          const porCaja = Math.floor(Math.random() * 12) + 3
          return {
            question: `Hay ${cajas} cajas con ${porCaja} manzanas cada una. ¿Cuántas manzanas hay en total?`,
            answer: cajas * porCaja,
            hint: '"cada una" y "en total" → multiplicación',
            explanation: `Datos: ${cajas} cajas × ${porCaja} manzanas por caja.\nOperación: multiplicación → ${cajas} × ${porCaja} = ${cajas * porCaja}`,
          }
        },
        () => {
          const total = Math.floor(Math.random() * 30) + 12
          const grupos = Math.floor(Math.random() * 5) + 2
          const resto = total % grupos
          const q = Math.floor(total / grupos)
          return {
            question: `Se reparten ${total} caramelos entre ${grupos} niños en partes iguales. ¿Cuántos caramelos recibe cada niño?`,
            answer: q,
            hint: '"reparten" y "partes iguales" → división',
            explanation: `Datos: ${total} caramelos ÷ ${grupos} niños.\n${total} ÷ ${grupos} = ${q}${resto > 0 ? ` (sobran ${resto})` : ''}`,
          }
        },
        () => {
          const precio = Math.floor(Math.random() * 500) + 100
          const pct = [10, 20, 50][Math.floor(Math.random() * 3)]
          const desc = precio * pct / 100
          return {
            question: `Un libro cuesta $${precio}. Tiene un ${pct}% de descuento. ¿Cuánto dinero se ahorra?`,
            answer: desc,
            hint: `${pct}% de ${precio} = ${precio} × ${pct}/100`,
            explanation: `Descuento = ${pct}% de $${precio}\n= ${precio} × ${pct}/100 = $${desc}`,
          }
        },
      ]
      return Array.from({ length: count }, (_, i) => {
        const p = problems[i % problems.length]()
        const type = i % 2 === 0 ? 'write-answer' : 'multiple-choice'
        return {
          id: `prob-${i}-${Date.now()}`,
          type,
          question: p.question,
          answer: p.answer,
          options: type === 'multiple-choice' ? nearOpts(p.answer, 0, p.answer * 2 + 10) : null,
          hint: p.hint,
          explanation: `${p.explanation}\nRespuesta: ${p.answer}`,
          difficulty: 3,
          xpReward: 30,
        }
      })
    },
  },
]

// ─────────────────────────────────────────────
// Helper exports
// ─────────────────────────────────────────────

export function getTopicById(id) {
  return CURRICULUM.find(t => t.id === id)
}

export function getTopicsByGrade(grade) {
  return CURRICULUM.filter(t => t.gradeLevel === grade).sort((a, b) => a.orderIndex - b.orderIndex)
}

export function getTopicsUpToGrade(grade) {
  return CURRICULUM.filter(t => t.gradeLevel <= grade).sort((a, b) => a.orderIndex - b.orderIndex)
}

export const GRADE_LABELS = {
  1: '1ro Básico',
  2: '2do Básico',
  3: '3ro Básico',
  4: '4to Básico',
  5: '5to Básico',
  6: '6to Básico',
}

export const LEVEL_TITLES = [
  { minXP: 0, title: 'Aprendiz', icon: '🌱' },
  { minXP: 100, title: 'Explorador', icon: '🔍' },
  { minXP: 300, title: 'Calculista', icon: '🧮' },
  { minXP: 600, title: 'Matemático', icon: '📐' },
  { minXP: 1000, title: 'Genio', icon: '🧠' },
  { minXP: 2000, title: 'Mago de los Números', icon: '🪄' },
]

export function getLevelInfo(xp) {
  let current = LEVEL_TITLES[0]
  let next = LEVEL_TITLES[1]
  for (let i = LEVEL_TITLES.length - 1; i >= 0; i--) {
    if (xp >= LEVEL_TITLES[i].minXP) {
      current = LEVEL_TITLES[i]
      next = LEVEL_TITLES[i + 1] || null
      break
    }
  }
  const progress = next
    ? ((xp - current.minXP) / (next.minXP - current.minXP)) * 100
    : 100
  return { current, next, progress: Math.min(100, Math.round(progress)) }
}

export const ACHIEVEMENTS = [
  { id: 'first-sum', title: 'Primera suma', description: 'Completaste tu primera suma', icon: '🌟', condition: 'complete_topic:addition-simple' },
  { id: 'first-lesson', title: 'Primer paso', description: 'Completaste tu primera lección', icon: '👣', condition: 'complete_any_topic' },
  { id: 'streak-3', title: 'Racha de fuego', description: '3 días seguidos estudiando', icon: '🔥', condition: 'streak:3' },
  { id: 'streak-7', title: 'Semana de oro', description: '7 días seguidos estudiando', icon: '🏅', condition: 'streak:7' },
  { id: 'perfect-score', title: 'Perfección', description: '100% en un tema sin errores', icon: '💯', condition: 'perfect_topic' },
  { id: 'grade1-complete', title: '1ro Básico ⭐', description: 'Completaste todo 1ro básico', icon: '🚀', condition: 'complete_grade:1' },
  { id: 'grade2-complete', title: '2do Básico ⭐⭐', description: 'Completaste todo 2do básico', icon: '🌈', condition: 'complete_grade:2' },
  { id: 'grade3-complete', title: '3ro Básico ⭐⭐⭐', description: 'Completaste todo 3ro básico', icon: '🏆', condition: 'complete_grade:3' },
  { id: 'grade4-complete', title: '4to Básico ⭐⭐⭐⭐', description: 'Completaste todo 4to básico', icon: '🎓', condition: 'complete_grade:4' },
  { id: 'grade5-complete', title: '5to Básico ⭐⭐⭐⭐⭐', description: 'Completaste todo 5to básico', icon: '🦋', condition: 'complete_grade:5' },
  { id: 'grade6-complete', title: '6to Básico ✨', description: 'Completaste todo 6to básico', icon: '🌟', condition: 'complete_grade:6' },
  { id: 'xp-100', title: 'Acumulador', description: 'Ganaste 100 puntos de XP', icon: '💰', condition: 'xp:100' },
  { id: 'xp-500', title: 'Millonario de XP', description: 'Ganaste 500 puntos de XP', icon: '💎', condition: 'xp:500' },
  { id: 'exercises-10', title: 'Practicador', description: 'Resolviste 10 ejercicios', icon: '✏️', condition: 'exercises:10' },
  { id: 'exercises-50', title: 'Campeón', description: 'Resolviste 50 ejercicios', icon: '🏆', condition: 'exercises:50' },
  { id: 'exercises-100', title: 'Leyenda', description: 'Resolviste 100 ejercicios', icon: '👑', condition: 'exercises:100' },
  { id: 'hint-free', title: 'Sin pistas', description: 'Completaste un tema sin usar pistas', icon: '🦅', condition: 'no_hints_topic' },
  { id: 'speed-demon', title: 'Velocista', description: 'Respondiste 5 seguidas en menos de 10s cada una', icon: '⚡', condition: 'speed_5' },
  { id: 'multiplication-master', title: 'Maestro multiplicador', description: 'Completaste las 2 tablas de multiplicar', icon: '✖️', condition: 'complete_topic:multiplication-6-10' },
  { id: 'all-complete', title: 'MateMago', description: '¡Completaste todo el programa!', icon: '🪄', condition: 'complete_all' },
]
