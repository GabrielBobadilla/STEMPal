import React, { useRef, useState, useCallback, useEffect } from 'react';
import { motion } from 'framer-motion';
import { FiCamera, FiRefreshCw, FiCheck, FiX } from 'react-icons/fi';

const Scanner = ({ onCapture, onClose }) => {
  const videoRef = useRef(null);
  const canvasRef = useRef(null);
  const [stream, setStream] = useState(null);
  const [captured, setCaptured] = useState(null);
  const [processing, setProcessing] = useState(false);
  const [facingMode, setFacingMode] = useState('environment');

  useEffect(() => {
    startCamera();
    return () => stopCamera();
  }, [facingMode]);

  const startCamera = async () => {
    stopCamera();
    try {
      const s = await navigator.mediaDevices.getUserMedia({
        video: { facingMode, width: { ideal: 1920 }, height: { ideal: 1080 } },
        audio: false,
      });
      setStream(s);
      if (videoRef.current) {
        videoRef.current.srcObject = s;
      }
    } catch (err) {
      console.error('Camera error:', err);
    }
  };

  const stopCamera = () => {
    if (stream) {
      stream.getTracks().forEach(t => t.stop());
      setStream(null);
    }
  };

  const captureImage = useCallback(() => {
    if (!videoRef.current || !canvasRef.current) return;
    const video = videoRef.current;
    const canvas = canvasRef.current;
    canvas.width = video.videoWidth;
    canvas.height = video.videoHeight;
    const ctx = canvas.getContext('2d');
    ctx.drawImage(video, 0, 0);
    const dataUrl = canvas.toDataURL('image/jpeg', 0.92);
    setCaptured(dataUrl);
    stopCamera();
  }, []);

  const enhanceImage = useCallback((dataUrl) => {
    return new Promise((resolve) => {
      const img = new Image();
      img.onload = () => {
        const canvas = document.createElement('canvas');
        const ctx = canvas.getContext('2d');
        canvas.width = img.width;
        canvas.height = img.height;
        ctx.drawImage(img, 0, 0);

        const imageData = ctx.getImageData(0, 0, canvas.width, canvas.height);
        const data = imageData.data;
        for (let i = 0; i < data.length; i += 4) {
          const avg = (data[i] + data[i + 1] + data[i + 2]) / 3;
          const threshold = 128;
          data[i] = data[i] > threshold ? Math.min(255, data[i] + 30) : Math.max(0, data[i] - 20);
          data[i + 1] = data[i + 1] > threshold ? Math.min(255, data[i + 1] + 30) : Math.max(0, data[i + 1] - 20);
          data[i + 2] = data[i + 2] > threshold ? Math.min(255, data[i + 2] + 30) : Math.max(0, data[i + 2] - 20);
        }
        ctx.putImageData(imageData, 0, 0);
        resolve(canvas.toDataURL('image/jpeg', 0.95));
      };
      img.src = dataUrl;
    });
  }, []);

  const handleAccept = async () => {
    if (!captured) return;
    setProcessing(true);
    const enhanced = await enhanceImage(captured);
    onCapture(enhanced);
    setProcessing(false);
  };

  const handleRetake = () => {
    setCaptured(null);
    startCamera();
  };

  return (
    <div className="relative w-full max-w-lg mx-auto">
      {!captured ? (
        <div className="relative rounded-2xl overflow-hidden bg-black">
          <video ref={videoRef} autoPlay playsInline className="w-full aspect-[3/4] object-cover" />
          <canvas ref={canvasRef} className="hidden" />
          <div className="absolute bottom-0 left-0 right-0 p-4 bg-gradient-to-t from-black/70 to-transparent flex items-center justify-center gap-4">
            <motion.button whileTap={{ scale: 0.9 }}
              onClick={() => setFacingMode(f => f === 'environment' ? 'user' : 'environment')}
              className="w-12 h-12 rounded-full bg-white/20 backdrop-blur flex items-center justify-center text-white">
              <FiRefreshCw className="w-5 h-5" />
            </motion.button>
            <motion.button whileTap={{ scale: 0.9 }} onClick={captureImage}
              className="w-16 h-16 rounded-full bg-white flex items-center justify-center shadow-lg">
              <FiCamera className="w-7 h-7 text-gray-800" />
            </motion.button>
            <motion.button whileTap={{ scale: 0.9 }} onClick={onClose}
              className="w-12 h-12 rounded-full bg-white/20 backdrop-blur flex items-center justify-center text-white">
              <FiX className="w-5 h-5" />
            </motion.button>
          </div>
        </div>
      ) : (
        <div className="relative rounded-2xl overflow-hidden bg-black">
          <img src={captured} alt="Captured" className="w-full aspect-[3/4] object-contain" />
          <div className="absolute bottom-0 left-0 right-0 p-4 bg-gradient-to-t from-black/70 to-transparent flex items-center justify-center gap-4">
            <motion.button whileTap={{ scale: 0.9 }} onClick={handleRetake}
              className="w-12 h-12 rounded-full bg-white/20 backdrop-blur flex items-center justify-center text-white">
              <FiX className="w-5 h-5" />
            </motion.button>
            <motion.button whileTap={{ scale: 0.9 }} onClick={handleAccept} disabled={processing}
              className="w-16 h-16 rounded-full bg-green-500 flex items-center justify-center shadow-lg disabled:opacity-50">
              {processing ? (
                <div className="animate-spin rounded-full h-6 w-6 border-t-2 border-b-2 border-white" />
              ) : (
                <FiCheck className="w-7 h-7 text-white" />
              )}
            </motion.button>
            <div className="w-12" />
          </div>
        </div>
      )}
    </div>
  );
};

export default Scanner;