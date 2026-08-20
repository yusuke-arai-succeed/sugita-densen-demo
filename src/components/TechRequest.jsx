import { useState } from 'react';
import { useApp } from '../context/AppContext';

const STATUSES = ['未着手', '対応中', '完了'];
const STATUS_COLORS = {
  '未着手': 'bg-slate-100 text-slate-600',
  '対応中': 'bg-blue-100 text-blue-700',
  '完了':   'bg-green-100 text-green-700',
};
const CATEGORIES = ['設計書作成', '仕様確認', '試作・サンプル対応', '規格・認証調査', '客先図面対応', '設計変更', 'その他'];
const TODAY = '2026-05-21';

function isOverdue(req) {
  return req.desiredDate && req.desiredDate < TODAY && req.status !== '完了';
}
function daysUntil(date) {
  const diff = Math.ceil((new Date(date) - new Date(TODAY)) / 86400000);
  return diff;
}

// ── 依頼フォームモーダル ────────────────────────────────────────────
function RequestModal({ initial, onClose, onSave }) {
  const { customers } = useApp();
  const blank = {
    requester: '細野', category: '設計書作成', title: '', details: '',
    desiredDate: '', customerCode: '', customerName: '', productName: '',
    specNumber: '', priority: '通常', assignee: '', status: '未着手', remarks: '',
  };
  const [form, setForm] = useState(initial || blank);
  const set = (k, v) => setForm(f => ({ ...f, [k]: v }));

  const handleCustomer = (code) => {
    const c = customers.find(c => c.code === code);
    set('customerCode', code);
    if (c) set('customerName', c.name);
  };

  const valid = form.title && form.desiredDate && form.requester;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 p-4"
      onMouseDown={e => { if (e.target === e.currentTarget) onClose(); }}>
      <div className="bg-white rounded-xl shadow-2xl w-full max-w-xl max-h-[90vh] flex flex-col">
        <div className="px-6 py-4 border-b border-slate-200 flex items-center justify-between flex-shrink-0">
          <h3 className="font-bold text-slate-800">{initial ? '依頼を編集' : '技術依頼 新規登録'}</h3>
          <button onClick={onClose} className="text-slate-400 hover:text-slate-600 text-xl leading-none">✕</button>
        </div>
        <div className="overflow-y-auto flex-1 px-6 py-4 space-y-4">
          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="block text-xs font-medium text-slate-600 mb-1">依頼者 <span className="text-red-500">*</span></label>
              <input className="input-field" value={form.requester} onChange={e => set('requester', e.target.value)} placeholder="氏名" />
            </div>
            <div>
              <label className="block text-xs font-medium text-slate-600 mb-1">分類</label>
              <select className="select-field" value={form.category} onChange={e => set('category', e.target.value)}>
                {CATEGORIES.map(c => <option key={c}>{c}</option>)}
              </select>
            </div>
            <div className="col-span-2">
              <label className="block text-xs font-medium text-slate-600 mb-1">依頼タイトル <span className="text-red-500">*</span></label>
              <input className="input-field" value={form.title} onChange={e => set('title', e.target.value)} placeholder="例：新規製品 CV-5.5-3C 設計書作成依頼" />
            </div>
          </div>

          <div>
            <label className="block text-xs font-medium text-slate-600 mb-1">依頼内容・要件</label>
            <textarea className="input-field w-full resize-none" rows={3} value={form.details} onChange={e => set('details', e.target.value)} placeholder="詳細な要件・仕様を記入してください" />
          </div>

          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="block text-xs font-medium text-slate-600 mb-1">配布希望日 <span className="text-red-500">*</span></label>
              <input type="date" className="input-field" value={form.desiredDate} onChange={e => set('desiredDate', e.target.value)} />
            </div>
            <div>
              <label className="block text-xs font-medium text-slate-600 mb-1">優先度</label>
              <select className="select-field" value={form.priority} onChange={e => set('priority', e.target.value)}>
                {['低', '通常', '高', '緊急'].map(p => <option key={p}>{p}</option>)}
              </select>
            </div>
            <div>
              <label className="block text-xs font-medium text-slate-600 mb-1">得意先コード</label>
              <input className="input-field" value={form.customerCode} onChange={e => handleCustomer(e.target.value)} placeholder="例: C001" />
            </div>
            <div>
              <label className="block text-xs font-medium text-slate-600 mb-1">得意先名</label>
              <input className="input-field" value={form.customerName} onChange={e => set('customerName', e.target.value)} placeholder="コード入力で自動表示" />
            </div>
            <div>
              <label className="block text-xs font-medium text-slate-600 mb-1">品名</label>
              <input className="input-field" value={form.productName} onChange={e => set('productName', e.target.value)} />
            </div>
            <div>
              <label className="block text-xs font-medium text-slate-600 mb-1">客先仕様書番号</label>
              <input className="input-field" value={form.specNumber} onChange={e => set('specNumber', e.target.value)} placeholder="例: SPEC-2026-0042" />
            </div>
            <div>
              <label className="block text-xs font-medium text-slate-600 mb-1">担当者（技術）</label>
              <input className="input-field" value={form.assignee} onChange={e => set('assignee', e.target.value)} placeholder="技術担当者名" />
            </div>
            <div>
              <label className="block text-xs font-medium text-slate-600 mb-1">ステータス</label>
              <select className="select-field" value={form.status} onChange={e => set('status', e.target.value)}>
                {STATUSES.map(s => <option key={s}>{s}</option>)}
              </select>
            </div>
          </div>

          <div>
            <label className="block text-xs font-medium text-slate-600 mb-1">備考</label>
            <textarea className="input-field w-full resize-none" rows={2} value={form.remarks} onChange={e => set('remarks', e.target.value)} />
          </div>
        </div>
        <div className="px-6 py-4 border-t border-slate-200 flex justify-end gap-3 flex-shrink-0">
          <button onClick={onClose} className="btn-secondary">キャンセル</button>
          <button disabled={!valid} onClick={() => { onSave(form); onClose(); }}
            className="btn-primary disabled:opacity-40 disabled:cursor-not-allowed">
            {initial ? '更新' : '登録'}
          </button>
        </div>
      </div>
    </div>
  );
}

