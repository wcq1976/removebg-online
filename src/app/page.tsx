'use client';

import { useState, useCallback, useRef } from 'react';

interface ProcessingState {
  isProcessing: boolean;
  progress: number;
  status: string;
}

export default function Home() {
  const [file, setFile] = useState<File | null>(null);
  const [preview, setPreview] = useState<string | null>(null);
  const [result, setResult] = useState<string | null>(null);
  const [processing, setProcessing] = useState<ProcessingState>({
    isProcessing: false,
    progress: 0,
    status: '',
  });
  const [error, setError] = useState<string | null>(null);
  const [dragActive, setDragActive] = useState(false);
  const inputRef = useRef<HTMLInputElement>(null);

  const handleFile = useCallback((selectedFile: File) => {
    if (!selectedFile.type.startsWith('image/')) {
      setError('请上传图片文件');
      return;
    }
    if (selectedFile.size > 10 * 1024 * 1024) {
      setError('图片大小不能超过 10MB');
      return;
    }
    setError(null);
    setFile(selectedFile);
    setResult(null);
    
    const reader = new FileReader();
    reader.onload = (e) => setPreview(e.target?.result as string);
    reader.readAsDataURL(selectedFile);
  }, []);

  const handleDrag = useCallback((e: React.DragEvent) => {
    e.preventDefault();
    e.stopPropagation();
    if (e.type === 'dragenter' || e.type === 'dragover') {
      setDragActive(true);
    } else if (e.type === 'dragleave') {
      setDragActive(false);
    }
  }, []);

  const handleDrop = useCallback((e: React.DragEvent) => {
    e.preventDefault();
    e.stopPropagation();
    setDragActive(false);
    if (e.dataTransfer.files && e.dataTransfer.files[0]) {
      handleFile(e.dataTransfer.files[0]);
    }
  }, [handleFile]);

  const handleProcess = async () => {
    if (!file) return;
    
    setProcessing({
      isProcessing: true,
      progress: 0,
      status: '正在上传图片...',
    });

    const progressInterval = setInterval(() => {
      setProcessing(prev => ({
        ...prev,
        progress: Math.min(prev.progress + 10, 70),
      }));
    }, 300);

    try {
      setProcessing(prev => ({ ...prev, status: 'AI正在智能抠图...' }));
      
      const formData = new FormData();
      formData.append('image_file', file);
      
      const response = await fetch('/api/remove-bg', {
        method: 'POST',
        body: formData,
      });

      if (!response.ok) {
        throw new Error('处理失败，请重试');
      }
      
      const blob = await response.blob();
      
      clearInterval(progressInterval);
      setProcessing({ isProcessing: false, progress: 100, status: '处理完成！' });
      
      const url = URL.createObjectURL(blob);
      setResult(url);
    } catch (err) {
      clearInterval(progressInterval);
      setProcessing({ isProcessing: false, progress: 0, status: '' });
      setError('处理失败，请重试');
    }
  };

  const handleDownload = () => {
    if (!result) return;
    const a = document.createElement('a');
    a.href = result;
    a.download = `抠图-${Date.now()}.png`;
    a.click();
  };

  const handleReset = () => {
    setFile(null);
    setPreview(null);
    setResult(null);
    setProcessing({ isProcessing: false, progress: 0, status: '' });
    setError(null);
    if (inputRef.current) inputRef.current.value = '';
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-indigo-50 via-white to-purple-50">
      <div className="fixed inset-0 -z-10">
        <div className="absolute inset-0 bg-[radial-gradient(ellipse_80%_50%_at_50%_-20%,rgba(99,102,241,0.15),transparent)]" />
        <div className="absolute inset-0 bg-[radial-gradient(ellipse_60%_40%_at_80%_100%,rgba(139,92,246,0.1),transparent)]" />
      </div>

      <header className="sticky top-0 z-50 bg-white/80 backdrop-blur-xl border-b border-slate-200/50">
        <div className="max-w-lg mx-auto px-4 py-3 flex items-center justify-between">
          <div className="flex items-center gap-2">
            <div className="w-9 h-9 bg-gradient-to-br from-indigo-500 to-purple-500 rounded-xl flex items-center justify-center shadow-lg shadow-indigo-500/25">
              <span className="text-lg">✂️</span>
            </div>
            <span className="font-bold text-slate-800 text-lg">一键抠图</span>
          </div>
          <span className="px-3 py-1 bg-amber-100 text-amber-700 text-xs font-semibold rounded-full">
            完全免费
          </span>
        </div>
      </header>

      <main className="max-w-lg mx-auto px-4 py-6 space-y-6">
        <div className="text-center">
          <h1 className="text-2xl font-bold text-slate-800 mb-2">
            AI智能<span className="bg-gradient-to-r from-indigo-500 to-purple-500 bg-clip-text text-transparent">一键抠图</span>
          </h1>
          <p className="text-slate-500 text-sm">上传图片，3秒自动移除背景</p>
        </div>

        {error && (
          <div className="bg-red-50 border border-red-200 text-red-600 px-4 py-3 rounded-xl text-sm font-medium">
            {error}
          </div>
        )}

        {!result && (
          <div
            className={`bg-white rounded-2xl shadow-xl shadow-slate-200/50 p-8 transition-all duration-300 ${
              dragActive ? 'ring-2 ring-indigo-500 scale-[1.02]' : ''
            }`}
            onDragEnter={handleDrag}
            onDragLeave={handleDrag}
            onDragOver={handleDrag}
            onDrop={handleDrop}
          >
            {preview && !processing.isProcessing ? (
              <div className="space-y-4">
                <div className="aspect-square relative rounded-xl overflow-hidden bg-slate-100">
                  <img src={preview} alt="Preview" className="w-full h-full object-contain" />
                </div>
                <div className="flex gap-3">
                  <button
                    onClick={handleProcess}
                    className="flex-1 py-3 bg-gradient-to-r from-indigo-500 to-purple-500 text-white font-semibold rounded-xl shadow-lg shadow-indigo-500/30 hover:shadow-xl hover:scale-[1.02] transition-all"
                  >
                    开始处理
                  </button>
                  <button
                    onClick={handleReset}
                    className="px-4 py-3 bg-slate-100 text-slate-600 font-medium rounded-xl hover:bg-slate-200 transition-colors"
                  >
                    重新选择
                  </button>
                </div>
              </div>
            ) : (
              <div className="text-center cursor-pointer" onClick={() => inputRef.current?.click()}>
                <input
                  ref={inputRef}
                  type="file"
                  accept="image/*"
                  className="hidden"
                  onChange={(e) => e.target.files?.[0] && handleFile(e.target.files[0])}
                />
                <div className="w-20 h-20 mx-auto mb-4 bg-gradient-to-br from-indigo-100 to-purple-100 rounded-2xl flex items-center justify-center">
                  <span className="text-4xl">📤</span>
                </div>
                <h3 className="font-semibold text-slate-800 mb-1">点击上传图片</h3>
                <p className="text-slate-400 text-sm">
                  或 <span className="text-indigo-500 font-medium">拖拽文件到这里</span>
                </p>
                <p className="text-slate-300 text-xs mt-3">支持 JPG、PNG、WebP，最大 10MB</p>
              </div>
            )}
          </div>
        )}

        {processing.isProcessing && (
          <div className="bg-white rounded-2xl shadow-xl shadow-slate-200/50 p-8 text-center">
            <div className="w-16 h-16 mx-auto mb-4 border-4 border-slate-100 border-t-indigo-500 rounded-full animate-spin" />
            <h3 className="font-semibold text-slate-800 mb-2">AI正在智能抠图</h3>
            <p className="text-slate-400 text-sm mb-4">预计需要 3-5 秒</p>
            <div className="h-2 bg-slate-100 rounded-full overflow-hidden">
              <div
                className="h-full bg-gradient-to-r from-indigo-500 to-purple-500 transition-all duration-300"
                style={{ width: `${processing.progress}%` }}
              />
            </div>
          </div>
        )}

        {result && (
          <div className="bg-white rounded-2xl shadow-xl shadow-slate-200/50 overflow-hidden">
            <div className="px-4 py-3 border-b border-slate-100 flex items-center justify-between">
              <h3 className="font-semibold text-slate-800 flex items-center gap-2">
                <span className="w-5 h-5 bg-green-500 text-white rounded-full flex items-center justify-center text-xs">✓</span>
                处理完成
              </h3>
            </div>
            <div className="aspect-square relative bg-[url('data:image/svg+xml,%3Csvg%20xmlns%3D%22http%3A%2F%2Fwww.w3.org%2F2000%2Fsvg%22%20width%3D%2220%22%20height%3D%2220%22%3E%3Crect%20width%3D%2220%22%20height%3D%2220%22%20fill%3D%22%23f1f5f9%22%2F%3E%3Cpath%20d%3D%22M0%200h20v20H0z%22%20fill%3D%22transparent%22%2F%3E%3C%2Fsvg%3E')]">
              <img src={result} alt="Result" className="w-full h-full object-contain" />
            </div>
            <div className="p-4 flex gap-3">
              <button
                onClick={handleReset}
                className="flex-1 py-3 bg-slate-100 text-slate-600 font-semibold rounded-xl hover:bg-slate-200 transition-colors"
              >
                🔄 重新处理
              </button>
              <button
                onClick={handleDownload}
                className="flex-1 py-3 bg-gradient-to-r from-indigo-500 to-purple-500 text-white font-semibold rounded-xl shadow-lg shadow-indigo-500/30 hover:shadow-xl hover:scale-[1.02] transition-all"
              >
                ⬇️ 保存图片
              </button>
            </div>
          </div>
        )}

        <div className="grid grid-cols-3 gap-3">
          {[
            { icon: '⚡', title: '3秒出结果', desc: 'AI快速精准' },
            { icon: '🎯', title: '发丝级精度', desc: '边缘清晰' },
            { icon: '💯', title: '完全免费', desc: '无需注册' },
          ].map((feature, i) => (
            <div key={i} className="bg-white/60 backdrop-blur-sm rounded-xl p-4 text-center">
              <div className="text-2xl mb-2">{feature.icon}</div>
              <div className="font-semibold text-slate-700 text-sm">{feature.title}</div>
              <div className="text-slate-400 text-xs">{feature.desc}</div>
            </div>
          ))}
        </div>

        <footer className="text-center text-slate-400 text-xs py-4">
          <p>© 2026 一键抠图 | 免费在线图片背景移除</p>
        </footer>
      </main>
    </div>
  );
}
