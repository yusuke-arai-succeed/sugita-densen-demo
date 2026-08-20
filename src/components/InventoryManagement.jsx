import { useState } from 'react';
import { useApp } from '../context/AppContext';
import ScannerModal from './ScannerModal';

const INSP_COLORS = {
  '未検品': 'bg-slate-100 text-slate-500',
  '検品中': 'bg-blue-100 text-blue-700',
  '合格':   'bg-green-100 text-green-700',
  '不合格': 'bg-red-100 text-red-700',
};
const RTN_COLORS = {
  '要返却':   'bg-orange-100 text-orange-700',
  '返却済':   'bg-green-100 text-green-700',
  '返却不要': 'bg-slate-100 text-slate-500',
};

// ─── 入荷検品モーダル ──────────────────────────────────────────
function InspectionModal({ record, onClose, onSave }) {
  const [form, setForm] = useState({
    receivedQty: record.orderedQty,
    lotNumber: record.lotNumber || '',
    inspectedBy: '',
    inspectionNote: '',
    inspectionStatus: '合格',
  });
  const [showLotScanner, setShowLotScanner] = useState(false);
  const set = (k, v) => setForm(f => ({ ...f, [k]: v }));

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 p-4">
      <div className="bg-white rounded-2xl shadow-2xl w-full max-w-md">
        <div className="px-6 py-4 border-b border-slate-200 flex items-center justify-between">
          <h2 className="font-bold text-slate-800">入荷検品</h2>
          <button onClick={onClose} className="text-slate-400 hover:text-slate-600 text-xl">✕</button>
        </div>
        <div className="p-6 space-y-4">
          <div className="bg-slate-50 rounded-xl p-4 text-sm space-y-1">
            <div><span className="text-slate-500">発注番号：</span><span className="font-mono font-bold">{record.poNumber}</span></div>
            <div><span className="text-slate-500">材料名：</span>{record.materialName}</div>
            <div><span className="text-slate-500">発注数量：</span>{record.orderedQty}kg</div>
            <div><span className="text-slate-500">入庫予定日：</span>{record.scheduledDate || '未確定'}</div>
          </div>
          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="block text-xs text-slate-500 mb-1">実入荷数量 (kg) *</label>
              <input type="number" className="input-field text-sm" value={form.receivedQty}
                onChange={e => set('receivedQty', Number(e.target.value))} />
            </div>
            <div>
              <label className="block text-xs text-slate-500 mb-1">ロット番号</label>
              <div className="flex gap-1.5">
                <input className="input-field text-sm flex-1 min-w-0" value={form.lotNumber}
                  onChange={e => set('lotNumber', e.target.value)} placeholder="LOT-XXXX" />
                <button
                  type="button"
                  onClick={() => setShowLotScanner(true)}
                  className="flex-shrink-0 px-2 py-1.5 rounded-lg border border-blue-200 bg-blue-50 text-blue-600 hover:bg-blue-100 text-sm transition-colors"
                  title="LOTバーコードをスキャン"
                >📷</button>
              </div>
            </div>
            <div>
              <label className="block text-xs text-slate-500 mb-1">検品担当者</label>
              <input className="input-field text-sm" value={form.inspectedBy}
                onChange={e => set('inspectedBy', e.target.value)} />
            </div>
            <div>
              <label className="block text-xs text-slate-500 mb-1">検品結果 *</label>
              <select className="input-field text-sm" value={form.inspectionStatus}
                onChange={e => set('inspectionStatus', e.target.value)}>
                {['合格','不合格','検品中'].map(s => <option key={s} value={s}>{s}</option>)}
              </select>
            </div>
          </div>
          <div>
            <label className="block text-xs text-slate-500 mb-1">検品メモ</label>
            <textarea className="input-field text-sm resize-none" rows={2} value={form.inspectionNote}
              onChange={e => set('inspectionNote', e.target.value)} />
          </div>
        </div>
        <div className="px-6 py-4 border-t border-slate-200 flex gap-3 justify-end">
          <button onClick={onClose} className="btn-secondary text-sm">キャンセル</button>
          <button onClick={() => onSave(form)} className="btn-primary text-sm">検品完了</button>
        </div>
      </div>
      {showLotScanner && (
        <ScannerModal
          title="ロット番号スキャン"
          hint="梱包ラベルのバーコード / QRコードをスキャンしてください"
          onScan={v => set('lotNumber', v)}
          onClose={() => setShowLotScanner(false)}
        />
      )}
    </div>
  );
}

