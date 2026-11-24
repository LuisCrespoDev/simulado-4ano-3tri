// Firestore falso para testes: guarda os documentos no localStorage (chave __mockdb),
// então o "banco" sobrevive entre a versão antiga e a nova do app no mesmo navegador.
// Toda escrita fica registrada em window.__writes para os testes conferirem.
(function () {
  const KEY = '__mockdb';
  const load = () => { try { return JSON.parse(localStorage.getItem(KEY) || '{}'); } catch (e) { return {}; } };
  const save = (db) => localStorage.setItem(KEY, JSON.stringify(db));
  window.__writes = [];
  const TS = { __ts: true };

  function snapOf(rows) {
    return { forEach: (fn) => rows.forEach(fn), size: rows.length, empty: rows.length === 0, docs: rows };
  }
  function docSnap(col, id) {
    const db = load(); const d = (db[col] || {})[id];
    return { id, exists: !!d, data: () => (d ? JSON.parse(JSON.stringify(d)) : undefined) };
  }
  function query(col, filters, order, lim) {
    return {
      where(f, op, v) { return query(col, filters.concat([[f, op, v]]), order, lim); },
      orderBy(f, dir) { return query(col, filters, [f, dir || 'asc'], lim); },
      limit(n) { return query(col, filters, order, n); },
      get() {
        const db = load(); let ids = Object.keys(db[col] || {});
        let rows = ids.map((id) => docSnap(col, id));
        filters.forEach(([f, op, v]) => { rows = rows.filter((r) => op === '==' ? r.data()[f] === v : true); });
        if (order) rows.sort((a, b) => ((b.data()[order[0]] || 0) - (a.data()[order[0]] || 0)) * (order[1] === 'desc' ? 1 : -1));
        if (lim) rows = rows.slice(0, lim);
        return Promise.resolve(snapOf(rows));
      },
      onSnapshot(cb, err) { this.get().then(cb, err); return () => {}; },
    };
  }
  function docRef(col, id) {
    return {
      id,
      get() { return Promise.resolve(docSnap(col, id)); },
      set(data, opts) {
        const db = load(); db[col] = db[col] || {};
        const clean = JSON.parse(JSON.stringify(data, (k, v) => (v === TS ? new Date().toISOString() : v)));
        db[col][id] = (opts && opts.merge) ? Object.assign({}, db[col][id] || {}, clean) : clean;
        save(db); window.__writes.push({ col, id, data: clean, merge: !!(opts && opts.merge) });
        return Promise.resolve();
      },
      update(data) { return this.set(data, { merge: true }); },
    };
  }
  function collection(col) {
    const q = query(col, [], null, null);
    q.doc = (id) => docRef(col, id);
    return q;
  }
  const firestore = () => ({ collection });
  firestore.FieldValue = { serverTimestamp: () => TS };
  window.firebase = { apps: [], initializeApp() { this.apps.push({}); }, firestore };
})();
