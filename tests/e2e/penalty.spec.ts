import { test, expect } from "@playwright/test";
import countries from "../../src/data/countries.json" with { type: "json" };
test("escolha rápida errada produz descida suave, visível e acumulável", async ({
  page,
}) => {
  await page.goto("/#/setup/avalanche");
  await page.getByLabel("Entrada", { exact: true }).selectOption("choice");
  await page.getByRole("button", { name: "Relaxado", exact: true }).click();
  await page
    .getByRole("button", { name: "Começar partida", exact: true })
    .click();
  await expect(page.locator(".falling-flag img").first()).toBeVisible();
  await page.getByRole("button", { name: /Congelar, 1 disponível/ }).click();
  const active = await page
    .locator(".falling-flag img")
    .evaluateAll((imgs) =>
      imgs.map((img) =>
        (img as HTMLImageElement).src.split("/").at(-1)!.replace(".svg", ""),
      ),
    );
  const goodNames = countries
    .filter((c) => active.includes(c.id))
    .map((c) => c.name);
  const wrong = page.locator(".quick-choices button").filter({ hasText: /./ });
  let wrongIndex = 0;
  for (let i = 0; i < (await wrong.count()); i++)
    if (!goodNames.includes((await wrong.nth(i).textContent())!)) {
      wrongIndex = i;
      break;
    }
  const y = () =>
    page
      .locator(".falling-flag")
      .first()
      .evaluate((el) => new DOMMatrix(getComputedStyle(el).transform).m42);
  const before = await y();
  await wrong.nth(wrongIndex).click();
  await expect(page.getByRole("status")).toContainText(
    "Todas as bandeiras descem",
  );
  await page.waitForTimeout(150);
  const middle = await y();
  await page.waitForTimeout(500);
  const after = await y();
  expect(middle).toBeGreaterThan(before);
  expect(after).toBeGreaterThan(middle);
  await wrong.nth(wrongIndex).click();
  await page.waitForTimeout(650);
  expect(await y()).toBeGreaterThan(after);
});
