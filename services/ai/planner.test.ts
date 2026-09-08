import assert from "node:assert/strict";
import test from "node:test";
import { defaultAIPermissions } from "@/core/contracts/AI";
import { planAIRequest } from "./planner";

test("routes deterministic requests to the existing tool registry", () => {
  assert.equal(planAIRequest("What is the weather today?", defaultAIPermissions)[0]?.name, "current_weather");
  assert.equal(planAIRequest("What is the Packers score?", defaultAIPermissions)[0]?.name, "sports_lookup");
  assert.equal(planAIRequest("What is on my calendar tomorrow?", defaultAIPermissions)[0]?.name, "calendar_lookup");
  assert.equal(planAIRequest("Show my favorite teams in settings", defaultAIPermissions)[0]?.name, "account_settings");
});

test("keeps School on the existing private summary path", () => {
  assert.equal(planAIRequest("Which assignment is due for my school class?", defaultAIPermissions)[0]?.name, "private_summary");
  assert.equal(planAIRequest("Which assignment is due for my school class?", defaultAIPermissions)[0]?.args.module, "school");
});
