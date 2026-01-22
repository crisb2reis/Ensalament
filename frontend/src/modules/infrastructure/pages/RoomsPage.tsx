
import React, { useState, useMemo, useEffect } from 'react';
import { api } from '@/services/api';
import { Room, RoomType, Resource } from '@/core/types';
import {
  Plus,
  Search,
  Edit3,
  Trash2,
  Eye,
  X,
  CheckCircle2,
  Save,
  MapPin,
  Settings2,
  Info
} from 'lucide-react';

const RoomsPage: React.FC = () => {
  const [searchTerm, setSearchTerm] = useState('');
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [modalMode, setModalMode] = useState<'create' | 'edit' | 'view'>('create');
  const [selectedRoom, setSelectedRoom] = useState<Room | null>(null);

  const [rooms, setRooms] = useState<Room[]>([]);

  const fetchRooms = async () => {
    try {
      const data = await api.get('/rooms/');
      // Mapeamento de is_active (backend) para isActive (frontend)
      const mappedRooms = data.map((room: any) => ({
        ...room,
        isActive: room.is_active ?? room.isActive ?? true
      }));
      setRooms(mappedRooms);
    } catch (error) {
      console.error("Erro ao buscar salas:", error);
    }
  };

  useEffect(() => {
    fetchRooms();
    fetchOccupancy();
  }, []);

  const [occupancyMap, setOccupancyMap] = useState<Record<string, number>>({});

  const fetchOccupancy = async () => {
    try {
      const schedules = await api.get('/schedules/');
      const map: Record<string, number> = {};
      schedules.forEach((s: any) => {
        // Usar room_id se disponível, ou s.room.id
        const roomId = s.room_id || s.room?.id;
        if (roomId) {
          // Somar alunos da turma (se houver turma)
          const students = s.school_class?.students_count || 0;
          map[roomId] = (map[roomId] || 0) + students;
        }
      });
      setOccupancyMap(map);
    } catch (error) {
      console.error("Erro ao carregar ocupação:", error);
    }
  };

  const initialFormState: Omit<Room, 'id' | 'isActive' | 'resources'> = {
    campus: '', building: '', block: '', floor: 0, number: '', capacity: 0, type: RoomType.COMMON
  };

  const [formData, setFormData] = useState(initialFormState);

  // Handlers de Ação
  const handleOpenCreate = () => {
    setModalMode('create');
    setFormData(initialFormState);
    setIsModalOpen(true);
  };

  const handleOpenView = (room: Room) => {
    setModalMode('view');
    setSelectedRoom(room);
    setFormData(room);
    setIsModalOpen(true);
  };

  const handleOpenEdit = (room: Room) => {
    setModalMode('edit');
    setSelectedRoom(room);
    setFormData(room);
    setIsModalOpen(true);
  };

  const handleDelete = async (id: string) => {
    if (window.confirm("Tem certeza que deseja remover esta sala? Esta ação é auditável e não pode ser desfeita.")) {
      try {
        await api.delete(`/rooms/${id}`);
        await fetchRooms();
      } catch (error) {
        alert("Erro ao excluir sala.");
        console.error(error);
      }
    }
  };

  const handleSave = async (e: React.FormEvent) => {
    e.preventDefault();
    if (modalMode === 'view') return;

    try {
      // Sanitizar payload: Remover campos que o backend não espera e mapear isActive -> is_active
      const { ...payload } = formData as any;

      // Remover campos problemáticos se existirem
      delete payload.id;
      delete payload.resources;

      // Mapear isActive para is_active para o backend
      if ('isActive' in payload) {
        payload.is_active = payload.isActive;
        delete payload.isActive;
      } else if (modalMode === 'edit' && selectedRoom) {
        // Se estiver editando e não tiver isActive no formData, pegar do selecionado
        payload.is_active = (selectedRoom as any).isActive ?? true;
      }

      if (modalMode === 'create') {
        await api.post('/rooms/', payload);
      } else if (modalMode === 'edit' && selectedRoom) {
        await api.put(`/rooms/${selectedRoom.id}`, payload);
      }
      await fetchRooms();
      setIsModalOpen(false);
    } catch (error: any) {
      alert(`Erro ao salvar sala: ${error.message}`);
      console.error(error);
    }
  };

  const filteredRooms = useMemo(() => {
    return rooms.filter(room =>
      room.number.toLowerCase().includes(searchTerm.toLowerCase()) ||
      room.building.toLowerCase().includes(searchTerm.toLowerCase())
    ).sort((a, b) => a.number.localeCompare(b.number, undefined, { numeric: true }));
  }, [rooms, searchTerm]);

  return (
    <div className="space-y-6 animate-in slide-in-from-bottom-4 duration-500">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h2 className="text-2xl font-bold text-gray-800">Gestão de Salas</h2>
          <p className="text-sm text-gray-500">Administre os espaços físicos e infraestrutura do campus.</p>
        </div>
        <button
          onClick={handleOpenCreate}
          className="flex items-center space-x-2 px-6 py-3 bg-indigo-600 hover:bg-indigo-700 text-white rounded-xl font-bold shadow-lg transition-all active:scale-95"
        >
          <Plus size={20} />
          <span>Nova Sala</span>
        </button>
      </div>

      <div className="bg-white rounded-2xl border border-gray-200 shadow-sm overflow-hidden">
        <div className="p-5 border-b border-gray-100">
          <div className="relative max-w-md">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400" size={18} />
            <input
              type="text"
              placeholder="Pesquisar por número ou prédio..."
              className="w-full pl-10 pr-4 py-2.5 bg-gray-50 border border-gray-200 rounded-xl outline-none text-sm focus:ring-2 focus:ring-indigo-500/20"
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
            />
          </div>
        </div>

        <div className="overflow-x-auto">
          <table className="w-full text-left">
            <thead className="bg-gray-50 text-gray-400 text-[10px] font-black uppercase tracking-widest">
              <tr>
                <th className="px-6 py-4">Identificação</th>
                <th className="px-6 py-4">Localização</th>
                <th className="px-6 py-4 text-center">Capacidade</th>
                <th className="px-6 py-4 text-center">Preenchida</th>
                <th className="px-6 py-4">Tipo</th>
                <th className="px-6 py-4 text-center">Status</th>
                <th className="px-6 py-4 text-right">Ações</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-100">
              {filteredRooms.map((room) => (
                <tr key={room.id} className="hover:bg-gray-50/50 transition-colors group">
                  <td className="px-6 py-4 font-bold text-gray-700">{room.number}</td>
                  <td className="px-6 py-4 text-sm text-gray-500">
                    <div className="font-medium text-gray-700">{room.building}</div>
                    <div className="text-[10px] text-gray-400 uppercase tracking-tight">
                      {room.campus} • Bloco {room.block} • {room.floor}º Andar
                    </div>
                  </td>
                  <td className="px-6 py-4 text-center text-sm font-bold">{room.capacity}</td>
                  <td className="px-6 py-4 text-center text-sm font-bold text-indigo-600">
                    {occupancyMap[room.id] || 0}
                  </td>
                  <td className="px-6 py-4 text-xs font-black uppercase text-indigo-600">{room.type}</td>
                  <td className="px-6 py-4 text-center">
                    <span className={`px-2 py-1 rounded-full text-[10px] font-black uppercase ${room.isActive ? 'bg-emerald-50 text-emerald-600' : 'bg-gray-100 text-gray-400'}`}>
                      {room.isActive ? 'Ativa' : 'Inativa'}
                    </span>
                  </td>
                  <td className="px-6 py-4 text-right">
                    <div className="flex justify-end space-x-1">
                      <button onClick={() => handleOpenView(room)} className="p-2 text-indigo-500 hover:text-indigo-700 hover:bg-indigo-50 rounded-lg transition-all" title="Ver Detalhes"><Eye size={18} /></button>
                      <button onClick={() => handleOpenEdit(room)} className="p-2 text-amber-500 hover:text-amber-700 hover:bg-amber-50 rounded-lg transition-all" title="Editar"><Edit3 size={18} /></button>
                      <button onClick={() => handleDelete(room.id)} className="p-2 text-red-500 hover:text-red-700 hover:bg-red-50 rounded-lg transition-all" title="Excluir"><Trash2 size={18} /></button>
                    </div>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>

      {/* Modal de CRUD */}
      {isModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-gray-900/60 backdrop-blur-sm animate-in fade-in duration-300">
          <div className="bg-white w-full max-w-lg rounded-2xl shadow-2xl overflow-hidden animate-in zoom-in-95 duration-300">
            <div className={`p-6 border-b flex items-center justify-between text-white ${modalMode === 'view' ? 'bg-slate-800' : 'bg-indigo-600'}`}>
              <div className="flex items-center space-x-3">
                <Settings2 size={20} />
                <h3 className="text-lg font-bold">
                  {modalMode === 'create' ? 'Cadastrar Sala' : modalMode === 'edit' ? 'Editar Sala' : 'Detalhes da Sala'}
                </h3>
              </div>
              <button onClick={() => setIsModalOpen(false)} className="hover:bg-white/10 p-1 rounded transition-colors"><X size={24} /></button>
            </div>

            <form onSubmit={handleSave} className="p-8 space-y-4">
              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-1">
                  <label className="text-[10px] font-black text-gray-400 uppercase tracking-widest">Campus</label>
                  <input
                    disabled={modalMode === 'view'} required
                    type="text" className="w-full p-2.5 bg-gray-50 border rounded-xl outline-none focus:ring-2 focus:ring-indigo-500/20 disabled:opacity-60"
                    placeholder="Ex: Campus Central"
                    value={formData.campus} onChange={e => setFormData({ ...formData, campus: e.target.value })}
                  />
                </div>
                <div className="space-y-1">
                  <label className="text-[10px] font-black text-gray-400 uppercase tracking-widest">Prédio</label>
                  <input
                    disabled={modalMode === 'view'} required
                    type="text" className="w-full p-2.5 bg-gray-50 border rounded-xl outline-none focus:ring-2 focus:ring-indigo-500/20 disabled:opacity-60"
                    placeholder="Ex: Prédio de Engenharias"
                    value={formData.building} onChange={e => setFormData({ ...formData, building: e.target.value })}
                  />
                </div>
              </div>

              <div className="grid grid-cols-3 gap-4">
                <div className="space-y-1">
                  <label className="text-[10px] font-black text-gray-400 uppercase tracking-widest">Bloco</label>
                  <input
                    disabled={modalMode === 'view'} required
                    type="text" className="w-full p-2.5 bg-gray-50 border rounded-xl outline-none focus:ring-2 focus:ring-indigo-500/20 disabled:opacity-60"
                    placeholder="Ex: A"
                    value={formData.block} onChange={e => setFormData({ ...formData, block: e.target.value })}
                  />
                </div>
                <div className="space-y-1">
                  <label className="text-[10px] font-black text-gray-400 uppercase tracking-widest">Andar</label>
                  <input
                    disabled={modalMode === 'view'} required
                    type="number" className="w-full p-2.5 bg-gray-50 border rounded-xl outline-none focus:ring-2 focus:ring-indigo-500/20 disabled:opacity-60"
                    value={formData.floor} onChange={e => setFormData({ ...formData, floor: parseInt(e.target.value) || 0 })}
                  />
                </div>
                <div className="space-y-1">
                  <label className="text-[10px] font-black text-gray-400 uppercase tracking-widest">Número</label>
                  <input
                    disabled={modalMode === 'view'} required
                    type="text" className="w-full p-2.5 bg-gray-50 border rounded-xl outline-none focus:ring-2 focus:ring-indigo-500/20 disabled:opacity-60 font-bold"
                    placeholder="Ex: 101"
                    value={formData.number} onChange={e => setFormData({ ...formData, number: e.target.value })}
                  />
                </div>
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-1">
                  <label className="text-[10px] font-black text-gray-400 uppercase tracking-widest">Capacidade</label>
                  <input
                    disabled={modalMode === 'view'} required
                    type="number" className="w-full p-2.5 bg-gray-50 border rounded-xl outline-none focus:ring-2 focus:ring-indigo-500/20 disabled:opacity-60 font-bold"
                    value={formData.capacity} onChange={e => setFormData({ ...formData, capacity: parseInt(e.target.value) || 0 })}
                  />
                </div>
                <div className="space-y-1">
                  <label className="text-[10px] font-black text-gray-400 uppercase tracking-widest">Tipo</label>
                  <select
                    disabled={modalMode === 'view'}
                    className="w-full p-2.5 bg-gray-50 border rounded-xl outline-none focus:ring-2 focus:ring-indigo-500/20 disabled:opacity-60"
                    value={formData.type} onChange={e => setFormData({ ...formData, type: e.target.value as RoomType })}
                  >
                    {Object.values(RoomType).map(t => <option key={t} value={t}>{t}</option>)}
                  </select>
                </div>
              </div>

              {modalMode === 'view' ? (
                <div className="mt-6 p-4 bg-indigo-50 rounded-xl flex items-start space-x-3">
                  <Info className="text-indigo-500 shrink-0" size={20} />
                  <p className="text-xs text-indigo-700 leading-relaxed font-medium">
                    Esta sala está localizada no {formData.building}, Bloco {formData.block}, {formData.floor}º Andar.
                    Atualmente possui status {rooms.find(r => r.id === selectedRoom?.id)?.isActive ? 'Ativo' : 'Inativo'}.
                  </p>
                </div>
              ) : (
                <div className="pt-6 flex justify-end space-x-3">
                  <button type="button" onClick={() => setIsModalOpen(false)} className="px-6 py-2.5 text-sm font-bold text-gray-400 hover:text-gray-600">Cancelar</button>
                  <button type="submit" className="px-8 py-2.5 bg-indigo-600 text-white rounded-xl font-bold shadow-lg flex items-center space-x-2">
                    <Save size={18} />
                    <span>{modalMode === 'create' ? 'Criar Sala' : 'Salvar Alterações'}</span>
                  </button>
                </div>
              )}
            </form>
          </div>
        </div>
      )}
    </div>
  );
};

export default RoomsPage;
