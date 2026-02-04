import { useState, useEffect } from 'react';
import { useAuth } from '../../contexts/AuthContext';
import { supabase } from '../../lib/supabase';
import { UserRecords } from './UserRecords';
import { AllRecords } from './AllRecords';
import { FieldManagement } from './FieldManagement';
import { AdminManagement } from './AdminManagement';
import { LogOut, Users, Database, Settings, Shield } from 'lucide-react';

interface Profile {
  id: string;
  username: string;
  email: string;
  role: string;
}

type View = 'users' | 'all-records' | 'fields' | 'admin-management';

export function AdminDashboard() {
  const { profile, signOut } = useAuth();
  const [users, setUsers] = useState<Profile[]>([]);
  const [selectedUser, setSelectedUser] = useState<Profile | null>(null);
  const [currentView, setCurrentView] = useState<View>('users');
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    loadUsers();
  }, []);

  const loadUsers = async () => {
    try {
      const { data, error } = await supabase
        .from('profiles')
        .select('*')
        .eq('role', 'user')
        .order('username');

      if (error) throw error;
      setUsers(data || []);
    } catch (error) {
      console.error('Error loading users:', error);
    } finally {
      setLoading(false);
    }
  };

  const handleUserClick = (user: Profile) => {
    setSelectedUser(user);
    setCurrentView('users');
  };

  const handleBackToUsers = () => {
    setSelectedUser(null);
  };

  return (
    <div className="min-h-screen bg-slate-50">
      <header className="bg-white shadow-sm border-b border-slate-200">
        <div className="max-w-7xl mx-auto px-4 py-4 sm:px-6 lg:px-8">
          <div className="flex justify-between items-center">
            <div>
              <h1 className="text-2xl font-bold text-slate-800">Admin Dashboard</h1>
              <p className="text-sm text-slate-600">Welcome, {profile?.username}</p>
            </div>
            <button
              onClick={signOut}
              className="flex items-center gap-2 px-4 py-2 text-slate-700 hover:text-slate-900 hover:bg-slate-100 rounded-lg transition-colors"
            >
              <LogOut size={20} />
              Sign Out
            </button>
          </div>
        </div>
      </header>

      <div className="max-w-7xl mx-auto px-4 py-8 sm:px-6 lg:px-8">
        <div className="mb-6 flex gap-4 flex-wrap">
          <button
            onClick={() => {
              setCurrentView('users');
              setSelectedUser(null);
            }}
            className={`flex items-center gap-2 px-4 py-2 rounded-lg transition-colors ${
              currentView === 'users'
                ? 'bg-blue-600 text-white'
                : 'bg-white text-slate-700 hover:bg-slate-100 border border-slate-200'
            }`}
          >
            <Users size={20} />
            Users
          </button>
          <button
            onClick={() => {
              setCurrentView('all-records');
              setSelectedUser(null);
            }}
            className={`flex items-center gap-2 px-4 py-2 rounded-lg transition-colors ${
              currentView === 'all-records'
                ? 'bg-blue-600 text-white'
                : 'bg-white text-slate-700 hover:bg-slate-100 border border-slate-200'
            }`}
          >
            <Database size={20} />
            All Records
          </button>
          <button
            onClick={() => {
              setCurrentView('fields');
              setSelectedUser(null);
            }}
            className={`flex items-center gap-2 px-4 py-2 rounded-lg transition-colors ${
              currentView === 'fields'
                ? 'bg-blue-600 text-white'
                : 'bg-white text-slate-700 hover:bg-slate-100 border border-slate-200'
            }`}
          >
            <Settings size={20} />
            Manage Fields
          </button>
          <button
            onClick={() => {
              setCurrentView('admin-management');
              setSelectedUser(null);
            }}
            className={`flex items-center gap-2 px-4 py-2 rounded-lg transition-colors ${
              currentView === 'admin-management'
                ? 'bg-blue-600 text-white'
                : 'bg-white text-slate-700 hover:bg-slate-100 border border-slate-200'
            }`}
          >
            <Shield size={20} />
            Admin Management
          </button>
        </div>

        {loading ? (
          <div className="text-center py-12">
            <div className="inline-block animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600"></div>
          </div>
        ) : (
          <>
            {currentView === 'users' && !selectedUser && (
              <div className="bg-white rounded-lg shadow-sm border border-slate-200 overflow-hidden">
                <div className="px-6 py-4 border-b border-slate-200">
                  <h2 className="text-lg font-semibold text-slate-800">Office Users</h2>
                </div>
                <div className="divide-y divide-slate-200">
                  {users.map((user) => (
                    <button
                      key={user.id}
                      onClick={() => handleUserClick(user)}
                      className="w-full px-6 py-4 hover:bg-slate-50 transition-colors text-left"
                    >
                      <div className="flex justify-between items-center">
                        <div>
                          <p className="font-medium text-slate-800">{user.username}</p>
                          <p className="text-sm text-slate-600">{user.email}</p>
                        </div>
                        <div className="text-blue-600">View Records →</div>
                      </div>
                    </button>
                  ))}
                </div>
              </div>
            )}

            {currentView === 'users' && selectedUser && (
              <UserRecords user={selectedUser} onBack={handleBackToUsers} />
            )}

            {currentView === 'all-records' && <AllRecords />}

            {currentView === 'fields' && <FieldManagement />}

            {currentView === 'admin-management' && <AdminManagement />}
          </>
        )}
      </div>
    </div>
  );
}
