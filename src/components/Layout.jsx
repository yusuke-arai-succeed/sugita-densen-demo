import { useState } from 'react';
import { useApp } from '../context/AppContext';

function FractionSettingsModal({ fractionRule, setFractionRule, onClose }) {
  const [rule, setRule] = useState(fractionRule.global || '四捨五入');
  const [decimals, setDecimals] = useState(fractionRule.decimals ?? 2);
  return (
    <div className="fixed inset-0 z-[200] flex items-center justify-center bg-black/40 p-4">
      <div className="bg-white rounded-2xl shadow-2xl w-full max-w-sm">
        <div className="px-6 py-4 border-b border-slate-200 flex items-center justify-between">
          <h2 className="font-bold text-slate-800">⚙️ 端数処理設定</h2>
          <button onClick={onClose} className="text-slate-400 hover:text-slate-600 text-xl">✕</button>
        </div>
        <div className="p-6 space-y-4">
          <div>
            <label className="block text-xs font-medium text-slate-700 mb-2">端数処理方式</label>
            <div className="flex gap-2 flex-wrap">
              {['四捨五入', '切り上げ', '切り捨て'].map(opt => (
                <button key={opt} onClick={() => setRule(opt)}
                  className={`px-4 py-2 rounded-lg text-sm font-semibold border transition-colors ${rule === opt ? 'bg-blue-600 text-white border-blue-600' : 'bg-white text-slate-600 border-slate-200 hover:bg-slate-50'}`}>
                  {opt}
                </button>
              ))}
            </div>
          </div>
          <div>
            <label className="block text-xs font-medium text-slate-700 mb-2">小数点以下桁数</label>
            <div className="flex gap-2">
              {[0, 1, 2, 3].map(d => (
                <button key={d} onClick={() => setDecimals(d)}
                  className={`w-10 h-10 rounded-lg text-sm font-bold border transition-colors ${decimals === d ? 'bg-blue-600 text-white border-blue-600' : 'bg-white text-slate-600 border-slate-200 hover:bg-slate-50'}`}>
                  {d}
                </button>
              ))}
            </div>
          </div>
          <div className="bg-slate-50 rounded-xl p-3 text-xs text-slate-500">
            <div className="font-medium text-slate-700 mb-1">プレビュー</div>
            <div>
              {(() => {
                const n = 123.456789;
                const factor = Math.pow(10, decimals);
                const result = rule === '切り上げ' ? Math.ceil(n * factor) / factor
                  : rule === '切り捨て' ? Math.floor(n * factor) / factor
                  : Math.round(n * factor) / factor;
                return `123.456789 → ${result.toFixed(decimals)}`;
              })()}
            </div>
          </div>
        </div>
        <div className="px-6 py-4 border-t border-slate-200 flex gap-3 justify-end">
          <button onClick={onClose} className="btn-secondary text-sm">キャンセル</button>
          <button onClick={() => { setFractionRule({ global: rule, decimals }); onClose(); }}
            className="btn-primary text-sm">保存</button>
        </div>
      </div>
    </div>
  );
}

// 通常ナビ項目（丸番号なし）
const navItems = [
  { id: 'dashboard',     label: 'ダッシュボード',         icon: '🏠' },
  { id: 'quote',         label: '見積・原価管理',          icon: '💰' },
  { id: 'order',         label: '受注・出荷予定',          icon: '📦' },
  { id: 'procurement',   label: '引当・発注管理',          icon: '🔩' },
  { id: 'production',    label: '生産計画（大日程）',      icon: '🗓️' },
  { id: 'mfgCalendar',  label: '製造カレンダー',          icon: '📅' },
  { id: 'manufacturing', label: '製造日報・進捗',          icon: '🏭' },
  { id: 'label',         label: 'ラベル出力',              icon: '🏷️' },
  { id: 'techRequest',   label: '技術依頼管理',            icon: '📝' },
  { id: 'inspection',    label: '検品・庫入れ',            icon: '🔍' },
  { id: 'inventoryMgmt', label: '在庫管理（入荷・返却）',  icon: '🏪' },
  { id: 'inventory',     label: '実地棚卸・評価',          icon: '📊' },
  { id: 'invoice',       label: '請求書管理',              icon: '🧾' },
];

