Toda atualização tem dois finais possíveis: o sistema sobe limpo ou sobe quebrado. O SteamOS foi desenhado para o segundo caso. Se a nova imagem falha no boot, a máquina detecta a falha e recua sozinha para a versão anterior — o rollback. E se falhar depois do boot, há dois caminhos manuais para voltar atrás sem perder dados. Esta seção cobre todos.

:::objetivos
- Entender o mecanismo de rollback automático por falha de boot
- Executar rollback manual segurando o botão de liga/desliga
- Fazer rollback pelo menu de boot avançado
- Confirmar após o rollback que a partição correta está ativa
:::

## Rollback automático: o boot que falhou

O SteamOS usa um contador de boot. Quando o bootloader inicia o sistema por uma nova partição, ele espera que o sistema chegue a um ponto de "saúde" — normalmente o carregamento completo do modo Gaming ou Desktop — e então marca o boot como bem-sucedido. Se, ao contrário, o sistema travar antes disso, o contador expira e o bootloader **volta automaticamente** para a partição anterior na próxima tentativa.

Isso é um mecanismo clássico de sistemas embarcados, chamado de *boot counting* ou *watchdog de boot*. O Steam Deck implementa uma variação em que o sistema precisa confirmar ao firmware que subiu corretamente. Se o kernel carregar, o systemd iniciar os serviços essenciais e o compositor gráfico abrir, a confirmação acontece. Se travar no meio do caminho — kernel panic, falha no display, loop de reinicialização — o contador não é zerado, e na terceira ou quarta tentativa (depende da configuração) o bootloader recua.

A experiência prática: você aceita uma atualização, o Steam Deck reinicia, a tela pisca e... volta ao sistema antigo, como se nada tivesse acontecido. O sistema antigo está intacto e você continua jogando. A Valve pensou nesse cenário desde o primeiro dia porque o Steam Deck não é um servidor com acesso SSH — é um aparelho que o usuário segura nas mãos. Rollback tinha que ser automático e invisível.

## Rollback manual: o botão de liga/desliga

Nem sempre o rollback automático dispara. Às vezes o sistema **sobe**, mas com um problema grave: Wi-Fi não funciona, a tela fica preta depois de um minuto, o áudio sai picotado. Nesse caso, você precisa forçar o rollback manualmente.

O método mais rápido é segurar o botão de liga/desliga durante o boot. O procedimento exato no Steam Deck:

1. Com o aparelho ligado, mantenha pressionado o botão de **liga/desliga** (power) por cerca de **10 segundos** até o LED apagar — isso força o desligamento total.
2. Pressione o botão de liga/desliga para religar **e mantenha pressionado**.
3. Mantenha pressionado até ouvir um **segundo** beep (ou até o LED piscar três vezes, dependendo da versão do firmware).
4. Solte. O Steam Deck entra no menu de recuperação.

Dentro do menu de recuperação, navegue com o direcional e selecione **Boot from previous system** ou equivalente. O Deck reinicia na partição anterior — a que estava funcionando antes da atualização.

:::dica
Se o primeiro beep for muito rápido e você soltar antes da hora, o Deck simplesmente liga normalmente. O truque é manter pressionado **além** do primeiro beep, até ouvir o segundo. Com prática, vira memória muscular. Não há risco de dano: segurar o botão por mais tempo só força outro desligamento.
:::

## Rollback pelo menu de boot

Há também um caminho por software, acessível pelo menu de inicialização. Com o Steam Deck desligado, segure **volume para baixo** (`vol -`) e pressione o botão de liga/desliga. Solte o power mas mantenha o volume pressionado até aparecer o menu de boot. A tela mostra as opções de dispositivo de boot. A opção de rollback costuma aparecer como "Previous" ou com um nome que identifica a partição alternativa.

No modo Desktop, a abordagem é diferente. Você pode usar o próprio `steamos-update` para fazer o rollback:

```terminal
$ steamos-update rollback
This will revert to the previous OS version. Continue? [y/N] y
Reverting to previous slot...
Slot A marked for next boot. Reboot to activate.
```

A confirmação explícita `[y/N]` (com `N` maiúsculo, indicando que o padrão é "não") é uma proteção: rollback não é uma operação corriqueira e você precisa afirmar que quer mesmo.

:::perigo
O rollback reverte o sistema operacional, mas não altera `/home`. Seus arquivos, jogos e saves permanecem intactos. O perigo existe apenas se você tiver dados importantes salvos **fora** de `/home` (o que é raro, mas possível — por exemplo, scripts em `/opt` ou configurações manuais em `/etc` feitas com `steamos-readonly disable`). Nesse caso, o rollback restaura a `/etc` original da versão anterior e suas alterações manuais se perdem.
:::

## Confirmando que o rollback aconteceu

Depois de um rollback, vale a pena conferir se a máquina realmente voltou à versão esperada:

```terminal
$ cat /etc/os-release | grep BUILD_ID
BUILD_ID=20241020.95
$ steamos-update check
Checking for available updates...
An update is available: 3.6.21 (build_id 20241105.100)
```

O primeiro comando confirma que o `BUILD_ID` atual é o mais antigo (`20241020.95`). O segundo confirma que a atualização `20241105.100` — a que você acabou de reverter — está disponível de novo. Se você quiser, pode tentar aplicá-la outra vez (torcendo para que o problema que motivou o rollback já tenha sido corrigido no servidor). Caso contrário, é só esperar o próximo build.

Outra forma de confirmar é olhar qual partição está montada com `lsblk`:

```terminal
$ lsblk -o NAME,MOUNTPOINTS | grep -E '/$|/var'
nvme0n1p3              /
nvme0n1p4              /var
```

Se antes do rollback o par ativo era `p5/p6` (slot B) e agora é `p3/p4` (slot A), a reversão foi bem-sucedida.

## Quando o rollback não resolve

Há um cenário que confunde: você faz rollback para a versão anterior, mas o problema persiste. Isso indica que o problema **não** era a atualização — pode ser corrupção de dados em `/var`, um bug de firmware, ou até um problema físico. Nesse caso, o caminho é outro: `steamos-update checkout`, que reaplica a imagem limpa do canal atual (abordado na seção 7), ou, em último caso, a reinstalação completa do sistema.

## Resumo

- O Steam Deck tenta rollback automático quando um boot falha repetidas vezes (boot counting).
- Rollback manual pode ser feito segurando o botão de liga/desliga até o segundo beep e acessando o menu de recuperação.
- No modo Desktop, `steamos-update rollback` faz a reversão programaticamente.
- O rollback não afeta `/home`; seus dados sobrevivem intactos.
- Confirme o rollback com `cat /etc/os-release` (BUILD_ID) e `lsblk` (partição montada).

## Exercícios

1. Rode `steamos-update rollback` sem confirmar (responda `n` quando pedir confirmação). Leia a mensagem e entenda o que teria acontecido.
2. Desligue o Steam Deck e pratique o procedimento de entrar no menu de boot (volume para baixo + power). Não precisa fazer rollback; apenas veja as opções disponíveis.
3. Após um rollback (real ou simulado), confira com `lsblk` e `df -h` qual partição está ativa e compare com o `BUILD_ID` em `/etc/os-release`.
4. Use `journalctl --boot 0` para ver os logs do boot atual. Se houve rollback, procure mensagens relacionadas a `boot slot` ou `rollback`.
5. **Desafio.** Aplique uma atualização nova e, depois de confirmar que está estável em ambos os slots, force um rollback manual com `steamos-update rollback` e reinicie. Depois aplique a atualização de novo. Ao final, você passou por três estados (antigo → novo → antigo → novo). Quantas trocas de partição isso envolveu? E por que seus jogos e saves permaneceram os mesmos nas quatro fases?