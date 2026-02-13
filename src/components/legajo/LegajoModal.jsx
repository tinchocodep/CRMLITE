import React, { useState } from 'react';
import { CheckCircle2, FileText, X } from 'lucide-react';
import PhotoUploader from './PhotoUploader';
import { useLegajoDocuments } from '../../hooks/useLegajoDocuments';
import { useNotifications } from '../../hooks/useNotifications';

const docTypes = {
    dni_front: { label: 'DNI Frente', required: true },
    dni_back: { label: 'DNI Reverso', required: true },
    selfie: { label: 'Selfie Validación', required: true },
    cbu_proof: { label: 'Constancia CBU', required: true },
    iibb_exemption: { label: 'Exención IIBB', required: false },
    f1276: { label: 'Formulario F1276', required: true },
};

const LegajoModal = ({ isOpen, onClose, client }) => {
    if (!isOpen || !client) return null;

    const companyId = client.id;
    const { addNotification } = useNotifications();
    const {
        documents,
        loading,
        createDocument,
        replaceDocument,
        getDocumentByType,
        getCompletionStats
    } = useLegajoDocuments(companyId);

    const [uploadingType, setUploadingType] = useState(null);

    const handleUploadComplete = async (fileMetadata) => {
        try {
            // Check if document already exists
            const existingDoc = getDocumentByType(fileMetadata.document_type);

            if (existingDoc) {
                // Mark old document as replaced
                await replaceDocument(fileMetadata.document_type);
            }

            // Create new document record
            await createDocument(fileMetadata);

            setUploadingType(null);
        } catch (error) {
            console.error('Error saving document:', error);
            addNotification({
                id: `error-save-document-${Date.now()}`,
                title: '❌ Error al guardar documento',
                description: error.message || 'No se pudo guardar el documento',
                priority: 'high',
                timeAgo: 'Ahora'
            });
        }
    };

    const stats = getCompletionStats();

    return (
        <div className="fixed inset-0 z-[9999] bg-slate-900/60 backdrop-blur-sm flex items-center justify-center p-4 animate-in fade-in duration-200">
            <div className="w-full max-w-4xl bg-white rounded-[2rem] shadow-2xl overflow-hidden animate-in zoom-in-95 duration-300 flex flex-col max-h-[90vh]">

                {/* Header */}
                <div className="bg-white border-b border-slate-100 p-6 flex justify-between items-start sticky top-0 z-10">
                    <div>
                        <div className="flex items-center gap-2 mb-1">
                            <span className="bg-slate-100 text-slate-500 text-[10px] font-bold px-2 py-0.5 rounded uppercase tracking-wider">
                                Legajo Digital
                            </span>
                            <span className="text-slate-300">|</span>
                            <span className="text-xs font-bold text-advanta-green">LEG: {client.file_number || 'PENDIENTE'}</span>
                        </div>
                        <h2 className="text-2xl font-bold text-slate-800">{client.trade_name}</h2>
                        <p className="text-sm text-slate-500">{client.legal_name}</p>

                        {/* Progress Badge */}
                        <div className="mt-2 inline-flex items-center gap-2 px-3 py-1 bg-slate-50 rounded-lg border border-slate-200">
                            <span className="text-xs font-bold text-slate-600">
                                Progreso: {stats.uploaded}/{stats.total}
                            </span>
                            <div className="h-2 w-24 bg-slate-200 rounded-full overflow-hidden">
                                <div
                                    className={`h-full transition-all duration-500 ${stats.isComplete ? 'bg-emerald-500' : 'bg-advanta-green'}`}
                                    style={{ width: `${stats.percentage}%` }}
                                />
                            </div>
                            <span className="text-xs font-bold text-slate-500">{stats.percentage}%</span>
                        </div>
                    </div>
                    <button onClick={onClose} className="p-2 hover:bg-slate-100 rounded-full text-slate-400 hover:text-slate-600 transition-colors">
                        <X size={24} />
                    </button>
                </div>

                {/* Content */}
                <div className="flex-1 overflow-y-auto p-8 custom-scrollbar bg-slate-50/30">

                    {loading ? (
                        <div className="flex items-center justify-center py-12">
                            <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-advanta-green"></div>
                        </div>
                    ) : (
                        <>
                            <div className="mb-8">
                                <h3 className="text-sm font-bold text-slate-400 uppercase tracking-wider mb-4 flex items-center gap-2">
                                    <CheckCircle2 size={16} /> Identidad y Biometría
                                </h3>
                                <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-4">
                                    <PhotoUploader
                                        documentType="dni_front"
                                        label={docTypes.dni_front.label}
                                        companyId={companyId}
                                        existingFile={getDocumentByType('dni_front')}
                                        onUploadComplete={handleUploadComplete}
                                    />
                                    <PhotoUploader
                                        documentType="dni_back"
                                        label={docTypes.dni_back.label}
                                        companyId={companyId}
                                        existingFile={getDocumentByType('dni_back')}
                                        onUploadComplete={handleUploadComplete}
                                    />
                                    <PhotoUploader
                                        documentType="selfie"
                                        label={docTypes.selfie.label}
                                        companyId={companyId}
                                        existingFile={getDocumentByType('selfie')}
                                        onUploadComplete={handleUploadComplete}
                                    />
                                </div>
                            </div>

                            <div>
                                <h3 className="text-sm font-bold text-slate-400 uppercase tracking-wider mb-4 flex items-center gap-2">
                                    <FileText size={16} /> Documentación Fiscal y Bancaria
                                </h3>
                                <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-4">
                                    <PhotoUploader
                                        documentType="cbu_proof"
                                        label={docTypes.cbu_proof.label}
                                        companyId={companyId}
                                        existingFile={getDocumentByType('cbu_proof')}
                                        onUploadComplete={handleUploadComplete}
                                    />
                                    <PhotoUploader
                                        documentType="iibb_exemption"
                                        label={docTypes.iibb_exemption.label}
                                        companyId={companyId}
                                        existingFile={getDocumentByType('iibb_exemption')}
                                        onUploadComplete={handleUploadComplete}
                                    />
                                    <PhotoUploader
                                        documentType="f1276"
                                        label={docTypes.f1276.label}
                                        companyId={companyId}
                                        existingFile={getDocumentByType('f1276')}
                                        onUploadComplete={handleUploadComplete}
                                    />
                                </div>
                            </div>
                        </>
                    )}

                </div>

                {/* Footer */}
                <div className="p-4 border-t border-slate-100 bg-white flex justify-between items-center">
                    <p className="text-xs text-slate-400 font-medium">
                        {stats.allDocuments} documento{stats.allDocuments !== 1 ? 's' : ''} cargado{stats.allDocuments !== 1 ? 's' : ''}
                    </p>
                    <button onClick={onClose} className="px-6 py-2 bg-slate-800 text-white font-bold rounded-xl hover:bg-slate-700 transition-colors shadow-lg">
                        Cerrar
                    </button>
                </div>
            </div>
        </div>
    );
};

export default LegajoModal;
