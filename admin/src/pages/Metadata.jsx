import { useState, useEffect } from 'react';
import api from '../utils/api';
import { Plus, Trash2, Save, Loader2, Library, BookOpen } from 'lucide-react';

function Metadata() {
    const [metadata, setMetadata] = useState({ classes: [], subjects: [] });
    const [loading, setLoading] = useState(true);
    const [saving, setSaving] = useState(false);
    const [error, setError] = useState('');
    const [success, setSuccess] = useState('');
    
    // New Class State
    const [newClassName, setNewClassName] = useState('');
    const [newClassValue, setNewClassValue] = useState('');
    
    // New Subject State
    const [newSubjectName, setNewSubjectName] = useState('');
    const [newSubjectIcon, setNewSubjectIcon] = useState('');

    useEffect(() => {
        fetchMetadata();
    }, []);

    const fetchMetadata = async () => {
        try {
            const res = await api.get('/metadata');
            setMetadata(res.data.data);
            setLoading(false);
        } catch (error) {
            console.error('Error fetching metadata', error);
            setError('Failed to load metadata');
            setLoading(false);
        }
    };

    const saveMetadata = async (updatedMetadata) => {
        setSaving(true);
        setError('');
        setSuccess('');
        try {
            const token = localStorage.getItem('token');
            await api.put('/metadata', updatedMetadata, {
                headers: { Authorization: `Bearer ${token}` }
            });
            setMetadata(updatedMetadata);
            setSuccess('Metadata saved successfully!');
            setTimeout(() => setSuccess(''), 3000);
        } catch (error) {
            console.error('Error saving metadata', error);
            setError('Failed to save metadata');
        } finally {
            setSaving(false);
        }
    };

    const addClass = () => {
        if (!newClassName || !newClassValue) return;
        const updated = {
            ...metadata,
            classes: [...(metadata?.classes || []), { name: newClassName, value: parseInt(newClassValue) }]
        };
        saveMetadata(updated);
        setNewClassName('');
        setNewClassValue('');
    };

    const removeClass = (index) => {
        const updatedClasses = [...metadata.classes];
        updatedClasses.splice(index, 1);
        saveMetadata({ ...metadata, classes: updatedClasses });
    };

    const addSubject = () => {
        if (!newSubjectName || !newSubjectIcon) return;
        const updated = {
            ...metadata,
            subjects: [...(metadata?.subjects || []), { name: newSubjectName, icon: newSubjectIcon }]
        };
        saveMetadata(updated);
        setNewSubjectName('');
        setNewSubjectIcon('');
    };

    const removeSubject = (index) => {
        const updatedSubjects = [...metadata.subjects];
        updatedSubjects.splice(index, 1);
        saveMetadata({ ...metadata, subjects: updatedSubjects });
    };

    if (loading) {
        return (
            <div className="flex justify-center items-center h-64 text-gray-400">
                <Loader2 className="w-8 h-8 animate-spin" />
            </div>
        );
    }

    return (
        <div className="space-y-6">
            <div>
                <h1 className="text-3xl font-bold">App Metadata</h1>
                <p className="text-gray-400 mt-2">Manage dynamic classes and subjects served to the Android app.</p>
            </div>

            {error && <div className="p-4 bg-red-500/20 text-red-400 border border-red-500/50 rounded-xl">{error}</div>}
            {success && <div className="p-4 bg-success/20 text-success border border-success/50 rounded-xl">{success}</div>}

            <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
                {/* Classes Section */}
                <div className="bg-bg-surface border border-border rounded-xl p-6 flex flex-col">
                    <div className="flex items-center gap-2 mb-6">
                        <Library className="w-5 h-5 text-accent" />
                        <h2 className="text-xl font-bold text-white">Classes</h2>
                    </div>
                    
                    <div className="flex-1 space-y-3 mb-6">
                        {metadata?.classes?.map((cls, index) => (
                            <div key={index} className="flex justify-between items-center bg-bg-elevated border border-border p-3 rounded-lg">
                                <div>
                                    <span className="font-medium text-white">{cls.name}</span>
                                    <span className="text-sm text-gray-400 ml-2">(Value: {cls.value})</span>
                                </div>
                                <button 
                                    onClick={() => removeClass(index)} 
                                    className="p-2 text-red-500 hover:bg-red-500/10 rounded-lg transition-colors"
                                    title="Remove Class"
                                >
                                    <Trash2 className="w-4 h-4" />
                                </button>
                            </div>
                        ))}
                        {(!metadata?.classes || metadata.classes.length === 0) && (
                            <div className="text-center text-gray-500 py-4">No classes added yet.</div>
                        )}
                    </div>

                    <div className="flex flex-col sm:flex-row gap-3 pt-4 border-t border-border mt-auto">
                        <input 
                            type="text" 
                            placeholder="Name (e.g. Class 12)" 
                            value={newClassName}
                            onChange={e => setNewClassName(e.target.value)}
                            className="bg-bg-elevated border border-border rounded-lg px-4 py-2 text-white focus:outline-none focus:border-accent flex-1"
                        />
                        <input 
                            type="number" 
                            placeholder="Value (e.g. 12)" 
                            value={newClassValue}
                            onChange={e => setNewClassValue(e.target.value)}
                            className="bg-bg-elevated border border-border rounded-lg px-4 py-2 text-white focus:outline-none focus:border-accent w-full sm:w-32"
                        />
                        <button 
                            onClick={addClass}
                            disabled={saving}
                            className="bg-accent hover:bg-accent/90 text-white px-4 py-2 rounded-lg font-medium transition-colors flex items-center justify-center gap-2 whitespace-nowrap disabled:opacity-50"
                        >
                            <Plus className="w-4 h-4" /> Add
                        </button>
                    </div>
                </div>

                {/* Subjects Section */}
                <div className="bg-bg-surface border border-border rounded-xl p-6 flex flex-col">
                    <div className="flex items-center gap-2 mb-6">
                        <BookOpen className="w-5 h-5 text-accent" />
                        <h2 className="text-xl font-bold text-white">Subjects</h2>
                    </div>
                    
                    <div className="flex-1 grid grid-cols-2 sm:grid-cols-3 gap-3 mb-6 content-start">
                        {metadata?.subjects?.map((sub, index) => (
                            <div key={index} className="flex flex-col items-center justify-center bg-bg-elevated border border-border p-4 rounded-lg relative group">
                                <button 
                                    onClick={() => removeSubject(index)} 
                                    className="absolute top-2 right-2 p-1 text-red-500 opacity-0 group-hover:opacity-100 hover:bg-red-500/10 rounded-md transition-all"
                                    title="Remove Subject"
                                >
                                    <Trash2 className="w-3.5 h-3.5" />
                                </button>
                                <span className="text-3xl mb-2">{sub.icon}</span>
                                <span className="text-sm font-medium text-white truncate w-full text-center">{sub.name}</span>
                            </div>
                        ))}
                        {(!metadata?.subjects || metadata.subjects.length === 0) && (
                            <div className="col-span-full text-center text-gray-500 py-4">No subjects added yet.</div>
                        )}
                    </div>

                    <div className="flex flex-col sm:flex-row gap-3 pt-4 border-t border-border mt-auto">
                        <input 
                            type="text" 
                            placeholder="Name (e.g. Science)" 
                            value={newSubjectName}
                            onChange={e => setNewSubjectName(e.target.value)}
                            className="bg-bg-elevated border border-border rounded-lg px-4 py-2 text-white focus:outline-none focus:border-accent flex-1"
                        />
                        <input 
                            type="text" 
                            placeholder="Emoji (e.g. 🔬)" 
                            value={newSubjectIcon}
                            onChange={e => setNewSubjectIcon(e.target.value)}
                            className="bg-bg-elevated border border-border rounded-lg px-4 py-2 text-white focus:outline-none focus:border-accent w-full sm:w-32 text-center"
                        />
                        <button 
                            onClick={addSubject}
                            disabled={saving}
                            className="bg-accent hover:bg-accent/90 text-white px-4 py-2 rounded-lg font-medium transition-colors flex items-center justify-center gap-2 whitespace-nowrap disabled:opacity-50"
                        >
                            <Plus className="w-4 h-4" /> Add
                        </button>
                    </div>
                </div>
            </div>
        </div>
    );
}

export default Metadata;
