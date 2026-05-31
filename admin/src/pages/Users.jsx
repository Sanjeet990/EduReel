import { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import api from '../utils/api';

const Users = () => {
    const [users, setUsers] = useState([]);

    useEffect(() => {
        const fetchUsers = async () => {
            try {
                const res = await api.get('/admin/users');
                setUsers(res.data.data);
            } catch (err) {
                console.error(err);
            }
        };
        fetchUsers();
    }, []);

    return (
        <div className="space-y-6">
            <h1 className="text-3xl font-bold">Users</h1>
            <div className="bg-bg-surface border border-border rounded-xl p-6">
                <div className="overflow-x-auto">
                    <table className="w-full text-left">
                        <thead>
                            <tr className="text-gray-400 border-b border-border">
                                <th className="pb-3 font-medium">Name</th>
                                <th className="pb-3 font-medium">Email</th>
                                <th className="pb-3 font-medium">Plan</th>
                                <th className="pb-3 font-medium">Role</th>
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
                                </tr>
                            ))}
                        </tbody>
                    </table>
                </div>
            </div>
        </div>
    );
};

export default Users;
