Chegou a hora da gravação: o SRM converte a lista validada no preview em dois conjuntos de arquivos reais — os atalhos no `shortcuts.vdf` e as imagens na pasta de grid. Esta seção mostra o que exatamente é gravado, como ler o `shortcuts.vdf` para confirmar o resultado e como o Steam transforma esses arquivos nos itens que você vê na biblioteca.

:::objetivos
- Entender o que o SRM grava no `shortcuts.vdf` e na pasta `grid/`
- Ler e interpretar a estrutura do `shortcuts.vdf`
- Explicar como o shortcut ID é derivado do nome do atalho
- Confirmar a geração comparando arquivos antes e depois
- Preparar o Steam para exibir os atalhos recém-criados
:::

## O que acontece no Save

Quando você clica em gerar, o SRM executa três ações em sequência:

1. **Escreve os atalhos** — para cada jogo da lista, adiciona uma entrada ao `shortcuts.vdf`.
2. **Baixa/copia a arte** — grava capa, banner e ícone na pasta `grid/`, nomeados pelo shortcut ID.
3. **Reporta o resultado** — mostra quantos atalhos e quantas imagens foram gravados.

A gravação do atalho e a da arte estão acopladas pelo **shortcut ID**: um número inteiro, único para cada atalho, derivado deterministicamente do rótulo do atalho. É por esse número que o Steam casa o atalho (no `shortcuts.vdf`) com a imagem (na pasta `grid/`).

```terminal
$ ls ~/.steam/steam/userdata/367540/config/grid/ | wc -l
214
```

Depois de gerar, o número de arquivos na pasta `grid/` cresce de cara. Cada jogo pode contribuir com até três arquivos (capa, banner, ícone), então um salto grande no total é o esperado — não é sinal de erro.

## Lendo o shortcuts.vdf

O `shortcuts.vdf` é texto puro em formato VDF. Ele tem uma peculiaridade: as chaves de atalho são identificadores hexadecimais gerados pelo próprio Steam, e o SRM os atribui ao criar novas entradas. Veja um trecho real:

```text
"shortcuts"
{
    "0"
    {
        "appid"        "0123456789"
        "AppName"      "Super Mario World"
        "Exe"          "/home/deck/.var/app/org.libretro.RetroArch/.../retroarch"
        "StartDir"     "/home/deck/Emulation/roms/snes/"
        "LaunchOptions" "-L \"/home/deck/.../cores/snes9x_libretro.so\" \"/home/deck/Emulation/roms/snes/Super Mario World.sfc\""
        "IsHidden"     "0"
        "AllowDesktopConfig" "1"
        "tags"         { "0" "Emulators" }
    }
}
```

Os campos que importam:

| Campo | Significado |
|---|---|
| `appid` | O shortcut ID — casa com o nome do PNG na pasta `grid/` |
| `AppName` | O título exibido na biblioteca |
| `Exe` | O executável (o binário do emulador) |
| `StartDir` | Diretório de trabalho |
| `LaunchOptions` | Argumentos (core + caminho da ROM) |
| `tags` | Coleção/categoria atribuída (aqui "Emulators") |

```terminal
$ grep -c 'AppName' ~/.steam/steam/userdata/367540/config/shortcuts.vdf
3
```

O `grep -c` conta quantos atalhos estão gravados — útil para conferir se o número bate com o do preview antes do save.

## De onde vem o shortcut ID

O `appid` (shortcut ID) não é aleatório: ele é um hash determinístico do rótulo do atalho, calculado pelo SRM com um algoritmo fixo. A consequência prática é importante — se dois atalhos têm o *mesmo* nome, eles colidem no mesmo ID, e a arte de um sobrescreve a do outro.

```terminal
$ echo -n "Super Mario World" | cksum
2776266656 17
```

