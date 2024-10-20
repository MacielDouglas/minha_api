import bcrypt from "bcryptjs";
import jwt from "jsonwebtoken";
import User from "../models/user.models.js";

export const createToken = (user) => {
  return jwt.sign(
    {
      userId: user._id,
      isAdmin: user.isAdmin,
      name: user.name,
      isSS: user.isSS,
    },
    process.env.JWT_SECRET,
    { expiresIn: "1h" }
  );
};

export const existing = async (id, type) => {
  const models = {
    user: User,
  };

  const Model = models[type];

  if (!Model) {
    throw new Error("Tipo inválido!");
  }

  let document;
  try {
    document = await Model.findById(id);
  } catch (error) {
    throw new Error("Erro ao buscar o documento.");
  }

  if (!document) {
    throw new Error(
      `${type.charAt(0).toUpperCase() + type.slice(1)} não encontrado.`
    );
  }
  return document;
};

export const setTokenCookie = (res, token) => {
  res.cookie("access_token", token, {
    httpOnly: true,
    secure: process.env.NODE_ENV === "production",
    sameSite: process.env.NODE_ENV === "production" ? "strict" : "lax",
    maxAge: 3600000, // 1 hora
  });
};

export const sanitizeUser = (user) => {
  const {
    _id,
    isAdmin,
    name,
    profilePicture,
    group,
    isSS,
    myCards,
    myTotalCards,
    comments,
  } = user;
  return {
    id: _id,
    isAdmin,
    name,
    profilePicture,
    group,
    isSS,
    myCards,
    myTotalCards,
    comments,
  };
};

export const validateUserCredentials = async (email, password) => {
  let user;
  try {
    user = await User.findOne({ email }).select("+password");
  } catch (error) {
    throw new Error("Erro ao buscar o usuário.");
  }

  if (!user) throw new Error("Credenciais inválidas.");

  const isValidPassword = await bcrypt.compare(password, user.password);
  if (!isValidPassword) throw new Error("Credenciais inválidas.");

  return user;
};

export const verifyAuthorization = (req) => {
  const authorizationHeader = req.headers.cookie || req.headers.authorization;

  if (!authorizationHeader) {
    throw new Error("Token de autorização não fornecido.");
  }

  // Suporte para Bearer Token no cabeçalho Authorization
  let token;
  if (authorizationHeader.startsWith("Bearer ")) {
    token = authorizationHeader.split(" ")[1];
  } else if (authorizationHeader.includes("access_token=")) {
    token = authorizationHeader.split("access_token=")[1];
  }

  if (!token) {
    throw new Error("Token de autorização inválido.");
  }

  try {
    return jwt.verify(token, process.env.JWT_SECRET);
  } catch (error) {
    throw new Error("Token de autorização inválido ou expirado.");
  }
};
