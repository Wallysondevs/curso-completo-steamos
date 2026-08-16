A primeira vez que o Modo Desktop abre, muita gente estranha: o Steam Deck de repente parece um notebook comum com tela de 7 polegadas. É o KDE Plasma em sua forma mais recente, adaptado pela Valve para o formato portátil e para o controle do Deck. Antes de sair clicando em tudo, vale entender os elementos que compõem essa tela e por que eles estão posicionados assim — isso evita a sensação de estar perdido nos primeiros minutos.

:::objetivos
- Identificar os elementos principais da área de trabalho do Plasma
- Entender o papel do painel, do menu e da bandeja do sistema
- Reconhecer as adaptações que a Valve fez para a tela pequena
- Navegar pelo menu de aplicativos com o controle
:::

## Uma área de trabalho como outra qualquer

O KDE Plasma é um dos ambientes de desktop mais usados do Linux, mantido pela comunidade KDE. A Valve o escolheu porque ele é leve o bastante para o Deck e altamente configurável. Ao abrir o Desktop pela primeira vez, você encontra três regiões básicas:

- A **área de trabalho** (o "fundo"), onde ficam ícones como o da pasta principal e o atalho de retorno ao Modo de Jogo.
- O **painel**, uma barra horizontal na parte inferior (por padrão), onde moram o botão de aplicativos, os apps abertos e a bandeja do sistema.
- A **bandeja do sistema** (*system tray*), no canto do painel, que concentra rede, volume, bateria, relógio e o atalho do Steam.

O conjunto é familiar a quem já usou Windows ou macOS, mas com o sabor próprio do KDE: ícones, cantos arredondados e menus que reagem ao toque ou ao cursor.

:::nota
O Steam Deck usa o KDE Plasma na versão que acompanha o SteamOS 3.6, construída sobre o Ubuntu 24.04 (Noble). Versões futuras do SteamOS podem trazer um Plasma mais novo, mas a organização geral — painel embaixo, menu à esquerda, bandeja à direita — se mantém estável.
:::

## O painel e o menu de aplicativos

O botão no canto inferior esquerdo, com o logotipo do Steam ou do KDE, abre o **menu de aplicativos**. É o equivalente ao Menu Iniciar: uma lista organizada por categorias, com uma barra de busca no topo. Nele você encontra tudo que já está instalado — navegadores, o gerenciador de arquivos Dolphin, o terminal Konsole, o Steam.

A navegação pode ser feita com o dedo (nos modelos de tela sensível ao toque) ou com os touchpads. Os touchpads movem o ponteiro do mouse; o gatilho direito (`[[R2]]`) funciona como clique do botão esquerdo, e o esquerdo (`[[L2]]`) como clique direito. O botão `[[Steam]]` combinado com o `[[X]]` abre o teclado virtual, assunto que ganha seção própria adiante.

```text
Touchpad direito move o cursor  →  R2 clica  →  menu de aplicativos  →  categoria  →  aplicativo
```

Para abrir um programa, basta tocar ou clicar sobre o nome. O KDE também responde ao **KRunner**, um lançador rápido ativado pela combinação `[[Alt+Espaço]]`, que abre uma caixa onde você digita o nome do aplicativo e aperta Enter:

```terminal
$ krunner
```

Digitar `krunner` no terminal apenas demonstra que ele também existe como processo individual. Na prática, você o chama pelo atalho, não pelo comando.

:::dica
Acostume-se desde já com `[[Alt+Espaço]]`: é a forma mais rápida de abrir qualquer coisa no Desktop sem desfilar pelos menus. Digite "konsole", "firefox" ou "ajustes" e pressione Enter — o Plasma encontra o aplicativo enquanto você digita.
:::

## Adaptações para o formato portátil

A Valve não instalou simplesmente um Plasma "de fábrica". Ela ajustou o ambiente para o Deck, e perceber esses ajustes ajuda a navegar:

