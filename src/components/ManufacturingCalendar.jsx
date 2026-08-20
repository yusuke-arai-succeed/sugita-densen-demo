import { useState, useMemo, useCallback } from 'react';
import { useApp } from '../context/AppContext';

const PROCESS_ORDER = ['撚線', '編組', '押出', '加工'];
const TODAY_STR = '2026-05-21';
const DAY_LABELS = ['月', '火', '水', '木', '金', '土'];

const PROC_COLOR = {
  '撚線': { chip: 'bg-amber-50 text-amber-800 border-amber-300',   dot: 'bg-amber-400',  badge: 'bg-amber-100 text-amber-800' },
  '編組': { chip: 'bg-orange-50 text-orange-800 border-orange-300', dot: 'bg-orange-400', badge: 'bg-orange-100 text-orange-800' },
  '押出': { chip: 'bg-blue-50 text-blue-800 border-blue-300',       dot: 'bg-blue-400',   badge: 'bg-blue-100 text-blue-800' },
  '加工': { chip: 'bg-purple-50 text-purple-800 border-purple-300', dot: 'bg-purple-400', badge: 'bg-purple-100 text-purple-800' },
};

const INSP_CHIP  = 'bg-emerald-50 text-emerald-800 border-emerald-300';
const INSP_DOT   = 'bg-emerald-500';
const TRIAL_RING = 'ring-2 ring-orange-400 ring-offset-0';

const ORDER_PALETTE = [
  { chip: 'bg-rose-50 text-rose-800 border-rose-300',     dot: 'bg-rose-400' },
  { chip: 'bg-violet-50 text-violet-800 border-violet-300', dot: 'bg-violet-400' },
  { chip: 'bg-cyan-50 text-cyan-800 border-cyan-300',     dot: 'bg-cyan-400' },
  { chip: 'bg-lime-50 text-lime-800 border-lime-300',     dot: 'bg-lime-400' },
  { chip: 'bg-pink-50 text-pink-800 border-pink-300',     dot: 'bg-pink-400' },
  { chip: 'bg-indigo-50 text-indigo-800 border-indigo-300', dot: 'bg-indigo-400' },
  { chip: 'bg-teal-50 text-teal-800 border-teal-300',     dot: 'bg-teal-400' },
  { chip: 'bg-sky-50 text-sky-800 border-sky-300',        dot: 'bg-sky-400' },
];

function fmt(d) { return d.toISOString().slice(0, 10); }
function addDays(d, n) { const r = new Date(d); r.setDate(r.getDate() + n); return r; }

function getMonday(d) {
  const dt = new Date(d);
  dt.setHours(0, 0, 0, 0);
  const day = dt.getDay();
  dt.setDate(dt.getDate() + (day === 0 ? -6 : 1 - day));
  return dt;
}

function buildMonthGrid(year, month) {
  const firstDay = new Date(year, month, 1);
  const lastDay  = new Date(year, month + 1, 0);
  let monday = getMonday(firstDay);
  const weeks = [];
  while (monday <= lastDay && weeks.length < 6) {
    weeks.push(Array.from({ length: 6 }, (_, i) => addDays(monday, i)));
    monday = addDays(monday, 7);
  }
  return weeks;
}

