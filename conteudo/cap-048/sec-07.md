Jogos antigos não tinham um sistema de conquistas — era você contra o jogo, sem registro. O **RetroAchievements** mudou isso ao criar um serviço que adiciona conquistas a milhares de títulos retrô, identificando cada jogo por um *hash* e premiando o jogador quando ele cumpre condições precisas. Integrar isso ao RetroArch é simples, mas há regras de identidade e de ROM que você precisa respeitar para as conquistas dispararem.

:::objetivos
- Entender como o RetroAchievements funciona e o papel do hash do jogo
- Criar uma conta e ligar as conquistas no RetroArch
- Configurar o modo hardcore e seu impacto nos save states
- Diagnosticar por que conquistas não aparecem para uma ROM
- Reconhecer as regras de compatibilidade (ROM sem modificação, BIOS correta)
:::

## Como o serviço reconhece o jogo

O RetroAchievements não confia no nome do arquivo — que pode ser qualquer coisa — e sim numa **soma de verificação** (hash) do conteúdo da ROM. Cada jogo cadastrado tem um hash oficial; se o seu arquivo bater com esse hash, o serviço sabe exatamente qual jogo você está rodando e libera o conjunto de conquistas correspondente.

Essa é a primeira armadilha: uma ROM *hacked*, traduzida por fãs ou com cabeçalho alterado tem hash diferente e **não dispara conquistas**.

```terminal
$ sha1sum "Super Mario World (USA).sfc"
6b47bb75d6dd7c8e2a7a29bd4e9c978d7e27c1dc  Super Mario World (USA).sfc
```

O serviço usa SHA1 (e em alguns casos MD5) para casar seu arquivo com o banco. Por isso o conjunto correto — a ROM "boa", de dump conhecido — é pré-requisito silencioso de toda a experiência.

```terminal
$ ls -la "Super Mario World (USA).sfc"
-rw-r--r-- 1 deck deck 524800 Dec  4 12:10 Super Mario World (USA).sfc
```

O tamanho também importa indiretamente: um dump "bom" tem tamanho conhecido, e arquivos que não batem (cabeçalho de 512 bytes extra, por exemplo) são um sinal de que o hash também não vai casar.

:::nota
Alguns jogos possuem múltiplos hashes válidos (diferentes revisões ou regiões). Quando várias versões existem, o RetroAchievements pode aceitar mais de uma — mas sempre de dumps oficiais, nunca de hacks.
:::

## Criando a conta e ligando no RetroArch

O cadastro é feito no site retroachievements.org. Com o nome de usuário e a senha em mãos, você informa as credenciais no RetroArch em *Settings > Achievements*:

```terminal
Settings > Achievements > Achievements: ON
Settings > Achievements > Username: ana
Settings > Achievements > Password: ********
```

Depois de salvar, carregue um jogo compatível. Se tudo estiver certo, uma torrada aparece no canto da tela confirmando o login e o carregamento das conquistas.

:::dica
Habilite *Settings > Achievements > Show Rich Presence* para que o serviço informe em tempo real, no seu perfil público, qual jogo você está jogando e em que ponto — o equivalente ao "agora jogando" da Steam.
:::

## Modo hardcore e suas regras

O RetroAchievements tem dois modos. No **softcore**, você pode usar save states, retroceder (*rewind*) e trapacear à vontade — as conquistas valem menos pontos. No **hardcore**, todas essas muletas são desligadas e as conquistas valem em dobro.

```terminal
Settings > Achievements > Hardcore Mode: ON
```

Acionar o hardcore muda o comportamento do RetroArch: save states e *rewind* ficam **indisponíveis** enquanto o modo estiver ativo, porque o serviço não consegue garantir que você "mereceu" a conquista se pôde voltar no tempo.

:::atencao
Não confunda a configuração local com a do site. O hardcore pode ser forçado pelo RetroAchievements em certos eventos e, se você tiver um save state carregado, o RetroArch avisa que ele é incompatível com o modo e se recusa a continuar até você reiniciar do save dentro do jogo.
:::

## Por que as conquistas não aparecem

Quando nada dispara, a causa quase sempre está numa de quatro chaves: hash errado (ROM hackeada), login não autenticado, jogo sem conquistas cadastradas, ou um novo jogo ainda não reconhecido no banco.

```terminal
$ tail -20 ~/.var/app/org.libretro.RetroArch/config/retroarch/logs/retroarch.log | grep -i achieve
RetroAchievements: Game not found in database (hash mismatch)
```

A mensagem acima, no log, fecha o diagnóstico: o hash do seu arquivo não existe no banco. A solução é procurar outra ROM do mesmo jogo — normalmente a versão "USA" ou "World" de um dump verificado.

:::dica
Use o site do RetroAchievements para conferir se o jogo (e aquela região específica) tem conquistas, e qual o hash oficial esperado. Isso evita baixar três ROMs diferentes caçando uma que funcione.
:::

## Resumo

- O RetroAchievements identifica cada jogo pelo hash (SHA1/MD5) da ROM, não pelo nome do arquivo.
- As credenciais são configuradas em *Settings > Achievements*, com login e senha da conta.
- ROM hackeada ou traduzida tem hash diferente e não dispara conquistas.
- O modo hardcore dobra os pontos e desliga save states e rewind.
- O `retroarch.log` registra o motivo exato (ex.: "hash mismatch") quando nada carrega.

## Exercícios

1. Crie uma conta no RetroAchievements e configure as credenciais no RetroArch; confirme o login com a notificação ao carregar um jogo.
2. Calcule o `sha1sum` de uma ROM sua e compare com o hash oficial listado no site do serviço.
3. Alterne softcore e hardcore no mesmo jogo e observe o que muda nas opções de save state.
4. Provoque o erro "hash mismatch" carregando uma ROM hackeada e depois leia a linha correspondente no log.
5. **Desafio.** Ganhe uma conquista em modo hardcore de um jogo de plataforma, documentando o hash da ROM, a configuração de hardcore e o comportamento do save state durante a tentativa.
