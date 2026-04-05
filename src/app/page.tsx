import Link from "next/link";
import {
  Activity,
  Ambulance,
  Brain,
  MapPin,
  Heart,
  Shield,
  Zap,
  Clock,
  Building2,
  ArrowRight,
  Globe,
  Leaf,
  Cpu,
  Radio,
} from "lucide-react";

export default function Home() {
  return (
    <main className="flex flex-1 flex-col">
      {/* ───────── Hero Section ───────── */}
      <section className="relative flex flex-col items-center justify-center px-4 pb-24 pt-32 text-center">
        {/* Background glow effects */}
        <div className="pointer-events-none absolute inset-0 overflow-hidden">
          <div className="absolute left-1/2 top-1/4 h-[500px] w-[500px] -translate-x-1/2 -translate-y-1/2 rounded-full bg-accent/5 blur-[120px]" />
          <div className="absolute bottom-0 right-1/4 h-[300px] w-[300px] rounded-full bg-blue-600/5 blur-[100px]" />
        </div>

        {/* Badge */}
        <div className="relative mb-8 inline-flex items-center gap-2 rounded-full border border-accent/20 bg-accent/5 px-4 py-1.5 text-sm font-medium text-accent">
          <span className="relative flex h-2 w-2">
            <span className="absolute inline-flex h-full w-full animate-ping rounded-full bg-accent opacity-75" />
            <span className="relative inline-flex h-2 w-2 rounded-full bg-accent" />
          </span>
          AI Emergency Dispatch System
        </div>

        {/* Heading */}
        <h1 className="relative max-w-4xl text-5xl font-extrabold leading-tight tracking-tight sm:text-6xl lg:text-7xl">
          <span className="gradient-text">AI-Powered</span>
          <br />
          Emergency Response
        </h1>

        <p className="relative mt-6 max-w-2xl text-lg leading-relaxed text-muted sm:text-xl">
          Reducing ambulance response time with intelligent triage, multi-factor
          dispatch optimization, and real-time fleet coordination. Every second
          counts.
        </p>

        {/* CTA Buttons */}
        <div className="relative mt-10 flex flex-col items-center gap-4 sm:flex-row">
          <Link
            href="/dashboard"
            className="group flex items-center gap-2 rounded-xl bg-accent px-7 py-3.5 text-sm font-semibold text-background transition-all hover:shadow-[0_0_24px_var(--accent-glow)] hover:brightness-110"
          >
            Open Dashboard
            <ArrowRight className="h-4 w-4 transition-transform group-hover:translate-x-0.5" />
          </Link>
          <Link
            href="/dispatch"
            className="flex items-center gap-2 rounded-xl border border-card-border px-7 py-3.5 text-sm font-semibold text-foreground transition-all hover:border-accent/50 hover:shadow-[0_0_12px_var(--accent-glow)]"
          >
            <Zap className="h-4 w-4 text-accent" />
            New Dispatch
          </Link>
        </div>
      </section>

      {/* ───────── Stats Bar ───────── */}
      <section className="border-y border-card-border bg-card/50 backdrop-blur-sm">
        <div className="mx-auto grid max-w-5xl grid-cols-2 divide-x divide-card-border sm:grid-cols-4">
          {[
            { icon: <Clock className="h-5 w-5 text-accent" />, value: "< 8 min", label: "Avg Response" },
            { icon: <Ambulance className="h-5 w-5 text-accent" />, value: "15", label: "Ambulances" },
            { icon: <Building2 className="h-5 w-5 text-accent" />, value: "12", label: "Hospitals" },
            { icon: <Radio className="h-5 w-5 text-accent" />, value: "24/7", label: "AI Dispatch" },
          ].map((stat) => (
            <div
              key={stat.label}
              className="flex flex-col items-center gap-1 px-6 py-8"
            >
              {stat.icon}
              <span className="mt-1 text-2xl font-bold text-foreground">
                {stat.value}
              </span>
              <span className="text-xs font-medium uppercase tracking-wider text-muted">
                {stat.label}
              </span>
            </div>
          ))}
        </div>
      </section>

      {/* ───────── Features Section ───────── */}
      <section className="mx-auto w-full max-w-6xl px-4 py-24 sm:px-6 lg:px-8">
        <div className="text-center">
          <h2 className="text-3xl font-bold tracking-tight sm:text-4xl">
            How It <span className="gradient-text">Works</span>
          </h2>
          <p className="mx-auto mt-4 max-w-2xl text-muted">
            Three intelligent layers working in real-time to deliver the fastest
            possible emergency response.
          </p>
        </div>

        <div className="mt-16 grid gap-6 sm:grid-cols-2 lg:grid-cols-3">
          {/* Feature 1: AI Triage */}
          <div className="card-hover group relative rounded-2xl border border-card-border bg-card p-8">
            <div className="mb-5 flex h-12 w-12 items-center justify-center rounded-xl bg-cyan-500/10 text-cyan-400 transition-shadow group-hover:shadow-[0_0_20px_rgba(6,182,212,0.2)]">
              <Brain className="h-6 w-6" />
            </div>
            <h3 className="text-lg font-semibold text-foreground">
              AI Triage
            </h3>
            <p className="mt-2 text-sm leading-relaxed text-muted">
              Instantly classifies emergency severity (P1-P4) using natural
              language processing. Identifies required specialization and
              equipment before dispatch.
            </p>
            <div className="mt-4 flex flex-wrap gap-2">
              <span className="rounded-full bg-red-500/10 px-2.5 py-0.5 text-[10px] font-semibold text-red-400">
                P1 Critical
              </span>
              <span className="rounded-full bg-orange-500/10 px-2.5 py-0.5 text-[10px] font-semibold text-orange-400">
                P2 Urgent
              </span>
              <span className="rounded-full bg-yellow-500/10 px-2.5 py-0.5 text-[10px] font-semibold text-yellow-400">
                P3 Moderate
              </span>
              <span className="rounded-full bg-green-500/10 px-2.5 py-0.5 text-[10px] font-semibold text-green-400">
                P4 Minor
              </span>
            </div>
          </div>

          {/* Feature 2: Smart Dispatch */}
          <div className="card-hover group relative rounded-2xl border border-card-border bg-card p-8">
            <div className="mb-5 flex h-12 w-12 items-center justify-center rounded-xl bg-blue-500/10 text-blue-400 transition-shadow group-hover:shadow-[0_0_20px_rgba(59,130,246,0.2)]">
              <MapPin className="h-6 w-6" />
            </div>
            <h3 className="text-lg font-semibold text-foreground">
              Smart Dispatch
            </h3>
            <p className="mt-2 text-sm leading-relaxed text-muted">
              Multi-factor optimization considers distance, traffic, equipment
              match, hospital specialization, and fuel levels to pick the
              optimal ambulance-hospital pair.
            </p>
            <div className="mt-4 space-y-2">
              {[
                { label: "Distance", pct: "30%" },
                { label: "Traffic", pct: "25%" },
                { label: "Equipment", pct: "20%" },
                { label: "Hospital", pct: "15%" },
                { label: "Fuel", pct: "10%" },
              ].map((f) => (
                <div key={f.label} className="flex items-center gap-2 text-[11px]">
                  <span className="w-16 text-muted">{f.label}</span>
                  <div className="h-1.5 flex-1 rounded-full bg-card-border">
                    <div
                      className="h-full rounded-full bg-blue-400/70"
                      style={{ width: f.pct }}
                    />
                  </div>
                  <span className="w-8 text-right font-mono text-muted">
                    {f.pct}
                  </span>
                </div>
              ))}
            </div>
          </div>

          {/* Feature 3: Live Tracking */}
          <div className="card-hover group relative rounded-2xl border border-card-border bg-card p-8 sm:col-span-2 lg:col-span-1">
            <div className="mb-5 flex h-12 w-12 items-center justify-center rounded-xl bg-violet-500/10 text-violet-400 transition-shadow group-hover:shadow-[0_0_20px_rgba(139,92,246,0.2)]">
              <Activity className="h-6 w-6" />
            </div>
            <h3 className="text-lg font-semibold text-foreground">
              Live Tracking
            </h3>
            <p className="mt-2 text-sm leading-relaxed text-muted">
              Real-time fleet monitoring with live GPS positions, ETA
              calculations, route animations, and emergency heatmap overlays on
              an interactive map.
            </p>
            <div className="mt-4 flex items-center gap-3">
              <span className="flex items-center gap-1.5 text-[11px] text-muted">
                <span className="h-2 w-2 rounded-full bg-green-400" />
                Available
              </span>
              <span className="flex items-center gap-1.5 text-[11px] text-muted">
                <span className="h-2 w-2 rounded-full bg-yellow-400" />
                En Route
              </span>
              <span className="flex items-center gap-1.5 text-[11px] text-muted">
                <span className="h-2 w-2 rounded-full bg-red-400" />
                At Scene
              </span>
              <span className="flex items-center gap-1.5 text-[11px] text-muted">
                <span className="h-2 w-2 rounded-full bg-blue-400" />
                Transporting
              </span>
            </div>
          </div>
        </div>
      </section>

      {/* ───────── SDG Section ───────── */}
      <section className="border-t border-card-border bg-card/30 px-4 py-24 sm:px-6 lg:px-8">
        <div className="mx-auto max-w-6xl">
          <div className="text-center">
            <h2 className="text-3xl font-bold tracking-tight sm:text-4xl">
              Aligned with <span className="gradient-text">UN SDGs</span>
            </h2>
            <p className="mx-auto mt-4 max-w-2xl text-muted">
              SmartAmbSys contributes to sustainable development through
              technology-driven emergency healthcare optimization.
            </p>
          </div>

          <div className="mt-16 grid gap-6 sm:grid-cols-3">
            {/* SDG 9 */}
            <div className="card-hover rounded-2xl border border-card-border bg-card p-7 text-center">
              <div className="mx-auto mb-4 flex h-14 w-14 items-center justify-center rounded-2xl bg-orange-500/10">
                <Cpu className="h-7 w-7 text-orange-400" />
              </div>
              <h3 className="font-semibold text-foreground">SDG 9</h3>
              <p className="mt-1 text-sm font-medium text-orange-400">
                Industry, Innovation & Infrastructure
              </p>
              <p className="mt-3 text-xs leading-relaxed text-muted">
                Leveraging AI and real-time data to build resilient emergency
                response infrastructure for cities.
              </p>
            </div>

            {/* SDG 11 */}
            <div className="card-hover rounded-2xl border border-card-border bg-card p-7 text-center">
              <div className="mx-auto mb-4 flex h-14 w-14 items-center justify-center rounded-2xl bg-amber-500/10">
                <Globe className="h-7 w-7 text-amber-400" />
              </div>
              <h3 className="font-semibold text-foreground">SDG 11</h3>
              <p className="mt-1 text-sm font-medium text-amber-400">
                Sustainable Cities & Communities
              </p>
              <p className="mt-3 text-xs leading-relaxed text-muted">
                Optimizing ambulance routing to reduce congestion, improve
                response times, and make cities safer for everyone.
              </p>
            </div>

            {/* SDG 13 */}
            <div className="card-hover rounded-2xl border border-card-border bg-card p-7 text-center">
              <div className="mx-auto mb-4 flex h-14 w-14 items-center justify-center rounded-2xl bg-green-500/10">
                <Leaf className="h-7 w-7 text-green-400" />
              </div>
              <h3 className="font-semibold text-foreground">SDG 13</h3>
              <p className="mt-1 text-sm font-medium text-green-400">
                Climate Action
              </p>
              <p className="mt-3 text-xs leading-relaxed text-muted">
                Shorter, optimized routes mean lower fuel consumption and reduced
                CO2 emissions per emergency response.
              </p>
            </div>
          </div>
        </div>
      </section>

      {/* ───────── Footer ───────── */}
      <footer className="border-t border-card-border px-4 py-10">
        <div className="mx-auto flex max-w-6xl flex-col items-center justify-between gap-4 sm:flex-row">
          <div className="flex items-center gap-2">
            <Heart className="h-4 w-4 text-danger" />
            <span className="text-sm text-muted">
              <span className="font-semibold text-foreground">SmartAmbSys</span>{" "}
              &mdash; Built for Smart India Hackathon 2024
            </span>
          </div>
          <div className="flex items-center gap-4 text-xs text-muted">
            <span className="flex items-center gap-1">
              <Shield className="h-3.5 w-3.5" />
              AI-Powered
            </span>
            <span className="flex items-center gap-1">
              <Activity className="h-3.5 w-3.5" />
              Real-Time
            </span>
            <span className="flex items-center gap-1">
              <Leaf className="h-3.5 w-3.5" />
              Sustainable
            </span>
          </div>
        </div>
      </footer>
    </main>
  );
}
