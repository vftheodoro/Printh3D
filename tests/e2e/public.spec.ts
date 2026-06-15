import AxeBuilder from "@axe-core/playwright";
import { expect, test } from "@playwright/test";

test("home exposes the primary conversion journey without overflow", async ({
  page,
}) => {
  await page.goto("/");

  await expect(
    page.getByRole("heading", { level: 1 }),
  ).toBeVisible();
  await expect(
    page.getByRole("link", { name: /orçamento/i }).first(),
  ).toBeVisible();

  const overflow = await page.evaluate(
    () => document.documentElement.scrollWidth > window.innerWidth,
  );
  expect(overflow).toBe(false);

  const accessibility = await new AxeBuilder({ page })
    .disableRules(["color-contrast"])
    .analyze();
  expect(accessibility.violations).toEqual([]);
});

test("catalog filters and keeps state in the URL", async ({ page }) => {
  await page.goto("/produtos");
  const search = page.getByRole("searchbox", { name: /pesquisar/i });
  await search.fill("suporte");
  await expect(page).toHaveURL(/busca=suporte/);
});

test("budget produces a preliminary estimate", async ({ page }) => {
  await page.goto("/orcamento");
  await page.getByLabel(/largura/i).fill("12");
  await page.getByLabel(/altura/i).fill("8");
  await page.getByLabel(/profundidade/i).fill("4");

  await expect(page.getByText(/estimativa preliminar/i)).toBeVisible();
  await expect(
    page.getByRole("link", { name: /whatsapp/i }),
  ).toHaveAttribute("href", /wa\.me/);
});

test("admin login is isolated from the authenticated shell", async ({
  page,
}) => {
  await page.goto("/admin/login");
  await expect(page.getByRole("heading", { name: "Printh3D" })).toBeVisible();
  await expect(page.getByRole("navigation")).toHaveCount(0);
  await expect(page.getByLabel("E-mail")).toBeVisible();
  await expect(page.getByLabel("Senha")).toBeVisible();
});
