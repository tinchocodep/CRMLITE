import React, { useState, useRef } from 'react';
import { Upload, CheckCircle2, AlertCircle, X, Camera, Image as ImageIcon } from 'lucide-react';
import { useFileUpload } from '../../hooks/useFileUpload';

/**
 * Mobile-optimized photo uploader component
 * Supports camera capture and file selection with preview
 */
const PhotoUploader = ({
    documentType,
    label,
    onUploadComplete,
    existingFile = null,
    companyId
}) => {
    const fileInputRef = useRef(null);
    const cameraInputRef = useRef(null);
    const [preview, setPreview] = useState(existingFile?.storage_path || null);
    const [selectedFile, setSelectedFile] = useState(null);
    const { uploadFile, uploading, progress, error } = useFileUpload();

    const handleFileSelect = (e) => {
        const file = e.target.files[0];
        if (!file) return;

        // Validate file type
        const allowedTypes = ['image/jpeg', 'image/jpg', 'image/png', 'application/pdf'];
        if (!allowedTypes.includes(file.type)) {
            alert('Solo se permiten archivos JPEG, PNG o PDF');
            return;
        }

        // Validate file size (5MB)
        if (file.size > 5 * 1024 * 1024) {
            alert('El archivo no puede superar los 5MB');
            return;
        }

        setSelectedFile(file);

        // Create preview for images
        if (file.type.startsWith('image/')) {
            const reader = new FileReader();
            reader.onloadend = () => {
                setPreview(reader.result);
            };
            reader.readAsDataURL(file);
        } else {
            setPreview('pdf');
        }
    };

    const handleUpload = async () => {
        if (!selectedFile) return;

        try {
            // Generate unique file path
            const timestamp = Date.now();
            const extension = selectedFile.name.split('.').pop();
            const path = `company_${companyId}/${documentType}_${timestamp}.${extension}`;

            // Upload to Storage
            const { data, error: uploadError } = await uploadFile(selectedFile, {
                bucket: 'legajo-documents',
                path
            });

            if (uploadError) {
                alert(`Error al subir: ${uploadError.message}`);
                return;
            }

            // Notify parent component with file metadata
            if (onUploadComplete) {
                onUploadComplete({
                    document_type: documentType,
                    file_name: selectedFile.name,
                    file_size: selectedFile.size,
                    file_type: selectedFile.type,
                    storage_path: path
                });
            }

            // Reset state
            setSelectedFile(null);
        } catch (err) {
            console.error('Upload error:', err);
            alert('Error al subir el archivo');
        }
    };

    const handleCancel = () => {
        setSelectedFile(null);
        setPreview(existingFile?.storage_path || null);
        if (fileInputRef.current) {
            fileInputRef.current.value = '';
        }
        if (cameraInputRef.current) {
            cameraInputRef.current.value = '';
        }
    };

    const isUploaded = !!existingFile;
    const hasNewFile = !!selectedFile;

    return (
        <div className="relative">
            {/* Camera Input (Hidden) - Opens camera on mobile */}
            <input
                ref={cameraInputRef}
                type="file"
                accept="image/jpeg,image/jpg,image/png"
                capture="environment"
                onChange={handleFileSelect}
                className="hidden"
            />

            {/* File Input (Hidden) - Opens file picker */}
            <input
                ref={fileInputRef}
                type="file"
                accept="image/jpeg,image/jpg,image/png,application/pdf"
                onChange={handleFileSelect}
                className="hidden"
            />

            {/* Upload Card */}
            <div className={`
                relative flex flex-col items-center justify-center p-6 rounded-2xl border-2 border-dashed transition-all duration-300
                ${isUploaded && !hasNewFile
                    ? 'bg-emerald-50/50 border-emerald-200'
                    : hasNewFile
                        ? 'bg-blue-50/50 border-blue-300'
                        : 'bg-slate-50 border-slate-200 hover:border-brand-red/30 hover:bg-red-50/10'
                }
            `}>
                {/* Status Indicator */}
                <div className="absolute top-3 right-3">
                    {isUploaded && !hasNewFile && <CheckCircle2 className="text-emerald-500" size={20} />}
                    {error && <AlertCircle className="text-red-500" size={20} />}
                </div>

                {/* Preview or Icon */}
                {preview && preview !== 'pdf' ? (
                    <div className="w-full h-32 mb-3 rounded-xl overflow-hidden bg-slate-100">
                        <img
                            src={preview}
                            alt={label}
                            className="w-full h-full object-cover"
                        />
                    </div>
                ) : preview === 'pdf' ? (
                    <div className="w-16 h-16 rounded-full bg-red-100 flex items-center justify-center mb-3">
                        <span className="text-red-600 font-bold text-sm">PDF</span>
                    </div>
                ) : (
                    <div className="w-12 h-12 rounded-full bg-white shadow-sm flex items-center justify-center mb-3 text-slate-400">
                        <ImageIcon size={24} />
                    </div>
                )}

                {/* Label */}
                <h4 className="text-sm font-bold text-slate-700 mb-1 text-center">{label}</h4>
                <p className="text-[10px] text-slate-400 font-medium uppercase tracking-wide">
                    {isUploaded && !hasNewFile ? 'Cargado' : hasNewFile ? 'Listo para subir' : 'Pendiente'}
                </p>

                {/* Progress Bar */}
                {uploading && (
                    <div className="w-full mt-3">
                        <div className="h-1 w-full bg-slate-200 rounded-full overflow-hidden">
                            <div
                                className="h-full bg-brand-red transition-all duration-300"
                                style={{ width: `${progress}%` }}
                            />
                        </div>
                    </div>
                )}

                {/* Error Message */}
                {error && (
                    <p className="text-xs text-red-500 mt-2 text-center">{error}</p>
                )}

                {/* Action Buttons */}
                {!uploading && (
                    <div className="flex gap-2 mt-4 w-full">
                        {!hasNewFile ? (
                            <>
                                <button
                                    onClick={() => cameraInputRef.current?.click()}
                                    className="flex-1 px-4 py-2 bg-brand-red text-white rounded-xl text-sm font-bold hover:bg-red-600 transition-colors flex items-center justify-center gap-2"
                                >
                                    <Camera size={16} />
                                    Tomar Foto
                                </button>
                                <button
                                    onClick={() => fileInputRef.current?.click()}
                                    className="px-4 py-2 bg-slate-200 text-slate-700 rounded-xl text-sm font-bold hover:bg-slate-300 transition-colors"
                                >
                                    <Upload size={16} />
                                </button>
                            </>
                        ) : (
                            <>
                                <button
                                    onClick={handleUpload}
                                    className="flex-1 px-4 py-2 bg-emerald-500 text-white rounded-xl text-sm font-bold hover:bg-emerald-600 transition-colors"
                                >
                                    Subir
                                </button>
                                <button
                                    onClick={handleCancel}
                                    className="px-4 py-2 bg-slate-200 text-slate-700 rounded-xl text-sm font-bold hover:bg-slate-300 transition-colors"
                                >
                                    <X size={16} />
                                </button>
                            </>
                        )}
                    </div>
                )}
            </div>
        </div>
    );
};

export default PhotoUploader;
