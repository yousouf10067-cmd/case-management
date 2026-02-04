import { useState, useEffect } from 'react';
import { supabase } from '../../lib/supabase';
import { X, AlertCircle } from 'lucide-react';

interface UpdatedRecord {
  id: string;
  record_number: number;
  enquiry_officer: string | null;
  updated_at: string;
  created_at: string;
}

interface RecordUpdateNotificationProps {
  userId: string;
  lastLogin: string | null;
}

export function RecordUpdateNotification({ userId, lastLogin }: RecordUpdateNotificationProps) {
  const [updatedRecords, setUpdatedRecords] = useState<UpdatedRecord[]>([]);
  const [showNotification, setShowNotification] = useState(false);

  useEffect(() => {
    checkForUpdates();
  }, [userId, lastLogin]);

  const checkForUpdates = async () => {
    if (!lastLogin) {
      return;
    }

    try {
      const { data, error } = await supabase
        .from('records')
        .select('id, record_number, enquiry_officer, updated_at, created_at')
        .eq('user_id', userId)
        .or(`updated_at.gt.${lastLogin},created_at.gt.${lastLogin}`)
        .order('updated_at', { ascending: false });

      if (error) throw error;

      if (data && data.length > 0) {
        setUpdatedRecords(data);
        setShowNotification(true);

        await supabase
          .from('profiles')
          .update({ last_login: new Date().toISOString() })
          .eq('id', userId);
      }
    } catch (error) {
      console.error('Error checking for updates:', error);
    }
  };

  if (!showNotification || updatedRecords.length === 0) {
    return null;
  }

  return (
    <div className="fixed top-4 right-4 max-w-md z-50 animate-in slide-in-from-top-2">
      <div className="bg-white rounded-lg shadow-lg border border-blue-200 overflow-hidden">
        <div className="bg-blue-50 border-b border-blue-200 px-4 py-3 flex items-start gap-3">
          <AlertCircle className="text-blue-600 flex-shrink-0 mt-0.5" size={20} />
          <div className="flex-1">
            <h3 className="font-semibold text-blue-900">Record Updates</h3>
            <p className="text-sm text-blue-700 mt-1">
              {updatedRecords.length} of your record{updatedRecords.length !== 1 ? 's have' : ' has'} been updated:
            </p>
          </div>
          <button
            onClick={() => setShowNotification(false)}
            className="text-blue-600 hover:text-blue-900 flex-shrink-0"
          >
            <X size={20} />
          </button>
        </div>

        <div className="p-4 max-h-60 overflow-y-auto">
          <ul className="space-y-2">
            {updatedRecords.map((record) => {
              const isNew = new Date(record.created_at) > new Date(lastLogin || 0);
              return (
                <li key={record.id} className="text-sm text-slate-700 pb-2 border-b border-slate-100 last:border-0">
                  <div className="flex items-start justify-between">
                    <div>
                      <span className="font-medium">Record #{record.record_number}</span>
                      {record.enquiry_officer && (
                        <span className="text-slate-600 ml-2">- {record.enquiry_officer}</span>
                      )}
                    </div>
                    {isNew && (
                      <span className="ml-2 px-2 py-0.5 bg-green-100 text-green-700 text-xs rounded-full whitespace-nowrap font-medium">
                        New
                      </span>
                    )}
                  </div>
                  <div className="text-xs text-slate-500 mt-1">
                    {isNew ? 'Assigned' : 'Updated'} {new Date(record.updated_at).toLocaleString()}
                  </div>
                </li>
              );
            })}
          </ul>
        </div>

        <div className="bg-slate-50 border-t border-blue-200 px-4 py-3">
          <button
            onClick={() => setShowNotification(false)}
            className="w-full bg-blue-600 text-white px-4 py-2 rounded-lg hover:bg-blue-700 transition-colors text-sm font-medium"
          >
            Got it
          </button>
        </div>
      </div>
    </div>
  );
}
