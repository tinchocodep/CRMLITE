import React from 'react';
import { AlertTriangle, RefreshCw } from 'lucide-react';

class ErrorBoundary extends React.Component {
    constructor(props) {
        super(props);
        this.state = { hasError: false, error: null, errorInfo: null };
    }

    static getDerivedStateFromError(error) {
        // Update state so the next render will show the fallback UI.
        return { hasError: true, error };
    }

    componentDidCatch(error, errorInfo) {
        // You can also log the error to an error reporting service
        console.error("Uncaught error:", error, errorInfo);
        this.setState({ errorInfo });
    }

    handleReload = () => {
        window.location.reload();
    };

    render() {
        if (this.state.hasError) {
            return (
                <div className="min-h-screen flex items-center justify-center bg-slate-50 dark:bg-slate-900 p-4">
                    <div className="max-w-md w-full bg-white dark:bg-slate-800 rounded-3xl shadow-2xl p-8 border border-red-100 dark:border-red-900/30">
                        <div className="w-16 h-16 bg-red-100 dark:bg-green-900/50 rounded-full flex items-center justify-center mx-auto mb-6">
                            <AlertTriangle className="w-8 h-8 text-red-600 dark:text-red-400" />
                        </div>

                        <h2 className="text-2xl font-bold text-center text-slate-800 dark:text-white mb-2">
                            Algo salió mal
                        </h2>

                        <p className="text-slate-500 dark:text-slate-400 text-center mb-6 text-sm">
                            La aplicación ha encontrado un error inesperado al procesar los datos.
                        </p>

                        <div className="bg-slate-100 dark:bg-slate-950 p-4 rounded-xl mb-6 overflow-auto max-h-48 text-left">
                            <code className="text-xs text-red-500 font-mono break-all block mb-2">
                                {this.state.error && this.state.error.toString()}
                            </code>
                            <details className="text-xs text-slate-500">
                                <summary className="cursor-pointer hover:text-slate-700">Ver detalles técnicos</summary>
                                <pre className="mt-2 whitespace-pre-wrap">
                                    {this.state.errorInfo && this.state.errorInfo.componentStack}
                                </pre>
                            </details>
                        </div>

                        <button
                            onClick={this.handleReload}
                            className="w-full py-3 bg-advanta-green hover:bg-red-700 text-white font-bold rounded-xl transition-colors flex items-center justify-center gap-2"
                        >
                            <RefreshCw size={18} />
                            Recargar Aplicación
                        </button>
                    </div>
                </div>
            );
        }

        return this.props.children;
    }
}

export default ErrorBoundary;
