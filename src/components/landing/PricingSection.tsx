import { CheckCircle2, ShieldCheck, Download, Key } from "lucide-react";
import { landingConfig } from "@/config/landingConfig";

export function LandingPricingSection() {
  const { demo, lifetime } = landingConfig.pricing;

  return (
    <section id="pricing" className="py-20 bg-card/30 border-b border-border/60">
      <div className="max-w-6xl mx-auto px-6 text-center space-y-12">
        <div className="space-y-3 max-w-2xl mx-auto">
          <span className="text-xs font-bold uppercase tracking-wider text-primary">
            Simple Pricing
          </span>
          <h2 className="text-3xl font-extrabold tracking-tight text-foreground sm:text-4xl">
            Honest, transparent pricing
          </h2>
          <p className="text-sm text-muted-foreground leading-relaxed">
            Try the application with a 10-day evaluation demo, or unlock lifetime access with a single one-time payment.
          </p>
        </div>

        <div className="grid md:grid-cols-2 gap-8 max-w-4xl mx-auto text-left">
          {/* Demo Card */}
          <div className="glass-card p-8 rounded-2xl border border-border bg-card flex flex-col justify-between space-y-6">
            <div className="space-y-6">
              <div className="flex items-center justify-between">
                <div>
                  <h3 className="text-lg font-bold text-foreground">{demo.title}</h3>
                  <span className="text-xs text-muted-foreground">{demo.period}</span>
                </div>
                <div className="h-10 w-10 rounded-xl bg-secondary border border-border flex items-center justify-center text-muted-foreground">
                  <Download className="h-5 w-5" />
                </div>
              </div>

              <div className="space-y-1">
                <span className="text-4xl font-extrabold text-foreground tracking-tight">{demo.price}</span>
                <p className="text-xs text-muted-foreground">
                  Evaluates all application features with demo limits
                </p>
              </div>

              <ul className="space-y-3 text-xs text-muted-foreground pt-4 border-t border-border/60">
                {demo.features.map((feat, idx) => (
                  <li key={idx} className="flex items-center gap-2.5">
                    <CheckCircle2 className="h-4 w-4 text-primary shrink-0" />
                    <span>{feat}</span>
                  </li>
                ))}
              </ul>
            </div>

            <a
              href={landingConfig.downloadUrl}
              target="_blank"
              rel="noopener noreferrer"
              className="w-full text-center px-6 py-3 rounded-xl border border-border bg-background hover:bg-muted text-foreground font-semibold text-xs transition-all shadow-2xs cursor-pointer block"
            >
              {demo.ctaText}
            </a>
          </div>

          {/* Lifetime Card (Featured) */}
          <div className="glass-card-glow p-8 rounded-2xl border-2 border-primary bg-card flex flex-col justify-between space-y-6 relative overflow-hidden">
            <div className="absolute top-4 right-4">
              <span className="text-[10px] font-extrabold uppercase tracking-wider px-3 py-1 rounded-full bg-primary text-primary-foreground shadow-xs">
                Popular Choice
              </span>
            </div>

            <div className="space-y-6">
              <div className="flex items-center justify-between">
                <div>
                  <h3 className="text-lg font-bold text-foreground">{lifetime.title}</h3>
                  <span className="text-xs text-primary font-semibold">{lifetime.period}</span>
                </div>
                <div className="h-10 w-10 rounded-xl bg-primary/10 border border-primary/20 flex items-center justify-center text-primary">
                  <Key className="h-5 w-5" />
                </div>
              </div>

              <div className="space-y-1">
                <span className="text-4xl font-extrabold text-foreground tracking-tight">{lifetime.price}</span>
                <p className="text-xs text-muted-foreground">
                  One-time payment • No recurring monthly subscriptions
                </p>
              </div>

              <ul className="space-y-3 text-xs text-foreground pt-4 border-t border-border/60">
                {lifetime.features.map((feat, idx) => (
                  <li key={idx} className="flex items-center gap-2.5 font-medium">
                    <CheckCircle2 className="h-4 w-4 text-emerald-500 shrink-0" />
                    <span>{feat}</span>
                  </li>
                ))}
              </ul>
            </div>

            <a
              href={landingConfig.downloadUrl}
              target="_blank"
              rel="noopener noreferrer"
              className="w-full text-center px-6 py-3 rounded-xl bg-primary hover:bg-primary/90 text-primary-foreground font-bold text-xs transition-all shadow-md shadow-primary/25 cursor-pointer block"
            >
              {lifetime.ctaText}
            </a>
          </div>
        </div>
      </div>
    </section>
  );
}
