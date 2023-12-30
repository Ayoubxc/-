const mySecret = process.env['Ryanair ']
const router = require("express").Router();
const { register, buy, fight, weapons, list, info } = require("../controllers/hunter");

router.post("/register", register);
router.post("/buy", buy);
router.post("/fight", fight);

router.get("/weapons", weapons);
router.get("/list", list);
router.get("/info", info);

router.get("/", (req, res) => {
  res.json({
    author: "DungUwU && LyHai"
  });
});

module.exports = router;