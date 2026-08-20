import { useState } from 'react';
import { useApp } from '../context/AppContext';

const statusColors = {
  '相談中':    'bg-yellow-100 text-yellow-700',
  '見積提出済': 'bg-blue-100 text-blue-700',
  '受注確定':  'bg-green-100 text-green-700',
  '失注':      'bg-red-100 text-red-500',
};

// レガシーBOM形式の材料費計算（旧フォーマット互換）
function calcMaterialCost(bom, lossRate) {
  return bom.reduce((sum, b) => sum + b.requiredQty * b.standardPrice, 0) * lossRate;
}

// 新BOM形式でコスト計算（per 100m → per m に変換）
function calcBOMCostLocal(productId, productBOMs, materials, copperPrice) {
  const boms = productBOMs[productId] || [];
  const total = boms.reduce((sum, b) => {
    const mat = materials.find(m => m.id === b.materialId);
    if (!mat) return sum;
    const unitPrice = mat.isCopperBased
      ? mat.baseProcessingCost + mat.copperRatio * copperPrice
      : mat.standardPrice;
    return sum + b.qty * b.lossRate * unitPrice;
  }, 0);
  return total / 100; // 100m → 1m
}

const PROCESS_BADGE = {
  '撚線': 'bg-blue-100 text-blue-700',
  '編組': 'bg-purple-100 text-purple-700',
  '押出': 'bg-orange-100 text-orange-700',
  '加工': 'bg-green-100 text-green-700',
};

