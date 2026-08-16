Você já ajustou TDP, fixou clock, aplicou undervolt e mediu cada watt. Mas tudo isso some no reboot. Esta seção fecha o ciclo: como gravar seus ajustes para que eles sobrevivam a reinicializações, como criar perfis por jogo e como automatizar decisões de energia para não precisar pensar nelas toda vez.

:::objetivos
- Criar um serviço systemd que aplica ajustes de energia no boot
- Usar os perfis por jogo da Steam para associar TDP a cada título
- Automatizar a escolha de TDP com base no estado da bateria
- Saber os limites da automação e o que ainda exige intervenção manual
:::

## O perfil por jogo da Steam

A funcionalidade mais subestimada do SteamOS é o perfil de desempenho por jogo. Nas propriedades de cada título, na aba "Desempenho", você encontra os mesmos controles do menu rápido — TDP, clock da GPU, limite de FPS — mas com uma diferença crucial: **eles só valem para aquele jogo específico**.

Quando você inicia o jogo, o SteamOS aplica automaticamente o perfil gravado. Quando você fecha o jogo, os valores voltam ao padrão global. Isso é exatamente o que você quer: não há motivo para manter TDP de 15 W enquanto navega na biblioteca ou usa o navegador.

Para configurar: no Modo Jogo, selecione o jogo → botão de menu (três linhas) → Propriedades → Desempenho. Marque "Usar perfil de desempenho específico" e ajuste os controles. A configuração é salva no `localconfig.vdf` da Steam, dentro da sua pasta de dados:

```terminal
$ grep -A5 'TDP' ~/.steam/steam/userdata/*/config/localconfig.vdf | head -20
```

O arquivo `localconfig.vdf` é o banco de dados de preferências da Steam, no formato Valve Data Format. Você pode inspecioná-lo para confirmar que o perfil está salvo, mas editá-lo manualmente é frágil — prefira a interface.

:::dica
Monte uma hierarquia mental de perfis: comece pelo perfil global (o que você usa quando nenhum jogo está aberto), depois crie perfis para os 5-8 jogos que você mais joga. O resto do tempo, o menu rápido resolve. Automatizar demais custa mais tempo do que simplesmente arrastar um controle deslizante.
:::

## Um serviço systemd para o ryzenadj

Se você quer que um ajuste do `ryzenadj` sobreviva ao reboot (como um undervolt sutil ou um limite de temperatura), o caminho correto é um serviço systemd. Crie o arquivo de unidade:

```terminal
$ sudo steamos-readonly disable
$ sudo mkdir -p /etc/systemd/system/
```

Crie o arquivo `/etc/systemd/system/ryzenadj-boot.service`:

```ini
[Unit]
Description=Aplica ajustes de energia da APU no boot
After=multi-user.target

[Service]
Type=oneshot
ExecStart=/usr/bin/ryzenadj -a 15000 -b 15000 -c 15000 --tctl-temp=85 -d 10 --set-coall=10
RemainAfterExit=yes

[Install]
WantedBy=multi-user.target
```

Os parâmetros em `ExecStart` são os mesmos que você testou manualmente. O `Type=oneshot` diz ao systemd que o serviço executa uma vez e termina; o `RemainAfterExit=yes` marca o serviço como "ativo" mesmo depois de concluído, para que ele apareça com status `active (exited)` e não como `inactive`.

Ative e teste:

```terminal
$ sudo systemctl daemon-reload
$ sudo systemctl enable ryzenadj-boot.service
Created symlink /etc/systemd/system/multi-user.target.wants/ryzenadj-boot.service → /etc/systemd/system/ryzenadj-boot.service.
$ sudo systemctl start ryzenadj-boot.service
$ sudo systemctl status ryzenadj-boot.service
● ryzenadj-boot.service - Aplica ajustes de energia da APU no boot
     Loaded: loaded (/etc/systemd/system/ryzenadj-boot.service; enabled; preset: disabled)
     Active: active (exited) since Mon 2025-01-08 14:22:31 -03; 7s ago
```

O status `active (exited)` confirma que o comando foi executado com sucesso. No próximo boot, o systemd executa a unidade automaticamente — e seus ajustes estão aplicados antes mesmo de você abrir a Steam.

