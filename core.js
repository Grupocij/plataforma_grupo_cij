// core.js - MOTOR CENTRAL DO PORTAL GRUPO CIJ

import { initializeApp } from "https://www.gstatic.com/firebasejs/11.6.1/firebase-app.js";
import { getAuth, signInWithEmailAndPassword, onAuthStateChanged, signOut, sendPasswordResetEmail, setPersistence, browserLocalPersistence, browserSessionPersistence } from "https://www.gstatic.com/firebasejs/11.6.1/firebase-auth.js";
import { getFirestore, collection, doc, setDoc, deleteDoc, onSnapshot, getDocs, persistentLocalCache, persistentMultipleTabManager, initializeFirestore } from "https://www.gstatic.com/firebasejs/11.6.1/firebase-firestore.js";

// REGISTRO DO SERVICE WORKER E MANIFESTO (PWA / OFFLINE)
if (!document.querySelector('link[rel="manifest"]')) {
    const manifestLink = document.createElement('link');
    manifestLink.rel = 'manifest';
    manifestLink.href = 'manifest.json';
    document.head.appendChild(manifestLink);
}

if ('serviceWorker' in navigator) {
    window.addEventListener('load', () => {
        navigator.serviceWorker.register('sw.js');
    });
}

// LÓGICA DO BOTÃO "INSTALAR APP"
window.deferredPrompt = null;
window.addEventListener('beforeinstallprompt', (e) => {
    e.preventDefault();
    window.deferredPrompt = e;
    const btnDesktop = document.getElementById('btn-install-pwa');
    const btnMobile = document.getElementById('btn-install-pwa-mobile');
    if(btnDesktop) btnDesktop.classList.remove('hidden');
    if(btnMobile) btnMobile.classList.remove('hidden');
});

window.installPWA = async () => {
    if (window.deferredPrompt) {
        window.deferredPrompt.prompt();
        const { outcome } = await window.deferredPrompt.userChoice;
        if (outcome === 'accepted') {
            document.getElementById('btn-install-pwa')?.classList.add('hidden');
            document.getElementById('btn-install-pwa-mobile')?.classList.add('hidden');
        }
        window.deferredPrompt = null;
    }
};

