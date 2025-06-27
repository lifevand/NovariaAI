document.addEventListener('DOMContentLoaded', () => {
    // === Data for Feature Cards ===
    const featureCardsData = [
        {
            icon: "forum",
            title: "Smart Chat Assistant",
            description: "Get instant, intelligent responses for any question, topic, or creative idea.",
        },
        {
            icon: "brush",
            title: "AI Image Generator",
            description: "Transform your words into stunning visuals and imaginative artwork with ease.",
        },
        {
            icon: "code",
            title: "Advanced Code Generation",
            description: "Write, debug, and understand code faster across multiple programming languages.",
        },
        {
            icon: "edit_note",
            title: "Content Creation",
            description: "Generate engaging articles, captivating stories, and compelling marketing copy.",
        },
        {
            icon: "translate",
            title: "Multi-Language Support",
            description: "Communicate and create in various languages with seamless translation.",
        },
        {
            icon: "science",
            title: "Research & Analysis",
            description: "Summarize complex documents, extract key insights, and analyze data efficiently.",
        }
    ];

    // === Function to Render Feature Cards ===
    function renderFeatureCards() {
        const grid = document.getElementById('featuresGrid');
        if (!grid) return;

        grid.innerHTML = ''; // Clear existing content
        featureCardsData.forEach(card => {
            const cardElement = document.createElement('div');
            cardElement.className = 'feature-card';
            cardElement.innerHTML = `
                <span class="material-symbols-outlined card-icon">${card.icon}</span>
                <h3>${card.title}</h3>
                <p>${card.description}</p>
            `;
            grid.appendChild(cardElement);
        });
    }

    // === Header Auth Button Management (adapted from login.js) ===
    function updatePageHeaderAuthButton() {
        const headerAuthPlaceholder = document.getElementById('pageHeaderAuthPlaceholder');
        if (!headerAuthPlaceholder) return;

        headerAuthPlaceholder.innerHTML = ''; // Clear previous button/initial

        const isLoggedIn = localStorage.getItem('isLoggedIn') === 'true';
        const storedUser = localStorage.getItem('novaUser');
        let currentUser = null;

        if (isLoggedIn && storedUser) {
            try {
                currentUser = JSON.parse(storedUser);
                if (!currentUser || !currentUser.name) {
                    localStorage.removeItem('isLoggedIn');
                    localStorage.removeItem('novaUser');
                    currentUser = null;
                }
            } catch (e) {
                console.error("Error parsing user data in header:", e);
                localStorage.removeItem('isLoggedIn');
                localStorage.removeItem('novaUser');
                currentUser = null;
            }
        }

        if (currentUser) {
            // Display user initial button
            const initial = (currentUser.givenName || currentUser.name || 'U').charAt(0).toUpperCase();
            const userButton = document.createElement('a'); // Changed to <a> for direct link
            userButton.className = 'auth-button user-initial-button';
            userButton.textContent = initial;
            userButton.title = currentUser.name || currentUser.email;
            userButton.href = 'index.html'; // Link directly to main app

            headerAuthPlaceholder.appendChild(userButton);
        } else {
            // Display "Log In" button
            const loginButton = document.createElement('a'); // Changed to <a> for direct link
            loginButton.id = 'pageHeaderLoginButton';
            loginButton.className = 'auth-button';
            loginButton.textContent = 'Log In';
            loginButton.href = 'login.html'; // Link directly to login page
            headerAuthPlaceholder.appendChild(loginButton);
        }
    }

    // === CTA Button Logic ===
    function setupCtaButtons() {
        const ctaButtons = document.querySelectorAll('.cta-button');

        ctaButtons.forEach(button => {
            button.addEventListener('click', function(event) {
                event.preventDefault(); // Prevent default link behavior

                if (localStorage.getItem('isLoggedIn') === 'true') {
                    // If logged in, go to the main app
                    window.location.href = 'index.html';
                } else {
                    // If not logged in, go to login page and set redirect target
                    localStorage.setItem('redirectAfterLogin', 'index.html'); // Always redirect to main app after login
                    window.location.href = 'login.html';
                }
            });
        });
    }

    // === Theme Management (adapting from index.html/login.js) ===
    function applyPageTheme() {
        const savedTheme = localStorage.getItem('novaai_theme'); // Use the same key as main app
        if (savedTheme === 'light-mode') {
            document.body.classList.add('light-mode');
        } else {
            document.body.classList.remove('light-mode');
        }
    }

    // === Initialize on Load ===
    renderFeatureCards();
    updatePageHeaderAuthButton();
    setupCtaButtons();
    applyPageTheme(); // Apply theme on load

    // Update copyright year
    const currentYearSpan = document.getElementById('currentYear');
    if (currentYearSpan) {
        currentYearSpan.textContent = new Date().getFullYear();
    }
});