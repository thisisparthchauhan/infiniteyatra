import React, { useState, useRef } from 'react';
import { UploadCloud, Link as LinkIcon, Loader2, X, Image as ImageIcon } from 'lucide-react';
import { storage } from '../../../firebase';
import { ref, uploadBytesResumable, getDownloadURL } from 'firebase/storage';

/**
 * Dual-option image field: Upload a file or paste a URL.
 *
 * Props:
 *  - value: string (current image URL)
 *  - onChange: (url: string) => void
 *  - storagePath: string (Firebase Storage folder, e.g. "transport/vehicles/abc")
 *  - label: string (optional, default "Image")
 *  - accept: string (optional, default "image/jpeg,image/png,image/webp")
 */
const ImageUploadField = ({ value, onChange, storagePath = 'transport/uploads', label = 'Image', accept = 'image/jpeg,image/png,image/webp' }) => {
    const [mode, setMode] = useState('upload'); // 'upload' | 'url'
    const [uploading, setUploading] = useState(false);
    const [progress, setProgress] = useState(0);
    const [dragOver, setDragOver] = useState(false);
    const fileInputRef = useRef(null);

    const handleFileSelect = async (file) => {
        if (!file) return;
        setUploading(true);
        setProgress(0);

        try {
            const storageRef = ref(storage, `${storagePath}/${Date.now()}_${file.name}`);
            const uploadTask = uploadBytesResumable(storageRef, file);

            uploadTask.on(
                'state_changed',
                (snapshot) => {
                    const pct = Math.round((snapshot.bytesTransferred / snapshot.totalBytes) * 100);
                    setProgress(pct);
                },
                (error) => {
                    console.error('Upload error:', error);
                    setUploading(false);
                },
                async () => {
                    const downloadURL = await getDownloadURL(uploadTask.snapshot.ref);
                    onChange(downloadURL);
                    setUploading(false);
                    setProgress(0);
                }
            );
        } catch (error) {
            console.error('Upload error:', error);
            setUploading(false);
        }
    };

    const handleInputChange = (e) => {
        const file = e.target.files?.[0];
        if (file) handleFileSelect(file);
        e.target.value = null;
    };

    const handleDrop = (e) => {
        e.preventDefault();
        setDragOver(false);
        const file = e.dataTransfer.files?.[0];
        if (file && file.type.startsWith('image/')) handleFileSelect(file);
    };

    const handleDragOver = (e) => { e.preventDefault(); setDragOver(true); };
    const handleDragLeave = () => setDragOver(false);

    return (
        <div>
            <label className="block text-sm font-medium text-slate-400 mb-2">{label}</label>

            {/* Preview */}
            {value && (
                <div className="flex items-center gap-3 mb-3">
                    <div className="w-20 h-20 rounded-xl overflow-hidden border border-slate-700 bg-slate-900 shrink-0">
                        <img src={value} alt="Preview" className="w-full h-full object-cover" />
                    </div>
                    <button
                        type="button"
                        onClick={() => onChange('')}
                        className="text-red-400 hover:text-red-300 text-xs font-medium flex items-center gap-1 bg-red-500/10 px-2.5 py-1.5 rounded-lg transition-colors"
                    >
                        <X size={12} /> Remove
                    </button>
                </div>
            )}

            {mode === 'upload' ? (
                <>
                    {/* Drop zone */}
                    <div
                        onDragOver={handleDragOver}
                        onDragLeave={handleDragLeave}
                        onDrop={handleDrop}
                        onClick={() => fileInputRef.current?.click()}
                        className={`
                            border-2 border-dashed rounded-2xl p-6 text-center cursor-pointer transition-all
                            ${dragOver
                                ? 'border-purple-500 bg-purple-500/10'
                                : 'border-slate-700 hover:border-slate-500 bg-slate-900/50 hover:bg-slate-900'
                            }
                        `}
                    >
                        <input
                            ref={fileInputRef}
                            type="file"
                            accept={accept}
                            onChange={handleInputChange}
                            className="hidden"
                        />

                        {uploading ? (
                            <div className="flex flex-col items-center gap-3">
                                <Loader2 size={28} className="text-purple-400 animate-spin" />
                                <span className="text-sm text-slate-300 font-medium">Uploading... {progress}%</span>
                                <div className="w-full max-w-[200px] h-2 rounded-full bg-slate-800 overflow-hidden">
                                    <div
                                        className="h-full bg-gradient-to-r from-purple-600 to-blue-500 rounded-full transition-all duration-300"
                                        style={{ width: `${progress}%` }}
                                    />
                                </div>
                            </div>
                        ) : (
                            <div className="flex flex-col items-center gap-2">
                                <div className="w-12 h-12 rounded-full bg-purple-500/10 flex items-center justify-center">
                                    <UploadCloud size={22} className="text-purple-400" />
                                </div>
                                <span className="text-sm text-white font-bold">Drag & drop or click to upload</span>
                                <span className="text-xs text-slate-500">JPG, PNG, WEBP up to 5MB</span>
                            </div>
                        )}
                    </div>

                    <button
                        type="button"
                        onClick={() => setMode('url')}
                        className="text-xs text-purple-400 hover:text-purple-300 mt-2 flex items-center gap-1 transition-colors"
                    >
                        <LinkIcon size={12} /> Or paste image URL instead
                    </button>
                </>
            ) : (
                <>
                    {/* URL input */}
                    <div className="flex gap-2">
                        <input
                            type="text"
                            className="flex-1 bg-black/50 border border-slate-700 rounded-xl px-4 py-3 text-white focus:border-purple-500 transition-colors text-sm"
                            placeholder="https://..."
                            value={value || ''}
                            onChange={e => onChange(e.target.value)}
                        />
                    </div>
                    <button
                        type="button"
                        onClick={() => setMode('upload')}
                        className="text-xs text-purple-400 hover:text-purple-300 mt-2 flex items-center gap-1 transition-colors"
                    >
                        <UploadCloud size={12} /> Upload from device instead
                    </button>
                </>
            )}
        </div>
    );
};

export default ImageUploadField;
