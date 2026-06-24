// ===================== ESPECIAS CRUD =====================
let editingEspId = null;
function openModalEspecia(id) {
  editingEspId = id;
  document.getElementById('modal-esp-titulo').textContent = id ? 'Editar especia' : 'Nueva especia';
  var db = getDB();
  if (id) { var e=db.especias.find(function(x){return x.id===id}); if(e){document.getElementById('esp-nombre').value=e.nombre;document.getElementById('esp-precio').value=e.precioKg;document.getElementById('esp-100').value=Math.round(e.precioKg/100);document.getElementById('esp-stock').value=e.stock;document.getElementById('esp-stockmin').value=e.stockMin;} }
  else { document.getElementById('esp-nombre').value='';document.getElementById('esp-precio').value='';document.getElementById('esp-100').value='';document.getElementById('esp-stock').value='0';document.getElementById('esp-stockmin').value='500'; }
  openModal('modal-esp');
}
function calcEsp100(){var p=+document.getElementById('esp-precio').value;document.getElementById('esp-100').value=p?Math.round(p/100):'';}
function guardarEspecia(){
  var nombre=document.getElementById('esp-nombre').value.trim(),precio=+document.getElementById('esp-precio').value,stock=+document.getElementById('esp-stock').value,stockMin=+document.getElementById('esp-stockmin').value;
  if(!nombre||!precio){showAlert('alert-esp','Nombre y precio obligatorios','err');return;}
  var db=getDB(),obj={nombre:nombre,precioKg:precio,stock:stock,stockMin:stockMin};
  if(editingEspId){obj.id=editingEspId;var i=db.especias.findIndex(function(x){return x.id===editingEspId});if(i>=0)db.especias[i]=obj;}
  else{obj.id=nid();db.especias.push(obj);}
  saveDB(db);toast('Especia guardada ✓');setTimeout(function(){closeModal('modal-esp');},500);renderProductos();
}
function eliminarEspecia(id){if(!confirm('¿Eliminar especia?'))return;var db=getDB();db.especias=db.especias.filter(function(e){return e.id!==id});saveDB(db);toast('Eliminada');renderProductos();}

// ===================== STOCK ESPECIA =====================
function openModalStock(id) {
  var db=getDB(),e=db.especias.find(function(x){return x.id===id});if(!e)return;
  document.getElementById('ms-nombre').textContent=e.nombre+' — Stock';
  document.getElementById('ms-stock-actual').textContent=fmtG(e.stock);
  document.getElementById('ms-esp-id').value=id;
  document.getElementById('ms-tipo').value='entrada';document.getElementById('ms-cantidad').value='';document.getElementById('ms-nota-stock').value='';
  // Historial
  var hist=(db.movimientos||[]).filter(function(m){return m.espId===id;}).slice(-8).reverse();
  document.getElementById('ms-historial').innerHTML=hist.map(function(m){return '<div class="mov-row"><span class="'+(m.tipo==='entrada'?'mov-in':'mov-out')+'">'+(m.tipo==='entrada'?'+':'-')+' '+m.cantidad+'g</span><span style="flex:1">'+(m.nota||'')+'</span><span class="mov-date">'+fmtDateTime(m.fecha)+'</span></div>';}).join('')||'<div class="text-muted text-sm">Sin movimientos</div>';
  openModal('modal-stock');
}
function guardarMovimiento(){
  var id=+document.getElementById('ms-esp-id').value,tipo=document.getElementById('ms-tipo').value,cant=+document.getElementById('ms-cantidad').value,nota=document.getElementById('ms-nota-stock').value.trim();
  if(!cant||cant<=0){showAlert('alert-stock','Cantidad invalida','err');return;}
  var db=getDB(),esp=db.especias.find(function(e){return e.id===id});if(!esp)return;
  if(tipo==='entrada')esp.stock+=cant;else{if(cant>esp.stock){showAlert('alert-stock','Stock insuficiente','err');return;}esp.stock-=cant;}
  if(!db.movimientos)db.movimientos=[];
  db.movimientos.push({id:nid(),espId:id,tipo:tipo,cantidad:cant,nota:nota,fecha:new Date().toISOString(),usuario:currentUser?currentUser.nombre:'Sistema'});
  saveDB(db);toast('Movimiento registrado');openModalStock(id);
}

