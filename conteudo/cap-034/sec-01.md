O Steam Deck nasceu como um videogame portátil, mas por dentro ele é um PC Linux completo rodando SteamOS 3.6 (base Noble). Conecte um dock, um teclado, um mouse e um monitor externo, e o aparelho vira uma estação de trabalho leve e silenciosa — capaz de escrever documentos, organizar notas e até programar. Nesta primeira seção você vai entender o que significa transformar o Deck nesse modo e, principalmente, como instalar seus primeiros aplicativos de produtividade usando Flatpak, o sistema de pacotes que a Valve escolheu para o modo desktop.

:::objetivos
- Entender por que o SteamOS usa Flatpak e não o `apt` tradicional
- Ativar o modo desktop e o `devel` para liberar o acesso ao terminal
- Instalar um aplicativo gráfico com `flatpak install`
- Navegar entre os repositórios Flathub e os flatpaks instalados
- Preparar o Deck para servir de estação de trabalho leve
:::

## Por que Flatpak, e não apt

Quem vem do Ubuntu costuma esperar `sudo apt install` para tudo. No SteamOS a realidade é outra: o sistema raiz é imutável, protegido por uma atualização atômica que a Valve controla, e **não** foi feito para receber pacotes `.deb` avulsos que você mesmo instala. O caminho oficial, documentado pela Valve, é o **Flatpak** — um formato que empacota o aplicativo junto com todas as dependências dele, isolado do sistema base.

A consequência prática é boa: você pode instalar a versão mais recente do LibreOffice sem arriscar quebrar o SteamOS, e cada app roda num espaço próprio. A desvantagem é que você precisa se acostumar com um vocabulário novo. O comando central é `flatpak`, e o repositório de onde quase tudo vem é o **Flathub**.

Antes de qualquer instalação, confirme que o Flatpak está presente e que o Flathub está configurado como origem remota:

```terminal
$ flatpak --version
Flatpak 1.15.10
$ flatpak remotes
Name    Options
flathub system
```

A segunda linha lista as origens remotas (os "remotes"). No SteamOS 3.6, o `flathub` já costuma vir registrado como remoto do sistema. Se a sua lista vier vazia ou sem o `flathub`, adicione-o com `flatpak remote-add --if-not-exists flathub https://flathub.org/repo/flathub.flatpakrepo`.

## Ativando o modo desktop e abrindo o terminal

Para rodar esses comandos, você precisa sair do Gaming Mode. Segure o botão de energia e escolha **Switch to Desktop**, ou toque no ícone de energia no menu lateral. O SteamOS troca para o desktop KDE Plasma, com uma barra de tarefas embaixo e um menu de aplicativos no canto inferior esquerdo.

O terminal padrão é o **Konsole**. Antes de instalar flatpaks, você talvez precise habilitar o modo de desenvolvimento, que desbloqueia o acesso de escrita e o comando `sudo` (via `passwd`). Para usuários que vão apenas instalar flatpaks do Flathub, isso **não** é obrigatório — o flatpak de sistema não pede senha no SteamOS.

```terminal
$ flatpak install flathub org.libreoffice.LibreOffice
Looking for matches…
Remotes found with refs similar to ‘org.libreoffice.LibreOffice’:

   1) app/org.libreoffice.LibreOffice/x86_64/stable (flathub)
   2) app/org.libreoffice.LibreOffice.Locale/x86_64/stable (flathub)

Which do you want to use (0 to abort)? [0-2]: 1

org.libreoffice.LibreOffice permissions:
    ipc           network       fallback-x11       wayland
    x11           dri           file access [1]

    [1] home

        ID                             Branch          Op           Remote           Download
 1. [✓] org.libreoffice.LibreOffice      stable          i            flathub        < 361,8 MB

Proceed with these changes to the system installation? [Y/n]: Y
```

A saída resume o que será instalado antes de tocar qualquer coisa: o identificador do aplicativo (`org.libreoffice.LibreOffice`), o ramo (`stable`), a operação (`i` de *install*) e o tamanho do download. As permissões listadas — acesso à sua pasta `home`, à rede e ao backend gráfico — são exibidas de propósito, para você saber o que aquele app poderá enxergar.

:::dica
LibreOffice é um suíte grande e a primeira instalação baixa centenas de megabytes. Se o download estiver lento, rode `flatpak install` com o Deck conectado à energia e no Wi-Fi de 5 GHz; o processo continua em segundo plano se você fechar a janela.
:::

