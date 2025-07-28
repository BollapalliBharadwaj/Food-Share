// Global state
let currentUser = null;
let authToken = null;
let donations = [];

// DOM Content Loaded
document.addEventListener('DOMContentLoaded', function() {
    initializeApp();
    loadDonations();
    
    // Check for existing authentication
    const token = localStorage.getItem('authToken');
    const user = localStorage.getItem('currentUser');
    
    if (token && user) {
        authToken = token;
        currentUser = JSON.parse(user);
        updateUIForLoggedInUser();
    }
});

// Initialize app
function initializeApp() {
    // Form event listeners
    document.getElementById('login-form').addEventListener('submit', handleLogin);
    document.getElementById('register-form').addEventListener('submit', handleRegister);
    document.getElementById('donation-form').addEventListener('submit', handleDonationSubmit);
    document.getElementById('request-form').addEventListener('submit', handleRequestSubmit);
    
    // Search and filter event listeners
    document.getElementById('search-input').addEventListener('input', filterDonations);
    document.getElementById('food-type-filter').addEventListener('change', filterDonations);
    
    // Modal event listeners
    window.addEventListener('click', function(event) {
        const modals = document.querySelectorAll('.modal');
        modals.forEach(modal => {
            if (event.target === modal) {
                modal.style.display = 'none';
            }
        });
    });
    
    // Smooth scrolling for navigation links
    document.querySelectorAll('a[href^="#"]').forEach(anchor => {
        anchor.addEventListener('click', function (e) {
            e.preventDefault();
            const target = document.querySelector(this.getAttribute('href'));
            if (target) {
                target.scrollIntoView({
                    behavior: 'smooth',
                    block: 'start'
                });
            }
        });
    });
}

// Authentication Functions
async function handleLogin(e) {
    e.preventDefault();
    
    const email = document.getElementById('login-email').value;
    const password = document.getElementById('login-password').value;
    
    try {
        const response = await fetch('/api/login', {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json',
            },
            body: JSON.stringify({ email, password }),
        });
        
        const data = await response.json();
        
        if (response.ok) {
            authToken = data.token;
            currentUser = data.user;
            
            // Store in localStorage
            localStorage.setItem('authToken', authToken);
            localStorage.setItem('currentUser', JSON.stringify(currentUser));
            
            updateUIForLoggedInUser();
            closeModal('login-modal');
            showNotification('Login successful!', 'success');
            
            // Reset form
            document.getElementById('login-form').reset();
        } else {
            showNotification(data.message || 'Login failed', 'error');
        }
    } catch (error) {
        console.error('Login error:', error);
        showNotification('Network error. Please try again.', 'error');
    }
}

async function handleRegister(e) {
    e.preventDefault();
    
    const formData = {
        name: document.getElementById('register-name').value,
        email: document.getElementById('register-email').value,
        password: document.getElementById('register-password').value,
        phone: document.getElementById('register-phone').value,
        address: document.getElementById('register-address').value,
        userType: document.getElementById('register-type').value,
    };
    
    try {
        const response = await fetch('/api/register', {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json',
            },
            body: JSON.stringify(formData),
        });
        
        const data = await response.json();
        
        if (response.ok) {
            authToken = data.token;
            currentUser = data.user;
            
            // Store in localStorage
            localStorage.setItem('authToken', authToken);
            localStorage.setItem('currentUser', JSON.stringify(currentUser));
            
            updateUIForLoggedInUser();
            closeModal('register-modal');
            showNotification('Registration successful!', 'success');
            
            // Reset form
            document.getElementById('register-form').reset();
        } else {
            showNotification(data.message || 'Registration failed', 'error');
        }
    } catch (error) {
        console.error('Registration error:', error);
        showNotification('Network error. Please try again.', 'error');
    }
}

function logout() {
    authToken = null;
    currentUser = null;
    
    // Clear localStorage
    localStorage.removeItem('authToken');
    localStorage.removeItem('currentUser');
    
    updateUIForLoggedOutUser();
    hideAllSections();
    showSection('home');
    showNotification('Logged out successfully!', 'success');
}

