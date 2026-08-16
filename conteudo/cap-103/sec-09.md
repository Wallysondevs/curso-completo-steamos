Esta seção final consolida tudo: uma tabela-mestra que cruza os quatro universos de comandos (Flatpak, systemctl, journalctl e essenciais) e um guia de diagnóstico que parte do sintoma para o comando certo. É a página para colar na parede — quando algo quebrar, você vem aqui, acha o sintoma e encontra a ferramenta.

:::objetivos
- Navegar a tabela consolidada dos comandos mais usados do curso
- Mapear sintomas comuns para a ferramenta de diagnóstico correta
- Encadear Flatpak, systemctl, journalctl e comandos básicos num fluxo de investigação
- Reconhecer a "ordem de ataque" diante de um problema de sistema
- Consolidar o aprendizado com exercícios integrados entre as seções
:::

## A tabela-mestra

Abaixo, o coração do capítulo: os comandos que você vai digitar mais vezes, organizados por domínio e com a ação em uma frase.

| Domínio | Comando | Ação em uma frase |
|---|---|---|
| Flatpak | `flatpak search X` | Encontra o Application ID de um app |
| Flatpak | `flatpak install flathub ID` | Instala um app do Flathub |
| Flatpak | `flatpak list --app` | Lista apps instalados |
| Flatpak | `flatpak update` | Atualiza tudo |
| Flatpak | `flatpak override --show ID` | Audita permissões da sandbox |
| Flatpak | `flatpak uninstall --unused` | Remove runtimes órfãos |
| systemctl | `systemctl status unit` | Estado completo de uma unidade |
| systemctl | `systemctl start/stop unit` | Inicia/para agora |
| systemctl | `systemctl enable --now unit` | Habilita e inicia |
| systemctl | `systemctl mask unit` | Impede início por qualquer via |
| systemctl | `systemctl list-units --failed` | Acha unidades quebradas |
| systemctl | `systemctl daemon-reload` | Recarrega definições de units |
| journalctl | `journalctl -u unit` | Logs de um serviço |
| journalctl | `journalctl -f` | Acompanha em tempo real |
| journalctl | `journalctl -p err -b` | Erros desde o boot |
| journalctl | `journalctl --since "1 hour ago"` | Janela temporal |
| journalctl | `journalctl -k` | Logs do kernel |
| journalctl | `journalctl --vacuum-size=500M` | Limita o tamanho dos logs |
| Essencial | `ls -lh` / `file` | Inspeciona arquivos |
| Essencial | `find . -name "*.log"` | Busca por metadados |
| Essencial | `grep -rn "erro" .` | Busca por conteúdo |
| Essencial | `ps aux --sort=-%mem` | Maiores consumidores de memória |
| Essencial | `ss -tlnp` | Quem escuta em qual porta |
| Essencial | `df -h` / `du -sh` | Espaço em disco |
| Essencial | `chmod` / `chown` | Permissões e donos |
| Essencial | `ip addr` / `ip route` | Endereços e rotas |

:::dica
Imprima ou salve esta tabela. O objetivo de um cheatsheet não é decorar cada flag, mas saber **que o comando existe** e que há uma tabela para consultá-lo. O cérebro guarda o "o quê"; a tabela guarda o "como".
:::

## Do sintoma ao comando

A habilidade mais valiosa não é memorizar comandos, mas mapear um sintoma para a ferramenta certa. A tabela a seguir faz esse roteamento.

| Sintoma | Primeira ferramenta | Próximos passos |
|---|---|---|
| App Flatpak não abre | `flatpak run ID` no terminal | Leia o erro; `flatpak override --show` e `journalctl -f` |
| App não atualiza | `flatpak update` | `flatpak remotes --show-details` e `flatpak history` |
| Serviço caiu | `systemctl status unit` | `journalctl -u unit -n 50` |
| Serviço não sobe no boot | `systemctl is-enabled unit` | `systemctl enable --now unit` |
| Algo está lento | `top` / `htop` | `ps aux --sort=-%cpu`, `df -h` |
| Disco cheio | `df -h` | `du -sh`, `flatpak uninstall --unused`, `journalctl --vacuum` |
| "Permissão negada" | `ls -l arquivo` | `chmod` ou `chown` conforme o caso |
| Porta ocupada | `ss -tlnp` | Identificar PID e decidir entre `kill` ou reconfigurar |
| Rede não funciona | `ip addr` + `ip route` | `ping`, `curl`, `journalctl -u NetworkManager` |
| Boot travou/falhou | `journalctl -b -1` | `journalctl -b -1 -p err` e `systemctl list-units --failed` |

```terminal
$ flatpak run org.mozilla.firefox
error: app/org.mozilla.firefox/x86_64/stable not installed
```

O exemplo mostra o valor de rodar o app pelo terminal: o Flatpak devolve um erro claro — o app não está instalado — em vez do silêncio do ícone que não abre. Parar de clicar e passar a rodar pela linha de comando é metade do amadurecimento em Linux.

