import * as XLSX from 'xlsx';
import { supabase } from './supabase';

export interface ExportedRecord {
  record_number: number;
  enquiry_officer: string | null;
  ob_number: string | null;
  offence: string | null;
  date_referred: string | null;
  case_short_of: string | null;
  [key: string]: any;
}

export async function exportRecordsToExcel(records: ExportedRecord[], filename: string = 'records.xlsx') {
  try {
    const workbook = XLSX.utils.book_new();

    const worksheet = XLSX.utils.json_to_sheet(records);

    XLSX.utils.book_append_sheet(workbook, worksheet, 'Records');

    XLSX.writeFile(workbook, filename);
  } catch (error) {
    throw new Error(`Failed to export records: ${(error as Error).message}`);
  }
}

export async function importRecordsFromExcel(
  file: File,
  userId: string,
  customFields: { id: string; field_name: string }[]
): Promise<{ success: number; failed: number; errors: string[] }> {
  try {
    const buffer = await file.arrayBuffer();
    const workbook = XLSX.read(buffer, { type: 'array' });
    const worksheet = workbook.Sheets[workbook.SheetNames[0]];
    const data = XLSX.utils.sheet_to_json<any>(worksheet);

    let successCount = 0;
    let failedCount = 0;
    const errors: string[] = [];

    for (const row of data) {
      try {
        const recordData = {
          user_id: userId,
          enquiry_officer: row.enquiry_officer || null,
          ob_number: row.ob_number || null,
          offence: row.offence || null,
          date_referred: row.date_referred || null,
          case_short_of: row.case_short_of || null,
        };

        const { data: newRecord, error: insertError } = await supabase
          .from('records')
          .insert(recordData)
          .select()
          .single();

        if (insertError) {
          failedCount++;
          errors.push(`Row ${data.indexOf(row) + 1}: ${insertError.message}`);
          continue;
        }

        const customFieldValues: any[] = [];
        for (const field of customFields) {
          if (row[field.field_name]) {
            customFieldValues.push({
              record_id: newRecord.id,
              field_id: field.id,
              value: row[field.field_name],
            });
          }
        }

        if (customFieldValues.length > 0) {
          const { error: customError } = await supabase
            .from('custom_field_values')
            .insert(customFieldValues);

          if (customError) {
            errors.push(`Row ${data.indexOf(row) + 1}: Custom field insert failed - ${customError.message}`);
            failedCount++;
            continue;
          }
        }

        successCount++;
      } catch (error) {
        failedCount++;
        errors.push(`Row ${data.indexOf(row) + 1}: ${(error as Error).message}`);
      }
    }

    return { success: successCount, failed: failedCount, errors };
  } catch (error) {
    throw new Error(`Failed to import records: ${(error as Error).message}`);
  }
}
