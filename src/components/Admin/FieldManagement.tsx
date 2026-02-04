import { useState, useEffect } from 'react';
import { useAuth } from '../../contexts/AuthContext';
import { supabase } from '../../lib/supabase';
import { Plus, Trash2, X, ArrowUp, ArrowDown } from 'lucide-react';

interface CustomField {
  id: string;
  field_name: string;
  field_type: 'text' | 'number' | 'date';
  position: number;
  created_at: string;
}

export function FieldManagement() {
  const { user } = useAuth();
  const [fields, setFields] = useState<CustomField[]>([]);
  const [showForm, setShowForm] = useState(false);
  const [fieldName, setFieldName] = useState('');
  const [fieldType, setFieldType] = useState<'text' | 'number' | 'date'>('text');
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');

  useEffect(() => {
    loadFields();
  }, []);

  const loadFields = async () => {
    try {
      const { data, error } = await supabase
        .from('custom_fields')
        .select('*')
        .order('position', { ascending: true });

      if (error) throw error;
      setFields(data || []);
    } catch (error) {
      console.error('Error loading fields:', error);
    } finally {
      setLoading(false);
    }
  };

  const handleAddField = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');

    try {
      const maxPosition = fields.length > 0 ? Math.max(...fields.map(f => f.position || 0)) : -1;

      const { error } = await supabase.from('custom_fields').insert({
        field_name: fieldName,
        field_type: fieldType,
        position: maxPosition + 1,
        created_by: user?.id,
      });

      if (error) throw error;

      setFieldName('');
      setFieldType('text');
      setShowForm(false);
      await loadFields();
    } catch (error) {
      setError((error as Error).message);
    }
  };

  const handleMoveField = async (fieldId: string, direction: 'up' | 'down') => {
    const fieldIndex = fields.findIndex(f => f.id === fieldId);
    if (fieldIndex === -1) return;

    const newIndex = direction === 'up' ? fieldIndex - 1 : fieldIndex + 1;
    if (newIndex < 0 || newIndex >= fields.length) return;

    try {
      const currentField = fields[fieldIndex];
      const targetField = fields[newIndex];

      await supabase
        .from('custom_fields')
        .update({ position: targetField.position })
        .eq('id', currentField.id);

      await supabase
        .from('custom_fields')
        .update({ position: currentField.position })
        .eq('id', targetField.id);

      await loadFields();
    } catch (error) {
      console.error('Error moving field:', error);
    }
  };

  const handleDeleteField = async (id: string, fieldName: string) => {
    if (!confirm(`Are you sure you want to delete the field "${fieldName}"? This will also delete all values for this field.`)) {
      return;
    }

    try {
      const { error } = await supabase.from('custom_fields').delete().eq('id', id);

      if (error) throw error;
      await loadFields();
    } catch (error) {
      console.error('Error deleting field:', error);
    }
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
      <div className="bg-white rounded-lg shadow-sm border border-slate-200 overflow-hidden">
        <div className="px-6 py-4 border-b border-slate-200 flex justify-between items-center">
          <div>
            <h2 className="text-lg font-semibold text-slate-800">Custom Fields</h2>
            <p className="text-sm text-slate-600">Manage additional fields for records</p>
          </div>
          <button
            onClick={() => setShowForm(true)}
            className="flex items-center gap-2 bg-blue-600 text-white px-4 py-2 rounded-lg hover:bg-blue-700 transition-colors"
          >
            <Plus size={20} />
            Add Field
          </button>
        </div>

        <div className="p-6">
          {fields.length > 0 && (
            <div>
              <h3 className="text-sm font-medium text-slate-700 mb-3">
                Fields (drag to reorder)
              </h3>
              <div className="space-y-2">
                {fields.map((field, index) => (
                  <div
                    key={field.id}
                    className="flex items-center justify-between px-4 py-3 bg-blue-50 border border-blue-200 rounded-lg"
                  >
                    <div className="flex-1">
                      <span className="font-medium text-slate-800">{field.field_name}</span>
                      <span className="ml-3 text-sm text-slate-600">({field.field_type})</span>
                    </div>
                    <div className="flex items-center gap-2">
                      <button
                        onClick={() => handleMoveField(field.id, 'up')}
                        disabled={index === 0}
                        className="p-1 text-slate-600 hover:text-slate-900 disabled:text-slate-300 disabled:cursor-not-allowed"
                      >
                        <ArrowUp size={18} />
                      </button>
                      <button
                        onClick={() => handleMoveField(field.id, 'down')}
                        disabled={index === fields.length - 1}
                        className="p-1 text-slate-600 hover:text-slate-900 disabled:text-slate-300 disabled:cursor-not-allowed"
                      >
                        <ArrowDown size={18} />
                      </button>
                      <button
                        onClick={() => handleDeleteField(field.id, field.field_name)}
                        className="p-1 text-red-600 hover:text-red-900"
                      >
                        <Trash2 size={18} />
                      </button>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          )}

          {fields.length === 0 && (
            <p className="text-slate-500 text-center py-8">
              No custom fields added yet. Click "Add Field" to create one.
            </p>
          )}
        </div>
      </div>

      {showForm && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center p-4 z-50">
          <div className="bg-white rounded-lg shadow-xl max-w-md w-full">
            <div className="px-6 py-4 border-b border-slate-200 flex justify-between items-center">
              <h3 className="text-lg font-semibold text-slate-800">Add Custom Field</h3>
              <button
                onClick={() => {
                  setShowForm(false);
                  setError('');
                  setFieldName('');
                  setFieldType('text');
                }}
                className="text-slate-400 hover:text-slate-600"
              >
                <X size={24} />
              </button>
            </div>

            <form onSubmit={handleAddField} className="p-6 space-y-4">
              {error && (
                <div className="bg-red-50 border border-red-200 text-red-700 px-4 py-3 rounded">
                  {error}
                </div>
              )}

              <div>
                <label className="block text-sm font-medium text-slate-700 mb-1">
                  Field Name
                </label>
                <input
                  type="text"
                  value={fieldName}
                  onChange={(e) => setFieldName(e.target.value)}
                  className="w-full px-3 py-2 border border-slate-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                  placeholder="e.g., Investigation Status"
                  required
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-slate-700 mb-1">
                  Field Type
                </label>
                <select
                  value={fieldType}
                  onChange={(e) => setFieldType(e.target.value as 'text' | 'number' | 'date')}
                  className="w-full px-3 py-2 border border-slate-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                >
                  <option value="text">Text</option>
                  <option value="number">Number</option>
                  <option value="date">Date</option>
                </select>
              </div>

              <div className="flex gap-3 pt-4">
                <button
                  type="submit"
                  className="flex-1 bg-blue-600 text-white py-2 px-4 rounded-lg hover:bg-blue-700 transition-colors"
                >
                  Add Field
                </button>
                <button
                  type="button"
                  onClick={() => {
                    setShowForm(false);
                    setError('');
                    setFieldName('');
                    setFieldType('text');
                  }}
                  className="px-6 py-2 border border-slate-300 text-slate-700 rounded-lg hover:bg-slate-50 transition-colors"
                >
                  Cancel
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
