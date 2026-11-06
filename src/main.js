import {
  ArrowDownToLine, ArrowUpFromLine, ArrowUpRight, Boxes, ChartNoAxesColumnIncreasing,
  ArrowRight, Check, ChevronRight, ChevronsUpDown, CloudOff, ContactRound, createIcons,
  Eye, EyeOff, Inbox, LayoutDashboard, LockKeyhole, LogOut, Mail, Menu, Package, Package2,
  Pencil, Plus, RefreshCw, Repeat2, Search, Settings2, ShieldCheck, ShoppingBag,
  Store, Tags, Trash2, TriangleAlert, Truck, UsersRound, X
} from 'lucide';
import './style.css';

const DEFAULT_API_URL = 'https://backend-bse5.onrender.com';
const savedApiUrl = localStorage.getItem('loja-api-url');
let apiUrl = (savedApiUrl || DEFAULT_API_URL).replace(/\/$/, '');
const SESSION_KEY = 'loja-auth-session';
let accessToken = null;

const resources = {
  products: {
    label: 'Produtos', singular: 'Produto', endpoint: 'produto', id: 'id_produto', icon: 'package-2',
    description: 'Catálogo e preços dos produtos da loja.',
    columns: ['nome', 'descricao', 'preco', 'id_categoria'],
    fields: [
      { key: 'nome', label: 'Nome do produto', required: true },
      { key: 'descricao', label: 'Descrição', type: 'textarea', wide: true },
      { key: 'preco', label: 'Preço', type: 'number', required: true, step: '0.01', prefix: 'R$' },
      { key: 'imagem_produto', label: 'URL da imagem', type: 'url', wide: true },
      { key: 'id_categoria', label: 'Categoria', type: 'select', ref: 'categories' }
    ]
  },
  stock: {
    label: 'Estoque', singular: 'Registro de estoque', endpoint: 'estoque', id: 'id_estoque', icon: 'boxes',
    description: 'Níveis, limites e localização dos produtos armazenados.',
    columns: ['id_produto', 'quantidade', 'estoque_minimo', 'estoque_maximo', 'localizacao'],
    fields: [
      { key: 'id_produto', label: 'Produto', type: 'select', ref: 'products', required: true },
      { key: 'quantidade', label: 'Quantidade', type: 'number', required: true },
      { key: 'estoque_minimo', label: 'Estoque mínimo', type: 'number' },
      { key: 'estoque_maximo', label: 'Estoque máximo', type: 'number' },
      { key: 'localizacao', label: 'Localização' }
    ]
  },
  clients: {
    label: 'Clientes', singular: 'Cliente', endpoint: 'cliente', id: 'id_cliente', icon: 'contact-round',
    description: 'Cadastro e situação dos clientes.',
    columns: ['nome', 'email', 'contato', 'ativo'],
    fields: [
      { key: 'nome', label: 'Nome', required: true },
      { key: 'email', label: 'E-mail', type: 'email' },
      { key: 'contato', label: 'Contato' },
      { key: 'ativo', label: 'Cadastro ativo', type: 'boolean', default: true }
    ]
  },
  suppliers: {
    label: 'Fornecedores', singular: 'Fornecedor', endpoint: 'fornecedor', id: 'id_fornecedor', icon: 'truck',
    description: 'Parceiros e contatos de fornecimento.',
    columns: ['nome', 'empresa', 'email', 'cidade', 'estado', 'ativo'],
    fields: [
      { key: 'nome', label: 'Nome do contato', required: true }, { key: 'empresa', label: 'Empresa' },
      { key: 'email', label: 'E-mail', type: 'email' }, { key: 'telefone', label: 'Telefone' },
      { key: 'cidade', label: 'Cidade' }, { key: 'estado', label: 'Estado' },
      { key: 'ativo', label: 'Cadastro ativo', type: 'boolean', default: true }
    ]
  },
  categories: {
    label: 'Categorias', singular: 'Categoria', endpoint: 'categoria', id: 'id_categoria', icon: 'tags',
    description: 'Organização do catálogo por categoria.',
    columns: ['nome', 'descricao', 'ativo'],
    fields: [
      { key: 'nome', label: 'Nome', required: true }, { key: 'descricao', label: 'Descrição', type: 'textarea', wide: true },
      { key: 'ativo', label: 'Categoria ativa', type: 'boolean', default: true }
    ]
  },
  employees: {
    label: 'Funcionários', singular: 'Funcionário', endpoint: 'funcionario', id: 'id_funcionario', icon: 'users-round',
    description: 'Equipe, funções e dados de admissão.',
    columns: ['nome', 'cargo', 'email', 'telefone', 'data_admissao', 'ativo'],
    fields: [
      { key: 'nome', label: 'Nome', required: true }, { key: 'cargo', label: 'Cargo' },
      { key: 'salario', label: 'Salário', type: 'number', step: '0.01', prefix: 'R$' },
      { key: 'telefone', label: 'Telefone' }, { key: 'email', label: 'E-mail', type: 'email' },
      { key: 'data_admissao', label: 'Data de admissão', type: 'date' },
      { key: 'ativo', label: 'Cadastro ativo', type: 'boolean', default: true }
    ]
  },
  entries: {
    label: 'Entradas', singular: 'Entrada', endpoint: 'entrada', id: 'id_entrada', icon: 'arrow-down-to-line',
    description: 'Recebimentos de produtos e reposições de estoque.',
    columns: ['id_produto', 'id_fornecedor', 'quantidade', 'valor_unitario', 'data_entrada', 'observacao'],
    fields: [
      { key: 'id_produto', label: 'Produto', type: 'select', ref: 'products', required: true },
      { key: 'id_fornecedor', label: 'Fornecedor', type: 'select', ref: 'suppliers', required: true },
      { key: 'quantidade', label: 'Quantidade', type: 'number', required: true },
      { key: 'valor_unitario', label: 'Valor unitário', type: 'number', step: '0.01', prefix: 'R$' },
      { key: 'data_entrada', label: 'Data da entrada', type: 'date' },
      { key: 'observacao', label: 'Observação', type: 'textarea', wide: true }
    ]
  },
  exits: {
    label: 'Saídas', singular: 'Saída', endpoint: 'saida', id: 'id_saida', icon: 'arrow-up-from-line',
    description: 'Baixas de produtos e destino das saídas.',
    columns: ['id_produto', 'id_funcionario', 'quantidade', 'valor_unitario', 'data_saida', 'destino'],
    fields: [
      { key: 'id_produto', label: 'Produto', type: 'select', ref: 'products', required: true },
      { key: 'id_funcionario', label: 'Funcionário', type: 'select', ref: 'employees' },
      { key: 'quantidade', label: 'Quantidade', type: 'number', required: true },
      { key: 'valor_unitario', label: 'Valor unitário', type: 'number', step: '0.01', prefix: 'R$' },
      { key: 'data_saida', label: 'Data da saída', type: 'date' }, { key: 'destino', label: 'Destino' }
    ]
  },
  orders: {
    label: 'Pedidos', singular: 'Pedido', endpoint: 'pedido', id: 'id_pedido', icon: 'shopping-bag',
    description: 'Pedidos registrados e respectivos clientes.',
    columns: ['id_pedido', 'status', 'data_pedido', 'id_cliente'],
    fields: [
      { key: 'status', label: 'Status', required: true }, { key: 'data_pedido', label: 'Data do pedido', type: 'date' },
      { key: 'id_cliente', label: 'Cliente', type: 'select', ref: 'clients' }
    ]
  },
  movements: {
    label: 'Movimentações', singular: 'Movimentação', endpoint: 'movimentacao', id: 'id_movimentacao', icon: 'repeat-2',
    description: 'Histórico de alterações de estoque.',
    columns: ['id_produto', 'tipo', 'quantidade', 'data_movimentacao', 'observacao'],
    fields: [
      { key: 'id_produto', label: 'Produto', type: 'select', ref: 'products', required: true },
      { key: 'tipo', label: 'Tipo', required: true }, { key: 'quantidade', label: 'Quantidade', type: 'number' },
      { key: 'data_movimentacao', label: 'Data', type: 'date' }, { key: 'observacao', label: 'Observação', type: 'textarea', wide: true }
    ]
  }
};

