import { useState } from 'react';
import { useApp } from '../context/AppContext';
import { PROCESS_ORDER } from '../data/mockData';

// ─── ケーブル断面図 SVG ────────────────────────────────────────
const INS_COLORS = ['#3b82f6','#ef4444','#22c55e','#eab308','#a855f7','#f97316','#78350f','#fb923c','#7c3aed','#6b7280'];

function CableCrossSectionSvg({ cableType, sheathColor }) {
  const cx = 100, cy = 100;
  const sheathR = 76;
  const scMap = { '黒':'#374151','赤':'#b91c1c','緑':'#15803d','青':'#1d4ed8','白':'#e2e8f0','黄':'#ca8a04','グレー':'#6b7280' };
  const sc = scMap[sheathColor] || '#374151';

  const renderCores = () => {
    if (cableType === 'single') {
      return (
        <>
          <circle cx={cx} cy={cy} r={sheathR - 10} fill={INS_COLORS[2]} />
          <circle cx={cx} cy={cy} r={sheathR - 26} fill="#b45309" />
          <circle cx={cx} cy={cy} r={sheathR - 30} fill="#d97706" />
        </>
      );
    }
    const count = cableType === '3core' ? 3 : cableType === '4core' ? 4 : 10;
    const coreR  = count <= 4 ? 22 : 13;
    const condR  = count <= 4 ? 13 : 7;
    const arrR   = count <= 4 ? 38 : 52;
    return (
      <>
        <circle cx={cx} cy={cy} r={sheathR - 8} fill="#d4c5a0" />
        {Array.from({ length: count }, (_, i) => {
          const angle = (i / count) * Math.PI * 2 - Math.PI / 2;
          const x = cx + Math.cos(angle) * arrR;
          const y = cy + Math.sin(angle) * arrR;
          return (
            <g key={i}>
              <circle cx={x} cy={y} r={coreR} fill={INS_COLORS[i % INS_COLORS.length]} />
              <circle cx={x} cy={y} r={condR} fill="#b45309" />
              <circle cx={x} cy={y} r={condR - 2} fill="#d97706" />
            </g>
          );
        })}
      </>
    );
  };

  return (
    <svg viewBox="0 0 200 200" className="w-full h-full">
      {/* 外径寸法線 */}
      <line x1="6" y1={cy} x2="194" y2={cy} stroke="#9ca3af" strokeWidth="0.5" strokeDasharray="4,3" />
      <line x1={cx} y1="6" x2={cx} y2="194" stroke="#9ca3af" strokeWidth="0.5" strokeDasharray="4,3" />
      {/* シース */}
      <circle cx={cx} cy={cy} r={sheathR} fill={sc} stroke="#111827" strokeWidth="2" />
      {/* 内部 */}
      {renderCores()}
      {/* 寸法矢印 */}
      <line x1={cx - sheathR} y1="10" x2={cx + sheathR} y2="10" stroke="#6b7280" strokeWidth="1" markerEnd="url(#arr)" markerStart="url(#arr)" />
      <text x={cx} y="8" textAnchor="middle" fontSize="8" fill="#6b7280">外径</text>
      <defs>
        <marker id="arr" markerWidth="6" markerHeight="6" refX="3" refY="3" orient="auto">
          <path d="M0,0 L6,3 L0,6 Z" fill="#6b7280" />
        </marker>
      </defs>
    </svg>
  );
}

// ─── 図面ポップアップモーダル ──────────────────────────────────
const PROCESS_COLORS = {
  '押出': 'bg-sky-50 border-sky-200 text-sky-800',
  '撚線': 'bg-violet-50 border-violet-200 text-violet-800',
  '編組': 'bg-amber-50 border-amber-200 text-amber-800',
  '加工': 'bg-emerald-50 border-emerald-200 text-emerald-800',
};

function DrawingModal({ product, mfgOrder, onClose }) {
  const [activeProcess, setActiveProcess] = useState(PROCESS_ORDER[0]);
  if (!product) return null;

  const wc = product.workConditions || {};
  const processes = PROCESS_ORDER.filter(p => wc[p]);

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 p-4">
      <div className="bg-white rounded-2xl shadow-2xl w-full max-w-3xl max-h-[90vh] overflow-hidden flex flex-col">
        {/* ヘッダー */}
        <div className="flex items-center justify-between px-6 py-4 border-b border-slate-200 bg-slate-50 flex-shrink-0">
          <div>
            <div className="flex items-center gap-2">
              <span className="text-lg">📐</span>
              <h2 className="font-bold text-slate-800">{product.name}</h2>
              <span className="badge bg-blue-100 text-blue-700 text-xs">{product.drawingRevision || 'Rev.-'}</span>
            </div>
            <div className="text-xs text-slate-500 mt-0.5">
              図面番号：{product.designNumber}　製品コード：{product.productCode}
            </div>
          </div>
          <button onClick={onClose} className="text-slate-400 hover:text-slate-600 text-xl p-1">✕</button>
        </div>

        <div className="flex-1 overflow-y-auto">
          {/* 上段：断面図 ＋ スペック */}
          <div className="flex flex-col sm:flex-row gap-4 p-6 border-b border-slate-100">
            {/* 断面図 */}
            <div className="flex-shrink-0 w-full sm:w-44">
              <div className="text-xs font-medium text-slate-500 mb-2 text-center">ケーブル断面図</div>
              <div className="w-44 h-44 mx-auto bg-slate-50 rounded-xl border border-slate-200 p-1">
                <CableCrossSectionSvg
                  cableType={product.cableType || '3core'}
                  sheathColor={product.sheathColor}
                />
              </div>
            </div>

            {/* スペック */}
            <div className="flex-1 min-w-0">
              <div className="text-xs font-medium text-slate-500 mb-2">製品仕様</div>
              <div className="grid grid-cols-2 gap-2 text-sm">
                {[
                  ['外径', `${product.spec.outerDiameter.min} 〜 ${product.spec.outerDiameter.max} mm`],
                  ['肉厚', `${product.spec.wallThickness.min} 〜 ${product.spec.wallThickness.max} mm`],
                  ['シース色', product.sheathColor],
                  ['撚りピッチ', product.conductorPitch],
                  ['梱包', product.packaging],
                  ['得意先', product.customerName],
                ].map(([k, v]) => (
                  <div key={k} className="bg-slate-50 rounded-lg px-3 py-2">
                    <div className="text-xs text-slate-400">{k}</div>
                    <div className="font-medium text-slate-800">{v}</div>
                  </div>
                ))}
              </div>
              {product.drawingUrl && (
                <a
                  href={product.drawingUrl}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="mt-3 inline-flex items-center gap-1.5 text-xs text-blue-600 hover:underline"
                >
                  📄 図面ファイルを開く（外部リンク）
                </a>
              )}
            </div>
          </div>

          {/* 下段：工程別作業条件 */}
          <div className="p-6">
            <div className="text-sm font-semibold text-slate-700 mb-3">📋 工程別作業条件</div>
            {/* タブ */}
            <div className="flex flex-wrap gap-1 mb-3">
              {processes.map(p => (
                <button
                  key={p}
                  onClick={() => setActiveProcess(p)}
                  className={`px-3 py-1.5 rounded-lg text-xs font-medium border transition-all
                    ${activeProcess === p
                      ? (PROCESS_COLORS[p] || 'bg-slate-100 border-slate-300') + ' font-bold'
                      : 'bg-white border-slate-200 text-slate-500 hover:bg-slate-50'}`}
                >
                  {p}
                </button>
              ))}
            </div>
            {/* 内容 */}
            <div className={`rounded-xl border p-4 text-sm leading-relaxed whitespace-pre-line
              ${PROCESS_COLORS[activeProcess] || 'bg-slate-50 border-slate-200 text-slate-700'}`}>
              {wc[activeProcess] || '作業条件の記録がありません'}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}

const statusColors = {
  '完了': 'bg-green-100 text-green-700',
  '進行中': 'bg-blue-100 text-blue-700',
  '未着手': 'bg-slate-100 text-slate-500',
};

// ① 工程順序逆転アラートダイアログ
function ProcessOrderAlert({ message, onClose }) {
  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40">
      <div className="bg-white rounded-xl shadow-2xl max-w-sm w-full p-6 mx-4 border-2 border-red-400">
        <div className="text-4xl text-center mb-3">🚫</div>
        <h3 className="font-bold text-red-700 text-center mb-2">工程順序エラー</h3>
        <p className="text-sm text-slate-700 text-center mb-4">{message}</p>
        <p className="text-xs text-slate-500 text-center mb-4">
          正しい順序：絶縁 → 対撚り → 集合 → 編組 → シース
        </p>
        <button onClick={onClose} className="w-full btn-primary">確認しました</button>
      </div>
    </div>
  );
}

