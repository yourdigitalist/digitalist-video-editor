import type { MotionItem } from "@/lib/types";

export const MOTION_CATEGORIES = [
  "Tipografia cinética",
  "Formas e ícones",
  "Dados e infográficos",
  "Interface e produto",
  "Marca e estrutura",
  "Estética e acabamento",
] as const;

export const MOTION_GALLERY: MotionItem[] = [
  {
    id: "orbit-loop",
    title: "Órbita em loop",
    category: "Formas e ícones",
    description: "Ícones e logos giram em órbitas elípticas ao redor do centro.",
    promptBlock:
      "Órbita em loop: elementos (ícones, logos de parceiros, pontos) giram em órbitas elípticas concêntricas ao redor do elemento central, com velocidades diferentes por órbita e profundidade simulada (escala e opacidade menores na parte de trás). Período total múltiplo da duração para fechar o loop.",
  },
  {
    id: "icons-pop",
    title: "Ícones com pop",
    category: "Formas e ícones",
    description: "Grade de ícones entra com escala elástica em stagger diagonal.",
    promptBlock:
      "Ícones com pop: uma grade de ícones entra item a item com escala 0 → 115% → 100% (easeOutBack, 400 ms), stagger de 70 ms em ordem diagonal. Cada ícone tem um fundo arredondado na cor de destaque a 15% e o ícone em traço por cima.",
  },
  {
    id: "drawn-stroke",
    title: "Traço desenhado",
    category: "Formas e ícones",
    description: "Linhas se desenham com stroke-dashoffset; preenchimento entra depois.",
    promptBlock:
      "Traço desenhado: ícones e ilustrações em linha se desenham progressivamente (stroke-dashoffset do comprimento total até 0) em 900 ms, easeInOutCubic; o preenchimento entra com fade de 200 ms depois do traço completo. Espessura de traço constante e cantos arredondados.",
  },
  {
    id: "shape-morph",
    title: "Morph de formas",
    category: "Formas e ícones",
    description: "Círculo → quadrado → ícone final interpolando vértices.",
    promptBlock:
      "Morph de formas: uma forma se transforma em outra (círculo → quadrado arredondado → ícone final) interpolando pontos de caminho com o mesmo número de vértices. Cada morph dura 600 ms com easeInOutCubic, com 300 ms de pausa entre eles e leve rotação de 90° durante a transição.",
  },
  {
    id: "cursor-clicks",
    title: "Cursor e cliques",
    category: "Interface e produto",
    description: "Cursor vetorial se move em Bézier e clica com ripple.",
    promptBlock:
      "Cursor e cliques: um cursor desenhado em vetor se move entre alvos da interface por curvas de Bézier (não em linha reta), 500 a 700 ms por trajeto com easeInOutCubic. No clique: cursor encolhe para 85%, onda circular de 300 ms no ponto e o botão muda de estado (hover → pressionado → sucesso).",
  },
  {
    id: "notif-stack",
    title: "Pilha de notificações",
    category: "Interface e produto",
    description: "Notificações empilham do topo com profundidade.",
    promptBlock:
      "Pilha de notificações: notificações entram do topo a cada 450 ms com easeOutBack; as anteriores descem e diminuem (escala 95%, 90%) e escurecem, criando profundidade. No máximo 4 visíveis. Texto curto, ícone circular e horário.",
  },
  {
    id: "sliding-cards",
    title: "Cartões deslizando",
    category: "Interface e produto",
    description: "Pilha de cartões; o topo desliza e o próximo sobe.",
    promptBlock:
      "Cartões deslizando: pilha de 3 a 5 cartões levemente rotacionados; a cada 800 ms o cartão do topo sai deslizando para o lado com rotação (easeInBack) e o próximo sobe e endireita (easeOutBack). Cada cartão traz um item da lista.",
  },
  {
    id: "browser-scroll",
    title: "Navegador com rolagem",
    category: "Interface e produto",
    description: "Janela genérica com rolagem suave e destaque de seção.",
    promptBlock:
      "Navegador com rolagem: janela de navegador genérica desenhada em código (barra com 3 pontos e campo de endereço, sem marcas), página rolando em etapas suaves de 600 ms e destaque de borda na seção citada. Leve inclinação 3D opcional.",
  },
  {
    id: "logo-reveal",
    title: "Revelação de logo",
    category: "Marca e estrutura",
    description: "Formas convergem, colapsam e o logo surge com brilho.",
    promptBlock:
      "Revelação de logo: elementos geométricos simples (círculos e barras na paleta) convergem para o centro em 700 ms, colapsam em um ponto e o logo surge com escala 70% → 100% (easeOutExpo) e um brilho sutil passando da esquerda para a direita; o nome da marca entra 200 ms depois com revelação por máscara. Use o arquivo de logo fornecido; não redesenhe o logo.",
  },
  {
    id: "stickers",
    title: "Selos e stickers",
    category: "Marca e estrutura",
    description: "Etiquetas com borda grossa entram com escala elástica.",
    promptBlock:
      "Selos e stickers: etiquetas e selos (formas com borda branca grossa, sombra dura deslocada e leve rotação) entram com escala elástica e ficam oscilando ±3°. Use para destacar ofertas, novidades e números.",
  },
  {
    id: "lower-third",
    title: "Lower third",
    category: "Marca e estrutura",
    description: "Faixa inferior com nome/CTA e revelação por máscara.",
    promptBlock:
      "Lower third: barra inferior entra da esquerda com máscara, tipografia de apoio e marca à direita; sai invertendo após a leitura.",
  },
  {
    id: "end-cta",
    title: "Tela final com CTA",
    category: "Marca e estrutura",
    description: "Fechamento com logo, frase e botão de ação.",
    promptBlock:
      "Tela final com CTA: fundo sólido da paleta, logo central, frase curta e botão com hover/press animado; hold final de 1,2 s.",
  },
  {
    id: "kinetic-type",
    title: "Crie mais rápido",
    category: "Tipografia cinética",
    description: "Texto principal palavra a palavra com entradas variadas.",
    promptBlock:
      "Kinetic typography: o texto principal entra palavra por palavra, cada uma com uma entrada diferente (escala 0 → 110% → 100%, rotação de −8° → 0°, deslize vertical de 40 px). Cada palavra dura 6 a 10 quadros de entrada, easing easeOutBack. A palavra mais importante fica 1,5× maior e na cor de destaque. Composição centralizada, ocupando 70% da largura.",
  },
  {
    id: "mask-reveal",
    title: "Revelação por máscara",
    category: "Tipografia cinética",
    description: "Linhas sobem de dentro de máscaras com stagger.",
    promptBlock:
      "Revelação por máscara: cada linha de texto sobe 100% da própria altura de dentro de uma máscara retangular (overflow hidden), com stagger de 80 ms entre linhas e easing easeOutExpo, 600 ms por linha. A saída é o inverso, para cima.",
  },
  {
    id: "typewriter",
    title: "Máquina de escrever",
    category: "Tipografia cinética",
    description: "Caractere a caractere com cursor piscando.",
    promptBlock:
      "Máquina de escrever: o texto aparece caractere a caractere a 18 a 24 caracteres por segundo, com cursor em bloco piscando a cada 500 ms. Fonte monoespaçada. Pausas de 300 ms nas vírgulas. Ao terminar, o cursor pisca 2 vezes e some.",
  },
  {
    id: "cascade-letters",
    title: "Letras em cascata",
    category: "Tipografia cinética",
    description: "Cada letra entra com deslize, rotação e fade.",
    promptBlock:
      "Letras em cascata: divida o título em letras; cada letra entra com deslize de −60 px no eixo Y, rotação de 20° → 0° e opacidade 0 → 1, stagger de 30 ms por letra, easing easeOutBack, 500 ms cada. Mantenha o kerning da palavra completa.",
  },
  {
    id: "highlighter",
    title: "Marca-texto",
    category: "Tipografia cinética",
    description: "Retângulo de destaque desenha atrás da palavra-chave.",
    promptBlock:
      "Marca-texto: depois que a frase aparece, um retângulo na cor de destaque se desenha da esquerda para a direita por trás da palavra-chave (escala X de 0 → 1, origem à esquerda, 400 ms, easeInOutQuart), com leve inclinação de −2°. A palavra muda para cor escura quando coberta.",
  },
  {
    id: "counter",
    title: "Contador",
    category: "Dados e infográficos",
    description: "Número sobe com easing e unidade de apoio.",
    promptBlock:
      "Contador: número anima de 0 ao valor alvo em 1,2 s com easeOutExpo; unidade e label entram 200 ms depois com fade.",
  },
  {
    id: "bar-chart",
    title: "Gráfico de barras",
    category: "Dados e infográficos",
    description: "Barras crescem em stagger com labels.",
    promptBlock:
      "Gráfico de barras: barras crescem da base com stagger de 80 ms, easeOutExpo; labels e valores entram ao atingir 80% da altura.",
  },
  {
    id: "timeline",
    title: "Linha de tempo",
    category: "Dados e infográficos",
    description: "Eixo horizontal com marcos que popam em sequência.",
    promptBlock:
      "Linha de tempo: linha desenha da esquerda para a direita; marcos entram com pop e texto curto; foco um a um.",
  },
  {
    id: "ranking",
    title: "Ranking",
    category: "Dados e infográficos",
    description: "Lista ordenada com barras e posições.",
    promptBlock:
      "Ranking: itens entram de baixo com stagger; posição em destaque; barras de proporção preenchem à direita.",
  },
  {
    id: "liquid-blob",
    title: "Blob líquido",
    category: "Estética e acabamento",
    description: "Forma orgânica com ruído em loop de 4 s.",
    promptBlock:
      "Blob líquido: forma orgânica gerada por ruído (raio base + ruído de Perlin/Simplex com semente fixa em 6 a 8 harmônicos), deformando continuamente em ciclo de 4 s e voltando à forma inicial para fazer loop. Preenchimento em gradiente das cores da paleta.",
  },
  {
    id: "particle-burst",
    title: "Explosão de partículas",
    category: "Estética e acabamento",
    description: "Partículas saem do centro na revelação.",
    promptBlock:
      "Explosão de partículas: 60 a 120 partículas saem do centro do elemento em direções aleatórias (gerador com semente fixa), velocidade inicial alta com atrito exponencial, gravidade leve, escala e opacidade caindo até 0 em 900 ms. Cores da paleta. Disparar no momento de revelação.",
  },
  {
    id: "living-gradient",
    title: "Fundo em gradiente vivo",
    category: "Estética e acabamento",
    description: "Gradiente da paleta se desloca lentamente.",
    promptBlock:
      "Fundo em gradiente vivo: gradiente das cores da paleta se desloca e gira lentamente (ciclo ≥ duração) sem competir com o foco.",
  },
  {
    id: "living-camera",
    title: "Câmera viva",
    category: "Estética e acabamento",
    description: "Push-in lento e deriva lateral por cena.",
    promptBlock:
      "Câmera viva: aplique a cada cena um push-in lento e contínuo (escala 100% → 106% ao longo da cena) com leve deriva lateral, para nada ficar totalmente parado. Movimento linear ou easeInOutSine, nunca perceptível como efeito.",
  },
  {
    id: "motion-blur",
    title: "Motion blur real",
    category: "Estética e acabamento",
    description: "Média de 8 subquadros (obturador 180°) em elementos rápidos.",
    promptBlock:
      "Motion blur: para cada quadro final, renderize 8 subquadros distribuídos em 50% do intervalo do quadro (obturador de 180°) e faça a média deles. Aplique somente em elementos rápidos se o custo de render for alto.",
  },
];

export function getMotionById(id: string) {
  return MOTION_GALLERY.find((m) => m.id === id);
}
