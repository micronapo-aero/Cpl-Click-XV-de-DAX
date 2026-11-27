// DAXaminator : comptes (pseudo + mot de passe) et synchro de la progression.
// Cloudflare Pages Functions + D1 (liaison "DB"). Admin : variable ADMIN_PSEUDO.
const ITER = 60000, DAY = 864e5;
const enc = new TextEncoder();
// CORS : le site est aussi publié ailleurs (GitHub Pages) ; il appelle alors cette API à distance.
const CORS = { "access-control-allow-origin": "*", "access-control-allow-methods": "GET, POST, PUT, OPTIONS", "access-control-allow-headers": "content-type, authorization", "access-control-max-age": "86400" };
const J = (o, s = 200) => new Response(JSON.stringify(o), { status: s, headers: { "content-type": "application/json; charset=utf-8", "cache-control": "no-store", ...CORS } });
const E = (msg, s = 400) => J({ error: msg }, s);
const hex = b => [...new Uint8Array(b)].map(x => x.toString(16).padStart(2, "0")).join("");
const rnd = n => hex(crypto.getRandomValues(new Uint8Array(n)));
const sha = async s => hex(await crypto.subtle.digest("SHA-256", enc.encode(s)));
async function phash(pw, salt) {
  const k = await crypto.subtle.importKey("raw", enc.encode(pw), "PBKDF2", false, ["deriveBits"]);
  return hex(await crypto.subtle.deriveBits({ name: "PBKDF2", hash: "SHA-256", salt: enc.encode(salt), iterations: ITER }, k, 256));
}
const same = (a, b) => { if (a.length !== b.length) return false; let r = 0; for (let i = 0; i < a.length; i++) r |= a.charCodeAt(i) ^ b.charCodeAt(i); return r === 0; };
const keyOf = p => p.normalize("NFC").toLowerCase();
const okPseudo = p => typeof p === "string" && /^[\p{L}\p{N} _.\-]{2,20}$/u.test(p) && p.trim() === p;
const okPw = p => typeof p === "string" && p.length >= 6 && p.length <= 100;
const WORDS = ["rotor", "cabine", "pale", "derive", "cap", "palier", "nuage", "piste", "balise", "radar", "altitude", "vario", "heliport", "turbine", "pilote", "metar"];
const tempPw = () => WORDS[crypto.getRandomValues(new Uint8Array(1))[0] % WORDS.length] + "-" + (10 + crypto.getRandomValues(new Uint8Array(1))[0] % 90);

let ready = false;
async function init(db) {
  if (ready) return;
  await db.batch([
    db.prepare("CREATE TABLE IF NOT EXISTS users(k TEXT PRIMARY KEY, pseudo TEXT NOT NULL, salt TEXT, hash TEXT, created INTEGER, seen INTEGER, must INTEGER DEFAULT 0, fails INTEGER DEFAULT 0, lock INTEGER DEFAULT 0)"),
    db.prepare("CREATE TABLE IF NOT EXISTS sessions(th TEXT PRIMARY KEY, k TEXT NOT NULL, created INTEGER, used INTEGER)"),
    db.prepare("CREATE TABLE IF NOT EXISTS data(k TEXT PRIMARY KEY, quiz TEXT, calc TEXT, calcTs INTEGER DEFAULT 0, updated INTEGER)"),
  ]);
  try { await db.prepare("ALTER TABLE data ADD COLUMN act TEXT").run(); } catch { /* colonne déjà là */ }
  ready = true;
}
const isAdmin = (env, u) => !!env.ADMIN_PSEUDO && keyOf(String(env.ADMIN_PSEUDO).trim()) === u.k;
const meOf = (env, u) => ({ pseudo: u.pseudo, admin: isAdmin(env, u), must: !!u.must, created: u.created });