// ===================== BLENDS =====================
let blendIngRows=[],editingBlendId=null;
function openModalBlend(id){
  editingBlendId=id;blendIngRows=[];var db=getDB();
  document.getElementById('modal-blend-titulo').textContent=id?'Editar blend':'Nuevo Blend';
  if(id){var bl=db.blends.find(function(b){return b.id===id});if(bl){document.getElementById('bl-nombre').value=bl.nombre;document.getElementById('bl-peso-c').value=bl.pesoChico||'';document.getElementById('bl-peso-g').value=bl.pesoGrande||'';document.getElementById('bl-pventa-c').value=bl.pVentaChico||'';document.getElementById('bl-pventa-g').value=bl.pVentaGrande||'';document.getElementById('bl-notas').value=bl.notas||'';blendIngRows=bl.ingredientes.map(function(i){return{espId:i.espId,nombre:i.nombre,gramos:i.gramos,precioKg:i.precioKg,_rid:nid()};});}}
  else{document.getElementById('bl-nombre').value='';document.getElementById('bl-peso-c').value='';document.getElementById('bl-peso-g').value='';document.getElementById('bl-pventa-c').value='';document.getElementById('bl-pventa-g').value='';document.getElementById('bl-notas').value='';blendIngRows=[{_rid:nid(),espId:null,gramos:0,precioKg:0}];}
  renderIngRows();calcBlendModal();openModal('modal-blend');
}
function addIngRow(){blendIngRows.push({_rid:nid(),espId:null,gramos:0,precioKg:0});renderIngRows();}
function removeIngRow(rid){blendIngRows=blendIngRows.filter(function(r){return r._rid!==rid});renderIngRows();calcBlendModal();}
function renderIngRows(){
  var db=getDB();
  document.getElementById('blend-ings-rows').innerHTML=blendIngRows.map(function(r){
    return '<div class="ing-row"><select onchange="updateIngRow('+r._rid+',this.value)" style="flex:2"><option value="">— Especia —</option>'+db.especias.map(function(e){return '<option value="'+e.id+'"'+(r.espId==e.id?' selected':'')+'>'+e.nombre+' ('+fmt(e.precioKg)+'/kg)</option>';}).join('')+'</select><input type="number" value="'+r.gramos+'" min="0" oninput="updateIngGrams('+r._rid+',this.value)" placeholder="g" style="flex:1"><div class="ing-cost" id="ing-cost-'+r._rid+'">$0</div><button class="btn btn-red btn-sm" onclick="removeIngRow('+r._rid+')" style="padding:5px 8px">x</button></div>';
  }).join('');
}
function updateIngRow(rid,espId){var db=getDB(),r=blendIngRows.find(function(x){return x._rid===rid});if(!r)return;var esp=db.especias.find(function(e){return e.id==espId});r.espId=esp?esp.id:null;r.nombre=esp?esp.nombre:'';r.precioKg=esp?esp.precioKg:0;calcBlendModal();}
function updateIngGrams(rid,val){var r=blendIngRows.find(function(x){return x._rid===rid});if(r){r.gramos=+val||0;calcBlendModal();}}
function calcBlendModal(){
  var db=getDB(),c=db.costos,totalG=0,costoKg=0;
  blendIngRows.forEach(function(r){totalG+=r.gramos;costoKg+=(r.precioKg/1000)*r.gramos;var ce=document.getElementById('ing-cost-'+r._rid);if(ce)ce.textContent=fmt((r.precioKg/1000)*r.gramos);});
  var costo100g=costoKg/10,pChico=+document.getElementById('bl-peso-c').value,pGrande=+document.getElementById('bl-peso-g').value;
  var mpC=(costoKg/1000)*pChico,mpG=(costoKg/1000)*pGrande;
  var fC=c.envChico+c.pkgChico+c.etiqueta+c.mo+c.otros,fG=c.envGrande+c.pkgGrande+c.etiqueta+c.mo+c.otros;
  document.getElementById('bc-kg').textContent=fmt(costoKg);document.getElementById('bc-100').textContent=fmt(costo100g);
  document.getElementById('bc-grams').textContent=totalG!==1000?'Formula: '+totalG+'g / 1kg':'Formula: 1000g';
  document.getElementById('bc-tot-c').textContent=fmt(mpC+fC);document.getElementById('bc-mp-c').textContent=fmt(mpC);document.getElementById('bc-fij-c').textContent=fmt(fC);
  document.getElementById('bc-tot-g').textContent=fmt(mpG+fG);document.getElementById('bc-mp-g').textContent=fmt(mpG);document.getElementById('bc-fij-g').textContent=fmt(fG);
}
function guardarBlend(){
  var nombre=document.getElementById('bl-nombre').value.trim();if(!nombre){showAlert('alert-blend','Nombre obligatorio','err');return;}
  if(!blendIngRows.filter(function(r){return r.espId}).length){showAlert('alert-blend','Agrega al menos una especia','err');return;}
  var db=getDB(),obj={nombre:nombre,ingredientes:blendIngRows.filter(function(r){return r.espId}).map(function(r){return{espId:r.espId,nombre:r.nombre,gramos:r.gramos,precioKg:r.precioKg};}),pesoChico:+document.getElementById('bl-peso-c').value,pesoGrande:+document.getElementById('bl-peso-g').value,pVentaChico:+document.getElementById('bl-pventa-c').value,pVentaGrande:+document.getElementById('bl-pventa-g').value,notas:document.getElementById('bl-notas').value.trim()};
  if(editingBlendId){obj.id=editingBlendId;var i=db.blends.findIndex(function(b){return b.id===editingBlendId});if(i>=0)db.blends[i]=obj;}
  else{obj.id=nid();db.blends.push(obj);}
  saveDB(db);toast('Blend guardado ✓');setTimeout(function(){closeModal('modal-blend');},500);renderBlends();
}
function toggleBlend(id){var b=document.getElementById('bb-'+id);if(b)b.classList.toggle('open');var a=document.getElementById('arr-'+id);if(a)a.textContent=b&&b.classList.contains('open')?'▲':'▼';}
function eliminarBlend(id){if(!confirm('¿Eliminar blend?'))return;var db=getDB();db.blends=db.blends.filter(function(b){return b.id!==id});saveDB(db);toast('Eliminado');renderBlends();}
function renderBlends(){
  var db=getDB(),c=db.costos,el=document.getElementById('lista-blends');
  if(!db.blends.length){el.innerHTML='<div class="empty"><div class="empty-icon">🫙</div><p>No hay blends.</p></div>';return;}
  el.innerHTML=db.blends.map(function(bl){
    var cd=calcBlendCostData(bl,c),pr=calcProduccion(bl,db.especias),tg=bl.ingredientes.reduce(function(s,i){return s+i.gramos;},0);
    return '<div class="blend-card"><div class="blend-header" onclick="toggleBlend('+bl.id+')"><div><div class="blend-name">'+bl.nombre+'</div><div class="flex gap-8" style="margin-top:5px;flex-wrap:wrap"><span class="badge ba">Costo/kg: '+fmt(cd.costoKg)+'</span><span class="badge ba">Costo/100g: '+fmt(cd.costo100g)+'</span>'+(tg!==1000?'<span class="badge by">'+tg+'g/1kg</span>':'')+'</div></div><div class="flex gap-8 items-center" onclick="event.stopPropagation()"><button class="btn btn-ghost btn-sm" onclick="openModalBlend('+bl.id+')">✏ Editar</button>'+(currentUser&&currentUser.rol==='admin'?'<button class="btn btn-red btn-sm" onclick="eliminarBlend('+bl.id+')">🗑</button>':'')+'<span id="arr-'+bl.id+'" class="text-muted text-xs" style="padding:4px">▼</span></div></div><div class="blend-body" id="bb-'+bl.id+'"><div class="blend-inner">'+(bl.notas?'<div class="cost-box mb-16" style="border-color:var(--gold-dim)"><span class="text-xs text-muted">📝 Notas: </span>'+bl.notas+'</div>':'')+'<h3 style="margin-bottom:10px">Ingredientes — formula /1kg</h3><div class="tw mb-16"><table><thead><tr><th>Especia</th><th>Gramos</th><th>%</th><th>Costo</th></tr></thead><tbody>'+bl.ingredientes.map(function(i){return '<tr><td>'+i.nombre+'</td><td>'+i.gramos+'g</td><td class="text-muted">'+Math.round(i.gramos/10)+'%</td><td class="text-gold">'+fmt((i.precioKg/1000)*i.gramos)+'</td></tr>';}).join('')+'<tr style="font-weight:700"><td>TOTAL</td><td>'+tg+'g</td><td>'+Math.round(tg/10)+'%</td><td class="text-gold">'+fmt(cd.costoKg)+'</td></tr></tbody></table></div><div class="g2"><div class="cost-box"><div class="fw7 text-gold text-sm mb-12">ENVASE CHICO '+(bl.pesoChico?'('+bl.pesoChico+'g)':'— sin peso')+'</div><div class="cost-row"><span>Mat. prima</span><span>'+fmt(cd.mpChico)+'</span></div><div class="cost-row"><span>Envase + extras</span><span>'+fmt(cd.fijosC)+'</span></div><div class="cost-row total"><span>Costo total</span><span>'+fmt(cd.totalC)+'</span></div>'+(bl.pVentaChico?'<div class="cost-row" style="margin-top:6px"><span>Precio venta</span><span class="text-green fw7">'+fmt(bl.pVentaChico)+'</span></div><div class="cost-row '+(cd.margenC>0?'profit':'loss')+'"><span>Margen</span><span>'+(cd.margenC!==null?Math.round(cd.margenC)+'%':'—')+'</span></div>':'<div class="text-muted text-xs" style="margin-top:6px">Sin precio</div>')+'<div class="divider"></div><div class="cost-row text-xs"><span class="text-muted">Produccion posible</span><span class="text-gold fw7">'+pr.unidadesC+' u.</span></div></div><div class="cost-box"><div class="fw7 text-gold text-sm mb-12">ENVASE GRANDE '+(bl.pesoGrande?'('+bl.pesoGrande+'g)':'— sin peso')+'</div><div class="cost-row"><span>Mat. prima</span><span>'+fmt(cd.mpGrande)+'</span></div><div class="cost-row"><span>Envase + extras</span><span>'+fmt(cd.fijosG)+'</span></div><div class="cost-row total"><span>Costo total</span><span>'+fmt(cd.totalG)+'</span></div>'+(bl.pVentaGrande?'<div class="cost-row" style="margin-top:6px"><span>Precio venta</span><span class="text-green fw7">'+fmt(bl.pVentaGrande)+'</span></div><div class="cost-row '+(cd.margenG>0?'profit':'loss')+'"><span>Margen</span><span>'+(cd.margenG!==null?Math.round(cd.margenG)+'%':'—')+'</span></div>':'<div class="text-muted text-xs" style="margin-top:6px">Sin precio</div>')+'<div class="divider"></div><div class="cost-row text-xs"><span class="text-muted">Produccion posible</span><span class="text-gold fw7">'+pr.unidadesG+' u.</span></div></div></div></div></div>';
  }).join('');
}

