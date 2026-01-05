import React, { useState, useCallback, useRef, useEffect } from 'react';
import { useLanguage } from '../types';

interface CameraInputProps {
    onCapture: (base64Data: string, mimeType: string) => void;
}

const CameraInput: React.FC<CameraInputProps> = ({ onCapture }) => {
    const { t } = useLanguage();
    const [isCameraOpen, setIsCameraOpen] = useState(false);
    const [stream, setStream] = useState<MediaStream | null>(null);
    const [error, setError] = useState<string | null>(null);
    const videoRef = useRef<HTMLVideoElement>(null);
    const canvasRef = useRef<HTMLCanvasElement>(null);

    const openCamera = useCallback(async () => {
        setError(null);
        if (navigator.mediaDevices && navigator.mediaDevices.getUserMedia) {
            try {
                const mediaStream = await navigator.mediaDevices.getUserMedia({
                    video: { facingMode: 'environment' },
                });
                setStream(mediaStream);
                setIsCameraOpen(true);
            } catch (err) {
                console.error("Error accessing camera:", err);
                let errorMessage = t('camera.error');
                if (err instanceof DOMException) {
                    if (err.name === 'NotAllowedError' || err.name === 'PermissionDeniedError') {
                        errorMessage = t('camera.permissionDenied');
                    } else if (err.name === 'NotFoundError') {
                        errorMessage = t('camera.notFound');
                    }
                } else if (err instanceof Error && (err.message.toLowerCase().includes('permission denied') || err.message.toLowerCase().includes('permission dismissed'))) {
                    errorMessage = t('camera.permissionDenied');
                }
                setError(errorMessage);
                setIsCameraOpen(false);
            }
        } else {
            setError(t('camera.unsupported'));
        }
    }, [t]);

    const closeCamera = useCallback(() => {
        if (stream) {
            stream.getTracks().forEach(track => track.stop());
        }
        setStream(null);
        setIsCameraOpen(false);
    }, [stream]);

    const handleCapture = () => {
        const video = videoRef.current;
        const canvas = canvasRef.current;
        if (video && canvas) {
            canvas.width = video.videoWidth;
            canvas.height = video.videoHeight;
            const context = canvas.getContext('2d');
            context?.drawImage(video, 0, 0, video.videoWidth, video.videoHeight);
            
            const mimeType = 'image/jpeg';
            const dataUrl = canvas.toDataURL(mimeType, 0.9);
            const base64Data = dataUrl.split(',')[1];

            onCapture(base64Data, mimeType);
            closeCamera();
        }
    };

    useEffect(() => {
        if (isCameraOpen && stream && videoRef.current) {
            videoRef.current.srcObject = stream;
        }
    }, [isCameraOpen, stream]);
    
    useEffect(() => {
      return () => {
        if (stream) {
          stream.getTracks().forEach(track => track.stop());
        }
      }
    }, [stream]);

    return (
        <>
            <button
                type="button"
                onClick={openCamera}
                className="flex items-center justify-center w-full px-4 py-2 border border-brand-blue/70 rounded-md text-sm font-medium text-gray-300 hover:bg-brand-blue/70 transition-colors"
            >
                <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5 rtl:ml-2 ltr:mr-2" viewBox="0 0 20 20" fill="currentColor"><path d="M2 6a2 2 0 012-2h1.172a2 2 0 011.414.586l1.414 1.414A2 2 0 009.172 6H10a2 2 0 012 2v1.172a2 2 0 01.586 1.414l1.414 1.414A2 2 0 0016 11.172V12a2 2 0 012 2v2a2 2 0 01-2 2H4a2 2 0 01-2-2v-2a2 2 0 012-2V8a2 2 0 012-2h.828Z" /><path d="M10 12a2 2 0 100-4 2 2 0 000 4Z" /></svg>
                {t('camera.use')}
            </button>

            {isCameraOpen && (
                <div className="fixed inset-0 bg-black bg-opacity-80 flex items-center justify-center z-[60]" onMouseDown={closeCamera}>
                    <div className="bg-brand-blue p-4 rounded-lg shadow-xl border border-brand-gold/50 max-w-lg w-full m-4" onMouseDown={e => e.stopPropagation()}>
                        <video ref={videoRef} autoPlay playsInline className="w-full rounded-md" />
                        <div className="mt-4 flex justify-center gap-4">
                            <button onClick={handleCapture} className="px-6 py-2 bg-brand-gold text-brand-blue font-bold rounded-lg">{t('camera.takePicture')}</button>
                            <button onClick={closeCamera} className="px-6 py-2 bg-brand-blue/50 text-white rounded-lg">{t('camera.cancel')}</button>
                        </div>
                        <canvas ref={canvasRef} className="hidden" />
                    </div>
                </div>
            )}
            {error && <p className="mt-2 text-sm text-red-400 text-center">{error}</p>}
        </>
    );
};

export default CameraInput;