Depois de oito seções de conceitos e configuração, esta seção é sobre a prática: como diagnosticar um controle que não responde, restaurar um layout que sumiu e escolher uma configuração ótima para os gêneros que mais sofrem no controle. O objetivo não é cobrir tudo, mas dar a você um método — uma sequência de perguntas e comandos que resolve 90% dos problemas de controle no deck.

:::objetivos
- Diagnosticar problemas de controle com `evtest` e os logs do Steam
- Restaurar configurações a partir de backups de `.vdf`
- Aplicar receitas de layout por gênero (FPS, RPG, estratégia)
- Montar uma rotina de verificação antes de assumir que o hardware quebrou
:::

## O método de diagnóstico em quatro passos

Quando um botão "não funciona", a causa pode estar no hardware, no driver, no mapeamento ou no jogo. A ordem de investigação importa, porque a maioria dos problemas está na camada de mapeamento, não no ferro. Siga:

1. **Teste o hardware cru.** Veja se o kernel enxerga a pressão.
2. **Confira o layout ativo.** O mapeamento está carregado e correto?
3. **Verifique o caminho Steam Input API vs XInput.** O jogo está recebendo as ações?
4. **Isole o jogo.** O mesmo botão funciona em outro título?

```terminal
$ sudo timeout 8 evtest /dev/input/event3 2>&1 | grep "EV_KEY\|EV_ABS" | head -20
Event: type 3 (EV_ABS), code 0 (ABS_X), value 1820
Event: type 3 (EV_ABS), code 1 (ABS_Y), value 970
Event: type 1 (EV_KEY), code 304 (BTN_SOUTH), value 1
Event: type 1 (EV_KEY), code 304 (BTN_SOUTH), value 0
Event: type 1 (EV_KEY), code 305 (BTN_EAST), value 1
Event: type 1 (EV_KEY), code 305 (BTN_EAST), value 0
```

Se o `evtest` mostra os eventos aparecendo quando você aperta o botão, o hardware e o driver estão íntegros. O problema, então, está quase certamente no mapeamento ou no jogo — não é hora de abrir o deck. O par `value 1` seguido de `value 0` é a assinatura de um pressionar-e-soltar saudável: se você aperta e só vê `value 1` sem nunca ver o `value 0`, o botão está "grudado" logicamente.

## Investigando o mapeamento e o caminho até o jogo

Se o hardware está bem, o próximo suspeito é o layout. O log de controle diz qual config foi carregada e por qual caminho o jogo recebe os comandos.

```terminal
$ grep -i "config loaded\|assigned\|slot\|error\|warn" ~/.local/share/Steam/logs/controller_ui.txt 2>/dev/null | tail -15
[Steam Input] Device "Steam Deck Controller" connected, slot 0
[Steam Input] Config loaded: 1172470 (official layout)
[Steam Input] Device assigned to XInput slot 0
[Steam Input] WARN: binding references missing localization
[Steam Input] WARN: action "Sprint" not found in game's action set
```

Duas linhas de `WARN` aqui são reveladoras e inofensivas na maioria dos casos. A primeira ("missing localization") indica que o layout usa um rótulo sem tradução — não afeta a função. A segunda é mais séria: o layout referencia uma ação chamada "Sprint" que o jogo não exporta no seu action set. Isso acontece quando você importa um layout de comunidade feito para outra versão do jogo, ou quando o jogo mudou a nomenclatura das ações numa atualização.

:::atencao
Erro de "action not found" é o motivo número um de um layout de comunidade "não funcionar" após uma atualização do jogo. A correção é reatribuir a ação manualmente pelo configurador — não há nada de errado com o controle nem com o seu deck.
:::

## Restaurando um layout a partir do backup

Se um layout sumiu (sincronização falhou, você deletou sem querer, formatou), o backup `.vdf` que você aprendeu a fazer na seção 02 entra em ação. A restauração é copiar o arquivo de volta e, se necessário, reiniciar o Steam para ele reler.

```terminal
$ ls ~/lab/layouts-backup/ 2>/dev/null
1172470_SteamControllerGamepad.vdf
730_SteamControllerGamepad.vdf
$ mkdir -p ~/.local/share/Steam/config/controller_configs/1172470
$ cp ~/lab/layouts-backup/1172470_SteamControllerGamepad.vdf \
     ~/.local/share/Steam/config/controller_configs/1172470/SteamControllerGamepad.vdf
$ pkill -x steam && steam -gamepadui 2>/dev/null &
[1] 5113
```

