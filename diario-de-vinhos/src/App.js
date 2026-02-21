import { useState, useEffect } from "react";
import {
  collection, addDoc, getDocs, deleteDoc, doc, updateDoc, onSnapshot, query, orderBy
} from "firebase/firestore";
import {
  createUserWithEmailAndPassword, signInWithEmailAndPassword,
  signOut, onAuthStateChanged, updateProfile
} from "firebase/auth";
import { db, auth } from "./firebase";

// ── Star Rating ───────────────────────────────────────────────────────────────
function Stars({ value, onChange, size = 24 }) {
  const [hover, setHover] = useState(0);
  return (
    <div style={{ display: "flex", gap: 3 }}>
      {[1,2,3,4,5,6,7,8,9,10].map((s) => (
        <span
          key={s}
          onClick={() => onChange && onChange(s)}
          onMouseEnter={() => onChange && setHover(s)}
          onMouseLeave={() => onChange && setHover(0)}
          style={{
            fontSize: size, cursor: onChange ? "pointer" : "default",
            color: s <= (hover || value) ? "#c9956b" : "#3a2a2a",
            transition: "color 0.15s", userSelect: "none",
          }}
        >★</span>
      ))}
    </div>
  );
}

// ── Wine Card ─────────────────────────────────────────────────────────────────
function WineCard({ wine, currentUser, onRate, onDelete }) {
  const [expanded, setExpanded] = useState(false);
  const userRating = wine.ratings?.find((r) => r.userId === currentUser?.uid);
  const avgRating = wine.ratings?.length
    ? (wine.ratings.reduce((s, r) => s + r.score, 0) / wine.ratings.length).toFixed(1)
    : "—";

  const typeColor = {
    Tinto: "#8b1a1a", Branco: "#c8b560", Rosé: "#d4607a",
    Espumante: "#7ba7bc", Sobremesa: "#a0522d",
  };

  return (
    <div style={{
      background: "linear-gradient(135deg, #1a0f0f 0%, #221515 100%)",
      border: "1px solid #3d2020", borderRadius: 16, overflow: "hidden",
      transition: "transform 0.2s, box-shadow 0.2s",
      boxShadow: "0 4px 20px rgba(0,0,0,0.4)",
    }}
      onMouseEnter={(e) => { e.currentTarget.style.transform = "translateY(-4px)"; e.currentTarget.style.boxShadow = "0 12px 40px rgba(0,0,0,0.6)"; }}
      onMouseLeave={(e) => { e.currentTarget.style.transform = "translateY(0)"; e.currentTarget.style.boxShadow = "0 4px 20px rgba(0,0,0,0.4)"; }}
    >
      <div style={{ display: "flex", gap: 16, padding: 20 }}>
        <div style={{
          width: 80, height: 110, borderRadius: 8, overflow: "hidden", flexShrink: 0,
          background: "#2a1515", display: "flex", alignItems: "center", justifyContent: "center",
          fontSize: 36, border: "1px solid #3d2020",
        }}>
          {wine.photo
            ? <img src={wine.photo} alt="" style={{ width: "100%", height: "100%", objectFit: "cover" }} />
            : "🍷"}
        </div>
        <div style={{ flex: 1, minWidth: 0 }}>
          <div style={{ display: "flex", alignItems: "flex-start", justifyContent: "space-between", gap: 8 }}>
            <div>
              <div style={{
                display: "inline-block", background: typeColor[wine.type] || "#5a2020",
                color: "#fff", fontSize: 11, fontWeight: 700, letterSpacing: 1.5,
                padding: "2px 10px", borderRadius: 20, marginBottom: 6, textTransform: "uppercase",
              }}>{wine.type}</div>
              <div style={{ fontFamily: "'Playfair Display', serif", fontSize: 20, color: "#f0e0d0", lineHeight: 1.2, marginBottom: 4 }}>
                {wine.name}
              </div>
              <div style={{ fontSize: 13, color: "#8a6a5a" }}>
                {[wine.region, wine.country].filter(Boolean).join(" · ")}
                {wine.vintage ? ` · ${wine.vintage}` : ""}
              </div>
            </div>
            <div style={{ textAlign: "center", flexShrink: 0 }}>
              <div style={{ fontFamily: "'Playfair Display', serif", fontSize: 32, color: "#c9956b", lineHeight: 1 }}>{avgRating}</div>
              <div style={{ fontSize: 11, color: "#6a4a3a", letterSpacing: 1 }}>MÉDIA</div>
              <div style={{ fontSize: 11, color: "#6a4a3a" }}>{wine.ratings?.length || 0} aval.</div>
            </div>
          </div>
          {wine.price && (
            <div style={{ marginTop: 8, fontSize: 13, color: "#a07060" }}>💰 R$ {parseFloat(wine.price).toFixed(2)}</div>
          )}
        </div>
      </div>

      <div onClick={() => setExpanded(!expanded)} style={{
        padding: "10px 20px", borderTop: "1px solid #2a1818", cursor: "pointer",
        color: "#7a5040", fontSize: 13, display: "flex", alignItems: "center", justifyContent: "space-between", userSelect: "none",
      }}>
        <span>Ver avaliações e avaliar</span>
        <span style={{ transition: "transform 0.2s", transform: expanded ? "rotate(180deg)" : "rotate(0)" }}>▾</span>
      </div>

      {expanded && (
        <div style={{ padding: "0 20px 20px", borderTop: "1px solid #2a1818" }}>
          {currentUser && (
            <div style={{ marginTop: 16, padding: 16, background: "#160c0c", borderRadius: 10, border: "1px solid #2d1a1a" }}>
              <div style={{ color: "#c9956b", fontSize: 13, marginBottom: 8, fontWeight: 600 }}>Sua avaliação</div>
              <RateForm wine={wine} currentUser={currentUser} onRate={onRate} existing={userRating} />
            </div>
          )}
          {wine.ratings?.length > 0 && (
            <div style={{ marginTop: 16 }}>
              <div style={{ color: "#6a4a3a", fontSize: 12, letterSpacing: 1, marginBottom: 10, textTransform: "uppercase" }}>Avaliações</div>
              {wine.ratings.map((r, i) => (
                <div key={i} style={{ marginBottom: 12, paddingBottom: 12, borderBottom: "1px solid #2a1818" }}>
                  <div style={{ display: "flex", justifyContent: "space-between", marginBottom: 4 }}>
                    <span style={{ color: "#c9956b", fontWeight: 600, fontSize: 14 }}>{r.userName}</span>
                    <Stars value={r.score} size={14} />
                  </div>
                  {r.notes && <div style={{ color: "#8a6a5a", fontSize: 13, fontStyle: "italic" }}>"{r.notes}"</div>}
                </div>
              ))}
            </div>
          )}
          {currentUser && wine.addedBy === currentUser.uid && (
            <button onClick={() => onDelete(wine.id)} style={{
              marginTop: 12, background: "transparent", border: "1px solid #5a2020",
              color: "#8a4040", padding: "6px 14px", borderRadius: 6, cursor: "pointer", fontSize: 12,
            }}>🗑 Remover vinho</button>
          )}
        </div>
      )}
    </div>
  );
}

