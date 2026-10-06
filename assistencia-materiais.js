/* Integração Assistência CIJ 1.79.0: mantém a navegação e o fluxo técnico existente. */
(function(){'use strict';
 window.__CIJMateriaisAssistencia=true;
 function selected(eid){return window.AssistMateriaisBridge.selected(eid);}
 async function refresh(){return window.AssistMateriaisBridge.refresh();}
 window.abrirPecasEquipamento=async eid=>{try{const {o,e}=selected(eid);await window.MaterialOS.open(o,e,refresh);}catch(err){alert(err.message);}};
 window.revisarTemporarioParque=async eid=>{try{const {o,e}=selected(eid);await window.MaterialOS.convert(o,e,refresh);}catch(err){alert(err.message);}};
 window.liberarEntregaMateriais=async eid=>{try{const {o,e}=selected(eid);await window.MaterialOS.release(o,e,refresh);}catch(err){alert(err.message);}};
 window.faturarEquipamentoMateriais=async eid=>{try{const {o,e}=selected(eid);await window.MaterialOS.equipmentBilling(o,e,refresh);}catch(err){alert(err.message);}};
 // Concluir a etapa técnica não decide automaticamente aplicação, devolução ou faturamento.
 window.solicitarConciliacaoMateriaisFinalizacao=async()=>[];
 window.aplicarConciliacaoMateriaisFinalizacao=async()=>[];
 const oldPrepare=window.prepararOSOffline;
 if(oldPrepare)window.prepararOSOffline=async function(){const result=await oldPrepare.apply(this,arguments);if(result&&navigator.onLine){try{await window.MaterialOS.prepare();}catch(e){window.AssistMateriaisBridge.notify('Preparo dos materiais incompleto: '+e.message);return false;}}return result;};
 const oldSync=window.sincronizarPendenciasOffline;
 if(oldSync){window.MaterialOS.beforeSync=()=>oldSync.call(window,false);window.sincronizarPendenciasOffline=async function(){const result=await oldSync.apply(this,arguments);if(navigator.onLine)await window.MaterialOS.sync();return result;};}
 const oldPermission=window.temPermissaoAssistencia;
 if(oldPermission)window.temPermissaoAssistencia=function(key){const map={faturar_encerrar:'faturar',reabrir_os:'tratar_ocorrencias',excluir_registros:'tratar_ocorrencias'};return !!(map[key]&&window.MaterialOS.can(map[key]))||oldPermission(key);};
 const oldHomologation=window.confirmarLimpezaHomologacao;
 if(oldHomologation)window.confirmarLimpezaHomologacao=()=>alert('Arquive as OS individualmente após resolver os materiais. A limpeza em lote não pode apagar a guarda ou o histórico de estoque.');
 // Temporary equipment is collected in the field; registration in the park belongs to review.
 const checkbox=document.getElementById('eq-temp-add-parque');if(checkbox){const label=checkbox.closest('label');if(label)label.innerHTML='<span class="text-xs text-slate-600">Este equipamento ficará temporário na OS. Após revisar os dados, o administrativo poderá cadastrá-lo no parque do cliente.</span>';}
})();
