/**
 * Auth API stubs
 *
 * Phase 1: All auth is local (localStorage mock).
 * When ready to go live, replace each function body with
 * a real fetch() to the FastAPI backend.
 *
 * Email verification via Resend is STUBBED:
 *   - sendVerificationEmail() / sendPasswordResetEmail() are wired
 *   - They are never called in the current user flow
 *   - Set NEXT_PUBLIC_VERIFY_EMAIL=true to activate the gate
 *
 * Password requirements (NIST 800-63b):
 *   - Minimum 15 chars, maximum 64+, allow spaces and paste
 *   - No arbitrary complexity rules
 *   - Block common/breached passwords (checked client-side via list)
 *
 * NEVER store plain-text passwords. This mock stores them only
 * in localStorage for demo purposes; real auth uses bcrypt on the server.
 */

// ---- Types -------------------------------------------------

export type User = {
  id: string;
  email: string;
  fullName: string;
  createdAt: string;
  emailVerified: boolean;
};

export type Session = {
  user: User;
  accessToken: string;   // TODO: real JWT from FastAPI
  expiresAt: number;     // Unix ms
};

export type AuthError =
  | "invalid_credentials"
  | "email_not_found"
  | "weak_password"
  | "server_error";

// ---- Storage keys ------------------------------------------

const SESSION_KEY  = "rv:session:v1";
const ACCOUNTS_KEY = "rv:accounts:v1";

type AccountStore = Record<
  string,          // normalized email
  { password: string; user: User }
>;

// ---- Local helpers -----------------------------------------

function readSession(): Session | null {
  if (typeof window === "undefined") return null;
  try {
    const raw = localStorage.getItem(SESSION_KEY);
    if (!raw) return null;
    const session = JSON.parse(raw) as Session;
    if (Date.now() > session.expiresAt) {
      localStorage.removeItem(SESSION_KEY);
      return null;
    }
    return session;
  } catch {
    return null;
  }
}

function writeSession(session: Session): void {
  if (typeof window === "undefined") return;
  localStorage.setItem(SESSION_KEY, JSON.stringify(session));
}

function clearSession(): void {
  if (typeof window === "undefined") return;
  localStorage.removeItem(SESSION_KEY);
}

function readAccounts(): AccountStore {
  if (typeof window === "undefined") return {};
  try {
    const raw = localStorage.getItem(ACCOUNTS_KEY);
    return raw ? (JSON.parse(raw) as AccountStore) : {};
  } catch {
    return {};
  }
}

function writeAccounts(store: AccountStore): void {
  if (typeof window === "undefined") return;
  localStorage.setItem(ACCOUNTS_KEY, JSON.stringify(store));
}

function makeSession(user: User): Session {
  return {
    user,
    accessToken: `mock-token-${user.id}-${Date.now()}`,
    expiresAt: Date.now() + 1000 * 60 * 60 * 24 * 30, // 30 days
  };
}

function normalizeEmail(email: string): string {
  return email.toLowerCase().trim();
}

/** Fake async delay so the UI can show loading states. */
function delay(ms: number): Promise<void> {
  return new Promise((r) => setTimeout(r, ms));
}

// ---- Password validation -----------------------------------

const COMMON_PASSWORDS = new Set([
  "password12345678",
  "123456789012345",
  "qwertyuiopasdfg",
  "letmein12345678",
  "welcome12345678",
  "monkey123456789",
  "dragon123456789",
  "master123456789",
]);

export type PasswordError =
  | "too_short"
  | "too_long"
  | "common"
  | null;

export function validatePassword(password: string): PasswordError {
  if (password.length < 15) return "too_short";
  if (password.length > 512) return "too_long";
  if (COMMON_PASSWORDS.has(password.toLowerCase())) return "common";
  return null;
}

export function passwordErrorMessage(err: PasswordError): string {
  switch (err) {
    case "too_short":
      return "Password must be at least 15 characters.";
    case "too_long":
      return "Password is too long (max 512 characters).";
    case "common":
      return "That password is too common. Please choose something less guessable.";
    default:
      return "";
  }
}

