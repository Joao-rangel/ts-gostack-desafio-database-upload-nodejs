import fs from 'fs';
import path from 'path';
import Transaction from '../models/Transaction';
import FindOrCreateCategoryService from './FindOrCreateCategoryService';

class ImportTransactionsService {
  async execute(): Promise<Transaction[]> {
    const filePath = path.resolve(__dirname, '..', '..', 'tmp', 'file.csv');
    const fileText = fs.readFileSync(filePath, 'utf-8');

    const [titles, ...rows] = fileText.split('\n');

    const transactionKeys = titles.split(', ');

    const objectTransactions = rows.map(row => {
      const transactionValues = row.split(', ');
      return transactionKeys.reduce((transaction: any, currentKey, index) => {
        // eslint-disable-next-line no-param-reassign
        transaction[currentKey] = transactionValues[index];

        return transaction;
      }, {});
    });

    const validTransactions = objectTransactions.filter(transaction => {
      const { type } = transaction;
      if (type === 'outcome' || type === 'income') {
        return transaction;
      }
    });

    const transactions = await Promise.all(
      validTransactions.map(async validTransaction => {
        const { title, type, value, category } = validTransaction;
        const findOrCreateCategory = new FindOrCreateCategoryService();

        const categoryObject = await findOrCreateCategory.execute({
          category,
        });

        const transaction = {
          title,
          type,
          value,
          category_id: categoryObject.id,
        } as Transaction;

        return transaction;
      }),
    );

    return transactions;
  }
}

export default ImportTransactionsService;
