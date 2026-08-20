import { useState, useMemo } from 'react';
import { useApp } from '../context/AppContext';

const STATUS_COLORS = {
  '引当済':   'bg-green-100 text-green-700',
  '一部引当': 'bg-yellow-100 text-yellow-700',
  '未引当':   'bg-slate-100 text-slate-600',
  '不足':     'bg-red-100 text-red-700',
};
const PO_STATUS_COLORS = {
  '発注済':       'bg-blue-100 text-blue-700',
  '納期確認待ち': 'bg-yellow-100 text-yellow-700',
  '入荷待ち':     'bg-purple-100 text-purple-700',
  '一部入荷':     'bg-orange-100 text-orange-700',
  '完納':         'bg-green-100 text-green-700',
};

// 試作用原材料のIDプレフィックス
const PROTO_MAT_PREFIX = '__proto__:';

// ─── 発注書モーダル ────────────────────────────────────────────
function PurchaseOrderModal({ initialMaterial, onClose, onSave }) {
  const { suppliers, materials, materialReorderConfig, prototypeBOMs } = useApp();
  const cfg = initialMaterial ? materialReorderConfig[initialMaterial.id] : null;
  const defaultSupplier = cfg ? suppliers.find(s => s.id === cfg.defaultSupplierId) : null;

  // 全試作BOMs から試作用原材料を収集（重複排除）
  const protoMaterials = useMemo(() => {
    const seen = new Set();
    const result = [];
    Object.values(prototypeBOMs).forEach(boms => {
      (boms || []).filter(b => b.isPrototypeMaterial && b.customMaterialName).forEach(b => {
        if (!seen.has(b.customMaterialName)) {
          seen.add(b.customMaterialName);
          result.push({ id: `${PROTO_MAT_PREFIX}${b.customMaterialName}`, name: b.customMaterialName });
        }
      });
    });
    return result;
  }, [prototypeBOMs]);

  const today = '2026-05-21';
  const [form, setForm] = useState({
    materialId:   initialMaterial?.id   || '',
    materialName: initialMaterial?.name || '',
    supplierId:   defaultSupplier?.id   || '',
    supplierName: defaultSupplier?.name || '',
    orderedQty:   cfg?.orderLot         || '',
    unitPrice:    initialMaterial?.standardPrice || '',
    requestedDeliveryDate: '',
    notes: '',
  });

  const set = (k, v) => setForm(f => ({ ...f, [k]: v }));
  const isProtoMat = form.materialId.startsWith(PROTO_MAT_PREFIX);
  // 試作用は仕入先制限なし（マスタに materialIds 登録がないため）
  const availableSuppliers = (!form.materialId || isProtoMat)
    ? suppliers
    : suppliers.filter(s => s.materialIds.includes(form.materialId));
  const selectedMat = materials.find(m => m.id === form.materialId);

  const handleSave = () => {
    if (!form.materialId || !form.supplierId || !form.orderedQty) return;
    const sup = suppliers.find(s => s.id === form.supplierId);
    const matName = isProtoMat
      ? form.materialId.slice(PROTO_MAT_PREFIX.length)
      : (selectedMat?.name || form.materialName);
    onSave({
      id: `PO-${Date.now()}`,
      poNumber: `PO-${today.replace(/-/g,'')}-${String(Date.now()).slice(-4)}`,
      supplierId: form.supplierId,
      supplierName: sup?.name || '',
      materialId: form.materialId,
      materialName: matName,
      isPrototypeMaterial: isProtoMat,
      unit: 'kg',
      orderedQty: Number(form.orderedQty),
      unitPrice: Number(form.unitPrice),
      totalAmount: Number(form.orderedQty) * Number(form.unitPrice),
      orderedDate: today,
      requestedDeliveryDate: form.requestedDeliveryDate,
      confirmedDeliveryDate: null,
      status: '発注済',
      relatedAllocationIds: [],
      notes: form.notes,
    });
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 p-4">
      <div className="bg-white rounded-2xl shadow-2xl w-full max-w-lg">
        <div className="px-6 py-4 border-b border-slate-200 flex items-center justify-between">
          <h2 className="font-bold text-slate-800">発注書作成</h2>
          <button onClick={onClose} className="text-slate-400 hover:text-slate-600 text-xl">✕</button>
        </div>
        <div className="p-6 space-y-4">
          <div className="grid grid-cols-2 gap-4">
            <div className="col-span-2">
              <label className="block text-xs text-slate-500 mb-1">原材料 *</label>
              <select className="input-field text-sm" value={form.materialId}
                onChange={e => {
                  const val = e.target.value;
                  const m = materials.find(x => x.id === val);
                  const cfg2 = materialReorderConfig[val];
                  const sup2 = cfg2 ? suppliers.find(s => s.id === cfg2.defaultSupplierId) : null;
                  setForm(f => ({
                    ...f,
                    materialId: val,
                    materialName: m?.name || (val.startsWith(PROTO_MAT_PREFIX) ? val.slice(PROTO_MAT_PREFIX.length) : ''),
                    unitPrice: m?.standardPrice || '',
                    orderedQty: cfg2?.orderLot || '',
                    supplierId: sup2?.id || '',
                    supplierName: sup2?.name || '',
                  }));
                }}>
                <option value="">— 選択 —</option>
                {materials.map(m => <option key={m.id} value={m.id}>{m.name}</option>)}
                {protoMaterials.length > 0 && (
                  <>
                    <option disabled>──── 試作品用原材料 ────</option>
                    {protoMaterials.map(m => (
                      <option key={m.id} value={m.id}>【試作用】{m.name}</option>
                    ))}
                  </>
                )}
              </select>
              {isProtoMat && (
                <div className="mt-1 flex items-center gap-1.5">
                  <span className="inline-block px-1.5 py-0 bg-amber-100 text-amber-700 border border-amber-300 rounded text-xs font-semibold leading-5">試作用</span>
                  <span className="text-xs text-slate-500">試作品用原材料のため仕入先制限なし</span>
                </div>
              )}
            </div>
            <div className="col-span-2">
              <label className="block text-xs text-slate-500 mb-1">仕入先 *</label>
              <select className="input-field text-sm" value={form.supplierId}
                onChange={e => {
                  const s = suppliers.find(x => x.id === e.target.value);
                  set('supplierId', e.target.value);
                  set('supplierName', s?.name || '');
                }}>
                <option value="">— 選択 —</option>
                {availableSuppliers.map(s => <option key={s.id} value={s.id}>{s.name}</option>)}
              </select>
            </div>
            <div>
              <label className="block text-xs text-slate-500 mb-1">発注数量 (kg) *</label>
              <input type="number" className="input-field text-sm" value={form.orderedQty}
                onChange={e => set('orderedQty', e.target.value)} />
            </div>
            <div>
              <label className="block text-xs text-slate-500 mb-1">単価 (円/kg)</label>
              <input type="number" className="input-field text-sm" value={form.unitPrice}
                onChange={e => set('unitPrice', e.target.value)} />
            </div>
            <div>
              <label className="block text-xs text-slate-500 mb-1">希望納期</label>
              <input type="date" className="input-field text-sm" value={form.requestedDeliveryDate}
                onChange={e => set('requestedDeliveryDate', e.target.value)} />
            </div>
            <div className="flex items-end">
              <div className="text-sm font-bold text-slate-700">
                合計: ¥{(Number(form.orderedQty || 0) * Number(form.unitPrice || 0)).toLocaleString()}
              </div>
            </div>
          </div>
          <div>
            <label className="block text-xs text-slate-500 mb-1">備考</label>
            <textarea className="input-field text-sm resize-none" rows={2} value={form.notes}
              onChange={e => set('notes', e.target.value)} />
          </div>
        </div>
        <div className="px-6 py-4 border-t border-slate-200 flex gap-3 justify-end">
          <button onClick={onClose} className="btn-secondary text-sm">キャンセル</button>
          <button onClick={handleSave} className="btn-primary text-sm">発注する</button>
        </div>
      </div>
    </div>
  );
}

