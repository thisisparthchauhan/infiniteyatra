import React, { useState, useEffect } from 'react';
import { db } from '../firebase';
import { doc, setDoc } from 'firebase/firestore';
import { packages } from '../data/packages';

const MigrateData = () => {
    const [status, setStatus] = useState('Idle');
    const [logs, setLogs] = useState([]);

    const log = (message) => {
        setLogs(prev => [...prev, `${new Date().toLocaleTimeString()}: ${message}`]);
    };

    const runMigration = async () => {
        setStatus('Running...');
        log('Starting migration...');

        try {
            for (const pkg of packages) {
                log(`Migrating package: ${pkg.title} (${pkg.id})...`);
                await setDoc(doc(db, 'packages', pkg.id), pkg);
                log(`Success: ${pkg.title}`);
            }
            log('Migration Complete! All packages updated.');
            setStatus('Completed');
        } catch (error) {
            console.error(error);
            log(`Error: ${error.message}`);
            setStatus('Failed');
        }
    };

    return (
        <div className="p-10 pt-24 min-h-screen bg-slate-100">
            <h1 className="text-3xl font-bold mb-4">Package Data Migration</h1>
            <div className="mb-4">
                <button
                    onClick={runMigration}
                    disabled={status === 'Running'}
                    className="px-4 py-2 bg-blue-600 text-white rounded hover:bg-blue-700 disabled:bg-gray-400"
                >
                    {status === 'Running' ? 'Migrating...' : 'Start Migration'}
                </button>
            </div>

            <div className="bg-white p-4 rounded shadow font-mono text-sm h-96 overflow-y-auto">
                {logs.length === 0 ? (
                    <p className="text-gray-500">Ready to migrate. Click the button above.</p>
                ) : (
                    logs.map((l, i) => <div key={i}>{l}</div>)
                )}
            </div>
        </div>
    );
};

export default MigrateData;
