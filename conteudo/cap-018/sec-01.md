Acessibilidade não é um apêndice em lugar nenhum do SteamOS: é uma categoria de primeira classe do **Modo Jogo**, acionável em poucos toques e sem sair da interface de console. Para muita gente, ligar narração, filtro de cor ou contraste alto é a diferença entre jogar e não jogar — e essas opções estão todas reunidas num único lugar, o menu de Acessibilidade. Saber onde ele mora e o que ele controla é o ponto de partida de todo este capítulo.

:::objetivos
- Localizar o menu de Acessibilidade dentro do Modo Jogo
- Distinguir os grupos de opções oferecidos (visão, audição, entrada)
- Ativar e desativar a acessibilidade rapidamente
- Entender como o SteamOS persiste essas escolhas em arquivos de configuração
- Reconhecer a relação entre Modo Jogo e o desktop KDE por trás dele
:::

## Onde o menu de Acessibilidade vive

No Modo Jogo, tudo gira em torno do botão Steam (ou do atalho de teclado equivalente). Ao pressionar `[[Steam]]`, você abre a **barra lateral** rápida. A partir dela, navegue até **Configurações → Acessibilidade**. É uma categoria no mesmo nível de Rede, Tela, Áudio e Armazenamento — o que já diz como o SteamOS trata o assunto.

Dentro do Modo Jogo, o menu de Acessibilidade é dividido em grupos temáticos, e cada grupo pode ser ativado ou desativado de forma independente:

- **Visão** — contraste alto, filtros de cor (daltonismo), escala de texto e tamanho de fonte da interface.
- **Audição** — narração (leitura de tela) e feedback sonoro de menus.
- **Entrada** — repetição de teclas, tempo de pressionamento, remapeamento e botões adaptativos.

O ponto importante é que essas categorias **não são exclusivas do modo desktop**. O SteamOS roda duas superfícies gráficas distintas — o compositor **gamescope**, que renderiza o Modo Jogo, e o ambiente KDE Plasma, que você vê ao acessar "Mudar para a Área de Trabalho". As configurações de acessibilidade do Modo Jogo vivem à parte das do desktop, e este capítulo vai deixar claro o que pertence a cada um.

## Configuração persistida em arquivos

Como boa parte do SteamOS, as escolhas de acessibilidade não são "mágica": elas terminam gravadas em arquivos de configuração do cliente Steam. O arquivo principal é o `config.vdf`, um formato *key/value* próprio da Valve que fica no diretório do usuário `deck`.

Para confirmar que uma opção foi de fato gravada, você pode inspecionar o arquivo a partir do terminal (não precisa do Modo Jogo aberto):

```terminal
$ grep -i accessibility ~/.local/share/Steam/config/config.vdf
"Accessibility"
{
	"SpeakTextInSteamUI"		"1"
	"SteamUIScale"		"1.25"
	"ColorBlindMode"		"2"
}
```

Cada linha mapeia uma chave para um valor. `SpeakTextInSteamUI` é a narração; `SteamUIScale` é o fator de escala da interface; `ColorBlindMode` guarda o filtro de daltonismo ativo (`0` = nenhum, `1` = protanopia, `2` = deuteranopia, `3` = tritanopia, aproximadamente). Entender esse mapeamento permite diagnosticar uma opção que "sumiu" depois de uma atualização, e é a base para os capítulos seguintes.

:::nota
O `config.vdf` não usa JSON nem YAML. Ele é um formato binário-ish de texto com indentação por tabulação, idêntico ao usado em `localconfig.vdf` (biblioteca) e `loginusers.vdf`. A Valve documenta a estrutura de forma parcial; na prática, editar à mão é arriscado, e a recomendação é sempre alterar pela interface.
:::

Para ver o bloco `Accessibility` inteiro, em vez de apenas as linhas casadas pelo `grep`, você pode exibir o trecho com contexto:

```terminal
$ grep -A 6 -i "Accessibility" ~/.local/share/Steam/config/config.vdf
"Accessibility"
{
	"SpeakTextInSteamUI"		"1"
	"SteamUIScale"			"1.25"
	"ColorBlindMode"		"2"
	"SteamUIHighContrast"		"0"
}
```

A flag `-A 6` imprime as seis linhas seguintes após cada ocorrência, revelando o bloco completo. Aqui você vê as quatro chaves mais relevantes do capítulo lado a lado — e o `SteamUIHighContrast` em `0` confirma que o alto contraste está desligado nesta amostra, mesmo com escala e daltonismo ativos.

