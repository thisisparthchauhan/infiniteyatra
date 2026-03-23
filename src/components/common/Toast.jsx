import React, { useState, useEffect, useCallback, createContext, useContext } from 'react';
import { CheckCircle2, AlertTriangle, XCircle, Info, X } from 'lucide-react';

const ToastContext = createContext(null);

const ICONS = {
    success: CheckCircle2,
    warning: AlertTriangle,
    error: XCircle,
    info: Info
};

const COLORS = {
    success: 'border-green-500/30 bg-green-500/10 text-green-400',
    warning: 'border-yellow-500/30 bg-yellow-500/10 text-yellow-400',
    error: 'border-red-500/30 bg-red-500/10 text-red-400',
    info: 'border-blue-500/30 bg-blue-500/10 text-blue-400'
};

const Toast = ({ toast, onDismiss }) => {
    const [exiting, setExiting] = useState(false);
    const Icon = ICONS[toast.type] || Info;

    useEffect(() => {
        const timer = setTimeout(() => {
            setExiting(true);
            setTimeout(() => onDismiss(toast.id), 300);
        }, toast.duration || 4000);
        return () => clearTimeout(timer);
    }, [toast, onDismiss]);

    return (
        <div className={`flex items-start gap-3 px-4 py-3 rounded-xl border backdrop-blur-xl shadow-2xl max-w-sm transition-all duration-300 ${COLORS[toast.type]} ${exiting ? 'opacity-0 translate-x-8' : 'opacity-100 translate-x-0'}`}>
            <Icon size={18} className="mt-0.5 shrink-0" />
            <div className="flex-1 min-w-0">
                <p className="text-sm font-medium text-white">{toast.message}</p>
                {toast.action && (
                    <button onClick={toast.action.onClick} className="text-xs font-bold underline underline-offset-2 mt-1 hover:opacity-80">
                        {toast.action.label}
                    </button>
                )}
            </div>
            <button onClick={() => { setExiting(true); setTimeout(() => onDismiss(toast.id), 300); }} className="p-0.5 hover:bg-white/10 rounded shrink-0">
                <X size={14} className="text-zinc-500" />
            </button>
        </div>
    );
};

export const ToastProvider = ({ children }) => {
    const [toasts, setToasts] = useState([]);

    const showToast = useCallback(({ type = 'info', message, action, duration }) => {
        const id = Date.now() + Math.random();
        setToasts(prev => [...prev, { id, type, message, action, duration }]);
    }, []);

    const dismiss = useCallback((id) => {
        setToasts(prev => prev.filter(t => t.id !== id));
    }, []);

    return (
        <ToastContext.Provider value={{ showToast }}>
            {children}
            {/* Toast Container */}
            <div className="fixed bottom-4 right-4 z-[100] flex flex-col-reverse gap-2">
                {toasts.map(t => (
                    <Toast key={t.id} toast={t} onDismiss={dismiss} />
                ))}
            </div>
        </ToastContext.Provider>
    );
};

export const useToast = () => {
    const ctx = useContext(ToastContext);
    if (!ctx) throw new Error('useToast must be used within ToastProvider');
    return ctx;
};
