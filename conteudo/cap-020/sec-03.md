O menu iniciar do Plasma tem nome próprio: **Kickoff**. É ele que abre quando você clica no ícone do menu no canto do painel, e é por ele que você dispara qualquer aplicativo instalado, seja um jogo, o navegador ou um terminal. No Steam Deck, o Kickoff ganha um papel especial: é a ponte entre o modo "console portátil" e o mundo de aplicativos desktop que você só encontra quando sai do Big Picture.

:::objetivos
- Navegar pelas categorias e pela busca do menu Kickoff
- Usar a busca do Kickoff como launcher para comandos e aplicativos
- Adicionar e remover itens de favoritos
- Editar entradas de aplicativos no menu
- Descobrir onde as entradas `.desktop` ficam gravadas no disco
:::

## O que o Kickoff mostra

O Kickoff tem quatro abas principais, cada uma com um papel claro:

- **Favoritos** — a lista de aplicativos que você fixou para acesso rápido.
- **Aplicativos** — a árvore de categorias (Gráficos, Internet, Jogos, Sistema e por aí vai) com todos os programas.
- **Lugares** — atalhos para pastas e dispositivos (Home, Documentos, Downloads, cartão SD montado).
- **Computador** — aplicativos de sistema e informações da máquina.

Há ainda a **busca**, no topo, que é a ferramenta mais rápida de todas: você digita parte do nome e o Kickoff filtra em tempo real, sem precisar navegar pela árvore. No teclado do deck, apertar `[[Meta]]` (a tecla com o logotipo) costuma abrir o menu com o foco já na busca.

A árvore de aplicativos não vem do nada: ela é construída a partir de arquivos `.desktop` espalhados pelo sistema e pelo diretório do usuário. Entender isso importa porque editar o menu, no fundo, é editar esses arquivos.

## Buscando e executando

A busca do Kickoff também entende mais do que nomes de aplicativo. Ela aceita comandos e até cálculos simples, dependendo da configuração dos buscadores ativos. Para ver os plugins de busca disponíveis:

```terminal
$ ls /usr/share/kservices5/searchproviders/ 2>/dev/null
```

Cada plugin ali dentro adiciona uma fonte à barra de busca (aplicativos, contatos, histórico, etc.). No SteamOS a busca principal é a de aplicativos, mas o comportamento exato pode variar conforme a versão.

Na prática, o fluxo essencial é:

```terminal
$ kstart5 konsole
```

O `kstart5` lança um aplicativo pelo nome de sua entrada, exatamente como o Kickoff faria ao clicar. É a maneira via terminal de reproduzir o que o menu faz, útil para testar se uma entrada de aplicativo está quebrada sem depender de cliques.

:::dica
Para abrir o Kickoff pelo teclado sem tirar a mão do deck: a tecla `[[Meta]]` abre e fecha o menu, e logo em seguida digitar o nome do app e apertar `[[Enter]]` executa. É a forma mais rápida de lançar o Konsole, o Firefox ou o Dolphin sem navegar por categorias.
:::

## Favoritos e fixação

Fixar um aplicativo significa colocá-lo na aba **Favoritos** (e, se você arrastar para o painel, criar um atalho persistente nele). Para fixar, clique com o botão direito sobre o app no Kickoff e escolha **Adicionar aos favoritos**. Para desafixar, o mesmo caminho com **Remover dos favoritos**.

Os favoritos também têm representação em arquivo. A lista fica guardada na configuração do próprio applet do Kickoff:

```terminal
$ grep -i "favorites" ~/.config/kickoffrc
```

Conforme você fixa e desafixa itens, esse arquivo é atualizado. Saber que os favoritos têm um arquivo por trás ajuda a perceber que "fixar" não instala nem desinstala nada — apenas registra uma preferência no seu perfil.

## Onde moram as entradas `.desktop`

Cada aplicativo do menu corresponde a um arquivo de texto com extensão `.desktop`. Os do sistema ficam em `/usr/share/applications`, e os do usuário em `~/.local/share/applications` — e os segundos têm precedência sobre os primeiros. Listar os do usuário revela os atalhos e entradas que você ou algum instalador criaram:

```terminal
$ ls ~/.local/share/applications/ | head -10
chrome-apps.desktop
org.kde.konsole.desktop
steam.desktop
```

Um arquivo `.desktop` típico se parece com isto:

```ini
[Desktop Entry]
Type=Application
Name=Meu Aplicativo
Exec=/caminho/para/programa
Icon=meu-icone
Categories=Utility;
Terminal=false
```

A chave `Exec` é a que realmente importa: é o comando executado quando você clica no ícone. A chave `Categories` diz em qual categoria do Kickoff a entrada aparece. Editar um `.desktop` na mão (com permissão de escrita) e depois recarregar o menu aplica a mudança sem reiniciar o Plasma.

:::atencao
Arquivos `.desktop` editados à mão precisam de permissão de execução para funcionarem corretamente como lançadores em alguns contextos (especialmente quando você quer clicá-los no Dolphin). Se um atalho que você criou não abre, rode `chmod +x ~/.local/share/applications/nome.desktop` e tente de novo.
:::

## Criando sua própria entrada de menu

Você pode criar um lançador próprio para qualquer script ou comando que use com frequência. O exemplo abaixo cria uma entrada que abre uma calculadora de terminal dentro de um Konsole:

```bash
cat > ~/.local/share/applications/minha-calc.desktop <<'EOF'
[Desktop Entry]
Type=Application
Name=Minha Calculadora
Comment=Abre o bc num terminal
Exec=konsole -e bc -l
Icon=accessories-calculator
Terminal=false
Categories=Utility;
EOF
```

Depois de criar o arquivo, a entrada aparece no Kickoff sob a categoria **Utilitários**. Se ela não aparecer na hora, recarregue o shell:

```terminal
$ chmod +x ~/.local/share/applications/minha-calc.desktop
$ kbuildsycoca5
```

O `kbuildsycoca5` reconstrói o cache interno de serviços e aplicativos do KDE (a "SyCoCa", *System Configuration Cache*). É o comando que faz o menu enxergar mudanças em `.desktop` sem reiniciar nada — e é uma das ferramentas de diagnóstico mais úteis quando um aplicativo recém-instalado "some" do menu.

## Resumo

- O Kickoff é a implementação do menu iniciar do Plasma, com abas de Favoritos, Aplicativos, Lugares e Computador.
- A busca do menu lança aplicativos por nome e funciona como launcher rápido; `[[Meta]]` abre com foco na busca.
- Fixar um app só grava uma preferência de favoritos; não instala nem remove nada.
- As entradas do menu são arquivos `.desktop` em `/usr/share/applications` e `~/.local/share/applications`.
- `kbuildsycoca5` reconstrói o cache de aplicativos e faz o Kickoff enxergar entradas novas sem reiniciar.

## Exercícios

1. Abra o Kickoff e liste as quatro abas, anotando um app de exemplo em cada uma delas.
2. Use a tecla `[[Meta]]` + digitação para abrir o Konsole apenas pelo teclado, sem tocar no mouse.
3. Fixe um aplicativo aos favoritos e inspecione a mudança em `~/.config/kickoffrc`.
4. Crie um `.desktop` próprio que lance um script ou comando, dê permissão de execução e recarregue com `kbuildsycoca5`.
5. **Desafio.** Crie duas entradas `.desktop` com o mesmo `Name=` mas em pastas diferentes (uma em `/usr/share/applications` e outra em `~/.local/share/applications`), recarregue o cache e explique qual delas o Kickoff exibe e por quê (dica: precedência).
