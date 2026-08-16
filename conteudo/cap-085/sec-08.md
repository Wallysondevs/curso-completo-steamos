Com a tela nova colada, a bateria substituída e a ventoinha encaixada no lugar, você chega à etapa que separa um reparo bem-sucedido de uma dor de cabeça futura: fechar o Steam Deck corretamente e validar *tudo* antes de dar o serviço por encerrado. A pressa aqui é inimiga — um clipe mal encaixado, um parafuso apertado demais ou um cabo parcialmente solto podem transformar um reparo simples em um chamado de retrabalho. Esta seção detalha a ordem exata de remontagem, a sequência segura de reconexão elétrica e a rotina completa de testes que você deve executar para assinar embaixo com confiança.

:::objetivos

* Reconstruir o Steam Deck na ordem reversa da desmontagem, respeitando a sequência de clipes e parafusos.
* Reconectar a bateria como **último** passo elétrico, eliminando risco de curto durante a montagem.
* Executar uma rotina de validação completa: boot, tela, ventoinha, bateria e temperatura sob carga.
* Utilizar ferramentas de diagnóstico do próprio SteamOS e de linha de comando para interpretar os resultados.
:::

---

## Ordem de remontagem: o caminho inverso

A regra de ouro da remontagem é simples: **o último componente que saiu é o primeiro que entra**. Se você seguiu a sequência da [sec-01](cap-085/sec-01), a reconstrução será natural. Comece pela blindagem interna da placa-mãe — aquela chapa metálica que cobre o dissipador e parte dos conectores. Posicione-a sem forçar, alinhando os pinos-guia antes de apertar os parafusos Phillips menores (cabeça fina, torque baixo).

Em seguida, recoloque o *midframe* (chassi intermediário) sobre o conjunto. Ele desce primeiro pela borda dos gatilhos traseiros; pressione ao longo do perímetro até ouvir os cliques dos encaixes plásticos. **Não use força excessiva** — se um clipe não entrar, recue, verifique se nenhum cabo está pinçado entre o *midframe* e a carcaça, e tente novamente.

Agora recoloque os botões laterais (volume e power), encaixando-os nas respectivas cavidades com os contatos voltados para a placa. Se eles caírem durante a montagem, um pedaço de fita adesiva temporária resolve: fixe por fora, monte a carcaça e remova a fita depois.

## Apertando os 8 parafusos da carcaça

Com tudo interno no lugar, a carcaça traseira desce verticalmente. Alinhe primeiro a borda superior (saída de ar) e vá "fechando o livro" até a borda inferior. Percorra todo o perímetro com os dedos, apertando cada clipe até sentir o estalo característico. Um clipe falso — aquele que parece encaixado mas está apenas tocando — geralmente fica na região central, perto do logo Valve.

Os oito parafusos autorroscantes da carcaça seguem uma ordem cruzada para distribuir pressão uniforme:

| Passo | Parafuso | Verificação |
|---|---|---|
| 1 | Dois superiores (canto) | Carcaça alinhada com a tela, sem degrau |
| 2 | Dois inferiores (canto) | Folga zero nos cantos inferiores |
| 3 | Quatro centrais (2 de cada lado) | Aperto firme sem resistência de rosca espanada |

O torque ideal para os parafusos da carcaça é aproximadamente **0,2 a 0,3 N·m** — na prática, gire até sentir resistência e dê no máximo 1/8 de volta adicional. Apertar demais trinca a rosca do plástico; apertar de menos faz o Deck ranger ao segurar.

---

## Reconectando a bateria por último

:::perigo

**Risco de curto-circuito.** Jamais conecte a bateria antes de todos os cabos flat e conectores estarem firmes. Uma ponta de chave metálica encostando no positivo da bateria enquanto você ajusta um cabo pode queimar o circuito de carga — dano irreversível sem troca de placa-mãe.
:::

A reconexão da bateria foi detalhada na [sec-03](cap-085/sec-03). Relembrando o procedimento crítico:

1. Verifique visualmente se **todos** os cabos estão conectados: tela, ventoinha, touch, alto-falante, SSD, gamepad, trackpads.
2. Posicione o conector da bateria sobre o receptáculo na placa-mãe (ele entra reto, não em ângulo).
3. Pressione com o dedo ou com a parte traseira de uma pinça plástica até o clique — audível e tátil.
4. Com o Deck ainda aberto, faça um **teste de energização rápida**: pressione o botão power por 2 segundos. Se a ventoinha girar por um instante e o LED de carga piscar, a bateria está reconhecida. Desligue imediatamente (power longo, 10 s).

Esse teste com o Deck aberto evita que você feche tudo e descubra depois que o conector não está bem encaixado.

---

## Rotina de testes pós-reparo

Com o Steam Deck fechado e os oito parafusos no torque correto, passe para a validação sistemática. A ordem importa: cada teste depende do anterior funcionar.

## 1. Boot e reconhecimento de hardware

Ligue o Deck normalmente. Se o boot travar em tela preta com a ventoinha em 100%, o conector da bateria pode estar mal encaixado ou o *flat* da tela não fez contato. Desligue (power longo), reabra e revise.

No SteamOS, abra um terminal (`[[Ctrl]]` + `[[Alt]]` + `[[F4]]`, login `deck`) e verifique se todos os dispositivos foram enumerados:

```terminal
$ lspci -k | grep -E "VGA|Audio|Ethernet|NVMe"
01:00.0 VGA compatible controller: Advanced Micro Devices, Inc. [AMD/ATI] VanGogh [Aerith]
01:00.1 Audio device: Advanced Micro Devices, Inc. [AMD/ATI] Rembrandt Radeon High Definition Audio
02:00.0 Non-Volatile memory controller: Samsung Electronics Co Ltd NVMe SSD Controller PM9A1
$ ls /dev/input/by-path/ | grep -i touch
platform-i2c_designware.0-event-mouse
```

Se o controlador de touch (`i2c_designware`) não aparecer, o flat da tela (que carrega também o touch) está mal conectado — reabra e revise o conector descrito na [sec-01](cap-085/sec-01).

## 2. Tela: pixels mortos, uniformidade e touch

Com o Deck em ambiente escuro (ou penumbra), execute uma suíte de teste de tela. O próprio SteamOS oferece um recurso oculto no menu de recuperação, mas você pode usar o `mpv` com imagens sólidas:

```terminal
## Gere e exiba padrões RGB+K preto/branco em tela cheia
$ cd ~/lab && for cor in ff0000 00ff00 0000ff ffffff 000000; do
    convert -size 1280x800 xc:#$cor /tmp/tela_$cor.png
done
$ mpv --fs --loop-file=no --image-display-duration=2 /tmp/tela_*.png
```

Percorra cada cor sólida com o olhar a ~15 cm da tela. Procure por:
- **Pixels mortos** (pontos pretos fixos em fundo colorido).
- **Pixels presos** (pontos coloridos fixos em fundo preto).
- **Vazamento de luz** nas bordas (comum em IPS, aceitável se uniforme).
- **Manchas amareladas** (pode indicar pressão irregular da cola T-7000, ver sec-05).

Teste o touch capacitivo desenhando círculos concêntricos com os 10 dedos simultaneamente no menu de calibração:

```terminal
$ xinput test "FTS3528:00 2808:1015" 2>/dev/null | head -n 30
## Toque a tela; você verá eventos motion e button press
```

Se o touch não responder nas bordas (área colada), a cola pode ter migrado sobre o sensor — requer descolagem e limpeza.

## 3. Ventoinha: rotação, ruído e curva térmica

A ventoinha do Steam Deck é gerenciada pelo firmware embarcado. Você pode monitorar a RPM e comparar com o ruído percebido:

```terminal
$ watch -n1 'sensors | grep -E "fan|Tctl|Tdie"'
fan1:           3420 RPM
Tctl:         +42.5°C
Tdie:         +41.8°C
```

Em idle, a ventoinha deve ficar abaixo de 4000 RPM e ser praticamente inaudível a 30 cm. Para forçar o regime máximo e detectar ruídos anômalos (coil whine, vibração, rotor raspando), use o `stress-ng`:

```terminal
## Estresse todos os núcleos por 60 segundos e observe a rampa da ventoinha
$ stress-ng --cpu 8 --timeout 60s
stress-ng: info:  [4421] setting to '60 second' stress duration
stress-ng: info:  [4421] dispatching hogs: 8 cpu
## Em outro terminal ou via SSH, monitore:
$ sensors | grep fan
fan1:           6120 RPM
```

