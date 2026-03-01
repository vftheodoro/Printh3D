// ============================================
// PRINTH3D PRO — Módulo de Promoções e Cupons
// Gerencia promoções por produto e cupons
// ============================================

const Promotions = (() => {

    // ------------------------------------------
    // PROMOÇÕES POR PRODUTO
    // ------------------------------------------

    async function getAllPromotions() {
        return await Database.getAll(Database.STORES.PROMOTIONS);
    }

    async function getPromotionById(id) {
        return await Database.getById(Database.STORES.PROMOTIONS, id);
    }

    async function getProductPromotions(productId) {
        return await Database.getByIndex(Database.STORES.PROMOTIONS, 'product_id', productId);
    }

    async function getActivePromotion(productId) {
        return await Database.getActivePromotion(productId);
    }

    async function savePromotion(data) {
        if (!data.product_id) throw new Error('Selecione um produto.');

        const product = await Database.getById(Database.STORES.PRODUCTS, data.product_id);
        if (!product) throw new Error('Produto não encontrado.');

        // Calcular preço promocional
        let precoPromocional;
        if (data.tipo_desconto === 'percentual') {
            if (!data.valor_desconto || data.valor_desconto <= 0 || data.valor_desconto > 100) {
                throw new Error('Desconto percentual deve ser entre 1% e 100%.');
            }
            precoPromocional = product.preco_venda * (1 - data.valor_desconto / 100);
        } else {
            if (!data.valor_desconto || data.valor_desconto <= 0) {
                throw new Error('Valor do desconto deve ser maior que zero.');
            }
            if (data.valor_desconto >= product.preco_venda) {
                throw new Error('Desconto não pode ser maior ou igual ao preço.');
            }
            precoPromocional = product.preco_venda - data.valor_desconto;
        }

        const promoData = {
            product_id: data.product_id,
            tipo_desconto: data.tipo_desconto || 'percentual',
            valor_desconto: parseFloat(data.valor_desconto),
            preco_promocional: Calculator.round2(precoPromocional),
            data_inicio: data.data_inicio || new Date().toISOString(),
            data_fim: data.data_fim || null,
            ativo: data.ativo !== false,
            created_at: new Date().toISOString()
        };

        if (data.id) {
            return await Database.update(Database.STORES.PROMOTIONS, data.id, promoData);
        } else {
            // Desativar promoções anteriores do mesmo produto
            const existing = await getProductPromotions(data.product_id);
            for (const p of existing) {
                if (p.ativo) {
                    await Database.update(Database.STORES.PROMOTIONS, p.id, { ativo: false });
                }
            }
            return await Database.add(Database.STORES.PROMOTIONS, promoData);
        }
    }

    async function togglePromotion(id) {
        const promo = await getPromotionById(id);
        if (!promo) throw new Error('Promoção não encontrada.');
        return await Database.update(Database.STORES.PROMOTIONS, id, { ativo: !promo.ativo });
    }

    async function deletePromotion(id) {
        return await Database.deleteById(Database.STORES.PROMOTIONS, id);
    }

    // ------------------------------------------
    // CUPONS DE DESCONTO
    // ------------------------------------------

    async function getAllCoupons() {
        return await Database.getAll(Database.STORES.COUPONS);
    }

    async function getCouponById(id) {
        return await Database.getById(Database.STORES.COUPONS, id);
    }

    async function getCouponByCode(code) {
        const coupons = await getAllCoupons();
        return coupons.find(c => c.codigo.toUpperCase() === code.toUpperCase()) || null;
    }

    function generateCouponCode() {
        const chars = 'ABCDEFGHJKLMNPQRSTUVWXYZ23456789';
        let code = '';
        for (let i = 0; i < 8; i++) {
            code += chars.charAt(Math.floor(Math.random() * chars.length));
        }
        return code;
    }

    async function saveCoupon(data) {
        if (!data.codigo || !data.codigo.trim()) {
            throw new Error('Código do cupom é obrigatório.');
        }
        if (!data.valor_desconto || data.valor_desconto <= 0) {
            throw new Error('Valor do desconto deve ser maior que zero.');
        }

        const codigo = data.codigo.toUpperCase().trim();

        // Verificar unicidade
        const existing = await getCouponByCode(codigo);
        if (existing && existing.id !== data.id) {
            throw new Error('Já existe um cupom com este código.');
        }

        const couponData = {
            codigo,
            tipo_desconto: data.tipo_desconto || 'percentual',
            valor_desconto: parseFloat(data.valor_desconto),
            data_validade: data.data_validade || null,
            limite_usos: parseInt(data.limite_usos) || 0,
            usos_realizados: data.usos_realizados || 0,
            categorias: data.categorias || [],
            ativo: data.ativo !== false,
            created_at: new Date().toISOString()
        };

        if (data.id) {
            return await Database.update(Database.STORES.COUPONS, data.id, couponData);
        } else {
            return await Database.add(Database.STORES.COUPONS, couponData);
        }
    }

    async function toggleCoupon(id) {
        const coupon = await getCouponById(id);
        if (!coupon) throw new Error('Cupom não encontrado.');
        return await Database.update(Database.STORES.COUPONS, id, { ativo: !coupon.ativo });
    }

    async function deleteCoupon(id) {
        return await Database.deleteById(Database.STORES.COUPONS, id);
    }

    async function validateCoupon(code, productId) {
        const coupon = await getCouponByCode(code);
        if (!coupon) return { valid: false, message: 'Cupom não encontrado.' };
        if (!coupon.ativo) return { valid: false, message: 'Cupom desativado.' };

        // Verificar validade
        if (coupon.data_validade) {
            const now = new Date().toISOString().slice(0, 10);
            if (coupon.data_validade < now) {
                return { valid: false, message: 'Cupom expirado.' };
            }
        }

        // Verificar limite de usos
        if (coupon.limite_usos > 0 && coupon.usos_realizados >= coupon.limite_usos) {
            return { valid: false, message: 'Cupom esgotado (limite de usos atingido).' };
        }

        // Verificar categoria se específico
        if (coupon.categorias && coupon.categorias.length > 0 && productId) {
            const product = await Database.getById(Database.STORES.PRODUCTS, productId);
            if (product && !coupon.categorias.includes(product.category_id)) {
                return { valid: false, message: 'Cupom não válido para esta categoria.' };
            }
        }

        return { valid: true, coupon };
    }

    async function useCoupon(id) {
        const coupon = await getCouponById(id);
        if (!coupon) return;
        await Database.update(Database.STORES.COUPONS, id, {
            usos_realizados: (coupon.usos_realizados || 0) + 1
        });
    }

    async function applyCoupon(coupon, preco) {
        if (coupon.tipo_desconto === 'percentual') {
            return Calculator.round2(preco * (1 - coupon.valor_desconto / 100));
        } else {
            return Calculator.round2(Math.max(0, preco - coupon.valor_desconto));
        }
    }

    // ------------------------------------------
    // RELATÓRIOS
    // ------------------------------------------

    async function getActivePromotionsCount() {
        const all = await getAllPromotions();
        const now = new Date().toISOString();
        return all.filter(p => p.ativo && (!p.data_fim || p.data_fim >= now)).length;
    }

    async function getPromotionsWithProducts() {
        const promos = await getAllPromotions();
        const products = await Database.getAll(Database.STORES.PRODUCTS);
        return promos.map(p => {
            const prod = products.find(pr => pr.id === p.product_id);
            return { ...p, _product_nome: prod ? prod.nome : 'Removido', _product_preco: prod ? prod.preco_venda : 0 };
        });
    }

    return {
        // Promoções
        getAllPromotions,
        getPromotionById,
        getProductPromotions,
        getActivePromotion,
        savePromotion,
        togglePromotion,
        deletePromotion,
        getActivePromotionsCount,
        getPromotionsWithProducts,
        // Cupons
        getAllCoupons,
        getCouponById,
        getCouponByCode,
        generateCouponCode,
        saveCoupon,
        toggleCoupon,
        deleteCoupon,
        validateCoupon,
        useCoupon,
        applyCoupon
    };
})();
