O Steam Input é a peça mais subestimada de todo o Steam Deck — e a que mais desbloqueia o potencial de um controle externo. Ele é uma camada de tradução que fica entre os eventos crus do kernel e o jogo, permitindo remapear qualquer botão, ativar o giroscópio como mira e criar perfis por jogo. Sem entender essa camada, você usa 10% do que um DualSense ou controle Xbox oferece.

:::objetivos
- Entender o papel do Steam Input na tradução de eventos
- Criar e navegar entre perfis de configuração por jogo
- Mapear o giroscópio para mira de precisão
- Ativar e ajustar a ação dos trilhos e das zonas de gatilho
:::

## Por que existe uma camada de tradução

O jogo não conversa com o controle diretamente. Entre os dois, o Steam Input intercepta os eventos e os reescreve conforme um perfil. Isso resolve um problema antigo do PC: jogos diferentes esperam controles diferentes (alguns querem layout Xbox, outros PlayStation, outros teclado). Em vez de cada jogo reinventar suporte, o Steam Input normaliza tudo.

```terminal
$ ls ~/.steam/steam/controller_base
common  empty.vdf  templates
```

O diretório `controller_base` guarda os VDFs (*Valve Data Files*) com os templates oficiais: layouts padrão para joystick, teclado e mouse, e perfis específicos. Quando você abre um jogo, o Steam Input funde o template com o perfil do jogo e ativa o resultado.

## O modo Big Picture e os perfis

Toda a configuração acontece no modo **Big Picture**, acessível pelo próprio Deck ou em modo desktop abrindo o Steam. O caminho é `Configurações → Controle`. Lá você encontra o controle externo listado e pode escolher um perfil.

:::exemplo
Cenário real: você pluga um DualSense e abre um jogo de tiro em primeira pessoa. O jogo detecta "um gamepad" e aplica o layout de console. Mas você quer usar o giroscópio para mira fina. Você entra no perfil do Steam Input, ativa "Giroscópio" como "Mouse" e define a ativação ao tocar no touchpad. A partir daí, encostar no touchpad move a mira com o movimento do controle.
:::

A regra de ouro: comece sempre de um **template**, nunca de uma configuração em branco. O template já resolve os mapeamentos mais óbvios; seu trabalho é ajustar os recursos extras (giroscópio, gatilhos, botões traseiros).

## Remapeando botões e gatilhos

O Steam Input modela os controles modernos com mais granularidade que um gamepad clássico. Cada gatilho, por exemplo, não é só "apertar": ele tem uma **curva de resposta** (linear, exponencial, modo "hair trigger") e zonas de disparo.

| Elemento | O que você pode configurar |
|---|---|
| Botões frontais | remapear para qualquer ação, tecla ou macro |
| Gatilhos (`L2`/`R2`) | curva de resposta, ponto de ativação, modo analógico/digital |
| Sticks | zona morta, curva de resposta, clique ativável |
| Giroscópio | sensibilidade, ativação por toque/botão, eixos |
| Trilhos (`touchpad`) | dividir em zonas clicáveis, atalhos |
| Botões traseiros | ações extra não disponíveis no layout original |

O editor de perfil é visual: você clica num elemento do desenho do controle e edita seu comportamento. As mudanças valem para aquele jogo apenas, salvo se você escolher "aplicar como template global".

## O giroscópio como diferencial

O giroscópio é o recurso que mais separa o Steam Input de um mapeamento comum. Ele converte o movimento físico do controle em movimento de mouse, permitindo mira fina que um stick analógico não alcança.

:::dica
A configuração que virou padrão na comunidade: giroscópio ativado **por toque no stick direito** (método "flick stick" não, mas toque no stick analógico direito). Assim, enquanto seu polegar está no stick, o giroscópio responde; ao soltar, ele desativa. Isso evita a mira "flutuando" quando você repousa o controle.
:::

No editor, você define também o **eixo do giroscópio** (o padrão "yaw" para girar e "roll" para inclinar), a **sensibilidade** e se a saída é "mouse" (preciso, recomendado) ou "joystick" (compatibilidade, menos preciso).

## Exportando e compartilhando perfis

Perfis podem ser salvos localmente, compartilhados pela comunidade ou importados de outro usuário. Eles vivem como VDFs na home:

```terminal
$ ls ~/.steam/steam/userdata/*/config/steam-input/
game_actions  overrides  switches  templates  touchscreen
```

O subdiretório `overrides` guarda os mapeamentos por jogo que você personalizou. Se um perfil quebrou o jogo, apagar o override específico restaura o padrão — sem tocar no template global.

:::atencao
O Steam Input só traduz eventos para jogos **lançados pelo Steam**. Se você abre um jogo de fora — via Flatpak direto pelo Discover, por Heroic ou Lutris — o controle funciona, mas o mapeamento fino (giroscópio, gatilhos adaptativos, trilhos) não passa. Para manter o Steam Input em jogos de fora, adicione-os como "jogo não Steam" e lance por lá.
:::

## Resumo

- O Steam Input traduz eventos crus do kernel em ações de jogo conforme um perfil.
- Perfis são VDFs guardados em `~/.steam/steam/controller_base` e por-jogo em `overrides`.
- Comece sempre de um template, nunca de uma configuração em branco.
- O giroscópio convertido em "mouse" dá mira fina impossível com stick analógico.
- Gatilhos e trilhos aceitam curvas de resposta e zonas de ativação.
- O Steam Input só afeta jogos lançados pelo próprio Steam.

## Exercícios

1. Abra o Big Picture e localize seu controle externo em `Configurações → Controle`. Identifique qual template está ativo.
2. Em um jogo de tiro, ative o giroscópio como "mouse" com ativação por toque no stick direito. Ajuste a sensibilidade até a mira ficar estável.
3. Remapeie um botão frontal para uma tecla de teclado (por exemplo, `B` → `Espaço`) e confirme o efeito dentro do jogo.
4. No editor, crie duas zonas num trilho e atribua uma ação a cada uma. Teste o clique em cada metade.
5. **Desafio.** Lance um jogo fora do Steam (por Flatpak ou Heroic) e compare o comportamento do controle dentro e fora do Steam Input. Quais recursos somem quando ele roda fora do Steam?
