'use client';

import { Component, ReactNode } from 'react';

interface ErrorFallbackProps {
    error: Error;
    resetErrorBoundary: () => void;
    children?: ReactNode;
}

export default class ErrorFallback extends Component<ErrorFallbackProps> {
    render() {
        const { error, resetErrorBoundary } = this.props;

        return (
            <div className="flex flex-col items-center justify-center min-h-[400px] p-8 text-center">
                <span className="material-symbols-outlined text-[48px] text-error mb-4">error</span>
                <h2 className="font-headline-md text-headline-md text-primary mb-2">Đã xảy ra lỗi</h2>
                <p className="text-body-sm text-on-surface-variant mb-6 max-w-md">
                    {error.message || 'Không thể tải dữ liệu. Vui lòng thử lại sau.'}
                </p>
                <button
                    type="button"
                    onClick={resetErrorBoundary}
                    className="px-6 py-3 bg-primary text-white rounded-lg font-label-bold hover:bg-primary-container transition-colors active:scale-95"
                >
                    Thử lại
                </button>
            </div>
        );
    }
}