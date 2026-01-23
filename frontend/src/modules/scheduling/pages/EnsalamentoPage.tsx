
import React, { useState, useEffect } from 'react';
import { api } from '@/services/api';
import {
  Calendar,
  Play,
  Eye,
  Edit3,
  Trash2,
  X,
  Save,
  AlertCircle,
  Clock,
  MapPin,
  Info,
  CheckCircle2,
  XCircle,
  Clock3
} from 'lucide-react';
import { ConflictLevel } from '@/core/types';

interface Room {
  id: string;
  number: string;
  capacity: number;
  building?: string;
  block?: string;
  floor?: string;
  description?: string;
}

interface Proposal {
  id: string;
  class: string;
  room: string;
  roomId?: string; // ID da sala real
  conflict: ConflictLevel;
  time: string;
  day: string;
  students: number;
  roomCapacity?: number;
  status?: string;
  days_of_week?: number[];
  subjectName?: string;
  offeredMonth?: string;
}

const EnsalamentoPage: React.FC = () => {
  const [isProcessing, setIsProcessing] = useState(false);
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [modalMode, setModalMode] = useState<'edit' | 'view'>('view');
  const [selectedProposal, setSelectedProposal] = useState<Proposal | null>(null);

  const [proposals, setProposals] = useState<Proposal[]>([]);
  const [rooms, setRooms] = useState<Room[]>([]); // Lista de salas disponíveis

  // Buscar salas disponíveis para o select
  useEffect(() => {
    const loadRooms = async () => {
      try {
        const data = await api.get('/rooms/');
        setRooms(data.filter((r: any) => r.is_active));
      } catch (error) {
        console.error("Erro ao carregar salas:", error);
      }
    };
    loadRooms();
  }, []);

  const roomOccupancy = React.useMemo(() => {
    const occupancy: Record<string, number> = {};
    proposals.forEach(p => {
      if (p.roomId) {
        occupancy[p.roomId] = (occupancy[p.roomId] || 0) + p.students;
      }
    });
    return occupancy;
  }, [proposals]);

  const fetchProposals = async () => {
    try {
      const data = await api.get('/schedules/');
      // 1. Calcular ocupação TOTAL de cada sala ANTES de mapear
      const usageMap: Record<string, number> = {};
      data.forEach((s: any) => {
        if (s.room?.id) {
          usageMap[s.room.id] = (usageMap[s.room.id] || 0) + (s.school_class?.students_count || 0);
        }
      });

      setProposals(data.map((s: any) => {
        const roomCapacity = s.room?.capacity || 0;
        const classStudents = s.school_class?.students_count || 0;
        const totalRoomUsage = s.room?.id ? usageMap[s.room.id] : classStudents;

        // Determinar nível de conflito baseado na capacidade TOTAL da sala (considerando compartilhamento)
        let conflictLevel = ConflictLevel.LOW;

        // Se a sala estiver superlotada no total, TODAS as turmas nela devem alertar (ou só as que "causaram"? O usuário pediu "a turma com menos alunos"?)
        // O usuário pediu: "sempre que estourar a quantidade de vagas a turma com menos alunos deve apresentar alerta de conflito"
        // Isso é complexo de filtrar "só a menor" aqui no map individual. 
        // Vamos marcar CRITICAL se estourar. Depois podemos refinar visualmente.
        // Mas para atender "a turma com menos alunos deve apresentar alerta", podemos checar se sou a menor da sala?

        const isOverbooked = totalRoomUsage > roomCapacity;

        if (isOverbooked) {
          // Encontrar a menor turma desta sala
          const classesInRoom = data.filter((d: any) => d.room?.id === s.room?.id);
          const minStudents = Math.min(...classesInRoom.map((d: any) => d.school_class?.students_count || 0));

          // Se eu sou a turma com menos alunos (ou empatada), eu mostro o conflito
          if (classStudents === minStudents) {
            conflictLevel = ConflictLevel.CRITICAL;
          } else {
            // As outras ficam OK ou com alerta menor? O usuário disse "a turma com menos alunos deve apresentar alerta".
            // Implica que as outras NÃO devem? Ou todas devem, mas a menor é prioritária?
            // "obs sempre que estourar a quantidade de vagas a turma com menos alunos deve apresentar alerta de conflito."
            // Vou deixar CRITICAL só para a menor. As outras ficam MEDIUM para indicar "Atenção, sala cheia".
            conflictLevel = ConflictLevel.MEDIUM;
          }
        } else if (totalRoomUsage > roomCapacity * 0.9) {
          conflictLevel = ConflictLevel.MEDIUM;
        }

        // Mapear array de dias para nomes
        const dayNames = ['DOM', 'SEG', 'TER', 'QUA', 'QUI', 'SEX', 'SAB'];
        const daysOfWeek = s.days_of_week || [];
        const dayString = daysOfWeek.map((d: number) => dayNames[d]).join(', ');

        return {
          id: s.id,
          class: s.school_class?.name || 'Turma s/ nome',
          room: s.room?.number || 'S/ sala',
          roomId: s.room?.id,
          conflict: conflictLevel,
          time: s.start_time,
          day: dayString,
          students: classStudents,
          roomCapacity: roomCapacity,
          status: s.status || 'pending',
          days_of_week: daysOfWeek,
          subjectName: s.school_class?.subject?.name,
          offeredMonth: s.school_class?.subject?.offered_month
        };
      }));
    } catch (error) {
      console.error("Erro ao buscar ensalamento:", error);
    }
  };

  useEffect(() => {
    fetchProposals();
  }, []);

  // Form State para Edição
  const [formData, setFormData] = useState({ roomId: '', time: '', days: [] as number[] });

  const handleStartProcess = async () => {
    setIsProcessing(true);
    try {
      await api.post('/schedules/auto-generate', {});
      await fetchProposals();
    } catch (error) {
      alert("Erro ao processar ensalamento.");
    } finally {
      setIsProcessing(false);
    }
  };

  const handleOpenModal = (mode: 'edit' | 'view', proposal: Proposal) => {
    setModalMode(mode);
    setSelectedProposal(proposal);
    setFormData({
      roomId: proposal.roomId || '',
      time: proposal.time,
      days: proposal.days_of_week || []
    });
    setIsModalOpen(true);
  };

  // Atalho de teclado para fechar modal com Esc
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === 'Escape' && isModalOpen) {
        setIsModalOpen(false);
      }
    };
    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [isModalOpen]);

  const handleRemoveProposal = async (id: string) => {
    if (window.confirm("Deseja remover esta proposta de alocação?")) {
      try {
        await api.delete(`/schedules/${id}`);
        await fetchProposals();
      } catch (error) {
        alert("Erro ao remover alocação.");
      }
    }
  };

  const handleValidate = async (id: string, status: 'approved' | 'rejected') => {
    try {
      await api.post(`/schedules/${id}/validate?status=${status}`, {});
      await fetchProposals();
    } catch (error) {
      console.error('Erro ao validar:', error);
      alert("Erro ao validar alocação.");
    }
  };

  const handleSaveAdjustment = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!selectedProposal) return;

    try {
      // 1. Encontrar a sala selecionada para pegar o nome
      const selectedRoom = rooms.find(r => r.id === formData.roomId);
      if (!selectedRoom) return;

      // 2. Chamar API para atualizar
      await api.put(`/schedules/${selectedProposal.id}`, {
        room_id: formData.roomId,
        start_time: formData.time,
        days_of_week: formData.days
      });

      // 3. Recarregar lista completa para atualizar capacidades e conflitos
      await fetchProposals();

      setIsModalOpen(false);
      alert("Alocação atualizada com sucesso!");
    } catch (error) {
      console.error("Erro ao salvar ajuste:", error);
      alert("Erro ao salvar alterações.");
    }
  };

  const toggleDay = (dayIndex: number) => {
    setFormData(prev => {
      const currentDays = prev.days;
      if (currentDays.includes(dayIndex)) {
        return { ...prev, days: currentDays.filter(d => d !== dayIndex) };
      } else {
        return { ...prev, days: [...currentDays, dayIndex].sort() };
      }
    });
  };

  return (
    <div className="space-y-6 animate-in fade-in duration-700">
      {/* Header de Ação Principal */}
      <div className="bg-indigo-600 p-8 rounded-2xl text-white shadow-lg flex flex-col md:flex-row items-center justify-between gap-6 border border-indigo-500">
        <div className="flex items-center space-x-5">
          <div className="p-3 bg-white/10 rounded-xl">
            <Calendar size={32} />
          </div>
          <div>
            <h2 className="text-2xl font-bold mb-1">Ensalamento Semestral</h2>
            <p className="text-indigo-100 text-sm opacity-90">Execute o algoritmo de alocação ou realize ajustes manuais na grade.</p>
          </div>
        </div>
        <button
          onClick={handleStartProcess}
          disabled={isProcessing}
          className="w-full md:w-auto px-8 py-4 bg-white text-indigo-600 rounded-xl font-bold flex items-center justify-center space-x-3 shadow-xl hover:bg-indigo-50 active:scale-95 transition-all disabled:opacity-50"
        >
          {isProcessing ? (
            <div className="w-5 h-5 border-2 border-indigo-600 border-t-transparent rounded-full animate-spin" />
          ) : (
            <Play size={20} className="fill-current" />
          )}
          <span>{isProcessing ? 'Calculando Otimização...' : 'Gerar Proposta Automática'}</span>
        </button>
      </div>

      {/* Lista de Propostas */}
      <div className="bg-white rounded-2xl border border-gray-200 shadow-sm overflow-hidden">
        <div className="p-6 border-b border-gray-100 flex items-center justify-between">
          <h3 className="text-lg font-bold text-gray-800">Propostas de Alocação</h3>
          <span className="px-3 py-1 bg-gray-100 text-gray-500 text-xs font-bold rounded-full">
            {proposals.length} Turmas Processadas
          </span>
        </div>

        <div className="divide-y divide-gray-50">
          {proposals.length > 0 ? proposals.map((item) => (
            <div
              key={item.id}
              tabIndex={0}
              onKeyDown={(e) => {
                if (e.key === 'Enter') handleOpenModal('view', item);
              }}
              className="flex flex-col sm:flex-row sm:items-center p-5 hover:bg-gray-50/50 outline-none focus:bg-indigo-50 transition-all group gap-4"
            >
              <div className={`w-12 h-12 rounded-xl flex items-center justify-center shrink-0 ${item.conflict === ConflictLevel.CRITICAL ? 'bg-red-100 text-red-600' :
                item.conflict === ConflictLevel.MEDIUM ? 'bg-amber-100 text-amber-600' : 'bg-emerald-100 text-emerald-600'
                }`}>
                {item.conflict === ConflictLevel.CRITICAL ? <AlertCircle size={24} /> : <Calendar size={24} />}
              </div>

              <div className="flex-1 min-w-0">
                <div className="flex items-center space-x-2">
                  <h4 className="font-bold text-gray-800 truncate">{item.class}</h4>
                  {item.subjectName ? (
                    <span className="hidden sm:inline-block ml-2 text-[10px] font-bold text-indigo-600 bg-indigo-50 px-2 py-0.5 rounded uppercase border border-indigo-100/50">
                      {item.subjectName} • {item.offeredMonth}
                    </span>
                  ) : (
                    <span className="hidden sm:inline-block ml-2 text-[10px] font-bold text-gray-400 bg-gray-50 px-2 py-0.5 rounded uppercase border border-gray-200">
                      Sem Disciplina
                    </span>
                  )}
                  <span className={`text-[10px] font-black uppercase px-2 py-0.5 rounded ${item.conflict === ConflictLevel.CRITICAL ? 'bg-red-50 text-red-700' : 'bg-emerald-50 text-emerald-700'
                    }`}>
                    {item.conflict === ConflictLevel.CRITICAL ? 'Conflito Crítico' : 'Alocação OK'}
                  </span>
                </div>
                <div className="flex flex-wrap gap-y-1 gap-x-4 mt-1 text-xs text-gray-500 font-medium">
                  <span className="flex items-center"><MapPin size={14} className="mr-1" /> Sala {item.room}</span>
                  <span className="flex items-center"><Clock size={14} className="mr-1" /> {item.day}, {item.time}</span>
                  <span className={`flex items-center font-bold ${item.conflict === ConflictLevel.CRITICAL ? 'text-red-600' : 'text-indigo-600'}`}>
                    {item.students} Alunos {item.roomCapacity && `/ ${item.roomCapacity} Vagas`}
                  </span>
                </div>
              </div>

              <div className="flex items-center justify-end space-x-2">
                {item.status === 'pending' && (
                  <>
                    <button
                      onClick={() => handleValidate(item.id, 'approved')}
                      className="p-2.5 text-emerald-600 hover:bg-emerald-50 rounded-xl transition-all"
                      title="Aprovar Alocação"
                    >
                      <CheckCircle2 size={20} />
                    </button>
                    <button
                      onClick={() => handleValidate(item.id, 'rejected')}
                      className="p-2.5 text-red-500 hover:bg-red-50 rounded-xl transition-all"
                      title="Rejeitar Alocação"
                    >
                      <XCircle size={20} />
                    </button>
                  </>
                )}

                {item.status === 'approved' && (
                  <div className="flex items-center px-3 py-1.5 bg-emerald-100 text-emerald-700 rounded-lg text-xs font-bold gap-1">
                    <CheckCircle2 size={14} />
                    <span>APROVADO</span>
                  </div>
                )}

                {item.status === 'rejected' && (
                  <div className="flex items-center px-3 py-1.5 bg-red-100 text-red-700 rounded-lg text-xs font-bold gap-1">
                    <XCircle size={14} />
                    <span>REJEITADO</span>
                  </div>
                )}

                <div className="w-px h-6 bg-gray-200 mx-2"></div>

                <button
                  onClick={() => handleOpenModal('view', item)}
                  className="p-2.5 text-indigo-500 hover:bg-indigo-50 rounded-xl transition-all"
                  title="Ver Detalhes"
                >
                  <Eye size={20} />
                </button>

                {item.status !== 'approved' && (
                  <button
                    onClick={() => handleOpenModal('edit', item)}
                    className="p-2.5 text-amber-500 hover:bg-amber-50 rounded-xl transition-all"
                    title="Ajuste Manual"
                  >
                    <Edit3 size={20} />
                  </button>
                )}

                <button
                  onClick={() => handleRemoveProposal(item.id)}
                  className="p-2.5 text-gray-400 hover:bg-red-50 hover:text-red-600 rounded-xl transition-all"
                  title="Excluir"
                >
                  <Trash2 size={20} />
                </button>
              </div>
            </div>
          )) : (
            <div className="p-20 text-center">
              <div className="w-16 h-16 bg-gray-50 rounded-full flex items-center justify-center mx-auto mb-4">
                <Calendar className="text-gray-300" size={32} />
              </div>
              <p className="text-gray-400 font-medium">Nenhuma proposta gerada. Inicie o processamento automático.</p>
            </div>
          )}
        </div>
      </div>

      {/* Modal de Detalhes / Edição */}
      {isModalOpen && selectedProposal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-gray-900/60 backdrop-blur-sm animate-in fade-in duration-300">
          <div className="bg-white w-full max-w-lg rounded-2xl shadow-2xl overflow-hidden animate-in zoom-in-95 duration-300">
            <div className={`p-6 border-b flex items-center justify-between text-white ${modalMode === 'view' ? 'bg-slate-800' : 'bg-amber-500'}`}>
              <div className="flex items-center space-x-3">
                <Calendar size={20} />
                <h3 className="text-lg font-bold">
                  {modalMode === 'view' ? 'Detalhes do Ensalamento' : 'Ajuste de Alocação'}
                </h3>
              </div>
              <button onClick={() => setIsModalOpen(false)} className="hover:bg-white/10 p-1 rounded transition-colors">
                <X size={24} />
              </button>
            </div>

            <form onSubmit={handleSaveAdjustment} className="p-8 space-y-6">
              <div className="p-4 bg-gray-50 rounded-xl border border-gray-100">
                <p className="text-[10px] font-black text-gray-400 uppercase tracking-widest mb-1">Turma Selecionada</p>
                <p className="font-bold text-gray-800">{selectedProposal.class}</p>
                <p className="text-xs text-gray-500 mt-1">{selectedProposal.students} alunos matriculados</p>
              </div>

              <div className="space-y-4">
                <div className="grid grid-cols-2 gap-4">
                  <div className="space-y-1">
                    <label className="text-[10px] font-black text-gray-400 uppercase tracking-widest">Sala Alocada</label>
                    <select
                      disabled={modalMode === 'view'} required
                      className="w-full p-3 bg-gray-50 border border-gray-200 rounded-xl outline-none focus:ring-2 focus:ring-indigo-500/20 disabled:opacity-60 font-bold"
                      value={formData.roomId}
                      onChange={e => setFormData({ ...formData, roomId: e.target.value })}
                    >
                      <option value="">Selecione uma sala...</option>
                      {rooms.filter(room => {
                        const usedAcc = roomOccupancy[room.id] || 0;
                        // Mostrar se:
                        // 1. É a sala já selecionada (para não sumir)
                        // 2. Tem vagas sobrando (Capacidade > Ocupação)
                        const isCurrent = room.id === formData.roomId;
                        return isCurrent || (room.capacity > usedAcc);
                      }).map(room => {
                        const used = roomOccupancy[room.id] || 0;
                        const remaining = room.capacity - used;
                        const displayText = room.id === formData.roomId
                          ? `${room.number} (Atual)`
                          : `${room.number} (${remaining} vagas livres)`;

                        return (
                          <option key={room.id} value={room.id}>
                            {displayText} - {room.building}
                          </option>
                        );
                      })}
                    </select>
                  </div>
                  <div className="space-y-1">
                    <label className="text-[10px] font-black text-gray-400 uppercase tracking-widest">Dias da Semana</label>
                    <div className="flex flex-wrap gap-2">
                      {['SEG', 'TER', 'QUA', 'QUI', 'SEX', 'SAB'].map((day, index) => {
                        const dayValue = index + 1; // 1=SEG, 2=TER...
                        const isSelected = formData.days.includes(dayValue);

                        return (
                          <button
                            key={day}
                            type="button"
                            disabled={modalMode === 'view'}
                            onClick={() => toggleDay(dayValue)}
                            className={`px-3 py-2 rounded-lg text-xs font-bold transition-all ${isSelected
                              ? 'bg-indigo-600 text-white shadow-md scale-105'
                              : 'bg-gray-100 text-gray-500 hover:bg-gray-200'
                              } ${modalMode === 'view' ? 'opacity-50 cursor-not-allowed' : ''}`}
                          >
                            {day}
                          </button>
                        );
                      })}
                    </div>
                  </div>
                </div>

                <div className="space-y-1">
                  <label className="text-[10px] font-black text-gray-400 uppercase tracking-widest">Horário de Início</label>
                  <input
                    type="time" disabled={modalMode === 'view'} required
                    min="19:00" max="22:00"
                    className="w-full p-3 bg-gray-50 border border-gray-200 rounded-xl outline-none focus:ring-2 focus:ring-indigo-500/20 disabled:opacity-60"
                    value={formData.time} onChange={e => setFormData({ ...formData, time: e.target.value })}
                  />
                  <p className="text-[10px] text-gray-400 italic">Turno noturno: 19h às 22h</p>
                </div>
              </div>

              {modalMode === 'view' ? (
                <div className="p-4 bg-indigo-50 rounded-xl flex items-start space-x-3 border border-indigo-100">
                  <Info className="text-indigo-500 shrink-0" size={20} />
                  <div className="text-xs text-indigo-700 leading-relaxed">
                    <p className="font-bold mb-1">Análise de Conflitos:</p>
                    {selectedProposal.conflict === ConflictLevel.CRITICAL ? (
                      <p className="text-red-600 font-bold">
                        ⚠️ Atenção: A sala {selectedProposal.room} tem capacidade para {selectedProposal.roomCapacity} alunos,
                        mas a turma possui {selectedProposal.students} alunos matriculados.
                        <span className="block mt-1">Excedente: {selectedProposal.students - (selectedProposal.roomCapacity || 0)} alunos</span>
                      </p>
                    ) : selectedProposal.conflict === ConflictLevel.MEDIUM ? (
                      <p className="text-amber-600 font-bold">
                        ⚡ Aviso: Sala próxima da capacidade máxima ({selectedProposal.students}/{selectedProposal.roomCapacity} alunos).
                      </p>
                    ) : (
                      <p>✅ Esta alocação respeita a capacidade da sala ({selectedProposal.students}/{selectedProposal.roomCapacity} alunos).</p>
                    )}
                  </div>
                </div>
              ) : (
                <div className="pt-4 flex flex-col space-y-3">
                  <button type="submit" className="w-full py-3 bg-indigo-600 text-white rounded-xl font-bold shadow-lg flex items-center justify-center space-x-2 active:scale-95 transition-all">
                    <Save size={18} />
                    <span>Confirmar Ajuste Manual</span>
                  </button>
                  <button type="button" onClick={() => setIsModalOpen(false)} className="w-full py-3 text-sm font-bold text-gray-400 hover:text-gray-600 transition-colors">
                    Cancelar
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

export default EnsalamentoPage;
