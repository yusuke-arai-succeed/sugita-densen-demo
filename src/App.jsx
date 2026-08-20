import { AppProvider, useApp } from './context/AppContext';
import AuthGate from './components/AuthGate';
import Layout from './components/Layout';
import Dashboard from './components/Dashboard';
import ProductMaster from './components/ProductMaster';
import QuoteManagement from './components/QuoteManagement';
import OrderEntry from './components/OrderEntry';
import ProductionSchedule from './components/ProductionSchedule';
import ManufacturingCalendar from './components/ManufacturingCalendar';
import ManufacturingReport from './components/ManufacturingReport';
import Inventory from './components/Inventory';
import MaterialProcurement from './components/MaterialProcurement';
import InventoryManagement from './components/InventoryManagement';
import MaterialMaster from './components/MaterialMaster';
import QualityInspection from './components/QualityInspection';
import LabelOutput from './components/LabelOutput';
import TechRequest from './components/TechRequest';
import EquipmentMaster from './components/EquipmentMaster';
import InvoiceManagement from './components/InvoiceManagement';
import CustomerMaster from './components/CustomerMaster';

function AppContent() {
  const { activeApp } = useApp();

  const renderApp = () => {
    switch (activeApp) {
      case 'dashboard':     return <Dashboard />;
      case 'productMaster':  return <ProductMaster />;
      case 'materialMaster': return <MaterialMaster />;
      case 'quote':          return <QuoteManagement />;
      case 'order':         return <OrderEntry />;
      case 'production':    return <ProductionSchedule />;
      case 'mfgCalendar':    return <ManufacturingCalendar />;
      case 'manufacturing':  return <ManufacturingReport />;
      case 'inspection':     return <QualityInspection />;
      case 'procurement':    return <MaterialProcurement />;
      case 'inventoryMgmt':  return <InventoryManagement />;
      case 'inventory':      return <Inventory />;
      case 'label':          return <LabelOutput />;
      case 'techRequest':    return <TechRequest />;
      case 'equipment':      return <EquipmentMaster />;
      case 'invoice':         return <InvoiceManagement />;
      case 'customerMaster':  return <CustomerMaster />;
      default:                return <Dashboard />;
    }
  };

  return <Layout>{renderApp()}</Layout>;
}

export default function App() {
  return (
    <AuthGate>
      <AppProvider>
        <AppContent />
      </AppProvider>
    </AuthGate>
  );
}