Repare no nome: no backup você renomeou para manter o AppID no começo (porque vários jogos têm arquivos com o mesmo nome `SteamControllerGamepad.vdf`). Ao restaurar, você devolve o nome canônico `SteamControllerGamepad.vdf` dentro da pasta do AppID correto. O `pkill -x steam` e o `steam -gamepadui` reiniciam o cliente no modo controle para forçar a releitura da configuração.

:::perigo
Antes de `pkill -x steam`, salve qualquer jogo aberto. Matar o processo do Steam derruba também jogos em execução e pode corromper saves que não gravaram. O `pkill` aqui é ilustrativo; na prática, feche o Steam pela interface sempre que possível.
:::

## Receitas rápidas por gênero

Configurações de partida que resolvem o essencial de cara:

- **FPS/tático:** touchpad direito como mouse (trackball off), gyro "on right touchpad touch" sensibilidade 2.0, gatilho `[[R2]]` com Soft Pull = mirar e Full Pull = atirar, grip `R4` = recarregar.
- **RPG/Mundo aberto:** radial menu no touchpad esquerdo para itens, grip `L4` = trocar set "A pé/Dirigindo", touchpad direito = mouse para navegar inventário.
- **Estratégia/RTS:** touchpad direito = mouse com trackball "Low", touchpad esquerdo = mouse region no minimapa, botões frontais = grupos de unidade (Ctrl+1..9 via chord).

```terminal
$ cat << 'EOF' > ~/lab/resumo-controles.txt
# Resumo de controles — Steam Deck (minha config)
# Gerado em: $(date +%Y-%m-%d)
FPS:
  - Giroscópio: on right touchpad touch, sens 2.0, smoothing 15%
  - R2: Soft Pull = mirar, Full Pull = atirar
RPG:
  - Touchpad esquerdo = radial menu 6 fatias
  - L4 = change_action_set (A pé / Dirigindo)
Estratégia:
  - Touchpad direito = mouse (trackball Low)
  - Touchpad esquerdo = mouse region (minimapa)
EOF
$ cat ~/lab/resumo-controles.txt
# Resumo de controles — Steam Deck (minha config)
# Gerado em: 2025-01-15
FPS:
  - Giroscópio: on right touchpad touch, sens 2.0, smoothing 15%
  - R2: Soft Pull = mirar, Full Pull = atirar
RPG:
  - Touchpad esquerdo = radial menu 6 fatias
  - L4 = change_action_set (A pé / Dirigindo)
Estratégia:
  - Touchpad direito = mouse (trackball Low)
  - Touchpad esquerdo = mouse region (minimapa)
```

Manter um arquivo de texto com o resumo das suas configurações é o antídoto para o "eu configurei isso há três meses e não lembro como". É barato, vive no `~/lab`, e pode ser versionado ou sincronizado para qualquer lugar. A string `$(date +%Y-%m-%d)` evita que você perca a noção de quando aquilo foi escrito.

## Resumo

- Diagnostique na ordem: hardware (`evtest`), mapeamento (logs), caminho Steam Input API/XInput, e depois isole o jogo.
- Se `evtest` mostra `value 1` e `value 0`, o hardware está íntegro; o problema está a montante.
- `WARN: action not found` indica layout desatualizado em relação ao jogo, não defeito de hardware.
- Restaurar um layout é copiar o `.vdf` de volta à pasta do AppID e reiniciar o Steam.
- Um resumo em texto das suas configurações evita retrabalho e perda de contexto.

## Exercícios

1. Com `sudo timeout 8 evtest /dev/input/event3`, aperte cada botão do deck e verifique se todos produzem pares `value 1`/`value 0`.
2. Rode `grep -i "warn\|error" ~/.local/share/Steam/logs/controller_ui.txt | tail -20` e classifique cada aviso como inofensivo ou relevante.
3. Faça um backup completo de `controller_configs` com `cp -r` para `~/lab/controller-backup-$(date +%Y%m%d)/` e confira o tamanho total com `du -sh`.
4. Aplique a receita de FPS (gyro on touch + R2 dual-stage) num jogo de tiro e registre sua taxa de acerto antes e depois de dez minutos de adaptação.
5. **Desafio.** Simule a perda de um layout: mova um `SteamControllerGamepad.vdf` para fora da pasta do AppID, reinicie o Steam, confirme que o jogo caiu no fallback, e então restaure o arquivo a partir do backup. Documente cada passo e o que o log mostra em cada fase.