// ─── 納期回答入力モーダル ──────────────────────────────────────
function DeliveryConfirmModal({ po, onClose, onSave }) {
  const [date, setDate] = useState(po.confirmedDeliveryDate || po.requestedDeliveryDate || '');
  const [notes, setNotes] = useState(po.notes || '');
  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 p-4">
      <div className="bg-white rounded-2xl shadow-2xl w-full max-w-md">
        <div className="px-6 py-4 border-b border-slate-200 flex items-center justify-between">
          <h2 className="font-bold text-slate-800">納期回答入力</h2>
          <button onClick={onClose} className="text-slate-400 hover:text-slate-600 text-xl">✕</button>
        </div>
        <div className="p-6 space-y-4">
          <div className="bg-slate-50 rounded-xl p-4 text-sm space-y-1">
            <div><span className="text-slate-500">発注番号：</span><span className="font-mono font-bold">{po.poNumber}</span></div>
            <div><span className="text-slate-500">仕入先：</span>{po.supplierName}</div>
            <div><span className="text-slate-500">材料：</span>{po.materialName} {po.orderedQty}kg</div>
            <div><span className="text-slate-500">希望納期：</span>{po.requestedDeliveryDate}</div>
          </div>
          <div>
            <label className="block text-xs text-slate-500 mb-1">仕入先確認納期 *</label>
            <input type="date" className="input-field" value={date} onChange={e => setDate(e.target.value)} />
          </div>
          <div>
            <label className="block text-xs text-slate-500 mb-1">備考</label>
            <textarea className="input-field resize-none" rows={2} value={notes}
              onChange={e => setNotes(e.target.value)} />
          </div>
        </div>
        <div className="px-6 py-4 border-t border-slate-200 flex gap-3 justify-end">
          <button onClick={onClose} className="btn-secondary text-sm">キャンセル</button>
          <button onClick={() => onSave({ confirmedDeliveryDate: date, status: '入荷待ち', notes })}
            className="btn-primary text-sm">確定</button>
        </div>
      </div>
    </div>
  );
}