// UI Update Functions
function updateUIForLoggedInUser() {
    // Hide auth buttons
    document.querySelector('.auth-buttons').style.display = 'none';
    
    // Show user menu
    const userMenu = document.querySelector('.user-menu');
    userMenu.style.display = 'flex';
    document.querySelector('.user-name').textContent = currentUser.name;
    
    // Update hero buttons if user is logged in
    const heroButtons = document.querySelector('.hero-buttons');
    if (currentUser.userType === 'donor') {
        heroButtons.innerHTML = `
            <button class="btn btn-primary btn-large" onclick="showDonationModal()">Add Donation</button>
            <button class="btn btn-outline btn-large" onclick="showDashboard()">My Dashboard</button>
        `;
    } else {
        heroButtons.innerHTML = `
            <button class="btn btn-primary btn-large" onclick="document.getElementById('donations').scrollIntoView({behavior: 'smooth'})">Browse Donations</button>
            <button class="btn btn-outline btn-large" onclick="showDashboard()">My Dashboard</button>
        `;
    }
}

function updateUIForLoggedOutUser() {
    // Show auth buttons
    document.querySelector('.auth-buttons').style.display = 'flex';
    
    // Hide user menu
    document.querySelector('.user-menu').style.display = 'none';
    
    // Reset hero buttons
    const heroButtons = document.querySelector('.hero-buttons');
    heroButtons.innerHTML = `
        <button class="btn btn-primary btn-large" onclick="showRegisterModal('donor')">Donate Food</button>
        <button class="btn btn-outline btn-large" onclick="showRegisterModal('recipient')">Find Food</button>
    `;
}

// Modal Functions
function showLoginModal() {
    document.getElementById('login-modal').style.display = 'block';
}

function showRegisterModal(userType = '') {
    const modal = document.getElementById('register-modal');
    modal.style.display = 'block';
    
    if (userType) {
        document.getElementById('register-type').value = userType;
    }
}

function showDonationModal() {
    if (!currentUser) {
        showNotification('Please login first', 'error');
        showLoginModal();
        return;
    }
    
    if (currentUser.userType !== 'donor') {
        showNotification('Only donors can add food donations', 'error');
        return;
    }
    
    document.getElementById('donation-modal').style.display = 'block';
    
    // Set minimum date to today
    const today = new Date().toISOString().split('T')[0];
    document.getElementById('donation-expiry').min = today;
}

function closeModal(modalId) {
    document.getElementById(modalId).style.display = 'none';
}

// Dashboard Functions
function showDashboard() {
    if (!currentUser) {
        showNotification('Please login first', 'error');
        showLoginModal();
        return;
    }

    hideAllSections();
    const dashboard = document.getElementById('dashboard');
    dashboard.style.display = 'block';
    loadUserDonations();
    loadRequests(); // Load requests when dashboard opens

    // ✅ Scroll directly to the dashboard section
    dashboard.scrollIntoView({ behavior: 'smooth' });
}


function showSection(sectionId) {
    hideAllSections();
    const section = document.getElementById(sectionId);
    if (section) {
        section.style.display = 'block';
    }
}

function hideAllSections() {
    document.getElementById('dashboard').style.display = 'none';
    // Note: Other sections are always visible, we just scroll to them
}

function showTab(tabName) {
    // Remove active class from all tabs
    document.querySelectorAll('.tab-btn').forEach(btn => btn.classList.remove('active'));
    document.querySelectorAll('.tab-content').forEach(content => content.classList.remove('active'));
    
    // Add active class to clicked tab
    event.target.classList.add('active');
    document.getElementById(tabName).classList.add('active');
    
    if (tabName === 'profile') {
        showProfile();
    } else if (tabName === 'requests') {
        loadRequests();
    } else if (tabName === 'my-donations') {
        loadUserDonations();
    }
}

function showProfile() {
    const profileDetails = document.getElementById('profile-details');
    if (currentUser) {
        profileDetails.innerHTML = `
            <p><strong>Name:</strong> ${currentUser.name}</p>
            <p><strong>Email:</strong> ${currentUser.email}</p>
            <p><strong>Account Type:</strong> ${currentUser.userType}</p>
        `;
    }
}

