Agora que você já tem as ferramentas separadas e o ambiente protegido contra descargas eletrostáticas, como vimos na [seção 1](#/cap-085/sec-01), chegou a hora de colocar a mão na massa. Abrir o Steam Deck exige paciência: são oito parafusos Torx na carcaça, uma sequência de clipes de plástico que não perdoam pressa e um escudo metálico que esconde os componentes internos. Esta seção conduz você da carcaça fechada até a remoção do dissipador, preparando o caminho para trocar tela, bateria ou ventoinha.

:::objetivos
- Identificar os 8 parafusos externos e removê-los na ordem correta.
- Soltar os clipes de plástico da carcaça sem quebrá-los, usando as ferramentas adequadas.
- Localizar e remover a chapa de blindagem eletromagnética (EMI shield).
- Reconhecer a posição dos parafusos internos e do dissipador.
- Separar o heat sink da APU e inspecionar o estado da pasta térmica.
:::

## Desligando e registrando a temperatura antes de abrir

Antes de tocar em qualquer parafuso, é fundamental encerrar o sistema corretamente e registrar uma linha de base térmica. Isso ajuda você a comparar o comportamento da ventoinha depois da remontagem. Com o Steam Deck ainda fechado e ligado, abra um terminal e registre as temperaturas das zonas térmicas expostas pelo *sysfs* (sistema de arquivos virtual do kernel que expõe sensores e dispositivos):

```terminal
$ cat /sys/class/thermal/thermal_zone*/temp
41000
39000
42000
```

Os valores aparecem em milésimos de grau Celsius. Ou seja, `41000` significa `41,0 °C`. Em seguida, confira a leitura do sensor da ventoinha e dos núcleos:

```terminal
$ sensors
amdgpu-pci-0400
Adapter: PCI adapter
edge: +41.0 C

nvme-pci-0100
Adapter: PCI adapter
Composite: +38.0 C
```

Se o pacote `lm-sensors` não estiver instalado, você ainda consegue ler o RPM da ventoinha diretamente pelo *sysfs*, sem precisar instalar nada:

```terminal
$ cat /sys/class/hwmon/hwmon0/fan1_input
2300
```

Este valor corresponde à rotação atual da ventoinha, em RPM (rotações por minuto). Anote esses números antes de desligar. Agora encerre o sistema de forma limpa e desconecte o carregador:

```terminal
$ shutdown now
```

Com o aparelho desligado e sem energia, remova qualquer cartão microSD do slot inferior. Isso evita que o cartão seja danificado ou arrancado no momento em que a carcaça for separada.

## Removendo os 8 parafusos externos da carcaça

Coloque o Steam Deck sobre uma superfície plana e limpa, com a tela voltada para baixo. Os parafusos externos são do tipo Torx (sexavado interno em forma de estrela), e a ponta correta é a `T6`. Aperte suavemente para baixo ao girar, para não espanar a cabeça.

> Se você ainda não separou a chave `T6` e a espátula de plástico, volte à [seção de ferramentas](#/cap-085/sec-01).

A tabela abaixo resume a posição e a função de cada um dos oito parafusos. Use-a como roteiro enquanto trabalha.

| # | Posição | Tipo / tamanho | Observação |
|---|---------|----------------|------------|
| 1 | Canto superior esquerdo | Torx T6, 7,5 mm | Fica próximo ao botão de volume |
| 2 | Canto superior direito | Torx T6, 7,5 mm | Próximo à saída de ar |
| 3 | Centro esquerdo | Torx T6, 7,5 mm | Alinhado ao meio do corpo |
| 4 | Centro direito | Torx T6, 7,5 mm | Alinhado ao meio do corpo |
| 5 | Canto inferior esquerdo | Torx T6, 7,5 mm | Próximo ao alto-falante |
| 6 | Canto inferior direito | Torx T6, 7,5 mm | Próximo ao alto-falante |
| 7 | Centro superior | Torx T6, 7,5 mm | Atrás da tela, entre a saída de ar |
| 8 | Centro inferior | Torx T6, 7,5 mm | Atrás da tela, região central |

A ordem de remoção não é obrigatória, mas o padrão cruzado (opostos) ajuda a liberar a tensão de forma uniforme. Aplique um afrouxamento inicial de um quarto de volta em cada parafuso, seguindo o padrão em cruz, e só depois remova completamente.

Cuidado especial com o parafuso central inferior próximo ao adesivo da garantia: em algumas regiões, removê-lo pode invalidar a garantia. Verifique a legislação local antes de prosseguir, mas lembre-se de que este guia assume um reparo consciente e autorizado.

Guarde todos os parafusos em um organizador magnético ou em copinhos etiquetados. Parafusos de 7,5 mm parecem todos iguais, mas misturá-los com os internos pode causar danos no fechamento.

## Soltando os clipes de plástico da carcaça

A carcaça do Steam Deck é presa não apenas pelos parafusos, mas também por uma série de clipes (traves) de plástico moldado ao longo das bordas. Esses clipes são o ponto mais delicado de toda a desmontagem: força excessiva quebra a lingueta e deixa a carcaça folgada para sempre.

Comece pela borda superior, junto à saída de ar, e insira a ponta de uma espátula de plástico entre a carcaça dianteira e a traseira. Deslize a ferramenta com calma, fazendo uma leve alavanca, e ouça o estalo característico de cada clipe se soltando.

:::perigo
**Clipes de plástico são frágeis.** Nunca use chave de fenda de metal para forçar a separação: ela marca a carcaça e concentra força demais em um único ponto, estourando a lingueta. Se um clipe resistir, não puxe a carcaça para cima agressivamente — deslize a espátula ao longo da costura até o clipe vizinho e volte depois. Se ouvir um estalo seco seguido de pedaço solto, você quebrou um clipe; a remontagem ainda funciona, mas a vedação e o acabamento ficam comprometidos.
:::

Para ganhar confiança, você pode aquecer levemente a borda com uma almofada térmica ou ar quente em temperatura baixa (máximo 60 °C). O plástico fica menos rígido e os clipes cedem com menos esforço. Não aqueça demais, pois há componentes sensíveis e a bateria logo abaixo.

:::dica
Uma *palheta de guitarra* fina é uma ótima aliada: insira-a para manter a costura aberta enquanto a espátula avança. Assim, os clipes já soltos não reengancham quando você move a ferramenta.
:::

Ao soltar toda a periferia, a carcaça traseira deve se separar limpa e inteira. Deixe-a de lado com a face interna para cima para não riscar.

## Localizando o escudo metálico e os parafusos internos

Com a carcaça traseira removida, o que você vê não é a placa-mãe diretamente. O Steam Deck possui uma chapa metálica intermediária, o *EMI shield* (escudo contra interferência eletromagnética). Essa blindagem reduz a emissão de ruído elétrico e protege os componentes. Ela também ajuda a dissipar calor de passivo.

Antes de remover o escudo, identifique visualmente os cabos e conectores. O conector da bateria deve estar visível, e a recomendação de segurança é desconectá-lo assim que o escudo sair, para evitar curtos acidentais enquanto você mexe no interior.

O escudo é preso por um conjunto de parafusos internos menores, geralmente do tipo Phillips `PH0` ou Torx `T5`, dependendo da revisão do aparelho. Anote a posição de cada um, pois há comprimentos diferentes. Você pode registrar tudo em um arquivo de notas no seu `~/lab`:

```terminal
$ mkdir -p ~/lab/steamdeck
$ cat > ~/lab/steamdeck/parafusos.md <<'EOF'
## Registro de desmontagem - Steam Deck
- Carcaça externa: 8x Torx T6 (7,5 mm)
- EMI shield: 3x Phillips PH0 (4,0 mm) + 1x Phillips PH0 (5,0 mm)
- Dissipador: 3x Torx T5 na placa de fixação da APU
EOF
$ cat ~/lab/steamdeck/parafusos.md
## Registro de desmontagem - Steam Deck
- Carcaça externa: 8x Torx T6 (7,5 mm)
- EMI shield: 3x Phillips PH0 (4,0 mm) + 1x Phillips PH0 (5,0 mm)
- Dissipador: 3x Torx T5 na placa de fixação da APU
```

Manter esse registro ajuda na hora de remontar: o parafuso de 5,0 mm volta sempre para o mesmo furo, e um erro aqui pode perfurar algo do outro lado.

Remova os parafusos do escudo com cuidado e levante a chapa pela borda. Ela não usa clipes, mas pode estar levemente presa por uma fita condutora. Puxe em um ângulo baixo, sem dobrar a chapa.

## Removendo o dissipador e inspecionando a pasta térmica

Com o escudo fora e a bateria devidamente desconectada, localize o dissipador (*heat sink*): um conjunto de aletas de cobre conectado a um *heatpipe* (tubo de calor) que transporta o calor da APU até a ventoinha. A APU é o processador integrado que combina CPU e GPU, e fica sob uma placa de fixação metálica.

A ventoinha fica presa em um dos lados do dissipador, geralmente com parafusos Phillips `PH0`. Antes de soltar o dissipador, remova a ventoinha se ela estiver bloqueando o acesso ou se o objetivo for exatamente trocá-la. Desconecte o cabo da ventoinha puxando pelo conector, nunca pelo fio.

Os parafusos do dissipador são três, do tipo Torx `T5`, e devem ser afrouxados em padrão cruzado para liberar a pressão da pasta de forma uniforme. Ao levantar o dissipador, você encontrará a pasta térmica: um composto cinza, prateado ou branco entre a APU e a base de cobre.

:::perigo
**Pasta térmica não é condutora em todos os casos, mas algumas são.** Nunca deixe pasta escorrer para os componentes ao redor da APU. Algumas pastas com partículas metálicas são eletricamente condutoras e podem causar curto-circuito. Trabalhe com a placa na horizontal, use uma quantidade pequena de álcool isopropílico para limpar e não espalhe com os dedos. Se a pasta escorrer, limpe completamente antes de religar.
:::

Para inspecionar o estado da pasta, observe se ela está seca, rachada ou endurecida. Pasta velha perde a capacidade de preencher os microvãos entre as superfícies, elevando a temperatura. Você pode anotar a condição para decidir se aplica uma nova camada:

```terminal
$ echo "Pasta termica: seca e esfarelando, trocar." >> ~/lab/steamdeck/parafusos.md
$ cat ~/lab/steamdeck/parafusos.md
## Registro de desmontagem - Steam Deck
- Carcaça externa: 8x Torx T6 (7,5 mm)
- EMI shield: 3x Phillips PH0 (4,0 mm) + 1x Phillips PH0 (5,0 mm)
- Dissipador: 3x Torx T5 na placa de fixação da APU
Pasta termica: seca e esfarelando, trocar.
```

Para limpar a pasta antiga, aplique álcool isopropílico (idealmente 90% ou mais) em um cotonete ou pano que não solte fiapos e esfregue tanto a APU quanto a base de cobre até ficarem limpas. Deixe secar naturalmente. Na hora de aplicar a nova pasta, uma gota do tamanho de um grão de arroz no centro da APU costuma ser suficiente — a pressão da placa de fixação espalha o composto de forma uniforme.

:::nota
Após reassentar o dissipador, não é necessário executar nenhum comando especial para "reconhecer" a ventoinha: o SteamOS volta a controlá-la pelo *sysfs* automaticamente. Você poderá conferir a nova leitura mais adiante, quando religar o aparelho e comparar com a linha de base anotada no início.
:::

## Resumo
- Os 8 parafusos externos são Torx `T6` de 7,5 mm, afrouxados em padrão cruzado antes da remoção total.
- Os clipes de plástico exigem espátula e paciência; força bruta quebra a lingueta da carcaça.
- O *EMI shield* é a chapa metálica intermediária presa por parafusos internos de comprimentos distintos.
- O dissipador combina placa de cobre, *heatpipe* e ventoinha, fixado por três Torx `T5`.
- A pasta térmica seca ou rachada deve ser limpa com álcool isopropílico e reaplicada em pequena quantidade.
- Registrar as temperaturas iniciais via *sysfs* permite comparar o desempenho após a remontagem.

## Exercícios
1. Liste, em ordem de desmontagem, os quatro grandes grupos de parafusos/peças que você encontra ao abrir o Steam Deck, indicando o tipo e o tamanho de cada grupo.
2. Explique por que o afrouxamento em padrão cruzado é recomendado tanto nos parafusos externos quanto nos do dissipador, relacionando com a distribuição de pressão.
3. Crie um script em `bash` que leia a temperatura de todas as zonas térmicas em `/sys/class/thermal/thermal_zone*/temp`, converta para graus Celsius e exiba em uma linha organizada antes do desligamento.
4. Descreva o procedimento correto para soltar um clipe de plástico resistente sem quebrá-lo, citando pelo menos duas ferramentas não metálicas e o limite de temperatura recomendado.
5. **Desafio integrador:** Escreva um guia passo a passo completo, em Markdown, que leve uma pessoa do Steam Deck ligado até o dissipador removido, incluindo: os comandos de terminal para registrar a linha de base térmica, a sequência da tabela de parafusos, os cuidados com o *EMI shield* e um callout `:::perigo` sobre a pasta térmica. Ao final, inclua um checklist de remontagem em ordem inversa.