// マスタデータ折りたたみセクション
const masterItems = [
  { id: 'productMaster',  label: '製品マスター',   icon: '📋' },
  { id: 'materialMaster', label: '原材料マスター', icon: '🔧' },
  { id: 'customerMaster', label: '取引先マスタ',   icon: '🏢' },
  { id: 'equipment',      label: '設備マスター',   icon: '⚙️' },
];

// 全項目（ヘッダータイトル検索用）
const allNavItems = [...navItems, ...masterItems];

export default function Layout({ children }) {
  const { activeApp, setActiveApp, deadlineAlerts, orders, mfgOrders, materialIssuances, currentStock, materialReorderConfig, delayAlerts, techRequests, inventory, fractionRule, setFractionRule } = useApp();
  const [sidebarOpen, setSidebarOpen] = useState(false);
  const [showFractionSettings, setShowFractionSettings] = useState(false);

  // PC用サイドバー折りたたみ（アイコンのみ）
  const [collapsed, setCollapsed] = useState(() => {
    try { return localStorage.getItem('sd_sidebar_collapsed') === 'true'; }
    catch { return false; }
  });

  // マスタデータセクション開閉
  const [masterOpen, setMasterOpen] = useState(() => {
    try { return localStorage.getItem('sd_master_section_open') !== 'false'; }
    catch { return true; }
  });

  const toggleCollapsed = () => {
    const next = !collapsed;
    setCollapsed(next);
    try { localStorage.setItem('sd_sidebar_collapsed', String(next)); } catch {}
  };

  const toggleMasterOpen = () => {
    const next = !masterOpen;
    setMasterOpen(next);
    try { localStorage.setItem('sd_master_section_open', String(next)); } catch {}
  };

  const inProgressMfg = mfgOrders.filter(m => m.status === '進行中').length;
  const pendingOrders = orders.filter(o => o.status === '照会（仮押さえ）').length;
  const pendingReturns = (materialIssuances || []).filter(iss => iss.status === '払出済').length;
  const shortageCount = Object.entries(materialReorderConfig || {}).filter(
    ([matId, cfg]) => (currentStock?.[matId] || 0) <= (cfg.reorderPoint || 0)
  ).length;
  const activeDelayAlerts = (delayAlerts || []).filter(a => a.status === 'active').length;
  const TODAY_STR = '2026-05-21';
  const overdueTechReqs = (techRequests || []).filter(r => r.desiredDate && r.desiredDate < TODAY_STR && r.status !== '完了').length;
  const inventoryAnomalyCount = (inventory || []).filter(i => {
    if (i.actualStock === null) return false;
    const variance = Math.abs(i.theoreticalStock - i.actualStock);
    return i.theoreticalStock > 0 && variance / i.theoreticalStock > 0.1;
  }).length;
  const totalAlertCount = deadlineAlerts.length + activeDelayAlerts + shortageCount + overdueTechReqs + inventoryAnomalyCount;

  const badges = {
    dashboard:     deadlineAlerts.length > 0 ? deadlineAlerts.length : null,
    order:         pendingOrders > 0 ? pendingOrders : null,
    manufacturing: inProgressMfg > 0 ? inProgressMfg : null,
    inventoryMgmt: pendingReturns > 0 ? pendingReturns : null,
    procurement:   shortageCount > 0 ? shortageCount : null,
    production:    activeDelayAlerts > 0 ? activeDelayAlerts : null,
    techRequest:   overdueTechReqs > 0 ? overdueTechReqs : null,
  };

  const handleNav = (id) => {
    setActiveApp(id);
    setSidebarOpen(false);
  };

  // ── 展開時ナビボタン（ラベルあり） ────────────────────────────────
  const NavButton = ({ item }) => {
    const badge = badges[item.id];
    const isActive = activeApp === item.id;
    return (
      <div className="px-3 py-0.5">
        <button
          onClick={() => handleNav(item.id)}
          className={`sidebar-item w-full text-left ${isActive ? 'active' : 'text-slate-600'}`}
        >
          <span className="text-base">{item.icon}</span>
          <span className="flex-1">{item.label}</span>
          {badge && (
            <span className="bg-red-500 text-white text-xs rounded-full w-5 h-5 flex items-center justify-center font-bold">
              {badge}
            </span>
          )}
        </button>
      </div>
    );
  };

  // ── 折りたたみ時ナビボタン（アイコンのみ） ───────────────────────
  const CollapsedNavButton = ({ item }) => {
    const badge = badges[item.id];
    const isActive = activeApp === item.id;
    return (
      <div className="relative group px-2 py-0.5">
        <button
          onClick={() => handleNav(item.id)}
          className={`w-full flex items-center justify-center rounded-lg p-2.5 transition-colors relative ${
            isActive ? 'bg-blue-50 text-blue-700' : 'text-slate-500 hover:bg-slate-100 hover:text-slate-700'
          }`}
        >
          <span className="text-lg leading-none">{item.icon}</span>
          {badge && (
            <span className="absolute top-1 right-1 bg-red-500 text-white text-xs rounded-full w-4 h-4 flex items-center justify-center font-bold leading-none">
              {badge > 9 ? '9+' : badge}
            </span>
          )}
        </button>
        <div className="pointer-events-none absolute left-full top-1/2 -translate-y-1/2 ml-2 z-50
          bg-slate-800 text-white text-xs rounded-lg px-2.5 py-1.5 whitespace-nowrap shadow-lg
          opacity-0 group-hover:opacity-100 transition-opacity duration-150">
          {item.label}
          {badge && <span className="ml-1.5 bg-red-500 text-white rounded-full px-1.5 py-0.5 text-xs font-bold">{badge}</span>}
          <span className="absolute right-full top-1/2 -translate-y-1/2 border-4 border-transparent border-r-slate-800" />
        </div>
      </div>
    );
  };

  // モバイル用サイドバーコンテンツ
  const mobileSidebarContent = (
    <>
      <div className="px-6 py-5 border-b border-slate-200 flex items-center justify-between">
        <div className="flex items-center gap-2">
          <div className="w-8 h-8 bg-blue-700 rounded-lg flex items-center justify-center text-white font-bold text-sm">S</div>
          <div>
            <div className="text-sm font-bold text-slate-800">杉田電線</div>
            <div className="text-xs text-slate-500">基幹管理システム</div>
          </div>
        </div>
        <button
          onClick={() => setSidebarOpen(false)}
          className="p-1.5 rounded-lg hover:bg-slate-100 text-slate-500 text-lg leading-none"
        >✕</button>
      </div>
      <div className="px-4 py-2">
        <div className="text-xs text-slate-400 bg-blue-50 rounded px-2 py-1 text-center font-medium text-blue-600">
          ▶ デモ版 2026-05-21
        </div>
      </div>
      <nav className="flex-1 px-3 py-2 space-y-1 overflow-y-auto">
        {navItems.map(item => {
          const badge = badges[item.id];
          return (
            <button
              key={item.id}
              onClick={() => handleNav(item.id)}
              className={`sidebar-item w-full text-left ${activeApp === item.id ? 'active' : 'text-slate-600'}`}
            >
              <span className="text-base">{item.icon}</span>
              <span className="flex-1">{item.label}</span>
              {badge && (
                <span className="bg-red-500 text-white text-xs rounded-full w-5 h-5 flex items-center justify-center font-bold">
                  {badge}
                </span>
              )}
            </button>
          );
        })}

        {/* モバイル版マスタデータセクション */}
        <button
          onClick={toggleMasterOpen}
          className="w-full flex items-center justify-between px-3 py-2 mt-2 text-xs font-bold text-slate-400 uppercase tracking-wider hover:text-slate-600 transition-colors rounded-lg hover:bg-slate-50"
        >
          <span>マスタデータ</span>
          <span className="text-slate-300">{masterOpen ? '▲' : '▼'}</span>
        </button>
        {masterOpen && masterItems.map(item => (
          <button
            key={item.id}
            onClick={() => handleNav(item.id)}
            className={`sidebar-item w-full text-left ${activeApp === item.id ? 'active' : 'text-slate-600'}`}
          >
            <span className="text-base">{item.icon}</span>
            <span className="flex-1">{item.label}</span>
          </button>
        ))}
      </nav>
      <div className="px-4 py-4 border-t border-slate-200">
        <div className="flex items-center gap-2">
          <div className="w-8 h-8 bg-slate-200 rounded-full flex items-center justify-center text-slate-600 text-sm">細</div>
          <div>
            <div className="text-xs font-medium text-slate-700">細野 様</div>
            <div className="text-xs text-slate-400">管理者</div>
          </div>
        </div>
      </div>
    </>
  );

  return (
    <div className="flex h-screen overflow-hidden bg-slate-100">

      {/* ── モバイル：オーバーレイ背景 ── */}
      {sidebarOpen && (
        <div
          className="fixed inset-0 bg-black/50 z-40 md:hidden"
          onClick={() => setSidebarOpen(false)}
        />
      )}

      {/* ── モバイル：スライドイン ── */}
      <aside
        className={`
          fixed inset-y-0 left-0 z-50 w-72 bg-white border-r border-slate-200 flex flex-col shadow-xl
          transform transition-transform duration-300 ease-in-out
          ${sidebarOpen ? 'translate-x-0' : '-translate-x-full'}
          md:hidden
        `}
      >
        {mobileSidebarContent}
      </aside>

      {/* ── デスクトップ：開閉式サイドバー ── */}
      <aside
        className={`
          hidden md:flex flex-col bg-white border-r border-slate-200 flex-shrink-0 shadow-sm
          transition-all duration-200 ease-in-out relative
          ${collapsed ? 'w-16' : 'w-64'}
        `}
      >
        {/* ロゴ・タイトル */}
        <div className={`border-b border-slate-200 flex items-center flex-shrink-0 ${collapsed ? 'px-0 py-5 justify-center' : 'px-6 py-5 justify-start gap-2'}`}>
          <div className="w-8 h-8 bg-blue-700 rounded-lg flex items-center justify-center text-white font-bold text-sm flex-shrink-0">S</div>
          {!collapsed && (
            <div>
              <div className="text-sm font-bold text-slate-800">杉田電線</div>
              <div className="text-xs text-slate-500">基幹管理システム</div>
            </div>
          )}
        </div>

        {/* デモ版バッジ */}
        {!collapsed && (
          <div className="px-4 py-2">
            <div className="text-xs text-slate-400 bg-blue-50 rounded px-2 py-1 text-center font-medium text-blue-600">
              ▶ デモ版 2026-05-21
            </div>
          </div>
        )}

        {/* ナビゲーション */}
        <nav className="flex-1 py-2 overflow-y-auto overflow-x-hidden">
          {/* 通常ナビ */}
          {navItems.map(item =>
            collapsed
              ? <CollapsedNavButton key={item.id} item={item} />
              : <NavButton key={item.id} item={item} />
          )}

          {/* マスタデータセクション */}
          {collapsed ? (
            // 折りたたみ時：仕切り線のみ（マスタアイコンは常時表示）
            <div className="mx-3 my-2 border-t border-slate-200" />
          ) : (
            // 展開時：トグルボタン
            <div className="px-3 pt-3 pb-1">
              <button
                onClick={toggleMasterOpen}
                className="w-full flex items-center justify-between px-2 py-1.5 rounded-lg text-xs font-bold text-slate-400 uppercase tracking-wider hover:text-slate-600 hover:bg-slate-50 transition-colors"
              >
                <span>マスタデータ</span>
                <span className="text-slate-300 font-normal">{masterOpen ? '▲' : '▼'}</span>
              </button>
            </div>
          )}

          {/* マスタ項目（折りたたみ時は常時表示） */}
          {(collapsed || masterOpen) && masterItems.map(item =>
            collapsed
              ? <CollapsedNavButton key={item.id} item={item} />
              : <NavButton key={item.id} item={item} />
          )}
        </nav>

        {/* ユーザー情報 */}
        <div className={`border-t border-slate-200 ${collapsed ? 'px-2 py-4 flex justify-center' : 'px-4 py-4'}`}>
          {collapsed ? (
            <div className="w-8 h-8 bg-slate-200 rounded-full flex items-center justify-center text-slate-600 text-sm" title="細野 様（管理者）">細</div>
          ) : (
            <div className="flex items-center gap-2">
              <div className="w-8 h-8 bg-slate-200 rounded-full flex items-center justify-center text-slate-600 text-sm">細</div>
              <div>
                <div className="text-xs font-medium text-slate-700">細野 様</div>
                <div className="text-xs text-slate-400">管理者</div>
              </div>
            </div>
          )}
        </div>

        {/* 開閉トグルボタン（右端に絶対配置） */}
        <button
          onClick={toggleCollapsed}
          className="absolute top-1/2 -translate-y-1/2 -right-3 z-10
            w-6 h-6 bg-white border border-slate-200 rounded-full shadow-md
            flex items-center justify-center text-slate-400 hover:text-slate-600 hover:bg-slate-50
            transition-colors text-xs"
          title={collapsed ? 'メニューを展開' : 'メニューを折りたたむ'}
        >
          {collapsed ? '▶' : '◀'}
        </button>
      </aside>

      {/* ── メインコンテンツ ── */}
      <main className="flex-1 flex flex-col overflow-hidden min-w-0">
        {/* Top bar */}
        <header className="bg-white border-b border-slate-200 px-4 md:px-6 py-3 flex items-center justify-between flex-shrink-0 gap-2">
          <div className="flex items-center gap-2 min-w-0">
            {/* ハンバーガーボタン（モバイルのみ） */}
            <button
              onClick={() => setSidebarOpen(true)}
              className="md:hidden flex flex-col gap-1 p-2 rounded-lg hover:bg-slate-100 text-slate-600 flex-shrink-0"
              aria-label="メニューを開く"
            >
              <span className="block w-5 h-0.5 bg-slate-600 rounded" />
              <span className="block w-5 h-0.5 bg-slate-600 rounded" />
              <span className="block w-5 h-0.5 bg-slate-600 rounded" />
            </button>
            <h1 className="text-sm md:text-base font-semibold text-slate-800 truncate">
              {allNavItems.find(i => i.id === activeApp)?.label || 'ダッシュボード'}
            </h1>
          </div>

          <div className="flex items-center gap-2 flex-shrink-0">
            <button
              onClick={() => setShowFractionSettings(true)}
              title={`端数処理: ${fractionRule?.global || '四捨五入'} ${fractionRule?.decimals ?? 2}桁`}
              className="p-1.5 rounded-lg text-slate-400 hover:text-slate-600 hover:bg-slate-100 text-base leading-none transition-colors"
            >⚙️</button>
            {totalAlertCount > 0 && (
              <button
                onClick={() => setActiveApp('dashboard')}
                className="flex items-center gap-1 bg-red-50 border border-red-200 text-red-700 px-2 md:px-3 py-1.5 rounded-lg text-xs font-medium hover:bg-red-100 transition-colors animate-pulse"
              >
                ⚠️ <span className="hidden sm:inline">アラート </span>{totalAlertCount}件
              </button>
            )}
            <div className="hidden sm:block text-xs text-slate-400">今月銅ベース単価：</div>
            <div className="text-sm font-bold text-blue-700">¥1,280/kg</div>
          </div>
        </header>

        {/* Page content */}
        <div className="flex-1 overflow-y-auto p-4 md:p-6">
          {children}
        </div>
      </main>

      {showFractionSettings && (
        <FractionSettingsModal
          fractionRule={fractionRule || { global: '四捨五入', decimals: 2 }}
          setFractionRule={setFractionRule}
          onClose={() => setShowFractionSettings(false)}
        />
      )}
    </div>
  );
}
