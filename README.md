# API da Loja

API REST para administrar os dados de uma loja, incluindo catálogo de produtos, estoque, clientes, fornecedores, funcionários, pedidos e usuários. A aplicação usa Node.js, Express, Prisma ORM e MySQL, com o esquema definido em `profcarlosmacedo_loja_oficial.sql`.

## Executar

1. Instale as dependências:

   ```bash
   npm install
   ```

2. Importe `profcarlosmacedo_loja_oficial.sql` no MariaDB/MySQL. O arquivo SQL precisa estar disponível à parte.

3. Configure as variáveis de ambiente no arquivo `.env`:

   Opção recomendada com Prisma:

   ```env
   DATABASE_URL="mysql://seu_usuario:sua_senha@localhost:3306/profcarlosmacedo_loja_oficial"
   JWT_SECRET=um_segredo_longo_e_aleatorio
   API_PORT=5000
   ```

   Compatibilidade com o formato legado usado no projeto:

   ```env
   host="mysql-profcarlosmacedo.alwaysdata.net"
   port="3306"
   user="profcarlosmacedo"
   password="@2013H3**@"
   database="profcarlosmacedo_loja_oficial"
   JWT_SECRET=um_segredo_longo_e_aleatorio
   API_PORT=5000
   ```

   `DATABASE_URL` é a conexão recomendada para o Prisma. Se usuário ou senha contiver caracteres especiais, eles devem estar percent-encoded na URL. Para compatibilidade, o servidor também monta essa conexão a partir das variáveis legadas `host`, `port`, `user`, `password` e `database` quando `DATABASE_URL` não estiver definida. `JWT_SECRET` é necessário para o login. A API usa `API_PORT` (ou `PORT`) e, se não estiver definido, inicia na porta `5000`; essa porta é independente da porta do MySQL.

4. Sincronize o schema Prisma com as tabelas já existentes e gere o client:

   ```bash
   npm run prisma:db-pull
   npm run prisma:generate
   ```

   O `db pull` consulta o banco e atualiza `prisma/schema.prisma`; revise as mudanças antes de usá-las. Para apenas verificar o schema, execute `npm run prisma:validate`. Não é necessário executar migrations para conectar a um banco existente.

5. Inicie o servidor:

   ```bash
   npm run dev
   ```

O endereço local padrão é `http://localhost:5000`. As requisições e respostas usam JSON; o CORS está configurado para aceitar qualquer origem.

As rotas CRUD e de usuário acessam o banco pelo Prisma Client compartilhado em `prisma.js`. O projeto não executa migrations automaticamente nem altera o banco ao iniciar.

## Recursos e endpoints

Exceto onde indicado, os recursos CRUD oferecem:

| Método | Caminho | Descrição |
| --- | --- | --- |
| `GET` | `/recurso` | Lista os registros |
| `GET` | `/recurso/:id` | Busca um registro pelo ID |
| `POST` | `/recurso` | Cria um registro |
| `PATCH` | `/recurso/:id` | Atualiza os campos enviados |
| `DELETE` | `/recurso/:id` | Remove um registro |

Os campos abaixo são aceitos nos corpos de `POST` e `PATCH`. Campos de ID e timestamps são gerados ou mantidos pelo banco de dados.

| Recurso | ID | Campos |
| --- | --- | --- |
| `/categoria` | `id_categoria` | `nome`, `descricao`, `ativo` |
| `/cliente` | `id_cliente` | `nome`, `email`, `contato`, `ativo` |
| `/entrada` | `id_entrada` | `id_produto`, `id_fornecedor`, `quantidade`, `valor_unitario`, `data_entrada`, `observacao` |
| `/estoque` | `id_estoque` | `id_produto`, `quantidade`, `estoque_minimo`, `estoque_maximo`, `localizacao` |
| `/fornecedor` | `id_fornecedor` | `nome`, `empresa`, `email`, `telefone`, `cidade`, `estado`, `ativo` |
| `/funcionario` | `id_funcionario` | `nome`, `cargo`, `salario`, `telefone`, `email`, `data_admissao`, `ativo` |
| `/historico-precos` | `id_historico` | `id_produto`, `preco`, `vigencia` |
| `/log` | `id_log` | `usuario`, `tabela_afetada`, `acao`, `registro`, `data_hora` |
| `/movimentacao` | `id_movimentacao` | `id_produto`, `tipo`, `quantidade`, `data_movimentacao`, `observacao` |
| `/pedido` | `id_pedido` | `status`, `data_pedido`, `id_cliente` |
| `/pedido-item` | `id_item` | `id_pedido`, `id_produto`, `quantidade`, `valor_unitario`, `subtotal` |
| `/produto` | `id_produto` | `nome`, `descricao`, `preco`, `imagem_produto`, `id_categoria` |
| `/saida` | `id_saida` | `id_produto`, `id_funcionario`, `quantidade`, `valor_unitario`, `data_saida`, `destino` |
| `/usuario` | `id_usu` | Endpoints descritos abaixo |

