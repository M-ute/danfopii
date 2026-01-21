// Inventory Management System

let inventoryData = [];
let filteredInventory = [];

// Initialize Inventory
function initInventory() {
    loadInventoryData();
    setupInventoryFilters();
}

// Load Inventory Data
async function loadInventoryData() {
    try {
        const response = await fetch('data/inventory.json');
        if (!response.ok) throw new Error('Failed to load inventory');
        
        inventoryData = await response.json();
        filteredInventory = [...inventoryData];
        
        // Render initial inventory
        renderInventory();
        
        // Update inventory count
        updateInventoryCount();
    } catch (error) {
        console.error('Error loading inventory:', error);
    }
}

// Render Inventory
function renderInventory() {
    const container = document.getElementById('featured-cars-container');
    if (!container) return;
    
    // Clear existing content
    container.innerHTML = '';
    
    if (filteredInventory.length === 0) {
        container.innerHTML = `
            <div class="no-results">
                <i class="fas fa-car fa-3x"></i>
                <h3>No vehicles found</h3>
                <p>Try adjusting your filters</p>
            </div>
        `;
        return;
    }
    
    // Create car cards
    filteredInventory.forEach(car => {
        const carCard = createCarCard(car);
        container.appendChild(carCard);
    });
}

// Create Car Card HTML
function createCarCard(car) {
    const card = document.createElement('div');
    card.className = 'car-card fade-in';
    
    // Format price
    const formattedPrice = AutoElite.formatCurrency(car.price);
    
    // Create specs string
    const specs = [
        car.year,
        car.transmission,
        car.fuelType,
        `${car.mileage ? car.mileage.toLocaleString() + ' mi' : 'New'}`,
        car.condition
    ].filter(Boolean).join(' • ');
    
    card.innerHTML = `
        <div class="car-image-container">
            <img 
                src="assets/images/placeholder.jpg" 
                data-src="${car.images[0]}" 
                alt="${car.make} ${car.model}" 
                class="car-image lazy-image"
                loading="lazy"
            >
            ${car.featured ? '<span class="featured-badge">Featured</span>' : ''}
        </div>
        <div class="car-details">
            <div class="car-title">
                <h3 class="car-name">${car.year} ${car.make} ${car.model}</h3>
                <span class="car-price">${formattedPrice}</span>
            </div>
            <p class="car-specs">${specs}</p>
            <p class="car-description">${car.description.substring(0, 100)}...</p>
            <div class="car-actions">
                <button class="btn btn-primary btn-call" data-phone="${car.contactPhone}">
                    <i class="fas fa-phone"></i> Call Now
                </button>
                <button class="btn btn-whatsapp btn-inquire" data-car-id="${car.id}">
                    <i class="fab fa-whatsapp"></i> WhatsApp
                </button>
            </div>
        </div>
    `;
    
    // Add event listeners
    const callBtn = card.querySelector('.btn-call');
    const whatsappBtn = card.querySelector('.btn-inquire');
    
    callBtn.addEventListener('click', () => initiateCall(car.contactPhone));
    whatsappBtn.addEventListener('click', () => sendWhatsAppInquiry(car));
    
    // Lazy load image
    const img = card.querySelector('.lazy-image');
    if ('IntersectionObserver' in window) {
        const observer = new IntersectionObserver((entries) => {
            entries.forEach(entry => {
                if (entry.isIntersecting) {
                    const lazyImage = entry.target;
                    lazyImage.src = lazyImage.dataset.src;
                    lazyImage.classList.remove('lazy-image');
                    observer.unobserve(lazyImage);
                }
            });
        });
        observer.observe(img);
    }
    
    return card;
}

// Setup Inventory Filters
function setupInventoryFilters() {
    const filterButtons = document.querySelectorAll('.filter-btn');
    const searchInput = document.getElementById('search-inventory');
    const priceFilter = document.getElementById('price-filter');
    const conditionFilter = document.getElementById('condition-filter');
    
    // Category filter buttons
    filterButtons.forEach(button => {
        button.addEventListener('click', function() {
            // Update active state
            filterButtons.forEach(btn => btn.classList.remove('active'));
            this.classList.add('active');
            
            // Apply filter
            const filter = this.dataset.filter;
            applyFilter(filter);
        });
    });
    
    // Search filter
    if (searchInput) {
        searchInput.addEventListener('input', AutoElite.debounce(function() {
            applySearchFilter(this.value);
        }, 300));
    }
    
    // Price filter
    if (priceFilter) {
        priceFilter.addEventListener('change', function() {
            applyPriceFilter(this.value);
        });
    }
    
    // Condition filter
    if (conditionFilter) {
        conditionFilter.addEventListener('change', function() {
            applyConditionFilter(this.value);
        });
    }
}

// Apply Category Filter
function applyFilter(category) {
    if (category === 'all') {
        filteredInventory = [...inventoryData];
    } else {
        filteredInventory = inventoryData.filter(car => {
            if (category === 'new') return car.condition === 'New';
            if (category === 'used') return car.condition === 'Used';
            if (category === 'imported') return car.imported === true;
            return true;
        });
    }
    
    renderInventory();
    updateInventoryCount();
}

// Apply Search Filter
function applySearchFilter(searchTerm) {
    if (!searchTerm.trim()) {
        filteredInventory = [...inventoryData];
    } else {
        const term = searchTerm.toLowerCase();
        filteredInventory = inventoryData.filter(car => {
            return (
                car.make.toLowerCase().includes(term) ||
                car.model.toLowerCase().includes(term) ||
                car.description.toLowerCase().includes(term)
            );
        });
    }
    
    renderInventory();
    updateInventoryCount();
}

