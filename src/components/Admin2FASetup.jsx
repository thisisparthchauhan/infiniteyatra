import React, { useState } from 'react';

export default function Admin2FASetup() {
  const [qrDataUrl, setQrDataUrl] = useState('');
  const [secretKey, setSecretKey] = useState('');
  const [code, setCode] = useState('');
  const [status, setStatus] = useState('');

  const authHeader = () => {
    const token = localStorage.getItem('sessionToken');
    return { Authorization: token ? `Bearer ${token}` : '' };
  };

  const setup2FA = async () => {
    setStatus('Generating QR code...');
    try {
      const res = await fetch('/api/auth/2fa/setup', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          ...authHeader(),
        },
      });

      const data = await res.json();
      if (!res.ok) {
        throw new Error(data.error || '2FA setup failed');
      }

      setQrDataUrl(data.qrCode);
      setSecretKey(data.secret);
      setStatus('Scan the QR code with your authenticator app and verify.');
    } catch (err) {
      console.error(err);
      setStatus('2FA setup failure. Check console for details.');
    }
  };

  const verify2FA = async () => {
    setStatus('Verifying code...');
    try {
      const res = await fetch('/api/auth/2fa/verify', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          ...authHeader(),
        },
        body: JSON.stringify({ code }),
      });

      const data = await res.json();
      if (!res.ok) {
        throw new Error(data.error || '2FA code verification failed');
      }
      setStatus('2FA enabled successfully.');
    } catch (err) {
      console.error(err);
      setStatus('Invalid 2FA code. Please try again.');
    }
  };

  return (
    <div className="min-h-screen bg-slate-50 flex items-center justify-center">
      <div className="max-w-xl w-full bg-white shadow-lg rounded-xl p-6">
        <h1 className="text-2xl font-bold mb-4">Admin 2FA Setup</h1>

        <button
          className="bg-indigo-600 text-white px-4 py-2 rounded hover:bg-indigo-700"
          onClick={setup2FA}
        >
          Generate 2FA QR
        </button>

        {qrDataUrl && (
          <div className="mt-4 text-center">
            <img src={qrDataUrl} alt="2FA QR" className="mx-auto" />
            <p className="font-mono mt-2 break-words">Manual key: {secretKey}</p>
          </div>
        )}

        {qrDataUrl && (
          <div className="mt-6">
            <input
              className="border border-slate-300 rounded px-3 py-2 w-full"
              type="text"
              placeholder="Enter 6-digit code"
              value={code}
              maxLength={6}
              onChange={(e) => setCode(e.target.value)}
            />
            <button
              className="mt-3 w-full bg-green-600 text-white px-4 py-2 rounded hover:bg-green-700"
              onClick={verify2FA}
            >
              Verify 2FA Code
            </button>
          </div>
        )}

        {status && <p className="text-sm text-slate-600 mt-4">{status}</p>}
      </div>
    </div>
  );
}
