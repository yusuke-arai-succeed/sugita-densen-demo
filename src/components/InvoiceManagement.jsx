import { useState, useMemo } from 'react';
import { useApp } from '../context/AppContext';

const TAX_RATE = 0.10;
// 請求対象ステータス（仮押さえ・失注は除外）
const BILLABLE = new Set(['確定', '分納中', '出荷済み', '完了']);

// ─── PDF出力（弊社フォーマット） ────────────────────────────────────
function openInvoicePDF(inv) {
  const rows = inv.lines.map(l => {
    const amt = l.quantity * l.unitPrice;
    return `<tr>
      <td>${l.orderNumber}</td>
      <td style="font-size:9pt">${l.productCode}</td>
      <td>${l.productName}</td>
      <td class="r">${l.quantity.toLocaleString()}</td>
      <td>${l.unit}</td>
      <td class="r">¥${l.unitPrice.toLocaleString()}</td>
      <td class="r">¥${amt.toLocaleString()}</td>
    </tr>`;
  }).join('');

  const html = `<!DOCTYPE html><html lang="ja"><head>
<meta charset="utf-8">
<title>請求書 ${inv.invoiceNumber}</title>
<style>
*{margin:0;padding:0;box-sizing:border-box}
body{font-family:'MS Gothic','Hiragino Kaku Gothic ProN',sans-serif;font-size:10.5pt;padding:15mm 18mm}
h1{font-size:22pt;text-align:center;letter-spacing:6px;margin-bottom:8mm;border-bottom:3px double #000;padding-bottom:3mm}
.header{display:flex;justify-content:space-between;margin-bottom:6mm}
.to{min-width:55%}
.to .name{font-size:14pt;font-weight:bold;border-bottom:1.5px solid #000;padding-bottom:1mm;margin-bottom:2mm}
.to .sub{font-size:9pt;color:#333}
.from{text-align:right;font-size:9pt;line-height:1.7}
.from strong{font-size:11pt}
.summary{background:#f8f8f8;border:1px solid #ccc;padding:3mm 5mm;margin-bottom:5mm;display:flex;justify-content:space-between;align-items:center}
.summary .label{font-size:9pt;color:#555}
.summary .value{font-size:13pt;font-weight:bold;color:#1a1a6e}
table{width:100%;border-collapse:collapse;font-size:9.5pt}
th{background:#2c3e50;color:#fff;padding:2mm 2.5mm;text-align:left}
th.r,td.r{text-align:right}
td{padding:1.8mm 2.5mm;border-bottom:1px solid #ddd}
tr:nth-child(even) td{background:#fafafa}
.sub-row td{border-top:1.5px solid #999;font-weight:bold;background:#f0f0f0}
.tax-row td{font-weight:bold;background:#f0f0f0}
.total-row td{font-weight:bold;font-size:11pt;background:#2c3e50;color:#fff}
.footer{margin-top:6mm;font-size:8.5pt;color:#555;border-top:1px solid #ccc;padding-top:3mm}
@media print{@page{size:A4 portrait;margin:0}body{padding:12mm 15mm}}
</style></head><body>
<h1>請　求　書</h1>
<div class="header">
  <div class="to">
    <div class="name">${inv.customerName} 御中</div>
    <div class="sub">得意先コード：${inv.customerCode}</div>
  </div>
  <div class="from">
    <strong>杉田電線株式会社</strong><br>
    〒441-XXXX 愛知県豊橋市○○町1-2-3<br>
    TEL: 0532-XX-XXXX ／ FAX: 0532-XX-XXXX<br>
    登録番号: T0000000000000<br><br>
    請求書番号: <strong>${inv.invoiceNumber}</strong><br>
    発行日: ${inv.issueDate}<br>
    お支払期限: ${inv.dueDate}
  </div>
</div>
<div class="summary">
  <span class="label">今回ご請求金額（税込）</span>
  <span class="value">¥${inv.total.toLocaleString()} −</span>
</div>
<table>
  <tr><th>受注番号</th><th>品番</th><th>品名</th><th class="r">数量</th><th>単位</th><th class="r">単価(税抜)</th><th class="r">金額(税抜)</th></tr>
  ${rows}
  <tr class="sub-row"><td colspan="6" class="r">小計（税抜）</td><td class="r">¥${inv.subtotal.toLocaleString()}</td></tr>
  <tr class="tax-row"><td colspan="6" class="r">消費税（10%）</td><td class="r">¥${inv.tax.toLocaleString()}</td></tr>
  <tr class="total-row"><td colspan="6" class="r">合計（税込）</td><td class="r">¥${inv.total.toLocaleString()}</td></tr>
</table>
<div class="footer">
  振込先: 〇〇銀行 〇〇支店 普通 0000000 杉田電線株式会社<br>
  備考: ${inv.remarks || 'お振込の際は請求書番号をご記載ください。'}
</div>
</body></html>`;

  const w = window.open('', '_blank', 'width=800,height=1000');
  w.document.write(html);
  w.document.close();
  setTimeout(() => w.print(), 400);
}