:::atencao
Se o `ryzenadj` falhar silenciosamente no boot (por exemplo, porque o kernel mudou e a interface SMU alterou), o serviço ainda aparece como `active`. Verifique com `sudo systemctl status ryzenadj-boot.service` periodicamente e rode `sudo ryzenadj --info` depois do boot para confirmar que os valores estão como esperado.
:::

## Automatizando por nível de bateria

Um truque avançado: usar o udev ou um timer do systemd para ajustar o TDP conforme a bateria cai. A ideia é simples — quando a bateria está acima de 80%, use TDP generoso; quando cai abaixo de 40%, reduza o TDP para economizar.

O script que faz isso:

```bash
#!/usr/bin/env bash
# /home/deck/.local/bin/auto-tdp.sh
BAT_PCT=$(cat /sys/class/power_supply/BAT1/capacity)

if [ "$BAT_PCT" -ge 80 ]; then
    ryzenadj -a 15000 -b 15000 -c 15000
elif [ "$BAT_PCT" -ge 40 ]; then
    ryzenadj -a 11000 -b 11000 -c 11000
else
    ryzenadj -a 8000 -b 8000 -c 8000
fi
```

Combine com um timer systemd que executa esse script a cada 5 minutos (ou sempre que o estado da bateria mudar) e você tem um ajuste dinâmico de TDP que responde à bateria restante. O custo é pequeno: meia dúzia de linhas de bash, uma unidade de timer e zero intervenção depois de pronto.

```terminal
$ chmod +x /home/deck/.local/bin/auto-tdp.sh
$ /home/deck/.local/bin/auto-tdp.sh
```

:::perigo
Automação de TDP que muda enquanto o jogo roda pode causar stutter no momento da troca de limite. Teste o script com um jogo aberto e veja se a transição é suave. Se houver engasgo, aumente o intervalo do timer para que a troca aconteça entre jogos ou em momentos de baixa carga. O pior cenário é um script que fica mudando o TDP a cada 30 segundos durante uma luta de boss.
:::

## O que fica manual

Nem tudo merece automação. Três coisas que você provavelmente continuará fazendo manualmente:

- **Undervolt:** só você sabe o valor estável do seu chip, e ele não muda com o tempo. Configure uma vez, coloque no serviço systemd e esqueça.
- **Clock da GPU:** o perfil por jogo da Steam já resolve. Cada título tem seu clock ideal, e você descobre testando.
- **Perfil de ventoinha:** a Valve deixou exatamente duas opções, e a diferença entre elas é pequena. Escolha uma e siga em frente.

O objetivo da automação não é eliminar todo pensamento sobre energia, mas eliminar as decisões repetitivas. Toda vez que você inicia um jogo e o perfil já está certo, a seção cumpriu seu papel.

## Resumo

- O perfil de desempenho por jogo da Steam aplica TDP e clock automaticamente ao iniciar cada título.
- Serviços systemd do tipo `oneshot` executam `ryzenadj` no boot e mantêm os ajustes entre reinicializações.
- Scripts de bash podem ler a carga da bateria e ajustar o TDP dinamicamente.
- Automatize decisões repetitivas; deixe manual o que depende de testes por jogo.
- Teste toda automação com o jogo rodando para garantir que a transição de TDP não cause stutter.

## Exercícios

1. Crie um perfil de desempenho para o jogo mais leve que você tem instalado, limitando o TDP a 6 W e o FPS a 30. Verifique se o perfil é aplicado automaticamente ao abrir o jogo.
2. Escreva o serviço systemd `/etc/systemd/system/ryzenadj-boot.service` com seus ajustes preferidos e confirme que ele inicia sem erros.
3. Crie o script `auto-tdp.sh` com os três patamares de bateria. Execute-o manualmente e confira com `ryzenadj --info` que o TDP muda conforme a bateria.
4. Inspecione o `localconfig.vdf` e encontre a entrada de perfil de desempenho de um dos seus jogos. Anote o caminho exato no arquivo.
5. **Desafio.** Crie um timer systemd que execute `auto-tdp.sh` a cada 5 minutos. Rode um jogo por 15 minutos e observe: a transição automática de TDP causou stutter? Se sim, proponha uma estratégia para mitigar (ex.: checar se um processo de jogo está rodando antes de trocar o TDP).