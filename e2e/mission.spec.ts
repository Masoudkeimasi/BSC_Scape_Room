import { test, expect } from "@playwright/test";
import supplied from "../src/data/supplied.json" with { type: "json" };
import quiz from "../src/data/supplied-quiz.json" with { type: "json" };
import { demo } from "../src/data/demo";
const bank = { ...demo, ...supplied, theory: [...quiz, ...demo.theory] };
test("locked URLs, private APIs, progress refresh and responsive homepage", async ({
  page,
}) => {
  await page.goto("/");
  await expect(
    page.getByRole("heading", { name: /Seven vaults/ }),
  ).toBeVisible();
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
  await expect(
    page.getByRole("heading", { name: /Seven vaults/ }),
  ).toBeVisible();
  expect(
    await page.evaluate(
      () => document.documentElement.scrollWidth <= innerWidth,
    ),
  ).toBe(true);
});
test("complete seven vaults through boards, picture puzzle, assessment and PDF", async ({
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
    await expect(
      page.getByRole("link", { name: "ENTER NEXT ROOM" }),
    ).toBeVisible();
  }
  await page.getByRole("link", { name: "ENTER NEXT ROOM" }).click();
  await expect(page).toHaveURL(/room\/6/);
  await expect(
    page.getByRole("heading", { name: "Strategy Map Vault", exact: true }),
  ).toBeVisible();
  await page
    .getByRole("button", { name: "Begin Strategy Map Puzzle", exact: true })
    .click();
  await expect(page.locator(".puzzle-piece")).toHaveCount(16);
  // Piece identifiers are internal test hooks; students solve using the image fragments.
  let order = await page
    .locator(".puzzle-piece")
    .evaluateAll((els) =>
      els.map((el) => Number(el.getAttribute("data-tile"))),
    );
  await page.screenshot({
    path: "/tmp/strategy-puzzle-desktop.png",
    fullPage: true,
  });
  await page.setViewportSize({ width: 390, height: 844 });
  await page.screenshot({
    path: "/tmp/strategy-puzzle-mobile.png",
    fullPage: true,
  });
  expect(
    await page.evaluate(
      () => document.documentElement.scrollWidth <= innerWidth,
    ),
  ).toBe(true);
  await page.setViewportSize({ width: 1280, height: 720 });
  const first = order[0];
  await page.getByTestId("puzzle-slot-0").focus();
  await page.getByTestId("puzzle-slot-0").press("Enter");
  await page.getByTestId("puzzle-slot-1").focus();
  await page.getByTestId("puzzle-slot-1").press("Enter");
  [order[0], order[1]] = [order[1], order[0]];
  await page.reload();
  await expect(page.getByTestId("puzzle-slot-1")).toHaveAttribute(
    "data-tile",
    String(first),
  );
  const dragged = order[0];
  const handle = page.getByTestId("puzzle-slot-0");
  await handle.scrollIntoViewIfNeeded();
  const source = await handle.boundingBox();
  const target = await page.getByTestId("puzzle-slot-1").boundingBox();
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
  await expect(handle).toHaveCSS("z-index", "10");
  await page.mouse.move(
    target!.x + target!.width / 2,
    target!.y + target!.height / 2,
    { steps: 12 },
  );
  await page.mouse.up();
  [order[0], order[1]] = [order[1], order[0]];
  await expect(page.getByTestId("puzzle-slot-1")).toHaveAttribute(
    "data-tile",
    String(dragged),
  );
  const keyboardTile = order[0];
  await page.getByTestId("puzzle-slot-0").focus();
  await page.getByTestId("puzzle-slot-0").press("Space");
  await expect(page.getByTestId("puzzle-slot-0")).toHaveCSS("z-index", "10");
  for (let step = 0; step < 8; step++)
    await page.getByTestId("puzzle-slot-0").press("ArrowRight");
  await page.getByTestId("puzzle-slot-0").press("Space");
  [order[0], order[1]] = [order[1], order[0]];
  await expect(page.getByTestId("puzzle-slot-1")).toHaveAttribute(
    "data-tile",
    String(keyboardTile),
  );
  for (let i = 0; i < 16; i++) {
    const at = order.indexOf(i);
    if (at === i) continue;
    await page.getByTestId(`puzzle-slot-${i}`).click();
    await page.getByTestId(`puzzle-slot-${at}`).click();
    [order[i], order[at]] = [order[at], order[i]];
  }
  await page
    .getByRole("button", { name: "Check Strategy Map", exact: true })
    .click();
  await expect(page.locator(".completed-strategy-map")).toBeVisible();
  await expect(page.locator(".puzzle-piece")).toHaveCount(0);
  await page.getByRole("link", { name: "ENTER NEXT ROOM" }).click();
  await expect(page).toHaveURL(/room\/7/);
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
  await expect(page.locator(".completion-credit")).toHaveText(
    "Designed by Dr Masoud Keimasi for teaching purposes.",
  );
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

test("designer credits, distinct room palettes and readable panel contrast", async ({
  page,
}) => {
  await page.goto("/");
  await expect(page.locator(".opening-credit")).toHaveText(
    "Designed by Dr Masoud Keimasi for teaching purposes.",
  );
  await expect(page.locator(".footer-credit")).toContainText(
    "Dr Masoud Keimasi",
  );
  const accents = new Set<string>();
  const photographs = new Set<string>();
  for (let room = 1; room <= 7; room++) {
    await page.goto(`/room/${room}`);
    await expect(page.locator(".app-shell")).toHaveAttribute(
      "data-page",
      `room-${room}`,
    );
    await expect(page.locator(".panel").first()).toBeVisible();
    const sample = await page
      .locator(".panel")
      .first()
      .evaluate((el) => {
        const style = getComputedStyle(el);
        return {
          accent: getComputedStyle(document.querySelector(".app-shell")!)
            .getPropertyValue("--page-accent")
            .trim(),
          text: getComputedStyle(el.querySelector("p") ?? el).color,
          background: style.backgroundColor,
        };
      });
    accents.add(sample.accent);
    if (room <= 6) {
      const photo = await page.locator(".app-shell").evaluate(async (el) => {
        const css = getComputedStyle(el).getPropertyValue("--page-photo");
        const src = css.match(/url\(["']?([^"')]+)["']?\)/)?.[1];
        if (!src) throw new Error("Room photograph missing");
        const image = new Image();
        image.src = src;
        await image.decode();
        return { src, width: image.naturalWidth, height: image.naturalHeight };
      });
      photographs.add(photo.src);
      expect(photo.width).toBeGreaterThanOrEqual(500);
      expect(photo.height).toBeGreaterThanOrEqual(300);
    }
    const luminance = (color: string) => {
      const channels = color
        .match(/[\d.]+/g)!
        .slice(0, 3)
        .map(Number)
        .map((n) => {
          const v = n / 255;
          return v <= 0.04045 ? v / 12.92 : ((v + 0.055) / 1.055) ** 2.4;
        });
      return channels[0] * 0.2126 + channels[1] * 0.7152 + channels[2] * 0.0722;
    };
    const [a, b] = [luminance(sample.text), luminance(sample.background)];
    expect(
      (Math.max(a, b) + 0.05) / (Math.min(a, b) + 0.05),
    ).toBeGreaterThanOrEqual(7);
  }
  expect(accents.size).toBe(7);
  expect(photographs.size).toBe(6);
  await page.setViewportSize({ width: 390, height: 844 });
  await page.goto("/");
  await expect(page.locator(".opening-credit")).toBeVisible();
  expect(
    await page.evaluate(
      () => document.documentElement.scrollWidth <= innerWidth,
    ),
  ).toBe(true);
});
