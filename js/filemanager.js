// ============================================
// PRINTH3D PRO — Gerenciador de Arquivos
// Upload, galeria, download e ZIP por produto
// ============================================

const FileManager = (() => {

    const ACCEPTED_TYPES = {
        image: ['.jpg', '.jpeg', '.png', '.webp', '.gif', '.bmp'],
        model3d: ['.stl', '.obj', '.3mf', '.step', '.stp'],
        document: ['.pdf', '.doc', '.docx', '.txt']
    };

    const MAX_FILE_SIZE = 50 * 1024 * 1024; // 50MB

    function getAllAcceptedExtensions() {
        return [...ACCEPTED_TYPES.image, ...ACCEPTED_TYPES.model3d, ...ACCEPTED_TYPES.document].join(',');
    }

    async function getProductFiles(productId) {
        return await Database.getProductFiles(productId);
    }

    async function addFile(productId, file) {
        // Validar tamanho
        if (file.size > MAX_FILE_SIZE) {
            throw new Error(`Arquivo muito grande (${formatFileSize(file.size)}). Máximo: 50MB.`);
        }

        // Validar extensão
        const ext = '.' + file.name.split('.').pop().toLowerCase();
        const allExts = [...ACCEPTED_TYPES.image, ...ACCEPTED_TYPES.model3d, ...ACCEPTED_TYPES.document];
        if (!allExts.includes(ext)) {
            throw new Error(`Extensão "${ext}" não suportada.`);
        }

        return await Database.addProductFile(productId, file);
    }

    async function addMultipleFiles(productId, files) {
        const results = [];
        const errors = [];

        for (const file of files) {
            try {
                const result = await addFile(productId, file);
                results.push(result);
            } catch (err) {
                errors.push({ file: file.name, error: err.message });
            }
        }

        return { results, errors };
    }

    async function deleteFile(fileId) {
        return await Database.deleteById(Database.STORES.PRODUCT_FILES, fileId);
    }

    async function getFileBlob(fileId) {
        const file = await Database.getById(Database.STORES.PRODUCT_FILES, fileId);
        if (!file || !file.blob) throw new Error('Arquivo não encontrado.');
        return new Blob([file.blob], { type: file.mime_type });
    }

    async function downloadFile(fileId) {
        const file = await Database.getById(Database.STORES.PRODUCT_FILES, fileId);
        if (!file || !file.blob) throw new Error('Arquivo não encontrado.');

        const blob = new Blob([file.blob], { type: file.mime_type });
        const url = URL.createObjectURL(blob);
        const a = document.createElement('a');
        a.href = url;
        a.download = file.nome_arquivo;
        a.click();
        URL.revokeObjectURL(url);
    }

    async function getImageThumbnailUrl(fileId) {
        const file = await Database.getById(Database.STORES.PRODUCT_FILES, fileId);
        if (!file || !file.blob || file.tipo !== 'image') return null;

        const blob = new Blob([file.blob], { type: file.mime_type });
        return URL.createObjectURL(blob);
    }

    async function getFirstImageUrl(productId) {
        const files = await getProductFiles(productId);
        const firstImage = files.find(f => f.tipo === 'image');
        if (!firstImage || !firstImage.blob) return null;

        const blob = new Blob([firstImage.blob], { type: firstImage.mime_type });
        return URL.createObjectURL(blob);
    }

    async function getProductCoverUrl(product) {
        if (!product || !product.id) return null;
        const files = await getProductFiles(product.id);
        if (!files || files.length === 0) return null;

        let coverImage = null;
        if (product.cover_file_id) {
            coverImage = files.find(f => f.id === product.cover_file_id && f.tipo === 'image');
        }
        if (!coverImage) {
            coverImage = files.find(f => f.tipo === 'image');
        }
        if (!coverImage || !coverImage.blob) return null;

        const blob = new Blob([coverImage.blob], { type: coverImage.mime_type });
        return URL.createObjectURL(blob);
    }

    function formatFileSize(bytes) {
        if (bytes === 0) return '0 B';
        const k = 1024;
        const sizes = ['B', 'KB', 'MB', 'GB'];
        const i = Math.floor(Math.log(bytes) / Math.log(k));
        return parseFloat((bytes / Math.pow(k, i)).toFixed(1)) + ' ' + sizes[i];
    }

    function getFileIcon(tipo) {
        switch (tipo) {
            case 'image': return 'image';
            case 'model3d': return 'box';
            case 'document': return 'file-text';
            default: return 'file';
        }
    }

    // Renderiza a galeria de arquivos para o modal de produto
    function renderFileGallery(files, productId, coverFileId = null) {
        if (!files || files.length === 0) {
            return `
                <div class="file-gallery-empty">
                    <i data-lucide="image-off"></i>
                    <p>Nenhum arquivo adicionado.</p>
                </div>
            `;
        }

        return `
            <div class="file-gallery">
                ${files.map(f => {
                    const icon = getFileIcon(f.tipo);
                    const size = formatFileSize(f.tamanho_bytes);
                    const isImage = f.tipo === 'image';
                    const isCover = isImage && Number(coverFileId) === Number(f.id);

                    return `
                        <div class="file-item" data-file-id="${f.id}">
                            <div class="file-preview ${isImage ? 'file-preview-image' : ''}">
                                ${isImage
                                    ? `<img class="file-thumb" data-file-id="${f.id}" alt="${f.nome_arquivo}">`
                                    : `<i data-lucide="${icon}"></i>`
                                }
                            </div>
                            <div class="file-info">
                                <span class="file-name" title="${f.nome_arquivo}">${f.nome_arquivo}</span>
                                <span class="file-size">${size}</span>
                            </div>
                            <div class="file-actions">
                                ${isImage ? `
                                <button type="button" class="btn btn-sm ${isCover ? 'btn-primary' : 'btn-secondary'}" onclick="App.setProductCover(${productId}, ${f.id})" title="${isCover ? 'Imagem de capa atual' : 'Definir como capa'}">
                                    <i data-lucide="star"></i> ${isCover ? 'Capa' : 'Definir capa'}
                                </button>` : ''}
                                <button type="button" class="btn btn-sm btn-icon" onclick="FileManager.downloadFile(${f.id})" title="Baixar">
                                    <i data-lucide="download"></i>
                                </button>
                                <button type="button" class="btn btn-sm btn-icon btn-danger-ghost" onclick="App.removeProductFile(${f.id}, ${productId})" title="Excluir">
                                    <i data-lucide="trash-2"></i>
                                </button>
                            </div>
                        </div>
                    `;
                }).join('')}
            </div>
        `;
    }

    // Carrega thumbnails após renderização
    async function loadThumbnails() {
        const thumbs = document.querySelectorAll('img.file-thumb[data-file-id]');
        for (const img of thumbs) {
            const fileId = parseInt(img.dataset.fileId);
            try {
                const url = await getImageThumbnailUrl(fileId);
                if (url) img.src = url;
            } catch (e) {
                console.error('Erro ao carregar thumbnail:', e);
            }
        }
    }

    // Renderiza upload zone
    function renderUploadZone(productId) {
        return `
            <div class="upload-zone" id="upload-zone"
                 ondrop="FileManager.handleDrop(event, ${productId})"
                 ondragover="FileManager.handleDragOver(event)"
                 ondragleave="FileManager.handleDragLeave(event)">
                <i data-lucide="upload-cloud"></i>
                <p>Arraste arquivos aqui ou</p>
                <label class="btn btn-secondary btn-sm" for="file-upload-input">
                    <i data-lucide="paperclip"></i> Selecionar Arquivos
                </label>
                <input type="file" id="file-upload-input" multiple hidden
                       accept="${getAllAcceptedExtensions()}"
                       onchange="FileManager.handleFileSelect(event, ${productId})">
                <small>Imagens, STL, OBJ, 3MF, PDF (máx. 50MB por arquivo)</small>
            </div>
            <div id="upload-progress" class="upload-progress hidden"></div>
        `;
    }

    function handleDragOver(e) {
        e.preventDefault();
        e.stopPropagation();
        e.currentTarget.classList.add('drag-over');
    }

    function handleDragLeave(e) {
        e.preventDefault();
        e.stopPropagation();
        e.currentTarget.classList.remove('drag-over');
    }

    async function handleDrop(e, productId) {
        e.preventDefault();
        e.stopPropagation();
        e.currentTarget.classList.remove('drag-over');

        const files = Array.from(e.dataTransfer.files);
        if (files.length === 0) return;

        await processUpload(productId, files);
    }

    async function handleFileSelect(e, productId) {
        const files = Array.from(e.target.files);
        if (files.length === 0) return;

        await processUpload(productId, files);
        e.target.value = '';
    }

    async function processUpload(productId, files) {
        const progressEl = document.getElementById('upload-progress');
        if (progressEl) {
            progressEl.classList.remove('hidden');
            progressEl.innerHTML = `<div class="upload-bar"><div class="upload-fill" style="width:0%"></div></div><span>Enviando 0/${files.length}...</span>`;
        }

        const results = [];
        const errors = [];

        for (let i = 0; i < files.length; i++) {
            try {
                const result = await addFile(productId, files[i]);
                results.push(result);
            } catch (err) {
                errors.push({ file: files[i].name, error: err.message });
            }
            if (progressEl) {
                const pct = Math.round(((i + 1) / files.length) * 100);
                progressEl.innerHTML = `<div class="upload-bar"><div class="upload-fill" style="width:${pct}%"></div></div><span>Enviando ${i + 1}/${files.length}...</span>`;
            }
        }

        if (progressEl) {
            setTimeout(() => progressEl.classList.add('hidden'), 1500);
        }

        // Refresh file gallery
        if (typeof App !== 'undefined' && App.refreshProductFiles) {
            await App.refreshProductFiles(productId);
        }

        if (errors.length > 0) {
            const msgs = errors.map(e => `${e.file}: ${e.error}`).join('\n');
            if (typeof App !== 'undefined') App.showToast(`${errors.length} erro(s) no upload:\n${msgs}`, 'warning');
        }
        if (results.length > 0) {
            if (typeof App !== 'undefined') App.showToast(`${results.length} arquivo(s) enviado(s)!`, 'success');
        }
    }

    async function downloadProductZip(productId) {
        try {
            await Database.exportProductZip(productId);
        } catch (err) {
            if (typeof App !== 'undefined') App.showToast('Erro ao gerar ZIP: ' + err.message, 'danger');
        }
    }

    return {
        ACCEPTED_TYPES,
        getProductFiles,
        addFile,
        addMultipleFiles,
        deleteFile,
        downloadFile,
        getFileBlob,
        getImageThumbnailUrl,
        getFirstImageUrl,
        getProductCoverUrl,
        formatFileSize,
        getFileIcon,
        renderFileGallery,
        renderUploadZone,
        loadThumbnails,
        handleDragOver,
        handleDragLeave,
        handleDrop,
        handleFileSelect,
        downloadProductZip
    };
})();
