Se o Bazzite é um Fedora turbinado para virar portátil, o ChimeraOS é o oposto em espírito: um Arch Linux que simplifica tudo para virar um único aparelho — o console embaixo da TV. Ele quer ser tão invisível quanto um videogame de verdade: você liga, cai no jogo, e o "sistema operacional" fica em segundo plano. Entender essa filosofia e o papel central do Gamescope é o que permite julgar se ele serve ao seu caso.

:::objetivos
- Entender a proposta "appliance" do ChimeraOS e suas origens no Arch
- Reconhecer o Gamescope como compositor da sessão de jogo
- Diferenciar o ChimeraOS do SteamOS em estrutura de atualização
- Instalar e configurar o modo sessão de console
- Identificar as limitações e o público-alvo do projeto
:::

## Um Arch que finge ser videogame

O ChimeraOS é uma distribuição baseada em **Arch Linux**, mas com um objetivo inverso ao de quem monta um Arch manualmente. Aqui não há instalação peça a peça, não há escolha de ambiente gráfico, não há desktop de fábrica. O sistema nasce configurado para **uma** coisa: ligar direto na sessão de jogo. O desktop só existe se você fizer questão de instalá-lo depois.

Por trás, ele herda do Arch o modelo rolling release — pacotes sempre na versão mais recente, sem versões "estáveis" congeladas. Isso significa kernel, Mesa e drivers de ponta, que chegam antes do SteamOS. A contrapartida é que a atualização do Arch cobra vigilância: uma regressão pode chegar num dia qualquer, e o ChimeraOS mitiga isso com atualizações atômicas próprias e snapshots.

```terminal
$ cat /etc/os-release | grep -E '^(NAME|ID|BUILD_ID)'
NAME="ChimeraOS"
ID=chimeraos
BUILD_ID=rolling
```

O `ID=chimeraos` depois de anos de coexistência com o Arch é a assinatura de uma distro que foi além de "Arch com tema de game" e virou projeto próprio, com pacotes e imagens publicados no seu próprio ritmo.

## Gamescope como coração da experiência

Tudo no ChimeraOS orbita o **Gamescope**, o compositor Wayland da Valve. No Steam Deck ele desenha a interface; no ChimeraOS ele é o ambiente padrão — o processo que captura a tela, gerencia resolução, taxa de quadros, HDR e VRR, e hospeda o Steam Big Picture como "app" principal.

A sessão de jogo do ChimeraOS (`gamescope-session`) é um serviço de sistema que levanta o Gamescope no boot e inicia o Steam dentro dele. Não há login de usuário no meio do caminho — a experiência é a de um console de salão.

```terminal
$ systemctl status gamescope-session --no-pager | head -5
● gamescope-session.service - Gamescope session
     Loaded: loaded (/usr/lib/systemd/system/gamescope-session.service; enabled)
     Active: active (running) since Mon 2025-01-06 19:12:04 -03
```

O `enabled` no status do systemd revela que a sessão de jogo sobe sozinha no boot. É o equivalente funcional do "modo Gaming" do SteamOS, mas exposto como um serviço normal que você pode inspecionar, parar ou desabilitar.

## Estrutura e atualização

O ChimeraOS adota um modelo **atômico por cima do Arch**: o sistema vive numa árvore read-only atualizada em bloco, com snapshots para poder voltar atrás. Não é o OSTree do Bazzite nem o A/B do SteamOS, mas cumpre o mesmo papel — atualizações que não deixam o sistema num estado intermediário quebrado.

```terminal
$ sudo frzr-unlock
$ sudo pacman -Syu
:: Synchronizing package databases...
 core is up to date
 extra is up to date
:: Starting full system upgrade...
```

O `frzr` é a ferramenta de deploy do ChimeraOS — ela gerencia as imagens do sistema e o esquema de snapshots/rollback. O `frzr-unlock` desbloqueia temporariamente a raiz read-only quando você precisa fazer manutenção manual, e o `pacman` continua sendo o motor de atualização por dentro.

