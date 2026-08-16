O Steam Deck é um PC Linux com a roupagem de um console, e isso tem consequência direta no suporte: os comandos de diagnóstico que rodam nele são os mesmos que rodam em qualquer distribuição. Quando você pede ajuda na comunidade, a moeda de troca é o log, não o relato — e saber gerar, filtrar e colar um log decente transforma a resposta que você recebe de "não sei" em "é isto aqui".

:::objetivos
- Gerar os logs e dumps que a comunidade e a Valve pedem
- Coletar informações de sistema relevantes para qualquer pedido de ajuda
- Usar ferramentas de paste para compartilhar logs sem poluir o canal
- Ler um log de jogo para antecipar o diagnóstico

:::

## Por que logs valem mais que relatos

Um relato é opinião ("o jogo fecha sozinho"); um log é evidência ("`dxvk` aborta ao carregar shader 512"). Quando você posta só o relato, quem vai te ajudar precisa de várias trocas de mensagem só para descobrir o que um log teria dito de imediato. Quando você posta o log, reduz o atrito e acelera a resposta — ou, melhor ainda, descobre o problema sozinho.

A comunidade do Steam Deck, em particular, vive de logs por causa do Proton e do Gamescope: a camada de compatibilidade gera logs detalhados que quase sempre apontam exatamente onde a execução morreu.

```terminal
$ # logs do cliente steam:
$ ls ~/.steam/steam/logs/ | head
bootstrap_log.txt
controller_log.txt
content_log.txt
shader_log.txt
```

## Coletando informações do sistema

Antes de pedir ajuda, levante o contexto em um comando. As quatro informações que aparecem em todo pedido de ajuda bem-sucedido:

```terminal
$ cat /etc/os-release | grep -E 'PRETTY_NAME|VERSION_ID'
PRETTY_NAME="SteamOS 3.6"
VERSION_ID="3.6"
$ uname -r
6.8.0-valve1
$ lsb_release -a 2>/dev/null
Distributor ID: SteamOS
Description:    SteamOS 3.6.x
$ flatpak list | wc -l
42
```

**Versão do SteamOS**, **kernel**, **modelo do Deck** e **conjunto de flatpaks** formam o cartão de visita do seu sistema. Guarde esse conjunto em um arquivo que você possa colar rapidamente em qualquer pedido.

```terminal
$ # consolidando tudo num unico relatorio:
$ {
    echo "=== OS ==="; cat /etc/os-release
    echo "=== KERNEL ==="; uname -a
    echo "=== DT/Modelo ==="; cat /sys/devices/virtual/dmi/id/product_name 2>/dev/null
    echo "=== FLATPAKS ==="; flatpak list --columns=application | head -30
  } > ~/Lab/relatorio-sistema.txt
$ wc -l ~/Lab/relatorio-sistema.txt
48 ~/Lab/relatorio-sistema.txt
```

Esse relatório é o que separa o pedido de ajuda que recebe resposta útil do que morre com "manda mais detalhe aí".

## Capturando o log de um jogo

Para jogos via Proton, o log pode ser capturado de duas formas. Pela interface: nas propriedades do jogo, em propriedades de inicialização, adicione `PROTON_LOG=1 %command%`, que grava `~/steam-<appid>.log` no home. Pelo terminal, dá para reproduzir o mesmo efeito e ler na hora:

```terminal
$ PROTON_LOG=1 %command%
```

Como ilustração do tipo de linha que aparece no log gerado:

```terminal
$ tail -20 ~/steam-valve-app-1086940.log
3124.318:0110:0120:err:dxvk: ...
3124.318:0110:0120:fixme:d3d11: ...
3124.318:0110:0120:err:vulkan: vkCreateDevice failed
```

As linhas `err:` e `fixme:` são os marcadores mais importantes. `err:` (erro) aponta a falha; `fixme:` indica funcionalidade ainda não implementada — comum e nem sempre fatal. Saber diferenciar as duas evita pânico desnecessário.

:::dica
`PROTON_LOG=1` grava um arquivo grande. Quando terminar de diagnosticar, **remova** a opção de inicialização para não deixar o log crescendo a cada execução.
:::

## O log do sistema com journalctl

Para problemas que não são de jogo — suspensão, tela, rede, travamento do modo Desktop — a fonte é o `journalctl`, o registro do systemd. Ele é vasto; a habilidade é filtrar.

```terminal
$ journalctl -b -p 3 --no-pager
# ... linhas de prioridade err (3) ou pior desde este boot ...
$ journalctl -b -p 3 --no-pager | tail -20
Dec 11 14:02:11 steamdeck kernel: thermal thermal_zone0: critical temperature reached
```

O flag `-p 3` seleciona só mensagens com prioridade de erro ou superior, o que elimina o ruído e deixa o que importa. A data e o `thermal_zone` no exemplo apontam para um evento de temperatura — informação que, colada num pedido de ajuda, muda completamente a investigação.

:::atencao
Não cole um `journalctl` inteiro num canal de Discord ou num tópico. Centenas de linhas enterram quem vai ajudar. Use `-p`, `--since`, ou `tail` para reduzir ao trecho relevante e coloque o restante num serviço de paste.
:::

## Compartilhando logs sem poluir

A etiqueta universal para compartilhar texto longo é o **paste**: você sobe o conteúdo para um serviço e cola só o link. As opções comuns — `gist.github.com`, `pastebin.com`, `paste.rs` — são todas acessíveis do navegador, mas algumas têm CLI, o que permite colar direto do terminal do Deck.

```terminal
$ # exemplo com um servico de paste via curl (ilustrativo):
$ curl -sS -d @~/Lab/relatorio-sistema.txt https://paste.rs
https://paste.rs/AbCdEfGh
```

O comando devolve uma URL curta que você cola no pedido de ajuda. O interlocutor clica e vê o conteúdo sem que o canal fique poluído.

| Ferramenta | Como usa | Observação |
|---|---|---|
| `paste.rs` | `curl -d @arquivo` | Simples, sem conta, expira |
| `gist` | `gh gist create arquivo` | Precisa do GitHub CLI, persistente |
| `pastebin` | site ou API | Clássico, com limite de tamanho |

:::dica
Prefira paste que **não exija conta** para relatos rápidos. Para logs que você quer manter (e futuramente linkar de novo), o gist persistente é melhor.
:::

## Resumo

- Log vale mais que relato: reduz iterações e às vezes entrega o diagnóstico direto no pedido.
- O contexto mínimo de um pedido de ajuda é: versão do SteamOS, kernel, modelo do Deck e lista de flatpaks.
- `PROTON_LOG=1` grava o log do jogo; `err:` aponta falha e `fixme:` nem sempre é fatal.
- `journalctl -b -p 3` filtra o ruído e traz só os erros desde o boot.
- Compartilhe logs por link de paste, nunca como texto cru colado no canal.

## Exercícios

1. Gere o `relatorio-sistema.txt` como nesta seção e leia as quatro partes que ele contém.
2. Ative `PROTON_LOG=1` num jogo, execute-o por um minuto, feche e localize o arquivo `~/steam-*.log`. Identifique uma linha `err:` e uma linha `fixme:`.
3. Rode `journalctl -b -p 3` e explique, para uma das linhas, o que ela indica (use a data, o `thermal_zone` ou outro campo como pista).
4. Suba o `relatorio-sistema.txt` para um serviço de paste via `curl` e confirme que recebeu uma URL funcional.
5. **Desafio.** Reproduza (com segurança) um problema de log: force uma linha de erro visível no `journalctl` usando um comando inofensivo que falha, e escreva o pedido de ajuda completo que você faria — com o link de paste no lugar do texto.
