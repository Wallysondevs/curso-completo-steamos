Todo reparo decente começa na bancada, não no aparelho. O Steam Deck usa parafusos pequenos, conectores frágeis e superfícies sensíveis à estática — e cada uma dessas características exige uma ferramenta específica. Comprar o conjunto certo (e saber usá-lo) evita a maioria dos desastres de reparo: parafuso espanado, cabo rompido e componente queimado por ESD.

:::objetivos
- Conhecer os parafusos usados no Deck e as chaves corretas para cada um
- Diferenciar chave Philips de JIS e entender por que isso importa
- Reunir ferramentas não destrutivas (spudgers, pinças, ventosa)
- Montar uma bancada antiestática (ESD) mínima
- Preparar organização de parafusos e registro do processo
:::

## Os parafusos do Deck

O Steam Deck usa, majoritariamente, parafusos **Phillips #00 e #0** na carcaça e nos módulos internos, mais alguns **Torx** (comumente T6) nos modelos OLED ou em pontos específicos. Parafusos da tampa traseira do LCD são Phillips; o SSD usa um Phillips curto; o escudo térmico usa Phillips #0.

Usar a ponta errada é a causa número um de "parafuso espanado" (a cabeça arredonda e a chave escorrega, travando tudo). A regra de ouro: a ponta deve preencher o encaixe sem folga lateral.

```terminal
$ ls /proc/bus/input/devices | wc -l
```

Antes de tocar em parafuso, vale entender que você vai trabalhar com o aparelho **desligado e aberto**; alguns comandos de diagnóstico (como inspecionar `/proc/bus/input/devices` para checar sticks e botões) são parte da prep. Mas a bancada em si começa com as chaves.

## Philips vs JIS — a diferença que ninguém conta

Parafusos japoneses usam o padrão **JIS**, que tem o fundo do encaixe mais reto. Uma chave Philips, que é mais pontuda, *não assenta* perfeitamente num parafuso JIS e tende a "cam-out" (sair do encaixe) sob torque. Muitos parafusos de eletrônicos, inclusive do Deck, beneficiam de chaves JIS ou de Philips de alta precisão com ponta correta.

```terminal
$ cmpd() { printf '%s\n' "PH00  -> tampa traseira/ssd"; printf '%s\n' "PH0   -> modulos internos"; printf '%s\n' "T6    -> pontos OLED"; }
$ cmpd
PH00  -> tampa traseira/ssd
PH0   -> modulos internos
T6    -> pontos OLED
```

Na prática, um *kit* de precisão com bits PH000, PH00, PH0, T4–T8, e pentalobe (para eventuais peças) cobre todo o Deck. Kits baratos (iFixit Essential ou similares) já trazem isso; o investimento é pequeno perto do custo de uma peça estragada.

:::dica
Aplique torque baixo e constante. Parafusos do Deck têm aperto leve — se você precisa "forçar", parou na hora errada: ou a ponta não é a certa, ou o parafuso está cross-thread (enroscando torto).
:::

## Ferramentas não destrutivas

As ferramentas de abertura são tão importantes quanto as chaves:

- **Spudger** (alavanca de plástico) — para soltar clipes e desconectar cabos flat sem riscar.
- **Picareta plástica / "opening pick"** — para abrir adesivo e contornar a tampa.
- **Ventosa** — para levantar a tela (troca de display).
- **Pinça antiestática** (de precisão, ponta reta e curva) — para cabos flat e parafusos caídos.
- **Pistola de ar quente / secador** — para amolecer o adesivo da tela e da bateria.

```terminal
$ file /dev/nvme0n1
/dev/nvme0n1: block special
```

Nada disso é específico de Linux, mas a disciplina de *não usar objetos metálicos improvisados* (faca, chave de fenda de ponta chata usada como alavanca) é universal. Metal risca a carcaça, fura cabos e pode curto-circuitar a placa.

:::atencao
Jamais use faca ou chave de fenda como alavanca na tampa do Deck. Você vai marcar o plástico e, pior, pode cortar um flat cable que passa perto da borda. Spudger e picareta de plástico custam centavos e se pagam na primeira abertura.
:::

## Bancada antiestática (ESD)

Eletricidade estática destrói semicondutores silenciosamente — o componente pode morrer dias depois. Numa bancada mínima você reduz o risco a quase zero:

1. Trabalhe sobre superfície não condutora limpa, sem carpete.
2. Use **pulseira antiestática** aterrada (ou toque num metal aterrado antes de pegar a placa).
3. Segure placas pelas bordas, nunca pelos chips.
4. Evite roupas de lã e ambiente muito seco.

```terminal
$ sudo smartctl -a /dev/nvme0n1 | grep -i temperature
```

Este comando (do `smartctl`) é um exemplo de checagem *antes* de abrir: registrar a temperatura e o estado do SSD agora ajuda a comparar depois. Guarde uma "foto de saúde" de cada subsistema antes da intervenção.

## Organização de parafusos

O Deck tem parafusos de comprimentos parecidos mas *diferentes por posição*. Misturá-los pode fazer um parafuso comprido furar algo do outro lado.

```terminal
$ mkdir -p ~/reparo-deck && cd ~/reparo-deck
$ for i in tampa ssd fan bateria sticks tela; do mkdir -p "$i"; done
$ find . -type d
.
./tampa
./ssd
./fan
./bateria
./sticks
./tela
```

Use um **tapete magnético** ou copos descartáveis etiquetados com a etapa e a posição (ex.: "tampa — canto sup. esq."). Tire foto do parafuso *dentro* do furo antes de remover, para mapear qual comprimento vai onde.

:::dica
Se não tem tapete magnético, uma caixa de ovos vazia funciona: cada célula vira um "furo" numerado na ordem em que você removeu os parafusos. Remontagem é o caminho inverso.
:::

## Checklist da bancada

Antes de qualquer abertura:

- [ ] Chaves de precisão (PH00/PH0/T6) com cabo com grip
- [ ] Spudger + picareta + pinça + ventosa
- [ ] Pulseira antiestática
- [ ] Tapete magnético ou caixa de ovos etiquetada
- [ ] Guia oficial (iFixit/Valve) aberto em tela separada
- [ ] Luz forte + lanterna de cabeça
- [ ] Câmera para registrar cada passo
- [ ] Bateria do Deck descarregada a < 25% (reduz risco em caso de curto)

Com a bancada pronta, o próximo passo é a abertura segura — o tema da seção 3.
