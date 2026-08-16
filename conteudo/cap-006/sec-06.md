A loja do Steam dentro do Deck é, essencialmente, o site da Steam renderizado num navegador embutido (CEF) com uma casca de gamepad. Comprar, resgatar códigos, ler avaliações e gerenciar a lista de desejos acontecem na mesma conta que você usa no PC. O que muda é o contexto: a loja do Deck prioriza o selo de **compatibilidade com Steam Deck**, e é ele que você precisa aprender a ler antes de gastar.

:::objetivos
- Entender que a loja do Deck é o site Steam num navegador CEF
- Interpretar os selos de compatibilidade (Verificado/Jogável/Não suportado)
- Navegar por busca, lista de desejos e avaliações via gamepad
- Inspecionar o cache e os arquivos baixados pela loja localmente
- Identificar o appid de um jogo a partir da URL da página

:::

## A loja é uma página web com chroma

A loja não é um aplicativo nativo: é HTML renderizado pelo `steamwebhelper` (o CEF que já apareceu nas seções anteriores). Quando você clica numa avaliação ou arrasta o carrossel, está navegando numa página web hospedada nos servidores da Valve, com o input traduzido de gamepad para eventos de clique. Isso tem duas consequências práticas:

1. **Tudo que você faz na loja também é visível no site** steamstore.com, logado — a lista de desejos é a mesma, as avaliações são as mesmas, a biblioteca é a mesma.
2. **A loja usa cache local.** O CEF baixa páginas e as guarda em disco, e o Steam mantém um cache de imagens (capas) que faz a loja abrir mais rápido nas visitas seguintes.

Esse cache fica no diretório de caches do cliente:

```terminal
$ du -sh ~/.steam/steam/appcache 2>/dev/null
214M	/home/deck/.steam/steam/appcache
$ ls ~/.steam/steam/appcache | head -8
httpcache
librarycache
store
```

O `httpcache` é o cache HTTP do navegador embutido; o `librarycache` guarda as capas da biblioteca; e o `store` guarda metadados da loja. Quando a loja "não atualiza preço" ou uma capa some, limpar o `httpcache` (com o Steam fechado) força o cliente a buscar tudo de novo — é o equivalente a apertar `[[Ctrl+Shift+R]]` num navegador de verdade.

## Lendo o selo de compatibilidade

O grande diferencial da loja no Deck é o sistema de **compatibilidade verificada**, que classifica cada jogo em quatro faixas visíveis antes mesmo de comprar:

| Selo | Significado | O que você verá na prática |
|---|---|---|
| **Verificado** | Testado e aprovado pela Valve | Roda bem: textos legíveis, input nativo, performance adequada |
| **Jogável** | Funciona, com ressalvas | Pode exigir teclado virtual manual ou configurações extras |
| **Não suportado** | Não roda (ou roda mal) no Deck | Anticheat ou requisitos incompatíveis |
| **Desconhecido** | Ainda não testado | Você descobre por conta (ou pela comunidade) |

O selo é exibido na página do jogo, num canto, junto ao preço. Para uma leitura crítica: **Verificado não é sinônimo de 60 FPS travado**, e **Jogável** muitas vezes é perfeitamente jogável com dois ajustes. O selo é um ponto de partida, não uma sentença.

:::nota
A classificação de compatibilidade vive do lado da Valve (um banco próprio), não num arquivo local. O que o Deck guarda localmente é o *resultado* exibido, que pode ficar obsoleto no cache até a próxima atualização. Por isso um jogo às vezes mostra um selo desatualizado logo após sair o veredito novo — limpar o cache da loja resolve.
:::

## Busca, lista de desejos e avaliações

A busca da loja responde ao teclado virtual (`[[Steam]]`+`[[X]]`). Você digita, e a página filtra. A **lista de desejos** (wishlist) é onde o Deck brilha para quem pesquisa muito: você adiciona um jogo, e ele aparece na aba dedicada com aviso de promoção. As **avaliações** são o termômetro da comunidade — e aqui vale a leitura fina dos thumbs (positivo/negativo) e da faixa "recentes" vs. "gerais".