// Donation Functions
async function handleDonationSubmit(e) {
    e.preventDefault();
    
    const formData = {
        title: document.getElementById('donation-title').value,
        description: document.getElementById('donation-description').value,
        foodType: document.getElementById('donation-food-type').value,
        quantity: document.getElementById('donation-quantity').value,
        expiryDate: document.getElementById('donation-expiry').value,
        location: document.getElementById('donation-location').value,
        contactInfo: document.getElementById('donation-contact').value,
    };
    
    try {
        const response = await fetch('/api/donations', {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json',
                'Authorization': `Bearer ${authToken}`,
            },
            body: JSON.stringify(formData),
        });
        
        const data = await response.json();
        
        if (response.ok) {
            closeModal('donation-modal');
            showNotification('Donation added successfully!', 'success');
            document.getElementById('donation-form').reset();
            
            // Refresh donations
            loadDonations();
            if (document.getElementById('dashboard').style.display !== 'none') {
                loadUserDonations();
            }
        } else {
            showNotification(data.message || 'Failed to add donation', 'error');
        }
    } catch (error) {
        console.error('Donation submission error:', error);
        showNotification('Network error. Please try again.', 'error');
    }
}

async function loadDonations() {
    try {
        const response = await fetch('/api/donations');
        
        if (response.ok) {
            const data = await response.json();
            donations = data;
            displayDonations(donations);
        } else {
            console.error('Failed to load donations');
            donations = [];
            displayDonations(donations);
        }
    } catch (error) {
        console.error('Error loading donations:', error);
        donations = [];
        displayDonations(donations);
    }
}

async function loadUserDonations() {
    if (!authToken) return;
    
    try {
        const response = await fetch('/api/my-donations', {
            headers: {
                'Authorization': `Bearer ${authToken}`,
            },
        });
        
        const data = await response.json();
        
        if (response.ok) {
            displayUserDonations(data);
        } else {
            console.error('Failed to load user donations:', data.message);
            showNotification('Failed to load your donations', 'error');
        }
    } catch (error) {
        console.error('Error loading user donations:', error);
        showNotification('Network error while loading your donations', 'error');
    }
}

function displayDonations(donationsToShow) {
    const grid = document.getElementById('donations-grid');
    
    if (donationsToShow.length === 0) {
        grid.innerHTML = `
            <div class="text-center" style="grid-column: 1 / -1; padding: 2rem;">
                <i class="fas fa-search" style="font-size: 3rem; color: var(--text-secondary); margin-bottom: 1rem;"></i>
                <h3>No donations found</h3>
                <p>Be the first to share food in your community!</p>
            </div>
        `;
        return;
    }
    
    grid.innerHTML = donationsToShow.map(donation => {
        const expiryDate = new Date(donation.expiryDate);
        const isExpiringSoon = (expiryDate - new Date()) < (24 * 60 * 60 * 1000); // 1 day
        
        return `
            <div class="donation-card slide-up">
                <div class="donation-header">
                    <div>
                        <h3 class="donation-title">${donation.title}</h3>
                        <span class="donation-type">${donation.foodType}</span>
                    </div>
                    ${isExpiringSoon ? '<i class="fas fa-exclamation-triangle" style="color: var(--warning-color);" title="Expiring soon"></i>' : ''}
                </div>
                <div class="donation-info">
                    <p><i class="fas fa-align-left"></i> ${donation.description}</p>
                    <p><i class="fas fa-weight-hanging"></i> Quantity: ${donation.quantity}</p>
                    <p><i class="fas fa-calendar-alt"></i> Expires: ${expiryDate.toLocaleDateString()}</p>
                    <p><i class="fas fa-map-marker-alt"></i> ${donation.location}</p>
                </div>
                <div class="donation-meta">
                    <div class="donor-info">
                        <i class="fas fa-user"></i> ${donation.donorName}
                    </div>
                    <div class="donation-buttons">
                        <button class="btn btn-primary contact-btn" onclick="contactDonor('${donation._id}', '${donation.contactInfo}', '${donation.title}')">
                            <i class="fas fa-phone"></i> Contact
                        </button>
                        ${currentUser && currentUser.userType === 'recipient' ? `<button class="btn btn-outline contact-btn" onclick="requestFood('${donation._id}', '${donation.title}')">
                            <i class="fas fa-hand-paper"></i> Request
                        </button>` : ''}
                    </div>
                </div>
            </div>
        `;
    }).join('');
}

