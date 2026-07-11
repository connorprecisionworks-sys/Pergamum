/* PrmptKit — "The Client Side" v3. Clean light product film. 16:9, ~31s.
   POV: showing the CREATOR what their client experiences.
   Flow: typewriter hook (white) → tap the Instagram link → sign up & share info
   → use the prompt → get nudged (creator-customizable) → the insights that land
   on the creator's dashboard (zoom-out explainer) → CTA.
   Presentation: one app "screen", all four rounded corners visible, floating on a
   blue↔white grainy gradient; camera pushes into what matters. One uniform sans,
   near-black on pure white. Original UI (not a copy of any product's chrome). */
const { Stage, Sprite, useSprite, Easing, interpolate, animate, clamp } = window;
const useTimeline = window.useTimeline;

// ── Palette ────────────────────────────────────────────
const INK      = "#0D0D0F";
const INK_SOFT = "#3A3A40";
const MUTED    = "#8C8A93";
const FAINT    = "#B7B5BC";
const HAIR     = "#ECECEC";
const HAIR2    = "#E4E4E4";
const PAPER    = "#FFFFFF";
const PANEL    = "#FFFFFF";
const ACCENT   = "#0D0D0F";   // unified black accent
const ACCENT_T = "rgba(13,13,15,0.10)";
const GREEN    = "#3F8F6B";

const UI    = '"Söhne", ui-sans-serif, system-ui, -apple-system, "Segoe UI", Helvetica, Arial, sans-serif';
const SERIF = UI, SANS = UI, MONO = UI;
const MARK  = "src/logo-white.png"; // white glyph → invert(1) for black-on-white
const PACK  = "src/pack-cover.png";

const W = 1920, H = 1080, DUR = 46;

const Logo = ({ size = 30 }) => <img src={MARK} alt="" style={{ width: size, height: size, objectFit: "contain", filter: "invert(1)" }} />;

// ── Ambient blue↔white grainy backdrop ─────────────────
function Ambient() {
  return (
    <div style={{ position: "absolute", inset: 0, background: "linear-gradient(133deg, #FFFFFF 0%, #F1F6F9 26%, #CFE4EF 60%, #A9D0E3 100%)", overflow: "hidden" }}>
      <div style={{ position: "absolute", inset: 0, background: "radial-gradient(62% 60% at 20% 16%, rgba(255,255,255,0.9), transparent 60%)" }} />
      <div style={{ position: "absolute", inset: 0, background: "radial-gradient(70% 60% at 96% 96%, rgba(120,180,210,0.35), transparent 62%)" }} />
      <svg style={{ position: "absolute", inset: 0, width: "100%", height: "100%", opacity: 0.11, mixBlendMode: "overlay" }} xmlns="http://www.w3.org/2000/svg"><filter id="cjGrain"><feTurbulence type="fractalNoise" baseFrequency="0.82" numOctaves="2" stitchTiles="stitch" /></filter><rect width="100%" height="100%" filter="url(#cjGrain)" /></svg>
    </div>
  );
}

// ── Desktop screen (all corners visible, camera push) ──
function Screen({ cam = { s: 1, ox: 50, oy: 50 }, lift = 0, tilt = 0, children }) {
  const sw = 1560, sh = 878;
  return (
    <div style={{ position: "absolute", left: "50%", top: "50%", width: sw, height: sh,
      transform: `translate(-50%,-50%) translateY(${lift}px) perspective(2200px) rotateX(${tilt}deg) scale(${cam.s})`,
      transformOrigin: `${cam.ox}% ${cam.oy}%`, willChange: "transform" }}>
      <div style={{ position: "absolute", inset: 0, borderRadius: 26, background: PAPER, overflow: "hidden",
        boxShadow: "0 2px 6px rgba(28,30,40,0.06), 0 30px 60px rgba(28,30,40,0.14), 0 80px 140px rgba(28,30,40,0.18)",
        border: "1px solid rgba(255,255,255,0.7)" }}>{children}</div>
    </div>
  );
}

// ── iOS status bar (dynamic island + time + indicators) ─
function StatusBar() {
  return (
    <div style={{ position: "absolute", top: 0, left: 0, right: 0, height: 54, zIndex: 6, fontFamily: UI, color: INK }}>
      <span style={{ position: "absolute", left: 32, top: 15, fontSize: 17, fontWeight: 600, letterSpacing: "0.02em" }}>11:30</span>
      <div style={{ position: "absolute", left: "50%", top: 12, transform: "translateX(-50%)", width: 116, height: 33, borderRadius: 9999, background: "#0D0D0F" }} />
      <div style={{ position: "absolute", right: 28, top: 18, display: "flex", alignItems: "center", gap: 7 }}>
        <svg width="20" height="14" viewBox="0 0 20 14"><g fill={INK}><rect x="0" y="9" width="3.2" height="5" rx="1" /><rect x="5" y="6.5" width="3.2" height="7.5" rx="1" /><rect x="10" y="3.5" width="3.2" height="10.5" rx="1" /><rect x="15" y="0.5" width="3.2" height="13.5" rx="1" /></g></svg>
        <svg width="18" height="14" viewBox="0 0 18 14" fill="none"><path d="M9 12.6l2.3-2.7a3 3 0 00-4.6 0L9 12.6z" fill={INK} /><path d="M4.1 7.3a7 7 0 019.8 0" stroke={INK} strokeWidth="1.8" strokeLinecap="round" /><path d="M1.7 4.6a10.5 10.5 0 0114.6 0" stroke={INK} strokeWidth="1.8" strokeLinecap="round" /></svg>
        <div style={{ display: "flex", alignItems: "center", gap: 2 }}>
          <div style={{ width: 25, height: 13, borderRadius: 3.5, border: `1.5px solid ${INK}`, padding: 1.5, boxSizing: "border-box" }}><div style={{ width: "80%", height: "100%", borderRadius: 1.5, background: INK }} /></div>
          <div style={{ width: 2, height: 5, borderRadius: 1, background: INK }} />
        </div>
      </div>
    </div>
  );
}