// ─── 強制完了モーダル（責任者承認） ──────────────────────────
function ForceCompleteModal({ stepName, outOfSpec, onClose, onConfirm }) {
  const [by, setBy] = useState('');
  const [reason, setReason] = useState('');
  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 p-4">
      <div className="bg-white rounded-2xl shadow-2xl w-full max-w-md">
        <div className="px-6 py-5 border-b border-slate-200">
          <div className="text-3xl text-center mb-1">⚠️</div>
          <h3 className="font-bold text-center text-red-700">規格外値の強制完了</h3>
          <p className="text-xs text-center text-slate-500 mt-1">
            「{stepName}」工程に規格外の測定値があります
          </p>
        </div>
        <div className="px-6 py-4 space-y-4">
          <div className="bg-red-50 border border-red-200 rounded-xl p-3 space-y-1.5">
            {outOfSpec.map(m => (
              <div key={m.item} className="flex items-center gap-2 text-xs">
                <span className="text-red-600 font-bold">❌</span>
                <span className="font-medium text-slate-700 w-24">{m.item}</span>
                <span className="text-slate-400">規格: {m.specMin}〜{m.specMax} {m.unit}</span>
                <span className="text-red-700 font-bold ml-auto">実測: {m.actual} {m.unit}</span>
              </div>
            ))}
          </div>
          <div>
            <label className="block text-xs font-medium text-slate-700 mb-1">承認責任者氏名 *</label>
            <input className="input-field text-sm" value={by}
              onChange={e => setBy(e.target.value)} placeholder="氏名を入力" />
          </div>
          <div>
            <label className="block text-xs font-medium text-slate-700 mb-1">強制完了理由 *</label>
            <textarea rows={3}
              className="input-field text-sm resize-none w-full"
              value={reason} onChange={e => setReason(e.target.value)}
              placeholder="納品先との協議内容、承認理由等を記載してください" />
          </div>
        </div>
        <div className="px-6 py-4 border-t border-slate-200 flex gap-3">
          <button onClick={onClose} className="flex-1 btn-secondary text-sm">キャンセル</button>
          <button
            disabled={!by || !reason}
            onClick={() => by && reason && onConfirm(by, reason)}
            className="flex-1 bg-red-600 text-white rounded-lg px-4 py-2 text-sm font-bold hover:bg-red-700 disabled:opacity-50 disabled:cursor-not-allowed">
            強制完了を実行
          </button>
        </div>
      </div>
    </div>
  );
}

