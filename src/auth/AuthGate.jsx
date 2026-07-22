import { useEffect , useState } from 'react';

const TOKEN_STORAGE_KEY = 'moodrunner_token';
const LOGIN_URL = import.meta.env.VITE_LOGIN_URL || 'http://localhost:5173';

function readTokenFromUrl() {
const params = new URLSearchParams(window.location.search);
return params.get('token');
}

export default function AuthGate({children}){
    const [ready , setReady] = useState(false);

    useEffect(() =>{
        const incomingToken = readTokenFromUrl();
        if(incomingToken){
            localStorage.setItem(TOKEN_STORAGE_KEY , incomingToken);
            const url = new URL(window.location.href);
            url.searchParams.delete('token');
            window.history.replaceState({} , '', url.toString());
        }

        const token = incomingToken || localStorage.getItem(TOKEN_STORAGE_KEY);
        if(!token){
        window.location.href = `${LOGIN_URL}/login`;
        return;
        }
        
        setReady(true);
    },[]);
    if(!ready)return null;
    
    return children;
}