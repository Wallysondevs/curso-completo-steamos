O botão Steam não é apenas um launcher — é uma tecla modificadora que, combinada com outros botões, dispara funções que não têm ícone visível na interface. Essas combinações formam a "camada zero" de atalhos do SteamOS: funcionam em qualquer lugar do Modo Jogo, inclusive dentro de jogos, e não dependem de configuração prévia. Decorar pelo menos as cinco principais muda a forma como você interage com o Deck.

:::objetivos
- Acionar captura de tela e gravação de clipe com combinações do botão Steam
- Abrir e fechar o teclado virtual em qualquer contexto
- Alternar entre janelas e forçar encerramento de jogo travado
- Ajustar brilho e volume sem abrir o Quick Access Menu
:::

## Tabela principal de combinações com Steam

A tabela abaixo cobre todas as combinações de fábrica que usam o botão Steam como modificador. Mantenha o Steam pressionado e aperte a tecla indicada.

| Combinação | Função |
|---|---|
| [[Steam]] + [[A]] | Confirma ação (equivalente ao Enter do teclado) |
| [[Steam]] + [[B]] | Força fechamento do jogo ativo (Alt+F4 virtual) |
| [[Steam]] + [[X]] | Abre/fecha o teclado virtual |
| [[Steam]] + [[Y]] | Alterna entre tela cheia e janela em jogos compatíveis |
| [[Steam]] + [[D-Pad Cima]] | Aumenta brilho da tela |
| [[Steam]] + [[D-Pad Baixo]] | Diminui brilho da tela |
| [[Steam]] + [[D-Pad Esquerda]] | Diminui volume |
| [[Steam]] + [[D-Pad Direita]] | Aumenta volume |
| [[Steam]] + [[L1]] | Alterna para a aba anterior |
| [[Steam]] + [[R1]] | Alterna para a próxima aba |
| [[Steam]] + [[L2]] | Scroll rápido para cima |
| [[Steam]] + [[R2]] | Scroll rápido para baixo |
| [[Steam]] + [[Analógico Esquerdo (clique)]] | Alterna entre Modo Jogo e área de trabalho (quando suportado) |
| [[Steam]] + [[Analógico Direito (clique)]] | Ativa/desativa modo mouse em jogos que requerem cursor |

:::nota
As combinações de brilho e D-Pad são processadas pelo firmware do controlador, não pelo sistema operacional. Funcionam mesmo se o SteamOS estiver com a interface travada — o microcontrolador embutido (EC) intercepta esses eventos antes que cheguem ao kernel.
:::

## Captura de tela e gravação de clipe

O SteamOS grava continuamente os últimos 120 segundos de gameplay em um buffer circular na RAM. Duas combinações transformam esse buffer em arquivos permanentes:

| Combinação | Resultado |
|---|---|
| [[Steam]] + [[R1]] | Captura de tela instantânea (salva em PNG) |
| [[Steam]] + [[R1 (segurar)]] | Abre menu de gravação com opções (clipe, replay, etc.) |

As capturas são salvas em `~/.local/share/Steam/userdata/<steamid>/screenshots/` e podem ser acessadas pelo Modo Desktop ou pela seção de mídia no perfil do Steam. A gravação de clipe consome cerca de 200 MB de RAM para o buffer — em jogos que usam praticamente toda a memória disponível, o Deck pode reduzir o buffer para 30 segundos automaticamente.

```terminal
$ ls -lh ~/.local/share/Steam/userdata/*/screenshots/ | head -8
total 24M
-rw-r--r-- 1 deck deck 2.3M Jan 12 18:45 20260112184523_1.png
-rw-r--r-- 1 deck deck 2.1M Jan 12 18:52 20260112185207_1.png
-rw-r--r-- 1 deck deck 2.8M Jan 12 19:03 20260112190315_1.png
-rw-r--r-- 1 deck deck 3.1M Jan 12 19:15 20260112191544_1.png
-rw-r--r-- 1 deck deck 1.9M Jan 12 19:22 20260112192230_1.png
-rw-r--r-- 1 deck deck 2.4M Jan 12 19:31 20260112193111_1.png
```

