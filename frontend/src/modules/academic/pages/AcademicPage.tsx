
import React, { useState, useMemo, useEffect } from 'react';
import { api } from '@/services/api';
import {
  Plus,
  Search,
  Edit3,
  Trash2,
  Eye,
  Settings,
  GraduationCap,
  X,
  Save,
  Info,
  Users,
  BookOpen,
  Calendar,
  Check,
  CheckCircle2
} from 'lucide-react';
import { AssignmentStatus, RoomType } from '@/core/types';

type Tab = 'courses' | 'subjects' | 'classes';

interface ClassData {
  id: string;
  code: string;
  subject: string;
  subjectId?: string;
  course: string;
  students: number;
  shift: string;
  status: AssignmentStatus;
}

interface CourseData {
  id: string;
  name: string;
  code: string;
  status: string;
}

interface SubjectData {
  id: string;
  code: string;
  name: string;
  workload: number;
  requiredRoomType: RoomType;
  requiresResources: boolean;
  status: 'Ativa' | 'Inativa';
  offeredMonth: string;
  courseIds: string[]; // Relacionamento N:N
}

const AcademicPage: React.FC = () => {
  const [activeTab, setActiveTab] = useState<Tab>('classes');
  const [searchTerm, setSearchTerm] = useState('');

  const [isModalOpen, setIsModalOpen] = useState(false);
  const [modalMode, setModalMode] = useState<'create' | 'edit' | 'view'>('create');
  const [selectedItem, setSelectedItem] = useState<any>(null);

  const months = [
    "Janeiro", "Fevereiro", "Março", "Abril", "Maio", "Junho",
    "Julho", "Agosto", "Setembro", "Outubro", "Novembro", "Dezembro"
  ];

  const [courses, setCourses] = useState<CourseData[]>([]);
  const [classes, setClasses] = useState<ClassData[]>([]);
  const [subjects, setSubjects] = useState<SubjectData[]>([]);

  const fetchAcademicData = async () => {
    try {
      const [coursesData, classesData, subjectsData] = await Promise.all([
        api.get('/courses/'),
        api.get('/classes/'),
        api.get('/subjects/')
      ]);

      setCourses(coursesData);
      setSubjects(subjectsData.map((s: any) => ({
        ...s,
        courseIds: s.course_ids || [],
        offeredMonth: s.offered_month,
        requiredRoomType: s.required_room_type
      })));

      // Mapeamento temporário das turmas do backend para o formato do frontend
      setClasses(classesData.map((c: any) => {
        const subject = subjectsData.find((s: any) => s.id === c.subject_id);
        return {
          id: c.id,
          code: c.name,
          subject: subject ? `${subject.name} (${subject.offered_month})` : 'Não Vinculada',
          subjectId: c.subject_id,
          course: coursesData.find((co: any) => co.id === c.course_id)?.name || 'N/A',
          students: c.students_count || 0,
          shift: c.shift,
          status: AssignmentStatus.ACTIVE
        };
      }));
    } catch (error) {
      console.error("Erro ao buscar dados acadêmicos:", error);
    }
  };

  useEffect(() => {
    fetchAcademicData();
  }, []);

  const [classForm, setClassForm] = useState<Omit<ClassData, 'id'>>({
    code: '', subject: '', subjectId: '', course: '', students: 0, shift: 'Manhã', status: AssignmentStatus.PLANNED
  });

  const [courseForm, setCourseForm] = useState<Omit<CourseData, 'id'>>({
    name: '', code: '', status: 'Ativo'
  });

  const [subjectForm, setSubjectForm] = useState<Omit<SubjectData, 'id'>>({
    code: '', name: '', workload: 0, requiredRoomType: RoomType.COMMON, requiresResources: false, status: 'Ativa', offeredMonth: 'Fevereiro', courseIds: []
  });

  const openModal = (mode: 'create' | 'edit' | 'view', item: any = null) => {
    setModalMode(mode);
    setSelectedItem(item);
    if (item) {
      if (activeTab === 'classes') setClassForm(item);
      else if (activeTab === 'courses') setCourseForm(item);
      else setSubjectForm(item);
    } else {
      if (activeTab === 'classes') setClassForm({ code: '', subject: '', subjectId: '', course: '', students: 0, shift: 'Manhã', status: AssignmentStatus.PLANNED });
      else if (activeTab === 'courses') setCourseForm({ name: '', code: '', status: 'Ativo' });
      else setSubjectForm({ code: '', name: '', workload: 0, requiredRoomType: RoomType.COMMON, requiresResources: false, status: 'Ativa', offeredMonth: 'Fevereiro', courseIds: [] });
    }
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

  const toggleCourseInSubject = (courseId: string) => {
    setSubjectForm(prev => {
      const isSelected = prev.courseIds.includes(courseId);
      if (isSelected) {
        return { ...prev, courseIds: prev.courseIds.filter(id => id !== courseId) };
      } else {
        return { ...prev, courseIds: [...prev.courseIds, courseId] };
      }
    });
  };

  const handleDelete = async (id: string) => {
    if (!window.confirm("Confirmar exclusão? Esta ação pode ser restrita se houver vínculos ativos.")) return;

    try {
      if (activeTab === 'classes') {
        await api.delete(`/classes/${id}`);
      } else if (activeTab === 'courses') {
        await api.delete(`/courses/${id}`);
      } else if (activeTab === 'subjects') {
        await api.delete(`/subjects/${id}`);
      }

      await fetchAcademicData(); // Recarregar dados após exclusão
    } catch (error) {
      alert("Erro ao excluir registro. Verifique se existem dependências.");
      console.error(error);
    }
  };

  const handleSave = async (e: React.FormEvent) => {
    e.preventDefault();

    try {
      if (activeTab === 'classes') {
        const payload = {
          name: classForm.code,
          shift: classForm.shift,
          semester: 1, // Default temporário
          students_count: classForm.students,
          course_id: courses.find(c => c.name === classForm.course)?.id || courses[0]?.id,
          subject_id: classForm.subjectId || null
        };

        if (modalMode === 'create') {
          await api.post('/classes/', payload);
        } else {
          await api.put(`/classes/${selectedItem.id}`, payload);
        }
      } else if (activeTab === 'courses') {
        if (modalMode === 'create') {
          await api.post('/courses/', courseForm);
        } else {
          await api.put(`/courses/${selectedItem.id}`, courseForm);
        }
      } else if (activeTab === 'subjects') {
        const payload = {
          code: subjectForm.code,
          name: subjectForm.name,
          workload: subjectForm.workload,
          required_room_type: subjectForm.requiredRoomType,
          offered_month: subjectForm.offeredMonth,
          course_ids: subjectForm.courseIds
        };

        if (modalMode === 'create') {
          await api.post('/subjects/', payload);
        } else {
          await api.put(`/subjects/${selectedItem.id}`, payload);
        }
      }

      await fetchAcademicData();
      setIsModalOpen(false);
    } catch (error: any) {
      alert(`Erro ao salvar dados: ${error.message}`);
      console.error(error);
    }
  };

  const filteredData = useMemo(() => {
    const term = searchTerm.toLowerCase();
    if (activeTab === 'classes') return classes.filter(c => c.code.toLowerCase().includes(term) || c.subject.toLowerCase().includes(term));
    if (activeTab === 'courses') return courses.filter(c => c.name.toLowerCase().includes(term) || c.code.toLowerCase().includes(term));
    return subjects.filter(s => s.name.toLowerCase().includes(term) || s.code.toLowerCase().includes(term));
  }, [activeTab, searchTerm, classes, courses, subjects]);

  return (
    <div className="space-y-6 animate-in fade-in duration-500">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h2 className="text-2xl font-bold text-gray-800">Gestão Acadêmica</h2>
          <p className="text-sm text-gray-500">Administre cursos, turmas e disciplinas com controle temporal e vínculos multi-curso.</p>
        </div>
        <button
          onClick={() => openModal('create')}
          className="flex items-center space-x-2 px-6 py-3 bg-indigo-600 text-white rounded-xl font-bold shadow-lg transition-all active:scale-95"
        >
          <Plus size={20} />
          <span>Nova {activeTab === 'classes' ? 'Turma' : activeTab === 'courses' ? 'Curso' : 'Disciplina'}</span>
        </button>
      </div>

      <div className="bg-white rounded-2xl border border-gray-200 shadow-sm overflow-hidden">
        <div className="flex border-b border-gray-100 bg-gray-50/50">
          <button onClick={() => setActiveTab('classes')} className={`px-6 py-4 font-bold text-sm border-b-2 transition-all flex items-center space-x-2 ${activeTab === 'classes' ? 'border-indigo-600 text-indigo-600 bg-white' : 'border-transparent text-gray-400 hover:text-gray-600'}`}>
            <Settings size={18} /><span>Turmas</span>
          </button>
          <button onClick={() => setActiveTab('subjects')} className={`px-6 py-4 font-bold text-sm border-b-2 transition-all flex items-center space-x-2 ${activeTab === 'subjects' ? 'border-indigo-600 text-indigo-600 bg-white' : 'border-transparent text-gray-400 hover:text-gray-600'}`}>
            <BookOpen size={18} /><span>Disciplinas</span>
          </button>
          <button onClick={() => setActiveTab('courses')} className={`px-6 py-4 font-bold text-sm border-b-2 transition-all flex items-center space-x-2 ${activeTab === 'courses' ? 'border-indigo-600 text-indigo-600 bg-white' : 'border-transparent text-gray-400 hover:text-gray-600'}`}>
            <GraduationCap size={18} /><span>Cursos</span>
          </button>
        </div>

        <div className="p-5 border-b border-gray-50">
          <div className="relative max-w-xs">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400" size={16} />
            <input
              type="text" placeholder="Filtrar registros..."
              className="w-full pl-9 pr-4 py-2 bg-gray-50 border border-gray-200 rounded-lg text-sm outline-none focus:ring-2 focus:ring-indigo-500/20"
              value={searchTerm} onChange={e => setSearchTerm(e.target.value)}
            />
          </div>
        </div>

        <div className="overflow-x-auto">
          <table className="w-full text-left">
            <thead className="bg-gray-50 text-[10px] font-black text-gray-400 uppercase tracking-widest">
              <tr>
                {activeTab === 'classes' && <><th className="px-6 py-4">Código / Curso</th><th className="px-6 py-4">Disciplina</th><th className="px-6 py-4 text-center">Alunos</th></>}
                {activeTab === 'subjects' && <><th className="px-6 py-4">Disciplina / Cursos</th><th className="px-6 py-4">Mês Oferta</th><th className="px-6 py-4">Carga H. / Tipo Sala</th></>}
                {activeTab === 'courses' && <><th className="px-6 py-4">Nome do Curso</th><th className="px-6 py-4">Sigla</th><th className="px-6 py-4">Status</th></>}
                <th className="px-6 py-4 text-right">Ações</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-100">
              {filteredData.map((item: any) => (
                <tr key={item.id} className="hover:bg-gray-50/50 transition-colors group">
                  {activeTab === 'classes' && (
                    <>
                      <td className="px-6 py-4 focus:bg-indigo-50 outline-none" tabIndex={0}><p className="font-bold text-gray-700">{item.code}</p><p className="text-[10px] text-gray-400 uppercase font-black">{item.course}</p></td>
                      <td className="px-6 py-4 text-sm font-medium text-gray-800 focus:bg-indigo-50 outline-none" tabIndex={0}>{item.subject}</td>
                      <td className="px-6 py-4 text-center focus:bg-indigo-50 outline-none" tabIndex={0}><span className="px-2 py-0.5 bg-indigo-50 text-indigo-700 rounded text-xs font-black">{item.students}</span></td>
                    </>
                  )}
                  {activeTab === 'subjects' && (
                    <>
                      <td className="px-6 py-4 focus:bg-indigo-50 outline-none" tabIndex={0}>
                        <p className="font-bold text-gray-700">{item.code}</p>
                        <p className="text-[11px] text-indigo-600 font-medium mb-1">{item.name}</p>
                        <div className="flex flex-wrap gap-1">
                          {item.courseIds.map((cId: string) => {
                            const course = courses.find(c => c.id === cId);
                            return course ? (
                              <span key={cId} className="px-1.5 py-0.5 bg-gray-100 text-gray-500 rounded text-[9px] font-bold">
                                {course.code}
                              </span>
                            ) : null;
                          })}
                        </div>
                      </td>
                      <td className="px-6 py-4 focus:bg-indigo-50 outline-none" tabIndex={0}><span className="px-2 py-1 bg-amber-50 text-amber-700 rounded text-[10px] font-black uppercase flex items-center w-fit"><Calendar size={12} className="mr-1" />{item.offeredMonth}</span></td>
                      <td className="px-6 py-4 focus:bg-indigo-50 outline-none" tabIndex={0}>
                        <div className="flex flex-col">
                          <span className="text-sm font-bold text-gray-600">{item.workload}h</span>
                          <span className="text-[9px] font-black uppercase text-gray-400">{item.requiredRoomType}</span>
                        </div>
                      </td>
                    </>
                  )}
                  {activeTab === 'courses' && (
                    <>
                      <td className="px-6 py-4 font-bold text-gray-700 focus:bg-indigo-50 outline-none" tabIndex={0}>{item.name}</td>
                      <td className="px-6 py-4 text-sm font-mono text-gray-500 focus:bg-indigo-50 outline-none" tabIndex={0}>{item.code}</td>
                      <td className="px-6 py-4 focus:bg-indigo-50 outline-none" tabIndex={0}>
                        <span className="px-2.5 py-1 bg-emerald-50 text-emerald-600 rounded-full text-[10px] font-black uppercase flex items-center w-fit">
                          <CheckCircle2 size={12} className="mr-1.5" />
                          {item.status || 'Ativo'}
                        </span>
                      </td>
                    </>
                  )}
                  <td className="px-6 py-4 text-right">
                    <div className="flex justify-end space-x-1 transition-opacity">
                      <button onClick={() => openModal('view', item)} className="p-2 text-indigo-500 hover:bg-indigo-50 rounded-lg transition-colors"><Eye size={18} /></button>
                      <button onClick={() => openModal('edit', item)} className="p-2 text-amber-500 hover:bg-amber-50 rounded-lg transition-colors"><Edit3 size={18} /></button>
                      <button onClick={() => handleDelete(item.id)} className="p-2 text-red-500 hover:bg-red-50 rounded-lg transition-colors"><Trash2 size={18} /></button>
                    </div>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>

      {isModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-gray-900/60 backdrop-blur-sm animate-in fade-in duration-300">
          <div className="bg-white w-full max-w-lg rounded-2xl shadow-2xl overflow-hidden animate-in zoom-in-95 duration-300 flex flex-col max-h-[90vh]">
            <div className={`p-6 border-b flex items-center justify-between text-white shrink-0 ${modalMode === 'view' ? 'bg-slate-800' : 'bg-indigo-600'}`}>
              <div className="flex items-center space-x-3">
                {activeTab === 'classes' ? <Users size={20} /> : activeTab === 'courses' ? <GraduationCap size={20} /> : <BookOpen size={20} />}
                <h3 className="text-lg font-bold">
                  {modalMode === 'create' ? 'Cadastrar' : modalMode === 'edit' ? 'Editar' : 'Visualizar'} {activeTab === 'classes' ? 'Turma' : activeTab === 'courses' ? 'Curso' : 'Disciplina'}
                </h3>
              </div>
              <button onClick={() => setIsModalOpen(false)} className="hover:bg-white/10 p-1 rounded transition-colors"><X size={24} /></button>
            </div>

            <form onSubmit={handleSave} className="p-8 space-y-4 overflow-y-auto">
              {activeTab === 'subjects' && (
                <>
                  <div className="grid grid-cols-2 gap-4">
                    <div className="space-y-1">
                      <label className="text-[10px] font-black text-gray-400 uppercase tracking-widest">Código</label>
                      <input disabled={modalMode === 'view'} required className="w-full p-2.5 bg-gray-50 border rounded-xl outline-none font-bold" value={subjectForm.code} onChange={e => setSubjectForm({ ...subjectForm, code: e.target.value })} />
                    </div>
                    <div className="space-y-1">
                      <label className="text-[10px] font-black text-gray-400 uppercase tracking-widest">Mês de Oferta</label>
                      <select disabled={modalMode === 'view'} className="w-full p-2.5 bg-gray-50 border rounded-xl outline-none" value={subjectForm.offeredMonth} onChange={e => setSubjectForm({ ...subjectForm, offeredMonth: e.target.value })}>
                        {months.map(m => <option key={m} value={m}>{m}</option>)}
                      </select>
                    </div>
                  </div>
                  <div className="space-y-1">
                    <label className="text-[10px] font-black text-gray-400 uppercase tracking-widest">Nome da Disciplina</label>
                    <input disabled={modalMode === 'view'} required className="w-full p-2.5 bg-gray-50 border rounded-xl outline-none" value={subjectForm.name} onChange={e => setSubjectForm({ ...subjectForm, name: e.target.value })} />
                  </div>

                  {/* RELACIONAMENTO N:N - CURSOS */}
                  <div className="space-y-2">
                    <label className="text-[10px] font-black text-gray-400 uppercase tracking-widest">Vincular a Cursos</label>
                    <div className={`grid grid-cols-2 gap-2 border p-3 rounded-xl bg-gray-50/50 ${subjectForm.courseIds.length === 0 ? 'border-amber-200 ring-2 ring-amber-50' : 'border-gray-200'}`}>
                      {courses.map(course => (
                        <button
                          key={course.id}
                          type="button"
                          disabled={modalMode === 'view'}
                          onClick={() => toggleCourseInSubject(course.id)}
                          className={`flex items-center justify-between p-2 rounded-lg text-xs font-bold transition-all border ${subjectForm.courseIds.includes(course.id)
                            ? 'bg-indigo-600 border-indigo-700 text-white shadow-sm'
                            : 'bg-white border-gray-200 text-gray-500 hover:border-indigo-300'
                            }`}
                        >
                          <span className="truncate mr-2">{course.name}</span>
                          {subjectForm.courseIds.includes(course.id) && <Check size={14} />}
                        </button>
                      ))}
                    </div>
                    {subjectForm.courseIds.length === 0 && modalMode !== 'view' && (
                      <p className="text-[10px] text-amber-600 font-bold italic">Selecione ao menos um curso para esta disciplina.</p>
                    )}
                  </div>

                  <div className="grid grid-cols-2 gap-4">
                    <div className="space-y-1">
                      <label className="text-[10px] font-black text-gray-400 uppercase tracking-widest">Tipo de Sala</label>
                      <select disabled={modalMode === 'view'} className="w-full p-2.5 bg-gray-50 border rounded-xl outline-none" value={subjectForm.requiredRoomType} onChange={e => setSubjectForm({ ...subjectForm, requiredRoomType: e.target.value as RoomType })}>
                        {Object.values(RoomType).map(t => <option key={t} value={t}>{t}</option>)}
                      </select>
                    </div>
                    <div className="space-y-1">
                      <label className="text-[10px] font-black text-gray-400 uppercase tracking-widest">Carga Horária</label>
                      <input type="number" disabled={modalMode === 'view'} required className="w-full p-2.5 bg-gray-50 border rounded-xl outline-none" value={subjectForm.workload} onChange={e => setSubjectForm({ ...subjectForm, workload: parseInt(e.target.value) || 0 })} />
                    </div>
                  </div>
                </>
              )}

              {activeTab === 'classes' && (
                <>
                  <div className="space-y-1">
                    <label className="text-[10px] font-black text-gray-400 uppercase tracking-widest">Código da Oferta</label>
                    <input disabled={modalMode === 'view'} required className="w-full p-2.5 bg-gray-50 border rounded-xl outline-none" value={classForm.code} onChange={e => setClassForm({ ...classForm, code: e.target.value })} />
                  </div>
                  <div className="grid grid-cols-2 gap-4">
                    <div className="space-y-1">
                      <label className="text-[10px] font-black text-gray-400 uppercase tracking-widest">Alunos</label>
                      <input type="number" disabled={modalMode === 'view'} required className="w-full p-2.5 bg-gray-50 border rounded-xl outline-none" value={classForm.students} onChange={e => setClassForm({ ...classForm, students: parseInt(e.target.value) || 0 })} />
                    </div>
                  </div>
                  <div className="space-y-1">
                    <label className="text-[10px] font-black text-gray-400 uppercase tracking-widest">Disciplina</label>
                    <select
                      disabled={modalMode === 'view'}
                      className="w-full p-2.5 bg-gray-50 border rounded-xl outline-none"
                      value={classForm.subjectId || ''}
                      onChange={e => setClassForm({ ...classForm, subjectId: e.target.value })}
                    >
                      <option value="">Selecione uma disciplina...</option>
                      {subjects.map(s => (
                        <option key={s.id} value={s.id}>{s.name} ({s.code}) - {s.offeredMonth}</option>
                      ))}
                    </select>
                  </div>
                  <div className="grid grid-cols-2 gap-4">
                    <div className="space-y-1">
                      <label className="text-[10px] font-black text-gray-400 uppercase tracking-widest">Turno</label>
                      <select disabled={modalMode === 'view'} className="w-full p-2.5 bg-gray-50 border rounded-xl outline-none" value={classForm.shift} onChange={e => setClassForm({ ...classForm, shift: e.target.value })}>
                        <option value="Manhã">Manhã</option><option value="Tarde">Tarde</option><option value="Noite">Noite</option>
                      </select>
                    </div>
                  </div>
                </>
              )}

              {activeTab === 'courses' && (
                <>
                  <div className="space-y-1">
                    <label className="text-[10px] font-black text-gray-400 uppercase tracking-widest">Nome do Curso</label>
                    <input disabled={modalMode === 'view'} required className="w-full p-2.5 bg-gray-50 border rounded-xl outline-none" value={courseForm.name} onChange={e => setCourseForm({ ...courseForm, name: e.target.value })} />
                  </div>
                  <div className="space-y-1">
                    <label className="text-[10px] font-black text-gray-400 uppercase tracking-widest">Sigla</label>
                    <input disabled={modalMode === 'view'} required className="w-full p-2.5 bg-gray-50 border rounded-xl outline-none font-mono uppercase" value={courseForm.code} onChange={e => setCourseForm({ ...courseForm, code: e.target.value })} />
                  </div>
                </>
              )}

              {modalMode === 'view' ? (
                <div className="mt-6 p-4 bg-indigo-50 rounded-xl flex items-start space-x-3 border border-indigo-100">
                  <Info className="text-indigo-500 shrink-0" size={20} />
                  <p className="text-xs text-indigo-700 leading-relaxed font-medium">
                    Os dados técnicos são essenciais para o planejamento de infraestrutura e alocação de salas para o próximo semestre.
                  </p>
                </div>
              ) : (
                <div className="pt-6 flex justify-end space-x-3 shrink-0">
                  <button type="button" onClick={() => setIsModalOpen(false)} className="px-6 py-2.5 text-sm font-bold text-gray-400 hover:text-gray-600">Cancelar</button>
                  <button type="submit" className="px-8 py-2.5 bg-indigo-600 text-white rounded-xl font-bold shadow-lg flex items-center space-x-2 active:scale-95 transition-all">
                    <Save size={18} /><span>Salvar Dados</span>
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

export default AcademicPage;
