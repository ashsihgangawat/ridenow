import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';
import { v4 as uuidv4 } from 'uuid';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
const DB_FILE = path.join(__dirname, '../../../database/ridenow_db.json');

// Initial default state
const initialData = {
  users: [],
  customerProfiles: [],
  driverProfiles: [],
  driverDocuments: [],
  vehicles: [],
  rides: [],
  fareConfigurations: [
    {
      id: 'fare-bike',
      category: 'BIKE',
      name: 'RideNow Moto / Bike',
      baseFare: 25.0,
      perKmRate: 8.0,
      waitingRateMin: 1.5,
      minimumFare: 35.0,
      surgeMultiplier: 1.0,
      isActive: true,
      updatedAt: new Date().toISOString()
    },
    {
      id: 'fare-auto',
      category: 'AUTO',
      name: 'RideNow Auto Rickshaw',
      baseFare: 35.0,
      perKmRate: 11.0,
      waitingRateMin: 1.8,
      minimumFare: 45.0,
      surgeMultiplier: 1.0,
      isActive: true,
      updatedAt: new Date().toISOString()
    },
    {
      id: 'fare-mini',
      category: 'MINI',
      name: 'RideNow Mini (Hatchback)',
      baseFare: 50.0,
      perKmRate: 14.0,
      waitingRateMin: 2.0,
      minimumFare: 70.0,
      surgeMultiplier: 1.0,
      isActive: true,
      updatedAt: new Date().toISOString()
    },
    {
      id: 'fare-sedan',
      category: 'SEDAN',
      name: 'RideNow Premier (Sedan)',
      baseFare: 75.0,
      perKmRate: 18.0,
      waitingRateMin: 2.5,
      minimumFare: 100.0,
      surgeMultiplier: 1.0,
      isActive: true,
      updatedAt: new Date().toISOString()
    },
    {
      id: 'fare-suv',
      category: 'SUV',
      name: 'RideNow XL (6-Seater SUV)',
      baseFare: 110.0,
      perKmRate: 23.0,
      waitingRateMin: 3.0,
      minimumFare: 150.0,
      surgeMultiplier: 1.0,
      isActive: true,
      updatedAt: new Date().toISOString()
    }
  ],
  payments: [],
  refunds: [],
  commissionRecords: [],
  promoCodes: [
    {
      id: 'promo-1',
      code: 'WELCOME50',
      description: 'Get 50% OFF up to ₹100 on your first 3 rides in India',
      discountPercent: 50.0,
      maxDiscount: 100.0,
      minRideAmount: 60.0,
      validUntil: '2028-12-31T23:59:59.000Z',
      maxUses: 5000,
      usedCount: 142,
      isActive: true,
      createdAt: new Date().toISOString()
    },
    {
      id: 'promo-2',
      code: 'RIDEINDIA',
      description: 'Flat ₹50 OFF on Sedan and SUV rides',
      discountPercent: 20.0,
      maxDiscount: 75.0,
      minRideAmount: 150.0,
      validUntil: '2028-12-31T23:59:59.000Z',
      maxUses: 10000,
      usedCount: 689,
      isActive: true,
      createdAt: new Date().toISOString()
    }
  ],
  reviews: [],
  complaints: [],
  notifications: [],
  adminProfiles: [],
  sessions: [],
  chatMessages: [],
  systemSettings: [
    {
      id: 'setting-1',
      key: 'PLATFORM_COMMISSION_PERCENT',
      value: '15',
      description: 'Default platform commission deducted from gross fare (15%)',
      updatedAt: new Date().toISOString()
    },
    {
      id: 'setting-2',
      key: 'EMERGENCY_SOS_NUMBER',
      value: '112',
      description: 'National Emergency Support helpline for passengers & drivers',
      updatedAt: new Date().toISOString()
    },
    {
      id: 'setting-3',
      key: 'GLOBAL_SURGE_ENABLED',
      value: 'false',
      description: 'Platform-wide rain / peak hour surge multiplier',
      updatedAt: new Date().toISOString()
    },
    {
      id: 'setting-4',
      key: 'MAINTENANCE_MODE',
      value: 'false',
      description: 'Put passenger booking in scheduled maintenance window',
      updatedAt: new Date().toISOString()
    }
  ],
  auditLogs: []
};

class DatabaseManager {
  constructor() {
    this.data = { ...initialData };
    this.load();
  }

