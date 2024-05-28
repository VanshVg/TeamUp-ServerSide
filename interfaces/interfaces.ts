export interface userInterface {
  id: number;
  first_name: string;
  last_name: string;
  username: string;
  email: string;
  password: string;
  verification_token: string;
  is_active: boolean;
  reset_request: Date | null;
  reset_token: string | null;
  deleted_at: Date | null;
  created_at: Date;
  updated_at: Date;
}
