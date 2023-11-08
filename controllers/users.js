require("dotenv").config();
const bcrypt = require("bcryptjs");
const jwt = require("jsonwebtoken");
const gravatar = require("gravatar");
const fs = require("fs/promises");
const path = require("path");
const Jimp = require("jimp");
const { nanoid } = require("nanoid");
// const ElasticEmail = require("@elasticemail/elasticemail-client");

const { User } = require("../models/User");

const { ctrlWrapper } = require("../decorators");
const { HttpError, sendMail } = require("../helpers");

const { JWT_SECRET } = process.env;

const avatarPath = path.resolve("public", "avatars");

// const api = new ElasticEmail.EmailsApi();

const signup = async (req, res) => {
  const { email, password } = req.body;
  const user = await User.findOne({ email });
  if (user) {
    throw HttpError(409, "Email in use");
  }

  const hashPassword = await bcrypt.hash(password, 10);
  const verificationToken = nanoid();
  const avatarURL = gravatar.url(email);

  const newUser = User.create({
    ...req.body,
    password: hashPassword,
    avatarURL,
    verificationToken,
  });

  const verifyEmail = {
    to: email,
    subject: "Verify email",
    html: `<a target="_blank" href="http://localhost:3000/api/users/verify/${verificationToken}">Click to verify email</a>`,
  };

  await sendMail(verifyEmail.to, verifyEmail.subject, verifyEmail.html);

  res.status(201).json({
    username: newUser.name,
    email: newUser.email,
  });
};

// Верифікація пошти
const verify = async (req, res) => {
  const { verificationToken } = req.params;
  const user = await User.findOne({ verificationToken });

  if (!user) {
    throw HttpError(404, "User not found");
  }
  const hashToken = await bcrypt.hash(verificationToken, 10);
  await User.findByIdAndUpdate(user._id, {
    verify: true,
    verificationToken: hashToken,
  });

  res.json({ message: "Verification successful" });
};

// Повторна відправка мейлу

const resendVerifyEmail = async (req, res) => {
  const { email } = req.body;
  const user = await User.findOne({ email });

  if (!user) {
    throw HttpError(404, "Email not found");
  }
  if (user.verify) {
    throw HttpError(400, "Verification has already been passed");
  }

  const verifyEmail = {
    to: email,
    subject: "Verify email",
    html: `<a target="_blank" href="http://localhost:3000/api/users/verify/${user.verificationToken}">Click to verify email</a>`,
  };

  await sendMail(verifyEmail.to, verifyEmail.subject, verifyEmail.html);
  res.json({ message: "Email resent successfuly" });
};

// Логін
const signin = async (req, res) => {
  const { email, password } = req.body;

  const user = await User.findOne({ email });

  if (!user) {
    throw HttpError(401, "Email or password is wrong");
  }

  if (!user.verify) {
    throw HttpError(401, "Email not verify");
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
  verify: ctrlWrapper(verify),
  resendVerifyEmail: ctrlWrapper(resendVerifyEmail),
  signin: ctrlWrapper(signin),
  signout: ctrlWrapper(signout),
  getCurrent: ctrlWrapper(getCurrent),
  avatarUpd: ctrlWrapper(avatarUpd),
};
