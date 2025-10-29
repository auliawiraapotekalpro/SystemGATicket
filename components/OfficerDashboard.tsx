import React, { useState } from 'react';
import { User, Ticket, TicketStatus, TicketPriority, Attachment } from '../types';
import { LogoutIcon } from './icons/LogoutIcon';
import { TicketIcon as MenuTicketIcon } from './icons/TicketIcon';
import { ScheduleIcon } from './icons/ScheduleIcon';
import { StarIcon } from './icons/StarIcon';
import { EmptyStateOfficerIcon } from './icons/EmptyStateOfficerIcon';
import { BuildingIcon } from './icons/BuildingIcon';
import { ChevronDownIcon } from './icons/ChevronDownIcon';
import { CalendarIcon } from './icons/CalendarIcon';
import { PlayIcon } from './icons/PlayIcon';
import { XIcon } from './icons/XIcon';
import { CheckIcon } from './icons/CheckIcon';
import { ClockIcon } from './icons/ClockIcon';
import ScheduleModal from './ScheduleModal';
import RatingView from './RatingView';
import AttachmentPreviewModal from './AttachmentPreviewModal';


interface OfficerDashboardProps {
  user: User;
  onLogout: () => void;
  tickets: Ticket[];
  onUpdateTicket: (ticketId: string, updates: Partial<Ticket>) => Promise<void>;
}

const formatDate = (date: Date) => {
  return new Intl.DateTimeFormat('en-GB', {
    year: 'numeric',
    month: '2-digit',
    day: '2-digit',
  }).format(date);
};

const calculateDuration = (start: Date, end: Date): string => {
    const diffMs = end.getTime() - start.getTime();
    if (diffMs < 0) return '0 detik';

    const diffDays = Math.floor(diffMs / 86400000);
    const diffHrs = Math.floor((diffMs % 86400000) / 3600000);
    const diffMins = Math.floor((diffMs % 3600000) / 60000);

    let durationString = '';
    if (diffDays > 0) durationString += `${diffDays} hari `;
    if (diffHrs > 0) durationString += `${diffHrs} jam `;
    if (diffMins > 0) durationString += `${diffMins} menit `;

    if (durationString.trim() === '' && diffMs > 0) {
        const diffSecs = Math.floor(diffMs / 1000);
        return `${diffSecs} detik`;
    }

    return durationString.trim() || '0 detik';
};

interface TicketRowProps {
    ticket: Ticket;
    user: User;
    onUpdateTicket: OfficerDashboardProps['onUpdateTicket'];
    onScheduleClick: () => void;
    onPreviewClick: (attachment: Attachment) => void;
}

