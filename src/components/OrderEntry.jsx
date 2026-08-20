import { useState } from 'react';
import { useApp } from '../context/AppContext';
import DocumentOutputModal from './DocumentOutput';

const statusColors = {
  '照会（仮押さえ）': 'bg-orange-100 text-orange-700',
  '確定': 'bg-blue-100 text-blue-700',
  '分納中': 'bg-purple-100 text-purple-700',
  '完了': 'bg-green-100 text-green-700',
  'キャンセル': 'bg-red-100 text-red-500',
};
const shipStatusColors = {
  '未出荷': 'bg-slate-100 text-slate-600',
  '出荷済': 'bg-green-100 text-green-700',
};
const CARRIERS = ['チャーター','路線','新潟運輸','トナミ運輸','第一貨物','佐川急便','クロネコヤマト','その他'];
const PACKAGINGS = ['ドラム(D400)','ドラム(D500)','ドラム(D600)','束','把','m'];
const PRICE_CATS = [{value:'A',label:'A：決定単価'},{value:'K',label:'K：仮単価'},{value:'T',label:'T：一括単価'}];
const PRICE_CAT_COLORS = {A:'bg-blue-100 text-blue-700',K:'bg-orange-100 text-orange-700',T:'bg-purple-100 text-purple-700'};

// ─── ソートアイコン ──────────────────────────────────────────────────────────
function SortIcon({ field, sortField, sortDir }) {
  if (sortField !== field) return <span className="opacity-25 ml-0.5 text-xs">↕</span>;
  return <span className="text-blue-600 ml-0.5 text-xs">{sortDir === 'asc' ? '↑' : '↓'}</span>;
}

// ─── 削除確認ダイアログ ──────────────────────────────────────────────────────
function DeleteConfirmDialog({ schedule, onConfirm, onCancel }) {
  const d = new Date(schedule.scheduledDate);
  const today = new Date('2026-05-21');
  const diff = Math.ceil((d - today) / (1000 * 60 * 60 * 24));
  const isUrgent = diff <= 7;
  return (
    <div className="fixed inset-0 z-[70] flex items-center justify-center bg-black/40">
      <div className="bg-white rounded-xl shadow-2xl max-w-sm w-full p-6 mx-4">
        <div className={`text-3xl mb-3 text-center ${isUrgent ? 'animate-bounce' : ''}`}>{isUrgent ? '⚠️' : '❓'}</div>
        <h3 className={`font-bold text-center mb-2 ${isUrgent ? 'text-red-700' : 'text-slate-800'}`}>
          {isUrgent ? '出荷日が迫っています！' : '削除の確認'}
        </h3>
        <p className="text-sm text-slate-600 text-center mb-4">
          {schedule.scheduledDate} 出荷予定（{schedule.quantity.toLocaleString()}m）を本当に削除しますか？
          {isUrgent && <span className="block mt-1 text-red-600 font-medium">出荷まであと{diff}日です。削除すると復元できません。</span>}
        </p>
        <div className="flex gap-3">
          <button onClick={onCancel} className="flex-1 btn-secondary">キャンセル（削除しない）</button>
          <button onClick={onConfirm} className="flex-1 btn-danger">削除する</button>
        </div>
      </div>
    </div>
  );
}

// ─── ガントチャート ──────────────────────────────────────────────────────────
function GanttChart({ orders }) {
  const startDate = new Date('2026-05-01');
  const endDate   = new Date('2026-08-31');
  const today     = new Date('2026-05-21');
  const todayPct  = ((today - startDate) / (endDate - startDate)) * 100;
  return (
    <div className="card overflow-hidden">
      <h3 className="font-semibold text-slate-800 mb-4">📅 ガントチャート（出荷予定）</h3>
      <div className="overflow-x-auto">
        <div style={{ minWidth: '800px' }}>
          <div className="flex text-xs text-slate-500 mb-1 border-b pb-1">
            <div className="w-48 flex-shrink-0 text-xs text-slate-400 pr-2">受注番号 / 製品</div>
            <div className="flex-1 relative flex">
              {['5月','6月','7月','8月'].map(m => (
                <div key={m} className="flex-1 text-center border-r border-slate-100 last:border-0">{m}</div>
              ))}
            </div>
          </div>
          <div className="relative">
            {orders.map(o => (
              <div key={o.id} className="flex items-center mb-3">
                <div className="w-48 flex-shrink-0 pr-2">
                  <div className="text-xs font-mono text-slate-500">{o.orderNumber}</div>
                  <div className="text-xs text-slate-700 truncate">{o.productName}</div>
                </div>
                <div className="flex-1 relative h-8 bg-slate-50 rounded border border-slate-100">
                  <div className="absolute top-0 bottom-0 w-px bg-red-400 z-10" style={{ left: `${todayPct}%` }} />
                  <div className="absolute top-1 bottom-1 rounded bg-slate-200"
                    style={{ left:`${Math.max(0,((new Date(o.finalDeadline)-startDate)/(endDate-startDate))*100-0.5)}%`, width:'1%', minWidth:'2px' }}
                    title={`納期: ${o.finalDeadline}`} />
                  {o.shippingSchedule.map(s => {
                    const left = ((new Date(s.scheduledDate) - startDate) / (endDate - startDate)) * 100;
                    return (
                      <div key={s.id}
                        className={`absolute top-1 bottom-1 rounded ${s.status==='出荷済'?'bg-green-400':'bg-blue-500'} opacity-80`}
                        style={{ left:`${Math.max(0,left-1)}%`, width:'2%', minWidth:'4px' }}
                        title={`${s.scheduledDate}: ${s.quantity.toLocaleString()}m (${s.status})`} />
                    );
                  })}
                </div>
              </div>
            ))}
          </div>
          <div className="text-xs text-slate-400 mt-2 flex gap-4">
            <span><span className="inline-block w-3 h-3 rounded bg-blue-500 mr-1" />出荷予定</span>
            <span><span className="inline-block w-3 h-3 rounded bg-green-400 mr-1" />出荷済</span>
            <span><span className="inline-block w-0.5 h-3 bg-red-400 mr-1" />本日</span>
          </div>
        </div>
      </div>
    </div>
  );
}

function ModalLabel({ t, req }) {
  return <label className="text-xs text-slate-500 block mb-1">{t}{req && <span className="text-red-500 ml-0.5">*</span>}</label>;
}
function ModalSection({ title, children }) {
  return (
    <div className="border-t border-slate-100 pt-4">
      <p className="text-xs font-semibold text-slate-400 uppercase tracking-wide mb-3">{title}</p>
      {children}
    </div>
  );
}