## A ordem de ataque

Diante de qualquer "não está funcionando", existe uma sequência mais eficiente que abre-alas de troca de configs às cegas.

1. **Reproduza e capture o erro.** Rode o app ou serviço pelo terminal e copie a mensagem exata. Erro não capturado é tempo perdido.
2. **Olhe o status.** `systemctl status` para serviços, `flatpak run` para apps, `ip addr` para rede.
3. **Leia os logs.** `journalctl -u` ou `journalctl -p err -b` no exato momento da falha.
4. **Isole variáveis.** O problema acompanha o boot (`-b -1`)? Sobe com uma unidade (`enable`)? É permissão (`ls -l`)?
5. **Aja no mínimo necessário.** Um `chmod`, um `enable --now`, um `vacuum`. Evite soluções nucleares.

Aplicada a um sintoma clássico — "o Wi-Fi sumiu depois do update" — a sequência produz uma investigação em três comandos:

```terminal
$ systemctl status NetworkManager
● NetworkManager.service - Network Manager
     Active: active (running) since Fri 2024-12-13 08:22:40 -03

$ ip link
3: wlan0: <NO-CARRIER,BROADCAST,MULTICAST,UP> mtu 1500 qdisc noqueue state DOWN mode DORMANT group default qlen 1000

$ journalctl -u NetworkManager -n 5
dez 13 10:00:02 steamdeck NetworkManager[850]: <warn> device (wlan0): no stored profile for SSID 'Casa'
```

A ordem de ataque conta a história: o serviço está de pé (`active`), mas a interface `wlan0` está `DOWN` com `NO-CARRIER`, e o NetworkManager avisa que não há perfil salvo para a rede "Casa". Conclusão: o update apagou (ou renomeou) o perfil de Wi-Fi — o conserto é reconectar, não reinstalar o sistema.

:::nota
A ordem de ataque é um **método**, não uma lista aleatória. Cada etapa restringe o espaço de hipóteses da próxima. Pular direto para a etapa 5 (a ação) sem passar por 2 e 3 é como trocar o motor porque o carro não pegou — pode resolver, mas quase sempre mascara a causa real.
:::

## Encadeando ferramentas num caso real

Nada ensina como um sintoma completo. O caso: o cliente Steam não abre depois de uma atualização. O fluxo unificado é:

```terminal
$ flatpak run com.valvesoftware.Steam
bwrap: Can't mount proc on /newroot/proc: Operation not permitted

$ systemctl status --user xdg-desktop-portal
● xdg-desktop-portal.service - Portal service
     Active: failed (Result: exit-code)

$ journalctl --user -u xdg-desktop-portal -n 8
dez 13 10:02:01 steamdeck xdg-desktop-portal[3200]: error loading portal config
```

Três domínios em sequência: o `flatpak run` revela que a sandbox não montou `/proc`; o `systemctl status` mostra que o serviço de portais do desktop está falho; o `journalctl` aponta a causa raiz — configuração de portal corrompida. O conserto passa por recriar a configuração, não por reinstalar o Steam às cegas.

:::dica
Repare no padrão: a falha de um componente (o portal) se propaga para outro (o Flatpak) e se manifesta para o usuário como um terceiro (o app não abre). A cadeia `flatpak → systemctl → journalctl` percorre a pilha até a causa raiz. É por isso que estas ferramentas foram agrupadas num capítulo só.
:::

## Resumo

- A tabela-mestra cruza Flatpak, systemctl, journalctl e comandos essenciais em uma página
- O roteamento sintoma→ferramenta é mais útil que memorizar flags individualmente
- A ordem de ataque é: reproduzir, ver status, ler logs, isolar, agir no mínimo
- Rodar apps pelo terminal transforma silêncio em mensagem de erro legível
- Encadear `flatpak run` → `systemctl status` → `journalctl` revela causa raiz de falhas em cascata

## Exercícios

1. Reproduza a tabela-mestra de memória, escrevendo o comando para cada ação sem consultar. Depois compare com a tabela e anote o que falhou.
2. Escolha um sintoma da tabela "do sintoma ao comando" e execute o fluxo completo de três etapas numa falha real ou simulada do seu sistema.
3. Rode um app Flatpak pelo terminal (`flatpak run ID`) e observe a saída. Provoque um erro intencional (ex.: `flatpak run id.inexistente`) e anote a mensagem.
4. Simule uma investigação: pare um serviço, observe `systemctl status`, leia o log com `journalctl -u`, e então restaure com `enable --now`. Documente cada passo.
5. **Desafio.** Crie um "guia de bolso" pessoal: combine as tabelas das nove seções deste capítulo num único documento seu (papel ou arquivo), acrescentando pelo menos três comandos que você usa e que não aparecem aqui. Justifique cada acréscimo.