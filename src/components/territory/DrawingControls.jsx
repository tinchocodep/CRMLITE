import React from 'react';
import { Check, X } from 'lucide-react';

const DrawingControls = ({ onConfirm, onCancel, hectares, hasGeometry }) => {
    return (
        <div className="absolute bottom-20 left-1/2 -translate-x-1/2 z-[1000] flex items-center gap-2 bg-white/95 backdrop-blur-md px-4 py-3 rounded-xl shadow-2xl border border-white/20">
            {/* Area Display */}
            {hectares && (
                <div className="flex items-center gap-2 px-3 py-1.5 bg-green-50 rounded-lg">
                    <span className="text-xs font-medium text-gray-700">Área:</span>
                    <span className="text-sm font-bold text-green-600">
                        {hectares.toFixed(2)} ha
                    </span>
                </div>
            )}

            {/* Cancel Button */}
            <button
                onClick={onCancel}
                className="px-4 py-1.5 bg-red-100 text-red-700 rounded-lg hover:bg-red-200 transition-colors text-sm font-medium flex items-center gap-1.5"
                title="Cancelar dibujo"
            >
                <X className="w-4 h-4" />
                Cancelar
            </button>

            {/* Confirm Button */}
            <button
                onClick={onConfirm}
                disabled={!hasGeometry}
                className={`px-4 py-1.5 rounded-lg transition-colors text-sm font-medium flex items-center gap-1.5 shadow-lg ${hasGeometry
                    ? 'bg-green-600 text-white hover:bg-green-700'
                    : 'bg-gray-300 text-gray-500 cursor-not-allowed'
                    }`}
                title={hasGeometry ? "Confirmar y crear lote" : "Dibuja una forma primero"}
            >
                <Check className="w-4 h-4" />
                Confirmar
            </button>
        </div>
    );
};

export default DrawingControls;
