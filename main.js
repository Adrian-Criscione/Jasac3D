// ==========================================
// 1. VARIABLES GLOBALES Y SELECTORES
// ==========================================
const productContainer = document.getElementById('product-container');
const cartCount = document.getElementById('cart-count');
const cartItemsContainer = document.getElementById('cart-items');
const cartTotalElement = document.getElementById('cart-total');
const contactForm = document.getElementById('contact-form');
const checkoutBtn = document.getElementById('checkout-btn');

let cart = JSON.parse(localStorage.getItem('cart')) || [];

// Configuración de SweetAlert
const Toast = Swal.mixin({
    toast: true,
    position: 'top-end',
    showConfirmButton: false,
    timer: 3000,
    timerProgressBar: true,
    didOpen: (toast) => {
        toast.addEventListener('mouseenter', Swal.stopTimer);
        toast.addEventListener('mouseleave', Swal.resumeTimer);
    }
});

// ==========================================
// 2. INICIALIZACIÓN
// ==========================================
document.addEventListener('DOMContentLoaded', () => {
    fetchProducts();
    updateCartUI();
    setupEventListeners();
});

function setupEventListeners() {
    if (contactForm) contactForm.addEventListener('submit', handleContactSubmit);
    if (checkoutBtn) checkoutBtn.addEventListener('click', handleCheckout);
}

// ==========================================
// 3. LÓGICA DE PRODUCTOS (API + TRANSFORMACIÓN 3D)
// ==========================================
async function fetchProducts() {
    try {
        // 1. Consumimos la API real (Requisito obligatorio)
        const response = await fetch('https://fakestoreapi.com/products?limit=9'); // Traemos solo 9 para que quede linda la grilla
        if (!response.ok) throw new Error('Error de conexión');
        const originalProducts = await response.json();

        // 2. "Disfrazamos" los productos para que sean de Impresión 3D
        // Como no hay API de esto, usamos la estructura de la API pero cambiamos el contenido visual.
        const products3D = transformTo3D(originalProducts);

        renderProducts(products3D);
    } catch (error) {
        console.error(error);
        productContainer.innerHTML = '<p class="text-center text-danger">Error cargando el catálogo 3D.</p>';
    }
    
    if (typeof AOS !== 'undefined') AOS.refresh();
}

// Función auxiliar para simular datos 3D con imágenes que SI funcionan y coinciden
function transformTo3D(apiProducts) {
    // Lista Maestra: Aquí definimos exactamente qué foto va con qué producto
    const catalogoReal = [
        {
            title: "Mate Geométrico Low Poly",
            image: "./img/mate.webp" // Vaso geométrico
        },
        {
            title: "Maceta Groot / Robert Plant",
            image: "./img/maceta.webp" // Maceta pequeña
        },
        {
            title: "Soporte Auriculares Gamer",
            image: "./img/soporte auricular.webp" // Auriculares (referencia)
        },
        {
            title: "Dragón Articulado Flexible",
            image: "./img/dragon articulado.webp" // Juguete/Figura
        },
        {
            title: "Lámpara Luna Litofanía",
            image: "./img/lampara luna.webp" // Lámpara esférica
        },
        {
            title: "Soporte Celular Escritorio",
            image: "./img/soporte celular.webp" // Celular en mesa
        },
        {
            title: "Figura Baby Yoda (Grogu)",
            image: "./img/figura baby yoda.webp" // Figura Star Wars
        },
        {
            title: "Llavero Personalizado",
            image: "./img/llavero personalizado.webp" // Llaveros
        },
        {
            title: "Organizador de Cables",
            image: "./img/organizador de cables.webp" // Cables ordenados
        }
    ];

return apiProducts.map((product, index) => {
        // Usamos el operador % para asignar fotos cíclicamente sin errores
        const item3D = catalogoReal[index % catalogoReal.length];

        return {
            id: product.id, 
            title: item3D.title, 
            price: (product.price * 150).toFixed(0), 
            image: item3D.image, // Aquí usará la ruta local "./img/..."
            category: "Impresión 3D",
            description: "Producto impreso en 3D con PLA de alta calidad."
        };
    });
}

function renderProducts(products) {
    productContainer.innerHTML = ''; 
    
    products.forEach(product => {
        const col = document.createElement('div');
        col.classList.add('col');
        
        col.innerHTML = `
            <div class="card h-100 shadow-sm">
                <img src="${product.image}" class="card-img-top" alt="${product.title}" style="height: 250px; object-fit: cover;">
                <div class="card-body d-flex flex-column">
                    <h5 class="card-title fs-6">${product.title}</h5>
                    <p class="card-text text-muted small">Impresión 3D</p>
                    <p class="card-text fw-bold text-info">$${product.price}</p>
                    <button class="btn btn-primary mt-auto add-btn" data-id="${product.id}">Agregar</button>
                </div>
            </div>
        `;
        
        const btn = col.querySelector('.add-btn');
        btn.addEventListener('click', () => addToCart(product));

        productContainer.appendChild(col);
    });
}

