import React, { useState } from 'react';
import { FileText, Truck, DollarSign, Download, Eye, X } from 'lucide-react';
import { Document, Page, pdfjs } from 'react-pdf';

// Configure PDF.js worker with https protocol
pdfjs.GlobalWorkerOptions.workerSrc = `https://cdnjs.cloudflare.com/ajax/libs/pdf.js/${pdfjs.version}/pdf.worker.min.js`;

/**
 * Comprobantes List Component
 * Shows all invoices, remitos, and payment receipts for an order
 */
export default function ComprobantesList({ comprobantes, onPreview }) {
    if (!comprobantes || comprobantes.length === 0) {
        return (
            <div className="text-center py-8 text-slate-500 dark:text-slate-400">
                <FileText className="w-12 h-12 mx-auto mb-2 opacity-50" />
                <p>No hay comprobantes generados</p>
            </div>
        );
    }

    const getIcon = (tipo) => {
        switch (tipo) {
            case 'FACTURA':
                return <FileText className="w-5 h-5" />;
            case 'REMITO':
                return <Truck className="w-5 h-5" />;
            case 'COBRO':
                return <DollarSign className="w-5 h-5" />;
            default:
                return <FileText className="w-5 h-5" />;
        }
    };

    const getColor = (tipo) => {
        switch (tipo) {
            case 'FACTURA':
                return 'bg-blue-100 dark:bg-blue-900/30 text-blue-600 dark:text-blue-400';
            case 'REMITO':
                return 'bg-green-100 dark:bg-green-900/30 text-green-600 dark:text-green-400';
            case 'COBRO':
                return 'bg-purple-100 dark:bg-purple-900/30 text-purple-600 dark:text-purple-400';
            default:
                return 'bg-slate-100 dark:bg-slate-900/30 text-slate-600 dark:text-slate-400';
        }
    };

    return (
        <div className="space-y-3">
            {comprobantes.map((comp) => (
                <div
                    key={comp.id}
                    className="p-4 bg-white dark:bg-slate-800 rounded-lg border border-slate-200 dark:border-slate-700 hover:shadow-md transition-shadow"
                >
                    <div className="flex items-start justify-between">
                        {/* Left: Type and Details */}
                        <div className="flex items-start gap-3 flex-1">
                            <div className={`p-2 rounded-lg ${getColor(comp.tipo)}`}>
                                {getIcon(comp.tipo)}
                            </div>

                            <div className="flex-1">
                                <div className="flex items-center gap-2 mb-1">
                                    <h4 className="font-bold text-slate-800 dark:text-slate-100">
                                        {comp.tipo} {comp.letra}
                                    </h4>
                                    <span className="text-sm text-slate-500 dark:text-slate-400">
                                        {String(comp.punto_venta).padStart(4, '0')}-{String(comp.numero_cbte).padStart(8, '0')}
                                    </span>
                                </div>

                                <div className="grid grid-cols-2 gap-x-4 gap-y-1 text-xs text-slate-600 dark:text-slate-400">
                                    {comp.cae && (
                                        <div>
                                            <span className="font-medium">CAE:</span> {comp.cae}
                                        </div>
                                    )}
                                    {comp.vto_cae && (
                                        <div>
                                            <span className="font-medium">Vto. CAE:</span> {comp.vto_cae}
                                        </div>
                                    )}
                                    <div>
                                        <span className="font-medium">Fecha:</span> {new Date(comp.fecha_emision).toLocaleDateString('es-AR')}
                                    </div>
                                    {comp.total > 0 && (
                                        <div>
                                            <span className="font-medium">Total:</span> ${comp.total.toLocaleString('es-AR')}
                                        </div>
                                    )}

                                    {/* Payment-specific fields */}
                                    {comp.tipo === 'COBRO' && (
                                        <>
                                            {comp.paymentMethod && (
                                                <div className="col-span-2">
                                                    <span className="font-medium">Método de Pago:</span>{' '}
                                                    <span className="capitalize">
                                                        {comp.paymentMethod.replace(/_/g, ' ')}
                                                    </span>
                                                </div>
                                            )}
                                            {comp.isPartialPayment && (
                                                <div className="col-span-2">
                                                    <span className="font-bold text-amber-600 dark:text-amber-400">
                                                        ⚠️ Cobro Parcial - Adeuda: ${comp.remainingBalance?.toLocaleString('es-AR') || '0'}
                                                    </span>
                                                </div>
                                            )}
                                            {!comp.isPartialPayment && (
                                                <div className="col-span-2">
                                                    <span className="font-bold text-green-600 dark:text-green-400">
                                                        ✅ Cobro Total
                                                    </span>
                                                </div>
                                            )}
                                            {comp.notes && (
                                                <div className="col-span-2">
                                                    <span className="font-medium">Notas:</span> {comp.notes}
                                                </div>
                                            )}
                                        </>
                                    )}
                                </div>
                            </div>
                        </div>

                        {/* Right: Actions */}
                        <div className="flex items-center gap-2">
                            {comp.pdf_url && (
                                <>
                                    <button
                                        onClick={() => onPreview(comp)}
                                        className="p-2 hover:bg-slate-100 dark:hover:bg-slate-700 rounded-lg transition-colors"
                                        title="Previsualizar PDF"
                                    >
                                        <Eye className="w-4 h-4 text-slate-600 dark:text-slate-400" />
                                    </button>
                                    <a
                                        href={comp.pdf_url}
                                        download={`${comp.tipo}_${comp.numero_cbte}.pdf`}
                                        className="p-2 hover:bg-slate-100 dark:hover:bg-slate-700 rounded-lg transition-colors"
                                        title="Descargar PDF"
                                    >
                                        <Download className="w-4 h-4 text-slate-600 dark:text-slate-400" />
                                    </a>
                                </>
                            )}
                        </div>
                    </div>

                    {/* QR Code (if available) */}
                    {comp.qr_url && (
                        <div className="mt-3 pt-3 border-t border-slate-200 dark:border-slate-700">
                            <a
                                href={comp.qr_url}
                                target="_blank"
                                rel="noopener noreferrer"
                                className="text-xs text-blue-600 dark:text-blue-400 hover:underline"
                            >
                                Ver código QR de AFIP →
                            </a>
                        </div>
                    )}
                </div>
            ))}
        </div>
    );
}

