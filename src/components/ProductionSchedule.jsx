import { useState, useRef, useEffect } from 'react';
import { useApp } from '../context/AppContext';
import { PROCESS_ORDER, PROCESS_MACHINE_MAP, initialProductBOMs } from '../data/mockData';

const COLOR_HEX = {
  '押出': '#0ea5e9',
  '撚線': '#8b5cf6',
  '編組': '#f59e0b',
  '加工': '#10b981',
};

const COLORS = {
  '押出': { bg:'bg-sky-500',    light:'bg-sky-50',    text:'text-sky-800',    border:'border-sky-400',   header:'bg-sky-100'   },
  '撚線': { bg:'bg-violet-500', light:'bg-violet-50', text:'text-violet-800', border:'border-violet-400', header:'bg-violet-100' },
  '編組': { bg:'bg-amber-500',  light:'bg-amber-50',  text:'text-amber-800',  border:'border-amber-400',  header:'bg-amber-100'  },
  '加工': { bg:'bg-emerald-500',light:'bg-emerald-50',text:'text-emerald-800',border:'border-emerald-400',header:'bg-emerald-100'},
};

function addDays(date, n) {
  const d = new Date(date); d.setDate(d.getDate() + n); return d;
}
function fmt(date) { return new Date(date).toISOString().split('T')[0]; }
function getMonday(date) {
  const d = new Date(date);
  const diff = d.getDay() === 0 ? -6 : 1 - d.getDay();
  d.setDate(d.getDate() + diff); d.setHours(0,0,0,0); return d;
}
function getWeekDays(monday, weeks = 1) {
  return Array.from({ length: 6 * weeks }, (_, i) => addDays(monday, i));
}
function fmtHeader(date) {
  return `${date.getMonth()+1}/${date.getDate()}(${'日月火水木金土'[date.getDay()]})`;
}

const TODAY_STR = '2026-05-21';

const HOLIDAYS = {
  '2025-01-01': '元日',
  '2025-01-13': '成人の日',
  '2025-02-11': '建国記念の日',
  '2025-02-23': '天皇誕生日',
  '2025-02-24': '振替休日',
  '2025-03-20': '春分の日',
  '2025-04-29': '昭和の日',
  '2025-05-03': '憲法記念日',
  '2025-05-04': 'みどりの日',
  '2025-05-05': 'こどもの日',
  '2025-05-06': '振替休日',
  '2025-07-21': '海の日',
  '2025-08-11': '山の日',
  '2025-09-15': '敬老の日',
  '2025-09-23': '秋分の日',
  '2025-10-13': 'スポーツの日',
  '2025-11-03': '文化の日',
  '2025-11-23': '勤労感謝の日',
  '2025-11-24': '振替休日',
  '2026-01-01': '元日',
  '2026-01-12': '成人の日',
  '2026-02-11': '建国記念の日',
  '2026-02-23': '天皇誕生日',
  '2026-03-20': '春分の日',
  '2026-04-29': '昭和の日',
  '2026-05-03': '憲法記念日',
  '2026-05-04': 'みどりの日',
  '2026-05-05': 'こどもの日',
  '2026-05-06': '振替休日',
  '2026-07-20': '海の日',
  '2026-08-11': '山の日',
  '2026-09-21': '敬老の日',
  '2026-09-23': '秋分の日',
  '2026-10-12': 'スポーツの日',
  '2026-11-03': '文化の日',
  '2026-11-23': '勤労感謝の日',
};
const getHoliday = (dateStr) => HOLIDAYS[dateStr] ?? null;

function deadlineColor(finalDeadline) {
  const days = Math.ceil((new Date(finalDeadline) - new Date(TODAY_STR)) / 86400000);
  if (days <= 7)  return 'text-red-600 font-semibold';
  if (days <= 21) return 'text-orange-500';
  return 'text-slate-400';
}

const ORDER_STATUS_COLORS = {
  '照会（仮押さえ）': 'bg-orange-100 text-orange-700',
  '確定':             'bg-blue-100 text-blue-700',
  '分納中':           'bg-purple-100 text-purple-700',
  '完了':             'bg-green-100 text-green-700',
  'キャンセル':       'bg-red-100 text-red-500',
};

// ─── 受注詳細モーダル ─────────────────────────────────────────
function OrderDetailModal({ order, onClose, onNavigate, products }) {
  const { quotes } = useApp();
  const [tab, setTab] = useState('info');
  if (!order) return null;

  const quote = quotes.find(q => q.productCode === order.productCode && q.bom?.length > 0);
  const bom = quote?.bom || [];
  const lossRate = quote?.lossRate || 1.03;
  const daysLeft = Math.ceil((new Date(order.finalDeadline) - new Date(TODAY_STR)) / 86400000);
  const product = products?.find(p => p.productCode === order.productCode);
  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 p-4">
      <div className="bg-white rounded-2xl shadow-2xl w-full max-w-lg max-h-[88vh] flex flex-col">
        <div className="px-6 py-4 border-b border-slate-200 flex items-start justify-between flex-shrink-0">
          <div>
            <div className="flex items-center gap-2 flex-wrap">
              <h2 className="text-base font-bold text-slate-800">{order.orderNumber}</h2>
              <span className={`badge ${ORDER_STATUS_COLORS[order.status] || 'bg-slate-100 text-slate-600'}`}>
                {order.status}
              </span>
            </div>
            <div className="text-sm text-slate-600 mt-0.5">{order.productName}</div>
            <div className="text-xs text-slate-400">{order.customerName}</div>
          </div>
          <button onClick={onClose} className="text-slate-400 hover:text-slate-600 text-xl leading-none ml-4 flex-shrink-0">✕</button>
        </div>
        {/* タブ切替 */}
        <div className="flex border-b border-slate-200 flex-shrink-0">
          {[['info','受注情報'], ['spec','仕様・作業条件'], ['materials','使用材料']].map(([id, label]) => (
            <button key={id} onClick={() => setTab(id)}
              className={`flex-1 px-4 py-2 text-xs font-semibold transition-colors ${tab===id ? 'border-b-2 border-blue-600 text-blue-700' : 'text-slate-500 hover:text-slate-700'}`}>
              {label}
            </button>
          ))}
        </div>
        <div className="overflow-y-auto flex-1 px-6 py-4 space-y-4">
          {tab === 'info' && (<>
            <div className="grid grid-cols-2 gap-3 bg-slate-50 rounded-xl p-4">
              {[
                { label: '受注数量',       value: `${order.totalQuantity.toLocaleString()} ${order.unit}` },
                { label: '有償支給材相殺', value: order.paidMaterialOffset },
                { label: '手配期限',       value: order.arrangementDeadline },
                { label: '納期（最終）',   value: order.finalDeadline, extra: `あと${daysLeft}日`, urgent: daysLeft <= 7, warn: daysLeft <= 21 },
              ].map(item => (
                <div key={item.label}>
                  <div className="text-xs text-slate-500 mb-0.5">{item.label}</div>
                  <div className={`font-bold text-sm ${item.urgent ? 'text-red-600' : item.warn ? 'text-orange-500' : 'text-slate-800'}`}>
                    {item.value}
                    {item.extra && <span className="text-xs font-normal ml-1.5 opacity-80">（{item.extra}）</span>}
                  </div>
                </div>
              ))}
            </div>
            {order.shippingSchedule?.length > 0 && (
              <div>
                <h3 className="text-sm font-semibold text-slate-700 mb-2">📦 出荷予定</h3>
                <div className="space-y-1.5">
                  {order.shippingSchedule.map(s => (
                    <div key={s.id} className="flex items-center gap-3 text-sm bg-slate-50 rounded-lg px-3 py-2">
                      <span className="font-medium text-slate-700 w-24 shrink-0">{s.scheduledDate}</span>
                      <span className="font-mono text-slate-700 flex-1">{s.quantity.toLocaleString()} m</span>
                      <span className="text-slate-400 text-xs">{s.carrier}</span>
                      <span className={`badge text-xs ${s.status === '出荷済' ? 'bg-green-100 text-green-700' : 'bg-slate-100 text-slate-500'}`}>
                        {s.status}
                      </span>
                    </div>
                  ))}
                </div>
              </div>
            )}
          </>)}
          {/* No.3 使用材料タブ */}
          {tab === 'materials' && (
            <div>
              {bom.length === 0 ? (
                <div className="text-center text-xs text-slate-400 py-8">
                  この製品のBOM情報が見つかりません<br/>
                  <span className="text-slate-300">製品コード: {order.productCode || '未設定'}</span>
                </div>
              ) : (
                <>
                  <div className="text-xs text-slate-500 mb-3 bg-slate-50 rounded-lg p-2">
                    受注数量 <span className="font-bold text-slate-700">{order.totalQuantity.toLocaleString()} {order.unit}</span>
                    　ロス率 <span className="font-bold text-slate-700">{((lossRate - 1) * 100).toFixed(1)}%</span>
                    　ベースに算出
                  </div>
                  <table className="w-full text-sm">
                    <thead className="bg-slate-50">
                      <tr>
                        {['材料名', '単位量', '合計必要量'].map(h => (
                          <th key={h} className="text-left py-2 px-2 text-xs font-medium text-slate-500">{h}</th>
                        ))}
                      </tr>
                    </thead>
                    <tbody>
                      {bom.map((b, i) => {
                        const totalQty = Math.ceil(order.totalQuantity * b.requiredQty * lossRate * 10) / 10;
                        return (
                          <tr key={i} className="border-b border-slate-100">
                            <td className="py-2 px-2 text-xs font-medium text-slate-700">{b.materialName}</td>
                            <td className="py-2 px-2 text-xs font-mono text-slate-400">{b.requiredQty} kg/m</td>
                            <td className="py-2 px-2 text-xs font-mono font-bold text-blue-700">{totalQty} kg</td>
                          </tr>
                        );
                      })}
                    </tbody>
                  </table>
                  <div className="mt-3 text-xs text-slate-400">
                    合計: <span className="font-bold text-slate-600">
                      {bom.reduce((sum, b) => sum + Math.ceil(order.totalQuantity * b.requiredQty * lossRate * 10) / 10, 0).toFixed(1)} kg
                    </span>
                  </div>
                </>
              )}
            </div>
          )}
          {/* No.7 仕様・作業条件タブ */}
          {tab === 'spec' && (
            <div>
              {product ? (<>
                <div className="grid grid-cols-2 gap-2 text-sm mb-4">
                  {[
                    ['製品コード', product.productCode],
                    ['図番', product.designNumber],
                    ['外径', `${product.spec?.outerDiameter?.min}〜${product.spec?.outerDiameter?.max} mm`],
                    ['肉厚', `${product.spec?.wallThickness?.min}〜${product.spec?.wallThickness?.max} mm`],
                    ['シース色', product.sheathColor],
                    ['梱包', product.packaging],
                  ].map(([k, v]) => (
                    <div key={k} className="bg-slate-50 rounded-lg px-3 py-2">
                      <div className="text-xs text-slate-400">{k}</div>
                      <div className="font-medium text-slate-800 text-sm">{v || '—'}</div>
                    </div>
                  ))}
                </div>
                {product.workConditions && Object.entries(product.workConditions).filter(([,v]) => v).map(([proc, cond]) => {
                  const colMap = { '押出':'bg-sky-50 border-sky-200 text-sky-800','撚線':'bg-violet-50 border-violet-200 text-violet-800','編組':'bg-amber-50 border-amber-200 text-amber-800','加工':'bg-emerald-50 border-emerald-200 text-emerald-800' };
                  return (
                    <div key={proc} className={`rounded-xl border p-3 mb-2 ${colMap[proc]||'bg-slate-50 border-slate-200 text-slate-700'}`}>
                      <div className="text-xs font-bold mb-1">【{proc}】作業条件</div>
                      <p className="text-xs leading-relaxed whitespace-pre-line">{cond}</p>
                    </div>
                  );
                })}
              </>) : (
                <div className="text-center text-xs text-slate-400 py-8">
                  この受注に紐づく製品マスタが見つかりません<br/>
                  <span className="text-slate-300">製品コード: {order.productCode || '未設定'}</span>
                </div>
              )}
            </div>
          )}
        </div>
        <div className="px-6 py-4 border-t border-slate-200 flex gap-3 flex-shrink-0">
          <button onClick={onClose} className="flex-1 btn-secondary text-sm">閉じる</button>
          <button onClick={onNavigate} className="flex-1 btn-primary text-sm">受注画面で開く →</button>
        </div>
      </div>
    </div>
  );
}

