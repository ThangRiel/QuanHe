import React, { Component, type ReactNode } from 'react';
import { RefreshCw, RotateCcw } from 'lucide-react';

interface Props {
  children: ReactNode;
}

interface State {
  hasError: boolean;
  errorMessage: string;
}

export class ErrorBoundary extends Component<Props, State> {
  constructor(props: Props) {
    super(props);
    this.state = { hasError: false, errorMessage: '' };
  }

  static getDerivedStateFromError(error: Error): State {
    return { hasError: true, errorMessage: error.message || 'Lỗi không xác định' };
  }

  componentDidCatch(error: Error, info: React.ErrorInfo) {
    console.error('ErrorBoundary caught an error:', error, info);
  }

  handleReset = () => {
    try {
      localStorage.clear();
    } catch (e) {
      console.warn(e);
    }
    window.location.reload();
  };

  render() {
    if (this.state.hasError) {
      return (
        <div className="w-screen h-screen flex flex-col items-center justify-center bg-neutral-950 text-white p-6 text-center">
          <div className="w-16 h-16 rounded-2xl bg-rose-500/10 border border-rose-500/20 flex items-center justify-center mb-4 text-rose-400">
            <RotateCcw className="w-8 h-8" />
          </div>
          <h1 className="text-xl font-bold mb-2">Đã khôi phục trạng thái bảng trắng</h1>
          <p className="text-sm text-neutral-400 max-w-md mb-6">
            Dữ liệu cũ trước đó chưa tương thích với định dạng ô chứa tròn mới. Nhấn bên dưới để làm mới và nạp lại toàn bộ dữ liệu mẫu ban đầu:
          </p>
          <div className="flex items-center gap-3">
            <button
              type="button"
              onClick={this.handleReset}
              className="flex items-center gap-2 px-5 py-2.5 rounded-xl bg-indigo-600 hover:bg-indigo-500 text-white font-medium text-sm shadow-lg transition-colors cursor-pointer"
            >
              <RefreshCw className="w-4 h-4" />
              Nạp lại dữ liệu đầy đủ
            </button>
          </div>
        </div>
      );
    }

    return this.props.children;
  }
}
