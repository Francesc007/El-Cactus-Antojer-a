import { loadEnvLocal } from "./env";
import { removeLoyaltyDemo } from "./remove";
import { seedLoyaltyDemo } from "./seed";

loadEnvLocal();

const command = process.argv[2];

async function main() {
  if (command === "seed") {
    await seedLoyaltyDemo();
    return;
  }
  if (command === "remove") {
    await removeLoyaltyDemo();
    return;
  }
  if (command === "settings") {
    const { applyDemoLoyaltySettingsOnly } = await import("./seed");
    await applyDemoLoyaltySettingsOnly();
    return;
  }
  console.error("Uso: npx tsx demo/loyalty-panel/run.ts seed|remove|settings");
  process.exit(1);
}

main().catch((error: unknown) => {
  const message = error instanceof Error ? error.message : String(error);
  console.error(message);
  process.exit(1);
});
