import React, { useState, useEffect, useMemo, useCallback, useRef } from "react";
import { AreaChart, Area, BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, Cell } from "recharts";
import Papa from "papaparse";

const SHEET_ID = "1tbi3TCgN9OT35OiFn2gokedZi8stNY-h8vu0NkRWL3I";

// ─── DEMO DATA ────────────────────────────────────────────────────────────────
const DEMO = {
  config: { nome_produto: "Lançamento Demo", nome_cliente: "Cliente", meta_vendas: "200" },
  diarios: [
    { data:"28/04/2025", invest:350,  cliques:1200, views:980,  checkouts:210, compras:47, receita:23500 },
    { data:"29/04/2025", invest:410,  cliques:1450, views:1180, checkouts:260, compras:58, receita:28940 },
    { data:"30/04/2025", invest:390,  cliques:1310, views:1060, checkouts:235, compras:51, receita:25500 },
    { data:"01/05/2025", invest:450,  cliques:1580, views:1290, checkouts:288, compras:64, receita:31680 },
    { data:"02/05/2025", invest:420,  cliques:1420, views:1150, checkouts:252, compras:55, receita:27335 },
    { data:"03/05/2025", invest:480,  cliques:1650, views:1340, checkouts:302, compras:71, receita:35200 },
    { data:"04/05/2025", invest:510,  cliques:1780, views:1450, checkouts:325, compras:78, receita:38640 },
  ],
  criativos: [
    { link:"", nome:"VSL_v3_feed",    invest:1280, impressoes:168000, cliques:4380, views:3510, checkouts:748, compras:174, v3s:134400, v50:78000, receita:86280, ctr:2.6, hook:80.0, body:58.2, cpv:7.36 },
    { link:"", nome:"VSL_v4_stories", invest:980,  impressoes:128000, cliques:3240, views:2590, checkouts:552, compras:127, v3s:102400, v50:58000, receita:62940, ctr:2.5, hook:80.0, body:56.6, cpv:7.72 },
    { link:"", nome:"IMG_oferta_v1",  invest:750,  impressoes:98000,  cliques:2480, views:1980, checkouts:418, compras:95,  v3s:0,      v50:0,     receita:47050, ctr:2.5, hook:0,    body:0,    cpv:7.89 },
    { link:"", nome:"VSL_v1_feed",    invest:620,  impressoes:82000,  cliques:1980, views:1580, checkouts:332, compras:68,  v3s:65600,  v50:36000, receita:33660, ctr:2.4, hook:80.0, body:54.9, cpv:9.12 },
    { link:"", nome:"IMG_hook_v2",    invest:440,  impressoes:58000,  cliques:1420, views:1130, checkouts:238, compras:43,  v3s:0,      v50:0,     receita:21310, ctr:2.4, hook:0,    body:0,    cpv:10.23 },
  ],
  paginas: [
    { pagina:"V1",  invest:1920, cliques:5300, views:4240, checkouts:918, compras:212, receita:105040 },
    { pagina:"V1B", invest:800,  cliques:2100, views:1680, checkouts:360, compras:82,  receita:40780  },
    { pagina:"V2",  invest:1280, cliques:4380, views:3510, checkouts:748, compras:174, receita:86280  },
    { pagina:"V3",  invest:980,  cliques:3240, views:2590, checkouts:552, compras:127, receita:62940  },
    { pagina:"V4",  invest:760,  cliques:2500, views:2000, checkouts:420, compras:95,  receita:47050  },
  ],
  criativosHoje: [
    { link:"", nome:"VSL_v3_feed",    invest:180, impressoes:24000, cliques:620, views:500, checkouts:108, compras:25, v3s:19200, v50:11000, receita:12250, ctr:2.6, hook:80.0, body:57.3, cpv:7.20 },
    { link:"", nome:"IMG_oferta_v1",  invest:110, impressoes:14000, cliques:360, views:288, checkouts:60,  compras:14, v3s:0,     v50:0,     receita:6860,  ctr:2.6, hook:0,    body:0,    cpv:7.86 },
    { link:"", nome:"VSL_v4_stories", invest:140, impressoes:18000, cliques:460, views:368, checkouts:80,  compras:18, v3s:14400, v50:8100,  receita:8820,  ctr:2.6, hook:80.0, body:56.3, cpv:7.78 },
  ],
  utms: [
    { utm:"instagram_feed",    compras:38, receita:37886 },
    { utm:"instagram_stories", compras:24, receita:23928 },
    { utm:"email_lista",       compras:31, receita:30907 },
    { utm:"whatsapp_grupo",    compras:19, receita:18943 },
    { utm:"youtube_desc",      compras:12, receita:11964 },
  ],
  orgDiario: [
    { data:"28/04/2025", compras:12, receita:11964 },
    { data:"29/04/2025", compras:15, receita:14955 },
    { data:"30/04/2025", compras:11, receita:10967 },
    { data:"01/05/2025", compras:18, receita:17946 },
    { data:"02/05/2025", compras:14, receita:13958 },
    { data:"03/05/2025", compras:21, receita:20937 },
    { data:"04/05/2025", compras:33, receita:32901 },
  ],
};

// ─── HELPERS ──────────────────────────────────────────────────────────────────
const parseNum = (v) => {
  if (!v && v !== 0) return 0;
  let s = String(v).replace(/[R$\s%x]/g, "").trim();
  if (!s || s === "-" || s === "−") return 0;
  if (s.includes(",") && s.includes(".")) s = s.replace(/\./g, "").replace(",", ".");
  else if (s.includes(",")) s = s.replace(",", ".");
  return parseFloat(s) || 0;
};

const safe = (a, b) => (b && b !== 0 ? a / b : 0);

const f = {
  brl:  (n=0) => "R$ " + n.toLocaleString("pt-BR", { minimumFractionDigits:2, maximumFractionDigits:2 }),
  num:  (n=0) => Math.round(n).toLocaleString("pt-BR"),
  pct:  (n=0) => (n*100).toFixed(1)+"%",
  pctN: (n=0) => Number(n).toFixed(1)+"%",
  x:    (n=0) => n.toFixed(2)+"x",
  kbrl: (n=0) => n>=1000 ? "R$"+(n/1000).toFixed(1)+"k" : "R$"+Math.round(n),
};

function parseDate(str) {
  if (!str) return null;
  const s = String(str).trim().replace(/-/g, "/");
  const [d,m,y] = s.split("/");
  if (!d||!m||!y) return null;
  return new Date(parseInt(y), parseInt(m)-1, parseInt(d));
}
function dateStr(offset=0) {
  const t = new Date(); t.setDate(t.getDate()+offset);
  return `${String(t.getDate()).padStart(2,"0")}/${String(t.getMonth()+1).padStart(2,"0")}/${t.getFullYear()}`;
}
function normDate(str) { return String(str||"").trim().replace(/-/g,"/"); }

function naturalPageSort(a, b) {
  const re = /^([A-Za-z]+)(\d+)([A-Za-z]*)$/;
  const ma = String(a.pagina).match(re), mb = String(b.pagina).match(re);
  if (!ma||!mb) return String(a.pagina).localeCompare(String(b.pagina));
  if (ma[1]!==mb[1]) return ma[1].localeCompare(mb[1]);
  if (parseInt(ma[2])!==parseInt(mb[2])) return parseInt(ma[2])-parseInt(mb[2]);
  return ma[3].localeCompare(mb[3]);
}

function sortRows(data, sort, colDefs) {
  if (!sort.col) return data;
  const col = colDefs.find(c => c.id === sort.col);
  if (!col) return data;
  const getter = col.sortVal || col.val;
  return [...data].sort((a, b) => {
    const va = getter(a), vb = getter(b);
    if (typeof va === "string") return sort.dir==="asc" ? va.localeCompare(vb) : vb.localeCompare(va);
    return sort.dir==="asc" ? (isNaN(va)?0:va)-(isNaN(vb)?0:vb) : (isNaN(vb)?0:vb)-(isNaN(va)?0:va);
  });
}

// ─── THEME ────────────────────────────────────────────────────────────────────
const C = {
  bg:"#060D1C", card:"#0D1B30", border:"rgba(255,255,255,0.07)",
  blue:"#4DA8FF", orange:"#FF7134", green:"#00D4A0", red:"#FF4560",
  purple:"#9B7FFF", amber:"#FFB830", text:"#E2E8F0", muted:"#445566",
};
const PALETTE = [C.blue, C.green, C.purple, C.amber, C.orange, C.red, "#E91E8C", "#00BCD4", "#8BC34A", "#FF5722"];

