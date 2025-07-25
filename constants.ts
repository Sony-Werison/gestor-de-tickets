import { Ticket, Categories, TicketStatus } from './types';

// Feriados a ser ignorados en los cálculos de días laborables
export const INITIAL_HOLIDAYS: string[] = [
    '2024-01-01', // Año Nuevo
    '2024-05-01', // Día del Trabajo
    '2024-12-25', // Navidad
    '2025-01-01', // Año Nuevo
    '2025-05-01', // Día del Trabajo
    '2025-12-25', // Navidad
];

export const INITIAL_TEAMS: string[] = ['Logan', 'Fluxooh'];

// Helper to get a date string X working days from today
const getWorkDayFromNow = (days: number): string => {
    let date = new Date();
    date.setHours(12, 0, 0, 0);
    let addedDays = 0;
    while(addedDays < days) {
        date.setDate(date.getDate() + 1);
        const dayOfWeek = date.getDay();
        // Note: This helper still uses the initial holidays for setup, which is fine
        // as the main app recalculates dates on load with dynamic holidays.
        if(dayOfWeek !== 0 && dayOfWeek !== 6 && !INITIAL_HOLIDAYS.includes(date.toISOString().split('T')[0])) {
            addedDays++;
        }
    }
    return date.toISOString().split('T')[0];
}


export const INITIAL_TICKETS: Ticket[] = [
    { id: 77, title: 'Herramienta Converta Ads', project: 'Logan', category: 'Proyecto Logan', status: TicketStatus.Ejecucion, startDate: new Date().toISOString().split('T')[0], duration: 3, isDependent: true, order: 0, completionDate: null },
    { id: 46, title: 'Valor demasiado alto de reach', project: 'Fluxooh', category: 'Error/Bug', status: TicketStatus.Ejecucion, startDate: new Date().toISOString().split('T')[0], duration: 2, isDependent: true, order: 1, completionDate: null },
    { id: 45, title: 'POI de Galería procesado con coordenada incorrecta', project: 'Fluxooh', category: 'Error/Bug', status: TicketStatus.Proximos, startDate: getWorkDayFromNow(2), duration: 4, isDependent: true, order: 2, completionDate: null },
    { id: 52, title: 'Incidente en Procesamiento de Altermark - POIs Formato Tembici', project: 'Fluxooh', category: 'Error/Bug', status: TicketStatus.Proximos, startDate: getWorkDayFromNow(6), duration: 3, isDependent: true, order: 3, completionDate: null },
    { id: 43, title: 'Datos faltantes de 2024 - Demo y Galería', project: 'Logan', category: 'Error/Bug', status: TicketStatus.Proximos, startDate: getWorkDayFromNow(3), duration: 2, isDependent: true, order: 4, completionDate: null },
    { id: 39, title: 'POIs faltantes Nissan', project: 'Logan', category: 'Error/Bug', status: TicketStatus.Proximos, startDate: getWorkDayFromNow(5), duration: 3, isDependent: true, order: 5, completionDate: null },
    { id: 120, title: 'No se muestran los POIs en búsqueda por AI', project: 'Fluxooh', category: 'Error/Bug', status: TicketStatus.Proximos, startDate: getWorkDayFromNow(9), duration: 2, isDependent: false, order: 6, completionDate: null },
    { id: 50, title: 'Proyecto Módulo de Campaña - Playout Havas', project: 'Logan', category: 'Proyecto Logan', status: TicketStatus.Proximos, startDate: getWorkDayFromNow(8), duration: 5, isDependent: true, order: 7, completionDate: null },
    { id: 44, title: 'Ajustes Fluxooh Mastercard', project: 'Fluxooh', category: 'Desarrollo', status: TicketStatus.Proximos, startDate: getWorkDayFromNow(9), duration: 3, isDependent: true, order: 8, completionDate: null },
];


export const INITIAL_CATEGORIES: Categories = {
    'Error/Bug': { color: '#422224' },
    'Desarrollo': { color: '#203442' },
    'Proyecto Logan': { color: '#3a284c' }
};

export const STATUS_TITLES: Record<TicketStatus, string> = {
    [TicketStatus.Proximos]: 'Próximos Tickets',
    [TicketStatus.Ejecucion]: 'En Ejecución',
    [TicketStatus.Terminado]: 'Completado en los últimos 7 días',
};