const TicketRow: React.FC<TicketRowProps> = ({ ticket, user, onUpdateTicket, onScheduleClick, onPreviewClick }) => {
  const [isExpanded, setIsExpanded] = useState(false);
  const [isUpdating, setIsUpdating] = useState(false);

  const handleAction = async (updates: Partial<Ticket>) => {
    setIsUpdating(true);
    try {
        await onUpdateTicket(ticket.id, updates);
    } catch (error) {
        console.error("Failed to update ticket:", error);
        alert("Gagal memperbarui tiket. Silakan coba lagi.");
    } finally {
        setIsUpdating(false);
    }
  };

  const handleStart = () => handleAction({ status: TicketStatus.InProgress, startedAt: new Date() });
  
  const handleComplete = () => handleAction({
      status: TicketStatus.Completed,
      completedAt: new Date(),
      assignedOfficer: user.username,
  });

  const handleCancel = () => {
    if (window.confirm('Apakah Anda yakin ingin membatalkan tiket ini?')) {
        handleAction({ status: TicketStatus.Closed });
    }
  };
  
  const handlePriorityChange = (e: React.ChangeEvent<HTMLSelectElement>) => {
    handleAction({ priority: e.target.value as TicketPriority });
  };

  const getStatusChipStyle = (status: TicketStatus) => {
    switch (status) {
      case TicketStatus.Open: return 'bg-green-100 text-green-800';
      case TicketStatus.Scheduled: return 'bg-blue-100 text-blue-800';
      case TicketStatus.InProgress: return 'bg-yellow-100 text-yellow-800';
      case TicketStatus.Completed: return 'bg-purple-100 text-purple-800';
      case TicketStatus.Closed: return 'bg-gray-200 text-gray-800';
      default: return 'bg-slate-100 text-slate-800';
    }
  };

   const getPriorityChipStyle = (priority: TicketPriority) => {
    switch (priority) {
      case TicketPriority.Low: return 'bg-gray-100 text-gray-800 border-gray-200 hover:bg-gray-200';
      case TicketPriority.Medium: return 'bg-orange-100 text-orange-800 border-orange-200 hover:bg-orange-200';
      case TicketPriority.High: return 'bg-red-100 text-red-800 border-red-200 hover:bg-red-200';
      default: return 'bg-slate-100 text-slate-800 border-slate-200 hover:bg-slate-200';
    }
  };

  return (
    <div className={`bg-white rounded-lg shadow-sm border border-slate-200 overflow-hidden transition-all duration-300 ${isUpdating ? 'opacity-50' : ''}`}>
      <div className="grid grid-cols-[2.5fr,2fr,1.2fr,1fr,2.5fr,40px] gap-x-4 items-center p-4">
        {/* Ticket Info */}
        <div className="flex flex-col">
          <span className="font-semibold text-slate-900 truncate" title={ticket.title}>{ticket.title}</span>
          <span className="text-xs text-slate-500">{ticket.id} • {formatDate(ticket.createdAt)}</span>
        </div>

        {/* Pelapor */}
        <div className="flex flex-col">
           <span className="font-semibold text-slate-900">{ticket.reporterName}</span>
           <span className="text-xs text-slate-500">{ticket.subCategory}</span>
        </div>

        {/* Prioritas */}
        <div className="relative">
            <select
                value={ticket.priority}
                onChange={handlePriorityChange}
                onClick={(e) => e.stopPropagation()}
                disabled={isUpdating}
                className={`w-full appearance-none pl-3 pr-7 py-1 text-xs font-medium rounded-full border focus:ring-2 focus:ring-offset-1 focus:ring-indigo-500 focus:outline-none transition-colors cursor-pointer disabled:cursor-not-allowed ${getPriorityChipStyle(ticket.priority)}`}
                aria-label={`Update priority for ticket ${ticket.id}`}
            >
                <option value={TicketPriority.Low}>Low</option>
                <option value={TicketPriority.Medium}>Medium</option>
                <option value={TicketPriority.High}>High</option>
            </select>
            <ChevronDownIcon className="w-4 h-4 text-slate-500 absolute top-1/2 right-2 -translate-y-1/2 pointer-events-none" />
        </div>

        {/* Status */}
        <div className="flex items-center">
          <span className={`px-2.5 py-1 text-xs font-medium rounded-full ${getStatusChipStyle(ticket.status)}`}>
            {ticket.status}
          </span>
        </div>
        
        {/* Actions */}
        <div className="flex items-center justify-end gap-2">
            {ticket.status === TicketStatus.Open && (
                <>
                    <button onClick={onScheduleClick} disabled={isUpdating} className="flex items-center gap-1.5 px-3 py-1.5 text-xs font-semibold text-white bg-slate-700 hover:bg-slate-800 rounded-md transition-colors disabled:bg-slate-400">
                        <CalendarIcon className="w-4 h-4"/> Jadwalkan
                    </button>
                    <button onClick={handleStart} disabled={isUpdating} className="flex items-center gap-1.5 px-3 py-1.5 text-xs font-semibold text-white bg-blue-600 hover:bg-blue-700 rounded-md transition-colors disabled:bg-blue-300">
                        <PlayIcon className="w-4 h-4"/> Start
                    </button>
                     <button onClick={handleCancel} disabled={isUpdating} className="flex items-center gap-1.5 px-3 py-1.5 text-xs font-semibold text-white bg-red-600 hover:bg-red-700 rounded-md transition-colors disabled:bg-red-300">
                        <XIcon className="w-4 h-4"/> Cancel
                    </button>
                </>
            )}
             {ticket.status === TicketStatus.Scheduled && (
                <>
                    <div className="flex items-center gap-1.5 px-3 py-1.5 text-xs font-medium text-slate-700 bg-slate-100 border border-slate-200 rounded-md" title={`Dijadwalkan untuk ${ticket.scheduledAt ? formatDate(ticket.scheduledAt) : ''}`}>
                        <CalendarIcon className="w-4 h-4 text-slate-500"/>
                        <span>{ticket.scheduledAt ? formatDate(ticket.scheduledAt) : 'Dijadwalkan'}</span>
                    </div>
                    <button onClick={handleStart} disabled={isUpdating} className="flex items-center gap-1.5 px-3 py-1.5 text-xs font-semibold text-white bg-blue-600 hover:bg-blue-700 rounded-md transition-colors disabled:bg-blue-300">
                        <PlayIcon className="w-4 h-4"/> Start
                    </button>
                     <button onClick={handleCancel} disabled={isUpdating} className="flex items-center gap-1.5 px-3 py-1.5 text-xs font-semibold text-white bg-red-600 hover:bg-red-700 rounded-md transition-colors disabled:bg-red-300">
                        <XIcon className="w-4 h-4"/> Cancel
                    </button>
                </>
            )}
            {ticket.status === TicketStatus.InProgress && (
                 <>
                    <button onClick={handleComplete} disabled={isUpdating} className="flex items-center gap-1.5 px-3 py-1.5 text-xs font-semibold text-white bg-green-600 hover:bg-green-700 rounded-md transition-colors disabled:bg-green-300">
                        <CheckIcon className="w-4 h-4"/> Complete
                    </button>
                     <button onClick={handleCancel} disabled={isUpdating} className="flex items-center gap-1.5 px-3 py-1.5 text-xs font-semibold text-white bg-red-600 hover:bg-red-700 rounded-md transition-colors disabled:bg-red-300">
                        <XIcon className="w-4 h-4"/> Cancel
                    </button>
                </>
            )}
        </div>

        {/* Expander */}
        <div className="flex justify-center">
          <button onClick={() => setIsExpanded(!isExpanded)} className="p-1 rounded-full hover:bg-slate-100">
            <ChevronDownIcon className={`w-5 h-5 text-slate-500 transition-transform duration-300 ${isExpanded ? 'rotate-180' : ''}`} />
          </button>
        </div>
      </div>
      
      {isExpanded && (
        <div className="bg-slate-50/75 border-t border-slate-200 p-6">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-x-8 gap-y-4 text-sm">
            {/* Left Column: Description */}
            <div className="space-y-2">
              <h4 className="text-xs font-semibold text-slate-500 uppercase tracking-wider">Deskripsi Laporan</h4>
              <p className="text-slate-700 break-words pr-4">{ticket.description}</p>
            </div>
            
            {/* Right Column: Details */}
            <div className="space-y-4">
                <div className="flex items-start">
                    <h5 className="text-xs font-semibold text-slate-500 uppercase tracking-wider w-24 shrink-0">Outlet</h5>
                    <div className="text-slate-800 font-medium flex items-center">
                        <BuildingIcon className="w-4 h-4 mr-1.5 text-slate-400 shrink-0" />
                        {ticket.unit}
                    </div>
                </div>
                 <div className="flex items-start">
                    <h5 className="text-xs font-semibold text-slate-500 uppercase tracking-wider w-24 shrink-0">Kategori</h5>
                    <p className="text-slate-800 font-medium">{ticket.category} ({ticket.subCategory})</p>
                </div>
                 <div className="flex items-start">
                    <h5 className="text-xs font-semibold text-slate-500 uppercase tracking-wider w-24 shrink-0">Lampiran</h5>
                    {ticket.attachments && ticket.attachments.length > 0 ? (
                        <ul className="text-slate-800 font-medium space-y-1">
                            {ticket.attachments.map((file, index) => (
                                <li key={index}>
                                    <button
                                        onClick={() => onPreviewClick(file)}
                                        className="text-indigo-600 hover:text-indigo-800 hover:underline text-left break-all"
                                        title={`Preview ${file.name}`}
                                    >
                                        {file.name}
                                    </button>
                                </li>
                            ))}
                        </ul>
                    ) : (
                        <p className="text-slate-500 italic">Tidak ada</p>
                    )}
                </div>
            </div>
          </div>

          {(ticket.status === TicketStatus.Completed || ticket.status === TicketStatus.Closed) && ticket.completedAt && (
          <div className="mt-6 pt-4 border-t border-slate-200">
              <h4 className="text-xs font-semibold text-slate-500 uppercase tracking-wider mb-3">History Pengerjaan</h4>
              <div className="bg-white border border-slate-200 p-4 rounded-lg flex items-center justify-between">
                  <div className="flex items-center gap-3">
                      <div className="bg-indigo-100 p-2 rounded-full">
                          <ClockIcon className="w-5 h-5 text-indigo-600" />
                      </div>
                      <div>
                          <p className="font-semibold text-slate-800">Selesai Dikerjakan</p>
                          <p className="text-xs text-slate-500">
                              {`${formatDate(ticket.completedAt)}`}
                          </p>
                      </div>
                  </div>
                  <div className="text-right">
                    <p className="font-bold text-indigo-600 text-sm">{calculateDuration(ticket.createdAt, ticket.completedAt)}</p>
                    <p className="text-xs text-slate-500">Total Durasi</p>
                  </div>
              </div>
          </div>
          )}
        </div>
      )}
    </div>
  );
};


