O SteamOS empacota seus próprios logs de forma diferente de uma distribuição Linux comum. O cliente Steam e o modo de jogo (Game Mode / `gamescope`) geram logs em locais específicos, e a Valve fornece até um comando dedicado — o `steam-logs` — para agrupá-los. Quando o problema é "o jogo não abre no modo de jogo" ou "o Steam travou ao iniciar", esses são os primeiros arquivos a inspecionar.

:::objetivos
- Localizar os logs do cliente Steam e do modo de jogo
- Entender o que o comando `steam-logs` faz e quando usá-lo
- Ler os logs do gamescope, do compositor e do modo Desktop
- Coletar um pacote de logs adequado para compartilhar com a Valve ou a comunidade
:::

## Onde o Steam guarda seus logs

O cliente Steam mantém uma pasta de logs em texto puro, separada dos logs do sistema. Ela fica em `~/.local/share/Steam/logs/` e contém arquivos com propósitos distintos: inicialização, download de conteúdo, sincronização com a nuvem, e conexão de rede.

```terminal
$ ls ~/.local/share/Steam/logs/
bootstrap_log.txt   cloud_log.txt   content_log.txt
connection_log.txt  console-linux.txt  stats_log.txt
```

Cada arquivo conta uma parte da vida do cliente. O `bootstrap_log.txt` registra o processo de arranque; `content_log.txt` registra downloads e validações de arquivos; `cloud_log.txt` registra a sincronização de saves; `connection_log.txt` registra o handshake com os servidores da Steam.

## O comando steam-logs

O SteamOS inclui o utilitário `steam-logs`, que coleta e empacota convenientemente os principais logs relevantes — os do cliente, os do sistema e às vezes os do kernel — em um único diretório ou arquivo para você anexar a um chamado de suporte.

```terminal
$ steam-logs --help
Usage: steam-logs [options]
  -h, --help        show this help
  -o, --output DIR  write collected logs to DIR
```

Na prática, você costuma executá-lo sem argumentos para que ele monte um conjunto consolidado, ou apontar um diretório de saída para onde os arquivos serão copiados.

```terminal
$ steam-logs -o ~/steam-logs-coleta
Collecting Steam client logs... done
Collecting system journal... done
Collecting kernel messages... done
Wrote 14 files to /home/deck/steam-logs-coleta
```

O resultado é um diretório com os logs organizados, pronto para `tar` e anexar. Isso evita que você envie manualmente meia dúzia de arquivos soltos e reduz a chance de esquecer um log relevante.

```terminal
$ tar czf ~/steam-logs-coleta.tgz ~/steam-logs-coleta
```

Compactar o diretório em um `.tgz` é o passo final antes de anexar ao ticket da Valve. Um único arquivo limpo transmite organização e acelera o diagnóstico do outro lado.

:::dica
Sempre que abrir um chamado de suporte na Valve para problemas de software ou do modo de jogo, rode `steam-logs` e anexe o pacote. É a evidência que o suporte espera, e já chega no formato que eles costumam pedir.
:::

## Logs do modo de jogo (gamescope)

O modo de jogo do SteamOS não roda sobre o ambiente Desktop comum — ele usa o `gamescope`, o microcompositor da Valve baseado em Wayland que rende cada jogo numa janela isolada (e cuidava do FSR/upscale antes de ser integrado). Os logs do gamescope revelam o que acontece quando o deck liga no modo de jogo.

```terminal
$ journalctl -u gamescope-session -b --no-pager -n 30
fev 20 10:12:01 steamdeck gamescope[1201]: Initializing gamescope...
fev 20 10:12:02 steamdeck gamescope[1201]: Selected GPU: amdgpu (Van Gogh)
```

O `gamescope-session` é a unidade systemd responsável pela sessão do modo de jogo. Quando o deck liga direto no modo de jogo e algo falha (tela preta, resolução errada, crash), é aqui que a causa aparece. Mensagens sobre a GPU, sobre o protocolo Wayland ou sobre o compositor indicam onde o pipeline quebrou.

