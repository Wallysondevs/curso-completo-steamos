Depois de criar, herdar, ajustar, exportar e organizar, chega o momento de diagnosticar quando um perfil não se comporta como esperado. Problemas como "o FPS não passa de 30 mesmo com o perfil em 60", "o TDP parece ignorado" ou "o perfil sumiu depois de uma atualização" têm causas conhecidas — e a maioria pode ser investigada com poucos comandos de terminal. Esta seção é o roteiro de troubleshooting para perfis de desempenho.

:::objetivos
- Diagnosticar perfis que não estão sendo aplicados
- Identificar conflitos entre perfil global e individual
- Investigar por que o FPS real não corresponde ao limite configurado
- Recuperar perfis após atualização do SteamOS ou do cliente Steam
- Usar o terminal como ferramenta de verificação antes de apelar para reinstalação
:::

## O perfil não está sendo aplicado

O sintoma mais comum: você cria ou altera um perfil, abre o jogo, e nada mudou. A primeira verificação é se o perfil foi realmente gravado — e o `grep` no `localconfig.vdf` responde em segundos:

```terminal
$ grep -A 8 '"PerformanceProfile"' ~/.local/share/Steam/userdata/182745653/config/localconfig.vdf | grep -A 8 '"1730680"'
```

Se o AppID não aparecer dentro de um bloco com `PerformanceProfile`, o perfil não foi salvo — ou foi salvo para outro AppID (confusão de jogo) ou o Steam não gravou (bug raro, resolvido reiniciando o cliente). Se aparecer, o problema está em outro lugar: conflito com o global, jogo ignorando o limite, ou o Gamescope não respeitando a restrição.

## O FPS real não bate com o limite

O limite de FPS do perfil é aplicado pelo Gamescope, o compositor do Steam Deck. Se o jogo roda abaixo do limite configurado, não é o perfil que está falhando — é o jogo que não tem desempenho para atingir aquele FPS. O limite é um **teto**, não um piso.

Mas e quando o jogo roda **acima** do limite? Isso pode acontecer se o jogo usar uma API que ignora o compositor (raro, mas possível em títulos com launcher próprio ou Vulkan com `VK_PRESENT_MODE_IMMEDIATE_KHR`). Verifique o que o Gamescope está de fato aplicando:

```terminal
$ ps aux | grep gamescope | grep -o '\-r [0-9]*'
-r 60
```

A flag `-r` do Gamescope define o limite de refresh rate ou FPS. Se o valor aqui (`60`) não corresponde ao que você configurou no perfil (`40`), pode haver um conflito de configuração — o Gamescope recebeu uma instrução diferente da esperada.

## Quando o TDP parece ignorado

Se você define `tdpLimit 8` e o SoC continua consumindo 12 W, duas coisas podem estar acontecendo: o perfil não está sendo lido (caso acima), ou o kernel está aplicando um limite diferente. O Steam Deck usa o subsistema `powercap` do kernel Linux para impor o TDP:

```terminal
$ cat /sys/class/powercap/intel-rapl\:0/constraint_0_power_limit_uw 2>/dev/null || cat /sys/devices/virtual/powercap/*/energy_uj 2>/dev/null | head -3
15000000
```

O valor `15000000` está em **microwatts** — ou seja, 15 W. Esse é o teto que o kernel está de fato impondo ao SoC. Se o perfil gravou `tdpLimit 8` (8 W) e o `powercap` mostra `15000000` (15 W), uma de duas: o Steam não traduziu o perfil para o kernel, ou o jogo ainda não estava rodando quando você leu o sensor. Leia o `powercap` **com o jogo aberto** para ter certeza.

## O perfil sumiu depois de uma atualização

