Nem todo problema de jogo é causado pela versão do Proton — mas quando é, os sintomas têm padrão. Diagnosticar corretamente antes de trocar de versão economiza horas, pois evita que você mexa na compatibilidade quando o problema está, por exemplo, no prefixo Wine, no cache de shaders ou no driver gráfico.

:::objetivos
- Reconhecer sintomas típicos de incompatibilidade com o Proton
- Localizar o log do Proton de um jogo para investigar falhas
- Entender o prefixo Wine e como ele afeta a escolha de versão
- Decidir entre trocar de versão ou resetar o prefixo
:::

## Sintomas que apontam para o Proton

Alguns comportamentos são assinaturas claras de problema na camada de compatibilidade:

- **Crash imediato no lançamento**, antes de qualquer logotipo do jogo
- **Tela preta com áudio** durante cinemáticas (codec de vídeo)
- **Erros visuais de DirectX** traduzidos para Vulkan (artefatos, texturas pretas)
- **Controles não reconhecidos** apesar de o jogo suportar gamepad
- **Regressão após update do Proton** — o jogo funcionava e parou

Se o sintoma apareceu imediatamente após você atualizar o Proton, a hipótese de regressão é forte e você deve testar reverter a versão.

## O log do Proton

Cada execução gera um log que pode ser lido para confirmar a causa. O arquivo fica em `$HOME/steam-<appid>.log`:

```terminal
$ tail -30 ~/steam-438100.log
wine: Unhandled page fault on read access to 0x00000000 at address 0x7f1234567890
...
err:   D3D11: Failed to create texture: 0x8007000e
err:   vulkan: vkCreateImage failed
```

As duas últimas linhas são um caso clássico: o jogo pediu uma textura que o driver Vulkan recusou criar (`vkCreateImage failed`). Isso pode ser um bug na tradução D3D11→Vulkan que uma versão diferente do Proton contorna — um forte indício de que a troca de versão é o caminho certo.

:::dica
Para jogos que fecham sem gerar log visível, o `journalctl` do Steam frequentemente mostra a exceção antes do processo morrer. Use `journalctl -u steam --since "10 min ago" | grep -i -E "crash|error|fault"` logo após a tentativa.
:::

## O prefixo Wine e a troca de versão

Cada jogo roda dentro de um **prefixo Wine** — um diretório que simula uma instalação de Windows para aquele jogo, com registro, bibliotecas e saves. Ele fica em:

```terminal
$ ls ~/.steam/steam/steamapps/compatdata/ | head
438100
570
1086940
...
```

Cada pasta numerada corresponde ao AppID de um jogo, e dentro dela está o prefixo (`pfx/`). A interação entre o prefixo e a versão do Proton tem uma consequência prática importante: trocar de versão **não** apaga o prefixo, mas trocar de **família** (ex.: de Valve-Steam para GE) pode exigir que o prefixo seja revalidado ou recriado.

- **Mudança dentro da mesma linha Stable** (9.0-4 → 9.0-5): prefixo intacto
- **Mudança Stable → Experimental**: prefixo geralmente reaproveitado
- **Mudança Stable → GE**: prefixo geralmente reaproveitado, mas componentes novos entram
- **Mudança de arquitetura** (32→64 bits ou "bleeding edge" com Wine novo): prefixo pode ser recriado

Para inspecionar a estrutura interna de um prefixo, o comando abaixo revela o que há dentro do `pfx/` de um jogo:

```terminal
$ ls ~/.steam/steam/steamapps/compatdata/438100/pfx/
drive_c/  system.reg  user.reg  userdef.reg  version
$ ls ~/.steam/steam/steamapps/compatdata/438100/pfx/drive_c/
Program Files/  Program Files (x86)/  users/  windows/
```

O `drive_c/` é a imitação do disco `C:` do Windows, com `users/`, `windows/` e `Program Files/`. Os arquivos `*.reg` são o registro do Windows persistido em texto. É aqui que moram saves e configurações específicas de um jogo — por isso apagar um prefixo tem consequências reais.

Para fechar o diagnóstico, a regra prática de três passos cobre a maioria dos casos: primeiro, leia o log `~/steam-<appid>.log` e procure por exceções; segundo, verifique no `journalctl` se a versão correta do Proton foi de fato carregada; terceiro, se os dois anteriores não revelarem nada, experimente trocar de versão e observe se o sintoma muda. Se a troca de versão resolve, você achou o problema. Se não resolve, o problema provavelmente está no prefixo, nos drivers, ou no próprio jogo — e não na camada de compatibilidade.

:::atencao
Se um prefixo foi "envenenado" por instalações erradas (por exemplo, você instalou um mod que sobrescreveu DLLs do prefixo), **mudar a versão do Proton não conserta** — você precisa apagar o prefixo. O caminho seguro é: anotar o AppID → fechar o jogo → `rm -rf ~/.steam/steam/steamapps/compatdata/<appid>` (ou mover para outro lugar) → reiniciar o jogo. Só faça isso sabendo que configurações locais do jogo podem se perder.
:::

## Resumo

- A regra de precedência é: Stable → Experimental → Hotfix → GE, subindo apenas com sintoma.
- Sintomas de incompatibilidade incluem crash no lançamento, tela preta com áudio e regressão pós-update.
- O log `~/steam-<appid>.log` e o `journalctl -u steam` revelam a causa real de uma falha.
- O prefixo Wine mora em `compatdata/<appid>` e não é apagado ao trocar de versão.
- Prefixo envenenado se resolve com remoção do diretório, não com troca de versão do Proton.

## Exercícios

1. Encontre um jogo que você já rodou e localize o AppID dele no `config.vdf` (chave `CompatToolMapping`). Anote qual versão do Proton ele usa hoje.
2. Lance um jogo e, em seguida, confirme a versão em uso com `journalctl -u steam --since "2 min ago" | grep -i "launching app"`.
3. Gere um erro proposital: selecione o Proton Experimental para um jogo que funciona bem na Stable e verifique se o log `~/steam-<appid>.log` continua limpo ou registra novos avisos. Depois volte para a Stable.
4. Liste os prefixos existentes com `ls ~/.steam/steam/steamapps/compatdata/` e relacione três deles aos jogos por AppID (use `steam://rungameid/<appid>` ou a busca da biblioteca).
5. **Desafio.** Simule um diagnóstico completo: peça a um colega que "quebre" um jogo trocando silenciosamente a versão do Proton. Você deve detectar o problema usando somente terminal (`journalctl`, `config.vdf`, logs) e chegar ao AppID + versão correta, sem abrir a interface gráfica do Steam.