Todo mundo já viu o controle deslizante de TDP no menu rápido, mas pouca gente entende o que ele faz por baixo dos panos. Esta seção conecta o gesto visual que você faz no Modo Jogo a uma ferramenta de linha de comando chamada `ryzenadj`. Entender essa ponte é o que separa quem "aperta botão" de quem realmente controla a energia do Deck.

:::objetivos
- Controlar o TDP pelo menu rápido do Modo Jogo
- Instalar e executar o `ryzenadj` para ajuste fino do TDP
- Entender o que as opções `-a`, `-b` e `-c` significam
- Ler o estado atual da APU com `ryzenadj --info`
:::

## O menu rápido como fachada

No Modo Jogo, o menu de desempenho (botão `…` → ícone de bateria) expõe três controles ligados à energia: o **limite de TDP**, o **clock da GPU** (que você verá na próxima seção) e o **limite de FPS**. O controle de TDP aceita valores entre 3 W e 15 W, em passos visuais, e grava a escolha por jogo.

O que acontece por baixo é revelador: aquele deslizante não inventa uma configuração nova — ele chama a mesma funcionalidade que o `ryzenadj` expõe via linha de comando. A Valve simplesmente embrulhou essa capacidade numa interface amigável. Por isso, dominar o `ryzenadj` te dá acesso ao mesmo poder do menu, só que com precisão de watt, scriptável e repetível.

A vantagem do menu é a conveniência; a vantagem do terminal é o controle. Você pode, por exemplo, querer um valor de TDP que o menu não oferece como passo, ou aplicar o mesmo ajuste a muitos jogos de uma vez — coisas que o deslizante não faz e o `ryzenadj` faz.

## Instalando o ryzenadj

O `ryzenadj` não vem instalado de fábrica no SteamOS. Como o sistema de arquivos raiz é somente leitura por padrão, a instalação exige desabilitar essa trava antes de usar o gerenciador de pacotes:

```terminal
$ sudo steamos-readonly disable
$ sudo pacman -S ryzenadj
Resolving dependencies...
Packages (1) ryzenadj-0.14.0-1

Total Installed Size:  0.06 MiB

:: Proceed with installation? [Y/n] Y
...
$ sudo steamos-readonly enable
```

O `pacman` é o gerenciador de pacotes do Arch Linux, a base do SteamOS. A primeira linha destrava a partição raiz, e a última religa a proteção ao terminar — importante, porque uma atualização do sistema pode sobrescrever pacotes instalados manualmente no raiz, e deixar a raiz destravada é um risco desnecessário.

