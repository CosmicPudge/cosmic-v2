import { TimelineItem } from "../types";
import { IntelligenceContext } from "./context";

export interface TimelineInsight extends TimelineItem {
  importance: "low" | "medium" | "high";

  preparation?: string;

  warning?: string;
}

export function buildTimeline(
  context: IntelligenceContext
): TimelineInsight[] {
  const highestRisk = context.risks[0];

  return context.data.timeline.map((item) => {
    let importance: TimelineInsight["importance"] = "low";

    let preparation: string | undefined;

    let warning: string | undefined;

    switch (item.type) {
      case "assignment":
        importance = "high";
        preparation = "Complete this assignment before its due time.";
        break;

      case "exam":
        importance = "high";
        preparation = "Review your study material before the exam.";
        break;

      case "quiz":
        importance = "medium";
        preparation = "Take a few minutes to review your notes.";
        break;

      case "class":
        importance = "medium";

        if (highestRisk) {
          warning = `Highest priority: ${highestRisk.assignment.title}`;
        }

        break;

      case "afrotc":
        importance = "high";
        preparation = "Verify your uniform and required equipment.";
        break;

      case "meeting":
        importance = "medium";
        preparation = "Review your agenda before attending.";
        break;

      case "announcement":
        importance = "low";
        break;

      case "other":
      default:
        importance = "low";
        break;
    }

    return {
      ...item,

      importance,

      preparation,

      warning,
    };
  });
}