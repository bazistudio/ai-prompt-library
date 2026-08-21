"use client";

import { useState } from "react";
import { ChevronDown, HelpCircle } from "lucide-react";

export function LandingFAQSection() {
  const [openIndex, setOpenIndex] = useState<number | null>(0);

  const faqs = [
    {
      question: "What is AI Prompt Library?",
      answer:
        "AI Prompt Library is a private, offline-first workspace developed by Bazi Studio. It allows AI engineers, developers, creators, and professionals to create, organize, version, test, and reuse prompt templates locally.",
    },
    {
      question: "Does the application work offline?",
      answer:
        "Yes. The core prompt library runs on a local SQLite database (better-sqlite3) on your computer. Your prompts remain on your hard drive and do not rely on external cloud databases.",
    },
    {
      question: "Where are my prompts stored?",
      answer:
        "All your prompt templates, versions, tags, categories, and settings are saved in a local SQLite file inside your user application storage directory.",
    },
    {
      question: "What is included in the 10-Day Demo?",
      answer:
        "The 10-day evaluation demo provides full access to test the prompt library with up to 10 prompts and 1 prompt engineering workspace.",
    },
    {
      question: "What happens after the 10-day demo expires?",
      answer:
        "When the demo evaluation period expires, the application prompts you to enter your lifetime license activation key to unlock unlimited local prompt storage.",
    },
    {
      question: "How much is Lifetime Access?",
      answer:
        "Lifetime Access is PKR 2,000 as a single one-time payment. There are no monthly subscriptions or recurring fees.",
    },
    {
      question: "How does prompt version history work?",
      answer:
        "Whenever you edit a prompt, saving creates a new version entry with a change summary. You can view past versions, compare content, and restore any previous version as the active content.",
    },
    {
      question: "Can I back up my prompt library?",
      answer:
        "Yes. The application includes a Backup & Restore system that exports full database snapshots to ZIP archives on demand or on a scheduled interval.",
    },
  ];

  return (
    <section id="faq" className="py-20 bg-background border-b border-border/60">
      <div className="max-w-4xl mx-auto px-6 space-y-10 text-center">
        <div className="space-y-3 max-w-2xl mx-auto">
          <span className="text-xs font-bold uppercase tracking-wider text-primary">
            Frequently Asked Questions
          </span>
          <h2 className="text-3xl font-extrabold tracking-tight text-foreground sm:text-4xl">
            Everything you need to know
          </h2>
          <p className="text-sm text-muted-foreground leading-relaxed">
            Honest answers about features, offline architecture, and licensing.
          </p>
        </div>

        <div className="space-y-3 text-left">
          {faqs.map((faq, idx) => {
            const isOpen = openIndex === idx;
            return (
              <div
                key={idx}
                className="glass-card rounded-2xl border border-border bg-card overflow-hidden transition-all"
              >
                <button
                  onClick={() => setOpenIndex(isOpen ? null : idx)}
                  className="w-full px-6 py-4 flex items-center justify-between gap-4 text-left font-bold text-sm text-foreground hover:text-primary transition-colors cursor-pointer"
                >
                  <span className="flex items-center gap-2.5">
                    <HelpCircle className="h-4 w-4 text-primary shrink-0" />
                    <span>{faq.question}</span>
                  </span>
                  <ChevronDown
                    className={`h-4 w-4 text-muted-foreground transition-transform duration-200 shrink-0 ${
                      isOpen ? "transform rotate-180 text-primary" : ""
                    }`}
                  />
                </button>

                {isOpen && (
                  <div className="px-6 pb-5 pt-1 text-xs text-muted-foreground leading-relaxed border-t border-border/40 animate-in fade-in duration-150">
                    {faq.answer}
                  </div>
                )}
              </div>
            );
          })}
        </div>
      </div>
    </section>
  );
}
