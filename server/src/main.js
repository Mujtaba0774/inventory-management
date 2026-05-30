import app from './app.js';

const port = Number(process.env.PORT) || 5000;

const server = app.listen(port, () => {
  console.log(`Server is running on port ${port}`);
});

server.on('error', (error) => {
  if (error.code === 'EADDRINUSE') {
    console.error(`Port ${port} is already in use. Set PORT in server/.env to a free port.`);
    process.exit(1);
  }

  console.error('Server startup error:', error);
  process.exit(1);
});