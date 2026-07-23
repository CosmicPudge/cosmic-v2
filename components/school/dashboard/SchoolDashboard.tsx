"use client";

import { buildDashboard } from "./dashboardHelpers";
import type { SchoolDashboardData } from "./dashboardTypes";

import SchoolGreeting from "./SchoolGreeting";
import SchoolHeader from "./SchoolHeader";
import SchoolOverview from "./SchoolOverview";

import { PriorityCard } from "../priority";
import { QuickActionsCard } from "../quickactions";
import { TimelineCard } from "../timeline";
import { DeadlinesCard } from "../deadlines";
import { CoachCard } from "../aicoach";
import { AFROTCCard } from "../afrotc";
import { NotificationsCard } from "../notifications";

interface SchoolDashboardProps {
    data: SchoolDashboardData;

    title?: string;

    notificationCount?: number;

    online?: boolean;
}

export default function SchoolDashboard({
    data,
    title = "School",
    notificationCount = 0,
    online = true,
}: SchoolDashboardProps) {
    const state = buildDashboard(data);

    return (
        <main className="space-y-8">
            <SchoolHeader
                title={title}
                notificationCount={notificationCount}
                online={online}
            />

            <SchoolGreeting
                greeting={state.greeting}
                overview={state.overview}
            />

            <SchoolOverview
                overview={state.overview}
            />

            <div className="grid gap-8 xl:grid-cols-12">
                <section className="space-y-8 xl:col-span-5">
                    <PriorityCard
                        data={state.priority}
                    />

                    <TimelineCard
                        data={state.timeline}
                    />

                    <DeadlinesCard
                        data={state.deadlines}
                    />
                </section>

                <section className="space-y-8 xl:col-span-7">
                    <QuickActionsCard
                        data={state.quickActions}
                    />

                    <CoachCard
                        data={state.coach}
                    />

                    <AFROTCCard
                        data={state.afrotc}
                    />

                    <NotificationsCard
                        notifications={state.notifications}
                    />
                </section>
            </div>
        </main>
    );
}