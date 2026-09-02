import { getSchoolDataForAccount, getSchoolSnapshotForAccount } from "@/services/school/server";
import { schoolSnapshotToCalendarEvents } from "@/services/calendar/schoolAdapter";
import { schoolSnapshotSearchRecords } from "@/services/search/schoolAdapter";
import { getSchoolCoursePlan } from "@/services/school/coursePlanRepository";
import { executeAITool } from "@/services/ai/tools";
import { buildIntelligenceContext } from "@/components/school/data/intelligence/context";
import { generateDailyBriefing } from "@/components/school/data/intelligence/briefing";
import { defaultAIPermissions } from "@/core/contracts/AI";

const accountId = process.argv[2];
const query = process.argv[3] ?? "";
if (!accountId) throw new Error("account ID is required");
const serverData = await getSchoolDataForAccount(accountId);
const snapshot = await getSchoolSnapshotForAccount(accountId);
const search = schoolSnapshotSearchRecords(snapshot, { original: query, normalized: query.toLocaleLowerCase(), tokens: query.toLocaleLowerCase().split(/\s+/).filter(Boolean), categories: ["school"] });
const ai = await executeAITool("private_summary", { module: "school" }, accountId, defaultAIPermissions);
const briefing = generateDailyBriefing(buildIntelligenceContext(serverData.data, snapshot));
const courseId = snapshot.notes.find((item) => item.courseId)?.courseId ?? snapshot.coursePlans?.[0]?.courseId;
const plan = courseId ? await getSchoolCoursePlan(accountId, courseId) : null;
const calendarEvents = schoolSnapshotToCalendarEvents(snapshot);
console.log(JSON.stringify({
  snapshot: { assignments: snapshot.assignments.length, notes: snapshot.notes.length, findings: snapshot.sourceIntelligence?.facts.length ?? 0, planning: snapshot.planningAssignments?.length ?? 0 },
  calendar: calendarEvents.length,
  week: (snapshot.timelineEntries?.length ?? 0) >= 0,
  briefing: Boolean(briefing.summary && briefing.school),
  search: search.some((item) => item.title.includes(query)),
  ai: ai && typeof ai === "object" && "available" in ai,
  coursePlan: courseId ? Boolean(plan) : true,
}));
