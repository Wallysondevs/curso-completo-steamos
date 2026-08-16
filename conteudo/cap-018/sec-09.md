Acessibilidade que não é testada é acessibilidade que só existe no papel. Neste capítulo inteiro, você configurou narração, filtros, escala e remapeamentos — mas o valor real de cada ajuste só aparece quando você **valida** que ele funciona na prática, em cenários reais de uso, e que continua funcionando após alguma mudança no sistema. Esta seção consolida o capítulo com um método de teste e um procedimento de diagnóstico de ponta a ponta.

:::objetivos
- Montar uma rotina de validação das configurações de acessibilidade
- Verificar a persistência das opções após reinício e atualização
- Diagnosticar regressões usando logs e arquivos de configuração
- Testar acessibilidade sem o hardware adaptativo disponível para você
- Consolidar o capítulo integrando todas as camadas (UI, compositor, entrada)
:::

## Por que testar — e o que testar

Existe uma definição útil: acessibilidade funciona quando **a pessoa alvo consegue completar uma tarefa real** sem ajuda externa. Isso é diferente de "a opção está ligada". Ligar o filtro de cor não garante que o jogador daltônico consiga ver a barra de vida do inimigo; é preciso testar esse cenário específico.

Monte uma lista de **tarefas críticas** por perfil de deficiência:

- **Visão de cores**: distinguir aliado/inimigo no HUD, ler barras de vida, ver o item selecionado no menu.
- **Baixa visão**: ler a descrição de um jogo na loja, encontrar o botão de "Jogar", navegar uma configuração.
- **Mobilidade**: iniciar um jogo, mover pelo menu, executar uma ação de jogo combinada (correr + mirar).

Cada tarefa deve ter um resultado binário: *consegue / não consegue*. É essa granularidade que transforma "configurar" em "validar".

## Verificando persistência após reinício

A primeira armadilha é a configuração que some. Você liga um filtro, desliga o deck, liga de novo, e ele voltou ao padrão. Isso pode acontecer por duas razões: a opção não foi gravada em `config.vdf`, ou o arquivo foi sobrescrito por uma atualização.

O teste é simples e pode ser automatizado em parte pelo terminal. Antes e depois de reiniciar, capture o estado das chaves-chave:

```terminal
$ grep -iE "SpeakTextInSteamUI|SteamUIScale|ColorBlindMode|HighContrast" ~/.local/share/Steam/config/config.vdf
"SpeakTextInSteamUI"		"1"
"SteamUIScale"		"1.25"
"ColorBlindMode"		"2"
"SteamUIHighContrast"		"1"
```

Guarde essa saída (por exemplo, redirecionando para um arquivo) antes de reiniciar, e compare depois:

```terminal
$ grep -iE "Speak|UIScale|ColorBlind|HighContrast" ~/.local/share/Steam/config/config.vdf > /tmp/acc_antes.txt
$ sudo systemctl reboot
$ diff /tmp/acc_antes.txt <(grep -iE "Speak|UIScale|ColorBlind|HighContrast" ~/.local/share/Steam/config/config.vdf)
```

Se o `diff` não imprimir nada, as chaves bateram — a persistência funcionou. Se houver diferenças, uma atualização (ou o próprio Steam) alterou valores, e você precisa reconfigurar e investigar o porquê.

## Diagnóstico de regressão em três camadas

Quando algo para de funcionar, o diagnóstico deve seguir a arquitetura que percorremos no capítulo — três camadas em ordem:

1. **Configuração** — o valor está certo em `config.vdf`?
2. **Compositor** — o gamescope está saudável (`journalctl -u gamescope`)?
3. **Hardware/entrada** — o dispositivo adaptativo aparece no kernel (`dmesg`)?

Um roteiro concreto, do mais barato ao mais caro:

```terminal
$ grep -i "ColorBlindMode" ~/.local/share/Steam/config/config.vdf
$ journalctl -u gamescope --no-pager | grep -iE "error|fail" | tail -5
$ dmesg | grep -iE "hid|xbox|adaptive|input" | tail -5
```

