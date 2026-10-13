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

test("el botón de reseña abre las tres redes", async ({ page }) => {
  await page.goto("/");
  await page.getByRole("button", { name: "Deja tu reseña" }).click();
  await expect(page.getByRole("heading", { name: "Deja tu reseña" })).toBeVisible();
  await expect(page.getByText("Google Maps")).toBeVisible();
  await expect(page.getByText("Facebook")).toBeVisible();
  await expect(page.getByText("Instagram")).toBeVisible();
});
