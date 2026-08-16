Antes de conectar o Deck, o trabalho começa no PC hospedeiro. Uma sessão de Remote Play ruim quase sempre nasce de um hospedeiro mal configurado: codificação via software (CPU) em vez de hardware (GPU), limite de taxa de quadros errado ou drivers sem suporte a captura de frame. Esta seção cuida de deixar o PC pronto para transmitir com latência mínima e sem surpresas.

:::objetivos
- Verificar se o Steam detecta e usa o codificador de hardware correto
- Habilitar o Remote Play no PC e entender as permissões de família
- Escolher entre NVENC, AMF e Quick Sync conforme a GPU
- Ajustar resolução, taxa de quadros e limite dinâmico de bitrate
- Preparar o PC para continuar transmitindo mesmo quando travado ou em segundo plano
:::

## Ativando o Remote Play no hospedeiro

O Remote Play no PC é habilitado por padrão, mas vale confirmar e revisar as opções. No cliente Steam desktop (interface padrão ou Big Picture), acesse **Configurações → Remote Play** (ou *Steam → Settings → Remote Play*). A chave-mestra é **Capturar a tela automaticamente / Enable Remote Play**.

```terminal
$ steam -console
Steam console client (build 1726600000)
Steam>
```

Na interface gráfica, os itens relevantes são:

- **Enable Remote Play** — liga o streaming. Sem isso, o Deck não encontra o PC na lista.
- **Enabled hardware encoding** — forçar código de vídeo por hardware. Deve estar ativo; desative apenas para diagnóstico.
- **Dynamic bitrate** — deixa o Steam ajustar o bitrate conforme a qualidade da rede. Sempre recomendado para Wi-Fi.
- **Limit bandwidth to** — teto manual em Mbit/s. Útil se o roteador é velho ou a rede é compartilhada.

:::atencao
O botão **Enable hardware encoding** é confuso por histórico: em versões antigas do Steam ele vinha desligado e causava uso brutal de CPU. Hoje o padrão é ligado. Confirme visualmente que ele está ativo — se estiver desligado, o Steam cai para codificação por software em x264 e seu PC esquenta à toa.
:::

## O codificador certo para cada GPU

A codificação por hardware é o coração do Remote Play. Cada fabricante expõe sua implementação através de uma API própria, e o Steam a seleciona automaticamente:

| GPU | Codificador | API | Notas |
|---|---|---|---|
| NVIDIA GTX 900+ / RTX | NVENC | NVFBC/NVENC | Melhor suporte histórico, latência baixíssima |
| AMD RX 400+ / iGPU | VCE/AMF | AMF Encoder | Bom, mas carecia de melhorias em drivers antigos |
| Intel integrada | Quick Sync | D3D/Quick Sync | Excelente para jogos leves |

No Windows, verificar o codificador ativo durante uma sessão é trivial pelo Gerenciador de Tarefas: a aba **Desempenho → GPU** mostra um gráfico separado para **Video Encode** (alem do 3D e Copy). Se o gráfico de Video Encode sobe durante o streaming, a codificação por hardware está funcionando. No Linux, o `radeontop` ou `intel_gpu_top` cumprem papel parecido.

```terminal
$ radeontop
                radeontop v1.4, running on VCE, 15 samples/sec
        Graphics pipe   12.34%
        Event engine     0.00%
        Vertex Grouper   0.00%
        Texture Address  0.00%
        Shader Export    0.00%
        Sequencer        0.00%
        Shader Interpolator 0.00%
        Scan Converter   0.00%
        Video Decode     0.00%
        Video Encode    87.21%
```

A coluna **Video Encode** em ~87% com o resto ocioso é o retrato clássico de uma sessão de Remote Play saudável: a GPU está codificando frames em alta qualidade sem que o jogo em si consuma pipeline gráfico.

:::perigo
Se você roda o PC hospedeiro no Linux com drivers AMD, certifique-se de que o pacote `mesa-va-drivers` está instalado. Sem ele, o Steam não encontra o codificador VA-API e cai para software sem avisar. Em distribuições imutáveis como o próprio SteamOS, o pacote já vem no sistema, mas em Arch/Debian comuns é um erro de setup frequente.
:::

