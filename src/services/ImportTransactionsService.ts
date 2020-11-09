import { getCustomRepository, getRepository, In } from 'typeorm';
import fs from 'fs';
import csvParse from 'csv-parse';

import Transaction from '../models/Transaction';
import Category from '../models/Category';
import TransactionsRepository from '../repositories/TransactionsRepository';

interface CsvTransaction {
  title: string;
  value: number;
  type: 'income' | 'outcome';
  category: string;
}

class ImportTransactionsService {
  async execute(csvFilePath: string): Promise<Transaction[]> {
    const categoriesRepository = getRepository(Category);
    const transactionsRepository = getCustomRepository(TransactionsRepository);

    const transactionsReadStream = fs.createReadStream(csvFilePath, {
      encoding: 'utf-8',
    });

    const parsers = csvParse({
      from_line: 2,
    });

    const parseCsv = transactionsReadStream.pipe(parsers);

    const transactions: CsvTransaction[] = [];
    const categories: string[] = [];

    parseCsv.on('data', async line => {
      const [title, type, value, category] = line.map((cell: string) =>
        cell.trim(),
      );

      if (!title || !value || (type !== 'income' && type !== 'outcome')) {
        return;
      }

      transactions.push({ title, type, value, category });

      categories.push(category);
    });

    await new Promise(resolve => parseCsv.on('end', resolve));

    const existentCategories = await categoriesRepository.find({
      where: {
        title: In(categories),
      },
    });

    const existentCategoryTitles = existentCategories.map(
      (category: Category) => category.title,
    );

    const newCategoryTitles = categories
      .filter(category => !existentCategoryTitles.includes(category))
      .filter((value, index, self) => self.indexOf(value) === index);

    const createdCategories = categoriesRepository.create(
      newCategoryTitles.map(title => ({ title })),
    );

    await categoriesRepository.save(createdCategories);

    const finalCategories = [...createdCategories, ...existentCategories];

    const createdTransactions = transactionsRepository.create(
      transactions.map(({ value, type, title, category }) => ({
        value,
        type,
        title,
        category: finalCategories.find(
          finalCategory => finalCategory.title === category,
        ),
      })),
    );

    await transactionsRepository.save(createdTransactions);

    await fs.promises.unlink(csvFilePath);

    return createdTransactions;
  }
}

export default ImportTransactionsService;