// ─── CSV出力（EDI形式） ─────────────────────────────────────────────
function downloadInvoiceCSV(inv) {
  const header = '請求書番号,発行日,お支払期限,得意先コード,得意先名,受注番号,品番,品名,数量,単位,単価(税抜),金額(税抜),消費税率,消費税額,税込合計';
  const csvRows = inv.lines.map(l => {
    const amt = l.quantity * l.unitPrice;
    const tax = Math.round(amt * TAX_RATE);
    return [
      inv.invoiceNumber, inv.issueDate, inv.dueDate,
      inv.customerCode, `"${inv.customerName}"`,
      l.orderNumber, l.productCode, `"${l.productName}"`,
      l.quantity, l.unit, l.unitPrice, amt, '10%', tax, amt + tax,
    ].join(',');
  });
  const csv = '﻿' + [header, ...csvRows].join('\r\n');
  const blob = new Blob([csv], { type: 'text/csv;charset=utf-8;' });
  const url = URL.createObjectURL(blob);
  const a = document.createElement('a');
  a.href = url;
  a.download = `${inv.invoiceNumber}.csv`;
  a.click();
  URL.revokeObjectURL(url);
}

// ─── 請求書オブジェクト生成 ─────────────────────────────────────────
function buildInvoice(orders, customerCode, customerName, mode) {
  const lines = orders.map(o => ({
    orderNumber: o.orderNumber,
    productCode: o.productCode,
    productName: o.productName,
    quantity: o.totalQuantity,
    unit: o.unit,
    unitPrice: o.unitPrice || 0,
  }));
  const subtotal = lines.reduce((s, l) => s + l.quantity * l.unitPrice, 0);
  const tax = Math.round(subtotal * TAX_RATE);
  const firstOrder = orders[0];
  const month = firstOrder.finalDeadline?.slice(0, 7) || '2026-05';
  const invNum = mode === 'monthly'
    ? `INV-${customerCode}-${month.replace('-', '')}`
    : `INV-${firstOrder.orderNumber}`;
  const due = (() => {
    const d = new Date(firstOrder.finalDeadline || '2026-05-31');
    d.setDate(d.getDate() + 30);
    return d.toISOString().split('T')[0];
  })();
  return {
    invoiceNumber: invNum,
    issueDate: '2026-05-21',
    dueDate: due,
    customerCode,
    customerName,
    subtotal,
    tax,
    total: subtotal + tax,
    remarks: '',
    lines,
  };
}