// ─── 返却確認モーダル ──────────────────────────────────────────
function ReturnConfirmModal({ record, onClose, onSave }) {
  const [form, setForm] = useState({
    usedQty: record.issuedQty,
    returnedQty: 0,
    confirmedBy: '',
    notes: '',
  });
  const set = (k, v) => setForm(f => ({ ...f, [k]: v }));
  const expectedReturn = Math.max(0, record.issuedQty - Number(form.usedQty || 0));

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 p-4">
      <div className="bg-white rounded-2xl shadow-2xl w-full max-w-md">
        <div className="px-6 py-4 border-b border-slate-200 flex items-center justify-between">
          <h2 className="font-bold text-slate-800">返却確認</h2>
          <button onClick={onClose} className="text-slate-400 hover:text-slate-600 text-xl">✕</button>
        </div>
        <div className="p-6 space-y-4">
          <div className="bg-slate-50 rounded-xl p-4 text-sm space-y-1">
            <div><span className="text-slate-500">製造指示：</span><span className="font-mono font-bold">{record.mfgOrderNumber}</span></div>
            <div><span className="text-slate-500">材料名：</span>{record.materialName}</div>
            <div><span className="text-slate-500">払出量：</span><span className="font-bold">{record.issuedQty}kg</span></div>
            {record.lotNumber && (
              <div><span className="text-slate-500">ロット：</span><span className="font-mono text-xs">{record.lotNumber}</span></div>
            )}
          </div>
          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="block text-xs text-slate-500 mb-1">実使用量 (kg)</label>
              <input type="number" className="input-field text-sm" value={form.usedQty}
                onChange={e => {
                  const used = Number(e.target.value);
                  setForm(f => ({
                    ...f, usedQty: used,
                    returnedQty: Math.max(0, record.issuedQty - used),
                  }));
                }} />
            </div>
            <div>
              <label className="block text-xs text-slate-500 mb-1">返却量 (kg)</label>
              <input type="number" className="input-field text-sm" value={form.returnedQty}
                onChange={e => set('returnedQty', Number(e.target.value))} />
            </div>
          </div>
          <div className="bg-blue-50 rounded-lg px-3 py-2 text-xs text-blue-700">
            理論返却量: {expectedReturn}kg（払出量 {record.issuedQty}kg − 使用量 {form.usedQty}kg）
          </div>
          <div>
            <label className="block text-xs text-slate-500 mb-1">確認者</label>
            <input className="input-field text-sm" value={form.confirmedBy}
              onChange={e => set('confirmedBy', e.target.value)} />
          </div>
          <div>
            <label className="block text-xs text-slate-500 mb-1">備考</label>
            <textarea className="input-field text-sm resize-none" rows={2} value={form.notes}
              onChange={e => set('notes', e.target.value)} />
          </div>
        </div>
        <div className="px-6 py-4 border-t border-slate-200 flex gap-3 justify-end">
          <button onClick={onClose} className="btn-secondary text-sm">キャンセル</button>
          <button onClick={() => onSave(form)} className="btn-primary text-sm">返却確認</button>
        </div>
      </div>
    </div>
  );
}

