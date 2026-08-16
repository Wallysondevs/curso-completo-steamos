FSR (FidelityFX Super Resolution) e filtros de escala são as ferramentas que o Steam Deck usa para compensar a resolução nativa de 800p quando um jogo não consegue manter o FPS desejado. Em vez de baixar a resolução do painel inteiro, você renderiza internamente numa resolução menor e deixa a GPU aplicar um upscaling — ganhando desempenho com perda visual controlada. Esta seção mostra como o FSR se integra aos perfis por jogo, como verificar se está ativo e quando usá-lo.

:::objetivos
- Entender a diferença entre FSR, upscaling linear e FSR 2.0+
- Ativar o FSR via perfil individual e verificar no terminal
- Distinguir FSR do sistema vs FSR embutido no jogo
- Configurar o filtro de nitidez (sharpening) no perfil
- Evitar os casos em que o FSR piora em vez de ajudar
:::

## O que o FSR faz (e o que não faz)

FSR é uma técnica espacial de upscaling: o jogo renderiza cada frame numa resolução mais baixa (ex.: 960 × 600 em vez de 1280 × 800) e o FSR reconstrói a imagem final no tamanho do painel, aplicando um filtro de nitidez para disfarçar a perda de detalhe. Não é mágica — um jogo que já roda a 800p nativo em 50 FPS pode ganhar 10 a 15 quadros, mas texto miúdo (HUD, legendas) às vezes fica borrado.

A versão disponível no Modo Jogo do Deck é o **FSR 1.0 via driver**, que opera no último estágio do pipeline (na saída, não no motor do jogo). Já o **FSR 2.x** e superiores são integrados pelo desenvolvedor e dependem de dados de movimento (temporal upscaling), produzindo resultado melhor. O perfil por jogo controla o FSR do sistema; o FSR embutido é ativado dentro do menu do próprio jogo.

:::nota
O SteamOS também suporta **NIS** (NVIDIA Image Scaling) e outros filtros de escala via Gamescope, o compositor de tela cheia do Deck. A troca entre eles é transparente no painel de desempenho, mas no VDF o campo se chama `scalingFilter`.
:::

## Ativando o FSR num perfil individual

No painel de desempenho, o slider de FSR e o filtro de nitidez são os dois controles visíveis. O que acontece no VDF é a inclusão de duas chaves no bloco do jogo:

```text
"PerformanceProfile"
{
    "fpsLimit"          "60"
    "tdpLimit"          "10"
    "fsrEnabled"        "1"
    "scalingFilter"     "0"
    "sharpness"         "5"
}
```

`fsrEnabled` com `"1"` liga o upscaling espacial. `scalingFilter` escolhe o algoritmo (`0` = linear, `1` = FSR, `2` = NIS, dependendo da versão). `sharpness` controla o nível de nitidez (0 a 5, sendo 5 o mais agressivo). Nesse exemplo, o jogo está com FPS destravado (`60`), TDP moderado (`10`) e FSR ativo com nitidez máxima — uma configuração típica para jogos AAA em que você prefere fluidez a fidelidade.

## Verificando se o FSR está ativo

O SteamOS expõe o estado do Gamescope (o compositor) através de comandos específicos. Você pode verificar se o upscaling está em uso observando as opções com que o Gamescope foi iniciado:

```terminal
$ ps aux | grep gamescope | tr ' ' '\n' | grep -E 'upscale|fsr|scale' | head -5
```

O `ps aux` lista todos os processos, o filtro `grep gamescope` pega a linha do compositor, `tr ' ' '\n'` quebra os argumentos um por linha, e `grep -E` filtra os que mencionam upscaling. Se houver saída, o Gamescope está rodando com um filtro ativo. O comando não mostra diretamente "FSR ligado para o jogo X" — mas a presença de flags de upscaling no compositor indica que o sistema está preparado para aplicá-lo.

```terminal
$ gamescope --help 2>/dev/null | grep -A2 -i upscale
  -U, --upscale           Use integer upscaling
  -F, --fsr               Enable AMD FidelityFX Super Resolution
```

