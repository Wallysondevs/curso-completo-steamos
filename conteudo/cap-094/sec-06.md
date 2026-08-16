Se o MangoHud mostra *o que* está acontecendo com o desempenho, o CoreCtrl permite *agir* sobre isso. É um painel de controle gráfico para GPUs AMD e CPUs com overclock/undervolt, originalmente criado para o desktop Linux gamer e perfeitamente funcional no Steam Deck (modo Desktop). Com ele você ajusta curva de ventoinha, limite de potência, frequência e voltagem — tudo com sliders, sem editar arquivos de configuração.

:::objetivos
- Instalar e configurar o CoreCtrl no SteamOS (modo Desktop)
- Ajustar curvas de ventoinha e perfis de energia da GPU
- Monitorar sensores em tempo real com histórico gráfico
- Entender os limites seguros de ajuste no hardware do Steam Deck
:::

## O que é o CoreCtrl

CoreCtrl é uma aplicação Qt que conversa com o driver `amdgpu` via sysfs e com o `hwmon` para expor controles de hardware: velocidade da ventoinha, frequência da GPU, voltagem e potência máxima. Ele também lê todos os sensores disponíveis (temperatura, consumo, rotação) e os plota em gráficos com histórico, funcionando como painel de monitoramento e centro de controle ao mesmo tempo.

Ele não faz overclock mágico: os limites de hardware continuam os mesmos definidos pela Valve no firmware. Mas dentro desses limites, você pode, por exemplo, priorizar silêncio (ventoinha baixa) ou priorizar resfriamento (ventoinha agressiva), dependendo do jogo e do ambiente.

## Instalação no SteamOS

O CoreCtrl está disponível como Flatpak — a forma recomendada de instalar aplicações gráficas no SteamOS sem mexer no sistema base imutável.

```terminal
$ flatpak install flathub org.corectrl.CoreCtrl
$ flatpak run org.corectrl.CoreCtrl
```

Depois de instalado, o ícone aparece no menu de aplicações do modo Desktop. Para que o CoreCtrl tenha permissão de ajustar o hardware, você precisa adicionar seu usuário ao grupo adequado e carregar o perfil de kernel que ele requer.

```terminal
$ sudo usermod -aG corectrl deck
$ sudo systemctl enable --now corectrl
```

O serviço `corectrl` (ativado via systemd) é o backend que aplica as configurações com privilégios de root, enquanto a interface gráfica roda como usuário normal. Sem ele, os sliders mexem mas não fazem efeito.

:::atencao
Após adicionar o usuário ao grupo `corectrl`, faça logout e login (ou reinicie) para que o grupo seja aplicado à sessão. Sem isso, o CoreCtrl reclamará de permissões.
:::

## O painel principal

Ao abrir o CoreCtrl, você vê uma janela dividida em duas abas principais: **Perfis** (onde ajusta frequência, voltagem e ventoinha) e **Monitoramento** (gráficos de temperatura, uso, rotação). A aba de perfis lista sua GPU AMD (a APU Van Gogh) e permite criar múltiplos perfis — um para jogos pesados, outro para jogos leves/indies, outro para modo Desktop/repouso.

```terminal
$ flatpak run org.corectrl.CoreCtrl
## Interface gráfica — sem saída textual
```

Cada perfil define:
- **Curva de ventoinha**: mapeia temperatura → rotação (% ou RPM). Uma curva agressiva sobe rápido acima de 70 °C; uma curva silenciosa mantém baixa rotação até 80 °C.
- **Limite de potência (TDP)**: controla o consumo máximo da APU. Útil para estender bateria em jogos leves.
- **Frequência da GPU**: pode fixar um clock menor que o máximo para reduzir calor e consumo (undervolt efetivo).

## Ajustando a curva de ventoinha

A ventoinha do Steam Deck é controlada pelo firmware, mas o CoreCtrl pode sobrepor esse controle com uma curva definida por você. No painel "Fan", você move pontos no gráfico temperatura × velocidade.

```terminal
$ cat /sys/class/hwmon/hwmon2/pwm1
128   # ~50% duty cycle
```

O valor no sysfs vai de 0 (parada) a 255 (100%). O CoreCtrl traduz isso em porcentagem no slider. Uma curva típica para jogos pesados: 30% a 50 °C, 60% a 70 °C, 100% a 85 °C. Para jogos leves ou modo silencioso: 20% a 50 °C, 40% a 70 °C, 80% a 85 °C.

