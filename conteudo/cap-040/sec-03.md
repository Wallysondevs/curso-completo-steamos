Com o ProtonUp-Qt instalado, o próximo passo é baixar a primeira build do Proton-GE. Esta é a operação mais comum de todo o fluxo, e entender exatamente o que acontece durante e depois dela evita as duas dúvidas clássicas: "a build sumiu?" e "por que ainda não aparece no Steam?". Vamos percorrer o download completo e conferir o resultado no disco.

O ProtonUp-Qt baixa de dois lugares diferentes conforme a ferramenta: builds do Proton-GE vêm do repositório de releases no GitHub do GloriousEggroll, enquanto outras ferramentas (que você verá depois) vêm das suas próprias fontes. O importante agora é a mecânica geral, válida para qualquer build.

:::objetivos
- Navegar a lista de versões disponíveis no ProtonUp-Qt
- Baixar e instalar uma build específica do Proton-GE
- Interpretar o que o app faz em cada etapa do download
- Confirmar a instalação olhando o diretório `compatibilitytools.d`
:::

## Escolhendo qual versão baixar

Abra o ProtonUp-Qt e clique em **Add version**. A lista que aparece é longa: ela mostra todas as builds disponíveis para o runtime escolhido, com as mais recentes no topo. As entradas do Proton-GE seguem um padrão de nome importante:

- `GE-Proton9-25` — a versão 25 da linha baseada no Proton 9.
- `GE-Proton9-20` — uma versão anterior da mesma linha.

O número final cresce a cada release, então `GE-Proton9-25` é mais novo que `GE-Proton9-20`. Versões "latest" ou marcadas como estáveis ficam destacadas no topo da lista.

Qual escolher? Para começar, a **mais recente** da linha estável costuma ser a aposta certa. Builds antigas só interessam em casos raros de regressão — quando um jogo funcionava numa versão e quebrou na seguinte e você quer voltar. Marque a versão e confirme.

```terminal
$ flatpak run net.davidotek.pupgui2
```

O comando acima apenas abre o app; a seleção da versão é feita na janela. Durante o download, o ProtonUp-Qt mostra uma barra de progresso e o nome do arquivo que está buscando.

## O que acontece durante o download

Por baixo da interface, o fluxo é mais ou menos assim: o app consulta a API de releases do GitHub, acha o tarball (arquivo `.tar.gz`) correspondente à versão escolhida, baixa-o, extrai na pasta temporária do usuário e então move a pasta resultante para `compatibilitytools.d`.

O download é grande — cada build GE fica em torno de 1 GB, como você viu na seção anterior. Dependendo da sua conexão, isso leva de alguns segundos a vários minutos. Não feche o app no meio do processo; se interromper, você fica com um tarball parcial na pasta temporária, e o próximo download recomeça do zero.

:::dica
Se o download parecer travado, verifique a conexão antes de cancelar. O GitHub pode ser lento em alguns horários, e o ProtonUp-Qt não baixa em paralelo — uma build por vez. Paciência costuma resolver.
:::

## Confirmando no disco

Depois que o app informa que terminou, o teste definitivo não é a mensagem na tela: é olhar o diretório. Feche ou minimize o ProtonUp-Qt e rode:

```terminal
$ ls -1 ~/.steam/steam/compatibilitytools.d/
GE-Proton9-25
```

A pasta `GE-Proton9-25` é a build que você acabou de instalar. Dentro dela há uma estrutura com o binário do Proton, as bibliotecas e, sobretudo, um arquivo chamado `compatibilitytool.vdf` — o manifesto que o Steam lê para reconhecer a ferramenta e exibi-la nos menus.

```terminal
$ ls ~/.steam/steam/compatibilitytools.d/GE-Proton9-25/
compatibilitytool.vdf
files/
proton
toolmanifest.vdf
user_settings.sample.py
```

Os três arquivos `.vdf` e `.py` no topo são a "carteira de identidade" da tool; a pasta `files/` concentra os binários e bibliotecas de fato (é a parte pesada, a responsável pelo 1 GB). Se o `compatibilitytool.vdf` existir, o Steam consegue enxergar a build.

## Fazendo o Steam reconhecer a nova build

O Steam escaneia `compatibilitytools.d` ao iniciar. Se ele já estava aberto quando você baixou a build, pode ser preciso reiniciar o cliente para que a nova versão apareça na lista de compatibilidade. Fechar e reabrir o Steam (ou simplesmente sair e entrar de novo) resolve.

Um detalhe importante: **não é necessário** baixar uma build para cada jogo. A build fica disponível globalmente, uma única vez, e você apenas a seleciona onde quiser — é o assunto das próximas duas seções.

:::atencao
Se a build não aparecer no Steam mesmo após reiniciar, confira se você instalou na instalação de Steam **correta**. Quem tem Steam e Steam Beta, ou usa também o Heroic/Lutris, pode ter mais de uma entrada no seletor do ProtonUp-Qt — e a build só aparece onde foi instalada.
:::

## Baixando de novo sem abrir a interface

Para quem quer automatizar, o ProtonUp-Qt tem um modo simplificado. O Flatpak permite invocar a instalação direto do terminal com o parâmetro `-d` (de *download*):

```terminal
$ flatpak run net.davidotek.pupgui2 -d "GE-Proton9-25"
```

Se a versão já estiver instalada, o app informa que não há nada a fazer. Esse modo é útil para atualizar várias máquinas com o mesmo conjunto de builds ou para scripts de setup restauram seu Deck do zero.

## Resumo

- As builds GE seguem o padrão `GE-Proton9-N`, em que `N` cresce a cada release.
- O ProtonUp-Qt baixa o tarball do GitHub, extrai e move a pasta para `compatibilitytools.d`.
- Cada build fica em torno de 1 GB; o download não é paralelo e não deve ser interrompido.
- A presença de `compatibilitytool.vdf` dentro da pasta é o que faz o Steam reconhecer a build.
- O Steam escaneia `compatibilitytools.d` ao iniciar; reinicie o cliente se ele já estava aberto.
- Uma build instalada fica disponível para todos os jogos, não apenas para um.

## Exercícios

1. No ProtonUp-Qt, abra **Add version** e identifique a build GE mais recente listada. Anote o nome completo dela.
2. Baixe essa build mais recente e confirme a instalação com `ls ~/.steam/steam/compatibilitytools.d/`.
3. Inspecione o conteúdo da build com `ls` e localize os arquivos `compatibilitytool.vdf`, `toolmanifest.vdf` e `user_settings.sample.py`, explicando o papel de cada um.
4. Meça o tamanho real da build baixada com `du -sh ~/.steam/steam/compatibilitytools.d/GE-Proton*` e compare com a estimativa de 1 GB.
5. **Desafio.** Use `flatpak run net.davidotek.pupgui2 -d "GE-Proton9-25"` (substituindo pelo nome da build que você já baixou) e observe a mensagem que o app devolve quando a build já está instalada — depois explique por que esse modo é útil em scripts.
