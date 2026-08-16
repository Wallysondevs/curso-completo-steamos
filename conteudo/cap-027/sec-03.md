Os atalhos padrão do KDE cobrem 90% das tarefas, mas o 10% restante é o que mais dói: aquela combinação específica que você usa o tempo todo e que não existe, ou que está numa tecla desconfortável para o seu jeito de usar o Deck. O Plasma resolve isso com um sistema de atalhos customizados que pode ser configurado por interface gráfica ou direto no arquivo de configuração.

:::objetivos
- Configurar atalhos customizados pelo painel gráfico do System Settings
- Criar e editar atalhos diretamente em `kglobalshortcutsrc` com `kwriteconfig6`
- Validar atalhos novos consultando o D-Bus
- Evitar conflitos de tecla entre aplicativos
:::

## Atalhos pelo painel gráfico

O caminho oficial para criar um atalho no KDE é o **System Settings**, o centro de configurações do Plasma. No SteamOS você abre o módulo de teclas com um comando direto, que já pula para a seção certa:

```terminal
$ systemsettings kcm_keys
```

O comando abre o módulo `kcm_keys` (KConfig Module de teclas) já na tela de atalhos. Lá você navega por categorias — Atalhos Globais, Atalhos de Aplicativo, Atalhos Customizados — e, clicando em qualquer linha, abre um diálogo onde escolhe a nova tecla apenas apertando-a. O Plasma detecta o pressionar e registra a combinação.

:::nota
O módulo `kcm_keys` é um "KCM", a unidade padrão de configuração do KDE. Praticamente toda tela do System Settings é um KCM, e quase todas podem ser abertas direto pela linha de comando no formato `systemsettings kcm_<nome>`. É mais rápido que clicar pelo menu inteiro.
:::

A limitação do painel gráfico é que, para atalhos **customizados** (ações novas, que executam um comando arbitrário), você precisa de alguns cliques a mais: a seção "Atalhos Customizados" permite criar um "Novo Comando" e associar uma tecla a qualquer linha de comando. É aí que o Deck vira uma central de produtividade.

## Atalhos customizados executando comandos

Atalhos customizados no KDE são, essencialmente, uma tecla que dispara um comando de shell. Você pode criar um para abrir o navegador, lançar um script, ou até alternar o TDP do Deck. O gerenciamento direto pelo arquivo é feito com `kwriteconfig6`, a ferramenta de linha de comando que escreve em arquivos de configuração do KDE:

```terminal
$ kwriteconfig6 --file kglobalshortcutsrc --group "custom" --key "abrir-navegador" "Ctrl+Alt+B,none,Abrir Navegador"
```

Aqui `--file` define o arquivo, `--group` cria a seção `[custom]`, `--key` define o nome do atalho e o último argumento é o valor triplo `padrão,atual,rótulo`. O `none` no campo "atual" significa que ainda não há tecla ativa — é o estado inicial antes de a pessoa escolher uma tecla de verdade.

:::atencao
Editar `kglobalshortcutsrc` à mão exige reiniciar o KWin ou a sessão para o Plasma reler o arquivo. Por isso, o fluxo recomendado é: criar o **comando customizado** pela interface (que já registra no arquivo), e só usar `kwriteconfig6` para ajustes pontuais, seguido de `kquitapp5 plasmashell && kstart5 plasmashell` para recarregar o shell.
:::

## Validando o que você criou

Depois de escrever um atalho, confirme que ele de fato entrou no arquivo:

```terminal
$ cat ~/.config/kglobalshortcutsrc | grep -A5 '\[custom\]'
[custom]
abrir-navegador=Ctrl+Alt+B,Ctrl+Alt+B,Abrir Navegador
```

Mas o que o arquivo guarda é a intenção — a tecla e o rótulo. O disparo do comando em si fica em outra camada: cada entrada de atalho customizado tem um arquivo `.desktop` correspondente em `~/.local/share/applications/` ou um script referenciado. É esse arquivo `.desktop` que carrega a linha `Exec=` com o comando a ser rodado.

```terminal
$ cat ~/.local/share/applications/abrir-navegador.desktop 2>/dev/null
[Desktop Entry]
Type=Application
Name=Abrir Navegador
Exec=/usr/bin/firefox
```

Para validar de ponta a ponta sem reiniciar nada, você pode invocar a ação pelo D-Bus e observar o efeito:

```terminal
$ qdbus org.kde.kglobalaccel /component/custom org.kde.kglobalaccel.Component.shortcutNames
abrir-navegador
```

Se o nome aparece na lista, o `kglobalaccel` já enxerga a entrada. A última prova é apertar a tecla e ver o comando executar.

## Evitando conflitos

O problema clássico de quem cria atalho é roubar uma tecla que outro aplicativo já usa. Quando há conflito, o `kglobalaccel` costuma alertar na interface, mas pela linha de comando você precisa detectar sozinho. O truque é procurar a tecla que pretende usar em todo o arquivo antes de registrá-la:

```terminal
$ grep -n 'Ctrl+Alt+B' ~/.config/kglobalshortcutsrc
```

Se o comando não retornar nada, a tecla está livre. Se retornar uma linha, descubra qual aplicativo a está usando antes de prosseguir — ou escolha outra combinação.

```terminal
$ grep -rn 'Ctrl+Alt+B' ~/.config/kglobalshortcutsrc ~/.local/share/applications/ 2>/dev/null | head
9:abrir-navegador=Ctrl+Alt+B,Ctrl+Alt+B,Abrir Navegador
```

:::dica
No Deck, prefira atalhos que usem a tecla **Steam** (o `Meta`) como modificador base, exatamente porque a Valve reservou pouca coisa ali no modo desktop. Combinações com `Meta` quase nunca conflitam com aplicativos, que ocupam os clássicos `Ctrl` e `Alt`.
:::

## Resumo

- `systemsettings kcm_keys` abre direto o módulo de atalhos do System Settings.
- Atalhos customizados são, na prática, uma tecla que dispara um comando de shell.
- `kwriteconfig6 --file kglobalshortcutsrc` escreve entradas de atalho direto no arquivo.
- O disparo do comando fica num arquivo `.desktop` com a linha `Exec=`.
- `qdbus ...shortcutNames` confirma se o `kglobalaccel` enxerga o atalho novo.
- Verifique a tecla com `grep` em todo o arquivo antes de registrá-la, para evitar conflitos.

## Exercícios

1. Abra `systemsettings kcm_keys` e navegue até a seção de Atalhos Customizados; observe as ações já existentes.
2. Crie um atalho que abre o navegador usando `kwriteconfig6` e confira com `cat` que a entrada apareceu em `[custom]`.
3. Verifique se a tecla que você escolheu está livre com `grep -n 'sua-tecla' ~/.config/kglobalshortcutsrc`.
4. Use `qdbus org.kde.kglobalaccel /component/custom org.kde.kglobalaccel.Component.shortcutNames` para confirmar que o `kglobalaccel` listou seu atalho.
5. **Desafio.** Associe seu atalho customizado a um script próprio (um `.sh` com `#!/bin/bash`), torne-o executável com `chmod +x`, e faça o acionamento rodar esse script em vez de um comando pronto.
