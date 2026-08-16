Os ajustes feitos no Smokeless UMAF persistem, mas todo o resto — o que o RyzenAdj aplica — some ao reiniciar. E ter um único perfil fixo nem sempre é o ideal: você pode querer um perfil "economia" para viagens longas, um "performance" para dock ligado à TV e um "balanceado" para jogar no sofá. Esta seção mostra como gravar, alternar e automatizar perfis de APU tuning no SteamOS.

:::objetivos
- Criar scripts reutilizáveis para aplicar perfis de potência via RyzenAdj
- Configurar um serviço systemd que aplica o perfil no boot
- Alternar entre perfis via botões do Steam Deck ou atalhos
- Integrar os scripts com o Game Mode para trocar automaticamente ao conectar ao dock
:::

## Scripts de perfil

Cada perfil é um script shell que chama o RyzenAdj com os parâmetros adequados. A estrutura de diretório sugerida:

```terminal
$ mkdir -p ~/lab/perfis
$ ls ~/lab/perfis/
economia.sh   balanceado.sh   performance.sh   dock.sh
```

Exemplo do perfil economia (PPT 10 W, undervolt leve, silencioso):

```bash
#!/bin/bash
# Perfil: economia — autonomia máxima, silêncio total
RYZENADJ=~/lab/ryzenadj/ryzenadj
sudo $RYZENADJ \
    --stapm-limit=10000 \
    --slow-limit=10000 \
    --fast-limit=15000 \
    --tctl-temp=85
echo "economia aplicado" >> /tmp/perfil.log
```

E o perfil performance (PPT 22 W, teto de temperatura elevado):

```bash
#!/bin/bash
# Perfil: performance — dock ou modo turbo
RYZENADJ=~/lab/ryzenadj/ryzenadj
sudo $RYZENADJ \
    --stapm-limit=22000 \
    --slow-limit=22000 \
    --fast-limit=25000 \
    --vrm-current=130000 \
    --vrmmax-current=180000 \
    --tctl-temp=95
echo "performance aplicado" >> /tmp/perfil.log
```

E o balanceado (meio-termo — PPT 18 W, undervolt moderado, uso diário):

```bash
#!/bin/bash
# Perfil: balanceado — uso portátil com ganho moderado
RYZENADJ=~/lab/ryzenadj/ryzenadj
sudo $RYZENADJ \
    --stapm-limit=18000 \
    --slow-limit=18000 \
    --fast-limit=22000 \
    --vrm-current=110000 \
    --vrmmax-current=165000 \
    --tctl-temp=90
echo "balanceado aplicado" >> /tmp/perfil.log
```

Crie também um `default.sh` que reaplica os valores que você gravou no Smokeless UMAF (para voltar à linha de base). Dê permissão de execução:

```terminal
$ chmod +x ~/lab/perfis/*.sh
$ ~/lab/perfis/economia.sh
$ ryzenadj -i | grep STAPM
STAPM LIMIT: 10.000 W
$ ~/lab/perfis/performance.sh
$ ryzenadj -i | grep STAPM
STAPM LIMIT: 22.000 W
```

## Serviço systemd no boot

Para aplicar o perfil assim que o SteamOS terminar de carregar, crie um serviço systemd de usuário:

```ini
# ~/.config/systemd/user/ryzen-perfil.service
[Unit]
Description=Aplica perfil de APU tuning no boot
After=multi-user.target

[Service]
Type=oneshot
ExecStart=/home/deck/lab/perfis/balanceado.sh
StandardOutput=journal

[Install]
WantedBy=default.target
```

Ative-o:

```terminal
$ systemctl --user daemon-reload
$ systemctl --user enable ryzen-perfil.service
$ systemctl --user start ryzen-perfil.service
$ systemctl --user status ryzen-perfil.service
● ryzen-perfil.service - Aplica perfil de APU tuning no boot
     Loaded: loaded (/home/deck/.config/systemd/user/ryzen-perfil.service; enabled)
     Active: inactive (dead) since Sat 2025-01-12 10:45:00 UTC; 3s ago
```

