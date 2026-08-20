"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import {
  FolderKanban,
  GraduationCap,
  Sparkles,
  Briefcase,
  Bot,
  Search,
  BookOpen,
  Eye,
  PlusCircle,
  X,
  Copy,
  Check,
} from "lucide-react";

interface BuiltinTemplate {
  id: string;
  name: string;
  description: string;
  category: "Projects" | "Learning" | "Research" | "Client" | "AI";
  icon: React.ComponentType<{ className?: string }>;
  tags: string[];
  content: string;
}

const TEMPLATES: BuiltinTemplate[] = [
  // 1. Projects
  {
    id: "proj-roadmap",
    name: "Project Roadmap",
    description: "Multi-phase timeline with milestones, deliverables, dependencies, and team ownership.",
    category: "Projects",
    icon: FolderKanban,
    tags: ["roadmap", "planning", "milestones"],
    content: `# Project Roadmap: {{project_name:New Project}}

> **Lead:** {{lead_name:Project Lead}} • **Target Date:** {{target_date:Q3 2026}} • **Status:** Planning

## 1. Executive Summary
Provide a brief high-level overview of the strategic objectives and expected impact.

## 2. Strategic Milestones

### Phase 1: Discovery & Architecture (Weeks 1-3)
- [ ] Requirements gathering & stakeholder interviews
- [ ] Technical architecture specification
- [ ] Initial prototype & feasibility sign-off

### Phase 2: Core Engineering (Weeks 4-8)
- [ ] Database schema & service boundaries implementation
- [ ] API routes and frontend interface wiring
- [ ] Unit & integration test coverage

### Phase 3: Hardening & Release (Weeks 9-12)
- [ ] End-to-end user acceptance testing
- [ ] Performance benchmarking & security audit
- [ ] Production deployment & release notes

## 3. Risks & Dependencies
- Dependency on external cloud infrastructure provisioning
- Resource allocation across design and engineering
`,
  },
  {
    id: "proj-plan",
    name: "Project Plan",
    description: "Detailed tactical implementation plan with task breakdowns, technical stack, and acceptance criteria.",
    category: "Projects",
    icon: FolderKanban,
    tags: ["plan", "tasks", "execution"],
    content: `# Technical Project Plan: {{project_title:System Module}}

## 1. Objectives & Scope
- Deliverable: {{deliverable:Core Feature}}
- Non-goals: Out-of-scope items for this release cycle

## 2. Technical Stack & Dependencies
- Frontend: Next.js 16 + React 19 + Tailwind CSS
- Runtime: Electron 34 + Local SQLite
- Testing: Jest / Vitest + ESLint

## 3. Work Breakdown Structure (WBS)
- [ ] **Task 1:** Initialize repository & configure TypeScript strict mode
- [ ] **Task 2:** Implement local data access layer & migration contracts
- [ ] **Task 3:** Build user interface components & state containers
- [ ] **Task 4:** Add offline validation & error recovery boundaries

## 4. Acceptance Criteria
1. Zero runtime regressions on cold application startup.
2. 100% offline data integrity across sessions.
`,
  },
  {
    id: "proj-doc",
    name: "Project Documentation",
    description: "Standard software architecture documentation with API schema, setup guides, and environment configs.",
    category: "Projects",
    icon: FolderKanban,
    tags: ["docs", "architecture", "reference"],
    content: `# Documentation: {{system_name:Service Architecture}}

## Overview
Comprehensive system design and developer onboarding guide for {{system_name}}.

## Getting Started
\`\`\`bash
# Install local dependencies
npm install

# Run local development server
npm run dev
\`\`\`

## Architecture Guidelines
- **Data Persistence:** Offline SQLite engine with Write-Ahead Logging (WAL).
- **Security:** Bcrypt master hashing with local rate limiting.
- **Packaging:** NSIS portable and desktop installer distributions.
`,
  },

  // 2. Learning
  {
    id: "learn-goals",
    name: "Learning Goals",
    description: "Structured syllabus outline with weekly goals, prerequisites, active projects, and mastery quizzes.",
    category: "Learning",
    icon: GraduationCap,
    tags: ["syllabus", "education", "goals"],
    content: `# Learning Goals: {{subject_topic:Advanced Prompt Engineering}}

> **Target Mastery:** {{mastery_level:Senior Practitioner}} • **Time Commitment:** {{hours_per_week:5}} hrs/week

## Core Objectives
1. Understand foundational principles of deterministic vs. stochastic LLM prompts.
2. Master Chain-of-Thought, Few-Shot, and Role-Based prompting structures.
3. Design reliable structured JSON outputs with schema enforcement.

## Weekly Progress Tracker
- [ ] **Week 1:** Prompt Anatomy & Zero-Shot Instruction Design
- [ ] **Week 2:** Delimiters, System Directives & Context Window Management
- [ ] **Week 3:** Self-Consistency & Prompt Evaluation Harnesses
- [ ] **Week 4:** Automated Workflow Chains & Multi-Model Arena Benchmarking

## Recommended Resources
- Official Model Provider Documentation
- Academic Papers on In-Context Learning
`,
  },
  {
    id: "learn-study",
    name: "Study Notes",
    description: "Feynman technique study template with core concepts, analogies, code snippets, and review questions.",
    category: "Learning",
    icon: GraduationCap,
    tags: ["notes", "study", "feynman"],
    content: `# Study Notes: {{topic:Topic Name}}

## 1. The Core Concept (In Simple Words)
Explain the concept as if teaching a beginner without jargon:
> {{simple_explanation:A clean, intuitive description...}}

## 2. Key Terminology & Definitions
- **Term 1:** Definition and practical example.
- **Term 2:** Definition and practical example.

## 3. Practical Example / Mental Model
\`\`\`
Input -> [Processing Algorithm] -> Output
\`\`\`

## 4. Self-Review Questions
- [ ] Can I recreate the core mechanism from memory?
- [ ] What are the 3 most common failure modes?
`,
  },
  {
    id: "learn-concept",
    name: "Concept Notes",
    description: "Deep-dive theoretical conceptualization document with definitions, visual mental models, and edge cases.",
    category: "Learning",
    icon: GraduationCap,
    tags: ["concept", "theory", "deep-dive"],
    content: `# Concept Deep-Dive: {{concept_name:Vector Embeddings}}

## 1. Definition
Mathematical representation of semantics in high-dimensional vector space.

## 2. Why It Matters
Enables semantic search, clustering, and retrieval-augmented generation (RAG).

## 3. Visual & Mathematical Model
$$\\cos(\\theta) = \\frac{\\mathbf{A} \\cdot \\mathbf{B}}{\\|\\mathbf{A}\\| \\|\\mathbf{B}\\|}$$

## 4. Tradeoffs & Limitations
- Dimensionality vs. retrieval latency
- Sensitivity to embedding domain shift
`,
  },
  {
    id: "learn-qa",
    name: "Q&A Knowledge Base",
    description: "Categorized question-and-answer library for interview prep, FAQs, or troubleshooting repositories.",
    category: "Learning",
    icon: GraduationCap,
    tags: ["qa", "faq", "interview"],
    content: `# Q&A Knowledge Base: {{domain:System Architecture}}

### Q1: What is the primary benefit of SQLite WAL mode?
**Answer:**
Write-Ahead Logging allows concurrent readers without blocking writes, dramatically improving multi-thread read throughput while maintaining ACID guarantees.

### Q2: How does offline cryptographic licensing protect application integrity?
**Answer:**
By bundling only an ECDSA/RSA public verification key in the application binary, licenses can be signed externally with a private key and validated offline without server roundtrips.
`,
  },

  // 3. Research
  {
    id: "res-question",
    name: "Research Question",
    description: "Formal research proposal with hypothesis formulation, methodology, variables, and evaluation criteria.",
    category: "Research",
    icon: Sparkles,
    tags: ["hypothesis", "methodology", "academic"],
    content: `# Research Proposal: {{research_title:Prompt Latency Optimization}}

## 1. Research Question
*What is the impact of token truncation and prompt compression on model response accuracy and inference latency?*

## 2. Hypotheses
- **H1:** Compressing system prompts by 30% reduces Time-to-First-Token (TTFT) by ≥20%.
- **H0:** Prompt compression introduces statistically significant hallucination rates.

## 3. Experimental Methodology
1. Dataset: 500 benchmark evaluation prompts.
2. Models: Gemini 1.5 Flash, GPT-4o-mini, Claude 3.5 Haiku.
3. Metrics: BLEU, ROUGE-L, human evaluation score, latency (ms).
`,
  },
  {
    id: "res-notes",
    name: "Research Notes",
    description: "Literature review notes with paper citations, quotes, methodology summaries, and critique points.",
    category: "Research",
    icon: Sparkles,
    tags: ["literature", "citations", "reading"],
    content: `# Literature Notes: {{paper_title:Attention Is All You Need}}

> **Authors:** Vaswani et al. (2017) • **Venue:** NeurIPS

## Key Contributions
- Introduction of the Transformer architecture based purely on self-attention mechanisms.
- Elimination of recurrence (RNNs) and convolutions for sequential modeling.

## Core Equations
$$\\text{Attention}(Q, K, V) = \\text{softmax}\\left(\\frac{QK^T}{\\sqrt{d_k}}\\right)V$$

## Key Takeaways for Our Project
- Attention enables parallelization across sequence lengths during training.
`,
  },
  {
    id: "res-findings",
    name: "Research Findings",
    description: "Structured research report summarizing experiments, statistical results, charts, and conclusions.",
    category: "Research",
    icon: Sparkles,
    tags: ["findings", "results", "report"],
    content: `# Research Findings Report: {{study_title:Evaluation Summary}}

## Executive Summary
Key experimental findings and quantitative insights from the evaluation cohort.

## Quantitative Results

| Model Variant | Accuracy (%) | Mean Latency (ms) | Token Efficiency |
| :--- | :--- | :--- | :--- |
| Baseline | 94.2% | 420 ms | 1.0x |
| Compressed | 93.8% | 290 ms | 1.45x |

## Conclusion & Recommendations
The compressed prompt configuration achieves a 31% speedup with negligible accuracy degradation.
`,
  },

  // 4. Client
  {
    id: "client-brief",
    name: "Client Brief",
    description: "Client discovery document covering project background, target audience, budget, and deliverables.",
    category: "Client",
    icon: Briefcase,
    tags: ["brief", "client", "discovery"],
    content: `# Client Project Brief: {{client_name:Client Organization}}

## 1. Project Background
- **Client:** {{client_name}}
- **Industry:** {{industry:Technology}}
- **Primary Contact:** {{contact_person:Stakeholder}}

## 2. Core Problem Statement
What business challenge is the client facing that this project will solve?

## 3. Target Audience & Personas
- Primary Users: Internal engineering teams and product managers.

## 4. Deliverables & Success Metrics
- [ ] Deliverable 1: Design system & component UI kit
- [ ] Deliverable 2: Production API routes & local database storage
- [ ] Target Metric: 50% reduction in customer onboarding time
`,
  },
  {
    id: "client-req",
    name: "Requirements Specification",
    description: "Formal Functional and Non-Functional Requirements Document (FRD/NFRD) for client sign-off.",
    category: "Client",
    icon: Briefcase,
    tags: ["requirements", "frd", "specs"],
    content: `# Requirements Specification: {{project_name:Client Portal}}

## 1. Functional Requirements (FR)
- **FR-01:** System must allow users to create and manage prompts offline.
- **FR-02:** System must provide cryptographic offline licensing without phone-home requirements.
- **FR-03:** System must support multi-language scripts including RTL (Arabic/Urdu).

## 2. Non-Functional Requirements (NFR)
- **Performance:** Cold launch under 800ms on desktop devices.
- **Security:** Master password encryption via bcrypt with lockout protection.
`,
  },
  {
    id: "client-meeting",
    name: "Meeting Notes",
    description: "Structured agenda, attendees list, key discussion points, decisions made, and action items with assignees.",
    category: "Client",
    icon: Briefcase,
    tags: ["meeting", "agenda", "actions"],
    content: `# Client Meeting Notes: {{meeting_topic:Weekly Sync}}

> **Date:** {{date:August 19, 2026}} • **Attendees:** {{attendees:Team Lead, Client Representative}}

## 1. Agenda
1. Review sprint progress and completed deliverables.
2. Discuss feedback on initial user interface prototype.
3. Next steps and release schedule.

## 2. Decisions Made
- Decision 1: Proceed with local SQLite storage for privacy-first compliance.
- Decision 2: Keep the standalone desktop app 100% offline.

## 3. Action Items
- [ ] **Assignee 1:** Implement export dialog format options (Due: Friday)
- [ ] **Assignee 2:** Review licensing certificate schema (Due: Monday)
`,
  },

  // 5. AI
  {
    id: "ai-prompt-proj",
    name: "AI Prompt Project",
    description: "Complete AI prompt engineering project document with system prompt, variable slots, and few-shot examples.",
    category: "AI",
    icon: Bot,
    tags: ["prompt", "system-prompt", "few-shot"],
    content: `# System Prompt Engineering: {{agent_name:Code Architect}}

## Role & Personality
You are an expert software architect specializing in clean, maintainable, production-ready TypeScript applications.

## Core Directives
1. Output concise, production-ready code with complete type annotations.
2. Strictly adhere to offline-first principles and zero unsolicited dependencies.
3. Validate all inputs and handle edge cases gracefully.

## Template Variables
- Target Framework: {{framework:Next.js 16}}
- Database Driver: {{database:SQLite}}

## Few-Shot Examples

### Input:
Create a type-safe key-value store interface.

### Output:
\`\`\`typescript
export interface KeyValueStore {
  get<T>(key: string): Promise<T | null>;
  set<T>(key: string, value: T): Promise<void>;
  delete(key: string): Promise<boolean>;
}
\`\`\`
`,
  },
  {
    id: "ai-prompt-test",
    name: "Prompt Testing Harness",
    description: "Structured evaluation test suite with diverse test cases, expected outputs, and scoring rubrics.",
    category: "AI",
    icon: Bot,
    tags: ["testing", "evals", "benchmarking"],
    content: `# Prompt Evaluation Suite: {{prompt_title:Customer Support Agent}}

## Evaluation Criteria
- Tone: Professional, empathetic, solution-oriented (1-5)
- Accuracy: Correctness of policy information (1-5)
- Conciseness: Avoidance of unnecessary boilerplate (1-5)

## Test Cases

### Case 1: Refund Request Within Window
- **Input:** "I bought this 2 days ago and want my money back."
- **Expected:** Immediate acknowledgement + refund initiation steps.

### Case 2: Out of Scope Question
- **Input:** "What is the capital of France?"
- **Expected:** Polite redirection to support-related topics.
`,
  },
  {
    id: "ai-prompt-exp",
    name: "Prompt Experiment Log",
    description: "Systematic experiment tracker for comparing prompt iterations, hyperparameter changes, and model outputs.",
    category: "AI",
    icon: Bot,
    tags: ["experiment", "ab-testing", "iteration"],
    content: `# Prompt Iteration Log: {{experiment_title:Zero-Shot vs Few-Shot}}

## Hypothesis
Adding 3 few-shot examples will reduce JSON syntax parsing errors from 12% to <1%.

## Experiment Configuration
- Model: Gemini 1.5 Flash
- Temperature: 0.2
- Max Output Tokens: 1024

## Results & Analysis
- **Iteration 1 (Zero-Shot):** 88% validity, occasional missing commas.
- **Iteration 2 (Few-Shot):** 100% validity across 50 test runs.

## Recommendation
Deploy Iteration 2 to production template library.
`,
  },
];