function RateForm({ wine, currentUser, onRate, existing }) {
  const [score, setScore] = useState(existing?.score || 0);
  const [notes, setNotes] = useState(existing?.notes || "");
  return (
    <div>
      <Stars value={score} onChange={setScore} size={22} />
      <textarea
        placeholder="Comentários (opcional)..."
        value={notes}
        onChange={(e) => setNotes(e.target.value)}
        style={{
          marginTop: 10, width: "100%", background: "#1a0f0f",
          border: "1px solid #3d2020", borderRadius: 8, color: "#d0b8a0",
          padding: 10, fontSize: 13, resize: "vertical", minHeight: 60, boxSizing: "border-box",
        }}
      />
      <button
        onClick={() => score > 0 && onRate(wine.id, score, notes)}
        disabled={score === 0}
        style={{
          marginTop: 8,
          background: score > 0 ? "linear-gradient(135deg, #8b1a1a, #c9956b)" : "#2a1515",
          color: score > 0 ? "#fff" : "#4a3030", border: "none",
          padding: "8px 20px", borderRadius: 8, cursor: score > 0 ? "pointer" : "not-allowed",
          fontWeight: 600, fontSize: 13,
        }}
      >{existing ? "Atualizar avaliação" : "Salvar avaliação"}</button>
    </div>
  );
}

