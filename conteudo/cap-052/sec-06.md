Se a Neo Geo é a rainha dos arcades, a família CPS da Capcom é a dinastia que definiu os jogos de luta. Entre CPS-1 (1988), CPS-2 (1993) e CPS-3 (1996), saíram *Final Fight*, *Street Fighter II*, *Darkstalkers*, *Street Fighter Alpha*, *Street Fighter III* e dezenas de outros clássicos. Cada geração trouxe um salto técnico — e uma peculiaridade de emulação que vale a pena conhecer antes de montar a sua pasta.

:::objetivos
- Distinguir as três gerações CPS e suas características técnicas
- Entender a dependência do QSound nos jogos CPS-2
- Lidar com a chave de descriptografia do CPS-2
- Configurar CPS-1, CPS-2 e CPS-3 no RetroArch
- Resolver os erros mais comuns de cada geração
:::

## CPS-1: a base autocontida

O *CP System* original tem uma característica que simplifica a vida: **não depende de BIOS**. O jogo traz tudo embutido no próprio romset, então não há arquivo de sistema a instalar. Basta o `.zip` do jogo e pronto.

```terminal
$ ls ~/lab/arcade/
ffight.zip
sf2.zip
punisher.zip
```

No FBNeo e no MAME, jogos CPS-1 como *Final Fight* (`ffight`), *Street Fighter II* (`sf2`) e *The Punisher* (`punisher`) rodam sem nenhuma dependência externa. É a geração mais "à prova de erros" para iniciantes.

:::dica
Comece a sua coleção pelos CPS-1. Sem BIOS, sem chave, sem dor de cabeça: baixe, aponte o núcleo, jogue.
:::

## CPS-2: uma bateria e uma chave de criptografia

O CP System II trouxe gráficos muito melhores e o chip de som **QSound**, mas introduziu uma complicação famosa: a *placa "B"* vinha com uma **bateria** que mantinha uma tabela de descriptografia na RAM. Quando a bateria morria, a placa "esquecia" a chave e o jogo deixava de funcionar — um problema real que afetou operadores de fliperama por décadas.

A emulação resolve isso de forma limpa: os *dumps* modernos de CPS-2 vêm **já descriptografados**, eliminando a necessidade de bateria e chave. Por isso, quase nunca você precisa mexer em chave de CPS-2 hoje em dia.

```terminal
$ ls ~/lab/arcade/
sfa3.zip      # Street Fighter Alpha 3 (já descriptografado)
qsound.zip    # BIOS de som, precisa estar presente
mvsc.zip      # Marvel vs. Capcom
```

O detalhe que ainda pega é o **`qsound.zip`**: o chip QSound é emulado como um dispositivo separado, e os jogos CPS-2 esperam encontrá-lo. Sem ele, o jogo abre, o vídeo roda, mas o **áudio falha ou não carrega**.

```terminal
$ flatpak run org.libretro.RetroArch --verbose 2>&1 | grep -i qsound
[libretro ERROR] sfa3: qsound.zip not found — audio disabled
```

O `qsound.zip` precisa ficar junto dos jogos CPS-2, assim como o `neogeo.zip` fica junto dos Neo Geo.

## CPS-3: o auge e a complexidade

O CP System III levou os jogos de luta ao limite com *Street Fighter III* e sua animação fluida em 60 fps. Tecnicamente, é a geração mais complexa: usa um processador próprio (o "SH-2" da Hitachi), CD-ROM para dados e uma proteção de segurança agressiva com **bateria**.

A emulação do CPS-3 no RetroArch tem duas fases históricas:

- **NVRAM/flash**: o jogo exige um arquivo de memória não-volátil que simula a RAM da placa. Na primeira execução, o emulador "formata" essa memória, o que pode levar segundos e exige que o arquivo seja gravável.
- **CD em CHD**: as versões mais recentes usam um arquivo **CHD** (o formato de imagem de CD do MAME) com os dados de cada jogo, em vez de múltiplas ROMs.

```terminal
$ ls -la ~/lab/arcade/sfiii3/
-rw-r--r--  ana  12M  10.bin
-rw-r--r--  ana  244M sfiii3.chd
```

O arquivo `.chd` é grande — centenas de megabytes para os jogos de *Street Fighter III*. É ele que contém os dados de vídeo e áudio em alta qualidade.

:::atencao
Jogos CPS-3 exigem espaço e paciência na primeira execução. Se o jogo parecer travado nos primeiros segundos com tela preta, pode ser a gravação da NVRAM inicial — não force o encerramento aguardando alguns instantes.
:::

## Quais núcleos usar para cada CPS

| Geração | FBNeo | MAME | Dependências |
|---|---|---|---|
| CPS-1 | Excelente | Excelente | nenhuma |
| CPS-2 | Excelente | Excelente | `qsound.zip` |
| CPS-3 | Excelente | Bom | CHD + NVRAM inicial |

Para CPS-1 e CPS-2, o FBNeo é a escolha natural no Steam Deck: leve, rápido e com menos input lag — essencial para jogos de luta. Para CPS-3, ambos funcionam bem, com leve vantagem de performance para o FBNeo.

```terminal
$ flatpak run org.libretro.RetroArch --verbose 2>&1 | grep -i "sfiii"
[INFO] fbneo: sfiii3 loaded, cdrom chd present
```

## Resumo

- CPS-1 é autocontida, sem BIOS, e é a geração mais simples de configurar.
- CPS-2 depende do `qsound.zip` para o áudio; o vídeo funciona sem ele.
- Os dumps modernos de CPS-2 já vêm descriptografados, eliminando o problema da bateria.
- CPS-3 usa arquivos CHD grandes e grava NVRAM na primeira execução, o que pode parecer travamento.
- FBNeo é o núcleo preferível para as três gerações no Steam Deck.

## Exercícios

1. Rode um jogo CPS-2 sem o `qsound.zip` e confirme no log que o vídeo carrega mas o áudio é desativado.
2. Compare o tamanho em disco de um CPS-3 (com CHD) com um CPS-1 usando `du -sh` e explique a disparidade técnica.
3. Liste os arquivos de um romset CPS-2 com `unzip -l` e identifique se ele já vem descriptografado (procure indicativos no nome ou na documentação).
4. Configure *Final Fight* (CPS-1) e *Street Fighter Alpha 3* (CPS-2) no mesmo núcleo e detalhe a diferença de dependências entre eles.
5. **Desafio.** Pesquise a história da "bateria CPS-2" e explique por que a solução da comunidade (descriptografar o ROM set) mudou para sempre a forma como esses jogos são preservados — e como isso se reflete na ausência de `neogeo.zip`-like para CPS-1.