import { useEffect, useState } from 'react';
import { useParams, Link } from 'react-router-dom';
import { ArrowLeft } from 'lucide-react';
import api from '../utils/api';

const UserProfile = () => {
    const { id } = useParams();
    const [profile, setProfile] = useState(null);

    useEffect(() => {
        const load = async () => {
            try {
                const res = await api.get(`/users/${id}/public-profile`);
                setProfile(res.data.data);
            } catch (e) {
                console.error(e);
            }
        };
        load();
    }, [id]);

    return (
        <div className="space-y-6">
            <div className="flex items-center gap-4">
                <Link to="/users" className="p-2 rounded-lg bg-bg-elevated hover:bg-border text-white transition-colors">
                    <ArrowLeft className="w-5 h-5" />
                </Link>
                <h1 className="text-3xl font-bold">User Profile</h1>
            </div>
            <div className="bg-bg-surface border border-border rounded-xl p-6">
                <p className="text-xl font-semibold">{profile?.name || 'Unknown'}</p>
                <p className="text-gray-300 mt-1">{profile?.email || '-'}</p>
                <p className="text-gray-400 mt-4">Followers: {profile?.followerCount ?? 0}</p>
                <p className="text-gray-400">Following: {profile?.followingCount ?? 0}</p>
                <p className="text-gray-400">Uploaded Videos: {profile?.videos?.length ?? 0}</p>
            </div>
        </div>
    );
};

export default UserProfile;
