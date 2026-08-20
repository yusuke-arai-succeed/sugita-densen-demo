import { useState } from 'react';
import * as XLSX from 'xlsx';
import { useApp } from '../context/AppContext';

const STATUS_OPTIONS = ['未検品', '検品中', '合格', '否認', '特採'];

const STATUS_COLORS = {
  '合格': 'bg-green-100 text-green-800',
  '未検品': 'bg-slate-100 text-slate-600',
  '検品中': 'bg-blue-100 text-blue-800',
  '否認': 'bg-red-100 text-red-700',
  '特採': 'bg-yellow-100 text-yellow-800',
};

function SortIcon({ field, sortField, sortDir }) {
  if (sortField !== field) return <span className="text-slate-300 ml-0.5">↕</span>;
  return <span className="text-blue-600 ml-0.5">{sortDir === 'asc' ? '↑' : '↓'}</span>;
}

export default function QualityInspection() {
  const { inspections, setInspections } = useApp();

  const [tab, setTab] = useState('progress'); // 'progress' | 'ready'
  const [filterSearch, setFilterSearch] = useState('');
  const [filterStatus, setFilterStatus] = useState('');
  const [filterDateFrom, setFilterDateFrom] = useState('');
  const [filterDateTo, setFilterDateTo] = useState('');
  const [sortField, setSortField] = useState('date');
  const [sortDir, setSortDir] = useState('desc');
  const [editingId, setEditingId] = useState(null);
  const [editForm, setEditForm] = useState({});

  const handleSort = (field) => {
    if (sortField === field) setSortDir(d => d === 'asc' ? 'desc' : 'asc');
    else { setSortField(field); setSortDir('asc'); }
  };

  const counts = STATUS_OPTIONS.reduce((acc, s) => {
    acc[s] = inspections.filter(i => i.status === s).length;
    return acc;
  }, {});

  let filtered = [...inspections];
  if (filterSearch) {
    const q = filterSearch.toLowerCase();
    filtered = filtered.filter(i =>
      i.productName.toLowerCase().includes(q) ||
      i.customer.toLowerCase().includes(q) ||
      i.designDocNo.toLowerCase().includes(q) ||
      i.orderNo.toLowerCase().includes(q) ||
      i.mfgNo.toLowerCase().includes(q)
    );
  }
  if (filterStatus) filtered = filtered.filter(i => i.status === filterStatus);
  if (filterDateFrom) filtered = filtered.filter(i => i.date >= filterDateFrom);
  if (filterDateTo)   filtered = filtered.filter(i => i.date <= filterDateTo);
  filtered.sort((a, b) => {
    let va = a[sortField] ?? '', vb = b[sortField] ?? '';
    if (typeof va === 'number') return sortDir === 'asc' ? va - vb : vb - va;
    return sortDir === 'asc' ? String(va).localeCompare(String(vb), 'ja') : String(vb).localeCompare(String(va), 'ja');
  });

  const readyItems = inspections.filter(i => i.status === '合格' || i.status === '特採');

  const startEdit = (item) => {
    setEditingId(item.id);
    setEditForm({ status: item.status, passed: item.passed, failed: item.failed, specialAccept: item.specialAccept, remarks: item.remarks, abnormalReport: item.abnormalReport });
  };

  const saveEdit = (id) => {
    setInspections(prev => prev.map(i => i.id !== id ? i : {
      ...i,
      status: editForm.status,
      passed: Number(editForm.passed),
      failed: Number(editForm.failed),
      specialAccept: Number(editForm.specialAccept),
      abnormalReport: editForm.abnormalReport,
      remarks: editForm.remarks,
    }));
    setEditingId(null);
  };

  const exportXLS = () => {
    const rows = readyItems.map((i, idx) => ({
      'No.': idx + 1,
      '日付': i.date,
      '設計書No.': i.designDocNo,
      '得意先': i.customer,
      '品名': i.productName,
      '色': i.color,
      '注番': i.orderNo,
      '製番': i.mfgNo,
      '荷姿': i.packaging,
      '条長': i.length,
      '入検': i.inspectionQty,
      '良': i.passed,
      '否': i.failed,
      '特採': i.specialAccept,
      'TNo.': i.tNo,
      '異常発生報告書': i.abnormalReport ? '有' : '',
      '備考欄': i.remarks,
    }));
    const ws = XLSX.utils.json_to_sheet(rows);
    const wb = XLSX.utils.book_new();
    XLSX.utils.book_append_sheet(wb, ws, '庫入一覧');
    XLSX.writeFile(wb, `庫入一覧_${new Date().toISOString().slice(0, 10)}.xls`);
  };

  const hasFilter = filterSearch || filterStatus || filterDateFrom || filterDateTo;

  const thClass = 'px-3 py-2 text-left text-xs font-semibold text-slate-500 uppercase tracking-wider cursor-pointer hover:bg-slate-100 whitespace-nowrap select-none';
  const tdClass = 'px-3 py-2 text-sm text-slate-700';

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between">
        <h2 className="text-lg font-bold text-slate-800">検品・庫入れ管理</h2>
      </div>

      {/* サマリーカード */}
      <div className="grid grid-cols-5 gap-3">
        {STATUS_OPTIONS.map(s => (
          <div key={s} className="card p-3 text-center">
            <div className="text-2xl font-bold text-slate-800">{counts[s] || 0}</div>
            <div className={`text-xs font-medium mt-1 px-2 py-0.5 rounded-full inline-block ${STATUS_COLORS[s]}`}>{s}</div>
          </div>
        ))}
      </div>

      {/* タブ */}
      <div className="flex gap-1 border-b border-slate-200">
        <button
          onClick={() => setTab('progress')}
          className={`px-4 py-2 text-sm font-medium border-b-2 transition-colors ${tab === 'progress' ? 'border-blue-600 text-blue-700' : 'border-transparent text-slate-500 hover:text-slate-700'}`}
        >
          検品進捗一覧
        </button>
        <button
          onClick={() => setTab('ready')}
          className={`px-4 py-2 text-sm font-medium border-b-2 transition-colors ${tab === 'ready' ? 'border-blue-600 text-blue-700' : 'border-transparent text-slate-500 hover:text-slate-700'}`}
        >
          出荷待ち一覧
          <span className="ml-1.5 bg-green-100 text-green-700 text-xs rounded-full px-1.5 py-0.5 font-bold">{readyItems.length}</span>
        </button>
      </div>

      {tab === 'progress' && (
        <>
          {/* フィルタバー */}
          <div className="card py-2.5 px-4">
            <div className="flex items-center gap-2 flex-wrap">
              <div className="w-52 flex-shrink-0">
                <input
                  type="text"
                  className="input-field text-sm py-1.5"
                  placeholder="品名・得意先・設計書No. 検索"
                  value={filterSearch}
                  onChange={e => setFilterSearch(e.target.value)}
                />
              </div>
              <div className="w-32 flex-shrink-0">
                <select
                  className="select-field text-sm py-1.5"
                  value={filterStatus}
                  onChange={e => setFilterStatus(e.target.value)}
                >
                  <option value="">全ステータス</option>
                  {STATUS_OPTIONS.map(s => <option key={s} value={s}>{s}</option>)}
                </select>
              </div>
              <span className="text-xs text-slate-500 whitespace-nowrap">日付</span>
              <div className="w-36 flex-shrink-0">
                <input type="date" className="input-field text-sm py-1.5" value={filterDateFrom} onChange={e => setFilterDateFrom(e.target.value)} />
              </div>
              <span className="text-xs text-slate-400">〜</span>
              <div className="w-36 flex-shrink-0">
                <input type="date" className="input-field text-sm py-1.5" value={filterDateTo} onChange={e => setFilterDateTo(e.target.value)} />
              </div>
              {hasFilter && (
                <button
                  onClick={() => { setFilterSearch(''); setFilterStatus(''); setFilterDateFrom(''); setFilterDateTo(''); }}
                  className="text-xs text-slate-500 hover:text-red-600 px-2 py-1 rounded hover:bg-red-50 transition-colors whitespace-nowrap"
                >
                  クリア
                </button>
              )}
              <span className="ml-auto text-xs text-slate-400 whitespace-nowrap">{filtered.length}件 / 全{inspections.length}件</span>
            </div>
          </div>

          {/* テーブル */}
          <div className="card overflow-hidden">
            <div className="overflow-x-auto">
              <table className="w-full text-sm">
                <thead className="bg-slate-50 border-b border-slate-200">
                  <tr>
                    <th className={thClass} onClick={() => handleSort('date')}>日付 <SortIcon field="date" sortField={sortField} sortDir={sortDir} /></th>
                    <th className={thClass} onClick={() => handleSort('designDocNo')}>設計書No. <SortIcon field="designDocNo" sortField={sortField} sortDir={sortDir} /></th>
                    <th className={thClass} onClick={() => handleSort('customer')}>得意先 <SortIcon field="customer" sortField={sortField} sortDir={sortDir} /></th>
                    <th className={thClass} onClick={() => handleSort('productName')}>品名 <SortIcon field="productName" sortField={sortField} sortDir={sortDir} /></th>
                    <th className={thClass}>色</th>
                    <th className={thClass} onClick={() => handleSort('orderNo')}>注番 <SortIcon field="orderNo" sortField={sortField} sortDir={sortDir} /></th>
                    <th className={thClass}>製番</th>
                    <th className={thClass}>荷姿</th>
                    <th className={`${thClass} text-right`} onClick={() => handleSort('length')}>条長 <SortIcon field="length" sortField={sortField} sortDir={sortDir} /></th>
                    <th className={`${thClass} text-right`}>入検</th>
                    <th className={`${thClass} text-right`}>良</th>
                    <th className={`${thClass} text-right`}>否</th>
                    <th className={`${thClass} text-right`}>特採</th>
                    <th className={thClass} onClick={() => handleSort('status')}>ステータス <SortIcon field="status" sortField={sortField} sortDir={sortDir} /></th>
                    <th className={thClass}>操作</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-100">
                  {filtered.length === 0 && (
                    <tr><td colSpan={15} className="text-center py-8 text-slate-400">該当データなし</td></tr>
                  )}
                  {filtered.map(item => (
                    <tr key={item.id} className="hover:bg-slate-50 transition-colors">
                      {editingId === item.id ? (
                        <>
                          <td className={tdClass}>{item.date}</td>
                          <td className={tdClass}>{item.designDocNo}</td>
                          <td className={tdClass}>{item.customer}</td>
                          <td className={tdClass}>{item.productName}</td>
                          <td className={tdClass}>{item.color}</td>
                          <td className={tdClass}>{item.orderNo}</td>
                          <td className={tdClass}>{item.mfgNo}</td>
                          <td className={tdClass}>{item.packaging}</td>
                          <td className={`${tdClass} text-right`}>{item.length}</td>
                          <td className={`${tdClass} text-right`}>{item.inspectionQty}</td>
                          <td className={`${tdClass} text-right`}>
                            <input type="number" min={0} value={editForm.passed} onChange={e => setEditForm(f => ({ ...f, passed: e.target.value }))} className="w-14 border border-slate-300 rounded px-1 py-0.5 text-right text-xs" />
                          </td>
                          <td className={`${tdClass} text-right`}>
                            <input type="number" min={0} value={editForm.failed} onChange={e => setEditForm(f => ({ ...f, failed: e.target.value }))} className="w-14 border border-slate-300 rounded px-1 py-0.5 text-right text-xs" />
                          </td>
                          <td className={`${tdClass} text-right`}>
                            <input type="number" min={0} value={editForm.specialAccept} onChange={e => setEditForm(f => ({ ...f, specialAccept: e.target.value }))} className="w-14 border border-slate-300 rounded px-1 py-0.5 text-right text-xs" />
                          </td>
                          <td className={tdClass}>
                            <select value={editForm.status} onChange={e => setEditForm(f => ({ ...f, status: e.target.value }))} className="border border-slate-300 rounded px-1 py-0.5 text-xs w-24">
                              {STATUS_OPTIONS.map(s => <option key={s} value={s}>{s}</option>)}
                            </select>
                          </td>
                          <td className={tdClass}>
                            <div className="flex gap-1">
                              <button onClick={() => saveEdit(item.id)} className="text-xs bg-blue-600 text-white px-2 py-1 rounded hover:bg-blue-700">保存</button>
                              <button onClick={() => setEditingId(null)} className="text-xs text-slate-500 px-2 py-1 rounded hover:bg-slate-100">取消</button>
                            </div>
                          </td>
                        </>
                      ) : (
                        <>
                          <td className={tdClass}>{item.date}</td>
                          <td className={tdClass}>{item.designDocNo}</td>
                          <td className={`${tdClass} max-w-[120px] truncate`} title={item.customer}>{item.customer}</td>
                          <td className={`${tdClass} max-w-[200px] truncate`} title={item.productName}>{item.productName}</td>
                          <td className={tdClass}>{item.color}</td>
                          <td className={tdClass}>{item.orderNo}</td>
                          <td className={tdClass}>{item.mfgNo}</td>
                          <td className={tdClass}>{item.packaging}</td>
                          <td className={`${tdClass} text-right`}>{item.length.toLocaleString()}</td>
                          <td className={`${tdClass} text-right`}>{item.inspectionQty}</td>
                          <td className={`${tdClass} text-right`}>{item.passed}</td>
                          <td className={`${tdClass} text-right`}>{item.failed > 0 ? <span className="text-red-600 font-medium">{item.failed}</span> : 0}</td>
                          <td className={`${tdClass} text-right`}>{item.specialAccept > 0 ? <span className="text-yellow-700 font-medium">{item.specialAccept}</span> : 0}</td>
                          <td className={tdClass}>
                            <span className={`text-xs font-medium px-2 py-0.5 rounded-full ${STATUS_COLORS[item.status] || ''}`}>{item.status}</span>
                            {item.abnormalReport && <span className="ml-1 text-xs text-red-500" title="異常発生報告書あり">⚠</span>}
                          </td>
                          <td className={tdClass}>
                            <button onClick={() => startEdit(item)} className="text-xs text-blue-600 hover:underline">編集</button>
                          </td>
                        </>
                      )}
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>
        </>
      )}

      {tab === 'ready' && (
        <>
          <div className="flex items-center justify-between">
            <p className="text-sm text-slate-500">ステータスが「合格」または「特採」の製品を表示しています。</p>
            <button
              onClick={exportXLS}
              className="flex items-center gap-2 bg-green-600 hover:bg-green-700 text-white text-sm font-medium px-4 py-2 rounded-lg transition-colors"
            >
              <span>📥</span>
              XLS出力（庫入一覧）
            </button>
          </div>

          <div className="card overflow-hidden">
            <div className="overflow-x-auto">
              <table className="w-full text-sm">
                <thead className="bg-slate-50 border-b border-slate-200">
                  <tr>
                    <th className={thClass}>No.</th>
                    <th className={thClass}>日付</th>
                    <th className={thClass}>設計書No.</th>
                    <th className={thClass}>得意先</th>
                    <th className={thClass}>品名</th>
                    <th className={thClass}>色</th>
                    <th className={thClass}>注番</th>
                    <th className={thClass}>製番</th>
                    <th className={thClass}>荷姿</th>
                    <th className={`${thClass} text-right`}>条長</th>
                    <th className={`${thClass} text-right`}>入検</th>
                    <th className={`${thClass} text-right`}>良</th>
                    <th className={`${thClass} text-right`}>否</th>
                    <th className={`${thClass} text-right`}>特採</th>
                    <th className={thClass}>TNo.</th>
                    <th className={thClass}>異常報告書</th>
                    <th className={thClass}>ステータス</th>
                    <th className={thClass}>備考</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-100">
                  {readyItems.length === 0 && (
                    <tr><td colSpan={18} className="text-center py-8 text-slate-400">出荷待ち製品なし</td></tr>
                  )}
                  {readyItems.map((item, idx) => (
                    <tr key={item.id} className="hover:bg-slate-50">
                      <td className={tdClass}>{idx + 1}</td>
                      <td className={tdClass}>{item.date}</td>
                      <td className={tdClass}>{item.designDocNo}</td>
                      <td className={`${tdClass} max-w-[120px] truncate`} title={item.customer}>{item.customer}</td>
                      <td className={`${tdClass} max-w-[200px] truncate`} title={item.productName}>{item.productName}</td>
                      <td className={tdClass}>{item.color}</td>
                      <td className={tdClass}>{item.orderNo}</td>
                      <td className={tdClass}>{item.mfgNo}</td>
                      <td className={tdClass}>{item.packaging}</td>
                      <td className={`${tdClass} text-right`}>{item.length.toLocaleString()}</td>
                      <td className={`${tdClass} text-right`}>{item.inspectionQty}</td>
                      <td className={`${tdClass} text-right`}>{item.passed}</td>
                      <td className={`${tdClass} text-right`}>{item.failed}</td>
                      <td className={`${tdClass} text-right`}>{item.specialAccept}</td>
                      <td className={tdClass}>{item.tNo}</td>
                      <td className={tdClass}>{item.abnormalReport ? <span className="text-red-600 font-medium">有</span> : ''}</td>
                      <td className={tdClass}>
                        <span className={`text-xs font-medium px-2 py-0.5 rounded-full ${STATUS_COLORS[item.status] || ''}`}>{item.status}</span>
                      </td>
                      <td className={`${tdClass} max-w-[150px] truncate`} title={item.remarks}>{item.remarks}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>
        </>
      )}
    </div>
  );
}
