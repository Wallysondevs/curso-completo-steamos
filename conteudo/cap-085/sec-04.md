Trocar a bateria do Steam Deck é a etapa mais delicada de todo o processo de manutenção. Diferente da tela ou da ventoinha, que são componentes rígidos e tolerantes a manuseio, a célula de lítio exige paciência, ferramentas adequadas e uma postura cuidadosa. Nesta seção, você vai remover a bateria antiga, inspecionar e instalar a unidade nova e, por fim, conferir o estado de saúde da peça usando as ferramentas que o SteamOS já oferece.

Antes de começar, assumimos que você já concluiu a desconexão da bateria, descrita em [`#/cap-085/sec-03`](#/cap-085/sec-03). Se o conector ainda estiver ligado à placa-mãe, volte uma seção e execute a desconexão completa. Trabalhar com a célula energizada enquanto mexe nos parafusos da moldura é um convite a um curto-circuito.

:::objetivos
- Remover a bateria antiga sem dobrar ou perfurar as células de lítio
- Soltar a fita adesiva e os parafusos da moldura com segurança
- Verificar a referência e as especificações da bateria nova antes da instalação
- Reinstalar e reconectar a bateria seguindo a ordem inversa da desmontagem
- Consultar a saúde da bateria no SteamOS com `upower` e `sysfs`
:::

---

## Removendo a moldura e a fita adesiva

A bateria original do Steam Deck não vem aparafusada diretamente no chassi por células; ela fica presa por uma combinação de parafusos na moldura plástica e uma fita adesiva de alta aderência. Para acessá-la por completo, primeiro retire os parafusos que fixam a moldura metálica ou plástica ao redor da célula.

Use uma chave Phillips PH0 ou PH00 e um spudger de plástico. Separe os parafusos por tamanho em um organizador magnético, pois alguns modelos misturam comprimentos milimétricos na mesma região.

```terminal
$ ls ~/lab/bateria/
parafusos_moldura.jpg  fita_adesiva.jpg  bateria_nova.jpg
## Anote a posição de cada parafuso antes de soltar
$ ls -1 ~/lab/bateria/
parafusos_moldura.jpg
fita_adesiva.jpg
bateria_nova.jpg
```

Com a moldura solta, você verá a fita adesiva (em inglês, *adhesive strip* ou *pull tab*) que segura a célula contra o chassi. Em muitos lotes, essa fita possui uma aba de puxar que facilita a remoção. Na prática, porém, a aba costuma rasgar, e o adesivo precisa ser trabalhado com um cartão plástico ou uma cunha.

:::perigo
Nunca perfure, dobre, torça ou use ferramentas metálicas pontiagudas diretamente sobre as células de lítio. Uma célula danificada pode sofrer **fuga térmica** (*thermal runaway*), reação em cadeia que libera calor intenso, gases inflamáveis e pode causar fogo. Se a bateria estiver inchada, pare imediatamente, isole o equipamento em local ventilado e procure descarte especializado.
:::

O adesivo deve ser solto devagar, com pressão constante e paralela ao chassi. Nunca alavanque de baixo para cima usando a célula como apoio, pois isso concentra força em um ponto da camada de lítio.

```terminal
## Não execute: espetar a célula com chave de fenda
## Correto: deslizar uma cunha de plástico sob a fita, rente ao chassi
$ echo "Solte o adesivo com cunha plástica, devagar"
Solte o adesivo com cunha plástica, devagar
```

Ao sentir a célula descolar por inteiro, levante-a segurando pelas bordas — nunca pelo centro — e apoie-a sobre uma superfície não condutora. Se possível, mantenha o nível de carga entre 30% e 50% antes da remoção: células parcialmente carregadas são menos energéticas e mais seguras para manusear e armazenar.

---

## Verificando a bateria nova

Antes de instalar a peça de reposição, confirme que ela corresponde exatamente à referência original do seu aparelho. O Steam Deck LCD e o OLED usam baterias com capacidades e tensões diferentes, e misturá-las pode causar falha de carregamento ou dano à placa.

A tabela abaixo resume as características típicas da bateria original (LCD), para comparação com a etiqueta da peça nova.

| Característica | Valor típico (LCD) |
| --- | --- |
| Capacidade | 40,04 Wh (aprox. 5200 mAh) |
| Tensão nominal | 7,7 V |
| Célula | 2S1P (duas células em série) |
| Conector | Flat connector proprietário Valve |

Confira se a referência impressa no corpo da bateria nova bate com a da antiga e se o conector tem o mesmo número de polos e o mesmo passo entre contatos. Uma bateria com conector parecido, porém de outro fornecedor, pode ter a pinagem invertida.

```terminal
$ cat ~/lab/bateria/ref_original.txt
Referência: 603635-2S
Capacidade: 5200 mAh / 40,04 Wh
Tensão: 7,7 V
$ cat ~/lab/bateria/ref_nova.txt
Referência: 603635-2S
Capacidade: 5200 mAh / 40,04 Wh
Tensão: 7,7 V
## Referências iguais: bateria compatível com o modelo
```

:::nota
Alguns lotes de reposição trazem a fita adesiva já aplicada ou um adesivo dupla-face novo na embalagem. Se a sua peça não incluir adesivo, compre uma fita de dupla face fina e resistente a calor, própria para eletrônicos, e recorte no mesmo formato da original.
:::

---

## Instalando e reconectando a bateria

A instalação é o espelho da remoção. Posicione a célula no berço do chassi sem forçar e aplique o adesivo novo de forma uniforme. Depois, recoloque a moldura e os parafusos, respeitando o mapa que você registrou na desmontagem.

A reconexão elétrica também segue a ordem inversa da seção anterior: encaixe o conector da bateria na placa-mãe por último, com pressão suave e perpendicular. Um clique ou um assentamento firme deve indicar que o conector travou.

```terminal
## Ordem de montagem (reversa da desmontagem)
## 1. assentar a célula      2. aplicar adesivo
## 3. recolocar a moldura    4. aparafusar
## 5. reconectar a bateria   6. fechar o chassi traseiro
$ echo "Conector da bateria reconectado por último"
Conector da bateria reconectado por último
```

Antes de fechar tudo, ligue o aparelho rapidamente para validar a carga. Se o Steam Deck não responder, reconfira o conector da bateria e a conexão do cabo de força.

---

## Consultando a saúde da bateria no SteamOS

Depois da troca, o SteamOS precisa de alguns ciclos de carga para calibrar a leitura de capacidade. Você pode acompanhar o estado interno da célula por dois caminhos equivalentes: o comando `upower`, que resume as informações em formato amigável, e o sistema de arquivos virtual `sysfs`, em `/sys/class/power_supply`.

O `upower` lê os dados do daemon de energia e exibe campos como `capacity` (capacidade atual em porcentagem), `energy-full` e `cycle-count`. Em um terminal do modo Desktop, execute:

```terminal
$ upower -i /org/freedesktop/UPower/devices/battery_BAT1
  native-path:          BAT1
  vendor:               Valve
  model:                Steam Deck Battery
  serial:               1234
  power supply:         yes
  updated:              sex 06 jun 2025 14:32:11 -03 (12 seconds ago)
  has history:          yes
  has statistics:       yes
  battery
    present:             yes
    rechargeable:        yes
    state:               charging
    energy:              32,44 Wh
    energy-empty:        0 Wh
    energy-full:         39,87 Wh
    energy-full-design:  40,04 Wh
    energy-rate:         12,31 W
    voltage:             8,12 V
    charge-cycles:       412
    percentage:          81%
    capacity:            99,5%
```

Note o campo `capacity`: ele compara `energy-full` com `energy-full-design`. Numa célula nova, esse valor deve ficar próximo de 100%. O `charge-cycles` mostra quantos ciclos completos de carga o firmware registra para aquela peça instalada.

A mesma informação aparece em arquivos do `sysfs`. Esse caminho é útil para scripts e para o plugin que você verá em seguida.

```terminal
$ cat /sys/class/power_supply/BAT1/capacity
81
$ cat /sys/class/power_supply/BAT1/charge_full
39870000
$ cat /sys/class/power_supply/BAT1/cycle_count
412
$ cat /sys/class/power_supply/BAT1/status
Charging
```

Perceba que `charge_full` está em microampère-hora (aqui `39870000` equivale a cerca de 39,87 Wh, dependendo da tensão). Os valores variam conforme o hardware e o firmware, então use-os como referência relativa, não como verdade absoluta da etiqueta.

## Utilizando o plugin PowerTools no Decky Loader

Se você usa o **Decky Loader**, o plugin **PowerTools** oferece uma interface gráfica para ajustar limites de TDP e também expõe leituras da bateria e do consumo. Ele não substitui o `upower`, mas facilita o monitoramento rápido durante o jogo.

A instalação é feita no modo Desktop, pelo instalador do Decky Loader, e o plugin passa a aparecer no menu rápido (botão `[[Steam]]` ou `[[QAM]]`). Vale lembrar que o PowerTools ajusta parâmetros de energia do sistema; a leitura de saúde da bateria é apenas uma das informações que ele agrega.

:::info
Para uma calibração completa após a troca — descarregar até o desligamento, carregar até 100% com o aparelho desligado e repetir uma ou duas vezes — veja o passo a passo em [`#/cap-085/sec-09`](#/cap-085/sec-09). A calibração ajuda o firmware a reaprender a curva de carga da célula nova.
:::

---

## Resumo

- A bateria é presa por parafusos da moldura e fita adesiva, que deve ser solta com cunha plástica, sem dobrar ou perfurar as células.
- Células de lítio danificadas podem entrar em fuga térmica e causar fogo; remova a peça segurando pelas bordas, com carga parcial e sobre superfície não condutora.
- A bateria de reposição precisa ter a mesma referência, capacidade, tensão e conector da original para evitar danos à placa.
- A montagem segue a ordem inversa da desmontagem, com reconexão elétrica da bateria feita por último.
- `upower` e `/sys/class/power_supply` revelam `capacity`, `energy-full` e `cycle_count` para acompanhar a saúde da célula nova.

## Exercícios

1. Liste os parafusos e componentes envolvidos na fixação da bateria e descreva a ordem segura para soltar o adesivo.
2. Usando `upower -i` na bateria do seu aparelho (ou um exemplo fornecido), identifique `energy-full-design`, `energy-full` e calcule a porcentagem de capacidade.
3. Interprete os valores de `charge_full` e `cycle_count` lidos em `/sys/class/power_supply/BAT1` e explique por que `charge_full` aparece em unidade diferente da etiqueta.
4. Explique o risco de fuga térmica e o que fazer se a bateria estiver inchada durante a remoção.
5. **Exercício integrador:** considerando as seções [`#/cap-085/sec-03`](#/cap-085/sec-03) e [`#/cap-085/sec-09`](#/cap-085/sec-09), produza um roteiro completo de troca da bateria, incluindo desconexão, remoção, verificação da peça nova, instalação, reconexão e calibração pós-troca, citando os comandos de leitura de saúde que você usaria em cada etapa.
