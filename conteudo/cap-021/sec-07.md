Poucas funcionalidades do Dolphin são tão úteis para um curso de terminal quanto o atalho `[[F4]]`. Com um único toque, a metade inferior da janela vira um Konsole, e o diretório de trabalho já é exatamente a pasta que você está vendo no painel gráfico. Essa integração elimina o vai-e-vem entre janelas e transforma o Dolphin num centro de operações para quem alterna entre GUI e linha de comando.

:::objetivos
- Abrir e fechar o terminal embutido com `[[F4]]`
- Compreender como o terminal embutido sincroniza o diretório com o painel ativo
- Configurar o terminal para usar o Konsole ou alternativas
- Executar comandos destrutivos com consciência visual da pasta
- Integrar o terminal com o split view para operações entre diretórios
:::

## O que acontece com F4

O `[[F4]]` é um toggle: pressiona, o terminal aparece; pressiona de novo, ele some. Internamente, o Dolphin embute um `konsolepart`, que é o componente reutilizável do Konsole empacotado como widget da KDE Frameworks. O que você vê é exatamente uma sessão de Konsole, com direito a abas dentro do terminal (`[[Ctrl+Shift+T]]`), cores, fonte configurável e o shell que você tem definido em `/etc/passwd`.

```terminal
$ dolphin ~/lab
## Pressione F4
## O terminal abre na metade inferior, já em ~/lab
$ pwd
/home/deck/lab
$ ls
arquivos que você vê no painel gráfico acima
```

A sincronização de diretório é o diferencial: quando você navega no painel gráfico (`[[Alt+↑]]`, `[[Ctrl+L]]`, clique numa pasta), o terminal embutido automaticamente segue com `cd`. E o contrário também funciona: se você executar `cd` no terminal, o painel gráfico acompanha — desde que a opção "Sincronizar diretório" esteja ativada.

```terminal
$ dolphin ~/lab
## F4 para abrir o terminal
## No terminal: cd ~/Downloads
## O painel gráfico muda para ~/Downloads automaticamente
## No painel gráfico: suba um nível com Alt+↑
## O terminal automaticamente executa cd ..
```

Essa sincronização bidirecional faz do Dolphin uma interface híbrida: você usa o gráfico para visão geral e o terminal para operações em lote, sem trocar de janela ou redigitar caminhos. É particularmente útil no Steam Deck, onde cada troca de contexto gráfico custa gestos no trackpad.

:::nota
A sincronização de diretório pode ser desabilitada nas configurações do terminal embutido (clique com botão direito na barra de título do terminal). Isso é útil quando você quer que o terminal fique fixo num caminho (por exemplo, `~/lab/build`) enquanto navega em outras pastas no painel gráfico para referência.
:::

## Configurando o terminal

O terminal embutido usa o Konsole por padrão, mas o Dolphin permite trocar por outro emulador. Nas configurações (hambúrguer no canto superior direito → Configurar → Configurar Dolphin → Terminal), você encontra o campo "Terminal externo".

```terminal
$ konsole --workdir ~/lab
## Abre o Konsole diretamente em ~/lab, sem Dolphin
## Equivalente a abrir o terminal embutido com F4 e fechar o Dolphin
```

Se você quiser usar outro terminal (como `alacritty` ou `kitty`), é só alterar esse campo. Mas para o terminal embutido no painel (aquele do `[[F4]]`), o Dolphin sempre usa o `konsolepart`, que não pode ser trocado — é um componente fixo do ecossistema KDE.

```terminal
$ dolphin ~/lab
## F4 abre o terminal embutido
## Ctrl+Shift+T dentro do terminal: nova aba no terminal embutido
## Cada aba do terminal pode estar num diretório diferente
## Ctrl+Shift+W fecha a aba atual do terminal
```

O terminal embutido suporta abas próprias, independentes das abas do Dolphin. Você pode ter, por exemplo, três abas do Dolphin, cada uma com seu `[[F4]]` aberto, e dentro de cada terminal duas abas de shell. É uma árvore de contextos, útil para multitarefa pesada.

