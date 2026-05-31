import React, { useState, createContext, useContext } from 'react';
import { X, CheckCircle, Info, AlertTriangle, AlertCircle } from 'lucide-react';

const ToastContext = createContext();

export const useToast = () => useContext(ToastContext);

export const ToastProvider = ({ children }) => {
    const [toasts, setToasts] = useState([]);

    const addToast = (message, type = 'success', duration = 3000) => {
        const id = Date.now();
        setToasts(prev => [...prev, { id, message, type }]);

        if (duration) {
            setTimeout(() => {
                removeToast(id);
            }, duration);
        }
    };

    const removeToast = (id) => {
        setToasts(prev => prev.filter(toast => toast.id !== id));
    };

    return (
        <ToastContext.Provider value={{ addToast, removeToast }}>
            {children}
            <div className="fixed bottom-6 right-6 z-[100] flex flex-col gap-3">
                {toasts.map(toast => (
                    <div
                        key={toast.id}
                        className={`
                            flex items-center gap-3 px-4 py-3 rounded-xl shadow-lg min-w-[280px] max-w-sm
                            transform transition-all duration-300 animate-slide-in-right
                            ${toast.type === 'success' ? 'bg-[#0f2a1a] text-green-100 border border-green-500/40 border-l-4 border-l-green-500' : ''}
                            ${toast.type === 'error' ? 'bg-[#2a0f0f] text-red-100 border border-red-500/40 border-l-4 border-l-red-500' : ''}
                            ${toast.type === 'warning' ? 'bg-[#2a220a] text-yellow-100 border border-yellow-500/40 border-l-4 border-l-yellow-400' : ''}
                            ${toast.type === 'info' ? 'bg-[#0f1a2a] text-blue-100 border border-blue-500/40 border-l-4 border-l-blue-500' : ''}
                        `}
                    >
                        {toast.type === 'success' && <CheckCircle size={20} className="text-green-400 flex-shrink-0" />}
                        {toast.type === 'error' && <AlertTriangle size={20} className="text-red-400 flex-shrink-0" />}
                        {toast.type === 'warning' && <AlertCircle size={20} className="text-yellow-400 flex-shrink-0" />}
                        {toast.type === 'info' && <Info size={20} className="text-blue-400 flex-shrink-0" />}

                        <p className="font-medium text-sm flex-1">{toast.message}</p>

                        <button
                            onClick={() => removeToast(toast.id)}
                            className="ml-2 opacity-60 hover:opacity-100 flex-shrink-0"
                        >
                            <X size={16} />
                        </button>
                    </div>
                ))}
            </div>
            <style>{`
                @keyframes slide-in-right {
                    from { transform: translateX(100%); opacity: 0; }
                    to { transform: translateX(0); opacity: 1; }
                }
                .animate-slide-in-right {
                    animation: slide-in-right 0.3s ease-out forwards;
                }
            `}</style>
        </ToastContext.Provider>
    );
};
