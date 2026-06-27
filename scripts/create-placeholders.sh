#!/bin/bash

set -e

if [ ! -f "package.json" ]; then
    echo "❌ Run this script from the root of cosmic-v2."
    exit 1
fi

echo "🚀 Creating placeholder files..."

create_tsx () {

    FILE="$1"

    if [ -f "$FILE" ]; then
        echo "⏭  Skipping $FILE"
        return
    fi

    mkdir -p "$(dirname "$FILE")"

    NAME=$(basename "$FILE" .tsx)

cat > "$FILE" << EOF
export default function ${NAME}() {
    return (
        <div>
            ${NAME}
        </div>
    );
}
EOF

    echo "✅ Created $FILE"

}

create_ts () {

    FILE="$1"

    if [ -f "$FILE" ]; then
        echo "⏭  Skipping $FILE"
        return
    fi

    mkdir -p "$(dirname "$FILE")"

    NAME=$(basename "$FILE" .ts)

cat > "$FILE" << EOF
/**
 * ${NAME}
 * Placeholder
 */

export {};
EOF

    echo "✅ Created $FILE"

}

create_css () {

    FILE="$1"

    if [ -f "$FILE" ]; then
        echo "⏭  Skipping $FILE"
        return
    fi

    mkdir -p "$(dirname "$FILE")"

cat > "$FILE" << EOF
/* ${FILE} */
EOF

    echo "✅ Created $FILE"

}

create_json () {

    FILE="$1"

    if [ -f "$FILE" ]; then
        echo "⏭  Skipping $FILE"
        return
    fi

    mkdir -p "$(dirname "$FILE")"

cat > "$FILE" << EOF
{}
EOF

    echo "✅ Created $FILE"

}

create_md () {

    FILE="$1"

    if [ -f "$FILE" ]; then
        echo "⏭  Skipping $FILE"
        return
    fi

    mkdir -p "$(dirname "$FILE")"

cat > "$FILE" << EOF
# $(basename "$FILE" .md)
EOF

    echo "✅ Created $FILE"

}

#########################################
# COMPONENTS
#########################################

#########################################
# CORE
#########################################

create_tsx components/os/core/CosmicBoot.tsx
create_tsx components/os/core/CosmicNotifications.tsx
create_tsx components/os/core/CosmicProvider.tsx
create_tsx components/os/core/CosmicRouter.tsx
create_tsx components/os/core/CosmicSession.tsx
create_tsx components/os/core/CosmicShell.tsx
create_tsx components/os/core/CosmicTheme.tsx
create_tsx components/os/core/CosmicUpdater.tsx

#########################################
# LAYOUT
#########################################

create_tsx components/os/layout/Dock.tsx
create_tsx components/os/layout/Footer.tsx
create_tsx components/os/layout/Header.tsx
create_tsx components/os/layout/SearchOverlay.tsx
create_tsx components/os/layout/Sidebar.tsx
create_tsx components/os/layout/StatusBar.tsx
create_tsx components/os/layout/UniverseGrid.tsx

#########################################
# EFFECTS
#########################################

create_tsx components/os/effects/AmbientGlow.tsx
create_tsx components/os/effects/AnimatedBackground.tsx
create_tsx components/os/effects/Constellations.tsx
create_tsx components/os/effects/FloatingParticles.tsx
create_tsx components/os/effects/Galaxy.tsx
create_tsx components/os/effects/GradientMesh.tsx
create_tsx components/os/effects/MouseParallax.tsx
create_tsx components/os/effects/Nebula.tsx
create_tsx components/os/effects/OrbitLines.tsx
create_tsx components/os/effects/ShootingStars.tsx
create_tsx components/os/effects/Stars.tsx

#########################################
# ANIMATIONS
#########################################

create_tsx components/os/animations/Boot.tsx
create_tsx components/os/animations/DockHover.tsx
create_tsx components/os/animations/Fade.tsx
create_tsx components/os/animations/Glow.tsx
create_tsx components/os/animations/Launch.tsx
create_tsx components/os/animations/Pulse.tsx
create_tsx components/os/animations/Ripple.tsx
create_tsx components/os/animations/Scale.tsx
create_tsx components/os/animations/Slide.tsx
create_tsx components/os/animations/Typing.tsx
create_tsx components/os/animations/WidgetFlip.tsx

#########################################
# UI
#########################################

