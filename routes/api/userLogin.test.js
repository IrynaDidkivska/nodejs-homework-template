/* eslint-disable no-undef */
const request = require("supertest");
const mongoose = require("mongoose"); // щоб підключитися до бази
const app = require("../../app"); // щоб запустити сервер
const { User } = require("../../models/User");
const jwt = require("jsonwebtoken");
const bcryptjs = require("bcryptjs"); // для хешування паролю
const { PORT, DB_HOST_TEST } = process.env; // тестова база даних

// пишемо тест(назва тесту)

describe("test login route", () => {
  // тестовий юзер
  const userData = {
    username: "testUser",
    email: "test@example.com",
    password: "123456",
  };
  let server = null; // щоб можна було закрити сервер

  // Створюємо токен
  const secret = "eyJhbGciOiJIUzI1NiJ9";
  // Параметры токена, такие как срок его действия
  const options = {
    expiresIn: "2h", // Токен будет действителен в течение 2 часов
  };
  // Генерація токена
  const token = jwt.sign(userData, secret, options);

  // перед тестом підкл до бази і запускаємо сервер
  beforeAll(async () => {
    await mongoose.connect(DB_HOST_TEST);
    server = app.listen(PORT);
  });

  // після тесту закриваємо сервер
  afterAll(async () => {
    await mongoose.connection.close();
    server.close();
  });

  beforeEach(async () => {
    // створюємо нового користувача
    await User.create({
      ...userData,
      password: await bcryptjs.hash(userData.password, 10),
      token,
    });
  });

  // після кожного тесту видаляємо юзера
  afterEach(async () => {
    await User.deleteMany({});
  });

  // Тест чи можемо залогінитися з правильними даними
  test("should return 200 and token if login is successful", async () => {
    const { statusCode, body } = await request(app)
      .post("/api/users/login") // Тут повинен бути абсолютний шлях до endpoint
      .send({ email: userData.email, password: userData.password });

    expect(statusCode).toBe(200);
    expect(body.token).toBeTruthy();

    // Перевірка наявності токена в базі даних
    const user = await User.findOne({ email: userData.email });
    expect(user.token).toBeTruthy();
  });

  // Тест якщо невірний email
  test("should return 401 if email does not exist", async () => {
    const response = await request(app)
      .post("/api/users/login")
      .send({ email: "nonexistent@example.com", password: userData.password });

    expect(response.status).toBe(401);
  });
  // Тест якщо невірний password
  test("should return 401 if password is incorrect", async () => {
    const response = await request(app)
      .post("/api/users/login")
      .send({ email: userData.email, password: "0123456" });

    expect(response.status).toBe(401);
  });
});
