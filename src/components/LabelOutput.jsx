import { useState } from 'react';
import { useApp } from '../context/AppContext';

const PRINTERS = ['1号機', '2号機', '3号機'];
const PAPER_TYPES = ['標準', 'TSEマーク', 'PSマーク', 'ULマーク'];

const LABEL_STATUS_COLORS = {
  '出力可':   'bg-green-100 text-green-800',
  '検査待ち': 'bg-yellow-100 text-yellow-800',
  '未出力':   'bg-slate-100 text-slate-600',
  '出力済':   'bg-blue-100 text-blue-700',
};

// ── ラベルプレビュー ─────────────────────────────────────────────
function LabelPreview({ order, product, customer, paperType }) {
  const ls = product?.labelSettings || {};
  const effectivePaper = paperType || ls.paperType || '標準';
  return (
    <div style={{ width: 300, fontFamily: 'monospace', fontSize: 11 }}
      className="border-2 border-slate-700 rounded p-3 bg-white shadow-inner select-none">
      <div className="flex items-center justify-between border-b border-slate-400 pb-1 mb-2">
        <span className="font-bold text-sm" style={{ fontFamily: 'sans-serif' }}>杉田電線株式会社</span>
        {effectivePaper !== '標準' && (
          <span className="border border-slate-700 px-1.5 py-0.5 text-xs font-bold rounded-sm">{effectivePaper}</span>
        )}
      </div>
      <div className="space-y-1">
        <div className="font-semibold text-slate-900 text-xs leading-tight">{order.productName}</div>
        <div className="grid grid-cols-2 gap-x-2 text-xs text-slate-600 mt-1">
          <div><span className="text-slate-400">色:</span> {product?.sheathColor || '-'}</div>
          <div><span className="text-slate-400">荷姿:</span> {order.packaging || '-'}</div>
          <div><span className="text-slate-400">条長:</span> {order.totalQuantity?.toLocaleString()}{order.unit}</div>
          <div><span className="text-slate-400">梱包:</span> {order.packaging?.replace(/\(.*\)/, '') || '-'}</div>
        </div>
        <div className="border-t border-dashed border-slate-300 pt-1 mt-1 space-y-0.5 text-xs">
          <div><span className="text-slate-400">得意先:</span> {order.customerName}</div>
          {customer?.customerCodeOnLabel && order.customerProductName && (
            <div><span className="text-slate-400">客先製番:</span> {order.customerProductName}</div>
          )}
          {order.customerOrderNum1 && (
            <div><span className="text-slate-400">客先注番:</span> {order.customerOrderNum1}</div>
          )}
          <div><span className="text-slate-400">受注番号:</span> {order.orderNumber}</div>
        </div>
        <div className="border-t border-dashed border-slate-300 pt-1 mt-1 flex items-center justify-between">
          <span className="text-xs text-slate-400">自動生成 · 杉田電線MES</span>
          <div className="w-12 h-12 border border-slate-300 rounded-sm flex items-center justify-center text-slate-300 text-xs">QR</div>
        </div>
      </div>
    </div>
  );
}

