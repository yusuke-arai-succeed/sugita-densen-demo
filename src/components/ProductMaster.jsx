import { useState } from 'react';
import { useApp } from '../context/AppContext';
import { PROCESS_ORDER, PROCESS_MACHINE_MAP } from '../data/mockData';

// ─── BOM管理タブ ─────────────────────────────────────────────────────────────
const PROCESS_COLORS = {
  '撚線': 'bg-blue-50 text-blue-700 border-blue-200',
  '編組': 'bg-purple-50 text-purple-700 border-purple-200',
  '押出': 'bg-orange-50 text-orange-700 border-orange-200',
  '加工': 'bg-green-50 text-green-700 border-green-200',
};

function GripIcon() {
  return (
    <svg width="10" height="14" viewBox="0 0 10 14" fill="currentColor" className="inline-block">
      <circle cx="3" cy="2.5" r="1.3"/><circle cx="7" cy="2.5" r="1.3"/>
      <circle cx="3" cy="7"   r="1.3"/><circle cx="7" cy="7"   r="1.3"/>
      <circle cx="3" cy="11.5" r="1.3"/><circle cx="7" cy="11.5" r="1.3"/>
    </svg>
  );
}

function BOMTab({ products, selectedProductId, setSelectedProductId }) {
  const { materials, productBOMs, addBOMEntry, deleteBOMEntry, updateProductBOM, copperPrice, calcMaterialPrice } = useApp();
  const [showAddForm, setShowAddForm] = useState(false);
  const [addForm, setAddForm] = useState({ process: PROCESS_ORDER[0], materialId: '', qty: '', lossRate: '1.02' });
  const [editingId, setEditingId] = useState(null);
  const [editForm, setEditForm] = useState({});
  const [dragIndex, setDragIndex] = useState(null);
  const [dragOverIndex, setDragOverIndex] = useState(null);

  const boms = productBOMs[selectedProductId] || [];
  const selectedProduct = products.find(p => p.id === selectedProductId);

  const totalCost = boms.reduce((sum, b) => {
    const mat = materials.find(m => m.id === b.materialId);
    if (!mat) return sum;
    return sum + b.qty * b.lossRate * calcMaterialPrice(mat, null, copperPrice);
  }, 0);

  const handleAdd = () => {
    if (!addForm.materialId || !addForm.qty) return;
    addBOMEntry(selectedProductId, {
      id: `B${selectedProductId.replace('P', '')}-${Date.now()}`,
      productId: selectedProductId,
      process: addForm.process,
      materialId: addForm.materialId,
      qty: parseFloat(addForm.qty),
      lossRate: parseFloat(addForm.lossRate) || 1.02,
    });
    setAddForm({ process: PROCESS_ORDER[0], materialId: '', qty: '', lossRate: '1.02' });
    setShowAddForm(false);
  };

  const startEdit = (b) => {
    setEditingId(b.id);
    setEditForm({ process: b.process, materialId: b.materialId, qty: String(b.qty), lossRate: String(b.lossRate) });
    setShowAddForm(false);
  };

  const saveEdit = () => {
    if (!editForm.materialId || !editForm.qty) return;
    updateProductBOM(selectedProductId, boms.map(b =>
      b.id === editingId
        ? { ...b, process: editForm.process, materialId: editForm.materialId, qty: parseFloat(editForm.qty), lossRate: parseFloat(editForm.lossRate) || 1.02 }
        : b
    ));
    setEditingId(null);
  };

  const sortByProcess = () => {
    const sorted = [...boms].sort((a, b) =>
      PROCESS_ORDER.indexOf(a.process) - PROCESS_ORDER.indexOf(b.process)
    );
    updateProductBOM(selectedProductId, sorted);
  };

  const handleDragStart = (e, idx) => {
    setDragIndex(idx);
    e.dataTransfer.effectAllowed = 'move';
  };

  const handleDragOver = (e, idx) => {
    e.preventDefault();
    e.dataTransfer.dropEffect = 'move';
    if (dragOverIndex !== idx) setDragOverIndex(idx);
  };

  const handleDrop = (e, idx) => {
    e.preventDefault();
    if (dragIndex !== null && dragIndex !== idx) {
      const next = [...boms];
      const [moved] = next.splice(dragIndex, 1);
      next.splice(idx, 0, moved);
      updateProductBOM(selectedProductId, next);
    }
    setDragIndex(null);
    setDragOverIndex(null);
  };

  const handleDragEnd = () => {
    setDragIndex(null);
    setDragOverIndex(null);
  };

  return (
    <div className="space-y-4">
      {/* 製品選択 */}
      <div className="flex items-center gap-3 flex-wrap">
        <label className="text-sm font-medium text-slate-600">対象製品:</label>
        <select value={selectedProductId} onChange={e => { setSelectedProductId(e.target.value); setShowAddForm(false); setEditingId(null); }}
          className="border border-slate-200 rounded-lg px-3 py-1.5 text-sm focus:outline-none focus:ring-2 focus:ring-blue-300 max-w-xs">
          {products.map(p => (
            <option key={p.id} value={p.id}>{p.productCode} — {p.name}</option>
          ))}
        </select>
        <span className="text-xs text-slate-400">銅価格: ¥{copperPrice.toLocaleString()}/kg</span>
        {boms.length > 1 && (
          <button onClick={sortByProcess}
            className="text-xs px-3 py-1.5 rounded-lg border border-slate-200 bg-white text-slate-600 hover:bg-slate-50 hover:border-slate-300 transition-colors">
            工程順に並び替え
          </button>
        )}
        {selectedProduct && (
          <span className="ml-auto text-sm font-semibold text-slate-800">
            100m材料費合計: <span className="text-blue-700">¥{Math.round(totalCost).toLocaleString()}</span>
          </span>
        )}
      </div>

      {/* BOMテーブル */}
      <div className="overflow-x-auto rounded-xl border border-slate-200">
        <table className="min-w-full text-sm">
          <thead>
            <tr className="bg-slate-50 text-slate-600 text-xs">
              <th className="w-8 px-2 py-2.5" />
              <th className="px-4 py-2.5 text-left font-semibold">工程</th>
              <th className="px-4 py-2.5 text-left font-semibold">材料名</th>
              <th className="px-4 py-2.5 text-right font-semibold">使用量(kg/100m)</th>
              <th className="px-4 py-2.5 text-right font-semibold">ロス係数</th>
              <th className="px-4 py-2.5 text-right font-semibold">単価(¥/kg)</th>
              <th className="px-4 py-2.5 text-right font-semibold">材料費(¥/100m)</th>
              <th className="px-4 py-2.5 text-center font-semibold">操作</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-slate-100">
            {boms.length === 0 && (
              <tr><td colSpan={8} className="px-4 py-6 text-center text-slate-400 text-sm">BOM未登録</td></tr>
            )}
            {boms.map((b, idx) => {
              const mat = materials.find(m => m.id === b.materialId);
              const unitPrice = mat ? calcMaterialPrice(mat, null, copperPrice) : 0;
              const lineCost = b.qty * b.lossRate * unitPrice;
              const isEditing = editingId === b.id;
              const isDragging = dragIndex === idx;
              const isDropTarget = dragOverIndex === idx && dragIndex !== idx;

              if (isEditing) {
                const eMat = materials.find(m => m.id === editForm.materialId);
                const ePrice = eMat ? calcMaterialPrice(eMat, null, copperPrice) : 0;
                const eCost = (parseFloat(editForm.qty) || 0) * (parseFloat(editForm.lossRate) || 1) * ePrice;
                return (
                  <tr key={b.id} className="bg-blue-50">
                    <td className="px-2 py-2 text-center text-slate-300"><GripIcon /></td>
                    <td className="px-3 py-2">
                      <select value={editForm.process} onChange={e => setEditForm(f => ({ ...f, process: e.target.value }))}
                        className="border border-blue-300 rounded px-2 py-1 text-xs w-full">
                        {PROCESS_ORDER.map(p => <option key={p} value={p}>{p}</option>)}
                      </select>
                    </td>
                    <td className="px-3 py-2">
                      <select value={editForm.materialId} onChange={e => setEditForm(f => ({ ...f, materialId: e.target.value }))}
                        className="border border-blue-300 rounded px-2 py-1 text-xs w-full min-w-[160px]">
                        {materials.map(m => <option key={m.id} value={m.id}>{m.name}</option>)}
                      </select>
                    </td>
                    <td className="px-3 py-2">
                      <input type="number" step="0.01" value={editForm.qty} onChange={e => setEditForm(f => ({ ...f, qty: e.target.value }))}
                        className="border border-blue-300 rounded px-2 py-1 text-xs w-24 text-right" />
                    </td>
                    <td className="px-3 py-2">
                      <input type="number" step="0.01" value={editForm.lossRate} onChange={e => setEditForm(f => ({ ...f, lossRate: e.target.value }))}
                        className="border border-blue-300 rounded px-2 py-1 text-xs w-20 text-right" />
                    </td>
                    <td className="px-4 py-2 text-right text-xs text-slate-500">¥{Math.round(ePrice).toLocaleString()}</td>
                    <td className="px-4 py-2 text-right text-xs font-semibold text-blue-700">¥{Math.round(eCost).toLocaleString()}</td>
                    <td className="px-3 py-2">
                      <div className="flex gap-1 justify-center">
                        <button onClick={saveEdit} disabled={!editForm.materialId || !editForm.qty}
                          className="text-xs px-2 py-1 rounded bg-blue-600 text-white hover:bg-blue-700 disabled:opacity-40">保存</button>
                        <button onClick={() => setEditingId(null)}
                          className="text-xs px-2 py-1 rounded bg-slate-200 text-slate-600 hover:bg-slate-300">取消</button>
                      </div>
                    </td>
                  </tr>
                );
              }

              return (
                <tr key={b.id}
                  draggable
                  onDragStart={e => handleDragStart(e, idx)}
                  onDragOver={e => handleDragOver(e, idx)}
                  onDrop={e => handleDrop(e, idx)}
                  onDragEnd={handleDragEnd}
                  className={`transition-colors ${isDragging ? 'opacity-40 bg-slate-50' : isDropTarget ? 'border-t-2 border-blue-400 bg-blue-50' : 'hover:bg-slate-50'}`}
                >
                  <td className="px-2 py-2.5 text-center text-slate-300 hover:text-slate-500 cursor-grab active:cursor-grabbing select-none">
                    <GripIcon />
                  </td>
                  <td className="px-4 py-2.5">
                    <span className={`px-2 py-0.5 rounded border text-xs font-medium ${PROCESS_COLORS[b.process] || 'bg-slate-100 text-slate-600'}`}>
                      {b.process}
                    </span>
                  </td>
                  <td className="px-4 py-2.5">
                    <div className="font-medium text-slate-800">{mat?.name || b.materialId}</div>
                    {mat?.isCopperBased && <div className="text-xs text-amber-600">銅系（スポット連動）</div>}
                  </td>
                  <td className="px-4 py-2.5 text-right font-mono text-slate-700">{b.qty.toFixed(2)}</td>
                  <td className="px-4 py-2.5 text-right text-slate-500">{b.lossRate.toFixed(2)}</td>
                  <td className="px-4 py-2.5 text-right text-slate-700">¥{Math.round(unitPrice).toLocaleString()}</td>
                  <td className="px-4 py-2.5 text-right font-semibold text-slate-800">¥{Math.round(lineCost).toLocaleString()}</td>
                  <td className="px-4 py-2.5">
                    <div className="flex gap-2 justify-center">
                      <button onClick={() => startEdit(b)} className="text-xs text-blue-600 hover:underline">編集</button>
                      <button onClick={() => deleteBOMEntry(selectedProductId, b.id)} className="text-xs text-red-500 hover:underline">削除</button>
                    </div>
                  </td>
                </tr>
              );
            })}
          </tbody>
          {boms.length > 0 && (
            <tfoot>
              <tr className="bg-slate-50 border-t-2 border-slate-200">
                <td colSpan={6} className="px-4 py-2.5 text-right text-sm font-semibold text-slate-600">合計</td>
                <td className="px-4 py-2.5 text-right font-bold text-blue-700">¥{Math.round(totalCost).toLocaleString()}</td>
                <td />
              </tr>
            </tfoot>
          )}
        </table>
      </div>

      {/* 追加フォーム */}
      {showAddForm ? (
        <div className="border border-blue-200 rounded-xl p-4 bg-blue-50 space-y-3">
          <p className="text-sm font-semibold text-blue-800">BOMエントリ追加</p>
          <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
            <div>
              <label className="text-xs text-slate-500 block mb-1">工程</label>
              <select value={addForm.process} onChange={e => setAddForm(f => ({ ...f, process: e.target.value }))}
                className="border border-slate-200 rounded px-2 py-1.5 text-sm w-full focus:outline-none focus:ring-2 focus:ring-blue-300">
                {PROCESS_ORDER.map(p => <option key={p} value={p}>{p}</option>)}
              </select>
            </div>
            <div className="sm:col-span-2">
              <label className="text-xs text-slate-500 block mb-1">材料 <span className="text-red-500">*</span></label>
              <select value={addForm.materialId} onChange={e => setAddForm(f => ({ ...f, materialId: e.target.value }))}
                className={`border rounded px-2 py-1.5 text-sm w-full focus:outline-none focus:ring-2 focus:ring-blue-300 ${!addForm.materialId ? 'border-red-300 bg-red-50' : 'border-slate-200'}`}>
                <option value="">-- 材料を選択 --</option>
                {materials.map(m => (
                  <option key={m.id} value={m.id}>{m.name}{m.isCopperBased ? ' ★銅系' : ''}</option>
                ))}
              </select>
            </div>
            <div>
              <label className="text-xs text-slate-500 block mb-1">使用量(kg/100m) <span className="text-red-500">*</span></label>
              <input type="number" step="0.01" value={addForm.qty} onChange={e => setAddForm(f => ({ ...f, qty: e.target.value }))}
                className={`border rounded px-2 py-1.5 text-sm w-full focus:outline-none focus:ring-2 focus:ring-blue-300 ${!addForm.qty ? 'border-red-300 bg-red-50' : 'border-slate-200'}`}
                placeholder="例: 9.52" />
            </div>
            <div>
              <label className="text-xs text-slate-500 block mb-1">ロス係数</label>
              <input type="number" step="0.01" value={addForm.lossRate} onChange={e => setAddForm(f => ({ ...f, lossRate: e.target.value }))}
                className="border border-slate-200 rounded px-2 py-1.5 text-sm w-full focus:outline-none focus:ring-2 focus:ring-blue-300" placeholder="例: 1.02" />
            </div>
          </div>
          <div className="flex items-center gap-2">
            <button onClick={handleAdd}
              disabled={!addForm.materialId || !addForm.qty}
              className="btn-primary text-sm px-4 disabled:opacity-40 disabled:cursor-not-allowed">
              追加
            </button>
            <button onClick={() => setShowAddForm(false)} className="btn-secondary text-sm px-4">キャンセル</button>
            {(!addForm.materialId || !addForm.qty) && (
              <span className="text-xs text-red-500">材料と使用量は必須です</span>
            )}
          </div>
        </div>
      ) : (
        <button onClick={() => { setShowAddForm(true); setEditingId(null); }} className="btn-secondary text-sm">＋ BOMエントリ追加</button>
      )}
    </div>
  );
}

