// Editor do FrogCode (o "VS Code" da linguagem)
'use strict';
const $ = s => document.querySelector(s);
const FC = window.FrogCode, { MANUAL, EXEMPLOS, SUGESTOES } = window.FROG_MANUAL;
const src = $('#src'), hl = $('#hl'), gutter = $('#gutter'), auto = $('#auto');
const esc = s => String(s).replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;');
const sa = FC.semAcento;

// ---------------- caixinha própria (o celular às vezes bloqueia a do navegador) ----------------
function caixinha(msg, { texto = null, ok = 'OK', perigo = false } = {}) {
  return new Promise(resolve => {
    const d = $('#dialogo'), t = $('#dlgTxt'), sim = $('#dlgSim'), nao = $('#dlgNao');
    $('#dlgMsg').textContent = msg;
    t.hidden = texto === null; t.value = texto ?? '';
    sim.textContent = ok; sim.classList.toggle('perigo', perigo); sim.classList.toggle('rodar', !perigo);
    d.hidden = false; setTimeout(() => (texto === null ? sim : t).focus(), 30);
    const fim = v => { d.hidden = true; sim.onclick = nao.onclick = t.onkeydown = null; resolve(v); };
    sim.onclick = () => fim(texto === null ? true : t.value.trim() || null);
    nao.onclick = () => fim(texto === null ? false : null);
    t.onkeydown = e => { if (e.key === 'Enter') sim.onclick(); if (e.key === 'Escape') nao.onclick(); };
  });
}
const pedirNome = (msg, padrao) => caixinha(msg, { texto: padrao });
const confirmar = (msg, ok = 'Apagar') => caixinha(msg, { ok, perigo: true });
async function apagarArquivo(nome) {
  if (!(await confirmar(`Apagar o jogo "${nome.replace(/\.frog$/, '')}"?\nNão dá pra desfazer.`))) return;
  delete E.arquivos[nome]; fecharAba(nome); desenharLateral();
}
async function renomearArquivo(nome) {
  const novo = await pedirNome('Novo nome do jogo:', nome.replace(/\.frog$/, ''));
  if (!novo) return;
  const n2 = nomeLivre(novo); E.arquivos[n2] = E.arquivos[nome]; delete E.arquivos[nome];
  E.abertos = E.abertos.map(a => a === nome ? n2 : a); if (E.ativo === nome) E.ativo = n2;
  src.dataset.arq = ''; guardar(); mostrarAtivo();
}
async function jogoNovo() { const n = await pedirNome('Nome do jogo novo:', 'jogo novo'); if (n) novoArquivo(n, '# ' + n + '\njogo: 3D\njogador: sapo\n'); }

// ---------------- arquivos (guardados no navegador) ----------------
let E = { arquivos: {}, abertos: [], ativo: null, painel: 'prob', lateral: 'arquivos', vista: 'codigo' };
function carregarEstado() {
  try { const s = JSON.parse(localStorage.getItem('frogcode.v1')); if (s && s.arquivos) E = Object.assign(E, s); } catch (e) { }
  if (!Object.keys(E.arquivos).length) {
    E.arquivos['meu jogo.frog'] = EXEMPLOS['caça às moedas.frog'];
    E.abertos = ['📖 Manual', 'meu jogo.frog']; E.ativo = '📖 Manual';
  }
  E.abertos = E.abertos.filter(a => a === '📖 Manual' || E.arquivos[a] !== undefined);
  if (!E.abertos.includes(E.ativo)) E.ativo = E.abertos[0] || null;
}
let salvarT = 0;
function guardar() { clearTimeout(salvarT); salvarT = setTimeout(() => { try { localStorage.setItem('frogcode.v1', JSON.stringify(E)); } catch (e) { } }, 200); }
const ehManual = n => n === '📖 Manual';
function nomeLivre(base) {
  base = base.replace(/\.frog$/i, '');
  let n = base + '.frog', i = 2;
  while (E.arquivos[n] !== undefined) n = `${base} ${i++}.frog`;
  return n;
}
function abrir(nome) {
  if (!E.abertos.includes(nome)) E.abertos.push(nome);
  E.ativo = nome; guardar(); mostrarAtivo();
}
function fecharAba(nome) {
  const i = E.abertos.indexOf(nome); if (i < 0) return;
  E.abertos.splice(i, 1);
  if (E.ativo === nome) E.ativo = E.abertos[Math.min(i, E.abertos.length - 1)] || null;
  guardar(); mostrarAtivo();
}
function novoArquivo(nome, conteudo = '') {
  conteudo = conteudo.replace(/\r\n?/g, '\n'); nome = nomeLivre(nome); E.arquivos[nome] = conteudo; abrir(nome); desenharLateral(); return nome;
}