// ── Phone screen (all corners visible) ─────────────────
function PhoneScreen({ cam = { s: 1, ox: 50, oy: 50 }, lift = 0, children }) {
  const w = 432, h = 884;
  return (
    <div style={{ position: "absolute", left: "50%", top: "50%", width: w, height: h,
      transform: `translate(-50%,-50%) translateY(${lift}px) scale(${cam.s})`, transformOrigin: `${cam.ox}% ${cam.oy}%`, willChange: "transform" }}>
      <div style={{ position: "absolute", inset: 0, borderRadius: 52, background: PAPER, overflow: "hidden",
        boxShadow: "0 2px 6px rgba(28,30,40,0.06), 0 34px 80px rgba(28,30,40,0.22)", border: "1px solid rgba(255,255,255,0.7)" }}>
        {children}
        <StatusBar />
      </div>
    </div>
  );
}

// ── Purple ambient (phone scene, per reference) ────────
function PurpleAmbient() {
  return (
    <div style={{ position: "absolute", inset: 0, background: "linear-gradient(155deg, #8072EC 0%, #6E5FE0 46%, #5E50CE 100%)", overflow: "hidden" }}>
      <div style={{ position: "absolute", inset: 0, background: "radial-gradient(58% 52% at 26% 18%, rgba(255,255,255,0.22), transparent 60%)" }} />
      <div style={{ position: "absolute", inset: 0, background: "radial-gradient(80% 70% at 88% 108%, rgba(40,30,90,0.45), transparent 60%)" }} />
      <svg style={{ position: "absolute", inset: 0, width: "100%", height: "100%", opacity: 0.1, mixBlendMode: "overlay" }} xmlns="http://www.w3.org/2000/svg"><filter id="cjGrainP"><feTurbulence type="fractalNoise" baseFrequency="0.82" numOctaves="2" stitchTiles="stitch" /></filter><rect width="100%" height="100%" filter="url(#cjGrainP)" /></svg>
    </div>
  );
}

// ── App chrome ─────────────────────────────────────────
function AppFrame({ active = "Browse", crumb, children, dim = 0 }) {
  const nav = ["Home", "Browse", "Library", "Following"];
  return (
    <div style={{ position: "absolute", inset: 0, display: "flex", fontFamily: UI, color: INK }}>
      <div style={{ width: 248, background: PANEL, borderRight: `1px solid ${HAIR}`, padding: "26px 18px", display: "flex", flexDirection: "column", gap: 6 }}>
        <div style={{ display: "flex", alignItems: "center", gap: 10, padding: "2px 10px 22px" }}>
          <Logo size={34} />
          <span style={{ fontFamily: UI, fontWeight: 600, fontSize: 24, letterSpacing: "-0.02em" }}>prmpt</span>
        </div>
        {nav.map((n) => (
          <div key={n} style={{ height: 42, display: "flex", alignItems: "center", padding: "0 12px", borderRadius: 9, fontSize: 16, fontWeight: n === active ? 600 : 400, color: n === active ? INK : MUTED, background: n === active ? "#F3F3F3" : "transparent" }}>{n}</div>
        ))}
        <div style={{ marginTop: "auto", display: "flex", alignItems: "center", gap: 10, padding: "10px 8px", borderTop: `1px solid ${HAIR}` }}>
          <span style={{ width: 32, height: 32, borderRadius: "50%", background: "#EDECEA", display: "inline-flex", alignItems: "center", justifyContent: "center", fontFamily: UI, fontSize: 13, color: "#605E67" }}>JD</span>
          <span style={{ fontSize: 15, color: INK_SOFT }}>Jordan D.</span>
        </div>
      </div>
      <div style={{ flex: 1, position: "relative", overflow: "hidden" }}>
        <div style={{ height: 64, borderBottom: `1px solid ${HAIR}`, display: "flex", alignItems: "center", padding: "0 34px", gap: 10 }}>
          <span style={{ fontFamily: UI, fontSize: 13, letterSpacing: "0.02em", color: MUTED }}>{crumb}</span>
          <div style={{ marginLeft: "auto", width: 260, height: 38, borderRadius: 9, border: `1px solid ${HAIR2}`, display: "flex", alignItems: "center", padding: "0 14px", gap: 9, color: FAINT, fontSize: 14 }}>
            <span style={{ width: 12, height: 12, border: `1.5px solid ${FAINT}`, borderRadius: "50%", position: "relative" }}><span style={{ position: "absolute", right: -4, bottom: -3, width: 6, height: 1.5, background: FAINT, transform: "rotate(45deg)" }} /></span>
            Search prompts
          </div>
        </div>
        <div style={{ position: "absolute", left: 0, right: 0, top: 64, bottom: 0 }}>{children}</div>
        {dim > 0 && <div style={{ position: "absolute", inset: 0, background: "rgba(20,20,24,0.28)", opacity: dim }} />}
      </div>
    </div>
  );
}

// ── Cursor ─────────────────────────────────────────────
function Cursor({ x, y, press }) {
  return (
    <svg width="42" height="50" viewBox="0 0 24 28" style={{ position: "absolute", left: x, top: y, filter: "drop-shadow(0 4px 8px rgba(0,0,0,0.25))", transform: `scale(${press ? 0.85 : 1})`, transition: "transform 90ms" }}>
      <path d="M2 2 L2 22 L8 17 L12 25 L15 23 L11 15 L19 15 Z" fill="#fff" stroke="#0D0D0F" strokeWidth="1.5" strokeLinejoin="round" />
    </svg>
  );
}

