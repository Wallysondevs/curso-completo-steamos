Agora que você conhece as peças, é hora de juntar o quebra-cabeça: o que exatamente o Proton faz quando você aperta *Jogar*? Do clique no Steam até o frame aparecer na tela, existe uma cadeia de eventos bem definida — e entender cada etapa é o que permite diagnosticar qualquer falha com precisão cirúrgica. Esta seção percorre esse caminho passo a passo, com as ferramentas que revelam cada fase.

:::objetivos
- Entender a sequência completa de execução de um jogo via Proton
- Relacionar prefixos, runtime e componentes num único fluxo
- Inspirar o processo de inicialização com logs e variáveis de ambiente
- Distinguir as fases de setup, lançamento e runtime
- Usar `PROTON_LOG` e `PROTON_VERB` para capturar o que acontece por baixo
:::

## O caminho do clique ao frame

Quando você aperta *Jogar*, o Steam não executa o `.exe` diretamente. Ele invoca o Proton, que é um *wrapper* — um orquestrador — que monta um ambiente e só então passa o controle ao jogo. As fases principais são:

1. **Seleção da ferramenta**: o Steam lê a configuração de compatibilidade do jogo e escolhe a versão do Proton.
2. **Preparação do runtime**: o Proton monta o Steam Runtime "sniper" (um *container* leve) com as bibliotecas Linux necessárias.
3. **Criação/atualização do prefixo**: se não existe, o Proton cria o prefixo Wine em `compatdata/<appid>/pfx/` e instala as DLLs de DXVK, VKD3D-Proton e FAudio.
4. **Instalação de dependências**: scripts de instalação de componentes (Visual C++, DirectX, dotnet) rodam na primeira execução.
5. **Lançamento do jogo**: o executável `.exe` é carregado sob o Wine modificado, com o DXVK/VKD3D interceptando o gráfico.
6. **Runtime**: o jogo roda, com o Gamescope gerenciando a janela e o overlay.

Cada fase tem um ponto de falha distinto, e é por isso que "o jogo não abre" é uma descrição vaga demais para diagnosticar. Você precisa saber *em qual fase* a coisa quebrou.

## PROTON_LOG: o registro de tudo

A variável mais útil para diagnóstico é `PROTON_LOG=1`. Ela faz o Proton gravar um arquivo de log com toda a atividade de cada fase:

```terminal
$ PROTON_LOG=1 ~/.steam/steam/steamapps/common/Proton\ 9.0/proton run game.exe
Proton: 9.0-4
Steam Runtime Version: sniper 0.20250303.110000
Setting up Steam Runtime...
Creating prefix...
Installing DXVK...
Installing VKD3D-Proton...
Installing FAudio...
Running game.exe
```

O log é gravado no diretório home com um nome no formato `steam-<appid>.log`:

```terminal
$ ls ~/steam-1086940.log
/home/ana/steam-1086940.log

$ grep -E 'err:|fixme:' ~/steam-1086940.log | head -10
err:d3d11_device:  Failed to create D3D11 device.
fixme:d3d12:  Unsupported feature requested (shader model 6.6)
err:vkd3d-proton:  VkResult = VK_ERROR_DEVICE_LOST
```

As linhas `err:` indicam falhas reais, enquanto `fixme:` indica funcionalidade ainda não implementada (geralmente inofensiva). Um `VK_ERROR_DEVICE_LOST` no log é sinal de que a GPU travou ou reiniciou — algo que aponta para driver ou hardware, não para o jogo.

Para ver o log em tempo real, combine com `tail -f`:

```terminal
$ PROTON_LOG=1 ~/.steam/steam/steamapps/common/Proton\ 9.0/proton run game.exe &
$ tail -f ~/steam-1086940.log
```

## PROTON_VERB: os comandos internos do Proton

O `proton` aceita verbos que controlam qual fase ele executa. Os mais úteis para diagnóstico são `run` (o padrão, que faz tudo), `getcompatpath`, `getnativepath` e `waitforexitandrun`:

```terminal
$ ~/.steam/steam/steamapps/common/Proton\ 9.0/proton getcompatpath 1086940
/home/ana/.steam/steam/steamapps/compatdata/1086940

$ ~/.steam/steam/steamapps/common/Proton\ 9.0/proton getnativepath "/home/ana/.steam/steam/steamapps/compatdata/1086940"
/home/ana/.steam/steam/steamapps/common/SomeGame
```

O verbo `getcompatpath` revela o caminho do prefixo que o Proton usa para um dado appid — útil para scripts e para confirmar que o prefixo está onde você espera. O `getnativepath` converte um caminho do prefixo para o caminho real no Linux. Esses verbos documentam a mecânica interna que normalmente você não vê.

```terminal
$ ~/.steam/steam/steamapps/common/Proton\ 9.0/proton run ~/.steam/steam/steamapps/common/SomeGame/game.exe
```

Rodar `run` com o caminho do `.exe` é como reproduzir o que o Steam faz, mas da linha de comando — essencial para isolar se um problema é do jogo ou do Steam.

## O ciclo de vida do prefixo

O prefixo não é criado e esquecido. A cada execução, o Proton verifica e atualiza o prefixo: aplica novas DLLs de DXVK/VKD3D, roda scripts de instalação pendentes e sincroniza o registro. Isso explica por que a primeira execução de um jogo é demorada (cria-se o prefixo, compilam-se shaders) e as seguintes são rápidas.