// ─── 未割り当てカード ─────────────────────────────────────────
function UnscheduledCard({ order, process, dragging, onDragStart, onDetail }) {
  const c = COLORS[process] || {};
  const dc = deadlineColor(order.finalDeadline);
  const isTentative = order.status === '照会（仮押さえ）';
  return (
    <div
      draggable onDragStart={onDragStart}
      className={`p-2 rounded-lg border-2 cursor-grab active:cursor-grabbing select-none transition-all
        ${dragging ? 'opacity-30 scale-95' : 'hover:shadow-md'} ${c.light}
        ${isTentative ? 'border-amber-400 border-dashed' : c.border}`}
    >
      <div className="flex items-center justify-between gap-1">
        <div className="flex items-center gap-1 min-w-0">
          {isTentative && (
            <span className="text-xs font-bold px-1 py-0.5 rounded bg-amber-400 text-white shrink-0 leading-none">仮</span>
          )}
          <div className={`text-xs font-mono font-bold truncate ${c.text}`}>{order.orderNumber}</div>
        </div>
        <button
          onMouseDown={e => e.stopPropagation()}
          onClick={e => { e.stopPropagation(); onDetail(); }}
          className="text-xs text-slate-400 hover:text-blue-600 px-1.5 py-0.5 rounded hover:bg-blue-50 shrink-0 border border-slate-200 hover:border-blue-300"
        >詳細</button>
      </div>
      <div className="text-xs font-medium text-slate-700 truncate mt-0.5">{order.productName}</div>
      <div className="flex items-center justify-between mt-1 gap-1">
        <span className="text-xs text-slate-500 truncate">{order.customerName}</span>
        <span className={`text-xs font-bold shrink-0 ${c.text}`}>{order.totalQuantity.toLocaleString()}{order.unit}</span>
      </div>
      <div className="flex items-center justify-between mt-1.5 gap-1">
        <span className={`text-xs font-semibold px-1.5 py-0.5 rounded inline-block ${c.bg} text-white`}>{process}</span>
        <span className={`text-xs ${dc}`}>納期 {order.finalDeadline}</span>
      </div>
    </div>
  );
}

// ─── スケジュール済みカード ────────────────────────────────────
function ScheduledCard({ item, order, bom, lossRate, slotPos, slotTotal, dragging, onDragStart, onRemove, onExtend, onShrink, onDetail, onMoveUp, onMoveDown, isHighlighted, commentCount }) {
  const [showMat, setShowMat] = useState(false);
  const c = COLORS[item.process] || {};
  if (!order) return null;
  const dc = deadlineColor(order.finalDeadline);
  const multi = slotTotal > 1;
  const continues = item.duration > 1;
  const isTentative = order.status === '照会（仮押さえ）';

  return (
    <div
      data-item-id={item.id}
      draggable onDragStart={onDragStart}
      className={`relative group rounded-lg border-2 cursor-grab active:cursor-grabbing select-none
        ${dragging ? 'opacity-30' : 'hover:shadow-md'} ${c.light}
        ${isTentative ? 'border-amber-400 border-dashed' : c.border}
        ${isHighlighted ? 'ring-2 ring-yellow-400 ring-offset-1' : ''}`}
      style={{ padding: '4px 6px', fontSize: '11px', lineHeight: '1.4' }}
    >
      {/* × 削除 */}
      <button
        onClick={e => { e.stopPropagation(); onRemove(); }}
        className="absolute -top-1.5 -right-1.5 w-4 h-4 rounded-full bg-red-500 text-white
          hidden group-hover:flex items-center justify-center z-20 hover:bg-red-600"
        style={{ fontSize: '9px', fontWeight: 'bold' }}
      >×</button>

      {/* Row 1: スロット番号 + 仮バッジ + 受注番号 + 詳細 */}
      <div className="flex items-center gap-0.5">
        {multi && (
          <span className={`px-1 rounded ${c.bg} text-white font-bold shrink-0`} style={{ fontSize: '9px' }}>
            #{slotPos}
          </span>
        )}
        {isTentative && (
          <span className="px-1 rounded bg-amber-400 text-white font-bold shrink-0" style={{ fontSize: '9px' }}>仮</span>
        )}
        {item.autoAssigned && (
          <span className="shrink-0" style={{ fontSize: '10px' }} title="自動配置">⚡</span>
        )}
        <span className={`font-mono font-bold truncate ${c.text} flex-1`}>{order.orderNumber}</span>
        {commentCount > 0 && (
          <span className="shrink-0 flex items-center gap-0.5 px-1 py-0.5 rounded bg-amber-100 text-amber-700 font-bold" style={{ fontSize: '9px' }} title="現場コメントあり">
            💬{commentCount}
          </span>
        )}
        <button
          onMouseDown={e => e.stopPropagation()}
          onClick={e => { e.stopPropagation(); onDetail(); }}
          className={`px-1 py-0.5 rounded hidden group-hover:inline-block z-20 font-medium shrink-0
            ${c.text} bg-white/80 hover:bg-white border border-current`}
          style={{ fontSize: '9px', borderOpacity: 0.3 }}
        >詳細</button>
      </div>

      {/* Row 2: 品名 */}
      <div className="text-slate-700 truncate">{order.productName}</div>

      {/* Row 3: 納期 + 生産量 */}
      <div className="flex items-center justify-between gap-0.5">
        <span className={`truncate ${dc}`}>📅 {order.finalDeadline}</span>
        <span className="font-mono shrink-0 text-slate-500" style={{ fontSize: '10px' }}>
          {order.totalQuantity.toLocaleString()}{order.unit}
        </span>
      </div>

      {/* Row 4: 期間コントロール + 使用材料 + 並び替え */}
      <div className="flex items-center gap-0.5 mt-0.5">
        {/* − ボタン */}
        <button
          onClick={e => { e.stopPropagation(); onShrink(); }}
          disabled={item.duration <= 1}
          className={`w-5 h-4 rounded flex items-center justify-center font-bold transition-colors
            ${item.duration <= 1 ? 'text-slate-300 cursor-not-allowed' : `${c.text} hover:${c.bg} hover:text-white`}`}
          style={{ fontSize: '13px' }}
        >−</button>

        <span className={`px-1 rounded ${c.bg} text-white font-bold whitespace-nowrap`} style={{ fontSize: '10px' }}>
          {item.duration}日
        </span>

        {/* ＋ ボタン */}
        <button
          onClick={e => { e.stopPropagation(); onExtend(); }}
          className={`w-5 h-4 rounded flex items-center justify-center font-bold transition-colors
            ${c.text} hover:${c.bg} hover:text-white`}
          style={{ fontSize: '13px' }}
        >＋</button>

        {continues && (
          <span className={`${c.text} opacity-60 ml-0.5`} style={{ fontSize: '10px' }}>▶</span>
        )}

        <div className="flex-1" />

        {/* 使用材料ポップアップ */}
        {bom.length > 0 && (
          <div className="relative">
            <button
              onMouseDown={e => e.stopPropagation()}
              onMouseEnter={() => setShowMat(true)}
              onMouseLeave={() => setShowMat(false)}
              onClick={e => e.stopPropagation()}
              className={`px-1 py-0.5 rounded border ${c.border} ${c.text} bg-white/70 hover:bg-white transition-colors`}
              style={{ fontSize: '9px' }}
            >使用材料</button>
            {showMat && (
              <div
                className="absolute bottom-full left-0 mb-1 z-40 bg-white rounded-lg shadow-xl border border-slate-200 p-2"
                style={{ minWidth: '160px', fontSize: '11px' }}
                onMouseEnter={() => setShowMat(true)}
                onMouseLeave={() => setShowMat(false)}
              >
                <div className="font-semibold text-slate-700 mb-1 pb-1 border-b border-slate-100">使用材料（{order.totalQuantity.toLocaleString()}{order.unit}分）</div>
                {bom.map((b, i) => {
                  const totalQty = Math.ceil(order.totalQuantity * b.requiredQty * (lossRate || 1.03) * 10) / 10;
                  return (
                    <div key={i} className="py-0.5 text-slate-600">
                      <div className="font-medium truncate">{b.materialName}</div>
                      <div className="flex justify-between gap-3 text-slate-400">
                        <span>{b.requiredQty}㎏/m</span>
                        <span className="font-bold text-blue-600">合計 {totalQty}㎏</span>
                      </div>
                    </div>
                  );
                })}
              </div>
            )}
          </div>
        )}

        {/* 並び替えボタン（複数スロット時のみ） */}
        {multi && (
          <div className="flex flex-col ml-0.5">
            <button
              onMouseDown={e => e.stopPropagation()}
              onClick={e => { e.stopPropagation(); onMoveUp?.(); }}
              disabled={!onMoveUp}
              className={`w-4 h-3 flex items-center justify-center rounded leading-none
                ${onMoveUp ? `${c.text} hover:${c.bg} hover:text-white` : 'text-slate-200 cursor-not-allowed'}`}
              style={{ fontSize: '9px' }}
            >▲</button>
            <button
              onMouseDown={e => e.stopPropagation()}
              onClick={e => { e.stopPropagation(); onMoveDown?.(); }}
              disabled={!onMoveDown}
              className={`w-4 h-3 flex items-center justify-center rounded leading-none
                ${onMoveDown ? `${c.text} hover:${c.bg} hover:text-white` : 'text-slate-200 cursor-not-allowed'}`}
              style={{ fontSize: '9px' }}
            >▼</button>
          </div>
        )}
      </div>
    </div>
  );
}

