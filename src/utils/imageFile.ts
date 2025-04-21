import sharp from 'sharp';

export const imageFileBuffer = async (file: Buffer): Promise<Buffer> =>
  await sharp(file)
    .resize(800, 800, {
      fit: 'inside',
      withoutEnlargement: true,
    })
    .toBuffer();
