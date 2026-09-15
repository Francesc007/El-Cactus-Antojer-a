import { test, expect } from "@playwright/test";

test("la landing pública carga", async ({ page }) => {
  await page.goto("/");
  await expect(page.getByRole("heading", { name: /El Cactus/i })).toBeVisible();
});

test("el formulario de reserva está disponible", async ({ page }) => {
  await page.goto("/reservar");
  await expect(page.getByRole("heading", { name: /Completa tu reserva/i })).toBeVisible();
});

test("el panel exige autenticación", async ({ page }) => {
  await page.goto("/panel");
  await expect(page).toHaveURL(/login/);
});
