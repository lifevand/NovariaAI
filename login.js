// login.js

// Fungsi untuk mendekode token JWT (versi sederhana, tanpa verifikasi server-side untuk demo ini)
// PENTING: Untuk produksi, token ID HARUS diverifikasi di backend Anda.
function jwt_decode(token) {
    try {
        const base64Url = token.split('.')[1];
        const base64 = base64Url.replace(/-/g, '+').replace(/_/g, '/');
        const jsonPayload = decodeURIComponent(atob(base64).split('').map(function(c) {
            return '%' + ('00' + c.charCodeAt(0).toString(16)).slice(-2);
        }).join(''));
        return JSON.parse(jsonPayload);
    } catch (e) {
        console.error("Error decoding JWT", e);
        // Tampilkan pesan error ke pengguna jika token tidak valid
        const errorDiv = document.getElementById('googleSignInError');
        if (errorDiv) {
            errorDiv.textContent = "Login failed: Invalid token received.";
            errorDiv.style.display = 'block';
        }
        return null;
    }
}

function handleCredentialResponse(response) {
    // console.log("Encoded JWT ID token: " + response.credential);
    const decodedToken = jwt_decode(response.credential);

    if (!decodedToken) {
        // Error sudah ditangani di jwt_decode
        return;
    }

    const userProfile = {
        id: decodedToken.sub,
        name: decodedToken.name,
        givenName: decodedToken.given_name,
        familyName: decodedToken.family_name,
        picture: decodedToken.picture,
        email: decodedToken.email
    };

    localStorage.setItem('novaUser', JSON.stringify(userProfile));
    localStorage.setItem('isLoggedIn', 'true');

    document.body.classList.add('logged-in'); // Untuk animasi keluar
    
    // Tunggu animasi selesai, lalu redirect
    setTimeout(() => {
        window.location.href = 'index.html'; // Redirect ke halaman utama aplikasi
    }, 500); // Sesuaikan durasi dengan transisi CSS
}

window.onload = function () {
    // Pastikan meta tag client_id ada
    const clientIdMeta = document.querySelector('meta[name="google-signin-client_id"]');
    if (!clientIdMeta || !clientIdMeta.content) {
        console.error("Google Client ID not found in meta tag.");
        const errorDiv = document.getElementById('googleSignInError');
        if (errorDiv) {
            errorDiv.textContent = "Error: Google Client ID configuration missing. Login is unavailable.";
            errorDiv.style.display = 'block';
        }
        // Sembunyikan tombol Google jika Client ID tidak ada
        const googleButtonContainer = document.getElementById('googleSignInButton');
        if (googleButtonContainer) {
            googleButtonContainer.style.display = 'none';
        }
        return;
    }
    const clientId = clientIdMeta.content;

    try {
        google.accounts.id.initialize({
            client_id: clientId,
            callback: handleCredentialResponse
        });

        google.accounts.id.renderButton(
            document.getElementById("googleSignInButton"),
            { 
                theme: "outline", // "outline", "filled_blue", "filled_black"
                size: "large",    // "small", "medium", "large"
                type: "standard", // "standard", "icon"
                shape: "rectangular", // "rectangular", "pill", "circle", "square"
                text: "signin_with", // "signin_with", "signup_with", "continue_with", "signin"
                logo_alignment: "left", // "left", "center"
                width: "280" // Lebar kustom jika diperlukan, contoh "280px"
            } 
        );
        // google.accounts.id.prompt(); // Opsional: Untuk menampilkan One Tap sign-in
    } catch (error) {
        console.error("Google Identity Services initialization error:", error);
        const errorDiv = document.getElementById('googleSignInError');
        if (errorDiv) {
            errorDiv.textContent = "Could not initialize Google Sign-In. Please try again later.";
            errorDiv.style.display = 'block';
        }
    }
};