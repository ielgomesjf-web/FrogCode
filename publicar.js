// FrogCode — botão 🌐 Publicar: link pra mandar + arquivo pronto pro itch.io (na conta da própria pessoa)
(function () {
'use strict';
const $ = s => document.querySelector(s);
const SITE = 'https://ielgomesjf-web.github.io/FrogCode/';
const esc = s => String(s).replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;');

// ---------- link: o jogo vai dentro do próprio link ----------
function base64url(bytes) {
  let s = '';
  for (let i = 0; i < bytes.length; i += 0x8000) s += String.fromCharCode.apply(null, bytes.subarray(i, i + 0x8000));
  return btoa(s).replace(/\+/g, '-').replace(/\//g, '_').replace(/=+$/, '');
}
async function fazerLink(codigo) {
  let bytes = new TextEncoder().encode(codigo), tipo = 't';
  if (window.CompressionStream) {
    const s = new Blob([bytes]).stream().pipeThrough(new CompressionStream('deflate-raw'));
    bytes = new Uint8Array(await new Response(s).arrayBuffer()); tipo = 'z';
  }
  return SITE + 'jogar.html#j=' + tipo + base64url(bytes);
}

// ---------- arquivo .zip pro itch.io (com o motor dentro, pra não quebrar com atualizações) ----------
function crc32(b) {
  let crc = 0xFFFFFFFF;
  for (let n = 0; n < b.length; n++) { let c = (crc ^ b[n]) & 0xFF; for (let k = 0; k < 8; k++) c = c & 1 ? (c >>> 1) ^ 0xEDB88320 : c >>> 1; crc = (crc >>> 8) ^ c; }
  return (crc ^ 0xFFFFFFFF) >>> 0;
}
function fazerZip(arquivos) { // zip simples, sem compressão: [{ nome, dados: Uint8Array }]
  const enc = new TextEncoder(), partes = [], central = []; let off = 0;
  for (const a of arquivos) {
    const nome = enc.encode(a.nome), d = a.dados, crc = crc32(d);
    const lh = new DataView(new ArrayBuffer(30));
    lh.setUint32(0, 0x04034b50, true); lh.setUint16(4, 20, true); lh.setUint16(6, 0x0800, true); lh.setUint16(12, 0x21, true);
    lh.setUint32(14, crc, true); lh.setUint32(18, d.length, true); lh.setUint32(22, d.length, true); lh.setUint16(26, nome.length, true);
    partes.push(new Uint8Array(lh.buffer), nome, d);
    const ch = new DataView(new ArrayBuffer(46));
    ch.setUint32(0, 0x02014b50, true); ch.setUint16(4, 20, true); ch.setUint16(6, 20, true); ch.setUint16(8, 0x0800, true); ch.setUint16(14, 0x21, true);
    ch.setUint32(16, crc, true); ch.setUint32(20, d.length, true); ch.setUint32(24, d.length, true); ch.setUint16(28, nome.length, true); ch.setUint32(42, off, true);
    central.push(new Uint8Array(ch.buffer), nome);
    off += 30 + nome.length + d.length;
  }
  const tam = central.reduce((s, x) => s + x.length, 0), fim = new DataView(new ArrayBuffer(22));
  fim.setUint32(0, 0x06054b50, true); fim.setUint16(8, arquivos.length, true); fim.setUint16(10, arquivos.length, true); fim.setUint32(12, tam, true); fim.setUint32(16, off, true);
  return new Blob([...partes, ...central, new Uint8Array(fim.buffer)], { type: 'application/zip' });
}
async function fazerZipItch(codigo, titulo) {
  const versao = document.querySelector('meta[name="frogcode-versao"]')?.content || '';
  const base = location.protocol.startsWith('http') ? '' : SITE; // abrindo do computador: pega do site
  const enc = new TextEncoder(), arquivos = [];
  for (const n of ['linguagem.js', 'modelos.js', 'motor.js', 'jogar.js']) {
    const r = await fetch(base + n + '?v=' + versao); if (!r.ok) throw new Error('não consegui baixar ' + n);
    arquivos.push({ nome: n, dados: enc.encode(await r.text()) });
  }
  const html = `<!doctype html>
<html lang="pt-BR">
<head>
<meta charset="utf-8">
<meta name="viewport" content="width=device-width, initial-scale=1, maximum-scale=1, user-scalable=no, viewport-fit=cover">
<title>${esc(titulo)}</title>
</head>
<body>
<script src="https://cdnjs.cloudflare.com/ajax/libs/three.js/r128/three.min.js"></script>
<script>window.JOGO_EMBUTIDO = ${JSON.stringify(codigo).replace(/</g, '\\u003c')};</script>
<script src="linguagem.js"></script>
<script src="modelos.js"></script>
<script src="motor.js"></script>
<script src="jogar.js"></script>
</body>
</html>
`;
  arquivos.unshift({ nome: 'index.html', dados: enc.encode(html) });
  return fazerZip(arquivos);
}
function baixar(blob, nome) {
  const a = document.createElement('a'); a.href = URL.createObjectURL(blob); a.download = nome;
  document.body.appendChild(a); a.click(); a.remove(); setTimeout(() => URL.revokeObjectURL(a.href), 4000);
}
const nomeArquivo = t => (FrogCode.semAcento(t).replace(/[^a-z0-9]+/g, '-').replace(/^-|-$/g, '') || 'jogo') + '-itch.zip';

// ---------- a janelinha ----------
async function abrir() {
  const IDE = window.FrogIDE, codigo = IDE.texto();
  if (!codigo.trim()) { IDE.saida('Abra um jogo antes de publicar'); return; }
  const r = IDE.analisar(), erros = r.erros.filter(e => e.nivel === 'erro');
  const titulo = (((codigo.match(/^\s*t[ií]tulo(?: do jogo)?\s*:\s*["'“]?([^"'”\n]+)/mi) || codigo.match(/^\s*#\s*(.+)$/m) || [])[1] || IDE.nome().replace(/\.frog$/, '')) + '').trim();
  const d = document.createElement('div'); d.id = 'dlgPub';
  document.body.appendChild(d);
  const fechar = () => d.remove();
  if (erros.length) {
    d.innerHTML = `<div class="caixa"><h2>🌐 Publicar</h2><p>Seu jogo tem <b>${erros.length} erro(s)</b> no código. Arrume antes de publicar, senão quem jogar vai ver o erro 😵</p><p class="fraco">linha ${erros[0].linha}: ${esc(erros[0].msg)}</p><div class="bts"><button class="btn rodar" data-x="fechar">Entendi</button></div></div>`;
    d.querySelector('[data-x]').onclick = fechar; return;
  }
  let link = '';
  try { link = await fazerLink(codigo); } catch (e) { link = ''; }
  const passosItch = `<ol class="passos">
      <li>Aperte <b>⬇ Baixar arquivo pro itch.io</b> (vem um <code>.zip</code>).</li>
      <li>Entre na sua conta e abra <a href="https://itch.io/game/new" target="_blank">itch.io/game/new</a>.</li>
      <li>Em <b>Kind of project</b>, escolha <b>HTML</b>.</li>
      <li>Em <b>Uploads</b>, mande o <code>.zip</code> e marque <b>"This file will be played in the browser"</b>.</li>
      <li>Em <b>Embed options</b>: tamanho <b>960 × 600</b>, marque <b>Mobile friendly</b> e <b>Fullscreen button</b>.</li>
      <li>Coloque uma capa e uma descrição, escolha <b>Public</b> e salve. Pronto! 🎉</li></ol>`;
  d.innerHTML = `<div class="caixa">
    <button class="x" data-x="fechar">✕</button>
    <h2>🌐 Publicar "${esc(titulo)}"</h2>
    <h3>1. Link pra mandar</h3>
    <p class="fraco">Quem abrir joga na hora, no celular ou no computador. Não precisa instalar nem ter conta.</p>
    ${link ? `<textarea readonly class="link">${esc(link)}</textarea>
    <div class="bts"><button class="btn rodar" data-x="copiar">📋 Copiar link</button><a class="btn" href="${esc(link)}" target="_blank">▶ Abrir</a></div>
    ${link.length > 30000 ? '<p class="fraco">⚠ O link ficou bem grande. Alguns apps podem cortar. Se der problema, use o itch.io.</p>' : ''}` : '<p class="fraco">Não consegui fazer o link neste navegador.</p>'}
    <p class="fraco">Mudou o jogo? Publique de novo (o link muda).</p>
    <h3>2. Publicar no itch.io (na sua conta)</h3>
    <div id="pubItch">
      <p>Você tem conta no <b>itch.io</b>?</p>
      <div class="bts esq"><button class="btn rodar" data-x="sim">Sim, tenho</button><button class="btn" data-x="nao">Não tenho</button><button class="btn" data-x="amigo">Vou usar a conta de um amigo ou adulto</button></div>
    </div>
  </div>`;
  const area = d.querySelector('#pubItch');
  const botaoZip = '<div class="bts esq"><button class="btn rodar" data-x="zip">⬇ Baixar arquivo pro itch.io</button></div><p class="fraco" id="zipMsg"></p>';
  const ligar = () => d.querySelectorAll('[data-x]').forEach(b => b.onclick = acao);
  async function acao(e) {
    const x = e.currentTarget.dataset.x;
    if (x === 'fechar') fechar();
    else if (x === 'copiar') {
      let ok = false; try { await navigator.clipboard.writeText(link); ok = true; } catch (er) { const t = d.querySelector('.link'); t.focus(); t.select(); try { ok = document.execCommand('copy'); } catch (er2) { } }
      e.currentTarget.textContent = ok ? '✔ Copiado!' : 'Segure no link → Copiar';
    } else if (x === 'sim') { area.innerHTML = botaoZip + passosItch; ligar(); }
    else if (x === 'nao') {
      area.innerHTML = `<p>Criar conta no itch.io é de graça: <a href="https://itch.io/register" target="_blank">itch.io/register</a>.</p>
        <p class="fraco">⚠ O itch.io (e quase todo site) pede <b>13 anos ou mais</b>. Se você for mais novo, peça pra um adulto (pai, mãe, responsável) criar a conta e cuidar dela com você.</p>
        <div class="bts esq"><button class="btn rodar" data-x="sim">Já tenho conta agora!</button><button class="btn" data-x="amigo">Vou usar a conta de alguém</button></div>`; ligar();
    } else if (x === 'amigo') {
      area.innerHTML = `<p>Beleza! Baixe o arquivo e <b>mande pra pessoa</b> (WhatsApp, e-mail, Discord…). Ela publica na conta dela seguindo os passos abaixo, e o jogo aparece com o seu nome na descrição.</p>
        <p class="fraco">🔒 Nunca peça nem passe senha. Quem é dono da conta é quem entra e publica.</p>` + botaoZip + passosItch; ligar();
    } else if (x === 'zip') {
      const b = e.currentTarget, msg = d.querySelector('#zipMsg'); b.disabled = true; b.textContent = '⏳ Montando o arquivo…';
      try { baixar(await fazerZipItch(codigo, titulo), nomeArquivo(titulo)); b.textContent = '✔ Baixado!'; msg.textContent = `O arquivo "${nomeArquivo(titulo)}" foi pra pasta de Downloads.`; }
      catch (er) { b.textContent = '⬇ Tentar de novo'; msg.textContent = '❌ Não consegui montar o arquivo (' + er.message + '). Confira a internet.'; }
      b.disabled = false;
    }
  }
  ligar();
}
window.FrogPublicar = { abrir, _fazerZipItch: fazerZipItch, _fazerLink: fazerLink };
})();
