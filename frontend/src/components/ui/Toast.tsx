import React, { useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { CheckCircle, Info, AlertTriangle, X } from 'lucide-react';

interface ToastProps {
    message: string;
    type?: 'success' | 'info' | 'error';
    onClose: () => void;
    duration?: number;
}

const icons = {
    success: CheckCircle,
    info: Info,
    error: AlertTriangle,
};

const borderColors = {
    success: 'border-green-500/30',
    info: 'border-white/20',
    error: 'border-red-500/30',
};

const iconColors = {
    success: 'text-green-400',
    info: 'text-white',
    error: 'text-red-400',
};

export const Toast: React.FC<ToastProps> = ({ message, type = 'info', onClose, duration = 5000 }) => {
    const Icon = icons[type];

    useEffect(() => {
        const timer = setTimeout(onClose, duration);
        return () => clearTimeout(timer);
    }, [onClose, duration]);

    return (
        <motion.div
            initial={{ opacity: 0, x: 80, scale: 0.95 }}
            animate={{ opacity: 1, x: 0, scale: 1 }}
            exit={{ opacity: 0, x: 80, scale: 0.95 }}
            transition={{ type: 'spring', stiffness: 400, damping: 30 }}
            className={`flex items-center gap-3 px-4 py-3 rounded-xl border ${borderColors[type]} bg-black/60 backdrop-blur-xl shadow-2xl max-w-sm`}
        >
            <Icon className={`w-5 h-5 shrink-0 ${iconColors[type]}`} />
            <span className="text-sm text-white/90 flex-1">{message}</span>
            <button onClick={onClose} className="text-gray-500 hover:text-white transition-colors shrink-0">
                <X className="w-4 h-4" />
            </button>
        </motion.div>
    );
};

interface ToastContainerProps {
    toasts: Array<{ id: string; message: string; type?: 'success' | 'info' | 'error' }>;
    onClose: (id: string) => void;
}

export const ToastContainer: React.FC<ToastContainerProps> = ({ toasts, onClose }) => {
    return (
        <div className="fixed top-6 right-6 z-50 flex flex-col gap-3">
            <AnimatePresence mode="popLayout">
                {toasts.map((toast) => (
                    <Toast
                        key={toast.id}
                        message={toast.message}
                        type={toast.type}
                        onClose={() => onClose(toast.id)}
                    />
                ))}
            </AnimatePresence>
        </div>
    );
};