const injectLayout = () => {
    if (document.querySelector('header')) return;

    // ESTILOS DO MENU SECRETO DA DIRETORIA
    const style = document.createElement('style');
    style.innerHTML = `
        #cat-diretoria { display: none !important; }
        body.diretoria-unlocked #cat-diretoria { display: flex !important; }
        .mobile-secret { display: none !important; }
        body.diretoria-unlocked .mobile-secret { display: flex !important; }
    `;
    document.head.appendChild(style);

    const layoutHTML = `
    <!-- TELA DE LOGIN -->
    <div id="login-screen" class="fixed inset-0 z-[9999] bg-slate-900 flex items-center justify-center p-4 hidden">
        <div class="bg-white rounded-3xl shadow-2xl p-8 max-w-md w-full border border-slate-200 text-center space-y-6">
            <div class="flex flex-col items-center justify-center gap-2">
                <svg class="w-16 h-16" viewBox="0 0 100 100" fill="none" xmlns="http://www.w3.org/2000/svg">
                    <path d="M50 10 L85 45 L50 80 L15 45 Z" fill="#002D72"/>
                    <path d="M50 20 L75 45 L50 70 L25 45 Z" fill="#0077C8" fill-opacity="0.8"/>
                    <path d="M50 30 L65 45 L50 60 L35 45 Z" fill="#64B5F6"/>
                </svg>
                <h1 class="text-2xl font-black text-[#002d72] tracking-tight mt-1">PORTAL GRUPO CIJ</h1>
                <p id="login-message" class="text-xs font-semibold text-slate-500">Acesso Restrito</p>
            </div>
            <form id="auth-form" class="space-y-4 text-left" onsubmit="window.handleLogin(event)">
                <div>
                    <label class="block text-xs font-bold text-slate-700 uppercase mb-1">E-mail Corporativo</label>
                    <input type="email" id="auth-email" required placeholder="seu.nome@grupocij.com.br" class="w-full px-3.5 py-2.5 bg-slate-50 border border-slate-300 rounded-xl text-xs outline-none focus:border-blue-600 font-medium text-slate-900">
                </div>
                <div>
                    <label class="block text-xs font-bold text-slate-700 uppercase mb-1">Senha</label>
                    <input type="password" id="auth-password" required placeholder="••••••••" class="w-full px-3.5 py-2.5 bg-slate-50 border border-slate-300 rounded-xl text-xs outline-none focus:border-blue-600 text-slate-900">
                </div>
                
                <div class="flex items-center justify-between text-xs pt-1">
                    <label class="flex items-center gap-2 text-slate-600 font-semibold cursor-pointer select-none">
                        <input type="checkbox" id="lembrar-dispositivo" class="w-4 h-4 text-blue-600 rounded border-slate-300 cursor-pointer"> Lembrar neste dispositivo
                    </label>
                    <button type="button" onclick="window.esqueciMinhaSenha()" class="text-blue-600 hover:text-blue-800 font-bold transition cursor-pointer">Esqueci a senha?</button>
                </div>

                <button type="submit" class="w-full py-3 bg-[#002d72] hover:bg-blue-900 text-white font-extrabold rounded-xl text-xs transition shadow-lg flex items-center justify-center gap-2 cursor-pointer mt-2">
                    <i class="fa-solid fa-right-to-bracket"></i> Entrar
                </button>
            </form>
        </div>
    </div>

    <!-- CABEÇALHO SUPERIOR FIXO -->
    <header class="bg-[#0f172a] text-white shadow-md border-b border-slate-800 sticky top-0 z-[9990] h-16 shrink-0 w-full no-print">
        <div class="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 h-full">
            <div class="flex items-center justify-between h-full gap-4">
                
                <div class="flex items-center gap-4 shrink-0 w-full lg:w-auto">
                    <div class="flex items-center gap-3">
                        <div class="p-1.5 bg-white/10 rounded-xl flex items-center justify-center border border-white/20 hidden sm:flex">
                            <svg style="width: 28px; height: 28px; display: inline-block;" viewBox="0 0 100 100" fill="none" xmlns="http://www.w3.org/2000/svg">
                                <path d="M50 10 L85 45 L50 80 L15 45 Z" fill="#0077C8"/>
                                <path d="M50 20 L75 45 L50 70 L25 45 Z" fill="#64B5F6"/>
                            </svg>
                        </div>
                        <div class="flex flex-col justify-center hidden sm:flex">
                            <!-- BOTÃO SECRETO AQUI (id="secret-trigger-btn") -->
                            <span id="secret-trigger-btn" class="text-[10px] font-extrabold uppercase tracking-wider text-amber-300 bg-amber-950 px-2 py-0.5 rounded border border-amber-800 cursor-pointer select-none transition hover:bg-amber-900">COMERCIAL & GESTÃO</span>
                            <span id="user-role-badge-top" class="text-[9px] font-bold text-slate-400 mt-0.5">Verificando...</span>
                        </div>
                    </div>

                    <div class="relative w-full sm:w-64 ml-2">
                        <i class="fa-solid fa-magnifying-glass absolute left-3 top-2.5 text-slate-400 text-xs"></i>
                        <input type="text" id="global-search-input" onkeyup="window.filterGlobalModules()" placeholder="Buscar módulo..." class="w-full pl-8 pr-3 py-1.5 text-xs bg-slate-800 border border-slate-700 text-slate-200 rounded-lg focus:outline-none focus:ring-1 focus:ring-blue-500 focus:bg-slate-700 transition-all placeholder-slate-500">
                        <ul id="global-search-results" class="absolute left-0 right-0 mt-1 bg-white border border-slate-200 rounded-lg shadow-2xl overflow-hidden z-[9999] hidden max-h-60 overflow-y-auto custom-scrollbar"></ul>
                    </div>
                </div>

                <nav class="hidden lg:flex items-center gap-1 flex-1 justify-center h-full" id="desktop-nav-menu">
                    
                    <!-- SERVIÇOS -->
                    <div class="relative group h-full flex items-center nav-category" id="cat-servicos">
                        <button class="px-3 py-2 text-xs font-bold text-slate-300 hover:text-white transition flex items-center gap-1.5 rounded-lg hover:bg-slate-800 cursor-pointer"><i class="fa-solid fa-truck-fast text-emerald-400"></i> Serviços <i class="fa-solid fa-chevron-down text-[9px] opacity-60 transition-transform group-hover:rotate-180"></i></button>
                        <div class="absolute top-14 left-1/2 -translate-x-1/2 mt-1 w-[28rem] bg-white rounded-2xl shadow-2xl border border-slate-200 opacity-0 invisible scale-95 z-[9999] transition-all transform origin-top group-hover:opacity-100 group-hover:visible group-hover:scale-100 overflow-hidden">
                            <div class="p-2 grid grid-cols-2 gap-1 text-slate-800">
                                <a href="suporte-mobile.html" data-module="suporte-mobile.html" class="nav-item flex items-start gap-3 p-2.5 rounded-xl hover:bg-slate-50 transition border border-transparent hover:border-slate-200"><div class="w-8 h-8 rounded-lg bg-blue-100 text-blue-700 flex items-center justify-center shrink-0"><i class="fa-solid fa-headset"></i></div><div><h4 class="text-xs font-bold text-slate-900 mt-1">Suporte OSR</h4><p class="text-[10px] text-slate-500">Novo Chamado Mobile</p></div></a>
                                <a href="servicos_osr.html" data-module="servicos_osr.html" class="nav-item flex items-start gap-3 p-2.5 rounded-xl hover:bg-slate-50 transition border border-transparent hover:border-slate-200"><div class="w-8 h-8 rounded-lg bg-indigo-100 text-indigo-700 flex items-center justify-center shrink-0"><i class="fa-solid fa-table-list"></i></div><div><h4 class="text-xs font-bold text-slate-900 mt-1">Gestão de OSR</h4><p class="text-[10px] text-slate-500">Painel de Atendimentos</p></div></a>
                                <a href="veiculos_mobile.html" data-module="veiculos_mobile.html" class="nav-item flex items-start gap-3 p-2.5 rounded-xl hover:bg-slate-50 transition border border-transparent hover:border-slate-200"><div class="w-8 h-8 rounded-lg bg-emerald-100 text-emerald-700 flex items-center justify-center shrink-0"><i class="fa-solid fa-car"></i></div><div><h4 class="text-xs font-bold text-slate-900 mt-1">Veículos Mobile</h4><p class="text-[10px] text-slate-500">Retirada da frota</p></div></a>
                            </div>
                        </div>
                    </div>

                    <!-- COMERCIAL -->
                    <div class="relative group h-full flex items-center nav-category" id="cat-comercial">
                        <button class="px-3 py-2 text-xs font-bold text-slate-300 hover:text-white transition flex items-center gap-1.5 rounded-lg hover:bg-slate-800 cursor-pointer"><i class="fa-solid fa-handshake text-blue-400"></i> Comercial <i class="fa-solid fa-chevron-down text-[9px] opacity-60 transition-transform group-hover:rotate-180"></i></button>
                        <div class="absolute top-14 left-1/2 -translate-x-1/2 mt-1 w-[32rem] bg-white rounded-2xl shadow-2xl border border-slate-200 opacity-0 invisible scale-95 z-[9999] transition-all transform origin-top group-hover:opacity-100 group-hover:visible group-hover:scale-100 overflow-hidden">
                            <div class="p-2 grid grid-cols-2 gap-1 text-slate-800">
                                <a href="simulador.html" data-module="simulador.html" class="nav-item flex items-start gap-3 p-2.5 rounded-xl hover:bg-slate-50 transition border border-transparent hover:border-slate-200"><div class="w-8 h-8 rounded-lg bg-teal-100 text-teal-600 flex items-center justify-center shrink-0"><i class="fa-solid fa-calculator"></i></div><div><h4 class="text-xs font-bold text-slate-900 mt-1">Simulador Financeiro</h4></div></a>
                                <a href="solicitacao.html" data-module="solicitacao.html" class="nav-item flex items-start gap-3 p-2.5 rounded-xl hover:bg-slate-50 transition border border-transparent hover:border-slate-200"><div class="w-8 h-8 rounded-lg bg-blue-100 text-blue-600 flex items-center justify-center shrink-0"><i class="fa-solid fa-file-signature"></i></div><div><h4 class="text-xs font-bold text-slate-900 mt-1">Solicitação CIJ</h4></div></a>
                                <a href="tabelas.html" data-module="tabelas.html" class="nav-item flex items-start gap-3 p-2.5 rounded-xl hover:bg-slate-50 transition border border-transparent hover:border-slate-200"><div class="w-8 h-8 rounded-lg bg-amber-100 text-amber-700 flex items-center justify-center shrink-0"><i class="fa-solid fa-file-pdf"></i></div><div><h4 class="text-xs font-bold text-slate-900 mt-1">Documentos Oficiais</h4></div></a>
                                <a href="ranking.html" data-module="ranking.html" class="nav-item flex items-start gap-3 p-2.5 rounded-xl hover:bg-slate-50 transition border border-transparent hover:border-slate-200"><div class="w-8 h-8 rounded-lg bg-orange-100 text-orange-500 flex items-center justify-center shrink-0"><i class="fa-solid fa-trophy"></i></div><div><h4 class="text-xs font-bold text-slate-900 mt-1">Ranking de Vendas</h4></div></a>
                            </div>
                        </div>
                    </div>

                    <!-- ESTOQUE -->
                    <div class="relative group h-full flex items-center nav-category" id="cat-estoque">
                        <button class="px-3 py-2 text-xs font-bold text-slate-300 hover:text-white transition flex items-center gap-1.5 rounded-lg hover:bg-slate-800 cursor-pointer"><i class="fa-solid fa-boxes-stacked text-cyan-400"></i> Estoque <i class="fa-solid fa-chevron-down text-[9px] opacity-60 transition-transform group-hover:rotate-180"></i></button>
                        <div class="absolute top-14 left-1/2 -translate-x-1/2 mt-1 w-64 bg-white rounded-2xl shadow-2xl border border-slate-200 opacity-0 invisible scale-95 z-[9999] transition-all transform origin-top group-hover:opacity-100 group-hover:visible group-hover:scale-100 overflow-hidden">
                            <div class="p-2 flex flex-col gap-1 text-slate-800">
                                <a href="estoque-novos.html" data-module="estoque-novos.html" class="nav-item flex items-start gap-3 p-2.5 rounded-xl hover:bg-slate-50 transition border border-transparent hover:border-slate-200"><div class="w-8 h-8 rounded-lg bg-cyan-100 text-cyan-700 flex items-center justify-center shrink-0"><i class="fa-solid fa-boxes-stacked"></i></div><div><h4 class="text-xs font-bold text-slate-900 mt-1">Estoque Novos</h4></div></a>
                                <a href="estoque.html" data-module="estoque.html" class="nav-item flex items-start gap-3 p-2.5 rounded-xl hover:bg-slate-50 transition border border-transparent hover:border-slate-200"><div class="w-8 h-8 rounded-lg bg-slate-200 text-slate-700 flex items-center justify-center shrink-0"><i class="fa-solid fa-box-open"></i></div><div><h4 class="text-xs font-bold text-slate-900 mt-1">Estoque Usados/Geral</h4></div></a>
                            </div>
                        </div>
                    </div>

                    <!-- ADMINISTRATIVO -->
                    <div class="relative group h-full flex items-center nav-category" id="cat-admin">
                        <button class="px-3 py-2 text-xs font-bold text-slate-300 hover:text-white transition flex items-center gap-1.5 rounded-lg hover:bg-slate-800 cursor-pointer"><i class="fa-solid fa-shield-halved text-purple-400"></i> Administrativo <i class="fa-solid fa-chevron-down text-[9px] opacity-60 transition-transform group-hover:rotate-180"></i></button>
                        <div class="absolute top-14 left-1/2 -translate-x-1/2 mt-1 w-[32rem] bg-white rounded-2xl shadow-2xl border border-slate-200 opacity-0 invisible scale-95 z-[9999] transition-all transform origin-top group-hover:opacity-100 group-hover:visible group-hover:scale-100 overflow-hidden">
                            <div class="p-2 grid grid-cols-2 gap-1 text-slate-800">
                                <a href="solicitacoes-lista.html" data-module="solicitacoes-lista.html" class="nav-item flex items-start gap-3 p-2.5 rounded-xl hover:bg-slate-50 transition border border-transparent hover:border-slate-200"><div class="w-8 h-8 rounded-lg bg-orange-100 text-orange-600 flex items-center justify-center shrink-0"><i class="fa-solid fa-list-check"></i></div><div><h4 class="text-xs font-bold text-slate-900 mt-1">Lista Solicitações</h4></div></a>
                                <a href="veiculos.html" data-module="veiculos.html" class="nav-item flex items-start gap-3 p-2.5 rounded-xl hover:bg-slate-50 transition border border-transparent hover:border-slate-200"><div class="w-8 h-8 rounded-lg bg-teal-100 text-teal-800 flex items-center justify-center shrink-0"><i class="fa-solid fa-car-tunnel"></i></div><div><h4 class="text-xs font-bold text-slate-900 mt-1">Veículos Gerencial</h4></div></a>
                                <a href="vendas.html" data-module="vendas.html" class="nav-item flex items-start gap-3 p-2.5 rounded-xl hover:bg-slate-50 transition border border-transparent hover:border-slate-200"><div class="w-8 h-8 rounded-lg bg-rose-100 text-rose-700 flex items-center justify-center shrink-0"><i class="fa-solid fa-cart-shopping"></i></div><div><h4 class="text-xs font-bold text-slate-900 mt-1">Vendas (Saídas)</h4></div></a>
                                <a href="admin.html" data-module="admin.html" class="nav-item flex items-start gap-3 p-2.5 rounded-xl hover:bg-slate-50 transition border border-transparent hover:border-slate-200"><div class="w-8 h-8 rounded-lg bg-purple-100 text-purple-700 flex items-center justify-center shrink-0"><i class="fa-solid fa-shield-halved"></i></div><div><h4 class="text-xs font-bold text-slate-900 mt-1">Painel Diretoria</h4></div></a>
                                <a href="usuarios.html" data-module="usuarios.html" class="nav-item flex items-start gap-3 p-2.5 rounded-xl hover:bg-slate-50 transition border border-transparent hover:border-slate-200"><div class="w-8 h-8 rounded-lg bg-slate-800 text-slate-100 flex items-center justify-center shrink-0"><i class="fa-solid fa-users-gear"></i></div><div><h4 class="text-xs font-bold text-slate-900 mt-1">Gerenciar Usuários</h4></div></a>
                            </div>
                        </div>
                    </div>

                    <!-- FINANCEIRO -->
                    <div class="relative group h-full flex items-center nav-category" id="cat-financeiro">
                        <button class="px-3 py-2 text-xs font-bold text-slate-300 hover:text-white transition flex items-center gap-1.5 rounded-lg hover:bg-slate-800 cursor-pointer"><i class="fa-solid fa-sack-dollar text-amber-400"></i> Financeiro <i class="fa-solid fa-chevron-down text-[9px] opacity-60 transition-transform group-hover:rotate-180"></i></button>
                        <div class="absolute top-14 right-0 mt-1 w-[38rem] bg-white rounded-2xl shadow-2xl border border-slate-200 opacity-0 invisible scale-95 z-[9999] transition-all transform origin-top group-hover:opacity-100 group-hover:visible group-hover:scale-100 overflow-hidden">
                            <div class="p-2 grid grid-cols-2 gap-1 text-slate-800">
                                <a href="despesas.html" data-module="despesas.html" class="nav-item flex items-start gap-3 p-2.5 rounded-xl hover:bg-slate-50 transition border border-transparent hover:border-slate-200"><div class="w-8 h-8 rounded-lg bg-sky-100 text-sky-600 flex items-center justify-center shrink-0"><i class="fa-solid fa-receipt"></i></div><div><h4 class="text-xs font-bold text-slate-900 mt-1">Controle Despesas</h4></div></a>
                                <a href="dashboard_despesas.html" data-module="dashboard_despesas.html" class="nav-item flex items-start gap-3 p-2.5 rounded-xl hover:bg-slate-50 transition border border-transparent hover:border-slate-200"><div class="w-8 h-8 rounded-lg bg-emerald-100 text-emerald-700 flex items-center justify-center shrink-0"><i class="fa-solid fa-chart-pie"></i></div><div><h4 class="text-xs font-bold text-slate-900 mt-1">Dashboard Gerencial</h4></div></a>
                                <a href="comissoes-azul.html" data-module="comissoes-azul.html" class="nav-item flex items-start gap-3 p-2.5 rounded-xl hover:bg-slate-50 transition border border-transparent hover:border-slate-200"><div class="w-8 h-8 rounded-lg bg-indigo-100 text-indigo-700 flex items-center justify-center shrink-0"><i class="fa-solid fa-chart-line"></i></div><div><h4 class="text-xs font-bold text-slate-900 mt-1">Comissões Azul</h4></div></a>
                                <a href="comissoes-consumiveis.html" data-module="comissoes-consumiveis.html" class="nav-item flex items-start gap-3 p-2.5 rounded-xl hover:bg-slate-50 transition border border-transparent hover:border-slate-200"><div class="w-8 h-8 rounded-lg bg-amber-100 text-amber-700 flex items-center justify-center shrink-0"><i class="fa-solid fa-file-invoice-dollar"></i></div><div><h4 class="text-xs font-bold text-slate-900 mt-1">Com. Consumíveis</h4></div></a>
                                <a href="comissoes-representantes.html" data-module="comissoes-representantes.html" class="nav-item flex items-start gap-3 p-2.5 rounded-xl hover:bg-slate-50 transition border border-transparent hover:border-slate-200"><div class="w-8 h-8 rounded-lg bg-cyan-100 text-cyan-800 flex items-center justify-center shrink-0"><i class="fa-solid fa-hand-holding-dollar"></i></div><div><h4 class="text-xs font-bold text-slate-900 mt-1">Com. Representantes</h4></div></a>
                            </div>
                        </div>
                    </div>

                    <!-- DIRETORIA (SECRETO) -->
                    <div class="relative group h-full flex items-center nav-category" id="cat-diretoria">
                        <button class="px-3 py-2 text-xs font-bold text-slate-300 hover:text-white transition flex items-center gap-1.5 rounded-lg hover:bg-slate-800 cursor-pointer"><i class="fa-solid fa-vault text-amber-500"></i> Diretoria <i class="fa-solid fa-chevron-down text-[9px] opacity-60 transition-transform group-hover:rotate-180"></i></button>
                        <div class="absolute top-14 right-0 mt-1 w-64 bg-white rounded-2xl shadow-2xl border border-slate-200 opacity-0 invisible scale-95 z-[9999] transition-all transform origin-top group-hover:opacity-100 group-hover:visible group-hover:scale-100 overflow-hidden">
                            <div class="p-2 flex flex-col gap-1 text-slate-800">
                                <a href="diretoria-custos.html" data-module="diretoria-custos.html" class="nav-item flex items-start gap-3 p-2.5 rounded-xl hover:bg-slate-50 transition border border-transparent hover:border-slate-200"><div class="w-8 h-8 rounded-lg bg-amber-100 text-amber-700 flex items-center justify-center shrink-0"><i class="fa-solid fa-scale-balanced"></i></div><div><h4 class="text-xs font-bold text-slate-900 mt-1">Custos & Margens</h4></div></a>
                            </div>
                        </div>
                    </div>

                </nav>

                <div class="flex items-center gap-2 shrink-0">
                    <button id="btn-install-pwa" onclick="window.installPWA()" class="hidden lg:flex px-3 py-1.5 rounded-lg text-xs font-bold bg-gradient-to-r from-blue-600 to-indigo-600 hover:from-blue-700 hover:to-indigo-700 text-white shadow-md transition items-center gap-1.5 cursor-pointer border border-blue-400/50">
                        <i class="fa-solid fa-download"></i> Instalar App
                    </button>
                    <a href="index.html" class="hidden lg:flex px-3 py-1.5 rounded-lg text-xs font-bold text-slate-300 hover:text-white transition items-center gap-1.5 hover:bg-slate-800"><i class="fa-solid fa-house"></i> Home</a>
                    <button onclick="window.fazerLogout()" class="hidden lg:flex px-3 py-1.5 rounded-lg text-xs font-bold bg-red-950/60 hover:bg-red-900 text-red-300 border border-red-800 transition items-center gap-1.5 cursor-pointer"><i class="fa-solid fa-right-from-bracket"></i> Sair</button>
                    <button onclick="window.toggleMobileMenu()" class="lg:hidden text-slate-300 hover:text-white text-xl p-1 px-2 border border-slate-700 rounded-lg bg-slate-800 cursor-pointer">
                        <i class="fa-solid fa-bars"></i>
                    </button>
                </div>
            </div>
        </div>
    </header>

    <div id="mobile-overlay" onclick="window.toggleMobileMenu()" class="fixed inset-0 bg-black/60 z-[105] hidden opacity-0 transition-opacity duration-300 backdrop-blur-sm lg:hidden"></div>
    <div id="mobile-sidebar" class="fixed inset-y-0 right-0 w-[280px] bg-[#0f172a] shadow-2xl z-[110] transform translate-x-full transition-transform duration-300 border-l border-slate-700 flex flex-col lg:hidden">
        <div class="p-5 flex justify-between items-center border-b border-slate-800 bg-[#0b1120]">
            <span class="font-bold text-white text-sm uppercase tracking-wider">Módulos</span>
            <button onclick="window.toggleMobileMenu()" class="text-slate-400 hover:text-white text-2xl"><i class="fa-solid fa-xmark"></i></button>
        </div>
        <div class="flex-1 overflow-y-auto p-4 space-y-2" id="mobile-menu-container"></div>
        <div class="p-4 border-t border-slate-800 bg-[#0b1120] space-y-2">
            <button id="btn-install-pwa-mobile" onclick="window.installPWA()" class="hidden w-full py-2.5 rounded-xl text-xs font-bold bg-gradient-to-r from-blue-600 to-indigo-600 text-white transition flex items-center justify-center gap-2 cursor-pointer shadow-md"><i class="fa-solid fa-download"></i> Instalar Aplicativo</button>
            <button onclick="window.fazerLogout()" class="w-full py-2.5 rounded-xl text-xs font-bold bg-red-950/60 hover:bg-red-900 text-red-300 border border-red-800 transition flex items-center justify-center gap-2 cursor-pointer"><i class="fa-solid fa-right-from-bracket"></i> Sair da Conta</button>
        </div>
    </div>
    `;

    document.body.insertAdjacentHTML('afterbegin', layoutHTML);

    // ==========================================
    // LÓGICA DO BOTÃO SECRETO (KONAMI CODE)
    // ==========================================
    let secretClicks = 0;
    let secretTimeout;
    const secretBtn = document.getElementById('secret-trigger-btn');
    
    if (secretBtn) {
        secretBtn.addEventListener('click', () => {
            secretClicks++;
            clearTimeout(secretTimeout);
            
            // Reseta a contagem se demorar mais que 1 segundo
            secretTimeout = setTimeout(() => { secretClicks = 0; }, 1000);
            
            // Se clicar 3 vezes rápidas
            if (secretClicks >= 3) {
                document.body.classList.toggle('diretoria-unlocked');
                secretClicks = 0; // zera para próxima tentativa
            }
        });
    }
};

