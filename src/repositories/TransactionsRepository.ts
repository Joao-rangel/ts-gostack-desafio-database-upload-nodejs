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
      (acumulator: Omit<Balance, 'total'>, { type, value }: Transaction) => {
        switch (type) {
          case 'income':
            // eslint-disable-next-line no-param-reassign
            acumulator.income += Number(value);
            break;

          case 'outcome':
            // eslint-disable-next-line no-param-reassign
            acumulator.outcome += Number(value);
            break;

          default:
            break;
        }
        return acumulator;
      },
      {
        income: 0,
        outcome: 0,
      },
    );

    const total = income - outcome;

    return { income, outcome, total };
  }
}

export default TransactionsRepository;
