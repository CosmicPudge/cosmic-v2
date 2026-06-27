#!/bin/bash

build_components() {

#########################################
# CORE
#########################################

create_component components/os/core/CosmicBoot.tsx
create_component components/os/core/CosmicNotifications.tsx
create_component components/os/core/CosmicProvider.tsx
create_component components/os/core/CosmicRouter.tsx
create_component components/os/core/CosmicSession.tsx
create_component components/os/core/CosmicShell.tsx
create_component components/os/core/CosmicTheme.tsx
create_component components/os/core/CosmicUpdater.tsx

#########################################
# LAYOUT
#########################################

create_component components/os/layout/Dock.tsx
create_component components/os/layout/Footer.tsx
create_component components/os/layout/Header.tsx
create_component components/os/layout/SearchOverlay.tsx
create_component components/os/layout/Sidebar.tsx
create_component components/os/layout/StatusBar.tsx
create_component components/os/layout/UniverseGrid.tsx

#########################################
# EFFECTS
#########################################

create_component components/os/effects/AmbientGlow.tsx
create_component components/os/effects/AnimatedBackground.tsx
create_component components/os/effects/Constellations.tsx
create_component components/os/effects/FloatingParticles.tsx
create_component components/os/effects/Galaxy.tsx
create_component components/os/effects/GradientMesh.tsx
create_component components/os/effects/MouseParallax.tsx
create_component components/os/effects/Nebula.tsx
create_component components/os/effects/OrbitLines.tsx
create_component components/os/effects/ShootingStars.tsx
create_component components/os/effects/Stars.tsx

#########################################
# ANIMATIONS
#########################################

create_component components/os/animations/Boot.tsx
create_component components/os/animations/DockHover.tsx
create_component components/os/animations/Fade.tsx
create_component components/os/animations/Glow.tsx
create_component components/os/animations/Launch.tsx
create_component components/os/animations/Pulse.tsx
create_component components/os/animations/Ripple.tsx
create_component components/os/animations/Scale.tsx
create_component components/os/animations/Slide.tsx
create_component components/os/animations/Typing.tsx
create_component components/os/animations/WidgetFlip.tsx

#########################################
# UI
#########################################

create_component components/os/ui/Avatar.tsx
create_component components/os/ui/Badge.tsx
create_component components/os/ui/Button.tsx
create_component components/os/ui/Card.tsx
create_component components/os/ui/Chip.tsx
create_component components/os/ui/ContextMenu.tsx
create_component components/os/ui/Divider.tsx
create_component components/os/ui/Dropdown.tsx
create_component components/os/ui/GlassPanel.tsx
create_component components/os/ui/IconButton.tsx
create_component components/os/ui/Input.tsx
create_component components/os/ui/Metric.tsx
create_component components/os/ui/Modal.tsx
create_component components/os/ui/ProgressRing.tsx
create_component components/os/ui/Skeleton.tsx
create_component components/os/ui/Spinner.tsx
create_component components/os/ui/Toast.tsx
create_component components/os/ui/Tooltip.tsx
create_component components/os/ui/WindowFrame.tsx

#########################################
# ICONS
#########################################

create_component components/os/icons/AssistantIcon.tsx
create_component components/os/icons/CalendarIcon.tsx
create_component components/os/icons/GarageIcon.tsx
create_component components/os/icons/HomeIcon.tsx
create_component components/os/icons/NotesIcon.tsx
create_component components/os/icons/OutlookIcon.tsx
create_component components/os/icons/ProjectsIcon.tsx
create_component components/os/icons/SchoolIcon.tsx
create_component components/os/icons/SettingsIcon.tsx
create_component components/os/icons/SportsIcon.tsx
create_component components/os/icons/WeatherIcon.tsx

#########################################
# WIDGETS
#########################################

create_widget components/os/widgets/AssistantWidget.tsx
create_widget components/os/widgets/BriefingWidget.tsx
create_widget components/os/widgets/CalendarWidget.tsx
create_widget components/os/widgets/ClockWidget.tsx
create_widget components/os/widgets/GarageWidget.tsx
create_widget components/os/widgets/MusicWidget.tsx
create_widget components/os/widgets/NotesWidget.tsx
create_widget components/os/widgets/NotificationsWidget.tsx
create_widget components/os/widgets/OutlookWidget.tsx
create_widget components/os/widgets/ProjectsWidget.tsx
create_widget components/os/widgets/SchoolWidget.tsx
create_widget components/os/widgets/SearchWidget.tsx
create_widget components/os/widgets/SportsWidget.tsx
create_widget components/os/widgets/SystemWidget.tsx
create_widget components/os/widgets/WeatherWidget.tsx

#########################################
# WINDOWS
#########################################

create_window components/os/windows/AssistantWindow.tsx
create_window components/os/windows/CalendarWindow.tsx
create_window components/os/windows/FilesWindow.tsx
create_window components/os/windows/GarageWindow.tsx
create_window components/os/windows/MusicWindow.tsx
create_window components/os/windows/NotesWindow.tsx
create_window components/os/windows/OutlookWindow.tsx
create_window components/os/windows/ProjectsWindow.tsx
create_window components/os/windows/SchoolWindow.tsx
create_window components/os/windows/SettingsWindow.tsx
create_window components/os/windows/SportsWindow.tsx
create_window components/os/windows/WeatherWindow.tsx

#########################################
# OVERLAYS
#########################################

create_component components/os/overlays/CommandPalette.tsx
create_component components/os/overlays/NotificationCenter.tsx
create_component components/os/overlays/QuickSettings.tsx
create_component components/os/overlays/SearchOverlay.tsx
create_component components/os/overlays/VoiceOverlay.tsx

}