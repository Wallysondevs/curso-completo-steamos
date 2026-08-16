O "jailbreak do modo leitura" é simplesmente o ato de executar `sudo steamos-readonly disable` e ganhar escrita na partição raiz. Não há hacking, não há exploit — a Valve deixou a porta destrancada de propósito, para que entusiastas pudessem instalar o que precisam. O que ela não garante é a sobrevivência dessas mudanças. Esta seção explica o mecanismo exato, os riscos e as boas práticas antes de você abrir a torneira.

:::objetivos
- Executar o desbloqueio de escrita com `steamos-readonly disable`
- Entender o que o comando faz por baixo (remontagem `rw`)
- Reverter para o estado seguro com `steamos-readonly enable`
- Reconhecer os riscos de administrar o Deck como root
:::

## A porta que a Valve deixou aberta

O comando que desbloqueia o sistema está instalado de fábrica e não exige pacote extra:

```terminal
$ steamos-readonly status
readonly: enabled
$ sudo steamos-readonly disable
$ steamos-readonly status
readonly: disabled
```

Em poucos segundos o Deck deixa de ser imutável. A senha do usuário `deck` normalmente não está definida — o SteamOS usa autenticação via `polkit` para elevar privilégios na interface gráfica, mas no terminal o `sudo` pede senha. Se você ainda não definiu uma, essa é a primeira tarefa:

```terminal
$ passwd
Changing password for deck.
New password:
Retype new password:
passwd: password updated successfully
```

Sem uma senha para o `deck`, nem o `sudo` nem logins via SSH funcionam. Definir a senha é pré-requisito para praticamente toda a personalização profunda deste capítulo.

:::info
O `steamos-readonly` não é um comando padrão do Arch Linux — ele é um script customizado da Valve. No SteamOS 3.6, ele vive em `/usr/bin/steamos-readonly` e internamente apenas remonta o sistema de arquivos raiz. Você pode alcançar o mesmo efeito com `sudo mount -o remount,rw /`, mas usar o utilitário oficial é mais legível e à prova de digitação.
:::

## O que acontece por baixo

O comando é transparente. Antes e depois, compare a montagem:

```terminal
$ sudo steamos-readonly disable
$ mount | grep ' on / '
/dev/mmcblk0p4 on / type btrfs (rw,noatime,ssd,space_cache,subvolid=5,subvol=/)
```

A flag `ro` virou `rw`. A partir desse instante, `pacman`, `touch`, `sed` e qualquer operação que exija escrita na raiz funcionam normalmente. É o equivalente a tirar o pino de segurança de uma ferramenta elétrica: a máquina continua a mesma, mas agora responde a comandos que antes eram recusados de forma silenciosa.

O desbloqueio é **volátil** no sentido de que não altera o conteúdo da imagem: ele muda apenas o estado da montagem em memória. Reinicie o Deck e o modo leitura volta ao padrão (`readonly: enabled`) — a não ser que você o desabilite de novo. Isso é uma proteção: um reboot "reseta" o jailbreak sem apagar as alterações que você fez enquanto a escrita estava liberada.

## Modo leitura de volta: `enable`

Reverter é igualmente simples:

```terminal
$ sudo steamos-readonly enable
$ steamos-readonly status
readonly: enabled
```

Por que você faria isso? Depois de instalar o Flatpak que queria ou de aplicar uma mudança em `/etc`, reativar o modo leitura devolve a proteção do sistema imutável: nenhum script rodando como root ou nenhum erro de digitação consegue corromper `/usr`.

:::atencao
Reativar o modo leitura **não desfaz** o que você instalou enquanto ele estava desabilitado. Os arquivos permanecem em `/usr` até a próxima atualização do sistema apagá-los. `steamos-readonly enable` apenas volta a recusar *novas* escritas — não é um "undo". Se você quer remover algo, desinstale com `pacman -R` antes de reativar.
:::

## Os três riscos reais

Desabilitar o modo leitura não é perigoso por si só — o perigo está no que você passa a poder fazer:

