# 📚 AGENTE 5: DOCUMENTATION & CODE QUALITY


## 🎯 TAREFAS DETALHADAS

### ✅ TODO 6.1: Adicionar API Documentation (Swagger)

**Objetivo**: Documentação completa e interativa da API

**Por que é Importante**:
- Frontend precisa saber endpoints disponíveis
- Novos devs onboarding mais rápido
- Clientes podem integrar facilmente
- Testes manuais via Swagger UI

**Passos**:

**1. Configurar Swagger no main.ts**:

Ficheiro: `apps/backend/src/main.ts`

Adicionar:
- DocumentBuilder
- SwaggerModule.createDocument
- SwaggerModule.setup('/api/docs')
- Configurar Bearer Auth
- Adicionar tags para organização

**2. Documentar Controllers**:

Para CADA controller, adicionar:
- `@ApiTags('nome-modulo')` - Organiza endpoints por módulo
- `@ApiOperation({ summary: '...' })` - Descrição do endpoint
- `@ApiResponse()` - Possíveis respostas (200, 201, 400, 401, 404)
- `@ApiBearerAuth()` - Indica que precisa autenticação
- `@ApiParam()` - Documenta path params
- `@ApiQuery()` - Documenta query params

**Exemplo de Controller Documentado**:
```typescript
@ApiTags('players')
@Controller('players')
export class PlayersController {
  
  @Post()
  @ApiOperation({ summary: 'Create a new player' })
  @ApiResponse({ 
    status: 201, 
    description: 'Player created successfully',
    type: PlayerEntity,
  })
  @ApiResponse({ status: 400, description: 'Invalid input data' })
  @ApiResponse({ status: 401, description: 'Unauthorized' })
  @ApiBearerAuth()
  async create(@Body() dto: CreatePlayerDto) {
    // ...
  }
  
  @Get()
  @ApiOperation({ summary: 'List all players of the club' })
  @ApiQuery({ name: 'teamId', required: false, description: 'Filter by team' })
  @ApiQuery({ name: 'status', required: false, enum: PlayerStatus })
  @ApiQuery({ name: 'skip', required: false, type: Number, example: 0 })
  @ApiQuery({ name: 'take', required: false, type: Number, example: 20 })
  @ApiResponse({ status: 200, description: 'List of players', type: [PlayerEntity] })
  @ApiBearerAuth()
  async findAll(@Query() query: ListPlayersDto) {
    // ...
  }
  
  @Get(':id')
  @ApiOperation({ summary: 'Get player by ID' })
  @ApiParam({ name: 'id', description: 'Player UUID' })
  @ApiResponse({ status: 200, description: 'Player found', type: PlayerEntity })
  @ApiResponse({ status: 404, description: 'Player not found' })
  @ApiBearerAuth()
  async findOne(@Param('id') id: string) {
    // ...
  }
}
```

**3. Documentar DTOs**:

Para CADA DTO, adicionar:
- `@ApiProperty()` - Documenta cada campo
- Exemplos práticos
- Descrições claras
- Indicar campos opcionais

**Exemplo de DTO Documentado**:
```typescript
export class CreatePlayerDto {
  @ApiProperty({ 
    example: 'João Silva',
    description: 'Full name of the player',
  })
  @IsString()
  @MinLength(3)
  name: string;
  
  @ApiProperty({ 
    example: '2010-05-15',
    description: 'Birth date in ISO format',
  })
  @IsDateString()
  birthDate: string;
  
  @ApiProperty({ 
    example: 'parent@example.com',
    description: 'Email of the parent/guardian',
  })
  @IsEmail()
  parentEmail: string;
  
  @ApiProperty({ 
    example: '+351912345678',
    description: 'Phone number with country code',
    required: false,
  })
  @IsOptional()
  @IsString()
  parentPhone?: string;
  
  @ApiProperty({ 
    enum: PlayerPosition,
    example: PlayerPosition.MIDFIELDER,
    description: 'Playing position',
  })
  @IsEnum(PlayerPosition)
  position: PlayerPosition;
}
```

