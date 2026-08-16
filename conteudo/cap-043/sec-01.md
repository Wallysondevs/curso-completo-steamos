No Steam Deck, a Steam é a experiência central — mas limitar-se a ela significa ignorar décadas de jogos que vivem em outras lojas. A Valve sabe disso e incluiu um mecanismo simples para registrar qualquer executável como atalho da biblioteca. O processo começa no Modo Desktop e termina no Game Mode com o jogo aparecendo lado a lado com os títulos nativos da Steam.

:::objetivos
- Adicionar um executável qualquer como jogo não-Steam na biblioteca
- Entender como o Steam armazena os atalhos em arquivos `.desktop`
- Lançar jogos não-Steam por linha de comando com `steam steam://rungameid/`
- Localizar os arquivos de atalho no sistema de arquivos
- Diagnosticar por que um atalho não aparece ou não executa
:::

## O botão "Adicionar jogo não-Steam"

No Modo Desktop, abra a Steam e vá em **Jogos → Adicionar um jogo não-Steam à minha biblioteca**. Uma janela lista todos os executáveis com `.desktop` no sistema — o Steam vasculha `/usr/share/applications` e `~/.local/share/applications`. Marque o programa desejado e clique em **Adicionar programas selecionados**.

O que acontece por baixo dos panos é simples: a Steam cria um atalho no diretório `~/.steam/steam/userdata/` com um arquivo `shortcuts.vdf` que referencia o caminho do executável. Cada atalho ganha um `appid` negativo — a Steam usa números positivos para jogos nativos e negativos para atalhos manuais.

```terminal
$ ls ~/.steam/steam/userdata/*/config/
avatarcache/  localconfig.vdf  shortcuts.vdf  uisettings.json
$ file ~/.steam/steam/userdata/*/config/shortcuts.vdf
/home/deck/.steam/steam/userdata/12345678/config/shortcuts.vdf: ASCII text
```

O `shortcuts.vdf` é um arquivo no formato KeyValues da Valve — parece JSON mas não é. Cada entrada contém o nome do jogo, o executável, o diretório de trabalho e os parâmetros de lançamento.

