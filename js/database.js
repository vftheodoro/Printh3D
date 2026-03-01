// ============================================
// PRINTH3D PRO — Módulo de Banco de Dados (IndexedDB)
// Persistência robusta com suporte a arquivos binários
// ============================================

const Database = (() => {
    const DB_NAME = 'printh3d_pro';
    const DB_VERSION = 1;
    let db = null;

    const STORES = {
        USERS: 'users',
        SETTINGS: 'settings',
        CATEGORIES: 'categories',
        PRODUCTS: 'products',
        PRODUCT_FILES: 'product_files',
        PROMOTIONS: 'promotions',
        COUPONS: 'coupons',
        SALES: 'sales'
    };

    // ------------------------------------------
    // Inicializa IndexedDB e cria object stores
    // ------------------------------------------
    function init() {
        return new Promise((resolve, reject) => {
            const request = indexedDB.open(DB_NAME, DB_VERSION);

            request.onupgradeneeded = (e) => {
                const database = e.target.result;

                // Users
                if (!database.objectStoreNames.contains(STORES.USERS)) {
                    const store = database.createObjectStore(STORES.USERS, { keyPath: 'id', autoIncrement: true });
                    store.createIndex('email', 'email', { unique: true });
                    store.createIndex('tipo', 'tipo', { unique: false });
                }

                // Settings
                if (!database.objectStoreNames.contains(STORES.SETTINGS)) {
                    database.createObjectStore(STORES.SETTINGS, { keyPath: 'id' });
                }

                // Categories
                if (!database.objectStoreNames.contains(STORES.CATEGORIES)) {
                    const store = database.createObjectStore(STORES.CATEGORIES, { keyPath: 'id', autoIncrement: true });
                    store.createIndex('nome', 'nome', { unique: true });
                    store.createIndex('prefixo', 'prefixo', { unique: true });
                }

                // Products
                if (!database.objectStoreNames.contains(STORES.PRODUCTS)) {
                    const store = database.createObjectStore(STORES.PRODUCTS, { keyPath: 'id', autoIncrement: true });
                    store.createIndex('category_id', 'category_id', { unique: false });
                    store.createIndex('codigo_sku', 'codigo_sku', { unique: true });
                    store.createIndex('nome', 'nome', { unique: false });
                    store.createIndex('ativo', 'ativo', { unique: false });
                }

                // Product Files (images, STLs, documents)
                if (!database.objectStoreNames.contains(STORES.PRODUCT_FILES)) {
                    const store = database.createObjectStore(STORES.PRODUCT_FILES, { keyPath: 'id', autoIncrement: true });
                    store.createIndex('product_id', 'product_id', { unique: false });
                    store.createIndex('tipo', 'tipo', { unique: false });
                }

                // Promotions
                if (!database.objectStoreNames.contains(STORES.PROMOTIONS)) {
                    const store = database.createObjectStore(STORES.PROMOTIONS, { keyPath: 'id', autoIncrement: true });
                    store.createIndex('product_id', 'product_id', { unique: false });
                    store.createIndex('ativo', 'ativo', { unique: false });
                }

                // Coupons
                if (!database.objectStoreNames.contains(STORES.COUPONS)) {
                    const store = database.createObjectStore(STORES.COUPONS, { keyPath: 'id', autoIncrement: true });
                    store.createIndex('codigo', 'codigo', { unique: true });
                    store.createIndex('ativo', 'ativo', { unique: false });
                }

                // Sales
                if (!database.objectStoreNames.contains(STORES.SALES)) {
                    const store = database.createObjectStore(STORES.SALES, { keyPath: 'id', autoIncrement: true });
                    store.createIndex('product_id', 'product_id', { unique: false });
                    store.createIndex('vendedor_id', 'vendedor_id', { unique: false });
                    store.createIndex('data_venda', 'data_venda', { unique: false });
                }
            };

            request.onsuccess = (e) => {
                db = e.target.result;
                console.log('[Database] IndexedDB inicializado.');
                resolve(db);
            };

            request.onerror = (e) => {
                console.error('[Database] Erro ao abrir IndexedDB:', e.target.error);
                reject(e.target.error);
            };
        });
    }

    // ------------------------------------------
    // Verifica se o DB tem dados; se não, semeia
    // ------------------------------------------
    async function seedIfEmpty() {
        const users = await getAll(STORES.USERS);
        if (users.length === 0) {
            // Migrar do localStorage se houver dados
            const migrated = await migrateFromLocalStorage();
            if (!migrated) {
                await seedDefaults();
            }
        }
    }

    // ------------------------------------------
    // Migra dados do localStorage antigo
    // ------------------------------------------
    async function migrateFromLocalStorage() {
        const raw = localStorage.getItem('printh3d_database');
        if (!raw) return false;

        try {
            const data = JSON.parse(raw);
            console.log('[Database] Migrando dados do localStorage...');

            // Users
            if (data.USERS && data.USERS.length > 0) {
                for (const user of data.USERS) {
                    await add(STORES.USERS, user);
                }
            }

            // Settings
            if (data.SETTINGS && data.SETTINGS.length > 0) {
                await put(STORES.SETTINGS, { id: 1, ...data.SETTINGS[0] });
            }

            // Products → converter para novo schema
            if (data.PRODUCTS && data.PRODUCTS.length > 0) {
                // Criar categoria padrão "Geral"
                const catGeral = await add(STORES.CATEGORIES, {
                    nome: 'Geral',
                    prefixo: 'GER',
                    cor: '#00BCFF',
                    descricao: 'Categoria padrão para produtos migrados',
                    icone: 'package',
                    created_at: new Date().toISOString()
                });

                let seq = 1;
                for (const p of data.PRODUCTS) {
                    const sku = 'GER-' + String(seq).padStart(3, '0');
                    await add(STORES.PRODUCTS, {
                        codigo_sku: sku,
                        category_id: catGeral.id || catGeral,
                        nome: p.nome,
                        descricao: '',
                        peso_g: p.peso_g,
                        tempo_h: p.tempo_h,
                        dimensoes: { largura: 0, altura: 0, profundidade: 0 },
                        material: 'PLA',
                        cor: '',
                        resolucao_camada: 0.2,
                        custo_total: p.custo_total,
                        preco_venda: p.preco_venda,
                        preco_promocional: null,
                        margem: null,
                        quantidade_estoque: 0,
                        estoque_minimo: 0,
                        tags: [],
                        descricoes_social: {
                            instagram: '', facebook: '', whatsapp: '', tiktok: '', geral: ''
                        },
                        ativo: true,
                        created_at: p.created_at || new Date().toISOString(),
                        updated_at: new Date().toISOString()
                    });
                    seq++;
                }
            }

            // Sales
            if (data.SALES && data.SALES.length > 0) {
                for (const s of data.SALES) {
                    await add(STORES.SALES, {
                        product_id: s.product_id,
                        vendedor_id: s.vendedor_id,
                        cliente: s.cliente || '',
                        valor_venda: s.valor_venda,
                        lucro: s.lucro,
                        desconto_percentual: 0,
                        cupom_id: null,
                        data_venda: s.data_venda
                    });
                }
            }

            console.log('[Database] Migração concluída.');
            return true;
        } catch (err) {
            console.error('[Database] Erro na migração:', err);
            return false;
        }
    }

    // ------------------------------------------
    // Dados padrão para primeiro uso
    // ------------------------------------------
    async function seedDefaults() {
        console.log('[Database] Semeando dados padrão...');

        // Admin user
        await add(STORES.USERS, {
            id: 1,
            nome: 'Administrador',
            email: 'admin@printh3d.com',
            senha_hash: sha256('admin123'),
            tipo: 'ADMIN'
        });

        // Settings
        await put(STORES.SETTINGS, {
            id: 1,
            margem_padrao: 0.50,
            custo_kg: 120.00,
            custo_hora_maquina: 5.00,
            custo_kwh: 0.85,
            consumo_maquina_w: 350,
            percentual_falha: 0.05,
            depreciacao_percentual: 0.10
        });

        // Default categories
        await add(STORES.CATEGORIES, {
            nome: 'Chaveiros',
            prefixo: 'CHAV',
            cor: '#00BCFF',
            descricao: 'Chaveiros personalizados em 3D',
            icone: 'key-round',
            created_at: new Date().toISOString()
        });

        await add(STORES.CATEGORIES, {
            nome: 'Miniaturas',
            prefixo: 'MINI',
            cor: '#34d399',
            descricao: 'Miniaturas e figuras decorativas',
            icone: 'bot',
            created_at: new Date().toISOString()
        });

        await add(STORES.CATEGORIES, {
            nome: 'Vasos',
            prefixo: 'VASO',
            cor: '#fbbf24',
            descricao: 'Vasos decorativos e funcionais',
            icone: 'flower-2',
            created_at: new Date().toISOString()
        });

        await add(STORES.CATEGORIES, {
            nome: 'Utilitários',
            prefixo: 'UTIL',
            cor: '#a78bfa',
            descricao: 'Produtos funcionais e utilitários',
            icone: 'wrench',
            created_at: new Date().toISOString()
        });

        console.log('[Database] Dados padrão inseridos.');
    }

    // ------------------------------------------
    // CRUD GENÉRICO
    // ------------------------------------------

    function getTransaction(storeName, mode = 'readonly') {
        const tx = db.transaction(storeName, mode);
        return tx.objectStore(storeName);
    }

    function add(storeName, data) {
        return new Promise((resolve, reject) => {
            const store = getTransaction(storeName, 'readwrite');
            const request = store.add(data);
            request.onsuccess = () => {
                data.id = request.result;
                resolve(data);
            };
            request.onerror = (e) => reject(e.target.error);
        });
    }

    function put(storeName, data) {
        return new Promise((resolve, reject) => {
            const store = getTransaction(storeName, 'readwrite');
            const request = store.put(data);
            request.onsuccess = () => resolve(data);
            request.onerror = (e) => reject(e.target.error);
        });
    }

    function getById(storeName, id) {
        return new Promise((resolve, reject) => {
            const store = getTransaction(storeName);
            const request = store.get(id);
            request.onsuccess = () => resolve(request.result || null);
            request.onerror = (e) => reject(e.target.error);
        });
    }

    function getAll(storeName) {
        return new Promise((resolve, reject) => {
            const store = getTransaction(storeName);
            const request = store.getAll();
            request.onsuccess = () => resolve(request.result || []);
            request.onerror = (e) => reject(e.target.error);
        });
    }

    function deleteById(storeName, id) {
        return new Promise((resolve, reject) => {
            const store = getTransaction(storeName, 'readwrite');
            const request = store.delete(id);
            request.onsuccess = () => resolve(true);
            request.onerror = (e) => reject(e.target.error);
        });
    }

    function getByIndex(storeName, indexName, value) {
        return new Promise((resolve, reject) => {
            const store = getTransaction(storeName);
            const index = store.index(indexName);
            const request = index.getAll(value);
            request.onsuccess = () => resolve(request.result || []);
            request.onerror = (e) => reject(e.target.error);
        });
    }

    function clearStore(storeName) {
        return new Promise((resolve, reject) => {
            const store = getTransaction(storeName, 'readwrite');
            const request = store.clear();
            request.onsuccess = () => resolve();
            request.onerror = (e) => reject(e.target.error);
        });
    }

    function update(storeName, id, newData) {
        return new Promise(async (resolve, reject) => {
            try {
                const existing = await getById(storeName, id);
                if (!existing) {
                    reject(new Error('Registro não encontrado'));
                    return;
                }
                const merged = { ...existing, ...newData, id };
                await put(storeName, merged);
                resolve(merged);
            } catch (err) {
                reject(err);
            }
        });
    }

    // ------------------------------------------
    // CONSULTAS ESPECIALIZADAS
    // ------------------------------------------

    async function getNextSKU(categoryId) {
        const category = await getById(STORES.CATEGORIES, categoryId);
        if (!category) return 'PROD-001';

        const products = await getByIndex(STORES.PRODUCTS, 'category_id', categoryId);
        const prefix = category.prefixo;

        let maxNum = 0;
        products.forEach(p => {
            if (p.codigo_sku && p.codigo_sku.startsWith(prefix + '-')) {
                const num = parseInt(p.codigo_sku.split('-')[1]);
                if (!isNaN(num) && num > maxNum) maxNum = num;
            }
        });

        return prefix + '-' + String(maxNum + 1).padStart(3, '0');
    }

    async function isSkuUnique(sku, excludeId = null) {
        const products = await getAll(STORES.PRODUCTS);
        return !products.some(p => p.codigo_sku === sku && p.id !== excludeId);
    }

    async function searchProducts(query, filters = {}) {
        let products = await getAll(STORES.PRODUCTS);
        const categories = await getAll(STORES.CATEGORIES);
        const promotions = await getAll(STORES.PROMOTIONS);

        // Text search
        if (query && query.trim()) {
            const q = query.toLowerCase().trim();
            products = products.filter(p => {
                return (p.nome && p.nome.toLowerCase().includes(q)) ||
                       (p.codigo_sku && p.codigo_sku.toLowerCase().includes(q)) ||
                       (p.descricao && p.descricao.toLowerCase().includes(q)) ||
                       (p.tags && p.tags.some(t => t.toLowerCase().includes(q))) ||
                       (p.material && p.material.toLowerCase().includes(q));
            });
        }

        // Category filter
        if (filters.category_id) {
            products = products.filter(p => p.category_id === filters.category_id);
        }

        // Status filter
        if (filters.status === 'ativo') {
            products = products.filter(p => p.ativo === true);
        } else if (filters.status === 'inativo') {
            products = products.filter(p => p.ativo === false);
        } else if (filters.status === 'promocao') {
            const now = new Date().toISOString();
            const activePromos = promotions.filter(pr =>
                pr.ativo && (!pr.data_fim || pr.data_fim >= now)
            );
            const promoProductIds = new Set(activePromos.map(pr => pr.product_id));
            products = products.filter(p => promoProductIds.has(p.id));
        } else if (filters.status === 'estoque_baixo') {
            products = products.filter(p => p.estoque_minimo > 0 && p.quantidade_estoque <= p.estoque_minimo);
        }

        // Sort
        if (filters.sort) {
            const dir = filters.sortDir === 'desc' ? -1 : 1;
            products.sort((a, b) => {
                let va = a[filters.sort];
                let vb = b[filters.sort];
                if (typeof va === 'string') va = va.toLowerCase();
                if (typeof vb === 'string') vb = vb.toLowerCase();
                if (va < vb) return -1 * dir;
                if (va > vb) return 1 * dir;
                return 0;
            });
        }

        // Enrich with category name
        return products.map(p => {
            const cat = categories.find(c => c.id === p.category_id);
            return { ...p, _category_nome: cat ? cat.nome : 'Sem Categoria', _category_cor: cat ? cat.cor : '#666' };
        });
    }

    async function getActivePromotion(productId) {
        const promos = await getByIndex(STORES.PROMOTIONS, 'product_id', productId);
        const now = new Date().toISOString();
        return promos.find(pr =>
            pr.ativo &&
            (!pr.data_inicio || pr.data_inicio <= now) &&
            (!pr.data_fim || pr.data_fim >= now)
        ) || null;
    }

    async function getProductFiles(productId) {
        return await getByIndex(STORES.PRODUCT_FILES, 'product_id', productId);
    }

    async function addProductFile(productId, file) {
        const arrayBuffer = await file.arrayBuffer();
        const fileData = {
            product_id: productId,
            nome_arquivo: file.name,
            tipo: getFileType(file.name),
            mime_type: file.type,
            blob: arrayBuffer,
            tamanho_bytes: file.size,
            created_at: new Date().toISOString()
        };
        return await add(STORES.PRODUCT_FILES, fileData);
    }

    function getFileType(filename) {
        const ext = filename.toLowerCase().split('.').pop();
        if (['jpg', 'jpeg', 'png', 'webp', 'gif', 'bmp'].includes(ext)) return 'image';
        if (['stl', 'obj', '3mf', 'step', 'stp'].includes(ext)) return 'model3d';
        if (['pdf', 'doc', 'docx', 'txt'].includes(ext)) return 'document';
        return 'other';
    }

    // ------------------------------------------
    // EXPORTAÇÃO — ZIP por produto
    // ------------------------------------------
    async function exportProductZip(productId) {
        const product = await getById(STORES.PRODUCTS, productId);
        if (!product) throw new Error('Produto não encontrado');

        const category = product.category_id ? await getById(STORES.CATEGORIES, product.category_id) : null;
        const files = await getProductFiles(productId);
        const promo = await getActivePromotion(productId);

        const zip = new JSZip();
        const folderName = `${product.codigo_sku}_${product.nome.replace(/[^a-zA-Z0-9À-ÿ ]/g, '')}`;
        const folder = zip.folder(folderName);

        // info.txt
        let info = `=== PRINTH3D PRO — Ficha do Produto ===\n\n`;
        info += `SKU: ${product.codigo_sku}\n`;
        info += `Nome: ${product.nome}\n`;
        info += `Categoria: ${category ? category.nome : 'Sem Categoria'}\n`;
        info += `Descrição: ${product.descricao || ''}\n`;
        info += `Material: ${product.material || ''}\n`;
        info += `Cor: ${product.cor || ''}\n`;
        info += `Peso: ${product.peso_g}g\n`;
        info += `Tempo de impressão: ${product.tempo_h}h\n`;
        if (product.dimensoes) {
            info += `Dimensões: ${product.dimensoes.largura}x${product.dimensoes.altura}x${product.dimensoes.profundidade} mm\n`;
        }
        info += `Resolução camada: ${product.resolucao_camada}mm\n`;
        info += `Custo total: R$ ${(product.custo_total || 0).toFixed(2)}\n`;
        info += `Preço venda: R$ ${(product.preco_venda || 0).toFixed(2)}\n`;
        if (promo) {
            info += `\n--- PROMOÇÃO ATIVA ---\n`;
            info += `Tipo: ${promo.tipo_desconto === 'percentual' ? 'Percentual' : 'Valor Fixo'}\n`;
            info += `Desconto: ${promo.tipo_desconto === 'percentual' ? promo.valor_desconto + '%' : 'R$' + promo.valor_desconto}\n`;
            info += `Preço promocional: R$ ${(promo.preco_promocional || 0).toFixed(2)}\n`;
        }
        info += `\nEstoque: ${product.quantidade_estoque || 0}\n`;
        info += `Tags: ${(product.tags || []).join(', ')}\n`;
        info += `Ativo: ${product.ativo ? 'Sim' : 'Não'}\n`;
        info += `Cadastrado em: ${product.created_at}\n`;
        info += `Atualizado em: ${product.updated_at}\n`;

        folder.file('info.txt', info);

        // Redes sociais
        if (product.descricoes_social) {
            const social = folder.folder('redes_sociais');
            const ds = product.descricoes_social;
            if (ds.instagram) social.file('instagram.txt', ds.instagram);
            if (ds.facebook) social.file('facebook.txt', ds.facebook);
            if (ds.whatsapp) social.file('whatsapp.txt', ds.whatsapp);
            if (ds.tiktok) social.file('tiktok.txt', ds.tiktok);
            if (ds.geral) social.file('descricao_geral.txt', ds.geral);
        }

        // Arquivos
        if (files.length > 0) {
            const imgFolder = folder.folder('imagens');
            const modelFolder = folder.folder('modelos_3d');
            const docFolder = folder.folder('documentos');

            for (const f of files) {
                const targetFolder = f.tipo === 'image' ? imgFolder :
                                     f.tipo === 'model3d' ? modelFolder : docFolder;
                targetFolder.file(f.nome_arquivo, f.blob);
            }
        }

        const blob = await zip.generateAsync({ type: 'blob' });
        const url = URL.createObjectURL(blob);
        const a = document.createElement('a');
        a.href = url;
        const date = new Date().toISOString().slice(0, 10).replace(/-/g, '');
        a.download = `${product.codigo_sku}_${product.nome.replace(/[^a-zA-Z0-9]/g, '_')}_${date}.zip`;
        a.click();
        URL.revokeObjectURL(url);
    }

    // ------------------------------------------
    // BACKUP COMPLETO
    // ------------------------------------------
    async function exportFullBackup() {
        const zip = new JSZip();

        // Export all stores as JSON (except files which are binary)
        const storeNames = [STORES.USERS, STORES.SETTINGS, STORES.CATEGORIES,
                           STORES.PRODUCTS, STORES.PROMOTIONS, STORES.COUPONS, STORES.SALES];

        for (const name of storeNames) {
            const data = await getAll(name);
            zip.file(`${name}.json`, JSON.stringify(data, null, 2));
        }

        // Export files separately
        const files = await getAll(STORES.PRODUCT_FILES);
        const filesMeta = files.map(f => ({ ...f, blob: undefined }));
        zip.file('product_files_meta.json', JSON.stringify(filesMeta, null, 2));

        const filesFolder = zip.folder('files');
        for (const f of files) {
            if (f.blob) {
                filesFolder.file(`${f.id}_${f.nome_arquivo}`, f.blob);
            }
        }

        const blob = await zip.generateAsync({ type: 'blob' });
        const url = URL.createObjectURL(blob);
        const a = document.createElement('a');
        a.href = url;
        const date = new Date().toISOString().slice(0, 10).replace(/-/g, '');
        a.download = `printh3d_backup_completo_${date}.zip`;
        a.click();
        URL.revokeObjectURL(url);
    }

    async function importFullBackup(file) {
        const zip = await JSZip.loadAsync(file);

        const storeNames = [STORES.USERS, STORES.SETTINGS, STORES.CATEGORIES,
                           STORES.PRODUCTS, STORES.PROMOTIONS, STORES.COUPONS, STORES.SALES];

        // Clear all stores
        for (const name of storeNames) {
            await clearStore(name);
        }
        await clearStore(STORES.PRODUCT_FILES);

        // Import JSON data
        for (const name of storeNames) {
            const jsonFile = zip.file(`${name}.json`);
            if (jsonFile) {
                const text = await jsonFile.async('text');
                const data = JSON.parse(text);
                for (const row of data) {
                    await put(name, row);
                }
            }
        }

        // Import files
        const metaFile = zip.file('product_files_meta.json');
        if (metaFile) {
            const metaText = await metaFile.async('text');
            const meta = JSON.parse(metaText);
            const filesFolder = zip.folder('files');

            for (const m of meta) {
                const binFile = filesFolder.file(`${m.id}_${m.nome_arquivo}`);
                if (binFile) {
                    const blob = await binFile.async('arraybuffer');
                    await put(STORES.PRODUCT_FILES, { ...m, blob });
                }
            }
        }

        console.log('[Database] Backup importado com sucesso.');
    }

    // ------------------------------------------
    // EXPORTAÇÃO EXCEL (compatibilidade)
    // ------------------------------------------
    async function exportExcel() {
        const workbook = XLSX.utils.book_new();
        const storeNames = ['users', 'settings', 'categories', 'products', 'promotions', 'coupons', 'sales'];
        const sheetLabels = ['USERS', 'SETTINGS', 'CATEGORIES', 'PRODUCTS', 'PROMOTIONS', 'COUPONS', 'SALES'];

        for (let i = 0; i < storeNames.length; i++) {
            const data = await getAll(storeNames[i]);
            // Remove binary data and flatten objects
            const cleaned = data.map(row => {
                const flat = {};
                for (const [key, val] of Object.entries(row)) {
                    if (val instanceof ArrayBuffer) continue;
                    if (typeof val === 'object' && val !== null && !Array.isArray(val)) {
                        for (const [k2, v2] of Object.entries(val)) {
                            flat[`${key}_${k2}`] = v2;
                        }
                    } else if (Array.isArray(val)) {
                        flat[key] = val.join(', ');
                    } else {
                        flat[key] = val;
                    }
                }
                return flat;
            });
            const sheet = XLSX.utils.json_to_sheet(cleaned);
            XLSX.utils.book_append_sheet(workbook, sheet, sheetLabels[i]);
        }

        const timestamp = new Date().toISOString().slice(0, 10).replace(/-/g, '');
        XLSX.writeFile(workbook, `printh3d_pro_backup_${timestamp}.xlsx`);
    }

    // API Pública
    return {
        STORES,
        init,
        seedIfEmpty,
        // CRUD
        add,
        put,
        getById,
        getAll,
        deleteById,
        getByIndex,
        clearStore,
        update,
        // Queries
        getNextSKU,
        isSkuUnique,
        searchProducts,
        getActivePromotion,
        getProductFiles,
        addProductFile,
        // Export/Import
        exportProductZip,
        exportFullBackup,
        importFullBackup,
        exportExcel
    };
})();
