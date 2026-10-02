// Kiểu messages lấy từ bản tiếng Việt (bản gốc). tests/unit/messages.test.ts bảo đảm bản EN có đúng cùng bộ khóa.
import type about from '../messages/vi/about.json';
import type common from '../messages/vi/common.json';
import type contact from '../messages/vi/contact.json';
import type errors from '../messages/vi/errors.json';
import type film from '../messages/vi/film.json';
import type home from '../messages/vi/home.json';
import type knowledge from '../messages/vi/knowledge.json';
import type legal from '../messages/vi/legal.json';
import type network from '../messages/vi/network.json';
import type partners from '../messages/vi/partners.json';
import type pricing from '../messages/vi/pricing.json';
import type services from '../messages/vi/services.json';
import type solutions from '../messages/vi/solutions.json';
import type support from '../messages/vi/support.json';

export type AppMessages = {
  common: typeof common;
  home: typeof home;
  film: typeof film;
  solutions: typeof solutions;
  services: typeof services;
  pricing: typeof pricing;
  network: typeof network;
  partners: typeof partners;
  about: typeof about;
  knowledge: typeof knowledge;
  contact: typeof contact;
  support: typeof support;
  legal: typeof legal;
  errors: typeof errors;
};