// ── メイン画面 ───────────────────────────────────────────────────────
export default function TechRequest() {
  const { techRequests, setTechRequests } = useApp();
  const [filterStatus, setFilterStatus] = useState('');
  const [filterSearch, setFilterSearch] = useState('');
  const [showModal, setShowModal] = useState(false);
  const [editTarget, setEditTarget] = useState(null);

  const overdue = techRequests.filter(isOverdue);

  const filtered = techRequests.filter(r => {
    if (filterStatus && r.status !== filterStatus) return false;
    if (filterSearch) {
      const q = filterSearch.toLowerCase();
      if (!r.title.toLowerCase().includes(q) &&
          !r.customerName?.toLowerCase().includes(q) &&
          !r.requester?.toLowerCase().includes(q)) return false;
    }
    return true;
  });

  const active = filtered.filter(r => r.status !== '完了');
  const done   = filtered.filter(r => r.status === '完了');

  const handleSave = (form) => {
    if (editTarget) {
      setTechRequests(rs => rs.map(r => r.id === editTarget.id ? { ...r, ...form } : r));
    } else {
      setTechRequests(rs => [{
        ...form,
        id: `TR-${String(rs.length + 1).padStart(3, '0')}`,
        createdAt: TODAY,
      }, ...rs]);
    }
    setEditTarget(null);
  };

  const handleDelete = (id) => {
    if (window.confirm('この依頼を削除しますか？')) {
      setTechRequests(rs => rs.filter(r => r.id !== id));
    }
  };

  const openEdit = (r) => { setEditTarget(r); setShowModal(true); };

  const PRIORITY_COLORS = { '低': 'text-slate-400', '通常': 'text-slate-600', '高': 'text-orange-600', '緊急': 'text-red-600 font-bold' };

  const Row = ({ r }) => {
    const od = isOverdue(r);
    const days = r.desiredDate ? daysUntil(r.desiredDate) : null;
    return (
      <tr className={`border-b border-slate-100 hover:bg-slate-50 ${od ? 'bg-red-50' : ''}`}>
        <td className="py-2.5 px-3 font-mono text-xs text-slate-500">{r.id}</td>
        <td className="py-2.5 px-3">
          <div className="text-sm font-medium text-slate-800">{od && <span className="text-red-500 mr-1">⚠</span>}{r.title}</div>
          <div className="text-xs text-slate-400 mt-0.5">{r.category}{r.customerName ? ` · ${r.customerName}` : ''}{r.productName ? ` · ${r.productName}` : ''}</div>
        </td>
        <td className="py-2.5 px-3 text-xs text-slate-600">{r.requester}</td>
        <td className="py-2.5 px-3 text-xs text-slate-600">{r.assignee || '—'}</td>
        <td className="py-2.5 px-3">
          <span className={`text-xs font-medium ${PRIORITY_COLORS[r.priority] || 'text-slate-600'}`}>{r.priority || '通常'}</span>
        </td>
        <td className={`py-2.5 px-3 text-xs font-mono ${od ? 'text-red-600 font-bold' : days !== null && days <= 3 ? 'text-orange-600' : 'text-slate-600'}`}>
          {r.desiredDate || '—'}
          {days !== null && r.status !== '完了' && (
            <div className="text-xs mt-0.5">
              {od ? `${Math.abs(days)}日超過` : days === 0 ? '本日' : `あと${days}日`}
            </div>
          )}
        </td>
        <td className="py-2.5 px-3">
          <select value={r.status}
            onChange={e => setTechRequests(rs => rs.map(x => x.id === r.id ? { ...x, status: e.target.value } : x))}
            className={`text-xs px-2 py-1 rounded-full border-0 font-medium cursor-pointer ${STATUS_COLORS[r.status]}`}>
            {STATUSES.map(s => <option key={s} value={s}>{s}</option>)}
          </select>
        </td>
        <td className="py-2.5 px-3">
          <div className="flex gap-2">
            <button onClick={() => openEdit(r)} className="text-xs text-blue-600 hover:underline">編集</button>
            <button onClick={() => handleDelete(r.id)} className="text-xs text-red-400 hover:underline">削除</button>
          </div>
        </td>
      </tr>
    );
  };

  const thClass = 'px-3 py-2.5 text-left text-xs font-semibold text-slate-500 bg-slate-50 whitespace-nowrap';

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between">
        <h2 className="text-lg font-bold text-slate-800">技術依頼管理</h2>
        <button onClick={() => { setEditTarget(null); setShowModal(true); }} className="btn-primary text-sm">
          ＋ 新規依頼登録
        </button>
      </div>

      {/* 期限超過アラート */}
      {overdue.length > 0 && (
        <div className="bg-red-50 border border-red-200 rounded-xl px-4 py-3 flex gap-3 items-start">
          <span className="text-red-500 text-lg mt-0.5">⚠️</span>
          <div>
            <div className="font-bold text-red-700 text-sm mb-1">配布希望日を超過した依頼 {overdue.length}件</div>
            <div className="space-y-0.5">
              {overdue.map(r => (
                <div key={r.id} className="text-xs text-red-600">
                  <button onClick={() => openEdit(r)} className="font-mono font-bold hover:underline">{r.id}</button>
                  {' '}「{r.title}」— 希望日 {r.desiredDate}（{Math.abs(daysUntil(r.desiredDate))}日超過）
                </div>
              ))}
            </div>
          </div>
        </div>
      )}

      {/* サマリーカード */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
        {[
          { label: '未着手', count: techRequests.filter(r=>r.status==='未着手').length, color: 'border-slate-400' },
          { label: '対応中', count: techRequests.filter(r=>r.status==='対応中').length, color: 'border-blue-400' },
          { label: '期限超過', count: overdue.length, color: 'border-red-400' },
          { label: '完了（累計）', count: techRequests.filter(r=>r.status==='完了').length, color: 'border-green-400' },
        ].map(({ label, count, color }) => (
          <div key={label} className={`card p-4 border-l-4 ${color}`}>
            <div className={`text-2xl font-bold ${color.replace('border-','text-').replace('-400','-700')}`}>{count}</div>
            <div className="text-xs text-slate-500 mt-1">{label}</div>
          </div>
        ))}
      </div>

      {/* フィルタ */}
      <div className="card py-2.5 px-4">
        <div className="flex items-center gap-2 flex-wrap">
          <div className="w-52 flex-shrink-0">
            <input type="text" className="input-field text-sm py-1.5" placeholder="タイトル・得意先・依頼者で検索"
              value={filterSearch} onChange={e => setFilterSearch(e.target.value)} />
          </div>
          <div className="w-32 flex-shrink-0">
            <select className="select-field text-sm py-1.5" value={filterStatus} onChange={e => setFilterStatus(e.target.value)}>
              <option value="">全ステータス</option>
              {STATUSES.map(s => <option key={s}>{s}</option>)}
            </select>
          </div>
          {(filterSearch || filterStatus) && (
            <button onClick={() => { setFilterSearch(''); setFilterStatus(''); }}
              className="text-xs text-slate-500 hover:text-red-600 px-2 py-1 rounded hover:bg-red-50">
              クリア
            </button>
          )}
        </div>
      </div>

      {/* アクティブな依頼 */}
      <div className="card overflow-hidden">
        <div className="px-4 py-2.5 bg-blue-50 border-b border-blue-100 flex items-center gap-2">
          <span className="text-blue-700 font-semibold text-sm">対応中・未着手</span>
          <span className="bg-blue-100 text-blue-800 text-xs rounded-full px-2 py-0.5 font-medium">{active.length}件</span>
        </div>
        <div className="overflow-x-auto">
          <table className="w-full">
            <thead>
              <tr>
                <th className={thClass}>依頼番号</th>
                <th className={`${thClass} min-w-[200px]`}>タイトル / 分類</th>
                <th className={thClass}>依頼者</th>
                <th className={thClass}>技術担当</th>
                <th className={thClass}>優先度</th>
                <th className={thClass}>配布希望日</th>
                <th className={thClass}>ステータス</th>
                <th className={thClass}>操作</th>
              </tr>
            </thead>
            <tbody>
              {active.length === 0
                ? <tr><td colSpan={8} className="text-center py-8 text-slate-400 text-sm">対応中・未着手の依頼はありません</td></tr>
                : active.map(r => <Row key={r.id} r={r} />)
              }
            </tbody>
          </table>
        </div>
      </div>

      {/* 完了した依頼 */}
      {done.length > 0 && (
        <div className="card overflow-hidden">
          <div className="px-4 py-2.5 bg-green-50 border-b border-green-100 flex items-center gap-2">
            <span className="text-green-700 font-semibold text-sm">完了</span>
            <span className="bg-green-100 text-green-800 text-xs rounded-full px-2 py-0.5 font-medium">{done.length}件</span>
          </div>
          <div className="overflow-x-auto">
            <table className="w-full">
              <thead>
                <tr>
                  <th className={thClass}>依頼番号</th>
                  <th className={`${thClass} min-w-[200px]`}>タイトル / 分類</th>
                  <th className={thClass}>依頼者</th>
                  <th className={thClass}>技術担当</th>
                  <th className={thClass}>優先度</th>
                  <th className={thClass}>配布希望日</th>
                  <th className={thClass}>ステータス</th>
                  <th className={thClass}>操作</th>
                </tr>
              </thead>
              <tbody className="opacity-70">
                {done.map(r => <Row key={r.id} r={r} />)}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {showModal && (
        <RequestModal
          initial={editTarget}
          onClose={() => { setShowModal(false); setEditTarget(null); }}
          onSave={handleSave}
        />
      )}
    </div>
  );
}
