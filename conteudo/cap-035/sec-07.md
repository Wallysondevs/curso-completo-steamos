Capturar o que aparece na tela é uma tarefa que todo mundo precisa em algum momento: documentar um bug, compartilhar uma conquista num jogo, ilustrar um tutorial ou salvar uma referência visual. O SteamOS já tem captura de tela embutida no modo Gaming (botão Steam + R1), mas no modo Desktop a ferramenta oficial é o Spectacle, o utilitário de captura do KDE. Ele é simples, rápido e tem recursos de anotação que o tornam ideal para criar material didático.

:::objetivos
- Instalar e usar o Spectacle para capturar tela, janela e região
- Entender os formatos de saída e onde as capturas são salvas
- Anotar capturas com setas, textos e realces
- Capturar a partir do terminal e automatizar capturas em sequência
:::

## Instalação e modos de captura

O Spectacle está no Flathub:

```terminal
$ flatpak install flathub org.kde.spectacle
Looking for matches…
org.kde.spectacle/x86_64/stable       24.08.1   flathub
Proceed with these changes to the system? [Y/n]: y
Installation complete.
```

Ao abrir, o Spectacle mostra a última captura (se houver) e uma barra de ferramentas com os modos de captura. São quatro:

| Modo | Atalho | O que captura |
|---|---|---|
| Tela cheia | `[[Ctrl+Shift+P]]` | A tela inteira (no Deck, 1280×800 ou a resolução do monitor externo) |
| Tela ativa | — | A tela do monitor atualmente em foco (útil com múltiplos monitores) |
| Janela | `[[Ctrl+Shift+J]]` | Uma janela específica, com borda e sombra |
| Região retangular | `[[Ctrl+Shift+R]]` | Uma área que você desenha com o mouse |

Para capturar uma região, selecione "Região retangular", clique e arraste sobre a área desejada e solte. A captura aparece imediatamente no Spectacle, pronta para salvar ou anotar.

:::dica
O Spectacle tem um temporizador embutido (de 0 a 60 segundos) para capturar menus que fecham ao perder o foco — como menus de contexto, dropdowns ou tooltips. Selecione o tempo desejado, clique em "Nova captura" e posicione o mouse sobre o menu antes do tempo acabar.
:::

## Onde as capturas vão parar

Depois de capturar, você salva manualmente (`[[Ctrl+S]]`) ou deixa o Spectacle salvar automaticamente. Por padrão, as capturas vão para a pasta `~/Pictures/Screenshots` (ou `~/Imagens/Capturas de tela`, dependendo do idioma do ambiente). O formato padrão é PNG.

```terminal
$ ls -lh ~/Pictures/Screenshots/
total 3.2M
-rw-r--r-- 1 deck deck 1.1M Mar 15 16:01 Screenshot_20250315_160131.png
-rw-r--r-- 1 deck deck 980K Mar 15 16:04 Screenshot_20250315_160422.png
-rw-r--r-- 1 deck deck 1.2M Mar 15 16:08 Screenshot_20250315_160830.png
```

O nome segue o padrão `Screenshot_AAAAMMDD_HHMMSS.png`, o que ordena as capturas cronologicamente. Você pode mudar a pasta de destino e o formato em Configurar → Salvar.

O PNG é ideal para capturas de interface (texto nítido, sem artefatos) e para documentação. Para capturas de fotografias ou paisagens, o JPEG reduz bastante o tamanho — mas perde nitidez em texto e linhas finas.

## Anotações: setas, textos e realces

O recurso que transforma o Spectacle de "print screen" em "ferramenta de documentação" é o editor de anotações embutido. Depois de capturar, clique em "Anotar" (ícone de lápis) para abrir a captura no editor:

- **Seta:** desenha uma seta apontando para um elemento da tela — essencial em tutoriais.
- **Realce (highlighter):** marca uma região com cor translúcida.
- **Desenho livre:** rabiscos e formas à mão.
- **Texto:** insere texto com fonte e cor configuráveis.
- **Desfoque (blur):** esconde informações sensíveis (senhas, dados pessoais) antes de compartilhar.
- **Recorte:** corta a imagem para focar numa área.

:::atencao
Antes de publicar ou compartilhar qualquer captura com dados pessoais — senhas, e-mails, números de cartão, tokens de API — use o desfoque do Spectacle para ocultá-los. Uma captura de terminal pode conter informações que você não quer expor, como caminhos de arquivos ou nomes de usuário.
:::

## Capturas via terminal e automação

O Spectacle também pode ser controlado pela linha de comando, o que permite automatizar capturas em scripts. Os comandos essenciais:

```terminal
$ spectacle -b -n -o captura.png
$ spectacle -r -n -o regiao.png
$ spectacle -f -n -o tela-cheia.png
```

- `-b` captura a área retangular (abre o seletor de região);
- `-r` captura a região ativa (sem seletor);
- `-f` captura a tela cheia;
- `-n` ("no notify") suprime a notificação;
- `-o arquivo.png` define o destino do arquivo.

Com isso, você pode criar um script que tira várias capturas em sequência com intervalos fixos:

```bash
#!/bin/bash
# Captura a tela a cada 5 segundos, 6 vezes
for i in $(seq 1 6); do
    spectacle -f -n -o "captura-$(date +%H%M%S).png"
    sleep 5
done
```

Esse tipo de captura programada é útil para documentar um processo que acontece sozinho (uma instalação, um boot, uma animação) sem ficar apertando botões.

:::nota
O modo Gaming do SteamOS usa um sistema de captura próprio: `[[Steam+R1]]` salva a captura do jogo na pasta da sua biblioteca Steam, no formato JPEG, com a opção de fazer upload para a nuvem Steam. O Spectacle atende ao modo Desktop; os dois convivem sem conflito — cada um salva em seu lugar.
:::

## Resumo

- O Spectacle captura tela cheia, janela, tela ativa ou região retangular, com atalhos de teclado.
- As capturas são salvas como PNG em `~/Pictures/Screenshots`, com nome em ordem cronológica.
- O editor de anotações oferece setas, texto, realce, desfoque e recorte para documentação e privacidade.
- Via terminal, `spectacle -f -n -o arquivo.png` captura sem interação e permite automação em scripts.
- O modo Gaming usa `[[Steam+R1]]` para capturar jogos; o Spectacle cuida do modo Desktop.

## Exercícios

1. Instale o Spectacle e capture: (a) a tela cheia, (b) uma janela específica e (c) uma região retangular. Verifique a pasta `~/Pictures/Screenshots` com `ls -lh`.
2. Capture uma região e use o editor de anotações para adicionar uma seta apontando para um botão e um texto explicativo. Salve e confira o resultado.
3. Use o desfoque (blur) para ocultar uma informação sensível numa captura. Dentro do editor, selecione a ferramenta e arraste sobre a área a esconder.
4. Capture uma tela cheia via terminal com `spectacle -f -n -o teste.png`. Compare o arquivo com uma captura feita pela interface: são idênticos em tamanho e qualidade?
5. **Desafio.** Escreva um script que capture a tela a cada 3 segundos, 10 vezes, salvando com nomes numerados. Use-o para documentar o processo de abertura de um aplicativo com animação de carga. Depois, junte as capturas num vídeo com o Kdenlive (seção 6) como um "time-lapse" da interface.