Um detalhe técnico que conecta a loja ao resto do capítulo: cada página de jogo tem um **appid**, e você pode extraí-lo da URL interna, que o Steam expõe tanto na interface quanto num `steam://`:

```terminal
$ grep -oE 'appid[" ]*[:=][" ]*[0-9]+' ~/.steam/steam/logs/console-linux.txt | tail -5
```

Esse `appid` é exatamente o mesmo número que apareceu nos `appmanifest_*.acf` e no `libraryfolders.vdf` das seções anteriores. A loja, a biblioteca e os arquivos locais falam o mesmo idioma: o `appid`. Quem entende isso nunca se perde entre "a página do jogo" e "o jogo instalado no disco".

## Comprando e resgatando códigos

Comprar no Deck usa o mesmo gateways de pagamento do Steam no PC — cartão, carteira Steam, e por aí vai. O único cuidado extra é de **segurança**: como o Deck expõe um navegador embutido, evite logar em contas secundárias ou digitar dados de pagamento em qualquer tela que não seja a página oficial `store.steampowered.com`. O Steam também tem o **Guarda Steam** (2FA), que no Deck pode pedir confirmação pelo aplicativo do celular.

O resgate de **chaves de produto** (códigos do tipo `AAAAA-BBBBB-CCCCC`) é feito no item "Ativar um código" (no menu de conta ou em "Jogos → Ativar produto"). O código é validado contra o servidor, e o jogo entra na sua biblioteca — após o resgate, ele aparece como "não instalado" até você mandar instalar.

:::atencao
Nunca compre um jogo "Não suportado" com a expectativa de que "depois ele fica compatível". A compatibilidade pode melhorar (patch no anticheat), mas não é garantida. Se o veredito importa para você, consulte o selo **antes** de finalizar a compra, não depois.
:::

## A loja e o disco: o que fica baixado

Depois de uma sessão de loja, parte do conteúdo fica no seu disco — não os jogos (esses vão para a biblioteca), mas páginas, imagens e metadados. Vale saber distinguir:

| Diretório | Conteúdo | Pode ser apagado? |
|---|---|---|
| `appcache/httpcache` | Páginas/JS/HTML da loja | Sim (recriado sozinho) |
| `appcache/librarycache` | Capas da biblioteca | Sim (recarregadas) |
| `appcache/store` | Metadados/vitrines da loja | Sim, com cautela |
| `steamapps/common` | **Jogos de verdade** | Não — é seu conteúdo |

Limpar `appcache/` é seguro, mas redundante: o Steam refaz o cache. Nunca confunda o cache da loja com os jogos em `steamapps/common` — apagar o segundo apaga o jogo.

## Resumo

- A loja do Deck é o site Steam num navegador CEF (`steamwebhelper`), com input de gamepad.
- O cache da loja vive em `~/.steam/steam/appcache`, dividido em `httpcache`, `librarycache` e `store`.
- Os selos de compatibilidade são Verificado, Jogável, Não suportado e Desconhecido.
- A lista de desejos e as avaliações são as mesmas do PC (mesma conta, mesmos servidores).
- Todo jogo tem um `appid`, que liga a página da loja ao `appmanifest_*.acf` no disco.
- O resgate de chaves valida no servidor e insere o jogo como "não instalado" na biblioteca.

## Exercícios

1. Abra a loja e encontre a página de um jogo; extraia seu `appid` da URL interna ou de um `steam://` no `console-linux.txt`.
2. Verifique o tamanho do seu cache com `du -sh ~/.steam/steam/appcache` e liste os três subdiretórios.
3. Escolha um jogo da loja e explique, olhando só o selo e a descrição, se ele é Verificado ou Jogável e por quê.
4. Adicione um jogo à lista de desejos no Deck e confirme que ele aparece na lista do site Steam no PC (ou no app do celular).
5. **Desafio.** Relacione a seção 2 a esta: pegue um jogo que você tem instalado, achem seu `appid` no `appmanifest_*.acf`, e encontre a página correspondente na loja usando `steam://url/StoreApp/<appid>`. Explique como um único número costura loja, biblioteca e disco.
