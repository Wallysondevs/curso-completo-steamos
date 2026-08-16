Ligar um Steam Deck pela primeira vez é diferente de ligar um PC comum: a máquina já vem com o SteamOS instalado, particionado e pronto, e a sequência inicial de configuração é conduzida por um assistente gráfico. Mesmo assim, vale entender o que acontece por baixo de cada tela, porque é aí que nascem os primeiros problemas (Wi-Fi que não conecta, relógio errado, partição cheia). Os comandos de terminal desta etapa são a sua janela para inspecionar o estado real do sistema depois que o assistente termina.

:::objetivos
- Entender o que acontece durante a primeira carga do Steam Deck
- Inspecionar o estado do sistema recém-ligado com comandos básicos
- Identificar versão, hostname e hardware em uso
- Verificar se o relógio e o fuso horário ficaram corretos
- Saber como reiniciar o assistente de configuração caso ele falhe
:::

## Primeira carga e primeiros sinais

O Steam Deck usa um modo de espera agressivo: quando você segura o botão de energia, a máquina pode não desligar de fato, apenas suspender. Na primeira vez, o ideal é ter certeza de que houve uma **inicialização fria** — a bateria foi drenada ou o aparelho desligou por completo. O sinal de que o kernel subiu do zero é a mensagem de boot, invisível na tela de fábrica, mas registrada no buffer do kernel.

Depois que o assistente gráfico termina e você cai na interface do modo *Gaming* (ou *Desktop*), o terminal vira o instrumento de inspeção. A primeira pergunta a responder é: qual SteamOS está rodando de verdade aqui?

```terminal
$ cat /etc/os-release
NAME="SteamOS"
VERSION="3.6.20"
ID="steamos"
ID_LIKE="arch"
PRETTY_NAME="SteamOS 3.6.20"
VERSION_ID="3.6.20"
HOME_URL="https://www.steamdeck.com/"
```

Repare no campo `ID_LIKE="arch"`: o SteamOS atual é construído sobre Arch Linux, não sobre Ubuntu. Isso importa porque os comandos de gerenciamento de pacotes (`pacman` em vez de `apt`) e o layout de alguns arquivos de configuração seguem a convenção do Arch. Outra leitura confirma a base e o kernel:

```terminal
$ hostnamectl
 Static hostname: steamdeck
       Icon name: computer-handheld
         Machine ID: 8b9c2f1d6e4a4f2b8c1d9e0f3a5b7c6d
           Boot ID: 1a2b3c4d5e6f7a8b9c0d1e2f3a4b5c6d
  Operating System: SteamOS 3.6.20
            Kernel: Linux 6.5.0-valve21-1-neptune-65
      Architecture: x86-64
```

O hostname padrão é `steamdeck`. O `Machine ID` é um identificador persistente que sobrevive a reinstalações do sistema se a partição de dados for preservada; ele identifica *esta* unidade física, não o usuário. O `Kernel` aparece com o sufixo `-neptune`, nome interno que a Valve dá à árvore de kernel que mantém com os patches específicos do APU (a plataforma AMD customizada do Deck).

## O que o assistente já configurou

O assistente de primeira execução do SteamOS guia por idioma, rede e conta Steam. Cada escolha grava configurações em lugares determinados. Vale localizá-las para saber onde mexer depois:

| Configuração | Arquivo ou diretório | O que guarda |
|---|---|---|
| Idioma da interface | `~/.steam/` e arquivos de locale | Idioma do modo Gaming e do desktop |
| Fuso horário | `/etc/localtime` | Symlink para a zona escolhida |
| Relógio | Relógio de hardware (RTC) via `timedatectl` | Hora do sistema e do hardware |
| Rede Wi-Fi | NetworkManager (`nmcli`) | SSID e senha do ponto de acesso |
| Conta Steam | `~/.steam/steam/` | Credenciais e configurações do cliente |

O ponto de partida para verificar fuso e relógio é o `timedatectl`, que mostra o estado consolidado:

```terminal
$ timedatectl
               Local time: Sat 2025-08-16 14:22:31 -03
           Universal time: Sat 2025-08-16 17:22:31 UTC
                 RTC time: Sat 2025-08-16 17:22:31
                Time zone: America/Sao_Paulo (-03, -0300)
System clock synchronized: yes
              NTP service: active
          RTC in local TZ: no
```

