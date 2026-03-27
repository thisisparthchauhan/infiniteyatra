import React from 'react';

export default function OAuthLogin() {
  const handleGoogleLogin = async () => {
    try {
      const response = await fetch('/api/auth/oauth-url?provider=google');
      const data = await response.json();
      if (data.authUrl) {
        window.location.href = data.authUrl;
      } else {
        console.error('OAuth URL response bad', data);
      }
    } catch (error) {
      console.error('OAuth URL request failed', error);
      alert('Unable to initiate Google login. Please try again.');
    }
  };

  return (
    <button
      type="button"
      onClick={handleGoogleLogin}
      className="px-4 py-2 bg-blue-600 text-white rounded hover:bg-blue-700"
    >
      Continue with Google
    </button>
  );
}
