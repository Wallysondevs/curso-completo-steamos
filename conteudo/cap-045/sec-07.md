Se existe um único motivo pelo qual alguém mantém uma partição Windows no SSD do Deck, esse motivo se chama anticheat. EasyAntiCheat (EAC) e BattlEye são os dois sistemas que protegem a maioria dos jogos competitivos — e, até recentemente, ambos bloqueavam Linux por padrão. O cenário mudou, mas não completamente.

:::objetivos
- Entender como o anticheat opera em kernel-space no Windows e em userspace no Linux
- Identificar quais jogos com EAC e BattlEye funcionam no Steam Deck
- Diferenciar suporte nativo Linux do suporte via Proton
- Diagnosticar bloqueios de anticheat nos logs do Proton
- Conhecer os jogos permanentemente inacessíveis e as alternativas
:::

## Kernel-space vs userspace: por que isso importa

No Windows, EAC e BattlEye carregam um driver que roda em *kernel-space* — o nível mais privilegiado do sistema, abaixo até do administrador. Isso permite detectar qualquer outro driver, injeção de DLL ou manipulação de memória. No Linux, não existe equivalente: um driver kernel é específico de cada kernel, e o Proton não pode carregar drivers Windows no kernel Linux.

A solução das empresas foi portar o anticheat para Linux, mas rodando em *userspace* — como processo comum, sem privilégios de kernel. Isso reduz a superfície de detecção, mas é suficiente para a maioria dos cenários. O desenvolvedor do jogo só precisa habilitar o suporte no backend:

```terminal
## Exemplo de log do Proton quando EAC está ativo e funcional
$ PROTON_LOG=1 %command%
$ cat ~/steam-730.log | grep -i eac
[EAC] Loading EasyAntiCheat (Linux native)
[EAC] Initialization successful - client connected
```

Quando o suporte não está habilitado, o log é diferente:

```terminal
$ cat ~/steam-730.log | grep -i eac  
[EAC] EasyAntiCheat not enabled for this title
[EAC] Initialization failed - exiting
```

É essa diferença de uma linha de configuração no servidor que separa um jogo jogável de um jogo bloqueado.

## Jogos com EAC que funcionam