create_tsx components/os/ui/Avatar.tsx
create_tsx components/os/ui/Badge.tsx
create_tsx components/os/ui/Button.tsx
create_tsx components/os/ui/Card.tsx
create_tsx components/os/ui/Chip.tsx
create_tsx components/os/ui/ContextMenu.tsx
create_tsx components/os/ui/Divider.tsx
create_tsx components/os/ui/Dropdown.tsx
create_tsx components/os/ui/GlassPanel.tsx
create_tsx components/os/ui/IconButton.tsx
create_tsx components/os/ui/Input.tsx
create_tsx components/os/ui/Metric.tsx
create_tsx components/os/ui/Modal.tsx
create_tsx components/os/ui/ProgressRing.tsx
create_tsx components/os/ui/Skeleton.tsx
create_tsx components/os/ui/Spinner.tsx
create_tsx components/os/ui/Toast.tsx
create_tsx components/os/ui/Tooltip.tsx
create_tsx components/os/ui/WindowFrame.tsx

#########################################
# ICONS
#########################################

create_tsx components/os/icons/AssistantIcon.tsx
create_tsx components/os/icons/CalendarIcon.tsx
create_tsx components/os/icons/GarageIcon.tsx
create_tsx components/os/icons/HomeIcon.tsx
create_tsx components/os/icons/NotesIcon.tsx
create_tsx components/os/icons/OutlookIcon.tsx
create_tsx components/os/icons/ProjectsIcon.tsx
create_tsx components/os/icons/SchoolIcon.tsx
create_tsx components/os/icons/SettingsIcon.tsx
create_tsx components/os/icons/SportsIcon.tsx
create_tsx components/os/icons/WeatherIcon.tsx

#########################################
# WIDGETS
#########################################

create_tsx components/os/widgets/AssistantWidget.tsx
create_tsx components/os/widgets/BriefingWidget.tsx
create_tsx components/os/widgets/CalendarWidget.tsx
create_tsx components/os/widgets/ClockWidget.tsx
create_tsx components/os/widgets/GarageWidget.tsx
create_tsx components/os/widgets/MusicWidget.tsx
create_tsx components/os/widgets/NotesWidget.tsx
create_tsx components/os/widgets/NotificationsWidget.tsx
create_tsx components/os/widgets/OutlookWidget.tsx
create_tsx components/os/widgets/ProjectsWidget.tsx
create_tsx components/os/widgets/SchoolWidget.tsx
create_tsx components/os/widgets/SearchWidget.tsx
create_tsx components/os/widgets/SportsWidget.tsx
create_tsx components/os/widgets/SystemWidget.tsx
create_tsx components/os/widgets/WeatherWidget.tsx

#########################################
# WINDOWS
#########################################

create_tsx components/os/windows/AssistantWindow.tsx
create_tsx components/os/windows/CalendarWindow.tsx
create_tsx components/os/windows/FilesWindow.tsx
create_tsx components/os/windows/GarageWindow.tsx
create_tsx components/os/windows/MusicWindow.tsx
create_tsx components/os/windows/NotesWindow.tsx
create_tsx components/os/windows/OutlookWindow.tsx
create_tsx components/os/windows/ProjectsWindow.tsx
create_tsx components/os/windows/SchoolWindow.tsx
create_tsx components/os/windows/SettingsWindow.tsx
create_tsx components/os/windows/SportsWindow.tsx
create_tsx components/os/windows/WeatherWindow.tsx

#########################################
# OVERLAYS
#########################################

create_tsx components/os/overlays/CommandPalette.tsx
create_tsx components/os/overlays/NotificationCenter.tsx
create_tsx components/os/overlays/QuickSettings.tsx
create_tsx components/os/overlays/SearchOverlay.tsx
create_tsx components/os/overlays/VoiceOverlay.tsx

#########################################
# HOOKS
#########################################

create_ts hooks/os/useAssistant.ts
create_ts hooks/os/useCalendar.ts
create_ts hooks/os/useGarage.ts
create_ts hooks/os/useNotifications.ts
create_ts hooks/os/useOutlook.ts
create_ts hooks/os/useProjects.ts
create_ts hooks/os/useSchool.ts
create_ts hooks/os/useSearch.ts
create_ts hooks/os/useSports.ts
create_ts hooks/os/useTheme.ts
create_ts hooks/os/useWeather.ts
create_ts hooks/os/useWindow.ts

#########################################
# AI
#########################################

create_ts lib/ai/assistant.ts
create_ts lib/ai/briefing.ts
create_ts lib/ai/context.ts
create_ts lib/ai/conversation.ts
create_ts lib/ai/embeddings.ts
create_ts lib/ai/intent.ts
create_ts lib/ai/memory.ts
create_ts lib/ai/planner.ts
create_ts lib/ai/recommendations.ts
create_ts lib/ai/router.ts
create_ts lib/ai/voice.ts

#########################################
# AUTH
#########################################

create_ts lib/auth/auth.ts
create_ts lib/auth/session.ts

#########################################
# MICROSOFT
#########################################