const sheathColors = ['黒', '赤', '緑', '青', '白', '黄', 'オレンジ', 'グレー'];
const packagingOptions = ['ドラム(D400)', 'ドラム(D500)', 'ドラム(D600)', '束', '把', 'm'];
const docOptions = ['納品書（指定単票）', '試験成績表', 'サンプル（要）', 'サンプル（不要）'];

function ProductModal({ product, onClose, onSave }) {
  const { customers } = useApp();
  const [form, setForm] = useState(product || {
    productCode: '', designNumber: '', customerCode: '', customerName: '',
    sheathColor: '黒', conductorPitch: '', packaging: 'ドラム(D400)',
    requiredDocuments: [], sampleLength: 0, name: '',
    spec: { outerDiameter: { min: '', max: '' }, wallThickness: { min: '', max: '' } },
    drawingUrl: '',
    drawingRevision: 'Rev.1',
    workConditions: { '絶縁': '', '対撚り': '', '集合': '', '編組': '', 'シース': '' },
    labelSettings: { printer: '1号機', paperType: '標準', inspectionRequired: false },
    autoReservation: false,
  });

  const setWorkCond = (process, val) => setForm(f => ({
    ...f,
    workConditions: { ...f.workConditions, [process]: val },
  }));

  const set = (key, val) => setForm(f => ({ ...f, [key]: val }));
  const setSpec = (type, bound, val) => setForm(f => ({
    ...f,
    spec: { ...f.spec, [type]: { ...f.spec[type], [bound]: val } }
  }));
  const toggleDoc = (doc) => {
    set('requiredDocuments', form.requiredDocuments.includes(doc)
      ? form.requiredDocuments.filter(d => d !== doc)
      : [...form.requiredDocuments, doc]);
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 p-4">
      <div className="bg-white rounded-xl shadow-2xl w-full max-w-2xl max-h-[90vh] overflow-y-auto">
        <div className="flex items-center justify-between px-6 py-4 border-b border-slate-200">
          <h2 className="font-bold text-slate-800">{product ? '製品編集' : '製品追加'}</h2>
          <button onClick={onClose} className="text-slate-400 hover:text-slate-600 text-xl">✕</button>
        </div>
        <div className="p-4 md:p-6 grid grid-cols-1 sm:grid-cols-2 gap-4">
          <div>
            <label className="block text-xs font-medium text-slate-600 mb-1">製品コード *</label>
            <input className="input-field" value={form.productCode} onChange={e => set('productCode', e.target.value)} placeholder="例: CV-3.5-3C-BLK" />
          </div>
          <div>
            <label className="block text-xs font-medium text-slate-600 mb-1">製品名 *</label>
            <input className="input-field" value={form.name} onChange={e => set('name', e.target.value)} placeholder="例: CV 3.5mm² 3芯 黒シース" />
          </div>
          <div>
            <label className="block text-xs font-medium text-slate-600 mb-1">設計書番号</label>
            <input className="input-field" value={form.designNumber} onChange={e => set('designNumber', e.target.value)} placeholder="例: TF-2021-0342" />
          </div>
          <div>
            <label className="block text-xs font-medium text-slate-600 mb-1">得意先</label>
            <select className="select-field" value={form.customerCode} onChange={e => {
              const c = customers.find(c => c.code === e.target.value);
              set('customerCode', e.target.value);
              if (c) set('customerName', c.name);
            }}>
              <option value="">選択してください</option>
              {customers.map(c => <option key={c.id} value={c.code}>{c.name}</option>)}
            </select>
          </div>
          <div>
            <label className="block text-xs font-medium text-slate-600 mb-1">シース色</label>
            <select className="select-field" value={form.sheathColor} onChange={e => set('sheathColor', e.target.value)}>
              {sheathColors.map(c => <option key={c} value={c}>{c}</option>)}
            </select>
          </div>
          <div>
            <label className="block text-xs font-medium text-slate-600 mb-1">標準導体ピッチ</label>
            <input className="input-field" value={form.conductorPitch} onChange={e => set('conductorPitch', e.target.value)} placeholder="例: 15mm" />
          </div>
          <div>
            <label className="block text-xs font-medium text-slate-600 mb-1">梱包・荷姿</label>
            <select className="select-field" value={form.packaging} onChange={e => set('packaging', e.target.value)}>
              {packagingOptions.map(p => <option key={p} value={p}>{p}</option>)}
            </select>
          </div>
          <div>
            <label className="block text-xs font-medium text-slate-600 mb-1">サンプル条長 (m)</label>
            <input className="input-field" type="number" value={form.sampleLength} onChange={e => set('sampleLength', Number(e.target.value))} />
          </div>
          {/* 規格値 */}
          <div className="sm:col-span-2">
            <label className="block text-xs font-medium text-slate-600 mb-2">規格値（公差基準）</label>
            <div className="grid grid-cols-2 gap-3 bg-slate-50 p-3 rounded-lg">
              <div>
                <div className="text-xs text-slate-500 mb-1">外径 (mm)</div>
                <div className="flex items-center gap-2">
                  <input className="input-field w-20" type="number" value={form.spec.outerDiameter.min} onChange={e => setSpec('outerDiameter','min',e.target.value)} placeholder="最小" />
                  <span className="text-xs text-slate-400">〜</span>
                  <input className="input-field w-20" type="number" value={form.spec.outerDiameter.max} onChange={e => setSpec('outerDiameter','max',e.target.value)} placeholder="最大" />
                </div>
              </div>
              <div>
                <div className="text-xs text-slate-500 mb-1">肉厚 (mm)</div>
                <div className="flex items-center gap-2">
                  <input className="input-field w-20" type="number" value={form.spec.wallThickness.min} onChange={e => setSpec('wallThickness','min',e.target.value)} placeholder="最小" />
                  <span className="text-xs text-slate-400">〜</span>
                  <input className="input-field w-20" type="number" value={form.spec.wallThickness.max} onChange={e => setSpec('wallThickness','max',e.target.value)} placeholder="最大" />
                </div>
              </div>
            </div>
          </div>
          {/* 顧客指定添付書類 */}
          <div className="sm:col-span-2">
            <label className="block text-xs font-medium text-slate-600 mb-2">顧客指定添付書類</label>
            <div className="flex flex-wrap gap-2">
              {docOptions.map(doc => (
                <label key={doc} className="flex items-center gap-1.5 cursor-pointer">
                  <input
                    type="checkbox"
                    checked={form.requiredDocuments.includes(doc)}
                    onChange={() => toggleDoc(doc)}
                    className="rounded"
                  />
                  <span className="text-sm text-slate-700">{doc}</span>
                </label>
              ))}
            </div>
          </div>
        </div>
        {/* 図面データ */}
        <div className="px-4 md:px-6 pb-2">
          <div className="border-t border-slate-100 pt-4">
            <div className="text-xs font-semibold text-slate-500 uppercase tracking-wide mb-3">📐 図面データ・作業条件</div>
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 mb-4">
              <div>
                <label className="block text-xs font-medium text-slate-600 mb-1">図面URL（Google Drive / 社内サーバー等）</label>
                <input
                  className="input-field text-xs"
                  value={form.drawingUrl || ''}
                  onChange={e => set('drawingUrl', e.target.value)}
                  placeholder="https://..."
                />
              </div>
              <div>
                <label className="block text-xs font-medium text-slate-600 mb-1">図面リビジョン</label>
                <input
                  className="input-field"
                  value={form.drawingRevision || ''}
                  onChange={e => set('drawingRevision', e.target.value)}
                  placeholder="Rev.1"
                />
              </div>
            </div>

            {/* 工程別作業条件 */}
            <div className="space-y-2">
              {['絶縁', '対撚り', '集合', '編組', 'シース'].map(proc => {
                const colorMap = {
                  '絶縁': 'border-sky-200 bg-sky-50',
                  '対撚り': 'border-violet-200 bg-violet-50',
                  '集合': 'border-indigo-200 bg-indigo-50',
                  '編組': 'border-amber-200 bg-amber-50',
                  'シース': 'border-emerald-200 bg-emerald-50',
                };
                return (
                  <div key={proc} className={`border rounded-lg p-3 ${colorMap[proc]}`}>
                    <label className="block text-xs font-bold text-slate-700 mb-1">【{proc}】作業条件・注意ポイント</label>
                    <textarea
                      className="w-full border border-slate-200 rounded-lg px-2 py-1.5 text-xs bg-white resize-none focus:outline-none focus:ring-1 focus:ring-blue-400"
                      rows={2}
                      value={(form.workConditions || {})[proc] || ''}
                      onChange={e => setWorkCond(proc, e.target.value)}
                      placeholder={`${proc}工程での注意点・設定値・確認事項を入力...`}
                    />
                  </div>
                );
              })}
            </div>
          </div>
        </div>

        {/* 仮押さえ設定 */}
        <div className="px-4 md:px-6 pb-2">
          <div className="border-t border-slate-100 pt-4">
            <div className="text-xs font-semibold text-slate-500 uppercase tracking-wide mb-3">📌 引当・仮押さえ設定</div>
            <label className="flex items-center gap-3 cursor-pointer select-none">
              <div className="relative">
                <input type="checkbox" className="sr-only"
                  checked={!!form.autoReservation}
                  onChange={e => set('autoReservation', e.target.checked)} />
                <div className={`w-10 h-5 rounded-full transition-colors ${form.autoReservation ? 'bg-blue-600' : 'bg-slate-300'}`} />
                <div className={`absolute top-0.5 left-0.5 w-4 h-4 bg-white rounded-full shadow transition-transform ${form.autoReservation ? 'translate-x-5' : ''}`} />
              </div>
              <div>
                <div className="text-sm font-medium text-slate-700">受注時に自動で仮押さえする</div>
                <div className="text-xs text-slate-400">ONにすると受注登録時にこの製品の在庫を仮押さえ状態にします</div>
              </div>
            </label>
          </div>
        </div>

        {/* ラベル設定 */}
        <div className="px-4 md:px-6 pb-4">
          <div className="border-t border-slate-100 pt-4">
            <div className="text-xs font-semibold text-slate-500 uppercase tracking-wide mb-3">🏷️ ラベル設定</div>
            <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
              <div>
                <label className="block text-xs font-medium text-slate-600 mb-1">使用プリンタ</label>
                <select className="select-field" value={form.labelSettings?.printer || '1号機'}
                  onChange={e => set('labelSettings', { ...form.labelSettings, printer: e.target.value })}>
                  {PRINTERS.map(p => <option key={p} value={p}>{p}</option>)}
                </select>
              </div>
              <div>
                <label className="block text-xs font-medium text-slate-600 mb-1">台紙種類</label>
                <select className="select-field" value={form.labelSettings?.paperType || '標準'}
                  onChange={e => set('labelSettings', { ...form.labelSettings, paperType: e.target.value })}>
                  {PAPER_TYPES.map(p => <option key={p} value={p}>{p}</option>)}
                </select>
              </div>
              <div>
                <label className="block text-xs font-medium text-slate-600 mb-1">検査後貼付</label>
                <select className="select-field" value={String(form.labelSettings?.inspectionRequired ?? false)}
                  onChange={e => set('labelSettings', { ...form.labelSettings, inspectionRequired: e.target.value === 'true' })}>
                  <option value="false">不要</option>
                  <option value="true">要（検査後）</option>
                </select>
              </div>
            </div>
          </div>
        </div>

        <div className="flex justify-end gap-3 px-6 py-4 border-t border-slate-200">
          <button onClick={onClose} className="btn-secondary">キャンセル</button>
          <button onClick={() => onSave(form)} className="btn-primary">保存</button>
        </div>
      </div>
    </div>
  );
}