O exemplo acima *ilustra* a ideia (o SRM usa outro algoritmo), mas o princípio vale: o ID sai do nome, então nomes iguais geram IDs iguais. Por isso a etapa de limpeza de títulos da [seção de filtros](#/cap-051/sec-05) não é só estética — ela previne colisão de arte quando dois jogos de plataformas diferentes têm o mesmo nome.

:::atencao
Se você tem "Super Mario World" no SNES e um hacks ROM de "Super Mario World" no GBA com o mesmo rótulo, os dois recebem o mesmo shortcut ID e disputam a mesma imagem. A solução é diferenciar o título (ex.: "Super Mario World (GBA)") ou ajustar o rótulo no preview para que cada um tenha nome único.
:::

## Confirmando a geração

A forma mais rigorosa de confirmar o que mudou é comparar o `shortcuts.vdf` com o backup que você fez antes:

```terminal
$ diff ~/shortcuts.vdf.bak-20260202-143000 \
  ~/.steam/steam/userdata/367540/config/shortcuts.vdf
```

O `diff` mostra exatamente as linhas adicionadas (com `>`) — uma entrada de atalho inteira por jogo. Se o diff vier vazio, o SRM não gravou nada, e você deve revisar se clicou no save certo ou se o Steam estava aberto.

```terminal
$ date; ls -la ~/.steam/steam/userdata/367540/config/shortcuts.vdf
seg fev  2 15:00:00 -03 2026
-rw-r--r-- 1 deck deck 4821 fev  2 15:00 ~/.steam/steam/userdata/367540/config/shortcuts.vdf
```

O carimbo de horário do arquivo também serve de confirmação rápida: se a hora bate com o momento do save, a gravação ocorreu.

## A exibição no Steam

Depois de gerar, há uma ordem para ver o resultado:

1. **Feche o SRM** (não é obrigatório, mas evita sobrescrita acidental).
2. **Abra o Steam** normalmente.
3. Navegue até a biblioteca e filtre pela coleção criada (ex.: "Emulators" ou a categoria do seu parser).

Os atalhos externos aparecem no Steam como qualquer outro jogo — com capa, banner e ícone. A única diferença funcional é que eles não têm AppID de loja: não têm conquistas, não atualizam e não guardam na nuvem do Steam.

```terminal
$ flatpak run com.valvesoftware.Steam --reset-collections  ## exemplo ilustrativo; não recomendado sem necessidade
```

Na prática você não faz nada disso: o Steam indexa os atalhos do `shortcuts.vdf` na inicialização, e a coleção aparece automaticamente se o SRM configurou a tag.

:::nota
Se você quiser que os atalhos apareçam *na frente* junto com seus jogos favoritos, marque-os como favoritos no modo jogo. Atalhos externos não entram automaticamente no "Favoritos" nem no "Recentemente jogados" até você abri-los pela primeira vez.
:::

## Resumo

- O Save grava três coisas: atalhos no `shortcuts.vdf`, arte na pasta `grid/` e um relatório.
- O `shortcuts.vdf` guarda `appid`, `AppName`, `Exe`, `StartDir` e `LaunchOptions` por atalho.
- O `appid` (shortcut ID) é derivado do nome do atalho e casa com o nome do arquivo de arte.
- Nomes idênticos colidem no mesmo ID e disputam a mesma imagem — evite duplicatas de rótulo.
- Um `diff` contra o backup ou o carimbo de horário confirmam se a gravação ocorreu.
- O Steam indexa o `shortcuts.vdf` na inicialização e mostra os atalhos como jogos normais.

## Exercícios

1. Gere os atalhos e confira com `grep -c 'AppName'` se o número bate com o do preview.
2. Abra o `shortcuts.vdf` e localize a entrada de um jogo. Identifique o `appid`, o `Exe` e o `LaunchOptions`.
3. Na pasta `grid/`, encontre os arquivos de imagem cujo prefixo é o `appid` daquele jogo. Há capa, banner e ícone?
4. Faça o `diff` entre o `shortcuts.vdf` pós-geração e o backup. Quantas entradas foram adicionadas?
5. **Desafio.** Crie deliberadamente dois atalhos com o mesmo rótulo em parsers diferentes, gere e observe a colisão de arte na pasta `grid/`. Depois corrija renomeando um deles e explique por que o ID mudou.