import { useEffect } from "react";
import { Link, useLocation } from "react-router-dom";
import { Line, LineChart, ResponsiveContainer } from "recharts";

import { useAuth } from "../auth/AuthContext";
import { CHART_SERIES } from "../../lib/chartTheme";
import { FinancialScoreDial } from "../home/FinancialScoreDial";
import "./landing.css";

interface FeatureTile {
  id: string;
  title: string;
  description: string;
}

/** Alternating accent/muted tiles: one Cobalt punctuation per row of tone, not a wall of colour. */
const FEATURE_TILES: FeatureTile[] = [
  {
    id: "emergency-fund",
    title: "Emergency fund",
    description: "Build a buffer sized to your own essentials, and see exactly how many weeks it covers.",
  },
  {
    id: "savings",
    title: "Savings goals",
    description: "Set targets for what matters to you and track progress without a bank's help.",
  },
  {
    id: "income-overview",
    title: "Income overview",
    description: "See each Monday-to-Sunday week's income and costs, even when work is irregular.",
  },
  {
    id: "setback-planner",
    title: "Setback planner",
    description: "Model a slow week or a sudden cost against your real numbers before it happens.",
  },
  {
    id: "scheme-navigator",
    title: "Scheme navigator",
    description: "Find the government and platform schemes you actually qualify for, explained plainly.",
  },
];

/** Fictional weekly income used only to show the trend line's shape. */
const SAMPLE_TREND = [420, 610, 380, 705, 540, 690, 615, 780].map((value, index) => ({ index, value }));

export function LandingPage() {
  const { user } = useAuth();
  const location = useLocation();
  const ctaTo = user ? "/onboarding" : "/signin";

  useEffect(() => {
    window.scrollTo(0, 0);
  }, [location.pathname]);

  return (
    <div className="landing-page surface-abyss" style={{ minHeight: "100vh" }}>
      <header className="landing-nav nav-glass">
        <div className="page landing-nav-inner">
          <Link className="site-brand" style={{ color: "var(--color-pure)" }} to="/">
            <img alt="" height={28} src="/resilience-icon.svg" width={28} />
            <strong className="body-text" style={{ color: "var(--color-pure)" }}>Resilience</strong>
          </Link>
        </div>
      </header>

      <section className="page landing-hero">
        <h1 className="display-hero" style={{ textAlign: "center" }}>
          Financial <em>resilience</em>, built for work that changes week to week
        </h1>
        <p className="subheading landing-hero-sub">
          Track income and costs as they happen, keep an emergency fund sized to your real
          essentials, and plan for setbacks before they land — all in one private space.
        </p>
        <div className="landing-hero-cta">
          <Link className="button-primary" to={ctaTo}>Get started — it takes two minutes</Link>
        </div>
      </section>

      <section className="page landing-features" aria-label="Features">
        {FEATURE_TILES.map((feature, index) => (
          <article className={`tile ${index % 2 === 0 ? "tile-accent" : "tile-muted"} landing-tile`} key={feature.id}>
            <h2 className="display-lg">{feature.title}</h2>
            <p className="body-text landing-tile-copy">{feature.description}</p>
          </article>
        ))}
      </section>

      <section className="page landing-showcase">
        <div className="card landing-showcase-card">
          <p className="eyebrow">Sample · financial score</p>
          <h2 className="mt-2 display-lg" style={{ fontSize: "24px" }}>Know where you stand, at a glance</h2>
          <p className="mt-2 body-text">
            A single score built from your emergency fund, savings habit, and cash flow — with a
            plain-language note whenever a piece is still missing. Figures shown are illustrative.
          </p>
          <div className="mt-6 flex justify-center">
            <FinancialScoreDial band="strong" basisNote="Based on 3 of 3 areas." maxPoints={100} score={78} />
          </div>
        </div>
        <div className="card landing-showcase-card">
          <p className="eyebrow">Sample · weekly trend</p>
          <h2 className="mt-2 display-lg" style={{ fontSize: "24px" }}>Watch the pattern, not just one week</h2>
          <p className="mt-2 body-text">
            Every recorded week lines up into a trend, so a single slow week doesn't read as a
            crisis. Figures shown are illustrative.
          </p>
          <div className="mt-6 landing-sample-chart" aria-hidden="true">
            <ResponsiveContainer height="100%" width="100%">
              <LineChart data={SAMPLE_TREND} margin={{ top: 8, right: 8, left: 8, bottom: 8 }}>
                <Line dataKey="value" dot={false} stroke={CHART_SERIES} strokeWidth={3} type="monotone" />
              </LineChart>
            </ResponsiveContainer>
          </div>
        </div>
      </section>

      <section className="page landing-testimonial">
        <div className="card-inverted landing-testimonial-card">
          <p className="mono-label" style={{ color: "var(--color-onyx)" }}>Why it's different</p>
          <h2 className="display-lg mt-2" style={{ color: "var(--color-onyx)" }}>Built around income that moves, not a fixed paycheque</h2>
          <p className="body-text mt-2" style={{ color: "var(--color-onyx)" }}>
            Every figure here — the score, the weekly totals, the emergency-fund coverage — comes
            from what you record, not a guessed average. Your data stays private to your account.
          </p>
        </div>
      </section>

      <footer className="page landing-footer">
        <p className="body-text">Ready when you are — set up takes about two minutes.</p>
      </footer>
    </div>
  );
}