async function newSession(db, k) {
  const tok = rnd(32), now = Date.now();
  await db.prepare("INSERT INTO sessions(th,k,created,used) VALUES(?,?,?,?)").bind(await sha(tok), k, now, now).run();
  return tok;
}
async function auth(req, db) {
  const m = /^Bearer ([0-9a-f]{64})$/.exec(req.headers.get("authorization") || "");
  if (!m) return null;
  const th = await sha(m[1]);
  const u = await db.prepare("SELECT u.*, s.th AS th FROM sessions s JOIN users u ON u.k=s.k WHERE s.th=?").bind(th).first();
  if (!u) return null;
  const now = Date.now();
  if (!u.seen || now - u.seen > 6e4) await db.batch([db.prepare("UPDATE users SET seen=? WHERE k=?").bind(now, u.k), db.prepare("UPDATE sessions SET used=? WHERE th=?").bind(now, th)]);
  return u;
}
// Fusion des progressions du quiz : pour chaque question, l'entrée la plus avancée gagne.
function mergeQuiz(a, b) {
  const r = { ...(a || {}) };
  for (const [id, y] of Object.entries(b || {})) {
    const x = r[id];
    if (!x || (y.n || 0) > (x.n || 0) || ((y.n || 0) === (x.n || 0) && (y.due || 0) > (x.due || 0))) r[id] = y;
    else if (y.fl !== undefined && x.fl === undefined) r[id] = { ...x, fl: y.fl };
  }
  return r;
}
// Activité par appareil : {appareil:{jour:{uv:[questions, bonnes, ms]}}}. Chaque appareil ne fait qu'augmenter ses compteurs : le maximum gagne.
function mergeAct(a, b) {
  const r = a && typeof a === "object" ? a : {};
  if (!b || typeof b !== "object") return r;
  for (const [dv, days] of Object.entries(b)) {
    if (!days || typeof days !== "object" || dv.length > 24) continue;
    const R = r[dv] = r[dv] || {};
    for (const [d, uvs] of Object.entries(days)) {
      if (!/^\d{4}-\d\d-\d\d$/.test(d) || !uvs || typeof uvs !== "object") continue;
      const D = R[d] = R[d] || {};
      for (const [u, v] of Object.entries(uvs)) {
        if (!Array.isArray(v) || !/^\d{3}$/.test(u)) continue;
        const x = D[u] || [0, 0, 0];
        D[u] = [0, 1, 2].map(i => Math.max(+x[i] || 0, Math.min(Math.max(0, +v[i] || 0), i < 2 ? 1e5 : 864e5)));
      }
    }
  }
  return r;
}
const parse = (s, d) => { try { return s ? JSON.parse(s) : d; } catch { return d; } };

