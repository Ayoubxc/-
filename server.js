const bodyParser = require('body-parser');
const express = require("express");
const cors = require("cors");
const helmet = require("helmet");
const api = require("./routes/api");
const app = express();
const rateLimit = require("express-rate-limit");

const limiter = rateLimit({
  windowMs: 10 * 60 * 1000,
  max: 10000
});

app.use(limiter);

app.use(helmet());
app.use(express.json());
app.use(cors());

app.set('json spaces', 40);
app.use("/", api);

app.use((error, req, res, next) => {
  res.status(error.status).json({ message: error.message });
});

(async () => {
  app.listen(process.env.PORT || 80);
  console.log(
    "-----------------\n----connected----\n-----------------"
    );
})();