const colorMap = { '黒': 'bg-gray-800 text-white', '赤': 'bg-red-500 text-white', '緑': 'bg-green-600 text-white', '青': 'bg-blue-500 text-white', '白': 'bg-white text-gray-700 border', '黄': 'bg-yellow-400 text-gray-800' };

// ─── 受注実績モーダル ───────────────────────────────────────────
function OrderHistoryModal({ product, onClose }) {
  const { productOrderHistory, addProductHistoryEntry, updateProductHistoryEntry, deleteProductHistoryEntry } = useApp();
  const entries = productOrderHistory?.[product.productCode] || [];
  const [editEntry, setEditEntry] = useState(null);
  const [showAdd, setShowAdd] = useState(false);

  const blankEntry = () => ({
    id: `POH-${product.productCode}-${Date.now()}`,
    orderNumber: '',
    orderDate: '',
    completedDate: '',
    quantity: '',
    customerName: '',
    machines: Object.fromEntries(PROCESS_ORDER.map(p => [p, ''])),
  });

  const [form, setForm] = useState(blankEntry());

  const openAdd = () => { setForm(blankEntry()); setEditEntry(null); setShowAdd(true); };
  const openEdit = (e) => { setForm({ ...e, machines: { ...e.machines } }); setEditEntry(e); setShowAdd(true); };
  const cancelForm = () => { setShowAdd(false); setEditEntry(null); };

  const saveForm = () => {
    if (editEntry) {
      updateProductHistoryEntry(product.productCode, editEntry.id, form);
    } else {
      addProductHistoryEntry(product.productCode, form);
    }
    setShowAdd(false);
    setEditEntry(null);
  };

  const setMachine = (proc, val) => setForm(f => ({ ...f, machines: { ...f.machines, [proc]: val } }));

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 p-4">
      <div className="bg-white rounded-2xl shadow-2xl w-full max-w-2xl max-h-[90vh] flex flex-col">
        <div className="px-6 py-4 border-b border-slate-200 flex items-start justify-between flex-shrink-0">
          <div>
            <h2 className="font-bold text-slate-800">受注実績 — {product.name}</h2>
            <div className="text-xs text-slate-400 mt-0.5 font-mono">{product.productCode}</div>
          </div>
          <button onClick={onClose} className="text-slate-400 hover:text-slate-600 text-xl ml-4">✕</button>
        </div>

        <div className="flex-1 overflow-y-auto px-6 py-4 space-y-3">
          {entries.length === 0 && !showAdd && (
            <div className="text-center text-sm text-slate-400 py-8">受注実績がありません</div>
          )}

          {entries.map(e => (
            <div key={e.id} className="border border-slate-200 rounded-xl p-4 bg-slate-50">
              <div className="flex items-start justify-between gap-2">
                <div className="space-y-1 flex-1 min-w-0">
                  <div className="flex items-center gap-2 flex-wrap">
                    <span className="font-mono font-bold text-sm text-slate-800">{e.orderNumber}</span>
                    <span className="text-xs text-slate-500">{e.customerName}</span>
                    <span className="text-xs text-slate-400">{e.orderDate} 〜 {e.completedDate}</span>
                    <span className="text-xs font-medium text-slate-700">{Number(e.quantity).toLocaleString()} m</span>
                  </div>
                  <div className="flex flex-wrap gap-2 mt-2">
                    {PROCESS_ORDER.map(proc => {
                      const m = e.machines?.[proc];
                      if (!m) return null;
                      return (
                        <span key={proc} className="flex items-center gap-1 text-xs bg-white border border-slate-200 rounded-lg px-2 py-1">
                          <span className="text-slate-500">{proc}</span>
                          <span className="font-medium text-slate-700">→ {m}</span>
                        </span>
                      );
                    })}
                  </div>
                </div>
                <div className="flex gap-1 shrink-0">
                  <button onClick={() => openEdit(e)}
                    className="text-xs px-2 py-1 rounded border border-blue-200 text-blue-600 hover:bg-blue-50">編集</button>
                  <button onClick={() => deleteProductHistoryEntry(product.productCode, e.id)}
                    className="text-xs px-2 py-1 rounded border border-red-200 text-red-500 hover:bg-red-50">削除</button>
                </div>
              </div>
            </div>
          ))}

          {showAdd && (
            <div className="border-2 border-blue-200 rounded-xl p-4 bg-blue-50/40">
              <h3 className="text-sm font-semibold text-slate-700 mb-3">{editEntry ? '実績を編集' : '実績を追加'}</h3>
              <div className="grid grid-cols-2 gap-3 mb-3">
                <div>
                  <label className="block text-xs text-slate-500 mb-1">受注番号</label>
                  <input className="input-field text-xs" value={form.orderNumber}
                    onChange={e => setForm(f => ({ ...f, orderNumber: e.target.value }))} placeholder="SO-2025-0001" />
                </div>
                <div>
                  <label className="block text-xs text-slate-500 mb-1">得意先名</label>
                  <input className="input-field text-xs" value={form.customerName}
                    onChange={e => setForm(f => ({ ...f, customerName: e.target.value }))} />
                </div>
                <div>
                  <label className="block text-xs text-slate-500 mb-1">受注日</label>
                  <input type="date" className="input-field text-xs" value={form.orderDate}
                    onChange={e => setForm(f => ({ ...f, orderDate: e.target.value }))} />
                </div>
                <div>
                  <label className="block text-xs text-slate-500 mb-1">完了日</label>
                  <input type="date" className="input-field text-xs" value={form.completedDate}
                    onChange={e => setForm(f => ({ ...f, completedDate: e.target.value }))} />
                </div>
                <div>
                  <label className="block text-xs text-slate-500 mb-1">数量 (m)</label>
                  <input type="number" className="input-field text-xs" value={form.quantity}
                    onChange={e => setForm(f => ({ ...f, quantity: e.target.value }))} />
                </div>
              </div>
              <div className="mb-3">
                <div className="text-xs font-medium text-slate-600 mb-2">工程別担当機械</div>
                <div className="grid grid-cols-2 gap-2">
                  {PROCESS_ORDER.map(proc => (
                    <div key={proc}>
                      <label className="block text-xs text-slate-500 mb-1">{proc}</label>
                      <select className="input-field text-xs" value={form.machines[proc] || ''}
                        onChange={e => setMachine(proc, e.target.value)}>
                        <option value="">— 選択 —</option>
                        {(PROCESS_MACHINE_MAP[proc] || []).map(m => (
                          <option key={m} value={m}>{m}</option>
                        ))}
                      </select>
                    </div>
                  ))}
                </div>
              </div>
              <div className="flex gap-2 justify-end">
                <button onClick={cancelForm} className="btn-secondary text-xs px-3 py-1.5">キャンセル</button>
                <button onClick={saveForm} className="btn-primary text-xs px-3 py-1.5">保存</button>
              </div>
            </div>
          )}
        </div>

        <div className="px-6 py-4 border-t border-slate-200 flex justify-between items-center flex-shrink-0">
          <button onClick={openAdd} className="btn-primary text-sm">＋ 実績を追加</button>
          <button onClick={onClose} className="btn-secondary text-sm">閉じる</button>
        </div>
      </div>
    </div>
  );
}

