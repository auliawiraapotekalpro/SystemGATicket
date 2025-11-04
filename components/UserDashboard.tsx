import React, { useState, useEffect } from 'react';
import { User, Ticket, TicketPriority, TicketStatus, Review } from '../types';
import { PlusCircleIcon } from './icons/PlusCircleIcon';
import { StarIcon } from './icons/StarIcon';
import { LogoutIcon } from './icons/LogoutIcon';
import { UserIcon } from './icons/UserIcon';
import { PencilIcon } from './icons/PencilIcon';
import { BuildingIcon } from './icons/BuildingIcon';
import { UploadIcon } from './icons/UploadIcon';
import { SendIcon } from './icons/SendIcon';
import { TicketListIcon } from './icons/TicketListIcon';
import { EmptyStateIcon } from './icons/EmptyStateIcon';
import { CheckCircleIcon } from './icons/CheckCircleIcon';
import { ChevronDownIcon } from './icons/ChevronDownIcon';
import { XIcon } from './icons/XIcon';
import { SpinnerIcon } from './icons/SpinnerIcon';


interface UserDashboardProps {
  user: User;
  onLogout: () => void;
  onCreateTicket: (ticketData: Omit<Ticket, 'id' | 'status' | 'createdAt' | 'priority' | 'review' | 'attachments'> & { attachments: File[] }) => Promise<void>;
  onUpdateTicket: (ticketId: string, updates: Partial<Ticket>) => void;
  tickets: Ticket[];
}

const subCategoryMap: { [key: string]: string[] } = {
  'AC': ['AC tidak dingin', 'AC berisik', 'AC bocor', 'Lainnya'],
  'Kelistrikan': ['Lampu mati', 'Stop kontak rusak', 'Sekring putus', 'Lainnya'],
  'Perabotan': ['Kursi rusak', 'Meja rusak', 'Lemari rusak', 'Lainnya'],
  'Saluran Air': ['Wastafel mampet', 'Keran bocor', 'Toilet mampet', 'Lainnya'],
};

const formatDate = (date: Date) => {
    return new Intl.DateTimeFormat('en-GB', {
      year: 'numeric',
      month: '2-digit',
      day: '2-digit',
    }).format(date);
  };

const TicketItem: React.FC<{ticket: Ticket}> = ({ ticket }) => {
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
        <div className="bg-white rounded-lg shadow-sm border border-slate-200 p-5 relative border-l-4 border-indigo-500">
            <div className="flex justify-between items-start">
                <div>
                    <h4 className="font-bold text-slate-800 text-lg">{ticket.title}</h4>
                    <p className="text-xs text-slate-500 mt-1">#{ticket.id} • Dibuat pada {formatDate(ticket.createdAt)}</p>
                    <p className="text-sm text-slate-600 mt-3">{ticket.description}</p>
                </div>
                <span className={`px-3 py-1 text-xs font-semibold rounded-full ${getStatusChipStyle(ticket.status)}`}>
                    {ticket.status}
                </span>
            </div>
            <div className="flex items-center gap-4 mt-4">
                <div className={`flex items-center gap-1.5 px-2.5 py-1 text-xs font-medium rounded-md border ${getPriorityChipStyle(ticket.priority)}`}>
                    <ChevronDownIcon className="w-4 h-4"/>
                    <span>{ticket.priority}</span>
                </div>
                 <div className="flex items-center gap-1.5 text-xs font-medium text-slate-500">
                    <svg xmlns="http://www.w3.org/2000/svg" className="h-4 w-4" viewBox="0 0 20 20" fill="currentColor">
                        <path d="M5 4a2 2 0 012-2h6a2 2 0 012 2v1H5V4zM5 7h10v9a2 2 0 01-2 2H7a2 2 0 01-2-2V7z" />
                    </svg>
                    <span>{ticket.category}</span>
                </div>
            </div>
        </div>
    );
};

