O SteamOS adota uma decisão de arquitetura que o separa da maioria das distribuições Linux: o sistema de arquivos raiz é montado como **somente-leitura**. Isso significa que, por padrão, você não pode instalar pacotes com `pacman`, editar arquivos em `/usr` ou modificar bibliotecas do sistema — e isso é intencional. A Valve quer garantir que o Steam Deck saia da fábrica com um sistema idêntico em todos os dispositivos e que uma atualização automática não destrua nada que o usuário tenha alterado. Entender essa camada é o primeiro passo antes de qualquer personalização profunda.

:::objetivos
- Entender por que o SteamOS monta a raiz como somente-leitura
- Identificar as partições que são graváveis e as que não são
- Compreender o papel do overlayfs na proteção do sistema
- Verificar o estado atual do modo leitura com `steamos-readonly`
:::

## Por que uma distribuição imutável?

A ideia de sistema imutável não nasceu com o SteamOS. O Fedora Silverblue, o openSUSE MicroOS e o ChromeOS já exploram esse modelo há anos. O princípio é simples: em vez de atualizar pacotes um a um e arriscar inconsistências, o sistema é tratado como uma imagem atômica. Quando a Valve publica uma atualização de sistema, ela substitui a partição raiz inteira por uma nova versão — como um `dd` de fábrica, mas preservando a `/home`.

Isso resolve três problemas de uma vez:

- **Consistência.** Todo Steam Deck no mundo executa exatamente os mesmos binários, com as mesmas bibliotecas. Testes de compatibilidade são reprodutíveis.
- **Segurança.** Um malware que tenta se instalar em `/usr/bin` encontra uma montagem que não aceita escrita. O mesmo vale para um `sudo rm -rf /usr` acidental.
- **Suporte.** Quando um usuário reporta um bug, a Valve sabe que o sistema dele é idêntico ao de laboratório — sem surpresas de dependências quebradas por um `pacman -Syu` mal-sucedido.

O preço é a liberdade: você não pode simplesmente rodar `sudo pacman -S neofetch` e esperar que sobreviva. O sistema empurra você para Flatpaks e para a `/home`, onde a escrita é livre. O modo leitura não é um bug — é um contrato.

## Quem é quem nas partições

O particionamento do Steam Deck é simples e conta a história:

```terminal
$ lsblk -o NAME,SIZE,TYPE,MOUNTPOINTS,RO
NAME        SIZE TYPE MOUNTPOINTS                  RO
mmcblk0   477.0G disk
├─mmcblk0p1  64M part                              0
├─mmcblk0p2  32M part                              0
├─mmcblk0p3  32M part                              0
├─mmcblk0p4   5G part /                            1
├─mmcblk0p5   5G part                              1
├─mmcblk0p6 256M part                              0
├─mmcblk0p7 256M part                              0
├─mmcblk0p8   5G part /var                         0
└─mmcblk0p9 462G part /home                        0
```

A coluna `RO` (read-only) revela o segredo. As partições de sistema (`mmcblk0p4` e `mmcblk0p5`) estão com flag `1` — montadas como somente-leitura. A partição 4 é a raiz atual (`/`), e a 5 é a slot de backup para o esquema A/B de atualização. Já `/var` e `/home` são graváveis: logs, cache, pacotes Flatpak instalados pelo Discover e todos os seus dados pessoais sobrevivem a atualizações porque estão ali.

```terminal
$ mount | grep -E '^/dev.*on / '
/dev/mmcblk0p4 on / type btrfs (ro,noatime,ssd,space_cache,subvolid=5,subvol=/)
```

A montagem raiz usa Btrfs com a flag `ro` explícita. Não é permissão de arquivo — é a montagem que recusa toda escrita. Mesmo o root não consegue criar um arquivo em `/usr/bin` enquanto a partição estiver montada assim.

## O comando `steamos-readonly`

