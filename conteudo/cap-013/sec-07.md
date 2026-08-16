Um perfil bem ajustado não precisa ficar preso ao seu Deck — ele pode ser exportado, compartilhado com a comunidade e importado de outros jogadores. O Steam disponibiliza a troca de configurações de controle e desempenho via comunidade, e esta seção mostra o caminho para exportar um perfil, onde ele fica no disco enquanto é enviado, e como importar um perfil alheio com segurança.

:::objetivos
- Exportar um perfil de desempenho para a comunidade Steam
- Localizar o arquivo temporário gerado durante a exportação
- Importar um perfil da comunidade e aplicá-lo a um jogo
- Verificar se o perfil importado sobrescreveu o existente
- Avaliar a qualidade de perfis comunitários antes de adotá-los
:::

## O fluxo de exportação

No Modo Jogo, o perfil por jogo pode ser exportado através do menu de **Layouts da comunidade** (compartilhamento de configurações). Embora tradicionalmente associado a controles, o Steam agrupa *todos* os ajustes por AppID — controles, desempenho e até a tela — num único pacote de configuração. O caminho é: dentro das Propriedades do jogo, na aba de desempenho (ou layouts), escolha **Compartilhar** ou **Exportar configuração**.

O Steam grava esse pacote temporariamente no sistema de arquivos, dentro da pasta de configuração do usuário:

```terminal
$ find ~/.local/share/Steam -name "*.vdf" -newer ~/.local/share/Steam/steamapps/libraryfolders.vdf 2>/dev/null | head -10
```

O `find` com `-newer` compara a data de modificação — ele mostra arquivos `.vdf` que foram alterados depois do `libraryfolders.vdf`. Se você acabou de exportar um perfil, algum `.vdf` na pasta `userdata` terá sido tocado. Isso ajuda a identificar onde o Steam está escrevendo ao compartilhar.

## Inspecionando o que foi empacotado

O Steam não grava um arquivo separado chamado "perfil exportado". Em vez disso, ele serializa o perfil dentro da estrutura do `localconfig.vdf` e o envia para os servidores da Valve quando você confirma. Você pode, no entanto, ver o *estado* do perfil antes da exportação:

```terminal
$ grep -B1 -A15 '"PerformanceProfile"' ~/.local/share/Steam/userdata/182745653/config/localconfig.vdf | grep -E 'fpsLimit|tdpLimit|gpuClock|fsrEnabled|sharpness' | head -10
				"fpsLimit"		"40"
				"tdpLimit"		"11"
				"fsrEnabled"		"1"
				"sharpness"		"3"
```

Esse comando filtra as chaves de desempenho do bloco ativo. É exatamente esse conjunto de pares que será enviado para a comunidade — o que significa que qualquer pessoa que importar seu perfil receberá esses mesmos valores aplicados ao jogo dela.

:::dica
Antes de exportar, revise o perfil e remova ajustes extremos que só fazem sentido no seu Deck (ex.: um TDP muito específico para a sua bateria gasta). Perfis comunitários devem ser genéricos o suficiente para funcionar em qualquer unidade.
:::

## Importando um perfil da comunidade

A importação é o caminho inverso: nas Propriedades do jogo, você navega pelos **Layouts da comunidade**, filtra por tipo de configuração (desempenho), e escolhe um. O Steam baixa o pacote e aplica os valores ao perfil individual daquele jogo, sobrescrevendo o que existia.

Para confirmar que a importação funcionou, basta inspecionar o `localconfig.vdf` imediatamente depois:

```terminal
$ grep -A 20 '"1730680"' ~/.local/share/Steam/userdata/182745653/config/localconfig.vdf | grep -E 'fps|tdp|gpu|fsr|sharpness' 
				"fpsLimit"		"30"
				"tdpLimit"		"9"
				"fsrEnabled"		"1"
				"sharpness"		"2"
```

Aqui o AppID `1730680` recebeu um perfil importado com FPS 30, TDP 9, FSR ativo e nitidez 2. É um perfil conservador, provavelmente focado em bateria. Comparar esses valores com o que você tinha antes da importação mostra exatamente o que mudou.

## Como avaliar um perfil antes de adotar

Perfis da comunidade são como receitas: qualquer um publica, e a qualidade varia. Antes de aplicar:

- **Veja os valores-chave:** FPS, TDP, FSR. Um perfil que crava 60 FPS e TDP baixo para um jogo pesado provavelmente vai falhar — o autor pode ter testado só na tela inicial.
- **Confira a data:** Perfis antigos podem não refletir melhorias do Proton e do SteamOS.
- **Teste e reverta:** Se o jogo ficar instável, exclua o perfil importado (ou desative-o) e volte ao seu.

:::atencao
Perfis da comunidade podem incluir configurações de controle e tela que você não pediu. Ao importar, o Steam aplica **todas** as configurações do pacote, não só as de desempenho. Se seus controles sumiram depois de importar um perfil, foi isso que aconteceu — restaure o layout de controle manualmente.
:::

## O ciclo completo: exportar, inspecionar, importar

Para testar o ciclo sem arriscar um perfil real, crie um perfil de teste num jogo qualquer, exporte para a comunidade (como privado, se a opção existir), anote os valores, e depois importe de volta. A comparação antes/depois no `localconfig.vdf` fecha o entendimento:

```terminal
$ diff <(grep -A 15 '"570"' ~/.local/share/Steam/userdata/182745653/config/localconfig.vdf.bak) <(grep -A 15 '"570"' ~/.local/share/Steam/userdata/182745653/config/localconfig.vdf)
```

O `diff` entre duas versões do arquivo (uma salva como `.bak` antes da importação e a atual depois) mostra linha a linha o que o perfil comunitário alterou. O `<( )` é uma substituição de processo do bash — um arquivo virtual que o `diff` lê como se fosse real. Esse é o jeito mais preciso de ver o que um perfil importado realmente fez.

## Resumo

- A exportação de perfil envia o bloco de desempenho do jogo (FPS, TDP, GPU, FSR, nitidez) para a comunidade Steam.
- `find` com `-newer` ajuda a localizar arquivos VDF alterados durante a exportação.
- A importação sobrescreve o perfil individual do jogo com os valores vindos da comunidade.
- Antes de adotar um perfil comunitário, avalie FPS/TDP combinados e a data de publicação.
- Perfis da comunidade incluem controles e tela; uma importação pode alterar mais do que o esperado.

## Exercícios

1. Crie um perfil de teste com valores que você reconheça facilmente (ex.: `fpsLimit 33`). Exporte-o e, depois, verifique com `grep` se o perfil continua igual no `localconfig.vdf`.
2. Navegue pelos layouts da comunidade de um jogo popular e identifique três perfis com valores de TDP muito diferentes. Qual você escolheria para jogar na bateria?
3. Antes de importar um perfil, faça uma cópia do `localconfig.vdf` (`cp ... localconfig.vdf.bak`). Importe o perfil e use `diff` para ver o que mudou.
4. Explique por que um perfil comunitário que funciona para um usuário pode não funcionar bem para outro, considerando diferentes estados de bateria e temperatura ambiente.
5. **Desafio.** Importe três perfis diferentes para o mesmo jogo, anotando os valores de performance após cada importação. Depois, crie seu próprio perfil híbrido combinando o melhor de cada um e exporte-o — integrando leitura de VDF da [seção 1](#/cap-013/sec-01) e criação de perfis da [seção 2](#/cap-013/sec-02).