// ── 案件詳細ポップアップ ───────────────────────────────────────────────
function EventDetailModal({ item, mfgOrder, onClose, onGoMfg }) {
  if (!item) return null;

  // 検査予定の詳細モーダル
  if (item.type === 'inspection') {
    return (
      <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 p-4" onClick={onClose}>
        <div className="bg-white rounded-2xl shadow-2xl w-full max-w-sm" onClick={e => e.stopPropagation()}>
          <div className="px-5 py-4 border-b border-slate-100 flex items-start justify-between gap-2">
            <div>
              <div className="flex items-center gap-2">
                <span className="text-xs font-bold px-2 py-0.5 rounded-full bg-emerald-100 text-emerald-800">🔍 検査予定</span>
                {item.status === '予定' && <span className="text-xs font-bold px-2 py-0.5 rounded-full bg-amber-100 text-amber-700">未実施</span>}
              </div>
              <p className="text-sm font-bold text-slate-800 mt-1">{item.productName}</p>
            </div>
            <button onClick={onClose} className="w-7 h-7 flex items-center justify-center rounded-lg hover:bg-slate-100 text-slate-400 text-lg">×</button>
          </div>
          <div className="px-5 py-4 space-y-3">
            <Row label="検査予定日" value={item.date} />
            <Row label="得意先" value={item.customer} />
            <Row label="ステータス" value={item.status} />
          </div>
          <div className="px-5 py-4 border-t border-slate-100">
            <button onClick={onClose} className="w-full px-4 py-2 rounded-lg border border-slate-200 text-sm text-slate-600 hover:bg-slate-50">閉じる</button>
          </div>
        </div>
      </div>
    );
  }

  const c = PROC_COLOR[item.process] || PROC_COLOR['加工'];

  const STATUS_COLOR = {
    '完了':   'bg-green-100 text-green-700',
    '進行中': 'bg-blue-100 text-blue-700',
    '未着手': 'bg-slate-100 text-slate-600',
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 p-4"
      onClick={onClose}>
      <div className="bg-white rounded-2xl shadow-2xl w-full max-w-sm"
        onClick={e => e.stopPropagation()}>

        {/* ヘッダー */}
        <div className="px-5 py-4 border-b border-slate-100 flex items-start justify-between gap-2">
          <div>
            <div className="flex items-center gap-2 flex-wrap">
              <span className={`text-xs font-bold px-2 py-0.5 rounded-full ${c.badge}`}>{item.process}</span>
              <span className="text-sm font-bold text-slate-800">{item.orderNumber}</span>
            </div>
            <p className="text-xs text-slate-500 mt-0.5">{item.productName}</p>
          </div>
          <button onClick={onClose}
            className="w-7 h-7 flex items-center justify-center rounded-lg hover:bg-slate-100 text-slate-400 text-lg flex-shrink-0">×</button>
        </div>

        {/* ボディ */}
        <div className="px-5 py-4 space-y-3">
          <Row label="機械" value={item.machineId} />
          <Row label="工程" value={item.process} />
          <Row label="予定日" value={item.date} />
          <Row label="納期" value={item.deadline || '—'} highlight={item.deadline && item.deadline <= TODAY_STR} />

          {mfgOrder && (
            <>
              <hr className="border-slate-100" />
              <Row label="製造指示No." value={mfgOrder.id} />
              <Row label="指示数量"
                value={`${mfgOrder.plannedQty?.toLocaleString() ?? '—'} ${mfgOrder.unit ?? ''}`} />
              <div className="flex items-center justify-between">
                <span className="text-xs text-slate-400">進捗ステータス</span>
                <span className={`text-xs font-semibold px-2 py-0.5 rounded-full ${STATUS_COLOR[mfgOrder.status] ?? 'bg-slate-100 text-slate-600'}`}>
                  {mfgOrder.status}
                </span>
              </div>
            </>
          )}
        </div>

        {/* フッター */}
        <div className="px-5 py-4 border-t border-slate-100 flex gap-2">
          <button onClick={onClose}
            className="flex-1 px-4 py-2 rounded-lg border border-slate-200 text-sm text-slate-600 hover:bg-slate-50">
            閉じる
          </button>
          <button onClick={onGoMfg}
            className="flex-1 px-4 py-2 rounded-lg bg-blue-600 text-white text-sm font-semibold hover:bg-blue-700 transition-colors">
            ⑦製造日報で確認 →
          </button>
        </div>
      </div>
    </div>
  );
}

function Row({ label, value, highlight }) {
  return (
    <div className="flex items-center justify-between">
      <span className="text-xs text-slate-400">{label}</span>
      <span className={`text-xs font-semibold ${highlight ? 'text-red-600' : 'text-slate-700'}`}>{value}</span>
    </div>
  );
}