// ---------------- abas e área ----------------
function desenharAbas() {
  const a = $('#abas'); a.innerHTML = '';
  for (const nome of E.abertos) {
    const d = document.createElement('div'); d.className = 'aba' + (nome === E.ativo ? ' ativa' : '');
    d.innerHTML = `<span>${ehManual(nome) ? '' : '🐸 '}${esc(nome)}</span><button class="fechar" title="Fechar">×</button>`;
    d.onclick = e => { if (e.target.classList.contains('fechar')) fecharAba(nome); else { E.ativo = nome; guardar(); mostrarAtivo(); } };
    d.onauxclick = e => { if (e.button === 1) fecharAba(nome); };
    a.appendChild(d);
  }
}
function mostrarAtivo() {
  desenharAbas(); desenharLateral();
  const m = ehManual(E.ativo), v = E.vista || 'codigo';
  $('#manualview').style.display = m ? 'block' : 'none';
  $('#edwrap').style.display = !m && E.ativo && v === 'codigo' ? 'flex' : 'none';
  $('#cenaview').style.display = !m && E.ativo && v === 'cena' ? 'flex' : 'none';
  $('#modeloview').style.display = !m && E.ativo && v === 'modelos' ? 'flex' : 'none';
  $('#vistas').style.visibility = !m && E.ativo ? 'visible' : 'hidden';
  $('#meio').classList.toggle('modo3d', !m && !!E.ativo && v !== 'codigo');
  document.querySelectorAll('#vistas button').forEach(b => b.classList.toggle('ativo', b.dataset.vista === v));
  $('#nomeTitulo').textContent = E.ativo ? E.ativo + ' — FrogCode' : 'FrogCode';
  if (!m && E.ativo) {
    if (src.dataset.arq !== E.ativo) { src.value = E.arquivos[E.ativo]; src.dataset.arq = E.ativo; src.scrollTop = 0; src.setSelectionRange(0, 0); }
    checar();
    if (v === 'codigo') src.focus();
    else if (window.FrogCena) setTimeout(() => v === 'cena' ? FrogCena.abrirCena() : FrogCena.abrirModelos(), 0);
  } else { problemas = []; desenharProblemas(); }
}
document.querySelectorAll('#vistas button').forEach(b => b.onclick = () => { E.vista = b.dataset.vista; guardar(); mostrarAtivo(); });
// ponte pras telas Cena e Modelos (elas mexem no código através daqui)
window.FrogIDE = {
  confirmar, pedirNome,
  texto: () => (E.ativo && !ehManual(E.ativo) ? E.arquivos[E.ativo] : '') || '',
  nome: () => (E.ativo && !ehManual(E.ativo) ? E.ativo : (E.abertos.find(x => !ehManual(x)) || 'jogo')),
  setTexto(t) { if (!E.ativo || ehManual(E.ativo)) return; t = t.replace(/\r\n?/g, '\n'); E.arquivos[E.ativo] = t; src.value = t; src.dataset.arq = E.ativo; guardar(); checar(); },
  analisar: () => FC.analisar((E.ativo && E.arquivos[E.ativo]) || ''),
  irParaCodigo(n) { E.vista = 'codigo'; guardar(); mostrarAtivo(); setTimeout(() => irPara(n), 0); },
  saida: (t, c) => saida(t, c),
  rodar: () => rodar(),
};

