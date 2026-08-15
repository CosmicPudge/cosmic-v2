export interface DashboardNotification {
  id: string;

  title: string;

  description?: string;

  type:
    | "info"
    | "success"
    | "warning"
    | "error";

  createdAt: number;

  read: boolean;
}

export interface DashboardState {
  editMode: boolean;

  activeWidget: string | null;

  focusedWidget: string | null;

  assistantOpen: boolean;

  notifications: DashboardNotification[];
}