// ─── メインコンポーネント ──────────────────────────────────────
export default function InventoryManagement() {
  const {
    materialReceiving, materialIssuances, materialReturns,
    purchaseOrders, orders, mfgOrders,
    completeReceiving, confirmReturn,
  } = useApp();

  const [activeTab, setActiveTab] = useState('receiving');
  const [inspectTarget, setInspectTarget] = useState(null);
  const [returnTarget, setReturnTarget] = useState(null);
  const [filterStatus, setFilterStatus] = useState('all');

  // 返却タブ：LOTスキャン照合
  const [showReturnScanner, setShowReturnScanner] = useState(false);
  const [returnScanResult, setReturnScanResult] = useState(null); // { found, record, lot }

  // 入荷管理：入庫予定日順
  const sortedReceiving = [...materialReceiving].sort((a, b) => {
    if (!a.scheduledDate) return 1;
    if (!b.scheduledDate) return -1;
    return a.scheduledDate.localeCompare(b.scheduledDate);
  });

  const filteredReceiving = filterStatus === 'all'
    ? sortedReceiving
    : sortedReceiving.filter(r => r.status === filterStatus);

  const sortedIssuances = [...materialIssuances].sort(
    (a, b) => b.issuedDate.localeCompare(a.issuedDate)
  );

  const sortedReturns = [...materialReturns].sort((a, b) => {
    const p = { '要返却': 0, '返却済': 2, '返却不要': 3 };
    return (p[a.status] ?? 1) - (p[b.status] ?? 1);
  });

  const pendingReturns = materialReturns.filter(r => r.status === '要返却').length;

  // LOTスキャンで返却レコードを照合（issuance経由）
  const handleReturnScan = (scannedValue) => {
    // issuancesでLOT照合 → issuanceId で returnsを検索
    const issuance = materialIssuances.find(iss => iss.lotNumber === scannedValue);
    if (issuance) {
      const returnRecord = materialReturns.find(r => r.issuanceId === issuance.id);
      if (returnRecord) {
        setReturnScanResult({ found: true, record: returnRecord, lot: scannedValue, issuance });
        if (returnRecord.status === '要返却') {
          setReturnTarget(returnRecord);
        }
      } else {
        setReturnScanResult({ found: true, noReturn: true, lot: scannedValue, issuance });
      }
    } else {
      setReturnScanResult({ found: false, lot: scannedValue });
    }
  };

  const tabs = [
    { id: 'receiving', label: '📥 入荷管理' },
    { id: 'issuance',  label: '📤 出荷履歴' },
    { id: 'returns',   label: `🔄 返却管理${pendingReturns > 0 ? ` (${pendingReturns})` : ''}` },
  ];

  return (
    <div className="space-y-4">
      <h1 className="text-xl font-bold text-slate-800">在庫管理</h1>

      {/* 返却待ちアラート */}
      {pendingReturns > 0 && (
        <div className="rounded-xl border border-orange-300 bg-orange-50 px-4 py-3 flex items-center gap-3">
          <span className="text-orange-700 font-bold text-sm">
            🔔 返却待ちの原材料が {pendingReturns}件 あります
          </span>
          <button onClick={() => setActiveTab('returns')}
            className="text-xs px-3 py-1 rounded bg-orange-600 text-white hover:bg-orange-700 font-semibold">
            返却管理へ
          </button>
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

      {/* ── 入荷管理タブ ── */}
      {activeTab === 'receiving' && (
        <div className="space-y-3">
          <div className="flex gap-2 flex-wrap">
            {['all','入荷待ち','一部入荷','検品完了'].map(s => (
              <button key={s} onClick={() => setFilterStatus(s)}
                className={`px-3 py-1 rounded-full text-xs font-semibold border transition-colors
                  ${filterStatus === s ? 'bg-slate-700 text-white border-slate-700' : 'bg-white text-slate-500 border-slate-200 hover:border-slate-400'}`}>
                {s === 'all' ? '全件' : s}
              </button>
            ))}
          </div>
          <div className="card p-0 overflow-hidden">
            <div className="overflow-x-auto">
              <table className="w-full text-sm">
                <thead className="bg-slate-50 border-b border-slate-200">
                  <tr>
                    {['入庫予定日','発注番号','材料名','発注量','入荷量','ロット','検品','ステータス','操作'].map(h => (
                      <th key={h} className="text-left py-2 px-3 text-xs font-medium text-slate-500 whitespace-nowrap">{h}</th>
                    ))}
                  </tr>
                </thead>
                <tbody>
                  {filteredReceiving.map(r => {
                    const TODAY = '2026-05-21';
                    const daysLeft = r.scheduledDate
                      ? Math.ceil((new Date(r.scheduledDate) - new Date(TODAY)) / 86400000)
                      : null;
                    return (
                      <tr key={r.id} className="border-b border-slate-100 hover:bg-slate-50">
                        <td className="py-2 px-3">
                          {r.scheduledDate
                            ? <div>
                                <div className="text-sm font-medium">{r.scheduledDate}</div>
                                {daysLeft !== null && (
                                  <div className={`text-xs ${daysLeft < 0 ? 'text-red-600 font-bold' : daysLeft <= 2 ? 'text-orange-500' : 'text-slate-400'}`}>
                                    {daysLeft < 0 ? `${Math.abs(daysLeft)}日超過` : daysLeft === 0 ? '今日' : `あと${daysLeft}日`}
                                  </div>
                                )}
                              </div>
                            : <span className="text-xs text-yellow-600 font-medium">未確定</span>
                          }
                        </td>
                        <td className="py-2 px-3 font-mono text-xs">{r.poNumber}</td>
                        <td className="py-2 px-3 font-medium text-xs">{r.materialName}</td>
                        <td className="py-2 px-3 text-xs font-mono">{r.orderedQty}kg</td>
                        <td className="py-2 px-3 text-xs font-mono">{r.receivedQty > 0 ? `${r.receivedQty}kg` : '—'}</td>
                        <td className="py-2 px-3 text-xs font-mono text-slate-500">{r.lotNumber || '—'}</td>
                        <td className="py-2 px-3">
                          <span className={`badge text-xs ${INSP_COLORS[r.inspectionStatus] || 'bg-slate-100 text-slate-500'}`}>
                            {r.inspectionStatus}
                          </span>
                        </td>
                        <td className="py-2 px-3">
                          <span className={`badge text-xs ${
                            r.status === '検品完了' ? 'bg-green-100 text-green-700' :
                            r.status === '一部入荷' ? 'bg-orange-100 text-orange-700' :
                            'bg-slate-100 text-slate-500'}`}>
                            {r.status}
                          </span>
                        </td>
                        <td className="py-2 px-3">
                          {r.status !== '検品完了' && (
                            <button onClick={() => setInspectTarget(r)}
                              className="text-xs px-2 py-1 rounded border border-blue-200 text-blue-600 hover:bg-blue-50 whitespace-nowrap">
                              検品入力
                            </button>
                          )}
                        </td>
                      </tr>
                    );
                  })}
                  {filteredReceiving.length === 0 && (
                    <tr><td colSpan={9} className="py-8 text-center text-slate-400">データなし</td></tr>
                  )}
                </tbody>
              </table>
            </div>
          </div>
        </div>
      )}

      {/* ── 出荷履歴タブ ── */}
      {activeTab === 'issuance' && (
        <div className="card p-0 overflow-hidden">
          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead className="bg-slate-50 border-b border-slate-200">
                <tr>
                  {['払出日','製造指示番号','受注番号','機械','材料名','払出量','ロット','担当者','返却状況'].map(h => (
                    <th key={h} className="text-left py-2 px-3 text-xs font-medium text-slate-500 whitespace-nowrap">{h}</th>
                  ))}
                </tr>
              </thead>
              <tbody>
                {sortedIssuances.map(iss => (
                  <tr key={iss.id} className="border-b border-slate-100 hover:bg-slate-50">
                    <td className="py-2 px-3 text-xs">{iss.issuedDate}</td>
                    <td className="py-2 px-3 font-mono text-xs font-bold">{iss.mfgOrderNumber}</td>
                    <td className="py-2 px-3 font-mono text-xs">{iss.orderNumber}</td>
                    <td className="py-2 px-3 text-xs">{iss.machineId}</td>
                    <td className="py-2 px-3 text-xs font-medium">{iss.materialName}</td>
                    <td className="py-2 px-3 text-xs font-mono font-bold">{iss.issuedQty}kg</td>
                    <td className="py-2 px-3 text-xs font-mono text-slate-500">{iss.lotNumber}</td>
                    <td className="py-2 px-3 text-xs text-slate-600">{iss.issuedBy}</td>
                    <td className="py-2 px-3">
                      <span className={`badge text-xs ${
                        iss.status === '返却済'   ? 'bg-green-100 text-green-700' :
                        iss.status === '一部返却' ? 'bg-yellow-100 text-yellow-700' :
                        'bg-slate-100 text-slate-500'}`}>
                        {iss.status}
                      </span>
                    </td>
                  </tr>
                ))}
                {sortedIssuances.length === 0 && (
                  <tr><td colSpan={9} className="py-8 text-center text-slate-400">払い出し記録なし</td></tr>
                )}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {/* ── 返却管理タブ ── */}
      {activeTab === 'returns' && (
        <div className="space-y-3">
          {/* LOTスキャン照合バナー */}
          <div className="flex items-center gap-3 bg-slate-50 border border-slate-200 rounded-xl px-4 py-3">
            <div className="flex-1 text-sm text-slate-600">
              返却材料のロットラベルをスキャンして、対象記録を即座に呼び出せます
            </div>
            <button
              onClick={() => { setReturnScanResult(null); setShowReturnScanner(true); }}
              className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-blue-600 text-white text-xs font-semibold hover:bg-blue-700 transition-colors whitespace-nowrap"
            >
              📷 LOTスキャン照合
            </button>
          </div>

          {/* スキャン結果 */}
          {returnScanResult && (
            <div className={`rounded-xl border px-4 py-3 text-sm ${
              returnScanResult.found
                ? returnScanResult.record.status === '要返却'
                  ? 'bg-orange-50 border-orange-300'
                  : 'bg-green-50 border-green-300'
                : 'bg-red-50 border-red-300'
            }`}>
              {returnScanResult.found ? (
                <div className="flex items-center justify-between gap-3">
                  <div>
                    {returnScanResult.noReturn ? (
                      <>
                        <div className="font-bold text-slate-800">✅ LOT照合完了（返却管理対象外）</div>
                        <div className="text-xs text-slate-500 mt-0.5">
                          {returnScanResult.lot} → {returnScanResult.issuance.materialName}（{returnScanResult.issuance.mfgOrderNumber}）
                        </div>
                        <div className="text-xs text-slate-400 mt-0.5">このロットに対応する返却管理レコードがありません</div>
                      </>
                    ) : (
                      <>
                        <div className="font-bold text-slate-800">
                          {returnScanResult.record.status === '要返却' ? '🔔' : '✅'} LOT照合完了
                        </div>
                        <div className="text-xs text-slate-500 mt-0.5">
                          {returnScanResult.lot} → {returnScanResult.record.materialName}（{returnScanResult.record.mfgOrderNumber}）
                        </div>
                        {returnScanResult.record.status !== '要返却' && (
                          <div className="text-xs text-green-700 mt-0.5">ステータス：{returnScanResult.record.status}</div>
                        )}
                      </>
                    )}
                  </div>
                  {!returnScanResult.noReturn && returnScanResult.record.status === '要返却' && (
                    <button
                      onClick={() => setReturnTarget(returnScanResult.record)}
                      className="px-3 py-1.5 rounded-lg bg-orange-600 text-white text-xs font-semibold hover:bg-orange-700 whitespace-nowrap"
                    >
                      返却確認へ
                    </button>
                  )}
                </div>
              ) : (
                <div className="text-red-700">
                  ⚠ ロット番号「{returnScanResult.lot}」が見つかりませんでした
                </div>
              )}
            </div>
          )}

          <div className="card p-0 overflow-hidden">
            <div className="overflow-x-auto">
              <table className="w-full text-sm">
                <thead className="bg-slate-50 border-b border-slate-200">
                  <tr>
                    {['製造指示番号','材料名','ロット','払出量','使用量','返却量','ステータス','返却日','操作'].map(h => (
                      <th key={h} className="text-left py-2 px-3 text-xs font-medium text-slate-500 whitespace-nowrap">{h}</th>
                    ))}
                  </tr>
                </thead>
                <tbody>
                  {sortedReturns.map(r => (
                    <tr key={r.id}
                      className={`border-b border-slate-100 hover:bg-slate-50 ${
                        returnScanResult?.found && !returnScanResult.noReturn && returnScanResult.record?.id === r.id
                          ? 'ring-2 ring-inset ring-blue-400 bg-blue-50'
                          : r.status === '要返却' ? 'bg-orange-50/40' : ''
                      }`}>
                      <td className="py-2 px-3 font-mono text-xs font-bold">{r.mfgOrderNumber}</td>
                      <td className="py-2 px-3 text-xs font-medium">{r.materialName}</td>
                      <td className="py-2 px-3 text-xs font-mono text-slate-500">{r.lotNumber || '—'}</td>
                      <td className="py-2 px-3 text-xs font-mono">{r.issuedQty}kg</td>
                      <td className="py-2 px-3 text-xs font-mono">{r.usedQty != null ? `${r.usedQty}kg` : '—'}</td>
                      <td className="py-2 px-3 text-xs font-mono">
                        {r.returnedQty != null ? `${r.returnedQty}kg` : '—'}
                      </td>
                      <td className="py-2 px-3">
                        <span className={`badge text-xs ${RTN_COLORS[r.status] || 'bg-slate-100 text-slate-500'}`}>
                          {r.status}
                        </span>
                      </td>
                      <td className="py-2 px-3 text-xs text-slate-500">{r.returnDate || '—'}</td>
                      <td className="py-2 px-3">
                        {r.status === '要返却' && (
                          <button onClick={() => setReturnTarget(r)}
                            className="text-xs px-2 py-1 rounded border border-orange-300 text-orange-600 hover:bg-orange-50 whitespace-nowrap">
                            返却確認
                          </button>
                        )}
                      </td>
                    </tr>
                  ))}
                  {sortedReturns.length === 0 && (
                    <tr><td colSpan={9} className="py-8 text-center text-slate-400">返却管理データなし</td></tr>
                  )}
                </tbody>
              </table>
            </div>
          </div>
        </div>
      )}

      {/* モーダル */}
      {inspectTarget && (
        <InspectionModal
          record={inspectTarget}
          onClose={() => setInspectTarget(null)}
          onSave={(data) => {
            completeReceiving(inspectTarget.id, data);
            setInspectTarget(null);
          }}
        />
      )}
      {returnTarget && (
        <ReturnConfirmModal
          record={returnTarget}
          onClose={() => setReturnTarget(null)}
          onSave={(data) => {
            confirmReturn(returnTarget.id, data);
            setReturnTarget(null);
          }}
        />
      )}
      {showReturnScanner && (
        <ScannerModal
          title="LOTスキャン照合"
          hint="返却材料のロットラベルをスキャン"
          onScan={handleReturnScan}
          onClose={() => setShowReturnScanner(false)}
        />
      )}
    </div>
  );
}
