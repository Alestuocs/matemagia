import { Component } from 'react'

// App-level error boundary so a render-time exception doesn't leave the
// kid (or worse, the paying parent) staring at a blank white screen.
// Shows a friendly retry card and keeps the local cache intact.
export default class ErrorBoundary extends Component {
  constructor(props) {
    super(props)
    this.state = { hasError: false, error: null }
  }

  static getDerivedStateFromError(error) {
    return { hasError: true, error }
  }

  componentDidCatch(error, info) {
    console.error('Top-level render error:', error, info)
  }

  reset = () => {
    this.setState({ hasError: false, error: null })
  }

  reload = () => {
    window.location.reload()
  }

  render() {
    if (!this.state.hasError) return this.props.children
    return (
      <div className="min-h-screen flex items-center justify-center p-6 bg-gradient-to-br from-purple-100 to-yellow-50">
        <div className="max-w-sm w-full bg-white rounded-3xl shadow-xl p-6 text-center space-y-4">
          <div className="text-5xl">🧙‍♂️</div>
          <h1 className="font-black text-magic-700 text-xl">Ups, algo salió raro</h1>
          <p className="text-gray-600 text-sm">
            Algo en la app falló. Tu progreso está a salvo en tu cuenta.
            Recarga para intentar de nuevo.
          </p>
          {this.state.error?.message && (
            <details className="text-left text-xs text-gray-400 bg-gray-50 rounded-xl p-2">
              <summary className="cursor-pointer">Detalles técnicos</summary>
              <pre className="whitespace-pre-wrap break-words mt-1">
                {this.state.error.message}
              </pre>
            </details>
          )}
          <div className="flex flex-col gap-2">
            <button
              onClick={this.reload}
              className="w-full bg-magic-500 text-white rounded-2xl py-3 font-black text-base active:scale-95"
            >
              🔄 Recargar la app
            </button>
            <button
              onClick={this.reset}
              className="w-full bg-gray-100 text-gray-700 rounded-2xl py-2 text-sm font-bold"
            >
              Intentar continuar
            </button>
          </div>
        </div>
      </div>
    )
  }
}
