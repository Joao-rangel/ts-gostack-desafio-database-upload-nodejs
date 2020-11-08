import fs from 'fs';
import path from 'path';

import uploadConfig from '../config/upload';
import Transaction from '../models/Transaction';
import CreateTransactionService from './CreateTransactionService';

interface Request {
  csvFileName: string;
}

class ImportTransactionsService {
  async execute({ csvFileName }: Request): Promise<Transaction[]> {
    const csvFilePath = path.join(uploadConfig.directory, csvFileName);

    const fileText = fs.readFileSync(csvFilePath, 'utf-8');

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
      const { type } = transaction;
      if (type === 'outcome' || type === 'income') {
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
