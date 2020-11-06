import { Router } from 'express';

// import TransactionsRepository from '../repositories/TransactionsRepository';
import CreateTransactionService from '../services/CreateTransactionService';
import FindOrCreateCategoryService from '../services/FindOrCreateCategoryService';
import DeleteTransactionService from '../services/DeleteTransactionService';
// import ImportTransactionsService from '../services/ImportTransactionsService';

const transactionsRouter = Router();

transactionsRouter.get('/', async (request, response) => {
  // TODO
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
  // TODO
});

export default transactionsRouter;
