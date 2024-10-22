import mongoose from "mongoose";
import Card from "../models/card.model.js";

// Função para verificar se o ID é válido
export const validateObjectId = (id) => {
  if (!mongoose.Types.ObjectId.isValid(id)) {
    throw new Error("ID inválido.");
  }
};

// Função para encontrar um cartão pelo ID
export const findCardById = async (id) => {
  validateObjectId(id);
  const card = await Card.findById(id).lean(); // lean para melhor performance
  //   console.log(card);
  if (!card) {
    throw new Error("Cartão não encontrado.");
  }
  return { ...card, id: card._id.toString() };
};

// Função para encontrar o próximo número de cartão disponível
export const findNextNumber = async () => {
  const existingNumbers = await Card.find().distinct("number").exec();

  if (existingNumbers.length === 0) {
    return 1; // Se não houver nenhum número, começa do 1
  }

  const uniqueNumbers = existingNumbers.map(Number).sort((a, b) => a - b);

  for (let i = 0; i < uniqueNumbers.length - 1; i++) {
    if (uniqueNumbers[i + 1] !== uniqueNumbers[i] + 1) {
      return uniqueNumbers[i] + 1; // Retorna o número faltante
    }
  }

  return uniqueNumbers[uniqueNumbers.length - 1] + 1; // Próximo na sequência
};
