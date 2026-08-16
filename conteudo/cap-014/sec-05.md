O Steam Deck tem um giroscópio de seis eixos embutido, capaz de medir rotação e aceleração a centenas de vezes por segundo. Usá-lo como mouse — técnica que a comunidade chama de **gyro aiming** — é o segundo maior diferencial do deck em relação a um controle comum, atrás apenas dos touchpads. Bem configurado, o gyro permite correções de mira que rivalizam com um mouse de mesa.

:::objetivos
- Entender como o giroscópio gera eventos de rotação que o Steam Input traduz em movimento de mouse
- Configurar o gyro com ativação condicional (on touch, on press, always on)
- Ajustar sensibilidade, suavização (smoothing) e composição com o analógico/touchpad
- Verificar a calibração do giroscópio nos logs do Steam
:::

## Um mouse que você move com os pulsos

O giroscópio mede velocidade angular — quantos graus por segundo o deck está girando em cada eixo. O Steam Input pega essa velocidade, multiplica pela sensibilidade configurada, e converte em movimento de mouse. Diferente de um analógico, que move o cursor a uma taxa fixa, o giroscópio move o cursor proporcionalmente à rotação física: gire rápido, cursor anda rápido; gire devagar, cursor anda devagar.

Isso resolve um problema fundamental dos analógicos: num FPS, com analógico você escolhe entre sensibilidade baixa (mira precisa, mas você não consegue virar rápido) e sensibilidade alta (você vira rápido, mas não acerta nada). Com o giroscópio, o analógico cuida dos giros amplos e o gyro cuida das correções finas. É a mesma divisão de trabalho que jogadores de mouse fazem entre braço (movimentos grandes) e pulso (ajustes finos).

```terminal
$ grep -i "gyro\|IMU\|angular\|rotation" ~/.local/share/Steam/logs/controller_ui.txt 2>/dev/null | tail -10
[Steam Input] Gyro sensor initialized (BMI160)
[Steam Input] Gyro calibrated, drift 0.0012 rad/s
[Steam Input] Gyro enabled as mouse
[Steam Input] Gyro sensitivity set: 2.40
[Steam Input] Gyro activation: on right touchpad touch
```

O chip `BMI160` que aparece no log é o sensor inercial (IMU) fabricado pela Bosch que o deck usa. O valor `drift 0.0012 rad/s` indica o desvio que a calibração detectou quando o deck está parado — é esse valor que o firmware subtrai das leituras brutas para que o cursor não "ande sozinho".

## Modos de ativação do giroscópio

Giroscópio ligado o tempo todo é cansativo: qualquer tremor da mão mexe o cursor. Por isso o Steam Input oferece três estratégias de ativação:

- **On Touch:** O gyro só age enquanto um dedo está tocando o touchpad direito (ou o analógico direito, conforme configurado). É o padrão recomendado para FPS — você descansa o polegar e a mira congela.
- **On Press:** O gyro só age enquanto um botão está pressionado (por exemplo `[[L2]]`, o gatilho de mira). Funciona bem quando o jogo já tem um botão de "mirar com a arma".
- **Always On:** O gyro fica ativo permanentemente. Exige um botão de "desligar gyro" (gyro off) para momentos de navegação em menu.

```terminal
$ cat ~/.local/share/Steam/config/controller_configs/730/SteamControllerGamepad.vdf 2>/dev/null | grep -A 10 -i "gyro"
"gyro"
{
    "mode"              "mouse"
    "activation"        "touch_right_pad"
    "sensitivity"       "2.40"
    "smoothing"         "15"
    "accel"             "off"
    "vertical_scale"    "0.70"
    "gyro_button"       "none"
}
```

Amostra real de um arquivo de configuração de CS2 (AppID 730). Os campos principais: `mode` (`mouse` é o mais comum; existe `joystick` para jogos que não aceitam mouse+controle ao mesmo tempo), `activation` (`touch_right_pad`), `sensitivity` (`2.40` — valores entre 1.5 e 3.0 são típicos para FPS), `smoothing` (valor em percentual; 15% suaviza sem introduzir latência perceptível) e `vertical_scale` (`0.70` — reduz a sensibilidade vertical, uma preferência comum para manter a mira no plano horizontal).