## Operações híbridas: gráfico + terminal

O verdadeiro poder do `[[F4]]` aparece quando você combina navegação gráfica com comandos de shell. Alguns padrões comuns:

```terminal
$ dolphin --split ~/lab ~/backup
## F4: terminal embutido abre sincronizado com o painel ativo (esquerdo)
$ find . -name "*.log" -mtime +30 -delete
## O terminal executa no contexto do painel esquerdo (~/lab)
## O painel gráfico permite inspecionar visualmente se os arquivos sumiram
## Tab: muda foco para o painel direito (~/backup)
## O terminal automaticamente sincroniza para ~/backup
$ ls -la
```

Nesse fluxo, o split view mostra duas pastas lado a lado, e o terminal embutido acompanha o painel ativo. Você pode executar comandos destrutivos (como o `find -delete` acima) e verificar visualmente o resultado no painel gráfico logo acima, sem alternar janelas.

:::perigo
O terminal embutido é um shell real. Comandos como `rm -rf *`, `find -delete` ou `dd` executam com todos os poderes do seu usuário. A vantagem do Dolphin é que você **vê** a pasta onde está antes de executar — o painel gráfico funciona como uma confirmação visual do diretório de trabalho. Ainda assim, sempre leia o comando duas vezes antes do Enter.
:::

## Integração com o split view

Com split view ativo e terminal aberto, o foco dita a sincronização. Se o foco está no painel esquerdo do split, o terminal está no diretório do painel esquerdo; ao mover o foco para o direito (`[[Tab]]`), o terminal faz `cd` para o direito.

```terminal
$ dolphin --split ~/lab ~/Downloads
## F4: terminal no painel ativo
$ rsync -av --dry-run . ~/Downloads/
## Simula uma sincronização do painel esquerdo para o direito
## Remove --dry-run quando estiver satisfeito com a lista de arquivos
```

O `rsync` dentro do terminal, combinado com o split view, é um dos usos mais produtivos dessa integração: você vê origem e destino lado a lado no gráfico e controla a cópia no terminal, com todas as opções que o `rsync` oferece que o Dolphin não expõe (preservar permissões, excluir padrões, verificação de checksum).

## Resumo

- `[[F4]]` alterna o terminal embutido; ele abre sincronizado com o diretório do painel ativo do Dolphin.
- A sincronização é bidirecional: navegar no gráfico muda o diretório do terminal, e `cd` no terminal muda o painel gráfico.
- O terminal embutido usa o `konsolepart` da KDE Frameworks, com suporte a abas internas (`[[Ctrl+Shift+T]]`).
- Combinado com split view, o terminal permite executar operações como `rsync` entre duas pastas visíveis lado a lado.
- Comandos destrutivos são os mesmos de sempre, mas o painel gráfico fornece confirmação visual do contexto.

## Exercícios

1. Abra o Dolphin em `~/lab` e pressione `[[F4]]`. Execute `pwd`, `ls`, `touch teste-f4.txt` e confirme no painel gráfico que o arquivo aparece.
2. Com o terminal aberto, execute `cd ~/Downloads` e observe o painel gráfico mudar. Depois, no painel gráfico, navegue até `~/lab` e veja o terminal executar `cd` correspondente.
3. Abra split view com `[[F3]]`, coloque painéis em `~/lab` e `~/Downloads`, pressione `[[F4]]` e use `[[Tab]]` para alternar o foco. O terminal acompanha a mudança?
4. No terminal embutido, execute `rsync -av --dry-run ~/lab/ ~/Downloads/` e leia a lista de arquivos. Remova `--dry-run` para copiar de fato e confira no painel gráfico.
5. **Desafio.** Abra três abas no Dolphin: `~/lab`, `~/Downloads` e `~/.config`. Em cada aba, pressione `[[F4]]`. Em cada terminal, execute um comando diferente (`pwd`, `ls -la`, `find . -name "*.conf"`). Explique como as abas do terminal são independentes das abas do Dolphin.