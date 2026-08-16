O Modo Desktop do SteamOS já vem com um applet de rede completo, mas a maioria das pessoas só usa a metade dele: clicar para escolher o Wi-Fi. As configurações mais importantes — redes salvas, prioridade, Wi-Fi automático e até o endereço IP — ficam escondidas atrás de uma opção de menu que poucos abrem. Explorar a interface gráfica do KDE te dá o controle que o clique rápido não oferece.

:::objetivos
- Abrir as configurações de rede do KDE a partir da bandeja do sistema
- Consultar e editar conexões salvas, incluindo senha e auto-conexão
- Definir prioridade entre redes e impedir conexões automáticas indesejadas
- Entender como as mudanças da GUI refletem nos perfis gerenciados pelo NetworkManager
:::

## A porta de entrada: a bandeja do sistema

No canto inferior direito da tela, ao lado do relógio, fica o ícone de rede (um arco de Wi-Fi ou um plug). Um clique simples abre a lista de redes e um menu rápido de ações. Mas é o clique **com o botão direito**, ou a opção de "Configurar" na parte inferior, que abre o painel completo do KDE — gerenciado pelo *Centro de Controle* (System Settings), na seção **Rede**.

A mesma tela pode ser alcançada pelo atalho `[[Meta+R]]` seguido da digitação de "rede", ou digitando "redes" na busca do menu de aplicativos. Dentro dela, há abas para **Conexões**, **Wi-Fi** e **Proxy**, entre outras. É na aba **Conexões** que vivem os perfis salvos — exatamente os mesmos objetos que o `nmcli connection show` exibe.

```terminal
$ nmcli connection show
NAME               UUID                                  TYPE      DEVICE
Casa-5G            e6e1f0a1-9c31-4a86-8f5d-2b3a7d0c9e12  wifi      wlan0
Wi-Fi do trabalho  89a1b2c3-d4e5-4f67-8a9b-0c1d2e3f4a5b  wifi      --
```

Cada item dessa lista na GUI corresponde a uma linha dessa tabela. O que você clicar e editar ali altera o mesmo arquivo `.nmconnection` que vimos na [seção sobre Wi-Fi](#/cap-023/sec-02), só que sem tocar no terminal.

## A aba "Conexões" em detalhes

Selecione a rede `Casa-5G` e clique em editar. Você verá abas como **Geral**, **Wi-Fi**, **Wi-Fi Security**, **IPv4** e **IPv6**. Os campos mais úteis estão longe do alcance do clique rápido:

- Na aba **Geral**, o campo "Conectar automaticamente" e a "Prioridade de conexão" controlam quando essa rede é usada.
- Na aba **Wi-Fi Security**, a senha aparece mascarada, e é onde você a troca.
- Na aba **IPv4**, o método "Automático (DHCP)" pode virar "Manual" para o IP fixo da [seção sobre IP fixo](#/cap-023/sec-06).

:::nota
A "Prioridade de conexão" é um número inteiro: quanto **maior**, mais preferida é a rede diante das demais. Se você tem duas redes salvas que se sobrepõem (a sua casa e o Wi-Fi do vizinho com sinal que invade), a de maior prioridade vence quando as duas estão disponíveis.
:::

## Impedindo conexões automáticas indesejadas

Um comportamento clássico: o Deck se conecta sozinho ao Wi-Fi da cafeteria ou a um vizinho só porque a rede já foi usada uma vez. Isso acontece porque o perfil tem "Conectar automaticamente" marcado. Para evitar, é só desmarcar essa opção na aba **Geral** daquela conexão.

O mesmo resultado sai pelo terminal, sem abrir janela alguma:

```terminal
$ nmcli connection modify "Cafeteria-Livre" connection.autoconnect no
$ nmcli connection show "Cafeteria-Livre" | grep autoconnect
connection.autoconnect:                 no
```

A flag `connection.autoconnect` é o campo exato que a caixinha da GUI manipula. Deixá-la em `no` faz a rede continuar salva (para conectar quando você quiser), mas o Deck não pula mais para ela sozinho no meio da noite.

:::dica
Para conferir a prioridade de todas as conexões salvas de uma vez, use `nmcli -f NAME,AUTOCONNECT,PRIORITY connection show`. A coluna `AUTOCONNECT` mostra `yes`/`no` e `PRIORITY` revela a ordem de preferência entre redes.
:::

## A mesma informação, duas visões

A graça da arquitetura do NetworkManager é que a GUI e o `nmcli` são duas janelas para a mesma coisa. Configure a prioridade pelo painel do KDE e veja o reflexo imediato no terminal:

```terminal
$ nmcli -f NAME,AUTOCONNECT,PRIORITY connection show
NAME               AUTOCONNECT  PRIORITY
Casa-5G            yes          100
Wi-Fi do trabalho  yes          0
Cafeteria-Livre    no           -999
Cafeteria-Livre    no           0
```

A `PRIORITY` `100` coloca `Casa-5G` à frente; o padrão é `0`; e `-999` é o valor que o NetworkManager usa internamente para conexões que nunca devem ser escolhidas automaticamente. Isso não é só curiosidade: quando a conexão cai e o Deck "pula" de rede, é essa tabela de prioridades que decide para onde ele vai.

:::info
O applet de rede do KDE é o *plasma-nm*, e ele não implementa nada por conta própria — é um cliente do NetworkManager. Por isso, qualquer perfil criado no `nmcli` aparece instantaneamente na GUI, e vice-versa. Não existe "rede da interface" e "rede do terminal"; é tudo uma rede só.
:::

## Resumo

- O painel de rede do KDE (System Settings → Rede) e o `nmcli` manipulam os mesmos perfis do NetworkManager.
- A aba **Conexões** lista os perfis salvos; a aba **Geral** controla auto-conexão e prioridade.
- "Conectar automaticamente" desmarcado equivale a `connection.autoconnect no` no terminal.
- A prioridade maior vence; `0` é o padrão e `-999` marca conexões que nunca são escolhidas sozinhas.
- A GUI (`plasma-nm`) é um cliente do NetworkManager: mudanças em um lado aparecem no outro na hora.

## Exercícios

1. Abra System Settings → Rede → Conexões e compare a lista com a saída de `nmcli connection show`. Liste quais perfis existem.
2. Escolha uma rede e desmarque "Conectar automaticamente" na GUI; confirme no terminal com `nmcli -f NAME,AUTOCONNECT connection show`.
3. Mude a prioridade de uma conexão pela GUI (campo "Prioridade de conexão") e observe o valor exibido por `nmcli -f NAME,PRIORITY connection show`.
4. Faça o caminho inverso: altere a prioridade com `nmcli connection modify <NOME> connection.autoconnect yes` e veja a caixinha mudar na GUI.
5. **Desafio.** Descubra qual rede o Deck escolheria se duas redes salvas estivessem disponíveis ao mesmo tempo, ajustando prioridades para testar, e explique com base na coluna `PRIORITY`.