Atualizações do SteamOS ou do cliente Steam podem reescrever o `localconfig.vdf`. É raro, mas acontece — especialmente em atualizações maiores da versão beta para estável. Se você fez o backup como sugerido na [seção 8](#/cap-013/sec-08), a recuperação é trivial:

```terminal
$ cp ~/backups/localconfig-2026-01-15.vdf ~/.local/share/Steam/userdata/182745653/config/localconfig.vdf
```

Antes de sobrescrever, porém, faça um `diff` para ver o que realmente mudou — às vezes a atualização só adicionou campos novos que você não quer perder:

```terminal
$ diff ~/backups/localconfig-2026-01-15.vdf ~/.local/share/Steam/userdata/182745653/config/localconfig.vdf | head -30
```

:::perigo
Sobrescrever o `localconfig.vdf` com um backup antigo pode reverter conquistas locais, playtime e outras configurações que o Steam gravou depois da data do backup. Sempre faça `diff` antes e prefira copiar só os blocos de `PerformanceProfile` manualmente em vez de restaurar o arquivo inteiro.
:::

## Conflito com configurações do jogo

O perfil do Steam atua **fora** do jogo (via Gamescope e powercap). Se o jogo tem suas próprias configurações de FPS (ex.: VSync interno, limitador de quadros no menu), essas configurações competem com o perfil. O resultado efetivo é o **menor** dos dois limites — se o jogo limita a 30 e o Steam a 60, você verá 30.

```terminal
$ grep -r "VSync\|MaxFPS\|FrameRateLimit" ~/.local/share/Steam/steamapps/compatdata/1730680/pfx/drive_c/users/steamuser/Documents/ 2>/dev/null
```

Esse `grep` procura configurações internas do jogo (na pasta do Proton, sob `compatdata/<AppID>/pfx/`) que mencionem VSync ou limitadores de FPS. Se encontrar, você tem um candidato a conflito — desative o limitador interno do jogo e deixe só o perfil do Deck controlar o FPS.

## Checklist de troubleshooting rápido

Antes de pedir ajuda ou reinstalar, execute esta sequência:

```terminal
$ grep -c "PerformanceProfile" ~/.local/share/Steam/userdata/182745653/config/localconfig.vdf
$ ps aux | grep gamescope | grep -o '\-r [0-9]*'
$ cat /sys/class/hwmon/hwmon0/temp1_input
```

Cada comando responde uma pergunta: o perfil existe no VDF? O Gamescope está com o limite correto? A temperatura está dentro do esperado? Se as três respostas forem sim, o perfil está funcionando e o problema está no desempenho do jogo em si, não na configuração.

:::info
No SteamOS 3.6, o Gamescope foi atualizado para suportar HDR e refresh rate variável (VRR). Se você estiver usando um monitor externo com VRR, o limite de FPS do perfil pode ser ignorado em favor do VRR — verifique as configurações de tela nas Propriedades do jogo.
:::

## Resumo

- Perfil não aplicado: verifique `grep "PerformanceProfile"` no `localconfig.vdf` antes de qualquer outra hipótese.
- FPS acima ou abaixo do limite: o teto é imposto pelo Gamescope (`ps aux | grep gamescope`) e compete com limitadores internos do jogo.
- TDP ignorado: leia `/sys/class/powercap/` **com o jogo aberto** para ver o valor real imposto pelo kernel.
- Atualizações podem reescrever o `localconfig.vdf`; mantenha backup e use `diff` antes de restaurar.
- A checklist de 3 comandos (`grep`, `ps`, `cat`) resolve a maioria dos diagnósticos de perfil.

## Exercícios

1. Com um jogo aberto, execute a checklist completa (`grep PerformanceProfile`, `ps aux | grep gamescope`, `cat .../temp1_input`) e anote os resultados.
2. Provoque um conflito: defina um limite de 30 FPS no perfil e ative o VSync interno do jogo (se disponível). O FPS final ficou em qual valor?
3. Rode `cat /sys/class/powercap/*/constraint_0_power_limit_uw` (ajuste o caminho conforme seu hardware) antes e depois de aplicar um perfil de TDP e compare os valores.
4. Simule a perda de perfil: renomeie o `localconfig.vdf` para `.bak`, abra o Steam, e veja se os perfis desapareceram. Depois restaure o arquivo original.
5. **Desafio.** Escreva um script `diagnostico-perfil.sh` que receba um AppID como argumento e imprima: se o perfil existe no VDF, o limite do Gamescope, o powercap atual e se há arquivos de configuração do jogo com VSync ativo. Esse script integra todas as técnicas do capítulo — leitura de VDF da [seção 1](#/cap-013/sec-01), sensores da [seção 4](#/cap-013/sec-04) e organização da [seção 8](#/cap-013/sec-08).