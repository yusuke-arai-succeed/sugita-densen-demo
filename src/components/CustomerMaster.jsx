import { Fragment, useState } from 'react';
import { useApp } from '../context/AppContext';

export default function CustomerMaster() {
  const { customers, products, getCustomerDataTransmission, updateCustomerDataTransmission } = useApp();
  const [search, setSearch] = useState('');
  const [expandedCode, setExpandedCode] = useState(null);

  const filtered = customers.filter(c =>
    c.name.includes(search) ||
    c.code.toLowerCase().includes(search.toLowerCase()) ||
    c.contact.includes(search)
  );

  const transmissionBadge = (code) => {
    const t = getCustomerDataTransmission(code);
    return t === 'EDI'
      ? <span className="px-2 py-0.5 bg-blue-100 text-blue-700 rounded text-xs font-bold">EDI</span>
      : <span className="px-2 py-0.5 bg-slate-100 text-slate-600 rounded text-xs font-bold">PDF</span>;
  };

  return (
    <div className="space-y-4">
      <div className="flex items-center gap-3">
        <input
          className="input-field max-w-xs"
          placeholder="得意先名・コード・担当者で検索..."
          value={search}
          onChange={e => setSearch(e.target.value)}
        />
        <span className="text-xs text-slate-400 ml-auto">{filtered.length}社</span>
      </div>

      <div className="card p-0 overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full text-sm">
            <thead className="bg-slate-700 text-white text-xs">
              <tr>
                <th className="text-left py-3 px-4 font-medium">コード</th>
                <th className="text-left py-3 px-4 font-medium">得意先名</th>
                <th className="text-left py-3 px-4 font-medium">担当者</th>
                <th className="text-center py-3 px-4 font-medium">締め日</th>
                <th className="text-center py-3 px-4 font-medium">伝票送付</th>
                <th className="text-center py-3 px-4 font-medium">ラベル形式</th>
                <th className="text-center py-3 px-4 font-medium">客先製番</th>
                <th className="text-center py-3 px-4 font-medium">請求送信形式</th>
                <th className="text-center py-3 px-4 font-medium">切替</th>
                <th className="text-center py-3 px-4 font-medium">登録製品</th>
              </tr>
            </thead>
            <tbody>
              {filtered.map(c => {
                const linkedProducts = products.filter(p => p.customerCode === c.code);
                const isExpanded = expandedCode === c.code;
                const current = getCustomerDataTransmission(c.code);
                return (
                  <Fragment key={c.code}>
                    <tr
                      className="border-b border-slate-100 hover:bg-slate-50 transition-colors cursor-pointer"
                      onClick={() => setExpandedCode(isExpanded ? null : c.code)}
                    >
                      <td className="py-3 px-4 font-mono text-xs text-slate-500">{c.code}</td>
                      <td className="py-3 px-4 font-medium text-slate-800">{c.name}</td>
                      <td className="py-3 px-4 text-slate-600">{c.contact}</td>
                      <td className="py-3 px-4 text-center text-slate-600">{c.billingCycle}</td>
                      <td className="py-3 px-4 text-center text-slate-500 text-xs">{c.shippingMethod}</td>
                      <td className="py-3 px-4 text-center">
                        <span className="badge bg-purple-50 text-purple-700">{c.labelFormat || '標準'}</span>
                      </td>
                      <td className="py-3 px-4 text-center">
                        <span className={`text-xs font-medium ${c.customerCodeOnLabel ? 'text-green-700' : 'text-slate-400'}`}>
                          {c.customerCodeOnLabel ? '要' : '不要'}
                        </span>
                      </td>
                      <td className="py-3 px-4 text-center" onClick={e => e.stopPropagation()}>
                        {transmissionBadge(c.code)}
                      </td>
                      <td className="py-3 px-4 text-center" onClick={e => e.stopPropagation()}>
                        <div className="flex gap-1 justify-center">
                          <button
                            onClick={() => updateCustomerDataTransmission(c.code, 'PDF')}
                            className={`px-2 py-0.5 text-xs rounded border transition-colors ${
                              current === 'PDF'
                                ? 'bg-indigo-600 text-white border-indigo-600'
                                : 'bg-white text-slate-400 border-slate-200 hover:border-indigo-400'
                            }`}
                          >PDF</button>
                          <button
                            onClick={() => updateCustomerDataTransmission(c.code, 'EDI')}
                            className={`px-2 py-0.5 text-xs rounded border transition-colors ${
                              current === 'EDI'
                                ? 'bg-blue-600 text-white border-blue-600'
                                : 'bg-white text-slate-400 border-slate-200 hover:border-blue-400'
                            }`}
                          >EDI</button>
                        </div>
                      </td>
                      <td className="py-3 px-4 text-center">
                        <span className="badge bg-blue-50 text-blue-700">
                          {linkedProducts.length}件
                        </span>
                        <span className="ml-1 text-slate-300 text-xs">{isExpanded ? '▲' : '▼'}</span>
                      </td>
                    </tr>
                    {isExpanded && (
                      <tr className="bg-slate-50 border-b border-slate-200">
                        <td colSpan={10} className="px-8 py-3">
                          {linkedProducts.length === 0 ? (
                            <span className="text-xs text-slate-400">登録製品なし</span>
                          ) : (
                            <div className="flex flex-wrap gap-2">
                              {linkedProducts.map(p => (
                                <span key={p.id} className="inline-flex items-center gap-1 bg-white border border-slate-200 rounded-lg px-2 py-1 text-xs text-slate-700 shadow-sm">
                                  <span className="font-mono text-slate-400">{p.productCode}</span>
                                  <span>{p.name}</span>
                                </span>
                              ))}
                            </div>
                          )}
                        </td>
                      </tr>
                    )}
                  </Fragment>
                );
              })}
            </tbody>
          </table>
        </div>
      </div>

      <p className="text-xs text-slate-400">
        ※ 行をクリックすると紐付き製品一覧を展開します。「請求送信形式」の切替は請求書管理画面にも即時反映されます。
      </p>
    </div>
  );
}
