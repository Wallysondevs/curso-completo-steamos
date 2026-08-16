Há uma pergunta que paira sobre tudo o que você leu até aqui: se o Proton-GE é "só" o Proton com codecs a mais, por que a Valve simplesmente não inclui esses codecs no Proton oficial? A resposta está numa fronteira que separa engenharia de direito, e entendê-la muda como você enxerga o ecossistema inteiro de compatibilidade no Linux. Esta seção abre essa caixa-preta.

Não é exagero dizer que metade do valor do Proton-GE está numa sigla: **WMF**, Windows Media Foundation. Os codecs que ela representa são o motivo mais comum pelo qual um jogo funciona no Windows e falha no Proton oficial. Vamos ver o que são, por que são protegidos e como o GE contorna isso.

:::objetivos
- Entender o que são codecs de mídia e por que alguns são patenteados
- Reconhecer o papel do Windows Media Foundation (WMF) nos jogos
- Explicar por que a Valve não pode distribuir esses codecs
- Conectar essa limitação ao surgimento do Proton-GE
:::

## O que um codec faz

Quando um jogo exibe uma cutscene, ele não guarda "imagens + som" prontos. Ele guarda **números comprimidos** — um fluxo de dados que precisa ser desembrulhado de volta em pixels e amostras de áudio. O programa que realiza esse desembrulho (e o embrulho, na gravação) é o **codec**, do inglês *coder-decoder*.

Jogos dependem de codecs de vídeo e áudio em dois lugares: nas cenas pré-renderizadas (intros, cutscenes, vídeos de fundo dos menus) e nas vozes e músicas comprimidas. Sem o codec certo, o jogo até pode rodar — mas a tela fica preta na hora do vídeo, ou o áudio desaparece.

Vários desses codecs são **padrões abertos**, como o VP9 e o Opus, e funcionam em qualquer sistema. Outros, porém, são tecnologias patenteadas por empresas (Microsoft, principalmente), e é aí que tudo complica.

## A patente e o problema de redistribuição

Uma patente de software impede que você **distribua** uma implementação daquela tecnologia sem pagar royalties ao dono — mesmo num sistema livre. Isso não tem nada a ver com o código ser aberto ou fechado: é sobre o direito de enviar o software embutido para os usuários.

A Valve, como empresa que distribui o Proton para milhões de pessoas em dezenas de países, tem que respeitar esse arcabouço. Incluir o decodificador WMF no Proton oficial significaria negociar licenças com cada detentor de patente, para cada território, sob termos que nem sempre são viáveis. A decisão pragmática foi **não incluir** e deixar a lacuna.

:::nota
O mesmo raciocínio explica por que distribuições Linux populares mantêm repositórios separados (`non-free`, `restricted`, `multiverse`) para coisas como drivers e codecs patenteados. A separação não é por esnobismo ideológico — é para blindar o projeto principal de risco jurídico.
:::

## O que o WMF faz (e o que quebra sem ele)

O **Windows Media Foundation** é a estrutura que o Windows usa para reproduzir e transformar mídia. Muitos jogos — sobretudo os de estúdio japonês e os ports que usam codecs como WMV, WMA e MPEG — chamam o WMF diretamente para suas cutscenes. No Windows, o WMF já está lá. No Linux, o Proton precisa fornecer um substituto.

O Proton oficial oferece uma implementação parcial e sem os codecs patenteados. O resultado é o sintoma clássico: o jogo abre, o menu funciona, mas as cenas de vídeo aparecem **pretas ou com fade instantâneo**, e às vezes o jogo chega a travar ao tentar reproduzir o vídeo do logo do estúdio.

O Proton-GE resolve isso compilando o Proton **com** os codecs WMF full incluídos, além de outros ajustes de mídia. Daí a percepção, correta, de que "o GE destrava os vídeos". É uma diferença pequena na quantidade de código, mas enorme no efeito prático.

## Um teste rápido do sintoma

Quando um jogo chega a travar ou a pular vídeos, o log do Proton registra a falha no codec. O Proton escreve um arquivo de log no diretório do usuário, e dar uma olhada nele confirma se o problema é realmente de mídia:

```terminal
$ find ~/.local/share/Steam -maxdepth 2 -name 'steam-*.log' | head -5
/home/deck/.local/share/Steam/steam-1234567.log
```

Dentro do log, mensagens mencionando `winegstreamer`, `mfplat` ou `Media Foundation` apontam exatamente para essa lacuna de codec. Não é preciso virar especialista: a presença desses termos, junto do sintoma de vídeo preto, é o gatilho para testar o Proton-GE.

```terminal
$ grep -i -E 'mfplat|media foundation|winegstreamer' ~/.local/share/Steam/steam-*.log | head -10
fixme:mfplat:mf_startup ...
warn:gstreamer: ...
```

Ver essas linhas é a confirmação de que o jogo está tentando usar mídia que o Proton oficial não entrega por completo. Trocar para GE e reabrir o jogo costuma silenciar exatamente esses avisos.

:::atencao
Vídeo preto **nem sempre** é codec. Pode ser também driver gráfico, falta de Vulkan ou configuração de GPU. O log com `mfplat`/`winegstreamer` é o que diferencia um caso do outro — não troque para GE às cegas antes de olhar o log.
:::

## O que isso significa para você

A lição prática é direta: o Proton-GE não é "o Proton melhorado em tudo". Ele é o Proton com uma diferença específica e de alto impacto — os codecs patenteados — além de patches mais recentes. Isso explica por que muita gente nunca precisa dele (se seus jogos não usam WMF, o oficial resolve) e por que outros o consideram indispensável.

Entender o *porquê* também te protege de um erro comum: esperar que o GE corrija performance ruim, bug de driver ou incompatibilidade de anticheat. Ele não foi feito para isso. Nas próximas seções, você vai aplicar o GE nos lugares onde ele de fato importa: como padrão global e por jogo.

## Resumo

- Codec é o programa que comprime e descomprime mídia; jogos usam codecs em cutscenes e áudio.
- Vários codecs são patenteados, e a patente restringe a **redistribuição**, não só o uso.
- O WMF (Windows Media Foundation) é a estrutura de mídia do Windows que muitos jogos chamam diretamente.
- A Valve não inclui os codecs WMF no Proton oficial por risco jurídico de royalties e territórios.
- O Proton-GE recompila o Proton com esses codecs, destravando vídeos que ficavam pretos.
- Logs com `mfplat`/`winegstreamer` indicam o problema de codec; outros sintomas podem ter outras causas.

## Exercícios

1. Escreva, com suas palavras, a diferença entre "um codec ser de código aberto" e "um codec poder ser redistribuído livremente". São a mesma coisa?
2. Liste dois lugares onde um jogo depende de codecs de mídia (dica: pense em momentos fora da jogabilidade principal).
3. Num jogo seu que apresente vídeo preto, gere um log do Proton e busque por `mfplat` e `winegstreamer` com `grep`. O sintoma é mesmo de codec?
4. Pesquise por que o Opus e o VP9 são "seguros" do ponto de vista de patente, enquanto WMV e WMA não são.
5. **Desafio.** Explique por que a distinção entre "usar" e "redistribuir" um codec é a chave para o Proton-GE ser viável: por que o fato de a Valve ser uma empresa grande muda o cálculo que um mantenedor individual não enfrenta do mesmo jeito?