// ── 発行モーダル ─────────────────────────────────────────────────
function LabelIssueModal({ order, product, customer, onClose, onIssue }) {
  const ls = product?.labelSettings || {};
  const [printer, setPrinter] = useState(ls.printer || '1号機');
  const [paperType, setPaperType] = useState(ls.paperType || '標準');
  const [copies, setCopies] = useState(1);

  return (
    <div className="fixed inset-0 bg-black/50 z-50 flex items-center justify-center p-4"
      onMouseDown={e => { if (e.target === e.currentTarget) onClose(); }}>
      <div className="bg-white rounded-xl shadow-2xl w-full max-w-2xl max-h-[90vh] overflow-y-auto">
        <div className="px-6 py-4 border-b border-slate-200 flex items-center justify-between">
          <div>
            <h3 className="font-bold text-slate-800">ラベル発行</h3>
            <p className="text-xs text-slate-500 mt-0.5">{order.orderNumber} — {order.productName}</p>
          </div>
          <button onClick={onClose} className="text-slate-400 hover:text-slate-600 text-xl leading-none">✕</button>
        </div>
        <div className="p-6">
          <div className="flex gap-6 items-start flex-wrap">
            <div>
              <p className="text-xs text-slate-500 font-medium mb-2">ラベルプレビュー（自動生成）</p>
              <LabelPreview order={order} product={product} customer={customer} paperType={paperType} />
              <p className="text-xs text-slate-400 mt-2 max-w-[300px]">
                受注データ（色・条長・客先製番）をシステムが自動引用
              </p>
            </div>
            <div className="flex-1 min-w-[200px] space-y-4">
              <div>
                <label className="block text-xs font-medium text-slate-600 mb-1">使用プリンタ</label>
                <div className="w-full">
                  <select className="select-field text-sm" value={printer} onChange={e => setPrinter(e.target.value)}>
                    {PRINTERS.map(p => <option key={p} value={p}>{p}</option>)}
                  </select>
                </div>
                <p className="text-xs text-slate-400 mt-0.5">マスター設定: {ls.printer || '未設定'}</p>
              </div>
              <div>
                <label className="block text-xs font-medium text-slate-600 mb-1">台紙種類</label>
                <div className="w-full">
                  <select className="select-field text-sm" value={paperType} onChange={e => setPaperType(e.target.value)}>
                    {PAPER_TYPES.map(p => <option key={p} value={p}>{p}</option>)}
                  </select>
                </div>
                <p className="text-xs text-slate-400 mt-0.5">マスター設定: {ls.paperType || '標準'}</p>
              </div>
              <div>
                <label className="block text-xs font-medium text-slate-600 mb-1">発行枚数</label>
                <div className="flex items-center gap-2">
                  <button onClick={() => setCopies(c => Math.max(1, c - 1))}
                    className="w-8 h-8 border border-slate-300 rounded-lg text-lg leading-none hover:bg-slate-100 font-bold text-slate-600">−</button>
                  <span className="w-10 text-center font-bold text-slate-800 text-lg">{copies}</span>
                  <button onClick={() => setCopies(c => Math.min(20, c + 1))}
                    className="w-8 h-8 border border-slate-300 rounded-lg text-lg leading-none hover:bg-slate-100 font-bold text-slate-600">＋</button>
                  <span className="text-sm text-slate-500">枚</span>
                </div>
              </div>
              <div className="bg-slate-50 rounded-lg p-3 space-y-1 text-xs">
                <div className="font-medium text-slate-600 mb-1">自動反映済みの情報</div>
                <div className="text-slate-500">・ 受注番号をキーに色・条長・客先製番を引用</div>
                <div className="text-slate-500">・ 製品マスターのラベル設定を適用</div>
                <div className="text-slate-500">・ 得意先フォーマット: {customer?.labelFormat || '標準'}</div>
                {ls.inspectionRequired && (
                  <div className="text-green-700 font-medium mt-1">✓ 検査合格確認済 → 出力許可</div>
                )}
              </div>
            </div>
          </div>
        </div>
        <div className="px-6 py-4 border-t border-slate-200 flex justify-end gap-3">
          <button onClick={onClose} className="btn-secondary">キャンセル</button>
          <button onClick={() => onIssue({ printer, paperType, copies })} className="btn-primary">
            🖨️ {copies}枚 発行する
          </button>
        </div>
      </div>
    </div>
  );
}

