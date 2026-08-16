Em praticamente todo tutorial de Linux na internet, a resposta para "como instalar um programa" começa com `pacman -S`, `apt install` ou `dnf install`. No SteamOS, essa resposta é uma armadilha. Usar o `pacman` para instalar software num Steam Deck funciona no curto prazo e quebra o sistema no primeiro update. Esta seção expõe a armadilha em detalhe, para que você entenda o porquê — e não apenas repita o "não faça isso".

:::objetivos
- Entender por que `pacman -S` é perigoso no SteamOS
- Ver o que acontece com pacotes instalados fora do Flatpak após um update
- Diferenciar uso correto de pacman (consulta) de uso incorreto (instalar)
- Conhecer o ciclo de "quebrar e restaurar" do `steamos-readonly`
:::

## O pacman que está ali, mas não é para você

Abra o terminal do Modo Desktop e digite `pacman --version`. Ele funciona. É o mesmo gerenciador de pacotes do Arch, com os mesmos comandos. Isso cria uma falsa familiaridade: o usuário vê `pacman` e pensa "é uma distro Arch, posso instalar coisas".

A presença do pacman é uma consequência da base Arch — a Valve o usa para **construir** a imagem do SteamOS no servidor dela. Ele não é uma ferramenta de usuário final. No Steam Deck, o pacman como instalador é uma porta que leva a um beco sem saída.

```terminal
$ pacman -V
 .--.                  Pacman v6.0.2 - libalpm v13.0.2
/ _.-' .-.  .-.  .-.   Copyright (C) 2006-2023 Pacman Development Team
\  '-. '-'  '-'  '-'   This program may be freely redistributed under
 '--'                    the terms of the GNU General Public License.

$ pacman -Ss vlc
extra/vlc 3.0.21-1
    The versatile media player
```

Os comandos de **consulta** — `pacman -Q`, `pacman -Ss`, `pacman -Si` — são inofensivos e úteis para inspecionar o sistema. O problema começa nos comandos que **escrevem**: `pacman -S` (instalar), `pacman -R` (remover), `pacman -Syu` (atualizar).

## O que acontece se eu usar pacman

Vamos simular o erro clássico. O usuário quer instalar algo que não achou no Flatpak, ou segue um tutorial de Arch. Ele desativa a proteção de leitura e instala com pacman:

```terminal
$ sudo steamos-readonly disable
Removing readonly flag from root filesystem...
$ sudo pacman -S htop
resolving dependencies...
looking for conflicting packages...

Packages (1) htop-3.3.0-1

Total Download Size:   0.07 MiB
Total Installed Size:  0.26 MiB

:: Proceed with installation? [Y/n] Y
:: Retrieving packages...
 htop-3.3.0-1-x86_64          70.4 KiB   190 KiB/s 00:00
(1/1) checking keys in keyring
(1/1) checking package integrity
(1/1) loading package files
(1/1) checking for file conflicts
(1/1) checking available disk space
:: Processing package changes...
(1/1) installing htop
```

Funcionou. O `htop` está instalado e roda. O usuário se sente vitorioso — e é exatamente aqui que a armadilha se fecha. Porque a vitória é temporária: o `htop` foi gravado na partição de sistema **ativa**, aquela que é imutável por contrato.

O problema não aparece agora. Aparece no próximo update.

## O próximo update leva tudo

Quando o SteamOS atualiza, ele grava a build nova na partição **inativa** (B, se você está em A) e troca o boot. A partição inativa tem o sistema "puro", como a Valve o construiu — sem o seu `htop`.

```terminal
$ steamos-update checkout
Checking for updates...
Build 20241015.1 is available (current: 20240926.1)
Downloading update...
Writing update to inactive slot...
Update written to rootfs-B. Reboot to switch.

$ ## Após reiniciar:
$ which htop
htop not found
```

O `htop` sumiu. Não houve aviso, não houve migração, não houve "preservar seus pacotes". O sistema simplesmente passou a rodar uma partição que nunca soube do `htop`. E pior: se o `htop` ou qualquer pacote que você instalou tivesse tocado em arquivos críticos — `/usr/lib`, bibliotecas compartilhadas, o boot — a build nova poderia até dar boot, mas quebrar em tempo de execução de formas difíceis de diagnosticar.