// ---------------- barra lateral ----------------
function desenharLateral() {
  atualizarSelArq();
  const L = $('#lateral');
  document.querySelectorAll('#atividade button').forEach(b => b.classList.toggle('ativo', b.dataset.v === E.lateral && !$('#meio').classList.contains('semlateral')));
  if (E.lateral === 'arquivos') {
    L.innerHTML = `<h2>MEUS JOGOS <span><button id="lNovo" title="Novo arquivo">＋</button><button id="lPC" title="Abrir do computador">⬆</button><button id="lBaixar" title="Salvar no computador">⬇</button></span></h2>`;
    for (const nome of Object.keys(E.arquivos).sort()) {
      const d = document.createElement('div'); d.className = 'item' + (nome === E.ativo ? ' ativo' : '');
      d.innerHTML = `🐸 <span>${esc(nome)}</span><button class="x" title="Apagar">🗑</button>`;
      d.onclick = e => {
        if (e.target.classList.contains('x')) {
          apagarArquivo(nome);
        } else abrir(nome);
      };
      d.ondblclick = () => renomearArquivo(nome);
      L.appendChild(d);
    }
    L.insertAdjacentHTML('beforeend', '<div class="dica">Clique pra abrir · duplo clique pra mudar o nome<br>Tudo é salvo sozinho no navegador. Use ⬇ pra guardar no computador.</div>');
    $('#lNovo').onclick = jogoNovo;
    $('#lPC').onclick = () => $('#arqPC').click();
    $('#lBaixar').onclick = baixar;
  } else if (E.lateral === 'manual') {
    L.innerHTML = '<h2>MANUAL</h2>';
    for (const c of MANUAL) {
      const d = document.createElement('div'); d.className = 'item'; d.textContent = c.titulo;
      d.onclick = () => { abrir('📖 Manual'); document.getElementById('cap-' + c.id).scrollIntoView({ behavior: 'smooth' }); };
      L.appendChild(d);
    }
  } else {
    L.innerHTML = '<h2>EXEMPLOS</h2>';
    for (const nome of Object.keys(EXEMPLOS)) {
      const d = document.createElement('div'); d.className = 'item'; d.textContent = '🎮 ' + nome.replace('.frog', '');
      d.onclick = () => novoArquivo(nome, EXEMPLOS[nome]);
      L.appendChild(d);
    }
    L.insertAdjacentHTML('beforeend', '<div class="dica">Clicar cria uma cópia nos seus arquivos, aí pode mexer à vontade.</div>');
  }
}
document.querySelectorAll('#atividade button').forEach(b => b.onclick = () => {
  const meio = $('#meio');
  if (E.lateral === b.dataset.v && !meio.classList.contains('semlateral')) meio.classList.add('semlateral');
  else { meio.classList.remove('semlateral'); E.lateral = b.dataset.v; }
  if (b.dataset.v === 'manual') abrir('📖 Manual');
  guardar(); desenharLateral();
});
function baixar() {
  if (!E.ativo || ehManual(E.ativo)) return;
  const a = document.createElement('a');
  a.href = URL.createObjectURL(new Blob([E.arquivos[E.ativo]], { type: 'text/plain' }));
  a.download = E.ativo; a.click(); URL.revokeObjectURL(a.href);
}
$('#arqPC').onchange = async e => { const f = e.target.files[0]; if (!f) return; novoArquivo(f.name, await f.text()); e.target.value = ''; };

// ---------------- manual ----------------
function montarManual() {
  const mv = $('#manualview');
  const versao = document.querySelector('meta[name="frogcode-versao"]')?.content || '?';
  let h = '<div class="cap"><h1>📖 Manual do FrogCode</h1><div class="sub" style="margin:-4px 0 8px;font-size:12px">versão ' + versao + '</div><div class="sub">Tudo que a linguagem sabe fazer. Clique em <b>▶ Testar</b> pra ver um exemplo rodando, ou em <b>Copiar</b> pra colar no seu jogo.</div></div>';
  for (const c of MANUAL) h += `<div class="cap" id="cap-${c.id}"><h3>${c.titulo}</h3>${c.html}</div>`;
  mv.innerHTML = h;
  // botão do guia pra IA, logo no começo do manual
  mv.querySelector('.cap').insertAdjacentHTML('beforeend', '<div class="guiaIA"><p>🤖 <b>Vai aprender com o Claude ou outra IA?</b> Ela não conhece o FrogCode. Copie o guia e cole na conversa antes de perguntar — aí ela só ensina comandos que existem.</p><button class="btn" id="bGuia">🤖 Copiar guia pra IA</button></div>');
  $('#bGuia').onclick = async () => {
    const b = $('#bGuia'), txt = window.FROG_GUIA || '';
    let ok = false;
    try { await navigator.clipboard.writeText(txt); ok = true; } catch (e) {
      const t = document.createElement('textarea'); t.value = txt; t.style.position = 'fixed'; t.style.opacity = '0'; document.body.appendChild(t); t.select();
      try { ok = document.execCommand('copy'); } catch (e2) { } t.remove();
    }
    if (!ok) { // navegador não deixou copiar sozinho: mostra o guia pra copiar na mão
      const d = document.createElement('div'); d.id = 'dlgGuia';
      d.innerHTML = '<div class="caixa"><div id="dlgMsg">Seu navegador não deixou eu copiar sozinho. Segure o dedo no texto → <b>Selecionar tudo</b> → <b>Copiar</b>:</div><textarea readonly></textarea><div class="bts"><button class="btn rodar">Fechar</button></div></div>';
      document.body.appendChild(d);
      const t = d.querySelector('textarea'); t.value = txt; t.focus(); t.select();
      d.querySelector('button').onclick = () => d.remove();
      b.textContent = '🤖 Copiar guia pra IA'; return;
    }
    b.textContent = '✔ Copiado! Agora cole na IA';
    saida('🤖 Guia copiado — cole na conversa com a IA antes de perguntar.', 'ok');
    setTimeout(() => b.textContent = '🤖 Copiar guia pra IA', 3000);
  };
  mv.querySelectorAll('pre').forEach(pre => {
    const box = document.createElement('div'); box.className = 'exbox';
    pre.replaceWith(box); box.appendChild(pre);
    const codigo = pre.textContent;
    pre.innerHTML = codigo.split('\n').map(colorirLinha).join('\n');
    const bar = document.createElement('div'); bar.className = 'bar';
    const cp = document.createElement('button'); cp.textContent = '📋 Copiar pro meu jogo';
    cp.onclick = () => {
      let alvo = E.abertos.find(a => !ehManual(a)) || novoArquivo('meu jogo', '');
      E.arquivos[alvo] = (E.arquivos[alvo].replace(/\s*$/, '') + '\n\n' + codigo + '\n').replace(/^\n+/, '');
      src.dataset.arq = ''; abrir(alvo); src.setSelectionRange(src.value.length, src.value.length); src.scrollTop = src.scrollHeight; atualizarEditor();
      saida(`📋 Copiei pro "${alvo}"`, 'ok');
    };
    const ts = document.createElement('button'); ts.className = 't'; ts.textContent = '▶ Testar';
    ts.onclick = () => rodarTexto(codigo, 'exemplo do manual');
    bar.append(cp, ts); box.appendChild(bar);
  });
}

