onAuthStateChanged(auth, async (user) => {
    const loginScreen = document.getElementById('login-screen');
    if (user) {
        const cleanEmail = (user.email || '').toLowerCase().trim();
        let dbUser = { 
            email: cleanEmail, 
            nome: cleanEmail.split('@')[0].toUpperCase(), 
            perfil: 'Vendedor', 
            visaoGlobalPorTela: { despesas: false, comissoes: false, veiculos: false, ranking: false, solicitacoes: false },
            modulos: [] 
        };
        
        const masterAdmins = ['adm@grupocij.com', 'marcos@grupocij.com'];
        if (masterAdmins.includes(cleanEmail)) {
            dbUser.perfil = 'Admin';
            dbUser.visaoGlobalPorTela = { despesas: true, comissoes: true, veiculos: true, ranking: true, solicitacoes: true };
        }

        try {
            const snap = await getDocs(collection(db, 'artifacts', 'plataforma-cij', 'public', 'data', 'usuarios_permissoes'));
            snap.forEach(d => { 
                if (d.data().email.toLowerCase() === cleanEmail) {
                    dbUser = d.data();
                }
            });
        } catch (e) {}

        window.currentUser = user;
        window.nomeUsuarioLogado = dbUser.nome;
        
        // DISPONIBILIZA AS VISÕES GLOBAIS INDIVIDUAIS NA SESSÃO
        const isAdminTotal = dbUser.perfil === 'Admin';
        const vg = dbUser.visaoGlobalPorTela || {};
        
        window.userVisaoDespesas = isAdminTotal || vg.despesas === true;
        window.userVisaoComissoes = isAdminTotal || vg.comissoes === true;
        window.userVisaoVeiculos = isAdminTotal || vg.veiculos === true;
        window.userVisaoRanking = isAdminTotal || vg.ranking === true;
        window.userVisaoSolicitacoes = isAdminTotal || vg.solicitacoes === true;
        window.userVisaoGlobal = isAdminTotal;

        window.aplicarPermissoesDeModulos(dbUser);
        
        if (typeof window.initModule === 'function') window.initModule(dbUser.perfil);
        else loginScreen.classList.add('hidden'); 
    } else {
        loginScreen.classList.remove('hidden');
        document.getElementById('auth-form').classList.remove('hidden');
    }
});