// Apply Price Filter
function applyPriceFilter(priceRange) {
    if (priceRange === 'all') {
        filteredInventory = [...inventoryData];
    } else {
        const [min, max] = priceRange.split('-').map(Number);
        filteredInventory = inventoryData.filter(car => {
            if (max) {
                return car.price >= min && car.price <= max;
            } else {
                return car.price >= min;
            }
        });
    }
    
    renderInventory();
    updateInventoryCount();
}

// Apply Condition Filter
function applyConditionFilter(condition) {
    if (condition === 'all') {
        filteredInventory = [...inventoryData];
    } else {
        filteredInventory = inventoryData.filter(car => car.condition === condition);
    }
    
    renderInventory();
    updateInventoryCount();
}

// Update Inventory Count Display
function updateInventoryCount() {
    const countElement = document.getElementById('inventory-count');
    if (countElement) {
        countElement.textContent = `${filteredInventory.length} vehicles found`;
    }
}

// Initiate Phone Call
function initiateCall(phoneNumber) {
    if (confirm(`Call ${phoneNumber}?`)) {
        window.location.href = `tel:${phoneNumber}`;
    }
}

// Send WhatsApp Inquiry
function sendWhatsAppInquiry(car) {
    const phoneNumber = car.contactPhone || '1234567890';
    const message = `Hello, I'm interested in the ${car.year} ${car.make} ${car.model} (ID: ${car.id}). Price: ${AutoElite.formatCurrency(car.price)}. Could you provide more details?`;
    const whatsappUrl = `https://wa.me/${phoneNumber}?text=${encodeURIComponent(message)}`;
    
    window.open(whatsappUrl, '_blank');
}

// Request Quote
function requestQuote(carId) {
    const car = inventoryData.find(c => c.id === carId);
    if (!car) return;
    
    const modal = document.createElement('div');
    modal.className = 'modal';
    modal.innerHTML = `
        <div class="modal-content">
            <span class="modal-close">&times;</span>
            <h3>Request Quote for ${car.year} ${car.make} ${car.model}</h3>
            <form id="quote-form">
                <div class="form-group">
                    <label for="quote-name">Full Name</label>
                    <input type="text" id="quote-name" required>
                </div>
                <div class="form-group">
                    <label for="quote-phone">Phone Number</label>
                    <input type="tel" id="quote-phone" required>
                </div>
                <div class="form-group">
                    <label for="quote-email">Email Address</label>
                    <input type="email" id="quote-email" required>
                </div>
                <div class="form-group">
                    <label for="quote-message">Additional Information</label>
                    <textarea id="quote-message" placeholder="Any specific requirements or questions?"></textarea>
                </div>
                <button type="submit" class="btn btn-primary">Submit Quote Request</button>
            </form>
        </div>
    `;
    
    document.body.appendChild(modal);
    
    // Style modal
    Object.assign(modal.style, {
        position: 'fixed',
        top: '0',
        left: '0',
        width: '100%',
        height: '100%',
        backgroundColor: 'rgba(0,0,0,0.5)',
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        zIndex: '10000',
        animation: 'fadeIn 0.3s ease'
    });
    
    const modalContent = modal.querySelector('.modal-content');
    Object.assign(modalContent.style, {
        backgroundColor: 'white',
        padding: '2rem',
        borderRadius: 'var(--border-radius)',
        maxWidth: '500px',
        width: '90%',
        maxHeight: '90vh',
        overflowY: 'auto',
        position: 'relative'
    });
    
    // Close modal
    modal.querySelector('.modal-close').addEventListener('click', () => {
        modal.style.animation = 'fadeIn 0.3s ease reverse';
        setTimeout(() => document.body.removeChild(modal), 300);
    });
    
    // Close on outside click
    modal.addEventListener('click', (e) => {
        if (e.target === modal) {
            modal.style.animation = 'fadeIn 0.3s ease reverse';
            setTimeout(() => document.body.removeChild(modal), 300);
        }
    });
    
    // Handle form submission
    modal.querySelector('#quote-form').addEventListener('submit', function(e) {
        e.preventDefault();
        
        const formData = {
            name: document.getElementById('quote-name').value,
            phone: document.getElementById('quote-phone').value,
            email: document.getElementById('quote-email').value,
            message: document.getElementById('quote-message').value,
            car: `${car.year} ${car.make} ${car.model}`,
            carId: car.id
        };
        
        // Send via WhatsApp
        const whatsappMessage = `New Quote Request:\n\nName: ${formData.name}\nPhone: ${formData.phone}\nEmail: ${formData.email}\nCar: ${formData.car}\nMessage: ${formData.message}`;
        const whatsappUrl = `https://wa.me/${car.contactPhone}?text=${encodeURIComponent(whatsappMessage)}`;
        
        window.open(whatsappUrl, '_blank');
        
        // Show success message
        AutoElite.showNotification('Quote request submitted successfully!', 'success');
        
        // Close modal
        modal.style.animation = 'fadeIn 0.3s ease reverse';
        setTimeout(() => document.body.removeChild(modal), 300);
    });
}

// View Car Details
function viewCarDetails(carId) {
    // Save car ID for details page
    AutoElite.storage.set('selectedCarId', carId);
    
    // Redirect to car details page or show modal
    window.location.href = `car-details.html?id=${carId}`;
}

// Export functions
window.initInventory = initInventory;
window.requestQuote = requestQuote;
window.viewCarDetails = viewCarDetails;