**4. Criar Entities para Response**:

Para mostrar estrutura de resposta no Swagger:

Ficheiro: `apps/backend/src/modules/players/entities/player.entity.ts`

```typescript
export class PlayerEntity {
  @ApiProperty({ example: '123e4567-e89b-12d3-a456-426614174000' })
  id: string;
  
  @ApiProperty({ example: 'João Silva' })
  name: string;
  
  @ApiProperty({ example: '2010-05-15' })
  birthDate: Date;
  
  @ApiProperty({ enum: PlayerStatus, example: PlayerStatus.ACTIVE })
  status: PlayerStatus;
  
  @ApiProperty({ example: 'parent@example.com' })
  email: string;
  
  // ... outros campos
}
```

**5. Módulos a Documentar** (TODOS):
- ✅ Auth (login, register, refresh, me)
- ✅ Clubs (create, update, settings)
- ✅ Users (CRUD, roles)
- ✅ Players (CRUD, terminate, add to team)
- ✅ Teams (CRUD, roster)
- ✅ Trainings (CRUD, finalize, attendance)
- ✅ Payments (CRUD, webhooks, overdue)
- ✅ Matches (CRUD, results)
- ✅ Upload (file upload)
- ✅ Absence Notices (CRUD, approve, dismiss)

**Ficheiros a Modificar**:
- `apps/backend/src/main.ts`
- Todos os controllers em `apps/backend/src/modules/*/`
- Todos os DTOs em `apps/backend/src/modules/*/dto/`
- Criar entities em `apps/backend/src/modules/*/entities/`

**Validação**:
1. Iniciar app: `npm run backend:dev`
2. Aceder: `http://localhost:3000/api/docs`
3. Verificar todos os endpoints aparecem
4. Testar endpoints via Swagger UI
5. Verificar exemplos estão corretos
6. Testar autenticação funciona (Authorize button)

**Target**: 100% dos endpoints documentados

---

### ✅ TODO 6.2: Code Quality - ESLint Rules Adicionais

**Objetivo**: Prevenir bugs através de regras mais rigorosas

**Por que é Importante**:
- Catch bugs antes de runtime
- Código mais consistente
- Melhora maintainability
- Força boas práticas

**Passos**:

**1. Atualizar .eslintrc.js**:

Ficheiro: `apps/backend/.eslintrc.js`

Adicionar regras:

```javascript
module.exports = {
  // ... configuração existente
  
  rules: {
    // === Regras Existentes (manter) ===
    '@typescript-eslint/no-explicit-any': 'error',
    
    // === Novas Regras ===
    
    // Variáveis não utilizadas
    '@typescript-eslint/no-unused-vars': ['error', {
      argsIgnorePattern: '^_',  // permite _param não usado
      varsIgnorePattern: '^_',
    }],
    
    // Return type explícito em funções
    '@typescript-eslint/explicit-function-return-type': ['warn', {
      allowExpressions: true,
      allowTypedFunctionExpressions: true,
    }],
    
    // Limite de linhas por função
    'max-lines-per-function': ['warn', {
      max: 50,
      skipBlankLines: true,
      skipComments: true,
    }],
    
    // Complexidade ciclomática (previne funções muito complexas)
    'complexity': ['warn', 10],
    
    // Profundidade máxima de nesting
    'max-depth': ['error', 3],
    
    // Número máximo de parâmetros
    'max-params': ['warn', 4],
    
    // Prefer const
    'prefer-const': 'error',
    
    // No console.log em produção
    'no-console': ['warn', { allow: ['warn', 'error'] }],
    
    // No var
    'no-var': 'error',
    
    // Require await em async functions
    'require-await': 'warn',
    
    // No return await
    'no-return-await': 'error',
    
    // Consistent return
    'consistent-return': 'warn',
  },
};
```

**2. Executar Lint e Corrigir Warnings**:

```bash
# Ver problemas
npm run lint

# Auto-fix o que for possível
npm run lint -- --fix

# Ver apenas erros (ignorar warnings)
npm run lint -- --quiet
```

