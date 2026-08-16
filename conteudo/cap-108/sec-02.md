O Steam Deck tem uma vantagem sobre qualquer VPS de entrada: ele já está pago, consome entre 4 e 15 watts em carga moderada, e você tem acesso físico direto ao hardware. Transformá-lo em um servidor que roda 24 horas por dia é menos sobre "faz sentido" e mais sobre "o que você quer hospedar". Um blog pessoal, um serviço de compartilhamento de arquivos na rede local, um agregador de RSS, um servidor de Minecraft para os amigos — tudo isso cabe no Deck com folga.

:::objetivos
- Preparar o Steam Deck para operação contínua como servidor doméstico
- Configurar serviços systemd que iniciam no boot e sobrevivem a reinicializações
- Expor um serviço web simples com Nginx e HTTPS via Let's Encrypt
- Implementar um túnel seguro com Tailscale ou Cloudflare Tunnel
- Gerenciar thermal throttling e consumo energético em operação 24/7
:::

## Preparando o Deck para ficar ligado direto

Servidor que desliga sozinho não é servidor. O SteamOS, por padrão, tem comportamentos de console portátil: suspensão automática, desligamento de tela, economia de energia agressiva. A primeira tarefa é desarmar essas proteções para uso como servidor.

```terminal
$ sudo systemctl mask sleep.target suspend.target hibernate.target hybrid-sleep.target
Created symlink /etc/systemd/system/sleep.target → /dev/null.
Created symlink /etc/systemd/system/suspend.target → /dev/null.
```

Mascarar esses alvos (`mask`) impede qualquer serviço ou gatilho de iniciar suspensão. É mais forte que `disable` — nem manualmente algo consegue chamar `systemctl suspend` e ter efeito.

Em seguida, desative o desligamento da tela após inatividade. No KDE Plasma, vá em *System Settings → Power Management* e desmarque "Screen Energy Saving". Se preferir a linha de comando:

```terminal
$ xset s off
$ xset -dpms
```

O `dpms` (Display Power Management Signaling) desliga o painel após inatividade. Num servidor sem monitor conectado isso pode não importar, mas se o Deck estiver com a tela ligada como painel de status, você não quer que ela apague.

:::atencao
Deixar o Deck ligado 24/7 com a bateria sempre em 100% degrada a bateria mais rápido. Se o uso for como servidor fixo, considere um carregador original conectado permanentemente. O Steam Deck tem pass-through de energia: com a bateria cheia, a energia do carregador vai direto para o sistema, poupando a bateria. Mesmo assim, a cada poucos meses, deixe-a descarregar até ~40% e recarregar para manter o controlador de carga calibrado.
:::

## Serviços systemd para o mundo real

