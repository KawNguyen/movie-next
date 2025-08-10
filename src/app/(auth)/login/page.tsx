import { LoginForm } from "@/components/login/login-form";

export default function Page() {
  return <LoginForm />;
}

export async function generateMetadata() {
  return {
    title: "Login - Qtiful Movie",
    description: "Login page for the application",
  };
}