// ---------------- cores do código ----------------
const BLOCO = new Set(['quando', 'cada', 'se', 'senao', 'sempre', 'repetir', 'vezes', 'segundos', 'segundo', 'para', 'ensinar', 'modelo']);
const ACAO = new Set(['criar', 'mensagem', 'som', 'remover', 'esperar', 'ganhar', 'perder', 'levar', 'voltar', 'tremer', 'completar', 'recomecar', 'pegar', 'tocar', 'derrotar', 'apertar', 'mover', 'andar', 'correr', 'voar', 'girar', 'virar', 'pular', 'chamado', 'chamada', 'com', 'existe', 'distancia', 'tocando']);
const VARS = new Set(['isso', 'aquilo', 'jogador', 'pontos', 'vidas', 'tempo', 'e', 'ou', 'nao', 'aleatorio', 'quantos', 'quantas', 'tecla']);
function ehCoisa(w) { return !!(FC.COISAS[w] || FC.PLURAL[w]); }
function pintarPalavras(seg, chave) {
  return seg.replace(/(-?\d+(?:\.\d+)?)|([\p{L}_][\p{L}\p{N}_]*)|([^\p{L}\p{N}_-]+|-)/gu, (m, n, w, o) => {
    if (n) return `<span class="n">${n}</span>`;
    if (o) return esc(o);
    const s = sa(w);
    if (chave) return `<span class="k">${w}</span>`;
    if (BLOCO.has(s)) return `<span class="b">${w}</span>`;
    if (ACAO.has(s)) return `<span class="c">${w}</span>`;
    if (ehCoisa(s)) return `<span class="co">${w}</span>`;
    if (FC.CORES[s]) return `<span style="color:${FC.CORES[s] === '#1a1a1a' ? '#bbb' : FC.CORES[s]}">${w}</span>`;
    if (VARS.has(s) || nomesInventados.has(s)) return `<span class="v">${w}</span>`;
    return w;
  });
}
function colorirLinha(l) {
  // separa comentário e textos entre aspas
  let partes = [], q = null, ini = 0, cm = null;
  for (let i = 0; i < l.length; i++) {
    const ch = l[i];
    if (q) { if (ch === q || (q === '“' && ch === '”')) { partes.push({ s: l.slice(ini, i + 1), str: true }); ini = i + 1; q = null; } continue; }
    if (ch === '"' || ch === "'" || ch === '“') { partes.push({ s: l.slice(ini, i) }); ini = i; q = ch; continue; }
    if (ch === '#') { partes.push({ s: l.slice(ini, i) }); cm = l.slice(i); ini = l.length; break; }
  }
  if (ini < l.length) partes.push({ s: l.slice(ini), str: !!q });
  const bloco = /^\s*(quando|a cada|se|senao|senão|sempre|repetir|para cada|ensinar|modelo)\b/i.test(sa(l));
  let chaveAberta = !bloco && /:/.test(partes.filter(p => !p.str).map(p => p.s).join(''));
  let out = '';
  for (const p of partes) {
    if (p.str) { out += `<span class="s">${esc(p.s)}</span>`; continue; }
    if (chaveAberta) {
      const k = p.s.indexOf(':');
      if (k >= 0) { out += pintarPalavras(p.s.slice(0, k), true) + esc(':') + pintarPalavras(p.s.slice(k + 1), false); chaveAberta = false; continue; }
      out += pintarPalavras(p.s, true); continue;
    }
    out += pintarPalavras(p.s, false);
  }
  if (cm) out += `<span class="cm">${esc(cm)}</span>`;
  return out;
}
let problemas = [];
let nomesInventados = new Set();
function atualizarEditor() {
  const linhas = src.value.split('\n');
  const marca = {}; for (const p of problemas) if (!marca[p.linha] || p.nivel === 'erro') marca[p.linha] = p.nivel;
  hl.innerHTML = linhas.map((l, i) => {
    const h = colorirLinha(l) || '';
    const m = marca[i + 1];
    if (!m) return h;
    const ind = l.match(/^\s*/)[0].length;
    return ind && h.startsWith(' '.repeat(ind)) ? ' '.repeat(ind) + `<span class="${m === 'erro' ? 'sqe' : 'sqa'}">${h.slice(ind) || ' '}</span>` : `<span class="${m === 'erro' ? 'sqe' : 'sqa'}">${h || ' '}</span>`;
  }).join('\n') + '\n\n';
  gutter.innerHTML = linhas.map((_, i) => { const m = marca[i + 1]; return m ? `<span class="${m === 'erro' ? 'e' : 'a'}" title="${esc(problemas.find(p => p.linha === i + 1).msg)}">${i + 1}</span>` : (i + 1); }).join('\n') + '\n\n';
  sincronizar();
}
function sincronizar() { hl.scrollTop = src.scrollTop; hl.scrollLeft = src.scrollLeft; gutter.scrollTop = src.scrollTop; }
src.addEventListener('scroll', () => { sincronizar(); esconderAuto(); });

