import { Edit2, Download, Trash } from 'lucide-react';
import { useEffect, useState } from 'react';
import { supabase } from '../../lib/supabase';
import { exportRecordsToExcel } from '../../lib/excelUtils';

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

interface RecordsListProps {
  records: Record[];
  onEdit: (record: Record) => void;
  onRequestDeletion: (id: string) => void;
}

export function RecordsList({ records, onEdit, onRequestDeletion }: RecordsListProps) {
  const [customFields, setCustomFields] = useState<CustomField[]>([]);

  useEffect(() => {
    loadCustomFields();
  }, []);

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

  const handleExport = async () => {
    try {
      const exportData = records.map(record => ({
        'Record #': record.record_number,
        ...Object.fromEntries(
          customFields.map(field => [field.field_name, record.custom_field_values?.[field.id] || ''])
        ),
      }));

      const timestamp = new Date().toISOString().split('T')[0];
      await exportRecordsToExcel(exportData, `records_${timestamp}.xlsx`);
    } catch (error) {
      console.error('Export failed:', error);
    }
  };
  if (records.length === 0) {
    return (
      <div className="bg-white rounded-lg shadow-sm border border-slate-200 p-12 text-center">
        <p className="text-slate-500">No records found. Click "Add Record" to create your first record.</p>
      </div>
    );
  }

  return (
    <div className="space-y-8">
      <div className="flex justify-end">
        <button
          onClick={handleExport}
          className="flex items-center gap-2 bg-green-600 text-white px-4 py-2 rounded-lg hover:bg-green-700 transition-colors"
        >
          <Download size={18} />
          Export to Excel
        </button>
      </div>

      {['CASE OB', 'PHQ'].map((categoryName) => {
        const categoryRecords = records.filter(r => r.category === categoryName);
        if (categoryRecords.length === 0) return null;

        return (
          <div key={categoryName}>
            <h3 className="text-lg font-semibold text-slate-800 mb-4 pb-2 border-b border-slate-200">
              {categoryName}
            </h3>
            <div className="bg-white rounded-lg shadow-sm border border-slate-200 overflow-hidden">
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
                      <th className="px-6 py-3 text-right text-xs font-medium text-slate-500 uppercase tracking-wider">
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
                        <td className="px-6 py-4 whitespace-nowrap text-right text-sm font-medium">
                          <button
                            onClick={() => onEdit(record)}
                            className="text-blue-600 hover:text-blue-900 mr-3"
                          >
                            <Edit2 size={18} />
                          </button>
                          <button
                            onClick={() => onRequestDeletion(record.id)}
                            className="text-amber-600 hover:text-amber-900"
                            title="Request deletion - admin approval required"
                          >
                            <Trash size={18} />
                          </button>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </div>
          </div>
        );
      })}
    </div>
  );
}
