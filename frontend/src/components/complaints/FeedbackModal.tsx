import React, { useState } from 'react';
import { Modal } from '../common/Modal';
import { Button } from '../common/Button';
import { Star, MessageSquare } from 'lucide-react';
import { api } from '../../services/api';

interface FeedbackModalProps {
  complaintId: string;
  referenceNumber: string;
  isOpen: boolean;
  onClose: () => void;
  onSuccess: () => void;
}

export const FeedbackModal: React.FC<FeedbackModalProps> = ({
  complaintId,
  referenceNumber,
  isOpen,
  onClose,
  onSuccess,
}) => {
  const [rating, setRating] = useState<number>(5);
  const [hoverRating, setHoverRating] = useState<number>(0);
  const [comment, setComment] = useState<string>('');
  const [loading, setLoading] = useState<boolean>(false);
  const [error, setError] = useState<string | null>(null);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setError(null);
    try {
      await api.submitFeedback(complaintId, rating, comment);
      onSuccess();
      onClose();
    } catch (err: any) {
      setError(err.message || 'Failed to submit citizen feedback.');
    } finally {
      setLoading(false);
    }
  };

  return (
    <Modal
      isOpen={isOpen}
      onClose={onClose}
      title={`Verify & Rate Resolution #${referenceNumber}`}
    >
      <form onSubmit={handleSubmit} className="space-y-4">
        <p className="text-xs text-slate-600 leading-relaxed">
          Please confirm if the municipal team has satisfactorily fixed the problem at your location and share your rating.
        </p>

        {error && (
          <div className="p-3 bg-rose-50 border border-rose-200 text-rose-700 text-xs rounded-lg">
            {error}
          </div>
        )}

        <div className="flex flex-col items-center justify-center p-4 bg-slate-50 rounded-xl border border-slate-200">
          <label className="text-xs font-bold text-slate-700 uppercase mb-2">
            Satisfaction Rating
          </label>
          <div className="flex items-center gap-1.5">
            {[1, 2, 3, 4, 5].map((star) => {
              const active = (hoverRating || rating) >= star;
              return (
                <button
                  key={star}
                  type="button"
                  onClick={() => setRating(star)}
                  onMouseEnter={() => setHoverRating(star)}
                  onMouseLeave={() => setHoverRating(0)}
                  className="p-1.5 focus:outline-none focus-visible:ring-2 focus-visible:ring-teal-500 rounded-md transition-transform hover:scale-110"
                  aria-label={`Rate ${star} of 5 stars`}
                >
                  <Star
                    className={`w-7 h-7 ${
                      active ? 'fill-amber-400 text-amber-400 drop-shadow-xs' : 'text-slate-300'
                    }`}
                  />
                </button>
              );
            })}
          </div>
          <span className="text-xs font-semibold text-slate-600 mt-2">
            {rating === 5 && '🌟 Excellent resolution'}
            {rating === 4 && '👍 Good work'}
            {rating === 3 && '👌 Satisfactory'}
            {rating === 2 && '⚠️ Needs improvement'}
            {rating === 1 && '❌ Unsatisfactory resolution'}
          </span>
        </div>

        <div>
          <label htmlFor="feedback-comment" className="block text-xs font-bold text-slate-700 mb-1">
            Optional Comments
          </label>
          <textarea
            id="feedback-comment"
            rows={3}
            value={comment}
            onChange={(e) => setComment(e.target.value)}
            placeholder="Share any feedback for the municipal workers..."
            className="w-full text-xs p-3 rounded-lg border border-slate-300 focus:outline-none focus:ring-2 focus:ring-teal-500"
            maxLength={500}
          />
        </div>

        <div className="flex items-center justify-end gap-2 pt-2">
          <Button type="button" variant="outline" size="sm" onClick={onClose} disabled={loading}>
            Cancel
          </Button>
          <Button type="submit" variant="primary" size="sm" isLoading={loading}>
            Submit Verification
          </Button>
        </div>
      </form>
    </Modal>
  );
};