// ---------------- problemas e saída ----------------
let errosDeJogo = [];
function checar() {
  if (!E.ativo || ehManual(E.ativo)) return;
  let r;
  try { r = FC.analisar(src.value); } catch (e) { r = { erros: [{ linha: 0, msg: 'Erro interno: ' + e.message, nivel: 'erro' }] }; console.error(e); }
  problemas = r.erros.concat(errosDeJogo);
  nomesInventados = new Set([...src.value.matchAll(/chamad[oa]s?\s+(\S+)|^\s*(?:modelo|ensinar)\s+([^\s:]+)/gmi)].map(m => sa(m[1] || m[2]).replace(/[^a-z0-9_]/g, '')));
  const modo = (src.value.match(/^\s*jogo\s*:\s*(.+)$/mi) || [])[1];
  $('#stModo').textContent = modo ? '🎮 ' + modo.trim() : '🎮 3D';
  atualizarEditor(); desenharProblemas();
  return r;
}
function desenharProblemas() {
  const p = $('#pProb'); p.innerHTML = '';
  const ne = problemas.filter(x => x.nivel === 'erro').length, na = problemas.length - ne;
  $('#nProb').textContent = problemas.length;
  $('#stProb').innerHTML = `❌ ${ne} &nbsp;⚠ ${na}`;
  if (!problemas.length) { p.innerHTML = '<div class="ok">✔ Nenhum problema. Pode rodar!</div>'; return; }
  for (const x of problemas) {
    const d = document.createElement('div'); d.className = 'prob';
    d.innerHTML = `${x.nivel === 'erro' ? '❌' : '⚠️'} ${esc(x.msg)} <span class="l">[linha ${x.linha}]</span>`;
    d.onclick = () => irPara(x.linha);
    p.appendChild(d);
  }
}
function irPara(n) {
  if (!n) return;
  const ls = src.value.split('\n'); let pos = 0;
  for (let i = 0; i < n - 1 && i < ls.length; i++) pos += ls[i].length + 1;
  src.focus(); src.setSelectionRange(pos, pos + (ls[n - 1] || '').length);
  src.scrollTop = Math.max(0, (n - 6) * 21); sincronizar(); posicao();
}
function saida(txt, cls = '') {
  const d = document.createElement('div'); d.className = cls; d.textContent = txt;
  const s = $('#pSaida'); s.appendChild(d); while (s.children.length > 200) s.firstChild.remove(); s.scrollTop = s.scrollHeight;
}
function painel(qual) {
  E.painel = qual;
  document.querySelectorAll('#painel .abasp button').forEach(b => b.classList.toggle('ativo', b.dataset.p === qual));
  $('#pProb').style.display = qual === 'prob' ? 'block' : 'none';
  $('#pSaida').style.display = qual === 'saida' ? 'block' : 'none';
}
document.querySelectorAll('#painel .abasp button').forEach(b => b.onclick = () => painel(b.dataset.p));
$('#stProb').onclick = () => painel('prob');