O SteamOS inclui um utilitário próprio para consultar e controlar o estado do modo leitura:

```terminal
$ steamos-readonly status
readonly: enabled
```

É um binário simples que lê o estado atual da montagem. A versão `status` não altera nada — só informa. As outras opções (`disable` e `enable`) aparecerão na [próxima seção](#/cap-081/sec-02).

Por trás, o `steamos-readonly disable` não remove nada — ele simplesmente remonta a partição raiz com a flag `rw`:

```terminal
$ steamos-readonly disable
$ mount | grep 'on / '
/dev/mmcblk0p4 on / type btrfs (rw,noatime,ssd,space_cache,subvolid=5,subvol=/)
```

A diferença é uma letra: `ro` virou `rw`. Mas essa letra abre a porta para tudo que as próximas seções cobrem.

## O que quebra e o que não quebra

Antes de desabilitar o modo leitura, é essencial entender o que sobrevive a uma atualização do sistema. A Valve desenhou a atualização para apagar tudo que está em `/` (a partição do sistema) e substituir pela nova imagem. O que está em `/home` e `/var` não é tocado.

Isso significa:

| Diretório | Sobrevive a update? | Exemplos |
|---|---|---|
| `/home/deck/` | Sim | Jogos, saves, Flatpaks de usuário, configs |
| `/var/` | Sim | Logs, cache do Pacman, Flatpaks de sistema |
| `/usr/bin/` | **Não** | Pacotes instalados com `pacman -S` |
| `/etc/` | **Não** (parcial) | Alguns arquivos são preservados via sobreposição, mas a regra é: **não conte com isso** |
| `/opt/` | **Não** | Qualquer software instalado manualmente aqui se perde |

:::atencao
Tudo que você instalar com `pacman -S` depois de `steamos-readonly disable` vai **sumir na próxima atualização do sistema**. O SteamOS não avisa, não faz backup e não pergunta. É por isso que a recomendação oficial é usar Flatpak para aplicações e reservar o Pacman apenas para ferramentas de sistema essenciais que você está disposto a reinstalar a cada update.
:::

A consequência prática: você pode desabilitar o modo leitura, instalar o que quiser, testar, brincar — mas deve tratar tudo em `/usr` como efêmero. Guarde scripts, aliases e configs na `/home/deck`. Automatize a reinstalação pós-update. A seção 9 cobre exatamente essa estratégia.

## Resumo

- O SteamOS monta a partição raiz como somente-leitura por design — é um sistema imutável com atualizações atômicas A/B.
- As partições de sistema (`mmcblk0p4` e `p5`) são `ro`; `/var` e `/home` são `rw` e sobrevivem a updates.
- O comando `steamos-readonly status` informa se o modo leitura está ativo; `disable` remonta a raiz como `rw`.
- Tudo que for instalado em `/usr`, `/etc` ou `/opt` com o modo leitura desabilitado **será perdido** na próxima atualização do sistema.
- O Flatpak, instalado em `/var` ou `~/.local`, é o caminho oficial para aplicações persistentes.

## Exercícios

1. Execute `steamos-readonly status` e `mount | grep 'on / '`. As duas saídas são coerentes? O que cada uma informa?
2. Liste as partições do seu Steam Deck com `lsblk -o NAME,SIZE,MOUNTPOINTS,RO` e identifique quais têm a flag `RO=1`. Explique por que há duas partições de sistema de 5 GB.
3. Tente criar um arquivo em `/usr/local/bin` com `touch /usr/local/bin/teste`. Funcionou? Por quê?
4. Compare a saída de `df -h /` com `df -h /home`. Quanto espaço está alocado para cada uma? Isso faz sentido dado o propósito de cada partição?
5. **Desafio.** Sem desabilitar o modo leitura, encontre um diretório dentro de `/etc` que seja gravável. Dica: procure por montagens overlay em `mount | grep overlay`. O que essa sobreposição permite que o sistema preserve entre atualizações?