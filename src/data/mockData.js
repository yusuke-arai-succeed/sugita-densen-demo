// 杉田電線 デモ用モックデータ

export const PROCESS_ORDER = ['撚線', '編組', '押出', '加工'];

// 生産計画の初期スケジュール（AppContextで管理）
export const INITIAL_PRODUCTION_SCHEDULE = {
  'EX-07':     [{ id:'si01', orderId:'O001', process:'押出', startDate:'2026-05-19', duration:2 }],
  'EX-12':     [{ id:'si06', orderId:'O002', process:'押出', startDate:'2026-05-20', duration:1 }],
  'SL-1':      [{ id:'si02', orderId:'O001', process:'撚線', startDate:'2026-05-21', duration:2 }],
  'BA-01':     [{ id:'si03', orderId:'O001', process:'編組', startDate:'2026-05-22', duration:3 }],
  '切断AC-01': [{ id:'si04', orderId:'O001', process:'加工', startDate:'2026-05-26', duration:1 }],
  'EX-03':     [{ id:'si08', orderId:'O004', process:'押出', startDate:'2026-05-25', duration:3 }],
};

export const customers = [
  { id:'C001', code:'C001', name:'FDC株式会社',                   contact:'鈴木 部長',   billingCycle:'月末',     shippingMethod:'FAX',          labelFormat:'フォーマットA', customerCodeOnLabel:true,  dataTransmission:'PDF' },
  { id:'C002', code:'C002', name:'三菱電機株式会社',               contact:'田中 係長',   billingCycle:'15日',     shippingMethod:'EDI',          labelFormat:'フォーマットB', customerCodeOnLabel:true,  dataTransmission:'EDI' },
  { id:'C003', code:'C003', name:'豊田自動織機',                   contact:'加藤 担当',   billingCycle:'20日',     shippingMethod:'メール',        labelFormat:'フォーマットA', customerCodeOnLabel:true,  dataTransmission:'PDF' },
  { id:'C004', code:'C004', name:'ヤマハ発動機株式会社',           contact:'渡辺 部長',   billingCycle:'都度請求', shippingMethod:'紙',            labelFormat:'標準',          customerCodeOnLabel:true,  dataTransmission:'PDF' },
  { id:'C005', code:'C005', name:'富士電機株式会社',               contact:'中村 係長',   billingCycle:'月末',     shippingMethod:'メール',        labelFormat:'標準',          customerCodeOnLabel:false, dataTransmission:'PDF' },
  { id:'C006', code:'C006', name:'パナソニック株式会社',           contact:'山本 部長',   billingCycle:'月末',     shippingMethod:'EDI',          labelFormat:'フォーマットB', customerCodeOnLabel:true,  dataTransmission:'EDI' },
  { id:'C007', code:'C007', name:'日立製作所',                     contact:'佐々木 係長', billingCycle:'15日',     shippingMethod:'EDI',          labelFormat:'標準',          customerCodeOnLabel:false, dataTransmission:'EDI' },
  { id:'C008', code:'C008', name:'東芝インフラシステムズ株式会社', contact:'木村 担当',   billingCycle:'月末',     shippingMethod:'FAX',          labelFormat:'フォーマットA', customerCodeOnLabel:true,  dataTransmission:'PDF' },
  { id:'C009', code:'C009', name:'川崎重工業株式会社',             contact:'林 部長',     billingCycle:'20日',     shippingMethod:'メール',        labelFormat:'標準',          customerCodeOnLabel:false, dataTransmission:'PDF' },
  { id:'C010', code:'C010', name:'住友電気工業株式会社',           contact:'清水 係長',   billingCycle:'月末',     shippingMethod:'EDI',          labelFormat:'フォーマットB', customerCodeOnLabel:true,  dataTransmission:'EDI' },
  { id:'C011', code:'C011', name:'NEC株式会社',                    contact:'田口 担当',   billingCycle:'15日',     shippingMethod:'システム送付',  labelFormat:'標準',          customerCodeOnLabel:true,  dataTransmission:'EDI' },
  { id:'C012', code:'C012', name:'富士通株式会社',                 contact:'石田 部長',   billingCycle:'月末',     shippingMethod:'メール',        labelFormat:'標準',          customerCodeOnLabel:false, dataTransmission:'PDF' },
  { id:'C013', code:'C013', name:'ダイキン工業株式会社',           contact:'中島 係長',   billingCycle:'都度請求', shippingMethod:'紙',            labelFormat:'フォーマットA', customerCodeOnLabel:true,  dataTransmission:'PDF' },
  { id:'C014', code:'C014', name:'オムロン株式会社',               contact:'藤本 担当',   billingCycle:'20日',     shippingMethod:'FAX',          labelFormat:'標準',          customerCodeOnLabel:false, dataTransmission:'PDF' },
  { id:'C015', code:'C015', name:'安川電機株式会社',               contact:'高橋 部長',   billingCycle:'月末',     shippingMethod:'メール',        labelFormat:'フォーマットB', customerCodeOnLabel:true,  dataTransmission:'PDF' },
];

// ─── 静的製品データ P001-P005 ─────────────────────────────────────────────────
const _staticProducts = [
  {
    id: 'P001',
    productCode: 'CV-3.5-3C-BLK',
    designNumber: 'TF-2021-0342',
    customerCode: 'C001',
    customerName: 'FDC株式会社',
    sheathColor: '黒',
    conductorPitch: '15mm',
    packaging: 'ドラム(D400)',
    requiredDocuments: ['納品書（指定単票）', '試験成績表'],
    sampleLength: 2,
    billingCycle: '月末',
    shippingMethod: 'FAX',
    spec: { outerDiameter: { min: 11.5, max: 12.5 }, wallThickness: { min: 0.8, max: 1.2 } },
    name: 'CV 3.5mm² 3芯 黒シース',
    copperContentPerM: 0.093,
    drawingUrl: '',
    drawingRevision: 'Rev.3',
    cableType: '3core',
    workConditions: {
      '押出': '押出温度180〜200°C。導体予熱（80°C）必須。線速3m/min維持。外径φ4.2±0.1mm確認。',
      '撚線': '撚りピッチ15mm±1mm。サービスファクター1.02以下。撚り方向：左撚り(S)。集合外径φ11.2±0.3mm。介在PP紐張力0.5N均一。',
      '編組': '編組角度45°±2°。素線径0.3mm、本数24本確認。カバレージ率90%以上。',
      '加工': '押出温度160〜180°C。外径φ12.0±0.5mm。エンボス刻印（製品コード・長さ）確認。切断長さ・端末処理確認。',
    },
    labelSettings: { printer: '1号機', paperType: 'PSマーク', inspectionRequired: false },
  },
  {
    id: 'P002',
    productCode: 'CV-5.5-3C-RED',
    designNumber: 'TF-2021-0456',
    customerCode: 'C002',
    customerName: '三菱電機株式会社',
    sheathColor: '赤',
    conductorPitch: '20mm',
    packaging: 'ドラム(D500)',
    requiredDocuments: ['納品書（指定単票）', '試験成績表', 'サンプル（要）'],
    sampleLength: 3,
    billingCycle: '15日',
    shippingMethod: 'EDI',
    spec: { outerDiameter: { min: 14.0, max: 15.0 }, wallThickness: { min: 1.0, max: 1.4 } },
    name: 'CV 5.5mm² 3芯 赤シース',
    copperContentPerM: 0.147,
    drawingUrl: '',
    drawingRevision: 'Rev.2',
    cableType: '3core',
    workConditions: {
      '押出': '押出温度185〜205°C。導体予熱（100°C）必須。外径φ5.2±0.1mm確認。',
      '撚線': '撚りピッチ20mm±1mm。左撚り(S)。撚り後外径φ13.2mm以下確認。集合外径φ13.8±0.3mm確認。PP紐3本均等配置。',
      '編組': '本数32本。カバレージ率88%以上。',
      '加工': '押出温度165〜185°C。シース色（赤）確認。外径φ14.5±0.5mm。切断・端末処理後寸法確認。',
    },
    labelSettings: { printer: '2号機', paperType: 'TSEマーク', inspectionRequired: false },
  },
  {
    id: 'P003',
    productCode: 'THHW-1.25-SGL-GRN',
    designNumber: 'FK-2020-1123',
    customerCode: 'C003',
    customerName: '豊田自動織機',
    sheathColor: '緑',
    conductorPitch: '10mm',
    packaging: '把',
    requiredDocuments: ['納品書（指定単票）'],
    sampleLength: 0,
    billingCycle: '20日',
    shippingMethod: 'メール',
    spec: { outerDiameter: { min: 2.8, max: 3.2 }, wallThickness: { min: 0.5, max: 0.8 } },
    name: 'THHW 1.25mm² 単芯 緑',
    copperContentPerM: 0.011,
    drawingUrl: '',
    drawingRevision: 'Rev.1',
    cableType: 'single',
    workConditions: {
      '押出': '押出温度175〜195°C。線速10m/min。絶縁色（緑）確認。外径φ3.0±0.1mm。肉厚0.6mm以上確認。',
      '撚線': '単芯のため撚線工程なし。',
      '編組': '単芯のため編組工程なし。',
      '加工': '単芯のためシース押出不要。切断長さ・ドラム巻き確認。',
    },
    labelSettings: { printer: '1号機', paperType: '標準', inspectionRequired: true },
  },
  {
    id: 'P004',
    productCode: 'CV-8-4C-BLK',
    designNumber: 'TF-2022-0089',
    customerCode: 'C001',
    customerName: 'FDC株式会社',
    sheathColor: '黒',
    conductorPitch: '25mm',
    packaging: 'ドラム(D600)',
    requiredDocuments: ['納品書（指定単票）', '試験成績表'],
    sampleLength: 5,
    billingCycle: '月末',
    shippingMethod: 'FAX',
    spec: { outerDiameter: { min: 20.0, max: 21.5 }, wallThickness: { min: 1.2, max: 1.6 } },
    name: 'CV 8mm² 4芯 黒シース',
    copperContentPerM: 0.288,
    drawingUrl: '',
    drawingRevision: 'Rev.4',
    cableType: '4core',
    workConditions: {
      '押出': '押出温度190〜210°C。導体予熱（120°C）必須。外径φ7.0±0.15mm確認。',
      '撚線': '4芯撚り。ピッチ25mm±1.5mm。右撚り(Z)。集合外径φ20.2±0.4mm。GEコア（緑/黄）位置確認。',
      '編組': '素線径0.5mm、本数48本。カバレージ率92%以上必須。',
      '加工': '外径φ21.0±0.5mm。刻印：製品コード・長さ・製造年月。肉厚1.4mm以上確認。切断長さ確認。',
    },
    labelSettings: { printer: '3号機', paperType: 'PSマーク', inspectionRequired: false },
  },
  {
    id: 'P005',
    productCode: 'CTL-0.75-10C-GRY',
    designNumber: 'MS-2021-0567',
    customerCode: 'C004',
    customerName: 'ヤマハ発動機株式会社',
    sheathColor: '黒',
    conductorPitch: '12mm',
    packaging: 'ドラム(D400)',
    requiredDocuments: ['試験成績表'],
    sampleLength: 2,
    billingCycle: '都度請求',
    shippingMethod: '紙',
    spec: { outerDiameter: { min: 12.0, max: 13.0 }, wallThickness: { min: 0.6, max: 0.9 } },
    name: '制御ケーブル 0.75mm² 10芯',
    copperContentPerM: 0.067,
    drawingUrl: '',
    drawingRevision: 'Rev.2',
    cableType: '10core',
    workConditions: {
      '押出': '10色識別絶縁。線色順序（黒白赤緑青黄茶橙紫灰）確認必須。外径φ1.8±0.05mm。',
      '撚線': '5対撚り（黒白/赤緑/青黄/茶橙/紫灰）。各対ピッチ相違させること。集合外径φ11.5±0.3mm。対撚り5対の配置確認。',
      '編組': '素線径0.2mm、本数24本。カバレージ率85%以上。',
      '加工': '外径φ12.5±0.5mm。グレーシース色確認。線番表示テープ有り確認。切断長さ・端末確認。',
    },
    labelSettings: { printer: '2号機', paperType: 'ULマーク', inspectionRequired: true },
  },
];

