import React, { useState, useCallback, useEffect, useMemo, useRef } from 'react';
import { Ticket, Categories, View, TicketStatus, ProjectType } from './types';
import { INITIAL_TICKETS, INITIAL_CATEGORIES, INITIAL_TEAMS, INITIAL_HOLIDAYS } from './constants';

import Header from './components/Header';
import KanbanView from './components/KanbanView';
import CategoryView from './components/CategoryView';
import TimelineView from './components/TimelineView';
import ProjectView from './components/ProjectView';
import TicketModal from './components/TicketModal';
import CategoryModal from './components/CategoryModal';
import TeamModal from './components/TeamModal';
import ArchiveModal from './components/ArchiveModal';
import TimelineSettingsModal from './components/TimelineSettingsModal';

const App: React.FC = () => {
    const [tickets, setTickets] = useState<Ticket[]>(INITIAL_TICKETS);
    const [categories, setCategories] = useState<Categories>(INITIAL_CATEGORIES);
    const [teams, setTeams] = useState<ProjectType[]>(INITIAL_TEAMS);
    const [activeView, setActiveView] = useState<View>('timeline');
    
    const [isTicketModalOpen, setTicketModalOpen] = useState(false);
    const [isCategoryModalOpen, setCategoryModalOpen] = useState(false);
    const [isTeamModalOpen, setTeamModalOpen] = useState(false);
    const [isArchiveModalOpen, setArchiveModalOpen] = useState(false);
    const [isTimelineSettingsOpen, setTimelineSettingsOpen] = useState(false);
    const [ticketToEdit, setTicketToEdit] = useState<Ticket | null>(null);

    const [holidays, setHolidays] = useState<string[]>(() => {
        try {
            const saved = localStorage.getItem('timelineHolidays');
            return saved ? JSON.parse(saved) : INITIAL_HOLIDAYS;
        } catch (error) {
            console.error("Failed to parse holidays from localStorage", error);
            return INITIAL_HOLIDAYS;
        }
    });
    
    const [allowTeamParallelism, setAllowTeamParallelism] = useState<boolean>(() => {
        try {
            const saved = localStorage.getItem('allowTeamParallelism');
            return saved !== null ? JSON.parse(saved) : true;
        } catch (error) {
            console.error("Failed to parse team parallelism from localStorage", error);
            return true;
        }
    });
    
    const [prioritizeExecuting, setPrioritizeExecuting] = useState<boolean>(() => {
        try {
            const saved = localStorage.getItem('prioritizeExecuting');
            return saved !== null ? JSON.parse(saved) : true;
        } catch (error) {
            console.error("Failed to parse prioritizeExecuting from localStorage", error);
            return true;
        }
    });
    
    const [avoidTimelineGaps, setAvoidTimelineGaps] = useState<boolean>(() => {
        try {
            const saved = localStorage.getItem('avoidTimelineGaps');
            return saved !== null ? JSON.parse(saved) : false;
        } catch (error) {
            console.error("Failed to parse avoidTimelineGaps from localStorage", error);
            return false;
        }
    });


    useEffect(() => {
        try {
            localStorage.setItem('timelineHolidays', JSON.stringify(holidays));
        } catch (error) {
            console.error("Failed to save holidays to localStorage", error);
        }
    }, [holidays]);
    
    useEffect(() => {
        try {
            localStorage.setItem('allowTeamParallelism', JSON.stringify(allowTeamParallelism));
        } catch (error) {
            console.error("Failed to save team parallelism to localStorage", error);
        }
    }, [allowTeamParallelism]);
    
    useEffect(() => {
        try {
            localStorage.setItem('prioritizeExecuting', JSON.stringify(prioritizeExecuting));
        } catch (error) {
            console.error("Failed to save prioritizeExecuting to localStorage", error);
        }
    }, [prioritizeExecuting]);

    useEffect(() => {
        try {
            localStorage.setItem('avoidTimelineGaps', JSON.stringify(avoidTimelineGaps));
        } catch (error) {
            console.error("Failed to save avoidTimelineGaps to localStorage", error);
        }
    }, [avoidTimelineGaps]);

    const recalculateDependencies = useCallback((ticketList: Ticket[], teamList: ProjectType[], holidayList: string[], allowParallelism: boolean, avoidGaps: boolean, manuallyMovedTicketId: number | null = null) => {
        const holidaySet = new Set(holidayList);
        const isWorkDay = (date: Date): boolean => {
            const dayOfWeek = date.getDay();
            return dayOfWeek !== 0 && dayOfWeek !== 6 && !holidaySet.has(date.toISOString().split('T')[0]);
        };
        
        const findNextWorkDay = (date: Date): Date => {
            let nextDate = new Date(date.getTime());
            nextDate.setDate(nextDate.getDate() + 1);
            while (!isWorkDay(nextDate)) {
                nextDate.setDate(nextDate.getDate() + 1);
            }
            return nextDate;
        };

        const getEndDate = (startDate: Date, duration: number): Date => {
            let effectiveStartDate = new Date(startDate.getTime());
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
        };
        
        const findValidStartDate = (date: Date): Date => {
            let validDate = new Date(date.getTime());
            while (!isWorkDay(validDate)) {
                validDate.setDate(validDate.getDate() + 1);
            }
            return validDate;
        };
    
        const sortedTickets = [...ticketList].sort((a, b) => a.order - b.order);
        const newTicketsMap = new Map<number, Ticket>();
        
        const processScope = (scopeTickets: Ticket[]) => {
            let lastEndDate: Date | null = null;
            
            for (const ticket of scopeTickets) {
                 if (ticket.status === TicketStatus.Terminado) {
                    newTicketsMap.set(ticket.id, { ...ticket });
                    continue;
                }

                const currentTicket = { ...ticket };
                let currentStartDate = new Date(`${currentTicket.startDate}T12:00:00Z`);

                if (avoidGaps) {
                    if (lastEndDate) {
                         currentStartDate = findNextWorkDay(lastEndDate);
                    } else {
                         currentStartDate = findValidStartDate(currentStartDate);
                    }
                } else {
                    if (lastEndDate) {
                        const dependencyStartDate = findNextWorkDay(lastEndDate);
                        if (currentTicket.isDependent) {
                             if (manuallyMovedTicketId !== currentTicket.id && currentStartDate < dependencyStartDate) {
                                currentStartDate = dependencyStartDate;
                            }
                        }
                    }
                    currentStartDate = findValidStartDate(currentStartDate);
                }

                currentTicket.startDate = currentStartDate.toISOString().split('T')[0];
                const newEndDate = getEndDate(currentStartDate, currentTicket.duration);

                if (avoidGaps || currentTicket.isDependent) {
                    lastEndDate = newEndDate;
                }
                newTicketsMap.set(currentTicket.id, currentTicket);
            }
        };

        if (allowParallelism) {
            teamList.forEach(team => {
                const teamTickets = sortedTickets.filter(t => t.project === team);
                processScope(teamTickets);
            });
        } else {
            const activeTickets = sortedTickets.filter(t => t.status !== TicketStatus.Terminado);
            processScope(activeTickets);
        }

        const completedTickets = sortedTickets.filter(t => t.status === TicketStatus.Terminado);
        completedTickets.forEach(t => newTicketsMap.set(t.id, t));
        
        return sortedTickets.map(t => newTicketsMap.get(t.id)!);
    }, []);

    useEffect(() => {
        setTickets(prevTickets => recalculateDependencies(prevTickets, teams, holidays, allowTeamParallelism, avoidTimelineGaps));
    }, []); 


    const handleOpenModal = useCallback((id?: number) => {
        const ticket = id ? tickets.find(t => t.id === id) || null : null;
        setTicketToEdit(ticket);
        setTicketModalOpen(true);
    }, [tickets]);

    const handleTicketSubmit = useCallback((ticketData: Omit<Ticket, 'status' | 'order' | 'completionDate' | 'startDate'> & { originalId?: number }) => {
        setTickets(prevTickets => {
            let newTickets;
            if (ticketData.originalId) { // Editing
                newTickets = prevTickets.map(t => t.id === ticketData.originalId ? { ...t, ...ticketData } : t);
            } else { // Creating
                const newOrder = prevTickets.length > 0 ? Math.max(...prevTickets.map(t => t.order)) + 1 : 0;
                const newTicket: Ticket = {
                    status: TicketStatus.Proximos,
                    order: newOrder,
                    completionDate: null,
                    startDate: new Date().toISOString().split('T')[0], // Placeholder, will be recalculated
                    ...ticketData,
                };
                newTickets = [...prevTickets, newTicket];
            }
            return recalculateDependencies(newTickets, teams, holidays, allowTeamParallelism, avoidTimelineGaps);
        });
    }, [recalculateDependencies, teams, holidays, allowTeamParallelism, avoidTimelineGaps]);

    const handleTicketOrderChange = useCallback((draggedTicketId: number, targetStatus: TicketStatus, targetIndex: number) => {
        setTickets(prevTickets => {
            const ticketToMove = { ...prevTickets.find(t => t.id === draggedTicketId)! };

            ticketToMove.status = targetStatus;
            if (targetStatus === TicketStatus.Terminado && !ticketToMove.completionDate) {
                ticketToMove.completionDate = new Date().toISOString();
            } else if (targetStatus !== TicketStatus.Terminado) {
                ticketToMove.completionDate = null;
            }

            const remainingTickets = prevTickets.filter(t => t.id !== draggedTicketId);
            
            const targetList = remainingTickets.filter(t => t.status === targetStatus).sort((a,b) => a.order - b.order);
            targetList.splice(targetIndex, 0, ticketToMove);

            const otherListsTickets = remainingTickets.filter(t => t.status !== targetStatus);
            
            const reorderedTickets = [...otherListsTickets, ...targetList];

            const ticketsWithNewOrder = reorderedTickets.map((t, index) => ({
                ...t,
                order: index,
            }));

            return recalculateDependencies(ticketsWithNewOrder, teams, holidays, allowTeamParallelism, avoidTimelineGaps);
        });
    }, [recalculateDependencies, teams, holidays, allowTeamParallelism, avoidTimelineGaps]);
    
    const handleProjectAndOrderChange = useCallback((draggedTicketId: number, targetProject: ProjectType, targetIndex: number) => {
        setTickets(prevTickets => {
            const ticketToMove = { ...prevTickets.find(t => t.id === draggedTicketId)! };
            ticketToMove.project = targetProject;
    
            const allOtherTickets = prevTickets.filter(t => t.id !== draggedTicketId);
    
            const reorderedLists: Ticket[] = [];
            
            teams.forEach(team => {
                const listForTeam = allOtherTickets.filter(t => t.project === team).sort((a,b) => a.order - b.order);
                if (team === targetProject) {
                    listForTeam.splice(targetIndex, 0, ticketToMove);
                }
                reorderedLists.push(...listForTeam);
            });
    
            const ticketsWithNewOrder = reorderedLists.map((t, index) => ({
                ...t,
                order: index,
            }));
    
            return recalculateDependencies(ticketsWithNewOrder, teams, holidays, allowTeamParallelism, avoidTimelineGaps);
        });
    }, [recalculateDependencies, teams, holidays, allowTeamParallelism, avoidTimelineGaps]);


    const handleTicketUpdate = useCallback((updatedTicket: Ticket) => {
        setTickets(prevTickets => {
            const activeTickets = prevTickets
                .filter(t => t.status !== TicketStatus.Terminado)
                .map(t => t.id === updatedTicket.id ? updatedTicket : t);
    
            activeTickets.sort((a, b) => {
                if (prioritizeExecuting) {
                    const aIsExecuting = a.status === TicketStatus.Ejecucion;
                    const bIsExecuting = b.status === TicketStatus.Ejecucion;
                    if (aIsExecuting && !bIsExecuting) return -1;
                    if (!aIsExecuting && bIsExecuting) return 1;
                }

                const dateA = new Date(a.startDate);
                const dateB = new Date(b.startDate);
                if (dateA.getTime() !== dateB.getTime()) {
                    return dateA.getTime() - dateB.getTime();
                }
                return a.order - b.order;
            });
    
            const updatedActiveTicketsWithOrder = activeTickets.map((t, index) => ({ ...t, order: index }));
            
            const completedTickets = prevTickets
                .filter(t => t.status === TicketStatus.Terminado)
                .map((t, index) => ({...t, order: updatedActiveTicketsWithOrder.length + index}));
    
            const newFullList = [...updatedActiveTicketsWithOrder, ...completedTickets];
    
            return recalculateDependencies(newFullList, teams, holidays, allowTeamParallelism, avoidTimelineGaps, updatedTicket.id);
        });
    }, [recalculateDependencies, teams, holidays, allowTeamParallelism, avoidTimelineGaps, prioritizeExecuting]);
    
    const handleTimelineDragEnd = useCallback((updatedTicketsFromScope: Ticket[]) => {
        setTickets(prevTickets => {
            const updatedTicketsMap = new Map(updatedTicketsFromScope.map(t => [t.id, t]));
            const newTickets = prevTickets.map(t => updatedTicketsMap.get(t.id) || t);
            newTickets.sort((a,b) => a.order - b.order);
            return recalculateDependencies(newTickets, teams, holidays, allowTeamParallelism, avoidTimelineGaps);
        });
    }, [recalculateDependencies, teams, holidays, allowTeamParallelism, avoidTimelineGaps]);

    const handleAddHoliday = useCallback((dateStr: string) => {
        if (!dateStr) return;
        setHolidays(prev => {
            const newHolidaysSet = new Set(prev);
            if (newHolidaysSet.has(dateStr)) {
                return prev;
            }
            newHolidaysSet.add(dateStr);
            const sorted = Array.from(newHolidaysSet).sort();
            setTickets(currentTickets => recalculateDependencies(currentTickets, teams, sorted, allowTeamParallelism, avoidTimelineGaps));
            return sorted;
        });
    }, [recalculateDependencies, teams, allowTeamParallelism, avoidTimelineGaps]);

    const handleRemoveHoliday = useCallback((dateStr: string) => {
        setHolidays(prev => {
            const newHolidaysSet = new Set(prev);
            if (!newHolidaysSet.has(dateStr)) {
                return prev;
            }
            newHolidaysSet.delete(dateStr);
            const sorted = Array.from(newHolidaysSet).sort();
            setTickets(currentTickets => recalculateDependencies(currentTickets, teams, sorted, allowTeamParallelism, avoidTimelineGaps));
            return sorted;
        });
    }, [recalculateDependencies, teams, allowTeamParallelism, avoidTimelineGaps]);

    const handleToggleTeamParallelism = useCallback(() => {
        setAllowTeamParallelism(prev => {
            const newValue = !prev;
            setTickets(currentTickets => recalculateDependencies(currentTickets, teams, holidays, newValue, avoidTimelineGaps));
            return newValue;
        });
    }, [recalculateDependencies, teams, holidays, avoidTimelineGaps]);
    
    const handleTogglePrioritizeExecuting = useCallback(() => {
        setPrioritizeExecuting(prev => !prev);
    }, []);

    const handleToggleAvoidTimelineGaps = useCallback(() => {
        setAvoidTimelineGaps(prev => {
            const newValue = !prev;
            setTickets(currentTickets => recalculateDependencies(currentTickets, teams, holidays, allowTeamParallelism, newValue));
            return newValue;
        });
    }, [recalculateDependencies, teams, holidays, allowTeamParallelism]);


    const handleAddCategory = useCallback((name: string, color: string) => {
        setCategories(prev => ({ ...prev, [name]: { color } }));
    }, []);

    const handleDeleteCategory = useCallback((name: string) => {
        if (Object.keys(categories).length <= 1) {
            alert("No se puede eliminar la última categoría.");
            return;
        }
        if (tickets.some(t => t.category === name)) {
            alert("No se puede eliminar una categoría que está en uso por tickets.");
            return;
        }
        setCategories(prev => {
            const newCats = { ...prev };
            delete newCats[name];
            return newCats;
        });
    }, [categories, tickets]);
    
    const handleAddTeam = useCallback((name: string) => {
        if (teams.includes(name)) {
            alert("Este equipo ya existe.");
            return;
        }
        setTeams(prev => [...prev, name]);
    }, [teams]);

    const handleDeleteTeam = useCallback((name: string) => {
        if (teams.length <= 1) {
            alert("Debe haber al menos un equipo.");
            return;
        }
        if (tickets.some(t => t.project === name)) {
            alert("No se puede eliminar un equipo que está asignado a tickets.");
            return;
        }
        setTeams(prev => prev.filter(team => team !== name));
    }, [teams, tickets]);

    const handleDeleteTicket = useCallback((ticketId: number) => {
        if (window.confirm('¿Está seguro de que desea eliminar este ticket de forma permanente?')) {
            setTickets(prevTickets => {
                const remainingTickets = prevTickets.filter(t => t.id !== ticketId);
                const reordered = remainingTickets.sort((a,b) => a.order - b.order).map((t,i) => ({...t, order: i}));
                return recalculateDependencies(reordered, teams, holidays, allowTeamParallelism, avoidTimelineGaps);
            });
        }
    }, [recalculateDependencies, teams, holidays, allowTeamParallelism, avoidTimelineGaps]);

    const handleCompleteTicket = useCallback((ticketId: number) => {
        const targetListSize = tickets.filter(t => t.status === TicketStatus.Terminado).length;
        handleTicketOrderChange(ticketId, TicketStatus.Terminado, targetListSize);
    }, [tickets, handleTicketOrderChange]);

    const timelineTickets = useMemo(() => {
        return tickets
            .filter(t => t.status !== TicketStatus.Terminado);
    }, [tickets]);


    const renderView = () => {
        switch (activeView) {
            case 'status':
                return <KanbanView 
                            tickets={tickets} 
                            categories={categories} 
                            onTicketOrderChange={handleTicketOrderChange} 
                            onOpenModal={handleOpenModal} 
                            onDeleteTicket={handleDeleteTicket}
                            onCompleteTicket={handleCompleteTicket}
                        />;
            case 'category':
                return <CategoryView 
                            tickets={tickets} 
                            categories={categories} 
                            onOpenModal={handleOpenModal}
                            onDeleteTicket={handleDeleteTicket}
                            onCompleteTicket={handleCompleteTicket} 
                        />;
            case 'timeline':
                return <TimelineView 
                            tickets={timelineTickets} 
                            categories={categories}
                            teams={teams}
                            holidays={holidays}
                            onTicketUpdate={handleTicketUpdate} 
                            onTimelineDragEnd={handleTimelineDragEnd}
                            onOpenModal={handleOpenModal} 
                            allowTeamParallelism={allowTeamParallelism}
                            prioritizeExecuting={prioritizeExecuting}
                            avoidTimelineGaps={avoidTimelineGaps}
                            onOpenSettings={() => setTimelineSettingsOpen(true)}
                        />;
            case 'project':
                return <ProjectView 
                            tickets={tickets} 
                            categories={categories}
                            teams={teams} 
                            onTicketOrderChange={handleProjectAndOrderChange} 
                            onOpenModal={handleOpenModal}
                            onDeleteTicket={handleDeleteTicket}
                            onCompleteTicket={handleCompleteTicket}
                        />;
            default:
                return null;
        }
    };

    return (
        <div className="min-h-screen bg-[#191919] text-white">
            <Header
                activeView={activeView}
                onViewChange={setActiveView}
                onManageCategories={() => setCategoryModalOpen(true)}
                onManageTeams={() => setTeamModalOpen(true)}
                onShowArchive={() => setArchiveModalOpen(true)}
            />
            <main className="p-6">
                {renderView()}
            </main>

            <TicketModal
                isOpen={isTicketModalOpen}
                onClose={() => setTicketModalOpen(false)}
                onSubmit={handleTicketSubmit}
                ticketToEdit={ticketToEdit}
                categories={categories}
                teams={teams}
                tickets={tickets}
            />
            <CategoryModal
                isOpen={isCategoryModalOpen}
                onClose={() => setCategoryModalOpen(false)}
                categories={categories}
                onAddCategory={handleAddCategory}
                onDeleteCategory={handleDeleteCategory}
            />
            <TeamModal
                isOpen={isTeamModalOpen}
                onClose={() => setTeamModalOpen(false)}
                teams={teams}
                onAddTeam={handleAddTeam}
                onDeleteTeam={handleDeleteTeam}
            />
            <ArchiveModal
                isOpen={isArchiveModalOpen}
                onClose={() => setArchiveModalOpen(false)}
                tickets={tickets}
                categories={categories}
            />
             <TimelineSettingsModal
                isOpen={isTimelineSettingsOpen}
                onClose={() => setTimelineSettingsOpen(false)}
                allowTeamParallelism={allowTeamParallelism}
                onToggleTeamParallelism={handleToggleTeamParallelism}
                holidays={holidays}
                onAddHoliday={handleAddHoliday}
                onRemoveHoliday={handleRemoveHoliday}
                prioritizeExecuting={prioritizeExecuting}
                onTogglePrioritizeExecuting={handleTogglePrioritizeExecuting}
                avoidTimelineGaps={avoidTimelineGaps}
                onToggleAvoidTimelineGaps={handleToggleAvoidTimelineGaps}
            />
        </div>
    );
};

export default App;