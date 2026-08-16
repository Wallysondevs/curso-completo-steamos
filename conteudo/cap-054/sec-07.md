Conquistas mudaram a forma como jogamos clássicos: voltamos a zerar, a correr por tempo, a caçar colecionáveis. O RetroAchievements traz isso para os emuladores — e está profundamente integrado ao RetroArch e ao EmuDeck no Steam Deck. E há um detalhe importante: muitas conquistas são *incompatíveis* com ROM hacks.

:::objetivos
- Criar conta no RetroAchievements e configurar credenciais no RetroArch
- Ativar o hardcore mode e entender suas restrições
- Entender por que ROM hacks quebram a verificabilidade de conquistas
- Alternar entre "jogar por conquistas" e "jogar com hacks"
- Configurar por-core e por-jogo as preferências de conquistas

:::

## O que é o RetroAchievements

O RetroAchievements (RA) é um serviço comunitário que adiciona conquistas a jogos retrô, com suporte a dezenas de sistemas (NES, SNES, Genesis, GB/GBA, PS1, N64, e muitos mais). As conquistas são definidas pela comunidade e verificadas em tempo real pelo emulador, que reporta eventos de memória ao servidor.

No Steam Deck, o suporte é nativo nos cores libretro (via RetroArch) e também em emuladores standalone (DuckStation, Dolphin, PPSSPP, entre outros) que implementam o protocolo.

## Configurando no RetroArch/EmuDeck

O EmuDeck já instala o RetroArch com suporte a RA. Você só precisa das credenciais:

```terminal
## Edite o config do RetroArch ou use a interface gráfica
$ grep -i "cheevos" ~/.config/retroarch/retroarch.cfg
cheevos_enable = "true"
cheevos_username = "seu_usuario"
cheevos_password = "sua_senha"
```

Pela interface: `Settings → Achievements → Enable Achievements`, preencha usuário/senha da conta RA. O token de API é opcional, mas recomendado (evita armazenar senha e permite chamadas à API).

## Hardcore mode

O modo "hardcore" (hardcore mode) desativa qualquer trapaça que invalidaria a conquista:

- Bloqueia save states e rewind.
- Bloqueia cheats e slow motion.
- Força o jogo a rodar sem assistências.

Se você habilitar hardcore, as conquistas ganham "peso" (são marcadas como hardcore e valem mais no ranking). Por padrão, o RetroArch vem com hardcore *desligado*; ative quando quiser legitimidade total:

```terminal
## Linha correspondente
cheevos_hardcore_mode_enable = "true"
```

Trocar de hardcore para soft no meio do jogo costuma invalidar a sessão — o RA reseta o progresso daquela sessão para evitar trapaça.

## Por que ROM hacks quebram conquistas

As conquistas do RA são definidas contra um checksum específico do ROM (o hash do jogo original). Cada byte importa:

- **ROM hack** → hash diferente → o RA não encontra as conquistas do jogo (ou as associa a um "game" errado).
- **Fantradução** → idem: muda o ROM, muda o hash, as conquistas do jogo original não casam.
- **Patch de qualidade de vida** → idem.

O resultado prático: **se você aplicar qualquer patch num jogo, perde as conquistas daquele jogo** (a menos que a própria comunidade RA tenha criado conquistas para a versão patcheada — o que é raro, mas existe para alguns hacks famosos).

## A escolha: conquistas ou hacks?

É uma decisão de cada sessão:

- Quer caçar conquistas? Jogue o ROM **original** (limpíssimo, checksum No-Intro) com hardcore ativado.
- Quer experimentar um hack/tradução? Aceite que as conquistas daquele jogo não se aplicam (o RA pode mostrar "unsupported" ou simplesmente nenhuma conquista).

Você pode manter os dois: o ROM original na pasta de ROMs para conquistas, e os hacks em pastas/arquivos separados que você só carrega quando quer jogar a versão modificada.

## Configuração por-core e por-jogo

O RA permite granularidade: você pode ter conquistas ativadas globalmente, mas desativadas num core específico, ou regras por jogo:

- **Por core**: `Settings → Achievements` + override de core.
- **Por jogo**: use "Content Directory Overrides" ou os "Game Overrides" do RetroArch.

```terminal
$ ls ~/.config/retroarch/config/
Beetle\ PSX\ HW/     # override do core
Final\ Fantasy\ VII/  # override por conteúdo/jogo
```

Isso permite, por exemplo, deixar conquistas habilitadas no SNES inteiro, mas desligar especificamente para um diretório de hacks.

## Pontos-chave

- RetroAchievements está integrado ao RetroArch/EmuDeck; basta configurar credenciais.
- Hardcore mode desabilita save states/cheats e valida a legitimidade.
- Conquistas casam com o checksum do ROM original; hacks quebram a associação.
- Decida por sessão: ROM original para conquistas, hack para experimentar.
- Use overrides por core/jogo para afinar o comportamento.

## Exercícios

1. Crie uma conta RA, configure no RetroArch e carregue um jogo de SNES para ver as conquistas aparecerem.
2. Ative o hardcore mode e observe o que fica bloqueado (save states, cheats).
3. Aplique um hack a um jogo e confirme que as conquistas não carregam mais; reverta e confirme que voltam.
4. Crie um "directory override" para desativar conquistas apenas numa pasta de hacks.
5. **Desafio.** Encontre na comunidade RA um hack famoso que *tenha* conquistas próprias e jogue-o, comparando o ID de jogo com o original.