// ── Add Wine Form ─────────────────────────────────────────────────────────────
function AddWineForm({ onAdd, onClose }) {
  const [form, setForm] = useState({ name: "", type: "Tinto", country: "", region: "", vintage: "", price: "", photo: "" });
  const [photoPreview, setPhotoPreview] = useState(null);
  const [saving, setSaving] = useState(false);
  const set = (k, v) => setForm((f) => ({ ...f, [k]: v }));

  const handlePhoto = (e) => {
    const file = e.target.files[0];
    if (!file) return;
    const reader = new FileReader();
    reader.onload = (ev) => { set("photo", ev.target.result); setPhotoPreview(ev.target.result); };
    reader.readAsDataURL(file);
  };

  const submit = async () => {
    if (!form.name.trim()) return;
    setSaving(true);
    await onAdd({ ...form });
    setSaving(false);
  };

  const inputStyle = {
    width: "100%", background: "#160c0c", border: "1px solid #3d2020",
    borderRadius: 8, color: "#d0b8a0", padding: "10px 14px", fontSize: 14, boxSizing: "border-box",
  };
  const labelStyle = { color: "#8a6a5a", fontSize: 12, letterSpacing: 1, marginBottom: 6, display: "block", textTransform: "uppercase" };

  return (
    <div style={{
      position: "fixed", inset: 0, background: "rgba(0,0,0,0.85)",
      display: "flex", alignItems: "center", justifyContent: "center", zIndex: 1000, padding: 20,
    }}>
      <div style={{
        background: "linear-gradient(180deg, #1a0f0f 0%, #150a0a 100%)",
        border: "1px solid #3d2020", borderRadius: 20, padding: 32,
        width: "100%", maxWidth: 480, maxHeight: "90vh", overflowY: "auto",
      }}>
        <div style={{ fontFamily: "'Playfair Display', serif", fontSize: 26, color: "#c9956b", marginBottom: 24 }}>Cadastrar Vinho</div>
        <div style={{ display: "flex", flexDirection: "column", gap: 16 }}>
          <div>
            <label style={labelStyle}>Nome *</label>
            <input style={inputStyle} value={form.name} onChange={(e) => set("name", e.target.value)} placeholder="Ex: Château Margaux" />
          </div>
          <div>
            <label style={labelStyle}>Tipo</label>
            <select style={inputStyle} value={form.type} onChange={(e) => set("type", e.target.value)}>
              {["Tinto", "Branco", "Rosé", "Espumante", "Sobremesa"].map((t) => <option key={t}>{t}</option>)}
            </select>
          </div>
          <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 12 }}>
            <div><label style={labelStyle}>País</label><input style={inputStyle} value={form.country} onChange={(e) => set("country", e.target.value)} placeholder="Ex: Brasil" /></div>
            <div><label style={labelStyle}>Região</label><input style={inputStyle} value={form.region} onChange={(e) => set("region", e.target.value)} placeholder="Ex: Serra Gaúcha" /></div>
          </div>
          <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 12 }}>
            <div><label style={labelStyle}>Safra (ano)</label><input style={inputStyle} value={form.vintage} onChange={(e) => set("vintage", e.target.value)} placeholder="Ex: 2021" type="number" /></div>
            <div><label style={labelStyle}>Preço (R$)</label><input style={inputStyle} value={form.price} onChange={(e) => set("price", e.target.value)} placeholder="Ex: 89.90" type="number" step="0.01" /></div>
          </div>
          <div>
            <label style={labelStyle}>Foto do rótulo</label>
            <input type="file" accept="image/*" onChange={handlePhoto} style={{ color: "#8a6a5a", fontSize: 13 }} />
            {photoPreview && <img src={photoPreview} alt="" style={{ marginTop: 8, height: 100, borderRadius: 8, objectFit: "cover" }} />}
          </div>
        </div>
        <div style={{ display: "flex", gap: 12, marginTop: 24 }}>
          <button onClick={submit} disabled={saving} style={{
            flex: 1, background: "linear-gradient(135deg, #8b1a1a, #c9956b)",
            color: "#fff", border: "none", padding: "12px", borderRadius: 10,
            fontWeight: 700, fontSize: 15, cursor: "pointer",
          }}>{saving ? "Salvando..." : "Cadastrar"}</button>
          <button onClick={onClose} style={{
            background: "transparent", border: "1px solid #3d2020", color: "#8a6a5a",
            padding: "12px 20px", borderRadius: 10, cursor: "pointer", fontSize: 15,
          }}>Cancelar</button>
        </div>
      </div>
    </div>
  );
}

