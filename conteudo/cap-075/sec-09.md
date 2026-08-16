Toda personalização, uma hora, quebra. A animação some, o som para, o plugin some do menu, ou o SteamOS atualiza e deixa um rastro de incompatibilidade. Esta seção fecha o capítulo com o que a comunidade aprendeu na prática: os sintomas mais comuns, como diagnosticar cada um, os limites do que dá para fazer — e o checklist de boas práticas para quebrar com menos frequência.

:::objetivos
- Diagnosticar os sintomas mais comuns de falha em animações e sons
- Usar logs do Decky e journal do sistema para localizar a causa
- Reverter uma animação que "travou" o boot para tela preta
- Reconhecer os limites do plugin e o caminho de volta ao padrão
:::

## O deck liga e a tela fica preta

É o sintoma mais assustador e, na maioria das vezes, o mais inofensivo. A sequência típica: você instalou uma animação malformada, o gamescope não consegue decodificá-la e, em vez de mostrar o vídeo, mostra nada. O sistema continua bootando normalmente por trás — só o vídeo falhou.

A recuperação não exige reinstalar nada. Entre no modo desktop e remova ou substitua o arquivo problemático:

```terminal
$ ls -la /home/deck/homebrew/plugins/AnimationChanger/animations/deck_startup.webm
$ fsck -n /dev/nvme0n1 2>/dev/null || echo "nada a verificar aqui"
```

O primeiro comando confere se o arquivo existe e seu tamanho. Um `deck_startup.webm` de zero bytes (ou ausente) é o vilão clássico: download interrompido ou cópia truncada. Substitua por um arquivo válido — ou restaure o backup (seção 8) — e o boot volta ao normal.

:::perigo
Se a tela preta persistir **mesmo após** remover a animação, o problema pode ser mais fundo (kernel, driver ou a própria sessão Steam). Nesse caso, a recuperação é pela restauração do SteamOS ou pelo modo de recuperação (boot com volume + energia), não é culpa do plugin. Não confunda os dois cenários: animação quebrada = tela preta no vídeo, sistema saudável; sistema quebrado = tela preta em tudo, inclusive no desktop.
:::

## O plugin sumiu do menu

Um dia o Animation Changer simplesmente não está mais na lista do Decky. As causas seguem a cadeia de dependência da seção 1:

1. **Decky sumiu** — o `plugin_loader` não foi reinjetado após uma atualização do Steam. Solução: reexecutar o instalador do Decky.
2. **Decky está lá, o plugin não** — o Animation Changer ficou incompatível com esta versão do SteamOS. O Decky o esconde ou marca como quebrado.
3. **A pasta do plugin sumiu** — apagada por engano ou por um reset.

O diagnóstico começa no serviço e na pasta:

```terminal
$ systemctl --user status plugin_loader 2>/dev/null || systemctl status plugin_loader
$ ls ~/homebrew/plugins/ | grep -i animation
AnimationChanger
```

Se o serviço não está `active`, o problema é o Decky (camada 1). Se o serviço está ativo mas a pasta não existe, o plugin foi removido (camada 2). Se ambos existem e ainda não aparece no menu, há incompatibilidade de versão — procure a versão do plugin que casa com sua release do SteamOS.

:::info
O SteamOS usa atualizações imutáveis da Valve. Quando uma atualização grande chega, os plugins do Decky que tocam o sistema (como o Animation Changer e sua flag `root`) costumam quebrar juntos, até os mantenedores lançarem compatibilidade. A atualização do Decky vem pelo próprio Decky, não pela loja da Valve.
:::

## O som parou de tocar

O canal de som é o que costuma quebrar de forma mais silenciosa — sem erro visível, só o silêncio. O diagnóstico segue uma ordem:

```terminal
$ ls -la ~/homebrew/plugins/AnimationChanger/sounds/
$ ffprobe -v error -show_entries stream=codec_name,sample_rate \
    -of default=noprint_wrappers=1 ~/homebrew/plugins/AnimationChanger/sounds/select.wav
```

Primeiro, o arquivo existe e tem tamanho razoável? Segundo, o `ffprobe` reporta um codec legível (WAV é o mais seguro, visto na seção 5)? Se o arquivo é um WAV em `pcm_s24le` ou tem sample rate exótico, é o candidato número um.

A terceira verificação é o roteamento de áudio: o boot sound pode estar saindo pelo alto-falante enquanto você espera ouvir nos fones, como explicado na seção 5.

```terminal
$ pactl list sinks short
41	alsa_output.pci-0000_04_00.6.analog-stereo	PipeWire	s16le 2ch 44100Hz	RUNNING
```

O `RUNNING` vs `SUSPENDED` aqui indica qual sink está ativo. Se há um fone Bluetooth conectado e o sink ativo é o alto-falante, o som de boot saiu pelo lugar errado.

