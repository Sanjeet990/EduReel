import { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import api from '../utils/api';
import PreferenceModal from '../components/PreferenceModal';

const Users = () => {
    const [users, setUsers] = useState([]);
    const [deleteModalUserId, setDeleteModalUserId] = useState(null);
    const [preferenceModalUserId, setPreferenceModalUserId] = useState(null);
    const [page, setPage] = useState(1);
    const [pagination, setPagination] = useState({ page: 1, pages: 1, total: 0 });

    useEffect(() => {
        const fetchUsers = async () => {
            try {
                const res = await api.get(`/admin/users?page=${page}&limit=10`);
                setUsers(res.data.data);
                if (res.data.pagination) {
                    setPagination(res.data.pagination);
                }
            } catch (err) {
                console.error(err);
            }
        };
        fetchUsers();
    }, [page]);

    const handleDelete = (id) => {
        setDeleteModalUserId(id);
    };

    const confirmDelete = async () => {
        if (!deleteModalUserId) return;
        try {
            await api.delete(`/admin/users/${deleteModalUserId}`);
            setUsers(users.filter(user => user._id !== deleteModalUserId));
            setDeleteModalUserId(null);
        } catch (err) {
            console.error(err);
            alert(err.response?.data?.message || 'Failed to delete user');
        }
    };

    return (
        <div className="space-y-6">
            <div className="flex justify-between items-center">
                <h1 className="text-3xl font-bold">Users</h1>
                <Link to="/users/new" className="bg-accent hover:bg-accent/90 text-white px-4 py-2 rounded-lg font-medium transition-colors">
                    Create New User
                </Link>
            </div>
            <div className="bg-bg-surface border border-border rounded-xl p-6 flex flex-col min-h-[500px]">
                <div className="overflow-x-auto flex-grow">
                    <table className="w-full text-left">
                        <thead>
                            <tr className="text-gray-400 border-b border-border">
                                <th className="pb-3 font-medium">Name</th>
                                <th className="pb-3 font-medium">Email</th>
                                <th className="pb-3 font-medium">Plan</th>
                                <th className="pb-3 font-medium">Role</th>
                                <th className="pb-3 font-medium text-right">Actions</th>
                            </tr>
                        </thead>
                        <tbody>
                            {users.map(user => (
                                <tr key={user._id} className="border-b border-border/50 hover:bg-bg-elevated transition-colors">
                                    <td className="py-4 font-medium">
                                        <Link to={`/users/${user._id}`} className="text-white hover:text-accent transition-colors">
                                            {user.name}
                                        </Link>
                                    </td>
                                    <td className="py-4 text-gray-300">{user.email}</td>
                                    <td className="py-4">
                                        {user.plan ? (
                                            <span className="text-accent">{user.plan.name}</span>
                                        ) : user.trialActive ? (
                                            <span className="text-yellow-500">Trial</span>
                                        ) : (
                                            <span className="text-gray-500">None</span>
                                        )}
                                    </td>
                                    <td className="py-4">
                                        {user.isAdmin ? (
                                            <span className="bg-accent/20 text-accent px-2 py-1 rounded text-xs font-medium">Admin</span>
                                        ) : (
                                            <span className="bg-gray-700 text-gray-300 px-2 py-1 rounded text-xs font-medium">User</span>
                                        )}
                                    </td>
                                    <td className="py-4 text-right space-x-2">
                                        <Link 
                                            to={`/users/${user._id}`} 
                                            className="inline-flex items-center gap-1 bg-bg-elevated hover:bg-border px-3 py-1.5 rounded-lg text-sm text-gray-300 hover:text-white transition-colors"
                                        >
                                            Edit
                                        </Link>
                                        <button
                                            onClick={() => setPreferenceModalUserId(user._id)}
                                            className="inline-flex items-center gap-1 bg-bg-elevated hover:bg-border px-3 py-1.5 rounded-lg text-sm text-gray-300 hover:text-white transition-colors"
                                        >
                                            Preference
                                        </button>
                                        <button
                                            onClick={() => handleDelete(user._id)}
                                            className="inline-flex items-center gap-1 bg-red-500/10 hover:bg-red-500/20 text-red-500 px-3 py-1.5 rounded-lg text-sm transition-colors"
                                        >
                                            Delete
                                        </button>
                                    </td>
                                </tr>
                            ))}
                        </tbody>
                    </table>
                </div>

                {/* Pagination Controls */}
                <div className="mt-6 flex justify-between items-center text-sm text-gray-400 border-t border-border pt-4">
                    <span>Showing {(pagination.page - 1) * 10 + 1} to {Math.min(pagination.page * 10, pagination.total)} of {pagination.total} Users</span>
                    <div className="flex gap-2">
                        <button 
                            onClick={() => setPage(Math.max(1, page - 1))}
                            disabled={page === 1}
                            className={`px-3 py-1.5 rounded-lg ${page === 1 ? 'bg-bg-surface text-gray-500 cursor-not-allowed' : 'bg-bg-elevated hover:bg-border text-white transition-colors'}`}
                        >
                            Previous
                        </button>
                        <button 
                            onClick={() => setPage(Math.min(pagination.pages, page + 1))}
                            disabled={page === pagination.pages || pagination.pages === 0}
                            className={`px-3 py-1.5 rounded-lg ${page === pagination.pages || pagination.pages === 0 ? 'bg-bg-surface text-gray-500 cursor-not-allowed' : 'bg-bg-elevated hover:bg-border text-white transition-colors'}`}
                        >
                            Next
                        </button>
                    </div>
                </div>
            </div>

            {/* Delete Confirmation Modal */}
            {deleteModalUserId && (
                <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 backdrop-blur-sm">
                    <div className="bg-bg-surface border border-border rounded-xl p-6 max-w-sm w-full mx-4 shadow-xl">
                        <h3 className="text-xl font-bold text-white mb-2">Confirm Deletion</h3>
                        <p className="text-gray-400 mb-6">
                            Are you sure you want to delete this user? This action cannot be undone.
                        </p>
                        <div className="flex justify-end gap-3">
                            <button 
                                onClick={() => setDeleteModalUserId(null)}
                                className="px-4 py-2 rounded-lg bg-bg-elevated hover:bg-border text-white transition-colors text-sm font-medium"
                            >
                                Cancel
                            </button>
                            <button 
                                onClick={confirmDelete}
                                className="px-4 py-2 rounded-lg bg-red-500 hover:bg-red-600 text-white transition-colors text-sm font-medium"
                            >
                                Delete User
                            </button>
                        </div>
                    </div>
                </div>
            )}

            {/* Preference Modal */}
            {preferenceModalUserId && (
                <PreferenceModal 
                    userId={preferenceModalUserId} 
                    onClose={() => setPreferenceModalUserId(null)} 
                />
            )}
        </div>
    );
};

export default Users;
