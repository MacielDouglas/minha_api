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
    secure: process.env.NODE_ENV === "production", // Garante a segurança em produção
    sameSite: "None", // Permite que os cookies sejam enviados em requisições cross-origin
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

  if (password !== "google") {
    const isValidPassword = await bcrypt.compare(password, user.password);
    if (!isValidPassword) throw new Error("Credenciais inválidas.");
  }

  return user;
};

export const verifyAuthorization = (req) => {
  // Recupera o cabeçalho de autorização ou cookies
  const authorizationHeader = req.headers.authorization || req.headers.cookie;

  // Verifica se o cabeçalho foi fornecido
  if (!authorizationHeader) {
    throw new Error("Acesso negado. Token não fornecido.");
  }

  // Inicializa a variável do token
  let token;

  // Verifica o formato do Bearer Token no cabeçalho Authorization
  if (authorizationHeader.startsWith("Bearer ")) {
    token = authorizationHeader.slice(7); // Usa slice para extrair o token sem dividir arrays
  }
  // Verifica se o token está nos cookies (acessível no formato access_token)
  else if (authorizationHeader.includes("access_token=")) {
    const tokenPart = authorizationHeader.split("access_token=")[1];
    token = tokenPart.split(";")[0]; // Garante que apenas o valor do token seja extraído, sem o resto dos cookies
  }

  // Se o token não for válido
  if (!token) {
    throw new Error("Acesso negado. Token inválido ou ausente.");
  }

  try {
    // Verifica e decodifica o token JWT
    const decoded = jwt.verify(token, process.env.JWT_SECRET);

    // Retorna o token decodificado
    return decoded;
  } catch (error) {
    // Especifica se o erro é de expiração ou outro tipo de erro
    const errorMessage =
      error.name === "TokenExpiredError"
        ? "Sessão expirada. Faça login novamente."
        : "Acesso negado. Token inválido.";

    // Lança um erro genérico para segurança
    throw new Error(errorMessage);
  }
};