// ===================== EXPORT BLENDS EXCEL =====================
function exportBlendsExcel(){
  var db=getDB();if(!db.blends.length){toast('No hay blends','err');return;}
  if(typeof XLSX!=='undefined'){_doExportBlendsExcel();return;}
  toast('Cargando libreria Excel...');var s=document.createElement('script');s.src='https://cdn.sheetjs.com/xlsx-0.20.3/package/dist/xlsx.full.min.js';s.onload=function(){_doExportBlendsExcel();};s.onerror=function(){toast('Error al cargar Excel','err');};document.head.appendChild(s);
}
function _doExportBlendsExcel(){
  var db=getDB(),c=db.costos;
  var resumen=db.blends.map(function(bl){var cd=calcBlendCostData(bl,c),pr=calcProduccion(bl,db.especias),tg=bl.ingredientes.reduce(function(s,i){return s+i.gramos;},0);return{Nombre:bl.nombre,Ingredientes:bl.ingredientes.map(function(i){return i.nombre+' ('+i.gramos+'g)'}).join(', '),'Costo/kg':Math.round(cd.costoKg),'Costo/100g':Math.round(cd.costo100g),'Peso chico':bl.pesoChico||'','Costo chico':Math.round(cd.totalC),'Precio chico':bl.pVentaChico||'','Margen chico':cd.margenC!==null?Math.round(cd.margenC)+'%':'','Prod. chico':pr.unidadesC,'Peso grande':bl.pesoGrande||'','Costo grande':Math.round(cd.totalG),'Precio grande':bl.pVentaGrande||'','Margen grande':cd.margenG!==null?Math.round(cd.margenG)+'%':'','Prod. grande':pr.unidadesG,Notas:bl.notas||''};});
  var ings=[];db.blends.forEach(function(bl){var cd=calcBlendCostData(bl,c),tg=bl.ingredientes.reduce(function(s,i){return s+i.gramos;},0);bl.ingredientes.forEach(function(ing,idx){ings.push({Blend:bl.nombre,'#':idx+1,Especia:ing.nombre,Gramos:ing.gramos,'%':Math.round(ing.gramos/10)+'%','Precio/kg':ing.precioKg||0,'Costo':Math.round((ing.precioKg/1000)*ing.gramos)});});ings.push({Blend:'SUBTOTAL','#':'',Especia:bl.ingredientes.length+' items',Gramos:tg,'%':Math.round(tg/10)+'%','Precio/kg':'','Costo':Math.round(cd.costoKg)});ings.push({Blend:'','#':'',Especia:'',Gramos:'','%':'','Precio/kg':'','Costo':''});});
  var wb=XLSX.utils.book_new();
  var ws1=XLSX.utils.json_to_sheet(resumen);ws1['!cols']=[{wch:22},{wch:55},{wch:12},{wch:12},{wch:14},{wch:14},{wch:14},{wch:12},{wch:12},{wch:14},{wch:14},{wch:12},{wch:14},{wch:12},{wch:35}];XLSX.utils.book_append_sheet(wb,ws1,'Resumen Blends');
  var ws2=XLSX.utils.json_to_sheet(ings);ws2['!cols']=[{wch:24},{wch:4},{wch:24},{wch:10},{wch:8},{wch:12},{wch:12}];XLSX.utils.book_append_sheet(wb,ws2,'Ingredientes');
  XLSX.writeFile(wb,'Arcano_Blends_'+new Date().toISOString().slice(0,10)+'.xlsx');toast('Excel descargado');
}

