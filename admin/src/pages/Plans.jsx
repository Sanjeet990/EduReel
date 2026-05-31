import { useState, useEffect } from 'react';
import api from '../utils/api';
import { Plus, X, Trash2, Edit2, Save } from 'lucide-react';

const Plans = () => {
    const [plans, setPlans] = useState([]);
    
    const [isModalOpen, setIsModalOpen] = useState(false);
    const [editingPlan, setEditingPlan] = useState(null);
    const [formData, setFormData] = useState({
        name: '',
        durationDays: 30,
        price: 0,
        numberOfDevices: 2,
        features: ['']
    });
    
    const [error, setError] = useState('');
    const [saving, setSaving] = useState(false);

    const fetchPlans = async () => {
        try {
            const res = await api.get('/plans');
            setPlans(res.data.data);
        } catch (err) {
            console.error(err);
        }
    };

    useEffect(() => {
        fetchPlans();
    }, []);

    const openModal = (plan = null) => {
        setError('');
        if (plan) {
            setEditingPlan(plan);
            setFormData({
                name: plan.name,
                durationDays: plan.durationDays,
                price: plan.price,
                numberOfDevices: plan.numberOfDevices,
                features: plan.features?.length > 0 ? [...plan.features] : ['']
            });
        } else {
            setEditingPlan(null);
            setFormData({
                name: '',
                durationDays: 30,
                price: 0,
                numberOfDevices: 2,
                features: ['']
            });
        }
        setIsModalOpen(true);
    };

    const closeModal = () => {
        setIsModalOpen(false);
        setEditingPlan(null);
    };

    const handleFeatureChange = (index, value) => {
        const newFeatures = [...formData.features];
        newFeatures[index] = value;
        setFormData(prev => ({ ...prev, features: newFeatures }));
    };

    const addFeature = () => {
        setFormData(prev => ({ ...prev, features: [...prev.features, ''] }));
    };

    const removeFeature = (index) => {
        const newFeatures = [...formData.features];
        newFeatures.splice(index, 1);
        setFormData(prev => ({ ...prev, features: newFeatures }));
    };

    const handleSubmit = async (e) => {
        e.preventDefault();
        setSaving(true);
        setError('');
        try {
            const submitData = {
                ...formData,
                features: formData.features.filter(f => f.trim() !== '')
            };
            
            if (editingPlan) {
                await api.put(`/plans/${editingPlan._id}`, submitData);
            } else {
                await api.post('/plans', submitData);
            }
            
            await fetchPlans();
            closeModal();
        } catch (err) {
            console.error(err);
            setError(err.response?.data?.message || 'Failed to save plan');
        } finally {
            setSaving(false);
        }
    };

    const handleDelete = async (id) => {
        if (!window.confirm('Are you sure you want to delete this plan? Active users on this plan will not be affected immediately, but it will be hidden from new subscribers.')) return;
        
        try {
            await api.delete(`/plans/${id}`);
            await fetchPlans();
        } catch (err) {
            console.error(err);
            alert(err.response?.data?.message || 'Failed to delete plan');
        }
    };

    return (
        <div className="space-y-6">
            <div className="flex justify-between items-center">
                <h1 className="text-3xl font-bold">Subscription Plans</h1>
                <button 
                    onClick={() => openModal()}
                    className="bg-accent hover:bg-accent/90 text-white px-4 py-2 rounded-lg font-medium transition-colors flex items-center gap-2"
                >
                    <Plus className="w-5 h-5" />
                    Create New Plan
                </button>
            </div>
            
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                {plans.map(plan => (
                    <div key={plan._id} className="bg-bg-surface border border-border rounded-xl p-6 flex flex-col">
                        <div className="flex justify-between items-center mb-4">
                            <h3 className="text-xl font-bold">{plan.name}</h3>
                            <span className="text-2xl font-bold text-accent">₹{plan.price}</span>
                        </div>
                        <p className="text-gray-400 mb-4">{plan.durationDays} days • {plan.numberOfDevices} Devices</p>
                        <ul className="space-y-2 mb-6 flex-grow">
                            {plan.features?.map((f, i) => (
                                <li key={i} className="flex items-start text-sm text-gray-300">
                                    <span className="text-success mr-2 mt-0.5">✓</span> 
                                    <span>{f}</span>
                                </li>
                            ))}
                        </ul>
                        <div className="flex gap-3 mt-auto">
                            <button 
                                onClick={() => openModal(plan)}
                                className="flex-1 bg-bg-elevated hover:bg-border text-white py-2 rounded-lg transition-colors flex justify-center items-center gap-2"
                            >
                                <Edit2 className="w-4 h-4" /> Edit
                            </button>
                            <button 
                                onClick={() => handleDelete(plan._id)}
                                className="px-4 bg-red-500/10 hover:bg-red-500/20 text-red-500 py-2 rounded-lg transition-colors flex justify-center items-center"
                                title="Delete Plan"
                            >
                                <Trash2 className="w-4 h-4" />
                            </button>
                        </div>
                    </div>
                ))}
            </div>

            {/* Modal */}
            {isModalOpen && (
                <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 backdrop-blur-sm p-4">
                    <div className="bg-bg-surface border border-border rounded-xl p-6 w-full max-w-xl shadow-xl max-h-[90vh] overflow-y-auto">
                        <div className="flex justify-between items-center mb-6">
                            <h2 className="text-2xl font-bold text-white">
                                {editingPlan ? 'Edit Plan' : 'Create New Plan'}
                            </h2>
                            <button onClick={closeModal} className="text-gray-400 hover:text-white">
                                <X className="w-6 h-6" />
                            </button>
                        </div>

                        {error && <div className="p-3 mb-6 bg-red-500/20 text-red-400 border border-red-500/50 rounded-lg">{error}</div>}

                        <form onSubmit={handleSubmit} className="space-y-5">
                            <div>
                                <label className="block text-sm font-medium text-gray-400 mb-1">Plan Name</label>
                                <input
                                    type="text"
                                    value={formData.name}
                                    onChange={(e) => setFormData({...formData, name: e.target.value})}
                                    required
                                    className="w-full bg-bg-elevated border border-border rounded-lg px-4 py-2 text-white focus:outline-none focus:border-accent"
                                    placeholder="e.g. Basic Plan"
                                />
                            </div>

                            <div className="grid grid-cols-2 gap-4">
                                <div>
                                    <label className="block text-sm font-medium text-gray-400 mb-1">Price (₹)</label>
                                    <input
                                        type="number"
                                        value={formData.price}
                                        onChange={(e) => setFormData({...formData, price: Number(e.target.value)})}
                                        required
                                        min="0"
                                        className="w-full bg-bg-elevated border border-border rounded-lg px-4 py-2 text-white focus:outline-none focus:border-accent"
                                    />
                                </div>
                                <div>
                                    <label className="block text-sm font-medium text-gray-400 mb-1">Duration (Days)</label>
                                    <input
                                        type="number"
                                        value={formData.durationDays}
                                        onChange={(e) => setFormData({...formData, durationDays: Number(e.target.value)})}
                                        required
                                        min="1"
                                        className="w-full bg-bg-elevated border border-border rounded-lg px-4 py-2 text-white focus:outline-none focus:border-accent"
                                    />
                                </div>
                            </div>
                            
                            <div>
                                <label className="block text-sm font-medium text-gray-400 mb-1">Allowed Devices</label>
                                <input
                                    type="number"
                                    value={formData.numberOfDevices}
                                    onChange={(e) => setFormData({...formData, numberOfDevices: Number(e.target.value)})}
                                    required
                                    min="1"
                                    className="w-full bg-bg-elevated border border-border rounded-lg px-4 py-2 text-white focus:outline-none focus:border-accent"
                                />
                            </div>

                            <div>
                                <label className="block text-sm font-medium text-gray-400 mb-2">Features</label>
                                <div className="space-y-3">
                                    {formData.features.map((feature, index) => (
                                        <div key={index} className="flex gap-2">
                                            <input
                                                type="text"
                                                value={feature}
                                                onChange={(e) => handleFeatureChange(index, e.target.value)}
                                                className="flex-1 bg-bg-elevated border border-border rounded-lg px-4 py-2 text-white focus:outline-none focus:border-accent"
                                                placeholder={`Feature ${index + 1}`}
                                            />
                                            {formData.features.length > 1 && (
                                                <button
                                                    type="button"
                                                    onClick={() => removeFeature(index)}
                                                    className="px-3 bg-red-500/10 hover:bg-red-500/20 text-red-500 rounded-lg transition-colors flex items-center justify-center"
                                                >
                                                    <Trash2 className="w-4 h-4" />
                                                </button>
                                            )}
                                        </div>
                                    ))}
                                </div>
                                <button
                                    type="button"
                                    onClick={addFeature}
                                    className="mt-3 text-sm text-accent hover:text-white transition-colors flex items-center gap-1 font-medium"
                                >
                                    <Plus className="w-4 h-4" /> Add Feature
                                </button>
                            </div>

                            <div className="pt-4 flex justify-end gap-3 border-t border-border mt-6">
                                <button 
                                    type="button"
                                    onClick={closeModal}
                                    disabled={saving}
                                    className="px-4 py-2 rounded-lg bg-bg-elevated hover:bg-border text-white transition-colors font-medium"
                                >
                                    Cancel
                                </button>
                                <button 
                                    type="submit"
                                    disabled={saving}
                                    className="px-6 py-2 rounded-lg bg-accent hover:bg-accent/90 text-white transition-colors font-medium flex items-center gap-2"
                                >
                                    <Save className="w-4 h-4" />
                                    {saving ? 'Saving...' : 'Save Plan'}
                                </button>
                            </div>
                        </form>
                    </div>
                </div>
            )}
        </div>
    );
};

export default Plans;