const OfficerDashboard: React.FC<OfficerDashboardProps> = ({ user, onLogout, tickets, onUpdateTicket }) => {
  const [activeMenu, setActiveMenu] = useState('Lihat Tiket');
  const [schedulingTicket, setSchedulingTicket] = useState<Ticket | null>(null);
  const [previewAttachment, setPreviewAttachment] = useState<Attachment | null>(null);

  const handleOpenScheduleModal = (ticket: Ticket) => {
    setSchedulingTicket(ticket);
  };
  
  const handleCloseScheduleModal = () => {
    setSchedulingTicket(null);
  };

  const handleConfirmSchedule = (ticketId: string, scheduleDate: Date) => {
    onUpdateTicket(ticketId, { status: TicketStatus.Scheduled, scheduledAt: scheduleDate });
    setSchedulingTicket(null); // Close modal
  };
  
  const renderContent = () => {
    switch (activeMenu) {
        case 'Lihat Tiket':
            return (
                <div className="bg-white p-6 rounded-2xl shadow-lg w-full">
                    <h2 className="text-2xl font-bold text-slate-800 mb-6">All Submitted Tickets</h2>
                    <div className="border-b border-slate-200 pb-4 mb-4">
                        <div className="grid grid-cols-[2.5fr,2fr,1.2fr,1fr,2.5fr,40px] gap-x-4 text-left text-xs font-semibold text-slate-500 uppercase tracking-wider px-4">
                            <span>Ticket</span>
                            <span>Pelapor</span>
                            <span>Prioritas</span>
                            <span>Status</span>
                            <span className="text-right pr-2">Actions</span>
                            <span></span>
                        </div>
                    </div>
                    <div className="flex-1 flex flex-col">
                        {tickets.length > 0 ? (
                        <div className="space-y-3">
                            {tickets.map(ticket => (
                            <TicketRow 
                                key={ticket.id} 
                                ticket={ticket} 
                                user={user}
                                onUpdateTicket={onUpdateTicket} 
                                onScheduleClick={() => handleOpenScheduleModal(ticket)}
                                onPreviewClick={setPreviewAttachment}
                            />
                            ))}
                        </div>
                        ) : (
                        <div className="flex-1 flex flex-col items-center justify-center text-center text-slate-500 py-16">
                            <EmptyStateOfficerIcon className="w-24 h-24 text-slate-300 mb-4" />
                            <h3 className="text-xl font-semibold text-slate-700">Tidak Ada Tiket</h3>
                            <p className="mt-1">Saat ini belum ada tiket yang perlu ditangani.</p>
                        </div>
                        )}
                    </div>
                </div>
            );
        case 'Lihat Rating':
            return <RatingView user={user} tickets={tickets} />;
        case 'Saran Penjadwalan':
             return (
                <div className="bg-white p-6 rounded-2xl shadow-lg w-full text-center text-slate-500 py-16">
                    <ScheduleIcon className="w-24 h-24 text-slate-300 mx-auto mb-4" />
                    <h3 className="text-xl font-semibold text-slate-700">Fitur Dalam Pengembangan</h3>
                    <p className="mt-1">Saran penjadwalan akan segera tersedia.</p>
                </div>
            );
        default:
            return null;
    }
  };


  return (
    <>
      <div className="flex h-screen bg-slate-50 font-sans">
        <aside className="w-64 bg-white p-6 shadow-md flex flex-col shrink-0">
          <h1 className="text-2xl font-bold text-slate-800 mb-10">Officer Dashboard</h1>
          <h2 className="text-sm font-semibold text-slate-400 uppercase tracking-wider mb-4">Menu</h2>
          <nav className="flex flex-col space-y-2">
            <button
              type="button"
              onClick={() => setActiveMenu('Lihat Tiket')}
              className={`w-full flex items-center text-left px-4 py-3 rounded-lg transition-colors ${
                activeMenu === 'Lihat Tiket'
                  ? 'bg-indigo-100 text-indigo-600 font-semibold'
                  : 'text-slate-600 hover:bg-slate-100'
              }`}
            >
              <MenuTicketIcon className="w-5 h-5 mr-3" />
              <span>Lihat Tiket</span>
            </button>
            <button
              type="button"
              onClick={() => setActiveMenu('Saran Penjadwalan')}
              className={`w-full flex items-center text-left px-4 py-3 rounded-lg transition-colors ${
                activeMenu === 'Saran Penjadwalan'
                  ? 'bg-indigo-100 text-indigo-600 font-semibold'
                  : 'text-slate-600 hover:bg-slate-100'
              }`}
            >
              <ScheduleIcon className="w-5 h-5 mr-3" />
              <span>Saran Penjadwalan</span>
            </button>
            <button
              type="button"
              onClick={() => setActiveMenu('Lihat Rating')}
              className={`w-full flex items-center text-left px-4 py-3 rounded-lg transition-colors ${
                activeMenu === 'Lihat Rating'
                  ? 'bg-indigo-100 text-indigo-600 font-semibold'
                  : 'text-slate-600 hover:bg-slate-100'
              }`}
            >
              <StarIcon className="w-5 h-5 mr-3" />
              <span>Lihat Rating</span>
            </button>
          </nav>
        </aside>

        <div className="flex-1 flex flex-col overflow-y-auto">
          <header className="flex justify-end items-center p-6 bg-white border-b border-slate-200 sticky top-0 z-10">
            <div className="flex items-center space-x-4">
              <span className="text-slate-600">Welcome, <span className="font-semibold text-indigo-600">{user.username}</span></span>
              <button
                onClick={onLogout}
                className="flex items-center text-sm font-medium text-red-500 bg-red-100 hover:bg-red-200 transition-colors px-4 py-2 rounded-lg"
              >
                <LogoutIcon className="w-4 h-4 mr-2" />
                Logout
              </button>
            </div>
          </header>

          <main className="p-8">
            {renderContent()}
          </main>
        </div>
      </div>
      {schedulingTicket && (
        <ScheduleModal
            ticket={schedulingTicket}
            onClose={handleCloseScheduleModal}
            onConfirm={handleConfirmSchedule}
        />
      )}
       {previewAttachment && (
        <AttachmentPreviewModal attachment={previewAttachment} onClose={() => setPreviewAttachment(null)} />
      )}
    </>
  );
};

export default OfficerDashboard;
