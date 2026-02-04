import { useState, useEffect } from 'react';
import { useAuth } from '../../contexts/AuthContext';
import { supabase } from '../../lib/supabase';
import { X } from 'lucide-react';

interface CustomField {
  id: string;
  field_name: string;
  field_type: 'text' | 'number' | 'date';
}

interface RecordFormProps {
  record: {
    id: string;
    user_id?: string;
    category?: string;
    custom_field_values?: Record<string, string>;
  } | null;
  onClose: () => void;
  isAdmin?: boolean;
  userId?: string;
}

export function RecordForm({ record, onClose, isAdmin = false, userId }: RecordFormProps) {
  const { user } = useAuth();
  const effectiveUserId = userId || user?.id;
  const [customFields, setCustomFields] = useState<CustomField[]>([]);
  const [customValues, setCustomValues] = useState<Record<string, string>>({});
  const [users, setUsers] = useState<{ id: string; username: string }[]>([]);
  const [selectedUserId, setSelectedUserId] = useState(record?.user_id || effectiveUserId || '');
  const [category, setCategory] = useState(record?.category || 'CASE OB');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');

  useEffect(() => {
    loadCustomFields();
    if (isAdmin) {
      loadUsers();
    }
  }, [isAdmin]);

  useEffect(() => {
    if (customFields.length > 0) {
      const initialValues: Record<string, string> = {};
      customFields.forEach(field => {
        initialValues[field.id] = '';
      });

      if (record && record.custom_field_values) {
        Object.assign(initialValues, record.custom_field_values);
        setCustomValues(initialValues);
      } else if (record) {
        loadCustomValues(record.id, customFields);
      } else {
        setCustomValues(initialValues);
      }
    }
  }, [customFields, record?.id]);

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

  const loadUsers = async () => {
    try {
      const { data, error } = await supabase
        .from('profiles')
        .select('id, username')
        .eq('role', 'user')
        .order('username', { ascending: true });

      if (error) throw error;
      setUsers(data || []);
    } catch (error) {
      console.error('Error loading users:', error);
    }
  };

  const loadCustomValues = async (recordId: string, fields: CustomField[]) => {
    try {
      const { data, error } = await supabase
        .from('custom_field_values')
        .select('field_id, value')
        .eq('record_id', recordId);

      if (error) throw error;

      const values: Record<string, string> = {};
      fields.forEach(field => {
        values[field.id] = '';
      });
      data?.forEach((item) => {
        values[item.field_id] = item.value || '';
      });
      setCustomValues(values);
    } catch (error) {
      console.error('Error loading custom values:', error);
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');
    setLoading(true);

    try {
      if (record) {
        const updateData: Record<string, any> = {
          category: category,
        };

        if (isAdmin && selectedUserId && selectedUserId !== record.user_id) {
          updateData.user_id = selectedUserId;

          const { data: userRecords, error: countError } = await supabase
            .from('records')
            .select('record_number')
            .eq('user_id', selectedUserId)
            .order('record_number', { ascending: false })
            .limit(1);

          if (countError) throw countError;

          const nextNumber = userRecords && userRecords.length > 0
            ? userRecords[0].record_number + 1
            : 1;
          updateData.record_number = nextNumber;
        }

        const { error: updateError } = await supabase
          .from('records')
          .update(updateData)
          .eq('id', record.id);

        if (updateError) throw updateError;

        await supabase
          .from('custom_field_values')
          .delete()
          .eq('record_id', record.id);

        for (const [fieldId, value] of Object.entries(customValues)) {
          if (value) {
            await supabase.from('custom_field_values').insert({
              record_id: record.id,
              field_id: fieldId,
              value,
            });
          }
        }
      } else {
        const { data: newRecord, error: insertError } = await supabase
          .from('records')
          .insert({
            user_id: selectedUserId || effectiveUserId!,
            category: category,
          })
          .select()
          .single();

        if (insertError) throw insertError;

        for (const [fieldId, value] of Object.entries(customValues)) {
          if (value) {
            await supabase.from('custom_field_values').insert({
              record_id: newRecord.id,
              field_id: fieldId,
              value,
            });
          }
        }
      }

      onClose();
    } catch (error) {
      setError((error as Error).message);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center p-4 z-50">
      <div className="bg-white rounded-lg shadow-xl max-w-2xl w-full max-h-[90vh] overflow-y-auto">
        <div className="sticky top-0 bg-white border-b border-slate-200 px-6 py-4 flex justify-between items-center">
          <h3 className="text-xl font-semibold text-slate-800">
            {record ? 'Edit Record' : 'Add New Record'}
          </h3>
          <button
            onClick={onClose}
            className="text-slate-400 hover:text-slate-600 transition-colors"
          >
            <X size={24} />
          </button>
        </div>

        <form onSubmit={handleSubmit} className="p-6 space-y-4">
          {error && (
            <div className="bg-red-50 border border-red-200 text-red-700 px-4 py-3 rounded">
              {error}
            </div>
          )}

          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div className="md:col-span-2">
              <label className="block text-sm font-medium text-slate-700 mb-1">
                Record Type
              </label>
              <select
                value={category}
                onChange={(e) => setCategory(e.target.value)}
                className="w-full px-3 py-2 border border-slate-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
              >
                <option value="CASE OB">CASE OB</option>
                <option value="PHQ">PHQ</option>
              </select>
            </div>

            {isAdmin && (
              <div className="md:col-span-2">
                <label className="block text-sm font-medium text-slate-700 mb-1">
                  Assign to User
                </label>
                <select
                  value={selectedUserId}
                  onChange={(e) => setSelectedUserId(e.target.value)}
                  className="w-full px-3 py-2 border border-slate-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                >
                  <option value="">Select a user</option>
                  {users.map((u) => (
                    <option key={u.id} value={u.id}>
                      {u.username}
                    </option>
                  ))}
                </select>
              </div>
            )}

            {customFields.length === 0 ? (
              <div className="md:col-span-2 bg-slate-50 p-4 rounded-lg text-slate-600 text-center">
                <p>No custom fields created yet. Please ask an admin to create fields.</p>
              </div>
            ) : (
              customFields.map((field) => (
                <div key={field.id} className="md:col-span-2">
                  <label className="block text-sm font-medium text-slate-700 mb-1">
                    {field.field_name}
                  </label>
                  <input
                    type={field.field_type}
                    value={customValues[field.id] || ''}
                    onChange={(e) => setCustomValues({ ...customValues, [field.id]: e.target.value })}
                    className="w-full px-3 py-2 border border-slate-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                  />
                </div>
              ))
            )}
          </div>

          <div className="flex gap-3 pt-4">
            <button
              type="submit"
              disabled={loading}
              className="flex-1 bg-blue-600 text-white py-2 px-4 rounded-lg hover:bg-blue-700 transition-colors disabled:bg-blue-400"
            >
              {loading ? 'Saving...' : 'Save Record'}
            </button>
            <button
              type="button"
              onClick={onClose}
              className="px-6 py-2 border border-slate-300 text-slate-700 rounded-lg hover:bg-slate-50 transition-colors"
            >
              Cancel
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}
