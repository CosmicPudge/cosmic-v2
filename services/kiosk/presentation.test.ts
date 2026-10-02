import assert from "node:assert/strict";
import test from "node:test";
import { compactKioskLocation, formatKioskSchoolAssignment } from "./presentation";

test("extracts a concise course code from Canvas iCal assignment titles", () => {
  assert.deepEqual(formatKioskSchoolAssignment("Summary and Analysis 2: Draft and Peer Review [Fall 2026 ENGL-1010-002]"), {
    title: "Summary and Analysis 2: Draft and Peer Review",
    course: "ENGL 1010",
  });
  assert.deepEqual(formatKioskSchoolAssignment("Lab [Spring 2026 CHEM-1210-001]", "Chemistry"), { title: "Lab", course: "CHEM 1210" });
  assert.deepEqual(formatKioskSchoolAssignment("Reading Response", "English"), { title: "Reading Response", course: "English" });
});

test("compacts noisy calendar locations for kiosk rows", () => {
  assert.equal(compactKioskLocation("Department of Military Science, 850 E 700 N, Logan, UT"), "Military Science");
  assert.equal(compactKioskLocation("Huntsman School of Business, 3500 Old Main Hill"), "Huntsman School of Business");
  assert.equal(compactKioskLocation("Utah State University - College of Engineering, 4100 Old Main Hill"), "College of Engineering");
});
