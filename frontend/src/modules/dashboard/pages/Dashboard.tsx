import React, { useState, useEffect } from 'react';
import { api } from '@/services/api';
import {
  BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, Legend,
  PieChart, Pie, Cell
} from 'recharts';
import { Users, DoorOpen, AlertTriangle, CheckCircle2, Loader2 } from 'lucide-react';

interface StatsData {
  total_rooms: number;
  active_classes: number;
  pending_conflicts: number;
  completion_rate: string;
}

interface OccupancyItem {
  name: string;
  ocupacao: number;
  capacidade: number;
}

interface DistributionItem {
  name: string;
  value: number;
  [key: string]: any;
}

const Dashboard: React.FC = () => {
  const [loading, setLoading] = useState(true);
  const [statsData, setStatsData] = useState<StatsData>({
    total_rooms: 0,
    active_classes: 0,
    pending_conflicts: 0,
    completion_rate: '0%'
  });
  const [occupancyData, setOccupancyData] = useState<OccupancyItem[]>([]);
  const [pieData, setPieData] = useState<DistributionItem[]>([]);
  const [conflicts, setConflicts] = useState<any[]>([]);

  const fetchData = async () => {
    setLoading(true);
    try {
      const [stats, occupancy, distribution, alerts] = await Promise.all([
        api.get('/dashboard/stats'),
        api.get('/dashboard/occupancy'),
        api.get('/dashboard/distribution'),
        api.get('/dashboard/conflicts')
      ]);
      setStatsData(stats);
      setOccupancyData(occupancy);
      setPieData(distribution);
      setConflicts(alerts);
    } catch (error) {
      console.error("Erro ao buscar dados do dashboard:", error);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchData();
  }, []);

  const stats = [
    { label: 'Total de Salas', value: (statsData.total_rooms || 0).toString(), icon: DoorOpen, color: 'bg-blue-500' },
    { label: 'Turmas Ativas', value: (statsData.active_classes || 0).toString(), icon: Users, color: 'bg-green-500' },
    { label: 'Conflitos Pendentes', value: (statsData.pending_conflicts || 0).toString(), icon: AlertTriangle, color: 'bg-amber-500' },
    { label: 'Ensalamento Concluído', value: statsData.completion_rate || '0%', icon: CheckCircle2, color: 'bg-indigo-500' },
  ];

  const COLORS = ['#4f46e5', '#10b981', '#f59e0b', '#ef4444', '#8b5cf6', '#ec4899'];

  if (loading) {
    return (
      <div className="h-[60vh] flex flex-col items-center justify-center space-y-4">
        <Loader2 className="w-12 h-12 text-indigo-500 animate-spin" />
        <p className="text-gray-500 font-medium animate-pulse">Carregando indicadores...</p>
      </div>
    );
  }

  return (
    <div className="space-y-8 animate-in fade-in duration-500">
      {/* Cards de Estatísticas */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
        {stats.map((stat, idx) => (
          <div key={idx} className="bg-white p-6 rounded-xl border border-gray-100 shadow-sm flex items-center space-x-4 hover:shadow-md transition-shadow">
            <div className={`w-12 h-12 ${stat.color} rounded-lg flex items-center justify-center text-white`}>
              <stat.icon size={24} />
            </div>
            <div>
              <p className="text-sm text-gray-500 font-medium">{stat.label}</p>
              <p className="text-2xl font-bold text-gray-800">{stat.value}</p>
            </div>
          </div>
        ))}
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
        {/* Gráfico de Ocupação */}
        <div className="bg-white p-6 rounded-xl border border-gray-100 shadow-sm transition-all hover:border-indigo-100">
          <h3 className="text-lg font-bold mb-6 text-gray-800">Ocupação por Bloco</h3>
          <div className="h-80">
            <ResponsiveContainer width="100%" height="100%">
              <BarChart data={occupancyData}>
                <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#f0f0f0" />
                <XAxis dataKey="name" axisLine={false} tickLine={false} tick={{ fill: '#94a3b8', fontSize: 12 }} dy={10} />
                <YAxis axisLine={false} tickLine={false} tick={{ fill: '#94a3b8', fontSize: 12 }} />
                <Tooltip
                  contentStyle={{ borderRadius: '12px', border: 'none', boxShadow: '0 10px 15px -3px rgb(0 0 0 / 0.1)' }}
                  cursor={{ fill: '#f8fafc' }}
                />
                <Legend verticalAlign="top" align="right" iconType="circle" wrapperStyle={{ paddingBottom: '20px' }} />
                <Bar dataKey="ocupacao" fill="#6366f1" radius={[4, 4, 0, 0]} name="Turmas Alocadas" barSize={30} />
                <Bar dataKey="capacidade" fill="#e2e8f0" radius={[4, 4, 0, 0]} name="Assentos Totais" barSize={30} />
              </BarChart>
            </ResponsiveContainer>
          </div>
        </div>

        {/* Gráfico de Tipos de Sala */}
        <div className="bg-white p-6 rounded-xl border border-gray-100 shadow-sm transition-all hover:border-emerald-100">
          <h3 className="text-lg font-bold mb-6 text-gray-800">Distribuição de Tipos de Sala</h3>
          <div className="h-80 flex items-center justify-center">
            <ResponsiveContainer width="100%" height="100%">
              <PieChart>
                <Pie
                  data={pieData}
                  cx="50%"
                  cy="50%"
                  innerRadius={70}
                  outerRadius={100}
                  paddingAngle={8}
                  dataKey="value"
                  stroke="none"
                >
                  {pieData.map((entry, index) => (
                    <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />
                  ))}
                </Pie>
                <Tooltip contentStyle={{ borderRadius: '12px', border: 'none', boxShadow: '0 10px 15px -3px rgb(0 0 0 / 0.1)' }} />
                <Legend verticalAlign="bottom" iconType="circle" />
              </PieChart>
            </ResponsiveContainer>
          </div>
        </div>
      </div>

      {/* Alertas de Conflito */}
      <div className="bg-white p-6 rounded-xl border border-gray-100 shadow-sm">
        <div className="flex items-center justify-between mb-6">
          <h3 className="text-lg font-bold text-gray-800">Alertas de Conflito de Ensalamento</h3>
          <button className="text-indigo-600 hover:text-indigo-800 text-sm font-semibold transition-colors">Ver todos</button>
        </div>
        <div className="space-y-4">
          {conflicts && conflicts.length > 0 ? conflicts.map((conflict, i) => (
            <div key={conflict.id || i} className="flex items-center p-4 bg-red-50 border border-red-100 rounded-lg animate-in slide-in-from-left-4 duration-300" style={{ animationDelay: `${i * 100}ms` }}>
              <AlertTriangle className="text-red-500 mr-4 shrink-0" size={20} />
              <div className="flex-1">
                <p className="text-sm font-bold text-red-800">
                  Turma {conflict.class_name} - Sala {conflict.room_number}
                </p>
                <p className="text-xs text-red-600">{conflict.description}</p>
                <div className="mt-1 flex items-center space-x-2 text-[10px] font-bold">
                  <span className="text-red-700">👥 {conflict.students} alunos</span>
                  <span className="text-red-500">→</span>
                  <span className="text-red-700">🪑 {conflict.capacity} vagas</span>
                </div>
              </div>
              <span className="text-[10px] font-black uppercase tracking-wider bg-red-200 text-red-800 px-2.5 py-1 rounded-md">
                {conflict.severity || 'Crítico'}
              </span>
            </div>
          )) : (
            <div className="p-12 text-center bg-gray-50 rounded-2xl border border-dashed border-gray-200">
              <div className="w-16 h-16 bg-emerald-100 rounded-full flex items-center justify-center mx-auto mb-4">
                <CheckCircle2 className="text-emerald-500" size={32} />
              </div>
              <p className="text-gray-600 font-bold">Grade de Horários Otimizada</p>
              <p className="text-sm text-gray-400 mt-1">Nenhum conflito de capacidade ou horário detectado.</p>
            </div>
          )}
        </div>
      </div>
    </div>
  );
};

export default Dashboard;