const StarRatingInput: React.FC<{ rating: number; onRate: (rating: number) => void }> = ({ rating, onRate }) => {
  const [hover, setHover] = useState(0);
  return (
    <div className="flex items-center -ml-1">
      {[...Array(5)].map((_, index) => {
        const ratingValue = index + 1;
        return (
          <button
            type="button"
            key={ratingValue}
            className={`p-1 transition-transform transform hover:scale-125 ${
              ratingValue <= (hover || rating) ? 'text-yellow-400' : 'text-slate-300'
            }`}
            onClick={() => onRate(ratingValue)}
            onMouseEnter={() => setHover(ratingValue)}
            onMouseLeave={() => setHover(0)}
            aria-label={`Rate ${ratingValue} out of 5 stars`}
          >
            <StarIcon className="w-7 h-7" fill="currentColor" strokeWidth="1.5" />
          </button>
        );
      })}
    </div>
  );
};

const ReviewForm: React.FC<{
  user: User;
  tickets: Ticket[];
  onUpdateTicket: (ticketId: string, updates: Partial<Ticket>) => void;
}> = ({ user, tickets, onUpdateTicket }) => {
    
    const [selectedTicketId, setSelectedTicketId] = useState('');
    const [ratings, setRatings] = useState<{ [key: string]: number }>({ attitude: 0, neatness: 0, quality: 0, speed: 0, communication: 0 });
    const [comments, setComments] = useState<{ [key: string]: string }>({ attitude: '', neatness: '', quality: '', speed: '', communication: '' });
    const [reviewSuccess, setReviewSuccess] = useState(false);
    const [isSubmitting, setIsSubmitting] = useState(false);

    const completedAndUnreviewedTickets = tickets.filter(
        (ticket) => ticket.unit === user.username && ticket.status === TicketStatus.Completed && !ticket.review
    );
    const selectedTicket = tickets.find(t => t.id === selectedTicketId);

    const handleReviewSubmit = async (e: React.FormEvent<HTMLFormElement>) => {
        e.preventDefault();
        if (!selectedTicketId || Object.values(ratings).some(r => r === 0)) {
          alert('Mohon pilih tiket dan berikan rating bintang untuk semua kriteria wajib.');
          return;
        }
        
        setIsSubmitting(true);
        try {
            const reviewData: Review = {
              attitude: ratings.attitude,
              attitudeComment: comments.attitude,
              neatness: ratings.neatness,
              neatnessComment: comments.neatness,
              quality: ratings.quality,
              qualityComment: comments.quality,
              speed: ratings.speed,
              speedComment: comments.speed,
              communication: ratings.communication,
              communicationComment: comments.communication,
              reviewedAt: new Date(),
            };

            await onUpdateTicket(selectedTicketId, { review: reviewData, status: TicketStatus.Closed });
            
            setReviewSuccess(true);
            setSelectedTicketId('');
            setRatings({ attitude: 0, neatness: 0, quality: 0, speed: 0, communication: 0 });
            setComments({ attitude: '', neatness: '', quality: '', speed: '', communication: '' });
            
            setTimeout(() => setReviewSuccess(false), 5000);
        } catch (error) {
            console.error("Failed to submit review:", error);
            alert("Gagal mengirim review. Mohon coba lagi.");
        } finally {
            setIsSubmitting(false);
        }
    };
    
    const reviewCriteria = [
        { id: 'attitude', label: 'Sikap & Etika Kerja' },
        { id: 'neatness', label: 'Kerapihan & Kebersihan' },
        { id: 'quality', label: 'Kualitas Hasil Pekerjaan' },
        { id: 'speed', label: 'Kecepatan & Ketepatan Waktu' },
        { id: 'communication', label: 'Penjelasan & Komunikasi' },
    ];

    const isFormSubmittable = selectedTicketId && Object.values(ratings).every((r: number) => r > 0) && !isSubmitting;

    return (
        <div className="bg-white p-8 rounded-2xl shadow-lg w-full max-w-3xl mx-auto">
            <div className="flex items-center mb-8 justify-center">
                <StarIcon className="w-8 h-8 text-indigo-500 mr-3" />
                <h2 className="text-2xl font-bold text-slate-800">Beri Review Kinerja Petugas</h2>
            </div>
            
            {reviewSuccess && (
                <div className="flex items-center p-4 mb-4 text-sm text-green-800 rounded-lg bg-green-100 border border-green-200" role="alert">
                    <CheckCircleIcon className="w-5 h-5 mr-3"/>
                    <span className="font-medium">Terima kasih! Review Anda telah berhasil dikirim.</span>
                </div>
            )}
            
            {completedAndUnreviewedTickets.length === 0 && !reviewSuccess ? (
                 <div className="text-center text-slate-500 py-10">
                    <EmptyStateIcon className="w-20 h-20 text-slate-300 mx-auto mb-4" />
                    <h3 className="text-lg font-semibold text-slate-700">Tidak Ada Tiket untuk Direview</h3>
                    <p className="mt-1 text-sm">Saat ini tidak ada tiket yang sudah selesai dan menunggu review Anda.</p>
                </div>
            ) : (
                <form onSubmit={handleReviewSubmit} className="space-y-6">
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                        <div>
                            <label htmlFor="ticket-select" className="block text-sm font-medium text-slate-700 mb-1">Pilih Tiket yang Sudah Selesai</label>
                            <div className="relative">
                                <select id="ticket-select" value={selectedTicketId} onChange={e => setSelectedTicketId(e.target.value)} required className="w-full appearance-none bg-white border border-slate-300 rounded-lg px-4 py-3 focus:ring-indigo-500 focus:border-indigo-500 transition">
                                    <option value="" disabled>-- Pilih Tiket --</option>
                                    {completedAndUnreviewedTickets.map(ticket => (
                                        <option key={ticket.id} value={ticket.id}>{ticket.id} - {ticket.title}</option>
                                    ))}
                                </select>
                                <ChevronDownIcon className="w-5 h-5 text-slate-400 absolute top-1/2 right-4 -translate-y-1/2 pointer-events-none" />
                            </div>
                        </div>
                        <div>
                            <label htmlFor="officer-name" className="block text-sm font-medium text-slate-700 mb-1">Petugas</label>
                            <input id="officer-name" type="text" value={selectedTicket?.assignedOfficer || '-- Pilih Petugas --'} disabled className="w-full px-4 py-3 border border-slate-200 rounded-lg bg-slate-100 text-slate-500 cursor-not-allowed" />
                        </div>
                    </div>

                    <div className="space-y-6 pt-4 border-t border-slate-200">
                        {reviewCriteria.map((criterion, index) => (
                             <div key={criterion.id} className="space-y-2">
                                <label className="font-semibold text-slate-800">{index + 1}. {criterion.label} <span className="text-red-500">*</span></label>
                                <StarRatingInput rating={ratings[criterion.id]} onRate={(rate) => setRatings(prev => ({ ...prev, [criterion.id]: rate }))} />
                                <textarea 
                                    placeholder={`Jelaskan penilaian Anda tentang ${criterion.label.toLowerCase()}...`} 
                                    value={comments[criterion.id]}
                                    onChange={(e) => setComments(prev => ({...prev, [criterion.id]: e.target.value}))}
                                    rows={2} 
                                    className="w-full mt-2 px-4 py-2 border border-slate-200 rounded-lg focus:ring-indigo-500 focus:border-indigo-500 transition"
                                ></textarea>
                            </div>
                        ))}
                    </div>

                    <div className="pt-4">
                        <button type="submit" disabled={!isFormSubmittable} className="w-full flex items-center justify-center py-3 px-4 border border-transparent rounded-lg shadow-sm text-sm font-medium text-white bg-indigo-600 hover:bg-indigo-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-indigo-500 transition-transform transform hover:scale-105 disabled:bg-indigo-300 disabled:cursor-not-allowed disabled:transform-none">
                            {isSubmitting ? <SpinnerIcon className="w-5 h-5 mr-2" /> : <SendIcon className="w-5 h-5 mr-2" />}
                            {isSubmitting ? 'Mengirim...' : 'Kirim Review'}
                        </button>
                    </div>
                </form>
            )}
        </div>
    );
};


