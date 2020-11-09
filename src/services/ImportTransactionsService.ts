import fs from 'fs';

import Transaction from '../models/Transaction';
import CreateTransactionService from './CreateTransactionService';

class ImportTransactionsService {
  async execute(csvFilePath: string): Promise<Transaction[]> {
    const fileText = fs.readFileSync(csvFilePath, 'utf-8');

    await fs.promises.unlink(csvFilePath);

    const [titles, ...rows] = fileText.split('\n');

    const transactionKeys = titles.split(', ');

    const objectTransactions = rows.map(row => {
      const transactionValues = row.split(', ');
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      return transactionKeys.reduce((transaction: any, currentKey, index) => {
        // eslint-disable-next-line no-param-reassign
        transaction[currentKey] = transactionValues[index];

        return transaction;
      }, {});
    });

    // eslint-disable-next-line consistent-return
    const validTransactions = objectTransactions.filter(transaction => {
      const { type, title, value } = transaction;
      if (title && value && (type === 'income' || type === 'outcome')) {
        return transaction;
      }
    });

    const totalCsvBalance = validTransactions.reduce(
      (total: number, { type, value }: Transaction) => {
        switch (type) {
          case 'income':
            // eslint-disable-next-line no-param-reassign
            total += +value;
            break;

          case 'outcome':
            // eslint-disable-next-line no-param-reassign
            total -= +value;
            break;

          default:
            break;
        }
        return total;
      },
      0,
    );

    const transactions = await Promise.all(
      validTransactions.map(async validTransaction => {
        const createTransaction = new CreateTransactionService();

        const transaction = await createTransaction.execute(
          validTransaction,
          totalCsvBalance,
        );

        return transaction;
      }),
    );

    return transactions;
  }
}

export default ImportTransactionsService;
