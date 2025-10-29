import React, { useState, useMemo } from 'react';
import { User, Ticket, TicketStatus, Review, TicketPriority, Attachment } from '../types';
import { LogoutIcon } from './icons/LogoutIcon';
import { MonitorIcon } from './icons/MonitorIcon';
import { UsersIcon } from './icons/UsersIcon';
import { EmptyStateIcon } from './icons/EmptyStateIcon';
import { StarIcon } from './icons/StarIcon';
import { BuildingIcon } from './icons/BuildingIcon';
import { ChevronDownIcon } from './icons/ChevronDownIcon';
import { UserIcon } from './icons/UserIcon';
import AttachmentPreviewModal from './AttachmentPreviewModal';


const formatDate = (date: Date) => {
    return new Intl.DateTimeFormat('en-GB', {
      year: 'numeric',
      month: '2-digit',
      day: '2-digit',
    }).format(date);
};

const calculateReviewDuration = (start: Date, end: Date): string => {
    const diffMs = end.getTime() - start.getTime();
    if (diffMs < 0) return 'seketika';

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

    return durationString.trim() || 'seketika';
};

const StarRatingDisplay: React.FC<{ rating: number; size?: string }> = ({ rating, size = 'h-5 w-5' }) => {
  return (
    <div className="flex items-center">
      {[...Array(5)].map((_, index) => {
        const ratingValue = index + 1;
        return (
          <StarIcon
            key={ratingValue}
            className={`${size} ${ratingValue <= rating ? 'text-yellow-400' : 'text-slate-300'}`}
            fill="currentColor"
          />
        );
      })}
    </div>
  );
};

