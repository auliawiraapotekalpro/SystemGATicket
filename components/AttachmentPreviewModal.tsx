import React from 'react';
import { XIcon } from './icons/XIcon';
import { DownloadIcon } from './icons/DownloadIcon';
import { Attachment } from '../types';

interface AttachmentPreviewModalProps {
  attachment: Attachment;
  onClose: () => void;
}

const AttachmentPreviewModal: React.FC<AttachmentPreviewModalProps> = ({ attachment, onClose }) => {
  
  const isImage = attachment.name.match(/\.(jpeg|jpg|gif|png|svg)$/i) != null;

  const handleDownload = () => {
    // For Drive URLs, we open them in a new tab as they are viewer links.
    window.open(attachment.url, '_blank');
  };

  return (
    <div 
      className="fixed inset-0 bg-black bg-opacity-75 flex items-center justify-center z-50 p-4 animate-fadeIn"
      onClick={onClose}
      aria-modal="true"
      role="dialog"
    >
      <div 
        className="bg-white rounded-lg shadow-xl w-full max-w-3xl max-h-[90vh] flex flex-col"
        onClick={(e) => e.stopPropagation()}
      >
        <header className="flex justify-between items-center p-4 border-b border-slate-200">
          <h2 className="text-lg font-semibold text-slate-800 truncate pr-4" title={attachment.name}>{attachment.name}</h2>
          <button 
            onClick={onClose} 
            className="p-1 rounded-full text-slate-400 hover:bg-slate-100 hover:text-slate-600"
            aria-label="Close modal"
          >
            <XIcon className="w-5 h-5" />
          </button>
        </header>
        
        <main className="p-4 overflow-auto flex-1 flex items-center justify-center bg-slate-100">
          {isImage ? (
            <img src={attachment.url} alt={`Preview of ${attachment.name}`} className="max-w-full max-h-full object-contain" />
          ) : (
            <div className="text-center text-slate-500 p-8">
              <p className="text-lg font-semibold text-slate-700">Preview not available</p>
              <p className="mt-1">Cannot display a preview for this file type.</p>
               <div className="mt-4 text-sm bg-white border border-slate-200 rounded-lg p-3 inline-block">
                <p><span className="font-semibold">File:</span> {attachment.name}</p>
              </div>
            </div>
          )}
        </main>

        <footer className="flex justify-end p-4 border-t border-slate-200 bg-slate-50">
            <button
                onClick={handleDownload}
                className="flex items-center justify-center py-2 px-4 border border-transparent rounded-lg shadow-sm text-sm font-medium text-white bg-indigo-600 hover:bg-indigo-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-indigo-500 transition-transform transform hover:scale-105"
            >
                <DownloadIcon className="w-5 h-5 mr-2" />
                Buka / Download
            </button>
        </footer>
      </div>
    </div>
  );
};

export default AttachmentPreviewModal;
