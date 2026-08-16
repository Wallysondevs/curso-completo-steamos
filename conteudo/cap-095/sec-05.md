O SteamOS não é um Linux qualquer: a partição raiz (`/`) é **imutável**. Isso significa que, por padrão, você não pode instalar pacotes com `pacman`, não pode sobrescrever arquivos do sistema e não pode bagunçar `/usr`. A decisão vem do design de console: a Valve quer que o sistema base nunca quebre por causa de uma atualização mal feita ou de um tutorial aleatório da internet. Mas essa mesma proteção frustra quem quer customizar o Steam Deck — e é aí que o `steamos-readonly` e o sistema de updates atômicos entram.

:::objetivos
- Entender por que a Valve tornou a raiz imutável e o que isso protege
- Verificar o estado do modo somente-leitura com `steamos-readonly`
- Distinguir o que é imutável do que não é (`/home`, `/var`, discos externos)
- Compreender o modelo de updates atômicos por imagens A/B
- Saber desabilitar e reabilitar o modo imutável com segurança
:::

## A filosofia do root imutável

Num desktop Linux tradicional, você instala o sistema uma vez e depois acumula pacotes, dependências, arquivos de configuração modificados e resíduos de desinstalações. Dois anos depois, a máquina é um Frankenstein que ninguém sabe reproduzir. O Steam Deck adota o modelo oposto: o sistema base é uma imagem coesa e atômica, gerada pela Valve, idêntica em todos os aparelhos da mesma versão.

```terminal
$ steamos-readonly status
readonly
$ mount | grep " / "
/dev/nvme0n1p3 on / type btrfs (ro,relatime,ssd,space_cache,subvolid=5,subvol=/)
```

A flag `ro` (read-only) na linha do mount confirma: a raiz está montada como somente-leitura. O comando `steamos-readonly status` é o jeito canônico de verificar — ele retorna `readonly` ou `disabled`.

As vantagens desse modelo: o sistema é previsível (o suporte da Valve sabe exatamente o que está rodando na sua máquina), as atualizações são atômicas (ou aplicam por inteiro, ou revertem) e é muito mais difícil um malware ou um comando errado corromper o sistema base.

## O que é imutável e o que não é

A proteção cobre `/` e tudo que está dentro dela por padrão, com exceções explícitas. O SteamOS usa alguns diretórios com escrita garantida:

| Caminho | Gravável? | Finalidade |
|---|---|---|
| `/home/deck` | Sim | Seus arquivos, projetos, configs de usuário |
| `/var` | Sim | Logs, cache, spool, estado de serviços |
| `/etc` | Parcial | Alguns arquivos de configuração podem ser alterados via overlay |
| `/tmp` | Sim (RAM) | Arquivos temporários, apagados no reboot |
| `/run` | Sim (RAM) | Estado volátil de daemons |
| `/media` e `/mnt` | Sim | Montagem de discos externos |
| `/usr` | **Não** | Binários, bibliotecas, documentação do sistema |

```terminal
$ touch /etc/teste.txt
touch: cannot touch '/etc/teste.txt': Read-only file system
$ touch /home/deck/teste.txt
$ ls /home/deck/teste.txt
/home/deck/teste.txt
```

É por isso que tutoriais genéricos de Linux ("rode `sudo pacman -Syu` para atualizar") simplesmente falham no SteamOS. A ferramenta de atualização é o próprio Steam, no Modo Jogo — não o `pacman`.

