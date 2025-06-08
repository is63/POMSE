import Echo from 'laravel-echo';
import Pusher from 'pusher-js';

window.Pusher = Pusher;

const token = sessionStorage.getItem('token') || localStorage.getItem('token');

const echo = new Echo({
    broadcaster: 'pusher',
    key: import.meta.env.VITE_PUSHER_APP_KEY, 
    cluster: import.meta.env.VITE_PUSHER_APP_CLUSTER,
    forceTLS: true,
    encrypted: true,
    authEndpoint: 'http://localhost:8080/broadcasting/auth',
    auth: {
        headers: {
            Authorization: token ? `Bearer ${token}` : ''
        }
    }
});

export default echo;