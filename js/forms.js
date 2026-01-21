// Form Validation and Submission Functions

class FormValidator {
    constructor() {
        this.forms = [];
        this.init();
    }
    
    init() {
        this.setupForms();
        this.setupEventListeners();
    }
    
    setupForms() {
        // Find all forms on the page
        this.forms = Array.from(document.querySelectorAll('form')).map(form => ({
            element: form,
            id: form.id,
            fields: this.getFormFields(form)
        }));
    }
    
    getFormFields(form) {
        const fields = [];
        const inputs = form.querySelectorAll('input, textarea, select');
        
        inputs.forEach(input => {
            if (input.type === 'hidden') return;
            
            fields.push({
                element: input,
                name: input.name || input.id,
                type: input.type,
                required: input.hasAttribute('required'),
                validation: input.dataset.validation || this.getDefaultValidation(input)
            });
        });
        
        return fields;
    }
    
    getDefaultValidation(input) {
        switch(input.type) {
            case 'email':
                return 'email';
            case 'tel':
                return 'phone';
            case 'number':
                return 'number';
            default:
                return 'text';
        }
    }
    
    setupEventListeners() {
        this.forms.forEach(formData => {
            const form = formData.element;
            
            // Real-time validation on blur
            formData.fields.forEach(field => {
                if (field.element.tagName !== 'SELECT') {
                    field.element.addEventListener('blur', () => {
                        this.validateField(field);
                    });
                }
                
                // Clear error on input
                field.element.addEventListener('input', () => {
                    this.clearError(field.element);
                });
            });
            
            // Form submission
            form.addEventListener('submit', (e) => {
                e.preventDefault();
                if (this.validateForm(formData)) {
                    this.handleFormSubmit(formData);
                }
            });
        });
    }
    
    validateForm(formData) {
        let isValid = true;
        
        formData.fields.forEach(field => {
            if (!this.validateField(field)) {
                isValid = false;
            }
        });
        
        return isValid;
    }
    
    validateField(field) {
        const value = field.element.value.trim();
        const errorElement = this.getErrorElement(field.element);
        
        // Clear previous error
        this.clearError(field.element);
        
        // Required field validation
        if (field.required && !value) {
            this.showError(field.element, errorElement, 'This field is required');
            return false;
        }
        
        // Skip further validation if field is empty and not required
        if (!value && !field.required) {
            return true;
        }
        
        // Email validation
        if (field.validation === 'email' && value) {
            const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
            if (!emailRegex.test(value)) {
                this.showError(field.element, errorElement, 'Please enter a valid email address');
                return false;
            }
        }
        
        // Phone validation
        if (field.validation === 'phone' && value) {
            const phoneRegex = /^[\d\s\-\+\(\)]{10,}$/;
            if (!phoneRegex.test(value.replace(/\D/g, ''))) {
                this.showError(field.element, errorElement, 'Please enter a valid phone number');
                return false;
            }
        }
        
        // Number validation
        if (field.validation === 'number' && value) {
            if (isNaN(value) || !isFinite(value)) {
                this.showError(field.element, errorElement, 'Please enter a valid number');
                return false;
            }
        }
        
        // Custom validation based on data attributes
        if (field.element.dataset.minLength && value.length < parseInt(field.element.dataset.minLength)) {
            this.showError(field.element, errorElement, `Minimum ${field.element.dataset.minLength} characters required`);
            return false;
        }
        
        if (field.element.dataset.maxLength && value.length > parseInt(field.element.dataset.maxLength)) {
            this.showError(field.element, errorElement, `Maximum ${field.element.dataset.maxLength} characters allowed`);
            return false;
        }
        
        if (field.element.dataset.pattern) {
            const pattern = new RegExp(field.element.dataset.pattern);
            if (!pattern.test(value)) {
                this.showError(field.element, errorElement, field.element.dataset.patternMessage || 'Invalid format');
                return false;
            }
        }
        
        return true;
    }
    
    getErrorElement(input) {
        let errorElement = input.parentElement.querySelector('.error-message');
        
        if (!errorElement) {
            errorElement = document.createElement('div');
            errorElement.className = 'error-message';
            input.parentElement.appendChild(errorElement);
        }
        
        return errorElement;
    }
    
    showError(input, errorElement, message) {
        errorElement.textContent = message;
        input.classList.add('error');
        input.focus();
    }
    
    clearError(input) {
        const errorElement = input.parentElement.querySelector('.error-message');
        if (errorElement) {
            errorElement.textContent = '';
        }
        input.classList.remove('error');
    }
    
    handleFormSubmit(formData) {
        const form = formData.element;
        const formId = formData.id;
        const formValues = this.getFormValues(formData);
        
        // Different handling based on form type
        switch(formId) {
            case 'contact-form':
            case 'service-booking-form':
            case 'rental-search-form':
                this.submitToWhatsApp(formValues, formId);
                break;
            case 'quote-form':
            case 'booking-form':
            case 'order-form':
                this.submitToWhatsApp(formValues, formId);
                break;
            default:
                this.submitToWhatsApp(formValues, 'general');
        }
        
        // Reset form
        form.reset();
        
        // Show success message
        AutoElite.showNotification('Form submitted successfully! We\'ll contact you soon.', 'success');
    }
    