// ─── 受注入力モーダル ────────────────────────────────────────────────────────
function NewOrderModal({ onClose, onSave }) {
  const { products, customers, copperPrice, prototypes, prototypeBOMs, addBOMEntry } = useApp();

  const [form, setForm] = useState({
    isTrial: false,
    orderDate: '2026-05-21', status: '照会（仮押さえ）', paidMaterialOffset: '非対象',
    inputPersonCode: '101', inputPerson: '細野', approverCode: '', approver: '',
    customerCode: '', customerName: '',
    deliveryAddressCode: '', deliveryAddressName: '', deliveryAddressDetail: '',
    customerOrderNum1: '', customerOrderNum2: '', customerOrderNum3: '',
    productCode: '', productId: '', productName: '', prototypeId: '',
    customerProductName: '', designNumber: '', specNumber: '',
    cableEntries: [{ cableLength: '', bundleCount: '' }],
    packaging: 'ドラム(D400)', weightPer1000m: '',
    unit: 'm', totalQuantity: '', finalDeadline: '', arrangementDeadline: '',
    sampleRequired: false, trRequired: false, ulLabel: false,
    cableSupply: false, cableArrivalDate: '', materialSupply: false, drumSupply: false, tagSupply: false,
    copperBase: copperPrice, priceCategory: 'A', unitPrice: '',
    completionStatus: '0', remarks: '',
  });

  const set = (key, val) => setForm(f => ({ ...f, [key]: val }));

  const handleProductCode = (code) => {
    const p = products?.find(pr => pr.productCode === code);
    setForm(f => ({
      ...f,
      productCode: code,
      productId: p?.id || '',
      productName: p?.name || '',
      designNumber: p?.designNumber || f.designNumber,
      unit: p?.unit || f.unit,
    }));
  };

  const handlePrototypeCode = (code) => {
    const pt = prototypes?.find(p => p.prototypeCode === code);
    setForm(f => ({
      ...f,
      productCode: code,
      prototypeId: pt?.id || '',
      productId: '',
      productName: pt?.name || '',
      designNumber: pt?.designNumber || f.designNumber,
    }));
  };

  const handleCustomerCode = (code) => {
    const c = customers?.find(cu => cu.code === code);
    setForm(f => ({ ...f, customerCode: code, customerName: c?.name || f.customerName }));
  };

  const addCableEntry   = () => setForm(f => ({ ...f, cableEntries: [...f.cableEntries, { cableLength:'', bundleCount:'' }] }));
  const removeCableEntry = (i) => setForm(f => ({ ...f, cableEntries: f.cableEntries.filter((_,idx) => idx!==i) }));
  const setCableEntry = (i,key,val) => setForm(f => ({
    ...f, cableEntries: f.cableEntries.map((e,idx) => idx===i ? {...e,[key]:val} : e)
  }));

  const amount = form.unitPrice && form.totalQuantity
    ? Number(form.unitPrice) * Number(form.totalQuantity) : null;

  const handleSave = () => {
    const seq = String(Math.floor(Math.random()*9000)+1000);
    const prefix = form.isTrial ? 'TMP' : 'SO';
    const newOrder = {
      id: `O${Date.now()}`,
      orderNumber: `${prefix}-${form.orderDate.replace(/-/g,'').slice(2,6)}-${seq}`,
      quoteId: null,
      shippingSchedule: [],
      ...form,
    };
    onSave(newOrder);
    onClose();
  };

  const Lbl = ModalLabel;
  const Sec = ModalSection;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 p-3">
      <div className="bg-white rounded-xl shadow-2xl w-full max-w-3xl max-h-[92vh] flex flex-col">
        <div className="flex items-center justify-between px-6 py-4 border-b border-slate-200 flex-shrink-0">
          <div className="flex items-center gap-3">
            <h2 className="font-bold text-slate-800 text-lg">受注入力</h2>
            <label className="flex items-center gap-2 cursor-pointer select-none">
              <input type="checkbox" checked={form.isTrial} onChange={e => set('isTrial', e.target.checked)}
                className="w-4 h-4 rounded border-slate-300 accent-amber-500" />
              <span className={`text-sm font-semibold px-2 py-0.5 rounded ${form.isTrial ? 'bg-amber-100 text-amber-700' : 'text-slate-500'}`}>
                試作受注
              </span>
            </label>
          </div>
          <button onClick={onClose} className="text-slate-400 hover:text-slate-600 text-xl leading-none">✕</button>
        </div>

        <div className="overflow-y-auto flex-1 px-6 py-5 space-y-5">
          <Sec title="基本情報">
            <div className="grid grid-cols-2 sm:grid-cols-3 gap-3">
              <div><Lbl t="受注日" req /><input type="date" value={form.orderDate} onChange={e=>set('orderDate',e.target.value)} className="input-field" /></div>
              <div><Lbl t="ステータス" /><select value={form.status} onChange={e=>set('status',e.target.value)} className="select-field">{Object.keys(statusColors).map(s=><option key={s}>{s}</option>)}</select></div>
              <div><Lbl t="有償支給材相殺" /><select value={form.paidMaterialOffset} onChange={e=>set('paidMaterialOffset',e.target.value)} className="select-field"><option>非対象</option><option>対象</option></select></div>
              <div><Lbl t="入力者コード" /><input type="text" value={form.inputPersonCode} onChange={e=>set('inputPersonCode',e.target.value)} className="input-field" placeholder="例: 101" /></div>
              <div><Lbl t="入力者" /><input type="text" value={form.inputPerson} onChange={e=>set('inputPerson',e.target.value)} className="input-field" placeholder="コード入力で自動表示" /></div>
              <div><Lbl t="承認者コード" /><input type="text" value={form.approverCode} onChange={e=>set('approverCode',e.target.value)} className="input-field" placeholder="例: 001" /></div>
              <div><Lbl t="承認者" /><input type="text" value={form.approver} onChange={e=>set('approver',e.target.value)} className="input-field" placeholder="コード入力で自動表示" /></div>
            </div>
          </Sec>

          <Sec title="得意先・納入先">
            <div className="grid grid-cols-2 sm:grid-cols-3 gap-3">
              <div><Lbl t="得意先コード" req /><input type="text" value={form.customerCode} onChange={e=>handleCustomerCode(e.target.value)} className="input-field" placeholder="例: C001" /></div>
              <div className="sm:col-span-2"><Lbl t="得意先名称" /><input type="text" value={form.customerName} onChange={e=>set('customerName',e.target.value)} className="input-field" placeholder="コード入力で自動表示" /></div>
              <div><Lbl t="納入先コード" /><input type="text" value={form.deliveryAddressCode} onChange={e=>set('deliveryAddressCode',e.target.value)} className="input-field" placeholder="例: DA001" /></div>
              <div className="sm:col-span-2"><Lbl t="納入先名称" /><input type="text" value={form.deliveryAddressName} onChange={e=>set('deliveryAddressName',e.target.value)} className="input-field" placeholder="コード入力で自動表示（手入力も可）" /></div>
              <div className="sm:col-span-3"><Lbl t="納入先住所・TEL" /><input type="text" value={form.deliveryAddressDetail} onChange={e=>set('deliveryAddressDetail',e.target.value)} className="input-field" placeholder="〒XXX-XXXX 住所　TEL: XXXX-XX-XXXX" /></div>
            </div>
          </Sec>

          <Sec title="注文番号">
            <div className="grid grid-cols-3 gap-3">
              {[['customerOrderNum1','注文番号1'],['customerOrderNum2','注文番号2'],['customerOrderNum3','注文番号3']].map(([k,l])=>(
                <div key={k}><Lbl t={l} /><input type="text" value={form[k]} onChange={e=>set(k,e.target.value)} className="input-field" placeholder="例: FDC-2026-0421" /></div>
              ))}
            </div>
          </Sec>

          <Sec title={form.isTrial ? '試作品情報' : '商品情報'}>
            {form.isTrial ? (
              <div className="grid grid-cols-2 sm:grid-cols-3 gap-3">
                <div>
                  <Lbl t="試作品コード" req />
                  <select value={form.productCode} onChange={e=>handlePrototypeCode(e.target.value)} className="select-field">
                    <option value="">-- 選択してください --</option>
                    {prototypes?.filter(p => p.status !== '転記済').map(p => (
                      <option key={p.id} value={p.prototypeCode}>{p.prototypeCode}</option>
                    ))}
                    <option value="__new__">（新規試作品として登録）</option>
                  </select>
                </div>
                <div className="sm:col-span-2"><Lbl t="試作品名" /><input type="text" value={form.productName} onChange={e=>set('productName',e.target.value)} className="input-field" placeholder="試作品名称" /></div>
                <div className="sm:col-span-2"><Lbl t="客先品名" /><input type="text" value={form.customerProductName} onChange={e=>set('customerProductName',e.target.value)} className="input-field" placeholder="製品ラベル表示用（直送先用）" /></div>
                <div><Lbl t="設計書番号" /><input type="text" value={form.designNumber} onChange={e=>set('designNumber',e.target.value)} className="input-field" placeholder="例: TF-PROTO-XXXX" /></div>
                <div><Lbl t="仕様書番号" /><input type="text" value={form.specNumber} onChange={e=>set('specNumber',e.target.value)} className="input-field" placeholder="仕様書番号" /></div>
              </div>
            ) : (
              <div className="grid grid-cols-2 sm:grid-cols-3 gap-3">
                <div><Lbl t="商品コード" req /><input type="text" value={form.productCode} onChange={e=>handleProductCode(e.target.value)} className="input-field" placeholder="例: CV-3.5-3C-BLK" /></div>
                <div className="sm:col-span-2"><Lbl t="品名" /><input type="text" value={form.productName} onChange={e=>set('productName',e.target.value)} className="input-field" placeholder="商品コード入力で自動表示" /></div>
                <div className="sm:col-span-2"><Lbl t="客先品名" /><input type="text" value={form.customerProductName} onChange={e=>set('customerProductName',e.target.value)} className="input-field" placeholder="製品ラベル表示用（直送先用）" /></div>
                <div><Lbl t="設計書番号" /><input type="text" value={form.designNumber} onChange={e=>set('designNumber',e.target.value)} className="input-field" placeholder="商品コード入力で自動表示" /></div>
                <div><Lbl t="仕様書番号" /><input type="text" value={form.specNumber} onChange={e=>set('specNumber',e.target.value)} className="input-field" placeholder="商品コード入力で自動表示" /></div>
              </div>
            )}
          </Sec>

          <Sec title="納品仕様">
            <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 mb-3">
              <div><Lbl t="納期" req /><input type="date" value={form.finalDeadline} onChange={e=>set('finalDeadline',e.target.value)} className="input-field" /></div>
              <div><Lbl t="手配期限" /><input type="date" value={form.arrangementDeadline} onChange={e=>set('arrangementDeadline',e.target.value)} className="input-field" /></div>
              <div><Lbl t="数量" req /><input type="number" value={form.totalQuantity} onChange={e=>set('totalQuantity',e.target.value)} className="input-field" placeholder="例: 5000" /></div>
              <div><Lbl t="単位" /><input type="text" value={form.unit} onChange={e=>set('unit',e.target.value)} className="input-field" placeholder="m" /></div>
              <div><Lbl t="荷姿" /><select value={form.packaging} onChange={e=>set('packaging',e.target.value)} className="select-field">{PACKAGINGS.map(p=><option key={p}>{p}</option>)}</select></div>
              <div><Lbl t="重量（g/m）" /><input type="number" step="0.1" value={form.weightPer1000m} onChange={e=>set('weightPer1000m',e.target.value)} className="input-field" placeholder="例: 95.2" /></div>
            </div>
            <div className="bg-slate-50 rounded-lg p-3">
              <div className="flex items-center justify-between mb-2">
                <p className="text-xs font-medium text-slate-600">条長・把数（複数指定可・最大10行）</p>
                {form.cableEntries.length < 10 && <button onClick={addCableEntry} className="text-xs text-blue-600 hover:underline">＋ 行追加</button>}
              </div>
              <div className="space-y-2">
                {form.cableEntries.map((entry,i) => (
                  <div key={i} className="flex gap-2 items-end">
                    <div className="flex-1"><Lbl t="条長（m）" /><input type="text" value={entry.cableLength} onChange={e=>setCableEntry(i,'cableLength',e.target.value)} className="input-field" placeholder="例: 500" /></div>
                    <div className="flex-1"><Lbl t="把数" /><input type="text" value={entry.bundleCount} onChange={e=>setCableEntry(i,'bundleCount',e.target.value)} className="input-field" placeholder="例: 10" /></div>
                    {form.cableEntries.length > 1 && (
                      <button onClick={()=>removeCableEntry(i)} className="text-red-400 hover:text-red-600 pb-2 text-sm leading-none">✕</button>
                    )}
                  </div>
                ))}
              </div>
            </div>
          </Sec>

          <Sec title="提出書類・支給材">
            <div className="grid grid-cols-2 sm:grid-cols-3 gap-2 mb-3">
              {[['sampleRequired','サンプル提出'],['trRequired','TR提出（製品・材料）'],['ulLabel','ULラベル'],['materialSupply','材料支給'],['drumSupply','ドラム支給'],['tagSupply','荷札支給']].map(([k,l])=>(
                <label key={k} className="flex items-center gap-2 cursor-pointer select-none">
                  <input type="checkbox" checked={form[k]} onChange={e=>set(k,e.target.checked)} className="w-4 h-4 rounded border-slate-300" />
                  <span className="text-sm text-slate-700">{l}</span>
                </label>
              ))}
            </div>
            <div className="flex flex-wrap items-end gap-4">
              <label className="flex items-center gap-2 cursor-pointer select-none">
                <input type="checkbox" checked={form.cableSupply} onChange={e=>set('cableSupply',e.target.checked)} className="w-4 h-4 rounded border-slate-300" />
                <span className="text-sm text-slate-700">ケーブル支給</span>
              </label>
              {form.cableSupply && (
                <div><Lbl t="入荷予定日" /><input type="date" value={form.cableArrivalDate} onChange={e=>set('cableArrivalDate',e.target.value)} className="input-field" /></div>
              )}
            </div>
          </Sec>

          <Sec title="価格">
            <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
              <div><Lbl t="銅ベース（¥/kg）" /><input type="number" value={form.copperBase} onChange={e=>set('copperBase',e.target.value)} className="input-field" /></div>
              <div><Lbl t="単価区分" /><select value={form.priceCategory} onChange={e=>set('priceCategory',e.target.value)} className="select-field">{PRICE_CATS.map(p=><option key={p.value} value={p.value}>{p.label}</option>)}</select></div>
              <div><Lbl t="単価（¥/m）" req /><input type="number" value={form.unitPrice} onChange={e=>set('unitPrice',e.target.value)} className="input-field" placeholder="例: 850" /></div>
              <div>
                <Lbl t="金額（¥）" />
                <div className="input-field bg-slate-50 text-slate-600 font-medium">
                  {amount ? `¥${amount.toLocaleString()}` : '—'}
                </div>
              </div>
              <div><Lbl t="完納区分" /><select value={form.completionStatus} onChange={e=>set('completionStatus',e.target.value)} className="select-field"><option value="0">0：未完納</option><option value="1">1：完納</option></select></div>
            </div>
          </Sec>

          <Sec title="備考欄">
            <textarea value={form.remarks} onChange={e=>set('remarks',e.target.value)} rows={5}
              className="input-field w-full resize-none" placeholder="特記事項（全角25文字×20行目安）" />
          </Sec>
        </div>

        <div className="px-6 py-4 border-t border-slate-200 flex gap-3 justify-end flex-shrink-0 bg-white">
          <button onClick={onClose} className="btn-secondary px-6">キャンセル</button>
          <button onClick={handleSave}
            disabled={!form.customerCode || (!form.isTrial && !form.productCode) || !form.totalQuantity || !form.finalDeadline}
            className="btn-primary px-6 disabled:opacity-40 disabled:cursor-not-allowed">
            受注登録
          </button>
        </div>
      </div>
    </div>
  );
}