function displayUserDonations(userDonations) {
    const container = document.getElementById('my-donations-list');
    
    if (userDonations.length === 0) {
        container.innerHTML = `
            <div class="text-center" style="padding: 2rem;">
                <i class="fas fa-plus-circle" style="font-size: 3rem; color: var(--text-secondary); margin-bottom: 1rem;"></i>
                <h3>No donations yet</h3>
                <p>Start sharing food with your community!</p>
                <button class="btn btn-primary" onclick="showDonationModal()">Add Your First Donation</button>
            </div>
        `;
        return;
    }
    
    container.innerHTML = userDonations.map(donation => {
        const expiryDate = new Date(donation.expiryDate);
        const createdDate = new Date(donation.createdAt);
        
        return `
            <div class="my-donation-card">
                <div class="donation-header">
                    <div>
                        <h3 class="donation-title">${donation.title}</h3>
                        <span class="donation-type">${donation.foodType}</span>
                    </div>
                    <span class="status-badge status-${donation.status}">${donation.status}</span>
                </div>
                <div class="donation-info">
                    <p><i class="fas fa-align-left"></i> ${donation.description}</p>
                    <p><i class="fas fa-weight-hanging"></i> Quantity: ${donation.quantity}</p>
                    <p><i class="fas fa-calendar-alt"></i> Expires: ${expiryDate.toLocaleDateString()}</p>
                    <p><i class="fas fa-clock"></i> Posted: ${createdDate.toLocaleDateString()}</p>
                </div>
                <div class="donation-actions">
                    ${donation.status === 'available' ? `
                        <button class="btn btn-small btn-outline" onclick="updateDonationStatus('${donation._id}', 'claimed')">Mark as Claimed</button>
                        <button class="btn btn-small btn-outline" onclick="updateDonationStatus('${donation._id}', 'completed')">Mark as Completed</button>
                    ` : ''}
                    <button class="btn btn-small btn-danger" onclick="deleteDonation('${donation._id}')">Delete</button>
                </div>
            </div>
        `;
    }).join('');
}

// Donation Actions
function contactDonor(donationId, contactInfo, donationTitle) {
    if (!currentUser) {
        showNotification('Please login to contact donors', 'error');
        showLoginModal();
        return;
    }
    
    // Create a modal or alert with contact information
    const message = `Contact information for "${donationTitle}":\n\n${contactInfo}\n\nPlease reach out to arrange pickup!`;
    alert(message);
    
    // In a real app, you might want to:
    // - Open email client with pre-filled email
    // - Show phone number with call option
    // - Create internal messaging system
}

async function updateDonationStatus(donationId, status) {
    try {
        const response = await fetch(`/api/donations/${donationId}`, {
            method: 'PATCH',
            headers: {
                'Content-Type': 'application/json',
                'Authorization': `Bearer ${authToken}`,
            },
            body: JSON.stringify({ status }),
        });
        
        const data = await response.json();
        
        if (response.ok) {
            showNotification(`Donation marked as ${status}!`, 'success');
            loadUserDonations();
            loadDonations(); // Refresh main donations list
        } else {
            showNotification(data.message || 'Failed to update donation', 'error');
        }
    } catch (error) {
        console.error('Error updating donation:', error);
        showNotification('Network error. Please try again.', 'error');
    }
}

async function deleteDonation(donationId) {
    if (!confirm('Are you sure you want to delete this donation?')) {
        return;
    }
    
    try {
        const response = await fetch(`/api/donations/${donationId}`, {
            method: 'DELETE',
            headers: {
                'Authorization': `Bearer ${authToken}`,
            },
        });
        
        const data = await response.json();
        
        if (response.ok) {
            showNotification('Donation deleted successfully!', 'success');
            loadUserDonations();
            loadDonations(); // Refresh main donations list
        } else {
            showNotification(data.message || 'Failed to delete donation', 'error');
        }
    } catch (error) {
        console.error('Error deleting donation:', error);
        showNotification('Network error. Please try again.', 'error');
    }
}

// Request Functions
function requestFood(donationId, donationTitle) {
    if (!currentUser) {
        showNotification('Please login to request food', 'error');
        showLoginModal();
        return;
    }
    
    if (currentUser.userType !== 'recipient') {
        showNotification('Only recipients can request food', 'error');
        return;
    }
    
    document.getElementById('request-donation-id').value = donationId;
    document.getElementById('request-modal').style.display = 'block';
}

