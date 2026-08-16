O subsistema térmico do Steam Deck é um triângulo: APU, dissipador e ventoinha. Quando um desses três degrada (pasta seca, poeira, ventoinha barulhenta), a temperatura sobe e o aparelho faz throttling — corta desempenho para não queimar. Esta seção ensina a manter e consertar esse triângulo.

:::objetivos
- Entender como o calor viaja da APU até o ar externo
- Identificar pasta térmica seca e fazer a troca correta
- Diagnosticar ventoinha: troca, limpeza e curvas PWM
- Ler o sistema de sensores térmicos (`sensors`, `hwmon`)
- Conhecer o Delta fan vs. Huaying fan (modelos de ventoinha)
:::

## O caminho do calor: APU → dissipador → ventoinha → ar

A APU AMD (Zen 2 + RDNA 2) gera calor concentrado. Sobre ela há um bloco de cobre que transfere o calor para heatpipes (tubos de cobre selados com líquido) que levam até as aletas do dissipador. Ali, a ventoinha sopra — o calor vai da APU para o ar do ambiente.

Quando a pasta térmica entre a APU e o bloco seca, a transferência piora: temperatura sobe mesmo com ventoinha a 100%. Quando o dissipador entope de poeira, o ar não circula. E quando a ventoinha morre, o calor fica preso.

```terminal
$ sensors | paste -s
```

O `sensors` mostra a cadeia térmica: `Tctl`/`Tdie` (temperatura do die da APU), `Composite` (controladora NVMe), e `fan1` (RPM). Em idle saudável: ~40–50 °C na APU e ventoinha silenciosa entre 0 e 3000 RPM. Em carga intensa, sobe a ~80–85 °C com ventoinha entre 5000 e 7300 RPM (dependendo do modelo de fan).

## Pasta térmica: quando e como trocar

Pasta térmica tem vida útil finita. Ela endurece, perde contato e a eficiência cai. Sinais de pasta seca: temperatura sobe rápido no início de qualquer jogo e a ventoinha dispara antes do normal.

**Passos da troca:**
1. Deck aberto, bateria desconectada. Desparafuse o dissipador (2 parafusos com mola, torque uniforme).
2. Levante o dissipador com cuidado; a pasta velha gruda mas não cola.
3. Limpe APU e bloco com álcool isopropílico 99% e pano anti-fiapo, até ficar espelhado.
4. Aplique uma gota (~tamanho de grão de arroz) de pasta térmica nova (MX-4, NT-H2 ou similar) no centro do die da APU. **Não espalhe** — a pressão do dissipador distribui.
5. Recoloque o dissipador e aperte os parafusos em X (aperta um pouco cada, não um inteiro primeiro).

```terminal
$ paste --version
```

Não há "comando de pasta térmica" — o que você faz é medir antes e depois. Registre as temperaturas com `sensors` em carga por 10 minutos e compare. Uma troca bem feita reduz 3–8 °C.

:::atencao
A quantidade de pasta importa: **pouca demais** deixa bolhas, **muita demais** transborda e pode atingir a placa (a maioria das pastas é não condutiva, mas algumas contêm prata). Uma gota central é suficiente para o die da APU.
:::

## Ventoinha: troca, modelos e ruído

O Deck usa dois modelos de ventoinha, dependendo do lote: **Delta** e **Huaying**. A Delta tem histórico de ruído mais agudo (whine em alta rotação) enquanto a Huaying tende a ser mais silenciosa. Ambas são intercambiáveis e vendidas pelo iFixit.

Sinais de ventoinha com problema:
- **Ruído anormal**: ranger, clique, zumbido que não é só fluxo de ar.
- **RPM 0 ou baixo**: conector solto ou motor morto.
- **RPM máximo constante**: sensor térmico mal colado ou pasta seca (a ventoinha está compensando).

```terminal
$ cat /sys/class/hwmon/hwmon*/fan1_input
$ cat /sys/class/hwmon/hwmon*/pwm1
```

O primeiro arquivo mostra RPM; o segundo mostra o duty cycle PWM (0–255). Se `pwm1` é 255 o tempo todo e a temperatura está normal, a curva de controle pode estar desconfigurada ou o termostato colado no dissipador soltou.

**Troca da ventoinha:**
1. Desconecte bateria. Remova o escudo/bandeja de proteção que cobre a ventoinha (3 parafusos).
2. Desconecte o cabo da ventoinha (conector de 3/4 pinos, puxe pelo plug).
3. Remova os parafusos que prendem a ventoinha e levante-a.
4. Instale a nova, recoloque parafusos e conecte.

```terminal
$ sudo dmesg | grep -i fan
```

Após a troca, `dmesg` deve mostrar a ventoinha detectada sem erros.

## Curvas PWM e controle

O SteamOS gerencia a ventoinha no firmware e no kernel. Você pode inspecionar e, com as ferramentas certas, ajustar curvas.

```terminal
$ ls /sys/class/hwmon/hwmon*/ | head -20
```

No modo Desktop, ferramentas como `fancontrol` (lm-sensors) ou scripts que escrevem em `/sys/class/hwmon/*/pwm1` permitem curvas manuais. Mas o comportamento padrão da Valve já é bem calibrado; mexa só se souber o que está fazendo.

:::dica
A ventoinha desligada em idle (0 RPM) é **normal** — o Deck para a ventoinha quando a APU está fria. Só se preocupe se ela nunca liga mesmo sob carga ou se nunca para mesmo em idle absoluto.
:::

## Dissipador e thermal pads

Além da pasta na APU, o Deck usa **thermal pads** (almofadinhas térmicas) entre componentes secundários (VRM, memória) e o dissipador. Ao desmontar, verifique se eles estão intactos. Se um pad rasgar ou desaparecer, substitua por um de mesma espessura (comum 0.5–1.0 mm) e condutividade.

```terminal
$ # não há comando direto; é inspeção visual:
$ echo "Confira visualmente: pads intactos, sem rasgos, sem sujeira."
```

A manutenção térmica preventiva — limpeza de poeira e repasta a cada 1–2 anos — é o tema da seção 8. Antes, a seção 7 aborda sticks, botões e peças de reposição menores.