import { useState } from 'react';
import { useApp } from '../context/AppContext';

const COMPANY = { name: '杉田電線株式会社', postal: '〒950-XXXX', address: '新潟県新潟市XX区XXX-XX', tel: '025-XXX-XXXX', fax: '025-XXX-XXXX' };

// ── 印刷用 HTML 生成 ────────────────────────────────────────────────
function buildHtml(title, body) {
  return `<!DOCTYPE html><html lang="ja"><head><meta charset="UTF-8"><title>${title}</title>
<style>
*{box-sizing:border-box;margin:0;padding:0}
body{font-family:'ヒラギノ角ゴ Pro W3','Hiragino Kaku Gothic Pro','メイリオ',Meiryo,sans-serif;font-size:10.5pt;color:#000;background:#fff;padding:15mm 18mm}
h1{text-align:center;font-size:17pt;font-weight:bold;letter-spacing:0.2em;border-bottom:2.5px solid #000;padding-bottom:4mm;margin-bottom:6mm}
.row{display:flex;justify-content:space-between;margin-bottom:6mm}
.left{max-width:55%}.right{text-align:right;font-size:9.5pt;line-height:1.8}
.to{font-size:14pt;font-weight:bold;border-bottom:1px solid #000;padding-bottom:2mm;margin-bottom:2mm}
table{width:100%;border-collapse:collapse;margin:4mm 0}
th,td{border:1px solid #888;padding:2mm 3mm;font-size:9.5pt}
th{background:#f2f2f2;font-weight:bold;text-align:center}
.r{text-align:right}.c{text-align:center}
.total-row td{font-weight:bold;font-size:11pt;background:#e8e8e8}
.note{font-size:8.5pt;color:#555;margin-top:4mm;line-height:1.7}
.seal-row{display:flex;justify-content:flex-end;gap:6mm;margin-top:6mm}
.seal{border:1px solid #555;width:18mm;height:16mm;display:flex;flex-direction:column;align-items:center;justify-content:center;font-size:8pt;color:#555}
@media print{@page{size:A4;margin:10mm}body{padding:8mm 12mm}}
</style></head><body>${body}</body></html>`;
}

function printHtml(title, body) {
  const html = buildHtml(title, body);
  const w = window.open('', '_blank', 'width=820,height=1080');
  if (!w) { alert('ポップアップブロッカーを解除してから印刷してください。'); return; }
  w.document.write(html);
  w.document.close();
  w.focus();
  setTimeout(() => w.print(), 350);
}

// ── 納品書 HTML ─────────────────────────────────────────────────────
function deliveryHtml(order) {
  const amount = (Number(order.unitPrice || 0) * Number(order.totalQuantity || 0));
  const tax = Math.floor(amount * 0.1);
  const rows = `<tr>
    <td>${order.productName || ''}</td>
    <td class="r">${Number(order.totalQuantity || 0).toLocaleString()}</td>
    <td class="c">${order.unit || 'm'}</td>
    <td class="r">¥${Number(order.unitPrice || 0).toLocaleString()}</td>
    <td class="r">¥${amount.toLocaleString()}</td>
    <td>${order.remarks || ''}</td>
  </tr>` + `<tr><td colspan="6" style="height:8mm"></td></tr>`.repeat(3);
  return `
<h1>納 品 書</h1>
<div class="row">
  <div class="left">
    <div class="to">${order.customerName || ''} 御中</div>
    ${order.deliveryAddressName ? `<div style="font-size:9.5pt">${order.deliveryAddressName}</div>` : ''}
    ${order.customerOrderNum1 ? `<div style="font-size:9.5pt;margin-top:2mm">客先注文番号：${order.customerOrderNum1}</div>` : ''}
  </div>
  <div class="right">
    <div style="font-weight:bold;font-size:12pt">${COMPANY.name}</div>
    <div>${COMPANY.postal} ${COMPANY.address}</div>
    <div>TEL ${COMPANY.tel} / FAX ${COMPANY.fax}</div>
    <div style="margin-top:2mm">発行日：${order.orderDate || ''}</div>
    <div>受注番号：${order.orderNumber || ''}</div>
    <div>担当：${order.inputPerson || '細野'}</div>
  </div>
</div>
<table>
  <thead><tr><th>品名・規格</th><th class="c">数量</th><th class="c">単位</th><th class="c">単価（¥）</th><th class="c">金額（¥）</th><th>摘要</th></tr></thead>
  <tbody>${rows}</tbody>
  <tfoot>
    <tr><td colspan="4" class="r">小　計</td><td class="r">¥${amount.toLocaleString()}</td><td></td></tr>
    <tr><td colspan="4" class="r">消費税（10%）</td><td class="r">¥${tax.toLocaleString()}</td><td></td></tr>
    <tr class="total-row"><td colspan="4" class="r">税込合計</td><td class="r">¥${(amount + tax).toLocaleString()}</td><td></td></tr>
  </tfoot>
</table>
<div class="note">${order.designNumber ? `設計書番号：${order.designNumber}　` : ''}荷姿：${order.packaging || '—'}　　上記の通り納品いたします。</div>
<div class="seal-row">${['担当者', '確認', '検印'].map(l => `<div class="seal"><span>${l}</span></div>`).join('')}</div>`;
}

