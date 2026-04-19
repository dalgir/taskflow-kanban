# Segurança, autenticação, banco de dados e RLS equivalente

## Visão geral

Este projeto permanece com a **mesma estrutura de frontend em React/Vite** e continua usando **Firebase Authentication + Cloud Firestore** como base de autenticação e persistência. Como o Firestore **não possui Row Level Security nativo** no modelo do PostgreSQL, a proteção por linha foi implementada no equivalente correto da plataforma: **Firebase Security Rules**, arquivo `firestore.rules`.

> Em termos práticos, a proteção por linha foi traduzida para regras por documento, com o mesmo objetivo: cada usuário autenticado só consegue ler ou modificar os registros que lhe pertencem ou que lhe são explicitamente autorizados.

## Problemas encontrados

| Área | Problema identificado | Impacto |
| --- | --- | --- |
| Autenticação | Login por e-mail sem senha, totalmente no cliente | Qualquer pessoa podia se passar por outro usuário |
| Autorização | Permissões apenas no frontend | Bastava manipular estado local para contornar restrições |
| Banco de dados | Persistência parcial e sem validação consistente de datas | Dados corrompidos, divergência entre memória, backup e nuvem |
| Usuários | Não havia vínculo forte entre identidade autenticada e membro do sistema | Conta autenticada e perfil do sistema podiam divergir |
| Importação/exportação | Entrada de JSON sem endurecimento suficiente | Risco de dados inválidos e inconsistentes |
| RLS | Inexistente no stack atual | Leitura e escrita não tinham isolamento real por usuário |

## Correções aplicadas

### 1. Autenticação real

O fluxo de acesso foi ajustado para usar **autenticação real com Firebase Auth** quando o projeto estiver configurado com Firebase. O login agora exige:

- e-mail válido;
- senha;
- usuário autenticado no Firebase;
- usuário ativo na coleção `teamMembers`;
- correspondência entre `auth.token.email` e o e-mail autorizado no sistema.

Além disso, foi adicionado um estado de **carregamento de autenticação** para impedir que a aplicação libere a interface antes da validação do acesso.

### 2. Vínculo entre identidade e cadastro interno

A interface `TeamMember` passou a suportar os campos:

| Campo | Finalidade |
| --- | --- |
| `firebaseUid` | Vincular o usuário autenticado ao cadastro interno |
| `isActive` | Permitir bloqueio lógico de acesso sem excluir histórico |

Com isso, o sistema deixa de depender apenas de um e-mail digitado no navegador e passa a exigir uma identidade autenticada e autorizada.

### 3. Endurecimento das permissões de negócio

As operações críticas foram protegidas no contexto da aplicação:

| Operação | Regra aplicada |
| --- | --- |
| Criar tarefa | Admin ou usuário relacionado à tarefa |
| Editar tarefa | Admin ou dono/responsável, desde que a regra permita |
| Excluir tarefa | Apenas admin |
| Validar tarefa | Apenas admin |
| Gerenciar membros | Admin; edição própria limitada para perfil do próprio usuário |
| Ausências | Admin ou próprio usuário |
| Notificações | Leitura e marcação limitadas ao destinatário, com exceção de admin |
| Importação de backup | Apenas admin |

## RLS equivalente no Firestore

### Conceito

No PostgreSQL, RLS trabalha linha a linha. No Firestore, o equivalente correto é **document-level access control** usando regras de segurança. Cada documento é tratado como uma "linha" protegida.

### Política aplicada por coleção

| Coleção | Leitura | Escrita |
| --- | --- | --- |
| `teamMembers` | Usuários autenticados e ativos | Admin; o próprio usuário apenas com limitações controladas |
| `tasks` | Admin, criador da tarefa ou responsável | Admin, criador ou responsável, com restrições para campos sensíveis |
| `absences` | Usuários autenticados e ativos | Admin ou dono do registro |
| `notifications` | Admin ou destinatário | Admin ou destinatário, com restrição para alteração indevida do conteúdo |

### Regras críticas implementadas

As regras em `firestore.rules` validam:

1. existência de autenticação;
2. existência do documento do usuário em `teamMembers/{uid}`;
3. usuário ativo;
4. compatibilidade entre e-mail autenticado e e-mail autorizado;
5. validação mínima de payload para tarefas;
6. bloqueio de exclusão de membro pelo próprio usuário admin atual;
7. bloqueio de edição de campos sensíveis por usuários comuns;
8. proteção para leitura de notificações apenas do destinatário.

## Estrutura recomendada da coleção `teamMembers`

Para que as regras funcionem corretamente, recomenda-se que o ID do documento seja o **UID do Firebase Auth**. Exemplo:

```json
{
  "id": "uid-do-firebase",
  "name": "Nome do usuário",
  "role": "Administrador",
  "avatar": "👨‍💼",
  "email": "usuario@empresa.com",
  "isAdmin": true,
  "isActive": true,
  "firebaseUid": "uid-do-firebase"
}
```

> Se hoje a coleção estiver usando IDs legados diferentes, é recomendável migrar gradualmente para UID como chave primária do documento. O código foi ajustado para tolerar transição, mas a regra de segurança fica mais forte quando o documento do membro usa o UID real.

## Banco de dados e integridade

A camada `src/services/database.ts` foi endurecida para:

- serializar `Date` corretamente antes de persistir;
- reviver datas corretamente ao carregar dados;
- normalizar e-mails em minúsculas;
- validar a estrutura básica do backup importado;
- evitar inconsistências entre registros em memória e persistência.

## Modo local

Quando o Firebase não está configurado, o projeto mantém um **modo local de demonstração** para não quebrar a estrutura original. Entretanto:

> Modo local não oferece segurança real, não implementa RLS de verdade e não deve ser usado em produção multiusuário.

## Passos obrigatórios para produção

| Passo | Descrição |
| --- | --- |
| 1 | Criar usuários reais no Firebase Authentication |
| 2 | Criar documentos correspondentes em `teamMembers` |
| 3 | Publicar o arquivo `firestore.rules` no Firebase |
| 4 | Garantir que `email`, `isAdmin`, `isActive` e `firebaseUid` estejam consistentes |
| 5 | Remover contas de teste ou perfis sem UID após a migração |

## Deploy das regras

Use o Firebase CLI no projeto configurado:

```bash
firebase deploy --only firestore:rules
```

Se ainda não existir configuração do Firebase CLI no ambiente do projeto:

```bash
firebase init firestore
firebase deploy --only firestore:rules
```

## Observação importante sobre RLS

Se você quiser **RLS nativo em SQL**, então o caminho seria migrar a camada de dados para **PostgreSQL/Supabase**. Como o pedido foi **não mexer na estrutura** do projeto, preservei a arquitetura existente e implementei o equivalente correto de segurança para Firestore.

## Resultado prático

Após as correções, o sistema passa a ter:

- autenticação real com senha no modo seguro;
- vínculo entre identidade autenticada e usuário autorizado;
- endurecimento de permissões no frontend;
- persistência mais consistente;
- regras de segurança equivalentes a RLS no Firestore;
- documentação detalhada para implantação segura em produção.
