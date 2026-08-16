Se você programa, o Deck com dock é um PC de desenvolvimento razoável: CPU Zen 2 de 4 núcleos, 16 GB de RAM e SSD NVMe. O Visual Studio Code (sob a forma de VS Codium, a versão compilada sem telemetria da Microsoft) roda como flatpak com todas as extensões do marketplace aberto. Esta seção cobre editores de código no Deck, do leve Kate (que já está instalado) ao poderoso VS Codium, e inclui o Neovim para quem quer editar código direto do terminal.

:::objetivos
- Instalar e configurar o VS Codium como flatpak no SteamOS
- Conhecer o Kate como editor gráfico nativo do KDE com recursos de IDE
- Entender por que Neovim no Deck faz sentido para edições rápidas
- Configurar Git integrado aos editores e usar o terminal embutido
- Comparar os três editores e escolher o certo para cada tarefa
:::

## Kate: o editor que você já tem

O Kate (KDE Advanced Text Editor) vem instalado com o Plasma e não é um simples bloco de notas. Ele tem realce de sintaxe para mais de 300 linguagens, terminal integrado (`[[F4]]`), múltiplos cursores, sessões salvas (que restauram os arquivos abertos) e suporte a LSP (Language Server Protocol) via plugin.

Abra o Kate, vá em **Settings → Configure Kate → Plugins** e ative o **LSP Client**. Depois de ativado, o Kate detecta automaticamente servidores de linguagem instalados no sistema (Python, Rust, Bash, etc.) e fornece autocompletar e diagnósticos inline.

```terminal
$ kate ~/projetos/script.py &
```

O terminal integrado (`[[F4]]`) é um Konsole completo dentro da janela do editor. Você edita o script na metade superior e executa `python3 script.py` na metade inferior sem alternar janelas. Para desenvolvimento leve em Python, Bash ou HTML/CSS, o Kate é suficiente e não consome os ~400 MB de RAM que o VS Codium costuma ocupar com algumas extensões.

:::dica
O Kate salva automaticamente "sessões" — o conjunto de arquivos abertos. Se você desconectar o Deck do monitor (e ele voltar ao Gaming Mode), na próxima vez que abrir o Kate no desktop todos os arquivos reaparecem. O arquivo de sessão fica em `~/.local/share/kate/sessions/`.
:::

## VS Codium: o VS Code sem telemetria

O VS Codium é o Visual Studio Code compilado a partir do código-fonte aberto (`vscode`), sem a marca, a telemetria e o marketplace oficial da Microsoft. No lugar, ele usa o **open-vsx.org**, um marketplace comunitário com milhares de extensões — nem todas as do marketplace oficial estão lá, mas as principais (Python, Rust, Go, Docker, ESLint, Prettier) estão.

```terminal
$ flatpak install flathub com.vscodium.codium
Looking for matches…

 1) app/com.vscodium.codium/x86_64/stable

com.vscodium.codium permissions:
    ipc       network       x11       wayland
    dri       file access [1]

    [1] home

        ID                         Branch     Op       Remote      Download
 1. [✓] com.vscodium.codium        stable     i        flathub     < 99,8 MB
```

Depois de aberto, instale as extensões essenciais: abra o painel de extensões (`[[Ctrl+Shift+X]]`) e busque por "Python" (a extensão oficial da Microsoft está no Open VSX), "GitLens" e "Portuguese (Brazil) Language Pack" se quiser a interface em português.

O terminal integrado (`[[Ctrl+J]]`) é um bash completo dentro da sandbox do flatpak. Ele vê os mesmos arquivos que o editor — seu `~/.var/app/com.vscodium.codium/` é montado como `~`, então comandos como `git` e `python3` funcionam normalmente.

```terminal
## Dentro do terminal integrado do VS Codium:
$ python3 --version
Python 3.12.3
$ git status
On branch main
nothing to commit, working tree clean
$ which gcc
/usr/bin/gcc
```

:::info
O VS Codium via flatpak não acessa o sistema de pacotes do SteamOS (`apt`, `pip` do sistema). Para instalar pacotes Python, use `pip install --user` (que instala em `~/.local/lib/`) ou crie um ambiente virtual: `python3 -m venv ~/venvs/meu-projeto && source ~/venvs/meu-projeto/bin/activate`. Isso isola as dependências e não quebra nada no sistema base.
:::

## Git nos editores

Tanto o Kate quanto o VS Codium têm integração com Git. No VS Codium, a barra lateral esquerda mostra arquivos modificados (M), novos (U) e em conflito (C) com cores nos nomes. O Kate, via plugin **Git**, adiciona um painel que mostra o diff lateralmente.

