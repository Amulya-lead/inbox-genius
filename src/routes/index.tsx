import { createFileRoute, Link, useNavigate } from "@tanstack/react-router";
import { useEffect, useState } from "react";
import { supabase } from "@/integrations/supabase/client";

export const Route = createFileRoute("/")(  {
  head: () => ({
    meta: [
      { title: "MailSense — AI inbox triage" },
      { name: "description", content: "MailSense reads your inbox, scores what deserves your attention, surfaces deadlines in red, pulls out tasks, and drafts replies from a single prompt." },
    ],
  }),
  component: Landing,
});

function Landing() {
  const navigate = useNavigate();
  const [authed, setAuthed] = useState(false);
  const [mouse, setMouse] = useState({ x: 0.5, y: 0.5 });

  useEffect(() => {
    supabase.auth.getSession().then(({ data }) => setAuthed(!!data.session));
  }, []);

  useEffect(() => {
    const fn = (e: MouseEvent) => setMouse({ x: e.clientX / window.innerWidth, y: e.clientY / window.innerHeight });
    window.addEventListener("mousemove", fn);
    return () => window.removeEventListener("mousemove", fn);
  }, []);

  const px = (mouse.x - 0.5) * 18;
  const py = (mouse.y - 0.5) * 10;

  return (
    <div style={{ background: "#0e0a06", minHeight: "100vh", color: "#fff", fontFamily: "'Inter',sans-serif", overflowX: "hidden", position: "relative" }}>
      <style>{`
        @import url('https://fonts.googleapis.com/css2?family=Inter:wght@300;400;500;600;700;800;900&family=Playfair+Display:ital,wght@0,700;1,500;1,600;1,700&display=swap');
        *, *::before, *::after { box-sizing: border-box; margin: 0; padding: 0; }
        a { text-decoration: none; color: inherit; }

        @keyframes twinkle     { 0%,100%{opacity:.15} 50%{opacity:.9} }
        @keyframes twinkleGold { 0%,100%{opacity:.3;color:#e9b949} 50%{opacity:1;color:#fde68a} }
        @keyframes shootStar   { 0%{transform:translateX(0) translateY(0) rotate(-30deg);opacity:1} 100%{transform:translateX(500px) translateY(200px) rotate(-30deg);opacity:0} }
        @keyframes goldShift   { 0%{background-position:0% 50%} 50%{background-position:100% 50%} 100%{background-position:0% 50%} }
        @keyframes floatUp     { 0%,100%{transform:translateY(0)} 50%{transform:translateY(-10px)} }
        @keyframes floatDown   { 0%,100%{transform:translateY(0)} 50%{transform:translateY(10px)} }
        @keyframes orbSpin     { from{transform:rotate(0deg)} to{transform:rotate(360deg)} }
        @keyframes orbSpinRev  { from{transform:rotate(0deg)} to{transform:rotate(-360deg)} }
        @keyframes goldPulse   { 0%,100%{box-shadow:0 0 30px -8px rgba(233,185,73,0.4),0 0 60px -20px rgba(184,134,11,0.3)} 50%{box-shadow:0 0 50px -4px rgba(233,185,73,0.7),0 0 100px -15px rgba(184,134,11,0.5)} }
        @keyframes shimmerBtn  { 0%{transform:translateX(-150%)} 100%{transform:translateX(150%)} }
        @keyframes fadeUp      { from{opacity:0;transform:translateY(28px)} to{opacity:1;transform:translateY(0)} }
        @keyframes ripple      { 0%{transform:scale(1);opacity:.6} 100%{transform:scale(2.5);opacity:0} }
        @keyframes borderGlow  { 0%,100%{border-color:rgba(233,185,73,0.2)} 50%{border-color:rgba(233,185,73,0.5)} }

        .fade1 { animation: fadeUp .7s .0s both; }
        .fade2 { animation: fadeUp .7s .12s both; }
        .fade3 { animation: fadeUp .7s .24s both; }
        .fade4 { animation: fadeUp .7s .38s both; }
        .float-up   { animation: floatUp 5s ease-in-out infinite; }
        .float-down { animation: floatDown 5.8s ease-in-out infinite; }

        /* ── GOLD BUTTON ── */
        .gold-btn {
          display: inline-flex; align-items: center; gap: 8px;
          font-size: 14px; font-weight: 700; letter-spacing: .03em;
          padding: 13px 28px; border-radius: 12px; border: none; cursor: pointer;
          color: #1a0e00; position: relative; overflow: hidden;
          background: linear-gradient(135deg, #fde68a 0%, #f6c23e 20%, #e9b949 45%, #b8860b 68%, #f4d77a 85%, #fde68a 100%);
          background-size: 250% 250%; animation: goldShift 5s ease infinite;
          box-shadow:
            0 0 0 1px rgba(255,235,150,0.5),
            0 6px 24px rgba(184,134,11,0.55),
            0 2px 0 rgba(255,245,180,0.6) inset,
            0 -2px 0 rgba(0,0,0,0.25) inset;
          text-decoration: none; transition: transform .2s, box-shadow .2s;
        }
        .gold-btn:hover {
          transform: translateY(-2px);
          box-shadow:
            0 0 0 1px rgba(255,235,150,0.7),
            0 10px 36px rgba(184,134,11,0.7),
            0 0 60px -10px rgba(233,185,73,0.5),
            0 2px 0 rgba(255,245,180,0.6) inset,
            0 -2px 0 rgba(0,0,0,0.25) inset;
        }
        .gold-btn::after {
          content:''; position:absolute; top:0; left:0; right:0; bottom:0;
          background: linear-gradient(110deg, transparent 25%, rgba(255,255,255,0.55) 50%, transparent 75%);
          transform: translateX(-150%); animation: shimmerBtn 3s 1s ease-in-out infinite;
        }

        /* ── GHOST BUTTON ── */
        .ghost-btn {
          display: inline-flex; align-items: center; gap: 8px;
          font-size: 14px; font-weight: 500; padding: 13px 24px; border-radius: 12px;
          background: rgba(233,185,73,0.05); border: 1px solid rgba(233,185,73,0.22);
          color: rgba(255,255,255,0.7); cursor: pointer; transition: all .25s;
          text-decoration: none; backdrop-filter: blur(8px);
          animation: borderGlow 3s ease-in-out infinite;
        }
        .ghost-btn:hover {
          background: rgba(233,185,73,0.1); border-color: rgba(233,185,73,0.5);
          color: #fde68a; box-shadow: 0 0 20px -5px rgba(233,185,73,0.25);
        }

        /* ── FEATURE CARD ── */
        .feat-card {
          background: rgba(233,185,73,0.02);
          border: 1px solid rgba(233,185,73,0.08);
          border-radius: 16px; padding: 20px 18px;
          display: flex; align-items: flex-start; gap: 14px;
          cursor: default; transition: all .3s; position: relative; overflow: hidden;
        }
        .feat-card::before {
          content:''; position:absolute; inset:0; border-radius:16px;
          background: linear-gradient(135deg, rgba(233,185,73,0.05), transparent 55%);
          opacity:0; transition: opacity .3s;
        }
        .feat-card:hover {
          background: rgba(233,185,73,0.05);
          border-color: rgba(233,185,73,0.22);
          transform: translateY(-3px);
          box-shadow: 0 12px 40px -10px rgba(184,134,11,0.35);
        }
        .feat-card:hover::before { opacity:1; }

        .star-dot { position:absolute; border-radius:50%; pointer-events:none; }
      `}</style>

      {/* ════════ FIXED BACKGROUND ════════ */}
      <div style={{ position:"fixed", inset:0, zIndex:0, overflow:"hidden", pointerEvents:"none" }}>

        {/* Deep warm gradient base */}
        <div style={{ position:"absolute", inset:0, background:"linear-gradient(160deg, #0e0a06 0%, #12090a 40%, #0b0804 70%, #100c04 100%)" }} />

        {/* Large nebula glows */}
        <div style={{ position:"absolute", top:"-15%", right:"-8%",  width:750, height:750, borderRadius:"50%", background:"radial-gradient(circle at 45% 45%, rgba(184,134,11,0.22) 0%, rgba(139,100,0,0.1) 45%, transparent 70%)", filter:"blur(70px)" }} />
        <div style={{ position:"absolute", top:"30%",  right:"10%",  width:400, height:400, borderRadius:"50%", background:"radial-gradient(circle, rgba(233,185,73,0.08) 0%, transparent 70%)", filter:"blur(50px)" }} />
        <div style={{ position:"absolute", bottom:"-5%", left:"-10%", width:650, height:650, borderRadius:"50%", background:"radial-gradient(circle, rgba(120,80,10,0.2) 0%, transparent 65%)", filter:"blur(65px)" }} />
        <div style={{ position:"absolute", top:"55%",  left:"35%",   width:350, height:350, borderRadius:"50%", background:"radial-gradient(circle, rgba(233,185,73,0.06) 0%, transparent 70%)", filter:"blur(45px)" }} />

        {/* Gold dust stars */}
        {Array.from({ length: 140 }).map((_, i) => {
          const size = i % 18 === 0 ? 2.5 : i % 5 === 0 ? 1.8 : 1;
          const gold = i % 4 === 0;
          return (
            <div key={i} className="star-dot" style={{
              width: size, height: size,
              top: `${(i * 6.97) % 100}%`,
              left: `${(i * 11.43) % 100}%`,
              background: gold ? "#e9b949" : "#fff",
              boxShadow: gold ? `0 0 ${size * 3}px rgba(233,185,73,0.8)` : "none",
              opacity: gold ? 0.4 + (i % 4) * 0.1 : 0.15 + (i % 6) * 0.05,
              animation: gold
                ? `twinkleGold ${2 + (i * 0.19) % 2}s ${(i * 0.31) % 3}s ease-in-out infinite`
                : `twinkle ${2.5 + (i * 0.13) % 2.5}s ${(i * 0.27) % 4}s ease-in-out infinite`,
            }} />
          );
        })}

        {/* Shooting stars */}
        <div style={{ position:"absolute", top:"12%", left:"5%",  width:130, height:1.5, background:"linear-gradient(90deg,transparent,rgba(233,185,73,0.9),transparent)", borderRadius:2, animation:"shootStar 7s 1.5s ease-out infinite" }} />
        <div style={{ position:"absolute", top:"38%", left:"55%", width:90,  height:1,   background:"linear-gradient(90deg,transparent,rgba(255,220,100,0.8),transparent)", borderRadius:2, animation:"shootStar 7s 5s ease-out infinite" }} />
        <div style={{ position:"absolute", top:"70%", left:"20%", width:70,  height:1,   background:"linear-gradient(90deg,transparent,rgba(233,185,73,0.6),transparent)", borderRadius:2, animation:"shootStar 7s 9s ease-out infinite" }} />
      </div>

      {/* ════════ NAV ════════ */}
      <nav style={{ position:"sticky", top:0, zIndex:100, background:"rgba(14,10,6,0.78)", backdropFilter:"blur(20px)", borderBottom:"1px solid rgba(233,185,73,0.1)" }}>
        <div style={{ maxWidth:1180, margin:"0 auto", padding:"0 28px", height:60, display:"flex", alignItems:"center", justifyContent:"space-between" }}>
          <Link to="/" style={{ display:"flex", alignItems:"center", gap:9 }}>
            <div style={{ width:32, height:32, borderRadius:9, background:"linear-gradient(135deg,rgba(184,134,11,0.35),rgba(233,185,73,0.18))", border:"1px solid rgba(233,185,73,0.4)", display:"grid", placeItems:"center", boxShadow:"0 0 14px rgba(233,185,73,0.2)" }}>
              <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="#e9b949" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><rect x="2" y="4" width="20" height="16" rx="2"/><polyline points="2,4 12,14 22,4"/></svg>
            </div>
            <span style={{ fontWeight:800, fontSize:16, background:"linear-gradient(90deg,#fde68a,#e9b949,#f4d77a)", WebkitBackgroundClip:"text", WebkitTextFillColor:"transparent", backgroundClip:"text" }}>MailSense</span>
          </Link>

          <div style={{ display:"flex", gap:8, alignItems:"center" }}>
            {authed ? (
              <button className="gold-btn" onClick={() => navigate({ to:"/dashboard" })}>Open inbox →</button>
            ) : (
              <>
                <Link to="/auth" style={{ fontSize:13.5, fontWeight:500, color:"rgba(255,255,255,0.5)", padding:"8px 16px", borderRadius:8, transition:"color .2s" }}
                  onMouseEnter={e => (e.currentTarget.style.color="#e9b949")}
                  onMouseLeave={e => (e.currentTarget.style.color="rgba(255,255,255,0.5)")}>
                  Sign in
                </Link>
                <Link to="/auth" className="gold-btn" style={{ padding:"9px 20px", fontSize:13.5 }}>
                  Get started →
                </Link>
              </>
            )}
          </div>
        </div>
      </nav>

      {/* ════════ HERO ════════ */}
      <section style={{ position:"relative", zIndex:1, maxWidth:1180, margin:"0 auto", padding:"80px 28px 100px", display:"grid", gridTemplateColumns:"1fr 1.15fr", gap:60, alignItems:"center" }}>

        {/* ── LEFT ── */}
        <div>
          {/* Badge */}
          <div className="fade1" style={{ display:"inline-flex", alignItems:"center", gap:8, background:"rgba(233,185,73,0.08)", border:"1px solid rgba(233,185,73,0.3)", borderRadius:24, padding:"5px 14px", marginBottom:26 }}>
            <span style={{ fontSize:10, color:"#e9b949", filter:"drop-shadow(0 0 4px rgba(233,185,73,0.8))" }}>✦</span>
            <span style={{ fontSize:11, fontWeight:700, color:"#e9b949", letterSpacing:".08em", textTransform:"uppercase" }}>AI-Triaged Inbox</span>
            <span style={{ fontSize:10, color:"#b8860b", filter:"drop-shadow(0 0 4px rgba(184,134,11,0.8))" }}>✦</span>
          </div>

          {/* Headline */}
          <h1 className="fade2" style={{ fontSize:"clamp(40px,4.8vw,62px)", fontWeight:900, lineHeight:1.04, letterSpacing:"-0.03em", marginBottom:20, color:"#fff" }}>
            Stop reading<br />email. Start{" "}
            <span style={{
              background:"linear-gradient(135deg,#fde68a 0%,#e9b949 25%,#f6c23e 50%,#b8860b 75%,#f4d77a 90%,#fde68a 100%)",
              backgroundSize:"300% 300%",
              animation:"goldShift 4s ease infinite",
              WebkitBackgroundClip:"text", WebkitTextFillColor:"transparent", backgroundClip:"text",
              filter:"drop-shadow(0 2px 12px rgba(233,185,73,0.4))",
            }}>finishing</span>{" "}it.
          </h1>

          {/* Description */}
          <p className="fade3" style={{ fontSize:15, color:"rgba(255,255,255,0.5)", lineHeight:1.72, maxWidth:420, marginBottom:32 }}>
            MailSense reads your inbox, scores what deserves your attention, surfaces deadlines in red, pulls out tasks, and drafts replies from a single prompt.
          </p>

          {/* CTAs */}
          <div className="fade4" style={{ display:"flex", gap:14, flexWrap:"wrap", alignItems:"center" }}>
            <Link to={authed ? "/dashboard" : "/auth"} className="gold-btn">
              {authed ? "Open inbox" : "Try the demo"} →
            </Link>
            <a href="#features" className="ghost-btn">
              <svg width="11" height="11" viewBox="0 0 24 24" fill="currentColor"><polygon points="5,3 19,12 5,21"/></svg>
              See how it works
            </a>
          </div>

          <p style={{ marginTop:18, fontSize:12, color:"rgba(255,255,255,0.22)" }}>
            ✦ Free to try &nbsp;·&nbsp; Email + Google sign-in &nbsp;·&nbsp; No credit card
          </p>
        </div>

        {/* ── RIGHT: DASHBOARD MOCKUP ── */}
        <div style={{ position:"relative", minHeight:430, transform:`translate(${px * 0.4}px,${py * 0.3}px)`, transition:"transform .35s ease-out" }}>

          {/* Outer orbital ring */}
          <div style={{ position:"absolute", top:"50%", left:"46%", transform:"translate(-50%,-50%)", width:400, height:400, pointerEvents:"none" }}>
            <div style={{ position:"absolute", inset:0, borderRadius:"50%", border:"1.5px solid rgba(233,185,73,0.14)", animation:"orbSpin 25s linear infinite" }}>
              <div style={{ position:"absolute", top:-5, left:"50%", transform:"translateX(-50%)", width:10, height:10, borderRadius:"50%", background:"radial-gradient(circle,#fde68a,#e9b949)", boxShadow:"0 0 12px 3px rgba(233,185,73,0.8), 0 0 24px rgba(184,134,11,0.5)" }} />
              <div style={{ position:"absolute", bottom:-5, left:"50%", transform:"translateX(-50%)", width:6, height:6, borderRadius:"50%", background:"#b8860b", boxShadow:"0 0 8px rgba(184,134,11,0.8)" }} />
            </div>
          </div>

          {/* Inner orbital ring */}
          <div style={{ position:"absolute", top:"50%", left:"46%", transform:"translate(-50%,-50%)", width:290, height:290, pointerEvents:"none" }}>
            <div style={{ position:"absolute", inset:0, borderRadius:"50%", border:"1px solid rgba(233,185,73,0.09)", animation:"orbSpinRev 18s linear infinite" }}>
              <div style={{ position:"absolute", right:-4, top:"50%", transform:"translateY(-50%)", width:8, height:8, borderRadius:"50%", background:"radial-gradient(circle,#f4d77a,#b8860b)", boxShadow:"0 0 10px rgba(233,185,73,0.7)" }} />
            </div>
          </div>

          {/* Central glow */}
          <div style={{ position:"absolute", top:"35%", left:"38%", transform:"translate(-50%,-50%)", width:280, height:280, borderRadius:"50%", background:"radial-gradient(circle, rgba(233,185,73,0.2) 0%, rgba(184,134,11,0.08) 50%, transparent 70%)", filter:"blur(30px)", pointerEvents:"none" }} />

          {/* Floating envelope */}
          <div className="float-up" style={{ position:"absolute", top:-14, left:16, zIndex:22, background:"linear-gradient(145deg,rgba(24,18,8,0.97),rgba(18,12,4,0.98))", border:"1px solid rgba(233,185,73,0.25)", borderRadius:14, padding:"11px 13px", boxShadow:"0 8px 30px rgba(0,0,0,0.65), 0 0 0 1px rgba(233,185,73,0.08) inset" }}>
            <div style={{ position:"relative", display:"inline-flex" }}>
              <svg width="23" height="23" viewBox="0 0 24 24" fill="none" stroke="#e9b949" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round" style={{ filter:"drop-shadow(0 0 6px rgba(233,185,73,0.5))" }}><rect x="2" y="4" width="20" height="16" rx="2"/><polyline points="2,4 12,14 22,4"/></svg>
              <span style={{ position:"absolute", top:-8, right:-8, background:"linear-gradient(135deg,#dc2626,#ef4444)", color:"#fff", borderRadius:"50%", width:16, height:16, display:"grid", placeItems:"center", fontSize:8.5, fontWeight:800, boxShadow:"0 2px 8px rgba(239,68,68,0.7)" }}>3</span>
            </div>
          </div>

          {/* Gold sparkles */}
          <div className="float-down" style={{ position:"absolute", top:6, right:10, zIndex:20, fontSize:28, color:"#e9b949", opacity:.95, userSelect:"none", filter:"drop-shadow(0 0 10px rgba(233,185,73,0.9))", animationDuration:"6s" }}>✦</div>
          <div className="float-up"   style={{ position:"absolute", top:60, right:42, zIndex:20, fontSize:15, color:"#b8860b", opacity:.6, userSelect:"none", filter:"drop-shadow(0 0 6px rgba(184,134,11,0.7))", animationDelay:"1.2s" }}>✦</div>
          <div className="float-down" style={{ position:"absolute", top:100, left:28, zIndex:20, fontSize:11, color:"#f4d77a", opacity:.45, userSelect:"none", animationDelay:"2s" }}>✦</div>

          {/* ── MAIN CARD ── */}
          <div style={{
            position:"relative", zIndex:10, marginLeft:50,
            background:"linear-gradient(145deg, rgba(22,15,6,0.97) 0%, rgba(16,10,3,0.99) 100%)",
            border:"1px solid rgba(233,185,73,0.22)",
            borderRadius:22, padding:"0 0 22px",
            boxShadow:"0 32px 80px rgba(0,0,0,0.75), 0 0 0 1px rgba(255,235,150,0.04) inset",
            animation:"goldPulse 4s ease-in-out infinite",
          }}>
            {/* Gold top strip */}
            <div style={{ height:3, background:"linear-gradient(90deg,transparent,rgba(233,185,73,0.7),rgba(244,215,122,0.5),rgba(184,134,11,0.3),transparent)", borderRadius:"22px 22px 0 0", marginBottom:0 }} />

            <div style={{ padding:"18px 22px 0" }}>
              <div style={{ display:"flex", alignItems:"center", justifyContent:"space-between", paddingBottom:14, marginBottom:16, borderBottom:"1px solid rgba(233,185,73,0.08)" }}>
                <span style={{ fontSize:13, fontWeight:600, color:"rgba(255,255,255,0.82)", letterSpacing:"-0.01em" }}>Inbox Overview</span>
                <div style={{ display:"flex", alignItems:"center", gap:6 }}>
                  <span style={{ width:6, height:6, borderRadius:"50%", background:"#e9b949", display:"block", boxShadow:"0 0 6px rgba(233,185,73,0.9)", animation:"twinkleGold 2s ease-in-out infinite" }} />
                  <span style={{ fontSize:9, color:"rgba(255,220,100,0.5)", letterSpacing:".06em", textTransform:"uppercase" }}>Live</span>
                </div>
              </div>

              <div style={{ display:"flex", gap:22, alignItems:"center" }}>
                {/* Gauge */}
                <div style={{ flexShrink:0, display:"flex", flexDirection:"column", alignItems:"center", gap:9 }}>
                  <div style={{ position:"relative", width:104, height:104 }}>
                    <svg width="104" height="104" viewBox="0 0 100 100" style={{ transform:"rotate(-90deg)" }}>
                      <circle cx="50" cy="50" r="40" fill="transparent" stroke="rgba(233,185,73,0.08)" strokeWidth="7" />
                      <circle cx="50" cy="50" r="40" fill="transparent" stroke="url(#goldGrad)" strokeWidth="7"
                        strokeDasharray="251.2" strokeDashoffset={251.2*(1-87/100)} strokeLinecap="round"
                        style={{ filter:"drop-shadow(0 0 8px rgba(233,185,73,0.9)) drop-shadow(0 0 16px rgba(184,134,11,0.5))" }} />
                      <defs>
                        <linearGradient id="goldGrad" x1="0%" y1="0%" x2="100%" y2="0%">
                          <stop offset="0%"   stopColor="#fde68a" />
                          <stop offset="40%"  stopColor="#e9b949" />
                          <stop offset="75%"  stopColor="#b8860b" />
                          <stop offset="100%" stopColor="#f4d77a" />
                        </linearGradient>
                      </defs>
                    </svg>
                    <div style={{ position:"absolute", inset:0, display:"flex", flexDirection:"column", alignItems:"center", justifyContent:"center" }}>
                      <span style={{ fontSize:27, fontWeight:900, color:"#fff", lineHeight:1, letterSpacing:"-0.04em" }}>87</span>
                      <span style={{ fontSize:9.5, color:"rgba(233,185,73,0.5)" }}>/100</span>
                    </div>
                  </div>
                  <div style={{ textAlign:"center" }}>
                    <div style={{ fontSize:9.5, fontWeight:700, background:"linear-gradient(90deg,#fde68a,#e9b949,#b8860b)", WebkitBackgroundClip:"text", WebkitTextFillColor:"transparent", backgroundClip:"text", textTransform:"uppercase", letterSpacing:".06em" }}>Attention Score</div>
                    <div style={{ fontSize:8.5, color:"rgba(255,255,255,0.3)", marginTop:2 }}>Excellent focus</div>
                  </div>
                </div>

                {/* Metrics */}
                <div style={{ flex:1, display:"flex", flexDirection:"column", gap:7 }}>
                  {[
                    { dot:"#ef4444", label:"Deadlines",      val:"3",    valC:"#ef4444" },
                    { icon:"≡",   ic:"#e9b949", label:"Tasks",           val:"8",    valC:"#f5f0e0" },
                    { icon:"✦",   ic:"#b8860b", label:"Replies drafted", val:"5",    valC:"#f5f0e0" },
                    { icon:"◷",   ic:"#4ade80", label:"Time saved",      val:"2.4h", valC:"#4ade80" },
                  ].map((r, i) => (
                    <div key={i} style={{ display:"flex", alignItems:"center", justifyContent:"space-between", background:"rgba(233,185,73,0.04)", border:"1px solid rgba(233,185,73,0.09)", borderRadius:9, padding:"6px 10px" }}>
                      <div style={{ display:"flex", alignItems:"center", gap:7 }}>
                        {r.dot
                          ? <span style={{ width:6, height:6, borderRadius:"50%", background:r.dot, display:"block", boxShadow:`0 0 6px ${r.dot}` }} />
                          : <span style={{ fontSize:12, color:r.ic, lineHeight:1 }}>{r.icon}</span>}
                        <span style={{ fontSize:11, color:"rgba(255,255,255,0.55)" }}>{r.label}</span>
                      </div>
                      <span style={{ fontSize:11, fontWeight:700, color:r.valC }}>{r.val}</span>
                    </div>
                  ))}
                </div>
              </div>
            </div>
          </div>

          {/* Deadline floating card */}
          <div className="float-up" style={{ animationDelay:".5s", position:"absolute", bottom:-18, left:0, zIndex:22, background:"linear-gradient(145deg,rgba(20,12,4,0.98),rgba(14,8,2,0.99))", border:"1px solid rgba(239,68,68,0.2)", borderRadius:14, padding:"11px 14px", minWidth:200, boxShadow:"0 10px 32px rgba(0,0,0,0.7), 0 0 20px -10px rgba(239,68,68,0.3)", display:"flex", alignItems:"flex-start", gap:10 }}>
            <div style={{ width:28, height:28, borderRadius:8, background:"rgba(239,68,68,0.12)", border:"1px solid rgba(239,68,68,0.18)", display:"grid", placeItems:"center", flexShrink:0, marginTop:1 }}>
              <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="#ef4444" strokeWidth="2.2" strokeLinecap="round" strokeLinejoin="round"><circle cx="12" cy="12" r="10"/><polyline points="12,6 12,12 16,14"/></svg>
            </div>
            <div>
              <div style={{ fontSize:11, fontWeight:600, color:"rgba(255,255,255,0.9)", lineHeight:1.35 }}>Deadline tomorrow 5 PM</div>
              <div style={{ fontSize:9, color:"rgba(255,255,255,0.3)", marginTop:2 }}>Project update</div>
            </div>
          </div>

          {/* Draft ready card */}
          <div className="float-down" style={{ animationDelay:".25s", position:"absolute", bottom:26, right:-22, zIndex:22, background:"linear-gradient(145deg,rgba(22,15,5,0.98),rgba(14,9,2,0.99))", border:"1px solid rgba(233,185,73,0.18)", borderRadius:14, padding:"12px 14px", minWidth:212, boxShadow:"0 14px 40px rgba(0,0,0,0.7), 0 0 30px -12px rgba(233,185,73,0.35)" }}>
            <div style={{ display:"flex", alignItems:"center", justifyContent:"space-between", paddingBottom:9, marginBottom:9, borderBottom:"1px solid rgba(233,185,73,0.07)" }}>
              <div style={{ display:"flex", alignItems:"center", gap:5, fontSize:9.5, fontWeight:600, color:"rgba(255,255,255,0.38)" }}>
                <span style={{ color:"#e9b949", filter:"drop-shadow(0 0 4px rgba(233,185,73,0.8))" }}>✦</span> Draft ready
              </div>
              <div style={{ display:"flex", gap:3 }}>
                <span style={{ width:6, height:6, borderRadius:"50%", background:"rgba(233,185,73,0.15)", display:"block" }} />
                <span style={{ width:6, height:6, borderRadius:"50%", background:"rgba(233,185,73,0.15)", display:"block" }} />
              </div>
            </div>
            <div style={{ fontSize:12, fontWeight:700, color:"#fff", marginBottom:5 }}>Re: Q4 Planning</div>
            <div style={{ fontSize:10, color:"rgba(255,255,255,0.44)", lineHeight:1.55 }}>Hi Sarah, Thanks for the update! I've reviewed...</div>
            <div style={{ display:"flex", justifyContent:"flex-end", marginTop:10 }}>
              <button className="gold-btn" style={{ padding:"4px 13px", fontSize:9.5, borderRadius:6 }}>Insert</button>
            </div>
          </div>
        </div>
      </section>

      {/* Gold divider */}
      <div style={{ position:"relative", zIndex:1, maxWidth:1180, margin:"0 auto", padding:"0 28px" }}>
        <div style={{ height:1, background:"linear-gradient(90deg,transparent,rgba(233,185,73,0.5),rgba(184,134,11,0.3),transparent)" }} />
      </div>

      {/* ════════ FEATURES ════════ */}
      <section id="features" style={{ position:"relative", zIndex:1, maxWidth:1180, margin:"0 auto", padding:"72px 28px 100px" }}>
        <div style={{ textAlign:"center", marginBottom:52 }}>
          <div style={{ display:"inline-flex", alignItems:"center", gap:8, background:"rgba(233,185,73,0.07)", border:"1px solid rgba(233,185,73,0.2)", borderRadius:20, padding:"5px 14px", marginBottom:18 }}>
            <span style={{ fontSize:11, color:"#e9b949", fontWeight:600, letterSpacing:".06em", textTransform:"uppercase" }}>Features</span>
          </div>
          <h2 style={{ fontSize:"clamp(22px,3vw,34px)", fontWeight:700, color:"#fff", letterSpacing:"-0.025em", lineHeight:1.2 }}>
            One assistant.{" "}
            <em style={{ fontStyle:"italic", background:"linear-gradient(135deg,#fde68a,#e9b949,#f4d77a,#b8860b)", backgroundSize:"200% 200%", animation:"goldShift 5s ease infinite", WebkitBackgroundClip:"text", WebkitTextFillColor:"transparent", backgroundClip:"text", fontFamily:"'Playfair Display',Georgia,serif", fontWeight:600 }}>
              Every email pattern.
            </em>
            {" "}<span style={{ fontSize:".75em", color:"#e9b949", filter:"drop-shadow(0 0 6px rgba(233,185,73,0.9))" }}>✦</span>
          </h2>
          <p style={{ marginTop:12, fontSize:14, color:"rgba(255,255,255,0.38)", maxWidth:440, margin:"12px auto 0" }}>
            Built for people who get hundreds of emails and have minutes to spare.
          </p>
        </div>

        <div style={{ display:"grid", gridTemplateColumns:"repeat(3,1fr)", gap:14 }}>
          {[
            { emoji:"⏱", bg:"linear-gradient(135deg,#4c1d95,#7c3aed)", name:"Attention Score",   desc:"Each email gets a 0-100 score blending urgency, sender, effort, and your past behavior." },
            { emoji:"🎯", bg:"linear-gradient(135deg,#7f1d1d,#dc2626)", name:"Deadline radar",    desc:'Detects "by Friday", "tomorrow 5 PM", "end of month" — and shows red alerts under 48h.' },
            { emoji:"✅", bg:"linear-gradient(135deg,#1e3a8a,#2563eb)", name:"Tasks, extracted",  desc:"Action items pulled out of every thread so nothing slips through." },
            { emoji:"📝", bg:"linear-gradient(135deg,#14532d,#16a34a)", name:"2-line summaries",  desc:"Long threads collapse to what actually matters, in plain English." },
            { emoji:"🛡️", bg:"linear-gradient(135deg,#7f1d1d,#ea580c)", name:"Phishing flag",     desc:"Spoofed domains, urgent language, and shady links get quarantined automatically." },
            { emoji:"🔍", bg:"linear-gradient(135deg,#164e63,#0891b2)", name:"Natural search",    desc:'"Unanswered HR emails this week" — search the way you think.' },
            { emoji:"✉️", bg:"linear-gradient(135deg,#78350f,#d97706)", name:"Prompt → email",    desc:'"Ask manager for 2 days sick leave" becomes a polished, ready-to-send draft.' },
            { emoji:"💬", bg:"linear-gradient(135deg,#312e81,#4f46e5)", name:"Context replies",   desc:"One-tap drafts that already understand the thread, your tone, and the ask." },
            { emoji:"📧", bg:"linear-gradient(135deg,#1e1b4b,#4338ca)", name:"Gmail & Outlook",   desc:"Bring your inbox. We never store message content beyond what you triage." },
          ].map((f, i) => (
            <div key={i} className="feat-card">
              <div style={{ width:44, height:44, borderRadius:"50%", flexShrink:0, display:"grid", placeItems:"center", background:f.bg, fontSize:20, boxShadow:"0 6px 20px rgba(0,0,0,0.5), 0 0 0 1px rgba(255,255,255,0.08) inset" }}>{f.emoji}</div>
              <div>
                <div style={{ fontSize:13, fontWeight:700, color:"#f5f0e0", marginBottom:6, letterSpacing:"-0.01em" }}>{f.name}</div>
                <div style={{ fontSize:11.5, color:"rgba(255,255,255,0.38)", lineHeight:1.65 }}>{f.desc}</div>
              </div>
            </div>
          ))}
        </div>
      </section>

      {/* ════════ FOOTER ════════ */}
      <footer style={{ position:"relative", zIndex:1, borderTop:"1px solid rgba(233,185,73,0.1)", padding:"28px 28px", background:"rgba(0,0,0,0.45)" }}>
        <div style={{ maxWidth:1180, margin:"0 auto", display:"flex", alignItems:"center", justifyContent:"space-between", fontSize:12, color:"rgba(255,255,255,0.22)" }}>
          <span>© {new Date().getFullYear()} MailSense. All rights reserved.</span>
          <span style={{ display:"flex", alignItems:"center", gap:6 }}>
            <span style={{ color:"#e9b949", filter:"drop-shadow(0 0 4px rgba(233,185,73,0.6))" }}>✦</span>
            Built with AI · Your inbox stays yours.
          </span>
        </div>
      </footer>
    </div>
  );
}
