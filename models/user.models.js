import { model, Schema } from "mongoose";

const userSchema = new Schema(
  {
    name: {
      type: String,
      required: true,
      unique: true,
    },
    email: {
      type: String,
      required: true,
      unique: true,
    },
    group: {
      type: String,
      required: true,
      default: "0",
    },
    password: {
      type: String,
      required: true,
    },
    profilePicture: {
      type: String,
    },
    isAdmin: {
      type: Boolean,
      default: false,
    },
    isSS: {
      type: Boolean,
      default: false,
    },
    isSCards: {
      type: Boolean,
      default: false,
    },
    myCards: {
      type: [String],
    },
    myTotalCards: {
      type: [String],
    },
    comments: [
      {
        cardId: {
          type: Schema.Types.ObjectId,
        },
        text: {
          type: String,
          maxlength: 250, // Limite de 250 caracteres
        },
      },
    ],
  },
  { timestamps: true }
);

const User = model("User", userSchema);

export default User;