// ==========================================
// 4. LÓGICA DEL CARRITO (Misma lógica sólida de antes)
// ==========================================
function addToCart(product) {
    const existingItem = cart.find(item => item.id === product.id);

    if (existingItem) {
        existingItem.quantity++;
    } else {
        cart.push({ ...product, quantity: 1 });
    }

    updateCartUI();
    saveLocal();

    Toast.fire({
        icon: 'success',
        title: `${product.title} agregado`
    });
}

function removeFromCart(id) {
    cart = cart.filter(item => item.id !== id);
    updateCartUI();
    saveLocal();
}

function changeQuantity(id, amount) {
    const item = cart.find(prod => prod.id === id);
    if (item) {
        item.quantity += amount;
        if (item.quantity <= 0) {
            removeFromCart(id);
            return;
        }
        updateCartUI();
        saveLocal();
    }
}

function updateCartUI() {
    const totalItems = cart.reduce((acc, item) => acc + item.quantity, 0);
    cartCount.innerText = totalItems;

    cartItemsContainer.innerHTML = '';
    let totalPrice = 0;

    if (cart.length === 0) {
        cartItemsContainer.innerHTML = '<div class="text-center py-3"><p>Tu pedido está vacío.</p></div>';
    } else {
        const list = document.createElement('ul');
        list.classList.add('list-group', 'list-group-flush');

        cart.forEach(item => {
            const subtotal = item.price * item.quantity;
            totalPrice += subtotal;

            const li = document.createElement('li');
            li.classList.add('list-group-item', 'py-3');
            
            li.innerHTML = `
                <div class="d-flex justify-content-between align-items-center">
                    <div class="d-flex align-items-center">
                        <img src="${item.image}" alt="${item.title}" style="width: 50px; height: 50px; object-fit: cover; border-radius: 5px; margin-right: 15px;">
                        <div>
                            <h6 class="mb-0 text-truncate" style="max-width: 150px;">${item.title}</h6>
                            <small class="text-muted">$${item.price} x ${item.quantity}</small>
                        </div>
                    </div>
                    
                    <div class="d-flex align-items-center">
                        <button class="btn btn-sm btn-outline-secondary px-2 py-0 decrease-btn" data-id="${item.id}">-</button>
                        <span class="mx-2 fw-bold" style="width: 20px; text-align: center;">${item.quantity}</span>
                        <button class="btn btn-sm btn-outline-primary px-2 py-0 increase-btn" data-id="${item.id}">+</button>
                    </div>

                    <div class="text-end">
                        <p class="mb-0 fw-bold">$${subtotal.toFixed(0)}</p>
                        <button class="btn btn-link text-danger p-0 text-decoration-none remove-btn" data-id="${item.id}" style="font-size: 0.8rem;">Quitar</button>
                    </div>
                </div>
            `;
            
            li.querySelector('.increase-btn').addEventListener('click', () => changeQuantity(item.id, 1));
            li.querySelector('.decrease-btn').addEventListener('click', () => changeQuantity(item.id, -1));
            li.querySelector('.remove-btn').addEventListener('click', () => removeFromCart(item.id));
            
            list.appendChild(li);
        });
        cartItemsContainer.appendChild(list);
    }

    cartTotalElement.innerText = totalPrice.toFixed(0);
}

function saveLocal() {
    localStorage.setItem('cart', JSON.stringify(cart));
}

function handleContactSubmit(e) {
    e.preventDefault();
    const nombre = document.getElementById('nombre').value;
    Swal.fire({
        title: '¡Consulta Enviada!',
        text: `Gracias ${nombre}, revisaremos tu pedido de impresión y te responderemos.`,
        icon: 'success',
        confirmButtonColor: '#0d6efd'
    });
    contactForm.reset();
}

function handleCheckout() {
    if (cart.length === 0) {
        Swal.fire('Pedido vacío', 'Agrega modelos antes de confirmar.', 'warning');
        return;
    }
    Swal.fire({
        title: '¿Confirmar pedido?',
        text: `Total estimado: $${cartTotalElement.innerText}`,
        icon: 'question',
        showCancelButton: true,
        confirmButtonText: 'Sí, confirmar',
        cancelButtonText: 'Cancelar'
    }).then((result) => {
        if (result.isConfirmed) {
            Swal.fire('¡Pedido Confirmado!', 'Nos pondremos en contacto para coordinar el pago y envío.', 'success');
            cart = []; 
            saveLocal();
            updateCartUI();
            const modal = bootstrap.Modal.getInstance(document.getElementById('cartModal'));
            if(modal) modal.hide();
        }
    });
}