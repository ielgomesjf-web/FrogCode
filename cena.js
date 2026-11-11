// FrogCode — Cena (tipo Unity) e Modelos (tipo Blender).
// Regra de ouro: o CÓDIGO é o dono do jogo. Tudo que você arrasta aqui vira texto no código.
(function () {
'use strict';
const T = window.THREE, FC = window.FrogCode;
const $ = s => document.querySelector(s);
const esc = s => String(s).replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;');
const f = v => { const d = Math.abs(v) < 0.1 ? 1000 : 100; return String(Math.round(v * d) / d || 0); }; // coisa pequena ganha 3 casas, senão vira 0
const NUM = '-?\\d+(?:\\.\\d+)?';
const IDE = () => window.FrogIDE;

const ICONE = {
  moeda: '🟡', estrela: '⭐', gema: '💎', coracao: '❤️', chave: '🔑', arvore: '🌳', pinheiro: '🌲', pedra: '⛰️', caixa: '📦',
  bloco: '🧱', parede: '🚧', casa: '🏠', plataforma: '🟫', inimigo: '👾', espinho: '🔱', bandeira: '🚩', portal: '🌀', flor: '🌸',
  cubo: '🟥', bola: '🔵', cone: '🔺', cilindro: '🥫', piramide: '🔼', jogador: '🐸',
};
const ESCRITA = { arvore: 'árvore', coracao: 'coração', piramide: 'pirâmide' };
const PALETA = ['casa', 'arvore', 'pinheiro', 'pedra', 'caixa', 'bloco', 'parede', 'plataforma', 'flor', 'moeda', 'estrela', 'gema', 'coracao', 'chave', 'inimigo', 'espinho', 'bandeira', 'portal', 'cubo', 'bola', 'cone', 'cilindro', 'piramide'];
const nomeCor = hex => { if (!hex) return null; const h = String(hex).toLowerCase(); for (const [n, c] of Object.entries(FC.CORES)) if (c.toLowerCase() === h) return n; return null; };
const textoCor = hex => nomeCor(hex) || `"${hex}"`;

// ---------- mexer no texto do código ----------
function cortarComentario(raw) {
  let q = null;
  for (let i = 0; i < raw.length; i++) {
    const c = raw[i];
    if (q) { if (c === q) q = null; continue; }
    if (c === '"' || c === "'") { q = c; continue; }
    if (c === '#') return [raw.slice(0, i).replace(/\s+$/, ''), '  ' + raw.slice(i)];
  }
  return [raw.replace(/\s+$/, ''), ''];
}
function trocarOuPor(raw, re, novo) { // troca o pedaço que casa com re; se não tiver, põe no fim
  let [c, cm] = cortarComentario(raw);
  if (re.test(c)) c = c.replace(re, novo).replace(/\s{2,}/g, ' ').replace(/\s+$/, '');
  else if (novo) c += ' ' + novo;
  return c + cm;
}
const setPos = (raw, nums) => {
  let [c, cm] = cortarComentario(raw);
  c = c.replace(/\s+(espalhad\S*|pelo mapa|no mapa|aleat[oó]rios?)(?=\s|$)/i, '');
  return trocarOuPor(c + cm, new RegExp(`\\bem\\s+${NUM}(?:\\s+${NUM}){1,2}`), 'em ' + nums.map(f).join(' '));
};
const setGiro = (raw, g) => trocarOuPor(raw, new RegExp(`\\b(?:giro|girad[oa])\\s+${NUM}`), g ? 'giro ' + f(g) : '');
const setTamanho = (raw, t) => trocarOuPor(raw, new RegExp(`\\btamanho\\s+${NUM}(?:\\s+${NUM}\\s+${NUM})?`), 'tamanho ' + t.map(f).join(' '));
const setCor = (raw, cor) => trocarOuPor(raw, /\bcor\s+("[^"]*"|\S+)/, cor ? 'cor ' + cor : '');
const setNome = (raw, nome) => trocarOuPor(raw, /\bchamad[oa]s?\s+\S+/, nome ? 'chamado ' + nome : '');

let desfazer = [];
function mudarTexto(fn, reconstruir = true) {
  const antes = IDE().texto();
  const depois = fn(antes.split('\n'));
  if (depois == null) return;
  const novo = Array.isArray(depois) ? depois.join('\n') : depois;
  if (novo === antes) return;
  desfazer.push(antes); if (desfazer.length > 60) desfazer.shift();
  IDE().setTexto(novo);
  if (reconstruir) montar();
}
function trocarLinha(n, fn, reconstruir) { mudarTexto(L => { L[n - 1] = fn(L[n - 1]); return L; }, reconstruir); }
function desfazerUm() { const t = desfazer.pop(); if (t == null) return; IDE().setTexto(t); montar(); modelos.recarregar(); }

// ========================= CENA (tipo Unity) =========================
let camPosta = false;
let motor = null, cam, orbit, tc, sel = null, pivo = null, pivoIni = null, caixaSel = null, prog = null, grade = true;
const ray = new T.Raycaster(), planoChao = new T.Plane(new T.Vector3(0, 1, 0), 0);

function iniciarCena() {
  if (motor) return true;
  if (!T || !window.Motor || !T.OrbitControls || !T.TransformControls) {
    $('#cenaPalco').insertAdjacentHTML('beforeend', '<div class="aviso-cena">Não consegui carregar o 3D. Precisa de internet na primeira vez.</div>');
    return false;
  }
  const cv = $('#cenaCv');
  cam = new T.PerspectiveCamera(55, 1, 0.1, 1000);
  cam.position.set(18, 22, 30);
  motor = new Motor(cv, document.createElement('div'), {
    editor: true, camera: () => cam,
    aoAjustar: (w, h) => { cam.aspect = w / h; cam.updateProjectionMatrix(); },
    antes: () => { if (caixaSel) caixaSel.update(); },
  });
  orbit = new T.OrbitControls(cam, cv);
  orbit.mouseButtons = { LEFT: null, MIDDLE: T.MOUSE.PAN, RIGHT: T.MOUSE.ROTATE };
  orbit.enableDamping = false; orbit.target.set(0, 0, 0); orbit.screenSpacePanning = false;
  orbit.update();
  tc = new T.TransformControls(cam, cv);
  tc.setSize(1.1);
  tc.addEventListener('dragging-changed', e => { orbit.enabled = !e.value; if (!e.value) confirmar(); });
  tc.addEventListener('objectChange', aoMexer);
  aplicarGrade();
  cv.addEventListener('pointerdown', e => { cv.focus(); pd = [e.clientX, e.clientY, e.button]; });
  cv.addEventListener('pointerup', e => { if (pd && pd[2] === 0 && Math.hypot(e.clientX - pd[0], e.clientY - pd[1]) < 5 && !tc.dragging && tc.axis === null) clicar(e); pd = null; });
  cv.addEventListener('pointermove', mostrarCoord);
  cv.addEventListener('keydown', teclaCena);
  $('#cenaFerr').addEventListener('click', e => {
    const b = e.target.closest('button'); if (!b) return;
    const a = b.dataset.a;
    if (a === 'translate' || a === 'rotate' || a === 'scale') modo(a);
    else if (a === 'grade') { grade = !grade; aplicarGrade(); }
    else if (a === 'focar') focar();
    else if (a === 'duplicar') duplicar();
    else if (a === 'apagar') apagar();
    else if (a === 'desfazer') desfazerUm();
    else if (a === 'rodar') IDE().rodar();
  });
  const pal = $('#paleta');
  pal.innerHTML = '<span class="rot">ADICIONAR:</span>' + PALETA.map(t => `<button data-t="${t}" title="${ESCRITA[t] || t}">${ICONE[t]}<small>${ESCRITA[t] || t}</small></button>`).join('');
  pal.addEventListener('click', e => { const b = e.target.closest('button'); if (b) adicionar(b.dataset.t); });
  return true;
}
let pd = null;
function aplicarGrade() {
  if (!tc) return;
  tc.setTranslationSnap(grade ? 0.5 : null); tc.setRotationSnap(grade ? T.MathUtils.degToRad(15) : null); tc.setScaleSnap(grade ? 0.1 : null);
  const b = document.querySelector('#cenaFerr [data-a="grade"]'); if (b) b.classList.toggle('on', grade);
}
function modo(m) {
  if (sel && (sel.deAte || sel.ehJogador) && m !== 'translate') { IDE().saida('Esse aí só dá pra arrastar (não gira nem muda de tamanho)'); m = 'translate'; }
  tc.setMode(m);
  const lado = motor.cfg && motor.cfg.modo === 'lado';
  tc.showX = m !== 'rotate'; tc.showZ = m !== 'rotate' && !(lado && m === 'translate'); tc.showY = true;
  document.querySelectorAll('#cenaFerr [data-a]').forEach(b => b.classList.toggle('on', b.dataset.a === m || (b.dataset.a === 'grade' && grade)));
}

// monta (ou remonta) a cena a partir do código
function montar(linhaSel) {
  if (!iniciarCena()) return;
  const manter = linhaSel ?? (sel ? (sel.ehJogador ? 'jogador' : sel.linha) : null);
  soltarPivo(); tc.detach(); sel = null; if (caixaSel) { caixaSel.parent?.remove(caixaSel); caixaSel = null; }
  prog = IDE().analisar();
  const erros = prog.erros.filter(e => e.nivel === 'erro');
  $('#cenaAviso').style.display = erros.length ? 'block' : 'none';
  $('#cenaAviso').textContent = erros.length ? `⚠ O código tem ${erros.length} erro(s) — a cena mostra só as linhas certas. (linha ${erros[0].linha}: ${erros[0].msg})` : '';
  try { motor.montarEditor(prog); } catch (e) { console.error(e); IDE().saida('❌ Cena: ' + e.message, 'er'); }
  motor.cena.add(tc);
  const tam = Math.max(motor.cfg.chao.w || 40, motor.cfg.chao.d || 40);
  const gr = new T.GridHelper(Math.ceil(tam / 2) * 2, Math.ceil(tam / 2) * 2, 0x2f7d32, 0x000000);
  gr.material.opacity = 0.18; gr.material.transparent = true; gr.position.y = 0.01; motor.cena.add(gr);
  motor.cena.fog = null;
  if (!camPosta) { const tm = Math.max(motor.cfg.chao.w || 40, motor.cfg.chao.d || 40); cam.position.set(tm * 0.35, tm * 0.45, tm * 0.6); orbit.target.set(0, 0, 0); orbit.update(); camPosta = true; }
  modo(tc.mode || 'translate');
  hierarquia();
  if (manter === 'jogador') selecionar(motor.jogObj);
  else if (manter) selecionar(motor.objs.find(o => o.vivo && o.linha === manter && !o.multiFixo) || null);
  else inspetor();
}
function objetosDaCena() { return motor ? motor.objs.filter(o => o.vivo && o.linha) : []; }

function clicar(e) {
  const r = $('#cenaCv').getBoundingClientRect();
  ray.setFromCamera({ x: (e.clientX - r.left) / r.width * 2 - 1, y: -(e.clientY - r.top) / r.height * 2 + 1 }, cam);
  const alvos = [motor.jogObj.g, ...objetosDaCena().map(o => o.g)];
  const hit = ray.intersectObjects(alvos, true)[0];
  let o = null;
  if (hit) { let x = hit.object; while (x && !x.userData.obj) x = x.parent; o = x ? x.userData.obj : null; }
  selecionar(o);
}
function mostrarCoord(e) {
  if (!motor || !motor.cfg) return;
  const r = $('#cenaCv').getBoundingClientRect(), p = new T.Vector3();
  ray.setFromCamera({ x: (e.clientX - r.left) / r.width * 2 - 1, y: -(e.clientY - r.top) / r.height * 2 + 1 }, cam);
  if (motor.cfg.modo === 'lado') { const pl = new T.Plane(new T.Vector3(0, 0, 1), 0); if (ray.ray.intersectPlane(pl, p)) $('#cenaCoord').textContent = `📍 x ${f(p.x)}  y ${f(p.y)}`; }
  else if (ray.ray.intersectPlane(planoChao, p)) $('#cenaCoord').textContent = `📍 x ${f(p.x)}  z ${f(p.z)}`;
}
function soltarPivo() {
  if (!pivo) return;
  for (const c of [...pivo.children]) motor.cena.attach(c);
  motor.cena.remove(pivo); pivo = null;
}
function selecionar(o) {
  soltarPivo();
  sel = o || null;
  if (caixaSel) { caixaSel.parent?.remove(caixaSel); caixaSel = null; }
  tc.detach();
  if (sel) {
    const podeMexer = sel.editavel || sel.deAte || sel.ehJogador;
    if (sel.deAte) {
      const segs = objetosDaCena().filter(x => x.linha === sel.linha);
      const c = new T.Vector3(); segs.forEach(s => c.add(s.g.position)); c.divideScalar(segs.length);
      pivo = new T.Object3D(); pivo.position.copy(c); motor.cena.add(pivo); pivoIni = c.clone();
      segs.forEach(s => pivo.attach(s.g));
      caixaSel = new T.BoxHelper(pivo, 0xffd400);
      if (podeMexer) tc.attach(pivo);
    } else {
      caixaSel = new T.BoxHelper(sel.g, 0xffd400);
      if (podeMexer) tc.attach(sel.g);
    }
    motor.cena.add(caixaSel);
    if (sel.deAte || sel.ehJogador) modo('translate');
  }
  inspetor(); hierarquia();
}
function aoMexer() {
  if (!sel) return;
  if (tc.mode === 'scale' && !sel.deAte && !sel.ehJogador && !FC.FORMAS.includes(sel.tipo)) { // só formas esticam torto
    const s = sel.g.scale, base = sel.escalaAtual || sel.g.scale.x;
    const v = [s.x, s.y, s.z].sort((a, b) => Math.abs(b - base) - Math.abs(a - base))[0];
    s.setScalar(Math.max(0.1, v));
  }
  if (tc.mode === 'rotate') sel.giroMexido = true;
  if (tc.mode === 'scale') sel.escalaMexida = true;
  inspetor(true);
}
function yCodigo(o) {
  const y = o.g.position.y;
  if (o.tipo === 'plataforma') return y + 0.4;
  if (o.cat === 'coletavel' && !o.voando) return y - 0.6;
  return y;
}
function confirmar() { // soltou o mouse: escreve no código
  if (!sel) return;
  const o = sel, lado = motor.cfg.modo === 'lado';
  if (o.ehJogador) {
    const p = o.g.position, nums = lado ? [p.x, p.y] : [p.x, p.z];
    if (motor.inicioLinha) trocarLinha(motor.inicioLinha, raw => raw.replace(/^(\s*jogador\s+(?:comeca\s+|começa\s+)?em\s*:?\s*).*$/i, '$1' + nums.map(f).join(' ')), false);
    else mudarTexto(L => {
      let i = L.findIndex(l => /^\s*jogador\s*:/i.test(l)); if (i < 0) i = L.findIndex(l => /^\s*jogo\s*:/i.test(l));
      L.splice(i + 1, 0, 'jogador em: ' + nums.map(f).join(' ')); return L;
    });
    return;
  }
  if (o.deAte) {
    const d = pivo.position.clone().sub(pivoIni), dd = lado ? [d.x, d.y] : [d.x, d.z];
    trocarLinha(o.linha, raw => raw.replace(new RegExp(`\\bde\\s+(${NUM})\\s+(${NUM})\\s+at[eé]\\s+(${NUM})\\s+(${NUM})`, 'i'),
      (m, a, b, c, e) => `de ${f(+a + dd[0])} ${f(+b + dd[1])} até ${f(+c + dd[0])} ${f(+e + dd[1])}`), false);
    pivoIni = pivo.position.clone();
    return;
  }
  if (!o.editavel) return;
  const p = o.g.position, y = yCodigo(o);
  let nums;
  if (lado) nums = [p.x, y];
  else {
    const chao = Math.max(0, motor.alturaSem(p.x, p.z, o) ?? 0);
    nums = o.tipo === 'plataforma' || Math.abs(y - chao) > 0.05 ? [p.x, y, p.z] : [p.x, p.z];
  }
  trocarLinha(o.linha, raw => {
    let r = setPos(raw, nums);
    if (o.giroMexido) r = setGiro(r, Math.round(((o.g.rotation.y * 180 / Math.PI) % 360 + 360) % 360));
    if (o.escalaMexida) {
      if (FC.FORMAS.includes(o.tipo)) { const s = o.g.scale; const t = o.formaTam.map((v, i) => v * [s.x, s.y, s.z][i]); r = setTamanho(r, t.every(v => Math.abs(v - t[0]) < 0.01) ? [t[0]] : t); }
      else r = setTamanho(r, [o.sCodigo * o.g.scale.x / o.escalaIni]);
    }
    return r;
  }, false);
  o.escalaAtual = o.g.scale.x;
  if (o.aabb) { const b = new T.Box3().setFromObject(o.g); o.aabb.min.copy(b.min); o.aabb.max.copy(b.max); }
}

// ---------- inspetor e hierarquia ----------
function nomeDe(o) {
  if (o.ehJogador) return '🐸 Jogador (onde começa)';
  const t = o.tipo.startsWith('emoji:') ? o.tipo.slice(6) : (ICONE[o.tipo] || '🧩') + ' ' + (ESCRITA[o.tipo] || o.tipo);
  return t + (o.nome ? ` "${o.nome}"` : '');
}
function inspetor(soNumeros) {
  const el = $('#inspetor');
  if (soNumeros && sel && el.querySelector('[data-c="x"]')) { // só atualiza os números enquanto arrasta
    const p = sel.ehJogador || sel.deAte ? (pivo || sel.g).position : sel.g.position;
    const set = (c, v) => { const i = el.querySelector(`[data-c="${c}"]`); if (i && document.activeElement !== i) i.value = f(v); };
    set('x', p.x); set('y', sel.ehJogador || sel.deAte ? p.y : yCodigo(sel)); set('z', p.z);
    set('giro', Math.round(((sel.g.rotation.y * 180 / Math.PI) % 360 + 360) % 360));
    set('tamanho', sel.sCodigo ? sel.sCodigo * sel.g.scale.x / sel.escalaIni : 1);
    return;
  }
  if (!sel) {
    el.innerHTML = `<h3>INSPETOR</h3><p class="fraco">Clique num objeto da cena pra ver e mudar ele.<br><br>
      <b>Botão direito</b> arrastando: girar a vista<br><b>Rodinha</b>: zoom<br><b>Botão do meio</b>: arrastar a vista<br><br>
      <b>W</b> mover · <b>E</b> girar · <b>R</b> tamanho<br><b>Del</b> apagar · <b>Ctrl+D</b> duplicar · <b>Ctrl+Z</b> desfazer · <b>F</b> focar</p>`;
    return;
  }
  const o = sel, lado = motor.cfg.modo === 'lado';
  let h = `<h3>${esc(nomeDe(o))}</h3>`;
  if (o.linha) h += `<p class="fraco">linha ${o.linha} do código</p>`;
  if (o.multi) {
    h += `<p>Essa linha cria <b>${o.no.qtd}</b> objetos em lugares sorteados.</p>
      <div class="botoes"><button class="btn perigo" data-acao="apagar1">🗑 Apagar só este</button><button class="btn perigo" data-acao="apagar">🗑 Apagar todos (${o.no.qtd})</button></div>
      <button class="btn largo" data-acao="fixar">📌 Fixar onde estão (vira ${o.no.qtd} linhas que dá pra arrastar)</button>`;
  } else if (!o.editavel && !o.deAte && !o.ehJogador) {
    h += `<p>🔒 Esse objeto é criado por uma conta, um <b>repetir</b> ou um <b>quando</b>. Pra mudar, mexa no código.</p>`;
  } else {
    const p = o.ehJogador || o.deAte ? (pivo || o.g).position : o.g.position;
    const campo = (c, rot, v, passo = 0.5) => `<label>${rot}<input type="number" step="${passo}" data-c="${c}" value="${f(v)}"></label>`;
    h += '<div class="campos">' + campo('x', 'X (lado)', p.x) + campo('y', 'Y (altura)', o.ehJogador || o.deAte ? p.y : yCodigo(o));
    if (!lado) h += campo('z', 'Z (frente)', p.z);
    h += '</div>';
    if (o.editavel) {
      h += '<div class="campos">' + campo('giro', 'Giro°', Math.round(((o.g.rotation.y * 180 / Math.PI) % 360 + 360) % 360), 15) + campo('tamanho', 'Tamanho', o.sCodigo * o.g.scale.x / o.escalaIni, 0.1) + '</div>';
      h += `<div class="tamcena"><button data-tz="0.9">➖ menor</button><button data-tz="1.1">➕ maior</button></div>`;
      h += `<label class="linha">Nome <input type="text" data-c="nome" value="${esc(o.nome || '')}" placeholder="(sem nome)"></label>`;
      h += `<div class="rotulo">Cor</div><div class="cores"><button data-cor="" title="cor normal">✖</button>` +
        Object.entries(FC.CORES).map(([n, c]) => `<button data-cor="${n}" title="${n}" style="background:${c}" class="${o.corBase && c.toLowerCase() === String(o.corBase).toLowerCase() ? 'sel' : ''}"></button>`).join('') + '</div>';
    }
  }
  h += '<div class="botoes">';
  if (o.linha) h += '<button class="btn" data-acao="codigo">📝 Ver no código</button>';
  if (o.editavel || o.deAte) h += '<button class="btn" data-acao="duplicar">⧉ Duplicar</button>';
  if (o.linha && !o.multi) h += '<button class="btn perigo" data-acao="apagar">🗑 Apagar</button>';
  h += '</div>';
  el.innerHTML = h;
  el.querySelectorAll('input[data-c]').forEach(i => i.addEventListener('change', () => campoMudou(i.dataset.c, i.value)));
  el.querySelectorAll('[data-cor]').forEach(b => b.onclick = () => trocarLinha(o.linha, raw => setCor(raw, b.dataset.cor)));
  el.querySelectorAll('[data-tz]').forEach(b => b.onclick = () => campoMudou('tamanho', o.sCodigo * o.g.scale.x / o.escalaIni * +b.dataset.tz));
  el.querySelectorAll('[data-acao]').forEach(b => b.onclick = () => {
    const a = b.dataset.acao;
    if (a === 'codigo') IDE().irParaCodigo(o.linha);
    else if (a === 'duplicar') duplicar();
    else if (a === 'apagar') apagar();
    else if (a === 'apagar1') apagar(true);
    else if (a === 'fixar') fixar(o);
  });
}
function campoMudou(c, v) {
  const o = sel; if (!o) return;
  if (c === 'nome') { const n = FC.semAcento(v).replace(/[^a-z0-9_]/g, ''); trocarLinha(o.linha, raw => setNome(raw, n)); return; }
  const n = parseFloat(v); if (isNaN(n)) return;
  if (c === 'giro') { o.g.rotation.y = n * Math.PI / 180; o.giroMexido = true; }
  else if (c === 'tamanho') { o.g.scale.setScalar(o.escalaIni * Math.max(0.05, n) / o.sCodigo); o.escalaMexida = true; }
  else {
    const alvo = pivo || o.g;
    if (c === 'y' && !o.ehJogador && !o.deAte) alvo.position.y += n - yCodigo(o); else alvo.position[c] = n;
  }
  confirmar(); montar();
}
function hierarquia() {
  const el = $('#hierarquia'); if (!motor || !motor.jogObj) return;
  const vistos = new Set(), itens = [motor.jogObj];
  for (const o of objetosDaCena()) { const k = o.linha; if (vistos.has(k)) continue; vistos.add(k); itens.push(o); }
  itens.sort((a, b) => (a.linha || 0) - (b.linha || 0));
  el.innerHTML = '<h3>HIERARQUIA</h3>' + itens.map((o, i) => {
    const qtd = o.multi ? ` ×${o.no.qtd}` : o.deAte ? ' (fileira)' : '';
    const ativo = sel && (sel === o || (sel.linha && sel.linha === o.linha && !o.ehJogador));
    return `<div class="item ${ativo ? 'ativo' : ''}" data-i="${i}">${esc(nomeDe(o))}${qtd}${o.editavel || o.deAte || o.ehJogador ? '' : ' 🔒'}<span>${o.linha ? 'L' + o.linha : ''}</span></div>`;
  }).join('');
  el.querySelectorAll('.item').forEach(d => d.onclick = () => { selecionar(itens[+d.dataset.i]); focar(); });
}

// ---------- adicionar, duplicar, apagar, fixar ----------
function centroDaVista() {
  const p = new T.Vector3();
  ray.setFromCamera({ x: 0, y: 0 }, cam);
  if (!ray.ray.intersectPlane(planoChao, p)) p.copy(orbit.target);
  const w = (motor.cfg.chao.w || 40) / 2 - 1, d = (motor.cfg.chao.d || 40) / 2 - 1;
  return [Math.round(Math.max(-w, Math.min(w, p.x)) * 2) / 2, Math.round(Math.max(-d, Math.min(d, p.z)) * 2) / 2];
}
function inserirNaCena(linha) {
  let n = 0;
  mudarTexto(L => {
    if (!L.some(l => /#\s*-+\s*cena/i.test(l))) { while (L.length && !L[L.length - 1].trim()) L.pop(); L.push('', '# ---------- cena (feita no editor) ----------'); }
    L.push(linha); n = L.length; return L;
  }, false);
  montar(n);
}
function adicionar(tipo) {
  if (!motor || !motor.cfg) return;
  const nome = ESCRITA[tipo] || tipo, lado = motor.cfg.modo === 'lado';
  const [x, z] = centroDaVista();
  let linha;
  if (lado) linha = `criar ${nome} em ${f(orbit.target.x)} ${tipo === 'plataforma' ? 2 : 0}`;
  else linha = tipo === 'plataforma' ? `criar plataforma em ${f(x)} 2 ${f(z)}` : `criar ${nome} em ${f(x)} ${f(z)}`;
  if (FC.FORMAS.includes(tipo)) linha += ' cor laranja sólido';
  inserirNaCena(linha);
}
function duplicar() {
  const o = sel; if (!o || !o.linha || !(o.editavel || o.deAte)) return;
  const L = IDE().texto().split('\n'); let raw = L[o.linha - 1];
  if (o.deAte) raw = raw.replace(new RegExp(`\\bde\\s+(${NUM})\\s+(${NUM})\\s+at[eé]\\s+(${NUM})\\s+(${NUM})`, 'i'), (m, a, b, c, e) => `de ${f(+a + 2)} ${b} até ${f(+c + 2)} ${e}`);
  else {
    const p = o.g.position, lado = motor.cfg.modo === 'lado', y = yCodigo(o);
    raw = setPos(raw, lado ? [p.x + 2, y] : Math.abs(y - Math.max(0, motor.alturaSem(p.x, p.z, o) ?? 0)) > 0.05 || o.tipo === 'plataforma' ? [p.x + 2, y, p.z] : [p.x + 2, p.z]);
  }
  let n = 0;
  mudarTexto(L2 => { L2.splice(o.linha, 0, raw); n = o.linha + 1; return L2; }, false);
  montar(n);
}
async function apagar(soEste) {
  const o = sel; if (!o || !o.linha) return;
  if (o.multi && soEste) { // "criar 10 moedas" vira "criar 9 moedas"
    trocarLinha(o.linha, raw => raw.replace(/^(\s*criar\s+)(\d+)/i, (m, a, n) => a + Math.max(1, +n - 1)), false);
    sel = null; montar(null); return;
  }
  if (o.multi && !(await IDE().confirmar(`Essa linha cria ${o.no.qtd} objetos.\nApagar todos eles?`, 'Apagar todos'))) return;
  sel = null;
  mudarTexto(L => { L.splice(o.linha - 1, 1); return L; }, false);
  montar(null);
}
function fixar(o) {
  const irmaos = objetosDaCena().filter(x => x.linha === o.linha), lado = motor.cfg.modo === 'lado';
  mudarTexto(L => {
    const raw = L[o.linha - 1], ind = raw.match(/^\s*/)[0];
    let base = cortarComentario(raw)[0].trim().replace(/^criar\s+(\S+)\s+/i, (m, q) => /^\d+$|^(um|uma|dois|duas|tr[eê]s|quatro|cinco|seis|sete|oito|nove|dez|vinte|trinta|cem)$/i.test(q) ? 'criar ' : m);
    base = base.replace(/^criar\s+(\S+)/i, (m, w) => { const s = FC.PLURAL[FC.semAcento(w)]; return 'criar ' + (s ? (ESCRITA[s] || s) : w); });
    const novas = irmaos.map(x => {
      const p = x.g.position, y = yCodigo(x);
      return ind + setPos(base, lado ? [p.x, y] : x.tipo === 'plataforma' || Math.abs(y - Math.max(0, motor.alturaSem(p.x, p.z, x) ?? 0)) > 0.05 ? [p.x, y, p.z] : [p.x, p.z]);
    });
    L.splice(o.linha - 1, 1, ...novas); return L;
  }, false);
  montar(o.linha);
  IDE().saida(`📌 Fixei ${irmaos.length} objetos — agora cada um é uma linha e dá pra arrastar`, 'ok');
}
function focar() {
  if (!sel) return;
  const p = (pivo || sel.g).position;
  const d = cam.position.clone().sub(orbit.target);
  orbit.target.copy(p); cam.position.copy(p).add(d.setLength(Math.min(d.length(), 14)));
  orbit.update();
}
function teclaCena(e) {
  const k = e.key.toLowerCase();
  if (e.ctrlKey && k === 'z') { e.preventDefault(); desfazerUm(); return; }
  if (e.ctrlKey && k === 'd') { e.preventDefault(); duplicar(); return; }
  if (e.ctrlKey) return;
  if (k === 'w') modo('translate'); else if (k === 'e') modo('rotate'); else if (k === 'r') modo('scale');
  else if (k === 'f') focar(); else if (k === 'delete' || k === 'backspace') apagar();
  else if (k === 'escape') selecionar(null);
  else return;
  e.preventDefault();
}

// ========================= MODELOS (tipo Blender) =========================
const modelos = (() => {
  let r, cena, camM, orbitM, tcM, grupo, pecas = [], atual = null, selP = null, iniciado = false, caixaP = null, ultimoModelo = undefined, tudo = null, selSet = [], modoVarias = false;
  const raio = new T.Raycaster();
  const CATS = [['solido', 'sólido'], ['inimigo', 'inimigo'], ['coletavel', 'pegável'], ['perigo', 'perigoso'], ['enfeite', 'enfeite']];
  function iniciar() {
    if (iniciado) return true;
    if (!T || !T.OrbitControls || !T.TransformControls) return false;
    const cv = $('#modCv');
    r = new T.WebGLRenderer({ canvas: cv, antialias: true }); r.setPixelRatio(Math.min(devicePixelRatio, 1.5)); r.outputEncoding = T.sRGBEncoding;
    cena = new T.Scene(); cena.background = new T.Color('#2b2f36');
    cena.add(new T.HemisphereLight('#ffffff', '#555555', 0.8));
    const sol = new T.DirectionalLight('#ffffff', 0.8); sol.position.set(3, 6, 4); cena.add(sol);
    const gr = new T.GridHelper(6, 24, 0x7ed957, 0x444444); cena.add(gr);
    const chao = new T.Mesh(new T.CircleGeometry(3, 40), new T.MeshBasicMaterial({ color: '#3a3f47' })); chao.rotation.x = -Math.PI / 2; chao.position.y = -0.005; cena.add(chao);
    const frente = new T.Mesh(new T.ConeGeometry(0.12, 0.3, 12), new T.MeshBasicMaterial({ color: '#7ed957' })); frente.rotation.x = Math.PI / 2; frente.position.set(0, 0.02, 2.4); cena.add(frente);
    grupo = new T.Group(); cena.add(grupo);
    camM = new T.PerspectiveCamera(50, 1, 0.05, 100); camM.position.set(3.2, 2.6, 4.2);
    orbitM = new T.OrbitControls(camM, cv); orbitM.mouseButtons = { LEFT: null, MIDDLE: T.MOUSE.PAN, RIGHT: T.MOUSE.ROTATE }; orbitM.target.set(0, 0.7, 0); orbitM.update();
    tcM = new T.TransformControls(camM, cv); tcM.setSize(0.9);
    tcM.setTranslationSnap(0.05); tcM.setRotationSnap(T.MathUtils.degToRad(15)); tcM.setScaleSnap(0.01);
    tcM.addEventListener('dragging-changed', e => { orbitM.enabled = !e.value; if (!e.value) escrever(); });
    tcM.addEventListener('objectChange', () => {
      if (tudo) { if (tcM.mode === 'scale') { const sc = tudo.scale, v = [sc.x, sc.y, sc.z].sort((a, b) => Math.abs(b - 1) - Math.abs(a - 1))[0]; sc.setScalar(Math.max(0.05, v)); } return; }
      if (selP && tcM.mode === 'scale') selP.scale.set(...['x', 'y', 'z'].map(k => Math.max(0.005, selP.scale[k]))); // nunca negativo nem zero
      painel(true);
    });
    cena.add(tcM);
    let p0 = null;
    cv.addEventListener('pointerdown', e => { cv.focus(); p0 = [e.clientX, e.clientY, e.button]; });
    cv.addEventListener('pointerup', e => {
      if (p0 && p0[2] === 0 && Math.hypot(e.clientX - p0[0], e.clientY - p0[1]) < 5 && !tcM.dragging && tcM.axis === null) {
        const b = cv.getBoundingClientRect();
        raio.setFromCamera({ x: (e.clientX - b.left) / b.width * 2 - 1, y: -(e.clientY - b.top) / b.height * 2 + 1 }, camM);
        const h = raio.intersectObjects(pecas, false)[0];
        if (h && (e.shiftKey || modoVarias)) alternarNoConjunto(h.object);
        else if (!h && modoVarias) { /* no modo Várias, tocar no vazio não larga a seleção */ }
        else escolher(h ? h.object : null);
      }
      p0 = null;
    });
    cv.addEventListener('keydown', e => {
      const k = e.key.toLowerCase();
      if (e.ctrlKey && k === 'z') { e.preventDefault(); desfazerUm(); return; }
      if (e.ctrlKey && k === 'd') { e.preventDefault(); duplicarP(); return; }
      if ((e.ctrlKey && k === 'a') || k === 'a') { e.preventDefault(); selecionarTudo(); return; }
      if (k === 'm') { e.preventDefault(); espelharP(); return; }
      if (k === 'w') modoM('translate'); else if (k === 'e') modoM('rotate'); else if (k === 'r') modoM('scale');
      else if (k === 'delete' || k === 'backspace') apagarP(); else if (k === 'escape') escolher(null); else return;
      e.preventDefault();
    });
    $('#modFerr').addEventListener('click', e => {
      const b = e.target.closest('button'); if (!b) return; const a = b.dataset.a;
      if (['translate', 'rotate', 'scale'].includes(a)) modoM(a);
      else if (a === 'duplicar') duplicarP(); else if (a === 'apagar') apagarP(); else if (a === 'desfazer') desfazerUm(); else if (a === 'espelhar') espelharP(); else if (a === 'tudo') selecionarTudo();
      else if (a === 'varias') { modoVarias = !modoVarias; b.classList.toggle('on', modoVarias); IDE().saida(modoVarias ? '☑ Modo Várias ligado: toque nas peças pra juntar ou tirar do conjunto' : '☑ Modo Várias desligado'); }
    });
    $('#modPecas').innerHTML = '<span class="rot">PEÇAS:</span>' + FC.FORMAS.map(fm => `<button data-f="${fm}">${ICONE[fm]}<small>${ESCRITA[fm] || fm}</small></button>`).join('') + '<button data-f="olhos" title="Escolha a cabeça e clique: põe 2 olhos na frente dela">👀<small>olhos</small></button>';
    $('#modPecas').addEventListener('click', e => { const b = e.target.closest('button'); if (b) adicionarP(b.dataset.f); });
    new ResizeObserver(ajustar).observe($('#modPalco'));
    const laco = () => { if (cv.offsetParent !== null) { if (caixaP) caixaP.update(); r.render(cena, camM); } requestAnimationFrame(laco); };
    requestAnimationFrame(laco);
    iniciado = true; ajustar(); modoM('translate');
    return true;
  }
  function ajustar() {
    const p = $('#modPalco'), w = p.clientWidth, h = p.clientHeight; if (!w || !h || !r) return;
    r.setSize(w, h, false); camM.aspect = w / h; camM.updateProjectionMatrix();
  }
  function modoM(m) { tcM.setMode(m); document.querySelectorAll('#modFerr [data-a]').forEach(b => b.classList.toggle('on', b.dataset.a === m)); }
  function lista() { return (IDE().analisar().corpo || []).filter(n => n.tipo === 'modelo'); }
  function recarregar() {
    if (!iniciado) return;
    const ms = lista();
    $('#modLista').innerHTML = '<h3>MEUS MODELOS</h3>' + ms.map(m => `<div class="item ${atual === m.nome ? 'ativo' : ''}" data-m="${m.nome}">🧩 ${esc(m.cabecalho.replace(/^\s*modelo\s+/i, '').replace(/:\s*$/, ''))}<span>L${m.n}</span></div>`).join('') +
      '<button class="btn largo" id="modNovo">＋ Novo modelo</button><p class="fraco">Use no código:<br><code>jogador: nome</code><br><code>criar nome em 0 0</code></p>';
    $('#modLista').querySelectorAll('.item').forEach(d => d.onclick = () => { atual = d.dataset.m; carregar(); });
    const trocou = ultimoModelo !== atual;
    $('#modNovo').onclick = novo;
    if (!ms.find(m => m.nome === atual)) atual = ms[0] ? ms[0].nome : null;
    carregar(!trocou && ultimoModelo === atual); ultimoModelo = atual;
  }
  function carregar(manterSel) {
    soltarTudo();
    const idxSel = manterSel && selP ? pecas.indexOf(selP) : -1;
    tcM.detach(); selP = null; if (caixaP) { cena.remove(caixaP); caixaP = null; }
    pecas.forEach(p => grupo.remove(p)); pecas = [];
    $('#modLista').querySelectorAll('.item').forEach(d => d.classList.toggle('ativo', d.dataset.m === atual));
    const m = lista().find(x => x.nome === atual);
    $('#modVazio').style.display = m ? 'none' : 'flex';
    if (!m) { painel(); return; }
    for (const p of m.partes) {
      const me = new T.Mesh(MODELOS.geoForma(p.forma), new T.MeshStandardMaterial({ color: p.cor, roughness: 0.7 }));
      me.position.set(...p.pos); me.scale.set(...p.tam); me.rotation.set(...p.giro.map(g => g * Math.PI / 180));
      me.userData = { forma: p.forma, cor: p.cor };
      grupo.add(me); pecas.push(me);
    }
    if (!manterSel) { // enquadra o modelo
      const b = new T.Box3().setFromObject(grupo), c = b.getCenter(new T.Vector3()), t = b.getSize(new T.Vector3()).length();
      orbitM.target.copy(c); camM.position.copy(c).add(new T.Vector3(0.7, 0.5, 1).setLength(Math.max(2.5, t * 1.5))); orbitM.update();
    }
    if (idxSel >= 0 && pecas[idxSel]) escolher(pecas[idxSel]); else painel();
  }
  const ehTudo = () => !!tudo && selSet.length === pecas.length;
  function selecionarTudo() { selecionarConjunto(pecas.slice()); } // o modelo inteiro
  function selecionarConjunto(lista) { // várias peças juntas, mexendo como se fossem uma só
    lista = lista.filter(p => pecas.includes(p));
    soltarTudo(); escolher(null);
    if (!lista.length) return;
    if (lista.length === 1) { escolher(lista[0]); return; }
    const b = new T.Box3(); lista.forEach(p => b.expandByObject(p));
    const c = b.getCenter(new T.Vector3());
    tudo = new T.Object3D(); tudo.position.set(c.x, b.min.y, c.z); cena.add(tudo);
    lista.forEach(p => tudo.attach(p)); selSet = lista;
    tcM.attach(tudo);
    caixaP = new T.BoxHelper(tudo, 0x7ed957); cena.add(caixaP);
    painel();
  }
  function soltarTudo() { // devolve as peças pro grupo, já com o movimento aplicado nelas
    if (!tudo) { selSet = []; return; }
    tcM.detach();
    selSet.forEach(p => grupo.attach(p));
    cena.remove(tudo); tudo = null; selSet = [];
    if (caixaP) { cena.remove(caixaP); caixaP = null; }
  }
  function alternarNoConjunto(me) { // Shift+clique / modo Várias: põe ou tira a peça do conjunto
    const atualSel = tudo ? selSet.slice() : selP ? [selP] : [];
    const i = atualSel.indexOf(me);
    if (i >= 0) atualSel.splice(i, 1); else atualSel.push(me);
    selecionarConjunto(atualSel);
  }
  function centralizarNoChao() {
    const volta = tudo ? selSet.slice() : null; soltarTudo();
    const b = new T.Box3().setFromObject(grupo), c = b.getCenter(new T.Vector3());
    for (const p of pecas) { p.position.x -= c.x; p.position.z -= c.z; p.position.y -= b.min.y; }
    escrever(); if (volta) selecionarConjunto(volta); else painel();
  }
  function escolher(me) {
    if (tudo && me) soltarTudo();
    selP = me; if (caixaP) { cena.remove(caixaP); caixaP = null; }
    tcM.detach();
    if (me) { tcM.attach(me); caixaP = new T.BoxHelper(me, 0xffd400); cena.add(caixaP); }
    painel();
  }
  function painel(soNumeros) {
    const el = $('#modInsp'), m = lista().find(x => x.nome === atual);
    const graus = v => Math.round(v * 180 / Math.PI);
    if (soNumeros && tudo) return;
    if (soNumeros && selP && el.querySelector('[data-c="px"]')) {
      const v = { px: selP.position.x, py: selP.position.y, pz: selP.position.z, tx: selP.scale.x, ty: selP.scale.y, tz: selP.scale.z, gx: graus(selP.rotation.x), gy: graus(selP.rotation.y), gz: graus(selP.rotation.z) };
      for (const [k, val] of Object.entries(v)) { const i = el.querySelector(`[data-c="${k}"]`); if (i && document.activeElement !== i) i.value = f(val); }
      const u = (selP.scale.x + selP.scale.y + selP.scale.z) / 3, sl = el.querySelector('[data-c="uni"]'), uv = el.querySelector('.uniVal');
      if (sl && document.activeElement !== sl) sl.value = u; if (uv) uv.textContent = f(u);
      return;
    }
    if (!m) { el.innerHTML = '<h3>PEÇA</h3><p class="fraco">Crie um modelo novo na lista ao lado.</p>'; return; }
    let h = `<h3>MODELO</h3><button class="btn largo verdao" id="modJogador">🎮 Usar como jogador</button><div class="rotulo">Modelo inteiro</div><div class="tamcena"><button data-tm="0.8">➖ menor</button><button data-tm="1.25">➕ maior</button></div><label class="linha">Ele é <select id="modCat">${CATS.map(([v, t]) => `<option value="${v}" ${m.cat === v ? 'selected' : ''}>${t}</option>`).join('')}</select></label>`;
    if (tudo) h += `<h3>${ehTudo() ? `🔲 MODELO INTEIRO (${pecas.length} peças)` : `☑ ${selSet.length} PEÇAS JUNTAS`}</h3><p class="fraco">Arraste as setinhas pra mexer tudo junto.<br><b>W</b> mover · <b>E</b> girar · <b>R</b> tamanho<br>${ehTudo() ? '' : '<b>Shift+clique</b> (ou ☑ Várias) põe ou tira peças.<br>'}Clique numa peça sozinha pra voltar a mexer só nela.</p>
        <div class="botoes"><button class="btn" data-a3="giraE">↺ 90°</button><button class="btn" data-a3="giraD">↻ 90°</button>${ehTudo() ? '<button class="btn" data-a3="centro">⬇ Pôr no centro do chão</button>' : ''}</div>
        <div class="rotulo">Pintar ${ehTudo() ? 'o modelo inteiro' : 'as peças escolhidas'}</div><div class="cores">${Object.entries(FC.CORES).map(([n, cor]) => `<button data-corc="${cor}" title="${n}" style="background:${cor}"></button>`).join('')}</div>
        <div class="botoes"><button class="btn" data-a2="dup">⧉ Duplicar</button><button class="btn" data-a2="esp">🪞 ${ehTudo() ? 'Espelhar (virar do avesso)' : 'Espelhar (criar o outro lado)'}</button><button class="btn perigo" data-a2="apagar">🗑 Apagar ${ehTudo() ? 'tudo' : 'essas'}</button><button class="btn" data-a3="soltar">✖ Soltar</button></div>`;
    else if (!selP) h += `<button class="btn largo" data-a3="tudo">🔲 Selecionar o modelo inteiro</button><button class="btn largo" data-a3="copiar">⧉ Copiar este modelo (com outro nome)</button><button class="btn largo" data-a3="centro">⬇ Pôr no centro do chão</button><p class="fraco">${m.partes.length} peça(s). Clique numa peça pra mexer, ou adicione peças embaixo.<br><br><b>W</b> mover · <b>E</b> girar · <b>R</b> esticar<br><b>Del</b> apagar · <b>Ctrl+D</b> duplicar · <b>M</b> espelhar<br><b>Shift+clique</b> (ou <b>☑ Várias</b> no celular) escolhe várias peças juntas<br><br>A setinha verde no chão mostra onde é a <b>frente</b>.</p>`;
    else {
      const c = (k, v, passo) => `<input type="number" step="${passo}" data-c="${k}" value="${f(v)}">`;
      h += `<h3>${ICONE[selP.userData.forma]} ${ESCRITA[selP.userData.forma] || selP.userData.forma}</h3>
        <div class="rotulo">Posição (lado, altura, frente)</div><div class="tres">${c('px', selP.position.x, 0.05)}${c('py', selP.position.y, 0.05)}${c('pz', selP.position.z, 0.05)}</div>
        <div class="rotulo">Tamanho (largura, altura, fundura)</div><div class="tres">${c('tx', selP.scale.x, 0.05)}${c('ty', selP.scale.y, 0.05)}${c('tz', selP.scale.z, 0.05)}</div>
        <div class="rotulo">Giro em graus</div><div class="tres">${c('gx', graus(selP.rotation.x), 15)}${c('gy', graus(selP.rotation.y), 15)}${c('gz', graus(selP.rotation.z), 15)}</div>
        <div class="rotulo">Cor</div><div class="cores">${Object.entries(FC.CORES).map(([n, cor]) => `<button data-cor="${cor}" title="${n}" style="background:${cor}" class="${cor.toLowerCase() === String(selP.userData.cor).toLowerCase() ? 'sel' : ''}"></button>`).join('')}</div>
        <div class="rotulo">Tamanho de tudo junto (sem deformar)</div>
        <div class="fino"><button data-z="0.9" title="10% menor">➖</button><input type="range" min="0.02" max="3" step="0.01" data-c="uni" value="${(selP.scale.x + selP.scale.y + selP.scale.z) / 3}"><button data-z="1.1" title="10% maior">➕</button><span class="uniVal">${f((selP.scale.x + selP.scale.y + selP.scale.z) / 3)}</span></div>
        <div class="rotulo">Empurrar bem pouquinho</div>
        <div class="empurra"><button data-m="x,-1">⬅</button><button data-m="x,1">➡</button><button data-m="y,1">⬆</button><button data-m="y,-1">⬇</button><button data-m="z,1">frente</button><button data-m="z,-1">trás</button></div>
        <div class="botoes"><button class="btn" data-a2="dup">⧉ Duplicar</button><button class="btn" data-a2="esp">🪞 Espelhar</button><button class="btn perigo" data-a2="apagar">🗑 Apagar peça</button></div>`;
    }
    el.innerHTML = h;
    $('#modCat').onchange = e => { escrever(e.target.value); };
    $('#modJogador').onclick = () => usarComoJogador(m);
    el.querySelectorAll('[data-a3]').forEach(b => b.onclick = () => {
      const a = b.dataset.a3;
      if (a === 'tudo') selecionarTudo();
      else if (a === 'centro') centralizarNoChao();
      else if (a === 'soltar') { soltarTudo(); painel(); }
      else if (a === 'copiar') copiarModelo(m);
      else if (a === 'giraE' || a === 'giraD') { tudo.rotation.y += (a === 'giraE' ? 1 : -1) * Math.PI / 2; escrever(); }
    });
    el.querySelectorAll('[data-tm]').forEach(b => b.onclick = () => { // aumenta/diminui todas as peças juntas
      const k = +b.dataset.tm; const volta = tudo ? selSet.slice() : null; soltarTudo();
      for (const p of pecas) { p.position.multiplyScalar(k); p.scale.multiplyScalar(k); }
      escrever(); if (volta) selecionarConjunto(volta); else painel(true);
      const bx = new T.Box3(); pecas.forEach(p => bx.expandByObject(p)); const c = bx.getCenter(new T.Vector3()), t = bx.getSize(new T.Vector3()).length();
      const dir = camM.position.clone().sub(orbitM.target); if (dir.lengthSq() < 1e-6) dir.set(0.7, 0.5, 1); orbitM.target.copy(c); camM.position.copy(c).add(dir.setLength(Math.max(2.5, t * 1.5))); orbitM.update();
    });
    el.querySelectorAll('input[data-c]').forEach(i => i.onchange = () => {
      const v = parseFloat(i.value); if (isNaN(v)) return; const k = i.dataset.c;
      if (k[0] === 'p') selP.position[{ px: 'x', py: 'y', pz: 'z' }[k]] = v;
      if (k[0] === 't') selP.scale[{ tx: 'x', ty: 'y', tz: 'z' }[k]] = Math.max(0.02, v);
      if (k[0] === 'g') selP.rotation[{ gx: 'x', gy: 'y', gz: 'z' }[k]] = v * Math.PI / 180;
      escrever();
    });
    el.querySelectorAll('[data-cor]').forEach(b => b.onclick = () => { selP.userData.cor = b.dataset.cor; selP.material.color.set(b.dataset.cor); escrever(); painel(); });
    el.querySelectorAll('[data-corc]').forEach(b => b.onclick = () => { selSet.forEach(p => { p.userData.cor = b.dataset.corc; p.material.color.set(b.dataset.corc); }); escrever(); });
    el.querySelectorAll('[data-a2]').forEach(b => b.onclick = () => b.dataset.a2 === 'dup' ? duplicarP() : b.dataset.a2 === 'esp' ? espelharP() : apagarP());
    const uni = el.querySelector('[data-c="uni"]');
    if (uni) {
      uni.oninput = () => { const u = (selP.scale.x + selP.scale.y + selP.scale.z) / 3, v = parseFloat(uni.value); if (u > 0 && v > 0) selP.scale.multiplyScalar(v / u); painel(true); };
      uni.onchange = () => escrever();
    }
    el.querySelectorAll('[data-z]').forEach(b => b.onclick = () => { selP.scale.multiplyScalar(+b.dataset.z); selP.scale.set(...['x', 'y', 'z'].map(k => Math.max(0.01, selP.scale[k]))); escrever(); painel(true); });
    el.querySelectorAll('[data-m]').forEach(b => b.onclick = () => { const [k, d] = b.dataset.m.split(','); selP.position[k] += +d * 0.02; escrever(); painel(true); });
  }
  function textoPeca(me) {
    const p = me.position, s = me.scale, g = [me.rotation.x, me.rotation.y, me.rotation.z].map(v => Math.round(v * 180 / Math.PI));
    const tam = Math.abs(s.x - s.y) < 0.005 && Math.abs(s.x - s.z) < 0.005 ? f(s.x) : `${f(s.x)} ${f(s.y)} ${f(s.z)}`;
    return `  ${ESCRITA[me.userData.forma] || me.userData.forma} em ${f(p.x)} ${f(p.y)} ${f(p.z)} tamanho ${tam} cor ${textoCor(me.userData.cor)}` + (g.some(v => v) ? ` giro ${g.join(' ')}` : '');
  }
  function escrever(novaCat) { // reescreve o bloco "modelo X:" inteiro
    const m = lista().find(x => x.nome === atual); if (!m) return;
    const volta = tudo ? selSet.slice() : null; if (tudo) soltarTudo(); // as peças precisam estar no lugar certo antes de virar texto
    const cat = novaCat || m.cat;
    mudarTexto(L => {
      const ind = (L[m.n - 1].match(/^\s*/) || [''])[0];
      const bloco = [L[m.n - 1], ...pecas.map(p => ind + textoPeca(p))];
      if (cat !== 'solido') bloco.push(ind + '  tipo: ' + CATS.find(c => c[0] === cat)[1]);
      L.splice(m.n - 1, m.fim - m.n + 1, ...bloco); return L;
    }, false);
    if (volta) selecionarConjunto(volta); else if (novaCat) painel(); else painel(true);
    if (motor) montar();
  }
  function usarComoJogador(m) { // troca (ou cria) a linha "jogador: ..." no código
    const nome = m.cabecalho.replace(/^\s*modelo\s+/i, '').replace(/:\s*$/, '').trim();
    mudarTexto(L => {
      const i = L.findIndex(l => /^\s*jogador\s*:/i.test(l) && !/^\s*jogador\s+em/i.test(l));
      if (i >= 0) L[i] = 'jogador: ' + nome;
      else { let j = L.findIndex(l => /^\s*jogo\s*:/i.test(l)); L.splice(j + 1, 0, 'jogador: ' + nome); }
      return L;
    }, false);
    if (motor) montar();
    IDE().saida(`🎮 Pronto! Agora o jogador é o modelo "${nome}". Aperte ▶ pra jogar com ele.`, 'ok');
  }
  function novaPeca(forma, pos, tam, cor) {
    const me = new T.Mesh(MODELOS.geoForma(forma), new T.MeshStandardMaterial({ color: cor, roughness: 0.7 }));
    me.userData = { forma, cor }; me.position.copy(pos); me.scale.copy(tam);
    grupo.add(me); pecas.push(me); return me;
  }
  function adicionarOlhos() { // dois olhos prontos na frente da peça escolhida (a cabeça)
    const base = selP;
    const c = base ? base.position.clone() : new T.Vector3(0, 1, 0);
    const s = base ? base.scale.clone() : new T.Vector3(0.6, 0.6, 0.6);
    const d = Math.min(s.x, s.y, s.z) * 0.3;               // tamanho do olho branco
    const redondo = base && base.userData.forma === 'bola';
    const z = c.z + s.z * (redondo ? 0.42 : 0.5) - d * 0.2; // encostado na frente
    const y = c.y + s.y * 0.12, dx = s.x * 0.2;
    let ultimo;
    for (const lado of [-1, 1]) {
      novaPeca('bola', new T.Vector3(c.x + lado * dx, y, z), new T.Vector3(d, d, d), '#ffffff');
      ultimo = novaPeca('bola', new T.Vector3(c.x + lado * dx, y, z + d * 0.38), new T.Vector3(d * 0.5, d * 0.5, d * 0.5), '#1a1a1a');
    }
    escolher(ultimo); escrever();
    IDE().saida(base ? '👀 Pus 2 olhos na frente da peça escolhida' : '👀 Pus 2 olhos (dica: escolha a cabeça antes, aí eles vão certinho pra ela)', 'ok');
  }
  function copiaEspelhada(p) {
    const me = p.clone(); me.material = p.material.clone(); me.userData = { ...p.userData };
    me.position.x = -p.position.x; me.rotation.y = -p.rotation.y; me.rotation.z = -p.rotation.z;
    grupo.add(me); pecas.push(me); return me;
  }
  function espelharP() { // peça: cria o outro lado · conjunto: cria o outro lado de todas · modelo inteiro: vira do avesso
    if (tudo) {
      const lista = selSet.slice(), inteiro = ehTudo(); soltarTudo();
      if (inteiro) { // vira o modelo do avesso (o lado direito vira o esquerdo)
        lista.forEach(p => { p.position.x = -p.position.x; p.rotation.y = -p.rotation.y; p.rotation.z = -p.rotation.z; });
        escrever(); selecionarConjunto(lista); IDE().saida('🪞 Virei o modelo do avesso', 'ok'); return;
      }
      const doLado = lista.filter(p => Math.abs(p.position.x) >= 0.01);
      if (!doLado.length) { selecionarConjunto(lista); IDE().saida('Essas peças estão bem no meio — mova pro lado antes de espelhar'); return; }
      const novas = doLado.map(copiaEspelhada);
      escrever(); selecionarConjunto(novas); IDE().saida(`🪞 Criei o outro lado (${novas.length} peças)`, 'ok'); return;
    }
    if (!selP) return;
    if (Math.abs(selP.position.x) < 0.01) { IDE().saida('Essa peça está bem no meio — mova ela pro lado antes de espelhar'); return; }
    const me = copiaEspelhada(selP); escolher(me); escrever();
  }
  function adicionarP(forma) {
    if (!atual) return novo();
    if (forma === 'olhos') return adicionarOlhos();
    const me = new T.Mesh(MODELOS.geoForma(forma), new T.MeshStandardMaterial({ color: '#43a047', roughness: 0.7 }));
    me.userData = { forma, cor: '#43a047' }; me.position.set(0, 0.5 + pecas.length * 0.05, 0); me.scale.set(0.5, 0.5, 0.5);
    grupo.add(me); pecas.push(me); escolher(me); escrever();
  }
  function duplicarP() {
    if (tudo) { // duplica o conjunto todo, um pouco pro lado
      const lista = selSet.slice(), inteiro = ehTudo(); soltarTudo();
      const b = new T.Box3(); lista.forEach(p => b.expandByObject(p));
      const passo = inteiro ? b.getSize(new T.Vector3()).x + 0.2 : 0.4;
      const novas = lista.map(p => { const me = p.clone(); me.material = p.material.clone(); me.userData = { ...p.userData }; me.position.x += passo; grupo.add(me); pecas.push(me); return me; });
      escrever(); selecionarConjunto(novas); return;
    }
    if (!selP) return;
    const me = selP.clone(); me.material = selP.material.clone(); me.userData = { ...selP.userData }; me.position.x += 0.3;
    grupo.add(me); pecas.push(me); escolher(me); escrever();
  }
  function apagarP() {
    if (tudo) { const lista = selSet.slice(); soltarTudo(); lista.forEach(p => grupo.remove(p)); pecas = pecas.filter(p => !lista.includes(p)); escolher(null); escrever(); return; }
    if (!selP) return;
    grupo.remove(selP); pecas = pecas.filter(p => p !== selP); escolher(null); escrever();
  }
  async function copiarModelo(m) { // cria um modelo novo igualzinho, com outro nome
    const velho = m.cabecalho.replace(/^\s*modelo\s+/i, '').replace(/:\s*$/, '').trim();
    const n = await IDE().pedirNome('Nome da cópia do modelo:', velho + '_2'); if (!n) return;
    const nomeTexto = n.trim().replace(/\s+/g, '_'), nome = FC.semAcento(nomeTexto).replace(/[^a-z0-9_]/g, ''); if (!nome) return;
    if (lista().some(x => x.nome === nome)) { IDE().saida(`Já existe um modelo chamado "${nomeTexto}"`); return; }
    mudarTexto(L => {
      const bloco = L.slice(m.n - 1, m.fim); bloco[0] = bloco[0].replace(/^(\s*modelo\s+)[^:]+/i, '$1' + nomeTexto);
      while (L.length && !L[L.length - 1].trim()) L.pop(); L.push('', ...bloco); return L;
    }, false);
    atual = nome; recarregar(); IDE().saida(`⧉ Criei o modelo "${nomeTexto}", igualzinho ao "${velho}"`, 'ok');
  }
  async function novo() {
    const n = await IDE().pedirNome('Nome do modelo novo (ex: robô, carro, árvore mágica):', 'boneco'); if (!n) return;
    const nome = FC.semAcento(n.trim().replace(/\s+/g, '_')).replace(/[^a-z0-9_]/g, ''); if (!nome) return;
    mudarTexto(L => { while (L.length && !L[L.length - 1].trim()) L.pop(); L.push('', `modelo ${n.trim().replace(/\s+/g, '_')}:`); return L; }, false);
    atual = nome; recarregar();
  }
  window.__escolherPeca = i => escolher(pecas[i]);
  window.__alternarPeca = i => alternarNoConjunto(pecas[i]);
  return { abrir() { if (iniciar()) { recarregar(); ajustar(); } }, recarregar: () => { if (iniciado) recarregar(); } };
})();

window.FrogCena = {
  abrirCena() { if (iniciarCena()) { montar(); motor.ajustar(); $('#cenaCv').focus(); } },
  abrirModelos() { modelos.abrir(); },
  codigoMudou() { desfazer = []; },
  _teste: () => ({ motor, selecionar, confirmar, adicionar, fixar, duplicar, apagar, sel: () => sel, modelos }),
};
})();