- **Escala e fontes** maiores que o padrão de desktop, porque 7 polegadas pedem texto legível a meia distância.
- Atalhos de **energia e brilho** mapeados para os controles do Deck, não apenas para teclas de notebook.
- O **teclado virtual** integrado, acionado por `[[Steam+X]]`, essencial já que não há teclado físico.
- O atalho **"Retornar ao Modo de Jogo"** sempre presente, ligando as duas faces da máquina.

Essas escolhas revelam a filosofia da Valve: o Desktop é uma ferramenta de apoio, não o destino principal. Ele precisa ser rápido de alcançar e rápido de abandonar.

Há uma forma de conferir se o shell do Plasma está saudável. O comando `systemctl --user status plasma-plasmashell` inspeciona o serviço de usuário responsável pela área de trabalho:

```terminal
$ systemctl --user status plasma-plasmashell
● plasma-plasmashell.service - KDE Plasma Shell
     Loaded: loaded (/usr/lib/systemd/user/plasma-plasmashell.service; static)
     Active: active (running) since Mon 2025-03-10 14:02:11 -03; 22min ago
   Main PID: 1102 (plasmashell)
      Tasks: 14 (limit: 18921)
     Memory: 158.3M
        CPU: 4.821s
     CGroup: /user.slice/user-1000.slice/user@1000.service/plasma-plasmashell.service
             └─1102 /usr/bin/plasmashell
```

A linha `Active: active (running)` indica que o shell está no ar; o `Main PID` aponta para o processo `plasmashell`, o programa que desenha painel, menu e área de trabalho. Quando algo "some" da tela sem explicação, este é um bom lugar para começar a investigar.

## Primeiros passos sem pressa

Não há ordem obrigatória de exploração, mas um roteiro curto ajuda a fixar. Clique no menu de aplicativos e percorra as categorias; abra o gerenciador de arquivos Dolphin e veja a pasta `~/` (seu diretório pessoal, do usuário `deck`); abra o Konsole e digite um comando qualquer. Depois, retorne ao Modo Jogo e volte, para confirmar que nada se perdeu.

```terminal
$ whoami
deck
$ hostname
steamdeck
```

Essas duas perguntas inocentes confirmam a identidade da sessão: o usuário é `deck` e a máquina é `steamdeck`, exatamente como o restante do curso assume. Toda a configuração, seus arquivos e seus aplicativos, vive sob o usuário `deck`.

:::info
O usuário `deck` é o único que o SteamOS cria por padrão, e ele não tem senha definida para login gráfico — o Desktop entra direto. Para tarefas administrativas com `sudo`, o SteamOS 3.6 não pede senha por padrão, herança da filosofia "console". Não confunda isso com um sistema aberto: o modelo de atualização do sistema (imagens A/B somente-leitura) protege a raiz de modificações acidentais.
:::

## Resumo

- O Modo Desktop é o KDE Plasma adaptado pela Valve para a tela e os controles do Steam Deck.
- A tela se divide em área de trabalho, painel e bandeja do sistema.
- Os touchpads movem o cursor, e `[[R2]]`/`[[L2]]` equivalem aos cliques esquerdo e direito.
- `[[Alt+Espaço]]` abre o KRunner, o lançador rápido de aplicativos.
- `systemctl --user status plasma-plasmashell` mostra o estado do shell do Plasma.
- O usuário padrão é `deck` e o host é `steamdeck`, confirmados por `whoami` e `hostname`.

## Exercícios

1. Abra o menu de aplicativos e anote cinco aplicativos que você não conhecia, junto com a categoria em que aparecem.
2. Use `[[Alt+Espaço]]` para abrir o Konsole pelo KRunner, digitando o nome em vez de navegar pelos menus.
3. No Konsole, execute `whoami` e `hostname` e registre as duas respostas.
4. Execute `systemctl --user status plasma-plasmashell` e identifique, na saída, a linha que informa o estado e o PID.
5. **Desafio.** Percorra todas as categorias do menu de aplicativos e localize o gerenciador de energia do KDE. Depois, usando apenas os touchpads e gatilhos (sem tocar na tela), abra o Dolphin, navegue até `~/` e volte ao menu — cronometrando o percurso.
