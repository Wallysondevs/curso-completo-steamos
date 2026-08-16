Uma biblioteca grande vira rapidamente um amontoado de centenas de títulos onde nada é encontrado. A Família Steam ataca a outra ponta do problema — dividir jogos entre pessoas —, enquanto wishlist e listas atacam a ponta de "o que eu quero" versus "o que eu tenho". Estas duas engrenagens, juntas, mudam a forma como você consome o catálogo no Deck.

:::objetivos
- Entender o modelo de compartilhamento da Família Steam
- Configurar membros e identificar os limites do recurso
- Compreender o papel da wishlist e das listas de curadoria
- Diferenciar wishlist de coleções e de tags
- Localizar onde o Steam guarda essas preferências no disco
:::

## Família Steam: o que mudou no compartilhamento

O compartilhamento de biblioteca existe na Steam há muito tempo, mas a **Família Steam** (Steam Families) consolidou e simplificou o modelo. Você convida até cinco pessoas para o grupo familiar; cada membro mantém sua conta, seus saves e suas conquistas separados, mas acessa os jogos dos outros quando eles não estão usando a biblioteca — na maioria das vezes até simultaneamente, desde que sejam títulos diferentes.

O detalhe importante para o Deck é que a biblioteca familiar não se limita a um aparelho: o vínculo é por **conta**, não por máquina. Quem entra na família vê os jogos dos demais em qualquer dispositivo onde esteja logado, inclusive no Deck.

```terminal
$ ls ~/.local/share/Steam/steamapps
appmanifest_2792310.acf
appmanifest_1189630.acf
common
libraryfolders.vdf
sourcemods
workshop
```

Os jogos compartilhados aparecem no seu Deck como se fossem seus, sem instalação duplicada: o `libraryfolders.vdf` e a pasta `common` (onde ficam os binários de cada jogo) são compartilhados entre as contas da família na mesma máquina. A Valve cuida de modelar a permissão no servidor; localmente você vê o resultado como um jogo a mais na biblioteca.

:::nota
O limite prático: jogos da família **não** são usáveis por dois membros ao mesmo tempo quando é o mesmo título, salvo exceções em que cada um tem sua própria cópia. A regra clássica — "se o dono abrir o jogo, o outro é desconvidado da sessão" — ainda vale para a maior parte do catálogo. Vale conferir na página oficial da Família Steam quais títulos permitem uso simultâneo.
:::

## Configurando a família no Deck

O fluxo acontece na interface, não em arquivos: **Steam → Configurações → Família**. De lá você cria o grupo e envia convites por nome de usuário. Não há comando de terminal que "ative" a família, porque a configuração vive nos servidores da Valve. O que o terminal mostra é o efeito local:

```terminal
$ ls ~/.local/share/Steam/userdata
[SEU_STEAM_ID64]
[OUTRO_STEAM_ID64]
```

Depois que um membro da família loga no mesmo Deck, o `userdata` passa a ter mais de uma subpasta: uma por conta, cada uma com seus saves, screenshots e configurações isolados. É a prova concreta de que contas de família coexistem na mesma instalação sem misturar dados.

## Wishlist: o radar de compras

A wishlist é a lista de desejos: jogos que você marcou para ficar de olho, que disparam aviso quando entram em promoção. É separada da biblioteca — desejar não é possuir. No cliente, o comando de marcar/desmarcar fica no botão da loja de cada jogo.

O estado da wishlist fica sincronizado na conta, não num arquivo óbvio do Deck, mas dá para inspecionar o cache local da loja e confirmar que existe tráfego de dados relacionado:

```terminal
$ ls ~/.local/share/Steam/appcache
appinfo.vdf
librarycache
packageinfo.vdf
stats
```

O diretório `appcache` guarda metadados baixados sobre aplicativos (incluindo imagens, nomes e preços em cache). A wishlist em si é servidora, então o que você edita no Deck aparece igual no desktop e no celular. É o oposto da família em um sentido: a wishlist é *sua* e não é compartilhada com o grupo.