    getFormValues(formData) {
        const values = {};
        
        formData.fields.forEach(field => {
            if (field.element.type === 'checkbox') {
                values[field.name] = field.element.checked;
            } else if (field.element.type === 'radio') {
                if (field.element.checked) {
                    values[field.name] = field.element.value;
                }
            } else {
                values[field.name] = field.element.value;
            }
        });
        
        return values;
    }
    
    submitToWhatsApp(formValues, formType) {
        const phoneNumber = '1234567890'; // Replace with actual number
        
        let message = '';
        
        switch(formType) {
            case 'contact-form':
                message = this.formatContactMessage(formValues);
                break;
            case 'service-booking-form':
                message = this.formatServiceBookingMessage(formValues);
                break;
            case 'rental-search-form':
                message = this.formatRentalSearchMessage(formValues);
                break;
            case 'quote-form':
                message = this.formatQuoteMessage(formValues);
                break;
            default:
                message = this.formatGenericMessage(formValues);
        }
        
        const whatsappUrl = `https://wa.me/${phoneNumber}?text=${encodeURIComponent(message)}`;
        window.open(whatsappUrl, '_blank');
    }
    
    formatContactMessage(values) {
        return `New Contact Form Submission:\n\nName: ${values.name}\nPhone: ${values.phone}\nEmail: ${values.email}\nSubject: ${values.subject}\nMessage: ${values.message}`;
    }
    
    formatServiceBookingMessage(values) {
        return `Service Booking Request:\n\nService Type: ${values.serviceType}\nVehicle: ${values.vehicleDetails}\nDate: ${values.serviceDate}\nTime: ${values.serviceTime}\nName: ${values.customerName}\nPhone: ${values.customerPhone}\nNotes: ${values.serviceNotes}\nEmergency: ${values.emergencyService ? 'Yes' : 'No'}`;
    }
    
    formatRentalSearchMessage(values) {
        return `Rental Inquiry:\n\nPick-up: ${values.pickupLocation} on ${values.pickupDate} at ${values.pickupTime}\nReturn: ${values.returnLocation} on ${values.returnDate} at ${values.returnTime}\nCar Type: ${values.carType}\nDriver Age: ${values.driverAge}`;
    }
    
    formatQuoteMessage(values) {
        return `Quote Request:\n\nCar: ${values.car}\nName: ${values.name}\nPhone: ${values.phone}\nEmail: ${values.email}\nFinancing: ${values.financing}\nTrade-in: ${values.tradeIn}\nMessage: ${values.message}`;
    }
    
    formatGenericMessage(values) {
        let message = 'Form Submission:\n\n';
        for (const [key, value] of Object.entries(values)) {
            message += `${key}: ${value}\n`;
        }
        return message;
    }
}

// Initialize form validator when DOM is loaded
document.addEventListener('DOMContentLoaded', function() {
    window.formValidator = new FormValidator();
});

// Additional form utility functions
function formatPhoneNumber(phone) {
    // Remove all non-digits
    const cleaned = phone.replace(/\D/g, '');
    
    // Check if the number is valid
    const match = cleaned.match(/^(\d{3})(\d{3})(\d{4})$/);
    if (match) {
        return '(' + match[1] + ') ' + match[2] + '-' + match[3];
    }
    
    return phone;
}

function formatCurrencyInput(input) {
    // Format input as currency
    let value = input.value.replace(/[^\d.]/g, '');
    
    if (value) {
        const number = parseFloat(value);
        if (!isNaN(number)) {
            input.value = AutoElite.formatCurrency(number);
        }
    }
}

function setupDateInputs() {
    // Set min date to today for all date inputs
    const today = new Date().toISOString().split('T')[0];
    document.querySelectorAll('input[type="date"]').forEach(input => {
        input.min = today;
        
        // Set default value to today if no value is set
        if (!input.value) {
            input.value = today;
        }
    });
}

function setupTimeInputs() {
    // Set default time to next available hour
    const now = new Date();
    const currentHour = now.getHours();
    const nextHour = currentHour + 1;
    
    document.querySelectorAll('select.time-select').forEach(select => {
        if (!select.value) {
            // Find option closest to next hour
            const options = Array.from(select.options);
            const closestOption = options.find(option => {
                const hour = parseInt(option.value.split(':')[0]);
                return hour >= nextHour;
            });
            
            if (closestOption) {
                select.value = closestOption.value;
            }
        }
    });
}

// Initialize date and time inputs
document.addEventListener('DOMContentLoaded', function() {
    setupDateInputs();
    setupTimeInputs();
});

// Phone number formatting
document.addEventListener('input', function(e) {
    if (e.target.type === 'tel' && e.target.dataset.format === 'phone') {
        const input = e.target;
        const value = input.value.replace(/\D/g, '');
        
        if (value.length <= 3) {
            input.value = value;
        } else if (value.length <= 6) {
            input.value = '(' + value.substring(0, 3) + ') ' + value.substring(3);
        } else {
            input.value = '(' + value.substring(0, 3) + ') ' + value.substring(3, 6) + '-' + value.substring(6, 10);
        }
    }
});

// Currency formatting
document.addEventListener('blur', function(e) {
    if (e.target.type === 'text' && e.target.dataset.format === 'currency') {
        formatCurrencyInput(e.target);
    }
});