:::atencao
Pacotes instalados em `/usr` com a raiz destravada **somem numa atualização grande do SteamOS**, que reinstala o sistema imutável. Para persistir o `ryzenadj` entre atualizações, prefira instalá-lo em `/home` com um prefixo local ou reinstalá-lo após cada atualização. Mais sobre o sistema somente leitura, [veja a seção sobre o raiz imutável](#/cap-004/sec-03).
:::

## Lendo o estado atual

Antes de mudar qualquer valor, saiba onde você está. O `ryzenadj --info` imprime o estado das várias alavancas de energia da APU:

```terminal
$ sudo ryzenadj --info
CPU Family: Rembrandt
SMU BIOS Interface Version: 39
Version: 1.6.1
PM Table Version: 450005
STAPM LIMIT: 15.000000
STAPM VALUE: 8.312345
PPT LIMIT FAST: 15.000000
PPT LIMIT SLOW: 15.000000
TDC LIMIT VDD: disabled
TDC LIMIT SOC: disabled
EDC LIMIT VDD: disabled
TDP LIMIT: 15
```

Os três números que importam aqui são o **STAPM LIMIT**, o **PPT LIMIT FAST** e o **PPT LIMIT SLOW**. STAPM (Skin Temperature Aware Power Management) é o limite de energia que leva em conta a temperatura da superfície — o que mais importa num portátil que você segura na mão. PPT (*Package Power Tracking*) são limites de potência do pacote inteiro. No `ryzenadj`, as opções `-a`, `-b` e `-c` correspondem a STAPM, PPT fast e PPT slow, respectivamente.

:::info
O rótulo `CPU Family: Rembrandt` na saída é um artefato da base AMD compartilhada do `ryzenadj`. A Aerith não é tecnicamente da família Rembrandt, mas compartilha a interface SMU (System Management Unit) que o `ryzenadj` fala. Por isso a ferramenta funciona no Deck apesar do rótulo.
:::

## Aplicando um limite

O comando que você mais vai usar fixa os três limites de uma vez para o mesmo valor. A linha a seguir trava STAPM, PPT fast e PPT slow em 15 W:

```terminal
$ sudo ryzenadj -a 15000 -b 15000 -c 15000
Sucessfully set stapm_limit to 15000
Sucessfully set fast_ppt_limit to 15000
Sucessfully set slow_ppt_limit to 15000
```

A unidade é **miliwatt**: `15000` significa 15 W. Repare no "Sucessfully" com um "s" só — é um erro de digitação histórico do projeto, presente em muitas versões; não significa que nada aconteceu. O limite fica aplicado imediatamente, sem reiniciar, e permanece até você trocá-lo ou reiniciar a máquina.

Para reduzir a, digamos, 11 W, é a mesma sintaxe com outro número:

```terminal
$ sudo ryzenadj -a 11000 -b 11000 -c 11000
Sucessfully set stapm_limit to 11000
Sucessfully set fast_ppt_limit to 11000
Sucessfully set slow_ppt_limit to 11000
```

Por que três valores iguais? Porque cada um atua numa escala de tempo diferente: STAPM responde à temperatura da carcaça a longo prazo, o fast PPT permite picos curtos de potência, e o slow PPT rege o consumo sustentado. Ao fixá-los no mesmo número, você alinha todos os cronômetros no mesmo teto e obtém o comportamento mais previsível.

## O que muda no comportamento

Depois de aplicar um limite, o efeito é imediato, mas sutil. Rodando o `--info` de novo, o `STAPM VALUE` (o consumo medido naquele instante) passa a pairar perto do novo teto em carga:

```terminal
$ sudo ryzenadj --info | grep -E 'STAPM (LIMIT|VALUE)'
STAPM LIMIT: 11.000000
STAPM VALUE: 10.876543
```

O `STAPM LIMIT` confirma o teto que você pediu; o `STAPM VALUE` mostra o consumo real, que oscila conforme o jogo exige. Quando o jogo pede mais do que o limite, a APU desacelera para caber em 11 W — e é aí que você vê a troca entre FPS e bateria se materializar.

:::dica
Teste o limite enquanto roda um jogo em segundo plano e acompanhe com `ryzenadj --info` repetido. Você verá o `STAPM VALUE` gruda no teto quando a carga é pesada e cai quando a cena fica leve — a prova de que o limite só "morde" quando é necessário, não o tempo todo.
:::

## Resumo

- O deslizante de TDP do menu rápido é uma fachada sobre a mesma capacidade que o `ryzenadj` expõe.
- `ryzenadj` instala-se via `pacman` após `sudo steamos-readonly disable`, e exige reaplicação após grandes atualizações.
- `ryzenadj --info` mostra STAPM (teto guiado por temperatura) e PPT (limite de potência do pacote).
- `-a`, `-b` e `-c` correspondem a STAPM limit, PPT fast e PPT slow, em miliwatts.
- `sudo ryzenadj -a 15000 -b 15000 -c 15000` trava os três limites em 15 W; ajuste o número para mudar o teto.

## Exercícios

1. Rode `sudo ryzenadj --info` e identifique os campos `STAPM LIMIT`, `PPT LIMIT FAST` e `PPT LIMIT SLOW`. Qual o valor padrão de cada um?
2. Aplique `sudo ryzenadj -a 10000 -b 10000 -c 10000` e confirme com `ryzenadj --info` que os três limites mudaram. Depois devolva o valor original.
3. Instale o `ryzenadj` via `pacman` (lembrando de destravar e retravar a raiz) e rode `ryzenadj --version` para registrar a versão.
4. Compare a saída de `ryzenadj --info` com o valor mostrado no deslizante do menu rápido. Eles batem? Explique por que podem divergir.
5. **Desafio.** Aplicando limites diferentes (por exemplo `-a 8000 -b 15000 -c 15000`), use `ryzenadj --info` repetido durante um benchmark para observar quais dos três limites o sistema respeita primeiro sob carga. Relate qual predomina e por quê.