## Suavização e composição

Dois parâmetros menos óbvios fazem diferença:

- **Smoothing (suavização):** Aplica uma média móvel sobre as leituras do gyro. Com smoothing 0%, o cursor reage ao menor tremor da mão; com 30%+, a mira fica estável mas há um atraso perceptível. O ponto ideal costuma estar entre 10% e 20%.
- **Gyro + analógico/touchpad composto:** Quando ambos estão ativos ao mesmo tempo, o Steam Input soma os movimentos. Isso significa que você pode mirar com o analógico enquanto corrige com o gyro, e o jogo recebe uma posição combinada. A mágica é que o jogo não precisa saber que isso está acontecendo — ele só vê o mouse se mexendo.

```terminal
$ cat << 'EOF'
Configuração típica de FPS no deck:
  Analógico direito: sensibilidade alta (~3.0), para viradas
  Gyro (on touch):   sensibilidade ~2.4, smoothing 15%
  Vertical scale:    0.70
  Trigger L2:        gyro off (enquanto mira por software)
EOF
```

:::atencao
Alguns jogos não aceitam mouse e controle ao mesmo tempo — se o gyro estiver em modo `mouse` e o jogo travar ou piscar entre ícones de controle e teclado, troque o gyro para modo `joystick`. A precisão cai, mas a compatibilidade sobe.
:::

## Calibração e drift

O giroscópio do deck recalibra sozinho sempre que você liga o console e o deixa parado por alguns segundos na mesa. Se o cursor começa a andar sozinho, o problema é quase sempre uma calibração que não rodou (porque o deck estava em movimento durante o boot) ou uma sensibilidade alta demais.

```terminal
$ grep "drift\|calibrat" ~/.local/share/Steam/logs/controller_ui.txt 2>/dev/null
[Steam Input] Gyro calibrated, drift 0.0012 rad/s
[Steam Input] Gyro recalibration: drift 0.0009 rad/s
```

Drift inferior a `0.005 rad/s` é clinicamente imperceptível durante o jogo. Se o valor começar a subir acima disso consistentemente, o problema pode ser o sensor acumulando erro térmico (o deck esquenta, a IMU dilata, a leitura muda) — nesse caso, uma recalibração forçada (desligar o deck, deixar esfriar, ligar sobre superfície plana) costuma resolver.

## Resumo

- O giroscópio BMI160 do deck mede velocidade angular e o Steam Input converte isso em movimento de mouse.
- O gyro aiming resolve o trade-off do analógico entre velocidade de giro e precisão de mira.
- Os três modos de ativação são On Touch, On Press e Always On — o primeiro é o recomendado para FPS.
- Sensibilidade típica para FPS fica entre 1.5 e 3.0, com smoothing de 10% a 20%.
- O drift após calibração é normalmente inferior a 0,005 rad/s e imperceptível em jogo.

## Exercícios

1. Num FPS, configure o gyro com ativação "On Right Touchpad Touch", sensibilidade 2.0 e smoothing 15%. Jogue uma partida e depois anote o que precisou ajustar.
2. Compare o `drift` da sua calibração com o comando `grep "drift" ~/.local/share/Steam/logs/controller_ui.txt`. O valor está abaixo de 0.005?
3. Alterne o gyro entre modo `mouse` e modo `joystick` num jogo que suporta os dois. Descreva a diferença de precisão entre os modos.
4. Ajuste o `vertical_scale` para 0.50 e depois para 1.0. Em qual dos dois extremos sua mira horizontal ficou mais estável?
5. **Desafio.** Ative o gyro em modo Always On e jogue uma partida inteira sem desligá-lo. Em que situações o gyro atrapalhou (menus, cutscenes)? Proponha uma configuração que mantenha os benefícios do gyro sem esses incômodos, usando action sets — assunto que você verá nas próximas seções.