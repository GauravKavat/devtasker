import { getSupabaseClient } from "./client-singleton";

export function createClient() {
  return getSupabaseClient();
}