injectLayout();

const firebaseConfig = {
    apiKey: "AIzaSyDW05GuYDxXUCmtWfSxhfap1-l6_qkNspw",
    authDomain: "plataforma-cij.firebaseapp.com",
    projectId: "plataforma-cij",
    storageBucket: "plataforma-cij.firebasestorage.app",
    messagingSenderId: "949985395100",
    appId: "1:949985395100:web:cf881e0c91c63175228859"
};

const app = initializeApp(firebaseConfig);
const auth = getAuth(app);

// Ativando a Persistência de Dados Offline no Firebase V11
let db;
try {
    db = initializeFirestore(app, {
        localCache: persistentLocalCache({ tabManager: persistentMultipleTabManager() })
    });
} catch (error) {
    db = getFirestore(app);
}

window.AppAuth = auth;
window.AppDB = db;
window.fsCollection = collection;
window.fsDoc = doc;
window.fsSetDoc = setDoc;
window.fsDeleteDoc = deleteDoc;
window.fsOnSnapshot = onSnapshot;
window.fsGetDocs = getDocs;

const globalModulesMap = [
    { name: 'Suporte OSR', url: 'suporte-mobile.html', icon: 'fa-headset text-blue-500' },
    { name: 'Gestão de OSR', url: 'servicos_osr.html', icon: 'fa-table-list text-indigo-500' },
    { name: 'Veículos Mobile', url: 'veiculos_mobile.html', icon: 'fa-car text-emerald-600' },
    { name: 'Simulador Financeiro', url: 'simulador.html', icon: 'fa-calculator text-teal-600' },
    { name: 'Solicitação CIJ', url: 'solicitacao.html', icon: 'fa-file-signature text-blue-600' },
    { name: 'Documentos Oficiais', url: 'tabelas.html', icon: 'fa-file-pdf text-amber-600' },
    { name: 'Ranking de Vendas', url: 'ranking.html', icon: 'fa-trophy text-orange-500' },
    { name: 'Estoque Novos', url: 'estoque-novos.html', icon: 'fa-boxes-stacked text-cyan-600' },
    { name: 'Estoque Usados/Geral', url: 'estoque.html', icon: 'fa-box-open text-slate-600' },
    { name: 'Lista de Solicitações', url: 'solicitacoes-lista.html', icon: 'fa-list-check text-orange-600' },
    { name: 'Veículos Gerencial', url: 'veiculos.html', icon: 'fa-car-tunnel text-teal-700' },
    { name: 'Vendas (Saídas)', url: 'vendas.html', icon: 'fa-cart-shopping text-rose-600' },
    { name: 'Painel Diretoria', url: 'admin.html', icon: 'fa-shield-halved text-purple-600' },
    { name: 'Gerenciar Usuários', url: 'usuarios.html', icon: 'fa-users-gear text-slate-800' },
    { name: 'Controle de Despesas', url: 'despesas.html', icon: 'fa-receipt text-sky-600' },
    { name: 'Dashboard Gerencial', url: 'dashboard_despesas.html', icon: 'fa-chart-pie text-emerald-700' },
    { name: 'Comissões Azul', url: 'comissoes-azul.html', icon: 'fa-chart-line text-indigo-600' },
    { name: 'Com. Consumíveis', url: 'comissoes-consumiveis.html', icon: 'fa-file-invoice-dollar text-amber-700' },
    { name: 'Com. Representantes', url: 'comissoes-representantes.html', icon: 'fa-hand-holding-dollar text-cyan-800' },
    { name: 'Custos & Margens (Diretoria)', url: 'diretoria-custos.html', icon: 'fa-scale-balanced text-amber-600' }
];

