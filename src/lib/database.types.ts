export interface Database {
  public: {
    Tables: {
      profiles: {
        Row: {
          id: string;
          username: string;
          email: string;
          role: 'admin' | 'user';
          created_at: string;
        };
        Insert: {
          id: string;
          username: string;
          email: string;
          role?: 'admin' | 'user';
          created_at?: string;
        };
        Update: {
          id?: string;
          username?: string;
          email?: string;
          role?: 'admin' | 'user';
          created_at?: string;
        };
      };
      records: {
        Row: {
          id: string;
          user_id: string;
          record_number: number;
          enquiry_officer: string | null;
          ob_number: string | null;
          offence: string | null;
          date_referred: string | null;
          case_short_of: string | null;
          created_at: string;
          updated_at: string;
        };
        Insert: {
          id?: string;
          user_id: string;
          record_number?: number;
          enquiry_officer?: string | null;
          ob_number?: string | null;
          offence?: string | null;
          date_referred?: string | null;
          case_short_of?: string | null;
          created_at?: string;
          updated_at?: string;
        };
        Update: {
          id?: string;
          user_id?: string;
          record_number?: number;
          enquiry_officer?: string | null;
          ob_number?: string | null;
          offence?: string | null;
          date_referred?: string | null;
          case_short_of?: string | null;
          created_at?: string;
          updated_at?: string;
        };
      };
      custom_fields: {
        Row: {
          id: string;
          field_name: string;
          field_type: 'text' | 'number' | 'date';
          created_by: string | null;
          created_at: string;
        };
        Insert: {
          id?: string;
          field_name: string;
          field_type?: 'text' | 'number' | 'date';
          created_by?: string | null;
          created_at?: string;
        };
        Update: {
          id?: string;
          field_name?: string;
          field_type?: 'text' | 'number' | 'date';
          created_by?: string | null;
          created_at?: string;
        };
      };
      custom_field_values: {
        Row: {
          id: string;
          record_id: string;
          field_id: string;
          value: string | null;
          created_at: string;
        };
        Insert: {
          id?: string;
          record_id: string;
          field_id: string;
          value?: string | null;
          created_at?: string;
        };
        Update: {
          id?: string;
          record_id?: string;
          field_id?: string;
          value?: string | null;
          created_at?: string;
        };
      };
    };
  };
}
