Em 21 de agosto de 2018, a Valve anunciou o Steam Play e o Proton numa atualização do cliente Steam. Foi um daqueles anúncios que mudam o rumo de um ecossistema: de um dia para o outro, a biblioteca Linux do Steam passou de ~6 mil títulos para mais de 20 mil, sem que nenhum desenvolvedor precisasse fazer um port. Esta seção conta o antes, o durante e o depois dessa história — e o que mudou de 2018 até o Steam Deck.

:::objetivos
- Conhecer o contexto que levou ao lançamento do Steam Play em 2018
- Entender como a Valve selecionou e liberou os primeiros jogos compatíveis
- Acompanhar a evolução do Proton de 2018 a 2025 (versões, marcos)
- Relacionar o lançamento do Steam Deck com a maturidade do Proton
- Avaliar o impacto do Steam Play no mercado de jogos para Linux
:::

## Antes de 2018: a era das versões nativas

Entre 2013 e 2018, a estratégia da Valve para o Linux era baseada em ports nativos. Grandes estúdios como Feral Interactive e Aspyr Media eram contratados para portar títulos AAA para Linux, e o SteamOS 1.0/2.0 dependia exclusivamente desses ports. O problema era de escala: cada port custava caro, levava meses e exigia manutenção contínua. Para cada *Civilization VI* que ganhava versão Linux, cem outros jogos ficavam de fora.

Em paralelo, a comunidade de entusiastas usava Wine para rodar jogos Windows no Linux, mas com uma experiência fragmentada: cada jogo tinha um tutorial diferente no WineHQ AppDB, cada atualização do Wine podia quebrar o que funcionava, e não havia integração com o cliente Steam.

A Valve percebeu que o caminho dos ports nativos não escalava. O futuro precisava ser um Wine que funcionasse tão bem a ponto de ser invisível — e foi isso que o Steam Play entregou.

## O anúncio de agosto de 2018

Em 21 de agosto de 2018, a Valve publicou a atualização "Steam Play for Linux" no blog da comunidade Steam. O anúncio tinha duas partes: uma tecnológica (o Proton, fork do Wine com DXVK e VKD3D integrados) e uma de negócios (Steam Play: compre uma vez, jogue em qualquer plataforma).

A lista inicial de jogos oficialmente compatíveis tinha 27 títulos, incluindo *DOOM (2016)*, *NieR:Automata*, *Beat Saber*, *Tekken 7* e *Final Fantasy VI*. Eram jogos testados internamente pela Valve que passavam por um critério de qualidade: sem crashes, sem artefatos visuais graves, desempenho aceitável. Mas a chave estava na opção "Enable Steam Play for all titles" — ao ativá-la, você podia tentar rodar **qualquer** jogo da sua biblioteca Windows, mesmo os não testados.

O impacto foi imediato. Em 24 horas, a comunidade começou a testar centenas de jogos e reportar resultados no GitHub do Proton e no ProtonDB (site comunitário que surgiu na mesma semana). A biblioteca Linux efetiva do Steam multiplicou por quatro, e o número de usuários ativos do Steam no Linux cresceu.

Hoje, num Steam Deck, você ainda consegue ver o rastro daquela configuração que liberou a compatibilidade para toda a biblioteca. A chave "enable Steam Play for all titles" foi gravada na configuração global do Steam:

```terminal
$ grep -i -A6 'SteamPlay' ~/.steam/steam/config/config.vdf | head -14
"SteamPlay"
{
  "EnableSteamPlayForAllTitles"		"1"
  "BlockedCompatToolList"		""
  "CompatToolWhitelist"
  {
  }
}
```

O valor `"1"` em `EnableSteamPlayForAllTitles` é o que torna possível tentar rodar qualquer título, não apenas os verificados. Quando esse campo é `"0"`, o Steam só oferece compatibilidade para os jogos que têm versão nativa Linux ou que estão na lista oficial da Valve.

## A evolução do Proton: versão a versão

O Proton teve lançamentos marcantes que refletem o progresso técnico:

| Versão | Data | Destaque |
|---|---|---|
| Proton 3.7 | Ago 2018 | Lançamento inicial, 27 jogos whitelistados |
| Proton 3.16 | Nov 2018 | DXVK 0.94, suporte melhorado a D3D11 |
| Proton 4.2 | Fev 2019 | Wine 4.2, DXVK 1.0, FAudio integrado |
| Proton 4.11 | Jun 2019 | VKD3D-Proton inicial (D3D12 experimental) |
| Proton 5.0 | Fev 2020 | Wine 5.0, DXVK 1.5, novo Steam Runtime (sniper) |
| Proton 5.13 | Nov 2020 | Último baseado em Wine 5.x; transição para sniper |
| Proton 6.3 | Abr 2021 | Wine 6.3, DXVK 2.0, preparação para Steam Deck |
| Proton 7.0 | Fev 2022 | Lançamento com Steam Deck, DXVK 2.1, VKD3D-Proton 2.6 |
| Proton 8.0 | Abr 2023 | Wine 8.0, DXVK 2.3, VKD3D-Proton 2.10 |
| Proton 9.0 | Jul 2024 | Wine 9.0, DXVK 2.4, VKD3D-Proton 2.11, DXR ray tracing |

A cada versão, o número de jogos na "whitelist" oficial cresceu — de 27 para mais de 12 mil títulos verificados como "Deck Verified" ou "Playable". Mas o número real de jogos que rodam bem (incluindo os não verificados oficialmente) é estimado em mais de 80% da biblioteca Steam.