// ── Field chip ─────────────────────────────────────────
function Field({ value, placeholder, active }) {
  const filled = !!value;
  return (
    <span style={{ display: "inline-block", minWidth: 90, height: 46, lineHeight: "44px", padding: "0 15px", borderRadius: 11, border: `${active ? 2 : 1}px ${filled || active ? "solid" : "dashed"} ${active ? ACCENT : filled ? HAIR2 : "#D8D8D8"}`, background: filled ? "#FFFFFF" : "transparent", color: filled ? INK : FAINT, fontSize: 23, verticalAlign: "baseline", boxShadow: active ? `0 0 0 5px ${ACCENT_T}` : "none" }}>
      {value || placeholder}{active && <span style={{ display: "inline-block", width: 2, height: 24, background: ACCENT, marginLeft: 3, verticalAlign: "middle" }} />}
    </span>
  );
}

// ── Prompt workspace ───────────────────────────────────
function PromptWorkspace({ f1, f2, f3, a1, a2, a3, copy, offer, custom }) {
  const nFilled = [f1, f2, f3].filter(Boolean).length;
  return (
    <div style={{ position: "absolute", inset: 0, display: "flex", flexDirection: "column", background: PAPER }}>
      <div style={{ padding: "40px 60px 0" }}>
        <div style={{ fontFamily: UI, fontSize: 14, letterSpacing: "0.1em", textTransform: "uppercase", color: MUTED, marginBottom: 18 }}>Sales · Cold email</div>
        <h1 style={{ fontFamily: UI, fontWeight: 600, fontSize: 50, lineHeight: 1.0, letterSpacing: "-0.03em", margin: "0 0 16px" }}>Cold outreach that gets replies</h1>
        <div style={{ display: "flex", alignItems: "center", gap: 12, paddingBottom: 24, borderBottom: `1px solid ${HAIR}` }}>
          <span style={{ width: 30, height: 30, borderRadius: "50%", background: "#EDECEA", display: "inline-flex", alignItems: "center", justifyContent: "center", fontFamily: UI, fontSize: 12, color: "#605E67" }}>CN</span>
          <span style={{ fontFamily: UI, fontSize: 14, color: INK_SOFT }}>@connor</span>
          <span style={{ fontFamily: UI, fontSize: 13, color: FAINT }}>· 4.2k uses</span>
        </div>
      </div>
      <div style={{ padding: "30px 60px 0", flex: 1 }}>
        <div style={{ fontFamily: UI, fontSize: 13, letterSpacing: "0.02em", color: FAINT, marginBottom: 22 }}>{nFilled} of 3 fields filled</div>
        <div style={{ fontFamily: UI, fontWeight: 400, fontSize: 30, lineHeight: 1.9, letterSpacing: "-0.01em", color: "#1B1A1F" }}>
          Write a cold email to <Field value={f1} placeholder="a role…" active={a1} /> at <Field value={f2} placeholder="company…" active={a2} /> offering <Field value={f3} placeholder="your offer…" active={a3} />. Under 90 words, one clear ask, no flattery.
        </div>
      </div>
      <div style={{ display: "flex", alignItems: "center", gap: 16, padding: "24px 60px 34px", borderTop: `1px solid ${HAIR}` }}>
        <button style={{ height: 58, padding: "0 34px", border: "none", borderRadius: 12, background: copy === "done" ? GREEN : INK, color: "#fff", fontFamily: UI, fontWeight: 600, fontSize: 20, transform: copy === "press" ? "scale(0.97)" : "scale(1)", transition: "transform 120ms", boxShadow: copy === "press" ? `0 0 0 8px ${ACCENT_T}` : "none" }}>{copy === "done" ? "✓ Copied" : "Copy prompt"}</button>
        <div style={{ display: "flex", gap: 8, marginLeft: 4 }}>
          {["ChatGPT", "Claude", "Gemini"].map((m) => (<span key={m} style={{ height: 44, display: "inline-flex", alignItems: "center", padding: "0 15px", borderRadius: 10, border: `1px solid ${HAIR2}`, fontFamily: UI, fontSize: 13, color: INK_SOFT }}>{m}</span>))}
        </div>
        <span style={{ marginLeft: "auto", fontSize: 15, color: MUTED }}>Save</span>
      </div>
      {offer > 0 && (
        <div style={{ position: "absolute", left: 60, right: 60, bottom: 34, transform: `translateY(${(1 - offer) * 60}px)`, opacity: offer, background: "#fff", border: `1px solid ${HAIR2}`, borderRadius: 16, padding: "22px 26px", boxShadow: "0 20px 50px rgba(28,30,40,0.16)", display: "flex", alignItems: "center", gap: 18 }}>
          <span style={{ width: 46, height: 46, borderRadius: "50%", background: "#EDECEA", display: "inline-flex", alignItems: "center", justifyContent: "center", fontFamily: UI, fontSize: 14, color: "#605E67", flex: "none" }}>CN</span>
          <div style={{ flex: 1, fontSize: 19, lineHeight: 1.5, color: "#26252B" }}>I run this on live deals every week. Want me to look at <b>your</b> pipeline for 30 min? <span style={{ color: MUTED }}>— @connor</span></div>
          <button style={{ height: 48, padding: "0 22px", border: "none", borderRadius: 11, background: INK, color: "#fff", fontFamily: UI, fontWeight: 600, fontSize: 16, flex: "none" }}>Book 30 min</button>
        </div>
      )}
    </div>
  );
}

