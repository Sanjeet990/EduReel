import { useState, useEffect } from 'react';
import api from '../utils/api';
import { 
    BarChart, Bar, XAxis, YAxis, Tooltip, ResponsiveContainer,
    PieChart, Pie, Cell
} from 'recharts';
import { Video, Users, Eye, CreditCard } from 'lucide-react';

const COLORS = ['#7C6FE8', '#44CC99', '#CAAA80', '#E04455', '#3B82F6', '#8B5CF6'];

const Dashboard = () => {
    const [stats, setStats] = useState(null);
    const [videos, setVideos] = useState([]);
    const [loading, setLoading] = useState(true);

    useEffect(() => {
        const fetchData = async () => {
            try {
                const [analyticsRes, videosRes] = await Promise.all([
                    api.get('/admin/analytics'),
                    api.get('/admin/videos')
                ]);
                setStats(analyticsRes.data.data);
                setVideos(videosRes.data.data);
            } catch (error) {
                console.error('Failed to fetch dashboard data', error);
            } finally {
                setLoading(false);
            }
        };
        fetchData();
    }, []);

    if (loading) {
        return <div className="flex h-full items-center justify-center text-accent">Loading dashboard...</div>;
    }

    const viewsData = stats?.viewsLast7Days || [];
    const pieData = stats?.viewsBySubject || [];

    // Top 5 Videos
    const topVideos = [...videos].sort((a, b) => b.viewCount - a.viewCount).slice(0, 5);

    return (
        <div className="space-y-6">
            <h1 className="text-3xl font-bold">Dashboard</h1>
            
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
                <StatCard icon={<Video className="text-blue-400" />} title="Total Reels" value={stats?.totalVideos || 0} />
                <StatCard icon={<Users className="text-green-400" />} title="Total Users" value={stats?.totalUsers || 0} />
                <StatCard icon={<Eye className="text-yellow-400" />} title="Total Views" value={stats?.totalViews || 0} />
                <StatCard icon={<CreditCard className="text-purple-400" />} title="Subscribers" value={stats?.activeSubscribers || 0} />
            </div>

            <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
                <div className="bg-bg-surface border border-border rounded-xl p-6">
                    <h3 className="text-lg font-semibold mb-4">Views (Last 7 Days)</h3>
                    <div className="h-64">
                        <ResponsiveContainer width="100%" height="100%">
                            <BarChart data={viewsData}>
                                <XAxis dataKey="name" stroke="#AAAAAA" />
                                <YAxis stroke="#AAAAAA" />
                                <Tooltip cursor={{fill: '#1A1A2A'}} contentStyle={{backgroundColor: '#141420', border: '1px solid #2A2A3A'}} />
                                <Bar dataKey="views" fill="#7C6FE8" radius={[4, 4, 0, 0]} />
                            </BarChart>
                        </ResponsiveContainer>
                    </div>
                </div>

                <div className="bg-bg-surface border border-border rounded-xl p-6">
                    <h3 className="text-lg font-semibold mb-4">Views by Subject</h3>
                    <div className="h-64">
                        <ResponsiveContainer width="100%" height="100%">
                            <PieChart>
                                <Pie data={pieData} dataKey="value" nameKey="name" cx="50%" cy="50%" innerRadius={60} outerRadius={80} paddingAngle={5}>
                                    {pieData.map((entry, index) => (
                                        <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />
                                    ))}
                                </Pie>
                                <Tooltip contentStyle={{backgroundColor: '#141420', border: '1px solid #2A2A3A'}} />
                            </PieChart>
                        </ResponsiveContainer>
                    </div>
                </div>
            </div>

            <div className="bg-bg-surface border border-border rounded-xl p-6">
                <h3 className="text-lg font-semibold mb-4">Top Videos</h3>
                <div className="overflow-x-auto">
                    <table className="w-full text-left">
                        <thead>
                            <tr className="text-gray-400 border-b border-border">
                                <th className="pb-3 font-medium">Title</th>
                                <th className="pb-3 font-medium">Subject</th>
                                <th className="pb-3 font-medium">Views</th>
                                <th className="pb-3 font-medium">Likes</th>
                                <th className="pb-3 font-medium">Status</th>
                            </tr>
                        </thead>
                        <tbody>
                            {topVideos.map(video => (
                                <tr key={video._id} className="border-b border-border/50 hover:bg-bg-elevated transition-colors">
                                    <td className="py-4">
                                        <div className="flex items-center">
                                            {video.thumbnailUrl ? (
                                                <img src={`http://localhost:5000${video.thumbnailUrl}`} alt="" className="w-10 h-10 rounded object-cover mr-3" />
                                            ) : (
                                                <div className="w-10 h-10 rounded bg-bg-elevated mr-3 flex items-center justify-center"><Video size={16} className="text-gray-500"/></div>
                                            )}
                                            <span className="font-medium truncate max-w-[200px]">{video.title}</span>
                                        </div>
                                    </td>
                                    <td className="py-4 text-gray-300">{video.subject}</td>
                                    <td className="py-4">{video.viewCount.toLocaleString()}</td>
                                    <td className="py-4">{video.likeCount.toLocaleString()}</td>
                                    <td className="py-4">
                                        <span className={`px-2 py-1 rounded text-xs font-medium ${
                                            video.status === 'ready' ? 'bg-success/20 text-success' : 
                                            video.status === 'processing' ? 'bg-warning/20 text-warning' : 
                                            'bg-red-500/20 text-red-500'
                                        }`}>
                                            {video.status}
                                        </span>
                                    </td>
                                </tr>
                            ))}
                            {topVideos.length === 0 && (
                                <tr>
                                    <td colSpan="5" className="py-8 text-center text-gray-500">No videos found</td>
                                </tr>
                            )}
                        </tbody>
                    </table>
                </div>
            </div>
        </div>
    );
};

const StatCard = ({ icon, title, value }) => (
    <div className="bg-bg-surface border border-border rounded-xl p-6 flex items-center">
        <div className="p-3 bg-bg-elevated rounded-lg mr-4">
            {icon}
        </div>
        <div>
            <p className="text-sm text-gray-400">{title}</p>
            <p className="text-2xl font-bold">{typeof value === 'number' ? value.toLocaleString() : value}</p>
        </div>
    </div>
);

export default Dashboard;
