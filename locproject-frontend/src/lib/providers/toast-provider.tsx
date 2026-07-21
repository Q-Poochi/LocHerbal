'use client';

import { createContext, useContext, useState, useCallback, ReactNode } from 'react';

type ToastType = 'success' | 'error' | 'info';

interface Toast {
    id: number;
    message: string;
    type: ToastType;
}

interface ToastContextValue {
    toast: (message: string, type?: ToastType) => void;
    success: (message: string) => void;
    error: (message: string) => void;
}

const ToastContext = createContext<ToastContextValue | undefined>(undefined);

export function ToastProvider({ children }: { children: ReactNode }) {
    const [toasts, setToasts] = useState<Toast[]>([]);

    const remove = useCallback((id: number) => {
        setToasts((prev) => prev.filter((t) => t.id !== id));
    }, []);

    const toast = useCallback(
        (message: string, type: ToastType = 'info') => {
            const id = Date.now() + Math.random();
            setToasts((prev) => [...prev, { id, message, type }]);
            setTimeout(() => remove(id), 3000);
        },
        [remove],
    );

    const success = useCallback((m: string) => toast(m, 'success'), [toast]);
    const error = useCallback((m: string) => toast(m, 'error'), [toast]);

    return (
        <ToastContext.Provider value={{ toast, success, error }}>
            {children}
            <div className="fixed bottom-20 md:bottom-6 right-4 z-[100] flex flex-col gap-2 w-[calc(100%-2rem)] max-w-sm">
                {toasts.map((t) => (
                    <div
                        key={t.id}
                        className={`flex items-center gap-2 px-4 py-3 rounded-lg shadow-lg text-body-md font-medium animate-[fadeIn_0.2s_ease-out] ${t.type === 'success'
                                ? 'bg-success-leaf text-on-primary'
                                : t.type === 'error'
                                    ? 'bg-error-container text-on-error-container'
                                    : 'bg-surface-white text-primary border border-outline-variant'
                            }`}
                    >
                        <span className="material-symbols-outlined text-[20px]">
                            {t.type === 'success' ? 'check_circle' : t.type === 'error' ? 'error' : 'info'}
                        </span>
                        <span>{t.message}</span>
                    </div>
                ))}
            </div>
        </ToastContext.Provider>
    );
}

export function useToast(): ToastContextValue {
    const ctx = useContext(ToastContext);
    if (!ctx) {
        // Fallback no-op để tránh crash nếu dùng ngoài provider
        return { toast: () => { }, success: () => { }, error: () => { } };
    }
    return ctx;
}