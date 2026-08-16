Este capítulo reuniu atalhos em seis frentes diferentes. Esta seção final consolida tudo numa única tabela de referência rápida — o material que você volta a consultar quando a memória falha. Aqui também há notas práticas sobre como imprimir, exportar e manter esses atalhos à mão no próprio Deck.

:::objetivos
- Consultar todos os atalhos do curso numa única tabela consolidada
- Reconhecer atalhos específicos do Modo Jogo, Desktop e Konsole
- Criar uma "cola" pessoal persistente no Deck
- Verificar arrancadas de boot e recovery sem consultar fontes externas
:::

## Tabela mestra — Modo Jogo

| Atalho | Ação |
|---|---|
| [[Steam]] | Abre/fecha menu Steam |
| [[... (Quick Access)]] | Abre/fecha QAM |
| [[Steam (segurar 2s)]] | Menu de energia (suspender/desligar/modo) |
| [[L1]] / [[R1]] | Aba anterior/próxima |
| [[L2]] / [[R2]] | Scroll rápido cima/baixo |
| [[Steam]] + [[X]] | Teclado virtual |
| [[Steam]] + [[B (2s)]] | Força fechamento do app focado |
| [[Steam]] + [[R1]] | Captura de tela |
| [[Steam]] + [[R1 (segurar)]] | Menu de gravação de clipe |
| [[Steam]] + [[D-Pad Cima/Baixo]] | Brilho +/− |
| [[Steam]] + [[D-Pad Esq/Dir]] | Volume −/+ |
| [[Steam]] + [[Y]] | Alterna fullscreen/janela |

## Tabela mestra — Modo Desktop e Konsole

| Atalho | Ação |
|---|---|
| [[Ctrl+Alt+T]] | Abre Konsole |
| [[Alt+F2]] | KRunner |
| [[Super]] | Menu de aplicativos |
| [[Alt+Tab]] | Alterna janelas |
| [[Super+Esq/Dir/Cima/Baixo]] | Encaixa/maximiza/restaura janela |
| [[Ctrl+F1]]–[[Ctrl+F4]] | Desktop virtual 1–4 |
| [[Ctrl+A]] / [[Ctrl+E]] | Início/fim da linha (Readline) |
| [[Ctrl+U]] / [[Ctrl+K]] | Apaga até início/fim da linha |
| [[Ctrl+R]] | Busca reversa no histórico |
| [[Ctrl+Shift+T/N/W]] | Nova aba/janela, fecha aba (Konsole) |
| [[Ctrl+Shift+C/V]] | Copiar/colar (Konsole) |
| [[F11]] | Tela cheia (Konsole) |

## Tabela mestra — Boot e recovery

| Combinação (com Deck desligado) | Resultado |
|---|---|
| **Volume −** + **Power** | Boot Manager |
| **Volume +** + **Power** | Setup UEFI/BIOS |
| **Volume −** + **`...`** + **Power** | Boot pelo recovery (USB) |
| **Power (12s)** | Reset do controlador embutido (EC) |
| **Power (3s)** | Menu de desligamento |

Essas três famílias — Modo Jogo, Desktop/Konsole e Boot — cobrem praticamente toda a operação do Deck sem mouse ou teclado. As duas primeiras dependem do SteamOS estar rodando; a terceira, de o aparelho estar desligado.

```terminal
$ systemctl get-default
graphical.target
$ systemctl list-units --type=target --all | grep -E 'gaming|graphical'
```

O SteamOS define o `graphical.target` como padrão, mas o Modo Jogo é um modo de sessão do `gamescope`, o compositor da Valve. Os atalhos "Modo Jogo" só funcionam enquanto a sessão `gamescope` está ativa — no Modo Desktop, o mesmo botão Steam abre o Steam como aplicativo, não o modo de jogo completo.

## Criando sua cola pessoal persistente

