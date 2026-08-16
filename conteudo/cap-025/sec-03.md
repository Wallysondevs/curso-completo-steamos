HDR (High Dynamic Range) é o recurso que mais gera falsas expectativas em monitores externos no SteamOS. Não basta o painel "dizer que tem HDR"; existe uma cadeia inteira — monitor, cabo, modo de cor e o próprio compositor — que precisa fechar para a imagem sair realmente melhor. Feita errada, a configuração entrega cores lavadas ou um brilho estourado.

No SteamOS 3.6, o suporte a HDR é gerenciado pelo KScreen através do protocolo **HDR10** nos modos de vídeo. Entender onde cada peça se encaixa evita o erro de culpar o deck por um problema que está no cabo ou no modo do monitor.

:::objetivos
- Entender o que HDR significa na prática e o que ele exige da cadeia completa
- Ler o suporte HDR de uma saída pelo `kscreen-doctor`
- Ver a EDID do monitor para confirmar as capacidades reais do painel
- Ativar e desativar HDR numa saída via linha de comando
- Diagnosticar por que o modo HDR não aparece ou sai com cores erradas
:::

## O que HDR exige de verdade

HDR não é "mais brilho". É uma combinação de três coisas: profundidade de cor maior (10 bits por canal em vez de 8), uma faixa de luminância mais ampla e metadados estáticos (HDR10) que dizem ao monitor como interpretar os tons. Um painel HDR de verdade precisa atingir pelo menos ~400 nits de pico e cobrir um espaço de cor amplo (como DCI-P3).

A frustração clássica: o monitor anuncia HDR, mas o jogo sai acinzentado. Isso costuma ser o modo SDR sendo esticado para a faixa HDR, ou o monitor num modo "HDR" genérico enquanto o sistema ainda envia SDR. A cadeia precisa estar **alinha nos dois lados**.

O KScreen expõe as capacidades de cor de cada saída:

```terminal
$ kscreen-doctor output.HDMI-A-1.color.rgbRange.full
Output: 2 HDMI-A-1
	RgbRange: full
$ kscreen-doctor output.HDMI-A-1.color
Output: 2 HDMI-A-1
	RgbRange: unknown
```

O `RgbRange` (faixa de níveis RGB) é a porta de entrada: `full` entrega 0–255, `limited` entrega 16–235, formato de TV. Quando o sistema manda `limited` e o monitor espera `full` (ou vice-versa), os pretos viram cinza e os brancos perdem detalhe — um dos "defeitos" mais comuns confundidos com problema de HDR.

## Lendo a EDID: a certidão de nascimento do monitor

Antes de brigar com o modo HDR, confirme o que o monitor **de fato** suporta. A EDID (Extended Display Identification Data) é um bloco de bytes que o painel entrega ao sistema no primeiro aperto de mão, descrevendo resoluções, taxas e recursos de cor.

No deck, cada monitor gera um nó em `/sys/class/drm/`:

```terminal
$ ls /sys/class/drm/
card0  card0-eDP-1  card0-HDMI-A-1  version
$ cat /sys/class/drm/card0-HDMI-A-1/edid | xxd | head -20
00000000: 00ff ffff ffff ff00 10ac 5e80 0101 0101  ..........^.....
00000010: 1e1e 0104 b535 1e78 3a75 c5a7 564f 9f28  .....5.x:u..VO.(
00000020: 0e50 54a5 4b00 d1c0 8180 9500 b300 a9c0  .PT.K...........
...
```

O `xxd` converte os bytes crus em hexadecimal. Os primeiros 8 bytes (`00 ff ff ff ff ff ff 00`) são o cabeçalho fixo de toda EDID válida. Decifrar isso à mão é tedioso, mas dá para extrair a informação essencial com `edid-decode`:

```terminal
$ sudo pacman -S edid-decode
$ edid-decode /sys/class/drm/card0-HDMI-A-1/edid | grep -E 'HDR|Display Product Name|Maximum|Bits'
```

:::nota
No SteamOS de fábrica (imutável), instalar pacotes novos via `pacman` afeta só a camada temporária e se perde na atualização. Para um exame pontual, prefira o `edid-decode` já disponível, ou leia o campo HDR diretamente com `kscreen-doctor` que abstrai a EDID para você.
:::