window.filterGlobalModules = function() {
    const input = document.getElementById('global-search-input').value.toLowerCase();
    const resultBox = document.getElementById('global-search-results');
    
    if (input.length < 1) { resultBox.classList.add('hidden'); return; }

    const allowedUrls = Array.from(document.querySelectorAll('#desktop-nav-menu a.nav-item'))
                             .filter(a => a.style.display !== 'none')
                             .map(a => a.getAttribute('href'));

    // Inclui sempre o módulo secreto de diretoria na busca SE ele estiver destrancado na tela
    if (document.body.classList.contains('diretoria-unlocked')) {
        allowedUrls.push('diretoria-custos.html');
    }

    const filtered = globalModulesMap.filter(m => m.name.toLowerCase().includes(input) && allowedUrls.includes(m.url));

    if (filtered.length > 0) {
        resultBox.innerHTML = filtered.map(m => `
            <li class="border-b border-slate-100 last:border-0">
                <a href="${m.url}" class="flex items-center gap-3 p-3 hover:bg-slate-50 transition text-xs font-bold text-slate-700">
                    <div class="w-8 h-8 rounded-lg bg-slate-100 flex items-center justify-center shrink-0"><i class="fa-solid ${m.icon}"></i></div>
                    ${m.name}
                </a>
            </li>
        `).join('');
        resultBox.classList.remove('hidden');
    } else {
        resultBox.innerHTML = `<li class="p-4 text-center text-xs text-slate-500 font-medium">Nenhum módulo encontrado.</li>`;
        resultBox.classList.remove('hidden');
    }
};

