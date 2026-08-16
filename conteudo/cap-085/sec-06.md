A substituição do display do Steam Deck é uma das operações mais delicadas do reparo — e também uma das que mais assustam, porque o painel de vidro colado não perdoa descuidos. Antes de avançar, é fundamental que você já tenha aberto o console conforme descrito na seção [sec-02](#/cap-085/sec-02), desconectado a bateria (etapa de segurança obrigatória) e removido os componentes periféricos que bloqueiam o acesso à dobradiça do flat cable da tela. Esta seção cobre exclusivamente a remoção física do painel colado à moldura (midframe) e a instalação do novo display — a parte elétrica do conector LCD/OLED ficará detalhada na seção [sec-07](#/cap-085/sec-07).

:::objetivos

- Diferenciar os tipos de painel (LCD original vs. OLED da revisão) e os adesivos utilizados em cada geração
- Aplicar calor controlado para amolecer o adesivo sem danificar o vidro nem a placa-mãe
- Soltar o display com palhetas e espátulas específicas, preservando o digitizador
- Limpar a moldura do midframe para receber a nova fita adesiva
- Alinhar e fixar o painel novo com fita pré-cortada ou adesivo líquido B7000

:::

## Primeiro contato com o display: LCD versus OLED

O Steam Deck original (modelos LCD, lançados em 2022) emprega um painel IPS de 7 polegadas com resolução nativa de 1280x800 px, colado à moldura por fita adesiva dupla-face preta de fabricação Tesa — uma fita relativamente espessa, com cerca de 1,0 mm de largura, que exige calor entre 70 °C e 80 °C para amolecer. Já o Steam Deck OLED (2024) traz painel de 7,4 polegadas com resolução 1280x800 (mesma área útil, porém com margens reduzidas e suporte a HDR) e utiliza uma fita adesiva mais fina, frequentemente translúcida, que amolece em temperaturas ligeiramente menores (60 °C a 70 °C). Ambos os painéis têm o vidro colado diretamente ao digitizador (toque capacitivo), o que significa que qualquer flexão excessiva pode trincar a camada externa — e, no caso do OLED, o próprio painel orgânico é ainda mais sensível à pressão localizada.

| Característica | LCD (original) | OLED (revisão) |
|---|---|---|
| Diagonal | 7,0" | 7,4" |
| Resolução | 1280 x 800 | 1280 x 800 (HDR) |
| Adesivo típico | Tesa preta, ~1,0 mm | Fita translúcida, <0,8 mm |
| Temperatura de amolecimento | 70–80 °C | 60–70 °C |
| Sensibilidade à pressão | Média (vidro IPS) | Alta (painel orgânico) |

:::atencao

Consulte a etiqueta de serviço ou o número de peça (`F7A` para LCD, `F7B` ou `F7C` para OLED) antes de comprar a tela substituta. Um painel OLED **não** encaixa mecanicamente em uma carcaça de LCD e vice-versa — as dobradiças do flat cable também são diferentes.

:::

## Equipamentos e materiais necessários

Você vai precisar de:

- Fonte de calor controlada: estação de ar quente com bocal retangular, manta térmica de silicone (recomendada para OLED) ou iOpener (almofada de gel aquecível para uso doméstico)
- Termômetro infravermelho ou, no mínimo, um termopar de contato para conferir a temperatura da moldura
- Espátula de abertura fina (tipo iSesamo) e palhetas de plástico (azuis, tipo iFlex) — 4 ou 5
- Ventosa com argola (para levantar levemente o vidro após o amolecimento inicial)
- Pinça de ponta fina e reta
- Álcool isopropílico (IPA) 99% e pano de microfibra
- Alicate de corte rente (flush cutter) para remover rebarbas de adesivo
- Fita adesiva pré-cortada específica para Steam Deck LCD ou OLED (disponível em kits iFixit ou lojas especializadas) ou, alternativamente, um tubo de B7000 (adesivo líquido transparente de cura por evaporação)
- Luvas de látex ou nitrílica (o B7000 é irritante para a pele, e as digitais ficam no vidro)

:::dica

Os kits de fita pré-cortada economizam muito tempo e garantem alinhamento perfeito. Se optar pelo B7000, tenha paciência — a cura completa leva de 24 a 48 horas, e o console **não pode ser ligado** nesse período (umidade residual pode migrar para os contatos do flat).

:::

## Aquecendo e soltando o painel antigo

Antes de tudo, posicione o Steam Deck com a tela para cima sobre uma superfície plana, limpa e levemente acolchoada (um tapete de silicone de bancada é ideal). Se o vidro já estiver trincado, cubra a área com fita adesiva de embalagem transparente — isso evita que estilhaços voem durante a remoção e protege seus dedos.

#### Passo a passo do aquecimento

1. Ajuste a fonte de calor para a temperatura indicada conforme o tipo de painel (tabela acima). Se estiver usando manta térmica, posicione-a sobre a tela e aguarde o ciclo indicado pelo fabricante (geralmente 3 a 5 minutos). Com pistola de ar, mantenha distância de 10 cm e mova o bocal continuamente ao longo das bordas por cerca de 2 minutos.

2. Faça um teste de temperatura na borda inferior esquerda com a ponta do dedo (com luva): você deve sentir a moldura desconfortavelmente quente, mas não a ponto de queimar instantaneamente. Meça com o termômetro — acima de 85 °C você entra na zona de risco de delaminação do painel.

:::perigo

Jamais ultrapasse 90 °C na superfície do vidro. O calor excessivo pode delaminar as camadas internas do display (separação do polarizador, morte de pixels no OLED, deformação da backlight no LCD) e, pior, pode transferir energia térmica através do midframe para a placa-mãe, danificando componentes BGA como o APU e os módulos de memória. Se o vidro começar a emitir estalos altos, interrompa imediatamente — isso indica dilatação diferencial entre o vidro e a moldura, e o painel pode trincar de forma explosiva.

:::

3. Com a ventosa fixada no canto superior esquerdo (ou no lado oposto ao flat cable, que sai pela borda inferior no LCD e pela borda direita no OLED), puxe **levemente** para criar uma fresta de frações de milímetro. Não force — se o adesivo não ceder, reaqueça por mais 30 segundos.

4. Insira a ponta da espátula metálica (iSesamo) **apenas** o suficiente para romper a tensão superficial do adesivo e, imediatamente, substitua-a por uma palheta plástica. A espátula metálica jamais deve deslizar sobre a borda do vidro — ela risca a pintura da moldura e pode lascar o painel.

5. Com a primeira palheta inserida, vá deslizando uma segunda palheta ao longo da borda superior, mantendo a primeira no lugar (ela impede que o adesivo "cole de volta"). A técnica é "zíper" — sempre uma palheta à frente da outra, injetando calor pontualmente onde sentir resistência.

6. Contorne as laterais e, por último, a borda onde sai o flat cable. Nessa borda, reduza a profundidade da palheta à metade para não atingir o conector ou rasgar o flex.

Ao liberar todas as bordas, não levante o painel como uma porta — ele ainda pode estar preso por adesivo residual no centro (raro, mas acontece em unidades que já sofreram reparo anterior com cola líquida). Nesse caso, aqueça o centro com movimentos circulares amplos e use fio dental ou linha de pesca (0,2 mm) deslizando entre o painel e a moldura.

## Limpando a moldura para a nova tela

Com o painel removido, coloque-o imediatamente em local seguro, com a face para baixo sobre um pano limpo. Agora você tem diante de si a moldura do midframe, que provavelmente exibe restos de adesivo preto e, nos cantos, acúmulo de poeira que se infiltrou ao longo dos meses de uso.

```terminal
## Remoção do adesivo residual
$ ls ~/lab/ferramentas/
alcool-isopropilico-99.tool  pinca-reta.tool  pano-microfibra.tool
$ # Aplique IPA na borda e deixe agir 30 segundos
$ # Em seguida, raspe com a pinça (nunca com estilete!)
$ # Conferindo limpeza visual:
$ ls /tmp/display-repair/
clean-before.log
$ cat /tmp/display-repair/clean-before.log
adesivo: presente nos 4 cantos
rebarba: borda inferior direita (0.3 mm)
```

Use a pinça de ponta fina para "beliscar" e puxar o adesivo velho — ele sai em tiras quando amolecido por IPA. Evite estiletes ou lâminas metálicas diretamente sobre o plástico do midframe, porque qualquer sulco gera um ponto de desnível que o novo adesivo não conseguirá compensar. Passe um pano umedecido com IPA em todas as bordas e aguarde 2 minutos para secagem completa.

```terminal
## Verificação final de limpeza
$ cat /tmp/display-repair/clean-after.log
adesivo: nenhum
rebarba: removida
superficie: lisa e seca
```

## Aplicando o adesivo e fixando a tela nova

Posicione o painel novo (ainda com o plástico protetor do adesivo) sobre a moldura, **sem colar**, para testar o alinhamento. As margens devem ser simétricas — se houver desvio, confira se o flat cable não está dobrado embaixo do painel.

#### Opção 1: fita pré-cortada

1. Remova o liner (película protetora) de um dos lados da fita e aplique-a na moldura, começando pelo canto onde o flat cable se dobra. Pressione com os dedos por 10 segundos em cada trecho de 3 cm.
2. Remova o liner do lado exposto da fita.
3. Passe o flat cable pela fenda da dobradiça (não conecte ainda — isso é assunto da [sec-07](#/cap-085/sec-07)).
4. Alinhe o painel, descanse-o sobre a fita e, com pressão uniforme, percorra todas as bordas com os polegares durante 30 segundos contínuos.

#### Opção 2: B7000

1. Aplique um cordão fino (1 mm de diâmetro) do adesivo ao longo de toda a canaleta da moldura. Não forme poças — o excesso pode escorrer para o backlight ou para o conector do flat.
2. Posicione o painel e corrija o alinhamento nos primeiros 2 minutos (a cola ainda permite deslizamento).
3. Coloque pesos distribuídos (livros, sacos de arroz) sobre a tela e deixe curar por **24 a 48 horas** em ambiente ventilado.

:::nota

O B7000 é um adesivo de poliuretano monocomponente que cura por evaporação de solvente. Em clima úmido, o tempo de cura pode se estender. Nunca acelere o processo com calor — o solvente evapora de forma desigual, formando bolhas que deformam a imagem quando o display é ligado.

:::

## Conferindo o reconhecimento do display após a troca

Depois que o adesivo estiver curado (ou imediatamente, no caso da fita), conecte o flat e a bateria, feche parcialmente o console e ligue-o para validar o reconhecimento do painel. No SteamOS 3.6, você pode consultar o subsistema de vídeo por linha de comando:

```terminal
$ cat /sys/class/drm/card0-eDP-1/modes
1280x800
$ cat /sys/class/drm/card0-eDP-1/edid | hexdump -C | head -5
00000000  00 ff ff ff ff ff ff 00  09 e5 08 01 00 00 00 00  |................|
00000010  01 1d 01 04 a5 1f 11 78  03 d5 10 a2 5f 52 87 28  |.......x...._R.(|
00000020  1a 50 54 00 00 00 01 01  01 01 01 01 01 01 01 01  |.PT.............|
```

O arquivo `edid` contém o Extended Display Identification Data — é a "carteira de identidade" do painel. Se o campo do fabricante mudar de `ANX7530` (controlador LCD original) para `Samsung OLED`, você confirmou que o kernel detectou corretamente a troca. No ambiente Wayland, o comando equivalente é:

```terminal
$ swaymsg -t get_outputs | jq '.[] | {make: .make, model: .model, modes: .modes}'
{
  "make": "Valve Corporation",
  "model": "Steam Deck OLED",
  "modes": [
    { "width": 1280, "height": 800, "refresh": 60 },
    { "width": 1280, "height": 800, "refresh": 90 }
  ]
}
```

:::exemplo

Em uma troca de LCD para LCD em um Steam Deck de 2022, o `xrandr` (via XWayland) reporta:

```terminal
$ xrandr --query | grep " connected"
eDP-1 connected primary 1280x800+0+0 (normal left inverted right x axis y axis) 150mm x 94mm
```

A regulagem de brilho via `/sys/class/backlight/amdgpu_bl0/brightness` deve responder sem saltos — se o brilho oscilar ou ficar preso em 100%, o flat pode estar mal encaixado ou o controlador do novo painel é incompatível com a placa-mãe atual.

:::

## Resumo

- **LCD e OLED usam adesivos diferentes**: respeite a temperatura de amolecimento específica de cada painel e evite ultrapassar 85 °C na superfície do vidro
- A técnica de remoção em "zíper" com palhetas plásticas reduz o risco de trinca e preserva o digitizador intacto
- O flat cable merece atenção redobrada — a borda correspondente é a última a ser solta e a primeira a receber a fita nova
- A limpeza da moldura com IPA 99% e pinça é pré-requisito para que o novo adesivo fixe sem desníveis ou bolhas
- Após a colagem, valide o funcionamento conferindo modo (`modes`), EDID e controle de brilho antes de fechar definitivamente o console
- A conexão elétrica do flat será tratada na [sec-07](#/cap-085/sec-07); a abertura da carcaça, na [sec-02](#/cap-085/sec-02)

## Exercícios

1. **Diagnóstico de adesivo**: Suponha que, ao tentar levantar um painel LCD com ventosa, o vidro não cede após 2 minutos de aquecimento a 75 °C. Liste três possíveis causas e a ação corretiva para cada uma.

2. **Comparação de métodos**: Compare a fita pré-cortada e o adesivo B7000 quanto a: (a) tempo total de reparo; (b) possibilidade de realinhamento após a aplicação; (c) resistência à umidade. Em qual cenário você recomendaria cada um?

3. **Simulação de linha de comando**: Escreva a sequência de comandos em um terminal SteamOS para verificar se um painel recém-instalado está sendo reconhecido com a resolução correta e se o backlight responde ao ajuste de brilho. Explique o que cada comando verifica.

4. **Cenário de dano térmico**: Durante a remoção, você aqueceu o painel a 95 °C por engano. Quais são os possíveis danos ao vidro, ao LCD/OLED e à placa-mãe? Como você testaria cada subsistema para confirmar se houve avaria?

5. **Integrador — troca completa com documentação**: Você está substituindo uma tela LCD por outra LCD em um Steam Deck de 2022. Descreva, do início ao fim, o procedimento completo (aquecimento, remoção, limpeza, aplicação de fita pré-cortada, conexão e teste), indicando em que momento cada seção deste capítulo (sec-02 a sec-07) deve ser consultada. Inclua os comandos de validação pós-instalação e explique como interpretar a saída do EDID para confirmar a compatibilidade do novo painel.