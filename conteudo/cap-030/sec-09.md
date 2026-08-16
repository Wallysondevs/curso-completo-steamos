Atualizar é fácil; voltar atrás é que exige técnica. O Flatpak guarda cada build como um objeto OSTree com um hash próprio, o **commit**, e isso torna possível descer de versão de forma precisa e reproduzível. Quando uma atualização quebra um app — um bug de regressão, uma mudança de comportamento, uma dependência incompatível — o downgrade via commit é o seu caminho de volta.

:::objetivos
- Entender o que é o commit e como ele viabiliza o downgrade
- Localizar o commit da versão anterior via `flatpak history --verbose`
- Aplicar o downgrade com `flatpak update --commit=<hash>`
- Identificar o commit em uso atual e validar a reversão
- Saber quando o downgrade não é possível

## Por que o commit importa mais que a versão

O número de versão (`3.0.2`) é um rótulo humano; o **commit** é a identidade exata da build. Duas builds podem exibir a mesma versão e diferir em qualquer byte — uma correção silenciosa, uma flag de compilação, um patch de segurança aplicado e não versionado. Por isso o downgrade no Flatpak não é feito por "versão antiga", e sim por **commit específico**: só o hash garante que você está apontando para o estado exato que deseja.

Você já viu esse hash em dois lugares: na saída de `flatpak info <ID>` (o campo `Commit`) e no `flatpak history --verbose` (os pares `old`/`new`). A [seção de histórico](#/cap-030/sec-08) é a fábrica de onde você tira o hash do downgrade.

## Achar o commit da versão anterior

O ponto de partida é sempre o histórico verbose, filtrando pelo app que quebrou:

```terminal
$ flatpak history --verbose | grep -A2 'org.gimp.GIMP'
update org.gimp.GIMP/x86_64/stable                          2024-10-15 09:01:42 +0000
  old 7f1a2b3c9d4e5f6a7b8c9d0e1f2a3b4c5d6e7f8a9b0c1d2e3f4a5b6c7d8e9f0a1b
  new 8e2b3c4d5e6f7a8b9c0d1e2f3a4b5c6d7e8f9a0b1c2d3e4f5a6b7c8d9e0f1a2b3c
```

A linha `old 7f1a2b...` é o commit da versão anterior, a que você quer voltar. O `new 8e2b3c...` é a versão problemática que está instalada agora. Copie o hash do `old`.

:::atencao
O `grep -A2` mostra a linha de `update` e as duas seguintes (`old` e `new`). Se você usar só `grep` simples, perderá o conteúdo das linhas `old`/`new` porque elas têm indentação e começam com espaços, não com a palavra-chave do app.
:::

## Aplicando o downgrade

Com o hash em mãos, o comando é uma variação do `update` que já conhecemos:

```terminal
$ flatpak update --commit=7f1a2b3c9d4e5f6a7b8c9d0e1f2a3b4c5d6e7f8a9b0c1d2e3f4a5b6c7d8e9f0a1b org.gimp.GIMP
Looking for updates…

 1. [✗] org.gimp.GIMP   stable   u   flathub   < 12.9 MB

Proceed with these changes to the system installation? [Y/n]: y
```

A flag `--commit=<hash>` instrui o Flatpak a apontar o app para aquele commit específico em vez do mais recente do remoto. A coluna `Op` continua mostrando `u` (update), porque de fato é uma atualização — para trás. O download é pequeno porque o OSTree baixa só o delta entre o estado atual e o alvo.

:::info
Para funcionar, o commit alvo precisa ainda existir no remoto. O Flathub retém builds antigas por um bom tempo, mas não para sempre — commits removidos por limpeza de repositório não podem ser baixados. Se o downgrade falhar com "commit not found", a janela foi fechada e a alternativa é uma versão estável anterior ainda disponível.
:::

## Confirmando que a reversão deu certo

Depois do downgrade, valide o estado atual:

```terminal
$ flatpak info org.gimp.GIMP | grep -E 'Commit|Version'
       Commit: 7f1a2b3c9d4e5f6a7b8c9d0e1f2a3b4c5d6e7f8a9b0c1d2e3f4a5b6c7d8e9f0a1b
     Version: 2.10.36
```

O campo `Commit` agora bate com o hash que você passou, e o `Version` desceu de volta. Se o app continua quebrado, você apontou para o commit errado — revise o histórico e tente um `old` mais antigo.

Um detalhe sutil: agora que o app está numa versão antiga, o próximo `flatpak update` genérico tentará subi-lo de novo para a versão problemática. Para segurar o downgrade, combine com o `flatpak mask` da [seção de atualização](#/cap-030/sec-04):

```terminal
$ flatpak mask org.gimp.GIMP
```

Assim o app permanece na versão boa até você decidir destravar.

:::dica
O ciclo completo de "quebrou, volta": `history --verbose` → copia o `old` → `update --commit=<old>` → valida com `info` → `mask` para segurar. Com esse fluxo memorizado, uma atualização ruim deixa de ser motivo de pânico e vira um procedimento de dois minutos.
:::

## Quando o downgrade não resolve

Há cenários em que descer o app não é suficiente. Se o problema estava num runtime compartilhado (o `org.gnome.Platform` quebrou o app, não o próprio app), você precisa fazer downgrade do *runtime*, não do app — mesmo procedimento, apontando o ref do runtime. E se o bug vinha de uma configuração sua, um downgrade não muda nada: nesse caso, revisar overrides (da [seção de overrides](#/cap-030/sec-07)) e limpar `~/.var/app/<ID>` costuma ser a correção real.

## Resumo

- O downgrade no Flatpak é por **commit** (hash OSTree), não por número de versão.
- O hash da versão anterior vem do `flatpak history --verbose`, no par `old`/`new` de um `update`.
- `flatpak update --commit=<hash> <ID>` aponta o app para aquele commit específico.
- Depois de reverter, use `flatpak mask <ID>` para o `update` não subir de novo automaticamente.
- O downgrade falha se o commit foi removido do remoto; nesse caso, busque uma versão anterior ainda disponível.

## Exercícios

1. Rode `flatpak history --verbose | grep -A2 '<seu-app>'` e identifique o par `old`/`new` do último update. Copie o hash `old` para um arquivo de rascunho.
2. Anote o commit atual com `flatpak info --show-commit <ID>` e guarde para referência antes de mexer.
3. Execute o downgrade: `flatpak update --commit=<old> <ID>` e confirme com `flatpak info <ID>` que o campo `Commit` mudou para o hash alvo.
4. Mascare o app (`flatpak mask <ID>`), rode `flatpak update` e confirme que ele foi pulado. Depois remova a máscara.
5. **Desafio.** Simule um downgrade de *runtime*: identifique o runtime do seu app (`flatpak info <ID>` → campo `Runtime`), encontre o commit anterior desse runtime no histórico, e faça o downgrade do runtime (não do app). Valide e desfaça a máscara de ambos no final.