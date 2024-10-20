import { model, Schema } from "mongoose";

const addressSchema = new Schema({
  street: {
    type: String,
    required: true,
  },
  number: {
    type: String,
    required: true,
  },
  city: {
    type: String,
    required: true,
  },
  neighborhood: {
    type: String,
    required: true,
  },
  gps: { type: String, required: false },

  complement: {
    type: String,
    required: false,
  },
  userId: {
    type: String,
    required: true,
  },
  active: {
    type: Boolean,
    required: true,
  },
  confirmed: {
    type: Boolean,
    required: true,
  },
  visited: {
    type: String,
  },
});

const Address = model("Address", addressSchema);

export default Address;
