export default function LessonSlide({ slide, onNext, isLast }) {
  return (
    <div className="animate-slide-up flex flex-col gap-4">
      <div className="card bg-gradient-to-br from-purple-50 to-yellow-50 border-magic-200">
        <h2 className="text-xl font-black text-magic-700 mb-3">{slide.title}</h2>
        <p className="text-gray-700 font-semibold whitespace-pre-line leading-relaxed">
          {slide.content}
        </p>
        {slide.visual && (
          <div className="mt-4 bg-white rounded-2xl p-4 text-center font-mono text-lg border border-magic-100 whitespace-pre-line text-gray-800">
            {slide.visual}
          </div>
        )}
      </div>

      <button onClick={onNext} className="btn-primary w-full text-lg">
        {isLast ? 'Empezar práctica 🚀' : 'Siguiente →'}
      </button>
    </div>
  )
}
