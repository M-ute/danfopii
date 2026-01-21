// Search and Filter Functionality for Cars Page

class SearchFilter {
    constructor() {
        this.cars = [];
        this.filteredCars = [];
        this.currentFilters = {
            category: 'all',
            price: 'all',
            condition: 'all',
            type: 'all',
            search: ''
        };
        
        this.init();
    }
    
    async init() {
        await this.loadCars();
        this.setupEventListeners();
        this.renderCars();
        this.updateCount();
    }
    
    async loadCars() {
        try {
            const response = await fetch('data/inventory.json');
            const data = await response.json();
            this.cars = data.cars || [];
            this.filteredCars = [...this.cars];
        } catch (error) {
            console.error('Error loading cars:', error);
            this.cars = [];
            this.filteredCars = [];
        }
    }
    
    setupEventListeners() {
        // Category filter buttons
        document.querySelectorAll('.filter-btn').forEach(btn => {
            btn.addEventListener('click', (e) => {
                this.currentFilters.category = e.target.dataset.filter;
                this.updateActiveButton(e.target);
                this.applyFilters();
            });
        });
        
        // Price filter
        const priceFilter = document.getElementById('price-filter');
        if (priceFilter) {
            priceFilter.addEventListener('change', (e) => {
                this.currentFilters.price = e.target.value;
                this.applyFilters();
            });
        }
        
        // Condition filter
        const conditionFilter = document.getElementById('condition-filter');
        if (conditionFilter) {
            conditionFilter.addEventListener('change', (e) => {
                this.currentFilters.condition = e.target.value;
                this.applyFilters();
            });
        }
        
        // Type filter
        const typeFilter = document.getElementById('type-filter');
        if (typeFilter) {
            typeFilter.addEventListener('change', (e) => {
                this.currentFilters.type = e.target.value;
                this.applyFilters();
            });
        }
        
        // Search input
        const searchInput = document.getElementById('search-cars');
        if (searchInput) {
            searchInput.addEventListener('input', AutoElite.debounce((e) => {
                this.currentFilters.search = e.target.value.toLowerCase();
                this.applyFilters();
            }, 300));
        }
        
        // Reset filters
        const resetBtn = document.getElementById('reset-filters');
        if (resetBtn) {
            resetBtn.addEventListener('click', () => {
                this.resetFilters();
            });
        }
    }
    
    updateActiveButton(activeBtn) {
        document.querySelectorAll('.filter-btn').forEach(btn => {
            btn.classList.remove('active');
        });
        activeBtn.classList.add('active');
    }
    
    applyFilters() {
        this.filteredCars = this.cars.filter(car => {
            // Category filter
            if (this.currentFilters.category !== 'all') {
                if (this.currentFilters.category === 'new' && car.condition !== 'New') return false;
                if (this.currentFilters.category === 'used' && car.condition !== 'Used') return false;
                if (this.currentFilters.category === 'imported' && !car.imported) return false;
            }
            
            // Price filter
            if (this.currentFilters.price !== 'all') {
                const [min, max] = this.currentFilters.price.split('-').map(Number);
                if (max) {
                    if (car.price < min || car.price > max) return false;
                } else {
                    if (car.price < min) return false;
                }
            }
            
            // Condition filter
            if (this.currentFilters.condition !== 'all') {
                if (car.condition !== this.currentFilters.condition) return false;
            }
            
            // Type filter
            if (this.currentFilters.type !== 'all') {
                if (car.category !== this.currentFilters.type) return false;
            }
            
            // Search filter
            if (this.currentFilters.search) {
                const searchTerm = this.currentFilters.search;
                const searchableText = `${car.make} ${car.model} ${car.year} ${car.description}`.toLowerCase();
                if (!searchableText.includes(searchTerm)) return false;
            }
            
            return true;
        });
        
        this.renderCars();
        this.updateCount();
    }
    
    resetFilters() {
        this.currentFilters = {
            category: 'all',
            price: 'all',
            condition: 'all',
            type: 'all',
            search: ''
        };
        
        // Reset UI elements
        document.querySelectorAll('.filter-btn').forEach(btn => {
            btn.classList.remove('active');
            if (btn.dataset.filter === 'all') {
                btn.classList.add('active');
            }
        });
        
        document.getElementById('price-filter').value = 'all';
        document.getElementById('condition-filter').value = 'all';
        document.getElementById('type-filter').value = 'all';
        document.getElementById('search-cars').value = '';
        
        this.filteredCars = [...this.cars];
        this.renderCars();
        this.updateCount();
    }
    