// ─── 生成製品 P006-P050 ───────────────────────────────────────────────────────
const _CN = {
  C001:'FDC株式会社',C002:'三菱電機株式会社',C003:'豊田自動織機',
  C004:'ヤマハ発動機株式会社',C005:'富士電機株式会社',C006:'パナソニック株式会社',
  C007:'日立製作所',C008:'東芝インフラシステムズ株式会社',C009:'川崎重工業株式会社',
  C010:'住友電気工業株式会社',C011:'NEC株式会社',C012:'富士通株式会社',
  C013:'ダイキン工業株式会社',C014:'オムロン株式会社',C015:'安川電機株式会社',
};
// [id, code, name, custId, color, odMin, odMax, wtMin, wtMax, cuPerM, pitch, pkg, reqDocs, billing, ship]
const _PR = [
  ['P006','CV-1.25-2C-BLK', 'CV 1.25mm² 2芯 黒シース',        'C005','黒',     7.5, 8.0,0.6, 0.8, 0.025,10,'ドラム(D400)',['納品書（指定単票）'],                       '月末',    'FAX'],
  ['P007','CV-2-2C-BLK',    'CV 2mm² 2芯 黒シース',            'C006','黒',     8.5, 9.0,0.65,0.9, 0.036,12,'ドラム(D400)',['納品書（指定単票）','試験成績表'],           '15日',    'EDI'],
  ['P008','CV-2-3C-BLK',    'CV 2mm² 3芯 黒シース',            'C001','黒',    10.0,10.5,0.7, 0.9, 0.054,12,'ドラム(D400)',['納品書（指定単票）','試験成績表'],           '月末',    'FAX'],
  ['P009','CV-2-4C-BLK',    'CV 2mm² 4芯 黒シース',            'C002','黒',    11.5,12.0,0.7, 0.9, 0.072,12,'ドラム(D500)',['納品書（指定単票）'],                       '15日',    'EDI'],
  ['P010','CV-3.5-2C-BLK',  'CV 3.5mm² 2芯 黒シース',          'C007','黒',     9.5,10.0,0.7, 1.0, 0.062,15,'ドラム(D400)',['試験成績表'],                               '20日',    'メール'],
  ['P011','CV-3.5-4C-BLK',  'CV 3.5mm² 4芯 黒シース',          'C001','黒',    13.5,14.5,0.8, 1.1, 0.124,15,'ドラム(D500)',['納品書（指定単票）','試験成績表'],           '月末',    'FAX'],
  ['P012','CV-5.5-2C-BLK',  'CV 5.5mm² 2芯 黒シース',          'C008','黒',    12.0,12.5,0.9, 1.2, 0.098,18,'ドラム(D500)',['納品書（指定単票）'],                       '月末',    'メール'],
  ['P013','CV-5.5-4C-BLK',  'CV 5.5mm² 4芯 黒シース',          'C002','黒',    16.5,17.5,0.9, 1.2, 0.196,18,'ドラム(D600)',['納品書（指定単票）','試験成績表'],           '15日',    'EDI'],
  ['P014','CV-8-2C-BLK',    'CV 8mm² 2芯 黒シース',            'C003','黒',    14.0,15.0,1.0, 1.3, 0.144,22,'ドラム(D500)',['試験成績表'],                               '20日',    'メール'],
  ['P015','CV-8-3C-BLK',    'CV 8mm² 3芯 黒シース',            'C009','黒',    17.0,18.0,1.0, 1.3, 0.216,22,'ドラム(D600)',['納品書（指定単票）','試験成績表'],           '月末',    'FAX'],
  ['P016','CV-14-3C-BLK',   'CV 14mm² 3芯 黒シース',           'C001','黒',    21.0,22.5,1.2, 1.6, 0.378,25,'ドラム(D600)',['納品書（指定単票）','試験成績表'],           '月末',    'FAX'],
  ['P017','CV-14-4C-BLK',   'CV 14mm² 4芯 黒シース',           'C010','黒',    24.0,25.5,1.2, 1.6, 0.504,25,'ドラム(D600)',['納品書（指定単票）','試験成績表'],           '月末',    'システム送付'],
  ['P018','CV-22-3C-BLK',   'CV 22mm² 3芯 黒シース',           'C004','黒',    25.5,27.0,1.4, 1.8, 0.594,28,'ドラム(D600)',['納品書（指定単票）','試験成績表'],           '都度請求','紙'],
  ['P019','CV-22-4C-BLK',   'CV 22mm² 4芯 黒シース',           'C002','黒',    28.0,30.0,1.4, 1.8, 0.792,28,'ドラム(D600)',['納品書（指定単票）','試験成績表'],           '15日',    'EDI'],
  ['P020','CV-38-3C-BLK',   'CV 38mm² 3芯 黒シース',           'C011','黒',    30.0,32.0,1.6, 2.0, 1.026,32,'ドラム(D600)',['納品書（指定単票）','試験成績表','サンプル（要）'],'月末','FAX'],
  ['P021','THHW-2-SGL-BLK', 'THHW 2mm² 単芯 黒',               'C003','黒',     3.5, 3.9,0.6, 0.9, 0.018,10,'把',          ['納品書（指定単票）'],                       '20日',    'メール'],
  ['P022','THHW-2-SGL-RED', 'THHW 2mm² 単芯 赤',               'C012','赤',     3.5, 3.9,0.6, 0.9, 0.018,10,'把',          ['納品書（指定単票）'],                       '月末',    'メール'],
  ['P023','THHW-3.5-SGL-BLK','THHW 3.5mm² 単芯 黒',            'C005','黒',     4.5, 5.0,0.7, 1.0, 0.031,12,'束',          ['試験成績表'],                               '月末',    'FAX'],
  ['P024','THHW-5.5-SGL-BLK','THHW 5.5mm² 単芯 黒',            'C013','黒',     5.5, 6.0,0.8, 1.1, 0.049,14,'束',          ['納品書（指定単票）'],                       '都度請求','紙'],
  ['P025','THHW-8-SGL-BLK', 'THHW 8mm² 単芯 黒',               'C001','黒',     6.5, 7.0,0.9, 1.2, 0.072,16,'ドラム(D400)',['納品書（指定単票）','試験成績表'],           '月末',    'FAX'],
  ['P026','CTL-0.75-4C-GRY','制御ケーブル 0.75mm² 4芯',         'C014','グレー', 7.5, 8.0,0.5, 0.8, 0.027,10,'ドラム(D400)',['試験成績表'],                               '20日',    'FAX'],
  ['P027','CTL-0.75-6C-GRY','制御ケーブル 0.75mm² 6芯',         'C004','グレー', 9.0, 9.5,0.55,0.8, 0.040,10,'ドラム(D400)',['試験成績表'],                               '都度請求','紙'],
  ['P028','CTL-1.25-4C-GRY','制御ケーブル 1.25mm² 4芯',         'C015','グレー', 9.0, 9.5,0.6, 0.85,0.044,12,'ドラム(D400)',['納品書（指定単票）','試験成績表'],           '月末',    'メール'],
  ['P029','CTL-1.25-6C-GRY','制御ケーブル 1.25mm² 6芯',         'C005','グレー',10.5,11.0,0.6, 0.85,0.067,12,'ドラム(D400)',['試験成績表'],                               '月末',    'FAX'],
  ['P030','CTL-1.25-10C-GRY','制御ケーブル 1.25mm² 10芯',       'C002','グレー',13.5,14.0,0.65,0.9, 0.111,12,'ドラム(D500)',['納品書（指定単票）','試験成績表'],           '15日',    'EDI'],
  ['P031','CTL-2-4C-GRY',   '制御ケーブル 2mm² 4芯',            'C009','グレー',11.0,11.5,0.65,0.9, 0.072,14,'ドラム(D400)',['試験成績表'],                               '月末',    'FAX'],
  ['P032','CTL-2-6C-GRY',   '制御ケーブル 2mm² 6芯',            'C004','グレー',12.5,13.0,0.65,0.9, 0.108,14,'ドラム(D500)',['納品書（指定単票）','試験成績表'],           '都度請求','紙'],
  ['P033','VV-1.6-2C-BLK',  'VV 1.6mm² 2芯 黒シース',          'C006','黒',     7.5, 8.0,1.5, 1.8, 0.023,10,'束',          ['納品書（指定単票）'],                       '15日',    'EDI'],
  ['P034','VV-1.6-3C-BLK',  'VV 1.6mm² 3芯 黒シース',          'C007','黒',     8.5, 9.0,1.5, 1.8, 0.034,10,'束',          ['納品書（指定単票）'],                       '20日',    'メール'],
  ['P035','VV-2-2C-BLK',    'VV 2mm² 2芯 黒シース',            'C008','黒',     8.5, 9.0,1.6, 1.9, 0.036,12,'束',          ['納品書（指定単票）'],                       '月末',    'FAX'],
  ['P036','VV-2-3C-BLK',    'VV 2mm² 3芯 黒シース',            'C001','黒',     9.5,10.0,1.6, 1.9, 0.054,12,'ドラム(D400)',['納品書（指定単票）','試験成績表'],           '月末',    'FAX'],
  ['P037','VV-5.5-2C-BLK',  'VV 5.5mm² 2芯 黒シース',          'C010','黒',    14.0,14.5,1.8, 2.2, 0.098,18,'ドラム(D500)',['試験成績表'],                               '月末',    'システム送付'],
  ['P038','VV-5.5-3C-BLK',  'VV 5.5mm² 3芯 黒シース',          'C011','黒',    16.0,16.5,1.8, 2.2, 0.147,18,'ドラム(D500)',['納品書（指定単票）','試験成績表'],           '月末',    'FAX'],
  ['P039','VVF-1.6-2C-BLK', 'VVF 1.6mm² 2芯 黒シース',         'C012','黒',    10.0,10.5,1.5, 1.8, 0.023,10,'束',          ['納品書（指定単票）'],                       '月末',    'メール'],
  ['P040','VVF-1.6-3C-BLK', 'VVF 1.6mm² 3芯 黒シース',         'C013','黒',    10.5,11.0,1.5, 1.8, 0.034,10,'束',          ['納品書（指定単票）'],                       '都度請求','紙'],
  ['P041','VVF-2-2C-BLK',   'VVF 2mm² 2芯 黒シース',           'C014','黒',    11.0,11.5,1.6, 1.9, 0.036,12,'束',          ['試験成績表'],                               '月末',    'FAX'],
  ['P042','HP-3.5-3C-ORG',  'HP 3.5mm² 3芯 オレンジシース',     'C015','オレンジ',11.5,12.5,0.8,1.1, 0.093,15,'ドラム(D500)',['納品書（指定単票）','試験成績表'],         '月末',    'メール'],
  ['P043','HP-5.5-3C-ORG',  'HP 5.5mm² 3芯 オレンジシース',     'C003','オレンジ',14.0,15.0,1.0,1.4, 0.147,18,'ドラム(D500)',['納品書（指定単票）','試験成績表'],         '20日',    'メール'],
  ['P044','HP-8-3C-ORG',    'HP 8mm² 3芯 オレンジシース',       'C009','オレンジ',17.0,18.0,1.0,1.4, 0.216,22,'ドラム(D600)',['納品書（指定単票）','試験成績表'],         '月末',    'FAX'],
  ['P045','EP-3.5-3C-BLK',  'EP 3.5mm² 3芯 黒シース',          'C001','黒',    12.5,13.5,0.9, 1.2, 0.093,15,'ドラム(D500)',['納品書（指定単票）','試験成績表','サンプル（要）'],'月末','FAX'],
  ['P046','EP-5.5-3C-BLK',  'EP 5.5mm² 3芯 黒シース',          'C002','黒',    15.5,16.5,1.1, 1.5, 0.147,18,'ドラム(D500)',['納品書（指定単票）','試験成績表'],           '15日',    'EDI'],
  ['P047','FR-CV-3.5-3C-RED','FR-CV 3.5mm² 3芯 赤シース',       'C004','赤',    12.0,13.0,0.85,1.1, 0.093,15,'ドラム(D500)',['納品書（指定単票）','試験成績表'],           '都度請求','紙'],
  ['P048','FR-CV-5.5-3C-RED','FR-CV 5.5mm² 3芯 赤シース',       'C005','赤',    14.5,15.5,1.0, 1.3, 0.147,18,'ドラム(D500)',['納品書（指定単票）','試験成績表'],           '月末',    'FAX'],
  ['P049','OC-8-SGL-WHT',   'OC 8mm² 単芯 白',                 'C006','白',     5.5, 6.0,0.7, 1.0, 0.072,10,'束',          ['納品書（指定単票）'],                       '15日',    'EDI'],
  ['P050','OC-14-SGL-WHT',  'OC 14mm² 単芯 白',                'C007','白',     6.5, 7.0,0.8, 1.1, 0.126,10,'束',          ['納品書（指定単票）'],                       '20日',    'メール'],
];