const PRINTERS = ['1号機', '2号機', '3号機'];
const PAPER_TYPES = ['標準', 'TSEマーク', 'PSマーク', 'ULマーク'];

// ─── 試作品マスタタブ ─────────────────────────────────────────────────────────
function PrototypeMasterTab() {
  const {
    prototypes, setPrototypes, prototypeBOMs,
    updatePrototypeBOM, addPrototypeBOMEntry, deletePrototypeBOMEntry,
    transferPrototypeToProduct, materials, copperPrice, calcMaterialPrice,
    customers,
  } = useApp();

  const [search, setSearch] = useState('');
  const [selectedId, setSelectedId] = useState(() => prototypes[0]?.id || '');
  const [subTab, setSubTab] = useState('list');
  const [showAddForm, setShowAddForm] = useState(false);
  const [addBomForm, setAddBomForm] = useState({ process: PROCESS_ORDER[0], materialId: '', qty: '', lossRate: '1.02' });
  const [showNewProtoModal, setShowNewProtoModal] = useState(false);
  const [newProtoForm, setNewProtoForm] = useState({
    prototypeCode: '', name: '', customerCode: '', customerName: '',
    sheathColor: '', designNumber: '', remarks: '',
    spec: { outerDiameter: { min: '', max: '' }, wallThickness: { min: '', max: '' } },
  });
  const [transferConfirm, setTransferConfirm] = useState(null);
  const [transferResult, setTransferResult] = useState(null);

  const filtered = prototypes.filter(p =>
    p.prototypeCode.toLowerCase().includes(search.toLowerCase()) ||
    p.name.toLowerCase().includes(search.toLowerCase()) ||
    p.customerName.includes(search)
  );

  const selected = prototypes.find(p => p.id === selectedId);
  const boms = prototypeBOMs[selectedId] || [];

  const handleAddBOM = () => {
    if (!addBomForm.materialId || !addBomForm.qty) return;
    addPrototypeBOMEntry(selectedId, {
      id: `PB-${Date.now()}`,
      prototypeId: selectedId,
      process: addBomForm.process,
      materialId: addBomForm.materialId,
      qty: parseFloat(addBomForm.qty),
      lossRate: parseFloat(addBomForm.lossRate) || 1.02,
    });
    setShowAddForm(false);
    setAddBomForm({ process: PROCESS_ORDER[0], materialId: '', qty: '', lossRate: '1.02' });
  };

  const handleTransfer = () => {
    const result = transferPrototypeToProduct(transferConfirm);
    setTransferConfirm(null);
    if (result) setTransferResult(result);
  };

  const handleSaveNewProto = () => {
    const seq = String(prototypes.length + 1).padStart(4, '0');
    const newProto = {
      id: `PT${Date.now()}`,
      prototypeCode: newProtoForm.prototypeCode || `PT-${new Date().getFullYear()}-${seq}`,
      name: newProtoForm.name,
      customerCode: newProtoForm.customerCode,
      customerName: newProtoForm.customerName,
      sheathColor: newProtoForm.sheathColor,
      designNumber: newProtoForm.designNumber,
      remarks: newProtoForm.remarks,
      spec: {
        outerDiameter: { min: parseFloat(newProtoForm.spec.outerDiameter.min)||0, max: parseFloat(newProtoForm.spec.outerDiameter.max)||0 },
        wallThickness: { min: parseFloat(newProtoForm.spec.wallThickness.min)||0, max: parseFloat(newProtoForm.spec.wallThickness.max)||0 },
      },
      createdDate: '2026-08-20',
      status: '試作中',
      transferredProductId: null,
      transferredProductCode: null,
      transferredDate: null,
    };
    setPrototypes(prev => [...prev, newProto]);
    setSelectedId(newProto.id);
    setShowNewProtoModal(false);
    setNewProtoForm({ prototypeCode:'', name:'', customerCode:'', customerName:'', sheathColor:'', designNumber:'', remarks:'',
      spec:{ outerDiameter:{min:'',max:''}, wallThickness:{min:'',max:''} } });
  };

  return (
    <div className="space-y-4">
      <div className="flex gap-2 border-b border-slate-200 mb-2">
        {[['list','試作品一覧'],['bom','BOM管理']].map(([id,label]) => (
          <button key={id} onClick={() => setSubTab(id)}
            className={`px-4 py-2 text-sm font-medium border-b-2 -mb-px transition-colors ${subTab===id?'border-amber-500 text-amber-700':'border-transparent text-slate-500 hover:text-slate-700'}`}>
            {label}
          </button>
        ))}
      </div>

      {subTab === 'list' && (
        <>
          <div className="flex items-center gap-3">
            <input className="input-field max-w-xs" placeholder="試作コード・品名・得意先で検索..." value={search} onChange={e => setSearch(e.target.value)} />
            <button onClick={() => setShowNewProtoModal(true)} className="btn-primary">＋ 試作品追加</button>
            <span className="text-xs text-slate-400 ml-auto">{filtered.length}件</span>
          </div>
          <div className="card p-0 overflow-hidden">
            <div className="overflow-x-auto">
              <table className="w-full text-sm">
                <thead className="bg-slate-50 border-b border-slate-200">
                  <tr>
                    {['試作コード','品名','得意先','ステータス','作成日','転記先','操作'].map(h => (
                      <th key={h} className="text-left py-3 px-4 text-xs font-medium text-slate-500 whitespace-nowrap">{h}</th>
                    ))}
                  </tr>
                </thead>
                <tbody>
                  {filtered.map(p => (
                    <tr key={p.id} className="border-b border-slate-100 hover:bg-slate-50">
                      <td className="py-3 px-4 font-mono text-xs text-amber-700 font-semibold whitespace-nowrap">{p.prototypeCode}</td>
                      <td className="py-3 px-4 text-slate-800 whitespace-nowrap">{p.name}</td>
                      <td className="py-3 px-4 text-slate-600 whitespace-nowrap">{p.customerName}</td>
                      <td className="py-3 px-4">
                        <span className={`badge ${p.status==='転記済'?'bg-green-100 text-green-700':'bg-amber-100 text-amber-700'}`}>{p.status}</span>
                      </td>
                      <td className="py-3 px-4 font-mono text-xs text-slate-500">{p.createdDate}</td>
                      <td className="py-3 px-4 font-mono text-xs">
                        {p.transferredProductCode
                          ? <span className="text-green-700 font-semibold">{p.transferredProductCode}</span>
                          : <span className="text-slate-300">—</span>}
                      </td>
                      <td className="py-3 px-4">
                        <div className="flex gap-2">
                          <button onClick={() => { setSelectedId(p.id); setSubTab('bom'); }} className="text-xs text-purple-600 hover:underline whitespace-nowrap">BOM</button>
                          {p.status !== '転記済' && (
                            <button onClick={() => setTransferConfirm(p.id)}
                              className="text-xs bg-blue-600 text-white px-2 py-0.5 rounded hover:bg-blue-700 whitespace-nowrap">
                              製品マスタへ転記
                            </button>
                          )}
                        </div>
                      </td>
                    </tr>
                  ))}
                  {filtered.length === 0 && (
                    <tr><td colSpan={7} className="py-8 text-center text-slate-400 text-sm">試作品がありません</td></tr>
                  )}
                </tbody>
              </table>
            </div>
          </div>
        </>
      )}

      {subTab === 'bom' && (
        <div className="card p-4">
          <div className="flex items-center gap-3 mb-4">
            <label className="text-sm text-slate-600 font-medium">試作品：</label>
            <select value={selectedId} onChange={e => setSelectedId(e.target.value)} className="select-field max-w-xs">
              {prototypes.map(p => <option key={p.id} value={p.id}>{p.prototypeCode} — {p.name}</option>)}
            </select>
          </div>

          {selected && (
            <>
              <div className="flex items-center justify-between mb-3">
                <h4 className="font-semibold text-slate-700 text-sm">BOM一覧（{selected.name}）</h4>
                <button onClick={() => setShowAddForm(v => !v)} className="text-xs text-blue-600 hover:underline">＋ 材料追加</button>
              </div>

              {showAddForm && (
                <div className="bg-slate-50 rounded-lg p-3 mb-3 grid grid-cols-2 sm:grid-cols-4 gap-2">
                  <div>
                    <label className="text-xs text-slate-500 block mb-1">工程</label>
                    <select value={addBomForm.process} onChange={e => setAddBomForm(f => ({...f, process: e.target.value}))} className="select-field">
                      {PROCESS_ORDER.map(p => <option key={p}>{p}</option>)}
                    </select>
                  </div>
                  <div>
                    <label className="text-xs text-slate-500 block mb-1">材料</label>
                    <select value={addBomForm.materialId} onChange={e => setAddBomForm(f => ({...f, materialId: e.target.value}))} className="select-field">
                      <option value="">選択...</option>
                      {materials.map(m => <option key={m.id} value={m.id}>{m.name}</option>)}
                    </select>
                  </div>
                  <div>
                    <label className="text-xs text-slate-500 block mb-1">使用量(m/100m)</label>
                    <input type="number" value={addBomForm.qty} onChange={e => setAddBomForm(f => ({...f, qty: e.target.value}))} className="input-field" placeholder="例: 102" />
                  </div>
                  <div>
                    <label className="text-xs text-slate-500 block mb-1">ロス率</label>
                    <input type="number" value={addBomForm.lossRate} onChange={e => setAddBomForm(f => ({...f, lossRate: e.target.value}))} className="input-field" step="0.01" />
                  </div>
                  <div className="sm:col-span-4 flex gap-2 justify-end">
                    <button onClick={() => setShowAddForm(false)} className="btn-secondary text-xs">キャンセル</button>
                    <button onClick={handleAddBOM} className="btn-primary text-xs">追加</button>
                  </div>
                </div>
              )}

              <div className="overflow-x-auto">
                <table className="w-full text-sm">
                  <thead className="bg-slate-50 border-b border-slate-200">
                    <tr>
                      {['工程','材料名','使用量','ロス率','単価','削除'].map(h => (
                        <th key={h} className="text-left py-2 px-3 text-xs font-medium text-slate-500">{h}</th>
                      ))}
                    </tr>
                  </thead>
                  <tbody>
                    {boms.length === 0 && (
                      <tr><td colSpan={6} className="py-6 text-center text-slate-400 text-sm">BOMがまだ登録されていません</td></tr>
                    )}
                    {boms.map(b => {
                      const mat = materials.find(m => m.id === b.materialId);
                      const unitPrice = mat ? calcMaterialPrice(mat, null, copperPrice) : 0;
                      return (
                        <tr key={b.id} className="border-b border-slate-100 hover:bg-slate-50">
                          <td className="py-2 px-3">
                            <span className={`badge text-xs ${PROCESS_COLORS[b.process] || 'bg-slate-100 text-slate-600'}`}>{b.process}</span>
                          </td>
                          <td className="py-2 px-3 text-slate-700">{mat?.name || b.materialId}</td>
                          <td className="py-2 px-3 font-mono text-slate-700">{b.qty}</td>
                          <td className="py-2 px-3 font-mono text-slate-700">{b.lossRate}</td>
                          <td className="py-2 px-3 font-mono text-slate-600">¥{unitPrice.toLocaleString(undefined,{maximumFractionDigits:1})}</td>
                          <td className="py-2 px-3">
                            <button onClick={() => deletePrototypeBOMEntry(selectedId, b.id)} className="text-xs text-red-500 hover:text-red-700">削除</button>
                          </td>
                        </tr>
                      );
                    })}
                  </tbody>
                </table>
              </div>
            </>
          )}
        </div>
      )}

      {/* 転記確認ダイアログ */}
      {transferConfirm && (() => {
        const proto = prototypes.find(p => p.id === transferConfirm);
        return (
          <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40">
            <div className="bg-white rounded-xl shadow-2xl max-w-sm w-full p-6 mx-4">
              <div className="text-3xl mb-3 text-center">📋</div>
              <h3 className="font-bold text-center mb-2 text-slate-800">製品マスタへ転記</h3>
              <p className="text-sm text-slate-600 text-center mb-1">
                <span className="font-semibold text-amber-700">{proto?.prototypeCode}</span>
              </p>
              <p className="text-sm text-slate-600 text-center mb-4">
                を製品マスタへ転記します。製品コードは自動発行されます。
              </p>
              <div className="flex gap-3">
                <button onClick={() => setTransferConfirm(null)} className="flex-1 btn-secondary">キャンセル</button>
                <button onClick={handleTransfer} className="flex-1 btn-primary">転記する</button>
              </div>
            </div>
          </div>
        );
      })()}

      {/* 転記完了通知 */}
      {transferResult && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40">
          <div className="bg-white rounded-xl shadow-2xl max-w-sm w-full p-6 mx-4">
            <div className="text-3xl mb-3 text-center">✅</div>
            <h3 className="font-bold text-center mb-2 text-slate-800">転記完了</h3>
            <p className="text-sm text-slate-600 text-center mb-1">製品コード：<span className="font-mono font-bold text-blue-700">{transferResult.productCode}</span></p>
            <p className="text-xs text-slate-400 text-center mb-4">製品マスタで内容を確認・編集してください。</p>
            <button onClick={() => setTransferResult(null)} className="w-full btn-primary">閉じる</button>
          </div>
        </div>
      )}

      {/* 新規試作品モーダル */}
      {showNewProtoModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 p-3">
          <div className="bg-white rounded-xl shadow-2xl w-full max-w-lg max-h-[90vh] flex flex-col">
            <div className="flex items-center justify-between px-6 py-4 border-b border-slate-200">
              <h2 className="font-bold text-slate-800">試作品マスタ追加</h2>
              <button onClick={() => setShowNewProtoModal(false)} className="text-slate-400 hover:text-slate-600 text-xl">✕</button>
            </div>
            <div className="overflow-y-auto flex-1 px-6 py-5 space-y-4">
              <div className="grid grid-cols-2 gap-3">
                <div><label className="text-xs text-slate-500 block mb-1">試作コード（省略時は自動発行）</label>
                  <input value={newProtoForm.prototypeCode} onChange={e => setNewProtoForm(f=>({...f,prototypeCode:e.target.value}))} className="input-field" placeholder="PT-YYYY-XXXX" /></div>
                <div><label className="text-xs text-slate-500 block mb-1">品名 <span className="text-red-500">*</span></label>
                  <input value={newProtoForm.name} onChange={e => setNewProtoForm(f=>({...f,name:e.target.value}))} className="input-field" placeholder="試作品名称" /></div>
                <div><label className="text-xs text-slate-500 block mb-1">得意先コード</label>
                  <input value={newProtoForm.customerCode} onChange={e => setNewProtoForm(f=>({...f,customerCode:e.target.value}))} className="input-field" placeholder="例: C001" /></div>
                <div><label className="text-xs text-slate-500 block mb-1">得意先名称</label>
                  <input value={newProtoForm.customerName} onChange={e => setNewProtoForm(f=>({...f,customerName:e.target.value}))} className="input-field" /></div>
                <div><label className="text-xs text-slate-500 block mb-1">シース色</label>
                  <input value={newProtoForm.sheathColor} onChange={e => setNewProtoForm(f=>({...f,sheathColor:e.target.value}))} className="input-field" placeholder="黒" /></div>
                <div><label className="text-xs text-slate-500 block mb-1">設計書番号</label>
                  <input value={newProtoForm.designNumber} onChange={e => setNewProtoForm(f=>({...f,designNumber:e.target.value}))} className="input-field" placeholder="TF-PROTO-XXXX" /></div>
                <div><label className="text-xs text-slate-500 block mb-1">外径 min</label>
                  <input type="number" step="0.1" value={newProtoForm.spec.outerDiameter.min} onChange={e => setNewProtoForm(f=>({...f,spec:{...f.spec,outerDiameter:{...f.spec.outerDiameter,min:e.target.value}}}))} className="input-field" /></div>
                <div><label className="text-xs text-slate-500 block mb-1">外径 max</label>
                  <input type="number" step="0.1" value={newProtoForm.spec.outerDiameter.max} onChange={e => setNewProtoForm(f=>({...f,spec:{...f.spec,outerDiameter:{...f.spec.outerDiameter,max:e.target.value}}}))} className="input-field" /></div>
              </div>
              <div><label className="text-xs text-slate-500 block mb-1">備考</label>
                <textarea value={newProtoForm.remarks} onChange={e => setNewProtoForm(f=>({...f,remarks:e.target.value}))} rows={3} className="input-field w-full resize-none" /></div>
            </div>
            <div className="px-6 py-4 border-t border-slate-200 flex gap-3 justify-end">
              <button onClick={() => setShowNewProtoModal(false)} className="btn-secondary px-6">キャンセル</button>
              <button onClick={handleSaveNewProto} disabled={!newProtoForm.name} className="btn-primary px-6 disabled:opacity-40">登録</button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

export default function ProductMaster() {
  const { products, setProducts, customers } = useApp();
  const [search, setSearch] = useState('');
  const [editTarget, setEditTarget] = useState(null);
  const [showModal, setShowModal] = useState(false);
  const [activeTab, setActiveTab] = useState('products');
  const [historyTarget, setHistoryTarget] = useState(null);
  const [bomProductId, setBomProductId] = useState(() => products[0]?.id || '');

  const openBOM = (product) => {
    setBomProductId(product.id);
    setActiveTab('bom');
  };

  const filtered = products.filter(p =>
    p.productCode.toLowerCase().includes(search.toLowerCase()) ||
    p.name.toLowerCase().includes(search.toLowerCase()) ||
    p.customerName.includes(search)
  );

  const handleSave = (form) => {
    if (editTarget) {
      setProducts(ps => ps.map(p => p.id === editTarget.id ? { ...p, ...form } : p));
    } else {
      setProducts(ps => [...ps, { ...form, id: `P${String(ps.length + 1).padStart(3, '0')}` }]);
    }
    setShowModal(false);
    setEditTarget(null);
  };

  return (
    <div className="space-y-4">
      {/* Tab */}
      <div className="flex gap-2 border-b border-slate-200">
        {[['products', '製品一覧'], ['bom', 'BOM管理'], ['prototypes', '試作品マスタ']].map(([id, label]) => (
          <button key={id} onClick={() => setActiveTab(id)}
            className={`px-4 py-2 text-sm font-medium border-b-2 -mb-px transition-colors ${activeTab === id ? 'border-blue-700 text-blue-700' : 'border-transparent text-slate-500 hover:text-slate-700'}`}>
            {label}
          </button>
        ))}
      </div>

      {activeTab === 'products' && (
        <>
          <div className="flex items-center gap-3">
            <input
              className="input-field max-w-xs"
              placeholder="製品コード・製品名・得意先で検索..."
              value={search}
              onChange={e => setSearch(e.target.value)}
            />
            <button onClick={() => { setEditTarget(null); setShowModal(true); }} className="btn-primary">
              ＋ 製品追加
            </button>
            <span className="text-xs text-slate-400 ml-auto">{filtered.length}件</span>
          </div>

          <div className="card p-0 overflow-hidden">
            <div className="overflow-x-auto">
              <table className="w-full text-sm">
                <thead className="bg-slate-50 border-b border-slate-200">
                  <tr>
                    {['製品コード', '製品名', '得意先', 'シース色', '梱包', '添付書類', 'ラベル', '仮押さえ', '操作'].map(h => (
                      <th key={h} className="text-left py-3 px-4 text-xs font-medium text-slate-500 whitespace-nowrap">{h}</th>
                    ))}
                  </tr>
                </thead>
                <tbody>
                  {filtered.map(p => (
                    <tr key={p.id} className="border-b border-slate-100 table-row">
                      <td className="py-3 px-4 font-mono text-xs text-slate-600 whitespace-nowrap">{p.productCode}</td>
                      <td className="py-3 px-4 font-medium text-slate-800 whitespace-nowrap">{p.name}</td>
                      <td className="py-3 px-4 text-slate-600 whitespace-nowrap">{p.customerName}</td>
                      <td className="py-3 px-4">
                        <span className={`badge ${colorMap[p.sheathColor] || 'bg-slate-100 text-slate-600'}`}>{p.sheathColor}</span>
                      </td>
                      <td className="py-3 px-4 text-slate-600 whitespace-nowrap text-xs">{p.packaging}</td>
                      <td className="py-3 px-4">
                        <div className="flex flex-wrap gap-1">
                          {p.requiredDocuments.map(d => (
                            <span key={d} className="badge bg-blue-50 text-blue-600 text-xs">{d}</span>
                          ))}
                        </div>
                      </td>
                      <td className="py-3 px-4">
                        <span className="text-xs bg-blue-50 text-blue-700 px-1.5 py-0.5 rounded font-medium">{p.labelSettings?.printer || '-'}</span>
                      </td>
                      <td className="py-3 px-4">
                        {p.autoReservation
                          ? <span className="text-xs bg-amber-50 text-amber-700 border border-amber-200 px-1.5 py-0.5 rounded font-medium">📌 自動</span>
                          : <span className="text-xs text-slate-300">—</span>
                        }
                      </td>
                      <td className="py-3 px-4">
                        <div className="flex items-center gap-2">
                          <button onClick={() => { setEditTarget(p); setShowModal(true); }}
                            className="text-xs text-blue-600 hover:underline whitespace-nowrap">編集</button>
                          <button onClick={() => openBOM(p)}
                            className="text-xs text-purple-600 hover:underline whitespace-nowrap">BOM</button>
                          <button onClick={() => setHistoryTarget(p)}
                            className="text-xs text-emerald-600 hover:underline whitespace-nowrap">受注実績</button>
                        </div>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>
        </>
      )}

      {activeTab === 'bom' && (
        <div className="card p-4">
          <BOMTab
            products={products}
            selectedProductId={bomProductId}
            setSelectedProductId={setBomProductId}
          />
        </div>
      )}

      {activeTab === 'prototypes' && (
        <PrototypeMasterTab />
      )}

      {showModal && (
        <ProductModal
          product={editTarget}
          onClose={() => { setShowModal(false); setEditTarget(null); }}
          onSave={handleSave}
        />
      )}
      {historyTarget && (
        <OrderHistoryModal
          product={historyTarget}
          onClose={() => setHistoryTarget(null)}
        />
      )}
    </div>
  );
}
