import { createAuthClient } from "better-auth/react";

export const authClient = createAuthClient({
  // baseURL: process.env.NEXT_PUBLIC_APP_URL || "http://localhost:3000",
  sessionOptions: {
    refetchOnWindowFocus: false, // quay lại tab không gọi lại /get-session
    refetchInterval: 0, // không polling theo chu kỳ
  },
});

export const { signIn, signOut, signUp, useSession, getSession } = authClient;