// ─── 詳細フィールド・バッジ ──────────────────────────────────────────────────
function DField({ label, value, className = '' }) {
  return (
    <div className={className}>
      <div className="text-xs text-slate-400 mb-0.5">{label}</div>
      <div className="text-sm text-slate-800 font-medium break-words">
        {value || <span className="text-slate-300">—</span>}
      </div>
    </div>
  );
}

function FlagBadge({ active, label }) {
  return (
    <span className={`inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-xs font-medium border ${
      active ? 'bg-blue-50 text-blue-700 border-blue-200' : 'bg-slate-50 text-slate-400 border-slate-200'
    }`}>
      <span>{active ? '✓' : '—'}</span>{label}
    </span>
  );
}

// ─── 受注詳細モーダル ────────────────────────────────────────────────────────
function OrderDetailModal({ selected, onClose, onConfirm, deadlineAlerts, TODAY,
  editingId, editForm, setEditForm, startEdit, cancelEdit, saveEdit,
  showNewShipping, setShowNewShipping, newShipping, setNewShipping, addShipping,
  handleDeleteShipping, deleteTarget, confirmDelete, setDeleteTarget
}) {
  const [detailTab, setDetailTab] = useState('basic');
  const [showDocOutput, setShowDocOutput] = useState(false);
  const isAlert = deadlineAlerts.some(a => a.id === selected.id);

  return (
    <>
    <div className="fixed inset-0 z-50 flex items-start justify-center bg-black/50 p-2 sm:p-4 overflow-y-auto"
      onMouseDown={e => { if (e.target === e.currentTarget) onClose(); }}>
      <div className="bg-white rounded-xl shadow-2xl w-full max-w-3xl my-2 sm:my-6 relative">

        {/* モーダルヘッダー */}
        <div className="flex items-center justify-between px-5 py-4 border-b border-slate-200 sticky top-0 bg-white z-10 rounded-t-xl">
          <div className="min-w-0 flex-1">
            <div className="flex items-center gap-2 flex-wrap">
              {selected.isTrial && (
                <span className="badge bg-amber-100 text-amber-700 border border-amber-300 font-bold">試作</span>
              )}
              <h2 className="text-base font-bold text-slate-800">{selected.orderNumber}</h2>
              <span className={`badge ${statusColors[selected.status]}`}>{selected.status}</span>
              {selected.priceCategory && (
                <span className={`badge ${PRICE_CAT_COLORS[selected.priceCategory] || 'bg-slate-100 text-slate-600'}`}>
                  {selected.priceCategory === 'K' ? '仮単価' : selected.priceCategory === 'T' ? '一括単価' : '決定単価'}
                </span>
              )}
              {selected.paidMaterialOffset === '対象' && (
                <span className="badge bg-purple-100 text-purple-700">有償支給材 相殺対象</span>
              )}
            </div>
            <div className="text-xs text-slate-500 mt-0.5 truncate">{selected.productName} / {selected.customerName}</div>
          </div>
          <div className="flex items-center gap-2 ml-4 flex-shrink-0">
            {selected.status === '照会（仮押さえ）' && (
              <button onClick={() => onConfirm(selected.id)} className="btn-primary text-xs px-3 py-1.5">受注確定</button>
            )}
            <button onClick={() => setShowDocOutput(true)}
              className="text-xs border border-slate-300 bg-white hover:bg-slate-50 text-slate-700 px-3 py-1.5 rounded-lg transition-colors flex items-center gap-1">
              📄 帳票出力
            </button>
            <button onClick={onClose} className="text-slate-400 hover:text-slate-600 text-xl leading-none">✕</button>
          </div>
        </div>

        <div className="px-5 pt-4 pb-1">
          {/* タブ */}
          <div className="flex gap-0 border-b border-slate-100 -mx-0 mb-4">
            {[['basic','基本情報'],['product','商品・仕様'],['supply','支給材・書類'],['price','価格・備考']].map(([id,label])=>(
              <button key={id} onClick={()=>setDetailTab(id)}
                className={`px-4 py-2 text-xs font-medium border-b-2 transition-colors ${detailTab===id ? 'border-blue-500 text-blue-600' : 'border-transparent text-slate-500 hover:text-slate-700'}`}>
                {label}
              </button>
            ))}
          </div>

          {/* Tab: 基本情報 */}
          {detailTab === 'basic' && (
            <div className="space-y-4 mb-4">
              <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 bg-slate-50 rounded-lg p-4">
                <DField label="受注日" value={selected.orderDate} />
                <DField label="納期" value={selected.finalDeadline} />
                <DField label="手配期限" value={selected.arrangementDeadline}
                  className={isAlert ? '[&>div:last-child]:text-red-600 [&>div:last-child]:font-bold' : ''} />
                <DField label="受注数量" value={`${selected.totalQuantity?.toLocaleString()} ${selected.unit}`} />
                <DField label="入力者" value={selected.inputPerson ? `${selected.inputPersonCode} ${selected.inputPerson}` : undefined} />
                <DField label="承認者" value={selected.approver ? `${selected.approverCode} ${selected.approver}` : undefined} />
                <DField label="完納区分" value={selected.completionStatus === '1' ? '1：完納' : selected.completionStatus === '0' ? '0：未完納' : undefined} />
                <DField label="有償支給材相殺" value={selected.paidMaterialOffset} />
              </div>
              <div>
                <p className="text-xs font-semibold text-slate-400 uppercase tracking-wide mb-2">得意先・納入先</p>
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 bg-slate-50 rounded-lg p-4">
                  <DField label="得意先コード / 名称" value={selected.customerCode ? `${selected.customerCode}　${selected.customerName}` : selected.customerName} />
                  <DField label="注文番号" value={[selected.customerOrderNum1, selected.customerOrderNum2, selected.customerOrderNum3].filter(Boolean).join(' / ')} />
                  <DField label="納入先コード / 名称" value={selected.deliveryAddressCode ? `${selected.deliveryAddressCode}　${selected.deliveryAddressName}` : selected.deliveryAddressName} />
                  <DField label="納入先住所・TEL" value={selected.deliveryAddressDetail} />
                </div>
              </div>
            </div>
          )}

          {/* Tab: 商品・仕様 */}
          {detailTab === 'product' && (
            <div className="space-y-4 mb-4">
              <div className="grid grid-cols-2 sm:grid-cols-3 gap-3 bg-slate-50 rounded-lg p-4">
                <DField label="商品コード" value={selected.productCode} />
                <DField label="品名" value={selected.productName} />
                <DField label="客先品名" value={selected.customerProductName} />
                <DField label="設計書番号" value={selected.designNumber} />
                <DField label="仕様書番号" value={selected.specNumber} />
                <DField label="荷姿" value={selected.packaging} />
                <DField label="重量（g/m）" value={selected.weightPer1000m ? `${selected.weightPer1000m} g/m` : undefined} />
                <DField label="単位" value={selected.unit} />
              </div>
              {selected.cableEntries?.length > 0 && (
                <div>
                  <p className="text-xs font-semibold text-slate-400 uppercase tracking-wide mb-2">条長・把数</p>
                  <div className="rounded-xl border border-slate-200 overflow-hidden">
                    <table className="min-w-full text-sm">
                      <thead className="bg-slate-50 text-xs text-slate-500">
                        <tr>
                          <th className="px-4 py-2.5 text-left font-semibold">No.</th>
                          <th className="px-4 py-2.5 text-right font-semibold">条長（m）</th>
                          <th className="px-4 py-2.5 text-right font-semibold">把数</th>
                          <th className="px-4 py-2.5 text-right font-semibold">小計（m）</th>
                        </tr>
                      </thead>
                      <tbody className="divide-y divide-slate-100">
                        {selected.cableEntries.map((e, i) => {
                          const sub = (Number(e.cableLength)||0) * (Number(e.bundleCount)||0);
                          return (
                            <tr key={i} className="hover:bg-slate-50">
                              <td className="px-4 py-2 text-slate-400">{i+1}</td>
                              <td className="px-4 py-2 text-right font-mono">{e.cableLength || '—'}</td>
                              <td className="px-4 py-2 text-right font-mono">{e.bundleCount || '—'}</td>
                              <td className="px-4 py-2 text-right font-mono text-slate-600">{sub > 0 ? sub.toLocaleString() : '—'}</td>
                            </tr>
                          );
                        })}
                      </tbody>
                      <tfoot>
                        <tr className="bg-slate-50 border-t-2 border-slate-200">
                          <td colSpan={3} className="px-4 py-2 text-right text-xs font-semibold text-slate-600">合計</td>
                          <td className="px-4 py-2 text-right font-bold text-slate-800">
                            {selected.cableEntries.reduce((s,e)=>s+(Number(e.cableLength)||0)*(Number(e.bundleCount)||0),0).toLocaleString()} m
                          </td>
                        </tr>
                      </tfoot>
                    </table>
                  </div>
                </div>
              )}
            </div>
          )}

          {/* Tab: 支給材・書類 */}
          {detailTab === 'supply' && (
            <div className="space-y-4 mb-4">
              <div>
                <p className="text-xs font-semibold text-slate-400 uppercase tracking-wide mb-2">提出書類</p>
                <div className="flex flex-wrap gap-2">
                  <FlagBadge active={selected.sampleRequired} label="サンプル提出" />
                  <FlagBadge active={selected.trRequired} label="TR提出（製品・材料）" />
                  <FlagBadge active={selected.ulLabel} label="ULラベル" />
                </div>
              </div>
              <div>
                <p className="text-xs font-semibold text-slate-400 uppercase tracking-wide mb-2">支給材</p>
                <div className="flex flex-wrap gap-2">
                  <FlagBadge active={selected.cableSupply} label="ケーブル支給" />
                  <FlagBadge active={selected.materialSupply} label="材料支給" />
                  <FlagBadge active={selected.drumSupply} label="ドラム支給" />
                  <FlagBadge active={selected.tagSupply} label="荷札支給" />
                </div>
                {selected.cableSupply && selected.cableArrivalDate && (
                  <div className="mt-3 bg-orange-50 rounded-lg p-3 text-sm text-orange-800">
                    ケーブル支給材 入荷予定日: <span className="font-semibold">{selected.cableArrivalDate}</span>
                  </div>
                )}
              </div>
            </div>
          )}

          {/* Tab: 価格・備考 */}
          {detailTab === 'price' && (
            <div className="space-y-4 mb-4">
              <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 bg-slate-50 rounded-lg p-4">
                <DField label="銅ベース（¥/kg）" value={selected.copperBase ? `¥${Number(selected.copperBase).toLocaleString()}` : undefined} />
                <DField label="単価区分" value={
                  selected.priceCategory === 'A' ? 'A：決定単価' :
                  selected.priceCategory === 'K' ? 'K：仮単価' :
                  selected.priceCategory === 'T' ? 'T：一括単価' : undefined
                } />
                <DField label="単価（¥/m）" value={selected.unitPrice ? `¥${Number(selected.unitPrice).toLocaleString()}` : undefined} />
                <DField label="金額（¥）" value={
                  selected.unitPrice && selected.totalQuantity
                    ? `¥${(Number(selected.unitPrice) * Number(selected.totalQuantity)).toLocaleString()}`
                    : undefined
                } />
              </div>
              {selected.remarks && (
                <div>
                  <p className="text-xs font-semibold text-slate-400 uppercase tracking-wide mb-2">備考欄</p>
                  <div className="bg-slate-50 rounded-lg p-4 text-sm text-slate-700 whitespace-pre-wrap leading-relaxed">
                    {selected.remarks}
                  </div>
                </div>
              )}
            </div>
          )}
        </div>

        {/* 出荷予定サブテーブル */}
        <div className="mx-5 mb-5 rounded-xl border border-slate-200 overflow-hidden">
          <div className="flex items-center justify-between px-4 py-3 bg-slate-50 border-b border-slate-200">
            <h3 className="font-semibold text-slate-800 text-sm">出荷予定一覧</h3>
            <button onClick={() => setShowNewShipping(true)} className="btn-secondary text-xs py-1 px-3">＋ 出荷予定追加</button>
          </div>

          {showNewShipping && (
            <div className="p-4 bg-blue-50 border-b border-blue-200">
              <div className="text-sm font-medium text-blue-800 mb-3">新規出荷予定</div>
              <div className="flex flex-wrap gap-3 items-end">
                <div>
                  <label className="block text-xs text-slate-600 mb-1">出荷予定日</label>
                  <input type="date" className="input-field" value={newShipping.scheduledDate}
                    onChange={e => setNewShipping(n => ({ ...n, scheduledDate: e.target.value }))} />
                </div>
                <div>
                  <label className="block text-xs text-slate-600 mb-1">数量</label>
                  <input type="number" className="input-field w-28" value={newShipping.quantity}
                    onChange={e => setNewShipping(n => ({ ...n, quantity: e.target.value }))} />
                </div>
                <div>
                  <label className="block text-xs text-slate-600 mb-1">配送業者</label>
                  <select className="select-field w-36" value={newShipping.carrier}
                    onChange={e => setNewShipping(n => ({ ...n, carrier: e.target.value }))}>
                    {CARRIERS.map(c => <option key={c}>{c}</option>)}
                  </select>
                </div>
                <button onClick={addShipping} className="btn-primary text-xs">追加</button>
                <button onClick={() => setShowNewShipping(false)} className="btn-secondary text-xs">キャンセル</button>
              </div>
            </div>
          )}

          <table className="w-full text-sm">
            <thead className="bg-slate-50">
              <tr>
                {['出荷予定日','出荷数量','納品残数','配送業者','ステータス','操作'].map(h => (
                  <th key={h} className="text-left py-2 px-3 text-xs font-medium text-slate-500">{h}</th>
                ))}
              </tr>
            </thead>
            <tbody>
              {selected.shippingSchedule.map(s => {
                const d = new Date(s.scheduledDate);
                const diff = Math.ceil((d - TODAY) / (1000 * 60 * 60 * 24));
                const isUrgent = diff <= 7 && diff >= 0 && s.status !== '出荷済';
                const isEditing = editingId === s.id;

                if (isEditing) {
                  return (
                    <tr key={s.id} className="border-b border-blue-200 bg-blue-50">
                      <td className="py-2 px-2"><input type="date" className="input-field text-xs py-1 px-2 w-full" value={editForm.scheduledDate} onChange={e=>setEditForm(f=>({...f,scheduledDate:e.target.value}))} /></td>
                      <td className="py-2 px-2"><input type="number" className="input-field text-xs py-1 px-2 w-24 text-right font-mono" value={editForm.quantity} onChange={e=>setEditForm(f=>({...f,quantity:e.target.value}))} /></td>
                      <td className="py-2 px-3 text-xs text-slate-400 text-right">—</td>
                      <td className="py-2 px-2"><select className="select-field text-xs py-1 px-2 w-32" value={editForm.carrier} onChange={e=>setEditForm(f=>({...f,carrier:e.target.value}))}>{CARRIERS.map(c=><option key={c}>{c}</option>)}</select></td>
                      <td className="py-2 px-3"><span className={`badge ${shipStatusColors[s.status]}`}>{s.status}</span></td>
                      <td className="py-2 px-3">
                        <div className="flex gap-2">
                          <button onClick={saveEdit} disabled={!editForm.scheduledDate||!editForm.quantity} className="text-xs font-semibold text-blue-600 hover:underline disabled:opacity-40">保存</button>
                          <button onClick={cancelEdit} className="text-xs text-slate-400 hover:underline">取消</button>
                        </div>
                      </td>
                    </tr>
                  );
                }

                return (
                  <tr key={s.id} className={`border-b border-slate-100 ${isUrgent?'bg-orange-50':''} ${editingId&&!isEditing?'opacity-50':''}`}>
                    <td className="py-2.5 px-3 font-medium">
                      {isUrgent && <span className="text-orange-500 mr-1">🔔</span>}
                      {s.scheduledDate}
                      {isUrgent && <span className="ml-1 text-xs text-orange-600">（あと{diff}日）</span>}
                    </td>
                    <td className="py-2.5 px-3 text-right font-mono">{s.quantity.toLocaleString()} m</td>
                    <td className="py-2.5 px-3 text-right font-mono text-slate-600">{s.remainingQty.toLocaleString()} m</td>
                    <td className="py-2.5 px-3 text-slate-600">{s.carrier}</td>
                    <td className="py-2.5 px-3"><span className={`badge ${shipStatusColors[s.status]}`}>{s.status}</span></td>
                    <td className="py-2.5 px-3">
                      {s.status !== '出荷済' && !editingId && (
                        <div className="flex gap-2">
                          <button onClick={() => startEdit(s)} className="text-xs text-blue-500 hover:underline">編集</button>
                          <button onClick={() => handleDeleteShipping(s.id)} className="text-xs text-red-500 hover:underline">削除</button>
                        </div>
                      )}
                    </td>
                  </tr>
                );
              })}
              {selected.shippingSchedule.length === 0 && (
                <tr><td colSpan={6} className="py-6 text-center text-xs text-slate-400">出荷予定がありません</td></tr>
              )}
            </tbody>
          </table>
          <div className="bg-slate-50 px-4 py-3 flex justify-between text-sm border-t border-slate-200">
            <span className="text-slate-500">出荷予定合計</span>
            <span className="font-bold text-slate-800">
              {selected.shippingSchedule.reduce((s,i)=>s+i.quantity,0).toLocaleString()} m
              / {selected.totalQuantity?.toLocaleString()} m
            </span>
          </div>
        </div>

        {deleteTarget && (
          <DeleteConfirmDialog schedule={deleteTarget} onConfirm={confirmDelete} onCancel={()=>setDeleteTarget(null)} />
        )}
      </div>
    </div>
    {showDocOutput && (
      <DocumentOutputModal order={selected} onClose={() => setShowDocOutput(false)} />
    )}
    </>
  );
}

