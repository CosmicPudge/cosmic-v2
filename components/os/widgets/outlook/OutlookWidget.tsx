"use client";

import Widget from "@/components/os/ui/widget/Widget";
import WidgetHeader from "@/components/os/ui/widget/WidgetHeader";
import WidgetBody from "@/components/os/ui/widget/WidgetBody";
import WidgetFooter from "@/components/os/ui/widget/WidgetFooter";

import OutlookInbox from "./OutlookInbox";
import OutlookPriority from "./OutlookPriority";
import OutlookAccounts from "./OutlookAccounts";
import OutlookFooter from "./OutlookFooter";
import KioskSceneFrame from "@/components/os/widgets/shared/KioskSceneFrame";
import { useWidgetContext } from "@/components/os/ui/widget/WidgetContext";

export default function OutlookWidget() {
  const { presentation } = useWidgetContext();
  if (presentation === "kiosk") return <KioskSceneFrame scene="email" eyebrow="COSMIC • EMAIL" title="Communications center" subtitle="Connect an account to surface important messages." />;
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
