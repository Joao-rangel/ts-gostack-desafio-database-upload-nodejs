import { getCustomRepository } from 'typeorm';
import AppError from '../errors/AppError';

import TransactionRepository from '../repositories/TransactionsRepository';
import Transaction from '../models/Transaction';

interface Request {
  title: string;
  value: number;
  type: 'income' | 'outcome';
  category_id: string;
}

class CreateTransactionService {
  public async execute(
    { title, type, value, category_id }: Request,
    totalCsvBalance: number,
  ): Promise<Transaction> {
    const transactionRepository = getCustomRepository(TransactionRepository);

    const balance = await transactionRepository.getBalance();

    if (totalCsvBalance) {
      if (totalCsvBalance + balance.total < 0) {
        throw new AppError('Insuficient founds', 400);
      }
    } else if (type === 'outcome' && balance.total < value) {
      throw new AppError('Insuficient founds', 400);
    }

    const transaction = transactionRepository.create({
      title,
      type,
      value,
      category_id,
    });

    await transactionRepository.save(transaction);

    return transaction;
  }
}

export default CreateTransactionService;