Chamar `gamescope --help` (quando disponível) mostra as flags documentadas. `-F` ativa o FSR e é exatamente o que o Steam passa ao Gamescope quando você liga o FSR no perfil.

## FSR do sistema × FSR do jogo: não duplique

Um erro comum é ligar o FSR do Deck e também ativar o FSR 2.0 dentro do menu do jogo. O resultado é uma dupla passada de upscaling que amassa a imagem e pode introduzir artefatos. A regra: se o jogo tem FSR 2.x nativo, **use o do jogo** e deixe o FSR do sistema desligado; se o jogo não tem upscaling, aí o FSR do Deck é bem-vindo.

:::atencao
Ligar o FSR do sistema sobre um jogo que já roda em resolução nativa de 800p com FSR 2.0 embutido não traz ganho de desempenho — a GPU já está renderizando em resolução reduzida internamente. O FSR do sistema tentaria fazer upscaling de uma imagem que já foi upscalada, resultando em borrão duplo e latência extra.
:::

## Escolhendo o filtro de nitidez

O `sharpness` do perfil controla a agressividade do filtro pós-upscaling. O valor 0 desliga a nitidez artificial (imagem mais suave, pode parecer "mole"); o valor 5 aplica nitidez máxima (bordas mais definidas, mas pode introduzir halos em alto contraste). Para jogos com muito texto (RPGs, estratégia), um `sharpness` 3 ou 4 ajuda a manter as legendas legíveis. Para jogos de ação com paisagens, valores mais baixos evitam artefatos visuais.

```terminal
$ grep "sharpness" ~/.local/share/Steam/userdata/182745653/config/localconfig.vdf | sort | uniq -c | sort -rn
      7 			"sharpness"		"3"
      3 			"sharpness"		"5"
      1 			"sharpness"		"0"
```

Esse pipeline (`grep` → `sort` → `uniq -c` → `sort -rn`) conta quantas vezes cada valor de sharpness aparece no `localconfig.vdf`. Num exemplo com 11 perfis, `3` é o valor mais frequente (7 ocorrências), seguido de `5` (3) e `0` (1). É um retrato dos seus hábitos — nitidez moderada como padrão, agressiva em exceções.

## Resumo

- FSR 1.0 (sistema) faz upscaling espacial de última etapa; FSR 2.x (jogo) é temporal e integrado ao motor.
- No perfil, `fsrEnabled "1"`, `scalingFilter` e `sharpness` controlam o upscaling do Deck.
- `ps aux | grep gamescope` mostra se o compositor foi iniciado com flags de upscaling.
- Nunca ligue o FSR do Deck e o FSR do jogo ao mesmo tempo: o resultado é duplo upscaling com artefatos.
- O sharpness `3` é um bom ponto de partida para manter texto legível em RPGs e estratégia.

## Exercícios

1. Identifique, na sua biblioteca, três jogos que têm FSR 2.x nativo (consulte o menu de gráficos de cada um) e três que não têm upscaling algum.
2. Crie um perfil com FSR ativo e `sharpness 5` para um jogo sem upscaling. Jogue 5 minutos e depois reduza para `sharpness 1`. Anote a diferença visual percebida.
3. Use `ps aux | grep gamescope` enquanto um jogo com FSR de perfil está aberto e identifique as flags ativas.
4. Explique com suas palavras por que ativar FSR do sistema e FSR 2.0 do jogo simultaneamente piora a imagem.
5. **Desafio.** Escolha um jogo pesado, meça o FPS médio sem FSR e com FSR (use o contador do Deck ou `mangohud`). Depois, verifique no `localconfig.vdf` os valores exatos de `fsrEnabled` e `sharpness` e escreva um mini relatório: "Com FSR ganhei X FPS, perdi Y de nitidez" — integrando sensores da [seção 4](#/cap-013/sec-04) e leitura de VDF da [seção 1](#/cap-013/sec-01).