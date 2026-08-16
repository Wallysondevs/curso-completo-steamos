SteamOS é o sistema que o Steam Deck trouxe de fábrica, mas não é o único que encara o jogo em hardware portátil com seriedade. Um ecossistema inteiro de distribuições Linux — liderado por Bazzite e ChimeraOS — nasceu para levar a mesma experiência de console a aparelhos que não são (ou deixaram de ser) suportados pela Valve, e a desktops que querem virar central de jogos. Entender o que esse ecossistema faz de diferente, e por que ele existe, é o primeiro passo antes de comparar qualquer uma dessas alternativas ao SteamOS.

:::objetivos
- Situar Bazzite e ChimeraOS dentro do panorama das distros de gaming
- Entender por que o modelo imutável virou padrão nesse nicho
- Diferenciar a proposta de cada projeto e sua origem
- Identificar o que uma distro precisa para replicar a experiência de console
- Reconhecer quando faz sentido sair do SteamOS
:::

## Por que existe vida além do SteamOS

O SteamOS construiu uma reputação por três conquistas: uma interface de console coesa (o modo Gaming), atualizações atômicas que não quebram o sistema e um suporte de hardware afinado para o Steam Deck. Nada disso é exclusivo dele. Outras distros perceberam que poderiam reunir os mesmos blocos — Gamescope, o modo de sessão do Steam, o kernel com patches específicos — e empacotar tudo para rodar em qualquer PC, portátil ou não.

O motor dessa replicação é um conjunto de componentes de código aberto. O **Gamescope** é o compositor da Valve que desenha a interface do modo Gaming e gerencia resolução, taxa de quadros e HDR. A **sessão SteamOS** (`steamos-session`) é o serviço que levanta o ambiente de console em cima de uma distro comum. Como ambos são abertos, qualquer distribuição pode adotá-los — e foi exatamente isso que as alternativas fizeram.

```terminal
$ flatpak list --app | grep -iE 'steam|gamescope|mangohud'
Steam	com.valvesoftware.Steam	stable	system
MangoHud	org.freedesktop.Platform.MangoHud	stable	system
```

O ponto central: a interface que você vê no Steam Deck não é mágica proprietária. É uma pilha de software livre que uma distro alternativa monta do seu jeito, com suas próprias escolhas de base, cadência de atualização e suporte de hardware.

## O modelo imutável como denominador comum

Praticamente todas as distros de gaming modernas são **imutáveis** — ou, no termo mais preciso, **atômicas**. Isso significa que a árvore raiz do sistema (`/usr`, `/etc` em parte) é montada somente leitura e substituída de forma integral a cada atualização, em vez de receber pacotes soltos um a um.

A ideia vem de projetos como o **OSTree**, que trata o sistema operacional como uma sequência de commits versionados, à la Git. Cada atualização gera um novo deploy completo; se algo der errado, você volta um commit com um reboot e o sistema anterior está intacto. É o que o SteamOS faz com seu esquema de partições A/B e o que Bazzite faz com `rpm-ostree`.

```terminal
$ rpm-ostree status
State: idle
Deployments:
● ostree-image-signed:docker://ghcr.io/ublue-os/bazzite:stable
                   Version: 41 (2025-01-10T12:00:00Z)
            BaseCommit: 8a2f...c91b
        LayeredPackages: steam lutris
```

Esse compromisso resolve o conflito clássico do desktop Linux: um sistema gaming precisa de kernel novo, drivers frescos e pacotes de ponta, mas tolerância zero a regressões no meio da noite. A atualização atômica entrega o novo sem tocar no que está rodando agora, e o rollback devolve o velho sem reinstalar nada.

:::nota
"Imutável" é um atalho de linguagem. A raiz é read-only por padrão, mas você continua instalando aplicativos normalmente via Flatpak, e o sistema oferece camadas explícitas (`rpm-ostree install`) para os raros pacotes que precisam viver na imagem base.
:::

## As duas linhagens dominantes

**Bazzite** nasceu dentro do projeto Universal Blue, por sua vez um esforço de montar imagens prontas em cima do Fedora Atomic (Fedora Kinoite/Silverblue). Ele não é uma distro separada no sentido tradicional, e sim uma **imagem customizada** de Fedora com todo o suporte de gaming já embutido: drivers de GPU atualizados, o `ujust` para tarefas comuns e imagens específicas para Steam Deck e outros portáteis. Herda do Fedora a cadência rápida de kernel e Mesa.

