Undervolting e overclock mexem com margens que o fabricante definiu por um motivo. Esta última seção não traz novos comandos — ela trata das consequências: o que pode dar errado, o que a garantia cobre, e como voltar atrás quando um ajuste deixar o Deck sem boot. O conhecimento de como recuperar é o que separa um ajuste ousado de uma aposta irresponsável.

:::objetivos
- Reconhecer os riscos reais de cada tipo de ajuste (potência, tensão, clock, ventoinha)
- Entender a posição oficial da Valve sobre modificações e garantia
- Reverter configurações de BIOS quando o Deck não dá boot
- Recuperar de um brick aparente com o reset de NVRAM/BIOS
:::

## O mapa de riscos

Nem todo ajuste é igualmente arriscado. Organize assim:

| Ajuste | Risco | Pior consequência |
|---|---|---|
| PPT/TDC/EDC até 25 W | Baixo-moderado | Desgaste térmico acelerado do silício a longo prazo |
| Undervolting leve (−5 a −15) | Baixo | Instabilidade, corrupção silenciosa de dados se exagerado |
| Undervolting agressivo (−20+) | Moderado-alto | Corrupção de sistema de arquivos, perda de dados |
| Overclock iGPU até 1800 MHz | Moderado | Encolhimento da vida útil, throttling, artefatos |
| Overclock iGPU acima de 2000 MHz | Alto | Degradação permanente, falha precoce da GPU |
| Curva de ventoinha (PWM < 15%) | Moderado | Travamento do motor, superaquecimento por falha de resfriamento |

O denominador comum dos danos **permanentes** é calor e tensão excessivos. As falhas reversíveis (brick de boot, instabilidade) têm recuperação; o desgaste de silício não.

:::nota
"Brick" é um termo do jargão que descreve um aparelho que não liga nem entra em BIOS — vira um tijolo. No Steam Deck, um brick total por ajuste de BIOS é raro, porque a gravação de NVRAM pode ser revertida por hardware.
:::

## Garantia: o que a Valve diz

A Valve historicamente adota uma postura permissiva com modificações de software — ela até publica esquemas e suporta M.2 upgrades. Mas o overclock/undervolting de hardware é zona cinzenta:

- Ajustar via **software** (RyzenAdj) não deixa marca permanente: a garantia normalmente não é afetada.
- Gravar na **NVRAM da BIOS** (Smokeless UMAF) também é reversível, mas é indiscutivelmente "modificação de firmware".
- Danos causados **por calor excessivo** (silício degradado, solda BGA trincada) podem ser atribuídos ao uso inadequado e ter a garantia negada.

:::atencao
A garantia cobre defeitos de fabricação, não danos autoinfligidos. Se um overclock de 30 W fundir a solda do chip, a Valve pode — legitimamente — recusar a cobertura. Mantenha os ajustes dentro dos 25 W para não cruzar essa linha.
:::

## Revertendo configurações de BIOS

A forma mais limpa de reverter é pelo próprio Smokeless UMAF: no menu, use **Restore Defaults** (ou `F9` em muitas revisões) e grave com `F10`. Isso restaura os valores de fábrica de PPT, Curve Optimizer, clock de GPU e ventoinha de uma só vez.

```text
Smokeless UMAF → Exit → Load Setup Defaults → Save & Exit (F10)
```

Depois do reboot, confirme que os defaults voltaram de verdade:

```terminal
$ ryzenadj -i | grep -E "STAPM LIMIT|TDC LIMIT|EDC LIMIT|TEMP"
STAPM LIMIT:  15.000 W
TDC LIMIT VDD: 10.000 A
EDC LIMIT VDD: 150.000 A
TEMP: 44.0 C
```

Os três valores clássicos de fábrica (15 W / 10 A / 150 A) funcionam como âncora: se eles voltaram, a reversão foi completa e você pode recomeçar do zero com segurança.

## Quando o Deck não liga: reset de NVRAM

Se um ajuste deixou o sistema sem vídeo ou sem boot, o reset de NVRAM por hardware é o recurso de emergência. O procedimento varia por modelo, mas no Deck envolve abrir o aparelho e desconectar a bateria por alguns minutos, ou usar uma combinação de teclas durante o boot.

