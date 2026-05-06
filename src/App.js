import { useState, useRef, useEffect, useCallback } from "react";

// ─── Tesseract.js (OCR local, sin API externa) ────────────────────────────────
let TesseractLoaded = false;
const loadTesseract = () => new Promise((resolve, reject) => {
  if (TesseractLoaded && window.Tesseract) return resolve(window.Tesseract);
  const s = document.createElement("script");
  s.src = "https://cdnjs.cloudflare.com/ajax/libs/tesseract.js/5.0.4/tesseract.min.js";
  s.onload  = () => { TesseractLoaded = true; resolve(window.Tesseract); };
  s.onerror = reject;
  document.head.appendChild(s);
});

// ─── EQUIPOS FIFA MUNDIAL 2026 ────────────────────────────────────────────────
// fifa: siglas oficiales impresas en el reverso de la carta (ej: "CPV 1")
// Cada equipo tiene cartas numeradas del 1 al 20
const RAW_TEAMS = [
  // GRUPO A
  { fifa:"MEX", name:"México",               flag:"🇲🇽", group:"A", colors:["#006847","#CE1126"] },
  { fifa:"RSA", name:"Sudáfrica",            flag:"🇿🇦", group:"A", colors:["#007A4D","#FFB612"] },
  { fifa:"KOR", name:"Corea del Sur",        flag:"🇰🇷", group:"A", colors:["#003478","#CD2E3A"] },
  { fifa:"CZE", name:"República Checa",      flag:"🇨🇿", group:"A", colors:["#D7141A","#11457E"] },
  // GRUPO B
  { fifa:"CAN", name:"Canadá",               flag:"🇨🇦", group:"B", colors:["#FF0000","#AA0000"] },
  { fifa:"BIH", name:"Bosnia y Herzegovina", flag:"🇧🇦", group:"B", colors:["#002395","#FCCA00"] },
  { fifa:"QAT", name:"Qatar",                flag:"🇶🇦", group:"B", colors:["#8D1B3D","#FFFFFF"] },
  { fifa:"SUI", name:"Suiza",                flag:"🇨🇭", group:"B", colors:["#FF0000","#FFFFFF"] },
  // GRUPO C
  { fifa:"BRA", name:"Brasil",               flag:"🇧🇷", group:"C", colors:["#009C3B","#FEDF00"] },
  { fifa:"MAR", name:"Marruecos",            flag:"🇲🇦", group:"C", colors:["#C1272D","#006233"] },
  { fifa:"SCO", name:"Escocia",              flag:"🏴󠁧󠁢󠁳󠁣󠁴󠁿", group:"C", colors:["#003380","#FFFFFF"] },
  { fifa:"HAI", name:"Haití",                flag:"🇭🇹", group:"C", colors:["#00209F","#D21034"] },
  // GRUPO D
  { fifa:"USA", name:"Estados Unidos",       flag:"🇺🇸", group:"D", colors:["#B22234","#3C3B6E"] },
  { fifa:"TUR", name:"Turquía",              flag:"🇹🇷", group:"D", colors:["#E30A17","#FFFFFF"] },
  { fifa:"AUS", name:"Australia",            flag:"🇦🇺", group:"D", colors:["#00843D","#FFCD00"] },
  { fifa:"PRY", name:"Paraguay",             flag:"🇵🇾", group:"D", colors:["#D52B1E","#0038A8"] },
  // GRUPO E
  { fifa:"GER", name:"Alemania",             flag:"🇩🇪", group:"E", colors:["#222222","#DD0000"] },
  { fifa:"CIV", name:"Costa de Marfil",      flag:"🇨🇮", group:"E", colors:["#F77F00","#009A44"] },
  { fifa:"ECU", name:"Ecuador",              flag:"🇪🇨", group:"E", colors:["#FFD100","#034EA2"] },
  { fifa:"CUW", name:"Curazao",              flag:"🇨🇼", group:"E", colors:["#003DA5","#F9E814"] },
  // GRUPO F
  { fifa:"NED", name:"Países Bajos",         flag:"🇳🇱", group:"F", colors:["#FF4F00","#003DA5"] },
  { fifa:"JPN", name:"Japón",                flag:"🇯🇵", group:"F", colors:["#BC002D","#FFFFFF"] },
  { fifa:"SWE", name:"Suecia",               flag:"🇸🇪", group:"F", colors:["#006AA7","#FECC02"] },
  { fifa:"TUN", name:"Túnez",                flag:"🇹🇳", group:"F", colors:["#E70013","#FFFFFF"] },
  // GRUPO G
  { fifa:"BEL", name:"Bélgica",              flag:"🇧🇪", group:"G", colors:["#EF3340","#000000"] },
  { fifa:"IRN", name:"Irán",                 flag:"🇮🇷", group:"G", colors:["#239F40","#DA0000"] },
  { fifa:"NZL", name:"Nueva Zelanda",        flag:"🇳🇿", group:"G", colors:["#00247D","#CC142B"] },
  { fifa:"EGY", name:"Egipto",               flag:"🇪🇬", group:"G", colors:["#CE1126","#000000"] },
  // GRUPO H
  { fifa:"ESP", name:"España",               flag:"🇪🇸", group:"H", colors:["#AA151B","#F1BF00"] },
  { fifa:"CPV", name:"Cabo Verde",           flag:"🇨🇻", group:"H", colors:["#003893","#CF2027"] },
  { fifa:"KSA", name:"Arabia Saudita",       flag:"🇸🇦", group:"H", colors:["#006C35","#FFFFFF"] },
  { fifa:"URU", name:"Uruguay",              flag:"🇺🇾", group:"H", colors:["#5EB6E4","#FFFFFF"] },
  // GRUPO I
  { fifa:"FRA", name:"Francia",              flag:"🇫🇷", group:"I", colors:["#002395","#ED2939"] },
  { fifa:"NOR", name:"Noruega",              flag:"🇳🇴", group:"I", colors:["#EF2B2D","#003087"] },
  { fifa:"SEN", name:"Senegal",              flag:"🇸🇳", group:"I", colors:["#00853F","#FDEF42"] },
  { fifa:"IRQ", name:"Irak",                 flag:"🇮🇶", group:"I", colors:["#CE1126","#007A3D"] },
  // GRUPO J
  { fifa:"ARG", name:"Argentina",            flag:"🇦🇷", group:"J", colors:["#74ACDF","#FFFFFF"] },
  { fifa:"ALG", name:"Argelia",              flag:"🇩🇿", group:"J", colors:["#006233","#FFFFFF"] },
  { fifa:"AUT", name:"Austria",              flag:"🇦🇹", group:"J", colors:["#ED2939","#FFFFFF"] },
  { fifa:"JOR", name:"Jordania",             flag:"🇯🇴", group:"J", colors:["#007A3D","#CE1126"] },
  // GRUPO K
  { fifa:"POR", name:"Portugal",             flag:"🇵🇹", group:"K", colors:["#006600","#FF0000"] },
  { fifa:"COL", name:"Colombia",             flag:"🇨🇴", group:"K", colors:["#FCD116","#003087"] },
  { fifa:"UZB", name:"Uzbekistán",           flag:"🇺🇿", group:"K", colors:["#1EB53A","#FFFFFF"] },
  { fifa:"COD", name:"R.D. del Congo",       flag:"🇨🇩", group:"K", colors:["#007FFF","#CE1126"] },
  // GRUPO L
  { fifa:"ENG", name:"Inglaterra",           flag:"🏴󠁧󠁢󠁥󠁮󠁧󠁿", group:"L", colors:["#CF081F","#003399"] },
  { fifa:"CRO", name:"Croacia",              flag:"🇭🇷", group:"L", colors:["#FF0000","#FFFFFF"] },
  { fifa:"PAN", name:"Panamá",               flag:"🇵🇦", group:"L", colors:["#DA121A","#1A47B8"] },
  { fifa:"GHA", name:"Ghana",                flag:"🇬🇭", group:"L", colors:["#006B3F","#FCD116"] },
];

// Cada carta se identifica como "CPV-1", "MEX-3", etc.
// collected = { "CPV-1": 2, "MEX-5": 1, ... }
const TEAMS        = RAW_TEAMS.map(t => ({ ...t, nums: Array.from({length:20},(_,i)=>i+1) }));
const TEAM_BY_FIFA = Object.fromEntries(TEAMS.map(t=>[t.fifa, t]));
const FIFA_CODES   = new Set(TEAMS.map(t=>t.fifa));
const GROUPS_ORDER = ["A","B","C","D","E","F","G","H","I","J","K","L"];
const GROUPS_MAP   = GROUPS_ORDER.reduce((a,g)=>{ a[g]=TEAMS.filter(t=>t.group===g); return a; },{});
const TOTAL_CARDS  = TEAMS.length * 20; // 48 × 20 = 960

