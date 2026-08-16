No mesmo pacote das Steam Machines, a Valve lançou o **Steam Controller** — um controle de videogame que tentou, de fato, reinventar o que um controle de PC poderia ser. Ele tinha duas coisas que nenhum controle de console tinha: trackpads hápticos substituindo os analógicos, e um foco obsessivo em permitir que você jogasse, no sofá, qualquer jogo de PC — inclusive aqueles que nunca foram desenhados para controle, como jogos de estratégia e de "apontar e clicar". O Steam Controller fracassou comercialmente, mas sua herança está em cada Steam Deck fabricado hoje.

:::objetivos
- Entender o papel do Steam Controller na estratégia de hardware da Valve
- Conhecer os componentes únicos do controle (trackpads hápticos, giroscópio)
- Saber como configurar perfis de controle no Steam
- Identificar a herança do Steam Controller no Steam Deck
:::

## Por que reinventar o controle

Jogos de PC nasceram com teclado e mouse. Trazê-los para o sofá exige traduzir movimentos de mouse para alavancas, e a tradução nunca foi boa: analógicos são ruins para movimentos precisos e lentos, e ruins para mirar com precisão. A Valve percebeu que, para vender a ideia do "PC na sala", precisava de um dispositivo de entrada que resolvesse esse problema.

A aposta foi em **trackpads hápticos**: duas superfícies táteis circulares que simulam uma trackball, com feedback por vibração sutil (haptic). Enquanto um analógico tem curso finito, o trackpad pode rolar indefinidamente como uma bola de mouse. Isso permite, em jogos de estratégia, deslizar o cursor pela tela como se estivesse usando um mouse — algo impossível com os controles tradicionais.

## O hardware, em detalhes

O Steam Controller trouxe um conjunto incomum de entradas para um controle de jogo:

| Componente | Função | Equivalente no Deck |
|---|---|---|
| Dois trackpads hápticos | Mouse, câmera, rolagem | Dois trackpads |
| Giroscópio e acelerômetro | Mirar inclinando o controle | Giroscópio |
| Alavanca analógica única | Movimento de personagem | Duas alavancas |
| Botões ABXY e direcional | Ações padrão | ABXY e direcional |
| Gatilhos duplos (dois estágios) | Tiro com clique extra | Gatilhos L2/R2 |
| Botões traseiros (grip buttons) | Ações extras | Quatro botões traseiros |

O giroscópio merece destaque: a ideia de mirar movendo o controle no ar, como um volante, era incomum em controles de PC e se tornaria um recurso querido pela comunidade de jogos de tiro. No Steam Deck, o giroscópio voltou e virou um recurso muito usado para ajuste fino de mira.

## Configurando no Steam: a interface antiga

O Steam Controller era configurável em um nível absurdo de detalhe. Cada tecla, trackpad e gatilho podia ser remapeado, e a configuração era feita pelo Steam, através do sistema de **Configuração de Controle** (Steam Input). Mesmo sem o controle físico, o SteamOS expõe o arquivo de configuração do Steam Input para quem quiser inspecionar.

```terminal
$ ls ~/.steam/steam/config/
appinfo.vdf
config.vdf
controller.vdf
loginusers.vdf
registry.vdf
steamapps.vrmanifest
```

O arquivo `controller.vdf` guarda as preferências globais de entrada. Ele é um arquivo de texto no formato VDF (Valve Data Format), uma variante de `key: value` aninhado usada pela Valve em vários arquivos de configuração. Você pode lê-lo com qualquer editor de texto.

```terminal
$ head -20 ~/.steam/steam/config/controller.vdf
"controller_config"
{
    "bindingsversion"		"1"
    "version"		"3"
    "preferences"
    {
        "gyro_always_on"		"0"
        "desktop_mode"		"on"
        "haptics_intensity"		"2"
    }
}
```

O VDF usa chaves entre aspas e chaves `{ }` para aninhar blocos — uma sintaxe que não é JSON nem INI, mas tem parentesco com ambos. É importante saber lê-lo porque ele aparece em vários cantos do ecossistema Steam.

:::info
VDF é a sigla de *Valve Data Format*. Arquivos como `config.vdf`, `loginusers.vdf` e `controller.vdf` usam esse formato. Ele tolera parênteses e comentários com `//`, mas é mais enxuto que JSON e não exige vírgulas entre pares — apenas espaços e quebras de linha.
:::

## Do fracasso comercial à herança no Deck

O Steam Controller foi descontinuado em 2019 e vendido em liquidação por US$ 5 na reta final — um fim humilhante para um produto que custava US$ 49 no lançamento. Muita gente nunca se acostumou aos trackpads: a ausência de um segundo analógico real era um obstáculo em jogos de console tradicionais, e a curva de aprendizado era alta.

Mas a Valve não jogou o bebê fora com a água. Quando desenhou o Steam Deck, ela trouxe de volta os trackpads, o giroscópio, os botões traseiros e toda a filosofia do Steam Input, agora casados com uma configuração padrão de console (duas alavancas, ABXY, direcional). O resultado é um híbrido: o Deck joga como um console, mas carrega escondida a capacidade de virar "mouse de sofá" que o Steam Controller tentou ser.

:::dica
No Steam Deck, o trackpad direito funciona como mouse por padrão dentro do modo Desktop, o que torna a navegação muito mais confortável do que deslizar o dedo na tela. Aperte o trackpad para "clicar", e use o esquerdo para rolar a página.
:::

## Resumo

- O Steam Controller (2015) usava trackpads hápticos em vez de analógicos tradicionais.
- O giroscópio e os botões traseiros foram inovações do controle.
- A configuração é feita pelo Steam Input, com arquivos VDF em `~/.steam/steam/config/`.
- O controle foi descontinuado em 2019, mas sua herança está toda no Steam Deck.
- VDF é o formato de configuração usado em vários arquivos do ecossistema Valve.

## Exercícios

1. Abra o arquivo `~/.steam/steam/config/controller.vdf` e identifique três preferências de entrada que você reconhece.
2. Explique, em um parágrafo, por que trackpads hápticos são melhores que analógicos para jogos de estratégia.
3. Compare os componentes do Steam Controller com os do Steam Deck usando uma tabela.
4. Pesquise o que é "Steam Input" e liste três razões pelas quais ele é mais poderoso que o mapeamento fixo de um console.
5. **Desafio.** Conecte (ou emparelhe) um controle externo qualquer ao seu Steam Deck, abra o menu de configuração de controle do Steam e crie um perfil personalizado remapeando o gatilho direito para uma tecla do teclado. Documente o caminho que você percorreu nas telas.