// ── Instagram body (phone) ─────────────────────────────
function InstaBody({ tapT }) {
  const press = tapT > 0.6 && tapT < 0.86;
  const active = tapT > 0.5;
  const cx = interpolate([0, 0.55], [250, 150], Easing.easeInOutCubic)(clamp(tapT, 0, 0.55));
  const cy = interpolate([0, 0.55], [724, 664], Easing.easeInOutCubic)(clamp(tapT, 0, 0.55));
  return (
    <div style={{ position: "absolute", inset: 0, background: "#fff", color: INK, fontFamily: UI, paddingTop: 56 }}>
      {/* post header */}
      <div style={{ height: 58, display: "flex", alignItems: "center", padding: "0 18px", gap: 11 }}>
        <span style={{ width: 42, height: 42, borderRadius: "50%", background: "#EDECEA", flex: "none" }} />
        <div style={{ lineHeight: 1.2 }}>
          <div style={{ display: "flex", alignItems: "center", gap: 6 }}><span style={{ fontWeight: 600, fontSize: 17 }}>connor.builds</span><span style={{ color: "#3897f0", fontSize: 15 }}>✔</span></div>
          <div style={{ fontSize: 13, color: MUTED }}>Founder · sales coach</div>
        </div>
        <span style={{ marginLeft: "auto", fontSize: 22, color: MUTED }}>⋯</span>
      </div>
      {/* media */}
      <div style={{ height: 452, overflow: "hidden", background: "#120a06" }}>
        <img src={PACK} alt="" style={{ width: "100%", height: "100%", objectFit: "cover", display: "block" }} />
      </div>
      {/* actions */}
      <div style={{ display: "flex", alignItems: "center", gap: 20, padding: "14px 18px 4px", fontSize: 25, color: INK }}>
        <span>♡</span><span>💬</span><span>↗</span><span style={{ marginLeft: "auto" }}>⚑</span>
      </div>
      <div style={{ padding: "0 18px", fontWeight: 600, fontSize: 15 }}>2,418 likes</div>
      {/* caption with the link */}
      <div style={{ padding: "8px 18px 0", fontSize: 15, lineHeight: 1.5, color: INK }}>
        <span style={{ fontWeight: 600 }}>connor.builds</span> 12 Claude prompts for founders — grab them free 👇
        <div style={{ marginTop: 12, display: "inline-flex", alignItems: "center", gap: 8, height: 44, padding: "0 15px", borderRadius: 11, border: `1.5px solid ${active ? INK : HAIR2}`, background: active ? "#F3F3F3" : "#fff", transform: press ? "scale(0.97)" : "scale(1)", transition: "transform 90ms", fontWeight: 600 }}>
          <span style={{ fontSize: 16 }}>🔗</span><span style={{ fontSize: 17 }}>prmpt.to/connor</span>
        </div>
      </div>
      <Cursor x={cx} y={cy} press={press} />
    </div>
  );
}

// ── Sign-up body (info capture) ────────────────────────
function SignupBody({ t }) {
  const roleT = clamp((t - 1.6) / 0.6, 0, 1);
  const senT = clamp((t - 2.4) / 0.6, 0, 1);
  const chip = (label, on) => (
    <span style={{ height: 40, display: "inline-flex", alignItems: "center", padding: "0 15px", borderRadius: 10, fontSize: 16, fontWeight: on ? 600 : 400, color: on ? "#fff" : INK_SOFT, background: on ? INK : "transparent", border: on ? "none" : `1px solid ${HAIR2}` }}>{label}</span>
  );
  return (
    <div style={{ position: "absolute", inset: 0, background: PAPER, display: "flex", alignItems: "center", justifyContent: "center" }}>
      <div style={{ width: 620 }}>
        <h1 style={{ fontFamily: UI, fontWeight: 600, fontSize: 40, letterSpacing: "-0.03em", margin: "0 0 8px" }}>Keep it in your toolbox</h1>
        <p style={{ fontSize: 17, color: MUTED, margin: "0 0 30px" }}>You&#8217;ve already used it. Sign up to save it &amp; get @connor&#8217;s new prompts free — or skip.</p>
        <div style={{ display: "flex", flexDirection: "column", gap: 16 }}>
          <div style={{ height: 54, borderRadius: 12, border: `1px solid ${HAIR2}`, display: "flex", alignItems: "center", padding: "0 16px", fontSize: 17, color: INK }}>Jordan Diaz</div>
          <div style={{ height: 54, borderRadius: 12, border: `1px solid ${HAIR2}`, display: "flex", alignItems: "center", padding: "0 16px", fontSize: 17, color: INK }}>jordan@northstar.io</div>
          <div>
            <div style={{ fontSize: 14, color: MUTED, marginBottom: 10 }}>Your role</div>
            <div style={{ display: "flex", gap: 9, flexWrap: "wrap" }}>{chip("Founder", roleT > 0.5)}{chip("Sales", false)}{chip("Marketing", false)}{chip("Ops", false)}</div>
          </div>
          <div>
            <div style={{ fontSize: 14, color: MUTED, marginBottom: 10 }}>Seniority</div>
            <div style={{ display: "flex", gap: 9, flexWrap: "wrap" }}>{chip("IC", false)}{chip("Manager", false)}{chip("VP / Head", senT > 0.5)}{chip("C-level", false)}</div>
          </div>
        </div>
        <button style={{ marginTop: 30, height: 56, width: "100%", border: "none", borderRadius: 12, background: INK, color: "#fff", fontFamily: UI, fontWeight: 600, fontSize: 18 }}>Save &amp; continue</button>
        <div style={{ textAlign: "center", marginTop: 16 }}><span style={{ fontSize: 15, color: MUTED }}>Skip for now</span></div>
      </div>
    </div>
  );
}

