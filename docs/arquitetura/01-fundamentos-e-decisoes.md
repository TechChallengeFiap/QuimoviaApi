# Arquitetura do Quimovia — Fundamentos e decisões

Este é o primeiro de dois documentos sobre a arquitetura do Quimovia.

| Documento | Pergunta que responde |
| --- | --- |
| **01 — Fundamentos e decisões** (este) | O que é a arquitetura adotada, que problemas ela resolve e por que foi escolhida? |
| [02 — Organização e aplicação no projeto](./02-organizacao-e-aplicacao.md) | Como esses conceitos viram pastas, módulos, providers e regras de código no repositório? |

Este documento é conceitual de propósito. Ele usa exemplos pontuais em NestJS, TypeScript e Prisma, mas não descreve a árvore de pastas nem o estado atual do código: isso está no documento 02. Se você precisa saber agora **onde** criar um arquivo, vá para o 02. Se quer entender **por que** ele fica lá, comece por aqui.

## Sumário

1. [O problema que a arquitetura resolve](#1-o-problema-que-a-arquitetura-resolve)
2. [Visão geral: cinco ideias com papéis diferentes](#2-visão-geral-cinco-ideias-com-papéis-diferentes)
3. [Domain-Driven Design (DDD)](#3-domain-driven-design-ddd)
4. [Clean Architecture](#4-clean-architecture)
5. [Monólito Modular](#5-monólito-modular)
6. [Inversão de Dependência (DIP)](#6-inversão-de-dependência-dip)
7. [Injeção de Dependência (DI)](#7-injeção-de-dependência-di)
8. [Como os conceitos trabalham juntos](#8-como-os-conceitos-trabalham-juntos)
9. [A arquitetura na stack do projeto](#9-a-arquitetura-na-stack-do-projeto)
10. [Decisões arquiteturais e trade-offs](#10-decisões-arquiteturais-e-trade-offs)
11. [Glossário](#11-glossário)
12. [Referências](#12-referências)

---

## 1. O problema que a arquitetura resolve

O Quimovia controla o ciclo de vida de cargas químicas num pátio portuário. É um domínio em que uma regra mal aplicada tem consequência real. Uma carga liberada sem documentação, um produto incompatível armazenado no lugar errado ou uma inspeção concluída sem todas as verificações são falhas de negócio, não apenas bugs.

Algumas características desse domínio orientam a arquitetura:

- **As regras são o ativo mais importante do sistema.** Elas precisam ser fáceis de encontrar, de testar e de alterar com segurança.
- **As regras mudam por fatores externos**, como normas, fiscalização e procedimentos do porto, e não por mudanças de tecnologia.
- **Há várias áreas com vocabulário próprio.** Cargas, catálogo de produtos, documentação, inspeções e controle de acesso usam palavras parecidas com significados diferentes.
- **Várias pessoas trabalham no código ao mesmo tempo**, e o sistema precisa continuar compreensível conforme cresce.

Sem uma arquitetura deliberada, os sintomas costumam ser estes:

| Sintoma | Causa |
| --- | --- |
| A regra de liberação de carga está espalhada entre controller, service e query SQL | A regra não tem um dono nem um lugar definido |
| Trocar o ORM ou a forma de autenticação obriga a mexer em regra de negócio | A regra depende diretamente de detalhes técnicos |
| Testar uma regra exige subir o servidor e o banco | A regra está acoplada à infraestrutura |
| Uma alteração no cadastro de usuários quebra o fluxo de cargas | Uma área acessa os detalhes internos da outra |
| Ninguém sabe onde colocar um código novo | Falta um critério de organização |
| "Separar em microsserviços" vira uma reescrita | As fronteiras nunca existiram no código |

A arquitetura descrita aqui é um conjunto de decisões para evitar esses sintomas. Cada decisão ataca uma causa diferente, e por isso usamos mais de um conceito ao mesmo tempo.

---

## 2. Visão geral: cinco ideias com papéis diferentes

A arquitetura do Quimovia combina três abordagens arquiteturais com um princípio de design e um mecanismo de implementação. É comum confundi-los. A tabela abaixo separa o papel de cada um.

| Conceito | Natureza | Pergunta que responde | Onde atua |
| --- | --- | --- | --- |
| **DDD** | Abordagem de modelagem | Quais partes o negócio tem, onde ficam as fronteiras entre elas e que linguagem cada uma usa? | Negócio e modelo |
| **Monólito Modular** | Estilo de sistema e de implantação | Como essas partes convivem num único sistema sem se misturar? | Sistema inteiro |
| **Clean Architecture** | Estilo de organização do código | Dentro de cada parte, o que pode depender do quê? | Dentro de cada módulo |
| **DIP** | Princípio de design | Como uma regra usa um recurso técnico sem depender dele? | Fronteiras entre camadas e entre módulos |
| **DI** | Mecanismo de implementação | Quem cria os objetos e entrega a cada um as suas dependências? | Tempo de execução |

Eles se encaixam em sequência:

```text
DDD                    descobre AS FRONTEIRAS do negócio (contextos) e o MODELO de cada uma
 └─ Monólito Modular   transforma cada contexto em um MÓDULO isolado, num único sistema
     └─ Clean Arch.    organiza cada módulo em CAMADAS, com dependências apontando para dentro
         └─ DIP        permite manter essa direção quando a regra precisa de um recurso externo
             └─ DI     entrega, em tempo de execução, a implementação concreta de cada recurso
```

Uma observação que vale para todo o documento: **nenhum desses conceitos é uma estrutura de pastas.** As pastas são a parte visível das decisões. É possível ter as pastas `domain/`, `application/`, `infrastructure/` e `presentation/` e violar todas as regras, assim como é possível respeitá-las com outra organização. O que define a arquitetura é a direção das dependências e o lugar onde cada responsabilidade está.

---

## 3. Domain-Driven Design (DDD)

### 3.1. O que é

O DDD foi proposto por Eric Evans em 2003. A premissa é que, em sistemas com regras de negócio complexas, a parte mais difícil não é a tecnologia, e sim entender e representar corretamente o domínio. Por isso o código deve refletir o modelo do negócio, construído em conjunto com quem conhece o negócio.

O DDD tem duas partes:

- **Design estratégico:** como dividir o domínio em partes com fronteiras claras e como essas partes se relacionam.
- **Design tático:** como modelar o interior de cada parte, com entidades, objetos de valor, agregados, repositórios etc.

A parte estratégica é a mais importante. Aplicar só a parte tática, criando pastas `entities/` e `value-objects/` sem fronteiras bem definidas, produz código com cara de DDD e sem os benefícios.

### 3.2. Linguagem ubíqua

A linguagem ubíqua é o vocabulário comum entre o negócio e o código. Se o negócio diz "liberar a carga", o código deve ter uma operação com esse significado, como `release()`, e não algo genérico como `updateStatus(5)`.

Quando o código usa palavras diferentes das do negócio, cada leitura exige uma tradução mental, e as traduções erradas viram bugs. No Quimovia o código está em inglês e a documentação em português. A regra, então, é manter um glossário com correspondência um para um (o documento 02 traz esse glossário) e usar **um único nome para cada conceito**. Se a mesma "carga" aparece como `shipment` num lugar e `cargo` em outro, quem lê vai supor que são dois conceitos diferentes.

### 3.3. Bounded contexts

Um modelo só é válido dentro de uma fronteira. Essa fronteira é o **bounded context** (contexto delimitado).

Um exemplo do próprio Quimovia é a palavra "usuário":

- Em **Identidade e Acesso**, usuário tem e-mail, hash de senha, perfil, situação (ativo, inativo, bloqueado) e sessões.
- Em **Gestão de Cargas**, o que importa é o **responsável** pela carga: quem responde por ela. Senha e sessões são irrelevantes aqui.
- Em **Inspeções**, a mesma pessoa aparece como **fiscal**, identificado pelo seu ID.

Tentar criar uma única classe `User` que sirva aos três contextos produz um modelo enorme, que todos alteram e ninguém controla. Com contextos delimitados, cada contexto tem o seu modelo e a sua linguagem, e as traduções acontecem na fronteira entre eles.

O mesmo vale para "produto". No catálogo de **Produtos Químicos**, o produto tem número ONU, classe de risco, grupo de compatibilidade e requisitos. Numa carga, o que interessa é o item: qual produto, em que quantidade e em que embalagem.

Um bounded context não é uma entidade, nem uma tabela, nem uma pasta. No Quimovia, decidimos que **cada contexto vira um módulo** (seção 5), mas a fronteira é conceitual antes de ser física.

### 3.4. Os contextos do Quimovia

| Contexto | Responsabilidade | Conceitos centrais | Tipo de subdomínio |
| --- | --- | --- | --- |
| **Gestão de Cargas** | Ciclo de vida da carga química, do registro à liberação ou bloqueio | Carga, itens, composição, situação, responsável | Principal (*core*): é o que diferencia o sistema |
| **Produtos Químicos** | Catálogo de produtos e suas características de risco | Produto, número ONU, classe de risco, grupo de compatibilidade | De suporte |
| **Conformidade Documental** | Documentos exigidos para cada carga, validade e parecer | Documento, exigência documental, parecer | De suporte, próximo do principal |
| **Inspeções** | Vistoria física da carga ou de um item | Inspeção, verificações, resultado, fiscal | De suporte, próximo do principal |
| **Identidade e Acesso** | Usuários, perfis, autenticação e sessões | Usuário, perfil, sessão | Genérico: todo sistema precisa, e há soluções conhecidas |

A classificação orienta o investimento. O subdomínio principal recebe a modelagem mais cuidadosa, com regras explícitas e testes completos. Um subdomínio genérico pode seguir padrões conhecidos sem muita invenção. Conformidade Documental e Inspeções estão próximos do principal porque alimentam a decisão de liberar ou bloquear a carga.

### 3.5. Mapa de contextos

O mapa de contextos mostra como os contextos se relacionam. Um contexto **fornecedor** (*upstream*) disponibiliza informação. Um contexto **consumidor** (*downstream*) depende dela.

```text
                     Identidade e Acesso
               (quem é o usuário e qual o seu perfil)
                              │
                              │ identidade e perfil, para todos os contextos
                              ▼
  Produtos Químicos ──────► Gestão de Cargas ──────► Conformidade Documental
   dados do produto       (decide a liberação)  ──► Inspeções
                                  ▲                        │
                                  └── pareceres e resultados ┘
```

| Fornecedor | Consumidor | O que flui |
| --- | --- | --- |
| Identidade e Acesso | Todos | Quem é o usuário autenticado e qual o seu perfil |
| Produtos Químicos | Gestão de Cargas, Conformidade Documental, Inspeções | Situação, classe de risco e requisitos do produto |
| Gestão de Cargas | Conformidade Documental, Inspeções | A carga a ser avaliada, com a versão da composição |
| Conformidade Documental | Gestão de Cargas | Parecer documental |
| Inspeções | Gestão de Cargas | Resultado da inspeção |

O mapa é uma visão de negócio. Os mecanismos técnicos dessa comunicação (consultas, contratos públicos, eventos) são definidos no documento 02.

### 3.6. Blocos de construção táticos

| Bloco | O que é | Exemplo no domínio | Sinal de que é o bloco certo |
| --- | --- | --- | --- |
| **Entidade** | Objeto com identidade própria e ciclo de vida. Duas entidades são iguais se têm o mesmo ID | Inspeção, Usuário, Sessão | O objeto muda ao longo do tempo e precisa ser rastreado |
| **Value Object** | Objeto definido pelos seus valores, imutável e que se valida sozinho | Item de inspeção (verificação + resultado), número ONU, quantidade | Dois objetos com os mesmos valores são intercambiáveis |
| **Agregado** | Grupo de objetos tratado como uma unidade de consistência, acessado sempre pela sua raiz | Inspeção com seus itens | Existe uma regra que envolve vários objetos ao mesmo tempo |
| **Serviço de domínio** | Regra de negócio que envolve vários objetos e não pertence a nenhum deles | Compatibilidade entre produtos de uma mesma carga | A regra tem nome no negócio, mas não tem um "dono" natural |
| **Repositório** | Abstração de uma coleção de agregados, com operações como buscar e salvar | Repositório de inspeções | É preciso obter ou guardar um agregado |
| **Evento de domínio** | Fato relevante que já aconteceu, nomeado no passado | Inspeção concluída | Outra parte do sistema precisa reagir ao fato |
| **Erro de domínio** | Violação de uma regra de negócio, sem nenhuma noção de HTTP | Inspeção concluída não pode ser alterada | A operação é proibida pelas regras do negócio |

Não é preciso usar todos os blocos em todos os contextos. Use cada um quando existir a regra ou a necessidade que ele resolve.

### 3.7. Agregados

O agregado é o conceito tático mais importante, porque é ele que garante as regras. Quatro orientações guiam o seu desenho:

1. **O agregado protege as invariantes.** Uma invariante é uma regra que precisa ser verdadeira sempre. Por exemplo: "uma inspeção só é concluída quando todas as verificações têm resultado". Essa regra só pode ser garantida se toda alteração passar pela raiz do agregado, que verifica a condição antes de mudar o estado.
2. **O agregado deve ser pequeno.** Ele inclui apenas o que precisa mudar junto para manter as invariantes.
3. **Outros agregados são referenciados pelo ID, não pelo objeto.** A inspeção guarda `cargoId`, e não um objeto `Carga`. Isso evita carregar e travar um grafo enorme de objetos e permite que o outro agregado viva em outro contexto, em outro banco ou em outro serviço.
4. **Uma transação altera um agregado.** Esse é o padrão. A consistência entre agregados diferentes é obtida por orquestração ou por eventos, aceitando que ela pode não ser imediata (consistência eventual).

As entidades do projeto distinguem duas formas de criação:

- **`create()`** cria um objeto novo. Ela valida os dados e aplica as regras de nascimento (por exemplo, toda inspeção nasce pendente).
- **`restore()`** reconstrói um objeto já persistido, sem revalidar. O estado era válido quando foi salvo, e as regras de criação não se aplicam a um objeto que já existe.

### 3.8. Modelo rico e modelo anêmico

Num **modelo anêmico**, a entidade é só um conjunto de dados com getters e setters, e as regras ficam em services, controllers ou queries:

```ts
// Anêmico: qualquer código pode colocar a carga em qualquer situação
shipment.status = 'RELEASED';
await repository.update(shipment);
```

Num **modelo rico**, o estado é privado e só muda por métodos que expressam intenções do negócio e verificam as regras:

```ts
// Rico: a entidade decide se a transição é permitida
shipment.release(); // lança BusinessRuleError se a carga não puder ser liberada
await repository.update(shipment);
```

No modelo anêmico, cada lugar que altera a situação precisa lembrar de verificar a regra. Com o tempo, a regra é duplicada, esquecida ou aplicada de formas diferentes. No modelo rico, a regra tem um único lugar e não pode ser contornada.

### 3.9. O que DDD não é

- Não é criar pastas `entities/` e `value-objects/`.
- Não é criar um módulo por tabela ou por entidade.
- Não exige todos os padrões táticos. Um cadastro simples, sem regras, pode ter um modelo simples.
- Não é só sobre código. É sobre construir um modelo compartilhado com quem entende do negócio.

---

## 4. Clean Architecture

### 4.1. O que é

A Clean Architecture foi descrita por Robert C. Martin. Ela separa **políticas** (as regras de negócio) de **detalhes** (framework web, banco de dados, ORM, bibliotecas, formato de token). A ideia central cabe numa frase, a **regra de dependência**:

> As dependências do código-fonte apontam sempre para dentro, em direção às políticas. Nada que está num círculo interno conhece algo de um círculo externo.

```text
┌──────────────────────────────────────────────────────────────────┐
│  Frameworks e drivers: NestJS (HTTP), Prisma Client, MySQL, JWT   │
│  ┌────────────────────────────────────────────────────────────┐  │
│  │  Adaptadores: controllers, DTOs HTTP, guards,              │  │
│  │  repositórios Prisma, mappers, serviços técnicos           │  │
│  │  ┌──────────────────────────────────────────────────────┐  │  │
│  │  │  Casos de uso (Application)                          │  │  │
│  │  │  ┌────────────────────────────────────────────────┐  │  │  │
│  │  │  │  Domínio: entidades, value objects, regras,    │  │  │  │
│  │  │  │  contratos de repositório                      │  │  │  │
│  │  │  └────────────────────────────────────────────────┘  │  │  │
│  │  └──────────────────────────────────────────────────────┘  │  │
│  └────────────────────────────────────────────────────────────┘  │
└──────────────────────────────────────────────────────────────────┘
                 as dependências de código apontam para dentro
```

Por que essa direção? Porque o que está dentro muda por motivos de negócio, e o que está fora muda por motivos técnicos. Se o domínio dependesse do Prisma, uma atualização do Prisma poderia quebrar regras de negócio. Com a dependência invertida, trocar o Prisma afeta apenas o círculo externo.

### 4.2. As quatro camadas adotadas

O projeto organiza cada módulo em quatro camadas, que correspondem aos círculos da Clean Architecture:

| Camada | Círculo | Responsabilidade | Pergunta-teste |
| --- | --- | --- | --- |
| **Domain** | Entidades | Regras e invariantes do negócio | Esta regra continuaria existindo se trocássemos o NestJS, o HTTP e o banco? |
| **Application** | Casos de uso | Orquestrar uma ação do sistema: buscar, acionar o domínio, salvar, coordenar recursos | Isto descreve uma ação pedida por um usuário ou por outro sistema? |
| **Presentation** | Adaptadores de entrada | Traduzir HTTP em chamadas de caso de uso e o resultado de volta em HTTP | Isto só existe porque a API é HTTP? |
| **Infrastructure** | Adaptadores de saída e drivers | Implementar, com uma tecnologia, os recursos de que o domínio e a aplicação precisam | Isto é o "como" técnico de algo que a regra pediu? |

Presentation e Infrastructure estão no mesmo círculo: ambas são adaptadores. A diferença é a direção. A presentation **aciona** a aplicação (entrada). A infrastructure **é acionada** por ela (saída). Por isso um controller não deve chamar um repositório Prisma diretamente: são vizinhos que só se encontram por meio da aplicação.

**Domain.** É o núcleo. Contém entidades, value objects, enums, erros de domínio, serviços de domínio e os contratos de repositório. Não conhece NestJS, Prisma, HTTP nem outros contextos. É a camada mais estável e a mais testada.

**Application.** Cada caso de uso representa uma ação: "cadastrar inspeção", "validar sessão", "atualizar usuário". O caso de uso busca os agregados pelos contratos de repositório, aciona os métodos do domínio, salva o resultado e coordena outros recursos (gerar hash de senha, emitir token, consultar outro contexto). Regras que dependem de dados externos ao agregado, como "o e-mail não pode estar em uso por outro usuário", ficam aqui, porque o agregado sozinho não tem como verificá-las.

**Presentation.** Recebe a requisição HTTP, valida o **formato** dos dados, chama um caso de uso e transforma o resultado na resposta. Também traduz erros de domínio em códigos HTTP.

**Infrastructure.** Implementa os contratos definidos pelas camadas internas: repositórios com Prisma, hash de senha com scrypt, tokens com JWT, leitura de configuração. Pode ser substituída sem alterar as regras.

### 4.3. Dois tipos de validação

Uma distinção que evita muita confusão:

| Validação de formato | Validação de regra de negócio |
| --- | --- |
| "O campo é um texto? É um número inteiro? Está presente?" | "Esta transição de situação é permitida? Todas as verificações têm resultado?" |
| Fica na presentation, nos DTOs HTTP | Fica no domínio, nas entidades e value objects |
| Protege a borda contra dados malformados | Protege as invariantes, venha a chamada de onde vier |
| Gera resposta 400 | Gera um erro de domínio, traduzido para 422, 404 ou 409 |

As duas podem verificar o mesmo campo sem que isso seja duplicação. O DTO garante que `compositionVersion` é um número inteiro. O domínio garante que ela é maior ou igual a 1, mesmo que o caso de uso seja chamado por outro meio que não o HTTP.

### 4.4. O fluxo de uma requisição

Exemplo ilustrativo, a conclusão de uma inspeção:

```text
HTTP
 │
 ▼  Presentation    O controller valida o formato, extrai o ID e chama o caso de uso.
 ▼  Application     O caso de uso busca a inspeção pelo contrato InspectionRepository.
 ▼  Domain          inspection.complete() verifica as invariantes.
 │                  Se alguma for violada, lança BusinessRuleError.
 ▼  Application     O caso de uso salva a inspeção pelo mesmo contrato.
 ▼  Infrastructure  O repositório Prisma converte a entidade para o modelo do banco e grava no MySQL.
 ▲  Presentation    O controller converte a entidade no DTO de resposta.
 ▲                  Se houve erro de domínio, o filtro global o converte em resposta HTTP.
```

Como o domínio lança `BusinessRuleError`, e não uma exceção HTTP, o mesmo caso de uso pode ser acionado por uma requisição HTTP, por um consumidor de fila ou por uma tarefa agendada sem nenhuma alteração. Só a borda muda.

### 4.5. Portas e adaptadores

Dois termos aparecem com frequência e vêm da Arquitetura Hexagonal, de Alistair Cockburn, muito próxima da Clean Architecture:

- **Porta** é um contrato (em TypeScript, uma interface) definido pelo lado de dentro. Ele descreve o que a regra precisa do mundo externo (um repositório, um gerador de hash, um emissor de token, uma consulta a outro contexto).
- **Adaptador** é a implementação desse contrato com uma tecnologia específica (Prisma, scrypt, JWT).

No projeto, as portas de persistência são chamadas de *repositórios* e as demais de *contratos* (*contracts*).

### 4.6. O que Clean Architecture não é

- **Não é ter as quatro pastas.** Abra um arquivo do domínio: se ele importa `@nestjs/*`, os modelos gerados pelo Prisma ou tipos HTTP, a regra de dependência foi violada, qualquer que seja a pasta.
- **Não é criar uma interface para cada classe.** Abstrações existem nas fronteiras com detalhes técnicos, não entre objetos do próprio domínio.
- **Não é isolar o framework a qualquer custo.** A próxima seção explica até onde vamos.

### 4.7. Pragmatismo: onde o framework pode aparecer

Isolar completamente o NestJS exigiria registrar cada caso de uso com fábricas manuais, sem os decorators de injeção. O custo seria alto e o benefício, pequeno. Por isso o projeto adota um limite claro:

| Camada | Uso do NestJS | Justificativa |
| --- | --- | --- |
| Domain | **Proibido** | A regra precisa ser testável e portátil sem framework |
| Application | **Somente** `@Injectable()`, `@Inject()` e `Logger` | São metadados de composição e log, que não alteram o comportamento da regra |
| Presentation | Livre | É a borda HTTP, construída com o framework |
| Infrastructure | Livre | Implementa detalhes técnicos |

O custo dessa decisão é conhecido. Se o projeto deixasse o NestJS, essas linhas de decorators mudariam, mas a lógica dos casos de uso não. Exceções HTTP como `BadRequestException` **não** fazem parte da exceção: elas carregam a semântica do protocolo HTTP para dentro da aplicação, o que é diferente de metadados de injeção.

---

## 5. Monólito Modular

### 5.1. O que é

Um monólito modular é **um único sistema implantável** (um processo, uma imagem, um banco de dados), dividido internamente em **módulos com fronteiras explícitas**. Cada módulo corresponde a um bounded context, esconde seus detalhes internos e se comunica com os outros por contratos públicos.

| | Monólito tradicional | Monólito modular | Microsserviços |
| --- | --- | --- | --- |
| Unidades de implantação | 1 | 1 | Várias |
| Fronteiras entre áreas | Implícitas ou inexistentes | Explícitas no código | Explícitas pela rede |
| Comunicação | Qualquer chamada direta | Contratos públicos, em memória | Rede (HTTP, mensageria) |
| Banco de dados | Compartilhado, sem dono | Compartilhado, com dono para cada tabela | Um por serviço |
| Consistência | Transações ACID em qualquer lugar | ACID dentro do contexto; entre contextos, por contrato | Eventual entre serviços |
| Custo operacional | Baixo | Baixo | Alto |
| Risco típico | Código emaranhado, sem fronteiras | Fronteiras se deteriorarem sem verificação | Monólito distribuído |

### 5.2. Por que é adequado ao Quimovia

- **Um produto, um time e um pipeline.** Não há hoje necessidade de implantar partes do sistema separadamente.
- **O domínio ainda está sendo descoberto.** Dois dos cinco contextos ainda não foram implementados. Mover uma fronteira dentro de um monólito é uma refatoração. Movê-la entre microsserviços envolve migração de dados e de contratos de rede.
- **As operações críticas precisam de consistência.** Liberação e bloqueio de cargas se beneficiam de transações locais.
- **As portas continuam abertas**, desde que as condições da seção 5.4 sejam respeitadas.

### 5.3. O que torna um monólito realmente modular

Dividir o código em pastas não basta. Um monólito só é modular se seguir estas regras:

1. **Encapsulamento.** Cada módulo expõe uma API pública pequena. Todo o resto é privado.
2. **Dados com dono.** Cada tabela pertence a um único módulo, e só ele a lê e altera.
3. **Comunicação por contrato.** Um módulo usa outro pela API pública (consultas) ou por eventos, nunca pelas entidades, repositórios ou tabelas do outro.
4. **Sem dependências cíclicas.** Se A depende de B, B não depende de A.
5. **Verificação automática.** Em TypeScript, qualquer arquivo consegue importar qualquer outro. Sem um teste que verifique as fronteiras, elas se deterioram aos poucos, sem que ninguém perceba.

### 5.4. Evolução para microsserviços

Um monólito modular **pode** facilitar a extração de microsserviços no futuro, mas isso não é automático. O benefício só existe se as condições abaixo forem verdadeiras para o contexto a ser extraído:

| Condição | O que acontece se não for cumprida |
| --- | --- |
| Nenhum outro módulo importa os detalhes internos do contexto | A extração exige reescrever os módulos consumidores |
| O contexto não lê tabelas de outros, e não há *join* ou navegação entre tabelas de contextos diferentes | O banco de dados não pode ser separado sem reescrita |
| A comunicação usa contratos assíncronos (`Promise`) com dados serializáveis, nunca entidades | Objetos em memória não atravessam a rede |
| Nenhuma transação de banco envolve tabelas de dois contextos | Seria preciso substituí-la por compensações (sagas), o que é muito mais complexo |
| O negócio aceita consistência eventual onde a comunicação passar a ser assíncrona | A extração mudaria o comportamento do sistema |
| Existe infraestrutura para operar vários serviços: pipeline e implantação por serviço, logs correlacionados, rastreamento distribuído, versionamento de contratos | O custo operacional supera o benefício |

Há também uma diferença de comportamento que precisa ser prevista: uma chamada em memória nunca falha por causa da rede. Quando ela vira uma chamada HTTP, pode demorar, falhar ou ser repetida. O consumidor passa a precisar de timeouts, novas tentativas e operações idempotentes.

**Motivos legítimos para extrair um contexto:** escalar uma parte de forma diferente das outras (por exemplo, um processamento pesado de documentos), isolar falhas, dar a um time dedicado um ciclo de entrega próprio ou atender a uma exigência de isolamento. "Microsserviços são modernos" não é um motivo.

**O anti-padrão a evitar** é o *monólito distribuído*: serviços separados pela rede, mas que precisam ser implantados juntos, chamam uns aos outros em cadeia e compartilham o banco. Ele reúne os custos das duas abordagens sem os benefícios de nenhuma. É o resultado típico de separar um sistema cujas fronteiras nunca foram respeitadas.

---

## 6. Inversão de Dependência (DIP)

### 6.1. O princípio

O Princípio da Inversão de Dependência é o "D" do SOLID, formulado por Robert C. Martin:

> a) Módulos de alto nível não devem depender de módulos de baixo nível. Ambos devem depender de abstrações.
>
> b) Abstrações não devem depender de detalhes. Detalhes devem depender de abstrações.

Aqui, **alto nível** significa política: regras de negócio e casos de uso. **Baixo nível** significa mecanismo: Prisma, JWT, scrypt, clientes HTTP.

### 6.2. O problema sem DIP

Em execução, o caso de uso chama o banco. O caminho natural seria a dependência no código seguir essa mesma direção:

```ts
// Sem DIP: o caso de uso depende diretamente do detalhe técnico
import { PrismaService } from '@/shared/infrastructure/persistence/prisma/prisma.service.js';

export class CreateInspectionUseCase {
  constructor(private readonly prisma: PrismaService) {}

  async execute(input: CreateInspectionInput) {
    const inspection = Inspection.create(input);
    await this.prisma.inspection.create({ data: { /* colunas da tabela */ } });
  }
}
```

As consequências:

- Para testar o caso de uso, é preciso um banco ou uma imitação da API do Prisma.
- Trocar o ORM obriga a alterar o caso de uso.
- O caso de uso conhece o formato das tabelas.
- Qualquer mudança no Prisma pode quebrar a regra.

### 6.3. A solução com DIP

```ts
// domain/repositories/inspection.repository.ts — a abstração pertence ao domínio
export interface InspectionRepository {
  create(inspection: Inspection): Promise<Inspection>;
  findById(id: string): Promise<Inspection | null>;
}
export const INSPECTION_REPOSITORY = Symbol('InspectionRepository');

// application/use-cases/create-inspection.use-case.ts — depende só da abstração
export class CreateInspectionUseCase {
  constructor(
    @Inject(INSPECTION_REPOSITORY)
    private readonly inspections: InspectionRepository,
  ) {}
}

// infrastructure/persistence/prisma/prisma-inspection.repository.ts — o detalhe implementa a abstração
export class PrismaInspectionRepository implements InspectionRepository {
  /* usa o Prisma e converte entre o modelo do banco e a entidade */
}
```

Compare a direção do fluxo de controle com a direção das dependências:

```text
Fluxo de controle (em execução):
  CreateInspectionUseCase ──chama──► PrismaInspectionRepository ──► MySQL

Dependências de código-fonte (imports):
  CreateInspectionUseCase ──────────► InspectionRepository (interface, no domínio)
                                                ▲
                                                │ implements
                                PrismaInspectionRepository (infraestrutura)
```

A seta da infraestrutura aponta para dentro, **contra** o fluxo de controle. É isso que "inverter a dependência" significa.

### 6.4. Quem é dono da abstração

A abstração pertence a quem a usa: ao domínio ou à aplicação, e não à infraestrutura. Ela fica junto do consumidor e é escrita na linguagem dele.

Se a interface fica na pasta da infraestrutura, ao lado do Prisma, ou é gerada a partir dele, a dependência continua apontando para fora. Existe uma interface, mas não existe inversão.

### 6.5. Uma abstração que não vaza detalhes

Uma porta só cumpre o seu papel se não expuser o detalhe que deveria esconder:

```ts
// Vaza o detalhe: a porta expõe tipos do Prisma
list(args: Prisma.InspectionFindManyArgs): Promise<InspectionModel[]>;

// Fala a linguagem do domínio
list(filters: InspectionSearchFilters): Promise<InspectionPage>;
```

Uma boa porta:

- não usa tipos do ORM, do banco ou de bibliotecas externas;
- recebe e devolve objetos do domínio ou dados simples;
- tem métodos com nomes do domínio;
- sinaliza falhas de negócio com erros de domínio ou `null`, e não com erros específicos de um driver.

### 6.6. Onde aplicar e onde não aplicar

Aplique o DIP nas fronteiras com detalhes que podem mudar ou que atrapalham os testes:

- persistência (repositórios);
- criptografia e tokens;
- integrações com sistemas externos;
- consultas a outros contextos (seção 6.7).

**Não** aplique entre objetos do próprio domínio (uma entidade usa os seus value objects diretamente), em funções puras ou em DTOs. Uma interface com uma única implementação, que não está numa fronteira, é só um nível extra de indireção.

### 6.7. DIP entre contextos

Imagine que Gestão de Cargas precisa saber se o responsável informado existe. Sem DIP, o caso de uso de cargas importaria o repositório e a entidade de usuário de Identidade e Acesso. Qualquer mudança interna em Identidade afetaria Cargas, e separar os contextos exigiria reescrever Cargas.

Com DIP, Cargas depende de uma **abstração** e nunca da implementação do outro contexto. Há duas formas de definir essa abstração:

| Forma | Quem define o contrato | Quando usar |
| --- | --- | --- |
| **Contrato publicado** pelo fornecedor | O contexto fornecedor publica uma interface e um token na sua API pública. O consumidor injeta pelo token | Quando os dados publicados servem ao consumidor como estão. É a forma padrão no projeto, por ser a mais simples |
| **Porta do consumidor** com adaptador | O consumidor define a interface na sua própria linguagem e implementa um adaptador que traduz o contrato do fornecedor | Quando o modelo do fornecedor precisa ser traduzido para não "contaminar" o consumidor. Esse adaptador funciona como uma camada anticorrupção |

Nas duas formas, o caso de uso consumidor depende só de uma interface. Se o fornecedor for extraído para outro serviço, basta registrar uma implementação remota (por exemplo, um cliente HTTP) para o mesmo contrato. Os casos de uso não mudam.

No projeto, Gestão de Cargas consulta o responsável pela carga com o contrato `UserDirectory`, publicado por Identidade e Acesso (documento 02, seção 8.3). Não há porta do consumidor nesse caso porque os dados publicados servem a Gestão de Cargas como estão. Um adaptador apenas repassaria as chamadas.

---

## 7. Injeção de Dependência (DI)

### 7.1. O que é

Injeção de dependência é a técnica em que um objeto **recebe** as suas dependências de fora, em vez de criá-las com `new` ou buscá-las numa variável global.

```ts
// Sem DI: a classe escolhe e cria a própria dependência
class LoginUseCase {
  private readonly hasher = new ScryptPasswordHasher();
}

// Com DI: alguém de fora entrega a dependência
class LoginUseCase {
  constructor(private readonly hasher: PasswordHasher) {}
}
```

A forma preferida é a injeção **por construtor**. As dependências ficam explícitas na assinatura, podem ser imutáveis (`readonly`) e o objeto nunca existe pela metade, sem uma dependência obrigatória.

### 7.2. Composition root

Alguém precisa criar os objetos concretos e ligá-los entre si. Esse lugar é a **raiz de composição** (*composition root*). DI não exige um framework. Num teste unitário, o próprio teste é a raiz de composição:

```ts
const useCase = new CreateInspectionUseCase(new InspectionRepositoryMock());
```

Na aplicação, essa ligação é automatizada por um **container de DI**. No Quimovia, é o container do NestJS.

### 7.3. DI no NestJS

O NestJS oferece um container de DI organizado em módulos. Os conceitos principais são:

**Provider.** Qualquer coisa que o container sabe criar e entregar: uma instância de classe, um valor fixo ou o resultado de uma função.

**Token.** O identificador de um provider. Pode ser uma classe, uma string ou um `Symbol`. Em TypeScript, **interfaces não existem em tempo de execução**: são apagadas na compilação. Por isso uma interface não pode ser usada como token, e o projeto exporta um `Symbol` junto de cada contrato.

**Formas de registro:**

| Forma | O que faz | Exemplo |
| --- | --- | --- |
| Classe | Registra a classe como token e como implementação | `providers: [CreateInspectionUseCase]` |
| `useClass` | Associa um token a uma classe | `{ provide: INSPECTION_REPOSITORY, useClass: PrismaInspectionRepository }` |
| `useValue` | Associa um token a um valor pronto | `{ provide: INSPECTION_REPOSITORY, useValue: fake }` |
| `useFactory` | Associa um token ao resultado de uma função, que pode receber outros providers por `inject` | `{ provide: AUTH_CONFIG, useFactory: () => loadAuthConfig() }` |
| `useExisting` | Cria um apelido para outro token | Raramente necessário |

**Injeção.** O parâmetro do construtor declara o que precisa com `@Inject(TOKEN)`. Quando o compilador emite metadados de tipo (`emitDecoratorMetadata`), o NestJS consegue deduzir tokens de classe sozinho. Para interfaces, o `@Inject(TOKEN)` é sempre obrigatório. Ferramentas que não emitem esses metadados, como o `tsx` usado em desenvolvimento, exigem `@Inject` também para classes (o documento 02 traz a regra do projeto).

**Escopo.** Por padrão, cada provider é um *singleton*: uma única instância para toda a aplicação. Por isso casos de uso e repositórios não devem guardar estado entre chamadas.

**Módulos.** O módulo é a unidade de composição e de encapsulamento:

| Propriedade | Significado |
| --- | --- |
| `providers` | O que este módulo sabe criar. **Privado por padrão** |
| `exports` | O subconjunto dos providers que outros módulos podem injetar |
| `imports` | Os módulos cujos `exports` este módulo usa |
| `controllers` | Os controllers HTTP deste módulo |

Um provider que não é exportado não pode ser injetado por nenhum outro módulo. Esse encapsulamento é o que permite alinhar os módulos do NestJS aos bounded contexts. Há um limite importante: **o NestJS controla o que pode ser injetado, mas não controla os `import` do TypeScript.** Um arquivo de um módulo continua conseguindo importar diretamente um arquivo de outro. Essa parte da fronteira precisa de convenção e de verificação automática.

`@Global()` torna os exports de um módulo visíveis em toda a aplicação sem `imports`. É conveniente, mas esconde dependências: quem lê um módulo não vê o que ele usa. O projeto prefere declarar as dependências explicitamente.

**Falha rápida.** Se uma dependência não puder ser resolvida, o NestJS falha ao iniciar a aplicação, com uma mensagem que diz qual provider não foi encontrado e em qual módulo. O erro aparece na inicialização, e não no meio de uma requisição.

**Guards.** Um guard usado em `@UseGuards(AuthGuard)` é resolvido no contexto do módulo do controller que o usa. Por isso as dependências do guard também precisam estar disponíveis nesse módulo, exportadas pelo módulo que o fornece.

### 7.4. Substituição nos testes

Como os consumidores dependem de tokens, e não de classes concretas, o mesmo módulo pode ser testado com outra implementação:

```ts
const moduleRef = await Test.createTestingModule({ imports: [InspectionModule] })
  .overrideProvider(INSPECTION_REPOSITORY)
  .useValue(new InspectionRepositoryMock())
  .compile();
```

Nenhum código de produção precisa saber que está sendo testado.

### 7.5. DIP e DI: complementares, não equivalentes

| | DIP | DI |
| --- | --- | --- |
| Natureza | Princípio de design | Técnica, apoiada por um mecanismo |
| Pergunta | Para onde apontam as dependências no código? | Quem cria e entrega as dependências em execução? |
| Atua em | Imports, interfaces, desenho dos contratos | Instâncias, ciclo de vida, ligação entre objetos |
| Um sem o outro | **DIP sem DI:** o caso de uso depende da interface, e a ligação é feita à mão com `new` na raiz de composição. Funciona | **DI sem DIP:** o NestJS injeta `PrismaService` direto no caso de uso. Há injeção, mas a regra depende do detalhe |
| Juntos | O DIP define a abstração e a direção. A DI liga a implementação concreta à abstração sem que o consumidor saiba qual é | |

Em resumo: **usar o NestJS não significa aplicar DIP.** Um construtor `constructor(private prisma: PrismaService)` num caso de uso é injeção de dependência sem inversão.

---

## 8. Como os conceitos trabalham juntos

| Conceito | Tipo | O que decide | Sem ele |
| --- | --- | --- | --- |
| DDD | Abordagem de modelagem | As fronteiras do negócio e o modelo de cada uma | Módulos por tabela ou por tecnologia; termos ambíguos |
| Monólito Modular | Estilo de sistema | Como os contextos convivem e se isolam num único sistema | Contextos acessam os internos uns dos outros; separação futura inviável |
| Clean Architecture | Estilo de organização | A direção das dependências dentro de cada contexto | Regras dependentes de framework e banco |
| DIP | Princípio | Como manter essa direção quando a regra precisa de um recurso externo | A regra de dependência é impossível sempre que o fluxo vai para fora |
| DI | Mecanismo | Como entregar as implementações concretas | `new` espalhado pelas regras; testes que dependem de infraestrutura real |
| Módulos e providers do NestJS | Ferramenta | Onde a DI e o encapsulamento são configurados | — |

DDD, Clean Architecture, Monólito Modular e DIP são **decisões e princípios**. DI e os módulos do NestJS são **mecanismos** que os implementam. Um mecanismo sem o princípio produz estrutura sem benefício, por exemplo módulos do NestJS que exportam tudo para todos.

Um exemplo de ponta a ponta, a conclusão de uma inspeção:

1. **DDD.** A regra "só conclui com todas as verificações registradas" pertence ao agregado Inspeção, no contexto de Inspeções. Gestão de Cargas não precisa conhecer essa regra, só o resultado. Por isso os dois contextos se referem à carga apenas pelo ID.
2. **Monólito Modular.** O módulo de Inspeções não expõe a sua entidade nem o seu repositório. Se Gestão de Cargas precisar do resultado, ele chega por um contrato público ou por um evento.
3. **Clean Architecture.** O controller chama o caso de uso. O caso de uso chama `inspection.complete()` e salva o agregado pelo contrato do repositório.
4. **DIP.** O contrato `InspectionRepository` está no domínio. A implementação com Prisma está na infraestrutura e depende do contrato, e não o contrário.
5. **DI.** O módulo de Inspeções registra `{ provide: INSPECTION_REPOSITORY, useClass: PrismaInspectionRepository }`. Em produção, o caso de uso recebe o repositório Prisma. No teste, recebe um fake, sem nenhuma mudança no código.

---

## 9. A arquitetura na stack do projeto

### NestJS

O NestJS oferece módulos, container de DI, controllers, pipes, guards, filtros e interceptors. Cada recurso tem um lugar na arquitetura:

| Recurso do NestJS | Papel na arquitetura |
| --- | --- |
| Módulo | Raiz de composição de um contexto e fronteira de encapsulamento |
| Provider | Caso de uso, adaptador, configuração |
| Controller, pipe, guard, filtro, decorator | Presentation (borda HTTP) |

O NestJS é um detalhe: o domínio não o conhece. Os geradores do NestJS criam por padrão uma classe `XService` para cada recurso, e esse padrão tende a acumular regra, acesso a dados e HTTP numa só classe. O projeto usa casos de uso com uma ação cada e serviços com nomes que dizem o que fazem.

### TypeScript

- A tipagem estrutural torna as interfaces boas portas. `implements` documenta e verifica que o adaptador cumpre o contrato.
- Interfaces são apagadas na compilação. Por isso os contratos usam tokens `Symbol`, e o código importa a interface com `import type` e o token como valor.
- Campos privados (`#campo`) garantem o encapsulamento das entidades em tempo de execução, e não só na compilação.
- O modo `strict` e o alias `@/` mantêm os imports explícitos e verificáveis.

### Prisma

O Prisma é o adaptador de persistência. O client e os tipos que ele gera representam o **esquema do banco**, não o modelo do domínio, e por isso não saem da infraestrutura. Os repositórios convertem os registros do Prisma em entidades e vice-versa.

O modelo do banco e o do domínio podem ser diferentes. Por exemplo, o agregado Inspeção é gravado em duas tabelas, inspeção e itens. O schema descreve tabelas. O domínio descreve regras.

Um único client do Prisma dá acesso a todas as tabelas. Isso é conveniente, mas permite que qualquer código consulte dados de outro contexto. A fronteira é mantida pela regra de que só os repositórios de cada contexto usam o Prisma, e só para as tabelas do próprio contexto, com verificação automática.

### MySQL

O MySQL oferece transações ACID e integridade referencial por chaves estrangeiras.

- **Dentro de um contexto**, transações e chaves estrangeiras são usadas normalmente.
- **Entre contextos**, uma chave estrangeira acopla o armazenamento dos dois contextos. O projeto trata isso como exceção documentada (decisão D8).

### Jest

A separação em camadas define o que cada teste precisa:

| O que se testa | Como |
| --- | --- |
| Entidades e value objects | Testes unitários puros, sem mocks e sem framework. São rápidos e cobrem a maior parte das regras |
| Casos de uso | Testes unitários com implementações falsas (fakes ou mocks) dos contratos, entregues pelo construtor |
| Adaptadores (repositórios, serviços técnicos) | Com fakes do Prisma ou, idealmente, contra um banco real em teste de integração |
| Fluxo HTTP | Testes E2E com supertest, substituindo os providers de infraestrutura pelos tokens |

---

## 10. Decisões arquiteturais e trade-offs

Cada decisão está no formato: o que foi decidido, por que, e qual o custo.

**D1. Monólito modular, e não microsserviços.**
*Por quê:* um time, um produto e um domínio ainda em descoberta (seção 5.2).
*Custo:* o sistema escala como um todo, e um contexto que precise de escala diferente exigirá extração no futuro, sob as condições da seção 5.4.

**D2. Módulos alinhados aos bounded contexts.** Os módulos não são organizados por entidade nem por camada técnica.
*Por quê:* tudo o que muda junto fica junto, e a fronteira do negócio é a fronteira do código.
*Custo:* exige identificar os contextos corretamente. Uma fronteira errada custa uma refatoração.

**D3. Quatro camadas por contexto, com a regra de dependência apontando para dentro.**
*Por quê:* as regras ficam independentes de tecnologia e testáveis isoladamente.
*Custo:* mais arquivos e um nível de indireção nas fronteiras.

**D4. Domínio sem framework. A aplicação tolera apenas os decorators de DI e o `Logger` do NestJS.**
*Por quê:* equilíbrio entre pureza e produtividade (seção 4.7).
*Custo:* a camada de aplicação conhece os decorators de DI do NestJS.

**D5. Repositórios como contratos no domínio, com implementação Prisma na infraestrutura.**
*Por quê:* aplica o DIP onde ele mais importa: entre a regra e o banco.
*Custo:* o mapeamento entre o modelo do Prisma e a entidade é código repetitivo.

**D6. Tokens `Symbol` e injeção explícita com `@Inject`.**
*Por quê:* interfaces não existem em tempo de execução, e o ambiente de desenvolvimento não emite metadados de tipo.
*Custo:* um pouco mais de verbosidade nos construtores.

**D7. Comunicação entre contextos apenas por contratos públicos.**
Os contratos públicos são consultas por interfaces publicadas e, quando houver necessidade, eventos. Um contexto nunca usa a entidade, o repositório ou as tabelas de outro.
*Por quê:* preserva a autonomia dos contextos e mantém viável uma extração futura.
*Custo:* uma consulta que seria um *join* vira duas consultas, e é preciso desenhar e manter contratos.

**D8. Um banco, com dono para cada tabela e referência por ID entre contextos.**
Uma chave estrangeira entre contextos só é aceita como exceção documentada: sem cascata e sem navegação no código.
*Por quê:* mantém a integridade dentro de cada contexto sem amarrar o armazenamento de contextos diferentes.
*Custo:* a integridade entre contextos passa a ser responsabilidade da aplicação, exceto nas exceções registradas.

**D9. Erros de domínio sem semântica HTTP, traduzidos na borda.**
*Por quê:* o mesmo caso de uso pode ser acionado por HTTP, fila ou tarefa agendada.
*Custo:* um filtro global precisa mapear cada tipo de erro para um código HTTP.

**D10. Simplicidade primeiro.** Padrões táticos, interfaces e pastas só existem onde há uma necessidade concreta.
*Por quê:* abstração sem necessidade é custo sem benefício.
*Custo:* exige julgamento caso a caso e revisão. A prioridade é:

```text
clareza          > abstração
manutenibilidade > elegância teórica
domínio          > framework
modularidade     > organização técnica genérica
```

### Vantagens, condições e limitações

| Dimensão | Ganho | Condição para o ganho existir | Custo ou limitação |
| --- | --- | --- | --- |
| Desenvolvimento | Lugar previsível para cada código. Pessoas diferentes trabalham em contextos diferentes sem conflito | Convenções seguidas e revisadas | Mais arquivos e indireções. Curva de aprendizado |
| Testabilidade | Domínio testável sem infraestrutura. Casos de uso testáveis com fakes | Contratos bem definidos e domínio sem framework | Manter os fakes. Os adaptadores ainda precisam de testes de integração |
| Manutenção | Mudanças localizadas: regra no domínio, tecnologia na infraestrutura, formato da API na presentation | Nenhum detalhe técnico vazando para dentro | Mapeamento repetitivo entre Prisma, domínio e DTO |
| Organização | Fronteiras explícitas e linguagem consistente | Glossário mantido e fronteiras verificadas automaticamente | Sem verificação, a erosão é silenciosa |
| Escalabilidade | Possibilidade de extrair um contexto | Todas as condições da seção 5.4 | Não escala sozinho. A extração tem custo operacional real |

### Quando esta arquitetura é excessiva

Para um contexto que é apenas um cadastro, sem regras, a estrutura completa pode ser mais pesada do que o problema. Nesses casos, use casos de uso finos, não crie value objects ou serviços sem regra e não crie interfaces sem uma fronteira real. A estrutura deve refletir as necessidades de cada contexto, e não ser replicada vazia em todos.

---

## 11. Glossário

| Termo | Significado |
| --- | --- |
| Adaptador | Implementação de uma porta com uma tecnologia específica |
| Agregado | Grupo de objetos tratado como unidade de consistência, acessado pela sua raiz |
| API pública de um contexto | O conjunto de contratos, tipos e providers que outros contextos podem usar |
| Bounded context | Fronteira dentro da qual um modelo e a sua linguagem são válidos |
| Camada anticorrupção | Adaptador que traduz o modelo de outro contexto para o modelo do consumidor |
| Caso de uso | Classe que representa uma ação do sistema e orquestra o domínio e as portas |
| Composition root | Lugar onde os objetos concretos são criados e ligados. No projeto, os módulos do NestJS |
| Consistência eventual | Garantia de que os dados ficarão consistentes, mas não necessariamente de imediato |
| Contrato | Interface que define uma dependência. No projeto, o termo usado para portas que não são repositórios |
| Evento de domínio | Fato relevante do negócio que já aconteceu |
| Invariante | Regra que precisa ser verdadeira sempre |
| Linguagem ubíqua | Vocabulário comum entre o negócio e o código |
| Monólito distribuído | Serviços separados pela rede, mas acoplados como um monólito |
| Porta | Contrato definido pelo lado de dentro, que descreve o que a regra precisa |
| Provider | Algo que o container do NestJS sabe criar e injetar |
| Raiz do agregado | Entidade pela qual todo acesso e toda alteração do agregado passam |
| Token | Identificador de um provider no NestJS |
| Value Object | Objeto definido pelos seus valores, imutável e autovalidado |

---

## 12. Referências

- Eric Evans. *Domain-Driven Design: Tackling Complexity in the Heart of Software*. Addison-Wesley, 2003.
- Vaughn Vernon. *Implementing Domain-Driven Design*. Addison-Wesley, 2013.
- Vaughn Vernon. *Effective Aggregate Design* (série de artigos), 2011.
- Robert C. Martin. *Clean Architecture: A Craftsman's Guide to Software Structure and Design*. Prentice Hall, 2017.
- Robert C. Martin. *The Dependency Inversion Principle*. C++ Report, 1996.
- Alistair Cockburn. *Hexagonal Architecture* (Ports and Adapters), 2005.
- Documentação do NestJS: [Modules](https://docs.nestjs.com/modules), [Providers](https://docs.nestjs.com/providers), [Custom providers](https://docs.nestjs.com/fundamentals/custom-providers).