// ── 売上仮伝票 HTML ─────────────────────────────────────────────────
function provisionalHtml(order) {
  const amount = (Number(order.unitPrice || 0) * Number(order.totalQuantity || 0));
  const tax = Math.floor(amount * 0.1);
  return `
<h1>売 上 仮 伝 票</h1>
<div class="row">
  <div class="left">
    <div class="to">${order.customerName || ''} 御中</div>
    <div style="font-size:9.5pt;margin-top:2mm">単価区分：${order.priceCategory === 'K' ? 'K：仮単価' : order.priceCategory === 'T' ? 'T：一括単価' : 'A：決定単価'}</div>
  </div>
  <div class="right">
    <div style="font-weight:bold;font-size:12pt">${COMPANY.name}</div>
    <div>伝票日付：${order.orderDate || ''}</div>
    <div>伝票番号：${order.orderNumber || ''}</div>
  </div>
</div>
<table>
  <thead><tr><th>受注番号</th><th>品名</th><th class="c">数量</th><th class="c">単位</th><th class="c">単価</th><th class="c">金額</th><th class="c">納期</th></tr></thead>
  <tbody>
    <tr>
      <td>${order.orderNumber || ''}</td>
      <td>${order.productName || ''}</td>
      <td class="r">${Number(order.totalQuantity || 0).toLocaleString()}</td>
      <td class="c">${order.unit || 'm'}</td>
      <td class="r">¥${Number(order.unitPrice || 0).toLocaleString()}</td>
      <td class="r">¥${amount.toLocaleString()}</td>
      <td class="c">${order.finalDeadline || ''}</td>
    </tr>
    ${'<tr><td colspan="7" style="height:7mm"></td></tr>'.repeat(4)}
  </tbody>
  <tfoot>
    <tr class="total-row"><td colspan="5" class="r">合　計（税抜）</td><td class="r">¥${amount.toLocaleString()}</td><td></td></tr>
    <tr><td colspan="5" class="r">消費税（10%）</td><td class="r">¥${tax.toLocaleString()}</td><td></td></tr>
    <tr class="total-row"><td colspan="5" class="r">税込合計</td><td class="r">¥${(amount + tax).toLocaleString()}</td><td></td></tr>
  </tfoot>
</table>
<div class="note">※ 本伝票は仮伝票です。正式な請求書は月次にて発行いたします。</div>
<div class="seal-row">${['担当者', '経理確認'].map(l => `<div class="seal"><span>${l}</span></div>`).join('')}</div>`;
}

