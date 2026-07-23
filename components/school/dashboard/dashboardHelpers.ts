import {
  DashboardGreeting,
  GreetingPeriod,
  SchoolDashboardData,
  SchoolDashboardState,
} from "./dashboardTypes";

export function getGreetingPeriod(
  date: Date = new Date()
): GreetingPeriod {
  const hour = date.getHours();

  if (hour >= 5 && hour < 12) {
    return "morning";
  }

  if (hour >= 12 && hour < 17) {
    return "afternoon";
  }

  if (hour >= 17 && hour < 21) {
    return "evening";
  }

  return "night";
}

export function buildGreeting(
  name: string,
  date: Date = new Date()
): DashboardGreeting {
  const period = getGreetingPeriod(date);

  const titles: Record<GreetingPeriod, string> = {
    morning: `Good Morning, ${name}`,
    afternoon: `Good Afternoon, ${name}`,
    evening: `Good Evening, ${name}`,
    night: `Good Evening, ${name}`,
  };

  const subtitles: Record<GreetingPeriod, string> = {
    morning:
      "Let's make today productive.",
    afternoon:
      "Keep the momentum going.",
    evening:
      "Finish strong before tomorrow.",
    night:
      "Take a moment to prepare for tomorrow.",
  };

  return {
    period,
    title: titles[period],
    subtitle: subtitles[period],
  };
}

export function buildDashboard(
  data: SchoolDashboardData
): SchoolDashboardState {
  return {
    greeting: data.greeting,
    overview: data.overview,

    notifications: data.notifications,

    focus: data.focus,

    timeline: data.timeline,

    academics: data.academics,

    deadlines: data.deadlines,

    coach: data.coach,

    afrotc: data.afrotc,

    quickActions: data.quickActions,

    priority: data.priority,
  };
}