// ============================================
// PRINTH3D LITE — Módulo de Dashboard
// KPIs, gráficos (Chart.js) e vendas recentes
// ============================================

const Dashboard = (() => {
    let chartInstance = null;

    // ------------------------------------------
    // Renderiza dashboard completo
    // ------------------------------------------
    function render() {
        renderKPIs();
        renderChart();
        renderRecentSales();
    }

    // ------------------------------------------
    // Renderiza os cards de indicadores (KPIs)
    // ------------------------------------------
    function renderKPIs() {
        const sales = getMonthSales();
        const allProducts = Storage.getSheet('PRODUCTS');

        // Total vendido no mês
        const totalVendido = sales.reduce((sum, s) => sum + (parseFloat(s.valor_venda) || 0), 0);

        // Lucro total no mês
        const totalLucro = sales.reduce((sum, s) => sum + (parseFloat(s.lucro) || 0), 0);

        // Margem média do mês
        const margemMedia = sales.length > 0
            ? sales.reduce((sum, s) => {
                const venda = parseFloat(s.valor_venda) || 0;
                const lucro = parseFloat(s.lucro) || 0;
                return sum + (venda > 0 ? (lucro / venda) * 100 : 0);
            }, 0) / sales.length
            : 0;

        // Produto mais vendido do mês
        const topProduct = getTopProduct(sales, allProducts);

        // Atualiza o DOM
        const setKPI = (id, value) => {
            const el = document.getElementById(id);
            if (el) el.textContent = value;
        };

        setKPI('kpi-vendas', Calculator.formatCurrency(totalVendido));
        setKPI('kpi-lucro', Calculator.formatCurrency(totalLucro));
        setKPI('kpi-margem', margemMedia.toFixed(1) + '%');
        setKPI('kpi-top-product', topProduct || '—');
        setKPI('kpi-count', sales.length);
    }

    // ------------------------------------------
    // Renderiza gráfico de barras - Últimos 6 meses
    // Vendas × Lucro usando Chart.js
    // ------------------------------------------
    function renderChart() {
        const canvas = document.getElementById('chart-vendas');
        if (!canvas) return;

        const ctx = canvas.getContext('2d');
        const allSales = Storage.getSheet('SALES');

        // Prepara dados dos últimos 6 meses
        const monthlyData = {};
        const monthNames = ['Jan', 'Fev', 'Mar', 'Abr', 'Mai', 'Jun',
                            'Jul', 'Ago', 'Set', 'Out', 'Nov', 'Dez'];

        for (let i = 5; i >= 0; i--) {
            const d = new Date();
            d.setMonth(d.getMonth() - i);
            const key = `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}`;
            monthlyData[key] = { vendas: 0, lucro: 0 };
        }

        // Agrega vendas por mês
        allSales.forEach(s => {
            const date = new Date(s.data_venda);
            if (isNaN(date.getTime())) return;
            const key = `${date.getFullYear()}-${String(date.getMonth() + 1).padStart(2, '0')}`;
            if (monthlyData[key]) {
                monthlyData[key].vendas += parseFloat(s.valor_venda) || 0;
                monthlyData[key].lucro  += parseFloat(s.lucro) || 0;
            }
        });

        // Labels do eixo X
        const labels = Object.keys(monthlyData).map(k => {
            const [y, m] = k.split('-');
            return monthNames[parseInt(m) - 1] + '/' + y.slice(2);
        });

        // Destrói gráfico anterior se existir
        if (chartInstance) {
            chartInstance.destroy();
            chartInstance = null;
        }

        // Cria novo gráfico
        chartInstance = new Chart(ctx, {
            type: 'bar',
            data: {
                labels,
                datasets: [
                    {
                        label: 'Vendas (R$)',
                        data: Object.values(monthlyData).map(d => d.vendas),
                        backgroundColor: 'rgba(99, 102, 241, 0.75)',
                        borderColor: 'rgba(99, 102, 241, 1)',
                        borderWidth: 1,
                        borderRadius: 6,
                        borderSkipped: false
                    },
                    {
                        label: 'Lucro (R$)',
                        data: Object.values(monthlyData).map(d => d.lucro),
                        backgroundColor: 'rgba(34, 197, 94, 0.75)',
                        borderColor: 'rgba(34, 197, 94, 1)',
                        borderWidth: 1,
                        borderRadius: 6,
                        borderSkipped: false
                    }
                ]
            },
            options: {
                responsive: true,
                maintainAspectRatio: false,
                plugins: {
                    legend: {
                        labels: {
                            color: '#94a3b8',
                            padding: 16,
                            usePointStyle: true,
                            pointStyleWidth: 12,
                            font: { size: 12 }
                        }
                    },
                    tooltip: {
                        backgroundColor: '#1e1b4b',
                        titleColor: '#e2e8f0',
                        bodyColor: '#94a3b8',
                        borderColor: '#312e81',
                        borderWidth: 1,
                        cornerRadius: 8,
                        padding: 12,
                        callbacks: {
                            label: function(context) {
                                return context.dataset.label + ': R$ ' +
                                    context.parsed.y.toFixed(2).replace('.', ',');
                            }
                        }
                    }
                },
                scales: {
                    y: {
                        beginAtZero: true,
                        ticks: {
                            color: '#94a3b8',
                            font: { size: 11 },
                            callback: v => 'R$ ' + v.toLocaleString('pt-BR')
                        },
                        grid: {
                            color: 'rgba(255, 255, 255, 0.04)',
                            drawBorder: false
                        }
                    },
                    x: {
                        ticks: {
                            color: '#94a3b8',
                            font: { size: 11 }
                        },
                        grid: {
                            display: false
                        }
                    }
                }
            }
        });
    }

    // ------------------------------------------
    // Tabela de vendas recentes (últimas 5)
    // ------------------------------------------
    function renderRecentSales() {
        const allSales = Storage.getSheet('SALES');
        const products = Storage.getSheet('PRODUCTS');
        const tbody = document.getElementById('recent-sales-body');
        if (!tbody) return;

        // Pega as 5 últimas vendas
        const recent = allSales.slice(-5).reverse();

        if (recent.length === 0) {
            tbody.innerHTML = `
                <tr>
                    <td colspan="4" class="text-center text-muted" style="padding: 2rem;">
                        Nenhuma venda registrada ainda.
                    </td>
                </tr>`;
            return;
        }

        tbody.innerHTML = recent.map(s => {
            const product = products.find(p => p.id === s.product_id);
            return `<tr>
                <td><strong>${escapeHtml(product ? product.nome : 'Produto removido')}</strong></td>
                <td>${escapeHtml(s.cliente || '—')}</td>
                <td>${Calculator.formatCurrency(s.valor_venda)}</td>
                <td>${formatDate(s.data_venda)}</td>
            </tr>`;
        }).join('');
    }

    // ------------------------------------------
    // Filtra vendas do mês atual
    // ------------------------------------------
    function getMonthSales() {
        const now = new Date();
        const currentMonth = now.getMonth();
        const currentYear = now.getFullYear();
        const allSales = Storage.getSheet('SALES');

        return allSales.filter(s => {
            const d = new Date(s.data_venda);
            return !isNaN(d.getTime()) &&
                   d.getMonth() === currentMonth &&
                   d.getFullYear() === currentYear;
        });
    }

    // ------------------------------------------
    // Produto mais vendido (por quantidade) no mês
    // ------------------------------------------
    function getTopProduct(sales, products) {
        if (!sales || sales.length === 0) return null;

        const counts = {};
        sales.forEach(s => {
            const pid = s.product_id;
            counts[pid] = (counts[pid] || 0) + 1;
        });

        const topEntry = Object.entries(counts).sort((a, b) => b[1] - a[1])[0];
        if (!topEntry) return null;

        const product = products.find(p => p.id === parseInt(topEntry[0]));
        return product ? product.nome : 'Desconhecido';
    }

    // ------------------------------------------
    // Formata data para exibição (DD/MM/YYYY)
    // ------------------------------------------
    function formatDate(dateStr) {
        if (!dateStr) return '—';
        const d = new Date(dateStr);
        if (isNaN(d.getTime())) return '—';
        return d.toLocaleDateString('pt-BR');
    }

    // ------------------------------------------
    // Escapa HTML para evitar injeção
    // ------------------------------------------
    function escapeHtml(str) {
        if (!str) return '';
        const div = document.createElement('div');
        div.textContent = str;
        return div.innerHTML;
    }

    // API Pública
    return {
        render,
        renderKPIs,
        renderChart,
        renderRecentSales,
        formatDate,
        escapeHtml
    };
})();