// ===================== ENVASES CRUD =====================
let editingEnvId=null;
function openModalEnvase(id){
  editingEnvId=id;var db=getDB();
  document.getElementById('modal-env-titulo').textContent=id?'Editar envase':'Nuevo envase';
  if(id){var e=(db.envases||[]).find(function(x){return x.id===id});if(e){document.getElementById('env-nombre').value=e.nombre;document.getElementById('env-tipo').value=e.tipo;document.getElementById('env-peso').value=e.peso||'';document.getElementById('env-stock').value=e.stock;document.getElementById('env-stockmin').value=e.stockMin;document.getElementById('env-precio').value=e.precio;}}
  else{document.getElementById('env-nombre').value='';document.getElementById('env-tipo').value='chico';document.getElementById('env-peso').value='';document.getElementById('env-stock').value='0';document.getElementById('env-stockmin').value='20';document.getElementById('env-precio').value='0';}
  openModal('modal-env');
}
function guardarEnvase(){
  var nombre=document.getElementById('env-nombre').value.trim(),tipo=document.getElementById('env-tipo').value,peso=+document.getElementById('env-peso').value,stock=+document.getElementById('env-stock').value,stockMin=+document.getElementById('env-stockmin').value,precio=+document.getElementById('env-precio').value;
  if(!nombre){showAlert('alert-env','Nombre obligatorio','err');return;}
  var db=getDB();if(!db.envases)db.envases=[];var obj={nombre:nombre,tipo:tipo,peso:peso,stock:stock,stockMin:stockMin,precio:precio};
  if(editingEnvId){obj.id=editingEnvId;var i=db.envases.findIndex(function(x){return x.id===editingEnvId});if(i>=0)db.envases[i]=obj;}
  else{obj.id=nid();db.envases.push(obj);}
  saveDB(db);toast('Envase guardado ✓');setTimeout(function(){closeModal('modal-env');},500);renderEnvases();
}
function eliminarEnvase(id){if(!confirm('¿Eliminar envase?'))return;var db=getDB();db.envases=(db.envases||[]).filter(function(e){return e.id!==id});saveDB(db);toast('Eliminado');renderEnvases();}
function openModalEnvStock(id){
  var db=getDB(),e=(db.envases||[]).find(function(x){return x.id===id});if(!e)return;
  document.getElementById('me-nombre').textContent=e.nombre;document.getElementById('me-stock-actual').textContent=e.stock+' u.';document.getElementById('me-env-id').value=id;
  document.getElementById('me-tipo').value='entrada';document.getElementById('me-cantidad').value='';document.getElementById('me-nota').value='';
  var hist=(db.movEnvases||[]).filter(function(m){return m.envId===id;}).slice(-8).reverse();
  document.getElementById('me-historial').innerHTML=hist.map(function(m){return '<div class="mov-row"><span class="'+(m.tipo==='entrada'?'mov-in':'mov-out')+'">'+(m.tipo==='entrada'?'+':'-')+' '+m.cantidad+' u.</span><span style="flex:1">'+(m.nota||'')+'</span><span class="mov-date">'+fmtDateTime(m.fecha)+'</span></div>';}).join('')||'<div class="text-muted text-sm">Sin movimientos</div>';
  openModal('modal-env-stock');
}
function guardarMovEnvase(){
  var id=+document.getElementById('me-env-id').value,tipo=document.getElementById('me-tipo').value,cant=+document.getElementById('me-cantidad').value,nota=document.getElementById('me-nota').value.trim();
  if(!cant||cant<=0){showAlert('alert-env-stock','Cantidad invalida','err');return;}
  var db=getDB();if(!db.envases)db.envases=[];if(!db.movEnvases)db.movEnvases=[];
  var env=db.envases.find(function(e){return e.id===id});if(!env)return;
  if(tipo==='entrada')env.stock+=cant;else{if(cant>env.stock){showAlert('alert-env-stock','Stock insuficiente','err');return;}env.stock-=cant;}
  db.movEnvases.push({id:nid(),envId:id,tipo:tipo,cantidad:cant,nota:nota,fecha:new Date().toISOString(),usuario:currentUser?currentUser.nombre:'Sistema'});
  saveDB(db);toast('Movimiento registrado');openModalEnvStock(id);
}

