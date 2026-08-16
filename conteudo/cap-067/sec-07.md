Os controles do Steam Deck são o que o diferencia de um smartphone ou tablet para streaming: trackpads, botões traseiros, giroscópio e uma tela sensível ao toque. Mas cada cliente de streaming — Chiaki, Greenlight, Moonlight — interpreta esses controles de forma diferente. Para que o Deck se comporte como um controle nativo do console, é preciso configurar o Steam Input com inteligência, mapeando cada elemento físico para a função correta e criando perfis por jogo ou plataforma.

:::objetivos
- Configurar o Steam Input para emular DualShock/DualSense no Chiaki
- Criar perfis de controle por jogo e por plataforma de streaming
- Mapear touchpad, gyro e botões traseiros para funções específicas
- Resolver conflitos entre o Steam Input e o mapeamento interno dos clientes
- Usar o Steam Input como tradutor universal entre Deck e consoles
:::

## O papel do Steam Input como tradutor

O Steam Input é a camada de software que traduz os eventos físicos do hardware do Deck (pressionar botões, deslizar trackpads, inclinar o giroscópio) em comandos que o jogo entende. No contexto de streaming, ele precisa emular o controle que o console espera:

- **Chiaki:** espera um DualShock 4 (PS4) ou DualSense (PS5).
- **Greenlight/xbPlay:** espera um controle Xbox (XInput).
- **Moonlight:** espera um controle Xbox (XInput) ou genérico.

Sem configuração, o Deck se apresenta como um controle genérico, e nem todos os botões funcionam como esperado — especialmente o touchpad do PlayStation, que o Deck pode emular com seus trackpads.

```terminal
## Acessando o Steam Input pelo Gaming Mode:
## Steam > Biblioteca > [aplicativo do cliente] > Ícone de controle > Layout de controle
## Ou, no Desktop: Steam > Configurações > Controle > Configuração do Steam Input
```

:::info
O Steam Input oferece centenas de layouts criados pela comunidade. Buscar por "Chiaki", "PS5 Remote Play" ou "Xbox Streaming" na aba de layouts da comunidade costuma encontrar perfis prontos que podem servir de ponto de partida.
:::

## Configurando o Steam Input para Chiaki

O Chiaki4Deck tem suporte integrado ao Steam Input, o que simplifica bastante a configuração. Mas se você usa o Chiaki original, o mapeamento precisa ser manual. Os desafios específicos do PlayStation:

1. **Touchpad do DualSense/DualShock:** o controle do PlayStation tem um touchpad central que muitos jogos usam como botão extra ou área sensível ao toque. O Deck tem dois trackpads (esquerdo e direito) que podem ser configurados para emular essa funcionalidade.
2. **Botão PlayStation:** o botão central com o logo da Sony não existe no Deck. Pode ser mapeado para o botão Steam + outra tecla.
3. **Giroscópio:** muitos jogos no PS5 usam o gyro do DualSense. O Deck também tem gyro e pode emulá-lo.

No Steam Input, para o perfil do Chiaki, configure:

```text
Trackpad direito → Mouse (para navegação nos menus)
Trackpad esquerdo → Touchpad do PlayStation (toque = botão touchpad)
Botão Steam + A → Botão PlayStation (PS)
Giroscópio → Emular giroscópio do DualSense
L4, R4 (botões traseiros) → L3, R3 (para cliques nos analógicos)
L5 → Touchpad click (útil em jogos que usam como mapa)
```

```terminal
## Para verificar como o Steam Input está mapeado:
## Steam > Configurações > Controle > Dispositivos de entrada
## O Steam Deck deve aparecer como "Steam Deck Controller"
```

:::dica
O Chiaki4Deck já vem com mapeamento automático de touchpad e gyro — ele detecta o controller do Steam Deck e os expõe nativamente ao protocolo Remote Play. Se o Chiaki original não reconhece o touchpad, troque para o Chiaki4Deck e ganhe o mapeamento sem configurar nada.
:::

## Mapeamento para Xbox no Greenlight e xbPlay

O ecossistema Xbox é mais simples, porque o controle do Deck já é reconhecido como gamepad XInput — o padrão nativo do Xbox. A maioria dos jogos funciona sem qualquer configuração adicional. Os ajustes que valem a pena:

- **Botões traseiros (L4, L5, R4, R5):** mapeie para ações frequentes (usar item, abrir mapa, trocar arma) que exigiriam tirar o polegar dos analógicos.
- **Trackpad direito:** como mouse para navegar no dashboard do Xbox, onde um cursor é necessário.
- **Giroscópio:** em jogos de tiro via streaming, ativar o gyro como mouse oferece precisão extra para ajustes finos de mira.

```text
L4 → Botão A (pular/confirmar — ação mais frequente em muitos jogos)
R4 → Botão B (voltar/cancelar)
L5 → Botão X
R5 → Botão Y
Trackpad direito → Mouse (dashboard e menus)
```

## Perfis por plataforma e por jogo

O Steam Input permite salvar múltiplos perfis e trocar entre eles com dois toques. A estratégia recomendada é criar um perfil base para cada plataforma e depois derivar perfis específicos para jogos que fogem do padrão:

```text
Perfis base:
├── "Chiaki PS5 Padrão" — mapeamento genérico para PS5
│   ├── "Chiaki PS5 - God of War" — gyro ativo, L4/R4 para ataque especial
│   └── "Chiaki PS5 - Gran Turismo" — gyro como volante, analógico como acelerador
├── "Xbox Streaming Padrão" — mapeamento genérico para Xbox
│   └── "Xbox - Halo Infinite" — gyro como mouse para mira fina
└── "Moonlight Desktop" — trackpad como mouse, teclas para atalhos
```

Para trocar de perfil durante o jogo:

```terminal
## Atalhos do Steam Deck:
## [[Steam]] → Abre o menu Steam Overlay
## [[Steam]] + [[←]]/[[→]] → Navega entre as abas do overlay
## Na aba de controle, o perfil ativo aparece no topo com opção de troca
```

## Resolvendo conflitos de mapeamento

Às vezes, o botão que você pressiona no Deck é interpretado duas vezes — uma pelo Steam Input e outra pelo cliente de streaming. Isso acontece quando o cliente também tem seu próprio mapeamento interno:

```terminal
## Sintoma: ao pressionar A no Deck, o jogo recebe dois "A"
## Causa: Chiaki ou Moonlight interpretando o input bruto + Steam Input traduzindo

## Solução 1 (Chiaki): nas configurações do console, desative
## "Pass through controller input"
## Solução 2 (Moonlight): em Input Settings, troque de "Automatic"
## para "Xbox 360" forçando um único caminho de tradução
## Solução 3 (geral): no Steam Input, crie um perfil "Gamepad vazio"
## e atribua cada botão manualmente, evitando duplicação
```

:::atencao
Se você conectar um controle físico DualSense ou Xbox ao Deck via Bluetooth ou USB enquanto usa o Chiaki/Moonlight, o Steam Input pode tentar gerenciar ambos simultaneamente, resultando em comandos triplicados. Desconecte controles externos ou desabilite o Steam Input para eles em Steam > Configurações > Controle.
:::

## Resumo

- O Steam Input traduz os controles do Deck para o formato esperado pelo console remoto: DualShock/DualSense para Chiaki, XInput para Xbox e Moonlight.
- O Chiaki4Deck oferece mapeamento automático de touchpad e gyro; o Chiaki original exige configuração manual.
- Botões traseiros e trackpads são a vantagem do Deck sobre controles tradicionais — mapeie-os para ações frequentes.
- Perfis por plataforma e por jogo permitem alternar rapidamente entre configurações otimizadas.
- Conflitos de mapeamento (duplo input) são resolvidos desativando a tradução automática em um dos lados.

## Exercícios

1. Crie um perfil base no Steam Input para o Chiaki. Mapeie o trackpad direito como touchpad do PlayStation e os botões traseiros como L3/R3. Teste em um jogo que use o touchpad como mapa.
2. No perfil do Xbox Streaming, mapeie L4 e R4 para A e B respectivamente. Jogue por 10 minutos e anote se isso reduziu o número de vezes que você precisou tirar o polegar do analógico direito.
3. Encontre e importe um layout da comunidade para o Chiaki. Compare com o seu perfil: o que o layout comunitário faz diferente?
4. Provoque um conflito de mapeamento: ative o mapeamento interno do Moonlight e o Steam Input simultaneamente. Identifique o sintoma e aplique a correção.
5. **Desafio.** Crie um perfil do Steam Input que utiliza o giroscópio para emular o analógico direito apenas quando você toca no trackpad direito (gyro ativado por toque). Teste em um shooter via Moonlight e compare a precisão de mira com e sem o gyro.