Para manter esses atalhos à mão, o melhor caminho é criar um arquivo de texto no Deck e abri-lo no modo Desktop quando precisar. Um script simples imprime a referência direto no terminal:

```bash
#!/usr/bin/env bash
# cola-atalhos.sh — imprime os atalhos essenciais no terminal
cat <<'EOF'
Modo Jogo:
  Steam+X        teclado virtual
  Steam+R1       screenshot / segurar = clipe
  Steam+D-pad    brilho (cima/baixo) volume (esq/dir)
  L1/R1          abas   |  L2/R2 scroll
Desktop:
  Ctrl+Alt+T     konsole |  Alt+F2 krunner |  Super menu
  Alt+Tab        janelas |  Super+setas encaixe
Boot (desligado):
  Vol- + PWR     boot manager |  Vol+ + PWR bios
EOF
```

Salve como `~/bin/cola-atalhos.sh`, torne executável com `chmod +x` e invoque pelo KRunner digitando `cola-atalhos`. É a forma mais rápida de "puxar a cola" quando estiver longe de um navegador.

```terminal
$ chmod +x ~/bin/cola-atalhos.sh
$ ~/bin/cola-atalhos.sh
Modo Jogo:
  Steam+X        teclado virtual
  ...
```

:::dica
Além do script, você pode fixar a referência como nota no Obsidian ou em qualquer app de notas que sincronize. O importante é que a "cola" esteja **a uma tecla de distância**, não enterrada em favoritos do navegador.
:::

:::nota
Esta tabela consolidada cobre os atalhos do SteamOS 3.6. A Valve costuma adicionar ou alterar combinações nas atualizações principais — a versão 3.7 trouxe captura de vídeo nativa, por exemplo. Consulte o changelog oficial em cada atualização para atalhos novos que ainda não estão documentados aqui.
:::

Para quem prefere manter a referência colada no próprio terminal, o ideal é colocar o script no `PATH` do shell. O SteamOS já inclui `~/bin` no `PATH` por padrão, mas é bom confirmar:

```terminal
$ echo $PATH | tr ':' '\n' | grep bin
/home/deck/bin
/usr/local/bin
/usr/bin
/bin
$ which cola-atalhos.sh
~/bin/cola-atalhos.sh
```

Com o script no `PATH`, o KRunner o encontra automaticamente quando você digita "cola-atalhos" — sem precisar do caminho completo. Isso funciona para qualquer script que você coloque em `~/bin`, transformando a pasta num lançador pessoal de comandos e referências.

## Resumo

- A tabela mestra do Modo Jogo cobre navegação, teclado virtual, captura e ajustes rápidos.
- A tabela do Desktop/Konsole reúne atalhos do Plasma, Readline e do emulador de terminal.
- A tabela de boot cobre Boot Manager, UEFI Setup e recovery, todas com o Deck desligado.
- Os atalhos do Modo Jogo dependem da sessão `gamescope`; no Desktop, o botão Steam abre o app Steam.
- Um script de "cola" em `~/bin` mantém a referência a um comando de distância via KRunner.

## Exercícios

1. Imprima a tabela mestra desta seção (copie num editor) e marque com caneta os atalhos que você usa diariamente. Quais você ainda não tinha decorado?
2. Crie o script `~/bin/cola-atalhos.sh` como mostrado e torne-o executável. Teste invocar pelo KRunner.
3. Reconsolide mentalmente as três famílias de atalhos e escreva, de memória, os 5 atalhos de cada família que você considera essenciais. Confira contra esta seção.
4. No Modo Jogo, execute em sequência: abra o teclado virtual, capture uma tela, ajuste o brilho e o volume usando apenas combinações com Steam. Cronometre o tempo total.
5. **Desafio.** Monte um documento único (Markdown ou texto) que combine esta tabela mestra com os atalhos do Steam Input que você personalizou nos capítulos anteriores. Versione-o num repositório Git e faça commit. Esse é o seu "manual de atalhos" pessoal e evolutivo.