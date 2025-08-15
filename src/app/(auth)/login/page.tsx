import { BetterAuthLoginForm } from "@/components/login/better-auth-login-form";

export default function Page() {
  return <BetterAuthLoginForm />;
}

export async function generateMetadata() {
  return {
    title: "Login - Qtiful Movie",
    description: "Login page for the application",
  };
}