/**
 * PDF Preview Modal
 */
export function PDFPreviewModal({ isOpen, comprobante, onClose }) {
    const [numPages, setNumPages] = useState(null);
    const [pageNumber, setPageNumber] = useState(1);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState(null);

    if (!isOpen || !comprobante) return null;

    function onDocumentLoadSuccess({ numPages }) {
        setNumPages(numPages);
        setLoading(false);
        setError(null);
    }

    function onDocumentLoadError(error) {
        console.error('Error loading PDF:', error);
        setError('Error al cargar el PDF. Intenta descargarlo directamente.');
        setLoading(false);
    }

    return (
        <div className="fixed inset-0 bg-black/50 backdrop-blur-sm z-50 flex items-center justify-center p-4">
            <div className="bg-white dark:bg-slate-800 rounded-2xl shadow-2xl w-full max-w-4xl max-h-[90vh] flex flex-col">
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
                <div className="flex-1 overflow-auto bg-slate-100 dark:bg-slate-900 flex items-center justify-center">
                    {loading && (
                        <div className="text-center py-12">
                            <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-advanta-green dark:border-red-500 mx-auto mb-4"></div>
                            <p className="text-slate-600 dark:text-slate-400">Cargando PDF...</p>
                        </div>
                    )}

                    {error && (
                        <div className="text-center py-12 px-4">
                            <FileText className="w-16 h-16 mx-auto mb-4 text-red-500" />
                            <p className="text-red-600 dark:text-red-400 mb-4">{error}</p>
                            <a
                                href={comprobante.pdf_url}
                                download={`${comprobante.tipo}_${comprobante.numero_cbte}.pdf`}
                                className="inline-flex items-center gap-2 px-4 py-2 bg-advanta-green dark:bg-red-600 text-white rounded-lg hover:bg-advanta-green/90 dark:hover:bg-red-700 transition-colors"
                            >
                                <Download className="w-4 h-4" />
                                Descargar PDF
                            </a>
                        </div>
                    )}

                    {!error && (
                        <div className="py-4">
                            <Document
                                file={{
                                    url: comprobante.pdf_url,
                                    httpHeaders: {
                                        'Accept': 'application/pdf'
                                    },
                                    withCredentials: false
                                }}
                                onLoadSuccess={onDocumentLoadSuccess}
                                onLoadError={onDocumentLoadError}
                                loading=""
                                options={{
                                    cMapUrl: 'https://unpkg.com/pdfjs-dist@3.11.174/cmaps/',
                                    cMapPacked: true,
                                    standardFontDataUrl: 'https://unpkg.com/pdfjs-dist@3.11.174/standard_fonts/'
                                }}
                            >
                                <Page
                                    pageNumber={pageNumber}
                                    renderTextLayer={true}
                                    renderAnnotationLayer={true}
                                    className="shadow-lg"
                                />
                            </Document>

                            {/* Page Navigation */}
                            {numPages && numPages > 1 && (
                                <div className="flex items-center justify-center gap-4 mt-4">
                                    <button
                                        onClick={() => setPageNumber(Math.max(1, pageNumber - 1))}
                                        disabled={pageNumber <= 1}
                                        className="px-3 py-1 bg-slate-200 dark:bg-slate-700 rounded disabled:opacity-50 disabled:cursor-not-allowed hover:bg-slate-300 dark:hover:bg-slate-600 transition-colors"
                                    >
                                        Anterior
                                    </button>
                                    <span className="text-sm text-slate-600 dark:text-slate-400">
                                        Página {pageNumber} de {numPages}
                                    </span>
                                    <button
                                        onClick={() => setPageNumber(Math.min(numPages, pageNumber + 1))}
                                        disabled={pageNumber >= numPages}
                                        className="px-3 py-1 bg-slate-200 dark:bg-slate-700 rounded disabled:opacity-50 disabled:cursor-not-allowed hover:bg-slate-300 dark:hover:bg-slate-600 transition-colors"
                                    >
                                        Siguiente
                                    </button>
                                </div>
                            )}
                        </div>
                    )}
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
                        className="px-4 py-2 bg-advanta-green dark:bg-red-600 text-white rounded-lg hover:bg-advanta-green/90 dark:hover:bg-red-700 transition-colors flex items-center gap-2"
                    >
                        <Download className="w-4 h-4" />
                        Descargar PDF
                    </a>
                </div>
            </div>
        </div>
    );
}