// ─── グルーピング関連定数 ────────────────────────────────────
const SHEATH_CODES = new Set(['BLK','RED','GRN','BLU','WHT','YEL','GRY','ORG','VIO','BRN','PNK','BLKRD','BLKY']);
function getBaseProductCode(productCode) {
  const parts = productCode.split('-');
  if (SHEATH_CODES.has(parts[parts.length - 1])) return parts.slice(0, -1).join('-');
  return productCode;
}

// ─── グルーピングモーダル ────────────────────────────────────
function GroupingModal({ proposals, onClose, onApply }) {
  const [selected, setSelected] = useState(new Set(
    proposals.filter(p => p.feasible).map(p => p.id)
  ));
  const toggle = (id) => setSelected(prev => {
    const next = new Set(prev);
    next.has(id) ? next.delete(id) : next.add(id);
    return next;
  });

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 p-4">
      <div className="bg-white rounded-2xl shadow-2xl max-w-2xl w-full max-h-[85vh] flex flex-col">
        <div className="px-6 py-4 border-b border-slate-200 flex-shrink-0">
          <div className="flex items-center justify-between">
            <div>
              <h3 className="font-bold text-slate-800">🔗 類似製品グルーピング提案</h3>
              <p className="text-xs text-slate-500 mt-0.5">
                {proposals.length}件のグループが見つかりました。同一機械で連続生産させる受注を選択してください。
              </p>
            </div>
            <button onClick={onClose} className="text-slate-400 hover:text-slate-600 text-xl w-8 h-8 flex items-center justify-center rounded-lg hover:bg-slate-100">×</button>
          </div>
        </div>

        <div className="flex-1 overflow-y-auto p-4 space-y-3">
          {proposals.length === 0 ? (
            <div className="text-center py-10 text-slate-400">
              <div className="text-4xl mb-2">🔍</div>
              グルーピング可能な製品が見つかりませんでした
            </div>
          ) : proposals.map(group => (
            <div
              key={group.id}
              onClick={() => toggle(group.id)}
              className={`rounded-xl border-2 p-4 cursor-pointer transition-all ${
                selected.has(group.id) ? 'border-blue-400 bg-blue-50' : 'border-slate-200 hover:border-slate-300 bg-white'
              }`}
            >
              <div className="flex items-center justify-between mb-2.5">
                <div className="flex items-center gap-2">
                  <input type="checkbox" checked={selected.has(group.id)} readOnly
                    className="w-4 h-4 accent-blue-600 pointer-events-none" />
                  <span className={`text-xs font-bold px-2 py-0.5 rounded-full ${
                    group.groupType === '同一品番'
                      ? 'bg-blue-100 text-blue-700'
                      : 'bg-purple-100 text-purple-700'
                  }`}>{group.groupType}</span>
                  <span className="text-sm font-mono font-bold text-slate-700">{group.baseCode}</span>
                  <span className="text-xs text-slate-400">{group.orders.length}受注</span>
                </div>
                <div>
                  {group.feasible
                    ? <span className="text-xs text-green-600 font-medium">✅ 納期内実施可能</span>
                    : <span className="text-xs text-orange-500 font-medium">⚠️ 納期タイト — 要確認</span>
                  }
                </div>
              </div>

              <div className="space-y-1">
                {group.orders.map(order => (
                  <div key={order.id} className="flex items-center gap-2 text-xs bg-white rounded-lg px-3 py-1.5 border border-slate-100">
                    <span className="font-mono text-slate-400 w-28 shrink-0">{order.orderNumber}</span>
                    <span className="text-slate-700 flex-1 truncate">{order.productName}</span>
                    <span className="font-mono text-slate-500 shrink-0 tabular-nums">
                      {order.totalQuantity.toLocaleString()}{order.unit}
                    </span>
                    <span className={`shrink-0 tabular-nums ${deadlineColor(order.finalDeadline)}`}>
                      📅 {order.finalDeadline}
                    </span>
                  </div>
                ))}
              </div>

              <div className="mt-2 text-xs text-slate-400">
                最短納期: <span className="font-medium">{[...group.orders].map(o=>o.finalDeadline).sort()[0]}</span>
                　最終納期: <span className="font-medium">{[...group.orders].map(o=>o.finalDeadline).sort().at(-1)}</span>
              </div>
            </div>
          ))}
        </div>

        <div className="px-6 py-4 border-t border-slate-200 flex items-center justify-between flex-shrink-0">
          <button onClick={onClose} className="btn-secondary text-sm">キャンセル</button>
          <div className="flex items-center gap-3">
            <span className="text-xs text-slate-500">{selected.size}件選択中</span>
            <button
              disabled={selected.size === 0}
              onClick={() => onApply([...selected])}
              className="btn-primary text-sm disabled:opacity-50 disabled:cursor-not-allowed"
            >
              🔗 選択グループを配置
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}

