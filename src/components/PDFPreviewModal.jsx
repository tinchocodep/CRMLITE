import React, { useState } from 'react';
import { X, Download } from 'lucide-react';

/**
 * PDF Preview Modal Component
 * Shows PDF preview using Google Docs Viewer to bypass CORS issues
 */
export function PDFPreviewModal({ isOpen, comprobante, onClose }) {
    const [loading, setLoading] = useState(true);

    if (!isOpen || !comprobante) return null;

    // Use Google Docs Viewer to bypass CORS
    const googleViewerUrl = `https://docs.google.com/viewer?url=${encodeURIComponent(comprobante.pdf_url)}&embedded=true`;

    return (
        <div className="fixed inset-0 bg-black/50 backdrop-blur-sm z-50 flex items-center justify-center p-4">
            <div className="bg-white dark:bg-slate-800 rounded-2xl shadow-2xl w-full max-w-6xl h-[95vh] flex flex-col">
                {/* Header */}
                <div className="flex items-center justify-between p-4 border-b border-slate-200 dark:border-slate-700">
                    <div>
                        <h2 className="text-xl font-bold text-slate-800 dark:text-slate-100">
                            {comprobante.tipo} {comprobante.letra} - {String(comprobante.punto_venta).padStart(4, '0')}-{String(comprobante.numero_cbte).padStart(8, '0')}
                        </h2>
                        <p className="text-sm text-slate-600 dark:text-slate-400">
                            {comprobante.clientName}
                        </p>
                    </div>
                    <button
                        onClick={onClose}
                        className="p-2 hover:bg-slate-100 dark:hover:bg-slate-700 rounded-lg transition-colors"
                    >
                        <X className="w-5 h-5" />
                    </button>
                </div>

                {/* PDF Viewer */}
                <div className="flex-1 overflow-hidden bg-slate-100 dark:bg-slate-900 flex items-center justify-center relative">
                    {loading && (
                        <div className="absolute inset-0 flex items-center justify-center bg-slate-100 dark:bg-slate-900 z-10">
                            <div className="text-center">
                                <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-advanta-green dark:border-red-500 mx-auto mb-4"></div>
                                <p className="text-slate-600 dark:text-slate-400">Cargando PDF...</p>
                            </div>
                        </div>
                    )}

                    <iframe
                        src={googleViewerUrl}
                        className="w-full h-full"
                        title={`${comprobante.tipo} ${comprobante.numero_cbte}`}
                        onLoad={() => setLoading(false)}
                    />
                </div>

                {/* Footer */}
                <div className="p-4 border-t border-slate-200 dark:border-slate-700 flex justify-between items-center">
                    <div className="text-sm text-slate-600 dark:text-slate-400">
                        {comprobante.cae && (
                            <span>CAE: {comprobante.cae} | Vto: {comprobante.vto_cae}</span>
                        )}
                    </div>
                    <a
                        href={comprobante.pdf_url}
                        download={`${comprobante.tipo}_${comprobante.numero_cbte}.pdf`}
                        className="px-4 py-2 bg-advanta-green text-white rounded-lg hover:bg-advanta-green/90 transition-colors flex items-center gap-2 font-medium"
                    >
                        <Download className="w-4 h-4" />
                        Descargar PDF
                    </a>
                </div>
            </div>
        </div>
    );
}

export default PDFPreviewModal;
