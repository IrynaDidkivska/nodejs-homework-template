require("dotenv").config();
const bcrypt = require("bcryptjs");
const jwt = require("jsonwebtoken");
const gravatar = require("gravatar");
const fs = require("fs/promises");
const path = require("path");
const Jimp = require("jimp");

const { User } = require("../models/User");

const { ctrlWrapper } = require("../decorators");
const { HttpError } = require("../helpers");

const { JWT_SECRET } = process.env;

const avatarPath = path.resolve("public", "avatars");

const signup = async (req, res) => {
  const { email, password } = req.body;
  const user = await User.findOne({ email });
  if (user) {
    throw HttpError(409, "Email in use");
  }

  const hashPassword = await bcrypt.hash(password, 10);
  const avatarURL = gravatar.url(email);

  const newUser = User.create({
    ...req.body,
    password: hashPassword,
    avatarURL,
  });

  res.status(201).json({
    username: newUser.name,
    email: newUser.email,
  });
};

const signin = async (req, res) => {
  const { email, password } = req.body;

  const user = await User.findOne({ email });

  if (!user) {
    throw HttpError(401, "Email or password is wrong");
  }

  const passwordCompare = await bcrypt.compare(password, user.password);
  if (!passwordCompare) {
    throw HttpError(401, "Email or password is wrong");
  }

  const payload = {
    id: user._id,
  };
  const token = jwt.sign(payload, JWT_SECRET, { expiresIn: "23h" });

  await User.findByIdAndUpdate(user._is, { token });
  res.json({ token });
};

const getCurrent = async (req, res) => {
  const { username, email } = req.user;

  res.json({ username, email });
};

const avatarUpd = async (req, res) => {
  const { _id } = req.user;
  console.log(_id);
  const { path: oldPath, filename } = req.file;
  const newPath = path.join(avatarPath, filename);
  console.log(newPath);

  await fs.rename(oldPath, newPath);

  await Jimp.read(newPath)
    .then((avatar) => avatar.resize(250, 250).writeAsync(newPath))
    .catch((err) => {
      throw HttpError(404, err.message);
    });

  const avatarURl = path.join("public", "avatars");
  await User.findByIdAndUpdate(_id, { avatarURl });

  res.json({ avatarURl });
};

const signout = async (req, res) => {
  const { _id } = req.user;
  await User.findByIdAndUpdate(_id, { token: "" });

  res.status(204).send();
};

module.exports = {
  signup: ctrlWrapper(signup),
  signin: ctrlWrapper(signin),
  signout: ctrlWrapper(signout),
  getCurrent: ctrlWrapper(getCurrent),
  avatarUpd: ctrlWrapper(avatarUpd),
};
