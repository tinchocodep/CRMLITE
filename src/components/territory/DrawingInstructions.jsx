import React from 'react';
import { Info } from 'lucide-react';

const DrawingInstructions = () => {
    return (
        <div className="absolute top-20 left-4 z-[1000] max-w-sm">
            <div className="bg-blue-50 border-l-4 border-blue-500 p-4 rounded-lg shadow-lg">
                <div className="flex items-start gap-3">
                    <Info className="w-5 h-5 text-blue-600 flex-shrink-0 mt-0.5" />
                    <div>
                        <h4 className="text-sm font-semibold text-blue-900 mb-1">
                            Cómo dibujar un lote
                        </h4>
                        <ul className="text-xs text-blue-800 space-y-1">
                            <li>• Haz clic en el ícono de polígono (arriba a la derecha)</li>
                            <li>• Haz clic en el mapa para agregar cada punto</li>
                            <li>• <strong>Haz doble clic</strong> en el último punto para cerrar el polígono</li>
                            <li>• O haz clic en el primer punto para cerrar</li>
                        </ul>
                    </div>
                </div>
            </div>
        </div>
    );
};

export default DrawingInstructions;
