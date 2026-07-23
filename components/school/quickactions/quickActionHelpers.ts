import {
  QuickAction,
  QuickActionsData,
  QuickActionsState,
} from "./quickActionTypes";

export function sortActions(
  actions: QuickAction[]
): QuickAction[] {
  return [...actions].sort((a, b) =>
    a.title.localeCompare(b.title)
  );
}

export function getEnabledActions(
  actions: QuickAction[]
): QuickAction[] {
  return actions.filter(
    (action) => !action.disabled
  );
}

export function getNotificationActions(
  actions: QuickAction[]
): QuickAction[] {
  return actions.filter(
    (action) => action.notification
  );
}

export function buildQuickActions(
  data: QuickActionsData
): QuickActionsState {
  const actions = sortActions(data.actions);

  const enabled =
    getEnabledActions(actions);

  const notifications =
    getNotificationActions(actions);

  return {
    actions,

    summary: {
      total: actions.length,

      enabled: enabled.length,

      notifications:
        notifications.length,
    },
  };
}