// ─── メインコンポーネント ─────────────────────────────────────
export default function ProductionSchedule() {
  const {
    orders, quotes, mfgOrders, products,
    productionSchedule: schedule,
    scheduleNewItem,
    scheduleMoveItem,
    scheduleUnassign,
    scheduleRemoveItem,
    scheduleUpdateDuration,
    scheduleReorderInSlot,
    scheduleBulkUpdate,
    scheduleAutoAssignBatch,
    setActiveApp,
    productOrderHistory,
    delayAlerts,
    resolveDelayAlert,
  } = useApp();

  const [weekStart, setWeekStart] = useState(() => getMonday(new Date('2026-05-19')));
  const [viewWeeks, setViewWeeks] = useState(1);
  const [activeProcess, setActiveProcess] = useState('全工程');
  const [dragItem, setDragItem] = useState(null);
  const [dragOverCell, setDragOverCell] = useState(null);
  const [detailOrder, setDetailOrder] = useState(null);
  const [showGroupingModal, setShowGroupingModal] = useState(false);
  const [groupingProposals, setGroupingProposals] = useState([]);
  const idCounter = useRef(200);
  const [unschFilterSearch, setUnschFilterSearch] = useState('');  // No.14
  const [viewMode, setViewMode] = useState('gantt');               // No.6: 'gantt'|'timeline'

  const [showLines, setShowLines] = useState(false);
  const [svgLines, setSvgLines] = useState([]);
  const [svgSize, setSvgSize] = useState({ w: 0, h: 0 });
  const [autoAssignMode, setAutoAssignMode] = useState('backward'); // 'backward'=逆算 | 'forward'=順次配置
  const gridContainerRef = useRef(null);

  useEffect(() => {
    if (!showLines) { setSvgLines([]); return; }
    const container = gridContainerRef.current;
    if (!container) return;
    const measure = () => {
      const cr = container.getBoundingClientRect();
      const sl = container.scrollLeft;
      const st = container.scrollTop;
      setSvgSize({ w: container.scrollWidth, h: container.scrollHeight });
      const byOrder = {};
      Object.values(schedule).flat().forEach(item => {
        (byOrder[item.orderId] ??= []).push(item);
      });
      const newLines = [];
      Object.values(byOrder).forEach(items => {
        const sorted = [...items].sort(
          (a, b) => PROCESS_ORDER.indexOf(a.process) - PROCESS_ORDER.indexOf(b.process)
        );
        for (let i = 0; i < sorted.length - 1; i++) {
          const from = sorted[i];
          const to   = sorted[i + 1];
          const fromEl = container.querySelector(`[data-item-id="${from.id}"]`);
          const toEl   = container.querySelector(`[data-item-id="${to.id}"]`);
          if (!fromEl || !toEl) continue;
          const fr = fromEl.getBoundingClientRect();
          const tr = toEl.getBoundingClientRect();
          newLines.push({
            x1: fr.right  - cr.left + sl,
            y1: fr.top + fr.height / 2 - cr.top + st,
            x2: tr.left   - cr.left + sl,
            y2: tr.top + tr.height / 2 - cr.top + st,
            color: COLOR_HEX[from.process] || '#94a3b8',
          });
        }
      });
      setSvgLines(newLines);
    };
    const timer = setTimeout(measure, 60);
    return () => clearTimeout(timer);
  }, [showLines, schedule, weekStart, viewWeeks, activeProcess]);

  const weekDays = getWeekDays(weekStart, viewWeeks);
  const todayStr = '2026-05-21';
  const weekEnd = fmt(weekDays[weekDays.length - 1]);
  const weekStartStr = fmt(weekDays[0]);

  const allMachines = PROCESS_ORDER.flatMap(proc =>
    (PROCESS_MACHINE_MAP[proc] || []).map(n => ({ id: n, name: n, process: proc }))
  );
  const visibleMachines = activeProcess === '全工程'
    ? allMachines
    : allMachines.filter(m => m.process === activeProcess);

  const scheduledSet = new Set(
    Object.values(schedule).flat().map(s => `${s.orderId}_${s.process}`)
  );
  const unscheduledItems = orders
    .filter(o => ['確定', '照会（仮押さえ）', '分納中'].includes(o.status))
    .flatMap(order => PROCESS_ORDER
      .filter(proc => !scheduledSet.has(`${order.id}_${proc}`))
      .map(proc => ({ orderId: order.id, process: proc }))
    );
  const filteredUnscheduled = (activeProcess === '全工程'
    ? unscheduledItems
    : unscheduledItems.filter(i => i.process === activeProcess)
  ).filter(item => {
    if (!unschFilterSearch) return true;
    const o = orders.find(ord => ord.id === item.orderId);
    const q = unschFilterSearch.toLowerCase();
    return o && (o.productName.toLowerCase().includes(q) || o.orderNumber.toLowerCase().includes(q) || o.customerName?.toLowerCase().includes(q));
  });

  // ── スロットマップ構築 ────────────────────────────────────────
  // startDate ごとにアイテムをグループ化（複数案件/スロット対応）
  function buildStartDayMap(machineId) {
    const items = schedule[machineId] || [];
    const map = {};
    items.forEach(item => {
      (map[item.startDate] ??= []).push(item);
    });
    Object.keys(map).forEach(d =>
      map[d].sort((a, b) => (a.slotOrder ?? 0) - (b.slotOrder ?? 0))
    );
    return map;
  }

  // 継続日（startDateではないが期間内に含まれる日）のマップ
  function buildCoverageMap(machineId) {
    const items = schedule[machineId] || [];
    const map = {};
    items.forEach(item => {
      for (let d = 1; d < item.duration; d++) {
        const ds = fmt(addDays(new Date(item.startDate), d));
        (map[ds] ??= []).push(item);
      }
    });
    return map;
  }

  // ── ドラッグ&ドロップ ─────────────────────────────────────────
  const handleDragStart = (e, payload) => {
    setDragItem(payload);
    e.dataTransfer.effectAllowed = 'move';
  };

  const isDragIncompatible = (machineProcess) =>
    dragItem !== null && !!dragItem.process && dragItem.process !== machineProcess;

  const handleDragOver = (e, cellKey, machineProcess) => {
    if (isDragIncompatible(machineProcess)) {
      e.dataTransfer.dropEffect = 'none';
      return;
    }
    e.preventDefault();
    e.dataTransfer.dropEffect = 'move';
    setDragOverCell(cellKey);
  };
  const handleDragLeave = () => setDragOverCell(null);

  const handleDrop = (e, machineId, date) => {
    e.preventDefault();
    if (!dragItem) return;
    const targetMachine = allMachines.find(m => m.id === machineId);
    if (targetMachine && isDragIncompatible(targetMachine.process)) {
      setDragItem(null); setDragOverCell(null); return;
    }
    const startDate = fmt(date);

    if (dragItem.fromMachineId) {
      scheduleMoveItem(dragItem.fromMachineId, machineId, {
        id: dragItem.id,
        orderId: dragItem.orderId,
        process: dragItem.process,
        duration: dragItem.duration || 1,
        startDate: dragItem.startDate,
      }, startDate);
    } else {
      const existingOnDay = (schedule[machineId] || []).filter(it => it.startDate === startDate);
      const newItem = {
        id: `si${idCounter.current++}`,
        orderId: dragItem.orderId,
        process: dragItem.process,
        startDate,
        duration: 1,
        slotOrder: existingOnDay.length,
      };
      scheduleNewItem(machineId, newItem);
    }
    setDragItem(null);
    setDragOverCell(null);
  };

  const handleDropToUnscheduled = (e) => {
    e.preventDefault();
    if (!dragItem?.fromMachineId) { setDragItem(null); return; }
    const item = (schedule[dragItem.fromMachineId] || []).find(it => it.id === dragItem.id);
    if (item) scheduleUnassign(dragItem.fromMachineId, item);
    setDragItem(null);
    setDragOverCell(null);
  };

  const handleExtend = (machineId, itemId) => scheduleUpdateDuration(machineId, itemId, +1);
  const handleShrink = (machineId, itemId) => scheduleUpdateDuration(machineId, itemId, -1);
  const handleRemove = (machineId, item) => scheduleRemoveItem(machineId, item);

  // ── 工程順序自動修正 ──────────────────────────────────────────
  // 翌営業日（土日・祝日スキップ）を返す
  function nextBizDay(dateStr) {
    let d = new Date(dateStr);
    do { d.setDate(d.getDate() + 1); }
    while (d.getDay() === 0 || d.getDay() === 6 || getHoliday(fmt(d)));
    return fmt(d);
  }

  // 1オーダーの違反を修正した新スケジュールを返す
  function fixOrderViolations(orderId, currentSchedule) {
    const items = [];
    Object.entries(currentSchedule).forEach(([machineId, machineItems]) => {
      (machineItems || []).forEach(item => {
        if (item.orderId === orderId) items.push({ ...item, machineId });
      });
    });
    if (items.length < 2) return currentSchedule;

    // PROCESS_ORDER 順にソート
    const sorted = [...items].sort(
      (a, b) => PROCESS_ORDER.indexOf(a.process) - PROCESS_ORDER.indexOf(b.process)
    );
    // 既存の日付を昇順ソート → 工程順に再割り当て（= swap）
    const dates = items.map(it => it.startDate).sort();
    sorted.forEach((item, i) => { item.startDate = dates[i]; });

    // 割り当て後に同日・重複が残る場合は翌営業日に送る
    for (let i = 1; i < sorted.length; i++) {
      const prev = sorted[i - 1];
      const curr = sorted[i];
      const prevEnd = fmt(addDays(new Date(prev.startDate), prev.duration - 1));
      if (curr.startDate <= prevEnd) {
        curr.startDate = nextBizDay(prevEnd);
      }
    }

    const idMap = {};
    sorted.forEach(it => { idMap[it.id] = it.startDate; });

    const newSchedule = {};
    Object.entries(currentSchedule).forEach(([machineId, machineItems]) => {
      newSchedule[machineId] = (machineItems || []).map(item =>
        idMap[item.id] !== undefined ? { ...item, startDate: idMap[item.id] } : item
      );
    });
    return newSchedule;
  }

  // 違反のある全オーダーをまとめて自動修正
  function handleAutoFix() {
    const violatedIds = [...new Set(orderViolations.map(v => v.orderId))];
    let newSchedule = schedule;
    violatedIds.forEach(orderId => {
      newSchedule = fixOrderViolations(orderId, newSchedule);
    });
    scheduleBulkUpdate(newSchedule);
  }

  // ── 未割り当て自動配置 ────────────────────────────────────────

  // n営業日前の日付を返す（n>0 で過去方向）
  function prevNBizDays(dateStr, n) {
    let d = new Date(dateStr);
    for (let count = 0; count < n; ) {
      d.setDate(d.getDate() - 1);
      if (d.getDay() !== 0 && d.getDay() !== 6 && !getHoliday(fmt(d))) count++;
    }
    return fmt(d);
  }

  // n営業日後の日付を返す（n>0 で未来方向）
  function nextNBizDays(dateStr, n) {
    let d = new Date(dateStr);
    for (let count = 0; count < n; ) {
      d.setDate(d.getDate() + 1);
      if (d.getDay() !== 0 && d.getDay() !== 6 && !getHoliday(fmt(d))) count++;
    }
    return fmt(d);
  }

  // 製品コード+工程に対して過去実績から機械を特定
  function findHistoricalMachine(productCode, proc, currentSchedule) {
    // 1. 現スケジュール内で同一製品コード+工程を探す（他オーダー含む）
    for (const [machineId, items] of Object.entries(currentSchedule)) {
      for (const item of (items || [])) {
        if (item.process !== proc) continue;
        const itemOrder = orders.find(o => o.id === item.orderId);
        if (itemOrder?.productCode === productCode) return machineId;
      }
    }
    // 2. 受注実績から同一製品コード+工程の機械を探す
    const histEntries = productOrderHistory?.[productCode] || [];
    for (const entry of histEntries) {
      if (entry.machines?.[proc]) return entry.machines[proc];
    }
    // 3. 完了済み製造指示から同一製品コードで工程に対応する機械を探す（フォールバック）
    const validMachines = PROCESS_MACHINE_MAP[proc] || [];
    const past = mfgOrders.find(m =>
      m.productCode === productCode &&
      (m.status === '完了' || m.actualOutput > 0) &&
      validMachines.includes(m.machine)
    );
    return past?.machine ?? null;
  }

  // ── スケジューリングエンジン（自動配置・グルーピング共通） ──
  const MAX_PER_DAY  = 3;
  const DEADLINE_BUF = 5;
  const PROCESS_BUF  = 2;

  function makeEngine(simSchedule) {
    const slotCount = {};
    Object.entries(simSchedule).forEach(([mid, items]) => {
      (items || []).forEach(item => {
        (slotCount[mid] ??= {})[item.startDate] = ((slotCount[mid] ?? {})[item.startDate] ?? 0) + 1;
      });
    });
    const getCount = (mid, d) => (slotCount[mid] ?? {})[d] ?? 0;
    const incCount = (mid, d) => { (slotCount[mid] ??= {})[d] = getCount(mid, d) + 1; };
    function findAvailableDate(machineId, targetDate, earliestDate) {
      const start = targetDate >= earliestDate ? targetDate : earliestDate;
      let back = start;
      while (back >= earliestDate) {
        if (getCount(machineId, back) < MAX_PER_DAY) return back;
        const d = new Date(back);
        d.setDate(d.getDate() - 1);
        while (d.getDay() === 0 || d.getDay() === 6 || getHoliday(fmt(d))) d.setDate(d.getDate() - 1);
        const prev = fmt(d);
        if (prev < earliestDate) break;
        back = prev;
      }
      let fwd = nextBizDay(start);
      for (let i = 0; i < 30; i++) {
        if (getCount(machineId, fwd) < MAX_PER_DAY) return fwd;
        fwd = nextBizDay(fwd);
      }
      return start;
    }
    return { getCount, incCount, findAvailableDate };
  }

  function handleAutoAssign() {
    const simSchedule = {};
    Object.entries(schedule).forEach(([k, v]) => { simSchedule[k] = [...(v || [])]; });
    const { incCount, findAvailableDate } = makeEngine(simSchedule);

    // 絞り込み済みの未割り当てのみ対象
    const orderMap = {};
    filteredUnscheduled.forEach(({ orderId, process: proc }) => {
      const order = orders.find(o => o.id === orderId);
      if (!order) return;
      (orderMap[orderId] ??= { order, procs: [] }).procs.push(proc);
    });

    const sortedOrders = Object.values(orderMap).sort(
      (a, b) => a.order.finalDeadline.localeCompare(b.order.finalDeadline)
    );

    const assignments = [];
    let localId = idCounter.current;

    sortedOrders.forEach(({ order, procs }) => {
      const machinePlan = {};
      procs.forEach(proc => {
        const mid = findHistoricalMachine(order.productCode, proc, simSchedule);
        if (mid) machinePlan[proc] = mid;
      });
      if (Object.keys(machinePlan).length === 0) return;

      const targetProcs = PROCESS_ORDER.filter(p => machinePlan[p]);

      // 逆算モード: 納期から各工程の目標開始日を逆算
      const targetStart = {};
      if (autoAssignMode === 'backward') {
        const lastProc = targetProcs[targetProcs.length - 1];
        targetStart[lastProc] = prevNBizDays(order.finalDeadline, DEADLINE_BUF);
        for (let i = targetProcs.length - 2; i >= 0; i--) {
          const proc     = targetProcs[i];
          const nextProc = targetProcs[i + 1];
          targetStart[proc] = prevNBizDays(targetStart[nextProc], PROCESS_BUF + 1);
        }
      }

      let prevActualDate = null;

      targetProcs.forEach(proc => {
        const machineId = machinePlan[proc];

        const earliest = prevActualDate
          ? nextNBizDays(prevActualDate, PROCESS_BUF)
          : nextBizDay(TODAY_STR);

        // 順次配置: 最早着手日をそのままターゲットに（前詰め）
        const target = autoAssignMode === 'forward' ? earliest : targetStart[proc];
        const actualDate = findAvailableDate(machineId, target, earliest);

        const existingOnDay = (simSchedule[machineId] || []).filter(it => it.startDate === actualDate);
        const newItem = {
          id: `si${localId++}`,
          orderId: order.id,
          process: proc,
          startDate: actualDate,
          duration: 1,
          slotOrder: existingOnDay.length,
          autoAssigned: true,
        };

        simSchedule[machineId] = [...(simSchedule[machineId] || []), newItem];
        incCount(machineId, actualDate);
        assignments.push({ machineId, item: newItem });

        prevActualDate = actualDate;
      });
    });

    if (assignments.length === 0) return;
    idCounter.current = localId;
    scheduleAutoAssignBatch(assignments);
    setActiveProcess('全工程');
    setUnschFilterSearch('');
  }

  // ── 類似製品グルーピング ────────────────────────────────────────
  function buildGroupingProposals() {
    const unscheduledOrders = [...new Set(unscheduledItems.map(i => i.orderId))]
      .map(id => orders.find(o => o.id === id))
      .filter(Boolean);

    // 同一品番グループ
    const byProductCode = {};
    unscheduledOrders.forEach(o => {
      (byProductCode[o.productCode] ??= []).push(o);
    });

    // シース色違いグループ（同一baseCode, 異なるproductCode）
    const byBaseCode = {};
    unscheduledOrders.forEach(o => {
      const base = getBaseProductCode(o.productCode);
      (byBaseCode[base] ??= []).push(o);
    });

    const proposals = [];
    let gid = 0;

    // 同一品番
    Object.entries(byProductCode).forEach(([code, grpOrders]) => {
      if (grpOrders.length < 2) return;
      const latestDeadline = grpOrders.map(o => o.finalDeadline).sort().at(-1);
      const feasible = latestDeadline >= nextNBizDays(TODAY_STR, DEADLINE_BUF);
      proposals.push({
        id: `grp${gid++}`,
        groupType: '同一品番',
        baseCode: code,
        orders: grpOrders,
        feasible,
      });
    });

    // シース色違い（同一baseCode で異なる品番が2件以上）
    Object.entries(byBaseCode).forEach(([base, grpOrders]) => {
      const uniqueCodes = [...new Set(grpOrders.map(o => o.productCode))];
      if (uniqueCodes.length < 2) return;
      // 既に同一品番グループとして取り上げたコードは除外
      if (uniqueCodes.length === 1 && byProductCode[uniqueCodes[0]]?.length >= 2) return;
      const latestDeadline = grpOrders.map(o => o.finalDeadline).sort().at(-1);
      const feasible = latestDeadline >= nextNBizDays(TODAY_STR, DEADLINE_BUF);
      proposals.push({
        id: `grp${gid++}`,
        groupType: 'シース色違い',
        baseCode: base,
        orders: grpOrders,
        feasible,
      });
    });

    return proposals;
  }

  function applyGroupings(selectedGroupIds) {
    const proposals = groupingProposals.filter(p => selectedGroupIds.includes(p.id));
    if (proposals.length === 0) return;

    const simSchedule = {};
    Object.entries(schedule).forEach(([k, v]) => { simSchedule[k] = [...(v || [])]; });
    const { incCount, findAvailableDate } = makeEngine(simSchedule);

    const assignments = [];
    let localId = idCounter.current;

    proposals.forEach(proposal => {
      // 同一グループ内は同じ機械を共有、納期が最も早いオーダーを基準に配置日を決定
      const sortedOrders = [...proposal.orders].sort(
        (a, b) => a.finalDeadline.localeCompare(b.finalDeadline)
      );

      // グループ内で使用する機械マップを決定（最初のオーダーの実績優先）
      const groupMachinePlan = {};
      for (const order of sortedOrders) {
        const orderUnscheduled = unscheduledItems.filter(i => i.orderId === order.id);
        orderUnscheduled.forEach(({ process: proc }) => {
          if (!groupMachinePlan[proc]) {
            const mid = findHistoricalMachine(order.productCode, proc, simSchedule);
            if (mid) groupMachinePlan[proc] = mid;
          }
        });
      }
      if (Object.keys(groupMachinePlan).length === 0) return;

      // グループ内の全オーダーについて、同一機械に連続日程で配置
      let groupPrevDate = null; // グループ内の直前オーダー最終工程日

      sortedOrders.forEach(order => {
        const orderUnscheduled = unscheduledItems.filter(i => i.orderId === order.id);
        if (orderUnscheduled.length === 0) return;

        const targetProcs = PROCESS_ORDER.filter(p =>
          groupMachinePlan[p] && orderUnscheduled.some(i => i.process === p)
        );
        if (targetProcs.length === 0) return;

        const lastProc = targetProcs[targetProcs.length - 1];
        const targetStart = {};
        targetStart[lastProc] = prevNBizDays(order.finalDeadline, DEADLINE_BUF);
        for (let i = targetProcs.length - 2; i >= 0; i--) {
          targetStart[targetProcs[i]] = prevNBizDays(targetStart[targetProcs[i + 1]], PROCESS_BUF + 1);
        }

        let prevActualDate = groupPrevDate;

        targetProcs.forEach(proc => {
          const machineId = groupMachinePlan[proc];
          const earliest = prevActualDate
            ? nextNBizDays(prevActualDate, PROCESS_BUF)
            : nextBizDay(TODAY_STR);
          const actualDate = findAvailableDate(machineId, targetStart[proc], earliest);

          const existingOnDay = (simSchedule[machineId] || []).filter(it => it.startDate === actualDate);
          const newItem = {
            id: `si${localId++}`,
            orderId: order.id,
            process: proc,
            startDate: actualDate,
            duration: 1,
            slotOrder: existingOnDay.length,
            groupId: proposal.id,
          };
          simSchedule[machineId] = [...(simSchedule[machineId] || []), newItem];
          incCount(machineId, actualDate);
          assignments.push({ machineId, item: newItem });
          prevActualDate = actualDate;
        });

        groupPrevDate = prevActualDate;
      });
    });

    if (assignments.length === 0) return;
    idCounter.current = localId;
    scheduleAutoAssignBatch(assignments);
    setShowGroupingModal(false);
  }

  // 自動配置可能な件数（絞り込み後・過去実績あり）
  const assignableCount = filteredUnscheduled.filter(({ orderId, process: proc }) => {
    const order = orders.find(o => o.id === orderId);
    if (!order) return false;
    return !!findHistoricalMachine(order.productCode, proc, schedule);
  }).length;

  const weekItemCount = Object.values(schedule).flat().filter(it => {
    const end = fmt(addDays(new Date(it.startDate), it.duration - 1));
    return it.startDate <= weekEnd && end >= weekStartStr;
  }).length;

  const prevWeek = () => { const d = new Date(weekStart); d.setDate(d.getDate() - 7 * viewWeeks); setWeekStart(d); };
  const nextWeek = () => { const d = new Date(weekStart); d.setDate(d.getDate() + 7 * viewWeeks); setWeekStart(d); };
  const goToday  = () => setWeekStart(getMonday(new Date(todayStr)));

  // 工程順序違反チェック
  const orderViolations = (() => {
    const byOrder = {};
    Object.values(schedule).flat().forEach(item => {
      (byOrder[item.orderId] ??= []).push(item);
    });
    const result = [];
    Object.entries(byOrder).forEach(([orderId, items]) => {
      const sorted = [...items].sort((a, b) =>
        PROCESS_ORDER.indexOf(a.process) - PROCESS_ORDER.indexOf(b.process)
      );
      for (let i = 0; i < sorted.length - 1; i++) {
        const a = sorted[i];
        const b = sorted[i + 1];
        const aEnd = fmt(addDays(new Date(a.startDate), a.duration - 1));
        if (b.startDate <= aEnd) {
          const order = orders.find(o => o.id === orderId);
          result.push({
            orderId,
            orderNumber: order?.orderNumber ?? orderId,
            productName: order?.productName ?? '',
            from: a.process, fromEnd: aEnd,
            to: b.process,   toStart: b.startDate,
          });
        }
      }
    });
    return result;
  })();

  // ── 機械行レンダリング（複数スロット対応）────────────────────
  function renderMachineRow(machine) {
    const startMap    = buildStartDayMap(machine.id);
    const coverageMap = buildCoverageMap(machine.id);

    return weekDays.map(day => {
      const dStr          = fmt(day);
      const startItems    = startMap[dStr] || [];
      const coveredItems  = coverageMap[dStr] || [];
      const isSat         = day.getDay() === 6;
      const isToday       = dStr === todayStr;
      const holiday       = getHoliday(dStr);
      const isHoliday     = !!holiday;
      const isOver        = dragOverCell === `${machine.id}_${dStr}`;

      return (
        <td
          key={dStr}
          className={`px-1 py-1 border-r border-slate-100 last:border-r-0 align-top transition-colors
            ${isOver     ? 'bg-blue-50 ring-2 ring-inset ring-blue-400' :
              isHoliday  ? 'bg-red-50/60' :
              isToday    ? 'bg-blue-50/30' :
              isSat      ? 'bg-slate-50' : ''}`}
          style={{ minWidth: 110, minHeight: 64, verticalAlign: 'top' }}
          onDragOver={isHoliday
            ? e => { e.dataTransfer.dropEffect = 'none'; setDragOverCell(null); }
            : e => handleDragOver(e, `${machine.id}_${dStr}`, machine.process)
          }
          onDragLeave={handleDragLeave}
          onDrop={isHoliday ? e => e.preventDefault() : e => handleDrop(e, machine.id, day)}
        >
          {/* 継続中バッジ（前日以前に開始した案件が継続している日） */}
          {coveredItems.length > 0 && (
            <div className="mb-0.5 space-y-0.5">
              {coveredItems.map(item => {
                const cc  = COLORS[item.process] || {};
                const ord = orders.find(o => o.id === item.orderId);
                return (
                  <div
                    key={item.id}
                    className={`flex items-center gap-1 px-1 rounded border ${cc.border} ${cc.light} opacity-50`}
                    style={{ fontSize: '9px' }}
                  >
                    <span className={cc.text}>◀</span>
                    <span className={`font-mono ${cc.text} truncate`}>{ord?.orderNumber}</span>
                  </div>
                );
              })}
            </div>
          )}

          {/* 祝日表示 */}
          {isHoliday && startItems.length === 0 && (
            <div className="text-center text-red-300 pt-1 select-none leading-tight" style={{ fontSize: '10px' }}>
              🎌<br /><span>{holiday}</span>
            </div>
          )}

          {/* ドロップ先ガイド（空セルのみ） */}
          {!isHoliday && isOver && dragItem && startItems.length === 0 && coveredItems.length === 0 && (
            <div className={`p-1 rounded border-2 border-dashed text-center opacity-70
              ${COLORS[dragItem.process]?.border ?? 'border-blue-400'}
              ${COLORS[dragItem.process]?.light ?? 'bg-blue-50'}
              ${COLORS[dragItem.process]?.text ?? 'text-blue-600'}`}
              style={{ fontSize: '10px' }}
            >配置</div>
          )}

          {/* 積み重ねカード */}
          <div className="space-y-0.5">
            {startItems.map((item, idx) => {
              const order = orders.find(o => o.id === item.orderId);
              if (!order) return null;
              const isDragging = dragItem?.id === item.id;
              const quote = quotes.find(q => q.productCode === order.productCode && q.bom?.length > 0);
              const lr    = quote?.lossRate ?? 1.03;
              // 該当工程の材料IDをproductBOMsから取得してquote BOMを絞り込む
              const product = products.find(p => p.productCode === order.productCode);
              const procMatIds = product
                ? (initialProductBOMs[product.id] ?? [])
                    .filter(b => b.process === item.process)
                    .map(b => b.materialId)
                : [];
              const quoteBom = quote?.bom ?? [];
              const bom = procMatIds.length > 0
                ? quoteBom.filter(b => procMatIds.includes(b.materialId))
                : quoteBom;
              return (
                <ScheduledCard
                  key={item.id}
                  item={item}
                  order={order}
                  bom={bom}
                  lossRate={lr}
                  slotPos={idx + 1}
                  slotTotal={startItems.length}
                  dragging={isDragging}
                  isHighlighted={detailOrder?.id === order.id}
                  commentCount={mfgOrders?.find(m => m.orderId === order.id)?.comments?.length || 0}
                  onDragStart={e => handleDragStart(e, { ...item, fromMachineId: machine.id })}
                  onRemove={() => handleRemove(machine.id, item)}
                  onExtend={() => handleExtend(machine.id, item.id)}
                  onShrink={() => handleShrink(machine.id, item.id)}
                  onDetail={() => setDetailOrder(order)}
                  onMoveUp={idx > 0 ? () => scheduleReorderInSlot(machine.id, dStr, item.id, -1) : null}
                  onMoveDown={idx < startItems.length - 1 ? () => scheduleReorderInSlot(machine.id, dStr, item.id, +1) : null}
                />
              );
            })}
          </div>
        </td>
      );
    });
  }

  // ── JSX ──────────────────────────────────────────────────────
  return (
    <div className="flex flex-col md:flex-row gap-4" style={{ minHeight: 0 }}>

      {/* 左: 未割り当てパネル */}
      <div
        className={`w-full md:w-52 md:flex-shrink-0 flex flex-col rounded-xl border-2 bg-white transition-colors
          ${dragOverCell === '__unscheduled__' ? 'border-blue-400 bg-blue-50/50' : 'border-slate-200'}`}
        onDragOver={e => { e.preventDefault(); setDragOverCell('__unscheduled__'); }}
        onDrop={handleDropToUnscheduled}
        onDragLeave={() => setDragOverCell(null)}
      >
        <div className="px-3 py-3 border-b border-slate-200">
          <div className="font-semibold text-slate-700 text-sm">📋 未割り当て</div>
          {/* No.14 キーワード検索 */}
          <input
            type="text"
            className="mt-1.5 w-full text-xs border border-slate-200 rounded-lg px-2 py-1 focus:outline-none focus:ring-1 focus:ring-blue-400"
            placeholder="品名・受注No・得意先で絞り込み"
            value={unschFilterSearch}
            onChange={e => setUnschFilterSearch(e.target.value)}
          />
          <div className="text-xs text-slate-400 mt-1">
            {filteredUnscheduled.length}工程{unschFilterSearch && '（絞り込み中）'}
            {dragOverCell === '__unscheduled__' && dragItem?.fromMachineId && (
              <span className="ml-1 text-blue-600 font-medium">← ドロップで解除</span>
            )}
          </div>
          <div className="flex flex-col gap-1 mt-1.5">
            {assignableCount > 0 && (
              <div className="flex flex-col gap-0.5">
                <div className="flex gap-0.5">
                  {[['backward','逆算'], ['forward','順次']].map(([mode, label]) => (
                    <button
                      key={mode}
                      onClick={() => setAutoAssignMode(mode)}
                      title={mode === 'backward' ? '納期から逆算して配置' : '着手可能日から順次配置'}
                      className={`flex-1 px-1 py-0.5 rounded text-xs font-medium transition-colors ${
                        autoAssignMode === mode
                          ? 'bg-emerald-600 text-white'
                          : 'bg-slate-100 text-slate-500 hover:bg-slate-200'
                      }`}
                    >{label}</button>
                  ))}
                </div>
                <button
                  onClick={handleAutoAssign}
                  className="flex items-center gap-0.5 px-1.5 py-0.5 rounded text-xs font-semibold bg-emerald-100 text-emerald-700 hover:bg-emerald-200 transition-colors"
                  title={autoAssignMode === 'backward' ? '納期から逆算して自動配置' : '着手可能日から順次自動配置'}
                >
                  ⚡ 自動配置 ({assignableCount}件)
                </button>
              </div>
            )}
            <button
              onClick={() => {
                const proposals = buildGroupingProposals();
                setGroupingProposals(proposals);
                setShowGroupingModal(true);
              }}
              className="flex items-center gap-0.5 px-1.5 py-0.5 rounded text-xs font-semibold bg-violet-100 text-violet-700 hover:bg-violet-200 transition-colors"
              title="類似製品グルーピングで同一/近似品番をまとめて配置"
            >
              🔗 グルーピング
            </button>
          </div>
        </div>
        <div className="flex-1 overflow-y-auto p-2 space-y-1.5 max-h-40 md:max-h-none">
          {filteredUnscheduled.length === 0 ? (
            <div className="text-center text-xs text-slate-400 py-6">すべての工程が<br/>スケジュール済み</div>
          ) : filteredUnscheduled.map((item, idx) => {
            const order = orders.find(o => o.id === item.orderId);
            if (!order) return null;
            const isDragging = !dragItem?.fromMachineId &&
              dragItem?.orderId === item.orderId && dragItem?.process === item.process;
            return (
              <UnscheduledCard
                key={`${item.orderId}_${item.process}_${idx}`}
                order={order} process={item.process} dragging={isDragging}
                onDragStart={e => handleDragStart(e, { orderId: item.orderId, process: item.process })}
                onDetail={() => setDetailOrder(order)}
              />
            );
          })}
        </div>
        <div className="p-3 border-t border-slate-200 space-y-1">
          {PROCESS_ORDER.map(p => (
            <div key={p} className="flex items-center gap-2">
              <div className={`w-2.5 h-2.5 rounded-full ${COLORS[p]?.bg}`} />
              <span className="text-xs text-slate-600">{p}</span>
              <span className="text-xs text-slate-400 ml-auto">{(PROCESS_MACHINE_MAP[p]||[]).length}台</span>
            </div>
          ))}
        </div>
      </div>

      {/* 右: グリッドエリア */}
      <div className="flex-1 flex flex-col min-w-0">

        {/* コントロールバー */}
        <div className="flex items-center justify-between mb-3 flex-shrink-0 flex-wrap gap-2">
          <div className="flex items-center gap-2">
            <button onClick={prevWeek} className="btn-secondary px-3 py-1.5 text-sm">◀</button>
            <span className="text-sm font-bold text-slate-700 min-w-[170px] text-center">
              {weekDays[0].getMonth()+1}/{weekDays[0].getDate()} 〜 {weekDays[weekDays.length-1].getMonth()+1}/{weekDays[weekDays.length-1].getDate()}
            </span>
            <button onClick={nextWeek} className="btn-secondary px-3 py-1.5 text-sm">▶</button>
            <button onClick={goToday}  className="btn-secondary px-2.5 py-1.5 text-xs">今週</button>
            <div className="flex rounded-lg border border-slate-200 overflow-hidden ml-1">
              {[1, 2].map(w => (
                <button key={w} onClick={() => setViewWeeks(w)}
                  className={`px-2.5 py-1.5 text-xs font-semibold transition-colors
                    ${viewWeeks === w ? 'bg-slate-700 text-white' : 'bg-white text-slate-500 hover:bg-slate-50'}`}
                >{w}週</button>
              ))}
            </div>
          </div>
          <div className="flex items-center gap-2 text-xs text-slate-500 flex-wrap">
            <span>この週に関連：<strong className="text-blue-700">{weekItemCount}件</strong></span>
            <span className="text-slate-300">|</span>
            <span>未割り当て：<strong className="text-orange-600">{unscheduledItems.length}工程</strong></span>
            <span className="text-slate-300">|</span>
            {/* No.6 設備別タイムライン切替 */}
            <div className="flex rounded-lg border border-slate-200 overflow-hidden">
              <button onClick={() => setViewMode('gantt')}
                className={`px-2.5 py-1 text-xs font-semibold transition-colors ${viewMode==='gantt' ? 'bg-slate-700 text-white' : 'bg-white text-slate-500 hover:bg-slate-50'}`}>
                ガント
              </button>
              <button onClick={() => setViewMode('timeline')}
                className={`px-2.5 py-1 text-xs font-semibold transition-colors ${viewMode==='timeline' ? 'bg-slate-700 text-white' : 'bg-white text-slate-500 hover:bg-slate-50'}`}>
                タイムライン
              </button>
            </div>
            <span className="text-slate-300">|</span>
            <button
              onClick={() => setShowLines(v => !v)}
              className={`flex items-center gap-1 px-2.5 py-1 rounded-lg border font-semibold transition-all
                ${showLines
                  ? 'bg-slate-700 text-white border-slate-700 shadow-sm'
                  : 'bg-white text-slate-500 border-slate-200 hover:border-slate-400 hover:text-slate-700'}`}
            >
              <svg width="14" height="14" viewBox="0 0 14 14" fill="none" className="shrink-0">
                <circle cx="2" cy="7" r="2" fill="currentColor"/>
                <path d="M4 7 C6 7, 8 3, 10 3" stroke="currentColor" strokeWidth="1.5" fill="none"/>
                <circle cx="12" cy="3" r="2" fill="currentColor"/>
              </svg>
              工程ライン
            </button>
          </div>
        </div>

        {/* 工程フィルタ */}
        <div className="flex gap-1 mb-3 flex-shrink-0 flex-wrap">
          {['全工程', ...PROCESS_ORDER].map(p => {
            const c = COLORS[p] || {};
            const isActive = activeProcess === p;
            return (
              <button key={p} onClick={() => setActiveProcess(p)}
                className={`px-3 py-1.5 rounded-lg text-xs font-semibold transition-all border
                  ${isActive
                    ? p === '全工程' ? 'bg-slate-700 text-white border-slate-700' : `${c.bg} text-white border-transparent`
                    : `bg-white ${c.text||'text-slate-600'} ${c.border||'border-slate-200'} hover:opacity-80`}`}
              >
                {p}{p !== '全工程' && <span className="ml-1 opacity-60 font-normal">{PROCESS_MACHINE_MAP[p]?.length}台</span>}
              </button>
            );
          })}
        </div>

        {/* 遅延アラートバナー */}
        {(delayAlerts?.filter(a => a.status === 'active').length > 0) && (
          <div className="mb-3 rounded-xl border border-orange-300 bg-orange-50 px-4 py-3 flex-shrink-0">
            <div className="flex items-center gap-2 mb-2">
              <span className="text-sm font-bold text-orange-700">
                🔔 遅延アラート（{delayAlerts.filter(a => a.status === 'active').length}件）
              </span>
              <span className="text-xs text-orange-500 ml-1">製造日報から発出されたアラートです</span>
            </div>
            <div className="space-y-2">
              {delayAlerts.filter(a => a.status === 'active').map(alert => (
                <div key={alert.id} className="flex items-start gap-3 bg-white rounded-lg px-3 py-2 border border-orange-100">
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center gap-2 flex-wrap">
                      <span className="text-xs font-bold text-slate-700">{alert.orderNumber}</span>
                      <span className="text-xs text-slate-500 truncate">{alert.productName}</span>
                      <span className={`text-xs font-semibold px-1.5 py-0.5 rounded ${
                        alert.processName === '撚線' ? 'bg-amber-100 text-amber-700'
                        : alert.processName === '編組' ? 'bg-orange-100 text-orange-700'
                        : alert.processName === '押出' ? 'bg-blue-100 text-blue-700'
                        : 'bg-purple-100 text-purple-700'
                      }`}>{alert.processName}</span>
                    </div>
                    <p className="text-xs text-slate-600 mt-1">{alert.comment}</p>
                    <div className="text-xs text-slate-400 mt-0.5">
                      {alert.createdAt} — {alert.createdBy}
                    </div>
                  </div>
                  <div className="flex flex-col gap-1 shrink-0">
                    <button
                      onClick={() => {
                        const order = orders.find(o => o.id === alert.orderId);
                        if (order) setDetailOrder(order);
                      }}
                      className="text-xs px-2.5 py-1 rounded-lg bg-orange-100 text-orange-700 hover:bg-orange-200 transition-colors font-medium"
                    >
                      案件詳細
                    </button>
                    <button
                      onClick={() => resolveDelayAlert(alert.id)}
                      className="text-xs px-2.5 py-1 rounded-lg bg-slate-100 text-slate-500 hover:bg-slate-200 transition-colors font-medium"
                    >
                      解除
                    </button>
                  </div>
                </div>
              ))}
            </div>
          </div>
        )}

        {/* 工程順序違反アラート */}
        {orderViolations.length > 0 && (
          <div className="mb-3 rounded-xl border border-red-300 bg-red-50 px-4 py-3 flex-shrink-0">
            <div className="flex items-center gap-2 mb-1.5">
              <span className="text-sm font-bold text-red-700">⚠️ 工程順序の逆転が検出されました（{orderViolations.length}件）</span>
              <button
                onClick={handleAutoFix}
                className="ml-auto text-xs px-3 py-1.5 rounded-lg bg-red-600 text-white hover:bg-red-700 active:bg-red-800 font-semibold transition-colors flex items-center gap-1 shrink-0 shadow-sm"
              >
                ⚡ 自動並び替え
              </button>
            </div>
            <ul className="space-y-1">
              {orderViolations.map((v, i) => (
                <li key={i} className="text-xs text-red-700 flex items-start gap-1.5">
                  <span className="mt-0.5 shrink-0">•</span>
                  <span>
                    <span className="font-semibold">{v.orderNumber}</span>
                    <span className="text-red-500">（{v.productName}）</span>
                    ：<span className="font-bold">{v.to}</span> 開始日 {v.toStart} が
                    <span className="font-bold"> {v.from}</span> 終了日 {v.fromEnd} より前です
                  </span>
                </li>
              ))}
            </ul>
          </div>
        )}

        {/* No.6 設備別タイムラインビュー */}
        {viewMode === 'timeline' && (
          <div className="flex-1 overflow-auto bg-white rounded-xl border border-slate-200 shadow-sm">
            <div className="p-4">
              <div className="text-sm font-semibold text-slate-700 mb-3">
                設備別タイムライン — {weekDays[0].getMonth()+1}/{weekDays[0].getDate()} 〜 {weekDays[weekDays.length-1].getMonth()+1}/{weekDays[weekDays.length-1].getDate()}
              </div>
              {/* ヘッダー行（日付） */}
              <div className="flex mb-1">
                <div className="w-28 shrink-0" />
                {weekDays.map(d => {
                  const ds = fmt(d);
                  const isToday = ds === todayStr;
                  return (
                    <div key={ds} className={`flex-1 text-center text-xs font-medium py-1 ${isToday ? 'text-blue-700 font-bold' : 'text-slate-500'}`}>
                      {d.getMonth()+1}/{d.getDate()}<br/>
                      <span className="text-xs opacity-60">{'日月火水木金土'[d.getDay()]}</span>
                    </div>
                  );
                })}
              </div>
              {/* 機械行 */}
              {visibleMachines.filter(m => (schedule[m.id]||[]).length > 0).map(machine => {
                const c = COLORS[machine.process] || {};
                const items = schedule[machine.id] || [];
                return (
                  <div key={machine.id} className="flex items-center mb-1.5 min-h-[32px]">
                    <div className="w-28 shrink-0 text-xs font-mono text-slate-600 truncate pr-2">{machine.id}</div>
                    <div className="flex-1 relative h-7 bg-slate-50 rounded border border-slate-200 flex">
                      {weekDays.map((d, di) => {
                        const ds = fmt(d);
                        const isToday = ds === todayStr;
                        const dayItems = items.filter(it => {
                          const start = new Date(it.startDate);
                          const end = addDays(start, it.duration - 1);
                          return new Date(ds) >= start && new Date(ds) <= end;
                        });
                        return (
                          <div key={ds} className={`flex-1 h-full border-r border-slate-200 last:border-r-0 ${isToday ? 'bg-blue-50' : ''} relative`}>
                            {dayItems.map((it, idx) => {
                              const o = orders.find(ord => ord.id === it.orderId);
                              const isHighlighted = detailOrder?.id === it.orderId;
                              return (
                                <div
                                  key={it.id}
                                  onClick={() => o && setDetailOrder(o)}
                                  title={o?.productName}
                                  className={`absolute inset-x-0 cursor-pointer rounded ${c.bg || 'bg-slate-400'} ${isHighlighted ? 'ring-2 ring-offset-1 ring-yellow-400' : ''}`}
                                  style={{ top: idx * 8, height: 7, opacity: 0.8 }}
                                />
                              );
                            })}
                          </div>
                        );
                      })}
                    </div>
                  </div>
                );
              })}
              {visibleMachines.filter(m => (schedule[m.id]||[]).length > 0).length === 0 && (
                <div className="text-center text-xs text-slate-400 py-8">この期間にスケジュールされた案件がありません</div>
              )}
            </div>
          </div>
        )}

        {/* グリッド */}
        <div
          ref={gridContainerRef}
          className={`flex-1 overflow-auto bg-white rounded-xl border border-slate-200 shadow-sm relative ${viewMode !== 'gantt' ? 'hidden' : ''}`}
        >
          {showLines && svgSize.w > 0 && (
            <svg
              className="absolute top-0 left-0 pointer-events-none z-10"
              style={{ width: svgSize.w, height: svgSize.h }}
            >
              <defs>
                {Object.entries(COLOR_HEX).map(([proc, hex]) => (
                  <marker key={proc} id={`arrow-${proc}`} markerWidth="7" markerHeight="7" refX="6" refY="3.5" orient="auto">
                    <polygon points="0 0, 7 3.5, 0 7" fill={hex} opacity="0.75" />
                  </marker>
                ))}
              </defs>
              {svgLines.map((line, i) => {
                const dx = Math.max(Math.abs(line.x2 - line.x1) * 0.45, 50);
                const path = `M ${line.x1} ${line.y1} C ${line.x1+dx} ${line.y1}, ${line.x2-dx} ${line.y2}, ${line.x2} ${line.y2}`;
                const proc = Object.entries(COLOR_HEX).find(([, h]) => h === line.color)?.[0] || '';
                return (
                  <g key={i}>
                    <path d={path} fill="none" stroke={line.color} strokeWidth="2.5" opacity="0.65" markerEnd={`url(#arrow-${proc})`} />
                    <circle cx={line.x1} cy={line.y1} r="4" fill={line.color} opacity="0.75" />
                  </g>
                );
              })}
            </svg>
          )}

          <table className="border-collapse" style={{ minWidth: 720, width: '100%' }}>
            <thead className="sticky top-0 z-20">
              <tr className="bg-slate-50 border-b-2 border-slate-300">
                <th className="sticky left-0 z-30 bg-slate-50 px-3 py-2.5 text-left text-xs font-semibold text-slate-600 border-r-2 border-slate-300 w-24">機械</th>
                {weekDays.map(d => {
                  const dStr = fmt(d);
                  const isToday   = dStr === todayStr;
                  const isSat     = d.getDay() === 6;
                  const holiday   = getHoliday(dStr);
                  const isHoliday = !!holiday;
                  return (
                    <th key={dStr}
                      className={`text-center px-2 py-2 text-xs font-semibold border-r border-slate-200 last:border-r-0
                        ${isToday   ? 'bg-blue-100 text-blue-800' :
                          isHoliday ? 'bg-red-50 text-red-500' :
                          isSat     ? 'bg-slate-100 text-slate-400' : 'text-slate-600'}`}
                      style={{ minWidth: 110 }}
                    >
                      <div className="font-bold">{fmtHeader(d)}</div>
                      {isToday   && <div className="text-blue-600 text-xs font-normal">▼ TODAY</div>}
                      {isHoliday && <div className="text-red-400 text-xs font-normal truncate leading-tight">{holiday}</div>}
                    </th>
                  );
                })}
              </tr>
            </thead>
            <tbody>
              {visibleMachines.map((machine, mIdx) => {
                const prev = visibleMachines[mIdx - 1];
                const isBoundary = activeProcess === '全工程' && (!prev || prev.process !== machine.process);
                const c = COLORS[machine.process] || {};
                return (
                  <>
                    {isBoundary && (
                      <tr key={`sep_${machine.process}`}>
                        <td colSpan={weekDays.length + 1} className={`px-3 py-1 text-xs font-bold border-b border-t border-slate-200 ${c.header} ${c.text}`}>
                          ── {machine.process}工程（{PROCESS_MACHINE_MAP[machine.process]?.length}台）──
                        </td>
                      </tr>
                    )}
                    <tr
                      key={machine.id}
                      className={`border-b border-slate-100 transition-all duration-150
                        ${isDragIncompatible(machine.process)
                          ? 'opacity-20 pointer-events-none select-none'
                          : 'hover:bg-slate-50/20'}`}
                    >
                      <td className="sticky left-0 z-10 bg-white px-2 py-2 border-r-2 border-slate-200 whitespace-nowrap">
                        <span className={`inline-block px-2 py-1 rounded text-xs font-bold ${c.light} ${c.text} border ${c.border}`}>
                          {machine.name}
                        </span>
                      </td>
                      {renderMachineRow(machine)}
                    </tr>
                  </>
                );
              })}
            </tbody>
          </table>
        </div>

        {/* 操作ヒント */}
        <div className="mt-2 flex items-center gap-4 text-xs text-slate-400 flex-shrink-0 flex-wrap">
          <span>💡 左パネルからD&Dで配置（同一セルへ複数配置可）</span>
          <span>•</span>
          <span>カード上の <strong>− / ＋</strong> で期間調整</span>
          <span>•</span>
          <span><strong>▲▼</strong> で同一スロット内の順番変更</span>
          <span>•</span>
          <span><strong>使用材料</strong> ホバーで材料確認</span>
          <span>•</span>
          <span>カード右上 <strong>×</strong> で解除</span>
        </div>
      </div>

      {/* 受注詳細モーダル */}
      <OrderDetailModal
        order={detailOrder}
        products={products}
        onClose={() => setDetailOrder(null)}
        onNavigate={() => { setDetailOrder(null); setActiveApp('order'); }}
      />

      {/* 類似製品グルーピングモーダル */}
      {showGroupingModal && (
        <GroupingModal
          proposals={groupingProposals}
          onClose={() => setShowGroupingModal(false)}
          onApply={applyGroupings}
        />
      )}
    </div>
  );
}
