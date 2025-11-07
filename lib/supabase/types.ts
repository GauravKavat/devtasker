export type Database = {
  public: {
    Tables: {
      project_repos: {
        Row: {
          id: string;
          project_id: string;
          repo_url: string;
          repo_owner: string;
          repo_name: string;
          default_branch: string | null;
          created_at: string;
        };
        Insert: {
          id?: string;
          project_id: string;
          repo_url: string;
          repo_owner: string;
          repo_name: string;
          default_branch?: string | null;
          created_at?: string;
        };
        Update: {
          id?: string;
          project_id?: string;
          repo_url?: string;
          repo_owner?: string;
          repo_name?: string;
          default_branch?: string | null;
        };
      };
      task_github_links: {
        Row: {
          id: string;
          task_id: string;
          link_type: "issue" | "pr" | "commit";
          github_id: string;
          github_number: number | null;
          github_url: string;
          status: string | null;
          created_at: string;
          updated_at: string;
        };
        Insert: {
          id?: string;
          task_id: string;
          link_type: "issue" | "pr" | "commit";
          github_id: string;
          github_number?: number | null;
          github_url: string;
          status?: string | null;
          created_at?: string;
          updated_at?: string;
        };
        Update: {
          id?: string;
          task_id?: string;
          link_type?: "issue" | "pr" | "commit";
          github_id?: string;
          github_number?: number | null;
          github_url?: string;
          status?: string | null;
          updated_at?: string;
        };
      };
      github_commits: {
        Row: {
          id: string;
          task_id: string;
          commit_sha: string;
          commit_message: string;
          commit_url: string;
          author: string;
          committed_at: string;
          created_at: string;
        };
        Insert: {
          id?: string;
          task_id: string;
          commit_sha: string;
          commit_message: string;
          commit_url: string;
          author: string;
          committed_at: string;
          created_at?: string;
        };
        Update: {
          id?: string;
          task_id?: string;
          commit_sha?: string;
          commit_message?: string;
          commit_url?: string;
          author?: string;
          committed_at?: string;
        };
      };
      github_webhooks: {
        Row: {
          id: string;
          project_id: string;
          webhook_id: string;
          webhook_url: string;
          secret: string;
          active: boolean;
          created_at: string;
        };
        Insert: {
          id?: string;
          project_id: string;
          webhook_id: string;
          webhook_url: string;
          secret: string;
          active?: boolean;
          created_at?: string;
        };
        Update: {
          id?: string;
          project_id?: string;
          webhook_id?: string;
          webhook_url?: string;
          secret?: string;
          active?: boolean;
        };
      };
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
          start_date: string | null;
          deadline: string | null;
          created_at: string;
          updated_at: string;
        };
        Insert: {
          id?: string;
          name: string;
          description?: string | null;
          owner_id: string;
          start_date?: string | null;
          deadline?: string | null;
          created_at?: string;
          updated_at?: string;
        };
        Update: {
          id?: string;
          name?: string;
          description?: string | null;
          owner_id?: string;
          start_date?: string | null;
          deadline?: string | null;
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
      project_members: {
        Row: {
          id: string;
          project_id: string;
          user_id: string;
          role: string;
          invited_by: string | null;
          joined_at: string;
        };
        Insert: {
          id?: string;
          project_id: string;
          user_id: string;
          role?: string;
          invited_by?: string | null;
          joined_at?: string;
        };
        Update: {
          id?: string;
          project_id?: string;
          user_id?: string;
          role?: string;
          invited_by?: string | null;
        };
      };
      project_invitations: {
        Row: {
          id: string;
          project_id: string;
          email: string;
          token: string;
          role: string;
          invited_by: string;
          expires_at: string;
          used_at: string | null;
          created_at: string;
        };
        Insert: {
          id?: string;
          project_id: string;
          email: string;
          token: string;
          role?: string;
          invited_by: string;
          expires_at: string;
          used_at?: string | null;
          created_at?: string;
        };
        Update: {
          id?: string;
          email?: string;
          expires_at?: string;
          used_at?: string | null;
        };
      };
      meetings: {
        Row: {
          id: string;
          project_id: string;
          title: string;
          description: string | null;
          start_time: string; // or meeting_time if you didn't rename
          end_time: string | null;
          created_by: string;
          created_at: string;
          attendees: string[] | null;
          google_calendar_event_id: string | null;
        };
        Insert: {
          id?: string;
          project_id: string;
          title: string;
          description?: string | null;
          start_time: string; // or meeting_time
          end_time?: string | null;
          created_by: string;
          created_at?: string;
          attendees?: string[] | null;
          google_calendar_event_id?: string | null;
        };
        Update: {
          id?: string;
          project_id?: string;
          title?: string;
          description?: string | null;
          start_time?: string; // or meeting_time
          end_time?: string | null;
          created_by?: string;
          attendees?: string[] | null;
          google_calendar_event_id?: string | null;
        };
      };
    };
  };
};

export type User = Database["public"]["Tables"]["users"]["Row"];
export type Project = Database["public"]["Tables"]["projects"]["Row"];
export type Column = Database["public"]["Tables"]["columns"]["Row"];
export type Task = Database["public"]["Tables"]["tasks"]["Row"];
export type ProjectRepo = Database["public"]["Tables"]["project_repos"]["Row"];
export type TaskGitHubLink =
  Database["public"]["Tables"]["task_github_links"]["Row"];
export type GitHubCommit =
  Database["public"]["Tables"]["github_commits"]["Row"];
export type GitHubWebhook =
  Database["public"]["Tables"]["github_webhooks"]["Row"];
export type ProjectMember =
  Database["public"]["Tables"]["project_members"]["Row"];
export type ProjectInvitation =
  Database["public"]["Tables"]["project_invitations"]["Row"];

export type TaskWithAssignee = Task & {
  assignee: User | null;
};

export type ColumnWithTasks = Column & {
  tasks: TaskWithAssignee[];
};

export type TaskWithGitHub = TaskWithAssignee & {
  github_links?: TaskGitHubLink[];
  github_commits?: GitHubCommit[];
};

export type ProjectWithRepos = Project & {
  repos?: ProjectRepo[];
};

export type ProjectMemberWithUser = ProjectMember & {
  user: User;
};

export type Meeting = Database["public"]["Tables"]["meetings"]["Row"];
