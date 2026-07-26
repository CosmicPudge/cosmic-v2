"use client";

import Widget from "@/components/os/ui/widget/Widget";
import WidgetHeader from "@/components/os/ui/widget/WidgetHeader";
import WidgetBody from "@/components/os/ui/widget/WidgetBody";
import WidgetFooter from "@/components/os/ui/widget/WidgetFooter";

import ProjectsCurrent from "./ProjectsCurrent";
import ProjectsRecent from "./ProjectsRecent";
import ProjectsProgress from "./ProjectsProgress";
import ProjectsFooter from "./ProjectsFooter";

export default function ProjectsWidget() {
  return (
    <Widget
      accent="projects"
    >
      <WidgetHeader
        title="Projects"
        subtitle="Development Dashboard"
      />

      <WidgetBody>
        <ProjectsCurrent />

        <ProjectsRecent />

        <ProjectsProgress />
      </WidgetBody>

      <WidgetFooter>
        <ProjectsFooter />
      </WidgetFooter>
    </Widget>
  );
}