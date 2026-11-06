import cloudinary from '../config/cloudinary.config.js';

export function uploadToCloudinary(buffer, folderName = 'heaven-gym/supplements') {
  return new Promise((resolve, reject) => {
    const stream = cloudinary.uploader.upload_stream(
      { folder: folderName, resource_type: 'image', transformation: [{ width: 1200, height: 1200, crop: 'limit', quality: 'auto', fetch_format: 'auto' }] },
      (error, result) => error ? reject(error) : resolve(result),
    );
    stream.end(buffer);
  });
}

export async function deleteFromCloudinary(publicId) {
  if (!publicId) return null;
  return cloudinary.uploader.destroy(publicId, { resource_type: 'image' });
}