Nos demais recursos, `PATCH` altera apenas os campos reconhecidos que forem enviados. Se nenhum campo válido for enviado, retorna `400`.

## Usuários e login

| Método | Caminho | Descrição |
| --- | --- | --- |
| `GET` | `/usuario` | Lista usuários sem incluir as senhas |
| `GET` | `/usuario/:id` | Busca usuário pelo ID sem incluir a senha |
| `POST` | `/usuario` | Cadastra usuário |
| `PATCH` | `/usuario/:id` | Atualiza nome, email e senha |
| `DELETE` | `/usuario/:id` | Remove usuário |
| `POST` | `/usuario/login` | Autentica o usuário pelo email e senha |

O cadastro aceita `nome`, `email`, `senha`, `contato`, `genero` e `ativo`. O `PATCH` de usuário é uma implementação específica e espera `nome`, `email` e `senha`; ele não tem o comportamento parcial dos demais recursos.

Exemplo de login:

```http
POST /usuario/login
Content-Type: application/json
```

```json
{
  "email": "usuario@exemplo.com",
  "senha": "sua_senha"
}
```

Com sucesso, a resposta contém `mensagem`, `token` JWT com validade de 8 horas e os dados do usuário sem a senha. Usuários inativos não podem autenticar. O login atualmente reconhece hashes bcrypt e também senhas armazenadas em texto puro para compatibilidade com os dados existentes.

Os endpoints CRUD não exigem nem validam o token JWT atualmente. O token emitido pelo login, portanto, ainda não protege as demais rotas.

## Exemplo de criação

```http
POST /produto
Content-Type: application/json
```

```json
{
  "nome": "Detergente",
  "descricao": "Detergente líquido 500ml",
  "preco": 3.5,
  "imagem_produto": "https://exemplo.com/detergente.jpg",
  "id_categoria": 1
}
```

## Respostas e observações

- `200`: consulta concluída ou login realizado.
- `201`: registro criado.
- `202`: atualização ou remoção aceita.
- `400`: dados necessários ausentes ou nenhum campo válido para `PATCH`.
- `401`: credenciais inválidas ou usuário inativo.
- `404`: rota ou registro não encontrado, conforme o endpoint.
- `500`: erro de conexão, banco de dados ou configuração do servidor.

Entradas e saídas também têm efeitos definidos por triggers no SQL: inserir uma entrada acrescenta a quantidade ao estoque; inserir uma saída subtrai a quantidade do registro de estoque correspondente. Esses efeitos dependem dos triggers estarem instalados no banco.

Os erros de banco retornados pela API podem incluir detalhes internos. Em ambiente de produção, configure mensagens de erro genéricas e evite expor esses detalhes ao cliente.

## Frontend

O painel administrativo em Vite consome a API publicada em `https://backend-bse5.onrender.com` por padrão. Para executá-lo localmente, use Node.js e rode na pasta do projeto:

```bash
npm install
npm run dev
```

O painel apresenta indicadores e permite consultar, cadastrar, editar e remover produtos, categorias, estoque, clientes, fornecedores, funcionários, entradas, saídas, pedidos e movimentações. O endereço da API pode ser alterado pelo controle de conexão no rodapé da navegação. As rotas mostram os erros retornados pela API sem interromper as demais seções.

No momento, `GET /pedido` retorna erro 500 porque há registros com `status` numérico, incompatível com o tipo `String` esperado pelo Prisma. A seção de pedidos exibe esse erro até que os dados ou o schema da API sejam corrigidos.