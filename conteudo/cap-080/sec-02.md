Bazzite é a alternativa que mais diretamente disputa com o SteamOS o posto de "sistema pronto para jogar num portátil". Ele não é uma distro escrita do zero, e sim uma camada de propósito que pega o Fedora Atomic — a variante imutável do Fedora — e o especializa em gaming. Entender de onde ele vem e quais "sabores" oferece é essencial para instalar a variante certa no hardware certo, em vez de baixar uma imagem qualquer e torcer para funcionar.

:::objetivos
- Situar o Bazzite dentro do projeto Universal Blue e do Fedora Atomic
- Diferenciar as variantes (deck, desktop, GNOME, KDE) e seus destinos
- Entender o papel do OSTree e das imagens OCI na distribuição
- Identificar os pacotes e patches de gaming embutidos por padrão
- Reconhecer o que muda em relação ao Fedora original
:::

## Fedora Atomic como chassi

Por baixo, o Bazzite é **Fedora Atomic Desktop**. Isso significa que o sistema inteiro é um deploy de OSTree: a raiz é read-only, e cada atualização troca o deploy por outro, inteiro, versionado. Não existe o "atualizou e quebrou pela metade" do modelo tradicional, porque a transição é binária — ou o deploy novo sobe inteiro, ou você permanece exatamente onde estava.

O Universal Blue é o guarda-chuva que monta essas imagens. A premissa do projeto é simples: o Fedora fornece a base sólida e testada, e a comunidade publica imagens que já vêm com firmwares, codecs e drivers que o Fedora oficial não pode empacotar por questões legais ou de política. O Bazzite é a imagem desse ecossistema voltada a jogos.

```terminal
$ cat /etc/fedora-release
Fedora release 41 (Forty One)
$ rpm-ostree db list --repo | grep -E 'mesa|kernel' | head -5
kernel-6.12.7-200.fc41.x86_64
mesa-vulkan-drivers-24.3.2-1.fc41.x86_64
mesa-libGL-24.3.2-1.fc41.x86_64
```

Repare que a base continua sendo Fedora 41: o Bazzite não reinventa o sistema de pacotes, reaproveita tudo. O ganho está no que é *adicionado por cima* — drivers atualizados fora do ciclo oficial, e um conjunto de ajustes já aplicados na imagem.

## Uma imagem para cada aparelho

O Bazzite publica variantes distintas, e a escolha errada é a primeira causa de frustração de quem instala. As duas grandes famílias são:

**Bazzite `deck` (ou `-deck`).** Copia a experiência do Steam Deck: inicializa direto na sessão de jogo via Gamescope, sem passar pelo desktop. É a variante para portáteis (Steam Deck incluso, caso você queira substituir o SteamOS) e para PCs que vão viver como console. Tem o controle de TDP, HDR e o teclado virtual do Deck.

**Bazzite `desktop`.** É um Fedora com ambiente desktop completo (GNOME ou KDE), onde o Steam e o modo Big Picture entram como aplicativos, não como "dono" da tela. É a versão para quem quer um PC útil no dia a dia, mas com todo o suporte de gaming já resolvido.

Cada família ainda se subdivide por ambiente gráfico e por GPU (AMD/Intel vs. hardware NVIDIA, que tem imagem própria por causa do driver proprietário):

```terminal
$ grep VARIANT_ID /etc/os-release
VARIANT_ID=bazzite-deck
$ rpm-ostree status --booted | grep -i 'image'
                   image: ghcr.io/ublue-os/bazzite-deck:stable
```

A string da imagem no `rpm-ostree status` denuncia exatamente qual variante está rodando. `bazzite-deck`, `bazzite-gnome`, `bazzite-kde`, `bazzite-nvidia` — cada uma é uma imagem OCI publicada no registro `ghcr.io/ublue-os`.

## O que vem embutido por padrão

A diferença entre baixar o Fedora e instalar o Steam manualmente versus usar o Bazzite está no que já chega pronto. A imagem de gaming já inclui:

- **Mesa e drivers AMD/Intel atualizados** — frequentemente mais novos que os do repositório estável do Fedora.
- **Steam, Lutris, Heroic e MangoHud** como Flatpaks pré-instalados ou a um `ujust` de distância.
- **Codecs multimídia** (H.264, HEVC, AAC) que a Valve e o Fedora precisam distribuir separadamente.
- **Utilitários de hardware** — controle de TDP, de ventoinha e de GPU nos portáteis.
- **Ajustes de kernel e de systemd** voltados a latência e a evitar o throttling em jogos.

