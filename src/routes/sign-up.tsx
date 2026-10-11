import { createFileRoute } from "@tanstack/react-router";
import { AuthPage } from "../components/auth-page";

export const Route = createFileRoute("/sign-up")({
  component: SignUpPage,
});

function SignUpPage() {
  return <AuthPage mode="sign-up" />;
}