O primeiro passo, antes de abrir o aparelho, é forçar o reset de ECM/BIOS segurando **Volume +** e o **Botão Power** por 12-15 segundos, com o carregador conectado. Muitos estados travados são resolvidos assim.

Se o reset por teclas funcionar, o Deck volta a ligar e o `dmesg` mostra o boot partindo do zero, sem os ajustes problemáticos:

```terminal
$ sudo dmesg | head -5
[    0.000000] Linux version 6.8.0-valve45 (debian) (...)
[    0.000000] Command line: BOOT_IMAGE=/vmlinuz root=... ro
[    0.000000] BIOS-provided physical RAM map:
[    0.000000] BIOS-e820: [mem 0x0000000000000000-0x000000000009ffff] usable
[    1.204118] amdgpu: kernel modesetting enabled
```

Repare no `amdgpu: kernel modesetting enabled`: é o driver da iGPU assumindo normalmente. Se o display ainda estiver apagado mesmo com o boot completo, o problema não é a NVRAM, e sim um clock de GPU gravado incompatível com o painel — reflashe os defaults pelo Smokeless UMAF em um monitor externo via dock.

:::perigo
Abrir o Steam Deck para desconectar a bateria anula boa parte da facilidade de garantia e envolve risco de danificar o conector da bateria na remontagem. Só faça isso como último recurso, com o aparelho fora da tomada, e após esgotar o reset por teclas.
:::

## Recuperando o sistema de arquivos

Se o undervolt corrompeu o sistema de arquivos do SteamOS (panics de kernel durante escrita), o boot pode falhar com erro de `rootfs`:

```text
ERROR: Failed to mount root filesystem
```

A recuperação segue três níveis:

1. **Boot no kernel anterior**: no menu de boot (Volume − ao ligar), escolha uma entrada mais antiga do kernel.
2. **Chkdsk/fsck**: a partir de um USB de recuperação, rode `fsck` na partição raiz.
3. **Reinstalação**: reflashe o SteamOS com a imagem de recuperação oficial, preservando `/home` se possível.

```terminal
# fsck -y /dev/nvme0n1p2
fsck from util-linux 2.39
/dev/nvme0n1p2: recovering journal
/dev/nvme0n1p2: clean, 123456/8388608 files
```

## A regra de ouro

Antes de qualquer modificação de BIOS, anote os valores de fábrica (você fez isso na seção 1). Basicamente: **nunca** grave um ajuste sem saber exatamente como voltar ao estado anterior. O Smokeless UMAF facilita restaurar defaults, mas só se você souber reconhecer o que é default.

## Resumo

- Riscos variam: potência/tensão conservadoras são reversíveis; calor e tensão excessivos causam dano permanente.
- Ajustes por software raramente afetam a garantia; gravação de firmware e danos por calor podem.
- Reversão limpa via `Load Setup Defaults` no Smokeless UMAF restaura tudo de uma vez.
- Sem boot: tente reset por teclas (Volume + + Power por 12-15s) antes de abrir o aparelho.
- Sempre anote os valores de fábrica antes de mexer — sabendo reverter, o risco vira controlado.

## Exercícios

1. Liste, para cada ajuste que você fez neste capítulo, o valor de fábrica e o valor final. Confirme que consegue reverter cada um ao default.
2. Execute o `Load Setup Defaults` no Smokeless UMAF e confirme com `ryzenadj -i` que os valores voltaram aos defaults de fábrica. Depois reaplique seu perfil final.
3. Pesquise no fórum oficial da Valve a postura atual sobre modificações de BIOS e resuma em duas frases se isso afeta ou não a garantia.
4. Crie um "diário de tuning": um arquivo `.md` registrando data, valores aplicados, teste realizado e resultado. Explique por que esse histórico é útil na recuperação.
5. **Desafio.** Escreva um plano de contingência completo de uma página: o que você faria em ordem, e em que momento, se (a) o Deck travasse em carga, (b) não desse boot, (c) corrompesse o sistema de arquivos, e (d) a ventoinha parasse. Para cada cenário, indique a ferramenta e o custo (tempo/risco). Integre tudo o que aprendeu neste capítulo.