```terminal
$ ujust --list | head -12
Available recipes:
    bazzite-arch              Setup Arch in Distrobox
    clean-system              Clean system package cache
    configure-grub             Configure GRUB
    distrobox-nvidia           Setup NVIDIA in Distrobox
    emudeck-setup              Install EmuDeck
    install-steam-proton       Install Steam and Proton
    setup-virtualization       Setup virtualization
```

Muita coisa exposta pelo Bazzite não é "um pacote", e sim um **recipe** do `ujust` — um atalho que executa vários passos em sequência. É uma distro pensada para ser conduzida, não só instalada.

## A sutil diferença em relação ao Fedora

Apesar de compartilhar os repositórios, o Bazzite diverge do Fedora em pontos que importam para quem joga. A lista do Universal Blue adiciona o repositório de updates de kernel e Mesa, o que significa que seu sistema recebe GPU e driver novos dias ou semanas antes do Fedora estável. Em troca, você assume um pouco mais de exposição a regressões — mitigada justamente pelo rollback atômico.

Outra divergência é de filosofia de empacotamento: o Fedora empurra Flatpak também, mas o Bazzite o adota de forma quase absoluta, mantendo a imagem base o mais enxuta possível e deixando aplicativos e emuladores no espaço de usuário.

```terminal
$ flatpak remote-list
Name        Options
flathub     system
fedora      system,filtered,oci
```

:::atencao
Não confunda "Bazzite é baseado no Fedora" com "posso instalar qualquer RPM do Fedora normalmente". Na variante imutável, pacotes de sistema entram por camadas (`rpm-ostree install`) e recriam um novo deploy. Aplicativos finais devem ser Flatpak, não RPM. Quebrar essa regra é a rota mais curta para um sistema bagunçado.
:::

## Por onde começar

O fluxo oficial é: escolher a imagem (deck vs. desktop, GNOME vs. KDE, AMD vs. NVIDIA), gravar o instalador, e deixar o instalador do Fedora (`Anaconda`) fazer o resto. O Bazzite não exige conhecimento de OSTree para ser instalado — mas entender a camada por baixo paga dividendos na hora de diagnosticar ou de fazer rollback, como a seção sobre camadas e rollback vai mostrar.

:::info
O Bazzite segue o modelo de **rebase**: trocar de uma variante para outra (ex.: de `bazzite-gnome` para `bazzite-deck`) costuma ser um único comando `rpm-ostree rebase` para a nova imagem, sem reinstalar. Essa flexibilidade é herança direta do OSTree e não existe no SteamOS.
:::

## Resumo

- Bazzite é uma imagem do Fedora Atomic especializada em gaming, mantida pelo projeto Universal Blue.
- Existem variantes `deck` (console, Gamescope na inicialização) e `desktop` (GNOME/KDE), além de imagens NVIDIA próprias.
- O sistema é imutável via OSTree; atualizações trocam o deploy inteiro e permitem rollback.
- A imagem embute drivers, codecs, Flatpaks de gaming e recipes `ujust`.
- O Bazzite atualiza kernel/Mesa mais rápido que o Fedora estável, assumindo um pouco mais de risco.
- O `rebase` entre variantes dispensa reinstalação, algo que o SteamOS não oferece.

## Exercícios

1. Rode `grep VARIANT_ID /etc/os-release` (ou `rpm-ostree status --booted`) e identifique qual variante do Bazzite está instalada. Descreva o que ela implica em termos de interface de inicialização.
2. Execute `ujust --list` (ou `ujust --choose`) e liste cinco recipes que você considera essenciais para o seu uso. Explique o que cada uma faz.
3. Compare a versão do Mesa instalada (`rpm-ostree db list | grep mesa | head`) com a versão estável atual do Fedora. Quem está na frente e por quê?
4. Em uma instalação `desktop`, verifique se o sistema inicia no desktop ou no Gamescope. Se quiser testar o modo console sem reinstalar, pesquise como alternar a sessão na tela de login.
5. **Desafio.** Pesquise o que é uma imagem OCI e como o `rpm-ostree rebase` aponta para outra imagem. Depois explique, em suas palavras, por que trocar de GNOME para KDE no Bazzite equivale a um rebase — e o que muda no deploy do OSTree.
