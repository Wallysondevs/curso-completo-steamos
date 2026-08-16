O Quick Access Menu (QAM, ou "menu de acesso rápido") é o painel lateral direito que aparece ao pressionar o botão `...`. Ele concentra ajustes que você faz dezenas de vezes por sessão: brilho, volume, modo de desempenho, FPS, TDP e conectividade. O QAM é navegável inteiramente por atalhos de botão, e dominar esses atalhos evita abrir o configurações completo para tarefas rotineiras.

:::objetivos
- Abrir e navegar o Quick Access Menu apenas com botões físicos
- Ajustar brilho, volume e brilho de tela via atalhos dentro do QAM
- Alternar modos de desempenho e perfil de FPS sem sair do jogo
- Configurar conectividade (Wi-Fi, Bluetooth, modo avião) pelo QAM
:::

## Estrutura do QAM e navegação

O QAM abre com uma lista vertical de ícones: **Brinilho**, **Volume**, **Desempenho**, **Bateria**, **Wi-Fi**, **Bluetooth**, **Notificações** e **Configurações rápidas**. A navegação segue o mesmo padrão do restante do Modo Jogo.

| Ação | Resultado |
|---|---|
| [[... (Quick Access)]] | Abre/fecha o QAM |
| [[D-Pad Cima/Baixo]] | Percorre as opções do QAM |
| [[A]] | Seleciona/confirma o item destacado |
| [[B]] | Fecha o QAM e volta ao jogo/menu |
| [[Analógico Esquerdo]] | Navegação livre entre itens |
| [[L1 / R1]] | Pula entre categorias do QAM |

O QAM é projetado para ser usado **sem interromper o jogo**: o jogo continua rodando e renderizando por trás, enquanto o painel se sobrepõe. Isso vale para ajustes de desempenho em tempo real — você vê o efeito na hora, sem sair da partida.

```terminal
$ cat /sys/class/backlight/amdgpu_bl0/brightness
82
$ cat /sys/class/backlight/amdgpu_bl0/max_brightness
255
```

O brilho que você ajusta no QAM escreve diretamente no subsistema `backlight` do kernel. O valor `82` acima corresponde a cerca de 32% do brilho máximo — o QAM mostra uma porcentagem arredondada, mas o sistema armazena o inteiro bruto de 0 a 255.

## Ajustes de desempenho em tempo real

A seção de **Desempenho** do QAM é a mais rica em opções e a que mais impacta a experiência. Cada controle tem um atalho de navegação específico, mas o ajuste fino é feito com os analógicos.

| Controle | Faixa | Botões de ajuste |
|---|---|---|
| Limite de FPS | 10–90 FPS | Analógico direito esquerda/direita |
| TDP (watt) | 3–15 W (varia por jogo/APU) | Analógico direito |
| Filtro de refresh | Ligado/desligado | [[A]] toggle |
| FSR (upscaling) | Ligado/desligado | [[A]] toggle |
| Resolução de render | Lista de opções | D-Pad cima/baixo |

O limite de FPS é um dos ajustes mais frequentes: em jogos leves, travá-lo em 40 FPS (metade dos 80 Hz da tela OLED) entrega fluidez com muito menos calor e consumo.

:::dica
Para jogos que rodam acima de 60 FPS, o perfil "40 FPS / 40 Hz" no OLED é o ponto ideal de equilíbrio entre fluidez, temperatura e autonomia de bateria. No LCD (60 Hz), o equivalente é 30 FPS.
:::

## Conectividade e toggles rápidos

O QAM também é o lugar para alternar Wi-Fi, Bluetooth e modo avião sem mergulhar nas configurações completas.

| Toggle | Atalho | Estado padrão |
|---|---|---|
| Wi-Fi | [[A]] sobre o item | Ligado |
| Bluetooth | [[A]] sobre o item | Ligado |
| Modo avião | [[A]] sobre o item | Desligado |
| Tela sempre ligada | [[A]] sobre o item | Ligado durante carga |

```terminal
$ nmcli radio
WIFI-HW  WIFI      WWAN-HW  WWAN
enabled  enabled   missing  enabled
$ nmcli radio wifi off
```

Por trás do toggle de Wi-Fi do QAM está o NetworkManager. A alternância no QAM chama `nmcli radio wifi` internamente — liga e desliga o rádio físico, não apenas desconecta da rede. Isso economiza mais bateria do que simplesmente esquecer a rede.

:::atencao
Desligar o Wi-Fi pelo QAM também interrompe o Remote Play e o Cloud Sync em andamento. Se você estava jogando via streaming do seu PC, o toggle de Wi-Fi encerra a sessão imediatamente, sem aviso.
:::

O toggle de Bluetooth segue o mesmo mecanismo, mas com o controle sobre o adaptador `hci0`. Ao desativar o Bluetooth pelo QAM, o rádio para de transmitir e os dispositivos pareados são desconectados na hora:

```terminal
$ rfkill list
0: hci0: Bluetooth
	Soft blocked: no
	Hard blocked: no
1: phy0: Wireless LAN
	Soft blocked: no
	Hard blocked: no
$ rfkill block bluetooth
```

A ferramenta `rfkill` mostra e controla o estado de "soft block" (desligado por software) de cada rádio. O QAM e o `rfkill` enxergam os mesmos dispositivos — por isso o modo avião do Deck equivale a um `rfkill block all`, que desliga Wi-Fi e Bluetooth de uma só vez.

## Resumo

- O QAM abre com o botão `...` e é navegável integralmente com D-Pad, analógicos e botões A/B.
- O brilho do QAM grava no subsistema `backlight` do kernel (0–255), exibido como porcentagem.
- O limite de FPS e o TDP são ajustados em tempo real com o analógico direito, sem fechar o jogo.
- O toggle de Wi-Fi chama `nmcli radio`, desligando o rádio físico, não apenas a conexão.
- O QAM não pausa o jogo; todos os ajustes têm efeito imediato e visível.

## Exercícios

1. Abra o QAM durante um jogo e ajuste o limite de FPS de 60 para 40. Observe a mudança de temperatura e fluidez. Registre a diferença após 5 minutos.
2. Compare o valor de brilho exibido no QAM com `cat /sys/class/backlight/amdgpu_bl0/brightness`. A porcentagem corresponde ao valor bruto?
3. Desligue o Wi-Fi pelo QAM e execute `nmcli radio` no Modo Desktop. O que mudou? Depois religue pelo QAM e confirme de novo.
4. Ative o modo avião pelo QAM. O Bluetooth também desligou? Teste um fone Bluetooth conectado para verificar.
5. **Desafio.** Use `journalctl -f` no Modo Desktop enquanto alterna o Wi-Fi pelo QAM no Modo Jogo. Capture as linhas de log geradas pelo NetworkManager e identifique o comando de desligamento de rádio. O log confirma o uso de `nmcli radio wifi off`?