Cada screenshot ocupa entre 1,5 e 3,5 MB em resolução nativa (1280×800 no LCD, 1280×800 no OLED). O nome do arquivo é o timestamp ISO básico seguido de um número de sequência.

:::dica
Se você faz capturas frequentes, crie um atalho no Modo Desktop para `~/screenshots` apontando para o diretório real com `ln -s ~/.local/share/Steam/userdata/*/screenshots ~/screenshots`. Assim você acessa tudo sem decorar o caminho longo.
:::

## Teclado virtual e controle de janelas

O teclado virtual do SteamOS aparece como uma sobreposição (overlay) e funciona em qualquer lugar: Modo Jogo, Modo Desktop e até durante execução de jogos que pedem entrada de texto.

| Combinação | Efeito |
|---|---|
| [[Steam]] + [[X]] | Abre/fecha o teclado virtual |
| [[Steam]] + [[B (segurar por 2s)]] | Força encerramento do jogo ou aplicativo focado |
| [[Steam]] + [[Y]] | Alterna entre fullscreen e janela |

O teclado virtual tem dois modos: o modo touch (use os polegares nos dois lados da tela) e o modo trackpad (cada touchpad controla metade do teclado, como um Split Keyboard). A alternância entre eles é feita com um toque no ícone de engrenagem do próprio teclado, não por atalho físico.

```terminal
$ ps aux | grep -i steam_keyboard
deck      1782  0.3  1.2 1845632 98764 ?       Sl   18:30   0:04 /usr/lib/steam/steamwebhelper --type=keyboard
```

O teclado virtual é um processo separado do Steam principal, rodando como `steamwebhelper`. Se ele travar, você pode matá-lo e reiniciá-lo sem fechar o jogo ativo — basta apertar Steam + X duas vezes (fecha e reabre).

Para confirmar em tempo real quais combinações o firmware está repassando ao sistema, o jeito é observar o fluxo de eventos de teclado enquanto aperta as combinações com o botão Steam mantido:

```terminal
$ evtest /dev/input/event3 | grep -E 'KEY_|code' | head -8
Input device ID: bus 0x3 vendor 0x28de product 0x1205
Event type 1 (EV_KEY)
  code 2 (KEY_1)
  code 3 (KEY_2)
  code 16 (KEY_Q)
  code 25 (KEY_P)
  code 28 (KEY_ENTER)
  code 113 (KEY_MUTE)
```

Cada combinação com Steam acaba virando um evento de tecla (`KEY_*`) no nivel do kernel. Por isso é possível, no Modo Desktop, capturar `Steam + X` como se fosse uma tecla comum — útil para scripts de automação que reagem a esses atalhos sem depender da interface do Steam.

## Resumo

- Steam + X abre o teclado virtual em qualquer contexto, inclusive sobre jogos em execução.
- Steam + R1 captura tela; segurar R1 abre o menu de gravação de clipe com buffer de até 120 segundos.
- Steam + D-Pad ajusta brilho (cima/baixo) e volume (esquerda/direita) sem sair do jogo.
- Steam + B forçado por 2 segundos equivale a Alt+F4 e fecha o aplicativo focado.
- O teclado virtual é um processo independente; pode ser reiniciado com duplo Steam + X se travar.

## Exercícios

1. Durante um jogo qualquer, pressione Steam + R1 para capturar a tela. Depois localize o arquivo PNG em `~/.local/share/Steam/userdata/`. Qual o tamanho médio das suas capturas?
2. Com um jogo aberto, ajuste o brilho usando apenas Steam + D-Pad. Quantos níveis de brilho existem? O indicador na tela mostra um número ou uma barra?
3. Teste o teclado virtual em três contextos: no Modo Jogo (biblioteca), dentro de um jogo e no Modo Desktop. Em qual deles a abertura foi mais rápida?
4. Force o fechamento de um jogo com Steam + B (2 segundos). Compare o tempo de reação com abrir o menu Steam e selecionar "Sair do jogo".
5. **Desafio.** Abra dois jogos em sequência sem fechar o primeiro (use Alt+Tab via Steam + Y se disponível). O Deck permite dois jogos abertos simultaneamente? O que acontece com o áudio e o consumo de RAM? Monitore com `free -h` e `pactl list-sink-inputs` no Modo Desktop.