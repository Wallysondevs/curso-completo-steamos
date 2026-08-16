O KScreen não é o único caminho para configurar monitores no SteamOS. O `kscreen-console` é uma ferramenta de diagnóstico e configuração em modo texto que conversa diretamente com o daemon via D-Bus e resolve o problema de "quero salvar esta configuração para a próxima vez que conectar este monitor". Enquanto o `kscreen-doctor` é o bisturi (um comando por vez), o `kscreen-console` é o bloco de notas: captura a configuração completa, serializa em JSON e permite restaurá-la depois.

Esta seção explora o que o `kscreen-console` oferece que o `kscreen-doctor` não cobre e mostra como usar seu formato JSON para automatizar setups de monitor.

:::objetivos
- Entender o que o `kscreen-console` faz e como ele difere do `kscreen-doctor`
- Exportar a configuração atual de monitores em JSON
- Ler e interpretar os campos do JSON de configuração do KScreen
- Restaurar uma configuração salva via linha de comando
- Automatizar a troca entre setups (ex.: "modo TV" vs "modo monitor")
:::

## kscreen-console: o que é e quando usar

O `kscreen-console` é um utilitário de linha de comando do pacote `kscreen` que expõe a API D-Bus do daemon como texto. Ele tem três operações principais: `get` (exportar estado atual), `set` (aplicar uma configuração salva) e `monitor` (ouvir mudanças de hotplug em tempo real).

A diferença fundamental para o `kscreen-doctor`: enquanto o `doctor` muda uma propriedade por vez, o `console` trabalha com snapshots completos. É a ferramenta certa para setups fixos — você conecta o monitor da sala, restaura o JSON com escala e posição certas, e não perde tempo arrumando geometria toda vez.

```terminal
$ kscreen-console get
```

Esse comando cospe na tela um bloco JSON enorme descrevendo cada saída (mesmo as desconectadas), com todos os modos, a geometria, a escala e o estado ativo. É o estado completo do KScreen naquele instante.

:::nota
O `kscreen-console` pode não estar instalado por padrão no SteamOS mínimo. Se ele não existir, instale com `sudo pacman -S kscreen`. No sistema imutável do deck, a instalação é temporária e se perde na atualização, mas basta para uma sessão de automação.
:::

## Lendo o JSON de configuração

O bloco JSON do `get` é denso, mas a estrutura é previsível. Cada output tem um objeto com `id`, `name`, `enabled`, `pos` (posição), `size` (resolução), `scale` (fator), `rotation`, `mode` (modo ativo) e `followPreferredMode`:

```terminal
$ kscreen-console get | head -40
{
    "outputs": [
        {
            "enabled": true,
            "followPreferredMode": true,
            "id": "2f4b8c91d...",
            "name": "HDMI-A-1",
            "pos": {
                "x": 1280,
                "y": 0
            },
            "priority": 1,
            "rotation": 1,
            "scale": {
                "x": 2,
                "y": 2
            },
            "size": {
                "height": 2160,
                "width": 3840
            }
        },
        {
            "enabled": true,
            "id": "3a7d...",
            "name": "eDP-1",
            "pos": {"x": 0, "y": 0},
            "priority": 2,
            "scale": {"x": 1, "y": 1},
            "size": {"height": 800, "width": 1280}
        }
    ]
}
```

Os campos-chave: `pos.x`/`pos.y` é a geometria do `kscreen-doctor -o`; `scale.x`/`scale.y` é o fator de escala (geralmente idêntico nos dois eixos); `size` é a resolução ativa; `followPreferredMode` indica se o KScreen deve usar o modo preferido do monitor automaticamente.

## Salvando e restaurando configurações

Exporte a configuração atual para um arquivo, edite se quiser, e restaure-a depois:

```terminal
$ kscreen-console get > ~/lab/setup-escritorio.json
$ kscreen-console set ~/lab/setup-escritorio.json
```

O `set` aplica o JSON de volta ao daemon. É atômico: todos os monitores mudam de uma vez, sem o efeito cascata de comandos individuais. Isso é particularmente útil quando você tem um script que detecta "estou na mesa do escritório" (por exemplo, pelo SSID do Wi-Fi) e aplica a configuração correspondente.

```bash
#!/bin/bash
## Script de troca de perfil de monitor
SSID=$(iwgetid -r)
case "$SSID" in
  "Casa-Ana")
    kscreen-console set ~/lab/monitores-casa.json
    ;;
  "Escritorio")
    kscreen-console set ~/lab/monitores-trabalho.json
    ;;
esac
```

O script usa `iwgetid -r` para obter o nome da rede Wi-Fi e aplica o JSON correspondente. Com isso, plugar o dock na mesa do escritório restaura automaticamente geometria, escala e modo de todos os monitores.

:::dica
O `kscreen-console monitor` é um modo interativo que imprime uma linha JSON sempre que um monitor é plugado ou removido. Você pode usá-lo como gatilho: redirecione a saída para um script que analisa o evento e restaura a configuração desejada via `set`.
:::

## Por que automatizar com JSON em vez de usar o GUI

O Plasma guarda a configuração de monitores em `~/.local/share/kscreen/` automaticamente, e reaplica ao reconectar o mesmo hardware. Mas essa "memória" depende do ID do monitor (extraído da EDID) — se o dock troca, ou se você usa dois docks diferentes com o mesmo monitor, o KScreen pode não reconhecer.

O JSON exportado não depende da heurística de matching automático: você diz exatamente qual configuração aplicar, e o `kscreen-console set` obedece. É a diferença entre "o sistema lembra de mim" e "eu digo ao sistema o que fazer".

Além disso, o JSON é editável. Quer inverter a ordem dos monitores no setup do escritório sem usar o mouse? Edite os `pos.x` no arquivo e aplique.

## Resumo

- `kscreen-console get` exporta o estado completo do KScreen em JSON, incluindo saídas desconectadas.
- `kscreen-console set <arquivo.json>` aplica um snapshot completo de uma vez.
- O JSON contém `name`, `enabled`, `pos`, `size`, `scale`, `rotation` e `followPreferredMode` por output.
- Automatize setups com scripts que detectam o local (Wi-Fi, por exemplo) e chamam `kscreen-console set`.
- Diferente da memória automática do KScreen, o JSON é explícito: você controla o que é aplicado, sem depender de matching por EDID.

## Exercícios

1. Rode `kscreen-console get` e salve a saída em `~/lab/meu-setup.json`. Identifique o objeto correspondente ao HDMI-A-1.
2. Altere o `scale.x` e `scale.y` do HDMI no JSON para `1.5`, salve e aplique com `kscreen-console set`. A mudança surtiu efeito?
3. Exporte dois setups diferentes (com e sem monitor externo) e restaure-os alternadamente usando `set`.
4. Escreva um script bash mínimo que detecta se há um monitor HDMI conectado (use `kscreen-doctor -o | grep HDMI`) e, se houver, aplica o JSON do setup externo.
5. **Desafio.** Use `kscreen-console monitor` em segundo plano, capture cinco eventos de hotplug (plug/desconecte o dock várias vezes) e analise os campos que mudam entre cada evento.