// ============================================
// PRINTH3D PRO — Módulo de Dashboard
// 7 KPIs, gráficos duplos, vendas recentes,
// alertas de estoque
// ============================================

const Dashboard = (() => {
    let chartVendas = null;
    let chartCategorias = null;
    let chartFinanceWeekly = null;
    let chartExpensesCategory = null;

    // ------------------------------------------
    // Renderiza dashboard completo
    // ------------------------------------------
    async function render() {
        await renderKPIs();
        renderChart();
        await renderCategoryChart();
        renderWeeklyFinanceChart();
        renderExpenseCategoryChart();
        renderRecentSales();
        await renderStockAlerts();
        renderSmartInsights();
        renderExpenseAdmin();
        if (typeof lucide !== 'undefined') lucide.createIcons();
    }

    // ------------------------------------------
    // KPIs (7 cards)
    // ------------------------------------------
    async function renderKPIs() {
        const sales = getMonthSales();
        const expenses = getMonthExpenses();
        const allProducts = Storage.getSheet('PRODUCTS');
        const allSales = Storage.getSheet('SALES');

        const totalVendido = sales.reduce((sum, s) => sum + (parseFloat(s.valor_venda) || 0), 0);
        const totalLucro = sales.reduce((sum, s) => sum + (parseFloat(s.lucro) || 0), 0);
        const totalGastos = expenses.reduce((sum, e) => sum + (parseFloat(e.valor_total) || 0), 0);
        const resultadoLiquido = totalLucro - totalGastos;
        const totalAReceber = allSales.reduce((sum, s) => sum + (Math.max(0, parseFloat(s.valor_devido) || 0)), 0);
        const ticketMedio = sales.length > 0 ? totalVendido / sales.length : 0;
        const pesoGastos = totalVendido > 0 ? (totalGastos / totalVendido) * 100 : 0;
        const taxaInadimplenciaMes = totalVendido > 0
            ? (sales.reduce((sum, s) => sum + (Math.max(0, parseFloat(s.valor_devido) || 0)), 0) / totalVendido) * 100
            : 0;
        const margemMedia = sales.length > 0
            ? sales.reduce((sum, s) => {
                const venda = parseFloat(s.valor_venda) || 0;
                const lucro = parseFloat(s.lucro) || 0;
                return sum + (venda > 0 ? (lucro / venda) * 100 : 0);
            }, 0) / sales.length
            : 0;

        const topProduct = getTopProduct(sales, allProducts);

        // Promoções ativas
        let promosCount = 0;
        try { promosCount = await Promotions.getActivePromotionsCount(); } catch (e) {}

        // Estoque baixo
        const lowStock = allProducts.filter(p =>
            p.estoque_minimo > 0 && (p.quantidade_estoque || 0) <= p.estoque_minimo
        ).length;

        const setKPI = (id, value) => {
            const el = document.getElementById(id);
            if (el) el.textContent = value;
        };

        setKPI('kpi-vendas', Calculator.formatCurrency(totalVendido));
        setKPI('kpi-lucro', Calculator.formatCurrency(totalLucro));
        setKPI('kpi-margem', margemMedia.toFixed(1) + '%');
        setKPI('kpi-top-product', topProduct || '—');
        setKPI('kpi-count', sales.length);
        setKPI('kpi-promos', promosCount);
        setKPI('kpi-low-stock', lowStock);
        setKPI('kpi-expenses', Calculator.formatCurrency(totalGastos));
        setKPI('kpi-net', Calculator.formatCurrency(resultadoLiquido));
        setKPI('kpi-receivable', Calculator.formatCurrency(totalAReceber));
        setKPI('kpi-ticket', Calculator.formatCurrency(ticketMedio));
        setKPI('kpi-burn', formatPercent(pesoGastos));
        setKPI('kpi-default-rate', formatPercent(taxaInadimplenciaMes));
    }

    // ------------------------------------------
    // Gráfico de barras - Vendas × Lucro (6 meses)
    // ------------------------------------------
    function renderChart() {
        const canvas = document.getElementById('chart-vendas');
        if (!canvas) return;

        const ctx = canvas.getContext('2d');
        const allSales = Storage.getSheet('SALES');
        const monthNames = ['Jan', 'Fev', 'Mar', 'Abr', 'Mai', 'Jun',
                            'Jul', 'Ago', 'Set', 'Out', 'Nov', 'Dez'];
        const monthlyData = {};

        for (let i = 5; i >= 0; i--) {
            const d = new Date();
            d.setMonth(d.getMonth() - i);
            const key = `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}`;
            monthlyData[key] = { vendas: 0, lucro: 0 };
        }

        allSales.forEach(s => {
            const date = new Date(s.data_venda);
            if (isNaN(date.getTime())) return;
            const key = `${date.getFullYear()}-${String(date.getMonth() + 1).padStart(2, '0')}`;
            if (monthlyData[key]) {
                monthlyData[key].vendas += parseFloat(s.valor_venda) || 0;
                monthlyData[key].lucro += parseFloat(s.lucro) || 0;
            }
        });

        const labels = Object.keys(monthlyData).map(k => {
            const [y, m] = k.split('-');
            return monthNames[parseInt(m) - 1] + '/' + y.slice(2);
        });

        if (chartVendas) { chartVendas.destroy(); chartVendas = null; }

        chartVendas = new Chart(ctx, {
            type: 'bar',
            data: {
                labels,
                datasets: [
                    {
                        label: 'Vendas (R$)',
                        data: Object.values(monthlyData).map(d => d.vendas),
                        backgroundColor: 'rgba(0, 188, 255, 0.7)',
                        borderColor: '#00BCFF',
                        borderWidth: 1, borderRadius: 6, borderSkipped: false
                    },
                    {
                        label: 'Lucro (R$)',
                        data: Object.values(monthlyData).map(d => d.lucro),
                        backgroundColor: 'rgba(34, 197, 94, 0.7)',
                        borderColor: 'rgba(34, 197, 94, 1)',
                        borderWidth: 1, borderRadius: 6, borderSkipped: false
                    }
                ]
            },
            options: {
                responsive: true,
                maintainAspectRatio: false,
                plugins: {
                    legend: { labels: { color: '#94a3b8', padding: 16, usePointStyle: true, pointStyleWidth: 12, font: { size: 12 } } },
                    tooltip: {
                        backgroundColor: '#0a0a12', titleColor: '#e2e8f0', bodyColor: '#94a3b8',
                        borderColor: '#1e293b', borderWidth: 1, cornerRadius: 8, padding: 12,
                        callbacks: { label: ctx => ctx.dataset.label + ': R$ ' + ctx.parsed.y.toFixed(2).replace('.', ',') }
                    }
                },
                scales: {
                    y: { beginAtZero: true, ticks: { color: '#94a3b8', font: { size: 11 }, callback: v => 'R$ ' + v.toLocaleString('pt-BR') }, grid: { color: 'rgba(255,255,255,0.04)', drawBorder: false } },
                    x: { ticks: { color: '#94a3b8', font: { size: 11 } }, grid: { display: false } }
                }
            }
        });
    }

    // ------------------------------------------
    // Gráfico de pizza - Vendas por Categoria
    // ------------------------------------------
    async function renderCategoryChart() {
        const canvas = document.getElementById('chart-categorias');
        if (!canvas) return;
        const ctx = canvas.getContext('2d');
        const allSales = Storage.getSheet('SALES');
        const allProducts = Storage.getSheet('PRODUCTS');

        let categories = [];
        try { categories = await Categories.getAll(); } catch (e) {}

        // Count sales per category
        const catMap = {};
        allSales.forEach(s => {
            const product = allProducts.find(p => p.id === s.product_id);
            const catId = product ? (product.category_id || 0) : 0;
            catMap[catId] = (catMap[catId] || 0) + (parseFloat(s.valor_venda) || 0);
        });

        const labelsArr = [];
        const dataArr = [];
        const colorsArr = [];

        for (const [catId, total] of Object.entries(catMap)) {
            const cat = categories.find(c => c.id === parseInt(catId));
            labelsArr.push(cat ? cat.nome : 'Sem Categoria');
            dataArr.push(total);
            colorsArr.push(cat ? cat.cor : '#6b7280');
        }

        if (dataArr.length === 0) {
            labelsArr.push('Sem dados');
            dataArr.push(1);
            colorsArr.push('#1e293b');
        }

        if (chartCategorias) { chartCategorias.destroy(); chartCategorias = null; }

        chartCategorias = new Chart(ctx, {
            type: 'doughnut',
            data: {
                labels: labelsArr,
                datasets: [{
                    data: dataArr,
                    backgroundColor: colorsArr.map(c => c + 'CC'),
                    borderColor: colorsArr,
                    borderWidth: 2
                }]
            },
            options: {
                responsive: true,
                maintainAspectRatio: false,
                cutout: '60%',
                plugins: {
                    legend: { position: 'bottom', labels: { color: '#94a3b8', padding: 12, usePointStyle: true, font: { size: 11 } } },
                    tooltip: {
                        backgroundColor: '#0a0a12', titleColor: '#e2e8f0', bodyColor: '#94a3b8',
                        borderColor: '#1e293b', borderWidth: 1, cornerRadius: 8, padding: 12,
                        callbacks: { label: ctx => ctx.label + ': R$ ' + ctx.parsed.toFixed(2).replace('.', ',') }
                    }
                }
            }
        });
    }

    function renderWeeklyFinanceChart() {
        const canvas = document.getElementById('chart-finance-weekly');
        if (!canvas) return;

        const ctx = canvas.getContext('2d');
        const sales = Storage.getSheet('SALES');
        const expenses = Storage.getSheet('EXPENSES');
        const buckets = buildRecentWeekBuckets(8);

        sales.forEach(s => {
            const d = new Date(s.data_venda);
            if (isNaN(d.getTime())) return;
            const key = getWeekKey(d);
            if (buckets[key]) {
                buckets[key].vendas += parseFloat(s.valor_venda) || 0;
            }
        });

        expenses.forEach(e => {
            const d = new Date(e.data_gasto);
            if (isNaN(d.getTime())) return;
            const key = getWeekKey(d);
            if (buckets[key]) {
                buckets[key].gastos += parseFloat(e.valor_total) || 0;
            }
        });

        const labels = Object.keys(buckets).map(k => {
            const [year, week] = k.split('-W');
            return `S${week}/${String(year).slice(2)}`;
        });
        const salesData = Object.values(buckets).map(v => v.vendas);
        const expensesData = Object.values(buckets).map(v => v.gastos);
        const netData = Object.values(buckets).map(v => v.vendas - v.gastos);

        if (chartFinanceWeekly) { chartFinanceWeekly.destroy(); chartFinanceWeekly = null; }

        chartFinanceWeekly = new Chart(ctx, {
            type: 'line',
            data: {
                labels,
                datasets: [
                    {
                        label: 'Vendas',
                        data: salesData,
                        borderColor: '#00BCFF',
                        backgroundColor: 'rgba(0, 188, 255, 0.2)',
                        fill: false,
                        tension: 0.35,
                        pointRadius: 3
                    },
                    {
                        label: 'Gastos',
                        data: expensesData,
                        borderColor: 'rgba(249, 115, 22, 1)',
                        backgroundColor: 'rgba(249, 115, 22, 0.2)',
                        fill: false,
                        tension: 0.35,
                        pointRadius: 3
                    },
                    {
                        label: 'Líquido',
                        data: netData,
                        borderColor: 'rgba(34, 197, 94, 1)',
                        backgroundColor: 'rgba(34, 197, 94, 0.2)',
                        fill: false,
                        tension: 0.35,
                        pointRadius: 3
                    }
                ]
            },
            options: {
                responsive: true,
                maintainAspectRatio: false,
                plugins: {
                    legend: { labels: { color: '#94a3b8', padding: 14, usePointStyle: true, pointStyleWidth: 10, font: { size: 11 } } },
                    tooltip: {
                        backgroundColor: '#0a0a12', titleColor: '#e2e8f0', bodyColor: '#94a3b8',
                        borderColor: '#1e293b', borderWidth: 1, cornerRadius: 8, padding: 12,
                        callbacks: { label: ctx => `${ctx.dataset.label}: ${Calculator.formatCurrency(ctx.parsed.y || 0)}` }
                    }
                },
                scales: {
                    y: {
                        ticks: { color: '#94a3b8', font: { size: 11 }, callback: v => `R$ ${Number(v).toLocaleString('pt-BR')}` },
                        grid: { color: 'rgba(255,255,255,0.04)', drawBorder: false }
                    },
                    x: { ticks: { color: '#94a3b8', font: { size: 11 } }, grid: { display: false } }
                }
            }
        });
    }

    function renderExpenseCategoryChart() {
        const canvas = document.getElementById('chart-expenses-category');
        if (!canvas) return;

        const ctx = canvas.getContext('2d');
        const monthExpenses = getMonthExpenses();
        const categoryMap = {};

        monthExpenses.forEach(e => {
            const cat = String(e.categoria || 'Sem Categoria').trim() || 'Sem Categoria';
            categoryMap[cat] = (categoryMap[cat] || 0) + (parseFloat(e.valor_total) || 0);
        });

        const sorted = Object.entries(categoryMap)
            .sort((a, b) => b[1] - a[1])
            .slice(0, 6);

        const labels = sorted.map(([name]) => name);
        const data = sorted.map(([, value]) => value);

        if (labels.length === 0) {
            labels.push('Sem gastos');
            data.push(0);
        }

        if (chartExpensesCategory) { chartExpensesCategory.destroy(); chartExpensesCategory = null; }

        chartExpensesCategory = new Chart(ctx, {
            type: 'bar',
            data: {
                labels,
                datasets: [{
                    label: 'Gastos (R$)',
                    data,
                    backgroundColor: 'rgba(249, 115, 22, 0.7)',
                    borderColor: 'rgba(249, 115, 22, 1)',
                    borderWidth: 1,
                    borderRadius: 6,
                    borderSkipped: false
                }]
            },
            options: {
                responsive: true,
                maintainAspectRatio: false,
                plugins: {
                    legend: { display: false },
                    tooltip: {
                        backgroundColor: '#0a0a12', titleColor: '#e2e8f0', bodyColor: '#94a3b8',
                        borderColor: '#1e293b', borderWidth: 1, cornerRadius: 8, padding: 12,
                        callbacks: { label: ctx => `Gastos: ${Calculator.formatCurrency(ctx.parsed.y || 0)}` }
                    }
                },
                scales: {
                    y: {
                        beginAtZero: true,
                        ticks: { color: '#94a3b8', font: { size: 11 }, callback: v => `R$ ${Number(v).toLocaleString('pt-BR')}` },
                        grid: { color: 'rgba(255,255,255,0.04)', drawBorder: false }
                    },
                    x: {
                        ticks: { color: '#94a3b8', font: { size: 10 }, maxRotation: 35, minRotation: 0 },
                        grid: { display: false }
                    }
                }
            }
        });
    }

    // ------------------------------------------
    // Vendas recentes (últimas 5)
    // ------------------------------------------
    function renderRecentSales() {
        const allSales = Storage.getSheet('SALES');
        const products = Storage.getSheet('PRODUCTS');
        const tbody = document.getElementById('recent-sales-body');
        if (!tbody) return;

        const recent = allSales.slice(-5).reverse();

        if (recent.length === 0) {
            tbody.innerHTML = `<tr><td colspan="4" class="text-center text-muted" style="padding:2rem;">Nenhuma venda registrada ainda.</td></tr>`;
            return;
        }

        tbody.innerHTML = recent.map(s => {
            const product = products.find(p => p.id === s.product_id);
            const itemName = s.item_nome || (product ? product.nome : 'Produto removido');
            return `<tr>
                <td><strong>${escapeHtml(itemName)}</strong></td>
                <td>${escapeHtml(s.cliente || '—')}</td>
                <td>${Calculator.formatCurrency(s.valor_venda)}</td>
                <td>${formatDate(s.data_venda)}</td>
            </tr>`;
        }).join('');
    }

    // ------------------------------------------
    // Alertas de estoque baixo
    // ------------------------------------------
    async function renderStockAlerts() {
        const el = document.getElementById('stock-alerts');
        if (!el) return;

        const products = Storage.getSheet('PRODUCTS');
        const lowStock = products.filter(p =>
            p.estoque_minimo > 0 && (p.quantidade_estoque || 0) <= p.estoque_minimo
        );

        if (lowStock.length === 0) {
            el.innerHTML = '<p class="text-muted" style="padding:1rem;">Nenhum alerta de estoque.</p>';
            return;
        }

        el.innerHTML = lowStock.map(p => `
            <div class="stock-alert-item">
                <div>
                    <strong>${escapeHtml(p.nome)}</strong>
                    <code>${escapeHtml(p.codigo_sku || '')}</code>
                </div>
                <div>
                    <span class="badge badge-danger">${p.quantidade_estoque || 0} un</span>
                    <small class="text-muted">mín: ${p.estoque_minimo}</small>
                </div>
            </div>
        `).join('');
    }

    function renderSmartInsights() {
        const el = document.getElementById('dashboard-insights');
        if (!el) return;

        const monthSales = getMonthSales();
        const monthExpenses = getMonthExpenses();
        const allSales = Storage.getSheet('SALES');
        const allProducts = Storage.getSheet('PRODUCTS');

        const totalSales = monthSales.reduce((sum, s) => sum + (parseFloat(s.valor_venda) || 0), 0);
        const totalProfit = monthSales.reduce((sum, s) => sum + (parseFloat(s.lucro) || 0), 0);
        const totalExpenses = monthExpenses.reduce((sum, e) => sum + (parseFloat(e.valor_total) || 0), 0);
        const receivable = allSales.reduce((sum, s) => sum + (Math.max(0, parseFloat(s.valor_devido) || 0)), 0);
        const lowStock = allProducts.filter(p => p.estoque_minimo > 0 && (p.quantidade_estoque || 0) <= p.estoque_minimo).length;

        const expenseByCategory = {};
        monthExpenses.forEach(e => {
            const key = String(e.categoria || 'Sem Categoria');
            expenseByCategory[key] = (expenseByCategory[key] || 0) + (parseFloat(e.valor_total) || 0);
        });
        const topExpense = Object.entries(expenseByCategory).sort((a, b) => b[1] - a[1])[0] || null;

        const insights = [];

        if (monthSales.length === 0 && monthExpenses.length === 0) {
            insights.push({ tone: 'neutral', text: 'Sem movimentação no mês atual. Registre vendas e gastos para receber recomendações automáticas.' });
        } else {
            const net = totalProfit - totalExpenses;
            insights.push({
                tone: net >= 0 ? 'positive' : 'negative',
                text: `Resultado líquido do mês está em ${Calculator.formatCurrency(net)} (${net >= 0 ? 'positivo' : 'negativo'}).`
            });

            if (topExpense) {
                const share = totalExpenses > 0 ? (topExpense[1] / totalExpenses) * 100 : 0;
                insights.push({
                    tone: share >= 35 ? 'warning' : 'neutral',
                    text: `Maior centro de gasto: ${topExpense[0]} com ${Calculator.formatCurrency(topExpense[1])} (${formatPercent(share)} do total de gastos).`
                });
            }

            const marginAfterExpenses = totalSales > 0 ? ((totalProfit - totalExpenses) / totalSales) * 100 : 0;
            insights.push({
                tone: marginAfterExpenses >= 20 ? 'positive' : (marginAfterExpenses >= 10 ? 'warning' : 'negative'),
                text: `Margem líquida após gastos: ${formatPercent(marginAfterExpenses)} sobre o faturamento do mês.`
            });

            if (receivable > 0) {
                insights.push({
                    tone: 'warning',
                    text: `Existe ${Calculator.formatCurrency(receivable)} em aberto. Priorize cobrança e conciliação de pagamentos pendentes.`
                });
            }

            if (lowStock > 0) {
                insights.push({
                    tone: 'warning',
                    text: `${lowStock} produto(s) estão em estoque baixo. Planeje reposição para evitar perda de venda.`
                });
            }
        }

        el.innerHTML = insights.map(item => `
            <div class="insight-item insight-${item.tone}">
                <i data-lucide="lightbulb"></i>
                <span>${escapeHtml(item.text)}</span>
            </div>
        `).join('');
    }

    function renderExpenseAdmin() {
        const el = document.getElementById('dashboard-expense-admin');
        if (!el) return;

        const monthExpenses = getMonthExpenses();
        if (monthExpenses.length === 0) {
            el.innerHTML = '<p class="text-muted" style="padding:0.5rem 0;">Sem gastos registrados no mês.</p>';
            return;
        }

        const total = monthExpenses.reduce((sum, e) => sum + (parseFloat(e.valor_total) || 0), 0);
        const avg = monthExpenses.length > 0 ? total / monthExpenses.length : 0;

        const byCategory = {};
        const byPayment = {};

        monthExpenses.forEach(e => {
            const cat = String(e.categoria || 'Sem Categoria');
            const pay = String(e.tipo_pagamento || 'Outro');
            byCategory[cat] = (byCategory[cat] || 0) + (parseFloat(e.valor_total) || 0);
            byPayment[pay] = (byPayment[pay] || 0) + (parseFloat(e.valor_total) || 0);
        });

        const topCats = Object.entries(byCategory).sort((a, b) => b[1] - a[1]).slice(0, 4);
        const topPayments = Object.entries(byPayment).sort((a, b) => b[1] - a[1]).slice(0, 3);

        el.innerHTML = `
            <div class="expense-admin-summary">
                <div><strong>Total no mês:</strong> ${Calculator.formatCurrency(total)}</div>
                <div><strong>Registros:</strong> ${monthExpenses.length}</div>
                <div><strong>Média por gasto:</strong> ${Calculator.formatCurrency(avg)}</div>
            </div>
            <div class="expense-admin-columns">
                <div>
                    <h4>Top Categorias</h4>
                    <div class="expense-admin-list">
                        ${topCats.map(([name, value]) => `
                            <div class="expense-admin-item">
                                <span>${escapeHtml(name)}</span>
                                <strong>${Calculator.formatCurrency(value)}</strong>
                            </div>
                        `).join('')}
                    </div>
                </div>
                <div>
                    <h4>Formas de Pagamento</h4>
                    <div class="expense-admin-list">
                        ${topPayments.map(([name, value]) => `
                            <div class="expense-admin-item">
                                <span>${escapeHtml(name)}</span>
                                <strong>${Calculator.formatCurrency(value)}</strong>
                            </div>
                        `).join('')}
                    </div>
                </div>
            </div>
        `;
    }

    // --- Helpers ---

    function getMonthSales() {
        const now = new Date();
        const currentMonth = now.getMonth();
        const currentYear = now.getFullYear();
        const allSales = Storage.getSheet('SALES');
        return allSales.filter(s => {
            const d = new Date(s.data_venda);
            return !isNaN(d.getTime()) && d.getMonth() === currentMonth && d.getFullYear() === currentYear;
        });
    }

    function getMonthExpenses() {
        const now = new Date();
        const currentMonth = now.getMonth();
        const currentYear = now.getFullYear();
        const allExpenses = Storage.getSheet('EXPENSES');
        return allExpenses.filter(e => {
            const d = new Date(e.data_gasto);
            return !isNaN(d.getTime()) && d.getMonth() === currentMonth && d.getFullYear() === currentYear;
        });
    }

    function getTopProduct(sales, products) {
        if (!sales || sales.length === 0) return null;
        const counts = {};
        sales.forEach(s => {
            const key = s.product_id ? `product:${s.product_id}` : `custom:${String(s.item_nome || 'Personalizado').trim()}`;
            counts[key] = (counts[key] || 0) + 1;
        });
        const topEntry = Object.entries(counts).sort((a, b) => b[1] - a[1])[0];
        if (!topEntry) return null;
        const key = topEntry[0];
        if (key.startsWith('custom:')) {
            return key.replace('custom:', '') || 'Personalizado';
        }
        const productId = parseInt(key.replace('product:', ''));
        const product = products.find(p => p.id === productId);
        return product ? product.nome : 'Desconhecido';
    }

    function formatPercent(value) {
        const number = Number.isFinite(value) ? value : 0;
        return `${number.toFixed(1)}%`;
    }

    function getWeekKey(date) {
        const d = new Date(Date.UTC(date.getFullYear(), date.getMonth(), date.getDate()));
        const dayNum = d.getUTCDay() || 7;
        d.setUTCDate(d.getUTCDate() + 4 - dayNum);
        const yearStart = new Date(Date.UTC(d.getUTCFullYear(), 0, 1));
        const weekNo = Math.ceil((((d - yearStart) / 86400000) + 1) / 7);
        return `${d.getUTCFullYear()}-W${String(weekNo).padStart(2, '0')}`;
    }

    function buildRecentWeekBuckets(weeksCount) {
        const map = {};
        for (let i = weeksCount - 1; i >= 0; i--) {
            const date = new Date();
            date.setDate(date.getDate() - (i * 7));
            const key = getWeekKey(date);
            map[key] = { vendas: 0, gastos: 0 };
        }
        return map;
    }

    function formatDate(dateStr) {
        if (!dateStr) return '—';
        const d = new Date(dateStr);
        if (isNaN(d.getTime())) return '—';
        return d.toLocaleDateString('pt-BR');
    }

    function escapeHtml(str) {
        if (!str) return '';
        const div = document.createElement('div');
        div.textContent = str;
        return div.innerHTML;
    }

    return { render, renderKPIs, renderChart, renderRecentSales, formatDate, escapeHtml };
})();