A linha `Time zone` precisa refletir o fuso escolhido no assistente. Se o Deck veio de fábrica com fuso de outro país (comum em unidades importadas), o relógio exibirá a hora errada mesmo depois de acertar manualmente, porque o `System clock synchronized` só corrige quando o NTP está ativo e há rede. No SteamOS 3.6, o NTP costuma vir ativo por padrão, mas depende de conexão.

:::nota
O Steam Deck não tem bateria de relógio (RTC alimentado por bateria) como um desktop; o RTC é mantido pela carga principal. Após longo tempo desligado, a hora pode começar errada até o NTP sincronizar. É um comportamento esperado, não um defeito.
:::

## Confirmando que o boot veio do zero

Para distinguir uma inicialização fria de um "acordar" da suspensão, o `journalctl` expõe o histórico de boots. Cada vez que o kernel sobe de verdade, um novo boot ID é registrado:

```terminal
$ journalctl --list-boots | tail -3
-2 3c9b7d1a5e2f4a6b8c0d1e2f3a4b5c6d Sat 2025-07-28 09:11:02 -03 Sat 2025-07-28 18:40:55 -03
-1 5f8a2b3c4d5e6f7a8b9c0d1e2f3a4b5c Mon 2025-08-11 20:03:17 -03 Mon 2025-08-11 20:04:02 -03
 0 7d4e5f6a7b8c9d0e1f2a3b4c5d6e7f8a Sat 2025-08-16 13:58:44 -03 Sat 2025-08-16 14:22:31 -03
```

O boot `0` é o atual. A duração curta do boot `-1` (menos de um minuto) sugere uma inicialização que foi imediatamente suspensa ou reiniciada, algo comum durante a configuração inicial. Ver o tempo de subida do kernel ajuda a separar o que é lento no sistema do que é lento na interface:

```terminal
$ systemd-analyze
Startup finished in 2.418s (kernel) + 3.912s (userspace) = 6.330s
```

Num Deck com SSD, valores de 4 a 10 segundos são o esperado. Tempos de `kernel` muito acima disso costumam apontar para detecção lenta de hardware (um SSD problemático ou um periférico USB preso durante o probe).

:::dica
Se o assistente de primeiro uso travar ou fechar sozinho, você não precisa reinstalar nada. A Valve fornece um comando que reexibe o assistente: `steamos-session-select` alterna entre os modos, e há também o `steam` reexecutado após limpar configurações. Reinicar o Deck com energia conectada e rodar `journalctl -b -p err` em seguida mostra os erros que travaram a sessão.
:::

## Resumo

- O SteamOS 3.6 é construído sobre Arch Linux (`ID_LIKE="arch"`), com kernel `-neptune` customizado pela Valve.
- `hostnamectl` mostra hostname (`steamdeck`), Machine ID, kernel e arquitetura do aparelho.
- O assistente grava idioma, fuso, rede e conta em locais previsíveis do sistema.
- `timedatectl` consolida hora local, UTC, RTC, fuso e estado do NTP em uma leitura só.
- `journalctl --list-boots` separa inicializações frias de retomadas de suspensão, e `systemd-analyze` mede o tempo de subida.

## Exercícios

1. Rode `cat /etc/os-release` e `hostnamectl`. Anote a versão do SteamOS e o kernel exibidos na sua máquina.
2. Execute `timedatectl` e confirme se o campo `Time zone` corresponde ao seu fuso. Se não corresponder, descreva qual comando o corrigiria.
3. Liste os últimos três boots com `journalctl --list-boots`. Identifique qual é o atual e quanto tempo durou o anterior.
4. Meça o tempo de inicialização com `systemd-analyze`. O valor de `kernel` está dentro da faixa esperada para um SSD?
5. **Desafio.** Compare `cat /etc/os-release` com o que você conhece de uma distribuição Ubuntu (campo `ID`), e explique, a partir do campo `ID_LIKE`, por que o gerenciador de pacotes no SteamOS é `pacman` e não `apt`.
