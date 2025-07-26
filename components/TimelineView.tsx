

import React, { useMemo, useRef, useCallback, useState, useEffect } from 'react';
import { Ticket, Categories, ProjectType, TicketStatus } from '../types';

interface TimelineViewProps {
    tickets: Ticket[];
    categories: Categories;
    teams: ProjectType[];
    holidays: string[];
    onTicketUpdate: (ticket: Ticket) => void;
    onTimelineDragEnd: (updatedTickets: Ticket[]) => void;
    onOpenModal: (id: number) => void;
    onOpenSettings: () => void;
    allowTeamParallelism: boolean;
    prioritizeExecuting: boolean;
    avoidTimelineGaps: boolean;
    isViewOnly: boolean;
}

interface DragState {
    type: 'move' | 'resize';
    ticketId: number;
    initialX: number;
    initialY: number;
    initialScrollLeft: number;
    originalStartDate: Date;
    originalDuration: number;
    ghostX: number;
    ghostY: number;
}

const ROW_HEIGHT = 32;
const HEADER_HEIGHT = (ROW_HEIGHT * 2) + 1;
const DEFAULT_DAY_WIDTH = 40;
const TEAM_HEADER_HEIGHT = 40;

const ExecutingSeal = () => (
    <div className="relative flex h-3 w-3" title="En Ejecución">
        <div className="animate-ping absolute inline-flex h-full w-full rounded-full bg-green-400 opacity-75"></div>
        <div className="relative inline-flex rounded-full h-3 w-3 bg-green-500"></div>
    </div>
);

const SettingsIcon = () => (
    <svg xmlns="http://www.w3.org/2000/svg" className="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
        <path strokeLinecap="round" strokeLinejoin="round" d="M10.325 4.317c.426-1.756 2.924-1.756 3.35 0a1.724 1.724 0 002.573 1.066c1.543-.94 3.31.826 2.37 2.37a1.724 1.724 0 001.065 2.572c1.756.426 1.756 2.924 0 3.35a1.724 1.724 0 00-1.066 2.573c.94 1.543-.826 3.31-2.37 2.37a1.724 1.724 0 00-2.572 1.065c-.426 1.756-2.924 1.756-3.35 0a1.724 1.724 0 00-2.573-1.066c-1.543.94-3.31-.826-2.37-2.37a1.724 1.724 0 00-1.065-2.572c-1.756-.426-1.756-2.924 0-3.35a1.724 1.724 0 001.066-2.573c-.94-1.543.826-3.31 2.37-2.37.996.608 2.296.07 2.572-1.065z" />
        <path strokeLinecap="round" strokeLinejoin="round" d="M15 12a3 3 0 11-6 0 3 3 0 016 0z" />
    </svg>
);


