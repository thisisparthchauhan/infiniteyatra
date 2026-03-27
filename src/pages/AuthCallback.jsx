import React, { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';

export default function AuthCallback() {
  const navigate = useNavigate();
  const [message, setMessage] = useState('Finalizing authentication...');

  useEffect(() => {
    const urlParams = new URLSearchParams(window.location.search);
    const code = urlParams.get('code');

    if (!code) {
      setMessage('No code found in callback URL. Redirecting to login...');
      setTimeout(() => {
        navigate('/login');
      }, 2000);
      return;
    }

    (async () => {
      try {
        const response = await fetch('/api/auth/oauth-callback', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ code }),
        });

        const data = await response.json();
        if (!response.ok) {
          throw new Error(data.error || 'OAuth callback failed');
        }

        localStorage.setItem('sessionToken', data.token || data.sessionToken || '');
        setMessage('Authentication successful! Redirecting...');
        setTimeout(() => {
          navigate('/dashboard');
        }, 1000);
      } catch (error) {
        console.error('OAuth callback error', error);
        setMessage('OAuth login failed. Please try again.');
        setTimeout(() => {
          navigate('/login');
        }, 4000);
      }
    })();
  }, [navigate]);

  return (
    <div className="min-h-screen flex items-center justify-center bg-slate-50">
      <div className="rounded-xl shadow-xl p-8 bg-white text-center max-w-md">
        <p className="text-lg font-medium text-slate-700">{message}</p>
      </div>
    </div>
  );
}
