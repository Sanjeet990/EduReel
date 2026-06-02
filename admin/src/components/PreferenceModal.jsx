import { useState, useEffect } from 'react';
import api from '../utils/api';

const PreferenceModal = ({ userId, onClose }) => {
    const [loading, setLoading] = useState(true);
    const [saving, setSaving] = useState(false);
    const [metadata, setMetadata] = useState({ classes: [], subjects: [] });
    
    const [ageGroup, setAgeGroup] = useState('');
    const [classLevel, setClassLevel] = useState('');
    const [subjects, setSubjects] = useState([]);

    const [error, setError] = useState('');

    useEffect(() => {
        const loadData = async () => {
            try {
                const [prefRes, metaRes] = await Promise.all([
                    api.get(`/admin/users/${userId}/preferences`),
                    api.get('/metadata')
                ]);

                const prefs = prefRes.data.data;
                const meta = metaRes.data.data;

                setMetadata({
                    classes: meta.classes || [],
                    subjects: meta.subjects || []
                });

                setAgeGroup(prefs.ageGroup || '');
                setClassLevel(prefs.classLevel ?? '');
                setSubjects(prefs.subjects || []);
                
            } catch (err) {
                console.error(err);
                setError('Failed to load preferences or metadata.');
            } finally {
                setLoading(false);
            }
        };
        loadData();
    }, [userId]);

    const handleSubjectToggle = (s) => {
        const fullSubject = `${s.icon} ${s.name}`;
        setSubjects(prev => {
            const hasFull = prev.includes(fullSubject);
            const hasNameOnly = prev.includes(s.name);
            
            if (hasFull || hasNameOnly) {
                // remove both to be safe
                return prev.filter(item => item !== fullSubject && item !== s.name);
            } else {
                return [...prev, fullSubject];
            }
        });
    };

    const handleSave = async () => {
        setSaving(true);
        setError('');
        try {
            await api.put(`/admin/users/${userId}/preferences`, {
                ageGroup,
                classLevel: classLevel === '' ? null : Number(classLevel),
                subjects
            });
            onClose();
        } catch (err) {
            console.error(err);
            setError(err.response?.data?.message || 'Failed to save preferences.');
        } finally {
            setSaving(false);
        }
    };

    return (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 backdrop-blur-sm p-4">
            <div className="bg-bg-surface border border-border rounded-xl p-6 w-full max-w-2xl shadow-xl max-h-[90vh] overflow-y-auto">
                <div className="flex justify-between items-center mb-6">
                    <h2 className="text-2xl font-bold text-white">Edit User Preferences</h2>
                    <button onClick={onClose} className="text-gray-400 hover:text-white">&times;</button>
                </div>

                {error && <div className="p-3 mb-4 bg-red-500/20 text-red-400 border border-red-500/50 rounded-lg">{error}</div>}

                {loading ? (
                    <div className="text-center text-gray-400 py-10">Loading...</div>
                ) : (
                    <div className="space-y-6">
                        
                        {/* Age Group */}
                        <div>
                            <label className="block text-sm font-medium text-gray-400 mb-2">Age Group</label>
                            <select
                                value={ageGroup}
                                onChange={(e) => setAgeGroup(e.target.value)}
                                className="w-full bg-bg-elevated border border-border rounded-lg px-4 py-2 text-white focus:outline-none focus:border-accent"
                            >
                                <option value="">Select Age Group</option>
                                <option value="Under 13">Under 13</option>
                                <option value="13-17">13 - 17</option>
                                <option value="18-22">18 - 22</option>
                                <option value="23+">23+</option>
                            </select>
                        </div>

                        {/* Class */}
                        <div>
                            <label className="block text-sm font-medium text-gray-400 mb-2">Class Level</label>
                            <div className="grid grid-cols-3 sm:grid-cols-4 gap-3">
                                {metadata.classes.map(c => (
                                    <button
                                        key={c.value}
                                        type="button"
                                        onClick={() => setClassLevel(c.value)}
                                        className={`py-2 px-3 rounded-lg text-sm font-medium transition-colors border ${
                                            Number(classLevel) === c.value 
                                            ? 'bg-accent text-white border-accent' 
                                            : 'bg-bg-elevated text-gray-300 border-border hover:border-gray-500'
                                        }`}
                                    >
                                        {c.name}
                                    </button>
                                ))}
                                <button
                                    type="button"
                                    onClick={() => setClassLevel('')}
                                    className={`py-2 px-3 rounded-lg text-sm font-medium transition-colors border ${
                                        classLevel === '' 
                                        ? 'bg-accent text-white border-accent' 
                                        : 'bg-bg-elevated text-gray-300 border-border hover:border-gray-500'
                                    }`}
                                >
                                    None
                                </button>
                            </div>
                        </div>

                        {/* Subjects / Interests */}
                        <div>
                            <label className="block text-sm font-medium text-gray-400 mb-2">Subjects & Interests</label>
                            <div className="flex flex-wrap gap-3">
                                {metadata.subjects.map(s => {
                                    const fullSubject = `${s.icon} ${s.name}`;
                                    const isSelected = subjects.includes(fullSubject) || subjects.includes(s.name);
                                    return (
                                        <button
                                            key={s.name}
                                            type="button"
                                            onClick={() => handleSubjectToggle(s)}
                                            className={`px-4 py-2 rounded-full text-sm font-medium transition-colors border ${
                                                isSelected
                                                ? 'bg-accent text-white border-accent'
                                                : 'bg-bg-elevated text-gray-400 border-border hover:border-gray-500 hover:text-gray-300'
                                            }`}
                                        >
                                            {fullSubject}
                                        </button>
                                    );
                                })}
                            </div>
                        </div>
                        
                        <div className="pt-4 flex justify-end gap-3 border-t border-border mt-6">
                            <button 
                                onClick={onClose}
                                disabled={saving}
                                className="px-4 py-2 rounded-lg bg-bg-elevated hover:bg-border text-white transition-colors font-medium"
                            >
                                Cancel
                            </button>
                            <button 
                                onClick={handleSave}
                                disabled={saving}
                                className="px-6 py-2 rounded-lg bg-accent hover:bg-accent/90 text-white transition-colors font-medium flex items-center gap-2"
                            >
                                {saving ? 'Saving...' : 'Save Preferences'}
                            </button>
                        </div>
                    </div>
                )}
            </div>
        </div>
    );
};

export default PreferenceModal;
