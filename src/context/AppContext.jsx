import React, { createContext, useContext, useState, useEffect, useMemo } from 'react';
import {
  products as initialProducts,
  customers,
  materials,
  suppliers,
  materialReorderConfig,
  quotes as initialQuotes,
  orders as initialOrders,
  manufacturingOrders as initialMfgOrders,
  inventoryData as initialInventory,
  currentCopperPrice,
  machines,
  PROCESS_ORDER,
  INITIAL_PRODUCTION_SCHEDULE,
  initialProductOrderHistory,
  initialCurrentStock,
  initialPurchaseOrders,
  initialMaterialAllocations,
  initialMaterialReceiving,
  initialMaterialIssuances,
  initialMaterialReturns,
  initialProductBOMs,
  _staticInspections,
  initialLabelIssuances,
  initialTechRequests,
  initialTroubleReports,
  initialMachineDetails,
  initialFractionRule,
  initialMaterialShelfAssignment,
  initialPrototypes,
  initialPrototypeBOMs,
} from '../data/mockData';

const AppContext = createContext(null);

// スキーマが変わったときにここを更新 → 古いlocalStorageを自動クリア
const STORAGE_VERSION = 'v12';

// ── 生産計画から製造指示を自動生成 ───────────────────────────────
function buildMfgOrderFromPlan(item, order, product, machineId, existingCount) {
  const year = item.startDate.slice(0, 4);
  const orderNum = order.orderNumber.replace(/\D/g, '').slice(-4);
  const pitch = product?.conductorPitch ? parseFloat(product.conductorPitch) : 15;

  return {
    id: `MO_plan_${item.id}`,
    mfgOrderNumber: `MO-${year}-P${orderNum}-${String(existingCount + 1).padStart(2, '0')}`,
    orderId: order.id,
    orderNumber: order.orderNumber,
    productCode: order.productCode || '',
    productId: order.productId || '',
    productName: order.productName,
    machine: machineId,
    operatorId: null,
    targetQuantity: order.totalQuantity,
    actualOutput: 0,
    wasteQty: 0,
    status: '未着手',
    processSteps: PROCESS_ORDER.map((s, i) => ({
      step: s, order: i + 1, completed: false, completedDate: null,
    })),
    materialLot: '',
    measurements: product ? [
      { item: '外径',   specMin: product.spec.outerDiameter.min,  specMax: product.spec.outerDiameter.max,  actual: null },
      { item: '肉厚',   specMin: product.spec.wallThickness.min,   specMax: product.spec.wallThickness.max,   actual: null },
      { item: '偏肉',   specMin: 0,    specMax: 0.2,    actual: null },
      { item: 'ピッチ', specMin: Math.max(1, pitch - 2), specMax: pitch + 2, actual: null },
    ] : [],
    nextProcessLength: Math.round(order.totalQuantity * 1.035),
    startDate: item.startDate,
    endDate: null,
    fromPlan: true,  // 生産計画から自動生成されたフラグ
  };
}

// 進捗なし判定（削除可能か）
function hasNoProgress(mfgOrder) {
  return (
    mfgOrder.processSteps.every(s => !s.completed) &&
    mfgOrder.actualOutput === 0 &&
    !mfgOrder.materialLot
  );
}

