// ============================================
// PRINTH3D LITE — Motor de Cálculo Inteligente
// Calcula custos de impressão 3D com base nos
// parâmetros configurados (SETTINGS)
// ============================================

const Calculator = (() => {

    function toNumber(value, fallback = 0) {
        const n = parseFloat(value);
        return Number.isFinite(n) ? n : fallback;
    }

    function clampMin0(value) {
        return Math.max(0, toNumber(value, 0));
    }

    function resolveTempoMinutos(tempo_min, tempo_h) {
        const min = clampMin0(tempo_min);
        if (min > 0) return min;
        const h = clampMin0(tempo_h);
        return h > 0 ? h * 60 : 0;
    }

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
    function calcularDetalhado(params = {}) {
        const s = getSettings();

        const peso_g = clampMin0(params.peso_g);
        const tempo_min = resolveTempoMinutos(params.tempo_min, params.tempo_h);
        const tempo_h = tempo_min / 60;

        const custo_kg = clampMin0(params.custo_kg ?? s.custo_kg);
        const custo_kwh = clampMin0(params.custo_kwh ?? s.custo_kwh);
        const consumo_w = clampMin0(params.consumo_w ?? s.consumo_maquina_w ?? 350);
        const custo_hora_maq = clampMin0(params.custo_hora_maq ?? s.custo_hora_maquina);
        const depreciacao_pc = clampMin0(params.depreciacao_pc ?? s.depreciacao_percentual);
        const falhas_pc = clampMin0(params.falhas_pc ?? s.percentual_falha);
        const margem = clampMin0(params.margem ?? s.margem_padrao);

        const adicional_material = clampMin0(params.adicional_material);
        const modelagem = clampMin0(params.modelagem);
        const acabamento_pc = clampMin0(params.acabamento_pc);
        const fixacao = clampMin0(params.fixacao);
        const outros = clampMin0(params.outros);

        const custoMaterialBase = (peso_g / 1000) * custo_kg;
        const custoMaterial = custoMaterialBase + adicional_material;
        const energia_kwh = (consumo_w / 1000) * tempo_h;
        const custoEnergia = energia_kwh * custo_kwh;
        const custoMaquina = tempo_h * custo_hora_maq;
        const custoDepreciacao = (custoMaterial + custoMaquina + custoEnergia) * depreciacao_pc;

        const subtotal = custoMaterial + custoMaquina + custoEnergia + custoDepreciacao;
        const custoFalhas = subtotal * falhas_pc;
        const custoBase = subtotal + custoFalhas;
        const custoAcabamento = custoBase * acabamento_pc;
        const totalAdicionais = modelagem + custoAcabamento + fixacao + outros;

        const custoTotal = custoBase + totalAdicionais;
        const precoVenda = custoTotal * (1 + margem);
        const lucroEstimado = precoVenda - custoTotal;
        const margemReal = precoVenda > 0
            ? ((precoVenda - custoTotal) / precoVenda) * 100
            : 0;

        return {
            inputs: {
                peso_g: round2(peso_g),
                tempo_min: round2(tempo_min),
                tempo_h: round2(tempo_h),
                custo_kg: round2(custo_kg),
                custo_kwh: round2(custo_kwh),
                consumo_w: round2(consumo_w),
                custo_hora_maq: round2(custo_hora_maq),
                depreciacao_pc: round2(depreciacao_pc),
                falhas_pc: round2(falhas_pc),
                margem: round2(margem),
                adicional_material: round2(adicional_material),
                modelagem: round2(modelagem),
                acabamento_pc: round2(acabamento_pc),
                fixacao: round2(fixacao),
                outros: round2(outros)
            },
            custoMaterialBase: round2(custoMaterialBase),
            custoMaterial: round2(custoMaterial),
            custoMaquina: round2(custoMaquina),
            energia_kwh: round2(energia_kwh),
            custoEnergia: round2(custoEnergia),
            custoDepreciacao: round2(custoDepreciacao),
            subtotal: round2(subtotal),
            custoFalhas: round2(custoFalhas),
            custoBase: round2(custoBase),
            custoAcabamento: round2(custoAcabamento),
            totalAdicionais: round2(totalAdicionais),
            custoTotal: round2(custoTotal),
            precoVenda: round2(precoVenda),
            lucroEstimado: round2(lucroEstimado),
            margemReal: round2(margemReal)
        };
    }

    function calcular(peso_g, tempo_h, margemCustom) {
        return calcularDetalhado({
            peso_g,
            tempo_h,
            margem: margemCustom,
            modelagem: 0,
            acabamento_pc: 0,
            fixacao: 0,
            outros: 0,
            adicional_material: 0
        });
    }

    // ------------------------------------------
    // Recalcula custo e preço de TODOS os produtos
    // Chamado quando as configurações são alteradas
    // ------------------------------------------
    function recalcularTodosProdutos() {
        const products = Storage.getSheet('PRODUCTS');

        products.forEach(p => {
            const tempo_min = resolveTempoMinutos(p.tempo_min, p.tempo_h);
            const materialExtra = clampMin0(p.custos_adicionais?.material_extra || 0);

            let calc = null;
            if (p.calculation_mode === 'detailed' && p.custo_detalhado?.inputs) {
                const detail = p.custo_detalhado.inputs;
                calc = calcularDetalhado({
                    ...detail,
                    peso_g: p.peso_g,
                    tempo_min,
                    margem: detail.margem,
                    adicional_material: detail.adicional_material ?? materialExtra
                });
                p.custo_detalhado = calc;
            } else {
                calc = calcularDetalhado({
                    peso_g: p.peso_g,
                    tempo_min,
                    margem: getSettings().margem_padrao,
                    adicional_material: materialExtra
                });
                p.calculation_mode = 'basic';
            }

            p.tempo_min = round2(tempo_min);
            p.tempo_h = round2(tempo_min / 60);
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
        calcularDetalhado,
        resolveTempoMinutos,
        recalcularTodosProdutos,
        formatCurrency,
        round2
    };
})();
