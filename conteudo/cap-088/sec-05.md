A curva de ventoinha padrão do Steam Deck é uma obra de compromisso: precisa manter o APU abaixo de 95 °C, ser silenciosa o bastante para não estragar a experiência portátil e reagir rápido a picos de carga. Nem todo mundo concorda com o compromisso da Valve — felizmente, o modo Gaming expõe controles, e o ecossistema de plugins (Decky Loader) abre a porta para curvas totalmente customizadas. Esta seção cobre como ajustar, testar e restaurar o comportamento da ventoinha.

:::objetivos
- Entender a curva de ventoinha padrão do SteamOS
- Acessar e modificar a curva pelo menu Performance do modo Gaming
- Usar o jupiter-hwmon para ajuste fino de fan
- Instalar e configurar curvas via Decky Loader (Fantastic)
- Restaurar a curva original em caso de problema
:::

## A curva padrão da Valve

A curva de fábrica do SteamOS é conservadora e progressiva. Abaixo de 60 °C, a ventoinha fica parada ou em rotação muito baixa (imperceptível). Dos 60 aos 80 °C, ela sobe em degraus, e acima dos 85 °C acelera agressivamente rumo ao máximo. O objetivo declarado da Valve é manter o chip fora do throttling (que começa perto de 95 °C) sem sacrificar a ergonomia acústica:

| Faixa de temperatura | Comportamento esperado da ventoinha |
|---|---|
| Até ~55 °C | Parada ou rotação de fundo (0–2000 RPM) |
| 55–75 °C | Rampa gradual (2000–4500 RPM) |
| 75–88 °C | Aceleração rápida (4500–6500 RPM) |
| Acima de 88 °C | Máximo (~7000+ RPM), throttling iminente |

:::info
A Valve ajusta a curva via atualizações do firmware do EC (embedded controller) — às vezes um update de SteamOS altera o comportamento da ventoinha sem aviso visível. Se a ventoinha "mudou do nada", procure o changelog da versão do SteamOS.
:::

## O menu Performance integrado

A forma mais simples — e reversível — de mexer na ventoinha é o menu Performance do modo Gaming. Pressione o botão com três pontos (`...`) e acesse o ícone de raio. Em "Performance Settings", ative "Use per-game profile" e você verá um controle de "Fan Speed" com as opções:

- **Default**: curva da Valve
- **Steam Deck**: curva antiga (original do LCD, mais agressiva)
- **Manual**: controle deslizante de velocidade fixa (evite para uso normal)

A opção "Updated Fan Control" (OLED) usa uma curva revisada, mais silenciosa em temperaturas baixas. O controle manual fixa a ventoinha num valor — útil para testes, perigoso para jogar, porque você pode esquecer e superaquecer o Deck.

:::perigo
Nunca deixe a ventoinha em modo manual e fixa por longos períodos. Se você esquecer, o Deck não aumentará o RPM sozinho quando o chip atingir o limite, e o throttling será a única proteção — o que derrota o propósito de ter fixado a ventoinha.
:::

## Ajuste via jupiter-hwmon

O driver `steamdeck-hwmon` expõe o alvo da ventoinha como arquivo gravável. No SteamOS 3.6, o serviço `jupiter` (gerenciador do hardware do Deck) pode aceitar comandos de ajuste. O caminho exato varia entre versões, mas a ideia geral é escrever no `pwm1_enable` e `pwm1`:

```terminal
## Verificar se o controle está no modo automático
$ cat /sys/class/hwmon/hwmon3/pwm1_enable
1
```

O valor `1` significa modo manual (PWM definido pelo SO), e `2` significa modo automático (EC no controle). Com `1`, você pode escrever diretamente no PWM:

```terminal
## Colocar ventoinha em 50% por 10 segundos (teste)
# echo 128 > /sys/class/hwmon/hwmon3/pwm1
# sleep 10
# echo 2 > /sys/class/hwmon/hwmon3/pwm1_enable
```

O range de PWM é de 0 a 255 (8 bits). Escrever `128` equivale a 50% de duty cycle, o que deve gerar algo em torno de 3500-4000 RPM.

:::atencao
Escrever direto no `pwm1` contorna a proteção da curva e pode deixar a ventoinha em qualquer valor. O firmware ainda pode impor um mínimo de segurança, mas não confie nisso. Sempre devolva o controle com `echo 2 > pwm1_enable`.
:::

## Decky Loader e o plugin Fantastic

Para controle mais refinado, o Decky Loader oferece o plugin **Fantastic**, que expõe curvas de ventoinha customizadas com interface gráfica no modo Gaming. Após instalar o Decky e o plugin, você pode:

- Criar pontos da curva: temperatura × duty cycle
- Alternar entre curvas por perfil de jogo
- Desabilitar totalmente a ventoinha (não recomendado)
- Ajustar histerese e tempo de resposta

O Fantastic traduz a curva definida em comandos diretos para o `steamdeck-hwmon`, então ele não faz mágica — apenas simplifica o que você já faria via `sysfs`. A vantagem é que ele lembra as curvas entre sessões e aplica automaticamente.

Você pode confirmar se a curva foi aplicada observando a mudança no alvo da ventoinha:

```terminal
$ cat /sys/class/hwmon/hwmon3/pwm1_enable
2
$ cat /sys/class/hwmon/hwmon3/fan1_target
4500
```

Quando `pwm1_enable` está em `2` (automático), o EC escolhe o RPM com base na curva ativa. O `fan1_target` reflete o alvo calculado, e o `fan1_input` mostra o RPM que o blower realmente atingiu.

:::dica
Se você instalar o Fantastic, comece com uma curva que espelhe a padrão da Valve e reduza apenas os pontos médios (60–75 °C) em 5%. Teste vários jogos antes de mexer nos extremos. Uma curva agressiva demais que atrase a ventoinha pode causar throttling em jogos pesados que você não testou.
:::

## Resumo

- A curva padrão da Valve mantém a ventoinha parada até ~55 °C e acelera progressivamente até o máximo perto de 90 °C.
- O menu Performance do modo Gaming oferece curvas "Default", "Steam Deck" (legado) e controle manual.
- O arquivo `pwm1_enable` alterna entre modo manual (1) e automático (2); gravar `pwm1` ajusta o duty cycle.
- O plugin Fantastic (Decky Loader) oferece curvas customizadas com interface gráfica.
- Sempre devolva o controle ao automático depois de testes manuais para evitar superaquecimento.

## Exercícios

1. No modo Gaming, acesse o menu Performance e alterne entre as curvas "Default" e "Steam Deck". Anote o RPM em idle para cada uma.
2. No modo Desktop, leia `pwm1_enable` e `pwm1`. Depois, coloque o controle em manual com 50% por 5 segundos e restaure o automático.
3. Se tiver o Decky Loader, instale o Fantastic e crie uma curva com 3 pontos. Teste-a em um jogo leve e um jogo pesado.
4. Feche um jogo e acompanhe `fan1_input` a cada segundo. Quanto tempo a ventoinha leva para voltar ao RPM de repouso?
5. **Desafio.** Projete uma curva (em papel ou script) que mantenha o APU abaixo de 80 °C sem nunca ultrapassar 5000 RPM. Teste-a com `stress --cpu 8 --timeout 60s`. O throttling entrou em ação? O som da ventoinha ficou confortável?