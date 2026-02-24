// ============================================
// PRINTH3D LITE — Motor de Cálculo Inteligente
// Calcula custos de impressão 3D com base nos
// parâmetros configurados (SETTINGS)
// ============================================

const Calculator = (() => {

    // ------------------------------------------
    // Lê configurações atuais do banco
    // ------------------------------------------
    function getSettings() {
        const settings = Storage.getSheet('SETTINGS');
        return settings[0] || {
            margem_padrao: 0.50,
            custo_kg: 120,
            custo_hora_maquina: 5,
            custo_kwh: 0.85,
            consumo_maquina_w: 350,
            percentual_falha: 0.05,
            depreciacao_percentual: 0.10
        };
    }

    // ------------------------------------------
    // Cálculo Híbrido de Custo de Impressão 3D
    //
    // Fórmulas:
    //   Material   = (peso_g / 1000) × custo_kg
    //   Máquina    = tempo_h × custo_hora_maquina
    //   Energia    = tempo_h × custo_kwh
    //   Depreciação= subtotal_parcial × depreciacao_percentual
    //   Falhas     = subtotal × percentual_falha
    //   Total      = subtotal + falhas
    //   Preço      = total × (1 + margem)
    //
    // @param {number} peso_g  - Peso em gramas
    // @param {number} tempo_h - Tempo em horas
    // @param {number} [margemCustom] - Margem customizada (opcional)
    // @returns {object} Detalhamento completo dos custos
    // ------------------------------------------
    function calcular(peso_g, tempo_h, margemCustom) {
        const s = getSettings();

        // Custos diretos
        const custoMaterial = (peso_g / 1000) * s.custo_kg;
        const custoMaquina  = tempo_h * s.custo_hora_maquina;
        const custoEnergia  = tempo_h * s.custo_kwh;

        // Depreciação sobre custos diretos
        const custoDepreciacao = (custoMaterial + custoMaquina + custoEnergia) * s.depreciacao_percentual;

        // Subtotal antes das falhas
        const subtotal = custoMaterial + custoMaquina + custoEnergia + custoDepreciacao;

        // Custo de falha como % do subtotal
        const custoFalhas = subtotal * s.percentual_falha;

        // Custo total final
        const custoTotal = subtotal + custoFalhas;

        // Margem e preço de venda
        const margem = (margemCustom !== undefined && margemCustom !== null)
            ? margemCustom
            : s.margem_padrao;
        const precoVenda = custoTotal * (1 + margem);

        // Lucro e margem real
        const lucroEstimado = precoVenda - custoTotal;
        const margemReal = precoVenda > 0
            ? ((precoVenda - custoTotal) / precoVenda) * 100
            : 0;

        return {
            custoMaterial:   round2(custoMaterial),
            custoMaquina:    round2(custoMaquina),
            custoEnergia:    round2(custoEnergia),
            custoDepreciacao:round2(custoDepreciacao),
            custoFalhas:     round2(custoFalhas),
            custoTotal:      round2(custoTotal),
            precoVenda:      round2(precoVenda),
            lucroEstimado:   round2(lucroEstimado),
            margemReal:      round2(margemReal)
        };
    }

    // ------------------------------------------
    // Recalcula custo e preço de TODOS os produtos
    // Chamado quando as configurações são alteradas
    // ------------------------------------------
    function recalcularTodosProdutos() {
        const products = Storage.getSheet('PRODUCTS');

        products.forEach(p => {
            const calc = calcular(p.peso_g, p.tempo_h);
            p.custo_total = calc.custoTotal;
            p.preco_venda = calc.precoVenda;
        });

        Storage.setSheet('PRODUCTS', products);
        console.log(`[Calculator] ${products.length} produto(s) recalculado(s).`);
        return products;
    }

    // ------------------------------------------
    // Formata valor como moeda brasileira (R$)
    // ------------------------------------------
    function formatCurrency(value) {
        if (value === null || value === undefined || isNaN(value)) {
            return 'R$ 0,00';
        }
        return new Intl.NumberFormat('pt-BR', {
            style: 'currency',
            currency: 'BRL'
        }).format(value);
    }

    // ------------------------------------------
    // Arredonda para 2 casas decimais
    // ------------------------------------------
    function round2(num) {
        return Math.round(num * 100) / 100;
    }

    // API Pública
    return {
        getSettings,
        calcular,
        recalcularTodosProdutos,
        formatCurrency,
        round2
    };
})();
