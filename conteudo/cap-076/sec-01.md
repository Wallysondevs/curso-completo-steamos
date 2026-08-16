O Steam Deck é um PC com Linux por baixo, mas a Valve escolheu configurações de kernel e de memória pensando num dispositivo de consumo com bateria e controle. Quando a comunidade começou a mexer nessas configurações para "destravar desempenho", nasceu uma categoria de ferramentas cujo representante mais famoso é o CryoUtilities. Entender o que essa ferramenta altera — e por que cada valor existe — é o que separa um ganho real de um placebo tecnológico.

:::objetivos
- Entender o que o CryoUtilities é e onde ele se encaixa no ecossistema do Deck
- Identificar quais subsistemas do kernel o CryoUtilities toca
- Diferenciar ajustes persistentes de ajustes temporários
- Avaliar quando uma otimização faz sentido no SteamOS
- Reconhecer os riscos de aplicar tweaks em modo de jogo
:::

## O golpe de sorte de uma ferramenta certa na hora certa

O CryoUtilities começou como um conjunto de scripts que o desenvolvedor CryoByte33 mantinha para o próprio Deck, empacotado depois num instalador gráfico. A popularidade explodiu porque ele prometia ganhos de FPS e menos engasgos em jogos pesados, em parte no 16 GB de RAM da versão de LCD — pouco para um jogo que quer 8 GB e um sistema que também usa memória para o SSDs e o Proton.

O que a ferramenta faz, na essência, é editar parâmetros do kernel Linux que qualquer administrador poderia mudar na mão. O valor do CryoUtilities não está em magia, e sim em reunir num só lugar opções que de outra forma exigiriam `sysctl`, `systemctl` e edição de arquivos. O instalador cuida de persistência e de desfazer, algo que scripts manuais frequentemente esquecem.

```terminal
$ whoami
deck
$ uname -a
Linux steamdeck 6.5.0-valve22-1-neptune-65-g9a338ed8a75e #1 SMP PREEMPT Wed Oct 23 00:00:00 UTC 2024 x86_64 GNU/Linux
$ cat /etc/os-release | head -2
NAME="SteamOS"
VERSION="3.6.20"
```

A versão de referência deste curso é a SteamOS 3.6, baseada no Ubuntu 24.04 (Noble). Como o SteamOS usa um sistema de arquivos **somente leitura** para a maior parte do sistema, alguns tweaks precisam contornar essa trava — e é aí que mora parte da complexidade.

## Onde os tweaks moram

O SteamOS monta a raiz em modo `read-only` por padrão para sobreviver a atualizações atômicas. Isso significa que editar `/etc/sysctl.conf` diretamente pode falhar, porque o diretório não aceita escrita até você desbloquear com `sudo steamos-readonly disable`. O CryoUtilities faz esse trabalho por baixo e aplica os valores num arquivo de configuração próprio.

```bash
# o que o CryoUtilities faz, de forma simplificada:
sudo steamos-readonly disable
sudo mkdir -p /etc/sysctl.d
echo "vm.swappiness=1" | sudo tee /etc/sysctl.d/zzz-custom-tweaks.conf
sudo steamos-readonly enable
```

Trocar o `readonly` para `disable` é reversível, mas tem consequência: qualquer mudança manual que você fizer ali **some na próxima atualização do sistema**, porque a Valve reescreve a raiz. Ferramentas como o CryoUtilities reaplicam os tweaks após cada update, o que é parte do apelo delas.

:::atencao
O modo de jogo (Game Mode) roda em uma sessão gráfica dedicada, sem o ambiente desktop completo. Tweaks que dependem de um daemon rodando com `systemd --user` podem não sobreviver ao reinício ou não carregar no Game Mode. Sempre verifique se o ajuste está ativo dentro do contexto onde você joga, não apenas no desktop.
:::

## O que ele muda, em uma frase cada

O CryoUtilities toca, principalmente, quatro frentes. Conhecê-las por nome já organiza o restante deste capítulo:

