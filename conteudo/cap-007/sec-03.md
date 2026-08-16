Tags, coleções e filtros são três mecanismos diferentes que muita gente trata como sinônimos. A tag descreve o que um jogo *é* (gênero, tema, mecânica); a coleção descreve o que ele significa *para você* (zerado, abandonado, fila de jogar); o filtro descreve a *consulta* momentânea que você quer fazer. Dominar os três é o que separa uma biblioteca útil de uma estante de troféus impenetrável no Steam Deck.

:::objetivos
- Diferenciar tags, coleções e filtros com precisão
- Criar e manter coleções dinâmicas e estáticas
- Usar tags para descobrir jogos e para navegar a biblioteca
- Aplicar filtros de consulta dentro da biblioteca
- Entender como os metadados de apps ficam armazenados no disco
:::

## Tags: o vocabulário do catálogo

Tags são rótulos aplicados a jogos para descrevê-los — `Indie`, `RPG`, `Pixel Graphics`, `Co-op`, `Controller Support`. Elas são criadas pela própria comunidade e moderadas pela Valve, e servem de combustível tanto para a recomendação da loja quanto para o sistema de busca da biblioteca.

No Deck, a tag tem um peso extra: ela normalmente aparece junto de indicadores de compatibilidade, e é uma das formas mais rápidas de descobrir se um jogo combina com o formato portátil. Tags como `Controller Support` e `Singleplayer` indicam, de cara, se o título foi pensado para o seu caso de uso.

A Valve distribui os metadados dos aplicativos num cache local, o `appinfo.vdf`:

```terminal
$ ls -lh ~/.local/share/Steam/appcache/appinfo.vdf
-rw-r--r-- 1 deck deck 41M Fev 13 09:12 /home/deck/.local/share/Steam/appcache/appinfo.vdf
```

Esse arquivo binário/VDF agrega nome, tags, preço e compatibilidade de cada `appid` que você já baixou ou visitou. Ele não é legível como texto, mas o tamanho de 41 MB dá a dimensão de quanto metadado o cliente mantém localmente para a biblioteca responder sem ir à rede toda hora.

## Coleções: organizando o que é seu

Coleções são agrupamentos da **biblioteca**. Existem dois tipos. A coleção **estática** é uma lista manual — você arrasta jogos para dentro. A coleção **dinâmica** é uma regra: "todos os jogos com a tag `RPG` e status `Instalado`", recalculada automaticamente conforme sua biblioteca muda.

A vantagem no Deck é o filtro de instalação: como o SSD é limitado, uma coleção dinâmica como "Instalados e prontos" poupa tempo na hora de escolher o que jogar offline.

```terminal
$ ls ~/.local/share/Steam/steamapps/
appmanifest_2792310.acf
appmanifest_1189630.acf
common/
libraryfolders.vdf
```

Cada `appmanifest_*.acf` é um arquivo de texto (também VDF) que descreve a instalação de um jogo na máquina. Coleções em si ficam na conta; mas o que *alimenta* a coleção dinâmica "instalado" — a existência desses `appmanifest` — é local e auditável.

:::dica
Comece com duas ou três coleções dinâmicas, não dez. As que quase sempre compensam: "Fila de jogar" (jogos comprados e ainda não iniciados), "Instalados" (regra por status de instalação) e "Zerados" (manual). Regras demais viram trabalho de curadoria que ninguém mantém.
:::

## Filtros: a consulta que só existe agora

Filtro é diferente de coleção pela natureza temporária. Você abre a biblioteca, digita um termo ou combina critérios — "instalado", "suporta controle", "jogado nas últimas duas semanas" — e o filtro devolve um resultado que desaparece quando você fecha. Coleção é persistente; filtro é efêmero.

A busca textual da biblioteca percorre nome, tags e até o texto de descrição. Combinar filtro com tags é o jeito mais rápido de achar um jogo específico numa biblioteca de 400 itens sem sair do gamepad.

```terminal
$ grep -ri "tag" ~/.local/share/Steam/appcache/ 2>/dev/null | head -5
```

O comando acima tenta algo que, na prática, retorna pouco: a maior parte do metadado está dentro do `appinfo.vdf` binário, então `grep` por "tag" não traz resultados úteis. Isso ensina uma lição valiosa — nem todo dado do Steam está em texto puro local; boa parte é servidora e binária.

:::atencao
Não conclua que "não achou no disco = não existe". Tags, coleções e wishlist são majoritariamente **servidoras**. O que está local no Deck (appmanifest, libraryfolders, appinfo) é o reflexo da instalação e do cache, não o registro mestre. Quando algo não sincroniza, a correção é na conta/na nuveem, não editando arquivos VDF à mão.
:::

## Juntando as três peças num fluxo real

O fluxo maduro de quem tem biblioteca grande é uma sequência: **descobrir** com tags, **guardar** numa coleção ou na wishlist, **isolar** com filtro na hora de jogar. Veja o ciclo completo:

```terminal
$ steam steam://open/library
```

O comando acima abre a biblioteca a partir do terminal usando o protocolo `steam://`. O cliente Steam registra um handler para URLs `steam://` — `steam://open/library` abre a biblioteca, `steam://open/store` abre a loja, `steam://install/2792310` inicia a instalação de um jogo pelo `appid`. É um atalho oculto que conecta o mundo do terminal ao mundo da interface.

```terminal
$ steam steam://install/2792310
```

Ao rodar isso, o cliente abre a página de instalação do `appid` 2792310 (nosso *Balatro* de exemplo). Esse protocolo é a ponte para automação: um script pode disparar instalações ou navegações sem depender dos menus.

## Resumo

- Tag descreve o jogo; coleção agrupa de forma persistente; filtro é consulta temporária.
- Coleções dinâmicas são regras recalculadas; estáticas são listas manuais.
- Tags como `Controller Support` ajudam a escolher jogos adequados ao formato portátil do Deck.
- `appinfo.vdf` é o cache binário de metadados; `appmanifest_*.acf` descreve instalações.
- Tags, coleções e wishlist são servidoras; os arquivos locais refletem instalação e cache.
- O protocolo `steam://` (ex.: `steam://install/2792310`) liga o terminal à interface do cliente.

## Exercícios

1. Liste `ls ~/.local/share/Steam/steamapps/` e conte quantos `appmanifest_*.acf` existem. Compare esse número com a aba "Instalados" da biblioteca.
2. Rode `ls -lh ~/.local/share/Steam/appcache/appinfo.vdf` e explique por que o arquivo é binário e o que ele representa.
3. Crie uma coleção dinâmica "Instalados" e uma estática "Zerados" na interface. Descreva a diferença de comportamento quando você instala/desinstala um jogo.
4. Execute `steam steam://open/library` no terminal e confirme que a biblioteca abre. Depois tente `steam steam://open/store`.
5. **Desafio.** Combine o que aprendeu: use tags para escolher 5 jogos `Controller Support`, coloque-os numa coleção dinâmica, e escreva um filtro que mostre só os instalados desse grupo. Relacione o resultado com os arquivos `appmanifest` e com a seção anterior sobre coleções vs. wishlist.
