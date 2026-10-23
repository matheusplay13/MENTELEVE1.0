/* =========================================================
   Mente Leve - Lógica da aplicação
   ========================================================= */
(() => {
  'use strict';

  // ---------- Utilidades ----------
  const $ = (sel, ctx = document) => ctx.querySelector(sel);
  const $$ = (sel, ctx = document) => [...ctx.querySelectorAll(sel)];
  const store = {
    get: (k, padrao) => { try { const v = localStorage.getItem('ml_' + k); return v === null ? padrao : JSON.parse(v); } catch { return padrao; } },
    set: (k, v) => { try { localStorage.setItem('ml_' + k, JSON.stringify(v)); } catch { /* armazenamento indisponível */ } }
  };
  const isoLocal = (d) => `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}-${String(d.getDate()).padStart(2, '0')}`;
  const hojeISO = () => isoLocal(new Date());
  const escapar = (s) => s.replace(/[&<>"']/g, c => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' }[c]));

  let toastTimer;
  function toast(msg) {
    const t = $('#toast');
    t.textContent = msg;
    t.classList.add('visivel');
    clearTimeout(toastTimer);
    toastTimer = setTimeout(() => t.classList.remove('visivel'), 3200);
  }

  let audioCtx;
  function bip(freq = 528, dur = 0.25) {
    try {
      audioCtx = audioCtx || new (window.AudioContext || window.webkitAudioContext)();
      const osc = audioCtx.createOscillator();
      const gain = audioCtx.createGain();
      osc.type = 'sine';
      osc.frequency.value = freq;
      gain.gain.setValueAtTime(0.0001, audioCtx.currentTime);
      gain.gain.exponentialRampToValueAtTime(0.2, audioCtx.currentTime + 0.03);
      gain.gain.exponentialRampToValueAtTime(0.0001, audioCtx.currentTime + dur);
      osc.connect(gain).connect(audioCtx.destination);
      osc.start();
      osc.stop(audioCtx.currentTime + dur);
    } catch { /* áudio não suportado */ }
  }

  // ---------- Estatísticas ----------
  function atualizarStats() {
    $('#stat-respiracoes').textContent = store.get('ciclosTotal', 0);
    $('#stat-humor').textContent = store.get('humores', []).length;
    $('#stat-pomodoros').textContent = store.get('pomodorosTotal', 0);
  }

  // =========================================================
  // Acessibilidade: preferências
  // =========================================================
  const root = document.documentElement;
  const prefs = Object.assign({ tema: 'escuro', fonte: 100, movimento: false, espaco: false }, store.get('prefs', {}));
  const temas = ['escuro', 'claro', 'contraste'];
  const nomesTema = { escuro: 'Tema escuro', claro: 'Tema claro', contraste: 'Alto contraste' };

  function aplicarPrefs() {
    root.setAttribute('data-theme', prefs.tema);
    root.style.fontSize = prefs.fonte + '%';
    document.body.classList.toggle('sem-movimento', prefs.movimento);
    document.body.classList.toggle('espacado', prefs.espaco);
    $$('[data-tema]').forEach(b => b.setAttribute('aria-pressed', String(b.dataset.tema === prefs.tema)));
    $('#btn-movimento').setAttribute('aria-pressed', String(prefs.movimento));
    $('#btn-espacamento').setAttribute('aria-pressed', String(prefs.espaco));
    store.set('prefs', prefs);
  }
  function mudarFonte(delta) {
    prefs.fonte = delta === 0 ? 100 : Math.min(150, Math.max(87.5, prefs.fonte + delta));
    aplicarPrefs();
    toast('Tamanho da fonte: ' + Math.round(prefs.fonte) + '%');
  }
  function definirTema(t) { prefs.tema = t; aplicarPrefs(); toast(nomesTema[t] + ' ativado'); }
  function alternarTema() { definirTema(temas[(temas.indexOf(prefs.tema) + 1) % temas.length]); }
  function alternarMovimento() { prefs.movimento = !prefs.movimento; aplicarPrefs(); toast(prefs.movimento ? 'Animações reduzidas' : 'Animações ativadas'); }

  $('#btn-fonte-mais').addEventListener('click', () => mudarFonte(12.5));
  $('#btn-fonte-menos').addEventListener('click', () => mudarFonte(-12.5));
  $('#btn-fonte-reset').addEventListener('click', () => mudarFonte(0));
  $$('[data-tema]').forEach(b => b.addEventListener('click', () => definirTema(b.dataset.tema)));
  $('#btn-movimento').addEventListener('click', alternarMovimento);
  $('#btn-espacamento').addEventListener('click', () => { prefs.espaco = !prefs.espaco; aplicarPrefs(); toast(prefs.espaco ? 'Espaçamento ampliado' : 'Espaçamento normal'); });

  const dialogo = $('#dialogo-atalhos');
  const abrirAtalhos = () => { if (!dialogo.open) dialogo.showModal(); };
  $('#btn-atalhos').addEventListener('click', abrirAtalhos);
  $('#btn-fechar-atalhos').addEventListener('click', () => dialogo.close());

  // =========================================================
  // Roteamento (SPA por hash)
  // =========================================================
  const rotas = ['inicio', 'respirar', 'humor', 'foco', 'burnout', 'apoio'];
  const titulos = { inicio: 'Início', respirar: 'Respiração guiada', humor: 'Rastreador de humor', foco: 'Foco e tempo', burnout: 'Anti-Burnout', apoio: 'Rede de apoio' };
  let rotaAtual = 'inicio';

  function navegar(rota, focar = true) {
    if (!rotas.includes(rota)) return;
    rotaAtual = rota;
    $$('.secao').forEach(s => {
      const ativa = s.id === rota;
      s.hidden = !ativa;
      s.classList.toggle('ativa', ativa);
    });
    $$('.menu a').forEach(a => {
      if (a.dataset.rota === rota) a.setAttribute('aria-current', 'page');
      else a.removeAttribute('aria-current');
    });
    const cor = $('#' + rota).dataset.cor;
    root.style.setProperty('--acento-ativo', `var(--${cor})`);
    document.title = `${titulos[rota]} | Mente Leve`;
    window.scrollTo({ top: 0, behavior: prefs.movimento ? 'auto' : 'smooth' });
    if (focar) {
      const h = $('#' + rota + ' h1, #' + rota + ' h2');
      h.setAttribute('tabindex', '-1');
      h.focus({ preventScroll: true });
    }
    fecharMenu();
  }

  window.addEventListener('hashchange', () => navegar(location.hash.slice(1)));

  const btnMenu = $('#btn-menu');
  const menu = $('#menu-principal');
  function fecharMenu() { menu.classList.remove('aberto'); btnMenu.setAttribute('aria-expanded', 'false'); btnMenu.setAttribute('aria-label', 'Abrir menu'); }
  btnMenu.addEventListener('click', () => {
    const aberto = menu.classList.toggle('aberto');
    btnMenu.setAttribute('aria-expanded', String(aberto));
    btnMenu.setAttribute('aria-label', aberto ? 'Fechar menu' : 'Abrir menu');
  });

  // =========================================================
  // Atalhos de teclado
  // =========================================================
  document.addEventListener('keydown', (e) => {
    const digitando = ['INPUT', 'TEXTAREA', 'SELECT'].includes(document.activeElement.tagName);
    if (e.altKey && /^Digit[1-6]$/.test(e.code)) {
      e.preventDefault();
      location.hash = rotas[Number(e.code.slice(-1)) - 1];
      return;
    }
    if (e.altKey && e.code === 'KeyC') { e.preventDefault(); alternarTema(); return; }
    if (e.altKey && e.code === 'KeyM') { e.preventDefault(); alternarMovimento(); return; }
    if (e.altKey && (e.code === 'Equal' || e.code === 'NumpadAdd')) { e.preventDefault(); mudarFonte(12.5); return; }
    if (e.altKey && (e.code === 'Minus' || e.code === 'NumpadSubtract')) { e.preventDefault(); mudarFonte(-12.5); return; }
    if (digitando) return;
    if (e.key === '?') { e.preventDefault(); abrirAtalhos(); return; }
    if (e.key === 'Escape') fecharMenu();
    if (e.code === 'Space' && rotaAtual === 'foco' && !['BUTTON', 'A'].includes(document.activeElement.tagName)) {
      e.preventDefault();
      alternarTimer();
    }
  });

  // =========================================================
  // Frase do dia
  // =========================================================
  const frases = [
    'Descansar também é parte do processo de aprender.',
    'Você não precisa ser perfeito, só precisa continuar.',
    'Uma nota não define quem você é.',
    'Pequenos passos todos os dias levam a grandes lugares.',
    'Respire fundo. Você já superou dias difíceis antes.',
    'Pedir ajuda é sinal de força, não de fraqueza.',
    'Compare-se apenas com quem você era ontem.',
    'Seu valor não está na sua produtividade.',
    'Está tudo bem não estar bem o tempo todo.',
    'Cuidar da mente é tão importante quanto estudar.'
  ];
  let fraseIdx = new Date().getDate() % frases.length;
  const mostrarFrase = () => { $('#frase-dia').textContent = '"' + frases[fraseIdx] + '"'; };
  $('#btn-nova-frase').addEventListener('click', () => { fraseIdx = (fraseIdx + 1) % frases.length; mostrarFrase(); });

  // =========================================================
  // 01 - Respiração guiada
  // =========================================================
  const tecnicas = {
    '478': [['Inspire', 4, 'in'], ['Segure', 7, 'hold'], ['Expire', 8, 'out']],
    'quadrada': [['Inspire', 4, 'in'], ['Segure', 4, 'hold'], ['Expire', 4, 'out'], ['Segure', 4, 'hold']],
    'coerente': [['Inspire', 5, 'in'], ['Expire', 5, 'out']]
  };
  const circulo = $('#respiro-circulo');
  let respiroAtivo = false;
  let respiroTimer = null;

  const esperar = (ms) => new Promise(res => { respiroTimer = setTimeout(res, ms); });

  async function iniciarRespiracao() {
    const tec = $('input[name="tecnica"]:checked').value;
    const total = Math.min(20, Math.max(1, parseInt($('#input-ciclos').value, 10) || 4));
    const som = $('#chk-som').checked;
    respiroAtivo = true;
    $('#btn-respirar-iniciar').disabled = true;
    $('#btn-respirar-parar').disabled = false;
    $('#respiro-total').textContent = total;

    for (let c = 1; c <= total && respiroAtivo; c++) {
      $('#respiro-ciclo').textContent = c;
      for (const [nome, seg, tipo] of tecnicas[tec]) {
        if (!respiroAtivo) break;
        $('#respiro-fase').textContent = nome;
        $('#respiro-status').textContent = `${nome} por ${seg} segundos`;
        if (som) bip(tipo === 'in' ? 528 : tipo === 'out' ? 396 : 440);
        circulo.style.transitionDuration = seg + 's';
        if (tipo === 'in') circulo.classList.add('expandir');
        if (tipo === 'out') circulo.classList.remove('expandir');
        for (let s = seg; s > 0 && respiroAtivo; s--) {
          $('#respiro-contagem').textContent = s;
          await esperar(1000);
        }
      }
      if (respiroAtivo) store.set('ciclosTotal', store.get('ciclosTotal', 0) + 1);
    }
    const concluiu = respiroAtivo;
    pararRespiracao();
    if (concluiu) {
      $('#respiro-fase').textContent = 'Muito bem';
      $('#respiro-status').textContent = 'Exercício concluído. Como você se sente agora?';
      toast('Exercício de respiração concluído');
    }
    atualizarStats();
  }
  function pararRespiracao() {
    respiroAtivo = false;
    clearTimeout(respiroTimer);
    circulo.style.transitionDuration = '1s';
    circulo.classList.remove('expandir');
    $('#respiro-fase').textContent = 'Pronto?';
    $('#respiro-contagem').textContent = '';
    $('#respiro-status').textContent = 'Exercício interrompido.';
    $('#btn-respirar-iniciar').disabled = false;
    $('#btn-respirar-parar').disabled = true;
  }
  $('#btn-respirar-iniciar').addEventListener('click', iniciarRespiracao);
  $('#btn-respirar-parar').addEventListener('click', pararRespiracao);

  // =========================================================
  // 02 - Rastreador de humor
  // =========================================================
  const humores = [
    { v: 1, nome: 'Muito mal', cor: '#a5b4fc', boca: 'M13 30 Q20 22 27 30' },
    { v: 2, nome: 'Mal', cor: '#93c5fd', boca: 'M14 29 Q20 25 26 29' },
    { v: 3, nome: 'Neutro', cor: '#fde68a', boca: 'M14 27 L26 27' },
    { v: 4, nome: 'Bem', cor: '#86efac', boca: 'M14 25 Q20 31 26 25' },
    { v: 5, nome: 'Ótimo', cor: '#fdba8c', boca: 'M12 24 Q20 35 28 24 Z' }
  ];
  const tagsDisponiveis = ['Provas', 'Sono', 'Família', 'Amizades', 'Redes sociais', 'Exercício', 'Tarefas', 'Saúde', 'Futuro'];
  const rosto = (h) => `<svg viewBox="0 0 40 40" aria-hidden="true" focusable="false">
      <circle cx="20" cy="20" r="18" fill="${h.cor}"/>
      <circle cx="14" cy="16" r="2.4" fill="#1e1a3a"/><circle cx="26" cy="16" r="2.4" fill="#1e1a3a"/>
      <path d="${h.boca}" stroke="#1e1a3a" stroke-width="2.6" fill="${h.v === 5 ? '#1e1a3a' : 'none'}" stroke-linecap="round" stroke-linejoin="round"/>
    </svg>`;

  let humorSel = null;
  const tagsSel = new Set();
  const listaHumores = $('#humores-lista');
  listaHumores.setAttribute('role', 'radiogroup');
  listaHumores.setAttribute('aria-label', 'Humor');
  listaHumores.innerHTML = humores.map((h, i) => `
    <button type="button" role="radio" class="humor-btn" id="humor-${h.v}" data-v="${h.v}" aria-checked="false"
      tabindex="${i === 0 ? 0 : -1}" style="--cor-humor:${h.cor}">${rosto(h)}<span>${h.nome}</span></button>`).join('');

  function selecionarHumor(v, focar) {
    humorSel = v;
    $$('.humor-btn').forEach(b => {
      const sel = Number(b.dataset.v) === v;
      b.setAttribute('aria-checked', String(sel));
      b.tabIndex = sel ? 0 : -1;
      if (sel && focar) b.focus();
    });
  }
  listaHumores.addEventListener('click', (e) => {
    const b = e.target.closest('.humor-btn');
    if (b) selecionarHumor(Number(b.dataset.v));
  });
  listaHumores.addEventListener('keydown', (e) => {
    const atual = humorSel || 1;
    if (['ArrowRight', 'ArrowDown'].includes(e.key)) { e.preventDefault(); selecionarHumor(atual % 5 + 1, true); }
    if (['ArrowLeft', 'ArrowUp'].includes(e.key)) { e.preventDefault(); selecionarHumor(atual === 1 ? 5 : atual - 1, true); }
  });

  $('#tags-lista').innerHTML = tagsDisponiveis.map((t, i) =>
    `<button type="button" class="tag" id="tag-${i}" aria-pressed="false">${t}</button>`).join('');
  $('#tags-lista').addEventListener('click', (e) => {
    const b = e.target.closest('.tag');
    if (!b) return;
    const t = b.textContent;
    tagsSel.has(t) ? tagsSel.delete(t) : tagsSel.add(t);
    b.setAttribute('aria-pressed', String(tagsSel.has(t)));
  });

  const mensagensHumor = {
    1: 'Sinto muito que esteja difícil. Que tal tentar a respiração guiada ou falar com alguém de confiança?',
    2: 'Dias ruins acontecem. Seja gentil com você hoje e faça uma pausa.',
    3: 'Registro salvo. Um passeio curto ou uma música podem dar um up no dia.',
    4: 'Que bom! Aproveite essa energia com equilíbrio.',
    5: 'Incrível! Lembre o que contribuiu para esse dia ser tão bom.'
  };

  $('#form-humor').addEventListener('submit', (e) => {
    e.preventDefault();
    const fb = $('#humor-feedback');
    if (!humorSel) { fb.textContent = 'Selecione um humor antes de salvar.'; $('#humor-1').focus(); return; }
    const lista = store.get('humores', []);
    lista.unshift({ v: humorSel, tags: [...tagsSel], nota: $('#humor-nota').value.trim(), data: new Date().toISOString() });
    store.set('humores', lista.slice(0, 200));
    fb.textContent = mensagensHumor[humorSel];
    if (humorSel <= 2) toast('Lembre-se: a seção Apoio tem contatos gratuitos 24h.');
    // reset
    humorSel = null; tagsSel.clear();
    $$('.humor-btn').forEach((b, i) => { b.setAttribute('aria-checked', 'false'); b.tabIndex = i === 0 ? 0 : -1; });
    $$('.tag').forEach(b => b.setAttribute('aria-pressed', 'false'));
    $('#humor-nota').value = '';
    renderHumor();
    atualizarStats();
  });

  $('#btn-limpar-humor').addEventListener('click', () => {
    if (!confirm('Deseja apagar todo o histórico de humor?')) return;
    store.set('humores', []);
    renderHumor(); atualizarStats();
    toast('Histórico apagado');
  });

  function renderHumor() {
    const lista = store.get('humores', []);
    const dias = ['Dom', 'Seg', 'Ter', 'Qua', 'Qui', 'Sex', 'Sáb'];
    const cols = [];
    const descricoes = [];
    for (let i = 6; i >= 0; i--) {
      const d = new Date(); d.setDate(d.getDate() - i);
      const iso = isoLocal(d);
      const doDia = lista.filter(r => isoLocal(new Date(r.data)) === iso);
      const media = doDia.length ? doDia.reduce((s, r) => s + r.v, 0) / doDia.length : 0;
      const h = media ? humores[Math.round(media) - 1] : null;
      cols.push(`<div class="grafico__col"><div class="grafico__barra" style="height:${media ? media / 5 * 100 : 4}%;--cor:${h ? h.cor : 'var(--borda)'}" title="${h ? h.nome : 'Sem registro'}"></div><span class="grafico__dia">${dias[d.getDay()]}</span></div>`);
      descricoes.push(`${dias[d.getDay()]}: ${h ? h.nome : 'sem registro'}`);
    }
    const g = $('#grafico-humor');
    g.innerHTML = cols.join('');
    g.setAttribute('aria-label', 'Gráfico de humor dos últimos 7 dias. ' + descricoes.join('; '));

    // Insight
    const semana = lista.filter(r => (Date.now() - new Date(r.data)) < 7 * 864e5);
    let insight = 'Faça seu primeiro registro para ver padrões da sua semana.';
    if (semana.length) {
      const media = semana.reduce((s, r) => s + r.v, 0) / semana.length;
      const contagem = {};
      semana.filter(r => r.v <= 2).forEach(r => r.tags.forEach(t => { contagem[t] = (contagem[t] || 0) + 1; }));
      const pior = Object.entries(contagem).sort((a, b) => b[1] - a[1])[0];
      insight = `Média da semana: ${humores[Math.round(media) - 1].nome} (${media.toFixed(1)} de 5).`;
      if (pior) insight += ` "${pior[0]}" aparece com frequência nos dias difíceis. Vale prestar atenção nisso.`;
    }
    $('#humor-insight').textContent = insight;

    const hist = $('#historico-humor');
    hist.innerHTML = lista.length ? lista.slice(0, 15).map(r => {
      const h = humores[r.v - 1];
      const dt = new Date(r.data).toLocaleString('pt-BR', { day: '2-digit', month: '2-digit', hour: '2-digit', minute: '2-digit' });
      return `<li>${rosto(h)}<div><strong>${h.nome}</strong> <small>${dt}${r.tags.length ? ' · ' + escapar(r.tags.join(', ')) : ''}</small>${r.nota ? `<span>${escapar(r.nota)}</span>` : ''}</div></li>`;
    }).join('') : '<li class="vazio">Nenhum registro ainda.</li>';
  }

  // =========================================================
  // 03 - Foco (Pomodoro + tarefas)
  // =========================================================
  const modos = { foco: 25 * 60, curta: 5 * 60, longa: 15 * 60 };
  const nomesModo = { foco: 'Sessão de foco', curta: 'Pausa curta', longa: 'Pausa longa' };
  const CIRC = 2 * Math.PI * 90;
  let modoAtual = 'foco';
  let restante = modos.foco;
  let fimTimer = null;
  let intervalo = null;
  let seqFoco = 0;

  const fmt = (s) => `${String(Math.floor(s / 60)).padStart(2, '0')}:${String(s % 60).padStart(2, '0')}`;
  function renderTimer() {
    $('#timer-tempo').textContent = fmt(restante);
    $('#timer-progresso').style.strokeDashoffset = CIRC * (1 - restante / modos[modoAtual]);
    if (intervalo) document.title = `${fmt(restante)} ${nomesModo[modoAtual]} | Mente Leve`;
    const hoje = store.get('pomodorosDia', {});
    $('#pomodoros-hoje').textContent = hoje[hojeISO()] || 0;
  }
  function definirModo(m) {
    pausarTimer();
    modoAtual = m;
    restante = modos[m];
    $$('.modo').forEach(b => {
      const ativo = b.dataset.modo === m;
      b.classList.toggle('ativo', ativo);
      b.setAttribute('aria-selected', String(ativo));
    });
    $('#timer-status').textContent = `${nomesModo[m]} pronta. ${m === 'foco' ? 'Desligue as notificações do celular.' : 'Levante, alongue e beba água.'}`;
    renderTimer();
  }
  function iniciarTimer() {
    fimTimer = Date.now() + restante * 1000;
    intervalo = setInterval(tick, 250);
    $('#btn-timer-iniciar').textContent = 'Pausar';
    $('#timer-status').textContent = `${nomesModo[modoAtual]} em andamento.`;
  }
  function pausarTimer() {
    clearInterval(intervalo);
    intervalo = null;
    $('#btn-timer-iniciar').textContent = 'Iniciar';
    document.title = `${titulos[rotaAtual]} | Mente Leve`;
  }
  function alternarTimer() {
    if (intervalo) { pausarTimer(); $('#timer-status').textContent = 'Timer pausado.'; }
    else iniciarTimer();
  }
  function tick() {
    restante = Math.max(0, Math.round((fimTimer - Date.now()) / 1000));
    renderTimer();
    if (restante === 0) {
      pausarTimer();
      bip(660, 0.4); setTimeout(() => bip(880, 0.5), 450);
      if (modoAtual === 'foco') {
        seqFoco++;
        const dia = store.get('pomodorosDia', {});
        dia[hojeISO()] = (dia[hojeISO()] || 0) + 1;
        store.set('pomodorosDia', dia);
        store.set('pomodorosTotal', store.get('pomodorosTotal', 0) + 1);
        atualizarStats();
        toast('Sessão concluída. Hora de uma pausa merecida.');
        definirModo(seqFoco % 4 === 0 ? 'longa' : 'curta');
      } else {
        toast('Pausa encerrada. Pronto para focar de novo?');
        definirModo('foco');
      }
    }
  }
  $$('.modo').forEach(b => b.addEventListener('click', () => definirModo(b.dataset.modo)));
  $('.modos').addEventListener('keydown', (e) => {
    if (!['ArrowLeft', 'ArrowRight'].includes(e.key)) return;
    const ordem = ['foco', 'curta', 'longa'];
    const i = (ordem.indexOf(modoAtual) + (e.key === 'ArrowRight' ? 1 : 2)) % 3;
    definirModo(ordem[i]);
    $(`[data-modo="${ordem[i]}"]`).focus();
  });
  $('#btn-timer-iniciar').addEventListener('click', alternarTimer);
  $('#btn-timer-reset').addEventListener('click', () => definirModo(modoAtual));
  $('#timer-progresso').style.strokeDasharray = CIRC;

  // Tarefas
  const nomesPrio = { alta: 'Alta', media: 'Média', baixa: 'Baixa' };
  function renderTarefas() {
    const tarefas = store.get('tarefas', []);
    const ul = $('#lista-tarefas');
    ul.innerHTML = tarefas.length ? tarefas.map(t => `
      <li class="tarefa prio-${t.prio} ${t.feita ? 'feita' : ''}">
        <input type="checkbox" id="t-${t.id}" data-id="${t.id}" ${t.feita ? 'checked' : ''}>
        <label for="t-${t.id}">${escapar(t.texto)}</label>
        <span class="tarefa__prio">${nomesPrio[t.prio]}</span>
        <button class="tarefa__del" data-del="${t.id}" aria-label="Remover tarefa ${escapar(t.texto)}">&times;</button>
      </li>`).join('') : '<li class="vazio">Nenhuma tarefa. Adicione sua primeira meta de estudo.</li>';
    const feitas = tarefas.filter(t => t.feita).length;
    $('#barra-tarefas').style.width = tarefas.length ? (feitas / tarefas.length * 100) + '%' : '0';
    $('#texto-tarefas').textContent = `${feitas} de ${tarefas.length} concluídas`;
  }
  $('#form-tarefa').addEventListener('submit', (e) => {
    e.preventDefault();
    const input = $('#input-tarefa');
    const texto = input.value.trim();
    if (!texto) return;
    const ordemPrio = { alta: 0, media: 1, baixa: 2 };
    const tarefas = store.get('tarefas', []);
    tarefas.push({ id: Date.now(), texto, prio: $('#select-prioridade').value, feita: false });
    tarefas.sort((a, b) => ordemPrio[a.prio] - ordemPrio[b.prio]);
    store.set('tarefas', tarefas);
    input.value = '';
    renderTarefas();
    toast('Tarefa adicionada');
  });
  $('#lista-tarefas').addEventListener('change', (e) => {
    if (!e.target.dataset.id) return;
    const tarefas = store.get('tarefas', []);
    const t = tarefas.find(x => x.id === Number(e.target.dataset.id));
    t.feita = e.target.checked;
    store.set('tarefas', tarefas);
    renderTarefas();
    $('#t-' + t.id).focus();
    if (t.feita && tarefas.every(x => x.feita)) toast('Todas as tarefas concluídas. Você mandou bem!');
  });
  $('#lista-tarefas').addEventListener('click', (e) => {
    const id = e.target.dataset.del;
    if (!id) return;
    store.set('tarefas', store.get('tarefas', []).filter(t => t.id !== Number(id)));
    renderTarefas();
    $('#input-tarefa').focus();
    toast('Tarefa removida');
  });

  // =========================================================
  // 04 - Anti-burnout
  // =========================================================
  const perguntas = [
    'Você se sentiu exausto(a) mesmo depois de dormir?',
    'Perdeu o interesse por matérias ou atividades que gostava?',
    'Sentiu que, por mais que estude, nunca é suficiente?',
    'Teve dificuldade de concentração nas aulas ou nos estudos?',
    'Deixou de lado lazer, amigos ou hobbies por causa dos estudos?',
    'Sentiu dores de cabeça, tensão ou alterações no apetite?',
    'Ficou irritado(a) ou impaciente com facilidade?',
    'Sentiu vontade de desistir da escola ou do curso?'
  ];
  const escala = ['Nunca', 'Às vezes', 'Frequente', 'Sempre'];
  $('#quiz-perguntas').innerHTML = perguntas.map((p, i) => `
    <fieldset class="pergunta">
      <legend>${i + 1}. ${p}</legend>
      <div class="escala">
        ${escala.map((e, v) => `<label><input type="radio" name="q${i}" value="${v}" id="q${i}-${v}"><span>${e}</span></label>`).join('')}
      </div>
    </fieldset>`).join('');

  $('#form-quiz').addEventListener('submit', (e) => {
    e.preventDefault();
    const res = $('#quiz-resultado');
    const respostas = perguntas.map((_, i) => $(`input[name="q${i}"]:checked`));
    const faltando = respostas.findIndex(r => !r);
    if (faltando !== -1) {
      res.style.setProperty('--cor-res', 'var(--pessego)');
      res.innerHTML = `<p>Responda todas as perguntas. Falta a pergunta ${faltando + 1}.</p>`;
      $(`#q${faltando}-0`).focus();
      return;
    }
    const total = respostas.reduce((s, r) => s + Number(r.value), 0);
    const pct = total / (perguntas.length * 3) * 100;
    let nivel, cor, texto, dicas;
    if (total <= 7) {
      nivel = 'Equilíbrio saudável'; cor = '#86efac';
      texto = 'Você parece estar lidando bem com a rotina. Continue cuidando dos seus limites.';
      dicas = ['Mantenha horários regulares de sono', 'Continue reservando tempo para lazer', 'Use o Pomodoro para manter o ritmo'];
    } else if (total <= 15) {
      nivel = 'Sinais de alerta'; cor = '#fde68a';
      texto = 'Há sinais de cansaço acumulado. É um bom momento para ajustar a rotina antes que piore.';
      dicas = ['Inclua pausas reais entre os estudos', 'Converse com alguém sobre a pressão que sente', 'Pratique respiração guiada diariamente', 'Revise metas: elas estão realistas?'];
    } else {
      nivel = 'Risco elevado de burnout'; cor = '#fb7185';
      texto = 'Suas respostas indicam um nível alto de esgotamento. Você merece apoio, procure ajuda.';
      dicas = ['Converse com um orientador, professor ou familiar', 'Procure um profissional de saúde ou o CAPS', 'Ligue 188 (CVV) se precisar conversar agora', 'Reduza a carga temporariamente, se possível'];
    }
    if (prefs.tema === 'contraste') cor = '#ffff00';
    res.style.setProperty('--cor-res', cor);
    res.innerHTML = `
      <h4>${nivel}</h4>
      <p>Pontuação: ${total} de ${perguntas.length * 3}</p>
      <div class="medidor" aria-hidden="true"><span class="medidor__ponto" style="left:${pct}%"></span></div>
      <p>${texto}</p>
      <ul>${dicas.map(d => `<li>${d}</li>`).join('')}</ul>
      ${total > 15 ? '<p><a href="#apoio">Ver rede de apoio</a></p>' : ''}`;
    res.focus();
  });

  const pausas = [
    ['Alongamento de pescoço', 'Incline a cabeça para cada lado e segure 15 segundos. Repita 3 vezes.'],
    ['Regra 20-20-20', 'Olhe para algo a 6 metros de distância por 20 segundos para descansar os olhos.'],
    ['Copo de água', 'Levante e beba um copo de água. A desidratação reduz a concentração.'],
    ['Música favorita', 'Ouça uma música que você ama, de olhos fechados, sem fazer mais nada.'],
    ['Caminhada curta', 'Dê uma volta pela casa ou pelo quarteirão por 5 minutos.'],
    ['Janela aberta', 'Abra a janela, respire ar fresco e observe o céu por 2 minutos.'],
    ['Sacudir o corpo', 'Fique de pé e sacuda mãos, braços e pernas por 30 segundos para liberar tensão.'],
    ['Mensagem para alguém', 'Mande uma mensagem carinhosa para um amigo ou familiar.'],
    ['Rabisco livre', 'Pegue um papel e desenhe qualquer coisa por 3 minutos, sem julgamento.'],
    ['Lanche consciente', 'Coma uma fruta devagar, prestando atenção no sabor e na textura.']
  ];
  let ultimaPausa = -1;
  $('#btn-pausa').addEventListener('click', () => {
    let i;
    do { i = Math.floor(Math.random() * pausas.length); } while (i === ultimaPausa);
    ultimaPausa = i;
    $('#pausa-titulo').textContent = pausas[i][0];
    $('#pausa-desc').textContent = pausas[i][1];
    const box = $('#pausa-box');
    box.classList.remove('pulsar'); void box.offsetWidth; box.classList.add('pulsar');
  });

  const dicas = [
    ['Sono', 'Durma de 8 a 10 horas', 'O cérebro consolida o que você estudou durante o sono. Virar a noite prejudica a memória.'],
    ['Limites', 'Aprenda a dizer não', 'Você não precisa aceitar todos os compromissos. Proteja seu tempo de descanso.'],
    ['Telas', 'Desconecte antes de dormir', 'Evite celular 1 hora antes de deitar. A luz azul atrapalha o sono.'],
    ['Corpo', 'Mexa-se todos os dias', '30 minutos de atividade física liberam endorfina e reduzem o estresse.'],
    ['Mente', 'Abandone o perfeccionismo', 'Feito é melhor que perfeito. Erros fazem parte do aprendizado.'],
    ['Social', 'Não se isole', 'Estudar em grupo e conversar com amigos diminui a sensação de sobrecarga.']
  ];
  $('#lista-dicas').innerHTML = dicas.map((d, i) => `
    <li class="dica-card">
      <button type="button" id="dica-${i}" aria-expanded="false" aria-label="${d[1]}. Pressione para ver a dica.">
        <span class="dica-face dica-face--frente" aria-hidden="true"><small>${d[0]}</small>${d[1]}</span>
        <span class="dica-face dica-face--verso">${d[2]}</span>
      </button>
    </li>`).join('');
  $('#lista-dicas').addEventListener('click', (e) => {
    const b = e.target.closest('button');
    if (!b) return;
    const aberto = b.getAttribute('aria-expanded') === 'true';
    b.setAttribute('aria-expanded', String(!aberto));
  });

  // =========================================================
  // 05 - Apoio: ancoragem 5-4-3-2-1
  // =========================================================
  const passosAncora = [
    ['5', 'coisas que você pode <strong>ver</strong>', 'Olhe ao redor e nomeie cinco objetos. Repare nas cores e formas.'],
    ['4', 'coisas que você pode <strong>tocar</strong>', 'Sinta a textura da roupa, da mesa, do chão sob seus pés.'],
    ['3', 'sons que você pode <strong>ouvir</strong>', 'Feche os olhos. Perceba sons próximos e distantes.'],
    ['2', 'cheiros que você pode <strong>sentir</strong>', 'Respire devagar. Se não sentir nada, lembre de um cheiro bom.'],
    ['1', 'sabor que você pode <strong>provar</strong>', 'Perceba o gosto na sua boca ou tome um gole de água.'],
    ['', 'Você está aqui, no presente.', 'Muito bem. Respire fundo mais uma vez. Você conseguiu.']
  ];
  let passo = 0;
  $('#ancora-passos').innerHTML = '<span></span>'.repeat(5);
  function renderAncora() {
    const [n, t, d] = passosAncora[passo];
    $('#ancora-num').textContent = n;
    $('#ancora-num').hidden = !n;
    $('#ancora-texto').innerHTML = t;
    $('#ancora-dica').textContent = d;
    $$('#ancora-passos span').forEach((s, i) => s.classList.toggle('ok', i < passo || passo === 5));
    $('#btn-ancora-voltar').disabled = passo === 0;
    $('#btn-ancora-proximo').textContent = passo === 5 ? 'Recomeçar' : passo === 4 ? 'Concluir' : 'Próximo';
  }
  $('#btn-ancora-proximo').addEventListener('click', () => { passo = passo === 5 ? 0 : passo + 1; renderAncora(); });
  $('#btn-ancora-voltar').addEventListener('click', () => { if (passo > 0) passo--; renderAncora(); });

  // =========================================================
  // Inicialização
  // =========================================================
  aplicarPrefs();
  mostrarFrase();
  renderHumor();
  renderTarefas();
  renderTimer();
  renderAncora();
  atualizarStats();
  navegar(rotas.includes(location.hash.slice(1)) ? location.hash.slice(1) : 'inicio', false);
})();