## Lendo os logs do Decky

Quando a interface não dá pistas, os logs falam. O Decky guarda logs próprios em `~/homebrew/logs/`:

```terminal
$ ls -la ~/homebrew/logs/
-rw-r--r-- 1 deck deck 24576 Mar  1 12:00 plugin_loader.log
$ tail -30 ~/homebrew/logs/plugin_loader.log
```

O `plugin_loader.log` registra o ciclo de vida do Decky e dos plugins. Erros de carregamento do Animation Changer, incompatibilidades de API e exceções Python aparecem aqui com stack trace — informação de ouro para quem quer entender (ou reportar) a falha.

```terminal
$ journalctl --user -b | grep -i -E 'decky|animation|plugin' | tail -30
```

O `journalctl` do usuário complementa: filtra as mensagens da sessão atual (`-b`) que mencionam o plugin. Juntos, log do Decky + journal dão o quadro completo: o que o plugin tentou fazer, quando, e o que o sistema respondeu.

:::dica
Ao reportar um problema no GitHub do Animation Changer, anexe os dois: `~/homebrew/logs/plugin_loader.log` e o trecho relevante do `journalctl --user`. Mantenedores conseguem identificar a causa com muito mais precisão do que com "não funciona".
:::

## Limites do que dá para personalizar

O capítulo inteiro girou em torno do que *dá* para fazer. Vale fechar com o que **não** dá:

- **Logo do firmware (UEFI/BIOS)** — o primeiro frame após o botão de energia. Não é afetado por plugin algum.
- **Som de inicialização do firmware** — idem, pertence à placa, não ao SO.
- **Animações dentro de jogos** — o plugin só toca a interface do SteamOS, nunca o conteúdo de um jogo.
- **Temas de interface visual** (botões, cores, fontes) — isso é outro plugin do Decky (CSS Loader), não o Animation Changer.

Confundir esses limites leva a expectativas erradas — e a diagnosticar como "bug do plugin" algo que nunca esteve no escopo dele.

## O caminho de volta ao padrão

Tudo que é personalizável pode, e deve, poder voltar ao padrão. O Animation Changer expõe isso como "restaurar tema padrão" na interface; manualmente, é apagar o que aponta para seus arquivos:

```terminal
$ rm ~/homebrew/plugins/AnimationChanger/animations/deck_startup.webm
$ rm ~/homebrew/plugins/AnimationChanger/animations/sleep.webm
$ rm ~/homebrew/plugins/AnimationChanger/animations/resume.webm
```

Sem os arquivos e sem uma configuração que aponte para eles, o SteamOS volta ao vídeo padrão da Valve no próximo boot. A ordem importa pare: remova/configuração primeiro (para não deixar o sistema apontando para um arquivo inexistente), depois os arquivos.

:::atencao
Antes de remover, tenha certeza de que é isso que você quer. Faça o backup da seção 8 primeiro. O padrão da Valve pode ser restaurado a qualquer momento, mas sua coleção pessoal — uma vez apagada sem backup — não volta.
:::

## Resumo

- Tela preta no boot após trocar animação quase sempre é arquivo de vídeo malformado, não sistema quebrado.
- Plugin sumindo segue a cadeia de dependência: checar serviço `plugin_loader`, depois a pasta do plugin.
- Som mudo se diagnostica na ordem: arquivo existe → codec legível → roteamento de saída correto.
- `~/homebrew/logs/plugin_loader.log` e `journalctl --user` são as fontes de verdade quando a interface cala.
- O plugin não toca firmware, jogos ou temas visuais de interface — são limites de escopo, não bugs.
- Voltar ao padrão é remover configuração e arquivos; sempre com backup prévio.

## Exercícios

1. Reproduza (de propósito) o cenário de tela preta: substitua o `deck_startup.webm` por um arquivo vazio, reinicie, e observe o que acontece. Depois, restaure o arquivo válido e confirme a recuperação.
2. Verifique o estado atual da sua cadeia: `systemctl status plugin_loader` e `ls ~/homebrew/plugins/`. Cada elo está íntegro? Documente o resultado.
3. Quebre o som de seleção de propósito (substitua `select.wav` por um WAV inválido), diagnostique com `ffprobe`, e conserte. Que erro o `ffprobe` reportou?
4. Leia as últimas 30 linhas de `~/homebrew/logs/plugin_loader.log` e identifique, se houver, qualquer erro ou aviso. Conseguiria explicar o que ele significa?
5. **Desafio.** Simule uma atualização do SteamOS que "quebrou" o plugin: renomeie a pasta `AnimationChanger/`, depois registre passo a passo como você diagnosticaria (logs, journal) e recuperaria (reinstalar, restaurar backup, reconfigure) sem reinstalar o Decky. Escreva o procedimento como um runbook reutilizável.