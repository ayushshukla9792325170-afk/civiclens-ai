import React, { useState } from 'react';
import { Evidence } from '../../types';
import { Modal } from '../common/Modal';
import { ImageIcon, ShieldCheck, ZoomIn, Eye } from 'lucide-react';

interface EvidenceViewerProps {
  evidenceItems: Evidence[];
}

export const EvidenceViewer: React.FC<EvidenceViewerProps> = ({ evidenceItems }) => {
  const [selectedPhoto, setSelectedPhoto] = useState<Evidence | null>(null);

  if (!evidenceItems || evidenceItems.length === 0) {
    return (
      <div className="p-6 bg-slate-50 border border-dashed border-slate-200 rounded-xl text-center text-xs text-slate-400">
        <ImageIcon className="w-8 h-8 mx-auto mb-2 text-slate-300" />
        No photographic evidence attached to this report.
      </div>
    );
  }

  const initialEvidences = evidenceItems.filter(e => e.evidence_type !== 'RESOLUTION_PROOF');
  const resolutionEvidences = evidenceItems.filter(e => e.evidence_type === 'RESOLUTION_PROOF');

  return (
    <div className="space-y-4">
      {/* Initial Evidence */}
      {initialEvidences.length > 0 && (
        <div>
          <h4 className="text-xs font-bold uppercase tracking-wider text-slate-500 mb-2 flex items-center gap-1.5">
            <ImageIcon className="w-3.5 h-3.5 text-slate-400" />
            Reported Evidence ({initialEvidences.length})
          </h4>
          <div className="grid grid-cols-2 sm:grid-cols-3 gap-3">
            {initialEvidences.map((item) => (
              <button
                key={item.id}
                type="button"
                onClick={() => setSelectedPhoto(item)}
                className="group relative h-28 sm:h-32 rounded-xl overflow-hidden bg-slate-900 border border-slate-200 focus:outline-none focus-visible:ring-2 focus-visible:ring-teal-500 text-left"
              >
                <img
                  src={item.storage_key}
                  alt={item.original_filename || 'Civic evidence'}
                  className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-200"
                  loading="lazy"
                />
                <div className="absolute inset-0 bg-slate-900/40 opacity-0 group-hover:opacity-100 transition-opacity flex items-center justify-center">
                  <div className="p-1.5 bg-white/90 rounded-full text-slate-900 shadow">
                    <ZoomIn className="w-4 h-4" />
                  </div>
                </div>
              </button>
            ))}
          </div>
        </div>
      )}

      {/* Official Resolution Proof */}
      {resolutionEvidences.length > 0 && (
        <div className="pt-2">
          <h4 className="text-xs font-bold uppercase tracking-wider text-emerald-700 mb-2 flex items-center gap-1.5">
            <ShieldCheck className="w-4 h-4 text-emerald-600" />
            Official Resolution Proof ({resolutionEvidences.length})
          </h4>
          <div className="grid grid-cols-2 sm:grid-cols-3 gap-3">
            {resolutionEvidences.map((item) => (
              <button
                key={item.id}
                type="button"
                onClick={() => setSelectedPhoto(item)}
                className="group relative h-28 sm:h-32 rounded-xl overflow-hidden bg-slate-900 border-2 border-emerald-500 focus:outline-none focus-visible:ring-2 focus-visible:ring-emerald-500 text-left"
              >
                <img
                  src={item.storage_key}
                  alt={item.original_filename || 'Resolution proof'}
                  className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-200"
                  loading="lazy"
                />
                <div className="absolute top-1.5 right-1.5 px-1.5 py-0.5 rounded bg-emerald-600 text-white text-[10px] font-bold shadow">
                  Resolved
                </div>
                <div className="absolute inset-0 bg-slate-900/40 opacity-0 group-hover:opacity-100 transition-opacity flex items-center justify-center">
                  <div className="p-1.5 bg-white/90 rounded-full text-emerald-900 shadow">
                    <ZoomIn className="w-4 h-4" />
                  </div>
                </div>
              </button>
            ))}
          </div>
        </div>
      )}

      {/* Expanded Modal */}
      {selectedPhoto && (
        <Modal
          isOpen={!!selectedPhoto}
          onClose={() => setSelectedPhoto(null)}
          title={selectedPhoto.evidence_type === 'RESOLUTION_PROOF' ? 'Official Municipal Resolution Proof' : 'Initial Citizen Evidence Photo'}
          maxWidth="2xl"
        >
          <div className="space-y-3">
            <div className="w-full max-h-[70vh] bg-slate-950 rounded-xl overflow-hidden flex items-center justify-center">
              <img
                src={selectedPhoto.storage_key}
                alt="Enlarged evidence"
                className="max-h-[70vh] w-auto object-contain"
              />
            </div>
            <div className="flex items-center justify-between text-xs text-slate-500 font-mono px-1">
              <span>File: {selectedPhoto.original_filename || 'Evidence image'}</span>
              <span>Logged: {new Date(selectedPhoto.created_at).toLocaleString()}</span>
            </div>
          </div>
        </Modal>
      )}
    </div>
  );
};
