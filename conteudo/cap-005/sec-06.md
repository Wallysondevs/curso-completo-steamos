O Steam Deck tem três modelos de armazenamento — 64 GB eMMC, 256 GB NVMe e 512 GB NVMe — e todos sofrem do mesmo mal: espaço que acaba rápido quando a biblioteca cresce. Antes de instalar qualquer coisa, é essencial saber onde cada tipo de dado vive, qual partição está apertada e como o sistema enxerga o disco físico. Esta seção constrói essa leitura a partir do terminal.

:::objetivos
- Mapear partições e uso de disco com `df -h`
- Listar blocos e pontos de montagem com `lsblk`
- Entender a diferença entre partição de sistema e de dados
- Localizar onde ficam os jogos e os downloads
- Conferir o espaço antes de baixar jogos grandes
:::

## Lendo o layout das partições

O disco do Deck é particionado em várias unidades com papéis diferentes. O comando `lsblk` (list block devices) mostra a árvore física e os pontos de montagem:

```terminal
$ lsblk
NAME         MAJ:MIN RM   SIZE RO TYPE MOUNTPOINTS
nvme0n1      259:0    0 476.9G  0 disk
├─nvme0n1p1  259:1    0    64M  0 part
├─nvme0n1p2  259:2    0    32M  0 part
├─nvme0n1p3  259:3    0   512M  0 part
├─nvme0n1p4  259:4    0   4.9G  0 part /
├─nvme0n1p5  259:5    0   4.9G  0 part
├─nvme0n1p6  259:6    0   256M  0 part /var
├─nvme0n1p7  259:7    0   256M  0 part
└─nvme0n1p8  259:8    0 458.4G  0 part /var/tmp
                                      /var/log
                                      /home
```

Este é o modelo de 512 GB (`476.9G` em unidades do disco). As partições `p1` a `p3` (64M, 32M, 512M) são reservadas para firmware, EFI e boot. `p4` e `p5` são um **par A/B**: duas cópias da raiz do sistema, cada uma com 4,9 GB. O mecanismo de atualização por imagem alterna entre elas — a atual usa `p4` (montada em `/`), enquanto `p5` fica de reserva para a próxima imagem e para rollback. `p8`, a maior, é a partição de dados com `/home` e os logs.

:::info
O esquema A/B das partições `p4`/`p5` é a chave do modelo de atualização segura do SteamOS: a imagem nova é gravada na partição inativa enquanto você continua usando a ativa, e a troca acontece só no reboot. Se algo falhar, volta-se para a anterior.
:::

## Uso de espaço com df

O `df` (disk free) responde "quanto espaço sobrou em cada ponto de montagem". A opção `-h` deixa os tamanhos legíveis:

```terminal
$ df -h
Filesystem      Size  Used Avail Use% Mounted on
/dev/nvme0n1p4  4.9G  3.1G  1.6G  64% /
/dev/nvme0n1p6  256M   78M  166M  32% /var
/dev/nvme0n1p8  458G  120G  322G  73% /home
```

Repare nos três pontos principais. A raiz `/` tem apenas 1,6 GB livres — e isso é normal, já que é somente-leitura e guarda só o sistema. `/var` guarda dados variáveis (logs, spool) e também é enxuto. Quem carrega o peso é `/home`, com 120 GB usados e 322 GB livres: é ali que vivem jogos, saves, downloads e arquivos do `deck`.

Para ver o que ocupa espaço dentro de um diretório, o `du` (disk usage) soma por pasta:

```terminal
$ du -sh ~/.local/share/Steam/steamapps/ 2>/dev/null
96G     /home/deck/.local/share/Steam/steamapps/
$ du -sh ~/Downloads 2>/dev/null
5.2G    /home/deck/Downloads
```

Quase toda a massa está nos jogos instalados (`steamapps`, 96 GB). A pasta `Downloads` acumula 5,2 GB — muitas vezes de instaladores e arquivos que poderiam ser apagados.

## Onde fica cada coisa

