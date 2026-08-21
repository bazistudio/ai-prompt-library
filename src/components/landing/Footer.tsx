import Link from "next/link";
import Image from "next/image";
import { ShieldCheck } from "lucide-react";
import { landingConfig } from "@/config/landingConfig";

function GithubIcon({ className = "h-4 w-4" }: { className?: string }) {
  return (
    <svg className={className} viewBox="0 0 24 24" fill="currentColor">
      <path fillRule="evenodd" clipRule="evenodd" d="M12 2C6.477 2 2 6.484 2 12.017c0 4.425 2.865 8.18 6.839 9.504.5.092.682-.217.682-.483 0-.237-.008-.868-.013-1.703-2.782.605-3.369-1.343-3.369-1.343-.454-1.158-1.11-1.466-1.11-1.466-.908-.62.069-.608.069-.608 1.003.07 1.53 1.032 1.53 1.032.892 1.53 2.341 1.088 2.91.832.092-.647.35-1.088.636-1.338-2.22-.253-4.555-1.113-4.555-4.951 0-1.093.39-1.988 1.029-2.688-.103-.253-.446-1.272.098-2.65 0 0 .84-.27 2.75 1.026A9.564 9.564 0 0112 6.844c.85.004 1.705.115 2.504.337 1.909-1.296 2.747-1.027 2.747-1.027.546 1.379.202 2.398.1 2.651.64.7 1.028 1.595 1.028 2.688 0 3.848-2.339 4.695-4.566 4.943.359.309.678.92.678 1.855 0 1.338-.012 2.419-.012 2.747 0 .268.18.58.688.482A10.019 10.019 0 0022 12.017C22 6.484 17.522 2 12 2z" />
    </svg>
  );
}

export function LandingFooter() {
  const currentYear = new Date().getFullYear();

  return (
    <footer className="bg-card border-t border-border py-12 text-left">
      <div className="max-w-6xl mx-auto px-6 space-y-8">
        <div className="flex flex-col md:flex-row items-start justify-between gap-8">
          {/* Brand Info */}
          <div className="space-y-3 max-w-sm">
            <div className="flex items-center gap-2.5">
              <div className="h-8 w-8 rounded-lg bg-primary/10 border border-primary/20 flex items-center justify-center p-1">
                <Image
                  src="/images/logo.png"
                  alt="Bazi Studio AI Prompt Library"
                  width={24}
                  height={24}
                  className="object-contain"
                />
              </div>
              <span className="font-bold text-base text-foreground tracking-tight">
                {landingConfig.productName}
              </span>
            </div>
            <p className="text-xs text-muted-foreground leading-relaxed">
              An offline-first workspace to organize, create, improve, version, and reuse your AI prompts.
            </p>
            <div className="flex items-center gap-2 text-[11px] font-semibold text-muted-foreground">
              <ShieldCheck className="h-3.5 w-3.5 text-primary" />
              <span>Developed by {landingConfig.brandName} • v{landingConfig.version}</span>
            </div>
          </div>

          {/* Footer Navigation Columns */}
          <div className="grid grid-cols-2 sm:grid-cols-3 gap-8 text-xs">
            <div className="space-y-2.5">
              <h4 className="font-bold text-foreground uppercase tracking-wider text-[10px]">
                Product
              </h4>
              <ul className="space-y-2 text-muted-foreground">
                <li>
                  <a href="#features" className="hover:text-foreground transition-colors">
                    Features
                  </a>
                </li>
                <li>
                  <a href="#showcase" className="hover:text-foreground transition-colors">
                    Showcase
                  </a>
                </li>
                <li>
                  <a href="#pricing" className="hover:text-foreground transition-colors">
                    Pricing
                  </a>
                </li>
                <li>
                  <a href="#faq" className="hover:text-foreground transition-colors">
                    FAQ
                  </a>
                </li>
              </ul>
            </div>

            <div className="space-y-2.5">
              <h4 className="font-bold text-foreground uppercase tracking-wider text-[10px]">
                Architecture
              </h4>
              <ul className="space-y-2 text-muted-foreground">
                <li>
                  <a href="#privacy" className="hover:text-foreground transition-colors">
                    Offline Privacy
                  </a>
                </li>
                <li>
                  <span className="text-muted-foreground/70">Local SQLite Engine</span>
                </li>
                <li>
                  <span className="text-muted-foreground/70">Windows Desktop</span>
                </li>
                <li>
                  <span className="text-muted-foreground/70">Offline Licensing</span>
                </li>
              </ul>
            </div>

            <div className="space-y-2.5">
              <h4 className="font-bold text-foreground uppercase tracking-wider text-[10px]">
                Repository
              </h4>
              <ul className="space-y-2 text-muted-foreground">
                <li>
                  <a
                    href={landingConfig.githubUrl}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="inline-flex items-center gap-1 hover:text-foreground transition-colors"
                  >
                    <GithubIcon className="h-3.5 w-3.5" />
                    <span>GitHub Repo</span>
                  </a>
                </li>
                <li>
                  <Link href="/dashboard" className="hover:text-foreground transition-colors">
                    Application Workspace
                  </Link>
                </li>
              </ul>
            </div>
          </div>
        </div>

        {/* Bottom Bar */}
        <div className="pt-6 border-t border-border/50 flex flex-col sm:flex-row items-center justify-between gap-4 text-xs text-muted-foreground">
          <p>© {currentYear} {landingConfig.brandName}. All rights reserved.</p>
          <p className="text-[11px]">AI Prompt Library v{landingConfig.version} • Offline-First Software</p>
        </div>
      </div>
    </footer>
  );
}