// ── Creator dashboard w/ insight panel ─────────────────
function InsightRow({ t, appear, name, meta, need, tag }) {
  const e = Easing.easeOutCubic(clamp((t - appear) / 0.5, 0, 1));
  const tc = tag === "BOOKED" ? GREEN : INK;
  return (
    <div style={{ opacity: e, transform: `translateY(${(1 - e) * 16}px)`, display: "flex", alignItems: "center", gap: 16, padding: "16px 4px", borderBottom: `1px solid ${HAIR}` }}>
      <span style={{ width: 40, height: 40, borderRadius: "50%", background: "#EDECEA", flex: "none", display: "inline-flex", alignItems: "center", justifyContent: "center", fontFamily: UI, fontSize: 13, color: "#605E67" }}>{name.split(" ").map((x) => x[0]).join("")}</span>
      <div style={{ flex: 1 }}>
        <div style={{ fontFamily: UI, fontWeight: 600, fontSize: 18 }}>{name}</div>
        <div style={{ fontSize: 14, color: MUTED, marginTop: 2 }}>{meta}</div>
      </div>
      <span style={{ fontSize: 13, color: INK_SOFT, background: "#F3F3F3", borderRadius: 7, padding: "5px 11px", marginRight: 8 }}>{need}</span>
      <span style={{ fontFamily: UI, fontSize: 12, letterSpacing: "0.06em", color: tc, border: `1px solid ${tc}`, borderRadius: 6, padding: "4px 9px" }}>{tag}</span>
    </div>
  );
}
function Dashboard({ t, count }) {
  return (
    <div style={{ position: "absolute", inset: 0, background: PAPER, padding: "40px 56px", display: "flex", gap: 48 }}>
      <div style={{ width: 360 }}>
        <div style={{ fontFamily: UI, fontSize: 13, letterSpacing: "0.1em", textTransform: "uppercase", color: MUTED, marginBottom: 18 }}>Your dashboard · today</div>
        <div style={{ fontFamily: UI, fontWeight: 600, fontSize: 150, lineHeight: 0.86, letterSpacing: "-0.05em", color: INK }}>+{count}</div>
        <div style={{ fontFamily: UI, fontSize: 15, letterSpacing: "0.06em", textTransform: "uppercase", color: MUTED, marginTop: 14 }}>new leads · from one link</div>
        <div style={{ fontFamily: UI, fontWeight: 600, fontSize: 30, lineHeight: 1.15, letterSpacing: "-0.02em", color: INK, marginTop: 30, maxWidth: "16ch" }}>You see who they are and what they need.</div>
      </div>
      <div style={{ flex: 1, borderLeft: `1px solid ${HAIR}`, paddingLeft: 40 }}>
        <div style={{ fontFamily: UI, fontSize: 13, letterSpacing: "0.08em", textTransform: "uppercase", color: FAINT, marginBottom: 6 }}>Coming in live · who &amp; what</div>
        <InsightRow t={t} appear={0.4} name="Jordan Diaz" meta="Founder · VP/Head · Northstar (SaaS)" need="Cold outreach" tag="BOOKED" />
        <InsightRow t={t} appear={0.8} name="Maya Okonkwo" meta="Marketing · Manager · Series B" need="Better content" tag="FOLLOWED" />
        <InsightRow t={t} appear={1.2} name="Devin Ross" meta="Sales · IC · Agency" need="Close faster" tag="COPIED" />
        <InsightRow t={t} appear={1.6} name="Priya Shah" meta="Ops · Head · Enterprise" need="Automate" tag="FOLLOWED" />
      </div>
    </div>
  );
}

// ══════════════════════════════════════════════════════
// typing SFX — tiny key click on each new character (forward only)
let _actx;
function keyClick() {
  try {
    if (typeof document !== "undefined" && (document.hidden || (document.hasFocus && !document.hasFocus()))) return;
    if (!_actx) _actx = new (window.AudioContext || window.webkitAudioContext)();
    if (_actx.state === "suspended") _actx.resume();
    const t = _actx.currentTime;
    // low body thump
    const o = _actx.createOscillator();
    const g = _actx.createGain();
    o.type = "sine";
    o.frequency.value = 142 + Math.random() * 30;
    g.gain.setValueAtTime(0.0001, t);
    g.gain.exponentialRampToValueAtTime(0.07, t + 0.004);
    g.gain.exponentialRampToValueAtTime(0.0001, t + 0.06);
    o.connect(g); g.connect(_actx.destination);
    o.start(t); o.stop(t + 0.07);
    // clacky noise tick through a bandpass
    const len = Math.floor(_actx.sampleRate * 0.03);
    const nb = _actx.createBuffer(1, len, _actx.sampleRate);
    const dch = nb.getChannelData(0);
    for (let i = 0; i < len; i++) dch[i] = (Math.random() * 2 - 1) * (1 - i / len);
    const ns = _actx.createBufferSource(); ns.buffer = nb;
    const bp = _actx.createBiquadFilter(); bp.type = "bandpass"; bp.frequency.value = 2100 + Math.random() * 400; bp.Q.value = 0.9;
    const ng = _actx.createGain();
    ng.gain.setValueAtTime(0.075, t);
    ng.gain.exponentialRampToValueAtTime(0.0001, t + 0.03);
    ns.connect(bp); bp.connect(ng); ng.connect(_actx.destination);
    ns.start(t); ns.stop(t + 0.035);
  } catch (e) {}
}
function useTypeSound(count) {
  const prev = React.useRef(count);
  React.useEffect(() => {
    const d = count - prev.current;
    if (d > 0 && d <= 3) keyClick();
    prev.current = count;
  }, [count]);
}

// ══════════════════════════════════════════════════════
// S0 — typewriter on white (Apple/ChatGPT calm)
function SceneType() {
  const { localTime } = useSprite();
  const prefix = "Turn a comment into a ";
  const word = "client.";
  const full = prefix + word;
  const n = Math.floor(interpolate([0.5, 2.58], [0, full.length], Easing.linear)(localTime));
  useTypeSound(Math.max(0, Math.min(n, full.length)));
  const shimmer = (localTime * 26) % 220;
  const iri = { backgroundImage: "linear-gradient(100deg,#a9c7ff,#f7c9ec,#c3f0dd,#fff0bf,#dcc4ff,#a9c7ff)", backgroundSize: "220% 100%", backgroundPosition: shimmer + "% 50%", WebkitBackgroundClip: "text", backgroundClip: "text", color: "transparent", WebkitTextFillColor: "transparent" };
  let body;
  if (n <= prefix.length) {
    body = <span>{prefix.slice(0, Math.max(0, n))}</span>;
  } else {
    body = <span>{prefix}<span style={iri}>{word.slice(0, n - prefix.length)}</span></span>;
  }
  return (
    <div style={{ position: "absolute", inset: 0, background: "#FFFFFF", display: "flex", alignItems: "center", justifyContent: "center", padding: "0 120px" }}>
      <div style={{ fontFamily: UI, fontWeight: 600, fontSize: 82, letterSpacing: "-0.035em", color: INK, textAlign: "center", lineHeight: 1.04, maxWidth: 1300 }}>
        {body}
      </div>
    </div>
  );
}

