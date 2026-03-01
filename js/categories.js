// ============================================
// PRINTH3D PRO — Módulo de Categorias
// CRUD completo de categorias de produtos
// ============================================

const Categories = (() => {

    // Ícones disponíveis para categorias
    const AVAILABLE_ICONS = [
        'package', 'key-round', 'bot', 'flower-2', 'wrench', 'crown', 'star',
        'heart', 'home', 'gift', 'lamp', 'gamepad-2', 'phone', 'car',
        'plane', 'bike', 'pen-tool', 'music', 'camera', 'book-open',
        'shield', 'zap', 'target', 'feather', 'coffee', 'globe',
        'box', 'layers', 'hexagon', 'diamond', 'puzzle', 'trophy'
    ];

    const AVAILABLE_COLORS = [
        '#00BCFF', '#34d399', '#fbbf24', '#f87171', '#a78bfa',
        '#fb923c', '#38bdf8', '#4ade80', '#facc15', '#f472b6',
        '#818cf8', '#22d3ee', '#e879f9', '#94a3b8'
    ];

    async function getAll() {
        return await Database.getAll(Database.STORES.CATEGORIES);
    }

    async function getById(id) {
        return await Database.getById(Database.STORES.CATEGORIES, id);
    }

    async function save(data) {
        // Validações
        if (!data.nome || !data.nome.trim()) {
            throw new Error('Nome da categoria é obrigatório.');
        }
        if (!data.prefixo || !data.prefixo.trim()) {
            throw new Error('Prefixo SKU é obrigatório.');
        }

        data.prefixo = data.prefixo.toUpperCase().replace(/[^A-Z0-9]/g, '');

        if (data.prefixo.length < 2 || data.prefixo.length > 5) {
            throw new Error('Prefixo deve ter entre 2 e 5 caracteres.');
        }

        // Verificar unicidade
        const all = await getAll();
        const duplicate = all.find(c =>
            c.nome.toLowerCase() === data.nome.toLowerCase().trim() && c.id !== data.id
        );
        if (duplicate) throw new Error('Já existe uma categoria com este nome.');

        const dupPrefix = all.find(c =>
            c.prefixo === data.prefixo && c.id !== data.id
        );
        if (dupPrefix) throw new Error('Já existe uma categoria com este prefixo.');

        if (data.id) {
            return await Database.update(Database.STORES.CATEGORIES, data.id, {
                nome: data.nome.trim(),
                prefixo: data.prefixo,
                cor: data.cor || '#00BCFF',
                descricao: data.descricao || '',
                icone: data.icone || 'package',
                updated_at: new Date().toISOString()
            });
        } else {
            return await Database.add(Database.STORES.CATEGORIES, {
                nome: data.nome.trim(),
                prefixo: data.prefixo,
                cor: data.cor || '#00BCFF',
                descricao: data.descricao || '',
                icone: data.icone || 'package',
                created_at: new Date().toISOString()
            });
        }
    }

    async function remove(id) {
        // Verificar se há produtos vinculados
        const products = await Database.getByIndex(Database.STORES.PRODUCTS, 'category_id', id);
        if (products.length > 0) {
            throw new Error(`Não é possível excluir: ${products.length} produto(s) vinculado(s) a esta categoria.\nMova os produtos para outra categoria primeiro.`);
        }
        return await Database.deleteById(Database.STORES.CATEGORIES, id);
    }

    async function getProductCount(categoryId) {
        const products = await Database.getByIndex(Database.STORES.PRODUCTS, 'category_id', categoryId);
        return products.length;
    }

    return {
        AVAILABLE_ICONS,
        AVAILABLE_COLORS,
        getAll,
        getById,
        save,
        remove,
        getProductCount
    };
})();
