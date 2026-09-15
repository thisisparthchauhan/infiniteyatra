import React, { useCallback, useEffect, useState } from 'react';
import { Upload, FileText, Trash2, Loader, CheckCircle, AlertCircle, Eye } from 'lucide-react';
import {
    DOCUMENT_TYPES,
    uploadTravellerDocument,
    listBookingDocuments,
    deleteBookingDocument,
    getOwnDocumentObjectUrl,
    toDocumentMessage,
    validateFile,
} from '../../services/packageBookingDocumentsApi';

/**
 * PB-3 — Traveller document upload, shown after the booking exists.
 *
 * Documents are deliberately collected here rather than inside the booking
 * form: the booking already has a stable id and reference, so a failed upload
 * can never cost the customer their booking, and a retry can never create a
 * second one.
 *
 * Files live only as transient File objects during the upload interaction —
 * nothing is written to localStorage or sessionStorage.
 */
const REVIEW_LABEL = {
    UPLOADED: { text: 'Uploaded', cls: 'bg-blue-100 text-blue-800 border-blue-200' },
    UNDER_REVIEW: { text: 'Under review', cls: 'bg-amber-100 text-amber-800 border-amber-200' },
    APPROVED: { text: 'Approved', cls: 'bg-green-100 text-green-800 border-green-200' },
    REJECTED: { text: 'Needs replacing', cls: 'bg-red-100 text-red-800 border-red-200' },
};

