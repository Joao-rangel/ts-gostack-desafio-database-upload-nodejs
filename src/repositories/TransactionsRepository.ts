import { EntityRepository, Repository } from 'typeorm';

import Transaction from '../models/Transaction';

interface Balance {
  income: number;
  outcome: number;
  total: number;
}

@EntityRepository(Transaction)
class TransactionsRepository extends Repository<Transaction> {
  public async getBalance(): Promise<Balance> {
    const transactions = await this.find();

    const { income, outcome } = transactions.reduce(
      (total: Omit<Balance, 'total'>, { type, value }: Transaction) => {
        switch (type) {
          case 'income':
            // eslint-disable-next-line no-param-reassign
            total.income += +value;
            break;

          case 'outcome':
            // eslint-disable-next-line no-param-reassign
            total.outcome += +value;
            break;

          default:
            break;
        }
        return total;
      },
      {
        income: 0,
        outcome: 0,
      },
    );

    const total = income - outcome;

    const balance = { income, outcome, total };

    return balance;
  }
}

export default TransactionsRepository;
