O SteamOS tranca a interface do modo Gaming por padrão: nada de trocar cores, fontes ou layout — a Valve quer uma experiência visual única e estável para todos. Quem quer personalizar o Deck encontra no **CSS Loader** a porta de entrada: um plugin que injeta folhas de estilo CSS na interface do Steam em tempo de execução, sem tocar nos arquivos originais do sistema. Entender o que ele é e o que ele não é evita frustração mais tarde, quando um tema quebrar a navegação.

:::objetivos
- Entender o que o CSS Loader faz e onde ele se encaixa na interface do SteamOS
- Reconhecer por que a Valve não oferece temas nativos no modo Gaming
- Identificar os componentes que o CSS Loader manipula (biblioteca, teclado, sons)
- Distinguir tema visual de "skin" de teclado de pacote de áudio
- Saber os riscos de mexer na interface em cada atualização do SteamOS
:::

## Por que o Steam não tem temas nativos

O modo Gaming do SteamOS é, na prática, uma versão do cliente Steam rodando em tela cheia sobre um **webview** Chromium embutido. Toda a interface — menus, biblioteca, loja — é desenhada por HTML e CSS carregados de um diretório interno chamado `steamui`. A Valve escolheu manter esse CSS fechado e sem opção de tema, para garantir que a experiência seja idêntica em todos os Decks e que uma atualização da interface nunca quebre por causa de uma personalização do usuário.

O CSS Loader contorna isso de forma elegante: em vez de editar o CSS original, ele **injeta novas regras por cima** das existentes. O navegador aplica as regras conforme a especificidade e a ordem, então uma folha extra consegue sobrescrever cores, tamanhos e até ocultar elementos inteiros — tudo em memória, sem mexer em um byte dos arquivos da Valve. Quando você desativa o plugin, a interface volta ao estado original.

```terminal
$ ls -la ~/.local/share/Steam/steamui/
total 120
drwxr-xr-x  4 deck deck  4096 Aug 15 14:02 .
drwxr-xr-x 10 deck deck  4096 Aug 15 14:02 ..
drwxr-xr-x  2 deck deck  4096 Aug 15 14:02 css
drwxr-xr-x  2 deck deck  4096 Aug 15 14:02 fonts
-rw-r--r--  1 deck deck 32000 Aug 15 14:02 library.css
-rw-r--r--  1 deck deck 48000 Aug 15 14:02 styles.css
```

Repare que os arquivos `library.css` e `styles.css` pertencem ao usuário `deck` e guardam a data da instalação ou da última atualização do cliente. O CSS Loader nunca grava aqui: ele mantém os temas em um diretório próprio, fora do `steamui`.

## Onde o CSS Loader mora

O CSS Loader não é um programa isolado. Ele é um **plugin do Decky Loader**, que por sua vez é um carregador de plugins para o modo Gaming. A cadeia inteira roda como um serviço que acompanha a sessão do Steam e injeta as folhas de estilo quando a interface sobe.

A estrutura em disco segue um padrão previsível:

| Caminho | O que guarda |
|---|---|
| `~/homebrew/plugins/SDH-CssLoader/` | Código e configuração do próprio CSS Loader |
| `~/homebrew/themes/` | Temas instalados, um subdiretório por tema |
| `~/homebrew/sounds/` | Pacotes de áudio (Audio Loader) |
| `~/homebrew/settings/` | Configuração de cada plugin em JSON |

O diretório `~/homebrew/` é a raiz de tudo que o Decky instala. Conhecer esses caminhos é o primeiro passo para o diagnóstico nesta parte do curso, porque a maioria dos problemas de tema se resolve inspecionando o que existe (ou não existe) dentro deles.

```terminal
$ ls ~/homebrew/
plugins  sounds  themes  settings
$ ls ~/homebrew/themes/
Art Hero  Clean Gameview  Obsidian  Round
```

