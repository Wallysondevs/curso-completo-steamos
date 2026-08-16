Toda a personalização profunda deste capítulo tem um prazo de validade: a próxima atualização do SteamOS. Quando a Valve publica um update, a imagem do sistema é substituída, e tudo que você instalou com `pacman`, editou em `/etc` ou gravou em `/usr` some de uma vez. A diferença entre um Deck personalizado que "dá trabalho" e um que "se mantém" está num plano de recuperação. Esta seção fecha o capítulo desenhando exatamente isso.

:::objetivos
- Mapear exatamente o que sobrevive e o que se perde num update
- Inventariar suas alterações de sistema de forma automatizável
- Escrever um script de reaplicação idempotente após cada update
- Conhecer os caminhos de recuperação quando algo quebra no boot
:::

## O que a atualização realmente apaga

É hora de fixar com precisão. A atualização do SteamOS substitui a partição de imagem (as duas slots A/B de `/`). O que está fora delas permanece. Portanto:

| Local | Destino no update |
|---|---|
| `/home/deck/**` | Permanece |
| `/var/**` | Permanece |
| `/usr/**` | **Apagado** |
| `/etc/**` (maioria) | **Apagado** (alguns preservados via overlay) |
| `/opt/**` | **Apagado** |
| Flatpaks (`~/.local`, `/var/lib/flatpak`) | Permanece |
| `compatibilitytools.d`, `~/homebrew`, ROMs | Permanece |

O erro que custa caro é assumir que "quase tudo" sobrevive. Na verdade só a home e o `/var` sobrevivem; todo o resto do sistema é reescrito do zero.

## Inventariando suas alterações

Antes de depender da memória, transforme suas alterações em **arquivos de receita**. O primeiro inventário é a lista de pacotes instalados via Pacman:

```terminal
$ pacman -Qq --explicit > ~/backups/pacman-explicitos.txt
$ cat ~/backups/pacman-explicitos.txt
htop
rsync
git
```

O segundo é o que você tocou em `/etc`. Como `steamos-readonly disable` é um pré-requisito, a maioria das alterações de `/etc` são deliberadas e merecem registro:

```terminal
$ cp /etc/sysctl.d/cryo_utilities.conf ~/backups/cryo-sysctl.conf
$ cp /etc/pacman.conf ~/backups/pacman.conf
```

O terceiro inventário é de scripts, aliases e binários na home — esses já sobrevivem, mas um backup nunca é demais para recuperação de desastre:

```terminal
$ tar -czf ~/backups/home-deck-$(date +%F).tar.gz \
    ~/bin ~/.bashrc ~/.bash_aliases ~/.config 2>/dev/null
```

:::dica
Guarde tudo em `~/backups/` e leve esse diretório junto para um SD card ou para o seu NAS de tempos em tempos. O backup dentro do próprio Deck protege contra a atualização, mas não contra perda física ou corrupção do SSD — para isso, a cópia externa é a única garantia.
:::

## O script de reaplicação

Com os inventários em mãos, o próximo passo é escrever um script que reaplique tudo após um update. Ele deve ser **idempotente**: rodável várias vezes sem causar dano ou duplicação. O esqueleto:

```bash
#!/usr/bin/env bash
set -euo pipefail

RECEITAS="$HOME/backups"

# 1. Destravar o modo leitura
if ! steamos-readonly status 2>/dev/null | grep -q disabled; then
    echo "Desabilitando modo leitura..."
    sudo steamos-readonly disable
fi

# 2. Popular o keyring (idempotente)
sudo pacman-key --init
sudo pacman-key --populate archlinux holo

# 3. Reinstalar pacotes registrados
if [[ -s "$RECEITAS/pacman-explicitos.txt" ]]; then
    sudo pacman -S --needed - < "$RECEITAS/pacman-explicitos.txt"
fi

# 4. Restaurar arquivos de /etc/alterações
for f in "$RECEITAS"/*.conf; do
    sudo cp "$f" "/etc/sysctl.d/$(basename "$f")"
done

# 5. Reativar a proteção (opcional)
sudo steamos-readonly enable

echo "Homebrew reaplicado com sucesso."
```

Repare nos detalhes que tornam o script seguro: `set -euo pipefail` para abortar em erro, verificação do estado antes de desabilitar o modo leitura, uso de `--needed` para não reinstalar o que já existe, e reabilitação do modo leitura ao final.