// ─── FONTS ────────────────────────────────────────────────────────────────────
function useFonts() {
  useEffect(() => {
    if (!document.getElementById("dash-fonts")) {
      const l = document.createElement("link");
      l.id="dash-fonts"; l.rel="stylesheet";
      l.href="https://fonts.googleapis.com/css2?family=Outfit:wght@400;500;600;700&family=JetBrains+Mono:wght@400;500&display=swap";
      document.head.appendChild(l);
    }
    if (!document.getElementById("dash-base")) {
      const s = document.createElement("style");
      s.id="dash-base";
      s.textContent=`*{box-sizing:border-box;margin:0;padding:0}body{background:${C.bg};color:${C.text};font-family:'Outfit',sans-serif}::-webkit-scrollbar{width:4px;height:4px}::-webkit-scrollbar-thumb{background:#1E3A5F;border-radius:2px}@keyframes spin{to{transform:rotate(360deg)}}`;
      document.head.appendChild(s);
    }
  },[]);
}

// ─── DRAGGABLE + SORTABLE COLS ────────────────────────────────────────────────
function useDraggableCols(init) {
  const [cols, setCols] = useState(init);
  const [sort, setSort] = useState({ col:null, dir:"desc" });
  const dragIdx = useRef(null);
  const dragging = useRef(false);
  const onDragStart = useCallback((i) => { dragIdx.current=i; dragging.current=true; }, []);
  const onDragOver  = useCallback((e) => e.preventDefault(), []);
  const onDragEnd   = useCallback(() => { setTimeout(()=>{ dragging.current=false; }, 60); }, []);
  const onDrop      = useCallback((i) => {
    if (dragIdx.current===null || dragIdx.current===i) return;
    setCols(prev => { const next=[...prev]; const [m]=next.splice(dragIdx.current,1); next.splice(i,0,m); return next; });
    dragIdx.current=null;
  },[]);
  const onSort = useCallback((colId) => {
    if (dragging.current) return;
    setSort(prev => prev.col===colId ? { col:colId, dir:prev.dir==="asc"?"desc":"asc" } : { col:colId, dir:"desc" });
  },[]);
  return { cols, sort, onDragStart, onDragOver, onDrop, onDragEnd, onSort };
}

// ─── PRIMITIVES ───────────────────────────────────────────────────────────────
function Card({ title, children, style={} }) {
  return (
    <div style={{ background:C.card, border:`1px solid ${C.border}`, borderRadius:12, padding:"20px 22px", ...style }}>
      {title && <div style={{ fontSize:10, color:C.muted, letterSpacing:"0.1em", textTransform:"uppercase", fontWeight:600, marginBottom:18 }}>{title}</div>}
      {children}
    </div>
  );
}

function KPI({ label, value, sub, color=C.blue }) {
  return (
    <div style={{ background:C.card, border:`1px solid ${C.border}`, borderRadius:12, padding:"14px 16px", position:"relative", overflow:"hidden" }}>
      <div style={{ position:"absolute", top:0, left:0, right:0, height:2, background:color }} />
      <div style={{ fontSize:9, color:C.muted, letterSpacing:"0.1em", textTransform:"uppercase", fontWeight:600, marginBottom:6 }}>{label}</div>
      <div style={{ fontSize:18, fontFamily:"'JetBrains Mono',monospace", fontWeight:500, color:C.text, letterSpacing:"-0.02em", lineHeight:1 }}>{value}</div>
      {sub && <div style={{ fontSize:10, color:C.muted, marginTop:5 }}>{sub}</div>}
    </div>
  );
}

function MetaKPI({ current, meta }) {
  const pct = meta ? Math.min(100,(current/meta)*100) : 0;
  const color = pct>=100 ? C.green : pct>=70 ? C.amber : C.blue;
  return (
    <div style={{ background:C.card, border:`1px solid ${C.border}`, borderRadius:12, padding:"14px 16px", position:"relative", overflow:"hidden" }}>
      <div style={{ position:"absolute", top:0, left:0, right:0, height:2, background:color }} />
      <div style={{ fontSize:9, color:C.muted, letterSpacing:"0.1em", textTransform:"uppercase", fontWeight:600, marginBottom:6 }}>Progresso de Vendas</div>
      <div style={{ fontFamily:"'JetBrains Mono',monospace", fontSize:18, color:C.text, fontWeight:500, lineHeight:1, marginBottom:8 }}>
        {f.num(current)} <span style={{ fontSize:12, color:C.muted }}>/ {f.num(meta)}</span>
      </div>
      <div style={{ height:6, background:"rgba(255,255,255,0.06)", borderRadius:3, overflow:"hidden" }}>
        <div style={{ width:pct+"%", height:"100%", background:color, borderRadius:3, transition:"width 0.8s ease" }} />
      </div>
      <div style={{ fontSize:10, color, marginTop:5, fontFamily:"'JetBrains Mono',monospace" }}>{pct.toFixed(1)}% da meta</div>
    </div>
  );
}

function FunnelRow({ label, value, pct, maxVal, color }) {
  const w = maxVal ? Math.min(100,(value/maxVal)*100) : 100;
  return (
    <div style={{ marginBottom:14 }}>
      <div style={{ display:"flex", justifyContent:"space-between", alignItems:"center", marginBottom:4 }}>
        <span style={{ fontSize:11, color:C.muted }}>{label}</span>
        <div style={{ display:"flex", alignItems:"center", gap:8 }}>
          <span style={{ fontFamily:"'JetBrains Mono',monospace", fontSize:11, color:C.text }}>{f.num(value)}</span>
          {pct!==null && <span style={{ fontFamily:"'JetBrains Mono',monospace", fontSize:10, color, background:color+"22", padding:"1px 6px", borderRadius:4 }}>{f.pct(pct)}</span>}
        </div>
      </div>
      <div style={{ height:4, background:"rgba(255,255,255,0.05)", borderRadius:2, overflow:"hidden" }}>
        <div style={{ width:w+"%", height:"100%", background:color, borderRadius:2, transition:"width 0.6s ease" }} />
      </div>
    </div>
  );
}

function ChartTip({ active, payload, label, fmt }) {
  if (!active||!payload?.length) return null;
  const display = fmt==="num" ? (v=>f.num(v)) : (v=>f.brl(v));
  return (
    <div style={{ background:"#0C1E38", border:`1px solid rgba(77,168,255,0.3)`, borderRadius:8, padding:"10px 14px", fontSize:12 }}>
      <div style={{ color:C.muted, marginBottom:6, fontWeight:500 }}>{label}</div>
      {payload.map(p=>(
        <div key={p.name} style={{ display:"flex", justifyContent:"space-between", gap:20, color:p.color||C.text, marginBottom:2 }}>
          <span>{p.name}</span>
          <span style={{ fontFamily:"'JetBrains Mono',monospace", fontWeight:500 }}>{display(p.value)}</span>
        </div>
      ))}
    </div>
  );
}

function DragSortTH({ children, index, colId, sort, onSort, onDragStart, onDragOver, onDrop, onDragEnd, right }) {
  const [over, setOver] = useState(false);
  const isSorted = sort.col===colId;
  return (
    <th draggable
      onDragStart={()=>onDragStart(index)} onDragEnd={onDragEnd}
      onDragOver={e=>{ e.preventDefault(); setOver(true); onDragOver(e); }}
      onDragLeave={()=>setOver(false)}
      onDrop={()=>{ setOver(false); onDrop(index); }}
      onClick={()=>onSort(colId)}
      style={{ padding:"8px 12px", textAlign:right?"right":"left", color:isSorted?C.blue:over?C.text:C.muted, fontWeight:500, fontSize:10, letterSpacing:"0.07em", textTransform:"uppercase", borderBottom:`1px solid ${C.border}`, whiteSpace:"nowrap", cursor:"pointer", userSelect:"none", background:over?"rgba(77,168,255,0.06)":"transparent", transition:"all 0.15s" }}>
      {children}{isSorted?(sort.dir==="asc"?" ↑":" ↓"):""}
    </th>
  );
}

function TD({ children, right, mono, color, bold }) {
  return (
    <td style={{ padding:"9px 12px", textAlign:right?"right":"left", color:color||C.text, fontFamily:mono?"'JetBrains Mono',monospace":"inherit", fontSize:12, borderBottom:`1px solid rgba(255,255,255,0.03)`, fontWeight:bold?500:400, whiteSpace:"nowrap" }}>
      {children}
    </td>
  );
}

