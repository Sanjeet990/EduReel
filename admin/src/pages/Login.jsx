import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuthStore } from '../store/authStore';
import api from '../utils/api';

const Login = () => {
    const [email, setEmail] = useState('');
    const [password, setPassword] = useState('');
    const [error, setError] = useState('');
    const setAuth = useAuthStore((state) => state.setAuth);
    const navigate = useNavigate();

    const handleSubmit = async (e) => {
        e.preventDefault();
        setError('');
        try {
            const res = await api.post('/auth/login', { 
                email, 
                password,
                deviceId: 'admin-panel'
            });
            const { token } = res.data.data;

            if (!res.data.data.isAdmin) {
                setError('Not authorized as an admin');
                return;
            }

            setAuth(res.data.data, token);
            navigate('/');
        } catch (err) {
            console.log('Login error:', err);
            setError(err.response?.data?.message || 'Login failed');
        }
    };

    return (
        <div className="min-h-screen flex items-center justify-center bg-bg">
            <div className="bg-bg-surface p-8 rounded-xl border border-border w-full max-w-md shadow-2xl">
                <h1 className="text-3xl font-bold text-center text-accent mb-2">EduReel</h1>
                <p className="text-gray-400 text-center mb-8">Admin Panel Login</p>

                {error && (
                    <div className="bg-red-500/10 border border-red-500/50 text-red-500 p-3 rounded-lg mb-6 text-sm">
                        {error}
                    </div>
                )}

                <form onSubmit={handleSubmit} className="space-y-4">
                    <div>
                        <label className="block text-sm font-medium text-gray-400 mb-1">Email</label>
                        <input
                            type="email"
                            className="w-full bg-bg-elevated border border-border rounded-lg px-4 py-2.5 text-white focus:outline-none focus:border-accent transition-colors"
                            value={email}
                            onChange={(e) => setEmail(e.target.value)}
                            required
                        />
                    </div>
                    <div>
                        <label className="block text-sm font-medium text-gray-400 mb-1">Password</label>
                        <input
                            type="password"
                            className="w-full bg-bg-elevated border border-border rounded-lg px-4 py-2.5 text-white focus:outline-none focus:border-accent transition-colors"
                            value={password}
                            onChange={(e) => setPassword(e.target.value)}
                            required
                        />
                    </div>
                    <button
                        type="submit"
                        className="w-full bg-accent hover:bg-accent-light text-white font-medium py-2.5 rounded-lg transition-colors mt-6"
                    >
                        Sign In
                    </button>
                </form>
            </div>
        </div>
    );
};

export default Login;
