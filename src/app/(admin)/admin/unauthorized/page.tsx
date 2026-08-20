import { ShieldAlert, ArrowLeft } from "lucide-react";
import Link from "next/link";

export default function UnauthorizedPage() {
  return (
    <div className="min-h-screen flex items-center justify-center p-6 bg-background">
      <div className="w-full max-w-md text-center space-y-6">
        <div className="h-20 w-20 mx-auto rounded-full bg-destructive/10 border-2 border-destructive/20 flex items-center justify-center text-destructive">
          <ShieldAlert className="h-10 w-10" />
        </div>
        
        <div className="space-y-2">
          <h1 className="text-2xl font-bold text-foreground tracking-tight">Access Denied</h1>
          <p className="text-sm text-muted-foreground">
            You do not have the required permissions to view this page. This area is restricted to Super Admin accounts.
          </p>
        </div>

        <div className="pt-4 flex justify-center">
          <Link
            href="/dashboard"
            className="inline-flex items-center gap-2 px-6 py-3 rounded-xl bg-primary hover:bg-primary/90 text-primary-foreground font-semibold text-sm transition-colors shadow-md shadow-primary/20"
          >
            <ArrowLeft className="h-4 w-4" />
            <span>Return to Dashboard</span>
          </Link>
        </div>
      </div>
    </div>
  );
}
