import { getMotionById } from "@/data/motion-gallery";
import type { Brand, VideoConfig } from "@/lib/types";

const EASING_COPY: Record<VideoConfig["easing"], string> = {
  mechanical:
    "mecânico, easeOutQuad nas entradas e easeInQuad nas saídas; movimentos precisos e curtos",
  expressive:
    "expressivo, easeOutExpo nas entradas e easeInExpo nas saídas; movimentos rápidos que assentam com suavidade",
  elastic:
    "elástico, easeOutBack nas entradas e easeInBack nas saídas; overshoot controlado",
};

const INTENSITY_COPY: Record<VideoConfig["intensity"], string> = {
  subtle: "sutil, deslocamentos de 16 a 32 px, escalas de 92% a 104%, entradas de 200 a 400 ms",
  moderate:
    "moderada, deslocamentos de 40 a 80 px, escalas de 80% a 110%, entradas de 300 a 600 ms",
  intense:
    "intensa, deslocamentos de 80 a 140 px, escalas de 70% a 120%, entradas de 450 a 800 ms",
};

const STYLE_COPY: Record<VideoConfig["visualStyle"], string> = {
  "flat-minimal": "flat minimalista",
  geometric: "geométrico",
  editorial: "editorial",
  "tech-ui": "tech / UI",
  organic: "orgânico",
};

const ASPECT_SIZE: Record<VideoConfig["aspectRatio"], string> = {
  "9:16": "1080×1920 (9:16)",
  "4:5": "1080×1350 (4:5)",
  "1:1": "1080×1080 (1:1)",
  "16:9": "1920×1080 (16:9)",
  "21:9": "2560×1080 (21:9)",
};

const BASE_COPY: Record<VideoConfig["base"], string> = {
  script: "roteiro anexado. Ele define o que aparece, em que ordem e com que ênfase.",
  audio: "áudio anexado. Use o ritmo e a fala para timing e ênfase.",
  video: "vídeo anexado. Use como referência de tempo e/ou camada de fundo conforme o uso indicado.",
  briefing: "apenas o briefing. Extraia cenas do objetivo e dos textos obrigatórios.",
};