document.addEventListener('click', function(e) {
    const searchBox = document.getElementById('global-search-results');
    if (searchBox && !e.target.closest('.relative.w-full.sm\\:w-64')) {
        searchBox.classList.add('hidden');
    }
});

window.toggleMobileMenu = function() {
    const sidebar = document.getElementById('mobile-sidebar');
    const overlay = document.getElementById('mobile-overlay');
    if(sidebar.classList.contains('translate-x-full')) {
        sidebar.classList.remove('translate-x-full');
        overlay.classList.remove('hidden');
        setTimeout(() => overlay.classList.remove('opacity-0'), 10);
    } else {
        sidebar.classList.add('translate-x-full');
        overlay.classList.add('opacity-0');
        setTimeout(() => overlay.classList.add('hidden'), 300);
    }
};

window.fazerLogout = () => signOut(auth);

window.handleLogin = async (e) => {
    e.preventDefault();
    const email = document.getElementById('auth-email').value;
    const password = document.getElementById('auth-password').value;
    const lembrar = document.getElementById('lembrar-dispositivo')?.checked || false;

    try {
        await setPersistence(auth, lembrar ? browserLocalPersistence : browserSessionPersistence);
        await signInWithEmailAndPassword(auth, email, password);
    } catch (err) {
        alert("Erro no login: E-mail ou senha incorretos.");
    }
};

