import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router';
import { supabase } from '../supabase';
import { useAuth } from '../AuthContext';
import { toast } from 'react-toastify';

function Profile() {
  const navigate = useNavigate();
  const { user, setUser, role, authReady } = useAuth();
  const [displayName, setDisplayName] = useState('');
  const [savingName, setSavingName] = useState(false);

  const hasChanged = displayName.trim() !== (user?.displayName || '');

  useEffect(() => {
    if (authReady && !user) navigate('/');
    if (user) setDisplayName(user.displayName || '');
  }, [user, authReady, navigate]);

  if (!authReady || !user) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gray-50">
        <div className="w-8 h-8 border-4 border-[#1a8efd] border-t-transparent rounded-full animate-spin" />
      </div>
    );
  }

  const initials = (user.displayName || user.email || '?')
    .split(' ')
    .map((w) => w[0])
    .join('')
    .toUpperCase()
    .slice(0, 2);

  const handleSaveName = async (e) => {
    e.preventDefault();
    if (!displayName.trim()) { toast.error('Name cannot be empty.'); return; }
    if (!hasChanged) return;
    setSavingName(true);
    try {
      await supabase.auth.updateUser({ data: { display_name: displayName.trim() } });
      await supabase.rpc('update_my_display_name', { p_name: displayName.trim() });
      setUser({ ...user, displayName: displayName.trim() });
      window.dispatchEvent(new Event('profileUpdated'));
      toast.success('Name updated!');
      if (role === 'admin') navigate(-1);
      else navigate('/');
    } catch {
      toast.error('Failed to update name. Try again.');
    } finally {
      setSavingName(false);
    }
  };

  return (
    <div className="min-h-screen bg-gray-50 pt-[72px]">
<div className="max-w-2xl mx-auto px-4 py-12">
        <h1 className="text-2xl font-bold text-gray-900 mb-8">Profile</h1>

        <div className="flex items-center gap-4 mb-10">
          <div className="w-16 h-16 rounded-full bg-[#1a8efd] flex items-center justify-center text-white text-xl font-bold">
            {initials}
          </div>
          <div>
            <p className="font-semibold text-gray-900 text-lg">{user.displayName || '—'}</p>
            <p className="text-sm text-gray-500">{user.email}</p>
            <span className="text-xs bg-blue-50 text-blue-600 px-2 py-0.5 rounded font-medium mt-1 inline-block">
              One-Click Login
            </span>
          </div>
        </div>

        <div className="bg-white rounded-2xl shadow-sm border border-gray-100 p-6">
          <h2 className="text-base font-semibold text-gray-800 mb-5">Display name</h2>
          <form onSubmit={handleSaveName} className="flex flex-col gap-4">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1.5">Full name</label>
              <input
                type="text"
                value={displayName}
                onChange={(e) => setDisplayName(e.target.value)}
                className="w-full border border-gray-300 rounded-lg px-4 py-3 text-sm focus:outline-none focus:ring-2 focus:ring-[#1a8efd] focus:border-transparent transition"
                placeholder="Your full name"
              />
            </div>
            <button
              type="submit"
              disabled={savingName || !hasChanged}
              className="self-start bg-[#1a8efd] hover:bg-[#0077e6] disabled:opacity-60 disabled:cursor-not-allowed text-white px-6 py-2.5 rounded-lg text-sm font-semibold transition"
            >
              {savingName ? 'Saving...' : 'Save name'}
            </button>
          </form>
        </div>

        <p className="text-xs text-gray-400 text-center mt-8">
          Sign-in method: One-Click Login — no password required.
        </p>
      </div>
    </div>
  );
}

export default Profile;
