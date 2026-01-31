import React, { useState } from 'react';
import { Upload, CheckCircle2, AlertCircle, FileText, Image, Camera, X, Eye } from 'lucide-react';

const docTypes = {
    dni_front: { label: 'DNI Frente', icon: Image, required: true },
    dni_back: { label: 'DNI Reverso', icon: Image, required: true },
    selfie: { label: 'Selfie Validación', icon: Camera, required: true },
    cbu_proof: { label: 'Constancia CBU', icon: FileText, required: true },
    iibb_exemption: { label: 'Exención IIBB', icon: FileText, required: false },
    f1276: { label: 'Formulario F1276', icon: FileText, required: true },
};

const DocumentCard = ({ type, data, onUpload }) => {
    const config = docTypes[type];
    const isUploaded = data?.status === 'uploaded';
    const isExpired = data?.status === 'expired';

    return (
        <div className={`
            relative flex flex-col items-center justify-center p-6 rounded-2xl border-2 border-dashed transition-all duration-300 group
            ${isUploaded
                ? 'bg-emerald-50/50 border-emerald-200'
                : isExpired
                    ? 'bg-amber-50/50 border-amber-200'
                    : 'bg-slate-50 border-slate-200 hover:border-brand-red/30 hover:bg-red-50/10'}
        `}>
            {/* Status Indicator */}
            <div className="absolute top-3 right-3">
                {isUploaded && <CheckCircle2 className="text-emerald-500" size={20} />}
                {isExpired && <AlertCircle className="text-amber-500" size={20} />}
                {!isUploaded && !isExpired && config.required && (
                    <div className="w-2 h-2 rounded-full bg-brand-red animate-pulse" title="Requerido" />
                )}
            </div>

            {/* Icon */}
            <div className={`
                w-12 h-12 rounded-full flex items-center justify-center mb-3 transition-colors
                ${isUploaded ? 'bg-emerald-100 text-emerald-600' : 'bg-white shadow-sm text-slate-400 group-hover:text-brand-red'}
            `}>
                <config.icon size={24} />
            </div>

            {/* Labels */}
            <h4 className="text-sm font-bold text-slate-700 mb-1">{config.label}</h4>
            <p className="text-[10px] text-slate-400 font-medium uppercase tracking-wide">
                {isUploaded ? 'Cargado' : isExpired ? 'Vencido' : 'Pendiente'}
            </p>

            {/* Upload Button overlay */}
            <div className="absolute inset-0 bg-white/60 opacity-0 group-hover:opacity-100 backdrop-blur-[2px] transition-opacity flex items-center justify-center gap-2 rounded-2xl">
                <button
                    onClick={() => onUpload(type)}
                    className="p-2 bg-brand-red text-white rounded-full shadow-lg hover:scale-110 transition-transform"
                    title="Subir Archivo"
                >
                    <Upload size={18} />
                </button>
                {isUploaded && (
                    <button className="p-2 bg-slate-800 text-white rounded-full shadow-lg hover:scale-110 transition-transform" title="Ver Archivo">
                        <Eye size={18} />
                    </button>
                )}
            </div>

            {/* Required Label */}
            {!isUploaded && config.required && (
                <div className="absolute bottom-3 text-[9px] font-bold text-brand-red bg-red-50 px-2 py-0.5 rounded-full">
                    REQUERIDO
                </div>
            )}
        </div>
    );
};

const LegajoModal = ({ isOpen, onClose, client, legajo, onSave }) => {
    if (!isOpen || !client) return null;

    // Merge mock legajo data or use default empty structure
    const docs = legajo?.documents || {
        dni_front: { status: 'missing' },
        dni_back: { status: 'missing' },
        selfie: { status: 'missing' },
        cbu_proof: { status: 'missing' },
        iibb_exemption: { status: 'missing' },
        f1276: { status: 'missing' },
    };

    const handleUpload = (type) => {
        // Mock upload action
        alert(`Simulando subida de: ${docTypes[type].label}`);
        // In a real app, this would trigger a file picker and update state
    };

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
                            <span className="text-xs font-bold text-brand-red">LEG: {client.fileNumber || 'PENDIENTE'}</span>
                        </div>
                        <h2 className="text-2xl font-bold text-slate-800">{client.tradeName}</h2>
                        <p className="text-sm text-slate-500">{client.legalName}</p>
                    </div>
                    <button onClick={onClose} className="p-2 hover:bg-slate-100 rounded-full text-slate-400 hover:text-slate-600 transition-colors">
                        <X size={24} />
                    </button>
                </div>

                {/* Content */}
                <div className="flex-1 overflow-y-auto p-8 custom-scrollbar bg-slate-50/30">

                    <div className="mb-8">
                        <h3 className="text-sm font-bold text-slate-400 uppercase tracking-wider mb-4 flex items-center gap-2">
                            <CheckCircle2 size={16} /> Identidad y Biometría
                        </h3>
                        <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-4">
                            <DocumentCard type="dni_front" data={docs.dni_front} onUpload={handleUpload} />
                            <DocumentCard type="dni_back" data={docs.dni_back} onUpload={handleUpload} />
                            <DocumentCard type="selfie" data={docs.selfie} onUpload={handleUpload} />
                        </div>
                    </div>

                    <div>
                        <h3 className="text-sm font-bold text-slate-400 uppercase tracking-wider mb-4 flex items-center gap-2">
                            <FileText size={16} /> Documentación Fiscal y Bancaria
                        </h3>
                        <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-4">
                            <DocumentCard type="cbu_proof" data={docs.cbu_proof} onUpload={handleUpload} />
                            <DocumentCard type="iibb_exemption" data={docs.iibb_exemption} onUpload={handleUpload} />
                            <DocumentCard type="f1276" data={docs.f1276} onUpload={handleUpload} />
                        </div>
                    </div>

                </div>

                {/* Footer */}
                <div className="p-4 border-t border-slate-100 bg-white flex justify-between items-center">
                    <p className="text-xs text-slate-400 font-medium">
                        Última actualización: {legajo?.updatedAt ? new Date(legajo.updatedAt).toLocaleDateString() : 'Nunca'}
                    </p>
                    <button onClick={onClose} className="px-6 py-2 bg-slate-800 text-white font-bold rounded-xl hover:bg-slate-700 transition-colors shadow-lg">
                        Guardar y Cerrar
                    </button>
                </div>
            </div>
        </div>
    );
};

export default LegajoModal;