const _gProducts = _PR.map(r => {
  const n = parseInt(r[0].slice(1));
  const isSgl = r[1].includes('-SGL-');
  const coreM = r[1].match(/-(\d+)C-/);
  return {
    id:r[0], productCode:r[1], name:r[2],
    designNumber:`TF-${2019+n%7}-${String(n).padStart(4,'0')}`,
    customerCode:r[3], customerName:_CN[r[3]],
    sheathColor:r[4], conductorPitch:`${r[10]}mm`, packaging:r[11],
    requiredDocuments:r[12], sampleLength:n%4,
    billingCycle:r[13], shippingMethod:r[14],
    spec:{outerDiameter:{min:r[5],max:r[6]},wallThickness:{min:r[7],max:r[8]}},
    copperContentPerM:r[9], drawingUrl:'', drawingRevision:`Rev.${1+n%4}`,
    cableType: isSgl ? 'single' : coreM ? `${coreM[1]}core` : 'single',
    workConditions:{
      '押出':`押出温度180〜200°C。外径φ${r[5]}〜${r[6]}mm確認。`,
      '撚線': isSgl ? '単芯のため工程なし。' : `撚りピッチ${r[10]}mm±1mm確認。`,
      '編組':'カバレージ率85%以上確認。',
      '加工':`シース色（${r[4]}）確認。切断確認。`,
    },
    labelSettings: {
      printer: ['1号機','2号機','3号機'][n % 3],
      paperType: ['標準','TSEマーク','PSマーク','ULマーク'][n % 4],
      inspectionRequired: n % 11 === 0,
    },
  };
});

export const products = [..._staticProducts, ..._gProducts];

// isCopperBased=true の材料は: 単価 = baseProcessingCost + copperRatio × 銅地金価格
// 例) M001 @ ¥1,280: 60 + 0.930×1280 = 60+1190 = 1250 ✓
export const materials = [
  { id:'M001', code:'M001', name:'銅導体 1.25mm²',        category:'銅導体',       unit:'kg', isCopperBased:true,  copperRatio:0.930, baseProcessingCost:60, standardPrice:1250 },
  { id:'M002', code:'M002', name:'銅導体 3.5mm²',         category:'銅導体',       unit:'kg', isCopperBased:true,  copperRatio:0.926, baseProcessingCost:65, standardPrice:1250 },
  { id:'M003', code:'M003', name:'銅導体 5.5mm²',         category:'銅導体',       unit:'kg', isCopperBased:true,  copperRatio:0.923, baseProcessingCost:68, standardPrice:1250 },
  { id:'M004', code:'M004', name:'銅導体 8mm²',           category:'銅導体',       unit:'kg', isCopperBased:true,  copperRatio:0.920, baseProcessingCost:72, standardPrice:1250 },
  { id:'M005', code:'M005', name:'PVC絶縁コンパウンド',   category:'コンパウンド', unit:'kg', isCopperBased:false, copperRatio:0,     baseProcessingCost:0,  standardPrice:320  },
  { id:'M006', code:'M006', name:'PVCシースコンパウンド', category:'コンパウンド', unit:'kg', isCopperBased:false, copperRatio:0,     baseProcessingCost:0,  standardPrice:280  },
  { id:'M007', code:'M007', name:'介在物（PP紐）',         category:'介在物',       unit:'kg', isCopperBased:false, copperRatio:0,     baseProcessingCost:0,  standardPrice:180  },
  { id:'M008', code:'M008', name:'編組糸（ナイロン）',     category:'編組材',       unit:'kg', isCopperBased:false, copperRatio:0,     baseProcessingCost:0,  standardPrice:450  },
];

export const quotes = [
  {
    id:'Q001', quoteNumber:'Q2026-001', productCode:'CV-3.5-3C-BLK', productId:'P001',
    productName:'CV 3.5mm² 3芯 黒シース', customerCode:'C001', customerName:'FDC株式会社',
    copperBasePrice:1280,
    bom:[
      { materialId:'M002', materialCode:'M002', materialName:'銅導体 3.5mm²',       requiredQty:0.093, standardPrice:1250 },
      { materialId:'M005', materialCode:'M005', materialName:'PVC絶縁コンパウンド', requiredQty:0.018, standardPrice:320 },
      { materialId:'M006', materialCode:'M006', materialName:'PVCシースコンパウンド',requiredQty:0.022, standardPrice:280 },
    ],
    lossRate:1.03, processingCost:12.5, quotedPrice:138.0, status:'受注確定', createdDate:'2026-04-15',
  },
  {
    id:'Q002', quoteNumber:'Q2026-002', productCode:'CV-5.5-3C-RED', productId:'P002',
    productName:'CV 5.5mm² 3芯 赤シース', customerCode:'C002', customerName:'三菱電機株式会社',
    copperBasePrice:1280,
    bom:[
      { materialId:'M003', materialCode:'M003', materialName:'銅導体 5.5mm²',       requiredQty:0.147, standardPrice:1250 },
      { materialId:'M005', materialCode:'M005', materialName:'PVC絶縁コンパウンド', requiredQty:0.025, standardPrice:320 },
      { materialId:'M006', materialCode:'M006', materialName:'PVCシースコンパウンド',requiredQty:0.030, standardPrice:280 },
    ],
    lossRate:1.03, processingCost:15.8, quotedPrice:225.0, status:'見積提出済', createdDate:'2026-05-01',
  },
  {
    id:'Q003', quoteNumber:'Q2026-003', productCode:'CTL-0.75-10C-GRY', productId:'P005',
    productName:'制御ケーブル 0.75mm² 10芯', customerCode:'C004', customerName:'ヤマハ発動機株式会社',
    copperBasePrice:1280,
    bom:[
      { materialId:'M001', materialCode:'M001', materialName:'銅導体 1.25mm²',       requiredQty:0.067, standardPrice:1250 },
      { materialId:'M005', materialCode:'M005', materialName:'PVC絶縁コンパウンド',  requiredQty:0.045, standardPrice:320 },
      { materialId:'M006', materialCode:'M006', materialName:'PVCシースコンパウンド', requiredQty:0.038, standardPrice:280 },
      { materialId:'M008', materialCode:'M008', materialName:'編組糸（ナイロン）',    requiredQty:0.012, standardPrice:450 },
    ],
    lossRate:1.05, processingCost:25.0, quotedPrice:155.0, status:'相談中', createdDate:'2026-05-10',
  },
  {
    id:'Q004', quoteNumber:'Q2026-004', productCode:'CV-8-4C-BLK', productId:'P004',
    productName:'CV 8mm² 4芯 黒シース', customerCode:'C001', customerName:'FDC株式会社',
    copperBasePrice:1280,
    bom:[
      { materialId:'M004', materialCode:'M004', materialName:'銅導体 8mm²',          requiredQty:0.288, standardPrice:1250 },
      { materialId:'M005', materialCode:'M005', materialName:'PVC絶縁コンパウンド',  requiredQty:0.055, standardPrice:320 },
      { materialId:'M006', materialCode:'M006', materialName:'PVCシースコンパウンド', requiredQty:0.062, standardPrice:280 },
      { materialId:'M007', materialCode:'M007', materialName:'介在物（PP紐）',        requiredQty:0.015, standardPrice:180 },
    ],
    lossRate:1.04, processingCost:22.0, quotedPrice:415.0, status:'失注', createdDate:'2026-03-20',
  },
];