// ─── メインコンポーネント ────────────────────────────────────────────────────
export default function OrderEntry() {
  const { orders, setOrders, deadlineAlerts, TODAY } = useApp();

  const [selected, setSelected]               = useState(null);
  const [showDetailModal, setShowDetailModal]  = useState(false);
  const [viewMode, setViewMode]               = useState('list');
  const [showNewOrder, setShowNewOrder]        = useState(false);

  // フィルタ・ソート
  const [filterSearch, setFilterSearch]       = useState('');
  const [filterStatus, setFilterStatus]       = useState('');
  const [filterDateFrom, setFilterDateFrom]   = useState('');
  const [filterDateTo, setFilterDateTo]       = useState('');
  const [filterTrial, setFilterTrial]         = useState(false);
  const [sortField, setSortField]             = useState('finalDeadline');
  const [sortDir, setSortDir]                 = useState('asc');

  // 出荷予定編集ステート
  const [deleteTarget, setDeleteTarget]       = useState(null);
  const [showNewShipping, setShowNewShipping] = useState(false);
  const [newShipping, setNewShipping]         = useState({ scheduledDate:'', quantity:'', carrier:'路線' });
  const [editingId, setEditingId]             = useState(null);
  const [editForm, setEditForm]               = useState({ scheduledDate:'', quantity:'', carrier:'路線' });

  const today = new Date('2026-05-21');

  // ─── フィルタ＋ソート ─────────────────────────────────────────────────────
  const filteredOrders = (() => {
    let result = [...orders];

    if (filterSearch) {
      const q = filterSearch.toLowerCase();
      result = result.filter(o =>
        (o.orderNumber||'').toLowerCase().includes(q) ||
        (o.productName||'').toLowerCase().includes(q) ||
        (o.customerName||'').toLowerCase().includes(q)
      );
    }
    if (filterStatus) {
      result = result.filter(o => o.status === filterStatus);
    }
    if (filterDateFrom) {
      result = result.filter(o => o.finalDeadline && o.finalDeadline >= filterDateFrom);
    }
    if (filterDateTo) {
      result = result.filter(o => o.finalDeadline && o.finalDeadline <= filterDateTo);
    }
    if (filterTrial) {
      result = result.filter(o => o.isTrial === true);
    }

    result.sort((a, b) => {
      let av = a[sortField] ?? '';
      let bv = b[sortField] ?? '';
      if (sortField === 'totalQuantity') { av = Number(av); bv = Number(bv); }
      const cmp = String(av).localeCompare(String(bv), 'ja', { numeric: true });
      return sortDir === 'asc' ? cmp : -cmp;
    });

    return result;
  })();

  const toggleSort = (field) => {
    if (sortField === field) setSortDir(d => d === 'asc' ? 'desc' : 'asc');
    else { setSortField(field); setSortDir('asc'); }
  };

  const openDetail = (order) => {
    setSelected(order);
    setShowDetailModal(true);
    setEditingId(null);
    setShowNewShipping(false);
  };

  const closeDetail = () => {
    setShowDetailModal(false);
    setEditingId(null);
    setShowNewShipping(false);
  };

  // ─── 出荷予定ハンドラ ──────────────────────────────────────────────────────
  const handleDeleteShipping = (scheduleId) => {
    const target = selected.shippingSchedule.find(s => s.id === scheduleId);
    if (target?.status === '出荷済') { alert('出荷済の予定は削除できません。'); return; }
    setDeleteTarget(target);
  };

  const confirmDelete = () => {
    const updated = { ...selected, shippingSchedule: selected.shippingSchedule.filter(s => s.id !== deleteTarget.id) };
    setOrders(os => os.map(o => o.id === selected.id ? updated : o));
    setSelected(updated);
    setDeleteTarget(null);
  };

  const handleConfirmOrder = (orderId) => {
    setOrders(os => os.map(o => o.id === orderId ? { ...o, status: '確定' } : o));
    if (selected?.id === orderId) setSelected(s => ({ ...s, status: '確定' }));
  };

  const startEdit = (s) => {
    setEditingId(s.id);
    setEditForm({ scheduledDate: s.scheduledDate, quantity: String(s.quantity), carrier: s.carrier });
    setShowNewShipping(false);
  };
  const cancelEdit = () => setEditingId(null);

  const saveEdit = () => {
    if (!editForm.scheduledDate || !editForm.quantity) return;
    const updated = {
      ...selected,
      shippingSchedule: selected.shippingSchedule.map(s =>
        s.id === editingId ? { ...s, scheduledDate: editForm.scheduledDate, quantity: Number(editForm.quantity), carrier: editForm.carrier } : s
      ),
    };
    const sorted = [...updated.shippingSchedule].sort((a,b) => a.scheduledDate.localeCompare(b.scheduledDate));
    let remaining = selected.totalQuantity;
    const recalcMap = {};
    sorted.forEach(s => { recalcMap[s.id] = remaining; remaining -= s.quantity; });
    updated.shippingSchedule = updated.shippingSchedule.map(s => ({ ...s, remainingQty: recalcMap[s.id] ?? s.remainingQty }));
    setOrders(os => os.map(o => o.id === selected.id ? updated : o));
    setSelected(updated);
    setEditingId(null);
  };

  const addShipping = () => {
    if (!newShipping.scheduledDate || !newShipping.quantity) return;
    const ss = { id:`SS${Date.now()}`, scheduledDate:newShipping.scheduledDate, quantity:Number(newShipping.quantity), remainingQty:Number(newShipping.quantity), carrier:newShipping.carrier, status:'未出荷' };
    const updated = { ...selected, shippingSchedule: [...selected.shippingSchedule, ss] };
    setOrders(os => os.map(o => o.id === selected.id ? updated : o));
    setSelected(updated);
    setShowNewShipping(false);
    setNewShipping({ scheduledDate:'', quantity:'', carrier:'路線' });
  };

  const handleSaveNewOrder = (order) => {
    setOrders(os => [order, ...os]);
    openDetail(order);
  };

  const TH = ({ field, label, className = '' }) => (
    <th onClick={() => toggleSort(field)}
      className={`px-3 py-3 text-left text-xs font-semibold text-slate-600 cursor-pointer select-none hover:bg-slate-100 transition-colors whitespace-nowrap ${className}`}>
      {label} <SortIcon field={field} sortField={sortField} sortDir={sortDir} />
    </th>
  );

  const hasFilter = filterSearch || filterStatus || filterDateFrom || filterDateTo || filterTrial;

  return (
    <div className="space-y-4">
      {/* 手配期限アラート */}
      {deadlineAlerts.length > 0 && (
        <div className="alert-banner bg-red-50 border-red-300">
          <span className="text-xl">⚠️</span>
          <div className="flex-1">
            <div className="font-bold text-red-700 text-sm">手配期限リマインダー</div>
            {deadlineAlerts.map(o => {
              const diff = Math.ceil((new Date(o.arrangementDeadline) - TODAY) / (1000*60*60*24));
              return (
                <div key={o.id} className="text-sm text-red-600 mt-0.5">
                  <button onClick={() => openDetail(o)} className="font-mono font-bold hover:underline">{o.orderNumber}</button>
                  （{o.productName}）— 手配期限まであと <span className="font-bold">{diff}日</span>（{o.arrangementDeadline}）
                  <button onClick={() => handleConfirmOrder(o.id)} className="ml-2 text-xs bg-red-600 text-white px-2 py-0.5 rounded hover:bg-red-700">今すぐ確定</button>
                </div>
              );
            })}
          </div>
        </div>
      )}

      {/* ビュー切替 + 新規ボタン */}
      <div className="flex items-center justify-between">
        <div className="flex gap-1 bg-slate-100 rounded-lg p-1">
          {[['list','一覧'],['gantt','ガントチャート']].map(([id,label])=>(
            <button key={id} onClick={()=>setViewMode(id)}
              className={`px-3 py-1.5 rounded-md text-sm font-medium transition-colors ${viewMode===id?'bg-white shadow-sm text-blue-700':'text-slate-500 hover:text-slate-700'}`}>
              {label}
            </button>
          ))}
        </div>
        <button onClick={()=>setShowNewOrder(true)} className="btn-primary text-sm">＋ 受注入力</button>
      </div>

      {viewMode === 'gantt' && <GanttChart orders={orders} />}

      {viewMode === 'list' && (
        <div className="space-y-3">
          {/* フィルタバー */}
          <div className="card py-2.5 px-4">
            <div className="flex items-center gap-2 overflow-x-auto">
              <div className="w-52 flex-shrink-0">
                <input type="text" value={filterSearch} onChange={e => setFilterSearch(e.target.value)}
                  placeholder="受注番号・製品名・得意先で検索…"
                  className="input-field text-sm py-1.5" />
              </div>
              <div className="w-36 flex-shrink-0">
                <select value={filterStatus} onChange={e => setFilterStatus(e.target.value)}
                  className="select-field text-sm py-1.5">
                  <option value="">全ステータス</option>
                  {Object.keys(statusColors).map(s => <option key={s} value={s}>{s}</option>)}
                </select>
              </div>
              <span className="text-xs text-slate-500 flex-shrink-0 whitespace-nowrap">納期</span>
              <div className="w-36 flex-shrink-0">
                <input type="date" value={filterDateFrom} onChange={e => setFilterDateFrom(e.target.value)}
                  className="input-field text-sm py-1.5" />
              </div>
              <span className="text-xs text-slate-400 flex-shrink-0">〜</span>
              <div className="w-36 flex-shrink-0">
                <input type="date" value={filterDateTo} onChange={e => setFilterDateTo(e.target.value)}
                  className="input-field text-sm py-1.5" />
              </div>
              <label className="flex items-center gap-1.5 cursor-pointer select-none flex-shrink-0 whitespace-nowrap">
                <input type="checkbox" checked={filterTrial} onChange={e => setFilterTrial(e.target.checked)}
                  className="w-4 h-4 rounded border-slate-300 accent-amber-500" />
                <span className={`text-sm font-medium ${filterTrial ? 'text-amber-700' : 'text-slate-600'}`}>試作のみ</span>
              </label>
              {hasFilter && (
                <button onClick={() => { setFilterSearch(''); setFilterStatus(''); setFilterDateFrom(''); setFilterDateTo(''); setFilterTrial(false); }}
                  className="text-xs text-slate-500 hover:text-slate-700 underline flex-shrink-0 whitespace-nowrap">
                  クリア
                </button>
              )}
              <span className="text-xs text-slate-400 ml-auto flex-shrink-0 whitespace-nowrap">
                {filteredOrders.length}件 / 全{orders.length}件
              </span>
            </div>
          </div>

          {/* 受注一覧テーブル */}
          <div className="rounded-xl border border-slate-200 overflow-hidden bg-white">
            <div className="overflow-x-auto">
              <table className="min-w-full text-sm">
                <thead>
                  <tr className="bg-slate-50 border-b border-slate-200">
                    <TH field="orderNumber" label="受注番号" />
                    <TH field="status" label="ステータス" />
                    <TH field="productName" label="製品名" className="min-w-[160px]" />
                    <TH field="customerName" label="得意先" />
                    <TH field="totalQuantity" label="数量" />
                    <TH field="finalDeadline" label="納期" />
                    <TH field="arrangementDeadline" label="手配期限" />
                    <th className="px-3 py-3 text-left text-xs font-semibold text-slate-600 whitespace-nowrap">区分</th>
                    <th className="px-3 py-3 text-center text-xs font-semibold text-slate-600">詳細</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-100">
                  {filteredOrders.map(o => {
                    const isAlert = deadlineAlerts.some(a => a.id === o.id);
                    const deadlinePast = o.finalDeadline && new Date(o.finalDeadline) < today && o.status !== '完了' && o.status !== 'キャンセル';
                    const arrangDiff = o.arrangementDeadline ? Math.ceil((new Date(o.arrangementDeadline) - today) / 86400000) : null;
                    const arrangSoon = arrangDiff !== null && arrangDiff <= 7 && arrangDiff >= 0;
                    return (
                      <tr key={o.id}
                        onClick={() => openDetail(o)}
                        className={`cursor-pointer transition-colors ${
                          isAlert ? 'bg-red-50 hover:bg-red-100' : 'hover:bg-slate-50'
                        }`}>
                        <td className="py-3 px-3 font-mono text-xs text-slate-600 whitespace-nowrap">
                          {isAlert && <span className="mr-1 text-red-500">⚠️</span>}
                          {o.isTrial && <span className="mr-1 inline-block px-1 py-0 bg-amber-100 text-amber-700 rounded text-xs font-semibold" style={{fontSize:'10px'}}>試作</span>}
                          {o.orderNumber}
                        </td>
                        <td className="py-3 px-3">
                          <span className={`badge ${statusColors[o.status] || 'bg-slate-100 text-slate-600'}`}>
                            {o.status}
                          </span>
                        </td>
                        <td className="py-3 px-3 text-slate-800 max-w-[200px]">
                          <div className="truncate">{o.productName}</div>
                        </td>
                        <td className="py-3 px-3 text-slate-600 whitespace-nowrap">{o.customerName}</td>
                        <td className="py-3 px-3 text-right font-mono text-slate-700 whitespace-nowrap">
                          {o.totalQuantity?.toLocaleString()}{o.unit}
                        </td>
                        <td className={`py-3 px-3 font-mono text-xs whitespace-nowrap ${deadlinePast ? 'text-red-600 font-bold' : 'text-slate-700'}`}>
                          {deadlinePast && <span className="mr-1">🔴</span>}
                          {o.finalDeadline || '—'}
                        </td>
                        <td className={`py-3 px-3 font-mono text-xs whitespace-nowrap ${arrangSoon ? 'text-orange-600 font-bold' : 'text-slate-600'}`}>
                          {arrangSoon && <span className="mr-1">🔔</span>}
                          {o.arrangementDeadline || '—'}
                          {arrangSoon && arrangDiff !== null && <span className="text-orange-500 ml-1">（{arrangDiff}日）</span>}
                        </td>
                        <td className="py-3 px-3">
                          {o.priceCategory && (
                            <span className={`badge text-xs ${PRICE_CAT_COLORS[o.priceCategory] || 'bg-slate-100 text-slate-600'}`}>
                              {o.priceCategory}
                            </span>
                          )}
                        </td>
                        <td className="py-3 px-3 text-center" onClick={e => e.stopPropagation()}>
                          <button onClick={() => openDetail(o)}
                            className="text-xs text-blue-600 hover:text-blue-800 hover:underline font-medium px-2 py-1 rounded hover:bg-blue-50">
                            詳細 →
                          </button>
                        </td>
                      </tr>
                    );
                  })}
                  {filteredOrders.length === 0 && (
                    <tr>
                      <td colSpan={9} className="py-16 text-center text-slate-400">
                        <div className="text-2xl mb-2">🔍</div>
                        <div className="text-sm">該当する受注データがありません</div>
                        {hasFilter && (
                          <button onClick={() => { setFilterSearch(''); setFilterStatus(''); setFilterDeadline(''); }}
                            className="mt-2 text-xs text-blue-600 hover:underline">絞り込みをクリア</button>
                        )}
                      </td>
                    </tr>
                  )}
                </tbody>
              </table>
            </div>
          </div>
        </div>
      )}

      {/* 受注詳細モーダル */}
      {showDetailModal && selected && (
        <OrderDetailModal
          selected={selected}
          onClose={closeDetail}
          onConfirm={handleConfirmOrder}
          deadlineAlerts={deadlineAlerts}
          TODAY={TODAY}
          editingId={editingId}
          editForm={editForm}
          setEditForm={setEditForm}
          startEdit={startEdit}
          cancelEdit={cancelEdit}
          saveEdit={saveEdit}
          showNewShipping={showNewShipping}
          setShowNewShipping={setShowNewShipping}
          newShipping={newShipping}
          setNewShipping={setNewShipping}
          addShipping={addShipping}
          handleDeleteShipping={handleDeleteShipping}
          deleteTarget={deleteTarget}
          confirmDelete={confirmDelete}
          setDeleteTarget={setDeleteTarget}
        />
      )}

      {showNewOrder && <NewOrderModal onClose={()=>setShowNewOrder(false)} onSave={handleSaveNewOrder} />}
    </div>
  );
}