Conhecer os diretórios evita instalar no lugar errado (e ficar sem espaço na partição menor). Os principais caminhos:

| Caminho | Conteúdo | Partição |
|---|---|---|
| `/` | Sistema SteamOS (raiz somente-leitura) | `p4`/`p5` |
| `/home/deck/` | Diretório do usuário | `p8` |
| `~/.local/share/Steam/steamapps/` | Jogos instalados | `p8` |
| `~/.local/share/Steam/steamapps/common/` | Arquivos de cada jogo | `p8` |
| `~/Downloads` | Downloads do navegador | `p8` |
| `/var/log` | Logs do sistema | `p8` (via `/var`) |

O `libraryfolders.vdf`, dentro de `~/.steam/steam/config/`, registra as bibliotecas de jogos configuradas. Para quem usa cartão microSD, é aqui que o diretório extra aparece:

```terminal
$ cat ~/.steam/steam/config/libraryfolders.vdf
"libraryfolders"
{
    "0"
    {
        "path"          "/home/deck/.local/share/Steam"
        "label"         ""
    }
    "1"
    {
        "path"          "/run/media/deck/SUPERCARD"
        "label"         "microSD"
    }
}
```

Duas bibliotecas: a interna (`0`, no SSD) e a do cartão microSD (`1`, montado em `/run/media/deck/SUPERCARD`). Instalar jogos no cartão alivia o SSD, ao custo de carregamento mais lento.

## Antes de baixar um jogo grande

Antes de instalar, confirme que há espaço. O cálculo é direto: `df -h /home` mostra o livre, e o `du` mostra o que já está consumido. Para o tamanho de um jogo específico, o cliente Steam exibe o requisito na página do jogo, mas dá para estimar pelo que já está no disco:

```terminal
$ du -sh ~/.local/share/Steam/steamapps/common/* 2>/dev/null | sort -rh | head -5
38G     /home/deck/.local/share/Steam/steamapps/common/Portal 2
22G     /home/deck/.local/share/Steam/steamapps/common/Half-Life 2
15G     /home/deck/.local/share/Steam/steamapps/common/Stardew Valley
```

O `sort -rh` ordena por tamanho decrescente, mostrando os jogos mais pesados no topo. Com 322 GB livres, espaço ainda sobra; mas o aviso é válido: jogos AAA atuais passam facilmente de 100 GB.

:::atencao
O `df -h` mostra espaço **lógico** dos sistemas de arquivos. Se você instalou um cartão microSD, ele aparecerá como um ponto de montagem separado (ex.: `/run/media/deck/SUPERCARD`). Confundir o free da partição de dados com o do cartão é um erro frequente ao planejar instalações.
:::

## Resumo

- `lsblk` mostra a árvore de partições, incluindo o par A/B (`p4`/`p5`) da raiz do sistema.
- `df -h` resume espaço livre por ponto de montagem; a raiz `/` é pequena por design.
- `du -sh` mede o tamanho real de diretórios, como `steamapps` e `Downloads`.
- `libraryfolders.vdf` lista as bibliotecas de jogos (SSD interno e microSD).
- `du -sh ... | sort -rh` revela quais jogos ocupam mais espaço no disco.

## Exercícios

1. Rode `lsblk` e identifique qual partição está montada em `/` e qual em `/home`.
2. Execute `df -h` e anote o espaço livre na partição de dados.
3. Meça o tamanho de `~/.local/share/Steam/steamapps/` com `du -sh` e compare com o total usado em `/home`.
4. Liste as bibliotecas de jogos com `cat ~/.steam/steam/config/libraryfolders.vdf` e identifique a do SSD e a do microSD (se houver).
5. **Desafio.** Rode `du -sh ~/.local/share/Steam/steamapps/common/* | sort -rh | head -3` para achar os três jogos mais pesados. Some seus tamanhos e, comparando com o `df -h /home`, determine se caberia instalar mais um jogo de 80 GB e explique seu raciocínio.
