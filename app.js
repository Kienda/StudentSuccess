const express = require("express");
const app = express();

const PORT = 1800;

app.get("/", (req, res) => {
  res.send(`<h1>Welcome the server is running`);
});

app.listen(PORT, () => {
  console.log(`The server is running on Port: http://localhost:${PORT}`);
});