const OfficerRatingsView: React.FC<{ tickets: Ticket[] }> = ({ tickets }) => {
    const officerData = useMemo(() => {
        const reviewedTickets = tickets.filter(t => t.assignedOfficer && t.review);
        
        const data: { [key: string]: {
            reviewCount: number;
            sums: { attitude: number; neatness: number; quality: number; speed: number; communication: number; };
        }} = {};

        for (const ticket of reviewedTickets) {
            const officer = ticket.assignedOfficer!;
            if (!data[officer]) {
                data[officer] = { reviewCount: 0, sums: { attitude: 0, neatness: 0, quality: 0, speed: 0, communication: 0 } };
            }
            data[officer].reviewCount++;
            data[officer].sums.attitude += ticket.review!.attitude;
            data[officer].sums.neatness += ticket.review!.neatness;
            data[officer].sums.quality += ticket.review!.quality;
            data[officer].sums.speed += ticket.review!.speed;
            data[officer].sums.communication += ticket.review!.communication;
        }

        return Object.entries(data).map(([officer, stats]) => ({
            officer,
            reviewCount: stats.reviewCount,
            averages: {
                attitude: stats.sums.attitude / stats.reviewCount,
                neatness: stats.sums.neatness / stats.reviewCount,
                quality: stats.sums.quality / stats.reviewCount,
                speed: stats.sums.speed / stats.reviewCount,
                communication: stats.sums.communication / stats.reviewCount,
            }
        }));
    }, [tickets]);

    const reviewedTickets = useMemo(() => {
        return tickets
            .filter(ticket => ticket.assignedOfficer && ticket.review)
            .sort((a, b) => (b.review?.reviewedAt.getTime() || 0) - (a.review?.reviewedAt.getTime() || 0));
    }, [tickets]);

    const ratingCriteria: {id: 'attitude' | 'neatness' | 'quality' | 'speed' | 'communication', label: string}[] = [
        { id: 'attitude', label: 'Sikap & Etika Kerja' },
        { id: 'neatness', label: 'Kerapihan & Kebersihan' },
        { id: 'quality', label: 'Kualitas Hasil Pekerjaan' },
        { id: 'speed', label: 'Kecepatan & Ketepatan Waktu' },
        { id: 'communication', label: 'Penjelasan & Komunikasi' },
    ];

    if (officerData.length === 0) {
        return (
            <div className="bg-white p-6 rounded-2xl shadow-lg text-center text-slate-500 py-16">
                <EmptyStateIcon className="w-24 h-24 text-slate-300 mx-auto mb-4" />
                <h3 className="text-xl font-semibold text-slate-700">Belum Ada Rating</h3>
                <p className="mt-1">Tidak ada ulasan petugas yang tersedia untuk ditampilkan.</p>
            </div>
        );
    }

    return (
        <div className="space-y-8">
            <div>
                <h2 className="text-2xl font-bold text-slate-800">Officer Performance Ratings</h2>
                <p className="text-slate-500 mt-1">Ringkasan performa setiap petugas berdasarkan ulasan yang diterima.</p>
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6 mt-4">
                    {officerData.map(data => (
                        <div key={data.officer} className="bg-white p-6 rounded-2xl shadow-lg border-l-4 border-indigo-500">
                            <div className="flex items-center mb-4">
                                <div className="p-2 bg-indigo-100 rounded-full mr-4">
                                <UserIcon className="w-6 h-6 text-indigo-600"/>
                                </div>
                                <div>
                                    <h3 className="text-xl font-bold text-indigo-600">{data.officer}</h3>
                                    <p className="text-sm text-slate-500">Total {data.reviewCount} ulasan</p>
                                </div>
                            </div>
                            <div className="space-y-3">
                                {ratingCriteria.map(criterion => (
                                <div key={criterion.id} className="flex justify-between items-center text-sm">
                                    <span className="text-slate-600 font-medium">{criterion.label}</span>
                                    <div className="flex items-center gap-2">
                                    <StarRatingDisplay rating={data.averages[criterion.id]} size="h-4 w-4" />
                                    <span className="font-bold text-slate-700 w-8 text-right">{data.averages[criterion.id].toFixed(1)}</span>
                                    </div>
                                </div>
                                ))}
                            </div>
                        </div>
                    ))}
                </div>
            </div>

            <div>
                <h2 className="text-2xl font-bold text-slate-800">Detail Ulasan</h2>
                <p className="text-slate-500 mt-1">Semua ulasan yang telah diberikan oleh user, diurutkan dari yang terbaru.</p>
                <div className="space-y-4 mt-4">
                    {reviewedTickets.map(ticket => {
                        if (!ticket.review) return null;
                        const review = ticket.review;
                        const reviewDuration = ticket.completedAt ? calculateReviewDuration(ticket.completedAt, review.reviewedAt) : null;

                        return (
                        <div key={ticket.id} className="bg-white p-6 rounded-2xl shadow-lg border-l-4 border-indigo-500">
                            <div className="flex justify-between items-start mb-6">
                            <div>
                                <h3 className="text-lg font-bold text-slate-800">{ticket.title}</h3>
                                <p className="text-xs text-slate-500">
                                    T-{ticket.id.slice(-10)} • {ticket.unit} • Dikerjakan oleh: {ticket.assignedOfficer}
                                    {reviewDuration && (
                                        <> • <span className="font-medium text-slate-600">Direview dalam: {reviewDuration}</span></>
                                    )}
                                </p>
                            </div>
                            <span className="text-sm text-slate-500 font-medium">{formatDate(review.reviewedAt)}</span>
                            </div>
                            
                            <div className="space-y-5">
                            {ratingCriteria.map(criterion => {
                                const ratingValue = review[criterion.id as keyof Omit<Review, 'reviewedAt'| `${string}Comment`>];
                                const commentValue = review[`${criterion.id}Comment` as keyof Review] as string;

                                return (
                                <div key={criterion.id}>
                                    <div className="flex justify-between items-center">
                                    <h4 className="font-semibold text-slate-700">{criterion.label}</h4>
                                    <StarRatingDisplay rating={ratingValue} />
                                    </div>
                                    {commentValue && (
                                    <blockquote className="mt-2 pl-4 border-l-2 border-slate-200">
                                        <p className="text-sm text-slate-600 italic">"{commentValue}"</p>
                                    </blockquote>
                                    )}
                                </div>
                                )
                            })}
                            </div>
                        </div>
                        )
                    })}
                </div>
            </div>
        </div>
    );
};