// ─── 静的受注 O001-O004 ───────────────────────────────────────────────────────
const _staticOrders = [
  {
    id:'O001', orderNumber:'SO-2026-0421',
    productCode:'CV-3.5-3C-BLK', productId:'P001', productName:'CV 3.5mm² 3芯 黒シース',
    customerCode:'C001', customerName:'FDC株式会社',
    totalQuantity:5000, unit:'m', finalDeadline:'2026-06-30', arrangementDeadline:'2026-06-01',
    paidMaterialOffset:'非対象', status:'確定', quoteId:'Q001',
    // 受注入力画面追加項目
    orderDate:'2026-04-21', inputPersonCode:'101', inputPerson:'細野', approverCode:'001', approver:'杉田',
    customerOrderNum1:'FDC-2026-0421', customerOrderNum2:'', customerOrderNum3:'',
    customerProductName:'CV-3.5-3C',
    designNumber:'DWG-CV35-001', specNumber:'SPEC-CV35-R3',
    deliveryAddressCode:'DA001', deliveryAddressName:'FDC株式会社 豊橋工場',
    deliveryAddressDetail:'〒441-8001 愛知県豊橋市大山町字御鉾15　TEL: 0532-48-XXXX',
    cableEntries:[
      { cableLength:'500', bundleCount:'4' },
      { cableLength:'500', bundleCount:'6' },
    ],
    packaging:'ドラム(D500)', weightPer1000m:95.2,
    sampleRequired:false, trRequired:true, ulLabel:false,
    cableSupply:false, cableArrivalDate:'', materialSupply:false, drumSupply:false, tagSupply:false,
    copperBase:1280, priceCategory:'A', unitPrice:850, completionStatus:'0',
    remarks:'試験成績表添付要。\nラベル指定あり（別途連絡）。',
    inspectionRequired: false,
    labelStatus: '出力可',
    shippingSchedule:[
      { id:'SS001', scheduledDate:'2026-06-05', quantity:2000, remainingQty:5000, carrier:'チャーター', status:'未出荷' },
      { id:'SS002', scheduledDate:'2026-06-20', quantity:3000, remainingQty:3000, carrier:'路線',       status:'未出荷' },
    ],
  },
  {
    id:'O002', orderNumber:'SO-2026-0438',
    productCode:'THHW-1.25-SGL-GRN', productId:'P003', productName:'THHW 1.25mm² 単芯 緑',
    customerCode:'C003', customerName:'豊田自動織機',
    totalQuantity:2000, unit:'m', finalDeadline:'2026-05-30', arrangementDeadline:'2026-05-20',
    paidMaterialOffset:'対象', status:'分納中', quoteId:null,
    orderDate:'2026-04-28', inputPersonCode:'101', inputPerson:'細野', approverCode:'001', approver:'杉田',
    customerOrderNum1:'TAF-2026-B0832', customerOrderNum2:'', customerOrderNum3:'',
    customerProductName:'THHW1.25-緑',
    designNumber:'DWG-TH125-002', specNumber:'SPEC-TH125-R1',
    deliveryAddressCode:'DA002', deliveryAddressName:'豊田自動織機 刈谷工場',
    deliveryAddressDetail:'〒448-8671 愛知県刈谷市豊田町1-1　TEL: 0566-22-XXXX',
    cableEntries:[
      { cableLength:'200', bundleCount:'5' },
      { cableLength:'200', bundleCount:'5' },
    ],
    packaging:'ドラム(D400)', weightPer1000m:18.5,
    sampleRequired:true, trRequired:true, ulLabel:true,
    cableSupply:false, cableArrivalDate:'', materialSupply:false, drumSupply:false, tagSupply:true,
    copperBase:1280, priceCategory:'A', unitPrice:320, completionStatus:'0',
    remarks:'ULラベル：UL758 AWM対応品。\nサンプル1m提出済み（2026-04-15）。',
    inspectionRequired: true,
    labelStatus: '出力可',
    shippingSchedule:[
      { id:'SS003', scheduledDate:'2026-05-15', quantity:1000, remainingQty:2000, carrier:'路線', status:'出荷済' },
      { id:'SS004', scheduledDate:'2026-05-30', quantity:1000, remainingQty:1000, carrier:'路線', status:'未出荷' },
    ],
  },
  {
    id:'O003', orderNumber:'TMP-2026-0012',
    productCode:'CV-8-4C-BLK', productId:'P004', productName:'CV 8mm² 4芯 黒シース',
    customerCode:'C001', customerName:'FDC株式会社',
    totalQuantity:3000, unit:'m', finalDeadline:'2026-07-15', arrangementDeadline:'2026-05-22',
    paidMaterialOffset:'非対象', status:'照会（仮押さえ）', quoteId:null, isTrial:true,
    orderDate:'2026-05-10', inputPersonCode:'101', inputPerson:'細野', approverCode:'', approver:'',
    customerOrderNum1:'FDC-2026-0512', customerOrderNum2:'', customerOrderNum3:'',
    customerProductName:'',
    designNumber:'DWG-CV84-003', specNumber:'',
    deliveryAddressCode:'DA001', deliveryAddressName:'FDC株式会社 豊橋工場',
    deliveryAddressDetail:'〒441-8001 愛知県豊橋市大山町字御鉾15　TEL: 0532-48-XXXX',
    cableEntries:[
      { cableLength:'300', bundleCount:'10' },
    ],
    packaging:'ドラム(D600)', weightPer1000m:285.0,
    sampleRequired:false, trRequired:false, ulLabel:false,
    cableSupply:true, cableArrivalDate:'2026-05-28', materialSupply:false, drumSupply:false, tagSupply:false,
    copperBase:1280, priceCategory:'K', unitPrice:2400, completionStatus:'0',
    remarks:'仮単価受注。正式単価は受注確定後に連絡。\nケーブル支給材入荷確認後に製造着手。',
    inspectionRequired: false,
    labelStatus: '未出力',
    shippingSchedule:[
      { id:'SS005', scheduledDate:'2026-07-10', quantity:3000, remainingQty:3000, carrier:'チャーター', status:'未出荷' },
    ],
  },
  {
    id:'O004', orderNumber:'SO-2026-0445',
    productCode:'CTL-0.75-10C-GRY', productId:'P005', productName:'制御ケーブル 0.75mm² 10芯',
    customerCode:'C004', customerName:'ヤマハ発動機株式会社',
    totalQuantity:1500, unit:'m', finalDeadline:'2026-06-10', arrangementDeadline:'2026-06-01',
    paidMaterialOffset:'非対象', status:'確定', quoteId:'Q003',
    orderDate:'2026-05-12', inputPersonCode:'101', inputPerson:'細野', approverCode:'001', approver:'杉田',
    customerOrderNum1:'YMH-20260512-001', customerOrderNum2:'YMH-SUB-001', customerOrderNum3:'',
    customerProductName:'10芯制御ケーブル 0.75sq',
    designNumber:'DWG-CTL075-010', specNumber:'SPEC-CTL-R2',
    deliveryAddressCode:'DA003', deliveryAddressName:'ヤマハ発動機 袋井工場',
    deliveryAddressDetail:'〒437-0061 静岡県袋井市豊沢2500　TEL: 0538-42-XXXX',
    cableEntries:[
      { cableLength:'100', bundleCount:'5' },
      { cableLength:'200', bundleCount:'5' },
    ],
    packaging:'ドラム(D400)', weightPer1000m:62.0,
    sampleRequired:false, trRequired:true, ulLabel:false,
    cableSupply:false, cableArrivalDate:'', materialSupply:false, drumSupply:true, tagSupply:true,
    copperBase:1280, priceCategory:'A', unitPrice:680, completionStatus:'0',
    remarks:'ドラム・荷札は客先支給品使用。\nTR添付必須（材料TR含む）。',
    inspectionRequired: true,
    labelStatus: '検査待ち',
    shippingSchedule:[
      { id:'SS006', scheduledDate:'2026-06-10', quantity:1500, remainingQty:1500, carrier:'チャーター', status:'未出荷' },
    ],
  },
];

// ─── 生成受注 O005-O184 ───────────────────────────────────────────────────────
function _dOff(days) {
  const d = new Date('2026-05-21'); d.setDate(d.getDate() + days);
  return d.toISOString().split('T')[0];
}

const _OP = [
  ['CV-3.5-3C-BLK','P001','CV 3.5mm² 3芯 黒シース'],
  ['CV-5.5-3C-RED','P002','CV 5.5mm² 3芯 赤シース'],
  ['THHW-1.25-SGL-GRN','P003','THHW 1.25mm² 単芯 緑'],
  ['CV-8-4C-BLK','P004','CV 8mm² 4芯 黒シース'],
  ['CTL-0.75-10C-GRY','P005','制御ケーブル 0.75mm² 10芯'],
  ['CV-1.25-2C-BLK','P006','CV 1.25mm² 2芯 黒シース'],
  ['CV-2-3C-BLK','P008','CV 2mm² 3芯 黒シース'],
  ['CV-3.5-4C-BLK','P011','CV 3.5mm² 4芯 黒シース'],
  ['CV-5.5-2C-BLK','P012','CV 5.5mm² 2芯 黒シース'],
  ['CV-8-3C-BLK','P015','CV 8mm² 3芯 黒シース'],
  ['CV-14-3C-BLK','P016','CV 14mm² 3芯 黒シース'],
  ['CV-14-4C-BLK','P017','CV 14mm² 4芯 黒シース'],
  ['CTL-0.75-6C-GRY','P027','制御ケーブル 0.75mm² 6芯'],
  ['CTL-1.25-6C-GRY','P029','制御ケーブル 1.25mm² 6芯'],
  ['VV-2-3C-BLK','P036','VV 2mm² 3芯 黒シース'],
  ['VVF-1.6-2C-BLK','P039','VVF 1.6mm² 2芯 黒シース'],
  ['HP-3.5-3C-ORG','P042','HP 3.5mm² 3芯 オレンジシース'],
  ['FR-CV-3.5-3C-RED','P047','FR-CV 3.5mm² 3芯 赤シース'],
  ['THHW-3.5-SGL-BLK','P023','THHW 3.5mm² 単芯 黒'],
  ['CV-22-3C-BLK','P018','CV 22mm² 3芯 黒シース'],
];
const _CK = Object.keys(_CN);
const _QS = [500, 1000, 1500, 2000, 2500, 3000, 5000];

function _mkO(n, status, finalDays, arrangeDays) {
  const i = n - 5;
  const p = _OP[i % _OP.length];
  const ck = _CK[(i * 7 + 3) % _CK.length];
  const qty = _QS[(i * 3) % _QS.length];
  const oid = String(n).padStart(3, '0');
  const yr = status === '完了' ? 2025 : 2026;
  const seqNum = status === '完了' ? 1000 + i : 500 + (i - 100);
  const fd = _dOff(finalDays);
  const ad = _dOff(arrangeDays);
  const isCompleted = status === '完了';
  const hasInspection = !isCompleted && status !== '照会（仮押さえ）' && (i % 7 === 3);
  const lStatus = isCompleted ? '出力済'
    : status === '照会（仮押さえ）' ? '未出力'
    : hasInspection ? '検査待ち'
    : (status === '分納中' || i % 3 === 0) ? '出力可'
    : '未出力';
  return {
    id:`O${oid}`, orderNumber:`SO-${yr}-${String(seqNum).padStart(4,'0')}`,
    productCode:p[0], productId:p[1], productName:p[2],
    customerCode:ck, customerName:_CN[ck],
    totalQuantity:qty, unit:'m',
    finalDeadline:fd, arrangementDeadline:ad,
    paidMaterialOffset:i%3===0?'対象':'非対象',
    status, quoteId:null,
    inspectionRequired: hasInspection,
    labelStatus: lStatus,
    shippingSchedule:[{
      id:`SS-G${oid}`, scheduledDate:fd, quantity:qty,
      remainingQty:status==='完了'?0:qty,
      carrier:i%2===0?'路線':'チャーター',
      status:status==='完了'?'出荷済':'未出荷',
    }],
  };
}

// 完了受注 100件（O005-O104）- 2025年中の納期
const _completedOrders = Array.from({length:100}, (_,i) =>
  _mkO(5+i, '完了', -(500 - Math.round(i * 3.5)), -(514 - Math.round(i * 3.5)))
);

// 仕掛かり受注 80件（O105-O184）- 2026年先の納期
const _activeStatuses = [
  ...Array(5).fill('照会（仮押さえ）'),
  ...Array(20).fill('分納中'),
  ...Array(55).fill('確定'),
];
const _arrangeOffs = [2, 4, 14, 25, 40];
const _activeOrders = _activeStatuses.map((st, i) => {
  let finalDays, arrangeDays;
  if (st === '照会（仮押さえ）') {
    arrangeDays = _arrangeOffs[i];
    finalDays = arrangeDays + 35;
  } else {
    finalDays = 40 + i * 2;
    arrangeDays = finalDays - 14;
  }
  return _mkO(105+i, st, finalDays, arrangeDays);
});

export const orders = [..._staticOrders, ..._completedOrders, ..._activeOrders];

