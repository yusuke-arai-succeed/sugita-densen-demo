import { useState } from 'react';
import { useApp } from '../context/AppContext';

const COPPER_TIMING_OPTIONS = ['見積時', '受注時', '出荷時'];
const COPPER_TIMING_LABELS = { '見積時':'見積時確定', '受注時':'受注時確定', '出荷時':'出荷時確定' };

export default function MaterialMaster() {
  const { materials, suppliers, supplierSettings, updateSupplierSetting, copperPrice } = useApp();
  const [tab, setTab] = useState('materials');
  const [editingSupplierId, setEditingSupplierId] = useState(null);
  const [editingTiming, setEditingTiming] = useState(null);

  const copperMaterials = materials.filter(m => m.isCopperBased);
  const nonCopperMaterials = materials.filter(m => !m.isCopperBased);

  const handleTimingSave = () => {
    if (editingSupplierId) {
      updateSupplierSetting(editingSupplierId, { copperPriceTiming: editingTiming });
    }
    setEditingSupplierId(null);
    setEditingTiming(null);
  };

  return (
    <div className="p-4 sm:p-6 space-y-4 max-w-5xl mx-auto">
      <h2 className="text-xl font-bold text-slate-800">②原材料マスター</h2>

      {/* タブ */}
      <div className="flex gap-1 border-b border-slate-200">
        {[['materials','原材料一覧'],['suppliers','取引先マスター']].map(([key,label]) => (
          <button key={key} onClick={() => setTab(key)}
            className={`px-5 py-2 text-sm font-medium border-b-2 transition-colors ${
              tab === key ? 'border-blue-600 text-blue-600' : 'border-transparent text-slate-500 hover:text-slate-700'
            }`}>
            {label}
          </button>
        ))}
      </div>

      {/* ─── 原材料一覧タブ ─────────────────────────────────────── */}
      {tab === 'materials' && (
        <div className="space-y-5">
          {/* 銅系材料 */}
          <div>
            <div className="flex items-center gap-2 mb-2">
              <h3 className="text-sm font-semibold text-slate-700">銅系材料（銅スポット価格連動）</h3>
              <span className="text-xs text-slate-400">現在の銅価格: ¥{copperPrice.toLocaleString()}/kg</span>
            </div>
            <div className="overflow-x-auto rounded-xl border border-slate-200">
              <table className="min-w-full text-sm">
                <thead>
                  <tr className="bg-amber-50 text-slate-600 text-xs">
                    <th className="px-4 py-2.5 text-left font-semibold">コード</th>
                    <th className="px-4 py-2.5 text-left font-semibold">材料名</th>
                    <th className="px-4 py-2.5 text-left font-semibold">カテゴリ</th>
                    <th className="px-4 py-2.5 text-right font-semibold">銅比率</th>
                    <th className="px-4 py-2.5 text-right font-semibold">加工費(¥/kg)</th>
                    <th className="px-4 py-2.5 text-right font-semibold">現在単価(¥/kg)</th>
                    <th className="px-4 py-2.5 text-center font-semibold">単位</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-100">
                  {copperMaterials.map(m => {
                    const currentPrice = m.baseProcessingCost + m.copperRatio * copperPrice;
                    return (
                      <tr key={m.id} className="hover:bg-slate-50">
                        <td className="px-4 py-2.5 font-mono text-slate-500">{m.code}</td>
                        <td className="px-4 py-2.5 font-medium text-slate-800">{m.name}</td>
                        <td className="px-4 py-2.5">
                          <span className="px-2 py-0.5 bg-amber-100 text-amber-800 rounded-full text-xs font-medium">{m.category}</span>
                        </td>
                        <td className="px-4 py-2.5 text-right text-slate-600">{(m.copperRatio * 100).toFixed(1)}%</td>
                        <td className="px-4 py-2.5 text-right text-slate-600">¥{m.baseProcessingCost}</td>
                        <td className="px-4 py-2.5 text-right font-semibold text-slate-800">¥{Math.round(currentPrice).toLocaleString()}</td>
                        <td className="px-4 py-2.5 text-center text-slate-500">{m.unit}</td>
                      </tr>
                    );
                  })}
                </tbody>
              </table>
            </div>
            <p className="text-xs text-slate-400 mt-1.5 ml-1">
              現在単価 = 加工費 + 銅比率 × 銅スポット価格　※銅価格変動で自動更新
            </p>
          </div>

          {/* 非銅系材料 */}
          <div>
            <h3 className="text-sm font-semibold text-slate-700 mb-2">固定単価材料</h3>
            <div className="overflow-x-auto rounded-xl border border-slate-200">
              <table className="min-w-full text-sm">
                <thead>
                  <tr className="bg-slate-50 text-slate-600 text-xs">
                    <th className="px-4 py-2.5 text-left font-semibold">コード</th>
                    <th className="px-4 py-2.5 text-left font-semibold">材料名</th>
                    <th className="px-4 py-2.5 text-left font-semibold">カテゴリ</th>
                    <th className="px-4 py-2.5 text-right font-semibold">標準単価(¥/kg)</th>
                    <th className="px-4 py-2.5 text-center font-semibold">単位</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-100">
                  {nonCopperMaterials.map(m => (
                    <tr key={m.id} className="hover:bg-slate-50">
                      <td className="px-4 py-2.5 font-mono text-slate-500">{m.code}</td>
                      <td className="px-4 py-2.5 font-medium text-slate-800">{m.name}</td>
                      <td className="px-4 py-2.5">
                        <span className="px-2 py-0.5 bg-slate-100 text-slate-600 rounded-full text-xs">{m.category}</span>
                      </td>
                      <td className="px-4 py-2.5 text-right font-semibold text-slate-800">¥{m.standardPrice.toLocaleString()}</td>
                      <td className="px-4 py-2.5 text-center text-slate-500">{m.unit}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>
        </div>
      )}

      {/* ─── 取引先マスタータブ ─────────────────────────────────── */}
      {tab === 'suppliers' && (
        <div className="space-y-3">
          <p className="text-xs text-slate-500">
            銅ベース材料を扱う取引先について、価格決定タイミングを設定します。<br />
            「見積時」→ 見積作成時の銅スポット価格で確定。「受注時」「出荷時」→ 各タイミングの実勢価格を後から反映。
          </p>
          <div className="overflow-x-auto rounded-xl border border-slate-200">
            <table className="min-w-full text-sm">
              <thead>
                <tr className="bg-slate-50 text-slate-600 text-xs">
                  <th className="px-4 py-2.5 text-left font-semibold">取引先名</th>
                  <th className="px-4 py-2.5 text-left font-semibold">担当材料</th>
                  <th className="px-4 py-2.5 text-left font-semibold">担当者</th>
                  <th className="px-4 py-2.5 text-left font-semibold">支払条件</th>
                  <th className="px-4 py-2.5 text-center font-semibold">銅価格決定タイミング</th>
                  <th className="px-4 py-2.5 text-center font-semibold">操作</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100">
                {suppliers.map(s => {
                  const setting = supplierSettings[s.id] || {};
                  const timing = setting.copperPriceTiming;
                  const isEditing = editingSupplierId === s.id;
                  const supMaterials = s.materialIds.map(id => {
                    const m = materials.find(mm => mm.id === id);
                    return m ? m.name.replace(/（.*?）/g, '').trim() : id;
                  }).join('・');
                  const isCopperSupplier = s.materialIds.some(id => {
                    const m = materials.find(mm => mm.id === id);
                    return m?.isCopperBased;
                  });

                  return (
                    <tr key={s.id} className="hover:bg-slate-50">
                      <td className="px-4 py-3 font-medium text-slate-800">{s.name}</td>
                      <td className="px-4 py-3 text-slate-600 text-xs">{supMaterials}</td>
                      <td className="px-4 py-3 text-slate-500">{s.contactName}</td>
                      <td className="px-4 py-3 text-slate-500 text-xs">{s.paymentTerms}</td>
                      <td className="px-4 py-3 text-center">
                        {!isCopperSupplier ? (
                          <span className="text-slate-400 text-xs">非銅材料</span>
                        ) : isEditing ? (
                          <div className="flex items-center gap-1 justify-center">
                            <select value={editingTiming || ''} onChange={e => setEditingTiming(e.target.value || null)}
                              className="border border-slate-200 rounded px-2 py-1 text-sm focus:outline-none focus:ring-2 focus:ring-blue-300">
                              {COPPER_TIMING_OPTIONS.map(opt => (
                                <option key={opt} value={opt}>{opt}</option>
                              ))}
                            </select>
                          </div>
                        ) : (
                          <span className={`px-2.5 py-0.5 rounded-full text-xs font-medium ${
                            timing === '見積時' ? 'bg-blue-100 text-blue-700' :
                            timing === '受注時' ? 'bg-green-100 text-green-700' :
                            timing === '出荷時' ? 'bg-orange-100 text-orange-700' :
                            'bg-slate-100 text-slate-500'
                          }`}>
                            {timing ? COPPER_TIMING_LABELS[timing] : '未設定'}
                          </span>
                        )}
                      </td>
                      <td className="px-4 py-3 text-center">
                        {!isCopperSupplier ? null : isEditing ? (
                          <div className="flex gap-1 justify-center">
                            <button onClick={handleTimingSave} className="btn-primary text-xs px-3 py-1">保存</button>
                            <button onClick={() => { setEditingSupplierId(null); setEditingTiming(null); }}
                              className="btn-secondary text-xs px-3 py-1">キャンセル</button>
                          </div>
                        ) : (
                          <button onClick={() => { setEditingSupplierId(s.id); setEditingTiming(timing || '見積時'); }}
                            className="text-xs text-blue-600 hover:underline">編集</button>
                        )}
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>

          {/* 凡例 */}
          <div className="bg-blue-50 rounded-xl p-4 text-xs text-blue-800 space-y-1">
            <p className="font-semibold">銅価格決定タイミングについて</p>
            <p>• <strong>見積時確定</strong>：見積作成時点の銅スポット価格で材料費を計算。価格変動リスクは自社負担。</p>
            <p>• <strong>受注時確定</strong>：受注確定時の実勢価格で材料費を確定。見積後の価格変動分を吸収。</p>
            <p>• <strong>出荷時確定</strong>：出荷直前の銅スポット価格を使用。価格変動を最大限仕入価格に反映できる。</p>
          </div>
        </div>
      )}
    </div>
  );
}
