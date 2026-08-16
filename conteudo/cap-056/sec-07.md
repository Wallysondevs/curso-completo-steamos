Mover jogos é uma coisa; mover a biblioteca *inteira*, com prefixos Proton e caches de shaders, é outra. Esta seção cobre a transferência completa da pasta `steamapps` para o microSD, o que ela leva junto (compatdata, shadercache) e como fazer isso com segurança via terminal, além de como reverter.

:::objetivos
- Entender o que a pasta `steamapps` contém além dos arquivos dos jogos
- Transferir a biblioteca Steam inteira para o microSD
- Mover prefixos Proton (`compatdata`) e shader cache corretamente
- Usar symlink para manter caminhos compatíveis após a mudança
- Reverter a migração com segurança
:::

## O que vai junto da biblioteca

A pasta `steamapps` é a unidade de migração. Dentro dela moram:

- `common/` — os arquivos dos jogos (o grosso do espaço).
- `compatdata/` — os prefixos Proton/Wine, um por jogo.
- `shadercache/` — shaders compilados, responsáveis por reduzir stutter.
- `appmanifest_*.acf` — manifestos que o Steam usa para saber o estado de cada jogo.
- `libraryfolders.vdf` — lista de onde ficam as bibliotecas do Steam.

Mover só o `common/` deixa para trás prefixos e shaders — o jogo até abre, mas pode perder saves/configs (no prefixo) ou recompilar todos os shaders (stutter). A migração correta leva tudo.

## Antes de migrar: feche o Steam

O Steam mantém o estado da biblioteca em memória e grava ao fechar. Migrar com ele aberto é pedir inconsistência:

```terminal
## Fechar o Steam completamente (Modo Desktop)
$ pkill steam
```

Depois, confirme que não há processo Steam ativo:

```terminal
$ pgrep -a steam
## (sem saída = fechado)
```

:::atencao
Migrar `steamapps` com o Steam rodando é um erro clássico: ao fechar, o Steam sobrescreve o `libraryfolders.vdf` e os manifestos com o estado antigo em memória, desfazendo sua migração. Feche o Steam antes de qualquer operação desse tipo.
:::

## Transferindo a biblioteca com rsync

Use `rsync` (preserva permissões, timestamps e hardlinks, e pode ser retomado):

```terminal
## Copiar a biblioteca para o cartão preservando tudo
$ rsync -avP --delete ~/.local/share/Steam/steamapps/ /run/media/deck/SD/steamapps/
```

- `-a`: modo arquivo (preserva permissões, dono, timestamps).
- `-v`: verboso.
- `-P`: progresso + retomada parcial.
- `--delete`: apaga no destino o que não existe mais na origem (mantém espelho).

Para migrar (mover de fato, liberando o interno):

```terminal
## Copiar e, após validar, apagar a origem
$ rsync -avP ~/.local/share/Steam/steamapps/ /run/media/deck/SD/steamapps/
$ # validar...
$ rm -rf ~/.local/share/Steam/steamapps/common
```

:::dica
Prefira `rsync -avP` para cópias grandes: se a transferência for interrompida (cartão, energia), você retoma de onde parou sem recomeçar. Evite `mv` entre sistemas de arquivos diferentes — ele copia e apaga igualmente, mas sem retomada segura.
:::

## Manter o caminho via symlink

Se outros programas (ou jogos com caminho absoluto gravado) esperam a biblioteca no local antigo, um symlink resolve:

```terminal
## Apontar o steamapps original para o cartão
$ rm -rf ~/.local/share/Steam/steamapps
$ ln -s /run/media/deck/SD/steamapps ~/.local/share/Steam/steamapps
```

Com isso, o caminho `~/.local/share/Steam/steamapps/...` continua válido, mas os dados vivem fisicamente no cartão. Porém, o Steam moderno gerencia múltiplas bibliotecas nativamente, então o symlink é mais útil para jogos não-Steam e prefixos com caminho fixo do que para a biblioteca Steam em si.

:::atencao
Symlink para uma localização em mídia removível tem um risco: se o cartão não estiver montado, o caminho aponta para o nada e os jogos somem do Steam até remontar. É outro argumento para montar o cartão via fstab com um ponto fixo (veja a seção de montagem).
:::

## Migrando prefixos Proton e shadercache

Se você moveu só os jogos e quer levar também os prefixos e shaders:

```terminal
## Mover compatdata (prefixos Proton)
$ rsync -avP ~/.local/share/Steam/steamapps/compatdata/ /run/media/deck/SD/steamapps/compatdata/

## Mover shadercache
$ rsync -avP ~/.local/share/Steam/steamapps/shadercache/ /run/media/deck/SD/steamapps/shadercache/
```

Cada pasta deve terminar no cartão com a mesma estrutura de `appid` da origem, para que o Steam as encontre.

## Revertendo a migração

Para voltar ao SSD interno, inverta a direção:

```terminal
$ pkill steam
$ rsync -avP /run/media/deck/SD/steamapps/ ~/.local/share/Steam/steamapps/
## validar e, se o symlink existir, remover:
$ rm ~/.local/share/Steam/steamapps
```

Depois, abra o Steam e use "Verificar integridade" nos jogos se algo não abrir.

## Pontos-chave

- `steamapps` leva `common`, `compatdata`, `shadercache`, manifestos e `libraryfolders.vdf`.
- Feche o Steam (`pkill steam`) antes de migrar, ou ele sobrescreve o estado.
- Use `rsync -avP` para copiar com segurança e retomada.
- Symlink mantém caminhos antigos válidos, mas depende do cartão sempre montado.
- Reverter é inverter a direção do rsync (e remover o symlink, se houver).

## Exercícios

1. Liste o conteúdo de `~/.local/share/Steam/steamapps/` e identifique cada pasta (common, compatdata, shadercache).
2. Feche o Steam, copie `steamapps` para o cartão com `rsync -avP` e valide com `du -sh` nos dois lados.
3. Crie um symlink de `steamapps` para o cartão e teste abrir um jogo.
4. Migre separadamente `compatdata` e `shadercache` e confirme que os `appid` batem.
5. **Desafio.** Reverta a migração inteira de volta para o SSD e confirme que os jogos abrem normalmente.
