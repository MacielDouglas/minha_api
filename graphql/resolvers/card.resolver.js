import Card from "../../models/card.model.js";
import { verifyAuthorization } from "../../utils/utils.js";
import {
  findCardById,
  findNextNumber,
  validateObjectId,
} from "../../utils/card.utils.js";

const cardResolver = {
  Query: {
    card: async (_, { action, id, limit = 50, skip = 0 }, { req }) => {
      const decodedToken = verifyAuthorization(req);
      if (!decodedToken) {
        throw new Error("Você não tem permissão.");
      }

      switch (action) {
        case "get":
          try {
            if (id) {
              const card = await findCardById(id);
              console.log(card);
              return {
                message: "Cartão encontrado.",
                success: true,
                card: [card],
              };
            }

            const cards = await Card.find({})
              .limit(Math.min(limit, 100))
              .skip(skip)
              .lean(); // Usa lean para melhorar performance

            return {
              message: "Cartões encontrados.",
              success: true,
              card: cards.map((card) => ({ ...card, id: card._id.toString() })),
            };
          } catch (error) {
            throw new Error("Erro ao buscar cartões.");
          }

        default:
          throw new Error("Ação inválida.");
      }
    },
  },

  Mutation: {
    cardMutation: async (
      _,
      { action, id, newCard, updateCardInput },
      { req }
    ) => {
      const decodedToken = verifyAuthorization(req);
      if (!decodedToken) {
        throw new Error("Você não tem permissão.");
      }

      switch (action) {
        case "create":
          try {
            const number = await findNextNumber();
            const card = new Card({ ...newCard, number });

            return {
              message: `Novo cartão criado com número ${card.number}.`,
              success: true,
              card: await card.save(),
            };
          } catch (error) {
            throw new Error(`Erro ao criar cartão: ${error.message}`);
          }

        case "update":
          try {
            if (!id) throw new Error("ID necessário.");
            const card = await findCardById(id);

            console.log(card.id);
            const cardUpdate = {};
            const { street, userId } = updateCardInput;

            if (Array.isArray(street)) {
              cardUpdate.street = street;
            } else {
              await Card.deleteOne({ _id: id });
              return {
                message: "Cartão deletado.",
                success: true,
                card: null,
              };
            }

            if (!userId || userId.trim() === "") {
              cardUpdate.endDate = new Date().toISOString();
              cardUpdate.startDate = null;
              cardUpdate.userId = null;
            } else {
              cardUpdate.userId = userId;
              cardUpdate.startDate = new Date().toISOString();
              cardUpdate.endDate = null;
            }

            const updateResult = await Card.updateOne({ _id: id }, cardUpdate);
            if (updateResult.nModified === 0) {
              throw new Error("Falha ao atualizar.");
            }

            return {
              message: "Cartão atualizado.",
              success: true,
              card: { ...card, ...cardUpdate },
            };
          } catch (error) {
            throw new Error(`Erro ao atualizar cartão: ${error.message}`);
          }

        case "delete":
          try {
            validateObjectId(id);
            const card = await findCardById(id);
            // console.log(card);
            await Card.deleteOne({ _id: card.id });
            return {
              message: "Cartão deletado.",
              success: true,
              card: null,
            };
          } catch (error) {
            throw new Error(`Erro ao deletar cartão: ${error.message}`);
          }

        default:
          throw new Error("Ação inválida.");
      }
    },
  },
};

export default cardResolver;
