import { model, Schema, Types } from "mongoose";

const cardSchema = new Schema(
  {
    street: [
      {
        type: Types.ObjectId, // Array de ObjectIds que referenciam o modelo Address
        ref: "Address",
        required: true,
      },
    ],
    userId: {
      type: String,
      // required: true,
    },
    number: {
      type: Number,
      required: true,
      unique: true,
    },
    startDate: {
      type: String, // Usando string para as datas
    },
    endDate: {
      type: String, // Usando string para a data
      default: function () {
        return new Date().toISOString(); // Usando timestamp na criação
      },
    },
  },
  { timestamps: true } // Adiciona os timestamps automáticos para createdAt e updatedAt
);

// Validação pré-salvamento para garantir que nenhum outro Card tenha os mesmos IDs de street (Address)
cardSchema.pre("save", async function (next) {
  const card = this;

  // Verifica se há outro Card com os mesmos street IDs
  const duplicateCard = await Card.findOne({
    street: { $in: card.street }, // Verifica se algum Card tem um dos mesmos IDs de Address
  });

  if (duplicateCard) {
    const duplicatedIds = duplicateCard.street.filter((id) =>
      card.street.includes(id)
    );
    throw new Error(
      `Os endereços com os seguintes IDs já estão associados a outro cartão: ${duplicatedIds.join(
        ", "
      )}`
    );
  }

  next();
});

// Modelo do Card
const Card = model("Card", cardSchema);

export default Card;
