Saber onde as coisas ficam é metade do caminho. A outra metade é descobrir para onde o espaço está indo quando o disco aperta. Esta seção fecha o capítulo com as ferramentas de diagnóstico que todo dono de Steam Deck deveria ter no bolso: `du`, `ncdu`, `df`, `findmnt` e a arte de interpretar rapidamente o que está consumindo seus preciosos gigabytes.

:::objetivos
- Dominar `du` para medir pastas e arquivos de forma precisa
- Usar `ncdu` como navegador interativo de uso de disco
- Diagnosticar partição cheia com `df -h` e `findmnt`
- Aplicar um checklist de limpeza para liberar espaço sem perder dados
:::

## du: o contador de peso por diretório

O `du` (*disk usage*) percorre uma árvore de diretórios e soma o tamanho de cada arquivo dentro dela. É a ferramenta mais básica e confiável para descobrir o que está ocupando espaço:

```terminal
$ du -sh /home/deck/.steam/steam/steamapps/*
1.2G    /home/deck/.steam/steam/steamapps/common/Stardew Valley
4.8G    /home/deck/.steam/steam/steamapps/common/Slime Rancher 2
12G     /home/deck/.steam/steam/steamapps/common/DOOM Eternal
38G     /home/deck/.steam/steam/steamapps/common/Apex Legends
84M     /home/deck/.steam/steam/steamapps/compatdata
2.3G    /home/deck/.steam/steam/steamapps/shadercache
```

As flags essenciais:

| Flag | Significado |
|---|---|
| `-s` | *Summarize* — só o total, sem lista recursiva |
| `-h` | *Human-readable* — K, M, G em vez de bytes |
| `-d 1` | Profundidade máxima (1 = só o primeiro nível) |
| `--max-depth=2` | Equivalente a `-d 2` |

O `du` também aceita ordenação com `sort`. Para listar as 10 maiores pastas dentro de qualquer lugar:

```terminal
$ du -sh /home/deck/* 2>/dev/null | sort -h | tail -10
```

O `sort -h` reconhece os sufixos K/M/G e ordena por tamanho real, não alfabeticamente. É a combinação mais útil para caçar ocupantes de disco.

## ncdu: o du com navegação visual

Quando você não sabe nem por onde começar, o **ncdu** é um salva-vidas. Ele escaneia um diretório e monta uma interface de terminal navegável com as setas do teclado:

```terminal
$ ncdu /home/deck
```

A tela mostra a lista de diretórios ordenada por tamanho decrescente, e você pode:

- `[[Enter]]` — entrar num subdiretório.
- `[[d]]` — marcar um item para deleção.
- `[[s]]` — ordenar por tamanho (padrão).
- `[[n]]` — ordenar por nome.
- `[[q]]` — sair.

É especialmente útil no modo desktop do Steam Deck, onde você pode abrir um terminal e escanear `/home/deck` em segundos. O `ncdu` vem pré-instalado no SteamOS? Nem sempre — mas um `sudo pacman -S ncdu` temporário ou, melhor, o Flatpak equivalente (`ncdu`) resolvem num instante.

:::dica
Se não puder instalar o `ncdu`, o `du` combinado com `sort` e `head` faz 80% do trabalho. A diferença é que o `ncdu` permite navegar interativamente sem digitar novos comandos, o que é bem mais ágil quando você está tentando achar um culpado específico.
:::

## df -h e findmnt: o painel de controle

O `df -h` é o termômetro geral — mostra cada sistema de arquivos montado, quanto espaço usa e quanto sobra:

```terminal
$ df -h -x tmpfs -x devtmpfs
Filesystem      Size  Used Avail Use% Mounted on
/dev/mmcblk0p4  8.0G  3.1G  4.6G  41% /
/dev/mmcblk0p6  256M   88M  168M  35% /var
/dev/mmcblk0p8   43G   18G   24G  43% /home
/dev/mmcblk0p1   64M   16M   48M  25% /esp
```