Se a camada 1 está correta e a 2 e 3 estão limpas, o problema provavelmente está no próprio jogo (opções internas conflitando). Se a camada 2 mostra erro, o filtro não vai se aplicar por mais que a chave esteja certa. É a ordem certa para não perder tempo caçando bug no lugar errado.

:::dica
Mantenha um "diário de acessibilidade": um arquivo de texto onde você registra, para cada jogo, quais opções ficaram boas e em qual camada. Quando uma atualização do SteamOS quebrar algo (o que acontece), você tem o estado anterior documentado e sabe exatamente o que restaurar — sem re-descobrir tudo do zero.
:::

## Testando sem o hardware alvo

O cenário mais comum é: você configura acessibilidade para outra pessoa (um parente, um paciente, um aluno) mas não tem a deficiência dela. Como testar de forma honesta?

Existem dois caminhos:

1. **Simulação de software** — filtros de daltonismo invertidos, telas em escala de cinza, brilho reduzido. Você já viu o `gammastep` e a escala de cinza do desktop. Eles aproximam a experiência, mas não substituem o usuário real.
2. **Teste com a pessoa** — a única validação verdadeira. Sente a pessoa, peça para completar a tarefa crítica, e observe **onde** ela trava. A configuração certa é aquela que ela navega sem sua ajuda verbal.

:::atencao
Nunca confie 100% em simulação. Filtros de daltonismo, por exemplo, aproximam a matriz de percepção, mas não reproduzem a compensação neural que pessoas daltônicas desenvolvem ao longo da vida. O que parece "bom o suficiente" na simulação pode ser errado para o usuário real. Simulação serve para identificar erros **grosseiros**, não para dar a palavra final.
:::

## Um checklist de validação final

Consolide tudo num checklist rodável. Execute-o ao terminar de configurar qualquer jogo novo:

```terminal
$ echo "== configuração =="
$ grep -iE "Speak|UIScale|ColorBlind|HighContrast" ~/.local/share/Steam/config/config.vdf
$ echo "== compositor =="
$ journalctl -u gamescope --no-pager | grep -iE "selecting mode|error" | tail -4
$ echo "== entrada =="
$ dmesg | grep -iE "input|hid|xbox" | tail -4
```

O bloco imprime, em sequência, o estado das três camadas. É o equivalente a uma verificação de saúde antes de entregar o deck para a pessoa jogar.

:::info
Este capítulo se conecta diretamente com a seção sobre o menu de Acessibilidade ([sec-01](#/cap-018/sec-01)) e sobre o gamescope ([sec-08](#/cap-018/sec-08)). A validação é a ponte que fecha o ciclo: a camada de configuração que você entendeu no início só tem significado se sobrevive ao teste que fecha o capítulo.
:::

## Resumo

- Validar acessibilidade é confirmar que a pessoa alvo completa uma tarefa real, não apenas que a opção está ligada.
- Persistência pode ser testada com `diff` entre o estado de `config.vdf` antes e depois de reiniciar.
- Diagnóstico de regressão segue três camadas: configuração → compositor → hardware/entrada.
- Simulação (filtros, escala de cinza) aproxima a experiência, mas o teste com a pessoa é insubstituível.
- Um checklist rodável reúne as três camadas numa verificação rápida antes de cada uso.

## Exercícios

1. Defina uma tarefa crítica para cada um dos três perfis (visão de cores, baixa visão, mobilidade) e escreva o critério binário de "passou/não passou".
2. Capture as chaves de acessibilidade com `grep` para `/tmp/acc_antes.txt`, reinicie e confirme com `diff` que nada mudou.
3. Execute o checklist de três camadas do final da seção e interprete a saída: há algo que merece investigação?
4. Use a escala de cinza do desktop + brilho reduzido para simular baixa visão e tente completar uma tarefa na loja. Registre onde você travou.
5. **Desafio.** Reúna tudo do capítulo: configure um jogo com filtro de cor (uma camada), remapeamento + toggle (entrada), e fonte/escala adequada (UI). Valide com a tarefa crítica, rode o checklist de três camadas e documente o estado final. Se algo falhar, use o roteiro de diagnóstico em ordem e identifique a camada responsável.