import { useState, useEffect } from 'react';

const CORRECT_ID   = 'sugita';
const CORRECT_PASS = 'densen2026';
const STORAGE_KEY  = 's_auth_v1';

export default function AuthGate({ children }) {
  const [authed, setAuthed]   = useState(false);
  const [id, setId]           = useState('');
  const [pass, setPass]       = useState('');
  const [error, setError]     = useState(false);
  const [checking, setChecking] = useState(true);

  useEffect(() => {
    // セッション中に一度認証済みなら再表示しない
    const ok = sessionStorage.getItem(STORAGE_KEY);
    if (ok === '1') setAuthed(true);
    setChecking(false);
  }, []);

  const handleSubmit = (e) => {
    e.preventDefault();
    if (id.trim() === CORRECT_ID && pass === CORRECT_PASS) {
      sessionStorage.setItem(STORAGE_KEY, '1');
      setAuthed(true);
      setError(false);
    } else {
      setError(true);
      setPass('');
    }
  };

  if (checking) return null;
  if (authed)   return children;

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-800 to-blue-900 flex items-center justify-center p-4">
      <div className="bg-white rounded-2xl shadow-2xl w-full max-w-sm p-8">
        {/* ロゴ */}
        <div className="flex items-center justify-center gap-3 mb-8">
          <div className="w-12 h-12 bg-blue-700 rounded-xl flex items-center justify-center text-white font-bold text-xl shadow">
            S
          </div>
          <div>
            <div className="text-lg font-bold text-slate-800">杉田電線</div>
            <div className="text-xs text-slate-500">基幹管理システム</div>
          </div>
        </div>

        <h2 className="text-center text-sm font-medium text-slate-600 mb-6">
          ご利用にはログインが必要です
        </h2>

        <form onSubmit={handleSubmit} className="space-y-4">
          <div>
            <label className="block text-xs font-medium text-slate-600 mb-1">
              ユーザーID
            </label>
            <input
              type="text"
              autoComplete="username"
              className={`w-full border rounded-lg px-3 py-2.5 text-sm focus:outline-none focus:ring-2
                ${error ? 'border-red-300 focus:ring-red-300' : 'border-slate-300 focus:ring-blue-400'}`}
              placeholder="IDを入力"
              value={id}
              onChange={e => { setId(e.target.value); setError(false); }}
            />
          </div>
          <div>
            <label className="block text-xs font-medium text-slate-600 mb-1">
              パスワード
            </label>
            <input
              type="password"
              autoComplete="current-password"
              className={`w-full border rounded-lg px-3 py-2.5 text-sm focus:outline-none focus:ring-2
                ${error ? 'border-red-300 focus:ring-red-300' : 'border-slate-300 focus:ring-blue-400'}`}
              placeholder="パスワードを入力"
              value={pass}
              onChange={e => { setPass(e.target.value); setError(false); }}
            />
          </div>

          {error && (
            <div className="text-xs text-red-600 bg-red-50 border border-red-200 rounded-lg px-3 py-2 text-center">
              IDまたはパスワードが正しくありません
            </div>
          )}

          <button
            type="submit"
            className="w-full bg-blue-700 hover:bg-blue-800 text-white font-semibold py-2.5 rounded-lg transition-colors text-sm mt-2"
          >
            ログイン
          </button>
        </form>

        <p className="text-center text-xs text-slate-400 mt-6">
          デモ版 — 2026-05-21
        </p>
      </div>
    </div>
  );
}