const UserDashboard: React.FC<UserDashboardProps> = ({ user, onLogout, onCreateTicket, onUpdateTicket, tickets }) => {
  const [activeMenu, setActiveMenu] = useState('Buat & Lihat Tiket');
  const [showSuccessMessage, setShowSuccessMessage] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);
  
  // Form state
  const [reporterName, setReporterName] = useState('');
  const [title, setTitle] = useState('');
  const [selectedCategory, setSelectedCategory] = useState('');
  const [subCategories, setSubCategories] = useState<string[]>([]);
  const [selectedSubCategory, setSelectedSubCategory] = useState('');
  const [description, setDescription] = useState('');
  const [attachments, setAttachments] = useState<{ id: string; file: File }[]>([]);
  
  const [activeFilter, setActiveFilter] = useState<'all' | 'reviewed' | 'unreviewed'>('all');

  const userTickets = tickets
    .filter(ticket => ticket.unit === user.username)
    .sort((a, b) => b.createdAt.getTime() - a.createdAt.getTime());
    
  const filteredTickets = userTickets.filter(ticket => {
    if (activeFilter === 'reviewed') return !!ticket.review;
    if (activeFilter === 'unreviewed') return !ticket.review;
    return true;
  });


  const completedAndUnreviewedTicketsCount = tickets.filter(
    (ticket) => ticket.unit === user.username && ticket.status === TicketStatus.Completed && !ticket.review
  ).length;


  const handleCategoryChange = (e: React.ChangeEvent<HTMLSelectElement>) => {
    const category = e.target.value;
    setSelectedCategory(category);
    setSelectedSubCategory(''); // Reset sub-category when category changes
    setSubCategories(subCategoryMap[category] || []);
  };

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files) {
      const newFiles = Array.from(e.target.files).map(file => ({
        id: crypto.randomUUID(),
        file: file,
      }));
      setAttachments(prev => [...prev, ...newFiles]);
    }
    e.target.value = ''; // Allow selecting the same file again
  };

  const handleRemoveAttachment = (idToRemove: string) => {
    setAttachments(prev => prev.filter(attachment => attachment.id !== idToRemove));
  };

  const handleSubmit = async (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    if (!reporterName || !title || !selectedCategory || !selectedSubCategory || !description) {
      alert('Mohon lengkapi semua field sebelum mengirim tiket.');
      return;
    }

    setIsSubmitting(true);
    try {
        await onCreateTicket({
          reporterName,
          title,
          unit: user.username,
          category: selectedCategory,
          subCategory: selectedSubCategory,
          description,
          attachments: attachments.map(a => a.file),
        });

        // Reset form and show success message
        setReporterName('');
        setTitle('');
        setSelectedCategory('');
        setSelectedSubCategory('');
        setSubCategories([]);
        setDescription('');
        setAttachments([]);
        setShowSuccessMessage(true);
        setTimeout(() => setShowSuccessMessage(false), 5000);

    } catch (error) {
        console.error("Failed to create ticket:", error);
        alert("Gagal membuat tiket. Mohon periksa koneksi Anda dan coba lagi.");
    } finally {
        setIsSubmitting(false);
    }
  };

  const renderTicketCreationAndList = () => (
    <div className="grid grid-cols-1 lg:grid-cols-2 gap-8 items-start">
        {/* Create Ticket Form */}
        <div className="bg-white p-8 rounded-2xl shadow-lg w-full">
        <div className="flex items-center mb-6">
            <PlusCircleIcon className="w-7 h-7 text-indigo-500 mr-3" />
            <h2 className="text-xl font-bold text-slate-800">Buat Tiket Baru</h2>
        </div>
        <form className="space-y-5" onSubmit={handleSubmit}>
            <div className="relative">
            <UserIcon className="w-5 h-5 text-slate-400 absolute top-1/2 left-4 -translate-y-1/2" />
            <input type="text" placeholder="Nama Anda" value={reporterName} onChange={(e) => setReporterName(e.target.value)} required className="w-full pl-12 pr-4 py-3 border border-slate-200 rounded-lg focus:ring-indigo-500 focus:border-indigo-500 transition" />
            </div>
            <div className="relative">
            <PencilIcon className="w-5 h-5 text-slate-400 absolute top-1/2 left-4 -translate-y-1/2" />
            <input type="text" placeholder="Judul Laporan" value={title} onChange={(e) => setTitle(e.target.value)} required className="w-full pl-12 pr-4 py-3 border border-slate-200 rounded-lg focus:ring-indigo-500 focus:border-indigo-500 transition" />
            </div>
            <div className="relative">
            <BuildingIcon className="w-5 h-5 text-slate-400 absolute top-1/2 left-4 -translate-y-1/2" />
            <input type="text" value={user.username} disabled className="w-full pl-12 pr-4 py-3 border border-slate-200 rounded-lg bg-slate-100 text-slate-500 cursor-not-allowed" />
            </div>
            <select 
                value={selectedCategory}
                onChange={handleCategoryChange}
                required
                className="w-full px-4 py-3 border border-slate-200 rounded-lg focus:ring-indigo-500 focus:border-indigo-500 transition text-slate-500"
            >
            <option value="">Kategori</option>
            <option value="AC">AC</option>
            <option value="Kelistrikan">Kelistrikan</option>
            <option value="Perabotan">Perabotan</option>
            <option value="Saluran Air">Saluran Air</option>
            </select>
            <select 
                value={selectedSubCategory}
                onChange={(e) => setSelectedSubCategory(e.target.value)}
                disabled={!selectedCategory}
                required
                className="w-full px-4 py-3 border border-slate-200 rounded-lg focus:ring-indigo-500 focus:border-indigo-500 transition text-slate-500 disabled:bg-slate-100 disabled:cursor-not-allowed"
            >
                <option value="">Sub Kategori</option>
                {subCategories.map(subCat => (
                <option key={subCat} value={subCat}>{subCat}</option>
                ))}
            </select>
            <div>
                <label htmlFor="file-upload" className="w-full cursor-pointer flex items-center justify-center py-3 px-4 border border-dashed border-slate-300 rounded-lg text-sm font-medium text-slate-500 bg-slate-50 hover:bg-slate-100 focus:outline-none transition-colors">
                    <UploadIcon className="w-5 h-5 mr-2" />
                    <span>Upload Lampiran</span>
                </label>
                <input 
                    id="file-upload" 
                    name="file-upload" 
                    type="file" 
                    multiple 
                    className="sr-only" 
                    onChange={handleFileChange}
                />
                {attachments.length > 0 && (
                    <div className="mt-3 space-y-2">
                        <ul className="space-y-1">
                            {attachments.map((attachment) => (
                                <li key={attachment.id} className="flex items-center justify-between text-sm text-slate-700 bg-slate-100 px-3 py-1.5 rounded-md">
                                    <span className="truncate mr-2" title={attachment.file.name}>{attachment.file.name}</span>
                                    <button type="button" onClick={() => handleRemoveAttachment(attachment.id)} className="p-1 text-red-500 hover:text-red-700 rounded-full hover:bg-red-100 flex-shrink-0" aria-label={`Remove ${attachment.file.name}`}>
                                        <XIcon className="w-4 h-4" />
                                    </button>
                                </li>
                            ))}
                        </ul>
                    </div>
                )}
            </div>
            <textarea placeholder="Deskripsi detail laporan Anda..." value={description} onChange={(e) => setDescription(e.target.value)} required rows={4} className="w-full px-4 py-3 border border-slate-200 rounded-lg focus:ring-indigo-500 focus:border-indigo-500 transition"></textarea>
            
            {isSubmitting && (
                <div className="flex items-center p-4 text-sm text-blue-800 rounded-lg bg-blue-100" role="status">
                    <SpinnerIcon className="w-4 h-4 mr-3 flex-shrink-0" />
                    <div>
                        <span className="font-medium">Submitting...</span> Uploading attachments and creating ticket. Please wait.
                    </div>
                </div>
            )}

            {showSuccessMessage && (
            <div className="flex items-center p-4 text-sm text-green-800 rounded-lg bg-green-100 border border-green-200" role="alert">
                <CheckCircleIcon className="w-5 h-5 mr-3"/>
                <span className="font-medium">Tiket berhasil dibuat!</span> 
            </div>
            )}

            <button type="submit" disabled={isSubmitting} className="w-full flex items-center justify-center py-3 px-4 border border-transparent rounded-lg shadow-sm text-sm font-medium text-white bg-indigo-600 hover:bg-indigo-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-indigo-500 transition-transform transform hover:scale-105 disabled:bg-indigo-300 disabled:cursor-not-allowed">
              {isSubmitting ? <SpinnerIcon className="w-5 h-5 mr-2" /> : <SendIcon className="w-5 h-5 mr-2" />}
              {isSubmitting ? 'Mengirim...' : 'Submit Ticket'}
            </button>
        </form>
        </div>

        {/* Submitted Tickets */}
        <div className="bg-white p-8 rounded-2xl shadow-lg w-full">
            <div className="flex items-center mb-6">
                <TicketListIcon className="w-7 h-7 text-indigo-500 mr-3" />
                <h2 className="text-xl font-bold text-slate-800">My Submitted Tickets</h2>
            </div>

            <div className="flex items-center border border-slate-200 rounded-lg p-1 bg-slate-100 mb-4">
              <button 
                onClick={() => setActiveFilter('all')} 
                className={`flex-1 text-center px-3 py-1.5 text-sm font-semibold rounded-md transition-colors ${activeFilter === 'all' ? 'bg-indigo-600 text-white shadow' : 'text-slate-600 hover:bg-white'}`}>
                Semua
              </button>
              <button 
                onClick={() => setActiveFilter('reviewed')} 
                className={`flex-1 text-center px-3 py-1.5 text-sm font-semibold rounded-md transition-colors ${activeFilter === 'reviewed' ? 'bg-indigo-600 text-white shadow' : 'text-slate-600 hover:bg-white'}`}>
                Sudah Direview
              </button>
              <button 
                onClick={() => setActiveFilter('unreviewed')} 
                className={`flex-1 text-center px-3 py-1.5 text-sm font-semibold rounded-md transition-colors ${activeFilter === 'unreviewed' ? 'bg-indigo-600 text-white shadow' : 'text-slate-600 hover:bg-white'}`}>
                Belum Direview
              </button>
            </div>

            <div className="flex-1 flex flex-col space-y-4">
                {userTickets.length > 0 ? (
                  filteredTickets.length > 0 ? (
                    filteredTickets.map(ticket => <TicketItem key={ticket.id} ticket={ticket} />)
                  ) : (
                    <div className="text-center text-slate-500 py-10">
                      <EmptyStateIcon className="w-16 h-16 text-slate-300 mx-auto mb-4" />
                      <h3 className="text-lg font-semibold text-slate-700">Tidak Ada Tiket</h3>
                      <p className="mt-1 text-sm">Tidak ada tiket yang cocok dengan filter yang dipilih.</p>
                    </div>
                  )
                ) : (
                <div className="text-center text-slate-500 py-10">
                    <EmptyStateIcon className="w-20 h-20 text-slate-300 mx-auto mb-4" />
                    <h3 className="text-lg font-semibold text-slate-700">Belum Ada Tiket</h3>
                    <p className="mt-1 text-sm">Buat tiket baru menggunakan formulir di sebelah kiri.</p>
                </div>
                )}
            </div>
        </div>
    </div>
  );


  return (
    <div className="flex h-screen bg-slate-50 font-sans">
      {/* Sidebar */}
      <aside className="w-64 bg-white p-6 shadow-md flex flex-col shrink-0">
        <h1 className="text-2xl font-bold text-slate-800 mb-10">User Dashboard</h1>
        <h2 className="text-lg font-bold text-slate-500 uppercase tracking-wider mb-8">Menu</h2>
        <nav className="flex flex-col space-y-2">
          <button
            type="button"
            onClick={() => setActiveMenu('Buat & Lihat Tiket')}
            className={`w-full flex items-center text-left px-4 py-3 rounded-lg transition-colors ${
              activeMenu === 'Buat & Lihat Tiket'
                ? 'bg-indigo-100 text-indigo-600 font-semibold'
                : 'text-slate-600 hover:bg-slate-100'
            }`}
          >
            <PlusCircleIcon className="w-5 h-5 mr-3" />
            <span>Buat & Lihat Tiket</span>
          </button>
          <button
            type="button"
            onClick={() => setActiveMenu('Beri Review')}
            className={`w-full flex items-center justify-between text-left px-4 py-3 rounded-lg transition-colors ${
              activeMenu === 'Beri Review'
                ? 'bg-indigo-100 text-indigo-600 font-semibold'
                : 'text-slate-600 hover:bg-slate-100'
            }`}
          >
            <div className="flex items-center">
                <StarIcon className="w-5 h-5 mr-3" />
                <span>Beri Review</span>
            </div>
            {completedAndUnreviewedTicketsCount > 0 && (
              <span className="bg-indigo-600 text-white text-xs font-bold w-5 h-5 flex items-center justify-center rounded-full">
                {completedAndUnreviewedTicketsCount}
              </span>
            )}
          </button>
        </nav>
      </aside>

      {/* Main Content */}
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
            {activeMenu === 'Beri Review'
                ? <ReviewForm user={user} tickets={tickets} onUpdateTicket={onUpdateTicket} />
                : renderTicketCreationAndList()
            }
        </main>
      </div>
    </div>
  );
};

export default UserDashboard;