const BookingDocumentsUpload = ({ bookingId, travellers = [], onStatusChange }) => {
    const [documents, setDocuments] = useState([]);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState('');
    const [busyKey, setBusyKey] = useState(null);
    const [progress, setProgress] = useState(0);

    const refresh = useCallback(async () => {
        try {
            const { documents: docs, documentStatus } = await listBookingDocuments(bookingId);
            setDocuments(docs);
            onStatusChange?.(documentStatus);
            setError('');
        } catch (err) {
            setError(toDocumentMessage(err));
        } finally {
            setLoading(false);
        }
    }, [bookingId, onStatusChange]);

    useEffect(() => { refresh(); }, [refresh]);

    const handleUpload = async (travellerId, documentType, file, existingDocumentId) => {
        const clientError = validateFile(file);
        if (clientError) { setError(clientError); return; }

        const key = `${travellerId}:${documentType}`;
        setBusyKey(key);
        setProgress(0);
        setError('');
        try {
            await uploadTravellerDocument({
                bookingId,
                travellerId,
                documentType,
                file,
                documentId: existingDocumentId,
                onProgress: setProgress,
            });
            await refresh();
        } catch (err) {
            setError(toDocumentMessage(err));
        } finally {
            setBusyKey(null);
            setProgress(0);
        }
    };

    const handleRemove = async (documentId) => {
        setBusyKey(documentId);
        setError('');
        try {
            await deleteBookingDocument(bookingId, documentId);
            await refresh();
        } catch (err) {
            setError(toDocumentMessage(err));
        } finally {
            setBusyKey(null);
        }
    };

    const handleView = async (doc) => {
        setError('');
        let url;
        try {
            url = await getOwnDocumentObjectUrl({
                bookingId,
                travellerId: doc.travellerId,
                documentId: doc.documentId,
            });
            window.open(url, '_blank', 'noopener,noreferrer');
        } catch {
            setError('We could not open that document. Please try again.');
        } finally {
            // The object URL is transient by design — nothing durable is kept.
            if (url) setTimeout(() => URL.revokeObjectURL(url), 30000);
        }
    };

    if (loading) {
        return (
            <div className="flex items-center gap-3 text-slate-500 text-sm py-6">
                <Loader className="animate-spin" size={18} /> Loading your documents…
            </div>
        );
    }

    return (
        <div className="space-y-5">
            <div>
                <h3 className="text-lg font-bold text-slate-900">Traveller Documents</h3>
                <p className="text-sm text-slate-600 mt-1">
                    Upload documents for each traveller when you are ready. Your booking is already
                    confirmed as received — documents can be added now or later.
                </p>
            </div>

            {error && (
                <div className="flex items-start gap-2 bg-red-50 border border-red-200 rounded-xl p-3 text-sm text-red-800">
                    <AlertCircle size={16} className="shrink-0 mt-0.5" /> {error}
                </div>
            )}

            {travellers.map((t, idx) => {
                const travellerId = t.travellerId;
                const name = `${t.firstName || ''} ${t.lastName || ''}`.trim() || `Traveller ${idx + 1}`;
                const theirs = documents.filter((d) => d.travellerId === travellerId);

                return (
                    <div key={travellerId || idx} className="border border-slate-200 rounded-2xl p-4 bg-white">
                        <p className="font-bold text-slate-900 text-sm mb-3">{name}</p>

                        {!travellerId ? (
                            <p className="text-xs text-slate-500">
                                This traveller was recorded before document uploads were available.
                                Our team will collect their documents directly.
                            </p>
                        ) : (
                            <>
                                {theirs.length > 0 && (
                                    <ul className="space-y-2 mb-3">
                                        {theirs.map((doc) => {
                                            const badge = REVIEW_LABEL[doc.reviewStatus] || REVIEW_LABEL.UPLOADED;
                                            return (
                                                <li key={doc.documentId} className="flex items-center gap-3 bg-slate-50 border border-slate-200 rounded-xl px-3 py-2">
                                                    <FileText size={16} className="text-slate-500 shrink-0" />
                                                    <div className="flex-1 min-w-0">
                                                        <p className="text-sm font-medium text-slate-800 truncate">
                                                            {DOCUMENT_TYPES.find((dt) => dt.value === doc.documentType)?.label || doc.documentType}
                                                        </p>
                                                        <p className="text-xs text-slate-500 truncate">
                                                            {doc.originalFilename || 'Document'} · {Math.round(doc.fileSize / 1024)} KB
                                                        </p>
                                                    </div>
                                                    <span className={`text-[11px] font-bold px-2 py-1 rounded-full border ${badge.cls}`}>
                                                        {badge.text}
                                                    </span>
                                                    <button
                                                        type="button"
                                                        onClick={() => handleView(doc)}
                                                        className="p-1.5 text-slate-500 hover:text-blue-600 transition-colors"
                                                        title="View document"
                                                    >
                                                        <Eye size={15} />
                                                    </button>
                                                    {doc.reviewStatus !== 'APPROVED' && (
                                                        <button
                                                            type="button"
                                                            onClick={() => handleRemove(doc.documentId)}
                                                            disabled={busyKey === doc.documentId}
                                                            className="p-1.5 text-slate-500 hover:text-red-600 transition-colors disabled:opacity-40"
                                                            title="Remove document"
                                                        >
                                                            {busyKey === doc.documentId
                                                                ? <Loader size={15} className="animate-spin" />
                                                                : <Trash2 size={15} />}
                                                        </button>
                                                    )}
                                                </li>
                                            );
                                        })}
                                    </ul>
                                )}

                                <div className="flex flex-wrap gap-2">
                                    {DOCUMENT_TYPES.map((dt) => {
                                        const key = `${travellerId}:${dt.value}`;
                                        const isBusy = busyKey === key;
                                        const existing = theirs.find((d) => d.documentType === dt.value);
                                        const locked = existing?.reviewStatus === 'APPROVED';

                                        return (
                                            <label
                                                key={dt.value}
                                                className={`text-xs px-3 py-2 rounded-lg border font-medium transition-colors inline-flex items-center gap-1.5 ${
                                                    locked
                                                        ? 'border-green-200 bg-green-50 text-green-700 cursor-not-allowed'
                                                        : 'border-slate-200 text-slate-600 hover:border-blue-400 hover:text-blue-600 cursor-pointer'
                                                }`}
                                            >
                                                {isBusy
                                                    ? <><Loader size={12} className="animate-spin" /> {progress}%</>
                                                    : locked
                                                        ? <><CheckCircle size={12} /> {dt.label}</>
                                                        : <><Upload size={12} /> {existing ? `Replace ${dt.label}` : dt.label}</>}
                                                <input
                                                    type="file"
                                                    accept=".pdf,image/jpeg,image/png,image/webp"
                                                    className="hidden"
                                                    disabled={isBusy || locked}
                                                    onChange={(e) => {
                                                        const file = e.target.files?.[0];
                                                        e.target.value = '';
                                                        if (file) handleUpload(travellerId, dt.value, file, existing?.documentId);
                                                    }}
                                                />
                                            </label>
                                        );
                                    })}
                                </div>
                            </>
                        )}
                    </div>
                );
            })}

            <p className="text-xs text-slate-500">
                Accepted formats: PDF, JPEG, PNG, WebP · Maximum 10&nbsp;MB per file.
                Your documents are stored privately and are visible only to you and our booking team.
            </p>
        </div>
    );
};

export default BookingDocumentsUpload;