// ===================== VENTAS =====================
let ventaItems=[],editingVentaId=null;
function openModalVenta(id){
  editingVentaId=id;ventaItems=[];var db=getDB();
  document.getElementById('modal-venta-titulo').textContent=id?'Editar venta':'Nueva venta';
  var sel=document.getElementById('v-prod-sel');sel.innerHTML='<option value="">-- Producto --</option>';
  sel.innerHTML+='<optgroup label="Blends — Chico">'+db.blends.filter(function(b){return b.pVentaChico>0}).map(function(b){return '<option value="bc-'+b.id+'">'+b.nombre+' (chico) — '+fmt(b.pVentaChico)+'</option>';}).join('')+'</optgroup>';
  sel.innerHTML+='<optgroup label="Blends — Grande">'+db.blends.filter(function(b){return b.pVentaGrande>0}).map(function(b){return '<option value="bg-'+b.id+'">'+b.nombre+' (grande) — '+fmt(b.pVentaGrande)+'</option>';}).join('')+'</optgroup>';
  sel.innerHTML+='<optgroup label="Especias">'+db.especias.filter(function(e){return e.precioKg>0}).map(function(e){return '<option value="e-'+e.id+'">'+e.nombre+'</option>';}).join('')+'</optgroup>';
  document.getElementById('v-desc').value='0';document.getElementById('v-estado').value='completada';document.getElementById('v-nota').value='';document.getElementById('v-qty').value='1';renderVentaItems();recalcVenta();openModal('modal-venta');
}
function agregarItemVenta(){
  var val=document.getElementById('v-prod-sel').value,qty=+document.getElementById('v-qty').value;if(!val||qty<=0)return;
  var db=getDB(),nombre='',precio=0;
  if(val.startsWith('bc-')){var bl=db.blends.find(function(b){return b.id==val.slice(3)});if(bl){nombre=bl.nombre+' (c)';precio=bl.pVentaChico;}}
  else if(val.startsWith('bg-')){var bl=db.blends.find(function(b){return b.id==val.slice(3)});if(bl){nombre=bl.nombre+' (g)';precio=bl.pVentaGrande;}}
  else if(val.startsWith('e-')){var e=db.especias.find(function(x){return x.id==val.slice(2)});if(e){nombre=e.nombre;precio=Math.round(e.precioKg/10);}}
  if(!precio)return;
  var existing=ventaItems.find(function(it){return it.key===val});
  if(existing)existing.qty+=qty;else ventaItems.push({key:val,nombre:nombre,precio:precio,qty:qty});
  renderVentaItems();recalcVenta();
}
function removerItemVenta(idx){ventaItems.splice(idx,1);renderVentaItems();recalcVenta();}
function renderVentaItems(){document.getElementById('v-items-lista').innerHTML=ventaItems.map(function(it,i){return '<div class="flex items-center justify-between" style="padding:6px 0;border-bottom:1px solid var(--border)"><span>'+it.nombre+' ×'+it.qty+'</span><span class="text-gold fw7">'+fmt(it.precio*it.qty)+'</span><button class="btn btn-red btn-sm" onclick="removerItemVenta('+i+')" style="padding:3px 7px">x</button></div>';}).join('')||'<div class="text-muted text-sm">Sin productos</div>';}
function recalcVenta(){
  var sub=ventaItems.reduce(function(s,it){return s+it.precio*it.qty;},0),desc=+document.getElementById('v-desc').value||0;
  document.getElementById('v-total').textContent=fmt(sub-desc);
}
function guardarVenta(){
  if(!ventaItems.length){showAlert('alert-venta','Agrega productos','err');return;}
  var sub=ventaItems.reduce(function(s,it){return s+it.precio*it.qty;},0),desc=+document.getElementById('v-desc').value||0;
  var db=getDB(),obj={id:nid(),fecha:new Date().toISOString(),items:ventaItems.slice(),subtotal:sub,descuento:desc,total:sub-desc,estado:document.getElementById('v-estado').value,nota:document.getElementById('v-nota').value.trim(),usuario:currentUser?currentUser.nombre:'Sistema'};
  if(editingVentaId){obj.id=editingVentaId;var i=db.ventas.findIndex(function(v){return v.id===editingVentaId});if(i>=0)db.ventas[i]=obj;}
  else db.ventas.push(obj);
  saveDB(db);toast('Venta guardada ✓');setTimeout(function(){closeModal('modal-venta');},500);renderVentas();
}
function renderVentas(){
  var db=getDB(),q=(document.getElementById('search-ventas')||{}).value||'';q=q.toLowerCase();
  var est=document.getElementById('filter-estado').value;
  var list=db.ventas.filter(function(v){return (!q||v.items.some(function(it){return it.nombre.toLowerCase().includes(q);}))&&(!est||v.estado===est);}).reverse();
  document.getElementById('tabla-ventas').innerHTML=list.map(function(v){return '<tr><td>'+fmtDate(v.fecha)+'</td><td>'+v.items.map(function(it){return it.nombre+' ×'+it.qty;}).join(', ')+'</td><td>'+fmt(v.subtotal)+'</td><td>'+(v.descuento?'-'+fmt(v.descuento):'—')+'</td><td class="text-gold fw7">'+fmt(v.total)+'</td><td><span class="badge '+(v.estado==='completada'?'bg':v.estado==='cancelada'?'br':'by')+'">'+v.estado+'</span></td><td>'+(currentUser&&currentUser.rol==='admin'?'<button class="btn btn-ghost btn-sm" onclick="openModalVenta('+v.id+')">✏</button>':'')+'</td></tr>';}).join('');
}

