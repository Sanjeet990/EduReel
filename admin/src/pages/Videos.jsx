import { useState, useEffect, useCallback } from 'react';
import { useDropzone } from 'react-dropzone';
import { Link } from 'react-router-dom';
import api, { BASE_URL } from '../utils/api';
import { UploadCloud, CheckCircle, Clock, AlertCircle, X, Search, ChevronLeft, ChevronRight } from 'lucide-react';

const Videos = () => {
    const [metadata, setMetadata] = useState({ classes: [], subjects: [] });
    const [videos, setVideos] = useState([]);
    const [pagination, setPagination] = useState({ page: 1, pages: 1, total: 0 });
    const [uploading, setUploading] = useState(false);
    const [progress, setProgress] = useState(0);
    const [statusId, setStatusId] = useState(null);
    const [statusMsg, setStatusMsg] = useState('');
    const [error, setError] = useState('');

    const [uploadSubject, setUploadSubject] = useState('Science');
    const [uploadClass, setUploadClass] = useState('9');
    const [uploadTitle, setUploadTitle] = useState('');
    const [uploadDescription, setUploadDescription] = useState('');
    const [selectedFile, setSelectedFile] = useState(null);
    const [uploadModalOpen, setUploadModalOpen] = useState(false);

    const [deleteModalOpen, setDeleteModalOpen] = useState(false);
    const [videoToDelete, setVideoToDelete] = useState(null);

    const [editModalOpen, setEditModalOpen] = useState(false);
    const [videoToEdit, setVideoToEdit] = useState(null);
    const [editData, setEditData] = useState({ title: '', subject: '', targetClass: [] });

    // Reupload states
    const [reuploadModalOpen, setReuploadModalOpen] = useState(false);
    const [videoToReupload, setVideoToReupload] = useState(null);
    const [reuploadFile, setReuploadFile] = useState(null);
    const [isReuploading, setIsReuploading] = useState(false);
    const [reuploadProgress, setReuploadProgress] = useState(0);

    // Filter states
    const [filterSubject, setFilterSubject] = useState('');
    const [filterClass, setFilterClass] = useState('');
    const [filterDuration, setFilterDuration] = useState('');
    const [searchQuery, setSearchQuery] = useState('');
    const [currentPage, setCurrentPage] = useState(1);

    const fetchVideos = useCallback(async () => {
        try {
            const params = new URLSearchParams({
                page: currentPage,
                limit: 10
            });
            if (filterSubject) params.append('subject', filterSubject);
            if (filterClass) params.append('targetClass', filterClass);
            if (filterDuration) params.append('duration', filterDuration);
            if (searchQuery) params.append('search', searchQuery);

            const res = await api.get(`/admin/videos?${params.toString()}`);
            setVideos(res.data.data);
            setPagination(res.data.pagination);
        } catch (err) {
            console.error(err);
        }
    }, [currentPage, filterSubject, filterClass, filterDuration, searchQuery]);

    useEffect(() => {
        const loadInitialData = async () => {
            try {
                const metaRes = await api.get('/metadata');
                if (metaRes.data.success) {
                    setMetadata(metaRes.data.data);
                    // Set defaults if lists are populated
                    if (metaRes.data.data.subjects.length > 0) setUploadSubject(metaRes.data.data.subjects[0].name);
                    if (metaRes.data.data.classes.length > 0) setUploadClass(metaRes.data.data.classes[0].value.toString());
                }
                fetchVideos();
            } catch (error) {
                console.error('Failed to load initial data', error);
                fetchVideos();
            }
        };
        loadInitialData();
    }, [fetchVideos]);

    // Handle search input debounce
    useEffect(() => {
        const timeout = setTimeout(() => {
            setCurrentPage(1);
            fetchVideos();
        }, 500);
        return () => clearTimeout(timeout);
    }, [searchQuery, fetchVideos]);

    useEffect(() => {
        let interval;
        if (statusId) {
            interval = setInterval(async () => {
                try {
                    const res = await api.get(`/admin/videos?page=${currentPage}&limit=10`);
                    const currentVid = res.data.data.find(v => v._id === statusId);
                    if (currentVid) {
                        fetchVideos(); // Refresh list to show exact current state
                        if (currentVid.status === 'ready') {
                            setStatusMsg('Ready ✓');
                            setUploading(false);
                            setStatusId(null);
                            clearInterval(interval);
                        } else if (currentVid.status === 'failed') {
                            setStatusMsg('Failed ✗');
                            setError('Transcoding failed');
                            setUploading(false);
                            setStatusId(null);
                            clearInterval(interval);
                        }
                    }
                } catch (e) {
                    console.error(e);
                }
            }, 3000);
        }
        return () => clearInterval(interval);
    }, [statusId, currentPage, fetchVideos]);

    const onDrop = useCallback((acceptedFiles) => {
        const file = acceptedFiles[0];
        if (!file) return;
        
        setError('');
        setSelectedFile(file);
        // Pre-fill title if empty
        if (!uploadTitle) {
            setUploadTitle(file.name.split('.')[0]);
        }
    }, [uploadTitle]);

    const startUpload = async () => {
        if (!selectedFile) {
            setError('Please select a video file first');
            return;
        }

        const videoElement = document.createElement('video');
        videoElement.preload = 'metadata';
        videoElement.onloadedmetadata = async () => {
            window.URL.revokeObjectURL(videoElement.src);
            const duration = videoElement.duration;
            
            if (duration < 10 || duration > 90) {
                setError(`Video must be between 10-90s (current: ${Math.round(duration)}s)`);
                return;
            }

            setUploading(true);
            setProgress(0);
            setStatusMsg('Uploading...');

            const formData = new FormData();
            formData.append('video', selectedFile);
            formData.append('title', uploadTitle || selectedFile.name.split('.')[0]); 
            formData.append('description', uploadDescription);
            formData.append('subject', uploadSubject);
            formData.append('targetClass', uploadClass);
            formData.append('targetAgeGroup', '13-17');

            try {
                const res = await api.post('/admin/videos/upload', formData, {
                    onUploadProgress: (progressEvent) => {
                        const percentCompleted = Math.round((progressEvent.loaded * 100) / progressEvent.total);
                        setProgress(percentCompleted);
                    }
                });
                
                setStatusMsg('Processing...');
                setStatusId(res.data.data.videoId);
                setProgress(100);
                setCurrentPage(1); // Reset to page 1 on new upload
                setSelectedFile(null);
                setUploadTitle('');
                setUploadDescription('');
                setUploadModalOpen(false);
                
            } catch (err) {
                setError(err.response?.data?.message || 'Upload failed');
                setUploading(false);
            }
        };
        videoElement.src = URL.createObjectURL(selectedFile);
    };

    const { getRootProps, getInputProps, isDragActive } = useDropzone({
        onDrop,
        accept: { 'video/mp4': ['.mp4'], 'video/quicktime': ['.mov'] },
        maxFiles: 1,
        disabled: uploading || (uploadTitle.length > 100) || (uploadDescription.length > 300)
    });

    const openDeleteModal = (video) => {
        setVideoToDelete(video);
        setDeleteModalOpen(true);
    };

    const confirmDelete = async () => {
        try {
            await api.delete(`/admin/videos/${videoToDelete._id}`);
            setDeleteModalOpen(false);
            setVideoToDelete(null);
            fetchVideos();
        } catch (err) {
            console.error(err);
            alert('Failed to delete video');
        }
    };

    const openEditModal = (video) => {
        setVideoToEdit(video);
        setEditData({ 
            title: video.title, 
            subject: video.subject || 'Science',
            targetClass: video.targetClass && video.targetClass.length > 0 ? video.targetClass[0] : 9
        });
        setEditModalOpen(true);
    };

    const confirmEdit = async () => {
        try {
            await api.put(`/admin/videos/${videoToEdit._id}`, {
                title: editData.title,
                subject: editData.subject,
                targetClass: [parseInt(editData.targetClass)]
            });
            setEditModalOpen(false);
            setVideoToEdit(null);
            fetchVideos();
        } catch (err) {
            console.error(err);
            alert('Failed to update video');
        }
    };

    const openReuploadModal = (video) => {
        setVideoToReupload(video);
        setReuploadFile(null);
        setReuploadModalOpen(true);
    };

    const startReupload = async () => {
        if (!reuploadFile || !videoToReupload) return;

        const videoElement = document.createElement('video');
        videoElement.preload = 'metadata';
        videoElement.onloadedmetadata = async () => {
            window.URL.revokeObjectURL(videoElement.src);
            const duration = videoElement.duration;
            
            if (duration < 10 || duration > 90) {
                setError(`Video must be between 10-90s (current: ${Math.round(duration)}s)`);
                setReuploadModalOpen(false);
                return;
            }

            setIsReuploading(true);
            setReuploadProgress(0);
            setStatusMsg('Re-uploading...');
            setError('');

            const formData = new FormData();
            formData.append('video', reuploadFile);

            try {
                const res = await api.put(`/admin/videos/${videoToReupload._id}/reupload`, formData, {
                    onUploadProgress: (progressEvent) => {
                        const percentCompleted = Math.round((progressEvent.loaded * 100) / progressEvent.total);
                        setReuploadProgress(percentCompleted);
                    }
                });
                
                setStatusMsg('Processing...');
                setStatusId(videoToReupload._id);
                setReuploadProgress(100);
                
                setReuploadModalOpen(false);
                setVideoToReupload(null);
                setReuploadFile(null);
                setIsReuploading(false);
                fetchVideos();
                
            } catch (err) {
                setError(err.response?.data?.message || 'Re-upload failed');
                setIsReuploading(false);
            }
        };
        videoElement.src = URL.createObjectURL(reuploadFile);
    };

    return (
        <div className="space-y-6 relative">
            <div className="flex justify-between items-center">
                <h1 className="text-3xl font-bold">Videos</h1>
                <button
                    onClick={() => setUploadModalOpen(true)}
                    className="bg-accent hover:bg-accent-light text-white px-4 py-2 rounded-lg font-semibold transition-colors"
                >
                    Upload Video
                </button>
            </div>

            {error && (
                <div className="bg-red-500/10 text-red-500 p-4 rounded-lg border border-red-500/50 flex items-center">
                    <AlertCircle className="w-5 h-5 mr-2" />
                    {error}
                </div>
            )}

            {false && <div className="bg-bg-surface border border-border rounded-xl p-6">
                <div className="flex space-x-4 mb-4">
                    <div className="flex-1">
                        <label className="block text-sm font-medium text-gray-400 mb-1">Subject</label>
                        <select 
                            className="w-full bg-bg-elevated border border-border rounded-lg px-4 py-2.5 text-white focus:outline-none focus:border-accent"
                            value={uploadSubject}
                            onChange={(e) => setUploadSubject(e.target.value)}
                            disabled={uploading}
                        >
                            {metadata.subjects.map(s => <option key={s.name} value={s.name}>{s.name}</option>)}
                        </select>
                    </div>
                    <div className="flex-1">
                        <label className="block text-sm font-medium text-gray-400 mb-1">Target Class</label>
                        <select 
                            className="w-full bg-bg-elevated border border-border rounded-lg px-4 py-2.5 text-white focus:outline-none focus:border-accent"
                            value={uploadClass}
                            onChange={(e) => setUploadClass(e.target.value)}
                            disabled={uploading}
                        >
                            {metadata.classes.map(c => <option key={c.value} value={c.value}>{c.name}</option>)}
                        </select>
                    </div>
                </div>

                <div className="flex space-x-4 mb-4">
                    <div className="flex-1">
                        <label className="block text-sm font-medium text-gray-400 mb-1">
                            Video Title <span className={uploadTitle.length > 100 ? 'text-red-500' : 'text-gray-500'}>({uploadTitle.length}/100)</span>
                        </label>
                        <input 
                            type="text" 
                            className="w-full bg-bg-elevated border border-border rounded-lg px-4 py-2.5 text-white focus:outline-none focus:border-accent"
                            placeholder="Enter video title (or leave blank to use filename)"
                            value={uploadTitle}
                            onChange={(e) => setUploadTitle(e.target.value)}
                            disabled={uploading}
                            maxLength={100}
                        />
                    </div>
                </div>
                
                <div className="mb-6">
                    <label className="block text-sm font-medium text-gray-400 mb-1">
                        Description <span className={uploadDescription.length > 300 ? 'text-red-500' : 'text-gray-500'}>({uploadDescription.length}/300)</span>
                    </label>
                    <textarea 
                        className="w-full bg-bg-elevated border border-border rounded-lg px-4 py-2.5 text-white focus:outline-none focus:border-accent h-24 resize-none"
                        placeholder="Add a description or caption..."
                        value={uploadDescription}
                        onChange={(e) => setUploadDescription(e.target.value)}
                        disabled={uploading}
                        maxLength={300}
                    ></textarea>
                </div>

                <div 
                    {...getRootProps()} 
                    className={`border-2 border-dashed rounded-xl p-10 text-center cursor-pointer transition-colors ${
                        isDragActive ? 'border-accent bg-accent/5' : 'border-border bg-bg hover:bg-bg-elevated'
                    } ${uploading ? 'opacity-50 cursor-not-allowed' : ''}`}
                >
                    <input {...getInputProps()} />
                    {uploading ? (
                        <div>
                            <p className="text-accent font-medium mb-2">{statusMsg}</p>
                            <div className="w-full max-w-md mx-auto bg-bg-elevated rounded-full h-2 mb-2 border border-border">
                                <div className="bg-accent h-2 rounded-full" style={{ width: `${progress}%` }}></div>
                            </div>
                        </div>
                    ) : selectedFile ? (
                        <div>
                            <CheckCircle className="w-12 h-12 mx-auto text-success mb-2" />
                            <p className="text-lg font-medium mb-1">{selectedFile.name}</p>
                            <p className="text-sm text-gray-400 mb-4">{(selectedFile.size / (1024 * 1024)).toFixed(2)} MB</p>
                            <button 
                                onClick={(e) => {
                                    e.stopPropagation(); // prevent opening file dialog
                                    setSelectedFile(null);
                                    setUploadTitle('');
                                }} 
                                className="text-gray-400 hover:text-white text-sm underline"
                            >
                                Choose a different file
                            </button>
                        </div>
                    ) : (
                        <>
                            <UploadCloud className="w-12 h-12 mx-auto text-gray-400 mb-4" />
                            <p className="text-lg font-medium mb-1">Select Video File</p>
                            <p className="text-sm text-gray-400">10-90 seconds • MP4</p>
                            <button className="mt-4 bg-bg-elevated hover:bg-border text-white px-6 py-2 rounded-lg font-medium transition-colors">
                                Browse File
                            </button>
                        </>
                    )}
                </div>

                <div className="mt-6 flex justify-end">
                    <button 
                        onClick={startUpload}
                        disabled={uploading || !selectedFile || uploadTitle.length > 100 || uploadDescription.length > 300}
                        className="bg-accent hover:bg-accent-light text-white px-8 py-3 rounded-lg font-bold transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
                    >
                        {uploading ? 'Uploading...' : 'Upload Video'}
                    </button>
                </div>
            </div>}

            <div className="bg-bg-surface border border-border rounded-xl p-6">
                <div className="flex flex-col md:flex-row justify-between items-center mb-6 space-y-4 md:space-y-0">
                    <h3 className="text-lg font-semibold w-full md:w-auto">All Videos ({pagination.total})</h3>
                    
                    <div className="flex space-x-3 w-full md:w-auto">
                        <div className="relative flex-1 md:w-48">
                            <Search className="w-4 h-4 absolute left-3 top-3 text-gray-400" />
                            <input 
                                type="text"
                                placeholder="Search title..."
                                className="w-full bg-bg-elevated border border-border rounded-lg pl-9 pr-4 py-2 text-sm text-white focus:outline-none focus:border-accent"
                                value={searchQuery}
                                onChange={(e) => setSearchQuery(e.target.value)}
                            />
                        </div>
                        <select 
                            className="bg-bg-elevated border border-border rounded-lg px-3 py-2 text-sm text-white focus:outline-none focus:border-accent"
                            value={filterSubject}
                            onChange={(e) => { setFilterSubject(e.target.value); setCurrentPage(1); }}
                        >
                            <option value="">All Subjects</option>
                            {metadata.subjects.map(s => <option key={s.name} value={s.name}>{s.name}</option>)}
                        </select>
                        <select 
                            className="bg-bg-elevated border border-border rounded-lg px-3 py-2 text-sm text-white focus:outline-none focus:border-accent"
                            value={filterClass}
                            onChange={(e) => { setFilterClass(e.target.value); setCurrentPage(1); }}
                        >
                            <option value="">All Classes</option>
                            {metadata.classes.map(c => <option key={c.value} value={c.value}>{c.name}</option>)}
                        </select>
                        <select 
                            className="bg-bg-elevated border border-border rounded-lg px-3 py-2 text-sm text-white focus:outline-none focus:border-accent"
                            value={filterDuration}
                            onChange={(e) => { setFilterDuration(e.target.value); setCurrentPage(1); }}
                        >
                            <option value="">All Durations</option>
                            <option value="short">Short (10-30s)</option>
                            <option value="medium">Medium (31-60s)</option>
                            <option value="long">Long (61-90s)</option>
                        </select>
                    </div>
                </div>

                <div className="overflow-x-auto">
                    <table className="w-full text-left">
                        <thead>
                            <tr className="text-gray-400 border-b border-border">
                                <th className="pb-3 font-medium">Title</th>
                                <th className="pb-3 font-medium">Subject</th>
                                <th className="pb-3 font-medium">Class</th>
                                <th className="pb-3 font-medium">Views</th>
                                <th className="pb-3 font-medium">Likes</th>
                                <th className="pb-3 font-medium">Comments</th>
                                <th className="pb-3 font-medium">Duration</th>
                                <th className="pb-3 font-medium">Status</th>
                                <th className="pb-3 font-medium text-right">Actions</th>
                            </tr>
                        </thead>
                        <tbody>
                            {videos.map(video => (
                                <tr key={video._id} className="border-b border-border/50 hover:bg-bg-elevated transition-colors">
                                    <td className="py-4">
                                        <div className="flex items-center">
                                            {video.thumbnailUrl && (
                                                <img src={`${BASE_URL}${video.thumbnailUrl}`} alt="" className="w-10 h-10 rounded object-cover mr-3" />
                                            )}
                                            <span className="font-medium truncate max-w-[200px]" title={video.title}>{video.title}</span>
                                        </div>
                                    </td>
                                    <td className="py-4 text-gray-300">{video.subject || '-'}</td>
                                    <td className="py-4 text-gray-300">
                                        {video.targetClass && video.targetClass.length > 0 ? `Class ${video.targetClass.join(', ')}` : '-'}
                                    </td>
                                    <td className="py-4 text-gray-300">{video.viewCount || 0}</td>
                                    <td className="py-4 text-gray-300">{video.likeCount || 0}</td>
                                    <td className="py-4 text-gray-300">{video.commentCount || 0}</td>
                                    <td className="py-4 text-gray-300">{video.durationSeconds ? `${Math.round(video.durationSeconds)}s` : '-'}</td>
                                    <td className="py-4">
                                        {video.status === 'ready' && <span className="flex items-center text-success bg-success/10 px-2 py-1 rounded w-max text-xs font-medium"><CheckCircle className="w-3 h-3 mr-1"/> Ready</span>}
                                        {video.status === 'processing' && <span className="flex items-center text-warning bg-warning/10 px-2 py-1 rounded w-max text-xs font-medium"><Clock className="w-3 h-3 mr-1"/> Processing</span>}
                                        {video.status === 'failed' && <span className="flex items-center text-red-500 bg-red-500/10 px-2 py-1 rounded w-max text-xs font-medium"><AlertCircle className="w-3 h-3 mr-1"/> Failed</span>}
                                    </td>
                                    <td className="py-4 text-right whitespace-nowrap">
                                        <Link to={`/videos/${video._id}/comments`} className="inline-flex items-center px-3 py-1.5 rounded-md bg-blue-500/15 text-blue-400 hover:bg-blue-500/25 text-xs font-semibold mr-2 transition-colors">Moderate</Link>
                                        <button onClick={() => openEditModal(video)} className="inline-flex items-center px-3 py-1.5 rounded-md bg-accent/15 text-accent hover:bg-accent/25 text-xs font-semibold mr-2 transition-colors">Edit</button>
                                        <button onClick={() => openReuploadModal(video)} className="inline-flex items-center px-3 py-1.5 rounded-md bg-yellow-500/15 text-yellow-500 hover:bg-yellow-500/25 text-xs font-semibold mr-2 transition-colors">Reupload</button>
                                        <button onClick={() => openDeleteModal(video)} className="inline-flex items-center px-3 py-1.5 rounded-md bg-red-500/15 text-red-400 hover:bg-red-500/25 text-xs font-semibold transition-colors">Delete</button>
                                    </td>
                                </tr>
                            ))}
                            {videos.length === 0 && (
                                <tr>
                                    <td colSpan="6" className="py-8 text-center text-gray-500">No videos found</td>
                                </tr>
                            )}
                        </tbody>
                    </table>
                </div>

                {/* Pagination Controls */}
                {pagination.pages > 1 && (
                    <div className="flex items-center justify-between mt-6 pt-4 border-t border-border">
                        <p className="text-sm text-gray-400">
                            Showing page <span className="font-medium text-white">{pagination.page}</span> of <span className="font-medium text-white">{pagination.pages}</span>
                        </p>
                        <div className="flex space-x-2">
                            <button 
                                onClick={() => setCurrentPage(p => Math.max(1, p - 1))}
                                disabled={currentPage === 1}
                                className="p-2 rounded bg-bg-elevated hover:bg-border text-white disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
                            >
                                <ChevronLeft className="w-4 h-4" />
                            </button>
                            <button 
                                onClick={() => setCurrentPage(p => Math.min(pagination.pages, p + 1))}
                                disabled={currentPage === pagination.pages}
                                className="p-2 rounded bg-bg-elevated hover:bg-border text-white disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
                            >
                                <ChevronRight className="w-4 h-4" />
                            </button>
                        </div>
                    </div>
                )}
            </div>

            {uploadModalOpen && (
                <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 backdrop-blur-sm p-4">
                    <div className="bg-bg-surface border border-border rounded-xl p-6 w-full max-w-5xl max-h-[90vh] overflow-y-auto">
                        <div className="flex justify-between items-center mb-4">
                            <h2 className="text-2xl font-bold text-white">Upload Video</h2>
                            <button onClick={() => setUploadModalOpen(false)} className="text-gray-400 hover:text-white"><X size={20}/></button>
                        </div>
                        <div className="bg-bg-surface border border-border rounded-xl p-6">
                            <div className="flex space-x-4 mb-4">
                                <div className="flex-1">
                                    <label className="block text-sm font-medium text-gray-400 mb-1">Subject</label>
                                    <select className="w-full bg-bg-elevated border border-border rounded-lg px-4 py-2.5 text-white focus:outline-none focus:border-accent" value={uploadSubject} onChange={(e) => setUploadSubject(e.target.value)} disabled={uploading}>
                                        {metadata.subjects.map(s => <option key={s.name} value={s.name}>{s.name}</option>)}
                                    </select>
                                </div>
                                <div className="flex-1">
                                    <label className="block text-sm font-medium text-gray-400 mb-1">Target Class</label>
                                    <select className="w-full bg-bg-elevated border border-border rounded-lg px-4 py-2.5 text-white focus:outline-none focus:border-accent" value={uploadClass} onChange={(e) => setUploadClass(e.target.value)} disabled={uploading}>
                                        {metadata.classes.map(c => <option key={c.value} value={c.value}>{c.name}</option>)}
                                    </select>
                                </div>
                            </div>
                            <div className="flex space-x-4 mb-4">
                                <div className="flex-1">
                                    <label className="block text-sm font-medium text-gray-400 mb-1">Video Title <span className={uploadTitle.length > 100 ? 'text-red-500' : 'text-gray-500'}>({uploadTitle.length}/100)</span></label>
                                    <input type="text" className="w-full bg-bg-elevated border border-border rounded-lg px-4 py-2.5 text-white focus:outline-none focus:border-accent" placeholder="Enter video title (or leave blank to use filename)" value={uploadTitle} onChange={(e) => setUploadTitle(e.target.value)} disabled={uploading} maxLength={100} />
                                </div>
                            </div>
                            <div className="mb-6">
                                <label className="block text-sm font-medium text-gray-400 mb-1">Description <span className={uploadDescription.length > 300 ? 'text-red-500' : 'text-gray-500'}>({uploadDescription.length}/300)</span></label>
                                <textarea className="w-full bg-bg-elevated border border-border rounded-lg px-4 py-2.5 text-white focus:outline-none focus:border-accent h-24 resize-none" placeholder="Add a description or caption..." value={uploadDescription} onChange={(e) => setUploadDescription(e.target.value)} disabled={uploading} maxLength={300}></textarea>
                            </div>
                            <div {...getRootProps()} className={`border-2 border-dashed rounded-xl p-10 text-center cursor-pointer transition-colors ${isDragActive ? 'border-accent bg-accent/5' : 'border-border bg-bg hover:bg-bg-elevated'} ${uploading ? 'opacity-50 cursor-not-allowed' : ''}`}>
                                <input {...getInputProps()} />
                                {uploading ? (
                                    <div>
                                        <p className="text-accent font-medium mb-2">{statusMsg}</p>
                                        <div className="w-full max-w-md mx-auto bg-bg-elevated rounded-full h-2 mb-2 border border-border">
                                            <div className="bg-accent h-2 rounded-full" style={{ width: `${progress}%` }}></div>
                                        </div>
                                    </div>
                                ) : selectedFile ? (
                                    <div>
                                        <CheckCircle className="w-12 h-12 mx-auto text-success mb-2" />
                                        <p className="text-lg font-medium mb-1">{selectedFile.name}</p>
                                        <p className="text-sm text-gray-400 mb-4">{(selectedFile.size / (1024 * 1024)).toFixed(2)} MB</p>
                                        <button onClick={(e) => { e.stopPropagation(); setSelectedFile(null); setUploadTitle(''); }} className="text-gray-400 hover:text-white text-sm underline">Choose a different file</button>
                                    </div>
                                ) : (
                                    <>
                                        <UploadCloud className="w-12 h-12 mx-auto text-gray-400 mb-4" />
                                        <p className="text-lg font-medium mb-1">Select Video File</p>
                                        <p className="text-sm text-gray-400">10-90 seconds • MP4</p>
                                        <button className="mt-4 bg-bg-elevated hover:bg-border text-white px-6 py-2 rounded-lg font-medium transition-colors">Browse File</button>
                                    </>
                                )}
                            </div>
                            <div className="mt-6 flex justify-end gap-3">
                                <button onClick={() => setUploadModalOpen(false)} className="px-4 py-2 rounded-lg bg-bg-elevated hover:bg-border text-white transition-colors">Close</button>
                                <button onClick={startUpload} disabled={uploading || !selectedFile || uploadTitle.length > 100 || uploadDescription.length > 300} className="bg-accent hover:bg-accent-light text-white px-8 py-3 rounded-lg font-bold transition-colors disabled:opacity-50 disabled:cursor-not-allowed">
                                    {uploading ? 'Uploading...' : 'Upload Video'}
                                </button>
                            </div>
                        </div>
                    </div>
                </div>
            )}

            {/* Reupload Modal */}
            {reuploadModalOpen && (
                <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 backdrop-blur-sm">
                    <div className="bg-bg-surface border border-border p-6 rounded-xl shadow-xl w-full max-w-md">
                        <div className="flex justify-between items-center mb-4">
                            <h2 className="text-xl font-bold text-white">Reupload Video</h2>
                            <button onClick={() => setReuploadModalOpen(false)} className="text-gray-400 hover:text-white"><X size={20}/></button>
                        </div>
                        <p className="text-gray-300 mb-6">
                            Select a new video file to replace <span className="text-white font-medium">"{videoToReupload?.title}"</span>. 
                            The old video and its thumbnails will be deleted and the new video will be processed.
                        </p>
                        
                        <div className="mb-6">
                            <input 
                                type="file" 
                                accept="video/mp4,video/quicktime"
                                onChange={(e) => setReuploadFile(e.target.files[0])}
                                className="w-full text-sm text-gray-400 file:mr-4 file:py-2 file:px-4 file:rounded-lg file:border-0 file:text-sm file:font-semibold file:bg-bg-elevated file:text-white hover:file:bg-border transition-colors cursor-pointer"
                                disabled={isReuploading}
                            />
                        </div>

                        {isReuploading && (
                            <div className="mb-6">
                                <p className="text-accent font-medium mb-2">{statusMsg} {reuploadProgress}%</p>
                                <div className="w-full bg-bg-elevated rounded-full h-2 border border-border">
                                    <div className="bg-accent h-2 rounded-full" style={{ width: `${reuploadProgress}%` }}></div>
                                </div>
                            </div>
                        )}

                        <div className="flex justify-end space-x-3">
                            <button onClick={() => setReuploadModalOpen(false)} disabled={isReuploading} className="px-4 py-2 rounded-lg bg-bg-elevated hover:bg-border text-white transition-colors disabled:opacity-50">Cancel</button>
                            <button onClick={startReupload} disabled={isReuploading || !reuploadFile} className="px-4 py-2 rounded-lg bg-yellow-500 hover:bg-yellow-600 text-white transition-colors disabled:opacity-50 disabled:cursor-not-allowed">Reupload</button>
                        </div>
                    </div>
                </div>
            )}

            {/* Delete Modal */}
            {deleteModalOpen && (
                <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 backdrop-blur-sm">
                    <div className="bg-bg-surface border border-border p-6 rounded-xl shadow-xl w-full max-w-md">
                        <div className="flex justify-between items-center mb-4">
                            <h2 className="text-xl font-bold text-white">Delete Video</h2>
                            <button onClick={() => setDeleteModalOpen(false)} className="text-gray-400 hover:text-white"><X size={20}/></button>
                        </div>
                        <p className="text-gray-300 mb-6">Are you sure you want to delete <span className="text-white font-medium">"{videoToDelete?.title}"</span>? This action cannot be undone.</p>
                        <div className="flex justify-end space-x-3">
                            <button onClick={() => setDeleteModalOpen(false)} className="px-4 py-2 rounded-lg bg-bg-elevated hover:bg-border text-white transition-colors">Cancel</button>
                            <button onClick={confirmDelete} className="px-4 py-2 rounded-lg bg-red-500 hover:bg-red-600 text-white transition-colors">Delete</button>
                        </div>
                    </div>
                </div>
            )}

            {/* Edit Modal */}
            {editModalOpen && (
                <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 backdrop-blur-sm">
                    <div className="bg-bg-surface border border-border p-6 rounded-xl shadow-xl w-full max-w-md">
                        <div className="flex justify-between items-center mb-4">
                            <h2 className="text-xl font-bold text-white">Edit Video</h2>
                            <button onClick={() => setEditModalOpen(false)} className="text-gray-400 hover:text-white"><X size={20}/></button>
                        </div>
                        <div className="space-y-4 mb-6">
                            <div>
                                <label className="block text-sm font-medium text-gray-400 mb-1">Title</label>
                                <input 
                                    type="text" 
                                    className="w-full bg-bg-elevated border border-border rounded-lg px-4 py-2.5 text-white focus:outline-none focus:border-accent"
                                    value={editData.title}
                                    onChange={(e) => setEditData({...editData, title: e.target.value})}
                                />
                            </div>
                            <div>
                                <label className="block text-sm font-medium text-gray-400 mb-1">Subject</label>
                                <select 
                                    className="w-full bg-bg-elevated border border-border rounded-lg px-4 py-2.5 text-white focus:outline-none focus:border-accent"
                                    value={editData.subject}
                                    onChange={(e) => setEditData({...editData, subject: e.target.value})}
                                >
                                    {metadata.subjects.map(s => <option key={s.name} value={s.name}>{s.name}</option>)}
                                </select>
                            </div>
                            <div>
                                <label className="block text-sm font-medium text-gray-400 mb-1">Target Class</label>
                                <select 
                                    className="w-full bg-bg-elevated border border-border rounded-lg px-4 py-2.5 text-white focus:outline-none focus:border-accent"
                                    value={editData.targetClass}
                                    onChange={(e) => setEditData({...editData, targetClass: e.target.value})}
                                >
                                    {metadata.classes.map(c => <option key={c.value} value={c.value}>{c.name}</option>)}
                                </select>
                            </div>
                        </div>
                        <div className="flex justify-end space-x-3">
                            <button onClick={() => setEditModalOpen(false)} className="px-4 py-2 rounded-lg bg-bg-elevated hover:bg-border text-white transition-colors">Cancel</button>
                            <button onClick={confirmEdit} className="px-4 py-2 rounded-lg bg-accent hover:bg-accent-light text-white transition-colors">Save Changes</button>
                        </div>
                    </div>
                </div>
            )}
        </div>
    );
};

export default Videos;
