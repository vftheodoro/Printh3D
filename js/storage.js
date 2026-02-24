// ============================================
// PRINTH3D LITE — Módulo de Armazenamento
// Gerencia persistência via localStorage + Excel
// ============================================

const Storage = (() => {
    const DB_KEY = 'printh3d_database';

    // ------------------------------------------
    // Retorna estrutura padrão do banco de dados
    // com admin e configurações iniciais
    // ------------------------------------------
    function getDefaultData() {
        return {
            USERS: [
                {
                    id: 1,
                    nome: 'Administrador',
                    email: 'admin@printh3d.com',
                    // SHA-256 de "admin123"
                    senha_hash: sha256('admin123'),
                    tipo: 'ADMIN'
                }
            ],
            SETTINGS: [
                {
                    margem_padrao: 0.50,         // 50% de margem
                    custo_kg: 120.00,            // R$ por kg de filamento
                    custo_hora_maquina: 5.00,    // R$ por hora de impressão
                    custo_kwh: 0.85,             // R$ por kWh
                    consumo_maquina_w: 350,      // Watts de consumo médio da impressora
                    percentual_falha: 0.05,      // 5% de chance de falha
                    depreciacao_percentual: 0.10 // 10% de depreciação
                }
            ],
            PRODUCTS: [],
            SALES: []
        };
    }

    // ------------------------------------------
    // Inicializa o banco na primeira execução
    // ------------------------------------------
    function init() {
        if (!localStorage.getItem(DB_KEY)) {
            const defaultData = getDefaultData();
            localStorage.setItem(DB_KEY, JSON.stringify(defaultData));
            console.log('[Storage] Banco de dados inicializado com dados padrão.');
        }
    }

    // ------------------------------------------
    // Lê todos os dados do localStorage
    // ------------------------------------------
    function getData() {
        const raw = localStorage.getItem(DB_KEY);
        if (!raw) {
            const defaultData = getDefaultData();
            setData(defaultData);
            return defaultData;
        }
        try {
            return JSON.parse(raw);
        } catch (e) {
            console.error('[Storage] Erro ao parsear dados:', e);
            return getDefaultData();
        }
    }

    // ------------------------------------------
    // Grava todos os dados no localStorage
    // ------------------------------------------
    function setData(data) {
        localStorage.setItem(DB_KEY, JSON.stringify(data));
    }

    // ------------------------------------------
    // Retorna array de objetos de uma planilha
    // ------------------------------------------
    function getSheet(name) {
        const data = getData();
        return data[name] || [];
    }

    // ------------------------------------------
    // Substitui todos os dados de uma planilha
    // ------------------------------------------
    function setSheet(name, rows) {
        const data = getData();
        data[name] = rows;
        setData(data);
    }

    // ------------------------------------------
    // Gera próximo ID auto-incrementável
    // ------------------------------------------
    function generateId(sheetName) {
        const rows = getSheet(sheetName);
        if (rows.length === 0) return 1;
        return Math.max(...rows.map(r => r.id || 0)) + 1;
    }

    // ------------------------------------------
    // Adiciona nova linha a uma planilha
    // ------------------------------------------
    function addRow(sheetName, row) {
        const rows = getSheet(sheetName);
        row.id = generateId(sheetName);
        rows.push(row);
        setSheet(sheetName, rows);
        return row;
    }

    // ------------------------------------------
    // Atualiza uma linha pelo ID
    // ------------------------------------------
    function updateRow(sheetName, id, newData) {
        const rows = getSheet(sheetName);
        const index = rows.findIndex(r => r.id === id);
        if (index === -1) return false;
        rows[index] = { ...rows[index], ...newData, id: id };
        setSheet(sheetName, rows);
        return true;
    }

    // ------------------------------------------
    // Remove uma linha pelo ID
    // ------------------------------------------
    function deleteRow(sheetName, id) {
        const rows = getSheet(sheetName);
        const filtered = rows.filter(r => r.id !== id);
        if (filtered.length === rows.length) return false;
        setSheet(sheetName, filtered);
        return true;
    }

    // ------------------------------------------
    // Busca uma linha pelo ID
    // ------------------------------------------
    function getRowById(sheetName, id) {
        const rows = getSheet(sheetName);
        return rows.find(r => r.id === id) || null;
    }

    // ------------------------------------------
    // Importa arquivo .xlsx para o localStorage
    // Usa SheetJS para parsear o workbook
    // ------------------------------------------
    function importExcel(file) {
        return new Promise((resolve, reject) => {
            const reader = new FileReader();

            reader.onload = (e) => {
                try {
                    const workbook = XLSX.read(e.target.result, { type: 'array' });
                    const data = {};
                    const expectedSheets = ['USERS', 'SETTINGS', 'PRODUCTS', 'SALES'];

                    // Extrai cada planilha esperada
                    expectedSheets.forEach(name => {
                        if (workbook.SheetNames.includes(name)) {
                            data[name] = XLSX.utils.sheet_to_json(workbook.Sheets[name]);
                        }
                    });

                    // Garante que sheets críticas existam
                    const defaults = getDefaultData();
                    expectedSheets.forEach(name => {
                        if (!data[name] || data[name].length === 0) {
                            if (name === 'SETTINGS' || name === 'USERS') {
                                data[name] = defaults[name];
                            } else if (!data[name]) {
                                data[name] = [];
                            }
                        }
                    });

                    setData(data);
                    console.log('[Storage] Excel importado com sucesso.');
                    resolve(data);
                } catch (err) {
                    console.error('[Storage] Erro ao importar Excel:', err);
                    reject(err);
                }
            };

            reader.onerror = () => reject(new Error('Erro ao ler o arquivo.'));
            reader.readAsArrayBuffer(file);
        });
    }

    // ------------------------------------------
    // Exporta dados atuais como arquivo .xlsx
    // ------------------------------------------
    function exportExcel() {
        try {
            const data = getData();
            const workbook = XLSX.utils.book_new();

            ['USERS', 'SETTINGS', 'PRODUCTS', 'SALES'].forEach(name => {
                const sheet = XLSX.utils.json_to_sheet(data[name] || []);
                XLSX.utils.book_append_sheet(workbook, sheet, name);
            });

            const timestamp = new Date().toISOString().slice(0, 10).replace(/-/g, '');
            XLSX.writeFile(workbook, `printh3d_backup_${timestamp}.xlsx`);
            console.log('[Storage] Excel exportado com sucesso.');
        } catch (err) {
            console.error('[Storage] Erro ao exportar Excel:', err);
            throw err;
        }
    }

    // ------------------------------------------
    // Reseta banco para dados padrão
    // ------------------------------------------
    function resetToDefaults() {
        const defaultData = getDefaultData();
        setData(defaultData);
        return defaultData;
    }

    // API Pública
    return {
        init,
        getData,
        setData,
        getSheet,
        setSheet,
        generateId,
        addRow,
        updateRow,
        deleteRow,
        getRowById,
        importExcel,
        exportExcel,
        resetToDefaults
    };
})();