window.esqueciMinhaSenha = async () => {
    const email = document.getElementById('auth-email').value.trim();
    if (!email) {
        alert("Por favor, preencha o campo de e-mail corporativo primeiro para recuperar a senha.");
        document.getElementById('auth-email').focus();
        return;
    }
    try {
        await sendPasswordResetEmail(auth, email);
        alert("E-mail de redefinição de senha enviado com sucesso! Verifique sua caixa de entrada.");
    } catch (err) {
        alert("Erro ao enviar e-mail de recuperação: " + err.message);
    }
};

window.aplicarPermissoesDeModulos = function(dbUser) {
    const modulosPermitidos = dbUser.modulos || []; 
    const isAdminTotal = dbUser.perfil === 'Admin';

    const allLinks = document.querySelectorAll('a.nav-item');
    allLinks.forEach(link => {
        const url = link.getAttribute('data-module');
        if (isAdminTotal || modulosPermitidos.includes(url)) link.style.display = 'flex';
        else link.style.display = 'none';
    });

    const categories = document.querySelectorAll('.nav-category');
    categories.forEach(cat => {
        const linksInside = Array.from(cat.querySelectorAll('a.nav-item'));
        const hasVisibleLink = linksInside.some(l => l.style.display !== 'none');
        
        // Mantém a categoria sempre visível SE ela tiver um link visível (e que não seja o menu diretoria)
        if (hasVisibleLink && cat.id !== 'cat-diretoria') cat.style.display = 'flex';
        else if (cat.id !== 'cat-diretoria') cat.style.display = 'none';
    });

    const mobContainer = document.getElementById('mobile-menu-container');
    if(mobContainer) {
        mobContainer.innerHTML = '<a href="index.html" class="flex items-center gap-3 p-3 bg-slate-800 rounded-xl text-slate-200 text-sm font-bold border border-slate-700 hover:bg-slate-700"><i class="fa-solid fa-house text-blue-400"></i> Home</a>';
        
        globalModulesMap.forEach(m => {
            if (isAdminTotal || modulosPermitidos.includes(m.url)) {
                const isSecret = m.url === 'diretoria-custos.html' ? 'mobile-secret' : '';
                mobContainer.innerHTML += `<a href="${m.url}" class="${isSecret} flex items-center gap-3 p-3 bg-slate-800 rounded-xl text-slate-200 text-sm font-bold border border-slate-700 hover:bg-slate-700"><i class="fa-solid ${m.icon} w-5 text-center"></i> ${m.name}</a>`;
            }
        });
    }

    const badgeTop = document.getElementById('user-role-badge-top');
    if(badgeTop) badgeTop.innerText = dbUser.perfil + ' • ' + (dbUser.nome || window.currentUser.email.split('@')[0].toUpperCase());
};

