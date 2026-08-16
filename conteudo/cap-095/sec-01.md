O Steam Deck é um PC, mas a Valve escondeu isso bem: o Modo Jogo ocupa a tela inteira e o Game Mode é o que a maioria dos usuários jamais abandona. Só que o Modo Desktop está a um botão de distância, e com ele vem o Konsole — o emulador de terminal do KDE Plasma. Quem conhece o Konsole ganha acesso direto ao sistema de arquivos, aos logs e aos processos que nenhuma interface gráfica mostra com a mesma precisão. E, num sistema com root imutável como o SteamOS, o terminal é muitas vezes o único caminho para diagnósticos que a interface simplesmente não oferece.

:::objetivos
- Abrir e configurar o Konsole no ambiente Desktop do SteamOS
- Entender o papel do shell Bash como interpretador de comandos
- Diferenciar terminal gráfico, TTY virtual e sessão SSH
- Reconhecer o prompt e seus componentes informativos
- Conhecer o ciclo fundamental: prompt → comando → saída → novo prompt
:::

## Konsole: o terminal do KDE

O Konsole vem pré-instalado no SteamOS e é acessível pelo menu Iniciar do Modo Desktop, em System → Konsole, ou pelo atalho `[[Ctrl+Alt+T]]`. Ele é um emulador de terminal: uma janela gráfica que finge ser um terminal de texto dos anos 1980, com suporte a abas, perfis, esquemas de cores e transparência.

```terminal
$ echo $TERM
xterm-256color
$ echo $SHELL
/bin/bash
```

A variável `TERM` diz ao sistema que tipo de terminal está em uso — `xterm-256color` significa que o Konsole suporta 256 cores e os códigos de controle do xterm. A variável `SHELL` aponta para o programa que interpreta os comandos: no SteamOS, é o Bash.

:::dica
Abra o Konsole, clique com o botão direito e escolha **Edit Current Profile**. Na aba Appearance você troca a fonte e o esquema de cores. A fonte padrão do SteamOS é Hack 10pt — troque para algo maior se estiver usando a tela do Deck sem dock. Na aba Scrolling, ative **Unlimited scrollback** para não perder saídas longas.
:::

## O que acontece quando você digita um comando

O ciclo é sempre o mesmo e entender as quatro etapas elimina metade da confusão de quem está começando:

1. O shell imprime o **prompt** — uma linha que termina com `$` (usuário comum) ou `#` (root) e fica esperando.
2. Você digita um comando e aperta `[[Enter]]`.
3. O shell localiza o programa, executa e espera ele terminar.
4. O shell imprime um novo prompt — sinal universal de "pronto para o próximo".

```terminal
$ whoami
deck
$ date
Fri Feb 21 10:14:32 -03 2025
$ uname -r
6.8.0-valve3-1-neptune-64
```

Cada comando é um programa separado. `whoami` é um binário que está em `/usr/bin/whoami`; o Bash localiza esse caminho consultando a variável `PATH` que veremos na seção 6. Quando o programa termina, o shell volta a imprimir o prompt. Se algo travar, `[[Ctrl+C]]` interrompe o programa e devolve o prompt.

## Três formas de chegar ao shell

O Konsole é a mais confortável, mas não é a única. O SteamOS — como qualquer Linux — oferece três caminhos para o shell, e cada um resolve um problema diferente.

**TTY virtual.** Aperte `[[Ctrl+Alt+F3]]` e o Modo Desktop desaparece, substituído por uma tela preta com login por texto. É o agetty em ação: o kernel reserva seis terminais virtuais (F1 a F6, sendo que F1 e F2 costumam ser usados pelo ambiente gráfico) e cada um roda um processo de login independente. Se o Plasma travar e o Konsole não responder, os TTYs são a rota de fuga. Para voltar ao ambiente gráfico, `[[Ctrl+Alt+F1]]` ou `[[Ctrl+Alt+F2]]`.

**SSH.** Você pode habilitar o servidor SSH no SteamOS e acessar o shell remotamente de outro computador. Isso é particularmente útil para digitar comandos longos com teclado físico sem precisar de dock — o capítulo sobre SSH cobre essa configuração [ver a seção sobre acesso remoto](#/cap-088/sec-03).

**Konsole (ou qualquer emulador).** É o caso normal: um terminal gráfico dentro do ambiente Desktop, com abas, scroll, copy/paste e tudo que se espera de uma aplicação moderna.

:::info
No SteamOS 3.6, o shell padrão é o Bash 5.2. Em versões anteriores, era o Bash 5.1. Nenhuma diferença relevante para o uso diário — todos os comandos deste capítulo funcionam em qualquer Bash da série 5.x.
:::

## Lendo o prompt

O prompt padrão do Konsole no SteamOS mostra quatro informações antes do `$`:

```terminal
deck@steamdeck:~$
```

| Parte | Significado |
|---|---|
| `deck` | Nome do usuário logado |
| `@` | Separador visual |
| `steamdeck` | Nome da máquina (hostname) |
| `:` | Separador visual |
| `~` | Diretório atual (`~` é atalho para `/home/deck`) |
| `$` | Prompt de usuário comum |

Quando você navega para outro diretório, o caminho aparece no prompt em vez do `~`:

```terminal
deck@steamdeck:~$ cd /etc
deck@steamdeck:/etc$
```

Se o prompt mudar para `#`, você está como root — e isso significa que todo comando tem poder para modificar qualquer arquivo do sistema. Mais sobre isso na seção 7.

## Resumo

- O Konsole é o emulador de terminal do KDE Plasma, acessível por `[[Ctrl+Alt+T]]` no Modo Desktop.
- O shell Bash interpreta comandos, localiza os programas pelo `PATH` e imprime o prompt quando está pronto.
- Existem três caminhos para o shell: Konsole (gráfico), TTY virtual (`[[Ctrl+Alt+F3]]`) e SSH remoto.
- O prompt `deck@steamdeck:~$` informa usuário, máquina e diretório atual.
- `$` indica usuário comum; `#` indica root — e esse símbolo sozinho deve acender um alerta mental.

## Exercícios

1. Abra o Konsole e digite `echo $TERM`, `echo $SHELL` e `echo $HOME`. Explique o que cada valor significa.
2. Pressione `[[Ctrl+Alt+F3]]`, faça login com seu usuário e execute `whoami` e `tty`. Depois volte ao ambiente gráfico com `[[Ctrl+Alt+F2]]` e compare a saída de `tty` no Konsole com a do TTY3.
3. No Konsole, pressione `[[Ctrl+Shift+T]]` para abrir uma nova aba. Rode `date` em uma e `uptime` na outra. Feche as abas com `[[Ctrl+Shift+W]]`.
4. Identifique quantos TTYs estão ativos na sua máquina com `ls /dev/tty* | head -20` e `who`.
5. **Desafio.** Abra dois Konsole lado a lado. Em um, execute `sleep 60` e, enquanto ele bloqueia, tente digitar no outro. Por que o segundo continua funcionando? Em seguida, interrompa o `sleep` com `[[Ctrl+C]]` e explique o que aconteceu com o processo.