  load() {
    try {
      if (fs.existsSync(DB_FILE)) {
        const raw = fs.readFileSync(DB_FILE, 'utf-8');
        const parsed = JSON.parse(raw);
        this.data = { ...initialData, ...parsed };
      } else {
        this.save();
      }
    } catch (e) {
      console.warn('[DB] Using memory state due to read error:', e.message);
    }
  }

  save() {
    try {
      const dir = path.dirname(DB_FILE);
      if (!fs.existsSync(dir)) {
        fs.mkdirSync(dir, { recursive: true });
      }
      fs.writeFileSync(DB_FILE, JSON.stringify(this.data, null, 2), 'utf-8');
    } catch (e) {
      console.error('[DB] Save error:', e.message);
    }
  }

  createCollection(name) {
    return {
      findMany: (query = {}) => {
        let list = [...(this.data[name] || [])];
        if (query.where) {
          list = list.filter(item => {
            return Object.entries(query.where).every(([key, val]) => {
              if (val === undefined) return true;
              return item[key] === val;
            });
          });
        }
        if (query.orderBy) {
          const [field, dir] = Object.entries(query.orderBy)[0] || ['createdAt', 'desc'];
          list.sort((a, b) => {
            const valA = a[field] || '';
            const valB = b[field] || '';
            if (dir === 'asc') return valA > valB ? 1 : -1;
            return valA < valB ? 1 : -1;
          });
        }
        if (query.take) {
          list = list.slice(0, query.take);
        }
        return list;
      },

      findUnique: (query = {}) => {
        if (!query.where) return null;
        const item = (this.data[name] || []).find(it => {
          return Object.entries(query.where).every(([k, v]) => it[k] === v);
        });
        return item ? { ...item } : null;
      },

      findFirst: (query = {}) => {
        const matches = this.createCollection(name).findMany(query);
        return matches.length > 0 ? matches[0] : null;
      },

      create: ({ data }) => {
        const record = {
          id: data.id || uuidv4(),
          createdAt: new Date().toISOString(),
          updatedAt: new Date().toISOString(),
          ...data
        };
        if (!this.data[name]) this.data[name] = [];
        this.data[name].push(record);
        this.save();
        return { ...record };
      },

      update: ({ where, data }) => {
        const index = (this.data[name] || []).findIndex(it => {
          return Object.entries(where).every(([k, v]) => it[k] === v);
        });
        if (index === -1) throw new Error(`Record not found in ${name}`);
        const updated = {
          ...this.data[name][index],
          ...data,
          updatedAt: new Date().toISOString()
        };
        this.data[name][index] = updated;
        this.save();
        return { ...updated };
      },

      delete: ({ where }) => {
        const initialLen = (this.data[name] || []).length;
        this.data[name] = (this.data[name] || []).filter(it => {
          return !Object.entries(where).every(([k, v]) => it[k] === v);
        });
        this.save();
        return { count: initialLen - this.data[name].length };
      },

      count: (query = {}) => {
        return this.createCollection(name).findMany(query).length;
      }
    };
  }
}

const dbManager = new DatabaseManager();

export const db = {
  users: dbManager.createCollection('users'),
  customerProfiles: dbManager.createCollection('customerProfiles'),
  riderProfiles: dbManager.createCollection('customerProfiles'),
  driverProfiles: dbManager.createCollection('driverProfiles'),
  driverDocuments: dbManager.createCollection('driverDocuments'),
  vehicles: dbManager.createCollection('vehicles'),
  rides: dbManager.createCollection('rides'),
  fareConfigurations: dbManager.createCollection('fareConfigurations'),
  payments: dbManager.createCollection('payments'),
  refunds: dbManager.createCollection('refunds'),
  commissionRecords: dbManager.createCollection('commissionRecords'),
  promoCodes: dbManager.createCollection('promoCodes'),
  reviews: dbManager.createCollection('reviews'),
  complaints: dbManager.createCollection('complaints'),
  notifications: dbManager.createCollection('notifications'),
  adminProfiles: dbManager.createCollection('adminProfiles'),
  sessions: dbManager.createCollection('sessions'),
  chatMessages: dbManager.createCollection('chatMessages'),
  systemSettings: dbManager.createCollection('systemSettings'),
  auditLogs: dbManager.createCollection('auditLogs'),
  raw: dbManager
};