// ---------------- rodar ----------------
let motor = null;
function pegarMotor() {
  if (!window.THREE || !window.Motor) {
    saida('❌ Não consegui carregar o 3D (Three.js). Precisa de internet na primeira vez que abre.', 'er'); painel('saida'); return null;
  }
  if (!motor) motor = new Motor($('#cv'), $('#hud'), {
    erro: e => {
      errosDeJogo = [{ linha: e.linha || 0, msg: '💥 ' + e.message, nivel: 'erro' }];
      saida(`❌ Linha ${e.linha}: ${e.message}`, 'er'); checar(); painel('prob');
    },
  });
  return motor;
}
function rodar() {
  if (!E.ativo || ehManual(E.ativo)) {
    const a = E.abertos.find(x => !ehManual(x)) || Object.keys(E.arquivos)[0];
    if (!a) return; abrir(a);
  }
  errosDeJogo = [];
  const r = checar();
  if (r.erros.some(e => e.nivel === 'erro')) {
    painel('prob'); saida('❌ Arrume os problemas antes de rodar (estão sublinhados de vermelho)', 'er');
    irPara(r.erros.find(e => e.nivel === 'erro').linha); return;
  }
  rodarPrograma(r, E.ativo);
}
function rodarTexto(codigo, nome) {
  const r = FC.analisar(codigo);
  const er = r.erros.filter(e => e.nivel === 'erro');
  if (er.length) { saida(`❌ Esse ${nome} não roda sozinho: ${er[0].msg}`, 'er'); painel('saida'); return; }
  rodarPrograma(r, nome);
}
function rodarPrograma(r, nome) {
  if (document.body.classList.contains('celular')) irAba('jogo');
  const m = pegarMotor(); if (!m) return;
  m.manterTeclas = document.body.classList.contains('toque');
  $('#vazio').style.display = 'none';
  saida(`▶ Rodando ${nome}`, 'ok');
  m.carregar(r);
}
function parar() { if (motor) motor.parar(); $('#vazio').style.display = 'flex'; saida('■ Parado'); }
$('#bRodar').onclick = rodar;
$('#bParar').onclick = parar;
$('#bPublicar').onclick = () => { if (ehManual(E.ativo)) { const f = E.abertos.find(x => !ehManual(x)); if (f) abrir(f); } window.FrogPublicar?.abrir(); };
$('#bCheia').onclick = () => { $('#jogo').requestFullscreen?.(); $('#cv').focus(); };
document.addEventListener('keydown', e => {
  if (e.key === 'F5' || (e.key === 'Enter' && (e.ctrlKey || e.metaKey))) { e.preventDefault(); rodar(); }
  if (e.key === 's' && e.ctrlKey) { e.preventDefault(); guardar(); saida('💾 Salvo no navegador (use ⬇ em Meus Jogos pra salvar no computador)'); }
});

