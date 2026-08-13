import { Suspense } from "react";
import LoginForm from "./login-form";

export default function LoginPage() {
  return (
    <Suspense
      fallback={
        <div className="flex min-h-screen items-center justify-center bg-background text-muted-foreground">
          <div className="text-center space-y-4">
            <div className="h-10 w-10 rounded-full border-2 border-primary border-t-transparent animate-spin mx-auto" />
            <p className="text-sm font-semibold">Initializing workspace session...</p>
          </div>
        </div>
      }
    >
      <LoginForm />
    </Suspense>
  );
}
