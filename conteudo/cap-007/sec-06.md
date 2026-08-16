O SSD é o recurso mais escasso de um Steam Deck. Com jogos que passam de 100 GB e um disco que varia de 64 GB a 1 TB, a biblioteca grande não é um luxo: é um problema de logística que exige método. Esta seção cobre como enxergar o que ocupa espaço, mover conteúdo entre discos, usar o cartão microSD e decidir o que desinstalar sem perder o que importa.

:::objetivos
- Mapear o consumo real de disco da biblioteca
- Entender as camadas do diretório `steamapps`
- Mover jogos entre o SSD e o cartão microSD
- Desinstalar com segurança preservando saves na nuvem
- Auditar bibliotecas duplicadas com `libraryfolders.vdf`
:::

## Onde a biblioteca vive fisicamente

Tudo o que você instala do Steam cai dentro de `~/.local/share/Steam/steamapps/`, mas esse diretório tem camadas com responsabilidades diferentes:

```terminal
$ ls ~/.local/share/Steam/steamapps/
appmanifest_2792310.acf
appmanifest_1189630.acf
common/
libraryfolders.vdf
sourcemods/
workshop/
```

- `common/` — os arquivos de cada jogo, um subdiretório por título.
- `appmanifest_*.acf` — metadados de instalação de cada `appid` (versão, estado, tamanho).
- `workshop/` — conteúdo do Workshop (mods, mapas) baixado por jogo.
- `libraryfolders.vdf` — descreve todas as bibliotecas (SSD + microSD) e o que cada uma contém.

O `common/` é o que pesa; os `.acf` e o `libraryfolders.vdf` são leves e descrevem esse peso.

:::nota
Nunca apague um `.acf` na mão para "desinstalar". A remoção manual deixa o `libraryfolders.vdf` e o cliente em estado inconsistente — o jogo some da biblioteca mas os arquivos ficam órfãos no `common/`. Desinstale sempre pela interface ou por `steamcmd`, que atualizam os metadados de forma coerente.
:::

## Medindo o que ocupa espaço

O primeiro passo para domar a biblioteca é saber exatamente o que custa caro. O comando para isso já apareceu de relance na seção da família; aqui ele ganha o papel central:

```terminal
$ du -sh ~/.local/share/Steam/steamapps/common/* 2>/dev/null | sort -h | tail -5
1.1G	~/.local/share/Steam/steamapps/common/Stardew Valley
2.4G	~/.local/share/Steam/steamapps/common/Balatro
28G	~/.local/share/Steam/steamapps/common/Hades II
42G	~/.local/share/Steam/steamapps/common/Cyberpunk 2077
88G	~/.local/share/Steam/steamapps/common/Elden Ring
```

O `du -sh` soma o tamanho de cada jogo, `sort -h` ordena por tamanho "humano" (reconhecendo G, M, K) e `tail -5` mostra os cinco maiores. A leitura é direta: *Elden Ring* sozinho ocupa 88 GB — em um SSD de 512 GB, ele é quase 18% do disco.

## Descobrindo o tamanho total da biblioteca

Para o número agregado — quanto tudo isso soma — você aponta para a pasta inteira:

```terminal
$ du -sh ~/.local/share/Steam/steamapps/
328G	/home/deck/.local/share/Steam/steamapps
```

Os 328 GB incluem `common/`, `workshop/`, `sourcemods/` e os metadados. Compare com o disco:

```terminal
$ df -h ~/.local/share/Steam
Filesystem      Size  Used Avail Use% Mounted on
/dev/nvme0n1p8  468G  342G  102G  78% /home
```

Do total de 468 GB, só a biblioteca responde por 328 GB — o restante são jogos não-Steam, o próprio sistema e os saves. Ver o número agregado muda a discussão de "quero instalar mais um" para "o que abro mão para instalar esse".

## O cartão microSD como segunda biblioteca

O caminho clássico para expandir o Deck é o cartão microSD. Quando você o insere e formata pelo Steam, o cliente o registra como uma *segunda biblioteca* no `libraryfolders.vdf`:

```terminal
$ cat ~/.local/share/Steam/steamapps/libraryfolders.vdf
"libraryfolders"
{
	"0"
	{
		"path"		"/home/deck/.local/share/Steam"
		"label"		""
		"contentid"		"[SEU_STEAM_ID64]"
		"totalsize"		"512134799360"
		"apps"
		{
			"2792310"		"541212672"
			"1189630"		"20348928"
		}
	}
	"1"
	{
		"path"		"/run/media/deck/MICROSD"
		"label"		"MICROSD"
		"contentid"		"[SEU_STEAM_ID64]"
		"totalsize"		"511705874432"
		"apps"
		{
		}
	}
}
```

Veja o que mudou em relação à versão que lemos na seção da família: agora existe um segundo bloco, `"1"`, com `path` apontando para `/run/media/deck/MICROSD` (o ponto de montagem do cartão no SteamOS) e `apps` vazio — o cartão está formatado, registrado, mas ainda sem jogos. `totalsize` mostra ~512 GB disponíveis nele.

:::dica
Mover um jogo para o microSD não apaga seus saves: eles ficam em `userdata/[SEU_STEAM_ID64]` (local) e/ou na nuvem do Steam. O que se move pelo cliente são os arquivos de `common/`, não o progresso. Por isso mover jogos grandes e pouco usados para o cartão é a forma mais segura de liberar SSD.
:::

## Mover e desinstalar pela interface e pela linha de comando

A movimentação em si é feita pela interface: na biblioteca, propriedades do jogo → **Arquivos instalados → Mover pasta de instalação**. Não há comando oficial equivalente do `steamcmd` para "mover" um jogo entre bibliotecas (ele instala em uma biblioteca específica, mas o *move* é gesto do cliente gráfico). O que o terminal faz bem é **auditar depois**:

```terminal
$ du -sh /run/media/deck/MICROSD/steamapps/common/* 2>/dev/null | sort -h | tail -3
18G	/run/media/deck/MICROSD/steamapps/common/Cyberpunk 2077
42G	/run/media/deck/MICROSD/steamapps/common/Elden Ring
```

Depois de mover, o `du` em `common/` do cartão confirma que os jogos realmente saíram do SSD e chegaram ao microSD. É a prova de que a transferência não é só cosmética.

## A escrita disciplinada da biblioteca

Some tudo e a conclusão vira método: medir (`du`), comparar (`df`), realocar (microSD) e decidir (desinstalar). Quem mantém esse ciclo não é pego de surpresa no meio de uma promoção com "disco cheio".

:::atencao
O `df -h` pode enganar se você tiver Btrfs ou snapshots no sistema, mas no SteamOS o `/home` costuma ser ext4 em uma partição fixa. O número que importa para jogos é o `Avail` da partição onde está `~/.local/share/Steam` — não o tamanho nominal do disco vendido no anúncio.
:::

## Resumo

- `steamapps/` tem `common/` (arquivos), `appmanifest_*.acf` (metadados) e `libraryfolders.vdf` (bibliotecas).
- `du -sh common/* | sort -h` revela os jogos mais pesados de forma legível.
- `du -sh steamapps/` dá o total da biblioteca; `df -h` dá o espaço livre real da partição.
- O microSD vira uma segunda biblioteca registrada no `libraryfolders.vdf` com `path` próprio.
- Mover jogos para o cartão não apaga saves, que ficam em `userdata` e/ou na nuvem.
- Nunca desinstale apagando `.acf` na mão; use a interface ou o `steamcmd`.

## Exercícios

1. Rode `du -sh ~/.local/share/Steam/steamapps/common/* | sort -h` e anote os três maiores jogos.
2. Execute `du -sh ~/.local/share/Steam/steamapps/` e `df -h ~/.local/share/Steam`. Qual a diferença entre os dois números?
3. Insira (ou verifique) um microSD formatado e leia `cat ~/.local/share/Steam/steamapps/libraryfolders.vdf`. Identifique os dois blocos e o `path` de cada um.
4. Mova um jogo da sua biblioteca para o microSD pela interface e confirme com `du -sh /run/media/deck/MICROSD/steamapps/common/<jogo>`.
5. **Desafio.** Some o tamanho de toda a `common/` com `du -sh` e compare com o `totalsize` dos blocos do `libraryfolders.vdf`. Explique qualquer diferença e relacione com a noção de bibliotecas múltiplas vista nesta seção.
