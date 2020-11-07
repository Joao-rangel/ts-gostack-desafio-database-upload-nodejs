import { Router } from 'express';

import { getCustomRepository } from 'typeorm';
import TransactionsRepository from '../repositories/TransactionsRepository';
import CreateTransactionService from '../services/CreateTransactionService';
import FindOrCreateCategoryService from '../services/FindOrCreateCategoryService';
import DeleteTransactionService from '../services/DeleteTransactionService';
import ImportTransactionsService from '../services/ImportTransactionsService';

const transactionsRouter = Router();

transactionsRouter.get('/', async (request, response) => {
  const transactionsRepository = getCustomRepository(TransactionsRepository);

  const transactions = await transactionsRepository.find({
    relations: ['category'],
    select: [
      'id',
      'title',
      'value',
      'type',
      'category',
      'created_at',
      'updated_at',
    ],
  });

  const balance = await transactionsRepository.getBalance();

  return response.json({ transactions, balance });
});

transactionsRouter.post('/', async (request, response) => {
  const { title, type, value, category } = request.body;

  const findOrCreateCategory = new FindOrCreateCategoryService();

  const categoryObject = await findOrCreateCategory.execute({ category });

  const createTransaction = new CreateTransactionService();

  const transaction = await createTransaction.execute({
    title,
    type,
    value,
    category_id: categoryObject.id,
  });

  return response.json(transaction);
});

transactionsRouter.delete('/:id', async (request, response) => {
  const { id } = request.params;

  const deleteTransaction = new DeleteTransactionService();

  await deleteTransaction.execute({ id });

  return response.status(204).send();
});

transactionsRouter.post('/import', async (request, response) => {
  const importTransaction = new ImportTransactionsService();

  const importedTransactions = await importTransaction.execute();

  const transactions = await Promise.all(
    importedTransactions.map(async importedTransaction => {
      const createTransaction = new CreateTransactionService();

      const newTransaction = await createTransaction.execute(
        importedTransaction,
      );

      return newTransaction;
    }),
  );

  return response.json(transactions);
});

export default transactionsRouter;
