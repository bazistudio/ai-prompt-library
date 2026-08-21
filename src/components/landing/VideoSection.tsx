import { ExternalLink, Play } from "lucide-react";
import { landingConfig } from "@/config/landingConfig";

function YoutubeIcon({ className = "h-4 w-4" }: { className?: string }) {
  return (
    <svg className={className} viewBox="0 0 24 24" fill="currentColor">
      <path d="M23.498 6.186a3.016 3.016 0 0 0-2.122-2.136C19.505 3.545 12 3.545 12 3.545s-7.505 0-9.377.505A3.017 3.017 0 0 0 .502 6.186C0 8.07 0 12 0 12s0 3.93.502 5.814a3.016 3.016 0 0 0 2.122 2.136c1.871.505 9.376.505 9.376.505s7.505 0 9.377-.505a3.015 3.015 0 0 0 2.122-2.136C24 15.93 24 12 24 12s0-3.93-.502-5.814zM9.545 15.568V8.432L15.818 12l-6.273 3.568z" />
    </svg>
  );
}

export function LandingVideoSection() {
  const videos = landingConfig.videos || [];

  if (videos.length === 0) {
    // Graceful pending state when official Bazi Studio YouTube videos are not yet published
    return null;
  }

  return (
    <section className="py-20 bg-background border-b border-border/60">
      <div className="max-w-6xl mx-auto px-6 text-center space-y-10">
        <div className="space-y-3 max-w-2xl mx-auto">
          <span className="text-xs font-bold uppercase tracking-wider text-primary">
            Video Demonstrations
          </span>
          <h2 className="text-3xl font-extrabold tracking-tight text-foreground sm:text-4xl">
            See AI Prompt Library in Action
          </h2>
          <p className="text-sm text-muted-foreground leading-relaxed">
            Watch official feature walkthroughs on Bazi Studio YouTube.
          </p>
        </div>

        <div className="grid sm:grid-cols-2 lg:grid-cols-3 gap-6 text-left max-w-5xl mx-auto">
          {videos.map((vid) => (
            <div
              key={vid.id}
              className="glass-card rounded-2xl border border-border bg-card overflow-hidden group hover:border-primary/40 transition-all flex flex-col justify-between"
            >
              <div className="space-y-3">
                <div className="relative aspect-video w-full bg-muted flex items-center justify-center">
                  <Play className="h-10 w-10 text-primary opacity-80 group-hover:scale-110 transition-transform" />
                </div>
                <div className="p-4 space-y-1">
                  <h3 className="text-sm font-bold text-foreground line-clamp-1">{vid.title}</h3>
                  <p className="text-xs text-muted-foreground line-clamp-2">{vid.description}</p>
                </div>
              </div>

              <div className="p-4 pt-0">
                <a
                  href={vid.youtubeUrl}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="inline-flex items-center gap-1.5 text-xs font-bold text-primary hover:underline"
                >
                  <YoutubeIcon className="h-4 w-4 text-red-500" />
                  <span>Watch on YouTube</span>
                  <ExternalLink className="h-3 w-3" />
                </a>
              </div>
            </div>
          ))}
        </div>
      </div>
    </section>
  );
}
