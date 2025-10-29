import React from 'react';
import { User, Ticket, Review } from '../types';
import { StarIcon } from './icons/StarIcon';
import { EmptyStateIcon } from './icons/EmptyStateIcon';

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

const RatingView: React.FC<{ user: User; tickets: Ticket[] }> = ({ user, tickets }) => {
  const reviewedTickets = tickets
    .filter((ticket) => ticket.assignedOfficer === user.username && ticket.review)
    .sort((a, b) => (b.review?.reviewedAt.getTime() || 0) - (a.review?.reviewedAt.getTime() || 0));

  if (reviewedTickets.length === 0) {
    return (
      <div className="text-center text-slate-500 py-16 bg-white rounded-2xl shadow-lg">
        <EmptyStateIcon className="w-24 h-24 text-slate-300 mx-auto mb-4" />
        <h3 className="text-xl font-semibold text-slate-700">Belum Ada Rating</h3>
        <p className="mt-1">Saat ini belum ada ulasan yang diberikan oleh user.</p>
      </div>
    );
  }

  const totalReviews = reviewedTickets.length;
  const initialSums = { attitude: 0, neatness: 0, quality: 0, speed: 0, communication: 0 };
  
  const ratingSums = reviewedTickets.reduce((acc, ticket) => {
    if (ticket.review) {
      acc.attitude += ticket.review.attitude;
      acc.neatness += ticket.review.neatness;
      acc.quality += ticket.review.quality;
      acc.speed += ticket.review.speed;
      acc.communication += ticket.review.communication;
    }
    return acc;
  }, initialSums);

  const averageRatings = {
    attitude: parseFloat((ratingSums.attitude / totalReviews).toFixed(1)),
    neatness: parseFloat((ratingSums.neatness / totalReviews).toFixed(1)),
    quality: parseFloat((ratingSums.quality / totalReviews).toFixed(1)),
    speed: parseFloat((ratingSums.speed / totalReviews).toFixed(1)),
    communication: parseFloat((ratingSums.communication / totalReviews).toFixed(1)),
  };

  const ratingCriteria: {id: keyof typeof averageRatings, label: string}[] = [
    { id: 'attitude', label: 'Sikap & Etika Kerja' },
    { id: 'neatness', label: 'Kerapihan & Kebersihan' },
    { id: 'quality', label: 'Kualitas Hasil Pekerjaan' },
    { id: 'speed', label: 'Kecepatan & Ketepatan Waktu' },
    { id: 'communication', label: 'Penjelasan & Komunikasi' },
  ];

  const formatDate = (date: Date) => {
    return new Intl.DateTimeFormat('en-US', {
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


  return (
    <div className="space-y-8">
      <div>
        <h2 className="text-2xl font-bold text-slate-800 mb-4">Ringkasan Rating Petugas</h2>
        <div className="bg-white p-6 rounded-2xl shadow-lg w-full max-w-md">
          <h3 className="text-xl font-bold text-indigo-600">{user.username}</h3>
          <p className="text-sm text-slate-500 mb-6">Total {totalReviews} ulasan</p>
          <div className="space-y-3">
            {ratingCriteria.map(criterion => (
              <div key={criterion.id} className="flex justify-between items-center">
                <span className="text-slate-600 font-medium">{criterion.label}</span>
                <div className="flex items-center gap-2">
                  <StarRatingDisplay rating={averageRatings[criterion.id]} />
                  <span className="font-bold text-slate-700 w-8 text-right">{averageRatings[criterion.id].toFixed(1)}</span>
                </div>
              </div>
            ))}
          </div>
        </div>
      </div>

      <div>
        <h2 className="text-2xl font-bold text-slate-800 mb-4">Detail Ulasan</h2>
        <div className="space-y-4">
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

export default RatingView;