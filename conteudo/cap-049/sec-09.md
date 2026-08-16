Ter cada emulador configurado individualmente é o passo técnico; integrá-los à biblioteca Steam é o passo de uso. Quando os jogos aparecem lado a lado com os títulos nativos, com capas e atalhos de um clique, a emulação vira parte orgânica do Deck. Esta seção fecha o capítulo com o fluxo completo: do emulador standalone à biblioteca Steam, passando por saves, updates e a manutenção que mantém tudo rodando.

:::objetivos
- Adicionar emuladores standalone como atalhos na biblioteca Steam
- Organizar saves e states entre emuladores
- Manter emuladores atualizados e estáveis no Flatpak
- Montar um checklist diagnóstico quando algo quebra
- Consolidar o conhecimento do capítulo num fluxo prático final
:::

## Adicionando emuladores à biblioteca Steam

O Steam ROM Manager (SRM, assunto do capítulo 51) faz isso em massa, mas você pode adicionar qualquer emulador manualmente em *Add a Non-Steam Game → Browse*. O que você aponta é o executável do Flatpak, que fica num caminho exportado.

Por que adicionar o emulador à Steam? Porque o modo Gaming do Deck só vê aplicações Steam — se você quiser trocar de emulador sem voltar toda hora para o modo Desktop, o atalho da Steam é a ponte que conecta o Gaming aos emuladores. É uma etapa que a comunidade de Deck repete com cada newbie, e dominá-la manualmente te liberta de depender do EmuDeck para sempre.

```terminal
$ which flatpak
$ flatpak list --app --columns=application
net.pcsx2.PCSX2
net.rpcs3.RPCS3
org.DolphinEmu.dolphin-emu
net.kuribo64.cemu
app.xemu.xemu
```

No Steam, o lançador fica assim (exemplo com PCSX2):

```ini
[Shortcut]
Target: /usr/bin/flatpak
LaunchOptions: run net.pcsx2.PCSX2
```

A linha `Target` aponta para o executável `flatpak` do sistema, e `LaunchOptions` contém o comando `run` + o ID da aplicação. Isso funciona porque o Steam executa um binário; o Flatpak é o binário, e o parâmetro diz qual app rodar. A mesma técnica funciona para qualquer Flatpak — navegador, editor, utilitário — mas nos emuladores ela é especialmente útil.

:::dica
Para abrir um jogo específico direto, passe o caminho da ROM no LaunchOptions: `flatpak run net.pcsx2.PCSX2 /home/ana/Emulation/roms/ps2/meujogo.iso`. O emulador pula a tela de lista e boota direto. Esse é o truque que o Steam ROM Manager aplica em lote, e saber fazê-lo manualmente te ajuda a depurar quando um atalho automático quebra.
:::

## Saves, states e a troca entre emuladores

Cada emulador guarda saves e save states em lugares diferentes dentro de `~/.var/app/`. Para backup ou migração, você precisa saber onde cada um põe seus arquivos — a pior surpresa é descobrir, depois de formatar, que o save de 60 horas de um RPG não estava onde você achava.

```terminal
$ find ~/.var/app/ -name '*.sav' -o -name '*.state' | head -10
/home/ana/.var/app/net.pcsx2.PCSX2/config/PCSX2/memcards/Mcd001.ps2
/home/ana/.var/app/org.DolphinEmu.dolphin-emu/data/dolphin-emu/GC/USA/Card A/
```

| Emulador | Tipo de save | Local |
|---|---|---|
| PCSX2 | Memory card (Mcd001.ps2) | `~/.var/app/.../config/PCSX2/memcards/` |
| Dolphin | GCI Folder (GameCube) / title (Wii) | `~/.var/app/.../data/dolphin-emu/` |
| RPCS3 | save no dev_hdd0 | `~/.var/app/.../config/rpcs3/dev_hdd0/home/` |
| Cemu | save no mlc01 | `~/.var/app/.../data/cemu/mlc01/` |
| Xemu | disco virtual inteiro | `~/.var/app/.../data/xemu/` |

:::info
O PCSX2 e o Dolphin permitem trocar saves com o console real (via GCI no Dolphin, via ferramenta de memory card no PCSX2). No RPCS3 e Cemu, os saves funcionam mas o formato é fechado e não há interoperabilidade fácil com o PS3/Wii U físico.
:::

## Mantendo emuladores atualizados

Flatpak facilita a atualização sem perder configuração. A atualização substitui o pacote, mas não toca nos dados em `~/.var/app/`:

```terminal
$ flatpak update -y
```

Só há uma exceção: quando a versão nova muda o formato de cache (shaders do Cemu, principalmente), o cache antigo é ignorado e o stutter volta por uma execução. Isso é esperado e temporário.

:::perigo
Antes de atualizar um emulador, faça backup dos saves: copie a pasta de dados para `~/Backup/` ou sincronize com um serviço em nuvem. Embora o Flatpak preserve os dados, bugs de versão podem corromper saves, e a única defesa real é a cópia externa.
:::

## Checklist de diagnóstico

Quando algo para de funcionar, siga esta ordem de verificação:

1. **BIOS/firmware**: Confira se a BIOS ainda está no lugar esperado (`ls` no diretório correto).
2. **Permissão do Flatpak**: Certos emuladores perdem acesso a pastas externas; use `flatpak override` para conceder.
3. **Cache corrompido**: Delete o `shaderCache` (Cemu) ou o `cache` (RPCS3) e deixe o emulador reconstruir.
4. **ROM íntegra**: Recalcule o arquivo com o formato original; `.chd`, `.rvz` e `.iso` podem sofrer corrupção silenciosa.
5. **Versão do Flatpak**: Confirme com `flatpak list` se a versão mudou recentemente e busque problemas conhecidos.

```terminal
$ flatpak override --user --filesystem=/home/ana/Emulation/ net.pcsx2.PCSX2
```

O comando de *override* acima concede acesso de leitura ao emulador a toda a pasta `Emulation`, resolvendo a maioria dos erros de "não encontrou ROM" ou "não encontrou BIOS".

## Resumo

- Emuladores standalone podem ser lançados direto da Steam com `flatpak run` + ID da aplicação.
- Cada emulador guarda saves em local diferente; mapeie-os antes de precisar do backup.
- Flatpak atualiza sem perder dados, mas caches de shaders podem ser invalidados.
- O checklist em cinco passos cobre BIOS ausente, permissão, cache, ROM íntegra e versão.
- O fluxo final é: emulador configurado → ROM + BIOS no lugar → atalho Steam → jogo a um clique.

## Exercícios

1. Adicione o PCSX2 como atalho na biblioteca Steam e confirme que ele abre pelo modo Gaming.
2. Crie um atalho que boot um jogo específico direto (sem a tela de lista).
3. Faça um backup dos seus saves usando `tar` na pasta de dados de um emulador e verifique a integridade.
4. Atualize todos os Flatpaks e confirme se algum cache de shader foi invalidado na execução seguinte.
5. **Desafio.** Escreva um script de checkpoint que percorra todos os seis emuladores, liste os saves ativos e grave uma cópia em `~/Backup/` com data. Explique por que o formato de cada save (memory card, GCI, disco virtual) pede uma estratégia de backup diferente.