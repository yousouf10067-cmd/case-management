import { useState, useEffect, useRef } from 'react';
import { useAuth } from '../../contexts/AuthContext';
import { supabase } from '../../lib/supabase';
import { RecordForm } from './RecordForm';
import { RecordsList } from './RecordsList';
import { RecordUpdateNotification } from '../Notifications/RecordUpdateNotification';
import { importRecordsFromExcel } from '../../lib/excelUtils';
import { LogOut, Plus, Upload } from 'lucide-react';

interface Record {
  id: string;
  record_number: number;
  category: string;
  created_at: string;
  custom_field_values?: Record<string, string>;
}

interface CustomField {
  id: string;
  field_name: string;
}

export function UserDashboard() {
  const { profile, signOut } = useAuth();
  const [records, setRecords] = useState<Record[]>([]);
  const [customFields, setCustomFields] = useState<CustomField[]>([]);
  const [showForm, setShowForm] = useState(false);
  const [editingRecord, setEditingRecord] = useState<Record | null>(null);
  const [loading, setLoading] = useState(true);
  const [importing, setImporting] = useState(false);
  const [importResult, setImportResult] = useState<{ success: number; failed: number; errors: string[] } | null>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);

  useEffect(() => {
    if (profile?.id) {
      loadRecords();
      loadCustomFields();
    }
  }, [profile?.id]);

  const loadRecords = async () => {
    try {
      const { data, error } = await supabase
        .from('records')
        .select(`
          *,
          custom_field_values (
            field_id,
            value
          )
        `)
        .eq('user_id', profile?.id)
        .order('record_number', { ascending: false });

      if (error) throw error;

      const recordsWithValues = (data || []).map(record => ({
        ...record,
        custom_field_values: record.custom_field_values.reduce((acc: Record<string, string>, item: any) => {
          acc[item.field_id] = item.value || '';
          return acc;
        }, {}),
      }));

      setRecords(recordsWithValues);
    } catch (error) {
      console.error('Error loading records:', error);
    } finally {
      setLoading(false);
    }
  };

  const loadCustomFields = async () => {
    try {
      const { data, error } = await supabase
        .from('custom_fields')
        .select('id, field_name')
        .order('position', { ascending: true });

      if (error) throw error;
      setCustomFields(data || []);
    } catch (error) {
      console.error('Error loading custom fields:', error);
    }
  };

  const handleImport = async (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (!file || !profile?.id) return;

    setImporting(true);
    setImportResult(null);

    try {
      const result = await importRecordsFromExcel(file, profile.id, customFields);
      setImportResult(result);
      await loadRecords();
    } catch (error) {
      setImportResult({
        success: 0,
        failed: 1,
        errors: [(error as Error).message],
      });
    } finally {
      setImporting(false);
      if (fileInputRef.current) {
        fileInputRef.current.value = '';
      }
    }
  };

  const handleEdit = (record: Record) => {
    setEditingRecord(record);
    setShowForm(true);
  };

  const handleRequestDeletion = async (id: string) => {
    if (!confirm('This will submit a deletion request to the admin for review. Continue?')) return;

    try {
      const { error } = await supabase.from('deletion_requests').insert([
        { record_id: id, user_id: profile?.id }
      ]);

      if (error) throw error;
      alert('Deletion request submitted to admin for review');
      await loadRecords();
    } catch (error) {
      console.error('Error requesting deletion:', error);
      alert('Failed to request deletion');
    }
  };

  const handleFormClose = () => {
    setShowForm(false);
    setEditingRecord(null);
    loadRecords();
  };

  return (
    <div className="min-h-screen bg-slate-50">
      {profile?.last_login && (
        <RecordUpdateNotification userId={profile.id} lastLogin={profile.last_login} />
      )}

      <header className="bg-white shadow-sm border-b border-slate-200">
        <div className="max-w-7xl mx-auto px-4 py-4 sm:px-6 lg:px-8">
          <div className="flex justify-between items-center">
            <div>
              <h1 className="text-2xl font-bold text-slate-800">Office Records</h1>
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

      <main className="max-w-7xl mx-auto px-4 py-8 sm:px-6 lg:px-8">
        <div className="mb-6 flex justify-between items-center">
          <h2 className="text-xl font-semibold text-slate-800">My Records</h2>
          <div className="flex gap-3">
            <button
              onClick={() => fileInputRef.current?.click()}
              disabled={importing}
              className="flex items-center gap-2 bg-purple-600 text-white px-4 py-2 rounded-lg hover:bg-purple-700 transition-colors disabled:bg-purple-400"
            >
              <Upload size={20} />
              {importing ? 'Importing...' : 'Import Excel'}
            </button>
            <input
              ref={fileInputRef}
              type="file"
              accept=".xlsx,.xls"
              onChange={handleImport}
              className="hidden"
            />
            <button
              onClick={() => setShowForm(true)}
              className="flex items-center gap-2 bg-blue-600 text-white px-4 py-2 rounded-lg hover:bg-blue-700 transition-colors"
            >
              <Plus size={20} />
              Add Record
            </button>
          </div>
        </div>

        {importResult && (
          <div className={`mb-6 p-4 rounded-lg border ${
            importResult.failed === 0
              ? 'bg-green-50 border-green-200'
              : 'bg-yellow-50 border-yellow-200'
          }`}>
            <p className={`font-semibold ${
              importResult.failed === 0 ? 'text-green-700' : 'text-yellow-700'
            }`}>
              Import Complete: {importResult.success} successful, {importResult.failed} failed
            </p>
            {importResult.errors.length > 0 && (
              <div className="mt-2 text-sm text-red-700">
                {importResult.errors.slice(0, 5).map((error, idx) => (
                  <p key={idx}>{error}</p>
                ))}
                {importResult.errors.length > 5 && (
                  <p>...and {importResult.errors.length - 5} more errors</p>
                )}
              </div>
            )}
          </div>
        )}

        {showForm && (
          <RecordForm
            record={editingRecord}
            onClose={handleFormClose}
          />
        )}

        {loading ? (
          <div className="text-center py-12">
            <div className="inline-block animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600"></div>
          </div>
        ) : (
          <RecordsList
            records={records}
            onEdit={handleEdit}
            onRequestDeletion={handleRequestDeletion}
          />
        )}
      </main>
    </div>
  );
}