// ── 月カレンダー ──────────────────────────────────────────────────────
function MonthView({ year, month, itemsByDate, onItemClick, colorFn }) {
  const weeks = useMemo(() => buildMonthGrid(year, month), [year, month]);
  const MAX_SHOW = 3;

  return (
    <div className="w-full border border-slate-200 rounded-xl overflow-hidden">
      <div className="grid grid-cols-6 bg-slate-100 border-b border-slate-200">
        {DAY_LABELS.map((d, i) => (
          <div key={d} className={`py-2 text-center text-xs font-bold tracking-wide ${i === 5 ? 'text-blue-600' : 'text-slate-500'}`}>
            {d}
          </div>
        ))}
      </div>

      <div className="divide-y divide-slate-100">
        {weeks.map((week, wi) => (
          <div key={wi} className="grid grid-cols-6 divide-x divide-slate-100">
            {week.map((day, di) => {
              const dStr    = fmt(day);
              const isToday = dStr === TODAY_STR;
              const inMonth = day.getMonth() === month;
              const isSat   = di === 5;
              const items   = itemsByDate[dStr] || [];
              const rest    = items.length - MAX_SHOW;

              return (
                <div key={di}
                  className={`min-h-[90px] p-1.5 print-cell
                    ${!inMonth ? 'bg-slate-50' : 'bg-white'}
                    ${isSat ? 'bg-sky-50/40' : ''}`}>
                  <div className="flex items-start justify-between mb-1">
                    <span className={`text-xs font-bold w-6 h-6 flex items-center justify-center rounded-full
                      ${isToday ? 'bg-blue-600 text-white' : inMonth ? 'text-slate-700' : 'text-slate-300'}`}>
                      {day.getDate()}
                    </span>
                    {rest > 0 && <span className="text-xs text-slate-400 leading-none">+{rest}</span>}
                  </div>
                  <div className="space-y-0.5">
                    {items.slice(0, MAX_SHOW).map((item, idx) => {
                      if (item.type === 'inspection') {
                        return (
                          <div key={idx}
                            onClick={() => onItemClick(item)}
                            className={`flex items-center gap-1 text-xs rounded px-1 py-0.5 border truncate leading-tight cursor-pointer hover:opacity-80 transition-opacity ${INSP_CHIP}`}>
                            <span className={`w-1.5 h-1.5 rounded-full flex-shrink-0 ${INSP_DOT}`} />
                            <span className="truncate">🔍 {item.productName}</span>
                          </div>
                        );
                      }
                      const c = colorFn ? colorFn(item) : (PROC_COLOR[item.process] || PROC_COLOR['加工']);
                      return (
                        <div key={idx}
                          onClick={() => onItemClick(item)}
                          className={`flex items-center gap-1 text-xs rounded px-1 py-0.5 border truncate leading-tight cursor-pointer hover:opacity-80 transition-opacity ${c.chip} ${item.isTrial ? TRIAL_RING : ''}`}>
                          <span className={`w-1.5 h-1.5 rounded-full flex-shrink-0 ${c.dot}`} />
                          {item.isTrial && <span className="flex-shrink-0 text-orange-600 font-bold text-xs">試</span>}
                          <span className="font-semibold flex-shrink-0">{item.machineId}</span>
                          <span className="truncate opacity-70">{item.orderNumber.replace(/^SO-\d{4}-/, '').replace(/^TMP-\d{4}-/, '')}</span>
                        </div>
                      );
                    })}
                  </div>
                </div>
              );
            })}
          </div>
        ))}
      </div>
    </div>
  );
}