## Acessibilidade no desktop versus no Modo Jogo

Quando você troca para a **Área de Trabalho**, entra no KDE Plasma, que tem seu próprio módulo de acessibilidade em **Configurações do Sistema → Acessibilidade**. As opções ali — como o leitor de tela **Orca** e os filtros de cor do KWin — são independentes das do Modo Jogo.

Um exemplo concreto: você pode ativar a narração do SteamOS no Modo Jogo, mas ela **não** vai narrar o navegador ou o gerenciador de arquivos no desktop. Para isso, precisa do Orca no Plasma. A recíproca é verdadeira: os filtros de cor que você liga no KWin não aparecem dentro do Modo Jogo, porque o gamescope não conversa com o KWin.

Essa separação é a fonte de uma das confusões mais comuns de quem chega ao Steam Deck, e por isso vale fixar desde já:

| Superfície | Compositor | Acessibilidade gerenciada por |
|---|---|---|
| Modo Jogo | gamescope | Menu de Acessibilidade do SteamOS |
| Área de Trabalho | KWin (KDE Plasma) | Configurações do Sistema → Acessibilidade |

## Conferindo a saúde da sessão

Além do arquivo de configuração, o `journalctl` registra o que o compositor gamescope faz ao subir. Se uma opção de acessibilidade depender do gamescope (como escala e filtros renderizados pelo compositor), o log da unidade `gamescope` mostra erros de inicialização:

```terminal
$ journalctl -u gamescope --no-pager | tail -8
gamescope[842]: vblank: using timerfd for frame pacing
gamescope[842]: wlserver: Running compositor on wayland display 'gamescope-0'
gamescope[842]: wlserver: [x11] xwayland started
gamescope[842]: drm: connector DP-1 connected
gamescope[842]: drm: HDMI output 2560x1440@60.00Hz
gamescope[842]: failed to acquire modeset for headless output
```

A linha sobre `wayland display` confirma que o compositor subiu. Se você ativar um filtro e ele não aparecer, o primeiro diagnóstico é olhar aqui para ver se o gamescope caiu ou se recusou o modo de saída. Veremos a fundo na seção sobre gamescope; aqui o essencial é saber que existe esse canal de diagnóstico.

---

:::dica
Para entrar rápido nas Configurações do Modo Jogo sem navegar pelos menus, pressione `[[Steam]]` e depois `[[Y]]`. O atalho pula direto para a tela de Configurações, e a partir dela a categoria Acessibilidade fica a dois toques. Isso vale tanto para o teclado quanto para o gamepad, onde o mapeamento é feito pelo Steam Input.
:::

## Por que se preocupar com isso agora

As seções seguintes vão detalhar cada grupo de opções. Mas a lição mais importante deste primeiro contato é arquitetural: a acessibilidade do SteamOS é **distribuída** entre o cliente Steam (Menu), o compositor (gamescope) e o desktop (KWin). Saber qual camada é responsável por qual opção evita que você procure uma configuração no lugar errado — e é o que separa quem usa o menu de quem realmente entende o deck.

## Resumo

- O menu de Acessibilidade fica em Configurações → Acessibilidade no Modo Jogo, acionável via `[[Steam]]`.
- Ele agrupa opções de visão, audição e entrada, cada uma ativável de forma independente.
- As escolhas são persistidas em `config.vdf`, com chaves como `SpeakTextInSteamUI` e `SteamUIScale`.
- O Modo Jogo (gamescope) e a Área de Trabalho (KWin) têm acessibilidade independente entre si.
- `journalctl -u gamescope` revela erros do compositor que podem afetar filtros e escala.

## Exercícios

1. No Modo Jogo, abra Configurações → Acessibilidade e liste os três grupos de opções que você encontra, descrevendo uma opção de cada.
2. Rode `grep -i accessibility ~/.local/share/Steam/config/config.vdf` e compare as chaves retornadas com o que está ligado na interface. Elas batem?
3. Altere uma opção de daltonismo pela interface e rode novamente o `grep` para ver qual valor de `ColorBlindMode` mudou.
4. Execute `journalctl -u gamescope --no-pager | tail -20` e identifique a linha que confirma que o compositor subiu corretamente.
5. **Desafio.** Ative uma opção de acessibilidade no desktop KDE (por exemplo, um filtro de cor) e depois verifique se ela aparece dentro do Modo Jogo. Explique, com base na arquitetura gamescope vs KWin, por que o resultado é o que é.
