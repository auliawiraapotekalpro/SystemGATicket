
import React, { useState, useEffect } from 'react';
import LoginPage from './components/LoginPage';
import UserDashboard from './components/UserDashboard';
import OfficerDashboard from './components/OfficerDashboard';
import AdminDashboard from './components/AdminDashboard';
import { User, Role, Ticket, TicketStatus, TicketPriority, Review, Attachment } from './types';

// IMPORTANT: Replace this with your Google Apps Script Web App URL
const SCRIPT_URL = 'https://script.google.com/macros/s/AKfycbymB3OaMWIT7ikfoaVsjnJrwZ9-os8dpKT7-QLERbu7oNo5E23lyLnFNDUSpDQLpZyu/exec';

// Utility to convert File object to a base64 string
const fileToBase64 = (file: File): Promise<string> => {
  return new Promise((resolve, reject) => {
    const reader = new FileReader();
    reader.readAsDataURL(file);
    reader.onload = () => resolve((reader.result as string).split(',')[1]);
    reader.onerror = error => reject(error);
  });
};

// API call helper
async function callGoogleScript(action: string, payload: object = {}) {
    const res = await fetch(SCRIPT_URL, {
        method: 'POST',
        headers: {
            'Content-Type': 'text/plain;charset=utf-8', // Use text/plain for GAS POST requests
        },
        body: JSON.stringify({ action, payload }),
    });

    if (!res.ok) {
        throw new Error(`HTTP error! status: ${res.status}`);
    }

    const result = await res.json();

    if (!result.success) {
        throw new Error(result.error || 'An unknown error occurred with the API.');
    }
    
    return result.data;
}


const App: React.FC = () => {
  const [currentUser, setCurrentUser] = useState<User | null>(null);
  const [loginError, setLoginError] = useState<string | null>(null);
  const [tickets, setTickets] = useState<Ticket[]>([]);
  const [isLoading, setIsLoading] = useState(false);

  const parseTicketDates = (ticketData: any): Ticket => {
    let attachments: Attachment[] = [];
    // Safely parse attachments which may come as a JSON string from Google Sheets
    if (ticketData.attachments) {
      if (typeof ticketData.attachments === 'string' && ticketData.attachments.trim().startsWith('[')) {
        try {
          attachments = JSON.parse(ticketData.attachments);
        } catch (e) {
          console.error("Failed to parse attachments JSON:", ticketData.attachments, e);
          attachments = []; // Default to empty array on parsing error
        }
      } else if (Array.isArray(ticketData.attachments)) {
          attachments = ticketData.attachments;
      }
    }
    
    return {
      ...ticketData,
      attachments,
      createdAt: new Date(ticketData.createdAt),
      scheduledAt: ticketData.scheduledAt ? new Date(ticketData.scheduledAt) : null,
      startedAt: ticketData.startedAt ? new Date(ticketData.startedAt) : null,
      completedAt: ticketData.completedAt ? new Date(ticketData.completedAt) : null,
      review: ticketData.review ? {
          ...ticketData.review,
          reviewedAt: new Date(ticketData.review.reviewedAt),
      } : undefined,
    };
  };

  useEffect(() => {
    const fetchTickets = async () => {
        if (currentUser) {
            setIsLoading(true);
            try {
                const fetchedTickets = await callGoogleScript('getTickets');
                setTickets(fetchedTickets.map(parseTicketDates));
            } catch (error) {
                console.error("Failed to fetch tickets:", error);
                alert("Could not load ticket data. Please try again later.");
            } finally {
                setIsLoading(false);
            }
        }
    };

    fetchTickets();
  }, [currentUser]);


  const handleLogin = async (username: string, password: string): Promise<void> => {
    setIsLoading(true);
    setLoginError(null);
    try {
        const data = await callGoogleScript('login', { username, password });
        setCurrentUser(data.user);
    } catch (error: any) {
        setLoginError(error.message || 'Invalid username or password.');
    } finally {
        setIsLoading(false);
    }
  };

  const handleLogout = (): void => {
    setCurrentUser(null);
    setTickets([]);
  };

  // FIX: Added 'attachments' to Omit to prevent type collision.
  // The original type for `newTicketData` incorrectly kept `attachments?: Attachment[]` from the `Ticket` type,
  // causing a conflict with the `& { attachments: File[] }` extension. This led to type errors
  // when processing `newTicketData.attachments` as `File[]`.
  const handleCreateTicket = async (newTicketData: Omit<Ticket, 'id' | 'status' | 'createdAt' | 'priority' | 'review' | 'attachments'> & { attachments: File[] }) => {
    
    // 1. Upload attachments if any
    const uploadedAttachments: Attachment[] = [];
    if (newTicketData.attachments && newTicketData.attachments.length > 0) {
        const uploadPromises = newTicketData.attachments.map(async (file) => {
            const base64Data = await fileToBase64(file);
            return callGoogleScript('uploadFile', {
                fileName: file.name,
                mimeType: file.type,
                data: base64Data,
            });
        });

        const results = await Promise.all(uploadPromises);
        uploadedAttachments.push(...results);
    }

    // 2. Create the ticket with attachment data
    const ticketPayload = {
        ...newTicketData,
        attachments: uploadedAttachments, // Send attachment metadata, not File objects
    };

    const newTicketFromServer = await callGoogleScript('createTicket', ticketPayload);
    setTickets(prevTickets => [...prevTickets, parseTicketDates(newTicketFromServer)]);
  };

  const handleUpdateTicket = async (ticketId: string, updates: Partial<Ticket>) => {
    const updatedTicketFromServer = await callGoogleScript('updateTicket', { ticketId, updates });
    setTickets(prevTickets =>
      prevTickets.map(ticket =>
        ticket.id === ticketId ? parseTicketDates(updatedTicketFromServer) : ticket
      )
    );
  };

  if (isLoading && !currentUser) {
    return (
        <div className="min-h-screen bg-slate-100 flex items-center justify-center p-4">
            <div className="text-center">
                <p className="text-slate-600">Loading...</p>
            </div>
        </div>
    )
  }

  if (!currentUser) {
    return (
      <div className="min-h-screen bg-slate-100 flex items-center justify-center p-4">
        <LoginPage onLogin={handleLogin} error={loginError} />
      </div>
    );
  }

  // A simple loading overlay for data fetching after login
  const renderLoadingOverlay = () => (
    <div className="absolute inset-0 bg-white bg-opacity-75 flex items-center justify-center z-50">
        <p className="text-slate-600 text-lg">Loading data...</p>
    </div>
  );

  switch (currentUser.role) {
    case Role.User:
      return <div className="relative"><UserDashboard user={currentUser} onLogout={handleLogout} onCreateTicket={handleCreateTicket} tickets={tickets} onUpdateTicket={handleUpdateTicket} />{isLoading && renderLoadingOverlay()}</div>;
    case Role.Officer:
      return <div className="relative"><OfficerDashboard user={currentUser} onLogout={handleLogout} tickets={tickets} onUpdateTicket={handleUpdateTicket} />{isLoading && renderLoadingOverlay()}</div>;
    case Role.Admin:
      return <div className="relative"><AdminDashboard user={currentUser} onLogout={handleLogout} tickets={tickets} />{isLoading && renderLoadingOverlay()}</div>;
    default:
      return (
         <div className="min-h-screen bg-slate-100 flex items-center justify-center p-4">
           <LoginPage onLogin={handleLogin} error={loginError} />
        </div>
      );
  }
};

export default App;