1. **Perda em atualização.** O já repetido: tudo em `/usr` some no próximo update. Se você instalar 20 pacotes manualmente, terá que reaplicar o procedimento inteiro depois.
2. **Sistema inconsistente.** O SteamOS espera versões exatas de bibliotecas. Um `pacman -Syu` agressivo pode atualizar `glibc` ou `mesa` para versões incompatíveis com o compositor Gamescope, e o Deck passa a travar no boot ou a abrir jogos com tela preta.
3. **Falsa sensação de root.** Como root, `rm -rf /` funciona. Não há checagem de "você realmente quer apagar o sistema?". Um comando destrutivo mal digitado num sistema gravável é fatal.

:::perigo
Nunca rode `sudo pacman -Syu` sem entender que o SteamOS é um sistema A/B parcial em que a atualização vem por imagem, não por repositório. Um upgrade completo do Pacman pode deixar o Deck com pacotes mais novos que a imagem do sistema, quebrando a coerência. Se algo der errado, a recuperação é reinstalar o SteamOS pela imagem de fábrica — e você perde o que não estava em `/home`.
:::

## Quando vale a pena desabilitar

Nem toda personalização exige jailbreak. Antes de desabilitar, pergunte-se o que você quer instalar e onde ele vai morar:

| O que você quer | Precisa de jailbreak? | Motivo |
|---|---|---|
| Aplicativo comum (navegador, editor, emulador) | Não | Use Flatpak, que instala em `/var` ou `/home` |
| Plugins de interface do modo Desktop | Não | Decky Loader roda sobre a UI, sem tocar em `/usr` |
| Proton personalizado (GE-Proton) | Não | Instala em `~/.local/share/Steam/compatibilitytools.d` |
| Ferramenta de sistema (ex.: `htop`, `nano`, `git`) | Sim | Instala em `/usr/bin` |
| Alterar configuração global em `/etc` | Sim | Arquivos de configuração do sistema |

A regra que separa os dois mundos: **se sobrevive à atualização, não precisa de jailbreak**. Flatpak, Proton personalizado, plugins e scripts na `/home` são permanentes. Só o que precisa tocar `/usr` ou `/etc` exige o modo leitura desabilitado — e, consequentemente, exige um plano de reinstalação pós-update.

## Resumo

- `sudo steamos-readonly disable` remonta a raiz como `rw`; `enable` reverte para `ro`.
- O desbloqueio muda o estado da montagem em memória, não o conteúdo da imagem — um reboot o desfaz automaticamente.
- Definir uma senha para o usuário `deck` com `passwd` é pré-requisito para `sudo` e SSH.
- `enable` não desfaz o que foi instalado; ele apenas volta a recusar novas escritas.
- Nem tudo exige jailbreak: Flatpak, Proton personalizado e plugins de UI instalam fora de `/usr` e são persistentes.
- Tudo que for gravado em `/usr` ou `/etc` será apagado pela próxima atualização do sistema.

## Exercícios

1. Verifique o estado atual com `steamos-readonly status`. Depois execute `sudo steamos-readonly disable` e confirme com `mount | grep 'on / '` que a flag passou de `ro` para `rw`.
2. Com o modo leitura desabilitado, crie um arquivo em `/usr/local/bin` (`sudo touch /usr/local/bin/marcador`). Reinicie o Deck e verifique se o arquivo ainda existe. O que isso revela sobre o que a atualização preserva?
3. Reative o modo leitura (`sudo steamos-readonly enable`) e tente criar o mesmo arquivo de novo. Qual erro aparece e o que ele significa?
4. Instale um pacote pequeno com `sudo pacman -S htop`, rode `htop`, depois desinstale com `sudo pacman -Rns htop`. Anote o tempo gasto — essa é sua janela de custo para cada atualização futura.
5. **Desafio.** Defina a senha do `deck`, ative o `sshd` e faça login remoto de outro computador. Depois crie um script em `~/bin/reinstalar-homebrew.sh` que reinstale automaticamente o `htop` (e o que mais você decidir manter) após um update. Pense: como esse script descobre se precisa rodar `steamos-readonly disable` primeiro?