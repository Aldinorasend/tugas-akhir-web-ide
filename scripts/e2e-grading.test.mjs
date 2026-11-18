/* E2E test: buat soal -> kerjakan (benar/salah semua varian) -> dashboard. Data TEST_E2E, dihapus di akhir. */
const BASE = 'http://localhost:4000';
const results = [];
const log = (name, pass, detail = '') => { results.push({ name, pass, detail }); console.log(`${pass ? 'PASS' : 'FAIL'} | ${name}${detail ? ' | ' + detail : ''}`); };

const api = async (path, { method = 'GET', body, token } = {}) => {
  const res = await fetch(BASE + path, {
    method,
    headers: { 'Content-Type': 'application/json', ...(token ? { Authorization: `Bearer ${token}` } : {}) },
    body: body ? JSON.stringify(body) : undefined,
  });
  const ct = res.headers.get('content-type') || '';
  const data = ct.includes('json') ? await res.json() : await res.text();
  return { status: res.status, data };
};

const kunciNodes = [{
  id: 'n-kunci', type: 'umlClass', position: { x: 0, y: 0 },
  data: { name: 'Mobil', isInterface: false, isAbstract: false,
    attributes: [{ name: 'mesin', type: 'String', access: '-' }],
    methods: [{ name: 'jalan', returnType: 'void', access: '+' }] }
}];
const metrikKode = { temporal: { time_spent_ms: 60000, idle_time_ms: 5000, max_single_idle_ms: 5000 }, spatial_textual: { keystroke_count: 100, lines_of_code: 5 }, evaluation: { submit_count: 1, mismatch_attempts: 0 } };
const metrikDiag = { temporal: { time_spent_ms: 60000, idle_time_ms: 5000, max_single_idle_ms: 5000 }, spatial_churn: { total_actions: 10, node_add_count: 5, node_delete_count: 0, edge_add_count: 0, edge_delete_count: 0, component_modification_count: 0 }, evaluation: { submit_count: 1, mismatch_attempts: 0 } };

