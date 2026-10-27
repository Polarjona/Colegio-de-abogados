const app = require('./app');
const { getConfig } = require('./config');

const { port } = getConfig();
app.listen(port, () => {
  console.log(`Backend listening on port ${port}`);
});
