/**
 * One-time script: tag existing Telnyx numbers with their owner's user_id.
 *
 * Run once after deploying the ownership fix:
 *   npx tsx scripts/backfill-number-tags.ts
 *
 * Reads purchased_numbers from DB, PATCHes each number in Telnyx with
 * tags: ["user:<user_id>"] so the sync route can recover them correctly.
 */

import { createClient } from '@supabase/supabase-js';

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.SUPABASE_SERVICE_ROLE_KEY!,
);

async function backfill() {
  const { data: numbers, error } = await supabase
    .from('purchased_numbers')
    .select('id, phone_number, telnyx_number_id, user_id')
    .not('telnyx_number_id', 'is', null);

  if (error) {
    console.error('Failed to fetch numbers from DB:', error);
    process.exit(1);
  }

  console.log(`Found ${numbers?.length ?? 0} numbers to tag`);

  let ok = 0;
  let failed = 0;

  for (const num of numbers ?? []) {
    const res = await fetch(
      `https://api.telnyx.com/v2/phone_numbers/${num.telnyx_number_id}`,
      {
        method: 'PATCH',
        headers: {
          Authorization: `Bearer ${process.env.TELNYX_API_KEY}`,
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          tags: [`user:${num.user_id}`],
        }),
      },
    );

    if (res.ok) {
      console.log(`✓ Tagged ${num.phone_number} → user:${num.user_id}`);
      ok++;
    } else {
      const body = await res.text();
      console.error(`✗ Failed ${num.phone_number}:`, res.status, body);
      failed++;
    }

    // Brief pause to avoid rate limiting
    await new Promise((r) => setTimeout(r, 200));
  }

  console.log(`\nDone. Tagged: ${ok}, Failed: ${failed}`);
}

backfill().catch(console.error);