export default function TemplateLibraryPage() {
  const router = useRouter();
  const [selectedCategory, setSelectedCategory] = useState<string>("All");
  const [searchQuery, setSearchQuery] = useState("");
  const [previewTemplate, setPreviewTemplate] = useState<BuiltinTemplate | null>(null);
  const [copied, setCopied] = useState(false);

  const categories = ["All", "Projects", "Learning", "Research", "Client", "AI"] as const;

  const filteredTemplates = TEMPLATES.filter((t) => {
    const matchesCat = selectedCategory === "All" || t.category === selectedCategory;
    const matchesSearch =
      !searchQuery.trim() ||
      t.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
      t.description.toLowerCase().includes(searchQuery.toLowerCase()) ||
      t.tags.some((tag) => tag.toLowerCase().includes(searchQuery.toLowerCase()));
    return matchesCat && matchesSearch;
  });

  const handleUseTemplate = (template: BuiltinTemplate) => {
    // Store in sessionStorage or navigate to prompt creator with prefilled data
    if (typeof window !== "undefined") {
      sessionStorage.setItem(
        "ai-prompt:template-draft",
        JSON.stringify({
          title: template.name,
          content: template.content,
          category: template.category,
          tags: template.tags,
        })
      );
    }
    router.push("/prompts/new?fromTemplate=true");
  };

  const handleCopyContent = (content: string) => {
    navigator.clipboard.writeText(content);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  return (
    <div className="max-w-6xl w-full mx-auto px-6 py-8 space-y-8 text-left">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold tracking-tight text-foreground flex items-center gap-2">
            <BookOpen className="h-6 w-6 text-primary" />
            <span>Built-in Template Library</span>
          </h1>
          <p className="text-xs text-muted-foreground mt-0.5">
            Production-ready structured documents for projects, learning, research, and prompt engineering
          </p>
        </div>

        {/* Search Input */}
        <div className="relative w-full sm:w-72">
          <Search className="h-4 w-4 absolute left-3 top-1/2 -translate-y-1/2 text-muted-foreground" />
          <input
            type="text"
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            placeholder="Search templates & tags..."
            className="w-full pl-9 pr-3.5 py-2 rounded-xl border border-border bg-card text-xs text-foreground focus:outline-none focus:ring-1 focus:ring-primary shadow-2xs"
          />
        </div>
      </div>

      {/* Category Tabs */}
      <div className="flex items-center gap-2 overflow-x-auto pb-1 border-b border-border/60">
        {categories.map((cat) => (
          <button
            key={cat}
            onClick={() => setSelectedCategory(cat)}
            className={`px-4 py-2 rounded-xl text-xs font-semibold whitespace-nowrap transition-all cursor-pointer ${
              selectedCategory === cat
                ? "bg-primary text-primary-foreground font-bold shadow-xs"
                : "text-muted-foreground hover:text-foreground hover:bg-muted"
            }`}
          >
            {cat}
          </button>
        ))}
      </div>

      {/* Template Cards Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
        {filteredTemplates.map((template) => {
          const Icon = template.icon;
          return (
            <div
              key={template.id}
              className="p-5 rounded-2xl border border-border bg-card/60 hover:border-primary/40 hover:bg-card transition-all flex flex-col justify-between group shadow-2xs space-y-4"
            >
              <div className="space-y-3">
                <div className="flex items-center justify-between">
                  <div className="h-10 w-10 rounded-xl bg-primary/10 border border-primary/20 flex items-center justify-center text-primary group-hover:scale-105 transition-transform">
                    <Icon className="h-5 w-5" />
                  </div>
                  <span className="text-[10px] font-bold font-mono px-2.5 py-0.5 rounded-full bg-secondary text-foreground border border-border">
                    {template.category}
                  </span>
                </div>

                <div>
                  <h3 className="text-sm font-bold text-foreground group-hover:text-primary transition-colors">
                    {template.name}
                  </h3>
                  <p className="text-xs text-muted-foreground mt-1 line-clamp-2 leading-relaxed">
                    {template.description}
                  </p>
                </div>

                <div className="flex flex-wrap gap-1.5 pt-1">
                  {template.tags.map((tag) => (
                    <span
                      key={tag}
                      className="text-[10px] font-mono px-2 py-0.5 rounded-md bg-muted/60 text-muted-foreground"
                    >
                      #{tag}
                    </span>
                  ))}
                </div>
              </div>

              {/* Actions */}
              <div className="flex items-center gap-2 pt-3 border-t border-border/40">
                <button
                  type="button"
                  onClick={() => setPreviewTemplate(template)}
                  className="flex-1 inline-flex items-center justify-center gap-1.5 px-3 py-2 rounded-xl border border-border bg-card hover:bg-muted text-foreground text-xs font-semibold transition-colors cursor-pointer"
                >
                  <Eye className="h-3.5 w-3.5" />
                  <span>Preview</span>
                </button>

                <button
                  type="button"
                  onClick={() => handleUseTemplate(template)}
                  className="flex-1 inline-flex items-center justify-center gap-1.5 px-3 py-2 rounded-xl bg-primary hover:bg-primary/90 text-primary-foreground text-xs font-bold transition-all shadow-xs cursor-pointer"
                >
                  <PlusCircle className="h-3.5 w-3.5" />
                  <span>Use Template</span>
                </button>
              </div>
            </div>
          );
        })}
      </div>

      {/* Template Preview Modal */}
      {previewTemplate && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/70 backdrop-blur-sm p-4 text-left">
          <div className="w-full max-w-2xl bg-card border border-border rounded-2xl shadow-2xl flex flex-col max-h-[85vh] overflow-hidden animate-in fade-in zoom-in-95 duration-150">
            <div className="flex items-center justify-between px-6 py-4 border-b border-border bg-muted/20">
              <div className="flex items-center gap-3">
                <div className="h-9 w-9 rounded-xl bg-primary/10 border border-primary/20 flex items-center justify-center text-primary">
                  {<previewTemplate.icon className="h-5 w-5" />}
                </div>
                <div>
                  <h3 className="text-base font-bold text-foreground">{previewTemplate.name}</h3>
                  <span className="text-[10px] font-mono text-muted-foreground">
                    Category: {previewTemplate.category}
                  </span>
                </div>
              </div>
              <button
                onClick={() => setPreviewTemplate(null)}
                className="text-muted-foreground hover:text-foreground p-1.5 rounded-lg hover:bg-muted transition-colors cursor-pointer"
              >
                <X className="h-5 w-5" />
              </button>
            </div>

            <div className="flex-1 overflow-y-auto p-6 space-y-4">
              <p className="text-xs text-muted-foreground">{previewTemplate.description}</p>
              <div className="relative">
                <div className="flex items-center justify-between mb-1.5">
                  <span className="text-xs font-bold text-foreground">Template Structure & Variables</span>
                  <button
                    onClick={() => handleCopyContent(previewTemplate.content)}
                    className="text-xs text-muted-foreground hover:text-foreground inline-flex items-center gap-1 cursor-pointer"
                  >
                    {copied ? <Check className="h-3 w-3 text-emerald-500" /> : <Copy className="h-3 w-3" />}
                    <span>{copied ? "Copied" : "Copy"}</span>
                  </button>
                </div>
                <pre className="p-4 rounded-xl bg-background border border-border font-mono text-xs text-foreground overflow-x-auto whitespace-pre-wrap leading-relaxed max-h-80">
                  {previewTemplate.content}
                </pre>
              </div>
            </div>

            <div className="flex items-center justify-between px-6 py-4 border-t border-border bg-muted/20">
              <button
                type="button"
                onClick={() => setPreviewTemplate(null)}
                className="px-4 py-2 rounded-xl text-xs font-semibold text-muted-foreground hover:text-foreground transition-colors cursor-pointer"
              >
                Cancel
              </button>

              <button
                type="button"
                onClick={() => {
                  const t = previewTemplate;
                  setPreviewTemplate(null);
                  handleUseTemplate(t);
                }}
                className="inline-flex items-center gap-2 px-5 py-2.5 rounded-xl bg-primary hover:bg-primary/90 text-primary-foreground text-xs font-bold transition-all shadow-md shadow-primary/20 cursor-pointer"
              >
                <PlusCircle className="h-4 w-4" />
                <span>Use This Template</span>
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
