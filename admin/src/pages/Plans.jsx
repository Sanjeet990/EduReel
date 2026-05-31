import { useState, useEffect } from 'react';
import api from '../utils/api';

const Plans = () => {
    const [plans, setPlans] = useState([]);

    useEffect(() => {
        const fetchPlans = async () => {
            try {
                const res = await api.get('/plans');
                setPlans(res.data.data);
            } catch (err) {
                console.error(err);
            }
        };
        fetchPlans();
    }, []);

    return (
        <div className="space-y-6">
            <h1 className="text-3xl font-bold">Subscription Plans</h1>
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                {plans.map(plan => (
                    <div key={plan._id} className="bg-bg-surface border border-border rounded-xl p-6">
                        <div className="flex justify-between items-center mb-4">
                            <h3 className="text-xl font-bold">{plan.name}</h3>
                            <span className="text-2xl font-bold text-accent">₹{plan.price}</span>
                        </div>
                        <p className="text-gray-400 mb-4">{plan.durationDays} days • {plan.numberOfDevices} Devices</p>
                        <ul className="space-y-2 mb-6">
                            {plan.features?.map((f, i) => (
                                <li key={i} className="flex items-center text-sm text-gray-300">
                                    <span className="text-success mr-2">✓</span> {f}
                                </li>
                            ))}
                        </ul>
                        <button className="w-full bg-bg-elevated hover:bg-border text-white py-2 rounded-lg transition-colors">
                            Edit Plan
                        </button>
                    </div>
                ))}
            </div>
        </div>
    );
};

export default Plans;