// generic white typewriter card
function TypeBody({ text, localTime, dur }) {
  const n = Math.floor(interpolate([0.5, dur], [0, text.length], Easing.linear)(localTime));
  useTypeSound(Math.max(0, Math.min(n, text.length)));
  return (
    <div style={{ position: "absolute", inset: 0, background: "#FFFFFF", display: "flex", alignItems: "center", justifyContent: "center", padding: "0 140px" }}>
      <div style={{ fontFamily: UI, fontWeight: 600, fontSize: 74, letterSpacing: "-0.035em", color: INK, textAlign: "center", lineHeight: 1.12, maxWidth: 1300 }}>
        {text.slice(0, Math.max(0, n))}
      </div>
    </div>
  );
}
function SceneCustom() { const { localTime } = useSprite(); return <TypeBody text="Every prompt, fully customizable." localTime={localTime} dur={2.34} />; }
function SceneMarket() { const { localTime } = useSprite(); return <TypeBody text="See what your clients actually use." localTime={localTime} dur={2.18} />; }
function SceneLogo() {
  const { localTime, duration } = useSprite();
  // IN: spring pop with overshoot + blur clearing + slight settle-rotate
  const tin = clamp(localTime / 0.85, 0, 1);
  const bo = (t) => { const c1 = 1.70158, c3 = c1 + 1, p = t - 1; return 1 + c3 * p * p * p + c1 * p * p; };
  const ein = bo(tin);
  const eio = Easing.easeOutCubic(tin);
  // OUT: zoom-through — scale up, lift, blur & fade away
  const tout = clamp((localTime - (duration - 0.7)) / 0.7, 0, 1);
  const eout = tout * tout;
  const scale = (0.72 + 0.28 * ein) * (1 + 0.6 * eout);
  const ty = (1 - eio) * 34 - eout * 46;
  const rot = (1 - eio) * -10 + eout * 5;
  const blur = (1 - tin) * 16 + eout * 10;
  const op = 1 - eout;
  return (
    <div style={{ position: "absolute", inset: 0, background: "#FFFFFF", display: "flex", alignItems: "center", justifyContent: "center" }}>
      <div style={{ transform: `translateY(${ty}px) scale(${scale}) rotate(${rot}deg)`, filter: `blur(${blur}px)`, opacity: op }}>
        <Logo size={560} />
      </div>
    </div>
  );
}

// S1 — tap the Instagram link
function SceneInsta() {
  const { localTime } = useSprite();
  const inn = Easing.easeOutCubic(clamp(localTime / 0.9, 0, 1));
  const tapT = clamp((localTime - 1.2) / 1.5, 0, 1);
  const push = Easing.easeInOutCubic(clamp((localTime - 3.0) / 1.0, 0, 1));
  return (
    <div style={{ position: "absolute", inset: 0, overflow: "hidden" }}>
      <PurpleAmbient />
      <PhoneScreen cam={{ s: (0.96 + 0.04 * inn) * (1 + push * 0.35), ox: 34, oy: 66 }} lift={Math.sin(localTime * 0.8) * 6}>
        <InstaBody tapT={tapT} />
      </PhoneScreen>
    </div>
  );
}

// S1b — the link opens the DESKTOP web view (all corners, gradient)
function SceneReveal() {
  const { localTime } = useSprite();
  const inn = Easing.easeOutCubic(clamp(localTime / 1.0, 0, 1));
  const note = Easing.easeOutCubic(clamp((localTime - 0.8) / 0.7, 0, 1));
  return (
    <div style={{ position: "absolute", inset: 0, overflow: "hidden" }}>
      <Ambient />
      <div style={{ opacity: inn, transform: `scale(${0.93 + 0.07 * inn})`, position: "absolute", inset: 0 }}>
        <Screen cam={{ s: 1, ox: 50, oy: 50 }} lift={Math.sin(localTime * 0.7) * 6} tilt={1.6 * (1 - inn) + 0.4}>
          <AppFrame active="Browse" crumb="prmpt.to / connor / cold-outreach">
            <PromptWorkspace f1="" f2="" f3="" copy="idle" offer={0} />
          </AppFrame>
        </Screen>
      </div>
      <div style={{ position: "absolute", left: "50%", top: 48, transform: "translateX(-50%)", opacity: note, textAlign: "center" }}>
        <div style={{ display: "inline-flex", alignItems: "center", gap: 11, height: 46, padding: "0 22px", borderRadius: 9999, background: "#fff", border: `1px solid ${HAIR2}`, boxShadow: "0 12px 32px rgba(28,30,40,0.16)", fontFamily: UI, fontSize: 16, fontWeight: 600, color: INK }}>
          <span style={{ width: 9, height: 9, borderRadius: "50%", background: GREEN }} />
          Opens instantly — no sign-up to use it
        </div>
        <div style={{ marginTop: 12, fontFamily: UI, fontSize: 14, color: INK_SOFT }}>Sign up after to save it &amp; get new prompts free</div>
      </div>
    </div>
  );
}