Cada pasta de tema contém um arquivo `theme.json` (o manifesto) e uma árvore de `.css`. Veremos a anatomia completa de um tema na [seção sobre criar seu próprio tema](#/cap-074/sec-07).

## Três coisas que o CSS Loader personaliza

O nome "CSS Loader" dá a ideia errada de que ele só muda cores. Na verdade ele agrupa três tipos de personalização que, juntas, transformam o Deck por completo:

- **Temas da biblioteca e interface** — mudam capas, o "hero" do jogo em destaque, fontes, cores e o layout da navegação. É o coração do plugin.
- **Skins do teclado virtual** — trocam o visual do teclado na tela, aquele usado para digitar com o trackpad e os gatilhos.
- **Pacotes de áudio** — substituem os sons de navegação (cliques, transições) por amostras customizadas.

Cada tipo vive em um lugar próprio e é ativado de forma independente. Um erro comum de quem começa é instalar "um tema" e esperar que ele mude o teclado _e_ os sons também — não muda. São subsistemas separados, embora o CSS Loader os apresente na mesma aba.

No disco, a separação é visível: cada tipo de personalização ganha (ou não) uma pasta própria sob a raiz do homebrew.

```terminal
$ ls ~/homebrew/
plugins  sounds  themes  settings
$ echo "temas:"; ls ~/homebrew/themes/ | wc -l
temas:
5
$ echo "pacotes de som:"; ls ~/homebrew/sounds/ | wc -l
pacotes de som:
2
```

O `themes/` guarda os temas de interface, o `sounds/` os pacotes de áudio, e o teclado é tratado como um tema com alvo próprio (que você verá na [seção do teclado virtual](#/cap-074/sec-05)). São pastas independentes justamente porque são personalizações independentes.

:::info
O CSS Loader moderno (mantido pela comunidade sob o projeto SDH — *Steam Deck Homebrew*) absorveu o papel de plugins antigos como o **Audio Loader**. Em instalações recentes, sons e teclado fazem parte do mesmo painel do CSS Loader, mas continuam gravados em diretórios separados dentro de `~/homebrew/`.
:::

## Os riscos reais de personalizar

Temas são, na essência, CSS aplicado sobre uma interface que muda a cada atualização do SteamOS. O risco não é quebrar o sistema (tema algum apaga arquivos do sistema), mas sim **quebrar a própria interface**: um selector que deixou de existir pode sumir com um botão, ou uma cor nova pode deixar o texto ilegível.

Quando o SteamOS atualiza o cliente, a Valve altera classes e IDs internos sem aviso. Um tema que funcionava na semana anterior pode, depois do update, fazer a tela ficar preta ou a biblioteca não abrir. A boa notícia: desativar o CSS Loader (ou iniciar no modo de segurança) restaura a interface, porque nada foi alterado nos arquivos originais.

:::atencao
Todo tema que roda na hierarquia da interface executa CSS, que é uma linguagem de estilos — mas o CSS Loader também suporta, em alguns temas, trechos de JavaScript via extensões. Instale temas **apenas** de repositórios que você confia (o repositório oficial do SDH). CSS de origem duvidosa pode, em tese, capturar o que você digita na interface do Steam.
:::

## Resumo

- O CSS Loader injeta folhas de estilo sobre a interface do Steam em tempo de execução, sem editar os arquivos da Valve.
- O modo Gaming é HTML/CSS renderizado em um webview Chromium interno; por isso não há temas nativos.
- O plugin é carregado pelo Decky Loader e vive sob `~/homebrew/`, dentro de `plugins`, `themes`, `sounds` e `settings`.
- Temas de interface, skins de teclado e pacotes de áudio são personalizações separadas.
- O risco real é a interface quebrar após atualização do SteamOS, não danos ao sistema; desativar o plugin sempre restaura tudo.

## Exercícios

1. Liste o conteúdo de `~/homebrew/` e descreva, em uma frase, o papel de cada subdiretório que encontrar.
2. Com `ls -la ~/.local/share/Steam/steamui/`, confirme que os arquivos de estilo originais continuam com a data da instalação — sinal de que o CSS Loader não os alterou.
3. Identifique, no diretório `~/homebrew/themes/`, quantos temas estão instalados e anote o nome de cada pasta.
4. Explique por que desativar o CSS Loader sempre restaura a interface, independentemente do tema que esteja quebrado.
5. **Desafio.** Relacione a estrutura de diretórios de `~/homebrew/` com o conceito de *separação entre dado e aplicação* que você já viu ao estudar o sistema de arquivos do SteamOS ([onde vivem os dados do Steam](#/cap-001/sec-02)). Por que manter temas fora do `steamui` original é uma decisão de arquitetura, e não um capricho?