:::dica
Use a wishlist de forma ativa: ela é o gatilho das notificações de desconto por e-mail e no app. Manter a wishlist enxuta (títulos que você realmente compraria) evita notificação-spam e torna a regra de "só comprar na promoção" muito mais fácil de cumprir.
:::

## Listas de curadoria e a diferença para coleções

Existe uma distinção que gera confusão constante entre três conceitos com nomes parecidos:

| Recurso | Vive em | O que é |
|---|---|---|
| Wishlist | Loja | Jogos que você quer comprar, com alerta de preço |
| Coleções | Biblioteca | Agrupamentos que você cria para organizar o que **já possui** |
| Tags | Loja + Biblioteca | Rótulos que descrevem gênero/estilo, aplicados por usuários e pela Valve |
| Listas de curadores | Loja (comunidade) | Recomendações feitas por curadores seguidos |

A wishlist é "quero ter"; a coleção é "já tenho, e guardo aqui". As tags aparecem de novo em seção própria neste capítulo. O que importa reter agora: você pode organizar a wishlist em categorias próprias, e ela não se confunde com as coleções da biblioteca, que só listam jogos instalados ou possuídos.

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
}
```

Este arquivo é a fonte da verdade sobre a **localização física** da biblioteca no Deck: o bloco `"0"` com `path` aponta para o diretório raiz da biblioteca, e a lista `apps` associa cada `appid` ao tamanho instalado em bytes. Quando você instala um jogo compartilhado da família, ele continua aparecendo aqui pelo `appid`, somado ao total `totalsize` em bytes (512 GB no exemplo, coerente com o SSD do Deck OLED de 512 GB).

## Wishlist e família em perspectiva

Os dois recursos se complementam de um jeito que vale deixar explícito. A família resolve **acesso**: quanto do catálogo da casa cada membro pode abrir. A wishlist resolve **intenção**: o que cada pessoa, individualmente, pretende comprar. Uma família jogando junto costuma coordenar a wishlist para não comprar o mesmo título duas vezes.

```terminal
$ du -sh ~/.local/share/Steam/steamapps/common/* 2>/dev/null | sort -h | tail -5
2.4G	~/.local/share/Steam/steamapps/common/Balatro
18G	~/.local/share/Steam/steamapps/common/Stardew Valley
42G	~/.local/share/Steam/steamapps/common/Elden Ring
```

O `du -sh` somado a `sort -h` lista as pastas de jogos por tamanho legível, do menor ao maior, com os cinco maiores no final. Com uma família compartilhando o mesmo SSD de 512 GB, é exatamente esse tipo de visão que diz se "comprei um jogo novo" cabe antes de instalar.

## Resumo

- Família Steam vincula contas (até ~6 pessoas), mantendo saves e conquistas separados por membro.
- O vínculo é por conta, não por máquina; jogos compartilhados aparecem no Deck como próprios.
- `libraryfolders.vdf` descreve onde a biblioteca está e quanto cada `appid` ocupa em disco.
- `userdata` ganha uma subpasta por SteamID64 quando mais de uma conta loga no mesmo Deck.
- Wishlist é "quero comprar" e dispara aviso de promoção; coleções organizam o que já se possui.
- Tags e listas de curadores são conceitos distintos de wishlist e coleções.

## Exercícios

1. Liste `ls ~/.local/share/Steam/userdata` e verifique quantas subpastas de conta existem. Se houver mais de uma, tente relacionar cada SteamID64 a um membro da família.
2. Rode `cat ~/.local/share/Steam/steamapps/libraryfolders.vdf` e identifique o `path` da biblioteca e o `totalsize`. Confirme se o total bate com o tamanho do seu SSD.
3. Execute `du -sh ~/.local/share/Steam/steamapps/common/* | sort -h` e escreva os três jogos mais pesados instalados no seu Deck.
4. Abra a wishlist na interface, marque e desmarque um jogo, e explique por que essa alteração não aparece em nenhum arquivo local óbvio do Deck.
5. **Desafio.** Com um segundo membro da família logando no mesmo Deck, liste `ls ~/.local/share/Steam/userdata` antes e depois do login. Explique o que muda e como isso comprova o isolamento de saves entre contas, ligando ao `loginusers.vdf` da seção anterior.