Se a ventoinha vibrar acima de 5800 RPM (ruído de "zumbido metálico"), os parafusos de fixação podem estar frouxos ou a ventoinha substituta não tem a mesma curva da original — compatibilidade de peças é discutida na sec-06.

## 4. Bateria: carga, descarga e calibração inicial

Após a troca, a bateria pode reportar porcentagem incorreta se o *fuel gauge* (medidor de carga) não estiver calibrado. Deixe o Deck carregando até 100% com o aparelho desligado, depois entre no SteamOS e descarregue até 0% sem interrupção. Repita o ciclo completo (100% → 0% → 100%) uma vez para o controlador MAX77961 recalcular a curva de capacidade.

Acompanhe a saúde da bateria pelo sysfs:

```terminal
$ cat /sys/class/power_supply/BAT1/uevent
POWER_SUPPLY_NAME=BAT1
POWER_SUPPLY_STATUS=Charging
POWER_SUPPLY_CAPACITY=87
POWER_SUPPLY_CAPACITY_LEVEL=Normal
POWER_SUPPLY_VOLTAGE_NOW=8300000
POWER_SUPPLY_CURRENT_NOW=1200000
POWER_SUPPLY_CHARGE_FULL=40123000
POWER_SUPPLY_CHARGE_FULL_DESIGN=40000000
```

O campo `CHARGE_FULL` indica a capacidade real aprendida pelo *fuel gauge*. Se ele estiver significativamente abaixo de `CHARGE_FULL_DESIGN` (menos de 95% em bateria nova), repita o ciclo de calibração.

---

## Ferramentas de diagnóstico embarcadas no SteamOS

O Steam Deck oferece camadas de diagnóstico que vão além do `sensors`:

## Menu de recuperação da Valve e BIOS

Desligue o Deck. Segure **Volume -** (`[[Vol-]]`) e pressione o botão **Power**. O menu de boot aparece. Selecione *Setup Utility* para entrar na BIOS (firmware InsydeH2O). Dentro dela, navegue até **Battery Information** — você verá tensão, corrente, ciclos e status de saúde reportados diretamente pelo controlador BMS. É a fonte mais confiável para baterias suspeitas.

A mesma tela de boot oferece o *SteamOS Recovery Image*, que contém ferramentas de reinstalação, mas também um **teste de hardware básico**: ao bootar pelo recovery, escolha *"Verify installation"* — ele checa checksums de partição e integridade do SSD, útil se o Deck sofreu quedas durante o reparo.

## Utilitários de linha de comando

O SteamOS 3.6 (Arch Linux) vem com `steamos-session-select`, que permite alternar entre a sessão Gamescope (padrão) e uma sessão Plasma (KDE) para testes gráficos mais detalhados:

```terminal
$ steamos-session-select plasma
## Na sessão Plasma, você roda benchmarks gráficos e acessa o KInfoCenter
$ kinfocenter --platform wayland
```

Para diagnóstico da ventoinha diretamente pelo sysfs (útil se o `sensors` não mostrar RPM):

```terminal
$ cat /sys/class/hwmon/hwmon2/fan1_input
3420
$ echo 1 > /sys/class/hwmon/hwmon2/fan1_enable  ## Força ventoinha ligada (root)
```

O arquivo `fan1_input` reporta a RPM atual. Se o valor for zero com a ventoinha visivelmente girando, o sensor Hall da ventoinha pode ser incompatível — cenário comum com ventoinhas de terceiros (veja sec-06).

## Teste de stress completo com relatório

Combine as ferramentas em um script de validação automatizada. Crie o arquivo `~/lab/pos-reparo.sh`:

