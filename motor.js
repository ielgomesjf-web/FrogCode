// Motor do FrogCode: pega o programa entendido pela linguagem e roda o jogo em 3D (ou 2D).
(function (G) {
'use strict';
const T = G.THREE, FC = G.FrogCode, { M, bloco, mat } = G.MODELOS;
const V = (x = 0, y = 0, z = 0) => new T.Vector3(x, y, z);
const rand = (a, b) => a + Math.random() * (b - a);
const clamp = (v, a, b) => Math.max(a, Math.min(b, v));

// ---------------- sons (feitos na hora, sem arquivo) ----------------
let AC = null;
function audio() { try { if (!AC) AC = new (G.AudioContext || G.webkitAudioContext)(); if (AC.state === 'suspended') AC.resume(); } catch (e) { } return AC; }
function bip(f1, f2, dur, tipo = 'square', vol = 0.1, atraso = 0) {
  const a = audio(); if (!a) return;
  const t = a.currentTime + atraso, o = a.createOscillator(), g = a.createGain();
  o.type = tipo; o.frequency.setValueAtTime(f1, t); o.frequency.exponentialRampToValueAtTime(Math.max(f2, 20), t + dur);
  g.gain.setValueAtTime(vol, t); g.gain.exponentialRampToValueAtTime(0.001, t + dur);
  o.connect(g).connect(a.destination); o.start(t); o.stop(t + dur + 0.02);
}
function ruido(dur, vol = 0.25) {
  const a = audio(); if (!a) return;
  const n = Math.floor(a.sampleRate * dur), b = a.createBuffer(1, n, a.sampleRate), d = b.getChannelData(0);
  for (let i = 0; i < n; i++) d[i] = (Math.random() * 2 - 1) * Math.pow(1 - i / n, 2);
  const s = a.createBufferSource(), g = a.createGain(); g.gain.value = vol; s.buffer = b; s.connect(g).connect(a.destination); s.start();
}
const SOM = {
  moeda: () => { bip(988, 988, 0.07, 'square', 0.08); bip(1319, 1319, 0.2, 'square', 0.08, 0.07); },
  pulo: () => bip(260, 640, 0.16, 'square', 0.06),
  tiro: () => bip(900, 140, 0.14, 'sawtooth', 0.06),
  explosao: () => ruido(0.4),
  dano: () => { bip(300, 90, 0.25, 'sawtooth', 0.1); ruido(0.15, 0.12); },
  perdeu: () => bip(440, 70, 0.8, 'triangle', 0.22),
  ganhou: () => [523, 659, 784, 1047].forEach((f, i) => bip(f, f, 0.22, 'square', 0.08, i * 0.11)),
  poder: () => [400, 600, 800, 1000, 1300].forEach((f, i) => bip(f, f * 1.1, 0.08, 'square', 0.06, i * 0.05)),
  objetivo: () => [660, 880, 1320].forEach((f, i) => bip(f, f, 0.15, 'triangle', 0.15, i * 0.09)),
};

function fmt(v) {
  if (typeof v === 'number') return Number.isInteger(v) ? String(v) : String(Math.round(v * 10) / 10);
  if (typeof v === 'boolean') return v ? 'sim' : 'não';
  return String(v);
}
function nomeTecla(e) {
  let m;
  if ((m = /^Key([A-Z])$/.exec(e.code))) return m[1].toLowerCase();
  if ((m = /^(?:Digit|Numpad)(\d)$/.exec(e.code))) return m[1];
  const k = e.key.toLowerCase();
  return ({ arrowleft: 'esquerda', arrowright: 'direita', arrowup: 'cima', arrowdown: 'baixo', ' ': 'espaco', control: 'ctrl', escape: 'esc' })[k] || FC.semAcento(k);
}
function texturaChao(cor, w, d) {
  const c = document.createElement('canvas'); c.width = c.height = 128;
  const g = c.getContext('2d'); g.fillStyle = cor; g.fillRect(0, 0, 128, 128);
  for (let i = 0; i < 260; i++) {
    g.fillStyle = Math.random() < 0.5 ? 'rgba(0,0,0,0.06)' : 'rgba(255,255,255,0.07)';
    const s = 2 + Math.random() * 5; g.fillRect(Math.random() * 128, Math.random() * 128, s, s);
  }
  g.strokeStyle = 'rgba(0,0,0,0.07)'; g.lineWidth = 2; g.strokeRect(0, 0, 128, 128);
  const t = new T.CanvasTexture(c); t.wrapS = t.wrapT = T.RepeatWrapping; t.repeat.set(w / 4, d / 4);
  t.encoding = T.sRGBEncoding; t.anisotropy = 4;
  return t;
}
const PONTOS_DE = { moeda: 1, estrela: 5, gema: 3, chave: 0, coracao: 0 };

class Motor {
  constructor(canvas, hud, opts = {}) {
    this.cv = canvas; this.hud = hud; this.opts = opts;
    this.r = new T.WebGLRenderer({ canvas, antialias: true });
    this.r.setPixelRatio(Math.min(G.devicePixelRatio || 1, 1.5));
    this.r.shadowMap.enabled = true; this.r.shadowMap.type = T.PCFSoftShadowMap;
    this.r.outputEncoding = T.sRGBEncoding;
    this.persp = new T.PerspectiveCamera(60, 1, 0.1, 800);
    this.orto = new T.OrthographicCamera(-1, 1, 1, -1, 0.1, 800);
    this.cam = this.persp; this.aspect = 1;
    this.teclas = new Set(); this.yaw = 0; this.pitch = 0.38; this.olhar = 0;
    this.cena = null; this.rodando = false; this.hudTxt = '';
    if (!opts.editor) this.entrada();
    this.ultimo = performance.now();
    const laco = t => {
      const dt = Math.max(0, Math.min((t - this.ultimo) / 1000, 0.05)); this.ultimo = Math.max(this.ultimo, t);
      if (this.cena && this.cv.offsetParent !== null) {
        if (opts.editor) { opts.antes?.(); this.r.render(this.cena, opts.camera()); }
        else {
          try { if (this.rodando && !this.fim) this.atualizar(dt); this.atualizarCamera(dt); this.desenharHud(); }
          catch (e) { this.falhar(e); }
          this.r.render(this.cena, this.cam);
        }
      }
      requestAnimationFrame(laco);
    };
    requestAnimationFrame(laco);
    new ResizeObserver(() => this.ajustar()).observe(canvas.parentElement);
    this.ajustar();
  }
  ajustar() {
    const p = this.cv.parentElement, w = p.clientWidth, h = p.clientHeight;
    if (!w || !h) return;
    this.r.setSize(w, h, false); this.aspect = w / h;
    this.persp.aspect = this.aspect; this.persp.updateProjectionMatrix();
    this.opts.aoAjustar?.(w, h);
  }
  // modo editor: monta o mundo parado (sem rodar o jogo), com sorteio sempre igual
  montarEditor(prog) {
    const r0 = Math.random; let sem = 20261110;
    Math.random = () => { sem |= 0; sem = sem + 0x6D2B79F5 | 0; let t = Math.imul(sem ^ sem >>> 15, 1 | sem); t = t + Math.imul(t ^ t >>> 7, 61 | t) ^ t; return ((t ^ t >>> 14) >>> 0) / 4294967296; };
    try { this.prog = prog; this.modoEditor = true; this.recomecar(); } finally { Math.random = r0; }
  }
  alturaSem(x, z, o) { // chão embaixo, sem contar o próprio objeto
    let h = null;
    for (const s of this.solidos) if (s !== o.aabb && !(o.deAte && s.obj && s.obj.linha === o.linha) && x >= s.min.x && x <= s.max.x && z >= s.min.z && z <= s.max.z) h = h === null ? s.max.y : Math.max(h, s.max.y);
    return h;
  }
  entrada() {
    const cv = this.cv;
    cv.addEventListener('keydown', e => {
      const k = nomeTecla(e);
      if (!this.teclas.has(k)) this.apertou(k);
      this.teclas.add(k);
      if (!e.ctrlKey && !e.metaKey && k !== 'f5') e.preventDefault();
    });
    cv.addEventListener('keyup', e => this.teclas.delete(nomeTecla(e)));
    cv.addEventListener('blur', () => { if (!this.manterTeclas) this.teclas.clear(); });
    cv.style.touchAction = 'none';
    // mouse e dedo: arrastar na tela gira a câmera
    cv.addEventListener('pointerdown', e => {
      if (this.dedo != null && e.pointerType === 'touch') return; // já tem um dedo girando
      cv.focus(); audio();
      this.dedo = e.pointerId; this.arrastando = true; this.mx = e.clientX; this.my = e.clientY;
      if (e.pointerType === 'mouse' && this.cfg && this.cfg.camera.cam === 'primeira' && this.rodando && !this.fim) cv.requestPointerLock?.();
    });
    const soltar = e => { if (e.pointerId === this.dedo) { this.dedo = null; this.arrastando = false; } };
    G.addEventListener('pointerup', soltar); G.addEventListener('pointercancel', soltar);
    G.addEventListener('pointermove', e => {
      let dx, dy;
      if (document.pointerLockElement === cv) { dx = e.movementX; dy = e.movementY; }
      else if (this.arrastando && e.pointerId === this.dedo) { dx = e.clientX - this.mx; dy = e.clientY - this.my; this.mx = e.clientX; this.my = e.clientY; }
      else return;
      const k = e.pointerType === 'touch' ? 1.6 : 1;
      this.yaw -= dx * 0.006 * k;
      this.pitch = clamp(this.pitch + dy * 0.004 * k, -0.15, 1.35);
      this.olhar = clamp(this.olhar - dy * 0.004 * k, -1.4, 1.4);
    });
  }
  apertou(k) {
    if (this.fim && !this.fim.erro && k === 'r') { this.recomecar(); return; }
    if (this.rodando && !this.fim) this.disparar('apertar', k);
  }

  // ---------------- começar / parar ----------------
  carregar(prog) {
    this.prog = prog;
    try { this.recomecar(); } catch (e) { this.falhar(e); }
    this.cv.focus();
  }
  parar() {
    this.rodando = false; this.cena = null; this.prog = null; this.hud.innerHTML = ''; this.hudTxt = '';
    if (document.pointerLockElement) document.exitPointerLock();
    this.r.setClearColor('#0b0e12'); this.r.clear();
  }
  recomecar() {
    if (this.cena) this.cena.traverse(o => { if (o.geometry) o.geometry.dispose(); });
    const c = this.cfg = {
      modo: '3d', ceu: FC.CEUS.dia, ceuPreset: 'dia', luz: null, grav: 20,
      chao: { mat: 'grama', cor: FC.MATERIAIS.grama, w: null, d: null, nenhum: false },
      jog: { modelo: 'sapo', emoji: null, cor: null, tamanho: 1 },
      camera: null, mostrar: null, inim: { comp: 'segue', vel: 2.5 }, vel: 5, pulo: 1.5,
    };
    this.vars = new Map([['pontos', 0], ['vidas', 3], ['tempo', 0]]);
    this.objs = []; this.solidos = []; this.eventos = []; this.objetivos = []; this.tarefas = [];
    this.pegos = {}; this.derrot = {}; this.marcos = new Set(); this.contatos = new Set();
    this.estadoEv = new Map(); this.tempo = 0; this.fim = null; this.msg = null; this.tremor = 0;
    this.semVidasFeito = false; this.querRecomecar = false; this.camPos = null; this.camAlvo = null;
    this.yaw = 0; this.pitch = 0.38; this.olhar = 0; this.ops = 0; this.linha = 0; this.fase = 'setup';
    this.cena = new T.Scene(); this.jog = null;
    const corpo = this.prog.corpo;
    for (const n of corpo) n._topo = true;
    this.inicioLinha = 0;

    this.modelos = new Map(); this.ensinados = new Map(); this.quadro = 0; this.dtAtual = 1 / 60; this.toques = new Map(); this.pilha = 0;
    for (const n of corpo) {
      if (n.tipo === 'modelo') this.modelos.set(n.nome, n);
      if (n.tipo === 'ensinar') this.ensinados.set(n.nome, n);
    }
    for (const n of corpo) if (n.cfg) { this.linha = n.n; this.aplicar(n, {}); }
    for (const n of corpo) if (n.tipo === 'evento') this.eventos.push(n);
    if (!c.camera) c.camera = { cam: c.modo === 'lado' ? 'lado' : c.modo === 'cima' ? 'cima' : 'atras', dist: null };
    if (c.camera.dist == null) c.camera.dist = { atras: 6, cima: 12, lado: 8, primeira: 0, fixa: 0 }[c.camera.cam];
    if (!c.mostrar) c.mostrar = ['pontos', 'vidas'];
    if (c.modo === 'lado') { c.chao.w = c.chao.w || 60; c.chao.d = 4; }
    else { c.chao.w = c.chao.w || 40; c.chao.d = c.chao.d || c.chao.w; }
    this.objetivos.sort((a, b) => (a.num || 99) - (b.num || 99));
    this.objetivos.forEach((o, i) => { o.idx = i + 1; o.feito = false; o.ini = null; });

    this.montarMundo();
    this.inicio = V(0, Math.max(0, this.alturaEm(0, 0) ?? 0), 0);
    this.criarJogador();
    this.jog.inv = 2; // 2 segundos de proteção no começo
    this.rodando = true;
    this.iniciarTarefa(corpo.filter(n => !n.cfg && !['evento', 'modelo', 'ensinar'].includes(n.tipo)), {});
    this.fase = 'jogo';
    if (this.modoEditor) { this.tarefas = []; this.rodando = false; return; }
    this.disparar('comecar');
  }

  // ---------------- mundo ----------------
  montarMundo() {
    const c = this.cfg, cena = this.cena;
    const tam = Math.max(c.chao.w, c.chao.d);
    cena.background = new T.Color(c.ceu);
    cena.fog = new T.Fog(c.ceu, tam * 0.8 + 25, tam * 2.2 + 80);
    const preset = c.luz || ({ noite: 'noite', tarde: 'tarde', 'por do sol': 'tarde' })[c.ceuPreset] || 'dia';
    const L = {
      dia: ['#ffffff', '#5d7a3a', 0.75, '#fff4e0', 1.0], forte: ['#ffffff', '#5d7a3a', 0.9, '#ffffff', 1.3],
      tarde: ['#ffd2a8', '#6a4a3a', 0.6, '#ffb070', 0.95], 'por do sol': ['#ffd2a8', '#6a4a3a', 0.6, '#ffb070', 0.95],
      noite: ['#5a6aa8', '#1a1a2a', 0.35, '#9fb4ff', 0.4], fraca: ['#aaaaaa', '#444444', 0.4, '#ffffff', 0.4],
    }[preset];
    cena.add(new T.HemisphereLight(L[0], L[1], L[2]));
    const sol = new T.DirectionalLight(L[3], L[4]);
    sol.position.set(tam * 0.35, 30, tam * 0.25); sol.castShadow = true;
    sol.shadow.mapSize.set(1024, 1024); sol.shadow.bias = -0.0006;
    const s = tam / 2 + 6; Object.assign(sol.shadow.camera, { left: -s, right: s, top: s, bottom: -s, near: 1, far: 140 });
    cena.add(sol);
    if (preset === 'noite') {
      const pts = []; for (let i = 0; i < 600; i++) { const v = V(rand(-1, 1), rand(0.05, 1), rand(-1, 1)).normalize().multiplyScalar(300); pts.push(v.x, v.y, v.z); }
      const geo = new T.BufferGeometry(); geo.setAttribute('position', new T.Float32BufferAttribute(pts, 3));
      cena.add(new T.Points(geo, new T.PointsMaterial({ color: '#ffffff', size: 1.4, fog: false })));
    }
    if (!c.chao.nenhum) {
      const { w, d } = c.chao;
      const topo = new T.MeshStandardMaterial({ map: texturaChao(c.chao.cor, w, d), roughness: 0.95 });
      const lado = mat(c.chao.mat === 'neve' || c.chao.mat === 'gelo' ? '#9fb3c8' : '#6d4c33');
      const m = new T.Mesh(new T.BoxGeometry(w, 1, d), [lado, lado, topo, lado, lado, lado]);
      m.position.y = -0.5; m.receiveShadow = true; cena.add(m);
      this.solidos.push({ min: V(-w / 2, -1, -d / 2), max: V(w / 2, 0, d / 2), chao: true });
    }
  }
  alturaEm(x, z) { // topo do que estiver embaixo desse ponto (null = nada)
    let h = null;
    for (const s of this.solidos) if (x >= s.min.x && x <= s.max.x && z >= s.min.z && z <= s.max.z) h = h === null ? s.max.y : Math.max(h, s.max.y);
    return h;
  }
  posMundo(n) {
    if (this.cfg.modo === 'lado') return n.length === 3 ? V(n[0], n[1], n[2]) : V(n[0], n[1], 0);
    if (n.length === 3) return V(n[0], n[1], n[2]);
    return V(n[0], Math.max(0, this.alturaEm(n[0], n[1]) ?? 0), n[1]);
  }
  lugarAleatorio(cat) {
    const c = this.cfg, w = c.chao.w, d = c.chao.d; let p;
    for (let k = 0; k < 40; k++) {
      if (c.modo === 'lado') {
        const x = rand(-w / 2 + 2, w / 2 - 2), h = this.alturaEm(x, 0) ?? 0;
        p = V(x, cat === 'coletavel' ? h + rand(0.2, 2) : h, 0);
      } else {
        const x = rand(-w / 2 + 1.5, w / 2 - 1.5), z = rand(-d / 2 + 1.5, d / 2 - 1.5);
        p = V(x, this.alturaEm(x, z) ?? 0, z);
      }
      const min = cat === 'inimigo' || cat === 'perigo' ? 8 : 4;
      const longe = this.jog ? Math.hypot(p.x - this.inicio.x, p.z - this.inicio.z) > min && Math.hypot(p.x - this.jog.pos.x, p.z - this.jog.pos.z) > min - 1 : true;
      const livre = cat === 'coletavel' || p.y < 0.05;
      if (longe && livre) break;
    }
    return p;
  }
  modeloDoJogador() {
    const j = this.cfg.jog;
    if (j.modelo === 'emoji') return M.emoji(null, j.emoji);
    if (j.modelo.startsWith('modelo:')) {
      const md = this.modelos.get(j.modelo.slice(7));
      if (!md) throw this.erroAqui('Não achei o modelo ' + j.modelo.slice(7));
      return MODELOS.montar(md.partes);
    }
    return M[j.modelo](j.cor || undefined);
  }
  criarJogador() {
    const j = this.cfg.jog, s = j.tamanho || 1;
    const mod = this.modeloDoJogador();
    mod.g.scale.setScalar(s);
    const fora = new T.Group(); fora.add(mod.g); fora.position.copy(this.inicio);
    this.cena.add(fora);
    this.jog = { g: fora, dentro: mod.g, pos: fora.position, vel: V(), emp: V(), hw: mod.caixa[0] / 2 * s * 0.85, h: mod.caixa[1] * s, noChao: false, inv: 0, rotAlvo: this.cfg.modo === 'lado' ? Math.PI / 2 : Math.PI };
    fora.rotation.y = this.jog.rotAlvo;
    // o jogador também é um objeto: jogador.x, jogador.vida, mover jogador...
    this.jogObj = { nome: 'jogador', tipo: 'jogador', cat: 'jogador', g: fora, vivo: true, props: {}, ehJogador: true, corBase: mod.cor, escala: s };
    fora.userData.obj = this.jogObj;
  }
  trocarModelo() {
    const j = this.jog, c = this.cfg.jog, s = c.tamanho || 1;
    const mod = this.modeloDoJogador();
    this.jogObj.corBase = mod.cor; this.jogObj.escala = s;
    mod.g.scale.setScalar(s);
    j.g.remove(j.dentro); j.g.add(mod.g); j.dentro = mod.g;
    j.hw = mod.caixa[0] / 2 * s * 0.85; j.h = mod.caixa[1] * s;
  }
  levarJogador(p) { if (!this.jog) return; this.jog.pos.copy(p); this.jog.vel.set(0, 0, 0); this.jog.emp.set(0, 0, 0); }

  // ---------------- coisas ----------------
  criar(n, ctx) {
    const qtd = clamp(Math.round(n.qtdE ? this.num(this.val(n.qtdE, ctx)) : n.qtd), 0, 500);
    const s = n.tamanho ? Math.max(0.05, this.num(this.val(n.tamanho, ctx))) : 1;
    const tam3 = n.tam3 ? n.tam3.map(e => Math.max(0.05, this.num(this.val(e, ctx)))) : null;
    if (n.de && n.ate) { this.linhaDeBlocos(n, s, ctx); return; }
    const lit = e => e && (e.t === 'val' || (e.t === 'neg' && e.a.t === 'val'));
    const md = n.coisa.startsWith('modelo:') ? this.modelos.get(n.coisa.slice(7)) : null;
    const catBase = n.cat || (n.coisa === 'emoji' ? 'coletavel' : md ? md.cat : FC.COISAS[n.coisa]);
    const criados = [];
    for (let k = 0; k < qtd; k++) {
      let p, giro = null;
      if (n.frente) {
        const a = this.um(n.frente, ctx), f = this.frente(a);
        p = a.g.position.clone().add(f.multiplyScalar(1.2 + (a.ehJogador ? this.jog.hw : 0))); p.y += a.ehJogador ? this.jog.h * 0.45 : 0.3;
        giro = a.g.rotation.y;
      } else if (n.emcima) {
        const a = this.um(n.emcima, ctx); p = a.g.position.clone(); p.y += this.alturaObj(a) + 0.05;
      } else if (n.pos) { p = this.posMundo(n.pos.map(e => this.num(this.val(e, ctx)))); p.x += k * 1.3; }
      else if (n.perto && this.jog) {
        const a = rand(0, Math.PI * 2), r = rand(3, 7), j = this.jog.pos;
        p = this.cfg.modo === 'lado' ? V(j.x + (Math.random() < 0.5 ? -r : r), j.y + 0.5, 0) : V(j.x + Math.cos(a) * r, 0, j.z + Math.sin(a) * r);
        if (this.cfg.modo !== 'lado') p.y = Math.max(0, this.alturaEm(p.x, p.z) ?? 0);
      } else p = this.lugarAleatorio(catBase);
      const y0 = p.y;
      const o = this.novaCoisa(n.coisa, n.emoji, p, s, n.cor, n.comp, !!n.pos && this.cfg.modo !== 'lado' && n.pos.length === 2, { md, cat: n.cat, tam3, giro, voando: !!n.frente });
      // pro editor: de qual linha veio e se dá pra arrastar
      o.linha = n.n; o.no = n; o.y0 = y0; o.sCodigo = s; o.escalaIni = o.g.scale.x; o.giroIni = o.g.rotation.y; o.formaTam = tam3 || [s, s, s];
      o.editavel = !!n._topo && !n.qtdE && n.qtd === 1 && (!n.pos || n.pos.every(lit)) && !n.frente && !n.emcima && !n.perto && (!n.tamanho || lit(n.tamanho));
      o.multi = !!n._topo && !n.qtdE && n.qtd > 1 && !n.pos;
      o.nome = n.nome || null;
      if (n.giro) this.setProp(o, 'giro', this.num(this.val(n.giro, ctx)));
      for (const [p2, e] of n.props || []) this.setProp(o, p2, this.val(e, ctx));
      criados.push(o);
    }
    return criados;
  }
  novaCoisa(tipo, emoji, pos, s, cor, comp, yAuto, x = {}) {
    const lado = this.cfg.modo === 'lado';
    const cat = x.cat || (tipo === 'emoji' ? 'coletavel' : x.md ? x.md.cat : FC.COISAS[tipo]);
    let mod;
    if (tipo === 'emoji') { mod = M.emoji(null, emoji); mod.g.scale.setScalar(s); mod.raio = 0.45 * s; mod.caixa = [0.8 * s, s, 0.8 * s]; }
    else if (x.md) { mod = MODELOS.montar(x.md.partes); mod.g.scale.setScalar(s); mod.raio *= s; mod.caixa = mod.caixa.map(v => v * s); }
    else if (FC.FORMAS.includes(tipo)) mod = MODELOS.forma(tipo, cor || '#9e9e9e', x.tam3 || [s, s, s]);
    else if (tipo === 'plataforma') { mod = bloco(3 * s, 0.4, lado ? 3 : 3 * s, cor || '#8d6e63', '#66bb6a'); if (yAuto) pos.y = 1.5; pos.y -= 0.4; }
    else if (tipo === 'parede') mod = bloco(3 * s, 2, 0.4, cor || '#90a4ae', '#b0bec5');
    else {
      mod = M[tipo](cor || undefined);
      mod.g.scale.setScalar(s); mod.raio *= s;
      if (mod.caixa) mod.caixa = mod.caixa.map(v => v * s);
    }
    const g = mod.g; g.position.copy(pos);
    if (cat === 'solido' && !lado && ['arvore', 'pinheiro', 'pedra'].includes(tipo)) g.rotation.y = rand(0, 6.28);
    if ((cat === 'inimigo' && !x.md) || tipo === 'bandeira') g.rotation.y = lado ? -Math.PI / 2 : rand(0, 6.28);
    if (x.giro != null) g.rotation.y = x.giro;
    this.cena.add(g);
    const tipoFinal = tipo === 'emoji' ? 'emoji:' + emoji : x.md ? x.md.nome : tipo;
    const o = { tipo: tipoFinal, cat, g, raio: mod.raio, vivo: true, fase: rand(0, 6), props: {}, corBase: mod.cor || cor, escala: 1, caixaBase: mod.caixa ? mod.caixa.slice() : null, voando: x.voando };
    o.altura = mod.caixa ? mod.caixa[1] : mod.raio * 2;
    if (cat === 'coletavel' && !x.voando) { g.position.y += 0.6; o.base = g.position.y; }
    if (cat === 'solido' && mod.caixa) {
      const [w, h, d] = mod.caixa;
      o.aabb = { min: V(pos.x - w / 2, pos.y, pos.z - d / 2), max: V(pos.x + w / 2, pos.y + h, pos.z + d / 2), obj: o };
      this.solidos.push(o.aabb);
    }
    if (cat === 'perigo') { const [w, h, d] = mod.caixa || [1, 1, 1]; o.caixa = { min: V(pos.x - w / 2, pos.y, pos.z - d / 2), max: V(pos.x + w / 2, pos.y + h, pos.z + d / 2) }; }
    if (cat === 'inimigo') {
      const c = mod.caixa || [0.8, 0.9, 0.8];
      o.corpo = { pos: g.position, vel: V(), hw: c[0] / 2 * 0.9, h: c[1], noChao: false };
      o.comp = comp || this.cfg.inim.comp; o.dir = rand(0, 6.28); o.troca = rand(1, 3);
      if (lado) o.dir = Math.random() < 0.5 ? Math.PI / 2 : -Math.PI / 2;
    }
    g.userData.obj = o;
    this.objs.push(o);
    return o;
  }
  linhaDeBlocos(n, s, ctx) {
    const a = n.de.map(e => this.num(this.val(e, ctx))), b = n.ate.map(e => this.num(this.val(e, ctx)));
    const cor = n.cor || (n.coisa === 'parede' ? '#90a4ae' : '#a1887f');
    const add = (cx, cy, cz, w, h, d) => {
      const mod = bloco(w, h, d, cor, n.coisa === 'parede' ? '#b0bec5' : '#66bb6a');
      mod.g.position.set(cx, cy, cz); this.cena.add(mod.g);
      const o = { tipo: n.coisa, cat: 'solido', g: mod.g, raio: Math.max(w, d) / 2, vivo: true };
      o.aabb = { min: V(cx - w / 2, cy, cz - d / 2), max: V(cx + w / 2, cy + h, cz + d / 2), obj: o };
      this.solidos.push(o.aabb); this.objs.push(o);
      o.linha = n.n; o.deAte = !!n._topo; mod.g.userData.obj = o;
    };
    if (this.cfg.modo === 'lado') {
      const len = Math.hypot(b[0] - a[0], b[1] - a[1]), passos = Math.max(1, Math.round(len / s));
      for (let i = 0; i <= passos; i++) { const t = i / passos; add(a[0] + (b[0] - a[0]) * t, a[1] + (b[1] - a[1]) * t, 0, s, s, 3); }
      return;
    }
    const h = 2 * s, y = 0;
    if (a[0] === b[0] || a[1] === b[1]) {
      const w = Math.abs(b[0] - a[0]) + 0.4, d = Math.abs(b[1] - a[1]) + 0.4;
      add((a[0] + b[0]) / 2, y, (a[1] + b[1]) / 2, w, h, d);
    } else {
      const len = Math.hypot(b[0] - a[0], b[1] - a[1]), passos = Math.ceil(len / 0.5);
      for (let i = 0; i <= passos; i++) { const t = i / passos; add(a[0] + (b[0] - a[0]) * t, y, a[1] + (b[1] - a[1]) * t, 0.55, h, 0.55); }
    }
  }
  removerObj(o) {
    if (!o.vivo) return;
    o.vivo = false; this.cena.remove(o.g);
    if (o.aabb) { const i = this.solidos.indexOf(o.aabb); if (i >= 0) this.solidos.splice(i, 1); }
  }

  // ---------------- controle total: objetos pelo nome ----------------
  grupo(alvo, ctx) {
    if (alvo === 'isso' || alvo === 'aquilo') {
      const o = ctx[alvo];
      if (!o) throw this.erroAqui(alvo === 'isso' ? '"isso" só existe dentro de "para cada", "quando pegar/tocar/derrotar" ou "quando X tocar Y"' : '"aquilo" só existe dentro de "quando X tocar Y"');
      return o.vivo ? [o] : [];
    }
    if (alvo === 'jogador') return [this.jogObj];
    return this.objs.filter(o => o.vivo && (o.nome === alvo || o.tipo === alvo));
  }
  um(alvo, ctx) {
    const g = this.grupo(alvo, ctx);
    if (!g.length) throw this.erroAqui(`Não tem nenhum "${alvo}" no jogo agora (já foi removido ou ainda não foi criado). Dica: use "se existe ${alvo}:" antes`);
    return g[0];
  }
  frente(o) {
    const r = o.g.rotation.y;
    return V(Math.sin(r), 0, Math.cos(r));
  }
  direcao(o, dir) {
    const f = this.frente(o), lado = this.cfg.modo === 'lado';
    switch (dir) {
      case 'frente': return f;
      case 'tras': return f.negate();
      case 'cima': return V(0, 1, 0);
      case 'baixo': return V(0, -1, 0);
      case 'esquerda': return lado ? V(-1, 0, 0) : V(f.z, 0, -f.x);
      case 'direita': return lado ? V(1, 0, 0) : V(-f.z, 0, f.x);
    }
  }
  alturaObj(o) { return o.ehJogador ? this.jog.h : (o.altura || 1) * (o.escala || 1); }
  centro(o) { const p = o.g.position.clone(); p.y += o.cat === 'coletavel' && !o.voando ? 0 : this.alturaObj(o) / 2; return p; }
  raioObj(o) { return o.ehJogador ? Math.max(this.jog.hw, 0.35) : (o.raio || 0.5) * (o.escala || 1); }
  moverObj(o, d) {
    if (o.ehJogador) { this.jog.pos.add(d); return; }
    o.g.position.add(d);
    if (o.base !== undefined) o.base += d.y;
    if (o.aabb) { o.aabb.min.add(d); o.aabb.max.add(d); }
    if (o.caixa) { o.caixa.min.add(d); o.caixa.max.add(d); }
  }
  getProp(o, p) {
    switch (p) {
      case 'x': return o.g.position.x;
      case 'y': case 'altura': return o.ehJogador || o.base === undefined ? o.g.position.y : o.base - 0.6;
      case 'z': return o.g.position.z;
      case 'giro': return Math.round(((o.g.rotation.y * 180 / Math.PI) % 360 + 360) % 360);
      case 'tamanho': return o.escala || 1;
      case 'cor': return o.corBase || '';
      case 'visivel': return o.g.visible;
      case 'velocidade': return o.ehJogador ? this.cfg.vel : o.props.velocidade ?? (o.cat === 'inimigo' ? this.cfg.inim.vel : 3);
      case 'pulo': return o.ehJogador ? this.cfg.pulo : o.props.pulo ?? 1.2;
      case 'nome': return o.nome || o.tipo;
      case 'tipo': return o.tipo;
    }
    if (p in o.props) return o.props[p];
    throw this.erroAqui(`"${o.nome || o.tipo}" ainda não tem "${p}". Crie antes, tipo: criar ${o.tipo} com ${p} 3   (ou ${o.nome || o.tipo}.${p} = 3)`);
  }
  setProp(o, p, v) {
    switch (p) {
      case 'x': case 'z': { const d = V(); d[p] = this.num(v) - o.g.position[p]; this.moverObj(o, d); if (o.ehJogador) this.jog.vel.set(0, 0, 0); return; }
      case 'y': case 'altura': { const d = V(0, this.num(v) - this.getProp(o, 'y'), 0); this.moverObj(o, d); if (o.ehJogador) this.jog.vel.y = 0; return; }
      case 'giro': { const r = this.num(v) * Math.PI / 180; o.g.rotation.y = r; if (o.ehJogador) this.jog.rotAlvo = r; return; }
      case 'tamanho': {
        const s = Math.max(0.05, this.num(v)), k = s / (o.escala || 1); o.escala = s;
        if (o.ehJogador) { this.cfg.jog.tamanho = s; this.trocarModelo(); return; }
        o.g.scale.multiplyScalar(k);
        if (o.aabb) { const c = o.g.position, w = (o.aabb.max.x - o.aabb.min.x) * k / 2, dd = (o.aabb.max.z - o.aabb.min.z) * k / 2, h = (o.aabb.max.y - o.aabb.min.y) * k; o.aabb.min.set(c.x - w, c.y, c.z - dd); o.aabb.max.set(c.x + w, c.y + h, c.z + dd); }
        if (o.corpo) { o.corpo.hw *= k; o.corpo.h *= k; }
        return;
      }
      case 'cor': {
        if (typeof v !== 'string') throw this.erroAqui('Cor tem que ser um nome de cor (ex: vermelho) ou um código entre aspas');
        const nova = FC.CORES[FC.semAcento(v)] || v, velha = o.corBase ? new T.Color(o.corBase).getHex() : null;
        o.g.traverse(m => {
          if (!m.isMesh || !m.material || !m.material.color) return;
          if (velha !== null && m.material.color.getHex() !== velha) return;
          if (!m.material.__proprio) { m.material = m.material.clone(); m.material.__proprio = true; }
          m.material.color.set(nova); if (m.material.emissive && m.material.emissiveIntensity) m.material.emissive.set(nova);
        });
        o.corBase = nova; return;
      }
      case 'visivel': o.g.visible = !!v; return;
      case 'velocidade': if (o.ehJogador) this.cfg.vel = this.num(v); else o.props.velocidade = this.num(v); return;
      case 'pulo': if (o.ehJogador) this.cfg.pulo = this.num(v); else o.props.pulo = this.num(v); return;
      case 'nome': case 'tipo': throw this.erroAqui(`Não dá pra mudar o "${p}" depois de criado`);
    }
    o.props[p] = v;
  }
  andar(o, d) { // anda com a velocidade dele, neste quadro
    const v = this.getProp(o, 'velocidade');
    if (o.ehJogador) { this.jog.extra = (this.jog.extra || V()).add(d.clone().multiplyScalar(v)); return; }
    if (o.corpo) { o.mandado = d.clone().multiplyScalar(v); o.mandadoEm = this.quadro; return; }
    this.moverObj(o, d.clone().multiplyScalar(v * this.dtAtual));
  }
  virarPara(o, d) {
    if (Math.abs(d.x) + Math.abs(d.z) < 1e-6) return;
    const r = Math.atan2(d.x, d.z);
    o.g.rotation.y = r; if (o.ehJogador) this.jog.rotAlvo = r;
  }
  checarToques() { // quando X tocar Y
    for (const e of this.eventos) {
      if (e.ev !== 'toque2' || this.fim) continue;
      const A = this.grupo(e.a, {}), B = this.grupo(e.b, {});
      const antes = this.toques.get(e) || new Set(), agora = new Set();
      for (const a of A) for (const b of B) {
        if (a === b || !a.vivo || !b.vivo) continue;
        const ca = this.centro(a), cb = this.centro(b);
        const perto = Math.hypot(ca.x - cb.x, ca.z - cb.z) < this.raioObj(a) + this.raioObj(b) && Math.abs(ca.y - cb.y) < (this.alturaObj(a) + this.alturaObj(b)) / 2 + 0.1;
        if (!perto) continue;
        const chave = a; agora.add(a.g.id + ':' + b.g.id);
        if (!antes.has(a.g.id + ':' + b.g.id)) { this.iniciarTarefa(e.corpo, { isso: a, aquilo: b }); if (this.fim) return; }
      }
      this.toques.set(e, agora);
    }
  }

  // ---------------- física ----------------
  sobrepoe(c, s, folga = 0) {
    return c.pos.x - c.hw - folga < s.max.x && c.pos.x + c.hw + folga > s.min.x &&
      c.pos.y - folga < s.max.y && c.pos.y + c.h + folga > s.min.y &&
      c.pos.z - c.hw - folga < s.max.z && c.pos.z + c.hw + folga > s.min.z;
  }
  moverCorpo(c, dt) {
    c.vel.y = Math.max(c.vel.y - this.cfg.grav * dt, -40);
    const estavaNoChao = c.noChao; c.noChao = false; c.bateu = false;
    for (const eixo of ['x', 'z', 'y']) {
      const d = c.vel[eixo] * dt; if (d === 0) continue;
      c.pos[eixo] += d;
      for (const s of this.solidos) {
        if (!this.sobrepoe(c, s)) continue;
        if (eixo === 'y') {
          if (d < 0) { c.pos.y = s.max.y; c.noChao = true; } else c.pos.y = s.min.y - c.h;
          c.vel.y = 0;
        } else if (estavaNoChao && s.max.y - c.pos.y <= 0.35) {
          c.pos.y = s.max.y; // sobe degrau pequeno
        } else {
          c.pos[eixo] = d > 0 ? s.min[eixo] - c.hw - 1e-4 : s.max[eixo] + c.hw + 1e-4; c.bateu = true;
        }
      }
    }
    if (this.cfg.modo === 'lado') { c.pos.z = 0; c.vel.z = 0; }
  }

  // ---------------- cada quadro ----------------
  atualizar(dt) {
    this.ops = 0; this.tempo += dt; this.vars.set('tempo', this.tempo); this.quadro++; this.dtAtual = dt; this.pilha = 0;
    this.atualizarJogador(dt);
    this.atualizarCoisas(dt);
    this.contatosJogador();
    this.checarToques();
    this.rodarTarefas();
    this.eventosDeTempo(dt);
    this.checarObjetivos();
    this.checarVidas();
    if (this.objs.length > 60 && this.objs.filter(o => !o.vivo).length > 30) this.objs = this.objs.filter(o => o.vivo);
    if (this.querRecomecar) this.recomecar();
  }
  atualizarJogador(dt) {
    const j = this.jog, c = this.cfg, k = this.teclas, cam = c.camera.cam;
    const esq = k.has('a') || k.has('esquerda'), dir = k.has('d') || k.has('direita');
    const fr = k.has('w') || k.has('cima'), tr = k.has('s') || k.has('baixo');
    const ix = (dir ? 1 : 0) - (esq ? 1 : 0), iz = c.modo === 'lado' ? 0 : (tr ? 1 : 0) - (fr ? 1 : 0);
    let mx = ix, mz = iz;
    if (c.modo !== 'lado' && (cam === 'atras' || cam === 'primeira')) {
      const sy = Math.sin(this.yaw), cy = Math.cos(this.yaw);
      mx = cy * ix + sy * iz; mz = -sy * ix + cy * iz;
    }
    const len = Math.hypot(mx, mz); if (len > 1) { mx /= len; mz /= len; }
    const v = c.vel * (k.has('shift') ? 1.6 : 1);
    j.vel.x = mx * v + j.emp.x; j.vel.z = mz * v + j.emp.z;
    if (j.extra) { j.vel.x += j.extra.x; j.vel.z += j.extra.z; if (j.extra.y > 0 && j.noChao) j.vel.y = j.extra.y; j.extra = null; }
    j.emp.multiplyScalar(Math.exp(-6 * dt));
    if (len > 0.01 && cam !== 'primeira') j.rotAlvo = Math.atan2(mx, mz);
    if (cam === 'primeira') j.rotAlvo = this.yaw + Math.PI;
    const pular = k.has('espaco') || (c.modo === 'lado' && (k.has('w') || k.has('cima')));
    if (pular && j.noChao && c.pulo > 0) { j.vel.y = Math.sqrt(2 * c.grav * c.pulo); SOM.pulo(); }
    this.moverCorpo(j, dt);
    let d = j.rotAlvo - j.g.rotation.y; d = Math.atan2(Math.sin(d), Math.cos(d));
    j.g.rotation.y += d * Math.min(1, dt * 12);
    j.dentro.position.y = len > 0.01 && j.noChao ? Math.abs(Math.sin(this.tempo * 13)) * 0.08 : 0;
    j.g.visible = cam === 'primeira' ? false : j.inv > 0 ? Math.floor(this.tempo * 12) % 2 === 0 : true;
    if (j.inv > 0) j.inv -= dt;
    if (j.pos.y < -15) { this.dano(true); this.levarJogador(this.inicio); }
  }
  atualizarCoisas(dt) {
    const j = this.jog;
    for (const o of this.objs) {
      if (!o.vivo) continue;
      if (o.cat === 'coletavel') { o.g.rotation.y += dt * 2.5; o.g.position.y = o.base + Math.sin(this.tempo * 3 + o.fase) * 0.12; }
      else if (o.cat === 'inimigo') this.atualizarInimigo(o, dt, j);
      else if (o.tipo === 'bandeira') { const p = o.g.getObjectByName('pano'); if (p) p.rotation.y = Math.sin(this.tempo * 4 + o.fase) * 0.25; }
      else if (o.tipo === 'portal') o.g.rotation.y += dt * 0.8;
    }
  }
  atualizarInimigo(o, dt, j) {
    const c = o.corpo, lado = this.cfg.modo === 'lado'; let vel = this.cfg.inim.vel;
    let dx = 0, dz = 0, vagar = o.comp === 'anda';
    if (o.props.velocidade !== undefined) vel = o.props.velocidade;
    if (o.comp === 'segue') {
      const ax = j.pos.x - c.pos.x, az = lado ? 0 : j.pos.z - c.pos.z, d = Math.hypot(ax, az);
      if (d < 22 && d > 0.2) { dx = ax / d; dz = az / d; } else vagar = true;
    }
    if (vagar) {
      o.troca -= dt;
      if (o.troca <= 0 || o.bateuAntes) { o.dir = o.bateuAntes || lado ? o.dir + Math.PI : rand(0, 6.28); o.troca = rand(2, 5); }
      dx = Math.sin(o.dir); dz = lado ? 0 : Math.cos(o.dir);
      if (lado) dx = Math.sign(dx) || 1;
      if (c.noChao) { // não cair da beirada
        const h = this.alturaEm(c.pos.x + dx * 0.7, c.pos.z + dz * 0.7);
        if (h === null || h < c.pos.y - 0.5) { o.dir += Math.PI; dx = -dx; dz = -dz; }
      }
    }
    if (o.comp === 'parado') dx = dz = 0;
    c.vel.x = dx * vel; c.vel.z = dz * vel;
    if (o.mandadoEm !== undefined && this.quadro - o.mandadoEm <= 1) { c.vel.x = o.mandado.x; c.vel.z = o.mandado.z; dx = dz = 0; }
    this.moverCorpo(c, dt);
    o.bateuAntes = c.bateu;
    if (dx || dz) {
      let d = Math.atan2(dx, dz) - o.g.rotation.y; d = Math.atan2(Math.sin(d), Math.cos(d));
      o.g.rotation.y += d * Math.min(1, dt * 8);
    }
    if (c.pos.y < -15) this.removerObj(o);
  }
  contatosJogador() {
    const j = this.jog, cx = j.pos.x, cy = j.pos.y + j.h / 2, cz = j.pos.z, agora = new Set();
    for (const o of this.objs) {
      if (!o.vivo || o.cat === 'fantasma') continue;
      let toca = false;
      if (o.cat === 'coletavel' || o.cat === 'marco' || o.cat === 'enfeite') {
        const p = o.g.position, dy = o.cat === 'marco' ? Math.max(0, Math.abs(cy - (p.y + 1.1)) - 1) : cy - p.y;
        toca = Math.hypot(cx - p.x, dy, cz - p.z) < o.raio + j.hw + 0.2;
      } else if (o.cat === 'inimigo') {
        const e = o.corpo;
        toca = Math.abs(cx - e.pos.x) < j.hw + e.hw + 0.05 && Math.abs(cz - e.pos.z) < j.hw + e.hw + 0.05 && j.pos.y < e.pos.y + e.h + 0.05 && j.pos.y + j.h > e.pos.y;
      } else if (o.aabb) toca = this.sobrepoe(j, o.aabb, 0.06);
      else if (o.caixa) toca = this.sobrepoe(j, o.caixa, 0.02);
      if (!toca) continue;
      agora.add(o);
      const novo = !this.contatos.has(o);
      if (o.cat === 'coletavel') { this.pegar(o); continue; }
      if (o.cat === 'inimigo') {
        if (j.vel.y < -0.5 && j.pos.y > o.corpo.pos.y + o.corpo.h * 0.45) {
          this.derrotar(o); j.vel.y = Math.sqrt(2 * this.cfg.grav * Math.max(this.cfg.pulo, 1) * 0.7); continue;
        }
        this.dano(false, o.g.position);
      }
      if (o.cat === 'perigo') this.dano(false, o.g.position);
      if (novo) { if (o.cat === 'marco') this.marcos.add(o.tipo); this.disparar('tocar', o.tipo, o); }
    }
    this.contatos = agora;
  }
  pegar(o) {
    this.removerObj(o);
    const t = o.tipo; this.pegos[t] = (this.pegos[t] || 0) + 1;
    const pts = t.startsWith('emoji:') ? 1 : PONTOS_DE[t] || 0;
    if (pts) this.vars.set('pontos', (+this.vars.get('pontos') || 0) + pts);
    if (t === 'coracao') { this.vars.set('vidas', (+this.vars.get('vidas') || 0) + 1); SOM.poder(); }
    else if (t === 'estrela') SOM.poder(); else SOM.moeda();
    this.disparar('pegar', t, o); this.disparar('tocar', t, o);
  }
  derrotar(o) {
    this.removerObj(o); SOM.explosao();
    this.derrot[o.tipo] = (this.derrot[o.tipo] || 0) + 1;
    this.disparar('derrotar', o.tipo, o);
  }
  dano(queda, de) {
    const j = this.jog;
    if (j.inv > 0 && !queda) return;
    if (!queda && this.jogObj && this.jogObj.props.invencivel) return; // jogador.invencível = sim
    this.vars.set('vidas', (+this.vars.get('vidas') || 0) - 1);
    j.inv = 1.5; this.tremor = 0.35; SOM.dano();
    if (de) {
      const dx = j.pos.x - de.x, dz = this.cfg.modo === 'lado' ? 0 : j.pos.z - de.z, d = Math.hypot(dx, dz) || 1;
      j.emp.set(dx / d * 9, 0, dz / d * 9); j.vel.y = 5;
    }
  }
  checarVidas() {
    if (this.semVidasFeito || this.fim) return;
    if (+this.vars.get('vidas') <= 0) {
      this.semVidasFeito = true;
      if (this.eventos.some(e => e.ev === 'semvidas')) this.disparar('semvidas');
      else this.terminar(false, 'Fim de jogo! 💀');
    }
  }

  // ---------------- eventos e tarefas ----------------
  disparar(ev, chave, obj) {
    for (const e of this.eventos) {
      if (e.ev !== ev) continue;
      if (ev === 'apertar' && e.tecla !== chave) continue;
      if ((ev === 'pegar' || ev === 'tocar' || ev === 'derrotar') && e.coisa !== chave && !(obj && obj.nome === e.coisa)) continue;
      if (ev === 'objetivo' && e.num && e.num !== chave) continue;
      this.iniciarTarefa(e.corpo, { isso: obj });
      if (this.fim) return;
    }
  }
  iniciarTarefa(lista, ctx) {
    const t = { gen: this.exec(lista, ctx), acordar: 0 };
    if (this.passoTarefa(t) && this.tarefas.length < 400) this.tarefas.push(t);
  }
  passoTarefa(t) {
    const r = t.gen.next();
    if (r.done) return false;
    t.acordar = this.tempo + r.value; return true;
  }
  rodarTarefas() {
    if (!this.tarefas.length) return;
    const lista = this.tarefas; this.tarefas = [];
    for (const t of lista) {
      if (this.fim) return;
      if (t.acordar > this.tempo) { this.tarefas.push(t); continue; }
      if (this.passoTarefa(t)) this.tarefas.push(t);
    }
  }
  eventosDeTempo(dt) {
    for (const e of this.eventos) {
      if (this.fim) return;
      if (e.ev === 'sempre') this.iniciarTarefa(e.corpo, {});
      else if (e.ev === 'cada') {
        this.linha = e.n;
        const s = Math.max(0.05, this.num(this.val(e.seg, {})));
        const acc = (this.estadoEv.get(e) || 0) + dt;
        if (acc >= s) { this.estadoEv.set(e, acc - s); this.iniciarTarefa(e.corpo, {}); } else this.estadoEv.set(e, acc);
      } else if (e.ev === 'cond') {
        this.linha = e.n;
        const v = !!this.val(e.cond, {}), antes = this.estadoEv.get(e) || false;
        this.estadoEv.set(e, v);
        if (v && !antes) this.iniciarTarefa(e.corpo, {});
      }
    }
  }
  *exec(lista, ctx) {
    for (const n of lista) {
      if (this.fim) return;
      this.linha = n.n;
      if (++this.ops > 100000) throw new FC.ErroFC('O jogo travou: comando demais de uma vez só (tem um "repetir" gigante?)', n.n);
      switch (n.tipo) {
        case 'esperar': yield Math.max(0, this.num(this.val(n.e, ctx))); break;
        case 'se': if (this.val(n.cond, ctx)) yield* this.exec(n.corpo, ctx); else if (n.senao) yield* this.exec(n.senao, ctx); break;
        case 'repetir': { const k = Math.min(10000, this.num(this.val(n.vezes, ctx))); for (let i = 0; i < k; i++) yield* this.exec(n.corpo, ctx); break; }
        case 'cada': for (const o of this.grupo(n.alvo, ctx)) { if (o.vivo) yield* this.exec(n.corpo, { ...ctx, isso: o }); if (this.fim) return; } break;
        case 'chamar': {
          const en = this.ensinados.get(n.nome);
          if (!en) throw this.erroAqui(`Não achei o comando "${n.nome}"`);
          if (++this.pilha > 60) { this.pilha = 0; throw this.erroAqui(`O comando "${n.nome}" chama ele mesmo sem parar!`); }
          n.args.forEach((e, i) => this.vars.set(en.params[i], this.val(e, ctx)));
          try { yield* this.exec(en.corpo, ctx); } finally { this.pilha--; }
          break;
        }
        default: this.aplicar(n, ctx);
      }
    }
  }
  erroAqui(msg) { return new FC.ErroFC(msg, this.linha); }
  aplicar(n, ctx) {
    const c = this.cfg;
    switch (n.tipo) {
      case 'jogo': c.modo = n.modo; break;
      case 'ceu':
        c.ceu = n.cor; c.ceuPreset = n.preset || null;
        if (this.fase === 'jogo') { this.cena.background.set(n.cor); this.cena.fog.color.set(n.cor); }
        break;
      case 'chao':
        if (n.nenhum) c.chao.nenhum = true; else { c.chao.mat = n.mat; c.chao.cor = n.cor; }
        if (n.w) c.chao.w = n.w; if (n.d) c.chao.d = n.d; break;
      case 'luz': c.luz = n.v; break;
      case 'gravidade': c.grav = Math.max(0.1, this.num(this.val(n.e, ctx))); break;
      case 'objetivo': this.objetivos.push({ ...n }); break;
      case 'mostrar': c.mostrar = n.itens; break;
      case 'inimigos': c.inim.comp = n.comp; for (const o of this.objs) if (o.cat === 'inimigo') o.comp = n.comp; break;
      case 'velinimigos': c.inim.vel = this.num(this.val(n.e, ctx)); break;
      case 'veljogador': c.vel = this.num(this.val(n.e, ctx)); break;
      case 'pulo': c.pulo = Math.max(0, this.num(this.val(n.e, ctx))); break;
      case 'jogadorem': {
        if (this.fase === 'setup') this.inicioLinha = n.n;
        const p = this.posMundo(n.pos.map(e => this.num(this.val(e, ctx))));
        if (this.fase === 'setup') this.inicio = p.clone();
        this.levarJogador(p); break;
      }
      case 'voltar': this.levarJogador(this.inicio); break;
      case 'jogador':
        for (const k of ['modelo', 'emoji', 'cor', 'tamanho']) if (n[k] != null) c.jog[k] = n[k];
        if (this.jog) this.trocarModelo(); break;
      case 'camera': c.camera = { cam: n.cam, dist: n.dist, pos: n.pos }; if (this.fase === 'jogo' && c.camera.dist == null) c.camera.dist = { atras: 6, cima: 12, lado: 8 }[n.cam] || 0; this.camPos = null; break;
      case 'criar': this.criar(n, ctx); break;
      case 'som': SOM[n.som]?.(); break;
      case 'ganhar': this.terminar(true, n.e ? fmt(this.val(n.e, ctx)) : 'Você venceu! 🏆'); break;
      case 'perder': this.terminar(false, n.e ? fmt(this.val(n.e, ctx)) : 'Fim de jogo! 💀'); break;
      case 'mensagem': this.msg = { txt: fmt(this.val(n.e, ctx)), ate: this.tempo + 2.8 }; break;
      case 'remover': for (const o of this.grupo(n.alvo, ctx)) this.removerObj(o); break;
      case 'derrotar': for (const o of this.grupo(n.alvo, ctx)) if (!o.ehJogador) this.derrotar(o); break;
      case 'prop':
        for (const o of this.grupo(n.alvo, ctx)) {
          const v = this.val(n.e, ctx);
          this.setProp(o, n.p, n.op === '=' ? v : this.oper(n.op, this.getProp(o, n.p), v));
        }
        break;
      case 'mover':
        for (const o of this.grupo(n.alvo, ctx)) {
          if (n.dir) this.moverObj(o, this.direcao(o, n.dir).multiplyScalar(this.num(this.val(n.e, ctx))));
          else {
            const v = n.vec.map(e => this.num(this.val(e, ctx)));
            this.moverObj(o, v.length === 3 ? V(v[0], v[1], v[2]) : this.cfg.modo === 'lado' ? V(v[0], v[1], 0) : V(v[0], 0, v[1]));
          }
        }
        break;
      case 'andar':
        for (const o of this.grupo(n.alvo, ctx)) {
          let d;
          if (n.dir) d = this.direcao(o, n.dir);
          else {
            const alvo = this.grupo(n.ate || n.longe, ctx)[0]; if (!alvo || alvo === o) continue;
            d = alvo.g.position.clone().sub(o.g.position);
            if (o.corpo || o.ehJogador) d.y = 0;
            if (this.cfg.modo === 'lado') d.z = 0;
            if (d.length() < 0.05) continue;
            d.normalize(); if (n.longe) d.negate();
            this.virarPara(o, d);
          }
          this.andar(o, d);
        }
        break;
      case 'pular':
        for (const o of this.grupo(n.alvo, ctx)) {
          const c = o.ehJogador ? this.jog : o.corpo;
          if (c && c.noChao) { c.vel.y = Math.sqrt(2 * this.cfg.grav * this.getProp(o, 'pulo')); if (o.ehJogador) SOM.pulo(); }
        }
        break;
      case 'girar': for (const o of this.grupo(n.alvo, ctx)) { o.g.rotation.y += this.num(this.val(n.e, ctx)) * Math.PI / 180; if (o.ehJogador) this.jog.rotAlvo = o.g.rotation.y; } break;
      case 'virar': { const p = this.grupo(n.para, ctx)[0]; if (p) for (const o of this.grupo(n.alvo, ctx)) this.virarPara(o, p.g.position.clone().sub(o.g.position)); break; }
      case 'levar':
        for (const o of this.grupo(n.alvo, ctx)) {
          const p = n.ate ? this.um(n.ate, ctx).g.position.clone() : this.posMundo(n.pos.map(e => this.num(this.val(e, ctx))));
          if (o.ehJogador) this.levarJogador(p); else this.moverObj(o, p.sub(o.g.position));
        }
        break;
      case 'recomecar': this.querRecomecar = true; break;
      case 'completar': this.completarObjetivo(n.num); break;
      case 'tremer': this.tremor = 0.5; break;
      case 'mudar': this.vars.set(n.nome, this.oper(n.op, this.lerVar(n.nome), this.val(n.e, ctx))); break;
      case 'var': this.vars.set(n.nome, this.val(n.e, ctx)); break;
      default: throw this.erroAqui('Comando que o motor ainda não sabe fazer: ' + n.tipo);
    }
  }
  val(n, ctx) {
    switch (n.t) {
      case 'val': return n.v;
      case 'var': return this.lerVar(n.v);
      case 'neg': return -this.num(this.val(n.a, ctx));
      case 'nao': return !this.val(n.a, ctx);
      case 'bin':
        if (n.op === 'e') return !!this.val(n.a, ctx) && !!this.val(n.b, ctx);
        if (n.op === 'ou') return !!this.val(n.a, ctx) || !!this.val(n.b, ctx);
        return this.oper(n.op, this.val(n.a, ctx), this.val(n.b, ctx));
      case 'aleat': {
        const a = this.num(this.val(n.a, ctx)), b = this.num(this.val(n.b, ctx));
        if (Number.isInteger(a) && Number.isInteger(b)) return Math.min(a, b) + Math.floor(Math.random() * (Math.abs(b - a) + 1));
        return rand(a, b);
      }
      case 'quantos': return n.coisa === 'jogador' ? 1 : this.grupo(n.coisa, ctx).length;
      case 'existe': return this.grupo(n.a, ctx).length > 0;
      case 'prop': return this.getProp(this.um(n.alvo, ctx), n.p);
      case 'distancia': {
        const a = this.grupo(n.a, ctx)[0], b = this.grupo(n.b, ctx)[0];
        if (!a || !b) return 99999;
        const pa = a.g.position, pb = b.g.position;
        return Math.hypot(pa.x - pb.x, pa.y - pb.y, pa.z - pb.z);
      }
      case 'tocando': {
        for (const a of this.grupo(n.a, ctx)) for (const b of this.grupo(n.b, ctx)) {
          if (a === b) continue;
          const ca = this.centro(a), cb = this.centro(b);
          if (Math.hypot(ca.x - cb.x, ca.z - cb.z) < this.raioObj(a) + this.raioObj(b) && Math.abs(ca.y - cb.y) < (this.alturaObj(a) + this.alturaObj(b)) / 2 + 0.1) return true;
        }
        return false;
      }
      case 'pegos': return this.pegos[n.coisa] || 0;
      case 'derrotados': return this.derrot[n.coisa] || 0;
      case 'tecla': return this.teclas.has(n.k);
    }
    throw this.erroAqui('Valor desconhecido');
  }
  lerVar(v) {
    if (!this.vars.has(v)) throw this.erroAqui(`A variável "${v}" ainda não tem valor (crie no começo: ${v}: 0)`);
    return this.vars.get(v);
  }
  num(v) {
    if (typeof v === 'number' && isFinite(v)) return v;
    if (typeof v === 'boolean') return v ? 1 : 0;
    throw this.erroAqui(`Aqui precisava de um número, mas veio ${typeof v === 'string' ? `o texto "${v}"` : String(v)}`);
  }
  oper(op, a, b) {
    switch (op) {
      case '+': if (typeof a === 'string' || typeof b === 'string') return fmt(a) + fmt(b); return this.num(a) + this.num(b);
      case '-': return this.num(a) - this.num(b);
      case '*': return this.num(a) * this.num(b);
      case '/': { const d = this.num(b); if (d === 0) throw this.erroAqui('Não dá pra dividir por zero!'); return this.num(a) / d; }
      case '%': { const d = this.num(b); if (d === 0) throw this.erroAqui('Não dá pra dividir por zero!'); return ((this.num(a) % d) + d) % d; }
      case '=': return a === b || (typeof a === 'number' && typeof b === 'number' && Math.abs(a - b) < 1e-9);
      case '!=': return a !== b;
      case '<': return this.num(a) < this.num(b);
      case '>': return this.num(a) > this.num(b);
      case '<=': return this.num(a) <= this.num(b);
      case '>=': return this.num(a) >= this.num(b);
    }
  }

  // ---------------- objetivos ----------------
  objAtual() { return this.objetivos.find(o => !o.feito); }
  comecarObj(o) {
    o.ini = { tempo: this.tempo, pegos: { ...this.pegos }, derrot: { ...this.derrot } };
    this.marcos.clear();
  }
  progresso(o) { // [feito?, texto do progresso]
    const vivos = t => this.objs.filter(x => x.vivo && x.tipo === t).length;
    switch (o.obj) {
      case 'pegar': {
        const n = (this.pegos[o.coisa] || 0) - (o.ini.pegos[o.coisa] || 0);
        if (o.qtd) return [n >= o.qtd, `${Math.min(n, o.qtd)}/${o.qtd}`];
        const r = vivos(o.coisa); return [r === 0 && n > 0, `${n}/${n + r}`];
      }
      case 'derrotar': {
        const n = (this.derrot[o.coisa] || 0) - (o.ini.derrot[o.coisa] || 0);
        if (o.qtd) return [n >= o.qtd, `${Math.min(n, o.qtd)}/${o.qtd}`];
        const r = vivos(o.coisa); return [r === 0 && n > 0, `${n}/${n + r}`];
      }
      case 'chegar': return [this.marcos.has(o.coisa), ''];
      case 'sobreviver': { const f = o.seg - (this.tempo - o.ini.tempo); return [f <= 0, `${Math.max(0, Math.ceil(f))} s`]; }
      case 'pontos': { const p = +this.vars.get('pontos') || 0; return [p >= o.qtd, `${p}/${o.qtd}`]; }
      default: return [false, ''];
    }
  }
  checarObjetivos() {
    const o = this.objAtual(); if (!o || this.fim) return;
    if (!o.ini) this.comecarObj(o);
    if (this.progresso(o)[0]) this.completarObjetivo(o.idx);
  }
  completarObjetivo(num) {
    const o = num ? this.objetivos.find(x => x.idx === num || x.num === num) : this.objAtual();
    if (!o || o.feito) return;
    o.feito = true; SOM.objetivo();
    this.msg = { txt: '✔ ' + o.texto, ate: this.tempo + 2.8 };
    this.disparar('objetivo', o.idx);
    if (this.fim) return;
    if (!this.objAtual()) this.terminar(true, 'Você venceu! 🏆');
    else this.comecarObj(this.objAtual());
  }
  terminar(ganhou, msg) {
    if (this.fim) return;
    this.fim = { ganhou, msg };
    (ganhou ? SOM.ganhou : SOM.perdeu)();
    if (document.pointerLockElement) document.exitPointerLock();
  }
  falhar(e) {
    const err = e instanceof FC.ErroFC ? e : new FC.ErroFC('Erro interno: ' + e.message, this.linha);
    if (!err.linha) err.linha = this.linha;
    this.rodando = false; this.fim = { erro: true, msg: 'Deu erro no código 😵 — olha em PROBLEMAS' };
    if (document.pointerLockElement) document.exitPointerLock();
    this.opts.erro?.(err);
    if (!(e instanceof FC.ErroFC)) console.error(e);
  }

  // ---------------- câmera ----------------
  atualizarCamera(dt) {
    if (!this.jog || !this.cfg) return;
    const c = this.cfg, j = this.jog, cam = c.camera, d = cam.dist;
    const alvo = V(j.pos.x, j.pos.y + j.h * 0.7, j.pos.z);
    let pos, olhar = alvo, orto = null;
    switch (cam.cam) {
      case 'primeira': {
        const o = V(j.pos.x, j.pos.y + j.h * 0.85, j.pos.z);
        const dir = V(-Math.sin(this.yaw) * Math.cos(this.olhar), Math.sin(this.olhar), -Math.cos(this.yaw) * Math.cos(this.olhar));
        this.cam = this.persp; this.persp.position.copy(o); this.persp.lookAt(o.clone().add(dir)); this.camPos = null;
        return;
      }
      case 'atras': {
        const p = this.pitch;
        pos = V(alvo.x + Math.sin(this.yaw) * Math.cos(p) * d, alvo.y + Math.sin(p) * d + 0.3, alvo.z + Math.cos(this.yaw) * Math.cos(p) * d);
        pos.y = Math.max(pos.y, 0.4); break;
      }
      case 'cima':
        if (c.modo === 'cima') { orto = d * 0.6; pos = V(alvo.x, 60, alvo.z); olhar = V(alvo.x, 0, alvo.z); }
        else pos = V(alvo.x, alvo.y + d, alvo.z + d * 0.45);
        break;
      case 'lado':
        if (c.modo === 'lado') { orto = d * 0.6; const y = Math.max(alvo.y + 0.5, orto - 1.5); pos = V(alvo.x, y, 60); olhar = V(alvo.x, y, 0); }
        else pos = V(alvo.x, alvo.y + d * 0.3, alvo.z + d);
        break;
      case 'fixa': pos = V(...cam.pos); break;
    }
    const k = 1 - Math.exp(-8 * dt);
    if (!this.camPos) { this.camPos = pos.clone(); this.camAlvo = olhar.clone(); }
    else { this.camPos.lerp(pos, k); this.camAlvo.lerp(olhar, k); }
    const tre = this.tremor > 0 ? V(rand(-1, 1), rand(-1, 1), rand(-1, 1)).multiplyScalar(this.tremor * 0.5) : V();
    this.tremor = Math.max(0, this.tremor - dt);
    if (orto) {
      const o = this.orto, h = orto, w = h * this.aspect;
      o.left = -w; o.right = w; o.top = h; o.bottom = -h; o.updateProjectionMatrix();
      o.up.set(0, c.modo === 'cima' ? 0 : 1, c.modo === 'cima' ? -1 : 0);
      o.position.copy(this.camPos).add(tre); o.lookAt(this.camAlvo.clone().add(tre)); this.cam = o;
    } else {
      this.persp.position.copy(this.camPos).add(tre); this.persp.lookAt(this.camAlvo); this.cam = this.persp;
    }
  }

  // ---------------- HUD (placar, objetivo, mensagens) ----------------
  desenharHud() {
    if (!this.cfg) return;
    const esc = s => String(s).replace(/&/g, '&amp;').replace(/</g, '&lt;');
    let h = '<div class="hud-vars">';
    for (const nome of this.cfg.mostrar) {
      let v = this.vars.has(nome) ? this.vars.get(nome) : '–';
      if (nome === 'vidas' && Number.isInteger(v) && v >= 0 && v <= 10) v = v ? '❤️'.repeat(v) : '0';
      else if (nome === 'tempo' && typeof v === 'number') v = Math.floor(v) + ' s';
      else v = fmt(v);
      h += `<div><span>${esc((nome[0].toUpperCase() + nome.slice(1)).replace(/_/g, ' '))}</span> ${esc(v)}</div>`;
    }
    h += '</div>';
    const o = this.objAtual();
    if (o && o.ini) { const p = this.progresso(o)[1]; h += `<div class="hud-obj">🎯 ${esc(o.texto)}${p ? ` <b>${esc(p)}</b>` : ''}</div>`; }
    if (this.msg && this.msg.ate > this.tempo) h += `<div class="hud-msg">${esc(this.msg.txt)}</div>`;
    if (this.tempo < 6 && !this.fim) {
      const m = this.cfg.modo, cam = this.cfg.camera.cam;
      const toque = document.body.classList.contains('toque');
      if (toque) h += `<div class="hud-dica" style="bottom:150px">🕹️ joystick: andar · ⤒ pular${cam === 'atras' || cam === 'primeira' ? ' · arraste a tela: girar a câmera' : ''}</div>`;
      else h += `<div class="hud-dica">${m === 'lado' ? '← → andar · Espaço pular' : 'WASD ou setas: andar · Espaço: pular · Shift: correr'}${cam === 'atras' ? ' · arraste o mouse: girar a câmera' : cam === 'primeira' ? ' · clique: olhar com o mouse' : ''}</div>`;
    }
    if (this.fim) h += `<div class="hud-fim ${this.fim.ganhou ? 'ganhou' : ''}"><div>${esc(this.fim.msg)}</div>${this.fim.erro ? '' : '<small>aperte R pra jogar de novo</small>'}</div>`;
    if (h !== this.hudTxt) { this.hud.innerHTML = h; this.hudTxt = h; }
  }
}

G.Motor = Motor;
G.FrogSom = SOM;
})(window);
