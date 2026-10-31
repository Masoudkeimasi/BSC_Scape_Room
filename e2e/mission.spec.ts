import { test, expect } from "@playwright/test";
import supplied from "../src/data/supplied.json" with { type: "json" };
import quiz from "../src/data/supplied-quiz.json" with { type: "json" };
import { demo } from "../src/data/demo";
const bank = { ...demo, ...supplied, theory: [...quiz, ...demo.theory] };
test("locked URLs, private APIs, progress refresh and responsive homepage", async ({
  page,
}) => {
  await page.goto("/");
  await expect(page.getByRole("heading", { name: /Six rooms/ })).toBeVisible();
  await expect(
    page.getByRole("button", { name: "Start Mission", exact: true }),
  ).toBeEnabled();
  expect((await page.request.get("/api/instructor")).status()).toBe(403);
  expect((await page.request.get("/api/certificate")).status()).toBe(403);
  const state = await (await page.request.get("/api/game")).json();
  expect(JSON.stringify(state.content)).not.toContain("primaryCategory");
  expect(JSON.stringify(state.content)).not.toContain("answers");
  expect(state.content.options).toHaveLength(0);
  await page.goto("/room/5");
  await expect(
    page.getByRole("heading", { name: "Vault access restricted." }),
  ).toBeVisible();
  await page.setViewportSize({ width: 390, height: 844 });
  await page.goto("/");
  await expect(page.getByRole("heading", { name: /Six rooms/ })).toBeVisible();
  expect(
    await page.evaluate(
      () => document.documentElement.scrollWidth <= innerWidth,
    ),
  ).toBe(true);
});
test("complete six rooms through progressive boards, map, assessment and PDF", async ({
  page,
}) => {
  test.setTimeout(180000);
  await page.goto("/");
  await page
    .getByRole("button", { name: "Start Mission", exact: true })
    .click();
  await expect(page).toHaveURL(/room\/1/);
  for (const text of [
    "Make everyday nourishment",
    "Become the most trusted",
    "Combine consumer insight",
  ])
    await page.locator(".vision-card").filter({ hasText: text }).click();
  await page
    .getByRole("button", { name: "Confirm strategic direction" })
    .click();
  await expect(
    page.getByRole("link", { name: "ENTER NEXT ROOM" }),
  ).toBeVisible();
  await page.reload();
  await expect(
    page.getByRole("link", { name: "ENTER NEXT ROOM" }),
  ).toBeVisible();
  for (let room = 2; room <= 5; room++) {
    await page.getByRole("link", { name: "ENTER NEXT ROOM" }).click();
    await expect(page).toHaveURL(new RegExp(`room/${room}`));
    const perspective = ["F", "C", "P", "L"][room - 2];
    // Deliberately complete chains out of canonical order.
    for (const n of [3, 1, 2]) {
      const chain = bank.chains.find((c) => c.id === `${perspective}${n}`)!;
      for (const [i, tab] of [
        "Objectives",
        "Measures",
        "Targets",
        "Initiatives",
      ].entries()) {
        await page.getByRole("tab", { name: new RegExp(`^${tab}`) }).click();
        await expect(page.locator(".option-select")).toHaveCount(8);
        const option = bank.options.find((o) => o.id === chain.options[i])!;
        await page
          .locator(".option-select")
          .filter({ hasText: option.text })
          .click();
      }
      if (room === 2 && n === 3) {
        await page.reload();
        await expect(page.locator(".active-row .drop-zone p")).toHaveCount(4);
      }
      const calc = bank.calculations.find((c) => c.chainId === chain.id);
      if (calc) {
        await page.locator(".calculation input").fill(String(calc.expected));
        await page
          .getByRole("button", { name: "Check Answer", exact: true })
          .click();
        await expect(
          page.getByText(new RegExp(`Confirmed: ${calc.expected}`)),
        ).toBeVisible();
      }
      const before = await page.locator(".locked-row").count();
      await page
        .getByRole("button", { name: "VALIDATE STRATEGIC CHAIN" })
        .click();
      await expect(page.locator(".locked-row")).toHaveCount(before + 1);
      if (n !== 2) {
        await page.getByRole("tab", { name: /^Objectives/ }).click();
        const used = bank.options.find((o) => o.id === chain.options[0])!;
        await expect(
          page.locator(".option-select").filter({ hasText: used.text }),
        ).toBeDisabled();
      }
    }
    if (room === 5) {
      for (const ch of bank.chains) {
        const text = bank.options.find((o) => o.id === ch.options[0])!.text;
        await page
          .getByRole("combobox", {
            name: `Perspective for ${text}`,
            exact: true,
          })
          .selectOption(ch.perspective);
      }
      await page.reload();
      await expect(
        page.getByRole("combobox", {
          name: `Perspective for ${bank.options.find((o) => o.id === "F-O1")!.text}`,
          exact: true,
        }),
      ).toHaveValue("F");
      for (const link of bank.causalLinks) {
        const [source, target] = link.split(">");
        await page
          .getByLabel("From objective", { exact: true })
          .selectOption(source);
        await page
          .getByLabel("To objective", { exact: true })
          .selectOption(target);
        await page
          .getByRole("button", { name: "Add causal link", exact: true })
          .click();
      }
      await page
        .getByLabel("Explain one causal hypothesis")
        .fill(
          "Digital learning can support process reliability which improves customer value; measured evidence should test this strategic hypothesis.",
        );
      await page
        .getByRole("button", { name: "Validate Strategy Map", exact: true })
        .click();
    }
    await expect(
      page.getByRole("link", { name: "ENTER NEXT ROOM" }),
    ).toBeVisible();
  }
  await page.getByRole("link", { name: "ENTER NEXT ROOM" }).click();
  await page.getByRole("button", { name: "Begin Assessment" }).click();
  const state = await (await page.request.get("/api/game")).json();
  for (const [i, id] of state.progress.assessment.ids.entries()) {
    const q = bank.theory.find((q) => q.id === id)!;
    if (q.type === "blank")
      await page
        .getByLabel(`Answer question ${i + 1}`, { exact: true })
        .fill("  " + q.answers[0].toUpperCase() + "  ");
    else
      await page
        .locator(".question")
        .nth(i)
        .getByLabel(q.answers[0], { exact: true })
        .check();
  }
  await page.reload();
  await page.getByRole("button", { name: "Submit & unlock the exit" }).click();
  await expect(
    page.getByRole("heading", { name: "YOU ARE FREE!", exact: true }),
  ).toBeVisible();
  const pdf = await page.request.get("/api/certificate");
  expect(pdf.status()).toBe(200);
  expect(pdf.headers()["content-type"]).toContain("application/pdf");
  expect((await pdf.body()).subarray(0, 4).toString()).toBe("%PDF");
  await page.reload();
  await expect(
    page.getByRole("heading", { name: "YOU ARE FREE!", exact: true }),
  ).toBeVisible();
  expect(await page.locator(".option-select:not(:disabled)").count()).toBe(0);
});
test("annual review search and financial evidence tables", async ({ page }) => {
  await page.goto("/review");
  await page.getByLabel("Search annual review").fill("Income statement");
  await page.getByRole("button", { name: /Evidence table/ }).click();
  await expect(
    page.getByRole("cell", { name: "18,400", exact: true }),
  ).toBeVisible();
});
test("instructor authorisation, complete import validation and anonymised export", async ({
  page,
}) => {
  await page.goto("/instructor");
  await page
    .getByLabel("Instructor password", { exact: true })
    .fill("e2e-only-instructor-password");
  await page.getByRole("button", { name: "Sign in", exact: true }).click();
  await expect(
    page.getByRole("heading", { name: "Your complete teaching bank." }),
  ).toBeVisible();
  const exported = await (await page.request.get("/api/instructor")).json();
  expect(exported.content.options).toHaveLength(128);
  expect(
    exported.content.options.find((o: { id: string }) => o.id === "F-O1"),
  ).toMatchObject({
    correct: true,
    chainId: "F1",
    explanation: expect.stringContaining("Supplied 128-option matrix"),
  });
  const invalid = {
    ...exported.content,
    options: exported.content.options.slice(0, 100),
  };
  const response = await page.request.post("/api/instructor", {
    headers: { Origin: "http://localhost:3100" },
    data: { type: "import", content: invalid },
  });
  expect(response.status()).toBe(400);
  expect((await response.json()).error).toContain("128");
  const downloadPromise = page.waitForEvent("download");
  await page
    .getByRole("button", { name: "Anonymised CSV", exact: true })
    .click();
  const download = await downloadPromise;
  expect(download.suggestedFilename()).toBe(
    "persepolis-anonymised-results.csv",
  );
  const foreign = await page.request.post("/api/instructor", {
    headers: { Origin: "https://attacker.example" },
    data: { type: "reset", id: "anything" },
  });
  expect(foreign.status()).toBe(400);
  const missing = await page.request.post("/api/instructor", {
    data: { type: "reset", id: "anything" },
  });
  expect(missing.status()).toBe(400);
  expect((await missing.json()).error).toContain("Origin header required");
});

