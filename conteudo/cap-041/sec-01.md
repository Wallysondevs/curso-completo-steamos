Todo jogo rodando pela Steam no SteamOS passa por uma cadeia invisível: o cliente Steam, a camada de compatibilidade Proton (Wine + DXVK + VKD3D) e, no fim, a própria engine do jogo. Cada elo dessa cadeia aceita variáveis de ambiente que mudam o comportamento do jogo antes mesmo de ele carregar. No Steam Deck, essas variáveis são escritas num campo específico das propriedades do jogo — e é aí que mora boa parte do ajuste fino que a comunidade usa para ganhar desempenho ou consertar jogos quebrados.

:::objetivos
- Entender o que são parâmetros de inicialização e onde a Steam os armazena
- Reconhecer o papel do `%command%` na linha de inicialização
- Saber passar variáveis de ambiente antes do comando do jogo
- Inspecionar a linha de inicialização gravada nos arquivos de configuração
- Distinguir variáveis do Proton, do DXVK e do próprio jogo
:::

## Variáveis de ambiente antes do `%command%`

Um parâmetro de inicialização é, na prática, uma **variável de ambiente** declarada na frente do comando que a Steam executa quando você aperta "Jogar". O `%command%` é um curinga: a Steam substitui esse texto pelo caminho real do executável do jogo. Tudo que você escreve antes dele vale como prefixo de configuração; tudo depois vira argumento do próprio executável.

```bash
PROTON_ENABLE_NVAPI=1 DXVK_ASYNC=1 %command%
```

A Steam executa essa linha num shell. As duas variáveis são definidas apenas para aquele processo e seus filhos, e desaparecem quando o jogo fecha. Nada é instalado, alterado no sistema ou persistido fora daquele jogo: é assim que você testa parâmetros com segurança.

Para editar: clique com o botão direito no jogo, abra **Propriedades → Inicialização** (ou *Launch Options* em inglês) e cole a linha no campo. O campo aceita várias variáveis separadas por espaço, todas à esquerda do `%command%`.

:::atencao
Não confunda parâmetros de inicialização da Steam com o arquivo de configuração do Proton. Algumas opções (como `DXVK_CONFIG` e versão do Proton) também podem ser lidas de arquivos, mas as variáveis na linha de inicialização têm precedência e são as mais fáceis de reverter: basta apagar o campo.
:::

## Onde a Steam grava isso

Cada jogo tem uma entrada num arquivo de manifesto. No Steam Deck, os jogos instalados ficam registrados no diretório da biblioteca Steam, e as opções de inicialização são gravadas no arquivo `localconfig.vdf`:

```terminal
$ grep -n "LaunchOptions" ~/.steam/steam/userdata/*/config/localconfig.vdf | head -3
		"LaunchOptions"		"PROTON_ENABLE_NVAPI=1 DXVK_ASYNC=1 %command%"
```

Repare que o valor é a linha exata que você digitou, com o `%command%` incluído. Se você editar esse arquivo com a Steam aberta, as mudanças podem ser sobrescritas na saída — o jeito seguro é editar pela interface ou com a Steam fechada. O `~/.steam/steam` no Deck é um symlink; o caminho real fica em `~/.local/share/Steam`.

Uma forma de conferir o que está valendo *em tempo de execução* é checar as variáveis visíveis ao processo do jogo. Com o jogo rodando, encontre o PID e leia o ambiente dele:

```terminal
$ pgrep -f "win64" | head -1
4817
$ tr '\0' '\n' < /proc/4817/environ | grep -E "PROTON|DXVK|RADV"
PROTON_ENABLE_NVAPI=1
DXVK_ASYNC=1
```

O arquivo `/proc/PID/environ` mostra o ambiente exatamente como o processo o recebeu, separado por caracteres nulos. Converter com `tr '\0' '\n'` deixa legível. É o teste definitivo para saber se o parâmetro que você digitou chegou de fato ao jogo.

Outra inspeção útil é ver como a Steam monta a linha de comando final — o que ela realmente executa, já com o `%command%` resolvido. Isso aparece no log de processo:

```terminal
$ ps -eo pid,args | grep -i "steamapps" | head -3
4817 wine64-preloader /home/deck/.local/share/Steam/steamapps/common/MyGame/MyGame.exe
5210 gamemoderun mangohud /home/deck/.local/share/Steam/steamapps/common/MyGame/MyGame.exe
```

Repare nas duas linhas: uma executa o jogo direto, a outra passa por `gamemoderun mangohud`. A segunda é o resultado de uma linha de inicialização com envoltórios, e mostra a cadeia de processos que nasceu a partir do `%command%` original.

## Por que variáveis, e não bandeiras

Um executável nativo recebe opções como `--fullscreen` ou `-console`. Mas a maioria dos jogos no Steam Deck roda **via Proton**, um empilhamento de camadas: Wine traduz as chamadas Windows, DXVK traduz Direct3D para Vulkan, e VKD3D faz o mesmo para Direct3D 12. Cada camada tem sua própria coleção de variáveis de ambiente para ligar e desligar recursos — por isso a lista é longa e os nomes são siglas (`NVAPI`, `FSR`, `GPL`).

A ordem dos termos importa só num sentido: variáveis vêm **antes** do `%command%`, e argumentos do jogo vêm **depois**. Colocar uma variável depois do `%command%` faz o shell tentar executá-la como se fosse o próprio programa, o que gera um erro.

```text
%command% PROTON_ENABLE_NVAPI=1
```

Isso é erro: o shell interpreta `%command%` como o comando e `PROTON_ENABLE_NVAPI=1` como um argumento inútil. Mantenha sempre as variáveis à esquerda.

:::dica
Anote os parâmetros que você usa por jogo. Como o campo de inicialização é único, é fácil esquecer o que está ativo meses depois. Uma convenção útil é manter uma lista própria no `/home/deck/lab/params.txt` com o nome do jogo e a linha usada.
:::

## Resumo

- Parâmetros de inicialização são variáveis de ambiente escritas antes do `%command%` nos campos de Propriedades → Inicialização.
- `%command%` é substituído pela Steam pelo caminho do executável; variáveis ficam à esquerda, argumentos do jogo à direita.
- A linha é gravada em `localconfig.vdf`; edite pela interface ou com a Steam fechada.
- `/proc/PID/environ` mostra o ambiente real do processo e confirma se o parâmetro chegou ao jogo.
- Proton, DXVK e VKD3D leem configurações por variáveis de ambiente, cada uma com seus nomes específicos.

## Exercícios

1. Abra as propriedades de um jogo que você use via Proton e digite `echo %command%` no campo de inicialização. Tente executar e observe o que acontece — depois apague e explique por que não rodou como esperado.
2. Com um jogo em execução, encontre o PID com `pgrep` e liste as variáveis de ambiente dele com `tr '\0' '\n' < /proc/PID/environ`.
3. Localize a sua entrada em `localconfig.vdf` e confirme se a linha gravada bate com o que aparece na interface.
4. Escreva uma linha que ligue duas variáveis quaisquer antes do `%command%` e verifique, via `/proc/PID/environ`, se ambas chegaram ao processo.
5. **Desafio.** Explique a diferença entre variável de ambiente e argumento de linha de comando, e descreva o que acontece com o processo quando uma variável é colocada à direita do `%command%`.