const state = { page: 'dashboard', data: {}, query: '', editing: null, toastTimer: null, user: null };
const content = document.querySelector('#page-content');
const nav = document.querySelector('#resource-nav');

function renderIcons() {
  createIcons({ icons: {
    ArrowDownToLine, ArrowRight, ArrowUpFromLine, ArrowUpRight, Boxes, ChartNoAxesColumnIncreasing,
    Check, ChevronRight, ChevronsUpDown, CloudOff, ContactRound, Eye, EyeOff, Inbox, LayoutDashboard,
    LockKeyhole, LogOut, Mail, Menu, Package, Package2, Pencil, Plus, RefreshCw, Repeat2,
    Search, Settings2, ShieldCheck, ShoppingBag, Store, Tags, Trash2, TriangleAlert,
    Truck, UsersRound, X
  } });
}

function setApiStatus(status) {
  const dot = document.querySelector('#api-dot');
  const label = document.querySelector('#api-status');
  dot.className = `status-dot ${status}`;
  label.textContent = status === 'online' ? 'API conectada' : status === 'offline' ? 'API indisponível' : 'Conectando à API';
}

async function request(path, options = {}) {
  const headers = { 'Content-Type': 'application/json', ...options.headers };
  if (accessToken) headers.Authorization = `Bearer ${accessToken}`;
  const response = await fetch(`${apiUrl}/${path}`, {
    ...options,
    headers
  });
  const text = await response.text();
  let payload = {};
  try { payload = text ? JSON.parse(text) : {}; } catch { payload = { mensagem: text }; }
  if (!response.ok) {
    const message = payload?.erro?.mensagem || payload?.mensagem || `A API respondeu com erro ${response.status}.`;
    throw new Error(String(message).replace(/\s+/g, ' ').slice(0, 240));
  }
  return payload;
}