:::info
O SteamOS usa **Btrfs** como sistema de arquivos raiz, com subvolumes separados para `/home` e `/var`. Isso permite que a Valve faça snapshots e rollbacks sem afetar seus dados pessoais. Se você vem do mundo ext4, Btrfs é uma mudança de paradigma — [ver capítulo sobre sistemas de arquivos](#/cap-082/sec-06).
:::

## Updates atômicos por partições A/B

O Steam Deck mantém **duas cópias do sistema**: a partição A e a partição B. Quando uma atualização chega, ela é instalada na partição inativa. Na próxima reinicialização, o bootloader aponta para a partição atualizada. Se algo falhar, ele volta automaticamente para a partição anterior.

```terminal
$ lsblk -o NAME,SIZE,TYPE,MOUNTPOINT | grep -E "nvme|NAME"
NAME        SIZE TYPE  MOUNTPOINT
nvme0n1   238,5G disk  
├─nvme0n1p1   64M part  /efi
├─nvme0n1p2   32M part  
├─nvme0n1p3  128G part  /          ← partição A (ativa)
├─nvme0n1p4  128G part             ← partição B (inativa, backup)
└─nvme0n1p5   ... part  /home
```

Esse esquema é emprestado do ChromeOS e do Android — sistemas que não podem se dar ao luxo de "não ligar" depois de uma atualização. Para o usuário, é transparente: você nunca precisa escolher a partição manualmente.

## Desabilitando o modo imutável (e quando fazer isso)

Sim, é possível desabilitar o modo somente-leitura. E sim, existe motivo legítimo: instalar um pacote que a Valve não distribui, trocar um arquivo de configuração do sistema ou fazer troubleshooting avançado.

```terminal
$ sudo steamos-readonly disable
[sudo] password for deck: 
readonly filesystem disabled
$ sudo steamos-readonly status
disabled
$ mount | grep " / "
/dev/nvme0n1p3 on / type btrfs (rw,relatime,ssd,space_cache,subvolid=5,subvol=/)
```

Repare que o mount agora mostra `rw` (read-write). Com o sistema gravável, você pode usar `pacman`:

```terminal
$ sudo pacman -Syu
:: Synchronizing package databases...
 core is up to date
 extra is up to date
 community is up to date
:: Starting full system upgrade...
 there is nothing to do
```

:::perigo
Desabilitar o modo imutável e sair instalando pacotes com `pacman` **vai reverter na próxima atualização do sistema**. A Valve redistribui a imagem inteira, sobrescrevendo suas alterações. Se você precisa de pacotes persistentes, use **Distrobox** ou **Flatpak** — [ver capítulo sobre Distrobox](#/cap-099) — não lute contra o sistema imutável. Além disso, arquivos modificados manualmente em `/usr` podem causar conflitos em updates futuros.
:::

## Reabilitando após terminar

Depois de fazer as alterações necessárias, reabilitar o modo imutável é uma linha:

```terminal
$ sudo steamos-readonly enable
readonly filesystem enabled
$ sudo steamos-readonly status
readonly
```

A Valve recomenda que você mantenha o sistema imutável sempre que possível. A regra prática: desabilite, faça o que precisa e reabilite imediatamente. Não deixe o sistema em modo gravável por inércia.

## Resumo

- O SteamOS monta `/` como somente-leitura (`ro`) por design, protegendo o sistema base contra modificações acidentais.
- `steamos-readonly status` informa se o sistema está imutável; `disable` e `enable` controlam o estado.
- `/home`, `/var`, `/tmp` e pontos de montagem externos continuam graváveis mesmo com raiz imutável.
- As atualizações usam partições A/B: a atualização vai para a partição inativa e o boot escolhe a que funcionou.
- Alterações feitas com `pacman` no modo gravável são perdidas na próxima atualização do sistema; use Flatpak ou Distrobox para software adicional.

## Exercícios

1. Execute `steamos-readonly status` e `mount | grep " / "` para confirmar que sua raiz está imutável.
2. Rode `touch /usr/teste.txt` (vai falhar). Depois rode `touch /home/deck/teste.txt` (vai funcionar). Explique a diferença.
3. Use `lsblk` para identificar as partições A e B do seu Steam Deck. Anote os tamanhos e pontos de montagem.
4. Se tiver coragem: desabilite o modo imutável com `sudo steamos-readonly disable`, crie um arquivo em `/etc/` com `sudo touch /etc/teste-steamos.txt`, confira com `ls -l /etc/teste-steamos.txt`, e reabilite o modo imutável.
5. **Desafio.** Pesquise o layout de partições do Steam Deck com `sudo fdisk -l /dev/nvme0n1`. Identifique a partição EFI, as partições A/B, a partição de home e explique por que apagar a partição errada inutilizaria o aparelho. Depois, investigue se o seu Deck está com a partição A ou B ativa usando `lsblk -o NAME,MOUNTPOINT`.