// ── 売掛請求書 HTML ─────────────────────────────────────────────────
function invoiceHtml(order, relatedOrders) {
  const targets = relatedOrders.filter(o => o.customerCode === order.customerCode && o.status !== 'キャンセル');
  const rows = targets.map(o => {
    const amt = (Number(o.unitPrice || 0) * Number(o.totalQuantity || 0));
    return `<tr>
      <td>${o.orderNumber}</td>
      <td>${o.productName}</td>
      <td class="r">${Number(o.totalQuantity || 0).toLocaleString()} ${o.unit || 'm'}</td>
      <td class="r">¥${Number(o.unitPrice || 0).toLocaleString()}</td>
      <td class="r">¥${amt.toLocaleString()}</td>
      <td class="c">${o.finalDeadline || ''}</td>
    </tr>`;
  }).join('');
  const subtotal = targets.reduce((s, o) => s + (Number(o.unitPrice || 0) * Number(o.totalQuantity || 0)), 0);
  const tax = Math.floor(subtotal * 0.1);
  const customer = targets[0];
  return `
<h1>売 掛 請 求 書</h1>
<div class="row">
  <div class="left">
    <div class="to">${order.customerName || ''} 御中</div>
    <div style="font-size:9.5pt;margin-top:3mm">請求金額：<strong style="font-size:13pt">¥${(subtotal + tax).toLocaleString()}</strong>（税込）</div>
  </div>
  <div class="right">
    <div style="font-weight:bold;font-size:12pt">${COMPANY.name}</div>
    <div>${COMPANY.postal} ${COMPANY.address}</div>
    <div>TEL ${COMPANY.tel}</div>
    <div style="margin-top:2mm">請求日：2026-05-31</div>
    <div>お支払い期限：${customer?.billingCycle === '15日' ? '2026-06-15' : customer?.billingCycle === '20日' ? '2026-06-20' : '2026-05-31'}</div>
  </div>
</div>
<table>
  <thead><tr><th>受注番号</th><th>品名</th><th class="c">数量</th><th class="c">単価</th><th class="c">金額</th><th class="c">納期</th></tr></thead>
  <tbody>${rows || '<tr><td colspan="6" style="text-align:center;padding:4mm">対象データなし</td></tr>'}</tbody>
  <tfoot>
    <tr><td colspan="4" class="r">小　計（税抜）</td><td class="r">¥${subtotal.toLocaleString()}</td><td></td></tr>
    <tr><td colspan="4" class="r">消費税（10%）</td><td class="r">¥${tax.toLocaleString()}</td><td></td></tr>
    <tr class="total-row"><td colspan="4" class="r">ご請求金額（税込）</td><td class="r">¥${(subtotal + tax).toLocaleString()}</td><td></td></tr>
  </tfoot>
</table>
<div class="note">お振込先：○○銀行 ○○支店 普通預金 口座番号：XXXXXXX　名義：スギタデンセン（カ）<br>恐れ入りますがお振込手数料はご負担いただけますようお願い申し上げます。</div>
<div class="seal-row">${['担当者', '経理', '代表印'].map(l => `<div class="seal"><span>${l}</span></div>`).join('')}</div>`;
}

