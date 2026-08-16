O modo desktop do Deck põe nas suas mãos um teclado, um trackpad e uma tela de 800p. É tudo que você precisa para escrever scripts, editar arquivos de configuração ou programar uma aplicação de verdade. Para quem quer código no Deck, o VS Codium é a escolha mais direta — é o Visual Studio Code sem os bits proprietários da Microsoft, distribuído como Flatpak oficial.

:::objetivos
- Instalar o VS Codium via Flathub e entender a diferença para o VS Code
- Navegar pela interface básica do editor no Deck
- Configurar o terminal integrado para acessar o sistema host
- Instalar extensões e sincronizar configurações entre máquinas
:::

## VS Codium × VS Code

O Visual Studio Code que a maioria das pessoas conhece é distribuído pela Microsoft com algumas partes de código fechado — telemetria, branding e um punhado de extensões proprietárias. O VS Codium é exatamente o mesmo editor, construído a partir do repositório `vscode` de código aberto, com os mesmos atalhos, extensões e temas, mas sem telemetria.

No Flathub, o App ID é `com.vscodium.codium`:

```terminal
$ flatpak install com.vscodium.codium
Looking for matches…
Found similar ref(s) for 'com.vscodium.codium' in remote 'flathub' (system).
Use this remote? [Y/n]: Y

        ID                                          Branch          Op           Remote           Download
 1. [✓] com.vscodium.codium                        stable          i            flathub         106,7 MB / 107,0 MB
 2. [✓] com.vscodium.codium.Locale                 stable          i            flathub           2,1 MB / 2,1 MB

Installation complete.
```

:::info
O marketplace de extensões do VS Codium usa um proxy de código aberto (`open-vsx.org`) em vez do marketplace da Microsoft. A esmagadora maioria das extensões está lá, mas algumas extensões da Microsoft (como a C# Dev Kit) não estão. Para o uso típico de edição no Deck — Python, Bash, Rust, HTML, CSS, JavaScript — o open-vsx cobre bem.
:::

Se você quiser conferir a origem do marketplace usado pelo seu VS Codium, abra a linha de comando integrada do próprio editor e rode:

```terminal
$ codium --list-extensions --show-versions
```

O comando lista as extensões já instaladas com suas versões. Para ver a URL do marketplace configurado, abra `~/.var/app/com.vscodium.codium/config/VSCodium/product.json` e procure o campo `extensionsGallery` — ele aponta para o `open-vsx.org`.

## Abrindo e explorando

Depois de instalado, o VS Codium aparece no menu Iniciar como "VSCodium". Para abrir uma pasta direto do terminal:

```terminal
$ flatpak run com.vscodium.codium ~/projetos/
$ flatpak run com.vscodium.codium --new-window ~/lab/
```

A segunda forma é útil quando você já tem uma janela aberta e quer forçar uma segunda instância.

## O terminal integrado e o sandbox

O VS Codium Flatpak tem um terminal integrado (`` [[Ctrl+`]] ``), mas ele roda dentro do sandbox. Isso significa que comandos como `steamos-readonly`, `pacman` e `systemctl` não estão disponíveis lá dentro — o sandbox não tem acesso à raiz do sistema.

Para "escapar" do sandbox e ter um terminal real do Deck, você pode instruir o VS Codium a usar um shell no host via `flatpak-spawn`:

```terminal
$ flatpak run --command=flatpak-spawn com.vscodium.codium --host bash
```

Mas o melhor é configurar o terminal integrado do VS Codium uma vez só: abra as configurações (`[[Ctrl+,]]`), procure por `terminal.integrated.defaultProfile.linux` e defina como `/usr/bin/flatpak-spawn --host bash`. Depois selecione esse perfil como padrão. Assim, cada `[[Ctrl+`]]` abrirá um terminal real do Deck, não do sandbox.

:::dica
Use as configurações acima com moderação. Para a maioria das tarefas (rodar `python`, `node`, `gcc`), o sandbox funciona bem e é mais seguro. O `flatpak-spawn --host` só é necessário para comandos de sistema como instalar pacotes ou gerenciar serviços.
:::

## Extensões que fazem sentido no Deck

Com a tela de 1280×800 pixels, o espaço vertical é precioso. Algumas extensões recomendadas:

| Extensão | Propósito |
|---|---|
| **Error Lens** | Mostra erros e avisos embutidos na linha, sem ocupar um painel |
| **Vim** | Movimentação por teclado, útil com o trackpad |
| **Python** | IntelliSense e debugging para scripts Python |
| **Prettier** | Formatação automática de código ao salvar |
| **Live Server** | Servidor de desenvolvimento local com reload |

Para instalar, vá no ícone de extensões (lado esquerdo, o quinto) e busque pelo nome. A instalação é a mesma do VS Code: um clique.

## Editando arquivos de configuração do sistema

Um dos usos mais práticos do VS Codium no Deck é editar arquivos `.conf`, `.ini` e `.desktop` — coisas que você precisa ajustar para customizar o sistema. Por causa do sandbox, o VS Codium Flatpak não vê `/etc` por padrão. Para editar um arquivo de sistema, lance-o com `flatpak-spawn`:

```terminal
$ flatpak-spawn --host com.vscodium.codium /etc/default/grub
```

Ou, se preferir, edite como root com o editor de texto embutido: copie o arquivo para uma pasta acessível, edite e copie de volta com permissões.

## Resumo

- VS Codium (`com.vscodium.codium`) é o VS Code sem telemetria, disponível como Flatpak oficial.
- O marketplace usa `open-vsx.org`; as principais extensões de código aberto estão lá.
- O terminal integrado roda no sandbox; para comandos de sistema, configure `flatpak-spawn --host bash` como perfil.
- Extensões como Error Lens e Vim ajudam a economizar o espaço vertical da tela de 800p.
- Para editar arquivos de sistema (`/etc`), use `flatpak-spawn --host` ou copie e edite numa pasta acessível.

## Exercícios

1. Instale o VS Codium e abra uma pasta sua (`~/lab`) pelo terminal.
2. Configure o terminal integrado com `flatpak-spawn --host bash` como perfil padrão. Execute `uname -r` e confira que ele mostra o kernel do Deck, não do sandbox.
3. Instale a extensão Error Lens pelo marketplace do open-vsx e abra um arquivo com um erro de sintaxe proposital. O erro aparece na própria linha?
4. Use a busca rápida (`[[Ctrl+P]]`) para abrir um arquivo pelo nome; depois use `[[Ctrl+Shift+P]]` para executar o comando "Preferences: Open Settings (JSON)".
5. **Desafio.** Crie um arquivo `.desktop` personalizado que lance o VS Codium com `flatpak-spawn --host` e publique-o em `~/.local/share/applications`. O ícone dele deve aparecer no menu Iniciar do KDE como "Codium (Host)".