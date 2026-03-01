// ============================================
// PRINTH3D PRO — Compatibilidade Storage
// Camada de compatibilidade que delega para Database (IndexedDB)
// Mantém API síncrona para módulos legados (auth, calculator)
// ============================================

const Storage = (() => {
    // Cache in-memory para acesso síncrono
    let cache = null;

    function getDefaultData() {
        return {
            USERS: [{
                id: 1, nome: 'Administrador', email: 'admin@printh3d.com',
                senha_hash: sha256('admin123'), tipo: 'ADMIN'
            }],
            SETTINGS: [{
                margem_padrao: 0.50, custo_kg: 120.00, custo_hora_maquina: 5.00,
                custo_kwh: 0.85, consumo_maquina_w: 350,
                percentual_falha: 0.05, depreciacao_percentual: 0.10
            }],
            PRODUCTS: [],
            SALES: []
        };
    }

    async function init() {
        await Database.init();
        await Database.seedIfEmpty();
        await refreshCache();
        console.log('[Storage] Cache carregado do IndexedDB.');
    }

    async function refreshCache() {
        const users = await Database.getAll(Database.STORES.USERS);
        const settingsArr = await Database.getAll(Database.STORES.SETTINGS);
        const products = await Database.getAll(Database.STORES.PRODUCTS);
        const sales = await Database.getAll(Database.STORES.SALES);
        cache = {
            USERS: users,
            SETTINGS: settingsArr.length > 0 ? [settingsArr[0]] : getDefaultData().SETTINGS,
            PRODUCTS: products,
            SALES: sales
        };
    }

    function getData() {
        if (!cache) return getDefaultData();
        return cache;
    }

    function setData(data) { cache = data; }

    function getSheet(name) {
        if (!cache) return [];
        return cache[name] || [];
    }

    function setSheet(name, rows) {
        if (!cache) cache = getDefaultData();
        cache[name] = rows;
        const storeMap = {
            'USERS': Database.STORES.USERS, 'SETTINGS': Database.STORES.SETTINGS,
            'PRODUCTS': Database.STORES.PRODUCTS, 'SALES': Database.STORES.SALES
        };
        const storeName = storeMap[name];
        if (storeName) {
            (async () => {
                try {
                    await Database.clearStore(storeName);
                    for (const row of rows) { await Database.put(storeName, row); }
                } catch (err) { console.error('[Storage] Erro persistência IndexedDB:', err); }
            })();
        }
    }

    function generateId(sheetName) {
        const rows = getSheet(sheetName);
        if (rows.length === 0) return 1;
        return Math.max(...rows.map(r => r.id || 0)) + 1;
    }

    function addRow(sheetName, row) {
        const rows = getSheet(sheetName);
        row.id = generateId(sheetName);
        rows.push(row);
        setSheet(sheetName, rows);
        return row;
    }

    function updateRow(sheetName, id, newData) {
        const rows = getSheet(sheetName);
        const index = rows.findIndex(r => r.id === id);
        if (index === -1) return false;
        rows[index] = { ...rows[index], ...newData, id };
        setSheet(sheetName, rows);
        return true;
    }

    function deleteRow(sheetName, id) {
        const rows = getSheet(sheetName);
        const filtered = rows.filter(r => r.id !== id);
        if (filtered.length === rows.length) return false;
        setSheet(sheetName, filtered);
        return true;
    }

    function getRowById(sheetName, id) {
        const rows = getSheet(sheetName);
        return rows.find(r => r.id === id) || null;
    }

    function importExcel(file) {
        return new Promise((resolve, reject) => {
            const reader = new FileReader();
            reader.onload = (e) => {
                try {
                    const workbook = XLSX.read(e.target.result, { type: 'array' });
                    const data = {};
                    const expectedSheets = ['USERS', 'SETTINGS', 'PRODUCTS', 'SALES'];
                    expectedSheets.forEach(name => {
                        if (workbook.SheetNames.includes(name))
                            data[name] = XLSX.utils.sheet_to_json(workbook.Sheets[name]);
                    });
                    const defaults = getDefaultData();
                    expectedSheets.forEach(name => {
                        if (!data[name] || data[name].length === 0) {
                            if (name === 'SETTINGS' || name === 'USERS') data[name] = defaults[name];
                            else if (!data[name]) data[name] = [];
                        }
                    });
                    setData(data);
                    expectedSheets.forEach(name => setSheet(name, data[name]));
                    resolve(data);
                } catch (err) { reject(err); }
            };
            reader.onerror = () => reject(new Error('Erro ao ler o arquivo.'));
            reader.readAsArrayBuffer(file);
        });
    }

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
        } catch (err) { throw err; }
    }

    function resetToDefaults() {
        const d = getDefaultData();
        setData(d);
        return d;
    }

    return {
        init, refreshCache, getData, setData, getSheet, setSheet,
        generateId, addRow, updateRow, deleteRow, getRowById,
        importExcel, exportExcel, resetToDefaults
    };
})();
