import { getRepository } from 'typeorm';
import Category from '../models/Category';

interface Request {
  category: string;
}

class CreateTransactionService {
  public async execute({ category }: Request): Promise<Category> {
    const categoryRepository = getRepository(Category);

    const categoryObject = await categoryRepository.findOne({
      where: { title: category },
    });

    if (!categoryObject) {
      const newCategoryObject = categoryRepository.create({ title: category });

      await categoryRepository.save(newCategoryObject);

      return newCategoryObject;
    }

    return categoryObject;
  }
}

export default CreateTransactionService;
