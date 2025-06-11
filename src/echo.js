import Echo from 'laravel-echo';
import Pusher from 'pusher-js';

window.Pusher = Pusher;

let echoInstance = null;
let currentToken = null;

function createEcho(token) {
    return new Echo({
        broadcaster: 'pusher',
        key: import.meta.env.VITE_PUSHER_APP_KEY,
        cluster: import.meta.env.VITE_PUSHER_APP_CLUSTER,
        forceTLS: true,
        encrypted: true,
        authEndpoint: 'http://localhost:8080/broadcasting/auth',
        auth: {
            headers: {
                Authorization: token ? `Bearer ${token}` : '',
                Accept: 'application/json'
            }
        }
    });
}

export function getEcho() {
    const token = sessionStorage.getItem('token') || localStorage.getItem('token');
    if (!token) {
        // Si no hay token, no devolvemos instancia
        return null;
    }
    if (!echoInstance || currentToken !== token) {
        echoInstance = createEcho(token);
        currentToken = token;
    }
    return echoInstance;
}

export default getEcho;