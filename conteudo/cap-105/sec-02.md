Nada assusta mais do que apertar o botão de energia e não ver nada acontecer — ou ver o logo da Valve aparecer e sumir num loop infinito. O boot é a primeira porta de entrada do sistema e, justamente por isso, concentra os sintomas mais dramáticos. A boa notícia: a maioria esmagadora dos casos de "não liga" tem causa simples (bateria zerada, firmware, partição A/B corrompida) e solução rápida.

Esta seção trata exclusivamente do **início da vida do sistema**: do clique no botão de energia até o SteamOS apresentar a interface. Problemas que acontecem *depois* disso — como o Modo Desktop travar ou o jogo fechar sozinho — estão nas seções correspondentes (8 e 3, respectivamente).

:::objetivos
- Distinguir os sintomas de boot e mapear cada um para uma causa provável em segundos
- Executar os procedimentos de resgate sem pânico: reset do EC, boot menu, recovery
- Usar partições A/B e o steamos-update para voltar a uma versão que funcionava
- Saber quando o problema exige imagem de restauração em vez de ajuste fino
- Interpretar os sinais de LED e os modos de boot disponíveis no firmware
:::

## Tabela de boot e inicialização

| Sintoma | Causa provável | Solução |
|---|---|---|
| Não liga de jeito nenhum, sem LED | Bateria descarregada por completo ou controlador (EC) travado | Conecte o carregador original por 15 min; segure o botão de energia por 12 s (reset do EC) e ligue de novo |
| Liga mas a tela fica preta, som de ventoinha liga | GPU não inicializou (driver/wayland), tela externa é a primária | Segure energia 10 s, ligue com `…+Volume−` no boot menu; teste `sudo dmesg | grep -i amdgpu` |
| Logo da Valve aparece e reinicia em loop | Partição A/B corrompida, update quebrado | Ligue com `Volume−` para o boot menu, escolha a partição **anterior** (o slot inativo) |
| Trava no logo da Valve (sem reiniciar) | File system montou com erro, root morto | No boot menu rode `fsck`; se não resolver, boot pela imagem de recuperação e `fsck -f` nas partições |
| Mensagem "no bootable device" | SSD solto, BIOS perdeu o boot order | Segure `Volume+` ao ligar (BIOS), confira o SSD em **Boot**; reconecte o NVMe se sumiu |
| Inicia no desktop mas Modo Jogo não abre | Gamescope quebrou, cache corrompido | `sudo steamos-update` para atualizar; se não, restauração de fábrica preservando `/home` |
| Boot lento, minutos na tela preta | `fsck` rechecando, microSD com erro no boot | Remova o microSD e reinicie; `sudo journalctl -b` mostra o que demorou |

A tabela acima resolve a maioria dos casos. O que vem a seguir detalha cada procedimento para quando a linha sozinha não bastar.

## O reset do EC: a solução esquecida

O Steam Deck tem um **controlador embutido (EC)** que gerencia energia, bateria e botão de ligar — um microcontrolador independente do x86 principal. Quando *nada* acontece ao apertar o botão, o suspeito número um não é o sistema, é o EC travado.

O reset é simples e inofensivo:

1. Desconecte o carregador.
2. Segure o **botão de energia por 12 a 15 segundos** (conte, não chute).
3. Solte, espere 3 segundos.
4. Conecte o carregador de volta e ligue normalmente.

Isso força o EC a reiniciar e re-avaliar o estado da bateria. Em muitos "mortos", o Deck volta a carregar e ligar depois desse procedimento.

```terminal
$ cat /sys/class/power_supply/BAT1/capacity
3
$ cat /sys/class/power_supply/BAT1/status
Discharging
```

Se depois do reset a capacidade mostrar um número muito baixo, a bateria realmente descarregou fundo. Nesse caso deixe carregando conectado **antes** de tentar ligar — o systema pode recusar boot com carga crítica para proteger a célula.

:::atencao
Se o Deck **não liga nem com o carregador conectado e o LED não acende**, o problema provavelmente é físico (conector, bateria ou fonte). Isso sai do escopo deste índice — veja os capítulos de reparo de bateria e alimentação do curso.
:::

## O boot menu e as partições A/B

O SteamOS usa um esquema de **partições A/B**: existem duas cópias do sistema (`rootfs-a` e `rootfs-b`), e a atualização alterna entre elas. Quando um update corrompe a cópia ativa, o Deck não fica irremediavelmente quebrado — você pode escolher a outra.

Para abrir o menu de boot:

1. **Desligue** o aparelho por completo.
2. Segure o botão **`...` (Quick Access) + `Volume−`**.
3. Ainda segurando, **ligue** o aparelho.
4. Mantenha até a tela do boot menu aparecer.

