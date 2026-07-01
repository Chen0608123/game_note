import { supabase } from "./supabase-config.js";

export async function getCurrentUser() {
  const { data: sessionData, error: sessionError } = await supabase.auth.getSession();

  if (sessionError) {
    throw sessionError;
  }

  if (!sessionData.session) {
    return null;
  }

  const { data, error } = await supabase.auth.getUser();

  if (error) {
    await supabase.auth.signOut();
    return null;
  }

  return data.user || null;
}

export function getLoginUrl() {
  const next = `${window.location.pathname}${window.location.search}`;
  return `./login.html?next=${encodeURIComponent(next)}`;
}

export async function requireUser() {
  const user = await getCurrentUser();

  if (!user) {
    window.location.href = getLoginUrl();
    return null;
  }

  return user;
}

export async function signInWithEmail(email, password) {
  const { data, error } = await supabase.auth.signInWithPassword({
    email,
    password,
  });

  if (error) {
    throw error;
  }

  return data.user;
}

export async function signUpWithEmail(email, password) {
  const { data, error } = await supabase.auth.signUp({
    email,
    password,
  });

  if (error) {
    throw error;
  }

  return data;
}

export async function signOut() {
  const { error } = await supabase.auth.signOut({ scope: "local" });

  if (error && error.name !== "AuthSessionMissingError") {
    throw error;
  }
}