**ChimeraOS** segue outro caminho: é uma distribuição **Arch Linux** repensada para ser a cara de um console. Instala no modo "sessão de jogo" de fábrica, liga direto no Gamescope/Steam Big Picture e esconde o desktop por padrão. É mais minimalista e mais "appliance" do que o Bazzite, com foco em virar uma caixa de jogos embaixo da TV.

```terminal
$ cat /etc/os-release | grep -E '^(NAME|ID|VARIANT_ID)'
NAME="Bazzite"
ID=bazzite
VARIANT_ID=bazzite-deck
```

A tabela abaixo fixa a origem de cada um:

| Projeto | Base | Atualização | Foco |
|---|---|---|---|
| SteamOS | Debian (nobre, read-only) | Partições A/B | Steam Deck e clones |
| Bazzite | Fedora Atomic (OSTree) | `rpm-ostree` + rebase | Portáteis e desktops |
| ChimeraOS | Arch Linux | `pacman` + atomic | Console de sala / HTPC |

## O que configura a "experiência de console"

Replicar a sensação de videogame exige mais do que instalar o Steam. Quatro peças precisam trabalhar juntas:

1. **Compositor Gamescope** — dono da tela, reescala jogos em tela cheia, aplica HDR e VRR.
2. **Sessão de jogo** — o ambiente que ignora o desktop e vai direto ao Steam Big Picture.
3. **Controle e entrada** — mapeamento de gamepad, teclado virtual e sensores (gyro) funcionando sem configurar nada.
4. **Atualização transparente** — downloads em segundo plano que não interrompem a partida em andamento.

O SteamOS entrega isso de forma integrada. Bazzite e ChimeraOS tentam entregar o mesmo — e conseguem, com graus diferentes de polimento e suporte de hardware — em qualquer máquina com GPU AMD ou Intel.

:::exemplo
Um handheld chinês com APU AMD que não é suportado pela Valve roda o Bazzite-deck e vira, na prática, um Steam Deck genérico: Gamescope ativo, TDP controlável, HDR funcionando se o painel permitir, e Steam Big Picture na inicialização.
:::

## Quando o SteamOS não basta

Sair do SteamOS não é rebeldia sem motivo. Existem cenários objetivos em que uma alternativa compensa: hardware que a Valve abandonou ou nunca abraçou, necessidade de um desktop GNOME/KDE completo sem as restrições do modo Desktop do Deck, desejo de kernel e Mesa mais novos do que a Valve libera, ou simplesmente a preferência por um ciclo de atualização que você controla.

O custo também é concreto. Você perde a garantia de "funciona de fábrica", assume a responsabilidade por drivers e periféricos e abre mão do caminho de suporte oficial da Valve. As seções seguintes detalham Bazzite e ChimeraOS em profundidade para que essa troca seja uma decisão informada, não um salto no escuro.

## Resumo

- Bazzite e ChimeraOS são as duas grandes alternativas ao SteamOS no nicho de gaming portátil.
- Ambas se apoiam em componentes abertos da Valve: Gamescope e a sessão de jogo.
- O modelo imutável (atualização atômica com rollback) é denominador comum dessas distros.
- Bazzite é uma imagem Fedora Atomic customizada; ChimeraOS é uma Arch reorientada para ser console.
- A experiência de console depende de compositor, sessão, entrada e atualização transparente atuando em conjunto.
- Migrar faz sentido por suporte de hardware, desktop completo ou cadência de updates — com perda do suporte oficial da Valve.

## Exercícios

1. Em qualquer distro, rode `cat /etc/os-release` e identifique `NAME`, `ID` e `VARIANT_ID`. Escreva em uma frase se a sua distro é atômica e por quê.
2. Liste os Flatpaks instalados com `flatpak list --app` e marque quais fazem parte de uma "experiência de gaming" (Steam, MangoHud, Lutris, Heroic, etc.).
3. Se você usa Bazzite, rode `rpm-ostree status` e explique o significado de `Deployments`, `BaseCommit` e `LayeredPackages`. Se não usa, pesquise a saída equivalente no SteamOS (`steamos-readonly` e o esquema A/B).
4. Pesquise qual a APU (AMD ou Intel) do seu aparelho e diga se ela teria suporte a Gamescope/HDR no Bazzite atual. Justifique com o modelo exato do processador gráfico.
5. **Desafio.** Monte uma tabela comparando o ciclo de atualização do SteamOS, do Bazzite e do ChimeraOS (origem dos pacotes, frequência, mecanismo de rollback). Depois proponha — com argumentos — qual deles seria a melhor escolha para um handheld que você esteja considerando comprar.
