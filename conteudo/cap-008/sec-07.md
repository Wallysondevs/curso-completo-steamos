Uma hora a atualização quebra. Às vezes é a máquina que não liga; outras, é um componente que para de funcionar depois do boot. O instinto de quem vem do Linux de mesa é atacar o problema pela raiz — digitar comandos, apagar configurações, reinstalar pacotes. No SteamOS, a receita é outra e, na maioria dos casos, mais simples: reverter, reaplicar, ou restaurar o estado limpo. Esta seção é o seu roteiro de emergência.

:::objetivos
- Diagnosticar se o problema vem da atualização ou de dados corrompidos
- Aplicar a sequência correta de recuperação (rollback, checkout, reinstalação)
- Ler os logs para localizar a causa da falha
- Restaurar o estado limpo do canal atual com `steamos-update checkout`
:::

## Primeiro: identificando de onde vem a quebra

Antes de agir, pare e classifique o problema. As causas possíveis cabem, grosso modo, em três gavetas:

1. **A atualização em si** quebrou algo (bug na imagem nova).
2. **Dados corrompidos** em `/var` ou `/home` (problema persistente que sobrevive ao rollback).
3. **Falha de hardware ou firmware** (nada a ver com software).

O teste que separa a gaveta 1 das outras é o rollback. Se você reverteu para a versão anterior e o problema **desapareceu**, a causa era a atualização — caso fechado. Se o problema **persiste** após o rollback, ele não estava na imagem nova, e o caminho é outro (dados corrompidos, firmware ou hardware).

```terminal
$ steamos-update rollback
This will revert to the previous OS version. Continue? [y/N] y
Reverting to previous slot...
Slot A marked for next boot. Reboot to activate.
```

Antes de reverter, vale coletar os logs para não perder a pista da causa. Após o rollback, o log do boot quebrado ainda fica acessível no journal (o sistema guarda os boots anteriores):

```terminal
$ journalctl --list-boots | tail -3
-2 3b8f1c2d9e... Tue 2024-11-05 18:22:01 -03—Tue 2024-11-05 18:40:12 -03
-1 7a91e0f3b2... Wed 2024-11-06 09:15:44 -03—Wed 2024-11-06 09:16:07 -03
 0 c4de8821aa... Wed 2024-11-06 09:20:31 -03—now
```

O boot `-1` (que durou só 23 segundos) é provavelmente o que falhou. Você pode inspecioná-lo com `journalctl --boot -1` e procurar erros.

## A sequência de recuperação

Decore esta ordem — ela vai do mais seguro ao mais invasivo:

1. **Esperar o rollback automático** (o sistema tenta sozinho).
2. **Rollback manual** (botão de liga/desliga ou `steamos-update rollback`).
3. **Checkout** (`steamos-update checkout`): reaplica a imagem limpa do canal atual.
4. **Reinstalação completa** via imagem de recuperação (último recurso).

Os passos 1 e 2 você já viu. O passo 3 merece atenção.

## Reaplicando a imagem limpa com checkout

O `checkout` baixa de novo a imagem do canal atual e a reaplica, sobrescrevendo a partição de sistema com o conteúdo de fábrica. Ele é indicado quando o sistema **sobe**, mas está "sujo": arquivos da raiz foram alterados indevidamente, a `/etc` foi bagunçada, ou algo corrompeu a imagem sem impedir o boot.

```terminal
$ sudo steamos-update checkout
Checking for available updates...
Current version is 3.6.21, no action needed.
Downloading image 3.6.21 (build_id 20241105.100)...
Download complete (1,2 GB)
Verifying image signature... OK
Writing clean image to inactive slot...
Write complete.
Slot B marked for next boot. Reboot to activate.
```

Compare com a saída do `check` comum: o `checkout` força o download mesmo quando "já está na versão atual" (`no action needed`), porque o objetivo não é subir de versão, e sim **reconstruir** a imagem. É a forma canônica de voltar ao estado de fábrica **sem** perder os dados de `/home`.

