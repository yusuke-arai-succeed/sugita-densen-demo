import { useState, useRef, useMemo } from 'react';
import QRCode from 'qrcode';
import { useApp } from '../context/AppContext';
import ScannerModal from './ScannerModal';

// ⑤ 棚卸異常値検知ロジック
function detectAnomaly(item, prevActual) {
  if (item.actualStock === null) return null;
  const variance = Math.abs(item.theoreticalStock - item.actualStock);
  const variancePct = item.theoreticalStock > 0 ? (variance / item.theoreticalStock) * 100 : 0;
  if (item.actualStock > 0 && prevActual > 0 && item.actualStock > prevActual * 5) {
    return `実在庫が前回実績（${prevActual}kg）の${(item.actualStock / prevActual).toFixed(0)}倍です。入力値を確認してください。`;
  }
  if (variancePct > 30) {
    return `理論在庫との差異が${variancePct.toFixed(1)}%（${variance}kg）あります。要確認。`;
  }
  return null;
}

// ─── スキャン棚卸モーダル ──────────────────────────────────────
function StocktakeScanModal({ inventory, inputValues, onInput, onClose, filterLabel }) {
  const [phase, setPhase] = useState('scan');   // scan | count
  const [scannedItem, setScannedItem]   = useState(null);
  const [countVal, setCountVal]         = useState('');
  const [lastSaved, setLastSaved]       = useState(null);
  const [notFound, setNotFound]         = useState(null);
  const countInputRef = useRef(null);

  const handleScan = (value) => {
    const item = inventory.find(i =>
      i.itemCode === value || i.itemCode.toLowerCase() === value.toLowerCase()
    );
    if (item) {
      setScannedItem(item);
      setNotFound(null);
      const existing = inputValues[item.id];
      setCountVal(existing !== undefined ? String(existing) : '');
      setPhase('count');
      setTimeout(() => countInputRef.current?.focus(), 100);
    } else {
      setNotFound(value);
      setScannedItem(null);
    }
  };

  const handleSaveCount = () => {
    if (!scannedItem || countVal === '') return;
    onInput(scannedItem.id, countVal);
    setLastSaved({ itemName: scannedItem.itemName, count: countVal, unit: scannedItem.unit });
    setPhase('scan');
    setScannedItem(null);
    setCountVal('');
  };

  const handleSkip = () => {
    setPhase('scan');
    setScannedItem(null);
    setCountVal('');
  };

  const doneCount = inventory.filter(i => {
    const v = inputValues[i.id];
    return v !== undefined && v !== '';
  }).length;

  return (
    <div className="fixed inset-0 z-50 flex items-end sm:items-center justify-center bg-black/70 p-0 sm:p-4">
      <div className="bg-white rounded-t-2xl sm:rounded-2xl shadow-2xl w-full sm:max-w-lg overflow-hidden">

        {/* ヘッダー */}
        <div className="flex items-center justify-between px-5 py-4 border-b border-slate-100">
          <div>
            <h3 className="font-bold text-slate-800">📦 棚卸スキャン入力</h3>
            <p className="text-xs text-slate-400 mt-0.5">
              品目ラベルをスキャン → 実在庫数量を入力
              <span className="ml-2 text-blue-600 font-semibold">{doneCount}/{inventory.length}件 入力済</span>
            </p>
            {filterLabel && (
              <span className="inline-flex items-center gap-1 mt-1 text-xs bg-blue-50 text-blue-700 border border-blue-200 rounded-full px-2.5 py-0.5 font-semibold">
                ⚙️ {filterLabel} のみ表示
              </span>
            )}
          </div>
          <button onClick={onClose}
            className="w-8 h-8 flex items-center justify-center rounded-full hover:bg-slate-100 text-slate-500 text-xl leading-none">
            ✕
          </button>
        </div>

        {phase === 'scan' ? (
          <>
            {/* 前回保存結果 */}
            {lastSaved && (
              <div className="mx-5 mt-4 bg-green-50 border border-green-200 rounded-xl px-4 py-3 text-sm">
                <div className="text-green-700 font-semibold">✅ 保存しました</div>
                <div className="text-green-600 text-xs mt-0.5">
                  {lastSaved.itemName}：{lastSaved.count}{lastSaved.unit}
                </div>
              </div>
            )}
            {notFound && (
              <div className="mx-5 mt-4 bg-red-50 border border-red-200 rounded-xl px-4 py-3 text-sm text-red-700">
                ⚠ 品目コード「{notFound}」が見つかりませんでした
              </div>
            )}

            {/* スキャナーUI（インライン埋め込み版） */}
            <div className="px-5 py-4">
              <div className="bg-slate-50 rounded-xl p-4 text-center space-y-3">
                <div className="text-4xl">📷</div>
                <p className="text-sm text-slate-600">
                  棚の品目ラベル（品目コード）をスキャンしてください
                </p>
                <p className="text-xs text-slate-400">
                  例：M001, M002, M005 など
                </p>
              </div>

              {/* 品目一覧ショートカット */}
              <div className="mt-3">
                <div className="text-xs text-slate-400 mb-2">品目を直接選択：</div>
                <div className="flex flex-wrap gap-1.5">
                  {inventory.map(item => {
                    const done = inputValues[item.id] !== undefined && inputValues[item.id] !== '';
                    return (
                      <button
                        key={item.id}
                        onClick={() => handleScan(item.itemCode)}
                        className={`text-xs px-2.5 py-1 rounded-full border font-mono transition-colors ${
                          done
                            ? 'bg-green-100 border-green-200 text-green-700'
                            : 'bg-white border-slate-200 text-slate-600 hover:border-blue-300 hover:bg-blue-50'
                        }`}
                      >
                        {done ? '✓ ' : ''}{item.itemCode}
                      </button>
                    );
                  })}
                </div>
              </div>
            </div>

            {/* スキャナーモーダルを開くボタン */}
            <div className="px-5 pb-5 flex gap-2">
              <ScannerModalTrigger onScan={handleScan} />
              <button onClick={onClose} className="flex-1 btn-secondary text-sm">完了・閉じる</button>
            </div>
          </>
        ) : (
          /* 数量入力フェーズ */
          <div className="px-5 py-5 space-y-4">
            <div className="bg-blue-50 rounded-xl p-4">
              <div className="text-xs text-blue-500 mb-1">スキャン品目</div>
              <div className="font-bold text-slate-800">{scannedItem?.itemName}</div>
              <div className="text-xs text-slate-500 mt-0.5 font-mono">{scannedItem?.itemCode}</div>
              <div className="flex gap-4 mt-2 text-xs">
                <span className="text-slate-500">理論在庫：<span className="font-bold text-slate-700">{scannedItem?.theoreticalStock}{scannedItem?.unit}</span></span>
                {inputValues[scannedItem?.id] !== undefined && (
                  <span className="text-blue-600">前回入力：{inputValues[scannedItem?.id]}{scannedItem?.unit}</span>
                )}
              </div>
            </div>

            <div>
              <label className="block text-sm font-semibold text-slate-700 mb-2">
                実在庫数量（{scannedItem?.unit}）
              </label>
              <input
                ref={countInputRef}
                type="number"
                value={countVal}
                onChange={e => setCountVal(e.target.value)}
                onKeyDown={e => e.key === 'Enter' && handleSaveCount()}
                placeholder={`実測値を入力（${scannedItem?.unit}）`}
                className="w-full border-2 border-blue-300 rounded-xl px-4 py-3 text-xl font-mono font-bold text-right focus:outline-none focus:ring-2 focus:ring-blue-400"
              />
              <div className="text-xs text-slate-400 mt-1 text-right">Enterキーでも保存できます</div>
            </div>

            <div className="flex gap-2">
              <button onClick={handleSkip} className="flex-1 btn-secondary text-sm">スキップ</button>
              <button
                onClick={handleSaveCount}
                disabled={countVal === ''}
                className="flex-1 btn-primary text-sm disabled:opacity-40"
              >
                💾 保存して次へ
              </button>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}

// カメラスキャン起動ボタン（スキャナーモーダルをインラインで開く）
function ScannerModalTrigger({ onScan }) {
  const [open, setOpen] = useState(false);
  return (
    <>
      <button
        onClick={() => setOpen(true)}
        className="flex-1 flex items-center justify-center gap-1.5 px-3 py-2 rounded-lg bg-blue-600 text-white text-sm font-semibold hover:bg-blue-700 transition-colors"
      >
        📷 カメラスキャン
      </button>
      {open && (
        <ScannerModal
          title="品目コードスキャン"
          hint="棚ラベルの品目コード（例：M001）をスキャン"
          onScan={(v) => { onScan(v); setOpen(false); }}
          onClose={() => setOpen(false)}
        />
      )}
    </>
  );
}

// ─── ロケーション別棚卸ビュー ───────────────────────────────────
function LocationView({ inventory, mainLocations, machineSubLocations,
  materialShelfAssignment, subLocationQty, locationActuals, setLocationActuals, approved,
  activeLocation, setActiveLocation }) {

  const allLocations = [...mainLocations, ...machineSubLocations];
  // activeLocation が未設定なら最初のロケーションを使う
  const effectiveLocation = activeLocation || allLocations[0] || null;

  const isMainLoc = loc => mainLocations.includes(loc);

  // このロケーションにある品目と期待数量を返す
  const getLocationItems = loc => {
    if (isMainLoc(loc)) {
      return inventory
        .filter(i => materialShelfAssignment[i.itemCode] === loc)
        .map(i => {
          const subTotal = Object.values(subLocationQty)
            .reduce((s, m) => s + (m[i.itemCode] || 0), 0);
          return { ...i, expectedQty: Math.max(0, i.theoreticalStock - subTotal) };
        });
    } else {
      const matMap = subLocationQty[loc] || {};
      return inventory
        .filter(i => (matMap[i.itemCode] || 0) > 0)
        .map(i => ({ ...i, expectedQty: matMap[i.itemCode] || 0 }));
    }
  };

  const setInput = (loc, itemCode, value) => {
    setLocationActuals(prev => ({
      ...prev,
      [loc]: { ...(prev[loc] || {}), [itemCode]: value },
    }));
  };

  const isLocDone = loc => {
    const items = getLocationItems(loc);
    return items.length > 0 && items.every(i => {
      const v = locationActuals[loc]?.[i.itemCode];
      return v !== undefined && v !== '';
    });
  };

  const doneCount = allLocations.filter(isLocDone).length;
  const activeItems = effectiveLocation ? getLocationItems(effectiveLocation) : [];

  return (
    <div className="space-y-3">
      {/* ロケーション選択 */}
      <div className="card py-3 space-y-2">
        <div className="flex items-center gap-2 flex-wrap">
          <span className="text-xs font-semibold text-slate-500 shrink-0 w-24">メイン倉庫</span>
          {mainLocations.map(loc => (
            <button key={loc} onClick={() => setActiveLocation(loc)}
              className={`px-3 py-1 rounded-lg text-xs font-bold border transition-colors ${
                effectiveLocation === loc
                  ? 'bg-slate-700 text-white border-slate-700'
                  : isLocDone(loc)
                    ? 'bg-green-100 text-green-700 border-green-300'
                    : 'bg-white text-slate-600 border-slate-200 hover:bg-slate-50'
              }`}
            >
              {isLocDone(loc) ? '✓ ' : ''}{loc}
            </button>
          ))}
        </div>
        {machineSubLocations.length > 0 && (
          <div className="flex items-center gap-2 flex-wrap">
            <span className="text-xs font-semibold text-slate-500 shrink-0 w-24">機械サブロケ</span>
            {machineSubLocations.map(loc => (
              <button key={loc} onClick={() => setActiveLocation(loc)}
                className={`px-3 py-1 rounded-lg text-xs font-bold border transition-colors ${
                  effectiveLocation === loc
                    ? 'bg-blue-700 text-white border-blue-700'
                    : isLocDone(loc)
                      ? 'bg-green-100 text-green-700 border-green-300'
                      : 'bg-white text-blue-600 border-blue-200 hover:bg-blue-50'
                }`}
              >
                {isLocDone(loc) ? '✓ ' : '⚙️ '}{loc}
              </button>
            ))}
          </div>
        )}
        <div className="flex items-center gap-2 pt-1 border-t border-slate-100">
          <div className="flex-1 bg-slate-100 rounded-full h-2">
            <div
              className="bg-green-500 h-2 rounded-full transition-all"
              style={{ width: allLocations.length ? `${(doneCount / allLocations.length) * 100}%` : '0%' }}
            />
          </div>
          <span className="text-xs text-slate-500">{doneCount}/{allLocations.length} ロケーション完了</span>
        </div>
      </div>

      {/* 選択ロケーションの品目一覧 */}
      {effectiveLocation && (
        <div className="card p-0 overflow-hidden">
          <div className="px-5 py-3 border-b border-slate-100 flex items-center justify-between">
            <div>
              <h3 className="font-bold text-slate-800 text-base">
                {isMainLoc(effectiveLocation) ? '🏛️ メイン倉庫' : '⚙️ 機械サブロケ'} ― {effectiveLocation}
              </h3>
              <p className="text-xs text-slate-400 mt-0.5">
                {isMainLoc(effectiveLocation)
                  ? `棚番 ${effectiveLocation} の品目を実測してください`
                  : `${effectiveLocation} 機の使用中材料を実測してください`}
              </p>
            </div>
            <span className={`text-xs font-bold px-3 py-1.5 rounded-full ${
              isLocDone(effectiveLocation)
                ? 'bg-green-100 text-green-700'
                : 'bg-yellow-100 text-yellow-700'
            }`}>
              {isLocDone(effectiveLocation) ? '✅ 計測完了' : '📋 計測中'}
            </span>
          </div>

          <table className="w-full text-sm">
            <thead className="bg-slate-50 border-b border-slate-100">
              <tr>
                <th className="text-left py-2.5 px-5 text-xs font-medium text-slate-500 w-24">品目コード</th>
                <th className="text-left py-2.5 px-3 text-xs font-medium text-slate-500">品目名</th>
                <th className="text-center py-2.5 px-3 text-xs font-medium text-slate-500 w-14">単位</th>
                <th className="text-right py-2.5 px-4 text-xs font-medium text-slate-500 w-28">理論数量</th>
                <th className="text-right py-2.5 px-4 text-xs font-medium text-slate-500 w-36">実数量（入力）</th>
                <th className="text-right py-2.5 px-4 text-xs font-medium text-slate-500 w-24">差異</th>
              </tr>
            </thead>
            <tbody>
              {activeItems.map(item => {
                const inputVal = locationActuals[effectiveLocation]?.[item.itemCode];
                const hasInput = inputVal !== undefined && inputVal !== '';
                const diff = hasInput ? item.expectedQty - Number(inputVal) : null;
                return (
                  <tr key={item.id} className={`border-b border-slate-50 ${hasInput && diff !== 0 ? 'bg-orange-50' : ''}`}>
                    <td className="py-3 px-5 font-mono text-xs text-slate-500">{item.itemCode}</td>
                    <td className="py-3 px-3 font-medium text-slate-800">{item.itemName}</td>
                    <td className="py-3 px-3 text-center text-slate-500 text-xs">{item.unit}</td>
                    <td className="py-3 px-4 text-right font-mono text-slate-700 font-semibold">
                      {item.expectedQty.toLocaleString()}
                    </td>
                    <td className="py-3 px-4">
                      <div className="flex items-center justify-end gap-1.5">
                        <input
                          type="number"
                          disabled={approved}
                          value={inputVal !== undefined ? inputVal : ''}
                          onChange={e => setInput(effectiveLocation, item.itemCode, e.target.value)}
                          placeholder="実測値"
                          className={`w-24 border rounded px-2 py-1 text-right text-sm font-mono focus:outline-none focus:ring-2 focus:ring-blue-400 ${
                            approved ? 'bg-slate-50 cursor-not-allowed border-slate-200' :
                            hasInput && diff !== 0 ? 'border-orange-400 bg-orange-50' :
                            hasInput ? 'border-green-400 bg-green-50' :
                            'border-slate-300'
                          }`}
                        />
                        <span className="text-xs text-slate-400">{item.unit}</span>
                      </div>
                    </td>
                    <td className="py-3 px-4 text-right font-mono font-bold">
                      {diff === null
                        ? <span className="text-slate-300">—</span>
                        : diff === 0
                          ? <span className="text-green-600">±0</span>
                          : <span className={Math.abs(diff) > 20 ? 'text-red-600' : 'text-orange-500'}>
                              {diff > 0 ? '+' : ''}{diff.toLocaleString()}
                            </span>
                      }
                    </td>
                  </tr>
                );
              })}
              {activeItems.length === 0 && (
                <tr>
                  <td colSpan={6} className="py-8 text-center text-slate-400 text-sm">
                    このロケーションに材料が割り付けられていません
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>
      )}
    </div>
  );
}

// ─── QRラベル印刷 ──────────────────────────────────────────────
async function openLabelPrintWindow(selectedItems, shelfNumbers) {
  const labelsData = await Promise.all(
    selectedItems.map(async (item) => {
      const qrDataUrl = await QRCode.toDataURL(item.itemCode, {
        width: 180,
        margin: 1,
        color: { dark: '#000000', light: '#FFFFFF' },
      });
      return { ...item, qrDataUrl, shelfNumber: shelfNumbers[item.id] || '' };
    })
  );

  const labelsHtml = labelsData.map(item => `
    <div class="label">
      <div class="label-top">
        <span class="company">杉田電線株式会社</span>
        <span class="date-printed">${new Date().toLocaleDateString('ja-JP')}</span>
      </div>
      <div class="label-body">
        <img src="${item.qrDataUrl}" class="qr" alt="QR" />
        <div class="label-info">
          <div class="item-code">${item.itemCode}</div>
          <div class="item-name">${item.itemName}</div>
          ${item.shelfNumber ? `<div class="shelf">棚番：${item.shelfNumber}</div>` : ''}
          <div class="unit-info">単位：${item.unit}</div>
        </div>
      </div>
    </div>
  `).join('');

  const html = `<!DOCTYPE html>
<html lang="ja">
<head>
<meta charset="UTF-8">
<title>棚卸ラベル出力</title>
<style>
  * { margin: 0; padding: 0; box-sizing: border-box; }
  body { font-family: 'MS Gothic', 'Hiragino Sans', 'Noto Sans JP', sans-serif; background: white; }
  .page { display: grid; grid-template-columns: repeat(2, 95mm); gap: 5mm; padding: 10mm; }
  .label {
    width: 95mm; height: 55mm;
    border: 0.5mm solid #444;
    border-radius: 2mm;
    padding: 3mm 3.5mm;
    display: flex;
    flex-direction: column;
    overflow: hidden;
    page-break-inside: avoid;
    break-inside: avoid;
  }
  .label-top {
    border-bottom: 0.3mm solid #ccc;
    padding-bottom: 1.5mm;
    margin-bottom: 1.5mm;
    display: flex;
    justify-content: space-between;
    align-items: center;
  }
  .company { font-size: 7pt; color: #555; font-weight: bold; }
  .date-printed { font-size: 6pt; color: #999; }
  .label-body { display: flex; gap: 3mm; align-items: center; flex: 1; }
  .qr { width: 34mm; height: 34mm; flex-shrink: 0; }
  .label-info { flex: 1; overflow: hidden; }
  .item-code { font-size: 13pt; font-family: 'Courier New', monospace; font-weight: bold; color: #000; letter-spacing: 0.05em; }
  .item-name { font-size: 8pt; color: #222; margin-top: 1.5mm; line-height: 1.4; word-break: break-all; }
  .shelf { font-size: 8.5pt; color: #167a1a; margin-top: 2mm; font-weight: bold; }
  .unit-info { font-size: 7pt; color: #888; margin-top: 1.5mm; }
  @media print {
    @page { size: A4; margin: 0; }
    body { margin: 0; }
    .page { padding: 8mm; }
  }
</style>
</head>
<body>
<div class="page">${labelsHtml}</div>
<script>
  window.addEventListener('load', function() {
    setTimeout(function() { window.print(); }, 400);
  });
</script>
</body>
</html>`;

  const w = window.open('', '_blank', 'width=850,height=700');
  if (!w) {
    alert('ポップアップがブロックされました。ブラウザの設定でポップアップを許可してください。');
    return;
  }
  w.document.write(html);
  w.document.close();
}

function LabelPrintModal({ inventory, materialShelfAssignment, onClose }) {
  const [selected, setSelected] = useState(() => {
    const s = {};
    inventory.forEach(item => { s[item.id] = true; });
    return s;
  });
  const [shelfNumbers, setShelfNumbers] = useState(() => {
    const s = {};
    inventory.forEach(item => {
      if (materialShelfAssignment?.[item.itemCode]) {
        s[item.id] = materialShelfAssignment[item.itemCode];
      }
    });
    return s;
  });
  const [generating, setGenerating] = useState(false);

  const toggleAll = (val) => {
    const s = {};
    inventory.forEach(item => { s[item.id] = val; });
    setSelected(s);
  };

  const selectedItems = inventory.filter(item => selected[item.id]);

  const handlePrint = async () => {
    if (selectedItems.length === 0) {
      alert('印刷する品目を選択してください。');
      return;
    }
    setGenerating(true);
    try {
      await openLabelPrintWindow(selectedItems, shelfNumbers);
    } catch (e) {
      alert('ラベル生成に失敗しました: ' + e.message);
    } finally {
      setGenerating(false);
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 p-4">
      <div className="bg-white rounded-2xl shadow-2xl w-full max-w-2xl max-h-[90vh] flex flex-col">
        <div className="flex items-center justify-between px-6 py-4 border-b border-slate-100">
          <div>
            <h3 className="font-bold text-slate-800 text-lg">🏷️ 棚卸ラベル出力</h3>
            <p className="text-xs text-slate-400 mt-0.5">
              印刷する品目を選択 → QRコード付き棚ラベルをA4出力します
            </p>
          </div>
          <button
            onClick={onClose}
            className="w-8 h-8 flex items-center justify-center rounded-full hover:bg-slate-100 text-slate-500 text-xl leading-none"
          >✕</button>
        </div>

        <div className="px-6 py-2 border-b border-slate-100 flex items-center gap-3">
          <button onClick={() => toggleAll(true)} className="text-xs text-blue-600 hover:underline">全選択</button>
          <span className="text-slate-300">|</span>
          <button onClick={() => toggleAll(false)} className="text-xs text-slate-500 hover:underline">全解除</button>
          <span className="text-xs text-slate-400 ml-auto">
            {selectedItems.length}件 選択中 / {Math.ceil(selectedItems.length / 2)}ページ
          </span>
        </div>

        <div className="flex-1 overflow-y-auto">
          <table className="w-full text-sm">
            <thead className="sticky top-0 bg-slate-50 border-b border-slate-200">
              <tr className="text-xs text-slate-500">
                <th className="text-left py-2 px-4 w-10">選択</th>
                <th className="text-left py-2 px-2 w-20">品目コード</th>
                <th className="text-left py-2 px-2">品目名</th>
                <th className="text-left py-2 px-2 w-14">単位</th>
                <th className="text-left py-2 px-2 w-32">棚番号（任意）</th>
              </tr>
            </thead>
            <tbody>
              {inventory.map(item => (
                <tr key={item.id} className="border-b border-slate-50 hover:bg-slate-50">
                  <td className="py-2 px-4">
                    <input
                      type="checkbox"
                      checked={!!selected[item.id]}
                      onChange={e => setSelected(s => ({ ...s, [item.id]: e.target.checked }))}
                      className="w-4 h-4 rounded accent-blue-600"
                    />
                  </td>
                  <td className="py-2 px-2 font-mono text-xs text-slate-600">{item.itemCode}</td>
                  <td className="py-2 px-2 text-slate-700 text-xs">{item.itemName}</td>
                  <td className="py-2 px-2 text-slate-400 text-xs">{item.unit}</td>
                  <td className="py-2 px-2">
                    <input
                      type="text"
                      value={shelfNumbers[item.id] || ''}
                      onChange={e => setShelfNumbers(s => ({ ...s, [item.id]: e.target.value }))}
                      placeholder="例: A-1"
                      className="w-full border border-slate-200 rounded px-2 py-1 text-xs font-mono focus:outline-none focus:ring-1 focus:ring-blue-400"
                    />
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>

        <div className="px-6 py-4 border-t border-slate-100 flex items-center justify-between gap-3">
          <p className="text-xs text-slate-400">
            ※ QRコードは品目コード（M001等）をエンコード。スキャン棚卸と連携します。
          </p>
          <div className="flex gap-2 shrink-0">
            <button onClick={onClose} className="btn-secondary text-sm">キャンセル</button>
            <button
              onClick={handlePrint}
              disabled={generating || selectedItems.length === 0}
              className="btn-primary text-sm flex items-center gap-1.5 disabled:opacity-50"
            >
              {generating ? '⏳ 生成中...' : `🖨️ ${selectedItems.length}件を印刷`}
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}

// ─── メインコンポーネント ──────────────────────────────────────
// No.13 工程フィルタ用定数
const INVENTORY_PROCESSES = ['全工程', '押出', '撚線', '編組', '加工', '倉庫'];
const PROCESS_MATERIAL_KEYWORDS = {
  '押出':  ['CV','PVC','絶縁','シース','コンパウンド','ポリ'],
  '撚線':  ['導体','銅','アルミ','撚線'],
  '編組':  ['編組','銅線','テープ'],
  '加工':  ['付属','コネクタ','スリーブ','端子'],
  '倉庫':  [],
};

export default function Inventory() {
  const { inventory, setInventory, materialIssuances,
          materialShelfAssignment, subLocationQty } = useApp();
  const [inputValues, setInputValues] = useState({});
  const [anomalyWarnings, setAnomalyWarnings] = useState({});
  const [period] = useState('2026年5月度');
  const [approved, setApproved] = useState(false);
  const [showScanMode, setShowScanMode] = useState(false);
  const [showLabelModal, setShowLabelModal] = useState(false);
  const [processFilter, setProcessFilter] = useState('全工程');
  const [viewMode, setViewMode] = useState('total'); // 'total' | 'location'
  const [locationActuals, setLocationActuals] = useState({});
  const [activeLocation, setActiveLocation] = useState(null); // ロケーション別ビューの選択位置

  // ロケーション一覧（メイン倉庫 + 機械サブロケ）
  const mainLocations = useMemo(
    () => [...new Set(Object.values(materialShelfAssignment))].sort(),
    [materialShelfAssignment]
  );
  const machineSubLocations = useMemo(
    () => Object.keys(subLocationQty)
      .filter(id => Object.values(subLocationQty[id]).some(v => v > 0))
      .sort(),
    [subLocationQty]
  );
  const allLocations = useMemo(
    () => [...mainLocations, ...machineSubLocations],
    [mainLocations, machineSubLocations]
  );

  // No.13 工程フィルタ適用
  const currentMonthStart = '2026-05-01';
  const currentMonthEnd   = '2026-05-31';
  const issuedThisMonthIds = new Set(
    (materialIssuances || [])
      .filter(iss => iss.issuedDate >= currentMonthStart && iss.issuedDate <= currentMonthEnd)
      .map(iss => iss.materialId)
  );
  const filteredInventory = processFilter === '全工程'
    ? inventory
    : inventory.filter(item => {
        const kws = PROCESS_MATERIAL_KEYWORDS[processFilter] || [];
        if (kws.length === 0) return true;
        return kws.some(kw => item.itemName.includes(kw) || (item.itemCode || '').includes(kw));
      });

  const totalEval = inventory.reduce((sum, item) => {
    const actual = inputValues[item.id] !== undefined ? Number(inputValues[item.id]) : item.actualStock;
    return sum + (actual !== null && actual !== '' ? actual * item.latestPurchasePrice : 0);
  }, 0);

  const handleInput = (id, value) => {
    setInputValues(v => ({ ...v, [id]: value }));
    const item = inventory.find(i => i.id === id);
    if (item && value !== '') {
      const testItem = { ...item, actualStock: Number(value) };
      const warning = detectAnomaly(testItem, item.previousActual);
      setAnomalyWarnings(w => ({ ...w, [id]: warning }));
    } else {
      setAnomalyWarnings(w => ({ ...w, [id]: null }));
    }
  };

  const handleSaveAll = () => {
    setInventory(inv => inv.map(item => {
      const actual = getActual(item);
      if (actual === null || actual === '' || actual === undefined) return item;
      return { ...item, actualStock: Number(actual) };
    }));
    setInputValues({});
    setLocationActuals({});
  };

  const getActual = (item) => {
    // ロケーション別入力が1件でもあれば合算
    const hasLocInput = allLocations.some(loc => {
      const v = locationActuals[loc]?.[item.itemCode];
      return v !== undefined && v !== '';
    });
    if (hasLocInput) {
      return allLocations.reduce((sum, loc) => {
        const v = locationActuals[loc]?.[item.itemCode];
        return sum + (v !== undefined && v !== '' ? Number(v) : 0);
      }, 0);
    }
    if (inputValues[item.id] !== undefined) return inputValues[item.id];
    return item.actualStock;
  };

  // スキャンモーダル用: 現在のロケーション選択に応じてフィルタした在庫リスト
  const activeMachineLocation = useMemo(() => {
    if (viewMode === 'location' && activeLocation && machineSubLocations.includes(activeLocation)) {
      return activeLocation;
    }
    return null;
  }, [viewMode, activeLocation, machineSubLocations]);

  const scanInventory = useMemo(() => {
    if (!activeMachineLocation) return inventory;
    const matMap = subLocationQty[activeMachineLocation] || {};
    return inventory.filter(i => (matMap[i.itemCode] || 0) > 0);
  }, [activeMachineLocation, inventory, subLocationQty]);

  // スキャン入力値: サブロケ選択中は locationActuals を参照
  const scanInputValues = useMemo(() => {
    if (!activeMachineLocation) return inputValues;
    const result = {};
    inventory.forEach(item => {
      const v = locationActuals[activeMachineLocation]?.[item.itemCode];
      if (v !== undefined) result[item.id] = v;
    });
    return result;
  }, [activeMachineLocation, locationActuals, inputValues, inventory]);

  // スキャン入力ハンドラ: サブロケ選択中は locationActuals に書き込む
  const handleScanInput = (itemId, value) => {
    if (activeMachineLocation) {
      const item = inventory.find(i => i.id === itemId);
      if (!item) return;
      setLocationActuals(prev => ({
        ...prev,
        [activeMachineLocation]: { ...(prev[activeMachineLocation] || {}), [item.itemCode]: value },
      }));
      const testItem = { ...item, actualStock: Number(value) };
      const warning = detectAnomaly(testItem, item.previousActual);
      setAnomalyWarnings(w => ({ ...w, [item.id]: warning }));
    } else {
      handleInput(itemId, value);
    }
  };

  // 品目のロケーション内訳（全体集計ビューの補足表示用）
  const getLocationBreakdown = (itemCode) => {
    const result = [];
    const shelf = materialShelfAssignment[itemCode];
    if (shelf) {
      const subTotal = machineSubLocations.reduce((s, mac) =>
        s + (subLocationQty[mac]?.[itemCode] || 0), 0);
      const item = inventory.find(i => i.itemCode === itemCode);
      const mainQty = item ? Math.max(0, item.theoreticalStock - subTotal) : 0;
      result.push({ loc: shelf, qty: mainQty, type: 'main' });
    }
    machineSubLocations.forEach(mac => {
      const qty = subLocationQty[mac]?.[itemCode] || 0;
      if (qty > 0) result.push({ loc: mac, qty, type: 'machine' });
    });
    return result;
  };

  const getVariance = (item) => {
    const actual = getActual(item);
    if (actual === null || actual === '') return null;
    return item.theoreticalStock - Number(actual);
  };

  const getRowStyle = (item) => {
    const actual = getActual(item);
    const warn = anomalyWarnings[item.id];
    if (warn) return 'bg-red-50 border-l-4 border-red-400';
    if (actual === null || actual === '') return 'bg-yellow-50';
    const variance = getVariance(item);
    if (variance !== null && Math.abs(variance) > 20) return 'bg-orange-50';
    return '';
  };

  return (
    <div className="space-y-4">
      {/* ヘッダー */}
      <div className="card">
        <div className="flex items-center justify-between flex-wrap gap-3">
          <div>
            <h2 className="text-lg font-bold text-slate-800">実地棚卸 — {period}</h2>
            <p className="text-sm text-slate-500 mt-1">
              理論在庫と実在庫を照合します。差異品目は自動ハイライト表示されます。
            </p>
          </div>
          <div className="flex items-center gap-2 flex-wrap">
            <button
              onClick={() => setShowLabelModal(true)}
              className="flex items-center gap-1.5 px-3 py-2 rounded-lg border border-slate-200 bg-white text-slate-600 text-sm font-semibold hover:bg-slate-50 transition-colors"
            >
              🏷️ ラベル出力
            </button>
            {!approved && (
              <button
                onClick={() => setShowScanMode(true)}
                className="flex items-center gap-1.5 px-3 py-2 rounded-lg border border-blue-200 bg-blue-50 text-blue-700 text-sm font-semibold hover:bg-blue-100 transition-colors"
              >
                📷 スキャン入力
              </button>
            )}
            {!approved ? (
              <>
                <button onClick={handleSaveAll} className="btn-primary text-sm">
                  💾 入力値を保存
                </button>
                <button
                  onClick={() => {
                    const hasNull = inventory.some(i => getActual(i) === null || getActual(i) === '');
                    if (hasNull) { alert('未入力の項目があります。すべて入力してから承認してください。'); return; }
                    setApproved(true);
                  }}
                  className="bg-green-600 text-white px-4 py-2 rounded-lg text-sm font-medium hover:bg-green-700"
                >
                  ✅ 承認・確定
                </button>
              </>
            ) : (
              <span className="badge bg-green-100 text-green-700 text-sm px-4 py-2">承認済み ✅</span>
            )}
          </div>
        </div>
      </div>

      {/* 表示モード切替 */}
      <div className="card py-2.5">
        <div className="flex items-center gap-3">
          <span className="text-xs font-semibold text-slate-500">表示モード：</span>
          <div className="flex gap-1 bg-slate-100 p-0.5 rounded-lg">
            <button
              onClick={() => setViewMode('total')}
              className={`px-4 py-1.5 rounded-md text-xs font-bold transition-colors ${
                viewMode === 'total' ? 'bg-white text-slate-700 shadow-sm' : 'text-slate-500 hover:text-slate-700'
              }`}
            >
              📊 全体集計
            </button>
            <button
              onClick={() => setViewMode('location')}
              className={`px-4 py-1.5 rounded-md text-xs font-bold transition-colors ${
                viewMode === 'location' ? 'bg-white text-slate-700 shadow-sm' : 'text-slate-500 hover:text-slate-700'
              }`}
            >
              🗺️ ロケーション別
            </button>
          </div>
          {viewMode === 'total' && (
            <div className="flex items-center gap-2 ml-2">
              <span className="text-xs font-medium text-slate-600">工程：</span>
              {INVENTORY_PROCESSES.map(p => (
                <button key={p} onClick={() => setProcessFilter(p)}
                  className={`px-2.5 py-1 rounded-lg text-xs font-semibold transition-colors border ${processFilter === p ? 'bg-slate-700 text-white border-slate-700' : 'bg-white text-slate-600 border-slate-200 hover:bg-slate-50'}`}>
                  {p}
                </button>
              ))}
              <span className="text-xs text-slate-400 ml-1">{filteredInventory.length}品目</span>
            </div>
          )}
        </div>
      </div>

      {/* ロケーション別ビュー */}
      {viewMode === 'location' && (
        <LocationView
          inventory={inventory}
          mainLocations={mainLocations}
          machineSubLocations={machineSubLocations}
          materialShelfAssignment={materialShelfAssignment}
          subLocationQty={subLocationQty}
          locationActuals={locationActuals}
          setLocationActuals={setLocationActuals}
          approved={approved}
          activeLocation={activeLocation}
          setActiveLocation={setActiveLocation}
        />
      )}

      {/* 全体集計ビュー */}
      {viewMode === 'total' && <>
      {/* 凡例 */}
      <div className="flex gap-4 text-xs text-slate-500 flex-wrap">
        <span className="flex items-center gap-1.5"><span className="w-4 h-4 rounded bg-red-100 border-l-4 border-red-400 inline-block" />異常値検知（要確認）</span>
        <span className="flex items-center gap-1.5"><span className="w-4 h-4 rounded bg-orange-50 inline-block border" />差異あり</span>
        <span className="flex items-center gap-1.5"><span className="w-4 h-4 rounded bg-yellow-50 inline-block border" />未入力</span>
        <span className="flex items-center gap-1.5"><span className="w-4 h-4 rounded bg-slate-100 inline-block border opacity-60" />当月出庫なし</span>
      </div>

      {/* テーブル */}
      <div className="card p-0 overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full text-sm">
            <thead className="bg-slate-50 border-b border-slate-200">
              <tr>
                {['品目コード', '品目名', '単位', '前月在庫', '受入数量', '出庫数量', '理論在庫', 'ロケーション内訳', '実在庫（入力）', '在庫差異', '直近仕入単価', '棚卸評価額'].map(h => (
                  <th key={h} className="text-left py-3 px-3 text-xs font-medium text-slate-500 whitespace-nowrap">{h}</th>
                ))}
              </tr>
            </thead>
            <tbody>
              {filteredInventory.map(item => {
                const actual = getActual(item);
                const variance = getVariance(item);
                const evalAmt = actual !== null && actual !== '' ? Number(actual) * item.latestPurchasePrice : 0;
                const warning = anomalyWarnings[item.id];
                // No.13 当月出庫なし（非動材料）グレーアウト
                const isInactive = !issuedThisMonthIds.has(item.id);
                const rowClass = getRowStyle(item) || (isInactive ? 'bg-slate-50 opacity-60' : '');

                return (
                  <>
                    <tr key={item.id} className={`border-b border-slate-100 ${rowClass}`}>
                      <td className="py-3 px-3 font-mono text-xs text-slate-500">{item.itemCode}</td>
                      <td className="py-3 px-3 font-medium text-slate-800 whitespace-nowrap">{item.itemName}</td>
                      <td className="py-3 px-3 text-slate-500">{item.unit}</td>
                      <td className="py-3 px-3 text-right font-mono">{item.previousStock.toLocaleString()}</td>
                      <td className="py-3 px-3 text-right font-mono text-blue-600">+{item.receivedQty.toLocaleString()}</td>
                      <td className="py-3 px-3 text-right font-mono text-red-500">-{item.usedQty.toLocaleString()}</td>
                      <td className="py-3 px-3 text-right font-mono font-medium text-slate-700">
                        {item.theoreticalStock.toLocaleString()}
                      </td>
                      <td className="py-3 px-3">
                        <div className="flex flex-col gap-0.5">
                          {getLocationBreakdown(item.itemCode).map(({ loc, qty, type }) => (
                            <span key={loc} className={`inline-flex items-center gap-1 text-xs px-1.5 py-0.5 rounded font-mono whitespace-nowrap ${
                              type === 'machine'
                                ? 'bg-blue-50 text-blue-700'
                                : 'bg-slate-100 text-slate-600'
                            }`}>
                              {type === 'machine' ? '⚙️' : '🏛️'} {loc}: {qty.toLocaleString()}
                            </span>
                          ))}
                        </div>
                      </td>
                      <td className="py-3 px-3">
                        <input
                          type="number"
                          disabled={approved}
                          className={`w-24 border rounded px-2 py-1 text-right text-sm font-mono focus:outline-none focus:ring-2 focus:ring-blue-400 ${
                            warning ? 'border-red-400 bg-red-50 text-red-700 font-bold' :
                            actual === null || actual === '' ? 'border-yellow-300 bg-yellow-50' :
                            'border-slate-300'
                          } ${approved ? 'bg-slate-50 cursor-not-allowed' : ''}`}
                          value={actual === null ? '' : actual}
                          onChange={e => handleInput(item.id, e.target.value)}
                          placeholder="実測値"
                        />
                      </td>
                      <td className="py-3 px-3 text-right font-mono font-bold">
                        {variance === null ? (
                          <span className="text-slate-300">—</span>
                        ) : variance === 0 ? (
                          <span className="text-green-600">0</span>
                        ) : Math.abs(variance) > 20 ? (
                          <span className="text-red-600">{variance > 0 ? '+' : ''}{variance.toLocaleString()}</span>
                        ) : (
                          <span className="text-orange-500">{variance > 0 ? '+' : ''}{variance.toLocaleString()}</span>
                        )}
                      </td>
                      <td className="py-3 px-3 text-right font-mono">¥{item.latestPurchasePrice.toLocaleString()}</td>
                      <td className="py-3 px-3 text-right font-mono font-medium">
                        {evalAmt > 0 ? `¥${evalAmt.toLocaleString()}` : <span className="text-slate-300">—</span>}
                      </td>
                    </tr>
                    {warning && (
                      <tr key={`warn-${item.id}`} className="bg-red-50">
                        <td colSpan={12} className="py-1.5 px-3">
                          <div className="flex items-center gap-2 text-red-700 text-xs font-medium">
                            <span className="text-base">⚠️</span>
                            <span>【異常値検知】{item.itemName}：{warning}</span>
                          </div>
                        </td>
                      </tr>
                    )}
                  </>
                );
              })}
            </tbody>
            <tfoot className="bg-slate-50 border-t-2 border-slate-300">
              <tr>
                <td colSpan={11} className="py-3 px-3 text-sm font-bold text-slate-700 text-right">
                  棚卸評価額 合計
                </td>
                <td className="py-3 px-3 text-right font-bold text-lg text-blue-700">
                  ¥{totalEval.toLocaleString()}
                </td>
              </tr>
            </tfoot>
          </table>
        </div>
      </div>

      {/* 承認済みサマリ */}
      {approved && (
        <div className="card bg-green-50 border-green-200">
          <div className="flex items-center gap-3">
            <span className="text-3xl">✅</span>
            <div>
              <div className="font-bold text-green-800">{period} 棚卸 — 承認・確定済み</div>
              <div className="text-sm text-green-700 mt-0.5">
                棚卸評価額：¥{totalEval.toLocaleString()}　／
                差異品目：{inventory.filter(i => getVariance(i) !== null && getVariance(i) !== 0).length}件
              </div>
            </div>
          </div>
        </div>
      )}
      </>}

      {/* QRラベル印刷モーダル */}
      {showLabelModal && (
        <LabelPrintModal
          inventory={inventory}
          materialShelfAssignment={materialShelfAssignment}
          onClose={() => setShowLabelModal(false)}
        />
      )}

      {/* 棚卸スキャンモーダル */}
      {showScanMode && (
        <StocktakeScanModal
          inventory={scanInventory}
          inputValues={scanInputValues}
          onInput={handleScanInput}
          onClose={() => setShowScanMode(false)}
          filterLabel={activeMachineLocation}
        />
      )}
    </div>
  );
}