// ===================== REPORTES =====================
let repTab='rep-mes';
function showTab(id){repTab=id;document.querySelectorAll('#page-reportes .tab').forEach(function(t){t.classList.remove('active');});document.querySelectorAll('#page-reportes .card').forEach(function(c){c.style.display='none';});document.getElementById(id).style.display='';}
function renderReportes(){
  var db=getDB();var vMes=db.ventas.filter(function(v){return v.estado!=='cancelada';});
  var ingMes=vMes.reduce(function(s,v){return s+v.total;},0),cantMes=vMes.length;
  document.getElementById('rep-stats').innerHTML='<div class="stat"><div class="stat-label">Ingresos</div><div class="stat-value">'+fmt(ingMes)+'</div></div><div class="stat"><div class="stat-label">Ventas</div><div class="stat-value">'+cantMes+'</div></div><div class="stat"><div class="stat-label">Ticket prom.</div><div class="stat-value">'+fmt(cantMes?ingMes/cantMes:0)+'</div></div>';
  // Por mes
  var mesMap={};vMes.forEach(function(v){var m=new Date(v.fecha).toLocaleDateString('es-AR',{month:'short',year:'2-digit'});if(!mesMap[m])mesMap[m]={cant:0,total:0};mesMap[m].cant++;mesMap[m].total+=v.total;});
  document.getElementById('rep-mes-tabla').innerHTML=Object.keys(mesMap).reverse().map(function(m){return '<tr><td>'+m+'</td><td>'+mesMap[m].cant+'</td><td class="text-gold fw7">'+fmt(mesMap[m].total)+'</td><td>'+fmt(mesMap[m].cant?mesMap[m].total/mesMap[m].cant:0)+'</td></tr>';}).join('');
  // Por producto
  var pMap={};vMes.forEach(function(v){v.items.forEach(function(it){if(!pMap[it.nombre])pMap[it.nombre]={cant:0,total:0};pMap[it.nombre].cant+=it.qty;pMap[it.nombre].total+=it.precio*it.qty;});});
  var total=Object.values(pMap).reduce(function(s,p){return s+p.total;},0);
  document.getElementById('rep-prod-tabla').innerHTML=Object.values(pMap).sort(function(a,b){return b.total-a.total;}).map(function(p){return '<tr><td>'+p.nombre+'</td><td>'+p.cant+'</td><td class="text-gold fw7">'+fmt(p.total)+'</td><td>'+Math.round(p.total/total*100)+'%</td></tr>';}).join('');
  // Rentabilidad
  var c=db.costos;
  document.getElementById('rep-rent-tabla').innerHTML=db.blends.map(function(bl){var cd=calcBlendCostData(bl,c);return '<tr><td class="fw7">'+bl.nombre+'</td><td>'+fmt(cd.costoKg)+'/kg</td><td>'+(bl.pVentaChico?'Costo '+fmt(cd.totalC)+' | Margen '+(cd.margenC!==null?Math.round(cd.margenC)+'%':'—'):'—')+'</td><td>'+(bl.pVentaGrande?'Costo '+fmt(cd.totalG)+' | Margen '+(cd.margenG!==null?Math.round(cd.margenG)+'%':'—'):'—')+'</td></tr>';}).join('');
  showTab('rep-mes');
}

