# 🗺️ Mapa Simplificado do Site — Mente Leve

O site é uma **SPA (Single Page Application)** simples: tudo roda em uma única página HTML, alternando as telas pelo menu.

---

### 1. Mapa de Telas (Navegação)

```mermaid
graph TD
    A[🏠 Início] --> B[🌬️ 1. Respirar]
    A --> C[😊 2. Humor]
    A --> D[⏱️ 3. Foco]
    A --> E[🔥 4. Anti-Burnout]
    A --> F[🤝 5. Apoio]

    subgraph Telas do Site
        B --> B1[Exercícios de Respiração Guiada]
        C --> C1[Registro diário de emoções e histórico]
        D --> D1[Timer Pomodoro + Lista de Tarefas]
        E --> E1[Quiz de autoavaliação + Pausas ativas]
        F --> F1[Técnica 5-4-3-2-1 + Telefones de emergência]
    end
```

---

### 2. Como o Site Funciona (Camadas Básicas)

```mermaid
flowchart LR
    A[Visual / Telas<br><b>index.html</b>] --- B[Estilo e Cores<br><b>css/style.css</b>]
    A --- C[Ações e Interações<br><b>js/app.js</b>]
    C --- D[(Memória do Navegador<br><b>localStorage</b>)]
```

* **[index.html](file:///c:/Users/aluno/Downloads/Jovens/Jovens/index.html)**: Guarda todo o texto, botões e as 6 telas.
* **[style.css](file:///c:/Users/aluno/Downloads/Jovens/Jovens/css/style.css)**: Cuida do visual, animações e dos 3 modos (escuro, claro e alto contraste).
* **[app.js](file:///c:/Users/aluno/Downloads/Jovens/Jovens/js/app.js)**: Troca as telas quando você clica no menu e faz o cronômetro, gráficos e quiz funcionarem.
* **`localStorage`**: Salva tarefas e registros de humor direto no computador/celular do usuário (sem precisar de cadastro ou banco de dados).