function CrLink({ url }) {
  if (!url || !url.startsWith("http")) return <span style={{color:C.muted,fontSize:11}}>—</span>;
  return <a href={url} target="_blank" rel="noopener noreferrer" style={{color:C.blue,fontSize:12,textDecoration:"none",fontFamily:"'JetBrains Mono',monospace"}}>Ver ↗</a>;
}

// ─── DATE FILTER ──────────────────────────────────────────────────────────────
const PRESETS=[
  {id:"all",   label:"Todo o período"},
  {id:"hoje",  label:"Hoje"},
  {id:"ontem", label:"Ontem"},
  {id:"custom",label:"Personalizado"},
];

function DateFilter({ diarios, filterMode, setFilterMode, selectedDates, setSelectedDates }) {
  const [open,setOpen]=useState(false);
  const available=useMemo(()=>diarios.map(d=>normDate(d.data)),[diarios]);
  const toggle=useCallback(date=>{
    setSelectedDates(prev=>{ const n=new Set(prev); n.has(date)?n.delete(date):n.add(date); return n; });
  },[setSelectedDates]);
  return (
    <div style={{marginBottom:22}}>
      <div style={{display:"flex",gap:8,alignItems:"center",flexWrap:"wrap"}}>
        <span style={{fontSize:11,color:C.muted,fontWeight:600,letterSpacing:"0.07em",textTransform:"uppercase",marginRight:4}}>Período:</span>
        {PRESETS.map(p=>{
          const active=filterMode===p.id;
          const label=p.id==="custom"&&selectedDates.size>0?`Personalizado (${selectedDates.size})`:p.label;
          return (
            <button key={p.id} onClick={()=>{ setFilterMode(p.id); if(p.id==="custom") setOpen(o=>!o); else setOpen(false); }}
              style={{padding:"5px 14px",borderRadius:20,fontSize:12,cursor:"pointer",fontFamily:"'Outfit',sans-serif",fontWeight:active?600:400,border:`1px solid ${active?C.blue:C.border}`,background:active?C.blue+"22":"transparent",color:active?C.blue:C.muted,transition:"all 0.15s"}}>
              {label}
            </button>
          );
        })}
      </div>
      {filterMode==="custom"&&open&&(
        <div style={{marginTop:12,background:C.card,border:`1px solid ${C.border}`,borderRadius:10,padding:"14px 16px"}}>
          <div style={{display:"flex",justifyContent:"space-between",alignItems:"center",marginBottom:10}}>
            <span style={{fontSize:11,color:C.muted,fontWeight:600,letterSpacing:"0.07em",textTransform:"uppercase"}}>Selecione os dias com dados</span>
            <div style={{display:"flex",gap:8}}>
              <button onClick={()=>setSelectedDates(new Set(available))} style={{fontSize:11,color:C.blue,background:"none",border:"none",cursor:"pointer"}}>Todos</button>
              <button onClick={()=>setSelectedDates(new Set())} style={{fontSize:11,color:C.muted,background:"none",border:"none",cursor:"pointer"}}>Limpar</button>
            </div>
          </div>
          <div style={{display:"flex",gap:8,flexWrap:"wrap"}}>
            {available.map(d=>{ const sel=selectedDates.has(d); return <button key={d} onClick={()=>toggle(d)} style={{padding:"5px 12px",borderRadius:6,fontSize:11,cursor:"pointer",fontFamily:"'JetBrains Mono',monospace",border:`1px solid ${sel?C.blue:C.border}`,background:sel?C.blue+"22":"transparent",color:sel?C.blue:C.muted,transition:"all 0.15s"}}>{d}</button>; })}
          </div>
        </div>
      )}
    </div>
  );
}

// ─── VISÃO GERAL TAB (combinado pago + orgânico) ──────────────────────────────
function VisaoGeralTab({ diarios, utms, orgDiario, config }) {
  const totalPago = useMemo(()=>diarios.reduce((acc,d)=>({
    invest: acc.invest+d.invest, compras: acc.compras+d.compras, receita: acc.receita+d.receita,
  }),{invest:0,compras:0,receita:0}),[diarios]);

  const totalOrg = useMemo(()=>utms.reduce((acc,u)=>({
    compras: acc.compras+u.compras, receita: acc.receita+u.receita,
  }),{compras:0,receita:0}),[utms]);

  const totalVendas  = totalPago.compras + totalOrg.compras;
  const totalReceita = totalPago.receita + totalOrg.receita;
  const saldo        = totalReceita - totalPago.invest;
  const meta         = 1500;

  const kpis = [
    { label:"Vendas Totais",       value:f.num(totalVendas),                          color:C.blue   },
    { label:"Receita Total",       value:f.brl(totalReceita),                         color:C.green  },
    { label:"Investimento (Pago)", value:f.brl(totalPago.invest),                     color:C.orange },
    { label:"Saldo",               value:f.brl(saldo),                                color:saldo>=0?C.green:C.red },
    { label:"Custo por Venda",     value:f.brl(safe(totalPago.invest,totalVendas)),   color:C.purple },
    { label:"Vendas Pagas",        value:f.num(totalPago.compras),                    color:C.blue   },
    { label:"Receita Paga",        value:f.brl(totalPago.receita),                    color:C.green  },
    { label:"Vendas Orgânicas",    value:f.num(totalOrg.compras),                     color:C.amber  },
    { label:"Receita Orgânica",    value:f.brl(totalOrg.receita),                     color:C.amber  },
    { label:"% Vendas Orgânicas",  value:f.pct(safe(totalOrg.compras,totalVendas)),   color:C.muted  },
  ];

  return (
    <div style={{display:"flex",flexDirection:"column",gap:18}}>
      {meta>0 && <MetaKPI current={totalVendas} meta={meta}/>}
      <div style={{display:"grid",gridTemplateColumns:"repeat(5,1fr)",gap:12}}>
        {kpis.map((k,i)=><KPI key={i} {...k}/>)}
      </div>

      <div style={{display:"grid",gridTemplateColumns:"1fr 1fr",gap:16}}>
        <Card title="Vendas: Pago vs Orgânico">
          {[
            ["Pago",    totalPago.compras, C.blue ],
            ["Orgânico",totalOrg.compras,  C.amber],
          ].map(([label,val,color])=>(
            <FunnelRow key={label} label={label} value={val} pct={safe(val,totalVendas)} maxVal={totalVendas} color={color}/>
          ))}
        </Card>
        <Card title="Receita: Pago vs Orgânico">
          {[
            ["Pago",    totalPago.receita, C.blue ],
            ["Orgânico",totalOrg.receita,  C.amber],
          ].map(([label,val,color])=>(
            <FunnelRow key={label} label={label} value={val} pct={safe(val,totalReceita)} maxVal={totalReceita} color={color}/>
          ))}
        </Card>
      </div>
    </div>
  );
}

// ─── TRÁFEGO TAB (antiga visão geral) ────────────────────────────────────────
const OV_COLS=[
  {id:"data",      label:"Data",              right:false, val:(d)=>normDate(d.data), sortVal:(d)=>parseDate(d.data)?.getTime()||0},
  {id:"invest",    label:"Invest.",            right:true,  val:(d)=>d.invest},
  {id:"compras",   label:"Vendas",             right:true,  val:(d)=>d.compras},
  {id:"cpv",       label:"Custo/Venda",        right:true,  val:(d)=>safe(d.invest,d.compras)},
  {id:"cliques",   label:"Cliques",            right:true,  val:(d)=>d.cliques},
  {id:"cpc",       label:"CPC",                right:true,  val:(d)=>safe(d.invest,d.cliques)},
  {id:"views",     label:"Views Pág.",         right:true,  val:(d)=>d.views},
  {id:"cpview",    label:"Custo/View",         right:true,  val:(d)=>safe(d.invest,d.views)},
  {id:"tCarreg",   label:"T. Carregamento",    right:true,  val:(d)=>safe(d.views,d.cliques)},
  {id:"checkouts", label:"Checkouts",          right:true,  val:(d)=>d.checkouts},
  {id:"cpchk",     label:"Custo/Checkout",     right:true,  val:(d)=>safe(d.invest,d.checkouts)},
  {id:"tChk",      label:"T. Conv. Checkout",  right:true,  val:(d)=>safe(d.checkouts,d.views)},
  {id:"tGeral",    label:"T. Conv. Geral",     right:true,  val:(d)=>safe(d.compras,d.cliques)},
  {id:"receita",   label:"Receita",            right:true,  val:(d)=>d.receita},
  {id:"saldo",     label:"Saldo",              right:true,  val:(d)=>d.receita-d.invest},
];

