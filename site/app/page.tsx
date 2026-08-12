"use client";

import { useEffect, useState } from "react";

const stages = [
  { label: "Evidence gate", detail: "3 independent signals · 2 official", tone: "verified" },
  { label: "Policy check", detail: "290 bps deviation · limit respected", tone: "verified" },
  { label: "KeeperHub simulation", detail: "wouldRevert: false · gas sponsored", tone: "verified" },
  { label: "Onchain execution", detail: "Idempotent broadcast · receipt verified", tone: "verified" },
] as const;

const sources = [
  { name: "Protocol Oracle", type: "OFFICIAL", price: "$0.972", delta: "−280 bps" },
  { name: "Independent DEX TWAP", type: "MARKET", price: "$0.968", delta: "−320 bps" },
  { name: "Risk Council", type: "OFFICIAL", price: "$0.971", delta: "−290 bps" },
];

export default function Home() {
  const [activeStage, setActiveStage] = useState(3);
  const [running, setRunning] = useState(false);

  useEffect(() => {
    if (!running) return;
    setActiveStage(-1);
    let stage = -1;
    const timer = window.setInterval(() => {
      stage += 1;
      setActiveStage(stage);
      if (stage >= stages.length - 1) {
        window.clearInterval(timer);
        setRunning(false);
      }
    }, 720);
    return () => window.clearInterval(timer);
  }, [running]);

  return (
    <main>
      <nav className="nav shell" aria-label="Primary navigation">
        <a className="brand" href="#top" aria-label="KeeperGuard home">
          <span className="brandMark">KG</span>
          <span>KEEPERGUARD</span>
        </a>
        <div className="navMeta">
          <span className="network"><i /> BASE SEPOLIA</span>
          <a href="https://github.com/ChunhuoQ/keeperguard" target="_blank" rel="noreferrer">SOURCE ↗</a>
        </div>
      </nav>

      <section className="hero shell" id="top">
        <div className="eyebrow"><span>01</span> AUTONOMOUS TREASURY DEFENSE</div>
        <h1>Evidence first.<br /><em>Execution guaranteed.</em></h1>
        <p className="heroCopy">
          KeeperGuard confirms onchain risk across independent sources, enforces treasury policy,
          then routes a safe, auditable response through KeeperHub.
        </p>
        <div className="heroActions">
          <button className="primary" onClick={() => setRunning(true)} disabled={running}>
            {running ? "RUNNING INCIDENT…" : "RUN INCIDENT REPLAY"}<span>→</span>
          </button>
          <a className="secondary" href="#proof">VIEW EXECUTION PROOF</a>
        </div>
        <div className="heroStamp" aria-hidden="true">
          <span>290</span>
          <small>BPS<br />DEPEG</small>
        </div>
      </section>

      <section className="console shell" aria-label="Incident execution console">
        <header className="consoleHeader">
          <div><span className="pulse" /> INCIDENT KG-2026-0812-01</div>
          <span>{running ? "PROCESSING" : "VERIFIED"}</span>
        </header>

        <div className="consoleGrid">
          <div className="signals">
            <p className="sectionLabel">LIVE SIGNALS</p>
            {sources.map((source, index) => (
              <article className={`signalCard ${index <= activeStage || activeStage >= 0 ? "visible" : ""}`} key={source.name}>
                <div><strong>{source.name}</strong><span>{source.type}</span></div>
                <div><b>{source.price}</b><em>{source.delta}</em></div>
              </article>
            ))}
            <div className="median">
              <span>MEDIAN CONFIRMED PRICE</span><strong>$0.971</strong>
            </div>
          </div>

          <div className="decision">
            <p className="sectionLabel">AGENT DECISION</p>
            <div className="riskDial">
              <span>RISK SCORE</span>
              <strong>100<small>/100</small></strong>
              <div><i /></div>
            </div>
            <dl>
              <div><dt>Policy</dt><dd>Stablecoin deviation &gt; 100 bps</dd></div>
              <div><dt>Action</dt><dd>ESCAPE TRANSFER</dd></div>
              <div><dt>Amount</dt><dd>Policy-capped</dd></div>
              <div><dt>Route</dt><dd>KeeperHub / sponsored</dd></div>
            </dl>
            <div className="decisionBadge">APPROVED BY POLICY</div>
          </div>

          <div className="execution">
            <p className="sectionLabel">EXECUTION PIPELINE</p>
            <ol>
              {stages.map((stage, index) => (
                <li className={index <= activeStage ? "done" : index === activeStage + 1 && running ? "current" : ""} key={stage.label}>
                  <span>{index <= activeStage ? "✓" : String(index + 1).padStart(2, "0")}</span>
                  <div><strong>{stage.label}</strong><small>{stage.detail}</small></div>
                </li>
              ))}
            </ol>
          </div>
        </div>
      </section>

      <section className="proof shell" id="proof">
        <div className="eyebrow"><span>02</span> CRYPTOGRAPHIC RECEIPT</div>
        <div className="proofGrid">
          <div>
            <h2>A request is not proof.<br />A verified receipt is.</h2>
            <p>KeeperGuard treats queued, simulated, broadcast and confirmed as different states. It never converts a timeout into failure and never retries an uncertain transfer under a new key.</p>
          </div>
          <article className="receipt">
            <header><span>KEEPERHUB EXECUTION</span><b>VERIFIED</b></header>
            <dl>
              <div><dt>Network</dt><dd>Base Sepolia · 84532</dd></div>
              <div><dt>Status</dt><dd>completed</dd></div>
              <div><dt>Receipt</dt><dd>success · verified: true</dd></div>
              <div><dt>Idempotency</dt><dd>intent-derived SHA-256</dd></div>
              <div><dt>Block</dt><dd>45,379,847</dd></div>
              <div><dt>Gas</dt><dd>80,521 · KeeperHub sponsored</dd></div>
              <div><dt>Transaction</dt><dd><a className="proofLink" href="https://sepolia.basescan.org/tx/0x66446f82f1bc62733e7694363b8c3f89f294e829b07ffbdd7e097f0a24778a2a" target="_blank" rel="noreferrer">0x66446f…778a2a ↗</a></dd></div>
            </dl>
          </article>
        </div>
      </section>

      <section className="principles shell">
        <article><span>01</span><h3>Evidence gated</h3><p>One noisy feed can alert. It cannot move funds.</p></article>
        <article><span>02</span><h3>Policy bounded</h3><p>Every response has explicit asset, amount and chain limits.</p></article>
        <article><span>03</span><h3>Crash safe</h3><p>Intent is persisted before broadcast; ambiguous means stop.</p></article>
        <article><span>04</span><h3>Fully auditable</h3><p>Signal, simulation, transaction and receipt share one timeline.</p></article>
      </section>

      <footer className="shell">
        <div className="brand"><span className="brandMark">KG</span><span>KEEPERGUARD</span></div>
        <p>Built for Agents Onchain · Executed by KeeperHub</p>
        <span>2026</span>
      </footer>
    </main>
  );
}
