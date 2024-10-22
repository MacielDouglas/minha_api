import { model, Schema, Types } from "mongoose";

const cardSchema = new Schema(
  {
    street: [
      {
        type: Types.ObjectId, // Array de ObjectIds que referenciam o modelo Address
        ref: "Address",
        required: true,
        unique: true,
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

// Middleware para updateOne
cardSchema.pre("updateOne", async function (next) {
  const update = this.getUpdate();
  const street = update.$set?.street || update.street;

  if (street) {
    // Verifica se há outro Card com os mesmos street IDs
    const duplicateCard = await Card.findOne({
      street: { $in: street }, // Verifica se algum Card tem um dos mesmos IDs de Address
    });

    if (duplicateCard) {
      // Compara se o card encontrado tem o mesmo id do card que está sendo atualizado
      if (duplicateCard._id.toString() === this._conditions._id.toString()) {
        // Se for o mesmo cartão, permitimos adicionar os novos endereços
        const newStreets = street.filter(
          (id) => !duplicateCard.street.includes(id)
        );

        // Adiciona os novos endereços ao cartão
        update.$set = {
          ...update.$set,
          street: [...duplicateCard.street, ...newStreets],
        };
      } else {
        // Caso contrário, retorna erro informando que os endereços já são usados por outro cartão
        const duplicatedIds = duplicateCard.street.filter((id) =>
          street.includes(id)
        );
        throw new Error(
          `Os endereços com os seguintes IDs já estão associados a outro cartão: ${duplicatedIds.join(
            ", "
          )}`
        );
      }
    }
  }

  next();
});

// Middleware para findOneAndUpdate
cardSchema.pre("findOneAndUpdate", async function (next) {
  const update = this.getUpdate();
  const street = update.$set?.street || update.street;

  if (street) {
    // Verifica se há outro Card com os mesmos street IDs
    const duplicateCard = await Card.findOne({
      street: { $in: street }, // Verifica se algum Card tem um dos mesmos IDs de Address
    });

    if (duplicateCard) {
      const duplicatedIds = duplicateCard.street.filter((id) =>
        street.includes(id)
      );
      throw new Error(
        `Os endereços com os seguintes IDs já estão associados a outro cartão: ${duplicatedIds.join(
          ", "
        )}`
      );
    }
  }

  next();
});

// Modelo do Card
const Card = model("Card", cardSchema);

export default Card;
