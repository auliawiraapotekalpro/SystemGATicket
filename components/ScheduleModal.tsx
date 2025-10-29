import React, { useState, useEffect } from 'react';
import { Ticket } from '../types';
import { CalendarIcon } from './icons/CalendarIcon';
import { XIcon } from './icons/XIcon';

interface ScheduleModalProps {
  ticket: Ticket;
  onClose: () => void;
  onConfirm: (ticketId: string, date: Date) => void;
}

const ScheduleModal: React.FC<ScheduleModalProps> = ({ ticket, onClose, onConfirm }) => {
  const [scheduleDate, setScheduleDate] = useState('');

  useEffect(() => {
    // Set today's date as the default value in YYYY-MM-DD format
    const today = new Date();
    const offset = today.getTimezoneOffset();
    const todayWithOffset = new Date(today.getTime() - (offset*60*1000));
    setScheduleDate(todayWithOffset.toISOString().split('T')[0]);
  }, []);

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (scheduleDate) {
      // Robustly parse the date to avoid timezone issues.
      // 'YYYY-MM-DD' from input is treated as local time.
      const parts = scheduleDate.split('-');
      const year = parseInt(parts[0], 10);
      const month = parseInt(parts[1], 10) - 1; // Month is 0-indexed in JS Date
      const day = parseInt(parts[2], 10);
      const selectedDateObject = new Date(year, month, day);
      onConfirm(ticket.id, selectedDateObject);
    }
  };

  // The date input displays in "dd/mm/yyyy" format in browsers with that locale.
  // The user-provided image format "23/10/2025" will be handled automatically by the browser's date input.

  return (
    <div 
      className="fixed inset-0 bg-black bg-opacity-60 flex items-center justify-center z-50 transition-opacity animate-fadeIn"
      onClick={onClose}
      aria-modal="true"
      role="dialog"
    >
      <div 
        className="bg-white rounded-2xl shadow-xl p-8 w-full max-w-md m-4 transform transition-all animate-scaleIn"
        onClick={(e) => e.stopPropagation()}
      >
        <div className="flex justify-between items-start mb-4">
            <h2 className="text-2xl font-bold text-slate-800">Jadwalkan Pengerjaan Tiket</h2>
            <button 
                onClick={onClose} 
                className="p-1 rounded-full text-slate-400 hover:bg-slate-100 hover:text-slate-600"
                aria-label="Close modal"
            >
                <XIcon className="w-5 h-5" />
            </button>
        </div>
        
        <p className="text-slate-600 mb-6">
          Pilih tanggal mulai pengerjaan untuk tiket: <span className="font-semibold text-slate-900">{ticket.title}</span>
        </p>
        
        <form onSubmit={handleSubmit}>
          <div className="relative">
            <label htmlFor="schedule-date" className="sr-only">Tanggal pengerjaan</label>
            <input
              id="schedule-date"
              type="date"
              value={scheduleDate}
              onChange={(e) => setScheduleDate(e.target.value)}
              required
              className="w-full px-4 py-3 border border-slate-300 rounded-lg focus:ring-indigo-500 focus:border-indigo-500 transition"
            />
            <CalendarIcon className="w-5 h-5 text-slate-400 absolute top-1/2 right-4 -translate-y-1/2 pointer-events-none" />
          </div>
          <div className="flex justify-end items-center gap-4 mt-8">
            <button
              type="button"
              onClick={onClose}
              className="px-6 py-2.5 text-sm font-semibold text-slate-700 bg-slate-100 hover:bg-slate-200 rounded-lg transition-colors"
            >
              Batal
            </button>
            <button
              type="submit"
              className="px-6 py-2.5 text-sm font-semibold text-white bg-indigo-600 hover:bg-indigo-700 rounded-lg shadow-sm focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-indigo-500 transition-transform transform hover:scale-105"
            >
              Simpan Jadwal
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};

export default ScheduleModal;