O fluxo no Deck não difere de um notebook de desenvolvimento:

```terminal
$ git clone git@github.com:ana/meu-bot-discord.git ~/projetos/meu-bot
$ cd ~/projetos/meu-bot
$ code .    ## ou 'codium .' no VS Codium
```

Dentro do editor, o `[[Ctrl+Shift+G]]` abre o painel de source control. Dali você faz stage, commit e push sem tocar no terminal. Para operações mais complexas (rebase interativo, cherry-pick), o terminal integrado resolve com os comandos normais do Git.

## Neovim: para quando o terminal basta

Nem sempre você vai querer abrir o VS Codium. Se a tarefa é editar um arquivo de configuração, corrigir um `systemd` unit ou escrever um script curto, o Neovim no terminal do Deck é a ferramenta certa — e não custa RAM nenhuma além do próprio Konsole.

```terminal
## Neovim já está disponível nos repositórios do SteamOS (base Ubuntu Noble):
$ nvim --version | head -1
NVIM v0.10.1

## Instalar um gerenciador de plugins minimalista:
$ git clone --depth 1 https://github.com/folke/lazy.nvim.git \
    ~/.local/share/nvim/lazy/lazy.nvim
```

No Deck, o Neovim brilha especialmente em dois cenários: editar arquivos via SSH (você está no sofá, o Deck está no dock ligado ao monitor, e você precisa arrumar um `nginx.conf` no servidor) e editar arquivos do próprio SteamOS que exigem `sudo`. Neste último caso, abra o Konsole, `sudo nvim /etc/ssh/sshd_config` e edite — sem precisar de interface gráfica.

```terminal
## Edição remota via SSH:
$ ssh deck@steamdeck.local nvim ~/projetos/script.sh
```

:::atencao
Evite usar `sudo` com editores gráficos (Kate, VS Codium) para editar arquivos do sistema. O Flatpak isola o sistema de arquivos e o `sudo` dentro da sandbox não funciona como esperado. Para arquivos do sistema, use `sudo nvim` ou `sudo nano` no terminal nativo.
:::

## Qual editor para qual tarefa

| Tarefa | Editor recomendado |
|---|---|
| Script Python com várias dependências | VS Codium |
| Editar `.bashrc`, `.gitconfig`, `sshd_config` | Kate ou Neovim |
| Projeto web com HTML/CSS/JS | VS Codium |
| Anotação rápida enquanto joga | Kate (já está aberto no desktop) |
| Editar arquivo de sistema (`/etc/`) | Neovim via `sudo` no Konsole |
| Revisar um diff e commitar | VS Codium (Git integrado) |

## Resumo

- Kate (`kate`) é o editor nativo do KDE com LSP, terminal integrado (`[[F4]]`) e sessões persistentes; ideal para edição leve.
- VS Codium (`com.vscodium.codium`) é o VS Code sem telemetria, com marketplace open-vsx.org e terminal Git integrado.
- Neovim (`nvim`) resolve edições rápidas e arquivos de sistema que exigem `sudo`; é o editor do terminal.
- Todos os três coexistem; o Git funciona nos três (nativo no VS Codium, via plugin no Kate, via `:Git` no Neovim).
- Flatpaks isolam os editores; para acessar ferramentas do sistema (`gcc`, `python3`), use-as pelo terminal integrado ou pelo ambiente virtual.

## Exercícios

1. Abra o Kate, ative o plugin LSP Client e crie um arquivo `hello.py` com um erro de sintaxe proposital. O LSP apontou o erro?
2. Instale o VS Codium, instale a extensão Python e crie um ambiente virtual com `python3 -m venv` pelo terminal integrado. Rode um script simples.
3. Clone um repositório Git de exemplo (`git clone https://github.com/seu-usuario/algum-repo`) e abra a pasta no Kate e no VS Codium. Qual dos dois mostra o diff de modificações de forma mais clara?
4. Edite um arquivo do sistema com `sudo nvim /etc/hosts`, adicione uma linha e confirme com `cat /etc/hosts`. Depois remova a linha que adicionou.
5. **Desafio.** Configure o Neovim com `lazy.nvim`, instale o plugin `nvim-treesitter` e `telescope.nvim`. Abra um projeto Python e use o Telescope para buscar uma função pelo nome. Descreva a diferença de fluxo entre essa busca e o `[[Ctrl+P]]` do VS Codium.