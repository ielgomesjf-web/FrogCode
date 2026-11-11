// FrogCode — linguagem de jogos da Frogbit Studio (v1)
// Jeito de escrever: "coisa: valor", quase como falar.
// Este arquivo só ENTENDE o texto e monta o programa; quem roda é o motor.js.
(function (G) {
'use strict';

const CORES = {
  preto: '#1a1a1a', branco: '#ffffff', vermelho: '#e53935', verde: '#43a047', azul: '#1e88e5',
  amarelo: '#fdd835', laranja: '#fb8c00', roxo: '#8e24aa', rosa: '#ec407a', cinza: '#9e9e9e',
  marrom: '#795548', ciano: '#00bcd4', dourado: '#ffc107', prata: '#c0c7cf', bege: '#e8d5b0',
  verdeclaro: '#9ccc65', verdeescuro: '#1b5e20', azulclaro: '#81d4fa', azulescuro: '#14213d',
};
const MATERIAIS = { grama: '#5da744', areia: '#e3c88a', neve: '#eef3f7', pedra: '#8d939b', terra: '#8b5e3c', madeira: '#a0703c', gelo: '#bfe6f5' };
const CEUS = { dia: '#87ceeb', noite: '#0b1030', tarde: '#ffab6b', 'por do sol': '#ff8a65', nublado: '#a9b4bf' };
const MODELOS_JOGADOR = ['sapo', 'robo', 'cubo', 'bola', 'pinguim'];

// coisas que dá pra criar, e o tipo de cada uma
const COISAS = {
  moeda: 'coletavel', estrela: 'coletavel', gema: 'coletavel', coracao: 'coletavel', chave: 'coletavel',
  arvore: 'solido', pinheiro: 'solido', pedra: 'solido', caixa: 'solido', bloco: 'solido', parede: 'solido',
  casa: 'solido', plataforma: 'solido',
  inimigo: 'inimigo', espinho: 'perigo',
  bandeira: 'marco', portal: 'marco', flor: 'enfeite',
  cubo: 'enfeite', bola: 'enfeite', cone: 'enfeite', cilindro: 'enfeite', piramide: 'enfeite',
};
const FORMAS = ['cubo', 'bola', 'cone', 'cilindro', 'piramide'];
const PLURAL = {
  cubos: 'cubo', bolas: 'bola', cones: 'cone', cilindros: 'cilindro', piramides: 'piramide',
  moedas: 'moeda', estrelas: 'estrela', gemas: 'gema', coracoes: 'coracao', chaves: 'chave', arvores: 'arvore',
  pinheiros: 'pinheiro', pedras: 'pedra', caixas: 'caixa', blocos: 'bloco', paredes: 'parede', casas: 'casa',
  plataformas: 'plataforma', inimigos: 'inimigo', espinhos: 'espinho', bandeiras: 'bandeira', portais: 'portal', flores: 'flor',
};
const NUMS = { um: 1, uma: 1, dois: 2, duas: 2, tres: 3, quatro: 4, cinco: 5, seis: 6, sete: 7, oito: 8, nove: 9, dez: 10, vinte: 20, trinta: 30, cem: 100 };
const SONS = ['moeda', 'pulo', 'tiro', 'explosao', 'dano', 'perdeu', 'ganhou', 'poder', 'objetivo'];
const PRONTAS = ['pontos', 'vidas', 'tempo'];

function semAcento(s) { return s.normalize('NFD').replace(/[̀-ͯ]/g, '').toLowerCase(); }
class ErroFC extends Error { constructor(msg, linha) { super(msg); this.linha = linha; } }
const erro = m => new ErroFC(m);

// tira as palavras de dentro das aspas, deixa tudo minúsculo, sem acento e sem ":"
function preparar(raw) {
  const strs = []; let out = '', i = 0;
  while (i < raw.length) {
    const c = raw[i];
    if (c === '"' || c === "'" || c === '“' || c === '”') {
      let j = i + 1;
      while (j < raw.length && !['"', "'", '“', '”'].includes(raw[j])) j++;
      if (j >= raw.length) throw erro('Faltou fechar as aspas do texto');
      strs.push(raw.slice(i + 1, j)); out += ` §${strs.length - 1} `; i = j + 1; continue;
    }
    out += c; i++;
  }
  let t = ' ' + semAcento(out) + ' ';
  t = t.replace(/\b3\s*d\b/g, 'tresd').replace(/\b2\s*d\b/g, 'doisd')
    .replace(/(\d)\s*(?:metros|metro|m)\b/g, '$1 ')
    .replace(/(\d)([a-z])/g, '$1 $2')
    .replace(/:/g, ' ').replace(/,/g, ' , ')
    .replace(/\s+/g, ' ').trim();
  return { t, strs };
}
function dividirDoisPontos(raw) {
  let q = null;
  for (let i = 0; i < raw.length; i++) {
    const c = raw[i];
    if (q) { if (c === q || (q === '“' && c === '”')) q = null; continue; }
    if (c === '"' || c === "'" || c === '“') { q = c; continue; }
    if (c === ':') return { cab: raw.slice(0, i), resto: raw.slice(i + 1) };
  }
  return { cab: raw, resto: '' };
}
function tirarComentario(raw) {
  let s = '', q = null;
  for (const ch of raw) {
    if (q) { s += ch; if (ch === q || (q === '“' && ch === '”')) q = null; continue; }
    if (ch === '"' || ch === "'" || ch === '“') { q = ch; s += ch; continue; }
    if (ch === '#') break;
    s += ch;
  }
  return s;
}
function distancia(a, b) { // pra sugerir "você quis dizer..."
  const d = Array.from({ length: a.length + 1 }, (_, i) => [i]);
  for (let j = 1; j <= b.length; j++) d[0][j] = j;
  for (let i = 1; i <= a.length; i++) for (let j = 1; j <= b.length; j++)
    d[i][j] = Math.min(d[i - 1][j] + 1, d[i][j - 1] + 1, d[i - 1][j - 1] + (a[i - 1] === b[j - 1] ? 0 : 1));
  return d[a.length][b.length];
}
const PRIMEIRAS = ['jogo', 'ceu', 'chao', 'luz', 'gravidade', 'jogador', 'camera', 'criar', 'objetivo', 'mostrar', 'inimigos',
  'velocidade', 'pulo', 'quando', 'se', 'senao', 'sempre', 'repetir', 'som', 'ganhar', 'perder', 'mensagem', 'esperar',
  'remover', 'recomecar', 'completar', 'tremer', 'levar', 'voltar', 'vidas', 'pontos', 'mover', 'andar', 'girar', 'virar', 'pular', 'ensinar', 'modelo', 'para', 'derrotar'];

// ---------------- contas (expressões) ----------------
function tokensConta(s, strs) {
  s = ' ' + s + ' ';
  s = s.replace(/ (?:e |for )?maior ou igual a /g, ' >= ').replace(/ (?:e |for )?menor ou igual a /g, ' <= ')
    .replace(/ (?:e |for |ficar )?maior (?:do )?que /g, ' > ').replace(/ (?:e |for |ficar )?menor (?:do )?que /g, ' < ')
    .replace(/ (?:e |for )?igual a /g, ' = ').replace(/ (?:e |for )?diferente de /g, ' != ')
    .replace(/ (?:chegar|chegarem) (?:a|em) /g, ' >= ');
  const re = /\s*(?:(\d+(?:\.\d+)?)|§(\d+)|([a-z_][a-z0-9_]*)|(>=|<=|!=|==|[-+*\/%()=<>.]))/y;
  const toks = []; let m; re.lastIndex = 0;
  while (re.lastIndex < s.length) {
    const ini = re.lastIndex;
    if (/^\s*$/.test(s.slice(ini))) break;
    m = re.exec(s);
    if (!m) throw erro(`Não entendi "${s.slice(ini).trim().split(' ')[0]}" nessa conta`);
    const sp = /\s/.test(s[ini]);
    if (m[1] !== undefined) toks.push({ t: 'num', v: +m[1], sp });
    else if (m[2] !== undefined) toks.push({ t: 'str', v: strs[+m[2]], sp });
    else if (m[3] !== undefined) toks.push({ t: 'id', v: m[3], sp });
    else toks.push({ t: 'op', v: m[4], sp });
  }
  return toks;
}
class Conta {
  constructor(toks, refs, parser) { this.t = toks; this.i = 0; this.refs = refs; this.p = parser; }
  alvo(oque) { // nome de objeto: zé, isso, jogador, inimigo...
    let x = this.t[this.i++];
    while (x && x.t === 'id' && ['o', 'a', 'do', 'da', 'de'].includes(x.v)) x = this.t[this.i++];
    if (!x || x.t !== 'id') throw erro(`Faltou ${oque || 'o nome de um objeto'}`);
    return this.p.alvo(x.v);
  }
  peek(k = 0) { return this.t[this.i + k]; }
  acabou() { return this.i >= this.t.length; }
  eId(v) { const x = this.peek(); return x && x.t === 'id' && x.v === v; }
  eOp(v) { const x = this.peek(); return x && x.t === 'op' && x.v === v; }
  expr() { if (this.acabou()) throw erro('Faltou um valor aqui'); return this.ou(); }
  ou() { let a = this.e(); while (this.eId('ou')) { this.i++; a = { t: 'bin', op: 'ou', a, b: this.e() }; } return a; }
  e() { let a = this.nao(); while (this.eId('e')) { this.i++; a = { t: 'bin', op: 'e', a, b: this.nao() }; } return a; }
  nao() { if (this.eId('nao')) { this.i++; return { t: 'nao', a: this.nao() }; } return this.cmp(); }
  cmp() {
    const a = this.soma(), x = this.peek();
    if (x && x.t === 'op' && ['=', '==', '!=', '<', '>', '<=', '>='].includes(x.v)) { this.i++; return { t: 'bin', op: x.v === '==' ? '=' : x.v, a, b: this.soma() }; }
    return a;
  }
  soma() {
    let a = this.mult();
    for (;;) {
      const x = this.peek(), y = this.peek(1);
      if (!x || x.t !== 'op' || (x.v !== '+' && x.v !== '-')) break;
      if (x.v === '-' && x.sp && y && !y.sp) break; // "3 -2" = dois números
      this.i++; a = { t: 'bin', op: x.v, a, b: this.mult() };
    }
    return a;
  }
  mult() {
    let a = this.un();
    while (this.peek() && this.peek().t === 'op' && ['*', '/', '%'].includes(this.peek().v)) { const op = this.t[this.i++].v; a = { t: 'bin', op, a, b: this.un() }; }
    return a;
  }
  un() { if (this.eOp('-')) { this.i++; return { t: 'neg', a: this.un() }; } return this.prim(); }
  prim() {
    const x = this.t[this.i++];
    if (!x) throw erro('A linha acabou antes da hora');
    if (x.t === 'num' || x.t === 'str') return { t: 'val', v: x.v };
    if (x.t === 'op') {
      if (x.v === '(') { const e = this.expr(); if (!this.eOp(')')) throw erro('Faltou fechar o parêntese'); this.i++; return e; }
      throw erro(`Não esperava "${x.v}" aqui`);
    }
    const w = x.v;
    if (w === 'verdadeiro' || w === 'sim') return { t: 'val', v: true };
    if (w === 'falso') return { t: 'val', v: false };
    if (w === 'aleatorio' || w === 'sorteio') {
      if (this.eId('entre')) this.i++;
      const a = this.un(); if (this.eId('e')) this.i++;
      return { t: 'aleat', a, b: this.un() };
    }
    if (w === 'quantos' || w === 'quantas') return { t: 'quantos', coisa: this.alvo('o que contar (ex: quantos inimigos)') };
    if (w === 'tecla') { const k = this.t[this.i++]; if (!k) throw erro('Faltou qual tecla'); return { t: 'tecla', k: nomeTecla(String(k.v)) }; }
    if (w === 'existe') return { t: 'existe', a: this.alvo() };
    if (w === 'distancia') { // distância de A até B  /  distância até B (de "isso")
      let a = 'isso';
      if (this.eId('de') || this.eId('do') || this.eId('da')) { this.i++; a = this.alvo(); }
      else if (!this.eId('ate') && !this.eId('para') && !this.eId('pro')) a = this.alvo();
      if (this.eId('ate') || this.eId('para') || this.eId('pro') || this.eId('e')) this.i++;
      return { t: 'distancia', a, b: this.alvo('até onde (ex: distância até jogador)') };
    }
    // zé.vida   /   isso.x
    const prox = this.peek();
    if (prox && prox.t === 'op' && prox.v === '.' && this.p) {
      const alvo = this.p.alvo(w); this.i++;
      const p = this.t[this.i++];
      if (!p || p.t !== 'id') throw erro('Depois do ponto vem o nome da propriedade (ex: zé.vida)');
      return { t: 'prop', alvo, p: p.v };
    }
    // zé está tocando jogador
    if (this.p && this.p.ehAlvo(w)) {
      const k = this.peek(), k2 = this.peek(1);
      if ((k && k.t === 'id' && /^(tocando|toca|encostando)$/.test(k.v)) || (k && k.v === 'esta' && k2 && /^(tocando|encostando)$/.test(k2.v))) {
        this.i += k.v === 'esta' ? 2 : 1; if (this.eId('em') || this.eId('no') || this.eId('na')) this.i++;
        return { t: 'tocando', a: this.p.alvo(w), b: this.alvo() };
      }
    }
    const coisa = coisaDe(w);
    if (coisa) {
      const prox = this.peek();
      if (prox && prox.t === 'id' && /^(pegos|pegas|pegados|pegadas|coletados|coletadas)$/.test(prox.v)) { this.i++; return { t: 'pegos', coisa }; }
      if (prox && prox.t === 'id' && /^(derrotados|derrotadas)$/.test(prox.v)) { this.i++; return { t: 'derrotados', coisa }; }
    }
    if (CORES[w] && !this.p?.declaradas.has(w)) return { t: 'val', v: CORES[w] };
    this.refs.push(w);
    return { t: 'var', v: w };
  }
}

function coisaDe(w) { if (COISAS[w]) return w; if (PLURAL[w]) return PLURAL[w]; return null; }
function nomeTecla(k) {
  k = semAcento(k);
  const m = { space: 'espaco', ' ': 'espaco', seta_cima: 'cima' };
  return m[k] || k;
}

// ---------------- o parser ----------------
class Parser {
  constructor(src) {
    this.L = [];
    src.split('\n').forEach((raw, i) => {
      const s = tirarComentario(raw);
      if (!s.trim()) return;
      this.L.push({ n: i + 1, ind: s.match(/^[ \t]*/)[0].replace(/\t/g, '  ').length, raw: s.trim() });
    });
    this.i = 0; this.erros = []; this.refs = []; this.declaradas = new Set(PRONTAS);
    this.linhaAtual = 0; this.prof = 0; this.emModelo = false;
    // primeiro passa o olho no código todo pra conhecer os nomes inventados
    this.nomes = new Set(['jogador', 'isso', 'aquilo']); this.ensinados = new Map(); this.modelos = new Set();
    const limpo = w => w.replace(/[^a-z0-9_]/g, '');
    for (const l of this.L) {
      const s = semAcento(l.raw).replace(/["'“”][^"'“”]*["'“”]/g, ' ');
      for (const m of s.matchAll(/\bchamad[oa]s? (\S+)/g)) { const n = limpo(m[1]); if (n) this.nomes.add(n); }
      let m;
      if ((m = s.match(/^ensinar (.+?)\s*:/))) { const [nome, ...params] = m[1].split(/\s+/).map(limpo).filter(Boolean); if (nome) { this.ensinados.set(nome, params); params.forEach(p => this.declaradas.add(p)); } }
      if ((m = s.match(/^modelo (\S+?)\s*:/))) { const n = limpo(m[1]); if (n) this.modelos.add(n); }
    }
  }
  ehAlvo(w) { return this.nomes.has(w) || !!coisaDe(w) || this.modelos.has(w); }
  alvo(w) {
    if (this.nomes.has(w)) return w;
    if (this.modelos.has(w)) return w;
    const c = coisaDe(w); if (c) return c;
    throw erro(`Não existe nada chamado "${w}" (pra dar nome: criar inimigo chamado ${w})`);
  }
  aviso(n, msg) { this.erros.push({ linha: n, msg, nivel: 'aviso' }); }
  programa() {
    const corpo = this.bloco(this.L.length ? this.L[0].ind : 0);
    for (const r of this.refs) if (!this.declaradas.has(r.v))
      this.erros.push({ linha: r.n, msg: `Não conheço "${r.v}". Se for uma variável, crie ela no começo, tipo:  ${r.v}: 0`, nivel: 'erro' });
    this.erros.sort((a, b) => a.linha - b.linha);
    return { corpo, erros: this.erros };
  }
  bloco(ind) {
    const corpo = [];
    while (this.i < this.L.length) {
      const l = this.L[this.i];
      if (l.ind < ind) break;
      this.i++;
      if (l.ind > ind) { this.erros.push({ linha: l.n, msg: 'Esta linha está mais pra direita sem motivo (apaga os espaços do começo)', nivel: 'erro' }); this.pularFilhos(l.ind); continue; }
      try {
        this.linhaAtual = l.n;
        const no = this.linha(l);
        if (!no) continue;
        no.n = l.n;
        if (no.tipo === 'senao' || no.tipo === 'senaose') this.anexarSenao(corpo, no);
        else corpo.push(no);
      } catch (e) {
        if (!(e instanceof ErroFC)) throw e;
        this.erros.push({ linha: l.n, msg: e.message, nivel: 'erro' });
        this.pularFilhos(l.ind);
      }
    }
    return corpo;
  }
  pularFilhos(ind) { while (this.i < this.L.length && this.L[this.i].ind > ind) this.i++; }
  anexarSenao(corpo, no) {
    let alvo = corpo[corpo.length - 1];
    if (!alvo || alvo.tipo !== 'se') throw erro('Esse "senão" não tem um "se" logo antes');
    while (alvo.senao && alvo.senao.length === 1 && alvo.senao[0].encadeado) alvo = alvo.senao[0];
    if (alvo.senao) throw erro('Esse "se" já tem um "senão"');
    if (no.tipo === 'senao') alvo.senao = no.corpo;
    else { no.tipo = 'se'; no.encadeado = true; alvo.senao = [no]; }
  }
  filhos(l) {
    if (this.i < this.L.length && this.L[this.i].ind > l.ind) {
      this.prof++; const c = this.bloco(this.L[this.i].ind); this.prof--; return c;
    }
    throw erro('Faltou o que fazer! Escreva embaixo desta linha, um pouco mais pra direita (2 espaços)');
  }
  conta(s, strs) {
    const toks = tokensConta(s, strs), refs = [];
    const c = new Conta(toks, refs, this);
    const e = c.expr();
    if (!c.acabou()) throw erro(`Sobrou "${c.peek().v}" no fim da conta`);
    for (const v of refs) this.refs.push({ v, n: this.linhaAtual });
    return e;
  }
  listaContas(s, strs) { // "3 -2 5" vira três números
    const toks = tokensConta(s, strs), refs = [], c = new Conta(toks, refs, this), lista = [];
    while (!c.acabou()) lista.push(c.soma());
    for (const v of refs) this.refs.push({ v, n: this.linhaAtual });
    return lista;
  }
  cor(w, strs) {
    if (!w) throw erro('Faltou a cor');
    if (w.startsWith('§')) return strs[+w.slice(1)];
    if (CORES[w]) return CORES[w];
    throw erro(`Não conheço a cor "${w}". Cores: ${Object.keys(CORES).join(', ')}`);
  }

  linha(l) {
    const s = semAcento(l.raw);
    if (this.emModelo) return this.parte(preparar(l.raw));
    if (/^(quando|a cada|se|senao|sempre|repetir|para cada|ensinar|modelo)\b/.test(s)) {
      const { cab, resto } = dividirDoisPontos(l.raw);
      const p = preparar(cab);
      const no = this.cabecalho(p, l);
      if (no.tipo === 'modelo') {
        if (this.prof > 0) throw erro('"modelo" fica no começo da linha, fora de outros blocos');
        this.emModelo = true;
        // modelo pode começar vazio (sem nenhuma peça embaixo)
        const temPecas = this.i < this.L.length && this.L[this.i].ind > l.ind;
        try { no.partes = temPecas ? this.filhos(l) : []; } finally { this.emModelo = false; }
        const tipo = no.partes.find(x => x.tipo === 'tipoModelo');
        no.fim = Math.max(l.n, ...no.partes.map(x => x.n || 0)); no.cabecalho = l.raw;
        no.cat = tipo ? tipo.cat : 'solido';
        no.partes = no.partes.filter(x => x.tipo === 'parte');
        return no;
      }
      if (resto.trim()) { const a = this.acao(preparar(resto.trim()), l); a.n = l.n; no.corpo = [a]; }
      else no.corpo = this.filhos(l);
      return no;
    }
    return this.acao(preparar(l.raw), l);
  }
  parte(p) { // uma peça de modelo:  cubo em 0 1 0 tamanho 1 2 1 cor verde
    const t = p.t; let m;
    if ((m = t.match(/^tipo (.+)$/))) {
      const v = m[1];
      const cat = /inimig/.test(v) ? 'inimigo' : /peg|colet/.test(v) ? 'coletavel' : /perig/.test(v) ? 'perigo' : /solid/.test(v) ? 'solido' : /enfeit|fantasma|nada/.test(v) ? 'enfeite' : null;
      if (!cat) throw erro('Tipos de modelo: sólido, inimigo, pegável, perigoso ou enfeite');
      return { tipo: 'tipoModelo', cat };
    }
    const tk = t.split(' ');
    const forma = coisaDe(tk[0]);
    if (!FORMAS.includes(forma)) throw erro(`Peças de modelo: ${FORMAS.join(', ')} (e "tipo: inimigo" pra dizer o que ele é)`);
    const no = { tipo: 'parte', forma, pos: [0, 0, 0], tam: [1, 1, 1], cor: '#9e9e9e', giro: [0, 0, 0] };
    let i = 1;
    const nums = () => { const r = []; while (i < tk.length && /^-?\d/.test(tk[i])) r.push(+tk[i++]); return r; };
    while (i < tk.length) {
      const k = tk[i++];
      if (k === 'em') { const n = nums(); if (n.length !== 3) throw erro('Na peça, a posição tem 3 números: lado, altura, frente (ex: em 0 1 0)'); no.pos = n; }
      else if (k === 'tamanho') { const n = nums(); if (n.length === 1) no.tam = [n[0], n[0], n[0]]; else if (n.length === 3) no.tam = n; else throw erro('Tamanho: 1 número (igual pra tudo) ou 3 (largura, altura, fundura)'); }
      else if (k === 'cor') no.cor = this.cor(tk[i++], p.strs);
      else if (k === 'giro' || k === 'girado') { const n = nums(); no.giro = n.length === 3 ? n : [0, n[0] || 0, 0]; }
      else throw erro(`Não entendi "${k}" nessa peça (use: em, tamanho, cor, giro)`);
    }
    return no;
  }

  cabecalho(p, l) {
    const t = p.t; let m;
    const topo = () => { if (this.prof > 0) throw erro('"quando" e "a cada" ficam no começo da linha, fora de outros blocos'); };
    const coisaEv = w => {
      if (w.startsWith('§')) return 'emoji:' + p.strs[+w.slice(1)];
      return this.alvo(w.replace(/^(um|uma|o|a|os|as|no|na|nos|nas|em) /, ''));
    };
    if ((m = t.match(/^modelo (\S+)$/))) return { tipo: 'modelo', nome: m[1] };
    if ((m = t.match(/^ensinar (\S+)(.*)$/))) {
      topo(); return { tipo: 'ensinar', nome: m[1], params: m[2].trim() ? m[2].trim().split(' ') : [] };
    }
    if ((m = t.match(/^para cada (?:um |uma )?(?:dos |das |de )?(\S+)$/))) return { tipo: 'cada', alvo: this.alvo(m[1]) };
    if ((m = t.match(/^quando (?!eu |o jogador )(?:o |a )?(\S+) (?:tocar|encostar|bater) (?:n[oa]s? |em |um |uma |o |a )?(\S+)$/))) {
      topo(); return { tipo: 'evento', ev: 'toque2', a: this.alvo(m[1]), b: coisaEv(m[2]) };
    }
    if ((m = t.match(/^quando (?:eu |o jogador )?(?:pegar|coletar) (?:um |uma |o |a |os |as )?(\S+)$/))) { topo(); return { tipo: 'evento', ev: 'pegar', coisa: coisaEv(m[1]) }; }
    if ((m = t.match(/^quando (?:eu |o jogador )?(?:tocar|encostar|bater) (?:n[oa]s? |em |um |uma |o |a )?(\S+)$/))) { topo(); return { tipo: 'evento', ev: 'tocar', coisa: coisaEv(m[1]) }; }
    if ((m = t.match(/^quando (?:eu |o jogador )?(?:derrotar|pisar n[oa]|matar) (?:um |uma |o |a )?(\S+)$/))) { topo(); return { tipo: 'evento', ev: 'derrotar', coisa: coisaEv(m[1]) }; }
    if ((m = t.match(/^quando (?:eu )?apertar (?:a tecla |o )?(\S+)$/))) { topo(); return { tipo: 'evento', ev: 'apertar', tecla: m[1].startsWith('§') ? nomeTecla(p.strs[+m[1].slice(1)]) : nomeTecla(m[1]) }; }
    if ((m = t.match(/^quando (?:completar|terminar|cumprir) (?:o )?objetivo ?(\d+)?$/))) { topo(); return { tipo: 'evento', ev: 'objetivo', num: m[1] ? +m[1] : 0 }; }
    if (/^quando (?:o jogo )?(?:comecar|iniciar)$/.test(t)) { topo(); return { tipo: 'evento', ev: 'comecar' }; }
    if (/^quando (?:as )?vidas acabarem$/.test(t)) { topo(); return { tipo: 'evento', ev: 'semvidas' }; }
    if ((m = t.match(/^quando (.+)$/))) { topo(); return { tipo: 'evento', ev: 'cond', cond: this.conta(m[1], p.strs) }; }
    if ((m = t.match(/^a cada (.+?) (?:segundos?|seg|s)$/))) { topo(); return { tipo: 'evento', ev: 'cada', seg: this.conta(m[1], p.strs) }; }
    if (/^sempre$/.test(t)) { topo(); return { tipo: 'evento', ev: 'sempre' }; }
    if ((m = t.match(/^senao se (.+)$/))) return { tipo: 'senaose', cond: this.conta(m[1], p.strs), senao: null };
    if (t === 'senao') return { tipo: 'senao' };
    if ((m = t.match(/^se (.+)$/))) return { tipo: 'se', cond: this.conta(m[1], p.strs), senao: null };
    if ((m = t.match(/^repetir (.+?) (?:vezes|vez)$/))) return { tipo: 'repetir', vezes: this.conta(m[1], p.strs) };
    throw erro('Não entendi esse bloco');
  }

  acao(p, l) {
    const t = p.t, S = p.strs; let m;
    const soNoTopo = nome => { if (this.prof > 0) throw erro(`"${nome}" só pode ficar no começo do jogo, fora dos blocos`); };

    if ((m = t.match(/^jogo (.+)$/))) {
      soNoTopo('jogo');
      const v = m[1];
      if (v === 'tresd') return { tipo: 'jogo', modo: '3d', cfg: true };
      if (/^doisd( de lado)?$|^de lado$/.test(v)) return { tipo: 'jogo', modo: 'lado', cfg: true };
      if (/^doisd de cima$|^de cima$/.test(v)) return { tipo: 'jogo', modo: 'cima', cfg: true };
      throw erro('O jogo pode ser: 3D, 2D de lado ou 2D de cima');
    }
    if ((m = t.match(/^(?:ceu|fundo|cor do ceu) (.+)$/))) {
      const v = m[1];
      if (CEUS[v]) return { tipo: 'ceu', cor: CEUS[v], preset: v, cfg: true };
      return { tipo: 'ceu', cor: this.cor(v, S), cfg: true };
    }
    if ((m = t.match(/^chao (.+)$/))) {
      soNoTopo('chão');
      const v = m[1];
      if (/^(nenhum|nada|sem chao)$/.test(v)) return { tipo: 'chao', nenhum: true, cfg: true };
      const nums = (v.match(/-?\d+(?:\.\d+)?/g) || []).map(Number);
      const palavras = v.replace(/-?\d+(?:\.\d+)?/g, ' ').split(' ').filter(w => w && !['por', 'x', 'de', 'com'].includes(w));
      let cor = null, mat = 'grama';
      for (const w of palavras) {
        if (MATERIAIS[w]) { mat = w; cor = MATERIAIS[w]; }
        else if (CORES[w] || w.startsWith('§')) { mat = 'cor'; cor = this.cor(w, S); }
        else throw erro(`Não conheço o chão "${w}". Chãos: ${Object.keys(MATERIAIS).join(', ')} (ou uma cor)`);
      }
      return { tipo: 'chao', mat, cor: cor || MATERIAIS.grama, w: nums[0] || null, d: nums[1] || nums[0] || null, cfg: true };
    }
    if ((m = t.match(/^luz (dia|noite|tarde|por do sol|forte|fraca)$/))) return { tipo: 'luz', v: m[1], cfg: true };
    if ((m = t.match(/^gravidade (.+)$/))) return { tipo: 'gravidade', e: this.conta(m[1], S), cfg: true };
    if ((m = t.match(/^objetivo ?(\d*) (.+)$/))) { soNoTopo('objetivo'); return this.objetivo(m[1] ? +m[1] : 0, m[2], l); }
    if ((m = t.match(/^mostrar (?!mensagem)(.+)$/))) {
      const itens = m[1].split(/ , | e |,| /).map(x => x.trim()).filter(Boolean);
      for (const v of itens) { if (!/^[a-z_][a-z0-9_]*$/.test(v)) throw erro(`Não dá pra mostrar "${v}"`); this.refs.push({ v, n: this.linhaAtual }); }
      return { tipo: 'mostrar', itens, cfg: true };
    }
    if ((m = t.match(/^inimigos (?:vao |devem )?(.+)$/))) {
      const v = m[1];
      if (/^(?:seguem|perseguem|seguir|perseguir|correm atras)/.test(v)) return { tipo: 'inimigos', comp: 'segue', cfg: true };
      if (/^(?:andam|andar|passeiam)/.test(v)) return { tipo: 'inimigos', comp: 'anda', cfg: true };
      if (/^(?:ficam parados|parados|param|ficar parados)/.test(v)) return { tipo: 'inimigos', comp: 'parado', cfg: true };
      throw erro('Inimigos podem: seguir o jogador, andar sozinhos ou ficar parados');
    }
    if ((m = t.match(/^velocidade dos inimigos (.+)$/))) return { tipo: 'velinimigos', e: this.conta(m[1], S), cfg: true };
    if ((m = t.match(/^velocidade do jogador (.+)$/))) return { tipo: 'veljogador', e: this.conta(m[1], S) };
    if ((m = t.match(/^pulo do jogador (.+)$/))) return { tipo: 'pulo', e: this.conta(m[1], S) };
    if ((m = t.match(/^(?:jogador (?:comeca |fica |vai )?(?:em|para|pra)|(?:levar|teleportar|mandar) (?:o )?jogador (?:para|pra|em|ate)) (.+)$/))) {
      const pos = this.listaContas(m[1], S);
      if (pos.length < 2 || pos.length > 3) throw erro('A posição tem 2 ou 3 números (ex: jogador em: 0 0)');
      return { tipo: 'jogadorem', pos };
    }
    if (/^voltar (?:o jogador )?(?:ao|pro|para o|pra o) (?:inicio|comeco)$/.test(t)) return { tipo: 'voltar' };
    if ((m = t.match(/^jogador (?:e |sera |vai ser )?(?:um |uma )?(.+)$/))) {
      const tk = m[1].split(' '); const no = { tipo: 'jogador', modelo: null, emoji: null, cor: null, tamanho: null, cfg: true };
      for (let i = 0; i < tk.length; i++) {
        const w = tk[i];
        if (w.startsWith('§')) { no.modelo = 'emoji'; no.emoji = S[+w.slice(1)]; }
        else if (w === 'emoji') continue;
        else if (MODELOS_JOGADOR.includes(w)) no.modelo = w;
        else if (this.modelos.has(w)) no.modelo = 'modelo:' + w;
        else if (w === 'cor') no.cor = this.cor(tk[++i], S);
        else if (w === 'tamanho') { const n = +tk[++i]; if (isNaN(n)) throw erro('Depois de "tamanho" vem um número'); no.tamanho = n; }
        else throw erro(`Não conheço o jogador "${w}". Jogadores: ${MODELOS_JOGADOR.join(', ')} ou um emoji entre aspas`);
      }
      if (!no.modelo && !no.cor && !no.tamanho) throw erro('Faltou dizer qual é o jogador (ex: jogador: sapo)');
      return no;
    }
    if ((m = t.match(/^camera (?:em |fica |na |no |de )?(.+)$/))) {
      const v = m[1]; const nums = (v.match(/-?\d+(?:\.\d+)?/g) || []).map(Number);
      let tipo;
      if (/primeira/.test(v)) tipo = 'primeira';
      else if (/fixa/.test(v)) { tipo = 'fixa'; if (nums.length !== 3) throw erro('Câmera fixa precisa de 3 números (ex: câmera fixa em 0 10 20)'); return { tipo: 'camera', cam: 'fixa', pos: nums, cfg: true }; }
      else if (/atras|terceira/.test(v)) tipo = 'atras';
      else if (/cima/.test(v)) tipo = 'cima';
      else if (/lado/.test(v)) tipo = 'lado';
      else throw erro('Câmera pode ficar: atrás do jogador, em cima do jogador, do lado do jogador, primeira pessoa ou fixa');
      return { tipo: 'camera', cam: tipo, dist: nums.length ? nums[nums.length - 1] : null, cfg: true };
    }
    if ((m = t.match(/^criar (.+)$/))) return this.criar(m[1], S);

    // ----- controle total: mandar em cada objeto -----
    const DIR = '(frente|tras|esquerda|direita|cima|baixo)';
    if ((m = t.match(new RegExp(`^mover (?:o |a )?(\\S+) (?:para |pra )?(?:a |o )?${DIR} (.+)$`)))) return { tipo: 'mover', alvo: this.alvo(m[1]), dir: m[2], e: this.conta(m[3], S) };
    if ((m = t.match(/^mover (?:o |a )?(\S+) (.+)$/))) {
      const vec = this.listaContas(m[2], S);
      if (vec.length < 2 || vec.length > 3) throw erro('Use: mover zé para frente 2   ou   mover zé 2 0 (quanto anda pro lado e pra frente)');
      return { tipo: 'mover', alvo: this.alvo(m[1]), vec };
    }
    if ((m = t.match(new RegExp(`^(?:andar|correr|voar|ir) (?:o |a )?(\\S+)(?: (?:para |pra )?(?:a |o )?${DIR})?$`)))) return { tipo: 'andar', alvo: this.alvo(m[1]), dir: m[2] || 'frente' };
    if ((m = t.match(/^(?:andar|correr|voar|ir|fugir) (?:o |a )?(\S+) (?:para |pra )?longe d[oae]s? (?:o |a )?(\S+)$/))) return { tipo: 'andar', alvo: this.alvo(m[1]), longe: this.alvo(m[2]) };
    if ((m = t.match(/^(?:andar|correr|voar|ir) (?:o |a )?(\S+) (?:ate|para|pra|atras d[oae]s?|na direcao d[oae]s?|em direcao a) (?:o |a )?(\S+)$/))) return { tipo: 'andar', alvo: this.alvo(m[1]), ate: this.alvo(m[2]) };
    if ((m = t.match(/^pular(?: (?:o |a )?(\S+))?$/))) return { tipo: 'pular', alvo: m[1] ? this.alvo(m[1]) : 'jogador' };
    if ((m = t.match(/^girar (?:o |a )?(\S+) (.+?)(?: graus?)?$/))) return { tipo: 'girar', alvo: this.alvo(m[1]), e: this.conta(m[2], S) };
    if ((m = t.match(/^(?:virar|olhar) (?:o |a )?(\S+) (?:para|pra) (?:o |a )?(\S+)$/))) return { tipo: 'virar', alvo: this.alvo(m[1]), para: this.alvo(m[2]) };
    if ((m = t.match(/^derrotar (?:o |a )?(\S+)$/))) return { tipo: 'derrotar', alvo: this.alvo(m[1]) };
    if ((m = t.match(/^(?:levar|teleportar|mandar) (?:o |a )?(\S+) (?:para|pra|ate|em) (?:o |a )?(.+)$/))) {
      const alvo = this.alvo(m[1]), resto = m[2];
      if (/^[a-z_]\S*$/.test(resto) && this.ehAlvo(resto)) return { tipo: 'levar', alvo, ate: this.alvo(resto) };
      const pos = this.listaContas(resto, S);
      if (pos.length < 2 || pos.length > 3) throw erro('Use: levar zé para 0 0   ou   levar zé até jogador');
      return { tipo: 'levar', alvo, pos };
    }
    if ((m = t.match(/^([a-z_][a-z0-9_]*)\.([a-z_][a-z0-9_]*) ?(=|\+|-|\*|\/)=? ?(.+)$/))) {
      return { tipo: 'prop', alvo: this.alvo(m[1]), p: m[2], op: m[3], e: this.conta(m[4], S) };
    }
    // comandos inventados com "ensinar"
    const pw = t.split(' ')[0];
    if (this.ensinados.has(pw)) {
      const params = this.ensinados.get(pw), resto = t.slice(pw.length).trim();
      const args = resto ? this.listaContas(resto, S) : [];
      if (args.length !== params.length) throw erro(`"${pw}" precisa de ${params.length} valor(es)${params.length ? ': ' + params.join(', ') : ''}`);
      return { tipo: 'chamar', nome: pw, args };
    }
    if ((m = t.match(/^(?:som|tocar som|tocar o som) (\S+)$/))) {
      if (!SONS.includes(m[1])) throw erro(`Não tenho o som "${m[1]}". Sons: ${SONS.join(', ')}`);
      return { tipo: 'som', som: m[1] };
    }
    if ((m = t.match(/^(?:ganhar|vencer|voce ganhou)(?: (.+))?$/))) return { tipo: 'ganhar', e: m[1] ? this.conta(m[1], S) : null };
    if ((m = t.match(/^(?:perder|voce perdeu|game over)(?: (.+))?$/))) return { tipo: 'perder', e: m[1] ? this.conta(m[1], S) : null };
    if ((m = t.match(/^(?:mensagem|dizer|falar|escrever|mostrar mensagem|aviso) (.+)$/))) return { tipo: 'mensagem', e: this.conta(m[1], S) };
    if ((m = t.match(/^esperar (.+?)(?: (?:segundos?|seg|s))?$/))) return { tipo: 'esperar', e: this.conta(m[1], S) };
    if ((m = t.match(/^(?:remover|apagar|sumir com|destruir) (.+)$/))) {
      let w = m[1].replace(/^(todos|todas) /, '').replace(/^(os|as|o|a) /, '');
      if (/^(isto|ele|ela|esse|essa)$/.test(w)) w = 'isso';
      if (w === 'jogador') throw erro('Não dá pra remover o jogador (use "perder")');
      return { tipo: 'remover', alvo: w.startsWith('§') ? 'emoji:' + S[+w.slice(1)] : this.alvo(w) };
    }
    if (/^(recomecar|reiniciar)( o jogo)?$/.test(t)) return { tipo: 'recomecar' };
    if ((m = t.match(/^(?:completar|terminar|cumprir) (?:o )?objetivo(?: ?(\d+))?$/))) return { tipo: 'completar', num: m[1] ? +m[1] : 0 };
    if (/^tremer( a)? tela$/.test(t)) return { tipo: 'tremer' };
    if ((m = t.match(/^([a-z_][a-z0-9_]*) ?(\+|-|\*|\/)=? ?(.+)$/)) && !PRIMEIRAS.slice(0, 14).includes(m[1])) {
      this.refs.push({ v: m[1], n: this.linhaAtual });
      return { tipo: 'mudar', nome: m[1], op: m[2], e: this.conta(m[3], S) };
    }
    if ((m = t.match(/^([a-z_][a-z0-9_]*) ?=? ?(.+)$/)) && !['criar', 'quando', 'se', 'camera', 'jogador', 'jogo', 'chao', 'ceu', 'som', 'objetivo'].includes(m[1])) {
      let e;
      try { e = this.conta(m[2], S); } catch (er) { throw this.naoEntendi(t); }
      this.declaradas.add(m[1]);
      return { tipo: 'var', nome: m[1], e };
    }
    throw this.naoEntendi(t);
  }
  naoEntendi(t) {
    const p = t.split(' ')[0];
    let melhor = null, md = 3;
    for (const c of PRIMEIRAS) { const d = distancia(p, c); if (d < md) { md = d; melhor = c; } }
    if (melhor && melhor !== p) return erro(`Não entendi "${p}". Você quis dizer "${melhor}"?`);
    return erro('Não entendi essa linha. Dá uma olhada no Manual 📖');
  }

  criar(v, S) {
    const tk = v.split(' '); let i = 0;
    const no = { tipo: 'criar', qtd: 1, coisa: null, emoji: null, pos: null, espalhar: false, perto: false, ate: null, tamanho: null, cor: null, comp: null };
    if (/^\d+$/.test(tk[0])) { no.qtd = +tk[0]; i++; }
    else if (NUMS[tk[0]]) { no.qtd = NUMS[tk[0]]; i++; }
    else if (/^\S+$/.test(tk[0]) && !coisaDe(tk[0]) && !this.modelos.has(tk[0]) && !tk[0].startsWith('§')) {
      try { const e = this.listaContas(tk[0], S); if (e.length === 1) { no.qtdE = e[0]; i++; } } catch (e) { }
    }
    const w = tk[i++];
    if (!w) throw erro('Faltou o que criar (ex: criar 10 moedas espalhadas)');
    if (w.startsWith('§')) { no.coisa = 'emoji'; no.emoji = S[+w.slice(1)]; }
    else if (this.modelos.has(w)) no.coisa = 'modelo:' + w;
    else { no.coisa = coisaDe(w); if (!no.coisa) throw erro(`Não sei criar "${w}". Coisas: ${Object.keys(COISAS).join(', ')} (ou um emoji entre aspas, ou um modelo seu)`); }
    const CHAVES = new Set(['em', 'tamanho', 'cor', 'de', 'ate', 'que', 'perto', 'pelo', 'parado', 'parados', 'parada', 'paradas', 'no', 'na', 'chamado', 'chamada', 'chamados', 'chamadas', 'com', 'e', 'solido', 'solida', 'solidos', 'solidas', 'perigoso', 'perigosa', 'perigosos', 'perigosas', 'pegavel', 'pegaveis', 'fantasma', 'fantasmas', 'inimigo', 'inimigos', 'girado', 'girada', 'giro']);
    const ler = () => { const ini = i; while (i < tk.length && !CHAVES.has(tk[i]) && !/^espalhad/.test(tk[i])) i++; return tk.slice(ini, i).join(' '); };
    no.props = []; let emCom = false;
    while (i < tk.length) {
      const k = tk[i++];
      if (/^espalhad/.test(k) || k === 'aleatorios' || k === 'aleatorio') no.espalhar = true;
      else if (/^chamad/.test(k)) { no.nome = (tk[i++] || '').replace(/[^a-z0-9_]/g, ''); if (!no.nome) throw erro('Faltou o nome depois de "chamado"'); }
      else if ((k === 'na' || k === 'no') && tk[i] === 'frente') { i++; if (/^d[oae]$/.test(tk[i])) i++; const a = tk[i++]; if (!a) throw erro('Na frente de quem? (ex: na frente do jogador)'); no.frente = this.alvo(a); }
      else if ((k === 'em' || k === 'no' || k === 'na') && tk[i] === 'cima') { i++; if (/^d[oae]$/.test(tk[i])) i++; const a = tk[i++]; if (!a) throw erro('Em cima de quem? (ex: em cima do jogador)'); no.emcima = this.alvo(a); }
      else if (k === 'pelo' || k === 'no' || k === 'na') { const r = ler(); if (!/mapa|chao|mundo/.test(r) && r) throw erro(`Não entendi "${k} ${r}"`); no.espalhar = true; }
      else if (k === 'com' || (k === 'e' && emCom)) {
        emCom = true; const p = tk[i++]; if (!p) throw erro('Faltou o nome depois de "com" (ex: com vida 3)');
        const r = ler(); if (!r) throw erro(`Faltou o valor de "${p}" (ex: com ${p} 3)`);
        no.props.push([p, this.conta(r, S)]);
      }
      else if (/^solid/.test(k)) no.cat = 'solido';
      else if (/^perigos/.test(k)) no.cat = 'perigo';
      else if (/^pegave/.test(k)) no.cat = 'coletavel';
      else if (/^fantasma/.test(k)) no.cat = 'fantasma';
      else if (/^inimig/.test(k)) no.cat = 'inimigo';
      else if (/^girad|^giro$/.test(k)) { const r = ler(); no.giro = this.conta(r, S); }
      else if (k === 'perto') { if (tk[i] === 'do' || tk[i] === 'de') i++; if (tk[i] === 'jogador') i++; no.perto = true; }
      else if (k === 'em') { const r = ler(); no.pos = this.listaContas(r, S); if (no.pos.length < 2 || no.pos.length > 3) throw erro('A posição tem 2 ou 3 números (ex: em 5 3)'); }
      else if (k === 'de') { const r = ler(); no.de = this.listaContas(r, S); if (tk[i] !== 'ate') throw erro('Faltou o "até" (ex: criar parede de 0 0 até 10 0)'); }
      else if (k === 'ate') { const r = ler(); no.ate = this.listaContas(r, S); if (!no.de || no.de.length !== 2 || no.ate.length !== 2) throw erro('Use: de X Y até X Y (dois números de cada lado)'); }
      else if (k === 'tamanho') {
        const r = ler(), l = this.listaContas(r, S);
        if (l.length === 1) no.tamanho = l[0]; else if (l.length === 3) no.tam3 = l; else throw erro('Tamanho: 1 número, ou 3 (largura, altura, fundura)');
      }
      else if (k === 'cor') { no.cor = this.cor(tk[i++], S); }
      else if (k === 'que') { const r = ler(); if (/segu|persegu|corr/.test(r)) no.comp = 'segue'; else if (/anda|passe/.test(r)) no.comp = 'anda'; else if (/para/.test(r)) no.comp = 'parado'; else throw erro(`Não entendi "que ${r}"`); }
      else if (/^parad/.test(k)) no.comp = 'parado';
      else throw erro(`Não entendi "${k}" nesse criar`);
    }
    return no;
  }

  objetivo(num, t, l) {
    const texto = dividirDoisPontos(l.raw).resto.trim() || t;
    const base = { tipo: 'objetivo', num, texto, cfg: true };
    let m;
    const qtd = w => (w === undefined ? null : /^\d+$/.test(w) ? +w : NUMS[w] ?? null);
    if ((m = t.match(/^(?:ir atras d(?:as|os|e|a|o)|pegar|coletar|juntar|achar|encontrar|buscar) (?:todas (?:as )?|todos (?:os )?|as |os )?(?:(\d+|[a-z]+) )?(\S+)$/)) && (this.ehAlvo(m[2]) || m[2].startsWith('§'))) {
      const c = m[2].startsWith('§') ? 'emoji:' + this.strsObj(l, m[2]) : this.alvo(m[2]);
      return { ...base, obj: 'pegar', coisa: c, qtd: qtd(m[1]) };
    }
    if ((m = t.match(/^(?:chegar|ir|entrar|tocar) (?:ate )?(?:n[oa] |a |o |ao |em )?(\S+)$/)) && this.ehAlvo(m[1])) return { ...base, obj: 'chegar', coisa: this.alvo(m[1]) };
    if ((m = t.match(/^(?:derrotar|matar|vencer|destruir|pisar em) (?:todos (?:os )?|todas (?:as )?|os |as )?(?:(\d+|[a-z]+) )?(\S+)$/)) && this.ehAlvo(m[2])) return { ...base, obj: 'derrotar', coisa: this.alvo(m[2]), qtd: qtd(m[1]) };
    if ((m = t.match(/^sobreviver (?:por )?(\d+(?:\.\d+)?) (segundos?|s|seg|minutos?|min)$/))) return { ...base, obj: 'sobreviver', seg: +m[1] * (/^m/.test(m[2]) ? 60 : 1) };
    if ((m = t.match(/^(?:fazer|conseguir|ter|chegar a) (\d+) pontos$/))) return { ...base, obj: 'pontos', qtd: +m[1] };
    this.aviso(l.n, 'Objetivo livre: o jogo não sabe quando ele termina. Use "completar objetivo" dentro de um "quando".');
    return { ...base, obj: 'livre' };
  }
  strsObj(l, w) { return preparar(dividirDoisPontos(l.raw).resto || l.raw).strs[+w.slice(1)]; }
}

function analisar(src) { return new Parser(src).programa(); }

const FrogCode = { analisar, ErroFC, FORMAS, CORES, MATERIAIS, CEUS, COISAS, PLURAL, SONS, MODELOS_JOGADOR, semAcento, nomeTecla };
if (typeof module !== 'undefined' && module.exports) module.exports = FrogCode;
else G.FrogCode = FrogCode;
})(typeof window !== 'undefined' ? window : globalThis);