Você pode observar a diferença medindo o tempo de `run` entre a primeira e a segunda execução, ou conferindo os arquivos criados:

```terminal
$ ls -la ~/.steam/steam/steamapps/compatdata/1086940/
drwxr-xr-x  2 ana ana 4096 Aug 16 14:02 .
drwxr-xr-x  5 ana ana 4096 Aug 16 14:02 ..
-rw-r--r--  1 ana ana    0 Aug 16 14:02 config_info
drwxr-xr-x 10 ana ana 4096 Aug 16 14:02 pfx/
-rw-r--r--  1 ana ana   47 Aug 16 14:03 version
```

O arquivo `version` guarda qual versão do Proton criou o prefixo. Se você trocar de Proton 9.0 para Experimental, o Proton detecta a versão diferente e re-ajusta o prefixo (instala componentes novos). O `config_info` contém metadados de configuração.

:::dica
O arquivo `version` dentro de `compatdata/<appid>/` diz exatamente qual Proton criou aquele prefixo. Se um jogo quebra depois de trocar de versão, compare esse número com o que o Steam reporta. Prefixos criados por versões muito antigas podem acumular "sujeira" de DLLs antigas; nesse caso, apagar o prefixo (com o jogo desinstalado ou não) e deixar o Proton recriar costuma resolver.
:::

## Configuração do Proton no Steam

O Steam controla o Steam Play através de arquivos `.vdf` (formato texto do Valve Data Format). A configuração geral fica em `~/.steam/steam/config/config.vdf`, e as preferências de compatibilidade por jogo ficam em `~/.steam/steam/userdata/<id>/config/localconfig.vdf`:

```terminal
$ grep -i -A5 'compat_tool' ~/.steam/steam/userdata/123456789/config/localconfig.vdf | head -12
"compat_tool"		"proton_experimental"
```

O valor `proton_experimental` indica que aquele jogo está configurado para usar o Proton Experimental. Outros valores comuns são `proton_9`, `proton_hotfix` e nomes de ferramentas de compatibilidade de terceiros (como GE-Proton).

No Steam Deck, vale lembrar que o Proton também pode ser configurado por interface (Propriedades → Compatibilidade → "Forçar o uso de uma ferramenta específica"), e o que você escolhe ali é gravado nesses `.vdf`. Entender o arquivo por baixo permite reproduzir e automatizar a configuração.

## Onde a corrente quebra

Cada fase tem suas ferramentas de diagnóstico preferenciais:

| Fase | Sintoma típico | Ferramenta |
|---|---|---|
| Seleção da ferramenta | Jogo usa Proton errado | `localconfig.vdf`, interface Steam |
| Setup do runtime | Erro de `pressure-vessel` ou biblioteca ausente | `PROTON_LOG=1` |
| Criação do prefixo | Primeira execução falha | `PROTON_LOG=1` + `compatdata/` |
| Instalação de dependências | Falta `vcrun`, `dotnet` | `PROTON_LOG=1`, `winetricks` |
| Lançamento do jogo | `.exe` não roda | `proton run` manual |
| Runtime | Crash visual/áudio | `VKD3D_DEBUG`, `DXVK_HUD`, logs de GPU |

Percorrer essa tabela na ordem já resolve a maioria dos casos: identifique a fase, use a ferramenta correspondente, leia o log. A regra de ouro do diagnóstico Proton é simples: **não salte para a solução sem antes saber em que fase o problema ocorreu**.

```terminal
$ PROTON_LOG=1 PROTON_VERB=run \
  ~/.steam/steam/steamapps/common/Proton\ 9.0/proton run game.exe
$ tail -30 ~/steam-1086940.log
```

## Resumo

- O Proton é um wrapper que orquestra runtime, prefixo, DLLs e lançamento, não um simples "executável de Wine".
- A execução passa por fases distintas (seleção, runtime, prefixo, dependências, lançamento, runtime), cada uma com falhas próprias.
- `PROTON_LOG=1` grava `~/steam-<appid>.log` com todo o fluxo, incluindo linhas `err:` e `fixme:`.
- O `proton` aceita verbos como `run`, `getcompatpath` e `getnativepath` para inspeção e reprodução.
- O prefixo guarda `version` (qual Proton o criou) e é re-ajustado a cada troca de versão.
- Diagnóstico correto exige identificar a fase da falha antes de aplicar qualquer correção.

## Exercícios

1. Rode um jogo pela linha de comando com `PROTON_LOG=1` e abra o arquivo `~/steam-<appid>.log`. Separe 3 linhas `err:` de 3 linhas `fixme:`.
2. Use `getcompatpath` e `getnativepath` para descobrir o prefixo e o caminho real de um jogo instalado.
3. Compare o arquivo `version` dentro de `compatdata/<appid>/` com a versão do Proton selecionada no Steam. Eles coincidem?
4. No `localconfig.vdf`, encontre o campo `compat_tool` de um jogo e explique qual Proton ele usa.
5. **Desafio.** Execute um jogo em modo manual (fora do Steam) com `proton run` e descreva, fase por fase, o que o `PROTON_LOG=1` registra. Compare com a execução pelo Steam e liste o que o Steam faz a mais (overlay, cloud, achievements).