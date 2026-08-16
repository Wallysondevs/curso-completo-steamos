O Proton é a mágica que faz jogos Windows rodarem no Deck, e essa mágica cobra em disco. Para cada título Windows que você instala, o Steam cria um **prefixo** — uma mini-instalação do Wine com sua própria árvore `drive_c`, registro, DLLs e configurações. É o conteúdo de `compatdata`, e ele é o segundo maior ladrão de espaço depois dos próprios jogos. Desinstalar o jogo pela interface do Steam normalmente já remove o prefixo, mas nem sempre — e é aí que entra o gerenciamento manual.

:::objetivos
- Entender o que é um prefixo Proton e por que ele ocupa espaço
- Localizar e medir `compatdata` na árvore da biblioteca Steam
- Associar AppIDs a jogos e aos seus prefixos
- Remover prefixos órfãos de jogos já desinstalados
- Limpar caches internos do prefixo (shader, `drive_c/users`, `pfx` temporário)
:::

## O que é um prefixo compatdata

Quando o Proton executa um jogo Windows, ele precisa de um ambiente que imite um disco `C:` do Windows. Esse ambiente — chamado *prefixo* no mundo Wine — contém:

- `drive_c/` — a árvore de diretórios estilo Windows (`Program Files`, `users`, `windows`)
- `pfx.lock` — trava indicando que o prefixo está em uso
- `tracked_files` — lista de arquivos instalados pelo Steam
- `version` — a versão do Proton que criou o prefixo

```terminal
$ ls ~/.local/share/Steam/steamapps/compatdata/1245620/
drive_c   pfx.lock   tracked_files   version
```

Cada prefixo desses pesa, em média, de 300 MB a 2 GB — dependendo do jogo e do que ele instala no `drive_c` (redistribuíveis, .NET, saves locais, mods).

:::nota
O caminho `compatdata` que você vê aqui é o da biblioteca principal do SSD. Se você criou bibliotecas adicionais — por exemplo, uma `SteamLibrary` no microSD — cada uma delas tem *seu próprio* `compatdata`, no mesmo nível do `steamapps`. Um jogo instalado no microSD guarda o prefixo em `/run/media/deck/<id>/SteamLibrary/steamapps/compatdata`, não no `~/.local/share/Steam`. Ao caçar órfãos, varra **todas** as bibliotecas, não só a principal.
:::

## Medindo o estrago por prefixo

O `compatdata` organiza tudo por AppID, igual ao shader cache:

```terminal
$ du -sh ~/.local/share/Steam/steamapps/compatdata
18G   compatdata

$ du -sh ~/.local/share/Steam/steamapps/compatdata/* | sort -hr | head -5
4.2G   compatdata/1245620
2.8G   compatdata/730
1.9G   compatdata/1172470
1.1G   compatdata/1085660
850M   compatdata/22380
```

O AppID `22380` é *Fallout: New Vegas*, `1085660` é *Destiny 2* e `1245620` é *Elden Ring*. Cada prefixo de quase 5 GB em Elden Ring é típico para jogos que instalam redistribuíveis e mantêm shader pipeline cache interno.

## Prefixos órfãos: o caso perigoso

Aqui está a armadilha real. Quando você desinstala um jogo pelo Steam, ele apaga os dados em `steamapps/common`, mas o prefixo compatdata **nem sempre vai junto** — principalmente se o jogo foi removido pela interface do modo Big Picture, se a desinstalação foi interrompida, ou se você moveu bibliotecas manualmente.

O resultado são prefixos *órfãos*: pastas de gigabytes que não correspondem a nenhum jogo instalado. Detectá-los exige cruzar os AppIDs:

```terminal
## Lista os prefixos existentes
$ ls ~/.local/share/Steam/steamapps/compatdata

## Lista os jogos que estão instalados (appmanifests)
$ ls ~/.local/share/Steam/steamapps/appmanifest_*.acf | \
    sed 's/.*appmanifest_//; s/\.acf//'
```

Todo AppID que aparece em `compatdata` mas **não** tem um `appmanifest` correspondente em `steamapps` é candidato a órfão. Antes de apagar, confirme que o jogo não está de fato na biblioteca:

```terminal
$ grep -m1 '"name"' ~/.local/share/Steam/steamapps/appmanifest_22380.acf
	"name"		"Fallout: New Vegas"
```

## Proton diferentes, prefixos diferentes

Quando você troca a versão do Proton de um jogo (ex.: de "Proton Experimental" para "GE-Proton9-7"), o Steam cria um *novo* prefixo, e o antigo permanece em disco — o Steam não apaga prefixos de versões anteriores. Com o tempo, um mesmo jogo pode ter dois ou três prefixos de Proton diferentes acumulados:

```terminal
$ ls ~/.local/share/Steam/steamapps/compatdata/1245620/
drive_c_GE   drive_c_7.0   pfx.lock   version
```

Aqui, `drive_c_GE` e `drive_c_7.0` são prefixos do mesmo jogo para versões diferentes do Proton. O Steam só usa um de cada vez, mas mantém os outros para o caso de você alternar de volta. Se você fixou uma versão e sabe que não vai voltar, as versões antigas são lixo seguro de apagar.

## Removendo um prefixo com cuidado

Remover o prefixo de um jogo *instalado* faz ele ser recriado do zero na próxima execução — você perde saves que vivem dentro do prefixo (jogos antigos que não usam Steam Cloud) e mods instalados manualmente. Remova apenas prefixos de jogos já desinstalados, ou faça backup antes.

```terminal
$ rm -rf ~/.local/share/Steam/steamapps/compatdata/22380
```

:::perigo
Alguns jogos antigos salvam o progresso **dentro** do prefixo, em `drive_c/users/steamuser/Documents` ou `AppData`. Se o jogo não sincroniza com Steam Cloud, apagar o prefixo apaga o save permanentemente. Antes de remover, procure por saves:

```terminal
$ find ~/.local/share/Steam/steamapps/compatdata/22380/drive_c/users -iname '*.sav' -o -iname '*.dat' 2>/dev/null
```

Se aparecer algo, copie para `~/backups/` antes do `rm`.
:::

## Limpeza interna do prefixo sem removê-lo

Nem sempre é preciso apagar o prefixo inteiro para recuperar espaço. Dá para fazer uma limpeza *cirúrgica* dentro dele:

```terminal
## Shader pipeline cache que cada jogo gera dentro do prefixo
$ find ~/.local/share/Steam/steamapps/compatdata -name '*.tpipelinecache' -size +1M

## Arquivos temporários e de instalação deixados para trás
$ find ~/.local/share/Steam/steamapps/compatdata -type d -name 'Temp' -exec du -sh {} \;
```

O cache de pipeline do DirectX (`.tpipelinecache` e `.dxgi-cache`) é regenerável e seguro de apagar. Os diretórios `Temp` dentro de `drive_c/windows/Temp` e `drive_c/users/steamuser/Temp` também acumulam lixo de instalações antigas.

## Resumo

- Cada jogo Proton ganha um prefixo em `compatdata/<AppID>` com árvore `drive_c` completa.
- Prefixos pesam de 300 MB a vários GB; medindo-se por `du -sh` descobre-se os maiores.
- Desinstalar um jogo pela interface nem sempre remove o prefixo, gerando órfãos.
- Cross-cruzando `compatdata` com `appmanifest_*.acf`, identifica-se AppIDs órfãos.
- Antes de apagar um prefixo, verifique saves internos e faça backup.

## Exercícios

1. Liste e ordene por tamanho os prefixos de `compatdata` com `du -sh ... | sort -hr`.
2. Identifique a qual jogo pertence cada um dos três maiores prefixos usando os `appmanifest_*.acf`.
3. Cruze a lista de `compatdata` com a de `appmanifest` e encontre prefixos órfãos na sua biblioteca.
4. Faça backup dos saves de um jogo antigo dentro do `drive_c` e então remova o prefixo com `rm -rf`.
5. **Desafio.** Escolha um prefixo grande, aplique a limpeza interna (`.tpipelinecache` e `Temp`), meça o antes e o depois, e registre quanto espaço foi recuperado sem tocar nos saves.