// ── Auth Screen ───────────────────────────────────────────────────────────────
function AuthScreen({ onLogin }) {
  const [mode, setMode] = useState("login");
  const [name, setName] = useState("");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);

  const inputStyle = {
    width: "100%", background: "#160c0c", border: "1px solid #3d2020",
    borderRadius: 10, color: "#d0b8a0", padding: "14px 18px",
    fontSize: 16, boxSizing: "border-box", outline: "none",
  };

  const submit = async () => {
    setError(""); setLoading(true);
    try {
      if (mode === "login") {
        await signInWithEmailAndPassword(auth, email, password);
      } else {
        if (!name.trim()) { setError("Digite seu nome."); setLoading(false); return; }
        const cred = await createUserWithEmailAndPassword(auth, email, password);
        await updateProfile(cred.user, { displayName: name.trim() });
      }
    } catch (e) {
      const msgs = {
        "auth/user-not-found": "Usuário não encontrado.",
        "auth/wrong-password": "Senha incorreta.",
        "auth/email-already-in-use": "E-mail já cadastrado.",
        "auth/weak-password": "Senha deve ter ao menos 6 caracteres.",
        "auth/invalid-email": "E-mail inválido.",
        "auth/invalid-credential": "E-mail ou senha incorretos.",
      };
      setError(msgs[e.code] || "Erro ao entrar. Tente novamente.");
    }
    setLoading(false);
  };

  return (
    <div style={{
      minHeight: "100vh",
      background: "radial-gradient(ellipse at 30% 20%, #2a0f0f 0%, #0d0505 60%, #080202 100%)",
      display: "flex", alignItems: "center", justifyContent: "center",
      padding: 20, fontFamily: "'Lato', sans-serif",
    }}>
      <div style={{ width: "100%", maxWidth: 380 }}>
        <div style={{ textAlign: "center", marginBottom: 48 }}>
          <div style={{ fontSize: 64, marginBottom: 8 }}>🍷</div>
          <div style={{ fontFamily: "'Playfair Display', serif", fontSize: 38, color: "#c9956b", lineHeight: 1, marginBottom: 8 }}>Diário de Vinhos</div>
          <div style={{ color: "#6a4a3a", letterSpacing: 3, fontSize: 12, textTransform: "uppercase" }}>Registre. Avalie. Compartilhe.</div>
        </div>
        <div style={{ background: "linear-gradient(135deg, #1a0f0f 0%, #150a0a 100%)", border: "1px solid #3d2020", borderRadius: 20, padding: 32 }}>
          <div style={{ display: "flex", marginBottom: 24, background: "#100808", borderRadius: 10, padding: 4 }}>
            {["login", "cadastro"].map((m) => (
              <button key={m} onClick={() => { setMode(m); setError(""); }} style={{
                flex: 1, padding: "10px",
                background: mode === m ? "linear-gradient(135deg, #8b1a1a, #c9956b)" : "transparent",
                border: "none", borderRadius: 8, color: mode === m ? "#fff" : "#6a4a3a",
                fontWeight: 600, cursor: "pointer", fontSize: 14, transition: "all 0.2s",
              }}>{m === "login" ? "Entrar" : "Criar conta"}</button>
            ))}
          </div>
          <div style={{ display: "flex", flexDirection: "column", gap: 14 }}>
            {mode === "cadastro" && (
              <input style={inputStyle} placeholder="Seu nome" value={name} onChange={(e) => setName(e.target.value)} />
            )}
            <input style={inputStyle} placeholder="E-mail" type="email" value={email} onChange={(e) => setEmail(e.target.value)} onKeyDown={(e) => e.key === "Enter" && submit()} />
            <input style={inputStyle} placeholder="Senha" type="password" value={password} onChange={(e) => setPassword(e.target.value)} onKeyDown={(e) => e.key === "Enter" && submit()} />
          </div>
          {error && <div style={{ color: "#c06060", fontSize: 13, marginTop: 10 }}>{error}</div>}
          <button onClick={submit} disabled={loading} style={{
            width: "100%", marginTop: 20,
            background: "linear-gradient(135deg, #8b1a1a, #c9956b)",
            color: "#fff", border: "none", padding: "14px", borderRadius: 10,
            fontWeight: 700, fontSize: 16, cursor: "pointer", letterSpacing: 0.5,
          }}>{loading ? "Aguarde..." : mode === "login" ? "Entrar" : "Criar conta"}</button>
        </div>
      </div>
    </div>
  );
}