    renderCars() {
        const container = document.getElementById('inventory-container');
        if (!container) return;
        
        container.innerHTML = '';
        
        if (this.filteredCars.length === 0) {
            container.innerHTML = `
                <div class="no-results" style="grid-column: 1 / -1; text-align: center; padding: 4rem;">
                    <i class="fas fa-car fa-4x" style="color: var(--medium-gray); margin-bottom: 1rem;"></i>
                    <h3 style="margin-bottom: 1rem;">No vehicles found</h3>
                    <p style="color: var(--dark-gray); margin-bottom: 2rem;">Try adjusting your search filters</p>
                    <button id="reset-filters-view" class="btn btn-primary">Reset All Filters</button>
                </div>
            `;
            
            // Add event listener to reset button in no results view
            document.getElementById('reset-filters-view')?.addEventListener('click', () => {
                this.resetFilters();
            });
            
            return;
        }
        
        this.filteredCars.forEach(car => {
            const carCard = this.createCarCard(car);
            container.appendChild(carCard);
        });
    }
    
    createCarCard(car) {
        const card = document.createElement('div');
        card.className = 'car-card fade-in';
        card.dataset.id = car.id;
        
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
                    data-src="${car.images[0] || 'assets/images/cars/default.jpg'}" 
                    alt="${car.make} ${car.model}" 
                    class="car-image lazy-image"
                    loading="lazy"
                >
                ${car.featured ? '<span class="featured-badge">Featured</span>' : ''}
                ${car.imported ? '<span class="imported-badge">Imported</span>' : ''}
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
                    <button class="btn btn-secondary btn-details" data-car-id="${car.id}">
                        <i class="fas fa-info-circle"></i> Details
                    </button>
                </div>
            </div>
        `;
        
        // Add event listeners
        const callBtn = card.querySelector('.btn-call');
        const whatsappBtn = card.querySelector('.btn-inquire');
        const detailsBtn = card.querySelector('.btn-details');
        
        callBtn.addEventListener('click', () => this.initiateCall(car.contactPhone));
        whatsappBtn.addEventListener('click', () => this.sendWhatsAppInquiry(car));
        detailsBtn.addEventListener('click', () => this.viewCarDetails(car.id));
        
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
    
    updateCount() {
        const countElement = document.getElementById('inventory-count');
        if (countElement) {
            countElement.textContent = `${this.filteredCars.length} vehicle${this.filteredCars.length !== 1 ? 's' : ''} found`;
        }
    }
    
    initiateCall(phoneNumber) {
        if (confirm(`Call ${phoneNumber}?`)) {
            window.location.href = `tel:${phoneNumber}`;
        }
    }
    
    sendWhatsAppInquiry(car) {
        const phoneNumber = car.contactPhone || '1234567890';
        const message = `Hello, I'm interested in the ${car.year} ${car.make} ${car.model} (ID: ${car.id}). Price: ${AutoElite.formatCurrency(car.price)}. Could you provide more details?`;
        const whatsappUrl = `https://wa.me/${phoneNumber}?text=${encodeURIComponent(message)}`;
        
        window.open(whatsappUrl, '_blank');
    }
    
    viewCarDetails(carId) {
        // In a real application, this would redirect to a car details page
        // For now, show a modal with car details
        const car = this.cars.find(c => c.id === carId);
        if (!car) return;
        
        this.showCarDetailsModal(car);
    }
    