export function AppProvider({ children }) {
  const [products, setProducts] = useState(initialProducts);

  const [quotes, setQuotes] = useState(() => {
    try {
      if (localStorage.getItem('sd_version') !== STORAGE_VERSION) return initialQuotes;
      const saved = localStorage.getItem('sd_quotes');
      return saved ? JSON.parse(saved) : initialQuotes;
    } catch { return initialQuotes; }
  });

  const [orders, setOrders] = useState(() => {
    try {
      if (localStorage.getItem('sd_version') !== STORAGE_VERSION) return initialOrders;
      const saved = localStorage.getItem('sd_orders');
      return saved ? JSON.parse(saved) : initialOrders;
    } catch { return initialOrders; }
  });
  const [mfgOrders, setMfgOrders] = useState(() => {
    try {
      if (localStorage.getItem('sd_version') !== STORAGE_VERSION) return initialMfgOrders;
      const saved = localStorage.getItem('sd_mfgOrders');
      return saved ? JSON.parse(saved) : initialMfgOrders;
    } catch { return initialMfgOrders; }
  });
  const [inventory, setInventory] = useState(initialInventory);
  const [copperPrice, setCopperPrice] = useState(currentCopperPrice);
  const [activeApp, setActiveApp] = useState('dashboard');

  const [productOrderHistory, setProductOrderHistory] = useState(() => {
    try {
      if (localStorage.getItem('sd_version') !== STORAGE_VERSION) return initialProductOrderHistory;
      const saved = localStorage.getItem('sd_productOrderHistory');
      return saved ? JSON.parse(saved) : initialProductOrderHistory;
    } catch { return initialProductOrderHistory; }
  });

  // ── 原材料調達・在庫管理ステート ────────────────────────────────
  const [currentStock, setCurrentStock] = useState(() => {
    try {
      if (localStorage.getItem('sd_version') !== STORAGE_VERSION) return initialCurrentStock;
      const saved = localStorage.getItem('sd_currentStock');
      return saved ? JSON.parse(saved) : initialCurrentStock;
    } catch { return initialCurrentStock; }
  });

  const [purchaseOrders, setPurchaseOrders] = useState(() => {
    try {
      if (localStorage.getItem('sd_version') !== STORAGE_VERSION) return initialPurchaseOrders;
      const saved = localStorage.getItem('sd_purchaseOrders');
      return saved ? JSON.parse(saved) : initialPurchaseOrders;
    } catch { return initialPurchaseOrders; }
  });

  const [materialAllocations, setMaterialAllocations] = useState(() => {
    try {
      if (localStorage.getItem('sd_version') !== STORAGE_VERSION) return initialMaterialAllocations;
      const saved = localStorage.getItem('sd_materialAllocations');
      return saved ? JSON.parse(saved) : initialMaterialAllocations;
    } catch { return initialMaterialAllocations; }
  });

  const [materialReceiving, setMaterialReceiving] = useState(() => {
    try {
      if (localStorage.getItem('sd_version') !== STORAGE_VERSION) return initialMaterialReceiving;
      const saved = localStorage.getItem('sd_materialReceiving');
      return saved ? JSON.parse(saved) : initialMaterialReceiving;
    } catch { return initialMaterialReceiving; }
  });

  const [materialIssuances, setMaterialIssuances] = useState(() => {
    try {
      if (localStorage.getItem('sd_version') !== STORAGE_VERSION) return initialMaterialIssuances;
      const saved = localStorage.getItem('sd_materialIssuances');
      return saved ? JSON.parse(saved) : initialMaterialIssuances;
    } catch { return initialMaterialIssuances; }
  });

  const [materialReturns, setMaterialReturns] = useState(() => {
    try {
      if (localStorage.getItem('sd_version') !== STORAGE_VERSION) return initialMaterialReturns;
      const saved = localStorage.getItem('sd_materialReturns');
      return saved ? JSON.parse(saved) : initialMaterialReturns;
    } catch { return initialMaterialReturns; }
  });

  const [inspections, setInspections] = useState(() => {
    try {
      if (localStorage.getItem('sd_version') !== STORAGE_VERSION) return _staticInspections;
      const saved = localStorage.getItem('sd_inspections');
      return saved ? JSON.parse(saved) : _staticInspections;
    } catch { return _staticInspections; }
  });

  const [labelIssuances, setLabelIssuances] = useState(() => {
    try {
      if (localStorage.getItem('sd_version') !== STORAGE_VERSION) return initialLabelIssuances;
      const saved = localStorage.getItem('sd_labelIssuances');
      return saved ? JSON.parse(saved) : initialLabelIssuances;
    } catch { return initialLabelIssuances; }
  });

  const [techRequests, setTechRequests] = useState(() => {
    try {
      if (localStorage.getItem('sd_version') !== STORAGE_VERSION) return initialTechRequests;
      const saved = localStorage.getItem('sd_techRequests');
      return saved ? JSON.parse(saved) : initialTechRequests;
    } catch { return initialTechRequests; }
  });

  const [troubleReports, setTroubleReports] = useState(() => {
    try {
      if (localStorage.getItem('sd_version') !== STORAGE_VERSION) return initialTroubleReports;
      const saved = localStorage.getItem('sd_troubleReports');
      return saved ? JSON.parse(saved) : initialTroubleReports;
    } catch { return initialTroubleReports; }
  });

  const [machineDetails, setMachineDetails] = useState(() => {
    try {
      if (localStorage.getItem('sd_version') !== STORAGE_VERSION) return initialMachineDetails;
      const saved = localStorage.getItem('sd_machineDetails');
      return saved ? JSON.parse(saved) : initialMachineDetails;
    } catch { return initialMachineDetails; }
  });

  const [fractionRule, setFractionRule] = useState(() => {
    try {
      const saved = localStorage.getItem('sd_fractionRule');
      return saved ? JSON.parse(saved) : initialFractionRule;
    } catch { return initialFractionRule; }
  });

  const [priceRevisions, setPriceRevisions] = useState(() => {
    try {
      if (localStorage.getItem('sd_version') !== STORAGE_VERSION) return [];
      const saved = localStorage.getItem('sd_priceRevisions');
      return saved ? JSON.parse(saved) : [];
    } catch { return []; }
  });

  // ── 顧客送信設定（dataTransmission の上書き） ─────────────────────
  // { [customerCode]: { dataTransmission: 'PDF' | 'EDI' } }
  const [customerSettings, setCustomerSettings] = useState(() => {
    try {
      const saved = localStorage.getItem('sd_customerSettings');
      return saved ? JSON.parse(saved) : {};
    } catch { return {}; }
  });

  // 棚割り付け（品目コード → メイン倉庫ロケーションID）
  const [materialShelfAssignment, setMaterialShelfAssignment] = useState(() => {
    try {
      const saved = localStorage.getItem('sd_materialShelfAssignment');
      return saved ? JSON.parse(saved) : initialMaterialShelfAssignment;
    } catch { return initialMaterialShelfAssignment; }
  });

  // ── 遅延アラート ───────────────────────────────────────────────
  const [delayAlerts, setDelayAlerts] = useState(() => {
    try {
      const saved = localStorage.getItem('sd_delayAlerts');
      return saved ? JSON.parse(saved) : [];
    } catch { return []; }
  });

  // ── 製品BOM（工程×材料） ────────────────────────────────────────
  const [productBOMs, setProductBOMs] = useState(() => {
    try {
      if (localStorage.getItem('sd_version') !== STORAGE_VERSION) return initialProductBOMs;
      const saved = localStorage.getItem('sd_productBOMs');
      return saved ? JSON.parse(saved) : initialProductBOMs;
    } catch { return initialProductBOMs; }
  });

  // ── 試作品マスタ ─────────────────────────────────────────────────
  const [prototypes, setPrototypes] = useState(() => {
    try {
      if (localStorage.getItem('sd_version') !== STORAGE_VERSION) return initialPrototypes;
      const saved = localStorage.getItem('sd_prototypes');
      return saved ? JSON.parse(saved) : initialPrototypes;
    } catch { return initialPrototypes; }
  });

  const [prototypeBOMs, setPrototypeBOMs] = useState(() => {
    try {
      if (localStorage.getItem('sd_version') !== STORAGE_VERSION) return initialPrototypeBOMs;
      const saved = localStorage.getItem('sd_prototypeBOMs');
      return saved ? JSON.parse(saved) : initialPrototypeBOMs;
    } catch { return initialPrototypeBOMs; }
  });

  // ── 取引先設定（銅価格タイミングなど） ──────────────────────────
  // suppliers定数の copperPriceTiming を上書き可能にするオーバーレイ
  const _defaultSupplierSettings = Object.fromEntries(
    suppliers.map(s => [s.id, { copperPriceTiming: s.copperPriceTiming ?? null }])
  );
  const [supplierSettings, setSupplierSettings] = useState(() => {
    try {
      if (localStorage.getItem('sd_version') !== STORAGE_VERSION) return _defaultSupplierSettings;
      const saved = localStorage.getItem('sd_supplierSettings');
      return saved ? JSON.parse(saved) : _defaultSupplierSettings;
    } catch { return _defaultSupplierSettings; }
  });

  // ── 生産計画スケジュール状態（画面遷移しても保持） ─────────────
  const [productionSchedule, setProductionSchedule] = useState(() => {
    try {
      if (localStorage.getItem('sd_version') !== STORAGE_VERSION) {
        // バージョン不一致 → 古いデータを破棄して初期値に戻す
        [
          'sd_productionSchedule','sd_mfgOrders','sd_quotes','sd_orders',
          'sd_productOrderHistory','sd_currentStock','sd_purchaseOrders',
          'sd_materialAllocations','sd_materialReceiving',
          'sd_materialIssuances','sd_materialReturns',
          'sd_productBOMs','sd_supplierSettings',
          'sd_inspections','sd_labelIssuances','sd_techRequests',
          'sd_troubleReports','sd_machineDetails',
          'sd_prototypes','sd_prototypeBOMs',
        ].forEach(k => localStorage.removeItem(k));
        localStorage.setItem('sd_version', STORAGE_VERSION);
        return INITIAL_PRODUCTION_SCHEDULE;
      }
      const saved = localStorage.getItem('sd_productionSchedule');
      return saved ? JSON.parse(saved) : INITIAL_PRODUCTION_SCHEDULE;
    } catch { return INITIAL_PRODUCTION_SCHEDULE; }
  });

  const TODAY = new Date('2026-05-21');

  // ── localStorage への自動保存 ──────────────────────────────────
  useEffect(() => {
    localStorage.setItem('sd_productionSchedule', JSON.stringify(productionSchedule));
  }, [productionSchedule]);

  useEffect(() => {
    localStorage.setItem('sd_mfgOrders', JSON.stringify(mfgOrders));
  }, [mfgOrders]);

  useEffect(() => {
    localStorage.setItem('sd_quotes', JSON.stringify(quotes));
  }, [quotes]);

  useEffect(() => {
    localStorage.setItem('sd_orders', JSON.stringify(orders));
  }, [orders]);

  useEffect(() => {
    localStorage.setItem('sd_productOrderHistory', JSON.stringify(productOrderHistory));
  }, [productOrderHistory]);

  useEffect(() => { localStorage.setItem('sd_currentStock',        JSON.stringify(currentStock));        }, [currentStock]);
  useEffect(() => { localStorage.setItem('sd_purchaseOrders',      JSON.stringify(purchaseOrders));      }, [purchaseOrders]);
  useEffect(() => { localStorage.setItem('sd_materialAllocations', JSON.stringify(materialAllocations)); }, [materialAllocations]);
  useEffect(() => { localStorage.setItem('sd_materialReceiving',   JSON.stringify(materialReceiving));   }, [materialReceiving]);
  useEffect(() => { localStorage.setItem('sd_materialIssuances',   JSON.stringify(materialIssuances));   }, [materialIssuances]);
  useEffect(() => { localStorage.setItem('sd_materialReturns',     JSON.stringify(materialReturns));     }, [materialReturns]);
  useEffect(() => { localStorage.setItem('sd_inspections',         JSON.stringify(inspections));         }, [inspections]);
  useEffect(() => { localStorage.setItem('sd_labelIssuances',      JSON.stringify(labelIssuances));      }, [labelIssuances]);
  useEffect(() => { localStorage.setItem('sd_techRequests',         JSON.stringify(techRequests));         }, [techRequests]);
  useEffect(() => { localStorage.setItem('sd_delayAlerts',         JSON.stringify(delayAlerts));         }, [delayAlerts]);
  useEffect(() => { localStorage.setItem('sd_troubleReports',      JSON.stringify(troubleReports));      }, [troubleReports]);
  useEffect(() => { localStorage.setItem('sd_machineDetails',      JSON.stringify(machineDetails));      }, [machineDetails]);
  useEffect(() => { localStorage.setItem('sd_fractionRule',        JSON.stringify(fractionRule));        }, [fractionRule]);
  useEffect(() => { localStorage.setItem('sd_priceRevisions',     JSON.stringify(priceRevisions));     }, [priceRevisions]);
  useEffect(() => { localStorage.setItem('sd_customerSettings',         JSON.stringify(customerSettings));         }, [customerSettings]);
  useEffect(() => { localStorage.setItem('sd_materialShelfAssignment', JSON.stringify(materialShelfAssignment)); }, [materialShelfAssignment]);

  // 機械サブロケーション在庫: 払い出し記録から自動計算（issued - returned per machine per material）
  const subLocationQty = useMemo(() => {
    const result = {};
    materialIssuances.forEach(iss => {
      if (!iss.machineId) return;
      const net = (iss.issuedQty || 0) - (iss.returnedQty || 0);
      if (net <= 0) return;
      if (!result[iss.machineId]) result[iss.machineId] = {};
      result[iss.machineId][iss.materialId] =
        Math.round(((result[iss.machineId][iss.materialId] || 0) + net) * 100) / 100;
    });
    return result;
  }, [materialIssuances]);
  useEffect(() => { localStorage.setItem('sd_productBOMs',         JSON.stringify(productBOMs));         }, [productBOMs]);
  useEffect(() => { localStorage.setItem('sd_supplierSettings',    JSON.stringify(supplierSettings));    }, [supplierSettings]);
  useEffect(() => { localStorage.setItem('sd_prototypes',          JSON.stringify(prototypes));          }, [prototypes]);
  useEffect(() => { localStorage.setItem('sd_prototypeBOMs',       JSON.stringify(prototypeBOMs));       }, [prototypeBOMs]);

  const deadlineAlerts = orders.filter((o) => {
    if (o.status !== '照会（仮押さえ）') return false;
    const deadline = new Date(o.arrangementDeadline);
    const diffDays = Math.ceil((deadline - TODAY) / (1000 * 60 * 60 * 24));
    return diffDays <= 3;
  });

  // ── 生産計画アクション ──────────────────────────────────────────

  // 未割り当て→機械へのドロップ（新規割り当て）
  const scheduleNewItem = (machineId, newItem) => {
    setProductionSchedule(prev => ({
      ...prev,
      [machineId]: [...(prev[machineId] || []), newItem],
    }));

    // 対象オーダーの mfgOrder が未作成なら自動生成
    setMfgOrders(prev => {
      const existing = prev.find(m => m.orderId === newItem.orderId);
      if (existing) return prev; // すでにある場合は作らない

      const order = orders.find(o => o.id === newItem.orderId);
      if (!order) return prev;
      const product = products.find(p => p.productCode === order.productCode);
      const built = buildMfgOrderFromPlan(newItem, order, product, machineId, prev.length);
      return [...prev, built];
    });
  };

  // 機械間の移動（mfgOrder は変更しない）
  const scheduleMoveItem = (fromMachineId, toMachineId, dragItem, newStartDate) => {
    setProductionSchedule(prev => {
      const next = { ...prev };
      next[fromMachineId] = (next[fromMachineId] || []).filter(it => it.id !== dragItem.id);
      const existingOnDay = (next[toMachineId] || []).filter(it => it.startDate === newStartDate);
      next[toMachineId] = [
        ...(next[toMachineId] || []),
        { ...dragItem, startDate: newStartDate, slotOrder: existingOnDay.length },
      ];
      return next;
    });
  };

  // 同一スロット内の並び替え
  const scheduleReorderInSlot = (machineId, startDate, itemId, direction) => {
    setProductionSchedule(prev => {
      const items = prev[machineId] || [];
      const slotItems = [...items.filter(it => it.startDate === startDate)]
        .sort((a, b) => (a.slotOrder ?? 0) - (b.slotOrder ?? 0));
      const idx = slotItems.findIndex(it => it.id === itemId);
      const swapIdx = idx + direction;
      if (swapIdx < 0 || swapIdx >= slotItems.length) return prev;
      const reordered = [...slotItems];
      [reordered[idx], reordered[swapIdx]] = [reordered[swapIdx], reordered[idx]];
      const idToOrder = {};
      reordered.forEach((it, i) => { idToOrder[it.id] = i; });
      return {
        ...prev,
        [machineId]: items.map(it =>
          it.startDate === startDate && idToOrder[it.id] !== undefined
            ? { ...it, slotOrder: idToOrder[it.id] }
            : it
        ),
      };
    });
  };

  // 機械→未割り当てへ戻す（進捗ゼロの fromPlan mfgOrder を削除）
  const scheduleUnassign = (machineId, item) => {
    setProductionSchedule(prev => ({
      ...prev,
      [machineId]: (prev[machineId] || []).filter(it => it.id !== item.id),
    }));

    setMfgOrders(prev => prev.filter(m => {
      if (m.orderId === item.orderId && m.fromPlan && hasNoProgress(m)) {
        // 同じオーダーの別プロセスがまだスケジュール済みかチェック
        const stillScheduled = Object.values(productionSchedule)
          .flat()
          .some(s => s.orderId === item.orderId && s.id !== item.id);
        if (!stillScheduled) return false; // 全工程が未割り当てになったので削除
      }
      return true;
    }));
  };

  // × ボタンでの削除（scheduleUnassign と同じ動作）
  const scheduleRemoveItem = (machineId, item) => {
    scheduleUnassign(machineId, item);
  };

  // スケジュール全体の一括置き換え（自動修正用）
  const scheduleBulkUpdate = (newSchedule) => {
    setProductionSchedule(newSchedule);
  };

  // 複数アイテムの一括自動配置（スケジュール更新 + mfgOrder自動生成）
  const scheduleAutoAssignBatch = (itemAssignments) => {
    // itemAssignments: [{ machineId, item }]
    setProductionSchedule(prev => {
      const next = { ...prev };
      itemAssignments.forEach(({ machineId, item }) => {
        next[machineId] = [...(next[machineId] || []), item];
      });
      return next;
    });
    setMfgOrders(prev => {
      const updated = [...prev];
      itemAssignments.forEach(({ machineId, item }) => {
        if (updated.find(m => m.orderId === item.orderId)) return;
        const order = orders.find(o => o.id === item.orderId);
        if (!order) return;
        const product = products.find(p => p.productCode === order.productCode);
        updated.push(buildMfgOrderFromPlan(item, order, product, machineId, updated.length));
      });
      return updated;
    });
  };

  // ── 受注実績アクション ──────────────────────────────────────────
  const addProductHistoryEntry = (productCode, entry) => {
    setProductOrderHistory(prev => ({
      ...prev,
      [productCode]: [...(prev[productCode] || []), entry],
    }));
  };

  const updateProductHistoryEntry = (productCode, entryId, updates) => {
    setProductOrderHistory(prev => ({
      ...prev,
      [productCode]: (prev[productCode] || []).map(e =>
        e.id === entryId ? { ...e, ...updates } : e
      ),
    }));
  };

  const deleteProductHistoryEntry = (productCode, entryId) => {
    setProductOrderHistory(prev => ({
      ...prev,
      [productCode]: (prev[productCode] || []).filter(e => e.id !== entryId),
    }));
  };

  // ── 原材料調達アクション ────────────────────────────────────────

  // 引当：在庫から必要量を差し引き、引当レコードを作成
  const allocateMaterial = (allocation) => {
    setMaterialAllocations(prev => {
      const existing = prev.find(a => a.id === allocation.id);
      return existing
        ? prev.map(a => a.id === allocation.id ? { ...a, ...allocation } : a)
        : [...prev, allocation];
    });
    // 引当済みの場合は現在庫を減らす
    if (allocation.allocatedQty > 0) {
      setCurrentStock(prev => ({
        ...prev,
        [allocation.materialId]: Math.max(0, (prev[allocation.materialId] || 0) - allocation.allocatedQty),
      }));
    }
  };

  // 発注書作成
  const createPurchaseOrder = (po) => {
    setPurchaseOrders(prev => [...prev, po]);
    setMaterialReceiving(prev => [...prev, {
      id: `RCV-${Date.now()}`,
      purchaseOrderId: po.id,
      poNumber: po.poNumber,
      materialId: po.materialId,
      materialName: po.materialName,
      unit: po.unit,
      orderedQty: po.orderedQty,
      receivedQty: 0,
      scheduledDate: po.confirmedDeliveryDate || po.requestedDeliveryDate,
      actualReceivedDate: null,
      lotNumber: '',
      inspectionStatus: '未検品',
      inspectionNote: '',
      status: '入荷待ち',
      inspectedBy: null,
      inspectedDate: null,
    }]);
  };

  // 発注書更新（納期回答など）
  const updatePurchaseOrder = (poId, updates) => {
    setPurchaseOrders(prev => prev.map(po => po.id === poId ? { ...po, ...updates } : po));
    // 納期確定時は入荷管理レコードの予定日も更新
    if (updates.confirmedDeliveryDate) {
      setMaterialReceiving(prev => prev.map(r =>
        r.purchaseOrderId === poId ? { ...r, scheduledDate: updates.confirmedDeliveryDate } : r
      ));
    }
  };

  // 入荷検品完了：在庫を増やす
  const completeReceiving = (receivingId, { receivedQty, lotNumber, inspectedBy, inspectionNote, inspectionStatus }) => {
    setMaterialReceiving(prev => prev.map(r => {
      if (r.id !== receivingId) return r;
      return {
        ...r, receivedQty, lotNumber, inspectedBy,
        inspectionNote, inspectionStatus,
        actualReceivedDate: new Date().toISOString().split('T')[0],
        status: receivedQty >= r.orderedQty ? '検品完了' : '一部入荷',
      };
    }));
    const rcv = materialReceiving.find(r => r.id === receivingId);
    if (!rcv) return;
    if (inspectionStatus === '合格') {
      setCurrentStock(prev => ({
        ...prev,
        [rcv.materialId]: (prev[rcv.materialId] || 0) + receivedQty,
      }));
      setPurchaseOrders(prev => prev.map(po =>
        po.id === rcv.purchaseOrderId ? { ...po, status: receivedQty >= po.orderedQty ? '完納' : '一部入荷' } : po
      ));
      // 入荷アラート対象の未引当分を再引当
      setMaterialAllocations(prev => prev.map(a => {
        if (a.materialId !== rcv.materialId || a.status !== '一部引当') return a;
        return { ...a, status: '引当済', shortQty: 0, allocatedQty: a.requiredQty };
      }));
    }
  };

  // 払い出し記録
  const issueMaterial = (issuance) => {
    setMaterialIssuances(prev => [...prev, issuance]);
    setCurrentStock(prev => ({
      ...prev,
      [issuance.materialId]: Math.max(0, (prev[issuance.materialId] || 0) - issuance.issuedQty),
    }));
    // 返却管理レコード作成（使用量確定後に更新）
    setMaterialReturns(prev => [...prev, {
      id: `RTN-${Date.now()}`,
      issuanceId: issuance.id,
      mfgOrderId: issuance.mfgOrderId,
      mfgOrderNumber: issuance.mfgOrderNumber,
      materialId: issuance.materialId,
      materialName: issuance.materialName,
      unit: issuance.unit,
      issuedQty: issuance.issuedQty,
      usedQty: null,
      expectedReturnQty: null,
      returnedQty: null,
      status: '要返却',
      returnDate: null,
      confirmedBy: null,
      notes: '',
    }]);
  };

  // 返却確認：在庫を戻す
  const confirmReturn = (returnId, { usedQty, returnedQty, confirmedBy, notes }) => {
    const rtn = materialReturns.find(r => r.id === returnId);
    if (!rtn) return;
    const actualReturn = returnedQty ?? 0;
    setMaterialReturns(prev => prev.map(r =>
      r.id === returnId ? {
        ...r, usedQty, returnedQty: actualReturn,
        expectedReturnQty: rtn.issuedQty - usedQty,
        status: actualReturn > 0 ? '返却済' : '返却不要',
        returnDate: new Date().toISOString().split('T')[0],
        confirmedBy, notes,
      } : r
    ));
    if (actualReturn > 0) {
      setCurrentStock(prev => ({
        ...prev,
        [rtn.materialId]: (prev[rtn.materialId] || 0) + actualReturn,
      }));
    }
  };

  // ── 遅延アラート操作 ───────────────────────────────────────────
  const addDelayAlert = ({ orderId, orderNumber, productName, processName, comment, createdBy }) => {
    const newAlert = {
      id: `da${Date.now()}`,
      orderId,
      orderNumber,
      productName,
      processName,
      comment,
      createdBy,
      createdAt: '2026-05-21',
      status: 'active',
    };
    setDelayAlerts(prev => [newAlert, ...prev]);
  };

  const addTroubleReport = (report) => {
    const newRep = {
      id: `TRB-${Date.now()}`,
      createdAt: '2026-05-21',
      status: '対応中',
      resolvedAt: null,
      resolution: '',
      ...report,
    };
    setTroubleReports(prev => [newRep, ...prev]);
  };

  const resolveTroubleReport = (id, resolution) => {
    setTroubleReports(prev => prev.map(r =>
      r.id === id ? { ...r, status: '解決済', resolvedAt: '2026-05-21', resolution } : r
    ));
  };

  const resolveDelayAlert = (alertId) => {
    setDelayAlerts(prev => prev.map(a =>
      a.id === alertId ? { ...a, status: 'resolved', resolvedAt: '2026-05-21' } : a
    ));
  };

  // ── 顧客送信設定操作 ────────────────────────────────────────────
  const updateMaterialShelf = (materialId, shelfId) => {
    setMaterialShelfAssignment(prev => ({ ...prev, [materialId]: shelfId }));
  };

  const updateCustomerDataTransmission = (customerCode, mode) => {
    setCustomerSettings(prev => ({
      ...prev,
      [customerCode]: { ...(prev[customerCode] || {}), dataTransmission: mode },
    }));
  };

  // 顧客の実効 dataTransmission を取得（設定上書き優先、なければ mockData デフォルト値）
  const getCustomerDataTransmission = (customerCode) => {
    if (customerSettings[customerCode]?.dataTransmission) {
      return customerSettings[customerCode].dataTransmission;
    }
    const c = customers.find(c => c.code === customerCode);
    return c?.dataTransmission || 'PDF';
  };

  // ── 価格改定操作 ────────────────────────────────────────────────
  const addPriceRevision = (rev) => {
    setPriceRevisions(prev => [{ id: `PR-${Date.now()}`, ...rev }, ...prev]);
  };
  const deletePriceRevision = (id) => {
    setPriceRevisions(prev => prev.filter(r => r.id !== id));
  };
  // materialId, orderDate, deliveryDate → 適用単価（なければ null）
  const getApplicableRevisionPrice = (materialId, orderDate, deliveryDate) => {
    const revs = priceRevisions
      .filter(r => r.materialId === materialId)
      .sort((a, b) => b.effectiveDate.localeCompare(a.effectiveDate));
    for (const r of revs) {
      const refDate = r.basis === '納入日' ? deliveryDate : orderDate;
      if (refDate && refDate >= r.effectiveDate) return r.newPrice;
    }
    return null;
  };

  // ── BOM操作 ────────────────────────────────────────────────────
  const updateProductBOM = (productId, boms) => {
    setProductBOMs(prev => ({ ...prev, [productId]: boms }));
  };

  const addBOMEntry = (productId, entry) => {
    setProductBOMs(prev => ({
      ...prev,
      [productId]: [...(prev[productId] || []), entry],
    }));
  };

  const deleteBOMEntry = (productId, entryId) => {
    setProductBOMs(prev => ({
      ...prev,
      [productId]: (prev[productId] || []).filter(b => b.id !== entryId),
    }));
  };

  // ── 試作品BOM操作 ───────────────────────────────────────────────
  const updatePrototypeBOM = (protoId, boms) => {
    setPrototypeBOMs(prev => ({ ...prev, [protoId]: boms }));
  };

  const addPrototypeBOMEntry = (protoId, entry) => {
    setPrototypeBOMs(prev => ({
      ...prev,
      [protoId]: [...(prev[protoId] || []), entry],
    }));
  };

  const deletePrototypeBOMEntry = (protoId, entryId) => {
    setPrototypeBOMs(prev => ({
      ...prev,
      [protoId]: (prev[protoId] || []).filter(b => b.id !== entryId),
    }));
  };

  // 試作品→製品マスタへ転記（製品コードを自動発行）
  const transferPrototypeToProduct = (protoId) => {
    const proto = prototypes.find(p => p.id === protoId);
    if (!proto || proto.transferredProductId) return null;

    const newProductId = `P${String(Date.now()).slice(-6)}`;
    const existingCodes = products.map(p => p.productCode).filter(c => c.startsWith('NEW-'));
    const seq = String(existingCodes.length + 1).padStart(4, '0');
    const newProductCode = `NEW-${seq}`;

    const newProduct = {
      id: newProductId,
      productCode: newProductCode,
      designNumber: proto.designNumber || '',
      customerCode: proto.customerCode || '',
      customerName: proto.customerName || '',
      sheathColor: proto.sheathColor || '',
      conductorPitch: '',
      packaging: 'ドラム(D400)',
      requiredDocuments: [],
      sampleLength: 0,
      billingCycle: '月末',
      shippingMethod: 'FAX',
      spec: proto.spec || { outerDiameter: { min: 0, max: 0 }, wallThickness: { min: 0, max: 0 } },
      name: proto.name,
      copperContentPerM: 0,
      drawingUrl: '',
      drawingRevision: 'Rev.1',
      cableType: '',
      workConditions: {},
      labelSettings: { printer: '1号機', paperType: '標準', inspectionRequired: false },
      sourcePrototypeCode: proto.prototypeCode,
      sourcePrototypeId: protoId,
    };

    setProducts(prev => [...prev, newProduct]);

    // 試作品BOMを製品BOMにコピー
    const boms = prototypeBOMs[protoId];
    if (boms && boms.length > 0) {
      setProductBOMs(prev => ({ ...prev, [newProductId]: boms }));
    }

    // 試作品を転記済みに更新
    setPrototypes(prev => prev.map(p =>
      p.id === protoId
        ? { ...p, status: '転記済', transferredProductId: newProductId, transferredProductCode: newProductCode, transferredDate: '2026-08-20' }
        : p
    ));

    return newProduct;
  };

  // ── 取引先設定操作 ──────────────────────────────────────────────
  const updateSupplierSetting = (supplierId, updates) => {
    setSupplierSettings(prev => ({
      ...prev,
      [supplierId]: { ...(prev[supplierId] || {}), ...updates },
    }));
  };

  // 銅ベース材料の価格計算（仕入先のcopperPriceTiming + 銅スポット価格）
  // copperSpotPrice を省略すると現在の copperPrice を使う
  const calcMaterialPrice = (material, supplierId, copperSpotPrice) => {
    if (!material.isCopperBased) return material.standardPrice;
    const spot = copperSpotPrice ?? copperPrice;
    return material.baseProcessingCost + material.copperRatio * spot;
  };

  // 製品1本(100m)あたりの材料原価計算
  // timing: '見積時'|'受注時'|'出荷時' → 銅価格をどのタイミングで確定するかで計算を変える
  // spotAtQuote / spotAtOrder / spotAtShip は各タイミングの実際の銅スポット価格
  const calcBOMCost = (productId, supplierId, { spotAtQuote, spotAtOrder, spotAtShip } = {}) => {
    const boms = productBOMs[productId] || [];
    const setting = supplierSettings[supplierId] || {};
    const timing = setting.copperPriceTiming;

    return boms.reduce((total, b) => {
      const mat = materials.find(m => m.id === b.materialId);
      if (!mat) return total;

      let unitPrice;
      if (mat.isCopperBased) {
        const spot = timing === '受注時' ? (spotAtOrder ?? copperPrice)
                   : timing === '出荷時' ? (spotAtShip  ?? copperPrice)
                   : (spotAtQuote ?? copperPrice); // 見積時 or null
        unitPrice = mat.baseProcessingCost + mat.copperRatio * spot;
      } else {
        unitPrice = mat.standardPrice;
      }
      return total + b.qty * b.lossRate * unitPrice;
    }, 0);
  };

  // 日数変更（mfgOrder は変更しない）
  const scheduleUpdateDuration = (machineId, itemId, delta) => {
    setProductionSchedule(prev => ({
      ...prev,
      [machineId]: prev[machineId].map(it => {
        if (it.id !== itemId) return it;
        const newDur = it.duration + delta;
        return newDur >= 1 ? { ...it, duration: newDur } : it;
      }),
    }));
  };

  const value = {
    products, setProducts,
    quotes, setQuotes,
    orders, setOrders,
    mfgOrders, setMfgOrders,
    inventory, setInventory,
    copperPrice, setCopperPrice,
    customers, materials, machines, suppliers, materialReorderConfig,
    activeApp, setActiveApp,
    deadlineAlerts,
    TODAY,
    // 受注実績
    productOrderHistory,
    addProductHistoryEntry,
    updateProductHistoryEntry,
    deleteProductHistoryEntry,
    // 原材料調達・在庫管理
    currentStock, setCurrentStock,
    purchaseOrders, setPurchaseOrders,
    materialAllocations, setMaterialAllocations,
    materialReceiving, setMaterialReceiving,
    materialIssuances, setMaterialIssuances,
    materialReturns, setMaterialReturns,
    allocateMaterial, createPurchaseOrder, updatePurchaseOrder,
    completeReceiving, issueMaterial, confirmReturn,
    // 遅延アラート
    delayAlerts,
    addDelayAlert,
    resolveDelayAlert,
    // BOM管理
    productBOMs,
    updateProductBOM,
    addBOMEntry,
    deleteBOMEntry,
    // 試作品マスタ
    prototypes, setPrototypes,
    prototypeBOMs,
    updatePrototypeBOM,
    addPrototypeBOMEntry,
    deletePrototypeBOMEntry,
    transferPrototypeToProduct,
    // 取引先設定
    supplierSettings,
    updateSupplierSetting,
    // 原価計算ユーティリティ
    calcMaterialPrice,
    calcBOMCost,
    // 検品・庫入れ
    inspections, setInspections,
    // ラベル出力
    labelIssuances, setLabelIssuances,
    // 技術依頼
    techRequests, setTechRequests,
    // トラブル報告
    troubleReports, addTroubleReport, resolveTroubleReport,
    // 設備マスタ
    machineDetails, setMachineDetails,
    // 端数処理設定
    fractionRule, setFractionRule,
    // 顧客送信設定
    customerSettings, updateCustomerDataTransmission, getCustomerDataTransmission,
    // 棚ロケーション管理
    materialShelfAssignment, updateMaterialShelf, subLocationQty,
    // 価格改定
    priceRevisions, addPriceRevision, deletePriceRevision, getApplicableRevisionPrice,
    // 生産計画
    productionSchedule,
    scheduleNewItem,
    scheduleMoveItem,
    scheduleUnassign,
    scheduleRemoveItem,
    scheduleUpdateDuration,
    scheduleReorderInSlot,
    scheduleBulkUpdate,
    scheduleAutoAssignBatch,
  };

  return <AppContext.Provider value={value}>{children}</AppContext.Provider>;
}

export const useApp = () => useContext(AppContext);
