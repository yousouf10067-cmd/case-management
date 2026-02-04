import { useState, useEffect } from 'react';
import { supabase } from '../../lib/supabase';
import { ArrowLeft, Trash2, Edit2 } from 'lucide-react';
import { RecordForm } from '../User/RecordForm';

interface Profile {
  id: string;
  username: string;
  email: string;
}

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
  field_type: 'text' | 'number' | 'date';
  position: number;
}

interface UserRecordsProps {
  user: Profile;
  onBack: () => void;
}

export function UserRecords({ user, onBack }: UserRecordsProps) {
  const [records, setRecords] = useState<Record[]>([]);
  const [customFields, setCustomFields] = useState<CustomField[]>([]);
  const [loading, setLoading] = useState(true);
  const [editingRecord, setEditingRecord] = useState<Record | null>(null);
  const [showForm, setShowForm] = useState(false);

  useEffect(() => {
    loadCustomFields();
    loadRecords();
  }, [user.id]);

  const loadCustomFields = async () => {
    try {
      const { data, error } = await supabase
        .from('custom_fields')
        .select('*')
        .order('position', { ascending: true });

      if (error) throw error;
      setCustomFields(data || []);
    } catch (error) {
      console.error('Error loading custom fields:', error);
    }
  };

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
        .eq('user_id', user.id)
        .order('record_number', { ascending: false });

      if (error) throw error;

      const recordsWithValues = (data || []).map((record: any) => ({
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

  const handleEdit = (record: Record) => {
    setEditingRecord(record);
    setShowForm(true);
  };

  const handleDelete = async (id: string) => {
    if (!confirm('Are you sure you want to delete this record?')) return;

    try {
      const { error } = await supabase.from('records').delete().eq('id', id);

      if (error) throw error;
      await loadRecords();
    } catch (error) {
      console.error('Error deleting record:', error);
    }
  };

  const handleFormClose = () => {
    setShowForm(false);
    setEditingRecord(null);
    loadRecords();
  };

  if (loading) {
    return (
      <div className="text-center py-12">
        <div className="inline-block animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600"></div>
      </div>
    );
  }

  return (
    <div>
      {showForm && (
        <RecordForm
          record={editingRecord}
          onClose={handleFormClose}
          isAdmin={true}
          userId={user.id}
        />
      )}

      <button
        onClick={onBack}
        className="flex items-center gap-2 text-slate-600 hover:text-slate-900 mb-4"
      >
        <ArrowLeft size={20} />
        Back to Users
      </button>

      <div className="bg-white rounded-lg shadow-sm border border-slate-200 overflow-hidden">
        <div className="px-6 py-4 border-b border-slate-200">
          <h2 className="text-lg font-semibold text-slate-800">
            Records for {user.username}
          </h2>
          <p className="text-sm text-slate-600">{user.email}</p>
        </div>

        {records.length === 0 ? (
          <div className="p-12 text-center">
            <p className="text-slate-500">No records found for this user.</p>
          </div>
        ) : (
          <div className="space-y-8 p-6">
            {['CASE OB', 'PHQ'].map((categoryName) => {
              const categoryRecords = records.filter(r => r.category === categoryName);
              if (categoryRecords.length === 0) return null;

              return (
                <div key={categoryName}>
                  <h3 className="text-lg font-semibold text-slate-800 mb-4 pb-2 border-b border-slate-200">
                    {categoryName}
                  </h3>
                  <div className="overflow-x-auto">
                    <table className="min-w-full divide-y divide-slate-200">
                      <thead className="bg-slate-50">
                        <tr>
                          <th className="px-6 py-3 text-left text-xs font-medium text-slate-500 uppercase tracking-wider">
                            Record #
                          </th>
                          {customFields.map((field) => (
                            <th key={field.id} className="px-6 py-3 text-left text-xs font-medium text-slate-500 uppercase tracking-wider">
                              {field.field_name}
                            </th>
                          ))}
                          <th className="px-6 py-3 text-center text-xs font-medium text-slate-500 uppercase tracking-wider">
                            Actions
                          </th>
                        </tr>
                      </thead>
                      <tbody className="bg-white divide-y divide-slate-200">
                        {categoryRecords.map((record) => (
                          <tr key={record.id} className="hover:bg-slate-50 transition-colors">
                            <td className="px-6 py-4 whitespace-nowrap text-sm font-medium text-slate-900">
                              {record.record_number}
                            </td>
                            {customFields.map((field) => (
                              <td key={field.id} className="px-6 py-4 whitespace-nowrap text-sm text-slate-700">
                                {record.custom_field_values?.[field.id] || '-'}
                              </td>
                            ))}
                            <td className="px-6 py-4 whitespace-nowrap text-center text-sm font-medium">
                              <button
                                onClick={() => handleEdit(record)}
                                className="text-blue-600 hover:text-blue-900 mr-3"
                              >
                                <Edit2 size={18} />
                              </button>
                              <button
                                onClick={() => handleDelete(record.id)}
                                className="text-red-600 hover:text-red-900"
                              >
                                <Trash2 size={18} />
                              </button>
                            </td>
                          </tr>
                        ))}
                      </tbody>
                    </table>
                  </div>
                </div>
              );
            })}
          </div>
        )}
      </div>
    </div>
  );
}
