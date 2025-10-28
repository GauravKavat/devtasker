export type Database = {
  public: {
    Tables: {
      users: {
        Row: {
          id: string;
          clerk_user_id: string;
          role: string;
          created_at: string;
        };
        Insert: {
          id?: string;
          clerk_user_id: string;
          role?: string;
          created_at?: string;
        };
        Update: {
          id?: string;
          clerk_user_id?: string;
          role?: string;
          created_at?: string;
        };
      };
      projects: {
        Row: {
          id: string;
          name: string;
          description: string | null;
          owner_id: string;
          created_at: string;
          updated_at: string;
        };
        Insert: {
          id?: string;
          name: string;
          description?: string | null;
          owner_id: string;
          created_at?: string;
          updated_at?: string;
        };
        Update: {
          id?: string;
          name?: string;
          description?: string | null;
          owner_id?: string;
          updated_at?: string;
        };
      };
      columns: {
        Row: {
          id: string;
          project_id: string;
          name: string;
          position: number;
          color: string | null;
          created_at: string;
        };
        Insert: {
          id?: string;
          project_id: string;
          name: string;
          position: number;
          color?: string | null;
          created_at?: string;
        };
        Update: {
          id?: string;
          project_id?: string;
          name?: string;
          position?: number;
          color?: string | null;
        };
      };
      tasks: {
        Row: {
          id: string;
          column_id: string;
          title: string;
          description: string | null;
          assignee_id: string | null;
          position: number;
          start_date: string | null;
          end_date: string | null;
          created_at: string;
          updated_at: string;
        };
        Insert: {
          id?: string;
          column_id: string;
          title: string;
          description?: string | null;
          assignee_id?: string | null;
          position: number;
          start_date?: string | null;
          end_date?: string | null;
          created_at?: string;
          updated_at?: string;
        };
        Update: {
          id?: string;
          column_id?: string;
          title?: string;
          description?: string | null;
          assignee_id?: string | null;
          position?: number;
          start_date?: string | null;
          end_date?: string | null;
          updated_at?: string;
        };
      };
    };
  };
};

export type User = Database["public"]["Tables"]["users"]["Row"];
export type Project = Database["public"]["Tables"]["projects"]["Row"];
export type Column = Database["public"]["Tables"]["columns"]["Row"];
export type Task = Database["public"]["Tables"]["tasks"]["Row"];

export type TaskWithAssignee = Task & {
  assignee: User | null;
};

export type ColumnWithTasks = Column & {
  tasks: TaskWithAssignee[];
};