function ovCell(col, d) {
  const v = col.val(d);
  switch(col.id){
    case "data":      return <TD mono color={C.muted}>{v}</TD>;
    case "invest":    return <TD right mono color={C.orange}>{f.brl(v)}</TD>;
    case "receita":   return <TD right mono color={C.green}>{f.brl(v)}</TD>;
    case "compras":   return <TD right mono color={C.blue}>{f.num(v)}</TD>;
    case "saldo":     return <TD right mono color={v>=0?C.green:C.red}>{f.brl(v)}</TD>;
    case "cpv":       return <TD right mono>{f.brl(v)}</TD>;
    case "cliques":   return <TD right mono>{f.num(v)}</TD>;
    case "cpc":       return <TD right mono>{f.brl(v)}</TD>;
    case "views":     return <TD right mono>{f.num(v)}</TD>;
    case "cpview":    return <TD right mono>{f.brl(v)}</TD>;
    case "tCarreg":   return <TD right mono>{f.pct(v)}</TD>;
    case "checkouts": return <TD right mono>{f.num(v)}</TD>;
    case "cpchk":     return <TD right mono>{f.brl(v)}</TD>;
    case "tChk":      return <TD right mono>{f.pct(v)}</TD>;
    case "tGeral":    return <TD right mono>{f.pct(v)}</TD>;
    default: return <TD>—</TD>;
  }
}

function TrafegoTab({ diarios, config }) {
  const [filterMode,setFilterMode]=useState("all");
  const [selectedDates,setSelectedDates]=useState(new Set());
  const {cols,sort,onDragStart,onDragOver,onDrop,onDragEnd,onSort}=useDraggableCols(OV_COLS);

  const sortedByDate=useMemo(()=>[...diarios].sort((a,b)=>(parseDate(a.data)?.getTime()||0)-(parseDate(b.data)?.getTime()||0)),[diarios]);

  const filtered=useMemo(()=>{
    const today=dateStr(0), yesterday=dateStr(-1);
    if(filterMode==="hoje")  return sortedByDate.filter(d=>normDate(d.data)===today);
    if(filterMode==="ontem") return sortedByDate.filter(d=>normDate(d.data)===yesterday);
    if(filterMode==="custom"){ if(selectedDates.size===0) return sortedByDate; return sortedByDate.filter(d=>selectedDates.has(normDate(d.data))); }
    return sortedByDate;
  },[sortedByDate,filterMode,selectedDates]);

  const T=useMemo(()=>filtered.reduce((acc,d)=>({
    invest:acc.invest+d.invest, cliques:acc.cliques+d.cliques, views:acc.views+d.views,
    checkouts:acc.checkouts+d.checkouts, compras:acc.compras+d.compras, receita:acc.receita+d.receita,
  }),{invest:0,cliques:0,views:0,checkouts:0,compras:0,receita:0}),[filtered]);

  const meta=1500;
  const saldo=T.receita-T.invest;

  const kpiCards=[
    {type:"meta"},
    {label:"Investimento",      value:f.brl(T.invest),                        color:C.orange},
    {label:"Vendas",            value:f.num(T.compras),                        color:C.blue  },
    {label:"Receita",           value:f.brl(T.receita),                        color:C.green },
    {label:"Custo por Venda",   value:f.brl(safe(T.invest,T.compras)),         color:C.purple},
    {label:"Saldo",             value:f.brl(saldo),                            color:saldo>=0?C.green:C.red},
    {label:"Cliques",           value:f.num(T.cliques),                        color:C.blue  },
    {label:"CPC",               value:f.brl(safe(T.invest,T.cliques)),         color:C.muted },
    {label:"Views de Página",   value:f.num(T.views),                          color:C.blue  },
    {label:"Custo/View Página", value:f.brl(safe(T.invest,T.views)),           color:C.muted },
    {label:"T. Carregamento",   value:f.pct(safe(T.views,T.cliques)),          color:C.purple},
    {label:"Checkouts",         value:f.num(T.checkouts),                      color:C.amber },
    {label:"Custo/Checkout",    value:f.brl(safe(T.invest,T.checkouts)),       color:C.muted },
    {label:"T. Conv. Checkout", value:f.pct(safe(T.checkouts,T.views)),        color:C.amber },
    {label:"T. Conv. Geral",    value:f.pct(safe(T.compras,T.cliques)),        color:C.green },
  ];

  const funnelColors=[C.blue,C.purple,C.amber,C.green];
  const funnel=[
    {label:"Cliques",   value:T.cliques,   pct:null,                              color:funnelColors[0]},
    {label:"Views Pág.",value:T.views,     pct:safe(T.views,T.cliques),           color:funnelColors[1]},
    {label:"Checkouts", value:T.checkouts, pct:safe(T.checkouts,T.views),         color:funnelColors[2]},
    {label:"Vendas",    value:T.compras,   pct:safe(T.compras,T.checkouts),       color:funnelColors[3]},
  ];

  const tableRows=useMemo(()=>sortRows(filtered,sort,OV_COLS),[filtered,sort]);

  return (
    <div style={{display:"flex",flexDirection:"column",gap:18}}>
      <DateFilter diarios={sortedByDate} filterMode={filterMode} setFilterMode={setFilterMode} selectedDates={selectedDates} setSelectedDates={setSelectedDates}/>
      {filtered.length===0
        ? <div style={{textAlign:"center",padding:"60px 0",color:C.muted,fontSize:14}}>Nenhum dado para o período selecionado.</div>
        : <>
          <div style={{display:"grid",gridTemplateColumns:"repeat(5,1fr)",gap:12}}>
            {kpiCards.map((k,i)=> k.type==="meta" ? <MetaKPI key="meta" current={T.compras} meta={meta}/> : <KPI key={i} label={k.label} value={k.value} color={k.color}/>)}
          </div>
          <div style={{display:"grid",gridTemplateColumns:"280px 1fr",gap:16}}>
            <Card title="Funil de Conversão">
              {funnel.map(row=><FunnelRow key={row.label} {...row} maxVal={T.cliques}/>)}
              <div style={{marginTop:14,paddingTop:12,borderTop:`1px solid ${C.border}`}}>
                {[["T. Carregamento",f.pct(safe(T.views,T.cliques)),C.purple],["T. Conv. Checkout",f.pct(safe(T.checkouts,T.views)),C.amber],["T. Conv. Venda",f.pct(safe(T.compras,T.checkouts)),C.green]].map(([label,val,color])=>(
                  <div key={label} style={{display:"flex",justifyContent:"space-between",alignItems:"center",marginBottom:8}}>
                    <span style={{fontSize:11,color:C.muted}}>{label}</span>
                    <span style={{fontFamily:"'JetBrains Mono',monospace",fontSize:13,color,fontWeight:500}}>{val}</span>
                  </div>
                ))}
              </div>
            </Card>
            <div style={{display:"flex",flexDirection:"column",gap:14}}>
              <Card title="Vendas por Dia">
                <ResponsiveContainer width="100%" height={148}>
                  <AreaChart data={filtered} margin={{top:4,right:4,left:0,bottom:0}}>
                    <defs><linearGradient id="gV" x1="0" y1="0" x2="0" y2="1"><stop offset="5%" stopColor={C.blue} stopOpacity={0.3}/><stop offset="95%" stopColor={C.blue} stopOpacity={0}/></linearGradient></defs>
                    <CartesianGrid strokeDasharray="3 3" stroke="rgba(255,255,255,0.04)"/>
                    <XAxis dataKey="data" tick={{fontFamily:"'JetBrains Mono',monospace",fontSize:10,fill:C.muted}} axisLine={false} tickLine={false}/>
                    <YAxis tick={{fontFamily:"'JetBrains Mono',monospace",fontSize:10,fill:C.muted}} axisLine={false} tickLine={false} width={40} tickFormatter={v=>f.num(v)}/>
                    <Tooltip content={<ChartTip fmt="num"/>}/>
                    <Area type="monotone" dataKey="compras" name="Vendas" stroke={C.blue} fill="url(#gV)" strokeWidth={2} dot={false}/>
                  </AreaChart>
                </ResponsiveContainer>
              </Card>
              <Card title="Investimento Diário">
                <ResponsiveContainer width="100%" height={148}>
                  <AreaChart data={filtered} margin={{top:4,right:4,left:0,bottom:0}}>
                    <defs><linearGradient id="gInv" x1="0" y1="0" x2="0" y2="1"><stop offset="5%" stopColor={C.orange} stopOpacity={0.3}/><stop offset="95%" stopColor={C.orange} stopOpacity={0}/></linearGradient></defs>
                    <CartesianGrid strokeDasharray="3 3" stroke="rgba(255,255,255,0.04)"/>
                    <XAxis dataKey="data" tick={{fontFamily:"'JetBrains Mono',monospace",fontSize:10,fill:C.muted}} axisLine={false} tickLine={false}/>
                    <YAxis tick={{fontFamily:"'JetBrains Mono',monospace",fontSize:10,fill:C.muted}} axisLine={false} tickLine={false} width={54} tickFormatter={v=>f.kbrl(v)}/>
                    <Tooltip content={<ChartTip/>}/>
                    <Area type="monotone" dataKey="invest" name="Investimento" stroke={C.orange} fill="url(#gInv)" strokeWidth={2} dot={false}/>
                  </AreaChart>
                </ResponsiveContainer>
              </Card>
            </div>
          </div>
          <Card title="Dados por Dia — clique no título para ordenar · arraste para reordenar">
            <div style={{overflowX:"auto"}}>
              <table style={{width:"100%",borderCollapse:"collapse"}}>
                <thead><tr>{cols.map((col,i)=>(<DragSortTH key={col.id} index={i} colId={col.id} sort={sort} onSort={onSort} onDragStart={onDragStart} onDragOver={onDragOver} onDrop={onDrop} onDragEnd={onDragEnd} right={col.right}>{col.label}</DragSortTH>))}</tr></thead>
                <tbody>{tableRows.map((d,ri)=>(<tr key={ri}>{cols.map(col=><React.Fragment key={col.id}>{ovCell(col,d)}</React.Fragment>)}</tr>))}</tbody>
              </table>
            </div>
          </Card>
        </>
      }
    </div>
  );
}

