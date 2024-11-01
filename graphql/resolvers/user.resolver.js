import User from "../../models/user.models.js";
import bcrypt from "bcryptjs";
import {
  createToken,
  existing,
  sanitizeUser,
  setTokenCookie,
  validateUserCredentials,
  verifyAuthorization,
} from "../../utils/utils.js";
import fireAdmin from "../../firebase/firebase.js";
import jwt from "jsonwebtoken";
import CryptoJS from "crypto-js";

function encryptData(data) {
  const secretKey = process.env.SECRET_KEY; // Armazene isso em um arquivo .env
  return CryptoJS.AES.encrypt(JSON.stringify(data), secretKey).toString();
}

const userResolver = {
  Query: {
    user: async (_, { action, id, email, password }, { req, res }) => {
      switch (action) {
        case "get":
          try {
            const user = await existing(id, "user");
            console.log(user);

            return {
              success: true,
              message: `Usuário: ${user.name}, encontrado.`,
              user: sanitizeUser(user),
            };
          } catch (error) {
            throw new Error(`Error get User: ${error.message}`);
          }

        case "login":
          try {
            const user = await validateUserCredentials(email, password);
            const token = createToken(user);
            setTokenCookie(res, token);
            console.log(`User connected: ${user.name}, ${user.id}`);
            return {
              success: true,
              message: `Usuário: ${user.name}, encontrado.`,
              user: sanitizeUser(user),
            };
          } catch (error) {
            throw new Error(`Error login User: ${error.message}`);
          }

        case "logout":
          try {
            res.clearCookie("access_token");
            console.log("User logged out");
            return {
              success: true,
              message: "User logged out successfully!!!",
            };
          } catch (error) {
            throw new Error(`Error logout User: ${error.message}`);
          }

        default:
          throw new Error("Ação inválida.");
      }
    },

    firebaseConfig: () => {
      const data = {
        apiKey: process.env.FIREBASE_API_KEY,
        authDomain: process.env.FIREBASE_AUTH_DOMAIN,
        projectId: process.env.FIREBASE_PROJECT_ID,
        storageBucket: process.env.FIREBASE_STORAGE_BUCKET,
        messagingSenderId: process.env.FIREBASE_MESSAGING_SENDER_ID,
        appId: process.env.FIREBASE_APP_ID,
      };

      const encryptedData = encryptData(data);
      return { encryptedData: encryptedData };
    },
  },

  Mutation: {
    userMutation: async (
      _,
      { action, user, id, updateUserInput },
      { res, req }
    ) => {
      if (action === "create") {
      }

      switch (action) {
        case "create":
          try {
            // Executar validações simultâneas para e-mail e nome
            const [existingEmail, existingNameUser] = await Promise.all([
              User.findOne({ email: user.email }),
              User.findOne({ name: user.name }),
            ]);

            // Verificar se o e-mail já está em uso
            if (existingEmail) {
              throw new Error("Email already in use");
            }

            // Verificar se o nome de usuário já está em uso
            if (existingNameUser) {
              throw new Error("Name already in use");
            }

            // Sanitização do campo de e-mail e nome (simples exemplo)
            const sanitizedEmail = user.email.trim().toLowerCase();
            const sanitizedName = user.name.trim();

            // Foto padrão
            const defaultProfilePicture =
              "https://firebasestorage.googleapis.com/v0/b/queimando-panela.appspot.com/o/perfil%2F1722454447282user.webp?alt=media&token=3dd585aa-5ce9-4bb3-9d46-5ecf11d1e60c";

            // Hash da senha com custo de salt configurável
            const saltRounds = parseInt(process.env.SALT_ROUNDS) || 10;
            const hashedPassword = await bcrypt.hash(user.password, saltRounds);

            // Criar o novo usuário
            const newUser = new User({
              ...user,
              email: sanitizedEmail,
              name: sanitizedName,
              password: hashedPassword,
              profilePicture: defaultProfilePicture,
            });

            // Salvar o novo usuário no banco de dados
            await newUser.save();

            // Sanitizar os dados do usuário antes de retornar
            return {
              success: true,
              message: `Usuário: ${user.name}, criado.`,
              user: sanitizeUser(user),
            };
          } catch (error) {
            throw new Error(`Error creating new User: ${error.message}`);
          }

        case "delete":
          try {
            const decodedToken = verifyAuthorization(req);
            if (!decodedToken) {
              throw new Error(
                "Você não tem permissão para excluir esse usuário."
              );
            }
            const user = await existing(id, "user");
            // Verificar se o usuário tem permissão para excluir o usuário
            if (decodedToken.userId !== user.id && !decodedToken.isAdmin) {
              throw new Error(
                "Você não tem permissão para excluir este usuário."
              );
            }

            // Excluir o usuário diretamente pelo ID
            const deleteResult = await User.deleteOne({ _id: user.id });
            if (deleteResult.deletedCount === 0) {
              throw new Error(
                "Erro ao excluir o usuário. Usuário não encontrado."
              );
            }

            // Limpar o cookie de token de acesso
            res.clearCookie("access_token");

            return {
              success: true,
              message: `Usuário: ${user.name} foi excluído com sucesso.`,
            };
          } catch (error) {
            throw new Error(`Erro ao excluir usuário: ${error.message}`);
          }

        case "update":
          try {
            // Verificar autorização com o token
            const decodedToken = verifyAuthorization(req);
            const user = await existing(id, "user");

            if (!decodedToken || decodedToken.userId !== user.id) {
              throw new Error(
                "Você não tem permissão para alterar esse usuário."
              );
            }

            const userUpdate = {};
            const { name, profilePicture } = updateUserInput;

            if (name && name.trim()) {
              userUpdate.name = name;
            }

            if (profilePicture && profilePicture.trim()) {
              userUpdate.profilePicture = profilePicture;
            }

            // Se não houver nada para atualizar, evite a operação
            if (Object.keys(userUpdate).length === 0) {
              throw new Error("Nenhuma alteração foi detectada.");
            }

            // Atualizar o usuário
            const updateResult = await User.updateOne({ _id: id }, userUpdate);
            if (updateResult.nModified === 0) {
              throw new Error("Falha ao atualizar o usuário.");
            }

            // Retornar o usuário atualizado
            const updatedUser = {
              ...user._doc, // Copiar dados antigos do usuário
              ...userUpdate, // Aplicar atualizações
            };

            return {
              success: true,
              message: `Usuário: ${user.name}, criado.`,
              user: sanitizeUser(user),
            };
          } catch (error) {
            // Melhorar a mensagem de erro
            throw new Error(`Erro ao atualizar o usuário: ${error.message}`);
          }

        case "google":
          try {
            const idToken = req.body.variables.idToken;
            const decodedToken = await fireAdmin.auth().verifyIdToken(idToken);
            const uid = decodedToken.uid;
            const userRecord = await fireAdmin.auth().getUser(uid);

            const userData = {
              uid: userRecord.uid,
              email: userRecord.email,
              name: userRecord.displayName,
              photoUrl: userRecord.photoURL,
            };

            const existingEmail = await User.findOne({ email: userData.email });

            if (!existingEmail) {
              const generatePassword =
                Math.random().toString(36).slice(-8) +
                Math.random().toString(36).slice(-8);

              const hashedPassword = bcrypt.hashSync(generatePassword, 10);
              const sanitizedEmail = userData.email.trim().toLowerCase();
              const sanitizedName = userData.name.trim();

              const newUser = new User({
                ...userData,
                name: sanitizedName,
                email: sanitizedEmail,
                password: hashedPassword,
                profilePicture: userData.photoUrl,
              });

              await newUser.save();
            }

            const user = await validateUserCredentials(
              userData.email,
              "google"
            );
            const token = createToken(user);
            setTokenCookie(res, token);
            console.log("Conectado com google", user.name);
            return {
              success: true,
              message: `Usuário: ${user.name}, encontrado.`,
              user: sanitizeUser(user),
            };
          } catch (error) {
            throw new Error(`Error login Google: ${error.message}`);
          }

        default:
          throw new Error("Ação inválida.");
      }
    },
  },
};

export default userResolver;