A flag `-x` exclui tipos de sistema de arquivos; `-x tmpfs -x devtmpfs` limpa a saída, mostrando só os discos reais. A coluna `Use%` é a que mais importa: se `/home` estiver acima de 85%, é hora de agir. Se `/var` estiver acima de 80%, é hora de investigar os logs.

Já o `findmnt` mostra a hierarquia de montagens de forma mais rica:

```terminal
$ findmnt --df
SOURCE        FSTYPE   SIZE   USED  AVAIL USE% TARGET
/dev/mmcblk0p4 ext4    8.0G   3.1G   4.6G  41% /
/dev/mmcblk0p6 ext4    256M   88M   168M  35% /var
/dev/mmcblk0p8 ext4   42.3G  17.6G  24.1G  43% /home
```

O `findmnt --df` imita o `df` mas inclui tipo de sistema de arquivos e colunas mais limpas. A diferença é que ele mostra apenas o que está realmente montado, sem os pseudo-filesystems.

## Checklist de diagnóstico quando o disco aperta

Quando o Steam Deck avisar "disco cheio", siga esta ordem:

1. **`df -h -x tmpfs -x devtmpfs`** — identifique *qual* partição está perto de 100%.
2. **`du -sh /home/deck/*`** — se for `/home`, veja os candidatos grandes.
3. **`du -sh ~/.steam/steam/steamapps/shadercache ~/.steam/steam/steamapps/compatdata`** — shaders e prefixos Proton costumam ser os vilões silenciosos.
4. **`journalctl --disk-usage`** — se for `/var`, verifique o journal.
5. **Limpe de forma segura**: shadercache pela interface do Steam; jogos desinstalados pela interface do Steam; logs com `journalctl --vacuum-size=50M`.

O erro clássico: achar que o problema está em `/home` e apagar coisas de lá enquanto o verdadeiro culpado é o `/var` cheio de logs.

:::exemplo
Ana notou que o Steam Deck estava lento e mostrando pouco espaço. `df -h` revelou que `/var` estava em 97%. Investigando com `journalctl --disk-usage`, descobriu 180 MB em logs de erros repetidos de uma placa de rede USB que ela conectava e desconectava. Um `journalctl --vacuum-size=50M` resolveu o problema em segundos, sem apagar nada importante.
:::

## Para ir além: monitoramento contínuo

Quando o espaço está tão apertado que cada gigabyte importa, você pode agendar verificações periódicas com um script simples ou usar ferramentas como `btdu` (específico para Btrfs, mostra subvolumes e snapshots). Para a maioria dos usuários, entretanto, dominar `du`, `df` e `ncdu` cobre 95% dos cenários do dia a dia.

## Resumo

- `du -sh` mede o tamanho de qualquer diretório; combinado com `sort -h`, revela os maiores ocupantes.
- `ncdu` oferece navegação interativa para explorar o uso de disco rapidamente.
- `df -h` é o termômetro por partição; `findmnt --df` é uma alternativa mais limpa.
- A coluna `Use%` acima de 85% dispara o gatilho de diagnóstico.
- O checklist: identifique a partição cheia → ache o culpado com `du` ou `ncdu` → limpe de forma segura.

## Exercícios

1. Rode `du -sh /home/deck/.steam/steam/steamapps/* | sort -h` e anote os três maiores consumidores.
2. Execute `ncdu /home/deck` (se disponível) e navegue até o diretório mais pesado. Confirme o tamanho com `du -sh`.
3. Compare `df -h -x tmpfs -x devtmpfs` com `findmnt --df`. As colunas USE% batem?
4. Simule um diagnóstico: pegue uma pasta qualquer e faça `du -sh * | sort -h | tail -5` para identificar os 5 maiores itens.
5. **Desafio.** Crie um pequeno shell script que roda `df -h /home` e, se o uso estiver acima de 85%, imprime os 5 maiores diretórios dentro de `/home/deck`. Teste o script e explique como ele poderia ser acionado automaticamente com um timer do systemd.