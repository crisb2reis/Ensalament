
import React, { useState } from 'react';
import { HashRouter, Routes, Route, Link, Navigate, useLocation } from 'react-router-dom';
import Dashboard from './modules/dashboard/pages/Dashboard';
import RoomsPage from './modules/infrastructure/pages/RoomsPage';
import EnsalamentoPage from './modules/scheduling/pages/EnsalamentoPage';
import AcademicPage from './modules/academic/pages/AcademicPage';
import AuditPage from './modules/audit/pages/AuditPage';
import {
  LayoutDashboard,
  MapPin,
  CalendarRange,
  ShieldCheck,
  History,
  Menu,
  X,
  LogOut,
  User,
  GraduationCap
} from 'lucide-react';

const SidebarItem = ({ icon: Icon, label, to, active }: any) => (
  <Link
    to={to}
    className={`flex items-center space-x-3 p-3 rounded-lg transition-all duration-200 ${active
        ? 'bg-indigo-600 text-white shadow-md'
        : 'text-gray-500 hover:bg-gray-100 hover:text-indigo-600'
      }`}
  >
    <Icon size={20} className={active ? 'text-white' : ''} />
    <span className="font-semibold">{label}</span>
  </Link>
);

const AppContent: React.FC = () => {
  const [sidebarOpen, setSidebarOpen] = useState(true);
  const location = useLocation();
  const currentPath = location.pathname;

  // Simulating User Session
  const user = { name: 'Admin Unitas', role: 'System Admin' };

  // Helper function to check if a route is active
  const isActive = (path: string) => {
    if (path === '/' && currentPath === '/') return true;
    return path !== '/' && currentPath.startsWith(path);
  };

  return (
    <div className="flex h-screen overflow-hidden bg-gray-50">
      {/* Sidebar */}
      <aside className={`${sidebarOpen ? 'w-64' : 'w-20'} bg-white border-r border-gray-200 transition-all duration-300 flex flex-col`}>
        <div className="p-6 flex items-center justify-between">
          <div className={`flex items-center space-x-2 ${!sidebarOpen && 'hidden'}`}>
            <div className="w-8 h-8 bg-indigo-600 rounded flex items-center justify-center text-white font-bold">U</div>
            <span className="text-xl font-bold tracking-tight text-gray-800">UniEnsal</span>
          </div>
          <button onClick={() => setSidebarOpen(!sidebarOpen)} className="p-1 hover:bg-gray-100 rounded text-gray-500 transition-colors">
            {sidebarOpen ? <X size={20} /> : <Menu size={20} />}
          </button>
        </div>

        <nav className="flex-1 px-4 space-y-2 mt-4">
          <SidebarItem
            icon={LayoutDashboard}
            label="Dashboard"
            to="/"
            active={isActive('/')}
          />
          <SidebarItem
            icon={GraduationCap}
            label="Gestão Acadêmica"
            to="/academico"
            active={isActive('/academico')}
          />
          <SidebarItem
            icon={MapPin}
            label="Gestão de Salas"
            to="/salas"
            active={isActive('/salas')}
          />
          <SidebarItem
            icon={CalendarRange}
            label="Ensalamento"
            to="/ensalamento"
            active={isActive('/ensalamento')}
          />
          <SidebarItem
            icon={ShieldCheck}
            label="Segurança & RBAC"
            to="/seguranca"
            active={isActive('/seguranca')}
          />
          <SidebarItem
            icon={History}
            label="Auditoria"
            to="/auditoria"
            active={isActive('/auditoria')}
          />
        </nav>

        <div className="p-4 border-t border-gray-100">
          <div className={`flex items-center space-x-3 ${!sidebarOpen && 'justify-center'}`}>
            <div className="w-10 h-10 bg-indigo-100 text-indigo-700 rounded-full flex items-center justify-center font-semibold">
              {user.name[0]}
            </div>
            {sidebarOpen && (
              <div className="flex-1 overflow-hidden">
                <p className="text-sm font-semibold truncate text-gray-800">{user.name}</p>
                <p className="text-xs text-gray-500 truncate font-medium">{user.role}</p>
              </div>
            )}
          </div>
        </div>
      </aside>

      {/* Main Content */}
      <main className="flex-1 flex flex-col overflow-hidden">
        <header className="h-16 bg-white border-b border-gray-200 flex items-center justify-between px-8 z-10 shadow-sm">
          <h1 className="text-lg font-bold text-gray-700">
            {currentPath === '/' ? 'Painel de Controle' :
              currentPath.startsWith('/academico') ? 'Gestão Acadêmica' :
                currentPath.startsWith('/salas') ? 'Gestão de Salas' :
                  currentPath.startsWith('/ensalamento') ? 'Ensalamento' :
                    currentPath.startsWith('/auditoria') ? 'Logs de Auditoria' : 'Sistema'}
          </h1>
          <div className="flex items-center space-x-4">
            <button className="text-gray-400 hover:text-indigo-600 transition-colors" title="Perfil"><User size={20} /></button>
            <button className="text-gray-400 hover:text-red-500 transition-colors" title="Sair"><LogOut size={20} /></button>
          </div>
        </header>

        <div className="flex-1 overflow-y-auto p-8">
          <Routes>
            <Route path="/" element={<Dashboard />} />
            <Route path="/academico" element={<AcademicPage />} />
            <Route path="/salas" element={<RoomsPage />} />
            <Route path="/ensalamento" element={<EnsalamentoPage />} />
            <Route path="/auditoria" element={<AuditPage />} />
            <Route path="*" element={<Navigate to="/" />} />
          </Routes>
        </div>
      </main>
    </div>
  );
};

const App: React.FC = () => {
  return (
    <HashRouter>
      <AppContent />
    </HashRouter>
  );
};

export default App;
