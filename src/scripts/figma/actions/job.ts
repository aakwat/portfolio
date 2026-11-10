import type { Cursor } from "../ui/cursor";

// Runs one collaborator's work, then lets them leave straight away instead of waiting for the whole page.
export async function job(c: Cursor, work: () => Promise<void>): Promise<void> {
  try {
    await work();
  } finally {
    await c.leave();
  }
}
