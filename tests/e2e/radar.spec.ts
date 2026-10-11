import { test, expect } from "@playwright/test";
for (const [label, count] of [
  ["Fácil", 4],
  ["Normal", 9],
  ["Difícil", 16],
] as const) {
  test(
    "Radar " + label + " gera uma grade completa e encerra por tempo",
    async ({ page }) => {
      await page.goto("/#/setup/radar");
      await page
        .getByRole("button", { name: label + " " + count + " bandeiras" })
        .click();
      await page.getByLabel("Segundos por rodada").fill("3");
      await page
        .getByRole("button", { name: "Começar partida", exact: true })
        .click();
      await expect(page.locator(".flag-option")).toHaveCount(count);
      await expect(page.locator(".feedback.bad")).toBeVisible({
        timeout: 7000,
      });
      await page.getByRole("button", { name: "Próxima", exact: true }).click();
      await expect(page.locator(".question-status strong")).toHaveText("2");
    },
  );
}
test("Radar Memória exibe, oculta e aceita seleção", async ({ page }) => {
  await page.goto("/#/setup/radar");
  await page.getByLabel("Evento", { exact: true }).selectOption("memory");
  await page
    .getByRole("button", { name: "Começar partida", exact: true })
    .click();
  await expect(page.locator(".flag-option img")).toHaveCount(9);
  await expect(page.locator(".flag-hidden")).toHaveCount(9, { timeout: 5000 });
  await page.locator(".flag-option").first().click();
  await expect(page.locator(".feedback")).toBeVisible();
  await expect(page.locator(".flag-option img")).toHaveCount(9);
});
test("Radar Caça rápida compartilha o relógio entre cinco buscas", async ({
  page,
}) => {
  await page.goto("/#/setup/radar");
  await page.getByLabel("Evento", { exact: true }).selectOption("hunt");
  await page.getByLabel("Segundos por rodada").fill("3");
  await page
    .getByRole("button", { name: "Começar partida", exact: true })
    .click();
  const time = Number(
    (await page.locator(".countdown").textContent())!.replace("s", "").trim(),
  );
  expect(time).toBeGreaterThan(12);
  await page.locator(".flag-option").first().click();
  await page.getByRole("button", { name: "Próxima", exact: true }).click();
  const time2 = Number(
    (await page.locator(".countdown").textContent())!.replace("s", "").trim(),
  );
  expect(time2).toBeLessThanOrEqual(time);
});