**3. Corrigir Problemas Comuns**:

**Unused vars**:
- Remover variáveis declaradas mas não usadas
- Ou prefixar com `_` se intencionalmente não usado: `_unusedParam`

**Complex functions**:
- Dividir funções grandes em funções menores
- Extrair lógica para métodos privados

**Deep nesting**:
- Early return para reduzir nesting
- Extrair condições para variáveis

**Console.log**:
- Substituir por logger (Winston)
- Remover debug logs

**4. Configurar Pre-commit Hook** (Opcional):

Instalar husky + lint-staged:
```bash
npm install -D husky lint-staged
```

Configurar para rodar lint antes de commit:
```json
{
  "lint-staged": {
    "*.ts": ["eslint --fix", "git add"]
  }
}
```

**Ficheiros a Modificar**:
- `apps/backend/.eslintrc.js`
- Vários ficheiros após executar lint

**Validação**:
- `npm run lint` não deve ter erros
- Warnings devem ser mínimos (<10)
- Build deve passar: `npm run build`

---

### ✅ TODO 6.3: Remover Código Não Utilizado

**Objetivo**: Limpar código morto e reduzir complexity

**Por que é Importante**:
- Reduz cognitive load
- Facilita manutenção
- Reduz bundle size
- Remove confusion

**Passos**:

**1. Análise com ts-prune**:

```bash
# Instalar ferramenta
npx ts-prune

# Ou adicionar ao package.json
npm install -D ts-prune
```

Executar e analisar output:
```bash
npx ts-prune | grep -v test
```

Isto mostra:
- Exports não utilizados
- Imports não utilizados
- Funções/classes não referenciadas

**2. Ativar Regras TypeScript**:

Ficheiro: `apps/backend/tsconfig.json`

```json
{
  "compilerOptions": {
    // ... existente
    "noUnusedLocals": true,
    "noUnusedParameters": true,
  }
}
```

**3. O Que Remover**:

**Imports não utilizados**:
```typescript
// ANTES
import { Injectable, Logger, BadRequestException } from '@nestjs/common';
// Logger e BadRequestException não usados

// DEPOIS
import { Injectable } from '@nestjs/common';
```

**Funções não usadas**:
- Verificar se função é chamada em algum lugar
- Se não, remover
- Cuidado: pode ser usado dinamicamente (raro)

**DTOs obsoletos**:
- DTOs antigos de features removidas
- DTOs duplicados

**Interfaces não utilizadas**:
- Interfaces definidas mas não implementadas

**Comentários antigos**:
- Commented-out code
- TODOs resolvidos

**4. O Que NÃO Remover**:

**Exports públicos da API**:
- Mesmo que não usados internamente, podem ser usados por clientes

**Código de migration**:
- Scripts de database migration

**Utilities que podem ser úteis**:
- Helper functions genéricos

**Tests**:
- Ficheiros *.spec.ts (mesmo que feature foi removida, manter histórico)

**5. Verificar Após Remover**:

```bash
# Build deve passar
npm run build

# Tests devem passar
npm test

# Linter deve passar
npm run lint

# App deve iniciar
npm run backend:dev
```

**Ficheiros a Modificar**:
- `apps/backend/tsconfig.json`
- Vários ficheiros após análise (controllers, services, DTOs, utils)

**Validação**:
- Sem imports não utilizados
- Sem funções órfãs
- Build passa
- Tests passam
- App funciona normalmente

---

## 📊 CHECKLIST DE PROGRESSO

- [x] TODO 6.1: Swagger Documentation
  - [x] main.ts configurado
  - [x] Auth module documentado
  - [x] Clubs module documentado
  - [x] Users module documentado
  - [x] Players module documentado
  - [x] Teams module documentado
  - [x] Trainings module documentado
  - [x] Payments module documentado
  - [x] Matches module documentado
  - [x] Upload module documentado
  - [x] Absence Notices module documentado
  - [x] Entities criadas para responses
  - [x] Swagger UI testado e funcional
  
