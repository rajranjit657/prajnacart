import { Response } from 'express';
import { dbStore } from '../db/index.js';
import { AuthenticatedRequest } from '../middleware/auth.js';
import { Address } from '../types/index.js';

export const getAddresses = async (req: AuthenticatedRequest, res: Response) => {
  if (!req.user) {
    return res.status(401).json({ success: false, message: 'Not authenticated' });
  }

  const addresses = dbStore.addresses.filter(a => a.userId === req.user!.id);
  return res.json({ success: true, data: addresses });
};

export const addAddress = async (req: AuthenticatedRequest, res: Response) => {
  if (!req.user) {
    return res.status(401).json({ success: false, message: 'Not authenticated' });
  }

  const {
    fullName,
    phone,
    alternatePhone,
    addressLine1,
    addressLine2,
    landmark,
    city,
    state,
    postalCode,
    country = 'India',
    addressType = 'home',
    isDefault = false,
  } = req.body;

  if (!fullName || !phone || !addressLine1 || !city || !state || !postalCode) {
    return res.status(400).json({
      success: false,
      message: 'Full name, phone, address, city, state, and postal code are required.',
    });
  }

  const userId = req.user.id;
  const userAddresses = dbStore.addresses.filter(a => a.userId === userId);

  // If this is user's first address or marked default, unset previous defaults
  const shouldBeDefault = isDefault || userAddresses.length === 0;
  if (shouldBeDefault) {
    userAddresses.forEach(a => { a.isDefault = false; });
  }

  const newAddress: Address = {
    id: `addr_${Date.now()}_${Math.floor(Math.random() * 1000)}`,
    userId,
    fullName,
    phone,
    alternatePhone,
    addressLine1,
    addressLine2,
    landmark,
    city,
    state,
    postalCode,
    country,
    addressType,
    isDefault: shouldBeDefault,
    createdAt: new Date().toISOString(),
    updatedAt: new Date().toISOString(),
  };

  dbStore.addresses.push(newAddress);

  return res.status(201).json({
    success: true,
    message: 'Delivery address added successfully!',
    data: newAddress,
  });
};

export const updateAddress = async (req: AuthenticatedRequest, res: Response) => {
  if (!req.user) {
    return res.status(401).json({ success: false, message: 'Not authenticated' });
  }

  const { id } = req.params;
  const address = dbStore.addresses.find(a => a.id === id && a.userId === req.user!.id);
  if (!address) {
    return res.status(404).json({ success: false, message: 'Address not found.' });
  }

  const fields = req.body;
  if (fields.isDefault) {
    dbStore.addresses.filter(a => a.userId === req.user!.id).forEach(a => { a.isDefault = false; });
    address.isDefault = true;
  }

  if (fields.fullName) address.fullName = fields.fullName;
  if (fields.phone) address.phone = fields.phone;
  if (fields.alternatePhone !== undefined) address.alternatePhone = fields.alternatePhone;
  if (fields.addressLine1) address.addressLine1 = fields.addressLine1;
  if (fields.addressLine2 !== undefined) address.addressLine2 = fields.addressLine2;
  if (fields.landmark !== undefined) address.landmark = fields.landmark;
  if (fields.city) address.city = fields.city;
  if (fields.state) address.state = fields.state;
  if (fields.postalCode) address.postalCode = fields.postalCode;
  if (fields.addressType) address.addressType = fields.addressType;
  address.updatedAt = new Date().toISOString();

  return res.json({
    success: true,
    message: 'Address updated successfully!',
    data: address,
  });
};

export const deleteAddress = async (req: AuthenticatedRequest, res: Response) => {
  if (!req.user) {
    return res.status(401).json({ success: false, message: 'Not authenticated' });
  }

  const { id } = req.params;
  const index = dbStore.addresses.findIndex(a => a.id === id && a.userId === req.user!.id);
  if (index === -1) {
    return res.status(404).json({ success: false, message: 'Address not found.' });
  }

  const wasDefault = dbStore.addresses[index].isDefault;
  dbStore.addresses.splice(index, 1);

  // If deleted was default, make the first remaining address default
  if (wasDefault) {
    const remaining = dbStore.addresses.filter(a => a.userId === req.user!.id);
    if (remaining.length > 0) {
      remaining[0].isDefault = true;
    }
  }

  return res.json({
    success: true,
    message: 'Address deleted successfully.',
  });
};

export const setDefaultAddress = async (req: AuthenticatedRequest, res: Response) => {
  if (!req.user) {
    return res.status(401).json({ success: false, message: 'Not authenticated' });
  }

  const { id } = req.params;
  const userAddresses = dbStore.addresses.filter(a => a.userId === req.user!.id);
  const target = userAddresses.find(a => a.id === id);

  if (!target) {
    return res.status(404).json({ success: false, message: 'Address not found.' });
  }

  userAddresses.forEach(a => { a.isDefault = false; });
  target.isDefault = true;
  target.updatedAt = new Date().toISOString();

  return res.json({
    success: true,
    message: 'Default delivery address updated.',
    data: target,
  });
};
