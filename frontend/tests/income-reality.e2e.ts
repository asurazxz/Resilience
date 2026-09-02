import { expect, test } from "@playwright/test";

test("confirmed Foundation entries flow into Income Reality without double-counting CPF", async ({
  page,
}, testInfo) => {
  const consoleErrors: string[] = [];
  page.on("console", (message) => {
    if (message.type() === "error") consoleErrors.push(message.text());
  });
  page.on("pageerror", (error) => consoleErrors.push(error.message));

  await page.goto("http://localhost:5173/income-reality");

  await expect(page.getByRole("heading", { name: "What you actually earned" })).toBeVisible();
  await expect(page.getByRole("navigation", { name: "Primary" })).toContainText("Income reality");
  await expect(page.getByRole("region", { name: /Income breakdown for week of/ }).first()).toBeVisible();

  const checkbox = page.getByRole("checkbox", {
    name: "Estimate CPF/MediSave when no amount was recorded",
  });
  const refreshedBreakdown = page.waitForResponse(
    (response) =>
      response.url().endsWith("/api/v1/income-reality/breakdown") &&
      response.request().method() === "POST",
  );
  await checkbox.check();
  await expect(checkbox).toBeChecked();
  await refreshedBreakdown;
  await expect(page.getByRole("region", { name: /Income breakdown for week of/ }).first()).toBeVisible();

  await page.screenshot({ path: testInfo.outputPath("income-reality.png"), fullPage: true });
  expect(consoleErrors).toEqual([]);
});

test("saving assumptions replays every queued mutation to the Foundation API", async ({ page }) => {
  const writes: string[] = [];
  page.on("request", (request) => {
    if (
      ["PATCH", "PUT", "DELETE"].includes(request.method()) &&
      request.url().includes("/api/v1/foundation/")
    ) {
      writes.push(`${request.method()} ${new URL(request.url()).pathname}`);
    }
  });

  await page.goto("http://localhost:5173/settings");
  await expect(page.getByRole("heading", { name: "Costs and emergency savings" })).toBeVisible();
  await page.getByRole("button", { name: "Save assumptions" }).click();

  await expect(page.getByRole("status")).toHaveText(
    "Saved on this device. It will sync automatically.",
  );
  await expect(page.getByRole("button", { name: "Online · 0 pending" })).toBeVisible({
    timeout: 10_000,
  });
  expect(writes).toContain("PATCH /api/v1/foundation/profile");
  expect(writes).toContain("PUT /api/v1/foundation/recurring-work-costs/10000000-0000-4000-8000-000000000001");
  expect(writes).toContain("PUT /api/v1/foundation/essential-expenses/20000000-0000-4000-8000-000000000001");
});

test("changing an existing entry's week creates a separate entry without a server error", async ({
  page,
  request,
}) => {
  const sourceWeek = "2030-01-07";
  const targetWeek = "2030-01-14";
  try {
    const created = await request.put(`http://localhost:5173/api/v1/foundation/weeks/${sourceWeek}`, {
      headers: { "Idempotency-Key": crypto.randomUUID() },
      data: {
        id: crypto.randomUUID(), expectedRevision: null, hadNoIncome: false,
        emergencySavingsCents: 120_000, status: "confirmed",
        earnings: [{ id: crypto.randomUUID(), platformCode: "grab", platformLabel: null, amountCents: 10_000 }],
        variableCosts: [], inputSnapshots: [],
      },
    });
    expect(created.ok()).toBeTruthy();
    await page.goto(`http://localhost:5173/entries/${sourceWeek}`);
    await page.getByLabel("Week starting").fill(targetWeek);
    await page.getByRole("button", { name: "Save week" }).click();

    await expect(page.getByText(`Week of ${targetWeek}`)).toBeVisible();
    await expect(page.getByRole("button", { name: "Online · 0 pending" })).toBeVisible({
      timeout: 10_000,
    });
    await page.goto("http://localhost:5173/income-reality");
    await expect(
      page.getByRole("region", { name: `Income breakdown for week of ${targetWeek}` }),
    ).toBeVisible();
  } finally {
    await request.delete(`http://localhost:5173/api/v1/foundation/weeks/${targetWeek}`);
    await request.delete(`http://localhost:5173/api/v1/foundation/weeks/${sourceWeek}`);
  }
});

test("the CPF estimator updates a week that has no recorded CPF cost", async ({ page, request }) => {
  const weekStart = "2030-02-04";
  const entryId = crypto.randomUUID();
  const earningsId = crypto.randomUUID();
  try {
    const created = await request.put(`http://localhost:5173/api/v1/foundation/weeks/${weekStart}`, {
      headers: { "Idempotency-Key": crypto.randomUUID() },
      data: {
        id: entryId,
        expectedRevision: null,
        hadNoIncome: false,
        emergencySavingsCents: 120_000,
        status: "confirmed",
        earnings: [
          {
            id: earningsId,
            platformCode: "grab",
            platformLabel: null,
            amountCents: 10_000,
          },
        ],
        variableCosts: [],
        inputSnapshots: [],
      },
    });
    expect(created.ok()).toBeTruthy();

    await page.goto("http://localhost:5173/income-reality");
    const week = page.getByRole("region", {
      name: `Income breakdown for week of ${weekStart}`,
    });
    await expect(week).not.toContainText("CPF / MediSave");

    const response = page.waitForResponse(
      (candidate) =>
        candidate.url().endsWith("/api/v1/income-reality/breakdown") &&
        candidate.request().method() === "POST",
    );
    await page.getByRole("checkbox", {
      name: "Estimate CPF/MediSave when no amount was recorded",
    }).check();
    await response;
    await expect(week).toContainText("CPF / MediSave");
    await expect(week).toContainText("-$8.00");
  } finally {
    await request.delete(`http://localhost:5173/api/v1/foundation/weeks/${weekStart}`);
  }
});