// ===================== AJUSTES =====================
function renderAjustes(){
  var db=getDB();
  document.getElementById('ajustes-usuarios').innerHTML=db.usuarios.map(function(u){return '<div class="flex items-center justify-between" style="padding:10px 0;border-bottom:1px solid var(--border)"><div class="flex items-center gap-8"><div class="user-avatar" style="width:32px;height:32px;font-size:.9rem">'+u.emoji+'</div><div><div class="fw7 text-sm">'+u.nombre+'</div><div class="text-xs text-muted">'+u.rol+' · PIN: '+'●'.repeat(u.pin.length)+'</div></div></div><div class="flex gap-8"><button class="btn btn-ghost btn-sm" onclick="openModalUsuario('+u.id+')">✏</button>'+(db.usuarios.length>1?'<button class="btn btn-red btn-sm" onclick="eliminarUsuario('+u.id+')">🗑</button>':'')+'</div></div>';}).join('');
  renderGhAjustes();
}
function renderGhAjustes(){
  var cfg=getGhConfig(),badge=document.getElementById('gh-status-badge'),form=document.getElementById('gh-config-form'),info=document.getElementById('gh-connected-info');
  if(!badge||!form||!info)return;
  if(cfg){badge.className='badge bg';badge.textContent='Conectado';form.style.display='none';info.style.display='block';var r=document.getElementById('gh-info-repo'),b=document.getElementById('gh-info-branch'),l=document.getElementById('gh-share-link');if(r)r.textContent=cfg.owner+'/'+cfg.repo;if(b)b.textContent=cfg.branch||'main';if(l)l.value=generarLinkConexion();}
  else{badge.className='badge br';badge.textContent='Desconectado';form.style.display='block';info.style.display='none';}
}
function copiarLinkConexion(){var l=generarLinkConexion();if(!l){toast('No hay config','err');return;}navigator.clipboard.writeText(l).then(function(){toast('Link copiado');}).catch(function(){var i=document.getElementById('gh-share-link');if(i){i.select();document.execCommand('copy');toast('Link copiado');}});}
function guardarGhConfigUI(){var t=document.getElementById('gh-token').value.trim();if(!t){toast('Pega tu token','err');return;}saveGhConfig({owner:GH_DEFAULT.owner,repo:GH_DEFAULT.repo,branch:GH_DEFAULT.branch,token:t});startGhPolling();ghPush().then(function(){toast('Conectado');renderGhAjustes();});}
async function forzarSyncManual(){toast('Sincronizando...');var p=await ghPull();if(p){toast('Datos actualizados');refreshCurrentPage();}else{await ghPush();toast('Datos subidos');}}
function desconectarGh(){if(!confirm('¿Desconectar sync?'))return;clearGhConfig();renderGhAjustes();toast('Desconectado');}
function forceReloadAllDevices(){
  if(!confirm('Esto actualizara la app en TODOS los dispositivos conectados. Continuar?'))return;
  var db=getDB();
  var ts=Date.now();
  db._forceReloadAt=ts;
  localStorage.setItem('arcano_force_reload',String(ts));
  saveDB(db);
  toast('Actualizacion forzada enviada — los dispositivos se recargaran en segundos');
  renderGhAjustes();
}

