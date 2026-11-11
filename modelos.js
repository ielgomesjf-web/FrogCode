// Modelos 3D do FrogCode, feitos só com formas simples (leve pra qualquer computador)
(function (G) {
'use strict';
const T = G.THREE;
const mats = {};
function mat(cor, extra = {}) {
  const k = cor + JSON.stringify(extra);
  if (!mats[k]) mats[k] = new T.MeshStandardMaterial({ color: cor, roughness: 0.75, metalness: 0, ...extra });
  return mats[k];
}
function malha(geo, m, x = 0, y = 0, z = 0) {
  const me = new T.Mesh(geo, m); me.position.set(x, y, z); me.castShadow = true; me.receiveShadow = true; return me;
}
function olhos(g, y, z, sep, r, bravo) {
  for (const s of [-1, 1]) {
    const o = malha(new T.SphereGeometry(r, 12, 10), mat('#ffffff'), s * sep, y, z);
    const p = malha(new T.SphereGeometry(r * 0.5, 10, 8), mat('#111111'), s * sep, y, z + r * 0.65);
    g.add(o, p);
    if (bravo) {
      const sob = malha(new T.BoxGeometry(r * 1.6, r * 0.35, r * 0.3), mat('#111111'), s * sep, y + r * 1.05, z + r * 0.4);
      sob.rotation.z = s * 0.45; g.add(sob);
    }
  }
}
function forma2D(pontos, prof, cor, emissivo) {
  const sh = new T.Shape(); sh.moveTo(pontos[0][0], pontos[0][1]);
  for (const [x, y] of pontos.slice(1)) sh.lineTo(x, y);
  const geo = new T.ExtrudeGeometry(sh, { depth: prof, bevelEnabled: true, bevelThickness: 0.03, bevelSize: 0.03, bevelSegments: 1 });
  geo.center();
  return malha(geo, mat(cor, { emissive: emissivo || '#000000', emissiveIntensity: 0.35, metalness: 0.3, roughness: 0.4 }));
}
function textoEmoji(emoji) {
  const c = document.createElement('canvas'); c.width = c.height = 128;
  const g = c.getContext('2d');
  g.font = '100px "Segoe UI Emoji","Apple Color Emoji","Noto Color Emoji",sans-serif';
  g.textAlign = 'center'; g.textBaseline = 'middle'; g.fillText(emoji, 64, 72);
  const tx = new T.CanvasTexture(c); tx.encoding = T.sRGBEncoding;
  return tx;
}

// cada modelo devolve: { g: o grupo 3D, caixa: [largura, altura, fundura] pra bater (ou null), raio }
const M = {
  sapo(cor = '#4caf50') {
    const g = new T.Group();
    const corpo = malha(new T.SphereGeometry(0.45, 20, 16), mat(cor), 0, 0.42, 0); corpo.scale.set(1, 0.85, 1.05);
    const barriga = malha(new T.SphereGeometry(0.36, 16, 12), mat('#d6f5b0'), 0, 0.36, 0.14); barriga.scale.set(1, 0.85, 0.8);
    g.add(corpo, barriga); olhos(g, 0.8, 0.2, 0.2, 0.14);
    for (const s of [-1, 1]) g.add(malha(new T.SphereGeometry(0.16, 10, 8), mat(cor), s * 0.33, 0.12, 0.2));
    return { cor, g, caixa: [0.8, 1, 0.8], raio: 0.45 };
  },
  robo(cor = '#90a4ae') {
    const g = new T.Group();
    g.add(malha(new T.BoxGeometry(0.62, 0.55, 0.45), mat(cor, { metalness: 0.4, roughness: 0.4 }), 0, 0.45, 0));
    g.add(malha(new T.BoxGeometry(0.5, 0.4, 0.42), mat(cor, { metalness: 0.4, roughness: 0.4 }), 0, 0.95, 0));
    for (const s of [-1, 1]) {
      g.add(malha(new T.BoxGeometry(0.1, 0.08, 0.05), mat('#00e5ff', { emissive: '#00e5ff', emissiveIntensity: 1 }), s * 0.12, 0.98, 0.22));
      g.add(malha(new T.BoxGeometry(0.15, 0.2, 0.2), mat('#546e7a'), s * 0.17, 0.1, 0));
    }
    g.add(malha(new T.CylinderGeometry(0.02, 0.02, 0.25), mat('#546e7a'), 0, 1.25, 0));
    g.add(malha(new T.SphereGeometry(0.06), mat('#ff5252', { emissive: '#ff5252', emissiveIntensity: 1 }), 0, 1.38, 0));
    return { cor, g, caixa: [0.7, 1.15, 0.7], raio: 0.45 };
  },
  pinguim(cor = '#263238') {
    const g = new T.Group();
    const c = malha(new T.SphereGeometry(0.42, 18, 14), mat(cor), 0, 0.5, 0); c.scale.set(1, 1.3, 0.95);
    const b = malha(new T.SphereGeometry(0.34, 16, 12), mat('#ffffff'), 0, 0.45, 0.12); b.scale.set(1, 1.25, 0.8);
    g.add(c, b); olhos(g, 0.85, 0.28, 0.13, 0.08);
    const bico = malha(new T.ConeGeometry(0.08, 0.2, 8), mat('#ff9800'), 0, 0.75, 0.42); bico.rotation.x = Math.PI / 2; g.add(bico);
    return { cor, g, caixa: [0.8, 1.05, 0.8], raio: 0.45 };
  },
  cubo(cor = '#ff7043') {
    const g = new T.Group(); g.add(malha(new T.BoxGeometry(0.85, 0.85, 0.85), mat(cor), 0, 0.425, 0)); olhos(g, 0.55, 0.43, 0.17, 0.1);
    return { cor, g, caixa: [0.85, 0.85, 0.85], raio: 0.45 };
  },
  bola(cor = '#42a5f5') {
    const g = new T.Group(); g.add(malha(new T.SphereGeometry(0.45, 20, 16), mat(cor), 0, 0.45, 0)); olhos(g, 0.6, 0.36, 0.15, 0.1);
    return { cor, g, caixa: [0.8, 0.9, 0.8], raio: 0.45 };
  },
  emoji(_, emoji = '🙂') {
    const g = new T.Group();
    const sp = new T.Sprite(new T.SpriteMaterial({ map: textoEmoji(emoji), transparent: true }));
    sp.scale.set(1, 1, 1); sp.position.y = 0.5; g.add(sp);
    return { g, caixa: [0.8, 1, 0.8], raio: 0.45 };
  },

  // ---- coletáveis ----
  moeda(cor = '#ffc107') {
    const g = new T.Group();
    const m = malha(new T.CylinderGeometry(0.32, 0.32, 0.08, 24), mat(cor, { metalness: 0.7, roughness: 0.3, emissive: cor, emissiveIntensity: 0.25 }));
    m.rotation.x = Math.PI / 2; g.add(m);
    return { cor, g, caixa: null, raio: 0.4 };
  },
  estrela(cor = '#ffeb3b') {
    const p = []; for (let i = 0; i < 10; i++) { const r = i % 2 ? 0.17 : 0.4, a = i / 10 * Math.PI * 2 + Math.PI / 2; p.push([Math.cos(a) * r, Math.sin(a) * r]); }
    const g = new T.Group(); g.add(forma2D(p, 0.12, cor, cor)); return { cor, g, caixa: null, raio: 0.45 };
  },
  gema(cor = '#26c6da') {
    const g = new T.Group(); const m = malha(new T.OctahedronGeometry(0.3), mat(cor, { metalness: 0.3, roughness: 0.15, emissive: cor, emissiveIntensity: 0.3, flatShading: true }));
    m.scale.y = 1.4; g.add(m); return { cor, g, caixa: null, raio: 0.4 };
  },
  coracao(cor = '#e53935') {
    const sh = new T.Shape();
    sh.moveTo(0, -0.3); sh.bezierCurveTo(-0.45, 0, -0.35, 0.35, 0, 0.18); sh.bezierCurveTo(0.35, 0.35, 0.45, 0, 0, -0.3);
    const geo = new T.ExtrudeGeometry(sh, { depth: 0.14, bevelEnabled: true, bevelThickness: 0.03, bevelSize: 0.03, bevelSegments: 2 }); geo.center();
    const g = new T.Group(); g.add(malha(geo, mat(cor, { emissive: cor, emissiveIntensity: 0.3 }))); return { cor, g, caixa: null, raio: 0.4 };
  },
  chave(cor = '#ffc107') {
    const g = new T.Group(); const m = mat(cor, { metalness: 0.7, roughness: 0.3 });
    g.add(malha(new T.TorusGeometry(0.13, 0.04, 8, 16), m, 0, 0.2, 0));
    g.add(malha(new T.BoxGeometry(0.06, 0.4, 0.06), m, 0, -0.08, 0));
    g.add(malha(new T.BoxGeometry(0.14, 0.05, 0.06), m, 0.07, -0.22, 0));
    return { cor, g, caixa: null, raio: 0.4 };
  },

  // ---- sólidos ----
  arvore(cor = '#43a047') {
    const g = new T.Group();
    g.add(malha(new T.CylinderGeometry(0.16, 0.22, 1.3, 8), mat('#6d4c41'), 0, 0.65, 0));
    const copa = malha(new T.IcosahedronGeometry(0.95, 1), mat(cor, { flatShading: true }), 0, 1.9, 0); g.add(copa);
    return { cor, g, caixa: [0.5, 1.4, 0.5], raio: 0.5 };
  },
  pinheiro(cor = '#2e7d32') {
    const g = new T.Group();
    g.add(malha(new T.CylinderGeometry(0.14, 0.18, 0.8, 8), mat('#6d4c41'), 0, 0.4, 0));
    [[1, 1.2], [0.8, 1.9], [0.55, 2.5]].forEach(([r, y]) => g.add(malha(new T.ConeGeometry(r, 1.1, 8), mat(cor, { flatShading: true }), 0, y, 0)));
    return { cor, g, caixa: [0.5, 1.4, 0.5], raio: 0.5 };
  },
  pedra(cor = '#8d939b') {
    const g = new T.Group(); const m = malha(new T.DodecahedronGeometry(0.55, 0), mat(cor, { flatShading: true }), 0, 0.35, 0);
    m.scale.set(1.2, 0.8, 1); m.rotation.y = Math.random() * 6; g.add(m);
    return { cor, g, caixa: [1.2, 0.75, 1.1], raio: 0.6 };
  },
  caixa(cor = '#b5835a') {
    const g = new T.Group(); g.add(malha(new T.BoxGeometry(1, 1, 1), mat(cor), 0, 0.5, 0));
    const e = new T.LineSegments(new T.EdgesGeometry(new T.BoxGeometry(1.002, 1.002, 1.002)), new T.LineBasicMaterial({ color: '#5d3a1a' }));
    e.position.y = 0.5; g.add(e);
    return { cor, g, caixa: [1, 1, 1], raio: 0.6 };
  },
  bloco(cor = '#ff7043') { const r = M.caixa(cor); return r; },
  casa(cor = '#e8d5b0') {
    const g = new T.Group();
    g.add(malha(new T.BoxGeometry(4, 2.6, 4), mat(cor), 0, 1.3, 0));
    const t = malha(new T.ConeGeometry(3.3, 1.8, 4), mat('#c62828', { flatShading: true }), 0, 3.5, 0); t.rotation.y = Math.PI / 4; g.add(t);
    g.add(malha(new T.BoxGeometry(0.9, 1.6, 0.1), mat('#6d4c41'), 0, 0.8, 2.01));
    for (const s of [-1, 1]) g.add(malha(new T.BoxGeometry(0.7, 0.7, 0.1), mat('#90caf9', { emissive: '#90caf9', emissiveIntensity: 0.2 }), s * 1.2, 1.6, 2.01));
    return { cor, g, caixa: [4, 2.6, 4], raio: 2.2 };
  },

  // ---- inimigos e perigos ----
  inimigo(cor = '#8e24aa') {
    const g = new T.Group();
    const c = malha(new T.SphereGeometry(0.45, 18, 14), mat(cor), 0, 0.45, 0); c.scale.set(1, 0.9, 1); g.add(c);
    olhos(g, 0.58, 0.33, 0.16, 0.11, true);
    for (let i = 0; i < 5; i++) {
      const a = i / 5 * Math.PI * 2; const e = malha(new T.ConeGeometry(0.08, 0.25, 6), mat('#311b92'), Math.cos(a) * 0.25, 0.82, Math.sin(a) * 0.25 - 0.05);
      e.rotation.z = -Math.cos(a) * 0.5; e.rotation.x = Math.sin(a) * 0.5; g.add(e);
    }
    return { cor, g, caixa: [0.8, 0.85, 0.8], raio: 0.45 };
  },
  espinho(cor = '#b0bec5') {
    const g = new T.Group(); const m = mat(cor, { metalness: 0.6, roughness: 0.3 });
    g.add(malha(new T.BoxGeometry(1, 0.1, 1), mat('#455a64'), 0, 0.05, 0));
    for (const [x, z] of [[-0.25, -0.25], [0.25, -0.25], [-0.25, 0.25], [0.25, 0.25], [0, 0]]) g.add(malha(new T.ConeGeometry(0.14, 0.55, 6), m, x, 0.35, z));
    return { cor, g, caixa: [1, 0.5, 1], raio: 0.5 };
  },

  // ---- marcos e enfeites ----
  bandeira(cor = '#e53935') {
    const g = new T.Group();
    g.add(malha(new T.CylinderGeometry(0.05, 0.05, 2.6, 8), mat('#eeeeee'), 0, 1.3, 0));
    g.add(malha(new T.SphereGeometry(0.1), mat('#ffc107', { metalness: 0.6 }), 0, 2.65, 0));
    const f = malha(new T.BoxGeometry(0.9, 0.55, 0.04), mat(cor), 0.47, 2.25, 0); f.name = 'pano'; g.add(f);
    g.add(malha(new T.CylinderGeometry(0.3, 0.35, 0.15, 12), mat('#757575'), 0, 0.07, 0));
    return { cor, g, caixa: null, raio: 0.8 };
  },
  portal(cor = '#7c4dff') {
    const g = new T.Group();
    g.add(malha(new T.TorusGeometry(0.9, 0.12, 10, 30), mat(cor, { emissive: cor, emissiveIntensity: 0.8 }), 0, 1.1, 0));
    const d = new T.Mesh(new T.CircleGeometry(0.85, 30), new T.MeshBasicMaterial({ color: cor, transparent: true, opacity: 0.45, side: T.DoubleSide }));
    d.position.y = 1.1; d.name = 'disco'; g.add(d);
    return { cor, g, caixa: null, raio: 1 };
  },
  flor(cor = '#ec407a') {
    const g = new T.Group();
    g.add(malha(new T.CylinderGeometry(0.03, 0.03, 0.5), mat('#388e3c'), 0, 0.25, 0));
    for (let i = 0; i < 5; i++) { const a = i / 5 * Math.PI * 2; g.add(malha(new T.SphereGeometry(0.09, 8, 6), mat(cor), Math.cos(a) * 0.12, 0.52, Math.sin(a) * 0.12)); }
    g.add(malha(new T.SphereGeometry(0.07, 8, 6), mat('#ffeb3b'), 0, 0.53, 0));
    return { cor, g, caixa: null, raio: 0.3 };
  },
};

function bloco(w, h, d, cor, topo) { // paredes e plataformas
  const g = new T.Group();
  g.add(malha(new T.BoxGeometry(w, h, d), mat(cor), 0, h / 2, 0));
  if (topo) g.add(malha(new T.BoxGeometry(w + 0.02, 0.1, d + 0.02), mat(topo), 0, h - 0.04, 0));
  return { cor, g, caixa: [w, h, d], raio: Math.max(w, d) / 2 };
}

// peças soltas: cubo, bola, cone, cilindro, pirâmide (base no chão, centro no meio)
function geoForma(forma) {
  switch (forma) {
    case 'cubo': return new T.BoxGeometry(1, 1, 1);
    case 'bola': return new T.SphereGeometry(0.5, 20, 14);
    case 'cone': return new T.ConeGeometry(0.5, 1, 18);
    case 'cilindro': return new T.CylinderGeometry(0.5, 0.5, 1, 18);
    case 'piramide': { const g = new T.ConeGeometry(0.7071, 1, 4); g.rotateY(Math.PI / 4); return g; }
  }
}
function forma(tipo, cor = '#9e9e9e', tam = [1, 1, 1]) {
  const g = new T.Group();
  const m = malha(geoForma(tipo), mat(cor), 0, tam[1] / 2, 0); m.scale.set(tam[0], tam[1], tam[2]); g.add(m);
  return { cor, g, caixa: tam.slice(), raio: Math.max(tam[0], tam[2]) / 2 };
}
// modelo montado pelo jogador com várias peças
function montar(partes) {
  const g = new T.Group();
  if (!partes.length) return { cor: null, g, caixa: [0.6, 0.6, 0.6], raio: 0.3 }; // modelo ainda vazio
  for (const p of partes) {
    const m = malha(geoForma(p.forma), mat(p.cor));
    m.scale.set(p.tam[0], p.tam[1], p.tam[2]);
    m.position.set(p.pos[0], p.pos[1], p.pos[2]);
    m.rotation.set(p.giro[0] * Math.PI / 180, p.giro[1] * Math.PI / 180, p.giro[2] * Math.PI / 180);
    g.add(m);
  }
  const box = new T.Box3().setFromObject(g), tam = box.getSize(new T.Vector3());
  if (box.min.y < 0) g.children.forEach(c => c.position.y -= box.min.y); // não deixa afundar no chão
  const cor = partes[0].cor;
  return { cor, g, caixa: [Math.max(tam.x, 0.2), Math.max(tam.y, 0.2), Math.max(tam.z, 0.2)], raio: Math.max(tam.x, tam.z) / 2 };
}

G.MODELOS = { M, bloco, mat, textoEmoji, forma, montar, geoForma };
})(window);