- [x] TODO 6.2: ESLint Rules
  - [x] .eslintrc.js atualizado
  - [x] Lint executado
  - [x] Warnings corrigidos
  - [x] Erros corrigidos
  - [x] Build passa
  
- [x] TODO 6.3: Remover Código Não Utilizado
  - [x] ts-prune executado
  - [x] tsconfig.json atualizado
  - [x] Imports não utilizados removidos
  - [x] Funções não utilizadas removidas
  - [x] DTOs obsoletos removidos
  - [x] Build passa
  - [x] Tests passam

---

## ⚠️ AVISOS IMPORTANTES

1. **Swagger**: Documentação incompleta é pior que nenhuma. Documenta TUDO ou não documentes.

2. **ESLint**: Introduzir regras novas pode gerar centenas de warnings. Faz incremental:
   - Primeiro adiciona regras como 'warn'
   - Corrige aos poucos
   - Depois muda para 'error'

3. **Remover Código**: SEMPRE confirma que código não é usado antes de remover. Git permite reverter, mas é trabalho extra.

4. **Breaking Changes**: Documentação e linting não devem quebrar funcionalidade. Testa bem!

5. **DTOs**: Ao documentar DTOs, verifica se validação está correta.

---

## 🎯 ORDEM SUGERIDA DE EXECUÇÃO

1. **TODO 6.1: Swagger** (PRIMEIRO - dá visibilidade da API)
2. **TODO 6.2: ESLint** (SEGUNDO - força boas práticas)
3. **TODO 6.3: Cleanup** (TERCEIRO - remove lixo)

**Tempo Estimado Total**: 6-8 horas

---

## 📈 COMANDOS ÚTEIS

```bash
# Swagger
npm run backend:dev
# Abrir http://localhost:3000/api/docs

# ESLint
npm run lint
npm run lint -- --fix

# TypeScript check
npx tsc --noEmit

# ts-prune
npx ts-prune

# Build
npm run build

# Tests
npm test
```

---

## 💡 DICAS

1. **Swagger UI**: Usa para testar endpoints manualmente. É muito útil!

2. **Exemplos Reais**: Em `@ApiProperty`, usa exemplos realistas que façam sentido.

3. **Incremental**: Não tentes documentar tudo de uma vez. Faz módulo por módulo.

4. **Consistency**: Mantém estilo consistente em toda a documentação.

5. **Screenshots**: Tira screenshots do Swagger final para documentação (README).

---

## 🎨 ESTRUTURA FINAL ESPERADA

**Swagger UI deve ter**:
- Tags organizadas por módulo
- Todas as rotas listadas
- Exemplos de request/response
- Botão "Authorize" funcionando
- Schemas bem definidos
- Descrições claras

**Código deve ter**:
- Zero erros de lint
- Mínimo de warnings (<10)
- Sem imports não usados
- Sem funções órfãs
- Sem código comentado

**Resultado**:
API profissional, bem documentada e código limpo!

---

## 🏁 STATUS FINAL & PRÓXIMOS PASSOS

### ✅ Estado Atual

- **API Documentation**: Swagger totalmente implementado e funcional em `/api/docs`. Todos os módulos documentados.
- **Code Quality**: ESLint configurado com regras estritas. 0 erros de linting no projeto.
- **Code Cleanup**: `ts-prune` executado, DTOs não utilizados removidos, código morto limpo.

### 📝 O Que Falta Fazer

- **Nenhum item pendente** do plano original deste agente.

### 🚀 Próximos Passos Sugeridos

1.  **Testes de Integração**: Com a API estável e documentada, focar em aumentar a cobertura de testes de integração (AGENT4: TESTING - FEATURES).
2.  **Infraestrutura**: Preparar deployment e CI/CD pipelines (AGENT1: INFRASTRUCTURE & DEVOPS).
3.  **Performance Tuning**: Analisar queries do banco de dados e otimizar endpoints críticos (AGENT2: DATABASE & PERFORMANCE).