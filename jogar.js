// FrogCode — página de JOGAR um jogo publicado (sem editor).
// O jogo vem no link (#j=...) ou embutido no arquivo baixado (window.JOGO_EMBUTIDO).
(function () {
'use strict';
const $ = s => document.querySelector(s);

// ---------- tela ----------
document.head.insertAdjacentHTML('beforeend', `<style>
html,body{margin:0;height:100%;background:#0b0e12;color:#fff;font-family:"Trebuchet MS","Segoe UI",sans-serif;overflow:hidden}
#palco{position:fixed;inset:0}
#cv{position:absolute;inset:0;width:100%;height:100%;display:block;outline:none;touch-action:none}
#hud{position:absolute;inset:0;pointer-events:none;text-shadow:0 2px 3px #000a}
.hud-vars{position:absolute;left:12px;top:10px;font-size:20px;font-weight:700;line-height:1.35}
.hud-vars span{color:#ffd400}
.hud-obj{position:absolute;top:10px;right:12px;max-width:60%;background:#000a;padding:6px 16px;border-radius:20px;font-size:17px}
.hud-obj b{color:#7ed957}
.hud-msg{position:absolute;top:32%;left:0;right:0;text-align:center;font-size:30px;font-weight:800}
.hud-dica{position:absolute;bottom:12px;left:0;right:0;text-align:center;font-size:14px;opacity:.9}
.hud-fim{position:absolute;inset:0;background:#000b;display:flex;flex-direction:column;align-items:center;justify-content:center;gap:12px;font-size:40px;font-weight:800;color:#ff8a80;text-align:center;padding:20px}
.hud-fim.ganhou{color:#ffd400} .hud-fim small{font-size:17px;color:#fff;font-weight:400}
#toque{display:none;position:absolute;inset:0;pointer-events:none}
body.toque #toque{display:block}
#joy{position:absolute;left:18px;bottom:18px;width:130px;height:130px;border-radius:50%;background:#ffffff1a;border:2px solid #ffffff40;pointer-events:auto;touch-action:none}
#joyBola{position:absolute;left:50%;top:50%;width:56px;height:56px;margin:-28px 0 0 -28px;border-radius:50%;background:#ffffff66;border:2px solid #fff9}
#botoes{position:absolute;right:18px;bottom:22px;display:flex;gap:14px;align-items:flex-end}
#botoes button{pointer-events:auto;touch-action:none;width:74px;height:74px;border-radius:50%;background:#ffffff26;border:2px solid #ffffff59;color:#fff;font-size:28px;font-weight:800}
#botoes button.on{background:#7ed95788}
#botoes [data-k=e]{width:60px;height:60px;font-size:22px;margin-bottom:40px}
body.toque .hud-dica{bottom:150px}
#capa{position:fixed;inset:0;background:radial-gradient(circle at 50% 35%,#1d3a1a,#0b0e12 70%);display:flex;flex-direction:column;align-items:center;justify-content:center;gap:18px;text-align:center;padding:24px;z-index:5}
#capa h1{margin:0;font-size:clamp(28px,7vw,56px);color:#7ed957;text-shadow:0 4px 0 #0006}
#capa .sub{color:#b9c4cf;font-size:15px}
#capa button{font:inherit;font-size:22px;font-weight:800;padding:14px 38px;border-radius:14px;border:0;background:#2f7d32;color:#fff;cursor:pointer;box-shadow:0 5px 0 #1b4d1d}
#capa button:active{transform:translateY(3px);box-shadow:0 2px 0 #1b4d1d}
#capa .erro{color:#ff8a80;max-width:520px;line-height:1.5}
.marca{position:fixed;right:10px;bottom:8px;font-size:12px;color:#ffffff99;text-decoration:none;z-index:6}
body.jogando .marca{bottom:auto;top:auto;right:8px;bottom:6px;opacity:.5}
</style>`);
document.body.insertAdjacentHTML('beforeend', `
<div id="palco"><canvas id="cv" tabindex="0"></canvas><div id="hud"></div>
  <div id="toque"><div id="joy"><div id="joyBola"></div></div><div id="botoes"><button data-k="e">E</button><button data-k="espaco">⤒</button></div></div>
</div>
<div id="capa"><h1 id="titulo">🐸</h1><div class="sub" id="sub">carregando…</div><button id="bJogar" hidden>▶ Jogar</button></div>
<a class="marca" href="https://ielgomesjf-web.github.io/FrogCode/" target="_blank">feito com FrogCode 🐸 · faça o seu</a>`);

if (matchMedia('(pointer: coarse)').matches || innerWidth < 820) document.body.classList.add('toque');

// ---------- ler o jogo ----------
function deBase64url(s) {
  s = s.replace(/-/g, '+').replace(/_/g, '/'); while (s.length % 4) s += '=';
  const b = atob(s), u = new Uint8Array(b.length);
  for (let i = 0; i < b.length; i++) u[i] = b.charCodeAt(i);
  return u;
}
async function lerJogo() {
  if (typeof window.JOGO_EMBUTIDO === 'string') return window.JOGO_EMBUTIDO;
  const m = location.hash.match(/^#j=([zt])([A-Za-z0-9_-]+)/);
  if (!m) return null;
  const bytes = deBase64url(m[2]);
  if (m[1] === 't') return new TextDecoder().decode(bytes);
  const s = new Blob([bytes]).stream().pipeThrough(new DecompressionStream('deflate-raw'));
  return await new Response(s).text();
}

(async () => {
  let codigo;
  try { codigo = await lerJogo(); } catch (e) { codigo = null; }
  if (!codigo) { $('#titulo').textContent = 'Jogo não encontrado 😕'; $('#sub').innerHTML = 'Esse link está quebrado ou incompleto.<br>Peça pra quem fez publicar de novo.'; return; }
  const titulo = ((codigo.match(/^\s*#\s*(.+)$/m) || [])[1] || 'Jogo feito no FrogCode').trim();
  document.title = titulo + ' — FrogCode';
  $('#titulo').textContent = titulo;
  if (!window.THREE || !window.Motor) { $('#sub').textContent = 'Não consegui carregar o 3D. Confira a internet e recarregue.'; return; }
  const prog = FrogCode.analisar(codigo);
  const erros = prog.erros.filter(e => e.nivel === 'erro');
  if (erros.length) { $('#sub').innerHTML = `<div class="erro">Esse jogo tem erro no código 😵<br>linha ${erros[0].linha}: ${erros[0].msg.replace(/</g, '&lt;')}</div>`; return; }
  $('#sub').textContent = document.body.classList.contains('toque') ? '🕹️ joystick pra andar · ⤒ pular · E ação' : 'WASD/setas: andar · Espaço: pular · E: ação · mouse: girar a câmera';
  const b = $('#bJogar'); b.hidden = false; b.focus();
  let motor = null;
  b.onclick = () => {
    $('#capa').remove(); document.body.classList.add('jogando');
    motor = new Motor($('#cv'), $('#hud'), { erro: e => { $('#hud').insertAdjacentHTML('beforeend', `<div class="hud-fim"><div>Deu erro no jogo 😵</div><small>linha ${e.linha}: ${String(e.message).replace(/</g, '&lt;')}</small></div>`); } });
    motor.manterTeclas = document.body.classList.contains('toque');
    motor.carregar(prog);
    $('#cv').focus();
  };
  // joystick e botões
  const joy = $('#joy'), bola = $('#joyBola'); let id = null;
  const mover = e => {
    const r = joy.getBoundingClientRect();
    let dx = (e.clientX - (r.left + r.width / 2)) / (r.width / 2), dy = (e.clientY - (r.top + r.height / 2)) / (r.height / 2);
    const m = Math.hypot(dx, dy); if (m > 1) { dx /= m; dy /= m; }
    bola.style.transform = `translate(${dx * 38}px, ${dy * 38}px)`;
    if (!motor) return; const T = motor.teclas;
    ['w', 'a', 's', 'd', 'shift'].forEach(k => T.delete(k));
    if (dy < -0.38) T.add('w'); if (dy > 0.38) T.add('s'); if (dx < -0.38) T.add('a'); if (dx > 0.38) T.add('d'); if (m > 0.97) T.add('shift');
  };
  const parar = () => { id = null; bola.style.transform = ''; if (motor) ['w', 'a', 's', 'd', 'shift'].forEach(k => motor.teclas.delete(k)); };
  joy.addEventListener('pointerdown', e => { id = e.pointerId; joy.setPointerCapture(id); mover(e); e.preventDefault(); e.stopPropagation(); });
  joy.addEventListener('pointermove', e => { if (e.pointerId === id) mover(e); });
  joy.addEventListener('pointerup', parar); joy.addEventListener('pointercancel', parar);
  document.querySelectorAll('#botoes button').forEach(bt => {
    const k = bt.dataset.k;
    bt.addEventListener('pointerdown', e => { e.preventDefault(); e.stopPropagation(); bt.setPointerCapture(e.pointerId); bt.classList.add('on'); if (motor) { if (!motor.teclas.has(k)) motor.apertou(k); motor.teclas.add(k); } });
    const solta = () => { bt.classList.remove('on'); motor?.teclas.delete(k); };
    bt.addEventListener('pointerup', solta); bt.addEventListener('pointercancel', solta);
  });
})();
})();