A situação muda rápido. O [Are We Anti-Cheat Yet?](https://areweanticheatyet.com) mantém a lista atualizada. Em março de 2025, o panorama é:

| Jogo | Anticheat | Status no Deck | Notas |
|---|---|---|---|
| Apex Legends | EAC | ✅ Funcional | Suporte Linux nativo habilitado pela Respawn |
| Elden Ring | EAC | ✅ Funcional | EAC moderado; sem restrições no single-player |
| Dead by Daylight | EAC | ✅ Funcional | Habilitado em 2023 |
| Halo: The Master Chief Collection | EAC | ✅ Funcional | Modo single-player sem EAC; multiplayer com EAC Linux |
| Squad | EAC | ✅ Funcional | Suporte Linux desde 2022 |
| War Thunder | EAC | ✅ Funcional | Cliente nativo Linux disponível |
| Fall Guys | EAC | ✅ Funcional | Epic Games habilitou em 2024 |
| The Division 2 | EAC | ✅ Funcional | Ubisoft habilitou no final de 2023 |

## Jogos com BattlEye que funcionam

O BattlEye adicionou suporte Linux em 2020, mas a adoção pelos estúdios é mais lenta:

| Jogo | Anticheat | Status no Deck | Notas |
|---|---|---|---|
| Arma 3 | BattlEye | ✅ Funcional | Suporte Linux desde 2021 |
| DayZ | BattlEye | ✅ Funcional | Suporte Linux desde 2021 |
| Unturned | BattlEye | ✅ Funcional | Suporte nativo |
| Planetside 2 | BattlEye | ✅ Funcional | Habilitado em 2022 |
| Mount & Blade II: Bannerlord | BattlEye | ✅ Funcional | Habilitado em 2023 |
| Ark: Survival Evolved | BattlEye | ✅ Parcial | Single-player funciona; servidores oficiais bloqueados |

## Os bloqueados: Fortnite, Destiny 2 e cia.

Alguns jogos estão permanentemente inacessíveis no Steam Deck, não por limitação técnica, mas por decisão comercial:

- **Fortnite**: A Epic Games declarou publicamente que não habilitará EAC para Linux. O motivo alegado é a baixa base de usuários e a dificuldade de manter integridade competitiva em userspace.
- **Destiny 2**: A Bungie bloqueia explicitamente Linux; rodar o jogo via Proton resulta em banimento, mesmo sem tentativa de burla.
- **Rainbow Six Siege**: A Ubisoft não habilitou BattlEye Linux e não tem planos anunciados.
- **Call of Duty (Warzone)**: Ricochet (anticheat proprietário) não tem suporte Linux e dificilmente terá.
- **FIFA/EA Sports FC**: O anticheat da EA (EA AntiCheat) não suporta Linux.
- **Genshin Impact**: O anticheat da HoYoverse (`mhyprot2.sys`) é kernel-level e não roda no Proton desde o patch 3.8.

:::perigo
Tentar burlar anticheat com patches de terceiros, kernels modificados ou máquinas virtuais com GPU passthrough é contra os ToS de todos os jogos citados e resulta em banimento permanente e irreversível. A única forma segura de jogar esses títulos é via dual boot com Windows.
:::

## Como diagnosticar problemas de anticheat

Quando um jogo não abre, crasha na tela de carregamento ou fecha após o splash screen, o anticheat é um dos primeiros suspeitos. O Proton pode gerar logs detalhados:

```terminal
$ PROTON_LOG=1 steam steam://run/1085660
## Jogue por alguns segundos ou espere o crash
$ cat ~/steam-1085660.log | grep -i -E 'anticheat|eac|battleye|blocked|denied'
```

Se o log contiver `"not enabled for this title"`, o problema é o desenvolvedor não ter habilitado. Se contiver `"driver load failed"`, é o anticheat tentando carregar um driver kernel que não existe no Linux. Ambos são definitivos — não há solução do lado do usuário.

Para jogos que deveriam funcionar mas não funcionam, verifique:

```terminal
## 1. O Proton Experimental está atualizado?
$ ls -la ~/.steam/steam/steamapps/common/Proton\ -\ Experimental/

## 2. O prefixo não está corrompido?
$ protontricks -c 'wine control' APPID

## 3. A versão do Proton é a correta? (alguns jogos exigem Proton específico)
$ grep "Proton:" ~/steam-APPID.log | head -1
Proton: 9.0-3
```

## O futuro: anticheat em userspace

O Steam Deck vendeu milhões de unidades. Essa base instalada pressiona publishers a habilitarem suporte Linux. Em 2022, apenas ~20% dos jogos com EAC funcionavam no Deck; em 2025, são mais de 60%. A tendência é de melhora contínua, mas os blockbusters da Epic, Bungie e Activision provavelmente permanecerão inacessíveis.

Para jogos single-player com anticheat (Elden Ring, por exemplo), o EAC pode ser contornado com `--eac-launcher` nas opções de inicialização, desabilitando o anticheat e o multiplayer — mas preservando o single-player.

## Resumo

- EAC e BattlEye rodam em kernel-space no Windows; no Linux rodam em userspace, o que reduz a segurança mas permite compatibilidade.
- O suporte depende do desenvolvedor habilitar uma flag no backend; é trivial tecnicamente, mas nem todos o fazem.
- Fortnite, Destiny 2, Rainbow Six Siege e CoD são permanentemente inacessíveis por decisão comercial.
- Diagnostique com `PROTON_LOG=1` e procure por `anticheat`, `eac` ou `battleye` no log.
- A base instalada do Steam Deck está pressionando mais publishers a habilitarem suporte.

## Exercícios

1. Acesse [Are We Anti-Cheat Yet?](https://areweanticheatyet.com) e anote 5 jogos que você possui e cujo status mudou nos últimos 12 meses.
2. Ative `PROTON_LOG=1` para um jogo com EAC funcional e localize as linhas de inicialização do anticheat. Compare com um jogo que você sabe ser bloqueado.
3. Teste Elden Ring com e sem `--eac-launcher`. O que muda no menu principal e no log do Proton?
4. Liste todos os jogos da sua biblioteca Steam que usam anticheat. Quantos funcionam no Deck? Qual a porcentagem?
5. **Desafio.** Pesquise no GitHub do Proton e no bug tracker da Valve issues relacionadas a anticheat para um jogo bloqueado. Resuma o estado atual e as perspectivas de suporte futuro.