interface AdminTicketRowProps {
    ticket: Ticket;
    onPreviewClick: (attachment: Attachment) => void;
}

const AdminTicketRow: React.FC<AdminTicketRowProps> = ({ ticket, onPreviewClick }) => {
  const [isExpanded, setIsExpanded] = useState(false);

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
      case TicketPriority.Low: return 'border-gray-300 bg-gray-50 text-gray-600';
      case TicketPriority.Medium: return 'border-orange-300 bg-orange-50 text-orange-600';
      case TicketPriority.High: return 'border-red-300 bg-red-50 text-red-600';
      default: return 'border-slate-300 bg-slate-50 text-slate-600';
    }
  };

  return (
    <div className="bg-white rounded-lg shadow-sm border border-slate-200 overflow-hidden transition-all duration-300">
      <div className="grid grid-cols-[2.5fr,2fr,1.5fr,1.2fr,1fr,40px] gap-x-4 items-center p-4">
        {/* Ticket Info */}
        <div className="flex flex-col">
          <span className="font-semibold text-slate-900 truncate" title={ticket.title}>{ticket.title}</span>
          <span className="text-xs text-slate-500">{ticket.id} • {formatDate(ticket.createdAt)}</span>
        </div>

        {/* Pelapor */}
        <div className="flex flex-col">
           <span className="font-semibold text-slate-900">{ticket.reporterName}</span>
           <span className="text-xs text-slate-500">{ticket.unit}</span>
        </div>
        
        {/* Petugas */}
        <div className="font-medium text-slate-700">
            {ticket.assignedOfficer || <span className="text-slate-400 italic">Belum ada</span>}
        </div>

        {/* Prioritas */}
        <div className={`flex items-center justify-center gap-1.5 px-2.5 py-1 text-xs font-medium rounded-full border ${getPriorityChipStyle(ticket.priority)}`}>
            <span>{ticket.priority}</span>
        </div>

        {/* Status */}
        <div className="flex items-center">
          <span className={`px-2.5 py-1 text-xs font-medium rounded-full ${getStatusChipStyle(ticket.status)}`}>
            {ticket.status}
          </span>
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
        </div>
      )}
    </div>
  );
};