async function handleRequestSubmit(e) {
    e.preventDefault();
    
    const donationId = document.getElementById('request-donation-id').value;
    const reason = document.getElementById('request-reason').value;
    
    try {
        const response = await fetch('/api/requests', {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json',
                'Authorization': `Bearer ${authToken}`,
            },
            body: JSON.stringify({ donationId, reason }),
        });
        
        const data = await response.json();
        
        if (response.ok) {
            closeModal('request-modal');
            showNotification('Food request sent successfully!', 'success');
            document.getElementById('request-form').reset();
        } else {
            showNotification(data.message || 'Failed to send request', 'error');
        }
    } catch (error) {
        console.error('Request submission error:', error);
        showNotification('Network error. Please try again.', 'error');
    }
}

async function loadRequests() {
    if (!authToken) return;
    
    try {
        const response = await fetch('/api/my-requests', {
            headers: {
                'Authorization': `Bearer ${authToken}`,
            },
        });
        
        const data = await response.json();
        
        if (response.ok) {
            displayRequests(data);
        } else {
            console.error('Failed to load requests:', data.message);
            showNotification('Failed to load requests', 'error');
        }
    } catch (error) {
        console.error('Error loading requests:', error);
        showNotification('Network error while loading requests', 'error');
    }
}

function displayRequests(requests) {
    const container = document.getElementById('requests-list');
    
    if (requests.length === 0) {
        container.innerHTML = `
            <div class="text-center" style="padding: 2rem;">
                <i class="fas fa-inbox" style="font-size: 3rem; color: var(--text-secondary); margin-bottom: 1rem;"></i>
                <h3>No requests yet</h3>
                <p>${currentUser.userType === 'donor' ? 'No one has requested your donations yet.' : 'You haven\'t made any food requests yet.'}</p>
            </div>
        `;
        return;
    }
    
    // Group requests by donation for donors
    let displayRequests = requests;
    if (currentUser.userType === 'donor') {
        // Sort by donation title and then by creation date
        displayRequests = requests.sort((a, b) => {
            if (a.donationTitle !== b.donationTitle) {
                return a.donationTitle.localeCompare(b.donationTitle);
            }
            return new Date(a.createdAt) - new Date(b.createdAt);
        });
    }
    
    container.innerHTML = displayRequests.map((request, index) => {
        const createdDate = new Date(request.createdAt);
        
        // Show donation title separator for donors when donation changes
        const showSeparator = currentUser.userType === 'donor' && 
            index > 0 && 
            displayRequests[index - 1].donationTitle !== request.donationTitle;
        
        return `
            ${showSeparator ? `<div class="donation-separator"><h4>${request.donationTitle}</h4></div>` : ''}
            <div class="request-card">
                <div class="request-header">
                    <div>
                        <h3 class="request-title">${currentUser.userType === 'donor' ? `Request from ${request.recipientName}` : request.donationTitle}</h3>
                        <span class="request-from">${currentUser.userType === 'donor' ? 'From: ' + request.recipientName : 'Your Request'}</span>
                    </div>
                    <span class="status-badge status-${request.status}">${request.status}</span>
                </div>
                <div class="request-info">
                    ${currentUser.userType === 'donor' ? `<p><i class="fas fa-utensils"></i> <strong>Item:</strong> ${request.donationTitle}</p>` : ''}
                    <p><i class="fas fa-comment"></i> <strong>Reason:</strong> ${request.reason}</p>
                    ${request.donorResponse ? `<p><i class="fas fa-reply"></i> <strong>Response:</strong> ${request.donorResponse}</p>` : ''}
                    ${currentUser.userType === 'donor' ? `
                        <p><i class="fas fa-envelope"></i> <strong>Email:</strong> ${request.recipientEmail}</p>
                        <p><i class="fas fa-phone"></i> <strong>Phone:</strong> ${request.recipientPhone}</p>
                    ` : ''}
                    <p><i class="fas fa-clock"></i> <strong>Requested:</strong> ${createdDate.toLocaleDateString()}</p>
                </div>
                ${currentUser.userType === 'donor' && request.status === 'pending' ? `
                    <div class="request-actions">
                        <button class="btn btn-primary btn-small" onclick="showResponseModal('${request._id}', '${request.recipientName}', '${request.donationTitle}', '${request.reason}')">
                            Respond
                        </button>
                    </div>
                ` : ''}
            </div>
        `;
    }).join('');
}

