require("dotenv").config();

const app = require("./app");
const port = Number(process.env.PORT || 3000);
const host = process.env.HOST || "0.0.0.0";

app.listen(port, host, () => {
  console.log(`CGI website listening on ${host}:${port}`);
});