// ---------------- digitação: recuo, comentário, sugestões ----------------
let checarT = 0;
src.addEventListener('input', () => {
  if (E.ativo && !ehManual(E.ativo)) { E.arquivos[E.ativo] = src.value; guardar(); }
  errosDeJogo = [];
  window.FrogCena?.codigoMudou();
  atualizarEditor();
  clearTimeout(checarT); checarT = setTimeout(checar, 300);
  sugerir(); posicao();
});
function linhaDoCursor() {
  const p = src.selectionStart, ini = src.value.lastIndexOf('\n', p - 1) + 1;
  let fim = src.value.indexOf('\n', p); if (fim < 0) fim = src.value.length;
  return { ini, fim, antes: src.value.slice(ini, p), depois: src.value.slice(p, fim) };
}
let sug = [], sel = 0;
function sugerir() {
  const { antes, depois } = linhaDoCursor();
  const ind = antes.match(/^\s*/)[0], digitado = antes.slice(ind.length);
  if (depois.trim() || digitado.length < 2 || digitado.includes('#')) return esconderAuto();
  const d = sa(digitado);
  sug = SUGESTOES.filter(s => sa(s).startsWith(d) && sa(s) !== d).slice(0, 8);
  if (!sug.length) return esconderAuto();
  sel = 0;
  auto.innerHTML = sug.map((s, i) => `<div class="${i === sel ? 'sel' : ''}"><b>${esc(s.slice(0, digitado.length))}</b>${esc(s.slice(digitado.length))}</div>`).join('');
  [...auto.children].forEach((el, i) => el.onmousedown = e => { e.preventDefault(); sel = i; aceitar(); });
  const linhaN = src.value.slice(0, src.selectionStart).split('\n').length - 1;
  const lw = larguraLetra();
  auto.style.left = Math.max(0, 12 + ind.length * lw - src.scrollLeft) + 'px';
  auto.style.top = (8 + (linhaN + 1) * 21 - src.scrollTop + 2) + 'px';
  auto.style.display = 'block';
}
let _lw = 0;
function larguraLetra() {
  if (_lw) return _lw;
  const s = document.createElement('span'); s.style.font = '14px ' + getComputedStyle(src).fontFamily; s.style.visibility = 'hidden'; s.style.position = 'absolute'; s.textContent = 'x'.repeat(50);
  document.body.appendChild(s); _lw = s.getBoundingClientRect().width / 50; s.remove(); return _lw;
}
function esconderAuto() { auto.style.display = 'none'; sug = []; }
function aceitar() {
  const s = sug[sel]; if (!s) return;
  const { ini, antes } = linhaDoCursor(); const ind = antes.match(/^\s*/)[0];
  src.setRangeText(ind + s, ini, src.selectionStart, 'end');
  esconderAuto(); src.dispatchEvent(new Event('input')); esconderAuto();
}
function marcarAuto() { [...auto.children].forEach((el, i) => el.classList.toggle('sel', i === sel)); }
src.addEventListener('keydown', e => {
  const aberto = auto.style.display === 'block';
  if (aberto && e.key === 'ArrowDown') { e.preventDefault(); sel = (sel + 1) % sug.length; marcarAuto(); return; }
  if (aberto && e.key === 'ArrowUp') { e.preventDefault(); sel = (sel - 1 + sug.length) % sug.length; marcarAuto(); return; }
  if (aberto && (e.key === 'Tab' || e.key === 'Enter') && !e.ctrlKey) { e.preventDefault(); aceitar(); return; }
  if (aberto && e.key === 'Escape') { esconderAuto(); return; }
  if (e.key === 'Tab') {
    e.preventDefault();
    const { ini, antes } = linhaDoCursor();
    if (e.shiftKey) { const n = Math.min(2, antes.match(/^ */)[0].length); if (n) { src.setRangeText('', ini, ini + n, 'end'); src.dispatchEvent(new Event('input')); } }
    else { src.setRangeText('  ', src.selectionStart, src.selectionEnd, 'end'); src.dispatchEvent(new Event('input')); }
  } else if (e.key === 'Enter' && !e.ctrlKey) {
    e.preventDefault();
    const { antes } = linhaDoCursor();
    let ind = antes.match(/^\s*/)[0];
    const semCm = antes.split('#')[0].trim();
    if (/^(quando|a cada|se|senao|senão|sempre|repetir|para cada|ensinar|modelo)\b/i.test(sa(semCm)) && semCm.endsWith(':')) ind += '  ';
    src.setRangeText('\n' + ind, src.selectionStart, src.selectionEnd, 'end'); src.dispatchEvent(new Event('input')); esconderAuto();
  } else if (e.key === '/' && e.ctrlKey) {
    e.preventDefault();
    const a = src.value.lastIndexOf('\n', src.selectionStart - 1) + 1;
    let b = src.value.indexOf('\n', Math.max(src.selectionEnd - 1, src.selectionStart)); if (b < 0) b = src.value.length;
    const bloco = src.value.slice(a, b).split('\n');
    const todas = bloco.every(l => /^\s*#/.test(l) || !l.trim());
    const novo = bloco.map(l => !l.trim() ? l : todas ? l.replace(/^(\s*)# ?/, '$1') : l.replace(/^(\s*)/, '$1# ')).join('\n');
    src.setRangeText(novo, a, b, 'select'); src.dispatchEvent(new Event('input')); esconderAuto();
  }
});
src.addEventListener('blur', () => setTimeout(esconderAuto, 150));
function posicao() {
  const antes = src.value.slice(0, src.selectionStart).split('\n');
  $('#stPos').textContent = `Ln ${antes.length}, Col ${antes[antes.length - 1].length + 1}`;
}
src.addEventListener('click', () => { posicao(); esconderAuto(); });
src.addEventListener('keyup', e => { if (e.key.startsWith('Arrow') || e.key === 'Home' || e.key === 'End') posicao(); });

// ---------------- divisória arrastável ----------------
(() => {
  const d = $('#divisor'), meio = $('#meio');
  d.onmousedown = e => {
    e.preventDefault();
    const mover = ev => { const r = meio.getBoundingClientRect(); const w = Math.max(240, Math.min(r.right - ev.clientX, r.width - 400)); meio.style.setProperty('--jogoW', w + 'px'); };
    const soltar = () => { removeEventListener('mousemove', mover); removeEventListener('mouseup', soltar); };
    addEventListener('mousemove', mover); addEventListener('mouseup', soltar);
  };
})();

// ---------------- celular ----------------
const mqCel = matchMedia('(max-width: 820px)'), mqToque = matchMedia('(pointer: coarse)');
function aplicarCelular() {
  const cel = mqCel.matches;
  document.body.classList.toggle('celular', cel);
  document.body.classList.toggle('toque', cel || mqToque.matches);
  $('#bRodar').textContent = cel ? '▶' : '▶ Rodar';
  $('#bPublicar').textContent = cel ? '🌐' : '🌐 Publicar';
  if (cel && !document.body.dataset.aba) irAba(ehManual(E.ativo) ? 'manual' : (E.vista || 'codigo'));
  motor?.ajustar();
}
function irAba(a) {
  document.body.dataset.aba = a;
  document.querySelectorAll('#navCel button').forEach(b => b.classList.toggle('ativo', b.dataset.aba === a));
  if (a === 'manual') abrir('📖 Manual');
  else if (a !== 'jogo') {
    if (!E.ativo || ehManual(E.ativo)) { const f = E.abertos.find(x => !ehManual(x)) || Object.keys(E.arquivos)[0]; if (f) abrir(f); }
    E.vista = a; guardar(); mostrarAtivo();
  } else setTimeout(() => { motor?.ajustar(); $('#cv').focus(); }, 0);
}
document.querySelectorAll('#navCel button').forEach(b => b.onclick = () => irAba(b.dataset.aba));
mqCel.addEventListener?.('change', aplicarCelular); mqToque.addEventListener?.('change', aplicarCelular);
function atualizarSelArq() {
  const s = $('#selArq'), nomes = Object.keys(E.arquivos).sort();
  s.innerHTML = nomes.map(n => `<option value="${esc(n)}" ${n === E.ativo ? 'selected' : ''}>🐸 ${esc(n.replace(/\.frog$/, ''))}</option>`).join('') +
    '<option value="__novo">＋ Novo jogo…</option>' + (E.ativo && !ehManual(E.ativo) ? '<option value="__ren">✏️ Mudar o nome deste jogo…</option><option value="__apagar">🗑 Apagar este jogo…</option>' : '') + '<optgroup label="Exemplos">' + Object.keys(EXEMPLOS).map(n => `<option value="__ex:${esc(n)}">🎮 ${esc(n.replace(/\.frog$/, ''))}</option>`).join('') + '</optgroup>';
  if (ehManual(E.ativo)) s.value = E.abertos.find(x => !ehManual(x)) || nomes[0];
}
$('#selArq').onchange = e => {
  const v = e.target.value;
  const atual = E.ativo;
  if (v === '__novo') { atualizarSelArq(); jogoNovo(); return; }
  if (v === '__ren') { atualizarSelArq(); renomearArquivo(atual); return; }
  if (v === '__apagar') { atualizarSelArq(); apagarArquivo(atual); return; }
  else if (v.startsWith('__ex:')) novoArquivo(v.slice(5), EXEMPLOS[v.slice(5)]);
  else abrir(v);
  if (document.body.dataset.aba === 'manual' || document.body.dataset.aba === 'jogo') irAba('codigo');
  atualizarSelArq();
};
// joystick e botões do jogo
(() => {
  const joy = $('#joy'), bola = $('#joyBola'); let id = null;
  const teclas = () => motor && motor.teclas;
  const mover = e => {
    const r = joy.getBoundingClientRect();
    let dx = (e.clientX - (r.left + r.width / 2)) / (r.width / 2), dy = (e.clientY - (r.top + r.height / 2)) / (r.height / 2);
    const m = Math.hypot(dx, dy); if (m > 1) { dx /= m; dy /= m; }
    bola.style.transform = `translate(${dx * 38}px, ${dy * 38}px)`;
    const T = teclas(); if (!T) return;
    ['w', 'a', 's', 'd', 'shift'].forEach(k => T.delete(k));
    if (dy < -0.38) T.add('w'); if (dy > 0.38) T.add('s'); if (dx < -0.38) T.add('a'); if (dx > 0.38) T.add('d'); if (m > 0.97) T.add('shift');
  };
  const parar = () => { id = null; bola.style.transform = ''; const T = teclas(); if (T) ['w', 'a', 's', 'd', 'shift'].forEach(k => T.delete(k)); };
  joy.addEventListener('pointerdown', e => { id = e.pointerId; joy.setPointerCapture(id); mover(e); e.preventDefault(); e.stopPropagation(); });
  joy.addEventListener('pointermove', e => { if (e.pointerId === id) mover(e); });
  joy.addEventListener('pointerup', parar); joy.addEventListener('pointercancel', parar);
  document.querySelectorAll('#botoesToque button').forEach(b => {
    const k = b.dataset.k;
    b.addEventListener('pointerdown', e => { e.preventDefault(); e.stopPropagation(); b.setPointerCapture(e.pointerId); b.classList.add('on'); if (motor) { if (!motor.teclas.has(k)) motor.apertou(k); motor.teclas.add(k); } });
    const solta = () => { b.classList.remove('on'); motor?.teclas.delete(k); };
    b.addEventListener('pointerup', solta); b.addEventListener('pointercancel', solta);
  });
})();

// ---------------- começar ----------------
carregarEstado();
montarManual();
painel('prob');
mostrarAtivo();
aplicarCelular();
saida('🐸 Bem-vindo ao FrogCode! Abra o 📖 Manual ou aperte ▶ Rodar.', 'ok');
