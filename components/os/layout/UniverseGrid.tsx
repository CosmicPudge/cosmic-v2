"use client";

import WeatherWidget from "../widgets/WeatherWidget";
import AssistantWidget from "../widgets/AssistantWidget";
import CalendarWidget from "../widgets/CalendarWidget";
import SportsWidget from "../widgets/SportsWidget";
import GarageWidget from "../widgets/GarageWidget";
import SchoolWidget from "../widgets/SchoolWidget";
import ProjectsWidget from "../widgets/ProjectsWidget";
import NotesWidget from "../widgets/NotesWidget";
import OutlookWidget from "../widgets/OutlookWidget";
import MusicWidget from "../widgets/MusicWidget";
import SearchWidget from "../widgets/SearchWidget";
import NotificationsWidget from "../widgets/NotificationsWidget";
import SystemWidget from "../widgets/SystemWidget";
import ClockWidget from "../widgets/ClockWidget";
import BriefingWidget from "../widgets/BriefingWidget";

export default function UniverseGrid() {
  return (
    <div className="grid grid-cols-12 gap-6">

      {/* Top Row */}

      <div className="col-span-3">
        <ClockWidget />
      </div>

      <div className="col-span-3">
        <WeatherWidget />
      </div>

      <div className="col-span-3">
        <CalendarWidget />
      </div>

      <div className="col-span-3">
        <NotificationsWidget />
      </div>

      {/* Second Row */}

      <div className="col-span-4">
        <AssistantWidget />
      </div>

      <div className="col-span-4">
        <BriefingWidget />
      </div>

      <div className="col-span-4">
        <SearchWidget />
      </div>

      <div className="col-span-4">
        <SystemWidget />
      </div>

      {/* Third Row */}

      <div className="col-span-6">
        <SportsWidget />
      </div>

      <div className="col-span-6">
        <GarageWidget />
      </div>

      {/* Fourth Row */}

      <div className="col-span-4">
        <SchoolWidget />
      </div>

      <div className="col-span-4">
        <ProjectsWidget />
      </div>

      <div className="col-span-4">
        <NotesWidget />
      </div>

      {/* Bottom Row */}

      <div className="col-span-6">
        <OutlookWidget />
      </div>

      <div className="col-span-6">
        <MusicWidget />
      </div>

    </div>
  );
}