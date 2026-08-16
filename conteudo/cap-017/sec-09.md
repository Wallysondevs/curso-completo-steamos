O S3 é o padrão do Deck e a fundação do suspend/resume que define a experiência portátil — mas não é a única carta do baralho. O kernel Linux suporta hibernação (S4), suspend-to-idle (S0ix) e combinações híbridas. Entender essas alternativas serve a dois propósitos: estender o repertório para situações em que o S3 não é suficiente e preparar o terreno para o que pode vir nas próximas revisões do hardware.

:::objetivos
- Entender o funcionamento e o trade-off da hibernação (S4)
- Inspecionar se o Deck suporta hibernação e por que não é o default
- Conhecer o suspend híbrido e seu uso em desktops
- Avaliar o papel do s2idle (S0ix) em hardware moderno
:::

## Hibernação: gravar a RAM no disco

Hibernar (`disk`) é como salvar o estado do sistema num arquivo e desligar. O kernel escreve o conteúdo da RAM — comprimido — numa partição de swap designada, e na próxima ligada o bootloader detecta a imagem de hibernação e a restaura para a memória. O resultado é uma retomada que passa pelo firmware e pelo kernel, mas não pelos serviços — eles são restaurados tal qual estavam.

```terminal
$ cat /sys/power/state
freeze mem disk
$ cat /sys/power/disk
[platform] shutdown reboot suspend test_resume
```

A presença de `disk` em `/sys/power/state` é o primeiro sinal de que o kernel foi compilado com suporte a hibernação. Mas isso não basta: o sistema precisa de uma **partição ou arquivo de swap** grande o suficiente para conter a imagem comprimida da RAM em uso.

```terminal
$ swapon --show
NAME      TYPE SIZE USED PRIO
/dev/nvme0n1p2 partition 8G 1.2G   -2
$ free -h | grep Mem
Mem:            15Gi       4.5Gi       7.2Gi       1.1Gi       3.7Gi        9.4Gi
```

O Deck tem 8 GiB de swap. Com a RAM usando 4,5 GiB e compressão típica de 40-50%, a imagem de hibernação caberia em cerca de 2-3 GiB — perfeitamente dentro dos 8 GiB de swap. O que falta então?

:::info
O SteamOS 3.6 não ativa a hibernação por padrão. A Valve decidiu apostar tudo no S3, que é mais rápido e mais simples. A hibernação exige integração com o bootloader (para detectar a imagem `resume=`), com o initramfs (para carregá-la na RAM antes da montagem do root), e com o instalador (para dimensionar a swap). Como o benefício marginal para um console portátil é pequeno — a diferença entre 0,5 W e 0 W —, a complexidade não compensou.
:::

## Ativando a hibernação (experimental)

Se você quer testar, o caminho passa por três passos. Primeiro, garantir que a swap tem tamanho suficiente e está em um dispositivo persistente (não zram, que é volátil). Segundo, adicionar o parâmetro `resume=UUID=da-swap` à linha de comando do kernel. Terceiro, testar:

```terminal
$ sudo su -
# echo disk > /sys/power/state
```

O sistema deve gravar a imagem, desligar. Ao ligar, o bootloader carrega `resume=` e o initramfs restaura a RAM. Se falhar, o boot prossegue como se fosse um boot limpo — a imagem é ignorada. Para ver se a hibernação foi bem-sucedida:

```terminal
$ journalctl -b -0 | grep -i "resume\|hibernat"
ago 13 08:02:15 steamdeck kernel: PM: hibernation: resume from hibernation
ago 13 08:02:15 steamdeck kernel: PM: hibernation: Reading hibernation image (3084288 KiB)...
ago 13 08:02:18 steamdeck kernel: PM: hibernation: Image successfully loaded
```

A linha `resume from hibernation` indica que o kernel detectou a imagem; o `Image successfully loaded` confirma a restauração completa.

:::perigo
Hibernação é destrutiva no sentido de que **qualquer alteração no filesystem entre hibernar e restaurar pode corromper dados**. Se você hiberna e depois boota outro sistema operacional (dual boot) que monta as mesmas partições, a imagem de hibernação e o disco entram em conflito. Num Deck puro, isso não acontece, mas é o tipo de "pegadinha" que afeta quem instala dual boot com Windows ou outro Linux.
:::

## Suspend híbrido: o melhor (e o pior) dos dois mundos