:::dica
Se você tem muitos jogos para adicionar de uma vez, editar o `shortcuts.vdf` manualmente é arriscado. Prefira usar o Steam ROM Manager (SRM), que veremos na [seção 8 deste capítulo](#/cap-043/sec-08), ou adicione um de cada vez pela interface.
:::

## Entendendo o `steam://rungameid/`

Todo jogo na Steam — nativo ou não — recebe um identificador numérico. Jogos da loja usam o AppID oficial (ex.: `730` para CS:GO). Atalhos não-Steam recebem IDs negativos gerados sequencialmente. Para descobrir o ID do seu atalho, o jeito mais confiável é inspecionar o `shortcuts.vdf` ou usar a URL que a Steam gera ao criar um atalho na área de trabalho.

Com o ID em mãos, você pode lançar o jogo diretamente do terminal:

```terminal
$ steam -no-browser steam://rungameid/0
```

O ID `0` é especial: ele abre a janela principal da Steam. Para lançar um jogo específico:

```terminal
$ steam steam://rungameid/-1234567890
```

A flag `-no-browser` impede que a Steam abra o componente WebView embutido, economizando RAM. Útil para scripts e atalhos manuais.

:::info
No Steam Deck, o Game Mode traduz o lançamento do jogo para uma chamada interna similar ao protocolo `steam://`. Quando você pressiona "Jogar" no Game Mode, o compositor gamescope assume o controle da tela e o executável roda dentro do ambiente Steam, com overlay, controle de TDP e captura de tela funcionando normalmente — mesmo para jogos não-Steam.
:::

## Criando um atalho `.desktop` para o jogo

Arquivos `.desktop` são o padrão freedesktop.org para atalhos de aplicações no Linux. Eles vivem em `~/.local/share/applications/` (usuário) ou `/usr/share/applications/` (sistema). Criar um manualmente é útil quando você quer controle total sobre o ícone, os argumentos e o ambiente de execução.

```bash
[Desktop Entry]
Type=Application
Name=Stardew Valley (GOG)
Exec=/home/deck/Games/stardew-valley/start.sh
Icon=/home/deck/Games/stardew-valley/icon.png
Categories=Game;
```

Salve como `~/.local/share/applications/stardew-gog.desktop`. Depois de criado, o jogo aparece automaticamente na lista do Steam ao usar o diálogo "Adicionar jogo não-Steam".

```terminal
$ ls ~/.local/share/applications/
discord.desktop       heroic_gog_tw3.desktop
firefox.desktop       lutris_celeste.desktop
$ find ~/.local/share -name "*.desktop" | wc -l
12
```

A linha `Exec=` suporta variáveis de ambiente e parâmetros. Para jogos Wine/Proton, você pode apontar diretamente para um script que configura o prefixo e o runner antes de invocar o executável.

:::atencao
O Steam procura arquivos `.desktop` com `Categories` contendo `Game` ou `Application`. Se seu atalho não aparece na lista, verifique se a linha `Categories=` está presente e contém uma dessas palavras. Além disso, o Steam só reexamina os diretórios ao abrir o diálogo — se você criou o arquivo depois, feche e reabra a janela "Adicionar jogo não-Steam".
:::

## Ajustando opções de lançamento no Steam

Depois de adicionar o jogo, clique com o botão direito sobre ele na biblioteca e vá em **Propriedades**. Na aba **Geral**, você encontra:

- **Atalho** — nome que aparece na biblioteca
- **Destino** — caminho do executável
- **Iniciar em** — diretório de trabalho
- **Opções de inicialização** — argumentos extras passados ao executável

Para jogos que precisam de Proton forçado, vá na aba **Compatibilidade** e marque **Forçar o uso de uma ferramenta de compatibilidade específica**. Selecione a versão do Proton desejada (recomendo Proton Experimental ou GE-Proton para jogos fora da Steam).

```terminal
$ protontricks --list | head -5
Non-Steam shortcut: Stardew Valley (GOG) (1234567890)
Non-Steam shortcut: Celeste (Itch) (1234567891)
Steam AppID 730: Counter-Strike 2
Steam AppID 1085660: Destiny 2
Steam AppID 1172470: Apex Legends
```

O `protontricks` reconhece atalhos não-Steam pelo AppID negativo. Use esse ID para instalar dependências com `protontricks <id> <dll>` ou abrir o `winecfg` do prefixo.

## Resumo

- O Steam cria atalhos não-Steam gerando entradas no arquivo `shortcuts.vdf` em `~/.steam/steam/userdata/*/config/`
- Cada atalho recebe um AppID negativo; use `steam steam://rungameid/<id>` para lançar do terminal
- Arquivos `.desktop` em `~/.local/share/applications/` são detectados automaticamente pelo diálogo da Steam
- A aba Compatibilidade permite forçar Proton em qualquer atalho não-Steam
- `protontricks` lista e gerencia prefixos de atalhos não-Steam pelos seus AppIDs negativos

## Exercícios

1. Abra a Steam no Modo Desktop e adicione um programa qualquer como jogo não-Steam. Depois localize o `shortcuts.vdf` e confirme que uma nova entrada foi criada.
2. No terminal, execute `steam -no-browser steam://rungameid/0` e observe o que acontece. Explique por que o ID `0` é útil para scripts.
3. Crie um arquivo `.desktop` manual em `~/.local/share/applications/` para um script shell que imprime "Olá, Steam Deck!" e fecha. Adicione-o como jogo não-Steam e execute-o.
4. Use `find ~/.local/share -name "*.desktop"` para listar todos os atalhos do sistema. Quantos deles têm `Categories=Game`?
5. **Desafio.** Escolha um jogo GOG que você tenha instalado manualmente. Crie o `.desktop`, adicione à Steam, force Proton Experimental na aba Compatibilidade e execute-o. Use `protontricks <appid> winecfg` para confirmar que o prefixo foi criado corretamente.