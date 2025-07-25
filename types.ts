export enum TicketStatus {
  Proximos = 'proximos',
  Ejecucion = 'ejecucion',
  Terminado = 'terminado',
}

export type ProjectType = string;

export interface Ticket {
  id: number;
  title: string;
  project: ProjectType;
  category: string;
  status: TicketStatus;
  startDate: string;
  duration: number; // in working days
  isDependent: boolean;
  order: number;
  completionDate: string | null;
}

export interface Category {
  color: string;
}

export type Categories = Record<string, Category>;

export type View = 'status' | 'category' | 'timeline' | 'project';