Antes de recorrer ao `checkout`, confirme que a raiz está no estado esperado. Se alguém (ou você) desligou a proteção de somente leitura para fazer experimentos, o `steamos-readonly` denuncia:

```terminal
$ steamos-readonly status
Read-only filesystem is disabled.
```

Uma raiz com `Read-only ... disabled` é um convite a problemas: qualquer processo pode ter gravado ali, e a imagem não é mais confiável. O `checkout` resolve isso ao reescrever a imagem limpa — e, de quebra, a proteção de somente leitura volta no próximo boot.

:::perigo
Se você fez `sudo steamos-readonly disable` para instalar algo manualmente na raiz, **é exatamente isso que vai ser perdido** no checkout. Pacotes e arquivos que você colocou manualmente em `/usr`, `/etc` ou `/opt` (fora de `/home`) serão apagados quando a imagem limpa for reescrita. Faça backup do que for manual antes de rodar `checkout`.
:::

## Quando nada disso resolve

Se rollback e checkout não resolvem, e o sistema nem sobe mais, resta a **reinstalação completa**. A Valve distribui uma imagem de recuperação que você grava num pendrive e inicializa segurando volume-para-baixo + power. O processo de recuperação oferece duas opções relevantes:

- **Re-image Steam Deck** — reinstala o sistema inteiro, **apagando** `/home` (seus jogos e saves locais se perdem, salvo o que está no Steam Cloud).
- **Reinstalar mantendo dados** — quando disponível, reinstala o sistema preservando `/home`.

A reinstalação é o último recurso porque mexe nos seus dados. Antes de chegar lá, o rollback e o checkout resolvem a esmagadora maioria dos casos, justamente porque o esquema A/B mantém uma cópia boa do sistema o tempo todo.

## Um roteiro prático completo

Cenário: a atualização da noite anterior deixou o Wi-Fi instável.

```terminal
$ steamos-update rollback
This will revert to the previous OS version. Continue? [y/N] y
Reverting to previous slot...
Slot A marked for next boot. Reboot to activate.
$ sudo reboot
```

Depois do reinício, o Wi-Fi voltou ao normal — era a atualização. Agora, para não ficar vulnerável a bugs antigos, você quer a imagem limpa do canal estável:

```terminal
$ sudo steamos-update checkout
Checking for available updates...
Current version is 3.6.20, no action needed.
Downloading clean image...
```

E, se quiser tentar a 3.6.21 de novo (torcendo que já tenham corrigido), basta um `sudo steamos-update check` e aplicar — o ciclo se fecha, e você segue numa versão estável e limpa.

## Resumo

- Classifique a quebra primeiro: rollback distingue bug de atualização de corrupção de dados/hardware.
- A ordem de recuperação é: rollback automático → rollback manual → checkout → reinstalação.
- `steamos-update checkout` reaplica a imagem limpa do canal atual sem perder `/home`.
- Uma raiz com `steamos-readonly status` = `disabled` indica imagem sujeita a alterações indevidas.
- A reinstalação completa é o último recurso e pode apagar `/home`.

## Exercícios

1. Rode `journalctl --list-boots` e identifique qual foi o boot mais curto/danoso. Inspecione-o com `journalctl --boot -N` e procure erros.
2. Verifique o estado da proteção de somente leitura com `steamos-readonly status`. Ele está `enabled` ou `disabled`?
3. Execute `sudo steamos-update checkout` para reaplicar a imagem limpa do canal atual e reinicie. Confira depois se o sistema segue funcional e com seus jogos intactos.
4. Simule o diagnóstico: pense num cenário em que o rollback **não** resolve o problema. O que isso te diz sobre a causa, segundo a classificação das três gavetas?
5. **Desafio.** Combine esta seção com a do esquema A/B: explique, passo a passo, por que uma falha de atualização que corrompe a partição ativa **não** impede o rollback — e por que uma corrupção em `/var` (compartilhada entre versões) pode sobreviver tanto ao rollback quanto ao checkout, exigindo a reinstalação.