export const manufacturingOrders = [
  {
    id:'MO001', mfgOrderNumber:'MO-2026-0421-01',
    orderId:'O001', orderNumber:'SO-2026-0421',
    productCode:'CV-3.5-3C-BLK', productName:'CV 3.5mm² 3芯 黒シース',
    machine:'EX-07', operatorId:1042, operatorName:'山田 太郎',
    targetQuantity:2000, actualOutput:1980, wasteQty:45, status:'完了',
    processSteps:[
      { step:'撚線', order:1, completed:true,  completedDate:'2026-05-18' },
      { step:'編組', order:2, completed:true,  completedDate:'2026-05-19' },
      { step:'押出', order:3, completed:true,  completedDate:'2026-05-20' },
      { step:'加工', order:4, completed:true,  completedDate:'2026-05-21' },
    ],
    materialLot:'LOT-CU-2026-0518',
    measurements:{
      '撚線':[
        { item:'撚線外径',   specMin:11.0, specMax:11.8, actual:'11.4', unit:'mm'   },
        { item:'撚りピッチ', specMin:14.0, specMax:18.0, actual:'16.0', unit:'mm'   },
        { item:'導体抵抗',   specMin:0.0,  specMax:5.0,  actual:'4.5',  unit:'Ω/km' },
      ],
      '編組':[
        { item:'編組外径',   specMin:11.2, specMax:12.0, actual:'11.6', unit:'mm' },
        { item:'編組密度',   specMin:85,   specMax:100,  actual:'92',   unit:'%'  },
      ],
      '押出':[
        { item:'絶縁外径',   specMin:11.5, specMax:12.5, actual:'12.0', unit:'mm' },
        { item:'絶縁肉厚',   specMin:0.8,  specMax:1.2,  actual:'1.0',  unit:'mm' },
        { item:'偏肉',       specMin:0.0,  specMax:0.2,  actual:'0.15', unit:'mm' },
      ],
      '加工':[
        { item:'完成外径',   specMin:11.5, specMax:12.5, actual:'12.0', unit:'mm' },
        { item:'仕上肉厚',   specMin:0.8,  specMax:1.2,  actual:'1.0',  unit:'mm' },
        { item:'ピッチ',     specMin:14.0, specMax:18.0, actual:'16.0', unit:'mm' },
      ],
    },
    forceCompletes:{},
    nextProcessLength:2068, startDate:'2026-05-18', endDate:'2026-05-21',
  },
  {
    id:'MO002', mfgOrderNumber:'MO-2026-0438-01',
    orderId:'O002', orderNumber:'SO-2026-0438',
    productCode:'THHW-1.25-SGL-GRN', productName:'THHW 1.25mm² 単芯 緑',
    machine:'EX-12', operatorId:1028, operatorName:'佐藤 次郎',
    targetQuantity:1000, actualOutput:0, wasteQty:0, status:'進行中',
    processSteps:[
      { step:'撚線', order:1, completed:true,  completedDate:'2026-05-20' },
      { step:'編組', order:2, completed:false, completedDate:null },
      { step:'押出', order:3, completed:false, completedDate:null },
      { step:'加工', order:4, completed:false, completedDate:null },
    ],
    materialLot:'LOT-CU-2026-0520',
    measurements:{
      '撚線':[
        { item:'撚線外径',   specMin:2.5,  specMax:3.0,  actual:'2.8',  unit:'mm'   },
        { item:'撚りピッチ', specMin:8.0,  specMax:12.0, actual:'10.0', unit:'mm'   },
        { item:'導体抵抗',   specMin:0.0,  specMax:15.0, actual:'14.2', unit:'Ω/km' },
      ],
      '編組':[
        { item:'編組外径',   specMin:3.0,  specMax:3.6,  actual:'',     unit:'mm' },
        { item:'編組密度',   specMin:85,   specMax:100,  actual:'',     unit:'%'  },
      ],
      '押出':[
        { item:'絶縁外径',   specMin:2.8,  specMax:3.2,  actual:'',     unit:'mm' },
        { item:'絶縁肉厚',   specMin:0.5,  specMax:0.8,  actual:'',     unit:'mm' },
        { item:'偏肉',       specMin:0.0,  specMax:0.15, actual:'',     unit:'mm' },
      ],
      '加工':[
        { item:'完成外径',   specMin:2.8,  specMax:3.2,  actual:'',     unit:'mm' },
        { item:'仕上肉厚',   specMin:0.5,  specMax:0.8,  actual:'',     unit:'mm' },
        { item:'ピッチ',     specMin:8.0,  specMax:12.0, actual:'',     unit:'mm' },
      ],
    },
    forceCompletes:{},
    nextProcessLength:1030, startDate:'2026-05-20', endDate:null,
  },
  {
    id:'MO003', mfgOrderNumber:'MO-2026-0445-01',
    orderId:'O004', orderNumber:'SO-2026-0445',
    productCode:'CTL-0.75-10C-GRY', productName:'制御ケーブル 0.75mm² 10芯',
    machine:'EX-03', operatorId:1055, operatorName:'田中 花子',
    targetQuantity:1500, actualOutput:0, wasteQty:0, status:'未着手',
    processSteps:[
      { step:'撚線', order:1, completed:false, completedDate:null },
      { step:'編組', order:2, completed:false, completedDate:null },
      { step:'押出', order:3, completed:false, completedDate:null },
      { step:'加工', order:4, completed:false, completedDate:null },
    ],
    materialLot:'',
    measurements:{
      '撚線':[
        { item:'撚線外径',   specMin:11.5, specMax:12.2, actual:'', unit:'mm'   },
        { item:'撚りピッチ', specMin:10.0, specMax:14.0, actual:'', unit:'mm'   },
        { item:'導体抵抗',   specMin:0.0,  specMax:0.75, actual:'', unit:'Ω/km' },
      ],
      '編組':[
        { item:'編組外径',   specMin:12.0, specMax:13.0, actual:'', unit:'mm' },
        { item:'編組密度',   specMin:85,   specMax:100,  actual:'', unit:'%'  },
      ],
      '押出':[
        { item:'絶縁外径',   specMin:12.0, specMax:13.0, actual:'', unit:'mm' },
        { item:'絶縁肉厚',   specMin:0.6,  specMax:0.9,  actual:'', unit:'mm' },
        { item:'偏肉',       specMin:0.0,  specMax:0.2,  actual:'', unit:'mm' },
      ],
      '加工':[
        { item:'完成外径',   specMin:12.0, specMax:13.0, actual:'', unit:'mm' },
        { item:'仕上肉厚',   specMin:0.6,  specMax:0.9,  actual:'', unit:'mm' },
        { item:'ピッチ',     specMin:10.0, specMax:14.0, actual:'', unit:'mm' },
      ],
    },
    forceCompletes:{},
    nextProcessLength:1575, startDate:'2026-05-25', endDate:null,
  },
];

export const inventoryData = [
  { id:'INV001', period:'2026-05', itemCode:'M001', itemName:'銅導体 1.25mm²',        unit:'kg', previousStock:450,  receivedQty:600, usedQty:520, theoreticalStock:530, actualStock:528,  latestPurchasePrice:1280, previousActual:450 },
  { id:'INV002', period:'2026-05', itemCode:'M002', itemName:'銅導体 3.5mm²',         unit:'kg', previousStock:320,  receivedQty:400, usedQty:380, theoreticalStock:340, actualStock:338,  latestPurchasePrice:1280, previousActual:320 },
  { id:'INV003', period:'2026-05', itemCode:'M005', itemName:'PVC絶縁コンパウンド',   unit:'kg', previousStock:800,  receivedQty:500, usedQty:620, theoreticalStock:680, actualStock:650,  latestPurchasePrice:320,  previousActual:800 },
  { id:'INV004', period:'2026-05', itemCode:'M006', itemName:'PVCシースコンパウンド', unit:'kg', previousStock:600,  receivedQty:300, usedQty:280, theoreticalStock:620, actualStock:null, latestPurchasePrice:280,  previousActual:600 },
  { id:'INV005', period:'2026-05', itemCode:'M007', itemName:'介在物（PP紐）',         unit:'kg', previousStock:150,  receivedQty:100, usedQty:120, theoreticalStock:130, actualStock:128,  latestPurchasePrice:180,  previousActual:150 },
];

export const currentCopperPrice = 1280;

// 工程ごとの機械マッピング
export const PROCESS_MACHINE_MAP = {
  '押出': [
    'EX-07','EX-12','EX-03','EX-02','EX-10','EX-13','EX-14',
    'EX-22','EX-23','EX-9','EX-1','EX-15','EX-20','EX-21',
    'EX-18','EX-19','EX-11','EX-08','EB-01','アニール','ER-1,4','ER-5','シェービング',
  ],
  '撚線': [
    'SL-1','ST-6','SL-5','SL-20','SL-3','SL-18','SL-6','SL-8','SL-10',
    'SL-24','SL-25','SL-14','SL-16','SL-13','SS-01','SL-17','SL-26','ST-02','ST-04',
  ],
  '編組': [
    'BA-27','BA-22','BA-12','BB-06','BB-01','BS-01','BA-04','BA-01',
    'BA-26','BA-21','BA-13','BB-07','BB-02','BS-02','BA-05','BA-02',
    'BA-25','BA-20','BA-14','BB-08','BB-03','BA-11','BA-06','BA-03',
    'BA-24','BA-19','BA-15','BB-09','BB-04','BA-10','BA-09','BA-08',
    'BA-23','BA-18','BA-16','BB-10','BB-05','BA-07',
    'BA-17','BB-11','BB-12','BB-13','BG-01','BG-02',
  ],
  '加工': [
    '切断AC-01','切断AC-02','切断AC-03','切断AC-04',
    '手切','仕上','検査','その他',
  ],
};

// machines は PROCESS_MACHINE_MAP から自動生成
export const machines = Object.entries(PROCESS_MACHINE_MAP).flatMap(
  ([process, names]) => names.map(name => ({ id: name, name, process }))
);

// ─── 製品別 過去受注実績（機械自動配置の根拠データ）──────────────────────────
// 構造: { [productCode]: [{ id, orderNumber, orderDate, completedDate, quantity, customerName, machines: {process: machineId} }] }

// 機械割り当てパターン（製品インデックスでサイクル）
const _SL = ['SL-1','SL-5','SL-3','ST-6','SL-6','SL-8','SL-10','SL-20'];
const _BA = ['BA-01','BA-04','BA-22','BB-01','BA-12','BA-27','BA-26','BA-05'];
const _EX = ['EX-07','EX-12','EX-03','EX-02','EX-10','EX-13','EX-14','EX-22'];
const _AC = ['切断AC-01','切断AC-02','切断AC-03','切断AC-04'];

function _phEntry(pid, n, oNum, oDate, cDate, qty, cust) {
  return { id:`POH-${pid}-${n}`, orderNumber:oNum, orderDate:oDate, completedDate:cDate, quantity:qty, customerName:cust };
}

// 既存製品（P001-P005）は確定的な機械を使用
const _fixedMachines = {
  'CV-3.5-3C-BLK':    { '撚線':'SL-1',  '編組':'BA-01', '押出':'EX-07', '加工':'切断AC-01' },
  'CV-5.5-3C-RED':    { '撚線':'SL-5',  '編組':'BA-04', '押出':'EX-12', '加工':'切断AC-02' },
  'THHW-1.25-SGL-GRN':{ '撚線':'SL-5',  '編組':'BA-04', '押出':'EX-12', '加工':'切断AC-02' },
  'CV-8-4C-BLK':      { '撚線':'SL-1',  '編組':'BA-01', '押出':'EX-03', '加工':'切断AC-01' },
  'CTL-0.75-10C-GRY': { '撚線':'SL-1',  '編組':'BA-01', '押出':'EX-03', '加工':'切断AC-01' },
};

export const initialProductOrderHistory = (() => {
  const allCodes = [
    'CV-3.5-3C-BLK','CV-5.5-3C-RED','THHW-1.25-SGL-GRN','CV-8-4C-BLK','CTL-0.75-10C-GRY',
    ..._PR.map(r => r[1]),
  ];
  const history = {};
  allCodes.forEach((code, idx) => {
    const machines = _fixedMachines[code] || {
      '撚線': _SL[idx % _SL.length],
      '編組': _BA[idx % _BA.length],
      '押出': _EX[idx % _EX.length],
      '加工': _AC[idx % _AC.length],
    };
    const cust = _CN[_CK[(idx * 5) % _CK.length]];
    const y1 = 2025, m1 = String(1 + idx % 12).padStart(2,'0');
    const y2 = 2024, m2 = String(1 + (idx*3) % 12).padStart(2,'0');
    history[code] = [
      {
        ..._phEntry(idx, 1, `SO-${y1}-${String(800+idx).padStart(4,'0')}`,
          `${y1}-${m1}-10`, `${y1}-${m1}-25`,
          _QS[idx % _QS.length], cust),
        machines,
      },
      {
        ..._phEntry(idx, 2, `SO-${y2}-${String(500+idx).padStart(4,'0')}`,
          `${y2}-${m2}-05`, `${y2}-${m2}-20`,
          _QS[(idx+2) % _QS.length], _CN[_CK[(idx*3+1) % _CK.length]]),
        machines,
      },
    ];
  });
  return history;
})();

// ═══════════════════════════════════════════════════════════════════════════════
// 原材料調達・在庫管理 関連データ
// ═══════════════════════════════════════════════════════════════════════════════