Você já sabe criar uma unidade systemd básica ([capítulo 34](#/cap-034/sec-01)). Para um serviço de produção vale ir além: política de reinício, limites de recurso, e isolamento mínimo.

Um exemplo de serviço que hospeda uma aplicação Python com `uvicorn`:

```ini
[Unit]
Description=Meu App FastAPI
After=network-online.target
Wants=network-online.target

[Service]
Type=simple
User=ana
WorkingDirectory=/home/ana/meu-app
ExecStart=/home/ana/.local/bin/uvicorn main:app --host 0.0.0.0 --port 8080
Restart=always
RestartSec=5
MemoryMax=512M
CPUQuota=50%
PrivateTmp=yes
ProtectSystem=full
ProtectHome=read-only
NoNewPrivileges=yes

[Install]
WantedBy=multi-user.target
```

As diretivas de segurança (`PrivateTmp`, `ProtectSystem`, `NoNewPrivileges`) isolam o processo sem precisar de container. Não substituem o Docker, mas são o mínimo que todo serviço voltado à rede deveria ter. `MemoryMax` impede que um vazamento de memória trave o sistema inteiro; `CPUQuota=50%` limita o serviço a meio núcleo, deixando o resto livre para o sistema operacional.

Depois de criar o arquivo em `/etc/systemd/system/meu-app.service`:

```terminal
$ sudo systemctl daemon-reload
$ sudo systemctl enable --now meu-app.service
Created symlink /etc/systemd/system/multi-user.target.wants/meu-app.service.
$ systemctl status meu-app.service
● meu-app.service - Meu App FastAPI
     Loaded: loaded (/etc/systemd/system/meu-app.service; enabled)
     Active: active (running) since Sat 2025-01-18 14:22:10 -03; 3s ago
   Main PID: 1842 (uvicorn)
      Tasks: 2 (limit: 3822)
     Memory: 48.7M (max: 512.0M)
        CPU: 234ms
```

## Expondo com Nginx e HTTPS

Um serviço que roda em `localhost:8080` precisa de um proxy reverso para chegar ao mundo. O Nginx resolve isso com um bloco `server` mínimo:

```terminal
$ sudo pacman -S nginx
$ sudo systemctl enable --now nginx
```

```nginx
server {
    listen 80;
    server_name deck.seudominio.com.br;

    location / {
        proxy_pass http://127.0.0.1:8080;
        proxy_set_header Host $host;
        proxy_set_header X-Real-IP $remote_addr;
        proxy_set_header X-Forwarded-For $proxy_add_x_forwarded_for;
        proxy_set_header X-Forwarded-Proto $scheme;
    }
}
```

Para HTTPS, o Certbot (Let's Encrypt) funciona perfeitamente no Deck. Você precisa de um domínio próprio (R$ 40/ano em qualquer registrador) e da porta 80 acessível da internet:

```terminal
$ sudo pacman -S certbot certbot-nginx
$ sudo certbot --nginx -d deck.seudominio.com.br
Saving debug log to /var/log/letsencrypt/letsencrypt.log
Requesting a certificate for deck.seudominio.com.br
Successfully received certificate.
```

:::nota
Se o seu provedor de internet usa CGNAT (Carrier-Grade NAT) e você não tem um IP público, a porta 80 nunca vai receber tráfego externo. Nesse caso, pule o Certbot e use o Cloudflare Tunnel (próxima subseção), que fecha o túnel de dentro para fora e ainda fornece HTTPS automaticamente.
:::

## Túnel sem IP público: Cloudflare Tunnel

O `cloudflared` cria um túnel outbound para a rede da Cloudflare, eliminando a necessidade de abrir portas no roteador ou ter IP público:

```terminal
$ curl -L https://github.com/cloudflare/cloudflared/releases/latest/download/cloudflared-linux-amd64 -o cloudflared
$ chmod +x cloudflared
$ sudo mv cloudflared /usr/local/bin/
$ cloudflared tunnel login
A browser window should have opened at https://dash.cloudflare.com/argotunnel...
```

Depois de autenticar e criar o túnel pelo dashboard da Cloudflare, você o configura como serviço systemd:

```terminal
$ cloudflared tunnel create deck-tunnel
Created tunnel deck-tunnel with id 3f2b91ac-77de-4c15-9f0e-4a2d1c8b5e71
$ cloudflared tunnel route dns deck-tunnel deck.seudominio.com.br
```

```terminal
$ sudo cloudflared service install
2025-01-18T14:30:00Z INF Installing cloudflared systemd service
$ sudo systemctl enable --now cloudflared
```

A partir daí, `deck.seudominio.com.br` resolve para o seu Deck, com HTTPS automático, mesmo que ele esteja atrás de três roteadores e um CGNAT.

## Thermal e consumo em operação contínua

Com o Deck 24/7, temperatura e consumo viram métricas de primeiro time. O kernel expõe a temperatura do package AMD via `hwmon`:

```terminal
$ cat /sys/class/hwmon/hwmon3/temp1_input
48000
```

O valor está em milésimos de grau Celsius. 48000 = 48°C. Para monitorar em tempo real:

```terminal
$ watch -n 2 'echo "$(($(cat /sys/class/hwmon/hwmon*/temp1_input 2>/dev/null | head -1)/1000))°C"'
```

Se a temperatura sustentada passa de 70°C por horas, o throttling começa. Em carga de servidor típica (tráfego web leve, banco de dados pequeno), o Deck raramente passa de 50°C. O consumo pode ser medido indiretamente via `powertop`:

```terminal
$ sudo powertop --csv=/tmp/power.csv
$ grep "The system baseline power" /tmp/power.csv
The system baseline power is estimated at: 5.2 W
```

Com 5 watts de consumo médio, um Deck-servidor custa cerca de R$ 8 por mês na conta de luz (tarifa média brasileira de R$ 0,90/kWh). Menos que o plano mais barato de qualquer VPS com 16 GB de RAM.

:::dica
Se o Deck vai ficar com a tampa fechada, coloque-o na vertical, com a saída de ar (topo) para cima. A convecção natural ajuda a manter temperaturas mais baixas que deitado sobre a mesa, especialmente em operação contínua.
:::

## Resumo

- Mascare `sleep.target` e `suspend.target` para impedir suspensão; desligue DPMS com `xset` para manter a tela ativa se necessário.
- Serviços systemd de produção usam `Restart=always`, `MemoryMax`, `CPUQuota`, `ProtectSystem` e `NoNewPrivileges`.
- Nginx como proxy reverso expõe seu serviço na porta 80; Certbot adiciona HTTPS via Let's Encrypt se você tem IP público.
- Cloudflare Tunnel resolve acesso externo sem IP público e com HTTPS automático, ideal para conexões atrás de CGNAT.
- O Deck consome ~5 W em carga de servidor leve, custando menos de R$ 10/mês em energia — mais barato que qualquer VPS equivalente.
- Monitore temperatura com `/sys/class/hwmon` e consumo com `powertop`; posicione o Deck na vertical para melhor refrigeração passiva.

## Exercícios

1. Crie um serviço systemd mínimo — pode ser um `python3 -m http.server` na porta 8080 — com `Restart=always`, `ProtectSystem=full` e `PrivateTmp=yes`. Verifique com `systemctl show` se as diretivas foram aplicadas.
2. Instale o Nginx e configure um bloco `server` que faça proxy reverso para o serviço da questão 1. Acesse pelo navegador do Deck em `http://localhost`.
3. Instale o `cloudflared`, crie um túnel (gratuito) e exponha o serviço da questão 1 na internet. Peça para um amigo acessar e confirmar que funciona.
4. Meça o consumo do Deck com `powertop` por 10 minutos em ociosidade e depois com o serviço rodando. Qual a diferença em watts?
5. **Desafio.** Transforme o Deck em um servidor de arquivos local com Samba (capítulo 96) + Nginx servindo uma página de status que mostra temperatura, uptime e espaço em disco. Documente a configuração completa e compartilhe o link com a comunidade.