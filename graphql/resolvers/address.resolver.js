import Address from "../../models/address.models.js";
import { verifyAuthorization } from "../../utils/utils.js";
import validator from "validator";
import mongoose from "mongoose";
import { validateObjectId } from "../../utils/card.utils.js";

const addressResolver = {
  Query: {
    address: async (_, { action, input, id }, { req }) => {
      const decodedToken = verifyAuthorization(req);
      if (!decodedToken) {
        throw new Error("Você não tem permissão.");
      }

      switch (action) {
        case "get":
          try {
            // Verifica se o id foi passado e se é um ObjectId válido
            if (id && !mongoose.Types.ObjectId.isValid(id)) {
              throw new Error("ID inválido.");
            }

            // Se um ID for passado, faz a busca por ele
            if (id) {
              const addressById = await Address.findById(id).lean();
              if (!addressById) {
                throw new Error("Endereço não encontrado.");
              }

              return {
                message: "Endereço encontrado.",
                success: true,
                address: [{ ...addressById, id: addressById._id.toString() }],
              };
            }

            // Lista de campos que serão validados e convertidos para lowercase
            const fieldsToValidate = ["street", "city", "neighborhood"];

            // Validar e sanitizar os campos de entrada
            const query = fieldsToValidate.reduce((acc, field) => {
              if (input && input[field]) {
                const value = input[field].trim().toLowerCase();

                if (
                  !validator.isAlphanumeric(value, "pt-BR", { ignore: " " })
                ) {
                  throw new Error(
                    `${
                      field.charAt(0).toUpperCase() + field.slice(1)
                    } inválido(a).`
                  );
                }

                // Se for a busca por 'street', usar regex para permitir buscas parciais
                acc[field] =
                  field === "street"
                    ? { $regex: new RegExp(value, "i") } // Busca parcial (case-insensitive)
                    : value;
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
              .lean() // Usar lean() para melhorar a performance
              .exec();

            // Converte _id para id
            const addressesWithId = addresses.map((address) => ({
              ...address,
              id: address._id.toString(),
            }));

            return {
              message: addressesWithId.length
                ? "Endereços encontrados."
                : "Nenhum endereço encontrado.",
              success: true,
              address: addressesWithId,
            };
          } catch (error) {
            throw new Error(`Erro ao buscar endereços: ${error.message}`);
          }

        default:
          throw new Error("Ação inválida.");
      }
    },
  },

  Mutation: {
    addressMutation: async (
      _,
      { action, id, newAddress, updateAddressInput },
      { req, res }
    ) => {
      const decodedToken = verifyAuthorization(req);
      if (!decodedToken) {
        throw new Error(
          "Você não tem permissão para adicionar um novo endereço."
        );
      }

      switch (action) {
        case "create":
          try {
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
              throw new Error(
                "Os campos rua, número e cidade são obrigatórios."
              );
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
              throw new Error(
                "Rua, número ou cidade contêm caracteres inválidos."
              );
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

            console.log(address);
            // Salvar o novo endereço
            await address.save();

            return {
              message: "Novo endereço criado.",
              success: true,
              address: address,
            };
          } catch (error) {
            throw new Error(`Erro ao criar um novo endereço: ${error.message}`);
          }

        case "update":
          try {
            // Valida se o id é um ObjectId válido
            validateObjectId(id);

            // Busca o endereço pelo ID
            const address = await Address.findById(id);
            if (!address) {
              throw new Error("Endereço não encontrado.");
            }

            // Desestrutura os possíveis campos de atualização de updateAddressInput
            const {
              street,
              number,
              city,
              neighborhood,
              complement,
              gps,
              confirmed,
              // userId,
              visited,
            } = updateAddressInput;

            // Objeto para armazenar os campos que serão atualizados
            const addressUpdate = {};

            // Verifica cada campo e, se estiver presente, adiciona ao objeto de atualização
            if (street) addressUpdate.street = street.trim().toLowerCase();
            if (number) addressUpdate.number = number.trim();
            if (city) addressUpdate.city = city.trim().toLowerCase();
            if (neighborhood)
              addressUpdate.neighborhood = neighborhood.trim().toLowerCase();
            if (complement) addressUpdate.complement = complement.trim();
            if (gps) addressUpdate.gps = gps.trim();
            if (typeof confirmed === "boolean")
              addressUpdate.confirmed = confirmed;
            // if (userId) addressUpdate.userId = userId; // Assumindo que userId já foi validado
            if (typeof visited === "boolean") addressUpdate.visited = visited;

            // Atualiza apenas se houver mudanças a serem aplicadas
            if (Object.keys(addressUpdate).length > 0) {
              addressUpdate.userId = decodedToken.userId;

              // console.log(updateAddressInput);
              // console.log(addressUpdate);
              const updatedAddress = await Address.findByIdAndUpdate(
                id,
                { $set: addressUpdate },
                { new: true, runValidators: true } // Retorna o documento atualizado e aplica validação
              ).lean();

              return {
                message: "Endereço atualizado com sucesso.",
                success: true,
                address: {
                  ...updatedAddress,
                  id: updatedAddress._id.toString(),
                }, // Converte _id para id
              };
            } else {
              return {
                message: "Nenhum campo foi atualizado.",
                success: false,
                address: { ...address.toObject(), id: address._id.toString() }, // Converte _id para id
              };
            }
          } catch (error) {
            throw new Error(`Erro ao atualizar um endereço: ${error.message}`);
          }

        case "delete":
          try {
            validateObjectId(id);
            const address = await Address.findById(id);

            await Address.deleteOne({ _id: address.id });
            return {
              message: "Endereço deletado com sucesso.",
              success: true,
              address: null,
            };
          } catch (error) {
            throw new Error(`Erro ao deletar um endereço: ${error.message}`);
          }

        default:
          throw new Error("Ação inválida.");
      }
    },
  },
};

export default addressResolver;
