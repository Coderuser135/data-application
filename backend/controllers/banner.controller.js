import cloudinary from '../config/cloudinary.config.js';
import Banner from '../models/banner.model.js';
import { ApiError } from '../utils/errors.utils.js';

const validSections = ['gym', 'store'];
const getSection = (value) => {
  if (!validSections.includes(value)) throw new ApiError(400, 'Invalid banner section');
  return value;
};
const parsePayload = (body) => {
  const title = String(body.title || '').trim();
  const description = String(body.description || '').trim();
  const button_text = String(body.button_text || '').trim();
  const button_link = String(body.button_link || '').trim();
  const sort_order = Number(body.sort_order ?? 0);
  const is_active = body.is_active === true || body.is_active === 'true';
  if (!title) throw new ApiError(400, 'Banner title is required');
  if (!Number.isInteger(sort_order) || sort_order < 0) throw new ApiError(400, 'Display order must be a non-negative whole number');
  if (button_link && !button_link.startsWith('/') && !/^https?:\/\//i.test(button_link)) {
    throw new ApiError(400, 'Button link must be an internal path or an HTTP(S) URL');
  }
  if (button_text && !button_link) throw new ApiError(400, 'Add a button link or remove the button text');
  return { title, description, button_text, button_link, sort_order, is_active };
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
      .select('section title description image_url button_text button_link sort_order')
      .sort({ sort_order: 1, createdAt: -1 })
      .lean();
    res.json(banners);
  } catch (error) { next(error); }
};

export const getAdminBanners = async (req, res, next) => {
  try {
    const section = getSection(req.params.section);
    const banners = await Banner.find({ section }).sort({ sort_order: 1, createdAt: -1 }).lean();
    res.json(banners);
  } catch (error) { next(error); }
};

export const createBanner = async (req, res, next) => {
  let uploaded;
  try {
    const section = getSection(req.body.section);
    if (!req.file) throw new ApiError(400, 'Please upload a banner image');
    const payload = parsePayload(req.body);
    uploaded = await uploadBannerImage(req.file.buffer);
    const banner = await Banner.create({
      ...payload, section, image_url: uploaded.secure_url, image_public_id: uploaded.public_id,
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
    const payload = parsePayload(req.body);
    const previousPublicId = banner.image_public_id;
    if (req.body.section && getSection(req.body.section) !== banner.section) {
      throw new ApiError(400, 'A banner cannot be moved to another section');
    }
    if (req.file) uploaded = await uploadBannerImage(req.file.buffer);
    Object.assign(banner, payload);
    if (uploaded) {
      banner.image_url = uploaded.secure_url;
      banner.image_public_id = uploaded.public_id;
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
