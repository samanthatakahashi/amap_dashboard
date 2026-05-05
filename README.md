# Dashboard de Lançamento

Dashboard de performance de lançamento, conectado ao Google Sheets via N8N.

---

## Como rodar localmente

```bash
npm install
npm run dev
```

Acesse: http://localhost:5173

---

## Como fazer deploy no Vercel

### Opção 1 — Via GitHub (recomendada)

1. Crie um repositório no GitHub e suba essa pasta
2. Acesse vercel.com → "Add New Project"
3. Importe o repositório
4. Deixe as configurações padrão (Vite é detectado automaticamente)
5. Clique em Deploy

Toda vez que você der push no GitHub, o Vercel atualiza automaticamente.

### Opção 2 — Via Vercel CLI

```bash
npm install -g vercel
vercel
```

Siga o wizard. Na primeira vez pede login e confirma as configurações.

---

## Como conectar a planilha

1. Abra sua Google Sheets
2. Clique em **Compartilhar → Qualquer pessoa com o link → Leitor**
3. Copie o ID da planilha na URL:
   `docs.google.com/spreadsheets/d/`**SEU_ID_AQUI**`/edit`
4. No dashboard, clique em "Conectar planilha" e cole o ID

---

## Estrutura esperada da planilha

### Aba `dados_diarios` (linha 5 em diante)
| Col | Campo |
|-----|-------|
| A | Data (DD-MM-YYYY) |
| B | Investimento (R$) |
| C | Cliques no Link |
| D | Views de Página |
| E | Checkouts Iniciados |
| F | Compras |
| G | Receita (R$) |

### Aba `criativos` (linha 5 em diante)
| Col | Campo |
|-----|-------|
| A | Link do Criativo |
| B | Nome do Criativo |
| C | Investimento (R$) |
| D | Impressões |
| E | Cliques |
| F | Views de Página |
| G | Checkouts |
| H | Compras |
| I | Views 3s |
| J | Views 50% |
| K | Receita (R$) |

### Aba `paginas` (linha 5 em diante)
| Col | Campo |
|-----|-------|
| A | Variação de Página |
| B | Investimento (R$) |
| C | Cliques |
| D | Views de Página |
| E | Checkouts |
| F | Compras |
| G | Impressões |
| H | Receita (R$) |

### Aba `config` (linha 4 em diante) — opcional
| Chave | Exemplo |
|-------|---------|
| nome_produto | Mentoria XYZ |
| nome_cliente | João Silva |
| meta_vendas | 200 |

---

## Thumbnails dos criativos

Para exibir miniaturas, o link na coluna A de `criativos` deve ser:
- Um link de arquivo do Google Drive compartilhado publicamente
- O dashboard converte automaticamente para URL de thumbnail

Formato do link do Drive:
`https://drive.google.com/file/d/SEU_FILE_ID/view?usp=sharing`
