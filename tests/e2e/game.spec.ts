import { test, expect, type Page } from "@playwright/test";
import countries from "../../src/data/countries.json" with { type: "json" };
const names = Object.fromEntries(countries.map((c) => [c.id, c.name]));
async function ready(page: Page, path = "/") {
  await page.goto(path);
  await expect(page.locator(".loading")).toHaveCount(0);
}
async function resume(page: Page) {
  const dialog = page.getByRole("dialog");
  if (
    (await dialog.count()) &&
    (await dialog
      .getByRole("heading", { name: "Uma pausa para respirar" })
      .count())
  )
    await dialog
      .getByRole("button", { name: "Continuar", exact: true })
      .click();
}
async function currentId(page: Page) {
  return (await page.locator(".hero-flag img").getAttribute("src"))!
    .split("/")
    .at(-1)!
    .replace(".svg", "");
}
async function next(page: Page) {
  await page.getByRole("button", { name: /^(Próxima|Ver resultado)$/ }).click();
}
test("início, coleção completa e telas sem erros de execução", async ({
  page,
}) => {
  const errors: string[] = [];
  page.on("pageerror", (e) => errors.push(e.message));
  await ready(page);
  await expect(
    page.getByRole("heading", { name: /O mundo é grande/ }),
  ).toBeVisible();
  await page.screenshot({
    path: "test-results/geo-desktop.png",
    fullPage: true,
  });
  for (const path of [
    "collection",
    "progress",
    "achievements",
    "settings",
    "help",
  ]) {
    await ready(page, "/#/" + path);
    await expect(page.locator("main h1")).toBeVisible();
  }
  await ready(page, "/#/collection");
  await expect(page.locator(".country-card")).toHaveCount(196);
  await page.getByRole("textbox", { name: "Buscar país" }).fill("nepal");
  await expect(page.locator(".country-card")).toHaveCount(1);
  await page.locator(".country-card").click();
  await expect(page.getByRole("dialog")).toBeVisible();
  await page.getByRole("button", { name: "Fechar", exact: true }).click();
  expect(errors).toEqual([]);
});
test("Normal: sessão, erro, revisão até zerar e persistência", async ({
  page,
}) => {
  await ready(page, "/#/setup/normal");
  await page.getByRole("button", { name: "10 bandeiras", exact: true }).click();
  await page
    .getByRole("button", { name: "Começar partida", exact: true })
    .click();
  await expect(page.getByLabel("Nome do país")).toBeVisible();
  for (let i = 0; i < 10; i++) {
    if (i === 0)
      await page.getByRole("button", { name: "Revelar resposta" }).click();
    else {
      await page.getByLabel("Nome do país").fill(names[await currentId(page)]);
      await page
        .getByRole("button", { name: "Confirmar", exact: true })
        .click();
    }
    await next(page);
  }
  await expect(
    page.getByRole("button", { name: "Revisar 1 erro", exact: true }),
  ).toBeVisible();
  await page
    .getByRole("button", { name: "Revisar 1 erro", exact: true })
    .click();
  await page.getByLabel("Nome do país").fill(names[await currentId(page)]);
  await page.getByRole("button", { name: "Confirmar", exact: true }).click();
  await next(page);
  await expect(
    page.getByText("Nenhum erro para revisar.", { exact: true }),
  ).toBeVisible();
  await page.reload();
  await expect(
    page.getByText("Nenhum erro para revisar.", { exact: true }),
  ).toBeVisible();
  await ready(page, "/#/progress");
  await expect(page.locator(".history-row")).toHaveCount(2);
});
test("retoma uma sessão após recarregar sem repetir resposta", async ({
  page,
}) => {
  await ready(page, "/#/setup/normal");
  await page
    .getByRole("button", { name: "Começar partida", exact: true })
    .click();
  const name = names[await currentId(page)];
  await page.getByLabel("Nome do país").fill(name);
  await page.getByRole("button", { name: "Confirmar", exact: true }).click();
  await page.reload();
  await expect(
    page.getByText("Isso! Mais uma para o repertório."),
  ).toBeVisible();
  await next(page);
  await expect(page.locator(".question-status")).toContainText("2");
});
test("Normal nomes e bandeiras têm alternativas funcionais", async ({
  page,
}) => {
  await ready(page, "/#/setup/normal");
  await page
    .getByRole("button", { name: "Escolher um nome 4 alternativas" })
    .click();
  await page
    .getByRole("button", { name: "Começar partida", exact: true })
    .click();
  await expect(page.locator(".answer-option")).toHaveCount(4);
  const id = await currentId(page);
  await page.getByRole("button", { name: names[id], exact: true }).click();
  await expect(page.locator(".feedback.good")).toBeVisible();
  await page.getByRole("button", { name: "Sair da partida" }).click();
  await page
    .getByRole("dialog")
    .getByRole("button", { name: "Encerrar partida", exact: true })
    .click();
  await ready(page, "/#/setup/normal");
  await page
    .getByRole("button", { name: "Escolher a bandeira Nome → 4 bandeiras" })
    .click();
  await page
    .getByRole("button", { name: "Começar partida", exact: true })
    .click();
  await expect(page.locator(".answer-options .flag-wrap")).toHaveCount(4);
  await page.locator(".answer-option").first().click();
  await expect(page.locator(".feedback")).toBeVisible();
});
test("Radar especialista, resposta e pausa", async ({ page }) => {
  await ready(page, "/#/setup/radar");
  await page.getByRole("button", { name: "Especialista 25 bandeiras" }).click();
  await page.getByLabel("Segundos por rodada").fill("60");
  await page
    .getByRole("button", { name: "Começar partida", exact: true })
    .click();
  await expect(page.locator(".flag-option")).toHaveCount(25);
  const country = await page.locator(".radar-heading h1").textContent();
  const id = countries.find((c) => c.name === country)!.id;
  await page.locator('.flag-option:has(img[src$="/' + id + '.svg"])').click();
  await expect(page.locator(".feedback.good")).toBeVisible();
  await next(page);
  await page.getByRole("button", { name: "Pausar", exact: true }).click();
  const time = await page.locator(".countdown").textContent();
  await page.waitForTimeout(1100);
  expect(await page.locator(".countdown").textContent()).toBe(time);
  await resume(page);
  await expect(page.getByRole("dialog")).toHaveCount(0);
});
test("Avalanche: digitação, poder, pausa e histórico", async ({ page }) => {
  await ready(page, "/#/setup/avalanche");
  await page
    .getByRole("button", { name: "Começar partida", exact: true })
    .click();
  await expect(page.locator(".falling-flag img").first()).toBeVisible();
  const src = (await page
    .locator(".falling-flag img")
    .first()
    .getAttribute("src"))!;
  const id = src.split("/").at(-1)!.replace(".svg", "");
  await page.getByLabel("Nome de um país na tela").fill(names[id]);
  await page.getByRole("button", { name: "Confirmar", exact: true }).click();
  await expect(page.locator(".combo-badge")).toContainText("×1");
  await page.getByRole("button", { name: /Congelar, 1 disponível/ }).click();
  await expect(page.locator(".falling-field")).toHaveClass(/frozen/);
  await page.getByRole("button", { name: "Pausar", exact: true }).click();
  await expect(page.getByRole("dialog")).toBeVisible();
  await page.reload();
  await expect(page.getByRole("dialog")).toBeVisible();
  await resume(page);
  await page.getByRole("button", { name: "Sair da partida" }).click();
  await page
    .getByRole("dialog")
    .getByRole("button", { name: "Encerrar partida", exact: true })
    .click();
  await expect(
    page.getByRole("heading", { name: "Uma pausa na jornada." }),
  ).toBeVisible();
});
test("configurações persistem e backup é exportável/importável", async ({
  page,
}) => {
  await ready(page, "/#/settings");
  await page.getByLabel("Tema", { exact: true }).selectOption("dark");
  await page.getByLabel("Luz e sombra nas bandeiras").uncheck();
  await page.reload();
  await expect(page.locator("html")).toHaveAttribute("data-theme", "dark");
  await expect(page.getByLabel("Luz e sombra nas bandeiras")).not.toBeChecked();
  const download = page.waitForEvent("download");
  await page.getByRole("button", { name: "Exportar backup" }).click();
  const file = await download;
  const path = await file.path();
  await page.locator("input[type=file]").setInputFiles(path!);
  await expect(
    page.getByRole("heading", { name: "Restaurar este backup?" }),
  ).toBeVisible();
  await page
    .getByRole("button", { name: "Restaurar backup", exact: true })
    .click();
  await expect(page.getByRole("status")).toContainText("Backup restaurado");
});
test("mobile: layout não transborda, coleção e menu acessíveis", async ({
  page,
}) => {
  await page.setViewportSize({ width: 390, height: 844 });
  await ready(page);
  expect(
    await page.evaluate(
      () => document.documentElement.scrollWidth <= innerWidth,
    ),
  ).toBe(true);
  await page.screenshot({
    path: "test-results/geo-mobile.png",
    fullPage: true,
  });
  await page.getByRole("button", { name: "Abrir menu" }).click();
  await page.getByRole("link", { name: "Bandeiras", exact: true }).click();
  await expect(page.locator(".country-card")).toHaveCount(196);
  expect(
    await page.evaluate(
      () => document.documentElement.scrollWidth <= innerWidth,
    ),
  ).toBe(true);
  await ready(page, "/#/setup/avalanche");
  await page
    .getByRole("button", { name: "Começar partida", exact: true })
    .click();
  await expect(page.getByLabel("Nome de um país na tela")).toBeVisible();
  await page.screenshot({
    path: "test-results/geo-avalanche-mobile.png",
    fullPage: true,
  });
  expect(
    await page.evaluate(
      () => document.documentElement.scrollWidth <= innerWidth,
    ),
  ).toBe(true);
});
