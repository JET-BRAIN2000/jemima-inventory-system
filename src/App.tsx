import { AppProvider, useApp } from './context/AppContext';
import AuthPage from './pages/AuthPage';
import Layout from './components/Layout';
import DashboardPage from './pages/DashboardPage';
import AddItemPage from './pages/AddItemPage';
import InventoryPage from './pages/InventoryPage';
import SalesPage from './pages/SalesPage';
import StatisticsPage from './pages/StatisticsPage';
import SettingsPage from './pages/SettingsPage';

function AppInner() {
  const { currentUser, activePage, theme } = useApp();

  if (!currentUser) return <AuthPage />;

  const pages: Record<string, React.ReactNode> = {
    dashboard: <DashboardPage />,
    'add-item': <AddItemPage />,
    inventory: <InventoryPage />,
    sales: <SalesPage />,
    statistics: <StatisticsPage />,
    settings: <SettingsPage />,
  };

  return (
    <div className={theme === 'dark' ? 'dark' : ''}>
      <div className={`${theme === 'dark' ? 'bg-gray-900 text-white' : 'bg-gray-50 text-gray-900'} min-h-screen`}>
        <Layout>
          {pages[activePage] ?? <DashboardPage />}
        </Layout>
      </div>
    </div>
  );
}

export default function App() {
  return (
    <AppProvider>
      <AppInner />
    </AppProvider>
  );
}
