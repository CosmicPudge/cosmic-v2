"use client";

import Widget from "@/components/os/ui/widget/Widget";
import WidgetHeader from "@/components/os/ui/widget/WidgetHeader";
import WidgetBody from "@/components/os/ui/widget/WidgetBody";
import WidgetFooter from "@/components/os/ui/widget/WidgetFooter";

import NotesPinned from "./NotesPinned";
import NotesRecent from "./NotesRecent";
import NotesCategories from "./NotesCategories";
import NotesFooter from "./NotesFooter";

export default function NotesWidget() {
  return (
    <Widget
      accent="notes"
    >
      <WidgetHeader
        title="Notes"
        subtitle="Your workspace"
      />

      <WidgetBody>
        <NotesPinned />

        <NotesRecent />

        <NotesCategories />
      </WidgetBody>

      <WidgetFooter>
        <NotesFooter />
      </WidgetFooter>
    </Widget>
  );
}