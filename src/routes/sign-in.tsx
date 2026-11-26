import { createFileRoute } from "@tanstack/react-router";
import { AuthPage } from "../components/auth-page";

export const Route = createFileRoute("/sign-in")({
  head: () => ({
    meta: [{ name: "robots", content: "noindex, nofollow" }],
  }),
  component: SignInPage,
});

function SignInPage() {
  return <AuthPage mode="sign-in" />;
}
