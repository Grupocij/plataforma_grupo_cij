(function () {
    'use strict';

    const BASE = ['artifacts', 'plataforma-cij', 'public', 'data'];

    const state = {
        clientes: [],
        parque: [],
        modelos: [],
        usuarios: [],
        osr: []
    };

    const fontes = [
        { key: 'clientes', collection: 'cadastros_clientes', label: 'Clientes', desc: 'Fonte oficial de clientes' },
        { key: 'parque', collection: 'parque_maquinas', label: 'Parque de Máquinas', desc: 'Máquinas físicas / números de série' },
        { key: 'modelos', collection: 'cadastros_equipamentos', label: 'Cadastro de Equipamentos', desc: 'Catálogo de modelos e fabricantes' },
        { key: 'usuarios', collection: 'usuarios_permissoes', label: 'Usuários e acessos', desc: 'Usuários atuais do Portal CIJ' },
        { key: 'osr', collection: 'suportes_osr', label: 'OSR / Legado', desc: 'Leitura do legado; não será alterado' }
    ];

    function toast(message) {
        const el = document.getElementById('assistencia-toast');
        if (!el) return;
        el.textContent = message;
        el.classList.remove('hidden');
        clearTimeout(window.__assistToastTimer);
        window.__assistToastTimer = setTimeout(() => el.classList.add('hidden'), 2600);
    }

    function getCollection(name) {
        return window.fsCollection(window.AppDB, ...BASE, name);
    }

    async function readCollection(name) {
        const snap = await window.fsGetDocs(getCollection(name));
        const rows = [];
        snap.forEach(docSnap => rows.push({ id: docSnap.id, ...docSnap.data() }));
        return rows;
    }

    function renderIntegrations(results) {
        const container = document.getElementById('integration-list');
        if (!container) return;

        container.innerHTML = fontes.map(f => {
            const r = results[f.key];
            const ok = r && r.ok;
            const detail = ok ? `${r.count} registro(s) lido(s)` : (r?.error || 'Não foi possível ler');
            return `
                <div class="integration-row">
                    <div>
                        <div class="integration-title">${f.label}</div>
                        <div class="integration-desc">${f.desc}</div>
                    </div>
                    <span class="status-badge ${ok ? 'status-ok' : 'status-error'}">
                        ${ok ? 'OK' : 'ERRO'} · ${detail}
                    </span>
                </div>`;
        }).join('');
    }

    function renderKpis() {
        document.getElementById('kpi-clientes').textContent = state.clientes.length;
        document.getElementById('kpi-parque').textContent = state.parque.length;
        document.getElementById('kpi-modelos').textContent = state.modelos.length;
        document.getElementById('kpi-usuarios').textContent = state.usuarios.length;
        document.getElementById('kpi-osr').textContent = state.osr.length;
    }

    function renderUser(perfil) {
        document.getElementById('user-name').textContent =
            window.nomeUsuarioLogado || window.userProfile?.nome || '-';

        document.getElementById('user-email').textContent =
            window.currentUser?.email || window.userProfile?.email || '-';

        document.getElementById('user-profile').textContent =
            perfil || window.userProfile?.perfil || '-';
    }

    function renderLegacy() {
        const tbody = document.getElementById('legacy-table');
        if (!tbody) return;

        const rows = [...state.osr]
            .sort((a, b) => (b.timestamp || 0) - (a.timestamp || 0))
            .slice(0, 10);

        if (!rows.length) {
            tbody.innerHTML = `<tr><td colspan="4" class="p-6 text-center text-slate-400 font-semibold">Nenhum registro encontrado.</td></tr>`;
            return;
        }

        tbody.innerHTML = rows.map(item => `
            <tr class="border-b border-slate-100">
                <td class="p-3 font-black text-slate-800">${item.osr || item.id || '-'}</td>
                <td class="p-3">${item.clienteOS || item.cliente || '-'}</td>
                <td class="p-3">${item.status || '-'}</td>
                <td class="p-3">${item.tecnicoOS || item.tecnico_kanban || item.tecnico || '-'}</td>
            </tr>
        `).join('');
    }

    async function carregarTudo() {
        const status = document.getElementById('status-geral');
        if (status) {
            status.className = 'status-badge status-pending';
            status.textContent = 'Carregando...';
        }

        const results = {};

        for (const fonte of fontes) {
            try {
                const rows = await readCollection(fonte.collection);
                state[fonte.key] = rows;
                results[fonte.key] = { ok: true, count: rows.length };
            } catch (error) {
                console.error(`[Assistência] Erro ao ler ${fonte.collection}:`, error);
                state[fonte.key] = [];
                results[fonte.key] = { ok: false, error: error?.message || 'Erro de leitura' };
            }
        }

        renderKpis();
        renderLegacy();
        renderIntegrations(results);

        const allOk = Object.values(results).every(r => r.ok);
        if (status) {
            status.className = `status-badge ${allOk ? 'status-ok' : 'status-error'}`;
            status.textContent = allOk ? 'Integrações OK' : 'Verificar integração';
        }

        toast(allOk ? 'Leitura concluída com sucesso.' : 'Leitura concluída com avisos.');
    }

    window.assistenciaAtualizar = carregarTudo;

    window.initModule = function (perfil) {
        document.getElementById('login-screen')?.classList.add('hidden');
        document.getElementById('main-content')?.classList.remove('hidden');
        renderUser(perfil);
        carregarTudo();
    };
})();
