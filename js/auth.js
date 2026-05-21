// Auth helpers
import { supabase } from "./supabase-client.js";

export async function getSession() {
  const { data } = await supabase.auth.getSession();
  return data.session;
}

export async function signIn(email, password) {
  return await supabase.auth.signInWithPassword({ email, password });
}

export async function signUp(email, password) {
  return await supabase.auth.signUp({ email, password });
}

export async function signOut() {
  return await supabase.auth.signOut();
}

export function onAuthChange(callback) {
  return supabase.auth.onAuthStateChange((event, session) => callback(event, session));
}
