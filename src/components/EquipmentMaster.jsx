import { useState } from 'react';
import { useApp } from '../context/AppContext';
import { PROCESS_MACHINE_MAP } from '../data/mockData';

const PROCESSES = Object.keys(PROCESS_MACHINE_MAP);
const STATUS_OPTIONS = ['稼働中', '整備中', '停止中', '廃棄'];

// 工程内の機械種別グループ定義（行21: 同系グループ単位の整理）
const MACHINE_TYPE_OPTIONS = {
  '押出': ['絶縁押出', 'シース押出', '汎用押出'],
  '撚線': ['ベンチ撚線', 'ケーブル撚線', '細線撚線'],
  '編組': ['銅線編組', '繊維編組'],
  '加工': ['切断', '仕上', 'その他'],
};

function EquipmentModal({ machine, detail, onClose, onSave }) {
  const [form, setForm] = useState({
    id: machine?.id || '',
    name: machine?.name || '',
    process: machine?.process || PROCESSES[0],
    machineType: detail?.machineType || '',
    capacity: detail?.capacity || '',
    yearInstalled: detail?.yearInstalled || '',
    maxDiameter: detail?.maxDiameter || '',
    status: detail?.status || '稼働中',
    notes: detail?.notes || '',
  });
  const set = (k, v) => setForm(f => ({ ...f, [k]: v }));
  const isNew = !machine;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 p-4">
      <div className="bg-white rounded-2xl shadow-2xl w-full max-w-md">
        <div className="px-6 py-4 border-b border-slate-200">
          <h3 className="font-bold text-slate-800">{isNew ? '設備 新規追加' : '設備 編集'}</h3>
        </div>
        <div className="px-6 py-4 space-y-3">
          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="block text-xs font-medium text-slate-700 mb-1">設備ID *</label>
              <input className="input-field" value={form.id} onChange={e => set('id', e.target.value)}
                placeholder="例: EX-25" disabled={!isNew} />
            </div>
            <div>
              <label className="block text-xs font-medium text-slate-700 mb-1">工程 *</label>
              <select className="select-field" value={form.process} onChange={e => set('process', e.target.value)}>
                {PROCESSES.map(p => <option key={p}>{p}</option>)}
              </select>
            </div>
          </div>
          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="block text-xs font-medium text-slate-700 mb-1">能力（m/h）</label>
              <input type="number" className="input-field" value={form.capacity}
                onChange={e => set('capacity', e.target.value)} placeholder="200" />
            </div>
            <div>
              <label className="block text-xs font-medium text-slate-700 mb-1">設置年</label>
              <input type="number" className="input-field" value={form.yearInstalled}
                onChange={e => set('yearInstalled', e.target.value)} placeholder="2020" />
            </div>
          </div>
          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="block text-xs font-medium text-slate-700 mb-1">最大径（mm）</label>
              <input type="number" className="input-field" value={form.maxDiameter}
                onChange={e => set('maxDiameter', e.target.value)} placeholder="30" />
            </div>
            <div>
              <label className="block text-xs font-medium text-slate-700 mb-1">ステータス</label>
              <select className="select-field" value={form.status} onChange={e => set('status', e.target.value)}>
                {STATUS_OPTIONS.map(s => <option key={s}>{s}</option>)}
              </select>
            </div>
          </div>
          <div>
            <label className="block text-xs font-medium text-slate-700 mb-1">機械種別グループ</label>
            <select className="select-field" value={form.machineType} onChange={e => set('machineType', e.target.value)}>
              <option value="">（未分類）</option>
              {(MACHINE_TYPE_OPTIONS[form.process] || []).map(t => <option key={t}>{t}</option>)}
            </select>
          </div>
          <div>
            <label className="block text-xs font-medium text-slate-700 mb-1">備考</label>
            <input className="input-field" value={form.notes} onChange={e => set('notes', e.target.value)}
              placeholder="特記事項（例: 小径ケーブル専用）" />
          </div>
        </div>
        <div className="px-6 py-4 border-t border-slate-200 flex gap-3">
          <button onClick={onClose} className="flex-1 btn-secondary">キャンセル</button>
          <button
            disabled={!form.id || !form.process}
            onClick={() => form.id && onSave(form)}
            className="flex-1 btn-primary disabled:opacity-40 disabled:cursor-not-allowed">
            保存
          </button>
        </div>
      </div>
    </div>
  );
}

const statusColor = {
  '稼働中': 'bg-green-100 text-green-700',
  '整備中': 'bg-yellow-100 text-yellow-700',
  '停止中': 'bg-orange-100 text-orange-700',
  '廃棄':   'bg-red-100 text-red-500',
};

