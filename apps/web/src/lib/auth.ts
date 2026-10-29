
import { supabase } from "./supabase";

export async function signIn(email: string, password: string) {
  return supabase.auth.signInWithPassword({
    email,
    password,
  });
}

export async function signUp(
  fullName: string,
  email: string,
  password: string
) {
  return supabase.auth.signUp({
    email,
    password,
    options: {
      data: {
        full_name: fullName,
      },
    },
  });
}

export async function signOut() {
  return supabase.auth.signOut();
}

export async function getCurrentUser() {
  return supabase.auth.getUser();
}


export type StaffRole =
  | "admin"
  | "midwife"
  | "nurse"
  | "receptionist";

export async function verifyStaffAccess() {
  const { data, error } = await supabase.auth.getSession();

  if (error || !data.session) {
    throw new Error("Authentication required.");
  }

  const apiUrl =
    import.meta.env.VITE_API_URL || "http://localhost:5000";

  const response = await fetch(
    `${apiUrl}/api/v1/staff/dashboard`,
    {
      headers: {
        Authorization: `Bearer ${data.session.access_token}`,
      },
    }
  );

  if (response.status === 403) {
    throw new Error(
      "This portal is restricted to authorized GYNECAIRE staff."
    );
  }

  if (!response.ok) {
    throw new Error(
      response.status === 401
        ? "Your session has expired. Please sign in again."
        : "Unable to verify staff access."
    );
  }

  return response.json();
}