// ─── 在庫推移グラフ ────────────────────────────────────────────
function StockTransitionChart({ material, onClose }) {
  const { currentStock, materialAllocations, materialReceiving, purchaseOrders, orders, materialReorderConfig } = useApp();
  const matId = material.id;
  const cfg = materialReorderConfig[matId] || {};
  const todayStr = '2026-05-21';

  // イベントマップ構築（日付 → 入荷/引当）
  const eventMap = useMemo(() => {
    const map = {};
    const add = (date, type, qty, label) => {
      if (!date || date < todayStr) return;
      if (!map[date]) map[date] = { incoming: 0, allocation: 0, labels: [] };
      map[date][type] += qty;
      map[date].labels.push(label);
    };
    materialReceiving.forEach(rcv => {
      if (rcv.materialId !== matId || rcv.status === '検品完了') return;
      if (rcv.scheduledDate) add(rcv.scheduledDate, 'incoming', rcv.orderedQty || 0, `入荷 ${rcv.orderedQty}kg`);
    });
    materialAllocations.forEach(alloc => {
      if (alloc.materialId !== matId) return;
      if (!['引当済','一部引当'].includes(alloc.status)) return;
      const order = orders.find(o => o.id === alloc.orderId);
      if (order?.finalDeadline) add(order.finalDeadline, 'allocation', alloc.allocatedQty || 0, `引当 ${order.orderNumber} -${alloc.allocatedQty}kg`);
    });
    return map;
  }, [matId, materialReceiving, purchaseOrders, materialAllocations, orders]);

  // タイムライン（today + イベント日）
  const timeline = useMemo(() => {
    const dates = [todayStr, ...Object.keys(eventMap)].filter((d, i, a) => a.indexOf(d) === i).sort();
    let stock = currentStock[matId] || 0;
    return dates.map(date => {
      const ev = eventMap[date] || { incoming: 0, allocation: 0, labels: [] };
      const before = stock;
      stock = Math.max(0, before + ev.incoming - ev.allocation);
      return { date, stock, before, incoming: ev.incoming, allocation: ev.allocation, labels: ev.labels };
    });
  }, [eventMap, currentStock, matId]);

  // SVG寸法
  const W = 680, H = 288;
  const ML = 58, MR = 56, MT = 18, MB = 46;
  const CW = W - ML - MR;
  const STOCK_H = 152;
  const SEP_Y = MT + STOCK_H;
  const BAR_TOP = SEP_Y + 8;
  const BAR_H = 60;
  const BAR_ZERO = BAR_TOP + BAR_H / 2;

  const maxStockVal = Math.max(currentStock[matId] || 0, ...timeline.map(d => d.stock), (cfg.reorderPoint || 0) * 1.4) * 1.15;
  const maxBar = Math.max(1, ...timeline.map(d => Math.max(d.incoming, d.allocation)));
  const BAR_MAX = BAR_H * 0.45;

  const n = timeline.length;
  const xOf = (i) => ML + (n <= 1 ? CW / 2 : (i / (n - 1)) * CW);
  const yStock = (qty) => MT + STOCK_H * (1 - Math.min(qty, maxStockVal) / maxStockVal);
  const barH = (qty) => (qty / maxBar) * BAR_MAX;
  const bw = Math.max(5, Math.min(22, CW / Math.max(1, n) * 0.38));

  // ステップライン（在庫推移）
  let path = '';
  timeline.forEach((d, i) => {
    const x = xOf(i), y = yStock(d.stock);
    if (i === 0) { path = `M ${x} ${y}`; return; }
    path += ` L ${x} ${yStock(timeline[i-1].stock)} L ${x} ${y}`;
  });

  const fmtD = (d) => { const [, m, day] = d.split('-'); return `${+m}/${+day}`; };
  const tickStep = Math.max(1, Math.floor(n / 6));

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 p-4" onClick={onClose}>
      <div className="bg-white rounded-2xl shadow-2xl w-full max-w-3xl" onClick={e => e.stopPropagation()}>
        <div className="flex items-center justify-between px-6 py-4 border-b border-slate-200">
          <div>
            <h3 className="font-bold text-slate-800">📈 在庫推移グラフ</h3>
            <p className="text-xs text-slate-500 mt-0.5">{material.name}　現在庫: {currentStock[matId] || 0}kg</p>
          </div>
          <button onClick={onClose} className="text-2xl text-slate-400 hover:text-slate-600 leading-none w-8 h-8 flex items-center justify-center rounded-lg hover:bg-slate-100">×</button>
        </div>
        <div className="px-5 py-4">
          {/* 凡例 */}
          <div className="flex flex-wrap items-center gap-4 text-xs text-slate-600 mb-3">
            <span className="flex items-center gap-1.5"><span className="w-4 h-0.5 bg-blue-500 inline-block rounded"></span>在庫量</span>
            <span className="flex items-center gap-1.5"><span className="w-3 h-3 bg-green-400 rounded inline-block"></span>入荷（＋）</span>
            <span className="flex items-center gap-1.5"><span className="w-3 h-3 bg-orange-400 rounded inline-block"></span>引当（－）</span>
            {cfg.reorderPoint && <span className="flex items-center gap-1.5"><span className="w-4 border-t-2 border-dashed border-orange-500 inline-block align-middle"></span>発注点 {cfg.reorderPoint}kg</span>}
            {cfg.safetyStock  && <span className="flex items-center gap-1.5"><span className="w-4 border-t-2 border-dashed border-red-500 inline-block align-middle"></span>安全在庫 {cfg.safetyStock}kg</span>}
          </div>

          <svg viewBox={`0 0 ${W} ${H}`} className="w-full rounded-xl border border-slate-100 bg-slate-50/40">
            {/* Y軸グリッド */}
            {[0, 0.25, 0.5, 0.75, 1].map(t => {
              const qty = maxStockVal * t, y = yStock(qty);
              return (
                <g key={t}>
                  <line x1={ML} y1={y} x2={ML+CW} y2={y} stroke="#e2e8f0" strokeWidth={t===0||t===1?'1':'0.5'} />
                  <text x={ML-4} y={y+4} textAnchor="end" fontSize="10" fill="#94a3b8">{Math.round(qty)}</text>
                </g>
              );
            })}

            {/* 発注点 */}
            {cfg.reorderPoint && yStock(cfg.reorderPoint) > MT && yStock(cfg.reorderPoint) < SEP_Y && (
              <g>
                <line x1={ML} y1={yStock(cfg.reorderPoint)} x2={ML+CW} y2={yStock(cfg.reorderPoint)} stroke="#f97316" strokeWidth="1.5" strokeDasharray="5,3" />
                <text x={ML+CW+3} y={yStock(cfg.reorderPoint)+4} fontSize="9" fill="#f97316">発注点</text>
              </g>
            )}
            {/* 安全在庫 */}
            {cfg.safetyStock && yStock(cfg.safetyStock) > MT && yStock(cfg.safetyStock) < SEP_Y && (
              <g>
                <line x1={ML} y1={yStock(cfg.safetyStock)} x2={ML+CW} y2={yStock(cfg.safetyStock)} stroke="#ef4444" strokeWidth="1.5" strokeDasharray="5,3" />
                <text x={ML+CW+3} y={yStock(cfg.safetyStock)+4} fontSize="9" fill="#ef4444">安全在庫</text>
              </g>
            )}

            {/* 在庫ステップライン */}
            <path d={path} fill="none" stroke="#3b82f6" strokeWidth="2.5" strokeLinejoin="round" />

            {/* 在庫量ドット（発注点以下は赤） */}
            {timeline.map((d, i) => {
              const isLow = cfg.reorderPoint && d.stock <= cfg.reorderPoint;
              return <circle key={d.date} cx={xOf(i)} cy={yStock(d.stock)} r="3.5"
                fill={isLow ? '#ef4444' : '#3b82f6'} stroke="white" strokeWidth="1.5" />;
            })}

            {/* セパレーター */}
            <line x1={ML} y1={SEP_Y+4} x2={ML+CW} y2={SEP_Y+4} stroke="#e2e8f0" strokeWidth="1" />
            <text x={ML-4} y={BAR_ZERO+3} textAnchor="end" fontSize="9" fill="#94a3b8">0</text>
            <line x1={ML} y1={BAR_ZERO} x2={ML+CW} y2={BAR_ZERO} stroke="#cbd5e1" strokeWidth="0.5" strokeDasharray="3,2" />

            {/* 入荷・引当バー */}
            {timeline.map((d, i) => {
              const x = xOf(i);
              return (
                <g key={d.date}>
                  {d.incoming > 0 && (
                    <rect x={x - bw - 0.5} y={BAR_ZERO - barH(d.incoming)}
                      width={bw} height={barH(d.incoming)}
                      fill="#4ade80" fillOpacity="0.85" rx="2" />
                  )}
                  {d.allocation > 0 && (
                    <rect x={x + 0.5} y={BAR_ZERO}
                      width={bw} height={barH(d.allocation)}
                      fill="#fb923c" fillOpacity="0.85" rx="2" />
                  )}
                </g>
              );
            })}

            {/* 今日マーカー */}
            <line x1={xOf(0)} y1={MT} x2={xOf(0)} y2={SEP_Y} stroke="#6366f1" strokeWidth="1.5" strokeDasharray="3,2" opacity="0.7" />
            <text x={xOf(0)+3} y={MT+9} fontSize="9" fill="#6366f1">今日</text>

            {/* X軸ラベル */}
            {timeline.map((d, i) => (
              (i === 0 || i === n-1 || i % tickStep === 0) && (
                <text key={d.date} x={xOf(i)} y={H-MB+16} textAnchor="middle" fontSize="10" fill="#64748b">{fmtD(d.date)}</text>
              )
            ))}

            {/* チャートエリア枠 */}
            <rect x={ML} y={MT} width={CW} height={STOCK_H} fill="none" stroke="#e2e8f0" strokeWidth="1" />
          </svg>

          {/* イベント一覧 */}
          {Object.keys(eventMap).length > 0 ? (
            <div className="mt-3 max-h-28 overflow-y-auto border border-slate-100 rounded-xl divide-y divide-slate-50">
              {Object.entries(eventMap).sort(([a],[b]) => a.localeCompare(b)).map(([date, ev]) => (
                <div key={date} className="flex items-center gap-3 px-3 py-1.5 text-xs hover:bg-slate-50">
                  <span className="font-mono text-slate-400 w-12 shrink-0">{fmtD(date)}</span>
                  {ev.incoming > 0 && <span className="text-green-600 font-medium">＋{ev.incoming}kg 入荷</span>}
                  {ev.allocation > 0 && <span className="text-orange-600 font-medium">－{ev.allocation}kg 引当</span>}
                  <span className="text-slate-400 truncate">{ev.labels.slice(0,2).join(' / ')}</span>
                </div>
              ))}
            </div>
          ) : (
            <p className="mt-3 text-xs text-slate-400 text-center py-2">今後の入荷予定・引当データがありません</p>
          )}
        </div>
      </div>
    </div>
  );
}

