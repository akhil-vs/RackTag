import { LoginForm } from "./login-form";

const ERROR_MESSAGES: Record<string, string> = {
  sso_not_configured: "SSO is not configured on this deployment.",
  sso_state: "SSO state mismatch. Try again.",
  sso_failed: "SSO sign-in failed.",
  sso_plan: "Your organization plan does not include SSO.",
};

export default async function LoginPage({
  searchParams,
}: {
  searchParams: Promise<{ next?: string; error?: string }>;
}) {
  const params = await searchParams;
  const next = params.next ?? "/";
  const initialError = params.error ? ERROR_MESSAGES[params.error] ?? "Sign-in failed." : undefined;

  return (
    <main className="admin-shell">
      <LoginForm next={next} initialError={initialError} />
    </main>
  );
}