// ===================== USUARIOS =====================
let editingUserId=null;
function openModalUsuario(id){
  editingUserId=id;document.getElementById('modal-usr-titulo').textContent=id?'Editar usuario':'Nuevo usuario';
  var db=getDB();
  if(id){var u=db.usuarios.find(function(x){return x.id===id});if(u){document.getElementById('usr-nombre').value=u.nombre;document.getElementById('usr-pin').value=u.pin;document.getElementById('usr-rol').value=u.rol;document.getElementById('usr-emoji').value=u.emoji;}}
  else{document.getElementById('usr-nombre').value='';document.getElementById('usr-pin').value='';document.getElementById('usr-rol').value='operador';document.getElementById('usr-emoji').value='🌿';}
  openModal('modal-usuario');
}
function guardarUsuario(){
  var nombre=document.getElementById('usr-nombre').value.trim(),pin=document.getElementById('usr-pin').value.trim();
  if(!nombre||!pin){showAlert('alert-usr','Nombre y PIN obligatorios','err');return;}if(pin.length<4){showAlert('alert-usr','Min 4 digitos','err');return;}
  var db=getDB(),obj={nombre:nombre,pin:pin,rol:document.getElementById('usr-rol').value,emoji:document.getElementById('usr-emoji').value||'👤'};
  if(editingUserId){obj.id=editingUserId;var i=db.usuarios.findIndex(function(x){return x.id===editingUserId});if(i>=0)db.usuarios[i]=obj;}else{obj.id=nid();db.usuarios.push(obj);}
  saveDB(db);toast('Usuario guardado ✓');setTimeout(function(){closeModal('modal-usuario');},500);renderAjustes();
}
function eliminarUsuario(id){if(!confirm('¿Eliminar usuario?'))return;var db=getDB();db.usuarios=db.usuarios.filter(function(u){return u.id!==id});saveDB(db);renderAjustes();toast('Eliminado');}
function borrarTodo(){if(!confirm('¿Borrar TODO?'))return;if(!confirm('¿Seguro?'))return;localStorage.removeItem('arcano_v1');toast('Datos borrados');location.reload();}