Nesse menu você vê os slots disponíveis e pode escolher um deles. Escolher o slot **inativo** (o que não estava em uso) equivale a um rollback manual da última atualização.

```terminal
$ lsblk -f | grep -E 'rootfs|steamos'
nvme0n1p5        ext4   1.0   rootfs-a   <hash>   /
nvme0n1p6        ext4   1.0   rootfs-b   <hash>
```

Depois que o sistema voltar a funcionar pelo slot antigo, atualize de novo quando a Valve lançar um patch — não fique travado numa versão antiga para sempre.

## Quando o logo trava: fsck e o recovery

Um boot que **trava no logo sem reiniciar** costuma indicar que o kernel montou o filesystem em modo leitura ou com erro. A ferramenta de verificação é o `fsck`, que você roda pela imagem de recuperação (o root ativo não pode ser verificado com segurança enquanto montado).

O fluxo completo quando o boot trava:

1. Entre no boot menu (`… + Volume−`) e escolha o **slot inativo** — tente o caminho simples primeiro.
2. Se ainda travar, boot pela **imagem de recuperação** (USB preparada conforme o capítulo de restauração).
3. No shell da recuperação, descubra as partições com `lsblk -f` e verifique:

```terminal
# fsck -f /dev/nvme0n1p5      # rootfs-a — ajuste para a partição correta
# fsck -f /dev/nvme0n1p8      # partição de dados /home, quando existir
```

4. Se o `fsck` encontrar e corrigir erros, remova o USB e reinicie normalmente.

O `-f` força a verificação mesmo que o filesystem esteja marcado como limpo — importante porque uma marcação "limpa" errada é justamente o que esconde a corrupção.

:::nota
Os comandos de recuperação usam `#` como prompt para indicar ambiente root. No shell de recuperação do SteamOS você geralmente já está como root; se estiver num boot normal e precisar, prefixe com `sudo`.
:::

## "No bootable device" e a BIOS

Se aparecer literalmente a mensagem de que não há dispositivo de boot, o firmware não encontrou o SSD. Causas em ordem de probabilidade:

1. **Boot order errado** — a BIOS tentou dar boot por USB primeiro.
2. **SSD solto** — vibração ou queda deslocou o NVMe.
3. **SSD morto** — a mais rara das três.

Para entrar na BIOS, segure **`Volume+`** ao ligar. Dentro do firmware (firmware Phoenix/Insyde no Steam Deck), confirme:

- O NVMe aparece listado em **Boot → Boot Device**.
- A ordem está com o disco interno primeiro.
- A data/hora estão corretas (uma bateria CMOS morta pode zerar a ordem de boot).

Se o SSD não aparecer na BIOS de jeito nenhum, o próximo passo é físico: abrir, reconectar o NVMe e tentar de novo. O capítulo de upgrade de SSD do curso detalha o procedimento com segurança.

## Resumo

- "Não liga" quase sempre é bateria zerada ou EC travado — o reset de 12 segundos resolve a maioria.
- O logo que aparece e reinicia é o clássico sinal de partição A/B corrompida; use o boot menu (`… + Volume−`) para trocar de slot.
- O logo que aparece e **trava** sem reiniciar pede `fsck` pela imagem de recuperação.
- "No bootable device" é problema de boot order, SSD solto ou SSD morto — confira na BIOS (`Volume+`).
- Use `/sys/class/power_supply/BAT1/` para ler o estado real da bateria antes de suspeitar de hardware.

## Exercícios

1. Com o Deck ligado, execute `lsblk -f | grep -E 'rootfs'` e anote qual slot (a ou b) está montado como `/`. Confirme olhando o `df` se a partição raiz bate com `rootfs-a` ou `rootfs-b`.
2. Desligue o Deck e pratique o boot menu: segure `… + Volume−` e ligue. Você consegue identificar os dois slots na lista? (Não mude nada, apenas observe.)
3. Desligue e pratique também o reset do EC: segure o botão de energia por 12 segundos com o carregador desconectado. O comportamento é previsível e sem risco — anote o que mudou (LEDs, tempo de resposta).
4. Execute `journalctl -b | grep -iE 'error|fail|fault' | head -30` e leia as ocorrências do boot atual. Alguma delas aponta para uma das causas da tabela?
5. **Desafio.** Prepare uma **imagem de recuperação em USB** seguindo o capítulo de restauração do curso. Teste o boot por ela (sem restaurar nada) e confirme que o shell da recuperação abre. Guarde o USB etiquetado — é o seu "kit de emergência" para esta seção inteira.
