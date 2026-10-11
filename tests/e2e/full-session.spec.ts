import { test, expect } from "@playwright/test";
import countries from "../../src/data/countries.json" with { type: "json" };
const names = Object.fromEntries(countries.map((c) => [c.id, c.name]));
test("196 bandeiras por digitação: ultrapassa a questão 154 e termina", async ({
  page,
}) => {
  test.setTimeout(180000);
  const errors: string[] = [];
  page.on("pageerror", (e) => errors.push(e.message));
  await page.goto("/#/setup/normal");
  await page
    .getByRole("button", { name: "196 bandeiras", exact: true })
    .click();
  await page
    .getByRole("button", { name: "Começar partida", exact: true })
    .click();
  const seen = new Set<string>();
  for (let i = 0; i < 196; i++) {
    await expect(page.locator(".question-status strong").first()).toHaveText(
      String(i + 1),
    );
    const id = (await page.locator(".hero-flag img").getAttribute("src"))!
      .split("/")
      .at(-1)!
      .replace(".svg", "");
    seen.add(id);
    await page.getByLabel("Nome do país").fill(names[id]);
    // Include clock checkpoints and Enter-based play, rather than only quick clicks.
    if (i % 20 === 0) await page.waitForTimeout(970);
    await page.getByLabel("Nome do país").press("Enter");
    await expect(page.locator(".feedback")).toBeVisible();
    await page
      .getByRole("button", {
        name: i === 195 ? "Ver resultado" : "Próxima",
        exact: true,
      })
      .press("Enter");
  }
  await expect(
    page.getByRole("heading", { name: "Seu repertório acaba de crescer." }),
  ).toBeVisible();
  expect(seen.size).toBe(196);
  expect(errors).toEqual([]);
  await page.reload();
  await expect(
    page.getByText("Nenhum erro para revisar.", { exact: true }),
  ).toBeVisible();
});