// ── 新規見積モーダル ────────────────────────────────────────────────
function NewQuoteModal({ quotes, products, customers, materials, productBOMs, copperPrice, onSubmit, onClose }) {
  const [form, setForm] = useState({
    customerCode: '',
    productCode: '',
    processingCost: '12',
    quotedPrice: '',
    status: '相談中',
  });

  const set = (key, val) => setForm(f => ({ ...f, [key]: val }));

  const filteredProducts = form.customerCode
    ? products.filter(p => p.customerCode === form.customerCode)
    : products;

  const selectedProduct = products.find(p => p.productCode === form.productCode);
  const bomEntries = selectedProduct ? (productBOMs[selectedProduct.id] || []) : [];

  // 工程別材料費（100m→m変換）
  const materialCost = bomEntries.reduce((sum, b) => {
    const mat = materials.find(m => m.id === b.materialId);
    if (!mat) return sum;
    const unitPrice = mat.isCopperBased
      ? mat.baseProcessingCost + mat.copperRatio * copperPrice
      : mat.standardPrice;
    return sum + b.qty * b.lossRate * unitPrice;
  }, 0) / 100;

  const totalCost = materialCost + Number(form.processingCost || 0);
  const margin = form.quotedPrice ? ((Number(form.quotedPrice) - totalCost) / Number(form.quotedPrice) * 100) : null;
  const canSubmit = form.customerCode && form.productCode && form.quotedPrice;

  const handleSubmit = () => {
    if (!canSubmit) return;
    const year = new Date().getFullYear();
    const num  = String(quotes.length + 1).padStart(3, '0');
    const customer = customers.find(c => c.code === form.customerCode);
    const product  = products.find(p => p.productCode === form.productCode);
    // レガシー互換 bom フィールド（旧形式で保存）
    const legacyBom = bomEntries.map(b => {
      const mat = materials.find(m => m.id === b.materialId) || {};
      const unitPrice = mat.isCopperBased
        ? mat.baseProcessingCost + mat.copperRatio * copperPrice
        : mat.standardPrice || 0;
      return {
        materialId:   b.materialId,
        materialCode: mat.code || b.materialId,
        materialName: mat.name || b.materialId,
        requiredQty:  b.qty / 100,
        standardPrice: unitPrice,
        process: b.process,
        lossRate: b.lossRate,
      };
    });
    onSubmit({
      id:              `Q${Date.now()}`,
      quoteNumber:     `Q${year}-${num}`,
      productCode:     product.productCode,
      productId:       product.id,
      productName:     product.name,
      customerCode:    customer.code,
      customerName:    customer.name,
      copperBasePrice: copperPrice,
      bom:             legacyBom,
      lossRate:        1.0,  // lossRate already factored into bom entries
      processingCost:  Number(form.processingCost),
      quotedPrice:     Number(form.quotedPrice),
      status:          form.status,
      createdDate:     new Date().toISOString().slice(0, 10),
    });
  };

  // 工程グループ集計
  const processSummary = ['撚線', '編組', '押出', '加工'].map(proc => {
    const items = bomEntries.filter(b => b.process === proc);
    if (!items.length) return null;
    const cost = items.reduce((sum, b) => {
      const mat = materials.find(m => m.id === b.materialId);
      if (!mat) return sum;
      const up = mat.isCopperBased ? mat.baseProcessingCost + mat.copperRatio * copperPrice : mat.standardPrice;
      return sum + b.qty * b.lossRate * up;
    }, 0) / 100;
    return { process: proc, items, cost };
  }).filter(Boolean);

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 p-4">
      <div className="bg-white rounded-2xl shadow-2xl w-full max-w-lg p-6 space-y-4 max-h-[90vh] overflow-y-auto">
        <div className="flex items-center justify-between">
          <h2 className="text-lg font-bold text-slate-800">📝 新規見積作成</h2>
          <button onClick={onClose} className="text-slate-400 hover:text-slate-600 text-xl leading-none">✕</button>
        </div>

        {/* 顧客・製品 */}
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
          <div>
            <label className="block text-xs font-medium text-slate-600 mb-1">顧客 <span className="text-red-500">*</span></label>
            <select className="select-field w-full" value={form.customerCode}
              onChange={e => set('customerCode', e.target.value)}>
              <option value="">-- 選択 --</option>
              {customers.map(c => <option key={c.code} value={c.code}>{c.name}</option>)}
            </select>
          </div>
          <div>
            <label className="block text-xs font-medium text-slate-600 mb-1">製品 <span className="text-red-500">*</span></label>
            <select className="select-field w-full" value={form.productCode}
              onChange={e => set('productCode', e.target.value)}>
              <option value="">-- 選択 --</option>
              {filteredProducts.map(p => <option key={p.productCode} value={p.productCode}>{p.name}</option>)}
            </select>
          </div>
        </div>

        {/* BOM プレビュー（工程別） */}
        {processSummary.length > 0 && (
          <div className="bg-slate-50 rounded-lg p-3 text-xs space-y-2">
            <div className="font-medium text-slate-600">工程別BOM（銅価格: ¥{copperPrice.toLocaleString()}/kg）</div>
            {processSummary.map(g => (
              <div key={g.process} className="space-y-0.5">
                <div className="flex items-center gap-1.5 font-medium text-slate-700">
                  <span className={`px-1.5 py-0.5 rounded text-xs ${PROCESS_BADGE[g.process] || 'bg-slate-100 text-slate-600'}`}>{g.process}</span>
                  <span className="ml-auto text-slate-500">¥{g.cost.toFixed(2)}/m</span>
                </div>
                {g.items.map((b, i) => {
                  const mat = materials.find(m => m.id === b.materialId);
                  return (
                    <div key={i} className="flex justify-between text-slate-500 pl-3">
                      <span>{mat?.name || b.materialId}</span>
                      <span className="font-mono">{b.qty.toFixed(2)}kg × {b.lossRate}</span>
                    </div>
                  );
                })}
              </div>
            ))}
            <div className="border-t border-slate-200 pt-1.5 flex justify-between font-semibold text-slate-800">
              <span>材料費合計</span>
              <span>¥{materialCost.toFixed(2)}/m</span>
            </div>
          </div>
        )}
        {bomEntries.length === 0 && form.productCode && (
          <div className="text-xs text-amber-600 bg-amber-50 rounded-lg p-3">
            ⚠️ このBOM未登録の製品です。①製品マスター &gt; BOM管理で登録してください。
          </div>
        )}

        {/* 加工費 / 売価 */}
        <div className="grid grid-cols-2 gap-3">
          <div>
            <label className="block text-xs font-medium text-slate-600 mb-1">加工費（円/m）</label>
            <input type="number" className="input-field w-full" value={form.processingCost}
              onChange={e => set('processingCost', e.target.value)} />
          </div>
          <div>
            <label className="block text-xs font-medium text-slate-600 mb-1">
              見積売価（円/m）<span className="text-red-500">*</span>
            </label>
            <input type="number" className="input-field w-full"
              placeholder={totalCost > 0 ? `推奨 ¥${Math.ceil(totalCost / 0.85)}以上` : '例: 140'}
              value={form.quotedPrice} onChange={e => set('quotedPrice', e.target.value)} />
          </div>
        </div>

        {/* 粗利率バッジ */}
        {margin !== null && (
          <div className={`text-xs px-3 py-2 rounded-lg font-medium ${
            margin < 10 ? 'bg-red-50 text-red-700 border border-red-200'
                        : 'bg-green-50 text-green-700 border border-green-200'
          }`}>
            粗利率: {margin.toFixed(1)}%
            {margin < 10 && '　⚠️ 10%を下回っています'}
          </div>
        )}

        {/* ステータス */}
        <div>
          <label className="block text-xs font-medium text-slate-600 mb-1">ステータス</label>
          <select className="select-field" value={form.status} onChange={e => set('status', e.target.value)}>
            {['相談中', '見積提出済', '受注確定'].map(s => <option key={s} value={s}>{s}</option>)}
          </select>
        </div>

        <div className="flex gap-3 pt-2">
          <button onClick={onClose} className="flex-1 btn-secondary">キャンセル</button>
          <button onClick={handleSubmit} disabled={!canSubmit}
            className="flex-1 btn-primary disabled:opacity-50 disabled:cursor-not-allowed">
            見積を作成
          </button>
        </div>
      </div>
    </div>
  );
}

