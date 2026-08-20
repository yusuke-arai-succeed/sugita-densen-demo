import { useApp } from '../context/AppContext';

function KpiCard({ label, value, sub, color, onClick }) {
  return (
    <button
      onClick={onClick}
      className="card text-left hover:shadow-md transition-shadow cursor-pointer w-full"
    >
      <div className={`text-3xl font-bold ${color}`}>{value}</div>
      <div className="text-sm font-medium text-slate-700 mt-1">{label}</div>
      {sub && <div className="text-xs text-slate-400 mt-0.5">{sub}</div>}
    </button>
  );
}

function StatusBadge({ status }) {
  const map = {
    '確定': 'bg-blue-100 text-blue-700',
    '分納中': 'bg-yellow-100 text-yellow-700',
    '照会（仮押さえ）': 'bg-orange-100 text-orange-700',
    '完了': 'bg-green-100 text-green-700',
    '進行中': 'bg-blue-100 text-blue-700',
    '未着手': 'bg-slate-100 text-slate-500',
    'キャンセル': 'bg-red-100 text-red-600',
  };
  return (
    <span className={`badge ${map[status] || 'bg-slate-100 text-slate-600'}`}>{status}</span>
  );
}

export default function Dashboard() {
  const { orders, mfgOrders, inventory, deadlineAlerts, setActiveApp, TODAY,
          delayAlerts, currentStock, materialReorderConfig, techRequests } = useApp();

  const confirmedOrders = orders.filter(o => ['確定', '分納中'].includes(o.status)).length;
  const tentativeOrders = orders.filter(o => o.status === '照会（仮押さえ）').length;
  const inProgressMfg = mfgOrders.filter(m => m.status === '進行中').length;
  const completedMfg = mfgOrders.filter(m => m.status === '完了').length;

  const inventoryAnomalies = inventory.filter(i => {
    if (i.actualStock === null) return false;
    const variance = Math.abs(i.theoreticalStock - i.actualStock);
    return i.theoreticalStock > 0 && variance / i.theoreticalStock > 0.1;
  });

  const activeDelayAlerts = (delayAlerts || []).filter(a => a.status === 'active');
  const shortageItems = Object.entries(materialReorderConfig || {}).filter(
    ([matId, cfg]) => (currentStock?.[matId] || 0) <= (cfg.reorderPoint || 0)
  );
  const TODAY_STR = '2026-05-21';
  const overdueTechReqs = (techRequests || []).filter(
    r => r.desiredDate && r.desiredDate < TODAY_STR && r.status !== '完了'
  );

  const totalAlertCount = deadlineAlerts.length + activeDelayAlerts.length
    + shortageItems.length + overdueTechReqs.length + inventoryAnomalies.length;

  // アラート定義（件数 > 0 のものだけ表示）
  const alertDefs = [
    {
      key: 'deadline',
      show: deadlineAlerts.length > 0,
      icon: '⚠️',
      label: '手配期限アラート',
      count: deadlineAlerts.length,
      bg: 'bg-red-50', border: 'border-red-300', labelColor: 'text-red-700', textColor: 'text-red-600',
      details: deadlineAlerts.map(o =>
        `${o.orderNumber}（${o.productName}）— 期限：${o.arrangementDeadline}、現在「${o.status}」`
      ),
      nav: 'order', navLabel: '受注画面へ', btnClass: 'btn-danger',
    },
    {
      key: 'delay',
      show: activeDelayAlerts.length > 0,
      icon: '🏭',
      label: '生産遅延アラート',
      count: activeDelayAlerts.length,
      bg: 'bg-orange-50', border: 'border-orange-300', labelColor: 'text-orange-700', textColor: 'text-orange-600',
      details: activeDelayAlerts.map(a =>
        `${a.orderNumber}（${a.productName}）— ${a.processName}工程`
      ),
      nav: 'production', navLabel: '生産計画へ', btnClass: 'bg-orange-600 hover:bg-orange-700 text-white px-3 py-1.5 rounded-lg text-xs font-medium transition-colors',
    },
    {
      key: 'shortage',
      show: shortageItems.length > 0,
      icon: '📦',
      label: '資材不足（発注点以下）',
      count: shortageItems.length,
      bg: 'bg-amber-50', border: 'border-amber-300', labelColor: 'text-amber-700', textColor: 'text-amber-600',
      details: shortageItems.map(([matId]) => {
        const mat = inventory.find(i => i.itemCode === matId);
        return `${matId}${mat ? '（' + mat.itemName + '）' : ''} — 在庫 ${currentStock?.[matId] ?? 0}`;
      }),
      nav: 'procurement', navLabel: '引当・発注へ', btnClass: 'bg-amber-600 hover:bg-amber-700 text-white px-3 py-1.5 rounded-lg text-xs font-medium transition-colors',
    },
    {
      key: 'techReq',
      show: overdueTechReqs.length > 0,
      icon: '🔧',
      label: '技術依頼 期限超過',
      count: overdueTechReqs.length,
      bg: 'bg-purple-50', border: 'border-purple-300', labelColor: 'text-purple-700', textColor: 'text-purple-600',
      details: overdueTechReqs.map(r => `${r.title || r.id} — 希望日：${r.desiredDate}`),
      nav: 'techRequest', navLabel: '技術依頼へ', btnClass: 'bg-purple-600 hover:bg-purple-700 text-white px-3 py-1.5 rounded-lg text-xs font-medium transition-colors',
    },
    {
      key: 'inventory',
      show: inventoryAnomalies.length > 0,
      icon: '📊',
      label: '棚卸差異（10%超）',
      count: inventoryAnomalies.length,
      bg: 'bg-blue-50', border: 'border-blue-300', labelColor: 'text-blue-700', textColor: 'text-blue-600',
      details: inventoryAnomalies.map(i => `${i.itemCode}（${i.itemName}）— 理論：${i.theoreticalStock}、実棚：${i.actualStock}`),
      nav: 'inventory', navLabel: '棚卸へ', btnClass: 'bg-blue-600 hover:bg-blue-700 text-white px-3 py-1.5 rounded-lg text-xs font-medium transition-colors',
    },
  ].filter(a => a.show);

  // 今後2週間の出荷予定
  const upcoming = [];
  orders.forEach(o => {
    o.shippingSchedule.forEach(s => {
      const d = new Date(s.scheduledDate);
      const diff = Math.ceil((d - TODAY) / (1000 * 60 * 60 * 24));
      if (diff >= 0 && diff <= 14 && s.status !== '出荷済') {
        upcoming.push({ ...s, orderNumber: o.orderNumber, productName: o.productName, customerName: o.customerName });
      }
    });
  });
  upcoming.sort((a, b) => new Date(a.scheduledDate) - new Date(b.scheduledDate));

  return (
    <div className="space-y-6">
      {/* 統合アラートバナー */}
      {totalAlertCount > 0 && (
        <div className="space-y-2">
          <div className="flex items-center gap-2 text-sm font-bold text-slate-700">
            ⚠️ 要対応アラート
            <span className="bg-red-500 text-white text-xs rounded-full px-2 py-0.5">{totalAlertCount}件</span>
          </div>
          {alertDefs.map(alert => (
            <div key={alert.key} className={`alert-banner ${alert.bg} ${alert.border}`}>
              <span className="text-xl shrink-0">{alert.icon}</span>
              <div className="flex-1 min-w-0">
                <div className={`font-bold text-sm flex items-center gap-2 ${alert.labelColor}`}>
                  {alert.label}
                  <span className={`text-xs rounded-full px-2 py-0.5 ${alert.bg} border ${alert.border} ${alert.labelColor}`}>
                    {alert.count}件
                  </span>
                </div>
                <div className={`mt-1 space-y-0.5 ${alert.textColor}`}>
                  {alert.details.map((d, i) => (
                    <div key={i} className="text-xs truncate">▶ {d}</div>
                  ))}
                </div>
              </div>
              <button
                onClick={() => setActiveApp(alert.nav)}
                className={`${alert.btnClass} text-xs whitespace-nowrap shrink-0`}
              >
                {alert.navLabel}
              </button>
            </div>
          ))}
        </div>
      )}

      {/* KPI Cards */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        <KpiCard
          label="受注件数（確定）"
          value={confirmedOrders}
          sub={`仮押さえ ${tentativeOrders}件含む`}
          color="text-blue-700"
          onClick={() => setActiveApp('order')}
        />
        <KpiCard
          label="製造進行中"
          value={inProgressMfg}
          sub={`完了 ${completedMfg}件`}
          color="text-green-600"
          onClick={() => setActiveApp('manufacturing')}
        />
        <KpiCard
          label="要対応アラート"
          value={totalAlertCount}
          sub={`手配期限${deadlineAlerts.length}・遅延${activeDelayAlerts.length}・資材${shortageItems.length}・技術依頼${overdueTechReqs.length}・棚卸${inventoryAnomalies.length}`}
          color={totalAlertCount > 0 ? 'text-red-600' : 'text-slate-400'}
          onClick={() => {}}
        />
        <KpiCard
          label="棚卸差異品目"
          value={inventoryAnomalies.length}
          sub="要確認品目数"
          color={inventoryAnomalies.length > 0 ? 'text-orange-500' : 'text-slate-400'}
          onClick={() => setActiveApp('inventory')}
        />
      </div>

      <div className="grid grid-cols-1 xl:grid-cols-2 gap-6">
        {/* 直近出荷予定 */}
        <div className="card">
          <div className="flex items-center justify-between mb-4">
            <h2 className="font-semibold text-slate-800">📦 直近2週間の出荷予定</h2>
            <button onClick={() => setActiveApp('order')} className="text-xs text-blue-600 hover:underline">詳細 →</button>
          </div>
          {upcoming.length === 0 ? (
            <div className="text-sm text-slate-400 text-center py-4">出荷予定はありません</div>
          ) : (
            <div className="space-y-2">
              {upcoming.map(s => {
                const d = new Date(s.scheduledDate);
                const diff = Math.ceil((d - TODAY) / (1000 * 60 * 60 * 24));
                return (
                  <div key={s.id} className={`flex items-center gap-3 p-3 rounded-lg ${diff <= 3 ? 'bg-orange-50 border border-orange-200' : 'bg-slate-50'}`}>
                    <div className="text-center min-w-[48px]">
                      <div className="text-xs text-slate-400">{s.scheduledDate.slice(5).replace('-', '/')}</div>
                      {diff <= 3 && <div className="text-xs text-orange-600 font-bold">あと{diff}日</div>}
                    </div>
                    <div className="flex-1 min-w-0">
                      <div className="text-xs font-medium text-slate-700 truncate">{s.productName}</div>
                      <div className="text-xs text-slate-400">{s.customerName}</div>
                    </div>
                    <div className="text-right">
                      <div className="text-sm font-bold text-slate-800">{s.quantity.toLocaleString()}m</div>
                      <div className="text-xs text-slate-400">{s.carrier}</div>
                    </div>
                  </div>
                );
              })}
            </div>
          )}
        </div>

        {/* 製造進捗 */}
        <div className="card">
          <div className="flex items-center justify-between mb-4">
            <h2 className="font-semibold text-slate-800">🏭 製造指示一覧</h2>
            <button onClick={() => setActiveApp('manufacturing')} className="text-xs text-blue-600 hover:underline">詳細 →</button>
          </div>
          <div className="space-y-3">
            {mfgOrders.map(m => {
              const completedSteps = m.processSteps.filter(s => s.completed).length;
              const totalSteps = m.processSteps.length;
              const pct = Math.round((completedSteps / totalSteps) * 100);
              return (
                <div key={m.id} className="p-3 bg-slate-50 rounded-lg">
                  <div className="flex items-center justify-between mb-2">
                    <div>
                      <div className="text-xs font-mono text-slate-500">{m.mfgOrderNumber}</div>
                      <div className="text-sm font-medium text-slate-700">{m.productName}</div>
                    </div>
                    <StatusBadge status={m.status} />
                  </div>
                  <div className="flex items-center gap-2">
                    <div className="flex-1 bg-slate-200 rounded-full h-2">
                      <div
                        className={`h-2 rounded-full transition-all ${m.status === '完了' ? 'bg-green-500' : 'bg-blue-500'}`}
                        style={{ width: `${pct}%` }}
                      />
                    </div>
                    <span className="text-xs text-slate-500 min-w-[32px] text-right">{pct}%</span>
                  </div>
                  <div className="flex gap-1 mt-2">
                    {m.processSteps.map(s => (
                      <span key={s.step} className={`text-xs px-1.5 py-0.5 rounded ${s.completed ? 'bg-green-100 text-green-700' : 'bg-slate-200 text-slate-400'}`}>
                        {s.step}
                      </span>
                    ))}
                  </div>
                </div>
              );
            })}
          </div>
        </div>
      </div>

      {/* 受注一覧 */}
      <div className="card">
        <div className="flex items-center justify-between mb-4">
          <h2 className="font-semibold text-slate-800">📋 受注一覧</h2>
          <button onClick={() => setActiveApp('order')} className="text-xs text-blue-600 hover:underline">すべて表示 →</button>
        </div>
        <div className="overflow-x-auto">
          <table className="w-full text-sm">
            <thead>
              <tr className="border-b border-slate-200">
                <th className="text-left py-2 px-3 text-xs font-medium text-slate-500">受注番号</th>
                <th className="text-left py-2 px-3 text-xs font-medium text-slate-500">製品名</th>
                <th className="text-left py-2 px-3 text-xs font-medium text-slate-500">得意先</th>
                <th className="text-right py-2 px-3 text-xs font-medium text-slate-500">数量</th>
                <th className="text-left py-2 px-3 text-xs font-medium text-slate-500">納期</th>
                <th className="text-left py-2 px-3 text-xs font-medium text-slate-500">ステータス</th>
              </tr>
            </thead>
            <tbody>
              {orders.map(o => {
                const isAlert = deadlineAlerts.some(a => a.id === o.id);
                return (
                  <tr key={o.id} className={`border-b border-slate-100 table-row ${isAlert ? 'bg-red-50' : ''}`}>
                    <td className="py-2.5 px-3 font-mono text-xs text-slate-600">
                      {isAlert && <span className="mr-1">⚠️</span>}
                      {o.orderNumber}
                    </td>
                    <td className="py-2.5 px-3 text-slate-800">{o.productName}</td>
                    <td className="py-2.5 px-3 text-slate-600">{o.customerName}</td>
                    <td className="py-2.5 px-3 text-right font-medium">{o.totalQuantity.toLocaleString()} {o.unit}</td>
                    <td className="py-2.5 px-3 text-slate-600">{o.finalDeadline}</td>
                    <td className="py-2.5 px-3"><StatusBadge status={o.status} /></td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
}