export function buildMotionPrompt(opts: {
  brand: Brand;
  config: VideoConfig;
  motionIds: string[];
  deliverablesExtra?: string[];
}): string {
  const { brand, config, motionIds } = opts;
  const frames = Math.round(config.durationSec * config.fps);
  const motions = motionIds
    .map((id) => getMotionById(id))
    .filter(Boolean)
    .map((m) => `- ${m!.promptBlock}`)
    .join("\n");

  const extras: string[] = [];
  if (config.deliverables.contactSheet) extras.push("Contact sheet");
  if (config.deliverables.previewGif) extras.push("GIF de prévia");
  if (config.deliverables.commentedSource) extras.push("Código-fonte comentado");
  if (config.deliverables.version169) extras.push("Versão 16:9");
  if (config.deliverables.version11) extras.push("Versão 1:1");

  const driveLine = config.driveAssetsUrl.trim()
    ? `\n- Assets (Google Drive): ${config.driveAssetsUrl.trim()}`
    : brand.driveUrl
      ? `\n- Assets (Google Drive da marca): ${brand.driveUrl}`
      : "";

  const scriptBlock = config.scriptText.trim()
    ? `\n\n<roteiro>\n${config.scriptText.trim()}\n</roteiro>`
    : "";

  return `# Prompt de motion graphics programático

<papel>
Você é um motion designer que trabalha com código. Crie um motion graphic de forma programática usando HTML/SVG/CSS com uma timeline GSAP pausada, guiado pelo material base. Renderize cada quadro de forma determinística, capture os quadros e monte um MP4. Trabalhe em etapas e verifique o resultado olhando os quadros.
</papel>

<material_base>
- Base: ${BASE_COPY[config.base]}
- Marca: ${brand.name}
- Tipografia da marca: ${config.typography || brand.typography}${driveLine}
</material_base>

<briefing>
Objetivo: ${config.goal.trim() || "[o que a peça precisa comunicar]"}
Textos obrigatórios: ${config.mandatoryTexts.trim() || "(nenhum além do material base)"}
Os demais textos em tela saem do material base, resumidos para leitura rápida e com acentuação correta.
${config.extraNotes.trim() ? `Observações extras: ${config.extraNotes.trim()}` : ""}
</briefing>
${scriptBlock}

<especificacoes>
- Resolução: ${ASPECT_SIZE[config.aspectRatio]}.
- ${config.fps} fps, duração aproximada de ${config.durationSec} s (cerca de ${frames} quadros). Ajuste ao que o material precisa para ser lido com calma, avisando se ficar mais de 20% diferente.
- Fundo: ${config.background === "solid" ? "cor sólida de fundo da paleta" : config.background === "gradient" ? "gradiente das cores da paleta" : "transparente (ProRes/WebM se necessário)"}.
- Qualidade de encode: ${config.quality}.
- Saída: motion.mp4 em H.264, yuv420p, CRF ${config.quality === "high" ? 15 : config.quality === "standard" ? 18 : 23}, preset slow, +faststart.
- Margem de segurança: nenhum texto a menos de 6% das bordas; em 9:16, deixe também ~20% livres na base para a interface das redes.
</especificacoes>

<direcao_visual>
- Paleta (hex): fundo ${config.palette.background}, texto ${config.palette.text}, destaque ${config.palette.accent}, apoio ${config.palette.support}. Use só essas cores; o destaque aparece em um foco por vez.
- Tipografia: ${config.typography || brand.typography}. Carregue as fontes localmente antes do primeiro quadro.
- Estilo: ${STYLE_COPY[config.visualStyle]}.
- Easing padrão: ${EASING_COPY[config.easing]}. Animações do repertório que especificam easing próprio têm prioridade.
- Intensidade: ${INTENSITY_COPY[config.intensity]}. Momentos de ênfase do conteúdo podem subir um nível; trechos explicativos, descer.
- Stagger padrão entre elementos de um grupo: ${config.staggerMs} ms.
- Hierarquia: um foco por vez. Elementos que saem de cena saem antes de o próximo foco entrar.
</direcao_visual>

<repertorio_de_animacao>
Animações selecionadas nesta peça. O material base decide onde, em que ordem e quantas vezes cada uma aparece; a mesma pode se repetir se o conteúdo pedir:
${motions || "- (nenhuma selecionada — escolha do repertório completo o que melhor servir a cada bloco)"}
</repertorio_de_animacao>

<como_aplicar>
1. Leia o material inteiro e divida-o em blocos de ideia (uma ideia por cena).
2. Estime a duração de cada bloco pelo tempo de leitura (cerca de 2,5 palavras por segundo, mais 0,5 s de respiro), somando a duração total.
3. Para cada bloco, escolha do repertório a animação que melhor traduz aquele conteúdo. Varie entre blocos seguidos.
4. Monte o storyboard em storyboard.md: bloco, tempo de início e fim (em segundos e quadros), texto em tela, animação escolhida e o motivo. Mostre o storyboard antes de animar.
5. Só então implemente. Se uma animação escolhida não servir na prática, troque por outra do repertório e registre a troca.
</como_aplicar>

<pipeline_de_render>
1. Crie index.html com o palco em exatamente a resolução pedida e toda a animação em uma única gsap.timeline({ paused: true }), com os tempos vindos do storyboard. Nada pode animar fora dessa timeline.
2. Exponha no window: ready (Promise que resolve depois de document.fonts.ready e do carregamento das imagens) e seek(t), que chama tl.seek(t, false).
3. Crie render.mjs com Playwright (Chromium headless): viewport na resolução, deviceScaleFactor 1; aguarde ready; para cada quadro i de 0 até N − 1, chame seek(i / fps) e salve frames/%05d.png com page.screenshot().
4. Monte o vídeo: ffmpeg -y -framerate ${config.fps} -i frames/%05d.png -c:v libx264 -pix_fmt yuv420p -crf ${config.quality === "high" ? 15 : config.quality === "standard" ? 18 : 23} -preset slow -movflags +faststart motion.mp4
</pipeline_de_render>

<regras_de_determinismo>
- O quadro é função pura do tempo: render(i) gera sempre a mesma imagem. Proibido usar requestAnimationFrame, setTimeout, Date.now() ou mídia tocando em tempo real durante a captura.
- Aleatoriedade só com gerador com semente fixa (ex.: mulberry32(42)), avançado pelo número do quadro.
- Assets locais e carregados antes do quadro 0. Dados de áudio (tempos, batidas, volume) pré-calculados em JSON antes da captura.
- Não pule nem duplique quadros: confira a contagem de PNGs antes de codificar.
</regras_de_determinismo>

<verificacao>
1. Antes do render completo, gere quadros em 0%, 20%, 40%, 60%, 80% e 100% da duração e uma contact sheet. Confira texto cortado, sobreposição, contraste, margens e acentuação, e me mostre antes de seguir.
2. Depois de montar o vídeo, rode ffprobe e confirme resolução, fps e a duração esperada.
3. Se algo falhar, corrija o código e renderize de novo. Não entregue com problemas conhecidos sem avisar.
</verificacao>

<entrega>
- motion.mp4
- storyboard.md com as decisões de cada bloco.
- Código-fonte e um README curto com o comando para renderizar de novo.
${extras.length ? `- Também: ${extras.join(", ")}.` : ""}
- Apague a pasta frames/ depois de validar o vídeo, a menos que eu peça para manter.
</entrega>
`;
}