// ── 受注登録モーダル（受注確定時に表示）────────────────────────────
function OrderFromQuoteModal({ quote, ordersCount, onSubmit, onSkip }) {
  const year = new Date().getFullYear();
  const orderNumber = `SO-${year}-${String(1000 + ordersCount + 1).padStart(4, '0')}`;

  const [form, setForm] = useState({
    totalQuantity:       '',
    finalDeadline:       '',
    arrangementDeadline: '',
    paidMaterialOffset:  '非対象',
  });

  const set = (key, val) => setForm(f => ({ ...f, [key]: val }));
  const canSubmit = form.totalQuantity && form.finalDeadline && form.arrangementDeadline;

  const handleSubmit = () => {
    if (!canSubmit) return;
    onSubmit({
      id:                  `O_${Date.now()}`,
      orderNumber,
      productCode:         quote.productCode,
      productId:           quote.productId,
      productName:         quote.productName,
      customerCode:        quote.customerCode,
      customerName:        quote.customerName,
      totalQuantity:       Number(form.totalQuantity),
      unit:                'm',
      finalDeadline:       form.finalDeadline,
      arrangementDeadline: form.arrangementDeadline,
      paidMaterialOffset:  form.paidMaterialOffset,
      status:              '照会（仮押さえ）',
      quoteId:             quote.id,
      shippingSchedule:    [],
    });
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 p-4">
      <div className="bg-white rounded-2xl shadow-2xl w-full max-w-md p-6 space-y-4">
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 bg-green-100 rounded-xl flex items-center justify-center text-xl">📦</div>
          <div>
            <h2 className="text-base font-bold text-slate-800">受注登録</h2>
            <p className="text-xs text-slate-500">見積 {quote.quoteNumber} が受注確定になりました</p>
          </div>
        </div>

        {/* 製品サマリ */}
        <div className="bg-blue-50 border border-blue-100 rounded-lg p-3 text-sm">
          <div className="font-semibold text-blue-800">{quote.productName}</div>
          <div className="text-blue-600 text-xs mt-0.5">
            {quote.customerName}　見積売価: ¥{quote.quotedPrice.toFixed(1)}/m
          </div>
        </div>

        {/* 受注番号 */}
        <div className="bg-slate-50 rounded-lg px-3 py-2 text-xs text-slate-600">
          受注番号（自動採番）:&nbsp;
          <span className="font-mono font-bold text-slate-800">{orderNumber}</span>
        </div>

        {/* 入力フィールド */}
        <div className="space-y-3">
          <div>
            <label className="block text-xs font-medium text-slate-600 mb-1">
              受注数量（m）<span className="text-red-500">*</span>
            </label>
            <input type="number" className="input-field w-full" placeholder="例: 5000"
              value={form.totalQuantity} onChange={e => set('totalQuantity', e.target.value)} />
          </div>
          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="block text-xs font-medium text-slate-600 mb-1">
                納期 <span className="text-red-500">*</span>
              </label>
              <input type="date" className="input-field w-full"
                value={form.finalDeadline} onChange={e => set('finalDeadline', e.target.value)} />
            </div>
            <div>
              <label className="block text-xs font-medium text-slate-600 mb-1">
                手配期限 <span className="text-red-500">*</span>
              </label>
              <input type="date" className="input-field w-full"
                value={form.arrangementDeadline} onChange={e => set('arrangementDeadline', e.target.value)} />
            </div>
          </div>
          <div>
            <label className="block text-xs font-medium text-slate-600 mb-1">有償支給材相殺</label>
            <select className="select-field w-full" value={form.paidMaterialOffset}
              onChange={e => set('paidMaterialOffset', e.target.value)}>
              <option value="非対象">非対象</option>
              <option value="対象">対象</option>
            </select>
          </div>
        </div>

        <div className="flex gap-3 pt-2">
          <button onClick={onSkip} className="flex-1 btn-secondary text-sm">後で入力する</button>
          <button onClick={handleSubmit} disabled={!canSubmit}
            className="flex-1 btn-primary text-sm disabled:opacity-50 disabled:cursor-not-allowed">
            受注登録する
          </button>
        </div>
      </div>
    </div>
  );
}