// S2 — sign up, share info
function SceneSignup() {
  const { localTime } = useSprite();
  const inn = Easing.easeOutCubic(clamp(localTime / 0.8, 0, 1));
  return (
    <div style={{ position: "absolute", inset: 0, overflow: "hidden" }}>
      <Ambient />
      <div style={{ opacity: inn, transform: `scale(${0.97 + 0.03 * inn})`, position: "absolute", inset: 0 }}>
        <Screen cam={{ s: 1, ox: 50, oy: 50 }} lift={Math.sin(localTime * 0.7) * 5} tilt={0.4}>
          <AppFrame active="Library" crumb="prmpt.to / connor · save prompt">
            <SignupBody t={localTime} />
          </AppFrame>
        </Screen>
      </div>
    </div>
  );
}

// S3 — use the prompt (fill + copy)
function ScenePrompt() {
  const { localTime } = useSprite();
  const f1f = "a VP of Sales", f2f = "Acme, Inc.", f3f = "a 20-min teardown";
  const f1 = f1f.slice(0, Math.round(interpolate([0.5, 1.3], [0, f1f.length], Easing.linear)(localTime)));
  const f2 = f2f.slice(0, Math.round(interpolate([1.5, 2.3], [0, f2f.length], Easing.linear)(localTime)));
  const f3 = f3f.slice(0, Math.round(interpolate([2.6, 3.7], [0, f3f.length], Easing.linear)(localTime)));
  const a1 = localTime > 0.5 && localTime < 1.5, a2 = localTime > 1.5 && localTime < 2.5, a3 = localTime > 2.6 && localTime < 3.8;
  const copy = localTime > 5.0 ? "done" : (localTime > 4.5 && localTime < 5.0 ? "press" : "idle");
  const push = Easing.easeInOutCubic(clamp(localTime / 1.0, 0, 1));
  const toBtn = Easing.easeInOutCubic(clamp((localTime - 4.0) / 0.8, 0, 1));
  const s = 1 + 0.24 * push - 0.06 * toBtn;
  const oy = 52 + 44 * toBtn, ox = 52 - 22 * toBtn;
  return (
    <div style={{ position: "absolute", inset: 0, overflow: "hidden" }}>
      <Ambient />
      <Screen cam={{ s, ox, oy }} lift={Math.sin(localTime * 0.7) * 4}>
        <AppFrame active="Browse" crumb="prmpt.to / connor / cold-outreach">
          <PromptWorkspace f1={f1} f2={f2} f3={f3} a1={a1} a2={a2} a3={a3} copy={copy} offer={0} />
        </AppFrame>
      </Screen>
    </div>
  );
}

// S4 — the nudge (creator-customizable)
function SceneNudge() {
  const { localTime } = useSprite();
  const offer = Easing.easeOutCubic(clamp((localTime - 0.3) / 0.8, 0, 1));
  const s = 1.1 - 0.1 * Easing.easeInOutCubic(clamp(localTime / 1.0, 0, 1));
  const note = Easing.easeOutCubic(clamp((localTime - 1.6) / 0.7, 0, 1));
  return (
    <div style={{ position: "absolute", inset: 0, overflow: "hidden" }}>
      <Ambient />
      <Screen cam={{ s, ox: 50, oy: 90 }} lift={Math.sin(localTime * 0.7) * 4}>
        <AppFrame active="Browse" crumb="prmpt.to / connor / cold-outreach" dim={offer * 0.16}>
          <PromptWorkspace f1="a VP of Sales" f2="Acme, Inc." f3="a 20-min teardown" copy="done" offer={offer} />
        </AppFrame>
      </Screen>
      {/* creator-POV annotation: you control this nudge */}
      <div style={{ position: "absolute", right: 96, top: 150, width: 340, opacity: note, transform: `translateY(${(1 - note) * 16}px)`, textAlign: "left" }}>
        <div style={{ fontFamily: UI, fontSize: 14, letterSpacing: "0.08em", textTransform: "uppercase", color: INK_SOFT, marginBottom: 10 }}>Your nudge</div>
        <div style={{ fontFamily: UI, fontWeight: 600, fontSize: 30, lineHeight: 1.12, letterSpacing: "-0.02em", color: INK }}>It advertises for you — and you write every word.</div>
        <div style={{ marginTop: 16, display: "inline-flex", alignItems: "center", gap: 8, height: 40, padding: "0 16px", borderRadius: 10, background: "#fff", border: `1px solid ${HAIR2}`, fontFamily: UI, fontSize: 15, fontWeight: 600, color: INK, boxShadow: "0 8px 24px rgba(28,30,40,0.12)" }}>Customize nudge</div>
      </div>
    </div>
  );
}

// S5 — insights land on the creator dashboard (zoom-out explainer)
function SceneInsights() {
  const { localTime } = useSprite();
  const count = Math.round(interpolate([0.4, 2.2], [0, 12], Easing.easeOutQuart)(localTime));
  // start zoomed into the top insight row (right side), then zoom out to the whole board
  const zo = Easing.easeInOutCubic(clamp((localTime - 1.4) / 1.6, 0, 1));
  const s = 1.85 - 0.85 * zo;
  const ox = 74 - 24 * zo, oy = 30 + 20 * zo;
  const note = Easing.easeOutCubic(clamp((localTime - 0.4) / 0.6, 0, 1)) * (1 - Easing.easeInOutCubic(clamp((localTime - 2.0) / 0.8, 0, 1)));
  return (
    <div style={{ position: "absolute", inset: 0, overflow: "hidden" }}>
      <Ambient />
      <Screen cam={{ s, ox, oy }} lift={Math.sin(localTime * 0.6) * 3}>
        <AppFrame active="Home" crumb="Home · creator">
          <Dashboard t={localTime} count={count} />
        </AppFrame>
      </Screen>
      {/* annotation over the zoomed insight, fades before zoom-out */}
      <div style={{ position: "absolute", left: "50%", top: 118, transform: "translateX(-50%)", opacity: note, textAlign: "center" }}>
        <div style={{ fontFamily: UI, fontSize: 14, letterSpacing: "0.1em", textTransform: "uppercase", color: INK_SOFT }}>Every use tells you their role, seniority &amp; need</div>
      </div>
    </div>
  );
}

