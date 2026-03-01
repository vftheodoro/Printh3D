// ============================================
// PRINTH3D PRO — Módulo Principal (App)
// Orquestra navegação, CRUD, modais e feedback
// ============================================

const App = (() => {
    // === ESTADO INTERNO ===
    let currentSection = 'dashboard';
    let editingProductId = null;
    let editingUserId = null;
    let editingClientId = null;
    let productViewMode = 'table'; // 'table' | 'grid'
    let searchTimeout = null;
    let _confirmResolve = null;

    // ==========================================
    //  INICIALIZAÇÃO (async)
    // ==========================================

    async function init() {
        try {
            await Storage.init();
        } catch (err) {
            console.error('[App] Falha ao inicializar Storage/DB:', err);
        }

        if (!Auth.checkAuth()) {
            hideLoading();
            return;
        }

        setupUI();
        setupNavigation();
        setupGlobalListeners();
        await initRootStorageStartupFlow();
        await navigate('dashboard');
        hideLoading();

        console.log('[App] Printh3D Pro inicializado.');
    }

    function hideLoading() {
        const loader = document.getElementById('app-loading');
        const layout = document.getElementById('app-layout');
        if (loader) loader.style.display = 'none';
        if (layout) layout.style.display = '';
    }

    // ------------------------------------------
    // Configura UI baseada no usuário logado
    // ------------------------------------------
    function setupUI() {
        const user = Auth.getCurrentUser();
        if (!user) return;

        const avatarEl = document.getElementById('user-avatar');
        const nameEl = document.getElementById('user-display-name');
        const roleEl = document.getElementById('user-display-role');
        const headerName = document.getElementById('header-user-name');

        if (avatarEl) avatarEl.textContent = user.nome.charAt(0).toUpperCase();
        if (nameEl) nameEl.textContent = user.nome;
        if (roleEl) roleEl.textContent = user.tipo === 'ADMIN' ? 'Administrador' : 'Vendedor';
        if (headerName) headerName.textContent = user.nome;

        if (!Auth.isAdmin()) {
            document.querySelectorAll('.admin-only').forEach(el => {
                el.style.display = 'none';
            });
        }
    }

    // ------------------------------------------
    // Configura listeners de navegação
    // ------------------------------------------
    function setupNavigation() {
        document.querySelectorAll('[data-section]').forEach(link => {
            link.addEventListener('click', e => {
                e.preventDefault();
                navigate(link.dataset.section);
                closeMobileSidebar();
            });
        });

        document.getElementById('btn-logout').addEventListener('click', e => {
            e.preventDefault();
            Auth.logout();
        });

        // Backup ZIP
        const btnBackup = document.getElementById('btn-export-backup');
        if (btnBackup) {
            btnBackup.addEventListener('click', async () => {
                try {
                    showToast('Gerando backup ZIP...', 'info');
                    await Database.exportFullBackup();
                    showToast('Backup ZIP exportado!', 'success');
                } catch (err) {
                    showToast('Erro no backup: ' + err.message, 'danger');
                }
            });
        }

        // Exportar Excel
        const btnExcel = document.getElementById('btn-export-excel');
        if (btnExcel) {
            btnExcel.addEventListener('click', async () => {
                try {
                    await Database.exportExcel();
                    showToast('Excel exportado!', 'success');
                } catch (err) {
                    showToast('Erro ao exportar: ' + err.message, 'danger');
                }
            });
        }

        // Importar
        document.getElementById('btn-import-trigger').addEventListener('click', () => {
            document.getElementById('file-import').click();
        });

        document.getElementById('file-import').addEventListener('change', async (e) => {
            const file = e.target.files[0];
            if (!file) return;
            try {
                if (file.name.endsWith('.zip')) {
                    showToast('Importando backup ZIP...', 'info');
                    await Database.importFullBackup(file);
                    await Storage.refreshCache();
                    showToast('Backup importado com sucesso!', 'success');
                } else {
                    await Storage.importExcel(file);
                    showToast('Dados importados com sucesso!', 'success');
                }
                navigate(currentSection);
            } catch (err) {
                showToast('Erro ao importar: ' + err.message, 'danger');
            }
            e.target.value = '';
        });

        const btnRootConnect = document.getElementById('btn-root-connect');
        if (btnRootConnect) {
            btnRootConnect.addEventListener('click', async () => {
                await connectRootStorage();
            });
        }

        const btnRootSync = document.getElementById('btn-root-sync');
        if (btnRootSync) {
            btnRootSync.addEventListener('click', async () => {
                await syncRootStorageNow();
            });
        }

        const btnRootRestore = document.getElementById('btn-root-restore');
        if (btnRootRestore) {
            btnRootRestore.addEventListener('click', async () => {
                await restoreRootStorage();
            });
        }

        const btnRootAccess = document.getElementById('btn-root-access');
        if (btnRootAccess) {
            btnRootAccess.addEventListener('click', async () => {
                await accessRootStorage();
            });
        }

        const btnRootSidebar = document.getElementById('btn-root-sync-sidebar');
        if (btnRootSidebar) {
            btnRootSidebar.addEventListener('click', async () => {
                await syncRootStorageNow();
            });
        }

        const toggleBtn = document.getElementById('sidebar-toggle');
        if (toggleBtn) {
            toggleBtn.addEventListener('click', () => {
                document.getElementById('sidebar').classList.toggle('open');
                document.getElementById('sidebar-backdrop').classList.toggle('active');
            });
        }

        const backdrop = document.getElementById('sidebar-backdrop');
        if (backdrop) backdrop.addEventListener('click', closeMobileSidebar);
    }

    // ------------------------------------------
    // Listeners globais
    // ------------------------------------------
    function setupGlobalListeners() {
        document.getElementById('modal-overlay').addEventListener('click', e => {
            if (e.target === e.currentTarget) closeModal();
        });
        document.getElementById('confirm-overlay')?.addEventListener('click', e => {
            if (e.target === e.currentTarget) resolveConfirm(false);
        });
        document.getElementById('confirm-cancel')?.addEventListener('click', () => resolveConfirm(false));
        document.getElementById('confirm-ok')?.addEventListener('click', () => resolveConfirm(true));
        document.addEventListener('keydown', e => {
            if (e.key === 'Escape') {
                closeModal();
                resolveConfirm(false);
            }
        });
    }

    function closeMobileSidebar() {
        document.getElementById('sidebar').classList.remove('open');
        document.getElementById('sidebar-backdrop').classList.remove('active');
    }

    async function initRootStorageStartupFlow() {
        if (typeof RootStorage === 'undefined') return;
        if (!Auth.isAdmin()) return;

        try {
            await RootStorage.initFromSavedHandle();
        } catch (_) {}

        const status = RootStorage.getStatus();
        if (!status.supported || status.active) return;

        openRootStorageOnboardingModal();
    }

    function openRootStorageOnboardingModal() {
        const html = `
        <div class="card" style="border:none;box-shadow:none;padding:0;">
            <p class="text-secondary" style="margin-bottom:0.75rem;">
                Este sistema trabalha com duas camadas: operação no navegador e cópia física em pasta raiz para recuperação manual.
            </p>
            <ul class="text-secondary" style="padding-left:1rem;margin:0 0 1rem 0;display:grid;gap:0.35rem;">
                <li>Dados ficam organizados em JSON na pasta <strong>printh3d_data/data</strong>.</li>
                <li>Imagens e arquivos ficam separados por tipo em <strong>printh3d_data/files</strong>.</li>
                <li>Configurações, filtros e visualizações ficam em <strong>printh3d_data/config</strong>.</li>
                <li>Se o sistema falhar, você consegue recuperar tudo manualmente pela raiz.</li>
            </ul>
            <div class="form-actions" style="justify-content:flex-start;">
                <button type="button" class="btn btn-secondary" onclick="App.chooseExistingRootFolder()">
                    <i data-lucide="folder-open"></i> Sincronizar Pasta Existente
                </button>
                <button type="button" class="btn btn-primary" onclick="App.createNewRootFolder()">
                    <i data-lucide="folder-plus"></i> Criar Pasta do Zero
                </button>
                <button type="button" class="btn btn-secondary" onclick="App.closeModal()">
                    Agora não
                </button>
            </div>
        </div>`;

        openModal('Configuração Inicial da Pasta Raiz', html);
    }

    async function chooseExistingRootFolder() {
        if (!Auth.isAdmin()) return;
        try {
            if (typeof RootStorage === 'undefined') throw new Error('Módulo de pasta raiz não carregado.');

            await RootStorage.connectDirectory({ createStructure: false });
            const hasBackup = await RootStorage.hasBackupData();

            if (hasBackup) {
                await RootStorage.restoreToDatabase();
                showToast('Pasta existente sincronizada e dados restaurados.', 'success');
                await navigate(currentSection);
            } else {
                const ok = await confirmDialog('Pasta sem backup', 'Não foi encontrado backup existente nessa pasta. Deseja iniciar uma nova estrutura com os dados atuais do sistema?');
                if (ok) {
                    await syncRootStorageNow(true);
                    showToast('Nova estrutura criada e sincronizada na pasta selecionada.', 'success');
                }
            }

            closeModal();
        } catch (err) {
            showToast('Falha ao sincronizar pasta existente: ' + err.message, 'danger');
        }
        renderRootStorageStatus();
    }

    async function createNewRootFolder() {
        if (!Auth.isAdmin()) return;
        try {
            if (typeof RootStorage === 'undefined') throw new Error('Módulo de pasta raiz não carregado.');

            await RootStorage.connectDirectory();
            await syncRootStorageNow(true);
            showToast('Pasta raiz nova criada e sincronizada com sucesso.', 'success');
            closeModal();
        } catch (err) {
            showToast('Falha ao criar pasta raiz: ' + err.message, 'danger');
        }
        renderRootStorageStatus();
    }

    // ==========================================
    //  CONFIRMAÇÃO MODAL
    // ==========================================

    function confirmDialog(title, message) {
        return new Promise(resolve => {
            _confirmResolve = resolve;
            document.getElementById('confirm-title').textContent = title;
            document.getElementById('confirm-message').textContent = message;
            document.getElementById('confirm-overlay').classList.remove('hidden');
        });
    }

    function resolveConfirm(val) {
        document.getElementById('confirm-overlay')?.classList.add('hidden');
        if (_confirmResolve) {
            _confirmResolve(val);
            _confirmResolve = null;
        }
    }

    // ==========================================
    //  NAVEGAÇÃO
    // ==========================================

    async function navigate(section) {
        currentSection = section;

        document.querySelectorAll('[data-section]').forEach(link => {
            const li = link.parentElement;
            li.classList.toggle('active', link.dataset.section === section);
        });

        document.querySelectorAll('.section').forEach(el => {
            el.classList.toggle('active', el.id === 'section-' + section);
        });

        const titles = {
            dashboard: 'Dashboard', categories: 'Categorias',
            products: 'Produtos', sales: 'Vendas', expenses: 'Gastos', clients: 'Clientes',
            promotions: 'Promoções e Cupons',
            calculator: 'Calculadora de Custo',
            settings: 'Configurações', users: 'Usuários', trash: 'Lixeira'
        };
        setText('page-title', titles[section] || '');

        switch (section) {
            case 'dashboard':  Dashboard.render(); break;
            case 'categories': await renderCategories(); break;
            case 'products':   await renderProducts(); break;
            case 'sales':      renderSales(); break;
            case 'expenses':   renderExpenses(); break;
            case 'clients':    renderClients(); break;
            case 'promotions': await renderPromotions(); break;
            case 'calculator': await renderCalculator(); break;
            case 'settings':   renderSettings(); break;
            case 'users':      renderUsers(); break;
            case 'trash':      await renderTrash(); break;
        }

        if (typeof lucide !== 'undefined') lucide.createIcons();
    }

    // ==========================================
    //  MODAL GENÉRICO
    // ==========================================

    function openModal(title, bodyHtml, wide) {
        document.getElementById('modal-title').textContent = title;
        document.getElementById('modal-body').innerHTML = bodyHtml;
        const container = document.getElementById('modal-container');
        if (container) container.classList.toggle('modal-wide', !!wide);
        document.getElementById('modal-overlay').classList.remove('hidden');
        document.body.style.overflow = 'hidden';
        if (typeof lucide !== 'undefined') lucide.createIcons();
    }

    function closeModal() {
        document.getElementById('modal-overlay').classList.add('hidden');
        document.body.style.overflow = '';
        editingProductId = null;
        editingUserId = null;
        editingClientId = null;
    }

    // ==========================================
    //  CATEGORIAS — CRUD
    // ==========================================

    async function renderCategories() {
        const categories = await Categories.getAll();
        const grid = document.getElementById('categories-grid');
        if (!grid) return;

        if (categories.length === 0) {
            grid.innerHTML = `<div class="empty-state"><div class="empty-icon"><i data-lucide="folder"></i></div><p>Nenhuma categoria.<br>Clique em "+ Nova Categoria" para criar.</p></div>`;
            return;
        }

        let html = '';
        for (const cat of categories) {
            const count = await Categories.getProductCount(cat.id);
            html += `
            <div class="category-card" style="border-left: 4px solid ${cat.cor}">
                <div class="category-card-header">
                    <div class="category-icon" style="background:${cat.cor}20;color:${cat.cor}">
                        <i data-lucide="${cat.icone || 'package'}"></i>
                    </div>
                    <div>
                        <h4>${escapeHtml(cat.nome)}</h4>
                        <span class="badge badge-secondary">${escapeHtml(cat.prefixo)}</span>
                    </div>
                </div>
                <p class="category-desc">${escapeHtml(cat.descricao || '')}</p>
                <div class="category-footer">
                    <span class="text-muted">${count} produto(s)</span>
                    <div class="actions">
                        <button class="btn btn-sm btn-icon" onclick="App.openCategoryModal(${cat.id})" title="Editar"><i data-lucide="pencil"></i></button>
                        <button class="btn btn-sm btn-icon btn-danger-ghost" onclick="App.deleteCategory(${cat.id})" title="Excluir"><i data-lucide="trash-2"></i></button>
                    </div>
                </div>
            </div>`;
        }
        grid.innerHTML = html;
        refreshLucideIcons();
    }

    async function openCategoryModal(id) {
        const cat = id ? await Categories.getById(id) : null;
        const title = cat ? 'Editar Categoria' : 'Nova Categoria';

        const iconsBtns = Categories.AVAILABLE_ICONS.map(ic => {
            const sel = (cat && cat.icone === ic) ? 'selected' : '';
            return `<button type="button" class="icon-btn ${sel}" data-icon="${ic}" onclick="App._selectIcon(this)"><i data-lucide="${ic}"></i></button>`;
        }).join('');

        const colorBtns = Categories.AVAILABLE_COLORS.map(c => {
            const sel = (cat && cat.cor === c) ? 'selected' : '';
            return `<button type="button" class="color-btn ${sel}" data-color="${c}" style="background:${c}" onclick="App._selectColor(this)"></button>`;
        }).join('');

        const html = `
        <form onsubmit="event.preventDefault(); App.saveCategory(${id || 'null'});">
            <div class="form-grid">
                <div class="form-group">
                    <label>Nome da Categoria</label>
                    <input type="text" id="cat-nome" value="${cat ? escapeHtml(cat.nome) : ''}" required placeholder="Ex: Chaveiros">
                </div>
                <div class="form-group">
                    <label>Prefixo SKU (2-5 letras)</label>
                    <input type="text" id="cat-prefixo" value="${cat ? escapeHtml(cat.prefixo) : ''}" required maxlength="5" placeholder="Ex: CHAV" style="text-transform:uppercase">
                </div>
            </div>
            <div class="form-group">
                <label>Descrição</label>
                <input type="text" id="cat-descricao" value="${cat ? escapeHtml(cat.descricao || '') : ''}" placeholder="Descrição breve (opcional)">
            </div>
            <div class="form-group">
                <label>Ícone</label>
                <div class="icon-picker">${iconsBtns}</div>
                <input type="hidden" id="cat-icone" value="${cat ? cat.icone : 'package'}">
            </div>
            <div class="form-group">
                <label>Cor</label>
                <div class="color-picker">${colorBtns}</div>
                <input type="hidden" id="cat-cor" value="${cat ? cat.cor : '#00BCFF'}">
            </div>
            <div class="form-actions">
                <button type="button" class="btn btn-secondary" onclick="App.closeModal()">Cancelar</button>
                <button type="submit" class="btn btn-primary"><i data-lucide="save"></i> ${cat ? 'Atualizar' : 'Criar Categoria'}</button>
            </div>
        </form>`;

        openModal(title, html);
    }

    function _selectIcon(btn) {
        btn.closest('.icon-picker').querySelectorAll('.icon-btn').forEach(b => b.classList.remove('selected'));
        btn.classList.add('selected');
        document.getElementById('cat-icone').value = btn.dataset.icon;
    }

    function _selectColor(btn) {
        btn.closest('.color-picker').querySelectorAll('.color-btn').forEach(b => b.classList.remove('selected'));
        btn.classList.add('selected');
        document.getElementById('cat-cor').value = btn.dataset.color;
    }

    async function saveCategory(id) {
        const data = {
            id: id || undefined,
            nome: document.getElementById('cat-nome').value.trim(),
            prefixo: document.getElementById('cat-prefixo').value.trim(),
            descricao: document.getElementById('cat-descricao').value.trim(),
            icone: document.getElementById('cat-icone').value,
            cor: document.getElementById('cat-cor').value
        };
        try {
            await Categories.save(data);
            showToast(id ? 'Categoria atualizada!' : 'Categoria criada!', 'success');
            closeModal();
            await renderCategories();
        } catch (err) {
            showToast(err.message, 'danger');
        }
    }

    async function deleteCategory(id) {
        const cat = await Categories.getById(id);
        if (!cat) return;
        const ok = await confirmDialog('Excluir Categoria', `Excluir a categoria "${cat.nome}"? Esta ação não pode ser desfeita.`);
        if (!ok) return;
        try {
            await Categories.remove(id);
            showToast('Categoria excluída.', 'success');
            await renderCategories();
        } catch (err) {
            showToast(err.message, 'danger');
        }
    }

    // ==========================================
    //  PRODUTOS — CRUD COMPLETO
    // ==========================================

    async function renderProducts() {
        await populateCategoryFilter();
        await loadProductsList();
    }

    async function populateCategoryFilter() {
        const categories = await Categories.getAll();
        const sel = document.getElementById('filter-category');
        if (!sel) return;
        const cur = sel.value;
        sel.innerHTML = '<option value="">Todas</option>';
        categories.forEach(c => {
            const opt = document.createElement('option');
            opt.value = c.id;
            opt.textContent = c.nome;
            if (String(c.id) === cur) opt.selected = true;
            sel.appendChild(opt);
        });
    }

    async function loadProductsList() {
        const query = document.getElementById('product-search')?.value || '';
        const categoryId = document.getElementById('filter-category')?.value;
        const status = document.getElementById('filter-status')?.value;
        const sort = document.getElementById('filter-sort')?.value || 'nome';

        const filters = { sort };
        if (categoryId) filters.category_id = parseInt(categoryId);
        if (status) filters.status = status;

        const products = await Database.searchProducts(query, filters);
        const promotions = await Promotions.getAllPromotions();
        const now = new Date().toISOString();

        // Table view
        const tbody = document.getElementById('products-body');
        if (tbody) {
            if (products.length === 0) {
                tbody.innerHTML = `<tr><td colspan="11" class="text-center text-muted" style="padding:2.5rem;"><div class="empty-state"><div class="empty-icon"><i data-lucide="package"></i></div><p>Nenhum produto encontrado.</p></div></td></tr>`;
            } else {
                tbody.innerHTML = products.map(p => {
                    const margem = p.preco_venda > 0 ? ((p.preco_venda - p.custo_total) / p.preco_venda * 100) : 0;
                    const margemClass = margem < 20 ? 'text-danger' : 'text-success';
                    const promo = promotions.find(pr => pr.product_id === p.id && pr.ativo && (!pr.data_fim || pr.data_fim >= now));
                    const promoHtml = promo ? `<span class="badge badge-warning">${promo.tipo_desconto === 'percentual' ? promo.valor_desconto + '%' : 'R$' + promo.valor_desconto}</span>` : '<span class="text-muted">—</span>';
                    const stockClass = (p.estoque_minimo > 0 && p.quantidade_estoque <= p.estoque_minimo) ? 'text-danger' : '';
                    const statusBadge = p.ativo !== false ? '<span class="badge badge-success">Ativo</span>' : '<span class="badge badge-secondary">Inativo</span>';

                    return `<tr onclick="App.openProductSummary(${p.id})" style="cursor:pointer;" title="Clique para ver o resumo do produto">
                        <td><div class="product-thumb" data-product-id="${p.id}"><i data-lucide="image"></i></div></td>
                        <td><code>${escapeHtml(p.codigo_sku || '—')}</code></td>
                        <td><strong>${escapeHtml(p.nome)}</strong></td>
                        <td><span class="badge" style="background:${p._category_cor || '#666'}20;color:${p._category_cor || '#666'};border:1px solid ${p._category_cor || '#666'}40">${escapeHtml(p._category_nome || '—')}</span></td>
                        <td>${fmtC(p.custo_total)}</td>
                        <td>${fmtC(p.preco_venda)}</td>
                        <td>${promoHtml}</td>
                        <td class="${stockClass}">${p.quantidade_estoque ?? 0}</td>
                        <td class="${margemClass}">${margem.toFixed(1)}%</td>
                        <td>${statusBadge}</td>
                        <td class="actions">
                            <button class="btn btn-sm btn-icon" onclick="event.stopPropagation(); App.openProductModal(${p.id})" title="Editar"><i data-lucide="pencil"></i></button>
                            <button class="btn btn-sm btn-icon" onclick="event.stopPropagation(); App.downloadProductZip(${p.id})" title="ZIP"><i data-lucide="archive"></i></button>
                            <button class="btn btn-sm btn-icon btn-danger-ghost" onclick="event.stopPropagation(); App.deleteProduct(${p.id})" title="Excluir"><i data-lucide="trash-2"></i></button>
                        </td>
                    </tr>`;
                }).join('');
            }
        }

        // Grid view
        const gridEl = document.getElementById('products-grid-view');
        if (gridEl) {
            if (products.length === 0) {
                gridEl.innerHTML = `<div class="empty-state"><p>Nenhum produto encontrado.</p></div>`;
            } else {
                gridEl.innerHTML = products.map(p => {
                    const promo = promotions.find(pr => pr.product_id === p.id && pr.ativo && (!pr.data_fim || pr.data_fim >= now));
                    return `
                    <div class="product-card" onclick="App.openProductSummary(${p.id})">
                        <div class="product-card-thumb" data-product-id="${p.id}"><i data-lucide="image"></i></div>
                        <div class="product-card-body">
                            <code class="text-muted">${escapeHtml(p.codigo_sku || '')}</code>
                            <h4>${escapeHtml(p.nome)}</h4>
                            <span class="badge" style="background:${p._category_cor || '#666'}20;color:${p._category_cor || '#666'}">${escapeHtml(p._category_nome || '—')}</span>
                            <div class="product-card-price">
                                ${promo ? `<span class="price-promo">${fmtC(promo.preco_promocional)}</span><span class="price-original">${fmtC(p.preco_venda)}</span>` : `<span>${fmtC(p.preco_venda)}</span>`}
                            </div>
                        </div>
                    </div>`;
                }).join('');
            }
        }

        refreshLucideIcons();

        // Load thumbnails async
        loadProductThumbnails(products);
    }

    async function loadProductThumbnails(products) {
        for (const p of products) {
            const url = await FileManager.getFirstImageUrl(p.id);
            if (url) {
                document.querySelectorAll(`[data-product-id="${p.id}"]`).forEach(el => {
                    el.innerHTML = `<img src="${url}" alt="">`;
                });
            }
        }
    }

    async function openProductSummary(id) {
        const product = await Database.getById(Database.STORES.PRODUCTS, id);
        if (!product) {
            showToast('Produto não encontrado.', 'warning');
            return;
        }

        const [category, promo, files] = await Promise.all([
            product.category_id ? Categories.getById(product.category_id) : Promise.resolve(null),
            Promotions.getActivePromotion(id),
            FileManager.getProductFiles(id)
        ]);

        const dim = product.dimensoes || {};
        const social = product.descricoes_social || {};
        const socialGeral = social.geral || social.instagram || social.facebook || social.whatsapp || social.tiktok || '';
        const margin = product.preco_venda > 0 ? ((product.preco_venda - product.custo_total) / product.preco_venda * 100) : 0;
        const estoque = product.quantidade_estoque || 0;
        const estoqueMinimo = product.estoque_minimo || 0;
        const estoqueEmAlerta = estoqueMinimo > 0 && estoque <= estoqueMinimo;
        const tags = Array.isArray(product.tags) ? product.tags.filter(Boolean) : [];

        const fmtDateTime = (value) => {
            if (!value) return '—';
            const date = new Date(value);
            return Number.isNaN(date.getTime()) ? '—' : date.toLocaleString('pt-BR');
        };

        const filesByType = {
            image: files.filter(f => f.tipo === 'image').length,
            model3d: files.filter(f => f.tipo === 'model3d').length,
            document: files.filter(f => f.tipo === 'document').length
        };

        const promoInfo = promo
            ? `${promo.tipo_desconto === 'percentual' ? promo.valor_desconto + '%' : fmtC(promo.valor_desconto)} • Preço promocional: ${fmtC(promo.preco_promocional)}`
            : 'Nenhuma promoção ativa';

        const fileTypeLabel = {
            image: 'Imagem',
            model3d: 'Modelo 3D',
            document: 'Documento'
        };

        const filesListHtml = files.length === 0
            ? `<p class="text-muted">Nenhum arquivo vinculado.</p>`
            : `<div class="file-gallery">
                ${files.map(f => {
                    const isImage = f.tipo === 'image';
                    const icon = FileManager.getFileIcon(f.tipo);
                    const typeLabel = fileTypeLabel[f.tipo] || 'Arquivo';
                    return `
                    <div class="file-item">
                        <div class="file-preview ${isImage ? 'file-preview-image' : ''}">
                            ${isImage
                                ? `<img class="file-thumb" data-summary-file-id="${f.id}" alt="${escapeHtml(f.nome_arquivo || '')}">`
                                : `<i data-lucide="${icon}"></i>`}
                        </div>
                        <div class="file-info">
                            <span class="file-name" title="${escapeHtml(f.nome_arquivo || '')}">${escapeHtml(f.nome_arquivo || 'Arquivo')}</span>
                            <span class="file-size">${typeLabel} • ${FileManager.formatFileSize(f.tamanho_bytes || 0)}</span>
                        </div>
                        <div class="file-actions">
                            <button type="button" class="btn btn-sm btn-icon" onclick="FileManager.downloadFile(${f.id})" title="Baixar arquivo">
                                <i data-lucide="download"></i>
                            </button>
                        </div>
                    </div>`;
                }).join('')}
            </div>`;

        const html = `
        <div>
            <div class="form-grid">
                <div class="form-group">
                    <label>Produto</label>
                    <p><strong>${escapeHtml(product.nome || '—')}</strong></p>
                </div>
                <div class="form-group">
                    <label>Status</label>
                    <p>${product.ativo !== false ? '<span class="badge badge-success">Ativo</span>' : '<span class="badge badge-secondary">Inativo</span>'}</p>
                </div>
            </div>

            <div class="form-grid">
                <div class="form-group">
                    <label>SKU</label>
                    <p><code>${escapeHtml(product.codigo_sku || '—')}</code></p>
                </div>
                <div class="form-group">
                    <label>Categoria</label>
                    <p>${category ? `<span class="badge" style="background:${category.cor || '#666'}20;color:${category.cor || '#666'};border:1px solid ${category.cor || '#666'}40">${escapeHtml(category.nome)}</span>` : '—'}</p>
                </div>
            </div>

            <div class="form-group">
                <label>Descrição</label>
                <p>${escapeHtml(product.descricao || '—')}</p>
            </div>

            <div class="form-grid">
                <div class="form-group"><label>Material</label><p>${escapeHtml(product.material || '—')}</p></div>
                <div class="form-group"><label>Cor</label><p>${escapeHtml(product.cor || '—')}</p></div>
                <div class="form-group"><label>Resolução</label><p>${product.resolucao_camada ? `${product.resolucao_camada} mm` : '—'}</p></div>
            </div>

            <div class="form-grid">
                <div class="form-group"><label>Largura</label><p>${dim.largura || 0} mm</p></div>
                <div class="form-group"><label>Altura</label><p>${dim.altura || 0} mm</p></div>
                <div class="form-group"><label>Profundidade</label><p>${dim.profundidade || 0} mm</p></div>
            </div>

            <div class="form-grid">
                <div class="form-group"><label>Peso</label><p>${product.peso_g || 0} g</p></div>
                <div class="form-group"><label>Tempo de impressão</label><p>${product.tempo_h || 0} h</p></div>
                <div class="form-group"><label>Margem</label><p class="${margin < 20 ? 'text-danger' : 'text-success'}">${margin.toFixed(1)}%</p></div>
            </div>

            <div class="form-grid">
                <div class="form-group"><label>Custo total</label><p>${fmtC(product.custo_total || 0)}</p></div>
                <div class="form-group"><label>Preço de venda</label><p><strong>${fmtC(product.preco_venda || 0)}</strong></p></div>
                <div class="form-group"><label>Promoção</label><p>${promoInfo}</p></div>
            </div>

            <div class="form-grid">
                <div class="form-group">
                    <label>Estoque</label>
                    <p class="${estoqueEmAlerta ? 'text-danger' : ''}">${estoque}${estoqueEmAlerta ? ' (em alerta)' : ''}</p>
                </div>
                <div class="form-group"><label>Estoque mínimo</label><p>${estoqueMinimo}</p></div>
                <div class="form-group"><label>Tags</label><p>${tags.length ? tags.map(t => `<span class="badge badge-secondary">${escapeHtml(t)}</span>`).join(' ') : '—'}</p></div>
            </div>

            <div class="form-group">
                <label>Descrição para redes</label>
                <p>${escapeHtml(socialGeral || '—')}</p>
            </div>

            <div class="form-grid">
                <div class="form-group"><label>Arquivos vinculados</label><p>${files.length} arquivo(s)</p></div>
                <div class="form-group"><label>Imagens / Modelos / Documentos</label><p>${filesByType.image} / ${filesByType.model3d} / ${filesByType.document}</p></div>
                <div class="form-group"><label>Atualizado em</label><p>${fmtDateTime(product.updated_at || product.created_at)}</p></div>
            </div>

            <div class="form-group">
                <label>Arquivos para Visualização / Download</label>
                ${filesListHtml}
            </div>

            <div class="form-group">
                <label>Criado em</label>
                <p>${fmtDateTime(product.created_at)}</p>
            </div>

            <div class="form-actions">
                <button type="button" class="btn btn-secondary" onclick="App.closeModal()">Fechar</button>
                <button type="button" class="btn btn-secondary" onclick="App.downloadProductZip(${product.id})"><i data-lucide="archive"></i> Exportar ZIP</button>
                <button type="button" class="btn btn-primary" onclick="App.openProductModal(${product.id})"><i data-lucide="pencil"></i> Editar Produto</button>
            </div>
        </div>`;

        openModal('Resumo do Produto', html, true);

        for (const f of files) {
            if (f.tipo !== 'image') continue;
            try {
                const url = await FileManager.getImageThumbnailUrl(f.id);
                const img = document.querySelector(`img[data-summary-file-id="${f.id}"]`);
                if (img && url) img.src = url;
            } catch (e) {
                // ignora falha de thumbnail
            }
        }
    }

    function toggleProductView() {
        productViewMode = productViewMode === 'table' ? 'grid' : 'table';
        const tableView = document.getElementById('products-table-view');
        const gridView = document.getElementById('products-grid-view');
        if (tableView) tableView.classList.toggle('hidden', productViewMode !== 'table');
        if (gridView) gridView.classList.toggle('hidden', productViewMode !== 'grid');
    }

    function debounceProductSearch() {
        clearTimeout(searchTimeout);
        searchTimeout = setTimeout(() => loadProductsList(), 300);
    }

    async function filterProducts() {
        await loadProductsList();
    }

    // ------------------------------------------
    // Product Modal with Tabs
    // ------------------------------------------
    async function openProductModal(id) {
        editingProductId = id || null;
        const product = id ? await Database.getById(Database.STORES.PRODUCTS, id) : null;
        const categories = await Categories.getAll();
        const title = product ? 'Editar Produto' : 'Novo Produto';

        let defaultSku = '';
        const firstCatId = categories.length > 0 ? categories[0].id : null;
        if (!product && firstCatId) {
            defaultSku = await Database.getNextSKU(firstCatId);
        }

        const catOptions = categories.map(c =>
            `<option value="${c.id}" ${product && product.category_id === c.id ? 'selected' : (!product && c.id === firstCatId ? 'selected' : '')}>${escapeHtml(c.nome)} (${c.prefixo})</option>`
        ).join('');

        const p = product || {};
        const dim = p.dimensoes || {};
        const social = p.descricoes_social || {};
        const socialGeral = social.geral || social.instagram || social.facebook || social.whatsapp || social.tiktok || '';

        const html = `
        <div class="modal-tabs">
            <button class="modal-tab active" onclick="App.switchProductTab('tab-basic')">Básico</button>
            <button class="modal-tab" onclick="App.switchProductTab('tab-details')">Detalhes</button>
            <button class="modal-tab" onclick="App.switchProductTab('tab-stock')">Estoque</button>
            ${id ? '<button class="modal-tab" onclick="App.switchProductTab(\'tab-files\')">Arquivos</button>' : ''}
            <button class="modal-tab" onclick="App.switchProductTab('tab-social')">Redes Sociais</button>
        </div>
        <form id="product-form" onsubmit="event.preventDefault(); App.saveProduct();">

            <!-- TAB: Básico -->
            <div class="modal-tab-content active" id="tab-basic">
                <div class="form-grid">
                    <div class="form-group">
                        <label>Categoria</label>
                        <select id="prod-category" required onchange="App.onCategoryChange()">${catOptions}</select>
                    </div>
                    <div class="form-group">
                        <label>Código SKU</label>
                        <input type="text" id="prod-sku" value="${product ? escapeHtml(p.codigo_sku) : escapeHtml(defaultSku)}" required placeholder="AUTO-001" style="text-transform:uppercase">
                        <small>Auto-gerado ao mudar categoria, ou edite manualmente</small>
                    </div>
                </div>
                <div class="form-group">
                    <label>Nome do Produto</label>
                    <input type="text" id="prod-nome" value="${product ? escapeHtml(p.nome) : ''}" required placeholder="Ex: Vaso Decorativo Espiral">
                </div>
                <div class="form-group">
                    <label>Descrição</label>
                    <textarea id="prod-descricao" rows="2" placeholder="Descrição interna do produto...">${product ? escapeHtml(p.descricao || '') : ''}</textarea>
                </div>
                <div class="form-grid">
                    <div class="form-group">
                        <label>Peso (g)</label>
                        <input type="number" id="prod-peso" value="${p.peso_g || ''}" required min="0.1" step="0.1" placeholder="150" oninput="App.calcProductPreview()">
                    </div>
                    <div class="form-group">
                        <label>Tempo (h)</label>
                        <input type="number" id="prod-tempo" value="${p.tempo_h || ''}" required min="0.1" step="0.1" placeholder="3.5" oninput="App.calcProductPreview()">
                    </div>
                    <div class="form-group">
                        <label>Preço (R$)</label>
                        <input type="number" id="prod-preco" value="${p.preco_venda || ''}" step="0.01" min="0" placeholder="Auto" oninput="App.calcProductPreview()">
                        <small>Deixe vazio para calcular automático</small>
                    </div>
                </div>
                <div id="calc-preview" class="calc-preview" style="display:none;">
                    <h4><i data-lucide="bar-chart-3"></i> Simulação de Custo</h4>
                    <div class="calc-grid">
                        <div class="calc-item"><span>Material</span><span id="calc-material">—</span></div>
                        <div class="calc-item"><span>Máquina</span><span id="calc-maquina">—</span></div>
                        <div class="calc-item"><span>Energia</span><span id="calc-energia">—</span></div>
                        <div class="calc-item total"><span>Custo Total</span><span id="calc-total">—</span></div>
                        <div class="calc-item success"><span>Preço Venda</span><span id="calc-preco">—</span></div>
                        <div class="calc-item"><span>Margem</span><span id="calc-margem">—</span></div>
                    </div>
                </div>
                <div class="form-group">
                    <label>Tags</label>
                    <input type="text" id="prod-tags" value="${(p.tags || []).join(', ')}" placeholder="Ex: decoração, vaso, espiral (separar com vírgula)">
                </div>
                <div class="form-group" style="display:flex;align-items:center;gap:0.75rem;">
                    <input type="checkbox" id="prod-ativo" ${p.ativo !== false ? 'checked' : ''}>
                    <label for="prod-ativo" style="margin:0;cursor:pointer;">Produto ativo</label>
                </div>
            </div>

            <!-- TAB: Detalhes -->
            <div class="modal-tab-content" id="tab-details">
                <div class="form-grid">
                    <div class="form-group">
                        <label>Material</label>
                        <select id="prod-material">
                            ${['PLA', 'ABS', 'PETG', 'TPU', 'Nylon', 'Resina', 'ASA', 'PC', 'Outro'].map(m =>
                                `<option ${p.material === m ? 'selected' : ''}>${m}</option>`
                            ).join('')}
                        </select>
                    </div>
                    <div class="form-group">
                        <label>Cor do Filamento</label>
                        <input type="text" id="prod-cor" value="${escapeHtml(p.cor || '')}" placeholder="Ex: Branco, Preto, Azul">
                    </div>
                    <div class="form-group">
                        <label>Resolução da Camada (mm)</label>
                        <input type="number" id="prod-resolucao" value="${p.resolucao_camada || 0.2}" step="0.01" min="0.01" max="1">
                    </div>
                </div>
                <h4 style="margin-top:1rem;"><i data-lucide="ruler"></i> Dimensões (mm)</h4>
                <div class="form-grid">
                    <div class="form-group">
                        <label>Largura</label>
                        <input type="number" id="prod-dim-l" value="${dim.largura || 0}" step="0.1" min="0">
                    </div>
                    <div class="form-group">
                        <label>Altura</label>
                        <input type="number" id="prod-dim-a" value="${dim.altura || 0}" step="0.1" min="0">
                    </div>
                    <div class="form-group">
                        <label>Profundidade</label>
                        <input type="number" id="prod-dim-p" value="${dim.profundidade || 0}" step="0.1" min="0">
                    </div>
                </div>
            </div>

            <!-- TAB: Estoque -->
            <div class="modal-tab-content" id="tab-stock">
                <div class="form-grid">
                    <div class="form-group">
                        <label>Quantidade em Estoque</label>
                        <input type="number" id="prod-estoque" value="${p.quantidade_estoque || 0}" min="0" step="1">
                    </div>
                    <div class="form-group">
                        <label>Estoque Mínimo (alerta)</label>
                        <input type="number" id="prod-estoque-min" value="${p.estoque_minimo || 0}" min="0" step="1">
                        <small>0 = sem alerta. Quando o estoque atingir esse valor, um alerta será exibido.</small>
                    </div>
                </div>
            </div>

            ${id ? `
            <!-- TAB: Arquivos -->
            <div class="modal-tab-content" id="tab-files">
                ${FileManager.renderUploadZone(id)}
                <div id="file-gallery-container"></div>
            </div>
            ` : ''}

            <!-- TAB: Redes Sociais -->
            <div class="modal-tab-content" id="tab-social">
                <p class="text-muted" style="font-size:0.85rem;margin-bottom:1rem;">Use uma descrição única para todas as redes sociais.</p>
                <div class="form-group">
                    <label><i data-lucide="globe"></i> Descrição Geral</label>
                    <textarea id="prod-social-geral" rows="4" maxlength="5000" placeholder="Descrição única para Instagram, Facebook, WhatsApp, TikTok e marketplace...">${escapeHtml(socialGeral)}</textarea>
                    <small class="char-count"><span id="count-geral">${socialGeral.length}</span>/5000</small>
                </div>
            </div>

            <div class="form-actions">
                <button type="button" class="btn btn-secondary" onclick="App.closeModal()">Cancelar</button>
                <button type="submit" class="btn btn-primary"><i data-lucide="save"></i> ${product ? 'Atualizar' : 'Salvar Produto'}</button>
            </div>
        </form>`;

        openModal(title, html, true);

        // Setup char counters
        setupCharCounter('prod-social-geral', 'count-geral');

        // If editing, show calc preview and load files
        if (product) {
            setTimeout(() => calcProductPreview(), 50);
            if (id) await refreshProductFiles(id);
        }
    }

    function setupCharCounter(textareaId, countId) {
        const ta = document.getElementById(textareaId);
        const cnt = document.getElementById(countId);
        if (ta && cnt) {
            ta.addEventListener('input', () => { cnt.textContent = ta.value.length; });
        }
    }

    function switchProductTab(tabId) {
        document.querySelectorAll('.modal-tab').forEach((btn, i) => {
            btn.classList.toggle('active', document.querySelectorAll('.modal-tab-content')[i]?.id === tabId);
        });
        document.querySelectorAll('.modal-tab-content').forEach(el => {
            el.classList.toggle('active', el.id === tabId);
        });
    }

    async function onCategoryChange() {
        const catId = parseInt(document.getElementById('prod-category')?.value);
        if (!catId || editingProductId) return;
        try {
            const sku = await Database.getNextSKU(catId);
            document.getElementById('prod-sku').value = sku;
        } catch (e) { /* ignore */ }
    }

    function calcProductPreview() {
        const peso = parseFloat(document.getElementById('prod-peso')?.value);
        const tempo = parseFloat(document.getElementById('prod-tempo')?.value);
        const previewEl = document.getElementById('calc-preview');
        if (!peso || !tempo || peso <= 0 || tempo <= 0) {
            if (previewEl) previewEl.style.display = 'none';
            return;
        }
        const calc = Calculator.calcular(peso, tempo);
        if (previewEl) previewEl.style.display = 'block';
        setText('calc-material', fmtC(calc.custoMaterial));
        setText('calc-maquina', fmtC(calc.custoMaquina));
        setText('calc-energia', fmtC(calc.custoEnergia));
        setText('calc-total', fmtC(calc.custoTotal));

        // If user gave custom price, show that instead
        const customPrice = parseFloat(document.getElementById('prod-preco')?.value);
        const price = (customPrice && customPrice > 0) ? customPrice : calc.precoVenda;
        setText('calc-preco', fmtC(price));
        const margin = price > 0 ? ((price - calc.custoTotal) / price * 100) : 0;
        const margemEl = document.getElementById('calc-margem');
        if (margemEl) {
            margemEl.textContent = margin.toFixed(1) + '%';
            margemEl.className = margin < 20 ? 'text-danger' : 'text-success';
        }
    }

    async function saveProduct() {
        const nome = document.getElementById('prod-nome')?.value.trim();
        const peso_g = parseFloat(document.getElementById('prod-peso')?.value);
        const tempo_h = parseFloat(document.getElementById('prod-tempo')?.value);
        const category_id = parseInt(document.getElementById('prod-category')?.value);
        const sku = document.getElementById('prod-sku')?.value.trim().toUpperCase();

        if (!nome) { showToast('Informe o nome do produto.', 'warning'); return; }
        if (!peso_g || peso_g <= 0) { showToast('Informe um peso válido.', 'warning'); return; }
        if (!tempo_h || tempo_h <= 0) { showToast('Informe um tempo válido.', 'warning'); return; }
        if (!sku) { showToast('Informe o código SKU.', 'warning'); return; }

        // Check SKU uniqueness
        const skuUnique = await Database.isSkuUnique(sku, editingProductId);
        if (!skuUnique) { showToast('Este SKU já está em uso.', 'danger'); return; }

        const calc = Calculator.calcular(peso_g, tempo_h);
        const customPrice = parseFloat(document.getElementById('prod-preco')?.value);
        const precoFinal = (customPrice && customPrice > 0) ? customPrice : calc.precoVenda;
        const socialGeral = document.getElementById('prod-social-geral')?.value || '';

        const data = {
            codigo_sku: sku,
            category_id: category_id || null,
            nome,
            descricao: document.getElementById('prod-descricao')?.value.trim() || '',
            peso_g,
            tempo_h,
            dimensoes: {
                largura: parseFloat(document.getElementById('prod-dim-l')?.value) || 0,
                altura: parseFloat(document.getElementById('prod-dim-a')?.value) || 0,
                profundidade: parseFloat(document.getElementById('prod-dim-p')?.value) || 0
            },
            material: document.getElementById('prod-material')?.value || 'PLA',
            cor: document.getElementById('prod-cor')?.value.trim() || '',
            resolucao_camada: parseFloat(document.getElementById('prod-resolucao')?.value) || 0.2,
            custo_total: calc.custoTotal,
            preco_venda: precoFinal,
            quantidade_estoque: parseInt(document.getElementById('prod-estoque')?.value) || 0,
            estoque_minimo: parseInt(document.getElementById('prod-estoque-min')?.value) || 0,
            tags: (document.getElementById('prod-tags')?.value || '').split(',').map(t => t.trim()).filter(Boolean),
            descricoes_social: {
                instagram: socialGeral,
                facebook: socialGeral,
                whatsapp: socialGeral,
                tiktok: socialGeral,
                geral: socialGeral
            },
            ativo: document.getElementById('prod-ativo')?.checked !== false,
            updated_at: new Date().toISOString()
        };

        try {
            if (editingProductId) {
                await Database.update(Database.STORES.PRODUCTS, editingProductId, data);
                showToast('Produto atualizado!', 'success');
            } else {
                data.created_at = new Date().toISOString();
                await Database.add(Database.STORES.PRODUCTS, data);
                showToast('Produto cadastrado!', 'success');
            }
            await Storage.refreshCache();
            closeModal();
            await renderProducts();
        } catch (err) {
            showToast('Erro ao salvar: ' + err.message, 'danger');
        }
    }

    async function deleteProduct(id) {
        const product = await Database.getById(Database.STORES.PRODUCTS, id);
        if (!product) return;
        const ok = await confirmDialog('Excluir Produto', `Excluir "${product.nome}" (${product.codigo_sku})?\nTodos os arquivos serão removidos.`);
        if (!ok) return;

        // Remove files
        const files = await Database.getProductFiles(id);
        for (const f of files) await Database.deleteById(Database.STORES.PRODUCT_FILES, f.id);
        // Remove promotions
        const promos = await Promotions.getProductPromotions(id);
        for (const p of promos) await Promotions.deletePromotion(p.id);

        await Database.deleteById(Database.STORES.PRODUCTS, id);
        await Storage.refreshCache();
        showToast('Produto excluído.', 'success');
        await renderProducts();
    }

    async function refreshProductFiles(productId) {
        const container = document.getElementById('file-gallery-container');
        if (!container) return;
        const files = await FileManager.getProductFiles(productId);
        container.innerHTML = FileManager.renderFileGallery(files, productId);
        if (typeof lucide !== 'undefined') lucide.createIcons();
        await FileManager.loadThumbnails();
    }

    async function removeProductFile(fileId, productId) {
        const ok = await confirmDialog('Excluir Arquivo', 'Tem certeza que deseja excluir este arquivo?');
        if (!ok) return;
        await FileManager.deleteFile(fileId);
        showToast('Arquivo removido.', 'success');
        await refreshProductFiles(productId);
    }

    async function downloadProductZip(id) {
        try {
            showToast('Gerando ZIP do produto...', 'info');
            await Database.exportProductZip(id);
            showToast('ZIP gerado!', 'success');
        } catch (err) {
            showToast('Erro: ' + err.message, 'danger');
        }
    }

    // ==========================================
    //  VENDAS — CRUD
    // ==========================================

    function normalizeText(value) {
        return String(value || '')
            .normalize('NFD')
            .replace(/\p{Diacritic}/gu, '')
            .trim()
            .toLowerCase();
    }

    function getKnownCities() {
        const sales = Storage.getSheet('SALES');
        const clients = Storage.getSheet('CLIENTS');
        const set = new Set();

        sales.forEach(s => {
            if (s.cidade_entrega && String(s.cidade_entrega).trim()) {
                set.add(String(s.cidade_entrega).trim());
            }
        });
        clients.forEach(c => {
            if (c.cidade && String(c.cidade).trim()) {
                set.add(String(c.cidade).trim());
            }
        });

        return Array.from(set).sort((a, b) => a.localeCompare(b, 'pt-BR'));
    }

    function onSaleClientInput() {
        const nome = document.getElementById('sale-cliente')?.value.trim();
        if (!nome) return;

        const clients = Storage.getSheet('CLIENTS');
        const existing = clients.find(c => normalizeText(c.nome) === normalizeText(nome));
        if (!existing) return;

        const ig = document.getElementById('sale-client-instagram');
        const wa = document.getElementById('sale-client-whatsapp');
        const city = document.getElementById('sale-cidade');

        if (ig && !ig.value.trim()) ig.value = existing.instagram || '';
        if (wa && !wa.value.trim()) wa.value = existing.whatsapp || '';
        if (city && !city.value.trim()) city.value = existing.cidade || '';
    }

    function upsertClientFromSale(clientData) {
        const nome = (clientData.nome || '').trim();
        if (!nome) return null;

        const clients = Storage.getSheet('CLIENTS');
        const nomeNorm = normalizeText(nome);
        const whatsappNorm = normalizeText(clientData.whatsapp || '');
        const instagramNorm = normalizeText(clientData.instagram || '');

        const existing = clients.find(c => {
            const sameName = normalizeText(c.nome) === nomeNorm;
            const sameWhats = whatsappNorm && normalizeText(c.whatsapp) === whatsappNorm;
            const sameInstagram = instagramNorm && normalizeText(c.instagram) === instagramNorm;
            return sameName || sameWhats || sameInstagram;
        });

        const payload = {
            nome,
            instagram: (clientData.instagram || '').trim(),
            whatsapp: (clientData.whatsapp || '').trim(),
            cidade: (clientData.cidade || '').trim(),
            email: (clientData.email || '').trim(),
            observacoes: (clientData.observacoes || '').trim(),
            updated_at: new Date().toISOString()
        };

        if (existing) {
            Storage.updateRow('CLIENTS', existing.id, {
                ...payload,
                instagram: payload.instagram || existing.instagram || '',
                whatsapp: payload.whatsapp || existing.whatsapp || '',
                cidade: payload.cidade || existing.cidade || '',
                email: payload.email || existing.email || '',
                observacoes: payload.observacoes || existing.observacoes || ''
            });
            return existing.id;
        }

        const created = Storage.addRow('CLIENTS', {
            ...payload,
            created_at: new Date().toISOString()
        });
        return created.id;
    }

    function renderSales() {
        const user = Auth.getCurrentUser();
        let sales = Storage.getSheet('SALES');
        const products = Storage.getSheet('PRODUCTS');
        const users = Storage.getSheet('USERS');

        if (!Auth.isAdmin()) {
            sales = sales.filter(s => s.vendedor_id === user.id);
        }

        const dateStart = document.getElementById('filter-date-start')?.value;
        const dateEnd = document.getElementById('filter-date-end')?.value;
        const vendedorFilter = document.getElementById('filter-vendedor')?.value;

        if (dateStart) sales = sales.filter(s => s.data_venda >= dateStart);
        if (dateEnd) sales = sales.filter(s => s.data_venda <= dateEnd + 'T23:59:59');
        if (vendedorFilter) sales = sales.filter(s => s.vendedor_id === parseInt(vendedorFilter));

        if (Auth.isAdmin()) {
            const filterSelect = document.getElementById('filter-vendedor');
            if (filterSelect) {
                const currentVal = filterSelect.value;
                filterSelect.innerHTML = '<option value="">Todos</option>';
                users.forEach(u => {
                    const opt = document.createElement('option');
                    opt.value = u.id;
                    opt.textContent = u.nome;
                    if (String(u.id) === currentVal) opt.selected = true;
                    filterSelect.appendChild(opt);
                });
            }
        }

        sales.sort((a, b) => new Date(b.data_venda) - new Date(a.data_venda));

        const totalVendas = sales.reduce((sum, s) => sum + (parseFloat(s.valor_venda) || 0), 0);
        const totalLucro = sales.reduce((sum, s) => sum + (parseFloat(s.lucro) || 0), 0);
        const summaryEl = document.getElementById('sales-summary');
        if (summaryEl) {
            summaryEl.innerHTML = `
                <span>Total: <strong>${fmtC(totalVendas)}</strong></span>
                <span>Lucro: <strong class="${totalLucro >= 0 ? 'text-success' : 'text-danger'}">${fmtC(totalLucro)}</strong></span>
                <span>Registros: <strong>${sales.length}</strong></span>`;
        }

        const tbody = document.getElementById('sales-body');
        if (!tbody) return;

        if (sales.length === 0) {
            tbody.innerHTML = `<tr><td colspan="12" class="text-center text-muted" style="padding:2.5rem;"><div class="empty-state"><div class="empty-icon"><i data-lucide="wallet"></i></div><p>Nenhuma venda encontrada.</p></div></td></tr>`;
            refreshLucideIcons();
            return;
        }

        tbody.innerHTML = sales.map(s => {
            const product = products.find(p => p.id === s.product_id);
            const vendedor = users.find(u => u.id === s.vendedor_id);
            const quantidade = Math.max(1, parseFloat(s.quantidade) || 1);
            const tipoItem = s.tipo_item || (s.product_id ? 'catalogo' : 'personalizado');
            const itemNome = s.item_nome || (product ? product.nome : 'Item removido');
            const valorUnitario = parseFloat(s.valor_unitario);
            const canal = s.canal_venda || 'outro';
            const cidade = s.cidade_entrega || '—';
            const tipoPagamento = s.tipo_pagamento || 'outro';
            const valorDevido = Math.max(0, parseFloat(s.valor_devido) || 0);
            const lucroClass = (parseFloat(s.lucro) || 0) >= 0 ? 'text-success' : 'text-danger';
            const desconto = s.desconto_percentual ? s.desconto_percentual + '%' : '—';
            const cupom = s.cupom_codigo || '—';

            const canalLabel = {
                tiktok: 'TikTok',
                shopee: 'Shopee',
                instagram: 'Instagram',
                whatsapp: 'WhatsApp',
                outro: 'Outro'
            }[canal] || 'Outro';

            const pagamentoLabel = {
                pix: 'PIX',
                dinheiro: 'Dinheiro',
                cartao: 'Cartão',
                boleto: 'Boleto',
                transferencia: 'Transferência',
                outro: 'Outro'
            }[tipoPagamento] || 'Outro';

            return `<tr>
                <td>${Dashboard.formatDate(s.data_venda)}</td>
                <td>
                    <strong>${escapeHtml(itemNome)}</strong>
                    <div class="sale-item-meta text-muted">
                        ${tipoItem === 'personalizado' ? 'Personalizado' : 'Catálogo'} • Qtd: ${quantidade}${Number.isFinite(valorUnitario) ? ` • Unit: ${fmtC(valorUnitario)}` : ''}
                    </div>
                </td>
                <td>${escapeHtml(s.cliente || '—')}</td>
                <td><span class="badge badge-secondary">${canalLabel}</span></td>
                <td>${escapeHtml(cidade)}</td>
                <td><span class="badge badge-info">${pagamentoLabel}</span></td>
                <td>${fmtC(s.valor_venda)}</td>
                <td class="${valorDevido > 0 ? 'text-danger' : 'text-success'}">${fmtC(valorDevido)}</td>
                <td>${desconto}</td>
                <td class="${lucroClass}">${fmtC(s.lucro)}</td>
                <td>${cupom !== '—' ? `<code>${escapeHtml(cupom)}</code>` : '—'}</td>
                <td>${escapeHtml(vendedor ? vendedor.nome : '—')}</td>
            </tr>`;
        }).join('');

        refreshLucideIcons();
    }

    async function openSaleModal(initialData = null) {
        const products = await Database.getAll(Database.STORES.PRODUCTS);
        const activeProducts = products.filter(p => p.ativo !== false);
        const clients = Storage.getSheet('CLIENTS');

        const options = activeProducts.map(p =>
            `<option value="${p.id}" data-preco="${p.preco_venda}" data-custo="${p.custo_total}">${escapeHtml(p.nome)} — ${fmtC(p.preco_venda)}</option>`
        ).join('');

        const clientOptions = clients
            .slice()
            .sort((a, b) => String(a.nome || '').localeCompare(String(b.nome || ''), 'pt-BR'))
            .map(c => `<option value="${escapeHtml(c.nome || '')}"></option>`)
            .join('');

        const cityOptions = getKnownCities()
            .map(c => `<option value="${escapeHtml(c)}"></option>`)
            .join('');

        const now = new Date();
        const defaultDate = now.toISOString().slice(0, 16);
        const mode = initialData?.mode === 'personalizado' ? 'personalizado' : 'catalogo';
        const defaultQty = Math.max(1, parseFloat(initialData?.quantidade) || 1);
        const defaultItemName = initialData?.item_nome || '';
        const defaultPrice = Number.isFinite(parseFloat(initialData?.valor_unitario)) ? parseFloat(initialData?.valor_unitario) : 0;
        const defaultCost = Number.isFinite(parseFloat(initialData?.custo_unitario)) ? parseFloat(initialData?.custo_unitario) : 0;
        const defaultClient = initialData?.cliente || '';
        const defaultInstagram = initialData?.cliente_instagram || '';
        const defaultWhatsapp = initialData?.cliente_whatsapp || '';
        const defaultCity = initialData?.cidade_entrega || '';
        const defaultPaymentType = ['pix', 'dinheiro', 'cartao', 'boleto', 'transferencia', 'outro'].includes(initialData?.tipo_pagamento)
            ? initialData.tipo_pagamento
            : 'pix';
        const defaultPaid = Number.isFinite(parseFloat(initialData?.valor_pago)) ? parseFloat(initialData.valor_pago) : '';
        const defaultChannel = ['tiktok', 'shopee', 'instagram', 'whatsapp', 'outro'].includes(initialData?.canal_venda)
            ? initialData.canal_venda
            : 'outro';
        const defaultObs = initialData?.observacoes || '';

        const html = `
        <form id="sale-form" onsubmit="event.preventDefault(); App.saveSale();">
            <div class="form-grid">
                <div class="form-group">
                    <label>Tipo de Venda</label>
                    <select id="sale-mode" onchange="App.toggleSaleMode()">
                        <option value="catalogo" ${mode === 'catalogo' ? 'selected' : ''}>Produto do catálogo</option>
                        <option value="personalizado" ${mode === 'personalizado' ? 'selected' : ''}>Produto personalizado</option>
                    </select>
                </div>
                <div class="form-group" id="sale-product-group">
                    <label>Produto do Catálogo</label>
                    <select id="sale-product" onchange="App.onSaleProductChange()">
                        <option value="">— Selecione um produto —</option>
                        ${options}
                    </select>
                    <small>Opcional para venda personalizada.</small>
                </div>
                <div class="form-group" id="sale-item-name-group">
                    <label>Nome do Item</label>
                    <input type="text" id="sale-item-name" value="${escapeHtml(defaultItemName)}" placeholder="Ex: Peça personalizada cliente XPTO" oninput="App.calcSalePreview()">
                </div>
            </div>

            <div class="form-group">
                <label>Nome do Cliente</label>
                <input type="text" id="sale-cliente" list="sale-client-list" value="${escapeHtml(defaultClient)}" placeholder="Nome do cliente (opcional)" oninput="App.onSaleClientInput()">
                <datalist id="sale-client-list">${clientOptions}</datalist>
            </div>

            <div class="form-grid">
                <div class="form-group">
                    <label>@ Instagram do Cliente</label>
                    <input type="text" id="sale-client-instagram" value="${escapeHtml(defaultInstagram)}" placeholder="@cliente">
                </div>
                <div class="form-group">
                    <label>WhatsApp do Cliente</label>
                    <input type="text" id="sale-client-whatsapp" value="${escapeHtml(defaultWhatsapp)}" placeholder="(11) 99999-9999">
                </div>
                <div class="form-group">
                    <label>Cidade</label>
                    <input type="text" id="sale-cidade" list="sale-city-list" value="${escapeHtml(defaultCity)}" placeholder="Cidade de entrega" required>
                    <datalist id="sale-city-list">${cityOptions}</datalist>
                </div>
            </div>

            <div class="form-group">
                <label>Rede Social / Canal da Venda</label>
                <select id="sale-canal" required>
                    <option value="tiktok" ${defaultChannel === 'tiktok' ? 'selected' : ''}>TikTok</option>
                    <option value="shopee" ${defaultChannel === 'shopee' ? 'selected' : ''}>Shopee</option>
                    <option value="instagram" ${defaultChannel === 'instagram' ? 'selected' : ''}>Instagram</option>
                    <option value="whatsapp" ${defaultChannel === 'whatsapp' ? 'selected' : ''}>WhatsApp</option>
                    <option value="outro" ${defaultChannel === 'outro' ? 'selected' : ''}>Outro</option>
                </select>
            </div>

            <div class="form-grid">
                <div class="form-group">
                    <label>Quantidade</label>
                    <input type="number" id="sale-qty" value="${defaultQty}" min="1" step="1" oninput="App.calcSalePreview()">
                </div>
                <div class="form-group">
                    <label>Valor Unitário (R$)</label>
                    <input type="number" id="sale-unit-price" value="${defaultPrice}" min="0" step="0.01" oninput="App.calcSalePreview()">
                </div>
                <div class="form-group">
                    <label>Custo Unitário (R$)</label>
                    <input type="number" id="sale-unit-cost" value="${defaultCost}" min="0" step="0.01" oninput="App.calcSalePreview()">
                    <small>Para cálculo real de lucro.</small>
                </div>
            </div>

            <div class="form-grid">
                <div class="form-group">
                    <label>Desconto (%)</label>
                    <input type="number" id="sale-desconto" value="0" min="0" max="100" step="0.5" oninput="App.calcSalePreview()">
                </div>
                <div class="form-group">
                    <label>Tipo de Pagamento</label>
                    <select id="sale-tipo-pagamento" oninput="App.calcSalePreview()">
                        <option value="pix" ${defaultPaymentType === 'pix' ? 'selected' : ''}>PIX</option>
                        <option value="dinheiro" ${defaultPaymentType === 'dinheiro' ? 'selected' : ''}>Dinheiro</option>
                        <option value="cartao" ${defaultPaymentType === 'cartao' ? 'selected' : ''}>Cartão</option>
                        <option value="boleto" ${defaultPaymentType === 'boleto' ? 'selected' : ''}>Boleto</option>
                        <option value="transferencia" ${defaultPaymentType === 'transferencia' ? 'selected' : ''}>Transferência</option>
                        <option value="outro" ${defaultPaymentType === 'outro' ? 'selected' : ''}>Outro</option>
                    </select>
                </div>
                <div class="form-group">
                    <label>Valor Pago (R$)</label>
                    <input type="number" id="sale-valor-pago" value="${defaultPaid}" min="0" step="0.01" oninput="App.calcSalePreview()">
                    <small>Se menor que o valor final, fica registrado como valor devido.</small>
                </div>
                <div class="form-group" id="sale-cupom-group">
                    <label>Cupom</label>
                    <div style="display:flex;gap:0.5rem;">
                        <input type="text" id="sale-cupom" placeholder="Código do cupom" style="text-transform:uppercase">
                        <button type="button" class="btn btn-secondary" onclick="App.applySaleCoupon()">Aplicar</button>
                    </div>
                    <small id="sale-cupom-msg" class="text-muted"></small>
                </div>
                <div class="form-group">
                    <label>Data da Venda</label>
                    <input type="datetime-local" id="sale-data" value="${defaultDate}">
                </div>
            </div>

            <div class="form-group">
                <label>Observações</label>
                <textarea id="sale-observacoes" rows="2" placeholder="Detalhes da venda, customizações, prazo, etc.">${escapeHtml(defaultObs)}</textarea>
            </div>

            <div class="form-group" id="sale-stock-group" style="display:flex;align-items:center;gap:0.75rem;">
                <input type="checkbox" id="sale-update-stock" checked>
                <label for="sale-update-stock" style="margin:0;cursor:pointer;">Baixar estoque automaticamente (somente catálogo)</label>
            </div>

            <div id="sale-preview" class="calc-preview" style="display:none;">
                <h4><i data-lucide="receipt"></i> Resumo</h4>
                <div class="calc-grid">
                    <div class="calc-item"><span>Valor Bruto</span><span id="sale-valor-bruto">—</span></div>
                    <div class="calc-item"><span>Custo Total</span><span id="sale-custo-total">—</span></div>
                    <div class="calc-item"><span>Desconto</span><span id="sale-desconto-valor" class="text-warning">—</span></div>
                    <div class="calc-item total"><span>Valor Final</span><span id="sale-valor-final">—</span></div>
                    <div class="calc-item"><span>Valor Pago</span><span id="sale-valor-pago-prev">—</span></div>
                    <div class="calc-item"><span>Valor Devido</span><span id="sale-valor-devido-prev">—</span></div>
                    <div class="calc-item success"><span>Lucro</span><span id="sale-lucro">—</span></div>
                </div>
            </div>
            <div class="form-actions">
                <button type="button" class="btn btn-secondary" onclick="App.closeModal()">Cancelar</button>
                <button type="submit" class="btn btn-primary"><i data-lucide="check"></i> Registrar Venda</button>
            </div>
        </form>`;

        openModal('Nova Venda', html);
        if (initialData?.product_id) {
            const sel = document.getElementById('sale-product');
            if (sel) sel.value = String(initialData.product_id);
        }
        toggleSaleMode();
        if (mode === 'catalogo') onSaleProductChange();
        calcSalePreview();
    }

    function toggleSaleMode() {
        const mode = document.getElementById('sale-mode')?.value || 'catalogo';
        const productGroup = document.getElementById('sale-product-group');
        const cupomGroup = document.getElementById('sale-cupom-group');
        const stockGroup = document.getElementById('sale-stock-group');
        const itemNameGroup = document.getElementById('sale-item-name-group');
        const productSelect = document.getElementById('sale-product');
        const itemNameInput = document.getElementById('sale-item-name');
        const cupomInput = document.getElementById('sale-cupom');
        const cupomMsg = document.getElementById('sale-cupom-msg');

        const isCatalog = mode === 'catalogo';
        if (productGroup) productGroup.classList.toggle('hidden', !isCatalog);
        if (cupomGroup) cupomGroup.classList.toggle('hidden', !isCatalog);
        if (stockGroup) stockGroup.classList.toggle('hidden', !isCatalog);
        if (itemNameGroup) itemNameGroup.classList.toggle('hidden', isCatalog);

        if (productSelect) productSelect.required = isCatalog;
        if (itemNameInput) itemNameInput.required = !isCatalog;

        if (!isCatalog) {
            if (cupomInput) cupomInput.value = '';
            if (cupomMsg) { cupomMsg.textContent = ''; cupomMsg.className = 'text-muted'; }
        }

        calcSalePreview();
    }

    function onSaleProductChange() {
        const mode = document.getElementById('sale-mode')?.value || 'catalogo';
        if (mode !== 'catalogo') return;

        const select = document.getElementById('sale-product');
        const option = select?.options[select.selectedIndex];
        if (!option || !option.value) {
            calcSalePreview();
            return;
        }

        const unitPrice = parseFloat(option.dataset.preco) || 0;
        const unitCost = parseFloat(option.dataset.custo) || 0;
        const priceInput = document.getElementById('sale-unit-price');
        const costInput = document.getElementById('sale-unit-cost');
        const itemNameInput = document.getElementById('sale-item-name');

        if (priceInput && (!priceInput.value || parseFloat(priceInput.value) <= 0)) priceInput.value = String(unitPrice);
        if (costInput && (!costInput.value || parseFloat(costInput.value) <= 0)) costInput.value = String(unitCost);
        if (itemNameInput && !itemNameInput.value.trim()) itemNameInput.value = option.textContent.split(' — ')[0] || '';

        calcSalePreview();
    }

    function calcSalePreview() {
        const mode = document.getElementById('sale-mode')?.value || 'catalogo';
        const select = document.getElementById('sale-product');
        const option = select?.options[select.selectedIndex];
        const itemName = document.getElementById('sale-item-name')?.value.trim() || '';
        const qty = Math.max(1, parseFloat(document.getElementById('sale-qty')?.value) || 1);
        const precoUnit = Math.max(0, parseFloat(document.getElementById('sale-unit-price')?.value) || 0);
        const custoUnit = Math.max(0, parseFloat(document.getElementById('sale-unit-cost')?.value) || 0);
        const desconto = parseFloat(document.getElementById('sale-desconto')?.value) || 0;
        const valorPagoField = document.getElementById('sale-valor-pago');

        const isCatalog = mode === 'catalogo';
        const hasCatalogSelection = option && option.value;
        const hasCustomName = !!itemName;
        if ((isCatalog && !hasCatalogSelection) || (!isCatalog && !hasCustomName)) {
            const p = document.getElementById('sale-preview');
            if (p) p.style.display = 'none';
            return;
        }

        const valorBruto = qty * precoUnit;
        const descontoValor = valorBruto * (desconto / 100);
        const valorFinal = Math.max(0, valorBruto - descontoValor);
        const custoTotal = qty * custoUnit;
        const lucro = valorFinal - custoTotal;
        const valorPagoInput = valorPagoField && String(valorPagoField.value).trim() === ''
            ? valorFinal
            : Math.max(0, parseFloat(valorPagoField?.value) || 0);
        const valorPago = Math.min(valorFinal, valorPagoInput);
        const valorDevido = Math.max(0, valorFinal - valorPago);

        document.getElementById('sale-preview').style.display = 'block';
        setText('sale-valor-bruto', fmtC(valorBruto));
        setText('sale-custo-total', fmtC(custoTotal));
        setText('sale-desconto-valor', `- ${fmtC(descontoValor)}`);
        setText('sale-valor-final', fmtC(valorFinal));
        setText('sale-valor-pago-prev', fmtC(valorPago));
        setText('sale-valor-devido-prev', fmtC(valorDevido));
        const dueEl = document.getElementById('sale-valor-devido-prev');
        if (dueEl) dueEl.className = valorDevido > 0 ? 'text-danger' : 'text-success';
        const lucroEl = document.getElementById('sale-lucro');
        if (lucroEl) {
            lucroEl.textContent = fmtC(lucro);
            lucroEl.className = lucro >= 0 ? 'text-success' : 'text-danger';
        }
    }

    async function applySaleCoupon() {
        const code = document.getElementById('sale-cupom')?.value.trim();
        const msgEl = document.getElementById('sale-cupom-msg');
        if (!code) { if (msgEl) msgEl.textContent = ''; return; }

        const mode = document.getElementById('sale-mode')?.value || 'catalogo';
        if (mode !== 'catalogo') {
            if (msgEl) { msgEl.textContent = 'Cupom disponível apenas para produtos do catálogo.'; msgEl.className = 'text-warning'; }
            return;
        }

        const productId = parseInt(document.getElementById('sale-product')?.value);
        const result = await Promotions.validateCoupon(code, productId || null);

        if (!result.valid) {
            if (msgEl) { msgEl.textContent = result.message; msgEl.className = 'text-danger'; }
            return;
        }

        if (msgEl) { msgEl.textContent = `✓ Cupom válido! ${result.coupon.tipo_desconto === 'percentual' ? result.coupon.valor_desconto + '% off' : 'R$' + result.coupon.valor_desconto + ' off'}`; msgEl.className = 'text-success'; }

        // Apply discount to form
        const preco = Math.max(0, parseFloat(document.getElementById('sale-unit-price')?.value) || 0);
        if (preco > 0) {
            const newPrice = await Promotions.applyCoupon(result.coupon, preco);
            const pct = preco > 0 ? ((preco - newPrice) / preco * 100) : 0;
            document.getElementById('sale-desconto').value = pct.toFixed(1);
            calcSalePreview();
        }
    }

    async function saveSale() {
        const mode = document.getElementById('sale-mode')?.value || 'catalogo';
        const select = document.getElementById('sale-product');
        const option = select?.options[select.selectedIndex];
        const isCatalog = mode === 'catalogo';
        if (isCatalog && (!option || !option.value)) { showToast('Selecione um produto do catálogo.', 'warning'); return; }

        const productId = isCatalog ? parseInt(option.value) : null;
        const itemNome = (document.getElementById('sale-item-name')?.value.trim() || (isCatalog ? option.textContent.split(' — ')[0] : '')).trim();
        if (!itemNome) { showToast('Informe o nome do item da venda.', 'warning'); return; }

        const qty = Math.max(1, parseFloat(document.getElementById('sale-qty')?.value) || 1);
        const precoUnit = Math.max(0, parseFloat(document.getElementById('sale-unit-price')?.value) || 0);
        const custoUnit = Math.max(0, parseFloat(document.getElementById('sale-unit-cost')?.value) || 0);
        const desconto = parseFloat(document.getElementById('sale-desconto')?.value) || 0;
        const cliente = document.getElementById('sale-cliente')?.value.trim() || '';
        const clienteInstagram = document.getElementById('sale-client-instagram')?.value.trim() || '';
        const clienteWhatsapp = document.getElementById('sale-client-whatsapp')?.value.trim() || '';
        const cidadeEntrega = document.getElementById('sale-cidade')?.value.trim() || '';
        const canalVenda = document.getElementById('sale-canal')?.value || 'outro';
        const tipoPagamento = document.getElementById('sale-tipo-pagamento')?.value || 'pix';
        const observacoes = document.getElementById('sale-observacoes')?.value.trim() || '';
        const dataVenda = document.getElementById('sale-data')?.value;
        const cupomCode = document.getElementById('sale-cupom')?.value.trim().toUpperCase() || '';
        const valorPagoField = document.getElementById('sale-valor-pago');

        if (precoUnit <= 0) { showToast('Informe um valor unitário maior que zero.', 'warning'); return; }
        if (!cidadeEntrega) { showToast('Informe a cidade da venda.', 'warning'); return; }

        const valorBruto = Calculator.round2(qty * precoUnit);
        const descontoValor = Calculator.round2(valorBruto * (desconto / 100));
        const valorVenda = Calculator.round2(Math.max(0, valorBruto - descontoValor));
        const custoTotal = Calculator.round2(qty * custoUnit);
        const lucro = Calculator.round2(valorVenda - custoTotal);
        const valorPagoInput = valorPagoField && String(valorPagoField.value).trim() === ''
            ? valorVenda
            : Math.max(0, parseFloat(valorPagoField?.value) || 0);
        const valorPago = Calculator.round2(Math.min(valorVenda, valorPagoInput));
        const valorDevido = Calculator.round2(Math.max(0, valorVenda - valorPago));
        const statusPagamento = valorDevido <= 0 ? 'pago' : (valorPago > 0 ? 'parcial' : 'pendente');

        const user = Auth.getCurrentUser();

        // If coupon was used, increment usage
        if (isCatalog && cupomCode) {
            const coupon = await Promotions.getCouponByCode(cupomCode);
            if (coupon) await Promotions.useCoupon(coupon.id);
        }

        // Decrement stock
        const shouldUpdateStock = document.getElementById('sale-update-stock')?.checked !== false;
        if (isCatalog && shouldUpdateStock) {
            const product = await Database.getById(Database.STORES.PRODUCTS, productId);
            if (product) {
                await Database.update(Database.STORES.PRODUCTS, productId, {
                    quantidade_estoque: Math.max(0, (product.quantidade_estoque || 0) - qty)
                });
            }
        }

        const clientId = upsertClientFromSale({
            nome: cliente,
            instagram: clienteInstagram,
            whatsapp: clienteWhatsapp,
            cidade: cidadeEntrega
        });

        Storage.addRow('SALES', {
            product_id: productId,
            client_id: clientId,
            item_nome: itemNome,
            tipo_item: isCatalog ? 'catalogo' : 'personalizado',
            quantidade: qty,
            valor_unitario: precoUnit,
            custo_unitario: custoUnit,
            valor_bruto: valorBruto,
            vendedor_id: user.id,
            cliente,
            cliente_instagram: clienteInstagram,
            cliente_whatsapp: clienteWhatsapp,
            cidade_entrega: cidadeEntrega,
            canal_venda: canalVenda,
            tipo_pagamento: tipoPagamento,
            status_pagamento: statusPagamento,
            valor_pago: valorPago,
            valor_devido: valorDevido,
            valor_venda: valorVenda,
            lucro,
            desconto_percentual: desconto,
            desconto_valor: descontoValor,
            cupom_codigo: isCatalog ? (cupomCode || null) : null,
            observacoes,
            data_venda: dataVenda || new Date().toISOString()
        });

        showToast('Venda registrada!', 'success');
        closeModal();
        renderSales();
    }

    function calcRegisterSaleFromCalculator() {
        const result = calcAdvanced._lastResult;
        if (!result || result.custoTotal <= 0 || result.precoVenda <= 0) {
            showToast('Faça um cálculo válido antes de registrar a venda.', 'warning');
            return;
        }

        const nome = document.getElementById('adv-nome-produto')?.value.trim() || 'Produto Personalizado';
        openSaleModal({
            mode: 'personalizado',
            item_nome: nome,
            quantidade: 1,
            valor_unitario: result.precoVenda,
            custo_unitario: result.custoTotal,
            canal_venda: 'outro',
            observacoes: 'Venda criada pela calculadora avançada.'
        });
    }

    function filterSales() {
        renderSales();
    }

    // ==========================================
    //  GASTOS — CRUD
    // ==========================================

    function renderExpenses() {
        const tbody = document.getElementById('expenses-body');
        if (!tbody) return;

        const start = document.getElementById('expense-filter-start')?.value;
        const end = document.getElementById('expense-filter-end')?.value;
        const category = document.getElementById('expense-filter-category')?.value || '';
        const payment = document.getElementById('expense-filter-payment')?.value || '';

        let expenses = Storage.getSheet('EXPENSES').slice();

        if (start) expenses = expenses.filter(e => String(e.data_gasto || '').slice(0, 10) >= start);
        if (end) expenses = expenses.filter(e => String(e.data_gasto || '').slice(0, 10) <= end);
        if (category) expenses = expenses.filter(e => e.categoria === category);
        if (payment) expenses = expenses.filter(e => e.tipo_pagamento === payment);

        expenses.sort((a, b) => new Date(b.data_gasto) - new Date(a.data_gasto));

        const allCategories = Array.from(new Set(Storage.getSheet('EXPENSES').map(e => e.categoria).filter(Boolean))).sort((a, b) => a.localeCompare(b, 'pt-BR'));
        const catSel = document.getElementById('expense-filter-category');
        if (catSel) {
            const cur = catSel.value;
            catSel.innerHTML = '<option value="">Todas</option>' + allCategories.map(c => `<option value="${escapeHtml(c)}">${escapeHtml(c)}</option>`).join('');
            if (allCategories.includes(cur)) catSel.value = cur;
        }

        const total = expenses.reduce((sum, e) => sum + (parseFloat(e.valor_total) || 0), 0);
        const summary = document.getElementById('expenses-summary');
        if (summary) {
            summary.innerHTML = `<span>Total de Gastos: <strong>${fmtC(total)}</strong></span><span>Registros: <strong>${expenses.length}</strong></span>`;
        }

        if (expenses.length === 0) {
            tbody.innerHTML = `<tr><td colspan="9" class="text-center text-muted" style="padding:2rem;">Nenhum gasto encontrado.</td></tr>`;
            refreshLucideIcons();
            return;
        }

        const paymentLabel = {
            pix: 'PIX', dinheiro: 'Dinheiro', cartao: 'Cartão', boleto: 'Boleto', transferencia: 'Transferência', outro: 'Outro'
        };

        tbody.innerHTML = expenses.map(e => `
            <tr>
                <td>${Dashboard.formatDate(e.data_gasto)}</td>
                <td>
                    <strong>${escapeHtml(e.descricao || '—')}</strong>
                    ${e.observacoes ? `<div class="text-muted" style="font-size:0.76rem;">${escapeHtml(e.observacoes)}</div>` : ''}
                </td>
                <td><span class="badge badge-secondary">${escapeHtml(e.categoria || 'Geral')}</span></td>
                <td>${escapeHtml(e.fornecedor || '—')}</td>
                <td><span class="badge badge-info">${paymentLabel[e.tipo_pagamento] || 'Outro'}</span></td>
                <td>${parseFloat(e.quantidade) || 1}</td>
                <td>${fmtC(e.valor_unitario || 0)}</td>
                <td><strong>${fmtC(e.valor_total || 0)}</strong></td>
                <td class="actions">
                    <button class="btn btn-sm btn-icon" onclick="App.openExpenseModal(${e.id})" title="Editar"><i data-lucide="pencil"></i></button>
                    <button class="btn btn-sm btn-icon btn-danger-ghost" onclick="App.deleteExpense(${e.id})" title="Excluir"><i data-lucide="trash-2"></i></button>
                </td>
            </tr>
        `).join('');

        refreshLucideIcons();
    }

    function calcExpenseTotal() {
        const qty = Math.max(0, parseFloat(document.getElementById('expense-qty')?.value) || 0);
        const unit = Math.max(0, parseFloat(document.getElementById('expense-unit')?.value) || 0);
        const total = Calculator.round2(qty * unit);
        const totalInput = document.getElementById('expense-total');
        if (totalInput) totalInput.value = String(total);
    }

    function openExpenseModal(id) {
        const expense = id ? Storage.getRowById('EXPENSES', id) : null;
        const title = expense ? 'Editar Gasto' : 'Novo Gasto';

        const categories = ['Filamento', 'Argolas', 'Tintas', 'Peças', 'Transporte', 'Embalagens', 'Ferramentas', 'Manutenção', 'Energia', 'Marketing', 'Outros'];
        const catOptions = categories.map(c => `<option value="${c}" ${(expense?.categoria || '') === c ? 'selected' : ''}>${c}</option>`).join('');

        const now = new Date();
        const defaultDate = now.toISOString().slice(0, 16);

        const html = `
        <form id="expense-form" onsubmit="event.preventDefault(); App.saveExpense(${id || ''});">
            <div class="form-grid">
                <div class="form-group">
                    <label>Descrição</label>
                    <input type="text" id="expense-desc" value="${escapeHtml(expense?.descricao || '')}" required placeholder="Ex: Compra de 3kg PLA azul">
                </div>
                <div class="form-group">
                    <label>Categoria</label>
                    <select id="expense-category" required>
                        <option value="">Selecione...</option>
                        ${catOptions}
                    </select>
                </div>
                <div class="form-group">
                    <label>Fornecedor / Origem</label>
                    <input type="text" id="expense-supplier" value="${escapeHtml(expense?.fornecedor || '')}" placeholder="Loja, marketplace, transportadora...">
                </div>
            </div>

            <div class="form-grid">
                <div class="form-group">
                    <label>Quantidade</label>
                    <input type="number" id="expense-qty" value="${expense?.quantidade ?? 1}" min="0" step="0.01" oninput="App.calcExpenseTotal()">
                </div>
                <div class="form-group">
                    <label>Valor Unitário (R$)</label>
                    <input type="number" id="expense-unit" value="${expense?.valor_unitario ?? 0}" min="0" step="0.01" oninput="App.calcExpenseTotal()">
                </div>
                <div class="form-group">
                    <label>Total (R$)</label>
                    <input type="number" id="expense-total" value="${expense?.valor_total ?? 0}" min="0" step="0.01" readonly>
                </div>
            </div>

            <div class="form-grid">
                <div class="form-group">
                    <label>Tipo de Pagamento</label>
                    <select id="expense-payment" required>
                        <option value="pix" ${expense?.tipo_pagamento === 'pix' ? 'selected' : ''}>PIX</option>
                        <option value="dinheiro" ${expense?.tipo_pagamento === 'dinheiro' ? 'selected' : ''}>Dinheiro</option>
                        <option value="cartao" ${expense?.tipo_pagamento === 'cartao' ? 'selected' : ''}>Cartão</option>
                        <option value="boleto" ${expense?.tipo_pagamento === 'boleto' ? 'selected' : ''}>Boleto</option>
                        <option value="transferencia" ${expense?.tipo_pagamento === 'transferencia' ? 'selected' : ''}>Transferência</option>
                        <option value="outro" ${!expense || expense?.tipo_pagamento === 'outro' ? 'selected' : ''}>Outro</option>
                    </select>
                </div>
                <div class="form-group">
                    <label>Data do Gasto</label>
                    <input type="datetime-local" id="expense-date" value="${expense?.data_gasto ? String(expense.data_gasto).slice(0, 16) : defaultDate}" required>
                </div>
            </div>

            <div class="form-group">
                <label>Observações</label>
                <textarea id="expense-notes" rows="3" placeholder="Detalhes do gasto (marca, lote, frete, etc.)">${escapeHtml(expense?.observacoes || '')}</textarea>
            </div>

            <div class="form-actions">
                <button type="button" class="btn btn-secondary" onclick="App.closeModal()">Cancelar</button>
                <button type="submit" class="btn btn-primary"><i data-lucide="save"></i> ${expense ? 'Atualizar' : 'Salvar Gasto'}</button>
            </div>
        </form>`;

        openModal(title, html);
        calcExpenseTotal();
    }

    function saveExpense(id) {
        const descricao = document.getElementById('expense-desc')?.value.trim();
        const categoria = document.getElementById('expense-category')?.value;
        const fornecedor = document.getElementById('expense-supplier')?.value.trim() || '';
        const quantidade = Math.max(0, parseFloat(document.getElementById('expense-qty')?.value) || 0);
        const valorUnitario = Math.max(0, parseFloat(document.getElementById('expense-unit')?.value) || 0);
        const valorTotal = Calculator.round2(Math.max(0, parseFloat(document.getElementById('expense-total')?.value) || 0));
        const tipoPagamento = document.getElementById('expense-payment')?.value || 'outro';
        const dataGasto = document.getElementById('expense-date')?.value;
        const observacoes = document.getElementById('expense-notes')?.value.trim() || '';

        if (!descricao || !categoria) {
            showToast('Preencha descrição e categoria.', 'warning');
            return;
        }

        const data = {
            descricao,
            categoria,
            fornecedor,
            quantidade,
            valor_unitario: valorUnitario,
            valor_total: valorTotal,
            tipo_pagamento: tipoPagamento,
            data_gasto: dataGasto || new Date().toISOString(),
            observacoes,
            updated_at: new Date().toISOString()
        };

        if (id) {
            Storage.updateRow('EXPENSES', parseInt(id), data);
            showToast('Gasto atualizado!', 'success');
        } else {
            Storage.addRow('EXPENSES', {
                ...data,
                created_at: new Date().toISOString()
            });
            showToast('Gasto registrado!', 'success');
        }

        closeModal();
        renderExpenses();
        if (currentSection === 'dashboard') Dashboard.render();
    }

    async function deleteExpense(id) {
        const expense = Storage.getRowById('EXPENSES', id);
        if (!expense) return;
        const ok = await confirmDialog('Excluir Gasto', `Excluir gasto "${expense.descricao}"?`);
        if (!ok) return;
        Storage.deleteRow('EXPENSES', id);
        showToast('Gasto enviado para a lixeira.', 'success');
        renderExpenses();
    }

    // ==========================================
    //  CLIENTES — CRUD
    // ==========================================

    function getClientSalesStats(client) {
        const sales = Storage.getSheet('SALES');
        const normName = normalizeText(client.nome);
        const rows = sales.filter(s =>
            (client.id && s.client_id === client.id) ||
            (!s.client_id && normalizeText(s.cliente) === normName)
        );

        const totalCompras = rows.length;
        const totalGasto = rows.reduce((sum, s) => sum + (parseFloat(s.valor_venda) || 0), 0);
        const totalDevido = rows.reduce((sum, s) => sum + (Math.max(0, parseFloat(s.valor_devido) || 0)), 0);
        const ultimaData = rows.length > 0
            ? rows.map(s => new Date(s.data_venda).getTime()).filter(Boolean).sort((a, b) => b - a)[0]
            : null;
        const paymentTypes = Array.from(new Set(rows.map(s => s.tipo_pagamento).filter(Boolean)));

        return {
            totalCompras,
            totalGasto,
            totalDevido,
            paymentTypes,
            ultimaCompra: ultimaData ? new Date(ultimaData).toISOString() : null
        };
    }

    function renderClients() {
        const tbody = document.getElementById('clients-body');
        if (!tbody) return;

        const search = normalizeText(document.getElementById('client-search')?.value || '');
        const rankFilter = String(document.getElementById('client-filter-ranking')?.value || '').trim();
        const debtFilter = String(document.getElementById('client-filter-debt')?.value || '').trim();
        const paymentFilter = String(document.getElementById('client-filter-payment')?.value || '').trim();
        let clients = Storage.getSheet('CLIENTS').slice();

        const clientsWithStats = clients.map(c => ({
            ...c,
            _stats: getClientSalesStats(c)
        }));

        if (search) {
            clients = clientsWithStats.filter(c => {
                return normalizeText(c.nome).includes(search) ||
                    normalizeText(c.instagram).includes(search) ||
                    normalizeText(c.whatsapp).includes(search) ||
                    normalizeText(c.cidade).includes(search) ||
                    normalizeText(c.email).includes(search);
            });
        } else {
            clients = clientsWithStats;
        }

        if (debtFilter === 'devem') {
            clients = clients.filter(c => (c._stats?.totalDevido || 0) > 0);
        } else if (debtFilter === 'em-dia') {
            clients = clients.filter(c => (c._stats?.totalDevido || 0) <= 0);
        }

        if (paymentFilter) {
            clients = clients.filter(c => (c._stats?.paymentTypes || []).includes(paymentFilter));
        }

        if (rankFilter === 'mais-compram') {
            clients.sort((a, b) => (b._stats?.totalCompras || 0) - (a._stats?.totalCompras || 0));
        } else if (rankFilter === 'menos-compram') {
            clients.sort((a, b) => (a._stats?.totalCompras || 0) - (b._stats?.totalCompras || 0));
        } else {
            clients.sort((a, b) => String(a.nome || '').localeCompare(String(b.nome || ''), 'pt-BR'));
        }

        const summary = document.getElementById('clients-summary');
        if (summary) {
            summary.innerHTML = `
                <span>Total de Clientes: <strong>${clients.length}</strong></span>`;
        }

        if (clients.length === 0) {
            tbody.innerHTML = `<tr><td colspan="11" class="text-center text-muted" style="padding:2rem;">Nenhum cliente encontrado.</td></tr>`;
            refreshLucideIcons();
            return;
        }

        tbody.innerHTML = clients.map(c => {
            const stats = c._stats || getClientSalesStats(c);
            const paymentLabel = (stats.paymentTypes || []).length > 0
                ? stats.paymentTypes.map(t => ({
                    pix: 'PIX', dinheiro: 'Dinheiro', cartao: 'Cartão', boleto: 'Boleto', transferencia: 'Transferência', outro: 'Outro'
                }[t] || t)).join(', ')
                : '—';
            return `<tr>
                <td><strong>${escapeHtml(c.nome || '—')}</strong></td>
                <td>${c.instagram ? `<code>${escapeHtml(c.instagram)}</code>` : '—'}</td>
                <td>${escapeHtml(c.whatsapp || '—')}</td>
                <td>${escapeHtml(c.cidade || '—')}</td>
                <td>${escapeHtml(c.email || '—')}</td>
                <td>${stats.ultimaCompra ? Dashboard.formatDate(stats.ultimaCompra) : '—'}</td>
                <td>${stats.totalCompras}</td>
                <td>${fmtC(stats.totalGasto)}</td>
                <td class="${stats.totalDevido > 0 ? 'text-danger' : 'text-success'}">${fmtC(stats.totalDevido)}</td>
                <td>${escapeHtml(paymentLabel)}</td>
                <td class="actions">
                    <button class="btn btn-sm btn-icon" onclick="App.openClientModal(${c.id})" title="Editar"><i data-lucide="pencil"></i></button>
                    <button class="btn btn-sm btn-icon btn-danger-ghost" onclick="App.deleteClient(${c.id})" title="Excluir"><i data-lucide="trash-2"></i></button>
                </td>
            </tr>`;
        }).join('');

        refreshLucideIcons();
    }

    function openClientModal(id) {
        editingClientId = id || null;
        const client = id ? Storage.getRowById('CLIENTS', id) : null;
        const title = client ? 'Editar Cliente' : 'Novo Cliente';

        const cityOptions = getKnownCities()
            .map(c => `<option value="${escapeHtml(c)}"></option>`)
            .join('');

        const html = `
        <form id="client-form" onsubmit="event.preventDefault(); App.saveClient();">
            <div class="form-grid">
                <div class="form-group">
                    <label>Nome</label>
                    <input type="text" id="client-nome" value="${escapeHtml(client?.nome || '')}" required placeholder="Nome do cliente">
                </div>
                <div class="form-group">
                    <label>@ Instagram</label>
                    <input type="text" id="client-instagram" value="${escapeHtml(client?.instagram || '')}" placeholder="@cliente">
                </div>
                <div class="form-group">
                    <label>WhatsApp</label>
                    <input type="text" id="client-whatsapp" value="${escapeHtml(client?.whatsapp || '')}" placeholder="(11) 99999-9999">
                </div>
            </div>
            <div class="form-grid">
                <div class="form-group">
                    <label>Cidade</label>
                    <input type="text" id="client-cidade" list="client-city-list-modal" value="${escapeHtml(client?.cidade || '')}" placeholder="Cidade">
                    <datalist id="client-city-list-modal">${cityOptions}</datalist>
                </div>
                <div class="form-group">
                    <label>Email</label>
                    <input type="email" id="client-email" value="${escapeHtml(client?.email || '')}" placeholder="email@exemplo.com">
                </div>
            </div>
            <div class="form-group">
                <label>Observações</label>
                <textarea id="client-observacoes" rows="3" placeholder="Anotações sobre o cliente...">${escapeHtml(client?.observacoes || '')}</textarea>
            </div>
            <div class="form-actions">
                <button type="button" class="btn btn-secondary" onclick="App.closeModal()">Cancelar</button>
                <button type="submit" class="btn btn-primary"><i data-lucide="save"></i> ${client ? 'Atualizar' : 'Salvar Cliente'}</button>
            </div>
        </form>`;

        openModal(title, html);
    }

    function saveClient() {
        const nome = document.getElementById('client-nome')?.value.trim();
        if (!nome) {
            showToast('Nome do cliente é obrigatório.', 'warning');
            return;
        }

        const data = {
            nome,
            instagram: document.getElementById('client-instagram')?.value.trim() || '',
            whatsapp: document.getElementById('client-whatsapp')?.value.trim() || '',
            cidade: document.getElementById('client-cidade')?.value.trim() || '',
            email: document.getElementById('client-email')?.value.trim() || '',
            observacoes: document.getElementById('client-observacoes')?.value.trim() || '',
            updated_at: new Date().toISOString()
        };

        const all = Storage.getSheet('CLIENTS');
        const duplicate = all.find(c => normalizeText(c.nome) === normalizeText(nome) && c.id !== editingClientId);
        if (duplicate) {
            showToast('Já existe cliente com este nome.', 'danger');
            return;
        }

        if (editingClientId) {
            Storage.updateRow('CLIENTS', editingClientId, data);
            showToast('Cliente atualizado!', 'success');
        } else {
            Storage.addRow('CLIENTS', {
                ...data,
                created_at: new Date().toISOString()
            });
            showToast('Cliente cadastrado!', 'success');
        }

        closeModal();
        renderClients();
    }

    async function deleteClient(id) {
        const client = Storage.getRowById('CLIENTS', id);
        if (!client) return;

        const ok = await confirmDialog('Excluir Cliente', `Excluir "${client.nome}"?`);
        if (!ok) return;

        Storage.deleteRow('CLIENTS', id);
        showToast('Cliente excluído.', 'success');
        renderClients();
    }

    // ==========================================
    //  LIXEIRA (30 DIAS)
    // ==========================================

    function formatTrashStoreName(store) {
        const map = {
            users: 'Usuários',
            settings: 'Configurações',
            categories: 'Categorias',
            products: 'Produtos',
            product_files: 'Arquivos de Produto',
            promotions: 'Promoções',
            coupons: 'Cupons',
            sales: 'Vendas',
            clients: 'Clientes',
            expenses: 'Gastos'
        };
        return map[store] || store;
    }

    async function renderTrash() {
        const tbody = document.getElementById('trash-body');
        if (!tbody) return;

        await Database.purgeExpiredTrash();
        const items = await Database.getAll(Database.STORES.TRASH);
        items.sort((a, b) => new Date(b.deleted_at) - new Date(a.deleted_at));

        const summary = document.getElementById('trash-summary');
        if (summary) {
            summary.innerHTML = `<span>Itens na lixeira: <strong>${items.length}</strong></span>`;
        }

        if (items.length === 0) {
            tbody.innerHTML = `<tr><td colspan="5" class="text-center text-muted" style="padding:2rem;">Lixeira vazia.</td></tr>`;
            refreshLucideIcons();
            return;
        }

        tbody.innerHTML = items.map(item => {
            return `<tr>
                <td>${escapeHtml(formatTrashStoreName(item.source_store || '—'))}</td>
                <td><strong>${escapeHtml(item.item_name || 'Item sem nome')}</strong></td>
                <td>${Dashboard.formatDate(item.deleted_at)}</td>
                <td>${Dashboard.formatDate(item.expires_at)}</td>
                <td class="actions">
                    <button class="btn btn-sm btn-icon" onclick="App.restoreTrashItem(${item.id})" title="Restaurar"><i data-lucide="undo-2"></i></button>
                    <button class="btn btn-sm btn-icon btn-danger-ghost" onclick="App.permanentDeleteTrashItem(${item.id})" title="Excluir definitivamente"><i data-lucide="trash-2"></i></button>
                </td>
            </tr>`;
        }).join('');

        refreshLucideIcons();
    }

    async function restoreTrashItem(id) {
        try {
            await Database.restoreTrashItem(id);
            await Storage.refreshCache();
            showToast('Item restaurado com sucesso.', 'success');
            await renderTrash();
        } catch (err) {
            showToast('Não foi possível restaurar: ' + err.message, 'danger');
        }
    }

    async function permanentDeleteTrashItem(id) {
        const ok = await confirmDialog('Excluir Definitivamente', 'Este item será removido da lixeira permanentemente. Continuar?');
        if (!ok) return;
        await Database.deleteById(Database.STORES.TRASH, id);
        showToast('Item removido da lixeira.', 'success');
        await renderTrash();
    }

    async function purgeExpiredTrashNow() {
        await Database.purgeExpiredTrash();
        showToast('Itens expirados removidos da lixeira.', 'success');
        await renderTrash();
    }

    // ==========================================
    //  PROMOÇÕES E CUPONS
    // ==========================================

    function switchPromoTab(tab) {
        document.querySelectorAll('.sub-tab').forEach(btn => {
            btn.classList.toggle('active', btn.dataset.subtab === tab);
        });
        document.querySelectorAll('.subtab-content').forEach(el => {
            el.classList.toggle('active', el.id === 'subtab-' + tab);
        });
    }

    async function renderPromotions() {
        await renderPromotionsList();
        await renderCouponsList();
    }

    async function renderPromotionsList() {
        const promos = await Promotions.getPromotionsWithProducts();
        const tbody = document.getElementById('promotions-body');
        if (!tbody) return;

        if (promos.length === 0) {
            tbody.innerHTML = `<tr><td colspan="7" class="text-center text-muted" style="padding:2rem;">Nenhuma promoção criada.</td></tr>`;
            refreshLucideIcons();
            return;
        }

        const now = new Date().toISOString();
        tbody.innerHTML = promos.map(p => {
            const isActive = p.ativo && (!p.data_fim || p.data_fim >= now);
            const statusBadge = isActive ? '<span class="badge badge-success">Ativa</span>' : '<span class="badge badge-secondary">Inativa</span>';
            const desc = p.tipo_desconto === 'percentual' ? p.valor_desconto + '%' : fmtC(p.valor_desconto);
            const periodo = `${p.data_inicio ? new Date(p.data_inicio).toLocaleDateString('pt-BR') : '—'} a ${p.data_fim ? new Date(p.data_fim).toLocaleDateString('pt-BR') : 'Indefinido'}`;

            return `<tr>
                <td><strong>${escapeHtml(p._product_nome)}</strong></td>
                <td>${fmtC(p._product_preco)}</td>
                <td>${desc}</td>
                <td>${fmtC(p.preco_promocional)}</td>
                <td>${periodo}</td>
                <td>${statusBadge}</td>
                <td class="actions">
                    <button class="btn btn-sm btn-icon" onclick="App.togglePromotion(${p.id})" title="${p.ativo ? 'Desativar' : 'Ativar'}"><i data-lucide="${p.ativo ? 'pause' : 'play'}"></i></button>
                    <button class="btn btn-sm btn-icon btn-danger-ghost" onclick="App.deletePromotion(${p.id})" title="Excluir"><i data-lucide="trash-2"></i></button>
                </td>
            </tr>`;
        }).join('');

        refreshLucideIcons();
    }

    async function openPromotionModal() {
        const products = await Database.getAll(Database.STORES.PRODUCTS);
        const activeProducts = products.filter(p => p.ativo !== false);

        if (activeProducts.length === 0) {
            showToast('Cadastre um produto primeiro.', 'warning');
            return;
        }

        const options = activeProducts.map(p =>
            `<option value="${p.id}" data-preco="${p.preco_venda}">${escapeHtml(p.nome)} — ${fmtC(p.preco_venda)}</option>`
        ).join('');

        const html = `
        <form onsubmit="event.preventDefault(); App.savePromotion();">
            <div class="form-group">
                <label>Produto</label>
                <select id="promo-product" required><option value="">— Selecione —</option>${options}</select>
            </div>
            <div class="form-grid">
                <div class="form-group">
                    <label>Tipo de Desconto</label>
                    <select id="promo-tipo"><option value="percentual">Percentual (%)</option><option value="fixo">Valor Fixo (R$)</option></select>
                </div>
                <div class="form-group">
                    <label>Valor do Desconto</label>
                    <input type="number" id="promo-valor" required step="0.01" min="0.01" placeholder="Ex: 15">
                </div>
            </div>
            <div class="form-grid">
                <div class="form-group">
                    <label>Data Início</label>
                    <input type="date" id="promo-inicio" value="${new Date().toISOString().slice(0, 10)}">
                </div>
                <div class="form-group">
                    <label>Data Fim (opcional)</label>
                    <input type="date" id="promo-fim">
                </div>
            </div>
            <div class="form-actions">
                <button type="button" class="btn btn-secondary" onclick="App.closeModal()">Cancelar</button>
                <button type="submit" class="btn btn-primary"><i data-lucide="save"></i> Criar Promoção</button>
            </div>
        </form>`;

        openModal('Nova Promoção', html);
    }

    async function savePromotion() {
        const data = {
            product_id: parseInt(document.getElementById('promo-product')?.value),
            tipo_desconto: document.getElementById('promo-tipo')?.value,
            valor_desconto: parseFloat(document.getElementById('promo-valor')?.value),
            data_inicio: document.getElementById('promo-inicio')?.value || new Date().toISOString(),
            data_fim: document.getElementById('promo-fim')?.value || null
        };
        try {
            await Promotions.savePromotion(data);
            showToast('Promoção criada!', 'success');
            closeModal();
            await renderPromotionsList();
        } catch (err) {
            showToast(err.message, 'danger');
        }
    }

    async function togglePromotion(id) {
        try {
            await Promotions.togglePromotion(id);
            await renderPromotionsList();
        } catch (err) {
            showToast(err.message, 'danger');
        }
    }

    async function deletePromotion(id) {
        const ok = await confirmDialog('Excluir Promoção', 'Tem certeza que deseja excluir esta promoção?');
        if (!ok) return;
        await Promotions.deletePromotion(id);
        showToast('Promoção excluída.', 'success');
        await renderPromotionsList();
    }

    // --- CUPONS ---

    async function renderCouponsList() {
        const coupons = await Promotions.getAllCoupons();
        const tbody = document.getElementById('coupons-body');
        if (!tbody) return;

        if (coupons.length === 0) {
            tbody.innerHTML = `<tr><td colspan="7" class="text-center text-muted" style="padding:2rem;">Nenhum cupom criado.</td></tr>`;
            refreshLucideIcons();
            return;
        }

        const now = new Date().toISOString().slice(0, 10);
        tbody.innerHTML = coupons.map(c => {
            const expired = c.data_validade && c.data_validade < now;
            const exhausted = c.limite_usos > 0 && c.usos_realizados >= c.limite_usos;
            const isActive = c.ativo && !expired && !exhausted;
            const statusBadge = isActive ? '<span class="badge badge-success">Ativo</span>' : expired ? '<span class="badge badge-danger">Expirado</span>' : exhausted ? '<span class="badge badge-warning">Esgotado</span>' : '<span class="badge badge-secondary">Inativo</span>';
            const tipoStr = c.tipo_desconto === 'percentual' ? c.valor_desconto + '%' : fmtC(c.valor_desconto);
            const usos = c.limite_usos > 0 ? `${c.usos_realizados}/${c.limite_usos}` : `${c.usos_realizados || 0}/∞`;

            return `<tr>
                <td><code>${escapeHtml(c.codigo)}</code></td>
                <td>${c.tipo_desconto === 'percentual' ? 'Percentual' : 'Fixo'}</td>
                <td>${tipoStr}</td>
                <td>${c.data_validade ? new Date(c.data_validade + 'T00:00:00').toLocaleDateString('pt-BR') : 'Sem validade'}</td>
                <td>${usos}</td>
                <td>${statusBadge}</td>
                <td class="actions">
                    <button class="btn btn-sm btn-icon" onclick="App.toggleCoupon(${c.id})" title="${c.ativo ? 'Desativar' : 'Ativar'}"><i data-lucide="${c.ativo ? 'pause' : 'play'}"></i></button>
                    <button class="btn btn-sm btn-icon btn-danger-ghost" onclick="App.deleteCoupon(${c.id})" title="Excluir"><i data-lucide="trash-2"></i></button>
                </td>
            </tr>`;
        }).join('');

        refreshLucideIcons();
    }

    async function openCouponModal() {
        const generatedCode = Promotions.generateCouponCode();
        const categories = await Categories.getAll();

        const catCheckboxes = categories.map(c =>
            `<label class="checkbox-label"><input type="checkbox" value="${c.id}" class="coupon-cat-cb"> ${escapeHtml(c.nome)}</label>`
        ).join('');

        const html = `
        <form onsubmit="event.preventDefault(); App.saveCoupon();">
            <div class="form-grid">
                <div class="form-group">
                    <label>Código do Cupom</label>
                    <input type="text" id="coupon-codigo" value="${generatedCode}" required style="text-transform:uppercase;font-family:monospace;font-size:1.1rem;">
                    <small>Gerado automaticamente, pode editar</small>
                </div>
                <div class="form-group">
                    <label>Tipo de Desconto</label>
                    <select id="coupon-tipo"><option value="percentual">Percentual (%)</option><option value="fixo">Valor Fixo (R$)</option></select>
                </div>
            </div>
            <div class="form-grid">
                <div class="form-group">
                    <label>Valor do Desconto</label>
                    <input type="number" id="coupon-valor" required step="0.01" min="0.01" placeholder="Ex: 10">
                </div>
                <div class="form-group">
                    <label>Data de Validade</label>
                    <input type="date" id="coupon-validade">
                    <small>Deixe vazio para sem validade</small>
                </div>
                <div class="form-group">
                    <label>Limite de Usos</label>
                    <input type="number" id="coupon-limite" value="0" min="0" step="1">
                    <small>0 = usos ilimitados</small>
                </div>
            </div>
            ${categories.length > 0 ? `
            <div class="form-group">
                <label>Restringir a Categorias (opcional)</label>
                <div class="checkbox-group">${catCheckboxes}</div>
                <small>Sem seleção = todas as categorias</small>
            </div>` : ''}
            <div class="form-actions">
                <button type="button" class="btn btn-secondary" onclick="App.closeModal()">Cancelar</button>
                <button type="submit" class="btn btn-primary"><i data-lucide="save"></i> Criar Cupom</button>
            </div>
        </form>`;

        openModal('Novo Cupom', html);
    }

    async function saveCoupon() {
        const catCbs = document.querySelectorAll('.coupon-cat-cb:checked');
        const categorias = Array.from(catCbs).map(cb => parseInt(cb.value));

        const data = {
            codigo: document.getElementById('coupon-codigo')?.value.trim(),
            tipo_desconto: document.getElementById('coupon-tipo')?.value,
            valor_desconto: parseFloat(document.getElementById('coupon-valor')?.value),
            data_validade: document.getElementById('coupon-validade')?.value || null,
            limite_usos: parseInt(document.getElementById('coupon-limite')?.value) || 0,
            categorias
        };
        try {
            await Promotions.saveCoupon(data);
            showToast('Cupom criado!', 'success');
            closeModal();
            await renderCouponsList();
        } catch (err) {
            showToast(err.message, 'danger');
        }
    }

    async function toggleCoupon(id) {
        try {
            await Promotions.toggleCoupon(id);
            await renderCouponsList();
        } catch (err) {
            showToast(err.message, 'danger');
        }
    }

    async function deleteCoupon(id) {
        const ok = await confirmDialog('Excluir Cupom', 'Tem certeza que deseja excluir este cupom?');
        if (!ok) return;
        await Promotions.deleteCoupon(id);
        showToast('Cupom excluído.', 'success');
        await renderCouponsList();
    }

    // ==========================================
    //  CONFIGURAÇÕES
    // ==========================================

    function renderSettings() {
        if (!Auth.isAdmin()) return;
        const s = Calculator.getSettings();
        setInputVal('cfg-margem', s.margem_padrao);
        setInputVal('cfg-custo-kg', s.custo_kg);
        setInputVal('cfg-custo-hora', s.custo_hora_maquina);
        setInputVal('cfg-custo-kwh', s.custo_kwh);
        setInputVal('cfg-consumo-w', s.consumo_maquina_w || 350);
        setInputVal('cfg-falha', s.percentual_falha);
        setInputVal('cfg-depreciacao', s.depreciacao_percentual);
        renderRootStorageStatus();
    }

    function getCurrentUIState() {
        return {
            captured_at: new Date().toISOString(),
            current_section: currentSection,
            product_view_mode: productViewMode,
            filters: {
                products: {
                    search: document.getElementById('product-search')?.value || '',
                    category: document.getElementById('filter-category')?.value || '',
                    status: document.getElementById('filter-status')?.value || '',
                    sort: document.getElementById('filter-sort')?.value || ''
                },
                sales: {
                    start: document.getElementById('filter-date-start')?.value || '',
                    end: document.getElementById('filter-date-end')?.value || '',
                    vendedor: document.getElementById('filter-vendedor')?.value || ''
                },
                expenses: {
                    start: document.getElementById('expense-filter-start')?.value || '',
                    end: document.getElementById('expense-filter-end')?.value || '',
                    category: document.getElementById('expense-filter-category')?.value || '',
                    payment: document.getElementById('expense-filter-payment')?.value || ''
                },
                clients: {
                    search: document.getElementById('client-search')?.value || '',
                    ranking: document.getElementById('client-filter-ranking')?.value || '',
                    debt: document.getElementById('client-filter-debt')?.value || '',
                    payment: document.getElementById('client-filter-payment')?.value || ''
                }
            }
        };
    }

    function renderRootStorageStatus() {
        const statusEl = document.getElementById('root-storage-status');
        if (!statusEl) return;
        if (typeof RootStorage === 'undefined') {
            statusEl.textContent = 'Módulo de Pasta Raiz indisponível.';
            return;
        }

        const status = RootStorage.getStatus();
        if (!status.supported) {
            statusEl.textContent = 'Navegador sem suporte a acesso de pasta local (use Edge/Chrome recente).';
            return;
        }

        if (!status.active) {
            statusEl.textContent = 'Nenhuma pasta conectada.';
            return;
        }

        const syncLabel = status.lastSyncAt
            ? `Última sincronização: ${new Date(status.lastSyncAt).toLocaleString('pt-BR')}`
            : 'Ainda sem sincronização.';
        statusEl.textContent = `Pasta conectada: ${status.folderName}. ${syncLabel}`;
    }

    async function connectRootStorage() {
        if (!Auth.isAdmin()) return;
        try {
            if (typeof RootStorage === 'undefined') throw new Error('Módulo de pasta raiz não carregado.');
            await RootStorage.connectDirectory();
            await syncRootStorageNow(true);
            showToast('Pasta raiz conectada e migração inicial concluída.', 'success');
            closeModal();
        } catch (err) {
            showToast('Falha ao conectar pasta raiz: ' + err.message, 'danger');
        }
        renderRootStorageStatus();
    }

    async function syncRootStorageNow(silent = false) {
        if (!Auth.isAdmin()) return;
        try {
            if (typeof RootStorage === 'undefined') throw new Error('Módulo de pasta raiz não carregado.');
            await RootStorage.syncFromDatabase({
                uiState: getCurrentUIState(),
                sessionState: {
                    currentUser: Auth.getCurrentUser() || null
                }
            });
            if (!silent) showToast('Sincronização concluída na pasta raiz.', 'success');
        } catch (err) {
            if (!silent) showToast('Falha na sincronização: ' + err.message, 'danger');
            if (silent) throw err;
        }
        renderRootStorageStatus();
    }

    async function restoreRootStorage() {
        if (!Auth.isAdmin()) return;
        try {
            if (typeof RootStorage === 'undefined') throw new Error('Módulo de pasta raiz não carregado.');
            const ok = await confirmDialog('Restaurar da Pasta Raiz', 'Isso vai sobrescrever o banco atual com os arquivos da pasta raiz conectada. Deseja continuar?');
            if (!ok) return;

            await RootStorage.restoreToDatabase();
            showToast('Banco restaurado a partir da pasta raiz.', 'success');
            await navigate(currentSection);
        } catch (err) {
            showToast('Falha ao restaurar: ' + err.message, 'danger');
        }
        renderRootStorageStatus();
    }

    async function accessRootStorage() {
        if (!Auth.isAdmin()) return;
        try {
            if (typeof RootStorage === 'undefined') throw new Error('Módulo de pasta raiz não carregado.');

            if (!RootStorage.isActive()) {
                const ok = await confirmDialog('Pasta Raiz não conectada', 'Para acessar a estrutura da Pasta Raiz, conecte uma pasta agora. Deseja continuar?');
                if (!ok) return;
                await connectRootStorage();
                if (!RootStorage.isActive()) return;
            }

            const overview = await RootStorage.getRootOverview();
            const manifestDate = overview.manifest?.generated_at
                ? new Date(overview.manifest.generated_at).toLocaleString('pt-BR')
                : 'Não encontrado';
            const manifestVersion = overview.manifest?.version ?? '—';
            const treeHtml = renderRootTreeHtml(overview.tree || []);

            const html = `
            <div class="card" style="border:none;box-shadow:none;padding:0;">
                <p class="text-secondary" style="margin-bottom:0.6rem;">
                    Pasta conectada: <strong>${escapeHtml(overview.folderName)}</strong>
                </p>
                <p class="text-secondary" style="margin-bottom:0.8rem;font-size:0.85rem;">
                    Estrutura exibida: <strong>${escapeHtml(overview.dataFolder)}</strong> | Versão Manifesto: <strong>${escapeHtml(String(manifestVersion))}</strong> | Última sincronização: <strong>${escapeHtml(manifestDate)}</strong>
                </p>
                <div style="border:1px solid var(--color-border); border-radius:12px; padding:0.75rem; max-height:320px; overflow:auto; background:var(--color-bg-secondary);">
                    ${treeHtml}
                </div>
                <div class="form-actions" style="justify-content:flex-start; margin-top:0.8rem;">
                    <button type="button" class="btn btn-primary" onclick="App.syncRootStorageNow()">
                        <i data-lucide="refresh-cw"></i> Sincronizar Agora
                    </button>
                    <button type="button" class="btn btn-danger" onclick="App.restoreRootStorage()">
                        <i data-lucide="rotate-ccw"></i> Restaurar da Pasta
                    </button>
                    <button type="button" class="btn btn-secondary" onclick="App.closeModal()">Fechar</button>
                </div>
            </div>`;

            openModal('Acessar Pasta Raiz', html, true);
        } catch (err) {
            showToast('Falha ao acessar Pasta Raiz: ' + err.message, 'danger');
        }
    }

    function renderRootTreeHtml(items, level = 0) {
        if (!items || items.length === 0) {
            return '<p class="text-secondary" style="margin:0;">Nenhum arquivo encontrado.</p>';
        }

        return `<ul style="list-style:none; margin:${level === 0 ? 0 : '0.35rem 0 0.15rem 0'}; padding-left:${level === 0 ? 0 : '1rem'}; display:grid; gap:0.3rem;">${items.map(item => {
            const icon = item.kind === 'directory' ? 'folder' : 'file';
            const children = item.kind === 'directory' && item.children && item.children.length > 0
                ? renderRootTreeHtml(item.children, level + 1)
                : '';
            return `<li><div style="display:flex;align-items:center;gap:0.4rem;"><i data-lucide="${icon}"></i><span>${escapeHtml(item.name)}</span></div>${children}</li>`;
        }).join('')}</ul>`;
    }

    function saveSettings() {
        if (!Auth.isAdmin()) return;
        const settings = [{
            margem_padrao:          parseFloat(document.getElementById('cfg-margem').value) || 0,
            custo_kg:               parseFloat(document.getElementById('cfg-custo-kg').value) || 0,
            custo_hora_maquina:     parseFloat(document.getElementById('cfg-custo-hora').value) || 0,
            custo_kwh:              parseFloat(document.getElementById('cfg-custo-kwh').value) || 0,
            consumo_maquina_w:      parseFloat(document.getElementById('cfg-consumo-w').value) || 350,
            percentual_falha:       parseFloat(document.getElementById('cfg-falha').value) || 0,
            depreciacao_percentual: parseFloat(document.getElementById('cfg-depreciacao').value) || 0
        }];
        Storage.setSheet('SETTINGS', settings);
        const updated = Calculator.recalcularTodosProdutos();
        showToast(`Configurações salvas! ${updated.length} produto(s) recalculado(s).`, 'success');
    }

    // ==========================================
    //  USUÁRIOS — CRUD
    // ==========================================

    function renderUsers() {
        if (!Auth.isAdmin()) return;
        const users = Storage.getSheet('USERS');
        const tbody = document.getElementById('users-body');
        if (!tbody) return;

        if (users.length === 0) {
            tbody.innerHTML = '<tr><td colspan="4" class="text-center text-muted">Nenhum usuário.</td></tr>';
            return;
        }

        tbody.innerHTML = users.map(u => {
            const badgeType = u.tipo === 'ADMIN' ? 'primary' : 'secondary';
            return `<tr>
                <td><strong>${escapeHtml(u.nome)}</strong></td>
                <td>${escapeHtml(u.email)}</td>
                <td><span class="badge badge-${badgeType}">${u.tipo}</span></td>
                <td class="actions">
                    <button class="btn btn-sm btn-icon" onclick="App.openUserModal(${u.id})" title="Editar"><i data-lucide="pencil"></i></button>
                    <button class="btn btn-sm btn-icon btn-danger-ghost" onclick="App.deleteUser(${u.id})" title="Excluir"><i data-lucide="trash-2"></i></button>
                </td>
            </tr>`;
        }).join('');
    }

    function openUserModal(id) {
        editingUserId = id || null;
        const user = id ? Storage.getRowById('USERS', id) : null;
        const title = user ? 'Editar Usuário' : 'Novo Usuário';

        const html = `
        <form id="user-form" onsubmit="event.preventDefault(); App.saveUser();">
            <div class="form-group">
                <label>Nome Completo</label>
                <input type="text" id="user-nome" value="${user ? escapeHtml(user.nome) : ''}" required placeholder="Nome do usuário">
            </div>
            <div class="form-group">
                <label>Email</label>
                <input type="email" id="user-email" value="${user ? escapeHtml(user.email) : ''}" required placeholder="email@exemplo.com">
            </div>
            <div class="form-group">
                <label>Senha ${user ? '<small>(deixe vazio para manter a atual)</small>' : ''}</label>
                <input type="password" id="user-senha" ${user ? '' : 'required'} placeholder="${user ? 'Manter senha atual' : 'Digite a senha'}">
            </div>
            <div class="form-group">
                <label>Tipo de Acesso</label>
                <select id="user-tipo" required>
                    <option value="ADMIN" ${user && user.tipo === 'ADMIN' ? 'selected' : ''}>Administrador</option>
                    <option value="VENDEDOR" ${!user || user.tipo === 'VENDEDOR' ? 'selected' : ''}>Vendedor</option>
                </select>
            </div>
            <div class="form-actions">
                <button type="button" class="btn btn-secondary" onclick="App.closeModal()">Cancelar</button>
                <button type="submit" class="btn btn-primary"><i data-lucide="save"></i> ${user ? 'Atualizar' : 'Criar Usuário'}</button>
            </div>
        </form>`;

        openModal(title, html);
        if (user) setTimeout(() => { document.getElementById('user-tipo').value = user.tipo; }, 10);
    }

    function saveUser() {
        const nome = document.getElementById('user-nome').value.trim();
        const email = document.getElementById('user-email').value.trim();
        const senha = document.getElementById('user-senha').value;
        const tipo = document.getElementById('user-tipo').value;

        if (!nome || !email) { showToast('Preencha nome e email.', 'warning'); return; }
        if (!editingUserId && !senha) { showToast('Senha é obrigatória para novos usuários.', 'warning'); return; }

        const users = Storage.getSheet('USERS');
        const duplicate = users.find(u => u.email.toLowerCase() === email.toLowerCase() && u.id !== editingUserId);
        if (duplicate) { showToast('Este email já está em uso.', 'danger'); return; }

        const data = { nome, email, tipo };
        if (senha) data.senha_hash = sha256(senha);

        if (editingUserId) {
            Storage.updateRow('USERS', editingUserId, data);
            showToast('Usuário atualizado!', 'success');
        } else {
            Storage.addRow('USERS', data);
            showToast('Usuário criado!', 'success');
        }
        closeModal();
        renderUsers();
    }

    async function deleteUser(id) {
        const users = Storage.getSheet('USERS');
        const user = users.find(u => u.id === id);
        if (!user) return;

        const adminCount = users.filter(u => u.tipo === 'ADMIN').length;
        if (user.tipo === 'ADMIN' && adminCount <= 1) {
            showToast('Não é possível excluir o último administrador.', 'danger');
            return;
        }
        const currentUser = Auth.getCurrentUser();
        if (id === currentUser.id) {
            showToast('Você não pode excluir sua própria conta.', 'danger');
            return;
        }

        const ok = await confirmDialog('Excluir Usuário', `Excluir o usuário "${user.nome}"?\nEsta ação não pode ser desfeita.`);
        if (!ok) return;

        Storage.deleteRow('USERS', id);
        showToast('Usuário excluído.', 'success');
        renderUsers();
    }

    // ==========================================
    //  CALCULADORA AVANÇADA
    // ==========================================

    async function renderCalculator() {
        const s = Calculator.getSettings();

        setInputVal('adv-custo-kg', s.custo_kg);
        setInputVal('adv-custo-kwh', s.custo_kwh);
        setInputVal('adv-consumo-w', s.consumo_maquina_w || 350);
        setInputVal('adv-custo-hora', s.custo_hora_maquina);
        setInputVal('adv-depreciacao', (s.depreciacao_percentual || 0) * 100);
        setInputVal('adv-falhas', (s.percentual_falha || 0) * 100);
        setInputVal('adv-margem', (s.margem_padrao || 0) * 100);

        // Populate category select in calculator
        const catSel = document.getElementById('adv-categoria');
        if (catSel) {
            const categories = await Categories.getAll();
            catSel.innerHTML = categories.map(c => `<option value="${c.id}">${escapeHtml(c.nome)}</option>`).join('');
        }

        calcAdvanced();
    }

    function calcAdvanced() {
        const comprimento_m = Math.max(0, parseFloat(document.getElementById('adv-comprimento')?.value) || 0);
        const diametro_mm = Math.max(0, parseFloat(document.getElementById('adv-diametro')?.value) || 0);
        const densidade = Math.max(0, parseFloat(document.getElementById('adv-densidade')?.value) || 0);
        const tempo_min = Math.max(0, parseFloat(document.getElementById('adv-tempo-min')?.value) || 0);

        const custo_kg = Math.max(0, parseFloat(document.getElementById('adv-custo-kg')?.value) || 0);
        const custo_kwh = Math.max(0, parseFloat(document.getElementById('adv-custo-kwh')?.value) || 0);
        const consumo_w = Math.max(0, parseFloat(document.getElementById('adv-consumo-w')?.value) || 0);
        const custo_hora_maq = Math.max(0, parseFloat(document.getElementById('adv-custo-hora')?.value) || 0);
        const depreciacao_pc = Math.max(0, parseFloat(document.getElementById('adv-depreciacao')?.value) || 0) / 100;
        const falhas_pc = Math.max(0, parseFloat(document.getElementById('adv-falhas')?.value) || 0) / 100;

        const modelagem = Math.max(0, parseFloat(document.getElementById('adv-modelagem')?.value) || 0);
        const acabamento_pc = Math.max(0, parseFloat(document.getElementById('adv-acabamento')?.value) || 0) / 100;
        const fixacao = Math.max(0, parseFloat(document.getElementById('adv-fixacao')?.value) || 0);
        const outros = Math.max(0, parseFloat(document.getElementById('adv-outros')?.value) || 0);
        const margem_pc = Math.max(0, parseFloat(document.getElementById('adv-margem')?.value) || 0) / 100;

        const raio_mm = diametro_mm / 2;
        const area_mm2 = Math.PI * raio_mm * raio_mm;
        const area_cm2 = area_mm2 / 100;
        const comprimento_cm = comprimento_m * 100;
        const volume_cm3 = area_cm2 * comprimento_cm;
        const peso_g = volume_cm3 * densidade;
        const tempo_h = tempo_min / 60;

        setText('step-raio', raio_mm > 0 ? raio_mm.toFixed(3) + ' mm' : '—');
        setText('step-area', area_mm2 > 0 ? area_mm2.toFixed(4) + ' mm² = ' + area_cm2.toFixed(6) + ' cm²' : '—');
        setText('step-volume', volume_cm3 > 0 ? volume_cm3.toFixed(4) + ' cm³' : '—');
        setText('step-peso', peso_g > 0 ? peso_g.toFixed(2) + ' g' : '—');
        setText('step-tempo-h', tempo_min > 0 ? tempo_min + ' min = ' + tempo_h.toFixed(3) + ' h' : '—');

        const custoMaterial = (peso_g / 1000) * custo_kg;
        const energia_kwh = (consumo_w / 1000) * tempo_h;
        const custoEnergia = energia_kwh * custo_kwh;
        const custoDepreciacao = custo_hora_maq * tempo_h * depreciacao_pc;
        const subtotal = custoMaterial + custoEnergia + custoDepreciacao;
        const custoFalhas = subtotal * falhas_pc;

        setText('step-custo-material', fmtC(custoMaterial));
        setText('step-energia-kwh', energia_kwh > 0 ? energia_kwh.toFixed(4) + ' kWh' : '—');
        setText('step-custo-energia', fmtC(custoEnergia));
        setText('step-custo-depreciacao', fmtC(custoDepreciacao));
        setText('step-subtotal', fmtC(subtotal));
        setText('step-custo-falhas', fmtC(custoFalhas));

        const custoBase = subtotal + custoFalhas;
        const custoAcabamento = custoBase * acabamento_pc;
        const totalAdicionais = modelagem + custoAcabamento + fixacao + outros;

        const custoProducao = custoBase + totalAdicionais;
        const precoVenda = custoProducao * (1 + margem_pc);
        const lucro = precoVenda - custoProducao;
        const margemReal = precoVenda > 0 ? ((precoVenda - custoProducao) / precoVenda) * 100 : 0;

        setText('res-material', fmtC(custoMaterial));
        setText('res-energia', fmtC(custoEnergia));
        setText('res-depreciacao', fmtC(custoDepreciacao));
        setText('res-falhas', fmtC(custoFalhas));
        setText('res-modelagem', fmtC(modelagem));
        setText('res-acabamento', fmtC(custoAcabamento));
        setText('res-fixacao', fmtC(fixacao));
        setText('res-outros', fmtC(outros));
        setText('res-custo-total', fmtC(custoProducao));
        setText('res-preco-venda', fmtC(precoVenda));
        setText('res-lucro', fmtC(lucro));
        setText('res-margem-real', margemReal.toFixed(1).replace('.', ',') + '%');

        const alertEl = document.getElementById('margin-alert');
        if (alertEl) {
            alertEl.classList.toggle('hidden', !(custoProducao > 0 && margemReal < 20));
        }

        calcAdvanced._lastResult = {
            peso_g: Calculator.round2(peso_g),
            tempo_h: Calculator.round2(tempo_h),
            custoTotal: Calculator.round2(custoProducao),
            precoVenda: Calculator.round2(precoVenda)
        };
    }

    function calcResetForm() {
        ['adv-comprimento', 'adv-tempo-min', 'adv-modelagem', 'adv-acabamento', 'adv-fixacao', 'adv-outros', 'adv-nome-produto'].forEach(id => {
            const el = document.getElementById(id);
            if (el) el.value = el.type === 'number' ? '0' : '';
        });
        setInputVal('adv-diametro', 1.75);
        setInputVal('adv-densidade', 1.24);
        setInputVal('adv-comprimento', '');
        setInputVal('adv-tempo-min', '');
        renderCalculator();
        showToast('Formulário limpo.', 'info');
    }

    async function calcSaveAsProduct() {
        const nome = document.getElementById('adv-nome-produto')?.value.trim();
        const result = calcAdvanced._lastResult;
        const catId = parseInt(document.getElementById('adv-categoria')?.value);

        if (!nome) {
            showToast('Informe o nome do produto antes de salvar.', 'warning');
            document.getElementById('adv-nome-produto')?.focus();
            return;
        }
        if (!result || result.peso_g <= 0 || result.tempo_h <= 0) {
            showToast('Preencha os dados físicos da peça para calcular.', 'warning');
            return;
        }

        let sku = 'PROD-001';
        if (catId) {
            sku = await Database.getNextSKU(catId);
        }

        try {
            await Database.add(Database.STORES.PRODUCTS, {
                codigo_sku: sku,
                category_id: catId || null,
                nome,
                descricao: '',
                peso_g: result.peso_g,
                tempo_h: result.tempo_h,
                dimensoes: { largura: 0, altura: 0, profundidade: 0 },
                material: 'PLA',
                cor: '',
                resolucao_camada: 0.2,
                custo_total: result.custoTotal,
                preco_venda: result.precoVenda,
                quantidade_estoque: 0,
                estoque_minimo: 0,
                tags: [],
                descricoes_social: { instagram: '', facebook: '', whatsapp: '', tiktok: '', geral: '' },
                ativo: true,
                created_at: new Date().toISOString(),
                updated_at: new Date().toISOString()
            });
            await Storage.refreshCache();
            showToast(`Produto "${nome}" salvo no catálogo!`, 'success');
            document.getElementById('adv-nome-produto').value = '';
        } catch (err) {
            showToast('Erro ao salvar: ' + err.message, 'danger');
        }
    }

    // ==========================================
    //  TOAST NOTIFICATIONS
    // ==========================================

    function showToast(message, type = 'info') {
        const container = document.getElementById('toast-container');
        if (!container) return;

        const toast = document.createElement('div');
        toast.className = `toast toast-${type}`;
        const icons = {
            success: '<i data-lucide="check-circle"></i>',
            danger: '<i data-lucide="x-circle"></i>',
            warning: '<i data-lucide="alert-triangle"></i>',
            info: '<i data-lucide="info"></i>'
        };
        toast.innerHTML = `<span class="toast-icon">${icons[type] || '<i data-lucide="info"></i>'}</span><span>${escapeHtml(message)}</span>`;
        container.appendChild(toast);
        if (typeof lucide !== 'undefined') lucide.createIcons();
        requestAnimationFrame(() => toast.classList.add('show'));
        setTimeout(() => { toast.classList.remove('show'); setTimeout(() => toast.remove(), 350); }, 3500);
    }

    // ==========================================
    //  UTILIDADES
    // ==========================================

    function escapeHtml(str) {
        if (!str) return '';
        const div = document.createElement('div');
        div.textContent = String(str);
        return div.innerHTML;
    }

    function setInputVal(id, value) {
        const el = document.getElementById(id);
        if (el) el.value = value;
    }

    function setText(id, val) {
        const el = document.getElementById(id);
        if (el) el.textContent = val;
    }

    function fmtC(val) {
        return Calculator.formatCurrency(val);
    }

    function refreshLucideIcons() {
        if (typeof lucide !== 'undefined') {
            lucide.createIcons();
        }
    }

    // ==========================================
    //  API PÚBLICA
    // ==========================================
    return {
        init, navigate, closeModal, showToast,
        // Categories
        openCategoryModal, saveCategory, deleteCategory,
        _selectIcon, _selectColor,
        // Products
        openProductSummary, openProductModal, saveProduct, deleteProduct,
        calcProductPreview, switchProductTab, onCategoryChange,
        toggleProductView, debounceProductSearch, filterProducts,
        refreshProductFiles, removeProductFile, downloadProductZip,
        // Sales
        openSaleModal, toggleSaleMode, onSaleProductChange, onSaleClientInput, calcSalePreview, applySaleCoupon, saveSale, filterSales,
        // Expenses
        renderExpenses, openExpenseModal, calcExpenseTotal, saveExpense, deleteExpense,
        // Clients
        renderClients, openClientModal, saveClient, deleteClient,
        // Trash
        renderTrash, restoreTrashItem, permanentDeleteTrashItem, purgeExpiredTrashNow,
        // Promotions
        switchPromoTab, openPromotionModal, savePromotion, togglePromotion, deletePromotion,
        openCouponModal, saveCoupon, toggleCoupon, deleteCoupon,
        // Calculator
        calcAdvanced, calcResetForm, calcSaveAsProduct, calcRegisterSaleFromCalculator,
        // Settings & Users
        saveSettings, openUserModal, saveUser, deleteUser,
        connectRootStorage, syncRootStorageNow, restoreRootStorage, getCurrentUIState,
        chooseExistingRootFolder, createNewRootFolder, accessRootStorage
    };
})();

// Inicializa quando o DOM estiver pronto
document.addEventListener('DOMContentLoaded', () => App.init());
