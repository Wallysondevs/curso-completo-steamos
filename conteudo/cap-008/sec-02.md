O SteamOS não atualiza "quando quiser". Ele oferece três canais com ritmos de publicação diferentes: um é a versão testada que veio de fábrica, outro é a versão que entusiastas testam antes de todo mundo, e um terceiro fica no meio do caminho. Escolher o canal certo faz diferença entre nunca ter um problema e ser o primeiro a descobrir um bug.

:::objetivos
- Entender a diferença de maturidade entre os canais Stable, Beta e Preview
- Saber trocar de canal via interface gráfica e via linha de comando
- Compreender o ciclo de vida de uma atualização: do Preview ao Stable
- Identificar em qual canal a máquina está operando no momento
:::

## Três canais, três ritmos

A Valve mantém três canais de atualização para o SteamOS, e a metáfora é simples: quanto mais "à frente" o canal, mais cedo você recebe novidades — e maior a chance de encontrar algo quebrado.

**Stable** é o canal padrão de fábrica. Toda unidade do Steam Deck sai com ele. As atualizações que chegam aqui já passaram por semanas ou meses de testes nos canais mais avançados e foram consideradas estáveis para o grande público. É o canal recomendado para quem quer jogar, não depurar.

**Beta** é o canal intermediário. Aqui chegam as correções e funcionalidades que estão prestes a ir para o Stable, mas ainda aguardam uma última rodada de validação em campo. A Valve libera no Beta o que já está maduro, mas quer confirmar com um público maior antes de empurrar para todo mundo. Problemas são raros, mas possíveis — especialmente com periféricos específicos ou jogos recém-lançados.

**Preview** é o canal mais à frente. É aqui que as novidades aparecem primeiro. Drivers de GPU novos, mudanças no kernel, suporte a hardware novo — tudo chega no Preview antes. Também é onde os bugs aparecem primeiro. A Valve espera que quem usa Preview reporte problemas, e não é incomum que uma versão de Preview quebre Wi-Fi, suspensão ou desempenho em algum jogo específico.

O ciclo padrão de uma atualização:

```
Preview → Beta → Stable
```

Uma mesma versão pode passar duas semanas no Preview, uma semana no Beta e então ser promovida a Stable. Mas não é garantido: se o Preview revelar um bug sério, a versão pode ser descartada (nunca chega ao Beta), e um novo ciclo começa com um build corrigido.

## Trocando de canal pela interface

No modo Gaming (o modo normal do Steam Deck), o caminho é:

1. Abra **Configurações** (ícone da engrenagem).
2. Vá em **Sistema**.
3. Role até **Canal de Atualização do Sistema**.
4. Escolha entre Stable, Beta ou Preview.

O Steam Deck aplica a troca e pede para reiniciar. No primeiro boot após a troca, ele baixa a imagem do canal selecionado e a aplica — ou seja, mudar de canal é uma atualização completa de sistema, não uma troca de configuração leve.

:::atencao
Trocar do Stable para o Preview pode puxar uma imagem **mais antiga** que a sua, se o Preview estiver atrás do Stable em número de build. Isso acontece quando a Valve congela um canal para testes e o outro avança. Sempre confira o `BUILD_ID` após a troca para saber onde você caiu.
:::

## Trocando de canal pela linha de comando

No modo Desktop, a troca pode ser feita diretamente com `steamos-update`:

```terminal
$ steamos-update check
Checking for available updates...
Current branch: stable
The system is up to date.
$ steamos-update set-branch beta
Switching to branch beta...
An update is available: 3.6.22 (build_id 20241118.101)
```

O subcomando `set-branch` aceita os valores `stable`, `beta` e `preview`. A saída confirma a troca e, se o novo canal tiver uma imagem diferente, avisa que há atualização disponível. Para efetivar, é preciso aplicar a atualização (o que será coberto nas próximas seções) e reiniciar.

Para saber em qual canal você está sem trocar nada, a própria saída de `steamos-update check` inclui a linha `Current branch`. Alternativamente, a configuração do canal fica armazenada num arquivo de estado que o próprio `steamos-update` gerencia.

```terminal
$ steamos-update check
Checking for available updates...
Current branch: preview
An update is available: 3.6.23-rc1 (build_id 20241125.90)
```

Note o sufixo `-rc1` na versão do canal Preview: significa *release candidate 1*, indicando que é uma versão candidata que ainda não foi promovida a Beta. É comum ver sufixos como `-rc1`, `-beta1` ou `-preview2` nos canais mais avançados.

Se você mudar de ideia e quiser voltar ao canal Stable, o mesmo subcomando resolve — e a versão oferecida volta a ser a estável mais recente:

```terminal
$ steamos-update set-branch stable
Switching to branch stable...
An update is available: 3.6.21 (build_id 20241105.100)
```

Repare que o `build_id` oferecido pelo Stable (`20241105.100`) é mais antigo que o do Preview (`20241125.90`). Trocar de um canal avançado para um mais conservador quase sempre significa "descer" de versão, porque o Stable só publica builds já validados — e isso é normal, não uma regressão por erro.

## Quem deve usar cada canal

A recomendação da Valve é clara e está documentada:

- **Stable**: todos os usuários, exceto quem tem motivo para usar outro.
- **Beta**: quem quer ajudar a testar correções antes de irem para todos, mas não quer lidar com quebras frequentes.
- **Preview**: desenvolvedores, entusiastas e quem está disposto a reportar bugs e eventualmente restaurar o sistema.

Na prática, há um quarto perfil importante: quem está enfrentando um bug específico no Stable e quer verificar se o Beta ou Preview já contém a correção. Nesse caso, trocar de canal por alguns dias, testar, e voltar ao Stable é uma estratégia válida. A troca de canal é segura porque a partição antiga fica intacta — se o novo canal não resolver ou piorar a situação, o rollback traz o Stable de volta.

## Resumo

- SteamOS mantém três canais de atualização: Stable (padrão, testado), Beta (validação final) e Preview (novidades, mais arriscado).
- O ciclo de uma versão é Preview → Beta → Stable, com duração variável conforme a qualidade.
- A troca é feita via interface gráfica (Configurações → Sistema → Canal de Atualização) ou com `steamos-update set-branch`.
- `steamos-update check` mostra o canal atual com a linha `Current branch`.
- Quem enfrenta um bug no Stable pode testar Beta ou Preview e depois voltar ao canal original com segurança.

## Exercícios

1. Rode `steamos-update check` e anote o canal atual (`Current branch`). Você está no Stable, Beta ou Preview?
2. Simule a mudança para o canal Beta com `steamos-update set-branch beta`, mas **não** aplique a atualização. Depois, volte ao canal original com `set-branch` correspondente.
3. Compare a saída de `steamos-update check` no Stable e no Preview (se houver diferença de versão disponível). O número de build do Preview é maior, menor ou igual ao do Stable?
4. Pesquise no fórum da comunidade Steam Deck um bug relatado no canal Preview que nunca chegou ao Stable. Escreva em poucas frases o que aconteceu.
5. **Desafio.** Suponha que você está no Stable 3.6.21 e troca para o Preview, que está no 3.6.23-rc1. Depois de uma semana, você decide voltar ao Stable. Qual build você terá ao voltar? O 3.6.21 original ou o Stable mais recente daquele momento? Explique por que a troca de canal reverte (ou não) para a versão anterior.