// ── ドキュメントプレビュー ──────────────────────────────────────────
function DocPreview({ order, docType, relatedOrders }) {
  const amount = Number(order.unitPrice || 0) * Number(order.totalQuantity || 0);
  const tax = Math.floor(amount * 0.1);

  if (docType === 'delivery') return (
    <div className="bg-white border border-slate-300 rounded-lg p-6 text-xs font-sans max-w-xl mx-auto shadow">
      <h2 className="text-center text-base font-bold border-b-2 border-slate-800 pb-2 mb-3 tracking-widest">納 品 書</h2>
      <div className="flex justify-between mb-4">
        <div>
          <div className="font-bold text-sm">{order.customerName} 御中</div>
          {order.deliveryAddressName && <div className="text-slate-500 mt-0.5">{order.deliveryAddressName}</div>}
          {order.customerOrderNum1 && <div className="text-slate-500 mt-0.5">客先注番：{order.customerOrderNum1}</div>}
        </div>
        <div className="text-right text-slate-600 space-y-0.5">
          <div className="font-bold text-slate-800">{COMPANY.name}</div>
          <div>発行日：{order.orderDate}</div>
          <div>受注番号：{order.orderNumber}</div>
          <div>担当：{order.inputPerson || '細野'}</div>
        </div>
      </div>
      <table className="w-full border-collapse text-xs mb-3">
        <thead><tr className="bg-slate-100">{['品名・規格','数量','単位','単価','金額','摘要'].map(h=><th key={h} className="border border-slate-300 px-2 py-1 text-center">{h}</th>)}</tr></thead>
        <tbody>
          <tr>
            <td className="border border-slate-300 px-2 py-1.5">{order.productName}</td>
            <td className="border border-slate-300 px-2 py-1.5 text-right">{Number(order.totalQuantity||0).toLocaleString()}</td>
            <td className="border border-slate-300 px-2 py-1.5 text-center">{order.unit||'m'}</td>
            <td className="border border-slate-300 px-2 py-1.5 text-right">¥{Number(order.unitPrice||0).toLocaleString()}</td>
            <td className="border border-slate-300 px-2 py-1.5 text-right">¥{amount.toLocaleString()}</td>
            <td className="border border-slate-300 px-2 py-1.5">{order.remarks||''}</td>
          </tr>
          {[0,1,2].map(i=><tr key={i}><td className="border border-slate-200 py-2" colSpan={6}></td></tr>)}
        </tbody>
        <tfoot>
          <tr><td className="border border-slate-300 px-2 py-1 text-right" colSpan={4}>小計</td><td className="border border-slate-300 px-2 py-1 text-right">¥{amount.toLocaleString()}</td><td className="border border-slate-300"></td></tr>
          <tr><td className="border border-slate-300 px-2 py-1 text-right" colSpan={4}>消費税（10%）</td><td className="border border-slate-300 px-2 py-1 text-right">¥{tax.toLocaleString()}</td><td className="border border-slate-300"></td></tr>
          <tr className="bg-slate-100 font-bold"><td className="border border-slate-300 px-2 py-1.5 text-right" colSpan={4}>税込合計</td><td className="border border-slate-300 px-2 py-1.5 text-right">¥{(amount+tax).toLocaleString()}</td><td className="border border-slate-300"></td></tr>
        </tfoot>
      </table>
      <div className="text-slate-500 text-xs space-y-0.5">
        {order.designNumber && <div>設計書番号：{order.designNumber}</div>}
        <div>荷姿：{order.packaging || '—'}</div>
      </div>
      <div className="flex justify-end gap-3 mt-3">
        {['担当者','確認','検印'].map(l=><div key={l} className="border border-slate-400 w-12 h-10 flex items-center justify-center text-slate-400 text-xs">{l}</div>)}
      </div>
    </div>
  );

  if (docType === 'provisional') return (
    <div className="bg-white border border-slate-300 rounded-lg p-6 text-xs max-w-xl mx-auto shadow">
      <h2 className="text-center text-base font-bold border-b-2 border-slate-800 pb-2 mb-3 tracking-widest">売 上 仮 伝 票</h2>
      <div className="flex justify-between mb-4">
        <div>
          <div className="font-bold text-sm">{order.customerName} 御中</div>
          <div className="text-slate-500 mt-1">単価区分：{order.priceCategory === 'K' ? 'K：仮単価' : order.priceCategory === 'T' ? 'T：一括単価' : 'A：決定単価'}</div>
        </div>
        <div className="text-right text-slate-600 space-y-0.5">
          <div className="font-bold text-slate-800">{COMPANY.name}</div>
          <div>伝票日付：{order.orderDate}</div>
          <div>伝票番号：{order.orderNumber}</div>
        </div>
      </div>
      <table className="w-full border-collapse text-xs mb-3">
        <thead><tr className="bg-slate-100">{['受注番号','品名','数量','単価','金額','納期'].map(h=><th key={h} className="border border-slate-300 px-2 py-1 text-center">{h}</th>)}</tr></thead>
        <tbody>
          <tr>
            <td className="border border-slate-300 px-2 py-1.5">{order.orderNumber}</td>
            <td className="border border-slate-300 px-2 py-1.5">{order.productName}</td>
            <td className="border border-slate-300 px-2 py-1.5 text-right">{Number(order.totalQuantity||0).toLocaleString()} {order.unit||'m'}</td>
            <td className="border border-slate-300 px-2 py-1.5 text-right">¥{Number(order.unitPrice||0).toLocaleString()}</td>
            <td className="border border-slate-300 px-2 py-1.5 text-right">¥{amount.toLocaleString()}</td>
            <td className="border border-slate-300 px-2 py-1.5 text-center">{order.finalDeadline}</td>
          </tr>
          {[0,1,2,3].map(i=><tr key={i}><td className="border border-slate-200 py-2" colSpan={6}></td></tr>)}
        </tbody>
        <tfoot>
          <tr><td className="border border-slate-300 px-2 py-1 text-right font-bold" colSpan={4}>合計（税抜）</td><td className="border border-slate-300 px-2 py-1 text-right">¥{amount.toLocaleString()}</td><td className="border border-slate-300"></td></tr>
          <tr><td className="border border-slate-300 px-2 py-1 text-right" colSpan={4}>消費税（10%）</td><td className="border border-slate-300 px-2 py-1 text-right">¥{tax.toLocaleString()}</td><td className="border border-slate-300"></td></tr>
          <tr className="bg-slate-100 font-bold"><td className="border border-slate-300 px-2 py-1.5 text-right" colSpan={4}>税込合計</td><td className="border border-slate-300 px-2 py-1.5 text-right">¥{(amount+tax).toLocaleString()}</td><td className="border border-slate-300"></td></tr>
        </tfoot>
      </table>
      <div className="text-slate-400 text-xs mt-2">※ 本伝票は仮伝票です。正式な請求書は月次にて発行いたします。</div>
      <div className="flex justify-end gap-3 mt-3">
        {['担当者','経理確認'].map(l=><div key={l} className="border border-slate-400 w-12 h-10 flex items-center justify-center text-slate-400 text-xs">{l}</div>)}
      </div>
    </div>
  );

  // 売掛請求書
  const targets = relatedOrders.filter(o => o.customerCode === order.customerCode && o.status !== 'キャンセル');
  const subtotal = targets.reduce((s, o) => s + (Number(o.unitPrice || 0) * Number(o.totalQuantity || 0)), 0);
  const invTax = Math.floor(subtotal * 0.1);
  return (
    <div className="bg-white border border-slate-300 rounded-lg p-6 text-xs max-w-xl mx-auto shadow">
      <h2 className="text-center text-base font-bold border-b-2 border-slate-800 pb-2 mb-3 tracking-widest">売 掛 請 求 書</h2>
      <div className="flex justify-between mb-3">
        <div>
          <div className="font-bold text-sm">{order.customerName} 御中</div>
          <div className="mt-1">ご請求金額：<span className="font-bold text-base">¥{(subtotal+invTax).toLocaleString()}</span>（税込）</div>
        </div>
        <div className="text-right text-slate-600 space-y-0.5">
          <div className="font-bold text-slate-800">{COMPANY.name}</div>
          <div>請求日：2026-05-31</div>
        </div>
      </div>
      <div className="text-slate-500 mb-2">対象受注：{targets.length}件</div>
      <table className="w-full border-collapse text-xs mb-3">
        <thead><tr className="bg-slate-100">{['受注番号','品名','数量','単価','金額','納期'].map(h=><th key={h} className="border border-slate-300 px-1.5 py-1 text-center">{h}</th>)}</tr></thead>
        <tbody>
          {targets.slice(0, 8).map(o => {
            const a = Number(o.unitPrice||0)*Number(o.totalQuantity||0);
            return (
              <tr key={o.id}>
                <td className="border border-slate-200 px-1.5 py-1">{o.orderNumber}</td>
                <td className="border border-slate-200 px-1.5 py-1 max-w-[120px] truncate">{o.productName}</td>
                <td className="border border-slate-200 px-1.5 py-1 text-right">{Number(o.totalQuantity||0).toLocaleString()}{o.unit||'m'}</td>
                <td className="border border-slate-200 px-1.5 py-1 text-right">¥{Number(o.unitPrice||0).toLocaleString()}</td>
                <td className="border border-slate-200 px-1.5 py-1 text-right">¥{a.toLocaleString()}</td>
                <td className="border border-slate-200 px-1.5 py-1 text-center">{o.finalDeadline||'—'}</td>
              </tr>
            );
          })}
          {targets.length === 0 && <tr><td colSpan={6} className="border border-slate-200 py-3 text-center text-slate-400">対象データなし</td></tr>}
        </tbody>
        <tfoot>
          <tr><td className="border border-slate-300 px-2 py-1 text-right" colSpan={4}>小計（税抜）</td><td className="border border-slate-300 px-2 py-1 text-right">¥{subtotal.toLocaleString()}</td><td className="border border-slate-300"></td></tr>
          <tr><td className="border border-slate-300 px-2 py-1 text-right" colSpan={4}>消費税（10%）</td><td className="border border-slate-300 px-2 py-1 text-right">¥{invTax.toLocaleString()}</td><td className="border border-slate-300"></td></tr>
          <tr className="bg-slate-100 font-bold"><td className="border border-slate-300 px-2 py-1.5 text-right" colSpan={4}>ご請求金額（税込）</td><td className="border border-slate-300 px-2 py-1.5 text-right">¥{(subtotal+invTax).toLocaleString()}</td><td className="border border-slate-300"></td></tr>
        </tfoot>
      </table>
      <div className="text-slate-400 text-xs mt-1">振込先：○○銀行 ○○支店 普通 口座番号：XXXXXXX　名義：スギタデンセン（カ）</div>
    </div>
  );
}