// ── 週カレンダー ──────────────────────────────────────────────────────
function WeekView({ monday, itemsByDate, onItemClick, colorFn }) {
  const days = useMemo(() => Array.from({ length: 6 }, (_, i) => addDays(monday, i)), [monday]);

  return (
    <div className="w-full border border-slate-200 rounded-xl overflow-hidden">
      <div className="grid grid-cols-6 bg-slate-100 border-b-2 border-slate-200 divide-x divide-slate-200">
        {days.map((day, i) => {
          const dStr    = fmt(day);
          const isToday = dStr === TODAY_STR;
          const isSat   = i === 5;
          const cnt     = (itemsByDate[dStr] || []).length;
          return (
            <div key={i} className={`py-3 text-center ${isSat ? 'bg-sky-50/60' : ''}`}>
              <div className={`text-xs font-bold mb-1 ${isSat ? 'text-blue-500' : 'text-slate-500'}`}>{DAY_LABELS[i]}</div>
              <div className={`text-xl font-bold w-10 h-10 flex items-center justify-center rounded-full mx-auto
                ${isToday ? 'bg-blue-600 text-white' : 'text-slate-700'}`}>
                {day.getDate()}
              </div>
              <div className="text-xs text-slate-400 mt-1">{cnt > 0 ? `${cnt}件` : '—'}</div>
            </div>
          );
        })}
      </div>

      <div className="grid grid-cols-6 divide-x divide-slate-100">
        {days.map((day, i) => {
          const dStr  = fmt(day);
          const items = itemsByDate[dStr] || [];
          const isSat = i === 5;
          return (
            <div key={i} className={`p-2 min-h-[320px] space-y-1.5 ${isSat ? 'bg-sky-50/20' : 'bg-white'}`}>
              {items.length === 0
                ? <div className="text-center py-6 text-xs text-slate-200">—</div>
                : items.map((item, idx) => {
                    if (item.type === 'inspection') {
                      return (
                        <div key={idx}
                          onClick={() => onItemClick(item)}
                          className={`rounded-lg border p-2 text-xs cursor-pointer hover:shadow-md hover:scale-[1.01] transition-all ${INSP_CHIP}`}>
                          <div className="flex items-center gap-1 mb-0.5">
                            <span className={`w-2 h-2 rounded-full flex-shrink-0 ${INSP_DOT}`} />
                            <span className="font-bold">🔍 検査</span>
                            {item.status === '予定' && <span className="ml-auto px-1 py-0.5 bg-emerald-200 text-emerald-800 rounded text-xs font-bold">予定</span>}
                          </div>
                          <div className="truncate font-semibold leading-snug">{item.productName}</div>
                          <div className="truncate opacity-70 leading-snug">{item.customer}</div>
                        </div>
                      );
                    }
                    const c = colorFn ? colorFn(item) : (PROC_COLOR[item.process] || PROC_COLOR['加工']);
                    return (
                      <div key={idx}
                        onClick={() => onItemClick(item)}
                        className={`rounded-lg border p-2 text-xs cursor-pointer hover:shadow-md hover:scale-[1.01] transition-all ${c.chip} ${item.isTrial ? TRIAL_RING : ''}`}>
                        <div className="flex items-center gap-1 mb-0.5 flex-wrap">
                          <span className={`w-2 h-2 rounded-full flex-shrink-0 ${c.dot}`} />
                          <span className="font-bold">{item.machineId}</span>
                          <span className="opacity-60 text-xs">{item.process}</span>
                          {item.isTrial && <span className="ml-auto px-1 py-0.5 bg-orange-200 text-orange-800 rounded text-xs font-bold">試作</span>}
                        </div>
                        <div className="font-semibold truncate">{item.orderNumber}</div>
                        <div className="truncate opacity-70 leading-snug">{item.productName}</div>
                        {item.deadline && (
                          <div className="text-xs opacity-50 mt-0.5">納期 {item.deadline}</div>
                        )}
                      </div>
                    );
                  })
              }
            </div>
          );
        })}
      </div>
    </div>
  );
}

