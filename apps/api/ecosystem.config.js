module.exports = {
    apps: [{
        name: 'infinite-yatra-api',
        script: 'dist/main.js',
        instances: 'max', // Use all available cores (even on t3.micro it sets 2 instances)
        exec_mode: 'cluster', // Enable zero-downtime reloads
        autorestart: true,
        watch: false,
        max_memory_restart: '450M', // 450MB per instance (2 instances = ~900MB, leaving 100MB for OS on 1GB RAM)
        env: {
            NODE_ENV: 'development'
        },
        env_production: {
            NODE_ENV: 'production',
            PORT: 3000
        }
    }]
};