```terminal
$ mkdir -p ~/lab && cat > ~/lab/pos-reparo.sh << 'EOF'
#!/bin/bash
echo "=== QA Steam Deck - $(date) ==="
echo "[1/5] Tela touch..."
ls /dev/input/by-path/*touch* > /dev/null && echo "OK: touch detectado" || echo "FALHA: touch ausente"
echo "[2/5] Ventoinha..."
RPM=$(cat /sys/class/hwmon/hwmon2/fan1_input 2>/dev/null || echo "0")
[[ $RPM -gt 1000 ]] && echo "OK: fan ${RPM} RPM" || echo "FALHA: fan parada"
echo "[3/5] Bateria..."
CAP=$(cat /sys/class/power_supply/BAT1/capacity 2>/dev/null || echo "?")
echo "Carga: ${CAP}%"
echo "[4/5] Temperatura..."
TCTL=$(sensors | awk '/Tctl/ {print $2}' | tr -d '+°C')
echo "Tctl: ${TCTL}°C"
echo "[5/5] Stress CPU 30s..."
stress-ng --cpu 4 --timeout 30s --metrics-brief 2>&1 | tail -5
echo "=== QA concluído ==="
EOF
$ chmod +x ~/lab/pos-reparo.sh && ~/lab/pos-reparo.sh
```

:::perigo

Execute o script de stress test **apenas com a carcaça fechada e a ventoinha funcional**. Rodar `stress-ng` com o Deck aberto ou com a ventoinha inoperante pode causar desligamento térmico ou dano ao APU em menos de 2 minutos.
:::

---

## Checklist final de remontagem

| Etapa | O que verificar | Sinal de OK |
|---|---|---|
| Cabo flat da tela | Conector travado, fita adesiva sobre o latch | Imagem sem flicker ao mover o Deck |
| Cabo da ventoinha | Conector alinhado, fio não passa sobre o dissipador | RPM reportada > 0 no idle |
| Conector da bateria | Clique audível, pull-test suave (não solta) | Boot sem mensagem "battery missing" |
| Clipes do perímetro | 360° percorridos com o dedo, sem folga lateral | Sem estalos ao torcer levemente o Deck |
| Parafusos (8 un.) | Torque uniforme, cabeça não saliente | Deck apoiado em mesa não balança |
| Sensores pós-boot | `sensors`, `ls /dev/input`, `cat /sys/class/power_supply` | Todos os valores dentro do esperado |

---

## Resumo

* A remontagem segue a ordem inversa exata da desmontagem: blindagem → *midframe* → botões laterais → carcaça traseira → 8 parafusos em cruz.
* A bateria é **sempre** o último conector a ser plugado; teste de energização rápida com o Deck ainda aberto evita retrabalho.
* A rotina de QA cobre boot e enumeração de hardware (`lspci`, dispositivos touch), tela (cores sólidas, pixels, touch capacitivo), ventoinha (RPM em idle e sob stress), bateria (ciclo de calibração, `CHARGE_FULL`) e temperatura (stress test controlado).
* O SteamOS 3.6 oferece menu de recuperação, BIOS com informação direta do BMS, `steamos-session-select`, `sensors`, `stress-ng`, `watch` e sysfs (`hwmon`, `power_supply`) como arsenal de diagnóstico nativo.
* Um script de validação (`pos-reparo.sh`) automatiza os cinco checagens essenciais e gera relatório de pronto para o cliente.
* **Nunca** estresse o APU com o Deck aberto ou ventoinha desconectada — o desligamento térmico pode não ser rápido o suficiente.

---

## Exercícios

1. Você fechou o Steam Deck, apertou os 8 parafusos e ligou. A tela fica preta, mas a ventoinha gira. Liste três causas possíveis e a ordem em que você as investigaria.

2. Durante o teste de tela com cores sólidas, você encontra um pixel preso em verde no quadrante superior direito. Descreva duas técnicas de recuperação (software e física) que você tentaria antes de considerar a troca da tela.

3. O script `pos-reparo.sh` reporta `FALHA: fan parada`, mas você ouve a ventoinha girando. Qual é a causa mais provável e como você confirmaria com um comando adicional?

4. Com base no campo `CHARGE_FULL` do sysfs, a bateria nova reporta 98% da capacidade de projeto. Isso é aceitável? Justifique e descreva o procedimento se o valor estivesse em 87%.

5. **Integrador**: Você trocou tela, bateria e ventoinha no mesmo Deck. Monte a sequência completa de remontagem e QA, incluindo os comandos de terminal que validam cada um dos três componentes substituídos e a ordem de execução deles. Aponte qual etapa apresenta maior risco e justifique.