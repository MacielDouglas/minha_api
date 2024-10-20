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

        default:
          throw new Error("Ação inválida.");
      }
    },
  },
};

export default userResolver;

// const userResolver = {
//   Query: {
//     getUser: async (_, { id }) => {
//       try {
//         const user = await existing(id, "user");
//         return sanitizeUser(user);
//       } catch (error) {
//         throw new Error(`Error get User: ${error.message}`);
//       }
//     },

//     loginUser: async (_, { email, password }, { res }) => {
//       try {
//         const user = await validateUserCredentials(email, password);
//         const token = createToken(user);
//         setTokenCookie(res, token);
//         console.log(`User connected: ${user.name}, ${user.id}`);
//         return sanitizeUser(user);
//       } catch (error) {
//         throw new Error(`Error login User: ${error.message}`);
//       }
//     },

//     logoutUser: (_, __, { res }) => {
//       try {
//         res.clearCookie("access_token");
//         console.log("User logged out");
//         return {
//           success: true,
//           message: "User logged out successfully!!!",
//         };
//       } catch (error) {
//         throw new Error(`Error logout User: ${error.message}`);
//       }
//     },
//   },

//   Mutation: {
//     createUser: async (_, { user }) => {
//       try {
//         // Executar validações simultâneas para e-mail e nome
//         const [existingEmail, existingNameUser] = await Promise.all([
//           User.findOne({ email: user.email }),
//           User.findOne({ name: user.name }),
//         ]);

//         // Verificar se o e-mail já está em uso
//         if (existingEmail) {
//           throw new Error("Email already in use");
//         }

//         // Verificar se o nome de usuário já está em uso
//         if (existingNameUser) {
//           throw new Error("Name already in use");
//         }

//         // Sanitização do campo de e-mail e nome (simples exemplo)
//         const sanitizedEmail = user.email.trim().toLowerCase();
//         const sanitizedName = user.name.trim();

//         // Foto padrão
//         const defaultProfilePicture =
//           "https://firebasestorage.googleapis.com/v0/b/queimando-panela.appspot.com/o/perfil%2F1722454447282user.webp?alt=media&token=3dd585aa-5ce9-4bb3-9d46-5ecf11d1e60c";

//         // Hash da senha com custo de salt configurável
//         const saltRounds = parseInt(process.env.SALT_ROUNDS) || 10;
//         const hashedPassword = await bcrypt.hash(user.password, saltRounds);

//         // Criar o novo usuário
//         const newUser = new User({
//           ...user,
//           email: sanitizedEmail,
//           name: sanitizedName,
//           password: hashedPassword,
//           profilePicture: defaultProfilePicture,
//         });

//         // Salvar o novo usuário no banco de dados
//         await newUser.save();

//         // Sanitizar os dados do usuário antes de retornar
//         return sanitizeUser(newUser);
//       } catch (error) {
//         throw new Error(`Error creating new User: ${error.message}`);
//       }
//     },

//     deleteUser: async (_, { id }, { res, req }) => {
//       try {
//         // Verificar se o token é válido
//         const decodedToken = verifyAuthorization(req);
//         if (!decodedToken) {
//           throw new Error("Você não tem permissão para excluir esse usuário.");
//         }

//         const user = await existing(id, "user");
//         // Verificar se o usuário tem permissão para excluir o usuário
//         if (decodedToken.userId !== user.id && !decodedToken.isAdmin) {
//           throw new Error("Você não tem permissão para excluir este usuário.");
//         }

//         // Excluir o usuário diretamente pelo ID
//         const deleteResult = await User.deleteOne({ _id: user.id });
//         if (deleteResult.deletedCount === 0) {
//           throw new Error("Erro ao excluir o usuário. Usuário não encontrado.");
//         }

//         // Limpar o cookie de token de acesso
//         res.clearCookie("access_token");

//         return {
//           success: true,
//           message: `Usuário: ${user.name} foi excluído com sucesso.`,
//         };
//       } catch (error) {
//         throw new Error(`Erro ao excluir usuário: ${error.message}`);
//       }
//     },

//     updateUser: async (_, { id, updateUserInput }, { req }) => {
//       try {
//         // Verificar autorização com o token
//         const decodedToken = verifyAuthorization(req);
//         const user = await existing(id, "user");

//         if (!decodedToken || decodedToken.userId !== user.id) {
//           throw new Error("Você não tem permissão para alterar esse usuário.");
//         }

//         const userUpdate = {};
//         const { name, profilePicture } = updateUserInput;

//         if (name && name.trim()) {
//           userUpdate.name = name;
//         }

//         if (profilePicture && profilePicture.trim()) {
//           userUpdate.profilePicture = profilePicture;
//         }

//         // Se não houver nada para atualizar, evite a operação
//         if (Object.keys(userUpdate).length === 0) {
//           throw new Error("Nenhuma alteração foi detectada.");
//         }

//         // Atualizar o usuário
//         const updateResult = await User.updateOne({ _id: id }, userUpdate);
//         if (updateResult.nModified === 0) {
//           throw new Error("Falha ao atualizar o usuário.");
//         }

//         // Retornar o usuário atualizado
//         const updatedUser = {
//           ...user._doc, // Copiar dados antigos do usuário
//           ...userUpdate, // Aplicar atualizações
//         };

//         return {
//           ...sanitizeUser(updatedUser),
//           success: true,
//           message: "Usuário atualizado com sucesso!",
//         };
//       } catch (error) {
//         // Melhorar a mensagem de erro
//         throw new Error(`Erro ao atualizar o usuário: ${error.message}`);
//       }
//     },
//   },
// };