// ─── 価格改定モーダル ──────────────────────────────────────────
function PriceRevisionModal({ onClose, onSave }) {
  const { materials } = useApp();
  const [form, setForm] = useState({
    materialId: '',
    effectiveDate: '',
    newPrice: '',
    basis: '発注日',
    note: '',
  });
  const set = (k, v) => setForm(f => ({ ...f, [k]: v }));

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 p-4">
      <div className="bg-white rounded-2xl shadow-2xl w-full max-w-md">
        <div className="px-6 py-4 border-b border-slate-200 flex items-center justify-between">
          <h2 className="font-bold text-slate-800">価格改定 追加</h2>
          <button onClick={onClose} className="text-slate-400 hover:text-slate-600 text-xl">✕</button>
        </div>
        <div className="p-6 space-y-4">
          <div>
            <label className="block text-xs text-slate-500 mb-1">原材料 *</label>
            <select className="select-field" value={form.materialId} onChange={e => set('materialId', e.target.value)}>
              <option value="">— 選択 —</option>
              {materials.map(m => <option key={m.id} value={m.id}>{m.name}</option>)}
            </select>
          </div>
          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="block text-xs text-slate-500 mb-1">適用開始日 *</label>
              <input type="date" className="input-field" value={form.effectiveDate}
                onChange={e => set('effectiveDate', e.target.value)} />
            </div>
            <div>
              <label className="block text-xs text-slate-500 mb-1">適用基準 *</label>
              <select className="select-field" value={form.basis} onChange={e => set('basis', e.target.value)}>
                <option>発注日</option>
                <option>納入日</option>
              </select>
            </div>
          </div>
          <div>
            <label className="block text-xs text-slate-500 mb-1">改定後単価 (円/kg) *</label>
            <input type="number" className="input-field" value={form.newPrice}
              onChange={e => set('newPrice', e.target.value)} placeholder="1500" />
          </div>
          <div>
            <label className="block text-xs text-slate-500 mb-1">備考</label>
            <input className="input-field" value={form.note}
              onChange={e => set('note', e.target.value)} placeholder="例: 銅相場上昇に伴う改定" />
          </div>
        </div>
        <div className="px-6 py-4 border-t border-slate-200 flex gap-3 justify-end">
          <button onClick={onClose} className="btn-secondary text-sm">キャンセル</button>
          <button
            disabled={!form.materialId || !form.effectiveDate || !form.newPrice}
            onClick={() => onSave({ ...form, newPrice: Number(form.newPrice) })}
            className="btn-primary text-sm disabled:opacity-40 disabled:cursor-not-allowed">
            追加
          </button>
        </div>
      </div>
    </div>
  );
}

