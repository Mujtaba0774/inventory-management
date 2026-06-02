import React, { useState } from 'react';
import { Menu } from 'lucide-react';
import { Sidebar } from './components/Sidebar';
import { Dashboard } from './components/Dashboard';
import { ProductList } from './components/ProductList';
import { ProductForm } from './components/ProductForm';
import { SalesHistory } from './components/SalesHistory';
import { DamagesHistory } from './components/DamagesHistory';
import { StockManagement } from './components/StockManagement';
import { CurrentStock } from './components/CurrentStock';
import { Analytics } from './components/Analytics';
import { VendorTransactions } from './components/VendorTransactions';
import { VendorManagement } from './components/VendorManagement';
import { NotificationToast } from './components/NotificationToast';
import { ProductProvider } from './context/ProductContext';
import { NotificationProvider } from './context/NotificationContext';
import { ConfirmProvider } from './context/ConfirmContext';
import { ThemeSwitcher } from './components/ThemeSwitcher';

function App() {
  const [activeView, setActiveView] = useState('dashboard');
  const [sidebarOpen, setSidebarOpen] = useState(false);
  const [showProductForm, setShowProductForm] = useState(false);
  const [editingProduct, setEditingProduct] = useState();
  const [productListPreset, setProductListPreset] = useState({
    kind: 'all',
    label: 'All Products',
    sortBy: 'name',
  });

  const handleEditProduct = (product) => {
    setEditingProduct(product);
    setShowProductForm(true);
  };

  const handleAddProduct = () => {
    setEditingProduct(undefined);
    setShowProductForm(true);
  };

  const handleCloseProductForm = () => {
    setShowProductForm(false);
    setEditingProduct(undefined);
  };

  const handleOpenProductsWithPreset = (preset) => {
    setProductListPreset({
      kind: preset?.kind ?? 'all',
      label: preset?.label ?? 'All Products',
      sortBy: preset?.sortBy ?? 'name',
      refreshKey: Date.now(),
    });
    setActiveView('products');
    setSidebarOpen(false);
  };

  const handleNavigateToSalesHistory = () => {
    setActiveView('sales');
    setSidebarOpen(false);
  };

  const handleNavigateToDamagesHistory = () => {
    setActiveView('damages');
    setSidebarOpen(false);
  };

  const renderActiveView = () => {
    switch (activeView) {
      case 'products':
        return (
          <ProductList 
            onEditProduct={handleEditProduct}
            onAddProduct={handleAddProduct}
            presetFilter={productListPreset}
          />
        );
      case 'stock':
        return (
          <StockManagement
            onEditProduct={handleEditProduct}
            onAddProduct={handleAddProduct}
            onNavigateToSalesHistory={handleNavigateToSalesHistory}
            onNavigateToDamagesHistory={handleNavigateToDamagesHistory}
          />
        );
      case 'currentStock':
        return (
          <CurrentStock
            onEditProduct={handleEditProduct}
          />
        );
      case 'analytics':
        return (
          <Analytics
            onOpenProductsView={handleOpenProductsWithPreset}
            onEditProduct={handleEditProduct}
            onNavigateToSalesHistory={handleNavigateToSalesHistory}
          />
        );
      case 'sales':
        return <SalesHistory />;
      case 'damages':
        return <DamagesHistory />;
      case 'vendor-transactions':
        return <VendorTransactions />;
      case 'vendor-management':
        return <VendorManagement />;
      default:
        return (
          <Dashboard
            onEditProduct={handleEditProduct}
            onNavigateToSalesHistory={handleNavigateToSalesHistory}
          />
        );
    }
  };

  return (
    <NotificationProvider>
      <ConfirmProvider>
        <ProductProvider>
          <div className="h-screen bg-gradient-to-br from-slate-50 via-blue-50 to-slate-100 dark:from-slate-950 dark:via-slate-900 dark:to-slate-950 flex">
            <Sidebar
              activeView={activeView}
              setActiveView={setActiveView}
              isOpen={sidebarOpen}
              setIsOpen={setSidebarOpen}
            />

            <div className="flex-1 overflow-y-auto pt-20 sm:pt-20 md:pt-20 lg:pt-0">
              {/* Mobile header */}
              <div className="lg:hidden fixed top-0 left-0 right-0 z-10 bg-white dark:bg-slate-800 shadow-medium dark:shadow-lg border-b border-gray-100 dark:border-slate-700 p-4">
                <div className="flex items-center justify-between">
                  <button
                    onClick={() => setSidebarOpen(true)}
                    className="text-gray-600 dark:text-slate-200 hover:text-primary-600 dark:hover:text-primary-400 transition-colors"
                  >
                    <Menu className="h-6 w-6" />
                  </button>
                  <div className="flex items-center space-x-2">
                    <div className="w-8 h-8 bg-gradient-to-br from-primary-500 to-secondary-600 rounded-lg flex items-center justify-center shadow-soft">
                      <span className="text-white text-sm font-bold">F</span>
                    </div>
                    <div>
                      <h1 className="text-base font-bold bg-gradient-to-r from-primary-600 to-secondary-600 dark:from-primary-400 dark:to-secondary-400 bg-clip-text text-transparent">Forrentech</h1>
                      <p className="text-xs text-gray-500 dark:text-slate-400">Warehouse</p>
                    </div>
                  </div>
                  <div className="w-6 mr-3 md:mr-0"> <ThemeSwitcher /></div>
                </div>
              </div>

              {/* Main content */}
              <main className="p-4 lg:p-8">
                {renderActiveView()}
              </main>
            </div>

            {/* Product Form Modal */}
            {showProductForm && (
              <ProductForm
                product={editingProduct}
                onClose={handleCloseProductForm}
              />
            )}
          </div>

          <NotificationToast />
        </ProductProvider>
      </ConfirmProvider>
    </NotificationProvider>
  );
}

export default App;