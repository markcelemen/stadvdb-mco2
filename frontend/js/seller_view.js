// Demo data keys
    const PRODUCTS_KEY = 'demo_seller_products_v1';
    const ORDERS_KEY = 'demo_seller_orders_v1';
    const FLASHSALES_KEY = 'demo_seller_flashsales_v1';

  // Sample flash sales (empty by default). Will be created by seller in UI.
  const SAMPLE_FLASHSALES = [];

    // Utilities
    const $ = id => document.getElementById(id);
    
    function uid(prefix='id'){ return prefix + '_' + Math.random().toString(36).slice(2,9) }

    // Sample initial data
    const SAMPLE_PRODUCTS = [
      { id: uid('p'), name: 'Blue Hoodie', price: 34.99, stock: 12, image:'https://via.placeholder.com/80x80?text=Hoodie', desc: 'Cozy cotton hoodie' },
      { id: uid('p'), name: 'Leather Wallet', price: 19.5, stock: 24, image:'https://via.placeholder.com/80x80?text=Wallet', desc: 'Genuine leather' }
    ];
    const SAMPLE_ORDERS = [
      { id: uid('o'), number: 'ORD-1001', customer: 'Alice Reyes', items:[{name:'Blue Hoodie',qty:1,price:34.99}], total:34.99, note:'Leave at doorstep' },
      { id: uid('o'), number: 'ORD-1002', customer: 'Ben Cruz', items:[{name:'Leather Wallet',qty:2,price:19.5}], total:39.0, note:'' }
    ];

    // Storage helpers
    function load(key, fallback){ try{ return JSON.parse(localStorage.getItem(key)) || fallback }catch(e){return fallback} }
    function save(key, val){ localStorage.setItem(key, JSON.stringify(val)) }

    // Initialize demo if empty
    if(!localStorage.getItem(PRODUCTS_KEY)) save(PRODUCTS_KEY, SAMPLE_PRODUCTS);
    if(!localStorage.getItem(ORDERS_KEY)) save(ORDERS_KEY, SAMPLE_ORDERS);
   if(!localStorage.getItem(FLASHSALES_KEY)) save(FLASHSALES_KEY, SAMPLE_FLASHSALES);

    // State
    let products = load(PRODUCTS_KEY, []);
    let orders = load(ORDERS_KEY, []);
   let flashSales = load(FLASHSALES_KEY, []);

    // Renderers
    function renderProducts(){
      products = load(PRODUCTS_KEY, []);
      const tbody = $('productsBody'); tbody.innerHTML = '';
      if(!products.length){ tbody.innerHTML = '<tr><td colspan="4" class="muted">No products yet.</td></tr>'; return }
      products.forEach(p=>{
        const tr = document.createElement('tr');
        tr.innerHTML = `
          <td>
            <div style="display:flex;align-items:center;gap:10px">
              <img src="${p.image || 'https://via.placeholder.com/80?text=Product'}" alt="" class="img-thumb"/>
              <div>
                <div style="font-weight:600">${escapeHtml(p.name)}</div>
                <div class="muted" style="font-size:12px">${escapeHtml(p.desc || '')}</div>
              </div>
            </div>
          </td>
          <td>${formatCurrency(p.price)}</td>
          <td>${p.stock}</td>
          <td class="right actions">
            <button class="btn ghost small" data-id="${p.id}" data-action="edit">Edit</button>
            <button class="btn danger small" data-id="${p.id}" data-action="delete">Delete</button>
          </td>
        `;
        tbody.appendChild(tr);
      });
    }

    function renderOrders(){
      orders = load(ORDERS_KEY, []);
      const tbody = $('ordersBody'); tbody.innerHTML = '';
      if(!orders.length){ tbody.innerHTML = '<tr><td colspan="5" class="muted">No orders.</td></tr>'; return }
      orders.forEach(o=>{
        const tr = document.createElement('tr');
        // compute total quantity from order items (supports items with 'qty' or 'quantity')
        const totalQty = (o.items || []).reduce((sum, it) => {
          return sum + (it.qty ?? it.quantity ?? 0);
        }, 0);

        tr.innerHTML = `
          <td>${escapeHtml(o.number)}</td>
          <td>${escapeHtml(o.customer)}</td>
          <td>${totalQty}</td>
          <td>${formatCurrency(o.total)}</td>
          <td class="right">
            <button class="btn ghost small" data-id="${o.id}" data-action="view">View</button>
            <button class="btn danger small" data-id="${o.id}" data-action="delete">Delete</button>
          </td>
        `;
        tbody.appendChild(tr);
      });
    }

    /* Flash sales rendering & handlers */
   function renderFlashSales(){
     flashSales = load(FLASHSALES_KEY, []);
     const tbody = $('flashSalesBody'); tbody.innerHTML = '';
     if(!flashSales.length){
       tbody.innerHTML = '<tr><td colspan="4" class="muted">No flash sales.</td></tr>';
       return;
     }
     flashSales.forEach(f=>{
       const tr = document.createElement('tr');
       const start = f.start_time ? new Date(f.start_time).toLocaleString() : '—';
       const end = f.end_time ? new Date(f.end_time).toLocaleString() : '—';
       tr.innerHTML = `
         <td style="font-weight:600">${escapeHtml(f.name)}</td>
         <td>${escapeHtml(start)}</td>
         <td>${escapeHtml(end)}</td>
         <td class="right">
           <button class="btn ghost small" data-id="${f.id}" data-action="view-flash">View</button>
           <button class="btn danger small" data-id="${f.id}" data-action="delete-flash">Delete</button>
         </td>
       `;
       tbody.appendChild(tr);
     });
   }

   // Flash sale modal controls
   const flashSaleModal = $('flashSaleModal');
   function openFlashSaleModal(edit){
     $('flashSaleForm').reset();
     $('flashSaleProducts').innerHTML = '';
     // render product checkboxes
     products = load(PRODUCTS_KEY, []);
     products.forEach(p=>{
       const id = p.id;
       const checked = edit && (edit.products || []).includes(id) ? 'checked' : '';
       const line = document.createElement('div');
       line.innerHTML = `<label style="display:flex;align-items:center;gap:8px"><input type="checkbox" value="${id}" ${checked}/> ${escapeHtml(p.name)} <span class="muted" style="margin-left:8px">(${p.stock} in stock)</span></label>`;
       $('flashSaleProducts').appendChild(line);
     });

     if(edit){
       $('flashModalTitle').textContent = 'Edit Flash Sale';
       $('flashSaleId').value = edit.id;
       $('flashSaleName').value = edit.name || '';
       if(edit.start_time) $('flashSaleStart').value = toDatetimeLocal(edit.start_time);
       if(edit.end_time) $('flashSaleEnd').value = toDatetimeLocal(edit.end_time);
     } else {
       $('flashModalTitle').textContent = 'Add Flash Sale';
       $('flashSaleId').value = '';
     }
     flashSaleModal.classList.remove('hidden');
   }
   function closeFlashSaleModal(){ flashSaleModal.classList.add('hidden'); $('flashSaleId').value = ''; }

   // helper: convert ISO to input datetime-local value
   function toDatetimeLocal(iso){
     const d = new Date(iso);
     const pad = n => String(n).padStart(2,'0');
     const yyyy = d.getFullYear();
     const MM = pad(d.getMonth()+1);
     const dd = pad(d.getDate());
     const hh = pad(d.getHours());
     const mm = pad(d.getMinutes());
     return `${yyyy}-${MM}-${dd}T${hh}:${mm}`;
   }

   // open modal
   $('addFlashSaleBtn').addEventListener('click', ()=> openFlashSaleModal(null));
   $('cancelFlashSale').addEventListener('click', closeFlashSaleModal);

   // submit flash sale
   $('flashSaleForm').addEventListener('submit', e=>{
     e.preventDefault();
     const id = $('flashSaleId').value;
     const name = $('flashSaleName').value.trim();
     const startVal = $('flashSaleStart').value;
     const endVal = $('flashSaleEnd').value;
     const selected = Array.from($('flashSaleProducts').querySelectorAll('input[type="checkbox"]:checked')).map(i=>i.value);
     if(!name){ alert('Name required'); return }
     if(!startVal || !endVal){ alert('Start and end times required'); return }
     const startISO = new Date(startVal).toISOString();
     const endISO = new Date(endVal).toISOString();

     flashSales = load(FLASHSALES_KEY, []);
     if(id){
       // edit
       flashSales = flashSales.map(f => f.id === id ? {...f, name, start_time:startISO, end_time:endISO, products:selected} : f);
     } else {
       const fid = uid('f');
       flashSales.push({ id: fid, name, start_time: startISO, end_time: endISO, products: selected });
     }
     save(FLASHSALES_KEY, flashSales);

     // update products to point to flash sale id (denormalized relationship)
     products = load(PRODUCTS_KEY, []);
     // remove this flash sale from all products first (in case of edit)
     const currentFlashIds = flashSales.map(f=>f.id);
     products = products.map(p => {
       // if product included in any flash sale, set the latest matching one, otherwise null
       const included = flashSales.find(f => (f.products||[]).includes(p.id));
       return {...p, flash_sale_id: included ? included.id : null};
     });
     save(PRODUCTS_KEY, products);

     renderFlashSales();
     renderProducts();
     closeFlashSaleModal();
   });

   // flash sales table actions (view, delete)
   $('flashSalesBody').addEventListener('click', e=>{
     const btn = e.target.closest('button');
     if(!btn) return;
     const id = btn.dataset.id;
     const action = btn.dataset.action;
     flashSales = load(FLASHSALES_KEY, []);
     const f = flashSales.find(x=>x.id===id);
     if(action === 'view-flash' && f){
       // show simple view in order modal area (reuse order modal)
       const productNames = (f.products || []).map(pid => {
         const p = products.find(x=>x.id===pid);
         return p ? escapeHtml(p.name) : '(missing)';
       }).join('<br/>') || 'No products selected';
       $('orderDetails').innerHTML = `
         <div style="font-weight:600">${escapeHtml(f.name)}</div>
         <div class="muted" style="margin-top:6px">Starts: ${new Date(f.start_time).toLocaleString()}</div>
         <div class="muted">Ends: ${new Date(f.end_time).toLocaleString()}</div>
         <div style="margin-top:8px"><strong>Products</strong><div style="margin-top:6px">${productNames}</div></div>
       `;
       orderModal.dataset.current = f.id;
       orderModal.classList.remove('hidden');
     } else if(action === 'delete-flash' && f){
       if(confirm('Delete this flash sale?')) {
         flashSales = flashSales.filter(x=>x.id!==id);
         save(FLASHSALES_KEY, flashSales);
         // remove association from products
         products = load(PRODUCTS_KEY, []).map(p => p.flash_sale_id === id ? {...p, flash_sale_id: null} : p);
         save(PRODUCTS_KEY, products);
         renderFlashSales();
         renderProducts();
       }
     }
   });

    // Helpers
    function escapeHtml(s){ return String(s||'').replace(/&/g,'&amp;').replace(/</g,'&lt;').replace(/>/g,'&gt;') }
    function formatCurrency(n){ return '$' + Number(n).toFixed(2) }

    // Modal controls
    const productModal = $('productModal'), orderModal = $('orderModal');
    function openProductModal(editProduct){
      $('productForm').reset();
      if(editProduct){
        $('modalTitle').textContent = 'Edit Product';
        $('productId').value = editProduct.id;
        $('productName').value = editProduct.name;
        $('productPrice').value = editProduct.price;
        $('productStock').value = editProduct.stock;
        $('productImage').value = editProduct.image || '';
        $('productDesc').value = editProduct.desc || '';
      } else {
        $('modalTitle').textContent = 'Add Product';
        $('productId').value = '';
      }
      productModal.classList.remove('hidden');
    }
    function closeProductModal(){ productModal.classList.add('hidden') }

    // Product actions
    $('addProductBtn').addEventListener('click', ()=> openProductModal(null));
    $('cancelModal').addEventListener('click', closeProductModal);
    $('productForm').addEventListener('submit', e=>{
      e.preventDefault();
      const id = $('productId').value;
      const name = $('productName').value.trim();
      const price = parseFloat($('productPrice').value) || 0;
      const stock = parseInt($('productStock').value) || 0;
      const image = $('productImage').value.trim();
      const desc = $('productDesc').value.trim();
      if(!name){ alert('Product name is required'); return }
      if(id){
        products = products.map(p => p.id === id ? {...p,name,price,stock,image,desc} : p);
      } else {
        products.push({ id: uid('p'), name, price, stock, image, desc });
      }
      save(PRODUCTS_KEY, products);
      renderProducts();
      closeProductModal();
    });

    // Click delegation for product table
    $('productsBody').addEventListener('click', e=>{
      const btn = e.target.closest('button');
      if(!btn) return;
      const id = btn.dataset.id;
      const action = btn.dataset.action;
      if(action === 'edit'){
        const p = products.find(x=>x.id===id);
        if(p) openProductModal(p);
      } else if(action === 'delete'){
        if(confirm('Delete this product?')) {
          products = products.filter(x=>x.id!==id);
          save(PRODUCTS_KEY, products);
          renderProducts();
        }
      }
    });

    // Orders interactions
    $('ordersBody').addEventListener('click', e=>{
      const btn = e.target.closest('button');
      if(!btn) return;
      const id = btn.dataset.id;
      const action = btn.dataset.action;
      const o = orders.find(x=>x.id===id);
      if(action === 'view' && o){
        openOrderModal(o);
      } else if(action === 'delete' && o){
        if(confirm('Delete this order?')) {
          orders = orders.filter(x=>x.id!==id);
          save(ORDERS_KEY, orders);
          renderOrders();
        }
      }
    });

    function openOrderModal(order){
      $('orderDetails').innerHTML = `
        <div style="font-weight:600">${escapeHtml(order.number)} — ${escapeHtml(order.customer)}</div>
        <div class="muted" style="margin-top:6px">Total: ${formatCurrency(order.total)}</div>
        <div style="margin-top:8px">${order.items.map(it=>`<div>${escapeHtml(it.name)} × ${it.qty} — ${formatCurrency(it.price)}</div>`).join('')}</div>
        <div class="muted" style="margin-top:8px">Note: ${escapeHtml(order.note||'—')}</div>
      `;
      orderModal.dataset.current = order.id;
      orderModal.classList.remove('hidden');
    }
    function closeOrderModal(){ orderModal.classList.add('hidden'); orderModal.dataset.current = ''; }
    $('closeOrder').addEventListener('click', closeOrderModal);
    $('deleteOrderBtn').addEventListener('click', ()=>{
      const id = orderModal.dataset.current;
      if(!id) return;
      if(confirm('Delete this order?')){
        orders = orders.filter(x=>x.id!==id);
        save(ORDERS_KEY, orders);
        renderOrders();
        closeOrderModal();
      }
    });

// Reset demo data
$('resetDemo').addEventListener('click', ()=>{
  if(confirm('Reset demo data? This will overwrite current local data.')){
    save(PRODUCTS_KEY, SAMPLE_PRODUCTS);
    save(ORDERS_KEY, SAMPLE_ORDERS);
   save(FLASHSALES_KEY, SAMPLE_FLASHSALES);
    products = load(PRODUCTS_KEY, []);
    orders = load(ORDERS_KEY, []);
    flashSales = load(FLASHSALES_KEY, []);
    renderProducts(); renderOrders();
    renderFlashSales();
  }
});

    // Close modal on background click
    [productModal, orderModal].forEach(mod=>{
      mod.addEventListener('click', e=>{
        if(e.target === mod) mod.classList.add('hidden');
      });
    });

    // Initial render
    renderProducts(); renderOrders();
   renderFlashSales();