// cardKey(fifa, num) → "CPV-1"
const cardKey = (fifa, num) => `${fifa}-${num}`;

// Tipos de carta por posición 1-20
const CARD_TYPE = {
  1:"Escudo", 2:"Estadio", 3:"Plantilla", 4:"DT", 5:"POR",
  6:"DEF", 7:"DEF", 8:"DEF", 9:"MED", 10:"MED",
  11:"MED", 12:"MED", 13:"DEL", 14:"DEL", 15:"DEL",
  16:"⭐ Estrella", 17:"⭐ Estrella", 18:"✨ Especial", 19:"✨ Especial", 20:"💎 Brillante",
};

// ── Paleta clara ──────────────────────────────────────────────────────────────
const C = {
  bg:"#F5F6FA", card:"#FFFFFF", border:"#E8EAF0", text:"#1A1D2E", sub:"#7B8099",
  accent:"#5B6EF5", accentL:"#EEF0FF",
  gold:"#F5A623",   goldL:"#FFF8EC",
  green:"#22C27A",  greenL:"#E8FAF3",
  red:"#F24E4E",    redL:"#FFF0F0",
  orange:"#FF7B1C", orangeL:"#FFF3EB",
  shadow:"0 2px 12px rgba(0,0,0,.07)",
  shadowM:"0 4px 24px rgba(0,0,0,.10)",
};
const pill = (bg,color,txt) => (
  <span style={{background:bg,color,fontSize:11,fontWeight:700,padding:"3px 9px",borderRadius:20}}>{txt}</span>
);

// ── OCR: pre-procesar imagen ──────────────────────────────────────────────────
function preprocessCanvas(src) {
  const sc  = Math.min(4, 1200 / Math.max(src.width, src.height, 1));
  const dst = document.createElement("canvas");
  dst.width  = src.width  * sc;
  dst.height = src.height * sc;
  const ctx  = dst.getContext("2d");
  ctx.imageSmoothingEnabled = true;
  ctx.imageSmoothingQuality = "high";
  ctx.drawImage(src, 0, 0, dst.width, dst.height);
  const id = ctx.getImageData(0, 0, dst.width, dst.height);
  const d  = id.data;
  for (let i = 0; i < d.length; i += 4) {
    // Escala de grises + umbral para mejorar lectura de texto negro sobre fondo gris
    const g = 0.299*d[i] + 0.587*d[i+1] + 0.114*d[i+2];
    const v = g > 140 ? 255 : 0;
    d[i] = d[i+1] = d[i+2] = v;
  }
  ctx.putImageData(id, 0, 0);
  return dst;
}

// ── OCR: extraer pares "CPV 1", "MEX 3", "ARG 15" del texto crudo ─────────────
function extractCardsFromText(raw) {
  const results = [];
  const seen    = new Set();
  // Normalizar: quitar saltos, múltiples espacios, convertir a mayúsculas
  const text = raw.toUpperCase().replace(/\n/g," ").replace(/\s+/g," ");

  // Patrón principal: SIGLAS espacio(s) NÚMERO  — ej "CPV 1", "KSA 18"
  // Acepta 2-4 letras para capturar variantes OCR
  const re = /\b([A-Z]{2,4})\s{0,3}(\d{1,2})\b/g;
  let m;
  while ((m = re.exec(text)) !== null) {
    const rawCode = m[1];
    const num     = parseInt(m[2]);
    if (num < 1 || num > 20) continue;

    // Buscar coincidencia exacta o aproximada (OCR puede confundir letras)
    let code = null;
    if (FIFA_CODES.has(rawCode)) {
      code = rawCode;
    } else {
      // Buscar la sigla FIFA más cercana (distancia 1 en caracteres)
      for (const fc of FIFA_CODES) {
        if (fc.length !== rawCode.length) continue;
        let diff = 0;
        for (let i = 0; i < fc.length; i++) if (fc[i] !== rawCode[i]) diff++;
        if (diff <= 1) { code = fc; break; }
      }
    }
    if (!code) continue;
    const key = cardKey(code, num);
    if (seen.has(key)) continue;
    seen.add(key);
    results.push({ code, num, key });
  }
  return results;
}

