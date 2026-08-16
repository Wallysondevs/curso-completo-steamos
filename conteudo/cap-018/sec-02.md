Para quem enxerga pouco ou nada, a interface toda se resume a uma voz que descreve o que está na tela. No SteamOS, esse recurso se chama **narração**, e ele não é um programa à parte que você instala: é uma opção embutida no Modo Jogo que lê menus, títulos de jogos e botões em voz alta. Entender como a narração é gerada por baixo — e como ela difere de um leitor de tela de desktop — é essencial para configurar e, quando necessário, diagnosticar o áudio.

:::objetivos
- Ativar a narração do SteamOS no Modo Jogo
- Compreender a diferença entre narração e leitor de tela (Orca)
- Rastrear a síntese de voz pelo subsistema de áudio do sistema
- Ajustar velocidade e volume da fala quando disponível
- Diagnosticar falhas de narração via log do serviço de síntese
:::

## Narração não é leitor de tela

Existe uma diferença de escopo que cria quase toda a confusão. Um **leitor de tela** completo, como o Orca do desktop Linux, intercepta o foco do sistema inteiro e descreve qualquer coisa que apareça — janelas, planilhas, páginas web. A **narração** do SteamOS é mais enxuta: ela foca na *interface do Steam em si*, lendo os itens por onde o cursor passa no Modo Jogo, na loja e na biblioteca.

Na prática, a narração do SteamOS usa um sintetizador de voz (*text-to-speech*, TTS) ligado ao cliente Steam. Por baixo, no Linux, essa síntese costuma passar pelo **speech-dispatcher**, o serviço que padroniza requisições de fala para vários sintetizadores (espeak-ng, pico, festival, etc.).

Você pode confirmar que o serviço existe e está ativo no sistema:

```terminal
$ systemctl status speech-dispatcher --no-pager
● speech-dispatcher.service - Speech-Dispatcher
     Loaded: loaded (/usr/lib/systemd/system/speech-dispatcher.service; disabled)
     Active: inactive (dead)
```

Repare no `inactive (dead)`: o serviço é *ativado sob demanda* (socket), não fica rodando à toa. Isso é normal e **não** significa que a narração está quebrada. Quando o cliente Steam pede uma fala, o sistema acorda o serviço na hora.

## Ativando e ajustando a narração

No Modo Jogo, a narração fica em **Configurações → Acessibilidade**, na categoria de audição. A chave que controla isso no arquivo de configuração é `SpeakTextInSteamUI`:

```terminal
$ grep -i "SpeakTextInSteamUI" ~/.local/share/Steam/config/config.vdf
"SpeakTextInSteamUI"		"1"
```

Valor `1` significa narração ligada; `0`, desligada. Ajustes finos de velocidade e tom, quando expostos pela versão do SteamOS, aparecem ao lado da chave principal. Caso sua versão não exiba controles de velocidade, a dica é usar o sintetizador padrão do sistema (geralmente `espeak-ng`), que aceita parâmetros de taxa.

Você pode testar a síntese de voz **fora** da interface para confirmar que o pipeline de áudio funciona, usando o utilitário de linha de comando do speech-dispatcher:

```terminal
$ spd-say "Acessibilidade ativada no Steam Deck"
$ spd-say -r 80 -p 50 "Texto mais lento e com tom mais grave"
```

A flag `-r` ajusta a taxa (palavras por minuto) e `-p` o tom (pitch). Se o `spd-say` emitir som, o caminho TTS → áudio está íntegro, e o problema (se houver) está na configuração específica do cliente Steam.

## Onde o áudio da narração entra

A fala gerada precisa chegar até o dispositivo de saída — o alto-falante do deck ou um fone Bluetooth. Como todo áudio no SteamOS, ela passa pelo **PipeWire**, o servidor de som moderno que substituiu o PulseAudio no sistema. Listar os devices ativos ajuda a confirmar por onde a voz sai:

```terminal
$ pactl list short sinks
0	alsa_output.pci-0000_04_00.6.analog-stereo	PipeWire	s16le 2ch 48000Hz	SUSPENDED
1	bluez_output.14_3F_A6_1C_00_9B.1	a2dp-sink	PipeWire	s16le 2ch 44100Hz	SUSPENDED
```