(async () => {
  // ===== 0. Health =====
  const health = await api('/health'); const ready = await api('/ready');
  log('health 200', health.status === 200);
  log('ready 200 & status ready', ready.status === 200 && ready.data.status === 'ready', JSON.stringify(ready.data.checks));

  // ===== 1. Register + login (student & lecturer) =====
  const uname = 'TEST_E2E_STUDENT', lname = 'TEST_E2E_LECTURER', pass = 'test12345';
  await api('/api/auth/register', { method: 'POST', body: { nim_nip: uname, password: pass, full_name: 'Student E2E', role: 'student' } });
  await api('/api/auth/register', { method: 'POST', body: { nim_nip: lname, password: pass, full_name: 'Lecturer E2E', role: 'lecturer' } });
  const sLogin = await api('/api/auth/login', { method: 'POST', body: { nim_nip: uname, password: pass } });
  const lLogin = await api('/api/auth/login', { method: 'POST', body: { nim_nip: lname, password: pass } });
  log('login student dapat token', sLogin.status === 200 && !!sLogin.data?.token, sLogin.data?.error || sLogin.data?.message || '');
  log('login lecturer dapat token', lLogin.status === 200 && !!lLogin.data?.token, lLogin.data?.error || '');
  log('role tersimpan benar', sLogin.data?.user?.role === 'student' && lLogin.data?.user?.role === 'lecturer');
  const sTok = sLogin.data?.token, lTok = lLogin.data?.token, sId = sLogin.data?.user?.id;
  const badLogin = await api('/api/auth/login', { method: 'POST', body: { nim_nip: uname, password: 'salah' } });
  log('login password salah ditolak 4xx + JSON', badLogin.status >= 400 && badLogin.status < 500 && typeof badLogin.data === 'object');

  // ===== 2. Dosen buat study case =====
  const create = await api('/api/study-cases', { method: 'POST', token: lTok, body: { title: 'TEST_E2E_Mobil', description: 'E2E', initial_code: [], nodes: kunciNodes, edges: [] } });
  log('createStudyCase 200 + logic_rules dihasilkan', create.status === 200 && (create.data?.data?.logicRules || []).length >= 3, JSON.stringify(create.data?.data?.logicRules || create.data?.error || create.data));
  const caseId = create.data?.data?.studyCase?.id;
  const logicRules = create.data?.data?.logicRules;

  const fetched = await api(`/api/study-cases/${caseId}`, { token: sTok });
  const ak = fetched.data?.data?.diagram_rules || fetched.data?.data?.answer_key;
  log('getStudyCaseById punya diagram_rules + logic_rules', fetched.status === 200 && !!ak?.logic_rules?.length && Array.isArray(ak?.nodes));

  // ===== 3. Grading DIAGRAM =====
  const ok = kunciNodes.map(n => ({ ...n, id: 'n-student-1' }));
  const dOk = await api('/api/grader/grade-diagram', { method: 'POST', token: sTok, body: { exerciseId: caseId, nodes: ok, edges: [], diagramMetrics: metrikDiag, experiment_group: 'EXPERIMENTAL' } });
  log('DIAGRAM benar -> score 100 / isPassed', dOk.status === 200 && dOk.data?.score === 100 && dOk.data?.isPassed === true, JSON.stringify({ score: dOk.data?.score, fb: dOk.data?.feedbacks, err: dOk.data?.error || dOk.data?.message }));

  const dNoClass = await api('/api/grader/grade-diagram', { method: 'POST', token: sTok, body: { exerciseId: caseId, nodes: [], edges: [], diagramMetrics: metrikDiag, experiment_group: 'CONTROL' } });
  log('DIAGRAM kelas hilang -> tidak passed + hint kelas', dNoClass.status === 200 && dNoClass.data?.isPassed === false && (dNoClass.data?.hints || []).some(f => f.includes("Mobil' belum ditemukan")), JSON.stringify(dNoClass.data?.hints));

  const dWrongType = await api('/api/grader/grade-diagram', { method: 'POST', token: sTok, body: { exerciseId: caseId, nodes: [{ ...kunciNodes[0], id: 'n2', data: { ...kunciNodes[0].data, isInterface: true } }], edges: [], diagramMetrics: metrikDiag } });
  log('DIAGRAM salah tipe (interface vs class) -> gagal + hint tipe', dWrongType.data?.isPassed === false && (dWrongType.data?.hints || []).some(f => f.includes('Class vs Interface')), JSON.stringify(dWrongType.data?.score));

  const dWrongAttr = await api('/api/grader/grade-diagram', { method: 'POST', token: sTok, body: { exerciseId: caseId, nodes: [{ ...kunciNodes[0], id: 'n3', data: { ...kunciNodes[0].data, attributes: [{ name: 'mesin', type: 'int', access: '-' }] } }], edges: [], diagramMetrics: metrikDiag } });
  log('DIAGRAM atribut salah tipe -> gagal + hint atribut', dWrongAttr.data?.isPassed === false && (dWrongAttr.data?.hints || []).some(f => f.includes('atribut')), JSON.stringify(dWrongAttr.data?.score));

  const dNoMethod = await api('/api/grader/grade-diagram', { method: 'POST', token: sTok, body: { exerciseId: caseId, nodes: [{ ...kunciNodes[0], id: 'n4', data: { ...kunciNodes[0].data, methods: [] } }], edges: [], diagramMetrics: metrikDiag } });
  log('DIAGRAM method hilang -> gagal + hint method', dNoMethod.data?.isPassed === false && (dNoMethod.data?.hints || []).some(f => f.includes('method')), JSON.stringify(dNoMethod.data?.score));

  const noAuth = await api('/api/grader/grade-diagram', { method: 'POST', body: { exerciseId: caseId, nodes: ok, edges: [], diagramMetrics: metrikDiag } });
  log('DIAGRAM tanpa token -> 401', noAuth.status === 401);

  // BUG-PROBE: student menulis return type BERBEDA (int vs void) di diagram.
  // ruleEngine membandingkan field .type padahal datamodel pakai .returnType
  // -> jika mismatch ini lolos (score 100), itu bug ruleEngine.
  const dWrongReturn = await api('/api/grader/grade-diagram', { method: 'POST', token: sTok, body: { exerciseId: caseId, nodes: [{ ...kunciNodes[0], id: 'n5', data: { ...kunciNodes[0].data, methods: [{ name: 'jalan', returnType: 'int', access: '+' }] } }], edges: [], diagramMetrics: metrikDiag } });
  log('DIAGRAM return type salah (int vs void) -> HARUS gagal (cek bug ruleEngine .type vs .returnType)', dWrongReturn.data?.score !== 100, JSON.stringify({ score: dWrongReturn.data?.score, hints: dWrongReturn.data?.hints }));

  // ===== 4. Grading KODE =====
  const codeOk = 'public class Mobil {\n  private String mesin;\n  public void jalan() {}\n}';
  const cOk = await api('/api/grader/compare-code', { method: 'POST', token: sTok, body: { exerciseId: caseId, current_code: [{ path: 'Mobil.java', content: codeOk }], codeMetrics: metrikKode, logic_rules: logicRules, experiment_group: 'EXPERIMENTAL' } });
  const logicHints = (cOk.data?.hints || []).filter(h => !h.includes('[Enkapsulasi]'));
  log('KODE benar -> semua LOGIC RULE match (enkapsulasi dinilai terpisah)', cOk.status === 200 && logicHints.every(h => h.startsWith('✅')), JSON.stringify(cOk.data?.hints || cOk.data?.error || cOk.data?.message));

  // Case tambahan: logika benar + enkapsulasi lengkap (getter & setter public)
  const codeOopOk = 'public class Mobil {\n  private String mesin;\n  public void jalan() {}\n  public String getMesin() { return mesin; }\n  public void setMesin(String m) { this.mesin = m; }\n}';
  const cOop = await api('/api/grader/compare-code', { method: 'POST', token: sTok, body: { exerciseId: caseId, current_code: [{ path: 'Mobil.java', content: codeOopOk }], codeMetrics: metrikKode, logic_rules: logicRules, experiment_group: 'EXPERIMENTAL' } });
  log('KODE benar + getter/setter -> semua hint ✅ (lengkap)', cOop.status === 200 && (cOop.data?.hints || []).every(h => h.startsWith('✅')), JSON.stringify(cOop.data?.hints));

  const cSyntax = await api('/api/grader/compare-code', { method: 'POST', token: sTok, body: { exerciseId: caseId, current_code: [{ path: 'Mobil.java', content: 'public class Mobil { private String mesin = ;' }], codeMetrics: metrikKode, logic_rules: logicRules } });
  log('KODE syntax error -> semua rule gagal, tidak crash', cSyntax.status === 200 && cSyntax.data?.isPassed === false && (cSyntax.data?.hints || []).every(h => h.startsWith('❌')), JSON.stringify(cSyntax.data?.hints));

  const cNoAttr = await api('/api/grader/compare-code', { method: 'POST', token: sTok, body: { exerciseId: caseId, current_code: [{ path: 'Mobil.java', content: 'public class Mobil {\n  public void jalan() {}\n}' }], codeMetrics: metrikKode, logic_rules: logicRules } });
  log('KODE atribut hilang -> rule attribute gagal', cNoAttr.status === 200 && (cNoAttr.data?.hints || []).some(h => h.startsWith('❌') && h.includes('attribute')), JSON.stringify(cNoAttr.data?.hints));

  const cWrongAccess = await api('/api/grader/compare-code', { method: 'POST', token: sTok, body: { exerciseId: caseId, current_code: [{ path: 'Mobil.java', content: 'public class Mobil {\n  public String mesin;\n  public void jalan() {}\n}' }], codeMetrics: metrikKode, logic_rules: logicRules } });
  log('KODE modifier salah (public vs private) -> rule attribute gagal', cWrongAccess.status === 200 && (cWrongAccess.data?.hints || []).some(h => h.startsWith('❌') && h.includes('attribute')), JSON.stringify(cWrongAccess.data?.hints));

  const cWrongReturn = await api('/api/grader/compare-code', { method: 'POST', token: sTok, body: { exerciseId: caseId, current_code: [{ path: 'Mobil.java', content: 'public class Mobil {\n  private String mesin;\n  public int jalan() { return 1; }\n}' }], codeMetrics: metrikKode, logic_rules: logicRules } });
  log('KODE return type salah -> rule method gagal', cWrongReturn.status === 200 && (cWrongReturn.data?.hints || []).some(h => h.startsWith('❌') && h.includes('method(Mobil')), JSON.stringify(cWrongReturn.data?.hints));

  const cNoClass = await api('/api/grader/compare-code', { method: 'POST', token: sTok, body: { exerciseId: caseId, current_code: [{ path: 'Roda.java', content: 'public class Roda { }' }], codeMetrics: metrikKode, logic_rules: logicRules } });
  log('KODE kelas salah total -> semua rule gagal', cNoClass.status === 200 && cNoClass.data?.isPassed === false && (cNoClass.data?.hints || []).every(h => h.startsWith('❌')), JSON.stringify(cNoClass.data?.hints));

  const noAuthCode = await api('/api/grader/compare-code', { method: 'POST', body: { exerciseId: caseId, current_code: [], codeMetrics: metrikKode, logic_rules: logicRules } });
  log('KODE tanpa token -> 401', noAuthCode.status === 401);

  // ===== 5. Dashboard dosen =====
  const dash = await api('/api/lecturer/dashboard/data', { token: lTok });
  const st = (dash.data?.data || []).find(s => s.nim_nip === uname);
  log('dashboard: mahasiswa TEST muncul + agregasi exercise', dash.status === 200 && !!st && (st.exercises || []).some(e => e.exercise_id === caseId), dash.status === 200 ? `exercises=${st?.exercises?.length}` : JSON.stringify(dash.data));
  log('dashboard: metrik diagram & kode terekam', !!st && st.exercises.some(e => e.diagram?.submit_count >= 1) && st.exercises.some(e => e.code?.keystroke_count >= 1), st ? `diag.submit=${st.exercises.find(e => e.exercise_id === caseId)?.diagram?.submit_count} code.keys=${st.exercises.find(e => e.exercise_id === caseId)?.code?.keystroke_count}` : '');
  const dashStudent = await api('/api/lecturer/dashboard/data', { token: sTok });
  log('dashboard ditolak untuk role student (403)', dashStudent.status === 403, String(dashStudent.status));

  // ===== 6. Cleanup =====
  const del = await api(`/api/study-cases/${caseId}`, { method: 'DELETE', token: lTok });
  log('cleanup: study case TEST dihapus', del.status === 200);
  const afterDel = await api(`/api/study-cases/${caseId}`, { token: sTok });
  log('cleanup terverifikasi: 404 setelah hapus', afterDel.status === 404);

  const failed = results.filter(r => !r.pass);
  console.log(`\nTOTAL: ${results.length - failed.length}/${results.length} PASS`);
  if (failed.length) { console.log('GAGAL:'); failed.forEach(f => console.log(' -', f.name, '|', f.detail)); }
})().catch(e => { console.error('SCRIPT ERROR:', e.message); process.exit(1); });
