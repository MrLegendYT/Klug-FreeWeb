import React, { useState, useEffect } from 'react';
import { useStore } from '../StoreContext';
import { Button } from '../components/Button';
import { Theme } from '../types';
import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer } from 'recharts';
import { Trash2, Upload, Layout, Users, Activity, FileCode, Layers, AlertTriangle } from 'lucide-react';
import { collection, getDocs } from 'firebase/firestore';
import { db } from '../services/firebase';

export const AdminDashboard: React.FC = () => {
  const { themes, addTheme, deleteTheme } = useStore();
  const [showUpload, setShowUpload] = useState(false);
  const [isUploading, setIsUploading] = useState(false);
  const [isDeletingAll, setIsDeletingAll] = useState(false);
  const [realStats, setRealStats] = useState({ users: 0, unlocks: 0 });
  
  // Fetch Real Stats
  useEffect(() => {
    const fetchStats = async () => {
      try {
        const usersSnap = await getDocs(collection(db, 'users'));
        const totalUsers = usersSnap.size;
        let totalUnlocks = 0;
        usersSnap.forEach(doc => {
          const u = doc.data();
          if (u.unlockedThemeIds && Array.isArray(u.unlockedThemeIds)) {
            totalUnlocks += u.unlockedThemeIds.length;
          }
        });
        setRealStats({ users: totalUsers, unlocks: totalUnlocks });
      } catch (e) {
        console.error("Error fetching stats:", e);
      }
    };
    fetchStats();
  }, [themes]); // Refresh when themes change

  // Chart Data (Mocked for visual representation of monthly trends)
  const data = [
    { name: 'Jan', clicks: 400 },
    { name: 'Feb', clicks: 300 },
    { name: 'Mar', clicks: 600 },
    { name: 'Apr', clicks: 800 },
    { name: 'May', clicks: 1000 },
  ];

  // Upload Form State
  const [newTheme, setNewTheme] = useState<Partial<Theme>>({
    title: '',
    description: '',
    clickPrice: 10,
    monetagLink: '',
    referralLink: '',
    previewHtml: ''
  });

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
        const reader = new FileReader();
        reader.onload = (event) => {
            if (event.target?.result) {
                setNewTheme(prev => ({ ...prev, previewHtml: event.target!.result as string }));
            }
        };
        reader.readAsText(file);
    }
  };

  const handleUpload = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!newTheme.title || !newTheme.previewHtml) {
        alert("Please provide at least a title and HTML content.");
        return;
    }
    
    setIsUploading(true);
    try {
      await addTheme({
        title: newTheme.title!,
        description: newTheme.description || '',
        clickPrice: newTheme.clickPrice || 0,
        monetagLink: newTheme.monetagLink || '',
        referralLink: newTheme.referralLink || '',
        previewHtml: newTheme.previewHtml!,
        author: 'Admin'
      });
      setShowUpload(false);
      // Reset
      setNewTheme({
          title: '',
          description: '',
          clickPrice: 10,
          monetagLink: '',
          referralLink: '',
          previewHtml: ''
      });
    } catch (error) {
      console.error("Failed to upload theme", error);
      alert("Failed to upload theme. Ensure you are authenticated as admin.");
    } finally {
      setIsUploading(false);
    }
  };

  const handleDeleteAll = async () => {
    if (window.confirm("ARE YOU SURE? This will permanently delete ALL themes from the website. This cannot be undone.")) {
      setIsDeletingAll(true);
      try {
        // We iterate backwards or just loop through the array
        const deletionPromises = themes.map(t => deleteTheme(t.id));
        await Promise.all(deletionPromises);
        alert("All themes have been deleted.");
      } catch (error) {
        console.error("Error deleting all themes:", error);
        alert("An error occurred while deleting themes.");
      } finally {
        setIsDeletingAll(false);
      }
    }
  };

  return (
    <div className="min-h-screen bg-slate-900 text-white p-8">
      <div className="max-w-7xl mx-auto">
        <header className="flex flex-col md:flex-row justify-between items-start md:items-center mb-10 gap-4">
          <div>
            <h1 className="text-3xl font-bold">Admin Dashboard</h1>
            <p className="text-slate-400">Manage themes, users, and monetization.</p>
          </div>
          <div className="flex gap-3">
             <Button variant="danger" onClick={handleDeleteAll} disabled={isDeletingAll || themes.length === 0}>
                {isDeletingAll ? 'Deleting...' : 'Delete All Themes'}
             </Button>
             <Button variant="primary" onClick={() => setShowUpload(!showUpload)}>
                {showUpload ? 'Cancel Upload' : 'Upload New Theme'}
             </Button>
          </div>
        </header>

        {showUpload && (
          <div className="bg-slate-800 p-6 rounded-xl mb-10 border border-slate-700 animate-fade-in">
            <h2 className="text-xl font-bold mb-4">Upload Theme</h2>
            <form onSubmit={handleUpload} className="grid grid-cols-1 md:grid-cols-2 gap-6">
              <input 
                className="bg-slate-900 border border-slate-700 p-3 rounded text-white" 
                placeholder="Theme Title" 
                value={newTheme.title}
                onChange={e => setNewTheme({...newTheme, title: e.target.value})}
                required
              />
              <input 
                className="bg-slate-900 border border-slate-700 p-3 rounded text-white" 
                placeholder="Click Price (Fills)" 
                type="number"
                value={newTheme.clickPrice}
                onChange={e => setNewTheme({...newTheme, clickPrice: parseInt(e.target.value)})}
                required
              />
               <input 
                className="bg-slate-900 border border-slate-700 p-3 rounded text-white md:col-span-2" 
                placeholder="Description" 
                value={newTheme.description}
                onChange={e => setNewTheme({...newTheme, description: e.target.value})}
                required
              />
               <input 
                className="bg-slate-900 border border-slate-700 p-3 rounded text-white" 
                placeholder="Monetag SmartLink" 
                value={newTheme.monetagLink}
                onChange={e => setNewTheme({...newTheme, monetagLink: e.target.value})}
              />
              <input 
                className="bg-slate-900 border border-slate-700 p-3 rounded text-white" 
                placeholder="Referral Signup Link (Optional)" 
                value={newTheme.referralLink}
                onChange={e => setNewTheme({...newTheme, referralLink: e.target.value})}
              />
              
              <div className="md:col-span-2 bg-slate-900 border border-slate-700 p-4 rounded text-white flex flex-col gap-2">
                 <label className="text-sm text-slate-400 font-medium flex items-center gap-2">
                    <FileCode size={16} /> Upload HTML File or Paste Code Below
                 </label>
                 <input 
                    type="file" 
                    accept=".html" 
                    onChange={handleFileChange}
                    className="block w-full text-sm text-slate-400 file:mr-4 file:py-2 file:px-4 file:rounded-full file:border-0 file:text-sm file:font-semibold file:bg-blue-600 file:text-white hover:file:bg-blue-700"
                 />
                 <textarea
                    className="bg-slate-950 border border-slate-800 p-3 rounded text-slate-300 w-full h-32 font-mono text-sm mt-2"
                    placeholder="<html>...</html>"
                    value={newTheme.previewHtml}
                    onChange={e => setNewTheme({...newTheme, previewHtml: e.target.value})}
                    required
                 />
              </div>

              <div className="md:col-span-2">
                <Button type="submit" className="w-full" disabled={isUploading}>
                  {isUploading ? 'Publishing...' : 'Publish Theme'}
                </Button>
              </div>
            </form>
          </div>
        )}

        {/* Stats Cards */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-10">
          <div className="bg-slate-800 p-6 rounded-xl border border-slate-700">
            <div className="flex items-center gap-4 mb-2">
              <div className="bg-blue-500/20 p-3 rounded-lg text-blue-500"><Layout size={24}/></div>
              <div>
                <p className="text-slate-400 text-sm">Total Themes</p>
                <p className="text-2xl font-bold">{themes.length}</p>
              </div>
            </div>
          </div>
           <div className="bg-slate-800 p-6 rounded-xl border border-slate-700">
            <div className="flex items-center gap-4 mb-2">
              <div className="bg-green-500/20 p-3 rounded-lg text-green-500"><Users size={24}/></div>
              <div>
                <p className="text-slate-400 text-sm">Active Users</p>
                <p className="text-2xl font-bold">{realStats.users}</p>
              </div>
            </div>
          </div>
           <div className="bg-slate-800 p-6 rounded-xl border border-slate-700">
            <div className="flex items-center gap-4 mb-2">
              <div className="bg-yellow-500/20 p-3 rounded-lg text-yellow-500"><Activity size={24}/></div>
              <div>
                <p className="text-slate-400 text-sm">Total Unlocks</p>
                <p className="text-2xl font-bold">{realStats.unlocks}</p>
              </div>
            </div>
          </div>
        </div>

        {/* Chart */}
        <div className="bg-slate-800 p-6 rounded-xl border border-slate-700 mb-10 h-80">
            <h3 className="text-lg font-bold mb-4">Traffic & Unlocks (Mock Data)</h3>
            <ResponsiveContainer width="100%" height="100%">
                <BarChart data={data}>
                    <CartesianGrid strokeDasharray="3 3" stroke="#334155" />
                    <XAxis dataKey="name" stroke="#94a3b8" />
                    <YAxis stroke="#94a3b8" />
                    <Tooltip contentStyle={{ backgroundColor: '#1e293b', borderColor: '#334155', color: '#fff' }} />
                    <Bar dataKey="clicks" fill="#3b82f6" radius={[4, 4, 0, 0]} />
                </BarChart>
            </ResponsiveContainer>
        </div>

        {/* Table */}
        <div className="bg-slate-800 rounded-xl border border-slate-700 overflow-hidden">
            <table className="w-full text-left">
                <thead className="bg-slate-900 border-b border-slate-700">
                    <tr>
                        <th className="p-4 text-slate-400 font-medium">Theme</th>
                        <th className="p-4 text-slate-400 font-medium">Click Price</th>
                        <th className="p-4 text-slate-400 font-medium">Links</th>
                        <th className="p-4 text-slate-400 font-medium">Actions</th>
                    </tr>
                </thead>
                <tbody>
                    {themes.length === 0 ? (
                        <tr>
                            <td colSpan={4} className="p-8 text-center text-slate-500">
                                <div className="flex flex-col items-center justify-center">
                                    <AlertTriangle size={32} className="mb-2 opacity-50" />
                                    No themes found. Upload one to get started.
                                </div>
                            </td>
                        </tr>
                    ) : (
                        themes.map(t => (
                            <tr key={t.id} className="border-b border-slate-700 hover:bg-slate-750">
                                <td className="p-4 flex items-center gap-3">
                                    <div className="w-10 h-10 rounded bg-slate-700 flex items-center justify-center text-slate-400">
                                        <Layers size={20} />
                                    </div>
                                    <span className="font-medium">{t.title}</span>
                                </td>
                                <td className="p-4">{t.clickPrice}</td>
                                <td className="p-4 text-sm text-slate-500">
                                    {t.monetagLink ? <span className="text-green-400">SmartLink Set</span> : 'No Link'}
                                </td>
                                <td className="p-4">
                                    <button onClick={() => deleteTheme(t.id)} className="text-red-500 hover:text-red-400 transition-colors">
                                        <Trash2 size={18} />
                                    </button>
                                </td>
                            </tr>
                        ))
                    )}
                </tbody>
            </table>
        </div>
      </div>
    </div>
  );
};