// ── メインモーダル ───────────────────────────────────────────────────
export default function DocumentOutputModal({ order, onClose }) {
  const { orders } = useApp();
  const [docType, setDocType] = useState('delivery');

  const handlePrint = () => {
    const title = docType === 'delivery' ? '納品書' : docType === 'provisional' ? '売上仮伝票' : '売掛請求書';
    let body = '';
    if (docType === 'delivery') body = deliveryHtml(order);
    else if (docType === 'provisional') body = provisionalHtml(order);
    else body = invoiceHtml(order, orders);
    printHtml(`${title} — ${order.orderNumber}`, body);
  };

  return (
    <div className="fixed inset-0 z-[60] flex items-center justify-center bg-black/50 p-4"
      onMouseDown={e => { if (e.target === e.currentTarget) onClose(); }}>
      <div className="bg-white rounded-xl shadow-2xl w-full max-w-2xl max-h-[90vh] flex flex-col">
        <div className="px-6 py-4 border-b border-slate-200 flex items-center justify-between flex-shrink-0">
          <div>
            <h3 className="font-bold text-slate-800">帳票出力</h3>
            <p className="text-xs text-slate-500 mt-0.5">{order.orderNumber} — {order.customerName}</p>
          </div>
          <button onClick={onClose} className="text-slate-400 hover:text-slate-600 text-xl leading-none">✕</button>
        </div>

        <div className="flex border-b border-slate-200 flex-shrink-0 px-2">
          {[['delivery','📄 納品書'],['provisional','📋 売上仮伝票'],['invoice','🧾 売掛請求書']].map(([id,label])=>(
            <button key={id} onClick={()=>setDocType(id)}
              className={`px-4 py-2.5 text-sm font-medium border-b-2 transition-colors ${docType===id ? 'border-blue-600 text-blue-700' : 'border-transparent text-slate-500 hover:text-slate-700'}`}>
              {label}
            </button>
          ))}
        </div>

        <div className="flex-1 overflow-y-auto p-4 bg-slate-50">
          <DocPreview order={order} docType={docType} relatedOrders={orders} />
        </div>

        <div className="px-6 py-4 border-t border-slate-200 flex justify-between items-center flex-shrink-0">
          <p className="text-xs text-slate-400">「印刷/PDF出力」→ ブラウザの印刷ダイアログで「PDFに保存」を選択</p>
          <div className="flex gap-3">
            <button onClick={onClose} className="btn-secondary">閉じる</button>
            <button onClick={handlePrint} className="btn-primary">🖨️ 印刷 / PDF出力</button>
          </div>
        </div>
      </div>
    </div>
  );
}