// ── Main App ──────────────────────────────────────────────────────────────────
export default function App() {
  const [currentUser, setCurrentUser] = useState(undefined);
  const [wines, setWines] = useState([]);
  const [showAdd, setShowAdd] = useState(false);
  const [search, setSearch] = useState("");
  const [filterType, setFilterType] = useState("Todos");
  const [sortBy, setSortBy] = useState("recent");

  // Auth listener
  useEffect(() => {
    const unsub = onAuthStateChanged(auth, (user) => setCurrentUser(user || null));
    return unsub;
  }, []);

  // Wines listener
  useEffect(() => {
    const q = query(collection(db, "wines"), orderBy("createdAt", "desc"));
    const unsub = onSnapshot(q, (snap) => {
      setWines(snap.docs.map((d) => ({ id: d.id, ...d.data() })));
    });
    return unsub;
  }, []);

  const handleAddWine = async (wine) => {
    await addDoc(collection(db, "wines"), {
      ...wine,
      addedBy: currentUser.uid,
      addedByName: currentUser.displayName,
      createdAt: Date.now(),
      ratings: [],
    });
    setShowAdd(false);
  };

  const handleRate = async (wineId, score, notes) => {
    const wine = wines.find((w) => w.id === wineId);
    const ratings = (wine.ratings || []).filter((r) => r.userId !== currentUser.uid);
    ratings.push({ userId: currentUser.uid, userName: currentUser.displayName, score, notes });
    await updateDoc(doc(db, "wines", wineId), { ratings });
  };

  const handleDelete = async (wineId) => {
    if (!window.confirm("Remover este vinho?")) return;
    await deleteDoc(doc(db, "wines", wineId));
  };

  if (currentUser === undefined) {
    return (
      <div style={{ minHeight: "100vh", background: "#0d0505", display: "flex", alignItems: "center", justifyContent: "center" }}>
        <div style={{ fontFamily: "'Playfair Display', serif", color: "#c9956b", fontSize: 24 }}>Carregando...</div>
      </div>
    );
  }

  if (!currentUser) return <AuthScreen />;

  // filter + sort
  let filtered = wines;
  if (filterType !== "Todos") filtered = filtered.filter((w) => w.type === filterType);
  if (search) filtered = filtered.filter((w) =>
    [w.name, w.country, w.region].some((f) => f?.toLowerCase().includes(search.toLowerCase()))
  );
  if (sortBy === "rating") filtered = [...filtered].sort((a, b) => {
    const avg = (w) => w.ratings?.length ? w.ratings.reduce((s, r) => s + r.score, 0) / w.ratings.length : 0;
    return avg(b) - avg(a);
  });
  if (sortBy === "name") filtered = [...filtered].sort((a, b) => a.name.localeCompare(b.name));

  return (
    <div style={{ minHeight: "100vh", background: "radial-gradient(ellipse at 20% 0%, #1a0808 0%, #0d0505 50%)", fontFamily: "'Lato', sans-serif", color: "#d0b8a0" }}>
      {/* Header */}
      <header style={{
        background: "linear-gradient(180deg, #160a0a 0%, transparent 100%)",
        borderBottom: "1px solid #2a1515", padding: "16px 24px",
        display: "flex", alignItems: "center", justifyContent: "space-between",
        position: "sticky", top: 0, backdropFilter: "blur(10px)", zIndex: 100,
      }}>
        <div style={{ display: "flex", alignItems: "center", gap: 12 }}>
          <span style={{ fontSize: 28 }}>🍷</span>
          <div>
            <div style={{ fontFamily: "'Playfair Display', serif", fontSize: 22, color: "#c9956b", lineHeight: 1 }}>Diário de Vinhos</div>
            <div style={{ fontSize: 11, color: "#5a3a2a", letterSpacing: 2, textTransform: "uppercase" }}>Registre. Avalie. Compartilhe.</div>
          </div>
        </div>
        <div style={{ display: "flex", alignItems: "center", gap: 12 }}>
          <span style={{ color: "#6a4a3a", fontSize: 13 }}>{currentUser.displayName}</span>
          <button onClick={() => signOut(auth)} style={{
            background: "transparent", border: "1px solid #3d2020", color: "#6a4a3a",
            padding: "6px 12px", borderRadius: 8, cursor: "pointer", fontSize: 12,
          }}>Sair</button>
        </div>
      </header>

      {/* Controls */}
      <div style={{ padding: "20px 24px 0", display: "flex", flexDirection: "column", gap: 12 }}>
        <div style={{ display: "flex", gap: 12 }}>
          <input
            placeholder="🔍 Buscar vinho, país, região..."
            value={search} onChange={(e) => setSearch(e.target.value)}
            style={{
              flex: 1, background: "#160c0c", border: "1px solid #3d2020",
              borderRadius: 10, color: "#d0b8a0", padding: "12px 16px", fontSize: 14, outline: "none",
            }}
          />
          <button onClick={() => setShowAdd(true)} style={{
            background: "linear-gradient(135deg, #8b1a1a, #c9956b)", color: "#fff",
            border: "none", padding: "12px 20px", borderRadius: 10,
            fontWeight: 700, cursor: "pointer", fontSize: 14, whiteSpace: "nowrap",
          }}>+ Vinho</button>
        </div>
        <div style={{ display: "flex", gap: 8, flexWrap: "wrap" }}>
          {["Todos", "Tinto", "Branco", "Rosé", "Espumante", "Sobremesa"].map((t) => (
            <button key={t} onClick={() => setFilterType(t)} style={{
              padding: "6px 14px", borderRadius: 20, border: "1px solid",
              borderColor: filterType === t ? "#c9956b" : "#3d2020",
              background: filterType === t ? "rgba(201,149,107,0.15)" : "transparent",
              color: filterType === t ? "#c9956b" : "#6a4a3a",
              fontSize: 13, cursor: "pointer", transition: "all 0.15s",
            }}>{t}</button>
          ))}
          <div style={{ flex: 1 }} />
          <select value={sortBy} onChange={(e) => setSortBy(e.target.value)} style={{
            background: "#160c0c", border: "1px solid #3d2020", color: "#8a6a5a",
            padding: "6px 12px", borderRadius: 10, fontSize: 13, cursor: "pointer",
          }}>
            <option value="recent">Mais recentes</option>
            <option value="rating">Melhor nota</option>
            <option value="name">Nome A-Z</option>
          </select>
        </div>
        <div style={{ color: "#4a2a2a", fontSize: 13 }}>{filtered.length} {filtered.length === 1 ? "vinho" : "vinhos"} na adega</div>
      </div>

      {/* Grid */}
      <div style={{ padding: 24, display: "grid", gridTemplateColumns: "repeat(auto-fill, minmax(340px, 1fr))", gap: 20 }}>
        {filtered.length === 0 ? (
          <div style={{ gridColumn: "1/-1", textAlign: "center", padding: 80, color: "#4a2a2a" }}>
            <div style={{ fontSize: 64, marginBottom: 16 }}>🍾</div>
            <div style={{ fontFamily: "'Playfair Display', serif", fontSize: 24, color: "#6a4a3a", marginBottom: 8 }}>A adega está vazia</div>
            <div style={{ fontSize: 14 }}>Cadastre o primeiro vinho para começar</div>
          </div>
        ) : (
          filtered.map((w) => (
            <WineCard key={w.id} wine={w} currentUser={currentUser} onRate={handleRate} onDelete={handleDelete} />
          ))
        )}
      </div>

      {showAdd && <AddWineForm onAdd={handleAddWine} onClose={() => setShowAdd(false)} />}
    </div>
  );
}
