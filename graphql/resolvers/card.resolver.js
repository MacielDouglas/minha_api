import mongoose from "mongoose";
import Card from "../../models/card.model.js";
import { verifyAuthorization } from "../../utils/utils.js";

const cardResolver = {
  Query: {
    getCard: async (_, { id, limit = 50, skip = 0 }, { req }) => {
      try {
        // Verifica a autorização do usuário
        const decodedToken = verifyAuthorization(req);
        if (!decodedToken) {
          throw new Error("Você não tem permissão para acessar cartões.");
        }

        // Se o ID for fornecido, buscar pelo ID com sanitização
        if (id) {
          if (!mongoose.Types.ObjectId.isValid(id)) {
            throw new Error("ID inválido.");
          }

          const card = await Card.findById(id);
          //   .select(projection);
          if (!card) {
            throw new Error("Cartão não encontrado.");
          }

          return card;
        }

        // Se o ID não for fornecido, retorna todos os cartões com limite e paginação
        const cards = await Card.find({})
          //   .select(projection)  // Apenas os campos necessários
          .limit(Math.min(limit, 100)) // Limitar a 100 resultados no máximo
          .skip(skip); // Paginação

        return cards;
      } catch (error) {
        throw new Error(`Erro ao buscar cartões: ${error.message}`);
      }
    },
  },

  Mutation: {
    createCard: async (_, { newCard }, { req }) => {
      try {
        const decodedToken = verifyAuthorization(req);
        if (!decodedToken) {
          throw new Error(
            "Você não tem permissão para adicionar um novo endereço."
          );
        }

        const findNextNumber = async () => {
          const existingNumbers = await Card.find().distinct("number").exec(); // Busca todos os números existentes

          // Se não houver nenhum número existente, comece com 1
          if (existingNumbers.length === 0) {
            return 1;
          }

          const uniqueNumbers = existingNumbers
            .map(Number)
            .sort((a, b) => a - b); // Ordena e converte os números em inteiros

          // Percorrer o array para encontrar o número faltando
          for (let i = 0; i < uniqueNumbers.length - 1; i++) {
            if (uniqueNumbers[i + 1] !== uniqueNumbers[i] + 1) {
              return uniqueNumbers[i] + 1; // Retorna o número que está faltando
            }
          }

          // Se não houver número faltando, retorna o próximo número na sequência
          return uniqueNumbers[uniqueNumbers.length - 1] + 1;
        };

        const number = await findNextNumber();
        const card = new Card({ ...newCard, number });
        return await card.save();
      } catch (error) {
        throw new Error(`Erro ao criar um novo cartão: ${error.message}`);
      }
    },
  },
};

export default cardResolver;
