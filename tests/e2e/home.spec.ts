import { expect, test } from "@playwright/test";

test("loads the first-screen transfer experience", async ({ page }) => {
  await page.goto("/");
  await expect(page.getByRole("heading", { name: "Share anything. Privately." })).toBeVisible();
  await expect(page.getByRole("button", { name: "Send files" })).toBeVisible();
  await expect(page.getByLabel("Room code")).toBeVisible();
});
