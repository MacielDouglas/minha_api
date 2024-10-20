import Address from "../../models/address.models.js";
import { verifyAuthorization } from "../../utils/utils.js";
import validator from "validator";

const addressResolver = {
  Query: {
    getAddresses: async (_, { input }, { req }) => {
      const decodedToken = verifyAuthorization(req);
      if (!decodedToken) {
        throw new Error("Você não tem permissão para buscar endereços.");
      }

      try {
        // Lista de campos que serão validados e convertidos para lowercase
        const fieldsToValidate = ["city", "neighborhood", "street"];

        // Validar e sanitizar os campos de entrada
        const query = fieldsToValidate.reduce((acc, field) => {
          if (input && input[field]) {
            const value = input[field].trim().toLowerCase();

            if (!validator.isAlphanumeric(value, "pt-BR", { ignore: " " })) {
              throw new Error(
                `${field.charAt(0).toUpperCase() + field.slice(1)} inválido(a).`
              );
            }

            // Se for a busca por 'street', usar regex para permitir buscas parciais
            acc[field] =
              field === "street" ? { $regex: new RegExp(value, "i") } : value;
          }
          return acc;
        }, {});

        // Configuração de paginação
        const limit = Math.min(input?.limit || 50, 100); // Limita a no máximo 100 resultados
        const skip = input?.skip || 0;

        // Realiza a busca no banco de dados
        const addresses = await Address.find(query)
          .limit(limit)
          .skip(skip)
          .exec();

        return addresses;
      } catch (error) {
        throw new Error(`Erro ao buscar um endereço: ${error.message}`);
      }
    },
  },

  Mutation: {
    createAddress: async (_, { newAddress }, { req }) => {
      try {
        // Verificação de autorização
        const decodedToken = verifyAuthorization(req);
        if (!decodedToken) {
          throw new Error(
            "Você não tem permissão para adicionar um novo endereço."
          );
        }

        // Sanitização e normalização
        const formattedAddress = {
          street: newAddress.street?.trim().toLowerCase(),
          number: newAddress.number?.trim().toLowerCase(),
          city: newAddress.city?.trim().toLowerCase(),
          neighborhood: newAddress.neighborhood?.trim().toLowerCase() || "",
          complement: newAddress.complement?.trim().toLowerCase() || "",
        };

        // Validação dos campos obrigatórios e alfanuméricos
        if (
          !formattedAddress.street ||
          !formattedAddress.number ||
          !formattedAddress.city
        ) {
          throw new Error("Os campos rua, número e cidade são obrigatórios.");
        }

        const isInvalidField =
          !validator.isAlphanumeric(formattedAddress.street, "pt-BR", {
            ignore: " ",
          }) ||
          !validator.isAlphanumeric(formattedAddress.number, "pt-BR", {
            ignore: " ",
          }) ||
          !validator.isAlphanumeric(formattedAddress.city, "pt-BR", {
            ignore: " ",
          });

        if (isInvalidField) {
          throw new Error("Rua, número ou cidade contêm caracteres inválidos.");
        }

        // Verificar se o endereço já existe em uma única consulta
        const existingAddress = await Address.findOne({
          street: formattedAddress.street,
          number: formattedAddress.number,
          city: formattedAddress.city,
        });

        if (existingAddress) {
          throw new Error("Endereço já existente.");
        }

        // Criar o novo endereço
        const address = new Address({
          ...newAddress,
          ...formattedAddress,
          userId: decodedToken.userId,
        });

        // Salvar o novo endereço
        await address.save();

        return address;
      } catch (error) {
        throw new Error(`Erro ao criar um novo endereço: ${error.message}`);
      }
    },
  },
};

export default addressResolver;