## Ativando e desativando HDR

O caminho do `kscreen-doctor` para HDR passa pelo namespace `color`:

```terminal
$ kscreen-doctor output.HDMI-A-1.wcg.enable
$ kscreen-doctor output.HDMI-A-1.hdr.enable
```

A separação entre `wcg` (Wide Color Gamut, gama de cor ampla) e `hdr` reflete a arquitetura real: dá para ter gama ampla sem HDR, e o HDR só faz sentido por cima de uma base de cor ampla. Habilitar um sem o outro produz os tons estranhos que todo mundo já viu.

A desativação é simétrica:

```terminal
$ kscreen-doctor output.HDMI-A-1.hdr.disable
$ kscreen-doctor output.HDMI-A-1.wcg.disable
```

Depois de qualquer mudança, o `kscreen-doctor -o` exibe o estado de cor da saída na linha de status, onde você confere se o HDR "pegou" ou se o sistema ignorou o pedido (o que acontece quando o link não suporta).

:::atencao
HDR ativo num link sem largura de banda suficiente reduz a taxa de atualização. Um monitor 4K que rodava a 60 Hz em SDR pode cair para 30 Hz ao habilitar HDR + 10 bits, porque os dois competem pelo mesmo orçamento de bits do HDMI. Se a fluidez importa mais que o brilho, priorize taxa sobre HDR.
:::

## Por que o HDR some (e o que checar primeiro)

O diagnóstico segue uma ordem de eliminação. Primeiro, o monitor: ele precisa estar com o modo HDR **ligado no menu OSD** e, idealmente, com o espaço de cor em "auto". Depois, o cabo e o dock: HDR 4K@60 exige HDMI 2.0/2.1 ou DisplayPort 1.4. Por fim, o sistema.

```terminal
$ journalctl -u kscreen
... kscreen.kded: requesting HDR output for HDMI-A-1
... kscreen.kded: HDR not supported by sink
```

O log do daemon costuma dizer exatamente em qual etapa a negociação falhou. Se a mensagem apontar `HDR not supported by sink`, o problema está do lado do monitor ou do link; se o modo simplesmente não aparece como opção, a EDID não está anunciando o recurso.

:::dica
No modo desktop, o Plasma expõe um seletor de HDR por monitor nas Configurações de Sistema → Tela e Monitor. O que você faz no terminal com `kscreen-doctor` é exatamente o que esse painel faz por baixo — saber o comando ajuda a automatizar a troca ao plugar na TV da sala.
:::

## Resumo

- HDR combina 10 bits de cor, faixa de luminância ampla e metadados HDR10; precisa da cadeia inteira alinhada.
- `RgbRange` (`full` vs `limited`) é a causa mais comum de pretos lavados, confundida com HDR.
- A EDID em `/sys/class/drm/card0-<saida>/edid` descreve as capacidades reais do monitor.
- `kscreen-doctor output.<id>.hdr.enable` e `.wcg.enable` ativam HDR e gama ampla pela linha de comando.
- HDR + 10 bits pode reduzir a taxa (4K@60 → 4K@30) quando o link não tem largura de banda.

## Exercícios

1. Rode `kscreen-doctor output.HDMI-A-1.color` e registre o `RgbRange` atual da sua saída externa.
2. Encontre a EDID do seu monitor com `ls /sys/class/drm/` e confirme que o cabeçalho começa com `00 ff ff ff ff ff ff 00`.
3. No menu OSD do monitor, localize o modo HDR e ligue-o. Depois rode `kscreen-doctor output.HDMI-A-1.hdr.enable` e confira o resultado no `-o`.
4. Gere um log com `journalctl -u kscreen` logo após conectar o monitor e procure por palavras como `HDR` ou `color`.
5. **Desafio.** Integre com a seção anterior: com o monitor 4K conectado, compare a taxa disponível em SDR e com HDR habilitado. Confirme no `kscreen-doctor output.HDMI-A-1.modes` se o `@60` sumiu quando o HDR foi ativado.
