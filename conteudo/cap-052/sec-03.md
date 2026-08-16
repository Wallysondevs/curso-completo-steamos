Quando você baixa um romset completo de MAME, ele vem organizado de uma entre três formas: *merged*, *split* ou *non-merged*. A escolha entre elas não muda nada no resultado do jogo — muda o tamanho em disco, quantos arquivos você carrega e, sobretudo, o quanto você entende (ou se perde) quando algo dá errado. Vale gastar alguns minutos aqui porque a decisão afeta todo o resto da sua coleção.

:::objetivos
- Entender a noção de jogo-pai (parent) e clone (child)
- Diferenciar merged, split e non-merged na prática
- Escolher o formato certo para o seu uso no RetroArch
- Entender por que clones dependem dos arquivos do parent
- Reorganizar a coleção de um formato para outro
:::

## Parent e clone: a relação que organiza tudo

No mundo do arcade, vários "jogos" são, na verdade, variações de uma mesma placa. *Street Fighter II: The World Warrior* teve revisões, versões regionais e *bootlegs* (cópias piratas de operadores). O MAME modela isso como uma árvore: existe um **parent** (o jogo de referência, geralmente a versão mais "limpa" e mundial) e, apontando para ele, os **clones** (as revisões e versões regionais).

```terminal
$ flatpak run org.libretro.RetroArch --list-cores
```

O conceito central é que um clone **compartilha a maior parte dos chips** com o parent. só uns poucos arquivos diferem — tipicamente a ROM de programa, que carrega a correção de uma revisão. Guardar tudo duplicado desperdiçaria espaço; aí entram os três formatos.

## Merged: tudo dentro de um único zip

No formato *merged*, um único `.zip` contém o parent **e** todos os seus clones. O arquivo `sf2.zip` traria, além dos arquivos do jogo base, os arquivos específicos de cada clone.

```terminal
$ unzip -l sf2.zip | head
 sf2/sf2_9.12a
 sf2/sf2_7.12f
 sf2ee/sf2ee_9.12a
 sf2ce/sf2ce_9.12a
```

Repare no prefixo: cada arquivo fica dentro de um "subdiretório" virtual com o short name do jogo a que pertence (`sf2/`, `sf2ee/`, `sf2ce/`). O parent `sf2` e o clone `sf2ee` (revisão "Champion Edition") convivem no mesmo zip.

**Vantagem:** mínimo de arquivos em disco, um zip por "família". **Desvantagem:** baixar um único jogo implica baixar a família inteira, e atualizar exige substituir o zip completo.

## Split: parent e clones em zips separados

O *split* é o formato histórico do projeto MAME. O parent fica em um `.zip` com todos os arquivos dele; cada clone fica em outro `.zip` que contém **apenas os arquivos que diferem** do parent.

```terminal
$ ls -la ~/lab/arcade/
-rw-r--r--  ana  6.1M  sf2.zip        # parent completo
-rw-r--r--  ana  180K  sf2ee.zip       # só o que muda
-rw-r--r--  ana  240K  sf2ce.zip       # só o que muda
```

O detalhe crítico: o clone `sf2ee.zip` **não é autocontido**. Para o MAME rodar `sf2ee`, ele precisa do `sf2.zip` (parent) presente também, de onde pega os chips comuns.

:::atencao
No formato split, copiar só o `.zip` do clone para o Steam Deck e achar que vai funcionar é o erro mais frequente. O clone depende do parent no mesmo diretório.
:::

## Non-merged: cada jogo se basta

No *non-merged*, o emulador gera um `.zip` por jogo, e **cada um é completo**: o `sf2ee.zip` contém todos os arquivos necessários, inclusive os que vieram do parent. Nada é compartilhado.

```terminal
$ ls -la ~/lab/arcade/
-rw-r--r--  ana  6.1M  sf2.zip
-rw-r--r--  ana  6.3M  sf2ee.zip   # completo, duplica os comuns
-rw-r--r--  ana  6.3M  sf2ce.zip   # completo, duplica os comuns
```

**Vantagem:** cada jogo é uma ilha. Você pode copiar um único `.zip` para qualquer lugar e ele roda sozinho — perfeito para carregar só os jogos que importam num portátil. **Desvantagem:** ocupa bem mais espaço, pois os chips comuns são duplicados em cada clone.

## Qual escolher no RetroArch

Para o Steam Deck, a recomendação prática é direta: **non-merged** para quem quer pegar jogos soltos e jogar sem dor de cabeça, e **split** para quem quer manter a coleção completa consumindo pouco espaço e não se importa em carregar também os parents.

:::dica
Se você pretende usar o *Steam ROM Manager* para puxar cada jogo individualmente para a biblioteca Steam (como no [capítulo 51](#/cap-051/sec-01)), o formato non-merged elimina a chance de um atalho apontar para um clone sem o parent e abrir tela preta.
:::

A regra de ouro continua valendo: qualquer que seja o formato, a **versão** precisa bater com a do núcleo. Um non-merged do MAME 0.220 não funciona no núcleo 0.261.

## Resumo

- Parent é o jogo de referência; clones são revisões e versões regionais que compartilham chips com ele.
- Merged junta parent e clones num único `.zip`.
- Split separa parent e clones, mas o clone depende dos arquivos do parent.
- Non-merged torna cada jogo autocontido, duplicando os arquivos comuns.
- Para jogos soltos no Steam Deck, non-merged é o mais prático; split economiza espaço para coleções completas.

## Exercícios

1. Com `unzip -l`, inspecione um romset merged e identifique o prefixo de subdiretório que separa parent de cada clone.
2. Baixe um clone no formato split e tente rodá-lo sem o parent; anote a mensagem de erro do núcleo e confirme a dependência.
3. Compare o tamanho total em disco de uma família (parent + 3 clones) em split versus non-merged com `du -sh` e explique a diferença.
4. Liste, com um comando, todos os `.zip` de um diretório que sejam menores que 300 KB e explique por que, no split, esses provavelmente são clones incompletos.
5. **Desafio.** Explique, desenhando a árvore parent/clone, por que o mesmo clone pode "funcionar" com um parent e "não funcionar" com outro de versão diferente — e relacione isso com o CRC da seção 1.
