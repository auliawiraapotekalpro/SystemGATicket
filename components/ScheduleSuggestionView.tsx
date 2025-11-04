import React, { useState } from 'react';
import { GoogleGenAI, Type } from '@google/genai';
import { User, Ticket, TicketStatus, TicketPriority } from '../types';
import { WandIcon } from './icons/WandIcon';
import { SpinnerIcon } from './icons/SpinnerIcon';
import { LightbulbIcon } from './icons/LightbulbIcon';


const ai = new GoogleGenAI({ apiKey: process.env.API_KEY });

const responseSchema = {
    type: Type.OBJECT,
    properties: {
        schedule: {
            type: Type.ARRAY,
            description: 'An ordered list of ticket IDs representing the suggested schedule.',
            items: { type: Type.STRING }
        },
        justification: {
            type: Type.STRING,
            description: 'A brief explanation of why this schedule is efficient.'
        }
    },
    required: ['schedule', 'justification']
};


interface ScheduleSuggestionViewProps {
    user: User;
    tickets: Ticket[];
}

interface Suggestion {
    schedule: string[];
    justification: string;
}

const ScheduleSuggestionView: React.FC<ScheduleSuggestionViewProps> = ({ user, tickets }) => {
    const [isLoading, setIsLoading] = useState(false);
    const [suggestion, setSuggestion] = useState<Suggestion | null>(null);
    const [error, setError] = useState<string | null>(null);

    const handleGetSuggestion = async () => {
        setIsLoading(true);
        setSuggestion(null);
        setError(null);

        const relevantTickets = tickets.filter(t =>
            [TicketStatus.Open, TicketStatus.Scheduled].includes(t.status)
        );

        if (relevantTickets.length === 0) {
            setError("No open or scheduled tickets available to create a suggestion.");
            setIsLoading(false);
            return;
        }

        const ticketDataForPrompt = relevantTickets.map(t => ({
            id: t.id,
            title: t.title,
            priority: t.priority,
            unit: t.unit,
            category: t.category,
            subCategory: t.subCategory,
        }));

        const prompt = `Here is a list of tickets for officer ${user.username}: ${JSON.stringify(ticketDataForPrompt)}. Please create an optimal schedule.`;

        try {
            const response = await ai.models.generateContent({
                model: 'gemini-2.5-flash',
                contents: prompt,
                config: {
                    systemInstruction: "You are an expert logistics coordinator for a General Affairs department. Your task is to create an efficient work schedule for an officer based on a list of maintenance tickets. Prioritize high-priority tickets first. Then, group tickets by their 'unit' (location) to minimize travel time. Finally, consider the ticket 'category' to group similar tasks together. Provide the schedule as an ordered list of ticket IDs and a brief justification for your suggested order in a JSON format.",
                    responseMimeType: 'application/json',
                    responseSchema: responseSchema,
                }
            });

            const responseText = response.text.trim();
            const parsedSuggestion: Suggestion = JSON.parse(responseText);
            setSuggestion(parsedSuggestion);

        } catch (err: any) {
            console.error("Failed to get schedule suggestion:", err);
            setError("Sorry, I couldn't generate a schedule suggestion. Please try again later.");
        } finally {
            setIsLoading(false);
        }
    };
    
    const suggestedTickets = suggestion ? suggestion.schedule.map(id => tickets.find(t => t.id === id)).filter(Boolean) as Ticket[] : [];

    return (
        <div className="bg-white p-8 rounded-2xl shadow-lg w-full max-w-4xl mx-auto">
            <div className="text-center">
                <h2 className="text-2xl font-bold text-slate-800">Saran Penjadwalan Cerdas</h2>
                <p className="text-slate-500 mt-2 max-w-2xl mx-auto">
                    Dapatkan rekomendasi urutan pengerjaan tiket yang paling efisien berdasarkan prioritas, lokasi, dan jenis pekerjaan.
                </p>
                <button
                    onClick={handleGetSuggestion}
                    disabled={isLoading}
                    className="mt-6 inline-flex items-center justify-center py-3 px-6 border border-transparent rounded-lg shadow-sm text-sm font-medium text-white bg-indigo-600 hover:bg-indigo-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-indigo-500 transition-transform transform hover:scale-105 disabled:bg-indigo-300 disabled:cursor-not-allowed"
                >
                    {isLoading ? <SpinnerIcon className="w-5 h-5 mr-2" /> : <WandIcon className="w-5 h-5 mr-2" />}
                    {isLoading ? 'Menganalisis...' : 'Buat Rekomendasi Jadwal'}
                </button>
            </div>
            
            {error && <p className="text-center text-red-600 mt-4">{error}</p>}
            
            {suggestion && suggestedTickets.length > 0 && (
                <div className="mt-8 animate-fadeIn">
                    <div className="bg-indigo-50 border-l-4 border-indigo-500 p-4 rounded-r-lg mb-6">
                         <div className="flex">
                            <div className="flex-shrink-0">
                                <LightbulbIcon className="h-6 w-6 text-indigo-600" />
                            </div>
                            <div className="ml-3">
                                <h3 className="text-md font-bold text-indigo-800">Justifikasi Jadwal</h3>
                                <div className="mt-2 text-sm text-indigo-700">
                                    <p>{suggestion.justification}</p>
                                </div>
                            </div>
                        </div>
                    </div>
                    
                    <h3 className="text-xl font-bold text-slate-800 mb-4">Urutan Pengerjaan yang Disarankan:</h3>
                    <div className="space-y-3">
                        {suggestedTickets.map((ticket, index) => (
                             <div key={ticket.id} className="bg-slate-50 border border-slate-200 rounded-lg p-4 flex items-center gap-4">
                                <span className="flex items-center justify-center w-8 h-8 rounded-full bg-indigo-600 text-white font-bold text-lg flex-shrink-0">{index + 1}</span>
                                <div className="flex-grow">
                                    <p className="font-bold text-slate-800">{ticket.title}</p>
                                    <p className="text-sm text-slate-500">#{ticket.id} • {ticket.category}</p>
                                </div>
                                <div className="text-right flex-shrink-0">
                                    <p className="font-semibold text-slate-700">{ticket.unit}</p>
                                    <p className={`text-sm font-medium ${
                                        ticket.priority === TicketPriority.High ? 'text-red-600' :
                                        ticket.priority === TicketPriority.Medium ? 'text-orange-600' : 'text-gray-600'
                                    }`}>{ticket.priority}</p>
                                </div>
                            </div>
                        ))}
                    </div>
                </div>
            )}
        </div>
    );
};

export default ScheduleSuggestionView;