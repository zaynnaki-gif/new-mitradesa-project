module.exports = {
  apps: [
    {
      name: 'mitradesa-api',
      script: 'npm',
      args: 'run start',
      cwd: './apps/api',
      instances: 'max', // Scale across all available CPUs
      exec_mode: 'cluster',
      autorestart: true,
      watch: false,
      max_memory_restart: '1G',
      env: {
        NODE_ENV: 'production',
        PORT: 3000
      }
    }
  ]
};
