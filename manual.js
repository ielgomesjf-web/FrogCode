// Manual e exemplos do FrogCode
(function (G) {
'use strict';

const EXEMPLOS = {
'🐸 kroad - treino primordial.frog': "# Kroad: treino primordial\n# Fase de teste da Etapa 1 (Ribbat: Origem)\n# J = linguada (segure perto de um galho pra balançar) · K = investida\n\njogo: 2D de lado\ncéu: tarde\nchão: grama 120\njogador: sapo cor verdeescuro\njogador em: -55 0\nhabilidades: linguada, investida\npulo do jogador: 2\nvidas: 5\nmostrar: moscas, cristais, vidas\ninimigos: andam sozinhos\n\n# moscas pra pegar com a linguada\ncriar mosca em -50 1.5\ncriar mosca em -48 2.2\ncriar mosca em -46 1.5\n\n# um Tarpotchi no caminho e uma rocha rachada (investida!)\ncriar inimigo em -42 0\ncriar rocha em -37 0\n\n# totem: se cair, volta daqui\ncriar totem em -33 0\n\n# vagem-mola até o cristal lá em cima\ncriar vagem em -28 0\ncriar plataforma em -25 6 tamanho 1\ncriar cristal em -25 7.3\n\n# buraco grande: só passa balançando no galho\ncriar buraco de -20 até -12\ncriar galho em -16 5.5\n\n# buraco com vitória-régia (não fique parado!)\ncriar buraco de -8 até -2\ncriar vitória-régia em -5 0.3\n\ncriar cristal em 5 1.6\ncriar mosca em 8 1.5\ncriar mosca em 10 1.5\n\n# fim: fechar a fenda do portal\ncriar fenda em 50 0\n",
'⭐ lenda do sapo guerreiro.frog': "# ==========================================================\n#   A LENDA DO SAPO GUERREIRO  🐸👑\n#   Um jogo feito no FrogCode — Frogbit Studio\n#\n#   Controles:  WASD / setas = andar   Espaço = pular\n#               E = atirar bolha       Shift = correr\n#               arraste o mouse = girar a câmera\n# ==========================================================\n\njogo: 3D\ncéu: tarde\nchão: grama 60 por 60\nluz: tarde\n\njogador: sapo\njogador em: 0 22\ncâmera em: atrás do jogador 7 metros\npulo do jogador: 1.6 metros\nvidas: 5\n\n# ---------- variáveis ----------\nrecarga: 0\nvida_do_rei: 0\nmostrar: pontos, vidas, vida_do_rei\n\n# ---------- modelos feitos de peças ----------\nmodelo cogumelo:\n  cilindro em 0 0 0 tamanho 0.35 0.9 0.35 cor bege\n  bola em 0 0.9 0 tamanho 1.3 0.6 1.3 cor vermelho\n  bola em 0.3 1.15 0.2 tamanho 0.2 cor branco\n  bola em -0.25 1.12 -0.15 tamanho 0.16 cor branco\n\nmodelo rei:\n  cilindro em 0 0 0 tamanho 1.5 2.3 1.5 cor roxo\n  cone em 0 0 0 tamanho 2.2 1.2 2.2 cor preto\n  bola em 0 2.5 0 tamanho 1.2 cor cinza\n  bola em 0.25 2.6 0.5 tamanho 0.22 cor amarelo\n  bola em -0.25 2.6 0.5 tamanho 0.22 cor amarelo\n  cone em 0 3.2 0 tamanho 0.3 0.5 0.3 cor dourado\n  cone em 0.35 3.15 0 tamanho 0.25 0.4 0.25 cor dourado\n  cone em -0.35 3.15 0 tamanho 0.25 0.4 0.25 cor dourado\n  cubo em 1 1.5 0.3 tamanho 0.4 1.4 0.4 cor roxo giro 0 0 -30\n  cubo em -1 1.5 0.3 tamanho 0.4 1.4 0.4 cor roxo giro 0 0 30\n  tipo: inimigo\n\n# ---------- o vilarejo ----------\ncriar casa em 14 10\ncriar casa em -14 10\ncriar casa em -18 -4\ncriar casa em 18 -2\ncriar 20 árvores espalhadas\ncriar 10 pinheiros espalhados\ncriar 10 pedras espalhadas\ncriar 30 flores espalhadas\nrepetir 8 vezes:\n  criar cogumelo em (aleatório -26 26) (aleatório -8 26)\n\n# ---------- o castelo do Rei Sombrio (no fundo do mapa) ----------\ncriar parede de -10 -14 até -4 -14 cor cinza\ncriar parede de 4 -14 até 10 -14 cor cinza\ncriar parede de -10 -14 até -10 -28 cor cinza\ncriar parede de 10 -14 até 10 -28 cor cinza\ncriar parede de -10 -28 até 10 -28 cor cinza\ncriar cubo chamado portão em 0 -14 tamanho 8 2.5 0.6 cor marrom sólido\ncriar espinho em -6 -18\ncriar espinho em 6 -18\ncriar espinho em -6 -24\ncriar espinho em 6 -24\n\n# ---------- coisas pra pegar ----------\nrepetir 20 vezes:\n  criar moeda em (aleatório -26 26) (aleatório -10 26)\ncriar 3 corações espalhados\ncriar 2 estrelas espalhadas\n\n# ---------- inimigos ----------\ninimigos: andam sozinhos\nvelocidade dos inimigos: 2.2\nrepetir 6 vezes:\n  criar inimigo em (aleatório -26 26) (aleatório -10 12) com vida 2\n\n# ---------- missões ----------\nobjetivo1: pegar 15 moedas\nobjetivo2: pegar a chave\nobjetivo3: derrotar o rei\nobjetivo4: chegar no portal\n\n# ---------- comandos inventados ----------\nensinar atirar:\n  criar bola chamada bolha na frente do jogador tamanho 0.35 cor azulclaro com velocidade 18 fantasma\n  som tiro\n\n# ---------- começo ----------\nquando o jogo começar:\n  mensagem \"O Rei Sombrio roubou a paz do vilarejo!\"\n  esperar 3 segundos\n  mensagem \"Junte 15 moedas pra comprar a chave do castelo\"\n  esperar 3 segundos\n  mensagem \"Aperte E pra atirar bolhas!\"\n\n# ---------- atirar ----------\nquando apertar e:\n  se recarga = 0:\n    atirar\n    recarga = 1\n\na cada 0.35 segundos:\n  recarga = 0\n\n# ---------- o que acontece todo quadro ----------\nsempre:\n  para cada bolha:\n    andar isso para frente\n    se distância até jogador > 25:\n      remover isso\n\n  para cada inimigo:\n    se distância até jogador menor que 9:\n      andar isso até jogador\n\n  para cada fogo:\n    andar isso para frente\n    se distância até jogador > 30:\n      remover isso\n\n  se existe chefe:\n    se distância de chefe até jogador menor que 22:\n      andar chefe até jogador\n\n# ---------- bolhas acertando ----------\nquando bolha tocar inimigo:\n  remover isso\n  aquilo.vida - 1\n  aquilo.cor = vermelho\n  esperar 0.15 segundos\n  aquilo.cor = roxo\n  se aquilo.vida menor que 1:\n    derrotar aquilo\n    pontos + 5\n\nquando bolha tocar rei:\n  remover isso\n  aquilo.vida - 1\n  vida_do_rei = aquilo.vida\n  tremer tela\n  aquilo.cor = vermelho\n  esperar 0.15 segundos\n  aquilo.cor = roxo\n  se aquilo.vida menor que 1:\n    derrotar aquilo\n    pontos + 50\n\nquando derrotar inimigo:\n  mensagem \"Inimigo derrotado! 💥\"\n\n# ---------- poderes ----------\nquando pegar estrela:\n  mensagem \"TURBO! ⚡\"\n  velocidade do jogador: 10\n  jogador.tamanho = 1.4\n  esperar 6 segundos\n  velocidade do jogador: 5\n  jogador.tamanho = 1\n  mensagem \"O turbo acabou\"\n\nquando pegar coração:\n  mensagem \"+1 vida ❤️\"\n\n# ---------- inimigos novos de vez em quando ----------\na cada 12 segundos:\n  se quantos inimigos menor que 8:\n    criar inimigo em (aleatório -26 26) (aleatório -10 12) com vida 2\n\n# ---------- missões ----------\nquando completar objetivo1:\n  criar chave em 0 4\n  mensagem \"A chave apareceu no meio do vilarejo! 🔑\"\n\nquando completar objetivo2:\n  remover portão\n  som explosao\n  tremer tela\n  céu: \"#4a2060\"\n  criar rei chamado chefe em 0 -24 com vida 12 e velocidade 1.8\n  vida_do_rei = 12\n  mensagem \"O portão abriu... O REI SOMBRIO ACORDOU! 👑\"\n\na cada 1.6 segundos:\n  se existe chefe:\n    se distância de chefe até jogador menor que 18:\n      virar chefe para jogador\n      criar bola chamada fogo na frente do chefe tamanho 0.6 cor laranja perigoso com velocidade 9\n      som tiro\n\nquando tocar fogo:\n  remover isso\n  tremer tela\n\nquando derrotar rei:\n  céu: tarde\n  vida_do_rei = 0\n  criar portal em 0 -24\n  mensagem \"O rei caiu! Entre no portal 🌀\"\n\nquando completar objetivo4:\n  ganhar \"O Sapo Guerreiro salvou o vilarejo! 🐸👑\"\n",
'caça às moedas.frog': `# Caça às moedas 🐸
# Pegue as 10 moedas e depois vá até a bandeira!

jogo: 3D
céu: dia
chão: grama 40 por 40

jogador: sapo
câmera em: atrás do jogador 6 metros

criar 10 moedas espalhadas
criar 15 árvores espalhadas
criar 8 pedras espalhadas
criar 3 inimigos espalhados
inimigos: seguem o jogador

objetivo1: ir atrás das 10 moedas
objetivo2: chegar na bandeira

mostrar: pontos, vidas

quando completar objetivo1:
  criar bandeira em 0 -15
  mensagem "A bandeira apareceu lá no fundo!"

quando derrotar inimigo:
  pontos + 5
  mensagem "Pisão! +5"
`,
'plataforma 2D.frog': `# Plataforma 2D: pule nas plataformas até a bandeira

jogo: 2D de lado
céu: tarde
chão: terra 80
jogador: robô
pulo do jogador: 2.5 metros

criar plataforma em 6 2 tamanho 1
criar plataforma em 11 3.5 tamanho 1
criar plataforma em 17 2.5 tamanho 1
criar bloco de 22 0 até 22 1
criar 12 moedas espalhadas
criar 4 inimigos espalhados
criar espinho em 14 0
criar bandeira em 35 0
inimigos: andam sozinhos

objetivo1: chegar na bandeira
mostrar: pontos, vidas

quando derrotar inimigo:
  pontos + 5
  mensagem "Pisão!"
`,
'dragão atirador.frog': `# Dragão atirador 🐉 — tudo controlado por você
jogo: 3D
céu: tarde
chão: areia 40 por 40
câmera em: atrás do jogador 7 metros

modelo dragão:
  cubo em 0 0.6 0 tamanho 0.8 0.7 1.3 cor verde
  bola em 0 1.15 0.65 tamanho 0.6 cor verde
  cone em 0 1.55 0.6 tamanho 0.15 0.35 0.15 cor amarelo
  cubo em 0.65 0.9 -0.1 tamanho 0.9 0.08 0.6 cor verdeclaro
  cubo em -0.65 0.9 -0.1 tamanho 0.9 0.08 0.6 cor verdeclaro
  cone em 0 0.6 -0.9 tamanho 0.25 0.6 0.25 cor verde giro 90 0 0

jogador: dragão
inimigos: ficam parados
criar 6 inimigos espalhados com vida 3
criar cubo chamado torre em 0 -10 tamanho 2 6 2 cor roxo sólido

objetivo1: derrotar todos os inimigos

ensinar atirar:
  criar bola chamada bala na frente do jogador tamanho 0.3 cor laranja com velocidade 20
  som tiro

quando apertar e: atirar

sempre:
  girar torre 1
  para cada bala:
    andar isso para frente
    se distância até jogador > 30:
      remover isso
  para cada inimigo:
    se distância até jogador < 12:
      andar isso até jogador

quando bala tocar inimigo:
  remover isso
  aquilo.vida - 1
  aquilo.cor = vermelho
  se aquilo.vida < 1:
    derrotar aquilo
    pontos + 10

`,
'sobrevivência.frog': `# Sobrevivência na neve 🐧
# Fuja dos monstros por 45 segundos!

jogo: 3D
céu: noite
chão: neve 30 por 30
jogador: pinguim
câmera em: cima do jogador 14 metros
vidas: 5

objetivo1: sobreviver 45 segundos
mostrar: vidas, tempo

inimigos: seguem o jogador
velocidade dos inimigos: 3
criar 3 corações espalhados

a cada 3 segundos:
  criar inimigo espalhado

quando tocar inimigo:
  remover isso
  tremer tela
`,
};

// cada capítulo: título + conteúdo. Blocos <pre> viram exemplos com botão de copiar.
const MANUAL = [
{ id: 'comecar', titulo: '1. Começando', html: `
<p>O <b>FrogCode</b> é uma linguagem pra fazer jogos escrevendo quase como se estivesse falando.
Cada linha é uma coisa que o jogo tem ou faz. O jeito é sempre:</p>
<pre>coisa: valor</pre>
<p>Um jogo inteiro pode ser só isso:</p>
<pre>jogo: 3D
jogador: sapo
câmera em: atrás do jogador 5 metros
criar 10 moedas espalhadas
objetivo1: ir atrás das 10 moedas</pre>
<p>Aperte <kbd>▶ Rodar</kbd> (ou <kbd>F5</kbd> / <kbd>Ctrl+Enter</kbd>) pra jogar. Clique no jogo pra ele ouvir o teclado.</p>
<h4>Regras de ouro</h4>
<ul>
<li><b>Acento e letra maiúscula tanto faz</b>: <code>câmera</code> e <code>camera</code> são iguais.</li>
<li><b>Metros</b>: pode escrever <code>3 metros</code>, <code>3metros</code>, <code>3m</code> ou só <code>3</code>.</li>
<li><b>Texto</b> vai entre aspas: <code>"Olá!"</code></li>
<li><b>Comentário</b>: tudo depois de <code>#</code> o jogo ignora. Use pra anotar.</li>
<li>Linhas que terminam com <b>dois-pontos</b> (<code>quando...:</code>, <code>se...:</code>) abrem um bloco: as linhas de dentro ficam <b>2 espaços mais pra direita</b>.</li>
</ul>` },

{ id: 'mundo', titulo: '2. O mundo', html: `
<pre>jogo: 3D</pre>
<p>Tipos de jogo: <code>3D</code>, <code>2D de lado</code> (plataforma, tipo Mario) e <code>2D de cima</code> (visto de cima).</p>
<pre>céu: dia</pre>
<p>Céus: <code>dia</code>, <code>tarde</code>, <code>por do sol</code>, <code>noite</code> (com estrelas!), <code>nublado</code> ou qualquer cor.</p>
<pre>chão: grama 40 por 40</pre>
<p>Chãos: <code>grama</code>, <code>areia</code>, <code>neve</code>, <code>pedra</code>, <code>terra</code>, <code>madeira</code>, <code>gelo</code> ou uma cor. O número é o tamanho em metros. Se andar pra fora do chão, o jogador cai e perde uma vida!</p>
<pre>luz: noite</pre>
<p>Luzes: <code>dia</code>, <code>tarde</code>, <code>noite</code>, <code>forte</code>, <code>fraca</code>.</p>
<pre>gravidade: 20</pre>
<p>Quanto maior, mais rápido as coisas caem. Na Lua seria uns <code>4</code>.</p>` },

{ id: 'jogador', titulo: '3. O jogador', html: `
<pre>jogador: sapo</pre>
<p>Jogadores: <code>sapo</code>, <code>robô</code>, <code>pinguim</code>, <code>cubo</code>, <code>bola</code> ou <b>qualquer emoji</b>:</p>
<pre>jogador: "🦊"</pre>
<p>Dá pra mudar a cor e o tamanho:</p>
<pre>jogador: sapo cor azul tamanho 2</pre>
<pre>jogador em: 0 0
velocidade do jogador: 5
pulo do jogador: 1.5 metros
vidas: 3</pre>
<p><b>jogador em</b> é onde ele começa (2 números: lado e frente/trás). <b>Pulo</b> é a altura em metros (<code>0</code> = não pula).</p>
<h4>Controles</h4>
<p><kbd>WASD</kbd> ou setas andam, <kbd>Espaço</kbd> pula, <kbd>Shift</kbd> corre. No 3D, arraste o mouse pra girar a câmera.
Pular em cima de um inimigo derrota ele!</p>` },

{ id: 'camera', titulo: '4. Câmera', html: `
<pre>câmera em: atrás do jogador 5 metros</pre>
<p>Jeitos de câmera:</p>
<ul>
<li><code>câmera em: atrás do jogador 5 metros</code>: terceira pessoa</li>
<li><code>câmera em: cima do jogador 12 metros</code>: vista de cima</li>
<li><code>câmera em: lado do jogador 8 metros</code>: vista de lado</li>
<li><code>câmera em: primeira pessoa</code>: você vê pelos olhos do jogador (clique pra olhar com o mouse)</li>
<li><code>câmera fixa em: 0 10 20</code>: parada num lugar, olhando pro jogador</li>
</ul>` },

{ id: 'criar', titulo: '5. Criar coisas', html: `
<pre>criar 10 moedas espalhadas</pre>
<pre>criar árvore em 5 3</pre>
<pre>criar caixa em 2 0 tamanho 2 cor vermelho</pre>
<p><b>espalhadas</b> = em lugares sorteados. <b>em X Y</b> = num lugar certo. <b>perto do jogador</b> = ali do lado.</p>
<h4>Coisas que dá pra pegar</h4>
<p><code>moeda</code> (+1 ponto) · <code>estrela</code> (+5) · <code>gema</code> (+3) · <code>coração</code> (+1 vida) · <code>chave</code> · qualquer emoji: <code>criar 5 "🍎" espalhados</code></p>
<h4>Coisas sólidas (bloqueiam e dá pra subir)</h4>
<p><code>árvore</code> · <code>pinheiro</code> · <code>pedra</code> · <code>caixa</code> · <code>bloco</code> · <code>parede</code> · <code>casa</code> · <code>plataforma</code></p>
<pre>criar plataforma em 4 2 6</pre>
<p>Plataforma no 3D: 3 números (lado, <b>altura</b>, frente/trás). No 2D de lado: 2 números (lado, altura).</p>
<pre>criar parede de 0 0 até 10 0</pre>
<p>Uma parede (ou fileira de blocos) de um ponto até outro.</p>
<h4>Perigos</h4>
<p><code>inimigo</code> (anda e machuca) · <code>espinho</code> (parado e machuca)</p>
<pre>inimigos: seguem o jogador
velocidade dos inimigos: 2.5</pre>
<p>Inimigos podem: <code>seguem o jogador</code>, <code>andam sozinhos</code> ou <code>ficam parados</code>.</p>
<h4>Marcos e enfeites</h4>
<p><code>bandeira</code> · <code>portal</code> (pra objetivos de chegar) · <code>flor</code> (só enfeite)</p>` },

{ id: 'objetivos', titulo: '6. Objetivos', html: `
<p>Objetivos são as missões. O jogo mostra um de cada vez, em ordem. Quando acaba o último, você vence!</p>
<pre>objetivo1: ir atrás das 10 moedas
objetivo2: chegar na bandeira</pre>
<p>Tipos que o jogo entende sozinho:</p>
<ul>
<li><code>ir atrás das 10 moedas</code> / <code>pegar todas as estrelas</code></li>
<li><code>chegar na bandeira</code> / <code>chegar no portal</code></li>
<li><code>derrotar 5 inimigos</code> / <code>derrotar todos os inimigos</code></li>
<li><code>sobreviver 60 segundos</code> (ou <code>2 minutos</code>)</li>
<li><code>fazer 50 pontos</code></li>
</ul>
<p>Qualquer outro texto vira um <b>objetivo livre</b>: você decide quando ele termina com <code>completar objetivo</code>.</p>
<pre>objetivo1: abrir o baú
quando tocar caixa:
  completar objetivo</pre>` },

{ id: 'quando', titulo: '7. Quando... (eventos)', html: `
<p>"Quando" faz alguma coisa acontecer numa hora certa. As linhas de dentro ficam 2 espaços pra direita:</p>
<pre>quando pegar moeda:
  som moeda
  mensagem "Uma moeda!"</pre>
<p>Se for uma coisa só, pode escrever na mesma linha:</p>
<pre>quando pegar estrela: mensagem "Brilhou!"</pre>
<ul>
<li><code>quando pegar moeda:</code></li>
<li><code>quando tocar inimigo:</code> (serve pra qualquer coisa: caixa, bandeira, portal…)</li>
<li><code>quando derrotar inimigo:</code></li>
<li><code>quando apertar E:</code> (qualquer tecla: <code>espaço</code>, <code>enter</code>, letras, números)</li>
<li><code>quando completar objetivo1:</code></li>
<li><code>quando pontos chegar a 10:</code> (qualquer conta que vira verdade)</li>
<li><code>quando vidas acabarem:</code> (se não tiver, o jogo só acaba)</li>
<li><code>quando o jogo começar:</code></li>
<li><code>a cada 2 segundos:</code></li>
<li><code>sempre:</code> (todo quadro, 60 vezes por segundo)</li>
</ul>
<p>Dentro de "quando pegar / tocar / derrotar", a coisa se chama <b>isso</b>:</p>
<pre>quando tocar caixa:
  remover isso</pre>` },

{ id: 'acoes', titulo: '8. Ações', html: `
<ul>
<li><code>mensagem "Oi!"</code>: escreve no meio da tela</li>
<li><code>som moeda</code>: sons: moeda, pulo, tiro, explosão, dano, poder, objetivo, ganhou, perdeu</li>
<li><code>criar 3 inimigos perto do jogador</code></li>
<li><code>remover isso</code> / <code>remover todos os inimigos</code></li>
<li><code>esperar 2 segundos</code></li>
<li><code>levar jogador para 0 0</code> / <code>voltar ao início</code></li>
<li><code>velocidade do jogador: 10</code>: dá pra mudar no meio do jogo (super velocidade!)</li>
<li><code>jogador: robô</code>: o jogador se transforma</li>
<li><code>céu: noite</code>: muda o céu</li>
<li><code>tremer tela</code></li>
<li><code>completar objetivo</code></li>
<li><code>ganhar "Você é demais!"</code> / <code>perder "Ops!"</code></li>
<li><code>recomeçar</code></li>
</ul>
<pre>quando apertar E:
  velocidade do jogador: 12
  mensagem "TURBO!"
  esperar 3 segundos
  velocidade do jogador: 5</pre>` },

{ id: 'contas', titulo: '9. Variáveis e contas', html: `
<p>Variável é uma caixinha que guarda um número. <b>pontos</b>, <b>vidas</b> e <b>tempo</b> já existem. Pra criar outra, escreva no começo:</p>
<pre>chaves: 0</pre>
<p>Mudar o valor:</p>
<pre>pontos + 10
vidas - 1
chaves = 3</pre>
<p>Mostrar na tela:</p>
<pre>mostrar: pontos, vidas, chaves</pre>
<h4>Se / senão</h4>
<pre>quando apertar espaço:
  se pontos maior que 10:
    mensagem "Você é rico!"
  senão:
    mensagem "Pegue mais moedas"</pre>
<p>Comparar: <code>=</code> <code>!=</code> <code>&gt;</code> <code>&lt;</code> <code>&gt;=</code> <code>&lt;=</code>, ou em palavras: <code>maior que</code>, <code>menor que</code>, <code>igual a</code>, <code>chegar a</code>. Juntar: <code>e</code>, <code>ou</code>, <code>não</code>.</p>
<h4>Números especiais</h4>
<ul>
<li><code>aleatório 1 10</code>: sorteia um número</li>
<li><code>quantos inimigos</code>: quantos existem agora</li>
<li><code>moedas pegas</code> / <code>inimigos derrotados</code></li>
<li><code>tecla E</code>: verdade enquanto segura a tecla</li>
</ul>
<pre>repetir 5 vezes:
  criar moeda perto do jogador</pre>` },

{ id: 'cores', titulo: '10. Cores e teclas', html: `
<p><b>Cores:</b> preto, branco, vermelho, verde, azul, amarelo, laranja, roxo, rosa, cinza, marrom, ciano, dourado, prata, bege, verdeclaro, verdeescuro, azulclaro, azulescuro, ou um código entre aspas: <code>"#ff8800"</code></p>
<p><b>Teclas:</b> espaço, enter, shift, cima, baixo, esquerda, direita, letras de a até z, números de 0 até 9.</p>
<p><b>Atalhos do editor:</b> <kbd>F5</kbd> ou <kbd>Ctrl+Enter</kbd> roda · <kbd>Tab</kbd> aceita a sugestão · <kbd>Ctrl+/</kbd> transforma a linha em comentário.</p>` },
{ id: 'total', titulo: '11. Controle total 🔧', html: `
<p>Até aqui o jogo decidia muita coisa sozinho. Agora <b>você manda em tudo</b>.</p>

<h4>Dar nome pras coisas</h4>
<pre>criar inimigo chamado zé em 5 5 com vida 3 e velocidade 2</pre>
<p><b>chamado</b> dá um nome. <b>com</b> cria propriedades suas (vida, dano, força… o nome que quiser).
Pra criar várias com o mesmo nome: <code>criar 5 bolas chamadas balão espalhadas</code>.</p>

<h4>Propriedades (o ponto)</h4>
<pre>zé.x = 10
zé.vida - 1
zé.cor = vermelho
zé.tamanho = 2
zé.giro = 90
zé.visível = falso</pre>
<p>Toda coisa tem: <code>x</code>, <code>y</code> (altura), <code>z</code>, <code>giro</code> (graus), <code>tamanho</code>, <code>cor</code>, <code>visível</code>, <code>velocidade</code>, <code>pulo</code> + as que você inventar.
O <b>jogador</b> também: <code>jogador.x</code>, <code>jogador.velocidade = 10</code>, e <code>jogador.invencível = sim</code> (inimigo e espinho não tiram vida; <code>= não</code> volta ao normal).
Usar o nome de um tipo mexe em todos: <code>inimigos.cor = azul</code>.</p>

<h4>Mexer</h4>
<ul>
<li><code>mover zé para frente 2</code>: pula 2 metros na hora (frente, trás, esquerda, direita, cima, baixo)</li>
<li><code>mover zé 3 0</code>: 3 pro lado, 0 pra frente</li>
<li><code>andar zé para frente</code>: anda com a velocidade dele. <b>Use dentro de <code>sempre:</code></b></li>
<li><code>andar zé até jogador</code> / <code>andar zé para longe do jogador</code></li>
<li><code>pular zé</code></li>
<li><code>girar zé 90</code> / <code>virar zé para jogador</code></li>
<li><code>levar zé para 0 0</code> / <code>levar zé até jogador</code></li>
<li><code>derrotar zé</code>: tira do jogo e conta como derrotado</li>
</ul>

<h4>Comportamento: você programa</h4>
<pre>inimigos: ficam parados
criar 4 inimigos espalhados
sempre:
  para cada inimigo:
    se distância até jogador menor que 8:
      andar isso até jogador
    senão:
      girar isso 2</pre>
<p><b>para cada</b> faz a mesma coisa com cada um, e dentro dele o da vez se chama <b>isso</b>.</p>
<h4>Perguntas</h4>
<ul>
<li><code>distância até jogador</code> (de "isso") / <code>distância de zé até jogador</code></li>
<li><code>existe zé</code>: verdade se o zé ainda está no jogo</li>
<li><code>zé está tocando jogador</code></li>
<li><code>quantos inimigos</code></li>
</ul>

<h4>Quando uma coisa toca outra</h4>
<pre>quando bala tocar inimigo:
  remover isso
  aquilo.vida - 1
  se aquilo.vida menor que 1:
    derrotar aquilo</pre>
<p><b>isso</b> é o primeiro (a bala) e <b>aquilo</b> é o segundo (o inimigo que levou).</p>

<h4>Inventar comandos</h4>
<pre>ensinar atirar:
  criar bola chamada bala na frente do jogador tamanho 0.3 cor laranja com velocidade 20
  som tiro

quando apertar E: atirar</pre>
<p>Pode ter valores: <code>ensinar curar quanto:</code> e depois <code>curar 2</code>. Dentro, <code>quanto</code> vale 2.</p>

<h4>Montar seus modelos</h4>
<pre>modelo boneco:
  cilindro em 0 0 0 tamanho 0.5 1 0.5 cor azul
  bola em 0 1.3 0 tamanho 0.6 cor bege
  cone em 0 1.75 0 tamanho 0.5 0.4 0.5 cor vermelho
  tipo: inimigo

criar boneco chamado guarda em 4 4</pre>
<p>Peças: <code>cubo</code>, <code>bola</code>, <code>cone</code>, <code>cilindro</code>, <code>pirâmide</code>. Cada uma com <b>em</b> (lado, altura, frente), <b>tamanho</b> (1 número ou 3: largura, altura, fundura), <b>cor</b> e <b>giro</b>.
<b>tipo</b>: sólido (padrão), inimigo, pegável, perigoso ou enfeite.
O modelo pode ser o jogador: <code>jogador: boneco</code>. Dá pra criar peça solta também: <code>criar cubo chamado torre em 0 5 tamanho 2 6 2 sólido</code>.</p>` },

{ id: 'visual', titulo: '12. Cena e Modelos (editor visual) 🎬', html: `
<p>Em cima do código tem três botões: <b>📝 Código</b>, <b>🎬 Cena</b> e <b>🧱 Modelos</b>. O código continua sendo o dono do jogo: tudo que você faz na Cena e nos Modelos <b>vira texto no código sozinho</b>.</p>
<h4>🎬 Cena (tipo Unity)</h4>
<ul>
<li><b>Clique</b> num objeto pra escolher. Aparecem setas: arraste a seta vermelha, verde ou azul pra mover.</li>
<li><kbd>W</kbd> mover · <kbd>E</kbd> girar · <kbd>R</kbd> mudar o tamanho</li>
<li><b>Botão direito</b> arrastando gira a vista, a <b>rodinha</b> dá zoom, o <b>botão do meio</b> arrasta a vista.</li>
<li>A <b>paleta</b> embaixo adiciona coisas no meio da vista: casa, árvore, moeda, inimigo...</li>
<li>O <b>inspetor</b> do lado mostra X, Y, Z, giro, tamanho, nome e cor. Dá pra digitar o número certinho.</li>
<li><kbd>Del</kbd> apaga · <kbd>Ctrl+D</kbd> duplica · <kbd>Ctrl+Z</kbd> desfaz · <kbd>F</kbd> foca no escolhido</li>
<li>🧲 <b>Grade</b> faz tudo encaixar de meio em meio metro (e girar de 15 em 15 graus).</li>
<li>Coisas <b>espalhadas</b> (tipo <code>criar 20 árvores espalhadas</code>) têm o botão <b>📌 Fixar</b>: cada uma vira uma linha e dá pra arrastar.</li>
<li>Coisas com 🔒 são criadas por conta, <code>repetir</code> ou <code>quando</code>. Essas só mudam no código.</li>
<li>Embaixo da vista aparece a coordenada do mouse (📍 x, z): é assim que você descobre os números do mapa.</li>
</ul>
<h4>🧱 Modelos (tipo Blender)</h4>
<ul>
<li>Escolha um modelo na lista ou clique em <b>＋ Novo modelo</b>.</li>
<li>Adicione peças embaixo (cubo, bola, cone, cilindro, pirâmide), clique nelas e mexa: <kbd>W</kbd> mover, <kbd>E</kbd> girar, <kbd>R</kbd> esticar.</li>
<li>No inspetor: posição, tamanho, giro, cor, e o que o modelo <b>é</b> (sólido, inimigo, pegável...).</li>
<li><b>🔲 Tudo</b> (ou a tecla <kbd>A</kbd>) seleciona o <b>modelo inteiro</b>: aí as setinhas mexem, giram e aumentam tudo junto. Tem também <b>↺ 90°</b>, <b>↻ 90°</b> e <b>⬇ Pôr no centro do chão</b>.</li>
<li><b>Modelo inteiro ➖ / ➕</b> diminui ou aumenta todas as peças de uma vez.</li>
<li><b>Várias peças juntas:</b> <kbd>Shift</kbd> + clique (ou o botão <b>☑ Várias</b> no celular) junta peças num conjunto. O conjunto mexe, gira, estica, pinta, duplica e apaga junto.</li>
<li><b>🪞 Espelhar</b> (tecla <kbd>M</kbd>): numa peça ou num conjunto, cria o outro lado (faça um braço inteiro e espelhe!). Com o <b>modelo inteiro</b> escolhido, ele vira o modelo do avesso.</li>
<li><b>⧉ Copiar este modelo</b> cria um modelo novo igualzinho, com outro nome (bom pra fazer variações).</li>
<li><b>👀 olhos</b>: escolha a cabeça e clique, aparecem 2 olhos prontos. <b>🪞 Espelhar</b> copia a peça pro outro lado.</li>
<li><b>🎮 Usar como jogador</b> troca o jogador pelo seu modelo.</li>
<li>A setinha verde no chão mostra a <b>frente</b> do modelo.</li>
</ul>` },
{ id: 'primordial', titulo: '13. Plataforma primordial 🐸 (Ribbat: Origem)', html: `
<p>Coisas feitas pro jogo de plataforma do Kroad. Funcionam melhor no <code>jogo: 2D de lado</code>.</p>
<h4>Pulo gostoso (automático no 2D)</h4>
<ul><li><b>Segure</b> o pulo pra pular mais alto, solte cedo pra pular baixinho.</li>
<li>Dá pra pular um tiquinho depois de sair da beirada, e o pulo apertado um pouco antes de cair também vale.</li>
<li>No 2D o jogador <b>acelera e derrapa</b>; correndo (Shift ou joystick todo pro lado) pula mais longe.</li></ul>
<h4>Habilidades</h4>
<pre>habilidades: linguada, investida</pre>
<ul><li><b>👅 Linguada</b> (tecla <kbd>J</kbd>): mira sozinha no inimigo ou coisa de pegar mais perto à frente. Derrota inimigo e puxa mosca de longe.</li>
<li><b>🌿 Cipó</b>: perto de um <code>galho</code> (em cima de você), <b>segure J</b> pra grudar e balançar. Solte (ou pule) pra sair voando com o embalo.</li>
<li><b>💨 Investida</b> (tecla <kbd>K</kbd>): dispara pra frente, quebra <code>rocha</code>, derruba inimigo e não toma dano. No ar, só uma vez.</li>
<li>No celular aparecem os botões 👅 e 💨.</li></ul>
<h4>Coisas do mundo primordial</h4>
<pre>criar mosca em 5 1.5
criar cristal em 10 3
criar galho em 20 5.5
criar rocha em 25 0
criar vitória-régia em 32 0.3
criar vagem em 38 0
criar totem em 42 0
criar buraco de 14 até 22
criar fenda em 60 0</pre>
<ul><li><code>mosca</code>: +1 ponto e +1 em <b>moscas</b>. <code>cristal</code>: +1 em <b>cristais</b> (<code>mostrar: moscas, cristais</code>).</li>
<li><code>galho</code>: fica no ar, é onde a língua gruda.</li>
<li><code>rocha</code>: rachada, só quebra com a investida.</li>
<li><code>vitória-régia</code>: afunda se você ficar parado em cima, e volta depois.</li>
<li><code>vagem</code>: pule em cima e ela te arremessa (mude a força: <code>criar vagem em 38 0 com altura 8</code>).</li>
<li><code>totem</code>: checkpoint. Encostou, ele acende e vira o lugar onde você volta.</li>
<li><code>buraco de A até B</code>: corta o chão. Cair lá tira 1 vida e volta pro último totem.</li>
<li><code>fenda</code>: fenda do portal dos gigantes. Encostou, ela fecha. Sem objetivos, fechar a fenda vence a fase; com objetivo: <code>objetivo1: fechar a fenda</code>.</li></ul>` },
{ id: 'fases', titulo: '14. Fases, menu e save 🗺', html: `
<p>Um jogo de verdade tem várias fases. O que fica <b>fora</b> das fases vale pro jogo todo; o que fica <b>dentro</b> (2 espaços pra direita) é só daquela fase.</p>
<pre>jogo: 2D de lado
título: Kroad e as Fendas
jogador: sapo
habilidades: linguada, investida

fase Bosque do Brejo:
  céu: tarde
  chão: grama 80
  jogador em: -35 0
  criar 4 moscas espalhadas
  criar fenda em 30 0

fase Caverna Antiga:
  céu: noite
  chão: pedra 60
  criar fenda em 20 0</pre>
<ul>
<li>Com fases, o jogo ganha sozinho: <b>tela de título</b>, <b>menu de fases</b> (cada fase só libera quando você zera a anterior), <b>pausa</b> (<kbd>Esc</kbd> ou o botão ⏸), <b>fase completa</b> com moscas/cristais/pontos/tempo, <b>game over</b> e <b>save</b> (fases zeradas e recordes ficam guardados).</li>
<li>A fase acaba quando você <b>ganha</b>: fechando a <code>fenda</code>, completando os objetivos ou com <code>ganhar</code>.</li>
<li><code>título: ...</code> é o nome do jogo (aparece na tela de título e no Publicar).</li>
<li>Pra testar, no editor todas as fases ficam liberadas.</li>
<li>Na <b>🎬 Cena</b> aparece um seletor 🗺 pra escolher qual fase montar. O que você adiciona entra dentro daquela fase.</li>
</ul>
<h4>Trocar de fase pelo código</h4>
<ul><li><code>próxima fase</code>: conta a fase como zerada e vai pra seguinte.</li>
<li><code>ir para fase 2</code> ou <code>ir para fase Caverna Antiga</code>.</li>
<li><code>voltar ao menu</code>.</li></ul>
<p><code>jogo:</code>, <code>título:</code>, <code>modelo</code> e <code>ensinar</code> ficam fora das fases.</p>` },
];

// sugestões que aparecem enquanto digita
const SUGESTOES = [
  'jogo: 3D', 'jogo: 2D de lado', 'jogo: 2D de cima', 'céu: dia', 'céu: noite', 'céu: tarde', 'chão: grama 40 por 40', 'chão: areia 40 por 40', 'chão: neve 40 por 40', 'luz: noite', 'gravidade: 20',
  'jogador: sapo', 'jogador: robô', 'jogador: pinguim', 'jogador: "🦊"', 'jogador em: 0 0', 'velocidade do jogador: 5', 'pulo do jogador: 1.5 metros', 'vidas: 3',
  'câmera em: atrás do jogador 5 metros', 'câmera em: cima do jogador 12 metros', 'câmera em: lado do jogador 8 metros', 'câmera em: primeira pessoa', 'câmera fixa em: 0 10 20',
  'criar 10 moedas espalhadas', 'criar 10 árvores espalhadas', 'criar 5 pedras espalhadas', 'criar 3 inimigos espalhados', 'criar bandeira em 0 15', 'criar portal em 0 15', 'criar caixa em 3 3', 'criar casa em 8 8',
  'criar plataforma em 4 2 6', 'criar parede de 0 0 até 10 0', 'criar 3 corações espalhados', 'criar 5 estrelas espalhadas', 'criar espinho em 5 0', 'criar 5 "🍎" espalhados',
  'inimigos: seguem o jogador', 'inimigos: andam sozinhos', 'inimigos: ficam parados', 'velocidade dos inimigos: 2.5',
  'objetivo1: ir atrás das 10 moedas', 'objetivo1: chegar na bandeira', 'objetivo1: derrotar todos os inimigos', 'objetivo1: sobreviver 60 segundos', 'objetivo1: fazer 50 pontos',
  'mostrar: pontos, vidas', 'mostrar: pontos, vidas, tempo',
  'quando pegar moeda:', 'quando tocar inimigo:', 'quando derrotar inimigo:', 'quando apertar espaço:', 'quando apertar E:', 'quando completar objetivo1:', 'quando pontos chegar a 10:', 'quando vidas acabarem:', 'quando o jogo começar:',
  'a cada 2 segundos:', 'sempre:', 'se pontos maior que 10:', 'senão:', 'repetir 5 vezes:',
  'mensagem "Oi!"', 'som moeda', 'som explosão', 'som poder', 'esperar 1 segundo', 'remover isso', 'remover todos os inimigos', 'levar jogador para 0 0', 'voltar ao início',
  'criar inimigo chamado zé em 5 5 com vida 3', 'criar bola chamada bala na frente do jogador com velocidade 20', 'criar cubo chamado torre em 0 5 tamanho 2 6 2 sólido',
  'mover zé para frente 2', 'andar isso para frente', 'andar isso até jogador', 'andar isso para longe do jogador', 'pular zé', 'girar zé 90', 'virar zé para jogador', 'levar zé até jogador', 'derrotar aquilo',
  'para cada inimigo:', 'quando bala tocar inimigo:', 'ensinar atirar:', 'modelo boneco:', 'se existe zé:', 'se distância até jogador menor que 8:', 'zé.vida - 1', 'zé.cor = vermelho', 'aquilo.vida - 1',
  'habilidades: linguada, investida', 'criar mosca em 5 1.5', 'criar cristal em 10 3', 'criar galho em 20 5.5', 'criar rocha em 25 0', 'criar vitória-régia em 32 0.3', 'criar vagem em 38 0', 'criar totem em 42 0', 'criar buraco de 14 até 22', 'criar fenda em 60 0', 'objetivo1: fechar a fenda',
  'título: Meu Jogo', 'fase Bosque:', 'próxima fase', 'ir para fase 2', 'voltar ao menu',
  'tremer tela', 'completar objetivo', 'ganhar "Você venceu!"', 'perder "Fim de jogo!"', 'recomeçar', 'pontos + 1', 'vidas - 1',
];

G.FROG_MANUAL = { MANUAL, EXEMPLOS, SUGESTOES };
})(typeof window !== 'undefined' ? window : globalThis);
