// ============================================
// PRINTH3D LITE — Módulo Principal (App)
// Orquestra navegação, CRUD, modais e feedback
// ============================================

const App = (() => {
    // === ESTADO INTERNO ===
    let currentSection = 'dashboard';
    let editingProductId = null;
    let editingUserId = null;

    // ==========================================
    //  INICIALIZAÇÃO
    // ==========================================

    function init() {
        Storage.init();
        if (!Auth.checkAuth()) return;

        setupUI();
        setupNavigation();
        setupGlobalListeners();
        navigate('dashboard');

        console.log('[App] Printh3D Lite inicializado.');
    }

    // ------------------------------------------
    // Configura UI baseada no usuário logado
    // ------------------------------------------
    function setupUI() {
        const user = Auth.getCurrentUser();
        if (!user) return;

        // Sidebar user info
        const avatarEl = document.getElementById('user-avatar');
        const nameEl = document.getElementById('user-display-name');
        const roleEl = document.getElementById('user-display-role');
        const headerName = document.getElementById('header-user-name');

        if (avatarEl) avatarEl.textContent = user.nome.charAt(0).toUpperCase();
        if (nameEl) nameEl.textContent = user.nome;
        if (roleEl) roleEl.textContent = user.tipo === 'ADMIN' ? 'Administrador' : 'Vendedor';
        if (headerName) headerName.textContent = user.nome;

        // Esconde elementos restritos a ADMIN
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
        // Links do menu lateral
        document.querySelectorAll('[data-section]').forEach(link => {
            link.addEventListener('click', e => {
                e.preventDefault();
                navigate(link.dataset.section);
                closeMobileSidebar();
            });
        });

        // Logout
        document.getElementById('btn-logout').addEventListener('click', e => {
            e.preventDefault();
            Auth.logout();
        });

        // Exportar Excel
        document.getElementById('btn-export').addEventListener('click', () => {
            try {
                Storage.exportExcel();
                showToast('Backup exportado com sucesso!', 'success');
            } catch (err) {
                showToast('Erro ao exportar: ' + err.message, 'danger');
            }
        });

        // Importar Excel - trigger
        document.getElementById('btn-import-trigger').addEventListener('click', () => {
            document.getElementById('file-import').click();
        });

        // Importar Excel - handler
        document.getElementById('file-import').addEventListener('change', async (e) => {
            const file = e.target.files[0];
            if (!file) return;
            try {
                await Storage.importExcel(file);
                showToast('Dados importados com sucesso!', 'success');
                navigate(currentSection); // Re-renderiza seção atual
            } catch (err) {
                showToast('Erro ao importar: ' + err.message, 'danger');
            }
            e.target.value = '';
        });

        // Sidebar mobile toggle
        const toggleBtn = document.getElementById('sidebar-toggle');
        if (toggleBtn) {
            toggleBtn.addEventListener('click', () => {
                document.getElementById('sidebar').classList.toggle('open');
                document.getElementById('sidebar-backdrop').classList.toggle('active');
            });
        }

        // Backdrop fecha sidebar
        const backdrop = document.getElementById('sidebar-backdrop');
        if (backdrop) {
            backdrop.addEventListener('click', closeMobileSidebar);
        }
    }

    // ------------------------------------------
    // Listeners globais (modal, teclado)
    // ------------------------------------------
    function setupGlobalListeners() {
        // Fechar modal ao clicar no overlay
        document.getElementById('modal-overlay').addEventListener('click', e => {
            if (e.target === e.currentTarget) closeModal();
        });

        // Fechar modal com Escape
        document.addEventListener('keydown', e => {
            if (e.key === 'Escape') closeModal();
        });
    }

    function closeMobileSidebar() {
        document.getElementById('sidebar').classList.remove('open');
        document.getElementById('sidebar-backdrop').classList.remove('active');
    }

    // ==========================================
    //  NAVEGAÇÃO
    // ==========================================

    function navigate(section) {
        currentSection = section;

        // Atualiza estado ativo no menu
        document.querySelectorAll('[data-section]').forEach(link => {
            const li = link.parentElement;
            li.classList.toggle('active', link.dataset.section === section);
        });

        // Mostra/oculta seções
        document.querySelectorAll('.section').forEach(el => {
            el.classList.toggle('active', el.id === 'section-' + section);
        });

        // Título do header
        const titles = {
            dashboard: 'Dashboard',
            products: 'Produtos',
            sales: 'Vendas',
            calculator: 'Calculadora de Custo',
            settings: 'Configurações',
            users: 'Usuários'
        };
        const titleEl = document.getElementById('page-title');
        if (titleEl) titleEl.textContent = titles[section] || '';

        // Renderiza conteúdo da seção
        switch (section) {
            case 'dashboard': Dashboard.render(); break;
            case 'products':  renderProducts();   break;
            case 'sales':     renderSales();      break;
            case 'calculator':renderCalculator(); break;
            case 'settings':  renderSettings();   break;
            case 'users':     renderUsers();      break;
        }
    }

    // ==========================================
    //  MODAL GENÉRICO
    // ==========================================

    function openModal(title, bodyHtml) {
        document.getElementById('modal-title').textContent = title;
        document.getElementById('modal-body').innerHTML = bodyHtml;
        document.getElementById('modal-overlay').classList.remove('hidden');
        document.body.style.overflow = 'hidden';
        // Re-render Lucide icons in dynamic content
        if (typeof lucide !== 'undefined') lucide.createIcons();
    }

    function closeModal() {
        document.getElementById('modal-overlay').classList.add('hidden');
        document.body.style.overflow = '';
        editingProductId = null;
        editingUserId = null;
    }

    // ==========================================
    //  PRODUTOS — CRUD
    // ==========================================

    function renderProducts() {
        const products = Storage.getSheet('PRODUCTS');
        const tbody = document.getElementById('products-body');
        if (!tbody) return;

        if (products.length === 0) {
            tbody.innerHTML = `
                <tr>
                    <td colspan="7" class="text-center text-muted" style="padding: 2.5rem;">
                        <div class="empty-state">
                            <div class="empty-icon"><i data-lucide="package"></i></div>
                            <p>Nenhum produto cadastrado.<br>Clique em "+ Novo Produto" para começar.</p>
                        </div>
                    </td>
                </tr>`;
            return;
        }

        tbody.innerHTML = products.map(p => {
            const margem = p.preco_venda > 0
                ? ((p.preco_venda - p.custo_total) / p.preco_venda * 100)
                : 0;
            const margemClass = margem < 20 ? 'text-danger' : 'text-success';
            const margemAlert = margem < 20 ? '' : '';

            return `<tr>
                <td><strong>${escapeHtml(p.nome)}</strong></td>
                <td>${p.peso_g}g</td>
                <td>${p.tempo_h}h</td>
                <td>${Calculator.formatCurrency(p.custo_total)}</td>
                <td>${Calculator.formatCurrency(p.preco_venda)}</td>
                <td class="${margemClass}">${margem.toFixed(1)}%${margemAlert}</td>
                <td class="actions">
                    <button class="btn btn-sm btn-icon" onclick="App.openProductModal(${p.id})" title="Editar">✏️</button>
                    <button class="btn btn-sm btn-icon btn-danger-ghost" onclick="App.deleteProduct(${p.id})" title="Excluir">🗑️</button>
                </td>
            </tr>`;
        }).join('');
    }

    // ------------------------------------------
    // Abre modal de produto (novo ou edição)
    // ------------------------------------------
    function openProductModal(id) {
        editingProductId = id || null;
        const product = id ? Storage.getRowById('PRODUCTS', id) : null;
        const title = product ? 'Editar Produto' : 'Novo Produto';

        const html = `
            <form id="product-form" onsubmit="event.preventDefault(); App.saveProduct();">
                <div class="form-group">
                    <label>Nome do Produto</label>
                    <input type="text" id="prod-nome"
                           value="${product ? escapeHtml(product.nome) : ''}"
                           required placeholder="Ex: Vaso Decorativo, Suporte de Celular">
                </div>
                <div class="form-row">
                    <div class="form-group">
                        <label>Peso (gramas)</label>
                        <input type="number" id="prod-peso"
                               value="${product ? product.peso_g : ''}"
                               required min="0.1" step="0.1"
                               placeholder="Ex: 150"
                               oninput="App.calcProductPreview()">
                    </div>
                    <div class="form-group">
                        <label>Tempo de Impressão (horas)</label>
                        <input type="number" id="prod-tempo"
                               value="${product ? product.tempo_h : ''}"
                               required min="0.1" step="0.1"
                               placeholder="Ex: 3.5"
                               oninput="App.calcProductPreview()">
                    </div>
                </div>

                <div id="calc-preview" class="calc-preview" style="display:none;">
                    <h4><i data-lucide="bar-chart-3"></i> Simulação de Custo</h4>
                    <div class="calc-grid">
                        <div class="calc-item">
                            <span>Material</span>
                            <span id="calc-material">—</span>
                        </div>
                        <div class="calc-item">
                            <span>Máquina</span>
                            <span id="calc-maquina">—</span>
                        </div>
                        <div class="calc-item">
                            <span>Energia</span>
                            <span id="calc-energia">—</span>
                        </div>
                        <div class="calc-item">
                            <span>Depreciação</span>
                            <span id="calc-depreciacao">—</span>
                        </div>
                        <div class="calc-item">
                            <span>Falhas</span>
                            <span id="calc-falhas">—</span>
                        </div>
                        <div class="calc-item total">
                            <span>Custo Total</span>
                            <span id="calc-total">—</span>
                        </div>
                        <div class="calc-item success">
                            <span>Preço de Venda</span>
                            <span id="calc-preco">—</span>
                        </div>
                        <div class="calc-item">
                            <span>Lucro Estimado</span>
                            <span id="calc-lucro">—</span>
                        </div>
                        <div class="calc-item">
                            <span>Margem Real</span>
                            <span id="calc-margem">—</span>
                        </div>
                    </div>
                </div>

                <div class="form-actions">
                    <button type="button" class="btn btn-secondary" onclick="App.closeModal()">Cancelar</button>
                    <button type="submit" class="btn btn-primary">
                        <i data-lucide="save"></i> ${product ? 'Atualizar Produto' : 'Salvar Produto'}
                    </button>
                </div>
            </form>
        `;

        openModal(title, html);

        // Se editando, dispara preview dos valores atuais
        if (product) {
            setTimeout(calcProductPreview, 50);
        }
    }

    // ------------------------------------------
    // Cálculo em tempo real no formulário
    // ------------------------------------------
    function calcProductPreview() {
        const peso = parseFloat(document.getElementById('prod-peso').value);
        const tempo = parseFloat(document.getElementById('prod-tempo').value);

        const previewEl = document.getElementById('calc-preview');
        if (!peso || !tempo || peso <= 0 || tempo <= 0) {
            if (previewEl) previewEl.style.display = 'none';
            return;
        }

        const calc = Calculator.calcular(peso, tempo);
        previewEl.style.display = 'block';

        document.getElementById('calc-material').textContent    = Calculator.formatCurrency(calc.custoMaterial);
        document.getElementById('calc-maquina').textContent     = Calculator.formatCurrency(calc.custoMaquina);
        document.getElementById('calc-energia').textContent     = Calculator.formatCurrency(calc.custoEnergia);
        document.getElementById('calc-depreciacao').textContent = Calculator.formatCurrency(calc.custoDepreciacao);
        document.getElementById('calc-falhas').textContent      = Calculator.formatCurrency(calc.custoFalhas);
        document.getElementById('calc-total').textContent       = Calculator.formatCurrency(calc.custoTotal);
        document.getElementById('calc-preco').textContent       = Calculator.formatCurrency(calc.precoVenda);
        document.getElementById('calc-lucro').textContent       = Calculator.formatCurrency(calc.lucroEstimado);

        const margemEl = document.getElementById('calc-margem');
        margemEl.textContent = calc.margemReal.toFixed(1) + '%';
        margemEl.className = calc.margemReal < 20 ? 'text-danger' : 'text-success';
    }

    // ------------------------------------------
    // Salva produto (criar ou atualizar)
    // ------------------------------------------
    function saveProduct() {
        const nome   = document.getElementById('prod-nome').value.trim();
        const peso_g = parseFloat(document.getElementById('prod-peso').value);
        const tempo_h = parseFloat(document.getElementById('prod-tempo').value);

        if (!nome) {
            showToast('Informe o nome do produto.', 'warning');
            return;
        }
        if (!peso_g || peso_g <= 0) {
            showToast('Informe um peso válido.', 'warning');
            return;
        }
        if (!tempo_h || tempo_h <= 0) {
            showToast('Informe um tempo válido.', 'warning');
            return;
        }

        const calc = Calculator.calcular(peso_g, tempo_h);

        const data = {
            nome,
            peso_g,
            tempo_h,
            custo_total: calc.custoTotal,
            preco_venda: calc.precoVenda,
            created_at: new Date().toISOString()
        };

        if (editingProductId) {
            Storage.updateRow('PRODUCTS', editingProductId, data);
            showToast('Produto atualizado com sucesso!', 'success');
        } else {
            Storage.addRow('PRODUCTS', data);
            showToast('Produto cadastrado com sucesso!', 'success');
        }

        closeModal();
        renderProducts();
    }

    // ------------------------------------------
    // Exclui produto com confirmação
    // ------------------------------------------
    function deleteProduct(id) {
        const product = Storage.getRowById('PRODUCTS', id);
        if (!product) return;

        if (!confirm(`Excluir o produto "${product.nome}"?\nEsta ação não pode ser desfeita.`)) return;

        Storage.deleteRow('PRODUCTS', id);
        showToast('Produto excluído.', 'success');
        renderProducts();
    }

    // ==========================================
    //  VENDAS — CRUD
    // ==========================================

    function renderSales() {
        const user = Auth.getCurrentUser();
        let sales = Storage.getSheet('SALES');
        const products = Storage.getSheet('PRODUCTS');
        const users = Storage.getSheet('USERS');

        // VENDEDOR vê apenas suas vendas
        if (!Auth.isAdmin()) {
            sales = sales.filter(s => s.vendedor_id === user.id);
        }

        // Aplica filtros
        const dateStart = document.getElementById('filter-date-start')?.value;
        const dateEnd   = document.getElementById('filter-date-end')?.value;
        const vendedorFilter = document.getElementById('filter-vendedor')?.value;

        if (dateStart) {
            sales = sales.filter(s => s.data_venda >= dateStart);
        }
        if (dateEnd) {
            sales = sales.filter(s => s.data_venda <= dateEnd + 'T23:59:59');
        }
        if (vendedorFilter) {
            sales = sales.filter(s => s.vendedor_id === parseInt(vendedorFilter));
        }

        // Popula filtro de vendedores (somente ADMIN)
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

        // Ordena por data (mais recente primeiro)
        sales.sort((a, b) => new Date(b.data_venda) - new Date(a.data_venda));

        // Resumo
        const totalVendas = sales.reduce((sum, s) => sum + (parseFloat(s.valor_venda) || 0), 0);
        const totalLucro  = sales.reduce((sum, s) => sum + (parseFloat(s.lucro) || 0), 0);
        const summaryEl = document.getElementById('sales-summary');
        if (summaryEl) {
            summaryEl.innerHTML = `
                <span>Total: <strong>${Calculator.formatCurrency(totalVendas)}</strong></span>
                <span>Lucro: <strong class="${totalLucro >= 0 ? 'text-success' : 'text-danger'}">${Calculator.formatCurrency(totalLucro)}</strong></span>
                <span>Registros: <strong>${sales.length}</strong></span>
            `;
        }

        // Tabela
        const tbody = document.getElementById('sales-body');
        if (!tbody) return;

        if (sales.length === 0) {
            tbody.innerHTML = `
                <tr>
                    <td colspan="6" class="text-center text-muted" style="padding: 2.5rem;">
                        <div class="empty-state">
                            <div class="empty-icon"><i data-lucide="wallet"></i></div>
                            <p>Nenhuma venda encontrada.</p>
                        </div>
                    </td>
                </tr>`;
            return;
        }

        tbody.innerHTML = sales.map(s => {
            const product  = products.find(p => p.id === s.product_id);
            const vendedor = users.find(u => u.id === s.vendedor_id);
            const lucroClass = (parseFloat(s.lucro) || 0) >= 0 ? 'text-success' : 'text-danger';

            return `<tr>
                <td>${Dashboard.formatDate(s.data_venda)}</td>
                <td><strong>${escapeHtml(product ? product.nome : 'Removido')}</strong></td>
                <td>${escapeHtml(s.cliente || '—')}</td>
                <td>${Calculator.formatCurrency(s.valor_venda)}</td>
                <td class="${lucroClass}">${Calculator.formatCurrency(s.lucro)}</td>
                <td>${escapeHtml(vendedor ? vendedor.nome : '—')}</td>
            </tr>`;
        }).join('');
    }

    // ------------------------------------------
    // Modal de nova venda
    // ------------------------------------------
    function openSaleModal() {
        const products = Storage.getSheet('PRODUCTS');

        if (products.length === 0) {
            showToast('Cadastre um produto antes de registrar vendas.', 'warning');
            return;
        }

        const options = products.map(p =>
            `<option value="${p.id}"
                     data-preco="${p.preco_venda}"
                     data-custo="${p.custo_total}">
                ${escapeHtml(p.nome)} — ${Calculator.formatCurrency(p.preco_venda)}
            </option>`
        ).join('');

        const now = new Date();
        const defaultDate = now.toISOString().slice(0, 16);

        const html = `
            <form id="sale-form" onsubmit="event.preventDefault(); App.saveSale();">
                <div class="form-group">
                    <label>Produto</label>
                    <select id="sale-product" required onchange="App.calcSalePreview()">
                        <option value="">— Selecione um produto —</option>
                        ${options}
                    </select>
                </div>
                <div class="form-group">
                    <label>Nome do Cliente</label>
                    <input type="text" id="sale-cliente" placeholder="Nome do cliente (opcional)">
                </div>
                <div class="form-row">
                    <div class="form-group">
                        <label>Desconto (%)</label>
                        <input type="number" id="sale-desconto"
                               value="0" min="0" max="100" step="0.5"
                               oninput="App.calcSalePreview()">
                        <small>Desconto sobre o preço de venda</small>
                    </div>
                    <div class="form-group">
                        <label>Data da Venda</label>
                        <input type="datetime-local" id="sale-data" value="${defaultDate}">
                    </div>
                </div>

                <div id="sale-preview" class="calc-preview" style="display:none;">
                    <h4><i data-lucide="receipt"></i> Resumo da Venda</h4>
                    <div class="calc-grid">
                        <div class="calc-item">
                            <span>Preço Original</span>
                            <span id="sale-preco-original">—</span>
                        </div>
                        <div class="calc-item">
                            <span>Desconto</span>
                            <span id="sale-desconto-valor" class="text-warning">—</span>
                        </div>
                        <div class="calc-item total">
                            <span>Valor Final</span>
                            <span id="sale-valor-final">—</span>
                        </div>
                        <div class="calc-item success">
                            <span>Lucro</span>
                            <span id="sale-lucro">—</span>
                        </div>
                    </div>
                </div>

                <div class="form-actions">
                    <button type="button" class="btn btn-secondary" onclick="App.closeModal()">Cancelar</button>
                    <button type="submit" class="btn btn-primary"><i data-lucide="check"></i> Registrar Venda</button>
                </div>
            </form>
        `;

        openModal('Nova Venda', html);
    }

    // ------------------------------------------
    // Preview em tempo real da venda
    // ------------------------------------------
    function calcSalePreview() {
        const select = document.getElementById('sale-product');
        const option = select.options[select.selectedIndex];

        if (!option || !option.value) {
            document.getElementById('sale-preview').style.display = 'none';
            return;
        }

        const preco    = parseFloat(option.dataset.preco) || 0;
        const custo    = parseFloat(option.dataset.custo) || 0;
        const desconto = parseFloat(document.getElementById('sale-desconto').value) || 0;

        const descontoValor = preco * (desconto / 100);
        const valorFinal    = preco - descontoValor;
        const lucro         = valorFinal - custo;

        document.getElementById('sale-preview').style.display = 'block';
        document.getElementById('sale-preco-original').textContent = Calculator.formatCurrency(preco);
        document.getElementById('sale-desconto-valor').textContent = `- ${Calculator.formatCurrency(descontoValor)}`;
        document.getElementById('sale-valor-final').textContent    = Calculator.formatCurrency(valorFinal);

        const lucroEl = document.getElementById('sale-lucro');
        lucroEl.textContent = Calculator.formatCurrency(lucro);
        lucroEl.className = lucro >= 0 ? 'text-success' : 'text-danger';
    }

    // ------------------------------------------
    // Salva a venda
    // ------------------------------------------
    function saveSale() {
        const select = document.getElementById('sale-product');
        const option = select.options[select.selectedIndex];

        if (!option || !option.value) {
            showToast('Selecione um produto.', 'warning');
            return;
        }

        const productId  = parseInt(option.value);
        const preco      = parseFloat(option.dataset.preco) || 0;
        const custo      = parseFloat(option.dataset.custo) || 0;
        const desconto   = parseFloat(document.getElementById('sale-desconto').value) || 0;
        const cliente    = document.getElementById('sale-cliente').value.trim();
        const dataVenda  = document.getElementById('sale-data').value;

        const valorVenda = Calculator.round2(preco * (1 - desconto / 100));
        const lucro      = Calculator.round2(valorVenda - custo);

        const user = Auth.getCurrentUser();

        Storage.addRow('SALES', {
            product_id: productId,
            vendedor_id: user.id,
            cliente: cliente || '',
            valor_venda: valorVenda,
            lucro: lucro,
            data_venda: dataVenda || new Date().toISOString()
        });

        showToast('Venda registrada com sucesso!', 'success');
        closeModal();
        renderSales();
    }

    function filterSales() {
        renderSales();
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
    }

    function saveSettings() {
        if (!Auth.isAdmin()) return;

        const settings = [{
            margem_padrao:         parseFloat(document.getElementById('cfg-margem').value)     || 0,
            custo_kg:              parseFloat(document.getElementById('cfg-custo-kg').value)   || 0,
            custo_hora_maquina:    parseFloat(document.getElementById('cfg-custo-hora').value) || 0,
            custo_kwh:             parseFloat(document.getElementById('cfg-custo-kwh').value)  || 0,
            consumo_maquina_w:     parseFloat(document.getElementById('cfg-consumo-w').value)  || 350,
            percentual_falha:      parseFloat(document.getElementById('cfg-falha').value)      || 0,
            depreciacao_percentual:parseFloat(document.getElementById('cfg-depreciacao').value) || 0
        }];

        Storage.setSheet('SETTINGS', settings);

        // Recalcula todos os produtos com novos parâmetros
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
                    <button class="btn btn-sm btn-icon" onclick="App.openUserModal(${u.id})" title="Editar">✏️</button>
                    <button class="btn btn-sm btn-icon btn-danger-ghost" onclick="App.deleteUser(${u.id})" title="Excluir">🗑️</button>
                </td>
            </tr>`;
        }).join('');
    }

    // ------------------------------------------
    // Modal de usuário (novo ou edição)
    // ------------------------------------------
    function openUserModal(id) {
        editingUserId = id || null;
        const user = id ? Storage.getRowById('USERS', id) : null;
        const title = user ? 'Editar Usuário' : 'Novo Usuário';

        const html = `
            <form id="user-form" onsubmit="event.preventDefault(); App.saveUser();">
                <div class="form-group">
                    <label>Nome Completo</label>
                    <input type="text" id="user-nome"
                           value="${user ? escapeHtml(user.nome) : ''}"
                           required placeholder="Nome do usuário">
                </div>
                <div class="form-group">
                    <label>Email</label>
                    <input type="email" id="user-email"
                           value="${user ? escapeHtml(user.email) : ''}"
                           required placeholder="email@exemplo.com">
                </div>
                <div class="form-group">
                    <label>Senha ${user ? '<small>(deixe vazio para manter a atual)</small>' : ''}</label>
                    <input type="password" id="user-senha"
                           ${user ? '' : 'required'}
                           placeholder="${user ? 'Manter senha atual' : 'Digite a senha'}">
                </div>
                <div class="form-group">
                    <label>Tipo de Acesso</label>
                    <select id="user-tipo" required>
                        <option value="ADMIN" ${user && user.tipo === 'ADMIN' ? 'selected' : ''}>
                            Administrador
                        </option>
                        <option value="VENDEDOR" ${!user || user.tipo === 'VENDEDOR' ? 'selected' : ''}>
                            Vendedor
                        </option>
                    </select>
                </div>
                <div class="form-actions">
                    <button type="button" class="btn btn-secondary" onclick="App.closeModal()">Cancelar</button>
                    <button type="submit" class="btn btn-primary">
                        <i data-lucide="save"></i> ${user ? 'Atualizar' : 'Criar Usuário'}
                    </button>
                </div>
            </form>
        `;

        openModal(title, html);

        // Ao editar, selecionar tipo correto (fix para "ADMIN" não pré-selecionado)
        if (user) {
            setTimeout(() => {
                document.getElementById('user-tipo').value = user.tipo;
            }, 10);
        }
    }

    // ------------------------------------------
    // Salva usuário
    // ------------------------------------------
    function saveUser() {
        const nome  = document.getElementById('user-nome').value.trim();
        const email = document.getElementById('user-email').value.trim();
        const senha = document.getElementById('user-senha').value;
        const tipo  = document.getElementById('user-tipo').value;

        if (!nome || !email) {
            showToast('Preencha nome e email.', 'warning');
            return;
        }

        if (!editingUserId && !senha) {
            showToast('Senha é obrigatória para novos usuários.', 'warning');
            return;
        }

        // Verifica email duplicado
        const users = Storage.getSheet('USERS');
        const duplicate = users.find(u =>
            u.email.toLowerCase() === email.toLowerCase() && u.id !== editingUserId
        );
        if (duplicate) {
            showToast('Este email já está em uso.', 'danger');
            return;
        }

        const data = { nome, email, tipo };

        if (senha) {
            data.senha_hash = sha256(senha);
        }

        if (editingUserId) {
            Storage.updateRow('USERS', editingUserId, data);
            showToast('Usuário atualizado!', 'success');
        } else {
            Storage.addRow('USERS', data);
            showToast('Usuário criado com sucesso!', 'success');
        }

        closeModal();
        renderUsers();
    }

    // ------------------------------------------
    // Exclui usuário com proteções
    // ------------------------------------------
    function deleteUser(id) {
        const users = Storage.getSheet('USERS');
        const user = users.find(u => u.id === id);
        if (!user) return;

        // Protege último admin
        const adminCount = users.filter(u => u.tipo === 'ADMIN').length;
        if (user.tipo === 'ADMIN' && adminCount <= 1) {
            showToast('Não é possível excluir o último administrador.', 'danger');
            return;
        }

        // Protege auto-exclusão
        const currentUser = Auth.getCurrentUser();
        if (id === currentUser.id) {
            showToast('Você não pode excluir sua própria conta.', 'danger');
            return;
        }

        if (!confirm(`Excluir o usuário "${user.nome}"?\nEsta ação não pode ser desfeita.`)) return;

        Storage.deleteRow('USERS', id);
        showToast('Usuário excluído.', 'success');
        renderUsers();
    }

    // ==========================================
    //  CALCULADORA AVANÇADA
    // ==========================================

    // ------------------------------------------
    // Carrega valores das configurações nos inputs
    // ------------------------------------------
    function renderCalculator() {
        const s = Calculator.getSettings();

        // Sincroniza custos variáveis com configurações
        setInputVal('adv-custo-kg', s.custo_kg);
        setInputVal('adv-custo-kwh', s.custo_kwh);
        setInputVal('adv-consumo-w', s.consumo_maquina_w || 350);
        setInputVal('adv-custo-hora', s.custo_hora_maquina);
        setInputVal('adv-depreciacao', (s.depreciacao_percentual || 0) * 100);
        setInputVal('adv-falhas', (s.percentual_falha || 0) * 100);
        setInputVal('adv-margem', (s.margem_padrao || 0) * 100);

        // Dispara cálculo se já houver dados preenchidos
        calcAdvanced();
    }

    // ------------------------------------------
    // Motor de cálculo avançado completo
    // Atualiza automaticamente a cada input
    // ------------------------------------------
    function calcAdvanced() {
        // === LEITURA DOS INPUTS ===
        const comprimento_m = Math.max(0, parseFloat(document.getElementById('adv-comprimento')?.value) || 0);
        const diametro_mm   = Math.max(0, parseFloat(document.getElementById('adv-diametro')?.value) || 0);
        const densidade     = Math.max(0, parseFloat(document.getElementById('adv-densidade')?.value) || 0);
        const tempo_min     = Math.max(0, parseFloat(document.getElementById('adv-tempo-min')?.value) || 0);

        const custo_kg      = Math.max(0, parseFloat(document.getElementById('adv-custo-kg')?.value) || 0);
        const custo_kwh     = Math.max(0, parseFloat(document.getElementById('adv-custo-kwh')?.value) || 0);
        const consumo_w     = Math.max(0, parseFloat(document.getElementById('adv-consumo-w')?.value) || 0);
        const custo_hora_maq= Math.max(0, parseFloat(document.getElementById('adv-custo-hora')?.value) || 0);
        const depreciacao_pc= Math.max(0, parseFloat(document.getElementById('adv-depreciacao')?.value) || 0) / 100;
        const falhas_pc     = Math.max(0, parseFloat(document.getElementById('adv-falhas')?.value) || 0) / 100;

        const modelagem     = Math.max(0, parseFloat(document.getElementById('adv-modelagem')?.value) || 0);
        const acabamento_pc = Math.max(0, parseFloat(document.getElementById('adv-acabamento')?.value) || 0) / 100;
        const fixacao       = Math.max(0, parseFloat(document.getElementById('adv-fixacao')?.value) || 0);
        const outros        = Math.max(0, parseFloat(document.getElementById('adv-outros')?.value) || 0);

        const margem_pc     = Math.max(0, parseFloat(document.getElementById('adv-margem')?.value) || 0) / 100;

        // === 1. CÁLCULOS FÍSICOS ===
        //   Raio em mm
        const raio_mm = diametro_mm / 2;
        //   Área da seção circular em mm²: A = π × r²
        const area_mm2 = Math.PI * raio_mm * raio_mm;
        //   Converter mm² para cm²: 1 cm² = 100 mm²
        const area_cm2 = area_mm2 / 100;
        //   Comprimento em cm (1 m = 100 cm)
        const comprimento_cm = comprimento_m * 100;
        //   Volume em cm³: Área(cm²) × Comprimento(cm)
        const volume_cm3 = area_cm2 * comprimento_cm;
        //   Peso em gramas: Volume(cm³) × Densidade(g/cm³)
        const peso_g = volume_cm3 * densidade;
        //   Tempo em horas
        const tempo_h = tempo_min / 60;

        // Atualiza passos intermediários
        setText('step-raio', raio_mm > 0 ? raio_mm.toFixed(3) + ' mm' : '—');
        setText('step-area', area_mm2 > 0
            ? area_mm2.toFixed(4) + ' mm² = ' + area_cm2.toFixed(6) + ' cm²' : '—');
        setText('step-volume', volume_cm3 > 0 ? volume_cm3.toFixed(4) + ' cm³' : '—');
        setText('step-peso', peso_g > 0 ? peso_g.toFixed(2) + ' g' : '—');
        setText('step-tempo-h', tempo_min > 0
            ? tempo_min + ' min = ' + tempo_h.toFixed(3) + ' h' : '—');

        // === 2. CUSTOS VARIÁVEIS ===
        //   Material: (peso_g / 1000) × custo_kg
        const custoMaterial = (peso_g / 1000) * custo_kg;

        //   Energia: (consumo_W / 1000) × tempo_h × custo_kwh
        const energia_kwh = (consumo_w / 1000) * tempo_h;
        const custoEnergia = energia_kwh * custo_kwh;

        //   Depreciação: custo_hora_maquina × tempo_h × percentual
        //   (baseada no custo/hora real da máquina)
        const custoDepreciacao = custo_hora_maq * tempo_h * depreciacao_pc;

        //   Subtotal antes de falhas
        const subtotal = custoMaterial + custoEnergia + custoDepreciacao;

        //   Falhas: subtotal × percentual
        const custoFalhas = subtotal * falhas_pc;

        // Atualiza passos de custo
        setText('step-custo-material', fmtC(custoMaterial));
        setText('step-energia-kwh', energia_kwh > 0 ? energia_kwh.toFixed(4) + ' kWh' : '—');
        setText('step-custo-energia', fmtC(custoEnergia));
        setText('step-custo-depreciacao', fmtC(custoDepreciacao));
        setText('step-subtotal', fmtC(subtotal));
        setText('step-custo-falhas', fmtC(custoFalhas));

        // === 3. CUSTOS ADICIONAIS ===
        const custoBase = subtotal + custoFalhas;
        const custoAcabamento = custoBase * acabamento_pc;
        const totalAdicionais = modelagem + custoAcabamento + fixacao + outros;

        // === 4. RESULTADO FINAL ===
        const custoProducao = custoBase + totalAdicionais;
        const precoVenda = custoProducao * (1 + margem_pc);
        const lucro = precoVenda - custoProducao;
        const margemReal = precoVenda > 0
            ? ((precoVenda - custoProducao) / precoVenda) * 100
            : 0;

        // Atualiza resultado
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

        // Alerta de margem baixa
        const alertEl = document.getElementById('margin-alert');
        if (alertEl) {
            if (custoProducao > 0 && margemReal < 20) {
                alertEl.classList.remove('hidden');
            } else {
                alertEl.classList.add('hidden');
            }
        }

        // Armazena no estado para uso ao salvar
        calcAdvanced._lastResult = {
            peso_g: Calculator.round2(peso_g),
            tempo_h: Calculator.round2(tempo_h),
            custoTotal: Calculator.round2(custoProducao),
            precoVenda: Calculator.round2(precoVenda)
        };
    }

    // ------------------------------------------
    // Limpar todos os campos da calculadora
    // ------------------------------------------
    function calcResetForm() {
        const ids = [
            'adv-comprimento', 'adv-tempo-min',
            'adv-modelagem', 'adv-acabamento', 'adv-fixacao', 'adv-outros',
            'adv-nome-produto'
        ];
        ids.forEach(id => {
            const el = document.getElementById(id);
            if (el) el.value = el.type === 'number' ? '0' : '';
        });

        // Volta valores padrão de filamento
        setInputVal('adv-diametro', 1.75);
        setInputVal('adv-densidade', 1.24);
        setInputVal('adv-comprimento', '');
        setInputVal('adv-tempo-min', '');

        // Re-sincroniza custos com configurações
        renderCalculator();
        showToast('Formulário limpo.', 'info');
    }

    // ------------------------------------------
    // Salva resultado da calculadora como produto
    // ------------------------------------------
    function calcSaveAsProduct() {
        const nome = document.getElementById('adv-nome-produto')?.value.trim();
        const result = calcAdvanced._lastResult;

        if (!nome) {
            showToast('Informe o nome do produto antes de salvar.', 'warning');
            document.getElementById('adv-nome-produto')?.focus();
            return;
        }

        if (!result || result.peso_g <= 0 || result.tempo_h <= 0) {
            showToast('Preencha os dados físicos da peça para calcular.', 'warning');
            return;
        }

        Storage.addRow('PRODUCTS', {
            nome: nome,
            peso_g: result.peso_g,
            tempo_h: result.tempo_h,
            custo_total: result.custoTotal,
            preco_venda: result.precoVenda,
            created_at: new Date().toISOString()
        });

        showToast(`Produto "${nome}" salvo no catálogo!`, 'success');
        document.getElementById('adv-nome-produto').value = '';
    }

    // Auxiliares de exibição
    function setText(id, val) {
        const el = document.getElementById(id);
        if (el) el.textContent = val;
    }
    function fmtC(val) {
        return Calculator.formatCurrency(val);
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

        toast.innerHTML = `
            <span class="toast-icon">${icons[type] || '<i data-lucide="info"></i>'}</span>
            <span>${escapeHtml(message)}</span>
        `;

        container.appendChild(toast);

        // Inicializa ícones Lucide no toast
        if (typeof lucide !== 'undefined') lucide.createIcons();

        // Anima entrada
        requestAnimationFrame(() => toast.classList.add('show'));

        // Remove após 3.5 segundos
        setTimeout(() => {
            toast.classList.remove('show');
            setTimeout(() => toast.remove(), 350);
        }, 3500);
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

    // ==========================================
    //  API PÚBLICA
    // ==========================================
    return {
        init,
        navigate,
        // Produtos
        openProductModal,
        calcProductPreview,
        saveProduct,
        deleteProduct,
        // Vendas
        openSaleModal,
        calcSalePreview,
        saveSale,
        filterSales,
        // Calculadora Avançada
        calcAdvanced,
        calcResetForm,
        calcSaveAsProduct,
        // Configurações
        saveSettings,
        // Usuários
        openUserModal,
        saveUser,
        deleteUser,
        // UI
        closeModal,
        showToast
    };
})();

// Inicializa quando o DOM estiver pronto
document.addEventListener('DOMContentLoaded', App.init);
