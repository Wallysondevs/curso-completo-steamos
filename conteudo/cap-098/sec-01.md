O SteamOS é um sistema multiusuário como qualquer distribuição Linux, e a primeira camada de segurança não é o firewall, não é a criptografia: é a senha. No Steam Deck, a Valve toma uma decisão incomum — o usuário `deck` vem sem senha configurada e com login automático por padrão. Isso é prático para um console portátil, mas deixa a máquina exposta assim que você habilita SSH, instala serviços ou conecta o aparelho a redes fora de casa. Definir uma senha é o primeiro ato de quem leva segurança a sério.

:::objetivos
- Entender por que o SteamOS entrega o usuário `deck` sem senha
- Definir, alterar e verificar a senha com `passwd`
- Ler `/etc/shadow` e interpretar o hash de senha
- Desabilitar o login automático no modo sessão Plasma
- Explicar como o PAM decide se você pode ou não trocar a senha
:::

## Por que o `deck` vem sem senha

O Steam Deck foi projetado como console, não como servidor. A experiência de fábrica é: ligou, jogou. Uma tela de login seria fricção desnecessária num aparelho que você desbloqueia com o botão power e usa com os polegares. Por isso o instalador do SteamOS cria o usuário `deck` com senha vazia e configura o SDDM (Simple Desktop Display Manager) para fazer autologin.

O custo dessa decisão aparece quando o aparelho sai da sala de casa. Com SSH habilitado, qualquer processo que escute numa porta de rede vira vetor de ataque — e sem senha, o `sudo` também não exige autenticação. A primeira tarefa de segurança, portanto, é dar uma senha ao `deck`.

```terminal
$ passwd
Changing password for deck.
Current password: 
New password: 
Retype new password: 
passwd: password updated successfully
```

Como o `deck` não tinha senha, o campo `Current password` aceita só apertar [[Enter]]. A partir desse momento, `sudo` e qualquer operação de autenticação exigirão a nova senha.

## O que acontece por dentro: `/etc/shadow`

Quando você executa `passwd`, o sistema não armazena a senha em texto limpo. Ela é processada por uma função de hash — tipicamente `yescrypt` no SteamOS 3.6 — e o resultado é armazenado em `/etc/shadow`, arquivo que só o root pode ler.

```terminal
$ sudo grep deck /etc/shadow
deck:$y$j9T$uQk3LmNxPzRvAeBdCfGhIkJ1M2N3$XyZaBcDeFgHiJkLmNoPqRsTuVwXyZaBcDeFgHiJkLm:19981:0:99999:7:::
```

A linha tem campos separados por `:`. O primeiro é o nome do usuário. O segundo é o hash, que no SteamOS usa o prefixo `$y$` — identificador do algoritmo `yescrypt`. Os números seguintes são: dias desde 1970-01-01 em que a senha foi alterada (`19981`), idade mínima em dias antes de poder trocar de novo (`0`), idade máxima (`99999`, praticamente sem expiração) e período de aviso (`7` dias).

:::nota
O `yescrypt` substituiu o `SHA-512` (`$6$`) como padrão a partir do libxcrypt 4.4. Ele é resistente a ataques de força bruta com hardware especializado porque consome memória além de CPU. Se você migrou de um SteamOS antigo (22.04), pode ainda ver hashes `$6$` no shadow.
:::

## Desligando o login automático

No modo desktop (KDE Plasma), o SDDM usa autologin por padrão. Para desligá-lo, edite a configuração do SDDM:

```terminal
$ sudo cat /etc/sddm.conf.d/autologin.conf
[Autologin]
User=deck
Session=plasma
```

Para desabilitar, remova ou renomeie esse arquivo e reinicie o SDDM:

```terminal
$ sudo mv /etc/sddm.conf.d/autologin.conf /etc/sddm.conf.d/autologin.conf.bak
$ sudo systemctl restart sddm
```

Após o restart, a tela de login aparece pedindo usuário e senha. No modo jogo (gamescope), o autologin é gerenciado pelo próprio compositor e não passa pelo SDDM — mexer nesse comportamento exigiria editar os serviços do `gamescope-session`, o que está fora do escopo desta seção.

:::atencao
Se você desabilitar o autologin sem ter definido uma senha, o SDDM vai pedir a senha e qualquer coisa que você digitar será aceita — `deck` sem senha é "qualquer string" para o PAM. Defina a senha **antes** de desligar o autologin.
:::

## Como o PAM decide o que é permitido

O PAM (Pluggable Authentication Modules) é a camada que fica entre o `passwd`, o `sudo`, o `login` e o arquivo `/etc/shadow`. Ele não armazena nada — só consulta. A configuração do `passwd` está em `/etc/pam.d/passwd`:

```terminal
$ cat /etc/pam.d/passwd
#%PAM-1.0
auth       sufficient   pam_unix.so nullok
account    required     pam_unix.so
password   required     pam_unix.so sha512 shadow nullok yescrypt
```

A diretiva `nullok` permite que usuários sem senha troquem de senha sem digitar a atual. Sem ela, o `passwd` rejeitaria a operação. O módulo `pam_unix.so` é o mesmo que autentica no login e no `sudo` — por isso o comportamento de senha vazia é consistente entre todos eles.

:::dica
Para exigir que a nova senha tenha tamanho mínimo, use `pam_pwquality.so`. Instale com `sudo apt install libpam-pwquality` e adicione `password required pam_pwquality.so minlen=12` antes da linha do `pam_unix.so` no arquivo `/etc/pam.d/common-password`.
:::

## Resumo

- O SteamOS cria o usuário `deck` sem senha para eliminar fricção no uso como console, mas isso é um risco assim que qualquer serviço de rede é habilitado.
- `passwd` define a senha; o hash `yescrypt` (`$y$`) é armazenado em `/etc/shadow`, legível só pelo root.
- O autologin no modo desktop é gerenciado pelo SDDM em `/etc/sddm.conf.d/autologin.conf` — desabilite-o removendo o arquivo.
- O PAM controla as regras de autenticação e troca de senha; `nullok` é o que permite a transição de "sem senha" para "com senha".
- `pam_pwquality.so` adiciona políticas de complexidade e tamanho mínimo.

## Exercícios

1. Verifique se o `deck` tem senha definida olhando o campo de hash em `/etc/shadow`. O que aparece se a senha estiver vazia?
2. Defina uma senha com `passwd` e depois execute `passwd -S deck`. Interprete cada campo da saída.
3. Desabilite o autologin do SDDM temporariamente (renomeando o arquivo), reinicie o SDDM e faça login manual. Depois restaure a configuração original.
4. Liste os módulos PAM carregados com `ls /etc/pam.d/` e abra o arquivo `common-auth`. Qual é a diferença entre `requisite`, `required` e `sufficient` nas linhas desse arquivo?
5. **Desafio.** Instale o `libpam-pwquality`, configure tamanho mínimo 12 no `common-password` e teste com `passwd`. Depois leia o log de autenticação com `sudo journalctl -u systemd-logind --since "5 min ago"` e encontre a linha que registra a troca de senha.