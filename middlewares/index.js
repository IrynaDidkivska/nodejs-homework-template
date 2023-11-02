const isValidId = require("../middlewares/isValidId");
const authenticate = require("../middlewares/authenticate");
const upload = require("../middlewares/upload");

module.exports = {
  isValidId,
  authenticate,
  upload,
};
