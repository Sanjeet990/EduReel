import { useState, useEffect } from 'react';
import api from '../utils/api';

function Metadata() {
    const [metadata, setMetadata] = useState({ classes: [], subjects: [] });
    const [loading, setLoading] = useState(true);
    const [saving, setSaving] = useState(false);
    
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
            setLoading(false);
        }
    };

    const saveMetadata = async (updatedMetadata) => {
        setSaving(true);
        try {
            const token = localStorage.getItem('token');
            await api.put('/metadata', updatedMetadata, {
                headers: { Authorization: `Bearer ${token}` }
            });
            setMetadata(updatedMetadata);
            setSaving(false);
            alert('Saved successfully!');
        } catch (error) {
            console.error('Error saving metadata', error);
            setSaving(false);
            alert('Failed to save');
        }
    };

    const addClass = () => {
        console.log(newClassName, newClassValue);
        if (!newClassName || !newClassValue) return;
        const updated = {
            ...metadata,
            classes: [...metadata?.classes, { name: newClassName, value: parseInt(newClassValue) }]
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
            subjects: [...metadata?.subjects, { name: newSubjectName, icon: newSubjectIcon }]
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

    if (loading) return <div>Loading...</div>;

    return (
        <div className="space-y-6">
            <h1 className="text-2xl font-bold text-white">App Metadata</h1>
            <p className="text-gray-400 text-sm mb-6">Manage dynamic classes and subjects served to the Android app.</p>

            {/* Classes Section */}
            <div className="bg-gray-800 rounded-lg p-6">
                <h2 className="text-xl font-bold text-white mb-4">Classes</h2>
                
                <div className="grid grid-cols-1 gap-4 mb-6">
                    {metadata?.classes.map((cls, index) => (
                        <div key={index} className="flex justify-between items-center bg-gray-700 p-3 rounded">
                            <span className="text-white">{cls.name} (Value: {cls.value})</span>
                            <button onClick={() => removeClass(index)} className="text-red-500 hover:text-red-400">Remove</button>
                        </div>
                    ))}
                </div>

                <div className="flex gap-4">
                    <input 
                        type="text" 
                        placeholder="Class Name (e.g. Class 12)" 
                        value={newClassName}
                        onChange={e => setNewClassName(e.target.value)}
                        className="bg-gray-700 text-white px-4 py-2 rounded flex-1"
                    />
                    <input 
                        type="number" 
                        placeholder="Numeric Value (e.g. 12)" 
                        value={newClassValue}
                        onChange={e => setNewClassValue(e.target.value)}
                        className="bg-gray-700 text-white px-4 py-2 rounded w-32"
                    />
                    <button 
                        onClick={addClass}
                        disabled={saving}
                        className="bg-primary hover:bg-primary/90 text-white px-6 py-2 rounded"
                    >
                        Add Class
                    </button>
                </div>
            </div>

            {/* Subjects Section */}
            <div className="bg-gray-800 rounded-lg p-6">
                <h2 className="text-xl font-bold text-white mb-4">Subjects</h2>
                
                <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-6">
                    {metadata?.subjects.map((sub, index) => (
                        <div key={index} className="flex flex-col items-center bg-gray-700 p-4 rounded text-center relative">
                            <button onClick={() => removeSubject(index)} className="absolute top-2 right-2 text-red-500 hover:text-red-400 text-xs">X</button>
                            <span className="text-2xl mb-2">{sub.icon}</span>
                            <span className="text-white">{sub.name}</span>
                        </div>
                    ))}
                </div>

                <div className="flex gap-4">
                    <input 
                        type="text" 
                        placeholder="Subject Name (e.g. Science)" 
                        value={newSubjectName}
                        onChange={e => setNewSubjectName(e.target.value)}
                        className="bg-gray-700 text-white px-4 py-2 rounded flex-1"
                    />
                    <input 
                        type="text" 
                        placeholder="Emoji/Icon (e.g. 🔬)" 
                        value={newSubjectIcon}
                        onChange={e => setNewSubjectIcon(e.target.value)}
                        className="bg-gray-700 text-white px-4 py-2 rounded w-32 text-center"
                    />
                    <button 
                        onClick={addSubject}
                        disabled={saving}
                        className="bg-primary hover:bg-primary/90 text-white px-6 py-2 rounded"
                    >
                        Add Subject
                    </button>
                </div>
            </div>
        </div>
    );
}

export default Metadata;