// ─── 仕入先マスタ ─────────────────────────────────────────────────────────────
// copperPriceTiming: 銅系材料の価格決定タイミング ('見積時'|'受注時'|'出荷時'|null)
// null = 銅ベースでない取引先（固定価格）
export const suppliers = [
  { id:'SUP-001', name:'住友電工商事株式会社',         materialIds:['M001','M002','M003','M004'], contactName:'安藤 部長',  tel:'03-1234-5678', email:'ando@sumitomo-trading.jp',   paymentTerms:'月末締翌月末払', leadTimeDays:7,  copperPriceTiming:'見積時' },
  { id:'SUP-002', name:'古河マテリアル株式会社',       materialIds:['M001','M002','M003','M004'], contactName:'橋本 係長',  tel:'03-2345-6789', email:'hashimoto@furukawa-mat.jp',  paymentTerms:'月末締翌月末払', leadTimeDays:5,  copperPriceTiming:'受注時' },
  { id:'SUP-003', name:'信越化学工業株式会社',         materialIds:['M005','M006'],               contactName:'吉田 担当',  tel:'03-3456-7890', email:'yoshida@shinetsu-chem.jp',   paymentTerms:'月末締翌月末払', leadTimeDays:10, copperPriceTiming:null },
  { id:'SUP-004', name:'東洋化成工業株式会社',         materialIds:['M007'],                     contactName:'坂本 部長',  tel:'03-4567-8901', email:'sakamoto@toyo-kasei.jp',     paymentTerms:'都度請求',       leadTimeDays:14, copperPriceTiming:null },
  { id:'SUP-005', name:'ユニチカトレーディング株式会社', materialIds:['M008'],                   contactName:'松田 係長',  tel:'03-5678-9012', email:'matsuda@unitika-trading.jp', paymentTerms:'都度請求',       leadTimeDays:7,  copperPriceTiming:null },
];

// ─── 製品別BOM (工程×材料) ─────────────────────────────────────────────────────
// qty: 100m当たり使用量(kg)、lossRate: ロス係数（1.00 = 0%ロス）
// 銅導体は isCopperBased=true 材料なので copperPriceTiming に応じて見積時/受注時/出荷時の銅価格で原価計算
export const initialProductBOMs = {
  // CV 3.5mm² 3芯 黒シース
  'P001': [
    { id:'B001-01', productId:'P001', process:'撚線', materialId:'M002', qty:9.52,  lossRate:1.02 },
    { id:'B001-02', productId:'P001', process:'撚線', materialId:'M007', qty:0.18,  lossRate:1.05 },
    { id:'B001-03', productId:'P001', process:'押出', materialId:'M005', qty:0.92,  lossRate:1.03 },
    { id:'B001-04', productId:'P001', process:'押出', materialId:'M006', qty:1.25,  lossRate:1.03 },
  ],
  // CV 5.5mm² 3芯 赤シース
  'P002': [
    { id:'B002-01', productId:'P002', process:'撚線', materialId:'M003', qty:15.09, lossRate:1.02 },
    { id:'B002-02', productId:'P002', process:'撚線', materialId:'M007', qty:0.22,  lossRate:1.05 },
    { id:'B002-03', productId:'P002', process:'押出', materialId:'M005', qty:1.25,  lossRate:1.03 },
    { id:'B002-04', productId:'P002', process:'押出', materialId:'M006', qty:1.68,  lossRate:1.03 },
  ],
  // THHW 1.25mm² 単線 緑
  'P003': [
    { id:'B003-01', productId:'P003', process:'撚線', materialId:'M001', qty:1.12,  lossRate:1.02 },
    { id:'B003-02', productId:'P003', process:'押出', materialId:'M005', qty:0.65,  lossRate:1.03 },
  ],
  // CV 8mm² 4芯 黒シース
  'P004': [
    { id:'B004-01', productId:'P004', process:'撚線', materialId:'M004', qty:26.0,  lossRate:1.02 },
    { id:'B004-02', productId:'P004', process:'撚線', materialId:'M007', qty:0.30,  lossRate:1.05 },
    { id:'B004-03', productId:'P004', process:'押出', materialId:'M005', qty:2.10,  lossRate:1.03 },
    { id:'B004-04', productId:'P004', process:'押出', materialId:'M006', qty:2.65,  lossRate:1.03 },
  ],
  // CTL 0.75mm² 10芯 グレー（M001で近似）
  'P005': [
    { id:'B005-01', productId:'P005', process:'撚線', materialId:'M001', qty:6.85,  lossRate:1.02 },
    { id:'B005-02', productId:'P005', process:'撚線', materialId:'M007', qty:0.32,  lossRate:1.05 },
    { id:'B005-03', productId:'P005', process:'押出', materialId:'M005', qty:1.85,  lossRate:1.03 },
    { id:'B005-04', productId:'P005', process:'押出', materialId:'M006', qty:1.20,  lossRate:1.03 },
    { id:'B005-05', productId:'P005', process:'編組', materialId:'M008', qty:0.25,  lossRate:1.05 },
  ],
};

// ─── 発注点・発注ロット設定 ─────────────────────────────────────────────────────
export const materialReorderConfig = {
  M001: { reorderPoint:200, orderLot:500, defaultSupplierId:'SUP-001', safetyStock:100 },
  M002: { reorderPoint:300, orderLot:600, defaultSupplierId:'SUP-001', safetyStock:150 },
  M003: { reorderPoint:200, orderLot:400, defaultSupplierId:'SUP-001', safetyStock:100 },
  M004: { reorderPoint:120, orderLot:250, defaultSupplierId:'SUP-001', safetyStock:60  },
  M005: { reorderPoint:250, orderLot:500, defaultSupplierId:'SUP-003', safetyStock:120 },
  M006: { reorderPoint:180, orderLot:350, defaultSupplierId:'SUP-003', safetyStock:90  },
  M007: { reorderPoint:80,  orderLot:200, defaultSupplierId:'SUP-004', safetyStock:40  },
  M008: { reorderPoint:40,  orderLot:100, defaultSupplierId:'SUP-005', safetyStock:20  },
};

// ─── 現在庫マスタ (materialId → 現在庫量 kg) ─────────────────────────────────
// inventoryData.actualStock をベースに全材料を網羅
export const initialCurrentStock = {
  M001: 528,  // 銅導体 1.25mm²
  M002: 338,  // 銅導体 3.5mm²
  M003: 410,  // 銅導体 5.5mm²
  M004: 185,  // 銅導体 8mm²
  M005: 650,  // PVC絶縁コンパウンド
  M006: 580,  // PVCシースコンパウンド (棚卸未了だがここでは推定値)
  M007: 128,  // 介在物（PP紐）
  M008: 87,   // 編組糸（ナイロン）
};

// ─── 発注書データ ─────────────────────────────────────────────────────────────
export const initialPurchaseOrders = [
  {
    id:'PO-001', poNumber:'PO-2026-0501', supplierId:'SUP-001', supplierName:'住友電工商事株式会社',
    materialId:'M002', materialName:'銅導体 3.5mm²', unit:'kg',
    orderedQty:600, unitPrice:1280, totalAmount:768000,
    orderedDate:'2026-05-10', requestedDeliveryDate:'2026-05-17',
    confirmedDeliveryDate:'2026-05-17', status:'入荷待ち',
    relatedAllocationIds:['ALLOC-001','ALLOC-002'], notes:'急ぎ対応依頼済',
  },
  {
    id:'PO-002', poNumber:'PO-2026-0502', supplierId:'SUP-003', supplierName:'信越化学工業株式会社',
    materialId:'M005', materialName:'PVC絶縁コンパウンド', unit:'kg',
    orderedQty:500, unitPrice:320, totalAmount:160000,
    orderedDate:'2026-05-12', requestedDeliveryDate:'2026-05-22',
    confirmedDeliveryDate:'2026-05-22', status:'入荷待ち',
    relatedAllocationIds:['ALLOC-003'], notes:'',
  },
  {
    id:'PO-003', poNumber:'PO-2026-0503', supplierId:'SUP-001', supplierName:'住友電工商事株式会社',
    materialId:'M001', materialName:'銅導体 1.25mm²', unit:'kg',
    orderedQty:500, unitPrice:1280, totalAmount:640000,
    orderedDate:'2026-05-08', requestedDeliveryDate:'2026-05-15',
    confirmedDeliveryDate:'2026-05-14', status:'完納',
    relatedAllocationIds:[], notes:'',
  },
  {
    id:'PO-004', poNumber:'PO-2026-0504', supplierId:'SUP-003', supplierName:'信越化学工業株式会社',
    materialId:'M006', materialName:'PVCシースコンパウンド', unit:'kg',
    orderedQty:350, unitPrice:280, totalAmount:98000,
    orderedDate:'2026-05-18', requestedDeliveryDate:'2026-05-28',
    confirmedDeliveryDate:null, status:'納期確認待ち',
    relatedAllocationIds:['ALLOC-004'], notes:'在庫が発注点を下回ったため緊急発注',
  },
  {
    id:'PO-005', poNumber:'PO-2026-0505', supplierId:'SUP-004', supplierName:'東洋化成工業株式会社',
    materialId:'M007', materialName:'介在物（PP紐）', unit:'kg',
    orderedQty:200, unitPrice:180, totalAmount:36000,
    orderedDate:'2026-05-15', requestedDeliveryDate:'2026-05-29',
    confirmedDeliveryDate:'2026-06-02', status:'入荷待ち',
    relatedAllocationIds:[], notes:'リードタイム14日',
  },
];

// ─── 引当データ ───────────────────────────────────────────────────────────────
export const initialMaterialAllocations = [
  {
    id:'ALLOC-001', orderId:'O001', orderNumber:'SO-2026-0421',
    materialId:'M002', materialName:'銅導体 3.5mm²', unit:'kg',
    requiredQty:480, allocatedQty:338, shortQty:142,
    status:'一部引当', allocatedDate:'2026-05-18', mfgOrderId:'MO001',
    productCode:'CV-3.5-3C-BLK',
  },
  {
    id:'ALLOC-002', orderId:'O001', orderNumber:'SO-2026-0421',
    materialId:'M005', materialName:'PVC絶縁コンパウンド', unit:'kg',
    requiredQty:96, allocatedQty:96, shortQty:0,
    status:'引当済', allocatedDate:'2026-05-18', mfgOrderId:'MO001',
    productCode:'CV-3.5-3C-BLK',
  },
  {
    id:'ALLOC-003', orderId:'O002', orderNumber:'SO-2026-0425',
    materialId:'M005', materialName:'PVC絶縁コンパウンド', unit:'kg',
    requiredQty:120, allocatedQty:120, shortQty:0,
    status:'引当済', allocatedDate:'2026-05-19', mfgOrderId:'MO002',
    productCode:'THHW-1.25-SGL-GRN',
  },
  {
    id:'ALLOC-004', orderId:'O003', orderNumber:'SO-2026-0432',
    materialId:'M006', materialName:'PVCシースコンパウンド', unit:'kg',
    requiredQty:280, allocatedQty:280, shortQty:0,
    status:'引当済', allocatedDate:'2026-05-20', mfgOrderId:null,
    productCode:'CV-5.5-3C-RED',
  },
  {
    id:'ALLOC-005', orderId:'O004', orderNumber:'SO-2026-0445',
    materialId:'M001', materialName:'銅導体 1.25mm²', unit:'kg',
    requiredQty:120, allocatedQty:120, shortQty:0,
    status:'引当済', allocatedDate:'2026-05-19', mfgOrderId:'MO003',
    productCode:'CTL-0.75-10C-GRY',
  },
];