test("drag and drop rejects wrong component types without consuming mistakes", async ({
  page,
}) => {
  await page.goto("/");
  await expect(
    page.getByRole("button", { name: "Start Mission", exact: true }),
  ).toBeEnabled();
  const response = await page.request.post("/api/game", {
    headers: { Origin: "http://localhost:3100" },
    data: { type: "vision", room: 1, ids: ["v1", "v2", "v3"] },
  });
  expect(response.ok()).toBe(true);
  await page.goto("/room/2");
  await page.getByRole("tab", { name: /^Measures/ }).click();
  const handle = page.locator(".drag-handle").first();
  await handle.scrollIntoViewIfNeeded();
  const source = await handle.boundingBox();
  const wrong = await page
    .locator(".active-row .drop-zone")
    .nth(0)
    .boundingBox();
  await page.mouse.move(
    source!.x + source!.width / 2,
    source!.y + source!.height / 2,
  );
  await page.mouse.down();
  await page.mouse.move(
    source!.x + source!.width / 2 + 12,
    source!.y + source!.height / 2,
    { steps: 3 },
  );
  await expect(handle).toHaveAttribute("aria-pressed", "true");
  await page.mouse.move(
    wrong!.x + wrong!.width / 2,
    wrong!.y + wrong!.height / 2,
    { steps: 15 },
  );
  await page.mouse.up();
  await expect(
    page
      .getByRole("status")
      .filter({ hasText: "Each slot accepts its own component type" }),
  ).toBeVisible();
  await expect(page.getByText("MISTAKES 0/3", { exact: true })).toBeVisible();
  await expect(
    page.locator(".active-row .drop-zone").first().locator("p"),
  ).toHaveCount(0);
  await handle.scrollIntoViewIfNeeded();
  const nextSource = await handle.boundingBox();
  const matching = await page
    .locator(".active-row .drop-zone")
    .nth(1)
    .boundingBox();
  await page.mouse.move(
    nextSource!.x + nextSource!.width / 2,
    nextSource!.y + nextSource!.height / 2,
  );
  await page.mouse.down();
  await page.mouse.move(
    nextSource!.x + nextSource!.width / 2 + 12,
    nextSource!.y + nextSource!.height / 2,
    { steps: 3 },
  );
  await expect(handle).toHaveAttribute("aria-pressed", "true");
  await page.mouse.move(
    matching!.x + matching!.width / 2,
    matching!.y + matching!.height / 2,
    { steps: 15 },
  );
  await page.mouse.up();
  await expect(
    page.locator(".active-row .drop-zone").nth(1).locator("p"),
  ).toHaveCount(1);
  await expect(page.getByText("MISTAKES 0/3", { exact: true })).toBeVisible();
});

test("a saved mission from the previous bank offers an explicit anonymous restart", async ({
  page,
}) => {
  await page.goto("/");
  await expect(
    page.getByRole("button", { name: "Start Mission", exact: true }),
  ).toBeEnabled();
  const initial = await (await page.request.get("/api/game")).json();
  const { writeFile, mkdir } = await import("node:fs/promises");
  const path = await import("node:path");
  const directory = path.join(process.cwd(), ".data", "e2e");
  await mkdir(directory, { recursive: true });
  await writeFile(
    path.join(directory, `progress-${initial.progress.id}.json`),
    JSON.stringify({
      ...initial.progress,
      contentVersion: "old-144-option-bank",
    }),
  );
  await page.goto("/mission");
  await expect(
    page.getByRole("button", {
      name: "Start updated demo mission",
      exact: true,
    }),
  ).toBeVisible();
  await page
    .getByRole("button", { name: "Start updated demo mission", exact: true })
    .click();
  await expect(
    page.getByRole("heading", { name: "Your strategy, taking shape." }),
  ).toBeVisible();
  const updated = await (await page.request.get("/api/game")).json();
  expect(updated.progress.completed).toEqual([]);
  expect(updated.progress.contentVersion).toBe(initial.progress.contentVersion);
});