O status `inactive (dead)` em `oneshot` é normal depois de executar: o serviço rodou e terminou.

:::atencao
O SteamOS recarrega o sistema de arquivos imutável a cada atualização, mas `/home` sobrevive. Os arquivos em `~/.config/systemd/user` e `~/lab/perfis` persistem entre atualizações do sistema.
:::

## Alternando perfis no Game Mode

O Steam Deck não tem interface nativa para alternar scripts, mas você pode usar o atalho de teclado do Game Mode — Steam + botão para abrir o menu lateral e disparar um script via um comando configurado no menu de atalhos do Deck (QAM). Para algo mais integrado, crie um pequeno serviço de alternância:

```bash
#!/bin/bash
# ~/lab/perfis/trocar.sh — roda no terminal ou via SSH
case "$1" in
  eco)  ~/lab/perfis/economia.sh ;;
  bal)  ~/lab/perfis/balanceado.sh ;;
  perf) ~/lab/perfis/performance.sh ;;
  dock) ~/lab/perfis/dock.sh ;;
  *)    echo "Uso: trocar.sh [eco|bal|perf|dock]" ;;
esac
```

Se você tem um teclado Bluetooth conectado ao Deck, pode alternar rapidamente via terminal. Via SSH a partir de outro computador, a mesma coisa.

## Automatizando com dock: gatilho udev

O Steam Deck detecta o dock USB-C como um dispositivo USB. É possível criar uma regra udev que troca o perfil automaticamente quando o dock é conectado:

```terminal
$ lsusb | grep -i dock
Bus 003 Device 002: ID 0bda:5420 Realtek Semiconductor Corp. Steam Deck Dock
```

Com o ID do dispositivo, crie uma regra:

```bash
# /etc/udev/rules.d/99-steamdock-perf.rules
ACTION=="add", SUBSYSTEM=="usb", ATTRS{idVendor}=="0bda", ATTRS{idProduct}=="5420", RUN+="/home/deck/lab/perfis/dock.sh"
ACTION=="remove", SUBSYSTEM=="usb", ENV{PRODUCT}=="bda/5420/*", RUN+="/home/deck/lab/perfis/balanceado.sh"
```

No SteamOS imutável, modificar `/etc/udev/rules.d` exige `sudo steamos-readonly disable`, mas a regra persiste. Teste com `sudo udevadm control --reload-rules && sudo udevadm trigger`.

:::perigo
Regras udev executam como root. Um erro no script (loop infinito, comando bloqueante) pode travar o hotplug USB do Deck. Sempre teste o script manualmente antes de vinculá-lo ao udev.
:::

## Resumo

- Scripts shell com RyzenAdj permitem alternar entre perfis de potência sem reiniciar.
- Um serviço systemd de usuário (`oneshot`) aplica o perfil padrão no boot.
- Perfis podem ser alternados via terminal, SSH ou gatilhos de dock com regras udev.
- `/home` sobrevive a atualizações do SteamOS; coloque todos os scripts e configurações lá.
- Regras udev rodam como root — teste scripts isoladamente antes de atrelar ao hotplug.

## Exercícios

1. Crie os três scripts de perfil (economia, balanceado, performance) em `~/lab/perfis/` e teste cada um manualmente com `ryzenadj -i` para confirmar que os valores foram aplicados.
2. Configure e ative o serviço systemd que aplica o perfil balanceado no boot. Reinicie o Deck e confirme com `ryzenadj -i`.
3. Crie um alias no `~/.bashrc` para `trocar.sh` e use-o para alternar entre perfis sem digitar o caminho completo.
4. Conecte um dock USB-C e identifique o `idVendor`/`idProduct` dele via `lsusb`. Crie a regra udev para trocar automaticamente para o perfil performance.
5. **Desafio.** Projete um mecanismo de "fallback seguro": se o perfil performance for aplicado e a temperatura da APU ultrapassar 90°C por mais de 30 segundos, um script deve automaticamente degradar para o perfil balanceado. Esboce a lógica (não precisa implementar) e explique quais ferramentas do SteamOS você usaria para monitorar temperatura.