// ── メイン画面 ───────────────────────────────────────────────────
export default function LabelOutput() {
  const { orders, setOrders, products, customers, labelIssuances, setLabelIssuances } = useApp();

  const [tab, setTab] = useState('list');
  const [filterSearch, setFilterSearch] = useState('');
  const [filterStatus, setFilterStatus] = useState('');
  const [issueTarget, setIssueTarget] = useState(null);

  // 照会・完了以外の仕掛中受注を対象にする
  const activeOrders = orders.filter(o => o.status !== '照会（仮押さえ）' && o.status !== '完了');

  const filteredOrders = activeOrders.filter(o => {
    if (filterSearch) {
      const q = filterSearch.toLowerCase();
      if (!o.orderNumber.toLowerCase().includes(q) &&
          !o.productName.toLowerCase().includes(q) &&
          !o.customerName.toLowerCase().includes(q)) return false;
    }
    if (filterStatus && o.labelStatus !== filterStatus) return false;
    return true;
  });

  const readyOrders   = filteredOrders.filter(o => o.labelStatus === '出力可');
  const waitingOrders = filteredOrders.filter(o => o.labelStatus === '検査待ち' || o.labelStatus === '未出力');
  const issuedOrders  = filteredOrders.filter(o => o.labelStatus === '出力済');

  const stats = {
    ready:   activeOrders.filter(o => o.labelStatus === '出力可').length,
    waiting: activeOrders.filter(o => o.labelStatus === '検査待ち').length,
    pending: activeOrders.filter(o => o.labelStatus === '未出力').length,
    issued:  activeOrders.filter(o => o.labelStatus === '出力済').length,
  };

  const handleIssue = ({ printer, paperType, copies }) => {
    const order = issueTarget;
    const newEntry = {
      id: `LBL-${String(labelIssuances.length + 1).padStart(3, '0')}`,
      orderId: order.id,
      orderNumber: order.orderNumber,
      productName: order.productName,
      customerName: order.customerName,
      color: products.find(p => p.id === order.productId)?.sheathColor || '-',
      totalQuantity: order.totalQuantity,
      packaging: order.packaging,
      printer, paperType, copies,
      issuedAt: new Date().toISOString(),
      issuedBy: '細野',
    };
    setLabelIssuances(prev => [newEntry, ...prev]);
    setOrders(prev => prev.map(o => o.id === order.id ? { ...o, labelStatus: '出力済' } : o));
    setIssueTarget(null);
  };

  const thClass = 'px-3 py-2 text-left text-xs font-semibold text-slate-500 uppercase tracking-wider whitespace-nowrap';
  const tdClass = 'px-3 py-2 text-sm text-slate-700';

  const OrderTable = ({ rows, showIssueBtn = false }) => (
    <div className="overflow-x-auto">
      <table className="w-full text-sm">
        <thead className="bg-slate-50 border-b border-slate-200">
          <tr>
            <th className={thClass}>受注番号</th>
            <th className={thClass}>得意先</th>
            <th className={thClass}>製品名</th>
            <th className={`${thClass} text-right`}>数量</th>
            <th className={thClass}>プリンタ</th>
            <th className={thClass}>台紙</th>
            <th className={thClass}>検査</th>
            <th className={thClass}>ステータス</th>
            {showIssueBtn && <th className={thClass}>操作</th>}
          </tr>
        </thead>
        <tbody className="divide-y divide-slate-100">
          {rows.length === 0 && (
            <tr><td colSpan={9} className="text-center py-6 text-slate-400">該当なし</td></tr>
          )}
          {rows.map(order => {
            const product = products.find(p => p.id === order.productId);
            const customer = customers.find(c => c.code === order.customerCode);
            const ls = product?.labelSettings || {};
            return (
              <tr key={order.id} className="hover:bg-slate-50 transition-colors">
                <td className={tdClass}><span className="font-mono text-xs">{order.orderNumber}</span></td>
                <td className={`${tdClass} max-w-[140px] truncate`} title={order.customerName}>{order.customerName}</td>
                <td className={`${tdClass} max-w-[200px] truncate`} title={order.productName}>{order.productName}</td>
                <td className={`${tdClass} text-right`}>{order.totalQuantity?.toLocaleString()}{order.unit}</td>
                <td className={tdClass}>
                  <span className="text-xs bg-blue-50 text-blue-700 px-1.5 py-0.5 rounded font-medium">{ls.printer || '-'}</span>
                </td>
                <td className={tdClass}>
                  <span className="text-xs bg-slate-100 text-slate-600 px-1.5 py-0.5 rounded">{ls.paperType || '標準'}</span>
                </td>
                <td className={tdClass}>
                  <span className={`text-xs font-medium ${ls.inspectionRequired ? 'text-yellow-700' : 'text-slate-400'}`}>
                    {ls.inspectionRequired ? '要' : '不要'}
                  </span>
                </td>
                <td className={tdClass}>
                  <span className={`text-xs font-medium px-2 py-0.5 rounded-full ${LABEL_STATUS_COLORS[order.labelStatus] || ''}`}>
                    {order.labelStatus || '未出力'}
                  </span>
                </td>
                {showIssueBtn && (
                  <td className={tdClass}>
                    <button onClick={() => setIssueTarget(order)}
                      className="text-xs bg-green-600 hover:bg-green-700 text-white px-3 py-1 rounded-lg transition-colors font-medium">
                      🖨️ 発行
                    </button>
                  </td>
                )}
              </tr>
            );
          })}
        </tbody>
      </table>
    </div>
  );

  return (
    <div className="space-y-4">
      <h2 className="text-lg font-bold text-slate-800">ラベル出力</h2>

      {/* サマリーカード */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
        <div className="card p-4 border-l-4 border-green-500">
          <div className="text-2xl font-bold text-green-700">{stats.ready}</div>
          <div className="text-xs text-slate-500 mt-1">出力可能</div>
        </div>
        <div className="card p-4 border-l-4 border-yellow-400">
          <div className="text-2xl font-bold text-yellow-700">{stats.waiting}</div>
          <div className="text-xs text-slate-500 mt-1">検査待ち</div>
        </div>
        <div className="card p-4 border-l-4 border-slate-300">
          <div className="text-2xl font-bold text-slate-600">{stats.pending}</div>
          <div className="text-xs text-slate-500 mt-1">未出力（製造中）</div>
        </div>
        <div className="card p-4 border-l-4 border-blue-400">
          <div className="text-2xl font-bold text-blue-700">{stats.issued}</div>
          <div className="text-xs text-slate-500 mt-1">発行済（仕掛中）</div>
        </div>
      </div>

      {/* タブ */}
      <div className="flex gap-1 border-b border-slate-200">
        {[['list', 'ラベル出力一覧'], ['history', `発行履歴（${labelIssuances.length}件）`]].map(([id, label]) => (
          <button key={id} onClick={() => setTab(id)}
            className={`px-4 py-2 text-sm font-medium border-b-2 transition-colors ${tab === id ? 'border-blue-600 text-blue-700' : 'border-transparent text-slate-500 hover:text-slate-700'}`}>
            {label}
          </button>
        ))}
      </div>

      {tab === 'list' && (
        <>
          {/* フィルタ */}
          <div className="card py-2.5 px-4">
            <div className="flex items-center gap-2 flex-wrap">
              <div className="w-52 flex-shrink-0">
                <input type="text" className="input-field text-sm py-1.5"
                  placeholder="受注番号・製品名・得意先 検索"
                  value={filterSearch} onChange={e => setFilterSearch(e.target.value)} />
              </div>
              <div className="w-32 flex-shrink-0">
                <select className="select-field text-sm py-1.5" value={filterStatus} onChange={e => setFilterStatus(e.target.value)}>
                  <option value="">全ステータス</option>
                  <option value="出力可">出力可</option>
                  <option value="検査待ち">検査待ち</option>
                  <option value="未出力">未出力</option>
                  <option value="出力済">出力済</option>
                </select>
              </div>
              {(filterSearch || filterStatus) && (
                <button onClick={() => { setFilterSearch(''); setFilterStatus(''); }}
                  className="text-xs text-slate-500 hover:text-red-600 px-2 py-1 rounded hover:bg-red-50 transition-colors">
                  クリア
                </button>
              )}
              <span className="ml-auto text-xs text-slate-400">{filteredOrders.length}件 / 全{activeOrders.length}件</span>
            </div>
          </div>

          {/* 出力可能セクション */}
          {(readyOrders.length > 0 || !filterStatus || filterStatus === '出力可') && (
            <div className="card overflow-hidden">
              <div className="px-4 py-2.5 bg-green-50 border-b border-green-100 flex items-center gap-2">
                <span className="text-green-700 font-semibold text-sm">出力可能</span>
                <span className="bg-green-100 text-green-800 text-xs rounded-full px-2 py-0.5 font-medium">{readyOrders.length}件</span>
                <span className="ml-auto text-xs text-green-600">ラベル発行ボタンを押すと発行履歴に記録されます</span>
              </div>
              <OrderTable rows={readyOrders} showIssueBtn={true} />
            </div>
          )}

          {/* 検査待ち・未出力セクション */}
          {(waitingOrders.length > 0 || (filterStatus && filterStatus !== '出力可' && filterStatus !== '出力済')) && (
            <div className="card overflow-hidden">
              <div className="px-4 py-2.5 bg-yellow-50 border-b border-yellow-100 flex items-center gap-2">
                <span className="text-yellow-700 font-semibold text-sm">出力待ち（製造中 / 検査待ち）</span>
                <span className="bg-yellow-100 text-yellow-800 text-xs rounded-full px-2 py-0.5 font-medium">{waitingOrders.length}件</span>
                <span className="ml-auto text-xs text-yellow-600">検査合格 または 製造完了後に出力可能になります</span>
              </div>
              <OrderTable rows={waitingOrders} showIssueBtn={false} />
            </div>
          )}

          {/* 発行済セクション */}
          {(issuedOrders.length > 0 || filterStatus === '出力済') && (
            <div className="card overflow-hidden">
              <div className="px-4 py-2.5 bg-blue-50 border-b border-blue-100 flex items-center gap-2">
                <span className="text-blue-700 font-semibold text-sm">発行済</span>
                <span className="bg-blue-100 text-blue-800 text-xs rounded-full px-2 py-0.5 font-medium">{issuedOrders.length}件</span>
              </div>
              <OrderTable rows={issuedOrders} showIssueBtn={false} />
            </div>
          )}

          {filteredOrders.length === 0 && (
            <div className="card p-10 text-center text-slate-400">該当データなし</div>
          )}
        </>
      )}

      {tab === 'history' && (
        <div className="card overflow-hidden">
          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead className="bg-slate-50 border-b border-slate-200">
                <tr>
                  <th className={thClass}>発行日時</th>
                  <th className={thClass}>担当者</th>
                  <th className={thClass}>受注番号</th>
                  <th className={thClass}>得意先</th>
                  <th className={thClass}>製品名</th>
                  <th className={`${thClass} text-right`}>数量</th>
                  <th className={thClass}>プリンタ</th>
                  <th className={thClass}>台紙</th>
                  <th className={`${thClass} text-right`}>枚数</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100">
                {labelIssuances.length === 0 && (
                  <tr><td colSpan={9} className="text-center py-10 text-slate-400">発行履歴なし</td></tr>
                )}
                {labelIssuances.map(rec => (
                  <tr key={rec.id} className="hover:bg-slate-50">
                    <td className={`${tdClass} whitespace-nowrap`}>
                      {new Date(rec.issuedAt).toLocaleString('ja-JP', { month: '2-digit', day: '2-digit', hour: '2-digit', minute: '2-digit' })}
                    </td>
                    <td className={tdClass}>{rec.issuedBy}</td>
                    <td className={tdClass}><span className="font-mono text-xs">{rec.orderNumber}</span></td>
                    <td className={`${tdClass} max-w-[120px] truncate`} title={rec.customerName}>{rec.customerName}</td>
                    <td className={`${tdClass} max-w-[180px] truncate`} title={rec.productName}>{rec.productName}</td>
                    <td className={`${tdClass} text-right`}>{rec.totalQuantity?.toLocaleString()}{rec.packaging ? '' : ''}</td>
                    <td className={tdClass}><span className="text-xs bg-blue-50 text-blue-700 px-1.5 py-0.5 rounded font-medium">{rec.printer}</span></td>
                    <td className={tdClass}><span className="text-xs bg-slate-100 text-slate-600 px-1.5 py-0.5 rounded">{rec.paperType}</span></td>
                    <td className={`${tdClass} text-right font-bold text-slate-800`}>{rec.copies}枚</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {issueTarget && (
        <LabelIssueModal
          order={issueTarget}
          product={products.find(p => p.id === issueTarget.productId)}
          customer={customers.find(c => c.code === issueTarget.customerCode)}
          onClose={() => setIssueTarget(null)}
          onIssue={handleIssue}
        />
      )}
    </div>
  );
}