// S6 — CTA
function SceneCTA() {
  const { localTime } = useSprite();
  const rise = Easing.easeOutCubic(clamp(localTime / 0.7, 0, 1));
  const line = clamp((localTime - 1.1) / 0.6, 0, 1);
  return (
    <div style={{ position: "absolute", inset: 0, overflow: "hidden" }}>
      <Ambient />
      <div style={{ position: "absolute", inset: 0, display: "flex", flexDirection: "column", alignItems: "center", justifyContent: "center" }}>
        <div style={{ display: "flex", flexDirection: "column", alignItems: "center", opacity: rise, transform: `translateY(${(1 - rise) * 22}px)` }}>
          <Logo size={140} />
          <div style={{ marginTop: 26, fontFamily: UI, fontWeight: 600, fontSize: 116, letterSpacing: "-0.035em", color: INK, lineHeight: 1 }}>prmpt</div>
          <div style={{ marginTop: 16, fontFamily: UI, fontSize: 22, letterSpacing: "0.16em", color: INK_SOFT }}>prmptkit.com</div>
        </div>
        <div style={{ opacity: line, marginTop: 46, textAlign: "center", maxWidth: 1100 }}>
          <div style={{ fontFamily: UI, fontWeight: 500, fontSize: 40, letterSpacing: "-0.02em", color: INK_SOFT }}>Stop sending screenshots. Start turning links into leads.</div>
        </div>
      </div>
    </div>
  );
}

// ── scene wrapper ──────────────────────────────────────
function SceneAt({ start, end, fade = 0.35, children }) {
  const Body = children;
  return (
    <Sprite start={start} end={end}>
      {(s) => {
        const { localTime, duration } = s;
        const op = Math.max(0, Math.min(clamp(localTime / fade, 0, 1), clamp((duration - localTime) / fade, 0, 1)));
        return <div style={{ position: "absolute", inset: 0, opacity: op }}><Body /></div>;
      }}
    </Sprite>
  );
}

// ── scroll-to-start gate + minimal controls ───────────
function ScrollGate() {
  const tl = useTimeline ? useTimeline() : null;
  const ref = React.useRef(null);
  React.useEffect(() => {
    if (!tl) return;
    const node = ref.current;
    if (!node) return;
    let started = false;
    tl.setPlaying(false); tl.setTime(0);
    const io = new IntersectionObserver((entries) => {
      const e = entries[0];
      if (e.isIntersecting && !started) { started = true; tl.setTime(0); tl.setPlaying(true); }
    }, { threshold: 0.55 });
    io.observe(node);
    return () => io.disconnect();
  }, [tl && tl.setPlaying]);
  return <div ref={ref} style={{ position: "absolute", inset: 0, pointerEvents: "none" }} />;
}

function MiniControls() {
  const tl = useTimeline ? useTimeline() : null;
  if (!tl) return null;
  const playing = tl.playing;
  const circle = { width: 62, height: 62, borderRadius: "50%", border: "1px solid rgba(20,24,34,0.10)", background: "rgba(255,255,255,0.72)", backdropFilter: "blur(6px)", WebkitBackdropFilter: "blur(6px)", display: "flex", alignItems: "center", justifyContent: "center", cursor: "pointer", color: "#8C8A93", boxShadow: "0 4px 14px rgba(28,30,40,0.10)", padding: 0 };
  return (
    <div style={{ position: "absolute", right: 34, bottom: 30, display: "flex", gap: 14, zIndex: 60 }}>
      <button title="Restart" onClick={() => { tl.setTime(0); tl.setPlaying(true); }} style={circle}>
        <svg width="26" height="26" viewBox="0 0 24 24" fill="none"><path d="M5 12a7 7 0 1 0 2.1-5" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" /><path d="M4.4 4.2v3.4h3.4" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round" /></svg>
      </button>
      <button title={playing ? "Pause" : "Play"} onClick={() => tl.setPlaying(!playing)} style={circle}>
        {playing
          ? <svg width="24" height="24" viewBox="0 0 24 24" fill="currentColor"><rect x="7" y="6" width="3.4" height="12" rx="1.1" /><rect x="13.6" y="6" width="3.4" height="12" rx="1.1" /></svg>
          : <svg width="24" height="24" viewBox="0 0 24 24" fill="currentColor"><path d="M8 5.5v13l11-6.5z" /></svg>}
      </button>
    </div>
  );
}

// ── Root ───────────────────────────────────────────────
function ClientJourneyV3() {
  return (
    <Stage width={W} height={H} duration={DUR} background="#FFFFFF" persistKey="prmptkit-cj3">
      <SceneAt start={0}     end={2.6}  fade={0.4}>{SceneLogo}</SceneAt>
      <SceneAt start={2.6}   end={6.6}  fade={0.4}>{SceneType}</SceneAt>
      <SceneAt start={6.6}   end={11.2} fade={0.35}>{SceneInsta}</SceneAt>
      <SceneAt start={11.2}  end={14.8} fade={0.3}>{SceneReveal}</SceneAt>
      <SceneAt start={14.8}  end={20.2} fade={0.4}>{SceneCustom}</SceneAt>
      <SceneAt start={20.2}  end={26.4} fade={0.3}>{ScenePrompt}</SceneAt>
      <SceneAt start={26.4}  end={30.8} fade={0.3}>{SceneSignup}</SceneAt>
      <SceneAt start={30.8}  end={35.0} fade={0.3}>{SceneNudge}</SceneAt>
      <SceneAt start={35.0}  end={38.4} fade={0.4}>{SceneMarket}</SceneAt>
      <SceneAt start={38.4}  end={43.2} fade={0.3}>{SceneInsights}</SceneAt>
      <SceneAt start={43.2}  end={46}   fade={0.4}>{SceneCTA}</SceneAt>
      <ScrollGate />
      <MiniControls />
    </Stage>
  );
}

window.ClientJourneyV3 = ClientJourneyV3;
