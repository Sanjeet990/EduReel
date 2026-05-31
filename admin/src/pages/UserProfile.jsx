import { useEffect, useState } from 'react';
import { useParams, Link, useNavigate } from 'react-router-dom';
import { ArrowLeft, Save } from 'lucide-react';
import api from '../utils/api';

const UserProfile = () => {
    const { id } = useParams();
    const navigate = useNavigate();
    const isNew = id === 'new';
    const [loading, setLoading] = useState(true);
    const [plans, setPlans] = useState([]);
    const [formData, setFormData] = useState({
        name: '',
        email: '',
        password: '',
        isAdmin: false,
        trialActive: false,
        trialExpires: '',
        plan: '',
        planExpires: '',
        allowedDevices: 2
    });
    const [error, setError] = useState('');
    const [success, setSuccess] = useState('');

    useEffect(() => {
        const loadData = async () => {
            try {
                if (isNew) {
                    const plansRes = await api.get('/plans');
                    setPlans(plansRes.data.data);
                } else {
                    const [userRes, plansRes] = await Promise.all([
                        api.get(`/admin/users/${id}`),
                        api.get('/plans')
                    ]);

                    const user = userRes.data.data;
                    setPlans(plansRes.data.data);

                    setFormData({
                        name: user.name || '',
                        email: user.email || '',
                        password: '',
                        isAdmin: !!user.isAdmin,
                        trialActive: !!user.trialActive,
                        trialExpires: user.trialExpires ? new Date(user.trialExpires).toISOString().split('T')[0] : '',
                        plan: user.plan?._id || user.plan || '',
                        planExpires: user.planExpires ? new Date(user.planExpires).toISOString().split('T')[0] : '',
                        allowedDevices: user.allowedDevices || 2
                    });
                }
            } catch (e) {
                console.error(e);
                setError(isNew ? 'Failed to load plans' : 'Failed to load user data');
            } finally {
                setLoading(false);
            }
        };
        loadData();
    }, [id, isNew]);

    const handleChange = (e) => {
        const { name, value, type, checked } = e.target;
        setFormData(prev => ({
            ...prev,
            [name]: type === 'checkbox' ? checked : value
        }));
    };

    const handleSubmit = async (e) => {
        e.preventDefault();
        setError('');
        setSuccess('');
        
        try {
            // Clean up empty strings for plan/dates so they don't cause cast errors
            const submitData = { ...formData };
            if (!submitData.plan) submitData.plan = null;
            if (!submitData.trialExpires) submitData.trialExpires = null;
            if (!submitData.planExpires) submitData.planExpires = null;
            
            if (isNew) {
                await api.post(`/admin/users`, submitData);
                setSuccess('User created successfully');
                setTimeout(() => navigate('/users'), 1500);
            } else {
                await api.put(`/admin/users/${id}`, submitData);
                setSuccess('User updated successfully');
                setTimeout(() => setSuccess(''), 3000);
            }
        } catch (err) {
            setError(err.response?.data?.message || `Failed to ${isNew ? 'create' : 'update'} user`);
        }
    };

    if (loading) {
        return <div className="text-center text-gray-400 mt-10">Loading...</div>;
    }

    return (
        <div className="space-y-6 max-w-3xl">
            <div className="flex items-center gap-4">
                <Link to="/users" className="p-2 rounded-lg bg-bg-elevated hover:bg-border text-white transition-colors">
                    <ArrowLeft className="w-5 h-5" />
                </Link>
                <h1 className="text-3xl font-bold">{isNew ? 'Create User' : 'Edit User'}</h1>
            </div>
            
            <form onSubmit={handleSubmit} className="bg-bg-surface border border-border rounded-xl p-6 space-y-6">
                {error && <div className="p-3 bg-red-500/20 text-red-400 border border-red-500/50 rounded-lg">{error}</div>}
                {success && <div className="p-3 bg-green-500/20 text-green-400 border border-green-500/50 rounded-lg">{success}</div>}

                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                    <div>
                        <label className="block text-sm font-medium text-gray-400 mb-1">Name</label>
                        <input
                            type="text"
                            name="name"
                            value={formData.name}
                            onChange={handleChange}
                            required
                            className="w-full bg-bg-elevated border border-border rounded-lg px-4 py-2 text-white focus:outline-none focus:border-accent"
                        />
                    </div>
                    <div>
                        <label className="block text-sm font-medium text-gray-400 mb-1">Email</label>
                        <input
                            type="email"
                            name="email"
                            value={formData.email}
                            onChange={handleChange}
                            required
                            className="w-full bg-bg-elevated border border-border rounded-lg px-4 py-2 text-white focus:outline-none focus:border-accent"
                        />
                    </div>
                    <div>
                        <label className="block text-sm font-medium text-gray-400 mb-1">
                            Password {!isNew && '(leave blank to keep current)'}
                        </label>
                        <input
                            type="password"
                            name="password"
                            value={formData.password}
                            onChange={handleChange}
                            required={isNew}
                            className="w-full bg-bg-elevated border border-border rounded-lg px-4 py-2 text-white focus:outline-none focus:border-accent"
                        />
                    </div>
                    <div>
                        <label className="block text-sm font-medium text-gray-400 mb-1">Allowed Devices</label>
                        <input
                            type="number"
                            name="allowedDevices"
                            value={formData.allowedDevices}
                            onChange={handleChange}
                            min="1"
                            className="w-full bg-bg-elevated border border-border rounded-lg px-4 py-2 text-white focus:outline-none focus:border-accent"
                        />
                    </div>
                </div>

                <div className="space-y-4 border-t border-border pt-4">
                    <h3 className="text-lg font-medium text-white">Status & Roles</h3>
                    <label className="flex items-center gap-3">
                        <input
                            type="checkbox"
                            name="isAdmin"
                            checked={formData.isAdmin}
                            onChange={handleChange}
                            className="w-4 h-4 rounded border-gray-600 bg-bg-elevated accent-accent"
                        />
                        <span className="text-gray-300">Is Admin</span>
                    </label>
                    <label className="flex items-center gap-3">
                        <input
                            type="checkbox"
                            name="trialActive"
                            checked={formData.trialActive}
                            onChange={handleChange}
                            className="w-4 h-4 rounded border-gray-600 bg-bg-elevated accent-accent"
                        />
                        <span className="text-gray-300">Trial Active</span>
                    </label>
                    <div>
                        <label className="block text-sm font-medium text-gray-400 mb-1">Trial Expires</label>
                        <input
                            type="date"
                            name="trialExpires"
                            value={formData.trialExpires}
                            onChange={handleChange}
                            className="w-full md:w-1/2 bg-bg-elevated border border-border rounded-lg px-4 py-2 text-white focus:outline-none focus:border-accent"
                        />
                    </div>
                </div>

                <div className="space-y-4 border-t border-border pt-4">
                    <h3 className="text-lg font-medium text-white">Subscription Plan</h3>
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                        <div>
                            <label className="block text-sm font-medium text-gray-400 mb-1">Plan</label>
                            <select
                                name="plan"
                                value={formData.plan}
                                onChange={handleChange}
                                className="w-full bg-bg-elevated border border-border rounded-lg px-4 py-2 text-white focus:outline-none focus:border-accent"
                            >
                                <option value="">No Plan</option>
                                {plans.map(p => (
                                    <option key={p._id} value={p._id}>{p.name}</option>
                                ))}
                            </select>
                        </div>
                        <div>
                            <label className="block text-sm font-medium text-gray-400 mb-1">Plan Expires</label>
                            <input
                                type="date"
                                name="planExpires"
                                value={formData.planExpires}
                                onChange={handleChange}
                                className="w-full bg-bg-elevated border border-border rounded-lg px-4 py-2 text-white focus:outline-none focus:border-accent"
                            />
                        </div>
                    </div>
                </div>

                <div className="pt-4 flex justify-end">
                    <button
                        type="submit"
                        className="bg-accent hover:bg-accent/90 text-white px-6 py-2 rounded-lg font-medium transition-colors flex items-center gap-2"
                    >
                        <Save className="w-4 h-4" />
                        {isNew ? 'Create User' : 'Save Changes'}
                    </button>
                </div>
            </form>
        </div>
    );
};

export default UserProfile;