// ---- Public API (swap each body for real fetch) ------------

/** Returns the current session from storage, or null. */
export function getSession(): Session | null {
  return readSession();
}

/**
 * Create a new account.
 * TODO: replace body with POST /api/v1/auth/register
 *       Response triggers Resend verification email (not active yet).
 */
export async function signUp(
  email: string,
  password: string,
  fullName: string,
): Promise<Session> {
  await delay(650);

  const accounts = readAccounts();
  const key = normalizeEmail(email);

  // Security: never reveal whether email already exists.
  // For demo, if exists we reuse (real auth would return a generic success
  // and send a "you already have an account" email).
  if (!accounts[key]) {
    const user: User = {
      id: `usr_${Math.random().toString(36).slice(2, 11)}`,
      email: key,
      fullName: fullName.trim() || key.split("@")[0],
      createdAt: new Date().toISOString(),
      emailVerified: true, // Skip verification gate until Resend is activated
    };
    accounts[key] = { password, user };
    writeAccounts(accounts);
  }

  const session = makeSession(accounts[key].user);
  writeSession(session);
  return session;
}

/**
 * Sign in with email + password.
 * TODO: replace body with POST /api/v1/auth/login → returns JWT
 */
export async function signIn(
  email: string,
  _password: string,
): Promise<Session> {
  await delay(600);

  const accounts = readAccounts();
  const key = normalizeEmail(email);

  // Demo: auto-create account on first sign-in (remove when real auth added)
  if (!accounts[key]) {
    const user: User = {
      id: `usr_${Math.random().toString(36).slice(2, 11)}`,
      email: key,
      fullName: key.split("@")[0],
      createdAt: new Date().toISOString(),
      emailVerified: true,
    };
    accounts[key] = { password: _password, user };
    writeAccounts(accounts);
  }

  const session = makeSession(accounts[key].user);
  writeSession(session);
  return session;
}

/**
 * Sign out and clear the local session.
 * TODO: also POST /api/v1/auth/logout to invalidate server-side token.
 */
export async function signOut(): Promise<void> {
  await delay(200);
  clearSession();
}

/**
 * Request a password-reset email via Resend.
 * STUB: never reveals whether email exists (security rule).
 * TODO: POST /api/v1/auth/forgot-password → Resend sends link.
 */
export async function requestPasswordReset(_email: string): Promise<void> {
  await delay(700);
  // Silently succeed. In production: Resend sends a link with a signed token.
}

/**
 * Complete a password reset using the token from the email link.
 * TODO: POST /api/v1/auth/reset-password { token, new_password }
 */
export async function resetPassword(
  _token: string,
  _newPassword: string,
): Promise<void> {
  await delay(700);
}

/**
 * Verify email address using the token from the verification email.
 * STUB: not called in the current user flow.
 * TODO: POST /api/v1/auth/verify-email { token } → Resend flow.
 * Activate by setting NEXT_PUBLIC_VERIFY_EMAIL=true.
 */
export async function verifyEmail(_token: string): Promise<void> {
  await delay(500);
}

/**
 * Update the current user's profile.
 * TODO: PATCH /api/v1/users/me
 */
export async function updateProfile(
  updates: Partial<Pick<User, "fullName" | "email">>,
): Promise<User> {
  await delay(600);

  const session = readSession();
  if (!session) throw new Error("Not signed in");

  const updated: User = { ...session.user, ...updates };
  const newSession: Session = { ...session, user: updated };
  writeSession(newSession);

  // Also update the accounts store
  const accounts = readAccounts();
  const key = normalizeEmail(session.user.email);
  if (accounts[key]) {
    accounts[key].user = updated;
    writeAccounts(accounts);
  }

  return updated;
}

/**
 * Delete the current account permanently.
 * TODO: DELETE /api/v1/users/me
 */
export async function deleteAccount(): Promise<void> {
  await delay(700);
  const session = readSession();
  if (!session) return;

  const accounts = readAccounts();
  const key = normalizeEmail(session.user.email);
  delete accounts[key];
  writeAccounts(accounts);
  clearSession();
}