```terminal
$ journalctl -u gamescope-session -b -p err
fev 20 10:12:03 steamdeck gamescope[1201]: [ERROR] Failed to acquire DRM lease
```

Um `Failed to acquire DRM lease` sugere conflito entre o gamescope e outro processo tentando usar a saída de vídeo — às vezes causado por um segundo compositor rodando ou por uma atualização incompleta. É a pista que leva à correção certa.

## Steam Runtime e runtimes de compatibilidade

Os jogos no SteamOS (nativos ou via Proton) rodam dentro de runtimes de contêiner — `steam-runtime` com as camadas `soldier`, `sniper` e `scout`. Esses ambientes isolam dependências, mas quando algo falha, o log fica um nível abaixo do jogo.

```terminal
$ ls ~/.local/share/Steam/ubuntu12_32/ 2>/dev/null
$ ls ~/.local/share/Steam/steamapps/common/SteamLinuxRuntime_soldier/
```

Para problemas de jogo específico, o log mais útil é a saída do próprio jogo e do Proton, que pode ser capturada ativando as opções de log do cliente ou rodando o jogo pela linha de comando com variáveis de depuração.

```terminal
$ PROTON_LOG=1 %command%
```

Definir `PROTON_LOG=1` nas opções de inicialização de um jogo faz o Proton gravar um arquivo `steam-<appid>.log` no diretório home, com todo o detalhe interno da camada de compatibilidade. É o instrumento certo para "este jogo em específico não funciona".

:::nota
O `%command%` é um placeholder que o Steam substitui pelo comando real de inicialização do jogo. Variáveis de ambiente colocadas antes dele (`PROTON_LOG=1`) são passadas para o processo do jogo.
:::

## Capturando o console do Steam

O cliente Steam também imprime mensagens no terminal de onde foi lançado. Rodar o Steam manualmente a partir do modo Desktop (em vez de pelo ícone) expõe esse fluxo — útil quando o cliente fecha logo após abrir.

```terminal
$ steam 2>&1 | tee ~/steam-console.log
```

O `2>&1` redireciona erros para o mesmo fluxo da saída normal, e o `tee` grava tudo em arquivo enquanto ainda mostra na tela. Se o Steam crasha ao iniciar, as últimas linhas desse arquivo dizem exatamente onde ele parou.

```terminal
$ steam -console
```

A opção `-console` abre o cliente com o console do Steam (a aba de comandos) habilitada — um local onde você pode executar comandos de depuração e onde algumas entradas adicionais são registradas.

## Resumo

- O cliente Steam grava logs em `~/.local/share/Steam/logs/` (bootstrap, content, cloud, connection).
- O comando `steam-logs` coleta e empacota logs relevantes para anexar a chamados de suporte.
- O modo de jogo é gerenciado pela unidade `gamescope-session`, cujos logs ficam no journal.
- `PROTON_LOG=1 %command%` gera logs detalhados da camada Proton para um jogo específico.
- Rodar `steam` pelo terminal expõe o console do cliente e captura crashes de inicialização.

## Exercícios

1. Liste o conteúdo de `~/.local/share/Steam/logs/` e identifique para que serve cada arquivo (bootstrap, content, cloud, connection).
2. Execute `steam-logs -o ~/steam-logs-test` e confira quantos e quais arquivos foram coletados.
3. Rode `journalctl -u gamescope-session -b -p err` e verifique se há erros na sessão do modo de jogo.
4. Ative `PROTON_LOG=1 %command%` para um jogo que usa Proton, rode-o, e localize o arquivo `steam-<appid>.log` gerado.
5. **Desafio.** Lance o Steam pelo terminal com `steam 2>&1 | tee ~/steam-console.log`, reproduza um sintoma (ou apenas navegue), e produza um breve relatório apontando as mensagens mais relevantes do log resultante.