create_ts lib/microsoft/calendar.ts
create_ts lib/microsoft/graph.ts
create_ts lib/microsoft/mail.ts
create_ts lib/microsoft/profile.ts
create_ts lib/microsoft/tasks.ts

#########################################
# WEATHER
#########################################

create_ts lib/weather/alerts.ts
create_ts lib/weather/forecast.ts
create_ts lib/weather/radar.ts
create_ts lib/weather/weather.ts

#########################################
# SPORTS
#########################################

create_ts lib/sports/f1.ts
create_ts lib/sports/mlb.ts
create_ts lib/sports/nascar.ts
create_ts lib/sports/nfl.ts
create_ts lib/sports/scores.ts
create_ts lib/sports/standings.ts

#########################################
# SCHOOL
#########################################

create_ts lib/school/assignments.ts
create_ts lib/school/canvas.ts
create_ts lib/school/grades.ts
create_ts lib/school/schedule.ts

#########################################
# GARAGE
#########################################

create_ts lib/garage/diagnostics.ts
create_ts lib/garage/expenses.ts
create_ts lib/garage/fuel.ts
create_ts lib/garage/maintenance.ts
create_ts lib/garage/mods.ts
create_ts lib/garage/vehicles.ts

#########################################
# NOTIFICATIONS
#########################################

create_ts lib/notifications/notifications.ts
create_ts lib/notifications/priorities.ts
create_ts lib/notifications/rules.ts

#########################################
# SERVICES
#########################################

create_ts services/assistantService.ts
create_ts services/briefingService.ts
create_ts services/calendarService.ts
create_ts services/garageService.ts
create_ts services/notificationService.ts
create_ts services/outlookService.ts
create_ts services/searchService.ts
create_ts services/sportsService.ts
create_ts services/weatherService.ts

#########################################
# STORES
#########################################

create_ts stores/assistantStore.ts
create_ts stores/layoutStore.ts
create_ts stores/notificationStore.ts
create_ts stores/sportsStore.ts
create_ts stores/themeStore.ts
create_ts stores/weatherStore.ts
create_ts stores/windowStore.ts

#########################################
# CONFIG
#########################################

create_ts config/os/defaults.ts
create_ts config/os/navigation.ts
create_ts config/os/routes.ts
create_ts config/os/settings.ts
create_ts config/os/themes.ts

#########################################
# CONSTANTS
#########################################

create_ts constants/os/animations.ts
create_ts constants/os/colors.ts
create_ts constants/os/routes.ts
create_ts constants/os/widgets.ts
create_ts constants/os/windows.ts

#########################################
# TYPES
#########################################

create_ts types/os/assistant.ts
create_ts types/os/calendar.ts
create_ts types/os/garage.ts
create_ts types/os/notifications.ts
create_ts types/os/outlook.ts
create_ts types/os/projects.ts
create_ts types/os/school.ts
create_ts types/os/settings.ts
create_ts types/os/sports.ts
create_ts types/os/weather.ts
create_ts types/os/widgets.ts
create_ts types/os/windows.ts

#########################################
# UTILS
#########################################

create_ts utils/os/colors.ts
create_ts utils/os/constants.ts
create_ts utils/os/dates.ts
create_ts utils/os/formatting.ts
create_ts utils/os/helpers.ts
create_ts utils/os/navigation.ts

#########################################
# STYLES
#########################################

create_css styles/os/animations.css
create_css styles/os/background.css
create_css styles/os/glass.css
create_css styles/os/themes.css
create_css styles/os/typography.css
create_css styles/os/widgets.css
create_css styles/os/windows.css

#########################################
# APP ROUTES
#########################################

create_tsx app/os/page.tsx
create_tsx app/os/layout.tsx
create_tsx app/os/loading.tsx
create_tsx app/os/not-found.tsx

create_tsx app/os/assistant/page.tsx
create_tsx app/os/calendar/page.tsx
create_tsx app/os/garage/page.tsx
create_tsx app/os/notes/page.tsx
create_tsx app/os/outlook/page.tsx
create_tsx app/os/projects/page.tsx
create_tsx app/os/school/page.tsx
create_tsx app/os/settings/page.tsx
create_tsx app/os/sports/page.tsx
create_tsx app/os/weather/page.tsx

#########################################
# DOCS
#########################################

create_md docs/ARCHITECTURE.md
create_md docs/ROADMAP.md
create_md docs/CONTRIBUTING.md
create_md docs/API.md
create_md docs/CHANGELOG.md

#########################################
# ROOT FILES
#########################################

create_json data/memory.json

echo ""
echo "======================================="
echo "🚀 Cosmic OS scaffold complete!"
echo "======================================="
echo ""