:::dica
Não desligue a ventoinha completamente (0%) com a APU acima de 50 °C. O Van Gogh é compacto e aquece rápido; sem fluxo de ar, outros componentes além da APU (como o SSD e a bateria) também sofrem.
:::

## Monitoramento com histórico

A aba de monitoramento plota gráficos em tempo real de cada sensor, com um buffer rolante de alguns minutos. Você pode selecionar quais sensores exibir: temperatura da GPU, temperatura da CPU, rotação da ventoinha, consumo em watts, uso de GPU e CPU, entre outros.

Esse histórico visual é superior ao overlay do MangoHud para um tipo de diagnóstico: a evolução no tempo. Você vê exatamente quando a temperatura subiu, se a ventoinha respondeu, e se o consumo caiu (indicando throttling). É a ferramenta certa para responder "o deck está aquecendo demais depois de 30 minutos de jogo?".

```terminal
$ sensors
amdgpu-pci-0400
Adapter: PCI adapter
edge:         +78.0°C  (crit = +110.0°C)
fan1:         4200 RPM
```

O `sensors` mostra um instantâneo; o CoreCtrl mostra a curva. Juntos, um confere o valor pontual, o outro revela a tendência.

## Perfis de energia e TDP

O Steam Deck permite ajustar o TDP (Thermal Design Power) direto do QAM no modo de jogo, mas o CoreCtrl oferece controle mais fino: você pode definir TDP em watts com precisão decimal e criar perfis que trocam automaticamente conforme a aplicação ativa.

```terminal
$ cat /sys/class/drm/card0/device/hwmon/hwmon2/power1_cap
15000000   # 15W em microwatts
```

O TDP padrão da APU Van Gogh é 15 W (valor em microwatts). Reduzir para 8–10 W em jogos 2D ou indies pode dobrar a duração da bateria sem perda de desempenho perceptível. Aumentar além de 15 W não é recomendado — o VRM e a bateria foram dimensionados para esse envelope térmico.

## Limites e segurança

O CoreCtrl opera dentro dos limites que o firmware expõe. Ele não faz overclock real (aumentar frequência além do máximo de fábrica) porque o driver `amdgpu` no Steam Deck não expõe controls de overclock — a Valve travou o clocks máxima no firmware para garantir estabilidade e segurança térmica.

O que você pode fazer é undervolt: reduzir a voltagem para uma mesma frequência, o que diminui temperatura e consumo sem perder desempenho. Mas isso requer acesso a níveis de controle que o CoreCtrl padrão não expõe — exigiria ferramentas mais baixo nível como `ryzenadj` (seção seguinte).

:::atencao
Não use ferramentas de overclock/undervolt que alterem diretamente registradores da APU sem antes entender os riscos. Uma configuração errada pode causar instabilidade, corrupção de dados ou, em casos extremos, dano ao hardware. O CoreCtrl é seguro porque opera dentro dos limites do firmware; ferramentas como `ryzenadj` exigem mais cuidado.
:::

## Resumo

- CoreCtrl é uma interface gráfica para ajustar ventoinha, TDP e monitorar sensores de GPUs AMD.
- Instale via Flatpak (`org.corectrl.CoreCtrl`) e habilite o serviço `corectrl` com systemd.
- A aba de perfis controla curva de ventoinha e limite de potência; a aba de monitoramento plota histórico.
- Ajustar TDP para baixo (8–10 W) em jogos leves estende a bateria sem perda perceptível.
- O CoreCtrl opera dentro dos limites do firmware; não permite overclock no Steam Deck.

## Exercícios

1. Instale o CoreCtrl via Flatpak e adicione seu usuário ao grupo `corectrl`; ative o serviço `corectrl`.
2. Crie dois perfis: "Jogo pesado" (ventoinha agressiva, TDP 15 W) e "Jogo leve" (ventoinha silenciosa, TDP 8 W).
3. Abra a aba de monitoramento e observe temperatura e rotação da ventoinha durante 10 minutos de um jogo à sua escolha.
4. Altere a curva de ventoinha e observe, em tempo real, se a rotação sobe conforme esperado quando a temperatura atinge o ponto configurado.
5. **Desafio.** Meça a duração da bateria jogando o mesmo jogo por 15 minutos com TDP 15 W e depois com TDP 8 W. Calcule a diferença percentual e relacione com o impacto no FPS (usando o MangoHud simultaneamente).