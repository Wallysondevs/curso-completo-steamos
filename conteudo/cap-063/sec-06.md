O SteamDeckTools (SDT) é o que transforma o Windows de "instalação genérica num portátil" para "experiência que respeita o hardware". É um conjunto de utilitários de código aberto que preenche o vazio deixado pela ausência do modo Gaming do SteamOS: controle, overlay de desempenho e ajuste de TDP.

:::objetivos
- Entender o que o SteamDeckTools oferece e o que cada componente faz
- Instalar o SDT com todas as dependências
- Configurar o ViGEmBus e o HidHide para emulação de controle
- Verificar se o RTSS (RivaTuner Statistics Server) está operando
- Diagnosticar conflitos com o Steam Input

:::

## Os três pilares do SteamDeckTools

O SDT é três programas que trabalham juntos, mas podem ser instalados e usados separadamente:

| Componente | Função |
|---|---|
| **SDTController** | Lê os controles físicos e os traduz para um controle virtual XInput/Xbox 360 |
| **SDTPerformance** | Ajusta TDP, clocks da GPU, FSR, framerate cap e exibe overlay |
| **FanControl** | Gerencia a curva de ventoinha, com perfis de temperatura independentes |

O primeiro resolve o controle. O segundo resolve o desempenho e o monitoramento. O terceiro resolve o ruído. Juntos, eles entregam o equivalente ao painel lateral (`...`) que o SteamOS oferece no modo Gaming — só que você ativa com [[Steam]] + [[...]] (configurável) ou com um atalho de teclado.

O código-fonte fica no GitHub (`ayufan/steam-deck-tools`). Binários pré-compilados, documentação e releases também estão lá.

## Instalando do zero

A instalação exige três passos: o SDT propriamente dito, o driver de controle virtual e o filtro de ocultação. A ordem importa porque o HidHide precisa estar ativo antes de o SDTController tentar esconder o controle físico do Windows.

1. **ViGEmBus.** É o driver que cria controles virtuais no Windows, como um Xbox 360 controller. Instale o `.exe` do instalador — simples, next-next-finish.

2. **HidHide.** É o driver que "esconde" o controle físico do Steam Deck. Sem ele, o Windows e a Steam veem o controle duas vezes: uma pela via física (que não mapeia direito) e outra pela virtual (do SDT). O resultado é duplo-input, câmera girando sozinha e botões fantasma.

3. **SteamDeckTools.** Baixe o instalador mais recente da página de releases no GitHub. Execute como administrador, mantenha todas as opções marcadas e configure o lançamento automático com o Windows.

```terminal
$ # No PowerShell como administrador, após instalar:
$ sc query ViGEmBus
SERVICE_NAME: ViGEmBus
        STATE       : 4  RUNNING
```

Para conferir o trio completo de serviços num só comando:

```terminal
$ sc query ViGEmBus HidHide SteamDeckTools
SERVICE_NAME: ViGEmBus
        STATE       : 4  RUNNING
SERVICE_NAME: HidHide
        STATE       : 4  RUNNING
SERVICE_NAME: SteamDeckTools
        STATE       : 4  RUNNING
```

Se qualquer um dos três aparecer como `STATE : 1 STOPPED`, o controle não vai funcionar de ponta a ponta — o SDTController depende do ViGEmBus para criar o controle virtual e do HidHide para esconder o físico.

:::perigo
O HidHide deve esconder o controle físico **antes** de o SDTController iniciar. Se o SDTController começar primeiro, o Windows toma posse do físico, o virtual nunca ganha exclusividade, e você passa horas debugando fantasma no controle. A ordem de instalação (ViGEmBus → HidHide → SDT) e a ordem de boot do serviço são críticas.
:::

## O que o RTSS entrega e por que ele é necessário

O RivaTuner Statistics Server (RTSS) é um componente externo ao SDT, mas o SDTPerformance o usa para desenhar o overlay (OSD) com FPS, temperatura, uso de CPU/GPU e clock. Sem o RTSS, o overlay simplesmente não aparece.

O RTSS acompanha o MSI Afterburner, mas o SDT não precisa do Afterburner — o SDTPerformance já fornece as métricas. O RTSS é puxado como dependência indireta: ao rodar o SDT pela primeira vez, se o RTSS não estiver instalado, o overlay informa "RTSS not found".

A instalação recomendada é baixar o RTSS do site oficial (Guru3D) e instalar com perfil padrão. Depois, o SDTPerformance se conecta automaticamente.

```terminal
$ tasklist | findstr RTSS
RTSS.exe                    12384 Console                    1      8.192 K
```

Com RTSS e SDT rodando, o contador de FPS deve aparecer no canto superior esquerdo da tela assim que você abrir um jogo — se não aparecer, confira se o OSD está habilitado tanto no RTSS (MasterServer → Show own statistics) quanto no SDTPerformance.

## Conflito com o Steam Input

O Steam Input, no cliente Steam para Windows, também tenta mapear controles. Se o SDTController e o Steam Input estiverem ativos ao mesmo tempo, o controle é interpretado duas vezes e o resultado é idêntico ao problema do HidHide ausente: comandos duplicados.

A solução padrão: para jogos da Steam, você pode usar ou o Steam Input **ou** o SDTController, não os dois. Para jogos fora da Steam (Game Pass, Epic, GOG), o SDTController é indispensável, e o Steam Input simplesmente não interfere. Se você joga mais fora da Steam, desabilite o Steam Input no cliente global. Se joga mais dentro, pode manter o SDTController desligado para títulos da biblioteca Steam e ligá-lo para os demais.

## Resumo

- SteamDeckTools = SDTController (controle) + SDTPerformance (TDP/overlay) + FanControl (ventoinha).
- ViGEmBus cria controles virtuais; HidHide esconde o controle físico.
- A ordem de instalação (ViGEmBus → HidHide → SDT) e de boot dos serviços é crítica.
- RTSS é componente externo, mas obrigatório para o overlay funcionar.
- SDTController e Steam Input não devem coexistir no mesmo jogo.

## Exercícios

1. Instale ViGEmBus, HidHide e SteamDeckTools nessa ordem. Confirme com `sc query` que os três serviços estão rodando.
2. Configure o HidHide: abra o cliente de configuração, adicione o executável do SDTController à lista de exceções e marque "Enable hiding".
3. Instale o RTSS e verifique, na aba de notificações, que o SDTPerformance se conectou ao RTSS.
4. Abra um jogo fora da Steam (ex.: um freeware do itch.io) e confirme que o controle funciona via SDTController. Depois, feche o SDT e abra o mesmo jogo — o que muda?
5. **Desafio.** Identifique no `services.msc` o tipo de inicialização de cada serviço relacionado (ViGEmBus, HidHide, SteamDeckTools). Proponha uma ordem de dependência entre eles usando `sc config` e justifique por que um serviço não pode subir antes do outro.