:::atencao
Teste o script **em modo simulado** antes de confiar nele. Uma forma barata é comentar os `sudo` e imprimir os comandos em vez de executá-los (`echo "sudo pacman -S ..."`). Só depois de revisar linha a linha, rode de verdade. Um script de reaplicação mal escrito pode ser tão destrutivo quanto o que ele tenta desfazer.
:::

## Sobrevivendo a atualizações do cliente Steam

Há um segundo tipo de atualização: a do **cliente Steam** (o aplicativo, não o sistema). Ela também pode quebrar o homebrew que se integra à UI — principalmente o Decky Loader, cujos plugins dependem da versão exata da interface. Sintomas típicos:

- O menu do Decky não abre, ou o ícone some.
- Plugins aparecem desativados ou com erro.
- O Steam roda mas os atalhos do Steam ROM Manager ficam "desatualizados".

A regra é simples: **atualize o homebrew junto com o Steam**. Após cada update do cliente, veja se o Decky Loader tem versão nova e reative os plugins um a um. Manter tudo na mesma versão (Decky ↔ plugins ↔ Steam) é o que evita as incompatibilidades que fazem o menu travar.

## Quando o boot dá problema

O pior cenário de uma personalização mal-sucedida é o Deck não iniciar. Nesse caso, a recuperação segue um protocolo de emergência:

1. **Tente o boot anterior.** No menu de boot (segurando `[[Vol-]]` + botão de ligar, ou via GRUB), escolha a slot B anterior. O esquema A/B existe justamente para isso.
2. **Restaure só o que quebrou.** Se você sabe que a última mudança foi desinstalar algo do Pacman, reverta.
3. **Imagem de recuperação.** A Valve distribui uma imagem de recuperação do SteamOS que flasheia um pendrive, reinstala o sistema e, se escolhida a opção correta, preserva a `/home`.

:::perigo
A reinstalação de recovery tem uma opção que **apaga tudo**, inclusive `/home`. Leia cada tela com calma e escolha reinstalar preservando os dados. Se tiver um backup externo recente, o risco é controlado; sem ele, um clique errado na tela de recovery pode custar todos os saves e configurações.
:::

## Os limites do sistema — e como viver com eles

O SteamOS é uma decisão de produto: preferiu a imutabilidade à liberdade total, porque o público-alvo quer um console, não um kit de ferramentas. O homebrew deste capítulo é uma ponte construída pela comunidade — mas ela é **tolerada**, não garantida. A cada update, a Valve pode mudar o comportamento do modo leitura, do cliente Steam ou dos repositórios, e quebrar algo que a comunidade mantinha.

Por isso, a última lição é de expectativa: personalize à vontade, mas estruturalmente. Mantenha o essencial na home, registre o que toca o sistema, automatize a reaplicação, e trate o resto como temporário. Quem segue esse contrato aproveita o melhor dos dois mundos — a estabilidade de um console e a liberdade de um Linux — sem se tornar refém da própria configuração.

## Resumo

- A atualização do SteamOS preserva `/home` e `/var`, mas apaga `/usr`, `/etc` e `/opt` (a imagem do sistema).
- Inventarie alterações: `pacman -Qq --explicit`, cópias de confs de `/etc` e backup da home.
- Um script de reaplicação idempotente (destravar → keyring → pacotes → confs → travar) automatiza a recuperação.
- Atualizações do cliente Steam exigem atualizar o homebrew de UI (Decky) junto para evitar incompatibilidade.
- Em falha de boot: use a slot B anterior e, em último caso, a imagem de recovery preservando `/home`.
- O homebrew é tolerado pela Valve, não garantido; estruture suas alterações para sobreviver a mudanças.

## Exercícios

1. Gere seus inventários: `pacman -Qq --explicit > ~/backups/pacman-explicitos.txt`, cópia dos confs de `/etc` e um `tar` da home. Liste o que ficou registrado.
2. Escreva o script `reapply-homebrew.sh` conforme o esqueleto da seção e teste-o em modo simulado (com `echo` no lugar de `sudo`).
3. Simule um update: remova manualmente um pacote registrado (`sudo pacman -Rns htop`), rode o script, e confirme que ele reinstalou. O script foi idempotente?
4. Force uma atualização do cliente Steam (ou reinicie o Steam) e registre se o Decky Loader e seus plugins continuaram funcionando. Qual plugin quebrou e qual atualização o corrigiu?
5. **Desafio.** Desenhe um "plano de desastre" completo em um documento: o que está na home, o que está fora dela, onde estão os backups externos, e o passo a passo exato da recuperação (slot B → recovery preservando `/home`). Troque com alguém e peça para essa pessoa criticar se o plano realmente permitiria restaurar seu Deck do zero em menos de uma hora.