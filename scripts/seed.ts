import 'dotenv/config';
import { ensureStorageReady, getStorageEngine } from '../server/storage.ts';
import { SEED_LEARNING_PATHS, SEED_TOOLS_V13 } from '../server/seed/taxonomy.ts';
import { SEED_LEARNING_RESOURCES } from '../server/seed/resources.ts';
import { SEED_PRACTICE_DRILLS } from '../server/seed/practiceDrills.ts';

async function main() {
  await ensureStorageReady();
  console.log(
    `Cadence seed complete (${getStorageEngine()}): ${SEED_TOOLS_V13.length} tools, ${SEED_LEARNING_PATHS.length} learning paths, ${SEED_LEARNING_RESOURCES.length} learning resources, and ${SEED_PRACTICE_DRILLS.length} practice drills upserted.`
  );
  process.exit(0);
}

main().catch((err) => {
  console.error('Seed failed:', err);
  process.exit(1);
});