// ─── メインコンポーネント ────────────────────────────────────────────
export default function InvoiceManagement() {
  const { orders, customers, getCustomerDataTransmission, updateCustomerDataTransmission } = useApp();

  const [tab, setTab] = useState('invoices');
  const [outputMode, setOutputMode] = useState('perOrder');  // 'perOrder' | 'monthly'
  const [filterMonth, setFilterMonth] = useState('2026-05');
  const [filterCustomer, setFilterCustomer] = useState('');

  // 請求対象受注
  const billableOrders = useMemo(() =>
    orders.filter(o => BILLABLE.has(o.status)),
    [orders]
  );

  // 月フィルタ適用
  const filteredOrders = useMemo(() => {
    return billableOrders.filter(o => {
      const month = o.finalDeadline?.slice(0, 7) || '';
      if (filterMonth && month !== filterMonth) return false;
      if (filterCustomer && o.customerCode !== filterCustomer) return false;
      return true;
    });
  }, [billableOrders, filterMonth, filterCustomer]);

  // 月次締めグループ: { customerCode → orders[] }
  const monthlyGroups = useMemo(() => {
    const map = {};
    filteredOrders.forEach(o => {
      const key = o.customerCode;
      if (!map[key]) map[key] = [];
      map[key].push(o);
    });
    return Object.entries(map).map(([code, ords]) => {
      const cust = customers.find(c => c.code === code);
      return { customerCode: code, customerName: cust?.name || code, orders: ords };
    });
  }, [filteredOrders, customers]);

  // 利用月リスト（受注の finalDeadline から生成）
  const availableMonths = useMemo(() => {
    const set = new Set(billableOrders.map(o => o.finalDeadline?.slice(0, 7)).filter(Boolean));
    return [...set].sort().reverse();
  }, [billableOrders]);

  const handleOutputInvoice = (inv, mode) => {
    if (mode === 'EDI') downloadInvoiceCSV(inv);
    else openInvoicePDF(inv);
  };

  const transmissionBadge = (code) => {
    const t = getCustomerDataTransmission(code);
    return t === 'EDI'
      ? <span className="px-2 py-0.5 bg-blue-100 text-blue-700 rounded text-xs font-bold">EDI</span>
      : <span className="px-2 py-0.5 bg-gray-100 text-gray-600 rounded text-xs font-bold">PDF</span>;
  };

  return (
    <div className="p-4 space-y-4">
      <h2 className="text-lg font-bold text-gray-800">🧾 請求書管理</h2>

      {/* タブ */}
      <div className="flex border-b border-gray-200">
        {[['invoices', '📄 請求書出力'], ['customerSettings', '🏢 顧客送信設定']].map(([id, label]) => (
          <button
            key={id}
            onClick={() => setTab(id)}
            className={`px-5 py-2 text-sm font-medium border-b-2 transition-colors ${
              tab === id ? 'border-blue-600 text-blue-700' : 'border-transparent text-gray-500 hover:text-gray-700'
            }`}
          >
            {label}
          </button>
        ))}
      </div>

      {/* ─── 請求書出力タブ ─── */}
      {tab === 'invoices' && (
        <div className="space-y-4">
          {/* ツールバー */}
          <div className="flex flex-wrap gap-3 items-center bg-gray-50 p-3 rounded-lg border border-gray-200">
            <div className="flex rounded-lg overflow-hidden border border-gray-300 text-sm">
              {[['perOrder', '受注単位'], ['monthly', '月次締め']].map(([val, label]) => (
                <button
                  key={val}
                  onClick={() => setOutputMode(val)}
                  className={`px-4 py-1.5 font-medium transition-colors ${
                    outputMode === val ? 'bg-blue-600 text-white' : 'bg-white text-gray-600 hover:bg-gray-100'
                  }`}
                >
                  {label}
                </button>
              ))}
            </div>

            <div className="flex items-center gap-1 text-sm">
              <span className="text-gray-500 text-xs">締め月</span>
              <select
                className="border border-gray-300 rounded px-2 py-1 text-sm bg-white"
                value={filterMonth}
                onChange={e => setFilterMonth(e.target.value)}
              >
                <option value="">全期間</option>
                {availableMonths.map(m => (
                  <option key={m} value={m}>{m}</option>
                ))}
              </select>
            </div>

            <div className="flex items-center gap-1">
              <span className="text-gray-500 text-xs">得意先</span>
              <select
                className="border border-gray-300 rounded px-2 py-1 text-sm bg-white"
                value={filterCustomer}
                onChange={e => setFilterCustomer(e.target.value)}
              >
                <option value="">すべて</option>
                {customers.map(c => (
                  <option key={c.code} value={c.code}>{c.name}</option>
                ))}
              </select>
            </div>

            <span className="ml-auto text-xs text-gray-400">
              {outputMode === 'perOrder' ? `${filteredOrders.length}件` : `${monthlyGroups.length}社`}
            </span>
          </div>

          {/* 受注単位テーブル */}
          {outputMode === 'perOrder' && (
            <div className="overflow-x-auto rounded-lg border border-gray-200">
              <table className="w-full text-sm">
                <thead className="bg-gray-700 text-white text-xs">
                  <tr>
                    <th className="px-3 py-2 text-left">受注番号</th>
                    <th className="px-3 py-2 text-left">得意先</th>
                    <th className="px-3 py-2 text-left">品名</th>
                    <th className="px-3 py-2 text-right">数量</th>
                    <th className="px-3 py-2 text-right">単価</th>
                    <th className="px-3 py-2 text-right">税込金額</th>
                    <th className="px-3 py-2 text-center">送信形式</th>
                    <th className="px-3 py-2 text-center">ステータス</th>
                    <th className="px-3 py-2 text-center">出力</th>
                  </tr>
                </thead>
                <tbody>
                  {filteredOrders.length === 0 && (
                    <tr><td colSpan={9} className="text-center py-8 text-gray-400">対象の受注がありません</td></tr>
                  )}
                  {filteredOrders.map(order => {
                    const subtotal = order.totalQuantity * (order.unitPrice || 0);
                    const total = subtotal + Math.round(subtotal * TAX_RATE);
                    const transmission = getCustomerDataTransmission(order.customerCode);
                    const inv = buildInvoice([order], order.customerCode, order.customerName, 'perOrder');
                    return (
                      <tr key={order.id} className="border-t border-gray-100 hover:bg-blue-50 transition-colors">
                        <td className="px-3 py-2 font-mono text-xs text-blue-700">{order.orderNumber}</td>
                        <td className="px-3 py-2 text-gray-700">{order.customerName}</td>
                        <td className="px-3 py-2 text-gray-600">{order.productName}</td>
                        <td className="px-3 py-2 text-right">{order.totalQuantity.toLocaleString()} {order.unit}</td>
                        <td className="px-3 py-2 text-right">¥{(order.unitPrice || 0).toLocaleString()}</td>
                        <td className="px-3 py-2 text-right font-semibold">¥{total.toLocaleString()}</td>
                        <td className="px-3 py-2 text-center">{transmissionBadge(order.customerCode)}</td>
                        <td className="px-3 py-2 text-center">
                          <span className={`px-2 py-0.5 rounded text-xs ${
                            order.status === '確定' ? 'bg-green-100 text-green-700' :
                            order.status === '分納中' ? 'bg-yellow-100 text-yellow-700' :
                            'bg-gray-100 text-gray-600'
                          }`}>{order.status}</span>
                        </td>
                        <td className="px-3 py-2">
                          <div className="flex gap-1 justify-center">
                            {/* 送信形式が優先、もう片方もサブボタンとして表示 */}
                            {transmission === 'EDI' ? (
                              <>
                                <button
                                  onClick={() => handleOutputInvoice(inv, 'EDI')}
                                  className="px-2 py-1 bg-blue-600 text-white text-xs rounded hover:bg-blue-700"
                                >
                                  CSV出力
                                </button>
                                <button
                                  onClick={() => handleOutputInvoice(inv, 'PDF')}
                                  className="px-2 py-1 bg-gray-200 text-gray-600 text-xs rounded hover:bg-gray-300"
                                  title="弊社フォーマット PDF"
                                >
                                  PDF
                                </button>
                              </>
                            ) : (
                              <>
                                <button
                                  onClick={() => handleOutputInvoice(inv, 'PDF')}
                                  className="px-2 py-1 bg-indigo-600 text-white text-xs rounded hover:bg-indigo-700"
                                >
                                  PDF出力
                                </button>
                                <button
                                  onClick={() => handleOutputInvoice(inv, 'EDI')}
                                  className="px-2 py-1 bg-gray-200 text-gray-600 text-xs rounded hover:bg-gray-300"
                                  title="EDI CSV形式"
                                >
                                  CSV
                                </button>
                              </>
                            )}
                          </div>
                        </td>
                      </tr>
                    );
                  })}
                </tbody>
              </table>
            </div>
          )}

          {/* 月次締めテーブル */}
          {outputMode === 'monthly' && (
            <div className="overflow-x-auto rounded-lg border border-gray-200">
              <table className="w-full text-sm">
                <thead className="bg-gray-700 text-white text-xs">
                  <tr>
                    <th className="px-3 py-2 text-left">得意先</th>
                    <th className="px-3 py-2 text-left">締め月</th>
                    <th className="px-3 py-2 text-center">件数</th>
                    <th className="px-3 py-2 text-right">税抜合計</th>
                    <th className="px-3 py-2 text-right">消費税</th>
                    <th className="px-3 py-2 text-right">税込合計</th>
                    <th className="px-3 py-2 text-center">送信形式</th>
                    <th className="px-3 py-2 text-center">出力</th>
                  </tr>
                </thead>
                <tbody>
                  {monthlyGroups.length === 0 && (
                    <tr><td colSpan={8} className="text-center py-8 text-gray-400">対象の受注がありません</td></tr>
                  )}
                  {monthlyGroups.map(({ customerCode, customerName, orders: grpOrders }) => {
                    const inv = buildInvoice(grpOrders, customerCode, customerName, 'monthly');
                    const transmission = getCustomerDataTransmission(customerCode);
                    return (
                      <tr key={customerCode} className="border-t border-gray-100 hover:bg-blue-50 transition-colors">
                        <td className="px-3 py-2 font-medium text-gray-800">{customerName}</td>
                        <td className="px-3 py-2 text-gray-500">{filterMonth || '全期間'}</td>
                        <td className="px-3 py-2 text-center text-gray-600">{grpOrders.length}件</td>
                        <td className="px-3 py-2 text-right">¥{inv.subtotal.toLocaleString()}</td>
                        <td className="px-3 py-2 text-right text-gray-500">¥{inv.tax.toLocaleString()}</td>
                        <td className="px-3 py-2 text-right font-bold">¥{inv.total.toLocaleString()}</td>
                        <td className="px-3 py-2 text-center">{transmissionBadge(customerCode)}</td>
                        <td className="px-3 py-2">
                          <div className="flex gap-1 justify-center">
                            {transmission === 'EDI' ? (
                              <>
                                <button
                                  onClick={() => handleOutputInvoice(inv, 'EDI')}
                                  className="px-2 py-1 bg-blue-600 text-white text-xs rounded hover:bg-blue-700"
                                >
                                  CSV出力
                                </button>
                                <button
                                  onClick={() => handleOutputInvoice(inv, 'PDF')}
                                  className="px-2 py-1 bg-gray-200 text-gray-600 text-xs rounded hover:bg-gray-300"
                                >
                                  PDF
                                </button>
                              </>
                            ) : (
                              <>
                                <button
                                  onClick={() => handleOutputInvoice(inv, 'PDF')}
                                  className="px-2 py-1 bg-indigo-600 text-white text-xs rounded hover:bg-indigo-700"
                                >
                                  PDF出力
                                </button>
                                <button
                                  onClick={() => handleOutputInvoice(inv, 'EDI')}
                                  className="px-2 py-1 bg-gray-200 text-gray-600 text-xs rounded hover:bg-gray-300"
                                >
                                  CSV
                                </button>
                              </>
                            )}
                          </div>
                        </td>
                      </tr>
                    );
                  })}
                </tbody>
              </table>
            </div>
          )}

          {/* 凡例 */}
          <div className="text-xs text-gray-400 flex gap-4">
            <span><span className="font-bold text-blue-700 mr-1">EDI顧客</span>CSV出力がメインボタン、PDF は補助</span>
            <span><span className="font-bold text-indigo-700 mr-1">PDF顧客</span>弊社フォーマットPDF出力がメインボタン、CSV は補助</span>
          </div>
        </div>
      )}

      {/* ─── 顧客送信設定タブ ─── */}
      {tab === 'customerSettings' && (
        <div className="space-y-3">
          <p className="text-sm text-gray-500">
            請求書の送信形式を顧客ごとに設定します。変更は請求書出力画面のボタン順に即時反映されます。
          </p>
          <div className="overflow-x-auto rounded-lg border border-gray-200">
            <table className="w-full text-sm">
              <thead className="bg-gray-700 text-white text-xs">
                <tr>
                  <th className="px-4 py-2 text-left">得意先コード</th>
                  <th className="px-4 py-2 text-left">得意先名</th>
                  <th className="px-4 py-2 text-center">締め日</th>
                  <th className="px-4 py-2 text-center">伝票送付方法</th>
                  <th className="px-4 py-2 text-center">請求書送信形式</th>
                  <th className="px-4 py-2 text-center">変更</th>
                </tr>
              </thead>
              <tbody>
                {customers.map(c => {
                  const current = getCustomerDataTransmission(c.code);
                  return (
                    <tr key={c.code} className="border-t border-gray-100 hover:bg-gray-50">
                      <td className="px-4 py-2 font-mono text-xs text-gray-500">{c.code}</td>
                      <td className="px-4 py-2 font-medium text-gray-800">{c.name}</td>
                      <td className="px-4 py-2 text-center text-gray-600">{c.billingCycle}</td>
                      <td className="px-4 py-2 text-center text-gray-500 text-xs">{c.shippingMethod}</td>
                      <td className="px-4 py-2 text-center">{transmissionBadge(c.code)}</td>
                      <td className="px-4 py-2 text-center">
                        <div className="flex gap-1 justify-center">
                          <button
                            onClick={() => updateCustomerDataTransmission(c.code, 'PDF')}
                            className={`px-3 py-1 text-xs rounded border transition-colors ${
                              current === 'PDF'
                                ? 'bg-indigo-600 text-white border-indigo-600'
                                : 'bg-white text-gray-500 border-gray-300 hover:border-indigo-400 hover:text-indigo-600'
                            }`}
                          >
                            PDF
                          </button>
                          <button
                            onClick={() => updateCustomerDataTransmission(c.code, 'EDI')}
                            className={`px-3 py-1 text-xs rounded border transition-colors ${
                              current === 'EDI'
                                ? 'bg-blue-600 text-white border-blue-600'
                                : 'bg-white text-gray-500 border-gray-300 hover:border-blue-400 hover:text-blue-600'
                            }`}
                          >
                            EDI
                          </button>
                        </div>
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
          <p className="text-xs text-gray-400">
            ※ 初期値は伝票送付方法が「EDI」または「システム送付」の顧客はEDI、それ以外はPDFです。
          </p>
        </div>
      )}
    </div>
  );
}