const TimelineView: React.FC<TimelineViewProps> = ({ 
    tickets = [], 
    categories = {}, 
    teams = [], 
    holidays = [], 
    onTicketUpdate = () => {}, 
    onTimelineDragEnd = () => {},
    onOpenModal = () => {}, 
    onOpenSettings,
    allowTeamParallelism, 
    prioritizeExecuting,
    avoidTimelineGaps,
    isViewOnly,
}) => {
    const containerRef = useRef<HTMLDivElement>(null);
    const [dragState, setDragState] = useState<DragState | null>(null);
    const [dayWidth, setDayWidth] = useState(DEFAULT_DAY_WIDTH);

    const holidaySet = useMemo(() => new Set(holidays), [holidays]);
    const isHoliday = useCallback((date: Date) => holidaySet.has(date.toISOString().split('T')[0]), [holidaySet]);

    const isWorkDay = useCallback((date: Date) => {
        const dayOfWeek = date.getDay();
        return dayOfWeek !== 0 && dayOfWeek !== 6 && !isHoliday(date);
    }, [isHoliday]);
    
    const findNextWorkDay = useCallback((date: Date): Date => {
        let nextDate = new Date(date.getTime());
        nextDate.setDate(nextDate.getDate() + 1);
        while (!isWorkDay(nextDate)) {
            nextDate.setDate(nextDate.getDate() + 1);
        }
        return nextDate;
    }, [isWorkDay]);

    const getEndDate = useCallback((startDate: Date, duration: number): Date => {
        let effectiveStartDate = new Date(startDate);
         while (!isWorkDay(effectiveStartDate)) {
            effectiveStartDate.setDate(effectiveStartDate.getDate() + 1);
        }
        if (duration <= 1) return effectiveStartDate;
        
        let endDate = new Date(effectiveStartDate);
        let workDaysFound = 1;

        while (workDaysFound < duration) {
            endDate.setDate(endDate.getDate() + 1);
            if (isWorkDay(endDate)) {
                workDaysFound++;
            }
        }
        return endDate;
    }, [isWorkDay]);

    const countWorkDays = useCallback((start: Date, end: Date): number => {
        let count = 0;
        if (end < start) return 1;
        const current = new Date(start.getTime());
        while (current.getTime() <= end.getTime()) {
            if (isWorkDay(current)) count++;
            current.setDate(current.getDate() + 1);
        }
        return Math.max(1, count);
    }, [isWorkDay]);

    const countCalendarDays = (start: Date, end: Date): number => {
        if (end < start) return 0;
        const diffTime = end.getTime() - start.getTime();
        return Math.round(diffTime / (1000 * 60 * 60 * 24)) + 1;
    };

    const today = useMemo(() => {
        const d = new Date();
        d.setHours(12, 0, 0, 0);
        return d;
    }, []);

    const sortedTickets = useMemo(() => [...tickets].sort((a, b) => a.order - b.order), [tickets]);

    const ticketsByTeam = useMemo(() => {
        const grouped: Record<string, Ticket[]> = {};
        teams.forEach(team => grouped[team] = []);
        sortedTickets.forEach(ticket => {
            if (grouped[ticket.project]) {
                grouped[ticket.project].push(ticket);
            }
        });
        return grouped;
    }, [sortedTickets, teams]);
    
    const { dateToColumnMap, totalDays, months, headerDays } = useMemo(() => {
        if (tickets.length === 0) return { dateToColumnMap: new Map(), totalDays: 0, months: [], headerDays: [] };
        
        const allTicketDates = tickets.map(t => new Date(t.startDate));
        allTicketDates.push(today);

        const timelineStart = new Date(Math.min(...allTicketDates.map(d => d.getTime())));
        timelineStart.setHours(12, 0, 0, 0);

        const latestEndDate = tickets.reduce((latest, ticket) => {
            const end = getEndDate(new Date(ticket.startDate), ticket.duration);
            return end > latest ? end : latest;
        }, new Date('1970-01-01'));
        
        const timelineEndCandidate = new Date();
        timelineEndCandidate.setDate(timelineEndCandidate.getDate() + 90);
        
        const extendedEndDate = new Date(latestEndDate.getTime());
        extendedEndDate.setDate(extendedEndDate.getDate() + 30);

        const timelineEnd = new Date(Math.max(extendedEndDate.getTime(), timelineEndCandidate.getTime()));
        timelineEnd.setHours(12, 0, 0, 0);

        const dateMap = new Map<string, number>();
        const monthData: { name: string; start: number; span: number }[] = [];
        const dayHeaderData: { label: string; column: number; isNonWorkDay: boolean, isoDate: string }[] = [];
        let currentDay = new Date(timelineStart.getTime());
        let dayCount = 0;
        let lastMonth = -1;

        while (currentDay <= timelineEnd) {
            dayCount++;
            const isoDate = currentDay.toISOString().split('T')[0];
            dateMap.set(isoDate, dayCount);
            dayHeaderData.push({ label: currentDay.getDate().toString(), column: dayCount, isNonWorkDay: !isWorkDay(currentDay), isoDate });
            
            const currentMonth = currentDay.getMonth();
            if (currentMonth !== lastMonth) {
                if (monthData.length > 0) {
                    const lastMonthData = monthData[monthData.length-1];
                    lastMonthData.span = dayCount - lastMonthData.start;
                }
                lastMonth = currentMonth;
                let monthName = currentDay.toLocaleString('es-ES', { month: 'long' });
                monthName = monthName.charAt(0).toUpperCase() + monthName.slice(1);
                monthData.push({ name: monthName, start: dayCount, span: 1 });
            }
            currentDay.setDate(currentDay.getDate() + 1);
        }
        if (monthData.length > 0) {
            const lastMonthData = monthData[monthData.length - 1];
            lastMonthData.span = dayCount - lastMonthData.start + 1;
        }

        return { dateToColumnMap: dateMap, totalDays: dayCount, months: monthData, headerDays: dayHeaderData };
    }, [tickets, today, getEndDate, isWorkDay]);
    
    useEffect(() => {
        if (containerRef.current && !dragState) {
            const todayCol = dateToColumnMap.get(today.toISOString().split('T')[0]);
            if(todayCol) {
                 containerRef.current.scrollLeft = Math.max(0, (todayCol - 5) * dayWidth);
            } else {
                 containerRef.current.scrollLeft = 0;
            }
        }
    }, [dayWidth, dateToColumnMap, today, allowTeamParallelism, dragState]);
    
    const { sequentialRenderData, sequentialTotalLanes } = useMemo(() => {
        if (allowTeamParallelism || sortedTickets.length === 0) {
            return { sequentialRenderData: [], sequentialTotalLanes: 0 };
        }

        const renderData = sortedTickets.map((ticket, index) => ({
            ticket: ticket,
            top: index * (ROW_HEIGHT + 1)
        }));
        
        return { sequentialRenderData: renderData, sequentialTotalLanes: sortedTickets.length };
    }, [sortedTickets, allowTeamParallelism]);
    
    const calculateNewOrderAndDates = useCallback((
        baseTickets: Ticket[],
        draggedTicketId: number,
        dx: number,
        dy: number
    ): Ticket[] | null => {
        const originalIndex = baseTickets.findIndex(t => t.id === draggedTicketId);
        if (originalIndex === -1) return null;
    
        let tickets = baseTickets.map(t => ({...t}));
    
        // 1. Reorder array based on vertical movement (dy)
        const rowChange = Math.round(dy / (ROW_HEIGHT + 1));
        const newIndex = Math.max(0, Math.min(tickets.length - 1, originalIndex + rowChange));
    
        const draggedTicket = tickets[originalIndex];
    
        // Prevent reordering across execution status boundary if option is enabled
        if (prioritizeExecuting && newIndex !== originalIndex) {
            const targetTicket = tickets[newIndex];
            if (draggedTicket.status === TicketStatus.Ejecucion !== (targetTicket.status === TicketStatus.Ejecucion)) {
                return baseTickets; // Abort move
            }
        }
    
        if (newIndex !== originalIndex) {
            const [item] = tickets.splice(originalIndex, 1);
            tickets.splice(newIndex, 0, item);
        }
        
        // 2. Update start date of the moved ticket based on horizontal movement (dx)
        const dayChange = Math.round(dx / dayWidth);
        const movedTicketInNewArray = tickets.find(t => t.id === draggedTicketId)!;
        const newStartDate = new Date(movedTicketInNewArray.startDate + 'T12:00:00Z');
        newStartDate.setDate(newStartDate.getDate() + dayChange);
        movedTicketInNewArray.startDate = newStartDate.toISOString().split('T')[0];
    
        // 3. Recalculate all dependencies and dates based on the new order
        const finalTickets: Ticket[] = [];
        let lastEndDate: Date | null = null;
    
        for (const [index, ticket] of tickets.entries()) {
            const updatedTicket = { ...ticket, order: index };
            let currentStartDate = new Date(`${updatedTicket.startDate}T12:00:00Z`);
            
            // On the first ticket of a strict chain, if a gap is created, pull it back
            if (avoidTimelineGaps && !lastEndDate && tickets.length > 0) {
                 const firstTicketDate = new Date(`${tickets[0].startDate}T12:00:00Z`);
                 if (currentStartDate > firstTicketDate) {
                     currentStartDate = firstTicketDate;
                 }
            }

            if (lastEndDate) {
                const dependencyStartDate = findNextWorkDay(lastEndDate);

                if (avoidTimelineGaps) {
                    // With this mode ON, every ticket chains from the previous one.
                    // Independent tickets can't create gaps once the chain starts.
                    currentStartDate = dependencyStartDate;

                } else if (ticket.isDependent) {
                    if (currentStartDate < dependencyStartDate) {
                        currentStartDate = dependencyStartDate;
                    }
                }
            }
            
            updatedTicket.startDate = currentStartDate.toISOString().split('T')[0];
            const newEndDate = getEndDate(currentStartDate, updatedTicket.duration);
    
            // Update lastEndDate for the next iteration.
            // In avoidGaps mode, all tickets continue the chain.
            // Otherwise, only dependent tickets do.
            if (avoidTimelineGaps || ticket.isDependent) {
                lastEndDate = newEndDate;
            }
            finalTickets.push(updatedTicket);
        }
        
        return finalTickets;
    }, [dayWidth, getEndDate, prioritizeExecuting, findNextWorkDay, avoidTimelineGaps, isWorkDay]);


    const handleMouseUp = useCallback(() => {
        if (!dragState) return;
        const finalState = { ...dragState };
        setDragState(null);
        document.body.style.cursor = 'default';
        
        const dx = finalState.ghostX - finalState.initialX;
        const dy = finalState.ghostY - finalState.initialY;

        if (Math.abs(dx) < 5 && Math.abs(dy) < 5) {
            onOpenModal(finalState.ticketId);
            return;
        }

        const draggedTicket = tickets.find(t => t.id === finalState.ticketId);
        if (!draggedTicket) return;

        if (finalState.type === 'resize') {
            const dayChange = Math.round(dx / dayWidth);
            let updatedTicket = { ...draggedTicket };
            const originalEndDate = getEndDate(finalState.originalStartDate, finalState.originalDuration);
            let newTentativeEndDate = new Date(originalEndDate.getTime());
            newTentativeEndDate.setDate(newTentativeEndDate.getDate() + dayChange);
            updatedTicket.duration = Math.max(1, countWorkDays(finalState.originalStartDate, newTentativeEndDate));
            onTicketUpdate(updatedTicket);
        } else if (finalState.type === 'move') {
            const ticketsScope = allowTeamParallelism
                ? sortedTickets.filter(t => t.project === draggedTicket.project)
                : sortedTickets;
            
            const finalTickets = calculateNewOrderAndDates(ticketsScope, finalState.ticketId, dx, dy);
            if (!finalTickets) return;

            onTimelineDragEnd(finalTickets);
        }
    }, [dragState, onOpenModal, tickets, sortedTickets, dayWidth, getEndDate, countWorkDays, onTicketUpdate, allowTeamParallelism, calculateNewOrderAndDates, onTimelineDragEnd]);

    const handleMouseMove = useCallback((e: MouseEvent) => {
        if (!dragState) return;
        
        let nextState = { ...dragState, ghostX: e.clientX, ghostY: e.clientY };
        setDragState(nextState);
    }, [dragState]);

    useEffect(() => {
        if (dragState) {
            window.addEventListener('mousemove', handleMouseMove);
            window.addEventListener('mouseup', handleMouseUp);
        } else {
            window.removeEventListener('mousemove', handleMouseMove);
            window.removeEventListener('mouseup', handleMouseUp);
        }
        return () => {
            window.removeEventListener('mousemove', handleMouseMove);
            window.removeEventListener('mouseup', handleMouseUp);
        };
    }, [dragState, handleMouseMove, handleMouseUp]);

    const handleMouseDown = useCallback((e: React.MouseEvent<HTMLDivElement>, ticket: Ticket, interactionType: 'move' | 'resize') => {
        if (isViewOnly || e.button !== 0) return;
        e.preventDefault();
        e.stopPropagation();

        document.body.style.cursor = interactionType === 'resize' ? 'ew-resize' : 'grabbing';

        setDragState({
            type: interactionType,
            ticketId: ticket.id,
            initialX: e.clientX,
            initialY: e.clientY,
            initialScrollLeft: containerRef.current?.scrollLeft || 0,
            originalStartDate: new Date(`${ticket.startDate}T12:00:00Z`),
            originalDuration: ticket.duration,
            ghostX: e.clientX,
            ghostY: e.clientY,
        });
    }, [isViewOnly]);

    const getTicketRenderData = (ticket: Ticket) => {
        const startDate = new Date(`${ticket.startDate}T12:00:00Z`);
        const startColumn = dateToColumnMap.get(ticket.startDate);
        if (!startColumn) return null;
        const endDate = getEndDate(startDate, ticket.duration);
        const spanInCalendarDays = countCalendarDays(startDate, endDate);
        const left = (startColumn - 1) * dayWidth;
        const width = Math.max(1, spanInCalendarDays) * dayWidth -1;
        return { left, width, startDate, spanInCalendarDays };
    };
    
    const contentHeight = useMemo(() => {
        if (allowTeamParallelism) {
            let height = 0;
            teams.forEach(team => {
                const teamTickets = ticketsByTeam[team] || [];
                if (teamTickets.length > 0) {
                    height += TEAM_HEADER_HEIGHT;
                    height += teamTickets.length * (ROW_HEIGHT + 1);
                }
            });
            return height;
        } else {
            return sequentialTotalLanes * (ROW_HEIGHT + 1);
        }
    }, [allowTeamParallelism, teams, ticketsByTeam, sequentialTotalLanes]);

    const renderTicket = (ticket: Ticket, top: number, isGhost: boolean = false) => {
        const renderData = getTicketRenderData(ticket);
        if (!renderData) return null;

        const isBeingDragged = dragState?.ticketId === ticket.id;
        const isExecuting = ticket.status === TicketStatus.Ejecucion;
        
        let verticalOffset = top;
        if (isGhost && allowTeamParallelism && containerRef.current && dragState?.ticketId === ticket.id) { // Only calculate dynamic vertical offset for the dragged item
            const containerRect = containerRef.current.getBoundingClientRect();
            let accumulatedHeight = 0;
            for (const team of teams) {
                const teamTickets = ticketsByTeam[team] || [];
                if (teamTickets.length > 0) {
                    const teamTop = accumulatedHeight + containerRect.top + HEADER_HEIGHT;
                    const teamBottom = teamTop + TEAM_HEADER_HEIGHT + teamTickets.length * (ROW_HEIGHT + 1);
                     if (dragState && dragState.ghostY >= teamTop && dragState.ghostY <= teamBottom) {
                        const relativeY = dragState.ghostY - (teamTop + TEAM_HEADER_HEIGHT);
                        const rowIndex = Math.max(0, Math.min(teamTickets.length -1, Math.floor(relativeY / (ROW_HEIGHT + 1))));
                        verticalOffset = accumulatedHeight + TEAM_HEADER_HEIGHT + rowIndex * (ROW_HEIGHT + 1);
                        break;
                    }
                    accumulatedHeight += TEAM_HEADER_HEIGHT + teamTickets.length * (ROW_HEIGHT + 1);
                }
            }
        }

        if (isGhost) {
            const isTheDraggedOne = dragState?.ticketId === ticket.id;
            const ghostClassName = isTheDraggedOne
                ? "absolute border-2 border-dashed border-blue-500 rounded bg-gray-800/50 flex items-center px-2 pointer-events-none"
                : "absolute rounded bg-black/30 flex items-center px-2 pointer-events-none";

            return (
                <div key={`ghost-${ticket.id}`}
                     className={ghostClassName}
                     style={{
                         top: `${verticalOffset}px`,
                         left: `${renderData.left}px`,
                         width: `${renderData.width}px`,
                         height: `${ROW_HEIGHT}px`,
                         zIndex: isTheDraggedOne ? 45 : 40,
                         opacity: isTheDraggedOne ? 0.9 : 0.7,
                         transition: 'top 150ms ease-out, left 150ms ease-out',
                     }}
                >
                    <div className="flex items-center gap-2 whitespace-nowrap">
                        {isExecuting && <ExecutingSeal />}
                        <div className="text-white text-xs" style={{ textShadow: '0 1px 3px rgba(0,0,0,0.5)' }}><span className="font-semibold">{ticket.id}</span> {ticket.title}</div>
                    </div>
                </div>
            );
        }

        return (
            <div
                key={ticket.id}
                className={`timeline-ticket-bar absolute flex items-center group transition-opacity duration-150 ease-in-out`}
                style={{ 
                    top: `${top}px`,
                    left: `${renderData.left}px`,
                    width: `${renderData.width}px`,
                    height: `${ROW_HEIGHT}px`,
                    zIndex: isBeingDragged ? 50 : 20, 
                    opacity: isBeingDragged ? 0.5 : 1,
                }}
                onMouseDown={(e) => handleMouseDown(e, ticket, 'move')}>
                
                <div className="absolute top-1/2 -translate-y-1/2 left-0 w-full h-[85%] rounded overflow-hidden flex" style={{ border: '1px solid rgba(0,0,0,0.2)' }}>
                    {Array.from({length: renderData.spanInCalendarDays}).map((_, i) => {
                        const currentDate = new Date(renderData.startDate.getTime());
                        currentDate.setDate(currentDate.getDate() + i);
                        return <div key={i} className="h-full" style={{ flex: '1 1 0%', backgroundColor: categories[ticket.category]?.color || '#3a3a3a', opacity: isWorkDay(currentDate) ? 1 : 0.4 }} />;
                    })}
                </div>

                <div className="relative w-full h-full flex items-center justify-between px-2 gap-2 cursor-grab active:cursor-grabbing overflow-visible">
                    <div className="flex items-center gap-2 whitespace-nowrap">
                        {isExecuting && <ExecutingSeal />}
                        <div className="text-white text-xs" style={{ textShadow: '0 1px 3px rgba(0,0,0,0.5)' }}><span className="font-semibold">{ticket.id}</span> {ticket.title}</div>
                    </div>
                    {!allowTeamParallelism && 
                        <span className={`flex-shrink-0 px-1.5 py-0.5 text-[10px] rounded font-medium whitespace-nowrap bg-black/40 text-gray-200`}>{ticket.project}</span>
                    }
                </div>
                <div className="absolute right-0 top-0 bottom-0 w-2.5 cursor-ew-resize z-20 resize-handle" onMouseDown={(e) => handleMouseDown(e, ticket, 'resize')}></div>
            </div>
        );
    }

    const previewData = useMemo(() => {
        if (!dragState || dragState.type !== 'move') {
            return null;
        }

        const draggedTicket = sortedTickets.find(t => t.id === dragState.ticketId);
        if (!draggedTicket) return null;

        const ticketsScope = allowTeamParallelism
            ? sortedTickets.filter(t => t.project === draggedTicket.project)
            : sortedTickets;
        
        const dx = dragState.ghostX - dragState.initialX;
        const dy = dragState.ghostY - dragState.initialY;

        const reorderedTickets = calculateNewOrderAndDates(ticketsScope, dragState.ticketId, dx, dy);

        return {
            tickets: reorderedTickets,
            draggedTeam: allowTeamParallelism ? draggedTicket.project : null
        };
    }, [dragState, allowTeamParallelism, sortedTickets, calculateNewOrderAndDates]);
    
    return (
        <div className="grid grid-cols-1">
            <div className="bg-gray-800/50 p-4 rounded-lg">
                <div className="flex items-center gap-4 mb-4 flex-wrap">
                     {!isViewOnly && (
                        <button onClick={onOpenSettings} className="px-3 py-1 rounded-md text-sm font-medium text-gray-300 bg-gray-700/50 hover:bg-gray-700 flex items-center gap-2 flex-shrink-0">
                            <SettingsIcon />
                            Configurar
                        </button>
                     )}
                    <div className="ml-auto flex items-center gap-4">
                        <div className="flex items-center gap-2">
                            <span className="text-sm font-medium text-gray-300">Zoom:</span>
                            <button onClick={() => setDayWidth(w => Math.max(20, w - 5))} className="px-2 py-1 rounded bg-gray-700 hover:bg-gray-600 text-lg">-</button>
                            <button onClick={() => setDayWidth(w => Math.min(100, w + 5))} className="px-2 py-1 rounded bg-gray-700 hover:bg-gray-600 text-lg">+</button>
                            <button onClick={() => setDayWidth(DEFAULT_DAY_WIDTH)} className="px-3 py-1 rounded bg-gray-700 hover:bg-gray-600 text-sm">Reset</button>
                        </div>
                    </div>
                </div>

                <div ref={containerRef} className="w-full overflow-auto pb-4" style={{scrollBehavior: 'smooth', maxHeight: '70vh'}}>
                    <div className="relative" style={{ width: `${totalDays * dayWidth}px`, height: `${HEADER_HEIGHT + contentHeight}px`}}>
                        {/* Headers */}
                        <div className="sticky top-0 left-0 bg-[#2c2c2c]/50 backdrop-blur-sm z-30" style={{ width: '100%', height: `${HEADER_HEIGHT}px`}}>
                            {months.map(month => <div key={month.name} className="absolute flex items-center justify-center font-semibold text-sm pointer-events-none text-gray-300 border-b border-r border-white/10" style={{ top: 0, height: `${ROW_HEIGHT}px`, left: `${(month.start-1) * dayWidth}px`, width: `${month.span * dayWidth}px`}}>{month.name}</div>)}
                            {headerDays.map(day => <div key={`day-${day.column}`} className={`absolute flex items-center justify-center text-xs text-gray-400 rounded`} style={{ top: `${ROW_HEIGHT + 1}px`, height: `${ROW_HEIGHT}px`, left: `${(day.column - 1) * dayWidth}px`, width: `${dayWidth}px`, color: day.isNonWorkDay ? '#888' : '#e0e0e0' }}>{day.label}</div>)}
                        </div>
                        
                        {/* Grid Lines and Today Marker */}
                        <div className="absolute top-0 bottom-0 z-0">
                            {headerDays.map(day => <div key={`line-${day.column}`} className="h-full border-l border-white/10" style={{ position: 'absolute', left: `${(day.column - 1) * dayWidth}px`, top: 0, backgroundColor: day.isNonWorkDay ? 'rgba(40,40,40,0.5)' : 'transparent', width: `${dayWidth}px` }}></div>)}
                            {dateToColumnMap.get(today.toISOString().split('T')[0]) &&
                                <div className="absolute top-0 bottom-0 w-0.5 bg-red-500 z-20" style={{ left: `${(dateToColumnMap.get(today.toISOString().split('T')[0])! - 1) * dayWidth + dayWidth / 2}px`, top: `${HEADER_HEIGHT}px`, height: `${contentHeight}px` }} />
                            }
                        </div>
                        
                        {/* Ticket Area */}
                        <div className="absolute z-10" style={{ top: `${HEADER_HEIGHT}px`, left: 0, width: '100%', height: `${contentHeight}px` }}>
                            {!allowTeamParallelism && (
                                <>
                                    {!previewData && sequentialRenderData.map(({ ticket, top }) => renderTicket(ticket, top, false))}
                                    {previewData && previewData.tickets && previewData.tickets.map((ticket, index) => renderTicket(ticket, index * (ROW_HEIGHT + 1), true))}
                                </>
                            )}

                            {allowTeamParallelism && (() => {
                                let yOffset = 0;
                                return teams.map(team => {
                                    const teamTickets = ticketsByTeam[team] || [];
                                    if (teamTickets.length === 0) return null;
                                    
                                    const teamHeaderY = yOffset;
                                    const isDraggedTeam = previewData?.draggedTeam === team;
                                    const ticketsToRender = isDraggedTeam && previewData.tickets ? previewData.tickets : teamTickets;

                                    const section = (
                                        <React.Fragment key={team}>
                                            <div className="absolute bg-[#222222] p-2 flex items-center gap-2 z-20 border-b border-gray-700" style={{ top: teamHeaderY, left: 0, width: '100%', height: TEAM_HEADER_HEIGHT }}>
                                                <span className="font-bold text-white pl-2 whitespace-nowrap">{team}</span>
                                            </div>
                                            {ticketsToRender.map((ticket, index) => {
                                                const top = teamHeaderY + TEAM_HEADER_HEIGHT + index * (ROW_HEIGHT + 1);
                                                return renderTicket(ticket, top, isDraggedTeam);
                                            })}
                                        </React.Fragment>
                                    );
                                    
                                    yOffset += TEAM_HEADER_HEIGHT + ticketsToRender.length * (ROW_HEIGHT + 1);
                                    return section;
                                });
                            })()}
                        </div>
                    </div>
                </div>
                 <div className="mt-4 flex flex-wrap items-center gap-x-6 gap-y-2 text-sm text-gray-400 border-t border-white/10 pt-4">
                    <span className="font-semibold text-gray-300">Leyenda:</span>
                    {Object.entries(categories).map(([name, cat]) => <div key={name} className="flex items-center gap-2"><div className="w-4 h-4 rounded" style={{ backgroundColor: cat.color }}></div><span>{name}</span></div>)}
                    <div className="flex items-center gap-2">
                        <ExecutingSeal />
                        <span>En Ejecución</span>
                    </div>
                </div>
            </div>
        </div>
    );
};

export default TimelineView;