// ── メインコンポーネント ──────────────────────────────────────────────
export default function ManufacturingCalendar() {
  const { productionSchedule, orders, machines, mfgOrders, inspections, setActiveApp } = useApp();

  const [viewMode, setViewMode]           = useState('month');
  const [currentDate, setCurrentDate]     = useState(new Date('2026-05-01'));
  const [selProcess, setSelProcess]       = useState('全工程');
  const [selMachines, setSelMachines]     = useState(new Set()); // 空=全機械
  const [showMachinePopover, setShowMachinePopover] = useState(false);
  const [selProduct, setSelProduct]       = useState('');       // 製品/受注テキストフィルター
  const [colorMode, setColorMode]         = useState('process'); // 'process' | 'order'
  const [popupItem, setPopupItem]         = useState(null);
  const [showInspection, setShowInspection] = useState(true);

  const filteredMachines = useMemo(() =>
    selProcess === '全工程' ? machines : machines.filter(m => m.process === selProcess),
    [machines, selProcess]
  );

  const toggleMachine = (id) => {
    setSelMachines(prev => {
      const next = new Set(prev);
      if (next.has(id)) next.delete(id); else next.add(id);
      return next;
    });
  };

  const handleProcessChange = (p) => { setSelProcess(p); setSelMachines(new Set()); };

  // フラットなスケジュールアイテム（orderId も保持）
  const allItems = useMemo(() => {
    const result = [];
    Object.entries(productionSchedule || {}).forEach(([machineId, items]) => {
      const machine = machines.find(m => m.id === machineId);
      if (!machine) return;
      (items || []).forEach(item => {
        const order = orders.find(o => o.id === item.orderId);
        const isTrial = order?.isTrial || order?.orderNumber?.startsWith('TMP-') || false;
        for (let d = 0; d < (item.duration || 1); d++) {
          result.push({
            machineId,
            orderId:     item.orderId,
            process:     machine.process,
            orderNumber: order?.orderNumber ?? item.orderId,
            productName: order?.productName ?? '',
            deadline:    order?.finalDeadline ?? '',
            isTrial,
            date:        fmt(addDays(new Date(item.startDate), d)),
          });
        }
      });
    });
    // 検査予定アイテム
    if (showInspection) {
      (inspections || []).forEach(ins => {
        if (ins.date) {
          result.push({
            type:        'inspection',
            id:          ins.id,
            date:        ins.date,
            productName: ins.productName,
            customer:    ins.customer,
            status:      ins.status,
          });
        }
      });
    }
    return result;
  }, [productionSchedule, orders, machines, inspections, showInspection]);

  const productQ = selProduct.trim().toLowerCase();
  const filteredItems = useMemo(() =>
    allItems.filter(item => {
      if (item.type === 'inspection') return showInspection; // 検査予定は別トグルで制御済
      if (selProcess !== '全工程' && item.process !== selProcess) return false;
      if (selMachines.size > 0 && !selMachines.has(item.machineId)) return false;
      if (productQ && !(item.productName.toLowerCase().includes(productQ) || item.orderNumber.toLowerCase().includes(productQ))) return false;
      return true;
    }),
    [allItems, selProcess, selMachines, productQ, showInspection]
  );

  // 受注ごとの色割り当て（colorMode='order' 時に使用）
  const orderIdList = useMemo(() =>
    [...new Set(allItems.filter(i => i.orderId).map(i => i.orderId))],
    [allItems]
  );

  const colorFn = useCallback((item) => {
    if (colorMode === 'process') return PROC_COLOR[item.process] || PROC_COLOR['加工'];
    const idx = orderIdList.indexOf(item.orderId);
    return ORDER_PALETTE[Math.max(0, idx) % ORDER_PALETTE.length];
  }, [colorMode, orderIdList]);

  const itemsByDate = useMemo(() => {
    const map = {};
    filteredItems.forEach(item => { (map[item.date] ??= []).push(item); });
    return map;
  }, [filteredItems]);

  const navigate = (dir) => {
    setCurrentDate(prev => {
      const d = new Date(prev);
      if (viewMode === 'month') { d.setMonth(d.getMonth() + dir); d.setDate(1); }
      else d.setDate(d.getDate() + dir * 7);
      return d;
    });
  };
  const goToday = () => setCurrentDate(new Date(TODAY_STR));

  const title = viewMode === 'month'
    ? `${currentDate.getFullYear()}年${currentDate.getMonth() + 1}月`
    : (() => {
        const mon = getMonday(currentDate);
        const sat = addDays(mon, 5);
        return `${mon.getFullYear()}年${mon.getMonth()+1}月${mon.getDate()}日（月）〜 ${sat.getMonth()+1}月${sat.getDate()}日（土）`;
      })();

  const weekMonday = getMonday(currentDate);

  // ポップアップで表示する製造指示を検索
  const popupMfgOrder = useMemo(() => {
    if (!popupItem) return null;
    return mfgOrders?.find(m =>
      m.orderId === popupItem.orderId && m.machine === popupItem.machineId
    ) ?? mfgOrders?.find(m => m.orderId === popupItem.orderId) ?? null;
  }, [popupItem, mfgOrders]);

  const handleGoMfg = () => {
    setPopupItem(null);
    setActiveApp('manufacturing');
  };

  return (
    <>
      <style>{`
        @media print {
          aside, header, .no-print { display: none !important; }
          html, body, #root { height: auto !important; overflow: visible !important; }
          .flex.h-screen { display: block !important; height: auto !important; overflow: visible !important; }
          main { display: block !important; height: auto !important; overflow: visible !important; }
          main > div.overflow-y-auto { overflow: visible !important; padding: 0 !important; height: auto !important; }
          @page { margin: 10mm; size: A4 landscape; }
          .print-cell { min-height: 70px !important; }
        }
      `}</style>

      <div className="h-full flex flex-col gap-3">

        {/* コントロールバー */}
        <div className="flex-shrink-0 bg-white rounded-xl border border-slate-200 px-4 py-3 no-print">
          <div className="flex flex-wrap items-center gap-2">
            <h2 className="text-base font-bold text-slate-800 mr-2">📅 製造カレンダー</h2>

            <select value={selProcess} onChange={e => handleProcessChange(e.target.value)}
              className="text-sm border border-slate-200 rounded-lg px-2.5 py-1.5 bg-white text-slate-700 focus:outline-none focus:ring-2 focus:ring-blue-300">
              <option value="全工程">全工程</option>
              {PROCESS_ORDER.map(p => <option key={p} value={p}>{p}</option>)}
            </select>

            {/* 複数機械フィルター（行17） */}
            <div className="relative">
              <button
                onClick={() => setShowMachinePopover(v => !v)}
                className="text-sm border border-slate-200 rounded-lg px-2.5 py-1.5 bg-white text-slate-700 hover:bg-slate-50 focus:outline-none focus:ring-2 focus:ring-blue-300 min-w-[96px] text-left flex items-center gap-1">
                {selMachines.size === 0 ? '全機械' : `${selMachines.size}機械選択`}
                <span className="ml-auto text-slate-400 text-xs">▾</span>
              </button>
              {showMachinePopover && (
                <div className="absolute z-30 top-full mt-1 left-0 bg-white border border-slate-200 rounded-xl shadow-xl p-2 min-w-[160px] max-h-64 overflow-y-auto">
                  <button onClick={() => { setSelMachines(new Set()); setShowMachinePopover(false); }}
                    className="w-full text-left text-xs px-2 py-1 rounded hover:bg-slate-100 text-blue-600 font-semibold mb-1">
                    全機械（リセット）
                  </button>
                  {filteredMachines.map(m => (
                    <label key={m.id} className="flex items-center gap-2 text-xs px-2 py-1 rounded hover:bg-slate-50 cursor-pointer">
                      <input type="checkbox" checked={selMachines.has(m.id)} onChange={() => toggleMachine(m.id)}
                        className="accent-blue-600" />
                      {m.id}
                    </label>
                  ))}
                </div>
              )}
            </div>

            {/* 製品/受注フィルター（行15） */}
            <input
              type="text"
              value={selProduct}
              onChange={e => setSelProduct(e.target.value)}
              placeholder="製品名・受注No検索"
              className="text-sm border border-slate-200 rounded-lg px-2.5 py-1.5 bg-white text-slate-700 focus:outline-none focus:ring-2 focus:ring-blue-300 w-40"
            />

            <div className="flex rounded-lg border border-slate-200 overflow-hidden ml-1">
              {[['month', '月'], ['week', '週']].map(([mode, label]) => (
                <button key={mode} onClick={() => setViewMode(mode)}
                  className={`px-3 py-1.5 text-sm font-medium transition-colors
                    ${viewMode === mode ? 'bg-blue-600 text-white' : 'bg-white text-slate-600 hover:bg-slate-50'}`}>
                  {label}
                </button>
              ))}
            </div>

            {/* 受注色分けモード切替（行16） */}
            <div className="flex rounded-lg border border-slate-200 overflow-hidden ml-1" title="カードの色分け方式">
              {[['process', '工程色'], ['order', '受注色']].map(([mode, label]) => (
                <button key={mode} onClick={() => setColorMode(mode)}
                  className={`px-2.5 py-1.5 text-xs font-medium transition-colors
                    ${colorMode === mode ? 'bg-slate-700 text-white' : 'bg-white text-slate-600 hover:bg-slate-50'}`}>
                  {label}
                </button>
              ))}
            </div>

            <div className="flex items-center gap-1 ml-1">
              <button onClick={() => navigate(-1)} className="w-8 h-8 flex items-center justify-center rounded-lg hover:bg-slate-100 text-slate-600 text-sm">◀</button>
              <button onClick={goToday} className="px-3 py-1.5 text-sm rounded-lg bg-slate-100 hover:bg-slate-200 text-slate-700 font-medium">今日</button>
              <button onClick={() => navigate(1)} className="w-8 h-8 flex items-center justify-center rounded-lg hover:bg-slate-100 text-slate-600 text-sm">▶</button>
            </div>

            <button onClick={() => window.print()}
              className="ml-auto flex items-center gap-1.5 px-3 py-1.5 text-sm rounded-lg bg-slate-700 text-white hover:bg-slate-800 font-medium transition-colors">
              🖨️ PDF出力
            </button>
          </div>

          <div className="flex items-center gap-4 mt-2 flex-wrap">
            <span className="text-xs text-slate-400">工程：</span>
            {PROCESS_ORDER.map(p => (
              <div key={p} className="flex items-center gap-1 text-xs text-slate-600">
                <span className={`w-2.5 h-2.5 rounded-full ${PROC_COLOR[p].dot}`} />
                {p}
              </div>
            ))}
            <div className="flex items-center gap-1 text-xs text-slate-600">
              <span className="w-2.5 h-2.5 rounded-full bg-emerald-500" />
              検査予定
            </div>
            <div className="flex items-center gap-1 text-xs text-orange-600 font-medium border border-orange-300 rounded px-1">
              試 試作受注
            </div>
            <label className="flex items-center gap-1.5 ml-2 cursor-pointer select-none">
              <input type="checkbox" checked={showInspection} onChange={e => setShowInspection(e.target.checked)}
                className="accent-emerald-600" />
              <span className="text-xs text-slate-500">検査予定を表示</span>
            </label>
            <span className="text-xs text-slate-300 ml-1">※ カードをクリックで詳細表示</span>
          </div>
        </div>

        {/* 印刷ヘッダー（画面では非表示） */}
        <div className="hidden print:block mb-4">
          <h1 className="text-xl font-bold text-slate-800">製造カレンダー　{title}</h1>
          <div className="text-sm text-slate-500 mt-1">工程：{selProcess}　機械：{selMachines.size === 0 ? '全機械' : [...selMachines].join(', ')}　出力日：{TODAY_STR}</div>
        </div>

        <div className="text-sm font-bold text-slate-700 no-print">{title}</div>

        <div className="flex-1 overflow-auto">
          {viewMode === 'month'
            ? <MonthView
                year={currentDate.getFullYear()}
                month={currentDate.getMonth()}
                itemsByDate={itemsByDate}
                onItemClick={setPopupItem}
                colorFn={colorFn}
              />
            : <WeekView
                monday={weekMonday}
                itemsByDate={itemsByDate}
                onItemClick={setPopupItem}
                colorFn={colorFn}
              />
          }
        </div>
      </div>

      {/* 案件詳細ポップアップ */}
      {popupItem && (
        <EventDetailModal
          item={popupItem}
          mfgOrder={popupMfgOrder}
          onClose={() => setPopupItem(null)}
          onGoMfg={handleGoMfg}
        />
      )}
    </>
  );
}