:::atencao
O risco real do `pacman` no SteamOS não é "perder o pacote no update" — isso é só o sintoma mais visível. O risco é instalar um pacote que conflite com bibliotecas da base `holo/`, corrompa o estado de `/usr` e faça a **próxima atualização** falhar ou o sistema parar de bootar. Perder o app instalado é chato; quebrar o boot é o que ninguém quer.
:::

## Por que o pacman "quebra no próximo update"

A razão está na combinação de dois fatos que já vimos: a raiz imutável e as partições A/B. O pacman escreve na partição ativa. A atualização troca para a inativa. Esses dois mundos não se encontram: o que o pacman escreveu em `A` não existe em `B`, e quando `B` assume, tudo o que não estava na imagem construída pela Valve desaparece.

Não é "a Valve apagou seus arquivos por maldade". É a lógica do modelo atômico: a unidade de atualização é a imagem inteira, e a imagem é definida no servidor da Valve, não pelo que você mexeu localmente.

```terminal
$ sudo steamos-readonly disable
## ... instalações fora do Flatpak ...
$ sudo steamos-readonly enable
$ steamos-readonly status
Filesystem is readonly at this time.
```

Repare que religar a proteção (`enable`) não "grava" suas alterações de forma permanente. A proteção de leitura e a persistência da partição são coisas diferentes. Religar só impede novas escritas; não vacina o que já foi escrito contra o update.

:::dica
Se você instalou algo fora do Flatpak e quer que *sobreviva*, há um caminho legítimo e limitado: pacotes instalados como Flatpak, scripts e binários na sua `~/` (por exemplo, em `~/.local/bin`), ou um container/overlay que você mesmo gerencia. Nada de tocar em `/usr` — isso é território da Valve.
:::

## O ciclo de quebrar e restaurar

Quem experimenta o pacman no Deck costuma passar por um ciclo: instala, se diverte, o update apaga, reinstala, até que um update quebra alguma coisa de verdade e aí parte para uma restauração completa. A Valve fornece uma válvula de escape (o menu de recuperação e a mídia de reinstalação), mas o custo é alto: reconfigurar o Deck do zero.

O aprendizado que fica é: **o pacman existe para a Valve, não para você**. Sua ferramenta é o Flatpak. O pacman você pode usar para *ler* o sistema (consultar pacotes, versões, arquivos), nunca para *escrevê-lo*.

## Resumo

- `pacman` no SteamOS é a ferramenta da Valve para construir a imagem do sistema, não uma ferramenta de usuário final.
- Comandos de consulta (`pacman -Q`, `-Ss`, `-Si`) são seguros; comandos que escrevem (`pacman -S`, `-R`, `-Syu`) são perigosos.
- Instalar com `pacman` grava na partição ativa; o próximo update troca para a partição sem esse pacote, que se perde.
- O risco real não é perder o pacote, mas instalar algo que corrompa `/usr` e quebre o boot ou a próxima atualização.
- A via correta é Flatpak; binários próprios podem viver em `~/.local/bin` ou em containers, nunca em `/usr`.
- `steamos-readonly disable/enable` controla a escrita, mas não torna permanentes as alterações na raiz.

## Exercícios

1. Rode `pacman -Q | head -10` e confirme que é seguro consultar o sistema. Depois rode `pacman -Ss htop` e observe que a consulta não altera nada.
2. Verifique se o `htop` (ou outro programa que você tenha instalado via pacman) existe: `which htop`. Se não existir, escreva uma frase explicando por que um usuário pode ter achado que o havia instalado e tê-lo perdido.
3. Execute `sudo steamos-readonly status` e, SEM desativar a proteção, tente `sudo pacman -S htop`. O que acontece? relacione o erro com a imutabilidade da raiz.
4. Explique, com suas palavras, a diferença entre "religar a proteção com `steamos-readonly enable`" e "tornar uma mudança permanente". Por que a primeira não garante a segunda?
5. **Desafio.** Sem instalar nada, investigue o que aconteceria: cheque a partição ativa com `rauc status`, depois confirme com `lsblk` qual é a `rootfs-A` e qual a `rootfs-B`. Monte mentalmente o cenário: se você instalasse um pacote em `A`, por que ele não aparece em `B`? Escreva um parágrafo conectando pacman, imutabilidade e A/B.