// ══════════════════════════════════════════════════════════════════════════════
export default function PaniniApp() {
  const [collected, setCollected] = useState(() => {
    try { return JSON.parse(localStorage.getItem("panini2026v6")||"{}"); } catch { return {}; }
  });
  const [friendData,   setFriendData]   = useState(null);
  const [friendInput,  setFriendInput]  = useState("");
  const [view,         setView]         = useState("album");
  const [selectedTeam, setSelectedTeam] = useState(null);
  const [scanResults,  setScanResults]  = useState([]); // [{code,num,key}]
  const [scanStep,     setScanStep]     = useState("camera");
  const [scanning,     setScanning]     = useState(false);
  const [ocrProgress,  setOcrProgress]  = useState(0);
  const [scanError,    setScanError]    = useState(null);
  const [capturedImg,  setCapturedImg]  = useState(null);
  const [manualCode,   setManualCode]   = useState("");
  const [manualNum,    setManualNum]    = useState("");
  const [toast,        setToast]        = useState(null);
  const [filterGroup,  setFilterGroup]  = useState("all");
  const [myName,       setMyName]       = useState(()=>localStorage.getItem("panini2026name")||"");
  const [editingName,  setEditingName]  = useState(false);
  const videoRef  = useRef(null);
  const streamRef = useRef(null);
  const canvasRef = useRef(null);
  const workerRef = useRef(null);

  useEffect(()=>{ localStorage.setItem("panini2026v6", JSON.stringify(collected)); },[collected]);
  useEffect(()=>{ if(myName) localStorage.setItem("panini2026name", myName); },[myName]);
  useEffect(()=>()=>{ workerRef.current?.terminate(); },[]);

  const showToast = (msg, type="green") => { setToast({msg,type}); setTimeout(()=>setToast(null),3000); };

  // ── Manejo de cartas ─────────────────────────────────────────────────────────
  const addCard    = key => setCollected(p=>({...p,[key]:(p[key]||0)+1}));
  const removeCard = key => setCollected(p=>({...p,[key]:Math.max(0,(p[key]||0)-1)}));
  const hasCard    = key => (collected[key]||0)>=1;
  const countCard  = key => collected[key]||0;

  // ── Stats ────────────────────────────────────────────────────────────────────
  const allKeys     = TEAMS.flatMap(t=>t.nums.map(n=>cardKey(t.fifa,n)));
  const uniqueCount = allKeys.filter(k=>hasCard(k)).length;
  const missing     = TOTAL_CARDS - uniqueCount;
  const pct         = Math.round(uniqueCount/TOTAL_CARDS*100);
  const dupesCnt    = allKeys.reduce((s,k)=>s+Math.max(0,countCard(k)-1),0);
  const teamsOk     = TEAMS.filter(t=>t.nums.every(n=>hasCard(cardKey(t.fifa,n)))).length;

  const teamStats = t => {
    const got = t.nums.filter(n=>hasCard(cardKey(t.fifa,n))).length;
    return { got, total:t.nums.length, pct:Math.round(got/t.nums.length*100) };
  };

  // ── Trade ────────────────────────────────────────────────────────────────────
  const tradeCards = friendData ? TEAMS.flatMap(t=>t.nums
    .filter(n=>{ const k=cardKey(t.fifa,n); return (friendData.collected[k]||0)>1 && !hasCard(k); })
    .map(n=>({key:cardKey(t.fifa,n),code:t.fifa,num:n,team:t}))) : [];
  const iCanGive = friendData ? TEAMS.flatMap(t=>t.nums
    .filter(n=>{ const k=cardKey(t.fifa,n); return countCard(k)>1 && (friendData.collected[k]||0)===0; })
    .map(n=>({key:cardKey(t.fifa,n),code:t.fifa,num:n,team:t}))) : [];

  // ── Cámara ───────────────────────────────────────────────────────────────────
  const startCamera = async () => {
    setScanError(null); setScanResults([]); setCapturedImg(null);
    setScanStep("camera"); setView("scan"); setOcrProgress(0);
    setTimeout(async ()=>{
      try {
        const s = await navigator.mediaDevices.getUserMedia({
          video:{ facingMode:{ideal:"environment"}, width:{ideal:1920}, height:{ideal:1080} }
        });
        streamRef.current = s;
        if(videoRef.current){ videoRef.current.srcObject=s; videoRef.current.play(); }
      } catch { setScanError("No se pudo acceder a la cámara. Verifica permisos."); }
    }, 150);
  };

  const stopCamera = () => { streamRef.current?.getTracks().forEach(t=>t.stop()); streamRef.current=null; };

  const capturePhoto = () => {
    if(!videoRef.current) return;
    const cv = canvasRef.current;
    cv.width  = videoRef.current.videoWidth  || 1280;
    cv.height = videoRef.current.videoHeight || 720;
    cv.getContext("2d").drawImage(videoRef.current, 0, 0);
    setCapturedImg(cv.toDataURL("image/jpeg", 0.95));
    stopCamera();
    setScanStep("preview");
  };

  // ── OCR ──────────────────────────────────────────────────────────────────────
  const runOCR = useCallback(async () => {
    if(!capturedImg) return;
    setScanning(true); setScanError(null); setOcrProgress(0);
    try {
      const T   = await loadTesseract();
      const img = new Image();
      img.src   = capturedImg;
      await new Promise(r=>{ img.onload=r; });
      const src = document.createElement("canvas");
      src.width=img.naturalWidth; src.height=img.naturalHeight;
      src.getContext("2d").drawImage(img,0,0);
      const processed = preprocessCanvas(src);

      if(!workerRef.current) {
        workerRef.current = await T.createWorker("eng", 1, {
          logger: m => { if(m.status==="recognizing text") setOcrProgress(Math.round(m.progress*100)); }
        });
      }
      // Permitir letras + números para leer "CPV 1"
      await workerRef.current.setParameters({
        tessedit_char_whitelist: "ABCDEFGHIJKLMNOPQRSTUVWXYZ0123456789 ",
        tessedit_pageseg_mode:   "11",
      });

      const { data:{ text } } = await workerRef.current.recognize(processed);
      const cards = extractCardsFromText(text);

      if(cards.length > 0) {
        setScanResults(cards);
      } else {
        setScanError("No se detectaron siglas. Intenta con mejor luz o usa entrada manual.");
        setScanStep("manual");
      }
    } catch(e) {
      console.error(e);
      setScanError("Error en OCR. Usa entrada manual.");
      setScanStep("manual");
    }
    setScanning(false);
  }, [capturedImg]);

  useEffect(()=>{
  if(scanStep==="preview" && capturedImg && scanResults.length===0 && !scanning) runOCR();
  // eslint-disable-next-line react-hooks/exhaustive-deps
}, [scanStep, capturedImg]);

  const confirmScan = () => {
    let added=0, dupes=0;
    scanResults.forEach(r=>{ if(hasCard(r.key)) dupes++; addCard(r.key); added++; });
    showToast(`✅ ${added} carta${added!==1?"s":""} añadida${added!==1?"s":""}${dupes?` · ⚠ ${dupes} duplicada${dupes!==1?"s":""}`:""}`,"green");
    closeScanner();
  };

  // ── Manual: añadir por siglas + número ───────────────────────────────────────
  const addManual = () => {
    const code = manualCode.trim().toUpperCase();
    const num  = parseInt(manualNum);
    if(!FIFA_CODES.has(code)){ setScanError(`Siglas "${code}" no reconocidas`); return; }
    if(isNaN(num)||num<1||num>20){ setScanError("Número debe ser entre 1 y 20"); return; }
    const key = cardKey(code, num);
    if(scanResults.find(r=>r.key===key)){ setScanError("Ya está en la lista"); return; }
    setScanResults(p=>[...p,{code,num,key}]);
    setManualNum(""); setScanError(null);
  };

  const closeScanner = () => {
    stopCamera(); setScanResults([]); setScanError(null);
    setCapturedImg(null); setScanStep("camera"); setManualCode(""); setManualNum("");
    setView("album");
  };

  // ── Intercambio ──────────────────────────────────────────────────────────────
  const publishMyCollection = async () => {
    if(!myName.trim()) return;
    try {
      await window.storage.set(`user:${myName.trim().toLowerCase()}`,
        JSON.stringify({name:myName.trim(),collected,updatedAt:Date.now()}), true);
      showToast(`✅ Colección publicada como "${myName}"`,"green");
    } catch { showToast("Error al publicar.","red"); }
  };

  const searchFriend = async () => {
    if(!friendInput.trim()) return;
    try {
      const res = await window.storage.get(`user:${friendInput.trim().toLowerCase()}`, true);
      if(!res){ showToast("No se encontró ese usuario.","red"); return; }
      const data = JSON.parse(res.value);
      setFriendData(data);
      showToast(`✅ Colección de "${data.name}" cargada`,"green");
    } catch { showToast("Error al buscar.","red"); }
  };

  const filteredGroups = GROUPS_ORDER
    .filter(g=>filterGroup==="all"||g===filterGroup)
    .map(g=>[g,GROUPS_MAP[g]]);

  const dupesList = TEAMS.flatMap(t=>t.nums.map(n=>{
    const k=cardKey(t.fifa,n); const c=countCard(k);
    return c>1 ? {key:k,code:t.fifa,num:n,count:c,team:t} : null;
  })).filter(Boolean).sort((a,b)=>b.count-a.count);

  const Btn = ({onClick,children,style={}}) => (
    <button onClick={onClick} style={{cursor:"pointer",border:"none",fontFamily:"inherit",...style}}>{children}</button>
  );

  // ════════════════════════════════════════════════════════════════════════════
  return (
    <div style={{minHeight:"100vh",background:C.bg,fontFamily:"-apple-system,'Segoe UI',Roboto,sans-serif",color:C.text,overflowX:"hidden"}}>

      {/* Toast */}
      {toast && (
        <div style={{position:"fixed",top:20,left:"50%",transform:"translateX(-50%)",zIndex:9999,
          padding:"12px 22px",borderRadius:40,fontWeight:700,fontSize:14,whiteSpace:"nowrap",
          background:toast.type==="green"?C.green:C.red,color:"#fff",boxShadow:C.shadowM,animation:"toastIn .25s ease"}}>
          {toast.msg}
        </div>
      )}

      {/* ══ SCANNER ════════════════════════════════════════════════════════════ */}
      {view==="scan" && (
        <div style={{position:"fixed",inset:0,zIndex:100,background:"#0a0a14",
          display:"flex",flexDirection:"column",alignItems:"center",overflowY:"auto"}}>
          <div style={{width:"100%",maxWidth:520,padding:"16px 12px 0",display:"flex",flexDirection:"column",alignItems:"center"}}>

            {/* ── PASO 1: CÁMARA ── */}
            {scanStep==="camera" && (
              <>
                <div style={{position:"relative",width:"100%",borderRadius:20,overflow:"hidden",background:"#111"}}>
                  <video ref={videoRef} autoPlay playsInline muted style={{width:"100%",display:"block",minHeight:220}}/>
                  <canvas ref={canvasRef} style={{display:"none"}}/>
                  <div style={{position:"absolute",inset:0,border:`2px solid ${C.gold}55`,borderRadius:20,pointerEvents:"none"}}/>
                  <div style={{position:"absolute",top:"15%",left:"5%",right:"5%",bottom:"15%",
                    border:`2px dashed ${C.gold}88`,borderRadius:14,pointerEvents:"none"}}/>
                  {/* Esquinas doradas */}
                  {[[0,0],[0,1],[1,0],[1,1]].map(([r,cl],i)=>(
                    <div key={i} style={{position:"absolute",
                      top:r===0?"16px":"auto", bottom:r===1?"16px":"auto",
                      left:cl===0?"16px":"auto", right:cl===1?"16px":"auto",
                      width:22,height:22,
                      borderTop:r===0?`3px solid ${C.gold}`:"none",
                      borderBottom:r===1?`3px solid ${C.gold}`:"none",
                      borderLeft:cl===0?`3px solid ${C.gold}`:"none",
                      borderRight:cl===1?`3px solid ${C.gold}`:"none",
                      pointerEvents:"none"}}/>
                  ))}
                  {/* Indicador del patrón esperado */}
                  <div style={{position:"absolute",bottom:12,left:0,right:0,textAlign:"center",
                    fontSize:12,color:C.gold,fontWeight:700,textShadow:"0 1px 6px #000"}}>
                    Apunta al reverso — la app lee las siglas (ej: CPV 1, MEX 3)
                  </div>
                </div>
                {scanError && (
                  <div style={{width:"100%",marginTop:10,padding:"11px 16px",borderRadius:12,
                    background:"rgba(242,78,78,.15)",border:"1px solid rgba(242,78,78,.3)",
                    color:"#ffaaaa",fontSize:13,textAlign:"center"}}>{scanError}</div>
                )}
                <div style={{display:"flex",gap:10,width:"100%",marginTop:14,paddingBottom:36}}>
                  <Btn onClick={capturePhoto} style={{flex:1,padding:"16px",borderRadius:40,
                    background:C.gold,color:"#fff",fontWeight:900,fontSize:16,
                    boxShadow:`0 4px 20px ${C.gold}55`}}>📸 Capturar</Btn>
                  <Btn onClick={()=>{stopCamera();setScanStep("manual");setScanError(null);}}
                    style={{padding:"16px 18px",borderRadius:40,background:"rgba(255,255,255,.1)",color:"#ccc",fontWeight:700}}>✏️</Btn>
                  <Btn onClick={closeScanner}
                    style={{padding:"16px 18px",borderRadius:40,background:"rgba(255,255,255,.07)",color:"#aaa",fontWeight:700}}>✕</Btn>
                </div>
              </>
            )}

            {/* ── PASO 2: PREVIEW + OCR ── */}
            {scanStep==="preview" && (
              <>
                {capturedImg && (
                  <div style={{position:"relative",width:"100%",borderRadius:20,overflow:"hidden"}}>
                    <img src={capturedImg} alt="captura" style={{width:"100%",display:"block",borderRadius:20}}/>
                    {scanning && (
                      <div style={{position:"absolute",inset:0,background:"rgba(0,0,0,.75)",
                        display:"flex",flexDirection:"column",alignItems:"center",justifyContent:"center",gap:14,borderRadius:20}}>
                        <div style={{width:52,height:52,border:`4px solid ${C.gold}33`,
                          borderTop:`4px solid ${C.gold}`,borderRadius:"50%",animation:"spin .8s linear infinite"}}/>
                        <div style={{color:C.gold,fontWeight:700,fontSize:15}}>Leyendo siglas…</div>
                        <div style={{width:"60%",height:6,borderRadius:3,background:"rgba(255,255,255,.15)",overflow:"hidden"}}>
                          <div style={{height:"100%",width:`${ocrProgress}%`,background:C.gold,borderRadius:3,transition:"width .3s"}}/>
                        </div>
                        <div style={{color:"rgba(255,255,255,.5)",fontSize:12}}>{ocrProgress}%</div>
                      </div>
                    )}
                  </div>
                )}

                {scanError && (
                  <div style={{width:"100%",marginTop:10,padding:"11px 16px",borderRadius:12,
                    background:"rgba(242,78,78,.15)",border:"1px solid rgba(242,78,78,.3)",
                    color:"#ffaaaa",fontSize:13,textAlign:"center"}}>{scanError}</div>
                )}

                {/* Resultados */}
                {!scanning && scanResults.length>0 && (
                  <div style={{width:"100%",marginTop:12,borderRadius:16,
                    background:"rgba(255,255,255,.06)",border:`1px solid ${C.gold}33`,overflow:"hidden"}}>
                    <div style={{padding:"12px 16px",background:`${C.gold}22`,
                      display:"flex",alignItems:"center",justifyContent:"space-between"}}>
                      <span style={{fontWeight:800,color:"#fff"}}>
                        🎯 {scanResults.length} carta{scanResults.length!==1?"s":""} detectada{scanResults.length!==1?"s":""}
                      </span>
                      <span style={{fontSize:11,color:"rgba(255,255,255,.5)"}}>✕ quitar</span>
                    </div>
                    {scanResults.map((r,idx)=>{
                      const team=TEAM_BY_FIFA[r.code];
                      const cur=countCard(r.key); const isDupe=cur>=1;
                      return (
                        <div key={r.key} style={{padding:"10px 16px",borderTop:"1px solid rgba(255,255,255,.07)",
                          display:"flex",alignItems:"center",gap:10,
                          background:isDupe?"rgba(255,123,28,.06)":"transparent"}}>
                          <span style={{fontSize:24}}>{team?.flag||"🌍"}</span>
                          <div style={{flex:1}}>
                            <div style={{fontWeight:700,fontSize:13,color:"#fff"}}>{team?.name}</div>
                            <div style={{display:"flex",gap:6,marginTop:2,alignItems:"center",flexWrap:"wrap"}}>
                              {/* Badge con siglas + número — igual que en la carta real */}
                              <span style={{background:"rgba(255,255,255,.15)",color:"#fff",
                                fontSize:13,fontWeight:900,padding:"2px 10px",borderRadius:8,
                                letterSpacing:1}}>{r.code} {r.num}</span>
                              <span style={{fontSize:11,color:"rgba(255,255,255,.4)"}}>{CARD_TYPE[r.num]}</span>
                              {isDupe && <span style={{fontSize:11,color:C.orange,background:"rgba(255,123,28,.15)",
                                padding:"2px 7px",borderRadius:8,fontWeight:700}}>⚠ Duplicada ({cur}×)</span>}
                            </div>
                          </div>
                          <Btn onClick={()=>setScanResults(p=>p.filter((_,i)=>i!==idx))}
                            style={{background:"rgba(242,78,78,.2)",color:"#ff9090",borderRadius:8,padding:"5px 10px",fontSize:14}}>✕</Btn>
                        </div>
                      );
                    })}
                  </div>
                )}

                {/* Añadir más manualmente al resultado del OCR */}
                {!scanning && (
                  <div style={{width:"100%",marginTop:10,padding:"14px",borderRadius:14,
                    background:"rgba(255,255,255,.05)",border:"1px solid rgba(255,255,255,.1)"}}>
                    <div style={{fontSize:12,color:"rgba(255,255,255,.5)",marginBottom:8}}>
                      ¿No detectó alguna? Agrégala por siglas:
                    </div>
                    <div style={{display:"flex",gap:8}}>
                      <input value={manualCode} onChange={e=>setManualCode(e.target.value.toUpperCase())}
                        placeholder="Siglas (CPV)" maxLength={4}
                        style={{width:90,padding:"10px 10px",borderRadius:10,
                          border:"1.5px solid rgba(255,255,255,.2)",background:"rgba(255,255,255,.08)",
                          color:"#fff",fontSize:15,fontWeight:700,outline:"none",fontFamily:"inherit",
                          textAlign:"center",textTransform:"uppercase",letterSpacing:2}}/>
                      <input value={manualNum} onChange={e=>setManualNum(e.target.value)}
                        placeholder="Nº" type="number" min="1" max="20"
                        style={{width:70,padding:"10px 8px",borderRadius:10,
                          border:"1.5px solid rgba(255,255,255,.2)",background:"rgba(255,255,255,.08)",
                          color:"#fff",fontSize:15,fontWeight:700,outline:"none",fontFamily:"inherit",textAlign:"center"}}/>
                      <Btn onClick={addManual} style={{flex:1,padding:"10px 14px",borderRadius:10,
                        background:C.accent,color:"#fff",fontWeight:700,fontSize:14}}>+ Añadir</Btn>
                    </div>
                    {scanError && <div style={{marginTop:6,fontSize:12,color:"#ff9090",textAlign:"center"}}>{scanError}</div>}
                  </div>
                )}

                {!scanning && (
                  <div style={{display:"flex",gap:10,width:"100%",marginTop:12,paddingBottom:36}}>
                    {scanResults.length>0 && (
                      <Btn onClick={confirmScan} style={{flex:1,padding:"15px",borderRadius:40,
                        background:C.green,color:"#fff",fontWeight:900,fontSize:15,
                        boxShadow:`0 4px 20px ${C.green}44`}}>
                        ➕ Añadir {scanResults.length} carta{scanResults.length!==1?"s":""}
                      </Btn>
                    )}
                    <Btn onClick={()=>{setScanResults([]);setCapturedImg(null);setScanStep("camera");setScanError(null);startCamera();}}
                      style={{padding:"15px 18px",borderRadius:40,background:"rgba(255,255,255,.1)",color:"#ccc",fontWeight:700}}>
                      🔄 Reintentar
                    </Btn>
                    <Btn onClick={closeScanner}
                      style={{padding:"15px 18px",borderRadius:40,background:"rgba(255,255,255,.07)",color:"#aaa",fontWeight:700}}>✕</Btn>
                  </div>
                )}
              </>
            )}

            {/* ── PASO 3: MANUAL PURO ── */}
            {scanStep==="manual" && (
              <>
                <div style={{width:"100%",padding:"20px 0 8px",textAlign:"center"}}>
                  <div style={{fontSize:38}}>✏️</div>
                  <div style={{color:"#fff",fontWeight:800,fontSize:17,marginTop:8}}>Ingresar carta manualmente</div>
                  <div style={{color:"rgba(255,255,255,.45)",fontSize:13,marginTop:4}}>
                    Escribe las siglas y el número como aparecen en el reverso
                  </div>
                  {/* Ejemplo visual */}
                  <div style={{marginTop:12,display:"inline-flex",alignItems:"center",gap:8,
                    background:"rgba(255,255,255,.08)",padding:"8px 18px",borderRadius:12}}>
                    <span style={{color:C.gold,fontWeight:900,fontSize:18,letterSpacing:3}}>CPV</span>
                    <span style={{color:"rgba(255,255,255,.4)",fontSize:18}}>·</span>
                    <span style={{color:C.gold,fontWeight:900,fontSize:18}}>1</span>
                  </div>
                </div>

                <div style={{width:"100%",marginTop:12,padding:"16px",borderRadius:16,
                  background:"rgba(255,255,255,.05)",border:"1px solid rgba(255,255,255,.12)"}}>
                  <div style={{display:"flex",gap:10,alignItems:"center"}}>
                    <div style={{flex:1}}>
                      <div style={{fontSize:11,color:"rgba(255,255,255,.4)",marginBottom:4}}>SIGLAS FIFA</div>
                      <input value={manualCode} onChange={e=>setManualCode(e.target.value.toUpperCase())}
                        placeholder="MEX" maxLength={4}
                        style={{width:"100%",padding:"14px 12px",borderRadius:12,
                          border:`2px solid ${C.gold}66`,background:"rgba(255,255,255,.1)",
                          color:"#fff",fontSize:20,fontWeight:900,outline:"none",fontFamily:"inherit",
                          textAlign:"center",textTransform:"uppercase",letterSpacing:3}}/>
                    </div>
                    <div style={{fontSize:24,color:"rgba(255,255,255,.2)",paddingTop:20}}>/</div>
                    <div style={{width:90}}>
                      <div style={{fontSize:11,color:"rgba(255,255,255,.4)",marginBottom:4}}>NÚMERO</div>
                      <input value={manualNum} onChange={e=>setManualNum(e.target.value)}
                        placeholder="1" type="number" min="1" max="20"
                        style={{width:"100%",padding:"14px 8px",borderRadius:12,
                          border:`2px solid ${C.gold}66`,background:"rgba(255,255,255,.1)",
                          color:"#fff",fontSize:20,fontWeight:900,outline:"none",fontFamily:"inherit",textAlign:"center"}}/>
                    </div>
                  </div>
                  {scanError && <div style={{marginTop:8,fontSize:12,color:"#ff9090",textAlign:"center"}}>{scanError}</div>}
                  <Btn onClick={addManual} style={{marginTop:12,width:"100%",padding:"13px",borderRadius:40,
                    background:C.accent,color:"#fff",fontWeight:800,fontSize:15}}>
                    Agregar carta
                  </Btn>
                </div>

                {/* Lista de cartas por añadir */}
                {scanResults.length>0 && (
                  <div style={{width:"100%",marginTop:10,borderRadius:14,
                    background:"rgba(255,255,255,.05)",border:`1px solid ${C.gold}33`,overflow:"hidden"}}>
                    <div style={{padding:"10px 14px",background:`${C.gold}22`,fontWeight:700,color:"#fff",fontSize:13}}>
                      📋 Por añadir ({scanResults.length})
                    </div>
                    {scanResults.map((r,idx)=>{
                      const team=TEAM_BY_FIFA[r.code];
                      return (
                        <div key={r.key} style={{padding:"9px 14px",borderTop:"1px solid rgba(255,255,255,.06)",
                          display:"flex",alignItems:"center",gap:10}}>
                          <span style={{fontSize:22}}>{team?.flag||"🌍"}</span>
                          <div style={{flex:1}}>
                            <div style={{fontWeight:700,fontSize:12,color:"#fff"}}>{team?.name}</div>
                            <div style={{fontSize:11,color:"rgba(255,255,255,.4)"}}>{CARD_TYPE[r.num]}</div>
                          </div>
                          <span style={{fontWeight:900,color:C.gold,fontSize:14,letterSpacing:1}}>{r.code} {r.num}</span>
                          <Btn onClick={()=>setScanResults(p=>p.filter((_,i)=>i!==idx))}
                            style={{background:"rgba(242,78,78,.2)",color:"#ff9090",borderRadius:8,padding:"4px 9px",fontSize:13}}>✕</Btn>
                        </div>
                      );
                    })}
                  </div>
                )}

                <div style={{display:"flex",gap:10,width:"100%",marginTop:14,paddingBottom:36}}>
                  {scanResults.length>0 && (
                    <Btn onClick={confirmScan} style={{flex:1,padding:"15px",borderRadius:40,
                      background:C.green,color:"#fff",fontWeight:900,fontSize:15}}>
                      ➕ Añadir {scanResults.length} carta{scanResults.length!==1?"s":""}
                    </Btn>
                  )}
                  <Btn onClick={()=>{setScanStep("camera");setScanError(null);setScanResults([]);startCamera();}}
                    style={{padding:"15px 18px",borderRadius:40,background:"rgba(255,255,255,.1)",color:"#ccc",fontWeight:700}}>
                    📸 Cámara
                  </Btn>
                  <Btn onClick={closeScanner}
                    style={{padding:"15px 18px",borderRadius:40,background:"rgba(255,255,255,.07)",color:"#aaa",fontWeight:700}}>✕</Btn>
                </div>
              </>
            )}
          </div>
        </div>
      )}

      {/* ══ TEAM DETAIL ════════════════════════════════════════════════════════ */}
      {view==="team" && selectedTeam && (()=>{
        const team=TEAM_BY_FIFA[selectedTeam]; if(!team) return null;
        const {got,total,pct:tp}=teamStats(team); const [c1,c2]=team.colors;
        return (
          <div style={{position:"fixed",inset:0,zIndex:50,background:C.bg,overflowY:"auto"}}>
            <div style={{padding:"18px 16px 22px",
              background:`linear-gradient(135deg,${c1}22,${c2}11)`,
              borderBottom:`1px solid ${C.border}`,position:"sticky",top:0,zIndex:5}}>
              <Btn onClick={()=>setView("album")} style={{background:C.card,color:C.text,borderRadius:10,
                padding:"6px 14px",fontSize:13,fontWeight:700,boxShadow:C.shadow,marginBottom:12}}>← Volver</Btn>
              <div style={{display:"flex",alignItems:"center",gap:14}}>
                <span style={{fontSize:56}}>{team.flag}</span>
                <div style={{flex:1}}>
                  <div style={{fontSize:10,fontWeight:800,letterSpacing:2,color:C.sub,textTransform:"uppercase"}}>
                    Grupo {team.group} · {team.fifa}
                  </div>
                  <h2 style={{margin:"2px 0 0",fontSize:22,fontWeight:900,color:C.text}}>{team.name}</h2>
                  <div style={{fontSize:12,color:C.sub,marginTop:2}}>{got}/{total} cartas · {tp}%</div>
                  <div style={{marginTop:8,height:6,borderRadius:3,background:C.border}}>
                    <div style={{height:"100%",width:`${tp}%`,
                      background:`linear-gradient(90deg,${c1},${c2})`,borderRadius:3,transition:"width .5s"}}/>
                  </div>
                </div>
              </div>
            </div>
            <div style={{padding:"14px 12px 80px"}}>
              <div style={{display:"grid",gridTemplateColumns:"repeat(auto-fill,minmax(88px,1fr))",gap:10}}>
                {team.nums.map(n=>{
                  const k=cardKey(team.fifa,n);
                  const count=countCard(k); const has=count>=1; const isDupe=count>1;
                  return (
                    <div key={n} style={{borderRadius:14,overflow:"hidden",
                      background:has?`linear-gradient(145deg,${c1}22,${c2}11)`:C.card,
                      border:`2px solid ${has?c1:C.border}`,
                      boxShadow:has?`0 4px 16px ${c1}33`:C.shadow,
                      transform:has?"scale(1.03)":"scale(1)",transition:"all .18s",position:"relative"}}>
                      <div style={{aspectRatio:"2/3",display:"flex",flexDirection:"column",
                        alignItems:"center",justifyContent:"center",padding:8,
                        background:has?`linear-gradient(160deg,${c1}18,${c2}0C)`:"#fafafa"}}>
                        {has?<span style={{fontSize:28}}>{team.flag}</span>
                          :<div style={{fontSize:22,color:C.border,fontWeight:900}}>?</div>}
                        <div style={{fontSize:9,fontWeight:700,color:C.sub,marginTop:4,textAlign:"center",lineHeight:1.2}}>
                          {CARD_TYPE[n]}
                        </div>
                        {/* Badge siglas + número — formato real de la carta */}
                        <div style={{marginTop:5,background:has?c1+"22":C.border+"80",
                          borderRadius:6,padding:"2px 6px",fontSize:10,fontWeight:900,
                          color:has?c1:C.sub,letterSpacing:1}}>
                          {team.fifa} {n}
                        </div>
                        {has && <div style={{position:"absolute",top:4,left:4,width:16,height:16,
                          borderRadius:"50%",background:C.green,display:"flex",alignItems:"center",
                          justifyContent:"center",fontSize:9,color:"#fff",fontWeight:900}}>✓</div>}
                        {isDupe && <div style={{position:"absolute",top:4,right:4,minWidth:16,height:16,
                          borderRadius:8,background:C.orange,display:"flex",alignItems:"center",
                          justifyContent:"center",fontSize:9,color:"#fff",fontWeight:900,padding:"0 3px"}}>×{count}</div>}
                      </div>
                      <div style={{display:"flex",borderTop:`1px solid ${C.border}`}}>
                        <Btn onClick={()=>removeCard(k)} style={{flex:1,padding:"7px 0",
                          background:C.redL,color:C.red,fontSize:16,fontWeight:900}}>−</Btn>
                        <div style={{width:1,background:C.border}}/>
                        <Btn onClick={()=>addCard(k)} style={{flex:1,padding:"7px 0",
                          background:C.greenL,color:C.green,fontSize:16,fontWeight:900}}>+</Btn>
                      </div>
                    </div>
                  );
                })}
              </div>
            </div>
          </div>
        );
      })()}

      {/* ══ STATS ══════════════════════════════════════════════════════════════ */}
      {view==="stats" && (
        <div style={{position:"fixed",inset:0,zIndex:50,background:C.bg,overflowY:"auto"}}>
          <div style={{padding:"18px 16px",display:"flex",alignItems:"center",gap:12,
            position:"sticky",top:0,background:C.bg,zIndex:5,borderBottom:`1px solid ${C.border}`}}>
            <Btn onClick={()=>setView("album")} style={{background:C.card,color:C.text,borderRadius:10,padding:"6px 14px",fontWeight:700,boxShadow:C.shadow}}>← Volver</Btn>
            <h2 style={{margin:0,fontSize:19,fontWeight:900}}>📊 Estadísticas</h2>
          </div>
          <div style={{padding:"18px 14px",display:"flex",flexDirection:"column",gap:14}}>
            <div style={{display:"grid",gridTemplateColumns:"1fr 1fr",gap:12}}>
              {[
                {label:"Cartas únicas",    value:uniqueCount, total:TOTAL_CARDS, color:C.accent, icon:"🃏"},
                {label:"Me faltan",        value:missing,     total:TOTAL_CARDS, color:C.red,    icon:"❓"},
                {label:"Para intercambio", value:dupesCnt,    total:null,        color:C.orange, icon:"🔄"},
                {label:"Equipos completos",value:teamsOk,     total:48,          color:C.green,  icon:"✅"},
              ].map(s=>(
                <div key={s.label} style={{borderRadius:16,padding:"16px",background:C.card,boxShadow:C.shadow}}>
                  <div style={{fontSize:24,marginBottom:6}}>{s.icon}</div>
                  <div style={{fontSize:30,fontWeight:900,color:s.color}}>{s.value}</div>
                  <div style={{fontSize:11,color:C.sub,marginTop:2}}>{s.label}</div>
                  {s.total && <div style={{fontSize:10,color:"#ccc",marginTop:1}}>de {s.total}</div>}
                  {s.total && typeof s.value==="number" && (
                    <div style={{marginTop:8,height:4,borderRadius:2,background:C.border}}>
                      <div style={{height:"100%",width:`${Math.round(s.value/s.total*100)}%`,background:s.color,borderRadius:2}}/>
                    </div>
                  )}
                </div>
              ))}
            </div>
            <div style={{borderRadius:16,padding:"20px",background:C.card,boxShadow:C.shadow}}>
              <div style={{display:"flex",justifyContent:"space-between",alignItems:"baseline",marginBottom:12}}>
                <span style={{fontWeight:800,fontSize:15}}>Progreso total</span>
                <span style={{fontSize:36,fontWeight:900,color:C.gold}}>{pct}%</span>
              </div>
              <div style={{height:14,borderRadius:7,background:C.border}}>
                <div style={{height:"100%",width:`${pct}%`,borderRadius:7,
                  background:`linear-gradient(90deg,${C.gold},${C.orange})`,transition:"width .6s"}}/>
              </div>
              <div style={{display:"flex",justifyContent:"space-between",marginTop:8,fontSize:12,color:C.sub}}>
                <span>✅ {uniqueCount} tengo</span><span>❓ {missing} faltan</span>
              </div>
            </div>
            <div style={{borderRadius:16,overflow:"hidden",background:C.card,boxShadow:C.shadow}}>
              <div style={{padding:"14px 16px",borderBottom:`1px solid ${C.border}`,fontWeight:800,fontSize:14}}>Por grupo</div>
              {GROUPS_ORDER.map(g=>{
                const teams=GROUPS_MAP[g];
                const gGot=teams.reduce((s,t)=>s+t.nums.filter(n=>hasCard(cardKey(t.fifa,n))).length,0);
                const gTotal=teams.length*20; const gPct=Math.round(gGot/gTotal*100);
                return (
                  <div key={g} style={{padding:"10px 16px",borderTop:`1px solid ${C.border}`,display:"flex",alignItems:"center",gap:10}}>
                    <div style={{width:50,fontWeight:700,fontSize:12,color:C.accent}}>Grupo {g}</div>
                    <div style={{flex:1,height:5,borderRadius:3,background:C.border}}>
                      <div style={{height:"100%",width:`${gPct}%`,background:`linear-gradient(90deg,${C.accent},${C.gold})`,borderRadius:3}}/>
                    </div>
                    <div style={{width:52,textAlign:"right",fontSize:11,color:C.sub}}>{gGot}/{gTotal}</div>
                    <div style={{width:32,textAlign:"right",fontWeight:700,fontSize:12}}>{gPct}%</div>
                  </div>
                );
              })}
            </div>
          </div>
        </div>
      )}

      {/* ══ DUPLICADOS ═════════════════════════════════════════════════════════ */}
      {view==="dupes" && (
        <div style={{position:"fixed",inset:0,zIndex:50,background:C.bg,overflowY:"auto"}}>
          <div style={{padding:"18px 16px",display:"flex",alignItems:"center",gap:12,
            position:"sticky",top:0,background:C.bg,zIndex:5,borderBottom:`1px solid ${C.border}`}}>
            <Btn onClick={()=>setView("album")} style={{background:C.card,color:C.text,borderRadius:10,padding:"6px 14px",fontWeight:700,boxShadow:C.shadow}}>← Volver</Btn>
            <h2 style={{margin:0,fontSize:19,fontWeight:900}}>🔄 Mis Duplicados</h2>
            {dupesCnt>0 && pill(C.orangeL,C.orange,`${dupesCnt} para intercambio`)}
          </div>
          <div style={{padding:"14px 12px 80px"}}>
            {dupesList.length===0 ? (
              <div style={{textAlign:"center",padding:"60px 20px"}}>
                <div style={{fontSize:56}}>🎉</div>
                <div style={{marginTop:14,fontSize:17,fontWeight:700}}>¡Sin duplicados!</div>
                <div style={{marginTop:6,fontSize:13,color:C.sub}}>Las cartas repetidas aparecerán aquí</div>
              </div>
            ) : dupesList.map(({key,code,num,count,team})=>{
              const [c1]=team?.colors||["#aaa"];
              return (
                <div key={key} style={{borderRadius:14,padding:"12px 14px",display:"flex",alignItems:"center",gap:12,
                  background:C.card,boxShadow:C.shadow,marginBottom:8,border:`1px solid ${C.border}`}}>
                  <span style={{fontSize:30}}>{team?.flag||"🌍"}</span>
                  <div style={{flex:1}}>
                    <div style={{fontWeight:700,fontSize:13}}>{team?.name}</div>
                    <div style={{fontSize:11,color:C.sub}}>{CARD_TYPE[num]} · Grupo {team?.group}</div>
                  </div>
                  {/* Badge formato carta real */}
                  <span style={{fontWeight:900,color:c1,fontSize:13,background:`${c1}18`,
                    padding:"3px 10px",borderRadius:8,letterSpacing:1}}>{code} {num}</span>
                  <div style={{display:"flex",alignItems:"center",gap:8}}>
                    <Btn onClick={()=>removeCard(key)} style={{width:30,height:30,borderRadius:"50%",background:C.redL,color:C.red,fontSize:16,fontWeight:900}}>−</Btn>
                    <div style={{textAlign:"center",minWidth:34}}>
                      <div style={{fontSize:17,fontWeight:900,color:C.orange}}>×{count}</div>
                      <div style={{fontSize:10,color:C.sub}}>{count-1} extra</div>
                    </div>
                    <Btn onClick={()=>addCard(key)} style={{width:30,height:30,borderRadius:"50%",background:C.greenL,color:C.green,fontSize:16,fontWeight:900}}>+</Btn>
                  </div>
                </div>
              );
            })}
          </div>
        </div>
      )}

      {/* ══ INTERCAMBIO ════════════════════════════════════════════════════════ */}
      {view==="trade" && (
        <div style={{position:"fixed",inset:0,zIndex:50,background:C.bg,overflowY:"auto"}}>
          <div style={{padding:"18px 16px",display:"flex",alignItems:"center",gap:12,
            position:"sticky",top:0,background:C.bg,zIndex:5,borderBottom:`1px solid ${C.border}`}}>
            <Btn onClick={()=>setView("album")} style={{background:C.card,color:C.text,borderRadius:10,padding:"6px 14px",fontWeight:700,boxShadow:C.shadow}}>← Volver</Btn>
            <h2 style={{margin:0,fontSize:19,fontWeight:900}}>🤝 Intercambio</h2>
          </div>
          <div style={{padding:"18px 14px",display:"flex",flexDirection:"column",gap:16}}>
            <div style={{borderRadius:16,padding:"18px",background:C.card,boxShadow:C.shadow}}>
              <div style={{fontWeight:800,fontSize:14,marginBottom:12}}>👤 Mi perfil</div>
              {editingName ? (
                <div style={{display:"flex",gap:8}}>
                  <input value={myName} onChange={e=>setMyName(e.target.value)} placeholder="Tu nombre de usuario"
                    style={{flex:1,padding:"10px 14px",borderRadius:10,border:`1.5px solid ${C.accent}`,fontSize:14,outline:"none",fontFamily:"inherit"}}/>
                  <Btn onClick={()=>setEditingName(false)} style={{padding:"10px 16px",borderRadius:10,background:C.accentL,color:C.accent,fontWeight:700}}>OK</Btn>
                </div>
              ) : (
                <div style={{display:"flex",alignItems:"center",gap:10}}>
                  <div style={{flex:1,fontSize:16,fontWeight:700}}>{myName||<span style={{color:C.sub}}>Sin nombre</span>}</div>
                  <Btn onClick={()=>setEditingName(true)} style={{padding:"8px 14px",borderRadius:10,background:C.accentL,color:C.accent,fontWeight:700,fontSize:13}}>✏️ Editar</Btn>
                </div>
              )}
              <Btn onClick={publishMyCollection} style={{marginTop:12,width:"100%",padding:"12px",borderRadius:40,
                background:myName?C.accent:C.border,color:myName?"#fff":C.sub,fontWeight:800,fontSize:14}}>
                ☁️ Publicar mi colección
              </Btn>
              <div style={{marginTop:8,fontSize:11,color:C.sub,textAlign:"center"}}>
                Publica para que tus amigos puedan comparar contigo
              </div>
            </div>

            <div style={{borderRadius:16,padding:"18px",background:C.card,boxShadow:C.shadow}}>
              <div style={{fontWeight:800,fontSize:14,marginBottom:12}}>🔍 Buscar colección de un amigo</div>
              <div style={{display:"flex",gap:8}}>
                <input value={friendInput} onChange={e=>setFriendInput(e.target.value)}
                  placeholder="Nombre de usuario" onKeyDown={e=>e.key==="Enter"&&searchFriend()}
                  style={{flex:1,padding:"10px 14px",borderRadius:10,border:`1.5px solid ${C.border}`,fontSize:14,outline:"none",fontFamily:"inherit"}}/>
                <Btn onClick={searchFriend} style={{padding:"10px 18px",borderRadius:10,background:C.accent,color:"#fff",fontWeight:700}}>Buscar</Btn>
              </div>
              {friendData && (
                <div style={{marginTop:14,display:"flex",alignItems:"center",gap:10,padding:"10px 14px",
                  borderRadius:12,background:C.accentL}}>
                  <span style={{fontSize:22}}>👤</span>
                  <div>
                    <div style={{fontWeight:800}}>{friendData.name}</div>
                    <div style={{fontSize:12,color:C.sub}}>
                      {Object.values(friendData.collected).filter(v=>v>0).length} cartas únicas
                    </div>
                  </div>
                  <Btn onClick={()=>setView("tradeCmp")} style={{marginLeft:"auto",padding:"8px 16px",
                    borderRadius:40,background:C.accent,color:"#fff",fontWeight:700,fontSize:13}}>
                    Ver intercambio →
                  </Btn>
                </div>
              )}
            </div>
          </div>
        </div>
      )}

      {/* ══ COMPARAR ═══════════════════════════════════════════════════════════ */}
      {view==="tradeCmp" && friendData && (
        <div style={{position:"fixed",inset:0,zIndex:50,background:C.bg,overflowY:"auto"}}>
          <div style={{padding:"18px 16px",display:"flex",alignItems:"center",gap:12,
            position:"sticky",top:0,background:C.bg,zIndex:5,borderBottom:`1px solid ${C.border}`}}>
            <Btn onClick={()=>setView("trade")} style={{background:C.card,color:C.text,borderRadius:10,padding:"6px 14px",fontWeight:700,boxShadow:C.shadow}}>← Volver</Btn>
            <div>
              <h2 style={{margin:0,fontSize:17,fontWeight:900}}>Con {friendData.name}</h2>
              <div style={{fontSize:11,color:C.sub}}>Intercambio posible</div>
            </div>
          </div>
          <div style={{padding:"16px 14px",display:"flex",flexDirection:"column",gap:14}}>
            <div style={{display:"grid",gridTemplateColumns:"1fr 1fr",gap:10}}>
              <div style={{borderRadius:14,padding:"16px",background:C.greenL,border:`1px solid ${C.green}33`}}>
                <div style={{fontSize:11,fontWeight:700,color:C.green,textTransform:"uppercase",letterSpacing:1}}>Me puede dar</div>
                <div style={{fontSize:32,fontWeight:900,color:C.green,marginTop:4}}>{tradeCards.length}</div>
                <div style={{fontSize:12,color:C.sub}}>cartas que me faltan</div>
              </div>
              <div style={{borderRadius:14,padding:"16px",background:C.accentL,border:`1px solid ${C.accent}33`}}>
                <div style={{fontSize:11,fontWeight:700,color:C.accent,textTransform:"uppercase",letterSpacing:1}}>Puedo darle</div>
                <div style={{fontSize:32,fontWeight:900,color:C.accent,marginTop:4}}>{iCanGive.length}</div>
                <div style={{fontSize:12,color:C.sub}}>cartas que le faltan</div>
              </div>
            </div>

            {[
              {title:`🎁 ${friendData.name} me puede dar`, list:tradeCards, color:C.green, colorL:C.greenL, action:k=>addCard(k), actionLabel:"+ Recibir"},
              {title:`🤲 Yo le doy a ${friendData.name}`,  list:iCanGive,  color:C.accent,colorL:C.accentL,action:k=>removeCard(k), actionLabel:"− Dar"},
            ].map(section=>(
              <div key={section.title} style={{borderRadius:16,background:C.card,boxShadow:C.shadow,overflow:"hidden"}}>
                <div style={{padding:"14px 16px",borderBottom:`1px solid ${C.border}`,
                  display:"flex",alignItems:"center",gap:10}}>
                  <div style={{flex:1}}>
                    <div style={{fontWeight:800,fontSize:14}}>{section.title}</div>
                  </div>
                  {pill(section.colorL,section.color,`${section.list.length} cartas`)}
                </div>
                {section.list.length===0 ? (
                  <div style={{padding:"22px",textAlign:"center",color:C.sub,fontSize:13}}>
                    No hay cartas para intercambiar aquí 😔
                  </div>
                ) : (
                  <div style={{padding:"10px 12px",display:"flex",flexDirection:"column",gap:6}}>
                    {section.list.map(({key,code,num,team})=>{
                      const [c1]=team.colors;
                      return (
                        <div key={key} style={{display:"flex",alignItems:"center",gap:10,padding:"8px 10px",
                          borderRadius:10,background:C.bg,border:`1px solid ${C.border}`}}>
                          <span style={{fontSize:22}}>{team.flag}</span>
                          <div style={{flex:1}}>
                            <div style={{fontWeight:700,fontSize:13}}>{team.name}</div>
                            <div style={{fontSize:11,color:C.sub}}>{CARD_TYPE[num]}</div>
                          </div>
                          <span style={{fontWeight:900,color:c1,fontSize:13,
                            background:`${c1}18`,padding:"2px 8px",borderRadius:6,letterSpacing:1}}>
                            {code} {num}
                          </span>
                          <Btn onClick={()=>section.action(key)} style={{padding:"5px 10px",borderRadius:20,
                            background:section.colorL,color:section.color,fontWeight:700,fontSize:12}}>
                            {section.actionLabel}
                          </Btn>
                        </div>
                      );
                    })}
                  </div>
                )}
              </div>
            ))}
          </div>
        </div>
      )}

      {/* ══ ÁLBUM PRINCIPAL ════════════════════════════════════════════════════ */}
      {view==="album" && (
        <div style={{position:"relative",zIndex:1,paddingBottom:110}}>
          <div style={{padding:"22px 16px 12px",position:"sticky",top:0,zIndex:10,
            background:C.bg,borderBottom:`1px solid ${C.border}`}}>
            <div style={{display:"flex",alignItems:"flex-start",justifyContent:"space-between"}}>
              <div>
                <div style={{fontSize:10,fontWeight:800,letterSpacing:4,color:C.sub,textTransform:"uppercase"}}>Álbum Panini</div>
                <h1 style={{margin:"2px 0 0",fontSize:24,fontWeight:900,lineHeight:1.1,color:C.text}}>Mundial 2026 ⚽</h1>
                <div style={{fontSize:11,color:C.sub,marginTop:1}}>48 selecciones · 960 estampas · 12 grupos</div>
              </div>
              <div style={{textAlign:"right"}}>
                <div style={{fontSize:34,fontWeight:900,color:C.gold,lineHeight:1}}>{pct}%</div>
                <div style={{fontSize:11,color:C.sub}}>{uniqueCount}/{TOTAL_CARDS}</div>
              </div>
            </div>
            <div style={{marginTop:12,height:6,borderRadius:3,background:C.border}}>
              <div style={{height:"100%",width:`${pct}%`,
                background:`linear-gradient(90deg,${C.gold},${C.orange})`,borderRadius:3,transition:"width .6s"}}/>
            </div>
            <div style={{display:"flex",gap:6,marginTop:12}}>
              {[
                {label:"Tengo",  val:uniqueCount, color:C.green,  bg:C.greenL,  click:null},
                {label:"Faltan", val:missing,     color:C.red,    bg:C.redL,    click:null},
                {label:"Duplis", val:dupesCnt,    color:C.orange, bg:C.orangeL, click:()=>setView("dupes")},
                {label:"Stats",  val:"📊",        color:C.accent, bg:C.accentL, click:()=>setView("stats")},
              ].map(s=>(
                <Btn key={s.label} onClick={s.click||undefined}
                  style={{flex:1,textAlign:"center",background:s.bg,borderRadius:12,padding:"8px 4px"}}>
                  <div style={{fontSize:16,fontWeight:900,color:s.color}}>{s.val}</div>
                  <div style={{fontSize:10,color:C.sub}}>{s.label}</div>
                </Btn>
              ))}
            </div>
            <div style={{display:"flex",gap:6,marginTop:10,overflowX:"auto",paddingBottom:2}}>
              {["all",...GROUPS_ORDER].map(g=>(
                <Btn key={g} onClick={()=>setFilterGroup(g)} style={{padding:"5px 12px",borderRadius:20,flexShrink:0,
                  background:filterGroup===g?C.accent:C.card,color:filterGroup===g?"#fff":C.sub,
                  fontWeight:700,fontSize:11,boxShadow:filterGroup===g?`0 2px 8px ${C.accent}44`:C.shadow}}>
                  {g==="all"?"Todos":`G-${g}`}
                </Btn>
              ))}
            </div>
          </div>

          {filteredGroups.map(([g,teams])=>(
            <div key={g} style={{marginBottom:4}}>
              <div style={{padding:"12px 16px 4px",display:"flex",alignItems:"center",gap:8}}>
                <div style={{fontSize:10,fontWeight:800,letterSpacing:3,color:C.accent,textTransform:"uppercase"}}>Grupo {g}</div>
                <div style={{display:"flex",gap:4}}>{teams.map(t=><span key={t.fifa} style={{fontSize:15}}>{t.flag}</span>)}</div>
              </div>
              <div style={{display:"flex",flexDirection:"column",gap:6,padding:"0 10px"}}>
                {teams.map(team=>{
                  const {got,total,pct:tp}=teamStats(team); const [c1,c2]=team.colors;
                  const complete=got===total;
                  const tDupes=team.nums.reduce((s,n)=>s+Math.max(0,countCard(cardKey(team.fifa,n))-1),0);
                  return (
                    <div key={team.fifa} onClick={()=>{setSelectedTeam(team.fifa);setView("team");}}
                      style={{borderRadius:14,padding:"12px 14px",cursor:"pointer",
                        background:C.card,border:`1.5px solid ${complete?c1+"66":C.border}`,
                        display:"flex",alignItems:"center",gap:12,
                        boxShadow:complete?`0 4px 16px ${c1}22`:C.shadow,transition:"all .15s"}}>
                      <span style={{fontSize:32,lineHeight:1,flexShrink:0}}>{team.flag}</span>
                      <div style={{flex:1,minWidth:0}}>
                        <div style={{fontWeight:800,fontSize:13,display:"flex",alignItems:"center",gap:6,flexWrap:"wrap"}}>
                          {team.name}
                          {/* Badge siglas FIFA */}
                          <span style={{fontSize:10,fontWeight:700,color:C.sub,background:C.border,
                            padding:"1px 6px",borderRadius:6,letterSpacing:1}}>{team.fifa}</span>
                          {complete && pill(C.greenL,C.green,"✓ Completa")}
                          {tDupes>0 && pill(C.orangeL,C.orange,`×${tDupes}`)}
                        </div>
                        <div style={{marginTop:6,height:4,borderRadius:2,background:C.border}}>
                          <div style={{height:"100%",width:`${tp}%`,
                            background:`linear-gradient(90deg,${c1},${c2})`,borderRadius:2,transition:"width .4s"}}/>
                        </div>
                        <div style={{marginTop:3,fontSize:11,color:C.sub}}>{got}/{total} · faltan {total-got}</div>
                      </div>
                      <div style={{fontWeight:900,fontSize:15,color:tp===100?C.gold:C.border,flexShrink:0}}>{tp}%</div>
                    </div>
                  );
                })}
              </div>
            </div>
          ))}
        </div>
      )}

      {/* ══ BOTTOM NAV ═════════════════════════════════════════════════════════ */}
      {view==="album" && (
        <div style={{position:"fixed",bottom:0,left:0,right:0,zIndex:20,
          background:"rgba(245,246,250,.97)",backdropFilter:"blur(20px)",
          borderTop:`1px solid ${C.border}`,padding:"10px 12px 22px",display:"flex",gap:8}}>
          <Btn onClick={startCamera} style={{flex:2,padding:"14px",borderRadius:40,
            background:`linear-gradient(135deg,${C.gold},${C.orange})`,color:"#fff",
            fontWeight:900,fontSize:14,boxShadow:`0 4px 20px ${C.gold}44`}}>
            📸 Escanear cartas
          </Btn>
          <Btn onClick={()=>setView("dupes")} style={{flex:1,padding:"14px",borderRadius:40,
            background:dupesCnt>0?C.orangeL:C.card,color:dupesCnt>0?C.orange:C.sub,
            fontWeight:700,fontSize:13,boxShadow:C.shadow,
            border:`1px solid ${dupesCnt>0?C.orange+"44":C.border}`}}>
            🔄{dupesCnt>0?` ${dupesCnt}`:""}
          </Btn>
          <Btn onClick={()=>setView("trade")} style={{flex:1,padding:"14px",borderRadius:40,
            background:C.accentL,color:C.accent,fontWeight:700,fontSize:13,
            boxShadow:C.shadow,border:`1px solid ${C.accent}33`}}>🤝</Btn>
        </div>
      )}

      <style>{`
        @keyframes toastIn{from{opacity:0;transform:translateX(-50%) translateY(-10px)}to{opacity:1;transform:translateX(-50%) translateY(0)}}
        @keyframes spin{to{transform:rotate(360deg)}}
        *{box-sizing:border-box}
        ::-webkit-scrollbar{width:3px;height:3px}
        ::-webkit-scrollbar-thumb{background:${C.border};border-radius:2px}
        button:active{opacity:.85;transform:scale(.97)}
        input:focus{border-color:${C.accent}!important;box-shadow:0 0 0 3px ${C.accent}22}
      `}</style>
    </div>
  );
}