onAuthStateChanged(auth, async (user) => {
    const loginScreen = document.getElementById('login-screen');
    if (user) {
        if(loginScreen) loginScreen.classList.add('hidden');
        
        const cleanEmail = (user.email || '').toLowerCase().trim();
        let dbUser = { 
            email: cleanEmail, 
            nome: cleanEmail.split('@')[0].toUpperCase(), 
            perfil: 'Vendedor', 
            visaoGlobalPorTela: {},
            modulos: [] 
        };
        
        const masterAdmins = ['adm@grupocij.com', 'marcos@grupocij.com'];
        if (masterAdmins.includes(cleanEmail)) {
            dbUser.perfil = 'Admin';
            dbUser.visaoGlobalPorTela = { 
                'despesas.html': true, 
                'comissoes-azul.html': true, 
                'veiculos.html': true, 
                'ranking.html': true, 
                'solicitacoes-lista.html': true,
                'vendas.html': true,
                'servicos_osr.html': true
            };
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
        
        const isAdminTotal = dbUser.perfil === 'Admin';
        const vg = dbUser.visaoGlobalPorTela || {};
        
        window.userVisaoDespesas = isAdminTotal || vg['despesas.html'] === true || vg.despesas === true;
        window.userVisaoComissoes = isAdminTotal || vg['comissoes-azul.html'] === true || vg.comissoes === true;
        window.userVisaoVeiculos = isAdminTotal || vg['veiculos.html'] === true || vg['veiculos_mobile.html'] === true || vg.veiculos === true;
        window.userVisaoRanking = isAdminTotal || vg['ranking.html'] === true || vg.ranking === true;
        window.userVisaoSolicitacoes = isAdminTotal || vg['solicitacoes-lista.html'] === true || vg.solicitacoes === true;
        window.userVisaoGlobal = isAdminTotal || vg['servicos_osr.html'] === true;

        window.aplicarPermissoesDeModulos(dbUser);
        
        if (typeof window.initModule === 'function') window.initModule(dbUser.perfil);
    } else {
        if(loginScreen) loginScreen.classList.remove('hidden');
        const authForm = document.getElementById('auth-form');
        if(authForm) authForm.classList.remove('hidden');
    }
});
