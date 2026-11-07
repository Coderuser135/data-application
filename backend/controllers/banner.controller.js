import cloudinary from '../config/cloudinary.config.js';
import Banner from '../models/banner.model.js';
import { ApiError } from '../utils/errors.utils.js';

const validSections = ['gym', 'store'];
const getSection = (value) => {
  if (!validSections.includes(value)) throw new ApiError(400, 'Invalid banner section');
  return value;
};

function uploadBannerImage(buffer) {
  return new Promise((resolve, reject) => {
    const stream = cloudinary.uploader.upload_stream({
      folder: 'heaven-gym/banners',
      resource_type: 'image',
      transformation: [{ width: 1920, height: 900, crop: 'limit', quality: 'auto', fetch_format: 'auto' }],
    }, (error, result) => error ? reject(error) : resolve(result));
    stream.end(buffer);
  });
}

const removeCloudImage = async (publicId) => {
  if (publicId) await cloudinary.uploader.destroy(publicId, { resource_type: 'image' }).catch(() => {});
};

export const getActiveBanners = async (req, res, next) => {
  try {
    const section = getSection(req.params.section);
    const banners = await Banner.find({ section, is_active: true })
      .select('section image_url is_active')
      .sort({ createdAt: -1 })
      .lean();
    res.json(banners);
  } catch (error) { next(error); }
};

export const getAdminBanners = async (req, res, next) => {
  try {
    const section = getSection(req.params.section);
    const banners = await Banner.find({ section }).sort({ createdAt: -1 }).lean();
    res.json(banners);
  } catch (error) { next(error); }
};

export const createBanner = async (req, res, next) => {
  let uploaded;
  try {
    const section = getSection(req.body.section);
    if (!req.file) throw new ApiError(400, 'Please upload a banner image');
    uploaded = await uploadBannerImage(req.file.buffer);
    const banner = await Banner.create({
      section,
      image_url: uploaded.secure_url,
      image_public_id: uploaded.public_id,
      is_active: true,
    });
    res.status(201).json(banner);
  } catch (error) {
    await removeCloudImage(uploaded?.public_id);
    next(error);
  }
};

export const updateBanner = async (req, res, next) => {
  let uploaded;
  try {
    const banner = await Banner.findById(req.params.id);
    if (!banner) throw new ApiError(404, 'Banner not found');
    const previousPublicId = banner.image_public_id;
    if (req.file) uploaded = await uploadBannerImage(req.file.buffer);
    if (uploaded) {
      banner.image_url = uploaded.secure_url;
      banner.image_public_id = uploaded.public_id;
    }
    if (typeof req.body.is_active !== 'undefined') {
      banner.is_active = req.body.is_active === true || req.body.is_active === 'true';
    }
    await banner.save();
    if (uploaded) await removeCloudImage(previousPublicId);
    res.json(banner);
  } catch (error) {
    await removeCloudImage(uploaded?.public_id);
    next(error);
  }
};

export const deleteBanner = async (req, res, next) => {
  try {
    const banner = await Banner.findById(req.params.id);
    if (!banner) throw new ApiError(404, 'Banner not found');
    const publicId = banner.image_public_id;
    await banner.deleteOne();
    await removeCloudImage(publicId);
    res.json({ message: 'Banner deleted' });
  } catch (error) { next(error); }
};
