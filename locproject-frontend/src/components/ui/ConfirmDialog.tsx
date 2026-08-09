'use client';

interface ConfirmDialogProps {
    open: boolean;
    title: string;
    message: string;
    confirmLabel?: string;
    isPending?: boolean;
    onConfirm: () => void;
    onCancel: () => void;
}

export default function ConfirmDialog({
    open,
    title,
    message,
    confirmLabel = 'Xác nhận xoá',
    isPending = false,
    onConfirm,
    onCancel,
}: ConfirmDialogProps) {
    if (!open) return null;

    return (
        <div className="fixed inset-0 z-[90] flex items-center justify-center bg-black/40 p-4">
            <div className="bg-white rounded-2xl shadow-2xl max-w-md w-full p-6 space-y-4">
                <div className="flex items-start gap-3">
                    <div className="w-10 h-10 rounded-full bg-error-container/20 flex items-center justify-center flex-shrink-0">
                        <span className="material-symbols-outlined text-error">warning</span>
                    </div>
                    <div>
                        <h3 className="font-label-bold text-label-bold text-primary">{title}</h3>
                        <p className="text-sm text-on-surface-variant mt-1">{message}</p>
                    </div>
                </div>
                <div className="flex justify-end gap-2 pt-2">
                    <button
                        type="button"
                        onClick={onCancel}
                        disabled={isPending}
                        className="px-4 py-2 rounded-lg border border-outline-variant text-sm font-bold text-on-surface-variant hover:bg-surface-container-low transition-colors disabled:opacity-50"
                    >
                        Huỷ
                    </button>
                    <button
                        type="button"
                        onClick={onConfirm}
                        disabled={isPending}
                        className="px-4 py-2 rounded-lg bg-error text-white text-sm font-bold hover:opacity-90 transition-opacity disabled:opacity-50 inline-flex items-center gap-1.5"
                    >
                        {isPending && (
                            <span className="material-symbols-outlined text-[16px] animate-spin">progress_activity</span>
                        )}
                        {confirmLabel}
                    </button>
                </div>
            </div>
        </div>
    );
}