export async function onRequest({ request: req, env, params }) {
  if (req.method === "OPTIONS") return new Response(null, { status: 204, headers: CORS });
  const db = env.DB;
  if (!db) return E("Les comptes ne sont pas encore activés.", 503);
  await init(db);
  const path = (params.path || []).join("/"), M = req.method;
  let body = {};
  if (M === "POST" || M === "PUT") {
    const t = await req.text();
    if (t.length > 1.5e6) return E("Données trop volumineuses.", 413);
    body = parse(t, {});
  }
  const now = Date.now();

  if (path === "check" && M === "GET") {
    const p = new URL(req.url).searchParams.get("pseudo") || "";
    if (!okPseudo(p)) return J({ free: false, invalid: true });
    const u = await db.prepare("SELECT k FROM users WHERE k=?").bind(keyOf(p)).first();
    return J({ free: !u });
  }
  if (path === "register" && M === "POST") {
    const { pseudo, password } = body;
    if (!okPseudo(pseudo)) return E("Pseudo : 2 à 20 caractères (lettres, chiffres, espace, - _ .).");
    if (!okPw(password)) return E("Mot de passe : 6 caractères minimum.");
    const k = keyOf(pseudo);
    if (await db.prepare("SELECT k FROM users WHERE k=?").bind(k).first()) return E("Ce pseudo est déjà pris.", 409);
    const salt = rnd(16);
    await db.prepare("INSERT INTO users(k,pseudo,salt,hash,created,seen) VALUES(?,?,?,?,?,?)").bind(k, pseudo, salt, await phash(password, salt), now, now).run();
    const u = { k, pseudo, created: now, must: 0 };
    return J({ token: await newSession(db, k), me: meOf(env, u) });
  }
  if (path === "login" && M === "POST") {
    const { pseudo, password } = body;
    if (typeof pseudo !== "string" || typeof password !== "string") return E("Pseudo ou mot de passe manquant.");
    const u = await db.prepare("SELECT * FROM users WHERE k=?").bind(keyOf(pseudo.trim())).first();
    if (!u) return E("Pseudo ou mot de passe incorrect.", 401);
    if (u.lock > now) return E("Trop d'essais. Réessaie dans quelques minutes.", 429);
    if (!same(await phash(password, u.salt), u.hash)) {
      const f = (u.fails || 0) + 1;
      await db.prepare("UPDATE users SET fails=?, lock=? WHERE k=?").bind(f >= 8 ? 0 : f, f >= 8 ? now + 5 * 6e4 : 0, u.k).run();
      return E("Pseudo ou mot de passe incorrect.", 401);
    }
    await db.prepare("UPDATE users SET fails=0, lock=0, seen=? WHERE k=?").bind(now, u.k).run();
    return J({ token: await newSession(db, u.k), me: meOf(env, u) });
  }

  const u = await auth(req, db);
  if (!u) return E("Session expirée. Reconnecte-toi.", 401);

  if (path === "me" && M === "GET") return J({ me: meOf(env, u) });
  if (path === "logout" && M === "POST") {
    await db.prepare("DELETE FROM sessions WHERE th=?").bind(u.th).run();
    return J({ ok: true });
  }
  if (path === "password" && M === "POST") {
    const { old, password } = body;
    if (!okPw(password)) return E("Nouveau mot de passe : 6 caractères minimum.");
    if (!u.must && !(typeof old === "string" && same(await phash(old, u.salt), u.hash))) return E("Mot de passe actuel incorrect.", 403);
    const salt = rnd(16);
    await db.batch([
      db.prepare("UPDATE users SET salt=?, hash=?, must=0 WHERE k=?").bind(salt, await phash(password, salt), u.k),
      db.prepare("DELETE FROM sessions WHERE k=? AND th<>?").bind(u.k, u.th),
    ]);
    return J({ ok: true, me: meOf(env, { ...u, must: 0 }) });
  }
  if (path === "data" && (M === "PUT" || M === "GET")) {
    const row = await db.prepare("SELECT * FROM data WHERE k=?").bind(u.k).first();
    let quiz = parse(row && row.quiz, {}), act = parse(row && row.act, {}), calc = row ? row.calc : null, calcTs = row ? row.calcTs || 0 : 0;
    if (M === "PUT") {
      if (body.quiz && typeof body.quiz === "object") quiz = mergeQuiz(quiz, body.quiz);
      if (body.act && typeof body.act === "object") act = mergeAct(act, body.act);
      if (typeof body.calc === "string" && (+body.calcTs || 0) > calcTs) { calc = body.calc; calcTs = +body.calcTs; }
      await db.prepare("INSERT INTO data(k,quiz,act,calc,calcTs,updated) VALUES(?,?,?,?,?,?) ON CONFLICT(k) DO UPDATE SET quiz=excluded.quiz, act=excluded.act, calc=excluded.calc, calcTs=excluded.calcTs, updated=excluded.updated")
        .bind(u.k, JSON.stringify(quiz), JSON.stringify(act), calc, calcTs, now).run();
    }
    return J({ quiz, act, calc, calcTs, me: meOf(env, u) });
  }

  if (path.startsWith("admin/")) {
    if (!isAdmin(env, u)) return E("Réservé à l'admin.", 403);
    if (path === "admin/users" && M === "GET") {
      const { results } = await db.prepare("SELECT u.pseudo, u.created, u.seen, u.must, d.quiz FROM users u LEFT JOIN data d ON d.k=u.k ORDER BY u.seen DESC").all();
      return J({ users: results.map(r => { const q = parse(r.quiz, {}); let n = 0; for (const v of Object.values(q)) n += v.n || 0; return { pseudo: r.pseudo, created: r.created, seen: r.seen, must: !!r.must, done: n, seenQ: Object.keys(q).length }; }) });
    }
    // Tableau de bord : totaux par compte, par UV, par chapitre, par jour, et questions les plus ratées.
    if (path === "admin/stats" && M === "GET") {
      const { results } = await db.prepare("SELECT u.pseudo, u.created, u.seen, d.quiz, d.act FROM users u LEFT JOIN data d ON d.k=u.k").all();
      const qs = {}, ch = {};
      const users = results.map(r => {
        const q = parse(r.quiz, {}), A = parse(r.act, {}), uv = {}, days = {};
        let n = 0, ok = 0;
        for (const [id, v] of Object.entries(q)) {
          const a = +v.n || 0, b = +v.ok || 0;
          if (!a) continue;
          n += a; ok += b;
          const p = id.split("-"), U = uv[p[0]] = uv[p[0]] || [0, 0, 0];
          U[0] += a; U[1] += b;
          ch[p[0] + "-" + p[1]] = (ch[p[0] + "-" + p[1]] || 0) + a;
          const Q = qs[id] = qs[id] || [0, 0];
          Q[0] += a; Q[1] += b;
        }
        for (const dv of Object.values(A)) for (const [d, us] of Object.entries(dv || {})) {
          const D = days[d] = days[d] || [0, 0, 0];
          for (const [k, v] of Object.entries(us || {})) { D[0] += v[0]; D[1] += v[1]; D[2] += v[2]; (uv[k] = uv[k] || [0, 0, 0])[2] += v[2]; }
        }
        return { pseudo: r.pseudo, created: r.created, seen: r.seen, n, ok, uv, days };
      });
      const miss = Object.entries(qs).filter(([, v]) => v[0] >= 5).map(([id, v]) => [id, v[0], v[1]])
        .sort((a, b) => a[2] / a[1] - b[2] / b[1] || b[1] - a[1]).slice(0, 10);
      return J({ users, ch, miss, now });
    }
    if (path === "admin/reset" && M === "POST") {
      const t = await db.prepare("SELECT k, pseudo FROM users WHERE k=?").bind(keyOf(String(body.pseudo || ""))).first();
      if (!t) return E("Compte introuvable.", 404);
      const pw = tempPw(), salt = rnd(16);
      await db.batch([
        db.prepare("UPDATE users SET salt=?, hash=?, must=1, fails=0, lock=0 WHERE k=?").bind(salt, await phash(pw, salt), t.k),
        db.prepare("DELETE FROM sessions WHERE k=?").bind(t.k),
      ]);
      return J({ pseudo: t.pseudo, temp: pw });
    }
    if (path === "admin/delete" && M === "POST") {
      const k = keyOf(String(body.pseudo || ""));
      if (k === u.k) return E("Tu ne peux pas supprimer ton propre compte.");
      await db.batch([db.prepare("DELETE FROM sessions WHERE k=?").bind(k), db.prepare("DELETE FROM data WHERE k=?").bind(k), db.prepare("DELETE FROM users WHERE k=?").bind(k)]);
      return J({ ok: true });
    }
  }
  return E("Introuvable.", 404);
}