export default function EquipmentMaster() {
  const { machineDetails, setMachineDetails } = useApp();
  const [filterProcess, setFilterProcess] = useState('全工程');
  const [filterSearch, setFilterSearch] = useState('');
  const [showModal, setShowModal] = useState(false);
  const [editTarget, setEditTarget] = useState(null);

  const allMachines = Object.entries(PROCESS_MACHINE_MAP).flatMap(([process, names]) =>
    names.map(id => ({ id, name: id, process }))
  );

  const filtered = allMachines
    .filter(m => {
      if (filterProcess !== '全工程' && m.process !== filterProcess) return false;
      if (filterSearch && !m.id.toLowerCase().includes(filterSearch.toLowerCase())) return false;
      return true;
    })
    .sort((a, b) => {
      // 工程 → 機械種別 → 設備ID の順でソート（グループ整理）
      if (a.process !== b.process) return PROCESSES.indexOf(a.process) - PROCESSES.indexOf(b.process);
      const ta = machineDetails[a.id]?.machineType || 'zzz';
      const tb = machineDetails[b.id]?.machineType || 'zzz';
      if (ta !== tb) return ta.localeCompare(tb, 'ja');
      return a.id.localeCompare(b.id, undefined, { numeric: true });
    });

  const handleSave = (form) => {
    setMachineDetails(prev => ({
      ...prev,
      [form.id]: {
        capacity: Number(form.capacity) || null,
        yearInstalled: Number(form.yearInstalled) || null,
        maxDiameter: Number(form.maxDiameter) || null,
        machineType: form.machineType || '',
        status: form.status,
        notes: form.notes,
      },
    }));
    setShowModal(false);
    setEditTarget(null);
  };

  const processCounts = {};
  PROCESSES.forEach(p => {
    processCounts[p] = allMachines.filter(m => m.process === p).length;
  });

  const activeCounts = {};
  PROCESSES.forEach(p => {
    activeCounts[p] = allMachines.filter(m => m.process === p && (machineDetails[m.id]?.status || '稼働中') === '稼働中').length;
  });

  return (
    <div className="space-y-4">
      {/* サマリカード */}
      <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
        {PROCESSES.map(p => (
          <div key={p} className="card text-center">
            <div className="text-2xl font-bold text-slate-800">{activeCounts[p]}</div>
            <div className="text-xs text-slate-500 mt-0.5">{p}</div>
            <div className="text-xs text-slate-400">稼働 / {processCounts[p]}台</div>
          </div>
        ))}
      </div>

      {/* フィルタ・検索 */}
      <div className="card flex items-center gap-3 flex-wrap py-3">
        <input
          type="text"
          className="input-field max-w-48"
          placeholder="設備IDで検索"
          value={filterSearch}
          onChange={e => setFilterSearch(e.target.value)}
        />
        <div className="flex gap-1 flex-wrap">
          {['全工程', ...PROCESSES].map(p => (
            <button key={p} onClick={() => setFilterProcess(p)}
              className={`px-3 py-1 rounded-lg text-xs font-semibold border transition-colors ${filterProcess === p ? 'bg-slate-700 text-white border-slate-700' : 'bg-white text-slate-600 border-slate-200 hover:bg-slate-50'}`}>
              {p}
            </button>
          ))}
        </div>
        <button
          onClick={() => { setEditTarget(null); setShowModal(true); }}
          className="ml-auto btn-primary text-xs">
          ＋ 設備追加
        </button>
      </div>

      {/* テーブル */}
      <div className="card p-0 overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full text-sm">
            <thead className="bg-slate-50 border-b border-slate-200">
              <tr>
                {['設備ID', '工程', '機械種別', '能力(m/h)', '設置年', '最大径(mm)', 'ステータス', '備考', '操作'].map(h => (
                  <th key={h} className="text-left py-3 px-4 text-xs font-medium text-slate-500 whitespace-nowrap">{h}</th>
                ))}
              </tr>
            </thead>
            <tbody>
              {filtered.map(m => {
                const d = machineDetails[m.id] || {};
                const status = d.status || '稼働中';
                return (
                  <tr key={m.id} className="border-b border-slate-100 hover:bg-slate-50">
                    <td className="py-3 px-4 font-mono text-xs font-bold text-slate-700">{m.id}</td>
                    <td className="py-3 px-4">
                      <span className="badge bg-slate-100 text-slate-600 text-xs">{m.process}</span>
                    </td>
                    <td className="py-3 px-4">
                      {d.machineType
                        ? <span className="badge bg-blue-50 text-blue-700 text-xs">{d.machineType}</span>
                        : <span className="text-xs text-slate-300">—</span>}
                    </td>
                    <td className="py-3 px-4 text-right font-mono text-sm">{d.capacity != null ? d.capacity : '—'}</td>
                    <td className="py-3 px-4 text-slate-500">{d.yearInstalled || '—'}</td>
                    <td className="py-3 px-4 text-right font-mono text-sm">{d.maxDiameter != null ? d.maxDiameter : '—'}</td>
                    <td className="py-3 px-4">
                      <span className={`badge text-xs ${statusColor[status] || 'bg-slate-100 text-slate-500'}`}>{status}</span>
                    </td>
                    <td className="py-3 px-4 text-xs text-slate-500 max-w-[200px] truncate">{d.notes || '—'}</td>
                    <td className="py-3 px-4">
                      <button
                        onClick={() => { setEditTarget(m); setShowModal(true); }}
                        className="text-xs text-blue-600 hover:underline">
                        編集
                      </button>
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>
      </div>

      {showModal && (
        <EquipmentModal
          machine={editTarget}
          detail={editTarget ? machineDetails[editTarget.id] : null}
          onClose={() => { setShowModal(false); setEditTarget(null); }}
          onSave={handleSave}
        />
      )}
    </div>
  );
}