function extractRows(payload) {
  if (Array.isArray(payload)) return payload;
  if (!payload || typeof payload !== 'object') return [];
  return Object.values(payload).find(Array.isArray) || [];
}

async function loadResource(key, { force = false } = {}) {
  if (!force && state.data[key]) return state.data[key];
  const resource = resources[key];
  const rows = extractRows(await request(resource.endpoint));
  state.data[key] = rows;
  return rows;
}

function formatLabel(key) {
  const names = {
    id_produto: 'Produto', id_categoria: 'Categoria', id_cliente: 'Cliente', id_fornecedor: 'Fornecedor',
    id_funcionario: 'Funcionário', id_estoque: 'Estoque', id_entrada: 'Entrada', id_saida: 'Saída',
    id_pedido: 'Pedido', id_item: 'Item', id_movimentacao: 'Movimentação', id_historico: 'Histórico',
    id_log: 'Log', nome: 'Nome', preco: 'Preço', descricao: 'Descrição', imagem_produto: 'Imagem',
    estoque_minimo: 'Mínimo', estoque_maximo: 'Máximo', valor_unitario: 'Valor unitário',
    data_admissao: 'Admissão', data_entrada: 'Data da entrada', data_saida: 'Data da saída',
    data_pedido: 'Data do pedido', data_movimentacao: 'Data', observacao: 'Observação',
    ativo: 'Situação', quantidade: 'Quantidade', localizacao: 'Localização', salario: 'Salário',
    telefone: 'Telefone', empresa: 'Empresa', estado: 'Estado', cidade: 'Cidade', cargo: 'Cargo',
    status: 'Status', tipo: 'Tipo', destino: 'Destino', email: 'E-mail', contato: 'Contato'
  };
  return names[key] || key.replace(/^id_/, '').replaceAll('_', ' ').replace(/^\w/, char => char.toUpperCase());
}

function formatValue(value, key) {
  if (value === null || value === undefined || value === '') return '<span class="muted-value">—</span>';
  if (typeof value === 'boolean' || key === 'ativo') {
    const active = value === true || value === 1 || value === '1' || value === 'true';
    return `<span class="status-pill ${active ? 'is-active' : 'is-inactive'}"><span></span>${active ? 'Ativo' : 'Inativo'}</span>`;
  }
  if (key.startsWith('data_') || key === 'vigencia') {
    const date = new Date(value);
    if (!Number.isNaN(date.getTime())) return date.toLocaleDateString('pt-BR', { timeZone: 'UTC' });
  }
  if (['preco', 'valor_unitario', 'salario', 'subtotal'].includes(key) && Number.isFinite(Number(value))) {
    return new Intl.NumberFormat('pt-BR', { style: 'currency', currency: 'BRL' }).format(Number(value));
  }
  if (key.startsWith('id_') && Number.isFinite(Number(value))) return `<span class="reference-id">#${escapeHtml(value)}</span>`;
  return escapeHtml(String(value));
}