// ─── 入荷管理データ ───────────────────────────────────────────────────────────
export const initialMaterialReceiving = [
  {
    id:'RCV-001', purchaseOrderId:'PO-003', poNumber:'PO-2026-0503',
    materialId:'M001', materialName:'銅導体 1.25mm²', unit:'kg',
    orderedQty:500, receivedQty:500, scheduledDate:'2026-05-14',
    actualReceivedDate:'2026-05-14', lotNumber:'LOT-CU125-2026-0514',
    inspectionStatus:'合格', inspectionNote:'外観・寸法確認済。導体抵抗値OK。',
    status:'検品完了', inspectedBy:'山田 太郎', inspectedDate:'2026-05-14',
  },
  {
    id:'RCV-002', purchaseOrderId:'PO-001', poNumber:'PO-2026-0501',
    materialId:'M002', materialName:'銅導体 3.5mm²', unit:'kg',
    orderedQty:600, receivedQty:0, scheduledDate:'2026-05-17',
    actualReceivedDate:null, lotNumber:'',
    inspectionStatus:'未検品', inspectionNote:'',
    status:'入荷待ち', inspectedBy:null, inspectedDate:null,
  },
  {
    id:'RCV-003', purchaseOrderId:'PO-002', poNumber:'PO-2026-0502',
    materialId:'M005', materialName:'PVC絶縁コンパウンド', unit:'kg',
    orderedQty:500, receivedQty:0, scheduledDate:'2026-05-22',
    actualReceivedDate:null, lotNumber:'',
    inspectionStatus:'未検品', inspectionNote:'',
    status:'入荷待ち', inspectedBy:null, inspectedDate:null,
  },
  {
    id:'RCV-004', purchaseOrderId:'PO-004', poNumber:'PO-2026-0504',
    materialId:'M006', materialName:'PVCシースコンパウンド', unit:'kg',
    orderedQty:350, receivedQty:0, scheduledDate:null,
    actualReceivedDate:null, lotNumber:'',
    inspectionStatus:'未検品', inspectionNote:'納期未確定',
    status:'入荷待ち', inspectedBy:null, inspectedDate:null,
  },
  {
    id:'RCV-005', purchaseOrderId:'PO-005', poNumber:'PO-2026-0505',
    materialId:'M007', materialName:'介在物（PP紐）', unit:'kg',
    orderedQty:200, receivedQty:0, scheduledDate:'2026-06-02',
    actualReceivedDate:null, lotNumber:'',
    inspectionStatus:'未検品', inspectionNote:'',
    status:'入荷待ち', inspectedBy:null, inspectedDate:null,
  },
];

// ─── 材料払い出し記録 ──────────────────────────────────────────────────────────
export const initialMaterialIssuances = [
  {
    id:'ISS-001', mfgOrderId:'MO001', mfgOrderNumber:'MO-2026-0421-01',
    orderId:'O001', orderNumber:'SO-2026-0421',
    machineId:'EX-07', machineName:'EX-07',
    materialId:'M002', materialName:'銅導体 3.5mm²', unit:'kg',
    issuedQty:186, issuedDate:'2026-05-18', issuedBy:'山田 太郎',
    lotNumber:'LOT-CU35-2026-0517', returnedQty:6, status:'一部返却',
  },
  {
    id:'ISS-002', mfgOrderId:'MO001', mfgOrderNumber:'MO-2026-0421-01',
    orderId:'O001', orderNumber:'SO-2026-0421',
    machineId:'EX-07', machineName:'EX-07',
    materialId:'M005', materialName:'PVC絶縁コンパウンド', unit:'kg',
    issuedQty:36, issuedDate:'2026-05-18', issuedBy:'山田 太郎',
    lotNumber:'LOT-PVC5-2026-0510', returnedQty:0, status:'払出済',
  },
  {
    id:'ISS-003', mfgOrderId:'MO001', mfgOrderNumber:'MO-2026-0421-01',
    orderId:'O001', orderNumber:'SO-2026-0421',
    machineId:'EX-07', machineName:'EX-07',
    materialId:'M006', materialName:'PVCシースコンパウンド', unit:'kg',
    issuedQty:44, issuedDate:'2026-05-20', issuedBy:'鈴木 次郎',
    lotNumber:'LOT-PVC6-2026-0510', returnedQty:0, status:'払出済',
  },
  {
    id:'ISS-004', mfgOrderId:'MO002', mfgOrderNumber:'MO-2026-0425-01',
    orderId:'O002', orderNumber:'SO-2026-0425',
    machineId:'EX-12', machineName:'EX-12',
    materialId:'M001', materialName:'銅導体 1.25mm²', unit:'kg',
    issuedQty:28, issuedDate:'2026-05-20', issuedBy:'佐藤 三郎',
    lotNumber:'LOT-CU125-2026-0514', returnedQty:0, status:'払出済',
  },
];

// ─── 返却管理データ ───────────────────────────────────────────────────────────
export const initialMaterialReturns = [
  {
    id:'RTN-001', issuanceId:'ISS-001', mfgOrderId:'MO001', mfgOrderNumber:'MO-2026-0421-01',
    materialId:'M002', materialName:'銅導体 3.5mm²', unit:'kg',
    issuedQty:186, usedQty:180, expectedReturnQty:6, returnedQty:6,
    status:'返却済', returnDate:'2026-05-21', confirmedBy:'倉庫 管理者',
    notes:'スクラップ相殺分除く',
  },
  {
    id:'RTN-002', issuanceId:'ISS-002', mfgOrderId:'MO001', mfgOrderNumber:'MO-2026-0421-01',
    materialId:'M005', materialName:'PVC絶縁コンパウンド', unit:'kg',
    issuedQty:36, usedQty:36, expectedReturnQty:0, returnedQty:null,
    status:'返却不要', returnDate:null, confirmedBy:null,
    notes:'全量使用',
  },
  {
    id:'RTN-003', issuanceId:'ISS-003', mfgOrderId:'MO001', mfgOrderNumber:'MO-2026-0421-01',
    materialId:'M006', materialName:'PVCシースコンパウンド', unit:'kg',
    issuedQty:44, usedQty:null, expectedReturnQty:null, returnedQty:null,
    status:'要返却', returnDate:null, confirmedBy:null,
    notes:'工程完了後に使用量確定・返却予定',
  },
];

// ─── 検品・庫入れデータ ────────────────────────────────────────────────────────
// status: '未検品' | '検品中' | '合格' | '否認' | '特採'
export const initialLabelIssuances = [
  {
    id:'LBL-001', orderId:'O001', orderNumber:'SO-2026-0421',
    productName:'CV 3.5mm² 3芯 黒シース', customerName:'FDC株式会社',
    color:'黒', totalQuantity:2000, packaging:'ドラム(D500)',
    printer:'1号機', paperType:'PSマーク', copies:2,
    issuedAt:'2026-05-19T14:30:00', issuedBy:'細野',
  },
  {
    id:'LBL-002', orderId:'O002', orderNumber:'SO-2026-0438',
    productName:'THHW 1.25mm² 単芯 緑', customerName:'豊田自動織機',
    color:'緑', totalQuantity:1000, packaging:'ドラム(D400)',
    printer:'1号機', paperType:'標準', copies:1,
    issuedAt:'2026-05-20T09:15:00', issuedBy:'山田',
  },
];

export const initialTechRequests = [
  { id:'TR-001', createdAt:'2026-05-01', requester:'細野', category:'設計書作成', title:'CV-5.5-3C（黒）新規設計書作成依頼', details:'FDC向け新規品。客先仕様書に基づき設計書を作成してほしい。', desiredDate:'2026-05-25', priority:'高', customerCode:'C001', customerName:'FDC株式会社', productName:'CV 5.5mm² 3芯 黒シース', specNumber:'FDC-SPEC-2026-018', assignee:'技術 中村', status:'対応中', remarks:'' },
  { id:'TR-002', createdAt:'2026-05-08', requester:'山田', category:'規格・認証調査', title:'UL規格対応ケーブル 認証取得調査', details:'米国向け輸出対応のためUL認証ルートを確認したい。', desiredDate:'2026-06-10', priority:'通常', customerCode:'C003', customerName:'豊田自動織機', productName:'UL対応品', specNumber:'', assignee:'技術 佐藤', status:'未着手', remarks:'' },
  { id:'TR-003', createdAt:'2026-04-20', requester:'営業 小林', category:'試作・サンプル対応', title:'THHW 1.25sq 緑 サンプル品対応', details:'客先評価用サンプルを10m×2本準備してほしい。', desiredDate:'2026-05-10', priority:'緊急', customerCode:'C003', customerName:'豊田自動織機', productName:'THHW 1.25mm² 単芯 緑', specNumber:'TOJ-2026-0042', assignee:'技術 中村', status:'完了', remarks:'2026-05-09 完了。試験成績表添付済み。' },
  { id:'TR-004', createdAt:'2026-05-12', requester:'細野', category:'客先図面対応', title:'三菱電機 客先仕様変更 図面改訂対応', details:'外径公差が変更になったため図面をRev.upしてほしい。', desiredDate:'2026-05-18', priority:'高', customerCode:'C002', customerName:'三菱電機株式会社', productName:'CV 2.0mm² 2芯 白シース', specNumber:'MEL-DRW-4452-Rev3', assignee:'', status:'未着手', remarks:'' },
];

