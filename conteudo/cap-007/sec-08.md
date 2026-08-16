Toda a sua vida no Steam — saves, conquistas, screenshots, configurações por jogo, nuvem — está ligada a uma conta e aos seus arquivos locais. Perder o Deck ou o SSD não deveria significar perder progresso de centenas de horas. Esta seção trata de backup, sincronização e migração: o que fica na nuvem sozinho, o que não fica, e como mover sua biblioteca inteira para um Deck novo.

:::objetivos
- Distinguir o que o Steam sincroniza na nuvem do que é estritamente local
- Localizar saves, screenshots e configurações no `userdata`
- Usar o backup do Steam para transferir jogos entre máquinas
- Planejar a migração completa para um Deck novo
- Proteger dados locais que a nuvem não cobre
:::

## A nuvem faz metade do trabalho

O Steam Cloud sincroniza saves e algumas configurações de jogos que o suportam — mas **não** sincroniza tudo. Ele cobre arquivos de progresso marcados pelo desenvolvedor; ficam de fora screenshots, mods do Workshop, configurações não-cloud e, claro, a instalação dos próprios jogos (os gigabytes de `common/`). Saber essa fronteira evita a surpresa de "restaurei o Deck novo e meu save não veio".

O que fica na nuvem vive atrelado à conta, não ao disco. O que fica só no disco vive no `userdata`:

```terminal
$ ls ~/.local/share/Steam/userdata/[SEU_STEAM_ID64]/
7/
760/
remote/
config/
```

Cada número (aqui `7/` e `760/`) é um *appid*, e dentro dele ficam os dados locais daquele jogo. O subdiretório `remote/` costuma ser a pasta de sincronização do Steam Cloud localmente — o espelho do que sobe e desce. `config/` guarda preferências do usuário.

:::nota
`userdata/[SEU_STEAM_ID64]/[appid]/remote/` é, para muitos jogos, a cópia local dos saves que o Steam Cloud sincroniza. Fazer backup dessa árvore é o jeito mais barato de "poupar" seu progresso sem depender só da nuvem — útil porque nem todo jogo tem Cloud, e alguns só enviam o save quando você fecha o jogo.
:::

## Mapeando seus saves

O primeiro passo de qualquer estratégia de backup é saber **o que existe** e **quanto pesa**. O `du` responde:

```terminal
$ du -sh ~/.local/share/Steam/userdata/[SEU_STEAM_ID64]/ 2>/dev/null
1.8G	/home/deck/.local/share/Steam/userdata/[SEU_STEAM_ID64]/
```

Quase 2 GB só de dados de usuário — saves, screenshots, config. Num SSD de 512 GB isso é pouco, mas é o conteúdo mais valioso: reinstala-se um jogo em minutos, mas não se refazem 200 horas de save.

Para ver quais jogos têm dados locais:

```terminal
$ ls ~/.local/share/Steam/userdata/[SEU_STEAM_ID64]/ | head -5
1030830
1189630
202750
268750
2792310
```

Cada linha é um `appid` com dados no diretório do usuário. Cruzar esses números com os nomes dos jogos (via interface ou `appinfo.vdf`) te diz exatamente quais títulos deixaram rastro local — e quais dependem 100% da nuvem.

## Screenshots e config: o que a nuvem esquece

Screenshots ficam em `userdata/[SEU_STEAM_ID64]/760/remote/` (o `760` é o appid do sistema de capturas do Steam). Se você tira screenshot pelo Deck e conta só com a nuvem, vale confirmar: o armazenamento em nuvem de screenshots tem limite, e o restante é local.

```terminal
$ ls ~/.local/share/Steam/userdata/[SEU_STEAM_ID64]/760/remote/ | wc -l
143
```

`wc -l` conta 143 screenshots locais. Se você perder o disco sem backup, são essas imagens que somem. O mesmo raciocínio vale para `config/` (preferências finas por jogo, resoluções, bindings de controle) que nem sempre sobem.

:::atencao
Antes de formatar, vender ou trocar o SSD do Deck, faça uma cópia de `~/.local/share/Steam/userdata/[SEU_STEAM_ID64]/` inteira para um pendrive ou microSD. É o diretório que a nuvem **não** restaura por completo. O resto da biblioteca (os jogos em `common/`) é reinstalável; o `userdata` nem sempre.
:::

## O caminho oficial: backup do Steam

O cliente do Steam tem um recurso de backup/restauração de jogos que empacota a instalação de um título para transferir entre máquinas — útil quando a re-download era inviável. No `steamcmd` não há equivalente direto de "backup de jogo instalado" (ele baixa, não empacota), então o gesto é do cliente gráfico: **Biblioteca → botão direito no jogo → Backup dos arquivos**.

O que o terminal faz bem é a alternativa artesanal, só movendo a biblioteca:

```terminal
$ rsync -av --progress ~/.local/share/Steam/steamapps/ /media/deck/BACKUP/steamapps/
```

O `rsync -av` copia a biblioteca inteira para um destino externo, preservando permissões e mostrando progresso. É o método de quem quer mover tudo para um HD externo e depois copiar de volta para um Deck novo, sem refazer dezenas de downloads. O cuidado é só um: o Steam precisa estar fechado para não copiar arquivo em uso.

## Migrando para um Deck novo

O plano completo de migração junta as peças: dados da conta (nuvem), dados locais valiosos (`userdata`) e instalações (opcionalmente via `rsync`). A ordem recomendada:

1. Confirme que o Steam Cloud está em dia (fecha os jogos, aguarda o ícone de sincronização).
2. Copie `userdata/[SEU_STEAM_ID64]/` para um destino externo.
3. Opcional: copie `steamapps/` com `rsync` se quiser pular re-downloads.
4. No Deck novo, entre com a mesma conta e deixe o Cloud restaurar.
5. Copie o `userdata` de volta e rode os jogos para validar os saves.

```terminal
$ rsync -av --progress ~/.local/share/Steam/userdata/ /media/deck/BACKUP/userdata/
```

Este segundo `rsync`, focado no `userdata`, é o que de fato protege o progresso. Os jogos em `common/` são restauráveis pela rede; o `userdata` é único.

## Resumo

- O Steam Cloud sincroniza saves de muitos jogos, mas não screenshots, mods e todas as configs.
- `userdata/[SEU_STEAM_ID64]` guarda saves, screenshots (`760/remote`) e preferências por appid.
- `remote/` dentro de cada appid é o espelho local dos dados de sincronização da nuvem.
- O backup oficial do Steam empacota jogos instalados; o `rsync` migra a biblioteca à mão.
- Antes de formatar/vender, copie `userdata/` inteiro — é o que a nuvem não restaura.
- O plano de migração une nuvem + `userdata` + (opcional) `steamapps` para um Deck novo.

## Exercícios

1. Rode `du -sh ~/.local/share/Steam/userdata/[SEU_STEAM_ID64]/` e anote o tamanho dos seus dados locais.
2. Liste os appids com dados locais (`ls ~/.local/share/Steam/userdata/[SEU_STEAM_ID64]/`) e relate pelo menos dois jogos associados.
3. Conte suas screenshots com `ls ~/.local/share/Steam/userdata/[SEU_STEAM_ID64]/760/remote/ | wc -l`. Elas estão seguras só na nuvem?
4. Faça um `rsync -av --progress` do seu `userdata` para um pendrive ou microSD e confira o tamanho copiado.
5. **Desafio.** Monte um plano de migração escrito para um Deck novo: liste o que você copiaria com `rsync`, o que restauraria pela nuvem e o que reinstalaria. Relacione com as seções de biblioteca e discos deste capítulo.