## Instalando uma suíte de produtividade de verdade

O LibreOffice é o coração deste capítulo inteiro. Ele reúne editor de texto (Writer), planilha (Calc), apresentação (Impress) e desenho vetorial (Draw) num único pacote. Os arquivos que você criar nele são compatíveis com o formato `.odt`/`.ods` nativo e, em boa medida, com os formatos `.docx` e `.xlsx` do Microsoft Office.

Depois de instalado, confirme que ele aparece tanto na lista de flatpaks quanto no menu de aplicativos:

```terminal
$ flatpak list | grep -i libreoffice
LibreOffice	org.libreoffice.LibreOffice	stable	system
$ flatpak info org.libreoffice.LibreOffice | head -12
LibreOffice - The LibreOffice productivity suite

          ID: org.libreoffice.LibreOffice
         Ref: app/org.libreoffice.LibreOffice/x86_64/stable
        Arch: x86_64
      Branch: stable
     Origin: flathub
Installation: system
    Installed: 2,1 GB
    Runtime: org.freedesktop.Platform/x86_64/24.08
```

Repare no campo **Runtime**. É ele que responde à pergunta "como um app de um distro diferente roda no meu SteamOS": o `org.freedesktop.Platform` é o ambiente básico que o Flathub fornece, e cada flatpak depende dele. Na primeira vez que você instala qualquer aplicativo, esse runtime comum é baixado junto — por isso a instalação seguinte costuma ser mais rápida.

:::info
O Linux roda o LibreOffice nos mesmos binários em qualquer distribuição: o que muda é apenas a embalagem. Um documento `.odt` criado no Deck abre idêntico num LibreOffice instalado via `apt` no Ubuntu 24.04, porque o programa por baixo é o mesmo.
:::

## O Deck conectado a um dock

A metade invisível da "estação de trabalho" é o hardware. Um dock USB-C (o oficial da Valve ou um genérico compatível) entrega ao Deck três coisas que o tornam produtivo: saída de vídeo HDMI/DisplayPort, portas USB para teclado e mouse, e energia que mantém a bateria carregando enquanto você trabalha. Um monitor externo em 1080p ou 1440p é mais do que suficiente para o KDE Plasma, que reconhece o display automaticamente.

No desktop, tudo que você configurar aqui — janelas abertas, aplicativos instalados, arquivos salvos em `~/` — permanece no disco e reaparece quando você voltar ao modo desktop. Só não esqueça: o Gaming Mode continua sendo o modo "primário" de boot, então o caminho natural é ligar no modo jogo e alternar para o desktop quando for trabalhar.

```terminal
$ echo $XDG_SESSION_TYPE
wayland
$ uname -m
x86_64
```

O primeiro comando confirma que o Plasma roda em **Wayland**, o protocolo gráfico moderno que o SteamOS usa por padrão. O segundo mostra a arquitetura `x86_64` — importante porque os flatpaks que você instalará são os de PC, não os de ARM. Ambos influenciam o que aparece de disponível no Flathub.

## Resumo

- SteamOS 3.6 é um Linux imutável que instala aplicativos de produtividade via Flatpak, não via `apt`.
- `flatpak remotes` lista as origens remotas; o Flathub costuma já estar configurado como `system`.
- `flatpak install flathub <id>` baixa o app junto com o runtime comum na primeira instalação.
- `flatpak list` e `flatpak info` mostram o que está instalado, o tamanho e as permissões de cada app.
- Com dock, teclado, mouse e monitor externo, o Deck vira uma estação de trabalho Linux completa.

## Exercícios

1. Rode `flatpak --version` e `flatpak remotes`. Confirme que o Flathub aparece e anote se ele está como `system` ou `user`.
2. Instale o LibreOffice com o comando completo e descreva, com suas palavras, o que significam os campos `Branch`, `Op` e `Download` da confirmação de instalação.
3. Use `flatpak info org.libreoffice.LibreOffice` para descobrir o nome do runtime e o tamanho instalado em disco. O valor em disco é maior ou menor que o do download? Por quê?
4. Abra o aplicativo instalado pelo menu do KDE e crie um documento `.odt` de teste. Feche e rode `flatpak list` de novo para confirmar a entrada.
5. **Desafio.** Sem instalar nada novo, liste os flatpaks do runtime comum com `flatpak list --runtime`. Identifique o `org.freedesktop.Platform` e explique por que ele provavelmente apareceu antes de qualquer aplicativo de produtividade.
