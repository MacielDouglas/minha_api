import { model, Schema } from "mongoose";

const addressSchema = new Schema(
  {
    street: {
      type: String,
      required: [true, "O campo 'street' é obrigatório."], // Mensagem de erro personalizada
      trim: true, // Remove espaços em branco no início e no fim
      minlength: [3, "O campo 'street' deve ter no mínimo 3 caracteres."],
      maxlength: [100, "O campo 'street' deve ter no máximo 100 caracteres."],
    },
    number: {
      type: String,
      required: [true, "O campo 'number' é obrigatório."],
      match: [
        /^\d+[a-zA-Z]?$/,
        "O campo 'number' deve conter um número válido.",
      ], // Valida números e possíveis letras
    },
    city: {
      type: String,
      required: [true, "O campo 'city' é obrigatório."],
      trim: true,
      minlength: [2, "O campo 'city' deve ter no mínimo 2 caracteres."],
      maxlength: [60, "O campo 'city' deve ter no máximo 100 caracteres."],
    },
    neighborhood: {
      type: String,
      required: [true, "O campo 'neighborhood' é obrigatório."],
      trim: true,
      minlength: [2, "O campo 'neighborhood' deve ter no mínimo 2 caracteres."],
      maxlength: [
        60,
        "O campo 'neighborhood' deve ter no máximo 100 caracteres.",
      ],
    },
    gps: {
      type: String,
      validate: {
        validator: function (v) {
          // Verifica se o valor do GPS está no formato correto (latitude e longitude)
          return /^[-+]?([1-8]?\d(\.\d+)?|90(\.0+)?),\s*[-+]?((1[0-7]\d|\d{1,2})(\.\d+)?|180(\.0+)?)$/.test(
            v
          );
        },
        message: (props) => `${props.value} não é uma coordenada GPS válida!`,
      },
      required: false,
    },
    complement: {
      type: String,
      required: false,
      maxlength: [
        250,
        "O campo 'complement' deve ter no máximo 250 caracteres.",
      ],
      set: function (v) {
        // Regex para identificar as palavras proibidas, ignorando maiúsculas/minúsculas
        const regex =
          /\b(homem(ens)?|hombre(s)?|mulher(es)?|mujer(es)?|criança|jovem|niño|niña|muchacho|muchacha|peru(ano|ana)?|argentin(a|o)?|chile(no|na)?|urugua(y|i)(o|a)?|paragua(y|i)(o|a)?|venezuela(no|na)?|bolivia(no|na)?|cuba(no|na)?|equador(iano|iana)?|colombia(no|na)?)\b/gi;

        // Substitui todas as ocorrências das palavras encontradas por "******"
        return v.replace(regex, "******");
      },
    },

    userId: {
      type: String,
      required: [true],
      trim: true,
    },
    active: {
      type: Boolean,
      required: [true],
    },
    confirmed: {
      type: Boolean,
      required: [true],
      default: false,
    },
    visited: {
      type: String,
      enum: {
        values: ["yes", "no", null],
        message: "O campo 'visited' deve ser 'yes', 'no' ou vazio.",
      },
      default: null,
    },
  },
  { timestamps: true }
); // Adiciona createdAt e updatedAt automaticamente

const Address = model("Address", addressSchema);

export default Address;

// import { model, Schema } from "mongoose";

// const addressSchema = new Schema({
//   street: {
//     type: String,
//     required: true,
//   },
//   number: {
//     type: String,
//     required: true,
//   },
//   city: {
//     type: String,
//     required: true,
//   },
//   neighborhood: {
//     type: String,
//     required: true,
//   },
//   gps: { type: String, required: false },

//   complement: {
//     type: String,
//     required: false,
//   },
//   userId: {
//     type: String,
//     required: true,
//   },
//   active: {
//     type: Boolean,
//     required: true,
//   },
//   confirmed: {
//     type: Boolean,
//     required: true,
//   },
//   visited: {
//     type: String,
//   },
// });

// const Address = model("Address", addressSchema);

// export default Address;
