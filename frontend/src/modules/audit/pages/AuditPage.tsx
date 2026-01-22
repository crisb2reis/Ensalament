
import React, { useState, useMemo, useEffect } from 'react';
import { api } from '@/services/api';
import {
  History,
  Download,
  Filter,
  User,
  Calendar,
  ExternalLink,
  X,
  Shield,
  Activity,
  Globe,
  Cpu,
  Fingerprint,
  ChevronDown,
  Trash2,
  Search
} from 'lucide-react';

interface AuditLog {
  id: string;
  timestamp: string;
  user: string;
  action: string;
  context: string;
  ip: string;
  details: {
    browser: string;
    os: string;
    sessionId: string;
    impact: 'Alta' | 'Média' | 'Baixa';
    rawData: any;
  };
}

const AuditPage: React.FC = () => {
  const [selectedLog, setSelectedLog] = useState<AuditLog | null>(null);
  const [showFilters, setShowFilters] = useState(false);

  // Filter States
  const [searchUser, setSearchUser] = useState('');
  const [filterImpact, setFilterImpact] = useState<string>('ALL');
  const [filterAction, setFilterAction] = useState<string>('ALL');

  const [logs, setLogs] = useState<AuditLog[]>([]);

  const fetchLogs = async () => {
    try {
      const data = await api.get('/audit/');
      setLogs(data.map((l: any) => ({
        id: l.id,
        timestamp: new Date(l.timestamp).toLocaleString(),
        user: l.user,
        action: l.action,
        context: l.context,
        ip: l.ip,
        details: {
          browser: l.details?.browser || 'N/A',
          os: l.details?.os || 'N/A',
          sessionId: l.details?.sessionId || 'N/A',
          impact: l.impact,
          rawData: l.details || {}
        }
      })));
    } catch (error) {
      console.error("Erro ao buscar logs:", error);
    }
  };

  useEffect(() => {
    fetchLogs();
  }, []);

  const filteredLogs = useMemo(() => {
    return logs.filter(log => {
      const matchesUser = log.user.toLowerCase().includes(searchUser.toLowerCase());
      const matchesImpact = filterImpact === 'ALL' || log.details.impact === filterImpact;
      const matchesAction = filterAction === 'ALL' || log.action === filterAction;
      return matchesUser && matchesImpact && matchesAction;
    });
  }, [searchUser, filterImpact, filterAction]);

  const resetFilters = () => {
    setSearchUser('');
    setFilterImpact('ALL');
    setFilterAction('ALL');
  };

  const uniqueActions = Array.from(new Set(logs.map(l => l.action)));

  return (
    <div className="space-y-6 animate-in slide-in-from-right-4 duration-500">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h2 className="text-2xl font-bold text-gray-800">Logs de Auditoria</h2>
          <p className="text-sm text-gray-500">Rastreabilidade completa e imutável para conformidade e segurança (LGPD).</p>
        </div>
        <button className="flex items-center justify-center space-x-2 px-6 py-3 bg-indigo-600 text-white font-bold rounded-xl hover:bg-indigo-700 shadow-lg shadow-indigo-100 transition-all active:scale-95">
          <Download size={18} />
          <span>Exportar Relatório</span>
        </button>
      </div>

      <div className="bg-white rounded-2xl border border-gray-200 shadow-sm overflow-hidden">
        {/* Filter Bar */}
        <div className="p-5 border-b border-gray-100 flex flex-col md:flex-row md:items-center justify-between gap-4 bg-white">
          <div className="flex-1 relative">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400" size={18} />
            <input
              type="text"
              placeholder="Buscar por usuário..."
              className="w-full pl-10 pr-4 py-2.5 bg-gray-50 border border-gray-200 rounded-xl focus:ring-4 focus:ring-indigo-500/10 outline-none transition-all text-sm"
              value={searchUser}
              onChange={(e) => setSearchUser(e.target.value)}
            />
          </div>
          <div className="flex items-center space-x-2">
            <button
              onClick={() => setShowFilters(!showFilters)}
              className={`flex items-center space-x-2 px-4 py-2.5 border rounded-xl font-bold text-sm transition-all ${showFilters ? 'bg-indigo-50 border-indigo-200 text-indigo-700' : 'bg-white border-gray-200 text-gray-600 hover:bg-gray-50'
                }`}
            >
              <Filter size={18} />
              <span>Filtros Avançados</span>
              <ChevronDown size={16} className={`transition-transform ${showFilters ? 'rotate-180' : ''}`} />
            </button>
            {(searchUser || filterImpact !== 'ALL' || filterAction !== 'ALL') && (
              <button
                onClick={resetFilters}
                className="p-2.5 text-red-500 hover:bg-red-50 rounded-xl transition-all"
                title="Limpar todos os filtros"
              >
                <Trash2 size={20} />
              </button>
            )}
          </div>
        </div>

        {/* Advanced Filters Panel */}
        {showFilters && (
          <div className="p-6 bg-gray-50/50 border-b border-gray-100 grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6 animate-in slide-in-from-top-2 duration-300">
            <div className="space-y-2">
              <label className="text-[10px] font-black text-gray-400 uppercase tracking-widest ml-1">Nível de Impacto</label>
              <select
                className="w-full p-3 bg-white border border-gray-200 rounded-xl text-sm font-semibold text-gray-700 outline-none focus:ring-4 focus:ring-indigo-500/10 transition-all"
                value={filterImpact}
                onChange={(e) => setFilterImpact(e.target.value)}
              >
                <option value="ALL">Todos os Impactos</option>
                <option value="Alta">Alta (Crítico)</option>
                <option value="Média">Média (Atenção)</option>
                <option value="Baixa">Baixa (Informativo)</option>
              </select>
            </div>
            <div className="space-y-2">
              <label className="text-[10px] font-black text-gray-400 uppercase tracking-widest ml-1">Tipo de Ação</label>
              <select
                className="w-full p-3 bg-white border border-gray-200 rounded-xl text-sm font-semibold text-gray-700 outline-none focus:ring-4 focus:ring-indigo-500/10 transition-all"
                value={filterAction}
                onChange={(e) => setFilterAction(e.target.value)}
              >
                <option value="ALL">Todas as Ações</option>
                {uniqueActions.map(action => (
                  <option key={action} value={action}>{action}</option>
                ))}
              </select>
            </div>
            <div className="flex items-end">
              <div className="p-4 bg-indigo-50/50 border border-indigo-100 rounded-xl w-full flex items-center space-x-3">
                <Shield size={20} className="text-indigo-400" />
                <p className="text-[11px] text-indigo-700 leading-tight">
                  Os filtros são aplicados em tempo real sobre a base de dados imutável.
                </p>
              </div>
            </div>
          </div>
        )}

        <div className="overflow-x-auto">
          {filteredLogs.length > 0 ? (
            <table className="w-full text-left">
              <thead className="bg-gray-50 text-gray-400 text-[10px] font-black uppercase tracking-[0.15em]">
                <tr>
                  <th className="px-6 py-4">Data/Hora</th>
                  <th className="px-6 py-4">Usuário</th>
                  <th className="px-6 py-4">Ação</th>
                  <th className="px-6 py-4">Impacto</th>
                  <th className="px-6 py-4">Contexto</th>
                  <th className="px-6 py-4 text-right">Ações</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-100">
                {filteredLogs.map((log) => (
                  <tr key={log.id} className="hover:bg-indigo-50/30 transition-colors group">
                    <td className="px-6 py-4 whitespace-nowrap">
                      <span className="text-sm font-bold text-gray-600 font-mono tracking-tight">{log.timestamp}</span>
                    </td>
                    <td className="px-6 py-4">
                      <div className="flex items-center space-x-2">
                        <div className="w-7 h-7 bg-indigo-100 text-indigo-700 rounded-full flex items-center justify-center text-[11px] font-black">
                          {log.user[0]}
                        </div>
                        <span className="text-sm font-bold text-gray-800">{log.user}</span>
                      </div>
                    </td>
                    <td className="px-6 py-4">
                      <span className="text-[10px] font-black px-2.5 py-1 rounded-lg bg-white text-indigo-600 border border-indigo-100 shadow-sm uppercase">
                        {log.action}
                      </span>
                    </td>
                    <td className="px-6 py-4">
                      <span className={`text-[10px] font-black px-2 py-0.5 rounded-full uppercase ${log.details.impact === 'Alta' ? 'bg-red-50 text-red-600' :
                          log.details.impact === 'Média' ? 'bg-amber-50 text-amber-600' : 'bg-emerald-50 text-emerald-600'
                        }`}>
                        {log.details.impact}
                      </span>
                    </td>
                    <td className="px-6 py-4 max-w-xs truncate">
                      <span className="text-sm text-gray-500 font-medium">{log.context}</span>
                    </td>
                    <td className="px-6 py-4 text-right">
                      <button
                        onClick={() => setSelectedLog(log)}
                        className="p-2 text-gray-400 hover:text-indigo-600 bg-gray-50 hover:bg-indigo-50 rounded-lg transition-all"
                        title="Ver detalhes técnicos"
                      >
                        <ExternalLink size={18} />
                      </button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          ) : (
            <div className="p-20 text-center bg-gray-50/20">
              <Search size={48} className="mx-auto text-gray-200 mb-4" />
              <p className="text-gray-500 font-medium">Nenhum log encontrado para os critérios de busca.</p>
              <button onClick={resetFilters} className="mt-4 text-indigo-600 font-bold hover:underline">Limpar todos os filtros</button>
            </div>
          )}
        </div>
      </div>

      {/* MODAL DE DETALHES DE AUDITORIA */}
      {selectedLog && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-gray-900/60 backdrop-blur-sm animate-in fade-in duration-300">
          <div className="bg-white w-full max-w-2xl rounded-2xl shadow-2xl overflow-hidden flex flex-col animate-in zoom-in-95 duration-300">
            {/* Header */}
            <div className="p-6 border-b border-gray-100 flex items-center justify-between bg-slate-800 text-white">
              <div className="flex items-center space-x-4">
                <div className="bg-indigo-500 p-2 rounded-xl">
                  <Shield size={22} />
                </div>
                <div>
                  <h3 className="text-lg font-bold">Detalhes da Auditoria</h3>
                  <p className="text-slate-400 text-xs font-mono">{selectedLog.id} • {selectedLog.timestamp}</p>
                </div>
              </div>
              <button
                onClick={() => setSelectedLog(null)}
                className="p-2 hover:bg-white/10 rounded-lg transition-colors"
              >
                <X size={20} />
              </button>
            </div>

            {/* Body */}
            <div className="p-8 space-y-8 overflow-y-auto max-h-[70vh]">
              <div className="grid grid-cols-2 gap-6">
                <div className="space-y-1">
                  <p className="text-[10px] font-black text-gray-400 uppercase tracking-widest">Ação Realizada</p>
                  <p className="text-lg font-bold text-gray-800">{selectedLog.action}</p>
                </div>
                <div className="space-y-1">
                  <p className="text-[10px] font-black text-gray-400 uppercase tracking-widest">Usuário Responsável</p>
                  <div className="flex items-center space-x-2">
                    <User size={16} className="text-indigo-500" />
                    <p className="text-lg font-bold text-gray-800">{selectedLog.user}</p>
                  </div>
                </div>
              </div>

              <div className="h-px bg-gray-100 w-full" />

              <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                <div className="flex items-start space-x-3">
                  <Globe size={18} className="text-gray-400 mt-0.5" />
                  <div>
                    <p className="text-[10px] font-black text-gray-400 uppercase">Origem IP</p>
                    <p className="text-sm font-bold text-gray-700">{selectedLog.ip}</p>
                  </div>
                </div>
                <div className="flex items-start space-x-3">
                  <Cpu size={18} className="text-gray-400 mt-0.5" />
                  <div>
                    <p className="text-[10px] font-black text-gray-400 uppercase">Navegador/OS</p>
                    <p className="text-sm font-bold text-gray-700">{selectedLog.details.browser}</p>
                    <p className="text-[10px] text-gray-500">{selectedLog.details.os}</p>
                  </div>
                </div>
                <div className="flex items-start space-x-3">
                  <Fingerprint size={18} className="text-gray-400 mt-0.5" />
                  <div>
                    <p className="text-[10px] font-black text-gray-400 uppercase">ID da Sessão</p>
                    <p className="text-sm font-mono font-bold text-indigo-600">{selectedLog.details.sessionId}</p>
                  </div>
                </div>
              </div>

              <div className="space-y-3">
                <div className="flex items-center justify-between">
                  <p className="text-[10px] font-black text-gray-400 uppercase tracking-widest flex items-center">
                    <Activity size={14} className="mr-2" /> Metadados da Ação
                  </p>
                  <span className={`px-2 py-0.5 rounded text-[10px] font-black uppercase ${selectedLog.details.impact === 'Alta' ? 'bg-red-100 text-red-700' : 'bg-indigo-100 text-indigo-700'
                    }`}>
                    Impacto {selectedLog.details.impact}
                  </span>
                </div>
                <div className="bg-gray-900 rounded-xl p-6 overflow-x-auto shadow-inner border border-gray-800">
                  <pre className="text-xs font-mono text-emerald-400">
                    {JSON.stringify(selectedLog.details.rawData, null, 2)}
                  </pre>
                </div>
              </div>

              <div className="bg-indigo-50 border-l-4 border-indigo-500 p-4 rounded-r-xl">
                <p className="text-[10px] font-black text-indigo-600 uppercase mb-1">Contexto do Sistema</p>
                <p className="text-sm text-indigo-900 font-medium leading-relaxed">
                  {selectedLog.context}. Esta ação é definitiva e foi persistida em banco de dados de auditoria imutável conforme os padrões de segurança universitários.
                </p>
              </div>
            </div>

            <div className="p-6 border-t border-gray-100 bg-gray-50 flex justify-end">
              <button
                onClick={() => setSelectedLog(null)}
                className="px-8 py-2.5 bg-slate-800 text-white rounded-xl font-black text-xs uppercase tracking-widest hover:bg-slate-900 transition-all shadow-lg active:scale-95"
              >
                Fechar Detalhes
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default AuditPage;
