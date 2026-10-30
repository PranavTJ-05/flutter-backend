import 'dotenv/config';
import mongoose from 'mongoose';
import BrandModel from './models/brand';
import CategoryModel from './models/category';
import ProductModel from './models/product';
import * as fs from 'fs';
import { join } from 'path';

const SAMPLE_IMAGES = [
  'https://images.unsplash.com/photo-1521572267360-ee0c2909d518?w=800&auto=format&fit=crop&q=60',
  'https://images.unsplash.com/photo-1503342217505-b0a15ec3261c?w=800&auto=format&fit=crop&q=60',
  'https://images.unsplash.com/photo-1515886657613-9f3515b0c78f?w=800&auto=format&fit=crop&q=60',
  'https://images.unsplash.com/photo-1529139574466-a303027c1d8b?w=800&auto=format&fit=crop&q=60',
  'https://images.unsplash.com/photo-1496747611176-843222e1e57c?w=800&auto=format&fit=crop&q=60',
  'https://images.unsplash.com/photo-1434389677669-e08b4cac3105?w=800&auto=format&fit=crop&q=60',
];

async function seed() {
  const mongoUri = process.env['MONGODB_URI'];
  if (!mongoUri) {
    console.error('Error: MONGODB_URI environment variable is required to run seed.');
    process.exit(1);
  }

  console.log('Connecting to MongoDB...');
  await mongoose.connect(mongoUri);
  console.log('Connected successfully.');

  const wwwJsDir = join(__dirname, '..', '..', 'www', 'js');
  const brandsRaw = JSON.parse(fs.readFileSync(join(wwwJsDir, 'DUMMY_BDATA.json'), 'utf-8'));
  const categoriesRaw = JSON.parse(fs.readFileSync(join(wwwJsDir, 'DUMMY_CDATA.json'), 'utf-8'));
  const productsRaw = JSON.parse(fs.readFileSync(join(wwwJsDir, 'DUMMY_DATA.json'), 'utf-8'));

  console.log('Clearing existing test products, categories, and brands...');
  await ProductModel.deleteMany({});
  await CategoryModel.deleteMany({});
  await BrandModel.deleteMany({});

  console.log(`Seeding ${brandsRaw.length} brands...`);
  const createdBrands = await BrandModel.insertMany(
    brandsRaw.map((b: any) => ({
      name: b.name,
      description: b.description || 'Brand description',
      logo: b.logo || 'https://via.placeholder.com/150',
      link: b.link || '',
    }))
  );

  console.log(`Seeding top-level categories...`);
  const flatCategories: any[] = [];
  categoriesRaw.forEach((cat: any, idx: number) => {
    let gender = 0; // BOTH
    const nameLower = cat.name.toLowerCase();
    if (nameLower.includes('women')) gender = 2;
    else if (nameLower.includes('men')) gender = 1;

    flatCategories.push({
      name: cat.name,
      description: cat.description || `${cat.name} collection`,
      gender: gender,
      imageURL: SAMPLE_IMAGES[idx % SAMPLE_IMAGES.length],
    });
  });

  const createdCategories = await CategoryModel.insertMany(flatCategories);

  console.log(`Seeding ${productsRaw.length} products...`);
  const productsToInsert = productsRaw.map((p: any, idx: number) => {
    let gender = 0;
    const titleLower = p.title.toLowerCase();
    if (titleLower.includes('women')) gender = 2;
    else if (titleLower.includes('men')) gender = 1;

    const brand = createdBrands[idx % createdBrands.length];
    const category = createdCategories[idx % createdCategories.length];
    const img1 = SAMPLE_IMAGES[idx % SAMPLE_IMAGES.length];
    const img2 = SAMPLE_IMAGES[(idx + 1) % SAMPLE_IMAGES.length];

    return {
      title: p.title,
      description: p.description,
      price: p.price,
      imagesURL: [img1, img2],
      colors: p.colors || [{ name: 'Default', hex: '#000000' }],
      sizes: p.sizes || ['S', 'M', 'L', 'XL'],
      brandName: brand.name,
      brand: brand._id,
      category: category._id,
      stock: 50,
      rate: Number((4 + Math.random() * 0.9).toFixed(1)),
      is_new: idx % 3 === 0,
      available: true,
      gender: gender,
      tags: ['fashion', 'trending'],
    };
  });

  await ProductModel.insertMany(productsToInsert);

  console.log('Seeding completed successfully!');
  console.log(`Summary:`);
  console.log(`- Brands: ${createdBrands.length}`);
  console.log(`- Categories: ${createdCategories.length}`);
  console.log(`- Products: ${productsToInsert.length}`);

  await mongoose.disconnect();
  console.log('Disconnected from MongoDB.');
}

seed().catch(err => {
  console.error('Seeding failed:', err);
  process.exit(1);
});
