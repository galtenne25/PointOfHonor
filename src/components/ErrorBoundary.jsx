import { Component } from 'react'
import { AlertTriangle } from 'lucide-react'

/**
 * Top-level error boundary. Catches any render/runtime error thrown inside the
 * React tree and renders a calm RTL fallback instead of a blank white screen —
 * so a single failing component can never take the whole app down.
 *
 * React only lets class components act as error boundaries, hence the class.
 */
export default class ErrorBoundary extends Component {
  state = { hasError: false }

  static getDerivedStateFromError() {
    return { hasError: true }
  }

  componentDidCatch(error, info) {
    // Logged only when a real crash occurs (not normal operation). This is the
    // hook where you'd forward to an error-reporting service (e.g. Sentry).
    console.error('[ErrorBoundary]', error, info)
  }

  handleReset = () => {
    this.setState({ hasError: false })
    window.location.assign('/')
  }

  render() {
    if (!this.state.hasError) return this.props.children

    return (
      <div
        dir="rtl"
        className="min-h-screen flex flex-col items-center justify-center gap-4 px-6 text-center bg-slate-50"
      >
        <div className="w-16 h-16 rounded-full bg-red-50 flex items-center justify-center">
          <AlertTriangle size={30} strokeWidth={1.6} className="text-red-400" />
        </div>
        <h1 className="text-xl font-bold text-slate-800">משהו השתבש</h1>
        <p className="text-sm text-slate-500 leading-relaxed max-w-xs">
          אירעה שגיאה בלתי צפויה. ניתן לחזור לדף הבית ולנסות שוב.
        </p>
        <button
          onClick={this.handleReset}
          className="mt-1 px-6 py-2.5 bg-olive-700 text-white text-sm font-semibold rounded-xl
                     hover:bg-olive-800 active:scale-95 transition-all duration-150"
        >
          חזרה לדף הבית
        </button>
      </div>
    )
  }
}
