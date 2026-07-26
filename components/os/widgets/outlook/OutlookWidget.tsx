"use client";

import Widget from "@/components/os/ui/widget/Widget";
import WidgetHeader from "@/components/os/ui/widget/WidgetHeader";
import WidgetBody from "@/components/os/ui/widget/WidgetBody";
import WidgetFooter from "@/components/os/ui/widget/WidgetFooter";

import OutlookInbox from "./OutlookInbox";
import OutlookPriority from "./OutlookPriority";
import OutlookAccounts from "./OutlookAccounts";
import OutlookFooter from "./OutlookFooter";

export default function OutlookWidget() {
  return (
    <Widget
      accent="outlook"
    >
      <WidgetHeader
        title="Outlook"
        subtitle="Inbox Overview"
      />

      <WidgetBody>
        <OutlookInbox />

        <OutlookPriority />

        <OutlookAccounts />
      </WidgetBody>

      <WidgetFooter>
        <OutlookFooter />
      </WidgetFooter>
    </Widget>
  );
}