const TicketMonitoringView: React.FC<{ tickets: Ticket[], onPreviewClick: (attachment: Attachment) => void }> = ({ tickets, onPreviewClick }) => {
    const [activeFilter, setActiveFilter] = useState<'live' | 'completed'>('live');

    const filteredTickets = useMemo(() => {
        const sortedTickets = [...tickets].sort((a, b) => b.createdAt.getTime() - a.createdAt.getTime());
        
        if (activeFilter === 'live') {
            return sortedTickets.filter(t => 
                [TicketStatus.Open, TicketStatus.Scheduled, TicketStatus.InProgress].includes(t.status)
            );
        } else { // 'completed'
            return sortedTickets.filter(t => 
                [TicketStatus.Completed, TicketStatus.Closed].includes(t.status)
            );
        }
    }, [tickets, activeFilter]);


    return (
        <div className="bg-white p-6 rounded-2xl shadow-lg w-full">
            <h2 className="text-2xl font-bold text-slate-800 mb-6">Live Ticket Monitoring</h2>
            
            <div className="flex items-center border border-slate-200 rounded-lg p-1 bg-slate-100 mb-4 max-w-sm">
              <button 
                onClick={() => setActiveFilter('live')} 
                className={`flex-1 text-center px-3 py-1.5 text-sm font-semibold rounded-md transition-colors ${activeFilter === 'live' ? 'bg-indigo-600 text-white shadow' : 'text-slate-600 hover:bg-white'}`}>
                Live Tickets
              </button>
              <button 
                onClick={() => setActiveFilter('completed')} 
                className={`flex-1 text-center px-3 py-1.5 text-sm font-semibold rounded-md transition-colors ${activeFilter === 'completed' ? 'bg-indigo-600 text-white shadow' : 'text-slate-600 hover:bg-white'}`}>
                Completed Tickets
              </button>
            </div>

             {filteredTickets.length > 0 ? (
                 <div className="space-y-3">
                    <div className="grid grid-cols-[2.5fr,2fr,1.5fr,1.2fr,1fr,40px] gap-x-4 text-left text-xs font-semibold text-slate-500 uppercase tracking-wider px-4">
                        <span>Ticket</span>
                        <span>Pelapor</span>
                        <span>Petugas</span>
                        <span>Prioritas</span>
                        <span>Status</span>
                        <span></span>
                    </div>
                     {filteredTickets.map(ticket => (
                         <AdminTicketRow key={ticket.id} ticket={ticket} onPreviewClick={onPreviewClick} />
                     ))}
                 </div>
             ) : (
                <div className="flex-1 flex flex-col items-center justify-center text-center text-slate-500 py-16">
                    <EmptyStateIcon className="w-24 h-24 text-slate-300 mb-4" />
                    <h3 className="text-xl font-semibold text-slate-700">
                         {activeFilter === 'live' ? 'Tidak Ada Tiket Aktif' : 'Tidak Ada Tiket Selesai'}
                    </h3>
                    <p className="mt-1">
                        {activeFilter === 'live' 
                            ? 'Saat ini tidak ada tiket yang sedang dalam proses.'
                            : 'Tidak ada tiket yang berstatus Selesai atau Ditutup.'
                        }
                    </p>
                </div>
             )}
        </div>
    );
};


const AdminDashboard: React.FC<{
  user: User;
  onLogout: () => void;
  tickets: Ticket[];
}> = ({ user, onLogout, tickets }) => {
  const [activeMenu, setActiveMenu] = useState('monitoring');
  const [previewAttachment, setPreviewAttachment] = useState<Attachment | null>(null);

  const renderContent = () => {
    switch (activeMenu) {
      case 'monitoring':
        return <TicketMonitoringView tickets={tickets} onPreviewClick={setPreviewAttachment} />;
      case 'ratings':
        return <OfficerRatingsView tickets={tickets} />;
      default:
        return null;
    }
  };

  return (
    <>
      <div className="flex h-screen bg-slate-50 font-sans">
        <aside className="w-64 bg-white p-6 shadow-md flex flex-col shrink-0">
          <h1 className="text-2xl font-bold text-slate-800 mb-10">Admin Dashboard</h1>
          <h2 className="text-sm font-semibold text-slate-400 uppercase tracking-wider mb-4">Menu</h2>
          <nav className="flex flex-col space-y-2">
            <button
              type="button"
              onClick={() => setActiveMenu('monitoring')}
              className={`w-full flex items-center text-left px-4 py-3 rounded-lg transition-colors ${
                activeMenu === 'monitoring'
                  ? 'bg-indigo-100 text-indigo-600 font-semibold'
                  : 'text-slate-600 hover:bg-slate-100'
              }`}
            >
              <MonitorIcon className="w-5 h-5 mr-3" />
              <span>Ticket Monitoring</span>
            </button>
            <button
              type="button"
              onClick={() => setActiveMenu('ratings')}
              className={`w-full flex items-center text-left px-4 py-3 rounded-lg transition-colors ${
                activeMenu === 'ratings'
                  ? 'bg-indigo-100 text-indigo-600 font-semibold'
                  : 'text-slate-600 hover:bg-slate-100'
              }`}
            >
              <UsersIcon className="w-5 h-5 mr-3" />
              <span>Officer Ratings</span>
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
      {previewAttachment && (
        <AttachmentPreviewModal attachment={previewAttachment} onClose={() => setPreviewAttachment(null)} />
      )}
    </>
  );
};

export default AdminDashboard;