    showCarDetailsModal(car) {
        const modal = document.createElement('div');
        modal.className = 'modal';
        
        // Format features list
        const featuresList = car.features?.map(feature => `<li><i class="fas fa-check"></i> ${feature}</li>`).join('') || '';
        
        modal.innerHTML = `
            <div class="modal-content">
                <span class="modal-close">&times;</span>
                <div class="car-details-modal">
                    <div class="car-gallery">
                        <div class="main-image">
                            <img src="${car.images[0] || 'assets/images/cars/default.jpg'}" alt="${car.make} ${car.model}">
                        </div>
                        <div class="thumbnails">
                            ${car.images.slice(1, 5).map((img, index) => `
                                <img src="${img}" alt="${car.make} ${car.model} - Image ${index + 2}" class="thumbnail">
                            `).join('')}
                        </div>
                    </div>
                    
                    <div class="car-info">
                        <h2>${car.year} ${car.make} ${car.model}</h2>
                        <div class="car-price-large">${AutoElite.formatCurrency(car.price)}</div>
                        
                        <div class="car-specs-grid">
                            <div class="spec-item-detail">
                                <span>Condition:</span>
                                <span>${car.condition}</span>
                            </div>
                            <div class="spec-item-detail">
                                <span>Mileage:</span>
                                <span>${car.mileage ? car.mileage.toLocaleString() + ' miles' : 'New'}</span>
                            </div>
                            <div class="spec-item-detail">
                                <span>Transmission:</span>
                                <span>${car.transmission}</span>
                            </div>
                            <div class="spec-item-detail">
                                <span>Fuel Type:</span>
                                <span>${car.fuelType}</span>
                            </div>
                            <div class="spec-item-detail">
                                <span>Engine:</span>
                                <span>${car.engine}</span>
                            </div>
                            <div class="spec-item-detail">
                                <span>Color:</span>
                                <span>${car.color}</span>
                            </div>
                        </div>
                        
                        <div class="car-description-full">
                            <h3>Description</h3>
                            <p>${car.description}</p>
                        </div>
                        
                        ${featuresList ? `
                            <div class="car-features">
                                <h3>Features</h3>
                                <ul class="features-list">
                                    ${featuresList}
                                </ul>
                            </div>
                        ` : ''}
                        
                        <div class="car-actions-modal">
                            <button class="btn btn-primary btn-large" id="modal-call">
                                <i class="fas fa-phone"></i> Call Now
                            </button>
                            <button class="btn btn-whatsapp btn-large" id="modal-whatsapp">
                                <i class="fab fa-whatsapp"></i> WhatsApp Inquiry
                            </button>
                            <button class="btn btn-secondary btn-large" id="modal-quote">
                                <i class="fas fa-file-invoice-dollar"></i> Request Quote
                            </button>
                        </div>
                    </div>
                </div>
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
            maxWidth: '1000px',
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
        
        // Modal action buttons
        modal.querySelector('#modal-call').addEventListener('click', () => {
            this.initiateCall(car.contactPhone);
        });
        
        modal.querySelector('#modal-whatsapp').addEventListener('click', () => {
            this.sendWhatsAppInquiry(car);
        });
        
        modal.querySelector('#modal-quote').addEventListener('click', () => {
            this.requestQuote(car.id);
        });
        
        // Thumbnail click handler
        modal.querySelectorAll('.thumbnail').forEach((thumb, index) => {
            thumb.addEventListener('click', () => {
                const mainImg = modal.querySelector('.main-image img');
                const tempSrc = mainImg.src;
                mainImg.src = thumb.src;
                thumb.src = tempSrc;
            });
        });
    }
    
    requestQuote(carId) {
        const car = this.cars.find(c => c.id === carId);
        if (!car) return;
        
        const modal = document.createElement('div');
        modal.className = 'modal';
        modal.innerHTML = `
            <div class="modal-content">
                <span class="modal-close">&times;</span>
                <h3>Request Quote for ${car.year} ${car.make} ${car.model}</h3>
                <form id="quote-form">
                    <div class="form-group">
                        <label for="quote-name">Full Name *</label>
                        <input type="text" id="quote-name" required>
                    </div>
                    <div class="form-group">
                        <label for="quote-phone">Phone Number *</label>
                        <input type="tel" id="quote-phone" required>
                    </div>
                    <div class="form-group">
                        <label for="quote-email">Email Address *</label>
                        <input type="email" id="quote-email" required>
                    </div>
                    <div class="form-group">
                        <label for="quote-financing">Financing Required?</label>
                        <select id="quote-financing" class="form-select">
                            <option value="no">No, I'll pay cash</option>
                            <option value="yes">Yes, I need financing</option>
                            <option value="maybe">Not sure yet</option>
                        </select>
                    </div>
                    <div class="form-group">
                        <label for="quote-trade">Trade-In Vehicle</label>
                        <input type="text" id="quote-trade" placeholder="Year, Make, Model (if applicable)">
                    </div>
                    <div class="form-group">
                        <label for="quote-message">Additional Information</label>
                        <textarea id="quote-message" placeholder="Any specific requirements or questions?"></textarea>
                    </div>
                    <button type="submit" class="btn btn-primary btn-block">Submit Quote Request</button>
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
                financing: document.getElementById('quote-financing').value,
                tradeIn: document.getElementById('quote-trade').value,
                message: document.getElementById('quote-message').value,
                car: `${car.year} ${car.make} ${car.model}`,
                carId: car.id,
                price: AutoElite.formatCurrency(car.price)
            };
            
            // Send via WhatsApp
            const whatsappMessage = `New Quote Request:\n\nCar: ${formData.car}\nPrice: ${formData.price}\nName: ${formData.name}\nPhone: ${formData.phone}\nEmail: ${formData.email}\nFinancing: ${formData.financing}\nTrade-in: ${formData.tradeIn}\nMessage: ${formData.message}`;
            const whatsappUrl = `https://wa.me/${car.contactPhone}?text=${encodeURIComponent(whatsappMessage)}`;
            
            window.open(whatsappUrl, '_blank');
            
            // Show success message
            AutoElite.showNotification('Quote request submitted successfully!', 'success');
            
            // Close modal
            modal.style.animation = 'fadeIn 0.3s ease reverse';
            setTimeout(() => document.body.removeChild(modal), 300);
        });
    }
}

// Initialize search filter when DOM is loaded
document.addEventListener('DOMContentLoaded', function() {
    if (document.getElementById('inventory-container')) {
        window.searchFilter = new SearchFilter();
    }
});