## Taxa de quadros e a "capa" de captura

O Remote Play transmite na taxa de quadros que o jogo realmente consegue alcançar, até o limite configurado. Se o jogo no PC oscila entre 50 e 90 fps, o stream acompanha essa variação, e o Deck recebe um vídeo inconsistente — o que é pior do que um 60 fps estável, porque a latência de exibição varia a cada frame.

A boa prática é **travar o jogo no hospedeiro** a uma taxa que ele sustente com folga, tipicamente 60 fps. Isso estabiliza o pipeline de codificação e entrega um stream com cadência regular:

```terminal
$ mangohud --output-file /tmp/fps.log %command%
$ cat /tmp/fps.log | tail -3
16:32:01  fps: 60.1  frametime: 16.6ms  gpu: 62%  cpu: 34%
16:32:02  fps: 59.9  frametime: 16.7ms  gpu: 61%  cpu: 33%
16:32:03  fps: 60.0  frametime: 16.7ms  gpu: 62%  cpu: 34%
```

Um frametime plano de 16,6 ms (1/60 s) indica que o jogo entrega frames em cadência regular, ideal para encodificar. Se o frametime oscila (16,6 → 22 → 14), vale travar para 30 fps ou reduzir qualidade até estabilizar. Um stream de 30 fps estável é sempre melhor que um de 60 fps aos trancos.

## Mantendo o stream vivo em segundo plano

Por padrão, o Steam não baixa a prioridade do jogo quando uma sessão de Remote Play está ativa, mas há dois ajustes que evitam travamentos:

**Desativar a "pausa" do jogo em segundo plano.** Alguns jogos pausam ao perder o foco de janela. Quando você transmite para o Deck, o jogo no PC tecnicamente roda "em segundo plano" (nenhuma janela ativa local), e títulos com *background pause* congelam. Desative essa opção no jogo sempre que possível.

**Deixar o PC ocioso, não em sleep.** Se o PC entrar em suspensão, o stream morre. Configure o Windows para dormir apenas após um período longo, ou use o modo "sempre ligado" enquanto transmite:

```terminal
$ powercfg /change standby-timeout-ac 0
```

O comando acima desativa o tempo de suspensão quando o PC está na tomada (AC), permitindo sessões longas sem que o sistema hiberne no meio do jogo. Para reverter, repita com um valor em minutos (ex.: `powercfg /change standby-timeout-ac 15`).

:::dica
Se você usa o PC hospedeiro também para trabalhar, crie um segundo usuário do Windows dedicado a jogos com login automático. Assim o Remote Play encontra o PC sempre ligado e logado, sem expor sua área de trabalho pessoal a quem estiver jogando no Deck.
:::

## Resumo

- O Remote Play deve estar habilitado em **Configurações → Remote Play** no PC hospedeiro, com *hardware encoding* e *dynamic bitrate* ativos.
- NVENC (NVIDIA), AMF/VCE (AMD) e Quick Sync (Intel) são os codificadores de hardware; confirme o uso deles durante o streaming.
- Travar o jogo no hospedeiro a 60 fps estáveis entrega um stream com cadência regular e latência previsível.
- Um stream de 30 fps consistente supera um de 60 fps instável; estabilidade vence a taxa nominal.
- Desative suspensão/sleep do PC e o *background pause* dos jogos para evitar streams que morrem no meio.

## Exercícios

1. Abra **Configurações → Remote Play** no seu PC e confirme que *Enable Remote Play* e *hardware encoding* estão ligados.
2. Identifique seu codificador: durante um streaming, abra o Gerenciador de Tarefas e observe a aba GPU → Video Encode. O gráfico sobe? De quanto?
3. Instale o MangoHud (Linux) ou ative o contador de fps do jogo (Windows) e verifique se o frametime fica plano em 16,6 ms durante o jogo.
4. Teste desativar e reativar o *dynamic bitrate* e note a diferença de estabilidade num mesmo jogo, especialmente com outros dispositivos na rede.
5. **Desafio.** Configure um atalho do tipo "sempre ligado": com `powercfg`, deixe o PC sem suspensão por 2 horas e confirme, monitorando com `powercfg /requests`, que nenhum processo bloqueia o sono indevido.