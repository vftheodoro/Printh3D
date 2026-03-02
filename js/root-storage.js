// ============================================
// PRINTH3D PRO — Armazenamento em Pasta Raiz
// Espelha o banco em arquivos JSON + binários
// ============================================

const RootStorage = (() => {
    const DATA_FOLDER = 'printh3d_data';
    const DATA_SUBFOLDER = 'data';
    const FILES_SUBFOLDER = 'files';
    const FILES_COLLECTIONS_SUBFOLDER = 'collections';
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
    const FILE_TYPE_BY_DIR = Object.fromEntries(Object.entries(FILE_DIR_BY_TYPE).map(([type, dir]) => [dir, type]));

    let directoryHandle = null;
    let lastSyncAt = null;
    let hadSavedHandle = false;
    let reconnectIssue = '';

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
            lastSyncAt,
            hadSavedHandle,
            reconnectIssue
        };
    }

    async function initFromSavedHandle() {
        if (!isSupported()) return getStatus();

        hadSavedHandle = false;
        reconnectIssue = '';

        try {
            const saved = await loadSavedHandle();
            if (!saved) return getStatus();
            hadSavedHandle = true;

            const granted = await hasReadWritePermission(saved, true);
            if (!granted) {
                reconnectIssue = 'permission_denied';
                return getStatus();
            }

            directoryHandle = saved;
            await ensureStructure();
            return getStatus();
        } catch (err) {
            await clearSavedHandle().catch(() => {});
            directoryHandle = null;
            reconnectIssue = (err && err.name) ? String(err.name) : 'unavailable';
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
        await filesRoot.getDirectoryHandle(FILES_COLLECTIONS_SUBFOLDER, { create: true });

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

    function canIgnoreDeleteError(err) {
        if (!err) return false;
        const name = String(err.name || '');
        return name === 'NotAllowedError' || name === 'InvalidModificationError' || name === 'NoModificationAllowedError';
    }

    async function clearDirectoryFiles(dirHandle) {
        for await (const [name, handle] of dirHandle.entries()) {
            if (handle.kind === 'file') {
                try {
                    await dirHandle.removeEntry(name);
                } catch (err) {
                    if (!canIgnoreDeleteError(err)) throw err;
                    console.warn('[RootStorage] Não foi possível remover arquivo durante limpeza:', name, err);
                }
                continue;
            }
            await clearDirectoryFiles(handle);
            try {
                await dirHandle.removeEntry(name, { recursive: true });
            } catch (err) {
                if (!canIgnoreDeleteError(err)) throw err;
                console.warn('[RootStorage] Não foi possível remover diretório durante limpeza:', name, err);
            }
        }
    }

    function sanitizeFileName(name) {
        return String(name || 'arquivo')
            .replace(/[\\/:*?"<>|]+/g, '_')
            .replace(/\s+/g, ' ')
            .trim();
    }

    function slugifyName(name, fallback = 'sem-nome') {
        const normalized = String(name || '')
            .normalize('NFD')
            .replace(/\p{Diacritic}/gu, '')
            .toLowerCase()
            .replace(/[^a-z0-9]+/g, '-')
            .replace(/^-+|-+$/g, '');
        return normalized || fallback;
    }

    function idPrefix(id, size) {
        const n = Number(id);
        if (!Number.isFinite(n) || n <= 0) return ''.padStart(size, '0');
        return String(Math.trunc(n)).padStart(size, '0');
    }

    function getCollectionFolderName(category) {
        if (!category) return '0000_sem-categoria';
        return `${idPrefix(category.id, 4)}_${slugifyName(category.nome, 'categoria')}`;
    }

    function getProductFolderName(product) {
        const sku = slugifyName(product?.codigo_sku || 'sem-sku', 'sem-sku');
        const nome = slugifyName(product?.nome || 'produto', 'produto');
        return `${idPrefix(product?.id, 6)}_${sku}_${nome}`;
    }

    function parseIdFromFolderName(folderName) {
        const match = String(folderName || '').match(/^(\d+)_/);
        if (!match) return null;
        const parsed = Number(match[1]);
        return Number.isFinite(parsed) ? parsed : null;
    }

    function getFileDirectoryName(tipo) {
        return FILE_DIR_BY_TYPE[tipo] || FILE_DIR_BY_TYPE.other;
    }

    function inferMimeTypeByName(filename, fallback = 'application/octet-stream') {
        const ext = String(filename || '').split('.').pop()?.toLowerCase() || '';
        const map = {
            stl: 'model/stl',
            obj: 'model/obj',
            '3mf': 'model/3mf',
            step: 'application/step',
            stp: 'application/step',
            jpg: 'image/jpeg',
            jpeg: 'image/jpeg',
            png: 'image/png',
            webp: 'image/webp',
            gif: 'image/gif',
            bmp: 'image/bmp',
            pdf: 'application/pdf',
            doc: 'application/msword',
            docx: 'application/vnd.openxmlformats-officedocument.wordprocessingml.document',
            txt: 'text/plain'
        };
        return map[ext] || fallback;
    }

    function parseProductFileIdsFromDiskName(diskName) {
        const match = String(diskName || '').match(/^(\d+)_(.+)$/);
        if (!match) {
            return { fileId: null, originalName: String(diskName || 'arquivo') };
        }
        const fileId = Number(match[1]);
        return {
            fileId: Number.isFinite(fileId) ? fileId : null,
            originalName: match[2] || 'arquivo'
        };
    }

    function indexById(rows) {
        const map = new Map();
        for (const row of rows || []) {
            if (!row || !row.id) continue;
            map.set(row.id, row);
        }
        return map;
    }

    async function getOrCreateProductHierarchyHandles(filesRoot, categoriesById, productsById, productId, cache) {
        const cacheKey = String(productId || '0');
        if (cache.has(cacheKey)) return cache.get(cacheKey);

        const product = productsById.get(productId) || null;
        const category = product ? (categoriesById.get(product.category_id) || null) : null;

        const collectionsRoot = await filesRoot.getDirectoryHandle(FILES_COLLECTIONS_SUBFOLDER, { create: true });
        const collectionFolderName = getCollectionFolderName(category);
        const collectionDir = await collectionsRoot.getDirectoryHandle(collectionFolderName, { create: true });

        const productFolderName = getProductFolderName(product || { id: productId, codigo_sku: 'sem-sku', nome: 'produto-sem-registro' });
        const productDir = await collectionDir.getDirectoryHandle(productFolderName, { create: true });

        const result = {
            product,
            category,
            collectionFolderName,
            productFolderName,
            collectionDir,
            productDir
        };
        cache.set(cacheKey, result);
        return result;
    }

    async function openProductFolder(productId) {
        if (!directoryHandle) {
            throw new Error('Conecte uma pasta raiz primeiro.');
        }

        const product = await Database.getById(Database.STORES.PRODUCTS, productId);
        if (!product) {
            throw new Error('Produto não encontrado.');
        }

        const category = product.category_id
            ? await Database.getById(Database.STORES.CATEGORIES, product.category_id)
            : null;

        const mediaOwnerId = typeof Database.resolveMediaOwnerProductId === 'function'
            ? await Database.resolveMediaOwnerProductId(productId)
            : productId;
        const mediaOwnerProduct = mediaOwnerId !== productId
            ? await Database.getById(Database.STORES.PRODUCTS, mediaOwnerId)
            : product;
        const mediaOwnerCategory = mediaOwnerProduct?.category_id
            ? await Database.getById(Database.STORES.CATEGORIES, mediaOwnerProduct.category_id)
            : category;

        const productFiles = typeof Database.getProductFilesShared === 'function'
            ? await Database.getProductFilesShared(productId)
            : await Database.getProductFiles(productId);
        const preferredFile = (!productFiles || productFiles.length === 0)
            ? null
            : productFiles.find(f => f.tipo === 'model3d' && /\.stl$/i.test(String(f.nome_arquivo || '')))
            || productFiles.find(f => f.tipo === 'model3d')
            || productFiles[0];

        const fileTypeDir = preferredFile ? getFileDirectoryName(preferredFile.tipo) : null;
        const safeName = preferredFile ? sanitizeFileName(preferredFile.nome_arquivo) : '';
        const diskName = preferredFile ? `${String(preferredFile.id).padStart(6, '0')}_${safeName}` : '';

        const root = await getDataRoot(false);
        const filesRoot = await root.getDirectoryHandle(FILES_SUBFOLDER, { create: false });

        let targetDir = null;
        let relativeFolder = '';
        try {
            const collectionsRoot = await filesRoot.getDirectoryHandle(FILES_COLLECTIONS_SUBFOLDER, { create: false });
            const collectionDir = await collectionsRoot.getDirectoryHandle(getCollectionFolderName(mediaOwnerCategory), { create: false });
            const productDir = await collectionDir.getDirectoryHandle(getProductFolderName(mediaOwnerProduct || product), { create: false });
            if (fileTypeDir) {
                targetDir = await productDir.getDirectoryHandle(fileTypeDir, { create: false });
                relativeFolder = `${DATA_FOLDER}/${FILES_SUBFOLDER}/${FILES_COLLECTIONS_SUBFOLDER}/${getCollectionFolderName(mediaOwnerCategory)}/${getProductFolderName(mediaOwnerProduct || product)}/${fileTypeDir}`;
            } else {
                targetDir = productDir;
                relativeFolder = `${DATA_FOLDER}/${FILES_SUBFOLDER}/${FILES_COLLECTIONS_SUBFOLDER}/${getCollectionFolderName(mediaOwnerCategory)}/${getProductFolderName(mediaOwnerProduct || product)}`;
            }
        } catch (_) {
            if (!fileTypeDir) {
                throw new Error('Este produto ainda não possui pasta sincronizada na raiz. Faça uma sincronização para gerar a estrutura.');
            }
            const legacyDir = await filesRoot.getDirectoryHandle(fileTypeDir, { create: false });
            targetDir = legacyDir;
            relativeFolder = `${DATA_FOLDER}/${FILES_SUBFOLDER}/${fileTypeDir}`;
        }

        if (diskName) {
            try {
                await targetDir.getFileHandle(diskName, { create: false });
            } catch (_) {
                throw new Error(`Arquivo de referência não encontrado na pasta raiz (${diskName}). Sincronize novamente para atualizar os arquivos.`);
            }
        }

        let opened = false;
        try {
            if (typeof window.showOpenFilePicker === 'function') {
                await window.showOpenFilePicker({
                    multiple: false,
                    startIn: targetDir
                });
                opened = true;
            } else if (typeof window.showDirectoryPicker === 'function') {
                await window.showDirectoryPicker({
                    mode: 'read',
                    startIn: targetDir
                });
                opened = true;
            }
        } catch (err) {
            if (err && err.name !== 'AbortError') {
                throw err;
            }
        }

        return {
            opened,
            productId,
            highlightedFileName: preferredFile?.nome_arquivo || null,
            highlightedDiskName: diskName || null,
            highlightedType: preferredFile?.tipo || null,
            relativeFolder
        };
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
        const categoriesById = indexById(snapshot.stores[Database.STORES.CATEGORIES] || []);
        const productsById = indexById(snapshot.stores[Database.STORES.PRODUCTS] || []);

        for (const storeName of listStoreNames()) {
            const rows = snapshot.stores[storeName] || [];
            await writeJsonFile(dataDir, `${storeName}.json`, rows);
        }

        const filesMeta = [];
        const hierarchyCache = new Map();
        let cleanupSkipped = false;
        try {
            await clearDirectoryFiles(filesDir);
        } catch (err) {
            cleanupSkipped = true;
            console.warn('[RootStorage] Limpeza completa não concluída, continuando sincronização com merge:', err);
        }
        const collectionsRoot = await filesDir.getDirectoryHandle(FILES_COLLECTIONS_SUBFOLDER, { create: true });

        const categoryRows = snapshot.stores[Database.STORES.CATEGORIES] || [];
        for (const category of categoryRows) {
            const categoryFolder = await collectionsRoot.getDirectoryHandle(getCollectionFolderName(category), { create: true });
            await writeJsonFile(categoryFolder, '_category.json', {
                id: category.id,
                nome: category.nome || '',
                prefixo: category.prefixo || '',
                cor: category.cor || '',
                icone: category.icone || ''
            });
        }

        const productRows = snapshot.stores[Database.STORES.PRODUCTS] || [];
        for (const product of productRows) {
            const hierarchy = await getOrCreateProductHierarchyHandles(
                filesDir,
                categoriesById,
                productsById,
                product.id,
                hierarchyCache
            );

            await writeJsonFile(hierarchy.productDir, '_product.json', {
                id: hierarchy.product?.id || product.id,
                nome: hierarchy.product?.nome || product.nome || 'Produto sem cadastro',
                codigo_sku: hierarchy.product?.codigo_sku || product.codigo_sku || 'sem-sku',
                category_id: hierarchy.product?.category_id || product.category_id || null,
                category_nome: hierarchy.category?.nome || 'Sem categoria'
            });

            for (const typeDir of Object.values(FILE_DIR_BY_TYPE)) {
                await hierarchy.productDir.getDirectoryHandle(typeDir, { create: true });
            }
        }

        for (const fileRow of snapshot.productFiles) {
            const hierarchy = await getOrCreateProductHierarchyHandles(
                filesDir,
                categoriesById,
                productsById,
                fileRow.product_id,
                hierarchyCache
            );

            await writeJsonFile(hierarchy.productDir, '_product.json', {
                id: hierarchy.product?.id || fileRow.product_id,
                nome: hierarchy.product?.nome || 'Produto sem cadastro',
                codigo_sku: hierarchy.product?.codigo_sku || 'sem-sku',
                category_id: hierarchy.product?.category_id || null,
                category_nome: hierarchy.category?.nome || 'Sem categoria'
            });

            const fileTypeDirName = getFileDirectoryName(fileRow.tipo);
            const targetDir = await hierarchy.productDir.getDirectoryHandle(fileTypeDirName, { create: true });
            const safeName = sanitizeFileName(fileRow.nome_arquivo);
            const diskName = `${String(fileRow.id).padStart(6, '0')}_${safeName}`;
            const fileHandle = await targetDir.getFileHandle(diskName, { create: true });
            const writable = await fileHandle.createWritable();
            await writable.write(new Blob([fileRow.blob], { type: fileRow.mime_type || 'application/octet-stream' }));
            await writable.close();

            filesMeta.push({
                ...fileRow,
                blob: undefined,
                relative_path: `${FILES_SUBFOLDER}/${FILES_COLLECTIONS_SUBFOLDER}/${hierarchy.collectionFolderName}/${hierarchy.productFolderName}/${fileTypeDirName}/${diskName}`,
                collection_folder: hierarchy.collectionFolderName,
                product_folder: hierarchy.productFolderName
            });
        }

        await writeJsonFile(dataDir, 'product_files_meta.json', filesMeta);
        await writeJsonFile(dataDir, 'product_files_index.json', filesMeta);
        await writeJsonFile(configDir, 'ui_state.json', uiState);
        await writeJsonFile(configDir, 'session_state.json', sessionState);

        const manifest = {
            app: 'Printh3D Pro',
            version: 2,
            generated_at: new Date().toISOString(),
            stores: Object.fromEntries(listStoreNames().map(s => [s, (snapshot.stores[s] || []).length])),
            product_files_count: filesMeta.length,
            root_folder: DATA_FOLDER,
            file_structure: {
                mode: 'hierarchical_by_collection_and_product',
                collections_root: `${FILES_SUBFOLDER}/${FILES_COLLECTIONS_SUBFOLDER}`
            },
            cleanup_skipped: cleanupSkipped
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
        const tree = await listDirectoryTree(root, 0, 4);

        return {
            folderName: directoryHandle.name,
            dataFolder: DATA_FOLDER,
            manifest,
            tree
        };
    }

    async function restoreProductFilesFromHierarchy(root) {
        const productFiles = [];
        let filesRoot = null;
        let collectionsRoot = null;

        try {
            filesRoot = await root.getDirectoryHandle(FILES_SUBFOLDER, { create: false });
            collectionsRoot = await filesRoot.getDirectoryHandle(FILES_COLLECTIONS_SUBFOLDER, { create: false });
        } catch (_) {
            return productFiles;
        }

        for await (const [collectionName, collectionHandle] of collectionsRoot.entries()) {
            if (collectionHandle.kind !== 'directory') continue;

            for await (const [productFolderName, productHandle] of collectionHandle.entries()) {
                if (productHandle.kind !== 'directory') continue;
                const productId = parseIdFromFolderName(productFolderName);
                if (!productId) continue;

                for await (const [typeDirName, typeDirHandle] of productHandle.entries()) {
                    if (typeDirHandle.kind !== 'directory') continue;
                    const fileType = FILE_TYPE_BY_DIR[typeDirName] || 'other';

                    for await (const [diskName, fileHandle] of typeDirHandle.entries()) {
                        if (fileHandle.kind !== 'file') continue;
                        const file = await fileHandle.getFile();
                        const binary = await file.arrayBuffer();
                        const parsedName = parseProductFileIdsFromDiskName(diskName);

                        productFiles.push({
                            id: parsedName.fileId || undefined,
                            product_id: productId,
                            nome_arquivo: parsedName.originalName,
                            tipo: fileType,
                            mime_type: inferMimeTypeByName(parsedName.originalName, file.type || 'application/octet-stream'),
                            blob: binary,
                            tamanho_bytes: file.size,
                            created_at: new Date(file.lastModified || Date.now()).toISOString()
                        });
                    }
                }
            }
        }

        return productFiles;
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

        let filesMeta = await readJsonFile(dataDir, 'product_files_index.json', null);
        if (!Array.isArray(filesMeta)) {
            filesMeta = await readJsonFile(dataDir, 'product_files_meta.json', []);
        }
        const productFiles = [];

        if (Array.isArray(filesMeta) && filesMeta.length > 0) {
            for (const meta of filesMeta) {
                if (!meta || !meta.relative_path) continue;
                const binary = await readBinaryFileByRelativePath(root, meta.relative_path);
                if (!binary) continue;
                const row = { ...meta, blob: binary };
                delete row.relative_path;
                delete row.collection_folder;
                delete row.product_folder;
                productFiles.push(row);
            }
        } else {
            const rebuilt = await restoreProductFilesFromHierarchy(root);
            productFiles.push(...rebuilt);
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
            '- files/collections/: divisão por coleção (categoria) e produto',
            '- files/collections/<colecao>/<produto>/images|models_3d|documents|others: arquivos binários do produto',
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
        openProductFolder,
        connectDirectory,
        disconnectDirectory,
        syncFromDatabase,
        restoreToDatabase
    };
})();