// ─── メインコンポーネント ──────────────────────────────────────
export default function MaterialProcurement() {
  const {
    orders, quotes, materials, suppliers, materialReorderConfig,
    currentStock, materialAllocations, purchaseOrders, materialReceiving,
    allocateMaterial, createPurchaseOrder, updatePurchaseOrder,
    priceRevisions, addPriceRevision, deletePriceRevision, getApplicableRevisionPrice,
  } = useApp();

  const [activeTab, setActiveTab] = useState('allocation');
  const [showPOModal, setShowPOModal] = useState(false);
  const [poModalMaterial, setPoModalMaterial] = useState(null);
  const [deliveryConfirmPO, setDeliveryConfirmPO] = useState(null);
  const [chartMaterial, setChartMaterial] = useState(null);
  const [showPriceRevModal, setShowPriceRevModal] = useState(false);
  const TODAY = '2026-05-21';

  // BOM取得ヘルパー（quoteから）
  const getBom = (productCode) => {
    const q = quotes.find(q => q.productCode === productCode && q.bom?.length > 0);
    return q?.bom || [];
  };

  // 活性オーダー（未完了）
  const activeOrders = orders.filter(o =>
    ['確定','照会（仮押さえ）','分納中'].includes(o.status)
  );

  // 引当状況サマリ
  const allocationSummary = useMemo(() => {
    return activeOrders.map(order => {
      const bom = getBom(order.productCode);
      const q = quotes.find(q => q.productCode === order.productCode && q.bom?.length > 0);
      const lossRate = q?.lossRate || 1.03;
      return {
        order,
        lines: bom.map(b => {
          const required = Math.ceil(order.totalQuantity * b.requiredQty * lossRate * 10) / 10;
          const existing = materialAllocations.filter(
            a => a.orderId === order.id && a.materialId === b.materialId
          );
          const allocated = existing.reduce((s, a) => s + (a.allocatedQty || 0), 0);
          const short = Math.max(0, required - allocated);
          const status = allocated >= required ? '引当済'
            : allocated > 0 ? '一部引当'
            : '未引当';
          return { ...b, required, allocated, short, status };
        }),
      };
    }).filter(s => s.lines.length > 0);
  }, [activeOrders, materialAllocations, quotes]);

  // 一括引当（在庫範囲内で全オーダーに引当）
  const handleBulkAllocate = () => {
    const workStock = { ...currentStock };
    allocationSummary.forEach(({ order, lines }) => {
      lines.forEach(line => {
        if (line.status === '引当済') return;
        const canAlloc = Math.min(line.short, workStock[line.materialId] || 0);
        const newAlloc = line.allocated + canAlloc;
        const shortLeft = line.required - newAlloc;
        allocateMaterial({
          id: `ALLOC-${order.id}-${line.materialId}`,
          orderId: order.id,
          orderNumber: order.orderNumber,
          materialId: line.materialId,
          materialName: line.materialName,
          unit: 'kg',
          requiredQty: line.required,
          allocatedQty: newAlloc,
          shortQty: shortLeft,
          status: shortLeft <= 0 ? '引当済' : newAlloc > 0 ? '一部引当' : '未引当',
          allocatedDate: TODAY,
          mfgOrderId: null,
          productCode: order.productCode,
        });
        workStock[line.materialId] = Math.max(0, (workStock[line.materialId] || 0) - canAlloc);
      });
    });
  };

  // 在庫アラート（発注点以下）
  const stockAlerts = useMemo(() => {
    return materials.filter(m => {
      const cfg = materialReorderConfig[m.id];
      if (!cfg) return false;
      // 引当済みの量を差し引いた実効在庫
      const reserved = materialAllocations
        .filter(a => ['引当済','一部引当'].includes(a.status) && a.materialId === m.id)
        .reduce((s, a) => s + (a.allocatedQty || 0), 0);
      const effective = (currentStock[m.id] || 0) - reserved;
      return effective <= cfg.reorderPoint;
    }).map(m => {
      const cfg = materialReorderConfig[m.id];
      const reserved = materialAllocations
        .filter(a => ['引当済','一部引当'].includes(a.status) && a.materialId === m.id)
        .reduce((s, a) => s + (a.allocatedQty || 0), 0);
      const effective = (currentStock[m.id] || 0) - reserved;
      const inOrder = purchaseOrders
        .filter(po => po.materialId === m.id && !['完納'].includes(po.status))
        .reduce((s, po) => s + po.orderedQty, 0);
      return { material: m, effective, reorderPoint: cfg.reorderPoint, orderLot: cfg.orderLot, inOrder, alreadyOrdering: inOrder > 0 };
    });
  }, [materials, currentStock, materialAllocations, materialReorderConfig, purchaseOrders]);

  // 入庫予定（スケジュール）
  const receivingSchedule = useMemo(() => {
    return [...materialReceiving]
      .filter(r => r.status !== '検品完了')
      .sort((a, b) => {
        if (!a.scheduledDate) return 1;
        if (!b.scheduledDate) return -1;
        return a.scheduledDate.localeCompare(b.scheduledDate);
      });
  }, [materialReceiving]);

  const tabs = [
    { id: 'allocation', label: '📦 引当管理' },
    { id: 'purchase',   label: '📋 発注管理' },
    { id: 'schedule',   label: '🗓 入庫予定' },
    { id: 'pricerev',   label: '💴 価格改定' },
  ];

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between">
        <h1 className="text-xl font-bold text-slate-800">原材料 引当・発注管理</h1>
        <button
          onClick={() => { setPoModalMaterial(null); setShowPOModal(true); }}
          className="btn-primary text-sm flex items-center gap-1.5"
        >＋ 発注書作成</button>
      </div>

      {/* 在庫アラート */}
      {stockAlerts.length > 0 && (
        <div className="rounded-xl border border-red-300 bg-red-50 px-4 py-3">
          <div className="text-sm font-bold text-red-700 mb-2">
            ⚠️ 在庫アラート — 発注点以下の原材料があります（{stockAlerts.length}件）
          </div>
          <div className="flex flex-wrap gap-2">
            {stockAlerts.map(({ material, effective, reorderPoint, orderLot, inOrder, alreadyOrdering }) => (
              <div key={material.id}
                className={`flex items-center gap-2 px-3 py-2 rounded-lg border text-xs ${alreadyOrdering ? 'bg-yellow-50 border-yellow-300' : 'bg-red-100 border-red-300'}`}>
                <span className="font-medium text-slate-700">{material.name}</span>
                <span className={`font-bold ${effective <= 0 ? 'text-red-600' : 'text-orange-600'}`}>
                  実効在庫 {effective.toFixed(0)}kg
                </span>
                <span className="text-slate-400">発注点 {reorderPoint}kg</span>
                {alreadyOrdering
                  ? <span className="text-yellow-700 font-medium">発注中 {inOrder}kg</span>
                  : <button
                      onClick={() => { setPoModalMaterial(material); setShowPOModal(true); }}
                      className="px-2 py-0.5 bg-red-600 text-white rounded font-semibold hover:bg-red-700">
                      今すぐ発注
                    </button>
                }
              </div>
            ))}
          </div>
        </div>
      )}

      {/* タブ */}
      <div className="flex gap-1 border-b border-slate-200">
        {tabs.map(t => (
          <button key={t.id} onClick={() => setActiveTab(t.id)}
            className={`px-4 py-2 text-sm font-semibold rounded-t-lg transition-colors
              ${activeTab === t.id
                ? 'bg-white border border-b-white border-slate-200 text-blue-700 -mb-px'
                : 'text-slate-500 hover:text-slate-700'}`}>
            {t.label}
          </button>
        ))}
      </div>

      {/* ── 引当管理タブ ── */}
      {activeTab === 'allocation' && (
        <div className="space-y-3">
          <div className="flex items-center justify-between">
            <p className="text-xs text-slate-500">確定・仮押さえ受注に対してBOMと在庫を照合し引当処理を行います</p>
            <button onClick={handleBulkAllocate}
              className="btn-primary text-xs px-3 py-1.5 flex items-center gap-1">
              ⚡ 一括引当
            </button>
          </div>

          {/* 在庫サマリ */}
          <div className="grid grid-cols-2 md:grid-cols-4 gap-2">
            {materials.map(m => {
              const cfg = materialReorderConfig[m.id];
              const stock = currentStock[m.id] || 0;
              const reserved = materialAllocations
                .filter(a => ['引当済','一部引当'].includes(a.status) && a.materialId === m.id)
                .reduce((s, a) => s + (a.allocatedQty || 0), 0);
              const effective = stock - reserved;
              const isCritical = cfg && effective <= cfg.reorderPoint;
              return (
                <div key={m.id} className={`rounded-xl p-3 border text-xs ${isCritical ? 'bg-red-50 border-red-200' : 'bg-white border-slate-200'}`}>
                  <div className="flex items-center justify-between mb-1">
                    <div className="font-medium text-slate-700 truncate flex-1 mr-1">{m.name}</div>
                    <button
                      onClick={() => setChartMaterial(m)}
                      className="shrink-0 text-blue-500 hover:text-blue-700 hover:bg-blue-50 rounded px-1 py-0.5 transition-colors"
                      title="在庫推移グラフ"
                    >📈</button>
                  </div>
                  <div className="space-y-0.5">
                    <div className="flex justify-between"><span className="text-slate-400">現在庫</span><span className="font-mono">{stock}kg</span></div>
                    <div className="flex justify-between"><span className="text-slate-400">引当済</span><span className="font-mono text-orange-600">{reserved}kg</span></div>
                    <div className={`flex justify-between font-bold ${isCritical ? 'text-red-600' : 'text-green-700'}`}>
                      <span>実効在庫</span><span className="font-mono">{effective}kg</span>
                    </div>
                  </div>
                </div>
              );
            })}
          </div>

          {/* 引当詳細 */}
          <div className="card p-0 overflow-hidden">
            <div className="overflow-x-auto">
              <table className="w-full text-sm">
                <thead className="bg-slate-50 border-b border-slate-200">
                  <tr>
                    {['受注番号','製品名','材料名','必要量','引当済','不足','ステータス'].map(h => (
                      <th key={h} className="text-left py-2 px-3 text-xs font-medium text-slate-500 whitespace-nowrap">{h}</th>
                    ))}
                  </tr>
                </thead>
                <tbody>
                  {allocationSummary.flatMap(({ order, lines }) =>
                    lines.map((line, i) => (
                      <tr key={`${order.id}-${line.materialId}`}
                        className="border-b border-slate-100 hover:bg-slate-50">
                        {i === 0
                          ? <td className="py-2 px-3 font-mono text-xs align-top" rowSpan={lines.length}>
                              <div className="font-bold">{order.orderNumber}</div>
                              <div className="text-slate-400 text-xs">{order.finalDeadline}まで</div>
                            </td>
                          : null
                        }
                        {i === 0
                          ? <td className="py-2 px-3 text-xs align-top" rowSpan={lines.length}>
                              <div className="font-medium">{order.productName}</div>
                              <div className="text-slate-400">{order.totalQuantity.toLocaleString()}m</div>
                            </td>
                          : null
                        }
                        <td className="py-2 px-3 text-xs">{line.materialName}</td>
                        <td className="py-2 px-3 text-xs font-mono">{line.required.toFixed(1)}kg</td>
                        <td className="py-2 px-3 text-xs font-mono">{line.allocated.toFixed(1)}kg</td>
                        <td className={`py-2 px-3 text-xs font-mono font-bold ${line.short > 0 ? 'text-red-600' : 'text-slate-300'}`}>
                          {line.short > 0 ? `${line.short.toFixed(1)}kg` : '—'}
                        </td>
                        <td className="py-2 px-3">
                          <span className={`badge text-xs ${STATUS_COLORS[line.status]}`}>{line.status}</span>
                        </td>
                      </tr>
                    ))
                  )}
                  {allocationSummary.length === 0 && (
                    <tr><td colSpan={7} className="py-8 text-center text-slate-400 text-sm">引当対象の受注がありません</td></tr>
                  )}
                </tbody>
              </table>
            </div>
          </div>
        </div>
      )}

      {/* ── 発注管理タブ ── */}
      {activeTab === 'purchase' && (
        <div className="space-y-3">
          {/* 仕入先グループ */}
          {suppliers.map(sup => {
            const poList = purchaseOrders.filter(po => po.supplierId === sup.id);
            if (poList.length === 0) return null;
            return (
              <div key={sup.id} className="card p-0 overflow-hidden">
                <div className="px-4 py-2 bg-slate-50 border-b border-slate-200 flex items-center justify-between">
                  <div>
                    <span className="font-semibold text-slate-700 text-sm">{sup.name}</span>
                    <span className="text-xs text-slate-400 ml-2">担当: {sup.contactName} / {sup.tel}</span>
                  </div>
                  <span className="text-xs text-slate-400">リードタイム {sup.leadTimeDays}日</span>
                </div>
                <div className="divide-y divide-slate-100">
                  {poList.map(po => (
                    <div key={po.id} className="px-4 py-3 flex items-center gap-3 flex-wrap">
                      <div className="font-mono text-xs font-bold text-slate-600 w-28">{po.poNumber}</div>
                      <div className="flex-1 min-w-0">
                        <div className="flex items-center gap-1.5 flex-wrap">
                          <span className="text-sm font-medium">{po.materialName}</span>
                          {po.isPrototypeMaterial && (
                            <span className="inline-block px-1.5 py-0 bg-amber-100 text-amber-700 border border-amber-300 rounded text-xs font-semibold leading-5">試作用</span>
                          )}
                        </div>
                        <div className="text-xs text-slate-400">
                          {po.orderedQty}kg × ¥{po.unitPrice.toLocaleString()} = ¥{po.totalAmount.toLocaleString()}
                        </div>
                      </div>
                      <div className="text-xs space-y-0.5 text-right">
                        <div className="text-slate-500">発注日 {po.orderedDate}</div>
                        <div className="text-slate-500">
                          希望納期 {po.requestedDeliveryDate || '—'}
                        </div>
                        {po.confirmedDeliveryDate
                          ? <div className="font-semibold text-green-700">確定納期 {po.confirmedDeliveryDate}</div>
                          : <div className="text-yellow-600 font-medium">納期未確定</div>
                        }
                      </div>
                      <span className={`badge text-xs ${PO_STATUS_COLORS[po.status] || 'bg-slate-100 text-slate-600'}`}>
                        {po.status}
                      </span>
                      {po.status === '納期確認待ち' && (
                        <button onClick={() => setDeliveryConfirmPO(po)}
                          className="text-xs px-2 py-1 rounded border border-blue-200 text-blue-600 hover:bg-blue-50 whitespace-nowrap">
                          納期回答入力
                        </button>
                      )}
                      {po.notes && (
                        <div className="w-full text-xs text-slate-400 pl-28">📝 {po.notes}</div>
                      )}
                    </div>
                  ))}
                </div>
              </div>
            );
          })}
          {purchaseOrders.length === 0 && (
            <div className="text-center py-12 text-slate-400">発注書がありません</div>
          )}
        </div>
      )}

      {/* ── 入庫予定タブ ── */}
      {activeTab === 'schedule' && (
        <div className="card p-0 overflow-hidden">
          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead className="bg-slate-50 border-b border-slate-200">
                <tr>
                  {['入庫予定日','発注番号','材料名','発注量','仕入先','ステータス'].map(h => (
                    <th key={h} className="text-left py-2 px-4 text-xs font-medium text-slate-500 whitespace-nowrap">{h}</th>
                  ))}
                </tr>
              </thead>
              <tbody>
                {receivingSchedule.map(r => {
                  const po = purchaseOrders.find(p => p.id === r.purchaseOrderId);
                  const daysLeft = r.scheduledDate
                    ? Math.ceil((new Date(r.scheduledDate) - new Date(TODAY)) / 86400000)
                    : null;
                  return (
                    <tr key={r.id} className="border-b border-slate-100 hover:bg-slate-50">
                      <td className="py-3 px-4">
                        {r.scheduledDate
                          ? <div>
                              <div className="font-medium">{r.scheduledDate}</div>
                              <div className={`text-xs ${daysLeft !== null && daysLeft <= 0 ? 'text-red-600 font-bold' : daysLeft !== null && daysLeft <= 3 ? 'text-orange-500' : 'text-slate-400'}`}>
                                {daysLeft === null ? '' : daysLeft <= 0 ? `${Math.abs(daysLeft)}日超過` : `あと${daysLeft}日`}
                              </div>
                            </div>
                          : <span className="text-yellow-600 text-xs font-medium">未確定</span>
                        }
                      </td>
                      <td className="py-3 px-4 font-mono text-xs">{r.poNumber}</td>
                      <td className="py-3 px-4">
                        <div className="flex items-center gap-1.5 flex-wrap">
                          <span className="font-medium text-sm">{r.materialName}</span>
                          {r.isPrototypeMaterial && (
                            <span className="inline-block px-1.5 py-0 bg-amber-100 text-amber-700 border border-amber-300 rounded text-xs font-semibold leading-5">試作用</span>
                          )}
                        </div>
                      </td>
                      <td className="py-3 px-4 text-xs font-mono">{r.orderedQty}kg</td>
                      <td className="py-3 px-4 text-xs text-slate-600">{po?.supplierName || '—'}</td>
                      <td className="py-3 px-4">
                        <span className={`badge text-xs ${PO_STATUS_COLORS[r.status] || 'bg-slate-100 text-slate-500'}`}>
                          {r.status}
                        </span>
                      </td>
                    </tr>
                  );
                })}
                {receivingSchedule.length === 0 && (
                  <tr><td colSpan={6} className="py-8 text-center text-slate-400">入庫予定なし</td></tr>
                )}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {/* ── 価格改定タブ ── */}
      {activeTab === 'pricerev' && (
        <div className="space-y-3">
          <div className="flex items-center justify-between">
            <p className="text-xs text-slate-500">発注日・納入日を基準として適用する原材料の単価改定を管理します</p>
            <button onClick={() => setShowPriceRevModal(true)} className="btn-primary text-xs px-3 py-1.5">
              ＋ 価格改定追加
            </button>
          </div>

          {/* 現行適用価格サマリ */}
          <div className="grid grid-cols-2 md:grid-cols-4 gap-2">
            {materials.map(m => {
              const revPrice = getApplicableRevisionPrice(m.id, TODAY, TODAY);
              const displayPrice = revPrice ?? m.standardPrice;
              const hasRev = revPrice !== null && revPrice !== m.standardPrice;
              return (
                <div key={m.id} className={`rounded-xl p-3 border text-xs ${hasRev ? 'bg-amber-50 border-amber-200' : 'bg-white border-slate-200'}`}>
                  <div className="font-medium text-slate-700 truncate mb-1">{m.name}</div>
                  <div className="text-xs text-slate-400 mb-0.5">標準単価</div>
                  <div className="font-mono text-slate-500">¥{m.standardPrice?.toLocaleString()}/kg</div>
                  {hasRev && (
                    <>
                      <div className="text-xs text-amber-600 mt-1 mb-0.5">改定後単価</div>
                      <div className="font-mono font-bold text-amber-700">¥{displayPrice.toLocaleString()}/kg</div>
                    </>
                  )}
                </div>
              );
            })}
          </div>

          {/* 価格改定テーブル */}
          <div className="card p-0 overflow-hidden">
            <div className="overflow-x-auto">
              <table className="w-full text-sm">
                <thead className="bg-slate-50 border-b border-slate-200">
                  <tr>
                    {['材料名', '適用開始日', '適用基準', '改定後単価', '備考', '操作'].map(h => (
                      <th key={h} className="text-left py-2 px-4 text-xs font-medium text-slate-500 whitespace-nowrap">{h}</th>
                    ))}
                  </tr>
                </thead>
                <tbody>
                  {[...priceRevisions].sort((a, b) => b.effectiveDate.localeCompare(a.effectiveDate)).map(r => {
                    const mat = materials.find(m => m.id === r.materialId);
                    return (
                      <tr key={r.id} className="border-b border-slate-100 hover:bg-slate-50">
                        <td className="py-2 px-4 font-medium text-sm">{mat?.name || r.materialId}</td>
                        <td className="py-2 px-4 font-mono text-xs">{r.effectiveDate}</td>
                        <td className="py-2 px-4">
                          <span className={`badge text-xs ${r.basis === '納入日' ? 'bg-purple-100 text-purple-700' : 'bg-blue-100 text-blue-700'}`}>
                            {r.basis}基準
                          </span>
                        </td>
                        <td className="py-2 px-4 font-mono font-bold text-amber-700">¥{r.newPrice.toLocaleString()}/kg</td>
                        <td className="py-2 px-4 text-xs text-slate-400">{r.note || '—'}</td>
                        <td className="py-2 px-4">
                          <button onClick={() => deletePriceRevision(r.id)}
                            className="text-xs text-red-500 hover:underline">削除</button>
                        </td>
                      </tr>
                    );
                  })}
                  {priceRevisions.length === 0 && (
                    <tr><td colSpan={6} className="py-8 text-center text-slate-400">価格改定データがありません</td></tr>
                  )}
                </tbody>
              </table>
            </div>
          </div>
        </div>
      )}

      {/* モーダル */}
      {showPOModal && (
        <PurchaseOrderModal
          initialMaterial={poModalMaterial}
          onClose={() => { setShowPOModal(false); setPoModalMaterial(null); }}
          onSave={(po) => { createPurchaseOrder(po); setShowPOModal(false); setPoModalMaterial(null); }}
        />
      )}
      {deliveryConfirmPO && (
        <DeliveryConfirmModal
          po={deliveryConfirmPO}
          onClose={() => setDeliveryConfirmPO(null)}
          onSave={(updates) => { updatePurchaseOrder(deliveryConfirmPO.id, updates); setDeliveryConfirmPO(null); }}
        />
      )}

      {chartMaterial && (
        <StockTransitionChart
          material={chartMaterial}
          onClose={() => setChartMaterial(null)}
        />
      )}
      {showPriceRevModal && (
        <PriceRevisionModal
          onClose={() => setShowPriceRevModal(false)}
          onSave={(rev) => { addPriceRevision(rev); setShowPriceRevModal(false); }}
        />
      )}
    </div>
  );
}
