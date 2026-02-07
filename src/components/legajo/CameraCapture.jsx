import React, { useRef, useState, useEffect } from 'react';
import { Camera, X, RotateCcw } from 'lucide-react';

/**
 * Camera capture component using getUserMedia API
 * Works on both desktop and mobile browsers
 */
const CameraCapture = ({ onCapture, onClose }) => {
    const videoRef = useRef(null);
    const canvasRef = useRef(null);
    const [stream, setStream] = useState(null);
    const [error, setError] = useState(null);
    const [facingMode, setFacingMode] = useState('environment'); // 'user' or 'environment'

    useEffect(() => {
        startCamera();
        return () => {
            stopCamera();
        };
    }, [facingMode]);

    const startCamera = async () => {
        try {
            setError(null);

            // Stop previous stream if exists
            if (stream) {
                stream.getTracks().forEach(track => track.stop());
            }

            // Request camera access
            const mediaStream = await navigator.mediaDevices.getUserMedia({
                video: {
                    facingMode: facingMode,
                    width: { ideal: 1920 },
                    height: { ideal: 1080 }
                },
                audio: false
            });

            setStream(mediaStream);

            if (videoRef.current) {
                videoRef.current.srcObject = mediaStream;
            }
        } catch (err) {
            console.error('Error accessing camera:', err);
            setError('No se pudo acceder a la cámara. Verifica los permisos.');
        }
    };

    const stopCamera = () => {
        if (stream) {
            stream.getTracks().forEach(track => track.stop());
        }
    };

    const capturePhoto = () => {
        if (!videoRef.current || !canvasRef.current) return;

        const video = videoRef.current;
        const canvas = canvasRef.current;
        const context = canvas.getContext('2d');

        // Set canvas size to video size
        canvas.width = video.videoWidth;
        canvas.height = video.videoHeight;

        // Draw video frame to canvas
        context.drawImage(video, 0, 0, canvas.width, canvas.height);

        // Convert canvas to blob
        canvas.toBlob((blob) => {
            if (blob) {
                // Create File object from blob
                const file = new File([blob], `photo_${Date.now()}.jpg`, {
                    type: 'image/jpeg'
                });

                onCapture(file);
                stopCamera();
                onClose();
            }
        }, 'image/jpeg', 0.95);
    };

    const toggleCamera = () => {
        setFacingMode(prev => prev === 'user' ? 'environment' : 'user');
    };

    return (
        <div className="fixed inset-0 bg-black z-50 flex flex-col">
            {/* Header */}
            <div className="flex items-center justify-between p-4 bg-black/50">
                <button
                    onClick={() => {
                        stopCamera();
                        onClose();
                    }}
                    className="p-2 text-white hover:bg-white/10 rounded-full transition-colors"
                >
                    <X size={24} />
                </button>
                <h3 className="text-white font-bold">Tomar Foto</h3>
                <button
                    onClick={toggleCamera}
                    className="p-2 text-white hover:bg-white/10 rounded-full transition-colors"
                >
                    <RotateCcw size={24} />
                </button>
            </div>

            {/* Video Preview */}
            <div className="flex-1 flex items-center justify-center bg-black">
                {error ? (
                    <div className="text-white text-center p-6">
                        <p className="mb-4">{error}</p>
                        <button
                            onClick={startCamera}
                            className="px-6 py-3 bg-advanta-green text-white rounded-xl font-bold hover:bg-red-600 transition-colors"
                        >
                            Reintentar
                        </button>
                    </div>
                ) : (
                    <video
                        ref={videoRef}
                        autoPlay
                        playsInline
                        className="max-w-full max-h-full"
                    />
                )}
            </div>

            {/* Capture Button */}
            {!error && (
                <div className="p-6 flex justify-center bg-black/50">
                    <button
                        onClick={capturePhoto}
                        className="w-16 h-16 bg-white rounded-full border-4 border-advanta-green hover:bg-red-50 transition-all shadow-lg flex items-center justify-center"
                    >
                        <Camera size={32} className="text-advanta-green" />
                    </button>
                </div>
            )}

            {/* Hidden canvas for capture */}
            <canvas ref={canvasRef} className="hidden" />
        </div>
    );
};

export default CameraCapture;
