
export enum RoomType {
  COMMON = 'Sala Comum',
  LABORATORY = 'Laboratório',
  AUDITORIUM = 'Auditório',
  MULTIMEDIA = 'Multimídia'
}

export enum AssignmentStatus {
  PLANNED = 'Planejada',
  ACTIVE = 'Ativa',
  CANCELLED = 'Cancelada'
}

export enum ConflictLevel {
  LOW = 'Baixo',
  MEDIUM = 'Médio',
  CRITICAL = 'Crítico'
}

export interface Resource {
  id: string;
  name: string;
}

export interface Room {
  id: string;
  campus: string;
  building: string;
  block: string;
  floor: number;
  number: string;
  capacity: number;
  type: RoomType;
  isActive: boolean;
  resources: Resource[];
}

export interface Teacher {
  id: string;
  name: string;
  registration: string;
  departments: string[];
}

export interface Class {
  id: string;
  course: string;
  subject: string;
  studentsCount: number;
  status: AssignmentStatus;
  teacherId: string;
  requiredRoomType: RoomType;
  requiredResources: string[];
}

export interface EnsalamentoEntry {
  id: string;
  classId: string;
  roomId: string;
  dayOfWeek: number; // 0-6
  startTime: string;
  endTime: string;
  justification?: string;
}

export interface AuditLog {
  id: string;
  timestamp: string;
  userId: string;
  userName: string;
  action: string;
  context: string;
  ip: string;
}
