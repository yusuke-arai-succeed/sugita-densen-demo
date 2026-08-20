import { useRef, useState, useEffect, useCallback } from 'react';

/**
 * 汎用バーコード/QRスキャナーモーダル
 * - カメラ: BarcodeDetector API (Chrome/Edge/Safari17.4+)
 * - HIDスキャナー: テキスト入力欄にスキャン → Enter
 * - 手入力: フォールバック
 *
 * Props:
 *   onScan(value: string)  — 読取値を受け取るコールバック
 *   onClose()              — 閉じる
 *   title?: string         — モーダルタイトル
 *   hint?: string          — サブタイトル（対象コードの説明など）
 */
export default function ScannerModal({ onScan, onClose, title = 'バーコード / QRスキャン', hint = '' }) {
  const videoRef   = useRef(null);
  const streamRef  = useRef(null);
  const detectorRef = useRef(null);
  const rafRef     = useRef(null);
  const inputRef   = useRef(null);

  const [camStatus, setCamStatus] = useState('starting'); // starting | active | no-cam | error
  const [detected, setDetected]   = useState(null);
  const [manualVal, setManualVal] = useState('');

  const hasBD = typeof BarcodeDetector !== 'undefined';

  const stopStream = useCallback(() => {
    if (rafRef.current) { cancelAnimationFrame(rafRef.current); rafRef.current = null; }
    if (streamRef.current) {
      streamRef.current.getTracks().forEach(t => t.stop());
      streamRef.current = null;
    }
  }, []);

  const detectLoop = useCallback(async (video) => {
    if (!detectorRef.current) return;
    if (video.readyState < 2) {
      rafRef.current = requestAnimationFrame(() => detectLoop(video));
      return;
    }
    try {
      const codes = await detectorRef.current.detect(video);
      if (codes.length > 0) {
        setDetected(codes[0].rawValue);
        stopStream();
        return;
      }
    } catch {}
    rafRef.current = requestAnimationFrame(() => detectLoop(video));
  }, [stopStream]);

  useEffect(() => {
    if (!navigator.mediaDevices?.getUserMedia) {
      setCamStatus('no-cam');
      setTimeout(() => inputRef.current?.focus(), 100);
      return;
    }
    navigator.mediaDevices.getUserMedia({
      video: { facingMode: 'environment', width: { ideal: 1280 } }
    }).then(stream => {
      streamRef.current = stream;
      videoRef.current.srcObject = stream;
      return videoRef.current.play();
    }).then(() => {
      setCamStatus('active');
      if (hasBD) {
        detectorRef.current = new BarcodeDetector({
          formats: ['qr_code', 'code_128', 'code_39', 'ean_13', 'ean_8', 'data_matrix', 'code_93'],
        });
        detectLoop(videoRef.current);
      }
    }).catch(() => {
      setCamStatus('error');
      setTimeout(() => inputRef.current?.focus(), 100);
    });
    return () => stopStream();
  }, []);

  const handleManualSubmit = () => {
    const v = manualVal.trim();
    if (!v) return;
    setDetected(v);
    stopStream();
  };

  const handleUse = () => {
    if (detected) { onScan(detected); onClose(); }
  };

  const handleRetry = () => {
    setDetected(null);
    setManualVal('');
    setCamStatus('starting');
    stopStream();
    navigator.mediaDevices?.getUserMedia({ video: { facingMode: 'environment' } })
      .then(stream => {
        streamRef.current = stream;
        videoRef.current.srcObject = stream;
        return videoRef.current.play();
      }).then(() => {
        setCamStatus('active');
        if (hasBD && detectorRef.current) detectLoop(videoRef.current);
      }).catch(() => setCamStatus('error'));
  };

  return (
    <div className="fixed inset-0 z-[60] flex items-end sm:items-center justify-center bg-black/70 p-0 sm:p-4">
      <div className="bg-white rounded-t-2xl sm:rounded-2xl shadow-2xl w-full sm:max-w-md overflow-hidden">

        {/* ヘッダー */}
        <div className="flex items-center justify-between px-5 py-4 border-b border-slate-100">
          <div>
            <h3 className="font-bold text-slate-800">📷 {title}</h3>
            {hint && <p className="text-xs text-slate-400 mt-0.5">{hint}</p>}
          </div>
          <button onClick={() => { stopStream(); onClose(); }}
            className="w-8 h-8 flex items-center justify-center rounded-full hover:bg-slate-100 text-slate-500 text-xl leading-none">
            ✕
          </button>
        </div>

        {/* カメラビュー */}
        <div className="relative bg-slate-900 overflow-hidden" style={{ height: '220px' }}>
          <video ref={videoRef} className="w-full h-full object-cover" playsInline muted />

          {/* 読取フレーム */}
          {camStatus === 'active' && !detected && (
            <div className="absolute inset-0 flex flex-col items-center justify-center pointer-events-none">
              <div className="relative w-52 h-36">
                <div className="absolute inset-0 border border-white/20 rounded-lg" />
                <span className="absolute top-0 left-0 w-6 h-6 border-t-[3px] border-l-[3px] border-white rounded-tl" />
                <span className="absolute top-0 right-0 w-6 h-6 border-t-[3px] border-r-[3px] border-white rounded-tr" />
                <span className="absolute bottom-0 left-0 w-6 h-6 border-b-[3px] border-l-[3px] border-white rounded-bl" />
                <span className="absolute bottom-0 right-0 w-6 h-6 border-b-[3px] border-r-[3px] border-white rounded-br" />
                <div className="absolute inset-x-2 top-1/2 h-0.5 bg-blue-400/80 rounded animate-pulse" />
              </div>
              <p className="mt-3 text-white/70 text-xs">
                {hasBD ? 'バーコードを枠内に合わせてください' : '※ このブラウザはカメラ自動検知未対応'}
              </p>
            </div>
          )}

          {camStatus === 'starting' && (
            <div className="absolute inset-0 flex items-center justify-center">
              <span className="text-white/60 text-sm">カメラ起動中...</span>
            </div>
          )}

          {(camStatus === 'no-cam' || camStatus === 'error') && (
            <div className="absolute inset-0 flex flex-col items-center justify-center gap-2">
              <span className="text-4xl">📷</span>
              <span className="text-white/60 text-xs text-center px-6">
                {camStatus === 'no-cam' ? 'カメラが見つかりません' : 'カメラにアクセスできませんでした'}
                <br />下の入力欄をご利用ください
              </span>
            </div>
          )}

          {detected && (
            <div className="absolute inset-0 bg-black/60 flex items-center justify-center">
              <div className="bg-white rounded-xl px-6 py-5 text-center shadow-xl mx-4 max-w-xs w-full">
                <div className="text-green-500 text-4xl mb-2">✓</div>
                <div className="text-xs text-slate-400 mb-1">スキャン完了</div>
                <div className="font-mono font-bold text-slate-800 break-all">{detected}</div>
              </div>
            </div>
          )}
        </div>

        {/* HIDスキャナー / 手入力 */}
        <div className="px-5 py-4 space-y-2">
          <div className="text-xs text-slate-400 font-medium">ハンディスキャナ（BT/USB接続）または手入力</div>
          <div className="flex gap-2">
            <input
              ref={inputRef}
              value={manualVal}
              onChange={e => setManualVal(e.target.value)}
              onKeyDown={e => e.key === 'Enter' && handleManualSubmit()}
              placeholder="スキャン入力 または 手入力 → Enter"
              className="flex-1 border border-slate-200 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-blue-300 font-mono"
            />
            <button onClick={handleManualSubmit} className="btn-primary text-sm px-4 whitespace-nowrap">確定</button>
          </div>
        </div>

        {/* 確認ボタン */}
        {detected && (
          <div className="px-5 pb-5 flex gap-2">
            <button onClick={handleRetry} className="flex-1 btn-secondary text-sm">再スキャン</button>
            <button onClick={handleUse} className="flex-1 btn-primary text-sm">この値を使用</button>
          </div>
        )}
      </div>
    </div>
  );
}