export const _staticInspections = [
  { id:'INS-S01', date:'2026-05-22', designDocNo:'TD-2201', customer:'FDC株式会社',
    productName:'CV 3.5mm² 3芯 黒シース', color:'黒', orderNo:'SO-2026-0421', mfgNo:'MFG-001',
    packaging:'ドラム', length:5000, inspectionQty:1, passed:0, failed:0, specialAccept:0,
    status:'予定', tNo:'1', abnormalReport:false, remarks:'' },
  { id:'INS-S02', date:'2026-05-27', designDocNo:'TD-0931', customer:'三菱電機株式会社',
    productName:'THHW 1.25mm² 単芯 緑', color:'緑', orderNo:'SO-2026-0438', mfgNo:'MFG-002',
    packaging:'タバ', length:2000, inspectionQty:4, passed:0, failed:0, specialAccept:0,
    status:'予定', tNo:'1', abnormalReport:false, remarks:'' },
  { id:'INS-S03', date:'2026-06-03', designDocNo:'TD-2540', customer:'ヤマハ発動機株式会社',
    productName:'制御ケーブル 0.75mm² 10芯', color:'グレー', orderNo:'SO-2026-0445', mfgNo:'MFG-004',
    packaging:'タバ', length:1500, inspectionQty:3, passed:0, failed:0, specialAccept:0,
    status:'予定', tNo:'1', abnormalReport:false, remarks:'' },
  { id:'INS-001', date:'2026-05-19', designDocNo:'TD-2235', customer:'豊田自動織機',
    productName:'HXB-S5 5芯×1sq 編組加工', color:'オレンジ', orderNo:'441201', mfgNo:'MT09336',
    packaging:'ドラム', length:3690, inspectionQty:1, passed:1, failed:0, specialAccept:0,
    status:'合格', tNo:'1', abnormalReport:false, remarks:'' },
  { id:'INS-002', date:'2026-05-19', designDocNo:'TD-2235', customer:'豊田自動織機',
    productName:'HXB-S5 5芯×1sq 編組加工', color:'オレンジ', orderNo:'441202', mfgNo:'MT09348',
    packaging:'ドラム', length:3690, inspectionQty:1, passed:1, failed:0, specialAccept:0,
    status:'合格', tNo:'1', abnormalReport:false, remarks:'' },
  { id:'INS-003', date:'2026-05-19', designDocNo:'TD-0118', customer:'FDC株式会社',
    productName:'同軸ケーブル CXL-3E 50Ω', color:'灰', orderNo:'440881', mfgNo:'4AK0087',
    packaging:'タバ', length:500, inspectionQty:4, passed:4, failed:0, specialAccept:0,
    status:'合格', tNo:'1', abnormalReport:false, remarks:'' },
  { id:'INS-004', date:'2026-05-19', designDocNo:'TD-2017', customer:'一般',
    productName:'耐熱ビニル絶縁電線 0.5sq', color:'黄', orderNo:'441847', mfgNo:'-',
    packaging:'タバ', length:500, inspectionQty:25, passed:25, failed:0, specialAccept:0,
    status:'合格', tNo:'1', abnormalReport:false, remarks:'' },
  { id:'INS-005', date:'2026-05-19', designDocNo:'TD-0125', customer:'FDC株式会社',
    productName:'同軸ケーブル 8DX-2', color:'灰', orderNo:'441359', mfgNo:'4Aウ0457',
    packaging:'タバ', length:100, inspectionQty:20, passed:20, failed:0, specialAccept:0,
    status:'合格', tNo:'1', abnormalReport:false, remarks:'' },
  { id:'INS-006', date:'2026-05-20', designDocNo:'TD-8429', customer:'日立製作所',
    productName:'3D-EXA（TA）同軸加工品', color:'黒', orderNo:'440028', mfgNo:'NK92500039',
    packaging:'ドラム', length:1000, inspectionQty:8, passed:8, failed:0, specialAccept:0,
    status:'合格', tNo:'1', abnormalReport:false, remarks:'' },
  { id:'INS-007', date:'2026-05-20', designDocNo:'TD-0142', customer:'FDC株式会社',
    productName:'IPEV-K(CU) 1P×1.25sq', color:'黒', orderNo:'441767', mfgNo:'4AK0255',
    packaging:'ドラム', length:1205, inspectionQty:2, passed:2, failed:0, specialAccept:0,
    status:'合格', tNo:'1', abnormalReport:false, remarks:'' },
  { id:'INS-008', date:'2026-05-20', designDocNo:'TD-2540', customer:'住友電気工業株式会社',
    productName:'CVV 2C×2sq 低温対応仕様', color:'黒', orderNo:'B-2507-34', mfgNo:'-',
    packaging:'ドラム', length:100, inspectionQty:1, passed:0, failed:1, specialAccept:0,
    status:'否認', tNo:'', abnormalReport:true, remarks:'シース傷あり・要手直し' },
  { id:'INS-009', date:'2026-05-20', designDocNo:'TD-2269', customer:'三菱電機株式会社',
    productName:'制御用ビニル電線 2C×0.2sq', color:'-', orderNo:'440659', mfgNo:'-',
    packaging:'ボビン', length:3000, inspectionQty:16, passed:15, failed:1, specialAccept:1,
    status:'特採', tNo:'1', abnormalReport:true, remarks:'1本端末部傷あり、客先了承済' },
  { id:'INS-010', date:'2026-05-20', designDocNo:'TD-1253', customer:'FDC株式会社',
    productName:'耐熱シールド対撚電線 3P×1.25', color:'黒', orderNo:'440082', mfgNo:'4MX0155',
    packaging:'ドラム', length:1000, inspectionQty:1, passed:1, failed:0, specialAccept:0,
    status:'合格', tNo:'', abnormalReport:false, remarks:'' },
  { id:'INS-011', date:'2026-05-21', designDocNo:'TD-1659', customer:'FDC株式会社',
    productName:'架橋ポリエチレン絶縁コア 3.5sq', color:'原', orderNo:'441787', mfgNo:'4NR0607',
    packaging:'ボビン', length:2000, inspectionQty:6, passed:6, failed:0, specialAccept:0,
    status:'合格', tNo:'', abnormalReport:false, remarks:'' },
  { id:'INS-012', date:'2026-05-21', designDocNo:'TD-0578', customer:'FDC株式会社',
    productName:'600V 耐熱ビニル絶縁電線 1CX0.75sq', color:'黄', orderNo:'441849', mfgNo:'4MX0831',
    packaging:'タバ', length:300, inspectionQty:2, passed:2, failed:0, specialAccept:0,
    status:'合格', tNo:'1', abnormalReport:false, remarks:'' },
  { id:'INS-013', date:'2026-05-21', designDocNo:'TD-0949', customer:'FDC株式会社',
    productName:'600V 耐熱ビニル絶縁電線 1CX0.5sq（TA導体）', color:'黄', orderNo:'441203', mfgNo:'4MY0085',
    packaging:'タバ', length:300, inspectionQty:10, passed:10, failed:0, specialAccept:0,
    status:'合格', tNo:'1', abnormalReport:false, remarks:'' },
  { id:'INS-014', date:'2026-05-21', designDocNo:'TD-2274', customer:'東芝インフラシステムズ株式会社',
    productName:'多芯シールドケーブル 19/0.18 TA 編組加工', color:'-', orderNo:'441777', mfgNo:'-',
    packaging:'ボビン', length:3250, inspectionQty:1, passed:0, failed:0, specialAccept:0,
    status:'検品中', tNo:'2', abnormalReport:false, remarks:'寸法確認中' },
  { id:'INS-015', date:'2026-05-21', designDocNo:'TD-2235', customer:'豊田自動織機',
    productName:'HXB-S5 5芯×1sq 編組加工', color:'オレンジ', orderNo:'441815', mfgNo:'MT09329',
    packaging:'ドラム', length:3090, inspectionQty:1, passed:0, failed:0, specialAccept:0,
    status:'検品中', tNo:'1', abnormalReport:false, remarks:'' },
  { id:'INS-016', date:'2026-05-21', designDocNo:'TD-0577', customer:'FDC株式会社',
    productName:'600V 耐熱ビニル絶縁電線 1CX0.75sq', color:'黄', orderNo:'441204', mfgNo:'4MY0086',
    packaging:'タバ', length:300, inspectionQty:10, passed:0, failed:0, specialAccept:0,
    status:'検品中', tNo:'1', abnormalReport:false, remarks:'' },
  { id:'INS-017', date:'2026-05-21', designDocNo:'TD-0110', customer:'FDC株式会社',
    productName:'同軸ケーブル 3DX-2', color:'灰', orderNo:'441484', mfgNo:'4Aウ0464',
    packaging:'タバ(箱)', length:200, inspectionQty:20, passed:0, failed:0, specialAccept:0,
    status:'未検品', tNo:'1', abnormalReport:false, remarks:'' },
  { id:'INS-018', date:'2026-05-21', designDocNo:'TD-2235', customer:'豊田自動織機',
    productName:'HXB-S5 5芯×1sq 編組加工', color:'オレンジ', orderNo:'441817', mfgNo:'MT09333',
    packaging:'ドラム', length:3809, inspectionQty:1, passed:0, failed:0, specialAccept:0,
    status:'未検品', tNo:'1', abnormalReport:false, remarks:'' },
  { id:'INS-019', date:'2026-05-21', designDocNo:'TD-2235', customer:'豊田自動織機',
    productName:'HXB-S5 5芯×1sq 編組加工', color:'オレンジ', orderNo:'441820', mfgNo:'MT09337',
    packaging:'ドラム', length:3010, inspectionQty:1, passed:0, failed:0, specialAccept:0,
    status:'未検品', tNo:'1', abnormalReport:false, remarks:'' },
  { id:'INS-020', date:'2026-05-21', designDocNo:'TD-8429', customer:'日立製作所',
    productName:'3D-EXA（TA）同軸加工品', color:'黒', orderNo:'440029', mfgNo:'NK92500040',
    packaging:'ドラム', length:900, inspectionQty:1, passed:0, failed:0, specialAccept:0,
    status:'未検品', tNo:'9', abnormalReport:false, remarks:'' },
  { id:'INS-021', date:'2026-05-22', designDocNo:'TD-0949', customer:'FDC株式会社',
    productName:'600V 耐熱ビニル絶縁電線 1CX0.5sq（TA導体）', color:'黄', orderNo:'441584', mfgNo:'4MX0803',
    packaging:'タバ', length:300, inspectionQty:1, passed:0, failed:0, specialAccept:0,
    status:'未検品', tNo:'1', abnormalReport:false, remarks:'' },
  { id:'INS-022', date:'2026-05-22', designDocNo:'TD-0125', customer:'FDC株式会社',
    productName:'同軸ケーブル 8DX-2', color:'灰', orderNo:'441298', mfgNo:'4AK0284',
    packaging:'タバ', length:100, inspectionQty:40, passed:0, failed:0, specialAccept:0,
    status:'未検品', tNo:'1', abnormalReport:false, remarks:'' },
  { id:'INS-023', date:'2026-05-22', designDocNo:'TD-2541', customer:'住友電気工業株式会社',
    productName:'CVV 3C×2sq 低温対応仕様', color:'黒', orderNo:'B-2508-21', mfgNo:'-',
    packaging:'ドラム', length:200, inspectionQty:2, passed:0, failed:0, specialAccept:0,
    status:'未検品', tNo:'', abnormalReport:false, remarks:'' },
  { id:'INS-024', date:'2026-05-22', designDocNo:'TD-2274', customer:'東芝インフラシステムズ株式会社',
    productName:'多芯シールドケーブル 19/0.18 TA 編組加工', color:'-', orderNo:'441778', mfgNo:'-',
    packaging:'ボビン', length:3250, inspectionQty:1, passed:0, failed:0, specialAccept:0,
    status:'未検品', tNo:'3', abnormalReport:false, remarks:'' },
  { id:'INS-025', date:'2026-05-22', designDocNo:'TD-0118', customer:'FDC株式会社',
    productName:'同軸ケーブル CXL-3E 50Ω', color:'灰', orderNo:'441001', mfgNo:'4AK0102',
    packaging:'タバ', length:500, inspectionQty:6, passed:2, failed:4, specialAccept:0,
    status:'否認', tNo:'', abnormalReport:true, remarks:'コネクタ部品不良・再加工指示' },
];

// ─── トラブル報告初期データ ────────────────────────────────────────────
export const initialTroubleReports = [
  { id:'TRB-001', createdAt:'2026-05-20', mfgOrderId:'MO2025-001', mfgOrderNumber:'MO2025-001', productName:'CV 5.5mm² 3芯 黒シース', machine:'EX-07', category:'品質異常', description:'外径が規格上限を超えた。スクリュー温度を再調整中。', severity:'中', status:'対応中', reportedBy:'山田', resolvedAt:null, resolution:'' },
  { id:'TRB-002', createdAt:'2026-05-19', mfgOrderId:'MO2025-002', mfgOrderNumber:'MO2025-002', productName:'CV 2.0mm² 2芯 白シース', machine:'SL-1', category:'機械停止', description:'SL-1 の撚線機がオーバーヒートで停止。保全に連絡済み。', severity:'高', status:'解決済', reportedBy:'細野', resolvedAt:'2026-05-20', resolution:'冷却ファン清掃・再起動で復旧。' },
];

// ─── 設備マスタ詳細初期データ ──────────────────────────────────────────
export const initialMachineDetails = {
  'EX-07': { capacity:200, yearInstalled:2018, notes:'押出ライン主力機', maxDiameter:30, status:'稼働中' },
  'EX-12': { capacity:180, yearInstalled:2016, notes:'小径ケーブル専用', maxDiameter:20, status:'稼働中' },
  'EX-03': { capacity:150, yearInstalled:2012, notes:'', maxDiameter:25, status:'稼働中' },
  'SL-1':  { capacity:120, yearInstalled:2019, notes:'撚線ライン1号機', maxDiameter:null, status:'稼働中' },
  'SL-5':  { capacity:100, yearInstalled:2015, notes:'', maxDiameter:null, status:'稼働中' },
  'BA-01': { capacity: 80, yearInstalled:2017, notes:'編組専用機1号機', maxDiameter:15, status:'稼働中' },
  'BA-22': { capacity: 80, yearInstalled:2020, notes:'', maxDiameter:15, status:'稼働中' },
  '切断AC-01': { capacity:999, yearInstalled:2021, notes:'高速切断機', maxDiameter:null, status:'稼働中' },
};

// ─── 棚ロケーション定義 ──────────────────────────────────────────────────
// メイン倉庫: 行 A〜M × 列 1〜10 = 最大130ロケーション
export const MAIN_WAREHOUSE_ROWS = ['A','B','C','D','E','F','G','H','I','J','K','L','M'];
export const MAIN_WAREHOUSE_COLS = Array.from({ length: 10 }, (_, i) => i + 1);

// 品目コード → メイン倉庫ロケーションID の初期割り付け
export const initialMaterialShelfAssignment = {
  M001: 'A-1',   // 銅導体 1.25mm²
  M002: 'A-2',   // 銅導体 3.5mm²
  M005: 'B-1',   // PVC絶縁コンパウンド
  M006: 'B-2',   // PVCシースコンパウンド
  M007: 'C-1',   // 介在物（PP紐）
};

// ─── 端数処理初期設定 ──────────────────────────────────────────────────
export const initialFractionRule = { global: '四捨五入', decimals: 2 };
