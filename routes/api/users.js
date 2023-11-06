const express = require("express");

const userCtrl = require("../../controllers/users");

const { validateBody } = require("../../decorators");

const { userSingupSchema, userSinginSchema } = require("../../models/User");
const { authenticate, upload } = require("../../middlewares");

const userRouter = express.Router();

userRouter.post("/register", validateBody(userSingupSchema), userCtrl.signup);
userRouter.post("/login", validateBody(userSinginSchema), userCtrl.signin);
userRouter.get("/current", authenticate, userCtrl.getCurrent);
userRouter.post("/logout", authenticate, userCtrl.signout);
userRouter.patch(
  "/avatars",
  authenticate,
  upload.single("avatar"),
  userCtrl.avatarUpd
);

module.exports = userRouter;
