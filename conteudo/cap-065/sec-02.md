Antes de abrir o Moonlight no Deck, o host precisa do Sunshine. A instalação depende do sistema operacional, mas em todos os casos o resultado é o mesmo: um serviço rodando em segundo plano, escutando na porta 47989 (TCP) e 48010 (UDP), pronto para receber conexões do Moonlight. Esta seção cobre a instalação nos dois sistemas mais comuns: Windows e Linux (incluindo SteamOS como host, embora o Deck não seja um host ideal).

:::objetivos
- Instalar o Sunshine no Windows usando o instalador oficial
- Instalar o Sunshine no Linux via Flatpak, AppImage ou repositório
- Configurar o Sunshine como serviço com inicialização automática
- Entender a interface web de administração (localhost:47990)
- Verificar o status do serviço e os logs iniciais
:::

## Instalação no Windows

O instalador oficial está em [github.com/LizardByte/Sunshine/releases](https://github.com/LizardByte/Sunshine/releases). Baixe o `.exe` da versão estável mais recente (≥ 0.23). Execute como administrador — ele registra o serviço `SunshineService` e instala as dependências:

- **ViGEmBus**: driver de gamepad virtual (faz o Moonlight ver os controles como Xbox 360).
- **NvAPI / ADLX**: bibliotecas de acesso ao encoder da GPU.

Após a instalação, o Sunshine abre automaticamente a interface web em `https://localhost:47990`. O primeiro acesso pede para criar usuário e senha — estas credenciais são locais, usadas apenas para administrar o Sunshine.

Verifique se o serviço está rodando:

```terminal
# PowerShell como administrador
> Get-Service SunshineService

Status   Name               DisplayName
------   ----               -----------
Running  SunshineService    Sunshine Service
```

Se não estiver, inicie com `Start-Service SunshineService`.

No Windows, o firewall pode bloquear as portas. O instalador tenta criar as regras, mas confira:

```terminal
> netsh advfirewall firewall show rule name="Sunshine"
```

Se ausente, crie manualmente abrindo as portas TCP 47984-48010 e UDP 47998-48010.

## Instalação no Linux

No Linux (Ubuntu, Arch, Fedora), o método recomendado é o Flatpak:

```terminal
$ flatpak install flathub dev.lizardbyte.app.Sunshine
$ flatpak run dev.lizardbyte.app.Sunshine
```

No Arch Linux, há pacote no AUR:

```terminal
$ yay -S sunshine
```

E há AppImage disponível para download direto nas releases do GitHub.

Independentemente do método, após instalar:

```terminal
$ sunshine --version
Sunshine version: v0.23.1
```

### Configurando o serviço no Linux

Para que o Sunshine inicie automaticamente no boot do host:

**Systemd (Arch, Ubuntu):**

```terminal
$ systemctl --user enable sunshine
$ systemctl --user start sunshine
$ systemctl --user status sunshine
```

Se instalado via Flatpak, pode ser necessário criar um arquivo `.service` manualmente, ou usar o método de autostart da sua DE (Gnome, KDE, etc).

**Verificando a interface web:**

```terminal
$ curl -k https://localhost:47990
# Deve retornar o HTML da página de login
```

## SteamOS como host?

O Steam Deck pode ser host? Tecnicamente sim, mas não é recomendado. O APU Van Gogh/Aerith tem encoder VCN 2.0 limitado, e o SteamOS é imutável — instalar serviços de sistema persistentes exige desabilitar o modo read-only. Se você tiver um dock e um PC cliente, pode testar por curiosidade:

```terminal
$ sudo steamos-readonly disable
$ flatpak install flathub dev.lizardbyte.app.Sunshine
```

Mas para streaming sério, use o Deck como cliente e um PC com GPU dedicada como host.

## A interface web do Sunshine

Acesse `https://localhost:47990` no navegador do host. A interface tem abas:

| Aba | Função |
|-----|--------|
| **Home** | Status do servidor, GPU detectada, resumo de conexões |
| **PIN** | Gerar PIN para parear clientes Moonlight |
| **Applications** | Lista de aplicativos que o Moonlight vê (jogos + desktop) |
| **Configuration** | Encoder, resolução, FPS, bitrate, codecs, áudio |
| **Users** | Gerenciar credenciais de administração |
| **Logs** | Logs do Sunshine em tempo real |
| **Troubleshooting** | Diagnóstico e dicas de configuração |

Na aba **Applications**, o Sunshine detecta automaticamente jogos Steam e aplicativos comuns. É possível adicionar manualmente qualquer executável ou script.

## Primeira verificação

No host, confirme que o Sunshine está respondendo:

```terminal
$ curl -sk https://localhost:47990/api/status | jq .
```

A resposta inclui `status: "ok"`, o hostname, a GPU detectada e o encoder ativo.

Outra verificação útil: o Sunshine escuta na porta 47989 (TCP) para o Moonlight e 48010 (UDP) para streaming. Confirme com:

```terminal
# Linux
$ ss -tlnp | grep 47989
$ ss -ulnp | grep 48010

# Windows
> netstat -ano | findstr 47989
> netstat -ano | findstr 48010
```

## Resumo

- No Windows: instalador `.exe`, configura serviço automaticamente, precisa de ViGEmBus para gamepad virtual.
- No Linux: Flatpak, AppImage ou AUR; serviço via systemd user.
- Steam Deck pode ser host, mas é subótimo: encoder limitado e sistema imutável.
- Interface web em `https://localhost:47990` controla tudo: PIN, aplicativos, encoder e logs.
- Sunshine escuta TCP/47989 (controle) + UDP/48010 (streaming).

## Exercícios

1. Instale o Sunshine no seu PC principal (Windows ou Linux) usando o método recomendado para o seu sistema.
2. Acesse `https://localhost:47990`, crie um usuário administrador e localize a aba **Configuration**. Anote qual encoder a interface reporta (NVENC, AMF, VAAPI ou software).
3. Execute `curl -sk https://localhost:47990/api/status | jq .` (ou abra a URL no navegador sem `jq`) e liste os campos `hostname`, `gpu` e `uuid`.
4. Confirme que as portas 47989 e 48010 estão em escuta no host com `ss` (Linux) ou `netstat` (Windows).
5. **Desafio.** No Linux, crie um arquivo `~/.config/systemd/user/sunshine.service` personalizado que inicie o Sunshine com prioridade de GPU específica (`--gpu`). Qual opção de linha de comando você usaria para forçar o encoder AMF em uma GPU AMD?