// ─── 材料払い出しモーダル ──────────────────────────────────────
function IssuanceMaterialModal({ mfgOrder, bom, lossRate, onClose, onSave }) {
  const { materials } = useApp();
  const TODAY = '2026-05-21';
  const [lines, setLines] = useState(
    bom.map(b => ({
      materialId: b.materialId,
      materialName: b.materialName,
      unit: 'kg',
      calcQty: Math.ceil(mfgOrder.targetQuantity * b.requiredQty * lossRate * 10) / 10,
      issuedQty: Math.ceil(mfgOrder.targetQuantity * b.requiredQty * lossRate * 10) / 10,
      lotNumbers: [''],
      selected: true,
    }))
  );
  const [issuedBy, setIssuedBy] = useState('');

  const updateLine = (i, field, val) =>
    setLines(prev => prev.map((l, idx) => idx === i ? { ...l, [field]: val } : l));

  const handleSave = () => {
    const selected = lines.filter(l => l.selected && l.issuedQty > 0);
    if (selected.length === 0 || !issuedBy) return;
    onSave(selected.map(l => ({
      id: `ISS-${Date.now()}-${l.materialId}`,
      mfgOrderId: mfgOrder.id,
      mfgOrderNumber: mfgOrder.mfgOrderNumber,
      orderId: mfgOrder.orderId,
      orderNumber: mfgOrder.orderNumber,
      machineId: mfgOrder.machine,
      machineName: mfgOrder.machine,
      materialId: l.materialId,
      materialName: l.materialName,
      unit: l.unit,
      issuedQty: Number(l.issuedQty),
      issuedDate: TODAY,
      issuedBy,
      lotNumber: l.lotNumbers.filter(Boolean).join(', '),
      lotNumbers: l.lotNumbers.filter(Boolean),
      returnedQty: 0,
      status: '払出済',
    })));
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 p-4">
      <div className="bg-white rounded-2xl shadow-2xl w-full max-w-lg max-h-[90vh] flex flex-col">
        <div className="px-6 py-4 border-b border-slate-200 flex items-center justify-between flex-shrink-0">
          <div>
            <h2 className="font-bold text-slate-800">材料払い出し記録</h2>
            <div className="text-xs text-slate-400 mt-0.5">{mfgOrder.mfgOrderNumber} / {mfgOrder.productName}</div>
          </div>
          <button onClick={onClose} className="text-slate-400 hover:text-slate-600 text-xl">✕</button>
        </div>
        <div className="flex-1 overflow-y-auto p-6 space-y-4">
          <table className="w-full text-sm">
            <thead>
              <tr className="border-b border-slate-200 text-xs text-slate-500">
                <th className="pb-2 text-left w-6"></th>
                <th className="pb-2 text-left">材料名</th>
                <th className="pb-2 text-right">規定量</th>
                <th className="pb-2 text-right">払出量</th>
                <th className="pb-2 text-left pl-2">ロット番号（複数可）</th>
              </tr>
            </thead>
            <tbody>
              {lines.map((line, i) => (
                <tr key={line.materialId} className="border-b border-slate-100">
                  <td className="py-2 align-top pt-3"><input type="checkbox" checked={line.selected}
                    onChange={e => updateLine(i, 'selected', e.target.checked)} /></td>
                  <td className="py-2 text-xs font-medium align-top pt-3">{line.materialName}</td>
                  <td className="py-2 text-right text-xs font-mono text-slate-400 align-top pt-3">{line.calcQty}kg</td>
                  <td className="py-2 text-right pr-2 align-top pt-2">
                    <input type="number" step="0.1"
                      className="input-field text-xs w-20 text-right"
                      value={line.issuedQty}
                      onChange={e => updateLine(i, 'issuedQty', e.target.value)} />
                  </td>
                  <td className="py-2 pl-2">
                    <div className="space-y-1">
                      {(line.lotNumbers || ['']).map((lot, li) => (
                        <div key={li} className="flex items-center gap-1">
                          <input className="input-field text-xs w-28 font-mono"
                            value={lot}
                            onChange={e => {
                              const next = [...(line.lotNumbers || [''])];
                              next[li] = e.target.value;
                              updateLine(i, 'lotNumbers', next);
                            }}
                            placeholder="LOT-..." />
                          {(line.lotNumbers || ['']).length > 1 && (
                            <button onClick={() => {
                              const next = (line.lotNumbers || ['']).filter((_, idx) => idx !== li);
                              updateLine(i, 'lotNumbers', next);
                            }} className="text-slate-300 hover:text-red-500 text-xs">×</button>
                          )}
                        </div>
                      ))}
                      <button onClick={() => updateLine(i, 'lotNumbers', [...(line.lotNumbers || ['']), ''])}
                        className="text-xs text-blue-600 hover:text-blue-800">＋ ロット追加</button>
                    </div>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
          <div>
            <label className="block text-xs text-slate-500 mb-1">払出担当者 *</label>
            <input className="input-field text-sm" value={issuedBy}
              onChange={e => setIssuedBy(e.target.value)} placeholder="氏名を入力" />
          </div>
        </div>
        <div className="px-6 py-4 border-t border-slate-200 flex gap-3 justify-end flex-shrink-0">
          <button onClick={onClose} className="btn-secondary text-sm">キャンセル</button>
          <button onClick={handleSave}
            disabled={!issuedBy || !lines.some(l => l.selected)}
            className="btn-primary text-sm disabled:opacity-50">払い出し登録</button>
        </div>
      </div>
    </div>
  );
}

// ─── No.11 トラブル報告モーダル ───────────────────────────────
const TROUBLE_CATEGORIES = ['機械停止', '材料不良', '品質異常', '人員不足', 'その他'];
const TROUBLE_SEVERITIES = ['低', '中', '高', '緊急'];

function TroubleReportModal({ mfgOrder, onClose, onSubmit }) {
  const [category, setCategory] = useState('機械停止');
  const [severity, setSeverity] = useState('中');
  const [description, setDescription] = useState('');
  const [reportedBy, setReportedBy] = useState('');

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 p-4">
      <div className="bg-white rounded-2xl shadow-2xl w-full max-w-md">
        <div className="px-6 py-4 border-b border-slate-200 bg-red-50 rounded-t-2xl">
          <div className="flex items-center gap-2">
            <span className="text-2xl">🚨</span>
            <div>
              <h3 className="font-bold text-red-700">トラブル報告</h3>
              <p className="text-xs text-red-500 mt-0.5">{mfgOrder?.productName}</p>
            </div>
          </div>
        </div>
        <div className="px-6 py-4 space-y-4">
          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="block text-xs font-medium text-slate-700 mb-1">区分 *</label>
              <select className="select-field" value={category} onChange={e => setCategory(e.target.value)}>
                {TROUBLE_CATEGORIES.map(c => <option key={c}>{c}</option>)}
              </select>
            </div>
            <div>
              <label className="block text-xs font-medium text-slate-700 mb-1">重大度 *</label>
              <select className="select-field" value={severity} onChange={e => setSeverity(e.target.value)}>
                {TROUBLE_SEVERITIES.map(s => <option key={s}>{s}</option>)}
              </select>
            </div>
          </div>
          <div>
            <label className="block text-xs font-medium text-slate-700 mb-1">報告者</label>
            <input className="input-field" value={reportedBy} onChange={e => setReportedBy(e.target.value)} placeholder="氏名" />
          </div>
          <div>
            <label className="block text-xs font-medium text-slate-700 mb-1">状況説明 *</label>
            <textarea rows={4} className="input-field resize-none w-full text-sm"
              value={description} onChange={e => setDescription(e.target.value)}
              placeholder="発生状況・影響範囲・応急処置の内容を記入してください" />
          </div>
        </div>
        <div className="px-6 py-4 border-t border-slate-200 flex gap-3">
          <button onClick={onClose} className="flex-1 btn-secondary">キャンセル</button>
          <button
            disabled={!description.trim()}
            onClick={() => description.trim() && onSubmit({ category, severity, description, reportedBy: reportedBy || '担当者' })}
            className="flex-1 bg-red-600 text-white rounded-lg px-4 py-2 text-sm font-bold hover:bg-red-700 disabled:opacity-40 disabled:cursor-not-allowed">
            🚨 報告する
          </button>
        </div>
      </div>
    </div>
  );
}

// ─── 返却促進モーダル ──────────────────────────────────────────
function ReturnPromptModal({ pendingReturns, onClose, onGoReturns }) {
  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 p-4">
      <div className="bg-white rounded-2xl shadow-2xl w-full max-w-sm p-6">
        <div className="text-4xl text-center mb-3">🔄</div>
        <h3 className="font-bold text-center text-slate-800 mb-2">材料の返却が必要です</h3>
        <p className="text-sm text-slate-600 text-center mb-4">
          以下の材料が返却待ちになっています。<br/>
          在庫管理画面から返却確認を行ってください。
        </p>
        <div className="bg-orange-50 rounded-xl p-3 mb-4 space-y-1.5">
          {pendingReturns.map(r => (
            <div key={r.id} className="flex items-center justify-between text-sm">
              <span className="font-medium text-slate-700">{r.materialName}</span>
              <span className="text-orange-600 font-bold">払出 {r.issuedQty}kg</span>
            </div>
          ))}
        </div>
        <div className="flex gap-3">
          <button onClick={onClose} className="flex-1 btn-secondary text-sm">後で確認</button>
          <button onClick={onGoReturns}
            className="flex-1 bg-orange-500 text-white rounded-lg px-4 py-2 text-sm font-medium hover:bg-orange-600">
            返却管理へ →
          </button>
        </div>
      </div>
    </div>
  );
}

export default function ManufacturingReport() {
  const {
    mfgOrders, setMfgOrders, machines, products,
    quotes, orders, materialIssuances, materialReturns,
    issueMaterial, addDelayAlert, delayAlerts,
    addTroubleReport,
  } = useApp();
  const [selected, setSelected] = useState(mfgOrders[1]); // デフォルトで進行中を表示
  const [processAlert, setProcessAlert] = useState(null);
  const [showCompleteConfirm, setShowCompleteConfirm] = useState(false);
  const [showDrawing, setShowDrawing] = useState(false);
  const [showIssuanceModal, setShowIssuanceModal] = useState(false);
  const [showReturnPrompt, setShowReturnPrompt] = useState(false);
  const [showForceComplete, setShowForceComplete] = useState(false);
  const [pendingStepIndex, setPendingStepIndex] = useState(null);
  const [showTroubleModal, setShowTroubleModal] = useState(false);   // No.11
  const [todayOutput, setTodayOutput] = useState('');               // No.10
  // No.9 作業開始チェックシート
  const [startCheckValues, setStartCheckValues] = useState({});     // { [mfgOrderId]: { [item]: value } }
  const [startCheckAlert, setStartCheckAlert] = useState(null);     // { item, actual, specMin, specMax }
  // 作業終了チェックシート
  const [endCheckValues, setEndCheckValues] = useState({});         // { [mfgOrderId]: { [item]: value } }
  const [endCheckSubmitted, setEndCheckSubmitted] = useState({});   // { [mfgOrderId]: boolean }
  const [commentText, setCommentText] = useState('');               // No.4
  const [commentAuthor, setCommentAuthor] = useState('');           // No.4
  // 残材入庫（No.12）
  const [residualInputs, setResidualInputs] = useState({});
  // 遅延アラート発出フォームの開閉状態: stepIndex → boolean
  const [alertFormOpen, setAlertFormOpen] = useState({});
  // 遅延アラートのコメント入力: stepIndex → string
  const [alertComment, setAlertComment] = useState({});
  // 遅延アラートの担当者名: stepIndex → string
  const [alertBy, setAlertBy] = useState({});

  // 選択中の製造指示に対応する製品マスタを取得
  const selectedProduct = selected
    ? products.find(p => p.productCode === selected.productCode)
    : null;

  const syncSelected = (updated) => {
    setMfgOrders(ms => ms.map(m => m.id === updated.id ? updated : m));
    setSelected(updated);
  };

  // 工程ごとの測定値変更
  const handleMeasurementChange = (stepName, index, value) => {
    syncSelected({
      ...selected,
      measurements: {
        ...selected.measurements,
        [stepName]: (selected.measurements?.[stepName] || []).map(
          (m, i) => i === index ? { ...m, actual: value } : m
        ),
      },
    });
  };

  // 工程完了処理（通常 or 強制完了）
  const doCompleteStep = (stepIndex, forceBy = null, forceReason = null) => {
    const stepName = selected.processSteps[stepIndex].step;
    const isLast = stepIndex === selected.processSteps.length - 1;
    const updated = {
      ...selected,
      processSteps: selected.processSteps.map((s, i) =>
        i === stepIndex ? { ...s, completed: true, completedDate: '2026-05-21' } : s
      ),
      status: isLast ? '完了' : '進行中',
      ...(forceBy ? {
        forceCompletes: {
          ...(selected.forceCompletes || {}),
          [stepName]: { by: forceBy, reason: forceReason, timestamp: '2026-05-21' },
        },
      } : {}),
    };
    syncSelected(updated);
    if (isLast) {
      const pending = (materialIssuances || []).filter(
        iss => iss.mfgOrderId === selected.id && iss.status === '払出済'
      );
      if (pending.length > 0) setShowReturnPrompt(true);
    }
  };

  // ① 工程チェック：前工程未完了 & 測定値バリデーション
  const handleStepToggle = (stepIndex) => {
    const step = selected.processSteps[stepIndex];
    if (step.completed) return;

    if (stepIndex > 0 && !selected.processSteps[stepIndex - 1].completed) {
      const prevStep = selected.processSteps[stepIndex - 1].step;
      setProcessAlert(`「${step.step}」工程を開始するには、前工程「${prevStep}」が完了している必要があります。`);
      return;
    }

    const stepMeas = selected.measurements?.[step.step] || [];
    const missing = stepMeas.filter(m => m.actual === '' || m.actual === null || m.actual === undefined);
    if (missing.length > 0) {
      setProcessAlert(`「${step.step}」工程の測定値（${missing.map(m => m.item).join('、')}）をすべて入力してから完了してください。`);
      return;
    }

    const outOfSpec = stepMeas.filter(m => {
      const val = Number(m.actual);
      return (m.specMin !== null && val < m.specMin) || (m.specMax !== null && val > m.specMax);
    });
    if (outOfSpec.length > 0) {
      setPendingStepIndex(stepIndex);
      setShowForceComplete(true);
      return;
    }

    doCompleteStep(stepIndex);
  };

  // 遅延アラート発出
  const handleSubmitDelayAlert = (stepIndex) => {
    const comment = (alertComment[stepIndex] || '').trim();
    const by = (alertBy[stepIndex] || '').trim();
    if (!comment) return;
    const stepName = selected.processSteps[stepIndex].step;
    const relOrder = orders?.find(o => o.id === selected?.orderId);
    addDelayAlert({
      orderId: selected.orderId,
      orderNumber: selected.orderNumber,
      productName: selected.productName,
      processName: stepName,
      comment,
      createdBy: by || '担当者',
    });
    setAlertFormOpen(prev => ({ ...prev, [stepIndex]: false }));
    setAlertComment(prev => ({ ...prev, [stepIndex]: '' }));
    setAlertBy(prev => ({ ...prev, [stepIndex]: '' }));
  };

  // 完了ボタンの制御：測定値は工程ごとに検証済みなので全工程完了のみ確認
  const allStepsComplete = selected?.processSteps.every(s => s.completed);
  const canComplete = allStepsComplete && (endCheckSubmitted[selected?.id] || false);

  const handleComplete = () => {
    if (!canComplete) return;
    const updated = { ...selected, status: '完了', endDate: '2026-05-21' };
    syncSelected(updated);
    setShowCompleteConfirm(false);
  };

  const completedSteps = selected?.processSteps.filter(s => s.completed).length || 0;
  const pct = selected ? Math.round((completedSteps / selected.processSteps.length) * 100) : 0;

  // BOM取得（handleQuickIssueより先に宣言）
  const relatedOrder = orders?.find(o => o.id === selected?.orderId);
  const relatedQuote = quotes?.find(q => q.id === relatedOrder?.quoteId || q.orderNumber === selected?.orderNumber);
  const bom = relatedQuote?.bom || [];
  const lossRate = selectedProduct?.lossRate || 1.05;
  // この製造指示の払い出し記録
  const myIssuances = (materialIssuances || []).filter(iss => iss.mfgOrderId === selected?.id);

  // No.8 ワンクリック出庫依頼
  const handleQuickIssue = () => {
    if (!bom.length) return;
    bom.forEach(b => {
      const needed = Math.ceil(selected.targetQuantity * b.requiredQty * lossRate * 10) / 10;
      issueMaterial({
        id: `ISS-AUTO-${Date.now()}-${b.materialId}`,
        mfgOrderId: selected.id,
        mfgOrderNumber: selected.mfgOrderNumber,
        orderId: selected.orderId,
        orderNumber: selected.orderNumber,
        machineId: selected.machine,
        machineName: selected.machine,
        materialId: b.materialId,
        materialName: b.materialName,
        unit: 'kg',
        issuedQty: needed,
        issuedDate: '2026-05-21',
        issuedBy: '自動出庫',
        lotNumber: '',
        returnedQty: 0,
        status: '払出済',
      });
    });
  };

  // No.10 出来高登録
  const handleAddOutput = () => {
    const add = Number(todayOutput);
    if (!add || add <= 0) return;
    syncSelected({ ...selected, actualOutput: selected.actualOutput + add });
    setTodayOutput('');
  };

  // No.4 現場コメント投稿
  const handleAddComment = () => {
    if (!commentText.trim()) return;
    const comment = {
      id: `CMT-${Date.now()}`,
      text: commentText.trim(),
      author: commentAuthor.trim() || '現場',
      createdAt: '2026-05-21',
    };
    syncSelected({ ...selected, comments: [...(selected.comments || []), comment] });
    setCommentText('');
    setCommentAuthor('');
  };

  // 返却待ち
  const pendingReturnsForSelected = myIssuances.filter(iss => iss.status === '払出済');

  return (
    <div className="flex flex-col md:flex-row gap-4 md:gap-6">
      {/* 製造指示一覧 */}
      <div className="w-full md:w-72 md:flex-shrink-0 space-y-3">
        <div className="flex items-center justify-between">
          <span className="text-sm font-medium text-slate-700">製造指示一覧</span>
          <button className="btn-primary text-xs">＋ 新規</button>
        </div>
        {mfgOrders.map(m => {
          const comp = m.processSteps.filter(s => s.completed).length;
          const p = Math.round((comp / m.processSteps.length) * 100);
          return (
            <button
              key={m.id}
              onClick={() => setSelected(m)}
              className={`w-full text-left p-4 rounded-xl border transition-all ${selected?.id === m.id ? 'border-blue-500 bg-blue-50 shadow-sm' : 'border-slate-200 bg-white hover:border-blue-300'}`}
            >
              <div className="flex items-center justify-between mb-1">
                <span className="font-mono text-xs text-slate-500">{m.mfgOrderNumber}</span>
                <span className={`badge ${statusColors[m.status]}`}>{m.status}</span>
              </div>
              <div className="text-sm font-medium text-slate-800 truncate">{m.productName}</div>
              <div className="text-xs text-slate-500 mt-1">{m.machine}　{m.operatorId ? `作業者：${m.operatorId}` : '担当未設定'}</div>
              {m.fromPlan && (
                <div className="mt-1.5 flex items-center gap-1 text-xs text-blue-600 bg-blue-50 rounded px-1.5 py-0.5 w-fit">
                  📅 生産計画より {m.startDate && `（${m.startDate}〜）`}
                </div>
              )}
              <div className="flex items-center gap-2 mt-2">
                <div className="flex-1 bg-slate-200 rounded-full h-1.5">
                  <div className={`h-1.5 rounded-full ${m.status === '完了' ? 'bg-green-500' : 'bg-blue-500'}`} style={{ width: `${p}%` }} />
                </div>
                <span className="text-xs text-slate-500">{p}%</span>
              </div>
            </button>
          );
        })}
      </div>

      {/* 詳細 */}
      {selected && (
        <div className="flex-1 min-w-0 space-y-4">
          {/* 基本情報 */}
          <div className="card">
            <div className="flex items-start justify-between mb-4">
              <div className="min-w-0 flex-1">
                <div className="flex items-center gap-2 flex-wrap">
                  <h2 className="text-base font-bold text-slate-800">{selected.mfgOrderNumber}</h2>
                  <span className={`badge ${statusColors[selected.status]}`}>{selected.status}</span>
                  {selectedProduct && (
                    <button
                      onClick={() => setShowDrawing(true)}
                      className="flex items-center gap-1 bg-blue-50 border border-blue-200 text-blue-700 px-2.5 py-1 rounded-lg text-xs font-medium hover:bg-blue-100 transition-colors"
                    >
                      📐 図面確認
                      {selectedProduct.drawingRevision && (
                        <span className="opacity-60">{selectedProduct.drawingRevision}</span>
                      )}
                    </button>
                  )}
                  {selected.status !== '完了' && (
                    <button
                      onClick={() => setShowTroubleModal(true)}
                      className="flex items-center gap-1 bg-red-50 border border-red-200 text-red-700 px-2.5 py-1 rounded-lg text-xs font-medium hover:bg-red-100 transition-colors">
                      🚨 トラブル報告
                    </button>
                  )}
                </div>
                <div className="text-slate-600 mt-0.5">{selected.productName}</div>
                <div className="text-xs text-slate-400 mt-1">
                  受注番号：{selected.orderNumber}　機械：{selected.machine}　作業者No.：{selected.operatorId}
                </div>
              </div>
              <div className="text-right flex-shrink-0 ml-3">
                <div className="text-xs text-slate-400">次工程送り長</div>
                <div className="text-xl font-bold text-blue-700">{selected.nextProcessLength.toLocaleString()} m</div>
                <div className="text-xs text-slate-400">（製品長 + ロス分）</div>
              </div>
            </div>
            <div className="grid grid-cols-3 gap-3 bg-slate-50 rounded-lg p-3">
              <div>
                <div className="text-xs text-slate-400">指示数量</div>
                <div className="font-bold text-slate-800">{selected.targetQuantity.toLocaleString()} m</div>
              </div>
              <div>
                <div className="text-xs text-slate-400">実出来高</div>
                <div className={`font-bold ${selected.actualOutput > 0 ? 'text-green-700' : 'text-slate-400'}`}>
                  {selected.actualOutput.toLocaleString()} m
                </div>
              </div>
              <div>
                <div className="text-xs text-slate-400">廃棄量（ロス）</div>
                <div className="font-bold text-orange-600">{selected.wasteQty.toLocaleString()} m</div>
              </div>
            </div>
            {/* No.10 本日の出来高登録 */}
            {selected.status !== '完了' && (
              <div className="mt-3 pt-3 border-t border-slate-100 flex items-center gap-2 flex-wrap">
                <span className="text-xs font-medium text-slate-600">📈 本日の出来高を加算：</span>
                <input
                  type="number" min="0"
                  className="input-field text-xs w-24 text-right font-mono"
                  value={todayOutput}
                  onChange={e => setTodayOutput(e.target.value)}
                  placeholder="数量"
                />
                <span className="text-xs text-slate-500">m</span>
                <button
                  onClick={handleAddOutput}
                  disabled={!todayOutput || Number(todayOutput) <= 0}
                  className="px-3 py-1.5 rounded-lg text-xs font-bold bg-emerald-600 text-white hover:bg-emerald-700 disabled:opacity-40 disabled:cursor-not-allowed">
                  ＋ 加算
                </button>
                <span className="text-xs text-slate-400">
                  進捗率: {selected.targetQuantity > 0 ? Math.min(100, Math.round((selected.actualOutput / selected.targetQuantity) * 100)) : 0}%
                </span>
              </div>
            )}
          </div>

          {/* No.9 作業開始チェックシート */}
          {selected.status !== '完了' && selectedProduct?.spec && (() => {
            const ordId = selected.id;
            const vals = startCheckValues[ordId] || {};
            const checkItems = [
              { item: '外径',   specMin: selectedProduct.spec.outerDiameter?.min,  specMax: selectedProduct.spec.outerDiameter?.max,  unit: 'mm' },
              { item: '肉厚',   specMin: selectedProduct.spec.wallThickness?.min,   specMax: selectedProduct.spec.wallThickness?.max,   unit: 'mm' },
              { item: '偏肉',   specMin: 0,    specMax: 0.2,    unit: 'mm' },
              { item: 'ピッチ', specMin: Math.max(1, (parseFloat(selectedProduct.conductorPitch) || 15) - 2), specMax: (parseFloat(selectedProduct.conductorPitch) || 15) + 2, unit: 'mm' },
            ].filter(c => c.specMin != null && c.specMax != null);
            if (checkItems.length === 0) return null;

            const outOfSpecItems = checkItems.filter(c => {
              const v = vals[c.item];
              if (v === '' || v === undefined) return false;
              const n = Number(v);
              return n < c.specMin || n > c.specMax;
            });
            const filledCount = checkItems.filter(c => vals[c.item] !== undefined && vals[c.item] !== '').length;
            const allOk = filledCount === checkItems.length && outOfSpecItems.length === 0;

            return (
              <div className={`card border-2 transition-all ${outOfSpecItems.length > 0 ? 'border-red-400 bg-red-50 animate-[pulse_0.5s_ease-in-out_3]' : allOk ? 'border-green-400' : 'border-blue-200'}`}>
                <div className="flex items-center justify-between mb-3">
                  <h3 className="font-semibold text-slate-800 flex items-center gap-2">
                    📋 作業開始チェックシート
                    {allOk && <span className="text-xs text-green-600 font-normal">✅ すべて規格内</span>}
                    {outOfSpecItems.length > 0 && <span className="text-xs text-red-700 font-bold animate-pulse">❌ 規格外あり！</span>}
                  </h3>
                  <span className="text-xs text-slate-400">{filledCount}/{checkItems.length} 入力済</span>
                </div>
                <table className="w-full text-sm">
                  <thead className="bg-slate-50">
                    <tr>
                      {['測定項目', '規格値（Min〜Max）', '実測値', '判定'].map(h => (
                        <th key={h} className="text-left py-1.5 px-2 text-xs font-medium text-slate-500">{h}</th>
                      ))}
                    </tr>
                  </thead>
                  <tbody>
                    {checkItems.map(c => {
                      const v = vals[c.item];
                      const isEmpty = v === undefined || v === '';
                      const n = isEmpty ? null : Number(v);
                      const isOk = n !== null && n >= c.specMin && n <= c.specMax;
                      const isOut = n !== null && !isOk;
                      return (
                        <tr key={c.item} className={`border-b border-slate-100 transition-colors ${isOut ? 'bg-red-50' : ''}`}>
                          <td className="py-2 px-2 text-xs font-medium text-slate-700">{c.item}</td>
                          <td className="py-2 px-2 text-xs font-mono text-slate-500">{c.specMin} 〜 {c.specMax} {c.unit}</td>
                          <td className="py-2 px-2">
                            <div className="flex items-center gap-1">
                              <input
                                type="number" step="0.01"
                                className={`input-field text-xs w-24 text-right font-mono ${isOut ? 'border-red-400 bg-red-100 text-red-700 font-bold ring-1 ring-red-400' : ''}`}
                                value={v ?? ''}
                                onChange={e => {
                                  const newV = e.target.value;
                                  setStartCheckValues(prev => ({
                                    ...prev,
                                    [ordId]: { ...(prev[ordId] || {}), [c.item]: newV },
                                  }));
                                  if (newV !== '') {
                                    const num = Number(newV);
                                    if (num < c.specMin || num > c.specMax) {
                                      setStartCheckAlert({ item: c.item, actual: num, specMin: c.specMin, specMax: c.specMax, unit: c.unit });
                                    } else {
                                      setStartCheckAlert(null);
                                    }
                                  }
                                }}
                                placeholder="実測値"
                              />
                              <span className="text-xs text-slate-400">{c.unit}</span>
                            </div>
                          </td>
                          <td className="py-2 px-2 text-xs text-center">
                            {isEmpty ? <span className="text-slate-300">—</span>
                              : isOk  ? <span className="text-green-600 font-bold">✅ OK</span>
                              : <span className="text-red-600 font-bold">❌ NG</span>}
                          </td>
                        </tr>
                      );
                    })}
                  </tbody>
                </table>
                {outOfSpecItems.length > 0 && (
                  <div className="mt-3 p-3 bg-red-100 border border-red-300 rounded-xl">
                    <div className="text-sm font-bold text-red-700 mb-1">⚠️ 規格外の測定値があります！</div>
                    {outOfSpecItems.map(c => (
                      <div key={c.item} className="text-xs text-red-700">
                        【{c.item}】実測: {vals[c.item]} {c.unit} → 規格: {c.specMin}〜{c.specMax} {c.unit}
                      </div>
                    ))}
                    <div className="text-xs text-red-500 mt-1.5 font-medium">作業を一時停止し、設備の調整を行ってください。</div>
                  </div>
                )}
              </div>
            );
          })()}

          {/* ① 工程フロー */}
          <div className="card">
            <div className="flex items-center justify-between mb-4">
              <h3 className="font-semibold text-slate-800">工程進捗チェック</h3>
              <div className="text-sm text-slate-500">
                <span className="text-blue-700 font-bold">{completedSteps}</span> / {selected.processSteps.length} 工程完了
              </div>
            </div>

            {/* 工程ステップ行 */}
            <div className="flex items-center gap-1">
              {selected.processSteps.map((s, i) => {
                const isForced = !!(selected.forceCompletes?.[s.step]);
                return (
                  <div key={s.step} className="flex items-center flex-1">
                    <div className={`flex-1 py-3 px-2 rounded-lg border-2 text-center text-sm font-medium select-none ${
                      s.completed
                        ? isForced ? 'bg-orange-50 border-orange-300 text-orange-700' : 'bg-green-100 border-green-400 text-green-700'
                        : i === completedSteps ? 'bg-blue-50 border-blue-400 text-blue-700 animate-pulse' : 'bg-slate-50 border-slate-200 text-slate-400'
                    }`}>
                      <div className="text-xs">{s.completed ? (isForced ? '⚠️' : '✅') : i === completedSteps ? '▶' : '○'}</div>
                      <div className="font-medium">{s.step}</div>
                      {s.completedDate && <div className="text-xs opacity-70">{s.completedDate}</div>}
                      {!s.completed && i === completedSteps && <div className="text-xs text-blue-600">測定入力 ↓</div>}
                    </div>
                    {i < selected.processSteps.length - 1 && (
                      <div className={`w-6 h-0.5 flex-shrink-0 ${s.completed ? 'bg-green-400' : 'bg-slate-200'}`} />
                    )}
                  </div>
                );
              })}
            </div>

            {/* プログレスバー */}
            <div className="mt-3 bg-slate-50 rounded-lg h-2">
              <div className={`h-2 rounded-lg transition-all ${selected.status === '完了' ? 'bg-green-500' : 'bg-blue-500'}`}
                style={{ width: `${pct}%` }} />
            </div>
            <div className="text-xs text-slate-400 mt-1 text-right">{pct}% 完了</div>

            {/* 現在工程の作業条件 */}
            {selectedProduct?.workConditions && (() => {
              const activeStep = selected.processSteps[completedSteps];
              if (!activeStep) return null;
              const cond = selectedProduct.workConditions[activeStep.step];
              if (!cond) return null;
              const colCls = PROCESS_COLORS[activeStep.step] || 'bg-slate-50 border-slate-200 text-slate-700';
              return (
                <div className={`mt-4 rounded-xl border p-3 ${colCls}`}>
                  <div className="flex items-center gap-1.5 mb-1.5">
                    <span className="text-sm">📋</span>
                    <span className="text-xs font-bold">【{activeStep.step}】作業条件</span>
                  </div>
                  <p className="text-xs leading-relaxed whitespace-pre-line">{cond}</p>
                </div>
              );
            })()}

            {/* ── 現在工程のインライン測定値入力 ── */}
            {selected.status !== '完了' && (() => {
              const activeStep = selected.processSteps[completedSteps];
              if (!activeStep) return null;
              const stepMeas = selected.measurements?.[activeStep.step] || [];
              if (stepMeas.length === 0) return null;
              const allFilled = stepMeas.every(m => m.actual !== '' && m.actual !== null && m.actual !== undefined);
              const outOfSpec = stepMeas.filter(m => {
                if (m.actual === '' || m.actual === null || m.actual === undefined) return false;
                const v = Number(m.actual);
                return (m.specMin !== null && v < m.specMin) || (m.specMax !== null && v > m.specMax);
              });
              return (
                <div className="mt-4 border-t border-slate-200 pt-4">
                  <div className="flex items-center gap-2 mb-2">
                    <span className="text-xs font-bold text-slate-700">📏 【{activeStep.step}】測定値入力</span>
                    {allFilled && outOfSpec.length === 0 && <span className="text-green-600 text-xs font-medium">✅ すべて規格内</span>}
                    {allFilled && outOfSpec.length > 0 && <span className="text-red-600 text-xs font-bold">❌ 規格外あり</span>}
                    {!allFilled && <span className="text-orange-500 text-xs">⚠ 未入力あり</span>}
                  </div>
                  <table className="w-full text-sm">
                    <thead className="bg-slate-50">
                      <tr>
                        {['測定項目', '規格値（公差）', '実測値', '判定'].map(h => (
                          <th key={h} className="text-left py-1.5 px-2 text-xs font-medium text-slate-500">{h}</th>
                        ))}
                      </tr>
                    </thead>
                    <tbody>
                      {stepMeas.map((m, i) => {
                        const isEmpty = m.actual === '' || m.actual === null || m.actual === undefined;
                        const val = isEmpty ? null : Number(m.actual);
                        const isOk = val !== null &&
                          (m.specMin === null || val >= m.specMin) &&
                          (m.specMax === null || val <= m.specMax);
                        const isOut = val !== null && !isOk;
                        return (
                          <tr key={m.item} className={`border-b border-slate-100 ${isOut ? 'bg-red-50' : ''}`}>
                            <td className="py-1.5 px-2 text-xs font-medium text-slate-700">{m.item}</td>
                            <td className="py-1.5 px-2 text-xs text-slate-500 font-mono">
                              {m.specMin} 〜 {m.specMax} {m.unit}
                            </td>
                            <td className="py-1.5 px-2">
                              <div className="flex items-center gap-1">
                                <input
                                  type="number" step="0.01"
                                  className={`input-field text-xs w-24 text-right font-mono ${isOut ? 'border-red-400 bg-red-50 text-red-700 font-bold' : ''}`}
                                  value={m.actual ?? ''}
                                  onChange={e => handleMeasurementChange(activeStep.step, i, e.target.value)}
                                  placeholder="実測値"
                                />
                                <span className="text-xs text-slate-400">{m.unit}</span>
                              </div>
                            </td>
                            <td className="py-1.5 px-2 text-xs text-center">
                              {isEmpty ? <span className="text-slate-300">—</span>
                                : isOk ? <span className="text-green-600">✅</span>
                                : <span className="text-red-600 font-bold">❌ 規格外</span>}
                            </td>
                          </tr>
                        );
                      })}
                    </tbody>
                  </table>
                  <div className="mt-3 flex items-center justify-between">
                    <div className="text-xs text-slate-500">
                      {!allFilled && <span className="text-orange-600">⚠️ 未入力の測定値があります</span>}
                      {allFilled && outOfSpec.length > 0 && (
                        <span className="text-red-600">❌ 規格外の値があります。責任者承認で強制完了できます</span>
                      )}
                    </div>
                    <div className="flex items-center gap-2 flex-wrap">
                      {/* 遅延アラート発出ボタン */}
                      {(() => {
                        const stepIdx = completedSteps;
                        const stepName = activeStep?.step;
                        const alreadyFiled = delayAlerts?.some(
                          a => a.orderId === selected.orderId && a.processName === stepName && a.status === 'active'
                        );
                        return alreadyFiled ? (
                          <span className="text-xs text-orange-600 font-medium px-2 py-1 bg-orange-50 border border-orange-200 rounded-lg">
                            🔔 遅延アラート発出済み
                          </span>
                        ) : (
                          <button
                            onClick={() => setAlertFormOpen(prev => ({ ...prev, [stepIdx]: !prev[stepIdx] }))}
                            className="px-2.5 py-1.5 rounded-lg text-xs font-bold bg-orange-100 text-orange-700 border border-orange-200 hover:bg-orange-200 transition-colors">
                            🔔 遅延アラート発出
                          </button>
                        );
                      })()}
                      {allFilled && outOfSpec.length > 0 && (
                        <button
                          onClick={() => { setPendingStepIndex(completedSteps); setShowForceComplete(true); }}
                          className="bg-red-100 text-red-700 border border-red-300 px-3 py-1.5 rounded-lg text-xs font-bold hover:bg-red-200">
                          ⚠️ 強制完了（責任者）
                        </button>
                      )}
                      <button
                        onClick={() => handleStepToggle(completedSteps)}
                        disabled={!allFilled || outOfSpec.length > 0}
                        className={`px-5 py-1.5 rounded-lg text-xs font-bold transition-all ${
                          allFilled && outOfSpec.length === 0
                            ? 'bg-blue-600 text-white hover:bg-blue-700'
                            : 'bg-slate-200 text-slate-400 cursor-not-allowed'
                        }`}>
                        この工程を完了 ✓
                      </button>
                    </div>

                    {/* 遅延アラート入力フォーム */}
                    {alertFormOpen[completedSteps] && (
                      <div className="mt-3 p-3 rounded-lg bg-orange-50 border border-orange-200 space-y-2">
                        <div className="text-xs font-bold text-orange-700">🔔 遅延アラート発出</div>
                        <input
                          type="text"
                          placeholder="担当者名"
                          value={alertBy[completedSteps] || ''}
                          onChange={e => setAlertBy(prev => ({ ...prev, [completedSteps]: e.target.value }))}
                          className="w-full text-xs border border-orange-200 rounded px-2 py-1.5 focus:outline-none focus:ring-1 focus:ring-orange-400"
                        />
                        <textarea
                          rows={2}
                          placeholder="遅延理由・見込み日数などを記入してください"
                          value={alertComment[completedSteps] || ''}
                          onChange={e => setAlertComment(prev => ({ ...prev, [completedSteps]: e.target.value }))}
                          className="w-full text-xs border border-orange-200 rounded px-2 py-1.5 focus:outline-none focus:ring-1 focus:ring-orange-400 resize-none"
                        />
                        <div className="flex gap-2 justify-end">
                          <button
                            onClick={() => setAlertFormOpen(prev => ({ ...prev, [completedSteps]: false }))}
                            className="text-xs px-3 py-1.5 rounded-lg bg-white border border-slate-200 text-slate-600 hover:bg-slate-50">
                            キャンセル
                          </button>
                          <button
                            disabled={!(alertComment[completedSteps] || '').trim()}
                            onClick={() => handleSubmitDelayAlert(completedSteps)}
                            className="text-xs px-4 py-1.5 rounded-lg bg-orange-500 text-white font-bold hover:bg-orange-600 disabled:opacity-40 disabled:cursor-not-allowed">
                            発出する
                          </button>
                        </div>
                      </div>
                    )}
                  </div>
                </div>
              );
            })()}

            {/* 完了済み工程のサマリ（折りたたみ） */}
            {completedSteps > 0 && (
              <details className="mt-3">
                <summary className="text-xs text-slate-400 cursor-pointer hover:text-slate-600 select-none">
                  ▶ 完了済み工程の詳細（測定値・作業条件）
                </summary>
                <div className="mt-2 space-y-2">
                  {selected.processSteps.filter(s => s.completed).map(s => {
                    const fc = selected.forceCompletes?.[s.step];
                    const meas = selected.measurements?.[s.step] || [];
                    const colCls = PROCESS_COLORS[s.step] || 'bg-slate-50 border-slate-200 text-slate-700';
                    return (
                      <div key={s.step} className={`rounded-lg border px-3 py-2 opacity-80 ${colCls}`}>
                        <div className="flex items-center justify-between mb-1">
                          <span className="text-xs font-bold">{fc ? '⚠️' : '✅'} {s.step}（{s.completedDate}）</span>
                          {fc && <span className="text-xs text-red-600 font-medium">強制完了: {fc.by}</span>}
                        </div>
                        {meas.length > 0 && (
                          <div className="flex flex-wrap gap-x-3 gap-y-0.5 text-xs text-slate-600 mb-1">
                            {meas.map(m => (
                              <span key={m.item}>{m.item}: <span className="font-mono font-medium">{m.actual}{m.unit}</span></span>
                            ))}
                          </div>
                        )}
                        {fc && (
                          <div className="text-xs text-orange-700 bg-orange-50 rounded px-2 py-1 mb-1">
                            強制完了理由: {fc.reason}
                          </div>
                        )}
                        {selectedProduct?.workConditions?.[s.step] && (
                          <p className="text-xs leading-relaxed whitespace-pre-line opacity-70">
                            {selectedProduct.workConditions[s.step]}
                          </p>
                        )}
                      </div>
                    );
                  })}
                </div>
              </details>
            )}
          </div>

          {/* 使用材料ロット（複数ロット対応） */}
          {(() => {
            const lots = selected.materialLots ?? (selected.materialLot ? [selected.materialLot] : ['']);
            const updateLot = (i, val) => {
              const next = lots.map((l, idx) => idx === i ? val : l);
              syncSelected({ ...selected, materialLots: next, materialLot: next[0] || '' });
            };
            const addLot = () => syncSelected({
              ...selected,
              materialLots: [...lots, ''],
              materialLot: selected.materialLot || '',
            });
            const removeLot = (i) => {
              if (lots.length <= 1) return;
              const next = lots.filter((_, idx) => idx !== i);
              syncSelected({ ...selected, materialLots: next, materialLot: next[0] || '' });
            };
            return (
              <div className="card">
                <div className="flex items-center justify-between mb-3">
                  <h3 className="font-semibold text-slate-800">使用材料ロットNo.（トレーサビリティ）</h3>
                  <button onClick={addLot} className="btn-secondary text-xs">＋ ロット追加</button>
                </div>
                <div className="space-y-2">
                  {lots.map((lot, i) => (
                    <div key={i} className="flex items-center gap-2">
                      <span className="text-xs text-slate-400 w-5 text-right flex-shrink-0">{i + 1}</span>
                      <input
                        className="input-field flex-1 max-w-xs font-mono"
                        value={lot}
                        onChange={e => updateLot(i, e.target.value)}
                        placeholder="LOT番号を入力またはバーコードスキャン"
                      />
                      <button className="btn-secondary text-xs px-2">📷</button>
                      {lot && <span className="text-green-600 text-xs">✅ {lot}</span>}
                      {lots.length > 1 && (
                        <button onClick={() => removeLot(i)}
                          className="text-slate-300 hover:text-red-500 text-sm transition-colors">×</button>
                      )}
                    </div>
                  ))}
                </div>
                {lots.filter(Boolean).length > 1 && (
                  <div className="mt-2 text-xs text-slate-400">
                    ロット {lots.filter(Boolean).length}件 登録済み
                  </div>
                )}
              </div>
            );
          })()}

          {/* ③ BOM・材料払い出し */}
          <div className="card">
            <div className="flex items-center justify-between mb-3">
              <h3 className="font-semibold text-slate-800">📦 必要材料・払い出し管理</h3>
              {selected.status !== '完了' && (
                <div className="flex items-center gap-2">
                  <button
                    onClick={handleQuickIssue}
                    disabled={!bom.length}
                    className="px-3 py-1.5 rounded-lg text-xs font-bold bg-amber-500 text-white hover:bg-amber-600 disabled:opacity-40 disabled:cursor-not-allowed">
                    ⚡ 一括自動出庫
                  </button>
                  <button onClick={() => setShowIssuanceModal(true)}
                    className="btn-primary text-xs">
                    ＋ 個別記録
                  </button>
                </div>
              )}
            </div>

            {bom.length === 0 ? (
              <div className="text-xs text-slate-400 py-2">BOM情報が見つかりません（受注に見積BOMが未設定の可能性があります）</div>
            ) : (
              <table className="w-full text-sm mb-3">
                <thead className="bg-slate-50">
                  <tr>
                    {['材料名', '規定量', '払出済', '返却待ち'].map(h => (
                      <th key={h} className="text-left py-2 px-2 text-xs font-medium text-slate-500">{h}</th>
                    ))}
                  </tr>
                </thead>
                <tbody>
                  {bom.map(b => {
                    const needed = Math.ceil(selected.targetQuantity * b.requiredQty * lossRate * 10) / 10;
                    const issued = myIssuances
                      .filter(iss => iss.materialId === b.materialId)
                      .reduce((sum, iss) => sum + iss.issuedQty, 0);
                    const returning = myIssuances
                      .filter(iss => iss.materialId === b.materialId && iss.status === '払出済')
                      .reduce((sum, iss) => sum + iss.issuedQty, 0);
                    return (
                      <tr key={b.materialId} className="border-b border-slate-100">
                        <td className="py-2 px-2 text-xs font-medium">{b.materialName}</td>
                        <td className="py-2 px-2 text-xs font-mono text-slate-500">{needed}kg</td>
                        <td className="py-2 px-2 text-xs">
                          <span className={issued > 0 ? 'text-blue-600 font-bold' : 'text-slate-300'}>
                            {issued > 0 ? `${issued}kg` : '—'}
                          </span>
                        </td>
                        <td className="py-2 px-2 text-xs">
                          {returning > 0
                            ? <span className="text-orange-500 font-bold">{returning}kg</span>
                            : <span className="text-green-600">—</span>
                          }
                        </td>
                      </tr>
                    );
                  })}
                </tbody>
              </table>
            )}

            {/* 払い出し履歴 */}
            {myIssuances.length > 0 && (
              <details className="mt-1">
                <summary className="text-xs text-slate-400 cursor-pointer hover:text-slate-600 select-none">
                  ▶ 払い出し履歴（{myIssuances.length}件）
                </summary>
                <div className="mt-2 space-y-1.5">
                  {myIssuances.map(iss => (
                    <div key={iss.id}
                      className={`flex items-center gap-3 rounded-lg px-3 py-2 text-xs ${
                        iss.status === '払出済' ? 'bg-orange-50 border border-orange-200' : 'bg-green-50 border border-green-200'
                      }`}>
                      <span className="font-medium flex-1">{iss.materialName}</span>
                      <span className="font-mono">{iss.issuedQty}kg</span>
                      <span className={`font-bold ${iss.status === '払出済' ? 'text-orange-600' : 'text-green-600'}`}>
                        {iss.status}
                      </span>
                      {iss.lotNumber && <span className="text-slate-400 font-mono">{iss.lotNumber}</span>}
                    </div>
                  ))}
                </div>
              </details>
            )}
          </div>

          {/* No.4 現場コメント・要望 */}
          <div className="card">
            <h3 className="font-semibold text-slate-800 mb-3">💬 現場コメント・変更リクエスト</h3>
            {(selected.comments || []).length > 0 && (
              <div className="space-y-2 mb-3">
                {(selected.comments || []).map(c => (
                  <div key={c.id} className="bg-slate-50 rounded-lg px-3 py-2">
                    <div className="flex items-center gap-2 mb-0.5">
                      <span className="text-xs font-medium text-slate-700">{c.author}</span>
                      <span className="text-xs text-slate-400">{c.createdAt}</span>
                    </div>
                    <p className="text-sm text-slate-800 whitespace-pre-line">{c.text}</p>
                  </div>
                ))}
              </div>
            )}
            <div className="space-y-2">
              <div className="flex gap-2">
                <input
                  className="input-field text-xs flex-1"
                  value={commentAuthor}
                  onChange={e => setCommentAuthor(e.target.value)}
                  placeholder="投稿者名（任意）"
                />
              </div>
              <textarea
                rows={2}
                className="input-field resize-none w-full text-sm"
                value={commentText}
                onChange={e => setCommentText(e.target.value)}
                placeholder="生産計画への変更依頼・現場からの連絡事項を入力..."
              />
              <div className="flex justify-end">
                <button
                  onClick={handleAddComment}
                  disabled={!commentText.trim()}
                  className="px-4 py-1.5 rounded-lg text-xs font-bold bg-slate-700 text-white hover:bg-slate-800 disabled:opacity-40 disabled:cursor-not-allowed">
                  投稿
                </button>
              </div>
            </div>
          </div>

          {/* 作業終了チェックシート（全工程完了後に表示） */}
          {allStepsComplete && selected.status !== '完了' && selectedProduct?.spec && (() => {
            const ordId = selected.id;
            const vals  = endCheckValues[ordId] || {};
            const submitted = endCheckSubmitted[ordId] || false;

            const numItems = [
              { item:'最終外径', specMin: selectedProduct.spec.outerDiameter?.min, specMax: selectedProduct.spec.outerDiameter?.max, unit:'mm' },
              { item:'最終肉厚', specMin: selectedProduct.spec.wallThickness?.min,  specMax: selectedProduct.spec.wallThickness?.max,  unit:'mm' },
            ].filter(c => c.specMin != null && c.specMax != null);

            const boolItems = ['外観・傷確認', '刻印・マーキング確認', '清掃完了'];

            const numOk    = numItems.every(c => {
              const v = vals[c.item];
              if (!v && v !== 0) return false;
              const n = Number(v);
              return n >= c.specMin && n <= c.specMax;
            });
            const boolOk   = boolItems.every(c => vals[c] === 'OK');
            const allOk    = numOk && boolOk;

            return (
              <div className={`card border-2 transition-all ${submitted && allOk ? 'border-green-400 bg-green-50' : allOk ? 'border-green-400' : 'border-indigo-300 bg-indigo-50/40'}`}>
                <div className="flex items-center justify-between mb-3">
                  <h3 className="font-semibold text-slate-800 flex items-center gap-2">
                    📋 作業終了チェックシート
                    {submitted && allOk && <span className="text-xs text-green-600">✅ チェック完了</span>}
                  </h3>
                  <span className="text-xs text-slate-400 font-medium">全工程完了後の最終確認</span>
                </div>

                {/* 数値測定 */}
                <table className="w-full text-sm mb-3">
                  <thead className="bg-slate-50">
                    <tr>
                      {['測定項目', '規格値（Min〜Max）', '実測値', '判定'].map(h => (
                        <th key={h} className="text-left py-1.5 px-2 text-xs font-medium text-slate-500">{h}</th>
                      ))}
                    </tr>
                  </thead>
                  <tbody>
                    {numItems.map(c => {
                      const v  = vals[c.item];
                      const isEmpty = v === undefined || v === '';
                      const n  = isEmpty ? null : Number(v);
                      const isOk  = n !== null && n >= c.specMin && n <= c.specMax;
                      const isOut = n !== null && !isOk;
                      return (
                        <tr key={c.item} className={`border-b border-slate-100 ${isOut ? 'bg-red-50' : ''}`}>
                          <td className="py-2 px-2 text-xs font-medium text-slate-700">{c.item}</td>
                          <td className="py-2 px-2 text-xs font-mono text-slate-500">{c.specMin} 〜 {c.specMax} {c.unit}</td>
                          <td className="py-2 px-2">
                            <div className="flex items-center gap-1">
                              <input type="number" step="0.01"
                                className={`input-field text-xs w-24 text-right font-mono ${isOut ? 'border-red-400 bg-red-100 text-red-700' : ''}`}
                                value={v ?? ''}
                                disabled={submitted && allOk}
                                onChange={e => setEndCheckValues(prev => ({ ...prev, [ordId]: { ...(prev[ordId] || {}), [c.item]: e.target.value } }))}
                                placeholder="実測値" />
                              <span className="text-xs text-slate-400">{c.unit}</span>
                            </div>
                          </td>
                          <td className="py-2 px-2 text-xs text-center">
                            {isEmpty ? <span className="text-slate-300">—</span>
                              : isOk  ? <span className="text-green-600 font-bold">✅ OK</span>
                              : <span className="text-red-600 font-bold">❌ NG</span>}
                          </td>
                        </tr>
                      );
                    })}
                  </tbody>
                </table>

                {/* 目視確認チェックボックス */}
                <div className="space-y-2 mb-4">
                  {boolItems.map(label => (
                    <div key={label} className="flex items-center gap-3">
                      <span className="text-xs font-medium text-slate-700 w-36">{label}</span>
                      <div className="flex gap-2">
                        {['OK', 'NG'].map(v => (
                          <label key={v} className="flex items-center gap-1 cursor-pointer select-none">
                            <input type="radio" name={`end-${ordId}-${label}`} value={v}
                              checked={vals[label] === v}
                              disabled={submitted && allOk}
                              onChange={() => setEndCheckValues(prev => ({ ...prev, [ordId]: { ...(prev[ordId] || {}), [label]: v } }))}
                            />
                            <span className={`text-xs font-bold ${v === 'OK' ? 'text-green-700' : 'text-red-600'}`}>{v}</span>
                          </label>
                        ))}
                      </div>
                      {vals[label] && (
                        <span className={`text-xs ${vals[label] === 'OK' ? 'text-green-600' : 'text-red-600 font-bold'}`}>
                          {vals[label] === 'OK' ? '✅' : '❌'}
                        </span>
                      )}
                    </div>
                  ))}
                </div>

                <div className="flex items-center justify-between">
                  <span className="text-xs text-slate-500">
                    {allOk
                      ? <span className="text-green-600 font-medium">✅ 全項目確認済み — 製造完了を登録できます</span>
                      : <span className="text-orange-600">⚠️ 全項目を確認してください</span>}
                  </span>
                  {!submitted && (
                    <button
                      disabled={!allOk}
                      onClick={() => setEndCheckSubmitted(prev => ({ ...prev, [ordId]: true }))}
                      className={`px-4 py-1.5 rounded-lg text-xs font-bold transition-all ${allOk ? 'bg-indigo-600 text-white hover:bg-indigo-700' : 'bg-slate-200 text-slate-400 cursor-not-allowed'}`}>
                      終了チェック完了
                    </button>
                  )}
                </div>
              </div>
            );
          })()}

          {/* 製造完了登録 */}
          <div className="card">
            <div className="flex items-center justify-between">
              <div className="text-xs text-slate-500">
                {selected?.status === '完了'
                  ? <span className="text-green-600">✅ 製造完了済み</span>
                  : !allStepsComplete
                  ? <span className="text-orange-600">⚠️ 全工程の完了チェックが必要です</span>
                  : !endCheckSubmitted[selected?.id]
                  ? <span className="text-orange-600">⚠️ 作業終了チェックシートの確認が必要です</span>
                  : <span className="text-green-600">✅ 全工程・終了チェック完了 — 製造完了を登録できます</span>}
              </div>
              <button
                onClick={() => canComplete && setShowCompleteConfirm(true)}
                disabled={!canComplete}
                className={`px-6 py-2.5 rounded-lg text-sm font-bold transition-all ${
                  canComplete
                    ? 'bg-green-600 text-white hover:bg-green-700 shadow-md'
                    : 'bg-slate-200 text-slate-400 cursor-not-allowed'
                }`}
              >
                ✅ 完了登録
              </button>
            </div>
          </div>
        </div>
      )}

      {/* No.9 規格外警告ポップアップ */}
      {startCheckAlert && (
        <div className="fixed inset-0 z-[60] flex items-center justify-center bg-black/50 p-4 animate-[fadeIn_0.2s_ease-out]">
          <div className="bg-white rounded-2xl shadow-2xl max-w-sm w-full border-4 border-red-500">
            <div className="bg-red-500 rounded-t-xl px-6 py-4 text-center">
              <div className="text-4xl mb-1">🚨</div>
              <h3 className="font-black text-white text-lg">規格外！</h3>
            </div>
            <div className="px-6 py-5 text-center space-y-2">
              <p className="text-slate-700 font-semibold">{startCheckAlert.item} の実測値が規格を超えています</p>
              <div className="bg-red-50 border border-red-200 rounded-xl p-3 text-sm">
                <div className="text-red-700 font-bold text-lg">{startCheckAlert.actual} {startCheckAlert.unit}</div>
                <div className="text-slate-500 text-xs mt-0.5">規格値: {startCheckAlert.specMin}〜{startCheckAlert.specMax} {startCheckAlert.unit}</div>
              </div>
              <p className="text-xs text-slate-500">設備を確認し、再測定を行ってください。</p>
            </div>
            <div className="px-6 pb-5">
              <button
                onClick={() => setStartCheckAlert(null)}
                className="w-full bg-red-600 text-white rounded-xl py-2.5 font-bold hover:bg-red-700">
                確認しました
              </button>
            </div>
          </div>
        </div>
      )}

      {/* ① 工程順序アラートダイアログ */}
      {processAlert && (
        <ProcessOrderAlert message={processAlert} onClose={() => setProcessAlert(null)} />
      )}

      {/* 図面ポップアップ */}
      {showDrawing && (
        <DrawingModal
          product={selectedProduct}
          mfgOrder={selected}
          onClose={() => setShowDrawing(false)}
        />
      )}

      {/* 強制完了モーダル */}
      {showForceComplete && pendingStepIndex !== null && (() => {
        const stepName = selected.processSteps[pendingStepIndex].step;
        const stepMeas = selected.measurements?.[stepName] || [];
        const outOfSpec = stepMeas.filter(m => {
          if (m.actual === '' || m.actual === null) return false;
          const v = Number(m.actual);
          return (m.specMin !== null && v < m.specMin) || (m.specMax !== null && v > m.specMax);
        });
        return (
          <ForceCompleteModal
            stepName={stepName}
            outOfSpec={outOfSpec}
            onClose={() => { setShowForceComplete(false); setPendingStepIndex(null); }}
            onConfirm={(by, reason) => {
              doCompleteStep(pendingStepIndex, by, reason);
              setShowForceComplete(false);
              setPendingStepIndex(null);
            }}
          />
        );
      })()}

      {/* 材料払い出しモーダル */}
      {showIssuanceModal && selected && (
        <IssuanceMaterialModal
          mfgOrder={selected}
          bom={bom}
          lossRate={lossRate}
          onClose={() => setShowIssuanceModal(false)}
          onSave={(issuances) => {
            issuances.forEach(iss => issueMaterial(iss));
            setShowIssuanceModal(false);
          }}
        />
      )}

      {/* 返却促進モーダル */}
      {showReturnPrompt && (
        <ReturnPromptModal
          pendingReturns={pendingReturnsForSelected}
          onClose={() => setShowReturnPrompt(false)}
          onGoReturns={() => setShowReturnPrompt(false)}
        />
      )}

      {/* No.11 トラブル報告モーダル */}
      {showTroubleModal && (
        <TroubleReportModal
          mfgOrder={selected}
          onClose={() => setShowTroubleModal(false)}
          onSubmit={(data) => {
            addTroubleReport({
              mfgOrderId: selected.id,
              mfgOrderNumber: selected.mfgOrderNumber,
              productName: selected.productName,
              machine: selected.machine,
              ...data,
            });
            setShowTroubleModal(false);
          }}
        />
      )}

      {/* 完了確認 */}
      {showCompleteConfirm && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 p-4">
          <div className="bg-white rounded-xl shadow-2xl max-w-md w-full mx-4">
            <div className="p-6 border-b border-slate-200">
              <div className="text-3xl text-center mb-2">✅</div>
              <h3 className="font-bold text-center text-slate-800 mb-1">製造完了を登録します</h3>
              <p className="text-sm text-slate-500 text-center">{selected.mfgOrderNumber}　{selected.productName}</p>
            </div>
            {/* No.12 残材入庫処理 */}
            {bom.length > 0 && (
              <div className="px-6 py-4 border-b border-slate-100">
                <div className="text-xs font-semibold text-slate-600 mb-2">📦 残材入庫処理（使用後の余り材料を在庫へ戻す）</div>
                <div className="space-y-2">
                  {bom.map(b => {
                    const issued = myIssuances.filter(iss => iss.materialId === b.materialId).reduce((s, iss) => s + iss.issuedQty, 0);
                    if (issued === 0) return null;
                    return (
                      <div key={b.materialId} className="flex items-center gap-2 text-xs">
                        <span className="flex-1 text-slate-700 truncate">{b.materialName}</span>
                        <span className="text-slate-400">払出 {issued}kg</span>
                        <span className="text-slate-400">残:</span>
                        <input
                          type="number" min="0" step="0.1"
                          className="input-field text-xs w-20 text-right font-mono"
                          value={residualInputs[b.materialId] ?? ''}
                          onChange={e => setResidualInputs(prev => ({ ...prev, [b.materialId]: e.target.value }))}
                          placeholder="0"
                        />
                        <span className="text-slate-400">kg</span>
                      </div>
                    );
                  })}
                </div>
                <p className="text-xs text-slate-400 mt-2">※ 入力した数量は在庫へ自動返却されます（0または空欄はスキップ）</p>
              </div>
            )}
            <div className="flex gap-3 p-6">
              <button onClick={() => setShowCompleteConfirm(false)} className="flex-1 btn-secondary">キャンセル</button>
              <button onClick={handleComplete} className="flex-1 bg-green-600 text-white px-4 py-2 rounded-lg text-sm font-medium hover:bg-green-700">
                完了登録
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
