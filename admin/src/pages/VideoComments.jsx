import { useState, useEffect, useCallback } from 'react';
import { useParams, Link } from 'react-router-dom';
import api from '../utils/api';
import { ArrowLeft, Trash2, AlertCircle, ChevronLeft, ChevronRight } from 'lucide-react';

const VideoComments = () => {
    const { id } = useParams();
    const [comments, setComments] = useState([]);
    const [pagination, setPagination] = useState({ page: 1, pages: 1, total: 0 });
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState('');
    const [currentPage, setCurrentPage] = useState(1);

    const [deleteModalOpen, setDeleteModalOpen] = useState(false);
    const [commentToDelete, setCommentToDelete] = useState(null);

    const fetchComments = useCallback(async () => {
        setLoading(true);
        try {
            const res = await api.get(`/admin/videos/${id}/comments?page=${currentPage}&limit=20`);
            setComments(res.data.data);
            setPagination(res.data.pagination);
            setError('');
        } catch (err) {
            console.error(err);
            setError('Failed to fetch comments');
        } finally {
            setLoading(false);
        }
    }, [id, currentPage]);

    useEffect(() => {
        fetchComments();
    }, [fetchComments]);

    const openDeleteModal = (comment) => {
        setCommentToDelete(comment);
        setDeleteModalOpen(true);
    };

    const confirmDelete = async () => {
        try {
            await api.delete(`/admin/comments/${commentToDelete._id}`);
            setDeleteModalOpen(false);
            setCommentToDelete(null);
            fetchComments();
        } catch (err) {
            console.error(err);
            alert('Failed to delete comment');
        }
    };

    return (
        <div className="space-y-6 relative">
            <div className="flex items-center space-x-4">
                <Link to="/videos" className="p-2 rounded-lg bg-bg-elevated hover:bg-border text-white transition-colors">
                    <ArrowLeft className="w-5 h-5" />
                </Link>
                <h1 className="text-3xl font-bold">Moderate Comments</h1>
            </div>

            {error && (
                <div className="bg-red-500/10 text-red-500 p-4 rounded-lg border border-red-500/50 flex items-center">
                    <AlertCircle className="w-5 h-5 mr-2" />
                    {error}
                </div>
            )}

            <div className="bg-bg-surface border border-border rounded-xl p-6">
                <div className="flex justify-between items-center mb-6">
                    <h3 className="text-lg font-semibold">All Comments ({pagination.total})</h3>
                </div>

                <div className="overflow-x-auto">
                    <table className="w-full text-left">
                        <thead>
                            <tr className="text-gray-400 border-b border-border">
                                <th className="pb-3 font-medium w-1/2">Comment</th>
                                <th className="pb-3 font-medium">User</th>
                                <th className="pb-3 font-medium">Likes</th>
                                <th className="pb-3 font-medium">Date</th>
                                <th className="pb-3 font-medium text-right">Actions</th>
                            </tr>
                        </thead>
                        <tbody>
                            {loading ? (
                                <tr>
                                    <td colSpan="5" className="py-8 text-center text-gray-500">Loading comments...</td>
                                </tr>
                            ) : comments.length === 0 ? (
                                <tr>
                                    <td colSpan="5" className="py-8 text-center text-gray-500">No comments found for this video.</td>
                                </tr>
                            ) : (
                                comments.map(comment => (
                                    <tr key={comment._id} className="border-b border-border/50 hover:bg-bg-elevated transition-colors">
                                        <td className="py-4">
                                            <p className="text-white text-sm break-words">{comment.text}</p>
                                        </td>
                                        <td className="py-4">
                                            <div className="flex items-center">
                                                {comment.user?.profileImage ? (
                                                    <img src={`http://localhost:5000${comment.user.profileImage}`} alt="" className="w-8 h-8 rounded-full object-cover mr-2" />
                                                ) : (
                                                    <div className="w-8 h-8 rounded-full bg-border mr-2 flex items-center justify-center text-xs">
                                                        {comment.user?.name?.charAt(0) || 'U'}
                                                    </div>
                                                )}
                                                <div>
                                                    <p className="text-sm font-medium text-white">{comment.user?.name || 'Unknown'}</p>
                                                    <p className="text-xs text-gray-400">@{comment.user?.username || 'user'}</p>
                                                </div>
                                            </div>
                                        </td>
                                        <td className="py-4 text-gray-300">{comment.likes}</td>
                                        <td className="py-4 text-gray-300 text-sm">{new Date(comment.createdAt).toLocaleDateString()}</td>
                                        <td className="py-4 text-right">
                                            <button onClick={() => openDeleteModal(comment)} className="text-red-500 hover:text-red-400 p-2 rounded hover:bg-red-500/10 transition-colors">
                                                <Trash2 className="w-4 h-4" />
                                            </button>
                                        </td>
                                    </tr>
                                ))
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

            {/* Delete Modal */}
            {deleteModalOpen && (
                <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 backdrop-blur-sm">
                    <div className="bg-bg-surface border border-border p-6 rounded-xl shadow-xl w-full max-w-md">
                        <div className="flex justify-between items-center mb-4">
                            <h2 className="text-xl font-bold text-white">Delete Comment</h2>
                            <button onClick={() => setDeleteModalOpen(false)} className="text-gray-400 hover:text-white"><X size={20}/></button>
                        </div>
                        <p className="text-gray-300 mb-6">Are you sure you want to delete this comment? This will also delete any replies to it.</p>
                        <div className="p-4 bg-bg-elevated rounded-lg mb-6 text-sm text-gray-300 border border-border italic">
                            "{commentToDelete?.text}"
                        </div>
                        <div className="flex justify-end space-x-3">
                            <button onClick={() => setDeleteModalOpen(false)} className="px-4 py-2 rounded-lg bg-bg-elevated hover:bg-border text-white transition-colors">Cancel</button>
                            <button onClick={confirmDelete} className="px-4 py-2 rounded-lg bg-red-500 hover:bg-red-600 text-white transition-colors">Delete</button>
                        </div>
                    </div>
                </div>
            )}
        </div>
    );
};

export default VideoComments;