// ─── ORGÂNICO TAB ─────────────────────────────────────────────────────────────
const ORG_COLS=[
  {id:"utm",     label:"UTM",              right:false, val:(u)=>u.utm},
  {id:"compras", label:"Vendas",           right:true,  val:(u)=>u.compras},
  {id:"receita", label:"Receita",          right:true,  val:(u)=>u.receita},
  {id:"ticket",  label:"Ticket Médio",     right:true,  val:(u)=>safe(u.receita,u.compras)},
];

function OrganicoTab({ utms, orgDiario }) {
  const sorted = useMemo(()=>[...utms].sort((a,b)=>b.receita-a.receita),[utms]);
  const totalCompras = useMemo(()=>utms.reduce((s,u)=>s+u.compras,0),[utms]);
  const totalReceita = useMemo(()=>utms.reduce((s,u)=>s+u.receita,0),[utms]);
  const {cols,sort,onDragStart,onDragOver,onDrop,onDragEnd,onSort}=useDraggableCols(ORG_COLS);
  const tableRows=useMemo(()=>sortRows(sorted,sort,ORG_COLS),[sorted,sort]);

  // Bar chart data
  const sortedUtms=sorted;
  const barData=sortedUtms.map(u=>({ name:u.utm, receita:u.receita, compras:u.compras }));

  return (
    <div style={{display:"flex",flexDirection:"column",gap:20}}>
      {/* KPIs */}
      <div style={{display:"grid",gridTemplateColumns:"repeat(3,1fr)",gap:12}}>
        <KPI label="Vendas Orgânicas Totais" value={f.num(totalCompras)} color={C.amber}/>
        <KPI label="Receita Orgânica Total"  value={f.brl(totalReceita)} color={C.green}/>
        <KPI label="Ticket Médio"            value={f.brl(safe(totalReceita,totalCompras))} color={C.purple}/>
      </div>

      {/* Daily organic chart */}
      {orgDiario.length>0 && (
        <Card title="Vendas Orgânicas por Dia">
          <ResponsiveContainer width="100%" height={200}>
            <AreaChart data={orgDiario} margin={{top:4,right:4,left:0,bottom:0}}>
              <defs><linearGradient id="gOrg" x1="0" y1="0" x2="0" y2="1"><stop offset="5%" stopColor={C.amber} stopOpacity={0.3}/><stop offset="95%" stopColor={C.amber} stopOpacity={0}/></linearGradient></defs>
              <CartesianGrid strokeDasharray="3 3" stroke="rgba(255,255,255,0.04)"/>
              <XAxis dataKey="data" tick={{fontFamily:"'JetBrains Mono',monospace",fontSize:10,fill:C.muted}} axisLine={false} tickLine={false}/>
              <YAxis tick={{fontFamily:"'JetBrains Mono',monospace",fontSize:10,fill:C.muted}} axisLine={false} tickLine={false} width={40} tickFormatter={v=>f.num(v)}/>
              <Tooltip content={<ChartTip fmt="num"/>}/>
              <Area type="monotone" dataKey="compras" name="Vendas" stroke={C.amber} fill="url(#gOrg)" strokeWidth={2} dot={false}/>
            </AreaChart>
          </ResponsiveContainer>
        </Card>
      )}

      {/* Vertical bar chart */}
      <Card title="Receita por UTM">
        <ResponsiveContainer width="100%" height={320}>
          <BarChart data={barData} margin={{top:8,right:8,left:0,bottom:60}}>
            <CartesianGrid strokeDasharray="3 3" stroke="rgba(255,255,255,0.04)" vertical={false}/>
            <XAxis dataKey="name" tick={{fontFamily:"'JetBrains Mono',monospace",fontSize:10,fill:C.muted}} axisLine={false} tickLine={false} angle={-35} textAnchor="end" interval={0}/>
            <YAxis tick={{fontFamily:"'JetBrains Mono',monospace",fontSize:10,fill:C.muted}} axisLine={false} tickLine={false} width={60} tickFormatter={v=>f.kbrl(v)}/>
            <Tooltip content={<ChartTip/>}/>
            <Bar dataKey="receita" name="Receita" radius={[4,4,0,0]}>
              {barData.map((_,i)=><Cell key={i} fill={PALETTE[i%PALETTE.length]}/>)}
            </Bar>
          </BarChart>
        </ResponsiveContainer>
      </Card>

      {/* Vendas bar chart */}
      <Card title="Vendas por UTM">
        <ResponsiveContainer width="100%" height={280}>
          <BarChart data={barData} margin={{top:8,right:8,left:0,bottom:60}}>
            <CartesianGrid strokeDasharray="3 3" stroke="rgba(255,255,255,0.04)" vertical={false}/>
            <XAxis dataKey="name" tick={{fontFamily:"'JetBrains Mono',monospace",fontSize:10,fill:C.muted}} axisLine={false} tickLine={false} angle={-35} textAnchor="end" interval={0}/>
            <YAxis tick={{fontFamily:"'JetBrains Mono',monospace",fontSize:10,fill:C.muted}} axisLine={false} tickLine={false} width={40} tickFormatter={v=>f.num(v)}/>
            <Tooltip content={<ChartTip fmt="num"/>}/>
            <Bar dataKey="compras" name="Vendas" radius={[4,4,0,0]}>
              {barData.map((_,i)=><Cell key={i} fill={PALETTE[i%PALETTE.length]}/>)}
            </Bar>
          </BarChart>
        </ResponsiveContainer>
      </Card>

      {/* Table */}
      <Card title="Detalhes por UTM — clique para ordenar · arraste para reordenar">
        <div style={{overflowX:"auto"}}>
          <table style={{width:"100%",borderCollapse:"collapse"}}>
            <thead><tr>
              {cols.map((col,i)=>(<DragSortTH key={col.id} index={i} colId={col.id} sort={sort} onSort={onSort} onDragStart={onDragStart} onDragOver={onDragOver} onDrop={onDrop} onDragEnd={onDragEnd} right={col.right}>{col.label}</DragSortTH>))}
              <th style={{padding:"8px 12px",textAlign:"right",color:C.muted,fontWeight:500,fontSize:10,letterSpacing:"0.07em",textTransform:"uppercase",borderBottom:`1px solid ${C.border}`,whiteSpace:"nowrap"}}>% Vendas</th>
              <th style={{padding:"8px 12px",textAlign:"right",color:C.muted,fontWeight:500,fontSize:10,letterSpacing:"0.07em",textTransform:"uppercase",borderBottom:`1px solid ${C.border}`,whiteSpace:"nowrap"}}>% Receita</th>
            </tr></thead>
            <tbody>
              {tableRows.map((u,ri)=>{
                const color=PALETTE[sortedUtms.findIndex(s=>s.utm===u.utm)%PALETTE.length];
                return (
                  <tr key={ri}>
                    {cols.map(col=>{
                      switch(col.id){
                        case "utm":     return <TD key={col.id}><span style={{background:color+"1A",color,padding:"2px 10px",borderRadius:4,fontFamily:"'JetBrains Mono',monospace",fontSize:11,fontWeight:500}}>{u.utm}</span></TD>;
                        case "compras": return <TD key={col.id} right mono color={C.blue}>{f.num(u.compras)}</TD>;
                        case "receita": return <TD key={col.id} right mono color={C.green}>{f.brl(u.receita)}</TD>;
                        case "ticket":  return <TD key={col.id} right mono>{f.brl(safe(u.receita,u.compras))}</TD>;
                        default: return <TD key={col.id}>—</TD>;
                      }
                    })}
                    <TD right mono color={C.muted}>{f.pct(safe(u.compras,totalCompras))}</TD>
                    <TD right mono color={C.muted}>{f.pct(safe(u.receita,totalReceita))}</TD>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>
      </Card>
    </div>
  );
}

// ─── TOP CRIATIVOS ────────────────────────────────────────────────────────────
const RANK_COLORS=[C.amber,"#8FA3B8","#CD7F32"];
const RANK_LABELS=["1º","2º","3º"];

function TopRow({ cr, i, mainValue, mainLabel, mainColor, secValue, secLabel }) {
  return (
    <div style={{display:"flex",alignItems:"center",gap:12,padding:"12px 0",borderBottom:i<2?`1px solid ${C.border}`:"none"}}>
      <div style={{width:28,height:28,borderRadius:14,flexShrink:0,background:RANK_COLORS[i]+"22",color:RANK_COLORS[i],display:"flex",alignItems:"center",justifyContent:"center",fontFamily:"'JetBrains Mono',monospace",fontSize:11,fontWeight:600}}>{RANK_LABELS[i]}</div>
      <div style={{flex:1,minWidth:0}}><div style={{fontSize:12,fontWeight:500,overflow:"hidden",textOverflow:"ellipsis",whiteSpace:"nowrap",color:C.text}}>{cr.nome}</div></div>
      <div style={{textAlign:"right",minWidth:80}}>
        <div style={{fontFamily:"'JetBrains Mono',monospace",fontSize:16,color:mainColor,fontWeight:500,lineHeight:1}}>{mainValue}</div>
        <div style={{fontSize:10,color:C.muted,marginTop:3}}>{mainLabel}</div>
      </div>
      <div style={{textAlign:"right",minWidth:80,paddingLeft:14,borderLeft:`1px solid ${C.border}`}}>
        <div style={{fontFamily:"'JetBrains Mono',monospace",fontSize:12,color:C.muted}}>{secValue}</div>
        <div style={{fontSize:10,color:C.muted,marginTop:3}}>{secLabel}</div>
      </div>
    </div>
  );
}

function TopCreativos({ criativos, criativosHoje }) {
  const top3V=useMemo(()=>[...criativos].filter(c=>c.compras>0).sort((a,b)=>b.compras-a.compras).slice(0,3),[criativos]);
  const hoje=useMemo(()=>[...criativosHoje].sort((a,b)=>b.compras-a.compras),[criativosHoje]);
  return (
    <div style={{display:"grid",gridTemplateColumns:"1fr 1fr",gap:16,marginBottom:20}}>
      <Card title="Criativos com venda hoje">
        {hoje.length===0
          ? <div style={{color:C.muted,fontSize:13,textAlign:"center",padding:"16px 0"}}>Nenhuma venda registrada hoje ainda.</div>
          : hoje.map((cr,i)=>(
            <div key={i} style={{display:"flex",justifyContent:"space-between",alignItems:"center",padding:"10px 0",borderBottom:i<hoje.length-1?`1px solid ${C.border}`:"none"}}>
              <div style={{flex:1,minWidth:0,display:"flex",alignItems:"center",gap:8,marginRight:12}}>
                <span style={{fontSize:12,fontWeight:500,overflow:"hidden",textOverflow:"ellipsis",whiteSpace:"nowrap",color:C.text}}>{cr.nome}</span>
                <CrLink url={cr.link}/>
              </div>
              <div style={{display:"flex",gap:14,flexShrink:0}}>
                <div style={{textAlign:"right"}}>
                  <div style={{fontFamily:"'JetBrains Mono',monospace",fontSize:14,color:C.blue,fontWeight:500}}>{f.num(cr.compras)}</div>
                  <div style={{fontSize:9,color:C.muted}}>vendas</div>
                </div>
                <div style={{textAlign:"right"}}>
                  <div style={{fontFamily:"'JetBrains Mono',monospace",fontSize:12,color:C.muted}}>{f.brl(safe(cr.invest,cr.compras))}</div>
                  <div style={{fontSize:9,color:C.muted}}>CPV</div>
                </div>
              </div>
            </div>
          ))
        }
      </Card>
      <Card title="Top 3 — Mais Vendas">
        {top3V.map((cr,i)=><TopRow key={i} cr={cr} i={i} mainValue={f.num(cr.compras)} mainLabel="vendas" mainColor={C.blue} secValue={f.brl(safe(cr.invest,cr.compras))} secLabel="CPV"/>)}
      </Card>
    </div>
  );
}

// ─── CRIATIVOS TAB ────────────────────────────────────────────────────────────
const CR_COLS=[
  {id:"thumb",  label:"Link",      right:false, val:()=>""},
  {id:"nome",   label:"Nome",      right:false, val:(c)=>c.nome},
  {id:"invest", label:"Invest.",   right:true,  val:(c)=>c.invest},
  {id:"compras",label:"Vendas",    right:true,  val:(c)=>c.compras},
  {id:"cac",    label:"CPV",       right:true,  val:(c)=>safe(c.invest,c.compras)},
  {id:"cpc",    label:"CPC",       right:true,  val:(c)=>safe(c.invest,c.cliques)},
  {id:"ctr",    label:"CTR",       right:true,  val:(c)=>c.ctr},
  {id:"hook",   label:"Hook Rate", right:true,  val:(c)=>c.hook},
  {id:"body",   label:"Body Rate", right:true,  val:(c)=>c.body},
  {id:"receita",label:"Receita",   right:true,  val:(c)=>c.receita},
  {id:"roas",   label:"ROAS",      right:true,  val:(c)=>safe(c.receita,c.invest)},
];

function crCell(col, cr) {
  const roas=safe(cr.receita,cr.invest);
  switch(col.id){
    case "thumb":   return <TD><CrLink url={cr.link}/></TD>;
    case "nome":    return <TD bold>{cr.nome}</TD>;
    case "invest":  return <TD right mono color={C.orange}>{f.brl(cr.invest)}</TD>;
    case "compras": return <TD right mono color={C.blue}>{f.num(cr.compras)}</TD>;
    case "receita": return <TD right mono color={C.green}>{f.brl(cr.receita)}</TD>;
    case "roas":    return <TD right mono color={roas>=2?C.green:C.text}>{f.x(roas)}</TD>;
    case "cac":     return <TD right mono>{f.brl(safe(cr.invest,cr.compras))}</TD>;
    case "cpc":     return <TD right mono>{f.brl(safe(cr.invest,cr.cliques))}</TD>;
    case "ctr":     return <TD right mono>{f.pctN(cr.ctr)}</TD>;
    case "hook":    return <TD right mono color={cr.hook>0&&cr.hook<30?C.red:cr.hook>=30?C.green:C.muted}>{cr.hook>0?f.pctN(cr.hook):"—"}</TD>;
    case "body":    return <TD right mono color={cr.body>0&&cr.body<50?C.amber:cr.body>=50?C.green:C.muted}>{cr.body>0?f.pctN(cr.body):"—"}</TD>;
    default: return <TD>—</TD>;
  }
}

function CreativosTab({ criativos, criativosHoje }) {
  const {cols,sort,onDragStart,onDragOver,onDrop,onDragEnd,onSort}=useDraggableCols(CR_COLS);
  const rows=useMemo(()=>sortRows(criativos,sort,CR_COLS),[criativos,sort]);
  return (
    <div>
      <TopCreativos criativos={criativos} criativosHoje={criativosHoje}/>
      <Card title="Todos os Criativos — clique no título para ordenar · arraste para reordenar">
        <div style={{overflowX:"auto"}}>
          <table style={{width:"100%",borderCollapse:"collapse"}}>
            <thead><tr>{cols.map((col,i)=>(<DragSortTH key={col.id} index={i} colId={col.id} sort={sort} onSort={onSort} onDragStart={onDragStart} onDragOver={onDragOver} onDrop={onDrop} onDragEnd={onDragEnd} right={col.right}>{col.label}</DragSortTH>))}</tr></thead>
            <tbody>{rows.map((cr,ri)=>(<tr key={ri}>{cols.map(col=><React.Fragment key={col.id}>{crCell(col,cr)}</React.Fragment>)}</tr>))}</tbody>
          </table>
        </div>
      </Card>
    </div>
  );
}

// ─── PÁGINAS TAB ──────────────────────────────────────────────────────────────
const PG_COLS=[
  {id:"pagina",   label:"Página",           right:false, val:(p)=>p.pagina},
  {id:"invest",   label:"Invest.",           right:true,  val:(p)=>p.invest},
  {id:"compras",  label:"Vendas",            right:true,  val:(p)=>p.compras},
  {id:"cpv",      label:"CPV",               right:true,  val:(p)=>safe(p.invest,p.compras)},
  {id:"checkouts",label:"Checkouts",         right:true,  val:(p)=>p.checkouts},
  {id:"tViewChk", label:"T. View→Checkout",  right:true,  val:(p)=>safe(p.checkouts,p.views)},
  {id:"tChk",     label:"T. Conv. Checkout", right:true,  val:(p)=>safe(p.compras,p.checkouts)},
  {id:"cpchk",    label:"Custo/Checkout",    right:true,  val:(p)=>safe(p.invest,p.checkouts)},
  {id:"cliques",  label:"Cliques",           right:true,  val:(p)=>p.cliques},
  {id:"views",    label:"Views",             right:true,  val:(p)=>p.views},
  {id:"tCarreg",  label:"T. Carregamento",   right:true,  val:(p)=>safe(p.views,p.cliques)},
  {id:"receita",  label:"Receita",           right:true,  val:(p)=>p.receita},
  {id:"roas",     label:"ROAS",              right:true,  val:(p)=>safe(p.receita,p.invest)},
];
const PG_COLORS=[C.blue,C.green,C.purple,C.amber,C.orange,C.red,C.blue,C.green,C.purple,C.amber];

function PaginasTab({ paginas }) {
  const natural=useMemo(()=>[...paginas].sort(naturalPageSort),[paginas]);
  const byRevenue=useMemo(()=>[...paginas].sort((a,b)=>b.receita-a.receita),[paginas]);
  const maxR=useMemo(()=>Math.max(...paginas.map(p=>p.receita),1),[paginas]);
  const colorMap=useMemo(()=>{ const m={}; natural.forEach((p,i)=>{ m[p.pagina]=PG_COLORS[i%PG_COLORS.length]; }); return m; },[natural]);
  const {cols,sort,onDragStart,onDragOver,onDrop,onDragEnd,onSort}=useDraggableCols(PG_COLS);
  const tableRows=useMemo(()=>sortRows(natural,sort,PG_COLS),[natural,sort]);

  function pgCell(col,p){
    const color=colorMap[p.pagina]; const roas=safe(p.receita,p.invest);
    switch(col.id){
      case "pagina":   return <TD><span style={{background:color+"1A",color,padding:"2px 10px",borderRadius:4,fontFamily:"'JetBrains Mono',monospace",fontSize:11,fontWeight:500}}>{p.pagina}</span></TD>;
      case "invest":   return <TD right mono color={C.orange}>{f.brl(p.invest)}</TD>;
      case "receita":  return <TD right mono color={C.green}>{f.brl(p.receita)}</TD>;
      case "roas":     return <TD right mono color={roas>=2?C.green:C.text}>{f.x(roas)}</TD>;
      case "compras":  return <TD right mono color={C.blue}>{f.num(p.compras)}</TD>;
      case "cpv":      return <TD right mono>{f.brl(safe(p.invest,p.compras))}</TD>;
      case "checkouts":return <TD right mono>{f.num(p.checkouts)}</TD>;
      case "tViewChk": return <TD right mono>{f.pct(safe(p.checkouts,p.views))}</TD>;
      case "tChk":     return <TD right mono>{f.pct(safe(p.compras,p.checkouts))}</TD>;
      case "cpchk":    return <TD right mono>{f.brl(safe(p.invest,p.checkouts))}</TD>;
      case "cliques":  return <TD right mono>{f.num(p.cliques)}</TD>;
      case "views":    return <TD right mono>{f.num(p.views)}</TD>;
      case "tCarreg":  return <TD right mono>{f.pct(safe(p.views,p.cliques))}</TD>;
      default: return <TD>—</TD>;
    }
  }

  return (
    <div style={{display:"flex",flexDirection:"column",gap:20}}>
      <Card title="Desempenho por Página — ordem de receita">
        {byRevenue.map((p,i)=>{
          const color=colorMap[p.pagina]; const roas=safe(p.receita,p.invest);
          return (
            <div key={i} style={{marginBottom:20}}>
              <div style={{display:"flex",justifyContent:"space-between",alignItems:"flex-start",marginBottom:6}}>
                <span style={{fontFamily:"'JetBrains Mono',monospace",fontSize:13,color,fontWeight:600}}>{p.pagina}</span>
                <div style={{display:"flex",gap:14,flexWrap:"wrap",justifyContent:"flex-end"}}>
                  {[["Receita",f.brl(p.receita),C.green],["Vendas",f.num(p.compras),C.blue],["ROAS",f.x(roas),roas>=2?C.green:C.text],["Checkouts",f.num(p.checkouts),C.amber],["T. Conv. Checkout",f.pct(safe(p.compras,p.checkouts)),C.purple],["Custo/Checkout",f.brl(safe(p.invest,p.checkouts)),C.muted],["CPV",f.brl(safe(p.invest,p.compras)),C.muted]].map(([label,val,col])=>(
                    <div key={label} style={{textAlign:"right"}}>
                      <div style={{fontFamily:"'JetBrains Mono',monospace",fontSize:12,color:col,fontWeight:500}}>{val}</div>
                      <div style={{fontSize:9,color:C.muted,marginTop:2}}>{label}</div>
                    </div>
                  ))}
                </div>
              </div>
              <div style={{height:7,background:"rgba(255,255,255,0.05)",borderRadius:4,overflow:"hidden"}}>
                <div style={{width:(p.receita/maxR*100)+"%",height:"100%",background:color,borderRadius:4,transition:"width 0.8s ease"}}/>
              </div>
            </div>
          );
        })}
      </Card>
      <Card title="Métricas por Página — clique para ordenar · arraste para reordenar">
        <div style={{overflowX:"auto"}}>
          <table style={{width:"100%",borderCollapse:"collapse"}}>
            <thead><tr>{cols.map((col,i)=>(<DragSortTH key={col.id} index={i} colId={col.id} sort={sort} onSort={onSort} onDragStart={onDragStart} onDragOver={onDragOver} onDrop={onDrop} onDragEnd={onDragEnd} right={col.right}>{col.label}</DragSortTH>))}</tr></thead>
            <tbody>{tableRows.map((p,ri)=>(<tr key={ri}>{cols.map(col=><React.Fragment key={col.id}>{pgCell(col,p)}</React.Fragment>)}</tr>))}</tbody>
          </table>
        </div>
      </Card>
    </div>
  );
}

// ─── ROOT ─────────────────────────────────────────────────────────────────────
export default function App() {
  useFonts();
  const [liveData,setLiveData]=useState(null);
  const [loading,setLoading]=useState(true);
  const [error,setError]=useState("");
  const [tab,setTab]=useState("geral");

  const fetchCSV=useCallback(async(sheet)=>{
    const url=`https://docs.google.com/spreadsheets/d/${SHEET_ID}/gviz/tq?tqx=out:csv&sheet=${encodeURIComponent(sheet)}`;
    const res=await fetch(url);
    if(!res.ok) throw new Error(`Erro ao carregar aba "${sheet}"`);
    const text=await res.text();
    const {data}=Papa.parse(text,{header:true,skipEmptyLines:true});
    return data;
  },[]);

  const fetchCSVRaw=useCallback(async(sheet)=>{
    const url=`https://docs.google.com/spreadsheets/d/${SHEET_ID}/gviz/tq?tqx=out:csv&sheet=${encodeURIComponent(sheet)}`;
    const res=await fetch(url);
    if(!res.ok) return [];
    const text=await res.text();
    const {data}=Papa.parse(text,{header:false,skipEmptyLines:true});
    return data;
  },[]);

  useEffect(()=>{
    (async()=>{
      try{
        const [rawD,rawDTemp,rawC,rawP,rawCfg,rawCH,rawUtms,rawOrgD]=await Promise.all([
          fetchCSV("dados_diarios"),
          fetchCSV("dados_diarios_temp").catch(()=>[]),
          fetchCSV("criativos_geral"),
          fetchCSV("paginas"),
          fetchCSVRaw("config").catch(()=>[]),
          fetchCSV("criativos_hoje").catch(()=>[]),
          fetchCSVRaw("utms").catch(()=>[]),
          fetchCSVRaw("organico").catch(()=>[]),
        ]);

        const cfg={};
        rawCfg.filter(r=>r[0]).forEach(r=>{ cfg[String(r[0]).trim()]=String(r[1]||"").trim(); });

        const g = (row,...keys) => { for(const k of keys){ if(row[k]!==undefined && row[k]!=="") return row[k]; } return ""; };

        const diarios=rawD.map(r=>({
          data:      String(g(r,"Data\n(DD-MM-YYYY)","Data (DD-MM-YYYY)")).trim(),
          invest:    parseNum(g(r,"Investimento\n(R$)","Investimento (R$)")),
          cliques:   parseNum(g(r,"Cliques\nno Link","Cliques no Link")),
          views:     parseNum(g(r,"Views de\nPágina","Views de Página")),
          checkouts: parseNum(g(r,"Checkouts\nIniciados","Checkouts Iniciados")),
          compras:   parseNum(g(r,"Compras")),
          receita:   parseNum(g(r,"Receita\n(R$)","Receita (R$)")),
        })).filter(r=>r.data&&(r.invest>0||r.cliques>0||r.compras>0));

        // Parse today's temp data and merge — temp replaces any matching date in diarios
        const diariosTemp=rawDTemp.map(r=>({
          data:      String(g(r,"Data\n(DD-MM-YYYY)","Data (DD-MM-YYYY)")).trim(),
          invest:    parseNum(g(r,"Investimento\n(R$)","Investimento (R$)")),
          cliques:   parseNum(g(r,"Cliques\nno Link","Cliques no Link")),
          views:     parseNum(g(r,"Views de\nPágina","Views de Página")),
          checkouts: parseNum(g(r,"Checkouts\nIniciados","Checkouts Iniciados")),
          compras:   parseNum(g(r,"Compras")),
          receita:   parseNum(g(r,"Receita\n(R$)","Receita (R$)")),
        })).filter(r=>r.data&&(r.invest>0||r.cliques>0||r.compras>0));

        // Merge: historical days from dados_diarios + today from dados_diarios_temp
        const tempDates=new Set(diariosTemp.map(r=>r.data));
        const diariosFinais=[...diarios.filter(r=>!tempDates.has(r.data)), ...diariosTemp];

        const parseCr=r=>({
          link:       String(g(r,"Link do\nCriativo","Link do Criativo")||"").trim(),
          nome:       String(g(r,"Nome do\nCriativo","Nome do Criativo")||"").trim(),
          invest:     parseNum(g(r,"Investimento\n(R$)","Investimento (R$)")),
          impressoes: parseNum(g(r,"Impressões")),
          cliques:    parseNum(g(r,"Cliques")),
          views:      parseNum(g(r,"Views de\nPágina","Views de Página")),
          checkouts:  parseNum(g(r,"Checkouts")),
          compras:    parseNum(g(r,"Compras")),
          v3s:        parseNum(g(r,"Views\n3s","Views 3s")),
          v50:        parseNum(g(r,"Views\n50%","Views 50%")),
          receita:    parseNum(g(r,"Receita\n(R$)","Receita (R$)")),
          ctr:        parseNum(g(r,"CTR\n%","CTR %")),
          hook:       parseNum(g(r,"Hook Rate\n%","Hook Rate %")),
          body:       parseNum(g(r,"Body Rate\n%","Body Rate %")),
          cpv:        parseNum(g(r,"Custo/\nVenda (R$)","Custo/ Venda (R$)")),
        });
        const criativos=rawC.filter(r=>g(r,"Nome do\nCriativo","Nome do Criativo")).map(parseCr);
        const criativosHoje=rawCH.filter(r=>g(r,"Nome do\nCriativo","Nome do Criativo")).map(parseCr).filter(r=>r.compras>0);

        const paginas=rawP.filter(r=>g(r,"Variação\nde Página","Variação de Página")).map(r=>({
          pagina:    String(g(r,"Variação\nde Página","Variação de Página")||"").trim(),
          invest:    parseNum(g(r,"Investimento\n(R$)","Investimento (R$)")),
          cliques:   parseNum(g(r,"Cliques")),
          views:     parseNum(g(r,"Views de\nPágina","Views de Página")),
          checkouts: parseNum(g(r,"Checkouts")),
          compras:   parseNum(g(r,"Compras")),
          receita:   parseNum(g(r,"Receita\n(R$)","Receita (R$)")),
        }));

        const utms=rawUtms.slice(1).filter(r=>r[0]).map(r=>({
          utm:     String(r[0]||"").trim(),
          compras: parseNum(r[1]),
          receita: parseNum(r[2]),
        })).filter(r=>r.utm);

        const orgDiario=rawOrgD.slice(1).map(r=>({
          data:    String(r[0]||"").trim(),
          compras: parseNum(r[1]),
          receita: parseNum(r[2]),
        })).filter(r=>r.data&&(r.compras>0||r.receita>0));

        setLiveData({config:cfg,diarios:diariosFinais,criativos,criativosHoje,paginas,utms,orgDiario});
      }catch(e){
        setError(e.message||"Erro ao carregar dados.");
      }
      setLoading(false);
    })();
  },[fetchCSV]);

  const current=liveData||DEMO;
  const TABS=[
    {id:"geral",     label:"Visão Geral"},
    {id:"trafego",   label:"Tráfego"},
    {id:"organico",  label:"Orgânico"},
    {id:"criativos", label:"Criativos"},
    {id:"paginas",   label:"Páginas"},
  ];

  if(loading) return (
    <div style={{minHeight:"100vh",background:C.bg,display:"flex",alignItems:"center",justifyContent:"center",flexDirection:"column",gap:16}}>
      <div style={{width:36,height:36,border:`3px solid ${C.border}`,borderTop:`3px solid ${C.blue}`,borderRadius:"50%",animation:"spin 0.8s linear infinite"}}/>
      <div style={{color:C.muted,fontSize:13}}>Carregando dados...</div>
    </div>
  );

  return (
    <div style={{minHeight:"100vh",background:C.bg}}>
      {error&&<div style={{background:C.red+"22",border:`1px solid ${C.red}`,color:C.red,padding:"10px 32px",fontSize:12,textAlign:"center"}}>{error} — exibindo dados de demonstração.</div>}
      <div style={{borderBottom:`1px solid ${C.border}`,padding:"14px 32px",display:"flex",alignItems:"center",position:"sticky",top:0,background:C.bg,zIndex:10}}>
        <div>
          <div style={{fontSize:17,fontWeight:700,letterSpacing:"-0.02em"}}>{current.config.nome_produto||"Dashboard de Lançamento"}</div>
          <div style={{fontSize:11,color:C.muted,marginTop:3,display:"flex",alignItems:"center",gap:6}}>
            <span style={{width:6,height:6,borderRadius:3,background:liveData?C.green:C.amber,display:"inline-block"}}/>
            {liveData?`Ao vivo${current.config.nome_cliente?" · "+current.config.nome_cliente:""}` : "Dados de demonstração"}
          </div>
        </div>
      </div>
      <div style={{borderBottom:`1px solid ${C.border}`,padding:"0 32px",display:"flex",gap:4}}>
        {TABS.map(t=>(
          <button key={t.id} onClick={()=>setTab(t.id)}
            style={{padding:"12px 18px",background:"none",border:"none",cursor:"pointer",fontWeight:tab===t.id?600:400,fontSize:13,color:tab===t.id?C.blue:C.muted,borderBottom:`2px solid ${tab===t.id?C.blue:"transparent"}`,marginBottom:-1,letterSpacing:"0.01em"}}>
            {t.label}
          </button>
        ))}
      </div>
      <div style={{maxWidth:1340,margin:"0 auto",padding:"26px 32px 64px"}}>
        {tab==="geral"     && <VisaoGeralTab diarios={current.diarios} utms={current.utms||[]} orgDiario={current.orgDiario||[]} config={current.config}/>}
        {tab==="trafego"   && <TrafegoTab    diarios={current.diarios} config={current.config}/>}
        {tab==="organico"  && <OrganicoTab   utms={current.utms||[]} orgDiario={current.orgDiario||[]}/>}
        {tab==="criativos" && <CreativosTab  criativos={current.criativos} criativosHoje={current.criativosHoje||[]}/>}
        {tab==="paginas"   && <PaginasTab    paginas={current.paginas}/>}
      </div>
    </div>
  );
}