| Frente | O que ajusta | Riscos |
|---|---|---|
| Swap | Aumenta o arquivo de troca e o tamanho do `zram` | Ocupa disco e CPU de compressão |
| Swappiness | Baixa o `vm.swappiness` de 100 para 1 | Mantém mais RAM "suja", pode pressionar a memória |
| Huge pages | Liga o hugepages/THP em modo `always` | Fragmentação e latência em alguns jogos |
| TRIM/VRAM | Agenda `fstrim` e sugere ajuste do buffer UMA na BIOS | Requer reiniciar o firmware |

Nenhuma dessas frentes é exclusiva do Steam Deck. O mesmo `sysctl` usado no Deck existe num servidor Ubuntu. A diferença é o contexto: 16 GB de RAM compartilhada entre CPU e GPU é um orçamento apertado, e por isso cada megabyte importa mais aqui do que numa workstation.

```terminal
$ sysctl vm.swappiness
vm.swappiness = 100
$ sysctl vm.nr_hugepages
vm.nr_hugepages = 0
```

## Por que mexer pode valer a pena (ou não)

A Valve calibra o SteamOS para a *média* dos jogos e para um consumo de energia razoável. Isso não é necessariamente o "ótimo" para o jogo específico que você roda. Ferramentas como o CryoUtilities partem do argumento de que o padrão da Valve prioriza estabilidade e espaço em disco, e que dá para apertar esses parafusos.

Mas a conta tem dois lados. Um ajuste que melhora um jogo de mundo aberto pode piorar um emulador ou um jogo com streaming de texturas. É por isso que a seção mais importante deste capítulo não ensina "qual valor usar", e sim [como medir o impacto real](#/cap-076/sec-08): sem linha de base, tweak é aposta.

Capturar o baseline antes de qualquer alteração é um comando de um minuto:

```terminal
$ sysctl vm.swappiness
vm.swappiness = 100
$ cat /proc/sys/vm/nr_hugepages
0
$ free -h
               total        used        free      shared  buff/cache   available
Mem:            15Gi       5.8Gi       3.1Gi       420Mi       6.3Gi       8.9Gi
Swap:          8.0Gi          0B       8.0Gi
$ zramctl
NAME       ALGORITHM DISKSIZE   DATA  COMPR  TOTAL STREAMS MOUNT
/dev/zram0 lz4         8G        0B     0B     0B       4
```

Esses quatro números são sua âncora. Se algo der errado, você sabe exatamente para onde voltar.

:::dica
Antes de instalar qualquer otimizador, anote o estado atual: `sysctl vm.swappiness`, `cat /proc/sys/vm/nr_hugepages` e `free -h`. Assim você tem um ponto de retorno confiável, sem depender da função de "desfazer" da ferramenta.
:::

## Resumo

- O CryoUtilities automatiza ajustes de kernel que poderiam ser feitos manualmente, mas que exigem persistência e conhecimento de `readonly`.
- O SteamOS monta a raiz somente leitura; tweaks exigem `steamos-readonly disable` e são sobrescritos a cada atualização.
- As frentes principais são swap, swappiness, huge pages e TRIM/VRAM — todas parâmetros comuns do kernel Linux.
- Tweaks podem ser ganho real ou placebo; só a medição com linha de base responde qual é qual.
- Sempre capture o estado original antes de aplicar, para reverter de forma confiável.

## Exercícios

1. Liste os valores atuais de troca e memória da sua máquina com `free -h`, `sysctl vm.swappiness` e `swapon --show`. Escreva, em uma frase, o que cada um significa.
2. Verifique se a raiz do seu SteamOS está em modo leitura somente rodando `mount | grep ' / '` e interpretando as flags `ro` ou `rw`.
3. Crie um arquivo de teste em `/etc/sysctl.d/` com um valor inofensivo (depois remova). O que acontece se você tentar sem antes desabilitar o modo readonly?
4. Identifique os três principais arquivos ou parâmetros que o CryoUtilities modifica e procure cada um no seu sistema atual.
5. **Desafio.** Explique por que um tweak que funciona no modo desktop pode não ter efeito no Game Mode, relacionando com o conceito de sessões de usuário do `systemd`.