## O Steam Deck como catalisador

O Steam Deck, lançado em fevereiro de 2022, foi o maior catalisador do Proton. Com milhões de unidades vendidas, o Deck criou uma base instalada de Linux que os desenvolvedores não podiam ignorar. O programa **Deck Verified** forçou a Valve a testar sistematicamente milhares de jogos, gerando relatórios de bugs que alimentaram o desenvolvimento do Proton num ritmo sem precedentes.

No ciclo 2022-2025, o Proton recebeu mais correções do que nos quatro anos anteriores somados. A cada mês, a Valve publica múltiplas atualizações do Proton Experimental, e a comunidade do ProtonDB mantém um banco de dados com relatórios de compatibilidade para mais de 50 mil títulos.

O número de usuários Steam no Linux, que era de ~0,8% antes do Deck, saltou para ~2% em 2025 — ainda pequeno em termos absolutos, mas representando milhões de jogadores, o suficiente para que estúdios como Square Enix, Capcom e FromSoftware comecem a testar seus lançamentos no Proton antes do lançamento.

O rastro do programa Deck Verified também aparece no sistema: cada jogo baixado tem metadados de compatibilidade que o Steam usa para exibir o selo "Verificado" ou "Jogável". O estado é visível no arquivo de configuração do usuário:

```terminal
$ grep -i -B1 -A4 'compat' ~/.steam/steam/userdata/123456789/config/localconfig.vdf | head -18
"Playtime"
...
"CompatToolMapping"
{
}
"SelectedCompatTool"		""
"CompatToolLastUsed"		"proton_9"
```

O campo `CompatToolLastUsed` registra qual ferramenta foi usada na última execução daquele jogo. É esse mecanismo, criado junto com o Steam Play, que o sistema de selos do Deck Verified consulta para saber se um título pode ser anunciado como compatível.

:::nota
Em 2024, o Steam Deck OLED foi lançado com SteamOS 3.6 e Proton 9.0 pré-instalado, e a Valve confirmou que o SteamOS será disponibilizado para outros fabricantes de handhelds. Isso significa que a base instalada do Proton tende a crescer além do Deck, ampliando ainda mais a relevância da compatibilidade.
:::

## Onde estamos agora e o que falta

Em 2025, o Proton é estável o suficiente para ser a experiência padrão de jogos no Steam Deck. Jogos AAA como *Cyberpunk 2077*, *Elden Ring* e *Baldur's Gate 3* rodam no Deck via Proton com desempenho aceitável e sem configuração manual. Mas ainda há arestas:

- **Anti-cheat**: EAC e BattlEye têm suporte Linux via módulos user-space (não kernel), mas muitos jogos não ativam essa opção. *Fortnite*, *Rainbow Six Siege*, *Valorant* e *Destiny 2* continuam bloqueados.
- **Codecs**: alguns jogos usam formatos de vídeo proprietários (Cinepak, Bink 2) sem alternativa livre, e as cutscenes falham.
- **DRM externo**: Denuvo e outros sistemas de proteção às vezes confundem o Proton com um ambiente adulterado e bloqueiam a execução.
- **Periféricos específicos**: volantes, HOTAS e dispositivos especializados frequentemente não têm driver ou mapeamento no Linux.

Mas a direção é clara: a cada release do Proton, menos jogos exigem intervenção manual. A tendência é que, em poucos anos, a pergunta "esse jogo roda no Steam Deck?" tenha a mesma resposta que "esse jogo roda no Windows?".

```terminal
$ ~/.steam/steam/steamapps/common/Proton\ 9.0/proton --version
Proton: 9.0-4
Steam Runtime Version: sniper 0.20250303.110000
Wine version: wine-9.0
```

Essas três linhas resumem uma década de engenharia e uma aposta que parecia arriscada em 2018 e que hoje é o fundamento técnico do dispositivo mais inovador da Valve desde o Source Engine.

## Resumo

- Antes de 2018, a Valve apostava em ports nativos; o Steam Play mudou a estratégia para compatibilidade automática.
- O Proton foi lançado em agosto de 2018 com 27 jogos whitelistados e a opção de testar toda a biblioteca.
- De 2018 a 2025, o Proton evoluiu de 3.7 para 9.0, com marcos em DXVK, VKD3D-Proton e Steam Runtime.
- O Steam Deck (2022) catalisou o desenvolvimento do Proton, com o programa Deck Verified testando milhares de títulos.
- Em 2025, o Proton roda ~80% da biblioteca Steam; os principais obstáculos são anti-cheat e codecs proprietários.

## Exercícios

1. Pesquise a data de lançamento do Proton 3.7 e liste os 5 primeiros jogos whitelistados. Quantos deles ainda são "Deck Verified" hoje?
2. Compare as notas de release do Proton 7.0 e do Proton 9.0. Liste três melhorias que ocorreram entre essas duas versões.
3. Verifique quantos títulos "Deck Verified" existem hoje no Steam (pesquise no site da Valve ou na loja Steam).
4. Instale uma versão antiga do Proton (se disponível em `compatibilitytools.d/`) e teste um jogo com ela e com o Proton 9.0. Descreva as diferenças.
5. **Desafio.** Escreva um parágrafo argumentando se o Steam Play foi uma decisão técnica ou de negócios. Use dados: número de jogos whitelistados em 2018 vs. 2025, crescimento do Linux no Steam, e o custo estimado de ports nativos vs. manutenção do Proton.