// ── メインコンポーネント ────────────────────────────────────────────
export default function QuoteManagement() {
  const {
    quotes, setQuotes,
    products, customers, materials, copperPrice,
    orders, setOrders, setActiveApp,
    productBOMs, supplierSettings, suppliers,
  } = useApp();

  const [selectedId,      setSelectedId]      = useState(quotes[0]?.id ?? null);
  const [editCopperPrice, setEditCopperPrice]  = useState(copperPrice);
  const [showNewQuote,    setShowNewQuote]     = useState(false);
  const [orderModal,      setOrderModal]       = useState(null); // quote object

  // selectedは常にquotesから最新を参照
  const selected = quotes.find(q => q.id === selectedId) ?? null;

  // 材料費計算: 製品BOMが存在する場合は新方式、なければ旧方式にフォールバック
  const materialCost = selected
    ? (selected.productId && productBOMs[selected.productId]?.length
        ? calcBOMCostLocal(selected.productId, productBOMs, materials, copperPrice)
        : calcMaterialCost(selected.bom || [], selected.lossRate))
    : 0;
  const totalCost   = materialCost + (selected?.processingCost ?? 0);
  const grossMargin = selected ? ((selected.quotedPrice - totalCost) / selected.quotedPrice * 100) : 0;

  // 銅価格変動シミュレーション
  const adjustedMaterialCost = selected
    ? (selected.productId && productBOMs[selected.productId]?.length
        ? calcBOMCostLocal(selected.productId, productBOMs, materials, editCopperPrice)
        : (() => {
            const copperRatio = editCopperPrice / (selected.copperBasePrice ?? 1280);
            return (selected.bom || []).reduce((sum, b) => {
              const adj = b.materialName.includes('銅導体') ? b.standardPrice * copperRatio : b.standardPrice;
              return sum + b.requiredQty * adj;
            }, 0) * selected.lossRate;
          })())
    : 0;

  // 見積書印刷
  const printQuote = () => {
    if (!selected) return;
    const mc   = materialCost;
    const tc   = mc + selected.processingCost;
    const prod = products.find(p => p.productCode === selected.productCode);
    const spec = prod?.spec
      ? `外径 ${prod.spec.outerDiameter.min}〜${prod.spec.outerDiameter.max} mm`
      : '—';
    const today = new Date().toLocaleDateString('ja-JP', { year: 'numeric', month: 'long', day: 'numeric' });
    // BOM行: 新方式優先
    const bomSource = selected.productId && productBOMs[selected.productId]?.length
      ? productBOMs[selected.productId].map((b, i) => {
          const mat = materials.find(m => m.id === b.materialId);
          const up = mat ? (mat.isCopperBased ? mat.baseProcessingCost + mat.copperRatio * copperPrice : mat.standardPrice) : 0;
          const cost = b.qty * b.lossRate * up / 100;
          return { name: mat?.name || b.materialId, qty: (b.qty / 100).toFixed(4) + ' kg/m', price: up, cost };
        })
      : (selected.bom || []).map(b => ({ name: b.materialName, qty: b.requiredQty.toFixed(3) + ' kg/m', price: b.standardPrice, cost: b.requiredQty * b.standardPrice }));
    const bomRows = bomSource.map((b, i) => `
      <tr>
        <td class="c">${i + 1}</td>
        <td>${b.name}</td>
        <td class="r">${b.qty}</td>
        <td class="r">¥${Math.round(b.price).toLocaleString()}</td>
        <td class="r">¥${b.cost.toFixed(2)}</td>
      </tr>`).join('');

    const html = `<!DOCTYPE html>
<html lang="ja"><head>
<meta charset="UTF-8">
<title>見積書 ${selected.quoteNumber}</title>
<style>
*{box-sizing:border-box;margin:0;padding:0}
body{font-family:'Yu Mincho','MS Mincho','Hiragino Mincho ProN',serif;font-size:11pt;color:#1a1a1a;background:#fff}
.page{width:210mm;min-height:297mm;margin:0 auto;padding:14mm 18mm}
h1{text-align:center;font-size:22pt;letter-spacing:10px;border-bottom:2.5px solid #1a1a1a;padding-bottom:5mm;margin-bottom:8mm}
.top{display:grid;grid-template-columns:1fr 1fr;gap:6mm;margin-bottom:7mm}
.recipient .co{font-size:17pt;font-weight:bold;border-bottom:1px solid #1a1a1a;padding-bottom:2mm;margin-top:2mm}
.meta td{padding:1mm 3mm;font-size:10pt}
.meta .lbl{color:#555}
.subject{padding:3mm 5mm;background:#f4f4f4;border-left:3px solid #333;margin-bottom:5mm;font-size:11pt}
table.t{width:100%;border-collapse:collapse;margin-bottom:4mm}
table.t th{background:#2a2a2a;color:#fff;padding:2.5mm 3mm;font-size:10pt;text-align:center}
table.t td{padding:2mm 3mm;border:1px solid #ccc;font-size:10pt}
table.t tr:nth-child(even) td{background:#f9f9f9}
.r{text-align:right}.c{text-align:center}
.sub td{background:#efefef!important;font-weight:bold}
.total{display:flex;justify-content:flex-end;margin:5mm 0}
.tb{border-collapse:collapse}
.tb td{padding:2.5mm 6mm;border:1px solid #aaa}
.tb .lbl{background:#f0f0f0;font-weight:bold}
.tb .gt{background:#1a1a1a;color:#fff;font-size:13pt;font-weight:bold}
.notes{border:1px solid #ccc;padding:4mm;font-size:9.5pt;margin-top:5mm}
.notes h4{font-size:10pt;margin-bottom:2mm}
.notes li{margin:1mm 0;padding-left:1mm}
.co-block{display:flex;justify-content:flex-end;margin-top:8mm}
.co-info{border:1px solid #ccc;padding:5mm 8mm;text-align:right;min-width:75mm;position:relative}
.seal{width:22mm;height:22mm;border:1px solid #bbb;border-radius:50%;position:absolute;top:6mm;right:8mm;display:flex;align-items:center;justify-content:center;font-size:8pt;color:#bbb}
.footer{margin-top:10mm;text-align:center;font-size:8pt;color:#888;border-top:1px solid #ddd;padding-top:3mm}
@media print{body{-webkit-print-color-adjust:exact;print-color-adjust:exact}.page{padding:10mm 14mm}}
</style></head>
<body><div class="page">
<h1>見　積　書</h1>
<div class="top">
  <div class="recipient">
    <div style="font-size:9pt;color:#666">お客様</div>
    <div class="co">${selected.customerName}　御中</div>
  </div>
  <div style="text-align:right">
    <table class="meta" style="margin-left:auto">
      <tr><td class="lbl">見積番号</td><td><strong>${selected.quoteNumber}</strong></td></tr>
      <tr><td class="lbl">発　行　日</td><td>${today}</td></tr>
      <tr><td class="lbl">有効期限</td><td>発行日より 30 日間</td></tr>
      <tr><td class="lbl">銅ベース単価</td><td>¥${selected.copperBasePrice.toLocaleString()}/kg</td></tr>
    </table>
  </div>
</div>
<div class="subject">件名：<strong>${selected.productName}</strong>　単価見積</div>

<table class="t">
  <thead><tr><th style="width:7%">No.</th><th style="width:32%">品　名</th><th style="width:25%">仕　様</th><th style="width:18%">単　価（税抜）</th><th style="width:18%">備　考</th></tr></thead>
  <tbody>
    <tr><td class="c">1</td><td><strong>${selected.productName}</strong></td><td>${spec}</td><td class="r"><strong>¥${selected.quotedPrice.toFixed(2)} / m</strong></td><td class="c">銅価格連動</td></tr>
  </tbody>
</table>

<p style="font-size:9.5pt;color:#555;margin-bottom:2mm">▼ 原価内訳（参考）</p>
<table class="t" style="font-size:9.5pt">
  <thead><tr><th>No.</th><th>材料名</th><th>必要量(kg/m)</th><th>標準単価(円/kg)</th><th>材料費(円/m)</th></tr></thead>
  <tbody>
    ${bomRows}
    <tr class="sub"><td colspan="4" class="r">材料費小計 × ロス率（${selected.lossRate}）</td><td class="r">¥${mc.toFixed(2)}</td></tr>
    <tr><td colspan="4" class="r">加工費</td><td class="r">¥${selected.processingCost.toFixed(2)}</td></tr>
    <tr class="sub"><td colspan="4" class="r">製造原価合計</td><td class="r">¥${tc.toFixed(2)}</td></tr>
  </tbody>
</table>

<div class="total">
  <table class="tb">
    <tr><td class="lbl">見積単価（税抜）</td><td class="r">¥${selected.quotedPrice.toFixed(2)} / m</td></tr>
    <tr><td class="lbl">消費税（10%）</td><td class="r">¥${(selected.quotedPrice * 0.1).toFixed(2)} / m</td></tr>
    <tr><td class="lbl gt">合計単価（税込）</td><td class="r gt">¥${(selected.quotedPrice * 1.1).toFixed(2)} / m</td></tr>
  </table>
</div>

<div class="notes">
  <h4>■ 見積条件・備考</h4>
  <ul>
    <li>本見積は発行日より30日間有効です。</li>
    <li>銅ベース単価 ¥${selected.copperBasePrice.toLocaleString()}/kg 時点の見積です。銅価格変動時は価格改定の可能性があります。</li>
    <li>消費税は別途申し受けます。</li>
    <li>納期・最低発注数量については別途ご相談ください。</li>
    <li>本見積書に記載の仕様・価格は予告なく変更される場合があります。</li>
  </ul>
</div>

<div class="co-block">
  <div class="co-info">
    <div class="seal">印</div>
    <div style="font-size:9pt;color:#666;margin-bottom:2mm">発　行　者</div>
    <div style="font-size:14pt;font-weight:bold">杉田電線株式会社</div>
    <div style="font-size:9pt;margin-top:2mm">担当：細野</div>
  </div>
</div>

<div class="footer">本見積書は杉田電線 基幹管理システムにより自動生成されました　見積番号：${selected.quoteNumber}</div>
</div>
<script>window.onload=()=>{window.print()}</script>
</body></html>`;

    const win = window.open('', '_blank', 'width=900,height=750,scrollbars=yes');
    if (win) { win.document.write(html); win.document.close(); }
  };

  // ステータス変更：受注確定になったら受注登録モーダルを表示
  const handleStatusChange = (quoteId, newStatus) => {
    setQuotes(qs => qs.map(q => q.id === quoteId ? { ...q, status: newStatus } : q));

    if (newStatus === '受注確定') {
      const quote = quotes.find(q => q.id === quoteId);
      const alreadyOrdered = orders.some(o => o.quoteId === quoteId);
      if (quote && !alreadyOrdered) setOrderModal(quote);
    }
  };

  // 新規見積作成
  const handleNewQuote = (newQuote) => {
    setQuotes(qs => [...qs, newQuote]);
    setSelectedId(newQuote.id);
    setShowNewQuote(false);
    // 新規見積が受注確定で作られた場合もモーダルを出す
    if (newQuote.status === '受注確定') {
      setOrderModal(newQuote);
    }
  };

  // 受注登録確定
  const handleCreateOrder = (newOrder) => {
    setOrders(os => [...os, newOrder]);
    setOrderModal(null);
  };

  // この見積に紐づく受注
  const linkedOrder = selected ? orders.find(o => o.quoteId === selected.id) : null;

  return (
    <div className="flex flex-col md:flex-row gap-4 md:gap-6">
      {/* 左：見積一覧 */}
      <div className="w-full md:w-72 md:flex-shrink-0 space-y-3">
        <div className="flex items-center justify-between">
          <span className="text-sm font-medium text-slate-700">見積一覧（{quotes.length}件）</span>
          <button className="btn-primary text-xs" onClick={() => setShowNewQuote(true)}>
            ＋ 新規見積
          </button>
        </div>

        {quotes.map(q => (
          <button
            key={q.id}
            onClick={() => setSelectedId(q.id)}
            className={`w-full text-left p-4 rounded-xl border transition-all ${
              selectedId === q.id
                ? 'border-blue-500 bg-blue-50 shadow-sm'
                : 'border-slate-200 bg-white hover:border-blue-300'
            }`}
          >
            <div className="flex items-center justify-between mb-1">
              <span className="font-mono text-xs text-slate-500">{q.quoteNumber}</span>
              <span className={`badge ${statusColors[q.status]}`}>{q.status}</span>
            </div>
            <div className="text-sm font-medium text-slate-800 truncate">{q.productName}</div>
            <div className="text-xs text-slate-500 mt-1">{q.customerName}</div>
            <div className="flex items-center justify-between mt-2">
              <span className="text-xs text-slate-400">{q.createdDate}</span>
              <span className="text-sm font-bold text-blue-700">¥{q.quotedPrice.toFixed(1)}/m</span>
            </div>
            {orders.some(o => o.quoteId === q.id) && (
              <div className="mt-1.5 text-xs text-green-700 bg-green-50 rounded px-2 py-0.5 text-center">
                ✅ 受注登録済
              </div>
            )}
          </button>
        ))}
      </div>

      {/* 右：詳細 */}
      {selected && (
        <div className="flex-1 min-w-0 space-y-4">
          {/* ヘッダー */}
          <div className="card">
            <div className="flex items-start justify-between flex-wrap gap-3">
              <div>
                <div className="flex items-center gap-3 flex-wrap">
                  <h2 className="text-lg font-bold text-slate-800">{selected.quoteNumber}</h2>
                  <span className={`badge ${statusColors[selected.status]}`}>{selected.status}</span>
                </div>
                <div className="text-slate-600 mt-1">{selected.productName}</div>
                <div className="text-slate-400 text-sm">{selected.customerName}　作成日：{selected.createdDate}</div>
              </div>
              <div className="flex gap-2 flex-wrap">
                <select
                  className="select-field text-xs"
                  value={selected.status}
                  onChange={e => handleStatusChange(selected.id, e.target.value)}
                >
                  {['相談中', '見積提出済', '受注確定', '失注'].map(s =>
                    <option key={s} value={s}>{s}</option>
                  )}
                </select>
                <button className="btn-secondary text-xs" onClick={printQuote}>🖨 見積書印刷</button>
              </div>
            </div>

            {/* 受注リンクバナー */}
            {linkedOrder && (
              <div className="mt-3 flex items-center gap-3 bg-green-50 border border-green-200 rounded-lg px-3 py-2 text-sm">
                <span className="text-green-600">✅</span>
                <div className="flex-1">
                  <span className="font-medium text-green-800">受注登録済：</span>
                  <span className="font-mono text-green-700">{linkedOrder.orderNumber}</span>
                  <span className="text-green-600 text-xs ml-2">
                    {linkedOrder.totalQuantity.toLocaleString()}m　納期 {linkedOrder.finalDeadline}
                  </span>
                </div>
                <button
                  onClick={() => setActiveApp('order')}
                  className="text-xs text-green-700 border border-green-300 rounded px-2 py-1 hover:bg-green-100"
                >
                  受注画面へ →
                </button>
              </div>
            )}

            {/* 受注確定だが未登録 */}
            {selected.status === '受注確定' && !linkedOrder && (
              <div className="mt-3 flex items-center gap-3 bg-amber-50 border border-amber-200 rounded-lg px-3 py-2 text-sm">
                <span>⚠️</span>
                <span className="flex-1 text-amber-800">受注がまだ登録されていません。</span>
                <button
                  onClick={() => setOrderModal(selected)}
                  className="text-xs bg-amber-600 text-white rounded px-3 py-1 hover:bg-amber-700"
                >
                  受注登録する
                </button>
              </div>
            )}
          </div>

          {/* 銅価格シミュレーション */}
          <div className="card bg-amber-50 border-amber-200">
            <div className="flex items-center gap-2 mb-3">
              <span className="text-amber-600 font-bold">🔔</span>
              <span className="font-semibold text-amber-800 text-sm">銅ベース価格 変動シミュレーション</span>
            </div>
            <div className="flex flex-wrap items-center gap-3 md:gap-4">
              <div>
                <div className="text-xs text-amber-700 mb-1">基準銅単価（見積時）</div>
                <div className="font-bold text-slate-700">¥{selected.copperBasePrice.toLocaleString()}/kg</div>
              </div>
              <span className="text-slate-400">→</span>
              <div>
                <div className="text-xs text-amber-700 mb-1">今月銅単価（シミュレーション）</div>
                <input
                  type="number"
                  className="input-field w-32 text-sm font-bold"
                  value={editCopperPrice}
                  onChange={e => setEditCopperPrice(Number(e.target.value))}
                />
              </div>
              <div className={`font-bold text-sm ${editCopperPrice > selected.copperBasePrice ? 'text-red-600' : 'text-green-600'}`}>
                {editCopperPrice > selected.copperBasePrice ? '▲' : '▼'}
                {Math.abs(((editCopperPrice / selected.copperBasePrice - 1) * 100)).toFixed(1)}%
              </div>
              <div className="ml-auto text-right">
                <div className="text-xs text-amber-700">調整後 材料費</div>
                <div className="font-bold text-lg text-amber-800">¥{adjustedMaterialCost.toFixed(2)}/m</div>
                <div className="text-xs text-amber-600">（元：¥{materialCost.toFixed(2)}/m）</div>
              </div>
            </div>
          </div>

          {/* BOM */}
          <div className="card">
            <h3 className="font-semibold text-slate-800 mb-3">必要材料（BOM）</h3>
            {selected.productId && productBOMs[selected.productId]?.length > 0 ? (
              // 新方式: 工程別表示
              <div className="overflow-x-auto">
                <table className="w-full text-sm">
                  <thead className="bg-slate-50">
                    <tr>
                      {['工程', '材料コード', '材料名', '使用量(kg/100m)', 'ロス係数', '単価(¥/kg)', '材料費(¥/m)'].map(h => (
                        <th key={h} className="text-left py-2 px-3 text-xs font-medium text-slate-500 whitespace-nowrap">{h}</th>
                      ))}
                    </tr>
                  </thead>
                  <tbody>
                    {productBOMs[selected.productId].map((b, i) => {
                      const mat = materials.find(m => m.id === b.materialId);
                      const unitPrice = mat
                        ? (mat.isCopperBased ? mat.baseProcessingCost + mat.copperRatio * copperPrice : mat.standardPrice)
                        : 0;
                      const lineCost = b.qty * b.lossRate * unitPrice / 100;
                      return (
                        <tr key={i} className="border-b border-slate-100">
                          <td className="py-2 px-3">
                            <span className={`px-1.5 py-0.5 rounded text-xs font-medium ${PROCESS_BADGE[b.process] || 'bg-slate-100 text-slate-600'}`}>{b.process}</span>
                          </td>
                          <td className="py-2 px-3 font-mono text-xs text-slate-500">{mat?.code || b.materialId}</td>
                          <td className="py-2 px-3 text-slate-700">
                            {mat?.name || b.materialId}
                            {mat?.isCopperBased && <span className="ml-1 text-xs text-amber-600">★銅系</span>}
                          </td>
                          <td className="py-2 px-3 text-right font-mono">{b.qty.toFixed(2)}</td>
                          <td className="py-2 px-3 text-right text-slate-500">{b.lossRate.toFixed(2)}</td>
                          <td className="py-2 px-3 text-right font-mono">¥{Math.round(unitPrice).toLocaleString()}</td>
                          <td className="py-2 px-3 text-right font-mono font-medium">¥{lineCost.toFixed(2)}</td>
                        </tr>
                      );
                    })}
                  </tbody>
                  <tfoot className="bg-slate-50">
                    <tr>
                      <td colSpan={6} className="py-2 px-3 text-xs text-slate-500 text-right">材料費合計（銅価: ¥{copperPrice.toLocaleString()}/kg）=</td>
                      <td className="py-2 px-3 text-right font-bold text-slate-800">¥{materialCost.toFixed(2)}/m</td>
                    </tr>
                  </tfoot>
                </table>
              </div>
            ) : (
              // レガシー方式
              <div className="overflow-x-auto">
                <table className="w-full text-sm">
                  <thead className="bg-slate-50">
                    <tr>
                      {['材料コード', '材料名', '必要量(kg/m)', '標準単価(円/kg)', '材料費(円/m)'].map(h => (
                        <th key={h} className="text-left py-2 px-3 text-xs font-medium text-slate-500">{h}</th>
                      ))}
                    </tr>
                  </thead>
                  <tbody>
                    {(selected.bom || []).map((b, i) => (
                      <tr key={i} className="border-b border-slate-100">
                        <td className="py-2 px-3 font-mono text-xs text-slate-500">{b.materialCode}</td>
                        <td className="py-2 px-3 text-slate-700">{b.materialName}</td>
                        <td className="py-2 px-3 text-right font-mono">{b.requiredQty.toFixed(3)}</td>
                        <td className="py-2 px-3 text-right font-mono">¥{b.standardPrice.toLocaleString()}</td>
                        <td className="py-2 px-3 text-right font-mono font-medium">¥{(b.requiredQty * b.standardPrice).toFixed(2)}</td>
                      </tr>
                    ))}
                  </tbody>
                  <tfoot className="bg-slate-50">
                    <tr>
                      <td colSpan={4} className="py-2 px-3 text-xs text-slate-500 text-right">
                        小計 × ロス率（{selected.lossRate}）=
                      </td>
                      <td className="py-2 px-3 text-right font-bold text-slate-800">¥{materialCost.toFixed(2)}/m</td>
                    </tr>
                  </tfoot>
                </table>
              </div>
            )}
          </div>

          {/* 原価サマリ */}
          <div className="card">
            <h3 className="font-semibold text-slate-800 mb-3">原価・利益サマリ</h3>
            <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
              {[
                { label: '算出材料費',    value: `¥${materialCost.toFixed(1)}/m`,  sub: `ロス率 ${selected.lossRate}x` },
                { label: '加工費',        value: `¥${selected.processingCost.toFixed(1)}/m`, sub: '現場線速基準' },
                { label: '製造原価合計',  value: `¥${totalCost.toFixed(1)}/m`,     sub: '材料費＋加工費', bold: true },
                { label: '見積提出売価',  value: `¥${selected.quotedPrice.toFixed(1)}/m`, sub: `粗利 ${grossMargin.toFixed(1)}%`, color: 'text-blue-700' },
              ].map(item => (
                <div key={item.label} className="bg-slate-50 rounded-lg p-3 text-center">
                  <div className="text-xs text-slate-500 mb-1">{item.label}</div>
                  <div className={`text-lg font-bold ${item.color || 'text-slate-800'}`}>{item.value}</div>
                  <div className="text-xs text-slate-400 mt-0.5">{item.sub}</div>
                </div>
              ))}
            </div>
            {grossMargin < 10 && (
              <div className="mt-3 p-3 bg-red-50 border border-red-200 rounded-lg text-sm text-red-700">
                ⚠️ 粗利率が10%を下回っています。価格の見直しを検討してください。
              </div>
            )}
          </div>
        </div>
      )}

      {/* ── モーダル ──────────────────────────────────────── */}
      {showNewQuote && (
        <NewQuoteModal
          quotes={quotes}
          products={products}
          customers={customers}
          materials={materials}
          productBOMs={productBOMs}
          copperPrice={copperPrice}
          onSubmit={handleNewQuote}
          onClose={() => setShowNewQuote(false)}
        />
      )}

      {orderModal && (
        <OrderFromQuoteModal
          quote={orderModal}
          ordersCount={orders.length}
          onSubmit={handleCreateOrder}
          onSkip={() => setOrderModal(null)}
        />
      )}
    </div>
  );
}