Existe um modo chamado `hybrid-sleep`: o sistema suspende para RAM (S3) **e** grava a imagem de hibernação no disco. Se a bateria não acabar, a retomada é instantânea via S3. Se a bateria acabar, a RAM se perde, mas a imagem no disco sobrevive e o sistema retoma como se tivesse hibernado.

```terminal
$ systemctl hybrid-sleep
```

No papel, é ideal para um portátil. Na prática, o custo é alto: o tempo de entrada é maior (porque grava a imagem antes de suspender), e no SteamOS 3.6 o `hybrid-sleep` não vem habilitado. É um recurso mais comum em notebooks corporativos, onde perder o estado da sessão pode custar horas de trabalho.

## s2idle e o futuro S0ix

O modo `s2idle` (suspend-to-idle), que aparece em `mem_sleep`, é uma ponte para o que a Intel chama de **S0ix** (ou *Modern Standby*). Em vez de desligar a CPU, o kernel a coloca nos estados C mais profundos (C8, C9, C10), mantendo a capacidade de acordar rapidamente e, em certas implementações, até responder a pacotes de rede sem sair do estado de baixo consumo.

No Deck atual (APU AMD customizada), `s2idle` funciona, mas consome mais energia que `deep`. Em gerações futuras de hardware — talvez o Steam Deck 2 ou equivalentes — o S0ix pode se tornar o padrão. Ele já é o modo de suspensão usado pelo Steam Deck OLED em certas circunstâncias? A documentação indica que a Valve mantém `deep` como default, mas o suporte a `s2idle` existe no kernel e pode ser trocado.

```terminal
$ cat /sys/power/mem_sleep
[s2idle] deep
$ echo s2idle | sudo tee /sys/power/mem_sleep
```

O trade-off permanece: `s2idle` retoma em milissegundos, mas o consumo em repouso sobe. Num Deck que passa 23 horas por dia em suspensão e 1 hora em uso, a decisão da Valve por `deep` é economicamente óbvia.

:::dica
Se você está no modo desktop com o Deck conectado à tomada (dock), `s2idle` pode ser preferível: a retomada é quase instantânea e o consumo extra é irrelevante na tomada. Para uso portátil, volte para `deep`.
:::

## Por que tantos modos

A sopa de letrinhas — S3, S4, s2idle, deep, freeze, disk — existe porque cada hardware responde aos estados de energia de forma diferente. O kernel expõe todos e deixa a política para o espaço de usuário (systemd, SteamOS). A Valve escolheu `deep` (S3) para o Deck porque ele equilibra melhor os três fatores que importam num portátil: tempo de retomada, consumo em suspensão e compatibilidade com o hardware AMD customizado.

Entender as alternativas não significa precisar trocar de modo — significa saber que elas existem e, quando o cenário mudar, tomar a decisão informada.

## Resumo

- Hibernação (`disk`) grava a RAM comprimida na swap e desliga; retoma mais devagar, mas consome zero.
- O Deck não ativa hibernação por padrão; o S3 é o foco da Valve para o console.
- `hybrid-sleep` combina S3 com imagem de hibernação; útil em notebooks, não habilitado no SteamOS 3.6.
- `s2idle` mantém a CPU em estados C profundos com retomada mais rápida e consumo maior que `deep`.
- A Valve escolheu `deep` (S3) como o modo padrão do Deck por equilibrar retomada rápida, baixo consumo e compatibilidade.

## Exercícios

1. Verifique se seu Deck tem `disk` em `/sys/power/state` e se `swapon --show` mostra swap suficiente para hibernação.
2. Leia o conteúdo de `/sys/power/disk` e explique o significado de ao menos dois dos modos listados (`platform`, `shutdown`, `reboot`).
3. Teste `systemctl hybrid-sleep` (se disponível) e compare o tempo de entrada com `systemctl suspend`.
4. Troque temporariamente o modo de suspensão para `s2idle` e execute `systemctl suspend` com um cronômetro. Meça o tempo de retomada e compare com `deep`.
5. **Desafio.** Habilite a hibernação seguindo os três passos descritos na seção (swap, `resume=`, teste). Documente cada etapa e os logs de sucesso ou falha. Ao final, decida se a experiência vale a pena para o seu uso e justifique com números (tempo de entrada, tempo de retomada, consumo evitado).