function showResponseModal(requestId, recipientName, donationTitle, reason) {
    document.getElementById('response-request-id').value = requestId;
    document.getElementById('request-details').innerHTML = `
        <div class="request-summary">
            <h4>${donationTitle}</h4>
            <p><strong>Requested by:</strong> ${recipientName}</p>
            <p><strong>Reason:</strong> ${reason}</p>
        </div>
    `;
    document.getElementById('response-modal').style.display = 'block';
}

async function respondToRequest(status) {
    const requestId = document.getElementById('response-request-id').value;
    const donorResponse = document.getElementById('donor-response').value;
    
    try {
        const response = await fetch(`/api/requests/${requestId}`, {
            method: 'PATCH',
            headers: {
                'Content-Type': 'application/json',
                'Authorization': `Bearer ${authToken}`,
            },
            body: JSON.stringify({ status, donorResponse }),
        });
        
        const data = await response.json();
        
        if (response.ok) {
            closeModal('response-modal');
            showNotification(`Request ${status} successfully!`, 'success');
            loadRequests();
            loadUserDonations(); // Refresh donations if accepted
        } else {
            showNotification(data.message || 'Failed to respond to request', 'error');
        }
    } catch (error) {
        console.error('Response error:', error);
        showNotification('Network error. Please try again.', 'error');
    }
}

// Search and Filter Functions
function filterDonations() {
    const searchTerm = document.getElementById('search-input').value.toLowerCase();
    const foodTypeFilter = document.getElementById('food-type-filter').value;
    
    let filteredDonations = donations.filter(donation => {
        const matchesSearch = !searchTerm || 
            donation.title.toLowerCase().includes(searchTerm) ||
            donation.description.toLowerCase().includes(searchTerm) ||
            donation.location.toLowerCase().includes(searchTerm) ||
            donation.foodType.toLowerCase().includes(searchTerm);
        
        const matchesFoodType = !foodTypeFilter || donation.foodType === foodTypeFilter;
        
        return matchesSearch && matchesFoodType;
    });
    
    displayDonations(filteredDonations);
}

// Notification Function
function showNotification(message, type = 'info') {
    // Create notification element
    const notification = document.createElement('div');
    notification.className = `notification notification-${type}`;
    notification.style.cssText = `
        position: fixed;
        top: 20px;
        right: 20px;
        padding: 1rem 1.5rem;
        background-color: ${type === 'success' ? 'var(--success-color)' : type === 'error' ? 'var(--error-color)' : 'var(--primary-color)'};
        color: white;
        border-radius: var(--border-radius);
        box-shadow: var(--shadow-lg);
        z-index: 3000;
        max-width: 300px;
        animation: slideInRight 0.3s ease;
    `;
    
    notification.innerHTML = `
        <div style="display: flex; align-items: center; gap: 0.5rem;">
            <i class="fas fa-${type === 'success' ? 'check-circle' : type === 'error' ? 'exclamation-circle' : 'info-circle'}"></i>
            <span>${message}</span>
        </div>
    `;
    
    // Add to DOM
    document.body.appendChild(notification);
    
    // Remove after 3 seconds
    setTimeout(() => {
        notification.style.animation = 'slideOutRight 0.3s ease';
        setTimeout(() => {
            document.body.removeChild(notification);
        }, 300);
    }, 3000);
}

// Add CSS for notification animations
const style = document.createElement('style');
style.textContent = `
    @keyframes slideInRight {
        from {
            transform: translateX(100%);
            opacity: 0;
        }
        to {
            transform: translateX(0);
            opacity: 1;
        }
    }
    
    @keyframes slideOutRight {
        from {
            transform: translateX(0);
            opacity: 1;
        }
        to {
            transform: translateX(100%);
            opacity: 0;
        }
    }
`;
document.head.appendChild(style);

// Auto-refresh donations every 30 seconds
setInterval(() => {
    if (document.getElementById('dashboard').style.display === 'none') {
        loadDonations();
    }
}, 30000);