function escapeHtml(value) {
  return value.replace(/[&<>"']/g, char => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' })[char]);
}

function setActiveNav() {
  document.querySelectorAll('[data-page]').forEach(button => button.classList.toggle('active', button.dataset.page === state.page));
  const title = state.page === 'dashboard' ? 'Painel' : resources[state.page]?.label || 'Painel';
  document.querySelector('#current-section').textContent = title;
}

function renderNav() {
  nav.innerHTML = Object.entries(resources).map(([key, resource]) => `
    <button class="nav-link" data-page="${key}"><i data-lucide="${resource.icon}"></i><span>${resource.label}</span></button>
  `).join('');
  nav.querySelectorAll('[data-page]').forEach(button => button.addEventListener('click', () => navigate(button.dataset.page)));
  renderIcons();
}

function navigate(page) {
  state.page = page;
  state.query = '';
  setActiveNav();
  document.querySelector('#sidebar').classList.remove('is-open');
  if (page === 'dashboard') renderDashboard();
  else renderResourcePage(page);
}

function pageHeading(title, description, action = '') {
  return `<div class="page-heading"><div><div class="eyebrow">GESTÃO DA LOJA</div><h1>${title}</h1><p>${description}</p></div>${action}</div>`;
}

function metricCard(icon, label, value, note, color) {
  return `<article class="metric-card"><div class="metric-top"><span class="metric-icon ${color}"><i data-lucide="${icon}"></i></span><span class="metric-note">${note}</span></div><div class="metric-value">${value}</div><div class="metric-label">${label}</div></article>`;
}

async function renderDashboard() {
  setActiveNav();
  content.innerHTML = `${pageHeading('Bom dia, Carlos', 'Acompanhe o movimento e a saúde da sua operação.', '<button class="button button-primary" data-action="new-product"><i data-lucide="plus"></i><span>Novo produto</span></button>')}<div class="loading-line"><span></span> Atualizando dados da loja...</div>`;
  renderIcons();
  const keys = ['products', 'categories', 'stock', 'clients', 'entries'];
  const results = await Promise.allSettled(keys.map(key => loadResource(key, { force: true })));
  if (state.page !== 'dashboard') return;
  const failed = results.filter(result => result.status === 'rejected');
  const products = state.data.products || [];
  const categories = state.data.categories || [];
  const stock = state.data.stock || [];
  const clients = state.data.clients || [];
  const units = stock.reduce((total, row) => total + (Number(row.quantidade) || 0), 0);
  const monitored = stock.filter(row => row.estoque_minimo !== null && row.estoque_minimo !== undefined);
  const low = monitored.filter(row => Number(row.quantidade) <= Number(row.estoque_minimo)).length;
  const categoryMap = new Map(categories.map(item => [String(item.id_categoria), item.nome]));
  const productRows = products.slice(0, 6).map(product => `
    <tr><td><div class="product-cell">${product.imagem_produto ? `<img src="${escapeHtml(product.imagem_produto)}" alt="" loading="lazy" onerror="this.classList.add('image-error');this.removeAttribute('src')">` : '<span class="product-placeholder"><i data-lucide="package"></i></span>'}<span><strong>${escapeHtml(product.nome || 'Sem nome')}</strong><small>${escapeHtml(product.descricao || 'Sem descrição')}</small></span></div></td><td>${categoryMap.get(String(product.id_categoria)) || '<span class="muted-value">Sem categoria</span>'}</td><td class="price-cell">${formatValue(product.preco, 'preco')}</td><td><span class="row-state"><span></span> Disponível</span></td></tr>
  `).join('');

  content.innerHTML = `${pageHeading('Bom dia, Carlos', 'Acompanhe o movimento e a saúde da sua operação.', '<button class="button button-primary" data-action="new-product"><i data-lucide="plus"></i><span>Novo produto</span></button>')}
    ${failed.length ? `<div class="inline-alert"><i data-lucide="triangle-alert"></i><span>Alguns dados não puderam ser carregados. As seções correspondentes continuam disponíveis para nova tentativa.</span></div>` : ''}
    <section class="metrics-grid">
      ${metricCard('package-2', 'Produtos no catálogo', products.length, 'Catálogo atual', 'mint')}
      ${metricCard('boxes', 'Unidades em estoque', units, `${stock.length} ${stock.length === 1 ? 'registro monitorado' : 'registros monitorados'}`, 'butter')}
      ${metricCard('contact-round', 'Clientes cadastrados', clients.length, 'Base de clientes', 'coral')}
      ${metricCard('triangle-alert', 'Abaixo do mínimo', low, monitored.length ? 'Requer atenção' : 'Defina limites no estoque', 'blue')}
    </section>
    <section class="dashboard-grid">
      <article class="panel product-panel"><header class="panel-heading"><div><div class="eyebrow">CATÁLOGO</div><h2>Produtos recentes</h2></div><button class="text-button" data-page="products">Ver catálogo <i data-lucide="arrow-up-right"></i></button></header>
        ${products.length ? `<div class="table-wrap"><table><thead><tr><th>Produto</th><th>Categoria</th><th>Preço</th><th>Situação</th></tr></thead><tbody>${productRows}</tbody></table></div>` : emptyMessage(failed.length ? 'Não foi possível carregar o catálogo.' : 'Nenhum produto cadastrado.', 'Tente atualizar os dados ou adicione o primeiro produto.')}
      </article>
      <aside class="side-panels"><article class="panel stock-panel"><header class="panel-heading"><div><div class="eyebrow">ESTOQUE</div><h2>Visão rápida</h2></div><i class="heading-icon" data-lucide="chart-no-axes-column-increasing"></i></header><div class="stock-summary"><strong>${units}</strong><span>unidades registradas</span></div><div class="stock-track"><span style="width:${Math.min(100, monitored.length ? (low / monitored.length) * 100 : 8)}%"></span></div><p>${monitored.length ? `${low} de ${monitored.length} produtos no limite mínimo` : 'Cadastre limites mínimos para acompanhar reposições.'}</p><button class="text-button" data-page="stock">Abrir estoque <i data-lucide="arrow-up-right"></i></button></article>
      <article class="panel operation-panel"><div class="operation-icon"><i data-lucide="arrow-down-to-line"></i></div><div><div class="eyebrow">MOVIMENTO</div><h2>Reposição de produtos</h2><p>Registre compras recebidas e atualize o estoque.</p><button class="text-button" data-page="entries">Ver entradas <i data-lucide="arrow-up-right"></i></button></div></article></aside>
    </section>`;
  bindPageActions();
  renderIcons();
}

function emptyMessage(title, detail) {
  return `<div class="empty-state"><span class="empty-icon"><i data-lucide="inbox"></i></span><strong>${title}</strong><p>${detail}</p></div>`;
}

function renderResourcePage(key) {
  const resource = resources[key];
  if (!resource) return navigate('dashboard');
  setActiveNav();
  content.innerHTML = `${pageHeading(resource.label, resource.description, `<button class="button button-primary" data-action="create"><i data-lucide="plus"></i><span>Novo ${resource.singular.toLocaleLowerCase('pt-BR')}</span></button>`)}
    <section class="panel resource-panel"><div class="table-toolbar"><label class="search-field"><i data-lucide="search"></i><input id="table-search" type="search" placeholder="Buscar ${resource.label.toLocaleLowerCase('pt-BR')}..." autocomplete="off"></label><span class="result-count" id="result-count">Carregando...</span><button class="icon-button refresh-button" id="refresh-resource" title="Atualizar lista" aria-label="Atualizar lista"><i data-lucide="refresh-cw"></i></button></div><div id="resource-table"></div></section>`;
  renderIcons();
  document.querySelector('#table-search').addEventListener('input', event => { state.query = event.target.value.trim().toLocaleLowerCase('pt-BR'); renderTable(key); });
  document.querySelector('#refresh-resource').addEventListener('click', () => loadResource(key, { force: true }).then(() => renderTable(key)).catch(error => renderLoadError(key, error)));
  loadResource(key, { force: true }).then(() => { if (state.page === key) renderTable(key); }).catch(error => renderLoadError(key, error));
  bindPageActions();
}

function renderLoadError(key, error) {
  if (state.page !== key) return;
  document.querySelector('#result-count').textContent = 'Falha ao carregar';
  document.querySelector('#resource-table').innerHTML = `<div class="error-state"><span class="error-icon"><i data-lucide="cloud-off"></i></span><div><strong>Não foi possível carregar ${resources[key].label.toLocaleLowerCase('pt-BR')}.</strong><p>${escapeHtml(error.message)}</p><button class="button button-quiet" id="retry-load"><i data-lucide="refresh-cw"></i><span>Tentar novamente</span></button></div></div>`;
  document.querySelector('#retry-load').addEventListener('click', () => loadResource(key, { force: true }).then(() => renderTable(key)).catch(nextError => renderLoadError(key, nextError)));
  renderIcons();
}

function renderTable(key) {
  const resource = resources[key];
  const rows = state.data[key] || [];
  const filtered = rows.filter(row => Object.values(row).some(value => String(value ?? '').toLocaleLowerCase('pt-BR').includes(state.query)));
  document.querySelector('#result-count').textContent = `${filtered.length} ${filtered.length === 1 ? 'registro' : 'registros'}`;
  if (!filtered.length) {
    document.querySelector('#resource-table').innerHTML = emptyMessage(rows.length ? 'Nenhum resultado encontrado.' : `Nenhum registro de ${resource.label.toLocaleLowerCase('pt-BR')}.`, rows.length ? 'Ajuste os termos da busca.' : 'Adicione um registro para começar.');
    renderIcons();
    return;
  }
  const columns = resource.columns;
  document.querySelector('#resource-table').innerHTML = `<div class="table-wrap"><table><thead><tr>${columns.map(column => `<th>${formatLabel(column)}</th>`).join('')}<th class="actions-heading">Ações</th></tr></thead><tbody>${filtered.map(row => `<tr>${columns.map(column => `<td>${formatValue(row[column], column)}</td>`).join('')}<td><div class="row-actions"><button class="icon-button row-action" data-action="edit" data-id="${escapeHtml(String(row[resource.id]))}" title="Editar" aria-label="Editar"><i data-lucide="pencil"></i></button><button class="icon-button row-action delete-action" data-action="delete" data-id="${escapeHtml(String(row[resource.id]))}" title="Excluir" aria-label="Excluir"><i data-lucide="trash-2"></i></button></div></td></tr>`).join('')}</tbody></table></div>`;
  document.querySelectorAll('[data-action="edit"]').forEach(button => button.addEventListener('click', () => openForm(key, button.dataset.id)));
  document.querySelectorAll('[data-action="delete"]').forEach(button => button.addEventListener('click', () => deleteRecord(key, button.dataset.id)));
  renderIcons();
}

function bindPageActions() {
  content.querySelectorAll('[data-page]').forEach(button => button.addEventListener('click', () => navigate(button.dataset.page)));
  document.querySelector('[data-action="new-product"]')?.addEventListener('click', () => openForm('products'));
  document.querySelector('[data-action="create"]')?.addEventListener('click', () => openForm(state.page));
}

async function openForm(key, id = null) {
  const resource = resources[key];
  const record = id ? (state.data[key] || []).find(item => String(item[resource.id]) === String(id)) : null;
  state.editing = { key, id };
  const fieldsContainer = document.querySelector('#form-fields');
  document.querySelector('#modal-title').textContent = `${id ? 'Editar' : 'Novo'} ${resource.singular.toLocaleLowerCase('pt-BR')}`;
  document.querySelector('#form-submit span').textContent = id ? 'Salvar alterações' : 'Salvar registro';
  fieldsContainer.innerHTML = '<div class="form-loading">Preparando campos...</div>';
  document.querySelector('#modal-backdrop').hidden = false;
  document.body.classList.add('modal-open');
  try {
    const references = [...new Set(resource.fields.filter(field => field.ref).map(field => field.ref))];
    await Promise.all(references.map(ref => loadResource(ref)));
    fieldsContainer.innerHTML = resource.fields.map(field => renderField(field, record?.[field.key])).join('');
    renderIcons();
  } catch (error) {
    fieldsContainer.innerHTML = `<p class="field-error">${escapeHtml(error.message)}</p>`;
  }
}

function inputValue(field, value) {
  if (value !== undefined && value !== null) {
    if (field.type === 'date') return String(value).slice(0, 10);
    if (field.type === 'boolean') return value === true || value === 1 || value === '1' || value === 'true' ? 'true' : 'false';
    return String(value);
  }
  if (field.type === 'boolean') return String(field.default ?? false);
  if (field.type === 'date') return new Date().toISOString().slice(0, 10);
  return '';
}

function renderField(field, value) {
  const id = `field-${field.key}`;
  const required = field.required ? 'required' : '';
  const wide = field.wide ? 'field-wide' : '';
  let control;
  if (field.type === 'textarea') {
    control = `<textarea id="${id}" name="${field.key}" rows="3" ${required}>${escapeHtml(inputValue(field, value))}</textarea>`;
  } else if (field.type === 'boolean') {
    const checked = inputValue(field, value) === 'true' ? 'checked' : '';
    control = `<label class="toggle-control" for="${id}"><input id="${id}" name="${field.key}" type="checkbox" ${checked}><span class="toggle-track"></span><span>Sim, manter ativo</span></label>`;
  } else if (field.type === 'select') {
    const options = (state.data[field.ref] || []).map(item => {
      const target = resources[field.ref];
      const display = item.nome || item.empresa || item[target.id] || 'Registro';
      return `<option value="${escapeHtml(String(item[target.id]))}" ${String(value ?? '') === String(item[target.id]) ? 'selected' : ''}>${escapeHtml(String(display))}</option>`;
    }).join('');
    control = `<select id="${id}" name="${field.key}" ${required}><option value="">Selecione...</option>${options}</select>`;
  } else {
    const type = field.type || 'text';
    const input = `<input id="${id}" name="${field.key}" type="${type}" value="${escapeHtml(inputValue(field, value))}" ${field.step ? `step="${field.step}"` : ''} ${required} ${type === 'number' ? 'min="0"' : ''}>`;
    control = field.prefix ? `<div class="input-prefix"><span>${field.prefix}</span>${input}</div>` : input;
  }
  return `<div class="form-field ${wide}"><label for="${id}">${field.label}${field.required ? '<span class="required-mark"> *</span>' : ''}</label>${control}</div>`;
}

function closeModal() {
  document.querySelector('#modal-backdrop').hidden = true;
  document.body.classList.remove('modal-open');
  state.editing = null;
}

function showToast(message, type = 'success') {
  const toast = document.querySelector('#toast');
  toast.textContent = message;
  toast.className = `toast is-visible ${type}`;
  clearTimeout(state.toastTimer);
  state.toastTimer = setTimeout(() => toast.classList.remove('is-visible'), 3200);
}

async function saveRecord(event) {
  event.preventDefault();
  const { key, id } = state.editing;
  const resource = resources[key];
  const data = {};
  for (const field of resource.fields) {
    const control = event.currentTarget.elements.namedItem(field.key);
    if (!control) continue;
    if (field.type === 'boolean') data[field.key] = control.checked;
    else {
      const value = control.value.trim();
      if (!value) continue;
      data[field.key] = field.type === 'number' || field.type === 'select' ? Number(value) : value;
    }
  }
  const submit = document.querySelector('#form-submit');
  submit.disabled = true;
  submit.querySelector('span').textContent = 'Salvando...';
  try {
    await request(id ? `${resource.endpoint}/${encodeURIComponent(id)}` : resource.endpoint, {
      method: id ? 'PATCH' : 'POST', body: JSON.stringify(data)
    });
    closeModal();
    showToast(`${resource.singular} ${id ? 'atualizado' : 'cadastrado'} com sucesso.`);
    await loadResource(key, { force: true });
    if (state.page === key) renderTable(key);
    if (state.page === 'dashboard') renderDashboard();
  } catch (error) {
    showToast(error.message, 'error');
  } finally {
    submit.disabled = false;
    submit.querySelector('span').textContent = id ? 'Salvar alterações' : 'Salvar registro';
  }
}

async function deleteRecord(key, id) {
  const resource = resources[key];
  const record = (state.data[key] || []).find(item => String(item[resource.id]) === String(id));
  const displayName = record?.nome || `#${id}`;
  if (!window.confirm(`Excluir ${resource.singular.toLocaleLowerCase('pt-BR')} ${displayName}? Esta ação não pode ser desfeita.`)) return;
  try {
    await request(`${resource.endpoint}/${encodeURIComponent(id)}`, { method: 'DELETE' });
    showToast(`${resource.singular} removido com sucesso.`);
    await loadResource(key, { force: true });
    if (state.page === key) renderTable(key);
  } catch (error) {
    showToast(error.message, 'error');
  }
}

async function checkConnection() {
  setApiStatus('checking');
  try {
    await request('produto');
    setApiStatus('online');
  } catch {
    setApiStatus('offline');
  }
}

function readSession() {
  try {
    const session = JSON.parse(sessionStorage.getItem(SESSION_KEY) || 'null');
    if (!session?.token || !session?.user) return null;
    const payload = JSON.parse(atob(session.token.split('.')[1].replace(/-/g, '+').replace(/_/g, '/')));
    if (!payload.exp || payload.exp * 1000 <= Date.now()) return null;
    return session;
  } catch {
    return null;
  }
}

function setAuthError(message) {
  const error = document.querySelector('#login-error');
  error.textContent = message;
  error.hidden = !message;
}

function showAuthenticatedArea(user) {
  state.user = user;
  document.querySelector('#auth-screen').hidden = true;
  document.querySelector('#app-shell').hidden = false;
  document.querySelector('#user-name').textContent = user.nome || 'Usuário';
  document.querySelector('#user-email').textContent = user.email || 'Sessão ativa';
  document.querySelector('#user-initials').textContent = (user.nome || user.email || 'U')
    .split(/[\s@._-]+/).filter(Boolean).slice(0, 2).map(part => part[0].toLocaleUpperCase('pt-BR')).join('');
  renderDashboard();
  checkConnection();
}

async function login(event) {
  event.preventDefault();
  const form = event.currentTarget;
  if (!form.reportValidity()) return;
  const submit = document.querySelector('#login-submit');
  const submitLabel = submit.querySelector('span');
  setAuthError('');
  submit.disabled = true;
  submitLabel.textContent = 'Autenticando...';
  try {
    const response = await request('usuario/login', {
      method: 'POST',
      body: JSON.stringify({
        email: form.elements.email.value.trim(),
        senha: form.elements.senha.value
      })
    });
    if (!response.token || !response.usuario) throw new Error('A API não retornou uma sessão válida.');
    const session = { token: response.token, user: response.usuario };
    accessToken = session.token;
    sessionStorage.setItem(SESSION_KEY, JSON.stringify(session));
    form.reset();
    showAuthenticatedArea(session.user);
  } catch (error) {
    setAuthError(error.message || 'Não foi possível entrar. Verifique suas credenciais.');
    form.elements.senha.value = '';
    form.elements.email.focus();
  } finally {
    submit.disabled = false;
    submitLabel.textContent = 'Entrar no painel';
  }
}

function logout() {
  sessionStorage.removeItem(SESSION_KEY);
  accessToken = null;
  state.user = null;
  state.data = {};
  state.page = 'dashboard';
  closeModal();
  document.querySelector('#app-shell').hidden = true;
  document.querySelector('#auth-screen').hidden = false;
  document.querySelector('#login-form').reset();
  setAuthError('');
  document.querySelector('#login-email').focus();
}

document.querySelector('#modal-close').addEventListener('click', closeModal);
document.querySelector('#modal-cancel').addEventListener('click', closeModal);
document.querySelector('#modal-backdrop').addEventListener('click', event => { if (event.target.id === 'modal-backdrop') closeModal(); });
document.querySelector('#record-form').addEventListener('submit', saveRecord);
document.querySelector('#login-form').addEventListener('submit', login);
document.querySelector('#logout-button').addEventListener('click', logout);
document.querySelector('#password-toggle').addEventListener('click', event => {
  const password = document.querySelector('#login-password');
  const button = event.currentTarget;
  const showPassword = password.type === 'password';
  password.type = showPassword ? 'text' : 'password';
  button.setAttribute('aria-label', showPassword ? 'Ocultar senha' : 'Mostrar senha');
  button.innerHTML = `<i data-lucide="${showPassword ? 'eye-off' : 'eye'}"></i>`;
  renderIcons();
});
document.querySelector('#menu-toggle').addEventListener('click', () => document.querySelector('#sidebar').classList.toggle('is-open'));
document.querySelector('#api-settings').addEventListener('click', async () => {
  const answer = window.prompt('Endereço base da API:', apiUrl);
  if (!answer?.trim()) return;
  apiUrl = answer.trim().replace(/\/$/, '');
  localStorage.setItem('loja-api-url', apiUrl);
  await checkConnection();
  if (state.page === 'dashboard') renderDashboard();
  else renderResourcePage(state.page);
});

document.querySelector('#today-label').textContent = new Intl.DateTimeFormat('pt-BR', { weekday: 'long', day: 'numeric', month: 'long' }).format(new Date());
document.querySelector('[data-page="dashboard"]').addEventListener('click', () => navigate('dashboard'));
renderNav();
setActiveNav();
renderIcons();
document.querySelector('#auth-api-label').textContent = new URL(apiUrl).host;
const existingSession = readSession();
if (existingSession) {
  accessToken = existingSession.token;
  showAuthenticatedArea(existingSession.user);
} else {
  sessionStorage.removeItem(SESSION_KEY);
  document.querySelector('#auth-screen').hidden = false;
  document.querySelector('#login-email').focus();
}