import React, { useState, useEffect } from 'react';
import { storage } from '../firebase';
import { ref, uploadBytes, getDownloadURL, listAll } from 'firebase/storage';
import { Upload, Copy, Check, Image as ImageIcon, Loader, Trash2 } from 'lucide-react';
import { toast } from 'react-hot-toast'; // Assuming toast context/library is available, based on Package.json

const AdminImageUpload = () => {
    const [uploading, setUploading] = useState(false);
    const [images, setImages] = useState([]);
    const [loadingImages, setLoadingImages] = useState(true);
    const [copiedUrl, setCopiedUrl] = useState('');

    useEffect(() => {
        fetchImages();
    }, []);

    const fetchImages = async () => {
        setLoadingImages(true);
        try {
            const listRef = ref(storage, 'uploads');
            const res = await listAll(listRef);

            const urlPromises = res.items.map(async (itemRef) => {
                const url = await getDownloadURL(itemRef);
                const metadata = { name: itemRef.name, fullPath: itemRef.fullPath };
                return { url, ...metadata };
            });

            const imageUrls = await Promise.all(urlPromises);
            setImages(imageUrls);
        } catch (error) {
            console.error("Error fetching images:", error);
            // toast.error("Failed to load gallery"); // Commented out if toast not setup perfectly yet
        } finally {
            setLoadingImages(false);
        }
    };

    const handleUpload = async (e) => {
        const file = e.target.files[0];
        if (!file) return;

        setUploading(true);
        try {
            const storageRef = ref(storage, `uploads/${Date.now()}_${file.name}`);
            await uploadBytes(storageRef, file);
            const url = await getDownloadURL(storageRef);

            setImages(prev => [{ url, name: file.name }, ...prev]);
            toast.success("Image uploaded successfully!");
        } catch (error) {
            console.error("Error uploading image:", error);
            alert("Upload failed: " + error.message);
        } finally {
            setUploading(false);
            e.target.value = null; // Reset input
        }
    };

    const copyToClipboard = (url) => {
        navigator.clipboard.writeText(url);
        setCopiedUrl(url);
        toast.success("URL copied to clipboard!");
        setTimeout(() => setCopiedUrl(''), 2000);
    };

    return (
        <div className="space-y-8">
            {/* Upload Area */}
            <div className="bg-white p-8 rounded-xl border-2 border-dashed border-slate-300 hover:border-blue-500 transition-colors flex flex-col items-center justify-center text-center">
                <input
                    type="file"
                    id="file-upload"
                    className="hidden"
                    accept="image/*"
                    onChange={handleUpload}
                    disabled={uploading}
                />
                <label
                    htmlFor="file-upload"
                    className="cursor-pointer flex flex-col items-center gap-4 w-full h-full"
                >
                    <div className={`p-4 rounded-full ${uploading ? 'bg-slate-100' : 'bg-blue-50 text-blue-600'}`}>
                        {uploading ? (
                            <Loader className="animate-spin text-slate-500" size={32} />
                        ) : (
                            <CloudUploadIcon />
                        )}
                    </div>
                    <div>
                        <h3 className="text-lg font-bold text-slate-900">
                            {uploading ? 'Uploading...' : 'Click to Upload Image'}
                        </h3>
                        <p className="text-slate-500 text-sm mt-1">
                            Supported formats: JPG, PNG, WEBP
                        </p>
                    </div>
                </label>
            </div>

            {/* Gallery */}
            <div>
                <h3 className="text-lg font-bold text-slate-900 mb-4 flex items-center gap-2">
                    <ImageIcon size={20} />
                    Recent Uploads
                </h3>

                {loadingImages ? (
                    <div className="flex justify-center p-8">
                        <Loader className="animate-spin text-blue-600" />
                    </div>
                ) : images.length === 0 ? (
                    <div className="bg-slate-50 p-8 rounded-xl text-center text-slate-500">
                        No images uploaded yet.
                    </div>
                ) : (
                    <div className="grid grid-cols-2 md:grid-cols-4 lg:grid-cols-5 gap-4">
                        {images.map((img, index) => (
                            <div key={index} className="group relative bg-white border border-slate-200 rounded-xl overflow-hidden shadow-sm hover:shadow-md transition-all">
                                <div className="aspect-square bg-slate-100 relative">
                                    <img
                                        src={img.url}
                                        alt="Uploaded"
                                        className="w-full h-full object-cover"
                                    />
                                    <div className="absolute inset-0 bg-black/40 opacity-0 group-hover:opacity-100 transition-opacity flex items-center justify-center gap-2">
                                        <button
                                            onClick={() => copyToClipboard(img.url)}
                                            className="p-2 bg-white rounded-full hover:bg-blue-50 text-slate-900 transition-colors"
                                            title="Copy URL"
                                        >
                                            {copiedUrl === img.url ? <Check size={16} className="text-green-600" /> : <Copy size={16} />}
                                        </button>
                                        <a
                                            href={img.url}
                                            target="_blank"
                                            rel="noopener noreferrer"
                                            className="p-2 bg-white rounded-full hover:bg-blue-50 text-slate-900 transition-colors"
                                            title="View Full Size"
                                        >
                                            <ImageIcon size={16} />
                                        </a>
                                    </div>
                                </div>
                                <div className="p-2 bg-white border-t border-slate-100">
                                    <p className="text-xs text-slate-500 truncate select-all">{img.name || 'Image'}</p>
                                </div>
                            </div>
                        ))}
                    </div>
                )}
            </div>
        </div>
    );
};

/* Helper Icon Component to avoid large inline SVG */
const CloudUploadIcon = () => (
    <svg xmlns="http://www.w3.org/2000/svg" width="32" height="32" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
        <path d="M4 14.899A7 7 0 1 1 15.71 8h1.79a4.5 4.5 0 0 1 2.5 8.242" />
        <path d="M12 12v9" />
        <path d="m16 16-4-4-4 4" />
    </svg>
);

export default AdminImageUpload;