:::info
Diferente do Bazzite (que cultiva Flatpak como regra absoluta), o ChimeraOS casa o pacman do Arch com Flatpak de forma mais mista. Aplicativos de jogos e emuladores tendem a Flatpak, mas o sistema base é Arch puro sob o `frzr`. Quem já conhece Arch se sente em casa; quem não conhece, não precisa — a superfície é a sessão de jogo.
:::

## Instalando e configurando o console

A instalação do ChimeraOS é deliberadamente mínima: baixa a ISO, grava, e um instalador enxuto copia o sistema. Não há partição manual obrigatória nem escolha de desktop. O produto final já nasce como console:

```terminal
$ chimeraos-session-mode switch console
```

Depois de instalado, se você quiser acesso ao modo desktop (por exemplo, para navegar, instalar um launcher alternativo ou rodar um gerenciador de arquivos), o ChimeraOS permite alternar entre "console" e "desktop":

```terminal
$ chimeraos-session-mode switch desktop
Switching to desktop mode. Reboot to apply.
$ sudo reboot
```

A alternância é manual e exige reboot: o projeto evita manter os dois modos ativos ao mesmo tempo para conservar a simplicidade e o desempenho num aparelho de sala.

:::atencao
No modo console, não há gerenciador de janelas convencional nem atalho de teclado para "sair" do Steam — você está dentro do Gamescope. Para administrar o sistema, use um SSH de outro computador ou mude para o modo desktop. Não espere abrir um terminal gráfico no meio de uma partida.
:::

## Para quem é o ChimeraOS

O ChimeraOS brilha num cenário específico: um PC de sala, um mini-PC ou um handheld dedicado **apenas** a jogos, ligado a uma TV, sem pretensão de uso geral. É menos flexível que o Bazzite justamente porque não quer ser um desktop — quer ser um eletrodoméstico de jogar.

As limitações são o reverso dessa moeda. Hardware NVIDIA tem suporte mais incômodo (o foco é AMD/Intel, como no SteamOS). Periféricos fora do padrão de gamepad podem exigir configuração manual. E quem precisa alternar entre trabalho e jogo na mesma máquina provavelmente se sente mais bem servido pelo Bazzite desktop.

## Resumo

- ChimeraOS é um Arch Linux reorientado para funcionar como console de sala, não como desktop.
- O Gamescope (compositor Wayland da Valve) é o ambiente padrão, hospedando o Steam Big Picture.
- A sessão de jogo sobe via `gamescope-session.service`, enabled no boot.
- O modelo atômico usa `frzr` (deploy/snapshots) por cima do `pacman` do Arch.
- A troca console/desktop é manual (`chimeraos-session-mode switch`) e exige reboot.
- É ideal para aparelhos dedicados a jogos com GPU AMD/Intel; suporta menos o uso geral que o Bazzite.

## Exercícios

1. Em um ChimeraOS (ou pesquisando o manual), confirme com `systemctl status gamescope-session` se a sessão de jogo sobe no boot. O que significa o `enabled` nessa saída?
2. Liste os serviços habilitados com `systemctl list-unit-files --state=enabled` e identifique quais pertencem à experiência de console (gamescope, steam, etc.).
3. Alterne para o modo desktop com `chimeraos-session-mode switch desktop`, reinicie, e depois volte ao modo console. Descreva o que muda na inicialização.
4. Use `frzr-unlock` para liberar a raiz read-only temporariamente e rode `pacman -Syu`. Depois, verifique se o sistema ficou nos snapshots esperados.
5. **Desafio.** Configure acesso SSH no ChimeraOS e conecte-se de outro computador enquanto ele está no modo console. A partir da sessão remota, identifique com `ps` o processo do Gamescope e o do Steam — e diga quem é filho de quem.
