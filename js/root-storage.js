// ============================================
// PRINTH3D PRO — Armazenamento em Pasta Raiz
// Espelha o banco em arquivos JSON + binários
// ============================================

const RootStorage = (() => {
    const DATA_FOLDER = 'printh3d_data';
    const DATA_SUBFOLDER = 'data';
    const FILES_SUBFOLDER = 'files';
    const CONFIG_SUBFOLDER = 'config';
    const HANDLE_DB_NAME = 'printh3d_root_storage';
    const HANDLE_DB_VERSION = 1;
    const HANDLE_STORE = 'handles';
    const HANDLE_KEY = 'project_root';
    const FILE_DIR_BY_TYPE = {
        image: 'images',
        model3d: 'models_3d',
        document: 'documents',
        other: 'others'
    };

    let directoryHandle = null;
    let lastSyncAt = null;

    function getHandleDb() {
        return new Promise((resolve, reject) => {
            const request = indexedDB.open(HANDLE_DB_NAME, HANDLE_DB_VERSION);

            request.onupgradeneeded = (e) => {
                const database = e.target.result;
                if (!database.objectStoreNames.contains(HANDLE_STORE)) {
                    database.createObjectStore(HANDLE_STORE, { keyPath: 'id' });
                }
            };

            request.onsuccess = () => resolve(request.result);
            request.onerror = (e) => reject(e.target.error);
        });
    }

    async function saveHandle(handle) {
        const db = await getHandleDb();
        await new Promise((resolve, reject) => {
            const tx = db.transaction(HANDLE_STORE, 'readwrite');
            tx.oncomplete = () => resolve();
            tx.onerror = (e) => reject(e.target.error);
            tx.objectStore(HANDLE_STORE).put({ id: HANDLE_KEY, handle });
        });
        db.close();
    }

    async function loadSavedHandle() {
        const db = await getHandleDb();
        const result = await new Promise((resolve, reject) => {
            const tx = db.transaction(HANDLE_STORE, 'readonly');
            const req = tx.objectStore(HANDLE_STORE).get(HANDLE_KEY);
            req.onsuccess = () => resolve(req.result || null);
            req.onerror = (e) => reject(e.target.error);
        });
        db.close();
        return result?.handle || null;
    }

    async function clearSavedHandle() {
        const db = await getHandleDb();
        await new Promise((resolve, reject) => {
            const tx = db.transaction(HANDLE_STORE, 'readwrite');
            tx.oncomplete = () => resolve();
            tx.onerror = (e) => reject(e.target.error);
            tx.objectStore(HANDLE_STORE).delete(HANDLE_KEY);
        });
        db.close();
    }

    async function hasReadWritePermission(handle, requestIfNeeded = false) {
        if (!handle) return false;
        let permission = await handle.queryPermission({ mode: 'readwrite' });
        if (permission === 'granted') return true;
        if (requestIfNeeded && permission === 'prompt') {
            permission = await handle.requestPermission({ mode: 'readwrite' });
            return permission === 'granted';
        }
        return false;
    }

    function isSupported() {
        return typeof window !== 'undefined' && typeof window.showDirectoryPicker === 'function';
    }

    function isActive() {
        return !!directoryHandle;
    }

    function getStatus() {
        return {
            supported: isSupported(),
            active: isActive(),
            folderName: directoryHandle ? directoryHandle.name : '',
            lastSyncAt
        };
    }

    async function initFromSavedHandle() {
        if (!isSupported()) return getStatus();

        try {
            const saved = await loadSavedHandle();
            if (!saved) return getStatus();

            const granted = await hasReadWritePermission(saved, false);
            if (!granted) return getStatus();

            directoryHandle = saved;
            await ensureStructure();
            return getStatus();
        } catch (_) {
            await clearSavedHandle().catch(() => {});
            directoryHandle = null;
            return getStatus();
        }
    }

    async function connectDirectory(options = {}) {
        if (!isSupported()) {
            throw new Error('Seu navegador não suporta acesso direto à pasta local. Use Chrome ou Edge atualizado.');
        }

        const createStructure = options.createStructure !== false;
        const picked = await window.showDirectoryPicker({ mode: 'readwrite' });
        const granted = await hasReadWritePermission(picked, true);
        if (!granted) {
            throw new Error('Permissão de escrita não concedida para a pasta selecionada.');
        }

        directoryHandle = picked;
        await saveHandle(directoryHandle);

        if (createStructure) {
            await ensureStructure();
        }

        return getStatus();
    }

    async function disconnectDirectory() {
        directoryHandle = null;
        await clearSavedHandle().catch(() => {});
    }

    async function ensureStructure() {
        const root = await getDataRoot();
        await root.getDirectoryHandle(DATA_SUBFOLDER, { create: true });
        await root.getDirectoryHandle(CONFIG_SUBFOLDER, { create: true });

        const filesRoot = await root.getDirectoryHandle(FILES_SUBFOLDER, { create: true });
        for (const dir of Object.values(FILE_DIR_BY_TYPE)) {
            await filesRoot.getDirectoryHandle(dir, { create: true });
        }

        await writeTextFile(root, 'README.txt', buildReadmeText());
    }

    async function getDataRoot(create = true) {
        if (!directoryHandle) {
            throw new Error('Nenhuma pasta raiz conectada.');
        }
        return await directoryHandle.getDirectoryHandle(DATA_FOLDER, { create });
    }

    async function hasBackupData() {
        if (!directoryHandle) return false;
        try {
            const root = await getDataRoot(false);
            const dataDir = await root.getDirectoryHandle(DATA_SUBFOLDER, { create: false });
            const manifest = await readJsonFile(root, 'manifest.json', null);
            if (manifest && manifest.app === 'Printh3D Pro') return true;

            for await (const [name, handle] of dataDir.entries()) {
                if (handle.kind === 'file' && name.endsWith('.json') && name !== 'product_files_meta.json') {
                    return true;
                }
            }
            return false;
        } catch (_) {
            return false;
        }
    }

    async function writeTextFile(dirHandle, filename, text) {
        const fileHandle = await dirHandle.getFileHandle(filename, { create: true });
        const writable = await fileHandle.createWritable();
        await writable.write(text);
        await writable.close();
    }

    async function writeJsonFile(dirHandle, filename, payload) {
        await writeTextFile(dirHandle, filename, JSON.stringify(payload, null, 2));
    }

    async function clearDirectoryFiles(dirHandle) {
        for await (const [name, handle] of dirHandle.entries()) {
            if (handle.kind === 'file') {
                await dirHandle.removeEntry(name);
                continue;
            }
            await clearDirectoryFiles(handle);
            await dirHandle.removeEntry(name, { recursive: true });
        }
    }

    function sanitizeFileName(name) {
        return String(name || 'arquivo')
            .replace(/[\\/:*?"<>|]+/g, '_')
            .replace(/\s+/g, ' ')
            .trim();
    }

    function getFileDirectoryName(tipo) {
        return FILE_DIR_BY_TYPE[tipo] || FILE_DIR_BY_TYPE.other;
    }

    function listStoreNames() {
        return [
            Database.STORES.USERS,
            Database.STORES.SETTINGS,
            Database.STORES.CATEGORIES,
            Database.STORES.PRODUCTS,
            Database.STORES.PROMOTIONS,
            Database.STORES.COUPONS,
            Database.STORES.SALES,
            Database.STORES.CLIENTS,
            Database.STORES.EXPENSES,
            Database.STORES.TRASH
        ];
    }

    async function syncFromDatabase(options = {}) {
        if (!directoryHandle) {
            throw new Error('Conecte uma pasta raiz primeiro.');
        }

        const uiState = options.uiState || {};
        const sessionState = options.sessionState || {};
        const root = await getDataRoot();
        const dataDir = await root.getDirectoryHandle(DATA_SUBFOLDER, { create: true });
        const configDir = await root.getDirectoryHandle(CONFIG_SUBFOLDER, { create: true });
        const filesDir = await root.getDirectoryHandle(FILES_SUBFOLDER, { create: true });

        const snapshot = await Database.getFullSnapshot();

        for (const storeName of listStoreNames()) {
            const rows = snapshot.stores[storeName] || [];
            await writeJsonFile(dataDir, `${storeName}.json`, rows);
        }

        const filesMeta = [];
        for (const dirName of Object.values(FILE_DIR_BY_TYPE)) {
            const targetDir = await filesDir.getDirectoryHandle(dirName, { create: true });
            await clearDirectoryFiles(targetDir);
        }

        for (const fileRow of snapshot.productFiles) {
            const dirName = getFileDirectoryName(fileRow.tipo);
            const targetDir = await filesDir.getDirectoryHandle(dirName, { create: true });
            const safeName = sanitizeFileName(fileRow.nome_arquivo);
            const diskName = `${String(fileRow.id).padStart(6, '0')}_${safeName}`;
            const fileHandle = await targetDir.getFileHandle(diskName, { create: true });
            const writable = await fileHandle.createWritable();
            await writable.write(new Blob([fileRow.blob], { type: fileRow.mime_type || 'application/octet-stream' }));
            await writable.close();

            filesMeta.push({
                ...fileRow,
                blob: undefined,
                relative_path: `${FILES_SUBFOLDER}/${dirName}/${diskName}`
            });
        }

        await writeJsonFile(dataDir, 'product_files_meta.json', filesMeta);
        await writeJsonFile(configDir, 'ui_state.json', uiState);
        await writeJsonFile(configDir, 'session_state.json', sessionState);

        const manifest = {
            app: 'Printh3D Pro',
            version: 1,
            generated_at: new Date().toISOString(),
            stores: Object.fromEntries(listStoreNames().map(s => [s, (snapshot.stores[s] || []).length])),
            product_files_count: filesMeta.length,
            root_folder: DATA_FOLDER
        };

        await writeJsonFile(root, 'manifest.json', manifest);
        lastSyncAt = manifest.generated_at;
        return manifest;
    }

    async function readJsonFile(dirHandle, filename, fallback = null) {
        try {
            const fileHandle = await dirHandle.getFileHandle(filename, { create: false });
            const file = await fileHandle.getFile();
            const text = await file.text();
            return JSON.parse(text);
        } catch (err) {
            return fallback;
        }
    }

    async function readBinaryFileByRelativePath(rootHandle, relativePath) {
        const clean = String(relativePath || '').split('/').filter(Boolean);
        if (clean.length < 2) return null;

        let current = rootHandle;
        for (let i = 0; i < clean.length - 1; i++) {
            current = await current.getDirectoryHandle(clean[i], { create: false });
        }

        const fileHandle = await current.getFileHandle(clean[clean.length - 1], { create: false });
        const file = await fileHandle.getFile();
        return await file.arrayBuffer();
    }

    async function listDirectoryTree(dirHandle, depth = 0, maxDepth = 2) {
        const items = [];
        for await (const [name, handle] of dirHandle.entries()) {
            if (handle.kind === 'directory') {
                const node = { name, kind: 'directory', children: [] };
                if (depth < maxDepth) {
                    node.children = await listDirectoryTree(handle, depth + 1, maxDepth);
                }
                items.push(node);
            } else {
                items.push({ name, kind: 'file' });
            }
        }

        items.sort((a, b) => {
            if (a.kind !== b.kind) return a.kind === 'directory' ? -1 : 1;
            return a.name.localeCompare(b.name, 'pt-BR');
        });

        return items;
    }

    async function getRootOverview() {
        if (!directoryHandle) {
            throw new Error('Conecte uma pasta raiz primeiro.');
        }

        const root = await getDataRoot(false);
        const manifest = await readJsonFile(root, 'manifest.json', null);
        const tree = await listDirectoryTree(root, 0, 2);

        return {
            folderName: directoryHandle.name,
            dataFolder: DATA_FOLDER,
            manifest,
            tree
        };
    }

    async function restoreToDatabase() {
        if (!directoryHandle) {
            throw new Error('Conecte uma pasta raiz primeiro.');
        }

        const root = await getDataRoot(false);
        const dataDir = await root.getDirectoryHandle(DATA_SUBFOLDER, { create: false });

        const storesData = {};
        for (const storeName of listStoreNames()) {
            storesData[storeName] = await readJsonFile(dataDir, `${storeName}.json`, []);
        }

        const filesMeta = await readJsonFile(dataDir, 'product_files_meta.json', []);
        const productFiles = [];

        for (const meta of filesMeta) {
            if (!meta || !meta.relative_path) continue;
            const binary = await readBinaryFileByRelativePath(root, meta.relative_path);
            if (!binary) continue;
            const row = { ...meta, blob: binary };
            delete row.relative_path;
            productFiles.push(row);
        }

        await Database.restoreFromRootSnapshot({ stores: storesData, productFiles });
        await Storage.refreshCache();

        lastSyncAt = new Date().toISOString();

        return {
            restoredAt: lastSyncAt,
            stores: Object.fromEntries(listStoreNames().map(s => [s, (storesData[s] || []).length])),
            product_files_count: productFiles.length
        };
    }

    function buildReadmeText() {
        return [
            'PRINTH3D DATA ROOT',
            '',
            'Esta pasta contém uma cópia legível e recuperável dos dados do sistema.',
            '',
            'Estrutura:',
            '- data/: tabelas em JSON (vendas, clientes, configurações, usuários, etc.)',
            '- files/images, files/models_3d, files/documents, files/others: arquivos binários',
            '- config/: estado visual/filtros/sessão exportados no momento da sincronização',
            '- manifest.json: resumo da última sincronização',
            '',
            'Observação: as senhas são armazenadas como hash (não em texto puro).'
        ].join('\n');
    }

    return {
        isSupported,
        isActive,
        getStatus,
        initFromSavedHandle,
        hasBackupData,
        getRootOverview,
        connectDirectory,
        disconnectDirectory,
        syncFromDatabase,
        restoreToDatabase
    };
})();