Cada linha é um *sink* (destino de áudio). Se a narração "não tem som" mas o jogo tem, o problema quase sempre é que o áudio do sistema está roteado para um sink errado, ou o volume do sink do sistema está zerado. Confirmar que existe um sink `alsa_output` ativo é o primeiro passo do diagnóstico.

:::atencao
A narração do Modo Jogo e o som do jogo usam **fluxos diferentes** no PipeWire. Não é raro o volume da fala estar baixo porque ele foi mapeado para um canal mono ou para o segundo sink. Em caso de "narração muda com o jogo falando normal", abra o mixer do desktop e procure um stream separado para a fala, em vez de mexer no volume geral.
:::

## Narração no desktop: o Orca

Se você precisa de leitura de tela na Área de Trabalho (KDE), a ferramenta certa é o Orca. Ele é um leitor de tela completo, integrado ao ambiente, e pode ser verificado e iniciado pelo terminal:

```terminal
$ which orca
/usr/bin/orca
$ orca --version
Orca 46.2
```

O Orca usa o mesmo `speech-dispatcher` por baixo, então a síntese já configurada para o Steam é reaproveitada. Mas atenção: ativar o Orca **não** liga a narração do Modo Jogo, e vice-versa. São frentes separadas que apenas compartilham o motor de voz.

:::info
O Orca nasceu do projeto GNOME e foi o leitor de tela que tornou o desktop Linux utilizável por pessoas cegas. No SteamOS, ele está disponível no ambiente KDE da Área de Trabalho, mas a Valve não o integra ao Modo Jogo — por isso a narração nativa foi criada como um recurso próprio e mais dirigido ao uso em console.
:::

## Diagnosticando a síntese

Quando a narração falha silenciosamente, o log do speech-dispatcher é o lugar onde a causa aparece. O serviço escreve mensagens que podem ser lidas pelo `journalctl`:

```terminal
$ journalctl -u speech-dispatcher --no-pager | tail -10
speech-dispatcher[1021]: speechd started with config file /etc/speech-dispatcher/speechd.conf
speech-dispatcher[1021]: Module espeak-ng loaded successfully
speech-dispatcher[1021]: ERROR: audio output module not available
speech-dispatcher[1021]: speechd exiting
```

A linha `audio output module not available` é o clássico: a síntese funcionou, mas não achou saída de áudio — normalmente porque o PipeWire não estava pronto ou o módulo de saída (`libao`, `pulse`) não foi encontrado. Nesse caso, reiniciar a sessão de áudio resolve.

## Resumo

- A narração do SteamOS lê a interface do Modo Jogo; um leitor de tela como o Orca faz o texto do desktop inteiro.
- A síntese de voz passa pelo `speech-dispatcher`, que fica `inactive` até ser requisitado.
- A chave `SpeakTextInSteamUI` em `config.vdf` liga e desliga a narração.
- O áudio da fala trafega pelo PipeWire e aparece como sink separado do som do jogo.
- `journalctl -u speech-dispatcher` mostra a causa de uma narração muda, como falta de módulo de saída.

## Exercícios

1. Ligue a narração no Modo Jogo e confirme a mudança em `config.vdf` com o `grep` da chave `SpeakTextInSteamUI`.
2. Rode `spd-say -r 60 "Teste de voz no Steam Deck"` e depois `spd-say -r 140 "agora mais rápido"`. Anote a faixa de velocidade que você considera confortável.
3. Liste os sinks de áudio com `pactl list short sinks` e identifique por qual deles a voz do teste anterior saiu.
4. Verifique se o Orca está instalado com `which orca` e a versão com `orca --version`. Descreva a diferença de escopo entre Orca e a narração do SteamOS.
5. **Desafio.** Force um cenário de falha: com a narração ligada, inspecione `journalctl -u speech-dispatcher` enquanto usa o Modo Jogo e explique cada linha relevante que aparecer, ligando-a ao pipeline TTS → PipeWire → speaker.
