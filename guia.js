// Guia do FrogCode pra colar numa IA (Claude, etc.). O botão "🤖 Copiar guia pra IA" usa este texto.
(function (G) {
G.FROG_GUIA = `# GUIA DO FROGCODE (pra IA)

Você vai ajudar alguém que está APRENDENDO a programar no FrogCode, uma linguagem de jogos em português da Frogbit Studio (site: https://ielgomesjf-web.github.io/FrogCode/).
O FrogCode foi inventado agora: você NÃO conhece ele de antes. Use SÓ os comandos deste guia. Não invente comando, não use JavaScript/Python/Lua. Se algo não existir aqui, diga que não existe e sugira o jeito mais parecido que existe.
Explique simples, como pra quem está começando, e mostre o código pronto pra colar.

## Regras de escrita
- Cada linha é uma coisa. Jeito básico: \`coisa: valor\`
- Acento e maiúscula tanto faz (câmera = camera). Metros: "3 metros", "3metros", "3m" ou "3".
- Texto entre aspas: "Olá!". Comentário: tudo depois de #.
- Blocos (quando, a cada, se, senão, sempre, repetir, para cada, ensinar, modelo) terminam com dois-pontos, e as linhas de dentro ficam 2 espaços mais pra direita. NÃO existe "fim".
- Bloco de uma ação só pode ir na mesma linha: \`quando pegar estrela: mensagem "Brilhou!"\`
- Posição: no 3D, "em X Z" (X = lado, Z = frente/trás; a altura é automática) ou "em X Y Z" (Y = altura). No 2D de lado: "em X Y".

## Exemplo completo
\`\`\`
jogo: 3D
céu: dia
chão: grama 40 por 40
jogador: sapo
câmera em: atrás do jogador 6 metros
criar 10 moedas espalhadas
criar 3 inimigos espalhados
inimigos: seguem o jogador
objetivo1: ir atrás das 10 moedas
objetivo2: chegar na bandeira
mostrar: pontos, vidas

quando completar objetivo1:
  criar bandeira em 0 -15
  mensagem "A bandeira apareceu!"
\`\`\`

## Mundo
- \`jogo: 3D\` | \`jogo: 2D de lado\` (plataforma) | \`jogo: 2D de cima\`
- \`céu: dia\` (dia, tarde, por do sol, noite, nublado ou uma cor)
- \`chão: grama 40 por 40\` (grama, areia, neve, pedra, terra, madeira, gelo ou uma cor; \`chão: nenhum\`)
- \`luz: noite\` (dia, tarde, noite, forte, fraca)
- \`gravidade: 20\`

## Jogador
- \`jogador: sapo\` (sapo, robô, pinguim, cubo, bola, um emoji entre aspas como "🦊", ou um modelo feito com "modelo")
- \`jogador: sapo cor azul tamanho 2\`
- \`jogador em: 0 0\` (onde começa)
- \`velocidade do jogador: 5\` · \`pulo do jogador: 1.5 metros\` (0 = não pula) · \`vidas: 3\`
- Controles: WASD/setas andam, Espaço pula, Shift corre; no celular, joystick. Pular em cima de inimigo derrota ele.

## Câmera
- \`câmera em: atrás do jogador 5 metros\` · \`câmera em: cima do jogador 12 metros\` · \`câmera em: lado do jogador 8 metros\` · \`câmera em: primeira pessoa\` · \`câmera fixa em: 0 10 20\`

## Criar coisas
- \`criar 10 moedas espalhadas\` · \`criar árvore em 5 3\` · \`criar caixa em 2 0 tamanho 2 cor vermelho\` · \`criar 3 inimigos perto do jogador\`
- Pegáveis: moeda (+1 ponto sozinha), estrela (+5), gema (+3), coração (+1 vida), chave, ou emoji: \`criar 5 "🍎" espalhados\`
- Sólidas: árvore, pinheiro, pedra, caixa, bloco, parede, casa, plataforma
- Perigos: inimigo (anda e machuca), espinho
- Marcos: bandeira, portal. Enfeite: flor
- Peças soltas: cubo, bola, cone, cilindro, pirâmide (\`criar cubo chamado torre em 0 5 tamanho 2 6 2 cor roxo sólido\`)
- Plataforma no 3D: \`criar plataforma em 4 2 6\` (lado, altura, frente). No 2D: \`criar plataforma em 6 2\`.
- Fileira: \`criar parede de 0 0 até 10 0\`
- Opções do criar: \`chamado zé\` (dá nome), \`com vida 3 e velocidade 2\` (propriedades inventadas), \`na frente do jogador\`, \`em cima de zé\`, \`tamanho 2\` (ou 3 números), \`cor verde\`, \`giro 90\`, \`sólido\`, \`perigoso\`, \`pegável\`, \`fantasma\`, \`que seguem o jogador\`, \`parados\`
- Inimigos: \`inimigos: seguem o jogador\` | \`inimigos: andam sozinhos\` | \`inimigos: ficam parados\` · \`velocidade dos inimigos: 2.5\`

## Objetivos (missões, um de cada vez; quando acaba o último, vence)
- \`objetivo1: ir atrás das 10 moedas\` · \`objetivo1: pegar todas as estrelas\` · \`objetivo1: chegar na bandeira\` · \`objetivo1: derrotar todos os inimigos\` · \`objetivo1: sobreviver 60 segundos\` · \`objetivo1: fazer 50 pontos\`
- Qualquer outro texto vira objetivo livre, que termina com \`completar objetivo\`.

## Quando... (eventos) — ficam no começo da linha, nunca dentro de outro bloco
- \`quando pegar moeda:\` · \`quando tocar inimigo:\` · \`quando derrotar inimigo:\` · \`quando apertar E:\` (espaço, enter, letras, números)
- \`quando completar objetivo1:\` · \`quando pontos chegar a 10:\` (qualquer conta) · \`quando vidas acabarem:\` · \`quando o jogo começar:\`
- \`quando bala tocar inimigo:\` (uma coisa tocando outra: dentro, "isso" = a primeira, "aquilo" = a segunda)
- \`a cada 2 segundos:\` · \`sempre:\` (60 vezes por segundo)
- Dentro de "quando pegar/tocar/derrotar", a coisa se chama \`isso\`.

## Ações
- \`mensagem "Oi!"\` · \`som moeda\` (moeda, pulo, tiro, explosão, dano, poder, objetivo, ganhou, perdeu)
- \`remover isso\` · \`remover todos os inimigos\` · \`derrotar aquilo\` (conta como derrotado)
- \`esperar 2 segundos\` · \`tremer tela\` · \`completar objetivo\` · \`ganhar "Venceu!"\` · \`perder "Ops!"\` · \`recomeçar\`
- \`levar jogador para 0 0\` · \`levar zé até jogador\` · \`voltar ao início\`
- No meio do jogo dá pra mudar: \`velocidade do jogador: 10\`, \`jogador: robô\`, \`céu: noite\`

## Controle total (mandar em cada objeto)
- Propriedades com ponto: \`zé.x = 10\`, \`zé.vida - 1\`, \`zé.cor = vermelho\`, \`zé.tamanho = 2\`, \`zé.giro = 90\`, \`zé.visível = falso\`
- Toda coisa tem x, y (altura), z, giro, tamanho, cor, visível, velocidade, pulo + as inventadas com "com". O jogador também: \`jogador.velocidade = 10\`. Nome de tipo mexe em todos: \`inimigos.cor = azul\`.
- \`mover zé para frente 2\` (pula na hora: frente, trás, esquerda, direita, cima, baixo) · \`mover zé 3 0\`
- \`andar zé para frente\` · \`andar isso até jogador\` · \`andar isso para longe do jogador\` (andar usa a velocidade dele; use dentro de \`sempre:\`)
- \`pular zé\` · \`girar zé 90\` · \`virar zé para jogador\`
- \`para cada inimigo:\` (dentro, o da vez é \`isso\`)
- Perguntas: \`distância até jogador\` (de "isso") · \`distância de zé até jogador\` · \`existe zé\` · \`zé está tocando jogador\` · \`quantos inimigos\` · \`moedas pegas\` · \`inimigos derrotados\` · \`tecla E\` · \`aleatório 1 10\`

## Variáveis e contas
- pontos, vidas e tempo já existem. Criar outra no começo: \`chaves: 0\`
- \`pontos + 10\` · \`vidas - 1\` · \`chaves = 3\` · \`mostrar: pontos, vidas, chaves\`
- \`se pontos maior que 10:\` / \`senão se ...:\` / \`senão:\` · \`repetir 5 vezes:\`
- Comparar: = != > < >= <=, ou "maior que", "menor que", "igual a", "chegar a". Juntar: e, ou, não.
- Texto + número: \`mensagem "Você tem " + pontos + " pontos"\`

## Inventar comandos
\`\`\`
ensinar atirar:
  criar bola chamada bala na frente do jogador tamanho 0.3 cor laranja com velocidade 20
  som tiro

quando apertar E: atirar

sempre:
  para cada bala:
    andar isso para frente
    se distância até jogador > 30:
      remover isso
\`\`\`
Com valores: \`ensinar curar quanto:\` e depois \`curar 2\` (dentro, "quanto" vale 2).

## Modelos (personagens feitos de peças)
\`\`\`
modelo boneco:
  cilindro em 0 0 0 tamanho 0.5 1 0.5 cor azul
  bola em 0 1.3 0 tamanho 0.6 cor bege
  cone em 0 1.75 0 tamanho 0.5 0.4 0.5 cor vermelho
  tipo: inimigo

criar boneco chamado guarda em 4 4
\`\`\`
- Peças: cubo, bola, cone, cilindro, pirâmide. Cada uma: \`em\` (lado altura frente, sempre 3 números), \`tamanho\` (1 número ou 3: largura altura fundura), \`cor\`, \`giro\` (1 número ou 3).
- \`tipo:\` sólido (padrão), inimigo, pegável, perigoso ou enfeite. A frente do modelo é o lado +Z.
- Pra ser o jogador: \`jogador: boneco\` (ou \`jogador: boneco tamanho 3\`).

## Cores
preto, branco, vermelho, verde, azul, amarelo, laranja, roxo, rosa, cinza, marrom, ciano, dourado, prata, bege, verdeclaro, verdeescuro, azulclaro, azulescuro, ou código entre aspas: "#ff8800"

## O editor (pra explicar pra pessoa)
- Em cima tem 📝 Código, 🎬 Cena (arrasta as coisas no mapa, tipo Unity) e 🧱 Modelos (monta modelos com peças, tipo Blender). O que se faz na Cena e nos Modelos vira código sozinho.
- No celular: barra embaixo com Código, Cena, Modelos, Jogo e Manual.
- Erros aparecem sublinhados de vermelho, com a explicação em PROBLEMAS.
`;
if (typeof module !== 'undefined' && module.exports) module.exports = G.FROG_GUIA;
})(typeof window !== 'undefined' ? window : globalThis);
