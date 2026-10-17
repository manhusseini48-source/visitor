import React, { Component, ErrorInfo, ReactNode } from 'react';
import { AlertTriangle, RefreshCw, ArrowRight } from 'lucide-react';

interface Props {
  children: ReactNode;
  fallbackMessage?: string;
  inline?: boolean;
  onReset?: () => void;
}

interface State {
  hasError: boolean;
  error: Error | null;
}

export class ErrorBoundary extends Component<Props, State> {
  public state: State = {
    hasError: false,
    error: null,
  };

  public static getDerivedStateFromError(error: Error): State {
    return { hasError: true, error };
  }

  public componentDidCatch(error: Error, errorInfo: ErrorInfo) {
    console.error('ErrorBoundary caught an error:', error, errorInfo);
  }

  private handleReset = () => {
    this.setState({ hasError: false, error: null });
    if (this.props.onReset) {
      this.props.onReset();
    } else {
      try {
        localStorage.setItem('visitor_app_active_tab', 'dashboard');
      } catch {}
    }
  };

  public render() {
    if (this.state.hasError) {
      if (this.props.inline) {
        return (
          <div className="bg-white border border-rose-200 rounded-3xl p-6 text-center space-y-4 shadow-sm my-4" dir="rtl">
            <div className="w-12 h-12 bg-rose-50 text-rose-600 rounded-2xl mx-auto flex items-center justify-center">
              <AlertTriangle className="w-6 h-6" />
            </div>
            <div>
              <h3 className="text-sm font-black text-slate-800">
                {this.props.fallbackMessage || 'خطا در بارگذاری اطلاعات این بخش'}
              </h3>
              <p className="text-xs text-slate-500 mt-1 max-w-md mx-auto">
                اطلاعات پایگاه داده و حساب شما کاملاً امن است. برای بازیابی این صفحه دکمه زیر را لمس نمایید.
              </p>
            </div>
            <div className="flex items-center justify-center gap-3">
              <button
                type="button"
                onClick={this.handleReset}
                className="px-4 py-2 bg-sky-600 hover:bg-sky-500 text-white font-bold text-xs rounded-xl transition flex items-center gap-2 cursor-pointer shadow-sm"
              >
                <RefreshCw className="w-3.5 h-3.5" />
                <span>تلاش مجدد</span>
              </button>
            </div>
          </div>
        );
      }

      return (
        <div className="min-h-screen bg-slate-900 text-white flex items-center justify-center p-4" dir="rtl">
          <div className="bg-slate-800 border border-slate-700 rounded-3xl p-6 md:p-8 max-w-md w-full text-center space-y-4 shadow-2xl">
            <div className="w-16 h-16 bg-amber-500/20 text-amber-400 rounded-2xl mx-auto flex items-center justify-center">
              <AlertTriangle className="w-8 h-8" />
            </div>
            <h2 className="text-xl font-black">خطایی در نمایش بخش رخ داد</h2>
            <p className="text-xs text-slate-400 leading-relaxed">
              اطلاعات شما در حافظه ذخیره است و از دست نرفته است. لطفاً دکمه زیر را برای بازیابی لمس نمایید.
            </p>
            <button
              type="button"
              onClick={this.handleReset}
              className="w-full py-3 bg-sky-600 hover:bg-sky-500 text-white font-bold text-sm rounded-xl transition flex items-center justify-center gap-2 cursor-pointer shadow-lg shadow-sky-600/30"
            >
              <RefreshCw className="w-4 h-4" />
              <span>بارگذاری مجدد سیستم</span>
            </button>
          </div>
        </div>
      );
    }

    return this.props.children;
  }
}
